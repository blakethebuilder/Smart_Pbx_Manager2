import { useState } from 'react'
import { motion } from 'framer-motion'
import { Lock, User } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'

const LoginScreen = () => {
  const [password, setPassword] = useState('')
  const [techName, setTechName] = useState('')
  const { login, isLoading, error, clearError } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.trim() && techName.trim()) {
      await login(password, techName)
    }
  }

  const handleChange = () => { if (error) clearError() }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-900 via-primary-900/20 to-secondary-900/20 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="card p-8 space-y-6">
          <div className="text-center space-y-4">
              <div className="mx-auto w-20 h-20 flex items-center justify-center">
                <img src="/logo.png" alt="Smart Integrate Logo" className="w-20 h-20" />
              </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Smart PBX Manager</h1>
              <p className="text-slate-400 mt-2">Sign in to access the dashboard</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tech Name */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Your Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={techName}
                  onChange={(e) => { setTechName(e.target.value); handleChange() }}
                  className="w-full pl-10 pr-4 py-3 bg-dark-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                  placeholder="e.g. John Smith"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Team Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); handleChange() }}
                  className="w-full pl-10 pr-4 py-3 bg-dark-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                  placeholder="Enter team password"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-error-500/10 border border-error-500/20 rounded-lg text-error-400 text-sm"
              >
                {error}
              </motion.div>
            )}

            <motion.button
              type="submit"
              disabled={isLoading || !password.trim() || !techName.trim()}
              className="w-full btn-primary py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing in...</span>
                </div>
              ) : 'Sign In'}
            </motion.button>
          </form>

          <div className="text-center text-xs text-slate-500">
            All technicians share the same team password
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default LoginScreen
