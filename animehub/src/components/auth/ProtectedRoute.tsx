import { Navigate } from 'react-router-dom'
import { useAuthContext } from '../../contexts/AuthContext'
import { useAdmin } from '../../hooks/useAdmin'
import { SparkleLoadingSpinner } from '../base/LoadingSpinner'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, loading } = useAuthContext()
  const { isAdmin, loading: adminLoading } = useAdmin()

  // Debug logging
  console.log('ProtectedRoute Debug:', {
    user: user ? 'exists' : 'null',
    loading,
    requireAdmin,
    isAdmin,
    adminLoading
  })

  if (loading || (requireAdmin && adminLoading)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-yellow-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <SparkleLoadingSpinner size="xl" text={loading ? "Checking authentication..." : "Checking admin status..."} />
        </div>
      </div>
    )
  }

  if (!user) {
    console.log('No user found, redirecting to home')
    return <Navigate to="/" replace />
  }

  if (requireAdmin && !isAdmin) {
    console.log('User is not admin, redirecting to home')
    return <Navigate to="/" replace />
  }

  console.log('Access granted, rendering children')
  return <>{children}</>
}
