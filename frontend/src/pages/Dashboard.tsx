import { useState, useEffect } from 'react'
import { Plus, Grid, List, FileUp, X } from 'lucide-react'
import { usePBXStore } from '../stores/pbxStore'
import { pbxService } from '../services/pbxService'
import PBXGrid from '../components/PBX/PBXGrid'
import PBXQuickAccess from '../components/PBX/PBXQuickAccess'
import AddPBXModal from '../components/PBX/AddPBXModal'
import AnnouncementBox from '../components/AnnouncementBox'
import QuickNoteModal from '../components/QuickNoteModal'
import EditPBXModal from '../components/PBX/EditPBXModal'
import PBXDetailsModal from '../components/PBX/PBXDetailsModal'
import type { PBXInstance } from '../stores/pbxStore'

const Dashboard = () => {
  const { 
    pbxInstances, 
    searchQuery,
    favorites,
    setPBXInstances,
    addNote,
    selectPBX,
  } = usePBXStore()
  
  const [showAddModal, setShowAddModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isLoading, setIsLoading] = useState(true)
  const [csvData, setCsvData] = useState('')
  const [importResults, setImportResults] = useState<{name: string, url: string}[]>([])
  const [importError, setImportError] = useState<string | null>(null)
  const [quickNoteModalOpen, setQuickNoteModalOpen] = useState(false)
  const [quickNotePbxId, setQuickNotePbxId] = useState<string | null>(null)
  const [editingPBX, setEditingPBX] = useState<PBXInstance | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [detailsPBX, setDetailsPBX] = useState<PBXInstance | null>(null)

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
      return (now.getTime() - noteDate.getTime()) < 24 * 60 * 60 * 1000
    }).length
  }

  const handlePreviewImport = () => {
    setImportError(null)
    const lines = csvData.trim().split('\\n').filter(l => l.trim() !== '')
    if (lines.length === 0) {
      setImportError('No data found to preview.')
      return
    }

    const preview = lines.map(line => {
      const [name, url] = line.split(/[,\\t]/).map(v => v.trim())
      return { name, url }
    }).filter(item => item.name && item.url)

    if (preview.length === 0) {
      setImportError('No valid data found (Check format: name,url).')
      return
    }

    setImportResults(preview)
  }

  const handleBulkImport = async () => {
    if (importResults.length === 0) return
    setIsLoading(true)
    try {
      await pbxService.bulkImport(importResults)
      await loadPBXInstances()
      setShowImportModal(false)
      setCsvData('')
      setImportResults([])
    } catch (err) {
      setImportError('Import failed. Please check your network or data.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeduplicate = async () => {
    if (!confirm('Are you sure you want to remove duplicate PBX links based on the Client Name?')) return
    setIsLoading(true)
    try {
      const response = await fetch('/api/pbx/deduplicate', { method: 'POST' })
      if (response.ok) {
        alert('Deduplication successful!')
        await loadPBXInstances()
      } else {
        throw new Error('Failed to deduplicate')
      }
    } catch (error) {
      alert('Error during deduplication: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleQuickNote = (pbxId: string) => {
    setQuickNotePbxId(pbxId)
    setQuickNoteModalOpen(true)
  }

  const handleEditPBX = (instance: PBXInstance) => {
    setEditingPBX(instance)
    setIsEditModalOpen(true)
    setDetailsPBX(null)
  }

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false)
    setEditingPBX(null)
  }

  const handlePBXUpdated = async () => {
    await loadPBXInstances()
    handleCloseEditModal()
  }

  const handleOpenDetails = (pbx: PBXInstance) => {
    setDetailsPBX(pbx)
  }

  const handleCloseDetails = () => {
    setDetailsPBX(null)
  }

  const handleViewNotes = (pbx: PBXInstance) => {
    selectPBX(pbx)
    setDetailsPBX(null)
  }

  const handlePostQuickNote = async (content: string) => {
    if (!content.trim() || !quickNotePbxId) return
    try {
      await addNote(quickNotePbxId, { content: content.trim(), author: 'Tech', priority: 'medium' })
      loadPBXInstances()
      setQuickNoteModalOpen(false)
      setQuickNotePbxId(null)
    } catch (e) {
      alert('Failed to add quick note.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">PBX Dashboard</h1>
          <p className="text-slate-400 mt-1">Overview of PBX instances and quick access</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex bg-dark-800 rounded-lg p-1">
            <button onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-primary-500 text-white' : 'text-slate-400 hover:text-white'}`}><Grid className="w-4 h-4" /></button>
            <button onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-primary-500 text-white' : 'text-slate-400 hover:text-white'}`}><List className="w-4 h-4" /></button>
          </div>
          <button onClick={() => setShowImportModal(true)} className="btn-secondary flex items-center space-x-2">
            <FileUp className="w-4 h-4" />
            <span>Import CSV</span>
          </button>
          <button onClick={handleDeduplicate} className="btn-secondary bg-slate-700 hover:bg-slate-600">Deduplicate</button>
          <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Add Hotlink</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">Total Links</p>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="card p-4">
          <p className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">Favorites</p>
          <p className="text-2xl font-bold text-warning-500">{stats.favorites}</p>
        </div>
        <div className="card p-4">
          <p className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">Tech Notes</p>
          <p className="text-2xl font-bold text-success-500">{stats.notes}</p>
        </div>
        <div className="card p-4">
          <p className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">Recent Activity</p>
          <p className="text-2xl font-bold text-secondary-500">{stats.recent}</p>
        </div>
      </div>

      <AnnouncementBox />
      <PBXQuickAccess />

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div></div>
      ) : (
        <PBXGrid 
          instances={filteredInstances} 
          viewMode={viewMode} 
          onQuickNote={(id: string) => handleQuickNote(id)}
          onEdit={handleEditPBX}
          onOpenDetails={handleOpenDetails}
        />
      )}

      <AddPBXModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)}
        onSuccess={loadPBXInstances}
      />

      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-dark-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <h2 className="text-xl font-bold text-white">Bulk Import Links</h2>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
              <div className="p-3 bg-primary-500/5 border border-primary-500/10 rounded text-xs text-slate-400">
                Format: <strong>name,url</strong> (one per line)
              </div>
              <textarea
                value={csvData}
                onChange={(e) => setCsvData(e.target.value)}
                placeholder="Client A,https://pbx-a.com&#10;Client B,https://pbx-b.com"
                className="w-full h-48 px-4 py-3 bg-dark-900 border border-slate-600 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {importError && <p className="text-error-400 text-sm font-medium">{importError}</p>}
              {importResults.length > 0 && (
                <div className="bg-dark-900 p-4 rounded-lg border border-slate-700 space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Ready to Import ({importResults.length})</p>
                  {importResults.map((r, i) => <div key={i} className="text-xs text-slate-400 truncate">{i+1}. {r.name} — {r.url}</div>)}
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-3 p-6 border-t border-slate-700 bg-dark-900/50">
              <button onClick={handlePreviewImport} className="btn-secondary">Preview</button>
              <button onClick={handleBulkImport} disabled={isLoading || importResults.length === 0} className="btn-primary min-w-[120px]">
                {isLoading ? 'Importing...' : 'Confirm Import'}
              </button>
            </div>
          </div>
        </div>
      )}

      {quickNoteModalOpen && quickNotePbxId && (
        <QuickNoteModal
          pbxId={quickNotePbxId}
          isOpen={quickNoteModalOpen}
          onClose={() => setQuickNoteModalOpen(false)}
          onSubmit={handlePostQuickNote}
        />
      )}

      <EditPBXModal
        isOpen={isEditModalOpen}
        pbx={editingPBX}
        onClose={handleCloseEditModal}
        onSaved={handlePBXUpdated}
      />

      <PBXDetailsModal
        pbx={detailsPBX}
        isOpen={Boolean(detailsPBX)}
        onClose={handleCloseDetails}
        onViewNotes={handleViewNotes}
        onEdit={handleEditPBX}
      />
    </div>
  )
}

export default Dashboard
