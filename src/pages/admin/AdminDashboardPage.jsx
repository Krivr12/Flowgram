import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Calendar, MapPin, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { getAllEvents, deleteEvent } from '../../services/events'


export const AdminDashboardPage = () => {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [menuOpen, setMenuOpen] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null) // { id, title }
  const [successMsg, setSuccessMsg] = useState('')
  const [isDarkMode, setIsDarkMode] = useState(() =>
    document.documentElement.classList.contains('dark')
  )
  const navigate = useNavigate()

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

  const loadEvents = async () => {
    setLoading(true)
    const result = await getAllEvents()
    if (result.success) {
      // Sort by start_date ascending (nearest upcoming first)
      const sorted = (result.data || []).sort((a, b) => {
        const dateA = a.start_date ? new Date(a.start_date).getTime() : Infinity
        const dateB = b.start_date ? new Date(b.start_date).getTime() : Infinity
        return dateA - dateB
      })
      setEvents(sorted)
    } else {
      setError(result.error)
    }
    setLoading(false)
  }

  const handleDeleteRequest = (e, eventId) => {
    e.stopPropagation()
    setMenuOpen(null)
    const ev = events.find((x) => x.id === eventId)
    setDeleteConfirm({ id: eventId, title: ev?.title || 'this event' })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return
    const eventId = deleteConfirm.id
    setDeleteConfirm(null)
    setDeleting(eventId)
    const result = await deleteEvent(eventId)
    if (result.success) {
      setEvents((prev) => prev.filter((ev) => ev.id !== eventId))
      setSuccessMsg('Event deleted!')
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

  return (
    <div>

      {/* ── Delete Confirmation Modal ── */}
      {deleteConfirm && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) setDeleteConfirm(null) }}
        >
          <div style={{ backgroundColor: isDarkMode ? '#252F3E' : '#fff', borderRadius: '14px', padding: '24px', width: '100%', maxWidth: '360px', boxShadow: '0 20px 48px rgba(0,0,0,0.18)', margin: '0 16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: isDarkMode ? '#e2e8f0' : '#0f172a', margin: '0 0 8px' }}>Delete Event?</h3>
            <p style={{ fontSize: '14px', color: isDarkMode ? '#94a3b8' : '#64748b', margin: '0 0 20px', lineHeight: '1.5' }}>
              Are you sure you want to delete "<strong>{deleteConfirm.title}</strong>"? This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ padding: '9px 18px', borderRadius: '8px', border: isDarkMode ? '1px solid rgba(100,116,139,0.3)' : '1px solid #e2e8f0', backgroundColor: 'transparent', color: isDarkMode ? '#cbd5e1' : '#475569', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleDeleteConfirm} style={{ padding: '9px 18px', borderRadius: '8px', border: 'none', backgroundColor: '#dc2626', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Page Header ── */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: '32px',
      }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: isDarkMode ? '#fff' : '#0f172a', margin: 0 }}>
            Select Event
          </h1>
        </div>
        <button
          onClick={() => navigate('/admin/events/new')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#1B77CF',
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
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#155fa3'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1B77CF'}
        >
          <Plus size={16} />
          New Event
        </button>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div style={{
          marginBottom: '24px',
          backgroundColor: isDarkMode ? 'rgba(220,38,38,0.1)' : '#fef2f2',
          border: isDarkMode ? '1px solid rgba(220,38,38,0.3)' : '1px solid #fecaca',
          color: isDarkMode ? '#fca5a5' : '#dc2626',
          padding: '12px 16px',
          borderRadius: '8px',
          fontSize: '14px',
        }}>
          {error}
        </div>
      )}

      {/* ── Success Banner ── */}
      {successMsg && (
        <div style={{
          marginBottom: '24px',
          backgroundColor: isDarkMode ? 'rgba(34,197,94,0.12)' : '#f0fdf4',
          border: isDarkMode ? '1px solid rgba(34,197,94,0.35)' : '1px solid #86efac',
          color: isDarkMode ? '#6ee7b7' : '#166534',
          padding: '12px 16px',
          borderRadius: '8px',
          fontSize: '14px',
        }}>
          {successMsg}
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
              backgroundColor: isDarkMode ? '#252F3E' : '#ffffff',
              borderRadius: '12px',
              border: isDarkMode ? '1px solid rgba(100,116,139,0.3)' : '1px solid #f3f4f6',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}>
              {['65%', '50%', '60%'].map((w, idx) => (
                <div key={idx} style={{ height: idx === 0 ? '18px' : '14px', backgroundColor: isDarkMode ? 'rgba(100,116,139,0.2)' : '#f1f5f9', borderRadius: '6px', width: w }} />
              ))}
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
            backgroundColor: isDarkMode ? 'rgba(100,116,139,0.2)' : '#f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
          }}>
            <Calendar size={28} color="#94a3b8" />
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: isDarkMode ? '#fff' : '#0f172a', margin: '0 0 6px' }}>
            No events yet
          </h2>
          <p style={{ fontSize: '14px', color: isDarkMode ? '#94a3b8' : '#64748b', maxWidth: '340px', margin: '0 0 24px' }}>
            Create your first event to start managing speakers, segments, and notifications.
          </p>
          <button
            onClick={() => navigate('/admin/events/new')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#FFA100',
              color: '#fff',
              fontWeight: '600',
              fontSize: '14px',
              padding: '10px 20px',
              borderRadius: '9999px',
              border: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e89100'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFA100'}
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
              onEdit={() => navigate(`/admin/events/edit/${event.id}`)}
              onMenuToggle={(id) => setMenuOpen(menuOpen === id ? null : id)}
              onMenuClose={() => setMenuOpen(null)}
              onDelete={handleDeleteRequest}
              formatDate={formatDate}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Separated card component for cleaner logic ──
