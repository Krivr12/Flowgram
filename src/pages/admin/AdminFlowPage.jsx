import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getSegmentsByEventId, updateSegment } from '../../services/segments'
import { updateSegmentStatus } from '../../services/notifications'
import { getEventById, updateEvent } from '../../services/events'
import { ChevronDown, Clock, MapPin } from 'lucide-react'

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

// ─── Segment status config ────────────────────────────────────────────────────

const STATUS_OPTIONS = ['Not Started', 'Ongoing', 'Finished', 'Skipped']

const STATUS_STYLE = {
  Ongoing:       { bg: '#fef3c7', text: '#92400e', dot: '#f59e0b' },
  Finished:      { bg: '#dcfce7', text: '#166534', dot: '#22c55e' },
  Skipped:       { bg: '#fee2e2', text: '#991b1b', dot: '#ef4444' },
  'Not Started': { bg: '#f1f5f9', text: '#334155', dot: '#94a3b8' },
}

const getStatusStyle = (status) => STATUS_STYLE[status] ?? STATUS_STYLE['Not Started']

// ─── Room capacity config ─────────────────────────────────────────────────────

const CAPACITY_OPTIONS = ['VACANT', 'FILLING', 'FULL', 'AT CAPACITY']

const CAPACITY_STYLE = {
  VACANT:        { bg: '#f0fdf4', text: '#15803d', dot: '#22c55e' },
  FILLING:       { bg: '#fffbeb', text: '#b45309', dot: '#f59e0b' },
  FULL:          { bg: '#fff7ed', text: '#c2410c', dot: '#f97316' },
  'AT CAPACITY': { bg: '#fee2e2', text: '#991b1b', dot: '#ef4444' },
}

// ─── Event status config ──────────────────────────────────────────────────────

const EVENT_STATUS_OPTIONS = ['UPCOMING', 'STARTED', 'FINISHED', 'CANCELLED']

const EVENT_STATUS_STYLE = {
  UPCOMING:  { bg: 'rgba(99,179,237,0.18)',  text: '#93c5fd', dot: '#60a5fa' },
  STARTED:   { bg: 'rgba(251,191,36,0.18)',  text: '#fcd34d', dot: '#fbbf24' },
  FINISHED:  { bg: 'rgba(52,211,153,0.18)',  text: '#6ee7b7', dot: '#34d399' },
  CANCELLED: { bg: 'rgba(239,68,68,0.18)',   text: '#fca5a5', dot: '#ef4444' },
}

// ─── Group segments by start_time ─────────────────────────────────────────────

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

// ─── Inline control dropdown ──────────────────────────────────────────────────

const ControlDropdown = ({ dropdownKey, value, options, styleMap, openId, onToggle, onSelect, disabled }) => {
  const style = styleMap[value] ?? Object.values(styleMap)[0]
  const isOpen = openId === dropdownKey

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => onToggle(isOpen ? null : dropdownKey)}
        disabled={disabled}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          padding: '5px 10px',
          backgroundColor: style.bg,
          color: style.text,
          border: 'none',
          borderRadius: '6px',
          fontSize: '11px',
          fontWeight: '700',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.55 : 1,
          whiteSpace: 'nowrap',
          transition: 'opacity 0.15s',
          letterSpacing: '0.01em',
        }}
      >
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: style.dot, flexShrink: 0 }} />
        {value || options[0]}
        <ChevronDown size={12} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }} />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            backgroundColor: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            zIndex: 20,
            minWidth: '148px',
            overflow: 'hidden',
          }}
        >
          {options.map((opt) => {
            const optStyle = styleMap[opt] ?? Object.values(styleMap)[0]
            const isActive = opt === value
            return (
              <button
                key={opt}
                onClick={() => onSelect(opt)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 12px',
                  backgroundColor: isActive ? optStyle.bg : 'transparent',
                  color: isActive ? optStyle.text : '#64748b',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: isActive ? '700' : '500',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = '#f8fafc' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = isActive ? optStyle.bg : 'transparent' }}
              >
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: optStyle.dot, flexShrink: 0 }} />
                {opt}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Confirmation Modal ───────────────────────────────────────────────────────

const ConfirmModal = ({ isOpen, onCancel, onConfirm }) => {
  if (!isOpen) return null

  return (
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
      onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '14px',
          padding: '28px 28px 24px',
          width: '100%',
          maxWidth: '380px',
          boxShadow: '0 20px 48px rgba(0,0,0,0.18)',
          margin: '0 16px',
        }}
      >
        <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0 0 8px' }}>
          Confirm Status Change
        </h3>
        <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 24px', lineHeight: '1.5' }}>
          Are you sure you want to update this status?
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '9px 20px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#fff',
              color: '#475569',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '9px 20px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#252F3E',
              color: '#fff',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Confirm
          </button>
        </div>
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

  // Dropdown open state: `${segmentId}-status` | `${segmentId}-capacity`
  const [openDropdown, setOpenDropdown]       = useState(null)
  // Segment currently being saved (disables its controls)
  const [updatingSegment, setUpdatingSegment] = useState(null)
  // Whether the event status is being saved
  const [updatingEventStatus, setUpdatingEventStatus] = useState(false)

  // Detect dark mode — AdminLayout applies 'dark' class to <html>
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

  // ── Confirmation modal state ────────────────────────────────────────────────
  // pendingStatusUpdate shape:
  //   { type: 'segment-status', segmentId, value }
  //   { type: 'segment-capacity', segmentId, value }
  //   { type: 'event-status', value }
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState(null)
  const isModalOpen = pendingStatusUpdate !== null

  // ── Data loading ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!eventId) { setLoading(false); return }
    loadEventAndSegments()
  }, [eventId])

  const loadEventAndSegments = async () => {
    setLoading(true)
    setError('')
    try {
      const [eventResult, segmentsResult] = await Promise.all([
        getEventById(eventId),
        getSegmentsByEventId(eventId),
      ])
      if (!eventResult.success) { setError(eventResult.error || 'Failed to load event'); return }
      setEvent(eventResult.data)
      if (segmentsResult.success) {
        setSegments(segmentsResult.data || [])
      } else {
        setError(segmentsResult.error || 'Failed to load segments')
      }
    } catch (err) {
      console.error('Error in loadEventAndSegments:', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  // ── Group by start_time (memoised) ──────────────────────────────────────────

  const timeGroups = useMemo(() => groupSegmentsByStartTime(segments), [segments])

  // ── Optimistic local update helper ─────────────────────────────────────────

  const patchSegment = (segmentId, patch) =>
    setSegments((prev) => prev.map((s) => (s.id === segmentId ? { ...s, ...patch } : s)))

  // ── Intercept changes → queue pending, open modal ──────────────────────────

  const requestSegmentStatus   = (segmentId, value) => {
    setOpenDropdown(null)
    setPendingStatusUpdate({ type: 'segment-status', segmentId, value })
  }

  const requestSegmentCapacity = (segmentId, value) => {
    setOpenDropdown(null)
    setPendingStatusUpdate({ type: 'segment-capacity', segmentId, value })
  }

  const requestEventStatus = (value) => {
    setPendingStatusUpdate({ type: 'event-status', value })
  }

  // ── Modal: cancel ──────────────────────────────────────────────────────────

  const handleModalCancel = () => setPendingStatusUpdate(null)

  // ── Modal: confirm → execute the right DB update ──────────────────────────

  const handleModalConfirm = async () => {
    if (!pendingStatusUpdate) return
    const pending = pendingStatusUpdate
    setPendingStatusUpdate(null)

    if (pending.type === 'segment-status') {
      const { segmentId, value } = pending
      setUpdatingSegment(segmentId)
      patchSegment(segmentId, { segment_status: value })
      const result = await updateSegmentStatus(segmentId, value)
      if (!result.success) {
        setError(result.error || 'Failed to update status')
        loadEventAndSegments()
      }
      setUpdatingSegment(null)
    }

    if (pending.type === 'segment-capacity') {
      const { segmentId, value } = pending
      setUpdatingSegment(segmentId)
      patchSegment(segmentId, { room_capacity: value })
      const result = await updateSegment(segmentId, { room_capacity: value })
      if (!result.success) {
        setError(result.error || 'Failed to update room capacity')
        loadEventAndSegments()
      }
      setUpdatingSegment(null)
    }

    if (pending.type === 'event-status') {
      setUpdatingEventStatus(true)
      setEvent((prev) => ({ ...prev, event_status: pending.value }))
      const result = await updateEvent(eventId, { event_status: pending.value })
      if (!result.success) {
        setError(result.error || 'Failed to update event status')
        loadEventAndSegments()
      }
      setUpdatingEventStatus(false)
    }
  }

  // Close dropdowns on outside click
  useEffect(() => {
    if (!openDropdown) return
    const close = () => setOpenDropdown(null)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [openDropdown])

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div>

      {/* ── Confirmation modal ── */}
      <ConfirmModal
        isOpen={isModalOpen}
        onCancel={handleModalCancel}
        onConfirm={handleModalConfirm}
      />

      {/* ── Page header ── */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: isDarkMode ? '#fff' : '#0f172a', margin: 0 }}>
          Manage Flow
        </h1>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div
          style={{
            backgroundColor: '#fee2e2',
            border: '1px solid #fca5a5',
            color: '#991b1b',
            padding: '14px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          {error}
          <button
            onClick={() => setError('')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b', fontSize: '16px', lineHeight: 1, flexShrink: 0 }}
          >
            ×
          </button>
        </div>
      )}

      {/* ── Current Event card (navy redesign) ── */}
      {event && (
        <div
          style={{
            backgroundColor: '#252F3E',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '32px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
          }}
        >
          {/* Label */}
          <p style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>
            Current Event
          </p>

          {/* Title */}
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', margin: '0 0 10px', lineHeight: '1.3' }}>
            {event.title}
          </h2>

          {/* Venue + Date side-by-side */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
            {event.venue && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: '#cbd5e1' }}>
                <MapPin size={13} color="#94a3b8" /> {event.venue}
              </span>
            )}
            {event.start_date && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: '#cbd5e1' }}>
                <Clock size={13} color="#94a3b8" /> {formatDate(event.start_date)}
              </span>
            )}
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginBottom: '14px' }} />

          {/* Event Status dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8' }}>Event Status</span>
            <select
              value={event.event_status || 'UPCOMING'}
              onChange={(e) => requestEventStatus(e.target.value)}
              disabled={updatingEventStatus}
              style={{
                appearance: 'none',
                WebkitAppearance: 'none',
                padding: '6px 32px 6px 12px',
                borderRadius: '7px',
                border: '1px solid rgba(255,255,255,0.15)',
                backgroundColor: EVENT_STATUS_STYLE[event.event_status || 'UPCOMING']?.bg ?? 'rgba(99,179,237,0.18)',
                color: EVENT_STATUS_STYLE[event.event_status || 'UPCOMING']?.text ?? '#93c5fd',
                fontSize: '12px',
                fontWeight: '700',
                cursor: updatingEventStatus ? 'not-allowed' : 'pointer',
                opacity: updatingEventStatus ? 0.6 : 1,
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 10px center',
                letterSpacing: '0.04em',
              }}
            >
              {EVENT_STATUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt} style={{ backgroundColor: '#1e2a3a', color: '#e2e8f0' }}>
                  {opt}
                </option>
              ))}
            </select>
            {updatingEventStatus && (
              <span style={{ fontSize: '11px', color: '#64748b' }}>Saving…</span>
            )}
          </div>
        </div>
      )}

      {/* ── Schedule section ── */}
      <div>
        <h2 style={{ fontSize: '15px', fontWeight: '700', color: isDarkMode ? '#fff' : '#0f172a', marginBottom: '20px' }}>
          Schedule
        </h2>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: '#94a3b8', fontSize: '14px' }}>
            Loading segments...
          </div>
        )}

        {/* Empty */}
        {!loading && segments.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 24px',
              color: isDarkMode ? '#94a3b8' : '#64748b',
              fontSize: '14px',
              backgroundColor: isDarkMode ? '#252F3E' : '#fff',
              borderRadius: '12px',
              border: isDarkMode ? '1px solid rgba(100, 116, 139, 0.3)' : '1px solid #e2e8f0',
            }}
          >
            No segments scheduled for this event yet.
          </div>
        )}

        {/* ── Time groups ── */}
        {!loading && timeGroups.map(({ timeKey, label, segments: groupSegs }) => (
          <div key={timeKey}>
            {/* Time block header */}
            <h3
              style={{
                fontSize: '13px',
                fontWeight: '700',
                color: isDarkMode ? '#fff' : '#0f172a',
                marginTop: '28px',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  backgroundColor: isDarkMode ? '#334155' : '#f1f5f9',
                  color: isDarkMode ? '#cbd5e1' : '#334155',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '700',
                  letterSpacing: '0.02em',
                }}
              >
                <Clock size={11} color={isDarkMode ? '#94a3b8' : '#64748b'} />
                {label || 'Unscheduled'}
              </span>
              {groupSegs.length > 1 && (
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500' }}>
                  {groupSegs.length} concurrent sessions
                </span>
              )}
            </h3>

            {/* Segment grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {groupSegs.map((segment) => {
                const isUpdating = updatingSegment === segment.id

                return (
                  <div
                    key={segment.id}
                    style={{
                      backgroundColor: isDarkMode ? '#252F3E' : '#fff',
                      border: isDarkMode ? '1px solid rgba(100, 116, 139, 0.3)' : '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '16px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      transition: 'box-shadow 0.15s, border-color 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'
                      e.currentTarget.style.borderColor = isDarkMode ? 'rgba(100, 116, 139, 0.5)' : '#cbd5e1'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'
                      e.currentTarget.style.borderColor = isDarkMode ? 'rgba(100, 116, 139, 0.3)' : '#e2e8f0'
                    }}
                  >
                    {/* Title */}
                    <h3
                      style={{
                        fontSize: '14px',
                        fontWeight: '700',
                        color: isDarkMode ? '#fff' : '#0f172a',
                        margin: 0,
                        lineHeight: '1.3',
                      }}
                    >
                      {segment.title}
                    </h3>

                    {/* ── Time + Venue row (compact, side-by-side) ── */}
                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                      {/* Time range */}
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '12px',
                          color: isDarkMode ? '#94a3b8' : '#64748b',
                          fontWeight: '500',
                        }}
                      >
                        <Clock size={11} color={isDarkMode ? '#94a3b8' : '#64748b'} />
                        {formatTime(segment.start_time)}
                        {segment.end_time && (
                          <>
                            <span style={{ color: isDarkMode ? '#64748b' : '#cbd5e1', margin: '0 1px' }}>→</span>
                            {formatTime(segment.end_time)}
                          </>
                        )}
                      </span>

                      {/* Venue */}
                      {segment.room_name && (
                        <span
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '12px',
                            color: isDarkMode ? '#94a3b8' : '#64748b',
                            fontWeight: '500',
                          }}
                        >
                          <MapPin size={11} color={isDarkMode ? '#94a3b8' : '#64748b'} />
                          {segment.room_name}
                        </span>
                      )}
                    </div>

                    {/* Speaker tag */}
                    {segment.speaker_name && (
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 10px',
                          backgroundColor: '#f1f5f9',
                          borderRadius: '12px',
                          fontSize: '12px',
                          color: '#475569',
                          fontWeight: '500',
                          alignSelf: 'flex-start',
                        }}
                      >
                        🎤 {segment.speaker_name}
                      </div>
                    )}

                    {/* ── Dual control row ── */}
                    <div
                      style={{
                        display: 'flex',
                        gap: '8px',
                        flexWrap: 'wrap',
                        paddingTop: '8px',
                        borderTop: isDarkMode ? '1px solid rgba(100,116,139,0.3)' : '1px solid #f1f5f9',
                        marginTop: 'auto',
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      {/* Status dropdown */}
                      <ControlDropdown
                        dropdownKey={`${segment.id}-status`}
                        value={segment.segment_status || 'Not Started'}
                        options={STATUS_OPTIONS}
                        styleMap={STATUS_STYLE}
                        openId={openDropdown}
                        onToggle={setOpenDropdown}
                        onSelect={(val) => requestSegmentStatus(segment.id, val)}
                        disabled={isUpdating}
                      />

                      {/* Capacity dropdown */}
                      <ControlDropdown
                        dropdownKey={`${segment.id}-capacity`}
                        value={segment.room_capacity || 'VACANT'}
                        options={CAPACITY_OPTIONS}
                        styleMap={CAPACITY_STYLE}
                        openId={openDropdown}
                        onToggle={setOpenDropdown}
                        onSelect={(val) => requestSegmentCapacity(segment.id, val)}
                        disabled={isUpdating}
                      />

                      {/* Saving indicator */}
                      {isUpdating && (
                        <span style={{ fontSize: '11px', color: '#94a3b8', alignSelf: 'center', marginLeft: 'auto' }}>
                          Saving…
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
