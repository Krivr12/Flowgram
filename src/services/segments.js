import { supabase } from './supabase'

// Get all segments for an event, ordered chronologically by start_time
// Query optimization: fetch only needed columns for polling queries
export const getSegmentsByEventId = async (eventId) => {
  const { data, error } = await supabase
    .from('segments')
    .select('id, title, event_id, start_time, end_time, room_name, segment_status, capacity_status')
    .eq('event_id', eventId)
    .order('start_time', { ascending: true })

  if (error) {
    console.error('Error fetching segments:', error.message)
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

// Get segment with speakers
export const getSegmentWithSpeakers = async (segmentId) => {
  const { data: segmentData, error: segmentError } = await supabase
    .from('segments')
    .select('*')
    .eq('id', segmentId)
    .single()

  if (segmentError) {
    console.error('Error fetching segment:', segmentError.message)
    return { success: false, error: segmentError.message }
  }

  // Get speakers for this segment
  const { data: speakerData, error: speakerError } = await supabase
    .from('segment_speakers')
    .select('speaker_id, speakers(*)')
    .eq('segment_id', segmentId)

  if (speakerError) {
    console.error('Error fetching segment speakers:', speakerError.message)
    return { success: false, error: speakerError.message }
  }

  return {
    success: true,
    data: {
      ...segmentData,
      speakers: speakerData.map((sp) => sp.speakers),
    },
  }
}

// Create segment
export const createSegment = async (segmentData) => {
  const { data, error } = await supabase
    .from('segments')
    .insert([segmentData])
    .select()

  if (error) {
    console.error('Error creating segment:', error.message)
    return { success: false, error: error.message }
  }

  return { success: true, data: data[0] }
}

// Update segment
export const updateSegment = async (segmentId, segmentData) => {
  const { data, error } = await supabase
    .from('segments')
    .update(segmentData)
    .eq('id', segmentId)
    .select()

  if (error) {
    console.error('Error updating segment:', error.message)
    return { success: false, error: error.message }
  }

  return { success: true, data: data[0] }
}

// Delete segment (cascades to segment_speakers)
export const deleteSegment = async (segmentId) => {
  const { error } = await supabase
    .from('segments')
    .delete()
    .eq('id', segmentId)

  if (error) {
    console.error('Error deleting segment:', error.message)
    return { success: false, error: error.message }
  }

  return { success: true }
}

// Add speaker to segment
export const addSpeakerToSegment = async (segmentId, speakerId) => {
  const { data, error } = await supabase
    .from('segment_speakers')
    .insert([{ segment_id: segmentId, speaker_id: speakerId }])
    .select()

  if (error) {
    // Ignore duplicate key — speaker is already assigned
    if (error.code === '23505') {
      return { success: true, data: null }
    }
    console.error('Error adding speaker to segment:', error.message)
    return { success: false, error: error.message }
  }

  return { success: true, data: data?.[0] }
}

// Remove speaker from segment
export const removeSpeakerFromSegment = async (segmentId, speakerId) => {
  const { error } = await supabase
    .from('segment_speakers')
    .delete()
    .eq('segment_id', segmentId)
    .eq('speaker_id', speakerId)

  if (error) {
    console.error('Error removing speaker from segment:', error.message)
    return { success: false, error: error.message }
  }

  return { success: true }
}
