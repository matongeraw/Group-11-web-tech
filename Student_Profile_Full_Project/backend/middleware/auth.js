import { auth, db, firebaseReady } from '../config/firebaseAdmin.js'

export function requireFirebase(_req, res, next) {
  return firebaseReady ? next() : res.status(503).json({ error: 'Firebase Admin is not configured. Follow INSTALLATION.md.' })
}
export async function requireToken(req, res, next) {
  try {
    const header = req.headers.authorization || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : ''
    if (!token) return res.status(401).json({ error: 'Authentication required.' })
    req.user = await auth.verifyIdToken(token)
    next()
  } catch { res.status(401).json({ error: 'Invalid or expired authentication token.' }) }
}
export async function requireAuth(req, res, next) {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get()
    req.profile = userDoc.exists ? userDoc.data() : null
    if (!req.profile || req.profile.status !== 'active') return res.status(403).json({ error: 'Account is not active or has not been provisioned.' })
    req.role = req.user.role || req.profile.role || 'student'
    next()
  } catch { res.status(500).json({ error: 'Unable to load user profile.' }) }
}
export const allowRoles = (...roles) => (req, res, next) => roles.includes(req.role) ? next() : res.status(403).json({ error: 'You do not have permission to perform this action.' })
