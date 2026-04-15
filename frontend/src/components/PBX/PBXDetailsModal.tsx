import { AnimatePresence, motion } from 'framer-motion'
import { ExternalLink, FileText, Pencil, MapPin, Phone, Tag } from 'lucide-react'
// Removed unused React import
// pbxService removed; edits handled via dedicated modal
import { PBXInstance } from '../../stores/pbxStore'

interface PBXDetailsModalProps {
  pbx: PBXInstance | null
  isOpen: boolean
  onClose: () => void
  onViewNotes: (pbx: PBXInstance) => void
  onEdit: (pbx: PBXInstance) => void
}

const formatHostname = (url: string) => {
  try {
    return new URL(url).hostname
  } catch (error) {
    return url
  }
}

const PBXDetailsModal = ({ pbx, isOpen, onClose, onViewNotes, onEdit }: PBXDetailsModalProps) => {
  if (!pbx) return null

  const hostname = formatHostname(pbx.url)
  // Robust parser for siteInfo: supports string or object. Returns either parsed data or raw text when not JSON.
  const parseSiteInfo = (siteInfo: any) => {
    const defaults = { internet: '', supplier: '', serviceUsername: '', raw: '' as string | undefined }
    if (!siteInfo) return defaults
    try {
      const data = typeof siteInfo === 'string' ? JSON.parse(siteInfo) : siteInfo
      if (data && typeof data === 'object' && (data.internet || data.supplier || data.serviceUsername)) {
        return {
          internet: data.internet ?? data['internet'] ?? '',
          supplier: data.supplier ?? data['supplier'] ?? '',
          serviceUsername: data.serviceUsername ?? data['serviceUsername'] ?? '',
          raw: '',
        }
      }
    } catch {
      // Not JSON, fall through to return raw string below
    }
    // If not JSON, store raw string
    return { internet: '', supplier: '', serviceUsername: '', raw: String(siteInfo) }
  }
  const extensionLabel = pbx.extensionCount != null ? `${pbx.extensionCount} extensions` : 'Extensions unknown'

  // Inline editing removed; edits are handled in dedicated edit modal

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="relative w-full max-w-xl bg-dark-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-slate-700 flex flex-col gap-2 bg-dark-900/60">
              <h2 className="text-2xl font-semibold text-white leading-tight">{pbx.name}</h2>
              <p className="text-sm text-slate-400">{hostname}</p>
            </div>

            <div className="p-6 space-y-5">
              { /* Site Information boxed in the dedicated section below; inline block removed */ }
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-700 bg-dark-900/40 space-y-2">
                  <div className="flex items-center space-x-2 text-slate-300">
                    <ExternalLink className="w-4 h-4 text-primary-400" />
                    <span className="text-xs uppercase tracking-wide text-slate-500">PBX URL</span>
                  </div>
                  <a
                    href={pbx.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-primary-400 hover:text-primary-300 break-all"
                  >
                    {pbx.url}
                  </a>
                </div>

                <div className="p-4 rounded-xl border border-slate-700 bg-dark-900/40 space-y-2">
                  <div className="flex items-center space-x-2 text-slate-300">
                    <Phone className="w-4 h-4 text-secondary-400" />
                    <span className="text-xs uppercase tracking-wide text-slate-500">Extension Capacity</span>
                  </div>
                  <p className="text-sm text-slate-200">{extensionLabel}</p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-700 bg-dark-900/40 space-y-2">
                <div className="flex items-center space-x-2 text-slate-300">
                  <MapPin className="w-4 h-4 text-primary-400" />
                  <span className="text-xs uppercase tracking-wide text-slate-500">Site Information</span>
                </div>
                {(() => {
                  const info = parseSiteInfo(pbx?.siteInfo)
                  if (info.raw && info.raw.length) {
                    return <div className="text-sm text-slate-200">{info.raw}</div>
                  }
                  if (!info.internet && !info.supplier && !info.serviceUsername) {
                    return <div className="text-sm text-slate-200">No site information captured yet.</div>
                  }
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-sm text-slate-200"><strong>Internet</strong>: {info.internet || '—'}</div>
                      <div className="text-sm text-slate-200"><strong>Supplier</strong>: {info.supplier || '—'}</div>
                      <div className="text-sm text-slate-200"><strong>Username</strong>: {info.serviceUsername || ''}</div>
                    </div>
                  )
                })()}
              </div>

              <div className="p-4 rounded-xl border border-slate-700 bg-dark-900/40 space-y-2">
                <div className="flex items-center space-x-2 text-slate-300">
                  <Tag className="w-4 h-4 text-secondary-400" />
                  <span className="text-xs uppercase tracking-wide text-slate-500">Tags</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(pbx.tags ?? []).length === 0 ? (
                    <span className="text-sm text-slate-400">No tags assigned.</span>
                  ) : (
                    (pbx.tags ?? []).map((tag) => (
                      <span key={tag} className="px-3 py-1 text-xs rounded-full bg-secondary-500/15 text-secondary-300 border border-secondary-500/30">
                        {tag}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-6 border-t border-slate-700 bg-dark-900/60">
                <div className="flex items-center space-x-4 text-xs text-slate-500">
                  <div>
                    <span className="uppercase tracking-wide font-semibold text-slate-400">Created</span>
                    <div className="text-slate-300 text-sm">{pbx.createdAt ? new Date(pbx.createdAt).toLocaleString() : '—'}</div>
                  </div>
                  <div>
                    <span className="uppercase tracking-wide font-semibold text-slate-400">Updated</span>
                    <div className="text-slate-300 text-sm">{pbx.updatedAt ? new Date(pbx.updatedAt).toLocaleString() : '—'}</div>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => { console.debug('PBXDetailsModal: Edit clicked for', pbx?.id); onEdit(pbx); }}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Pencil className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => onViewNotes(pbx)}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Open Notes</span>
                </button>
                <a
                  href={pbx.url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary flex items-center space-x-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Launch PBX</span>
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default PBXDetailsModal
