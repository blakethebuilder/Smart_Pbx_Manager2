import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Filter, Grid, List } from 'lucide-react'
import { usePBXStore } from '../stores/pbxStore'
import { pbxService } from '../services/pbxService'
import PBXGrid from '../components/PBX/PBXGrid'
import PBXQuickAccess from '../components/PBX/PBXQuickAccess'
import AddPBXModal from '../components/PBX/AddPBXModal'
import PBXLoader from '../components/PBX/PBXLoader'

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
  const [filterStatus, setFilterStatus] = useState<'all' | 'healthy' | 'error' | 'unknown'>('all')
  const [isLoading, setIsLoading] = useState(true)

  // Load PBX instances on mount
  useEffect(() => {
    const loadPBXInstances = async () => {
      try {
        const instances = await pbxService.getAllPBX()
        setPBXInstances(instances)
      } catch (error) {
        console.error('Failed to load PBX instances:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadPBXInstances()
  }, [setPBXInstances])

  // Filter PBX instances
  const filteredInstances = pbxInstances.filter(pbx => {
    const matchesSearch = pbx.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         pbx.url.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFilter = filterStatus === 'all' || pbx.status === filterStatus
    
    return matchesSearch && matchesFilter
  })

  const stats = {
    total: pbxInstances.length,
    healthy: pbxInstances.filter(pbx => pbx.status === 'healthy').length,
    error: pbxInstances.filter(pbx => pbx.status === 'error').length,
    unknown: pbxInstances.filter(pbx => pbx.status === 'unknown').length,
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
          <p className="text-slate-400 mt-1">
            Monitor and manage your client PBX instances
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* View Mode Toggle */}
          <div className="flex bg-dark-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-primary-500 text-white' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list' 
                  ? 'bg-primary-500 text-white' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="bg-dark-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Status</option>
            <option value="healthy">Healthy</option>
            <option value="error">Error</option>
            <option value="unknown">Unknown</option>
          </select>

          {/* Add PBX Button */}
          <motion.button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center space-x-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
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
              <p className="text-slate-400 text-sm">Healthy</p>
              <p className="text-2xl font-bold text-success-500">{stats.healthy}</p>
            </div>
            <div className="w-10 h-10 bg-success-500/20 rounded-lg flex items-center justify-center">
              <div className="w-3 h-3 bg-success-500 rounded-full animate-pulse-slow" />
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
              <p className="text-slate-400 text-sm">Errors</p>
              <p className="text-2xl font-bold text-error-500">{stats.error}</p>
            </div>
            <div className="w-10 h-10 bg-error-500/20 rounded-lg flex items-center justify-center">
              <div className="w-3 h-3 bg-error-500 rounded-full" />
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
              <p className="text-slate-400 text-sm">Unknown</p>
              <p className="text-2xl font-bold text-slate-400">{stats.unknown}</p>
            </div>
            <div className="w-10 h-10 bg-slate-500/20 rounded-lg flex items-center justify-center">
              <div className="w-3 h-3 bg-slate-500 rounded-full" />
            </div>
          </div>
        </motion.div>
      </div>

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
      />
    </div>
  )
}

export default Dashboard