import { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { Bell, Send, AlertCircle, RefreshCw, Plus, X } from 'lucide-react'
import { Toast } from '../../components/Toast'
import { NotificationItem } from '../../components/NotificationItem'
import { createNotification, getNotificationsByEventId } from '../../services/notifications'

const NOTIFICATION_POLL_INTERVAL = 15000 // 15 seconds

export const NotificationsPage = () => {
  const { eventId } = useParams()
  const [isDarkMode, setIsDarkMode] = useState(() =>
    document.documentElement.classList.contains('dark')
  )
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)
  const [formData, setFormData] = useState({ title: '', message: '' })
  const [showModal, setShowModal] = useState(false)
  const pollIntervalRef = useRef(null)

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'))
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (eventId) {
      loadNotifications()
      pollIntervalRef.current = setInterval(() => loadNotifications(), NOTIFICATION_POLL_INTERVAL)
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [eventId])

  const loadNotifications = async () => {
    setError('')
    const result = await getNotificationsByEventId(eventId)
    if (result.success) {
      setNotifications(result.data || [])
    } else {
      setError(result.error)
    }
    setLoading(false)
  }

  const handleManualRefresh = async () => {
    setIsRefreshing(true)
    await loadNotifications()
    setIsRefreshing(false)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.title.trim() || !formData.message.trim()) {
      setToast({ type: 'error', message: 'Please fill in both title and message' })
      return
    }

    setSubmitting(true)
    try {
      const result = await createNotification(eventId, formData.title, formData.message)

      if (result.success) {
        if (result.data && result.data.id) {
          setNotifications([result.data, ...notifications])
        } else {
          await loadNotifications()
        }
        setFormData({ title: '', message: '' })
        setToast({ type: 'success', message: 'Notification sent successfully!' })
        setShowModal(false)
      } else {
        setToast({ type: 'error', message: result.error || 'Failed to send notification' })
      }
    } catch (err) {
      console.error('Error in handleSubmit:', err)
      setToast({ type: 'error', message: 'An unexpected error occurred' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setFormData({ title: '', message: '' })
  }

  return (
    <div>
      {/* Toast Notification */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
          duration={toast.type === 'success' ? 3000 : 4000}
        />
      )}

      {/* Header with Announce button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '700', color: isDarkMode ? '#e2e8f0' : '#252F3E', margin: 0 }}>
          Notifications
        </h1>
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            backgroundColor: isDarkMode ? '#2563eb' : '#FF9900', color: '#fff',
            fontWeight: '600', fontSize: '14px',
            padding: '10px 20px', borderRadius: '9999px',
            border: 'none', cursor: 'pointer', flexShrink: 0,
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? '#1d4ed8' : '#e68a00'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? '#2563eb' : '#FF9900'}
        >
          <Plus size={16} /> Announce
        </button>
      </div>

      {/* Error Alert (persistent) */}
      {error && (
        <div
          style={{
            backgroundColor: isDarkMode ? 'rgba(220, 38, 38, 0.1)' : '#fee2e2',
            border: isDarkMode ? '1px solid rgba(220, 38, 38, 0.3)' : '1px solid #fca5a5',
            color: isDarkMode ? '#fca5a5' : '#991b1b',
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

      {/* Sent Notifications Section */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: isDarkMode ? '#e2e8f0' : '#0f172a', margin: 0 }}>
            Sent Notifications
          </h2>
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '6px',
              border: isDarkMode ? '1px solid rgba(100, 116, 139, 0.3)' : '1px solid #e2e8f0',
              backgroundColor: isDarkMode ? '#252F3E' : '#fff',
              cursor: isRefreshing ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
              opacity: isRefreshing ? 0.6 : 1,
            }}
            onMouseEnter={(e) => !isRefreshing && (e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(100, 116, 139, 0.1)' : '#f1f5f9')}
            onMouseLeave={(e) => !isRefreshing && (e.currentTarget.style.backgroundColor = isDarkMode ? '#252F3E' : '#fff')}
            title="Refresh notifications"
            aria-label="Refresh notifications"
          >
            <RefreshCw
              size={16}
              color={isDarkMode ? '#64748b' : '#64748b'}
              style={{
                animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
              }}
            />
          </button>
        </div>

        <style>
          {`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}
        </style>

        {loading && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            Loading notifications...
          </div>
        )}

        {!loading && notifications.length === 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '60px 24px',
              backgroundColor: isDarkMode ? '#252F3E' : '#fff',
              borderRadius: '12px',
              border: isDarkMode ? '1px solid rgba(100, 116, 139, 0.3)' : '1px solid #e2e8f0',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '10px',
                backgroundColor: isDarkMode ? 'rgba(100, 116, 139, 0.2)' : '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px',
              }}
            >
              <Bell size={24} color={isDarkMode ? '#64748b' : '#94a3b8'} />
            </div>
            <p style={{ fontSize: '14px', color: isDarkMode ? '#94a3b8' : '#64748b', margin: 0 }}>
              No notifications sent yet
            </p>
          </div>
        )}

        {!loading && notifications.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {notifications.map((notif) => (
              <NotificationItem key={notif.id} notification={notif} />
            ))}
          </div>
        )}
      </div>

      {/* Announce Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) handleCloseModal() }}
        >
          <div
            style={{
              backgroundColor: isDarkMode ? '#252F3E' : '#fff',
              borderRadius: '14px',
              padding: '28px',
              width: '100%',
              maxWidth: '480px',
              boxShadow: '0 20px 48px rgba(0,0,0,0.18)',
              margin: '0 16px',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: isDarkMode ? '#e2e8f0' : '#0f172a', margin: 0 }}>
                Send Announcement
              </h2>
              <button
                onClick={handleCloseModal}
                style={{
                  padding: '6px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  color: isDarkMode ? '#64748b' : '#94a3b8',
                  display: 'flex',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Title Input */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: isDarkMode ? '#cbd5e1' : '#374151',
                    marginBottom: '6px',
                  }}
                >
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Session Update"
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: isDarkMode ? '1px solid rgba(100, 116, 139, 0.3)' : '1px solid #e2e8f0',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.15s',
                    color: isDarkMode ? '#e2e8f0' : '#0f172a',
                    backgroundColor: isDarkMode ? '#252F3E' : '#fff',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = isDarkMode ? '#2563eb' : '#FF9900')}
                  onBlur={(e) => (e.target.style.borderColor = isDarkMode ? 'rgba(100, 116, 139, 0.3)' : '#e2e8f0')}
                />
              </div>

              {/* Message Input */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: isDarkMode ? '#cbd5e1' : '#374151',
                    marginBottom: '6px',
                  }}
                >
                  Message *
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Enter your notification message here..."
                  rows="4"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: isDarkMode ? '1px solid rgba(100, 116, 139, 0.3)' : '1px solid #e2e8f0',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    transition: 'border-color 0.15s',
                    color: isDarkMode ? '#e2e8f0' : '#0f172a',
                    backgroundColor: isDarkMode ? '#252F3E' : '#fff',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = isDarkMode ? '#2563eb' : '#FF9900')}
                  onBlur={(e) => (e.target.style.borderColor = isDarkMode ? 'rgba(100, 116, 139, 0.3)' : '#e2e8f0')}
                />
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '8px' }}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  style={{
                    padding: '10px 20px',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: isDarkMode ? '#cbd5e1' : '#475569',
                    backgroundColor: 'transparent',
                    border: isDarkMode ? '1px solid rgba(100, 116, 139, 0.3)' : '1px solid #e2e8f0',
                    borderRadius: '9999px',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(100, 116, 139, 0.1)' : '#f8fafc'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !formData.title.trim() || !formData.message.trim()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '10px 20px',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: submitting || !formData.title.trim() || !formData.message.trim() ? '#9ca3af' : '#fff',
                    backgroundColor: submitting || !formData.title.trim() || !formData.message.trim() ? '#d1d5db' : isDarkMode ? '#2563eb' : '#FF9900',
                    border: 'none',
                    borderRadius: '9999px',
                    cursor: submitting || !formData.title.trim() || !formData.message.trim() ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    if (!submitting && formData.title.trim() && formData.message.trim()) {
                      e.currentTarget.style.backgroundColor = isDarkMode ? '#1d4ed8' : '#e68a00'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!submitting && formData.title.trim() && formData.message.trim()) {
                      e.currentTarget.style.backgroundColor = isDarkMode ? '#2563eb' : '#FF9900'
                    } else {
                      e.currentTarget.style.backgroundColor = '#d1d5db'
                    }
                  }}
                >
                  <Send size={14} />
                  {submitting ? 'Sending...' : 'Send'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
