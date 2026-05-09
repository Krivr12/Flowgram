# Flowgram — Real-Time Event Tracking Platform
## Masterprompt v2.0 · For Kiro Agent

---

## 1. Project Overview

| Field | Value |
|---|---|
| **Name** | Flowgram |
| **Purpose** | A reusable platform where Admins create events, build program flows, and manage speakers. Participants join events, track live schedules, and personalize their flow for concurrent sessions. |
| **Primary Users** | Admins (event organizers), Participants (attendees) |
| **Core Value Prop** | Real-time schedule management with live status updates and concurrent track selection |

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4 (`@import "tailwindcss"`) |
| Components | shadcn/ui, lucide-react |
| Database / Auth | Supabase (PostgreSQL, Magic Link, Realtime) |
| Notifications | Firebase Cloud Messaging (FCM) |

> **Note for Kiro:** Do not substitute any library or framework. Use exact versions specified.

---

## 3. Project Structure

```
├── app/
│   ├── login/
│   │   └── page.tsx
│   ├── (participant)/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── [eventId]/
│   │       └── page.tsx
│   └── admin/
│       ├── layout.tsx
│       ├── page.tsx
│       └── [eventId]/
│           └── page.tsx
├── components/
│   ├── ui/                        # shadcn/ui auto-generated components
│   ├── participant-sidebar.tsx
│   └── admin-sidebar.tsx
├── hooks/
│   ├── use-events.ts
│   ├── use-event.ts
│   ├── use-segments.ts
│   ├── use-speakers.ts
│   └── use-participant-schedule.ts
├── lib/
│   ├── supabase/
│   │   └── client.ts
│   └── utils.ts
├── types/
│   └── index.ts
└── data/
    └── mock-data.ts
```

> **Kiro Rule:** Do not deviate from this structure. Every file must be created at the exact path shown.

---

## 4. Type Definitions

**File:** `types/index.ts`

```typescript
export type EventStatus = 'DRAFT' | 'UPCOMING' | 'ONGOING' | 'DONE' | 'CANCELLED';
export type SegmentStatus = 'NOT_STARTED' | 'UP_NEXT' | 'ONGOING' | 'DONE' | 'CANCELLED';
export type Modality = 'ONLINE' | 'ONSITE' | 'HYBRID';

export interface Event {
  id: string;
  name: string;
  description: string | null;
  startDate: string;   // ISO 8601
  endDate: string;     // ISO 8601
  venue: string;
  status: EventStatus;
  modality: Modality;
}

export interface Speaker {
  id: string;
  name: string;
  title: string;
  bio: string;
  avatarUrl?: string;
}

export interface Track {
  id: string;
  eventId: string;
  name: string;        // e.g. "Room A", "Track 1"
  color?: string;      // Tailwind color token for visual differentiation
}

export interface Segment {
  id: string;
  eventId: string;
  name: string;
  description: string | null;
  date: string;        // ISO 8601 date (YYYY-MM-DD)
  location: string | null;
  trackId?: string;
  isConcurrent: boolean;
  startTime: string;   // HH:mm (24-hour)
  endTime: string;     // HH:mm (24-hour)
  status: SegmentStatus;
  speakerIds: string[];
}

export interface ParticipantSchedule {
  id: string;
  userId: string;
  eventId: string;
  selectedSegmentIds: string[];
}

export interface Announcement {
  id: string;
  eventId: string;
  message: string;
  type: 'NUDGE' | 'EMERGENCY';
  sentAt: string;      // ISO 8601
  sentBy: string;      // admin userId
}
```

> **Kiro Rule:** Import types exclusively from `types/index.ts`. Never inline type declarations in component files.

---

## 5. Design System

### 5.1 Theme Tokens

| Property | Value |
|---|---|
| Color Mode | Dark only |
| Page Background | `bg-slate-950` |
| Section Background | `bg-slate-900` |
| Card Background | `bg-white/5 backdrop-blur-lg` |
| Card Border | `border border-white/10` |
| Card Radius | `rounded-2xl` (primary), `rounded-3xl` (hero cards) |
| Typography | System sans-serif, high contrast white |
| Accent — Purple | `violet-500` |
| Accent — Orange | `orange-500` |
| Accent — Blue | `blue-500` |

