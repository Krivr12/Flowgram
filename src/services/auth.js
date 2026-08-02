import { supabase, logout, getUserProfile } from './supabase'

// Sign up with email and create user profile
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

  // Create user profile row in users table
  // Email confirm is ON, so data.session will be null until the user verifies
  if (data.user) {
    const { error: profileError } = await supabase
      .from('users')
      .insert([
        {
          id: data.user.id,
          email: data.user.email,
          full_name: fullName,
        },
      ])

    if (profileError) {
      // Gracefully ignore duplicate key / 409 conflicts — user may have double-clicked
      // or the auth trigger already created the row. Treat as success.
      const isDuplicate =
        profileError.code === '23505' ||
        profileError.message?.toLowerCase().includes('duplicate') ||
        profileError.message?.toLowerCase().includes('already exists') ||
        profileError.details?.toLowerCase().includes('already exists')

      if (!isDuplicate) {
        console.error('Error creating user profile:', profileError.message)
        return { success: false, error: 'Failed to create user profile' }
      }

      console.warn('Profile row already exists — treating signup as success.')
    }
  }

  // When email confirmation is enabled, Supabase returns user but no session
  const requiresVerification = data.user !== null && data.session === null
  return { success: true, user: data.user, requiresVerification }
}

// Sign in with email
export const signinWithEmail = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    // Supabase returns "Email not confirmed" when the user hasn't verified yet
    if (error.message?.toLowerCase().includes('email not confirmed')) {
      return {
        success: false,
        error: 'Account not yet verified. Please check your email inbox or spam folder to confirm your account.',
      }
    }
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

// Send password reset email
export const sendPasswordReset = async (email) => {
  const redirectUrl = import.meta.env.VITE_APP_ENV === 'production'
    ? 'https://flowgram-orpin.vercel.app/auth/callback?type=recovery'
    : `${window.location.origin}/auth/callback?type=recovery`

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

// Update password (used after reset link is clicked)
export const updatePassword = async (newPassword) => {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

// Verify admin role and redirect if not authorized
export const verifyAdminRole = async (userProfile) => {
  if (userProfile?.role !== 'ADMIN') {
    await logout()
    return false
  }
  return true
}
