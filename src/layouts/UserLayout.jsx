import { useEffect, useRef, useState, useCallback } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  Zap,
  Calendar,
  Bell,
  Users,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  X,
  Settings,
} from 'lucide-react'
import { getCurrentUser, getUserProfile, logout, supabase } from '../services/supabase'
import { getEventById } from '../services/events'
import { Toast } from '../components/Toast'
import { ConnectModal } from '../components/ConnectModal'

const NAVBAR_H = 64
const NOTIFICATION_POLL_INTERVAL = 15000 // 15 seconds

// Nav items for mobile bottom bar — Connect has no route; it opens a modal
// Order: Events | Connect | Flow (center) | Notifications | Settings
const NAV_ITEMS = [
  { label: 'Events',        to: '/app/events',        Icon: Calendar, modal: false },
  { label: 'Connect',       to: null,                 Icon: Users,    modal: true  },
  { label: 'Flow',          to: '/app',               Icon: Zap,      modal: false },
  { label: 'Notifications', to: '/app/notifications', Icon: Bell,     modal: false },
  { label: 'Settings',      to: '/app/account',       Icon: Settings, modal: false },
]

// Desktop center nav items (text only, no icons displayed)
const DESKTOP_NAV = [
  { label: 'Events',        to: '/app/events' },
  { label: 'Connect',       to: null,                 modal: true  },
  { label: 'Flow',          to: '/app' },
  { label: 'Notifications', to: '/app/notifications' },
  { label: 'Settings',      to: '/app/account' },
]

