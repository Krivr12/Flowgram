// Implementing SPEC-002
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, Calendar, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ParticipantSidebar } from '@/components/participant-sidebar';
import { useEvents } from '@/hooks/use-events';
import { formatDateRange } from '@/lib/utils';
import type { Event, EventStatus } from '@/types';

// ─── Status Badge ─────────────────────────────────────────────────────────────

function EventStatusBadge({ status }: { status: EventStatus }) {
  const styles: Record<EventStatus, string> = {
    DRAFT: 'bg-slate-500/20 text-slate-400',
    UPCOMING: 'bg-blue-500/20 text-blue-400',
    ONGOING: 'bg-violet-500/20 text-violet-400',
    DONE: 'bg-green-500/20 text-green-400',
    CANCELLED: 'bg-red-500/20 text-red-400',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[status]}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

// ─── Event Card ───────────────────────────────────────────────────────────────

function EventCard({ event }: { event: Event }) {
  return (
    <Link href={`/${event.id}`}>
      <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer group">
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="text-white font-semibold text-sm leading-snug group-hover:text-violet-300 transition-colors">
            {event.name}
          </h3>
          <EventStatusBadge status={event.status} />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>{formatDateRange(event.startDate, event.endDate)}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{event.venue}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Skeleton Cards ───────────────────────────────────────────────────────────

function EventCardSkeleton() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
      <div className="flex justify-between">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ filter }: { filter: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-5xl mb-4">📭</div>
      <h3 className="text-white font-semibold mb-1">No events found</h3>
      <p className="text-slate-400 text-sm">
        {filter === 'all'
          ? 'No events have been created yet.'
          : `No ${filter.toLowerCase()} events at the moment.`}
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ParticipantHomePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { events, loading } = useEvents();

  const filterMap: Record<string, EventStatus[]> = {
    all: ['DRAFT', 'UPCOMING', 'ONGOING', 'DONE', 'CANCELLED'],
    upcoming: ['UPCOMING'],
    ongoing: ['ONGOING'],
  };

  function getFiltered(tab: string): Event[] {
    return events.filter((e) => filterMap[tab]?.includes(e.status));
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <ParticipantSidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />

      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-md mx-auto flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <span className="text-violet-400 font-bold text-lg">⚡</span>
            <span className="text-white font-bold text-lg">Flowgram</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-md mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Events</h1>
          <p className="text-slate-400 text-sm mt-1">Browse and join upcoming events</p>
        </div>

        <Tabs defaultValue="all">
          <TabsList className="w-full mb-6">
            <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
            <TabsTrigger value="upcoming" className="flex-1">Upcoming</TabsTrigger>
            <TabsTrigger value="ongoing" className="flex-1">Ongoing</TabsTrigger>
          </TabsList>

          {['all', 'upcoming', 'ongoing'].map((tab) => (
            <TabsContent key={tab} value={tab}>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <EventCardSkeleton key={i} />)}
                </div>
              ) : getFiltered(tab).length === 0 ? (
                <EmptyState filter={tab} />
              ) : (
                <div className="space-y-3">
                  {getFiltered(tab).map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </main>
    </div>
  );
}
