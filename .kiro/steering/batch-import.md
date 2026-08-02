---
inclusion: manual
---

# Batch Import Segments

## How It Works

The batch import feature allows admins to insert multiple segments at once into an event. It runs client-side using the authenticated user's session (bypasses RLS).

## Implementation Pattern

Add this to `AdminSegmentsPage.jsx` (or a dedicated page):

### 1. Import `createSegment`

```js
import { createSegment } from '../../services/segments'
```

### 2. Define segments array

```js
const DATE = '2026-08-22' // event date
const batchSegments = [
  { title: 'Opening Spiel', room: '15th Floor', start: '09:00', end: '09:10' },
  { title: 'Event Reminders', room: '15th Floor', start: '09:10', end: '09:20' },
  // ... more segments
]
```

### 3. Handler function

```js
const handleBatchImport = async () => {
  setBatchImporting(true)
  let successCount = 0
  let failCount = 0

  for (const seg of batchSegments) {
    const result = await createSegment({
      event_id: eventId,
      title: seg.title,
      room_name: seg.room,
      start_time: `${DATE}T${seg.start}:00`,
      end_time: `${DATE}T${seg.end}:00`,
      segment_status: 'Not Started',
      capacity_status: 'VACANT',
    })
    if (result.success) successCount++
    else failCount++
  }

  setBatchImporting(false)
  setBatchMsg(`Done! ${successCount} segments added.`)
  loadSegments() // refresh list
}
```

### 4. Remove Duplicates (safety net)

If accidentally run twice, use this to deduplicate:

```js
const handleRemoveDuplicates = async () => {
  const groups = {}
  for (const seg of segments) {
    const key = `${seg.title}||${seg.start_time}`
    if (!groups[key]) groups[key] = []
    groups[key].push(seg)
  }

  let deletedCount = 0
  for (const key of Object.keys(groups)) {
    if (groups[key].length > 1) {
      const dupes = groups[key].slice(1) // keep first, delete rest
      for (const dupe of dupes) {
        const { error } = await supabase
          .from('segments')
          .delete()
          .eq('id', dupe.id)
        if (!error) deletedCount++
      }
    }
  }
  loadSegments()
}
```

## Segment Data Format

Each segment needs:
- `event_id` — UUID of the event
- `title` — segment name
- `room_name` — location string (e.g. "15th Floor", "21st Floor")
- `start_time` — ISO timestamp (`YYYY-MM-DDTHH:mm:00`)
- `end_time` — ISO timestamp
- `segment_status` — enum: `'Not Started'` | `'Ongoing'` | `'Finished'` | `'Skipped'`
- `capacity_status` — enum: `'VACANT'` | `'FILLING'` | `'ALMOST FULL'` | `'FULL'`

## Notes

- Must be run while logged in as an admin (uses authenticated session for RLS)
- Segments are inserted sequentially (not bulk) to avoid partial failures
- After import, remove the batch import code from the page — it's a one-time utility
- For new events, just update the `DATE`, `eventId`, and the segments array
