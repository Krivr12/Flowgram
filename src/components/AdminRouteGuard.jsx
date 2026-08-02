import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { getCurrentUser, getUserProfile, logout } from '../services/supabase'

export const AdminRouteGuard = ({ children }) => {
  const [isAuthorized, setIsAuthorized] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const currentUser = await getCurrentUser()

        if (!currentUser) {
          setIsAuthorized(false)
          setLoading(false)
          return
        }

        const userProfile = await getUserProfile(currentUser.id)

        if (!userProfile || userProfile.role !== 'ADMIN') {
          await logout()
          setError('You do not have administrator privileges.')
          setIsAuthorized(false)
        } else {
          setIsAuthorized(true)
        }
      } catch (err) {
        console.error('Admin access check failed:', err)
        setError('An error occurred. Please try again.')
        setIsAuthorized(false)
      } finally {
        setLoading(false)
      }
    }

    checkAdminAccess()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="text-gray-600">Verifying access...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <a
            href="/login"
            className="inline-block px-6 py-2 bg-primary-blue text-white rounded-lg hover:bg-primary-blue/90"
          >
            Back to Login
          </a>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return <Navigate to="/login" replace />
  }

  return children
}
