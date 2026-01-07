import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from './stores/authStore'
import { usePBXStore } from './stores/pbxStore'
import { socketService } from './services/socketService'
import LoginScreen from './components/Auth/LoginScreen'
import Layout from './components/Layout/Layout'
import Dashboard from './pages/Dashboard'

function App() {
  const { isAuthenticated, checkAuth } = useAuthStore()
  const { setPBXInstances } = usePBXStore()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check authentication status on app load
    checkAuth().finally(() => setIsLoading(false))
  }, [checkAuth])

  useEffect(() => {
    if (isAuthenticated) {
      // Initialize socket connection
      socketService.connect()
      
      // Listen for PBX updates
      socketService.on('pbx-update', (data: any) => {
        setPBXInstances(data)
      })

      return () => {
        socketService.disconnect()
      }
    }
  }, [isAuthenticated, setPBXInstances])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-900">
      <AnimatePresence mode="wait">
        {!isAuthenticated ? (
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <LoginScreen />
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Layout>
              <Dashboard />
            </Layout>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default App