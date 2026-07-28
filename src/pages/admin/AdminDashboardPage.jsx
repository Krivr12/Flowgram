import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Calendar, MapPin, MoreVertical, Trash2 } from 'lucide-react'
import { getAllEvents, deleteEvent } from '../../services/events'


export const AdminDashboardPage = () => {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [menuOpen, setMenuOpen] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    setLoading(true)
    const result = await getAllEvents()
    if (result.success) {
      setEvents(result.data || [])
    } else {
      setError(result.error)
    }
    setLoading(false)
  }

  const handleDelete = async (e, eventId) => {
    e.stopPropagation()
    setDeleting(eventId)
    setMenuOpen(null)
    const result = await deleteEvent(eventId)
    if (result.success) {
      setEvents((prev) => prev.filter((ev) => ev.id !== eventId))
    } else {
      setError(result.error)
    }
    setDeleting(null)
  }

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    })

  // Centered content container — matches navbar inner width
  const containerStyle = {
    maxWidth: '1152px',
    margin: '0 auto',
    padding: '40px 32px',
    width: '100%',
  }

  return (
    <div style={containerStyle}>

      {/* ── Page Header ── */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: '32px',
      }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
            Select Event
          </h1>
        </div>
        <button
          onClick={() => navigate('/admin/events/new')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#f97316',
            color: '#fff',
            fontWeight: '600',
            fontSize: '14px',
            padding: '10px 20px',
            borderRadius: '9999px',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ea580c'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f97316'}
        >
          <Plus size={16} />
          New Event
        </button>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div style={{
          marginBottom: '24px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#dc2626',
          padding: '12px 16px',
          borderRadius: '8px',
          fontSize: '14px',
        }}>
          {error}
        </div>
      )}

      {/* ── Loading Skeletons ── */}
      {loading && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '12px',
        }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #f3f4f6',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}>
              <div style={{ height: '18px', backgroundColor: '#f1f5f9', borderRadius: '6px', width: '65%' }} />
              <div style={{ height: '14px', backgroundColor: '#f1f5f9', borderRadius: '6px', width: '50%' }} />
              <div style={{ height: '14px', backgroundColor: '#f1f5f9', borderRadius: '6px', width: '60%' }} />
            </div>
          ))}
        </div>
      )}

      {/* ── Empty State ── */}
      {!loading && events.length === 0 && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '80px 24px',
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '12px',
            backgroundColor: '#f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
          }}>
            <Calendar size={28} color="#94a3b8" />
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a', margin: '0 0 6px' }}>
            No events yet
          </h2>
          <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '340px', margin: '0 0 24px' }}>
            Create your first event to start managing speakers, segments, and notifications.
          </p>
          <button
            onClick={() => navigate('/admin/events/new')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#f97316',
              color: '#fff',
              fontWeight: '600',
              fontSize: '14px',
              padding: '10px 20px',
              borderRadius: '9999px',
              border: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ea580c'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f97316'}
          >
            <Plus size={16} />
            New Event
          </button>
        </div>
      )}

      {/* ── Event Cards Grid ── */}
      {!loading && events.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '12px',
        }}>
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              menuOpen={menuOpen}
              deleting={deleting}
              onNavigate={() => navigate(`/admin/events/${event.id}/flow`)}
              onMenuToggle={(id) => setMenuOpen(menuOpen === id ? null : id)}
              onMenuClose={() => setMenuOpen(null)}
              onDelete={handleDelete}
              formatDate={formatDate}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Separated card component for cleaner logic ──
const EventCard = ({ event, menuOpen, deleting, onNavigate, onMenuToggle, onMenuClose, onDelete, formatDate }) => {
  const [hovered, setHovered] = useState(false)
  const isMenuOpen = menuOpen === event.id

  return (
    <div
      onClick={onNavigate}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: hovered ? '1px solid #cbd5e1' : '1px solid #f3f4f6',
        boxShadow: hovered ? '0 4px 16px rgba(0,0,0,0.08)' : '0 1px 3px rgba(0,0,0,0.04)',
        overflow: 'hidden',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        transition: 'box-shadow 0.15s, border-color 0.15s',
      }}
    >
      {/* Three-dot menu — positioned inside card, only visible on hover */}
      <div style={{ position: 'absolute', top: '14px', right: '14px', zIndex: 1 }}>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onMenuToggle(event.id)
          }}
          style={{
            padding: '6px',
            borderRadius: '6px',
            border: 'none',
            background: isMenuOpen ? '#f1f5f9' : 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            opacity: hovered || isMenuOpen ? 1 : 0,
            transition: 'opacity 0.15s',
            color: '#64748b',
          }}
        >
          <MoreVertical size={15} />
        </button>

        {isMenuOpen && (
          <>
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 10 }}
              onClick={(e) => {
                e.stopPropagation()
                onMenuClose()
              }}
            />
            <div style={{
              position: 'absolute',
              right: 0,
              top: 'calc(100% + 4px)',
              width: '160px',
              backgroundColor: '#fff',
              borderRadius: '10px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              border: '1px solid #e2e8f0',
              zIndex: 20,
              overflow: 'hidden',
            }}>
              <button
                onClick={(e) => onDelete(e, event.id)}
                disabled={deleting === event.id}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 14px',
                  fontSize: '13px',
                  color: '#dc2626',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  opacity: deleting === event.id ? 0.5 : 1,
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Trash2 size={13} />
                {deleting === event.id ? 'Deleting…' : 'Delete Event'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Card body */}
      <div style={{ flex: 1, padding: '20px 20px', minWidth: 0 }}>
        {/* Title — Navy Blue, bold, matches User View */}
        <h3 style={{
          fontSize: '17px',
          fontWeight: '800',
          color: '#252F3E',
          margin: '0 0 8px',
          lineHeight: 1.3,
          paddingRight: '24px',
        }}>
          {event.title}
        </h3>

        {/* Date */}
        {event.start_date && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13px', color: '#64748b', marginBottom: '6px', fontWeight: '500' }}>
            <Calendar size={13} color="#94a3b8" style={{ flexShrink: 0 }} />
            <span>
              {formatDate(event.start_date)}
              {event.end_date && (
                <> — {formatDate(event.end_date)}</>
              )}
            </span>
          </div>
        )}

        {/* Venue */}
        {event.venue && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13px', color: '#94a3b8', fontWeight: '500' }}>
            <MapPin size={13} color="#94a3b8" style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {event.venue}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

