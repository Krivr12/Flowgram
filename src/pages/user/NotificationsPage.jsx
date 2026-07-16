import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, AlertCircle, ArrowRight } from 'lucide-react'
import { getNotificationsByEventId } from '../../services/notifications'

const formatDateTime = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const NotificationsPage = () => {
  const navigate                          = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState('')

  // Read once on mount — stable reference so we don't re-render on every
  // pathname change the way UserLayout does.
  const selectedEventId = localStorage.getItem('selected_event_id')

  useEffect(() => {
    loadNotifications()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadNotifications = async () => {
    setLoading(true)
    setError('')

    const eventId = localStorage.getItem('selected_event_id')

    // Early-exit guard: reset loading so spinner doesn't stick
    if (!eventId) {
      setLoading(false)
      return
    }

    try {
      const result = await getNotificationsByEventId(eventId)
      if (result.success) {
        setNotifications(result.data || [])
      } else {
        setError(result.error || 'Failed to load notifications')
      }
    } catch (err) {
      console.error('Exception loading notifications:', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  // ── No event selected ────────────────────────────────────────────────────
  if (!loading && !selectedEventId) {
    return (
      <div
        style={{
          maxWidth: '100%',
          padding: '0 24px',
          paddingTop: '40px',
          paddingBottom: '80px',
        }}
      >
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
            Notifications
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b' }}>
            Stay updated with event announcements and schedule changes.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '80px 24px',
            backgroundColor: '#fff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '12px',
              backgroundColor: '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}
          >
            <Bell size={28} color="#94a3b8" />
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a', margin: '0 0 8px' }}>
            No event selected
          </h2>
          <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '320px', margin: '0 0 24px' }}>
            Select an event first to see announcements and updates from the organizers.
          </p>
          <button
            onClick={() => navigate('/app/events')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#f97316',
              color: '#fff',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '24px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background-color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#ea580c')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f97316')}
          >
            Browse Events
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    )
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
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
          Notifications
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b' }}>
          Stay updated with event announcements and schedule changes.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            backgroundColor: '#fee2e2',
            border: '1px solid #fca5a5',
            color: '#991b1b',
            padding: '16px',
            borderRadius: '8px',
            fontSize: '13px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 24px',
            color: '#64748b',
            fontSize: '14px',
          }}
        >
          Loading notifications...
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && notifications.length === 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '80px 24px',
            backgroundColor: '#fff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '12px',
              backgroundColor: '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}
          >
            <Bell size={28} color="#94a3b8" />
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a', margin: '0 0 8px' }}>
            No announcements yet
          </h2>
          <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '320px', margin: 0 }}>
            You'll be notified here when organizers post updates.
          </p>
        </div>
      )}

      {/* Notifications feed */}
      {!loading && notifications.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {notifications.map((notif, idx) => (
            <div
              key={notif.id}
              style={{
                backgroundColor: '#fff',
                border: '1px solid #e2e8f0',
                borderLeft: idx === 0 ? '4px solid #f97316' : '4px solid #e2e8f0',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
                e.currentTarget.style.borderColor = '#cbd5e1'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'
                // restore left border colour based on position
                e.currentTarget.style.borderColor = '#e2e8f0'
              }}
            >
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                {/* Icon */}
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    backgroundColor: '#fff7ed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Bell size={18} color="#f97316" />
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3
                    style={{
                      fontSize: '15px',
                      fontWeight: '700',
                      color: '#0f172a',
                      margin: '0 0 6px',
                      lineHeight: '1.3',
                    }}
                  >
                    {notif.title}
                  </h3>

                  {notif.message && (
                    <p
                      style={{
                        fontSize: '14px',
                        color: '#475569',
                        margin: '0 0 12px',
                        lineHeight: '1.5',
                      }}
                    >
                      {notif.message}
                    </p>
                  )}

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '12px',
                      color: '#94a3b8',
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        backgroundColor: '#fff7ed',
                        color: '#c2410c',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '600',
                      }}
                    >
                      📤 Announcement
                    </span>
                    <span>•</span>
                    <span>{formatDateTime(notif.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
