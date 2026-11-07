import { AppError } from '../utils/AppError.js'

export function createUserService({ auth, repository }) {
  return {
    listUsers: input => repository.listUsersFor(input),

    async updateStatus({ actorUid, targetUid, status }) {
      await auth.getUser(targetUid)
      const result = await repository.updateAccountStatus({ actorUid, targetUid, status })
      await auth.revokeRefreshTokens(targetUid)
      return result
    },

    async updateRole({ actorUid, targetUid, role }) {
      const target = await auth.getUser(targetUid)
      const current = await repository.getUser(targetUid)
      if (!current) throw new AppError(404, 'User not found.')
      await auth.setCustomUserClaims(target.uid, {
        ...(target.customClaims || {}),
        role
      })
      const result = await repository.updateUserRole({ actorUid, targetUid, role })
      if (result.previousRole !== role) await auth.revokeRefreshTokens(targetUid)
      return result
    }
  }
}
