/**
 * @fileoverview Supabase client configuration and initialization.
 * Initializes the client using environment variables with graceful fallback for local development.
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'

/**
 * Flag indicating whether valid Supabase environment credentials are provided.
 */
export const isSupabaseConfigured = !!(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
)

/**
 * Shared Supabase client instance.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
