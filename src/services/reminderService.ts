import { supabase } from '@/integrations/supabase/client';

export type ReminderCategory = 'Identity' | 'Financial' | 'Insurance' | 'Medical' | 'Legal' | 'Personal' | 'Business' | 'Tax';

export interface Reminder {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  reminder_date: string;
  category: ReminderCategory;
  urgency: 'low' | 'medium' | 'high';
  amount?: string;
  related_document_id?: string;
  is_completed: boolean;
  is_auto_generated: boolean;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export const reminderService = {
  // Get all reminders for the current user
  async getReminders() {
    const { data, error } = await supabase
      .from('reminders')
      .select(`
        *,
        documents:related_document_id(name, category)
      `)
      .order('reminder_date', { ascending: true });

    if (error) throw error;
    return data;
  },

  // Get upcoming reminders
  async getUpcomingReminders(days: number = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .gte('reminder_date', new Date().toISOString())
      .lte('reminder_date', futureDate.toISOString())
      .eq('is_completed', false)
      .order('reminder_date', { ascending: true });

    if (error) throw error;
    return data;
  },

  // Create new reminder
  async createReminder(reminder: Partial<Reminder>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await (supabase as any)
      .from('reminders')
      .insert({
        ...reminder,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update reminder
  async updateReminder(id: string, updates: Partial<Reminder>) {
    const { data, error } = await supabase
      .from('reminders')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Mark reminder as completed
  async completeReminder(id: string) {
    const { data, error } = await supabase
      .from('reminders')
      .update({
        is_completed: true,
        completed_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete reminder
  async deleteReminder(id: string) {
    const { error } = await supabase
      .from('reminders')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Get overdue reminders
  async getOverdueReminders() {
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .lt('reminder_date', new Date().toISOString())
      .eq('is_completed', false)
      .order('reminder_date', { ascending: true });

    if (error) throw error;
    return data;
  }
};