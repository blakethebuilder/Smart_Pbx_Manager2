import { motion, AnimatePresence } from 'framer-motion'
import { PBXInstance } from '../../stores/pbxStore'
import PBXCard from './PBXCard'

interface PBXGridProps {
  instances: PBXInstance[]
  viewMode: 'grid' | 'list'
}

const PBXGrid = ({ instances, viewMode }: PBXGridProps) => {
  if (instances.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12"
      >
        <div className="card p-8 max-w-md mx-auto">
          <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📡</span>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No PBX Instances</h3>
          <p className="text-slate-400 mb-4">
            Add your first PBX instance to start monitoring your clients
          </p>
        </div>
      </motion.div>
    )
  }

  return (
    <div className={
      viewMode === 'grid' 
        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4"
        : "space-y-3"
    }>
      <AnimatePresence mode="popLayout">
        {instances.map((pbx, index) => (
          <motion.div
            key={pbx.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: index * 0.1 }}
          >
            <PBXCard pbx={pbx} viewMode={viewMode} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export default PBXGrid