import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, MapPin, ChevronRight } from 'lucide-react'
import { getEventById } from '../../services/events'
import { getSegmentsByEventId } from '../../services/segments'
import { supabase, getCurrentUser } from '../../services/supabase'

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

// Extract time key (HH:MM) for grouping
const getTimeKey = (timeStr) => {
  if (!timeStr) return '__none__'
  const date = new Date(timeStr)
  const hours = String(date.getUTCHours()).padStart(2, '0')
  const minutes = String(date.getUTCMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

// Format time key to 12-hour AM/PM format
const formatTimeHeader = (timeKey) => {
  if (!timeKey || timeKey === '__none__') return timeKey
  const [hours, minutes] = timeKey.split(':').map(Number)
  if (isNaN(hours) || isNaN(minutes)) return timeKey
  
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHour = hours % 12 || 12
  return `${displayHour}:${String(minutes).padStart(2, '0')} ${period}`
}

// ─── Capacity & Status badge styles ───────────────────────────────────────────

const CAPACITY_BADGE = {
  VACANT:        { bg: '#dcfce7', text: '#15803d', label: 'Vacant' },
  'FILLING IN':  { bg: '#fef3c7', text: '#b45309', label: 'Filling In' },
  FULL:          { bg: '#fee2e2', text: '#dc2626', label: 'Full' },
}

const getCapacityBadge = (cap) => CAPACITY_BADGE[cap] ?? CAPACITY_BADGE['VACANT']

const STATUS_BADGE = {
  'Not Started': { bg: '#f1f5f9', text: '#334155' },
  Ongoing:       { bg: '#fef3c7', text: '#92400e' },
  Finished:      { bg: '#dcfce7', text: '#166534' },
  Skipped:       { bg: '#fee2e2', text: '#991b1b' },
}

const getStatusBadge = (status) => STATUS_BADGE[status] ?? STATUS_BADGE['Not Started']

// ─── Determine if segment is ongoing ──────────────────────────────────────────
// Checks EITHER the explicit status field OR falls back to time-based detection

const isSegmentOngoing = (segment) => {
  // Prefer the admin-set status field (case-insensitive)
  if (segment.segment_status && segment.segment_status.trim().toLowerCase() === 'ongoing') {
    return true
  }

  // Fallback: time-based check when no explicit status is set
  const now = new Date()
  const start = segment.start_time ? new Date(segment.start_time) : null
  const end = segment.end_time ? new Date(segment.end_time) : null

  if (!start) return false
  if (!end) return now >= start
  return now >= start && now < end
}

// ─── Segment Detail Drawer (bottom sheet) ─────────────────────────────────────
// REMOVED — Now using dedicated route /app/segment/:id

// ─── Concurrent Picker Modal ───────────────────────────────────────────────────
// REMOVED — Now using dedicated route /app/picker/:timeBlock

// ─── Segment Card (timeline) ──────────────────────────────────────────────────

const SegmentCard = ({ segment, isConcurrent, isUserPick, onConcurrentClick, onCardClick, isDarkMode }) => {
  const capBadge = getCapacityBadge(segment.capacity_status)
  const statusBadge = getStatusBadge(segment.segment_status)

  return (
    <div
      onClick={() => onCardClick(segment)}
      style={{
        backgroundColor: isDarkMode ? '#252F3E' : '#fff',
        border: isDarkMode ? '1px solid rgba(100,116,139,0.3)' : '1px solid #e2e8f0',
        borderRadius: '14px',
        padding: '18px',
        cursor: 'pointer',
        transition: 'all 0.2s, background-color 0.2s, border-color 0.2s',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = isDarkMode ? '0 6px 20px rgba(0,0,0,0.3)' : '0 6px 20px rgba(0,0,0,0.12)'
        e.currentTarget.style.borderColor = isDarkMode ? 'rgba(100,116,139,0.5)' : '#cbd5e1'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.borderColor = isDarkMode ? 'rgba(100,116,139,0.3)' : '#e2e8f0'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* Concurrent link — top right */}
      {isConcurrent && (
        <button
          onClick={(e) => { e.stopPropagation(); onConcurrentClick() }}
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: isDarkMode ? '#2563eb' : 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
            border: 'none',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: '700',
            color: '#fff',
            padding: '6px 10px',
            borderRadius: '8px',
            boxShadow: isDarkMode ? '0 2px 8px rgba(37, 99, 235, 0.3)' : '0 2px 8px rgba(249, 115, 22, 0.3)',
            transition: 'all 0.15s',
            letterSpacing: '0.02em',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)'
            e.currentTarget.style.boxShadow = isDarkMode ? '0 4px 12px rgba(37, 99, 235, 0.4)' : '0 4px 12px rgba(249, 115, 22, 0.4)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = isDarkMode ? '0 2px 8px rgba(37, 99, 235, 0.3)' : '0 2px 8px rgba(249, 115, 22, 0.3)'
          }}
        >
          Concurrent <ChevronRight size={13} strokeWidth={2.5} />
        </button>
      )}

      <h3 style={{ fontSize: '16px', fontWeight: '700', color: isDarkMode ? '#e2e8f0' : '#0f172a', margin: '0 0 10px', lineHeight: 1.3, paddingRight: isConcurrent ? '110px' : '0', transition: 'color 0.2s' }}>
        {segment.title}
      </h3>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', fontSize: '12px', color: isDarkMode ? '#94a3b8' : '#64748b', marginBottom: '12px', transition: 'color 0.2s' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: isDarkMode ? 'rgba(100,116,139,0.1)' : '#f8fafc', padding: '5px 10px', borderRadius: '8px', fontWeight: '600', transition: 'background-color 0.2s' }}>
          <Clock size={13} />
          {formatTime(segment.start_time)}
          {segment.end_time && <> → {formatTime(segment.end_time)}</>}
        </span>
        {segment.room_name && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: isDarkMode ? 'rgba(100,116,139,0.1)' : '#f8fafc', padding: '5px 10px', borderRadius: '8px', fontWeight: '600', transition: 'background-color 0.2s' }}>
            <MapPin size={13} /> {segment.room_name}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {segment.capacity_status && (
          <span style={{ padding: '5px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', backgroundColor: capBadge.bg, color: capBadge.text }}>
            {capBadge.label}
          </span>
        )}
        {segment.segment_status && (
          <span style={{ padding: '5px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', backgroundColor: statusBadge.bg, color: statusBadge.text }}>
            {segment.segment_status}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Ongoing dark card ────────────────────────────────────────────────────────

const OngoingCard = ({ segment, speakers, onCardClick, style }) => {
  const displaySpeakers = speakers.slice(0, 2)
  const remainingCount = speakers.length - 2

  return (
    <div
      onClick={() => onCardClick(segment)}
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderRadius: '16px',
        padding: '20px',
        cursor: 'pointer',
        border: '1px solid rgba(255,255,255,0.1)',
        transition: 'all 0.2s',
        ...style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)'
        e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.3)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* ── Top row: Happening Now (left) · Venue (right) ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <span style={{
            width: '8px', height: '8px', borderRadius: '50%',
            backgroundColor: '#22c55e', flexShrink: 0,
            boxShadow: '0 0 8px #22c55e',
            animation: 'pulse 2s infinite',
          }} />
          <span style={{ fontSize: '11px', fontWeight: '800', color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Happening Now
          </span>
        </div>

        {segment.room_name && (
          <span style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            fontSize: '12px', color: '#94a3b8', fontWeight: '500',
            flexShrink: 0,
          }}>
            <MapPin size={12} color="#64748b" />
            {segment.room_name}
          </span>
        )}
      </div>

      {/* ── Big title ── */}
      <h3 style={{
        fontSize: '24px',
        fontWeight: '900',
        color: '#f8fafc',
        margin: '0',
        lineHeight: 1.25,
        letterSpacing: '-0.02em',
      }}>
        {segment.title}
      </h3>

      {/* ── Speakers ── */}
      {speakers.length > 0 && (
        <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {displaySpeakers.map((sp) => (
              <p key={sp.id} style={{ fontSize: '13px', color: '#e2e8f0', margin: 0, fontWeight: '500' }}>
                {sp.full_name}
                {sp.role && (
                  <span style={{ color: '#64748b', fontWeight: '400' }}> · {sp.role}</span>
                )}
              </p>
            ))}
            {remainingCount > 0 && (
              <p style={{ fontSize: '12px', color: '#475569', margin: '2px 0 0', fontStyle: 'italic' }}>
                +{remainingCount} more
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Segment Detail Drawer (bottom sheet) ─────────────────────────────────────
// REMOVED — Now using dedicated route /app/segment/:id

// ─── Main FlowPage ────────────────────────────────────────────────────────────

export const FlowPage = () => {
  const navigate = useNavigate()
  const [event, setEvent]                       = useState(null)
  const [segments, setSegments]                 = useState([])
  const [loading, setLoading]                   = useState(true)
  const [error, setError]                       = useState('')
  const [currentUser, setCurrentUser]           = useState(null)
  const [pickedSegments, setPickedSegments]     = useState({}) // { "HH:MM": segmentId }
  const [ongoingSpeakers, setOngoingSpeakers]   = useState([]) // speakers for ongoing segment
  const [isDarkMode, setIsDarkMode]             = useState(() =>
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
    const init = async () => {
      const user = await getCurrentUser()
      setCurrentUser(user)
      await loadEventData(user)
    }
    init()
  }, [])

  const loadEventData = async (user) => {
    setLoading(true)
    setError('')
    const selectedEventId = localStorage.getItem('selected_event_id')
    if (!selectedEventId) { setLoading(false); return }

    try {
      const [eventResult, segmentsResult] = await Promise.all([
        getEventById(selectedEventId),
        getSegmentsByEventId(selectedEventId),
      ])

      if (!eventResult.success) {
        setError('Failed to load event')
        localStorage.removeItem('selected_event_id')
        setLoading(false)
        return
      }
      setEvent(eventResult.data)

      if (segmentsResult.success) {
        setSegments(segmentsResult.data || [])
      } else {
        setError('Failed to load schedule')
      }

      // Load itinerary picks for logged-in user
      if (user && selectedEventId) {
        const { data: itinerary } = await supabase
          .from('user_itineraries')
          .select('picked_segments')
          .eq('user_id', user.id)
          .eq('event_id', selectedEventId)
          .maybeSingle()

        if (itinerary?.picked_segments) {
          setPickedSegments(itinerary.picked_segments)
        }
      }
    } catch (err) {
      console.error('FlowPage load error:', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  // ── Group segments by time key ────────────────────────────────────────────

  const timeGroups = useMemo(() => {
    const map = new Map()
    for (const seg of segments) {
      const key = getTimeKey(seg.start_time)
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(seg)
    }
    return Array.from(map.entries())
      .map(([key, segs]) => ({ key, segs }))
      .sort((a, b) => a.key.localeCompare(b.key))
  }, [segments])

  // ── Ongoing segments logic ────────────────────────────────────────────────

  const ongoingSegments = useMemo(() => {
    const ongoing = segments.filter(isSegmentOngoing)
    if (ongoing.length === 0) return []

    // Check if user has a pick for the current time slot
    const ongoingTimeKeys = [...new Set(ongoing.map(s => getTimeKey(s.start_time)))]
    
    for (const timeKey of ongoingTimeKeys) {
      const pickedSegId = pickedSegments[timeKey]
      if (pickedSegId) {
        const pickedSeg = ongoing.find(s => s.id === pickedSegId)
        if (pickedSeg) return [pickedSeg] // Only show user's pick
      }
    }

    return ongoing // Show all ongoing if no pick exists
  }, [segments, pickedSegments])

  // Fetch speakers for the ongoing segment
  useEffect(() => {
    if (ongoingSegments.length === 0) {
      setOngoingSpeakers([])
      return
    }
    
    let cancelled = false
    const fetchOngoingSpeakers = async () => {
      const segmentId = ongoingSegments[0].id
      const { data, error } = await supabase
        .from('segment_speakers')
        .select('speaker_id, speakers(id, full_name, role, company)')
        .eq('segment_id', segmentId)
      
      if (!cancelled && !error && data) {
        setOngoingSpeakers(data.map((r) => r.speakers).filter(Boolean))
      }
    }
    fetchOngoingSpeakers()
    return () => { cancelled = true }
  }, [ongoingSegments])

  const handleSegmentClick = (segment) => {
    navigate(`/app/segment/${segment.id}`)
  }

  const openPicker = (key, segs) => {
    navigate(`/app/picker/${encodeURIComponent(key)}`, {
      state: {
        segments: segs,
        currentPickId: pickedSegments[key] ?? null,
        pickedSegments,
        eventId: event?.id ?? null,
      },
    })
  }

  // ─────────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: isDarkMode ? '#94a3b8' : '#64748b', fontSize: '15px', transition: 'color 0.2s' }}>
        Loading your schedule...
      </div>
    )
  }

  if (!event) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: isDarkMode ? '#94a3b8' : '#94a3b8', fontSize: '15px', gap: '12px', transition: 'color 0.2s' }}>
        <p>No event selected</p>
        <p style={{ fontSize: '13px', color: isDarkMode ? '#64748b' : '#64748b', transition: 'color 0.2s' }}>Please select an event from your dashboard</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '0', minHeight: '100vh', backgroundColor: isDarkMode ? '#1a222d' : '#f8fafc', transition: 'background-color 0.2s' }}>
      {/* Main content container */}
      <div style={{ padding: '16px 16px 80px' }}>

        {/* Error banner */}
        {error && (
          <div
            style={{
              backgroundColor: isDarkMode ? 'rgba(220, 38, 38, 0.1)' : 'rgba(220, 38, 38, 0.1)',
              border: isDarkMode ? '1px solid rgba(220, 38, 38, 0.3)' : '1px solid rgba(220, 38, 38, 0.3)',
              color: isDarkMode ? '#fca5a5' : '#fca5a5',
              padding: '14px 16px',
              borderRadius: '12px',
              fontSize: '13px',
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              transition: 'background-color 0.2s, border-color 0.2s, color 0.2s',
            }}
          >
            {error}
            <button
              onClick={() => setError('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: isDarkMode ? '#fca5a5' : '#fca5a5', fontSize: '20px', lineHeight: 1, transition: 'color 0.2s' }}
            >
              ×
            </button>
          </div>
        )}

        {/* ── "Happening Now" Section ── */}
        {ongoingSegments.length > 0 ? (
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative' }}>
              {ongoingSegments.map((seg, idx) => (
                <OngoingCard
                  key={seg.id}
                  segment={seg}
                  speakers={ongoingSpeakers}
                  onCardClick={handleSegmentClick}
                  style={
                    ongoingSegments.length > 1
                      ? {
                          position: idx === 0 ? 'relative' : 'absolute',
                          top: idx === 0 ? 0 : `${idx * 8}px`,
                          left: idx === 0 ? 0 : `${idx * 8}px`,
                          right: idx === 0 ? 0 : `${idx * 8}px`,
                          zIndex: ongoingSegments.length - idx,
                        }
                      : {}
                  }
                />
              ))}
            </div>
            {ongoingSegments.length > 1 && <div style={{ height: `${(ongoingSegments.length - 1) * 8}px` }} />}
          </div>
        ) : (
          <div style={{ marginBottom: '32px', backgroundColor: isDarkMode ? 'rgba(100, 116, 139, 0.1)' : 'rgba(30, 41, 59, 0.5)', border: isDarkMode ? '1px solid rgba(100, 116, 139, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '14px', padding: '20px', textAlign: 'center', transition: 'background-color 0.2s, border-color 0.2s' }}>
            <p style={{ fontSize: '14px', color: isDarkMode ? '#94a3b8' : '#94a3b8', margin: 0, fontStyle: 'italic', transition: 'color 0.2s' }}>
              No ongoing segment at the moment
            </p>
          </div>
        )}

        {/* ── Timeline Feed ── */}
        <div>
          <h2 style={{ fontSize: '13px', fontWeight: '800', color: isDarkMode ? '#e2e8f0' : '#0f172a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px', paddingLeft: '4px', transition: 'color 0.2s' }}>
            Schedule
          </h2>

          {segments.length === 0 ? (
            <div style={{ backgroundColor: isDarkMode ? 'rgba(100, 116, 139, 0.1)' : 'rgba(30, 41, 59, 0.5)', border: isDarkMode ? '1px solid rgba(100, 116, 139, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '14px', padding: '40px 20px', textAlign: 'center', transition: 'background-color 0.2s, border-color 0.2s' }}>
              <p style={{ fontSize: '14px', color: isDarkMode ? '#94a3b8' : '#94a3b8', margin: 0, transition: 'color 0.2s' }}>
                No segments scheduled yet
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              {timeGroups.map(({ key, segs }) => {
                const isConcurrent = segs.length > 1
                const pickedSegId = pickedSegments[key]
                const displaySegment = pickedSegId
                  ? segs.find(s => s.id === pickedSegId) || segs[0]
                  : segs[0]

                return (
                  <div key={key}>
                    {/* Time header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', paddingLeft: '4px' }}>
                      <span style={{ fontSize: '15px', fontWeight: '800', color: isDarkMode ? '#e2e8f0' : '#0f172a', transition: 'color 0.2s' }}>
                        {formatTimeHeader(key)}
                      </span>
                      {isConcurrent && (
                        <span style={{ fontSize: '11px', color: isDarkMode ? '#2563eb' : '#f97316', backgroundColor: isDarkMode ? 'rgba(37, 99, 235, 0.1)' : 'rgba(249, 115, 22, 0.1)', padding: '4px 9px', borderRadius: '6px', fontWeight: '700', letterSpacing: '0.02em', border: isDarkMode ? '1px solid rgba(37, 99, 235, 0.3)' : '1px solid rgba(249, 115, 22, 0.3)', transition: 'color 0.2s, background-color 0.2s, border-color 0.2s' }}>
                          {segs.length} Sessions
                        </span>
                      )}
                    </div>

                    {/* Segment card(s) */}
                    <SegmentCard
                      segment={displaySegment}
                      isConcurrent={isConcurrent}
                      isUserPick={!!pickedSegId}
                      onConcurrentClick={() => openPicker(key, segs)}
                      onCardClick={handleSegmentClick}
                      isDarkMode={isDarkMode}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ── */}
    </div>
  )
}
