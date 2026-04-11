const express = require('express')
const jwt = require('jsonwebtoken')
const router = express.Router()

const ADMIN_USER = process.env.ADMIN_USER || 'admin'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme'
const SECRET = process.env.JWT_SECRET || 'CHANGE_ME_JWT_SECRET'

router.post('/login', (req, res) => {
  const { username, password } = req.body || {}
  if (username === ADMIN_USER && password === ADMIN_PASSWORD) {
    const payload = { sub: username, iat: Math.floor(Date.now() / 1000) }
    const token = jwt.sign(payload, SECRET, { expiresIn: '1h' })
    return res.json({ token })
  }
  res.status(401).json({ error: 'Invalid credentials' })
})

module.exports = router
