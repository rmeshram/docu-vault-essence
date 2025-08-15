import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SubscriptionRequest {
  action: 'create' | 'update' | 'cancel' | 'webhook' | 'get_plans';
  tier?: 'free' | 'premium' | 'family_plus' | 'business';
  paymentProvider?: 'stripe' | 'razorpay';
  webhookData?: any;
}

const SUBSCRIPTION_PLANS = {
  free: {
    name: 'Free',
    price: 0,
    currency: 'INR',
    storage_gb: 1,
    ai_queries: 50,
    family_members: 0,
    features: ['Basic document storage', 'OCR processing', 'Basic AI chat']
  },
  premium: {
    name: 'Premium',
    price: 149,
    currency: 'INR',
    storage_gb: 50,
    ai_queries: 500,
    family_members: 0,
    features: ['Advanced AI features', 'Unlimited OCR', 'Priority support', 'Advanced analytics']
  },
  family_plus: {
    name: 'Family Plus',
    price: 249,
    currency: 'INR',
    storage_gb: 200,
    ai_queries: 1000,
    family_members: 5,
    features: ['Family vault', 'Shared documents', 'Family reminders', 'Emergency access']
  },
  business: {
    name: 'Business',
    price: 999,
    currency: 'INR',
    storage_gb: 1000,
    ai_queries: 5000,
    family_members: 20,
    features: ['Team collaboration', 'API access', 'Custom integrations', 'Compliance reporting']
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

    const { action, tier, paymentProvider, webhookData }: SubscriptionRequest = await req.json()

    if (action === 'webhook') {
      return await handleWebhook(supabaseClient, webhookData, paymentProvider)
    }

    if (action === 'get_plans') {
      return new Response(
        JSON.stringify({
          success: true,
          data: { plans: SUBSCRIPTION_PLANS }
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

        // Create subscription record
        const subscriptionData = {
          user_id: userProfile.id,
          tier: tier,
          status: 'pending',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        }

        const { data: subscription, error: subError } = await supabaseClient
          .from('user_subscriptions')
          .insert(subscriptionData)
          .select()
          .single()

        if (subError) throw subError

        // Generate payment link based on provider
        let paymentUrl = ''
        if (paymentProvider === 'stripe') {
          paymentUrl = await createStripeCheckout(plan, userProfile, subscription.id)
        } else if (paymentProvider === 'razorpay') {
          paymentUrl = await createRazorpayOrder(plan, userProfile, subscription.id)
        }

        result = {
          subscription,
          payment_url: paymentUrl,
          plan: plan
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

        result = { success: true, new_tier: tier }
        break

      case 'cancel':
        // Mark subscription for cancellation at period end
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
              canceled_at: new Date().toISOString()
            })
            .eq('id', currentSub.id)
        }

        result = { success: true }
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
        new_values: { action, tier, paymentProvider }
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

async function createStripeCheckout(plan: any, userProfile: any, subscriptionId: string): Promise<string> {
  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
  if (!stripeSecretKey) {
    throw new Error('Stripe not configured')
  }

  // In production, create actual Stripe checkout session
  console.log(`Creating Stripe checkout for plan ${plan.name}, user ${userProfile.id}`)
  
  // Mock Stripe checkout URL
  return `https://checkout.stripe.com/pay/mock_session_${subscriptionId}`
}

async function createRazorpayOrder(plan: any, userProfile: any, subscriptionId: string): Promise<string> {
  const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID')
  const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET')
  
  if (!razorpayKeyId || !razorpayKeySecret) {
    throw new Error('Razorpay not configured')
  }

  // In production, create actual Razorpay order
  console.log(`Creating Razorpay order for plan ${plan.name}, user ${userProfile.id}`)
  
  // Mock Razorpay payment URL
  return `https://rzp.io/l/mock_order_${subscriptionId}`
}

async function handleWebhook(supabaseClient: any, webhookData: any, provider?: string) {
  console.log(`Processing ${provider} webhook:`, webhookData)

  // Handle Stripe webhook
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

  // Handle Razorpay webhook
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
    newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1)

    await supabaseClient
      .from('user_subscriptions')
      .update({
        current_period_start: subscription.current_period_end,
        current_period_end: newPeriodEnd.toISOString(),
        status: 'active'
      })
      .eq('id', subscription.id)

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

    // Downgrade user to free tier at period end
    await supabaseClient
      .from('users')
      .update({
        subscription_tier: 'free',
        storage_limit: 1073741824, // 1GB
        ai_queries_limit: 50
      })
      .eq('id', subscription.user_id)

    console.log(`Canceled subscription for user ${subscription.user_id}`)
  }
}