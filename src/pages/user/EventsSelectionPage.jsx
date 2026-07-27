import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Info } from 'lucide-react'
import { getAllEvents } from '../../services/events'

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

export const EventsSelectionPage = () => {
  const navigate = useNavigate()
  const [events, setEvents]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    setLoading(true)
    setError('')
    const result = await getAllEvents()
    if (result.success) {
      setEvents(result.data || [])
    } else {
      setError(result.error || 'Failed to load events')
    }
    setLoading(false)
  }

  const handleSelectEvent = (eventId) => {
    localStorage.setItem('selected_event_id', eventId)
    navigate('/app', { replace: true })
  }

  return (
    <div style={{ maxWidth: '100%', paddingTop: '16px', paddingBottom: '80px' }}>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
          Select Event
        </h1>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          backgroundColor: '#fee2e2',
          border: '1px solid #fca5a5',
          color: '#991b1b',
          padding: '16px',
          borderRadius: '8px',
          fontSize: '14px',
          marginBottom: '24px',
        }}>
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 24px', color: '#64748b', fontSize: '14px' }}>
          Loading events...
        </div>
      )}

      {/* Empty */}
      {!loading && events.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 24px', color: '#64748b', fontSize: '14px' }}>
          No events available yet.
        </div>
      )}

      {/* Event List */}
      {!loading && events.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {events.map((event) => (
            <div
              key={event.id}
              style={{
                backgroundColor: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'
                e.currentTarget.style.borderColor = '#cbd5e1'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.borderColor = '#e2e8f0'
              }}
            >
              {/* ── Clickable main body → selects event & goes to Flow ── */}
              <div
                onClick={() => handleSelectEvent(event.id)}
                style={{
                  flex: 1,
                  padding: '20px 20px',
                  minWidth: 0,
                }}
              >
                {/* Title */}
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '800',
                  color: '#0f172a',
                  margin: '0 0 8px',
                  lineHeight: 1.3,
                }}>
                  {event.title}
                </h3>

                {/* Date */}
                {event.start_date && (
                  <p style={{
                    fontSize: '13px',
                    color: '#64748b',
                    margin: '0 0 6px',
                    fontWeight: '500',
                  }}>
                    {formatEventDate(event.start_date)}
                  </p>
                )}

                {/* Venue */}
                {event.venue && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <MapPin size={13} color="#94a3b8" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '500' }}>
                      {event.venue}
                    </span>
                  </div>
                )}
              </div>

              {/* ── Info icon → navigates to EventDetailsPage ── */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(`/app/event/${event.id}`)
                }}
                aria-label="View event details"
                style={{
                  flexShrink: 0,
                  width: '52px',
                  alignSelf: 'stretch',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'none',
                  border: 'none',
                  borderLeft: '1px solid #f1f5f9',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  transition: 'background-color 0.15s, color 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8fafc'
                  e.currentTarget.style.color = '#475569'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = '#94a3b8'
                }}
              >
                <Info size={17} color="#94a3b8" strokeWidth={2} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
