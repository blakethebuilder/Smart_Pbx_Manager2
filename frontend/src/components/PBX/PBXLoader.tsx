import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  ExternalLink, 
  Users, 
  Phone, 
  Activity, 
  Settings,
  StickyNote,
  Heart,
  HeartOff
} from 'lucide-react'
import { usePBXStore } from '../../stores/pbxStore'
import { formatLastCheck, getStatusDotClass } from '../../utils/formatters'

const PBXLoader = () => {
  const { 
    selectedPBX, 
    selectPBX, 
    favorites, 
    addToFavorites, 
    removeFromFavorites 
  } = usePBXStore()
  
  const [activeTab, setActiveTab] = useState<'overview' | 'extensions' | 'calls' | 'notes'>('overview')

  if (!selectedPBX) return null

  const isFavorite = favorites.includes(selectedPBX.id)
  const systemInfo = selectedPBX.health?.systemInfo

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'extensions', label: 'Extensions', icon: Users },
    { id: 'calls', label: 'Active Calls', icon: Phone },
    { id: 'notes', label: 'Notes', icon: StickyNote },
  ]

  const handleFavoriteToggle = () => {
    if (isFavorite) {
      removeFromFavorites(selectedPBX.id)
    } else {
      addToFavorites(selectedPBX.id)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => selectPBX(null)}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-3">
            <div className={getStatusDotClass(selectedPBX.status)} />
            <div>
              <h1 className="text-2xl font-bold text-white">{selectedPBX.name}</h1>
              <p className="text-slate-400">{new URL(selectedPBX.url).hostname}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleFavoriteToggle}
            className="p-2 text-slate-400 hover:text-warning-500 transition-colors"
          >
            {isFavorite ? (
              <Heart className="w-5 h-5 fill-current text-warning-500" />
            ) : (
              <HeartOff className="w-5 h-5" />
            )}
          </button>

          <button
            onClick={() => window.open(selectedPBX.url, '_blank')}
            className="btn-primary flex items-center space-x-2"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Open PBX</span>
          </button>
        </div>
      </div>

      {/* Status Card */}
      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-1">
              {selectedPBX.status === 'healthy' ? 'Connected' : 
               selectedPBX.status === 'error' ? 'Disconnected' : 'Unknown'}
            </div>
            <div className="text-sm text-slate-400">Status</div>
          </div>

          {systemInfo && (
            <>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-400 mb-1">
                  {systemInfo.extensions}
                </div>
                <div className="text-sm text-slate-400">Extensions</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-success-400 mb-1">
                  {systemInfo.activeCalls}
                </div>
                <div className="text-sm text-slate-400">Active Calls</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-secondary-400 mb-1">
                  {systemInfo.uptime}
                </div>
                <div className="text-sm text-slate-400">Uptime</div>
              </div>
            </>
          )}
        </div>

        {selectedPBX.lastCheck && (
          <div className="mt-4 pt-4 border-t border-slate-700 text-center">
            <span className="text-sm text-slate-500">
              Last checked: {formatLastCheck(selectedPBX.lastCheck)}
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="border-b border-slate-700">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">System Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-dark-900 p-4 rounded-lg">
                    <div className="text-sm text-slate-400 mb-1">API Type</div>
                    <div className="text-white">{selectedPBX.health?.apiType || 'Unknown'}</div>
                  </div>
                  
                  {systemInfo?.version && (
                    <div className="bg-dark-900 p-4 rounded-lg">
                      <div className="text-sm text-slate-400 mb-1">Version</div>
                      <div className="text-white">{systemInfo.version}</div>
                    </div>
                  )}
                </div>
              </div>

              {selectedPBX.status === 'error' && selectedPBX.health?.error && (
                <div className="p-4 bg-error-500/10 border border-error-500/20 rounded-lg">
                  <h4 className="text-error-400 font-medium mb-2">Connection Error</h4>
                  <p className="text-error-300 text-sm">{selectedPBX.health.error}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'extensions' && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Extensions</h3>
              <p className="text-slate-400">
                Extension details will be available once API integration is complete
              </p>
            </div>
          )}

          {activeTab === 'calls' && (
            <div className="text-center py-8">
              <Phone className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Active Calls</h3>
              <p className="text-slate-400">
                Real-time call monitoring will be available once API integration is complete
              </p>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="text-center py-8">
              <StickyNote className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Tech Notes</h3>
              <p className="text-slate-400">
                Note-taking functionality coming soon
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default PBXLoader