### 5.2 Segment Status Visual States

| Status | Visual Treatment |
|---|---|
| `NOT_STARTED` | Muted card, no glow, reduced text contrast |
| `UP_NEXT` | Standard card, subtle border |
| `ONGOING` | `ring-2 ring-violet-500/50` + CSS `animate-pulse` on ring |
| `DONE` | `opacity-50`, muted text and icon colors |
| `CANCELLED` | `opacity-40`, strikethrough segment name, red status badge |

### 5.3 Event Status Badge Colors

| Status | Badge Style |
|---|---|
| `DRAFT` | `bg-slate-500/20 text-slate-400` |
| `UPCOMING` | `bg-blue-500/20 text-blue-400` |
| `ONGOING` | `bg-violet-500/20 text-violet-400` |
| `DONE` | `bg-green-500/20 text-green-400` |
| `CANCELLED` | `bg-red-500/20 text-red-400` |

### 5.4 Reusable Card Pattern

Apply consistently to all content cards:

```tsx
<div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4">
  {/* content */}
</div>
```

---

## 6. Mock Data

**File:** `data/mock-data.ts`

Seed data for **"AWS Community Day 2026"** (Aug 1–2, 2026).

### Schedule Blueprint

| Day | Time | Segment | Location | Concurrent? | Speakers |
|---|---|---|---|---|---|
| Day 1 | 09:00–10:00 | Opening Keynote | Main Hall | No | Dr. Sarah Chen |
| Day 1 | 10:30–12:00 | Serverless Deep Dive | Room A | Yes (Track A) | Marcus Webb |
| Day 1 | 10:30–12:00 | AI/ML Workshop | Room B | Yes (Track B) | Priya Sharma |
| Day 2 | 09:00–12:00 | Containers & K8s | Room A | Yes (Track A) | Marcus Webb |
| Day 2 | 09:00–12:00 | Data Engineering | Room B | Yes (Track B) | Priya Sharma |
| Day 2 | 09:00–12:00 | Security Best Practices | Room C | Yes (Track C) | Dr. Sarah Chen |
| Day 2 | 09:00–12:00 | Cost Optimization | Room D | Yes (Track D) | TBA |
| Day 2 | 13:00–14:00 | Closing Ceremony | Main Hall | No | All speakers |

### Speaker Bios

```typescript
// Dr. Sarah Chen — Keynote speaker
// Title: Principal Developer Advocate, AWS APAC
// Bio: 15+ years in distributed systems. Author of "Designing for Scale."
//      AWS Hero 2022. Frequent speaker at re:Invent and KubeCon.

// Marcus Webb — Serverless track
// Title: Senior Solutions Architect, AWS
// Bio: Specializes in event-driven architectures and Lambda optimization.
//      Maintainer of several open-source CDK constructs.

// Priya Sharma — AI/ML track
// Title: Machine Learning Engineer, Amazon Science
// Bio: PhD in Computer Vision from NUS. Works on SageMaker tooling.
//      Passionate about making ML accessible for startups.
```

### Segment Statuses for Dev/Testing

Distribute statuses across segments so all visual states render during Phase 1:

- Opening Keynote → `DONE`
- Serverless Deep Dive → `ONGOING`
- AI/ML Workshop → `ONGOING`
- Day 2 Workshops → `NOT_STARTED`
- Closing Ceremony → `NOT_STARTED`

---

## 7. Hooks API Contract

**Directory:** `hooks/`

All hooks must match this interface exactly. Phase 1 implements with mock data; Phase 3 replaces internals with Supabase — the interface must not change.

