import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authService } from '../services/authService'

interface AuthState {
  isAuthenticated: boolean
  techName: string
  role: 'admin' | 'tech'
  isLoading: boolean
  error: string | null
  login: (password: string, techName: string) => Promise<boolean>
  logout: () => void
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      techName: '',
      role: 'tech',
      isLoading: false,
      error: null,

      login: async (password: string, techName: string) => {
        set({ isLoading: true, error: null })
        try {
          const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password, techName }),
          })
          const data = await res.json()
          
          if (data.success) {
            set({ 
              isAuthenticated: true, 
              techName: techName.trim(), 
              role: data.role || 'tech',
              isLoading: false 
            })
            return true
          } else {
            set({ error: data.error || 'Invalid password', isLoading: false })
            return false
          }
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Login failed', isLoading: false })
          return false
        }
      },

      logout: () => {
        set({ isAuthenticated: false, techName: '', role: 'tech', error: null })
        authService.logout()
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        isAuthenticated: state.isAuthenticated, 
        techName: state.techName,
        role: state.role
      }),
    }
  )
)
