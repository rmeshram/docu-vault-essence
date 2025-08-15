import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MarketplaceRequest {
  action: 'register_professional' | 'search_professionals' | 'book_consultation' | 'submit_review' | 'get_templates' | 'verify_professional';
  professionalData?: {
    professional_type: string;
    license_number: string;
    license_expiry_date: string;
    specialization: string[];
    experience_years: number;
    business_name?: string;
    bio?: string;
    consultation_fee: number;
    languages_spoken: string[];
  };
  searchFilters?: {
    professional_type?: string;
    specialization?: string;
    max_fee?: number;
    languages?: string[];
    rating_min?: number;
    location?: string;
  };
  consultationData?: {
    professional_id: string;
    title: string;
    description: string;
    scheduled_at: string;
    duration_minutes: number;
    shared_documents?: string[];
  };
  reviewData?: {
    consultation_id: string;
    rating: number;
    feedback: string;
  };
  verificationData?: {
    professional_id: string;
    verification_documents: any[];
    verification_notes?: string;
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

    const { 
      action, 
      professionalData, 
      searchFilters, 
      consultationData, 
      reviewData,
      verificationData 
    }: MarketplaceRequest = await req.json()

    let result: any = {}

    switch (action) {
      case 'register_professional':
        if (!professionalData) {
          throw new Error('Professional data required')
        }

        // Check if user is already registered as professional
        const { data: existingProfessional } = await supabaseClient
          .from('professionals')
          .select('id')
          .eq('user_id', userProfile.id)
          .single()

        if (existingProfessional) {
          throw new Error('User is already registered as a professional')
        }

        const { data: newProfessional, error: profError } = await supabaseClient
          .from('professionals')
          .insert({
            ...professionalData,
            user_id: userProfile.id,
            verification_status: 'pending',
            contact_details: {
              email: userProfile.email,
              phone: userProfile.phone
            }
          })
          .select()
          .single()

        if (profError) throw profError

        // Create notification for admin review
        await supabaseClient
          .from('notifications')
          .insert({
            user_id: userProfile.id,
            type: 'system_alert',
            title: 'Professional Registration Submitted',
            message: 'Your professional registration is under review. We will notify you once verified.',
            priority: 6
          })

        result = { professional: newProfessional }
        break

      case 'search_professionals':
        const professionals = await searchProfessionals(supabaseClient, searchFilters || {})
        result = { professionals }
        break

      case 'book_consultation':
        if (!consultationData) {
          throw new Error('Consultation data required')
        }

        // Verify professional availability
        const { data: professional } = await supabaseClient
          .from('professionals')
          .select('*')
          .eq('id', consultationData.professional_id)
          .eq('verification_status', 'verified')
          .eq('is_available', true)
          .single()

        if (!professional) {
          throw new Error('Professional not available')
        }

        // Check for scheduling conflicts
        const scheduledTime = new Date(consultationData.scheduled_at)
        const { data: conflicts } = await supabaseClient
          .from('consultations')
          .select('id')
          .eq('professional_id', consultationData.professional_id)
          .eq('status', 'scheduled')
          .gte('scheduled_at', new Date(scheduledTime.getTime() - 30 * 60 * 1000).toISOString()) // 30 min buffer
          .lte('scheduled_at', new Date(scheduledTime.getTime() + consultationData.duration_minutes * 60 * 1000).toISOString())

        if (conflicts && conflicts.length > 0) {
          throw new Error('Time slot not available')
        }

        const { data: consultation, error: consultError } = await supabaseClient
          .from('consultations')
          .insert({
            ...consultationData,
            user_id: userProfile.id,
            amount: professional.consultation_fee,
            currency: professional.currency || 'INR',
            status: 'scheduled'
          })
          .select()
          .single()

        if (consultError) throw consultError

        // Generate meeting URL (integrate with Zoom/Google Meet)
        const meetingUrl = await generateMeetingUrl(consultation.id, professional, userProfile)
        
        await supabaseClient
          .from('consultations')
          .update({ meeting_url: meetingUrl })
          .eq('id', consultation.id)

        // Send notifications
        await sendConsultationNotifications(supabaseClient, consultation, professional, userProfile)

        result = { consultation: { ...consultation, meeting_url: meetingUrl } }
        break

      case 'submit_review':
        if (!reviewData) {
          throw new Error('Review data required')
        }

        // Verify consultation exists and user participated
        const { data: consultation } = await supabaseClient
          .from('consultations')
          .select('*')
          .eq('id', reviewData.consultation_id)
          .eq('user_id', userProfile.id)
          .eq('status', 'completed')
          .single()

        if (!consultation) {
          throw new Error('Consultation not found or not completed')
        }

        // Update consultation with review
        await supabaseClient
          .from('consultations')
          .update({
            user_rating: reviewData.rating,
            user_feedback: reviewData.feedback
          })
          .eq('id', reviewData.consultation_id)

        // Update professional's average rating
        await updateProfessionalRating(supabaseClient, consultation.professional_id)

        result = { success: true }
        break

      case 'verify_professional':
        if (!verificationData) {
          throw new Error('Verification data required')
        }

        // Check if user has admin privileges (implement admin role check)
        // For now, allow any user to verify (in production, restrict to admins)
        
        const { data: professionalToVerify } = await supabaseClient
          .from('professionals')
          .select('*')
          .eq('id', verificationData.professional_id)
          .single()

        if (!professionalToVerify) {
          throw new Error('Professional not found')
        }

        // Update verification status
        await supabaseClient
          .from('professionals')
          .update({
            verification_status: 'verified',
            verified_at: new Date().toISOString(),
            verified_by: userProfile.id,
            verification_documents: verificationData.verification_documents
          })
          .eq('id', verificationData.professional_id)

        // Send verification notification
        await supabaseClient
          .from('notifications')
          .insert({
            user_id: professionalToVerify.user_id,
            type: 'system_alert',
            title: 'Professional Verification Approved',
            message: 'Congratulations! Your professional profile has been verified and is now live on the marketplace.',
            priority: 8
          })

        result = { success: true }
        break

      case 'get_templates':
        const { data: templates } = await supabaseClient
          .from('professional_templates')
          .select(`
            *,
            professionals(business_name, professional_type, average_rating)
          `)
          .eq('is_active', true)
          .order('usage_count', { ascending: false })
          .limit(20)

        result = { templates }
        break

      default:
        throw new Error('Invalid action')
    }

    // Log marketplace activity
    await supabaseClient
      .from('audit_logs')
      .insert({
        user_id: userProfile.id,
        action: `marketplace_${action}`,
        resource_type: 'marketplace',
        resource_id: action,
        new_values: { action, ...professionalData, ...searchFilters, ...consultationData }
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
    console.error('Marketplace processing error:', error)
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

async function searchProfessionals(supabaseClient: any, filters: any) {
  let query = supabaseClient
    .from('professionals')
    .select(`
      *,
      users(full_name, avatar_url),
      professional_templates(id, name, category, usage_count)
    `)
    .eq('verification_status', 'verified')
    .eq('is_available', true)

  if (filters.professional_type) {
    query = query.eq('professional_type', filters.professional_type)
  }

  if (filters.specialization) {
    query = query.contains('specialization', [filters.specialization])
  }

  if (filters.max_fee) {
    query = query.lte('consultation_fee', filters.max_fee)
  }

  if (filters.languages) {
    query = query.overlaps('languages_spoken', filters.languages)
  }

  if (filters.rating_min) {
    query = query.gte('average_rating', filters.rating_min)
  }

  const { data: professionals, error } = await query
    .order('average_rating', { ascending: false })
    .order('total_reviews', { ascending: false })
    .limit(20)

  if (error) throw error

  // Enhance with availability and next available slot
  return (professionals || []).map(prof => ({
    ...prof,
    next_available_slot: calculateNextAvailableSlot(prof.availability_schedule),
    response_time_category: categorizeResponseTime(prof.response_time_hours),
    specialization_match: filters.specialization ? 
      prof.specialization.includes(filters.specialization) : false
  }))
}

async function generateMeetingUrl(consultationId: string, professional: any, user: any): Promise<string> {
  // In production, integrate with Zoom, Google Meet, or Microsoft Teams
  console.log(`Generating meeting URL for consultation ${consultationId}`)
  
  // Mock meeting URL generation
  const meetingId = Math.random().toString(36).substring(2, 10)
  return `https://meet.docuvault.ai/consultation/${meetingId}?consultation_id=${consultationId}`
}

async function sendConsultationNotifications(supabaseClient: any, consultation: any, professional: any, user: any) {
  // Notification to user
  await supabaseClient
    .from('notifications')
    .insert({
      user_id: user.id,
      type: 'system_alert',
      title: 'Consultation Booked',
      message: `Your consultation with ${professional.business_name} is scheduled for ${new Date(consultation.scheduled_at).toLocaleString()}`,
      action_url: consultation.meeting_url,
      priority: 7
    })

  // Notification to professional
  await supabaseClient
    .from('notifications')
    .insert({
      user_id: professional.user_id,
      type: 'system_alert',
      title: 'New Consultation Booking',
      message: `New consultation booked by ${user.full_name} for ${new Date(consultation.scheduled_at).toLocaleString()}`,
      action_url: consultation.meeting_url,
      priority: 7
    })
}

async function updateProfessionalRating(supabaseClient: any, professionalId: string) {
  const { data: consultations } = await supabaseClient
    .from('consultations')
    .select('user_rating')
    .eq('professional_id', professionalId)
    .not('user_rating', 'is', null)

  if (consultations && consultations.length > 0) {
    const avgRating = consultations.reduce((sum, c) => sum + c.user_rating, 0) / consultations.length
    const totalReviews = consultations.length

    await supabaseClient
      .from('professionals')
      .update({
        average_rating: Math.round(avgRating * 100) / 100,
        total_reviews: totalReviews
      })
      .eq('id', professionalId)
  }
}

function calculateNextAvailableSlot(availabilitySchedule: any): string {
  // Mock calculation - in production, implement proper scheduling logic
  const now = new Date()
  const nextSlot = new Date(now.getTime() + 24 * 60 * 60 * 1000) // Tomorrow
  return nextSlot.toISOString()
}

function categorizeResponseTime(hours: number): string {
  if (hours <= 2) return 'Very Fast'
  if (hours <= 6) return 'Fast'
  if (hours <= 24) return 'Same Day'
  return 'Within 2 Days'
}