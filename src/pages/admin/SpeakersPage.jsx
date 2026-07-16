import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2, X, Edit2 } from 'lucide-react'
import { getAllSpeakers, createSpeaker, updateSpeaker, deleteSpeaker } from '../../services/speakers'

const speakerSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.string().min(1, 'Role is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  company: z.string().min(1, 'Company is required'),
  event_role: z.enum(['SPEAKER', 'HOST', 'PANELIST']),
  linkedin_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
})

const INPUT = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
  fontSize: '14px',
  color: '#0f172a',
  outline: 'none',
  boxSizing: 'border-box',
}

const LABEL = {
  display: 'block',
  fontSize: '13px',
  fontWeight: '500',
  color: '#475569',
  marginBottom: '6px',
}

export const SpeakersPage = () => {
  const { event, eventId } = useOutletContext()
  const [speakers, setSpeakers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingSpeaker, setEditingSpeaker] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(speakerSchema),
    defaultValues: { event_role: 'SPEAKER' },
  })

  useEffect(() => { loadSpeakers() }, [eventId])

  const loadSpeakers = async () => {
    setLoading(true)
    // Speakers are global but we fetch all — in a full implementation
    // you'd filter by event via segment_speakers join
    const result = await getAllSpeakers()
    if (result.success) setSpeakers(result.data || [])
    else setError(result.error)
    setLoading(false)
  }

  const onSubmit = async (data) => {
    if (editingSpeaker) {
      const result = await updateSpeaker(editingSpeaker.id, data)
      if (result.success) {
        setSpeakers((prev) => prev.map((s) => s.id === editingSpeaker.id ? result.data : s))
        closeModal()
      } else setError(result.error)
    } else {
      const result = await createSpeaker(data)
      if (result.success) {
        setSpeakers((prev) => [result.data, ...prev])
        closeModal()
      } else setError(result.error)
    }
  }

  const handleEdit = (speaker) => {
    setEditingSpeaker(speaker)
    setValue('full_name', speaker.full_name)
    setValue('role', speaker.role)
    setValue('description', speaker.description)
    setValue('company', speaker.company)
    setValue('event_role', speaker.event_role)
    setValue('linkedin_url', speaker.linkedin_url || '')
    setShowModal(true)
  }

  const handleDelete = async (speakerId) => {
    setDeleting(speakerId)
    const result = await deleteSpeaker(speakerId)
    if (result.success) setSpeakers((prev) => prev.filter((s) => s.id !== speakerId))
    else setError(result.error)
    setDeleting(null)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingSpeaker(null)
    reset()
  }

  const EVENT_ROLE_COLORS = {
    SPEAKER:  { bg: '#eff6ff', color: '#2563eb' },
    HOST:     { bg: '#fff7ed', color: '#ea580c' },
    PANELIST: { bg: '#f5f3ff', color: '#7c3aed' },
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Speakers</h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
            Manage speakers for {event?.title || 'this event'}.
          </p>
        </div>
        <button
          onClick={() => { setEditingSpeaker(null); reset(); setShowModal(true) }}
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

      {/* Error */}
      {error && (
        <div style={{ marginBottom: '16px', padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '14px', color: '#dc2626' }}>
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {[1,2,3].map((i) => (
            <div key={i} style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', height: '160px' }} />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && speakers.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '80px 24px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a', margin: '0 0 6px' }}>No speakers yet</h2>
          <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 24px' }}>Add the first speaker for this event.</p>
          <button
            onClick={() => setShowModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#f97316', color: '#fff', fontWeight: '600', fontSize: '14px', padding: '10px 20px', borderRadius: '9999px', border: 'none', cursor: 'pointer' }}
          >
            <Plus size={16} /> Add Speaker
          </button>
        </div>
      )}

      {/* Grid */}
      {!loading && speakers.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {speakers.map((speaker) => {
            const roleStyle = EVENT_ROLE_COLORS[speaker.event_role] || EVENT_ROLE_COLORS.SPEAKER
            return (
              <div key={speaker.id} style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Name + badge */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a', margin: 0, lineHeight: '1.4' }}>
                    {speaker.full_name}
                  </h3>
                  <span style={{ padding: '2px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: '600', backgroundColor: roleStyle.bg, color: roleStyle.color, flexShrink: 0 }}>
                    {speaker.event_role}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <p style={{ fontSize: '13px', color: '#475569', margin: 0 }}>{speaker.role}</p>
                  <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>{speaker.company}</p>
                </div>

                <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: '1.5', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                  {speaker.description}
                </p>

                {speaker.linkedin_url && (
                  <a href={speaker.linkedin_url} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: '13px', color: '#2563eb', textDecoration: 'none' }}>
                    LinkedIn ↗
                  </a>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid #f1f5f9', marginTop: 'auto' }}>
                  <button
                    onClick={() => handleEdit(speaker)}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#fff', color: '#475569', fontSize: '13px', cursor: 'pointer' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
                  >
                    <Edit2 size={14} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(speaker.id)}
                    disabled={deleting === speaker.id}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px', borderRadius: '8px', border: 'none', backgroundColor: '#fef2f2', color: '#dc2626', fontSize: '13px', cursor: 'pointer', opacity: deleting === speaker.id ? 0.5 : 1 }}
                  >
                    <Trash2 size={14} /> {deleting === speaker.id ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', width: '100%', maxWidth: '520px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                {editingSpeaker ? 'Edit Speaker' : 'Add New Speaker'}
              </h2>
              <button onClick={closeModal} style={{ padding: '6px', borderRadius: '6px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { name: 'full_name', label: 'Full Name', placeholder: 'e.g. Jane Doe' },
                { name: 'role', label: 'Title / Role', placeholder: 'e.g. Senior Engineer, AWS Hero' },
                { name: 'company', label: 'Company', placeholder: 'e.g. Amazon Web Services' },
              ].map(({ name, label, placeholder }) => (
                <div key={name}>
                  <label style={LABEL}>{label} *</label>
                  <input {...register(name)} placeholder={placeholder} style={INPUT}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  />
                  {errors[name] && <p style={{ fontSize: '12px', color: '#dc2626', margin: '4px 0 0' }}>{errors[name].message}</p>}
                </div>
              ))}

              <div>
                <label style={LABEL}>Event Role *</label>
                <select {...register('event_role')} style={{ ...INPUT, backgroundColor: '#fff' }}>
                  <option value="SPEAKER">Speaker</option>
                  <option value="HOST">Host</option>
                  <option value="PANELIST">Panelist</option>
                </select>
              </div>

              <div>
                <label style={LABEL}>Bio / Description *</label>
                <textarea {...register('description')} placeholder="Speaker bio" rows={4} style={{ ...INPUT, resize: 'vertical' }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
                {errors.description && <p style={{ fontSize: '12px', color: '#dc2626', margin: '4px 0 0' }}>{errors.description.message}</p>}
              </div>

              <div>
                <label style={LABEL}>LinkedIn URL (optional)</label>
                <input {...register('linkedin_url')} type="url" placeholder="https://linkedin.com/in/…" style={INPUT}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
                {errors.linkedin_url && <p style={{ fontSize: '12px', color: '#dc2626', margin: '4px 0 0' }}>{errors.linkedin_url.message}</p>}
              </div>

              <div style={{ display: 'flex', gap: '10px', paddingTop: '8px' }}>
                <button type="button" onClick={closeModal} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#f97316', color: '#fff', fontSize: '14px', fontWeight: '600', cursor: 'pointer', opacity: isSubmitting ? 0.7 : 1 }}>
                  {isSubmitting ? 'Saving…' : editingSpeaker ? 'Update Speaker' : 'Add Speaker'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
