export async function login(username: string, password: string): Promise<{ token?: string, error?: string }> {
  const url = (import.meta as any).env?.VITE_API_BASE_URL || ''
  const loginUrl = url ? `${url}/api/auth/login` : '/api/auth/login'
  const res = await fetch(loginUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    return { error: err?.error || 'Login failed' }
  }
  const data = await res.json()
  if (data?.token) {
    localStorage.setItem('token', data.token)
  }
  return data
}

export async function fetchClients(token?: string): Promise<any[]> {
  const t = token || localStorage.getItem('token') || ''
  const url = (import.meta as any).env?.VITE_API_BASE_URL || ''
  const clientsUrl = url ? `${url}/api/clients` : '/api/clients'
  const res = await fetch(clientsUrl, {
    headers: { Authorization: `Bearer ${t}` },
  })
  if (!res.ok) return []
  return res.json()
}
