import { useEffect, useState } from 'react'
import { Globe, Camera, User, X } from 'lucide-react'
import { supabase } from '../../services/supabase'

export const MorePage = () => {
  const [speakers, setSpeakers] = useState([])
  const [loading, setLoading] = useState(true)
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
    loadSpeakers()
  }, [])

  const loadSpeakers = async () => {
    setLoading(true)
    const selectedEventId = localStorage.getItem('selected_event_id')
    if (!selectedEventId) { setLoading(false); return }

    // Get speakers linked to this event's segments
    const { data, error } = await supabase
      .from('segment_speakers')
      .select('speaker_id, speakers(*), segments!inner(event_id)')
      .eq('segments.event_id', selectedEventId)

    if (!error && data) {
      // Deduplicate speakers
      const speakerMap = new Map()
      data.forEach((r) => {
        if (r.speakers && !speakerMap.has(r.speakers.id)) {
          speakerMap.set(r.speakers.id, r.speakers)
        }
      })
      const sorted = Array.from(speakerMap.values()).sort((a, b) =>
        (a.full_name || '').localeCompare(b.full_name || '')
      )
      setSpeakers(sorted)
    }
    setLoading(false)
  }

  const cardBg = isDarkMode ? '#252F3E' : '#fff'
  const border = isDarkMode ? 'rgba(100,116,139,0.3)' : '#e2e8f0'
  const textMain = isDarkMode ? '#e2e8f0' : '#0f172a'
  const textSub = isDarkMode ? '#94a3b8' : '#64748b'
  const [selectedSpeaker, setSelectedSpeaker] = useState(null)

  return (
    <div style={{ maxWidth: '100%', paddingTop: '16px', paddingBottom: '80px' }}>

      {/* Speaker Modal */}
      {selectedSpeaker && (
        <SpeakerModal speaker={selectedSpeaker} isDarkMode={isDarkMode} onClose={() => setSelectedSpeaker(null)} />
      )}

      {/* Header */}
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: textMain, marginBottom: '24px', marginTop: '8px', transition: 'color 0.2s' }}>
        More
      </h1>

      {/* ── Quick Links ── */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '13px', fontWeight: '800', color: textMain, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px', paddingLeft: '4px', transition: 'color 0.2s' }}>
          Quick Links
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Event Website */}
          <a
            href="https://tinyurl.com/awscd2026web"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: '14px',
              padding: '16px 18px', borderRadius: '12px',
              backgroundColor: cardBg, border: `1px solid ${border}`,
              textDecoration: 'none', cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = isDarkMode ? '0 4px 16px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.08)'
              e.currentTarget.style.borderColor = isDarkMode ? 'rgba(100,116,139,0.5)' : '#cbd5e1'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none'
              e.currentTarget.style.borderColor = border
            }}
          >
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: isDarkMode ? 'rgba(27, 119, 207, 0.15)' : '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Globe size={20} color="#1B77CF" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '15px', fontWeight: '700', color: textMain, margin: '0 0 2px', transition: 'color 0.2s' }}>
                Event Website
              </p>
              <p style={{ fontSize: '12px', color: textSub, margin: 0, transition: 'color 0.2s' }}>
                Official AWS Community Day Philippines 2026 site
              </p>
            </div>
          </a>

          {/* Photo Booth */}
          <a
            href="https://tinyurl.com/awscd2026booth"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: '14px',
              padding: '16px 18px', borderRadius: '12px',
              backgroundColor: cardBg, border: `1px solid ${border}`,
              textDecoration: 'none', cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = isDarkMode ? '0 4px 16px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.08)'
              e.currentTarget.style.borderColor = isDarkMode ? 'rgba(100,116,139,0.5)' : '#cbd5e1'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none'
              e.currentTarget.style.borderColor = border
            }}
          >
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: isDarkMode ? 'rgba(255, 161, 0, 0.15)' : '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Camera size={20} color="#FFA100" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '15px', fontWeight: '700', color: textMain, margin: '0 0 2px', transition: 'color 0.2s' }}>
                Photo Booth
              </p>
              <p style={{ fontSize: '12px', color: textSub, margin: 0, transition: 'color 0.2s' }}>
                Browser-based photo booth — also available at the physical booth on 21st Floor
              </p>
            </div>
          </a>
        </div>
      </div>

      {/* ── Speakers ── */}
      <div>
        <h2 style={{ fontSize: '13px', fontWeight: '800', color: textMain, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px', paddingLeft: '4px', transition: 'color 0.2s' }}>
          Speakers
        </h2>

        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: textSub, fontSize: '14px' }}>
            Loading speakers...
          </div>
        )}

        {!loading && speakers.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: textSub, fontSize: '14px' }}>
            No speakers available yet.
          </div>
        )}

        {!loading && speakers.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px', alignItems: 'stretch' }}>
            {speakers.map((speaker) => (
              <SpeakerCard key={speaker.id} speaker={speaker} isDarkMode={isDarkMode} onSelect={() => setSelectedSpeaker(speaker)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Speaker Card ─────────────────────────────────────────────────────────────

const SpeakerCard = ({ speaker, isDarkMode, onSelect }) => {
  const cardBg = isDarkMode ? '#252F3E' : '#fff'
  const border = isDarkMode ? 'rgba(100,116,139,0.3)' : '#e2e8f0'
  const textMain = isDarkMode ? '#e2e8f0' : '#0f172a'
  const textSub = isDarkMode ? '#94a3b8' : '#64748b'

  return (
    <div
      style={{
        backgroundColor: cardBg,
        border: `1px solid ${border}`,
        borderRadius: '14px',
        padding: '18px 14px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        transition: 'all 0.15s',
        cursor: 'pointer',
        height: '100%',
      }}
      onClick={onSelect}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = isDarkMode ? '0 4px 16px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.08)'
        e.currentTarget.style.borderColor = isDarkMode ? 'rgba(100,116,139,0.5)' : '#cbd5e1'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.borderColor = border
      }}
    >
      {/* Avatar */}
      {speaker.profile_picture_url ? (
        <img
          src={speaker.profile_picture_url}
          alt={speaker.full_name}
          style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', marginBottom: '10px' }}
        />
      ) : (
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: isDarkMode ? 'rgba(100,116,139,0.2)' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
          <User size={24} color={textSub} />
        </div>
      )}

      {/* Name */}
      <p style={{ fontSize: '13px', fontWeight: '700', color: textMain, margin: '0 0 3px', lineHeight: 1.3, transition: 'color 0.2s' }}>
        {speaker.full_name}
      </p>

      {/* Role / Company */}
      {(speaker.role || speaker.company) && (
        <p style={{ fontSize: '11px', color: textSub, margin: '0 0 4px', lineHeight: 1.4, transition: 'color 0.2s' }}>
          {[speaker.role, speaker.company].filter(Boolean).join(' · ')}
        </p>
      )}

      {/* Spacer to push badge to bottom */}
      <div style={{ flex: 1 }} />

      {/* Event role badge */}
      {speaker.event_role && (
        <span style={{
          fontSize: '10px', fontWeight: '700', textTransform: 'uppercase',
          padding: '3px 8px', borderRadius: '6px', marginTop: '8px',
          backgroundColor: isDarkMode ? 'rgba(27, 119, 207, 0.15)' : '#eff6ff',
          color: '#1B77CF', letterSpacing: '0.03em',
        }}>
          {speaker.event_role}
        </span>
      )}
    </div>
  )
}

// ─── Speaker Modal (bottom sheet on mobile, centered on desktop) ──────────────

const SpeakerModal = ({ speaker, isDarkMode, onClose }) => {
  const textMain = isDarkMode ? '#e2e8f0' : '#0f172a'
  const textSub = isDarkMode ? '#94a3b8' : '#64748b'
  const panelBg = isDarkMode ? '#252F3E' : '#fff'

  return (
    <div
      className="speaker-modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="speaker-modal-panel" style={{ backgroundColor: panelBg }}>
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '16px', right: '16px',
            width: '32px', height: '32px', borderRadius: '50%',
            border: 'none', backgroundColor: isDarkMode ? 'rgba(100,116,139,0.2)' : '#f1f5f9',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: isDarkMode ? '#94a3b8' : '#64748b',
            transition: 'background-color 0.15s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(100,116,139,0.3)' : '#e2e8f0'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(100,116,139,0.2)' : '#f1f5f9'}
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          {/* Avatar */}
          {speaker.profile_picture_url ? (
            <img
              src={speaker.profile_picture_url}
              alt={speaker.full_name}
              style={{ width: '96px', height: '96px', borderRadius: '50%', objectFit: 'cover', marginBottom: '16px', border: isDarkMode ? '3px solid rgba(100,116,139,0.3)' : '3px solid #f1f5f9' }}
            />
          ) : (
            <div style={{ width: '96px', height: '96px', borderRadius: '50%', backgroundColor: isDarkMode ? 'rgba(100,116,139,0.2)' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <User size={40} color={textSub} />
            </div>
          )}

          {/* Name */}
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: textMain, margin: '0 0 6px', lineHeight: 1.3 }}>
            {speaker.full_name}
          </h2>

          {/* Role · Company */}
          {(speaker.role || speaker.company) && (
            <p style={{ fontSize: '14px', color: textSub, margin: '0 0 4px', lineHeight: 1.5 }}>
              {[speaker.role, speaker.company].filter(Boolean).join(' · ')}
            </p>
          )}

          {/* Event role badge */}
          {speaker.event_role && (
            <span style={{
              display: 'inline-block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase',
              padding: '4px 12px', borderRadius: '6px', marginTop: '8px',
              backgroundColor: isDarkMode ? 'rgba(27, 119, 207, 0.15)' : '#eff6ff',
              color: '#1B77CF', letterSpacing: '0.03em',
            }}>
              {speaker.event_role}
            </span>
          )}
        </div>

        {/* Bio */}
        {speaker.description && (
          <div style={{ marginTop: '24px', textAlign: 'left' }}>
            <p style={{ fontSize: '11px', fontWeight: '800', color: textSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
              About
            </p>
            <p style={{ fontSize: '14px', color: isDarkMode ? '#cbd5e1' : '#475569', lineHeight: 1.7, margin: 0 }}>
              {speaker.description}
            </p>
          </div>
        )}

        {/* LinkedIn button */}
        {speaker.linkedin_url && (
          <a
            href={speaker.linkedin_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              marginTop: '24px', padding: '14px', borderRadius: '12px',
              backgroundColor: '#1B77CF', color: '#fff',
              fontSize: '14px', fontWeight: '700',
              textDecoration: 'none',
              transition: 'background-color 0.15s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#155fa3'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1B77CF'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>
            </svg>
            View LinkedIn Profile
          </a>
        )}
      </div>
    </div>
  )
}
