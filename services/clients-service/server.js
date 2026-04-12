const express = require('express')
const cors = require('cors')
const app = express()
const cors = require('cors')
const { init } = require('./db')
const authRouter = require('./routes/auth')
const authMiddleware = require('./middleware/auth')

app.use(cors())
app.use(cors())
app.use(express.json())

// Simple health check endpoint (unauthenticated)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

// Mount auth routes
app.use('/api/auth', authRouter)

// Initialize DB and mount routes
init()
// Seed initial test client on first run
try {
  const seed = require('./scripts/seed')
  seed.seed()
} catch (e) {
  console.error('Seed script failed to run:', e)
}
try {
  const clientsRouter = require('./routes/clients')
  // Protect all client routes with auth middleware
  app.use('/api/clients', authMiddleware, clientsRouter)
} catch (e) {
  console.error('Failed to mount clients API routes in service:', e)
}

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000
app.listen(PORT, () => {
  console.log(`Clients API service listening on port ${PORT}`)
})
