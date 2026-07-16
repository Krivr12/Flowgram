import { useOutletContext, useNavigate } from 'react-router-dom'
import { Mic2, Layers, Bell, Calendar, MapPin } from 'lucide-react'

export const EventOverviewPage = () => {
  const { event, eventId } = useOutletContext()
  const navigate = useNavigate()

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
      timeZone: 'UTC',
    })

  const quickLinks = [
    {
      label: 'Speakers',
      description: 'Manage speaker profiles for this event.',
      icon: Mic2,
      color: '#3b82f6',
      bg: '#eff6ff',
      path: `/admin/events/${eventId}/speakers`,
    },
    {
      label: 'Segments',
      description: 'Create sessions and map speakers.',
      icon: Layers,
      color: '#8b5cf6',
      bg: '#f5f3ff',
      path: `/admin/events/${eventId}/segments`,
    },
    {
      label: 'Notifications',
      description: 'Broadcast messages to attendees.',
      icon: Bell,
      color: '#f97316',
      bg: '#fff7ed',
      path: `/admin/events/${eventId}/notifications`,
    },
  ]

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px' }}>
          {event?.title || 'Event Overview'}
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
          Workspace overview — manage all aspects of this event below.
        </p>
      </div>

      {/* Event details card */}
      {event && (
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '24px',
          marginBottom: '32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a', margin: 0 }}>
            Event Details
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#475569' }}>
              <Calendar size={15} color="#fb923c" />
              <span>{formatDate(event.start_date)} — {formatDate(event.end_date)}</span>
            </div>
            {event.venue && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#475569' }}>
                <MapPin size={15} color="#fb923c" />
                <span>{event.venue}</span>
              </div>
            )}
            {event.description && (
              <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0', lineHeight: '1.6' }}>
                {event.description}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Quick nav cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: '20px',
      }}>
        {quickLinks.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              style={{
                backgroundColor: '#fff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                padding: '24px',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                transition: 'box-shadow 0.15s, border-color 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'
                e.currentTarget.style.borderColor = item.color + '60'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.borderColor = '#e2e8f0'
              }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: item.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Icon size={20} color={item.color} />
              </div>
              <div>
                <p style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a', margin: '0 0 4px' }}>
                  {item.label}
                </p>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                  {item.description}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
