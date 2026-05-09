'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Segment, SegmentStatus } from '@/types';

export function useSegments(eventId: string): {
  segments: Segment[];
  loading: boolean;
  error: string | null;
} {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;
    const supabase = createClient();

    async function fetchSegments() {
      // Fetch segments with their speaker IDs via the join table
      const { data, error: sbError } = await supabase
        .from('segments')
        .select(`
          *,
          segment_speakers (
            speaker_id
          )
        `)
        .eq('event_id', eventId)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (sbError) {
        setError(sbError.message);
      } else {
        setSegments(
          (data ?? []).map((row) => ({
            id: row.id,
            eventId: row.event_id,
            name: row.name,
            description: row.description,
            date: row.date,
            location: row.location,
            trackId: row.track_id ?? undefined,
            isConcurrent: row.is_concurrent,
            startTime: row.start_time.slice(0, 5), // "HH:mm:ss" → "HH:mm"
            endTime: row.end_time.slice(0, 5),
            status: row.status as SegmentStatus,
            speakerIds: (row.segment_speakers ?? []).map(
              (ss: { speaker_id: string }) => ss.speaker_id
            ),
          }))
        );
      }
      setLoading(false);
    }

    fetchSegments();
  }, [eventId]);

  return { segments, loading, error };
}
