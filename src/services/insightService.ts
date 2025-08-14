import { supabase } from '@/integrations/supabase/client';

export interface AIInsight {
  id: string;
  user_id: string;
  insight_type: string;
  title: string;
  description?: string;
  related_document_ids?: string[];
  priority: 'low' | 'medium' | 'high';
  amount?: string;
  savings_potential?: string;
  action_required?: string;
  is_acknowledged: boolean;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export const insightService = {
  // Get all insights for the current user
  async getInsights() {
    const { data, error } = await supabase
      .from('ai_insights')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get insights by priority
  async getInsightsByPriority(priority: 'low' | 'medium' | 'high') {
    const { data, error } = await supabase
      .from('ai_insights')
      .select('*')
      .eq('priority', priority)
      .eq('is_acknowledged', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get insights by type
  async getInsightsByType(type: string) {
    const { data, error } = await supabase
      .from('ai_insights')
      .select('*')
      .eq('insight_type', type)
      .eq('is_acknowledged', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Create new insight
  async createInsight(insight: Partial<AIInsight>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await (supabase as any)
      .from('ai_insights')
      .insert({
        ...insight,
        user_id: user.id,
        insight_type: insight.insight_type || 'general'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Acknowledge insight
  async acknowledgeInsight(id: string) {
    const { data, error } = await supabase
      .from('ai_insights')
      .update({ is_acknowledged: true })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete insight
  async deleteInsight(id: string) {
    const { error } = await supabase
      .from('ai_insights')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Get unacknowledged insights count
  async getUnacknowledgedCount() {
    const { count, error } = await supabase
      .from('ai_insights')
      .select('*', { count: 'exact', head: true })
      .eq('is_acknowledged', false);

    if (error) throw error;
    return count || 0;
  },

  // Generate mock insights for demo
  async generateMockInsights() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const mockInsights = [
      {
        user_id: user.id,
        insight_type: 'risk',
        title: 'Health Insurance Expiring Soon',
        description: 'Your health insurance policy expires in 15 days. Renew now to avoid coverage gaps.',
        priority: 'high' as const,
        amount: '₹12,500',
        savings_potential: '₹2,500 early bird discount',
        action_required: 'Renew insurance policy'
      },
      {
        user_id: user.id,
        insight_type: 'opportunity',
        title: 'Tax Deductions Available',
        description: 'AI found 5 potential tax deductions worth ₹67,000 in your documents.',
        priority: 'medium' as const,
        savings_potential: '₹18,900 tax savings',
        action_required: 'Review deductions with CA'
      },
      {
        user_id: user.id,
        insight_type: 'duplicate',
        title: 'Duplicate Documents Detected',
        description: '3 duplicate Aadhaar copies found. Merge to free up storage space.',
        priority: 'low' as const,
        savings_potential: '1.2 MB storage',
        action_required: 'Merge duplicate files'
      }
    ];

    const { data, error } = await (supabase as any)
      .from('ai_insights')
      .insert(mockInsights)
      .select();

    if (error) throw error;
    return data;
  }
};