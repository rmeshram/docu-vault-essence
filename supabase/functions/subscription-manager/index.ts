import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SubscriptionRequest {
  action: 'create' | 'update' | 'cancel' | 'webhook' | 'get_plans' | 'usage_check';
  tier?: 'free' | 'premium' | 'family_plus' | 'business';
  paymentProvider?: 'stripe' | 'razorpay';
  webhookData?: any;
  billingCycle?: 'monthly' | 'yearly';
}

const SUBSCRIPTION_PLANS = {
  free: {
    name: 'Free',
    price: { monthly: 0, yearly: 0 },
    currency: 'INR',
    storage_gb: 1,
    ai_queries: 50,
    family_members: 0,
    features: [
      'Basic document storage',
      'OCR processing',
      'Basic AI chat',
      'Mobile app access',
      'Email support'
    ],
    limits: {
      daily_uploads: 10,
      monthly_uploads: 100,
      max_file_size_mb: 10,
      ai_queries_per_month: 50
    }
  },
  premium: {
    name: 'Premium',
    price: { monthly: 149, yearly: 1490 }, // 2 months free on yearly
    currency: 'INR',
    storage_gb: 50,
    ai_queries: 500,
    family_members: 0,
    features: [
      'Advanced AI features',
      'Unlimited OCR',
      'Priority support',
      'Advanced analytics',
      'Multi-language translation',
      'Smart reminders',
      'Version control',
      'API access'
    ],
    limits: {
      daily_uploads: 100,
      monthly_uploads: 1000,
      max_file_size_mb: 50,
      ai_queries_per_month: 500
    }
  },
  family_plus: {
    name: 'Family Plus',
    price: { monthly: 249, yearly: 2490 },
    currency: 'INR',
    storage_gb: 200,
    ai_queries: 1000,
    family_members: 5,
    features: [
      'All Premium features',
      'Family vault',
      'Shared documents',
      'Family reminders',
      'Emergency access',
      'Collaborative notes',
      'Role-based permissions',
      'Family analytics'
    ],
    limits: {
      daily_uploads: 200,
      monthly_uploads: 2000,
      max_file_size_mb: 50,
      ai_queries_per_month: 1000
    }
  },
  business: {
    name: 'Business',
    price: { monthly: 999, yearly: 9990 },
    currency: 'INR',
    storage_gb: 1000,
    ai_queries: 5000,
    family_members: 20,
    features: [
      'All Family Plus features',
      'Team collaboration',
      'Advanced API access',
      'Custom integrations',
      'Compliance reporting',
      'Audit trails',
      'Priority processing',
      'Dedicated support',
      'Custom branding'
    ],
    limits: {
      daily_uploads: 1000,
      monthly_uploads: 10000,
      max_file_size_mb: 100,
      ai_queries_per_month: 5000
    }
  }
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

    const { action, tier, paymentProvider, webhookData, billingCycle = 'monthly' }: SubscriptionRequest = await req.json()

    if (action === 'webhook') {
      return await handleWebhook(supabaseClient, webhookData, paymentProvider)
    }

    if (action === 'get_plans') {
      return new Response(
        JSON.stringify({
          success: true,
          data: { 
            plans: SUBSCRIPTION_PLANS,
            current_promotions: await getCurrentPromotions(),
            regional_pricing: await getRegionalPricing()
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

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

    let result: any = {}

    switch (action) {
      case 'create':
        if (!tier || !paymentProvider) {
          throw new Error('Tier and payment provider required')
        }

        const plan = SUBSCRIPTION_PLANS[tier as keyof typeof SUBSCRIPTION_PLANS]
        if (!plan) {
          throw new Error('Invalid subscription tier')
        }

        // Check if user already has an active subscription
        const { data: existingSub } = await supabaseClient
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', userProfile.id)
          .eq('status', 'active')
          .single()

        if (existingSub && existingSub.tier !== 'free') {
          throw new Error('User already has an active subscription')
        }

        // Create subscription record
        const subscriptionData = {
          user_id: userProfile.id,
          tier: tier,
          status: 'pending',
          billing_cycle: billingCycle,
          amount: plan.price[billingCycle as keyof typeof plan.price],
          currency: plan.currency,
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + (billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString()
        }

        const { data: subscription, error: subError } = await supabaseClient
          .from('user_subscriptions')
          .insert(subscriptionData)
          .select()
          .single()

        if (subError) throw subError

        // Generate payment link
        let paymentUrl = ''
        if (paymentProvider === 'stripe') {
          paymentUrl = await createStripeCheckout(plan, userProfile, subscription.id, billingCycle)
        } else if (paymentProvider === 'razorpay') {
          paymentUrl = await createRazorpayOrder(plan, userProfile, subscription.id, billingCycle)
        }

        result = {
          subscription,
          payment_url: paymentUrl,
          plan: plan,
          billing_cycle: billingCycle
        }
        break

      case 'update':
        if (!tier) {
          throw new Error('Tier required for update')
        }

        const newPlan = SUBSCRIPTION_PLANS[tier as keyof typeof SUBSCRIPTION_PLANS]
        if (!newPlan) {
          throw new Error('Invalid subscription tier')
        }

        // Update user tier and limits
        await supabaseClient
          .from('users')
          .update({
            subscription_tier: tier,
            storage_limit: newPlan.storage_gb * 1024 * 1024 * 1024,
            ai_queries_limit: newPlan.ai_queries
          })
          .eq('id', userProfile.id)

        // Create new subscription record
        const { data: updatedSub } = await supabaseClient
          .from('user_subscriptions')
          .insert({
            user_id: userProfile.id,
            tier: tier,
            status: 'active',
            amount: newPlan.price.monthly,
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          })
          .select()
          .single()

        result = { subscription: updatedSub, new_tier: tier }
        break

      case 'cancel':
        const { data: currentSub } = await supabaseClient
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', userProfile.id)
          .eq('status', 'active')
          .single()

        if (currentSub) {
          await supabaseClient
            .from('user_subscriptions')
            .update({
              status: 'canceled',
              canceled_at: new Date().toISOString(),
              cancel_at_period_end: true
            })
            .eq('id', currentSub.id)
        }

        result = { success: true, effective_date: currentSub?.current_period_end }
        break

      case 'usage_check':
        const usageData = await getUserUsageData(supabaseClient, userProfile.id)
        const currentPlan = SUBSCRIPTION_PLANS[userProfile.subscription_tier as keyof typeof SUBSCRIPTION_PLANS]
        
        result = {
          current_tier: userProfile.subscription_tier,
          usage: usageData,
          limits: currentPlan.limits,
          recommendations: generateUpgradeRecommendations(usageData, currentPlan)
        }
        break

      default:
        throw new Error('Invalid action')
    }

    // Log subscription activity
    await supabaseClient
      .from('audit_logs')
      .insert({
        user_id: userProfile.id,
        action: `subscription_${action}`,
        resource_type: 'subscription',
        resource_id: tier,
        new_values: { action, tier, paymentProvider, billingCycle }
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
    console.error('Subscription processing error:', error)
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

async function createStripeCheckout(plan: any, userProfile: any, subscriptionId: string, billingCycle: string): Promise<string> {
  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
  if (!stripeSecretKey) {
    throw new Error('Stripe not configured')
  }

  try {
    // Create Stripe checkout session
    const checkoutData = {
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'inr',
          product_data: {
            name: `DocuVault AI ${plan.name}`,
            description: `${plan.storage_gb}GB storage, ${plan.ai_queries} AI queries`,
          },
          unit_amount: plan.price[billingCycle] * 100, // Convert to paise
          recurring: {
            interval: billingCycle === 'yearly' ? 'year' : 'month'
          }
        },
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${Deno.env.get('FRONTEND_URL')}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${Deno.env.get('FRONTEND_URL')}/subscription/cancel`,
      metadata: {
        subscription_id: subscriptionId,
        user_id: userProfile.id,
        tier: plan.name.toLowerCase()
      }
    }

    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams(Object.entries(checkoutData).map(([key, value]) => 
        [key, typeof value === 'object' ? JSON.stringify(value) : String(value)]
      ))
    })

    if (stripeResponse.ok) {
      const session = await stripeResponse.json()
      return session.url
    }
  } catch (error) {
    console.error('Stripe checkout creation failed:', error)
  }

  // Fallback: Mock checkout URL
  return `https://checkout.stripe.com/pay/mock_session_${subscriptionId}`
}

async function createRazorpayOrder(plan: any, userProfile: any, subscriptionId: string, billingCycle: string): Promise<string> {
  const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID')
  const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET')
  
  if (!razorpayKeyId || !razorpayKeySecret) {
    throw new Error('Razorpay not configured')
  }

  try {
    const orderData = {
      amount: plan.price[billingCycle] * 100, // Convert to paise
      currency: 'INR',
      receipt: `sub_${subscriptionId}`,
      notes: {
        subscription_id: subscriptionId,
        user_id: userProfile.id,
        tier: plan.name.toLowerCase(),
        billing_cycle: billingCycle
      }
    }

    const auth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`)
    
    const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    })

    if (razorpayResponse.ok) {
      const order = await razorpayResponse.json()
      return `${Deno.env.get('FRONTEND_URL')}/payment/razorpay?order_id=${order.id}`
    }
  } catch (error) {
    console.error('Razorpay order creation failed:', error)
  }

  // Fallback: Mock payment URL
  return `https://rzp.io/l/mock_order_${subscriptionId}`
}

async function handleWebhook(supabaseClient: any, webhookData: any, provider?: string) {
  console.log(`Processing ${provider} webhook:`, webhookData)

  try {
    if (provider === 'stripe') {
      const event = webhookData
      
      switch (event.type) {
        case 'checkout.session.completed':
          const session = event.data.object
          await activateSubscription(supabaseClient, session.metadata.subscription_id, 'stripe', session.id)
          break
          
        case 'invoice.payment_succeeded':
          const invoice = event.data.object
          await renewSubscription(supabaseClient, invoice.subscription, 'stripe')
          break
          
        case 'customer.subscription.deleted':
          const subscription = event.data.object
          await cancelSubscription(supabaseClient, subscription.id, 'stripe')
          break
      }
    }

    if (provider === 'razorpay') {
      const event = webhookData
      
      switch (event.event) {
        case 'payment.captured':
          const payment = event.payload.payment.entity
          await activateSubscription(supabaseClient, payment.notes.subscription_id, 'razorpay', payment.id)
          break
          
        case 'subscription.cancelled':
          const canceledSub = event.payload.subscription.entity
          await cancelSubscription(supabaseClient, canceledSub.id, 'razorpay')
          break
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Webhook processing failed:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
}

async function activateSubscription(supabaseClient: any, subscriptionId: string, provider: string, externalId: string) {
  const { data: subscription } = await supabaseClient
    .from('user_subscriptions')
    .select('*, users(*)')
    .eq('id', subscriptionId)
    .single()

  if (subscription) {
    // Update subscription status
    await supabaseClient
      .from('user_subscriptions')
      .update({
        status: 'active',
        [`${provider}_subscription_id`]: externalId
      })
      .eq('id', subscriptionId)

    // Update user tier and limits
    const plan = SUBSCRIPTION_PLANS[subscription.tier as keyof typeof SUBSCRIPTION_PLANS]
    await supabaseClient
      .from('users')
      .update({
        subscription_tier: subscription.tier,
        storage_limit: plan.storage_gb * 1024 * 1024 * 1024,
        ai_queries_limit: plan.ai_queries
      })
      .eq('id', subscription.user_id)

    // Send welcome notification
    await supabaseClient
      .from('notifications')
      .insert({
        user_id: subscription.user_id,
        type: 'system_alert',
        title: `Welcome to ${plan.name}!`,
        message: `Your ${plan.name} subscription is now active. Enjoy ${plan.storage_gb}GB storage and ${plan.ai_queries} AI queries.`,
        priority: 7
      })

    console.log(`Activated ${subscription.tier} subscription for user ${subscription.user_id}`)
  }
}

async function renewSubscription(supabaseClient: any, externalSubscriptionId: string, provider: string) {
  const { data: subscription } = await supabaseClient
    .from('user_subscriptions')
    .select('*')
    .eq(`${provider}_subscription_id`, externalSubscriptionId)
    .single()

  if (subscription) {
    const newPeriodEnd = new Date(subscription.current_period_end)
    if (subscription.billing_cycle === 'yearly') {
      newPeriodEnd.setFullYear(newPeriodEnd.getFullYear() + 1)
    } else {
      newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1)
    }

    await supabaseClient
      .from('user_subscriptions')
      .update({
        current_period_start: subscription.current_period_end,
        current_period_end: newPeriodEnd.toISOString(),
        status: 'active'
      })
      .eq('id', subscription.id)

    // Reset monthly usage counters
    await supabaseClient
      .from('users')
      .update({
        ai_queries_used: 0,
        monthly_uploads: 0
      })
      .eq('id', subscription.user_id)

    console.log(`Renewed subscription for user ${subscription.user_id}`)
  }
}

async function cancelSubscription(supabaseClient: any, externalSubscriptionId: string, provider: string) {
  const { data: subscription } = await supabaseClient
    .from('user_subscriptions')
    .select('*')
    .eq(`${provider}_subscription_id`, externalSubscriptionId)
    .single()

  if (subscription) {
    await supabaseClient
      .from('user_subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString()
      })
      .eq('id', subscription.id)

    // Schedule downgrade to free tier at period end
    if (subscription.cancel_at_period_end) {
      await supabaseClient
        .from('users')
        .update({
          subscription_tier: 'free',
          storage_limit: 1073741824, // 1GB
          ai_queries_limit: 50
        })
        .eq('id', subscription.user_id)
    }

    console.log(`Canceled subscription for user ${subscription.user_id}`)
  }
}

async function getUserUsageData(supabaseClient: any, userId: string) {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  // Get current month usage
  const { data: monthlyUploads } = await supabaseClient
    .from('documents')
    .select('id')
    .eq('user_id', userId)
    .gte('created_at', monthStart.toISOString())

  const { data: monthlyAIQueries } = await supabaseClient
    .from('analytics_data')
    .select('metric_value')
    .eq('user_id', userId)
    .eq('metric_type', 'ai_chat_usage')
    .gte('date_recorded', monthStart.toISOString().split('T')[0])

  const { data: storageUsage } = await supabaseClient
    .rpc('get_user_storage_usage', { user_uuid: userId })

  return {
    storage: {
      used_bytes: storageUsage?.[0]?.total_size || 0,
      document_count: storageUsage?.[0]?.document_count || 0,
      by_category: storageUsage?.[0]?.by_category || {}
    },
    monthly_uploads: monthlyUploads?.length || 0,
    monthly_ai_queries: monthlyAIQueries?.reduce((sum, q) => sum + q.metric_value, 0) || 0,
    period: {
      start: monthStart.toISOString(),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString()
    }
  }
}

function generateUpgradeRecommendations(usage: any, currentPlan: any): string[] {
  const recommendations = []

  if (usage.storage.used_bytes > currentPlan.storage_gb * 1024 * 1024 * 1024 * 0.8) {
    recommendations.push('Consider upgrading for more storage space')
  }

  if (usage.monthly_ai_queries > currentPlan.limits.ai_queries_per_month * 0.8) {
    recommendations.push('Upgrade to get more AI queries per month')
  }

  if (usage.monthly_uploads > currentPlan.limits.monthly_uploads * 0.8) {
    recommendations.push('Increase your monthly upload limit with a higher tier')
  }

  return recommendations
}

async function getCurrentPromotions() {
  // Mock promotions - in production, fetch from database
  return [
    {
      code: 'LAUNCH50',
      description: '50% off first 3 months',
      valid_until: '2024-06-30',
      applicable_tiers: ['premium', 'family_plus']
    },
    {
      code: 'FAMILY20',
      description: '20% off Family Plus yearly plan',
      valid_until: '2024-12-31',
      applicable_tiers: ['family_plus']
    }
  ]
}

async function getRegionalPricing() {
  // Mock regional pricing - in production, implement based on user location
  return {
    'IN': { currency: 'INR', tax_rate: 18 }, // GST
    'US': { currency: 'USD', tax_rate: 8 },
    'EU': { currency: 'EUR', tax_rate: 20 }
  }
}