import 'dotenv/config'
import admin from 'firebase-admin'

const [email, role] = process.argv.slice(2)
if (!email || !['student', 'lecturer', 'admin'].includes(role)) {
  console.error('Usage: npm run set-role -- user@africau.edu admin|lecturer|student')
  process.exit(1)
}
if (!admin.apps.length) {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)) })
  else admin.initializeApp({ credential: admin.credential.applicationDefault() })
}
const user = await admin.auth().getUserByEmail(email)
await admin.auth().setCustomUserClaims(user.uid, { ...(user.customClaims || {}), role })
await admin.firestore().collection('users').doc(user.uid).set({ uid: user.uid, email, role, status: 'active' }, { merge: true })
console.log(`Set ${email} to role=${role}. Sign out and sign in again to refresh the ID token.`)
process.exit(0)
