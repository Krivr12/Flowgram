import { useEffect, useState } from 'react'
import { Outlet, Link, useNavigate, useMatches, useLocation } from 'react-router-dom'
import {
  LogOut,
  ChevronDown,
  ChevronRight,
  MonitorSmartphone,
  LayoutDashboard,
  Zap,
  Users,
  Layers,
  Bell,
} from 'lucide-react'
import { getCurrentUser, getUserProfile, logout } from '../services/supabase'
import { getEventById } from '../services/events'

const NAVBAR_H = 64
const SIDEBAR_W = 256

// Shared nav items — desktop sidebar and mobile bottom bar
const ADMIN_NAV_ITEMS = [
  { label: 'Overview',      Icon: LayoutDashboard, path: ''              },
  { label: 'Flow',          Icon: Zap,             path: 'flow'          },
  { label: 'Speakers',      Icon: Users,           path: 'speakers'      },
  { label: 'Segments',      Icon: Layers,          path: 'segments'      },
  { label: 'Notifications', Icon: Bell,            path: 'notifications' },
]

const getInitials = (name) => {
  if (!name) return 'A'
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

export const AdminLayout = () => {
  const [userProfile, setUserProfile]   = useState(null)
  const [eventName, setEventName]       = useState(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const navigate = useNavigate()
  const matches  = useMatches()
  const location = useLocation()

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

  const handleLogout = async () => {
    setDropdownOpen(false)
    await logout()
    navigate('/', { replace: true })
  }

  const handleSwitchToUserView = () => {
    setDropdownOpen(false)
    navigate('/app', { replace: true })
  }

  const isAdmin = userProfile?.role === 'ADMIN'

  // Nav href — scoped to event workspace when eventId is present
  const getItemHref = (path) =>
    eventId
      ? `/admin/events/${eventId}${path ? `/${path}` : ''}`
      : '/admin'

  const isItemActive = (path) => location.pathname === getItemHref(path)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex' }}>

      {/* ══════════════════════════════════════
          DESKTOP SIDEBAR  (≥769px)
          CSS class controls display: none on mobile
      ══════════════════════════════════════ */}
      <aside
        className="admin-layout-sidebar"
        style={{
          width: `${SIDEBAR_W}px`,
          backgroundColor: '#ffffff',
          borderRight: '1px solid #e2e8f0',
          flexDirection: 'column',  /* only applies when display:flex is active */
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 30,
          overflowY: 'auto',
          flexShrink: 0,
        }}
      >
        {/* Logo */}
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
          <Link
            to="/admin"
            style={{
              fontSize: '18px', fontWeight: '700', color: '#0f172a',
              textDecoration: 'none', letterSpacing: '-0.01em', display: 'block',
            }}
          >
            Flowgram
          </Link>
          {eventName && (
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {eventName}
            </p>
          )}
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', padding: '12px' }}>
          {ADMIN_NAV_ITEMS.map(({ label, Icon, path }) => {
            const active = isItemActive(path)
            return (
              <Link
                key={label}
                to={getItemHref(path)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '10px 12px', borderRadius: '8px',
                  fontSize: '14px', fontWeight: '500',
                  color: active ? '#2563eb' : '#64748b',
                  backgroundColor: active ? '#dbeafe' : 'transparent',
                  textDecoration: 'none', transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.backgroundColor = '#f1f5f9' }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.backgroundColor = active ? '#dbeafe' : 'transparent' }}
              >
                <Icon size={18} />
                <span>{label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Sidebar footer */}
        <div style={{ padding: '12px', borderTop: '1px solid #e2e8f0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', marginBottom: '4px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              backgroundColor: '#2563eb', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: '#fff', fontSize: '11px', fontWeight: '700', flexShrink: 0,
            }}>
              {getInitials(userProfile?.full_name)}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {userProfile?.full_name || 'Admin'}
              </p>
              <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {userProfile?.email || ''}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 12px', fontSize: '13px', color: '#dc2626',
              backgroundColor: 'transparent', border: 'none', borderRadius: '8px',
              cursor: 'pointer', textAlign: 'left', transition: 'background-color 0.15s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* ══════════════════════════════════════
          RIGHT COLUMN — headers + content
      ══════════════════════════════════════ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: '100vh' }}>

        {/* ── DESKTOP TOP HEADER (≥769px) ── */}
        {/* CSS class sets display:flex on desktop, display:none on mobile */}
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
            /* flexDirection, alignItems, justifyContent work because
               display:flex comes from the CSS class, not inline style */
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 32px',
          }}
        >
          {/* Breadcrumb */}
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

          {/* User dropdown trigger */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
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
                style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}
              />
            </button>

            {dropdownOpen && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setDropdownOpen(false)} />
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

        {/* ── MOBILE TOP HEADER (<769px) ── */}
        {/* Avatar only, fixed to top. CSS class: display:none by default, display:flex at ≤768px */}
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
          {/* Blue avatar circle — only visible element in mobile header */}
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
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

          {/* Dropdown — drops below the avatar */}
          {dropdownOpen && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setDropdownOpen(false)} />
              <div style={{
                position: 'fixed', left: '16px', top: `calc(${NAVBAR_H}px + 8px)`,
                width: '220px', backgroundColor: '#fff', borderRadius: '12px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.12)', border: '1px solid #e2e8f0',
                zIndex: 51, overflow: 'hidden',
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
        </header>

        {/* ── PAGE CONTENT ── */}
        {/* admin-layout-page-content adds pt/pb on mobile, strips them on desktop */}
        <main
          className="admin-layout-page-content"
          style={{
            flex: 1,
            maxWidth: '1152px',
            margin: '0 auto',
            width: '100%',
            padding: '40px 32px',
          }}
        >
          <Outlet />
        </main>

      </div>{/* end right column */}

      {/* ══════════════════════════════════════
          MOBILE BOTTOM NAV  (<769px)
          CSS class: display:none by default, display:flex at ≤768px
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
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-around',
        }}
        aria-label="Admin mobile navigation"
      >
        {ADMIN_NAV_ITEMS.map(({ label, Icon, path }) => {
          const active = isItemActive(path)
          return (
            <a
              key={label}
              href={getItemHref(path)}
              onClick={(e) => { e.preventDefault(); navigate(getItemHref(path)) }}
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
                color: active ? '#2196F3' : '#4b5563',
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'color 0.2s',
              }}
            >
              <Icon size={20} strokeWidth={active ? 2.25 : 1.75} />
              <span>{label}</span>
            </a>
          )
        })}
      </nav>

    </div>
  )
}
