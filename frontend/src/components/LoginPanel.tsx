import React, { useState } from 'react'

// Simple login panel: username only, auto-login via backend
export default function LoginPanel({ onLogin }: { onLogin: (token: string) => void }) {
  const [u, setU] = useState('admin')
  const [err, setErr] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const base = (import.meta as any).env?.VITE_API_BASE_URL || ''
    const loginUrl = base ? `${base}/api/auth/login` : 'http://localhost:8547/api/auth/login'
    // Try base URL first, then localhost fallback
    const urls = [loginUrl, 'http://localhost:8547/api/auth/login']
    for (const url of urls) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: u }),
        })
        if (res.ok) {
          const data = await res.json()
          if (data?.token) {
            onLogin(data.token)
            return
          }
        } else {
          // try next URL
          continue
        }
      } catch {
        // try next URL
      }
    }
    setErr('Login failed')
  }

  return (
    <form onSubmit={submit} className="login-panel">
      <div>
        <label>Username</label>
        <input value={u} onChange={e => setU(e.target.value)} />
      </div>
      <button type="submit">Login</button>
      {err && <div className="error">{err}</div>}
    </form>
  )
}
