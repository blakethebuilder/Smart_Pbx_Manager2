import { motion } from 'framer-motion'
import { 
  Home, 
  Server, 
  Users, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  X,
  Shield,
  Activity,
  BookOpen
} from 'lucide-react'
import { cn } from '../../utils/cn'

interface SidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
  onClose?: () => void
}

const Sidebar = ({ collapsed, onToggleCollapse, onClose }: SidebarProps) => {
  const menuItems = [
    { icon: Home, label: 'Dashboard', active: true },
    { icon: Server, label: 'PBX Instances' },
    { icon: Users, label: 'Clients' },
    { icon: Activity, label: 'Monitoring' },
    { icon: BookOpen, label: 'Notes' },
    { icon: Settings, label: 'Settings' },
  ]

  return (
    <motion.div
      initial={false}
      animate={{ width: collapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="h-screen bg-dark-800 border-r border-slate-700 flex flex-col relative"
    >
      {/* Header */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center space-x-3"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">MSP PBX</h1>
                <p className="text-xs text-slate-400">Dashboard</p>
              </div>
            </motion.div>
          )}
          
          {/* Mobile Close Button */}
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item, index) => (
          <motion.button
            key={item.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              "w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200",
              item.active 
                ? "bg-primary-500/20 text-primary-400 border border-primary-500/30" 
                : "text-slate-400 hover:text-white hover:bg-slate-700/50"
            )}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && (
              <span className="font-medium truncate">{item.label}</span>
            )}
          </motion.button>
        ))}
      </nav>

      {/* Collapse Toggle */}
      <div className="p-4 border-t border-slate-700">
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex w-full items-center justify-center p-3 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>
    </motion.div>
  )
}

export default Sidebar