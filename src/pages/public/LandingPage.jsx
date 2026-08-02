import { Link } from 'react-router-dom'
import { Zap, Bell, Users, MapPin } from 'lucide-react'

const FEATURES = [
  { Icon: Zap, text: 'Follow the live session flow — see what\'s happening now, next, and room capacity' },
  { Icon: Bell, text: 'Receive announcements from organizers in real time' },
  { Icon: MapPin, text: 'Check room details, schedules, and speaker info on the go' },
  { Icon: Users, text: 'Share your LinkedIn profile via QR code for quick networking' },
]

export const LandingPage = () => {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#fff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1.5rem',
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        {/* Header */}
        <div style={{ marginBottom: '1.75rem' }}>
          {/* Logo */}
          <img
            src="/flowgram_logo.png"
            alt="Flowgram logo"
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '12px',
              marginBottom: '1rem',
            }}
          />

          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: '800',
            color: '#0f172a',
            letterSpacing: '-0.02em',
            marginBottom: '0.25rem',
            lineHeight: 1.2,
          }}>
            Flowgram
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
            by AWS Community Day Philippines Team
          </p>
        </div>

        {/* Description */}
        <p style={{
          fontSize: '15px',
          color: '#334155',
          lineHeight: 1.6,
          marginBottom: '1.75rem',
        }}>
          The companion app for attendees. Track sessions, get live updates from organizers, and connect with fellow builders — all from your phone.
        </p>

        {/* Features */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '2rem' }}>
          {FEATURES.map(({ Icon, text }) => (
            <div key={text} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <Icon size={18} color="#FFA100" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span style={{ fontSize: '14px', color: '#475569', lineHeight: 1.5 }}>{text}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Link
          to="/login"
          style={{
            display: 'block',
            width: '100%',
            padding: '14px',
            backgroundColor: '#FFA100',
            color: '#fff',
            borderRadius: '10px',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '15px',
            textAlign: 'center',
            transition: 'background-color 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e89100')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFA100')}
        >
          Get Started
        </Link>

      </div>
    </div>
  )
}
