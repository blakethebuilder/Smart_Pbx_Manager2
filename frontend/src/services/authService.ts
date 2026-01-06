class AuthService {
  private baseUrl = '/api'

  async login(password: string): Promise<boolean> {
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
      return false
    }
  }

  async checkAuth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`)
      return response.ok
    } catch (error) {
      return false
    }
  }

  logout(): void {
    // Clear any stored auth data
    localStorage.removeItem('auth-storage')
  }
}

export const authService = new AuthService()