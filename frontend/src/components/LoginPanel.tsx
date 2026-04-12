import React, { useState } from 'react'

export default function LoginPanel({ onLogin }: { onLogin: (token: string) => void }) {
  const [u, setU] = useState('admin')
  const [p, setP] = useState('changeme')
  const [err, setErr] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const base = (import.meta as any).env?.VITE_API_BASE_URL || ''
    const loginUrl = base ? `${base}/api/auth/login` : '/api/auth/login'
    const res = await fetch(loginUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: u, password: p }),
    })
    if (!res.ok) {
      setErr('Invalid credentials')
      return
    }
    const data = await res.json()
    if (data?.token) {
      onLogin(data.token)
    }
  }

  return (
    <form onSubmit={submit} className="login-panel">
      <div>
        <label>Username</label>
        <input value={u} onChange={e => setU(e.target.value)} />
      </div>
      <div>
        <label>Password</label>
        <input type="password" value={p} onChange={e => setP(e.target.value)} />
      </div>
      <button type="submit">Login</button>
      {err && <div className="error">{err}</div>}
    </form>
  )
}
