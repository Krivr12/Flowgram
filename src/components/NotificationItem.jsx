import { useState, useRef, useEffect } from 'react'
import {
  CheckCircle,
  AlertTriangle,
  PlayCircle,
  Info,
  ChevronDown,
} from 'lucide-react'

// ─── Relative time helper ─────────────────────────────────────────────────────

const formatRelativeTime = (dateStr) => {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)

  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7)   return `${days}d ago`

  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

// ─── Icon mapping ─────────────────────────────────────────────────────────────

const getNotifMeta = (title = '', message = '') => {
  const text = `${title} ${message}`.toLowerCase()

  if (/finished|capacity/.test(text)) {
    return { Icon: CheckCircle, color: '#16a34a' }        // green
  }
  if (/skipped|full|at capacity/.test(text)) {
    return { Icon: AlertTriangle, color: '#dc2626' }      // red
  }
  if (/ongoing|filling/.test(text)) {
    return { Icon: PlayCircle, color: '#ca8a04' }         // yellow
  }
  return { Icon: Info, color: '#2563eb' }                 // blue (default)
}

// ─── Threshold for showing the chevron ───────────────────────────────────────
const TRUNCATE_THRESHOLD = 80 // characters

// ─── Component ────────────────────────────────────────────────────────────────

export const NotificationItem = ({ notification }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const { Icon, color } = getNotifMeta(notification.title, notification.message)

  const isLong = (notification.message || '').length > TRUNCATE_THRESHOLD

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '14px',
        padding: '14px 16px',
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      {/* ── Dynamic icon ── */}
      <div style={{ flexShrink: 0, paddingTop: '2px' }}>
        <Icon size={20} color={color} strokeWidth={2} />
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Title row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '12px',
            marginBottom: '3px',
          }}
        >
          <p
            style={{
              fontSize: '14px',
              fontWeight: '700',
              color: '#0f172a',
              margin: 0,
              lineHeight: 1.35,
            }}
          >
            {notification.title}
          </p>

          {/* Timestamp — top right */}
          <span
            style={{
              fontSize: '11px',
              color: '#94a3b8',
              fontWeight: '500',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              paddingTop: '2px',
            }}
          >
            {formatRelativeTime(notification.created_at)}
          </span>
        </div>

        {/* Message */}
        {notification.message && (
          <div style={{ position: 'relative' }}>
            <p
              style={{
                fontSize: '13px',
                color: '#64748b',
                margin: 0,
                lineHeight: 1.6,
                // Manual line clamp via webkit — widely supported
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: isExpanded ? 'unset' : 2,
                overflow: isExpanded ? 'visible' : 'hidden',
              }}
            >
              {notification.message}
            </p>

            {/* Chevron toggle — only shown when message is long */}
            {isLong && (
              <button
                onClick={() => setIsExpanded((v) => !v)}
                aria-label={isExpanded ? 'Collapse message' : 'Expand message'}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginTop: '4px',
                  padding: '2px 0',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  fontSize: '12px',
                  fontWeight: '600',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#475569')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
              >
                <ChevronDown
                  size={14}
                  strokeWidth={2.5}
                  style={{
                    transition: 'transform 0.2s',
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                />
                {isExpanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
