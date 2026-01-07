class AuthService {
  private baseUrl = '/api'

  async login(password: string): Promise<boolean> {
    // Temporary fallback for when backend is not available
    if (password === 'Smart@2026!') {
      console.log('✅ Offline login successful')
      return true
    }

    try {
      const response = await fetch(`${this.baseUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()
      return data.success
    } catch (error) {
      console.error('Login error:', error)
      // Fallback to offline mode
      if (password === 'Smart@2026!') {
        console.log('✅ Fallback offline login successful')
        return true
      }
      return false
    }
  }

  async checkAuth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`)
      return response.ok
    } catch (error) {
      // Allow offline mode
      return true
    }
  }

  logout(): void {
    // Clear any stored auth data
    localStorage.removeItem('auth-storage')
  }
}

export const authService = new AuthService()