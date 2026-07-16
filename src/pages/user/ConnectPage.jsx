import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import QRCode from 'react-qr-code'
import { getCurrentUser, getUserProfile } from '../../services/supabase'
import { ExternalLink, QrCode, UserCircle, ArrowRight, Copy, Check } from 'lucide-react'

const getInitials = (name) => {
  if (!name) return '?'
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

export const ConnectPage = () => {
  const navigate = useNavigate()

  const [profile, setProfile]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [copied, setCopied]     = useState(false)

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
        console.error('ConnectPage load error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleCopy = async () => {
    if (!profile?.linkedin_url) return
    try {
      await navigator.clipboard.writeText(profile.linkedin_url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback: select the input text
    }
  }

  const hasLinkedIn = profile?.linkedin_url && profile.linkedin_url.trim() !== ''

  // ── Loading ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div
        style={{
          minHeight: 'calc(100vh - 128px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#94a3b8',
          fontSize: '14px',
        }}
      >
        Loading…
      </div>
    )
  }

  // ── Page ─────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 128px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        backgroundColor: '#f8fafc',
      }}
    >
      {/* Floating business card */}
      <div
        style={{
          width: '100%',
          maxWidth: '380px',
          backgroundColor: '#fff',
          borderRadius: '24px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
        }}
      >
        {/* Dark header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
            padding: '32px 28px 28px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            position: 'relative',
          }}
        >
          {/* Decorative rings */}
          <div
            style={{
              position: 'absolute',
              top: '-30px',
              right: '-30px',
              width: '140px',
              height: '140px',
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.05)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '-5px',
              right: '-5px',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.05)',
              pointerEvents: 'none',
            }}
          />

          {/* Avatar */}
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              fontWeight: '800',
              color: '#fff',
              marginBottom: '14px',
              boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
              flexShrink: 0,
            }}
          >
            {getInitials(profile?.full_name)}
          </div>

          <p
            style={{
              fontSize: '11px',
              fontWeight: '700',
              color: '#f97316',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              margin: '0 0 6px',
            }}
          >
            My Networking Card
          </p>

          <h1
            style={{
              fontSize: '22px',
              fontWeight: '800',
              color: '#f8fafc',
              margin: 0,
              lineHeight: '1.2',
            }}
          >
            {profile?.full_name || 'Your Name'}
          </h1>
        </div>

        {/* Card body */}
        <div style={{ padding: '28px' }}>

          {hasLinkedIn ? (
            <>
              {/* QR Code block */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '20px',
                }}
              >
                <p
                  style={{
                    fontSize: '13px',
                    color: '#64748b',
                    textAlign: 'center',
                    margin: 0,
                    lineHeight: '1.5',
                  }}
                >
                  Point a camera at the QR code to open your LinkedIn profile.
                </p>

                {/* QR code */}
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

                {/* Read-only LinkedIn URL row */}
                <div style={{ width: '100%' }}>
                  <p
                    style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      color: '#94a3b8',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      margin: '0 0 6px',
                    }}
                  >
                    LinkedIn URL
                  </p>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      backgroundColor: '#f8fafc',
                    }}
                  >
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
                      onMouseEnter={(e) => {
                        if (!copied) e.currentTarget.style.backgroundColor = '#f1f5f9'
                      }}
                      onMouseLeave={(e) => {
                        if (!copied) e.currentTarget.style.backgroundColor = '#fff'
                      }}
                      aria-label="Copy LinkedIn URL"
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                {/* External link */}
                <a
                  href={profile.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    color: '#2563eb',
                    fontWeight: '600',
                    textDecoration: 'none',
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#1d4ed8')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#2563eb')}
                >
                  <ExternalLink size={13} />
                  Open LinkedIn
                </a>
              </div>
            </>
          ) : (
            /* ── No LinkedIn empty state ── */
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: '16px',
                padding: '8px 0 4px',
              }}
            >
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
                <h2
                  style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    color: '#0f172a',
                    margin: '0 0 6px',
                  }}
                >
                  No LinkedIn link yet
                </h2>
                <p
                  style={{
                    fontSize: '13px',
                    color: '#64748b',
                    lineHeight: '1.55',
                    margin: 0,
                    maxWidth: '280px',
                  }}
                >
                  Add a LinkedIn URL to your profile to generate your personal networking QR code.
                </p>
              </div>

              <button
                onClick={() => navigate('/app/account')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#f97316',
                  color: '#fff',
                  border: 'none',
                  padding: '11px 22px',
                  borderRadius: '24px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#ea580c')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f97316')}
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
