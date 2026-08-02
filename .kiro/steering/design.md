# UI Design System

## Brand Colors

| Token | Hex | Usage |
|-------|-----|-------|
| Orange (primary) | `#FFA100` | CTAs, accent icons, active states, highlights, capacity pills |
| Blue (primary) | `#1B77CF` | Links, secondary buttons, input focus, interactive elements |
| Blue hover | `#155fa3` | Hover state for blue buttons |
| Orange hover | `#e89100` | Hover state for orange buttons |
| Slate dark | `#0f172a` | Headings, primary text |
| Slate mid | `#334155` / `#475569` | Body text |
| Slate light | `#64748b` / `#94a3b8` | Secondary/muted text, labels |
| Border | `#e2e8f0` | Card borders, dividers, input borders |
| Background | `#ffffff` / `#f8fafc` | Page backgrounds |
| Navy card | `#252F3E` | Dark cards (event card in admin flow, dark mode surfaces) |

## Typography

- **Font family:** Poppins (Google Fonts), fallback to system sans-serif
- Loaded via `<link>` in `index.html`
- Weights used: 400 (body), 500 (labels/nav), 600 (buttons/subheadings), 700–800 (headings)

## Component Patterns

### Buttons
- **Primary (blue):** `#1B77CF` background, white text, `border-radius: 9999px` (pill shape)
- **Primary (orange):** `#FFA100` background, white text, pill shape — used for main CTAs
- **Secondary/Cancel:** transparent background, border `#e2e8f0`, slate text, pill shape
- **Destructive (delete):** transparent background, red border `#fecaca`, red text `#dc2626`
- **Button layout in forms:** Cancel left, primary action right (flex row). Delete on separate row below (full width).

### Cards
- White background (dark: `#252F3E`), `border-radius: 12px`, `border: 1px solid #e2e8f0`
- Subtle shadow: `0 1px 3px rgba(0,0,0,0.06)`
- Hover: slightly elevated shadow + border darkens

### Inputs
- `padding: 10px 14px`, `border-radius: 8px`, `border: 1px solid #e2e8f0`
- Focus: border changes to `#1B77CF`
- Error: border changes to `#fca5a5`

### Status Badges
- Pill-shaped with dot indicator, colored by status:
  - Not Started: gray (`#f1f5f9` bg, `#94a3b8` dot)
  - Ongoing: yellow (`#fef3c7` bg, `#f59e0b` dot)
  - Finished: green (`#dcfce7` bg, `#22c55e` dot)
  - Skipped: red (`#fee2e2` bg, `#ef4444` dot)

### Capacity Pills / Badges
- Row of tappable pills (admin) or a single read-only badge (attendee)
- Active: colored background (green/yellow/orange/red), white text
- Inactive: white background, gray border, gray text
- Labels: **Open, Filling Up, Almost Full, Full** — never show the raw enum
- On the attendee side the badge is prefixed with a "Seat Capacity:" label

### Toasts
- Fixed position: `top: 16px; left: 16px; right: 16px`, centered, max-width 400px
- Slide-down animation from top
- Notification type: white card with orange left border accent
- Success/Error type: colored background (green/red)
- Text uses `word-break: break-word` to prevent clipping

### Modals (Confirmation)
- Centered overlay with `rgba(0,0,0,0.45)` backdrop
- White card, `border-radius: 14px`, `max-width: 340–400px`
- Title (16px bold) + description (14px) + action buttons (Cancel left, Confirm right)

### Search Inputs
- Full width, left-padded for search icon (36px)
- Search icon (magnifying glass SVG) positioned absolutely inside
- Focus: blue border

### Navigation (Mobile Bottom Nav)
- Fixed bottom, 64px height, `space-evenly` distribution
- Each item: fixed 60px width, icon (20px) + label (10px font)
- Active: `#1B77CF` color
- Hidden on dashboard (`/admin`) and account (`/admin/account`) pages

## Dark Mode Palette

| Token | Light | Dark |
|-------|-------|------|
| Page background | `#f8fafc` | `#1a222d` |
| Card surface | `#ffffff` | `#252F3E` |
| Raised surface (dropdown) | `#ffffff` | `#334155` |
| Border | `#e2e8f0` | `rgba(100,116,139,0.3)` |
| Heading text | `#0f172a` | `#e2e8f0` |
| Body text | `#475569` | `#cbd5e1` |
| Muted text | `#64748b` | `#94a3b8` |
| Hover surface | `#f8fafc` | `rgba(100,116,139,0.1)` |

Semantic banners and badges in dark mode use a translucent tint plus light text rather
than the light-mode pastel fills:

| Meaning | Light bg / text | Dark bg / text |
|---------|-----------------|----------------|
| Success | `#f0fdf4` / `#166534` | `rgba(34,197,94,0.15)` / `#6ee7b7` |
| Warning | `#fef3c7` / `#b45309` | `rgba(251,191,36,0.15)` / `#fcd34d` |
| Error | `#fef2f2` / `#dc2626` | `rgba(220,38,38,0.1)` / `#fca5a5` |
| Neutral | `#f1f5f9` / `#334155` | `rgba(100,116,139,0.2)` / `#cbd5e1` |

Brand orange/blue stay the same in both themes. White text on a saturated brand button
is correct in both themes and needs no conditional.

## Layout Rules

- Mobile-first: single column, stacked vertically
- Desktop (768px+): multi-column where appropriate
- Page content padding: `40px 16px` with bottom padding for mobile nav clearance
- Max content width varies by page (forms: 680px, account: 500px, flow: full width)
- Time/location in cards: always stacked vertically (separate lines) for consistency
