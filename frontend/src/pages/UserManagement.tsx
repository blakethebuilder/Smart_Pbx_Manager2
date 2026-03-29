import { useState, useEffect } from 'react'
import { Users, Trash2, Shield, UserPlus, ShieldAlert } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'

interface User {
  id: string
  username: string
  role: string
  created_at: string
}

const UserManagement = () => {
  const { role } = useAuthStore()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadUsers = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/users')
      if (res.ok) {
        setUsers(await res.json())
      }
    } catch (err) {
      console.error('Network error loading users')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (role === 'admin') {
      loadUsers()
    }
  }, [role])

  const handleDeleteUser = async (id: string, username: string) => {
    if (username === 'blakeAdmin') {
      alert('Cannot delete the primary admin account')
      return
    }
    
    if (confirm(`Are you sure you want to delete technician "${username}"?`)) {
      try {
        const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
        if (res.ok) {
          setUsers(users.filter(u => u.id !== id))
        }
      } catch (err) {
        alert('Failed to delete user')
      }
    }
  }

  if (role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ShieldAlert className="w-16 h-16 text-error-500 mb-4" />
        <h1 className="text-2xl font-bold text-white">Access Denied</h1>
        <p className="text-slate-400 mt-2">Only administrators can access this page.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Technician Management</h1>
          <p className="text-slate-400 mt-1">Manage team access and technician accounts</p>
        </div>
        <div className="flex items-center space-x-2 px-4 py-2 bg-primary-500/10 border border-primary-500/20 rounded-lg">
          <Shield className="w-4 h-4 text-primary-400" />
          <span className="text-sm font-medium text-primary-400">Admin Mode</span>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-semibold text-white">Registered Technicians</h2>
          </div>
          <p className="text-sm text-slate-400">{users.length} active users</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-dark-900/50 text-slate-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Username / Tech Name</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">Registered Date</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-slate-500">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                      <span>Loading technicians...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-slate-500">
                    No technicians registered yet.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          user.role === 'admin' ? 'bg-primary-500/20 text-primary-400' : 'bg-slate-700 text-slate-300'
                        }`}>
                          <Users className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-white">{user.username}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        user.role === 'admin' ? 'bg-primary-500 text-white' : 'bg-slate-700 text-slate-400'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {user.username !== 'blakeAdmin' && (
                        <button
                          onClick={() => handleDeleteUser(user.id, user.username)}
                          className="p-2 text-slate-500 hover:text-error-400 transition-colors"
                          title="Revoke Access"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-6 bg-primary-500/5 border border-primary-500/10 rounded-xl space-y-3">
        <div className="flex items-center space-x-2 text-primary-400">
          <UserPlus className="w-5 h-5" />
          <h3 className="font-bold">Technician Access Info</h3>
        </div>
        <p className="text-slate-400 text-sm">
          Technicians are automatically registered the first time they log in using their name and the team password. 
          As an administrator, you can revoke their access here by deleting their record.
        </p>
      </div>
    </div>
  )
}

export default UserManagement
