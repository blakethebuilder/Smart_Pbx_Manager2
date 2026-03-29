import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Grid, List } from 'lucide-react'
import { usePBXStore } from '../stores/pbxStore'
import { pbxService } from '../services/pbxService'
import PBXGrid from '../components/PBX/PBXGrid'
import PBXQuickAccess from '../components/PBX/PBXQuickAccess'
import AddPBXModal from '../components/PBX/AddPBXModal'
import PBXLoader from '../components/PBX/PBXLoader'
import AnnouncementBox from '../components/AnnouncementBox'

const Dashboard = () => {
  const { 
    pbxInstances, 
    selectedPBX, 
    searchQuery,
    favorites,
    setPBXInstances 
  } = usePBXStore()
  
  const [showAddModal, setShowAddModal] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isLoading, setIsLoading] = useState(true)

  const loadPBXInstances = async () => {
    try {
      setIsLoading(true)
      const instances = await pbxService.getAllPBX()
      setPBXInstances(instances)
    } catch (error) {
      console.error('Failed to load PBX instances:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadPBXInstances()
  }, [setPBXInstances])

  const filteredInstances = pbxInstances.filter(pbx =>
    pbx.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pbx.url.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const stats = {
    total: pbxInstances.length,
    favorites: favorites.length,
    notes: pbxInstances.reduce((acc, pbx) => acc + (pbx.notes?.length || 0), 0),
    recent: pbxInstances.filter(pbx => {
      const lastNote = pbx.notes?.[pbx.notes.length - 1]
      if (!lastNote) return false
      const noteDate = new Date(lastNote.timestamp)
      const now = new Date()
      return (now.getTime() - noteDate.getTime()) < 24 * 60 * 60 * 1000 // Last 24h
    }).length
  }

  if (selectedPBX) {
    return <PBXLoader />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">PBX Dashboard</h1>
          <p className="text-slate-400 mt-1">Manage your client PBX instances</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex bg-dark-800 rounded-lg p-1">
            <button onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-primary-500 text-white' : 'text-slate-400 hover:text-white'}`}
              title="Grid View"><Grid className="w-4 h-4" /></button>
            <button onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-primary-500 text-white' : 'text-slate-400 hover:text-white'}`}
              title="List View"><List className="w-4 h-4" /></button>
          </div>
          <motion.button onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center space-x-2"
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Plus className="w-4 h-4" />
            <span>Add PBX</span>
          </motion.button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total PBX</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
            <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center">
              <Grid className="w-5 h-5 text-primary-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Favorites</p>
              <p className="text-2xl font-bold text-warning-500">{stats.favorites}</p>
            </div>
            <div className="w-10 h-10 bg-warning-500/20 rounded-lg flex items-center justify-center">
              <Plus className="w-5 h-5 text-warning-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Tech Notes</p>
              <p className="text-2xl font-bold text-success-500">{stats.notes}</p>
            </div>
            <div className="w-10 h-10 bg-success-500/20 rounded-lg flex items-center justify-center">
              <Grid className="w-5 h-5 text-success-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Recent Activity</p>
              <p className="text-2xl font-bold text-secondary-500">{stats.recent}</p>
            </div>
            <div className="w-10 h-10 bg-secondary-500/20 rounded-lg flex items-center justify-center">
              <Plus className="w-5 h-5 text-secondary-400" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Announcements */}
      <AnnouncementBox />

      {/* Quick Access */}
      <PBXQuickAccess />

      {/* PBX Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <PBXGrid 
            instances={filteredInstances} 
            viewMode={viewMode}
          />
        )}
      </motion.div>

      {/* Add PBX Modal */}
      <AddPBXModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)}
        onSuccess={loadPBXInstances}
      />
    </div>
  )
}

export default Dashboard
