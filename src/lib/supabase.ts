import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kbwyocwpyxncnwmywama.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtid3lvY3dweXhuY253bXl3YW1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNjU2NTYsImV4cCI6MjA3MDY0MTY1Nn0.9FlyNu6YTCkTK_aCgnAcGqYM-SgsRpvKfqb0CrdYt7M'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
  },
})

export default supabase
