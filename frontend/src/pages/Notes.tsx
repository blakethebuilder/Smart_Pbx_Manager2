import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Plus, 
  Search, 
  StickyNote, 
  User, 
  AlertTriangle,
  CheckCircle,
  Circle,
  Edit3,
  Trash2,
  Save,
  X
} from 'lucide-react'
import { usePBXStore } from '../stores/pbxStore'
import { formatLastCheck } from '../utils/formatters'

const Notes = () => {
  const { pbxInstances, addNote, updateNote, deleteNote } = usePBXStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all')
  const [selectedPBX, setSelectedPBX] = useState<string>('all')
  const [showAddNote, setShowAddNote] = useState(false)
  const [editingNote, setEditingNote] = useState<{ pbxId: string; noteId: string } | null>(null)
  
  // New note form
  const [newNote, setNewNote] = useState({
    content: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    pbxId: ''
  })

  // Edit note form
  const [editContent, setEditContent] = useState('')

  // Get all notes from all PBX instances
  const allNotes = pbxInstances.flatMap(pbx => 
    (pbx.notes || []).map(note => ({
      ...note,
      pbxId: pbx.id,
      pbxName: pbx.name
    }))
  ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  // Filter notes
  const filteredNotes = allNotes.filter(note => {
    const matchesSearch = note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         note.pbxName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesPriority = priorityFilter === 'all' || note.priority === priorityFilter
    const matchesPBX = selectedPBX === 'all' || note.pbxId === selectedPBX
    
    return matchesSearch && matchesPriority && matchesPBX
  })

  const handleAddNote = () => {
    if (newNote.content.trim() && newNote.pbxId) {
      addNote(newNote.pbxId, {
        content: newNote.content.trim(),
        author: 'Tech User', // Could be from auth context
        priority: newNote.priority
      })
      
      setNewNote({ content: '', priority: 'medium', pbxId: '' })
      setShowAddNote(false)
    }
  }

  const handleEditNote = (pbxId: string, noteId: string, content: string) => {
    setEditingNote({ pbxId, noteId })
    setEditContent(content)
  }

  const handleSaveEdit = () => {
    if (editingNote && editContent.trim()) {
      updateNote(editingNote.pbxId, editingNote.noteId, editContent.trim())
      setEditingNote(null)
      setEditContent('')
    }
  }

  const handleDeleteNote = (pbxId: string, noteId: string) => {
    if (confirm('Are you sure you want to delete this note?')) {
      deleteNote(pbxId, noteId)
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="w-4 h-4 text-error-500" />
      case 'medium': return <Circle className="w-4 h-4 text-warning-500" />
      case 'low': return <CheckCircle className="w-4 h-4 text-success-500" />
      default: return <Circle className="w-4 h-4 text-slate-500" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-error-500 bg-error-500/5'
      case 'medium': return 'border-l-warning-500 bg-warning-500/5'
      case 'low': return 'border-l-success-500 bg-success-500/5'
      default: return 'border-l-slate-500 bg-slate-500/5'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Tech Notes</h1>
          <p className="text-slate-400 mt-1">
            Manage technical notes and documentation for your PBX instances
          </p>
        </div>

        <button
          onClick={() => setShowAddNote(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Note</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total Notes</p>
              <p className="text-2xl font-bold text-white">{allNotes.length}</p>
            </div>
            <StickyNote className="w-8 h-8 text-primary-400" />
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">High Priority</p>
              <p className="text-2xl font-bold text-error-500">
                {allNotes.filter(n => n.priority === 'high').length}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-error-400" />
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Medium Priority</p>
              <p className="text-2xl font-bold text-warning-500">
                {allNotes.filter(n => n.priority === 'medium').length}
              </p>
            </div>
            <Circle className="w-8 h-8 text-warning-400" />
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Low Priority</p>
              <p className="text-2xl font-bold text-success-500">
                {allNotes.filter(n => n.priority === 'low').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-success-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-dark-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
            className="bg-dark-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>

          {/* PBX Filter */}
          <select
            value={selectedPBX}
            onChange={(e) => setSelectedPBX(e.target.value)}
            className="bg-dark-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All PBX Instances</option>
            {pbxInstances.map(pbx => (
              <option key={pbx.id} value={pbx.id}>{pbx.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Notes List */}
      <div className="space-y-4">
        {filteredNotes.length === 0 ? (
          <div className="card p-8 text-center">
            <StickyNote className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Notes Found</h3>
            <p className="text-slate-400 mb-4">
              {allNotes.length === 0 
                ? "Start by adding your first technical note"
                : "Try adjusting your search or filters"
              }
            </p>
            {allNotes.length === 0 && (
              <button
                onClick={() => setShowAddNote(true)}
                className="btn-primary"
              >
                Add First Note
              </button>
            )}
          </div>
        ) : (
          filteredNotes.map((note) => (
            <motion.div
              key={`${note.pbxId}-${note.id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`card p-4 border-l-4 ${getPriorityColor(note.priority)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    {getPriorityIcon(note.priority)}
                    <span className="font-medium text-white">{note.pbxName}</span>
                    <span className="text-xs text-slate-500">
                      {formatLastCheck(note.timestamp.toString())}
                    </span>
                  </div>
                  
                  {editingNote?.pbxId === note.pbxId && editingNote?.noteId === note.id ? (
                    <div className="space-y-3">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full p-3 bg-dark-800 border border-slate-600 rounded-lg text-white resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                        rows={3}
                        autoFocus
                      />
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={handleSaveEdit}
                          className="btn-primary btn-sm flex items-center space-x-1"
                        >
                          <Save className="w-3 h-3" />
                          <span>Save</span>
                        </button>
                        <button
                          onClick={() => setEditingNote(null)}
                          className="btn-secondary btn-sm flex items-center space-x-1"
                        >
                          <X className="w-3 h-3" />
                          <span>Cancel</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-slate-300 whitespace-pre-wrap">{note.content}</p>
                      <div className="flex items-center space-x-2 mt-2 text-xs text-slate-500">
                        <User className="w-3 h-3" />
                        <span>{note.author}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-1 ml-4">
                  <button
                    onClick={() => handleEditNote(note.pbxId, note.id, note.content)}
                    className="p-1 text-slate-400 hover:text-white transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteNote(note.pbxId, note.id)}
                    className="p-1 text-slate-400 hover:text-error-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Add Note Modal */}
      {showAddNote && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-dark-800 rounded-lg p-6 w-full max-w-md"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Add New Note</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  PBX Instance
                </label>
                <select
                  value={newNote.pbxId}
                  onChange={(e) => setNewNote({ ...newNote, pbxId: e.target.value })}
                  className="w-full bg-dark-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select PBX Instance</option>
                  {pbxInstances.map(pbx => (
                    <option key={pbx.id} value={pbx.id}>{pbx.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Priority
                </label>
                <select
                  value={newNote.priority}
                  onChange={(e) => setNewNote({ ...newNote, priority: e.target.value as any })}
                  className="w-full bg-dark-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Note Content
                </label>
                <textarea
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  placeholder="Enter your technical note..."
                  className="w-full p-3 bg-dark-900 border border-slate-600 rounded-lg text-white placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={4}
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddNote(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNote}
                disabled={!newNote.content.trim() || !newNote.pbxId}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Note
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default Notes