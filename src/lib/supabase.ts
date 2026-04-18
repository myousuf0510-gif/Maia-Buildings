import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://iweqvvyfujzdiixsiczz.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3ZXF2dnlmdWp6ZGlpeHNpY3p6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NzA5NjcsImV4cCI6MjA5MDA0Njk2N30.lKKRoxahbm2fZWIUn7172lrudkzOVQV7WHyxRwjniwA'

// Singleton client for browser usage
let client: ReturnType<typeof createSupabaseClient> | null = null

export function createClient() {
  if (!client) {
    client = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  }
  return client
}
