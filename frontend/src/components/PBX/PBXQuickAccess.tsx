import { motion } from 'framer-motion'
import { Star, Clock, Tag } from 'lucide-react'
import { usePBXStore } from '../../stores/pbxStore'
import { getStatusDotClass } from '../../utils/formatters'

const PBXQuickAccess = () => {
  const { 
    pbxInstances, 
    favorites, 
    recentlyAccessed, 
    selectPBX 
  } = usePBXStore()

  const favoriteInstances = pbxInstances.filter(pbx => favorites.includes(pbx.id))
  const recentInstances = recentlyAccessed
    .map(id => pbxInstances.find(pbx => pbx.id === id))
    .filter(Boolean)
    .slice(0, 5) as any[]

  const allTags = Array.from(
    new Set(pbxInstances.flatMap(pbx => pbx.tags || []))
  ).slice(0, 8)

  if (favoriteInstances.length === 0 && recentInstances.length === 0 && allTags.length === 0) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-6 space-y-6"
    >
      <h2 className="text-lg font-semibold text-white">Quick Access</h2>

      <div className="space-y-4">
        {/* Favorites */}
        {favoriteInstances.length > 0 && (
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Star className="w-4 h-4 text-warning-500" />
              <span className="text-sm font-medium text-slate-300">Favorites</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {favoriteInstances.map(pbx => (
                <motion.button
                  key={pbx.id}
                  onClick={() => selectPBX(pbx)}
                  className="flex items-center space-x-2 px-3 py-2 bg-dark-900 hover:bg-slate-700 rounded-lg transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className={getStatusDotClass(pbx.status)} />
                  <span className="text-sm text-white">{pbx.name}</span>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Recent */}
        {recentInstances.length > 0 && (
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Clock className="w-4 h-4 text-primary-400" />
              <span className="text-sm font-medium text-slate-300">Recently Accessed</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentInstances.map(pbx => (
                <motion.button
                  key={pbx.id}
                  onClick={() => selectPBX(pbx)}
                  className="flex items-center space-x-2 px-3 py-2 bg-dark-900 hover:bg-slate-700 rounded-lg transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className={getStatusDotClass(pbx.status)} />
                  <span className="text-sm text-white">{pbx.name}</span>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {allTags.length > 0 && (
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Tag className="w-4 h-4 text-secondary-400" />
              <span className="text-sm font-medium text-slate-300">Client Tags</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {allTags.map(tag => (
                <motion.button
                  key={tag}
                  className="px-3 py-1 bg-secondary-500/20 text-secondary-400 text-sm rounded-full hover:bg-secondary-500/30 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {tag}
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default PBXQuickAccess