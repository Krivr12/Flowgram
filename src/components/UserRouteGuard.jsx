import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { getCurrentUser } from '../services/supabase'

export const UserRouteGuard = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
      setLoading(false)
    }

    checkAuth()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}
