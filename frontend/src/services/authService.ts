class AuthService {
  private baseUrl = '/api'

  async login(password: string, techName: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password, techName }),
      })

      // If we get a response, try to parse it
      if (response.ok) {
        return await response.json()
      } else if (response.status === 502) {
        console.warn('Backend unavailable (502), backend offline')
        return { success: false, error: 'Backend unavailable' }
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      console.error('Login error:', error)
      
      // Check if it's a network error or parsing error
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.warn('Network error detected, using offline fallback')
      } else if (error instanceof SyntaxError && error.message.includes('Unexpected token')) {
        console.warn('Received HTML instead of JSON (likely 502 error page), using offline fallback')
      }
      
      // Network or parsing errors - backend unavailable
      console.log('❌ Backend unavailable, login failed')
      return false
    }
  }

  async checkAuth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`)
      return response.ok
    } catch (error) {
      console.warn('Backend health check failed, allowing offline mode')
      // Allow offline mode if backend unavailable
      return true
    }
  }

  logout(): void {
    localStorage.removeItem('auth-storage')
  }
}

export const authService = new AuthService()