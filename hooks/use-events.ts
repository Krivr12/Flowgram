'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Event, EventStatus, Modality } from '@/types';

export function useEvents(): {
  events: Event[];
  loading: boolean;
  error: string | null;
} {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function fetchEvents() {
      const { data, error: sbError } = await supabase
        .from('events')
        .select('*')
        .order('start_date', { ascending: true });

      if (sbError) {
        setError(sbError.message);
      } else {
        setEvents(
          (data ?? []).map((row) => ({
            id: row.id,
            name: row.name,
            description: row.description,
            startDate: row.start_date,
            endDate: row.end_date,
            venue: row.venue,
            status: row.status as EventStatus,
            modality: row.modality as Modality,
          }))
        );
      }
      setLoading(false);
    }

    fetchEvents();
  }, []);

  return { events, loading, error };
}
