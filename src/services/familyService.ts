import { supabase } from '@/integrations/supabase/client';

export interface FamilyMember {
  id: string;
  family_vault_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member' | 'viewer' | 'emergency';
  status: 'active' | 'pending' | 'suspended';
  permissions: {
    can_upload: boolean;
    can_share: boolean;
    can_edit: boolean;
    can_delete: boolean;
    can_invite: boolean;
  };
  storage_used_mb: number;
  document_count: number;
  name?: string;
  avatar_url?: string;
  joined_at: string;
  last_active?: string;
  user_profiles?: {
    name?: string;
    email?: string;
    avatar_url?: string;
  };
}

export interface FamilyVault {
  id: string;
  owner_id: string;
  name: string;
  total_storage_mb: number;
  used_storage_mb: number;
  member_limit: number;
  created_at: string;
  updated_at: string;
}

export const familyService = {
  // Get current user's family vault
  async getFamilyVault() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('family_vaults')
      .select(`
        *,
        family_members(
          *,
          user_profiles(name, avatar_url)
        )
      `)
      .or(`owner_id.eq.${user.id},id.in.(select family_vault_id from family_members where user_id = '${user.id}')`)
      .single();

    if (error) throw error;
    return data;
  },

  // Get family members for the current user's vault
  async getFamilyMembers() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // First get the family vault
    const { data: vault } = await supabase
      .from('family_vaults')
      .select('id')
      .or(`owner_id.eq.${user.id},id.in.(select family_vault_id from family_members where user_id = '${user.id}')`)
      .single();

    if (!vault) return [];

    const { data, error } = await supabase
      .from('family_members')
      .select(`
        *,
        user_profiles(name, avatar_url, email)
      `)
      .eq('family_vault_id', vault.id)
      .order('joined_at', { ascending: true });

    if (error) throw error;
    
    // Transform data to match FamilyMember interface
    return data.map(member => ({
      ...member,
      name: member.user_profiles?.name || member.user_profiles?.email?.split('@')[0] || 'Unknown',
      avatar_url: member.user_profiles?.avatar_url
    }));
  },

  // Get family stats
  async getFamilyStats() {
    try {
      const vault = await this.getFamilyVault();
      const members = await this.getFamilyMembers();
      
      return {
        totalMembers: members.length,
        totalStorage: vault.total_storage_mb,
        usedStorage: vault.used_storage_mb,
        storagePercentage: Math.round((vault.used_storage_mb / vault.total_storage_mb) * 100),
        activeMembers: members.filter(m => m.status === 'active').length,
        pendingInvites: members.filter(m => m.status === 'pending').length,
      };
    } catch (error) {
      console.error('Failed to get family stats:', error);
      return {
        totalMembers: 0,
        totalStorage: 0,
        usedStorage: 0,
        storagePercentage: 0,
        activeMembers: 0,
        pendingInvites: 0,
      };
    }
  },

  // Invite family member
  async inviteFamilyMember(email: string, role: FamilyMember['role'] = 'member') {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // First get the family vault
    const { data: vault } = await supabase
      .from('family_vaults')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (!vault) throw new Error('No family vault found');

    // Create invitation
    const { data, error } = await supabase
      .from('family_invitations')
      .insert({
        family_vault_id: vault.id,
        invited_email: email,
        role,
        invited_by: user.id,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      })
      .select()
      .single();

    if (error) throw error;
    
    // TODO: Send invitation email via Edge Function
    
    return data;
  },

  // Update family member role
  async updateMemberRole(memberId: string, role: FamilyMember['role']) {
    const { data, error } = await supabase
      .from('family_members')
      .update({ role })
      .eq('id', memberId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Remove family member
  async removeFamilyMember(memberId: string) {
    const { error } = await supabase
      .from('family_members')
      .delete()
      .eq('id', memberId);

    if (error) throw error;
  },

  // Get family document activity
  async getFamilyActivity(limit: number = 10) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: vault } = await supabase
      .from('family_vaults')
      .select('id')
      .or(`owner_id.eq.${user.id},id.in.(select family_vault_id from family_members where user_id = '${user.id}')`)
      .single();

    if (!vault) return [];

    const { data, error } = await supabase
      .from('family_activities')
      .select(`
        *,
        user_profiles(name, avatar_url),
        documents(name, category)
      `)
      .eq('family_vault_id', vault.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }
};
