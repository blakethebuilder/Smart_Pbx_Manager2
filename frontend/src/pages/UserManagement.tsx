import { useState, useEffect } from 'react'
import { Users, Trash2, Shield, UserPlus, ShieldAlert, Plus, KeyRound } from 'lucide-react'
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
  const [newUsername, setNewUsername] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  // New state for password management
  const [newTeamPassword, setNewTeamPassword] = useState('')
  const [newAdminPassword, setNewAdminPassword] = useState('')
  const [isSavingPasswords, setIsSavingPasswords] = useState(false)

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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUsername.trim()) return

    setIsCreating(true)
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername.trim() })
      })

      if (res.ok) {
        setNewUsername('')
        await loadUsers() // Refresh the user list
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to create user')
      }
    } catch (err) {
      alert('Network error creating user')
    } finally {
      setIsCreating(false)
    }
  }

  const handleChangePasswords = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingPasswords(true)
    try {
      const res = await fetch('/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          newPassword: newTeamPassword, 
          newAdminPassword: newAdminPassword
        })
      })

      if (res.ok) {
        alert('Password change request received. Note: Environment variables must be updated manually on the server.');
        setNewTeamPassword('')
        setNewAdminPassword('')
      } else {
        alert('Failed to process password change.')
      }
    } catch (err) {
      alert('Network error during password change.')
    } finally {
      setIsSavingPasswords(false)
    }
  }

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
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center space-x-2 mb-6">
            <UserPlus className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-semibold text-white">Add New Technician</h2>
          </div>
          
          <form onSubmit={handleCreateUser} className="flex gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Technician Name / Username"
                className="w-full px-4 py-2 bg-dark-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={isCreating}
                required
              />
            </div>
            <button
              type="submit"
              disabled={isCreating || !newUsername.trim()}
              className="btn-primary flex items-center space-x-2 whitespace-nowrap"
            >
              {isCreating ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>Register Tech</span>
            </button>
          </form>
        </div>

        <div className="p-6 border-b border-slate-700 flex items-center justify-between bg-dark-900/30">
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
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center space-x-2 mb-6">
            <KeyRound className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-semibold text-white">Change Passwords</h2>
          </div>
          <form onSubmit={handleChangePasswords} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">New Team Password</label>
              <input
                type="password"
                value={newTeamPassword}
                onChange={(e) => setNewTeamPassword(e.target.value)}
                placeholder="Shared password for all technicians"
                className="w-full px-4 py-2 bg-dark-900 border border-slate-600 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">New Admin Password</label>
              <input
                type="password"
                value={newAdminPassword}
                onChange={(e) => setNewAdminPassword(e.target.value)}
                placeholder="New password for blakeAdmin"
                className="w-full px-4 py-2 bg-dark-900 border border-slate-600 rounded-lg text-white"
              />
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={isSavingPasswords} className="btn-primary">
                {isSavingPasswords ? 'Saving...' : 'Save Passwords'}
              </button>
            </div>
          </form>
        </div>
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
          <Shield className="w-5 h-5" />
          <h3 className="font-bold">Technician Management Info</h3>
        </div>
        <p className="text-slate-400 text-sm">
          Only administrators can register new technicians. Once registered, a technician can log in using their name and the shared team password. 
          As an administrator, you can revoke their access at any time by deleting their record from the list above.
        </p>
      </div>
    </div>
  )
}

export default UserManagement
