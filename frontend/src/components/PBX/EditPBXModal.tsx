import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Loader, Save, ExternalLink, Sparkles, MapPin, Phone, Clock } from 'lucide-react'
import type { PBXInstance } from '../../stores/pbxStore'
import { pbxService } from '../../services/pbxService'

interface EditPBXModalProps {
  isOpen: boolean
  pbx: PBXInstance | null
  onClose: () => void
  onSaved?: () => void
}

const formatTimestamp = (value?: string) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString()
}

const EditPBXModal = ({ isOpen, pbx, onClose, onSaved }: EditPBXModalProps) => {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [nickname, setNickname] = useState('')
  const [extensionCount, setExtensionCount] = useState('')
  const [siteInfo, setSiteInfo] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    if (pbx && isOpen) {
      setName(pbx.name)
      setUrl(pbx.url)
      setNickname(pbx.nickname ?? '')
      setExtensionCount(pbx.extensionCount != null ? String(pbx.extensionCount) : '')
      setSiteInfo(pbx.siteInfo ?? '')
      setError('')
      setSuccessMessage('')
    }
  }, [pbx, isOpen])

  const tagSummary = useMemo(() => {
    if (!pbx || !pbx.tags || pbx.tags.length === 0) return 'No tags set'
    return pbx.tags.join(', ')
  }, [pbx])

  const handleClose = () => {
    if (isSaving) return
    onClose()
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!pbx) return

    const parsedExtensions = extensionCount.trim()
    const normalizedExtension = parsedExtensions === '' ? null : Number(parsedExtensions)

    if (normalizedExtension !== null && !Number.isFinite(normalizedExtension)) {
      setError('Extension count must be a number')
      return
    }

    setIsSaving(true)
    setError('')
    try {
      await pbxService.updatePBX(pbx.id, {
        name: name.trim(),
        url: url.trim().replace(/\/login\/?$/, ''),
        nickname: nickname.trim(),
        extensionCount: normalizedExtension,
        siteInfo: siteInfo.trim(),
        tags: pbx.tags,
      })
      setSuccessMessage('Client details updated successfully.')
      if (onSaved) onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update PBX')
    } finally {
      setIsSaving(false)
    }
  }

  if (!pbx) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 24 }}
            className="relative w-full max-w-2xl bg-dark-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-700 bg-dark-900/60">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-white">{name || pbx.name}</h2>
                <p className="text-xs text-slate-400">
                  Manage client metadata, nicknames, and site details.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => window.open(pbx.url, '_blank', 'noreferrer')}
                  className="btn-secondary btn-sm flex items-center space-x-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open PBX</span>
                </button>
                <button
                  onClick={handleClose}
                  disabled={isSaving}
                  className="p-2 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Client Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-dark-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">PBX URL</label>
                  <input
                    type="url"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-dark-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-secondary-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Nickname</label>
                  <div className="relative">
                    <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                    <input
                      type="text"
                      value={nickname}
                      onChange={e => setNickname(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 bg-dark-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-secondary-500"
                      placeholder="Optional shorthand"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Extension Count</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-400" />
                    <input
                      type="number"
                      min={0}
                      value={extensionCount}
                      onChange={e => setExtensionCount(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 bg-dark-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="e.g. 24"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Leave blank if unknown.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Tags</label>
                  <div className="min-h-[40px] px-3 py-2 bg-dark-900 border border-slate-600 rounded-lg text-xs text-slate-400">
                    {tagSummary}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-primary-400" />
                  <span>Site / Location Info</span>
                </label>
                <textarea
                  value={siteInfo}
                  onChange={e => setSiteInfo(e.target.value)}
                  className="w-full min-h-[110px] px-3 py-2 bg-dark-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Deployment notes, address, rack location, on-site contacts..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-dark-900/40 border border-slate-700 rounded-lg p-4 text-xs text-slate-400">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-secondary-400" />
                  <span>
                    <strong>Created:</strong> {formatTimestamp(pbx.createdAt)}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-primary-400" />
                  <span>
                    <strong>Last Updated:</strong> {formatTimestamp(pbx.updatedAt)}
                  </span>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-error-500/10 border border-error-500/20 rounded-lg text-error-400 text-sm">
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="p-3 bg-success-500/10 border border-success-500/20 rounded-lg text-success-400 text-sm">
                  {successMessage}
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-1">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSaving}
                  className="btn-secondary disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-primary flex items-center space-x-2 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Saving…</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default EditPBXModal
