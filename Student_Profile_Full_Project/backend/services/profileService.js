import { AppError } from '../utils/AppError.js'

export function createProfileService({ repository }) {
  return {
    async completeRegistration({ uid, email, fullName, studentId, emailVerified }) {
      if (emailVerified !== true) throw new AppError(403, 'Verify your institutional email before registering.')
      if (typeof email !== 'string' || !email.toLowerCase().endsWith('@africau.edu')) {
        throw new AppError(403, 'Use a verified @africau.edu email address.')
      }
      await repository.completeRegistration({ uid, email: email.toLowerCase(), fullName, studentId })
    }
  }
}
