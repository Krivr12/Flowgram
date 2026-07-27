import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signinWithEmail, signinWithGoogle, signupWithEmail, fetchUserProfileWithRetry } from '../../services/auth'

export const UserLoginPage = () => {
  const [isSignup, setIsSignup] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSignupSuccess, setIsSignupSuccess] = useState(false)
  const navigate = useNavigate()

  // Shared post-auth routing: check role, send to correct dashboard
  const routeByRole = (userProfile) => {
    if (userProfile?.role === 'ADMIN') {
      navigate('/admin', { replace: true })
    } else {
      navigate('/app', { replace: true })
    }
  }

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    if (isSubmitting) return  // hard guard against double-fire
    setError('')
    setLoading(true)
    setIsSubmitting(true)

    try {
      if (isSignup) {
        const result = await signupWithEmail(email, password, fullName)

        if (!result.success) {
          setError(result.error)
          return
        }

        // Email confirmation is enabled — session is null, show verification screen
        if (result.requiresVerification) {
          setEmail('')
          setPassword('')
          setFullName('')
          setIsSignupSuccess(true)
          setEmailSent(true)
          return
        }

        // Email confirmation disabled (e.g. dev mode) — session exists, proceed normally
        const userProfile = await fetchUserProfileWithRetry(result.user.id)
        if (userProfile) {
          routeByRole(userProfile)
        } else {
          navigate('/app', { replace: true })
        }
      } else {
        const result = await signinWithEmail(email, password)

        if (!result.success) {
          setError(result.error)
          return
        }

        const userProfile = await fetchUserProfileWithRetry(result.user.id)
        if (userProfile) {
          routeByRole(userProfile)
        } else {
          navigate('/app', { replace: true })
        }
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
      // Only re-enable submitting on failure — on success we navigate or show static screen
      if (!isSignupSuccess) setIsSubmitting(false)
    }
  }

  const handleGoogleSignin = async () => {
    setError('')
    setLoading(true)
    try {
      const result = await signinWithGoogle()
      if (!result.success) {
        setError(result.error)
        setLoading(false)
      }
      // Supabase redirects to /auth/callback which handles role routing
    } catch (err) {
      setError('Google sign-in failed')
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    outline: 'none',
    fontSize: '14px',
    color: '#0f172a',
    backgroundColor: '#fff',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' }}>
              Flowgram
            </span>
          </Link>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '6px' }}>
            {emailSent ? 'Verify your email' : isSignup ? 'Create your account' : 'Welcome back'}
          </p>
        </div>

        {/* ── Email Verification Success Screen ── */}
        {emailSent ? (
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '2rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            textAlign: 'center',
          }}>
            {/* Mail icon */}
            <div style={{
              width: '56px', height: '56px', borderRadius: '9999px',
              backgroundColor: '#eff6ff', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <polyline points="2,4 12,13 22,4" />
              </svg>
            </div>

            <h2 style={{ fontSize: '17px', fontWeight: '700', color: '#0f172a', margin: '0 0 10px' }}>
              Check your email
            </h2>
            <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6', margin: '0 0 24px' }}>
              Account created! Please check your <strong>Inbox</strong> and <strong>Spam</strong> folder to verify your email before logging in.
            </p>

            <button
              type="button"
              onClick={() => { setEmailSent(false); setIsSignup(false); setError('') }}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#2196F3',
                color: '#fff',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1976D2'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2196F3'}
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          /* ── Normal Login / Signup Card ── */
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '2rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}>

            {/* Google Sign-In (primary CTA) */}
            <button
              onClick={handleGoogleSignin}
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px 16px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                backgroundColor: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#334155',
                opacity: loading ? 0.6 : 1,
                transition: 'background-color 0.15s',
              }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#f8fafc')}
              onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#fff')}
            >
              {/* Google "G" SVG */}
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>or</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {isSignup && (
                <input
                  type="text"
                  placeholder="Full Name"
                  value={fullName}
                  required
                  onChange={(e) => setFullName(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = '#2196F3'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              )}
              <input
                type="email"
                placeholder="Email address"
                value={email}
                required
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#2196F3'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                required
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#2196F3'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />

              {error && (
                <div style={{
                  padding: '10px 14px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '6px',
                  color: '#dc2626',
                  fontSize: '13px',
                }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || (isSignup && isSubmitting)}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: isSignup && isSignupSuccess ? '#94a3b8' : '#2196F3',
                  color: '#fff',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: (loading || (isSignup && isSubmitting)) ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  opacity: loading ? 0.6 : 1,
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (!loading && !(isSignup && isSubmitting)) {
                    e.currentTarget.style.backgroundColor = isSignup && isSignupSuccess ? '#94a3b8' : '#1976D2'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading && !(isSignup && isSubmitting)) {
                    e.currentTarget.style.backgroundColor = isSignup && isSignupSuccess ? '#94a3b8' : '#2196F3'
                  }
                }}
              >
                {loading ? 'Please wait...' : isSignup ? 'Create Account' : 'Sign In'}
              </button>

              {/* Go to Login — shown after successful signup */}
              {isSignup && isSignupSuccess && (
                <button
                  type="button"
                  onClick={() => {
                    setIsSignup(false)
                    setIsSignupSuccess(false)
                    setIsSubmitting(false)
                    setEmailSent(false)
                    setError('')
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: 'transparent',
                    color: '#2196F3',
                    borderRadius: '8px',
                    border: '1px solid #2196F3',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '14px',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#eff6ff'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  Go to Login page
                </button>
              )}
            </form>

            {/* Toggle Signup/Signin */}
            <p style={{ textAlign: 'center', fontSize: '13px', color: '#64748b', marginTop: '16px', marginBottom: 0 }}>
              {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={() => { setIsSignup(!isSignup); setError('') }}
                style={{
                  color: '#2196F3',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  background: 'none',
                  border: 'none',
                  fontWeight: '500',
                  fontSize: '13px',
                  padding: 0,
                }}
              >
                {isSignup ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>
        )}

        {/* Back to home */}
        <p style={{ textAlign: 'center', fontSize: '13px', color: '#94a3b8', marginTop: '1.25rem' }}>
          <Link to="/" style={{ color: '#94a3b8', textDecoration: 'underline' }}>
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  )
}
