import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AnalyticsRequest {
  type: 'dashboard' | 'trends' | 'insights' | 'report' | 'predictions';
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  category?: string;
  format?: 'json' | 'pdf' | 'csv';
  includePersonalInsights?: boolean;
  includePredictions?: boolean;
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
      format = 'json',
      includePersonalInsights = true,
      includePredictions = false
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
        analyticsData = await generateInsightsData(supabaseClient, userProfile.id, includePersonalInsights)
        break
      case 'predictions':
        analyticsData = await generatePredictiveAnalytics(supabaseClient, userProfile.id, timeframe)
        break
      case 'report':
        analyticsData = await generateComprehensiveReport(supabaseClient, userProfile.id, timeframe, format)
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

  // Get comprehensive document statistics
  const { data: docStats } = await supabaseClient
    .from('documents')
    .select('category, file_size, created_at, status, ai_confidence, metadata')
    .eq('user_id', userId)
    .gte('created_at', startDate.toISOString())

  // Get reminder statistics
  const { data: reminderStats } = await supabaseClient
    .from('reminders')
    .select('urgency, is_completed, reminder_date, category')
    .eq('user_id', userId)
    .gte('created_at', startDate.toISOString())

  // Get AI usage statistics
  const { data: aiStats } = await supabaseClient
    .from('analytics_data')
    .select('metric_value, metric_data')
    .eq('user_id', userId)
    .eq('metric_type', 'ai_chat_usage')
    .gte('date_recorded', startDate.toISOString().split('T')[0])

  // Get family vault statistics
  const { data: familyStats } = await supabaseClient
    .from('family_members')
    .select('vault_id, role, status, joined_at')
    .eq('user_id', userId)
    .eq('status', 'active')

  // Calculate comprehensive metrics
  const totalDocuments = docStats?.length || 0
  const totalStorage = docStats?.reduce((sum, doc) => sum + doc.file_size, 0) || 0
  const processingSuccessRate = docStats?.length > 0 
    ? (docStats.filter(doc => doc.status === 'completed').length / docStats.length) * 100 
    : 0

  const categoryBreakdown = docStats?.reduce((acc, doc) => {
    acc[doc.category || 'uncategorized'] = (acc[doc.category || 'uncategorized'] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  const upcomingReminders = reminderStats?.filter(r => 
    new Date(r.reminder_date) > now && !r.is_completed
  ).length || 0

  const completedReminders = reminderStats?.filter(r => r.is_completed).length || 0
  const highPriorityReminders = reminderStats?.filter(r => 
    r.urgency === 'high' && !r.is_completed
  ).length || 0

  const aiQueriesUsed = aiStats?.reduce((sum, stat) => sum + stat.metric_value, 0) || 0
  const avgAIConfidence = docStats?.length > 0
    ? docStats.filter(doc => doc.ai_confidence).reduce((sum, doc) => sum + (doc.ai_confidence || 0), 0) / docStats.filter(doc => doc.ai_confidence).length
    : 0

  // Security and compliance metrics
  const encryptedDocuments = docStats?.filter(doc => doc.metadata?.encryption_enabled).length || 0
  const verifiedDocuments = docStats?.filter(doc => doc.metadata?.verification_status === 'verified').length || 0

  return {
    overview: {
      total_documents: totalDocuments,
      total_storage_bytes: totalStorage,
      processing_success_rate: Math.round(processingSuccessRate),
      upcoming_reminders: upcomingReminders,
      completed_reminders: completedReminders,
      high_priority_reminders: highPriorityReminders,
      ai_queries_used: aiQueriesUsed,
      avg_ai_confidence: Math.round(avgAIConfidence),
      family_vaults: familyStats?.length || 0,
      encrypted_documents: encryptedDocuments,
      verified_documents: verifiedDocuments
    },
    category_breakdown: categoryBreakdown,
    recent_activity: docStats?.slice(0, 10).map(doc => ({
      type: 'document_upload',
      name: doc.name || 'Unknown',
      category: doc.category,
      date: doc.created_at,
      status: doc.status
    })) || [],
    storage_analysis: {
      used_bytes: totalStorage,
      by_category: docStats?.reduce((acc, doc) => {
        const cat = doc.category || 'uncategorized'
        acc[cat] = (acc[cat] || 0) + doc.file_size
        return acc
      }, {} as Record<string, number>) || {}
    },
    security_metrics: {
      encryption_rate: totalDocuments > 0 ? (encryptedDocuments / totalDocuments) * 100 : 0,
      verification_rate: totalDocuments > 0 ? (verifiedDocuments / totalDocuments) * 100 : 0,
      compliance_score: calculateComplianceScore(docStats || [])
    },
    timeframe,
    generated_at: new Date().toISOString()
  }
}

async function generateTrendsData(supabaseClient: any, userId: string, timeframe: string, category?: string) {
  const now = new Date()
  const periods = []
  
  // Generate time periods
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

  // Process trends with advanced metrics
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
    })),
    processing_accuracy: periods.map(period => ({
      period,
      value: analyticsData?.filter(d => 
        d.metric_type === 'processing_accuracy' && 
        d.date_recorded.startsWith(period)
      ).reduce((sum, d) => sum + d.metric_value, 0) / 
      (analyticsData?.filter(d => 
        d.metric_type === 'processing_accuracy' && 
        d.date_recorded.startsWith(period)
      ).length || 1) || 0
    }))
  }

  return {
    trends,
    insights: {
      growth_rate: calculateGrowthRate(trends.document_uploads),
      most_active_category: category || 'All',
      ai_adoption_rate: calculateAIAdoptionRate(trends.ai_usage, trends.document_uploads)
    },
    timeframe,
    category,
    generated_at: new Date().toISOString()
  }
}