const getInitials = (name) => {
  if (!name) return '?'
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

export const UserLayout = () => {
  const [userProfile, setUserProfile]       = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [dropdownOpen, setDropdownOpen]     = useState(false)
  const [sidebarOpen, setSidebarOpen]       = useState(false)
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [eventTitle, setEventTitle]         = useState(null)
  // ── Notification toast ──────────────────────────────────────────
  const [notifToast, setNotifToast]         = useState(null) // { title, message }
  const dropdownRef                         = useRef(null)
  const notifPollIntervalRef                = useRef(null)
  const lastSeenNotifIdRef                  = useRef(null) // prevents re-showing already-seen notifications
  const navigate                            = useNavigate()
  const location                            = useLocation()

  useEffect(() => {
    const load = async () => {
      const user = await getCurrentUser()
      if (user) {
        const profile = await getUserProfile(user.id)
        setUserProfile(profile)
      }
      setProfileLoading(false)
    }
    load()
  }, [])

  // ── Load event title when selected event changes ─────────────────────────
  useEffect(() => {
    const loadEventTitle = async () => {
      const selectedEventId = localStorage.getItem('selected_event_id')
      if (!selectedEventId) {
        setEventTitle(null)
        return
      }
      
      const result = await getEventById(selectedEventId)
      if (result.success && result.data) {
        setEventTitle(result.data.title)
      } else {
        setEventTitle(null)
      }
    }
    loadEventTitle()
  }, [location.pathname]) // Reload when pathname changes

  // Listen for storage events from other tabs
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'selected_event_id') {
        const loadEventTitle = async () => {
          const selectedEventId = e.newValue
          if (!selectedEventId) {
            setEventTitle(null)
            return
          }
          const result = await getEventById(selectedEventId)
          if (result.success && result.data) {
            setEventTitle(result.data.title)
          } else {
            setEventTitle(null)
          }
        }
        loadEventTitle()
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // ── Server-side filtered polling for notifications ───────────────────────
  // Replaces Realtime WebSocket with HTTP polling every 15 seconds

  const fetchNotifications = useCallback(async () => {
    const selectedEventId = localStorage.getItem('selected_event_id')
    if (!selectedEventId) return

    try {
      // Fetch latest notifications for the selected event
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('event_id', selectedEventId)
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) {
        console.error('Error polling notifications:', error)
        return
      }

      if (data && data.length > 0) {
        const latestNotif = data[0]

        // Only show toast if this is a notification we haven't seen yet
        if (latestNotif.id !== lastSeenNotifIdRef.current) {
          // On the very first poll, just record the id silently — don't toast stale data
          if (lastSeenNotifIdRef.current !== null) {
            setNotifToast({
              title: latestNotif.title || 'New Announcement',
              message: latestNotif.message || '',
            })
          }
          lastSeenNotifIdRef.current = latestNotif.id
        }
      }
    } catch (err) {
      console.error('Exception polling notifications:', err)
    }
  }, [])

  const setupNotificationPolling = useCallback(() => {
    // Clear any existing interval
    if (notifPollIntervalRef.current) {
      clearInterval(notifPollIntervalRef.current)
    }

    // Reset seen-id so the first poll of a new event silently seeds the ref
    lastSeenNotifIdRef.current = null

    // Fetch immediately on mount
    fetchNotifications()

    // Then set up polling
    notifPollIntervalRef.current = setInterval(fetchNotifications, NOTIFICATION_POLL_INTERVAL)
  }, [fetchNotifications])

  // Subscribe on mount
  useEffect(() => {
    setupNotificationPolling()
    return () => {
      if (notifPollIntervalRef.current) {
        clearInterval(notifPollIntervalRef.current)
      }
    }
  }, [setupNotificationPolling])

  // Re-setup polling when the user navigates (covers switching events on /app/events)
  useEffect(() => {
    setupNotificationPolling()
  }, [location.pathname, setupNotificationPolling])

  // Setup polling when localStorage changes from another tab
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'selected_event_id') setupNotificationPolling()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [setupNotificationPolling])
  // ────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [sidebarOpen])

  const handleLogout = async () => {
    setDropdownOpen(false)
    setSidebarOpen(false)
    await logout()
    navigate('/', { replace: true })
  }

  const handleSwitchToAdmin = () => {
    setSidebarOpen(false)
    navigate('/admin', { replace: true })
  }

  const isAdmin = userProfile?.role === 'ADMIN'

  if (profileLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#fff' }}>
        <p style={{ color: '#cbd5e1', fontSize: '14px' }}>Loading…</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column' }}>

      {/* ── Realtime Notification Toast ── */}
      {notifToast && (
        <Toast
          type="notification"
          title={notifToast.title}
          message={notifToast.message}
          onClose={() => setNotifToast(null)}
          duration={6000}
        />
      )}

      {/* ── Connect Modal ── */}
      {showConnectModal && (
        <ConnectModal onClose={() => setShowConnectModal(false)} />
      )}

      {/* ── TOP NAVBAR (matching AdminLayout structure) ── */}
      <header style={{
        height: `${NAVBAR_H}px`,
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        flexShrink: 0,
      }}>
        <div style={{
          maxWidth: '100%',
          padding: '0 24px',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>

          {/* LEFT: Logo + Mobile Avatar Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Mobile avatar button — opens sidebar (shows only <768px) */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="user-layout-mobile-avatar"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#2563eb',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '12px',
                fontWeight: '700',
                flexShrink: 0,
                border: 'none',
                cursor: 'pointer',
                outline: 'none',
              }}
              aria-label="Open menu"
            >
              {getInitials(userProfile?.full_name)}
            </button>

            {/* Desktop logo + name (shows only ≥768px) */}
            <span
              className="user-layout-desktop-logo"
              style={{
                fontSize: '16px',
                fontWeight: '700',
                color: '#0f172a',
                letterSpacing: '-0.01em',
                whiteSpace: 'nowrap',
              }}
            >
              Flowgram
            </span>

            {/* Event Title — appears after logo/avatar */}
            {eventTitle && (
              <>
                <span style={{ color: '#cbd5e1', fontSize: '20px', lineHeight: 1, userSelect: 'none' }}>
                  •
                </span>
                <span style={{
                  fontSize: '15px',
                  fontWeight: '600',
                  color: '#475569',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '340px',
                }}>
                  {eventTitle}
                </span>
              </>
            )}
          </div>

          {/* CENTER: Desktop nav links (shows only ≥768px) */}
          <nav
            className="user-layout-desktop-nav"
            style={{
              gap: '32px',
              alignItems: 'center',
            }}
          >
            {DESKTOP_NAV.map(({ label, to, modal }) => {
              const isActive = !modal && (location.pathname === to || (to === '/app' && location.pathname === '/app'))
              
              if (modal) {
                // Connect — opens modal, never navigates
                return (
                  <button
                    key={label}
                    onClick={() => setShowConnectModal(true)}
                    style={{
                      fontSize: '13px',
                      fontWeight: '500',
                      color: '#64748b',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'color 0.15s',
                      padding: 0,
                    }}
                    onMouseEnter={(e) => (e.target.style.color = '#475569')}
                    onMouseLeave={(e) => (e.target.style.color = '#64748b')}
                  >
                    {label}
                  </button>
                )
              }

              return (
                <a
                  key={label}
                  href={to}
                  style={{
                    fontSize: '13px',
                    fontWeight: '500',
                    color: isActive ? '#2563eb' : '#64748b',
                    textDecoration: 'none',
                    cursor: 'pointer',
                    transition: 'color 0.15s',
                  }}
                  onClick={(e) => {
                    e.preventDefault()
                    navigate(to)
                  }}
                  onMouseEnter={(e) => !isActive && (e.target.style.color = '#475569')}
                  onMouseLeave={(e) => !isActive && (e.target.style.color = '#64748b')}
                >
                  {label}
                </a>
              )
            })}
          </nav>

          {/* RIGHT: Profile dropdown (shows only ≥768px) */}
          <div className="user-layout-desktop-profile" style={{ position: 'relative' }} ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '6px 12px 6px 6px',
                borderRadius: '8px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '12px',
                fontWeight: '700',
                flexShrink: 0,
              }}>
                {getInitials(userProfile?.full_name)}
              </div>
              <span style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#334155',
                maxWidth: '160px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {userProfile?.full_name || 'User'}
              </span>
              <ChevronDown
                size={14}
                color="#94a3b8"
                style={{
                  transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.15s',
                }}
              />
            </button>

            {/* Dropdown panel */}
            {dropdownOpen && (
              <>
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                  onClick={() => setDropdownOpen(false)}
                />
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 8px)',
                  width: '240px',
                  backgroundColor: '#fff',
                  borderRadius: '12px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
                  border: '1px solid #e2e8f0',
                  zIndex: 50,
                  overflow: 'hidden',
                }}>

                  {/* Profile header */}
                  <div style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #f1f5f9',
                    backgroundColor: '#f8fafc',
                  }}>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a', margin: 0 }}>
                      {userProfile?.full_name || 'User'}
                    </p>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {userProfile?.email || ''}
                    </p>
                  </div>

                  {/* Return to Admin View — ADMIN only */}
                  {isAdmin && (
                    <button
                      onClick={handleSwitchToAdmin}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 16px',
                        fontSize: '13px',
                        color: '#334155',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: '1px solid #f1f5f9',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <LayoutDashboard size={14} color="#64748b" />
                      Return to Admin Dashboard
                    </button>
                  )}

                  {/* Sign Out */}
                  <button
                    onClick={handleLogout}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 16px',
                      fontSize: '13px',
                      color: '#dc2626',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <LogOut size={14} />
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>


      {/* ── MOBILE SIDEBAR ── */}
      <div
        className="user-layout-mobile-sidebar-backdrop"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 40,
          backgroundColor: 'rgba(0,0,0,0.4)',
          opacity: sidebarOpen ? 1 : 0,
          pointerEvents: sidebarOpen ? 'auto' : 'none',
          transition: 'opacity 0.3s ease',
        }}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      <aside
        className="user-layout-mobile-sidebar"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 50,
          height: '100%',
          width: '288px',
          backgroundColor: '#fff',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease-in-out',
        }}
        aria-label="Mobile menu"
      >
        {/* Sidebar header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderBottom: '1px solid #f3f4f6' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '14px',
            fontWeight: '700',
            flexShrink: 0,
          }}>
            {getInitials(userProfile?.full_name)}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {userProfile?.full_name || 'User'}
            </p>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {userProfile?.email || ''}
            </p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            style={{
              padding: '6px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.color = '#64748b' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#94a3b8' }}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Sidebar nav links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px' }}>
          <NavLink
            to="/app/account"
            onClick={() => setSidebarOpen(false)}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '13px',
              fontWeight: '500',
              padding: '8px 12px',
              borderRadius: '6px',
              color: isActive ? '#2563eb' : '#64748b',
              backgroundColor: isActive ? '#dbeafe' : 'transparent',
              textDecoration: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s',
            })}
          >
            <Settings size={18} />
            Settings
          </NavLink>

          {/* Switch to Admin View — ADMIN only */}
          {isAdmin && (
            <button
              onClick={handleSwitchToAdmin}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '13px',
                fontWeight: '500',
                padding: '8px 12px',
                borderRadius: '6px',
                color: '#2563eb',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background-color 0.15s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <LayoutDashboard size={18} />
              Switch to Admin View
            </button>
          )}
        </div>

        {/* Sidebar footer */}
        <div style={{ marginTop: 'auto', padding: '16px', borderTop: '1px solid #f3f4f6' }}>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              color: '#dc2626',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#b91c1c'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#dc2626'}
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>


      {/* ── PAGE CONTENT ── */}
      <main style={{ flex: 1, overflowY: 'auto', maxWidth: '1152px', margin: '0 auto', width: '100%', padding: '40px 32px 6rem' }} className="user-layout-page-content">
        <Outlet />
      </main>


      {/* ── MOBILE BOTTOM NAV ── */}
      {location.pathname !== '/app/events' && (
        <nav
          className="user-layout-mobile-bottom-nav"
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: '#fff',
            borderTop: '1px solid #e5e7eb',
            justifyContent: 'space-around',
            height: '64px',
          }}
          aria-label="Mobile bottom navigation"
        >
          {NAV_ITEMS.map(({ label, to, Icon, modal }) => {
            const isActive = !modal && (location.pathname === to || (to === '/app' && location.pathname === '/app'))

            if (modal) {
              // Connect — opens modal, never navigates
              return (
                <button
                  key={label}
                  onClick={() => setShowConnectModal(true)}
                  style={{
                    flex: 1,
                    padding: '8px 0',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '2px',
                    textAlign: 'center',
                    fontSize: '11px',
                    fontWeight: '500',
                    color: '#4b5563',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#2196F3')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#4b5563')}
                >
                  <Icon size={20} strokeWidth={1.75} />
                  <span>{label}</span>
                </button>
              )
            }

            return (
              <a
                key={label}
                href={to}
                onClick={(e) => {
                  e.preventDefault()
                  navigate(to)
                }}
                style={{
                  flex: 1,
                  padding: '8px 0',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '2px',
                  textAlign: 'center',
                  fontSize: '11px',
                  fontWeight: '500',
                  color: isActive ? '#2196F3' : '#4b5563',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <Icon size={20} strokeWidth={isActive ? 2.25 : 1.75} />
                <span>{label}</span>
              </a>
            )
          })}
        </nav>
      )}

    </div>
  )
}
