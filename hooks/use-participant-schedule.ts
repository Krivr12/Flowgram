'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ParticipantSchedule } from '@/types';
import { mockParticipantSchedule } from '@/data/mock-data';

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
  const [error] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      // Phase 1: return mock schedule if userId/eventId match, else empty schedule
      if (
        mockParticipantSchedule.userId === userId &&
        mockParticipantSchedule.eventId === eventId
      ) {
        setSchedule({ ...mockParticipantSchedule });
      } else {
        setSchedule({
          id: `schedule-${userId}-${eventId}`,
          userId,
          eventId,
          selectedSegmentIds: [],
        });
      }
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [userId, eventId]);

  const toggleSegment = useCallback((segmentId: string) => {
    setSchedule((prev) => {
      if (!prev) return prev;
      const already = prev.selectedSegmentIds.includes(segmentId);
      return {
        ...prev,
        selectedSegmentIds: already
          ? prev.selectedSegmentIds.filter((id) => id !== segmentId)
          : [...prev.selectedSegmentIds, segmentId],
      };
    });
  }, []);

  return { schedule, toggleSegment, loading, error };
}
