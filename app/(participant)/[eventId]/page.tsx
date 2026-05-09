// Implementing SPEC-003
'use client';

import { useState, useRef, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, Calendar, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useEvent } from '@/hooks/use-event';
import { useSegments } from '@/hooks/use-segments';
import { useSpeakers } from '@/hooks/use-speakers';
import { useParticipantSchedule } from '@/hooks/use-participant-schedule';
import { formatDateRange, formatTimeRange, cn } from '@/lib/utils';
import type { Segment, SegmentStatus, EventStatus, Speaker } from '@/types';

// ─── Constants ────────────────────────────────────────────────────────────────

const DEMO_USER_ID = 'user-demo';

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

function SegmentStatusBadge({ status }: { status: SegmentStatus }) {
  const styles: Record<SegmentStatus, string> = {
    NOT_STARTED: 'bg-slate-500/20 text-slate-500',
    UP_NEXT: 'bg-blue-500/20 text-blue-400',
    ONGOING: 'bg-violet-500/20 text-violet-400',
    DONE: 'bg-green-500/20 text-green-400',
    CANCELLED: 'bg-red-500/20 text-red-400',
  };
  const labels: Record<SegmentStatus, string> = {
    NOT_STARTED: 'Not Started',
    UP_NEXT: 'Up Next',
    ONGOING: 'Live',
    DONE: 'Done',
    CANCELLED: 'Cancelled',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${styles[status]}`}>
      {status === 'ONGOING' && (
        <span className="mr-1 h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse inline-block" />
      )}
      {labels[status]}
    </span>
  );
}

// ─── Speaker Avatars ──────────────────────────────────────────────────────────

function SpeakerAvatars({
  speakerIds,
  allSpeakers,
}: {
  speakerIds: string[];
  allSpeakers: Speaker[];
}) {
  const speakers = speakerIds
    .map((id) => allSpeakers.find((s) => s.id === id))
    .filter(Boolean) as Speaker[];

  if (speakers.length === 0) {
    return <span className="text-xs text-slate-500">TBA</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {speakers.slice(0, 3).map((sp) => (
          <Avatar key={sp.id} className="h-6 w-6 border border-slate-800">
            <AvatarImage src={sp.avatarUrl} alt={sp.name} />
            <AvatarFallback className="text-[10px]">
              {sp.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
            </AvatarFallback>
          </Avatar>
        ))}
      </div>
      <span className="text-xs text-slate-400">
        {speakers.map((s) => s.name).join(', ')}
      </span>
    </div>
  );
}

// ─── Segment Card ─────────────────────────────────────────────────────────────

function SegmentCard({
  segment,
  allSpeakers,
  isSelected,
  isConcurrentGroup,
  onSelect,
}: {
  segment: Segment;
  allSpeakers: Speaker[];
  isSelected: boolean;
  isConcurrentGroup: boolean;
  onSelect?: () => void;
}) {
  const { status } = segment;

  const cardClass = cn(
    'bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 transition-all',
    status === 'NOT_STARTED' && 'opacity-70',
    status === 'ONGOING' && 'ring-2 ring-violet-500/50',
    status === 'DONE' && 'opacity-50',
    status === 'CANCELLED' && 'opacity-40',
    isConcurrentGroup && isSelected && 'border-violet-500/50 bg-violet-500/10',
    isConcurrentGroup && 'cursor-pointer hover:border-white/30'
  );

  return (
    <div className={cardClass} onClick={isConcurrentGroup ? onSelect : undefined} role={isConcurrentGroup ? 'button' : undefined} tabIndex={isConcurrentGroup ? 0 : undefined} onKeyDown={isConcurrentGroup ? (e) => e.key === 'Enter' && onSelect?.() : undefined}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-500 font-mono mb-1">
            {formatTimeRange(segment.startTime, segment.endTime)}
          </p>
          <h3
            className={cn(
              'text-white font-semibold text-sm leading-snug',
              status === 'CANCELLED' && 'line-through text-slate-500'
            )}
          >
            {segment.name}
          </h3>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isConcurrentGroup && isSelected && (
            <div className="h-5 w-5 rounded-full bg-violet-600 flex items-center justify-center">
              <Check className="h-3 w-3 text-white" />
            </div>
          )}
          <SegmentStatusBadge status={status} />
        </div>
      </div>

      {segment.description && (
        <p className={cn('text-xs text-slate-400 mb-3 line-clamp-2', status === 'DONE' && 'text-slate-600')}>
          {segment.description}
        </p>
      )}

      <div className="flex items-center justify-between gap-2 flex-wrap">
        {segment.location && (
          <div className="flex items-center gap-1 text-slate-500 text-xs">
            <MapPin className="h-3 w-3" />
            <span>{segment.location}</span>
          </div>
        )}
        <SpeakerAvatars speakerIds={segment.speakerIds} allSpeakers={allSpeakers} />
      </div>
    </div>
  );
}

// ─── Concurrent Track Group ───────────────────────────────────────────────────

function ConcurrentGroup({
  segments,
  allSpeakers,
  selectedIds,
  onToggle,
}: {
  segments: Segment[];
  allSpeakers: Speaker[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-xs text-slate-500 font-medium">Concurrent Sessions — Select a Track</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {segments.map((seg) => (
          <SegmentCard
            key={seg.id}
            segment={seg}
            allSpeakers={allSpeakers}
            isSelected={selectedIds.includes(seg.id)}
            isConcurrentGroup
            onSelect={() => onToggle(seg.id)}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Day Timeline ─────────────────────────────────────────────────────────────

function DayTimeline({
  segments,
  allSpeakers,
  selectedIds,
  onToggle,
}: {
  segments: Segment[];
  allSpeakers: Speaker[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  // Group concurrent segments by startTime
  const groups: Array<{ time: string; segments: Segment[]; concurrent: boolean }> = [];
  const seen = new Set<string>();

  const sorted = [...segments].sort((a, b) => a.startTime.localeCompare(b.startTime));

  for (const seg of sorted) {
    if (seen.has(seg.id)) continue;
    if (seg.isConcurrent) {
      const concurrent = sorted.filter(
        (s) => s.isConcurrent && s.startTime === seg.startTime && !seen.has(s.id)
      );
      concurrent.forEach((s) => seen.add(s.id));
      groups.push({ time: seg.startTime, segments: concurrent, concurrent: true });
    } else {
      seen.add(seg.id);
      groups.push({ time: seg.startTime, segments: [seg], concurrent: false });
    }
  }

  return (
    <div className="space-y-4">
      {groups.map((group, i) =>
        group.concurrent ? (
          <ConcurrentGroup
            key={`concurrent-${group.time}-${i}`}
            segments={group.segments}
            allSpeakers={allSpeakers}
            selectedIds={selectedIds}
            onToggle={onToggle}
          />
        ) : (
          <SegmentCard
            key={group.segments[0].id}
            segment={group.segments[0]}
            allSpeakers={allSpeakers}
            isSelected={false}
            isConcurrentGroup={false}
          />
        )
      )}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function TimelineSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

// ─── Pull-to-Refresh ──────────────────────────────────────────────────────────

function usePullToRefresh(onRefresh: () => void) {
  const startY = useRef(0);
  const pulling = useRef(false);

  function onTouchStart(e: React.TouchEvent) {
    startY.current = e.touches[0].clientY;
    pulling.current = window.scrollY === 0;
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (!pulling.current) return;
    const delta = e.changedTouches[0].clientY - startY.current;
    if (delta > 80) {
      onRefresh();
    }
    pulling.current = false;
  }

  return { onTouchStart, onTouchEnd };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ParticipantEventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const { event, loading: eventLoading } = useEvent(eventId);
  const { segments, loading: segmentsLoading } = useSegments(eventId);
  const { speakers } = useSpeakers(eventId);
  const { schedule, toggleSegment } = useParticipantSchedule(DEMO_USER_ID, eventId);

  const loading = eventLoading || segmentsLoading;

  // Derive unique dates from segments
  const uniqueDates = [...new Set(segments.map((s) => s.date))].sort();

  const pullHandlers = usePullToRefresh(() => {
    // Phase 3: trigger refetch
    window.location.reload();
  });

  return (
    <div className="min-h-screen bg-slate-950" {...pullHandlers}>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-md mx-auto flex items-center gap-3 px-4 h-14">
          <Link href="/">
            <Button variant="ghost" size="icon" aria-label="Back to events">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <span className="text-white font-semibold text-sm truncate flex-1">
            {event?.name ?? 'Loading…'}
          </span>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        {/* Event Info */}
        {loading ? (
          <div className="space-y-2 mb-6">
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : event ? (
          <div className="mb-6">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h1 className="text-xl font-bold text-white leading-tight">{event.name}</h1>
              <EventStatusBadge status={event.status} />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                <span>{formatDateRange(event.startDate, event.endDate)}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span>{event.venue}</span>
              </div>
            </div>
          </div>
        ) : null}

        {/* Day Tabs */}
        {loading ? (
          <TimelineSkeleton />
        ) : uniqueDates.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-400">No sessions scheduled yet.</p>
          </div>
        ) : (
          <Tabs defaultValue={uniqueDates[0]}>
            <TabsList className="w-full mb-6 overflow-x-auto">
              {uniqueDates.map((date, i) => (
                <TabsTrigger key={date} value={date} className="flex-1">
                  Day {i + 1}
                </TabsTrigger>
              ))}
            </TabsList>

            {uniqueDates.map((date) => {
              const daySegments = segments.filter((s) => s.date === date);
              return (
                <TabsContent key={date} value={date}>
                  <DayTimeline
                    segments={daySegments}
                    allSpeakers={speakers}
                    selectedIds={schedule?.selectedSegmentIds ?? []}
                    onToggle={toggleSegment}
                  />
                </TabsContent>
              );
            })}
          </Tabs>
        )}
      </main>
    </div>
  );
}
