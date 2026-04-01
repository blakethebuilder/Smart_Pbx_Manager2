import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from './stores/authStore'
import { usePBXStore } from './stores/pbxStore'
import { socketService } from './services/socketService'
import LoginScreen from './components/Auth/LoginScreen'
import Layout from './components/Layout/Layout'
import Dashboard from './pages/Dashboard'
import Notes from './pages/Notes'
import UserManagement from './pages/UserManagement'
import Settings from './pages/Settings'

function App() {
  const { isAuthenticated } = useAuthStore()
  const { setPBXInstances, selectedPBX, selectPBX } = usePBXStore()
  const [currentPage, setCurrentPage] = useState('dashboard')

  useEffect(() => {
    if (isAuthenticated) {
      socketService.connect()
      
      socketService.on('pbx-update', (data: any) => {
        setPBXInstances(data)
      })

      return () => {
        socketService.disconnect()
      }
    }
  }, [isAuthenticated, setPBXInstances])

  const handleNavigation = (page: string) => {
    setCurrentPage(page)
    if (selectedPBX && page !== 'notes') {
      selectPBX(null)
    }
  }

  const renderCurrentPage = () => {
    if (selectedPBX) {
      return <Notes selectedPBXId={selectedPBX.id} />
    }

    switch (currentPage) {
      case 'home':
        return <Dashboard />
      case 'notes':
        return <Notes />
      case 'user-management':
        return <UserManagement />
      case 'settings':
        return <Settings />
      default:
        return <Dashboard />
    }
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
            key="main"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Layout 
              currentPage={selectedPBX ? 'notes' : currentPage} 
              onNavigate={handleNavigation}
            >
              {renderCurrentPage()}
            </Layout>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
