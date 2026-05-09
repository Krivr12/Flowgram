'use client';

import { useState, useEffect } from 'react';
import type { Speaker } from '@/types';
import { mockSpeakers, mockSegments } from '@/data/mock-data';

export function useSpeakers(eventId: string): {
  speakers: Speaker[];
  loading: boolean;
  error: string | null;
} {
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      // Collect all speakerIds referenced in this event's segments
      const speakerIdSet = new Set<string>();
      mockSegments
        .filter((s) => s.eventId === eventId)
        .forEach((s) => s.speakerIds.forEach((id) => speakerIdSet.add(id)));

      setSpeakers(mockSpeakers.filter((sp) => speakerIdSet.has(sp.id)));
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [eventId]);

  return { speakers, loading, error };
}
