import { useEffect, useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, MapPin, ChevronRight, ListFilter, Zap, ArrowRight } from 'lucide-react'
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
  VACANT:        { bg: '#dcfce7', text: '#15803d', label: 'Open' },
  FILLING:       { bg: '#fef3c7', text: '#b45309', label: 'Filling Up' },
  'FILLING IN':  { bg: '#fef3c7', text: '#b45309', label: 'Filling Up' },
  'ALMOST FULL': { bg: '#fff7ed', text: '#c2410c', label: 'Almost Full' },
  FULL:          { bg: '#fee2e2', text: '#dc2626', label: 'Full' },
}

const CAPACITY_BADGE_DARK = {
  VACANT:        { bg: 'rgba(34,197,94,0.15)',  text: '#6ee7b7', label: 'Open' },
  FILLING:       { bg: 'rgba(251,191,36,0.15)', text: '#fcd34d', label: 'Filling Up' },
  'FILLING IN':  { bg: 'rgba(251,191,36,0.15)', text: '#fcd34d', label: 'Filling Up' },
  'ALMOST FULL': { bg: 'rgba(249,115,22,0.15)', text: '#fdba74', label: 'Almost Full' },
  FULL:          { bg: 'rgba(239,68,68,0.15)',  text: '#fca5a5', label: 'Full' },
}

const getCapacityBadge = (cap, isDarkMode) => {
  const map = isDarkMode ? CAPACITY_BADGE_DARK : CAPACITY_BADGE
  return map[cap] ?? map['VACANT']
}

const STATUS_BADGE = {
  'Not Started': { bg: '#f1f5f9', text: '#334155' },
  Ongoing:       { bg: '#fef3c7', text: '#92400e' },
  Finished:      { bg: '#dcfce7', text: '#166534' },
  Skipped:       { bg: '#fee2e2', text: '#991b1b' },
}

const STATUS_BADGE_DARK = {
  'Not Started': { bg: 'rgba(100,116,139,0.2)',  text: '#cbd5e1' },
  Ongoing:       { bg: 'rgba(251,191,36,0.15)',  text: '#fcd34d' },
  Finished:      { bg: 'rgba(34,197,94,0.15)',   text: '#6ee7b7' },
  Skipped:       { bg: 'rgba(239,68,68,0.15)',   text: '#fca5a5' },
}

const getStatusBadge = (status, isDarkMode) => {
  const map = isDarkMode ? STATUS_BADGE_DARK : STATUS_BADGE
  return map[status] ?? map['Not Started']
}

// ─── Determine if segment is ongoing ──────────────────────────────────────────
// Priority: Explicit admin-set "Ongoing" status takes absolute control
// This allows admins to show/hide segments regardless of actual time

const isSegmentOngoing = (segment) => {
  // PRIORITY 1: Explicit "Ongoing" status (case-insensitive) - absolute control
  if (segment.segment_status && segment.segment_status.trim().toLowerCase() === 'ongoing') {
    return true
  }

  // If NOT explicitly marked as "Ongoing", return false
  // This ensures only admin-controlled status determines "Happening Now" visibility
  return false
}

// ─── Segment Detail Drawer (bottom sheet) ─────────────────────────────────────
// REMOVED — Now using dedicated route /app/segment/:id

// ─── Concurrent Picker Modal ───────────────────────────────────────────────────
// REMOVED — Now using dedicated route /app/picker/:timeBlock

// ─── Segment Card (timeline) ──────────────────────────────────────────────────

