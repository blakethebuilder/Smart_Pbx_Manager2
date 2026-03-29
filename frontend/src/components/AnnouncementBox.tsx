import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Megaphone, Plus, Trash2, X, ChevronDown, ChevronUp } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'

interface Announcement {
  id: string
  content: string
  author: string
  createdAt: string
  pinned: boolean
}

const AnnouncementBox = () => {
  const { techName } = useAuthStore()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [collapsed, setCollapsed] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [newContent, setNewContent] = useState('')
  const [pinned, setPinned] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const load = async () => {
    try {
      const res = await fetch('/api/announcements')
      if (res.ok) setAnnouncements(await res.json())
    } catch { /* silent */ }
  }

  useEffect(() => { load() }, [])

  const handleAdd = async () => {
    if (!newContent.trim()) return
    setIsLoading(true)
    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent.trim(), author: techName || 'Tech', pinned }),
      })
      if (res.ok) {
        await load()
        setNewContent('')
        setPinned(false)
        setShowAdd(false)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/announcements/${id}`, { method: 'DELETE' })
    setAnnouncements(prev => prev.filter(a => a.id !== id))
  }

  const sorted = [...announcements].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3 cursor-pointer select-none border-b border-slate-700/50"
        onClick={() => setCollapsed(c => !c)}
      >
        <div className="flex items-center space-x-2">
          <Megaphone className="w-4 h-4 text-primary-400" />
          <span className="text-sm font-semibold text-white">Team Announcements</span>
          {announcements.length > 0 && (
            <span className="px-2 py-0.5 bg-primary-500/20 text-primary-400 text-xs rounded-full">
              {announcements.length}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={e => { e.stopPropagation(); setShowAdd(s => !s) }}
            className="p-1 text-slate-400 hover:text-primary-400 transition-colors"
            title="Add announcement"
          >
            <Plus className="w-4 h-4" />
          </button>
          {collapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
        </div>
      </div>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Add form */}
            <AnimatePresence>
              {showAdd && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="px-5 pt-4 pb-2 border-b border-slate-700/50 space-y-2"
                >
                  <textarea
                    value={newContent}
                    onChange={e => setNewContent(e.target.value)}
                    placeholder="Write an announcement for the team..."
                    rows={2}
                    className="w-full px-3 py-2 bg-dark-900 border border-slate-600 rounded-lg text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  />
                  <div className="flex items-center justify-between">
                    <label className="flex items-center space-x-2 text-xs text-slate-400 cursor-pointer">
                      <input type="checkbox" checked={pinned} onChange={e => setPinned(e.target.checked)}
                        className="w-3 h-3 text-primary-500 bg-dark-900 border-slate-600 rounded" />
                      <span>Pin to top</span>
                    </label>
                    <div className="flex space-x-2">
                      <button onClick={() => setShowAdd(false)} className="btn-secondary btn-sm">
                        <X className="w-3 h-3" />
                      </button>
                      <button onClick={handleAdd} disabled={!newContent.trim() || isLoading}
                        className="btn-primary btn-sm disabled:opacity-50">
                        Post
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* List */}
            <div className="px-5 py-3 space-y-2 max-h-48 overflow-y-auto">
              {sorted.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-3">
                  No announcements yet. Post one for the team.
                </p>
              ) : (
                sorted.map(a => (
                  <div key={a.id}
                    className={`flex items-start justify-between p-3 rounded-lg text-sm ${
                      a.pinned ? 'bg-primary-500/10 border border-primary-500/20' : 'bg-dark-900'
                    }`}>
                    <div className="flex-1 min-w-0">
                      {a.pinned && (
                        <span className="text-xs text-primary-400 font-medium mr-2">📌 Pinned</span>
                      )}
                      <span className="text-slate-200">{a.content}</span>
                      <div className="text-xs text-slate-500 mt-1">
                        {a.author} · {new Date(a.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <button onClick={() => handleDelete(a.id)}
                      className="ml-3 p-1 text-slate-500 hover:text-error-400 transition-colors shrink-0">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AnnouncementBox
