import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getSegmentsByEventId, updateSegment } from '../../services/segments'
import { updateSegmentStatus } from '../../services/notifications'
import { getEventById } from '../../services/events'
import { ChevronDown, Clock, MapPin } from 'lucide-react'

// ─── Formatters ──────────────────────────────────────────────────────────────

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

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_OPTIONS = ['Not Started', 'Ongoing', 'Finished', 'Skipped']

const STATUS_STYLE = {
  Ongoing:      { bg: '#fef3c7', text: '#92400e', dot: '#f59e0b' },
  Finished:     { bg: '#dcfce7', text: '#166534', dot: '#22c55e' },
  Skipped:      { bg: '#fee2e2', text: '#991b1b', dot: '#ef4444' },
  'Not Started':{ bg: '#f1f5f9', text: '#334155', dot: '#94a3b8' },
}

const getStatusStyle = (status) => STATUS_STYLE[status] ?? STATUS_STYLE['Not Started']

// ─── Room capacity config ─────────────────────────────────────────────────────

const CAPACITY_OPTIONS = ['VACANT', 'FILLING', 'FULL', 'AT CAPACITY']

const CAPACITY_STYLE = {
  VACANT:      { bg: '#f0fdf4', text: '#15803d', dot: '#22c55e' },
  FILLING:     { bg: '#fffbeb', text: '#b45309', dot: '#f59e0b' },
  FULL:        { bg: '#fff7ed', text: '#c2410c', dot: '#f97316' },
  'AT CAPACITY':{ bg: '#fee2e2', text: '#991b1b', dot: '#ef4444' },
}

const getCapacityStyle = (capacity) =>
  CAPACITY_STYLE[capacity] ?? CAPACITY_STYLE['VACANT']

// ─── Group segments by start_time key ────────────────────────────────────────
// Returns an array of { timeKey, label, segments } in ascending time order.
// Since segments are already fetched ordered by start_time ASC, we preserve
// that order — useMemo just groups them.

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

// ─── Inline dropdown ─────────────────────────────────────────────────────────
// A reusable pill-button + popover used for both status and capacity.

const ControlDropdown = ({ id, dropdownKey, value, options, styleMap, openId, onToggle, onSelect, disabled }) => {
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
        {/* Status dot */}
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: style.dot,
            flexShrink: 0,
          }}
        />
        {value || options[0]}
        <ChevronDown
          size={12}
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s',
          }}
        />
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
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = '#f8fafc'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = isActive ? optStyle.bg : 'transparent'
                }}
              >
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: optStyle.dot,
                    flexShrink: 0,
                  }}
                />
                {opt}
              </button>
            )
          })}
        </div>
      )}
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

  // Tracks which dropdown is open: `${segmentId}-status` or `${segmentId}-capacity`
  const [openDropdown, setOpenDropdown]       = useState(null)
  // Tracks which segment is mid-save so both controls disable together
  const [updatingSegment, setUpdatingSegment] = useState(null)

  // ── Data loading ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!eventId) {
      setLoading(false)
      return
    }
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

      if (!eventResult.success) {
        setError(eventResult.error || 'Failed to load event')
        return
      }
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

  const patchSegment = (segmentId, patch) => {
    setSegments((prev) =>
      prev.map((s) => (s.id === segmentId ? { ...s, ...patch } : s))
    )
  }

  // ── Status change ───────────────────────────────────────────────────────────

  const handleStatusChange = async (segmentId, newStatus) => {
    setOpenDropdown(null)
    setUpdatingSegment(segmentId)
    patchSegment(segmentId, { segment_status: newStatus })

    const result = await updateSegmentStatus(segmentId, newStatus)
    if (!result.success) {
      setError(result.error || 'Failed to update status')
      // Roll back — reload from server
      loadEventAndSegments()
    }
    setUpdatingSegment(null)
  }

  // ── Capacity change ─────────────────────────────────────────────────────────

  const handleCapacityChange = async (segmentId, newCapacity) => {
    setOpenDropdown(null)
    setUpdatingSegment(segmentId)
    patchSegment(segmentId, { room_capacity: newCapacity })

    const result = await updateSegment(segmentId, { room_capacity: newCapacity })
    if (!result.success) {
      setError(result.error || 'Failed to update room capacity')
      loadEventAndSegments()
    }
    setUpdatingSegment(null)
  }

  // Close any open dropdown when clicking outside
  useEffect(() => {
    if (!openDropdown) return
    const close = () => setOpenDropdown(null)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [openDropdown])

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div>

      {/* ── Page header ── */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
          Program Flow
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
          Manage the flow of {event?.title || 'this event'}. Update status and room capacity in real time.
        </p>
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

      {/* ── Event summary card ── */}
      {event && (
        <div
          style={{
            backgroundColor: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '20px 24px',
            marginBottom: '36px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: 1, minWidth: '180px' }}>
            <p style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
              Current Event
            </p>
            <h2 style={{ fontSize: '17px', fontWeight: '700', color: '#0f172a', margin: 0, lineHeight: 1.3 }}>
              {event.title}
            </h2>
          </div>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '13px', color: '#64748b' }}>
            {event.venue && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <MapPin size={13} color="#94a3b8" /> {event.venue}
              </span>
            )}
            {event.start_date && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Clock size={13} color="#94a3b8" /> {formatDate(event.start_date)}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Segments section ── */}
      <div>
        <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>
          Schedule
        </h2>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '24px' }}>
          Segments grouped by start time. Concurrent sessions appear side by side.
        </p>

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
              color: '#64748b',
              fontSize: '14px',
              backgroundColor: '#fff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
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
                color: '#0f172a',
                marginTop: '32px',
                marginBottom: '12px',
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
                  backgroundColor: '#f1f5f9',
                  color: '#334155',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '700',
                  letterSpacing: '0.02em',
                }}
              >
                <Clock size={11} color="#64748b" />
                {label || 'Unscheduled'}
              </span>
              {groupSegs.length > 1 && (
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500' }}>
                  {groupSegs.length} concurrent sessions
                </span>
              )}
            </h3>

            {/* Responsive segment grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {groupSegs.map((segment) => {
                const statusStyle   = getStatusStyle(segment.segment_status)
                const capacityStyle = getCapacityStyle(segment.room_capacity)
                const isUpdating    = updatingSegment === segment.id

                return (
                  <div
                    key={segment.id}
                    style={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '20px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      transition: 'box-shadow 0.15s, border-color 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'
                      e.currentTarget.style.borderColor = '#cbd5e1'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'
                      e.currentTarget.style.borderColor = '#e2e8f0'
                    }}
                  >
                    {/* Card header: title + time range */}
                    <div>
                      <h3
                        style={{
                          fontSize: '15px',
                          fontWeight: '700',
                          color: '#0f172a',
                          margin: '0 0 6px',
                          lineHeight: '1.3',
                        }}
                      >
                        {segment.title}
                      </h3>

                      {/* Time range */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '12px',
                          color: '#94a3b8',
                          fontWeight: '500',
                        }}
                      >
                        <Clock size={11} />
                        {formatTime(segment.start_time)}
                        {segment.end_time && (
                          <>
                            <span style={{ color: '#cbd5e1' }}>→</span>
                            {formatTime(segment.end_time)}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Room name */}
                    {segment.room_name && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '12px',
                          color: '#64748b',
                          fontWeight: '500',
                        }}
                      >
                        <MapPin size={11} color="#94a3b8" />
                        {segment.room_name}
                      </div>
                    )}

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
                        paddingTop: '4px',
                        borderTop: '1px solid #f1f5f9',
                        marginTop: 'auto',
                      }}
                      // Stop click from bubbling to document (would close dropdown)
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      {/* Status dropdown */}
                      <ControlDropdown
                        id={segment.id}
                        dropdownKey={`${segment.id}-status`}
                        value={segment.segment_status || 'Not Started'}
                        options={STATUS_OPTIONS}
                        styleMap={STATUS_STYLE}
                        openId={openDropdown}
                        onToggle={setOpenDropdown}
                        onSelect={(val) => handleStatusChange(segment.id, val)}
                        disabled={isUpdating}
                      />

                      {/* Capacity dropdown */}
                      <ControlDropdown
                        id={segment.id}
                        dropdownKey={`${segment.id}-capacity`}
                        value={segment.room_capacity || 'VACANT'}
                        options={CAPACITY_OPTIONS}
                        styleMap={CAPACITY_STYLE}
                        openId={openDropdown}
                        onToggle={setOpenDropdown}
                        onSelect={(val) => handleCapacityChange(segment.id, val)}
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
