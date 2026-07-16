# Flowgram

**Flowgram** is a modern, real-time event and conference management platform that empowers organizers to manage complex event schedules and enables attendees to discover sessions, connect with speakers, and network seamlessly—all powered by live updates and WebSocket subscriptions.

---

## 🎯 Overview

Flowgram provides a dual-role experience:

- **Admin Dashboard**: Create and manage events, organize speakers into chronological segments, control room capacity in real-time, and broadcast instant notifications to attendees.
- **Attendee Platform**: Browse event schedules with live status updates, explore speaker profiles, receive instant announcements, and generate personalized networking QR codes.

Built for events of any scale—from intimate workshops to large conferences—Flowgram delivers a responsive, intuitive interface on desktop and mobile devices.

---

## 🛠 Tech Stack

- **Frontend**: [React 18](https://react.dev) with [Vite](https://vitejs.dev) for blazing-fast builds
- **Styling**: [Tailwind CSS](https://tailwindcss.com) for utility-first, responsive design
- **Backend & Database**: [Supabase](https://supabase.com) ([PostgreSQL](https://www.postgresql.org) + [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security))
- **Authentication**: Supabase Auth (email/password)
- **Real-time Sync**: [Supabase Realtime](https://supabase.com/docs/guides/realtime) (WebSocket subscriptions)
- **Notifications**: Database triggers + Supabase Realtime channels
- **UI Components & Icons**: [Lucide React](https://lucide.dev)
- **Networking**: [react-qr-code](https://www.npmjs.com/package/react-qr-code) for QR-code business cards

---

## 👥 User Personas & Key Features

### Admin (Event Organizer)

- **Event Management**: Create events with title, description, and metadata
- **Segment Organization**: Add segments (sessions) in chronological order; system auto-groups concurrent sessions by start time
- **Live Controls**: Adjust segment status (Not Started → Ongoing → Finished) and room capacity (VACANT → FILLING → FULL → AT CAPACITY) in real-time
- **Speaker Assignment**: Link speakers to segments and manage speaker profiles (bio, role, company, LinkedIn URL)
- **Broadcast Notifications**: Send push notifications to all attendees of a specific event via Supabase SQL triggers and Realtime channels
- **Multi-Event Dashboard**: View all events at a glance, with quick access to each event's flow and speaker management

### Attendee (User)

- **Real-time Schedule**: View sessions filtered by selected event with live status badges (Ongoing, Finished, Skipped, Not Started)
- **Session Details**: Click into segments to see time, room, capacity, and assigned speakers
- **Speaker Profiles**: Tap speaker names to view full bio, role/company, and LinkedIn profile link
- **Live Announcements**: Receive instant toast notifications when admins broadcast messages—powered by Supabase Realtime subscriptions
- **Notifications Feed**: Dedicated page listing all past announcements for an event
- **Networking Card**: Generate a personal QR code linked to your LinkedIn profile for easy sharing at events
- **Account Settings**: Manage profile name, email (read-only), and LinkedIn URL for QR code generation

---

## 📊 Database Schema

### Core Tables

#### `events`
Stores core event metadata.
```
- id (UUID, PK)
- title (text)
- description (text)
- event_date (date)
- location (text)
- created_at (timestamp)
- updated_at (timestamp)
```

#### `segments`
Stores session/segment details with scheduling and capacity controls.
```
- id (UUID, PK)
- event_id (UUID, FK → events)
- title (text)
- description (text)
- start_time (time)
- end_time (time)
- room_name (text)
- segment_status (enum: 'Not Started' | 'Ongoing' | 'Finished' | 'Skipped')
- room_capacity (enum: 'VACANT' | 'FILLING' | 'FULL' | 'AT CAPACITY')
- created_at (timestamp)
- updated_at (timestamp)
```

#### `segment_speakers`
Junction table linking segments to speakers.
```
- id (UUID, PK)
- segment_id (UUID, FK → segments)
- speaker_id (UUID, FK → speakers)
- created_at (timestamp)
```

#### `speakers`
Stores speaker profiles.
```
- id (UUID, PK)
- event_id (UUID, FK → events)
- name (text)
- bio (text)
- role (text)
- company (text)
- linkedin_url (text, nullable)
- created_at (timestamp)
- updated_at (timestamp)
```

#### `notifications`
Stores broadcast messages linked to events.
```
- id (UUID, PK)
- event_id (UUID, FK → events)
- title (text)
- message (text)
- created_at (timestamp)
- updated_at (timestamp)
```

#### `users`
Stores attendee profiles and account settings.
```
- id (UUID, PK, FK → auth.users)
- email (text)
- full_name (text, nullable)
- linkedin_url (text, nullable)
- role (enum: 'USER' | 'ADMIN')
- created_at (timestamp)
- updated_at (timestamp)
```

### Real-time Subscriptions

- **Notifications Channel**: Admins broadcast to `event_id=eq.{selectedEventId}` filter; attendees subscribe to insert events on the `notifications` table
- **Automatic Triggers**: PostgreSQL triggers fire on `notifications` INSERT to notify all connected clients of the same event

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18 (check with `node --version`)
- **npm** or **yarn** (check with `npm --version`)
- **Supabase Account** ([sign up free](https://supabase.com))

### Setup

#### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/flowgram.git
cd flowgram/flowgram-frontend
```

#### 2. Install Dependencies

```bash
npm install
```

#### 3. Configure Environment Variables

Create a `.env.local` file in `flowgram-frontend/` and add your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

You can find these values in your [Supabase Project Settings](https://supabase.com/docs/guides/getting-started/tutorials/with-react#get-the-api-keys) → **API** → **Project URL** and **anon public key**.

#### 4. Run the Development Server

```bash
npm run dev
```

The app will start at `http://localhost:5173` (or another port if 5173 is in use).

#### 5. Build for Production

```bash
npm run build
```

Output is generated in `dist/`.

---

## 📂 Project Structure

```
flowgram-frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Toast.jsx        # Toast notification component
│   │   ├── ConnectModal.jsx # QR code networking modal
│   │   ├── UserRouteGuard.jsx
│   │   └── AdminRouteGuard.jsx
│   ├── layouts/             # Layout wrappers
│   │   ├── UserLayout.jsx   # Attendee app layout
│   │   ├── AdminLayout.jsx  # Admin dashboard layout
│   │   └── EventWorkspaceLayout.jsx
│   ├── pages/               # Page components
│   │   ├── admin/           # Admin pages
│   │   ├── user/            # Attendee pages
│   │   └── public/          # Public pages (login, landing)
│   ├── services/            # API integration
│   │   ├── supabase.js      # Supabase client & auth helpers
│   │   ├── events.js
│   │   ├── segments.js
│   │   ├── speakers.js
│   │   └── notifications.js
│   ├── routes/
│   │   └── router.jsx       # React Router configuration
│   ├── App.jsx              # Root component
│   └── main.jsx             # Entry point
├── public/                  # Static assets
├── index.html               # HTML template
├── package.json
├── vite.config.js
└── tailwind.config.js
```

---

## 🔐 Authentication & Authorization

- **Supabase Auth**: Email/password authentication via `auth.users` table
- **Role-based Access Control (RBAC)**: `users.role` column distinguishes ADMIN from USER
- **Route Guards**: `UserRouteGuard.jsx` and `AdminRouteGuard.jsx` protect role-specific routes
- **Row Level Security (RLS)**: Database policies ensure users only access their own data and event-scoped content

---

## 🎨 Design System

- **Color Palette**: Blue (#2563eb), Orange (#f97316), Slate grays, with soft shadows and rounded corners
- **Responsive Breakpoints**: Mobile-first approach; desktop nav and layouts adapt at 768px and above
- **Accessibility**: Semantic HTML, ARIA labels, keyboard navigation support (Escape to close modals)

---

## 📝 Key Features in Detail

### Real-time Notifications
- Admins broadcast messages from the Notifications page
- PostgreSQL trigger inserts into `notifications` table
- Supabase Realtime pushes INSERT events to all subscribed clients
- Attendees see instant toast notifications with title and message

### Live Segment Controls
- Admins adjust segment status and room capacity from the Admin Flow page
- Changes trigger immediate `.update()` calls to Supabase
- Attendees see live status badges on their Flow page (Ongoing, Finished, etc.)

### QR Code Networking
- Attendees set their LinkedIn URL in Account Settings
- Connect page generates a QR code pointing to their LinkedIn profile
- Peers scan the QR code at events to connect directly

### Chronological Grouping
- Segments are fetched ordered by `start_time` (ascending)
- Concurrent segments (same start time) are grouped visually
- Admin UI displays segments in responsive grid layout (1 col mobile, 2 cols lg, 3 cols xl)

---

## 🚢 Deployment to Vercel

1. **Push to GitHub**: Commit and push your code
   ```bash
   git add .
   git commit -m "Initial Flowgram deployment setup"
   git push origin main
   ```

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com) and sign in
   - Click **Add New** → **Project**
   - Import your GitHub repository
   - Set **Root Directory** to `flowgram-frontend/`

3. **Configure Environment Variables**:
   - In Vercel, go to **Settings** → **Environment Variables**
   - Add:
     ```
     VITE_SUPABASE_URL=https://your-project.supabase.co
     VITE_SUPABASE_ANON_KEY=your-anon-key-here
     ```

4. **Deploy**:
   - Click **Deploy**
   - Vercel will automatically build and deploy on every push to `main`

---

## 🐛 Troubleshooting

### "Missing Supabase environment variables"
- Ensure `.env.local` is in `flowgram-frontend/` (not the root)
- Double-check `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct
- Restart the dev server after updating `.env.local`

### "White Screen of Death" on App Start
- Check browser console for errors (F12 → Console)
- Verify Supabase credentials in `.env.local`
- Ensure Supabase project is running and not paused

### "Realtime notifications not working"
- Confirm Supabase Realtime is enabled for your project
- Check that `event_id` filter in subscription matches the selected event
- Verify RLS policies allow notification table reads

---

## 📚 Documentation & Resources

- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Router Documentation](https://reactrouter.com)

---

## 📄 License

This project is proprietary. All rights reserved.

---

## 🤝 Contributing

For internal team members, follow these guidelines:

1. Create a feature branch: `git checkout -b feature/your-feature-name`
2. Make changes and test locally
3. Push and open a pull request
4. Get review approval before merging to `main`

---

## 📞 Support

For questions or issues, contact the development team or open an issue on GitHub.

---

**Happy event managing! 🎉**