const EventCard = ({ event, menuOpen, deleting, onNavigate, onEdit, onMenuToggle, onMenuClose, onDelete, formatDate }) => {
  const [hovered, setHovered] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(() =>
    document.documentElement.classList.contains('dark')
  )
  const isMenuOpen = menuOpen === event.id

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'))
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  const bgColor = isDarkMode ? '#252F3E' : '#ffffff'
  const borderColor = isDarkMode 
    ? (hovered ? 'rgba(100, 116, 139, 0.5)' : 'rgba(100, 116, 139, 0.3)')
    : (hovered ? '#cbd5e1' : '#f3f4f6')

  return (
    <div
      onClick={onNavigate}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        backgroundColor: bgColor,
        borderRadius: '12px',
        border: `1px solid ${borderColor}`,
        boxShadow: hovered ? '0 4px 16px rgba(0,0,0,0.08)' : '0 1px 3px rgba(0,0,0,0.04)',
        overflow: 'hidden',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        transition: 'box-shadow 0.15s, border-color 0.15s',
      }}
    >
      {/* Three-dot menu */}
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
            background: isMenuOpen ? (isDarkMode ? '#334155' : '#f1f5f9') : 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            color: isDarkMode ? '#cbd5e1' : '#252F3E',
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
              backgroundColor: isDarkMode ? '#334155' : '#fff',
              borderRadius: '10px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              border: isDarkMode ? '1px solid rgba(100,116,139,0.3)' : '1px solid #e2e8f0',
              zIndex: 20,
              overflow: 'hidden',
            }}>
              {/* Edit */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onMenuClose()
                  onEdit()
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 14px',
                  fontSize: '13px',
                  color: isDarkMode ? '#cbd5e1' : '#374151',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: isDarkMode ? '1px solid rgba(100,116,139,0.3)' : '1px solid #f1f5f9',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? '#475569' : '#f8fafc'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Pencil size={13} color={isDarkMode ? '#94a3b8' : '#64748b'} />
                Edit Event
              </button>

              {/* Delete */}
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
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(220,38,38,0.15)' : '#fef2f2'}
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
        {/* Title */}
        <h3 style={{
          fontSize: '17px',
          fontWeight: '800',
          color: isDarkMode ? '#fff' : '#252F3E',
          margin: '0 0 8px',
          lineHeight: 1.3,
          paddingRight: '24px',
        }}>
          {event.title}
        </h3>

        {/* Date */}
        {event.start_date && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13px', color: isDarkMode ? '#cbd5e1' : '#64748b', marginBottom: '6px', fontWeight: '500' }}>
            <Calendar size={13} color={isDarkMode ? '#94a3b8' : '#94a3b8'} style={{ flexShrink: 0 }} />
            <span>
              {formatDate(event.start_date)}
              {event.end_date && <> — {formatDate(event.end_date)}</>}
            </span>
          </div>
        )}

        {/* Venue */}
        {event.venue && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13px', color: isDarkMode ? '#cbd5e1' : '#94a3b8', fontWeight: '500' }}>
            <MapPin size={13} color={isDarkMode ? '#94a3b8' : '#94a3b8'} style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {event.venue}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
