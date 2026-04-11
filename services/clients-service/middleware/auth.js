const jwt = require('jsonwebtoken')

const ADMIN_USER = process.env.ADMIN_USER || 'admin'
const SECRET = process.env.JWT_SECRET || 'CHANGE_ME_JWT_SECRET'

function auth(req, res, next) {
  const authHeader = req.headers['authorization']
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' })
  const token = authHeader.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  try {
    const payload = jwt.verify(token, SECRET)
    // Attach user info for downstream routes if needed
    req.user = payload
    next()
  } catch (e) {
    return res.status(403).json({ error: 'Forbidden' })
  }
}

module.exports = auth
