import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, ArrowRight, X, Clock, MapPin, Users, ChevronRight, ArrowLeft, ExternalLink } from 'lucide-react'
import { getEventById } from '../../services/events'
import { getSegmentsByEventId } from '../../services/segments'
import { supabase } from '../../services/supabase'

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

// ─── Segment status → card style ─────────────────────────────────────────────

const STATUS_CARD = {
  Ongoing: {
    bg: '#fffbeb',
    border: '#fde68a',
    hoverBorder: '#f59e0b',
    hoverShadow: '0 4px 16px rgba(245,158,11,0.15)',
    badge: { bg: '#fef3c7', text: '#92400e' },
    dot: '#f59e0b',
  },
  Finished: {
    bg: '#f0fdf4',
    border: '#a7f3d0',
    hoverBorder: '#34d399',
    hoverShadow: '0 4px 16px rgba(52,211,153,0.15)',
    badge: { bg: '#dcfce7', text: '#166534' },
    dot: '#22c55e',
  },
  Skipped: {
    bg: '#fff1f2',
    border: '#fecdd3',
    hoverBorder: '#fb7185',
    hoverShadow: '0 4px 16px rgba(251,113,133,0.12)',
    badge: { bg: '#fee2e2', text: '#991b1b' },
    dot: '#ef4444',
  },
  'Not Started': {
    bg: '#ffffff',
    border: '#e2e8f0',
    hoverBorder: '#94a3b8',
    hoverShadow: '0 4px 16px rgba(0,0,0,0.08)',
    badge: { bg: '#f1f5f9', text: '#334155' },
    dot: '#94a3b8',
  },
}

const getStatusCard = (status) => STATUS_CARD[status] ?? STATUS_CARD['Not Started']

// ─── Capacity badge style ─────────────────────────────────────────────────────

const CAPACITY_BADGE = {
  VACANT:   { bg: '#f0fdf4', text: '#15803d', dot: '#22c55e' },
  MODERATE: { bg: '#fffbeb', text: '#b45309', dot: '#f59e0b' },
  FULL:     { bg: '#fff7ed', text: '#c2410c', dot: '#f97316' },
}

const getCapacityBadge = (cap) => CAPACITY_BADGE[cap] ?? CAPACITY_BADGE['VACANT']

// ─── Segment Detail Modal ─────────────────────────────────────────────────────

