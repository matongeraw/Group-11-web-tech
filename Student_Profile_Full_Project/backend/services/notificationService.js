export function createNotificationService({ repository }) {
  return {
    create: input => repository.createNotification(input)
  }
}
