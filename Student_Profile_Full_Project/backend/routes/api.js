import { Router } from 'express'
 development
 feat/react-firebase-foundation

 main
import { createApiController } from '../controllers/apiController.js'
import { createFirestoreRepository } from '../data-access/firestoreRepository.js'
import { createAuthMiddleware } from '../middleware/auth.js'
import { createNotificationService } from '../services/notificationService.js'
import { createProfileService } from '../services/profileService.js'
import { createUserService } from '../services/userService.js'
import { asyncHandler } from '../utils/AppError.js'

export function createApiRouter({ auth, db, admin, firebaseReady }) {
  const router = Router()
  const middleware = createAuthMiddleware({ auth, db, firebaseReady })
  const repository = createFirestoreRepository({ db, admin })
  const profileService = createProfileService({ repository })
  const userService = createUserService({ auth, repository })
  const notificationService = createNotificationService({ repository })
  const controller = createApiController({
    profileService,
    userService,
    notificationService,
    firebaseReady
  })
  const { requireFirebase, requireToken, requireAuth, allowRoles } = middleware

  router.get('/health', controller.health)
  router.get('/me', requireFirebase, requireToken, requireAuth, controller.me)
  router.post('/profile/complete-registration', requireFirebase, requireToken, asyncHandler(controller.completeRegistration))
  router.get('/users', requireFirebase, requireToken, requireAuth, allowRoles('admin', 'lecturer'), asyncHandler(controller.listUsers))
  router.patch('/users/:uid/status', requireFirebase, requireToken, requireAuth, allowRoles('admin'), asyncHandler(controller.updateStatus))
  router.post('/admin/users/:uid/role', requireFirebase, requireToken, requireAuth, allowRoles('admin'), asyncHandler(controller.updateRole))
  router.post('/admin/notifications', requireFirebase, requireToken, requireAuth, allowRoles('admin', 'lecturer'), asyncHandler(controller.createNotification))

  return router
}
 development

import { z } from 'zod'
import { admin, auth, db, firebaseReady } from '../config/firebaseAdmin.js'
import { allowRoles, requireAuth, requireFirebase, requireToken } from '../middleware/auth.js'
import management from './management.js'
const router = Router()
router.get('/health', (_req, res) => res.json({ status: 'ok', service: 'student-profile-api', firebaseConfigured: firebaseReady }))
router.get('/me', requireFirebase, requireToken, requireAuth, (req, res) => res.json({ uid: req.user.uid, email: req.user.email, role: req.role, profile: req.profile }))
router.use(management)
const profileSchema = z.object({ fullName: z.string().trim().min(2).max(100), studentId: z.string().trim().regex(/^\d{6}$/), email: z.string().email().refine(v => v.toLowerCase().endsWith('@africau.edu'), 'Use an @africau.edu email address.') }).strict()
router.post('/profile/complete-registration', requireFirebase, requireToken, async (req, res) => {
  const parsed = profileSchema.safeParse({ ...req.body, email: req.user.email })
  if (!parsed.success) return res.status(400).json({ error: 'Invalid profile details.', details: parsed.error.flatten() })
  const existing = await db.collection('users').where('studentId', '==', parsed.data.studentId).limit(1).get()
  if (!existing.empty && existing.docs[0].id !== req.user.uid) return res.status(409).json({ error: 'Student ID is already registered.' })
  const profile = { ...parsed.data, uid: req.user.uid, role: 'student', status: 'active', createdAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() }
  await db.collection('users').doc(req.user.uid).set(profile, { merge: true })
  await auth.setCustomUserClaims(req.user.uid, { role: 'student' })
  res.status(201).json({ message: 'Student profile created.' })
})
router.get('/users', requireFirebase, requireToken, requireAuth, allowRoles('admin'), async (_req, res) => {
  const snapshot = await db.collection('users').limit(100).get()
  const users = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }))
  res.json({ users })
})
router.patch('/users/:uid/status', requireFirebase, requireToken, requireAuth, allowRoles('admin'), async (req, res) => {
  const parsed = z.object({ status: z.enum(['active', 'suspended']) }).safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Status must be active or suspended.' })
  const userRef = db.collection('users').doc(req.params.uid)
  const studentRef = db.collection('students').doc(req.params.uid)
  const user = await userRef.get()
  if (!user.exists) return res.status(404).json({ error: 'User account not found.' })
  const update = { status: parsed.data.status, updatedAt: admin.firestore.FieldValue.serverTimestamp() }
  const student = await studentRef.get()
  await Promise.all([userRef.update(update), ...(student.exists ? [studentRef.update(update)] : [])])
  res.json({ message: 'Account status updated.' })
})
router.post('/admin/users/:uid/role', requireFirebase, requireToken, requireAuth, allowRoles('admin'), async (req, res) => {
  const parsed = z.object({ role: z.enum(['student', 'lecturer', 'admin']) }).safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid role.' })
  const target = await auth.getUser(req.params.uid)
  await auth.setCustomUserClaims(target.uid, { ...(target.customClaims || {}), role: parsed.data.role })
  await db.collection('users').doc(target.uid).set({ role: parsed.data.role, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true })
  res.json({ message: 'Role updated. The user must refresh their ID token.' })
})
router.post('/admin/notifications', requireFirebase, requireToken, requireAuth, allowRoles('admin', 'lecturer'), async (req, res) => {
  const parsed = z.object({ title: z.string().trim().min(2).max(120), message: z.string().trim().min(2).max(1000), audience: z.enum(['students', 'lecturers', 'all']).default('students') }).safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid notification.' })
  const ref = await db.collection('notifications').add({ ...parsed.data, createdBy: req.user.uid, createdAt: admin.firestore.FieldValue.serverTimestamp() })
  res.status(201).json({ id: ref.id })
})
export default router
 development

 main
