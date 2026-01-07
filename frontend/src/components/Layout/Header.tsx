import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Menu, 
  Search, 
  Bell, 
  User, 
  LogOut,
  Settings,
  Wifi,
  WifiOff
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { usePBXStore } from '../../stores/pbxStore'
import { socketService } from '../../services/socketService'

interface HeaderProps {
  onMenuClick: () => void
}

const Header = ({ onMenuClick }: HeaderProps) => {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const { logout } = useAuthStore()
  const { searchQuery, setSearchQuery, pbxInstances } = usePBXStore()
  const [lastUpdate] = useState(new Date())

  const connectedCount = pbxInstances.filter(pbx => pbx.status === 'healthy').length
  const totalCount = pbxInstances.length
  const isSocketConnected = socketService.connected

  const handleLogout = () => {
    logout()
    setShowUserMenu(false)
  }

  return (
    <header className="bg-dark-800 border-b border-slate-700 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          {/* Mobile Menu Button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search PBX instances..."
              className="pl-10 pr-4 py-2 w-64 bg-dark-900 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          {/* Connection Status */}
          <div className="flex items-center space-x-2 px-3 py-2 bg-dark-900 rounded-lg">
            {isSocketConnected ? (
              <Wifi className="w-4 h-4 text-success-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-error-500" />
            )}
            <span className="text-sm text-slate-300">
              {connectedCount}/{totalCount} Connected
            </span>
          </div>

          {/* Last Update */}
          <div className="hidden md:block text-sm text-slate-400">
            Last update: {lastUpdate.toLocaleTimeString()}
          </div>

          {/* Notifications */}
          <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-error-500 rounded-full"></span>
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-2 text-slate-400 hover:text-white transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            </button>

            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 mt-2 w-48 bg-dark-800 border border-slate-700 rounded-lg shadow-xl z-50"
              >
                <div className="p-3 border-b border-slate-700">
                  <p className="text-sm font-medium text-white">MSP Admin</p>
                  <p className="text-xs text-slate-400">admin@msp.com</p>
                </div>
                
                <div className="p-2">
                  <button className="w-full flex items-center space-x-2 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors">
                    <Settings className="w-4 h-4" />
                    <span className="text-sm">Settings</span>
                  </button>
                  
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-error-400 hover:text-error-300 hover:bg-error-500/10 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm">Sign Out</span>
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header