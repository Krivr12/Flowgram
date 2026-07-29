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
import { EventDetailsPage } from '../pages/user/EventDetailsPage'
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage'
import { AdminEventFormPage } from '../pages/admin/AdminEventFormPage'
import { AdminFlowPage } from '../pages/admin/AdminFlowPage'
import { SpeakersPage } from '../pages/admin/SpeakersPage'
import { AdminSpeakerFormPage } from '../pages/admin/AdminSpeakerFormPage'
import { AdminSegmentsPage } from '../pages/admin/AdminSegmentsPage'
import { AdminSegmentFormPage } from '../pages/admin/AdminSegmentFormPage'
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
      { path: 'event/:id', element: <EventDetailsPage /> },
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
      { path: 'account', element: <AccountPage /> },

      // Create — must be listed before the :eventId workspace route
      { path: 'events/new', element: <AdminEventFormPage /> },

      // Edit — likewise must be listed before :eventId
      { path: 'events/edit/:eventId', element: <AdminEventFormPage /> },

      // Event workspace (Flow, Speakers, Segments, Notifications)
      {
        path: 'events/:eventId',
        element: <EventWorkspaceLayout />,
        children: [
          { path: 'flow', element: <AdminFlowPage /> },
          { path: 'speakers', element: <SpeakersPage /> },
          { path: 'speakers/new', element: <AdminSpeakerFormPage /> },
          { path: 'speakers/edit/:speakerId', element: <AdminSpeakerFormPage /> },
          { path: 'segments', element: <AdminSegmentsPage /> },
          { path: 'segments/new', element: <AdminSegmentFormPage /> },
          { path: 'segments/edit/:segmentId', element: <AdminSegmentFormPage /> },
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
