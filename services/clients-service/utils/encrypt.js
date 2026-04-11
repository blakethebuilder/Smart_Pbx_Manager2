const crypto = require('crypto')

const SENSITIVE_KEYS = /(password|pwd|token|secret|ssid)/i

function getKey() {
  const key = process.env.ENCRYPTION_KEY
  if (!key) throw new Error('ENCRYPTION_KEY environment variable is not set')
  let buf
  if (/^[0-9a-fA-F]{64}$/.test(key)) {
    buf = Buffer.from(key, 'hex')
  } else {
    try {
      buf = Buffer.from(key, 'base64')
      if (buf.length !== 32) throw new Error()
    } catch {
      buf = Buffer.from(key, 'hex')
    }
  }
  if (buf.length !== 32) {
    const tmp = Buffer.alloc(32)
    buf.copy(tmp, 0, 0, Math.min(buf.length, 32))
    buf = tmp
  }
  return buf
}

function encryptValue(val) {
  const key = getKey()
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  let encrypted = cipher.update(val, 'utf8', 'base64')
  encrypted += cipher.final('base64')
  const tag = cipher.getAuthTag()
  return iv.toString('base64') + ':' + encrypted + ':' + tag.toString('base64')
}

function decryptValue(enc) {
  const key = getKey()
  const [ivB64, encrypted, tagB64] = enc.split(':')
  const iv = Buffer.from(ivB64, 'base64')
  const tag = Buffer.from(tagB64, 'base64')
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  let decrypted = decipher.update(encrypted, 'base64', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

function encryptObject(obj) {
  if (obj === null || obj === undefined) return obj
  if (typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(encryptObject)
  const out = {}
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string' && SENSITIVE_KEYS.test(k)) {
      out[k] = encryptValue(v)
    } else if (typeof v === 'object') {
      out[k] = encryptObject(v)
    } else {
      out[k] = v
    }
  }
  return out
}

function decryptObject(obj) {
  if (obj === null || obj === undefined) return obj
  if (typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(decryptObject)
  const out = {}
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string' && SENSITIVE_KEYS.test(k) && v.includes(':')) {
      try {
        out[k] = decryptValue(v)
      } catch {
        out[k] = v
      }
    } else if (typeof v === 'object') {
      out[k] = decryptObject(v)
    } else {
      out[k] = v
    }
  }
  return out
}

module.exports = { encryptObject, decryptObject }
