# Project Structure

```
src/
├── main.jsx                  # App entry point (React root)
├── App.jsx                   # Root component (RouterProvider)
├── index.css                 # Global styles (Tailwind imports + Poppins font)
├── assets/                   # Static images (hero, logos)
├── components/               # Shared/reusable UI components
│   ├── Toast.jsx             # Toast notification overlay (slide-down, mobile-safe)
│   ├── ConnectModal.jsx      # QR-code networking modal
│   ├── NotificationItem.jsx  # Single notification display
│   ├── UserRouteGuard.jsx    # Auth guard for attendee routes
│   └── AdminRouteGuard.jsx   # Auth guard for admin routes
├── layouts/                  # Layout wrappers with nav/chrome
│   ├── UserLayout.jsx        # Attendee layout (top nav + bottom nav on mobile)
│   ├── AdminLayout.jsx       # Admin dashboard layout (bottom nav hidden on /admin and /admin/account)
│   └── EventWorkspaceLayout.jsx  # Nested admin layout for event-specific pages
├── pages/                    # Page-level components (one per route)
│   ├── public/               # Unauthenticated pages (landing, auth callback)
│   ├── user/                 # Attendee pages
│   │   ├── FlowPage.jsx      # CORE feature — personalized schedule
│   │   ├── ConcurrentPickerPage.jsx  # Pick one session per time slot
│   │   ├── MorePage.jsx      # Quick links + featured speakers
│   │   └── ...               # Events, notifications, account, details
│   └── admin/                # Admin pages (dashboard, forms, flow control)
├── routes/
│   └── router.jsx            # All route definitions (createBrowserRouter)
└── services/                 # API/data layer (Supabase queries)
    ├── supabase.js           # Supabase client init + auth helpers
    ├── auth.js               # Auth functions (signin, signup, password reset, Google OAuth)
    ├── events.js             # Event CRUD
    ├── segments.js           # Segment CRUD + speaker linking
    ├── speakers.js           # Speaker CRUD
    ├── notifications.js      # Notification CRUD + segment status update
    ├── s3UploadService.js    # S3 image upload for speaker photos
    └── theme.js              # Theme helpers + `useDarkMode()` hook
```

## User Navigation (bottom nav / desktop nav)

`Events | Connect (modal) | Flow (center) | Notifications | More`

`Flow` is the core surface. `Settings` lives in the avatar sidebar / desktop dropdown,
not the bottom nav.

## Architecture Patterns

- **Service layer:** All Supabase queries live in `src/services/`. Components import service functions, never call `supabase` directly (except for realtime subscriptions in layouts).
- **Service return pattern:** Service functions return `{ success: boolean, data?, error? }` objects. Auth helpers return data directly or null.
- **Route guards:** `UserRouteGuard` and `AdminRouteGuard` check auth state + role before rendering children. Unauthorized users redirect to `/login`.
- **Layout + Outlet:** Layouts use React Router's `<Outlet />` to render child pages. Layouts own navigation, auth state, and toast notifications.
- **Component exports:** Named exports (not default) for all components, layouts, and pages.
- **Routing:** Flat route config in `router.jsx` using `createBrowserRouter`. Four top-level route groups: public, `/app` (user), `/admin`, `/reset-password`.
- **State management:** Local component state via `useState`/`useEffect`. No global state library — selected event stored in `localStorage`.
- **Dark mode:** Toggled by adding/removing `dark` class on `document.documentElement`.
  `UserLayout` and `AdminLayout` **own** the class (they add/remove it and persist the
  preference). Every other component **observes** it via the `useDarkMode()` hook from
  `services/theme.js` — do not hand-roll a MutationObserver, and never read
  `classList.contains('dark')` once at render time (it won't re-render on toggle).
  Note: both layouts remove the class on unmount, so public/auth pages are always light.
- **Theme-aware styles:** Inline styles use `isDarkMode ? dark : light` ternaries. For
  badge/status color maps, define a parallel `*_DARK` map with translucent backgrounds
  (`rgba(...,0.15)`) and light text, then select via a `getX(value, isDarkMode)` helper.
  Exception: elements on permanently-dark surfaces (the "Happening Now" gradient card,
  the QR code container) intentionally keep fixed colors.
- **Mobile-first:** All pages and components are designed for mobile viewports first. Layouts stack vertically on small screens and expand to multi-column on desktop (768px+). Touch-friendly tap targets (min 44px), bottom navigation on mobile, and compact spacing are the defaults.
- **Confirmation modals:** All destructive actions (delete) and important state changes (skip, revert, event status) require confirmation via modal.
- **Success feedback:** All CRUD operations show a success message (green banner) before navigating away.
