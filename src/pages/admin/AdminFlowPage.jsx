import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getSegmentsByEventId, updateSegment } from '../../services/segments'
import { updateSegmentStatus } from '../../services/notifications'
import { getEventById, updateEvent } from '../../services/events'
import { Clock, MapPin, Play, CheckCircle, MoreHorizontal } from 'lucide-react'
import { useDarkMode } from '../../services/theme'

// ─── Formatters ───────────────────────────────────────────────────────────────

const formatTime = (timeStr) => {
  if (!timeStr) return ''
  return new Date(timeStr).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC',
  })
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const formatDateTime = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' · ' +
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_STYLE = {
  Ongoing:       { bg: '#fef3c7', text: '#92400e', dot: '#f59e0b', label: 'Ongoing' },
  Finished:      { bg: '#dcfce7', text: '#166534', dot: '#22c55e', label: 'Finished' },
  Skipped:       { bg: '#fee2e2', text: '#991b1b', dot: '#ef4444', label: 'Skipped' },
  'Not Started': { bg: '#f1f5f9', text: '#334155', dot: '#94a3b8', label: 'Not Started' },
}

const STATUS_STYLE_DARK = {
  Ongoing:       { bg: 'rgba(251,191,36,0.15)', text: '#fcd34d', dot: '#f59e0b', label: 'Ongoing' },
  Finished:      { bg: 'rgba(34,197,94,0.15)',  text: '#6ee7b7', dot: '#22c55e', label: 'Finished' },
  Skipped:       { bg: 'rgba(239,68,68,0.15)',  text: '#fca5a5', dot: '#ef4444', label: 'Skipped' },
  'Not Started': { bg: 'rgba(100,116,139,0.2)', text: '#cbd5e1', dot: '#94a3b8', label: 'Not Started' },
}

const getStatusStyle = (status, isDarkMode) => {
  const map = isDarkMode ? STATUS_STYLE_DARK : STATUS_STYLE
  return map[status] ?? map['Not Started']
}

// ─── Capacity config ──────────────────────────────────────────────────────────

const CAPACITY_OPTIONS = ['VACANT', 'FILLING', 'ALMOST FULL', 'FULL']

const CAPACITY_LABELS = {
  VACANT: 'Open',
  FILLING: 'Filling Up',
  'ALMOST FULL': 'Almost Full',
  FULL: 'Full',
}

const CAPACITY_STYLE = {
  VACANT:        { activeBg: '#22c55e' },
  FILLING:       { activeBg: '#f59e0b' },
  'ALMOST FULL': { activeBg: '#FFA100' },
  FULL:          { activeBg: '#ef4444' },
}

// ─── Event status config ──────────────────────────────────────────────────────

const EVENT_STATUS_OPTIONS = ['UPCOMING', 'STARTED', 'FINISHED', 'CANCELLED']

const EVENT_STATUS_LABEL = {
  UPCOMING:  'Upcoming',
  STARTED:   'Started',
  FINISHED:  'Finished',
  CANCELLED: 'Cancelled',
}

const EVENT_STATUS_STYLE = {
  UPCOMING:  { bg: 'rgba(99,179,237,0.18)',  text: '#7fb8e6' },
  STARTED:   { bg: 'rgba(251,191,36,0.18)',  text: '#fcd34d' },
  FINISHED:  { bg: 'rgba(52,211,153,0.18)',  text: '#6ee7b7' },
  CANCELLED: { bg: 'rgba(239,68,68,0.18)',   text: '#fca5a5' },
}

// ─── Next action logic ────────────────────────────────────────────────────────

const getNextAction = (status) => {
  switch (status) {
    case 'Not Started': return { label: 'Start', next: 'Ongoing', Icon: Play, color: '#f59e0b' }
    case 'Ongoing':     return { label: 'Finish', next: 'Finished', Icon: CheckCircle, color: '#22c55e' }
    default:            return null
  }
}

// ─── Group segments by start_time (chronological) ─────────────────────────────