```typescript
// hooks/use-events.ts
export function useEvents(): {
  events: Event[];
  loading: boolean;
  error: string | null;
}

// hooks/use-event.ts
export function useEvent(eventId: string): {
  event: Event | null;
  loading: boolean;
  error: string | null;
}

// hooks/use-segments.ts
export function useSegments(eventId: string): {
  segments: Segment[];
  loading: boolean;
  error: string | null;
}

// hooks/use-speakers.ts
export function useSpeakers(eventId: string): {
  speakers: Speaker[];
  loading: boolean;
  error: string | null;
}

// hooks/use-participant-schedule.ts
export function useParticipantSchedule(userId: string, eventId: string): {
  schedule: ParticipantSchedule | null;
  toggleSegment: (segmentId: string) => void;
  loading: boolean;
  error: string | null;
}
```

> **Kiro Rule:** Page components must import data exclusively via hooks. Zero direct imports from `data/mock-data.ts` in any `app/` file.

---

## 8. Feature Specifications

---

### SPEC-001 · Authentication Flow
**File:** `app/login/page.tsx`

**Acceptance Criteria:**
- [ ] Centered card layout using shadcn `Card`; full-screen centering with `min-h-screen flex items-center justify-center`
- [ ] Email input field with basic format validation (must contain `@`)
- [ ] "Send Magic Link" primary button with spinner loading state during submission
- [ ] On success: shadcn `toast` notification "Check your inbox for a magic link"
- [ ] On error: inline error message below input (e.g., "Something went wrong. Try again.")
- [ ] "Continue as Admin →" text link below card navigates to `/admin`
- [ ] If user is already authenticated: redirect to `/` (participant) or `/admin` based on `user.role`
- [ ] Dark glassmorphism card on `bg-slate-950` page background

---

### SPEC-002 · Participant Event Discovery
**File:** `app/(participant)/page.tsx`

**Acceptance Criteria:**
- [ ] Mobile-first layout: `max-w-md mx-auto min-h-screen`
- [ ] Top navbar with app logo/name and hamburger menu icon (`lucide-react Menu`)
- [ ] Slide-out sidebar (`shadcn Sheet`) with nav items: Events, My Schedule, Notifications, Logout
- [ ] Events sourced from `useEvents()` hook
- [ ] Each event card displays: name, formatted date range, venue, status badge (per badge color spec)
- [ ] Filter tabs (shadcn `Tabs`): All · Upcoming · Ongoing — filters by `EventStatus`
- [ ] Empty state component when no events match filter: illustration + message
- [ ] Tapping an event card navigates to `/[eventId]`
- [ ] Loading skeleton cards while `loading === true`

---

### SPEC-003 · Participant Live Timeline
**File:** `app/(participant)/[eventId]/page.tsx`

**Acceptance Criteria:**
- [ ] Page header: event name, venue, formatted date range, event status badge
- [ ] Date tabs (shadcn `Tabs`) — one tab per unique `segment.date` value, labeled "Day 1", "Day 2", etc. (or the formatted date)
- [ ] Within each tab: segments sorted chronologically by `startTime`
- [ ] Each segment card displays: time range, name, description excerpt, location, status indicator, speaker avatars + names
- [ ] Visual status treatments applied per design system (§5.2)
- [ ] For `isConcurrent === true` groups: display a "Select Track" UI that shows all concurrent options side by side
  - User can tap a track to select it
  - Selected track shows a checkmark and highlighted border
  - Selection is persisted via `useParticipantSchedule().toggleSegment()`
- [ ] `useParticipantSchedule()` pre-populates previously selected segments on load
- [ ] Pull-to-refresh on mobile (use `onTouchStart`/`onTouchEnd` or a `react-pull-to-refresh` pattern)

---

### SPEC-004 · Admin Dashboard
**File:** `app/admin/page.tsx`

**Acceptance Criteria:**
- [ ] Full-width desktop layout with persistent left sidebar (`admin-sidebar.tsx`)
- [ ] Sidebar nav items: Events, Announcements, Notification History, Logout
- [ ] Page header with "+ Create Event" button that opens a shadcn `Dialog` (modal)
- [ ] Create Event modal fields: Name, Description, Start Date, End Date, Venue, Modality (select), Status (select, defaults to DRAFT)
- [ ] Event grid: 3 columns on desktop (`grid-cols-3`), 1 column on mobile (`grid-cols-1`)
- [ ] Each event card shows: name, formatted date range, venue, status badge, simulated participant count
- [ ] Clicking an event card navigates to `/admin/[eventId]`
- [ ] Events sourced from `useEvents()` hook
- [ ] Loading skeleton grid while `loading === true`

