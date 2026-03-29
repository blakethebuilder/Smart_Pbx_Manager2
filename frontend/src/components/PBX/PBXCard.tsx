import { motion } from 'framer-motion'
import { ExternalLink, Trash2, Heart, HeartOff, StickyNote, MessageSquarePlus } from 'lucide-react'
import { PBXInstance, usePBXStore } from '../../stores/pbxStore'
import { pbxService } from '../../services/pbxService'

interface PBXCardProps {
  pbx: PBXInstance
  viewMode?: 'grid' | 'list'
  onQuickNote: (pbxId: string) => void
}

const PBXCard = ({ pbx, viewMode = 'grid', onQuickNote }: PBXCardProps) => {
  const { 
    selectPBX, 
    favorites, 
    addToFavorites, 
    removeFromFavorites 
  } = usePBXStore()

  const isFavorite = favorites.includes(pbx.id)
  const hasNotes = pbx.notes && pbx.notes.length > 0

  const handleOpenPBX = (e: React.MouseEvent) => {
    e.stopPropagation()
    window.open(pbx.url, '_blank')
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm(`Are you sure you want to delete "${pbx.name}"?`)) {
      try {
        await pbxService.deletePBX(pbx.id)
      } catch (error) {
        console.error('Delete failed:', error)
      }
    }
  }

  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isFavorite) {
      removeFromFavorites(pbx.id)
    } else {
      addToFavorites(pbx.id)
    }
  }

  const handleCardClick = () => {
    selectPBX(pbx)
  }

  if (viewMode === 'list') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        whileHover={{ y: -2 }}
        onClick={handleCardClick}
        className="card card-hover p-4 cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-white">{pbx.name}</h3>
                {hasNotes && (
                  <StickyNote className="w-4 h-4 text-primary-400" />
                )}
              </div>
              <p className="text-slate-400 text-sm">{new URL(pbx.url).hostname}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleFavoriteToggle}
              className="p-2 text-slate-400 hover:text-warning-500 transition-colors"
            >
              {isFavorite ? (
                <Heart className="w-4 h-4 fill-current text-warning-500" />
              ) : (
                <HeartOff className="w-4 h-4" />
              )}
            </button>

            <button
              onClick={handleOpenPBX}
              className="btn-primary btn-sm flex items-center space-x-2"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open</span>
            </button>

            <button
              onClick={handleDelete}
              className="p-2 text-slate-500 hover:text-error-500 transition-colors"
              title="Delete Client"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -2 }}
      onClick={handleCardClick}
      className="card card-hover p-3 cursor-pointer relative overflow-hidden group"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-secondary-500/5" />
      
      <div className="relative space-y-2">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-white truncate group-hover:text-primary-400 transition-colors">{pbx.name}</h3>
            <p className="text-slate-400 text-xs truncate mt-0.5">{new URL(pbx.url).hostname}</p>
          </div>

          <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
            <button
              onClick={handleFavoriteToggle}
              className="p-1 text-slate-500 hover:text-warning-500 transition-colors"
            >
              {isFavorite ? (
                <Heart className="w-3 h-3 fill-current text-warning-500" />
              ) : (
                <HeartOff className="w-3 h-3" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1">
            {hasNotes && (
              <div className="flex items-center space-x-1 px-2 py-0.5 bg-warning-500/10 border border-warning-500/20 rounded">
                <StickyNote className="w-2.5 h-2.5 text-warning-500" />
                <span className="font-bold text-warning-500 uppercase tracking-wider">Notes</span>
              </div>
            )}
          </div>
          
            <button
              onClick={(e) => { e.stopPropagation(); onQuickNote(pbx.id) }}
              className="p-1 text-slate-500 hover:text-success-400 transition-colors"
              title="Add Quick Note"
            >
              <MessageSquarePlus className="w-3.5 h-3.5" />
            </button>
        </div>

        <div className="pt-1">
          <button
            onClick={handleOpenPBX}
            className="w-full btn-primary py-1.5 flex items-center justify-center space-x-2 text-xs font-semibold"
          >
            <ExternalLink className="w-3 h-3" />
            <span>Open</span>
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default PBXCard