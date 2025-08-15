import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AnalyticsRequest {
  type: 'dashboard' | 'trends' | 'insights' | 'report';
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  category?: string;
  format?: 'json' | 'pdf' | 'csv';
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

    const { 
      type, 
      timeframe = 'monthly', 
      category,
      format = 'json' 
    }: AnalyticsRequest = await req.json()

    let analyticsData: any = {}

    switch (type) {
      case 'dashboard':
        analyticsData = await generateDashboardData(supabaseClient, userProfile.id, timeframe)
        break
      case 'trends':
        analyticsData = await generateTrendsData(supabaseClient, userProfile.id, timeframe, category)
        break
      case 'insights':
        analyticsData = await generateInsightsData(supabaseClient, userProfile.id)
        break
      case 'report':
        analyticsData = await generateReportData(supabaseClient, userProfile.id, timeframe, format)
        break
      default:
        throw new Error('Invalid analytics type')
    }

    // Log analytics access
    await supabaseClient
      .from('audit_logs')
      .insert({
        user_id: userProfile.id,
        action: 'analytics_accessed',
        resource_type: 'analytics',
        resource_id: type,
        new_values: {
          type,
          timeframe,
          category,
          format
        }
      })

    return new Response(
      JSON.stringify({
        success: true,
        data: analyticsData
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Analytics processing error:', error)
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

async function generateDashboardData(supabaseClient: any, userId: string, timeframe: string) {
  const now = new Date()
  let startDate = new Date()
  
  switch (timeframe) {
    case 'daily':
      startDate.setDate(now.getDate() - 1)
      break
    case 'weekly':
      startDate.setDate(now.getDate() - 7)
      break
    case 'monthly':
      startDate.setMonth(now.getMonth() - 1)
      break
    case 'yearly':
      startDate.setFullYear(now.getFullYear() - 1)
      break
  }

  // Get document statistics
  const { data: docStats } = await supabaseClient
    .from('documents')
    .select('category, file_size, created_at')
    .eq('user_id', userId)
    .gte('created_at', startDate.toISOString())

  // Get reminder statistics
  const { data: reminderStats } = await supabaseClient
    .from('reminders')
    .select('urgency, is_completed, reminder_date')
    .eq('user_id', userId)
    .gte('created_at', startDate.toISOString())

  // Get AI usage statistics
  const { data: aiStats } = await supabaseClient
    .from('analytics_data')
    .select('metric_value, metric_data')
    .eq('user_id', userId)
    .eq('metric_type', 'ai_chat_usage')
    .gte('date_recorded', startDate.toISOString().split('T')[0])

  // Calculate insights
  const totalDocuments = docStats?.length || 0
  const totalStorage = docStats?.reduce((sum, doc) => sum + doc.file_size, 0) || 0
  const categoryBreakdown = docStats?.reduce((acc, doc) => {
    acc[doc.category] = (acc[doc.category] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  const upcomingReminders = reminderStats?.filter(r => 
    new Date(r.reminder_date) > now && !r.is_completed
  ).length || 0

  const completedReminders = reminderStats?.filter(r => r.is_completed).length || 0

  const aiQueriesUsed = aiStats?.reduce((sum, stat) => sum + stat.metric_value, 0) || 0

  return {
    overview: {
      total_documents: totalDocuments,
      total_storage_bytes: totalStorage,
      upcoming_reminders: upcomingReminders,
      completed_reminders: completedReminders,
      ai_queries_used: aiQueriesUsed
    },
    category_breakdown: categoryBreakdown,
    recent_activity: docStats?.slice(0, 10).map(doc => ({
      type: 'document_upload',
      name: doc.name || 'Unknown',
      category: doc.category,
      date: doc.created_at
    })) || [],
    storage_analysis: {
      used_bytes: totalStorage,
      by_category: docStats?.reduce((acc, doc) => {
        acc[doc.category] = (acc[doc.category] || 0) + doc.file_size
        return acc
      }, {} as Record<string, number>) || {}
    },
    timeframe,
    generated_at: new Date().toISOString()
  }
}

async function generateTrendsData(supabaseClient: any, userId: string, timeframe: string, category?: string) {
  const now = new Date()
  const periods = []
  
  // Generate time periods based on timeframe
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now)
    switch (timeframe) {
      case 'daily':
        date.setDate(date.getDate() - i)
        periods.push(date.toISOString().split('T')[0])
        break
      case 'weekly':
        date.setDate(date.getDate() - (i * 7))
        periods.push(date.toISOString().split('T')[0])
        break
      case 'monthly':
        date.setMonth(date.getMonth() - i)
        periods.push(date.toISOString().substring(0, 7))
        break
      case 'yearly':
        date.setFullYear(date.getFullYear() - i)
        periods.push(date.getFullYear().toString())
        break
    }
  }

  // Get analytics data for trends
  const { data: analyticsData } = await supabaseClient
    .from('analytics_data')
    .select('*')
    .eq('user_id', userId)
    .eq('time_period', timeframe)
    .gte('date_recorded', periods[0])

  // Process trends
  const trends = {
    document_uploads: periods.map(period => ({
      period,
      value: analyticsData?.filter(d => 
        d.metric_type === 'document_upload' && 
        d.date_recorded.startsWith(period) &&
        (!category || d.metric_data?.category === category)
      ).reduce((sum, d) => sum + d.metric_value, 0) || 0
    })),
    ai_usage: periods.map(period => ({
      period,
      value: analyticsData?.filter(d => 
        d.metric_type === 'ai_chat_usage' && 
        d.date_recorded.startsWith(period)
      ).reduce((sum, d) => sum + d.metric_value, 0) || 0
    })),
    storage_growth: periods.map(period => ({
      period,
      value: analyticsData?.filter(d => 
        d.metric_type === 'storage_usage' && 
        d.date_recorded.startsWith(period)
      ).reduce((sum, d) => sum + d.metric_value, 0) || 0
    }))
  }

  return {
    trends,
    timeframe,
    category,
    generated_at: new Date().toISOString()
  }
}

async function generateInsightsData(supabaseClient: any, userId: string) {
  // Get user's documents for analysis
  const { data: documents } = await supabaseClient
    .from('documents')
    .select('*')
    .eq('user_id', userId)

  // Get existing AI insights
  const { data: existingInsights } = await supabaseClient
    .from('ai_insights')
    .select('*')
    .eq('user_id', userId)
    .eq('is_acknowledged', false)

  const insights = []

  if (documents && documents.length > 0) {
    // Analyze document patterns
    const categoryCount = documents.reduce((acc, doc) => {
      acc[doc.category] = (acc[doc.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Storage insights
    const totalStorage = documents.reduce((sum, doc) => sum + doc.file_size, 0)
    const avgFileSize = totalStorage / documents.length

    // Find large files
    const largeFiles = documents.filter(doc => doc.file_size > avgFileSize * 2)
    if (largeFiles.length > 0) {
      insights.push({
        type: 'storage_optimization',
        title: 'Large Files Detected',
        description: `Found ${largeFiles.length} files larger than average. Consider compressing or archiving.`,
        priority: 'low',
        savings_potential: `${Math.round(largeFiles.reduce((sum, f) => sum + f.file_size, 0) / 1024 / 1024)}MB potential savings`
      })
    }

    // Missing document categories
    const expectedCategories = ['Identity', 'Financial', 'Insurance', 'Medical']
    const missingCategories = expectedCategories.filter(cat => !categoryCount[cat])
    
    if (missingCategories.length > 0) {
      insights.push({
        type: 'document_completeness',
        title: 'Missing Important Documents',
        description: `Consider uploading ${missingCategories.join(', ')} documents for complete protection.`,
        priority: 'medium',
        action_required: 'Upload missing document categories'
      })
    }

    // Expiring documents (mock analysis)
    const insuranceDocs = documents.filter(doc => doc.category === 'Insurance')
    if (insuranceDocs.length > 0) {
      insights.push({
        type: 'expiry_alert',
        title: 'Insurance Review Recommended',
        description: 'AI suggests reviewing your insurance policies for potential savings and coverage gaps.',
        priority: 'medium',
        savings_potential: '₹15,000 potential annual savings',
        action_required: 'Schedule insurance review'
      })
    }
  }

  return {
    insights: [...(existingInsights || []), ...insights],
    summary: {
      total_insights: insights.length + (existingInsights?.length || 0),
      high_priority: insights.filter(i => i.priority === 'high').length,
      potential_savings: insights.filter(i => i.savings_potential).length
    },
    generated_at: new Date().toISOString()
  }
}

async function generateReportData(supabaseClient: any, userId: string, timeframe: string, format: string) {
  const dashboardData = await generateDashboardData(supabaseClient, userId, timeframe)
  const trendsData = await generateTrendsData(supabaseClient, userId, timeframe)
  const insightsData = await generateInsightsData(supabaseClient, userId)

  const reportData = {
    user_id: userId,
    timeframe,
    summary: dashboardData.overview,
    trends: trendsData.trends,
    insights: insightsData.insights,
    recommendations: [
      'Upload missing identity documents for complete verification',
      'Set up automatic reminders for insurance renewals',
      'Enable family sharing for important documents',
      'Consider upgrading storage for better organization'
    ],
    generated_at: new Date().toISOString()
  }

  if (format === 'pdf') {
    // In production, generate PDF using a library like Puppeteer
    return {
      ...reportData,
      download_url: 'https://example.com/report.pdf',
      format: 'pdf'
    }
  }

  if (format === 'csv') {
    // In production, convert data to CSV format
    return {
      ...reportData,
      csv_data: 'category,count,size\nIdentity,5,2MB\nFinancial,10,5MB',
      format: 'csv'
    }
  }

  return reportData
}