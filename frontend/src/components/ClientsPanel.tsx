import React, { useEffect, useState } from 'react'
import { Client, Service } from '../types'

export default function ClientsPanel({ token }: { token: string }) {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!token) return
    setLoading(true)
    fetch('/api/clients', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then((data: Client[]) => { setClients(data); setLoading(false) })
  }, [token])

  return (
    <div className="clients-panel">
      {loading ? <div>Loading...</div> : (
        <ul>
          {clients.map(c => (
            <li key={c.id}>{c.name}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
