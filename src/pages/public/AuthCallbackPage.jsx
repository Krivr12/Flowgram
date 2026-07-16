import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser } from '../../services/supabase'
import { fetchUserProfileWithRetry } from '../../services/auth'

export const AuthCallbackPage = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Wait a moment for Supabase to process the OAuth callback
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Get the current authenticated user
        const user = await getCurrentUser()

        if (!user) {
          setError('Authentication failed. Please try again.')
          setLoading(false)
          return
        }

        // Fetch user profile with retry (profile creation may be delayed on OAuth)
        const userProfile = await fetchUserProfileWithRetry(user.id)

        if (!userProfile) {
          setError('Could not load user profile. Please try again.')
          setLoading(false)
          return
        }

        // Unified Enterprise In-App Toggle routing
        // All users authenticate through the same callback
        // Routing is determined by their role
        if (userProfile.role === 'ADMIN') {
          // Admin users go to /admin dashboard
          navigate('/admin', { replace: true })
        } else {
          // Regular users go to the attendee app
          navigate('/app', { replace: true })
        }
      } catch (err) {
        console.error('Auth callback error:', err)
        setError('An error occurred during authentication. Please try again.')
        setLoading(false)
      }
    }

    handleCallback()
  }, [navigate])

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{ textAlign: 'center' }}>
        {loading && (
          <>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '1rem' }}>
              Signing you in...
            </h2>
            <p style={{ color: '#4b5563' }}>
              Please wait while we process your authentication.
            </p>
            <div style={{
              marginTop: '2rem',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: '#2196F3',
                animation: 'pulse 1s infinite'
              }}></div>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: '#2196F3',
                animation: 'pulse 1s infinite 0.2s'
              }}></div>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: '#2196F3',
                animation: 'pulse 1s infinite 0.4s'
              }}></div>
            </div>
          </>
        )}
        {error && (
          <>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc2626', marginBottom: '1rem' }}>
              Authentication Error
            </h2>
            <p style={{ color: '#4b5563', marginBottom: '2rem' }}>
              {error}
            </p>
            <a
              href="/"
              style={{
                display: 'inline-block',
                padding: '0.75rem 2rem',
                backgroundColor: '#2196F3',
                color: '#fff',
                borderRadius: '0.5rem',
                textDecoration: 'none',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Back to Home
            </a>
          </>
        )}
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  )
}
