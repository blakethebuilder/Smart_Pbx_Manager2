import { Home, Server, Users, Settings } from 'lucide-react'
import { cn } from '../../utils/cn'

const MobileNav = () => {
  const navItems = [
    { icon: Home, label: 'Home', active: true },
    { icon: Server, label: 'PBX' },
    { icon: Users, label: 'Clients' },
    { icon: Settings, label: 'Settings' },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-dark-800 border-t border-slate-700 px-4 py-2 z-40">
      <div className="flex items-center justify-around">
        {navItems.map((item) => (
          <button
            key={item.label}
            className={cn(
              "flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-colors",
              item.active 
                ? "text-primary-400" 
                : "text-slate-400 hover:text-white"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default MobileNav