---

### SPEC-005 · Admin Event Builder
**File:** `app/admin/[eventId]/page.tsx`

**Acceptance Criteria:**

**Tab structure (shadcn `Tabs`):**
- [ ] Program Flow
- [ ] Speakers
- [ ] Live Control

---

**Program Flow Tab:**
- [ ] Table view with columns: Time, Name, Location, Track, Status, Speakers, Actions
- [ ] "Add Segment" button opens a shadcn `Dialog` with all `Segment` fields:
  - Name, Description, Date (date picker), Start Time, End Time, Location, `isConcurrent` toggle, Track (shown if `isConcurrent`), Speaker multi-select
- [ ] Edit action opens same modal pre-populated
- [ ] Delete action shows shadcn `AlertDialog` confirmation: "Delete [segment name]?"
- [ ] Concurrent segments visually grouped or tagged with track label
- [ ] Segments sorted by date, then by `startTime`

---

**Speakers Tab:**
- [ ] Speaker cards in a grid (2–3 columns): avatar, name, title, bio truncated to 2 lines
- [ ] "Add Speaker" button opens modal with fields: Name, Title, Bio, Avatar URL (optional)
- [ ] Edit and Delete actions on each card
- [ ] Delete shows warning if speaker is assigned to any segment: "This speaker is assigned to [N] segments. Remove them first or proceed?"

---

**Live Control Tab:**

*Section 1 — Push Schedule Back:*
- [ ] Number input labeled "Delay (minutes)"
- [ ] "Apply Delay" button
- [ ] Confirmation `AlertDialog`: "Shift all UP_NEXT and NOT_STARTED segments by [N] minutes?"
- [ ] On confirm: updates `startTime` and `endTime` for all non-started segments

*Section 2 — Segment Status Control:*
- [ ] Grid of all segments showing: time, name, current status
- [ ] Per-segment dropdown (shadcn `Select`) to change `SegmentStatus`
- [ ] Changes apply immediately to local state (Phase 1) / Supabase (Phase 3)

*Section 3 — Notifications Panel:*
- [ ] Toggle between `NUDGE` (info) and `EMERGENCY` (alert) notification types
  - `NUDGE`: blue accent, bell icon
  - `EMERGENCY`: red accent, alert icon
- [ ] Message `textarea` (max 280 characters, character count shown)
- [ ] "Send to All Participants" button
- [ ] On send: optimistic success toast, message appended to notification history

---

## 9. Supabase Schema (Phase 3 Reference)

```sql
-- Events
create table events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  start_date timestamptz not null,
  end_date timestamptz not null,
  venue text not null,
  status text not null default 'DRAFT',
  modality text not null default 'ONSITE',
  created_at timestamptz default now()
);

-- Speakers
create table speakers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  title text,
  bio text,
  avatar_url text,
  created_at timestamptz default now()
);

-- Tracks
create table tracks (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  name text not null,
  color text
);

-- Segments
create table segments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  name text not null,
  description text,
  date date not null,
  location text,
  track_id uuid references tracks(id) on delete set null,
  is_concurrent boolean default false,
  start_time time not null,
  end_time time not null,
  status text not null default 'NOT_STARTED',
  created_at timestamptz default now()
);

-- Segment ↔ Speaker join table
create table segment_speakers (
  segment_id uuid references segments(id) on delete cascade,
  speaker_id uuid references speakers(id) on delete cascade,
  primary key (segment_id, speaker_id)
);

-- Participant schedules
create table participant_schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  event_id uuid references events(id) on delete cascade,
  selected_segment_ids uuid[] default '{}',
  unique(user_id, event_id)
);

-- Announcements
create table announcements (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  message text not null,
  type text not null default 'NUDGE',
  sent_at timestamptz default now(),
  sent_by uuid references auth.users(id)
);
```

