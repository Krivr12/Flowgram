import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, AlertCircle, ArrowRight, RefreshCw, Trash2 } from 'lucide-react'
import { getNotificationsByEventId } from '../../services/notifications'
import { NotificationItem } from '../../components/NotificationItem'

const NOTIFICATION_POLL_INTERVAL = 15000

export const NotificationsPage = () => {
  const navigate                          = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading]             = useState(true)
  const [isRefreshing, setIsRefreshing]   = useState(false)
  const [error, setError]                 = useState('')
  const [isDarkMode, setIsDarkMode]       = useState(() =>
    document.documentElement.classList.contains('dark')
  )
  const pollIntervalRef                   = useRef(null)

  const selectedEventId = localStorage.getItem('selected_event_id')

  // Track which notifications are cleared locally (per-event)
  const getClearedKey = () => `flowgram_cleared_notifs_${selectedEventId}`
  const [clearedBefore, setClearedBefore] = useState(() => {
    const stored = localStorage.getItem(getClearedKey())
    return stored || null
  })

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'))
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    loadNotifications()
    pollIntervalRef.current = setInterval(loadNotifications, NOTIFICATION_POLL_INTERVAL)
    
    // Smart polling: pause/resume based on page visibility
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Pause polling when page hidden
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current)
          pollIntervalRef.current = null
        }
      } else {
        // Resume polling when page visible
        loadNotifications()
        if (!pollIntervalRef.current) {
          pollIntervalRef.current = setInterval(loadNotifications, NOTIFICATION_POLL_INTERVAL)
        }
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadNotifications = async () => {
    setError('')
    
    // Smart polling: skip if page is hidden
    if (document.hidden) return
    
    const eventId = localStorage.getItem('selected_event_id')
    if (!eventId) { setLoading(false); return }

    try {
      // Query optimization: use columnsOnly flag for essential columns
      const result = await getNotificationsByEventId(eventId, true)
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

  const handleManualRefresh = async () => {
    setIsRefreshing(true)
    await loadNotifications()
    setIsRefreshing(false)
  }

  const handleClearAll = () => {
    // Store current timestamp — all notifications created before this are hidden
    const now = new Date().toISOString()
    localStorage.setItem(getClearedKey(), now)
    setClearedBefore(now)
  }

  // Filter out cleared notifications
  const visibleNotifications = clearedBefore
    ? notifications.filter(n => new Date(n.created_at) > new Date(clearedBefore))
    : notifications

  // ── No event selected ────────────────────────────────────────────────────
  if (!loading && !selectedEventId) {
    return (
      <div style={{ maxWidth: '100%', paddingTop: '16px', paddingBottom: '80px' }}>
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: isDarkMode ? '#e2e8f0' : '#0f172a', textAlign: 'left', marginBottom: '16px', marginTop: '8px', transition: 'color 0.2s' }}>
            Notifications
          </h1>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '80px 24px',
          }}
        >
          <Bell size={32} color={isDarkMode ? '#64748b' : '#cbd5e1'} style={{ marginBottom: '16px', transition: 'color 0.2s' }} />
          <h2 style={{ fontSize: '17px', fontWeight: '700', color: isDarkMode ? '#e2e8f0' : '#0f172a', margin: '0 0 8px', transition: 'color 0.2s' }}>
            No event selected
          </h2>
          <p style={{ fontSize: '14px', color: isDarkMode ? '#94a3b8' : '#64748b', maxWidth: '300px', margin: '0 0 24px', transition: 'color 0.2s' }}>
            Select an event first to see announcements and updates.
          </p>
          <button
            onClick={() => navigate('/app/events')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: isDarkMode ? '#1B77CF' : '#FFA100',
              color: '#fff',
              border: 'none',
              padding: '11px 22px',
              borderRadius: '24px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background-color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = isDarkMode ? '#155fa3' : '#e89100')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = isDarkMode ? '#1B77CF' : '#FFA100')}
          >
            Browse Events
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    )
  }

  // ── Main view ────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: '100%', paddingTop: '16px', paddingBottom: '80px' }}>

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '28px',
        }}
      >
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: isDarkMode ? '#e2e8f0' : '#0f172a', textAlign: 'left', marginBottom: '16px', marginTop: '8px', margin: 0, transition: 'color 0.2s' }}>
          Notifications
        </h1>

        {/* Refresh + Clear buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {/* Clear button — only show when there are visible notifications */}
          {visibleNotifications.length > 0 && (
            <button
              onClick={handleClearAll}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                border: isDarkMode ? '1px solid rgba(100,116,139,0.3)' : '1px solid #e2e8f0',
                backgroundColor: isDarkMode ? '#252F3E' : '#fff',
                cursor: 'pointer',
                transition: 'all 0.15s, background-color 0.2s, border-color 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(220,38,38,0.1)' : '#fef2f2'; e.currentTarget.style.borderColor = isDarkMode ? 'rgba(220,38,38,0.3)' : '#fecaca' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = isDarkMode ? '#252F3E' : '#fff'; e.currentTarget.style.borderColor = isDarkMode ? 'rgba(100,116,139,0.3)' : '#e2e8f0' }}
              title="Clear all notifications"
              aria-label="Clear all notifications"
            >
              <Trash2 size={15} color={isDarkMode ? '#fca5a5' : '#dc2626'} />
            </button>
          )}

          {/* Refresh button */}
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              border: isDarkMode ? '1px solid rgba(100,116,139,0.3)' : '1px solid #e2e8f0',
              backgroundColor: isDarkMode ? '#252F3E' : '#fff',
              cursor: isRefreshing ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s, background-color 0.2s, border-color 0.2s',
              opacity: isRefreshing ? 0.6 : 1,
            }}
            onMouseEnter={(e) => !isRefreshing && (e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(100,116,139,0.1)' : '#f1f5f9')}
            onMouseLeave={(e) => !isRefreshing && (e.currentTarget.style.backgroundColor = isDarkMode ? '#252F3E' : '#fff')}
            title="Refresh notifications"
            aria-label="Refresh notifications"
          >
            <RefreshCw
              size={16}
              color={isDarkMode ? '#94a3b8' : '#64748b'}
              style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none', transition: 'color 0.2s' }}
            />
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* Error */}
      {error && (
        <div
          style={{
            backgroundColor: isDarkMode ? 'rgba(220, 38, 38, 0.1)' : '#fee2e2',
            border: isDarkMode ? '1px solid rgba(220, 38, 38, 0.3)' : '1px solid #fca5a5',
            color: isDarkMode ? '#fca5a5' : '#991b1b',
            padding: '14px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            transition: 'background-color 0.2s, border-color 0.2s, color 0.2s',
          }}
        >
          <AlertCircle size={15} style={{ flexShrink: 0 }} />
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: isDarkMode ? '#94a3b8' : '#94a3b8', fontSize: '14px', transition: 'color 0.2s' }}>
          Loading notifications...
        </div>
      )}

      {/* Empty */}
      {!loading && !error && visibleNotifications.length === 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '80px 24px',
          }}
        >
          <Bell size={32} color={isDarkMode ? '#64748b' : '#cbd5e1'} style={{ marginBottom: '16px', transition: 'color 0.2s' }} />
          <h2 style={{ fontSize: '17px', fontWeight: '700', color: isDarkMode ? '#e2e8f0' : '#0f172a', margin: '0 0 8px', transition: 'color 0.2s' }}>
            No announcements yet
          </h2>
          <p style={{ fontSize: '14px', color: isDarkMode ? '#94a3b8' : '#64748b', maxWidth: '300px', margin: 0, transition: 'color 0.2s' }}>
            You'll be notified here when organizers post updates.
          </p>
        </div>
      )}

      {/* Notification feed — card list */}
      {!loading && visibleNotifications.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {visibleNotifications.map((notif) => (
            <NotificationItem key={notif.id} notification={notif} />
          ))}
        </div>
      )}
    </div>
  )
}
