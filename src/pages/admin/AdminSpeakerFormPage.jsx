import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Camera, User, Trash2 } from 'lucide-react'
import { createSpeaker, getSpeakerById, updateSpeaker, deleteSpeaker } from '../../services/speakers'
import { uploadProfilePictureToS3, generateMediaPath } from '../../services/s3UploadService'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  full_name:           '',
  role:                '',
  company:             '',
  event_role:          'SPEAKER',
  description:         '',
  linkedin_url:        '',
  profile_picture_url: '',
}

// ─── Shared input styles ──────────────────────────────────────────────────────

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

// ─── Field wrapper ────────────────────────────────────────────────────────────

const Field = ({ label, required, error, children, isDarkMode }) => (
  <div>
    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: isDarkMode ? '#cbd5e1' : '#374151', marginBottom: '6px' }}>
      {label}{required && <span style={{ color: '#ff0000', marginLeft: '2px' }}>*</span>}
    </label>
    {children}
    {error && <p style={{ fontSize: '12px', color: isDarkMode ? '#fca5a5' : '#dc2626', marginTop: '4px' }}>{error}</p>}
  </div>
)

// ─── Page ─────────────────────────────────────────────────────────────────────

export const AdminSpeakerFormPage = () => {
  const { eventId, speakerId } = useParams()
  const isEditMode = Boolean(speakerId)
  const navigate   = useNavigate()

  const [isDarkMode, setIsDarkMode] = useState(() =>
    document.documentElement.classList.contains('dark')
  )
  const [initialValues, setInitialValues] = useState(EMPTY_FORM)
  const [form, setForm]                   = useState(EMPTY_FORM)
  const [errors, setErrors]               = useState({})
  const [serverError, setServerError]     = useState('')
  const [loading, setLoading]             = useState(isEditMode)
  const [submitting, setSubmitting]       = useState(false)
  const [focusedField, setFocusedField]   = useState(null)

  // Image state
  const [selectedFile, setSelectedFile]   = useState(null)
  const [imagePreview, setImagePreview]   = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef(null)
  const [deleting, setDeleting]           = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // ── Observe dark mode changes ─────────────────────────────────────────────

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'))
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  // ── Load speaker in edit mode ─────────────────────────────────────────────

  useEffect(() => {
    if (!isEditMode) return
    const load = async () => {
      const result = await getSpeakerById(speakerId)
      if (result.success) {
        const mapped = {
          full_name:           result.data.full_name           || '',
          role:                result.data.role                || '',
          company:             result.data.company             || '',
          event_role:          result.data.event_role          || 'SPEAKER',
          description:         result.data.description         || '',
          linkedin_url:        result.data.linkedin_url        || '',
          profile_picture_url: result.data.profile_picture_url || '',
        }
        setInitialValues(mapped)
        setForm(mapped)
        setImagePreview(result.data.profile_picture_url || null)
      } else {
        setServerError('Failed to load speaker data.')
      }
      setLoading(false)
    }
    load()
  }, [speakerId, isEditMode])

  // ── Dirty check ───────────────────────────────────────────────────────────
  // In edit mode: active only when a field changed OR a new image was staged.
  // In add mode: always active.

  const isFieldDirty = Object.keys(form).some((k) => form[k] !== initialValues[k])
  const isDirty      = isFieldDirty || Boolean(selectedFile)
  const canSubmit    = isEditMode ? isDirty : true

  // ── Field change ──────────────────────────────────────────────────────────

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  // ── Image selection ───────────────────────────────────────────────────────

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setImagePreview(ev.target?.result)
    reader.readAsDataURL(file)
  }

  // ── Validation ────────────────────────────────────────────────────────────

  const validate = () => {
    const errs = {}
    if (!form.full_name.trim() || form.full_name.trim().length < 2)
      errs.full_name = 'Name must be at least 2 characters.'
    if (!form.role.trim())
      errs.role = 'Role is required.'
    if (!form.company.trim())
      errs.company = 'Company is required.'
    if (!form.description.trim() || form.description.trim().length < 10)
      errs.description = 'Description must be at least 10 characters.'
    if (form.linkedin_url && !/^https?:\/\/.+/.test(form.linkedin_url))
      errs.linkedin_url = 'Must be a valid URL (start with https://).'
    return errs
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  const [successMsg, setSuccessMsg] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')
    setSuccessMsg('')

    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setSubmitting(true)

    // Upload new image if staged
    let imageUrl = form.profile_picture_url
    if (selectedFile) {
      setUploadingImage(true)
      const ext    = selectedFile.name.split('.').pop() || 'jpg'
      const s3Path = generateMediaPath('speaker-photos', ext)
      const upload = await uploadProfilePictureToS3(selectedFile, s3Path)
      setUploadingImage(false)
      if (!upload.success) {
        setServerError(upload.error || 'Failed to upload image.')
        setSubmitting(false)
        return
      }
      imageUrl = upload.url
    }

    const payload = {
      full_name:           form.full_name.trim(),
      role:                form.role.trim(),
      company:             form.company.trim(),
      event_role:          form.event_role,
      description:         form.description.trim(),
      linkedin_url:        form.linkedin_url.trim() || null,
      profile_picture_url: imageUrl || null,
    }

    const result = isEditMode
      ? await updateSpeaker(speakerId, payload)
      : await createSpeaker(payload)

    if (result.success) {
      setSuccessMsg(isEditMode ? 'Speaker updated!' : 'Speaker added!')
      setTimeout(() => navigate(`/admin/events/${eventId}/speakers`), 1000)
    } else {
      setServerError(result.error || 'Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  // ── Back navigation ───────────────────────────────────────────────────────

  const handleBack = () => navigate(`/admin/events/${eventId}/speakers`)

  const handleDelete = async () => {
    setDeleting(true)
    const result = await deleteSpeaker(speakerId)
    if (result.success) {
      navigate(`/admin/events/${eventId}/speakers`)
    } else {
      setServerError(result.error || 'Failed to delete speaker.')
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  // ── Loading state (edit mode only) ───────────────────────────────────────

  if (loading) {
    return (
      <div style={{ padding: '32px', display: 'flex', justifyContent: 'center' }}>
        <p style={{ fontSize: '14px', color: isDarkMode ? '#cbd5e1' : '#94a3b8' }}>Loading speaker…</p>
      </div>
    )
  }

  // ── Button styles ─────────────────────────────────────────────────────────

  const isBusy      = submitting || uploadingImage
  const submitBg    = canSubmit && !isBusy ? '#1B77CF' : isDarkMode ? 'rgba(148, 163, 184, 0.2)' : '#d1d5db'
  const submitColor = canSubmit && !isBusy ? '#fff'    : isDarkMode ? '#64748b' : '#9ca3af'
  const submitLabel = isBusy
    ? (isEditMode ? 'Saving…' : 'Adding…')
    : (isEditMode ? 'Save Changes' : 'Add Speaker')

  // ── Focus-aware border helper ─────────────────────────────────────────────

  const fieldBorder = (name) => {
    if (errors[name])        return isDarkMode ? '#fca5a5' : '#fca5a5'
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
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          fontSize: '13px', fontWeight: '500', color: isDarkMode ? '#94a3b8' : '#64748b',
          background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 24px',
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = isDarkMode ? '#cbd5e1' : '#334155'}
        onMouseLeave={(e) => e.currentTarget.style.color = isDarkMode ? '#94a3b8' : '#64748b'}
      >
        <ArrowLeft size={15} />
        Back to Speakers
      </button>

      {/* ── Page heading ── */}
      <h1 style={{ fontSize: '24px', fontWeight: '700', color: isDarkMode ? '#f8fafc' : '#252F3E', margin: '0 0 8px' }}>
        {isEditMode ? 'Edit Speaker' : 'New Speaker'}
      </h1>
      <p style={{ fontSize: '14px', color: isDarkMode ? '#cbd5e1' : '#64748b', margin: '0 0 32px' }}>
        {isEditMode
          ? 'Update the speaker details below.'
          : 'Fill in the details to add a new speaker.'}
      </p>

      {/* ── Server error ── */}
      {serverError && (
        <div style={{ backgroundColor: isDarkMode ? 'rgba(220, 38, 38, 0.1)' : '#fef2f2', border: isDarkMode ? '1px solid rgba(220, 38, 38, 0.3)' : '1px solid #fecaca', color: isDarkMode ? '#fca5a5' : '#dc2626', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', marginBottom: '24px' }}>
          {serverError}
        </div>
      )}

      {/* ── Success ── */}
      {successMsg && (
        <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #86efac', color: '#166534', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', marginBottom: '24px' }}>
          {successMsg}
        </div>
      )}

      {/* ── Form card ── */}
      <div style={{ backgroundColor: isDarkMode ? '#252F3E' : '#fff', border: isDarkMode ? '1px solid rgba(100, 116, 139, 0.3)' : '1px solid #f3f4f6', borderRadius: '16px', boxShadow: isDarkMode ? '0 1px 4px rgba(0,0,0,0.3)' : '0 1px 4px rgba(0,0,0,0.05)', padding: '32px', maxWidth: '680px' }}>
        <form onSubmit={handleSubmit} noValidate>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* ── Avatar upload ── */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                style={{ display: 'none' }}
              />
              <label
                htmlFor="speaker-photo"
                onClick={() => fileInputRef.current?.click()}
                style={{ cursor: 'pointer' }}
              >
                <div style={{ position: 'relative', width: '96px', height: '96px', borderRadius: '9999px', backgroundColor: isDarkMode ? 'rgba(100, 116, 139, 0.2)' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: isDarkMode ? '2px solid rgba(100, 116, 139, 0.3)' : '2px solid #e2e8f0' }}>
                  {imagePreview ? (
                    <img src={imagePreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <User size={40} color="#94a3b8" />
                  )}
                  <div style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: isDarkMode ? 'rgba(27, 119, 207, 0.2)' : '#e8f4ff', padding: '6px', borderRadius: '9999px', border: isDarkMode ? '2px solid #252F3E' : '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Camera size={14} color="#1B77CF" />
                  </div>
                </div>
              </label>
              <p style={{ fontSize: '12px', color: isDarkMode ? '#cbd5e1' : '#64748b', margin: 0 }}>Click to upload photo</p>
            </div>

            {/* Full Name */}
            <Field label="Full Name" required error={errors.full_name} isDarkMode={isDarkMode}>
              <input
                type="text"
                value={form.full_name}
                onChange={handleChange('full_name')}
                onFocus={() => setFocusedField('full_name')}
                onBlur={() => setFocusedField(null)}
                placeholder="e.g. Jane Doe"
                style={{ ...inputStyle, borderColor: fieldBorder('full_name'), boxShadow: fieldShadow('full_name') }}
              />
            </Field>

            {/* Role */}
            <Field label="Title / Role" required error={errors.role} isDarkMode={isDarkMode}>
              <input
                type="text"
                value={form.role}
                onChange={handleChange('role')}
                onFocus={() => setFocusedField('role')}
                onBlur={() => setFocusedField(null)}
                placeholder="e.g. Senior Engineer"
                style={{ ...inputStyle, borderColor: fieldBorder('role'), boxShadow: fieldShadow('role') }}
              />
            </Field>

            {/* Company */}
            <Field label="Company" required error={errors.company} isDarkMode={isDarkMode}>
              <input
                type="text"
                value={form.company}
                onChange={handleChange('company')}
                onFocus={() => setFocusedField('company')}
                onBlur={() => setFocusedField(null)}
                placeholder="e.g. Amazon Web Services"
                style={{ ...inputStyle, borderColor: fieldBorder('company'), boxShadow: fieldShadow('company') }}
              />
            </Field>

            {/* Event Role */}
            <Field label="Event Role" required isDarkMode={isDarkMode}>
              <select
                value={form.event_role}
                onChange={handleChange('event_role')}
                onFocus={() => setFocusedField('event_role')}
                onBlur={() => setFocusedField(null)}
                style={{ ...inputStyle, borderColor: fieldBorder('event_role'), boxShadow: fieldShadow('event_role') }}
              >
                <option value="SPEAKER">Speaker</option>
                <option value="HOST">Host</option>
                <option value="PANELIST">Panelist</option>
              </select>
            </Field>

            {/* Bio / Description */}
            <Field label="Bio / Description" required error={errors.description} isDarkMode={isDarkMode}>
              <textarea
                value={form.description}
                onChange={handleChange('description')}
                onFocus={() => setFocusedField('description')}
                onBlur={() => setFocusedField(null)}
                placeholder="A short bio of the speaker…"
                rows={4}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.6', borderColor: fieldBorder('description'), boxShadow: fieldShadow('description') }}
              />
            </Field>

            {/* LinkedIn */}
            <Field label="LinkedIn URL (optional)" error={errors.linkedin_url} isDarkMode={isDarkMode}>
              <input
                type="url"
                value={form.linkedin_url}
                onChange={handleChange('linkedin_url')}
                onFocus={() => setFocusedField('linkedin_url')}
                onBlur={() => setFocusedField(null)}
                placeholder="https://linkedin.com/in/…"
                style={{ ...inputStyle, borderColor: fieldBorder('linkedin_url'), boxShadow: fieldShadow('linkedin_url') }}
              />
            </Field>

          </div>

          {/* ── Actions ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '32px' }}>
            {/* Save + Cancel row */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={handleBack}
                style={{ padding: '12px 20px', fontSize: '14px', fontWeight: '500', color: isDarkMode ? '#cbd5e1' : '#374151', backgroundColor: 'transparent', border: isDarkMode ? '1px solid rgba(100, 116, 139, 0.3)' : '1px solid #e2e8f0', borderRadius: '9999px', cursor: 'pointer', transition: 'background-color 0.15s', whiteSpace: 'nowrap' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(100, 116, 139, 0.1)' : '#f8fafc'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!canSubmit || isBusy}
                style={{ flex: 1, padding: '12px 16px', fontSize: '14px', fontWeight: '600', color: submitColor, backgroundColor: submitBg, border: 'none', borderRadius: '9999px', cursor: canSubmit && !isBusy ? 'pointer' : 'not-allowed', transition: 'background-color 0.2s', whiteSpace: 'nowrap' }}
                onMouseEnter={(e) => { if (canSubmit && !isBusy) e.currentTarget.style.backgroundColor = '#155fa3' }}
                onMouseLeave={(e) => { if (canSubmit && !isBusy) e.currentTarget.style.backgroundColor = '#1B77CF' }}
              >
                {submitLabel}
              </button>
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
                Delete Speaker
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
              Delete Speaker?
            </h3>
            <p style={{ fontSize: '14px', color: isDarkMode ? '#cbd5e1' : '#64748b', margin: '0 0 24px' }}>
              This action cannot be undone. "{form.full_name}" will be permanently deleted.
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
    </div>
  )
}