const groupSegmentsByStartTime = (segments) => {
  const map = new Map()
  for (const seg of segments) {
    const key = seg.start_time ?? '__no_time__'
    if (!map.has(key)) {
      map.set(key, { timeKey: key, label: formatTime(seg.start_time), segments: [] })
    }
    map.get(key).segments.push(seg)
  }
  return Array.from(map.values())
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────

const ConfirmModal = ({ isOpen, title, message, onCancel, onConfirm }) => {
  const isDarkMode = useDarkMode()
  if (!isOpen) return null
  return (
    <div
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div style={{ backgroundColor: isDarkMode ? '#252F3E' : '#fff', borderRadius: '14px', padding: '24px', width: '100%', maxWidth: '340px', boxShadow: '0 20px 48px rgba(0,0,0,0.18)', margin: '0 16px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', color: isDarkMode ? '#e2e8f0' : '#0f172a', margin: '0 0 8px' }}>{title}</h3>
        <p style={{ fontSize: '14px', color: isDarkMode ? '#94a3b8' : '#64748b', margin: '0 0 20px', lineHeight: '1.5' }}>{message}</p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ padding: '9px 18px', borderRadius: '8px', border: isDarkMode ? '1px solid rgba(100,116,139,0.3)' : '1px solid #e2e8f0', backgroundColor: 'transparent', color: isDarkMode ? '#cbd5e1' : '#475569', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
          <button onClick={onConfirm} style={{ padding: '9px 18px', borderRadius: '8px', border: 'none', backgroundColor: isDarkMode ? '#1B77CF' : '#252F3E', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Confirm</button>
        </div>
      </div>
    </div>
  )
}

// ─── Capacity Pills ───────────────────────────────────────────────────────────

const CapacityPills = ({ value, onChange, disabled, isDarkMode }) => (
  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
    {CAPACITY_OPTIONS.map((opt) => {
      const isActive = opt === value
      const style = CAPACITY_STYLE[opt]
      return (
        <button
          key={opt}
          onClick={() => !disabled && onChange(opt)}
          disabled={disabled}
          style={{
            padding: '5px 10px', borderRadius: '6px',
            border: isActive ? 'none' : (isDarkMode ? '1px solid rgba(100,116,139,0.3)' : '1px solid #e2e8f0'),
            backgroundColor: isActive ? style.activeBg : (isDarkMode ? 'rgba(100,116,139,0.1)' : '#fff'),
            color: isActive ? '#fff' : (isDarkMode ? '#94a3b8' : '#64748b'),
            fontSize: '11px', fontWeight: '600',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
            transition: 'all 0.15s',
          }}
        >
          {CAPACITY_LABELS[opt]}
        </button>
      )
    })}
  </div>
)

// ─── Segment Card ─────────────────────────────────────────────────────────────

const SegmentCard = ({ segment, onStatusChange, onCapacityChange, isUpdating, isDarkMode }) => {
  const [showOverflow, setShowOverflow] = useState(false)
  const status = segment.segment_status || 'Not Started'
  const statusStyle = getStatusStyle(status, isDarkMode)
  const nextAction = getNextAction(status)
  const isCompleted = status === 'Finished' || status === 'Skipped'

  return (
    <div
      style={{
        backgroundColor: isDarkMode ? '#252F3E' : '#fff',
        border: isDarkMode ? '1px solid rgba(100,116,139,0.3)' : '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '14px 16px',
        opacity: isCompleted ? 0.55 : 1,
        transition: 'opacity 0.2s',
      }}
    >
      {/* Title + status badge */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '6px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '700', color: isDarkMode ? '#fff' : '#0f172a', margin: 0, lineHeight: '1.3', flex: 1 }}>
          {segment.title}
        </h3>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '4px',
          padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '700',
          backgroundColor: statusStyle.bg, color: statusStyle.text, flexShrink: 0,
        }}>
          <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: statusStyle.dot }} />
          {statusStyle.label}
        </span>
      </div>

      {/* Time + Room — always stacked */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '10px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: isDarkMode ? '#94a3b8' : '#64748b', fontWeight: '500' }}>
          <Clock size={11} color={isDarkMode ? '#94a3b8' : '#64748b'} />
          {formatTime(segment.start_time)}
          {segment.end_time && <><span style={{ margin: '0 2px', color: isDarkMode ? '#64748b' : '#cbd5e1' }}>→</span>{formatTime(segment.end_time)}</>}
        </span>
        {segment.room_name && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: isDarkMode ? '#94a3b8' : '#64748b', fontWeight: '500' }}>
            <MapPin size={11} color={isDarkMode ? '#94a3b8' : '#64748b'} />
            {segment.room_name}
          </span>
        )}
      </div>

      {/* Capacity pills */}
      {!isCompleted && (
        <div style={{ marginBottom: '10px' }}>
          <p style={{ fontSize: '10px', fontWeight: '600', color: isDarkMode ? '#94a3b8' : '#94a3b8', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Capacity</p>
          <CapacityPills
            value={segment.capacity_status || 'VACANT'}
            onChange={(val) => onCapacityChange(segment.id, val)}
            disabled={isUpdating}
            isDarkMode={isDarkMode}
          />
        </div>
      )}

      {/* Action row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '10px', borderTop: isDarkMode ? '1px solid rgba(100,116,139,0.2)' : '1px solid #f1f5f9' }}>
        {/* Primary action button (natural next step) */}
        {nextAction && (
          <button
            onClick={() => onStatusChange(segment.id, nextAction.next, true)}
            disabled={isUpdating}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 14px', borderRadius: '8px', border: 'none',
              backgroundColor: nextAction.color, color: '#fff',
              fontSize: '13px', fontWeight: '600',
              cursor: isUpdating ? 'not-allowed' : 'pointer',
              opacity: isUpdating ? 0.5 : 1, transition: 'opacity 0.15s',
            }}
          >
            <nextAction.Icon size={14} />
            {nextAction.label}
          </button>
        )}

        {/* Overflow menu — all other statuses */}
        <div style={{ position: 'relative', marginLeft: 'auto' }}>
          <button
            onClick={() => setShowOverflow(!showOverflow)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '32px', height: '32px', borderRadius: '6px',
              border: isDarkMode ? '1px solid rgba(100,116,139,0.3)' : '1px solid #e2e8f0',
              backgroundColor: 'transparent', cursor: 'pointer',
              color: isDarkMode ? '#94a3b8' : '#64748b',
            }}
          >
            <MoreHorizontal size={16} />
          </button>
          {showOverflow && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setShowOverflow(false)} />
              <div style={{
                position: 'absolute', bottom: 'calc(100% + 6px)', right: 0, zIndex: 20,
                backgroundColor: isDarkMode ? '#334155' : '#fff',
                border: isDarkMode ? '1px solid rgba(100,116,139,0.3)' : '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)', overflow: 'hidden', minWidth: '150px',
              }}>
                <p style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', padding: '8px 14px 4px', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Set status</p>
                {['Not Started', 'Ongoing', 'Finished', 'Skipped'].filter(s => s !== status).map((opt) => {
                  const optStyle = getStatusStyle(opt, isDarkMode)
                  const isDestructive = opt === 'Skipped'
                  return (
                    <button
                      key={opt}
                      onClick={() => { setShowOverflow(false); onStatusChange(segment.id, opt, true, isCompleted) }}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '9px 14px', border: 'none', backgroundColor: 'transparent',
                        color: isDestructive
                          ? (isDarkMode ? '#fca5a5' : '#991b1b')
                          : (isDarkMode ? '#cbd5e1' : '#334155'),
                        fontSize: '13px', fontWeight: '500', cursor: 'pointer', textAlign: 'left',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = isDestructive
                        ? (isDarkMode ? 'rgba(220,38,38,0.15)' : '#fef2f2')
                        : (isDarkMode ? '#475569' : '#f8fafc'))}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: optStyle.dot, flexShrink: 0 }} />
                      {opt}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {isUpdating && <span style={{ fontSize: '11px', color: '#94a3b8' }}>Saving…</span>}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export const AdminFlowPage = () => {
  const { eventId } = useParams()

  const [event, setEvent]       = useState(null)
  const [segments, setSegments] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [updatingSegment, setUpdatingSegment] = useState(null)
  const [updatingEventStatus, setUpdatingEventStatus] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)

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
    if (!eventId) { setLoading(false); return }
    loadData()
  }, [eventId])

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const [eventResult, segmentsResult] = await Promise.all([
        getEventById(eventId),
        getSegmentsByEventId(eventId),
      ])
      if (!eventResult.success) { setError(eventResult.error || 'Failed to load event'); return }
      setEvent(eventResult.data)
      if (segmentsResult.success) setSegments(segmentsResult.data || [])
      else setError(segmentsResult.error || 'Failed to load segments')
    } catch { setError('An unexpected error occurred') }
    finally { setLoading(false) }
  }

  const timeGroups = useMemo(() => {
    const filtered = searchQuery.trim()
      ? segments.filter(s => s.title?.toLowerCase().includes(searchQuery.toLowerCase()))
      : segments
    return groupSegmentsByStartTime(filtered)
  }, [segments, searchQuery])

  const patchSegment = (segmentId, patch) =>
    setSegments((prev) => prev.map((s) => (s.id === segmentId ? { ...s, ...patch } : s)))

  // Status change: all go through confirmation
  const handleStatusChange = async (segmentId, newStatus, requiresConfirm, fromCompleted = false) => {
    if (requiresConfirm) {
      setConfirmAction({ type: 'segment-status', segmentId, value: newStatus, fromCompleted })
      return
    }
    setUpdatingSegment(segmentId)
    patchSegment(segmentId, { segment_status: newStatus })
    const result = await updateSegmentStatus(segmentId, newStatus)
    if (!result.success) { setError(result.error || 'Failed to update'); loadData() }
    setUpdatingSegment(null)
  }

  // Capacity change: direct, no confirm needed during live event
  const handleCapacityChange = async (segmentId, newCapacity) => {
    setUpdatingSegment(segmentId)
    patchSegment(segmentId, { capacity_status: newCapacity })
    const result = await updateSegment(segmentId, { capacity_status: newCapacity })
    if (!result.success) {
      setError(result.error || 'Failed to update capacity')
      loadData()
    }
    setUpdatingSegment(null)
  }

  // Event status: always confirm
  const handleEventStatusChange = (value) => {
    setConfirmAction({ type: 'event-status', value })
  }

  // Modal confirm
  const handleConfirm = async () => {
    if (!confirmAction) return
    const action = confirmAction
    setConfirmAction(null)

    if (action.type === 'segment-status') {
      setUpdatingSegment(action.segmentId)
      patchSegment(action.segmentId, { segment_status: action.value })
      const result = await updateSegmentStatus(action.segmentId, action.value)
      if (!result.success) { setError(result.error || 'Failed to update'); loadData() }
      setUpdatingSegment(null)
    } else if (action.type === 'event-status') {
      setUpdatingEventStatus(true)
      setEvent((prev) => ({ ...prev, event_status: action.value }))
      const result = await updateEvent(eventId, { event_status: action.value })
      if (!result.success) { setError(result.error || 'Failed to update event status'); loadData() }
      setUpdatingEventStatus(false)
    }
  }

  return (
    <div>
      <ConfirmModal
        isOpen={confirmAction !== null}
        title={
          confirmAction?.type === 'event-status' ? 'Change Event Status'
          : confirmAction?.value === 'Skipped' ? 'Skip Session'
          : confirmAction?.value === 'Not Started' ? 'Reset Session'
          : confirmAction?.value === 'Ongoing' && confirmAction?.fromCompleted ? 'Revert to Ongoing'
          : confirmAction?.value === 'Ongoing' ? 'Start Session'
          : confirmAction?.value === 'Finished' ? 'Finish Session'
          : 'Confirm Change'
        }
        message={
          confirmAction?.type === 'event-status'
            ? `Change event status to "${confirmAction?.value}"? This is visible to all attendees.`
          : confirmAction?.value === 'Skipped'
            ? 'Skip this session? Attendees will see it as skipped.'
          : confirmAction?.value === 'Not Started'
            ? 'Reset this session to Not Started? It will appear as not yet begun.'
          : confirmAction?.value === 'Ongoing' && confirmAction?.fromCompleted
            ? 'Revert this session to Ongoing? It will reappear as active for attendees.'
          : confirmAction?.value === 'Ongoing'
            ? 'Start this session? Attendees will see it as currently ongoing.'
          : confirmAction?.value === 'Finished'
            ? 'Mark this session as finished? Attendees will see it as completed.'
            : 'Are you sure you want to make this change?'
        }
        onCancel={() => setConfirmAction(null)}
        onConfirm={handleConfirm}
      />

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: isDarkMode ? '#fff' : '#0f172a', margin: 0 }}>
          Manage Flow
        </h1>
        <p style={{ fontSize: '13px', color: isDarkMode ? '#94a3b8' : '#64748b', marginTop: '6px', lineHeight: 1.5 }}>
          Control the live status of sessions and room capacity. Changes are instant for all attendees.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div style={{ backgroundColor: isDarkMode ? 'rgba(220,38,38,0.1)' : '#fee2e2', border: isDarkMode ? '1px solid rgba(220,38,38,0.3)' : '1px solid #fca5a5', color: isDarkMode ? '#fca5a5' : '#991b1b', padding: '12px 16px', borderRadius: '8px', fontSize: '13px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {error}
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: isDarkMode ? '#fca5a5' : '#991b1b', fontSize: '16px' }}>×</button>
        </div>
      )}

      {/* Event card */}
      {event && (
        <div style={{ backgroundColor: '#252F3E', borderRadius: '12px', padding: '18px', marginBottom: '28px', boxShadow: '0 4px 16px rgba(0,0,0,0.18)' }}>
          <p style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>Current Event</p>
          <h2 style={{ fontSize: '17px', fontWeight: '700', color: '#fff', margin: '0 0 8px', lineHeight: '1.3' }}>{event.title}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
            {event.venue && <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#cbd5e1' }}><MapPin size={12} color="#94a3b8" style={{ flexShrink: 0 }} />{event.venue}</span>}
            {event.start_date && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#cbd5e1' }}>
                <Clock size={12} color="#94a3b8" style={{ flexShrink: 0 }} />
                <span>{formatDateTime(event.start_date)}</span>
              </span>
            )}
            {event.end_date && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#cbd5e1', paddingLeft: '16px' }}>
                → {formatDateTime(event.end_date)}
              </span>
            )}
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8' }}>Status</span>
            <select
              value={event.event_status || 'UPCOMING'}
              onChange={(e) => handleEventStatusChange(e.target.value)}
              disabled={updatingEventStatus}
              style={{
                appearance: 'none', WebkitAppearance: 'none',
                padding: '6px 30px 6px 10px', borderRadius: '7px',
                border: '1px solid rgba(255,255,255,0.15)',
                backgroundColor: EVENT_STATUS_STYLE[event.event_status || 'UPCOMING']?.bg,
                color: EVENT_STATUS_STYLE[event.event_status || 'UPCOMING']?.text,
                fontSize: '12px', fontWeight: '700',
                cursor: updatingEventStatus ? 'not-allowed' : 'pointer',
                opacity: updatingEventStatus ? 0.6 : 1,
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center',
              }}
            >
              {EVENT_STATUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt} style={{ backgroundColor: '#1e2a3a', color: '#e2e8f0' }}>{EVENT_STATUS_LABEL[opt]}</option>
              ))}
            </select>
            {updatingEventStatus && <span style={{ fontSize: '11px', color: '#94a3b8' }}>Saving…</span>}
          </div>
        </div>
      )}

      {/* Search */}
      <div style={{ marginBottom: '20px', position: 'relative' }}>
        <input
          type="text"
          placeholder="Search sessions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 14px 10px 36px',
            borderRadius: '8px',
            border: isDarkMode ? '1px solid rgba(100,116,139,0.3)' : '1px solid #e2e8f0',
            backgroundColor: isDarkMode ? '#252F3E' : '#fff',
            color: isDarkMode ? '#e2e8f0' : '#0f172a',
            fontSize: '14px',
            outline: 'none',
            transition: 'border-color 0.15s',
            boxSizing: 'border-box',
          }}
          onFocus={(e) => (e.target.style.borderColor = '#1B77CF')}
          onBlur={(e) => (e.target.style.borderColor = isDarkMode ? 'rgba(100,116,139,0.3)' : '#e2e8f0')}
        />
        <svg
          style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>

      {/* Loading */}
      {loading && <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: '14px' }}>Loading segments...</div>}

      {/* Empty */}
      {!loading && segments.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 24px', color: isDarkMode ? '#94a3b8' : '#64748b', fontSize: '14px', backgroundColor: isDarkMode ? '#252F3E' : '#fff', borderRadius: '12px', border: isDarkMode ? '1px solid rgba(100,116,139,0.3)' : '1px solid #e2e8f0' }}>
          No segments scheduled yet.
        </div>
      )}

      {/* Schedule — chronological, grouped by start time */}
      {!loading && timeGroups.map(({ timeKey, label, segments: groupSegs }) => (
        <div key={timeKey} style={{ marginBottom: '20px' }}>
          {/* Time header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              backgroundColor: isDarkMode ? '#334155' : '#f1f5f9',
              color: isDarkMode ? '#cbd5e1' : '#334155',
              padding: '4px 10px', borderRadius: '6px',
              fontSize: '12px', fontWeight: '700',
            }}>
              <Clock size={11} color={isDarkMode ? '#94a3b8' : '#64748b'} />
              {label || 'Unscheduled'}
            </span>
            {groupSegs.length > 1 && (
              <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500' }}>
                {groupSegs.length} concurrent
              </span>
            )}
          </div>

          {/* Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[...groupSegs]
              .sort((a, b) => {
                const aIs15 = a.room_name?.includes('15') ? 0 : 1
                const bIs15 = b.room_name?.includes('15') ? 0 : 1
                return aIs15 - bIs15
              })
              .map((seg) => (
              <SegmentCard
                key={seg.id}
                segment={seg}
                onStatusChange={handleStatusChange}
                onCapacityChange={handleCapacityChange}
                isUpdating={updatingSegment === seg.id}
                isDarkMode={isDarkMode}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
