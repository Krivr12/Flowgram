'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Event, EventStatus, Modality } from '@/types';

export function useEvent(eventId: string): {
  event: Event | null;
  loading: boolean;
  error: string | null;
} {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;
    const supabase = createClient();

    async function fetchEvent() {
      const { data, error: sbError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (sbError) {
        setError(sbError.message);
      } else if (data) {
        setEvent({
          id: data.id,
          name: data.name,
          description: data.description,
          startDate: data.start_date,
          endDate: data.end_date,
          venue: data.venue,
          status: data.status as EventStatus,
          modality: data.modality as Modality,
        });
      }
      setLoading(false);
    }

    fetchEvent();
  }, [eventId]);

  return { event, loading, error };
}
