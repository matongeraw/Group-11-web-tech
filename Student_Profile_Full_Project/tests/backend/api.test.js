import { initializeApp, deleteApp } from 'firebase/app'
import { connectAuthEmulator, getAuth, signInWithCustomToken } from 'firebase/auth'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { auth, db, admin, firebaseReady } from '../../backend/config/firebaseAdmin.js'
import { createApp } from '../../backend/app.js'

const projectId = 'demo-myau-passport'
const app = createApp({ auth, db, admin, firebaseReady })
const clientApps = []
let userCounter = 0

async function clearEmulators() {
  const [firestore, authResponse] = await Promise.all([
    fetch(`http://127.0.0.1:8080/emulator/v1/projects/${projectId}/databases/(default)/documents`, {
      method: 'DELETE'
    }),
    fetch(`http://127.0.0.1:9099/emulator/v1/projects/${projectId}/accounts`, {
      method: 'DELETE'
    })
  ])
  if (!firestore.ok || !authResponse.ok) {
    throw new Error(`Unable to reset emulator test data (Firestore ${firestore.status}, Auth ${authResponse.status}).`)
  }
}

async function createPrincipal({
  role = 'student',
  status = 'active',
  email,
  emailVerified = true,
  provisioned = true,
  tokenClaims = {}
} = {}) {
  const uid = `test-user-${++userCounter}`
  const principalEmail = email || `${uid}@africau.edu`
  await auth.createUser({ uid, email: principalEmail, emailVerified })
  if (provisioned) {
    await db.collection('users').doc(uid).set({
      uid,
      email: principalEmail,
      fullName: 'Demo User',
      studentId: uid.slice(-6).padStart(6, '0'),
      role,
      status
    })
  }

  const emulatorApp = initializeApp({
    apiKey: 'demo-api-key',
    authDomain: `${projectId}.firebaseapp.com`,
    projectId,
    appId: `1:000000000000:web:${uid}`
  }, `test-client-${uid}`)
  clientApps.push(emulatorApp)
  const clientAuth = getAuth(emulatorApp)
  connectAuthEmulator(clientAuth, 'http://127.0.0.1:9099', { disableWarnings: true })
  const customToken = await auth.createCustomToken(uid, tokenClaims)
  const credential = await signInWithCustomToken(clientAuth, customToken)
  return { uid, email: principalEmail, token: await credential.user.getIdToken(true) }
}

const authHeader = principal => ({ Authorization: `Bearer ${principal.token}` })

beforeEach(async () => {
  await clearEmulators()
})

afterEach(async () => {
  await Promise.all(clientApps.splice(0).map(deleteApp))
})

describe('Firebase token and active-account authorization', () => {
  it('rejects missing, unverified, non-institutional, and inactive identities', async () => {
    expect((await request(app).get('/api/me')).status).toBe(401)

    const unverified = await createPrincipal({ emailVerified: false, provisioned: false })
    expect((await request(app).get('/api/me').set(authHeader(unverified))).status).toBe(403)

    const external = await createPrincipal({ email: `outside-${userCounter}@example.com`, provisioned: false })
    expect((await request(app).get('/api/me').set(authHeader(external))).status).toBe(403)

    const suspended = await createPrincipal({ status: 'suspended' })
    expect((await request(app).get('/api/me').set(authHeader(suspended))).status).toBe(403)
  })

  it('uses the current profile role instead of stale or forged token role claims', async () => {
    const studentWithAdminClaim = await createPrincipal({ tokenClaims: { role: 'admin' } })
    expect((await request(app).get('/api/users').set(authHeader(studentWithAdminClaim))).status).toBe(403)

    const adminWithStudentClaim = await createPrincipal({ role: 'admin', tokenClaims: { role: 'student' } })
    expect((await request(app).get('/api/users').set(authHeader(adminWithStudentClaim))).status).toBe(200)
  })
})

