import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FamilyVaultRequest {
  action: 'create' | 'invite' | 'join' | 'update_permissions' | 'remove_member' | 'get_vault' | 'list_members';
  vaultId?: string;
  vaultData?: {
    name: string;
    description?: string;
    member_limit?: number;
    emergency_access_enabled?: boolean;
  };
  memberData?: {
    email?: string;
    role?: 'owner' | 'admin' | 'member' | 'viewer' | 'emergency';
    permissions?: any;
  };
  memberId?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabaseClient.auth.getUser(token)

    if (!user) {
      throw new Error('Unauthorized')
    }

    const { data: userProfile } = await supabaseClient
      .from('users')
      .select('*')
      .eq('auth_user_id', user.id)
      .single()

    if (!userProfile) {
      throw new Error('User profile not found')
    }

    const { action, vaultId, vaultData, memberData, memberId }: FamilyVaultRequest = await req.json()

    let result: any = {}

    switch (action) {
      case 'create':
        if (!vaultData) {
          throw new Error('Vault data required for create action')
        }

        // Check if user already has a family vault (free tier limitation)
        if (userProfile.subscription_tier === 'free') {
          const { data: existingVaults } = await supabaseClient
            .from('family_vaults')
            .select('id')
            .eq('owner_id', userProfile.id)

          if (existingVaults && existingVaults.length > 0) {
            return new Response(
              JSON.stringify({
                success: false,
                error: 'Free tier allows only one family vault',
                upgrade_required: true
              }),
              {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 403,
              }
            )
          }
        }

        const { data: newVault, error: createError } = await supabaseClient
          .from('family_vaults')
          .insert({
            ...vaultData,
            owner_id: userProfile.id,
            storage_limit: getStorageLimitForTier(userProfile.subscription_tier)
          })
          .select()
          .single()

        if (createError) throw createError

        // Add owner as admin member
        await supabaseClient
          .from('family_members')
          .insert({
            vault_id: newVault.id,
            user_id: userProfile.id,
            role: 'owner',
            status: 'active',
            permissions: {
              can_view: true,
              can_upload: true,
              can_edit: true,
              can_delete: true,
              can_share: true,
              can_invite: true
            },
            joined_at: new Date().toISOString()
          })

        result = { vault: newVault }
        break

      case 'invite':
        if (!vaultId || !memberData?.email) {
          throw new Error('Vault ID and member email required')
        }

        // Check if user has permission to invite
        const { data: membership } = await supabaseClient
          .from('family_members')
          .select('role, permissions')
          .eq('vault_id', vaultId)
          .eq('user_id', userProfile.id)
          .eq('status', 'active')
          .single()

        if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
          throw new Error('Insufficient permissions to invite members')
        }

        // Generate invitation token
        const invitationToken = crypto.randomUUID()
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiry

        const { data: invitation, error: inviteError } = await supabaseClient
          .from('family_members')
          .insert({
            vault_id: vaultId,
            email: memberData.email,
            role: memberData.role || 'member',
            permissions: memberData.permissions || {
              can_view: true,
              can_upload: false,
              can_edit: false,
              can_delete: false,
              can_share: false
            },
            invitation_token: invitationToken,
            invitation_expires_at: expiresAt.toISOString(),
            invited_by: userProfile.id,
            status: 'pending'
          })
          .select()
          .single()

        if (inviteError) throw inviteError

        // In production, send invitation email
        await sendInvitationEmail(memberData.email, invitationToken, vaultId)

        result = { invitation }
        break

      case 'join':
        const invitationToken = req.url.split('token=')[1]
        if (!invitationToken) {
          throw new Error('Invitation token required')
        }

        const { data: invitation, error: invitationError } = await supabaseClient
          .from('family_members')
          .select('*')
          .eq('invitation_token', invitationToken)
          .eq('status', 'pending')
          .gt('invitation_expires_at', new Date().toISOString())
          .single()

        if (invitationError || !invitation) {
          throw new Error('Invalid or expired invitation')
        }

        // Update invitation with user ID
        const { data: joinedMember, error: joinError } = await supabaseClient
          .from('family_members')
          .update({
            user_id: userProfile.id,
            status: 'active',
            joined_at: new Date().toISOString(),
            invitation_token: null
          })
          .eq('id', invitation.id)
          .select()
          .single()

        if (joinError) throw joinError

        result = { member: joinedMember }
        break

      case 'get_vault':
        if (!vaultId) {
          throw new Error('Vault ID required')
        }

        const { data: vault, error: vaultError } = await supabaseClient
          .from('family_vaults')
          .select(`
            *,
            family_members(
              id, user_id, email, role, permissions, status, joined_at,
              users(full_name, display_name, avatar_url)
            )
          `)
          .eq('id', vaultId)
          .single()

        if (vaultError) throw vaultError

        // Check if user has access to this vault
        const hasAccess = vault.family_members.some((member: any) => 
          member.user_id === userProfile.id && member.status === 'active'
        )

        if (!hasAccess) {
          throw new Error('Access denied to this family vault')
        }

        result = { vault }
        break

      case 'list_members':
        if (!vaultId) {
          throw new Error('Vault ID required')
        }

        const { data: members, error: membersError } = await supabaseClient
          .from('family_members')
          .select(`
            *,
            users(full_name, display_name, avatar_url, email)
          `)
          .eq('vault_id', vaultId)

        if (membersError) throw membersError
        result = { members }
        break

      case 'update_permissions':
        if (!memberId || !memberData?.permissions) {
          throw new Error('Member ID and permissions required')
        }

        // Check if user has admin permissions
        const { data: adminCheck } = await supabaseClient
          .from('family_members')
          .select('role')
          .eq('vault_id', vaultId)
          .eq('user_id', userProfile.id)
          .eq('status', 'active')
          .single()

        if (!adminCheck || (adminCheck.role !== 'owner' && adminCheck.role !== 'admin')) {
          throw new Error('Insufficient permissions to update member permissions')
        }

        const { data: updatedMember, error: permError } = await supabaseClient
          .from('family_members')
          .update({
            permissions: memberData.permissions,
            role: memberData.role
          })
          .eq('id', memberId)
          .select()
          .single()

        if (permError) throw permError
        result = { member: updatedMember }
        break

      case 'remove_member':
        if (!memberId) {
          throw new Error('Member ID required')
        }

        const { error: removeError } = await supabaseClient
          .from('family_members')
          .delete()
          .eq('id', memberId)
          .eq('vault_id', vaultId)

        if (removeError) throw removeError
        result = { success: true }
        break

      default:
        throw new Error('Invalid action')
    }

    // Log activity
    await supabaseClient
      .from('audit_logs')
      .insert({
        user_id: userProfile.id,
        action: `family_vault_${action}`,
        resource_type: 'family_vault',
        resource_id: vaultId || 'new',
        new_values: { action, ...memberData, ...vaultData }
      })

    return new Response(
      JSON.stringify({
        success: true,
        data: result
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Family vault processing error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

function getStorageLimitForTier(tier: string): number {
  switch (tier) {
    case 'free': return 1073741824 // 1GB
    case 'premium': return 53687091200 // 50GB
    case 'family_plus': return 214748364800 // 200GB
    case 'business': return 1099511627776 // 1TB
    default: return 1073741824
  }
}

async function sendInvitationEmail(email: string, token: string, vaultId: string) {
  // In production, integrate with email service like SendGrid, Resend, or AWS SES
  console.log(`Sending invitation email to ${email} with token ${token} for vault ${vaultId}`)
  
  // Mock email sending
  const invitationUrl = `${Deno.env.get('FRONTEND_URL')}/family/join?token=${token}`
  console.log(`Invitation URL: ${invitationUrl}`)
}