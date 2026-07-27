// ─── Shared theme helpers used by both UserLayout and AdminLayout ─────────────

const STORAGE_KEY = 'flowgram_theme'

/** Read saved preference; default to light. */
export const getSavedTheme = () => localStorage.getItem(STORAGE_KEY) === 'dark'

/** Apply the dark/light class to <html> and persist. */
export const applyTheme = (dark) => {
  if (dark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
  localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light')
}
