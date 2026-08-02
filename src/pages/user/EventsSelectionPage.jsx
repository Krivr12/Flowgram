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

// Status badge styles
const EVENT_STATUS_BADGE = {
  UPCOMING:  { bg: '#eff6ff', text: '#1d4ed8', label: 'Upcoming' },
  STARTED:   { bg: '#fef3c7', text: '#b45309', label: 'Started' },
  FINISHED:  { bg: '#dcfce7', text: '#166534', label: 'Finished' },
  CANCELLED: { bg: '#fee2e2', text: '#991b1b', label: 'Cancelled' },
}

const EVENT_STATUS_BADGE_DARK = {
  UPCOMING:  { bg: 'rgba(99,179,237,0.15)', text: '#93c5fd', label: 'Upcoming' },
  STARTED:   { bg: 'rgba(251,191,36,0.15)', text: '#fcd34d', label: 'Started' },
  FINISHED:  { bg: 'rgba(52,211,153,0.15)', text: '#6ee7b7', label: 'Finished' },
  CANCELLED: { bg: 'rgba(239,68,68,0.15)',  text: '#fca5a5', label: 'Cancelled' },
}

export const EventsSelectionPage = () => {
  const navigate = useNavigate()
  const [events, setEvents]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [isDarkMode, setIsDarkMode] = useState(() =>
    document.documentElement.classList.contains('dark')
  )

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'))
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    loadEvents()
  }, [])

  // Refetch events when window regains focus (ensures fresh data)
  useEffect(() => {
    const handleFocus = () => loadEvents()
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
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
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: isDarkMode ? '#e2e8f0' : '#0f172a', textAlign: 'left', marginBottom: '16px', marginTop: '8px', transition: 'color 0.2s' }}>
          Select Event
        </h1>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          backgroundColor: isDarkMode ? 'rgba(220, 38, 38, 0.1)' : '#fee2e2',
          border: isDarkMode ? '1px solid rgba(220, 38, 38, 0.3)' : '1px solid #fca5a5',
          color: isDarkMode ? '#fca5a5' : '#991b1b',
          padding: '16px',
          borderRadius: '8px',
          fontSize: '14px',
          marginBottom: '24px',
          transition: 'background-color 0.2s, border-color 0.2s, color 0.2s',
        }}>
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 24px', color: isDarkMode ? '#94a3b8' : '#64748b', fontSize: '14px', transition: 'color 0.2s' }}>
          Loading events...
        </div>
      )}

      {/* Empty */}
      {!loading && events.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 24px', color: isDarkMode ? '#94a3b8' : '#64748b', fontSize: '14px', transition: 'color 0.2s' }}>
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
                backgroundColor: isDarkMode ? '#252F3E' : '#fff',
                border: isDarkMode ? '1px solid rgba(100,116,139,0.3)' : '1px solid #e2e8f0',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'all 0.15s, background-color 0.2s, border-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = isDarkMode ? '0 4px 16px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.08)'
                e.currentTarget.style.borderColor = isDarkMode ? 'rgba(100,116,139,0.5)' : '#cbd5e1'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.borderColor = isDarkMode ? 'rgba(100,116,139,0.3)' : '#e2e8f0'
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
                  color: isDarkMode ? '#e2e8f0' : '#0f172a',
                  margin: '0 0 8px',
                  lineHeight: 1.3,
                  transition: 'color 0.2s',
                }}>
                  {event.title}
                </h3>

                {/* Start Date */}
                {event.start_date && (
                  <p style={{
                    fontSize: '13px',
                    color: isDarkMode ? '#94a3b8' : '#64748b',
                    margin: '0 0 4px',
                    fontWeight: '500',
                    transition: 'color 0.2s',
                  }}>
                    {formatEventDate(event.start_date)}
                  </p>
                )}

                {/* End Date */}
                {event.end_date && (
                  <p style={{
                    fontSize: '13px',
                    color: isDarkMode ? '#94a3b8' : '#64748b',
                    margin: '0 0 6px',
                    fontWeight: '500',
                    transition: 'color 0.2s',
                  }}>
                    → {formatEventDate(event.end_date)}
                  </p>
                )}

                {/* Venue */}
                {event.venue && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                    <MapPin size={13} color={isDarkMode ? '#94a3b8' : '#94a3b8'} style={{ flexShrink: 0, transition: 'color 0.2s' }} />
                    <span style={{ fontSize: '13px', color: isDarkMode ? '#94a3b8' : '#94a3b8', fontWeight: '500', transition: 'color 0.2s' }}>
                      {event.venue}
                    </span>
                  </div>
                )}

                {/* Status Badge */}
                {event.event_status && (() => {
                  const badge = isDarkMode
                    ? (EVENT_STATUS_BADGE_DARK[event.event_status] || EVENT_STATUS_BADGE_DARK['UPCOMING'])
                    : (EVENT_STATUS_BADGE[event.event_status] || EVENT_STATUS_BADGE['UPCOMING'])
                  return (
                    <span style={{
                      display: 'inline-block',
                      fontSize: '11px',
                      fontWeight: '700',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      backgroundColor: badge.bg,
                      color: badge.text,
                      marginTop: '10px',
                    }}>
                      {badge.label}
                    </span>
                  )
                })()}
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
                  borderLeft: isDarkMode ? '1px solid rgba(100,116,139,0.3)' : '1px solid #f1f5f9',
                  cursor: 'pointer',
                  color: isDarkMode ? '#64748b' : '#94a3b8',
                  transition: 'background-color 0.15s, color 0.15s, border-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(100,116,139,0.1)' : '#f8fafc'
                  e.currentTarget.style.color = isDarkMode ? '#cbd5e1' : '#475569'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = isDarkMode ? '#64748b' : '#94a3b8'
                }}
              >
                <Info size={17} color="currentColor" strokeWidth={2} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
