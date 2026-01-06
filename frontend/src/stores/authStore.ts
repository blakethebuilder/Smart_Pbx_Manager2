import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authService } from '../services/authService'

interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (password: string) => Promise<boolean>
  logout: () => void
  checkAuth: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (password: string) => {
        set({ isLoading: true, error: null })
        
        try {
          const success = await authService.login(password)
          
          if (success) {
            set({ isAuthenticated: true, isLoading: false })
            return true
          } else {
            set({ error: 'Invalid password', isLoading: false })
            return false
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Login failed', 
            isLoading: false 
          })
          return false
        }
      },

      logout: () => {
        set({ isAuthenticated: false, error: null })
        authService.logout()
      },

      checkAuth: async () => {
        const isAuth = await authService.checkAuth()
        set({ isAuthenticated: isAuth })
      },

      clearError: () => {
        set({ error: null })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ isAuthenticated: state.isAuthenticated }),
    }
  )
)