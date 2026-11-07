const institutionDomain = '@africau.edu'

export function createAuthMiddleware({ auth, db, firebaseReady }) {
  function requireFirebase(_req, res, next) {
    if (!firebaseReady || !auth || !db) {
      return res.status(503).json({ error: 'Firebase Admin is not configured. Follow INSTALLATION.md.' })
    }
    return next()
  }

  async function requireToken(req, res, next) {
    const header = req.headers.authorization || ''
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
    if (!token) return res.status(401).json({ error: 'Authentication required.' })

    try {
      req.user = await auth.verifyIdToken(token, true)
    } catch (error) {
      if (['auth/argument-error', 'auth/id-token-expired', 'auth/id-token-revoked', 'auth/invalid-id-token', 'auth/user-disabled'].includes(error?.code)) {
        return res.status(401).json({ error: 'Invalid, expired, or revoked authentication token.' })
      }
      return next(error)
    }

    if (req.user.email_verified !== true) {
      return res.status(403).json({ error: 'Verify your institutional email before continuing.' })
    }
    if (typeof req.user.email !== 'string' || !req.user.email.toLowerCase().endsWith(institutionDomain)) {
      return res.status(403).json({ error: 'Use a verified @africau.edu email address.' })
    }
    return next()
  }

  async function requireAuth(req, res, next) {
    try {
      const userDoc = await db.collection('users').doc(req.user.uid).get()
      req.profile = userDoc.exists ? userDoc.data() : null
      if (!req.profile || req.profile.status !== 'active') {
        return res.status(403).json({ error: 'Account is not active or has not been provisioned.' })
      }
      if (typeof req.profile.email !== 'string' || req.profile.email.toLowerCase() !== req.user.email.toLowerCase()) {
        return res.status(403).json({ error: 'Account identity does not match the provisioned profile.' })
      }
      if (!['student', 'lecturer', 'admin'].includes(req.profile.role)) {
        return res.status(403).json({ error: 'Account role is not authorized.' })
      }
      req.role = req.profile.role
      return next()
    } catch (error) {
      return next(error)
    }
  }

  const allowRoles = (...roles) => (req, res, next) =>
    roles.includes(req.role)
      ? next()
      : res.status(403).json({ error: 'You do not have permission to perform this action.' })

  return { requireFirebase, requireToken, requireAuth, allowRoles }
}
