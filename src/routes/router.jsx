import { createBrowserRouter } from 'react-router-dom'
import { UserRouteGuard } from '../components/UserRouteGuard'
import { AdminRouteGuard } from '../components/AdminRouteGuard'
import { UserLayout } from '../layouts/UserLayout'
import { AdminLayout } from '../layouts/AdminLayout'
import { EventWorkspaceLayout } from '../layouts/EventWorkspaceLayout'
import { LandingPage } from '../pages/public/LandingPage'
import { AuthCallbackPage } from '../pages/public/AuthCallbackPage'
import { UserLoginPage } from '../pages/user/UserLoginPage'
import { FlowPage } from '../pages/user/FlowPage'
import { SegmentDetailsPage } from '../pages/user/SegmentDetailsPage'
import { ConcurrentPickerPage } from '../pages/user/ConcurrentPickerPage'
import { EventsSelectionPage } from '../pages/user/EventsSelectionPage'
import { NotificationsPage as UserNotificationsPage } from '../pages/user/NotificationsPage'
import { AccountPage } from '../pages/user/AccountPage'
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage'
import { AdminFlowPage } from '../pages/admin/AdminFlowPage'
import { SpeakersPage } from '../pages/admin/SpeakersPage'
import { SegmentsPage } from '../pages/admin/SegmentsPage'
import { NotificationsPage } from '../pages/admin/NotificationsPage'

export const router = createBrowserRouter([
  // ── Public ──
  { path: '/', element: <LandingPage /> },
  { path: '/login', element: <UserLoginPage /> },
  { path: '/auth/callback', element: <AuthCallbackPage /> },

  // ── User/Attendee App ──
  {
    path: '/app',
    element: (
      <UserRouteGuard>
        <UserLayout />
      </UserRouteGuard>
    ),
    children: [
      { index: true, element: <FlowPage /> },
      { path: 'segment/:id', element: <SegmentDetailsPage /> },
      { path: 'picker/:timeBlock', element: <ConcurrentPickerPage /> },
      { path: 'events', element: <EventsSelectionPage /> },
      { path: 'notifications', element: <UserNotificationsPage /> },
      { path: 'account', element: <AccountPage /> },
    ],
  },

  // ── Admin App ──
  {
    path: '/admin',
    element: (
      <AdminRouteGuard>
        <AdminLayout />
      </AdminRouteGuard>
    ),
    children: [
      { index: true, element: <AdminDashboardPage /> },

      {
        path: 'events/new',
        element: (
          <div style={{ maxWidth: '1152px', margin: '0 auto', padding: '40px 32px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a' }}>
              New Event — Step 2 coming soon
            </h1>
          </div>
        ),
      },

      {
        path: 'events/:eventId',
        element: <EventWorkspaceLayout />,
        children: [
          { path: 'flow', element: <AdminFlowPage /> },
          { path: 'speakers', element: <SpeakersPage /> },
          { path: 'segments', element: <SegmentsPage /> },
          { path: 'notifications', element: <NotificationsPage /> },
        ],
      },
    ],
  },

  {
    path: '*',
    element: (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#64748b' }}>
        Page not found
      </div>
    ),
  },
])
