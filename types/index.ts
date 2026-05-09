export type EventStatus = 'DRAFT' | 'UPCOMING' | 'ONGOING' | 'DONE' | 'CANCELLED';
export type SegmentStatus = 'NOT_STARTED' | 'UP_NEXT' | 'ONGOING' | 'DONE' | 'CANCELLED';
export type Modality = 'ONLINE' | 'ONSITE' | 'HYBRID';

export interface Event {
  id: string;
  name: string;
  description: string | null;
  startDate: string;   // ISO 8601
  endDate: string;     // ISO 8601
  venue: string;
  status: EventStatus;
  modality: Modality;
}

export interface Speaker {
  id: string;
  name: string;
  title: string;
  bio: string;
  avatarUrl?: string;
}

export interface Track {
  id: string;
  eventId: string;
  name: string;        // e.g. "Room A", "Track 1"
  color?: string;      // Tailwind color token for visual differentiation
}

export interface Segment {
  id: string;
  eventId: string;
  name: string;
  description: string | null;
  date: string;        // ISO 8601 date (YYYY-MM-DD)
  location: string | null;
  trackId?: string;
  isConcurrent: boolean;
  startTime: string;   // HH:mm (24-hour)
  endTime: string;     // HH:mm (24-hour)
  status: SegmentStatus;
  speakerIds: string[];
}

export interface ParticipantSchedule {
  id: string;
  userId: string;
  eventId: string;
  selectedSegmentIds: string[];
}

export interface Announcement {
  id: string;
  eventId: string;
  message: string;
  type: 'NUDGE' | 'EMERGENCY';
  sentAt: string;      // ISO 8601
  sentBy: string;      // admin userId
}
