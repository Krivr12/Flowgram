import { useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react'
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

const formatTimeHeader = (timeKey) => {
  if (!timeKey) return timeKey
  const [hours, minutes] = timeKey.split(':').map(Number)
  if (isNaN(hours) || isNaN(minutes)) return timeKey
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHour = hours % 12 || 12
  return `${displayHour}:${String(minutes).padStart(2, '0')} ${period}`
}

// ─── Badge helpers ────────────────────────────────────────────────────────────

const CAPACITY_BADGE = {
  VACANT:       { bg: '#dcfce7', text: '#15803d', label: 'Vacant' },
  'FILLING IN': { bg: '#fef3c7', text: '#b45309', label: 'Filling In' },
  FULL:         { bg: '#fee2e2', text: '#dc2626', label: 'Full' },
}
const getCapacityBadge = (cap) => CAPACITY_BADGE[cap] ?? CAPACITY_BADGE['VACANT']

const STATUS_BADGE = {
  'Not Started': { bg: '#f1f5f9', text: '#334155' },
  Ongoing:       { bg: '#fef3c7', text: '#92400e' },
  Finished:      { bg: '#dcfce7', text: '#166534' },
  Skipped:       { bg: '#fee2e2', text: '#991b1b' },
}
const getStatusBadge = (status) => STATUS_BADGE[status] ?? STATUS_BADGE['Not Started']

// ─── Radio circle ─────────────────────────────────────────────────────────────

const RadioCircle = ({ checked }) => (
  <div
    style={{
      width: '20px',
      height: '20px',
      borderRadius: '50%',
      border: checked ? '2px solid #1B77CF' : '2px solid #cbd5e1',
      backgroundColor: checked ? '#1B77CF' : '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      transition: 'all 0.15s',
    }}
  >
    {checked && (
      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#fff' }} />
    )}
  </div>
)

// ─── Picker Card ──────────────────────────────────────────────────────────────

const PickerCard = ({ segment, isSelected, onSelect, onViewDetails }) => {
  const capBadge = getCapacityBadge(segment.capacity_status)
  const statusBadge = getStatusBadge(segment.segment_status)

  return (
    <div
      onClick={() => onSelect(segment.id)}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '14px',
        padding: '18px',
        borderRadius: '14px',
        border: isSelected ? '2px solid #1B77CF' : '1px solid #e2e8f0',
        backgroundColor: isSelected ? '#e8f4ff' : '#fff',
        cursor: 'pointer',
        transition: 'all 0.18s',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = '#cbd5e1'
          e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.07)'
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = '#e2e8f0'
          e.currentTarget.style.boxShadow = 'none'
        }
      }}
    >
      {/* Radio */}
      <div style={{ paddingTop: '2px' }}>
        <RadioCircle checked={isSelected} />
      </div>

      {/* Card body */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3
          style={{
            fontSize: '16px',
            fontWeight: '700',
            color: '#0f172a',
            margin: '0 0 10px',
            lineHeight: 1.3,
            paddingRight: '32px', // space for chevron
          }}
        >
          {segment.title}
        </h3>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', backgroundColor: '#f8fafc', padding: '5px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', color: '#475569' }}>
            <Clock size={12} />
            {formatTime(segment.start_time)}
            {segment.end_time && <> → {formatTime(segment.end_time)}</>}
          </span>
          {segment.room_name && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', backgroundColor: '#f8fafc', padding: '5px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', color: '#475569' }}>
              <MapPin size={12} /> {segment.room_name}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {segment.capacity_status && (
            <span style={{ padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', backgroundColor: capBadge.bg, color: capBadge.text }}>
              {capBadge.label}
            </span>
          )}
          {segment.segment_status && (
            <span style={{ padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', backgroundColor: statusBadge.bg, color: statusBadge.text }}>
              {segment.segment_status}
            </span>
          )}
        </div>
      </div>

      {/* Details chevron — tapping only this navigates to segment detail */}
      <button
        onClick={(e) => { e.stopPropagation(); onViewDetails(segment.id) }}
        aria-label="View details"
        style={{
          position: 'absolute',
          top: '16px',
          right: '14px',
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          border: 'none',
          backgroundColor: 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#94a3b8',
          transition: 'all 0.15s',
          padding: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#f1f5f9'
          e.currentTarget.style.color = '#475569'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent'
          e.currentTarget.style.color = '#94a3b8'
        }}
      >
        <ChevronRight size={18} strokeWidth={2} />
      </button>
    </div>
  )
}

// ─── Main ConcurrentPickerPage ────────────────────────────────────────────────

export const ConcurrentPickerPage = () => {
  const { timeBlock } = useParams()          // "HH:MM"
  const { state }     = useLocation()        // { segments: [...], currentPickId, eventId }
  const navigate      = useNavigate()

  const segments      = state?.segments      ?? []
  const eventId       = state?.eventId       ?? null
  const existingPicks = state?.pickedSegments ?? {}

  const [selectedId, setSelectedId] = useState(state?.currentPickId ?? null)
  const [saving, setSaving]         = useState(false)

  const handleSave = async () => {
    if (!selectedId) return
    setSaving(true)

    try {
      const user = await getCurrentUser()
      if (user && eventId) {
        const updatedMap = { ...existingPicks, [timeBlock]: selectedId }
        await supabase
          .from('user_itineraries')
          .upsert(
            { user_id: user.id, event_id: eventId, picked_segments: updatedMap },
            { onConflict: 'user_id, event_id' }
          )
      }
    } catch (err) {
      console.error('Picker save error:', err)
    } finally {
      setSaving(false)
      navigate('/app', { replace: true })
    }
  }

  // If state is missing (e.g. direct URL access), bail back
  if (segments.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '12px' }}>
        <p style={{ color: '#64748b', fontSize: '15px' }}>No sessions to display.</p>
        <button
          onClick={() => navigate('/app')}
          style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#fff', color: '#0f172a', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
        >
          Back to Flow
        </button>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '100px' }}>

      {/* ── Back button ── */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 0',
            background: 'none',
            border: 'none',
            color: '#64748b',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'color 0.15s, transform 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#0f172a'
            e.currentTarget.style.transform = 'translateX(-3px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#64748b'
            e.currentTarget.style.transform = 'translateX(0)'
          }}
        >
          <ChevronLeft size={18} strokeWidth={2.5} />
          Back
        </button>
      </div>

      {/* ── Header ── */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px', lineHeight: 1.3 }}>
          Choose Your Session
        </h1>
        <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
          {segments.length} sessions at <strong>{formatTimeHeader(timeBlock)}</strong> — pick one for your itinerary.
        </p>
      </div>

      {/* ── Segment list ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {segments.map((seg) => (
          <PickerCard
            key={seg.id}
            segment={seg}
            isSelected={selectedId === seg.id}
            onSelect={(id) => setSelectedId(id)}
            onViewDetails={(id) => navigate(`/app/segment/${id}`)}
          />
        ))}
      </div>

      {/* ── Sticky Save button ── */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '16px 24px',
          backgroundColor: '#fff',
          borderTop: '1px solid #e2e8f0',
          zIndex: 30,
        }}
      >
        <button
          onClick={handleSave}
          disabled={!selectedId || saving}
          style={{
            width: '100%',
            maxWidth: '600px',
            display: 'block',
            margin: '0 auto',
            padding: '14px',
            borderRadius: '12px',
            border: 'none',
            backgroundColor: !selectedId || saving ? '#cbd5e1' : '#0f172a',
            color: '#fff',
            fontSize: '15px',
            fontWeight: '700',
            cursor: !selectedId || saving ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.15s, transform 0.15s',
          }}
          onMouseEnter={(e) => {
            if (selectedId && !saving) {
              e.currentTarget.style.backgroundColor = '#1e293b'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = !selectedId || saving ? '#cbd5e1' : '#0f172a'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          {saving ? 'Saving…' : 'Save Selection'}
        </button>
      </div>
    </div>
  )
}
