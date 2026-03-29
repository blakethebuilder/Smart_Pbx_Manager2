import { motion } from 'framer-motion'
import { Menu, User, LogOut } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { usePBXStore } from '../../stores/pbxStore'

interface HeaderProps {
  onMenuClick: () => void
}

const Header = ({ onMenuClick }: HeaderProps) => {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const { logout, techName } = useAuthStore()
  const { pbxInstances } = usePBXStore()

  const totalCount = pbxInstances.length

  return (
    <header className="bg-dark-800 border-b border-slate-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={onMenuClick} className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <div className="text-sm text-slate-400 hidden md:block">{totalCount} Hotlinks Active</div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <button onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-2 text-slate-400 hover:text-white transition-colors">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm text-slate-300 hidden md:block">{techName}</span>
            </button>

            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 mt-2 w-48 bg-dark-800 border border-slate-700 rounded-lg shadow-xl z-50"
              >
                <div className="p-3 border-b border-slate-700">
                  <p className="text-sm font-medium text-white">{techName}</p>
                  <p className="text-xs text-slate-400">{techName === 'blakeAdmin' ? 'Super Administrator' : 'Technician'}</p>
                </div>
                <div className="p-2">
                  <button onClick={() => { logout(); setShowUserMenu(false) }}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-error-400 hover:text-error-300 hover:bg-error-500/10 rounded-lg transition-colors">
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