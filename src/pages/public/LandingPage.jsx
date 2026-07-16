import { Link } from 'react-router-dom'

export const LandingPage = () => {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fff' }}>

      {/* ── Public Navbar ── */}
      <nav style={{
        backgroundColor: '#fff',
        borderBottom: '1px solid #e5e7eb',
        padding: '0 1.5rem',
        height: '64px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{ fontSize: '1.125rem', fontWeight: '700', color: '#0f172a', letterSpacing: '-0.01em' }}>
          Flowgram
        </span>

        <Link
          to="/login"
          style={{
            padding: '8px 20px',
            backgroundColor: '#2196F3',
            color: '#fff',
            borderRadius: '6px',
            textDecoration: 'none',
            fontWeight: '500',
            fontSize: '14px',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1976D2'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2196F3'}
        >
          Sign In
        </Link>
      </nav>

      {/* ── Hero Section ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 64px)',
        padding: '2rem',
      }}>
        <div style={{ textAlign: 'center', maxWidth: '640px' }}>
          <h1 style={{
            fontSize: '3rem',
            fontWeight: '800',
            color: '#0f172a',
            lineHeight: 1.15,
            marginBottom: '1.25rem',
            letterSpacing: '-0.02em',
          }}>
            Navigate every event,{' '}
            <span style={{ color: '#2196F3' }}>in real time.</span>
          </h1>

          <p style={{
            fontSize: '1.125rem',
            color: '#64748b',
            lineHeight: 1.7,
            marginBottom: '2.5rem',
            maxWidth: '480px',
            margin: '0 auto 2.5rem',
          }}>
            Flowgram keeps attendees informed and organizers in control — live capacity, schedules, and announcements in one place.
          </p>

          <Link
            to="/login"
            style={{
              display: 'inline-block',
              padding: '14px 36px',
              backgroundColor: '#2196F3',
              color: '#fff',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '1rem',
              boxShadow: '0 4px 14px rgba(33,150,243,0.35)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1976D2'
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(33,150,243,0.45)'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#2196F3'
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(33,150,243,0.35)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            Get Started
          </Link>

          <p style={{ fontSize: '0.8125rem', color: '#94a3b8', marginTop: '1rem' }}>
            One login for attendees and organizers alike.
          </p>
        </div>
      </div>
    </div>
  )
}
