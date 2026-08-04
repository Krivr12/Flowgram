/**
 * Date utilities for Flowgram
 *
 * Data contract:
 *   All event/segment timestamps in the database are stored as UTC values where
 *   the UTC wall-clock time equals the intended local (Philippine) display time.
 *   e.g. "2026-08-22 08:00:00+00" means "display as 08:00 AM" — no offset conversion.
 *
 * Display rule  → always render with timeZone: 'UTC' to read the stored value as-is.
 * Write rule    → strip browser-local offset by sending a naive ISO string (no +HH:MM).
 */

const DISPLAY_TZ = 'UTC'

// ─── Display formatters ───────────────────────────────────────────────────────

/**
 * "08:00 AM"  — reads UTC wall-clock value directly.
 * @param {string} dateStr  ISO timestamp from the database
 */
export const formatTime = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: DISPLAY_TZ,
  })
}

/**
 * "Aug 23, 2026"  — reads UTC wall-clock value directly.
 * @param {string} dateStr  ISO timestamp from the database
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: DISPLAY_TZ,
  })
}

/**
 * "Aug 23, 2026 · 08:00 AM"
 * @param {string} dateStr  ISO timestamp from the database
 */
export const formatDateTime = (dateStr) => {
  if (!dateStr) return ''
  return formatDate(dateStr) + ' · ' + formatTime(dateStr)
}

// ─── Form helpers (datetime-local ↔ ISO) ─────────────────────────────────────

/**
 * Convert a DB ISO timestamp → "YYYY-MM-DDTHH:mm" for a datetime-local input.
 * Reads the UTC components directly so the admin sees the intended wall-clock time.
 *
 * @param {string} isoStr  ISO timestamp from the database
 * @returns {string}  "YYYY-MM-DDTHH:mm"
 */
export const isoToDatetimeLocal = (isoStr) => {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  if (isNaN(d.getTime())) return ''
  const year    = d.getUTCFullYear()
  const month   = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day     = String(d.getUTCDate()).padStart(2, '0')
  const hours   = String(d.getUTCHours()).padStart(2, '0')
  const minutes = String(d.getUTCMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

/**
 * Convert a datetime-local value → ISO string for database storage.
 * Appends "+00:00" so Supabase stores the exact typed time as the UTC value —
 * no browser-local offset is applied.
 *
 * e.g. admin types "2026-08-23T08:00"  →  "2026-08-23T08:00:00+00:00"
 * Supabase stores: 2026-08-23 08:00:00+00  ✓
 *
 * @param {string} datetimeLocal  "YYYY-MM-DDTHH:mm"
 * @returns {string|null}
 */
export const datetimeLocalToISO = (datetimeLocal) => {
  if (!datetimeLocal) return null
  const [datePart, timePart] = datetimeLocal.split('T')
  if (!datePart || !timePart) return null
  // Append UTC offset so the browser does not shift by its local timezone
  return `${datePart}T${timePart}:00+00:00`
}

// ─── Date-only helpers ────────────────────────────────────────────────────────

/**
 * "YYYY-MM-DD" from a DB ISO timestamp, read in UTC.
 * Used for min/max constraints on datetime-local inputs.
 *
 * @param {string} isoStr  ISO timestamp from the database
 */
export const getDateOnly = (isoStr) => {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  if (isNaN(d.getTime())) return ''
  const year  = d.getUTCFullYear()
  const month = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day   = String(d.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Default segment start time — event date at 01:00.
 * @param {string} eventStartDate  ISO timestamp of the parent event
 */
export const getDefaultStartTime = (eventStartDate) => {
  if (!eventStartDate) return ''
  return `${getDateOnly(eventStartDate)}T01:00`
}

/**
 * Default segment end time — event date at 02:00.
 * @param {string} eventStartDate  ISO timestamp of the parent event
 */
export const getDefaultEndTime = (eventStartDate) => {
  if (!eventStartDate) return ''
  return `${getDateOnly(eventStartDate)}T02:00`
}
