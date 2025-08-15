import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ReminderRequest {
  action: 'create' | 'list' | 'update' | 'delete' | 'check_due';
  reminderId?: string;
  reminderData?: {
    title: string;
    description?: string;
    reminder_date: string;
    category?: string;
    urgency?: 'low' | 'medium' | 'high' | 'critical';
    document_id?: string;
    amount?: string;
    auto_generation_rule?: any;
  };
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

    const { action, reminderId, reminderData }: ReminderRequest = await req.json()

    let result: any = {}

    switch (action) {
      case 'create':
        if (!reminderData) {
          throw new Error('Reminder data required for create action')
        }
        
        const { data: newReminder, error: createError } = await supabaseClient
          .from('reminders')
          .insert({
            ...reminderData,
            user_id: userProfile.id
          })
          .select()
          .single()

        if (createError) throw createError
        
        result = { reminder: newReminder }
        
        // Schedule notification if due soon
        const reminderDate = new Date(reminderData.reminder_date)
        const now = new Date()
        const timeDiff = reminderDate.getTime() - now.getTime()
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24))
        
        if (daysDiff <= 7 && daysDiff > 0) {
          await scheduleNotification(supabaseClient, newReminder)
        }
        break

      case 'list':
        const { data: reminders, error: listError } = await supabaseClient
          .from('reminders')
          .select(`
            *,
            documents:document_id(name, category)
          `)
          .eq('user_id', userProfile.id)
          .order('reminder_date', { ascending: true })

        if (listError) throw listError
        result = { reminders }
        break

      case 'update':
        if (!reminderId || !reminderData) {
          throw new Error('Reminder ID and data required for update action')
        }
        
        const { data: updatedReminder, error: updateError } = await supabaseClient
          .from('reminders')
          .update(reminderData)
          .eq('id', reminderId)
          .eq('user_id', userProfile.id)
          .select()
          .single()

        if (updateError) throw updateError
        result = { reminder: updatedReminder }
        break

      case 'delete':
        if (!reminderId) {
          throw new Error('Reminder ID required for delete action')
        }
        
        const { error: deleteError } = await supabaseClient
          .from('reminders')
          .delete()
          .eq('id', reminderId)
          .eq('user_id', userProfile.id)

        if (deleteError) throw deleteError
        result = { success: true }
        break

      case 'check_due':
        const { data: dueReminders, error: dueError } = await supabaseClient
          .from('reminders')
          .select('*')
          .eq('user_id', userProfile.id)
          .eq('is_completed', false)
          .lte('reminder_date', new Date().toISOString())

        if (dueError) throw dueError
        
        // Send notifications for due reminders
        for (const reminder of dueReminders || []) {
          await sendReminderNotification(supabaseClient, userProfile, reminder)
        }
        
        result = { 
          due_reminders: dueReminders,
          notifications_sent: dueReminders?.length || 0
        }
        break

      default:
        throw new Error('Invalid action')
    }

    // Log activity
    await supabaseClient
      .from('audit_logs')
      .insert({
        user_id: userProfile.id,
        action: `reminder_${action}`,
        resource_type: 'reminder',
        resource_id: reminderId,
        new_values: reminderData
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
    console.error('Reminder processing error:', error)
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

async function scheduleNotification(supabaseClient: any, reminder: any) {
  // In production, integrate with Firebase Cloud Messaging or similar
  console.log(`Scheduling notification for reminder: ${reminder.title}`)
  
  // For now, just log the scheduled notification
  await supabaseClient
    .from('audit_logs')
    .insert({
      user_id: reminder.user_id,
      action: 'notification_scheduled',
      resource_type: 'reminder',
      resource_id: reminder.id,
      new_values: {
        reminder_date: reminder.reminder_date,
        notification_type: 'push'
      }
    })
}

async function sendReminderNotification(supabaseClient: any, userProfile: any, reminder: any) {
  // Get user notification preferences
  const { data: notifPrefs } = await supabaseClient
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userProfile.id)
    .single()

  if (!notifPrefs?.reminder_notifications) {
    return
  }

  // In production, send actual notifications via Firebase, email, SMS
  console.log(`Sending reminder notification: ${reminder.title} to user ${userProfile.id}`)
  
  // Mark notification as sent
  await supabaseClient
    .from('reminders')
    .update({ notification_sent: true })
    .eq('id', reminder.id)

  // Log notification
  await supabaseClient
    .from('audit_logs')
    .insert({
      user_id: userProfile.id,
      action: 'notification_sent',
      resource_type: 'reminder',
      resource_id: reminder.id,
      new_values: {
        notification_type: 'reminder',
        title: reminder.title
      }
    })
}