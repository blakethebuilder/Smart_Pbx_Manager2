import { useState } from 'react'
import { motion } from 'framer-motion'
import Sidebar from './Sidebar'
import Header from './Header'
import MobileNav from './MobileNav'

interface LayoutProps {
  children: React.ReactNode
  currentPage?: string
  onNavigate?: (page: string) => void
}

const Layout = ({ children, currentPage = 'dashboard', onNavigate }: LayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-dark-900 flex">
      {/* Desktop Sidebar - Fixed Position */}
      <div className="hidden lg:block fixed left-0 top-0 h-full z-30">
        <Sidebar 
          collapsed={sidebarCollapsed} 
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          currentPage={currentPage}
          onNavigate={onNavigate}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative w-80"
          >
            <Sidebar 
              collapsed={false} 
              onToggleCollapse={() => {}}
              onClose={() => setSidebarOpen(false)}
              currentPage={currentPage}
              onNavigate={(page) => {
                onNavigate?.(page)
                setSidebarOpen(false)
              }}
            />
          </motion.div>
        </div>
      )}

      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-70'
      }`} style={{ marginLeft: sidebarCollapsed ? '80px' : '280px' }}>
        {/* Fixed Header */}
        <div className="sticky top-0 z-20 bg-dark-900/95 backdrop-blur-sm border-b border-slate-700">
          <Header onMenuClick={() => setSidebarOpen(true)} />
        </div>
        
        {/* Scrollable Main Content */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <MobileNav />
      </div>
    </div>
  )
}

export default Layout