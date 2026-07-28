import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, X, Users } from 'lucide-react'
import {
  createSegment,
  updateSegment,
  getSegmentWithSpeakers,
  addSpeakerToSegment,
  removeSpeakerFromSegment,
} from '../../services/segments'
import { getAllSpeakers } from '../../services/speakers'

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

const EMPTY_FORM = {
  title:           '',
  description:     '',
  room_name:       '',
  start_time:      '',
  end_time:        '',
  capacity_status: 'VACANT',
}

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  fontSize: '14px',
  color: '#0f172a',
  backgroundColor: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s, box-shadow 0.15s',
}

const Field = ({ label, required, error, children }) => (
  <div>
    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
      {label}{required && ' *'}
    </label>
    {children}
    {error && <p style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}>{error}</p>}
  </div>
)

// ─── Main Page ────────────────────────────────────────────────────────────────

export const AdminSegmentFormPage = () => {
  const { eventId, segmentId } = useParams()
  const isEditMode = Boolean(segmentId)
  const navigate = useNavigate()

  // Form state
  const [initialValues, setInitialValues] = useState(EMPTY_FORM)
  const [form, setForm]                   = useState(EMPTY_FORM)
  const [errors, setErrors]               = useState({})
  const [serverError, setServerError]     = useState('')
  const [loading, setLoading]             = useState(isEditMode)
  const [submitting, setSubmitting]       = useState(false)
  const [focusedField, setFocusedField]   = useState(null)

  // Speaker management state
  const [allSpeakers, setAllSpeakers]           = useState([])
  const [assignedSpeakers, setAssignedSpeakers] = useState([])
  const [loadingSpeakers, setLoadingSpeakers]   = useState(false)
  const [showSpeakerModal, setShowSpeakerModal] = useState(false)
  const [speakerSearch, setSpeakerSearch]       = useState('')

  // ── Load segment and speakers in edit mode ─────────────────────────────────

  useEffect(() => {
    if (!isEditMode) {
      loadSpeakers()
      return
    }
    const load = async () => {
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

      if (speakersResult.success) {
        setAllSpeakers(speakersResult.data || [])
      }
      setLoading(false)
    }
    load()
  }, [segmentId, isEditMode])

  // Load all speakers in add mode
  const loadSpeakers = async () => {
    setLoadingSpeakers(true)
    const result = await getAllSpeakers()
    if (result.success) {
      setAllSpeakers(result.data || [])
    }
    setLoadingSpeakers(false)
  }

  // ── Dirty check ───────────────────────────────────────────────────────────
  // In edit mode: active when any field changed OR speakers changed.
  // In add mode: always active.

  const isFormDirty = Object.keys(form).some((k) => form[k] !== initialValues[k])
  const initialSpeakerIds = new Set(initialValues.speakers?.map((s) => s.id) || [])
  const currentSpeakerIds = new Set(assignedSpeakers.map((s) => s.id))
  const areSpeakersDirty =
    initialSpeakerIds.size !== currentSpeakerIds.size ||
    [...initialSpeakerIds].some((id) => !currentSpeakerIds.has(id))

  const isDirty = isFormDirty || areSpeakersDirty
  const canSubmit = isEditMode ? isDirty : true

  // ── Field change ──────────────────────────────────────────────────────────

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  // ── Speaker management ────────────────────────────────────────────────────

  const handleAddSpeaker = (speaker) => {
    if (!assignedSpeakers.find((s) => s.id === speaker.id)) {
      setAssignedSpeakers((prev) => [...prev, speaker])
    }
  }

  const handleRemoveSpeaker = (speakerId) => {
    setAssignedSpeakers((prev) => prev.filter((s) => s.id !== speakerId))
  }

  const getAvailableSpeakers = () => {
    const assignedIds = new Set(assignedSpeakers.map((s) => s.id))
    return allSpeakers.filter((s) => !assignedIds.has(s.id))
  }

  const getFilteredAvailableSpeakers = () => {
    const query = speakerSearch.toLowerCase()
    return getAvailableSpeakers().filter((s) =>
      s.full_name.toLowerCase().includes(query)
    )
  }

  // ── Validation ────────────────────────────────────────────────────────────

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
    if (form.start_time && form.end_time && form.end_time <= form.start_time)
      errs.end_time = 'End time must be after start time.'
    return errs
  }

  // ── Submit ────────────────────────────────────────────────────────────────

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

    // Create or update segment
    const segmentResult = isEditMode
      ? await updateSegment(segmentId, payload)
      : await createSegment(payload)

    if (!segmentResult.success) {
      setServerError(segmentResult.error || 'Something went wrong. Please try again.')
      setSubmitting(false)
      return
    }

    const actualSegmentId = isEditMode ? segmentId : segmentResult.data.id

    // Sync speaker assignments
    if (isEditMode) {
      // Remove speakers that are no longer assigned
      const initialSpeakerIds = new Set(initialValues.speakers?.map((s) => s.id) || [])
      const currentIds = new Set(assignedSpeakers.map((s) => s.id))
      for (const id of initialSpeakerIds) {
        if (!currentIds.has(id)) {
          await removeSpeakerFromSegment(actualSegmentId, id)
        }
      }

      // Add speakers that are newly assigned
      for (const speaker of assignedSpeakers) {
        if (!initialSpeakerIds.has(speaker.id)) {
          await addSpeakerToSegment(actualSegmentId, speaker.id)
        }
      }
    } else {
      // Add all speakers to new segment
      for (const speaker of assignedSpeakers) {
        await addSpeakerToSegment(actualSegmentId, speaker.id)
      }
    }

    navigate(`/admin/events/${eventId}/segments`)
  }

  // ── Back navigation ───────────────────────────────────────────────────────

  const handleBack = () => navigate(`/admin/events/${eventId}/segments`)

  // ── Loading state (edit mode only) ───────────────────────────────────────

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 24px' }}>
        <p style={{ fontSize: '14px', color: '#94a3b8' }}>Loading segment…</p>
      </div>
    )
  }

  // ── Button styles ─────────────────────────────────────────────────────────

  const isBusy      = submitting
  const submitBg    = canSubmit && !isBusy ? '#FF9900' : '#d1d5db'
  const submitColor = canSubmit && !isBusy ? '#fff'    : '#9ca3af'
  const submitLabel = isBusy
    ? (isEditMode ? 'Saving…' : 'Creating…')
    : (isEditMode ? 'Save Changes' : 'Create Segment')

  // ── Focus-aware border helper ─────────────────────────────────────────────

  const fieldBorder = (name) => {
    if (errors[name])        return '#fca5a5'
    if (focusedField === name) return '#FF9900'
    return '#e2e8f0'
  }
  const fieldShadow = (name) =>
    focusedField === name && !errors[name] ? '0 0 0 3px rgba(255,153,0,0.15)' : 'none'

  return (
    <div>

      {/* ── Back link ── */}
      <button
        onClick={handleBack}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          fontSize: '13px', fontWeight: '500', color: '#64748b',
          background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 24px',
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = '#334155'}
        onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
      >
        <ArrowLeft size={15} />
        Back to Segments
      </button>

      {/* ── Page heading ── */}
      <h1 className="text-xl font-bold text-[#252F3E] text-left mt-4 mb-4" style={{ fontSize: '24px', fontWeight: '700', color: '#252F3E', margin: '0 0 8px' }}>
        {isEditMode ? 'Edit Segment' : 'New Segment'}
      </h1>
      <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 32px' }}>
        {isEditMode
          ? 'Update the segment details and manage speaker assignments below.'
          : 'Fill in the details and assign speakers to create a new segment.'}
      </p>

      {/* ── Server error ── */}
      {serverError && (
        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', marginBottom: '24px' }}>
          {serverError}
        </div>
      )}

      {/* ── Form card ── */}
      <div style={{ backgroundColor: '#fff', border: '1px solid #f3f4f6', borderRadius: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', padding: '32px', maxWidth: '680px' }}>
        <form onSubmit={handleSubmit} noValidate>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Title */}
            <Field label="Segment Title" required error={errors.title}>
              <input
                type="text"
                value={form.title}
                onChange={handleChange('title')}
                onFocus={() => setFocusedField('title')}
                onBlur={() => setFocusedField(null)}
                placeholder="e.g. Keynote, Workshop A"
                style={{ ...inputStyle, borderColor: fieldBorder('title'), boxShadow: fieldShadow('title') }}
              />
            </Field>

            {/* Description */}
            <Field label="Description (optional)">
              <textarea
                value={form.description}
                onChange={handleChange('description')}
                onFocus={() => setFocusedField('description')}
                onBlur={() => setFocusedField(null)}
                placeholder="Add a description for this segment…"
                rows={3}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.6', borderColor: fieldBorder('description'), boxShadow: fieldShadow('description') }}
              />
            </Field>

            {/* Room Name */}
            <Field label="Room Name" required error={errors.room_name}>
              <input
                type="text"
                value={form.room_name}
                onChange={handleChange('room_name')}
                onFocus={() => setFocusedField('room_name')}
                onBlur={() => setFocusedField(null)}
                placeholder="e.g. Main Hall, Room 101"
                style={{ ...inputStyle, borderColor: fieldBorder('room_name'), boxShadow: fieldShadow('room_name') }}
              />
            </Field>

            {/* Times — stacked vertically */}
            <div className="flex flex-col gap-4 w-full">
              <div>
                <Field label="Start Time" required error={errors.start_time}>
                  <input
                    type="datetime-local"
                    value={form.start_time}
                    onChange={handleChange('start_time')}
                    onFocus={() => setFocusedField('start_time')}
                    onBlur={() => setFocusedField(null)}
                    style={{ ...inputStyle, width: '100%', borderColor: fieldBorder('start_time'), boxShadow: fieldShadow('start_time') }}
                  />
                </Field>
              </div>
              <div>
                <Field label="End Time" required error={errors.end_time}>
                  <input
                    type="datetime-local"
                    value={form.end_time}
                    onChange={handleChange('end_time')}
                    onFocus={() => setFocusedField('end_time')}
                    onBlur={() => setFocusedField(null)}
                    style={{ ...inputStyle, width: '100%', borderColor: fieldBorder('end_time'), boxShadow: fieldShadow('end_time') }}
                  />
                </Field>
              </div>
            </div>

            {/* Capacity Status */}
            <Field label="Capacity Status" required>
              <select
                value={form.capacity_status}
                onChange={handleChange('capacity_status')}
                onFocus={() => setFocusedField('capacity_status')}
                onBlur={() => setFocusedField(null)}
                style={{ ...inputStyle, borderColor: fieldBorder('capacity_status'), boxShadow: fieldShadow('capacity_status') }}
              >
                <option value="VACANT">Vacant</option>
                <option value="MODERATE">Moderate</option>
                <option value="FULL">Full</option>
              </select>
            </Field>

          </div>

          {/* ── Speaker Management Section ── */}
          <div style={{ marginTop: '32px', paddingTop: '32px', borderTop: '1px solid #f1f5f9' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0 0 16px' }}>
              <Users size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
              Speakers
            </h2>

            {/* Assigned speakers list or tags */}
            {assignedSpeakers.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                {assignedSpeakers.map((speaker) => (
                  <div
                    key={speaker.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '6px 12px', backgroundColor: '#eff6ff', borderRadius: '9999px', border: '1px solid #bfdbfe',
                    }}
                  >
                    <span style={{ fontSize: '13px', fontWeight: '500', color: '#1d4ed8' }}>
                      {speaker.full_name}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSpeaker(speaker.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '0', display: 'flex', flexShrink: 0 }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: '#9ca3af', fontStyle: 'italic', marginBottom: '16px', margin: 0 }}>
                No speakers assigned yet
              </p>
            )}

            {/* Add Speaker Button */}
            <button
              type="button"
              onClick={() => setShowSpeakerModal(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px', fontSize: '13px', fontWeight: '600',
                color: '#2563eb', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe',
                borderRadius: '8px', cursor: 'pointer',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dbeafe'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#eff6ff'}
            >
              <Plus size={14} /> Add Speaker
            </button>
          </div>

          {/* ── Actions ── */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '32px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleBack}
              style={{ padding: '10px 20px', fontSize: '14px', fontWeight: '500', color: '#374151', backgroundColor: 'transparent', border: '1px solid #e2e8f0', borderRadius: '9999px', cursor: 'pointer', transition: 'background-color 0.15s' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!canSubmit || isBusy}
              style={{ padding: '10px 24px', fontSize: '14px', fontWeight: '600', color: submitColor, backgroundColor: submitBg, border: 'none', borderRadius: '9999px', cursor: canSubmit && !isBusy ? 'pointer' : 'not-allowed', transition: 'background-color 0.2s', minWidth: '140px' }}
              onMouseEnter={(e) => { if (canSubmit && !isBusy) e.currentTarget.style.backgroundColor = '#e68a00' }}
              onMouseLeave={(e) => { if (canSubmit && !isBusy) e.currentTarget.style.backgroundColor = '#FF9900' }}
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </div>

      {/* ── Speaker Search Modal ── */}
      {showSpeakerModal && (
        <div
          style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
          }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) setShowSpeakerModal(false) }}
        >
          <div
            style={{
              backgroundColor: '#fff', borderRadius: '14px', padding: '28px',
              width: '100%', maxWidth: '420px', boxShadow: '0 20px 48px rgba(0,0,0,0.18)',
              margin: '0 16px', maxHeight: '80vh', overflowY: 'auto',
            }}
          >
            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                Add Speaker
              </h3>
              <button
                onClick={() => setShowSpeakerModal(false)}
                style={{ padding: '6px', border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Search input */}
            <div style={{ marginBottom: '16px' }}>
              <input
                type="text"
                placeholder="Search speakers by name…"
                value={speakerSearch}
                onChange={(e) => setSpeakerSearch(e.target.value)}
                autoFocus
                style={{
                  width: '100%', padding: '10px 14px', fontSize: '14px', color: '#0f172a',
                  backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px',
                  outline: 'none', boxSizing: 'border-box',
                }}
                onFocus={(e) => e.target.style.borderColor = '#FF9900'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            {/* Speaker results */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '300px', overflowY: 'auto' }}>
              {getFilteredAvailableSpeakers().length === 0 ? (
                <p style={{ fontSize: '13px', color: '#9ca3af', textAlign: 'center', padding: '20px 0', margin: 0 }}>
                  {speakerSearch ? 'No speakers found' : 'All speakers already assigned'}
                </p>
              ) : (
                getFilteredAvailableSpeakers().map((speaker) => (
                  <button
                    key={speaker.id}
                    type="button"
                    onClick={() => {
                      handleAddSpeaker(speaker)
                      setSpeakerSearch('')
                      setShowSpeakerModal(false)
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 14px', backgroundColor: 'transparent', border: '1px solid #e2e8f0',
                      borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontSize: '14px', color: '#0f172a',
                      transition: 'background-color 0.15s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '14px', fontWeight: '500', color: '#0f172a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {speaker.full_name}
                      </p>
                      <p style={{ fontSize: '12px', color: '#9ca3af', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {[speaker.role, speaker.company].filter(Boolean).join(' • ')}
                      </p>
                    </div>
                    <Plus size={16} color="#16a34a" style={{ flexShrink: 0 }} />
                  </button>
                ))
              )}
            </div>

            {/* Close button */}
            <button
              onClick={() => setShowSpeakerModal(false)}
              style={{
                width: '100%', marginTop: '16px', padding: '10px', borderRadius: '8px',
                border: '1px solid #e2e8f0', background: '#fff', color: '#475569',
                fontSize: '14px', fontWeight: '500', cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
