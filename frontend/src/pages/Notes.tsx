import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Plus, 
  Search, 
  StickyNote, 
  User, 
  Edit3, 
  Trash2, 
  Save, 
  X 
} from 'lucide-react'
import { usePBXStore } from '../stores/pbxStore'
import { useAuthStore } from '../stores/authStore'

interface NotesProps {
  selectedPBXId?: string
}

const Notes = ({ selectedPBXId }: NotesProps) => {
  const { pbxInstances, addNote, updateNote, deleteNote } = usePBXStore()
  const { techName } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [pbxFilter, setPbxFilter] = useState<string>(selectedPBXId || 'all')
  const [showAddNote, setShowAddNote] = useState(false)
  const [editingNote, setEditingNote] = useState<{ pbxId: string; noteId: string } | null>(null)
  const [editContent, setEditContent] = useState('')
  const [newNote, setNewNote] = useState({ content: '', pbxId: selectedPBXId || '' })

  const allNotes = pbxInstances.flatMap(pbx => 
    (pbx.notes || []).map(note => ({
      ...note,
      pbxId: pbx.id,
      pbxName: pbx.name
    }))
  ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  const filteredNotes = allNotes.filter(note => {
    const matchesSearch = note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         note.pbxName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesPBX = pbxFilter === 'all' || note.pbxId === pbxFilter
    return matchesSearch && matchesPBX
  })

  const handleAddNote = async () => {
    if (newNote.content.trim() && newNote.pbxId) {
      try {
        await addNote(newNote.pbxId, {
          content: newNote.content.trim(),
          author: techName || 'Tech',
          priority: 'medium'
        })
        setNewNote({ content: '', pbxId: selectedPBXId || '' })
        setShowAddNote(false)
      } catch (error) {
        console.error('Failed to add note:', error)
      }
    }
  }

  const handleSaveEdit = async () => {
    if (editingNote && editContent.trim()) {
      try {
        await updateNote(editingNote.pbxId, editingNote.noteId, editContent.trim())
        setEditingNote(null)
        setEditContent('')
      } catch (error) {
        console.error('Failed to update note:', error)
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Tech Notes</h1>
          <p className="text-slate-400 mt-1">Manage technical notes for your client hotlinks</p>
        </div>
        <button onClick={() => setShowAddNote(true)} className="btn-primary flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Add Note</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-dark-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <select
          value={pbxFilter}
          onChange={(e) => setPbxFilter(e.target.value)}
          className="bg-dark-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">All PBX Instances</option>
          {pbxInstances.map(pbx => <option key={pbx.id} value={pbx.id}>{pbx.name}</option>)}
        </select>
      </div>

      <div className="space-y-4">
        {filteredNotes.length === 0 ? (
          <div className="card p-12 text-center text-slate-500">
            <StickyNote className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No notes found matching your filters.</p>
          </div>
        ) : (
          filteredNotes.map((note) => (
            <motion.div key={`${note.pbxId}-${note.id}`} layout className="card p-5 bg-dark-800 border border-slate-700/50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="px-2 py-0.5 bg-primary-500/10 text-primary-400 text-[10px] font-bold uppercase rounded border border-primary-500/20">{note.pbxName}</span>
                    <span className="text-[10px] text-slate-500">{new Date(note.timestamp).toLocaleString()}</span>
                  </div>
                  
                  {editingNote?.noteId === note.id ? (
                    <div className="space-y-3">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full p-3 bg-dark-900 border border-slate-600 rounded-lg text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                        rows={3}
                        autoFocus
                      />
                      <div className="flex space-x-2">
                        <button onClick={handleSaveEdit} className="btn-primary btn-sm flex items-center space-x-1"><Save className="w-3 h-3" /><span>Save</span></button>
                        <button onClick={() => setEditingNote(null)} className="btn-secondary btn-sm flex items-center space-x-1"><X className="w-3 h-3" /><span>Cancel</span></button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-slate-300 text-sm whitespace-pre-wrap">{note.content}</p>
                      <div className="flex items-center space-x-2 mt-3 text-xs text-slate-500">
                        <User className="w-3 h-3" />
                        <span>{note.author}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex space-x-1 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditingNote({ pbxId: note.pbxId, noteId: note.id }); setEditContent(note.content) }} className="p-1 text-slate-500 hover:text-white"><Edit3 className="w-4 h-4" /></button>
                  <button onClick={() => deleteNote(note.pbxId, note.id)} className="p-1 text-slate-500 hover:text-error-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {showAddNote && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-dark-800 border border-slate-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6">Add New Note</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">PBX Client</label>
                <select
                  value={newNote.pbxId}
                  onChange={(e) => setNewNote({ ...newNote, pbxId: e.target.value })}
                  className="w-full bg-dark-900 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select a client...</option>
                  {pbxInstances.map(pbx => <option key={pbx.id} value={pbx.id}>{pbx.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Technical Note</label>
                <textarea
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  placeholder="Describe technical details, credentials, or recent changes..."
                  className="w-full p-3 bg-dark-900 border border-slate-600 rounded-lg text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={5}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-8">
              <button onClick={() => setShowAddNote(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleAddNote} disabled={!newNote.content.trim() || !newNote.pbxId} className="btn-primary px-6">Add Note</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default Notes
