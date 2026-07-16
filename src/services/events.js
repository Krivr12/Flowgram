import { supabase } from './supabase'

// Get all events
export const getAllEvents = async () => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('start_date', { ascending: false })

  if (error) {
    console.error('Error fetching events:', error.message)
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

// Get single event
export const getEventById = async (eventId) => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single()

  if (error) {
    console.error('Error fetching event:', error.message)
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

// Create event
export const createEvent = async (eventData) => {
  const { data: userData } = await supabase.auth.getUser()
  
  const { data, error } = await supabase
    .from('events')
    .insert([
      {
        ...eventData,
        created_by: userData.user.id,
      },
    ])
    .select()

  if (error) {
    console.error('Error creating event:', error.message)
    return { success: false, error: error.message }
  }

  return { success: true, data: data[0] }
}

// Update event
export const updateEvent = async (eventId, eventData) => {
  const { data, error } = await supabase
    .from('events')
    .update(eventData)
    .eq('id', eventId)
    .select()

  if (error) {
    console.error('Error updating event:', error.message)
    return { success: false, error: error.message }
  }

  return { success: true, data: data[0] }
}

// Delete event
export const deleteEvent = async (eventId) => {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId)

  if (error) {
    console.error('Error deleting event:', error.message)
    return { success: false, error: error.message }
  }

  return { success: true }
}
