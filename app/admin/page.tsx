// Implementing SPEC-004
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Calendar, MapPin, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEvents } from '@/hooks/use-events';
import { formatDateRange } from '@/lib/utils';
import type { Event, EventStatus, Modality } from '@/types';

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

function AdminEventCard({ event }: { event: Event }) {
  // Simulated participant count
  const participantCount = Math.floor(Math.random() * 200) + 20;

  return (
    <Link href={`/admin/${event.id}`}>
      <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-5 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer group h-full flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="text-white font-semibold leading-snug group-hover:text-violet-300 transition-colors">
            {event.name}
          </h3>
          <EventStatusBadge status={event.status} />
        </div>

        {event.description && (
          <p className="text-slate-400 text-sm mb-4 line-clamp-2 flex-1">{event.description}</p>
        )}

        <div className="space-y-1.5 mt-auto">
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>{formatDateRange(event.startDate, event.endDate)}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{event.venue}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <Users className="h-3.5 w-3.5 shrink-0" />
            <span>{participantCount} participants</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function EventCardSkeleton() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
      <div className="flex justify-between">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
      <div className="space-y-1.5 pt-2">
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}

// ─── Create Event Form ────────────────────────────────────────────────────────

interface CreateEventFormData {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  venue: string;
  modality: Modality;
  status: EventStatus;
}

const defaultForm: CreateEventFormData = {
  name: '',
  description: '',
  startDate: '',
  endDate: '',
  venue: '',
  modality: 'ONSITE',
  status: 'DRAFT',
};

function CreateEventDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreate: (data: CreateEventFormData) => void;
}) {
  const [form, setForm] = useState<CreateEventFormData>(defaultForm);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onCreate(form);
    setForm(defaultForm);
    onOpenChange(false);
  }

  function update<K extends keyof CreateEventFormData>(key: K, value: CreateEventFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Event</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="event-name">Name *</Label>
            <Input
              id="event-name"
              placeholder="AWS Community Day 2027"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-desc">Description</Label>
            <Input
              id="event-desc"
              placeholder="Brief description of the event"
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="event-start">Start Date *</Label>
              <Input
                id="event-start"
                type="datetime-local"
                value={form.startDate}
                onChange={(e) => update('startDate', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-end">End Date *</Label>
              <Input
                id="event-end"
                type="datetime-local"
                value={form.endDate}
                onChange={(e) => update('endDate', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-venue">Venue *</Label>
            <Input
              id="event-venue"
              placeholder="Singapore Expo, Hall 6"
              value={form.venue}
              onChange={(e) => update('venue', e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Modality</Label>
              <Select value={form.modality} onValueChange={(v) => update('modality', v as Modality)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ONSITE">Onsite</SelectItem>
                  <SelectItem value="ONLINE">Online</SelectItem>
                  <SelectItem value="HYBRID">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => update('status', v as EventStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="UPCOMING">Upcoming</SelectItem>
                  <SelectItem value="ONGOING">Ongoing</SelectItem>
                  <SelectItem value="DONE">Done</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Event</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const { events: hookEvents, loading } = useEvents();
  const [localEvents, setLocalEvents] = useState<Event[]>([]);
  const [createOpen, setCreateOpen] = useState(false);

  const allEvents = [...hookEvents, ...localEvents];

  function handleCreate(data: CreateEventFormData) {
    const newEvent: Event = {
      id: `event-${Date.now()}`,
      name: data.name,
      description: data.description || null,
      startDate: data.startDate ? new Date(data.startDate).toISOString() : new Date().toISOString(),
      endDate: data.endDate ? new Date(data.endDate).toISOString() : new Date().toISOString(),
      venue: data.venue,
      modality: data.modality,
      status: data.status,
    };
    setLocalEvents((prev) => [newEvent, ...prev]);
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Page Header */}
      <header className="border-b border-white/10 bg-slate-900/50">
        <div className="px-8 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Events</h1>
            <p className="text-slate-400 text-sm mt-0.5">Manage your events and programs</p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Create Event
          </Button>
        </div>
      </header>

      {/* Grid */}
      <main className="px-8 py-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <EventCardSkeleton key={i} />)}
          </div>
        ) : allEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-5xl mb-4">📋</div>
            <h3 className="text-white font-semibold mb-1">No events yet</h3>
            <p className="text-slate-400 text-sm mb-4">Create your first event to get started.</p>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Create Event
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allEvents.map((event) => (
              <AdminEventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </main>

      <CreateEventDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreate={handleCreate}
      />
    </div>
  );
}
