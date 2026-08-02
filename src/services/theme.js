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

// ─── Shared dark-mode hook ────────────────────────────────────────────────────
// Reads the `dark` class on <html> and re-renders whenever it changes.
// Use this in any component that needs theme-aware inline styles.

import { useEffect, useState } from 'react'

export const useDarkMode = () => {
  const [isDarkMode, setIsDarkMode] = useState(() =>
    document.documentElement.classList.contains('dark')
  )

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'))
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
    return () => observer.disconnect()
  }, [])

  return isDarkMode
}
