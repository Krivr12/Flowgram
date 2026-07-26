import { useEffect, useState } from 'react'
import { Outlet, Link, useNavigate, useMatches, useLocation } from 'react-router-dom'
import {
  LogOut,
  ChevronDown,
  ChevronRight,
  MonitorSmartphone,
  X,
  Settings,
  LayoutDashboard,
  Zap,
  Users,
  Bell,
  Layers,
} from 'lucide-react'
import { getCurrentUser, getUserProfile, logout } from '../services/supabase'
import { getEventById } from '../services/events'

const NAVBAR_H = 64

// Admin bottom nav items for mobile
const ADMIN_NAV_ITEMS = [
  { label: 'Overview', path: '', icon: LayoutDashboard },
  { label: 'Flow', path: '/flow', icon: Zap },
  { label: 'Speakers', path: '/speakers', icon: Users },
  { label: 'Segments', path: '/segments', icon: Layers },
  { label: 'Notifications', path: '/notifications', icon: Bell },
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
  const navigate = useNavigate()
  const location = useLocation()
  const matches  = useMatches()

  const eventMatch = matches.find((m) => m.params?.eventId)
  const eventId    = eventMatch?.params?.eventId ?? null

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
    if (!eventId) { setEventName(null); return }
    const loadEvent = async () => {
      const result = await getEventById(eventId)
      if (result.success) setEventName(result.data.title)
    }
    loadEvent()
  }, [eventId])

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

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column' }}>

      {/* ══════════════════════════════════════
          DESKTOP TOP HEADER (≥769px)
          CSS class: display:none on mobile, display:flex on desktop
      ══════════════════════════════════════ */}
      <header
        className="admin-layout-desktop-header"
        style={{
          height: `${NAVBAR_H}px`,
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Link
            to="/admin"
            style={{
              fontSize: '15px', fontWeight: '700', color: '#0f172a',
              textDecoration: 'none', letterSpacing: '-0.01em', whiteSpace: 'nowrap',
            }}
          >
            Flowgram
          </Link>
          {eventName && (
            <>
              <ChevronRight size={14} color="#cbd5e1" />
              <span style={{
                fontSize: '13px', fontWeight: '500', color: '#64748b',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '240px',
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
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              backgroundColor: '#2563eb', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: '700', flexShrink: 0,
            }}>
              {getInitials(userProfile?.full_name)}
            </div>
            <span style={{
              fontSize: '14px', fontWeight: '500', color: '#334155',
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
                backgroundColor: '#fff', borderRadius: '12px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.12)', border: '1px solid #e2e8f0',
                zIndex: 50, overflow: 'hidden',
              }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', backgroundColor: '#f8fafc' }}>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a', margin: 0 }}>
                    {userProfile?.full_name || 'Admin'}
                  </p>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {userProfile?.email || ''}
                  </p>
                </div>
                {isAdmin && (
                  <button
                    onClick={handleSwitchToUserView}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '10px 16px', fontSize: '13px', color: '#334155',
                      background: 'transparent', border: 'none', borderBottom: '1px solid #f1f5f9',
                      cursor: 'pointer', textAlign: 'left',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <MonitorSmartphone size={14} color="#64748b" />
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
      </header>

      {/* ══════════════════════════════════════
          MOBILE TOP HEADER (<769px)
          CSS class: display:flex on mobile, display:none on desktop
      ══════════════════════════════════════ */}
      <header
        className="admin-layout-mobile-header"
        style={{
          height: `${NAVBAR_H}px`,
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          flexDirection: 'row',
          alignItems: 'center',
          padding: '0 16px',
        }}
      >
        {/* Avatar button — opens drawer */}
        <button
          onClick={() => setDrawerOpen(true)}
          style={{
            width: '36px', height: '36px', borderRadius: '50%',
            backgroundColor: '#2563eb', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: '#fff', fontSize: '13px',
            fontWeight: '700', border: 'none', cursor: 'pointer', flexShrink: 0,
          }}
          aria-label="Account menu"
        >
          {getInitials(userProfile?.full_name)}
        </button>
      </header>

      {/* ══════════════════════════════════════
          MOBILE SLIDING DRAWER (<769px)
          Backdrop + left-sliding panel with user info and actions
      ══════════════════════════════════════ */}
      <div
        className="admin-layout-mobile-sidebar-backdrop"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 40,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          opacity: drawerOpen ? 1 : 0,
          pointerEvents: drawerOpen ? 'auto' : 'none',
          transition: 'opacity 0.3s ease',
        }}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <aside
        className="admin-layout-mobile-sidebar"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          width: '288px',
          backgroundColor: '#ffffff',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease-in-out',
        }}
        aria-label="Mobile menu"
      >
        {/* Drawer header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px',
          borderBottom: '1px solid #f1f5f9',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              backgroundColor: '#2563eb', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: '#fff', fontSize: '14px',
              fontWeight: '700', flexShrink: 0,
            }}>
              {getInitials(userProfile?.full_name)}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {userProfile?.full_name || 'Admin'}
              </p>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {userProfile?.email || ''}
              </p>
            </div>
          </div>

          {/* Close button — inside the panel */}
          <button
            onClick={() => setDrawerOpen(false)}
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
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f1f5f9'
              e.currentTarget.style.color = '#64748b'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = '#94a3b8'
            }}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer body */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          padding: '16px',
          flex: 1,
        }}>
          {/* Settings link */}
          <button
            onClick={() => {
              setDrawerOpen(false)
              navigate('/admin/settings')
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '13px',
              fontWeight: '500',
              padding: '8px 12px',
              borderRadius: '6px',
              color: '#64748b',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background-color 0.15s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <Settings size={18} />
            Settings
          </button>

          {/* Switch to User View */}
          {isAdmin && (
            <button
              onClick={handleSwitchToUserView}
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
              <MonitorSmartphone size={18} />
              Switch to User View
            </button>
          )}
        </div>

        {/* Drawer footer */}
        <div style={{
          padding: '16px',
          borderTop: '1px solid #f1f5f9',
          flexShrink: 0,
        }}>
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
              padding: '8px 0',
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
          Flex: 1 to fill available space between header and bottom nav
      ══════════════════════════════════════ */}
      <main
        className="admin-layout-page-content"
        style={{
          flex: 1,
          overflowY: 'auto',
          width: '100%',
        }}
      >
        {/* Centered container */}
        <div style={{
          maxWidth: '1100px',
          margin: '0 auto',
          width: '100%',
          padding: '40px 32px',
        }}>
          <Outlet />
        </div>
      </main>

      {/* ══════════════════════════════════════
          MOBILE BOTTOM NAV  (<769px)
          CSS class: flex on mobile, hidden on desktop
          Fixed sticky positioning prevents scrolling out of view
      ══════════════════════════════════════ */}
      <nav
        className="admin-layout-mobile-bottom-nav"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#ffffff',
          borderTop: '1px solid #e5e7eb',
          height: '64px',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-around',
        }}
        aria-label="Admin mobile navigation"
      >
        {/* Mobile nav items with Lucide React icons */}
        {ADMIN_NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const currentPath = location.pathname
          const basePath = eventId ? `/admin/events/${eventId}` : '/admin'
          const itemPath = basePath + item.path
          
          // Check if this nav item is active
          const isItemActive = currentPath === itemPath || (item.path === '' && currentPath === basePath)
          
          return (
            <a
              key={item.label}
              href={itemPath}
              onClick={(e) => {
                e.preventDefault()
                navigate(itemPath)
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
                color: isItemActive ? '#2196F3' : '#4b5563',
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'color 0.2s',
              }}
            >
              <Icon 
                size={20} 
                strokeWidth={isItemActive ? 2.25 : 1.75}
                style={{ color: 'currentColor' }}
              />
              <span>{item.label}</span>
            </a>
          )
        })}
      </nav>

    </div>
  )
}
