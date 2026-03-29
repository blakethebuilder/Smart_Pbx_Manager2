import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft, ExternalLink, StickyNote, Heart, HeartOff,
  Plus, Edit3, Trash2, AlertTriangle, Circle, CheckCircle, User
} from 'lucide-react'
import { usePBXStore } from '../../stores/pbxStore'
import { useAuthStore } from '../../stores/authStore'

const priorityConfig = {
  high:   { label: 'High',   icon: AlertTriangle, color: 'text-error-400',   bg: 'bg-error-500/10 border-error-500/20',   dot: 'bg-error-500' },
  medium: { label: 'Medium', icon: Circle,        color: 'text-warning-400', bg: 'bg-warning-500/10 border-warning-500/20', dot: 'bg-warning-500' },
  low:    { label: 'Low',    icon: CheckCircle,   color: 'text-success-400', bg: 'bg-success-500/10 border-success-500/20', dot: 'bg-success-500' },
}

const PBXLoader = () => {
  const { selectedPBX, selectPBX, favorites, addToFavorites, removeFromFavorites, addNote, updateNote, deleteNote } = usePBXStore()
  const { techName } = useAuthStore()

  const [newNote, setNewNote] = useState('')
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  if (!selectedPBX) return null

  const isFavorite = favorites.includes(selectedPBX.id)
  const notes = selectedPBX.notes || []

  const handleAddNote = async () => {
    if (!newNote.trim()) return
    await addNote(selectedPBX.id, { content: newNote.trim(), author: techName || 'Tech', priority: newPriority })
    setNewNote('')
    setNewPriority('medium')
  }

  const handleSaveEdit = async (noteId: string) => {
    if (editContent.trim()) await updateNote(selectedPBX.id, noteId, editContent.trim())
    setEditingId(null)
  }

  const handleDelete = async (noteId: string) => {
    if (confirm('Delete this note?')) await deleteNote(selectedPBX.id, noteId)
  }

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
          <button onClick={() => selectPBX(null)} className="p-2 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">{selectedPBX.name}</h1>
            <p className="text-slate-400 text-sm">{new URL(selectedPBX.url).hostname}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button onClick={() => isFavorite ? removeFromFavorites(selectedPBX.id) : addToFavorites(selectedPBX.id)}
            className="p-2 text-slate-400 hover:text-warning-500 transition-colors">
            {isFavorite
              ? <Heart className="w-5 h-5 fill-current text-warning-500" />
              : <HeartOff className="w-5 h-5" />}
          </button>
          <button onClick={() => window.open(selectedPBX.url, '_blank')}
            className="btn-primary flex items-center space-x-2">
            <ExternalLink className="w-4 h-4" />
            <span>Open PBX</span>
          </button>
        </div>
      </div>

      {/* Notes Panel */}
      <div className="card">
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <StickyNote className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-semibold text-white">Tech Notes</h2>
            {notes.length > 0 && (
              <span className="px-2 py-0.5 bg-primary-500/20 text-primary-400 text-xs rounded-full">{notes.length}</span>
            )}
          </div>
          <div className="flex items-center space-x-2 text-sm text-slate-400">
            <User className="w-4 h-4" />
            <span>{techName}</span>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Add note */}
          <div className="space-y-2">
            <textarea
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              placeholder="Add a technical note for this client..."
              rows={3}
              className="w-full px-3 py-2 bg-dark-900 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {(['low', 'medium', 'high'] as const).map(p => {
                  const cfg = priorityConfig[p]
                  return (
                    <button key={p} onClick={() => setNewPriority(p)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                        newPriority === p ? `${cfg.bg} ${cfg.color} border-current` : 'border-slate-600 text-slate-400 hover:border-slate-500'
                      }`}>
                      {cfg.label}
                    </button>
                  )
                })}
              </div>
              <button onClick={handleAddNote} disabled={!newNote.trim()}
                className="btn-primary btn-sm flex items-center space-x-1 disabled:opacity-50">
                <Plus className="w-3 h-3" />
                <span>Add Note</span>
              </button>
            </div>
          </div>

          {/* Notes list */}
          {notes.length === 0 ? (
            <div className="text-center py-8">
              <StickyNote className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No notes yet. Add the first one above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {[...notes].reverse().map(note => {
                const cfg = priorityConfig[note.priority as keyof typeof priorityConfig] || priorityConfig.medium
                return (
                  <motion.div key={note.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-lg border ${cfg.bg}`}>
                    {editingId === note.id ? (
                      <div className="space-y-2">
                        <textarea value={editContent} onChange={e => setEditContent(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 bg-dark-800 border border-slate-600 rounded text-white resize-none focus:outline-none focus:ring-2 focus:ring-primary-500" />
                        <div className="flex space-x-2">
                          <button onClick={() => handleSaveEdit(note.id)} className="btn-primary btn-sm">Save</button>
                          <button onClick={() => setEditingId(null)} className="btn-secondary btn-sm">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                            <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label} Priority</span>
                          </div>
                          <p className="text-slate-200 text-sm whitespace-pre-wrap">{note.content}</p>
                          <div className="flex items-center space-x-3 mt-2 text-xs text-slate-500">
                            <span className="flex items-center space-x-1">
                              <User className="w-3 h-3" />
                              <span>{note.author}</span>
                            </span>
                            <span>{new Date(note.timestamp).toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="flex space-x-1 ml-3 shrink-0">
                          <button onClick={() => { setEditingId(note.id); setEditContent(note.content) }}
                            className="p-1 text-slate-400 hover:text-white transition-colors">
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button onClick={() => handleDelete(note.id)}
                            className="p-1 text-slate-400 hover:text-error-400 transition-colors">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default PBXLoader
