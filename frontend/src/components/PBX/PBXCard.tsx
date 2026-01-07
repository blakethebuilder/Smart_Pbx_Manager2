import { motion } from 'framer-motion'
import { ExternalLink, Play, Trash2, Heart, HeartOff, StickyNote } from 'lucide-react'
import { PBXInstance, usePBXStore } from '../../stores/pbxStore'
import { pbxService } from '../../services/pbxService'
import { formatLastCheck, getStatusDotClass } from '../../utils/formatters'
import { cn } from '../../utils/cn'

interface PBXCardProps {
  pbx: PBXInstance
  viewMode?: 'grid' | 'list'
}

const PBXCard = ({ pbx, viewMode = 'grid' }: PBXCardProps) => {
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

  const handleTest = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await pbxService.testPBX(pbx.id)
    } catch (error) {
      console.error('Test failed:', error)
    }
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
            <div className={getStatusDotClass(pbx.status)} />
            
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-white">{pbx.name}</h3>
                {pbx.appId === 'HOTLINK_PLACEHOLDER' && (
                  <span className="px-2 py-1 bg-secondary-500/20 text-secondary-400 text-xs rounded-full">
                    Hot Link
                  </span>
                )}
              </div>
              <p className="text-slate-400 text-sm">{new URL(pbx.url).hostname}</p>
            </div>

            {pbx.tags && pbx.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {pbx.tags.slice(0, 2).map(tag => (
                  <span 
                    key={tag}
                    className="px-2 py-1 bg-primary-500/20 text-primary-400 text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
                {pbx.tags.length > 2 && (
                  <span className="px-2 py-1 bg-slate-500/20 text-slate-400 text-xs rounded-full">
                    +{pbx.tags.length - 2}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {hasNotes && (
              <StickyNote className="w-4 h-4 text-warning-500" />
            )}
            
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
              className="btn-primary btn-sm"
            >
              <ExternalLink className="w-4 h-4" />
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
      className="card card-hover p-4 cursor-pointer relative overflow-hidden"
    >
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-secondary-500/5" />
      
      {/* Content */}
      <div className="relative space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            <div className={getStatusDotClass(pbx.status)} />
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-semibold text-white truncate">{pbx.name}</h3>
              <p className="text-slate-400 text-xs truncate">{new URL(pbx.url).hostname}</p>
            </div>
          </div>

          <div className="flex items-center space-x-1 flex-shrink-0">
            {hasNotes && (
              <StickyNote className="w-3 h-3 text-warning-500" />
            )}
            
            <button
              onClick={handleFavoriteToggle}
              className="p-1 text-slate-400 hover:text-warning-500 transition-colors"
            >
              {isFavorite ? (
                <Heart className="w-3 h-3 fill-current text-warning-500" />
              ) : (
                <HeartOff className="w-3 h-3" />
              )}
            </button>
          </div>
        </div>

        {/* Status & Type */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className={cn(
              "px-2 py-1 rounded-full text-xs font-medium",
              pbx.status === 'healthy' && "bg-success-500/20 text-success-400",
              pbx.status === 'error' && "bg-error-500/20 text-error-400",
              pbx.status === 'unknown' && "bg-slate-500/20 text-slate-400"
            )}>
              {pbx.appId === 'HOTLINK_PLACEHOLDER' ? 'Hot Link' :
               pbx.status === 'healthy' ? 'Online' : 
               pbx.status === 'error' ? 'Offline' : 'Unknown'}
            </span>
          </div>

          {pbx.lastCheck && pbx.appId !== 'HOTLINK_PLACEHOLDER' && (
            <span className="text-xs text-slate-500 truncate">
              {formatLastCheck(pbx.lastCheck)}
            </span>
          )}
        </div>

        {/* Tags - Show only first 2 */}
        {pbx.tags && pbx.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {pbx.tags.slice(0, 2).map(tag => (
              <span 
                key={tag}
                className="px-2 py-1 bg-primary-500/20 text-primary-400 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
            {pbx.tags.length > 2 && (
              <span className="px-2 py-1 bg-slate-500/20 text-slate-400 text-xs rounded-full">
                +{pbx.tags.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Error Message - Compact */}
        {pbx.status === 'error' && pbx.health?.error && (
          <div className="p-2 bg-error-500/10 border border-error-500/20 rounded-lg">
            <p className="text-error-400 text-xs truncate" title={pbx.health.error}>
              {pbx.health.error}
            </p>
          </div>
        )}

        {/* Actions - Compact */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={handleOpenPBX}
            className="btn-primary btn-sm flex items-center space-x-1"
          >
            <ExternalLink className="w-3 h-3" />
            <span className="text-xs">Open</span>
          </button>

          <div className="flex items-center space-x-1">
            <button
              onClick={handleTest}
              className="btn-secondary p-1.5"
              title="Test Connection"
            >
              <Play className="w-3 h-3" />
            </button>
            
            <button
              onClick={handleDelete}
              className="btn-danger p-1.5"
              title="Delete PBX"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default PBXCard