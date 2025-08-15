import { supabase } from '@/integrations/supabase/client';

export interface Integration {
  id: string;
  service: string;
  access_token?: string;
  refresh_token?: string;
  is_active: boolean;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export const integrationService = {
  // Get all user integrations
  async getIntegrations() {
    const { data, error } = await supabase
      .from('integrations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Connect new integration
  async connectIntegration(service: string, accessToken: string, refreshToken?: string, metadata?: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('integrations')
      .insert({
        user_id: user.id,
        service,
        access_token: accessToken,
        refresh_token: refreshToken,
        is_active: true,
        metadata: metadata || {}
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update integration
  async updateIntegration(id: string, updates: Partial<Integration>) {
    const { data, error } = await supabase
      .from('integrations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Disconnect integration
  async disconnectIntegration(id: string) {
    const { error } = await supabase
      .from('integrations')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  },

  // Check if service is connected
  async isServiceConnected(service: string) {
    const { data, error } = await supabase
      .from('integrations')
      .select('id')
      .eq('service', service)
      .eq('is_active', true)
      .single();

    return !error && data;
  },

  // Sync integration data
  async syncIntegration(service: string) {
    const { data, error } = await supabase.functions.invoke(`${service}-integration`, {
      body: { action: 'sync' }
    });

    if (error) throw error;
    return data;
  }
};