import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, User, ChevronRight } from 'lucide-react'
import { getAllSpeakers } from '../../services/speakers'

export const SpeakersPage = () => {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const [isDarkMode, setIsDarkMode] = useState(() =>
    document.documentElement.classList.contains('dark')
  )
  const [speakers, setSpeakers] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'))
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  

  useEffect(() => { loadSpeakers() }, [eventId])

  const loadSpeakers = async () => {
    setLoading(true)
    const result = await getAllSpeakers()
    if (result.success) setSpeakers(result.data || [])
    else setError(result.error)
    setLoading(false)
  }

  const goToNew  = () => navigate(`/admin/events/${eventId}/speakers/new`)
  const goToEdit = (id) => navigate(`/admin/events/${eventId}/speakers/edit/${id}`)

  return (
    <div>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: isDarkMode ? '#fff' : '#0f172a', margin: 0 }}>
          Speakers
        </h1>
        <button
          onClick={goToNew}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            backgroundColor: '#FFA100', color: '#fff',
            fontWeight: '600', fontSize: '14px',
            padding: '10px 20px', borderRadius: '9999px',
            border: 'none', cursor: 'pointer', flexShrink: 0,
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e89100'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFA100'}
        >
          <Plus size={16} /> Add Speaker
        </button>
      </div>

      {/* ── Search ── */}
      <div style={{ marginBottom: '16px', position: 'relative' }}>
        <input
          type="text"
          placeholder="Search speakers..."
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
            boxSizing: 'border-box',
            transition: 'border-color 0.15s',
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

      {/* ── Error ── */}      {error && (
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
      {!loading && speakers.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '80px 24px', backgroundColor: isDarkMode ? '#252F3E' : '#fff', borderRadius: '12px', border: isDarkMode ? '1px solid rgba(100, 116, 139, 0.3)' : '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: isDarkMode ? '#e2e8f0' : '#0f172a', margin: '0 0 6px' }}>No speakers yet</h2>
          <p style={{ fontSize: '14px', color: isDarkMode ? '#94a3b8' : '#64748b', margin: '0 0 24px' }}>Add the first speaker for this event.</p>
          <button
            onClick={goToNew}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#FFA100', color: '#fff', fontWeight: '600', fontSize: '14px', padding: '10px 20px', borderRadius: '9999px', border: 'none', cursor: 'pointer' }}
          >
            <Plus size={16} /> Add Speaker
          </button>
        </div>
      )}

      {/* ── Speaker list ── */}
      {!loading && speakers.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {speakers
            .filter((s) => !searchQuery.trim() || s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((speaker) => (
            <SpeakerCard
              key={speaker.id}
              speaker={speaker}
              onClick={() => goToEdit(speaker.id)}
            />
          ))}
        </div>
      )}

    </div>
  )
}

// ─── Speaker Card ─────────────────────────────────────────────────────────────

const SpeakerCard = ({ speaker, onClick }) => {
  const [hovered, setHovered] = useState(false)
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

  const roleCompany = [speaker.role, speaker.company].filter(Boolean).join(' | ')

  const bgColor = isDarkMode ? '#252F3E' : '#ffffff'
  const borderColor = isDarkMode 
    ? (hovered ? 'rgba(100, 116, 139, 0.5)' : 'rgba(100, 116, 139, 0.3)')
    : (hovered ? '#cbd5e1' : '#e2e8f0')
  const textColor = isDarkMode ? '#f8fafc' : '#0f172a'
  const subtextColor = isDarkMode ? '#cbd5e1' : '#6b7280'
  const avatarBg = isDarkMode ? 'rgba(100, 116, 139, 0.2)' : '#f1f5f9'
  const chevronColor = isDarkMode 
    ? (hovered ? '#1B77CF' : 'rgba(255, 255, 255, 0.2)')
    : (hovered ? '#FFA100' : '#cbd5e1')

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        backgroundColor: bgColor,
        border: '1px solid',
        borderColor: borderColor,
        borderRadius: '12px',
        padding: '14px 18px',
        cursor: 'pointer',
        boxShadow: hovered ? (isDarkMode ? '0 4px 16px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.08)') : (isDarkMode ? '0 1px 3px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.05)'),
        transition: 'box-shadow 0.15s, border-color 0.15s',
      }}
    >
      {/* Avatar */}
      <div style={{
        width: '44px', height: '44px', borderRadius: '9999px',
        backgroundColor: avatarBg, flexShrink: 0,
        overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {speaker.profile_picture_url ? (
          <img src={speaker.profile_picture_url} alt={speaker.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <User size={22} color={isDarkMode ? '#94a3b8' : '#94a3b8'} />
        )}
      </div>

      {/* Name + role | company */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '15px', fontWeight: '600', color: textColor, margin: 0, lineHeight: '1.3' }}>
          {speaker.full_name}
        </p>
        {roleCompany && (
          <p style={{ fontSize: '13px', color: subtextColor, margin: '2px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {roleCompany}
          </p>
        )}
      </div>

      {/* Chevron */}
      <ChevronRight size={18} color={chevronColor} style={{ flexShrink: 0, transition: 'color 0.15s' }} />
    </div>
  )
}
