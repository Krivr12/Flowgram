'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Speaker } from '@/types';

export function useSpeakers(eventId: string): {
  speakers: Speaker[];
  loading: boolean;
  error: string | null;
} {
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;
    const supabase = createClient();

    async function fetchSpeakers() {
      // Get all speakers assigned to any segment in this event
      const { data, error: sbError } = await supabase
        .from('speakers')
        .select(`
          *,
          segment_speakers!inner (
            segments!inner (
              event_id
            )
          )
        `)
        .eq('segment_speakers.segments.event_id', eventId);

      if (sbError) {
        setError(sbError.message);
      } else {
        // Deduplicate by id (join can produce duplicates)
        const seen = new Set<string>();
        const unique = (data ?? []).filter((row) => {
          if (seen.has(row.id)) return false;
          seen.add(row.id);
          return true;
        });

        setSpeakers(
          unique.map((row) => ({
            id: row.id,
            name: row.name,
            title: row.title ?? '',
            bio: row.bio ?? '',
            avatarUrl: row.avatar_url ?? undefined,
          }))
        );
      }
      setLoading(false);
    }

    fetchSpeakers();
  }, [eventId]);

  return { speakers, loading, error };
}