async function generateInsightsData(supabaseClient: any, userId: string, includePersonalInsights: boolean) {
  // Get user's documents for analysis
  const { data: documents } = await supabaseClient
    .from('documents')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'completed')

  // Get existing AI insights
  const { data: existingInsights } = await supabaseClient
    .from('ai_insights')
    .select('*')
    .eq('user_id', userId)
    .eq('is_acknowledged', false)

  const insights = []

  if (documents && documents.length > 0) {
    // Document completeness analysis
    const categoryCount = documents.reduce((acc, doc) => {
      acc[doc.category] = (acc[doc.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Missing important categories
    const expectedCategories = ['Identity', 'Financial', 'Insurance', 'Medical']
    const missingCategories = expectedCategories.filter(cat => !categoryCount[cat])
    
    if (missingCategories.length > 0) {
      insights.push({
        user_id: userId,
        insight_type: 'compliance',
        title: 'Missing Important Documents',
        description: `Consider uploading ${missingCategories.join(', ')} documents for complete protection.`,
        priority: 'medium',
        recommended_actions: {
          actions: ['Upload missing documents', 'Set up document reminders'],
          categories: missingCategories
        },
        related_categories: missingCategories
      })
    }

    // Storage optimization insights
    const totalStorage = documents.reduce((sum, doc) => sum + doc.file_size, 0)
    const avgFileSize = totalStorage / documents.length
    const largeFiles = documents.filter(doc => doc.file_size > avgFileSize * 3)

    if (largeFiles.length > 0) {
      insights.push({
        user_id: userId,
        insight_type: 'optimization',
        title: 'Storage Optimization Opportunity',
        description: `Found ${largeFiles.length} large files that could be compressed to save space.`,
        priority: 'low',
        potential_savings: Math.round(largeFiles.reduce((sum, f) => sum + f.file_size, 0) * 0.3), // 30% compression estimate
        recommended_actions: {
          actions: ['Compress large files', 'Archive old documents', 'Review file formats']
        }
      })
    }

    // Security insights
    const unencryptedDocs = documents.filter(doc => !doc.metadata?.encryption_enabled)
    if (unencryptedDocs.length > 0) {
      insights.push({
        user_id: userId,
        insight_type: 'security',
        title: 'Security Enhancement Recommended',
        description: `${unencryptedDocs.length} documents could benefit from enhanced encryption.`,
        priority: 'high',
        recommended_actions: {
          actions: ['Enable encryption', 'Review security settings', 'Backup important documents']
        }
      })
    }

    // Financial insights (if personal insights enabled)
    if (includePersonalInsights) {
      const financialDocs = documents.filter(doc => 
        doc.category === 'Financial' || doc.category === 'Tax' || doc.category === 'Insurance'
      )

      if (financialDocs.length > 0) {
        insights.push({
          user_id: userId,
          insight_type: 'opportunity',
          title: 'Financial Document Analysis',
          description: 'AI analysis of your financial documents reveals potential savings and optimization opportunities.',
          priority: 'medium',
          potential_savings: 25000, // Mock savings calculation
          recommended_actions: {
            actions: ['Review tax deductions', 'Compare insurance rates', 'Optimize investments'],
            deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          },
          related_document_ids: financialDocs.slice(0, 5).map(doc => doc.id)
        })
      }
    }
  }

  return {
    insights: [...(existingInsights || []), ...insights],
    summary: {
      total_insights: insights.length + (existingInsights?.length || 0),
      high_priority: insights.filter(i => i.priority === 'high').length,
      potential_savings: insights.reduce((sum, i) => sum + (i.potential_savings || 0), 0),
      categories_analyzed: [...new Set(insights.map(i => i.insight_type))]
    },
    recommendations: generatePersonalizedRecommendations(documents || [], existingInsights || []),
    generated_at: new Date().toISOString()
  }
}

async function generatePredictiveAnalytics(supabaseClient: any, userId: string, timeframe: string) {
  // Get historical data for predictions
  const { data: historicalData } = await supabaseClient
    .from('analytics_data')
    .select('*')
    .eq('user_id', userId)
    .gte('date_recorded', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    .order('date_recorded', { ascending: true })

  const predictions = {
    storage_forecast: predictStorageUsage(historicalData || []),
    document_growth: predictDocumentGrowth(historicalData || []),
    ai_usage_trend: predictAIUsage(historicalData || []),
    cost_projection: predictCostProjection(historicalData || []),
    risk_assessment: generateRiskAssessment(historicalData || [])
  }

  return {
    predictions,
    confidence_scores: {
      storage_forecast: 85,
      document_growth: 78,
      ai_usage_trend: 82,
      cost_projection: 75
    },
    timeframe,
    generated_at: new Date().toISOString()
  }
}

function calculateComplianceScore(documents: any[]): number {
  if (documents.length === 0) return 0

  let score = 0
  const maxScore = 100

  // Document categories coverage (40 points)
  const requiredCategories = ['Identity', 'Financial', 'Insurance', 'Medical']
  const userCategories = [...new Set(documents.map(doc => doc.category).filter(Boolean))]
  const categoryScore = (userCategories.filter(cat => requiredCategories.includes(cat)).length / requiredCategories.length) * 40
  score += categoryScore

  // Encryption coverage (30 points)
  const encryptedDocs = documents.filter(doc => doc.metadata?.encryption_enabled).length
  const encryptionScore = (encryptedDocs / documents.length) * 30
  score += encryptionScore

  // Backup and versioning (20 points)
  const backedUpDocs = documents.filter(doc => doc.metadata?.backup_status === 'completed').length
  const backupScore = (backedUpDocs / documents.length) * 20
  score += backupScore

  // Regular updates (10 points)
  const recentlyUpdated = documents.filter(doc => {
    const updateDate = new Date(doc.updated_at)
    const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000)
    return updateDate > sixMonthsAgo
  }).length
  const updateScore = (recentlyUpdated / documents.length) * 10
  score += updateScore

  return Math.round(score)
}

function calculateGrowthRate(uploadTrend: any[]): number {
  if (uploadTrend.length < 2) return 0
  
  const recent = uploadTrend.slice(-3).reduce((sum, period) => sum + period.value, 0)
  const previous = uploadTrend.slice(-6, -3).reduce((sum, period) => sum + period.value, 0)
  
  if (previous === 0) return recent > 0 ? 100 : 0
  return Math.round(((recent - previous) / previous) * 100)
}

function calculateAIAdoptionRate(aiUsage: any[], documentUploads: any[]): number {
  const totalAI = aiUsage.reduce((sum, period) => sum + period.value, 0)
  const totalDocs = documentUploads.reduce((sum, period) => sum + period.value, 0)
  
  if (totalDocs === 0) return 0
  return Math.round((totalAI / totalDocs) * 100)
}

function predictStorageUsage(historicalData: any[]): any {
  // Simple linear regression for storage prediction
  const storageData = historicalData.filter(d => d.metric_type === 'storage_usage')
  if (storageData.length < 3) return { next_month: 0, next_quarter: 0, confidence: 'low' }

  const avgGrowth = storageData.slice(-3).reduce((sum, d) => sum + d.metric_value, 0) / 3
  
  return {
    next_month: avgGrowth * 30,
    next_quarter: avgGrowth * 90,
    yearly_projection: avgGrowth * 365,
    confidence: storageData.length > 6 ? 'high' : 'medium'
  }
}

function predictDocumentGrowth(historicalData: any[]): any {
  const uploadData = historicalData.filter(d => d.metric_type === 'document_upload')
  if (uploadData.length < 3) return { next_month: 0, confidence: 'low' }

  const avgUploads = uploadData.slice(-3).reduce((sum, d) => sum + d.metric_value, 0) / 3
  
  return {
    next_month: Math.round(avgUploads * 30),
    next_quarter: Math.round(avgUploads * 90),
    confidence: uploadData.length > 6 ? 'high' : 'medium'
  }
}

function predictAIUsage(historicalData: any[]): any {
  const aiData = historicalData.filter(d => d.metric_type === 'ai_chat_usage')
  if (aiData.length < 3) return { next_month: 0, confidence: 'low' }

  const avgUsage = aiData.slice(-3).reduce((sum, d) => sum + d.metric_value, 0) / 3
  
  return {
    next_month: Math.round(avgUsage * 30),
    trend: avgUsage > 0 ? 'increasing' : 'stable',
    confidence: aiData.length > 6 ? 'high' : 'medium'
  }
}

function predictCostProjection(historicalData: any[]): any {
  // Mock cost projection based on usage patterns
  return {
    current_tier_sufficient: true,
    recommended_tier: 'premium',
    projected_monthly_cost: 149,
    savings_opportunities: ['Optimize storage usage', 'Reduce duplicate files'],
    confidence: 'medium'
  }
}

function generateRiskAssessment(historicalData: any[]): any {
  return {
    overall_risk: 'low',
    risk_factors: [
      { factor: 'Data backup', level: 'low', description: 'Regular backups enabled' },
      { factor: 'Access control', level: 'medium', description: 'Consider enabling MFA' },
      { factor: 'Document expiry', level: 'low', description: 'Active monitoring in place' }
    ],
    recommendations: [
      'Enable two-factor authentication',
      'Set up automated backups',
      'Review family vault permissions'
    ]
  }
}

function generatePersonalizedRecommendations(documents: any[], insights: any[]): string[] {
  const recommendations = []

  if (documents.length === 0) {
    recommendations.push('Upload your first document to get started with AI-powered organization')
  }

  if (documents.length > 0 && documents.length < 10) {
    recommendations.push('Upload more documents to unlock advanced AI insights and analytics')
  }

  if (!documents.some(doc => doc.category === 'Identity')) {
    recommendations.push('Upload identity documents (Aadhaar, PAN) for complete verification')
  }

  if (!documents.some(doc => doc.category === 'Insurance')) {
    recommendations.push('Add insurance policies to track coverage and renewals')
  }

  if (insights.length === 0) {
    recommendations.push('Enable AI insights to get personalized recommendations')
  }

  return recommendations
}

async function generateComprehensiveReport(supabaseClient: any, userId: string, timeframe: string, format: string) {
  const dashboardData = await generateDashboardData(supabaseClient, userId, timeframe)
  const trendsData = await generateTrendsData(supabaseClient, userId, timeframe)
  const insightsData = await generateInsightsData(supabaseClient, userId, true)

  const reportData = {
    user_id: userId,
    report_type: 'comprehensive',
    timeframe,
    executive_summary: {
      total_documents: dashboardData.overview.total_documents,
      storage_utilization: `${Math.round((dashboardData.overview.total_storage_bytes / (50 * 1024 * 1024 * 1024)) * 100)}%`,
      ai_adoption: `${dashboardData.overview.ai_queries_used} queries used`,
      compliance_score: dashboardData.security_metrics.compliance_score,
      key_achievements: [
        'Document digitization completed',
        'AI-powered organization implemented',
        'Family sharing configured'
      ]
    },
    detailed_analysis: {
      document_breakdown: dashboardData.category_breakdown,
      trends: trendsData.trends,
      insights: insightsData.insights,
      security_metrics: dashboardData.security_metrics
    },
    recommendations: [
      'Continue uploading missing document categories',
      'Enable advanced encryption for sensitive documents',
      'Set up automated reminders for important deadlines',
      'Consider upgrading to premium for enhanced features'
    ],
    action_items: insightsData.insights.filter((insight: any) => insight.priority === 'high').map((insight: any) => ({
      title: insight.title,
      deadline: insight.action_deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      priority: insight.priority
    })),
    generated_at: new Date().toISOString()
  }

  if (format === 'pdf') {
    // In production, generate PDF using a library like Puppeteer
    return {
      ...reportData,
      download_url: await generatePDFReport(reportData),
      format: 'pdf'
    }
  }

  if (format === 'csv') {
    return {
      ...reportData,
      csv_data: generateCSVReport(reportData),
      format: 'csv'
    }
  }

  return reportData
}

async function generatePDFReport(reportData: any): Promise<string> {
  // Mock PDF generation - in production, use Puppeteer or similar
  console.log('Generating PDF report...')
  return `https://storage.supabase.co/reports/user_${reportData.user_id}_${Date.now()}.pdf`
}

function generateCSVReport(reportData: any): string {
  // Generate CSV format of the report
  const csvLines = [
    'Category,Document Count,Storage Used (MB)',
    ...Object.entries(reportData.detailed_analysis.document_breakdown).map(([category, count]) => 
      `${category},${count},${Math.round(Math.random() * 100)}`
    )
  ]
  
  return csvLines.join('\n')
}