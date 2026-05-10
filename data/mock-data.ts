import type { Event, Speaker, Track, Segment, ParticipantSchedule } from '@/types';

// ─── Events ──────────────────────────────────────────────────────────────────

export const mockEvents: Event[] = [
  {
    id: 'event-aws-2026',
    name: 'AWS Community Day 2026',
    description:
      'A full-day community-driven event celebrating cloud innovation, featuring talks on serverless, AI/ML, containers, and more.',
    startDate: '2026-08-01T09:00:00+08:00',
    endDate: '2026-08-02T17:00:00+08:00',
    venue: 'Singapore Expo, Hall 6',
    status: 'ONGOING',
    modality: 'ONSITE',
  },
  {
    id: 'event-devcon-2026',
    name: 'DevCon Philippines 2026',
    description: 'The largest developer conference in Southeast Asia.',
    startDate: '2026-10-15T08:00:00+08:00',
    endDate: '2026-10-16T18:00:00+08:00',
    venue: 'SMX Convention Center, Manila',
    status: 'UPCOMING',
    modality: 'HYBRID',
  },
  {
    id: 'event-cloud-summit-2025',
    name: 'Cloud Summit APAC 2025',
    description: 'Annual cloud summit for the Asia-Pacific region.',
    startDate: '2025-11-20T09:00:00+08:00',
    endDate: '2025-11-21T17:00:00+08:00',
    venue: 'Marina Bay Sands, Singapore',
    status: 'DONE',
    modality: 'ONSITE',
  },
];

// ─── Speakers ─────────────────────────────────────────────────────────────────

export const mockSpeakers: Speaker[] = [
  {
    id: 'speaker-sarah-chen',
    name: 'Dr. Sarah Chen',  
    title: 'Principal Developer Advocate, AWS APAC',
    bio: '15+ years in distributed systems. Author of "Designing for Scale." AWS Hero 2022. Frequent speaker at re:Invent and KubeCon.',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SarahChen',
  },
  {
    id: 'speaker-marcus-webb',
    name: 'Marcus Webb',
    title: 'Senior Solutions Architect, AWS',
    bio: 'Specializes in event-driven architectures and Lambda optimization. Maintainer of several open-source CDK constructs.',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MarcusWebb',
  },
  {
    id: 'speaker-priya-sharma',
    name: 'Priya Sharma',
    title: 'Machine Learning Engineer, Amazon Science',
    bio: 'PhD in Computer Vision from NUS. Works on SageMaker tooling. Passionate about making ML accessible for startups.',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=PriyaSharma',
  },
];

// ─── Tracks ───────────────────────────────────────────────────────────────────

export const mockTracks: Track[] = [
  { id: 'track-a', eventId: 'event-aws-2026', name: 'Track A — Room A', color: 'violet' },
  { id: 'track-b', eventId: 'event-aws-2026', name: 'Track B — Room B', color: 'orange' },
  { id: 'track-c', eventId: 'event-aws-2026', name: 'Track C — Room C', color: 'blue' },
  { id: 'track-d', eventId: 'event-aws-2026', name: 'Track D — Room D', color: 'green' },
];

// ─── Segments ─────────────────────────────────────────────────────────────────

