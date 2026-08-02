import { useEffect, useRef, useState, useCallback } from 'react'
import { Outlet, Link, useNavigate, useMatches, useLocation } from 'react-router-dom'
import {
  LogOut,
  ChevronDown,
  MonitorSmartphone,
  X,
  Settings,
  Calendar,
  Zap,
  Users,
  Bell,
  Layers,
  Sun,
  Moon,
} from 'lucide-react'
import { getCurrentUser, getUserProfile, logout } from '../services/supabase'
import { supabase } from '../services/supabase'
import { getEventById } from '../services/events'

const NAVBAR_H = 64

// Admin bottom nav items for mobile
const ADMIN_NAV_ITEMS = [
  { label: 'Events',         path: null,              icon: Calendar },
  { label: 'Flow',           path: '/flow',           icon: Zap },
  { label: 'Speakers',       path: '/speakers',       icon: Users },
  { label: 'Segments',       path: '/segments',       icon: Layers },
  { label: 'Notifications',  path: '/notifications',  icon: Bell },
]

const getInitials = (name) => {
  if (!name) return 'A'
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

export const AdminLayout = () => {
  const [userProfile, setUserProfile]   = useState(null)
  const [eventName, setEventName]       = useState(null)
  const [drawerOpen, setDrawerOpen]     = useState(false)
  const [desktopDropdownOpen, setDesktopDropdownOpen] = useState(false)
  const [hasNewNotif, setHasNewNotif]   = useState(false)
  const notifPollRef                    = useRef(null)
  const lastNotifIdRef                  = useRef(null)
  const [isDarkMode, setIsDarkMode]     = useState(() => {
    const saved = localStorage.getItem('admin_dark_mode')
    return saved ? JSON.parse(saved) : false
  })
  const navigate = useNavigate()
  const location = useLocation()
  const matches  = useMatches()

  const eventMatch = matches.find((m) => m.params?.eventId)
  const eventId    = eventMatch?.params?.eventId ?? null

  // Apply / remove `dark` class on <html> so all dark: utilities work globally
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('admin_dark_mode', JSON.stringify(isDarkMode))
  }, [isDarkMode])

  // Remove dark class when leaving admin layout
  useEffect(() => {
    return () => {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev)

  useEffect(() => {
    const loadUser = async () => {
      const user = await getCurrentUser()
      if (user) {
        const profile = await getUserProfile(user.id)
        setUserProfile(profile)
      }
    }
    loadUser()
  }, [])

  useEffect(() => {
    if (!eventId) {
      const storedId = localStorage.getItem('selected_event_id')
      if (!storedId) { setEventName(null); return }
      const loadStored = async () => {
        const result = await getEventById(storedId)
        if (result.success) setEventName(result.data.title)
        else setEventName(null)
      }
      loadStored()
      return
    }
    const loadEvent = async () => {
      const result = await getEventById(eventId)
      if (result.success) setEventName(result.data.title)
    }
    loadEvent()
  }, [eventId, location.pathname])

  // ── Notification polling for red dot ──────────────────────────────────────
  const pollNotifications = useCallback(async () => {
    const eid = eventId
    if (!eid) return
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('id')
        .eq('event_id', eid)
        .order('created_at', { ascending: false })
        .limit(1)
      if (error || !data || data.length === 0) return
      const latestId = data[0].id
      if (lastNotifIdRef.current === null) {
        lastNotifIdRef.current = latestId
      } else if (latestId !== lastNotifIdRef.current) {
        setHasNewNotif(true)
        lastNotifIdRef.current = latestId
      }
    } catch {}
  }, [eventId])

  useEffect(() => {
    if (!eventId) return
    lastNotifIdRef.current = null
    setHasNewNotif(false)
    pollNotifications()
    notifPollRef.current = setInterval(pollNotifications, 15000)
    return () => { if (notifPollRef.current) clearInterval(notifPollRef.current) }
  }, [eventId, pollNotifications])

  // Clear red dot when visiting notifications page
  useEffect(() => {
    if (location.pathname.endsWith('/notifications')) {
      setHasNewNotif(false)
    }
  }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  const handleLogout = async () => {
    setDrawerOpen(false)
    setDesktopDropdownOpen(false)
    await logout()
    navigate('/', { replace: true })
  }

  const handleSwitchToUserView = () => {
    setDrawerOpen(false)
    setDesktopDropdownOpen(false)
    navigate('/app', { replace: true })
  }

  const isAdmin = userProfile?.role === 'ADMIN'

  // Colour tokens — derived from isDarkMode so inline styles stay consistent
  const bg       = isDarkMode ? '#1a222d' : '#f8fafc'
  const cardBg   = isDarkMode ? '#252F3E' : '#ffffff'
  const border   = isDarkMode ? 'rgba(100,116,139,0.3)' : '#e2e8f0'
  const textMain = isDarkMode ? '#e2e8f0' : '#334155'
  const textSub  = isDarkMode ? '#94a3b8' : '#64748b'
  const hoverBg  = isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'
  const hoverBgStrong = isDarkMode ? '#2d3748' : '#f8fafc'

  return (
    <div
      className="min-h-screen flex flex-col transition-colors duration-200"
      style={{ backgroundColor: bg }}
    >
      {/* ══════════════════════════════════════
          DESKTOP TOP HEADER (≥769px)
      ══════════════════════════════════════ */}
      <header
        className="admin-layout-desktop-header"
        style={{
          height: `${NAVBAR_H}px`,
          backgroundColor: bg,
          borderBottom: 'none',
          boxShadow: 'none',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          flexShrink: 0,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
        }}
      >
        {/* Left: Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link
            to="/admin"
            style={{
              fontSize: '15px', fontWeight: '700', color: isDarkMode ? '#fff' : '#0f172a',
              textDecoration: 'none', letterSpacing: '-0.01em', whiteSpace: 'nowrap',
            }}
          >
            Flowgram
          </Link>
          {eventName && location.pathname !== '/admin' && (
            <>
              <span style={{ color: '#9ca3af', fontSize: '20px', lineHeight: 1, userSelect: 'none' }}>•</span>
              <span style={{
                fontSize: '14px', fontWeight: '600', color: textSub,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '280px',
              }}>
                {eventName}
              </span>
            </>
          )}
        </div>

        {/* Right: User dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setDesktopDropdownOpen(!desktopDropdownOpen)}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '6px 12px 6px 6px', borderRadius: '8px',
              border: 'none', background: 'transparent', cursor: 'pointer',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hoverBg}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              backgroundColor: '#1B77CF', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: '700', flexShrink: 0,
            }}>
              {getInitials(userProfile?.full_name)}
            </div>
            <span style={{
              fontSize: '14px', fontWeight: '500', color: textMain,
              maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {userProfile?.full_name || 'Admin'}
            </span>
            <ChevronDown
              size={14} color="#94a3b8"
              style={{ transform: desktopDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}
            />
          </button>

          {desktopDropdownOpen && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setDesktopDropdownOpen(false)} />
              <div style={{
                position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: '240px',
                backgroundColor: cardBg, borderRadius: '12px',
                boxShadow: isDarkMode ? '0 10px 40px rgba(0,0,0,0.4)' : '0 10px 40px rgba(0,0,0,0.12)',
                border: `1px solid ${border}`,
                zIndex: 50, overflow: 'hidden',
              }}>
                {/* User info header */}
                <div style={{
                  padding: '12px 16px',
                  borderBottom: `1px solid ${border}`,
                  backgroundColor: isDarkMode ? '#1e2a38' : '#f8fafc',
                }}>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: isDarkMode ? '#e2e8f0' : '#0f172a', margin: 0 }}>
                    {userProfile?.full_name || 'Admin'}
                  </p>
                  <p style={{ fontSize: '12px', color: textSub, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {userProfile?.email || ''}
                  </p>
                </div>

                {/* Settings */}
                <button
                  onClick={() => { setDesktopDropdownOpen(false); navigate('/admin/account') }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '10px 16px', fontSize: '13px', color: isDarkMode ? '#cbd5e1' : '#334155',
                    background: 'transparent', border: 'none', borderBottom: `1px solid ${border}`,
                    cursor: 'pointer', textAlign: 'left',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hoverBgStrong}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Settings size={14} color={textSub} />
                  Settings
                </button>

                {/* Theme Toggle */}
                <button
                  onClick={toggleDarkMode}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '10px 16px', fontSize: '13px', color: isDarkMode ? '#cbd5e1' : '#334155',
                    background: 'transparent', border: 'none', borderBottom: `1px solid ${border}`,
                    cursor: 'pointer', textAlign: 'left',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hoverBgStrong}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  {isDarkMode ? <Sun size={14} color="#fbbf24" /> : <Moon size={14} color={textSub} />}
                  {isDarkMode ? 'Switch to Light' : 'Switch to Dark'}
                </button>

                {isAdmin && (
                  <button
                    onClick={handleSwitchToUserView}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '10px 16px', fontSize: '13px', color: isDarkMode ? '#cbd5e1' : '#334155',
                      background: 'transparent', border: 'none', borderBottom: `1px solid ${border}`,
                      cursor: 'pointer', textAlign: 'left',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hoverBgStrong}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <MonitorSmartphone size={14} color={textSub} />
                    Switch to User View
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '10px 16px', fontSize: '13px', color: '#dc2626',
                    background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(220,38,38,0.1)' : '#fef2f2'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <LogOut size={14} />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* ══════════════════════════════════════
          MOBILE TOP HEADER (<769px)
      ══════════════════════════════════════ */}
      <header
        className="admin-layout-mobile-header"
        style={{
          height: `${NAVBAR_H}px`,
          backgroundColor: bg,
          borderBottom: 'none',
          boxShadow: 'none',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          flexDirection: 'row',
          alignItems: 'center',
          padding: '0 16px',
          gap: '10px',
        }}
      >
        <button
          onClick={() => setDrawerOpen(true)}
          style={{
            width: '36px', height: '36px', borderRadius: '50%',
            backgroundColor: '#1B77CF', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: '#fff', fontSize: '13px',
            fontWeight: '700', border: 'none', cursor: 'pointer', flexShrink: 0,
          }}
          aria-label="Account menu"
        >
          {getInitials(userProfile?.full_name)}
        </button>

        {eventName && location.pathname !== '/admin' && (
          <>
            <span style={{ color: '#9ca3af', fontSize: '18px', lineHeight: 1, userSelect: 'none' }}>•</span>
            <span style={{
              fontSize: '13px', fontWeight: '600', color: textSub,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              maxWidth: 'calc(100vw - 120px)',
            }}>
              {eventName}
            </span>
          </>
        )}
      </header>

      {/* ══════════════════════════════════════
          MOBILE BACKDROP
      ══════════════════════════════════════ */}
      <div
        className="admin-layout-mobile-sidebar-backdrop"
        style={{
          position: 'fixed', inset: 0, zIndex: 60,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          opacity: drawerOpen ? 1 : 0,
          pointerEvents: drawerOpen ? 'auto' : 'none',
          transition: 'opacity 0.3s ease',
        }}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />

      {/* ══════════════════════════════════════
          MOBILE DRAWER
      ══════════════════════════════════════ */}
      <aside
        className="admin-layout-mobile-sidebar"
        style={{
          position: 'fixed', top: 0, left: 0, height: '100vh', width: '288px',
          backgroundColor: cardBg, zIndex: 60, display: 'flex', flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
          transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease-in-out',
        }}
        aria-label="Mobile menu"
      >
        {/* Drawer header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px', borderBottom: `1px solid ${border}`, flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#1B77CF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: '14px', fontWeight: '700', flexShrink: 0,
            }}>
              {getInitials(userProfile?.full_name)}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{
                fontSize: '14px', fontWeight: '600', color: isDarkMode ? '#e2e8f0' : '#0f172a',
                margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {userProfile?.full_name || 'Admin'}
              </p>
              <p style={{
                fontSize: '12px', color: textSub, margin: '2px 0 0 0',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {userProfile?.email || ''}
              </p>
            </div>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            style={{
              padding: '6px', borderRadius: '6px', border: 'none',
              backgroundColor: 'transparent', cursor: 'pointer', color: '#94a3b8',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = hoverBgStrong; e.currentTarget.style.color = textSub }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#94a3b8' }}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer body */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '12px', flex: 1 }}>
          <button
            onClick={() => { setDrawerOpen(false); navigate('/admin/account') }}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', fontWeight: '500',
              padding: '10px 12px', borderRadius: '8px', color: isDarkMode ? '#cbd5e1' : '#64748b',
              backgroundColor: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hoverBgStrong}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <Settings size={18} color={textSub} />
            Settings
          </button>

          <button
            onClick={toggleDarkMode}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', fontWeight: '500',
              padding: '10px 12px', borderRadius: '8px', color: isDarkMode ? '#fbbf24' : '#64748b',
              backgroundColor: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hoverBgStrong}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            {isDarkMode ? <Sun size={18} color="#fbbf24" /> : <Moon size={18} color={textSub} />}
            {isDarkMode ? 'Switch to Light' : 'Switch to Dark'}
          </button>

          {isAdmin && (
            <button
              onClick={handleSwitchToUserView}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', fontWeight: '500',
                padding: '10px 12px', borderRadius: '8px', color: isDarkMode ? '#42b4ff' : '#1B77CF',
                backgroundColor: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hoverBgStrong}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <MonitorSmartphone size={18} />
              Switch to User View
            </button>
          )}
        </div>

        {/* Drawer footer */}
        <div style={{ padding: '16px', borderTop: `1px solid ${border}`, flexShrink: 0 }}>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500',
              color: '#dc2626', background: 'transparent', border: 'none', cursor: 'pointer',
              textAlign: 'left', width: '100%',
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#b91c1c'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#dc2626'}
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* ══════════════════════════════════════
          PAGE CONTENT
      ══════════════════════════════════════ */}
      <main
        className="admin-layout-page-content"
        style={{ flex: 1, overflowY: 'auto', width: '100%' }}
      >
        <div style={{ maxWidth: '1100px', margin: '0 auto', width: '100%', padding: '40px 32px' }}>
          <Outlet />
        </div>
      </main>

      {/* ══════════════════════════════════════
          MOBILE BOTTOM NAV (<769px)
      ══════════════════════════════════════ */}
      {location.pathname !== '/admin' && location.pathname !== '/admin/account' && (
        <nav
          className="admin-layout-mobile-bottom-nav"
          style={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            backgroundColor: cardBg,
            borderTop: `1px solid ${border}`,
            height: '64px', zIndex: 50,
            display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly',
          }}
          aria-label="Admin mobile navigation"
        >
          {ADMIN_NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const currentPath = location.pathname
            const basePath = eventId ? `/admin/events/${eventId}` : '/admin'
            const itemPath = item.path === null ? '/admin' : basePath + item.path
            const isItemActive = item.path === null
              ? currentPath === '/admin'
              : currentPath === itemPath || (item.path === '' && currentPath === basePath)

            return (
              <a
                key={item.label}
                href={itemPath}
                onClick={(e) => { e.preventDefault(); navigate(itemPath) }}
                style={{
                  padding: '8px 0', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: '2px',
                  textAlign: 'center', fontSize: '10px', fontWeight: '500',
                  color: isItemActive ? '#1B77CF' : (isDarkMode ? '#94a3b8' : '#4b5563'),
                  textDecoration: 'none', cursor: 'pointer', transition: 'color 0.2s',
                  width: '60px',
                }}
              >
                <div style={{ position: 'relative', display: 'inline-flex' }}>
                  <Icon size={20} strokeWidth={isItemActive ? 2.25 : 1.75} style={{ color: 'currentColor' }} />
                  {item.label === 'Notifications' && hasNewNotif && (
                    <span style={{
                      position: 'absolute', top: '-2px', right: '-2px',
                      width: '8px', height: '8px', borderRadius: '50%',
                      backgroundColor: '#ef4444',
                      border: `2px solid ${isDarkMode ? '#252F3E' : '#fff'}`,
                    }} />
                  )}
                </div>
                <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>
              </a>
            )
          })}
        </nav>
      )}
    </div>
  )
}
