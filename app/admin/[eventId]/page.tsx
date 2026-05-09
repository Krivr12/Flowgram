
// Implementing SPEC-005
'use client';

import { useState, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Bell,
  AlertTriangle,
  Clock,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEvent } from '@/hooks/use-event';
import { useSegments } from '@/hooks/use-segments';
import { useSpeakers } from '@/hooks/use-speakers';
import { formatTimeRange, addMinutesToTime, cn } from '@/lib/utils';
import type { Segment, SegmentStatus, Speaker, Announcement } from '@/types';

// ─── Status Badge ─────────────────────────────────────────────────────────────

function SegmentStatusBadge({ status }: { status: SegmentStatus }) {
  const styles: Record<SegmentStatus, string> = {
    NOT_STARTED: 'bg-slate-500/20 text-slate-400',
    UP_NEXT: 'bg-blue-500/20 text-blue-400',
    ONGOING: 'bg-violet-500/20 text-violet-400',
    DONE: 'bg-green-500/20 text-green-400',
    CANCELLED: 'bg-red-500/20 text-red-400',
  };
  const labels: Record<SegmentStatus, string> = {
    NOT_STARTED: 'Not Started',
    UP_NEXT: 'Up Next',
    ONGOING: 'Ongoing',
    DONE: 'Done',
    CANCELLED: 'Cancelled',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

// ─── Segment Form ─────────────────────────────────────────────────────────────

interface SegmentFormData {
  name: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  isConcurrent: boolean;
  trackId: string;
  speakerIds: string[];
  status: SegmentStatus;
}

const defaultSegmentForm: SegmentFormData = {
  name: '',
  description: '',
  date: '',
  startTime: '',
  endTime: '',
  location: '',
  isConcurrent: false,
  trackId: '',
  speakerIds: [],
  status: 'NOT_STARTED',
};

function SegmentFormDialog({
  open,
  onOpenChange,
  initial,
  allSpeakers,
  onSave,
  title,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: SegmentFormData;
  allSpeakers: Speaker[];
  onSave: (data: SegmentFormData) => void;
  title: string;
}) {
  const [form, setForm] = useState<SegmentFormData>(initial ?? defaultSegmentForm);

  function update<K extends keyof SegmentFormData>(key: K, value: SegmentFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleSpeaker(id: string) {
    setForm((prev) => ({
      ...prev,
      speakerIds: prev.speakerIds.includes(id)
        ? prev.speakerIds.filter((s) => s !== id)
        : [...prev.speakerIds, id],
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(form);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="seg-name">Name *</Label>
            <Input
              id="seg-name"
              placeholder="Opening Keynote"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="seg-desc">Description</Label>
            <Textarea
              id="seg-desc"
              placeholder="Brief description of this session"
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="seg-date">Date *</Label>
            <Input
              id="seg-date"
              type="date"
              value={form.date}
              onChange={(e) => update('date', e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="seg-start">Start Time *</Label>
              <Input
                id="seg-start"
                type="time"
                value={form.startTime}
                onChange={(e) => update('startTime', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seg-end">End Time *</Label>
              <Input
                id="seg-end"
                type="time"
                value={form.endTime}
                onChange={(e) => update('endTime', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="seg-location">Location</Label>
            <Input
              id="seg-location"
              placeholder="Main Hall"
              value={form.location}
              onChange={(e) => update('location', e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="seg-concurrent">Concurrent Session</Label>
            <Switch
              id="seg-concurrent"
              checked={form.isConcurrent}
              onCheckedChange={(v) => update('isConcurrent', v)}
            />
          </div>

          {form.isConcurrent && (
            <div className="space-y-2">
              <Label htmlFor="seg-track">Track</Label>
              <Input
                id="seg-track"
                placeholder="Track A"
                value={form.trackId}
                onChange={(e) => update('trackId', e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => update('status', v as SegmentStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NOT_STARTED">Not Started</SelectItem>
                <SelectItem value="UP_NEXT">Up Next</SelectItem>
                <SelectItem value="ONGOING">Ongoing</SelectItem>
                <SelectItem value="DONE">Done</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {allSpeakers.length > 0 && (
            <div className="space-y-2">
              <Label>Speakers</Label>
              <div className="space-y-2">
                {allSpeakers.map((sp) => (
                  <label
                    key={sp.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={form.speakerIds.includes(sp.id)}
                      onChange={() => toggleSpeaker(sp.id)}
                      className="accent-violet-500"
                    />
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={sp.avatarUrl} alt={sp.name} />
                      <AvatarFallback className="text-[10px]">
                        {sp.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-white">{sp.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Segment</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Program Flow Tab ─────────────────────────────────────────────────────────

function ProgramFlowTab({
  segments,
  allSpeakers,
  onAdd,
  onEdit,
  onDelete,
}: {
  segments: Segment[];
  allSpeakers: Speaker[];
  onAdd: (data: SegmentFormData) => void;
  onEdit: (id: string, data: SegmentFormData) => void;
  onDelete: (id: string) => void;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Segment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Segment | null>(null);

  const sorted = [...segments].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.startTime.localeCompare(b.startTime);
  });

  function segmentToForm(seg: Segment): SegmentFormData {
    return {
      name: seg.name,
      description: seg.description ?? '',
      date: seg.date,
      startTime: seg.startTime,
      endTime: seg.endTime,
      location: seg.location ?? '',
      isConcurrent: seg.isConcurrent,
      trackId: seg.trackId ?? '',
      speakerIds: seg.speakerIds,
      status: seg.status,
    };
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-semibold">Program Flow</h2>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Segment
        </Button>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-400 text-sm">No segments yet. Add the first one.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 text-xs">
                <th className="text-left py-2 pr-4 font-medium">Time</th>
                <th className="text-left py-2 pr-4 font-medium">Name</th>
                <th className="text-left py-2 pr-4 font-medium">Location</th>
                <th className="text-left py-2 pr-4 font-medium">Track</th>
                <th className="text-left py-2 pr-4 font-medium">Status</th>
                <th className="text-left py-2 pr-4 font-medium">Speakers</th>
                <th className="text-right py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((seg) => {
                const speakers = seg.speakerIds
                  .map((id) => allSpeakers.find((s) => s.id === id))
                  .filter(Boolean) as Speaker[];
                return (
                  <tr key={seg.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-3 pr-4 text-slate-400 font-mono text-xs whitespace-nowrap">
                      {formatTimeRange(seg.startTime, seg.endTime)}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="text-white font-medium">{seg.name}</div>
                      {seg.isConcurrent && (
                        <span className="text-xs text-orange-400">Concurrent</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-slate-400 text-xs">{seg.location ?? '—'}</td>
                    <td className="py-3 pr-4 text-slate-400 text-xs">{seg.trackId ?? '—'}</td>
                    <td className="py-3 pr-4">
                      <SegmentStatusBadge status={seg.status} />
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex -space-x-1">
                        {speakers.length === 0 ? (
                          <span className="text-xs text-slate-500">TBA</span>
                        ) : (
                          speakers.slice(0, 3).map((sp) => (
                            <Avatar key={sp.id} className="h-6 w-6 border border-slate-800">
                              <AvatarImage src={sp.avatarUrl} alt={sp.name} />
                              <AvatarFallback className="text-[10px]">
                                {sp.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setEditTarget(seg)}
                          aria-label="Edit segment"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-400 hover:text-red-300"
                          onClick={() => setDeleteTarget(seg)}
                          aria-label="Delete segment"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Dialog */}
      <SegmentFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        allSpeakers={allSpeakers}
        onSave={onAdd}
        title="Add Segment"
      />

      {/* Edit Dialog */}
      {editTarget && (
        <SegmentFormDialog
          open={!!editTarget}
          onOpenChange={(v) => !v && setEditTarget(null)}
          initial={segmentToForm(editTarget)}
          allSpeakers={allSpeakers}
          onSave={(data) => {
            onEdit(editTarget.id, data);
            setEditTarget(null);
          }}
          title="Edit Segment"
        />
      )}

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{deleteTarget?.name}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The segment will be permanently removed from the program.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (deleteTarget) onDelete(deleteTarget.id);
                setDeleteTarget(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Speakers Tab ─────────────────────────────────────────────────────────────

interface SpeakerFormData {
  name: string;
  title: string;
  bio: string;
  avatarUrl: string;
}

const defaultSpeakerForm: SpeakerFormData = {
  name: '',
  title: '',
  bio: '',
  avatarUrl: '',
};

function SpeakerFormDialog({
  open,
  onOpenChange,
  initial,
  onSave,
  title,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: SpeakerFormData;
  onSave: (data: SpeakerFormData) => void;
  title: string;
}) {
  const [form, setForm] = useState<SpeakerFormData>(initial ?? defaultSpeakerForm);

  function update<K extends keyof SpeakerFormData>(key: K, value: SpeakerFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(form);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sp-name">Name *</Label>
            <Input
              id="sp-name"
              placeholder="Dr. Sarah Chen"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sp-title">Title *</Label>
            <Input
              id="sp-title"
              placeholder="Principal Developer Advocate, AWS"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sp-bio">Bio *</Label>
            <Textarea
              id="sp-bio"
              placeholder="Brief bio..."
              value={form.bio}
              onChange={(e) => update('bio', e.target.value)}
              rows={3}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sp-avatar">Avatar URL (optional)</Label>
            <Input
              id="sp-avatar"
              placeholder="https://..."
              value={form.avatarUrl}
              onChange={(e) => update('avatarUrl', e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Speaker</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SpeakersTab({
  speakers,
  segments,
  onAdd,
  onEdit,
  onDelete,
}: {
  speakers: Speaker[];
  segments: Segment[];
  onAdd: (data: SpeakerFormData) => void;
  onEdit: (id: string, data: SpeakerFormData) => void;
  onDelete: (id: string) => void;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Speaker | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Speaker | null>(null);

  function getAssignedCount(speakerId: string): number {
    return segments.filter((s) => s.speakerIds.includes(speakerId)).length;
  }

  function speakerToForm(sp: Speaker): SpeakerFormData {
    return { name: sp.name, title: sp.title, bio: sp.bio, avatarUrl: sp.avatarUrl ?? '' };
  }

  const assignedCount = deleteTarget ? getAssignedCount(deleteTarget.id) : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-semibold">Speakers</h2>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Speaker
        </Button>
      </div>

      {speakers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-400 text-sm">No speakers yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {speakers.map((sp) => (
            <div
              key={sp.id}
              className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3"
            >
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage src={sp.avatarUrl} alt={sp.name} />
                  <AvatarFallback>
                    {sp.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-white font-semibold text-sm">{sp.name}</p>
                  <p className="text-slate-400 text-xs">{sp.title}</p>
                </div>
              </div>
              <p className="text-slate-400 text-xs line-clamp-2">{sp.bio}</p>
              <div className="flex items-center justify-end gap-1 mt-auto">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setEditTarget(sp)}
                  aria-label="Edit speaker"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-red-400 hover:text-red-300"
                  onClick={() => setDeleteTarget(sp)}
                  aria-label="Delete speaker"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <SpeakerFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSave={onAdd}
        title="Add Speaker"
      />

      {editTarget && (
        <SpeakerFormDialog
          open={!!editTarget}
          onOpenChange={(v) => !v && setEditTarget(null)}
          initial={speakerToForm(editTarget)}
          onSave={(data) => {
            onEdit(editTarget.id, data);
            setEditTarget(null);
          }}
          title="Edit Speaker"
        />
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{deleteTarget?.name}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              {assignedCount > 0
                ? `This speaker is assigned to ${assignedCount} segment${assignedCount > 1 ? 's' : ''}. Remove them first or proceed to delete anyway.`
                : 'This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (deleteTarget) onDelete(deleteTarget.id);
                setDeleteTarget(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Live Control Tab ─────────────────────────────────────────────────────────

function LiveControlTab({
  segments,
  onStatusChange,
  onApplyDelay,
  onSendAnnouncement,
}: {
  segments: Segment[];
  onStatusChange: (id: string, status: SegmentStatus) => void;
  onApplyDelay: (minutes: number) => void;
  onSendAnnouncement: (announcement: Omit<Announcement, 'id' | 'sentAt' | 'sentBy'>) => void;
}) {
  const [delayMinutes, setDelayMinutes] = useState('');
  const [delayConfirmOpen, setDelayConfirmOpen] = useState(false);
  const [notifType, setNotifType] = useState<'NUDGE' | 'EMERGENCY'>('NUDGE');
  const [message, setMessage] = useState('');
  const [sentSuccess, setSentSuccess] = useState(false);

  const MAX_CHARS = 280;

  function handleDelaySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!delayMinutes || Number(delayMinutes) <= 0) return;
    setDelayConfirmOpen(true);
  }

  function confirmDelay() {
    onApplyDelay(Number(delayMinutes));
    setDelayMinutes('');
    setDelayConfirmOpen(false);
  }

  function handleSend() {
    if (!message.trim()) return;
    onSendAnnouncement({ eventId: segments[0]?.eventId ?? '', message, type: notifType });
    setSentSuccess(true);
    setMessage('');
    setTimeout(() => setSentSuccess(false), 3000);
  }

  const sortedSegments = [...segments].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.startTime.localeCompare(b.startTime);
  });

  return (
    <div className="space-y-8">
      {/* Section 1 — Push Schedule Back */}
      <section className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-4 w-4 text-orange-400" />
          <h3 className="text-white font-semibold">Push Schedule Back</h3>
        </div>
        <form onSubmit={handleDelaySubmit} className="flex items-end gap-3">
          <div className="space-y-2 flex-1">
            <Label htmlFor="delay-input">Delay (minutes)</Label>
            <Input
              id="delay-input"
              type="number"
              min="1"
              max="240"
              placeholder="15"
              value={delayMinutes}
              onChange={(e) => setDelayMinutes(e.target.value)}
            />
          </div>
          <Button type="submit" variant="outline" className="shrink-0">
            Apply Delay
          </Button>
        </form>
        <p className="text-xs text-slate-500 mt-2">
          Shifts all UP_NEXT and NOT_STARTED segments by the specified number of minutes.
        </p>
      </section>

      {/* Section 2 — Segment Status Control */}
      <section className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <h3 className="text-white font-semibold mb-4">Segment Status Control</h3>
        {sortedSegments.length === 0 ? (
          <p className="text-slate-400 text-sm">No segments to control.</p>
        ) : (
          <div className="space-y-2">
            {sortedSegments.map((seg) => (
              <div
                key={seg.id}
                className="flex items-center justify-between gap-4 py-2 border-b border-white/5 last:border-0"
              >
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium truncate">{seg.name}</p>
                  <p className="text-slate-500 text-xs font-mono">
                    {formatTimeRange(seg.startTime, seg.endTime)}
                  </p>
                </div>
                <Select
                  value={seg.status}
                  onValueChange={(v) => onStatusChange(seg.id, v as SegmentStatus)}
                >
                  <SelectTrigger className="w-36 shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NOT_STARTED">Not Started</SelectItem>
                    <SelectItem value="UP_NEXT">Up Next</SelectItem>
                    <SelectItem value="ONGOING">Ongoing</SelectItem>
                    <SelectItem value="DONE">Done</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Section 3 — Notifications Panel */}
      <section className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <h3 className="text-white font-semibold mb-4">Send Notification</h3>

        {/* Type Toggle */}
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setNotifType('NUDGE')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border',
              notifType === 'NUDGE'
                ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                : 'border-white/10 text-slate-400 hover:bg-white/5'
            )}
          >
            <Bell className="h-4 w-4" />
            Nudge
          </button>
          <button
            type="button"
            onClick={() => setNotifType('EMERGENCY')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border',
              notifType === 'EMERGENCY'
                ? 'bg-red-500/20 border-red-500/40 text-red-300'
                : 'border-white/10 text-slate-400 hover:bg-white/5'
            )}
          >
            <AlertTriangle className="h-4 w-4" />
            Emergency
          </button>
        </div>

        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="notif-message">Message</Label>
            <span className={cn('text-xs', message.length > MAX_CHARS ? 'text-red-400' : 'text-slate-500')}>
              {message.length}/{MAX_CHARS}
            </span>
          </div>
          <Textarea
            id="notif-message"
            placeholder={
              notifType === 'NUDGE'
                ? 'Reminder: Session starts in 10 minutes in Room A.'
                : 'URGENT: Please evacuate to the nearest exit immediately.'
            }
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, MAX_CHARS))}
            rows={3}
          />
        </div>

        {sentSuccess && (
          <div className="rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-2 mb-3">
            <p className="text-sm text-green-400">Notification sent to all participants.</p>
          </div>
        )}

        <Button
          onClick={handleSend}
          disabled={!message.trim() || message.length > MAX_CHARS}
          className={cn(
            'w-full',
            notifType === 'EMERGENCY' && 'bg-red-600 hover:bg-red-700'
          )}
        >
          <Send className="h-4 w-4" />
          Send to All Participants
        </Button>
      </section>

      {/* Delay Confirm Dialog */}
      <AlertDialog open={delayConfirmOpen} onOpenChange={setDelayConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apply Schedule Delay?</AlertDialogTitle>
            <AlertDialogDescription>
              Shift all UP_NEXT and NOT_STARTED segments by {delayMinutes} minute
              {Number(delayMinutes) !== 1 ? 's' : ''}? This will update start and end times for all
              upcoming sessions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelay}>Apply Delay</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminEventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const { event, loading: eventLoading } = useEvent(eventId);
  const { segments: hookSegments, loading: segmentsLoading } = useSegments(eventId);
  const { speakers: hookSpeakers } = useSpeakers(eventId);

  // Local state for CRUD (Phase 1)
  const [localSegments, setLocalSegments] = useState<Segment[]>([]);
  const [localSpeakers, setLocalSpeakers] = useState<Speaker[]>([]);

  const allSegments: Segment[] = [...hookSegments, ...localSegments];
  const allSpeakers: Speaker[] = [...hookSpeakers, ...localSpeakers];

  const loading = eventLoading || segmentsLoading;

  // ── Segment CRUD ────────────────────────────────────────────────────────────

  function handleAddSegment(data: SegmentFormData) {
    const newSeg: Segment = {
      id: `seg-${Date.now()}`,
      eventId,
      name: data.name,
      description: data.description || null,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      location: data.location || null,
      isConcurrent: data.isConcurrent,
      trackId: data.trackId || undefined,
      speakerIds: data.speakerIds,
      status: data.status,
    };
    setLocalSegments((prev) => [...prev, newSeg]);
  }

  function handleEditSegment(id: string, data: SegmentFormData) {
    // Try local first, then mark hook segment as overridden via local
    const isLocal = localSegments.some((s) => s.id === id);
    if (isLocal) {
      setLocalSegments((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                name: data.name,
                description: data.description || null,
                date: data.date,
                startTime: data.startTime,
                endTime: data.endTime,
                location: data.location || null,
                isConcurrent: data.isConcurrent,
                trackId: data.trackId || undefined,
                speakerIds: data.speakerIds,
                status: data.status,
              }
            : s
        )
      );
    } else {
      // For hook segments, add an override to localSegments and mark original as deleted
      const original = hookSegments.find((s) => s.id === id);
      if (original) {
        setLocalSegments((prev) => [
          ...prev.filter((s) => s.id !== id),
          {
            ...original,
            id,
            name: data.name,
            description: data.description || null,
            date: data.date,
            startTime: data.startTime,
            endTime: data.endTime,
            location: data.location || null,
            isConcurrent: data.isConcurrent,
            trackId: data.trackId || undefined,
            speakerIds: data.speakerIds,
            status: data.status,
          },
        ]);
      }
    }
  }

  function handleDeleteSegment(id: string) {
    setLocalSegments((prev) => prev.filter((s) => s.id !== id));
    // For hook segments, we track deletions via a separate set
    setDeletedSegmentIds((prev) => new Set([...prev, id]));
  }

  const [deletedSegmentIds, setDeletedSegmentIds] = useState<Set<string>>(new Set());
  const [deletedSpeakerIds, setDeletedSpeakerIds] = useState<Set<string>>(new Set());

  const visibleSegments = allSegments.filter((s) => !deletedSegmentIds.has(s.id));
  const visibleSpeakers = allSpeakers.filter((s) => !deletedSpeakerIds.has(s.id));

  // ── Speaker CRUD ────────────────────────────────────────────────────────────

  function handleAddSpeaker(data: SpeakerFormData) {
    const newSp: Speaker = {
      id: `speaker-${Date.now()}`,
      name: data.name,
      title: data.title,
      bio: data.bio,
      avatarUrl: data.avatarUrl || undefined,
    };
    setLocalSpeakers((prev) => [...prev, newSp]);
  }

  function handleEditSpeaker(id: string, data: SpeakerFormData) {
    const isLocal = localSpeakers.some((s) => s.id === id);
    if (isLocal) {
      setLocalSpeakers((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, name: data.name, title: data.title, bio: data.bio, avatarUrl: data.avatarUrl || undefined } : s
        )
      );
    } else {
      const original = hookSpeakers.find((s) => s.id === id);
      if (original) {
        setLocalSpeakers((prev) => [
          ...prev.filter((s) => s.id !== id),
          { ...original, id, name: data.name, title: data.title, bio: data.bio, avatarUrl: data.avatarUrl || undefined },
        ]);
      }
    }
  }

  function handleDeleteSpeaker(id: string) {
    setLocalSpeakers((prev) => prev.filter((s) => s.id !== id));
    setDeletedSpeakerIds((prev) => new Set([...prev, id]));
  }

  // ── Status Change ───────────────────────────────────────────────────────────

  function handleStatusChange(id: string, status: SegmentStatus) {
    const isLocal = localSegments.some((s) => s.id === id);
    if (isLocal) {
      setLocalSegments((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
    } else {
      const original = hookSegments.find((s) => s.id === id);
      if (original) {
        setLocalSegments((prev) => [
          ...prev.filter((s) => s.id !== id),
          { ...original, status },
        ]);
      }
    }
  }

  // ── Apply Delay ─────────────────────────────────────────────────────────────

  function handleApplyDelay(minutes: number) {
    const affected = visibleSegments.filter(
      (s) => s.status === 'NOT_STARTED' || s.status === 'UP_NEXT'
    );
    affected.forEach((seg) => {
      const newStart = addMinutesToTime(seg.startTime, minutes);
      const newEnd = addMinutesToTime(seg.endTime, minutes);
      handleEditSegment(seg.id, {
        name: seg.name,
        description: seg.description ?? '',
        date: seg.date,
        startTime: newStart,
        endTime: newEnd,
        location: seg.location ?? '',
        isConcurrent: seg.isConcurrent,
        trackId: seg.trackId ?? '',
        speakerIds: seg.speakerIds,
        status: seg.status,
      });
    });
  }

  // ── Send Announcement ───────────────────────────────────────────────────────

  function handleSendAnnouncement(data: Omit<Announcement, 'id' | 'sentAt' | 'sentBy'>) {
    // Phase 1: optimistic — just log. Phase 3: persist to Supabase.
    console.log('Announcement sent:', data);
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="border-b border-white/10 bg-slate-900/50">
        <div className="px-8 py-5 flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="icon" aria-label="Back to events">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            {loading ? (
              <Skeleton className="h-6 w-64" />
            ) : (
              <h1 className="text-xl font-bold text-white truncate">{event?.name ?? 'Event'}</h1>
            )}
            <p className="text-slate-400 text-sm mt-0.5">Event Builder</p>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <main className="px-8 py-6">
        <Tabs defaultValue="program">
          <TabsList className="mb-6">
            <TabsTrigger value="program">Program Flow</TabsTrigger>
            <TabsTrigger value="speakers">Speakers</TabsTrigger>
            <TabsTrigger value="live">Live Control</TabsTrigger>
          </TabsList>

          <TabsContent value="program">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
              </div>
            ) : (
              <ProgramFlowTab
                segments={visibleSegments}
                allSpeakers={visibleSpeakers}
                onAdd={handleAddSegment}
                onEdit={handleEditSegment}
                onDelete={handleDeleteSegment}
              />
            )}
          </TabsContent>

          <TabsContent value="speakers">
            <SpeakersTab
              speakers={visibleSpeakers}
              segments={visibleSegments}
              onAdd={handleAddSpeaker}
              onEdit={handleEditSpeaker}
              onDelete={handleDeleteSpeaker}
            />
          </TabsContent>

          <TabsContent value="live">
            <LiveControlTab
              segments={visibleSegments}
              onStatusChange={handleStatusChange}
              onApplyDelay={handleApplyDelay}
              onSendAnnouncement={handleSendAnnouncement}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
