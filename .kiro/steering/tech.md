# Tech Stack & Build

## Core Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 (JSX, no TypeScript) |
| Build tool | Vite 8 |
| Styling | Tailwind CSS 4 (utility-first) + inline styles |
| Backend/DB | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth (Google OAuth + email/password) |
| Real-time | HTTP polling (notifications every 15s) |
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
