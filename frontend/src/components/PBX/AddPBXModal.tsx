import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Loader, Link, Server, Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react'
import { pbxService } from '../../services/pbxService'

interface AddPBXModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

type ModalTab = 'single' | 'csv'
type PbxType = 'api' | 'hotlink'

interface CSVRow {
  name: string
  url: string
  appId: string
  appSecret: string
  isShared: boolean
}

function parseCSV(text: string): CSVRow[] {
  const lines = text.trim().split('\n')
  const delimiter = lines[0].includes('\t') ? '\t' : ','
  const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase())
  const rows: CSVRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const vals = lines[i].split(delimiter).map(v => v.trim())
    if (vals.length < 2 || !vals[0]) continue
    const get = (key: string) => vals[headers.indexOf(key)] || ''
    rows.push({
      name: get('name'),
      url: get('url').replace(/\/login\/?$/, ''),
      appId: get('appid') || get('app_id') || 'PLACEHOLDER_ID',
      appSecret: get('appsecret') || get('app_secret') || 'PLACEHOLDER_SECRET',
      isShared: get('isshared') === 'true'
    })
  }
  return rows
}

const AddPBXModal = ({ isOpen, onClose, onSuccess }: AddPBXModalProps) => {
  const [tab, setTab] = useState<ModalTab>('single')

  // Single add state
  const [formData, setFormData] = useState({ name: '', url: '', appId: '', appSecret: '', isShared: false })
  const [pbxType, setPbxType] = useState<PbxType>('api')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // CSV state
  const [csvText, setCsvText] = useState('')
  const [csvRows, setCsvRows] = useState<CSVRow[]>([])
  const [csvPreviewed, setCsvPreviewed] = useState(false)
  const [csvLoading, setCsvLoading] = useState(false)
  const [csvResult, setCsvResult] = useState<{ imported: number; errors: string[] } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleClose = () => {
    if (isLoading || csvLoading) return
    onClose()
    setFormData({ name: '', url: '', appId: '', appSecret: '', isShared: false })
    setPbxType('api')
    setError('')
    setTab('single')
    setCsvText('')
    setCsvRows([])
    setCsvPreviewed(false)
    setCsvResult(null)
  }

  // ── Single add ──────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    try {
      await pbxService.addPBX({
        ...formData,
        appId: pbxType === 'hotlink' ? 'HOTLINK_PLACEHOLDER' : formData.appId,
        appSecret: pbxType === 'hotlink' ? 'HOTLINK_PLACEHOLDER' : formData.appSecret,
        isShared: pbxType === 'hotlink' ? true : formData.isShared
      })
      if (onSuccess) onSuccess()
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add PBX')
    } finally {
      setIsLoading(false)
    }
  }

  // ── CSV ─────────────────────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const text = ev.target?.result as string
      setCsvText(text)
      setCsvPreviewed(false)
      setCsvResult(null)
    }
    reader.readAsText(file)
  }

  const handlePreview = () => {
    try {
      const rows = parseCSV(csvText)
      setCsvRows(rows)
      setCsvPreviewed(true)
      setCsvResult(null)
    } catch {
      setError('Could not parse CSV — check the format')
    }
  }

  const handleImport = async () => {
    setCsvLoading(true)
    setError('')
    try {
      const result = await pbxService.bulkImport(csvRows)
      setCsvResult(result)
      if (onSuccess) onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setCsvLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-dark-800 border border-slate-700 rounded-xl shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <h2 className="text-xl font-semibold text-white">Add PBX Instance</h2>
              <button onClick={handleClose} disabled={isLoading || csvLoading}
                className="p-2 text-slate-400 hover:text-white transition-colors disabled:opacity-50">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-700">
              {(['single', 'csv'] as ModalTab[]).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`flex-1 py-3 text-sm font-medium transition-colors ${
                    tab === t
                      ? 'text-primary-400 border-b-2 border-primary-500'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}>
                  {t === 'single' ? '➕ Single PBX' : '📁 Import CSV'}
                </button>
              ))}
            </div>

            {/* ── Single tab ── */}
            {tab === 'single' && (
              <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* PBX Type */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">PBX Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    {(['api', 'hotlink'] as PbxType[]).map(t => (
                      <button key={t} type="button" onClick={() => setPbxType(t)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          pbxType === t
                            ? t === 'api' ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                                          : 'border-secondary-500 bg-secondary-500/10 text-secondary-400'
                            : 'border-slate-600 bg-dark-900 text-slate-400 hover:border-slate-500'
                        }`}>
                        {t === 'api' ? <Server className="w-5 h-5 mx-auto mb-2" /> : <Link className="w-5 h-5 mx-auto mb-2" />}
                        <div className="text-sm font-medium">{t === 'api' ? 'API Access' : 'Hot Link'}</div>
                        <div className="text-xs opacity-75">{t === 'api' ? 'Full monitoring' : 'Quick access only'}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Client Name</label>
                  <input type="text" value={formData.name} required disabled={isLoading}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-dark-900 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., Main Office PBX" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">PBX URL</label>
                  <input type="url" value={formData.url} required disabled={isLoading}
                    onChange={e => setFormData({ ...formData, url: e.target.value })}
                    className="w-full px-3 py-2 bg-dark-900 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="https://your-tenant.pbx.yeastar.com" />
                </div>

                {pbxType === 'api' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">App ID</label>
                      <input type="text" value={formData.appId} required disabled={isLoading}
                        onChange={e => setFormData({ ...formData, appId: e.target.value })}
                        className="w-full px-3 py-2 bg-dark-900 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Your API App ID" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">App Secret</label>
                      <input type="password" value={formData.appSecret} required disabled={isLoading}
                        onChange={e => setFormData({ ...formData, appSecret: e.target.value })}
                        className="w-full px-3 py-2 bg-dark-900 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Your API App Secret" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="isShared" checked={formData.isShared} disabled={isLoading}
                        onChange={e => setFormData({ ...formData, isShared: e.target.checked })}
                        className="w-4 h-4 text-primary-500 bg-dark-900 border-slate-600 rounded" />
                      <label htmlFor="isShared" className="text-sm text-slate-300">
                        Shared PBX Server (multiple clients on same server)
                      </label>
                    </div>
                  </>
                )}

                {error && (
                  <div className="p-3 bg-error-500/10 border border-error-500/20 rounded-lg text-error-400 text-sm">{error}</div>
                )}

                <div className="flex justify-end space-x-3 pt-2">
                  <button type="button" onClick={handleClose} disabled={isLoading} className="btn-secondary disabled:opacity-50">Cancel</button>
                  <button type="submit" disabled={isLoading} className="btn-primary flex items-center space-x-2 disabled:opacity-50">
                    {isLoading ? <><Loader className="w-4 h-4 animate-spin" /><span>Adding...</span></> : <><Plus className="w-4 h-4" /><span>Add PBX</span></>}
                  </button>
                </div>
              </form>
            )}

            {/* ── CSV tab ── */}
            {tab === 'csv' && (
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-300 text-xs">
                  <p className="font-medium mb-1">Expected format:</p>
                  <code className="block bg-dark-900 px-2 py-1 rounded">name,url,appId,appSecret,isShared</code>
                  <p className="mt-1 opacity-75">Leave appId/appSecret blank to add credentials later.</p>
                </div>

                {/* File picker */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Upload CSV file</label>
                  <input ref={fileRef} type="file" accept=".csv" onChange={handleFileChange}
                    className="hidden" />
                  <button type="button" onClick={() => fileRef.current?.click()}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 border-2 border-dashed border-slate-600 rounded-lg text-slate-400 hover:border-primary-500 hover:text-primary-400 transition-colors">
                    <Upload className="w-4 h-4" />
                    <span className="text-sm">Choose file or drag & drop</span>
                  </button>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="flex-1 h-px bg-slate-700" />
                  <span className="text-xs text-slate-500">OR</span>
                  <div className="flex-1 h-px bg-slate-700" />
                </div>

                {/* Paste area */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Paste CSV data</label>
                  <textarea value={csvText} onChange={e => { setCsvText(e.target.value); setCsvPreviewed(false); setCsvResult(null) }}
                    rows={5}
                    className="w-full px-3 py-2 bg-dark-900 border border-slate-600 rounded-lg text-white placeholder-slate-400 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                    placeholder={'name,url,appId,appSecret,isShared\nClient A,https://clienta.pbx.yeastarycm.co.za,,,false'} />
                </div>

                {/* Preview */}
                {csvPreviewed && csvRows.length > 0 && !csvResult && (
                  <div>
                    <p className="text-sm text-slate-300 mb-2 flex items-center space-x-1">
                      <FileText className="w-4 h-4" />
                      <span>{csvRows.length} entries ready to import</span>
                    </p>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {csvRows.map((row, i) => (
                        <div key={i} className="flex items-center justify-between px-3 py-2 bg-dark-900 rounded text-xs">
                          <span className="text-white font-medium">{row.name}</span>
                          <span className="text-slate-400 truncate ml-2">{row.url.replace('https://', '')}</span>
                          {row.isShared && <span className="ml-2 text-blue-400 shrink-0">shared</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Result */}
                {csvResult && (
                  <div className={`p-3 rounded-lg border text-sm ${csvResult.errors.length === 0 ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'}`}>
                    <div className="flex items-center space-x-2 mb-1">
                      {csvResult.errors.length === 0 ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      <span className="font-medium">Imported {csvResult.imported} PBX instances</span>
                    </div>
                    {csvResult.errors.map((e, i) => <p key={i} className="text-xs opacity-80">{e}</p>)}
                  </div>
                )}

                {error && (
                  <div className="p-3 bg-error-500/10 border border-error-500/20 rounded-lg text-error-400 text-sm">{error}</div>
                )}

                <div className="flex justify-end space-x-3 pt-2">
                  <button type="button" onClick={handleClose} className="btn-secondary">
                    {csvResult ? 'Close' : 'Cancel'}
                  </button>
                  {!csvResult && !csvPreviewed && (
                    <button type="button" onClick={handlePreview} disabled={!csvText.trim()}
                      className="btn-secondary flex items-center space-x-2 disabled:opacity-50">
                      <FileText className="w-4 h-4" />
                      <span>Preview</span>
                    </button>
                  )}
                  {csvPreviewed && !csvResult && (
                    <button type="button" onClick={handleImport} disabled={csvLoading || csvRows.length === 0}
                      className="btn-primary flex items-center space-x-2 disabled:opacity-50">
                      {csvLoading ? <><Loader className="w-4 h-4 animate-spin" /><span>Importing...</span></> : <><Upload className="w-4 h-4" /><span>Import {csvRows.length}</span></>}
                    </button>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default AddPBXModal
