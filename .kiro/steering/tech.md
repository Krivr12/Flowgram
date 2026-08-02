# Tech Stack & Build

## Core Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 (JSX, no TypeScript) |
| Build tool | Vite 8 |
| Styling | Tailwind CSS 4 (utility-first) + inline styles |
| Backend/DB | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth (Google OAuth + email/password) |
| Real-time | HTTP polling (notifications 5s, segments 3s) |
| PWA | vite-plugin-pwa (workbox, auto-update) |
| Icons | lucide-react |
| Routing | react-router-dom v7 (createBrowserRouter) |
| Forms | react-hook-form + @hookform/resolvers + zod |
| Date utils | date-fns |
| QR codes | react-qr-code |
| File upload | @aws-sdk/client-s3 + browser-image-compression |
| Data fetching | @tanstack/react-query |

## Environment Variables

Required in `.env.local`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_ENV=development|production
VITE_AWS_ACCESS_KEY_ID=...
VITE_AWS_SECRET_ACCESS_KEY=...
VITE_AWS_REGION=...
VITE_AWS_S3_BUCKET_NAME=...
```

All client-side env vars must be prefixed with `VITE_`.

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Vite dev server (localhost:5173) |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |

## Conventions

- Font: Poppins (loaded via Google Fonts in `index.html`)
- Dark mode supported via `class` strategy on `<html>` element (Tailwind `darkMode: 'class'`).
- Custom colors: `primary-orange` (#FFA100), `primary-blue` (#1B77CF).
- PostCSS uses `@tailwindcss/postcss` plugin.
- ES modules throughout (`"type": "module"` in package.json).
- No TypeScript — all source files are `.js` or `.jsx`.
- Deployment: Vercel (auto-deploy on push to main).

## Date & Time Handling (important)

Flowgram treats all event and segment times as **venue wall-clock time**. The time
an admin types is the time attendees see, regardless of either party's browser timezone.

- **Saving:** pass the raw `<input type="datetime-local">` value straight through
  (`form.start_date`). Never use `new Date(value).toISOString()` — that shifts by the
  admin's UTC offset and can even roll the date to the previous day.
- **Loading into a form:** build the `YYYY-MM-DDTHH:mm` string with `getUTC*` methods
  (`getUTCHours()`, not `getHours()`).
- **Displaying:** always format with `timeZone: 'UTC'`.

All three must agree or times will drift. See `AdminEventFormPage.isoToDatetimeLocal`
and `AdminSegmentFormPage.convertToDatetimeLocal`.

## Mobile / PWA Constraints

- The viewport meta includes `maximum-scale=1.0, user-scalable=no`.
- **All inputs, textareas, and selects must be `font-size: 16px` or larger.** iOS Safari
  auto-zooms the viewport on focus below 16px, and the zoom persists across client-side
  navigations. A global CSS rule in `index.css` enforces this as a safety net.

## Polling Intervals

| What | Interval | Where |
|------|----------|-------|
| Notifications (toast + red dot) | 5s | `UserLayout` |
| Segments (live status/capacity) | 3s | `FlowPage` |
| Notifications list | 15s | `NotificationsPage` |

Polling is intentional over Supabase Realtime. At ~300 attendees this is roughly
160 req/s of tiny indexed `SELECT`s — comfortably within limits. Updates are
near-real-time (0–5s), not instant.

## localStorage Keys

| Key | Purpose |
|-----|---------|
| `selected_event_id` | Currently selected event |
| `user_dark_mode` / `admin_dark_mode` | Theme preference per layout |
| `flowgram_last_seen_notif_id_{eventId}` | Per-event notification dedupe |
| `flowgram_has_new_notif` | Red dot state |
| `flowgram_cleared_notifs_{eventId}` | Timestamp; hides older notifications |