**RLS Policies (Phase 3):**
- `events`: read = public; write = authenticated admin
- `segments`, `speakers`, `tracks`: read = public; write = authenticated admin
- `participant_schedules`: read/write = own rows only (`user_id = auth.uid()`)
- `announcements`: read = participants of that event; write = authenticated admin

---

## 10. Implementation Phases

### Phase 1 — Static UI with Mock Data

**Goal:** Complete, navigable UI using only local state and mock data.

**Tasks:**
1. Initialize Next.js 15 + Tailwind v4 + shadcn/ui
2. Create all directories and empty files per project structure
3. Write `types/index.ts` exactly as specified in §4
4. Write `data/mock-data.ts` per §6
5. Implement hooks in `hooks/` — return mock data, `loading: false`, `error: null`
6. Build `components/participant-sidebar.tsx` and `components/admin-sidebar.tsx`
7. Implement SPEC-001 through SPEC-005 in order
8. Apply design system (§5) consistently across all components
9. Use React `useState` for all mutable state (segment selection, modal open/close, filter state)

**Completion Criteria:**
- [ ] All routes render without runtime errors
- [ ] Navigation works between all views (login → participant, login → admin, event list → event detail)
- [ ] All CRUD UIs work with local state
- [ ] All segment status visual states are visible in the participant timeline
- [ ] No direct mock data imports in `app/` files

---

### Phase 2 — Data Abstraction

**Goal:** Decouple UI from data source. UI must be unchanged.

**Tasks:**
1. Finalize hook interfaces per §7
2. Ensure all `app/` components consume only hook output
3. Verify no component imports from `data/mock-data.ts` directly

**Completion Criteria:**
- [ ] All data access via hooks
- [ ] Mock data only referenced in `hooks/` internals
- [ ] UI behavior identical to Phase 1

---

### Phase 3 — Supabase Integration

**Goal:** Live database, real-time updates, and Magic Link auth.

**Tasks:**
1. Create Supabase project and run schema from §9
2. Implement `lib/supabase/client.ts` (browser + server clients)
3. Replace hook mock implementations with Supabase queries
4. Add `supabase.channel()` real-time subscriptions for:
   - Segment status changes (participant timeline)
   - New announcements (participant notification banner)
5. Implement Magic Link auth in SPEC-001
6. Add RLS policies per §9
7. Implement FCM for push notifications (announcements)

**Completion Criteria:**
- [ ] Data persists across sessions and page refreshes
- [ ] Two browser tabs show real-time segment status changes simultaneously
- [ ] Magic Link email sent and auth redirect works
- [ ] Participant can only read/write their own schedule

---

## 11. Kiro Agent Execution Rules

1. **Always state the spec** before generating code: `// Implementing SPEC-003`
2. **Generate complete files** — no `// TODO`, `// ...`, or placeholder comments
3. **Follow the exact folder structure** — no new directories or renamed files
4. **Use exact type names** from `types/index.ts` — no local redeclarations
5. **Apply design system tokens** (§5) on every component — no ad-hoc colors
6. **Validate each spec's acceptance criteria** before marking it done
7. **Phase gate** — do not begin Phase 2 until all Phase 1 criteria are checked off
8. **Hooks are the only data interface** — pages never import mock data directly
9. **shadcn components take priority** over custom implementations for: buttons, inputs, modals, tabs, toasts, selects, alerts
10. **Mobile-first** on all participant-facing views; desktop-first on admin views

---

## 12. Validation Checklist (Pre-Handoff)

Run through this before considering any phase complete:

| Check | Pass? |
|---|---|
| All routes in app router resolve without 404 | |
| No TypeScript errors (`tsc --noEmit`) | |
| No direct mock data imports in `app/` | |
| All 5 segment statuses visually distinguishable | |
| Concurrent track selection persists on re-render | |
| Admin CRUD operations update UI without page refresh | |
| All modals include close/cancel actions | |
| Sidebar renders correctly on mobile and desktop | |
| All badge/status colors match §5.3 exactly | |
| Push delay confirmation dialog fires before applying | |
