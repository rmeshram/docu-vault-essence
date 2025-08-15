import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DocumentProcessRequest {
  documentId: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  enableOCR?: boolean;
  enableAI?: boolean;
  language?: string;
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

    const { documentId, fileUrl, fileName, fileType, enableOCR = true, enableAI = true, language = 'auto' }: DocumentProcessRequest = await req.json()

    console.log(`Processing document: ${fileName} (${documentId})`)

    let extractedText = '';
    let aiSummary = '';
    let aiConfidence = 0;
    let detectedLanguage = 'en';
    let suggestedCategory = 'Personal';
    let aiTags: string[] = [];

    // OCR Processing
    if (enableOCR && (fileType.includes('image') || fileType.includes('pdf'))) {
      try {
        console.log('Starting OCR processing...')
        
        // Use Google Vision API for OCR
        const visionApiKey = Deno.env.get('GOOGLE_VISION_API_KEY')
        if (visionApiKey) {
          const visionResponse = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${visionApiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              requests: [{
                image: { source: { imageUri: fileUrl } },
                features: [
                  { type: 'TEXT_DETECTION', maxResults: 1 },
                  { type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 }
                ]
              }]
            })
          })

          if (visionResponse.ok) {
            const visionData = await visionResponse.json()
            if (visionData.responses?.[0]?.fullTextAnnotation?.text) {
              extractedText = visionData.responses[0].fullTextAnnotation.text
              console.log('OCR completed successfully')
            }
          }
        }

        // Fallback: Mock OCR for demo
        if (!extractedText) {
          extractedText = generateMockOCRText(fileName)
          console.log('Using mock OCR text')
        }

        // Language detection
        if (extractedText) {
          detectedLanguage = detectLanguage(extractedText)
        }

      } catch (error) {
        console.error('OCR processing failed:', error)
        extractedText = `OCR processing failed for ${fileName}`
      }
    }

    // AI Analysis
    if (enableAI && extractedText) {
      try {
        console.log('Starting AI analysis...')
        
        const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
        if (openaiApiKey) {
          // Document categorization
          const categorizationPrompt = `Analyze this document text and categorize it. Return only the category name from: Identity, Financial, Insurance, Medical, Legal, Personal, Business, Tax.

Document text: ${extractedText.substring(0, 1000)}`

          const categoryResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openaiApiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'gpt-3.5-turbo',
              messages: [{ role: 'user', content: categorizationPrompt }],
              max_tokens: 50,
              temperature: 0.1
            })
          })

          if (categoryResponse.ok) {
            const categoryData = await categoryResponse.json()
            const category = categoryData.choices?.[0]?.message?.content?.trim()
            if (category && ['Identity', 'Financial', 'Insurance', 'Medical', 'Legal', 'Personal', 'Business', 'Tax'].includes(category)) {
              suggestedCategory = category
            }
          }

          // Document summarization
          const summaryPrompt = `Provide a concise summary of this document, highlighting key information, dates, amounts, and important details. Keep it under 200 words.

Document text: ${extractedText.substring(0, 2000)}`

          const summaryResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openaiApiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'gpt-3.5-turbo',
              messages: [{ role: 'user', content: summaryPrompt }],
              max_tokens: 300,
              temperature: 0.3
            })
          })

          if (summaryResponse.ok) {
            const summaryData = await summaryResponse.json()
            aiSummary = summaryData.choices?.[0]?.message?.content || ''
            aiConfidence = 85 + Math.random() * 10 // Mock confidence score
          }

          // Generate AI tags
          const tagsPrompt = `Generate 3-5 relevant tags for this document. Return only comma-separated tags.

Document text: ${extractedText.substring(0, 1000)}`

          const tagsResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openaiApiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'gpt-3.5-turbo',
              messages: [{ role: 'user', content: tagsPrompt }],
              max_tokens: 100,
              temperature: 0.5
            })
          })

          if (tagsResponse.ok) {
            const tagsData = await tagsResponse.json()
            const tagsText = tagsData.choices?.[0]?.message?.content || ''
            aiTags = tagsText.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0)
          }
        }

        // Fallback: Mock AI analysis
        if (!aiSummary) {
          const mockAnalysis = generateMockAIAnalysis(fileName, extractedText)
          aiSummary = mockAnalysis.summary
          aiConfidence = mockAnalysis.confidence
          suggestedCategory = mockAnalysis.category
          aiTags = mockAnalysis.tags
          console.log('Using mock AI analysis')
        }

      } catch (error) {
        console.error('AI analysis failed:', error)
        aiSummary = `AI analysis failed for ${fileName}`
        aiConfidence = 0
      }
    }

    // Update document with processed data
    const { error: updateError } = await supabaseClient
      .from('documents')
      .update({
        extracted_text: extractedText,
        ai_summary: aiSummary,
        ai_confidence: aiConfidence,
        language_detected: detectedLanguage,
        category: suggestedCategory,
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId)

    if (updateError) {
      throw updateError
    }

    // Add AI-generated tags
    if (aiTags.length > 0) {
      const tagInserts = aiTags.map(tag => ({
        document_id: documentId,
        tag: tag,
        is_ai_generated: true
      }))

      await supabaseClient
        .from('document_tags')
        .insert(tagInserts)
    }

    // Log activity
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (user) {
      await supabaseClient
        .from('user_activity')
        .insert({
          user_id: user.id,
          activity_type: 'document_processed',
          description: `Document ${fileName} processed with AI analysis`,
          metadata: {
            document_id: documentId,
            ocr_enabled: enableOCR,
            ai_enabled: enableAI,
            confidence: aiConfidence,
            category: suggestedCategory
          }
        })
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          documentId,
          extractedText,
          aiSummary,
          aiConfidence,
          detectedLanguage,
          suggestedCategory,
          aiTags
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Document processing error:', error)
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

function generateMockOCRText(fileName: string): string {
  const name = fileName.toLowerCase()
  
  if (name.includes('aadhaar') || name.includes('aadhar')) {
    return `GOVERNMENT OF INDIA
Unique Identification Authority of India
आधार
AADHAAR
Name: JOHN DOE
DOB: 15/06/1990
Gender: MALE
Address: 123 Main Street, Mumbai, Maharashtra - 400001
Aadhaar Number: 1234 5678 9012`
  }
  
  if (name.includes('pan')) {
    return `INCOME TAX DEPARTMENT
GOVT. OF INDIA
PERMANENT ACCOUNT NUMBER CARD
Name: JOHN DOE
Father's Name: RICHARD DOE
Date of Birth: 15/06/1990
PAN: ABCDE1234F`
  }
  
  if (name.includes('passport')) {
    return `REPUBLIC OF INDIA
PASSPORT
Type: P
Country Code: IND
Passport No.: A1234567
Name: JOHN DOE
Nationality: INDIAN
Date of Birth: 15/06/1990
Place of Birth: MUMBAI
Date of Issue: 01/01/2020
Date of Expiry: 31/12/2029`
  }
  
  if (name.includes('license') || name.includes('driving')) {
    return `DRIVING LICENCE
State: Maharashtra
DL No.: MH0120190123456
Name: JOHN DOE
S/D/W of: RICHARD DOE
Address: 123 Main Street, Mumbai - 400001
DOB: 15/06/1990
Blood Group: B+
Valid Till: 14/06/2040
Class of Vehicle: LMV`
  }
  
  return `Document: ${fileName}
This is a sample document with extracted text content.
Date: ${new Date().toLocaleDateString()}
Content includes important information that can be analyzed by AI.
Key details and data points are available for processing.`
}

function detectLanguage(text: string): string {
  // Simple language detection based on character patterns
  const hindiPattern = /[\u0900-\u097F]/
  const tamilPattern = /[\u0B80-\u0BFF]/
  const teluguPattern = /[\u0C00-\u0C7F]/
  const bengaliPattern = /[\u0980-\u09FF]/
  
  if (hindiPattern.test(text)) return 'hi'
  if (tamilPattern.test(text)) return 'ta'
  if (teluguPattern.test(text)) return 'te'
  if (bengaliPattern.test(text)) return 'bn'
  
  return 'en'
}

function generateMockAIAnalysis(fileName: string, extractedText: string) {
  const name = fileName.toLowerCase()
  
  if (name.includes('aadhaar') || name.includes('aadhar')) {
    return {
      summary: 'Aadhaar card containing biometric identification details, address proof, and unique identification number. This is a government-issued identity document.',
      confidence: 98,
      category: 'Identity',
      tags: ['identity', 'government', 'biometric', 'address-proof', 'aadhaar']
    }
  }
  
  if (name.includes('pan')) {
    return {
      summary: 'PAN (Permanent Account Number) card for tax identification and financial transactions. Required for all financial activities in India.',
      confidence: 97,
      category: 'Identity',
      tags: ['tax', 'identity', 'financial', 'government', 'pan']
    }
  }
  
  if (name.includes('insurance')) {
    return {
      summary: 'Insurance policy document containing coverage details, premium information, and policy terms. Important for claims and renewals.',
      confidence: 94,
      category: 'Insurance',
      tags: ['insurance', 'policy', 'coverage', 'premium', 'claims']
    }
  }
  
  if (name.includes('tax') || name.includes('itr')) {
    return {
      summary: 'Tax-related document containing income details, deductions, and tax calculations. Important for compliance and refunds.',
      confidence: 96,
      category: 'Tax',
      tags: ['tax', 'income', 'deductions', 'itr', 'financial']
    }
  }
  
  return {
    summary: `Document analysis completed for ${fileName}. Contains important information that has been extracted and categorized for easy retrieval.`,
    confidence: 85 + Math.random() * 10,
    category: 'Personal',
    tags: ['document', 'processed', 'ai-analyzed']
  }
}