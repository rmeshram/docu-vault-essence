import { serve } from 'std/server'

serve(async (req) => {
  try {
    const body = await req.json()
    // Call OpenAI or your AI pipeline and return assistant message
    return new Response(JSON.stringify({ reply: 'This is a stubbed AI reply.' }), { status: 200 })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
