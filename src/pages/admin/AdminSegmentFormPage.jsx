import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, X, Users, Trash2 } from 'lucide-react'
import {
  createSegment,
  updateSegment,
  getSegmentWithSpeakers,
  addSpeakerToSegment,
  removeSpeakerFromSegment,
  deleteSegment,
} from '../../services/segments'
import { getAllSpeakers } from '../../services/speakers'
import { getEventById } from '../../services/events'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const convertToDatetimeLocal = (isoString) => {
  if (!isoString) return ''
  const date = new Date(isoString)
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  const hours = String(date.getUTCHours()).padStart(2, '0')
  const minutes = String(date.getUTCMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

const getEventDateOnly = (eventStartDate) => {
  if (!eventStartDate) return ''
  const date = new Date(eventStartDate)
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getDefaultStartTime = (eventStartDate) => {
  if (!eventStartDate) return ''
  const eventDateOnly = getEventDateOnly(eventStartDate)
  return `${eventDateOnly}T01:00`
}

const getDefaultEndTime = (eventStartDate) => {
  if (!eventStartDate) return ''
  const eventDateOnly = getEventDateOnly(eventStartDate)
  return `${eventDateOnly}T02:00`
}

const EMPTY_FORM = {
  title:           '',
  description:     '',
  room_name:       '',
  start_time:      '',
  end_time:        '',
  capacity_status: 'VACANT',
}

const getInputStyle = (isDarkMode) => ({
  width: '100%',
  padding: '10px 14px',
  fontSize: '16px',
  color: isDarkMode ? '#e2e8f0' : '#0f172a',
  backgroundColor: isDarkMode ? '#252F3E' : '#fff',
  border: isDarkMode ? '1px solid rgba(100, 116, 139, 0.3)' : '1px solid #e2e8f0',
  borderRadius: '8px',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s, box-shadow 0.15s',
})

const Field = ({ label, required, error, children, isDarkMode }) => (
  <div>
    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: isDarkMode ? '#cbd5e1' : '#374151', marginBottom: '6px' }}>
      {label}{required && <span style={{ color: '#ff0000', marginLeft: '2px' }}>*</span>}
    </label>
    {children}
    {error && <p style={{ fontSize: '12px', color: isDarkMode ? '#fca5a5' : '#dc2626', marginTop: '4px' }}>{error}</p>}
  </div>
)

// ─── Main Page ────────────────────────────────────────────────────────────────

export const AdminSegmentFormPage = () => {
  const { eventId, segmentId } = useParams()
  const isEditMode = Boolean(segmentId)
  const navigate = useNavigate()

  const [isDarkMode, setIsDarkMode] = useState(() =>
    document.documentElement.classList.contains('dark')
  )
  const [event, setEvent] = useState(null)
  const [initialValues, setInitialValues] = useState(EMPTY_FORM)
  const [form, setForm]                   = useState(EMPTY_FORM)
  const [errors, setErrors]               = useState({})
  const [serverError, setServerError]     = useState('')
  const [successMsg, setSuccessMsg]       = useState('')
  const [loading, setLoading]             = useState(true)
  const [submitting, setSubmitting]       = useState(false)
  const [focusedField, setFocusedField]   = useState(null)

  const [allSpeakers, setAllSpeakers]           = useState([])
  const [assignedSpeakers, setAssignedSpeakers] = useState([])
  const [loadingSpeakers, setLoadingSpeakers]   = useState(false)
  const [showSpeakerModal, setShowSpeakerModal] = useState(false)
  const [speakerSearch, setSpeakerSearch]       = useState('')
  const [deleting, setDeleting]                 = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'))
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      
      // Load event data first
      const eventResult = await getEventById(eventId)
      if (eventResult.success) {
        setEvent(eventResult.data)
      }

      if (!isEditMode) {
        // For new segments, set defaults with event date
        if (eventResult.success && eventResult.data?.start_date) {
          const defaultForm = {
            title: '',
            description: '',
            room_name: '',
            start_time: getDefaultStartTime(eventResult.data.start_date),
            end_time: getDefaultEndTime(eventResult.data.start_date),
            capacity_status: 'VACANT',
          }
          setInitialValues(defaultForm)
          setForm(defaultForm)
        }
        await loadSpeakers()
        setLoading(false)
        return
      }

      // For edit mode, load segment data
      const [segResult, speakersResult] = await Promise.all([
        getSegmentWithSpeakers(segmentId),
        getAllSpeakers(),
      ])
      if (segResult.success) {
        const mapped = {
          title:           segResult.data.title           || '',
          description:     segResult.data.description     || '',
          room_name:       segResult.data.room_name       || '',
          start_time:      convertToDatetimeLocal(segResult.data.start_time),
          end_time:        convertToDatetimeLocal(segResult.data.end_time),
          capacity_status: segResult.data.capacity_status || 'VACANT',
        }
        setInitialValues(mapped)
        setForm(mapped)
        setAssignedSpeakers(segResult.data.speakers || [])
      } else {
        setServerError('Failed to load segment data.')
      }
      if (speakersResult.success) setAllSpeakers(speakersResult.data || [])
      setLoading(false)
    }
    load()
  }, [segmentId, isEditMode, eventId])

  const loadSpeakers = async () => {
    setLoadingSpeakers(true)
    const result = await getAllSpeakers()
    if (result.success) setAllSpeakers(result.data || [])
    setLoadingSpeakers(false)
  }

  const isFormDirty = Object.keys(form).some((k) => form[k] !== initialValues[k])
  const initialSpeakerIds = new Set(initialValues.speakers?.map((s) => s.id) || [])
  const currentSpeakerIds = new Set(assignedSpeakers.map((s) => s.id))
  const areSpeakersDirty =
    initialSpeakerIds.size !== currentSpeakerIds.size ||
    [...initialSpeakerIds].some((id) => !currentSpeakerIds.has(id))
  const isDirty = isFormDirty || areSpeakersDirty
  const canSubmit = isEditMode ? isDirty : true

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const handleAddSpeaker = (speaker) => {
    if (!assignedSpeakers.find((s) => s.id === speaker.id))
      setAssignedSpeakers((prev) => [...prev, speaker])
  }
  const handleRemoveSpeaker = (speakerId) =>
    setAssignedSpeakers((prev) => prev.filter((s) => s.id !== speakerId))

  const getAvailableSpeakers = () => {
    const assignedIds = new Set(assignedSpeakers.map((s) => s.id))
    return allSpeakers.filter((s) => !assignedIds.has(s.id))
  }
  const getFilteredAvailableSpeakers = () => {
    const query = speakerSearch.toLowerCase()
    return getAvailableSpeakers().filter((s) => s.full_name.toLowerCase().includes(query))
  }

  const validate = () => {
    const errs = {}
    if (!form.title.trim() || form.title.trim().length < 3)
      errs.title = 'Title must be at least 3 characters.'
    if (!form.room_name.trim())
      errs.room_name = 'Room name is required.'
    if (!form.start_time)
      errs.start_time = 'Start time is required.'
    if (!form.end_time)
      errs.end_time = 'End time is required.'
    
    // Guardrail 1: Start time cannot be before event date
    if (event?.start_date && form.start_time) {
      const startDateTime = new Date(form.start_time)
      const eventStartDate = new Date(event.start_date)
      const eventDateOnly = new Date(eventStartDate.getUTCFullYear(), eventStartDate.getUTCMonth(), eventStartDate.getUTCDate())
      if (startDateTime < eventDateOnly) {
        errs.start_time = 'Start time cannot be before the event date.'
      }
    }
    
    // Guardrail 2: End time must be after start time
    if (form.start_time && form.end_time && form.end_time <= form.start_time)
      errs.end_time = 'End time must be after start time.'
    
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setSubmitting(true)
    const payload = {
      title:           form.title.trim(),
      description:     form.description.trim(),
      room_name:       form.room_name.trim(),
      start_time:      form.start_time,
      end_time:        form.end_time,
      capacity_status: form.capacity_status,
      event_id:        eventId,
    }
    const segmentResult = isEditMode
      ? await updateSegment(segmentId, payload)
      : await createSegment(payload)
    if (!segmentResult.success) {
      setServerError(segmentResult.error || 'Something went wrong.')
      setSubmitting(false)
      return
    }
    const actualSegmentId = isEditMode ? segmentId : segmentResult.data.id
    if (isEditMode) {
      const initIds = new Set(initialValues.speakers?.map((s) => s.id) || [])
      const curIds  = new Set(assignedSpeakers.map((s) => s.id))
      for (const id of initIds) { if (!curIds.has(id)) await removeSpeakerFromSegment(actualSegmentId, id) }
      for (const sp of assignedSpeakers) { if (!initIds.has(sp.id)) await addSpeakerToSegment(actualSegmentId, sp.id) }
    } else {
      for (const sp of assignedSpeakers) await addSpeakerToSegment(actualSegmentId, sp.id)
    }
    setSuccessMsg(isEditMode ? 'Segment updated!' : 'Segment added!')
    setTimeout(() => navigate(`/admin/events/${eventId}/segments`), 1000)
  }

  const handleBack = () => navigate(`/admin/events/${eventId}/segments`)

  const handleDelete = async () => {
    setDeleting(true)
    const result = await deleteSegment(segmentId)
    if (result.success) {
      setSuccessMsg('Segment deleted!')
      setTimeout(() => navigate(`/admin/events/${eventId}/segments`), 1000)
    } else {
      setServerError(result.error || 'Failed to delete segment.')
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 24px' }}>
        <p style={{ fontSize: '14px', color: isDarkMode ? '#cbd5e1' : '#94a3b8' }}>Loading segment…</p>
      </div>
    )
  }

  const isBusy      = submitting
  const submitBg    = canSubmit && !isBusy ? '#1B77CF' : isDarkMode ? 'rgba(148, 163, 184, 0.2)' : '#d1d5db'
  const submitColor = canSubmit && !isBusy ? '#fff'    : isDarkMode ? '#64748b' : '#9ca3af'
  const submitLabel = isBusy
    ? (isEditMode ? 'Saving…' : 'Creating…')
    : (isEditMode ? 'Save Changes' : 'Create Segment')

  const fieldBorder = (name) => {
    if (errors[name])          return isDarkMode ? '#fca5a5' : '#fca5a5'
    if (focusedField === name) return '#1B77CF'
    return isDarkMode ? 'rgba(100, 116, 139, 0.3)' : '#e2e8f0'
  }
  const fieldShadow = (name) =>
    focusedField === name && !errors[name] ? '0 0 0 3px rgba(27, 119, 207, 0.15)' : 'none'

  const inputStyle = getInputStyle(isDarkMode)

  return (
    <div>
      {/* ── Back link ── */}
      <button
        onClick={handleBack}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '500', color: isDarkMode ? '#94a3b8' : '#64748b', background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 24px' }}
        onMouseEnter={(e) => e.currentTarget.style.color = isDarkMode ? '#cbd5e1' : '#334155'}
        onMouseLeave={(e) => e.currentTarget.style.color = isDarkMode ? '#94a3b8' : '#64748b'}
      >
        <ArrowLeft size={15} />
        Back to Segments
      </button>

      {/* ── Page heading ── */}
      <h1 style={{ fontSize: '24px', fontWeight: '700', color: isDarkMode ? '#f8fafc' : '#252F3E', margin: '0 0 8px' }}>
        {isEditMode ? 'Edit Segment' : 'New Segment'}
      </h1>
      <p style={{ fontSize: '14px', color: isDarkMode ? '#cbd5e1' : '#64748b', margin: '0 0 32px' }}>
        {isEditMode
          ? 'Update the segment details and manage speaker assignments below.'
          : 'Fill in the details and assign speakers to create a new segment.'}
      </p>

      {/* ── Server error ── */}
      {serverError && (
        <div style={{ backgroundColor: isDarkMode ? 'rgba(220, 38, 38, 0.1)' : '#fef2f2', border: isDarkMode ? '1px solid rgba(220, 38, 38, 0.3)' : '1px solid #fecaca', color: isDarkMode ? '#fca5a5' : '#dc2626', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', marginBottom: '24px' }}>
          {serverError}
        </div>
      )}

      {successMsg && (
        <div style={{ backgroundColor: isDarkMode ? 'rgba(34,197,94,0.12)' : '#f0fdf4', border: isDarkMode ? '1px solid rgba(34,197,94,0.35)' : '1px solid #86efac', color: isDarkMode ? '#6ee7b7' : '#166534', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', marginBottom: '24px' }}>
          {successMsg}
        </div>
      )}

      {/* ── Form card ── */}
      <div style={{ backgroundColor: isDarkMode ? '#252F3E' : '#fff', border: isDarkMode ? '1px solid rgba(100, 116, 139, 0.3)' : '1px solid #f3f4f6', borderRadius: '16px', boxShadow: isDarkMode ? '0 1px 4px rgba(0,0,0,0.3)' : '0 1px 4px rgba(0,0,0,0.05)', padding: '32px', maxWidth: '680px' }}>
        <form onSubmit={handleSubmit} noValidate>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            <Field label="Segment Title" required error={errors.title} isDarkMode={isDarkMode}>
              <input type="text" value={form.title} onChange={handleChange('title')} onFocus={() => setFocusedField('title')} onBlur={() => setFocusedField(null)} placeholder="e.g. Keynote, Workshop A" style={{ ...inputStyle, borderColor: fieldBorder('title'), boxShadow: fieldShadow('title') }} />
            </Field>

            <Field label="Description (optional)" isDarkMode={isDarkMode}>
              <textarea value={form.description} onChange={handleChange('description')} onFocus={() => setFocusedField('description')} onBlur={() => setFocusedField(null)} placeholder="Add a description for this segment…" rows={3} style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.6', borderColor: fieldBorder('description'), boxShadow: fieldShadow('description') }} />
            </Field>

            <Field label="Room Name" required error={errors.room_name} isDarkMode={isDarkMode}>
              <input type="text" value={form.room_name} onChange={handleChange('room_name')} onFocus={() => setFocusedField('room_name')} onBlur={() => setFocusedField(null)} placeholder="e.g. Main Hall, Room 101" style={{ ...inputStyle, borderColor: fieldBorder('room_name'), boxShadow: fieldShadow('room_name') }} />
            </Field>

            <Field label="Start Time" required error={errors.start_time} isDarkMode={isDarkMode}>
              <div style={{ position: 'relative' }}>
                <input 
                  type="datetime-local" 
                  value={form.start_time} 
                  onChange={handleChange('start_time')} 
                  onFocus={() => setFocusedField('start_time')} 
                  onBlur={() => setFocusedField(null)} 
                  min={event?.start_date ? getEventDateOnly(event.start_date) : undefined}
                  style={{ 
                    ...inputStyle, 
                    borderColor: fieldBorder('start_time'), 
                    boxShadow: fieldShadow('start_time'),
                    colorScheme: isDarkMode ? 'dark' : 'light',
                  }}
                />
                <style>{`
                  input[type="datetime-local"]::-webkit-calendar-picker-indicator {
                    filter: ${isDarkMode ? 'invert(0.8) brightness(1.3)' : 'invert(0.6)'};
                  }
                `}</style>
              </div>
              {event?.start_date && (
                <p style={{ fontSize: '11px', color: isDarkMode ? '#64748b' : '#94a3b8', marginTop: '4px' }}>
                  Earliest: {new Date(event.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              )}
            </Field>

            <Field label="End Time" required error={errors.end_time} isDarkMode={isDarkMode}>
              <div style={{ position: 'relative' }}>
                <input 
                  type="datetime-local" 
                  value={form.end_time} 
                  onChange={handleChange('end_time')} 
                  onFocus={() => setFocusedField('end_time')} 
                  onBlur={() => setFocusedField(null)} 
                  min={form.start_time || (event?.start_date ? getEventDateOnly(event.start_date) : undefined)}
                  style={{ 
                    ...inputStyle, 
                    borderColor: fieldBorder('end_time'), 
                    boxShadow: fieldShadow('end_time'),
                    colorScheme: isDarkMode ? 'dark' : 'light',
                  }}
                />
                <style>{`
                  input[type="datetime-local"]::-webkit-calendar-picker-indicator {
                    filter: ${isDarkMode ? 'invert(0.8) brightness(1.3)' : 'invert(0.6)'};
                  }
                `}</style>
              </div>
            </Field>

            <Field label="Capacity Status" required isDarkMode={isDarkMode}>
              <select value={form.capacity_status} onChange={handleChange('capacity_status')} onFocus={() => setFocusedField('capacity_status')} onBlur={() => setFocusedField(null)} style={{ ...inputStyle, borderColor: fieldBorder('capacity_status'), boxShadow: fieldShadow('capacity_status') }}>
                <option value="VACANT">Open</option>
                <option value="FILLING">Filling Up</option>
                <option value="ALMOST FULL">Almost Full</option>
                <option value="FULL">Full</option>
              </select>
            </Field>

          </div>

          {/* ── Speaker Management Section ── */}
          <div style={{ marginTop: '32px', paddingTop: '32px', borderTop: isDarkMode ? '1px solid rgba(100, 116, 139, 0.3)' : '1px solid #f1f5f9' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: isDarkMode ? '#e2e8f0' : '#0f172a', margin: '0 0 16px' }}>
              <Users size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
              Speakers
            </h2>

            {assignedSpeakers.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                {assignedSpeakers.map((speaker) => (
                  <div key={speaker.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: isDarkMode ? 'rgba(27, 119, 207, 0.15)' : '#e8f4ff', borderRadius: '9999px', border: isDarkMode ? '1px solid rgba(27, 119, 207, 0.3)' : '1px solid #b3d4f0' }}>
                    <span style={{ fontSize: '13px', fontWeight: '500', color: isDarkMode ? '#7fb8e6' : '#155fa3' }}>{speaker.full_name}</span>
                    <button type="button" onClick={() => handleRemoveSpeaker(speaker.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: isDarkMode ? '#fca5a5' : '#dc2626', padding: '0', display: 'flex', flexShrink: 0 }}>
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: isDarkMode ? '#64748b' : '#9ca3af', fontStyle: 'italic', marginBottom: '16px', margin: 0 }}>No speakers assigned yet</p>
            )}

            <button
              type="button"
              onClick={() => setShowSpeakerModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '13px', fontWeight: '600', color: '#1B77CF', backgroundColor: isDarkMode ? 'rgba(27, 119, 207, 0.1)' : '#e8f4ff', border: isDarkMode ? '1px solid rgba(27, 119, 207, 0.3)' : '1px solid #b3d4f0', borderRadius: '8px', cursor: 'pointer' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(27, 119, 207, 0.2)' : '#e0f0ff'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(27, 119, 207, 0.1)' : '#e8f4ff'}
            >
              <Plus size={14} /> Add Speaker
            </button>
          </div>

          {/* ── Actions ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '32px' }}>
            {/* Cancel + Save row */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" onClick={handleBack}
                style={{ padding: '12px 20px', fontSize: '14px', fontWeight: '500', color: isDarkMode ? '#cbd5e1' : '#374151', backgroundColor: 'transparent', border: isDarkMode ? '1px solid rgba(100, 116, 139, 0.3)' : '1px solid #e2e8f0', borderRadius: '9999px', cursor: 'pointer', transition: 'background-color 0.15s', whiteSpace: 'nowrap' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(100, 116, 139, 0.1)' : '#f8fafc'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >Cancel</button>
              <button type="submit" disabled={!canSubmit || isBusy}
                style={{ flex: 1, padding: '12px 16px', fontSize: '14px', fontWeight: '600', color: submitColor, backgroundColor: submitBg, border: 'none', borderRadius: '9999px', cursor: canSubmit && !isBusy ? 'pointer' : 'not-allowed', transition: 'background-color 0.2s', whiteSpace: 'nowrap' }}
                onMouseEnter={(e) => { if (canSubmit && !isBusy) e.currentTarget.style.backgroundColor = '#155fa3' }}
                onMouseLeave={(e) => { if (canSubmit && !isBusy) e.currentTarget.style.backgroundColor = '#1B77CF' }}
              >{submitLabel}</button>
            </div>

            {/* Delete — separate row */}
            {isEditMode && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={deleting}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px 16px', fontSize: '13px', fontWeight: '500', color: '#dc2626', backgroundColor: 'transparent', border: isDarkMode ? '1px solid rgba(220, 38, 38, 0.3)' : '1px solid #fecaca', borderRadius: '9999px', cursor: 'pointer', transition: 'background-color 0.15s', opacity: deleting ? 0.5 : 1, width: '100%' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(220, 38, 38, 0.1)' : '#fef2f2'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Trash2 size={14} />
                Delete Segment
              </button>
            )}
          </div>
        </form>
      </div>

      {/* ── Delete Confirmation Modal ── */}
      {showDeleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
          onMouseDown={(e) => { if (e.target === e.currentTarget && !deleting) setShowDeleteConfirm(false) }}
        >
          <div style={{ backgroundColor: isDarkMode ? '#252F3E' : '#fff', borderRadius: '14px', padding: '28px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 48px rgba(0,0,0,0.18)', margin: '0 16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: isDarkMode ? '#e2e8f0' : '#0f172a', margin: '0 0 8px' }}>
              Delete Segment?
            </h3>
            <p style={{ fontSize: '14px', color: isDarkMode ? '#cbd5e1' : '#64748b', margin: '0 0 24px' }}>
              This action cannot be undone. The segment "{form.title}" will be permanently deleted.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                style={{ padding: '10px 16px', fontSize: '14px', fontWeight: '500', color: isDarkMode ? '#cbd5e1' : '#374151', backgroundColor: 'transparent', border: isDarkMode ? '1px solid rgba(100, 116, 139, 0.3)' : '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(100, 116, 139, 0.1)' : '#f8fafc'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                style={{ padding: '10px 16px', fontSize: '14px', fontWeight: '600', color: '#fff', backgroundColor: '#dc2626', border: 'none', borderRadius: '8px', cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.7 : 1 }}
                onMouseEnter={(e) => { if (!deleting) e.currentTarget.style.backgroundColor = '#b91c1c' }}
                onMouseLeave={(e) => { if (!deleting) e.currentTarget.style.backgroundColor = '#dc2626' }}
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Speaker Search Modal ── */}
      {showSpeakerModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) setShowSpeakerModal(false) }}
        >
          <div style={{ backgroundColor: isDarkMode ? '#252F3E' : '#fff', borderRadius: '14px', padding: '28px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 48px rgba(0,0,0,0.18)', margin: '0 16px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: isDarkMode ? '#e2e8f0' : '#0f172a', margin: 0 }}>Add Speaker</h3>
              <button onClick={() => setShowSpeakerModal(false)}
                style={{ padding: '6px', border: 'none', background: 'none', cursor: 'pointer', color: isDarkMode ? '#64748b' : '#94a3b8' }}
              ><X size={18} /></button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <input type="text" placeholder="Search speakers by name…" value={speakerSearch} onChange={(e) => setSpeakerSearch(e.target.value)} autoFocus
                style={{ width: '100%', padding: '10px 14px', fontSize: '14px', color: isDarkMode ? '#e2e8f0' : '#0f172a', backgroundColor: isDarkMode ? '#252F3E' : '#fff', border: isDarkMode ? '1px solid rgba(100, 116, 139, 0.3)' : '1px solid #e2e8f0', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}
                onFocus={(e) => e.target.style.borderColor = '#1B77CF'}
                onBlur={(e) => e.target.style.borderColor = isDarkMode ? 'rgba(100, 116, 139, 0.3)' : '#e2e8f0'}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '300px', overflowY: 'auto' }}>
              {getFilteredAvailableSpeakers().length === 0 ? (
                <p style={{ fontSize: '13px', color: '#9ca3af', textAlign: 'center', padding: '20px 0', margin: 0 }}>
                  {speakerSearch ? 'No speakers found' : 'All speakers already assigned'}
                </p>
              ) : (
                getFilteredAvailableSpeakers().map((speaker) => (
                  <button key={speaker.id} type="button"
                    onClick={() => { handleAddSpeaker(speaker); setSpeakerSearch(''); setShowSpeakerModal(false) }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', backgroundColor: 'transparent', border: isDarkMode ? '1px solid rgba(100, 116, 139, 0.3)' : '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontSize: '14px', color: isDarkMode ? '#e2e8f0' : '#0f172a', transition: 'background-color 0.15s' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(100, 116, 139, 0.1)' : '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '14px', fontWeight: '500', color: isDarkMode ? '#e2e8f0' : '#0f172a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{speaker.full_name}</p>
                      <p style={{ fontSize: '12px', color: '#9ca3af', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {[speaker.role, speaker.company].filter(Boolean).join(' • ')}
                      </p>
                    </div>
                    <Plus size={16} color="#16a34a" style={{ flexShrink: 0 }} />
                  </button>
                ))
              )}
            </div>

            <button onClick={() => setShowSpeakerModal(false)}
              style={{ width: '100%', marginTop: '16px', padding: '10px', borderRadius: '8px', border: isDarkMode ? '1px solid rgba(100, 116, 139, 0.3)' : '1px solid #e2e8f0', background: isDarkMode ? '#252F3E' : '#fff', color: isDarkMode ? '#cbd5e1' : '#475569', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}
            >Close</button>
          </div>
        </div>
      )}
    </div>
  )
}
