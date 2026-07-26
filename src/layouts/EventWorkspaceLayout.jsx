import { useEffect, useState } from 'react'
import { Outlet, useParams, useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, Zap, Mic2, Layers, Bell } from 'lucide-react'

const COLLAPSED_W = 64
const EXPANDED_W = 220
const NAVBAR_H = 64
const MOBILE_BREAKPOINT = 768

const NAV_ITEMS = [
  { label: 'Overview',      icon: LayoutDashboard, path: ''            },
  { label: 'Flow',          icon: Zap,             path: '/flow'       },
  { label: 'Speakers',      icon: Mic2,            path: '/speakers'   },
  { label: 'Segments',      icon: Layers,          path: '/segments'   },
  { label: 'Notifications', icon: Bell,            path: '/notifications' },
]

export const EventWorkspaceLayout = () => {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= MOBILE_BREAKPOINT)

  const basePath = `/admin/events/${eventId}`

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isActive = (itemPath) => {
    const fullPath = basePath + itemPath
    if (itemPath === '') {
      return location.pathname === fullPath || location.pathname === fullPath + '/'
    }
    return location.pathname.startsWith(fullPath)
  }

  // On mobile, sidebar width is always 0 (hidden via CSS)
  // On desktop, sidebar width toggles between collapsed and expanded
  const sidebarW = isMobile ? 0 : (sidebarExpanded ? EXPANDED_W : COLLAPSED_W)

  return (
    <>
      {/* ── Sidebar (hidden on mobile via .workspace-sidebar CSS class) ── */}
      <div
        className="workspace-sidebar"
        onMouseEnter={() => !isMobile && setSidebarExpanded(true)}
        onMouseLeave={() => !isMobile && setSidebarExpanded(false)}
        style={{
          position: 'fixed',
          left: 0,
          top: `${NAVBAR_H}px`,
          bottom: 0,
          width: `${sidebarW}px`,
          backgroundColor: '#ffffff',
          borderRight: '1px solid #e2e8f0',
          transition: 'width 0.2s ease',
          zIndex: 30,
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Nav items */}
        <nav style={{ padding: '8px 0', flex: 1 }}>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)
            return (
              <button
                key={item.label}
                onClick={() => navigate(basePath + item.path)}
                title={!sidebarExpanded ? item.label : undefined}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 0',
                  paddingLeft: sidebarExpanded ? '14px' : '0',
                  justifyContent: sidebarExpanded ? 'flex-start' : 'center',
                  background: active ? '#f0fdf4' : 'transparent',
                  border: 'none',
                  borderLeft: active ? '3px solid #f97316' : '3px solid transparent',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.backgroundColor = '#f8fafc'
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <Icon
                  size={18}
                  color={active ? '#f97316' : '#94a3b8'}
                  style={{ flexShrink: 0 }}
                />
                {/* Label — only visible when expanded */}
                <span style={{
                  fontSize: '13px',
                  fontWeight: active ? '600' : '400',
                  color: active ? '#0f172a' : '#64748b',
                  whiteSpace: 'nowrap',
                  opacity: sidebarExpanded ? 1 : 0,
                  maxWidth: sidebarExpanded ? '160px' : '0px',
                  overflow: 'hidden',
                  transition: 'opacity 0.15s ease, max-width 0.2s ease',
                }}>
                  {item.label}
                </span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* ── Content Area ── */}
      {/* marginLeft adjusts responsively based on isMobile and sidebar state */}
      <div
        className="workspace-content"
        style={{
          marginLeft: `${sidebarW}px`,
          transition: 'margin-left 0.2s ease',
          minHeight: `calc(100vh - ${NAVBAR_H}px)`,
          backgroundColor: '#f8fafc',
        }}
      >
        <div style={{
          maxWidth: '1100px',
          margin: '0 auto',
          padding: '40px 32px',
        }}>
          <Outlet context={{ eventId }} />
        </div>
      </div>
    </>
  )
}
