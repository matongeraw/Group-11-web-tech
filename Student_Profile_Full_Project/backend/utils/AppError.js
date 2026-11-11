export class AppError extends Error {
  constructor(status, message, details) {
    super(message)
    this.name = 'AppError'
    this.status = status
    this.details = details
  }
}

export function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next)
}