const SegmentCard = ({ segment, isConcurrent, isUserPick, onConcurrentClick, onCardClick, isDarkMode, dimmed, speakers }) => {
  const capBadge = getCapacityBadge(segment.capacity_status, isDarkMode)
  const statusBadge = getStatusBadge(segment.segment_status, isDarkMode)
  const segSpeakers = speakers || []

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
        opacity: dimmed ? 0.5 : 1,
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
            background: isDarkMode ? '#1B77CF' : 'linear-gradient(135deg, #FFA100 0%, #e89100 100%)',
            border: 'none',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: '700',
            color: '#fff',
            padding: '6px 10px',
            borderRadius: '8px',
            boxShadow: isDarkMode ? '0 2px 8px rgba(27, 119, 207, 0.3)' : '0 2px 8px rgba(249, 115, 22, 0.3)',
            transition: 'all 0.15s',
            letterSpacing: '0.02em',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)'
            e.currentTarget.style.boxShadow = isDarkMode ? '0 4px 12px rgba(27, 119, 207, 0.4)' : '0 4px 12px rgba(249, 115, 22, 0.4)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = isDarkMode ? '0 2px 8px rgba(27, 119, 207, 0.3)' : '0 2px 8px rgba(249, 115, 22, 0.3)'
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

      {/* Speakers */}
      {segSpeakers.length > 0 && (
        <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: isDarkMode ? '1px solid rgba(100,116,139,0.2)' : '1px solid #f1f5f9' }}>
          <p style={{ fontSize: '12px', color: isDarkMode ? '#cbd5e1' : '#475569', margin: 0, fontWeight: '500', lineHeight: 1.5 }}>
            {segSpeakers.slice(0, 2).map(sp => sp.full_name).join(', ')}
            {segSpeakers.length > 2 && <span style={{ color: isDarkMode ? '#64748b' : '#94a3b8' }}> +{segSpeakers.length - 2} more</span>}
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Ongoing dark card ────────────────────────────────────────────────────────

