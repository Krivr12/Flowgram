# Product: Flowgram

Flowgram is a real-time event companion PWA built by the AWS Community Day Philippines team. It serves two roles:

- **Admin (Event Organizer):** Create/manage events, organize speakers into chronological segments, control session status and room capacity in real time, and broadcast notifications to attendees.
- **Attendee (User):** Browse event schedules with live status updates, view speaker profiles, receive instant announcements, and generate QR-code networking cards (LinkedIn).

The platform targets events of any scale — from small workshops to large conferences — and is designed as a mobile-first Progressive Web App (PWA). All UI decisions should prioritize the mobile viewport first, then scale up for tablet/desktop. Touch targets, single-column layouts, and bottom navigation are the defaults.

## Key Concepts

- **Event:** A conference or meetup with title, description, venue, start/end datetime.
- **Segment:** A session/talk within an event, with start/end time, room, status (Not Started → Ongoing → Finished → Skipped), and capacity (VACANT → FILLING → ALMOST FULL → FULL).
- **Speaker:** A person presenting in one or more segments. Has name, role, company, bio, event_role (SPEAKER/HOST/PANELIST), LinkedIn URL, and profile picture.
- **Notification:** A broadcast message from admin to all attendees of an event.

## Authentication & Roles

- Google OAuth and email/password auth via Supabase Auth.
- Two roles in the `users` table: `ADMIN` and `USER`.
- Route guards enforce role-based access on the frontend.
- Row Level Security (RLS) policies enforce data access on the backend.
- Password reset flow: forgot password → email link → `/auth/callback?type=recovery` → `/reset-password` page.

## Database Enums

- `segment_status`: `'Not Started'`, `'Ongoing'`, `'Finished'`, `'Skipped'`
- `capacity_status`: `'VACANT'`, `'FILLING'`, `'ALMOST FULL'`, `'FULL'`
- `event_status`: `'UPCOMING'`, `'STARTED'`, `'FINISHED'`, `'CANCELLED'`
- `event_role` (speakers): `'SPEAKER'`, `'HOST'`, `'PANELIST'`
