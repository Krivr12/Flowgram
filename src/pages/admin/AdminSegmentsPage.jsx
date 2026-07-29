import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, Clock, MapPin, Users } from 'lucide-react'
import { getSegmentsByEventId } from '../../services/segments'
import { supabase } from '../../services/supabase'

const formatTime = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC',
  })
}

export const AdminSegmentsPage = () => {
  const { eventId } = useParams()
  const navigate = useNavigate()

  const [isDarkMode, setIsDarkMode] = useState(() =>
    document.documentElement.classList.contains('dark')
  )
  const [segments, setSegments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [segmentSpeakerCounts, setSegmentSpeakerCounts] = useState({})

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'))
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  useEffect(() => { loadSegments() }, [eventId])

  const loadSegments = async () => {
    setLoading(true)
    setError('')
    const result = await getSegmentsByEventId(eventId)
    if (result.success) {
      setSegments(result.data || [])
      await loadSpeakerCounts(result.data || [])
    } else {
      setError(result.error)
    }
    setLoading(false)
  }

  const loadSpeakerCounts = async (segs) => {
    const counts = {}
    await Promise.all(
      segs.map(async (seg) => {
        const { data } = await supabase
          .from('segment_speakers')
          .select('id')
          .eq('segment_id', seg.id)
        counts[seg.id] = data ? data.length : 0
      })
    )
    setSegmentSpeakerCounts(counts)
  }

  const goToNew  = () => navigate(`/admin/events/${eventId}/segments/new`)
  const goToEdit = (id) => navigate(`/admin/events/${eventId}/segments/edit/${id}`)

  return (
    <div>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: isDarkMode ? '#fff' : '#0f172a', margin: 0 }}>
          Segments
        </h1>
        <button
          onClick={goToNew}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            backgroundColor: isDarkMode ? '#2563eb' : '#f97316', color: '#fff',
            fontWeight: '600', fontSize: '14px',
            padding: '10px 20px', borderRadius: '9999px',
            border: 'none', cursor: 'pointer', flexShrink: 0,
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? '#1d4ed8' : '#ea580c'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? '#2563eb' : '#f97316'}
        >
          <Plus size={16} /> New Segment
        </button>
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{ marginBottom: '16px', padding: '12px 16px', backgroundColor: isDarkMode ? 'rgba(220, 38, 38, 0.1)' : '#fef2f2', border: isDarkMode ? '1px solid rgba(220, 38, 38, 0.3)' : '1px solid #fecaca', borderRadius: '8px', fontSize: '14px', color: isDarkMode ? '#fca5a5' : '#dc2626' }}>
          {error}
        </div>
      )}

      {/* ── Loading skeletons ── */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ backgroundColor: isDarkMode ? '#252F3E' : '#fff', borderRadius: '12px', border: isDarkMode ? '1px solid rgba(100, 116, 139, 0.3)' : '1px solid #e2e8f0', padding: '18px 20px', height: '72px' }} />
          ))}
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && segments.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '80px 24px', backgroundColor: isDarkMode ? '#252F3E' : '#fff', borderRadius: '12px', border: isDarkMode ? '1px solid rgba(100, 116, 139, 0.3)' : '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: isDarkMode ? '#e2e8f0' : '#0f172a', margin: '0 0 6px' }}>No segments yet</h2>
          <p style={{ fontSize: '14px', color: isDarkMode ? '#94a3b8' : '#64748b', margin: '0 0 24px' }}>Create segments to organize your event sessions.</p>
          <button
            onClick={goToNew}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: isDarkMode ? '#2563eb' : '#f97316', color: '#fff', fontWeight: '600', fontSize: '14px', padding: '10px 20px', borderRadius: '9999px', border: 'none', cursor: 'pointer' }}
          >
            <Plus size={16} /> New Segment
          </button>
        </div>
      )}

      {/* ── Segment list (grouped by start time) ── */}
      {!loading && segments.length > 0 && (
        <div>
          {Object.entries(
            segments.reduce((acc, segment) => {
              const timeKey = segment.start_time || '__no_time__'
              if (!acc[timeKey]) {
                acc[timeKey] = { time: segment.start_time, segments: [] }
              }
              acc[timeKey].segments.push(segment)
              return acc
            }, {})
          )
            .sort(([timeA], [timeB]) => {
              if (timeA === '__no_time__') return 1
              if (timeB === '__no_time__') return 1
              return new Date(timeA) - new Date(timeB)
            })
            .map(([timeKey, group]) => (
              <div key={timeKey} style={{ marginBottom: '28px' }}>
                {/* Time header */}
                {group.time && (
                  <h3 style={{ fontSize: '14px', fontWeight: '700', color: isDarkMode ? '#94a3b8' : '#64748b', margin: '0 0 12px' }}>
                    {formatTime(group.time)}
                  </h3>
                )}

                {/* Cards for this time group */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {group.segments.map((segment) => (
                    <SegmentCard
                      key={segment.id}
                      segment={segment}
                      speakerCount={segmentSpeakerCounts[segment.id] || 0}
                      isDarkMode={isDarkMode}
                      onClick={() => goToEdit(segment.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}

    </div>
  )
}

// ─── Segment Card ─────────────────────────────────────────────────────────────

const SegmentCard = ({ segment, speakerCount, isDarkMode, onClick }) => {
  const [hovered, setHovered] = useState(false)

  const bgColor     = isDarkMode ? '#252F3E' : '#ffffff'
  const borderColor = isDarkMode
    ? (hovered ? 'rgba(100, 116, 139, 0.5)' : 'rgba(100, 116, 139, 0.3)')
    : (hovered ? '#cbd5e1' : '#e2e8f0')
  const titleColor  = isDarkMode ? '#f8fafc' : '#252F3E'
  const metaColor   = isDarkMode ? '#94a3b8' : '#64748b'

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        backgroundColor: bgColor,
        border: '1px solid',
        borderColor: borderColor,
        borderRadius: '12px',
        padding: '16px 18px',
        cursor: 'pointer',
        boxShadow: hovered
          ? isDarkMode ? '0 4px 16px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.08)'
          : isDarkMode ? '0 1px 3px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.05)',
        transition: 'box-shadow 0.15s, border-color 0.15s',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Title */}
        <p style={{ fontSize: '15px', fontWeight: '700', color: titleColor, margin: 0, lineHeight: '1.3', marginBottom: '6px' }}>
          {segment.title}
        </p>

        {/* Time + Venue side-by-side */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '6px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: metaColor }}>
            <Clock size={12} color={metaColor} />
            {formatTime(segment.start_time)}
          </span>
          {segment.room_name && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: metaColor }}>
              <MapPin size={12} color={metaColor} />
              {segment.room_name}
            </span>
          )}
        </div>

        {/* Speaker count */}
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: metaColor }}>
          <Users size={11} color={metaColor} />
          {speakerCount === 1 ? '1 Speaker' : `${speakerCount} Speakers`}
        </span>
      </div>
    </div>
  )
}