describe('student registration safeguards', () => {
  it('requires a verified institutional email and creates a pending, not active, profile', async () => {
    const unverified = await createPrincipal({ emailVerified: false, provisioned: false })
    const blocked = await request(app).post('/api/profile/complete-registration')
      .set(authHeader(unverified))
      .send({ fullName: 'Demo Student', studentId: '123456' })
    expect(blocked.status).toBe(403)

    const student = await createPrincipal({ provisioned: false })
    const response = await request(app).post('/api/profile/complete-registration')
      .set(authHeader(student))
      .send({ fullName: 'Demo Student', studentId: '123456' })
    expect(response.status).toBe(201)
    expect(response.body.status).toBe('pending')
    expect((await db.collection('users').doc(student.uid).get()).data().status).toBe('pending')
    expect((await db.collection('auditLogs').where('targetUid', '==', student.uid).get()).size).toBe(1)
  })

  it('does not let a suspended account reactivate or overwrite its role through registration', async () => {
    const suspended = await createPrincipal({ role: 'lecturer', status: 'suspended' })
    const response = await request(app).post('/api/profile/complete-registration')
      .set(authHeader(suspended))
      .send({ fullName: 'Replacement Name', studentId: '654321' })
    expect(response.status).toBe(409)
    const profile = (await db.collection('users').doc(suspended.uid).get()).data()
    expect(profile.status).toBe('suspended')
    expect(profile.role).toBe('lecturer')
  })

  it('validates input and atomically reserves a unique student ID', async () => {
    const malformed = await createPrincipal({ provisioned: false })
    expect((await request(app).post('/api/profile/complete-registration')
      .set(authHeader(malformed))
      .send({ fullName: 'A', studentId: '12345', role: 'admin' })).status).toBe(400)

    const first = await createPrincipal({ provisioned: false })
    const second = await createPrincipal({ provisioned: false })
    const responses = await Promise.all([first, second].map(principal =>
      request(app).post('/api/profile/complete-registration')
        .set(authHeader(principal))
        .send({ fullName: 'Demo Student', studentId: '112233' })))
    expect(responses.map(response => response.status).sort()).toEqual([201, 409])
    expect((await db.collection('studentIdClaims').doc('112233').get()).exists).toBe(true)
  })
})

describe('role-scoped API access and audit records', () => {
  it('returns only explicitly assigned active students to lecturers', async () => {
    const lecturer = await createPrincipal({ role: 'lecturer' })
    const assignedStudent = await createPrincipal()
    const otherStudent = await createPrincipal()
    await db.collection('reviewAssignments').doc(assignedStudent.uid)
      .collection('reviewers').doc(lecturer.uid)
      .set({ lecturerUid: lecturer.uid, status: 'active' })

    const response = await request(app).get('/api/users').set(authHeader(lecturer))
    expect(response.status).toBe(200)
    expect(response.body.users.map(user => user.uid)).toEqual([assignedStudent.uid])
    expect(response.body.users[0]).not.toHaveProperty('email')
    expect(response.body.users.some(user => user.uid === otherStudent.uid)).toBe(false)
  })

  it('blocks student role/status changes and records admin changes while revoking sessions', async () => {
    const student = await createPrincipal()
    const adminPrincipal = await createPrincipal({ role: 'admin' })
    expect((await request(app).patch(`/api/users/${student.uid}/status`)
      .set(authHeader(student))
      .send({ status: 'suspended' })).status).toBe(403)
    expect((await request(app).post(`/api/admin/users/${student.uid}/role`)
      .set(authHeader(student))
      .send({ role: 'admin' })).status).toBe(403)

    const statusChange = await request(app).patch(`/api/users/${student.uid}/status`)
      .set(authHeader(adminPrincipal))
      .send({ status: 'suspended' })
    expect(statusChange.status).toBe(200)
    expect((await db.collection('users').doc(student.uid).get()).data().status).toBe('suspended')
    expect((await db.collection('auditLogs').where('action', '==', 'account.status_changed').get()).size).toBe(1)
  })

  it('denies access from a revoked ID token after an administrator changes a role', async () => {
    const adminPrincipal = await createPrincipal({ role: 'admin' })
    const target = await createPrincipal()
    await new Promise(resolve => setTimeout(resolve, 1100))
    const response = await request(app).post(`/api/admin/users/${target.uid}/role`)
      .set(authHeader(adminPrincipal))
      .send({ role: 'lecturer' })
    expect(response.status).toBe(200)
    expect((await db.collection('users').doc(target.uid).get()).data().role).toBe('lecturer')
    expect((await db.collection('auditLogs').where('action', '==', 'account.role_changed').get()).size).toBe(1)
    expect((await request(app).get('/api/me').set(authHeader(target))).status).toBe(401)
  })

  it('requires an authorized role to create a notification and rejects extra fields', async () => {
    const student = await createPrincipal()
    const denied = await request(app).post('/api/admin/notifications')
      .set(authHeader(student))
      .send({ title: 'Update', message: 'A demo notice' })
    expect(denied.status).toBe(403)

    const lecturer = await createPrincipal({ role: 'lecturer' })
    const invalid = await request(app).post('/api/admin/notifications')
      .set(authHeader(lecturer))
      .send({ title: 'Update', message: 'A demo notice', createdBy: 'other-user' })
    expect(invalid.status).toBe(400)

    const created = await request(app).post('/api/admin/notifications')
      .set(authHeader(lecturer))
      .send({ title: 'Update', message: 'A demo notice' })
    expect(created.status).toBe(201)
    expect((await db.collection('auditLogs').where('action', '==', 'notification.created').get()).size).toBe(1)
  })
})
