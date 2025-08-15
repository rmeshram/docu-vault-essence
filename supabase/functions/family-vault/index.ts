import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FamilyVaultRequest {
  action: 'create' | 'invite' | 'join' | 'update_permissions' | 'remove_member' | 'get_vault' | 'list_members' | 'emergency_access';
  vaultId?: string;
  vaultData?: {
    name: string;
    description?: string;
    member_limit?: number;
    emergency_access_enabled?: boolean;
    encryption_level?: string;
  };
  memberData?: {
    email?: string;
    role?: 'owner' | 'admin' | 'member' | 'viewer' | 'emergency';
    permissions?: any;
    emergency_contact?: boolean;
  };
  memberId?: string;
  emergencyCode?: string;
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

    const { action, vaultId, vaultData, memberData, memberId, emergencyCode }: FamilyVaultRequest = await req.json()

    let result: any = {}

    switch (action) {
      case 'create':
        if (!vaultData) {
          throw new Error('Vault data required for create action')
        }

        // Check subscription limits
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

        const storageLimit = getStorageLimitForTier(userProfile.subscription_tier)
        
        const { data: newVault, error: createError } = await supabaseClient
          .from('family_vaults')
          .insert({
            ...vaultData,
            owner_id: userProfile.id,
            storage_limit: storageLimit,
            vault_settings: {
              created_by: userProfile.id,
              creation_date: new Date().toISOString(),
              encryption_level: vaultData.encryption_level || 'standard'
            }
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
              can_invite: true,
              can_manage_members: true,
              emergency_access: true
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

        // Check member limits
        const { count: currentMembers } = await supabaseClient
          .from('family_members')
          .select('*', { count: 'exact', head: true })
          .eq('vault_id', vaultId)
          .eq('status', 'active')

        const { data: vault } = await supabaseClient
          .from('family_vaults')
          .select('member_limit')
          .eq('id', vaultId)
          .single()

        if ((currentMembers || 0) >= (vault?.member_limit || 5)) {
          throw new Error('Member limit reached for this vault')
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
            permissions: memberData.permissions || getDefaultPermissions(memberData.role || 'member'),
            emergency_contact: memberData.emergency_contact || false,
            invitation_token: invitationToken,
            invitation_expires_at: expiresAt.toISOString(),
            invited_by: userProfile.id,
            status: 'pending'
          })
          .select()
          .single()

        if (inviteError) throw inviteError

        // Send invitation notification
        await sendInvitationNotification(supabaseClient, memberData.email, invitationToken, vaultId)

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

      case 'emergency_access':
        if (!vaultId || !emergencyCode) {
          throw new Error('Vault ID and emergency code required')
        }

        // Verify emergency access
        const { data: emergencyMember } = await supabaseClient
          .from('family_members')
          .select('*')
          .eq('vault_id', vaultId)
          .eq('user_id', userProfile.id)
          .eq('emergency_contact', true)
          .eq('status', 'active')
          .single()

        if (!emergencyMember) {
          throw new Error('Emergency access not authorized')
        }

        // Log emergency access
        await supabaseClient
          .from('audit_logs')
          .insert({
            user_id: userProfile.id,
            action: 'emergency_access_used',
            resource_type: 'family_vault',
            resource_id: vaultId,
            risk_level: 'high',
            flagged_for_review: true,
            new_values: { emergency_code_used: true }
          })

        // Grant temporary elevated access
        result = { 
          emergency_access_granted: true,
          access_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        }
        break

      default:
        throw new Error('Invalid action')
    }

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
  const limits = {
    'free': 1073741824, // 1GB
    'premium': 53687091200, // 50GB
    'family_plus': 214748364800, // 200GB
    'business': 1099511627776 // 1TB
  }
  return limits[tier as keyof typeof limits] || 1073741824
}

function getDefaultPermissions(role: string) {
  const permissions = {
    'owner': {
      can_view: true,
      can_upload: true,
      can_edit: true,
      can_delete: true,
      can_share: true,
      can_invite: true,
      can_manage_members: true,
      emergency_access: true
    },
    'admin': {
      can_view: true,
      can_upload: true,
      can_edit: true,
      can_delete: true,
      can_share: true,
      can_invite: true,
      can_manage_members: true,
      emergency_access: false
    },
    'member': {
      can_view: true,
      can_upload: true,
      can_edit: false,
      can_delete: false,
      can_share: true,
      can_invite: false,
      can_manage_members: false,
      emergency_access: false
    },
    'viewer': {
      can_view: true,
      can_upload: false,
      can_edit: false,
      can_delete: false,
      can_share: false,
      can_invite: false,
      can_manage_members: false,
      emergency_access: false
    },
    'emergency': {
      can_view: true,
      can_upload: false,
      can_edit: false,
      can_delete: false,
      can_share: false,
      can_invite: false,
      can_manage_members: false,
      emergency_access: true
    }
  }
  
  return permissions[role as keyof typeof permissions] || permissions.viewer
}

async function sendInvitationNotification(supabaseClient: any, email: string, token: string, vaultId: string) {
  try {
    // In production, integrate with email service
    console.log(`Sending invitation email to ${email} for vault ${vaultId}`)
    
    const invitationUrl = `${Deno.env.get('FRONTEND_URL')}/family/join?token=${token}`
    
    // Create notification for the invited user (if they have an account)
    const { data: invitedUser } = await supabaseClient
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (invitedUser) {
      await supabaseClient
        .from('notifications')
        .insert({
          user_id: invitedUser.id,
          type: 'family_invite',
          title: 'Family Vault Invitation',
          message: 'You have been invited to join a family document vault',
          action_url: invitationUrl,
          action_data: { vault_id: vaultId, token: token }
        })
    }

    console.log(`Invitation URL: ${invitationUrl}`)
  } catch (error) {
    console.error('Failed to send invitation notification:', error)
  }
}