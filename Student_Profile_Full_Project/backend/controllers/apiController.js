import { AppError } from '../utils/AppError.js'
import { notificationSchema } from '../validators/notifications.js'
import { registrationSchema } from '../validators/profile.js'
import { accountStatusSchema, userRoleSchema } from '../validators/users.js'

function parseBody(schema, body, res, message) {
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    res.status(400).json({ error: message, details: parsed.error.flatten() })
    return null
  }
  return parsed.data
}

export function createApiController({ profileService, userService, notificationService, firebaseReady }) {
  return {
    health(_req, res) {
      res.json({ status: 'ok', service: 'student-profile-api', firebaseConfigured: firebaseReady })
    },

    me(req, res) {
      res.json({ uid: req.user.uid, email: req.user.email, role: req.role, profile: req.profile })
    },

    async completeRegistration(req, res) {
      const parsed = parseBody(registrationSchema, req.body, res, 'Invalid profile details.')
      if (!parsed) return
      await profileService.completeRegistration({
        ...parsed,
        uid: req.user.uid,
        email: req.user.email,
        emailVerified: req.user.email_verified
      })
      res.status(201).json({
        message: 'Registration submitted. Account access remains pending institutional identity review.',
        status: 'pending'
      })
    },

    async listUsers(req, res) {
      const users = await userService.listUsers({ role: req.role, lecturerUid: req.user.uid })
      res.json({ users })
    },

    async updateStatus(req, res) {
      const parsed = parseBody(accountStatusSchema, req.body, res, 'Status must be active or suspended.')
      if (!parsed) return
      await userService.updateStatus({
        actorUid: req.user.uid,
        targetUid: req.params.uid,
        status: parsed.status
      })
      res.json({ message: 'Account status updated. Existing sessions have been revoked.' })
    },

    async updateRole(req, res) {
      const parsed = parseBody(userRoleSchema, req.body, res, 'Invalid role.')
      if (!parsed) return
      await userService.updateRole({
        actorUid: req.user.uid,
        targetUid: req.params.uid,
        role: parsed.role
      })
      res.json({ message: 'Role updated. Existing sessions have been revoked.' })
    },

    async createNotification(req, res) {
      const parsed = parseBody(notificationSchema, req.body, res, 'Invalid notification.')
      if (!parsed) return
      const id = await notificationService.create({ creatorUid: req.user.uid, notification: parsed })
      res.status(201).json({ id })
    }
  }
}

export function errorHandler(error, _req, res, _next) {
  void _next
  if (error instanceof AppError) {
    const payload = { error: error.message }
    if (error.details) payload.details = error.details
    return res.status(error.status).json(payload)
  }
  console.error(error)
  return res.status(500).json({ error: 'Unexpected server error.' })
}
