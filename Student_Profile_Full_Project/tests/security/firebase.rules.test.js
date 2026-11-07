import { readFile } from 'node:fs/promises'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment
} from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { getBytes, ref, uploadBytes } from 'firebase/storage'

const projectId = 'demo-myau-passport'
let testEnv

beforeAll(async () => {
  const [firestoreRules, storageRules] = await Promise.all([
    readFile(new URL('../../firebase/firestore.rules', import.meta.url), 'utf8'),
    readFile(new URL('../../firebase/storage.rules', import.meta.url), 'utf8')
  ])
  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: { rules: firestoreRules },
    storage: { rules: storageRules }
  })
})

afterAll(async () => {
  await testEnv?.cleanup()
})

beforeEach(async () => {
  await testEnv.clearFirestore()
  await testEnv.clearStorage()
  await testEnv.withSecurityRulesDisabled(async context => {
    const db = context.firestore()
    const users = [
      ['student-1', 'student', 'active'],
      ['student-2', 'student', 'active'],
      ['lecturer-1', 'lecturer', 'active'],
      ['lecturer-2', 'lecturer', 'active'],
      ['admin-1', 'admin', 'active'],
      ['suspended-student', 'student', 'suspended']
    ]
    await Promise.all(users.map(([uid, role, status]) =>
      setDoc(doc(db, 'users', uid), { uid, role, status })))
    await setDoc(doc(db, 'studentProfiles', 'student-1'), {
      uid: 'student-1',
      visibility: 'assigned',
      displayName: 'Demo Student'
    })
    await setDoc(doc(db, 'studentProfiles', 'student-2'), {
      uid: 'student-2',
      visibility: 'private',
      displayName: 'Another Demo Student'
    })
    await setDoc(doc(db, 'studentProfiles', 'student-1', 'skills', 'pending-skill'), {
      name: 'HTML',
      category: 'Technical',
      proficiency: 'intermediate',
      status: 'pending'
    })
    await setDoc(doc(db, 'studentProfiles', 'student-1', 'skills', 'verified-skill'), {
      name: 'CSS',
      category: 'Technical',
      proficiency: 'advanced',
      status: 'verified',
      verifiedBy: 'lecturer-1'
    })
    await setDoc(doc(db, 'verificationRecords', 'verification-1'), {
      studentUid: 'student-1',
      itemType: 'skill',
      itemId: 'verified-skill',
      decision: 'verified'
    })
    await setDoc(doc(db, 'reviewAssignments', 'student-1', 'reviewers', 'lecturer-1'), {
      status: 'active'
    })
  })
})

afterEach(async () => {
  await testEnv.clearFirestore()
  await testEnv.clearStorage()
})

const firestoreFor = uid => testEnv.authenticatedContext(uid).firestore()
const storageFor = uid => testEnv.authenticatedContext(uid).storage()
const activeSkill = {
  name: 'Accessible design',
  category: 'Technical',
  proficiency: 'intermediate',
  status: 'pending'
}

