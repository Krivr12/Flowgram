import { supabase } from './supabase'

// Get all speakers
export const getAllSpeakers = async () => {
  const { data, error } = await supabase
    .from('speakers')
    .select('*')
    .order('full_name', { ascending: true })

  if (error) {
    console.error('Error fetching speakers:', error.message)
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

// Get speaker by ID
export const getSpeakerById = async (speakerId) => {
  const { data, error } = await supabase
    .from('speakers')
    .select('*')
    .eq('id', speakerId)
    .single()

  if (error) {
    console.error('Error fetching speaker:', error.message)
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

// Create speaker
export const createSpeaker = async (speakerData) => {
  const { data, error } = await supabase
    .from('speakers')
    .insert([speakerData])
    .select()

  if (error) {
    console.error('Error creating speaker:', error.message)
    return { success: false, error: error.message }
  }

  return { success: true, data: data[0] }
}

// Update speaker
export const updateSpeaker = async (speakerId, speakerData) => {
  const { data, error } = await supabase
    .from('speakers')
    .update(speakerData)
    .eq('id', speakerId)
    .select()

  if (error) {
    console.error('Error updating speaker:', error.message)
    return { success: false, error: error.message }
  }

  return { success: true, data: data[0] }
}

// Delete speaker
export const deleteSpeaker = async (speakerId) => {
  const { error } = await supabase
    .from('speakers')
    .delete()
    .eq('id', speakerId)

  if (error) {
    console.error('Error deleting speaker:', error.message)
    return { success: false, error: error.message }
  }

  return { success: true }
}
