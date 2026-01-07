import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from './stores/authStore'
import { usePBXStore } from './stores/pbxStore'
import { socketService } from './services/socketService'
import { hotkeyService } from './services/hotkeyService'
import LoginScreen from './components/Auth/LoginScreen'
import Layout from './components/Layout/Layout'
import Dashboard from './pages/Dashboard'
import PBXLoader from './components/PBX/PBXLoader'

function App() {
  const { isAuthenticated, checkAuth } = useAuthStore()
  const { setPBXInstances, selectedPBX, selectPBX } = usePBXStore()
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState('dashboard')

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

      // Setup global hotkeys
      hotkeyService.register('escape', () => {
        if (selectedPBX) {
          selectPBX(null) // Close PBX Loader
        }
      })

      hotkeyService.register('ctrl+d', () => {
        setCurrentPage('dashboard')
        if (selectedPBX) selectPBX(null)
      })

      hotkeyService.register('ctrl+p', () => {
        setCurrentPage('pbx-instances')
        if (selectedPBX) selectPBX(null)
      })

      hotkeyService.register('ctrl+m', () => {
        setCurrentPage('monitoring')
        if (selectedPBX) selectPBX(null)
      })

      hotkeyService.register('ctrl+n', () => {
        setCurrentPage('notes')
        if (selectedPBX) selectPBX(null)
      })

      hotkeyService.register('ctrl+,', () => {
        setCurrentPage('settings')
        if (selectedPBX) selectPBX(null)
      })

      return () => {
        socketService.disconnect()
        hotkeyService.clear()
      }
    }
  }, [isAuthenticated, setPBXInstances, selectedPBX, selectPBX])

  const handleNavigation = (page: string) => {
    setCurrentPage(page)
    // Clear selected PBX when navigating away from PBX loader
    if (selectedPBX && page !== 'pbx-loader') {
      selectPBX(null)
    }
  }

  const renderCurrentPage = () => {
    // If a PBX is selected, show the PBX Loader regardless of current page
    if (selectedPBX) {
      return <PBXLoader />
    }

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />
      case 'pbx-instances':
        return <Dashboard /> // For now, same as dashboard
      case 'clients':
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-white mb-4">Clients</h2>
            <p className="text-slate-400">Client management coming soon...</p>
            <div className="mt-4 text-xs text-slate-500">
              Hotkey: <kbd className="px-2 py-1 bg-slate-700 rounded">Ctrl+C</kbd>
            </div>
          </div>
        )
      case 'monitoring':
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-white mb-4">Monitoring</h2>
            <p className="text-slate-400">Advanced monitoring features coming soon...</p>
            <div className="mt-4 text-xs text-slate-500">
              Hotkey: <kbd className="px-2 py-1 bg-slate-700 rounded">Ctrl+M</kbd>
            </div>
          </div>
        )
      case 'notes':
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-white mb-4">Tech Notes</h2>
            <p className="text-slate-400">Centralized note management coming soon...</p>
            <div className="mt-4 text-xs text-slate-500">
              Hotkey: <kbd className="px-2 py-1 bg-slate-700 rounded">Ctrl+N</kbd>
            </div>
          </div>
        )
      case 'settings':
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-white mb-4">Settings</h2>
            <p className="text-slate-400">System settings coming soon...</p>
            <div className="mt-4 text-xs text-slate-500">
              Hotkey: <kbd className="px-2 py-1 bg-slate-700 rounded">Ctrl+,</kbd>
            </div>
          </div>
        )
      default:
        return <Dashboard />
    }
  }

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
            <Layout 
              currentPage={selectedPBX ? 'pbx-loader' : currentPage}
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