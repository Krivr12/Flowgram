'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { ParticipantSchedule } from '@/types';

export function useParticipantSchedule(
  userId: string,
  eventId: string
): {
  schedule: ParticipantSchedule | null;
  toggleSegment: (segmentId: string) => void;
  loading: boolean;
  error: string | null;
} {
  const [schedule, setSchedule] = useState<ParticipantSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || !eventId) return;
    const supabase = createClient();

    async function fetchSchedule() {
      const { data, error: sbError } = await supabase
        .from('participant_schedules')
        .select('*')
        .eq('user_id', userId)
        .eq('event_id', eventId)
        .maybeSingle();

      if (sbError) {
        setError(sbError.message);
        setLoading(false);
        return;
      }

      if (data) {
        setSchedule({
          id: data.id,
          userId: data.user_id,
          eventId: data.event_id,
          selectedSegmentIds: data.selected_segment_ids ?? [],
        });
      } else {
        // No schedule yet — create an empty one in the DB
        const { data: created, error: insertError } = await supabase
          .from('participant_schedules')
          .insert({ user_id: userId, event_id: eventId, selected_segment_ids: [] })
          .select()
          .single();

        if (insertError) {
          setError(insertError.message);
        } else if (created) {
          setSchedule({
            id: created.id,
            userId: created.user_id,
            eventId: created.event_id,
            selectedSegmentIds: [],
          });
        }
      }
      setLoading(false);
    }

    fetchSchedule();
  }, [userId, eventId]);

  const toggleSegment = useCallback(
    async (segmentId: string) => {
      if (!schedule) return;
      const supabase = createClient();

      const already = schedule.selectedSegmentIds.includes(segmentId);
      const updated = already
        ? schedule.selectedSegmentIds.filter((id) => id !== segmentId)
        : [...schedule.selectedSegmentIds, segmentId];

      // Optimistic update
      setSchedule((prev) =>
        prev ? { ...prev, selectedSegmentIds: updated } : prev
      );

      // Persist to Supabase
      const { error: sbError } = await supabase
        .from('participant_schedules')
        .update({ selected_segment_ids: updated })
        .eq('id', schedule.id);

      if (sbError) {
        // Rollback on failure
        setSchedule((prev) =>
          prev ? { ...prev, selectedSegmentIds: schedule.selectedSegmentIds } : prev
        );
        setError(sbError.message);
      }
    },
    [schedule]
  );

  return { schedule, toggleSegment, loading, error };
}
