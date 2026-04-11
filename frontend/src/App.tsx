import React, { useEffect, useState } from 'react'
import { login, fetchClients } from './api'
import { Client, Service, PbxData, InternetData, WifiData, RouterData } from './types'

type UIState = 'login' | 'clients'

function LoginPanel({ onLogin }: { onLogin: (token: string) => void }) {
  const [user, setUser] = useState('admin')
  const [pass, setPass] = useState('changeme')
  const [error, setError] = useState<string | null>(null)

  async function doLogin(e: React.FormEvent) {
    e.preventDefault()
    const res = await login(user, pass)
    if (res?.token) {
      onLogin(res.token)
    } else {
      setError(res?.error || 'Login failed')
    }
  }

  return (
    <div className="login-panel">
      <h2>Login</h2>
      <form onSubmit={doLogin}>
        <div>
          <label>Username</label>
          <input value={user} onChange={e => setUser(e.target.value)} />
        </div>
        <div>
          <label>Password</label>
          <input type="password" value={pass} onChange={e => setPass(e.target.value)} />
        </div>
        <button type="submit">Login</button>
      </form>
      {error && <div className="error">{error}</div>}
    </div>
  )
}

type ServiceDraft = { type: string; data: any }

function ClientDetailView({ client, token }: { client: Client; token: string }) {
  const [pbx, setPbx] = useState<PbxData>({})
  const [internet, setInternet] = useState<InternetData>({})
  const [wifi, setWifi] = useState<WifiData>({})
  const [router, setRouter] = useState<RouterData>({})
  const [serviceIds, setServiceIds] = useState<{ [k: string]: string | undefined }>({})
  const [loading, setLoading] = useState(false)

  // Load client with its services initially
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/clients/${client.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) return
        const body = await res.json()
        const ids: { [k: string]: string | undefined } = {}
        const list = body.services || []
        for (const s of list) {
          ids[s.type] = s.id
          const v = s.data || {}
          switch (s.type) {
            case 'PBX': setPbx(v)
              break
            case 'Internet': setInternet(v)
              break
            case 'Wifi': setWifi(v)
              break
            case 'Router': setRouter(v)
              break
          }
        }
        setServiceIds(ids)
      } catch {
        // ignore
      }
    }
    load()
  // eslint-disable-next-line
  }, [client.id, token])

  async function saveFor(type: string) {
    let payload: Partial<ServiceDraft> = { type, data: {} }
    if (type === 'PBX') payload.data = pbx
    if (type === 'Internet') payload.data = internet
    if (type === 'Wifi') payload.data = wifi
    if (type === 'Router') payload.data = router

    const id = serviceIds[type]
    const method = id ? 'PUT' : 'POST'
    const endpoint = id
      ? `/api/clients/${client.id}/services/${id}`
      : `/api/clients/${client.id}/services`
    const res = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ type, data: payload.data }),
    })
    if (res.ok) {
      const resp = await res.json()
      const newId = resp.id || id
      setServiceIds(prev => ({ ...prev, [type]: newId }))
    }
  }

  return (
    <div className="client-detail">
      <h3>{client.name}</h3>
      <p>Notes: {client.notes || '—'}</p>
      <div className="section">
        <h4>PBX</h4>
        <div className="form-inline">
          <input placeholder="Host" value={pbx.host || ''} onChange={e => setPbx({ ...pbx, host: e.target.value })} />
          <input placeholder="Port" type="number" value={pbx.port ?? ''} onChange={e => setPbx({ ...pbx, port: Number(e.target.value) })} />
          <input placeholder="Username" value={pbx.username ?? ''} onChange={e => setPbx({ ...pbx, username: e.target.value })} />
          <input placeholder="Password" type="password" value={pbx.password ?? ''} onChange={e => setPbx({ ...pbx, password: e.target.value })} />
          <button onClick={() => saveFor('PBX')}>Save PBX</button>
        </div>
      </div>
      <div className="section">
        <h4>Internet</h4>
        <div className="form-inline">
          <input placeholder="Supplier" value={internet.supplier || ''} onChange={e => setInternet({ ...internet, supplier: e.target.value })} />
          <input placeholder="Username" value={internet.username || ''} onChange={e => setInternet({ ...internet, username: e.target.value })} />
          <input placeholder="Password" type="password" value={internet.password || ''} onChange={e => setInternet({ ...internet, password: e.target.value })} />
          <button onClick={() => saveFor('Internet')}>Save Internet</button>
        </div>
      </div>
      <div className="section">
        <h4>Wifi</h4>
        <div className="form-inline">
          <input placeholder="SSID" value={wifi.ssid || ''} onChange={e => setWifi({ ...wifi, ssid: e.target.value })} />
          <input placeholder="Password" type="password" value={wifi.password || ''} onChange={e => setWifi({ ...wifi, password: e.target.value })} />
          <button onClick={() => saveFor('Wifi')}>Save Wifi</button>
        </div>
      </div>
      <div className="section">
        <h4>Router</h4>
        <div className="form-inline">
          <input placeholder="Model" value={router.model || ''} onChange={e => setRouter({ ...router, model: e.target.value })} />
          <input placeholder="IP" value={router.ip || ''} onChange={e => setRouter({ ...router, ip: e.target.value })} />
          <input placeholder="Username" value={router.username || ''} onChange={e => setRouter({ ...router, username: e.target.value })} />
          <input placeholder="Password" type="password" value={router.password || ''} onChange={e => setRouter({ ...router, password: e.target.value })} />
          <button onClick={() => saveFor('Router')}>Save Router</button>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [clients, setClients] = useState<Client[]>([])
  const [selected, setSelected] = useState<Client | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!token) return
    localStorage.setItem('token', token)
  }, [token])

  async function handleLogin(t: string) {
    setToken(t)
    const loaded = await fetchClients(t)
    setClients(loaded || [])
  }

  async function loadClients() {
    if (!token) return
    setLoading(true)
    const base = (import.meta as any).env?.VITE_API_BASE_URL || ''
    const url = base ? `${base}/api/clients` : '/api/clients'
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.ok ? r.json() : [])
    setClients(res as Client[])
    setLoading(false)
  }

  useEffect(() => {
    if (token) {
      loadClients()
    }
  // eslint-disable-next-line
  }, [token])

  // Add a minimal service for a client (demo only)
  async function addServiceForClient(clientId: string, svc: Partial<Service>) {
    const base = (import.meta as any).env?.VITE_API_BASE_URL || ''
    const url = base ? `${base}/api/clients/${clientId}/services` : `/api/clients/${clientId}/services`
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(svc),
    })
    // refresh client data
    const base = (import.meta as any).env?.VITE_API_BASE_URL || ''
    const url2 = base ? `${base}/api/clients/${clientId}` : `/api/clients/${clientId}`
    const updated = await fetch(url2, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
    setSelected(updated)
  }

  if (!token) {
    return <LoginPanel onLogin={handleLogin} />
  }

  return (
    <div className="app">
      <div className="sidebar">
        <h2>Clients</h2>
        <button onClick={loadClients}>Refresh</button>
        <ul>
          {clients.map(c => (
            <li key={c.id} onClick={() => setSelected(c)} className={selected?.id === c.id ? 'active' : ''}>
              {c.name}
            </li>
          ))}
        </ul>
      </div>
      <div className="content">
        {selected ? (
          <ClientDetailView client={selected} token={token as string} />
          ) : (
          <div className="welcome">Select a client to view details.</div>
        )}
      </div>
    </div>
  )
}
