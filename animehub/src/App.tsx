import { BrowserRouter } from 'react-router-dom'
import { Suspense } from 'react'
import { AppRoutes } from './router/index'
import { AuthProvider } from './contexts/AuthContext'
import { NavigationProvider } from './contexts/NavigationContext'
import Layout from './components/Layout'
import { SparkleLoadingSpinner } from './components/base/LoadingSpinner'
import PerformanceMonitor from './components/PerformanceMonitor'

// Loading fallback component for Suspense
const LoadingFallback = () => (
  <div className="min-h-screen bg-gradient-to-br from-green-50 via-yellow-50 to-pink-50 flex items-center justify-center">
    <div className="text-center">
      <SparkleLoadingSpinner size="xl" text="Loading page..." />
    </div>
  </div>
)

function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL || '/'}>
        <NavigationProvider>
          <Layout>
            <Suspense fallback={<LoadingFallback />}>
              <AppRoutes />
            </Suspense>
          </Layout>
          {/* Performance Monitor - only in development */}
          <PerformanceMonitor 
            enabled={true}
            showBadge={import.meta.env.DEV}
          />
        </NavigationProvider>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App