import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Plus, Loader } from 'lucide-react'

interface QuickNoteModalProps {
  pbxId: string
  isOpen: boolean
  onClose: () => void
  onSubmit: (content: string) => void
}

const QuickNoteModal = ({ pbxId, isOpen, onClose, onSubmit }: QuickNoteModalProps) => {
  const [content, setContent] = useState('')
  const [priority, setPriority] = useState<'medium'>('medium')
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async () => {
    if (!content.trim()) return

    setIsSaving(true)
    try {
      await onSubmit(content.trim())
    } finally {
      setIsSaving(false)
      setContent('')
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-lg bg-dark-800 border border-slate-700 rounded-xl shadow-2xl"
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">Quick Note for PBX #{pbxId.substring(0, 4)}...</h2>
          <button onClick={onClose} disabled={isSaving}
            className="p-2 text-slate-400 hover:text-white transition-colors disabled:opacity-50">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter quick note here..."
            rows={5}
            className="w-full px-4 py-3 bg-dark-900 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-secondary-500 resize-y"
            disabled={isSaving}
          />
          
          {/* Priority selector (Simplified) */}
          <div className="flex items-center space-x-3">
            <span className="text-sm text-slate-400">Priority:</span>
            <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'medium')}
                className="bg-dark-900 border border-slate-600 rounded-lg px-3 py-1 text-sm text-white"
                disabled={isSaving}
            >
                <option value="medium">Medium</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t border-slate-700">
          <button onClick={onClose} disabled={isSaving} className="btn-secondary disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={!content.trim() || isSaving} className="btn-primary flex items-center space-x-2 disabled:opacity-50">
            {isSaving ? <Loader className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            <span>{isSaving ? 'Saving...' : 'Save Note'}</span>
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default QuickNoteModal
