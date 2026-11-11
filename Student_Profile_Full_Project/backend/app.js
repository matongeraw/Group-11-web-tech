import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { errorHandler } from './controllers/apiController.js'
import { createApiRouter } from './routes/api.js'

export function createApp({ auth, db, admin, firebaseReady, env = process.env }) {
  const app = express()
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
  app.use(cors({
    origin: (env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map(value => value.trim()),
    credentials: true
  }))
  app.use(express.json({ limit: '1mb' }))
  app.use('/api', rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 180,
    standardHeaders: 'draft-7',
    legacyHeaders: false
  }), createApiRouter({ auth, db, admin, firebaseReady }))
  app.use(errorHandler)
  if (env.NODE_ENV === 'production') {
    const dist = path.resolve(__dirname, '../dist')
    app.use(express.static(dist))
    app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')))
  }
  return app
}
