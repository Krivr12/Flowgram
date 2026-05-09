'use client';

import { useState, useEffect } from 'react';
import type { Segment } from '@/types';
import { mockSegments } from '@/data/mock-data';

export function useSegments(eventId: string): {
  segments: Segment[];
  loading: boolean;
  error: string | null;
} {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSegments(mockSegments.filter((s) => s.eventId === eventId));
      setLoading(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [eventId]);

  return { segments, loading, error };
}
