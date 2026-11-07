import admin from 'firebase-admin'

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID
  const emulatorVariables = [
    process.env.FIREBASE_AUTH_EMULATOR_HOST,
    process.env.FIRESTORE_EMULATOR_HOST,
    process.env.FIREBASE_STORAGE_EMULATOR_HOST
  ]
  const emulatorRequested = emulatorVariables.some(Boolean)
  const allEmulatorsConfigured = emulatorVariables.every(Boolean)
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON

  if (emulatorRequested) {
    if (!allEmulatorsConfigured || !projectId?.startsWith('demo-')) {
      throw new Error('All Firebase emulator hosts and a demo- project ID are required for emulator mode.')
    }
    admin.initializeApp({ projectId, storageBucket: process.env.FIREBASE_STORAGE_BUCKET })
  } else if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(serviceAccount)),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET
    })
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET
    })
  }
}
export const firebaseReady = admin.apps.length > 0
export const db = firebaseReady ? admin.firestore() : null
export const auth = firebaseReady ? admin.auth() : null
export { admin }
