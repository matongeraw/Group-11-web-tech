import { Router } from 'express'
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
