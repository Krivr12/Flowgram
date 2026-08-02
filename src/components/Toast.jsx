import { useEffect } from 'react'
import { Bell, CheckCircle, AlertCircle, X } from 'lucide-react'

/**
 * Toast — supports three display modes:
 *
 *  1. Notification toast  (type = 'notification')
 *     Props: title, message
 *     Used by the realtime listener to show event announcements.
 *
 *  2. Success / Error toast  (type = 'success' | 'error')
 *     Props: message
 *     Used by existing action feedback (save, update, delete, etc.)
 */
export const Toast = ({ type = 'success', title, message, onClose, duration = 5000 }) => {
  useEffect(() => {
    if (duration && duration > 0) {
      const timer = setTimeout(onClose, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  // ── Notification variant ──────────────────────────────────────────────────
  if (type === 'notification') {
    return (
      <div
        style={{
          position: 'fixed',
          top: '16px',
          left: '16px',
          right: '16px',
          zIndex: 9999,
          display: 'flex',
          justifyContent: 'center',
          animation: 'toastSlideDown 0.3s ease-out',
          pointerEvents: 'none',
        }}
      >
        <style>{`
          @keyframes toastSlideDown {
            from { transform: translateY(-100%); opacity: 0; }
            to   { transform: translateY(0);     opacity: 1; }
          }
        `}</style>

        <div
          style={{
            backgroundColor: '#fff',
            border: '1px solid #e2e8f0',
            borderLeft: '4px solid #FFA100',
            borderRadius: '12px',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            width: '100%',
            maxWidth: '400px',
            pointerEvents: 'auto',
          }}
        >
          {/* Icon */}
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: '#fff7ed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Bell size={18} color="#FFA100" />
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0, overflow: 'visible' }}>
            {title && (
              <p
                style={{
                  fontSize: '14px',
                  fontWeight: '700',
                  color: '#0f172a',
                  margin: '0 0 4px',
                  lineHeight: '1.3',
                  wordBreak: 'break-word',
                }}
              >
                {title}
              </p>
            )}
            {message && (
              <p
                style={{
                  fontSize: '13px',
                  color: '#475569',
                  margin: 0,
                  lineHeight: '1.5',
                  wordBreak: 'break-word',
                }}
              >
                {message}
              </p>
            )}
            <p
              style={{
                fontSize: '11px',
                color: '#94a3b8',
                margin: '6px 0 0',
                fontWeight: '500',
              }}
            >
              New announcement
            </p>
          </div>

          {/* Close */}
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#94a3b8',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#475569')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    )
  }

  // ── Success / Error variant ───────────────────────────────────────────────
  const isSuccess = type === 'success'
  const bgColor     = isSuccess ? '#dcfce7' : '#fee2e2'
  const borderColor = isSuccess ? '#86efac' : '#fca5a5'
  const textColor   = isSuccess ? '#166534' : '#991b1b'
  const iconColor   = isSuccess ? '#22c55e' : '#ef4444'

  return (
    <div
      style={{
        position: 'fixed',
        top: '16px',
        left: '16px',
        right: '16px',
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'center',
        animation: 'toastSlideDown 0.3s ease-out',
        pointerEvents: 'none',
      }}
    >
      <style>{`
        @keyframes toastSlideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to   { transform: translateY(0);     opacity: 1; }
        }
      `}</style>

      <div
        style={{
          backgroundColor: bgColor,
          border: `1px solid ${borderColor}`,
          color: textColor,
          padding: '14px 16px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          width: '100%',
          maxWidth: '400px',
          pointerEvents: 'auto',
        }}
      >
        {isSuccess ? (
          <CheckCircle size={20} color={iconColor} style={{ flexShrink: 0 }} />
        ) : (
          <AlertCircle size={20} color={iconColor} style={{ flexShrink: 0 }} />
        )}

        <div style={{ flex: 1, fontSize: '14px', fontWeight: '500', lineHeight: '1.4', wordBreak: 'break-word' }}>
          {message}
        </div>

        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: textColor,
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.6,
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
