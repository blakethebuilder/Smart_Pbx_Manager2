class AuthService {
  private baseUrl = '/api'

  async login(password: string): Promise<boolean> {
    // Direct offline mode - bypass API completely for now
    if (password === 'Smart@2026!') {
      console.log('✅ Direct offline login successful')
      return true
    }
    
    console.log('❌ Invalid password')
    return false
  }

  async checkAuth(): Promise<boolean> {
    // Always allow access in offline mode
    return true
  }

  logout(): void {
    // Clear any stored auth data
    localStorage.removeItem('auth-storage')
  }
}

export const authService = new AuthService()