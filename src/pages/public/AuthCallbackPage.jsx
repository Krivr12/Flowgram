import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, getCurrentUser } from '../../services/supabase'
import { fetchUserProfileWithRetry } from '../../services/auth'

export const AuthCallbackPage = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check for password recovery callback
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const type = hashParams.get('type')
        const queryParams = new URLSearchParams(window.location.search)
        const queryType = queryParams.get('type')

        if (type === 'recovery' || queryType === 'recovery') {
          const { data } = await supabase.auth.getSession()
          if (data.session) {
            navigate('/reset-password', { replace: true })
            return
          }
          await new Promise(resolve => setTimeout(resolve, 1500))
          const { data: retryData } = await supabase.auth.getSession()
          if (retryData.session) {
            navigate('/reset-password', { replace: true })
            return
          }
          setError('Invalid or expired reset link. Please request a new one.')
          setLoading(false)
          return
        }

        // Standard OAuth callback
        await new Promise(resolve => setTimeout(resolve, 1000))
        const user = await getCurrentUser()
        if (!user) { setError('Authentication failed. Please try again.'); setLoading(false); return }

        let userProfile = await fetchUserProfileWithRetry(user.id)
        if (!userProfile) {
          const { error: insertError } = await supabase
            .from('users')
            .insert([{ id: user.id, email: user.email, full_name: user.user_metadata?.full_name || user.user_metadata?.name || '', is_verified: true }])
          if (insertError) { setError('Could not create user profile. Please try again.'); setLoading(false); return }
          userProfile = await fetchUserProfileWithRetry(user.id)
        }

        if (!userProfile) { setError('Could not load user profile. Please try again.'); setLoading(false); return }
        if (userProfile.role === 'ADMIN') { navigate('/admin', { replace: true }) }
        else { navigate('/app', { replace: true }) }
      } catch (err) {
        console.error('Auth callback error:', err)
        setError('An error occurred during authentication. Please try again.')
        setLoading(false)
      }
    }
    handleCallback()
  }, [navigate])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        {loading && (
          <>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '1rem' }}>Signing you in...</h2>
            <p style={{ color: '#4b5563' }}>Please wait while we process your authentication.</p>
            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#1B77CF', animation: 'pulse 1s infinite' }} />
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#1B77CF', animation: 'pulse 1s infinite 0.2s' }} />
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#1B77CF', animation: 'pulse 1s infinite 0.4s' }} />
            </div>
          </>
        )}
        {error && (
          <>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc2626', marginBottom: '1rem' }}>Authentication Error</h2>
            <p style={{ color: '#4b5563', marginBottom: '2rem' }}>{error}</p>
            <a href="/login" style={{ display: 'inline-block', padding: '0.75rem 2rem', backgroundColor: '#1B77CF', color: '#fff', borderRadius: '0.5rem', textDecoration: 'none', fontWeight: '500', cursor: 'pointer' }}>Back to Login</a>
          </>
        )}
      </div>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
    </div>
  )
}
