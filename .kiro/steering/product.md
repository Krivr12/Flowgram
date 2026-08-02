# Product: Flowgram

Flowgram is a real-time event companion PWA built by the AWS Community Day Philippines team. It serves two roles:

- **Admin (Event Organizer):** Create/manage events, organize speakers into chronological segments, control session status and room capacity in real time, and broadcast notifications to attendees.
- **Attendee (User):** Build a personalized program flow, browse schedules with live status updates, view speaker profiles, receive announcements, and generate QR-code networking cards (LinkedIn).

The platform targets events of any scale — from small workshops to large conferences — and is designed as a mobile-first Progressive Web App (PWA). All UI decisions should prioritize the mobile viewport first, then scale up for tablet/desktop. Touch targets, single-column layouts, and bottom navigation are the defaults.

## Key Concepts

- **Event:** A conference or meetup with title, description, venue, start/end datetime.
- **Segment:** A session/talk within an event, with start/end time, room, status (Not Started → Ongoing → Finished → Skipped), and capacity (VACANT → FILLING → ALMOST FULL → FULL).
- **Concurrent sessions:** Segments that share the same `start_time` are automatically
  grouped into one time slot. Attendees pick which one to attend; the pick is stored in
  `user_itineraries.picked_segments` as a `{ "HH:MM": segmentId }` map.
- **Speaker:** A person presenting in one or more segments. Has name, role, company, bio, event_role (SPEAKER/HOST/PANELIST), LinkedIn URL, and profile picture.
- **Notification:** A broadcast message from admin to all attendees of an event.

## Authentication & Roles

- Google OAuth and email/password auth via Supabase Auth.
- Two roles in the `users` table: `ADMIN` and `USER`.
- Route guards enforce role-based access on the frontend.
- Row Level Security (RLS) policies enforce data access on the backend.
- Password reset flow: forgot password → email link → `/auth/callback?type=recovery` → `/reset-password` page.

## The Flow Page (core feature)

The attendee's personalized event guide. Two views via a toggle (My Flow on the left,
default):

- **My Flow** — one card per time slot. Concurrent slots show the attendee's pick, or
  default to the first session with a "change" button. Never hides a time slot.
- **All** — the full schedule with every concurrent session expanded and stacked.

Supporting behavior:
- **Happening Now** respects the attendee's picks (a 21st-Floor picker never sees the
  15th-Floor session as "Happening Now").
- Finished/Skipped time groups are dimmed to 50% opacity.
- On load, auto-scrolls to the first non-completed time group.
- Progress counter: "N of M sessions done".
- Concurrent segments sort **15th Floor first**, so the default pick is predictable.

## Notification Phrasing

Segment status changes generate notifications via a Supabase DB trigger in the format
`"Session Update: {name}"` / `"This session is now {Status}."`. These are rewritten at
**display time** by `formatNotification()` in `components/NotificationItem.jsx` (exported
and also used by the toast in `UserLayout`) into friendlier copy, e.g. "Registration is
now live". Manual admin notifications pass through untouched. No DB migration needed.

Attendees can clear their notification list; it stores a timestamp locally and hides
older items without deleting anything server-side.

## Database Enums

- `segment_status`: `'Not Started'`, `'Ongoing'`, `'Finished'`, `'Skipped'`
- `capacity_status`: `'VACANT'`, `'FILLING'`, `'ALMOST FULL'`, `'FULL'`
- `event_status`: `'UPCOMING'`, `'STARTED'`, `'FINISHED'`, `'CANCELLED'`
- `event_role` (speakers): `'SPEAKER'`, `'HOST'`, `'PANELIST'`

**Enum values are stored uppercase but never displayed raw.** Map them to friendly
labels before rendering:

| Enum | Displayed as |
|------|-------------|
| `VACANT` | Open |
| `FILLING` | Filling Up |
| `ALMOST FULL` | Almost Full |
| `FULL` | Full |
| `UPCOMING` / `STARTED` / … | Upcoming / Started / … (title case) |
