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

  // On mobile, sidebar width is always 0 (hidden)
  // On desktop, sidebar toggles between collapsed and expanded
  const sidebarW = isMobile ? 0 : (sidebarExpanded ? EXPANDED_W : COLLAPSED_W)

  // Render mobile nav items into the fixed bottom nav in AdminLayout
  useEffect(() => {
    const bottomNav = document.querySelector('.admin-layout-mobile-bottom-nav')
    if (!bottomNav || !isMobile) return

    // Clear existing items
    bottomNav.innerHTML = ''

    // Add nav items to bottom nav
    NAV_ITEMS.forEach((item) => {
      const Icon = item.icon
      const active = isActive(item.path)
      
      const link = document.createElement('a')
      link.href = basePath + item.path
      link.style.flex = '1'
      link.style.padding = '8px 0'
      link.style.display = 'flex'
      link.style.flexDirection = 'column'
      link.style.alignItems = 'center'
      link.style.justifyContent = 'center'
      link.style.gap = '2px'
      link.style.textAlign = 'center'
      link.style.fontSize = '11px'
      link.style.fontWeight = '500'
      link.style.color = active ? '#2196F3' : '#4b5563'
      link.style.textDecoration = 'none'
      link.style.cursor = 'pointer'
      link.style.transition = 'color 0.2s'

      link.onclick = (e) => {
        e.preventDefault()
        navigate(basePath + item.path)
      }

      // Create icon SVG element
      const iconSpan = document.createElement('span')
      iconSpan.style.display = 'flex'
      iconSpan.style.alignItems = 'center'
      iconSpan.style.justifyContent = 'center'
      iconSpan.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${active ? 2.25 : 1.75}" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5v14"/></svg>`

      // Create label
      const labelSpan = document.createElement('span')
      labelSpan.textContent = item.label
      labelSpan.style.fontSize = '11px'

      link.appendChild(iconSpan)
      link.appendChild(labelSpan)
      bottomNav.appendChild(link)
    })
  }, [isMobile, isActive, basePath, navigate])

  return (
    <>
      {/* ── Desktop Sidebar (≥769px) ── */}
      {/* Hidden on mobile via width: 0 calculation */}
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
      {/* marginLeft responds to sidebar width */}
      <div
        className="workspace-content"
        style={{
          marginLeft: `${sidebarW}px`,
          transition: 'margin-left 0.2s ease',
          minHeight: `calc(100vh - ${NAVBAR_H}px)`,
          backgroundColor: '#f8fafc',
          paddingBottom: isMobile ? '64px' : '0',
        }}
      >
        <Outlet context={{ eventId }} />
      </div>
    </>
  )
}
