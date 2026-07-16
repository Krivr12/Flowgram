import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2, X } from 'lucide-react'
import { getAllEvents, createEvent, deleteEvent } from '../../services/events'

// Zod validation schema
const eventSchema = z.object({
  title: z.string().min(1, 'Event title is required').min(3, 'Title must be at least 3 characters'),
  description: z.string().min(1, 'Description is required').min(10, 'Description must be at least 10 characters'),
  venue: z.string().min(1, 'Venue is required'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
})

export const EventsPage = () => {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [deleting, setDeleting] = useState(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(eventSchema),
  })

  // Load events on mount
  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    setLoading(true)
    const result = await getAllEvents()
    if (result.success) {
      setEvents(result.data || [])
    } else {
      setError(result.error)
    }
    setLoading(false)
  }

  const onSubmit = async (data) => {
    const result = await createEvent(data)
    if (result.success) {
      setEvents([result.data, ...events])
      setShowModal(false)
      reset()
    } else {
      setError(result.error)
    }
  }

  const handleDelete = async (eventId) => {
    setDeleting(eventId)
    const result = await deleteEvent(eventId)
    if (result.success) {
      setEvents(events.filter((e) => e.id !== eventId))
    } else {
      setError(result.error)
    }
    setDeleting(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-blue-900">Events</h1>
          <p className="text-gray-600 mt-1">Manage your events and sessions</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-full shadow-md transition-colors"
        >
          <Plus size={20} />
          New Event
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Events List */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading events...</div>
        ) : events.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No events yet. Create your first event to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Title</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Venue</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Start Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">End Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{event.title}</td>
                    <td className="px-6 py-4 text-gray-600">{event.venue}</td>
                    <td className="px-6 py-4 text-gray-600">{new Date(event.start_date).toLocaleDateString('en-US', { timeZone: 'UTC' })}</td>
                    <td className="px-6 py-4 text-gray-600">{new Date(event.end_date).toLocaleDateString('en-US', { timeZone: 'UTC' })}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDelete(event.id)}
                        disabled={deleting === event.id}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-blue-900">Create Event</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:bg-gray-100 p-2 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
                <input
                  {...register('title')}
                  type="text"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., AWS User Group Meetup"
                />
                {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  {...register('description')}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Event description"
                  rows="3"
                />
                {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>}
              </div>

              {/* Venue */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
                <input
                  {...register('venue')}
                  type="text"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Conference Center"
                />
                {errors.venue && <p className="text-red-600 text-sm mt-1">{errors.venue.message}</p>}
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date & Time</label>
                <input
                  {...register('start_date')}
                  type="datetime-local"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.start_date && <p className="text-red-600 text-sm mt-1">{errors.start_date.message}</p>}
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date & Time</label>
                <input
                  {...register('end_date')}
                  type="datetime-local"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.end_date && <p className="text-red-600 text-sm mt-1">{errors.end_date.message}</p>}
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium"
                >
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
