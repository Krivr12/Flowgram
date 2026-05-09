'use client';

import { useState, useEffect } from 'react';
import type { Event } from '@/types';
import { mockEvents } from '@/data/mock-data';

export function useEvent(eventId: string): {
  event: Event | null;
  loading: boolean;
  error: string | null;
} {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const found = mockEvents.find((e) => e.id === eventId) ?? null;
      if (!found) {
        setError('Event not found.');
      } else {
        setEvent(found);
      }
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [eventId]);

  return { event, loading, error };
}
