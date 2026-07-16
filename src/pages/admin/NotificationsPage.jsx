import { useEffect, useState } from 'react'
import { useOutletContext, useParams } from 'react-router-dom'
import { Bell, Send, AlertCircle } from 'lucide-react'
import { Toast } from '../../components/Toast'
import { createNotification, getNotificationsByEventId } from '../../services/notifications'

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
  const { event } = useOutletContext()
  const { eventId } = useParams()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)
  const [formData, setFormData] = useState({ title: '', message: '' })

  useEffect(() => {
    if (eventId) {
      loadNotifications()
    }
  }, [eventId])

  const loadNotifications = async () => {
    setLoading(true)
    setError('')
    console.log('Loading notifications for event:', eventId)
    const result = await getNotificationsByEventId(eventId)
    console.log('Notifications result:', result)
    if (result.success) {
      setNotifications(result.data || [])
    } else {
      setError(result.error)
    }
    setLoading(false)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validate form inputs
    if (!formData.title.trim() || !formData.message.trim()) {
      setToast({ type: 'error', message: 'Please fill in both title and message' })
      return
    }

    setSubmitting(true)
    try {
      const result = await createNotification(eventId, formData.title, formData.message)

      if (result.success) {
        // Only add to list if the notification has an id
        if (result.data && result.data.id) {
          setNotifications([result.data, ...notifications])
        } else {
          // Reload notifications if the response doesn't have an id
          await loadNotifications()
        }
        setFormData({ title: '', message: '' })
        setToast({ type: 'success', message: 'Notification sent successfully!' })
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

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
          Notifications
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
          Broadcast messages to attendees of {event?.title || 'this event'}.
        </p>
      </div>

      {/* Error Alert (persistent) */}
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

      {/* Create Notification Form */}
      <div
        style={{
          backgroundColor: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '32px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '20px' }}>
          Send New Notification
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Title Input */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#334155',
                marginBottom: '6px',
              }}
            >
              Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g., Session Update"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#2563eb')}
              onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
            />
          </div>

          {/* Message Input */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#334155',
                marginBottom: '6px',
              }}
            >
              Message
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
                border: '1px solid #e2e8f0',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                resize: 'vertical',
                transition: 'border-color 0.15s',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#2563eb')}
              onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || !formData.title.trim() || !formData.message.trim()}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              backgroundColor: submitting || !formData.title.trim() || !formData.message.trim() ? '#cbd5e1' : '#f97316',
              color: '#fff',
              border: 'none',
              padding: '12px 20px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: submitting || !formData.title.trim() || !formData.message.trim() ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.15s',
              opacity: submitting || !formData.title.trim() || !formData.message.trim() ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!submitting && formData.title.trim() && formData.message.trim()) {
                e.currentTarget.style.backgroundColor = '#ea580c'
              }
            }}
            onMouseLeave={(e) => {
              if (!submitting && formData.title.trim() && formData.message.trim()) {
                e.currentTarget.style.backgroundColor = '#f97316'
              } else {
                e.currentTarget.style.backgroundColor = '#cbd5e1'
              }
            }}
          >
            <Send size={16} />
            {submitting ? 'Sending...' : 'Send Notification'}
          </button>
        </form>
      </div>

      {/* Notifications History */}
      <div>
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '16px' }}>
          Sent Notifications
        </h2>

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
              backgroundColor: '#fff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '10px',
                backgroundColor: '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px',
              }}
            >
              <Bell size={24} color="#94a3b8" />
            </div>
            <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
              No notifications sent yet
            </p>
          </div>
        )}

        {!loading && notifications.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {notifications.map((notif) => (
              <div
                key={notif.id}
                style={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '16px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
                  e.currentTarget.style.borderColor = '#cbd5e1'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'
                  e.currentTarget.style.borderColor = '#e2e8f0'
                }}
              >
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      backgroundColor: '#fef3c7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Bell size={18} color="#b45309" />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3
                      style={{
                        fontSize: '14px',
                        fontWeight: '700',
                        color: '#0f172a',
                        margin: '0 0 4px',
                      }}
                    >
                      {notif.title}
                    </h3>
                    <p
                      style={{
                        fontSize: '13px',
                        color: '#64748b',
                        margin: '4px 0',
                        lineHeight: '1.4',
                      }}
                    >
                      {notif.message}
                    </p>
                    <div
                      style={{
                        display: 'flex',
                        gap: '12px',
                        fontSize: '12px',
                        color: '#94a3b8',
                        marginTop: '8px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <span>
                        📤 Notification
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
    </div>
  )
}
