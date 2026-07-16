import { useEffect, useState } from 'react'
import { Outlet, Link, useNavigate, useMatches } from 'react-router-dom'
import { LogOut, ChevronDown, ChevronRight, MonitorSmartphone } from 'lucide-react'
import { getCurrentUser, getUserProfile, logout } from '../services/supabase'
import { getEventById } from '../services/events'

const NAVBAR_H = 64

export const AdminLayout = () => {
  const [userProfile, setUserProfile] = useState(null)
  const [eventName, setEventName] = useState(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const navigate = useNavigate()
  const matches = useMatches()

  const eventMatch = matches.find((m) => m.params?.eventId)
  const eventId = eventMatch?.params?.eventId || null

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
      setEventName(null)
      return
    }
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

  const getInitials = (name) => {
    if (!name) return 'A'
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const isAdmin = userProfile?.role === 'ADMIN'

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column' }}>

      {/* ── Global Top Navbar ── */}
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

          {/* ── Left: Logo + optional event breadcrumb ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Link
              to="/admin"
              style={{
                fontSize: '16px',
                fontWeight: '700',
                color: '#0f172a',
                textDecoration: 'none',
                letterSpacing: '-0.01em',
                whiteSpace: 'nowrap',
              }}
            >
              Flowgram
            </Link>

            {eventName && (
              <>
                <ChevronRight size={14} color="#cbd5e1" />
                <span style={{
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#64748b',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '240px',
                }}>
                  {eventName}
                </span>
              </>
            )}
          </div>

          {/* ── Right: User Menu ── */}
          <div style={{ position: 'relative' }}>
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
                {userProfile?.full_name || 'Admin'}
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

            {/* Dropdown */}
            {dropdownOpen && (
              <>
                {/* Backdrop */}
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
                      {userProfile?.full_name || 'Admin'}
                    </p>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {userProfile?.email || ''}
                    </p>
                  </div>

                  {/* Switch to User View — only for admins */}
                  {isAdmin && (
                    <button
                      onClick={handleSwitchToUserView}
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
                      <MonitorSmartphone size={14} color="#64748b" />
                      Switch to User View
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

      {/* ── Page Content ── */}
      <main style={{ flex: 1, minHeight: 0 }}>
        <Outlet />
      </main>
    </div>
  )
}
