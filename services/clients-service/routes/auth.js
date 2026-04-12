const express = require('express')
const jwt = require('jsonwebtoken')
const router = express.Router()

const ADMIN_USER = process.env.ADMIN_USER || 'admin'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme'
const DEV_LOGIN = process.env.DEV_LOGIN === 'true' || process.env.NODE_ENV === 'development'
const SECRET = process.env.JWT_SECRET || 'CHANGE_ME_JWT_SECRET'

router.post('/login', (req, res) => {
  console.log('[AUTH] /login called')
  // Development login bypass to speed up local testing via env, header, or query
  const headerDev = (req.headers['x-dev-login'] || '').toString() === 'true'
  const queryDev = (req.query && req.query.dev_login === 'true')
  const bypass = DEV_LOGIN || headerDev || queryDev
  if (bypass) {
    console.log('[AUTH] DEV_LOGIN bypass active')
    const payload = { sub: 'dev', iat: Math.floor(Date.now() / 1000) }
    const token = jwt.sign(payload, SECRET, { expiresIn: '1h' })
    return res.json({ token })
  }
  // Normal login flow
  const { username, password } = req.body || {}
  if (username === ADMIN_USER && password === ADMIN_PASSWORD) {
    const payload = { sub: username, iat: Math.floor(Date.now() / 1000) }
    const token = jwt.sign(payload, SECRET, { expiresIn: '1h' })
    return res.json({ token })
  }
  res.status(401).json({ error: 'Invalid credentials' })
})

module.exports = router
