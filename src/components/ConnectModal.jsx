import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import QRCode from 'react-qr-code'
import { getCurrentUser, getUserProfile } from '../services/supabase'
import { ExternalLink, QrCode, UserCircle, ArrowRight, Copy, Check, X } from 'lucide-react'

export const ConnectModal = ({ onClose }) => {
  const navigate = useNavigate()

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied]   = useState(false)

  // Load profile on mount
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const user = await getCurrentUser()
        if (user) {
          const p = await getUserProfile(user.id)
          setProfile(p)
        }
      } catch (err) {
        console.error('ConnectModal load error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const handleCopy = async () => {
    if (!profile?.linkedin_url) return
    try {
      await navigator.clipboard.writeText(profile.linkedin_url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard unavailable — silent fail
    }
  }

  const hasLinkedIn = Boolean(profile?.linkedin_url?.trim())

  return (
    // Backdrop
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.55)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backdropFilter: 'blur(3px)',
      }}
    >
      {/* Card — stop backdrop-close when clicking inside */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '380px',
          backgroundColor: '#fff',
          borderRadius: '24px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.2)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* ── Dark header ── */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
            padding: '24px 28px 22px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            position: 'relative',
          }}
        >
          {/* Decorative rings */}
          <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '140px', height: '140px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: '-5px', right: '-5px', width: '80px', height: '80px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.05)', pointerEvents: 'none' }} />

          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '14px',
              right: '14px',
              width: '30px',
              height: '30px',
              borderRadius: '8px',
              border: 'none',
              background: 'rgba(255,255,255,0.1)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              transition: 'background 0.15s',
              zIndex: 1,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
            aria-label="Close"
          >
            <X size={15} />
          </button>

          {/* Avatar removed */}

          <p style={{ fontSize: '11px', fontWeight: '700', color: '#FFA100', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>
            My Networking Card
          </p>

          <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#f8fafc', margin: 0, lineHeight: '1.2' }}>
            {loading ? '…' : (profile?.full_name || 'Your Name')}
          </h2>
        </div>

        {/* ── Card body ── */}
        <div style={{ padding: '28px' }}>

          {/* Loading state */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8', fontSize: '14px' }}>
              Loading…
            </div>
          )}

          {/* Has LinkedIn → show QR + URL */}
          {!loading && hasLinkedIn && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
              <p style={{ fontSize: '13px', color: '#64748b', textAlign: 'center', margin: 0, lineHeight: '1.5' }}>
                Point a camera at the QR code to open your LinkedIn profile.
              </p>

              {/* QR Code */}
              <div
                style={{
                  padding: '16px',
                  backgroundColor: '#fff',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  display: 'inline-block',
                }}
              >
                <QRCode
                  value={profile.linkedin_url}
                  size={180}
                  bgColor="#ffffff"
                  fgColor="#0f172a"
                  level="M"
                />
              </div>

              {/* Read-only URL + copy */}
              <div style={{ width: '100%' }}>
                <p style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px' }}>
                  LinkedIn URL
                </p>
                <div style={{ display: 'flex', border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', backgroundColor: '#f8fafc' }}>
                  <input
                    readOnly
                    value={profile.linkedin_url}
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      fontSize: '12px',
                      color: '#475569',
                      outline: 'none',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      minWidth: 0,
                    }}
                  />
                  <button
                    onClick={handleCopy}
                    title={copied ? 'Copied!' : 'Copy URL'}
                    style={{
                      flexShrink: 0,
                      padding: '10px 12px',
                      border: 'none',
                      borderLeft: '1px solid #e2e8f0',
                      backgroundColor: copied ? '#f0fdf4' : '#fff',
                      cursor: 'pointer',
                      color: copied ? '#16a34a' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background-color 0.15s, color 0.15s',
                    }}
                    onMouseEnter={(e) => { if (!copied) e.currentTarget.style.backgroundColor = '#f1f5f9' }}
                    onMouseLeave={(e) => { if (!copied) e.currentTarget.style.backgroundColor = '#fff' }}
                    aria-label="Copy LinkedIn URL"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              {/* Open LinkedIn */}
              <a
                href={profile.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  color: '#1B77CF',
                  fontWeight: '600',
                  textDecoration: 'none',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#155fa3')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#1B77CF')}
              >
                <ExternalLink size={13} />
                Open LinkedIn
              </a>
            </div>
          )}

          {/* No LinkedIn → empty state */}
          {!loading && !hasLinkedIn && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px', padding: '8px 0 4px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '14px',
                  backgroundColor: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <QrCode size={26} color="#94a3b8" />
              </div>

              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0 0 6px' }}>
                  No LinkedIn link yet
                </h3>
                <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.55', margin: 0, maxWidth: '280px' }}>
                  Add a LinkedIn URL to your profile to generate your personal networking QR code.
                </p>
              </div>

              <button
                onClick={() => { onClose(); navigate('/app/account') }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#FFA100',
                  color: '#fff',
                  border: 'none',
                  padding: '11px 22px',
                  borderRadius: '24px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e89100')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFA100')}
              >
                <UserCircle size={15} />
                Go to Account Settings
                <ArrowRight size={14} />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