const SegmentModal = ({ segment, onClose }) => {
  const [speakers, setSpeakers]               = useState([])
  const [loadingSpeakers, setLoadingSpeakers] = useState(true)
  const [selectedSpeaker, setSelectedSpeaker] = useState(null)

  // Fetch speakers for this segment when it opens
  useEffect(() => {
    if (!segment) return
    let cancelled = false

    const fetchSpeakers = async () => {
      setLoadingSpeakers(true)
      const { data, error } = await supabase
        .from('segment_speakers')
        .select('speaker_id, speakers(id, full_name, role, company, event_role, description, linkedin_url)')
        .eq('segment_id', segment.id)

      if (!cancelled) {
        if (!error && data) {
          setSpeakers(data.map((row) => row.speakers).filter(Boolean))
        }
        setLoadingSpeakers(false)
      }
    }

    fetchSpeakers()
    return () => { cancelled = true }
  }, [segment?.id])

  // Close on Escape key
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!segment) return null

  const statusCard    = getStatusCard(segment.segment_status)
  const capacityBadge = getCapacityBadge(segment.capacity_status)

  return (
    // Backdrop
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backdropFilter: 'blur(2px)',
      }}
    >
      {/* Modal card — stop backdrop-close when clicking inside */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#fff',
          borderRadius: '16px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
          width: '100%',
          maxWidth: '480px',
          maxHeight: '88vh',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Coloured header strip based on status */}
        <div
          style={{
            backgroundColor: statusCard.bg,
            borderBottom: `1px solid ${statusCard.border}`,
            padding: '20px 24px 16px',
            borderRadius: '16px 16px 0 0',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Status pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: statusCard.dot,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  color: statusCard.badge.text,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                {segment.segment_status || 'Not Started'}
              </span>
            </div>
            <h2
              style={{
                fontSize: '20px',
                fontWeight: '800',
                color: '#0f172a',
                margin: 0,
                lineHeight: '1.3',
              }}
            >
              {segment.title}
            </h2>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              flexShrink: 0,
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'rgba(0,0,0,0.06)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
              transition: 'background-color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.12)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.06)')}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal body */}
        <div style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Time row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Clock size={16} color="#64748b" />
            </div>
            <div>
              <p style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 2px' }}>
                Time
              </p>
              <p style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', margin: 0 }}>
                {formatTime(segment.start_time)}
                {segment.end_time && (
                  <span style={{ color: '#94a3b8', fontWeight: '400' }}> → {formatTime(segment.end_time)}</span>
                )}
              </p>
            </div>
          </div>

          {/* Room row */}
          {segment.room_name && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <MapPin size={16} color="#64748b" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 2px' }}>
                  Room
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <p style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', margin: 0 }}>
                    {segment.room_name}
                  </p>
                  {segment.capacity_status && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        backgroundColor: capacityBadge.bg,
                        color: capacityBadge.text,
                        fontSize: '11px',
                        fontWeight: '700',
                        letterSpacing: '0.03em',
                      }}
                    >
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: capacityBadge.dot }} />
                      {segment.capacity_status}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Speakers section */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Users size={16} color="#64748b" />
              </div>
              <p style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                Speakers
              </p>
            </div>

            {loadingSpeakers ? (
              <p style={{ fontSize: '13px', color: '#94a3b8', paddingLeft: '46px' }}>Loading…</p>
            ) : speakers.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic', paddingLeft: '46px' }}>
                No speakers assigned
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '46px' }}>
                {speakers.map((sp) => (
                  <div
                    key={sp.id}
                    onClick={() => setSelectedSpeaker(sp)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '10px',
                      border: '1px solid #f1f5f9',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s, border-color 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f1f5f9'
                      e.currentTarget.style.borderColor = '#e2e8f0'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8fafc'
                      e.currentTarget.style.borderColor = '#f1f5f9'
                    }}
                  >
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: '#dbeafe',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: '700',
                        color: '#1d4ed8',
                        flexShrink: 0,
                      }}
                    >
                      {sp.full_name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a', margin: 0 }}>
                        {sp.full_name}
                      </p>
                      {(sp.role || sp.company) && (
                        <p style={{ fontSize: '12px', color: '#64748b', margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {[sp.role, sp.company].filter(Boolean).join(' · ')}
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      {sp.event_role && (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: '700',
                            color: '#2563eb',
                            backgroundColor: '#eff6ff',
                            padding: '2px 7px',
                            borderRadius: '4px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                          }}
                        >
                          {sp.event_role}
                        </span>
                      )}
                      <ChevronRight size={13} color="#cbd5e1" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── Speaker Profile Modal (layered over segment modal) ── */}
      {selectedSpeaker && (
        <SpeakerModal
          speaker={selectedSpeaker}
          onClose={() => setSelectedSpeaker(null)}
        />
      )}
    </div>
  )
}

// ─── Speaker Profile Modal ────────────────────────────────────────────────────

const SpeakerModal = ({ speaker, onClose }) => {
  // Escape key closes this layer only
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const initials = speaker.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const roleAndCompany = [speaker.role, speaker.company].filter(Boolean).join(' at ')

  return (
    // Backdrop — slightly darker to indicate depth above segment modal
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#fff',
          borderRadius: '20px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.25)',
          width: '100%',
          maxWidth: '420px',
          maxHeight: '88vh',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)',
            borderRadius: '20px 20px 0 0',
            padding: '28px 24px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            position: 'relative',
          }}
        >
          {/* Back button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              left: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 10px',
              cursor: 'pointer',
              color: '#94a3b8',
              fontSize: '12px',
              fontWeight: '600',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.18)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
            aria-label="Back"
          >
            <ArrowLeft size={13} />
            Back
          </button>

          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '14px',
              right: '14px',
              width: '30px',
              height: '30px',
              borderRadius: '8px',
              border: 'none',
              background: 'rgba(255,255,255,0.1)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.18)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
            aria-label="Close"
          >
            <X size={15} />
          </button>

          {/* Avatar */}
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: '800',
              color: '#fff',
              marginBottom: '14px',
              boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
              flexShrink: 0,
            }}
          >
            {initials}
          </div>

          {/* Name */}
          <h2
            style={{
              fontSize: '22px',
              fontWeight: '800',
              color: '#f8fafc',
              margin: '0 0 6px',
              lineHeight: '1.2',
            }}
          >
            {speaker.full_name}
          </h2>

          {/* Role at Company */}
          {roleAndCompany && (
            <p
              style={{
                fontSize: '13px',
                color: '#94a3b8',
                margin: '0 0 12px',
                fontWeight: '500',
              }}
            >
              {roleAndCompany}
            </p>
          )}

          {/* Event role badge */}
          {speaker.event_role && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 12px',
                borderRadius: '20px',
                backgroundColor: 'rgba(249,115,22,0.15)',
                color: '#fb923c',
                fontSize: '11px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                border: '1px solid rgba(249,115,22,0.25)',
              }}
            >
              {speaker.event_role}
            </span>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Bio / description */}
          {speaker.description && (
            <div>
              <p
                style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  margin: '0 0 8px',
                }}
              >
                About
              </p>
              <p
                style={{
                  fontSize: '14px',
                  color: '#334155',
                  lineHeight: '1.65',
                  margin: 0,
                }}
              >
                {speaker.description}
              </p>
            </div>
          )}

          {/* LinkedIn — only renders when the field exists and is non-empty */}
          {speaker.linkedin_url && speaker.linkedin_url.trim() !== '' && (
            <div>
              <p
                style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  margin: '0 0 8px',
                }}
              >
                Connect
              </p>
              <a
                href={speaker.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  backgroundColor: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '10px',
                  color: '#1d4ed8',
                  fontSize: '13px',
                  fontWeight: '600',
                  textDecoration: 'none',
                  transition: 'background-color 0.15s, border-color 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#dbeafe'
                  e.currentTarget.style.borderColor = '#93c5fd'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#eff6ff'
                  e.currentTarget.style.borderColor = '#bfdbfe'
                }}
              >
                <ExternalLink size={14} />
                View LinkedIn Profile
              </a>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

