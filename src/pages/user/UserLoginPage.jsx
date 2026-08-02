import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  signinWithEmail,
  signinWithGoogle,
  signupWithEmail,
  sendPasswordReset,
  fetchUserProfileWithRetry,
} from '../../services/auth'

export const UserLoginPage = () => {
  const [view, setView] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const routeByRole = (userProfile) => {
    if (userProfile?.role === 'ADMIN') {
      navigate('/admin', { replace: true })
    } else {
      navigate('/app', { replace: true })
    }
  }

  const handleSignIn = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await signinWithEmail(email, password)
      if (!result.success) { setError(result.error); return }
      const userProfile = await fetchUserProfileWithRetry(result.user.id)
      routeByRole(userProfile)
    } catch { setError('An unexpected error occurred') }
    finally { setLoading(false) }
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (password !== confirmPassword) { setError('Passwords do not match'); return }
    setLoading(true)
    try {
      const result = await signupWithEmail(email, password, fullName)
      if (!result.success) { setError(result.error); return }
      if (result.requiresVerification) { setView('signup-verify'); return }
      const userProfile = await fetchUserProfileWithRetry(result.user.id)
      routeByRole(userProfile)
    } catch { setError('An unexpected error occurred') }
    finally { setLoading(false) }
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await sendPasswordReset(email)
      if (!result.success) { setError(result.error); return }
      setView('email-sent')
    } catch { setError('An unexpected error occurred') }
    finally { setLoading(false) }
  }

  const handleGoogleSignin = async () => {
    setError('')
    setLoading(true)
    try {
      const result = await signinWithGoogle()
      if (!result.success) { setError(result.error); setLoading(false) }
    } catch { setError('Google sign-in failed'); setLoading(false) }
  }

  const switchView = (newView) => {
    setView(newView)
    setError('')
    setPassword('')
    setConfirmPassword('')
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

  const primaryBtnStyle = {
    width: '100%',
    padding: '10px',
    backgroundColor: '#1B77CF',
    color: '#fff',
    borderRadius: '8px',
    border: 'none',
    cursor: loading ? 'not-allowed' : 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    opacity: loading ? 0.6 : 1,
    transition: 'background-color 0.15s',
  }

  const headings = {
    signin: 'Welcome back',
    signup: 'Create your account',
    forgot: 'Forgot password',
    'email-sent': 'Check your email',
    'signup-verify': 'Verify your email',
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

        {/* Logo + heading */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <img src="/flowgram_logo.png" alt="Flowgram" style={{ width: '48px', height: '48px', borderRadius: '10px', marginBottom: '12px' }} />
          </Link>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '0' }}>{headings[view]}</p>
        </div>

        {/* ── Email Sent (password reset) ── */}
        {view === 'email-sent' && (
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '9999px', backgroundColor: '#e8f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1B77CF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><polyline points="2,4 12,13 22,4" /></svg>
            </div>
            <h2 style={{ fontSize: '17px', fontWeight: '700', color: '#0f172a', margin: '0 0 10px' }}>Reset link sent</h2>
            <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6', margin: '0 0 24px' }}>
              If an account with <strong>{email}</strong> exists, you'll receive a password reset link. Check your inbox and spam folder.
            </p>
            <button type="button" onClick={() => switchView('signin')} style={{ ...primaryBtnStyle, cursor: 'pointer', opacity: 1 }}>Back to Sign In</button>
          </div>
        )}

        {/* ── Signup Verification ── */}
        {view === 'signup-verify' && (
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '9999px', backgroundColor: '#e8f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1B77CF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><polyline points="2,4 12,13 22,4" /></svg>
            </div>
            <h2 style={{ fontSize: '17px', fontWeight: '700', color: '#0f172a', margin: '0 0 10px' }}>Check your email</h2>
            <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6', margin: '0 0 24px' }}>
              Account created! Please check your <strong>inbox</strong> and <strong>spam</strong> folder to verify your email before logging in.
            </p>
            <button type="button" onClick={() => switchView('signin')} style={{ ...primaryBtnStyle, cursor: 'pointer', opacity: 1 }}>Back to Sign In</button>
          </div>
        )}

        {/* ── Sign In / Sign Up / Forgot Password Forms ── */}
        {(view === 'signin' || view === 'signup' || view === 'forgot') && (
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>

            {/* Google — only on signin/signup */}
            {(view === 'signin' || view === 'signup') && (
              <>
                <button
                  onClick={handleGoogleSignin}
                  disabled={loading}
                  style={{ width: '100%', padding: '10px 16px', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '14px', fontWeight: '500', color: '#334155', opacity: loading ? 0.6 : 1, transition: 'background-color 0.15s' }}
                  onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#f8fafc')}
                  onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#fff')}
                >
                  <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                  Continue with Google
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
                  <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>or</span>
                  <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
                </div>
              </>
            )}

            {/* Sign In */}
            {view === 'signin' && (
              <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input type="email" placeholder="Email address" value={email} required onChange={(e) => setEmail(e.target.value)} style={inputStyle} onFocus={(e) => (e.target.style.borderColor = '#1B77CF')} onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')} />
                <input type="password" placeholder="Password" value={password} required onChange={(e) => setPassword(e.target.value)} style={inputStyle} onFocus={(e) => (e.target.style.borderColor = '#1B77CF')} onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')} />
                <div style={{ textAlign: 'right' }}>
                  <button type="button" onClick={() => switchView('forgot')} style={{ fontSize: '13px', color: '#1B77CF', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: '500' }}>Forgot password?</button>
                </div>
                {error && <ErrorBox message={error} />}
                <button type="submit" disabled={loading} style={primaryBtnStyle}>{loading ? 'Signing in...' : 'Sign In'}</button>
              </form>
            )}

            {/* Sign Up */}
            {view === 'signup' && (
              <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input type="text" placeholder="Full Name" value={fullName} required onChange={(e) => setFullName(e.target.value)} style={inputStyle} onFocus={(e) => (e.target.style.borderColor = '#1B77CF')} onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')} />
                <input type="email" placeholder="Email address" value={email} required onChange={(e) => setEmail(e.target.value)} style={inputStyle} onFocus={(e) => (e.target.style.borderColor = '#1B77CF')} onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')} />
                <input type="password" placeholder="Password (min. 6 characters)" value={password} required minLength={6} onChange={(e) => setPassword(e.target.value)} style={inputStyle} onFocus={(e) => (e.target.style.borderColor = '#1B77CF')} onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')} />
                <input type="password" placeholder="Confirm password" value={confirmPassword} required onChange={(e) => setConfirmPassword(e.target.value)} style={inputStyle} onFocus={(e) => (e.target.style.borderColor = '#1B77CF')} onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')} />
                {error && <ErrorBox message={error} />}
                <button type="submit" disabled={loading} style={primaryBtnStyle}>{loading ? 'Creating account...' : 'Create Account'}</button>
              </form>
            )}

            {/* Forgot Password */}
            {view === 'forgot' && (
              <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p style={{ fontSize: '14px', color: '#475569', margin: '0 0 4px', lineHeight: '1.5' }}>Enter your email and we'll send you a link to reset your password.</p>
                <input type="email" placeholder="Email address" value={email} required onChange={(e) => setEmail(e.target.value)} style={inputStyle} onFocus={(e) => (e.target.style.borderColor = '#1B77CF')} onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')} />
                {error && <ErrorBox message={error} />}
                <button type="submit" disabled={loading} style={primaryBtnStyle}>{loading ? 'Sending...' : 'Send Reset Link'}</button>
                <button type="button" onClick={() => switchView('signin')} style={{ width: '100%', padding: '10px', backgroundColor: 'transparent', color: '#64748b', borderRadius: '8px', border: '1px solid #e2e8f0', cursor: 'pointer', fontWeight: '500', fontSize: '14px', transition: 'background-color 0.15s' }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>Back to Sign In</button>
              </form>
            )}

            {/* Toggle signin/signup */}
            {(view === 'signin' || view === 'signup') && (
              <p style={{ textAlign: 'center', fontSize: '13px', color: '#64748b', marginTop: '16px', marginBottom: 0 }}>
                {view === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button type="button" onClick={() => switchView(view === 'signup' ? 'signin' : 'signup')} style={{ color: '#1B77CF', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '500', fontSize: '13px', padding: 0 }}>
                  {view === 'signup' ? 'Sign In' : 'Sign Up'}
                </button>
              </p>
            )}
          </div>
        )}

        <p style={{ textAlign: 'center', fontSize: '13px', color: '#94a3b8', marginTop: '1.25rem' }}>
          <Link to="/" style={{ color: '#94a3b8', textDecoration: 'underline' }}>← Back to home</Link>
        </p>
      </div>
    </div>
  )
}

const ErrorBox = ({ message }) => (
  <div style={{ padding: '10px 14px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#dc2626', fontSize: '13px' }}>
    {message}
  </div>
)
