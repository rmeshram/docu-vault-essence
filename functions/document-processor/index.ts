import { serve } from 'std/server'

serve(async (req) => {
  try {
    const body = await req.json()
    // Trigger OCR/AI processing pipeline or enqueue job
    return new Response(JSON.stringify({ status: 'processing', document_id: body.documentId }), { status: 200 })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
