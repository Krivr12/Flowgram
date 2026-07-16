import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2, X, Users, MoreVertical, Edit2 } from 'lucide-react'
import { getAllSpeakers } from '../../services/speakers'
import {
  getSegmentsByEventId,
  createSegment,
  deleteSegment,
  updateSegment,
  addSpeakerToSegment,
  removeSpeakerFromSegment,
} from '../../services/segments'

const segmentSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  room_name: z.string().min(1, 'Room name is required'),
  start_time: z.string().min(1, 'Start time is required'),
  end_time: z.string().min(1, 'End time is required'),
  capacity_status: z.enum(['VACANT', 'MODERATE', 'FULL']),
})

const INPUT = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
  fontSize: '14px',
  color: '#0f172a',
  outline: 'none',
  boxSizing: 'border-box',
}

const LABEL = {
  display: 'block',
  fontSize: '13px',
  fontWeight: '500',
  color: '#475569',
  marginBottom: '6px',
}

const CAPACITY_COLORS = {
  VACANT:   { bg: '#f0fdf4', color: '#16a34a' },
  MODERATE: { bg: '#fffbeb', color: '#d97706' },
  FULL:     { bg: '#fef2f2', color: '#dc2626' },
}

export const SegmentsPage = () => {
  const { event, eventId } = useOutletContext()
  const [segments, setSegments] = useState([])
  const [speakers, setSpeakers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingSegment, setEditingSegment] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [mappingSegment, setMappingSegment] = useState(null)
  const [segmentSpeakers, setSegmentSpeakers] = useState({}) // { segmentId: [speakers] }
  const [openMenuId, setOpenMenuId] = useState(null)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(segmentSchema),
    defaultValues: { capacity_status: 'VACANT' },
  })

  useEffect(() => {
    if (eventId) {
      loadData()
    }
  }, [eventId])

  const loadData = async () => {
    setLoading(true)
    const [segsResult, speakersResult] = await Promise.all([
      getSegmentsByEventId(eventId),
      getAllSpeakers(),
    ])
    if (segsResult.success) {
      // Sort by created_at (descending - newest first)
      const sortedSegs = (segsResult.data || []).sort((a, b) => {
        const dateA = new Date(a.created_at || 0)
        const dateB = new Date(b.created_at || 0)
        return dateB - dateA
      })
      setSegments(sortedSegs)
      // Load speakers for each segment
      await loadAllSegmentSpeakers(sortedSegs)
    } else {
      setError(segsResult.error)
    }
    if (speakersResult.success) setSpeakers(speakersResult.data || [])
    setLoading(false)
  }

  const loadAllSegmentSpeakers = async (segs) => {
    const { supabase } = await import('../../services/supabase')
    const map = {}
    await Promise.all(segs.map(async (seg) => {
      const { data } = await supabase
        .from('segment_speakers')
        .select('speaker_id, speakers(*)')
        .eq('segment_id', seg.id)
      map[seg.id] = data ? data.map((d) => d.speakers) : []
    }))
    setSegmentSpeakers(map)
  }

  const reloadSegmentSpeakers = async (segmentId) => {
    const { supabase } = await import('../../services/supabase')
    const { data } = await supabase
      .from('segment_speakers')
      .select('speaker_id, speakers(*)')
      .eq('segment_id', segmentId)
    setSegmentSpeakers((prev) => ({
      ...prev,
      [segmentId]: data ? data.map((d) => d.speakers) : [],
    }))
  }

  const onSubmit = async (data) => {
    if (editingSegment) {
      // Update existing segment
      const result = await updateSegment(editingSegment.id, data)
      if (result.success) {
        setSegments((prev) =>
          prev.map((s) => (s.id === editingSegment.id ? result.data : s))
        )
        setShowModal(false)
        setEditingSegment(null)
        reset()
      } else {
        setError(result.error)
      }
    } else {
      // Create new segment
      const result = await createSegment({ ...data, event_id: eventId })
      if (result.success) {
        setSegments((prev) => [...prev, result.data])
        setSegmentSpeakers((prev) => ({ ...prev, [result.data.id]: [] }))
        setShowModal(false)
        reset()
      } else {
        setError(result.error)
      }
    }
  }

  const convertToDatetimeLocal = (isoString) => {
    if (!isoString) return ''
    // Convert ISO 8601 string to datetime-local format (YYYY-MM-DDTHH:mm)
    const date = new Date(isoString)
    const year = date.getUTCFullYear()
    const month = String(date.getUTCMonth() + 1).padStart(2, '0')
    const day = String(date.getUTCDate()).padStart(2, '0')
    const hours = String(date.getUTCHours()).padStart(2, '0')
    const minutes = String(date.getUTCMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  const handleDelete = async (segmentId) => {
    setDeleting(segmentId)
    const result = await deleteSegment(segmentId)
    if (result.success) {
      setSegments((prev) => prev.filter((s) => s.id !== segmentId))
      setSegmentSpeakers((prev) => {
        const next = { ...prev }
        delete next[segmentId]
        return next
      })
    } else {
      setError(result.error)
    }
    setDeleting(null)
  }

  const handleAddSpeaker = async (segmentId, speakerId) => {
    const result = await addSpeakerToSegment(segmentId, speakerId)
    if (result.success) await reloadSegmentSpeakers(segmentId)
    else setError(result.error)
  }

  const handleRemoveSpeaker = async (segmentId, speakerId) => {
    const result = await removeSpeakerFromSegment(segmentId, speakerId)
    if (result.success) await reloadSegmentSpeakers(segmentId)
    else setError(result.error)
  }

  const getAvailableSpeakers = (segmentId) => {
    const assigned = new Set((segmentSpeakers[segmentId] || []).map((s) => s.id))
    return speakers.filter((s) => !assigned.has(s.id))
  }

  const formatTime = (dateStr) => {
    // Parse the date as UTC to avoid timezone conversion
    const date = new Date(dateStr)
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true,
      timeZone: 'UTC'
    })
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      timeZone: 'UTC'
    })
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Segments</h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
            Sessions and speaker assignments for {event?.title || 'this event'}.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#f97316', color: '#fff', fontWeight: '600', fontSize: '14px', padding: '10px 20px', borderRadius: '9999px', border: 'none', cursor: 'pointer', flexShrink: 0 }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ea580c'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f97316'}
        >
          <Plus size={16} /> New Segment
        </button>
      </div>

      {error && (
        <div style={{ marginBottom: '16px', padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '14px', color: '#dc2626' }}>
          {error}
          <button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}>×</button>
        </div>
      )}

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[1, 2].map((i) => (
            <div key={i} style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', height: '120px' }} />
          ))}
        </div>
      )}

      {!loading && segments.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '80px 24px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a', margin: '0 0 6px' }}>No segments yet</h2>
          <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 24px' }}>Create sessions and assign speakers to them.</p>
          <button
            onClick={() => setShowModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#f97316', color: '#fff', fontWeight: '600', fontSize: '14px', padding: '10px 20px', borderRadius: '9999px', border: 'none', cursor: 'pointer' }}
          >
            <Plus size={16} /> New Segment
          </button>
        </div>
      )}

      {!loading && segments.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {Object.entries(
            segments.reduce((acc, segment) => {
              // Group strictly by start_time
              const startTimeKey = segment.start_time
              if (!acc[startTimeKey]) {
                acc[startTimeKey] = []
              }
              acc[startTimeKey].push(segment)
              return acc
            }, {})
          )
            .sort(([timeA], [timeB]) => new Date(timeA) - new Date(timeB))
            .map(([startTime, groupedSegments]) => (
              <div key={startTime} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Time Block Header */}
                <div style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  color: '#1e293b',
                  paddingBottom: '12px',
                  borderBottom: '1px solid #f1f5f9',
                  marginBottom: '8px'
                }}>
                  {formatTime(startTime)}
                </div>

                {/* Responsive Grid - Max 2 columns */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: groupedSegments.length === 1 ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '16px',
                  ...(groupedSegments.length === 1 && {
                    gridTemplateColumns: '1fr',
                  }),
                }}>
                  {groupedSegments.map((segment) => {
                    const capStyle = CAPACITY_COLORS[segment.capacity_status] || CAPACITY_COLORS.VACANT
                    const assigned = segmentSpeakers[segment.id] || []
                    return (
                      <div key={segment.id} style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
                        {/* Header with title, date/time and menu */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a', margin: 0 }}>{segment.title}</h3>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ position: 'relative' }}>
                              <button
                                onClick={() => setOpenMenuId(openMenuId === segment.id ? null : segment.id)}
                                style={{ padding: '4px', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              >
                                <MoreVertical size={16} />
                              </button>
                              {openMenuId === segment.id && (
                                <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: '4px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10 }}>
                                  <button
                                    onClick={() => {
                                      setEditingSegment(segment)
                                      reset({
                                        title: segment.title,
                                        room_name: segment.room_name,
                                        start_time: convertToDatetimeLocal(segment.start_time),
                                        end_time: convertToDatetimeLocal(segment.end_time),
                                        capacity_status: segment.capacity_status,
                                      })
                                      setShowModal(true)
                                      setOpenMenuId(null)
                                    }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', width: '100%', textAlign: 'left', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '13px', color: '#475569', fontWeight: '500' }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                  >
                                    <Edit2 size={14} /> Edit
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleDelete(segment.id)
                                      setOpenMenuId(null)
                                    }}
                                    disabled={deleting === segment.id}
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', width: '100%', textAlign: 'left', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '13px', color: '#dc2626', fontWeight: '500', borderTop: '1px solid #e2e8f0', opacity: deleting === segment.id ? 0.5 : 1 }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                  >
                                    <Trash2 size={14} /> Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* End time info */}
                        <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 12px', fontWeight: '500' }}>
                          End: {formatTime(segment.end_time)}
                        </p>

                        {/* Details */}
                        <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 16px' }}>
                          {segment.room_name}
                        </p>

                        {/* Capacity badge */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                          <span style={{ padding: '3px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: '500', backgroundColor: capStyle.bg, color: capStyle.color }}>
                            {segment.capacity_status}
                          </span>
                        </div>

                        {/* Speakers section */}
                        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '500', color: '#475569' }}>
                              <Users size={14} />
                              Speakers ({assigned.length})
                            </div>
                            <button
                              onClick={() => setMappingSegment(segment)}
                              style={{ fontSize: '13px', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '500' }}
                            >
                              Manage
                            </button>
                          </div>

                          {assigned.length === 0 ? (
                            <p style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>No speakers assigned yet</p>
                          ) : (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                              {assigned.map((sp) => (
                                <div key={sp.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 12px', backgroundColor: '#eff6ff', borderRadius: '9999px', border: '1px solid #bfdbfe' }}>
                                  <span style={{ fontSize: '13px', fontWeight: '500', color: '#1d4ed8' }}>{sp.full_name}</span>
                                  <button onClick={() => handleRemoveSpeaker(segment.id, sp.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#60a5fa', display: 'flex' }}>
                                    <X size={12} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Create/Edit Segment Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', width: '100%', maxWidth: '520px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                {editingSegment ? 'Edit Segment' : 'New Segment'}
              </h2>
              <button onClick={() => { setShowModal(false); setEditingSegment(null); reset() }} style={{ padding: '6px', borderRadius: '6px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={LABEL}>Segment Title *</label>
                <input {...register('title')} placeholder="e.g. Keynote, Workshop A" style={INPUT}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
                {errors.title && <p style={{ fontSize: '12px', color: '#dc2626', margin: '4px 0 0' }}>{errors.title.message}</p>}
              </div>

              <div>
                <label style={LABEL}>Room Name *</label>
                <input {...register('room_name')} placeholder="e.g. Main Hall, Room 101" style={INPUT}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
                {errors.room_name && <p style={{ fontSize: '12px', color: '#dc2626', margin: '4px 0 0' }}>{errors.room_name.message}</p>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={LABEL}>Start Time *</label>
                  <input {...register('start_time')} type="datetime-local" style={INPUT}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  />
                  {errors.start_time && <p style={{ fontSize: '12px', color: '#dc2626', margin: '4px 0 0' }}>{errors.start_time.message}</p>}
                </div>
                <div>
                  <label style={LABEL}>End Time *</label>
                  <input {...register('end_time')} type="datetime-local" style={INPUT}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  />
                  {errors.end_time && <p style={{ fontSize: '12px', color: '#dc2626', margin: '4px 0 0' }}>{errors.end_time.message}</p>}
                </div>
              </div>

              <div>
                <label style={LABEL}>Capacity Status *</label>
                <select {...register('capacity_status')} style={{ ...INPUT, backgroundColor: '#fff' }}>
                  <option value="VACANT">Vacant</option>
                  <option value="MODERATE">Moderate</option>
                  <option value="FULL">Full</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', paddingTop: '8px' }}>
                <button type="button" onClick={() => { setShowModal(false); setEditingSegment(null); reset() }} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#f97316', color: '#fff', fontSize: '14px', fontWeight: '600', cursor: 'pointer', opacity: isSubmitting ? 0.7 : 1 }}>
                  {isSubmitting ? (editingSegment ? 'Updating…' : 'Creating…') : (editingSegment ? 'Update Segment' : 'Create Segment')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Speaker Mapping Modal */}
      {mappingSegment && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', width: '100%', maxWidth: '420px', padding: '24px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Manage Speakers</h2>
              <button onClick={() => setMappingSegment(null)} style={{ padding: '6px', borderRadius: '6px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px' }}>
              Segment: <strong>{mappingSegment.title}</strong>
            </p>

            {/* Assigned */}
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>Assigned</p>
              {(segmentSpeakers[mappingSegment.id] || []).length === 0 ? (
                <p style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>None assigned yet</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {(segmentSpeakers[mappingSegment.id] || []).map((sp) => (
                    <div key={sp.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                      <span style={{ fontSize: '14px', fontWeight: '500', color: '#1d4ed8' }}>{sp.full_name}</span>
                      <button onClick={() => handleRemoveSpeaker(mappingSegment.id, sp.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '2px' }}>
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Available */}
            <div>
              <p style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>Available</p>
              {getAvailableSpeakers(mappingSegment.id).length === 0 ? (
                <p style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>All speakers assigned</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {getAvailableSpeakers(mappingSegment.id).map((sp) => (
                    <button
                      key={sp.id}
                      onClick={() => handleAddSpeaker(mappingSegment.id, sp.id)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', cursor: 'pointer', textAlign: 'left' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0fdf4'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                    >
                      <span style={{ fontSize: '14px', color: '#0f172a' }}>{sp.full_name}</span>
                      <Plus size={14} color="#16a34a" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setMappingSegment(null)}
              style={{ width: '100%', marginTop: '20px', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
