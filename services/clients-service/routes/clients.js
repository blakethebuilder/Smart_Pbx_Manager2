const express = require('express')
const router = express.Router()
const { db } = require('../db')
const { encryptObject, decryptObject } = require('../utils/encrypt')
const { v4: uuidv4 } = require('uuid')
const auth = require('../middleware/auth')
router.use(auth)
function clientRowToDto(client) {
  return {
    id: client.id,
    name: client.name,
    notes: client.notes,
    created_at: client.created_at,
  }
}

function serviceRowToDto(row) {
  let data = row.data ? JSON.parse(row.data) : {}
  data = decryptObject(data)
  return {
    id: row.id,
    type: row.type,
    data,
    created_at: row.created_at,
  }
}

router.get('/', (req, res) => {
  try {
    const clients = db.prepare('SELECT id, name, notes, created_at FROM clients').all()
    const result = clients.map(clientRowToDto)
    res.json(result)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/:id', (req, res) => {
  const id = req.params.id
  try {
    const client = db.prepare('SELECT id, name, notes, created_at FROM clients WHERE id = ?').get(id)
    if (!client) return res.status(404).json({ error: 'Client not found' })

    const services = db.prepare('SELECT id, client_id, type, data, created_at FROM services WHERE client_id = ?').all(id)
    const servicesDto = services.map(s => serviceRowToDto(s))
    res.json({ ...clientRowToDto(client), services: servicesDto })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/', (req, res) => {
  const payload = req.body || {}
  const id = uuidv4()
  try {
    db.prepare('INSERT INTO clients (id, name, notes) VALUES (?, ?, ?)').run(id, payload.name || '', payload.notes || '')
    const services = Array.isArray(payload.services) ? payload.services : []
    const inserted = []
    for (const svc of services) {
      const sid = uuidv4()
      const dataRaw = svc.data ? encryptObject(svc.data) : {}
      db.prepare('INSERT INTO services (id, client_id, type, data) VALUES (?, ?, ?, ?)').run(
        sid,
        id,
        svc.type || 'PBX',
        JSON.stringify(dataRaw)
      )
      inserted.push({ id: sid, type: svc.type, data: svc.data || {} })
    }
    res.status(201).json({ id, services: inserted })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.put('/:id', (req, res) => {
  const id = req.params.id
  const payload = req.body || {}
  try {
    const existing = db.prepare('SELECT id FROM clients WHERE id = ?').get(id)
    if (!existing) return res.status(404).json({ error: 'Client not found' })
    db.prepare('UPDATE clients SET name = ?, notes = ? WHERE id = ?').run(payload.name, payload.notes, id)
    res.json({ id, name: payload.name, notes: payload.notes })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/:id', (req, res) => {
  const id = req.params.id
  try {
    const del = db.prepare('DELETE FROM clients WHERE id = ?').run(id)
    if (del.changes === 0) return res.status(404).json({ error: 'Client not found' })
    res.json({ id })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/:id/services', (req, res) => {
  const id = req.params.id
  try {
    const services = db.prepare('SELECT id, client_id, type, data, created_at FROM services WHERE client_id = ?').all(id)
    const result = services.map(s => {
      const dataObj = s.data ? JSON.parse(s.data) : {}
      return { id: s.id, type: s.type, data: decryptObject(dataObj), created_at: s.created_at }
    })
    res.json(result)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/:id/services', (req, res) => {
  const clientId = req.params.id
  const svc = req.body || {}
  try {
    const client = db.prepare('SELECT id FROM clients WHERE id = ?').get(clientId)
    if (!client) return res.status(404).json({ error: 'Client not found' })
    const sid = uuidv4()
    const dataRaw = svc.data ? encryptObject(svc.data) : {}
    db.prepare('INSERT INTO services (id, client_id, type, data) VALUES (?, ?, ?, ?)').run(
      sid,
      clientId,
      svc.type || 'PBX',
      JSON.stringify(dataRaw)
    )
    res.status(201).json({ id: sid, type: svc.type, data: svc.data || {} })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.put('/:id/services/:serviceId', (req, res) => {
  const clientId = req.params.id
  const serviceId = req.params.serviceId
  const svc = req.body || {}
  try {
    const existing = db.prepare('SELECT id FROM services WHERE id = ? AND client_id = ?').get(serviceId, clientId)
    if (!existing) return res.status(404).json({ error: 'Service not found' })
    const dataRaw = svc.data ? encryptObject(svc.data) : {}
    db.prepare('UPDATE services SET type = ?, data = ? WHERE id = ?').run(svc.type || 'PBX', JSON.stringify(dataRaw), serviceId)
    res.json({ id: serviceId, type: svc.type, data: svc.data || {} })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/:id/services/:serviceId', (req, res) => {
  const clientId = req.params.id
  const serviceId = req.params.serviceId
  try {
    const del = db.prepare('DELETE FROM services WHERE id = ? AND client_id = ?').run(serviceId, clientId)
    if (del.changes === 0) return res.status(404).json({ error: 'Service not found' })
    res.json({ id: serviceId })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router
