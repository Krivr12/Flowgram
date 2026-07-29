import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { createEvent, updateEvent, getEventById } from '../../services/events'

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Convert a UTC ISO timestamp from Supabase (e.g. "2026-07-12T13:00:00")
 * to the local "YYYY-MM-DDTHH:mm" string that <input type="datetime-local"> expects.
 */
const isoToLocalInput = (isoStr) => {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  // toISOString is always UTC; we need to shift to local time for the input value
  const offset = d.getTimezoneOffset() * 60000
  return new Date(d - offset).toISOString().slice(0, 16)
}

const EMPTY_FORM = {
  title: '',
  description: '',
  venue: '',
  start_date: '',
  end_date: '',
}

// ── Field component — keeps the JSX below clean ───────────────────────────────
const Field = ({ label, error, children }) => {
  const isDarkMode = document.documentElement.classList.contains('dark')
  return (
    <div>
      <label className="dark:text-slate-300" style={{
        display: 'block',
        fontSize: '13px',
        fontWeight: '600',
        color: isDarkMode ? '#cbd5e1' : '#374151',
        marginBottom: '6px',
      }}>
        {label}
      </label>
      {children}
      {error && (
        <p style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}>{error}</p>
      )}
    </div>
  )
}

const getInputStyle = () => {
  const isDarkMode = document.documentElement.classList.contains('dark')
  return {
    width: '100%',
    padding: '10px 14px',
    fontSize: '14px',
    color: isDarkMode ? '#e2e8f0' : '#0f172a',
    backgroundColor: isDarkMode ? '#1e293b' : '#fff',
    border: isDarkMode ? '1px solid rgba(100, 116, 139, 0.3)' : '1px solid #e2e8f0',
    borderRadius: '8px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  }
}

const inputStyle = getInputStyle()

// ── Page ─────────────────────────────────────────────────────────────────────

export const AdminEventFormPage = () => {
  const { eventId } = useParams()           // present only in edit mode
  const isEditMode  = Boolean(eventId)
  const navigate    = useNavigate()

  const [initialValues, setInitialValues] = useState(EMPTY_FORM)
  const [form,          setForm]          = useState(EMPTY_FORM)
  const [loading,       setLoading]       = useState(isEditMode)   // fetch only in edit mode
  const [submitting,    setSubmitting]    = useState(false)
  const [errors,        setErrors]        = useState({})
  const [serverError,   setServerError]   = useState('')
  const [focusedField,  setFocusedField]  = useState(null)

  // Detect dark mode from parent
  const isDarkMode = document.documentElement.classList.contains('dark')

  // ── Load existing event in edit mode ─────────────────────────────────────
  useEffect(() => {
    if (!isEditMode) return
    const load = async () => {
      const result = await getEventById(eventId)
      if (result.success) {
        const mapped = {
          title:       result.data.title       || '',
          description: result.data.description || '',
          venue:       result.data.venue        || '',
          start_date:  isoToLocalInput(result.data.start_date),
          end_date:    isoToLocalInput(result.data.end_date),
        }
        setInitialValues(mapped)
        setForm(mapped)
      } else {
        setServerError('Failed to load event data.')
      }
      setLoading(false)
    }
    load()
  }, [eventId, isEditMode])

  // ── Dirty check — true when any field differs from the initial load ───────
  const isDirty = Object.keys(form).some((k) => form[k] !== initialValues[k])

  // In create mode the button is always active; in edit mode only when dirty
  const canSubmit = isEditMode ? isDirty : true

  // ── Field handlers ────────────────────────────────────────────────────────
  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
    // Clear per-field error on change
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  // ── Client-side validation ────────────────────────────────────────────────
  const validate = () => {
    const errs = {}
    if (!form.title.trim())       errs.title       = 'Event title is required.'
    if (form.title.trim().length < 3) errs.title   = 'Title must be at least 3 characters.'
    if (!form.description.trim()) errs.description = 'Description is required.'
    if (form.description.trim().length < 10) errs.description = 'Description must be at least 10 characters.'
    if (!form.venue.trim())       errs.venue       = 'Venue is required.'
    if (!form.start_date)         errs.start_date  = 'Start date is required.'
    if (!form.end_date)           errs.end_date    = 'End date is required.'
    if (form.start_date && form.end_date && form.end_date <= form.start_date) {
      errs.end_date = 'End date must be after start date.'
    }
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
      title:       form.title.trim(),
      description: form.description.trim(),
      venue:       form.venue.trim(),
      start_date:  form.start_date,
      end_date:    form.end_date,
    }

    const result = isEditMode
      ? await updateEvent(eventId, payload)
      : await createEvent(payload)

    if (result.success) {
      navigate('/admin', { replace: true })
    } else {
      setServerError(result.error || 'Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  // ── Loading state (edit mode only) ───────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 24px' }}>
        <p style={{ fontSize: '14px', color: '#94a3b8' }}>Loading event…</p>
      </div>
    )
  }

  // ── Submit button styles ──────────────────────────────────────────────────
  const submitBg = canSubmit && !submitting ? '#FF9900' : '#d1d5db'
  const submitCursor = canSubmit && !submitting ? 'pointer' : 'not-allowed'

  return (
    <div>

      {/* ── Back link ── */}
      <button
        onClick={() => navigate('/admin')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '13px',
          fontWeight: '500',
          color: '#64748b',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '0 0 24px',
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = '#334155'}
        onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
      >
        <ArrowLeft size={15} />
        Back to Events
      </button>

      {/* ── Page heading ── */}
      <h1 className="dark:text-white" style={{
        fontSize: '24px',
        fontWeight: '700',
        color: isDarkMode ? '#fff' : '#252F3E',
        margin: '0 0 8px',
      }}>
        {isEditMode ? 'Edit Event' : 'New Event'}
      </h1>
      <p className="dark:text-slate-400" style={{ fontSize: '14px', color: isDarkMode ? '#94a3b8' : '#64748b', margin: '0 0 32px' }}>
        {isEditMode
          ? 'Update the event details below.'
          : 'Fill in the details to create a new event.'}
      </p>

      {/* ── Server error banner ── */}
      {serverError && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#dc2626',
          padding: '12px 16px',
          borderRadius: '8px',
          fontSize: '14px',
          marginBottom: '24px',
        }}>
          {serverError}
        </div>
      )}

      {/* ── Form card ── */}
      <div className="dark:bg-[#252F3E] dark:border-slate-700" style={{
        backgroundColor: isDarkMode ? '#252F3E' : '#ffffff',
        border: isDarkMode ? '1px solid rgba(100, 116, 139, 0.3)' : '1px solid #f3f4f6',
        borderRadius: '16px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        padding: '32px',
        maxWidth: '680px',
      }}>
        <form onSubmit={handleSubmit} noValidate>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Title */}
            <Field label="Event Title" error={errors.title}>
              <input
                type="text"
                value={form.title}
                onChange={handleChange('title')}
                onFocus={() => setFocusedField('title')}
                onBlur={() => setFocusedField(null)}
                placeholder="e.g. AWS User Group Meetup"
                style={{
                  ...inputStyle,
                  borderColor: errors.title
                    ? '#fca5a5'
                    : focusedField === 'title' ? '#FF9900' : '#e2e8f0',
                  boxShadow: focusedField === 'title' && !errors.title
                    ? '0 0 0 3px rgba(255,153,0,0.15)'
                    : 'none',
                }}
              />
            </Field>

            {/* Description */}
            <Field label="Description" error={errors.description}>
              <textarea
                value={form.description}
                onChange={handleChange('description')}
                onFocus={() => setFocusedField('description')}
                onBlur={() => setFocusedField(null)}
                placeholder="A brief summary of what attendees can expect…"
                rows={4}
                style={{
                  ...inputStyle,
                  resize: 'vertical',
                  lineHeight: '1.6',
                  borderColor: errors.description
                    ? '#fca5a5'
                    : focusedField === 'description' ? '#FF9900' : '#e2e8f0',
                  boxShadow: focusedField === 'description' && !errors.description
                    ? '0 0 0 3px rgba(255,153,0,0.15)'
                    : 'none',
                }}
              />
            </Field>

            {/* Venue */}
            <Field label="Venue" error={errors.venue}>
              <input
                type="text"
                value={form.venue}
                onChange={handleChange('venue')}
                onFocus={() => setFocusedField('venue')}
                onBlur={() => setFocusedField(null)}
                placeholder="e.g. SMX Convention Center, Pasay"
                style={{
                  ...inputStyle,
                  borderColor: errors.venue
                    ? '#fca5a5'
                    : focusedField === 'venue' ? '#FF9900' : '#e2e8f0',
                  boxShadow: focusedField === 'venue' && !errors.venue
                    ? '0 0 0 3px rgba(255,153,0,0.15)'
                    : 'none',
                }}
              />
            </Field>

            {/* Date row — stacks vertically on mobile, side-by-side on md+ */}
            <div className="flex flex-col md:flex-row gap-4 w-full">
              <div className="w-full">
                <Field label="Start Date & Time" error={errors.start_date}>
                  <input
                    type="datetime-local"
                    value={form.start_date}
                    onChange={handleChange('start_date')}
                    onFocus={() => setFocusedField('start_date')}
                    onBlur={() => setFocusedField(null)}
                    style={{
                      ...inputStyle,
                      borderColor: errors.start_date
                        ? '#fca5a5'
                        : focusedField === 'start_date' ? '#FF9900' : '#e2e8f0',
                      boxShadow: focusedField === 'start_date' && !errors.start_date
                        ? '0 0 0 3px rgba(255,153,0,0.15)'
                        : 'none',
                    }}
                  />
                </Field>
              </div>

              <div className="w-full">
                <Field label="End Date & Time" error={errors.end_date}>
                  <input
                    type="datetime-local"
                    value={form.end_date}
                    onChange={handleChange('end_date')}
                    onFocus={() => setFocusedField('end_date')}
                    onBlur={() => setFocusedField(null)}
                    style={{
                      ...inputStyle,
                      borderColor: errors.end_date
                        ? '#fca5a5'
                        : focusedField === 'end_date' ? '#FF9900' : '#e2e8f0',
                      boxShadow: focusedField === 'end_date' && !errors.end_date
                        ? '0 0 0 3px rgba(255,153,0,0.15)'
                        : 'none',
                    }}
                  />
                </Field>
              </div>
            </div>

          </div>

          {/* ── Actions ── */}
          <div style={{
            display: 'flex',
            gap: '12px',
            marginTop: '32px',
            justifyContent: 'flex-end',
          }}>
            <button
              type="button"
              onClick={() => navigate('/admin')}
              style={{
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                backgroundColor: 'transparent',
                border: '1px solid #e2e8f0',
                borderRadius: '9999px',
                cursor: 'pointer',
                transition: 'background-color 0.15s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!canSubmit || submitting}
              style={{
                padding: '10px 24px',
                fontSize: '14px',
                fontWeight: '600',
                color: canSubmit && !submitting ? '#fff' : '#9ca3af',
                backgroundColor: submitBg,
                border: 'none',
                borderRadius: '9999px',
                cursor: submitCursor,
                transition: 'background-color 0.2s',
                minWidth: '140px',
              }}
              onMouseEnter={(e) => {
                if (canSubmit && !submitting) e.currentTarget.style.backgroundColor = '#e68a00'
              }}
              onMouseLeave={(e) => {
                if (canSubmit && !submitting) e.currentTarget.style.backgroundColor = '#FF9900'
              }}
            >
              {submitting
                ? (isEditMode ? 'Saving…' : 'Creating…')
                : (isEditMode ? 'Save Changes' : 'Create Event')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
