import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Clock, MapPin, Info, X } from 'lucide-react'
import { getSegmentWithSpeakers } from '../../services/segments'

// ─── Format time helper ───────────────────────────────────────────────────────

const formatTime = (timeStr) => {
  if (!timeStr) return ''
  return new Date(timeStr).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC',
  })
}

// ─── Speaker Modal (bottom-sheet on mobile, centered on desktop) ──────────────

const SpeakerModal = ({ speaker, onClose }) => {
  if (!speaker) return null

  const initials = speaker.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="speaker-modal-overlay" onClick={onClose}>
      <div className="speaker-modal-panel" onClick={(e) => e.stopPropagation()}>

        {/* ── Close Button ── */}
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: '#f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'background-color 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e2e8f0')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
        >
          <X size={16} strokeWidth={2.5} color="#64748b" />
        </button>

        {/* ── Profile Picture ── */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px', paddingTop: '4px' }}>
          <div
            style={{
              width: '96px',
              height: '96px',
              borderRadius: '50%',
              backgroundColor: '#dbeafe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '30px',
              fontWeight: '700',
              color: '#1d4ed8',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            {speaker.profile_picture_url ? (
              <img
                src={speaker.profile_picture_url}
                alt={speaker.full_name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            ) : (
              initials
            )}
          </div>
        </div>

        {/* ── Name ── */}
        <h2
          style={{
            fontSize: '22px',
            fontWeight: '800',
            color: '#0f172a',
            margin: '0 0 6px',
            textAlign: 'center',
            lineHeight: 1.3,
          }}
        >
          {speaker.full_name}
        </h2>

        {/* ── Role · Company ── */}
        {(speaker.role || speaker.company) && (
          <p
            style={{
              fontSize: '14px',
              color: '#64748b',
              margin: '0 0 24px',
              textAlign: 'center',
              lineHeight: 1.5,
            }}
          >
            {[speaker.role, speaker.company].filter(Boolean).join(' · ')}
          </p>
        )}

        {/* ── Bio ── */}
        {speaker.description && (
          <div style={{ marginBottom: '24px' }}>
            <p
              style={{
                fontSize: '11px',
                fontWeight: '800',
                color: '#94a3b8',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '10px',
              }}
            >
              About
            </p>
            <p style={{ fontSize: '15px', color: '#475569', lineHeight: 1.75, margin: 0 }}>
              {speaker.description}
            </p>
          </div>
        )}

        {/* ── LinkedIn ── */}
        {speaker.linkedin_url && (
          <a
            href={speaker.linkedin_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              padding: '12px',
              borderRadius: '10px',
              border: '1.5px solid #0077b5',
              backgroundColor: '#0077b5',
              color: '#fff',
              fontSize: '14px',
              fontWeight: '700',
              textDecoration: 'none',
              transition: 'background-color 0.15s, transform 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#006399'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#0077b5'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
            View LinkedIn Profile
          </a>
        )}
      </div>
    </div>
  )
}

// ─── Main SegmentDetailsPage ──────────────────────────────────────────────────

export const SegmentDetailsPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [segment, setSegment]             = useState(null)
  const [speakers, setSpeakers]           = useState([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState('')
  const [selectedSpeaker, setSelectedSpeaker] = useState(null)

  useEffect(() => {
    const loadSegment = async () => {
      setLoading(true)
      setError('')
      const result = await getSegmentWithSpeakers(id)
      if (!result.success) {
        setError(result.error || 'Failed to load segment details')
        setLoading(false)
        return
      }
      setSegment(result.data)
      setSpeakers(result.data.speakers || [])
      setLoading(false)
    }
    loadSegment()
  }, [id])

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          color: '#94a3b8',
          fontSize: '15px',
        }}
      >
        Loading segment details...
      </div>
    )
  }

  if (error || !segment) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          color: '#64748b',
          fontSize: '15px',
          gap: '12px',
        }}
      >
        <p style={{ color: '#dc2626' }}>{error || 'Segment not found'}</p>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            backgroundColor: '#fff',
            color: '#0f172a',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          Go Back
        </button>
      </div>
    )
  }

  return (
    <div style={{ paddingBottom: '80px', minHeight: '100vh' }}>

      {/* ── Back Button — flat, no card ── */}
      <div style={{ marginBottom: '28px' }}>
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

      {/* ── Segment Content — flat on page bg ── */}
      <div style={{ marginBottom: '36px' }}>

        {/* Title */}
        <h1
          style={{
            fontSize: '28px',
            fontWeight: '800',
            color: '#0f172a',
            margin: '0 0 16px',
            lineHeight: 1.3,
          }}
        >
          {segment.title}
        </h1>

        {/* Time & Venue chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              padding: '8px 14px',
              borderRadius: '8px',
              backgroundColor: '#f1f5f9',
              fontSize: '13px',
              fontWeight: '600',
              color: '#475569',
            }}
          >
            <Clock size={14} />
            {formatTime(segment.start_time)}
            {segment.end_time && <> – {formatTime(segment.end_time)}</>}
          </span>

          {segment.room_name && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '8px 14px',
                borderRadius: '8px',
                backgroundColor: '#f1f5f9',
                fontSize: '13px',
                fontWeight: '600',
                color: '#475569',
              }}
            >
              <MapPin size={14} />
              {segment.room_name}
            </span>
          )}
        </div>

        {/* Description */}
        {segment.description && (
          <p style={{ fontSize: '15px', color: '#475569', lineHeight: 1.75, margin: 0 }}>
            {segment.description}
          </p>
        )}
      </div>

      {/* ── Speakers Section ── */}
      {speakers.length > 0 && (
        <div>
          <h2
            style={{
              fontSize: '13px',
              fontWeight: '800',
              color: '#94a3b8',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '14px',
            }}
          >
            Speakers
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {speakers.map((speaker) => (
              <div
                key={speaker.id}
                onClick={() => setSelectedSpeaker(speaker)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8fafc'
                  e.currentTarget.style.borderColor = '#cbd5e1'
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#fff'
                  e.currentTarget.style.borderColor = '#e2e8f0'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                {/* Avatar + text */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  {/* Mini avatar */}
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      backgroundColor: '#dbeafe',
                      overflow: 'hidden',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: '700',
                      color: '#1d4ed8',
                    }}
                  >
                    {speaker.profile_picture_url ? (
                      <img
                        src={speaker.profile_picture_url}
                        alt={speaker.full_name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    ) : (
                      speaker.full_name
                        ?.split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()
                    )}
                  </div>

                  <div>
                    <p
                      style={{
                        fontSize: '15px',
                        fontWeight: '700',
                        color: '#0f172a',
                        margin: '0 0 3px',
                        lineHeight: 1.3,
                      }}
                    >
                      {speaker.full_name}
                    </p>
                    {(speaker.role || speaker.company) && (
                      <p style={{ fontSize: '13px', color: '#64748b', margin: 0, fontStyle: 'italic' }}>
                        {[speaker.role, speaker.company].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Info icon */}
                <Info size={17} color="#94a3b8" strokeWidth={2} style={{ flexShrink: 0 }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Speaker Modal ── */}
      {selectedSpeaker && (
        <SpeakerModal
          speaker={selectedSpeaker}
          onClose={() => setSelectedSpeaker(null)}
        />
      )}
    </div>
  )
}
