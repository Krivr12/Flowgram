import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, User, ChevronRight } from 'lucide-react'
import { getAllSpeakers } from '../../services/speakers'

export const SpeakersPage = () => {
  const { eventId } = useParams()
  const navigate = useNavigate()

  const [speakers, setSpeakers] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

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
        <h1 className="text-xl font-bold text-[#252F3E] text-left mt-4 mb-4" style={{ margin: 0 }}>
          Speakers
        </h1>
        <button
          onClick={goToNew}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            backgroundColor: '#f97316', color: '#fff',
            fontWeight: '600', fontSize: '14px',
            padding: '10px 20px', borderRadius: '9999px',
            border: 'none', cursor: 'pointer', flexShrink: 0,
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ea580c'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f97316'}
        >
          <Plus size={16} /> Add Speaker
        </button>
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{ marginBottom: '16px', padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '14px', color: '#dc2626' }}>
          {error}
        </div>
      )}

      {/* ── Loading skeletons ── */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '18px 20px', height: '72px' }} />
          ))}
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && speakers.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '80px 24px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a', margin: '0 0 6px' }}>No speakers yet</h2>
          <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 24px' }}>Add the first speaker for this event.</p>
          <button
            onClick={goToNew}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#f97316', color: '#fff', fontWeight: '600', fontSize: '14px', padding: '10px 20px', borderRadius: '9999px', border: 'none', cursor: 'pointer' }}
          >
            <Plus size={16} /> Add Speaker
          </button>
        </div>
      )}

      {/* ── Speaker list ── */}
      {!loading && speakers.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {speakers.map((speaker) => (
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

  const roleCompany = [speaker.role, speaker.company].filter(Boolean).join(' | ')

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        backgroundColor: '#fff',
        border: '1px solid',
        borderColor: hovered ? '#cbd5e1' : '#e2e8f0',
        borderRadius: '12px',
        padding: '14px 18px',
        cursor: 'pointer',
        boxShadow: hovered ? '0 4px 16px rgba(0,0,0,0.08)' : '0 1px 3px rgba(0,0,0,0.05)',
        transition: 'box-shadow 0.15s, border-color 0.15s',
      }}
    >
      {/* Avatar */}
      <div style={{
        width: '44px', height: '44px', borderRadius: '9999px',
        backgroundColor: '#f1f5f9', flexShrink: 0,
        overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {speaker.profile_picture_url ? (
          <img src={speaker.profile_picture_url} alt={speaker.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <User size={22} color="#94a3b8" />
        )}
      </div>

      {/* Name + role | company */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a', margin: 0, lineHeight: '1.3' }}>
          {speaker.full_name}
        </p>
        {roleCompany && (
          <p style={{ fontSize: '13px', color: '#6b7280', margin: '2px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {roleCompany}
          </p>
        )}
      </div>

      {/* Chevron */}
      <ChevronRight size={18} color={hovered ? '#f97316' : '#cbd5e1'} style={{ flexShrink: 0, transition: 'color 0.15s' }} />
    </div>
  )
}