const OngoingCard = ({ segment, speakers, onCardClick, style }) => {
  const segmentSpeakers = speakers[segment.id] || []
  const displaySpeakers = segmentSpeakers.slice(0, 2)
  const remainingCount = segmentSpeakers.length - 2

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

      {/* ── Capacity Badge ── */}
      {/* Card is always dark, so keep the light (high-contrast) badge palette */}
      {segment.capacity_status && (() => {
        const capBadge = getCapacityBadge(segment.capacity_status, false)
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Seat Capacity:
            </span>
            <span style={{
              fontSize: '11px',
              fontWeight: '700',
              padding: '5px 12px',
              borderRadius: '8px',
              backgroundColor: capBadge.bg,
              color: capBadge.text,
            }}>
              {capBadge.label}
            </span>
          </div>
        )
      })()}

      {/* ── Speakers ── */}
      {segmentSpeakers.length > 0 && (
        <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {displaySpeakers.map((sp) => (
              <p key={sp.id} style={{ fontSize: '13px', color: '#e2e8f0', margin: 0, fontWeight: '500' }}>
                {sp.full_name}
                {sp.role && (
                  <span style={{ color: '#94a3b8', fontWeight: '400' }}> · {sp.role}</span>
                )}
              </p>
            ))}
            {remainingCount > 0 && (
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0', fontStyle: 'italic' }}>
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
  const [ongoingSpeakers, setOngoingSpeakers]   = useState({}) // { segmentId: [speakers] }
  const [allSpeakers, setAllSpeakers]           = useState({}) // { segmentId: [speakers] }
  const [viewMode, setViewMode]                 = useState('myflow') // 'full' | 'myflow'
  const [isDarkMode, setIsDarkMode]             = useState(() =>
    document.documentElement.classList.contains('dark')
  )
  const scrollTargetRef = useRef(null)
  const hasScrolledRef = useRef(false)

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

  // ── Poll segments every 3s for real-time status updates ───────────────────
  // Smart polling: pause when page is hidden to reduce load
  // Query optimization: only essential columns
  useEffect(() => {
    const selectedEventId = localStorage.getItem('selected_event_id')
    if (!selectedEventId) return

    const pollSegments = async () => {
      // Smart polling: skip if page is hidden
      if (document.hidden) return
      
      const result = await getSegmentsByEventId(selectedEventId)
      if (result.success) {
        setSegments(result.data || [])
      }
    }

    const interval = setInterval(pollSegments, 3000)
    
    // Smart polling: pause/resume based on page visibility
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Pause polling when page hidden
        clearInterval(interval)
      } else {
        // Resume polling when page visible - poll immediately then restart interval
        pollSegments()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [event])

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
      .map(([key, segs]) => ({
        key,
        // Sort concurrent segments: "15th Floor" first, then alphabetically by room
        segs: segs.length > 1
          ? segs.sort((a, b) => {
              const aIs15 = (a.room_name || '').toLowerCase().includes('15th')
              const bIs15 = (b.room_name || '').toLowerCase().includes('15th')
              if (aIs15 && !bIs15) return -1
              if (!aIs15 && bIs15) return 1
              return (a.room_name || '').localeCompare(b.room_name || '')
            })
          : segs,
      }))
      .sort((a, b) => a.key.localeCompare(b.key))
  }, [segments])

  // ── Ongoing segments logic ────────────────────────────────────────────────
  // BULLETPROOF RULE: Show user's picked ongoing segments
  // - If segment has concurrent alternatives → Check if user picked it
  // - If segment has NO concurrent alternatives → Always show it (auto-picked)

  const ongoingSegments = useMemo(() => {
    // Step 1: Get all segments marked as "Ongoing"
    const ongoing = segments.filter(isSegmentOngoing)
    
    if (ongoing.length === 0) {
      console.log('🔍 No ongoing segments found')
      return []
    }

    // Step 2: Build a map of time slots to segment counts
    const timeSlotMap = new Map()
    segments.forEach(seg => {
      const timeKey = getTimeKey(seg.start_time)
      if (!timeSlotMap.has(timeKey)) {
        timeSlotMap.set(timeKey, [])
      }
      timeSlotMap.get(timeKey).push(seg.id)
    })

    // Step 3: Get user's picked segment IDs
    const userPickedIds = Object.values(pickedSegments).filter(Boolean)
    const pickedTimeKeys = Object.keys(pickedSegments)
    
    console.log('🔍 All ongoing segments:', ongoing.map(s => ({ 
      id: s.id, 
      title: s.title, 
      time: getTimeKey(s.start_time) 
    })))
    console.log('🔍 User picked segments (IDs):', userPickedIds)
    console.log('🔍 Time keys with picks:', pickedTimeKeys)
    
    // Step 4: Filter ongoing segments
    const userOngoingSegments = ongoing.filter(seg => {
      const timeKey = getTimeKey(seg.start_time)
      const segmentsAtThisTime = timeSlotMap.get(timeKey) || []
      const isConcurrent = segmentsAtThisTime.length > 1
      
      if (isConcurrent) {
        // Concurrent segment - check if user picked THIS specific one
        const isPicked = userPickedIds.includes(seg.id)
        console.log(`  ⚡ Concurrent segment "${seg.title}": picked=${isPicked}`)
        return isPicked
      } else {
        // Non-concurrent segment - always include (auto-picked)
        console.log(`  ✨ Non-concurrent segment "${seg.title}": auto-included`)
        return true
      }
    })
    
    console.log('✅ Final ongoing segments to display:', userOngoingSegments.length)
    return userOngoingSegments
  }, [segments, pickedSegments])

  // ── Progress tracking ─────────────────────────────────────────────────────
  const progress = useMemo(() => {
    const total = segments.length
    const done = segments.filter(s => s.segment_status === 'Finished' || s.segment_status === 'Skipped').length
    return { done, total }
  }, [segments])

  // ── Find first non-completed time group index for auto-scroll ─────────────
  const firstActiveGroupIndex = useMemo(() => {
    for (let i = 0; i < timeGroups.length; i++) {
      const { segs } = timeGroups[i]
      const allDone = segs.every(s => s.segment_status === 'Finished' || s.segment_status === 'Skipped')
      if (!allDone) return i
    }
    return -1
  }, [timeGroups])

  // ── Auto-scroll to current/next session on first load ─────────────────────
  useEffect(() => {
    if (hasScrolledRef.current || loading || !scrollTargetRef.current) return
    hasScrolledRef.current = true
    setTimeout(() => {
      scrollTargetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 300)
  }, [loading, firstActiveGroupIndex])

  // Fetch speakers for ALL ongoing segments
  // Query optimization: select only needed columns
  useEffect(() => {
    if (ongoingSegments.length === 0) {
      setOngoingSpeakers([])
      return
    }
    
    let cancelled = false
    const fetchOngoingSpeakers = async () => {
      // Skip if page is hidden (smart polling)
      if (document.hidden) return
      
      // Fetch speakers for all ongoing segments
      const segmentIds = ongoingSegments.map(seg => seg.id)
      const { data, error } = await supabase
        .from('segment_speakers')
        .select('segment_id, speaker_id, speakers(id, full_name, role, company)')
        .in('segment_id', segmentIds)
      
      if (!cancelled && !error && data) {
        // Group speakers by segment_id
        const speakersBySegment = {}
        data.forEach((r) => {
          if (r.speakers) {
            if (!speakersBySegment[r.segment_id]) {
              speakersBySegment[r.segment_id] = []
            }
            speakersBySegment[r.segment_id].push(r.speakers)
          }
        })
        setOngoingSpeakers(speakersBySegment)
      }
    }
    fetchOngoingSpeakers()
    return () => { cancelled = true }
  }, [ongoingSegments])

  const handleSegmentClick = (segment) => {
    navigate(`/app/segment/${segment.id}`)
  }

  // ── Fetch speakers for ALL segments (for card display) ────────────────────
  // Query optimization: select only needed columns
  useEffect(() => {
    if (segments.length === 0) { setAllSpeakers({}); return }
    
    let cancelled = false
    const fetchAllSpeakers = async () => {
      // Skip if page is hidden (smart polling)
      if (document.hidden) return
      
      const segmentIds = segments.map(seg => seg.id)
      const { data, error } = await supabase
        .from('segment_speakers')
        .select('segment_id, speaker_id, speakers(id, full_name, role, company)')
        .in('segment_id', segmentIds)
      
      if (!cancelled && !error && data) {
        const speakersBySegment = {}
        data.forEach((r) => {
          if (r.speakers) {
            if (!speakersBySegment[r.segment_id]) {
              speakersBySegment[r.segment_id] = []
            }
            speakersBySegment[r.segment_id].push(r.speakers)
          }
        })
        setAllSpeakers(speakersBySegment)
      }
    }
    fetchAllSpeakers()
    return () => { cancelled = true }
  }, [segments])

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
      <div style={{ maxWidth: '100%', paddingTop: '16px', paddingBottom: '80px' }}>
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: isDarkMode ? '#e2e8f0' : '#0f172a', textAlign: 'left', marginBottom: '16px', marginTop: '8px', transition: 'color 0.2s' }}>
            Flow
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
          <Zap size={32} color={isDarkMode ? '#64748b' : '#cbd5e1'} style={{ marginBottom: '16px', transition: 'color 0.2s' }} />
          <h2 style={{ fontSize: '17px', fontWeight: '700', color: isDarkMode ? '#e2e8f0' : '#0f172a', margin: '0 0 8px', transition: 'color 0.2s' }}>
            No event selected
          </h2>
          <p style={{ fontSize: '14px', color: isDarkMode ? '#94a3b8' : '#64748b', maxWidth: '300px', margin: '0 0 24px', transition: 'color 0.2s' }}>
            Select an event first to see your personalized schedule.
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

  return (
    <div style={{ paddingBottom: '40px', margin: '-40px -16px 0', padding: '16px 16px 40px', minHeight: 'calc(100vh - 64px)', backgroundColor: isDarkMode ? '#1a222d' : '#f8fafc', transition: 'background-color 0.2s' }}>

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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {ongoingSegments.map((seg) => (
                <OngoingCard
                  key={seg.id}
                  segment={seg}
                  speakers={ongoingSpeakers}
                  onCardClick={handleSegmentClick}
                  style={{}}
                />
              ))}
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: '32px', backgroundColor: isDarkMode ? 'rgba(100, 116, 139, 0.1)' : 'rgba(30, 41, 59, 0.5)', border: isDarkMode ? '1px solid rgba(100, 116, 139, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '14px', padding: '20px', textAlign: 'center', transition: 'background-color 0.2s, border-color 0.2s' }}>
            <p style={{ fontSize: '14px', color: isDarkMode ? '#94a3b8' : '#94a3b8', margin: 0, fontStyle: 'italic', transition: 'color 0.2s' }}>
              No ongoing segment at the moment
            </p>
          </div>
        )}

        {/* ── Progress + View Toggle ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingLeft: '4px', paddingRight: '4px' }}>
          <div>
            <h2 style={{ fontSize: '13px', fontWeight: '800', color: isDarkMode ? '#e2e8f0' : '#0f172a', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0, transition: 'color 0.2s' }}>
              Schedule
            </h2>
            {progress.total > 0 && (
              <p style={{ fontSize: '11px', color: isDarkMode ? '#64748b' : '#94a3b8', margin: '4px 0 0', fontWeight: '600' }}>
                {progress.done} of {progress.total} sessions done
              </p>
            )}
          </div>

          {/* View toggle */}
          <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', border: isDarkMode ? '1px solid rgba(100,116,139,0.3)' : '1px solid #e2e8f0' }}>
            <button
              onClick={() => setViewMode('myflow')}
              style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                padding: '6px 12px', fontSize: '11px', fontWeight: '700',
                border: 'none', cursor: 'pointer',
                backgroundColor: viewMode === 'myflow' ? (isDarkMode ? '#1B77CF' : '#FFA100') : (isDarkMode ? '#252F3E' : '#fff'),
                color: viewMode === 'myflow' ? '#fff' : (isDarkMode ? '#94a3b8' : '#64748b'),
                transition: 'all 0.15s',
              }}
            >
              <Zap size={12} /> My Flow
            </button>
            <button
              onClick={() => setViewMode('full')}
              style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                padding: '6px 12px', fontSize: '11px', fontWeight: '700',
                border: 'none', cursor: 'pointer',
                backgroundColor: viewMode === 'full' ? (isDarkMode ? '#1B77CF' : '#FFA100') : (isDarkMode ? '#252F3E' : '#fff'),
                color: viewMode === 'full' ? '#fff' : (isDarkMode ? '#94a3b8' : '#64748b'),
                transition: 'all 0.15s',
              }}
            >
              <ListFilter size={12} /> All
            </button>
          </div>
        </div>

        {/* ── Instruction tip ── */}
        <p style={{ fontSize: '11px', color: isDarkMode ? '#64748b' : '#94a3b8', margin: '8px 0 16px 4px', lineHeight: 1.5, fontWeight: '500' }}>
          {viewMode === 'myflow'
            ? 'Your personalized schedule. Tap "change" on concurrent sessions to switch rooms.'
            : 'Full event schedule. All concurrent sessions are shown per time slot.'}
        </p>

        {/* ── Timeline Feed ── */}
        <div>
          {segments.length === 0 ? (
            <div style={{ backgroundColor: isDarkMode ? 'rgba(100, 116, 139, 0.1)' : 'rgba(30, 41, 59, 0.5)', border: isDarkMode ? '1px solid rgba(100, 116, 139, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '14px', padding: '40px 20px', textAlign: 'center', transition: 'background-color 0.2s, border-color 0.2s' }}>
              <p style={{ fontSize: '14px', color: isDarkMode ? '#94a3b8' : '#94a3b8', margin: 0, transition: 'color 0.2s' }}>
                No segments scheduled yet
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              {timeGroups.map(({ key, segs }, groupIndex) => {
                const isConcurrent = segs.length > 1
                const pickedSegId = pickedSegments[key]
                const displaySegment = pickedSegId
                  ? segs.find(s => s.id === pickedSegId) || segs[0]
                  : segs[0]

                // Check if all segments in this group are done
                const allDone = segs.every(s => s.segment_status === 'Finished' || s.segment_status === 'Skipped')
                const isDimmed = allDone

                // "My Flow" filter: in My Flow, concurrent unpicked slots show the nudge
                // (no filtering — all time groups always visible)

                // Auto-scroll ref: attach to first non-completed group
                const isScrollTarget = groupIndex === firstActiveGroupIndex

                return (
                  <div key={key} ref={isScrollTarget ? scrollTargetRef : undefined}>
                    {/* Time header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', paddingLeft: '4px', opacity: isDimmed ? 0.5 : 1, transition: 'opacity 0.3s' }}>
                      <span style={{ fontSize: '15px', fontWeight: '800', color: isDarkMode ? '#e2e8f0' : '#0f172a', transition: 'color 0.2s' }}>
                        {formatTimeHeader(key)}
                      </span>
                      {isConcurrent && (
                        <span style={{ fontSize: '11px', color: isDarkMode ? '#1B77CF' : '#FFA100', backgroundColor: isDarkMode ? 'rgba(27, 119, 207, 0.1)' : 'rgba(249, 115, 22, 0.1)', padding: '4px 9px', borderRadius: '6px', fontWeight: '700', letterSpacing: '0.02em', border: isDarkMode ? '1px solid rgba(27, 119, 207, 0.3)' : '1px solid rgba(249, 115, 22, 0.3)', transition: 'color 0.2s, background-color 0.2s, border-color 0.2s' }}>
                          {segs.length} Sessions
                        </span>
                      )}
                    </div>

                    {/* Segment card(s) */}
                    {viewMode === 'full' && isConcurrent ? (
                      // "All" view: show ALL concurrent sessions
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {segs.map((seg) => (
                          <SegmentCard
                            key={seg.id}
                            segment={seg}
                            isConcurrent={false}
                            isUserPick={pickedSegId === seg.id}
                            onConcurrentClick={() => openPicker(key, segs)}
                            onCardClick={handleSegmentClick}
                            isDarkMode={isDarkMode}
                            dimmed={isDimmed}
                            speakers={allSpeakers[seg.id]}
                          />
                        ))}
                      </div>
                    ) : (
                      // "My Flow" view or non-concurrent: show single card
                      <>
                        <SegmentCard
                          segment={displaySegment}
                          isConcurrent={false}
                          isUserPick={!!pickedSegId}
                          onConcurrentClick={() => openPicker(key, segs)}
                          onCardClick={handleSegmentClick}
                          isDarkMode={isDarkMode}
                          dimmed={isDimmed}
                          speakers={allSpeakers[displaySegment.id]}
                        />
                        {/* Edit pick button in My Flow for concurrent slots */}
                        {viewMode === 'myflow' && isConcurrent && pickedSegId && (
                          <button
                            onClick={() => openPicker(key, segs)}
                            style={{
                              marginTop: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '5px',
                              width: '100%',
                              padding: '8px',
                              borderRadius: '8px',
                              border: 'none',
                              backgroundColor: isDarkMode ? 'rgba(27, 119, 207, 0.1)' : 'rgba(255, 161, 0, 0.08)',
                              color: isDarkMode ? '#1B77CF' : '#FFA100',
                              fontSize: '12px',
                              fontWeight: '700',
                              cursor: 'pointer',
                              transition: 'all 0.15s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(27, 119, 207, 0.2)' : 'rgba(255, 161, 0, 0.15)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(27, 119, 207, 0.1)' : 'rgba(255, 161, 0, 0.08)'
                            }}
                          >
                            Change session
                          </button>
                        )}
                      </>
                    )}

                    {/* Unpicked concurrent nudge — show change button instead of dashed prompt */}
                    {isConcurrent && !pickedSegId && viewMode === 'myflow' && (
                      <button
                        onClick={() => openPicker(key, segs)}
                        style={{
                          marginTop: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '5px',
                          width: '100%',
                          padding: '8px',
                          borderRadius: '8px',
                          border: 'none',
                          backgroundColor: isDarkMode ? 'rgba(27, 119, 207, 0.1)' : 'rgba(255, 161, 0, 0.08)',
                          color: isDarkMode ? '#1B77CF' : '#FFA100',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(27, 119, 207, 0.2)' : 'rgba(255, 161, 0, 0.15)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(27, 119, 207, 0.1)' : 'rgba(255, 161, 0, 0.08)'
                        }}
                      >
                        {segs.length} sessions available — change
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

      {/* ── Modals ── */}
    </div>
  )
}