// ─── Main FlowPage component ──────────────────────────────────────────────────

export const FlowPage = () => {
  const navigate = useNavigate()

  const [event, setEvent]               = useState(null)
  const [segments, setSegments]         = useState([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState('')
  const [selectedSegment, setSelectedSegment] = useState(null)

  useEffect(() => {
    loadEventData()
  }, [])

  const loadEventData = async () => {
    setLoading(true)
    setError('')

    const selectedEventId = localStorage.getItem('selected_event_id')
    if (!selectedEventId) {
      setLoading(false)
      return
    }

    try {
      const eventResult = await getEventById(selectedEventId)
      if (!eventResult.success) {
        setError('Failed to load event')
        localStorage.removeItem('selected_event_id')
        setLoading(false)
        return
      }
      setEvent(eventResult.data)

      const segmentsResult = await getSegmentsByEventId(selectedEventId)
      if (segmentsResult.success) {
        setSegments(segmentsResult.data || [])
      } else {
        setError('Failed to load segments')
      }
    } catch (err) {
      console.error('FlowPage load error:', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  // ── Empty / loading states ────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ padding: '40px 24px 80px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
        Loading…
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '40px 24px' }}>
        <div style={{ backgroundColor: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', padding: '16px', borderRadius: '8px', fontSize: '14px' }}>
          {error}
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div
        style={{
          minHeight: 'calc(100vh - 128px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          backgroundColor: '#f8fafc',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '12px',
              backgroundColor: '#dbeafe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}
          >
            <AlertCircle size={32} color="#2563eb" />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#0f172a', marginBottom: '8px' }}>
            Welcome to Flowgram
          </h2>
          <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px', lineHeight: '1.6' }}>
            Select an event to view your schedule and connect with speakers.
          </p>
          <button
            onClick={() => navigate('/app/events')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#f97316',
              color: '#fff',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '24px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background-color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#ea580c')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f97316')}
          >
            Browse Events
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    )
  }

  // ── Populated Flow page ───────────────────────────────────────────────────

  return (
    <>
      <div style={{ maxWidth: '100%', padding: '0 24px', paddingTop: '32px', paddingBottom: '80px' }}>

        {/* Page title row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
            Program Flow
          </h1>
          <button
            onClick={() => navigate('/app/events')}
            style={{
              fontSize: '13px',
              color: '#64748b',
              background: 'none',
              border: '1px solid #e2e8f0',
              padding: '6px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#94a3b8'
              e.currentTarget.style.color = '#334155'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e2e8f0'
              e.currentTarget.style.color = '#64748b'
            }}
          >
            Change Event
          </button>
        </div>

        {/* ── Bold Event Card ── */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '32px',
            boxShadow: '0 8px 32px rgba(15,23,42,0.25)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Decorative ring */}
          <div
            style={{
              position: 'absolute',
              top: '-40px',
              right: '-40px',
              width: '160px',
              height: '160px',
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.06)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '-10px',
              right: '-10px',
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.06)',
              pointerEvents: 'none',
            }}
          />

          <p
            style={{
              fontSize: '11px',
              fontWeight: '700',
              color: '#f97316',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              margin: '0 0 10px',
            }}
          >
            Current Event
          </p>

          <h2
            style={{
              fontSize: '21px',
              fontWeight: '800',
              color: '#f8fafc',
              margin: '0 0 16px',
              lineHeight: '1.3',
            }}
          >
            {event.title}
          </h2>

          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            {event.venue && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#94a3b8', fontWeight: '500' }}>
                <MapPin size={13} color="#64748b" />
                {event.venue}
              </div>
            )}
            {event.start_date && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#94a3b8', fontWeight: '500' }}>
                <Clock size={13} color="#64748b" />
                {formatDate(event.start_date)}
              </div>
            )}
          </div>
        </div>

        {/* ── Segments list ── */}
        {segments.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '48px 24px',
              color: '#94a3b8',
              fontSize: '14px',
              backgroundColor: '#fff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
            }}
          >
            No segments scheduled for this event yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {segments.map((segment) => {
              const card = getStatusCard(segment.segment_status)

              return (
                <div
                  key={segment.id}
                  onClick={() => setSelectedSegment(segment)}
                  style={{
                    backgroundColor: card.bg,
                    border: `1px solid ${card.border}`,
                    borderRadius: '12px',
                    padding: '16px 18px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    cursor: 'pointer',
                    transition: 'box-shadow 0.15s, border-color 0.15s, transform 0.1s',
                    userSelect: 'none',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = card.hoverShadow
                    e.currentTarget.style.borderColor = card.hoverBorder
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'
                    e.currentTarget.style.borderColor = card.border
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>

                    {/* Time column */}
                    <div
                      style={{
                        fontSize: '11px',
                        color: '#64748b',
                        fontWeight: '600',
                        minWidth: '56px',
                        flexShrink: 0,
                        textAlign: 'right',
                        lineHeight: '1.3',
                      }}
                    >
                      {segment.start_time && formatTime(segment.start_time)}
                    </div>

                    {/* Divider line */}
                    <div
                      style={{
                        width: '2px',
                        alignSelf: 'stretch',
                        backgroundColor: card.border,
                        borderRadius: '2px',
                        flexShrink: 0,
                      }}
                    />

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <h3
                          style={{
                            fontSize: '14px',
                            fontWeight: '700',
                            color: '#0f172a',
                            margin: 0,
                            lineHeight: '1.3',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {segment.title}
                        </h3>

                        {/* Status dot */}
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 7px',
                            borderRadius: '5px',
                            backgroundColor: card.badge.bg,
                            color: card.badge.text,
                            fontSize: '10px',
                            fontWeight: '700',
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                            flexShrink: 0,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: card.dot }} />
                          {segment.segment_status || 'Not Started'}
                        </span>
                      </div>

                      {/* Room name */}
                      {segment.room_name && (
                        <p
                          style={{
                            fontSize: '12px',
                            color: '#64748b',
                            margin: 0,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <MapPin size={11} color="#94a3b8" />
                          {segment.room_name}
                        </p>
                      )}
                    </div>

                    {/* Chevron affordance */}
                    <ChevronRight size={16} color="#cbd5e1" style={{ flexShrink: 0 }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Segment Detail Modal ── */}
      {selectedSegment && (
        <SegmentModal
          segment={selectedSegment}
          onClose={() => setSelectedSegment(null)}
        />
      )}
    </>
  )
}
