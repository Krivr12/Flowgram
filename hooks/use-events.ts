'use client';

import { useState, useEffect } from 'react';
import type { Event } from '@/types';
import { mockEvents } from '@/data/mock-data';

export function useEvents(): {
  events: Event[];
  loading: boolean;
  error: string | null;
} {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error] = useState<string | null>(null);

  useEffect(() => {
    // Phase 1: Simulate async load with mock data
    const timer = setTimeout(() => {
      setEvents(mockEvents);
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  return { events, loading, error };
}
