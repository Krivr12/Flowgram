import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Check, AlertCircle } from 'lucide-react'
import { getCurrentUser, getUserProfile, logout, updateUserProfile } from '../../services/supabase'
import { Toast } from '../../components/Toast'

export const AdminSettingsPage = () => {
  const navigate = useNavigate()

  // ── State ──
  const [profile, setProfile]               = useState(null)
  const [loading, setLoading]               = useState(true)
  const [saving, setSaving]                 = useState(false)
  const [formError, setFormError]           = useState(null)
  const [successToast, setSuccessToast]     = useState(null)
  const [formData, setFormData]             = useState({
    full_name: '',
    linkedin_url: '',
  })

  // ── Fetch user profile on mount ──
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const user = await getCurrentUser()
        if (user) {
          const p = await getUserProfile(user.id)
          if (p) {
            setProfile(p)
            setFormData({
              full_name: p.full_name || '',
              linkedin_url: p.linkedin_url || '',
            })
          }
        }
      } catch (err) {
        console.error('Error fetching profile:', err)
        setFormError('Failed to load profile. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // ── Handle input changes ──
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    setFormError(null)
  }

  // ── Handle save ──
  const handleSave = async () => {
    if (!profile?.id) return

    setSaving(true)
    setFormError(null)

    try {
      // Validate LinkedIn URL format if provided
      if (formData.linkedin_url.trim()) {
        const url = formData.linkedin_url.trim()
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          setFormError('LinkedIn URL must start with http:// or https://')
          setSaving(false)
          return
        }
      }

      // Optimistic update (local state)
      setProfile((prev) => ({
        ...prev,
        full_name: formData.full_name,
        linkedin_url: formData.linkedin_url,
      }))

      // Call API
      await updateUserProfile(profile.id, {
        full_name: formData.full_name,
        linkedin_url: formData.linkedin_url,
      })

      setSuccessToast({
        title: 'Profile Updated',
        message: 'Your account settings have been saved successfully.',
      })
    } catch (err) {
      console.error('Error saving profile:', err)
      // Rollback on error
      setProfile((prev) => ({
        ...prev,
        full_name: profile.full_name,
        linkedin_url: profile.linkedin_url,
      }))
      setFormError('Failed to save changes. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // ── Handle logout ──
  const handleLogout = async () => {
    await logout()
    navigate('/', { replace: true })
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '24px' }}>
        <p style={{ color: '#cbd5e1', fontSize: '14px' }}>Loading…</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '32px 24px' }}>
      {/* Success toast */}
      {successToast && (
        <Toast
          type="notification"
          title={successToast.title}
          message={successToast.message}
          onClose={() => setSuccessToast(null)}
          duration={4000}
        />
      )}

      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        {/* Page header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px' }}>
            Account Settings
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
            Manage your profile and account preferences
          </p>
        </div>

        {/* ── Profile Form Card ── */}
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '28px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          marginBottom: '24px',
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0 0 20px' }}>
            Profile Information
          </h2>

          {/* Error message */}
          {formError && (
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              backgroundColor: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '10px',
              padding: '12px 14px',
              marginBottom: '16px',
            }}>
              <AlertCircle size={16} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
              <p style={{ fontSize: '13px', color: '#991b1b', margin: 0, lineHeight: '1.4' }}>
                {formError}
              </p>
            </div>
          )}

          {/* Email field (disabled) */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '700',
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '8px',
            }}>
              Email Address
            </label>
            <input
              type="email"
              disabled
              value={profile?.email || ''}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#f1f5f9',
                fontSize: '14px',
                color: '#64748b',
                cursor: 'not-allowed',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
              aria-label="Email address (read-only)"
            />
            <p style={{ fontSize: '11px', color: '#94a3b8', margin: '4px 0 0', fontStyle: 'italic' }}>
              Your email address cannot be changed
            </p>
          </div>

          {/* Full Name field (editable) */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '700',
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '8px',
            }}>
              Full Name
            </label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleInputChange}
              placeholder="e.g., Sarah Johnson"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                fontSize: '14px',
                color: '#0f172a',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                transition: 'border-color 0.15s',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#cbd5e1')}
              onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
              aria-label="Full name"
            />
          </div>

          {/* LinkedIn URL field (editable) */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '700',
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '8px',
            }}>
              LinkedIn Profile URL
            </label>
            <input
              type="url"
              name="linkedin_url"
              value={formData.linkedin_url}
              onChange={handleInputChange}
              placeholder="https://linkedin.com/in/username"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                fontSize: '14px',
                color: '#0f172a',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                transition: 'border-color 0.15s',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#cbd5e1')}
              onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
              aria-label="LinkedIn profile URL"
            />
            <p style={{ fontSize: '11px', color: '#94a3b8', margin: '4px 0 0' }}>
              This URL is used to generate your networking QR code
            </p>
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: '100%',
              padding: '11px 16px',
              backgroundColor: saving ? '#cbd5e1' : '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'background-color 0.15s',
            }}
            onMouseEnter={(e) => { if (!saving) e.target.style.backgroundColor = '#1d4ed8' }}
            onMouseLeave={(e) => { if (!saving) e.target.style.backgroundColor = '#2563eb' }}
            aria-label={saving ? 'Saving changes...' : 'Save changes'}
          >
            {saving ? (
              <>
                <div style={{
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff',
                  animation: 'spin 0.8s linear infinite',
                }} />
                Saving…
              </>
            ) : (
              <>
                <Check size={16} />
                Save Changes
              </>
            )}
          </button>
        </div>

        {/* ── Sign Out Section ── */}
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '16px',
          border: '1px solid #fee2e2',
          padding: '28px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#991b1b', margin: '0 0 12px' }}>
            Sign Out
          </h2>
          <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 16px', lineHeight: '1.5' }}>
            You'll be logged out of your account and redirected to the login page.
          </p>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '11px 16px',
              backgroundColor: 'transparent',
              color: '#dc2626',
              border: '1.5px solid #fecaca',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#fee2e2'
              e.target.style.borderColor = '#fca5a5'
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent'
              e.target.style.borderColor = '#fecaca'
            }}
            aria-label="Sign out of your account"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </div>

      {/* Spinner animation */}
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  )
}
