import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Loader, Link, Sparkles, MapPin } from 'lucide-react'
import { pbxService } from '../../services/pbxService'

interface AddPBXModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

const AddPBXModal = ({ isOpen, onClose, onSuccess }: AddPBXModalProps) => {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [nickname, setNickname] = useState('')
  const [extensionCount, setExtensionCount] = useState('')
  const [siteInfo, setSiteInfo] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleClose = () => {
    if (isLoading) return
    onClose()
    setName('')
    setUrl('')
    setNickname('')
    setExtensionCount('')
    setSiteInfo('')
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    try {
      const trimmedExtensions = extensionCount.trim()
      const parsedExtensionCount = trimmedExtensions === '' ? null : Number(trimmedExtensions)

      if (parsedExtensionCount !== null && !Number.isFinite(parsedExtensionCount)) {
        throw new Error('Extension count must be a number')
      }

      await pbxService.addPBX({
        name: name.trim(),
        url: url.trim().replace(/\/login\/?$/, ''),
        nickname: nickname.trim() || undefined,
        extensionCount: parsedExtensionCount ?? undefined,
        siteInfo: siteInfo.trim() || undefined,
      })
      if (onSuccess) onSuccess()
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add PBX')
    } finally {
      setIsLoading(false)
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
            className="relative w-full max-w-md bg-dark-800 border border-slate-700 rounded-xl shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center">
                  <Link className="w-4 h-4 text-primary-400" />
                </div>
                <h2 className="text-xl font-semibold text-white">Add PBX Client</h2>
              </div>
              <button onClick={handleClose} disabled={isLoading}
                className="p-2 text-slate-400 hover:text-white transition-colors disabled:opacity-50">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Client Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-dark-900 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g. Dent City Bellville"
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">PBX URL</label>
                <input
                  type="url"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-dark-900 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="https://client.pbx.yeastarycm.co.za"
                  required
                  disabled={isLoading}
                />
                <p className="text-xs text-slate-500 mt-1">
                  The direct link to the client's PBX admin interface
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Nickname / Short Name</label>
                  <div className="relative">
                    <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                    <input
                      type="text"
                      value={nickname}
                      onChange={e => setNickname(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 bg-dark-900 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-secondary-500"
                      placeholder="Optional shorthand"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Extension Count</label>
                  <input
                    type="number"
                    min={0}
                    value={extensionCount}
                    onChange={e => setExtensionCount(e.target.value)}
                    className="w-full px-3 py-2 bg-dark-900 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g. 42"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-slate-500 mt-1">Leave blank if unknown.</p>
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
                  className="w-full min-h-[80px] px-3 py-2 bg-dark-900 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Branch name, address, contact notes..."
                  disabled={isLoading}
                />
              </div>

              {error && (
                <div className="p-3 bg-error-500/10 border border-error-500/20 rounded-lg text-error-400 text-sm">
                  {error}
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={handleClose} disabled={isLoading} className="btn-secondary disabled:opacity-50">
                  Cancel
                </button>
                <button type="submit" disabled={isLoading} className="btn-primary flex items-center space-x-2 disabled:opacity-50">
                  {isLoading
                    ? <><Loader className="w-4 h-4 animate-spin" /><span>Adding...</span></>
                    : <><Plus className="w-4 h-4" /><span>Add Client</span></>
                  }
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default AddPBXModal
