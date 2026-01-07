import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Loader, Link, Server } from 'lucide-react'
import { pbxService } from '../../services/pbxService'

interface AddPBXModalProps {
  isOpen: boolean
  onClose: () => void
}

const AddPBXModal = ({ isOpen, onClose }: AddPBXModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    appId: '',
    appSecret: '',
    isShared: false
  })
  const [pbxType, setPbxType] = useState<'api' | 'hotlink'>('api')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const submitData = {
        ...formData,
        // For hotlink PBX, use placeholder credentials
        appId: pbxType === 'hotlink' ? 'HOTLINK_PLACEHOLDER' : formData.appId,
        appSecret: pbxType === 'hotlink' ? 'HOTLINK_PLACEHOLDER' : formData.appSecret,
        isShared: pbxType === 'hotlink' ? true : formData.isShared
      }
      
      await pbxService.addPBX(submitData)
      onClose()
      setFormData({ name: '', url: '', appId: '', appSecret: '', isShared: false })
      setPbxType('api')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to add PBX')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      onClose()
      setFormData({ name: '', url: '', appId: '', appSecret: '', isShared: false })
      setPbxType('api')
      setError('')
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-dark-800 border border-slate-700 rounded-xl shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <h2 className="text-xl font-semibold text-white">Add PBX Instance</h2>
              <button
                onClick={handleClose}
                disabled={isLoading}
                className="p-2 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* PBX Type Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  PBX Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPbxType('api')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      pbxType === 'api'
                        ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                        : 'border-slate-600 bg-dark-900 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    <Server className="w-5 h-5 mx-auto mb-2" />
                    <div className="text-sm font-medium">API Access</div>
                    <div className="text-xs opacity-75">Full monitoring</div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setPbxType('hotlink')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      pbxType === 'hotlink'
                        ? 'border-secondary-500 bg-secondary-500/10 text-secondary-400'
                        : 'border-slate-600 bg-dark-900 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    <Link className="w-5 h-5 mx-auto mb-2" />
                    <div className="text-sm font-medium">Hot Link</div>
                    <div className="text-xs opacity-75">Quick access only</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Client Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-dark-900 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., Main Office PBX"
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  PBX URL
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-3 py-2 bg-dark-900 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="https://your-tenant.pbx.yeastar.com"
                  required
                  disabled={isLoading}
                />
                <p className="text-xs text-slate-500 mt-1">
                  {pbxType === 'hotlink' 
                    ? 'Direct link to PBX admin interface'
                    : 'For Yeastar Cloud: https://[tenant].pbx.yeastar.com'
                  }
                </p>
              </div>

              {pbxType === 'api' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      App ID (Client ID)
                    </label>
                    <input
                      type="text"
                      value={formData.appId}
                      onChange={(e) => setFormData({ ...formData, appId: e.target.value })}
                      className="w-full px-3 py-2 bg-dark-900 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Your API App ID"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      App Secret (Client Secret)
                    </label>
                    <input
                      type="password"
                      value={formData.appSecret}
                      onChange={(e) => setFormData({ ...formData, appSecret: e.target.value })}
                      className="w-full px-3 py-2 bg-dark-900 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Your API App Secret"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isShared"
                      checked={formData.isShared}
                      onChange={(e) => setFormData({ ...formData, isShared: e.target.checked })}
                      className="w-4 h-4 text-primary-500 bg-dark-900 border-slate-600 rounded focus:ring-primary-500"
                      disabled={isLoading}
                    />
                    <label htmlFor="isShared" className="text-sm text-slate-300">
                      Shared PBX Server (multiple clients on same server)
                    </label>
                  </div>
                </>
              )}

              {pbxType === 'hotlink' && (
                <div className="p-3 bg-secondary-500/10 border border-secondary-500/20 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Link className="w-4 h-4 text-secondary-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-secondary-300">
                      <div className="font-medium mb-1">Hot Link Mode</div>
                      <div className="text-xs opacity-90">
                        This PBX will be added as a quick access link without API monitoring. 
                        Perfect for PBX systems where you only need direct admin access.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-error-500/10 border border-error-500/20 rounded-lg text-error-400 text-sm"
                >
                  {error}
                </motion.div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isLoading}
                  className="btn-secondary disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary flex items-center space-x-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Adding...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Add PBX</span>
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

export default AddPBXModal