import { supabase } from './supabase'

// Get all notifications for an event
// Query optimization: can optionally limit columns for polling
export const getNotificationsByEventId = async (eventId, columnsOnly = false) => {
  try {
    // For polling/checking purposes, fetch minimal columns
    const selectColumns = columnsOnly 
      ? 'id, title, message, created_at'
      : '*'
    
    const { data, error } = await supabase
      .from('notifications')
      .select(selectColumns)
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching notifications:', error)
      return { success: false, error: error.message || 'Failed to fetch notifications' }
    }

    return { success: true, data: data || [] }
  } catch (err) {
    console.error('Exception fetching notifications:', err)
    return { success: false, error: err.message || 'Failed to fetch notifications' }
  }
}

// Create a manual notification
export const createNotification = async (eventId, title, message) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert([
        {
          event_id: eventId,
          title,
          message,
        },
      ])
      .select()

    if (error) {
      console.error('Error creating notification:', error)
      return { success: false, error: error.message || 'Failed to create notification' }
    }

    return { success: true, data: data?.[0] || null }
  } catch (err) {
    console.error('Exception creating notification:', err)
    return { success: false, error: err.message || 'Failed to create notification' }
  }
}

// Update segment status (which will trigger automatic notification)
export const updateSegmentStatus = async (segmentId, status) => {
  try {
    const validStatuses = ['Not Started', 'Ongoing', 'Finished', 'Skipped']

    if (!validStatuses.includes(status)) {
      return { success: false, error: 'Invalid status' }
    }

    const { data, error } = await supabase
      .from('segments')
      .update({ segment_status: status })
      .eq('id', segmentId)
      .select()

    if (error) {
      console.error('Error updating segment status:', error)
      return { success: false, error: error.message || 'Failed to update status' }
    }

    return { success: true, data: data?.[0] || null }
  } catch (err) {
    console.error('Exception updating segment status:', err)
    return { success: false, error: err.message || 'Failed to update status' }
  }
}

