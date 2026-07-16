import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signinWithEmail, signinWithGoogle, fetchUserProfileWithRetry, verifyAdminRole } from '../../services/auth'
import { logout } from '../../services/supabase'

export const AdminLoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signinWithEmail(email, password)
      
      if (result.success) {
        // Fetch user profile to check role
        const userProfile = await fetchUserProfileWithRetry(result.user.id)

        if (!userProfile) {
          setError('Failed to load user profile. Please try again.')
          setLoading(false)
          return
        }

        // Strict RBAC: Only ADMIN role can access admin portal
        if (userProfile.role !== 'ADMIN') {
          // Non-admin user attempted admin login - reject and logout
          await logout()
          setError('Unauthorized: Admin access required')
          setLoading(false)
          return
        }

        // Admin user - redirect to admin dashboard
        navigate('/admin')
      } else {
        setError(result.error)
        setLoading(false)
      }
    } catch (err) {
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  const handleGoogleSignin = async () => {
    setError('')
    setLoading(true)

    try {
      const result = await signinWithGoogle()
      if (!result.success) {
        setError(result.error)
      }
      // OAuth redirects to /auth/callback which handles role-based routing
    } catch (err) {
      setError('Google sign-in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#111827',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '28rem',
        backgroundColor: '#fff',
        borderRadius: '0.5rem',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        padding: '2rem'
      }}>
        <h1 style={{ 
          fontSize: '1.875rem', 
          fontWeight: 'bold', 
          textAlign: 'center', 
          color: '#111827',
          marginBottom: '0.5rem'
        }}>
          Flowgram
        </h1>
        <p style={{ textAlign: 'center', color: '#4b5563', marginBottom: '2rem' }}>
          Admin Portal
        </p>

        <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem 1rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem',
              outline: 'none',
              fontSize: '1rem'
            }}
            onFocus={(e) => e.target.style.borderColor = '#2196F3'}
            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem 1rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem',
              outline: 'none',
              fontSize: '1rem'
            }}
            onFocus={(e) => e.target.style.borderColor = '#2196F3'}
            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
          />
          {error && <div style={{ color: '#dc2626', fontSize: '0.875rem' }}>{error}</div>}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.5rem',
              backgroundColor: '#FF9800',
              color: '#fff',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '500',
              opacity: loading ? 0.5 : 1
            }}
            onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#F57C00')}
            onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#FF9800')}
          >
            {loading ? 'Verifying...' : 'Sign In'}
          </button>
        </form>

        <div style={{ margin: '1.5rem 0', display: 'flex', alignItems: 'center' }}>
          <div style={{ flex: 1, borderTop: '1px solid #d1d5db' }}></div>
          <span style={{ padding: '0 0.75rem', color: '#6b7280' }}>or</span>
          <div style={{ flex: 1, borderTop: '1px solid #d1d5db' }}></div>
        </div>

        <button
          onClick={handleGoogleSignin}
          disabled={loading}
          style={{
            width: '100%',
            padding: '0.5rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            backgroundColor: '#fff',
            opacity: loading ? 0.5 : 1
          }}
          onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#f3f4f6')}
          onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#fff')}
        >
          Sign in with Google
        </button>

        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#6b7280', marginTop: '1.5rem' }}>
          Not an admin?{' '}
          <Link to="/login" style={{ color: '#2196F3', textDecoration: 'underline' }}>
            User Login
          </Link>
        </p>
      </div>
    </div>
  )
}
