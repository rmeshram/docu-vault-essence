import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ReminderRequest {
  action: 'create' | 'list' | 'update' | 'delete' | 'check_due' | 'auto_generate';
  reminderId?: string;
  reminderData?: {
    title: string;
    description?: string;
    reminder_date: string;
    category?: string;
    urgency?: 'low' | 'medium' | 'high';
    document_id?: string;
    amount?: string;
    auto_generation_rule?: any;
    recurrence_pattern?: any;
    notification_settings?: any;
  };
  documentId?: string;
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

    const { action, reminderId, reminderData, documentId }: ReminderRequest = await req.json()

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

      case 'auto_generate':
        if (!documentId) {
          throw new Error('Document ID required for auto-generation')
        }
        
        const generatedReminders = await generateSmartReminders(supabaseClient, userProfile.id, documentId)
        result = { generated_reminders: generatedReminders }
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

async function generateSmartReminders(supabaseClient: any, userId: string, documentId: string) {
  try {
    const { data: document } = await supabaseClient
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single()

    if (!document) return []

    const reminders = []
    const keyInfo = document.metadata?.key_info || {}

    // Generate reminders based on document type and content
    if (document.category === 'Insurance') {
      // Insurance renewal reminders
      if (keyInfo.dates && keyInfo.dates.length > 0) {
        const expiryDate = new Date(keyInfo.dates[keyInfo.dates.length - 1])
        if (expiryDate > new Date()) {
          const reminderDate = new Date(expiryDate)
          reminderDate.setDate(reminderDate.getDate() - 30)

          reminders.push({
            user_id: userId,
            document_id: documentId,
            title: 'Insurance Policy Renewal',
            description: `Your ${document.name} expires on ${expiryDate.toLocaleDateString()}`,
            reminder_type: 'renewal',
            reminder_date: reminderDate.toISOString(),
            category: 'Insurance',
            urgency: 'high',
            is_auto_generated: true,
            ai_suggested: true,
            ai_confidence: 90
          })
        }
      }
    }

    if (document.category === 'Tax') {
      // Tax filing reminders
      const currentYear = new Date().getFullYear()
      const taxDeadline = new Date(`${currentYear + 1}-07-31`) // July 31st deadline
      
      if (taxDeadline > new Date()) {
        const reminderDate = new Date(taxDeadline)
        reminderDate.setDate(reminderDate.getDate() - 60) // 2 months before

        reminders.push({
          user_id: userId,
          document_id: documentId,
          title: 'Tax Filing Reminder',
          description: `Prepare for tax filing deadline: ${taxDeadline.toLocaleDateString()}`,
          reminder_type: 'deadline',
          reminder_date: reminderDate.toISOString(),
          category: 'Tax',
          urgency: 'medium',
          is_auto_generated: true,
          ai_suggested: true,
          ai_confidence: 85
        })
      }
    }

    // Insert generated reminders
    if (reminders.length > 0) {
      const { data: insertedReminders, error } = await supabaseClient
        .from('reminders')
        .insert(reminders)
        .select()

      if (error) throw error
      return insertedReminders
    }

    return []
  } catch (error) {
    console.error('Failed to generate smart reminders:', error)
    return []
  }
}

async function scheduleNotification(supabaseClient: any, reminder: any) {
  try {
    await supabaseClient
      .from('notifications')
      .insert({
        user_id: reminder.user_id,
        type: 'reminder',
        title: reminder.title,
        message: reminder.description || reminder.title,
        scheduled_for: reminder.reminder_date,
        related_resource_type: 'reminder',
        related_resource_id: reminder.id,
        action_data: {
          reminder_id: reminder.id,
          document_id: reminder.document_id
        },
        priority: reminder.urgency === 'high' ? 8 : reminder.urgency === 'medium' ? 5 : 3
      })

    console.log(`Notification scheduled for reminder: ${reminder.title}`)
  } catch (error) {
    console.error('Failed to schedule notification:', error)
  }
}

async function sendReminderNotification(supabaseClient: any, userProfile: any, reminder: any) {
  try {
    // Check user notification preferences
    const notifPrefs = userProfile.notification_preferences || { push: true, email: true }
    
    if (!notifPrefs.push && !notifPrefs.email) {
      return
    }

    // Create notification record
    await supabaseClient
      .from('notifications')
      .insert({
        user_id: userProfile.id,
        type: 'reminder',
        title: reminder.title,
        message: reminder.description || reminder.title,
        delivery_channels: Object.keys(notifPrefs).filter(key => notifPrefs[key]),
        is_sent: true,
        sent_at: new Date().toISOString(),
        related_resource_type: 'reminder',
        related_resource_id: reminder.id,
        priority: reminder.urgency === 'high' ? 8 : 5
      })

    // Mark reminder notification as sent
    await supabaseClient
      .from('reminders')
      .update({ 
        notification_sent: true,
        notification_sent_at: new Date().toISOString()
      })
      .eq('id', reminder.id)

    console.log(`Reminder notification sent: ${reminder.title}`)
  } catch (error) {
    console.error('Failed to send reminder notification:', error)
  }
}