import admin from 'firebase-admin'

if (!admin.apps.length) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  if (serviceAccount) admin.initializeApp({ credential: admin.credential.cert(JSON.parse(serviceAccount)), storageBucket: process.env.FIREBASE_STORAGE_BUCKET })
  else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) admin.initializeApp({ credential: admin.credential.applicationDefault(), storageBucket: process.env.FIREBASE_STORAGE_BUCKET })
}
export const firebaseReady = admin.apps.length > 0
export const db = firebaseReady ? admin.firestore() : null
export const auth = firebaseReady ? admin.auth() : null
export { admin }
