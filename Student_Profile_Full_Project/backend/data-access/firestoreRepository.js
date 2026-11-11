import { AppError } from '../utils/AppError.js'

export function createFirestoreRepository({ db, admin }) {
  const users = db.collection('users')
  const serverTimestamp = () => admin.firestore.FieldValue.serverTimestamp()

  async function getUser(uid) {
    const snapshot = await users.doc(uid).get()
    return snapshot.exists ? { uid: snapshot.id, ...snapshot.data() } : null
  }

  async function completeRegistration({ uid, email, fullName, studentId }) {
    const userRef = users.doc(uid)
    const claimRef = db.collection('studentIdClaims').doc(studentId)
    const auditRef = db.collection('auditLogs').doc()

    await db.runTransaction(async transaction => {
      const [existingUser, existingClaim, existingStudents] = await Promise.all([
        transaction.get(userRef),
        transaction.get(claimRef),
        transaction.get(users.where('studentId', '==', studentId).limit(2))
      ])
      if (existingUser.exists) {
        throw new AppError(409, 'An account already exists for this identity. Contact the Registry if it needs review.')
      }
      if (existingClaim.exists || existingStudents.docs.some(snapshot => snapshot.id !== uid)) {
        throw new AppError(409, 'Student ID is already registered.')
      }

      const timestamp = serverTimestamp()
      transaction.create(claimRef, { uid, createdAt: timestamp })
      transaction.create(userRef, {
        uid,
        email,
        fullName,
        studentId,
        role: 'student',
        status: 'pending',
        createdAt: timestamp,
        updatedAt: timestamp
      })
      transaction.create(auditRef, {
        actorUid: uid,
        targetUid: uid,
        action: 'account.registration_submitted',
        resultingStatus: 'pending',
        createdAt: timestamp
      })
    })
  }

  async function listUsersFor({ role, lecturerUid }) {
    let snapshots
    if (role === 'admin') {
      const result = await users.limit(100).get()
      snapshots = result.docs
    } else {
      const assignments = await db.collectionGroup('reviewers')
        .where('lecturerUid', '==', lecturerUid)
        .limit(100)
        .get()
      const studentUids = assignments.docs
        .filter(snapshot => snapshot.data().status === 'active')
        .map(snapshot => snapshot.ref.parent.parent?.id)
        .filter(Boolean)
      const results = await Promise.all([...new Set(studentUids)].map(uid => users.doc(uid).get()))
      snapshots = results.filter(snapshot => snapshot.exists
        && snapshot.data().role === 'student'
        && snapshot.data().status === 'active')
    }

    return snapshots.map(snapshot => {
      const data = snapshot.data()
      if (role === 'lecturer') {
        return { uid: snapshot.id, fullName: data.fullName || '', programme: data.programme || '' }
      }
      return {
        uid: snapshot.id,
        email: data.email || '',
        fullName: data.fullName || '',
        studentId: data.studentId || '',
        role: data.role || '',
        status: data.status || ''
      }
    })
  }

  async function updateAccountStatus({ actorUid, targetUid, status }) {
    const userRef = users.doc(targetUid)
    const auditRef = db.collection('auditLogs').doc()
    let previousStatus
    await db.runTransaction(async transaction => {
      const snapshot = await transaction.get(userRef)
      if (!snapshot.exists) throw new AppError(404, 'User not found.')
      previousStatus = snapshot.data().status
      const timestamp = serverTimestamp()
      transaction.update(userRef, { status, updatedAt: timestamp })
      transaction.create(auditRef, {
        actorUid,
        targetUid,
        action: 'account.status_changed',
        previousStatus,
        resultingStatus: status,
        createdAt: timestamp
      })
    })
    return { previousStatus }
  }

  async function updateUserRole({ actorUid, targetUid, role }) {
    const userRef = users.doc(targetUid)
    const auditRef = db.collection('auditLogs').doc()
    let previousRole
    await db.runTransaction(async transaction => {
      const snapshot = await transaction.get(userRef)
      if (!snapshot.exists) throw new AppError(404, 'User not found.')
      previousRole = snapshot.data().role
      const timestamp = serverTimestamp()
      transaction.update(userRef, { role, updatedAt: timestamp })
      transaction.create(auditRef, {
        actorUid,
        targetUid,
        action: 'account.role_changed',
        previousRole,
        resultingRole: role,
        createdAt: timestamp
      })
    })
    return { previousRole }
  }

  async function createNotification({ creatorUid, notification }) {
    const ref = await db.collection('notifications').add({
      ...notification,
      createdBy: creatorUid,
      createdAt: serverTimestamp()
    })
    await db.collection('auditLogs').add({
      actorUid: creatorUid,
      targetUid: ref.id,
      action: 'notification.created',
      createdAt: serverTimestamp()
    })
    return ref.id
  }

  return {
    getUser,
    completeRegistration,
    listUsersFor,
    updateAccountStatus,
    updateUserRole,
    createNotification
  }
}
