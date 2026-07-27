import { supabase, logout, getUserProfile } from './supabase'

// Sign up with email
export const signupWithEmail = async (email, password, fullName) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, user: data.user }
}

// Sign in with email
export const signinWithEmail = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, user: data.user }
}

// Sign in with Google
export const signinWithGoogle = async () => {
  // Determine redirect URL based on environment
  let redirectUrl = window.location.origin // fallback
  const appEnv = import.meta.env.VITE_APP_ENV

  if (appEnv === 'development') {
    redirectUrl = 'http://localhost:5173/auth/callback'
  } else if (appEnv === 'production') {
    redirectUrl = 'https://flowgram-orpin.vercel.app/auth/callback'
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
    },
  })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

// Fetch user profile with retry logic (for OAuth where profile creation may be delayed)
export const fetchUserProfileWithRetry = async (userId, maxRetries = 5, delayMs = 500) => {
  let retries = 0

  while (retries < maxRetries) {
    const userProfile = await getUserProfile(userId)
    if (userProfile) {
      return userProfile
    }
    retries++
    if (retries < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }

  return null
}

// Verify admin role and redirect if not authorized
export const verifyAdminRole = async (userProfile) => {
  if (userProfile?.role !== 'ADMIN') {
    await logout()
    return false
  }
  return true
}
