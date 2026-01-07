import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  ExternalLink, 
  Users, 
  Phone, 
  Activity, 
  StickyNote,
  Heart,
  HeartOff,
  RefreshCw,
  Wifi,
  WifiOff,
  Server,
  Clock,
  AlertCircle,
  CheckCircle,
  Plus,
  Edit3,
  Trash2
} from 'lucide-react'
import { usePBXStore } from '../../stores/pbxStore'
import { pbxService } from '../../services/pbxService'
import { formatLastCheck, getStatusDotClass } from '../../utils/formatters'

const PBXLoader = () => {
  const { 
    selectedPBX, 
    selectPBX, 
    favorites, 
    addToFavorites, 
    removeFromFavorites,
    addNote,
    updateNote,
    deleteNote
  } = usePBXStore()
  
  const [activeTab, setActiveTab] = useState<'overview' | 'extensions' | 'trunks' | 'history' | 'notes'>('overview')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [detailedData, setDetailedData] = useState<any>(null)
  const [healthHistory, setHealthHistory] = useState<any[]>([])
  const [newNote, setNewNote] = useState('')
  const [editingNote, setEditingNote] = useState<string | null>(null)
  const [editNoteContent, setEditNoteContent] = useState('')

  if (!selectedPBX) return null

  const isFavorite = favorites.includes(selectedPBX.id)
  const systemInfo = selectedPBX.health?.systemInfo

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'extensions', label: 'Extensions', icon: Users },
    { id: 'trunks', label: 'Trunks', icon: Server },
    { id: 'history', label: 'History', icon: Clock },
    { id: 'notes', label: 'Notes', icon: StickyNote },
  ]

  // Load detailed data when component mounts or PBX changes
  useEffect(() => {
    if (selectedPBX) {
      loadDetailedData()
      loadHealthHistory()
    }
  }, [selectedPBX?.id])

  const loadDetailedData = async () => {
    if (!selectedPBX) return
    
    try {
      setIsRefreshing(true)
      // Test the PBX to get fresh detailed data
      const response = await pbxService.testPBX(selectedPBX.id)
      setDetailedData(response.health)
    } catch (error) {
      console.error('Failed to load detailed data:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const loadHealthHistory = async () => {
    if (!selectedPBX) return
    
    try {
      const history = await pbxService.getHealthHistory(selectedPBX.id)
      setHealthHistory(history)
    } catch (error) {
      console.error('Failed to load health history:', error)
    }
  }

  const handleFavoriteToggle = () => {
    if (isFavorite) {
      removeFromFavorites(selectedPBX.id)
    } else {
      addToFavorites(selectedPBX.id)
    }
  }

  const handleRefresh = () => {
    loadDetailedData()
    loadHealthHistory()
  }

  const handleAddNote = () => {
    if (newNote.trim()) {
      addNote(selectedPBX.id, {
        content: newNote.trim(),
        author: 'Tech User', // Could be from auth context
        priority: 'medium'
      })
      setNewNote('')
    }
  }

  const handleEditNote = (noteId: string, content: string) => {
    setEditingNote(noteId)
    setEditNoteContent(content)
  }

  const handleSaveNote = (noteId: string) => {
    if (editNoteContent.trim()) {
      updateNote(selectedPBX.id, noteId, editNoteContent.trim())
    }
    setEditingNote(null)
    setEditNoteContent('')
  }

  const handleDeleteNote = (noteId: string) => {
    deleteNote(selectedPBX.id, noteId)
  }

  const currentData = detailedData || selectedPBX.health
  const extensions = currentData?.systemInfo?.extensionDetails || []
  const trunks = currentData?.systemInfo?.trunkDetails || []

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
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

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

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Status</p>
              <p className={`text-lg font-bold ${
                selectedPBX.status === 'healthy' ? 'text-success-500' :
                selectedPBX.status === 'error' ? 'text-error-500' : 'text-slate-400'
              }`}>
                {selectedPBX.status === 'healthy' ? 'Connected' : 
                 selectedPBX.status === 'error' ? 'Disconnected' : 'Unknown'}
              </p>
            </div>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              selectedPBX.status === 'healthy' ? 'bg-success-500/20' :
              selectedPBX.status === 'error' ? 'bg-error-500/20' : 'bg-slate-500/20'
            }`}>
              {selectedPBX.status === 'healthy' ? (
                <CheckCircle className="w-5 h-5 text-success-400" />
              ) : selectedPBX.status === 'error' ? (
                <AlertCircle className="w-5 h-5 text-error-400" />
              ) : (
                <Activity className="w-5 h-5 text-slate-400" />
              )}
            </div>
          </div>
        </motion.div>

        {systemInfo && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Extensions</p>
                  <p className="text-lg font-bold text-primary-400">
                    {(systemInfo as any).registeredExtensions || 0}/{systemInfo.extensions || 0}
                  </p>
                </div>
                <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary-400" />
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
                  <p className="text-slate-400 text-sm">Trunks</p>
                  <p className="text-lg font-bold text-secondary-400">
                    {(systemInfo as any).activeTrunks || 0}/{(systemInfo as any).trunks || 0}
                  </p>
                </div>
                <div className="w-10 h-10 bg-secondary-500/20 rounded-lg flex items-center justify-center">
                  <Server className="w-5 h-5 text-secondary-400" />
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
                  <p className="text-slate-400 text-sm">Active Calls</p>
                  <p className="text-lg font-bold text-success-400">
                    {systemInfo.activeCalls || 0}
                  </p>
                </div>
                <div className="w-10 h-10 bg-success-500/20 rounded-lg flex items-center justify-center">
                  <Phone className="w-5 h-5 text-success-400" />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </div>

      {selectedPBX.lastCheck && (
        <div className="text-center">
          <span className="text-sm text-slate-500">
            Last updated: {formatLastCheck(selectedPBX.lastCheck)}
          </span>
        </div>
      )}

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
                    <div className="text-white">{currentData?.apiType || 'Unknown'}</div>
                  </div>
                  
                  {systemInfo?.version && (
                    <div className="bg-dark-900 p-4 rounded-lg">
                      <div className="text-sm text-slate-400 mb-1">Version</div>
                      <div className="text-white">{systemInfo.version}</div>
                    </div>
                  )}

                  {systemInfo?.uptime && (
                    <div className="bg-dark-900 p-4 rounded-lg">
                      <div className="text-sm text-slate-400 mb-1">Uptime</div>
                      <div className="text-white">{systemInfo.uptime}</div>
                    </div>
                  )}

                  {currentData?.isShared !== undefined && (
                    <div className="bg-dark-900 p-4 rounded-lg">
                      <div className="text-sm text-slate-400 mb-1">Server Type</div>
                      <div className="text-white">{currentData.isShared ? 'Shared' : 'Dedicated'}</div>
                    </div>
                  )}
                </div>
              </div>

              {selectedPBX.status === 'error' && currentData?.error && (
                <div className="p-4 bg-error-500/10 border border-error-500/20 rounded-lg">
                  <h4 className="text-error-400 font-medium mb-2">Connection Error</h4>
                  <p className="text-error-300 text-sm">{currentData.error}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'extensions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Extensions</h3>
                <span className="text-sm text-slate-400">
                  {extensions.length} total, {extensions.filter((ext: any) => ext.online_status === 'online' || ext.status === 1).length} online
                </span>
              </div>

              {extensions.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {extensions.map((ext: any, index: number) => (
                    <motion.div
                      key={ext.number || index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-3 bg-dark-900 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${
                          ext.online_status === 'online' || ext.status === 1 
                            ? 'bg-success-500' 
                            : 'bg-slate-500'
                        }`} />
                        <div>
                          <div className="text-white font-medium">
                            {ext.number || ext.extension || `Ext ${index + 1}`}
                          </div>
                          <div className="text-sm text-slate-400">
                            {ext.caller_id || ext.name || 'No name'}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-slate-400">
                        {ext.online_status === 'online' || ext.status === 1 ? (
                          <span className="text-success-400 flex items-center">
                            <Wifi className="w-3 h-3 mr-1" />
                            Online
                          </span>
                        ) : (
                          <span className="text-slate-500 flex items-center">
                            <WifiOff className="w-3 h-3 mr-1" />
                            Offline
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">No Extensions Found</h3>
                  <p className="text-slate-400">
                    {selectedPBX.status === 'healthy' 
                      ? 'No extension data available from the API'
                      : 'Connect to PBX to view extensions'
                    }
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'trunks' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Trunks</h3>
                <span className="text-sm text-slate-400">
                  {trunks.length} total, {trunks.filter((trunk: any) => trunk.status === 1 || trunk.status === 'Active').length} active
                </span>
              </div>

              {trunks.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {trunks.map((trunk: any, index: number) => (
                    <motion.div
                      key={trunk.name || index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-3 bg-dark-900 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${
                          trunk.status === 1 || trunk.status === 'Active'
                            ? 'bg-success-500' 
                            : 'bg-error-500'
                        }`} />
                        <div>
                          <div className="text-white font-medium">
                            {trunk.name || trunk.trunk_name || `Trunk ${index + 1}`}
                          </div>
                          <div className="text-sm text-slate-400">
                            {trunk.type || trunk.trunk_type || 'SIP Trunk'}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-slate-400">
                        {trunk.status === 1 || trunk.status === 'Active' ? (
                          <span className="text-success-400">Active</span>
                        ) : (
                          <span className="text-error-400">Inactive</span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Server className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">No Trunks Found</h3>
                  <p className="text-slate-400">
                    {selectedPBX.status === 'healthy' 
                      ? 'No trunk data available from the API'
                      : 'Connect to PBX to view trunks'
                    }
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Health Check History</h3>
              
              {healthHistory.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {healthHistory.map((entry: any, index: number) => (
                    <motion.div
                      key={entry.id || index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="flex items-center justify-between p-3 bg-dark-900 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${
                          entry.status === 'healthy' ? 'bg-success-500' :
                          entry.status === 'error' ? 'bg-error-500' : 'bg-slate-500'
                        }`} />
                        <div>
                          <div className="text-white text-sm">
                            {new Date(entry.checked_at).toLocaleString()}
                          </div>
                          {entry.error_message && (
                            <div className="text-xs text-error-400 mt-1">
                              {entry.error_message}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <div className={`font-medium ${
                          entry.status === 'healthy' ? 'text-success-400' :
                          entry.status === 'error' ? 'text-error-400' : 'text-slate-400'
                        }`}>
                          {entry.status}
                        </div>
                        {entry.extensions_count && (
                          <div className="text-slate-400 text-xs">
                            {entry.extensions_count} ext
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">No History Available</h3>
                  <p className="text-slate-400">
                    Health check history will appear here once monitoring begins
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Tech Notes</h3>
                <span className="text-sm text-slate-400">
                  {selectedPBX.notes?.length || 0} notes
                </span>
              </div>

              {/* Add Note */}
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a tech note..."
                  className="flex-1 bg-dark-900 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddNote()}
                />
                <button
                  onClick={handleAddNote}
                  disabled={!newNote.trim()}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Notes List */}
              {selectedPBX.notes && selectedPBX.notes.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {selectedPBX.notes.map((note: any) => (
                    <motion.div
                      key={note.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-dark-900 rounded-lg"
                    >
                      {editingNote === note.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={editNoteContent}
                            onChange={(e) => setEditNoteContent(e.target.value)}
                            className="w-full bg-dark-800 border border-slate-600 rounded px-3 py-2 text-white resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                            rows={3}
                          />
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleSaveNote(note.id)}
                              className="btn-primary text-sm"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingNote(null)}
                              className="btn-secondary text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-white mb-2">{note.content}</p>
                              <div className="flex items-center space-x-4 text-xs text-slate-400">
                                <span>{note.author}</span>
                                <span>{new Date(note.timestamp).toLocaleString()}</span>
                                <span className={`px-2 py-1 rounded ${
                                  note.priority === 'high' ? 'bg-error-500/20 text-error-400' :
                                  note.priority === 'medium' ? 'bg-warning-500/20 text-warning-400' :
                                  'bg-slate-500/20 text-slate-400'
                                }`}>
                                  {note.priority}
                                </span>
                              </div>
                            </div>
                            <div className="flex space-x-1 ml-4">
                              <button
                                onClick={() => handleEditNote(note.id, note.content)}
                                className="p-1 text-slate-400 hover:text-white transition-colors"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteNote(note.id)}
                                className="p-1 text-slate-400 hover:text-error-400 transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <StickyNote className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">No Notes Yet</h3>
                  <p className="text-slate-400">
                    Add technical notes and observations for this PBX instance
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default PBXLoader