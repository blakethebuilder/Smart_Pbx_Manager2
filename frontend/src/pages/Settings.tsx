import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, RefreshCcw, ExternalLink, Pencil, Trash2, Server } from 'lucide-react'
import { usePBXStore, type PBXInstance } from '../stores/pbxStore'
import { pbxService } from '../services/pbxService'
import AddPBXModal from '../components/PBX/AddPBXModal'
import EditPBXModal from '../components/PBX/EditPBXModal'

const extractHost = (url: string) => {
  try {
    return new URL(url).hostname
  } catch (error) {
    return url
  }
}

const isSharedServer = (pbx: PBXInstance) => {
  try {
    const host = new URL(pbx.url).hostname.split('.')[0]
    return /^smart\d+$/i.test(host)
  } catch (error) {
    return false
  }
}

const Settings = () => {
  const { pbxInstances, setPBXInstances } = usePBXStore()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingPBX, setEditingPBX] = useState<PBXInstance | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadPBXInstances = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const instances = await pbxService.getAllPBX()
      setPBXInstances(instances)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load PBX instances')
    } finally {
      setIsLoading(false)
    }
  }, [setPBXInstances])

  const handleRefresh = () => {
    loadPBXInstances()
  }

  const handleDelete = async (pbx: PBXInstance) => {
    if (!confirm(`Delete ${pbx.name}? This cannot be undone.`)) {
      return
    }
    try {
      await pbxService.deletePBX(pbx.id)
      loadPBXInstances()
    } catch (err) {
      alert('Failed to delete PBX. Please try again.')
    }
  }

  const sharedServers = useMemo(
    () =>
      pbxInstances
        .filter(isSharedServer)
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name)),
    [pbxInstances]
  )

  const dedicatedServers = useMemo(
    () =>
      pbxInstances
        .filter((pbx) => !isSharedServer(pbx))
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name)),
    [pbxInstances]
  )

  const openAddModal = () => setIsAddModalOpen(true)
  const closeAddModal = () => setIsAddModalOpen(false)

  const handleEdit = (pbx: PBXInstance) => {
    setEditingPBX(pbx)
  }

  const handleEditSaved = () => {
    loadPBXInstances()
    setEditingPBX(null)
  }

  useEffect(() => {
    loadPBXInstances()
  }, [loadPBXInstances])

  const renderTable = (title: string, items: PBXInstance[]) => (
    <div className="card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center space-x-2">
            <Server className="w-5 h-5 text-primary-400" />
            <span>{title}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">{items.length} record{items.length === 1 ? '' : 's'}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 uppercase text-[11px] tracking-wider">
              <th className="py-2 pr-4">Client</th>
              <th className="py-2 pr-4">Hostname</th>
              <th className="py-2 pr-4">Nickname</th>
              <th className="py-2 pr-4 text-center">Extensions</th>
              <th className="py-2 pr-4">Site Info</th>
              <th className="py-2 pr-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-slate-500 text-sm">
                  {isLoading ? 'Loading...' : 'No records found.'}
                </td>
              </tr>
            ) : (
              items.map((pbx) => {
                const host = extractHost(pbx.url)
                return (
                  <tr key={pbx.id} className="hover:bg-dark-900">
                    <td className="py-3 pr-4 text-white font-medium">{pbx.name}</td>
                    <td className="py-3 pr-4 text-slate-400">{host}</td>
                    <td className="py-3 pr-4 text-slate-300">{pbx.nickname || '—'}</td>
                    <td className="py-3 pr-4 text-slate-300 text-center">
                      {pbx.extensionCount != null ? pbx.extensionCount : '—'}
                    </td>
                    <td className="py-3 pr-4 text-slate-400 max-w-xs truncate">{pbx.siteInfo || '—'}</td>
                    <td className="py-3 pr-0">
                      <div className="flex items-center justify-end space-x-2">
                        <a
                          href={pbx.url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 text-slate-400 hover:text-primary-400 transition-colors"
                          title="Open PBX"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => handleEdit(pbx)}
                          className="p-2 text-slate-400 hover:text-secondary-400 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(pbx)}
                          className="p-2 text-slate-500 hover:text-error-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">PBX Admin</h1>
          <p className="text-slate-400 mt-1">Manage shared clusters and individual deployments.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            className="btn-secondary flex items-center space-x-2"
            disabled={isLoading}
          >
            <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Refreshing' : 'Refresh'}</span>
          </button>
          <button
            onClick={openAddModal}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add PBX</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 border border-error-500/30 bg-error-500/10 rounded-lg text-error-300">
          {error}
        </div>
      )}

      {renderTable('Shared Smart Cluster (smart1 / smart2 / smart3 / smart4)', sharedServers)}

      {renderTable('Dedicated Deployments', dedicatedServers)}

      <AddPBXModal
        isOpen={isAddModalOpen}
        onClose={closeAddModal}
        onSuccess={loadPBXInstances}
      />

      <EditPBXModal
        isOpen={Boolean(editingPBX)}
        pbx={editingPBX}
        onClose={() => setEditingPBX(null)}
        onSaved={handleEditSaved}
      />
    </div>
  )
}

export default Settings
