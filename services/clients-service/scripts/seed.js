const { db } = require('../db')
const { encryptObject } = require('../utils/encrypt')
const { v4: uuidv4 } = require('uuid')

function insertService(clientId, type, data) {
  const sid = uuidv4()
  const payload = JSON.stringify(encryptObject(data || {}))
  db.prepare('INSERT INTO services (id, client_id, type, data) VALUES (?, ?, ?, ?)').run(
    sid,
    clientId,
    type,
    payload
  )
  return sid
}

function seedIfNeeded() {
  try {
    const row = db.prepare('SELECT COUNT(*) AS c FROM clients').get()
    const count = row && row.c ? Number(row.c) : 0
    if (count > 0) {
      console.log('Seed: existing clients found, skipping seed')
      return
    }
    const cid = uuidv4()
    db.prepare('INSERT INTO clients (id, name, notes) VALUES (?, ?, ?)').run(
      cid,
      'Seed Live Client',
      'Auto-seeded for initial testing'
    )
    insertService(cid, 'PBX', { host: 'pbx.live', port: 8547, username: 'admin', password: 'secret' })
    insertService(cid, 'Internet', { supplier: 'Seed ISP', username: 'admin', password: 'internet' })
    insertService(cid, 'Wifi', { ssid: 'LiveWiFi', password: 'wifi-pass' })
    insertService(cid, 'Router', { model: 'LiveRouter', ip: '192.168.0.1', username: 'admin', password: 'router' })
    console.log('Seed: created test client with id', cid)
  } catch (e) {
    console.error('Seed: failed to seed', e)
  }
}

module.exports = { seed: seedIfNeeded }