describe('Firestore authorization', () => {
  it('lets an active student read their own profile and denies another student', async () => {
    await assertSucceeds(getDoc(doc(firestoreFor('student-1'), 'studentProfiles', 'student-1')))
    await assertFails(getDoc(doc(firestoreFor('student-1'), 'studentProfiles', 'student-2')))
  })

  it('does not trust role claims for administrator access', async () => {
    const forgedAdmin = testEnv.authenticatedContext('student-1', { role: 'admin' }).firestore()
    await assertFails(getDoc(doc(forgedAdmin, 'studentProfiles', 'student-2')))
    await assertSucceeds(getDoc(doc(firestoreFor('admin-1'), 'studentProfiles', 'student-2')))
  })

  it('limits lecturer reads to explicitly assigned student records', async () => {
    const lecturer = firestoreFor('lecturer-1')
    await assertSucceeds(getDoc(doc(lecturer, 'studentProfiles', 'student-1')))
    await assertFails(getDoc(doc(lecturer, 'studentProfiles', 'student-2')))
    await assertFails(getDoc(doc(firestoreFor('lecturer-2'), 'studentProfiles', 'student-1')))
  })

  it('allows owners to submit pending skills but blocks self-verification and protected fields', async () => {
    const student = firestoreFor('student-1')
    await assertSucceeds(setDoc(doc(student, 'studentProfiles', 'student-1', 'skills', 'new-skill'), activeSkill))
    await assertFails(setDoc(doc(student, 'studentProfiles', 'student-1', 'skills', 'self-verified'), {
      ...activeSkill,
      status: 'verified',
      verifiedBy: 'student-1'
    }))
    await assertFails(setDoc(doc(student, 'studentProfiles', 'student-1', 'skills', 'pending-skill'), {
      ...activeSkill,
      status: 'verified'
    }))
  })

  it('does not let students create or alter privileged user fields or audit records', async () => {
    const student = firestoreFor('student-1')
    await assertFails(setDoc(doc(student, 'users', 'student-1'), {
      uid: 'student-1',
      role: 'admin',
      status: 'active'
    }))
    await assertFails(setDoc(doc(student, 'users', 'student-1'), {
      uid: 'student-1',
      role: 'student',
      status: 'suspended'
    }))
    await assertFails(setDoc(doc(student, 'activity_logs', 'forged'), {
      actorUid: 'admin-1',
      action: 'verified'
    }))
  })

  it('denies access to inactive accounts and denies client-side verification history writes', async () => {
    await assertFails(getDoc(doc(firestoreFor('suspended-student'), 'studentProfiles', 'suspended-student')))
    await assertFails(setDoc(doc(firestoreFor('student-1'), 'verificationRecords', 'forged'), {
      studentUid: 'student-1',
      decision: 'verified'
    }))
  })
})

describe('Storage authorization', () => {
  const evidencePath = 'student-files/student-1/skills/skill-1/evidence.pdf'
  const pdf = () => new Uint8Array([37, 80, 68, 70])

  it('keeps evidence private, owner-writable, and readable only by an assigned lecturer', async () => {
    const owner = storageFor('student-1')
    await assertSucceeds(uploadBytes(ref(owner, evidencePath), pdf(), { contentType: 'application/pdf' }))
    await assertSucceeds(getBytes(ref(owner, evidencePath)))
    await assertFails(getBytes(ref(storageFor('student-2'), evidencePath)))
    await assertFails(getBytes(ref(storageFor('lecturer-2'), evidencePath)))
    await assertSucceeds(getBytes(ref(storageFor('lecturer-1'), evidencePath)))
    await assertFails(uploadBytes(ref(storageFor('lecturer-1'), evidencePath), pdf(), {
      contentType: 'application/pdf'
    }))
  })

  it('denies unauthenticated access, unsupported types, and oversized uploads', async () => {
    await assertFails(uploadBytes(ref(testEnv.unauthenticatedContext().storage(), evidencePath), pdf(), {
      contentType: 'application/pdf'
    }))
    await assertFails(uploadBytes(ref(storageFor('student-1'), 'student-files/student-1/file.exe'), pdf(), {
      contentType: 'application/x-msdownload'
    }))
    await assertFails(uploadBytes(ref(storageFor('student-1'), 'student-files/student-1/large.pdf'), new Uint8Array(10 * 1024 * 1024 + 1), {
      contentType: 'application/pdf'
    }))
  })

  it('does not expose profile images to other authenticated students', async () => {
    const imagePath = 'profiles/student-1/avatar.png'
    await assertSucceeds(uploadBytes(ref(storageFor('student-1'), imagePath), new Uint8Array([137, 80]), {
      contentType: 'image/png'
    }))
    await assertFails(getBytes(ref(storageFor('student-2'), imagePath)))
    await assertSucceeds(getBytes(ref(storageFor('admin-1'), imagePath)))
  })
})
