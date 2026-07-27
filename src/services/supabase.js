import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check .env.local')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Auth helper: Get the current user
export const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser()
  if (error) {
    console.error('Error fetching current user:', error)
    return null
  }
  return data.user
}

// Auth helper: Get user profile from the users table
export const getUserProfile = async (userId) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    console.error('Error fetching user profile:', error.message, error.details, error.hint)
    return null
  }
  return data
}

// Update (or create) user profile — upsert self-heals missing rows from older accounts
export const updateUserProfile = async (userId, { full_name, linkedin_url, email }) => {
  const { error } = await supabase
    .from('users')
    .upsert(
      {
        id: userId,
        full_name,
        linkedin_url,
        ...(email ? { email } : {}),
      },
      { onConflict: 'id' }
    )

  if (error) {
    console.error('Error upserting user profile:', error.message, error.details, error.hint)
    throw error
  }
}

// Auth helper: Logout
export const logout = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('Error signing out:', error)
  }
}
