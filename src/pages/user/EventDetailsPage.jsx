import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, MapPin, Calendar } from 'lucide-react'
import { getEventById } from '../../services/events'

// Format: "July 12, 2026 | 1:00 PM"
const formatEventDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const datePart = date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
  const timePart = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC',
  })
  return `${datePart} | ${timePart}`
}

export const EventDetailsPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [event, setEvent]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      const result = await getEventById(id)
      if (!result.success) {
        setError(result.error || 'Failed to load event')
        setLoading(false)
        return
      }
      setEvent(result.data)
      setLoading(false)
    }
    load()
  }, [id])

  const handleViewFlow = () => {
    localStorage.setItem('selected_event_id', id)
    navigate('/app', { replace: true })
  }

  // ── Loading ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        color: '#94a3b8',
        fontSize: '15px',
      }}>
        Loading event details...
      </div>
    )
  }

  // ── Error ────────────────────────────────────────────────────────────────

  if (error || !event) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: '12px',
      }}>
        <p style={{ color: '#dc2626', fontSize: '15px' }}>{error || 'Event not found'}</p>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            backgroundColor: '#fff',
            color: '#0f172a',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          Go Back
        </button>
      </div>
    )
  }

  // ── Page ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ paddingBottom: '120px', minHeight: '100vh' }}>

      {/* ── Back Button ── */}
      <div style={{ marginBottom: '28px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 0',
            background: 'none',
            border: 'none',
            color: '#64748b',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'color 0.15s, transform 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#0f172a'
            e.currentTarget.style.transform = 'translateX(-3px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#64748b'
            e.currentTarget.style.transform = 'translateX(0)'
          }}
        >
          <ChevronLeft size={18} strokeWidth={2.5} />
          Back
        </button>
      </div>

      {/* ── Event Content — flat on page bg ── */}
      <div style={{ marginBottom: '40px' }}>

        {/* Title */}
        <h1 style={{
          fontSize: '30px',
          fontWeight: '800',
          color: '#0f172a',
          margin: '0 0 20px',
          lineHeight: 1.25,
        }}>
          {event.title}
        </h1>

        {/* Date & Venue chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '28px' }}>
          {event.start_date && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              padding: '8px 14px',
              borderRadius: '8px',
              backgroundColor: '#f1f5f9',
              fontSize: '13px',
              fontWeight: '600',
              color: '#475569',
            }}>
              <Calendar size={14} />
              {formatEventDate(event.start_date)}
            </span>
          )}

          {event.venue && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              padding: '8px 14px',
              borderRadius: '8px',
              backgroundColor: '#f1f5f9',
              fontSize: '13px',
              fontWeight: '600',
              color: '#475569',
            }}>
              <MapPin size={14} />
              {event.venue}
            </span>
          )}
        </div>

        {/* Description */}
        {event.description && (
          <p style={{
            fontSize: '15px',
            color: '#475569',
            lineHeight: 1.75,
            margin: 0,
          }}>
            {event.description}
          </p>
        )}
      </div>

      {/* ── Sticky "View Flow" CTA ── */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '16px 24px',
        backgroundColor: '#fff',
        borderTop: '1px solid #e2e8f0',
        zIndex: 30,
        display: 'flex',
        justifyContent: 'center',
      }}>
        <button
          onClick={handleViewFlow}
          style={{
            width: '100%',
            maxWidth: '480px',
            backgroundColor: '#f97316',
            color: '#fff',
            border: 'none',
            padding: '15px 28px',
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'background-color 0.15s, transform 0.1s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#ea580c'
            e.currentTarget.style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#f97316'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          View Flow
        </button>
      </div>
    </div>
  )
}
