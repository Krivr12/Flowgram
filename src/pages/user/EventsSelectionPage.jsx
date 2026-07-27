import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, MapPin, Users } from 'lucide-react'
import { getAllEvents } from '../../services/events'

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatDateRange = (startStr, endStr) => {
  const start = new Date(startStr)
  const end = new Date(endStr)

  const startDate = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const endDate = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return `${startDate} - ${endDate}`
}

export const EventsSelectionPage = () => {
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
    <div
      style={{
        maxWidth: '100%',
        padding: '0 24px',
        paddingTop: '40px',
        paddingBottom: '80px',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1
          style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#0f172a',
            marginBottom: '8px',
          }}
        >
          Select Event
        </h1>
      </div>

      {/* Error Alert */}
      {error && (
        <div
          style={{
            backgroundColor: '#fee2e2',
            border: '1px solid #fca5a5',
            color: '#991b1b',
            padding: '16px',
            borderRadius: '8px',
            fontSize: '14px',
            marginBottom: '24px',
          }}
        >
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 24px',
            color: '#64748b',
            fontSize: '14px',
          }}
        >
          Loading events...
        </div>
      )}

      {/* Empty State */}
      {!loading && events.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 24px',
            color: '#64748b',
            fontSize: '14px',
          }}
        >
          No events available yet.
        </div>
      )}

      {/* Events Grid */}
      {!loading && events.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '24px',
          }}
        >
          {events.map((event) => (
            <div
              key={event.id}
              onClick={() => handleSelectEvent(event.id)}
              style={{
                backgroundColor: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '24px',
                cursor: 'pointer',
                transition: 'all 0.15s',
                display: 'flex',
                flexDirection: 'column',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)'
                e.currentTarget.style.borderColor = '#cbd5e1'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.borderColor = '#e2e8f0'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              {/* Event Title */}
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  color: '#0f172a',
                  marginBottom: '16px',
                  lineHeight: '1.4',
                  flex: 1,
                }}
              >
                {event.title}
              </h3>

              {/* Event Details */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  marginBottom: '20px',
                  fontSize: '13px',
                  color: '#64748b',
                }}
              >
                {/* Date Range */}
                {event.start_date && event.end_date && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <Calendar size={16} color="#94a3b8" style={{ flexShrink: 0 }} />
                    <span>{formatDateRange(event.start_date, event.end_date)}</span>
                  </div>
                )}

                {/* Venue */}
                {event.venue && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <MapPin size={16} color="#94a3b8" style={{ flexShrink: 0 }} />
                    <span>{event.venue}</span>
                  </div>
                )}

                {/* Description */}
                {event.description && (
                  <p
                    style={{
                      fontSize: '13px',
                      color: '#64748b',
                      lineHeight: '1.4',
                      marginTop: '8px',
                    }}
                  >
                    {event.description.substring(0, 100)}
                    {event.description.length > 100 ? '...' : ''}
                  </p>
                )}
              </div>

              {/* CTA Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleSelectEvent(event.id)
                }}
                style={{
                  backgroundColor: '#f97316',
                  color: '#fff',
                  border: 'none',
                  padding: '12px 20px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#ea580c')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f97316')}
              >
                View Schedule
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