export const mockSegments: Segment[] = [
  // ── Day 1 ──────────────────────────────────────────────────────────────────
  {
    id: 'seg-opening-keynote',
    eventId: 'event-aws-2026',
    name: 'Opening Keynote',
    description:
      'Kick off AWS Community Day 2026 with a look at the state of cloud in APAC, emerging trends, and what the community has been building.',
    date: '2026-08-01',
    location: 'Main Hall',
    isConcurrent: false,
    startTime: '09:00',
    endTime: '10:00',
    status: 'DONE',
    speakerIds: ['speaker-sarah-chen'],
  },
  {
    id: 'seg-serverless-deep-dive',
    eventId: 'event-aws-2026',
    name: 'Serverless Deep Dive',
    description:
      'A hands-on exploration of advanced Lambda patterns, event-driven design, and CDK best practices for production workloads.',
    date: '2026-08-01',
    location: 'Room A',
    trackId: 'track-a',
    isConcurrent: true,
    startTime: '10:30',
    endTime: '12:00',
    status: 'ONGOING',
    speakerIds: ['speaker-marcus-webb'],
  },
  {
    id: 'seg-aiml-workshop',
    eventId: 'event-aws-2026',
    name: 'AI/ML Workshop',
    description:
      'Practical workshop on building and deploying ML models with SageMaker. Bring your laptop — we will train a model live.',
    date: '2026-08-01',
    location: 'Room B',
    trackId: 'track-b',
    isConcurrent: true,
    startTime: '10:30',
    endTime: '12:00',
    status: 'ONGOING',
    speakerIds: ['speaker-priya-sharma'],
  },

  // ── Day 2 ──────────────────────────────────────────────────────────────────
  {
    id: 'seg-containers-k8s',
    eventId: 'event-aws-2026',
    name: 'Containers & Kubernetes',
    description:
      'Deep dive into EKS, Fargate, and container orchestration patterns for high-availability production systems.',
    date: '2026-08-02',
    location: 'Room A',
    trackId: 'track-a',
    isConcurrent: true,
    startTime: '09:00',
    endTime: '12:00',
    status: 'NOT_STARTED',
    speakerIds: ['speaker-marcus-webb'],
  },
  {
    id: 'seg-data-engineering',
    eventId: 'event-aws-2026',
    name: 'Data Engineering on AWS',
    description:
      'Building modern data pipelines with Glue, Athena, and Redshift. Real-world patterns for data lake architecture.',
    date: '2026-08-02',
    location: 'Room B',
    trackId: 'track-b',
    isConcurrent: true,
    startTime: '09:00',
    endTime: '12:00',
    status: 'NOT_STARTED',
    speakerIds: ['speaker-priya-sharma'],
  },
  {
    id: 'seg-security-best-practices',
    eventId: 'event-aws-2026',
    name: 'Security Best Practices',
    description:
      'IAM, GuardDuty, Security Hub, and zero-trust architecture patterns for cloud-native applications.',
    date: '2026-08-02',
    location: 'Room C',
    trackId: 'track-c',
    isConcurrent: true,
    startTime: '09:00',
    endTime: '12:00',
    status: 'NOT_STARTED',
    speakerIds: ['speaker-sarah-chen'],
  },
  {
    id: 'seg-cost-optimization',
    eventId: 'event-aws-2026',
    name: 'Cost Optimization Strategies',
    description:
      'Practical techniques for reducing your AWS bill: right-sizing, Savings Plans, Spot Instances, and FinOps culture.',
    date: '2026-08-02',
    location: 'Room D',
    trackId: 'track-d',
    isConcurrent: true,
    startTime: '09:00',
    endTime: '12:00',
    status: 'NOT_STARTED',
    speakerIds: [],
  },
  {
    id: 'seg-closing-ceremony',
    eventId: 'event-aws-2026',
    name: 'Closing Ceremony',
    description:
      'Wrap up AWS Community Day 2026 with community awards, raffle draws, and a look ahead to next year.',
    date: '2026-08-02',
    location: 'Main Hall',
    isConcurrent: false,
    startTime: '13:00',
    endTime: '14:00',
    status: 'NOT_STARTED',
    speakerIds: ['speaker-sarah-chen', 'speaker-marcus-webb', 'speaker-priya-sharma'],
  },
];

// ─── Participant Schedule ─────────────────────────────────────────────────────

export const mockParticipantSchedule: ParticipantSchedule = {
  id: 'schedule-demo-user',
  userId: 'user-demo',
  eventId: 'event-aws-2026',
  selectedSegmentIds: ['seg-serverless-deep-dive'],
};
