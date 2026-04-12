import React, { useEffect, useState } from 'react'
import LoginPanel from './components/LoginPanel'
import { fetchClients } from './api'
import { Client } from './types'
import './styles.css'
import PBXEditor from './components/PBXEditor'
import InternetEditor from './components/InternetEditor'
import WifiEditor from './components/WifiEditor'
import RouterEditor from './components/RouterEditor'
 

type Toast = { id: string; message: string; variant: 'success'|'error'|'info' }

export default function App() {
  const [token, setToken] = useState<string | null>(typeof window !== 'undefined' ? localStorage.getItem('token') : null)
  const [clients, setClients] = useState<Client[]>([])
  const [selected, setSelected] = useState<Client | null>(null)
  const [pbxState, setPbxState] = useState<any>({})
  const [pbxServiceId, setPbxServiceId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    if (token) localStorage.setItem('token', token)
  }, [token])

  function showToast(message: string, variant: Toast['variant'] = 'info') {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2)
    const t = { id, message, variant }
    setToasts(ts => [...ts, t])
    setTimeout(() => setToasts(ts => ts.filter(x => x.id !== id)), 3000)
  }

  async function handleLogin(t: string) {
    setToken(t)
    const loaded = await fetchClients(t)
    setClients(loaded || [])
  }

  async function loadClients() {
    if (!token) return
    setLoading(true)
    try {
      const loaded = await fetchClients(token)
      setClients(loaded || [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  async function loadClient(id: string) {
    const base = (import.meta as any).env?.VITE_API_BASE_URL || ''
    const url = base ? `${base}/api/clients/${id}` : `/api/clients/${id}`
    try {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        const c = await res.json()
        setSelected(c)
        const byType = Object.fromEntries((c.services || []).map((s: any) => [s.type, s]))
        setPbxState((byType['PBX']?.data) || {})
        setPbxServiceId(byType['PBX']?.id || null)
      }
    } catch {
      // ignore
    }
  }

  // Save PBX payload
  async function savePBX(state: any): Promise<boolean> {
    if (!selected?.id) {
      showToast('No client selected', 'error')
      return false
    }
    const payload = { type: 'PBX', data: state }
    const existing = (selected.services || []).find((s: any) => s.type === 'PBX')
    const serviceId = existing?.id || pbxServiceId
    const urlBase = (import.meta as any).env?.VITE_API_BASE_URL || ''
    const url = serviceId
      ? `${urlBase}/api/clients/${selected.id}/services/${serviceId}`
      : `${urlBase}/api/clients/${selected.id}/services`
    const method = serviceId ? 'PUT' : 'POST'
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        await loadClient(selected.id)
        showToast('PBX saved', 'success')
        return true
      } else {
        showToast('PBX save failed', 'error')
        return false
      }
    } catch {
      showToast('PBX save error', 'error')
      return false
    }
  }

  // Save Internet payload
  async function saveInternet(state: any): Promise<boolean> {
    if (!selected?.id) { showToast('No client selected','error'); return false }
    const payload = { type: 'Internet', data: state }
    const existing = (selected.services || []).find((s: any) => s.type === 'Internet')
    const serviceId = existing?.id
    const urlBase = (import.meta as any).env?.VITE_API_BASE_URL || ''
    const url = serviceId ? `${urlBase}/api/clients/${selected.id}/services/${serviceId}` : `${urlBase}/api/clients/${selected.id}/services`
    const method = serviceId ? 'PUT' : 'POST'
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      if (res.ok) { await loadClient(selected.id); showToast('Internet saved','success'); return true }
      else { showToast('Internet save failed','error'); return false }
    } catch {
      showToast('Internet save error','error'); return false
    }
  }

  // Save Wifi payload
  async function saveWifi(state: any): Promise<boolean> {
    if (!selected?.id) { showToast('No client selected','error'); return false }
    const payload = { type: 'Wifi', data: state }
    const existing = (selected.services || []).find((s: any) => s.type === 'Wifi')
    const serviceId = existing?.id
    const urlBase = (import.meta as any).env?.VITE_API_BASE_URL || ''
    const url = serviceId ? `${urlBase}/api/clients/${selected.id}/services/${serviceId}` : `${urlBase}/api/clients/${selected.id}/services`
    const method = serviceId ? 'PUT' : 'POST'
    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) })
      if (res.ok) { await loadClient(selected.id); showToast('Wifi saved','success'); return true }
      else { showToast('Wifi save failed','error'); return false }
    } catch { showToast('Wifi save error','error'); return false }
  }

  // Save Router payload
  async function saveRouter(state: any): Promise<boolean> {
    if (!selected?.id) { showToast('No client selected','error'); return false }
    const payload = { type: 'Router', data: state }
    const existing = (selected.services || []).find((s: any) => s.type === 'Router')
    const serviceId = existing?.id
    const urlBase = (import.meta as any).env?.VITE_API_BASE_URL || ''
    const url = serviceId ? `${urlBase}/api/clients/${selected.id}/services/${serviceId}` : `${urlBase}/api/clients/${selected.id}/services`
    const method = serviceId ? 'PUT' : 'POST'
    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) })
      if (res.ok) { await loadClient(selected.id); showToast('Router saved','success'); return true }
      else { showToast('Router save failed','error'); return false }
    } catch { showToast('Router save error','error'); return false }
  }

  if (!token) {
    return <LoginPanel onLogin={handleLogin} />
  }

  return (
    <div className="app">
      <div className="sidebar">
        <h2>Clients</h2>
        <button onClick={loadClients}>Refresh</button>
        {loading ? 'Loading...' : null}
        <ul>
          {clients.map(c => (
            <li key={c.id} onClick={() => loadClient(c.id)} style={{ cursor: 'pointer' }}>{c.name}</li>
          ))}
        </ul>
      </div>
      <div className="content">
        {selected ? (
          <div className="client-detail">
            <h3>{selected.name}</h3>
            <p>Notes: {selected.notes ?? '—'}</p>
            <section className="section">
              <h4>PBX</h4>
              <PBXEditor data={pbxState} onChange={setPbxState} onSave={savePBX} />
            </section>
            <section className="section">
              <h4>Internet</h4>
              <InternetEditor data={internetState} onChange={setInternetState} onSave={async (state: any) => { await saveInternet(state) }} />
            </section>
            <section className="section">
              <h4>Wifi</h4>
              <WifiEditor data={wifiState} onChange={setWifiState} onSave={async (state: any) => { await saveWifi(state) }} />
            </section>
            <section className="section">
              <h4>Router</h4>
              <RouterEditor data={routerState} onChange={setRouterState} onSave={async (state: any) => { await saveRouter(state) }} />
            </section>
          </div>
        ) : (
          <div className="welcome">Select a client to view details.</div>
        )}
      </div>
      <div className="toast-container" style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 9999 }}>
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.variant}`} style={{ marginTop: 8, padding: '10px 14px', borderRadius: 6, color: '#fff', background: t.variant === 'success' ? '#22c55e' : t.variant === 'error' ? '#f87171' : '#374151', minWidth: 240 }}>
            {t.message}
          </div>
        ))}
      </div>
    </div>
  )
}
