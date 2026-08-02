import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { updatePassword } from '../../services/auth'

export const ResetPasswordPage = () => {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (password !== confirmPassword) { setError('Passwords do not match'); return }
    setLoading(true)
    try {
      const result = await updatePassword(password)
      if (!result.success) { setError(result.error); return }
      setSuccess(true)
    } catch { setError('An unexpected error occurred') }
    finally { setLoading(false) }
  }

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    outline: 'none',
    fontSize: '16px',
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

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
            <img src="/flowgram_logo.png" alt="Flowgram" style={{ width: '48px', height: '48px', borderRadius: '10px', marginBottom: '12px', display: 'block' }} />
          </Link>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '0' }}>{success ? 'Password updated' : 'Create new password'}</p>
        </div>

        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          {success ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '9999px', backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
              <h2 style={{ fontSize: '17px', fontWeight: '700', color: '#0f172a', margin: '0 0 10px' }}>Password updated!</h2>
              <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6', margin: '0 0 24px' }}>Your password has been reset successfully. You can now sign in with your new password.</p>
              <button type="button" onClick={() => navigate('/login', { replace: true })} style={{ ...primaryBtnStyle, cursor: 'pointer', opacity: 1 }}>Go to Sign In</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ fontSize: '14px', color: '#475569', margin: '0 0 4px', lineHeight: '1.5' }}>Enter your new password below.</p>
              <input type="password" placeholder="New password (min. 6 characters)" value={password} required minLength={6} onChange={(e) => setPassword(e.target.value)} style={inputStyle} onFocus={(e) => (e.target.style.borderColor = '#1B77CF')} onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')} />
              <input type="password" placeholder="Confirm new password" value={confirmPassword} required onChange={(e) => setConfirmPassword(e.target.value)} style={inputStyle} onFocus={(e) => (e.target.style.borderColor = '#1B77CF')} onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')} />
              {error && <div style={{ padding: '10px 14px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#dc2626', fontSize: '13px' }}>{error}</div>}
              <button type="submit" disabled={loading} style={primaryBtnStyle}>{loading ? 'Updating...' : 'Update Password'}</button>
            </form>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: '13px', color: '#94a3b8', marginTop: '1.25rem' }}>
          <Link to="/login" style={{ color: '#94a3b8', textDecoration: 'underline' }}>← Back to Sign In</Link>
        </p>
      </div>
    </div>
  )
}
