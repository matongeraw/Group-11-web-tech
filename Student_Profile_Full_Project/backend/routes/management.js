import { Router } from 'express'
import { z } from 'zod'
import { admin, auth, db } from '../config/firebaseAdmin.js'
import { allowRoles, requireAuth, requireFirebase, requireToken } from '../middleware/auth.js'

const router = Router()
const requireAdmin = [requireFirebase, requireToken, requireAuth, allowRoles('admin')]
const requireLecturer = [requireFirebase, requireToken, requireAuth, allowRoles('lecturer')]
const requirePortalUser = [requireFirebase, requireToken, requireAuth]
const asyncRoute = handler => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next)
const timestamp = () => admin.firestore.FieldValue.serverTimestamp()
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a YYYY-MM-DD date.').refine(value => {
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}, 'Enter a real calendar date.')
const timeSchema = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, 'Use 24-hour HH:MM time.')

const eventFieldsSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().min(10).max(3000),
  date: dateSchema,
  startTime: timeSchema.optional().or(z.literal('')),
  endTime: timeSchema.optional().or(z.literal('')),
  location: z.string().trim().min(2).max(200),
  category: z.enum(['institution', 'academic']),
  organizer: z.string().trim().min(2).max(120),
  instructions: z.string().trim().max(2000).default('')
}).strict()
const eventSchema = eventFieldsSchema.refine(value => !value.startTime || !value.endTime || value.startTime < value.endTime, {
  message: 'End time must be after start time.',
  path: ['endTime']
})

const studentSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  studentId: z.string().trim().regex(/^\d{6}$/),
  email: z.string().trim().email().refine(value => value.toLowerCase().endsWith('@africau.edu'), 'Use an @africau.edu email address.'),
  programme: z.string().trim().max(120).default(''),
  department: z.string().trim().max(120).default(''),
  yearOfStudy: z.string().trim().max(30).default(''),
  semester: z.string().trim().max(30).default(''),
  courses: z.array(z.string().trim().min(2).max(20)).max(5).default([]),
  status: z.enum(['active', 'suspended']).default('active')
}).strict()
const studentCreateSchema = studentSchema.extend({ uid: z.string().trim().min(1).max(128) }).strict()

const lecturerSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().email().refine(value => value.toLowerCase().endsWith('@africau.edu'), 'Use an @africau.edu email address.'),
  department: z.string().trim().max(120).default(''),
  title: z.string().trim().max(80).default(''),
  courseCodes: z.array(z.string().trim().min(2).max(20)).max(30).default([])
}).strict()

const courseSchema = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9-]{2,20}$/),
  title: z.string().trim().min(2).max(120),
  programme: z.string().trim().min(2).max(120),
  department: z.string().trim().max(120).default(''),
  semester: z.string().trim().max(30).default(''),
  credits: z.number().int().min(1).max(30),
  description: z.string().trim().max(2000).default('')
}).strict()

const classSchema = z.object({
  classCode: z.string().trim().min(2).max(30),
  title: z.string().trim().min(2).max(120),
  courseCode: z.string().trim().min(2).max(20),
  programme: z.string().trim().min(2).max(120),
  academicYear: z.string().trim().min(4).max(20),
  semester: z.string().trim().min(2).max(30),
  lecturerUid: z.string().trim().min(1).max(128),
  studentUids: z.array(z.string().trim().min(1).max(128)).max(500).default([])
}).strict()

const timetableFieldsSchema = z.object({
  title: z.string().trim().min(2).max(120),
  classId: z.string().trim().min(1).max(128),
  courseCode: z.string().trim().min(2).max(20),
  lecturerUid: z.string().trim().min(1).max(128),
  dayOfWeek: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']),
  startTime: timeSchema,
  endTime: timeSchema,
  location: z.string().trim().min(2).max(200)
}).strict()
const timetableSchema = timetableFieldsSchema.refine(value => value.startTime < value.endTime, { message: 'End time must be after start time.', path: ['endTime'] })

async function getUsersByIds(ids) {
  const uniqueIds = [...new Set(ids)]
  const docs = await Promise.all(uniqueIds.map(uid => db.collection('users').doc(uid).get()))
  return docs.filter(doc => doc.exists).map(doc => ({ uid: doc.id, ...doc.data() }))
}

router.get('/events', ...requirePortalUser, asyncRoute(async (req, res) => {
  const snapshot = await db.collection('events').where('status', '==', 'approved').get()
  res.json({ events: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) })
}))

router.get('/courses', ...requirePortalUser, asyncRoute(async (_req, res) => {
  const snapshot = await db.collection('courses').orderBy('title').get()
  res.json({ courses: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) })
}))

router.get('/admin/summary', ...requireAdmin, asyncRoute(async (_req, res) => {
  const collections = ['users', 'students', 'lecturers', 'classes', 'courses', 'timetables']
  const counts = await Promise.all(collections.map(name => db.collection(name).count().get()))
  const events = await db.collection('events').get()
  const summary = Object.fromEntries(collections.map((name, index) => [name, counts[index].data().count]))
  summary.events = events.size
  summary.pendingEvents = events.docs.filter(doc => doc.data().status === 'pending').length
  res.json({ summary })
}))

router.get('/admin/users', ...requireAdmin, asyncRoute(async (_req, res) => {
  const snapshot = await db.collection('users').limit(500).get()
  res.json({ users: snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })) })
}))

router.get('/admin/students', ...requireAdmin, asyncRoute(async (_req, res) => {
  const [profiles, users] = await Promise.all([
    db.collection('students').limit(500).get(),
    db.collection('users').where('role', '==', 'student').limit(500).get()
  ])
  const records = new Map(users.docs.map(doc => [doc.id, { uid: doc.id, ...doc.data() }]))
  profiles.docs.forEach(doc => records.set(doc.id, { ...records.get(doc.id), ...doc.data(), uid: doc.id }))
  const students = [...records.values()]
  res.json({ students })
}))

router.post('/admin/students', ...requireAdmin, asyncRoute(async (req, res) => {
  const parsed = studentCreateSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid student profile.', details: parsed.error.flatten() })
  const { uid, ...details } = parsed.data
  const account = await auth.getUser(uid)
  if (account.email?.toLowerCase() !== details.email.toLowerCase()) return res.status(400).json({ error: 'The profile email must match the Firebase account.' })
  const duplicate = await db.collection('users').where('studentId', '==', details.studentId).limit(1).get()
  if (!duplicate.empty && duplicate.docs[0].id !== uid) return res.status(409).json({ error: 'Student ID is already in use.' })
  const profile = { ...details, uid, role: 'student', status: 'active', updatedAt: timestamp() }
  await Promise.all([
    db.collection('users').doc(uid).set(profile, { merge: true }),
    db.collection('students').doc(uid).set(profile, { merge: true }),
    auth.setCustomUserClaims(uid, { ...(account.customClaims || {}), role: 'student' })
  ])
  res.status(201).json({ student: profile })
}))

router.patch('/admin/students/:uid', ...requireAdmin, asyncRoute(async (req, res) => {
  const parsed = studentSchema.partial().strict().safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid student profile.', details: parsed.error.flatten() })
  const userRef = db.collection('users').doc(req.params.uid)
  const studentRef = db.collection('students').doc(req.params.uid)
  const user = await userRef.get()
  if (!user.exists || user.data().role !== 'student') return res.status(404).json({ error: 'Student account not found.' })
  if (parsed.data.email) {
    const account = await auth.getUser(req.params.uid)
    if (account.email?.toLowerCase() !== parsed.data.email.toLowerCase()) return res.status(400).json({ error: 'The profile email must match the Firebase account.' })
  }
  if (parsed.data.studentId) {
    const duplicate = await db.collection('users').where('studentId', '==', parsed.data.studentId).limit(1).get()
    if (!duplicate.empty && duplicate.docs[0].id !== req.params.uid) return res.status(409).json({ error: 'Student ID is already in use.' })
  }
  const profile = { ...parsed.data, updatedAt: timestamp() }
  await Promise.all([userRef.set(profile, { merge: true }), studentRef.set(profile, { merge: true })])
  res.json({ message: 'Student profile updated.' })
}))

router.get('/admin/lecturers', ...requireAdmin, asyncRoute(async (_req, res) => {
  const [profiles, users] = await Promise.all([
    db.collection('lecturers').limit(500).get(),
    db.collection('users').where('role', '==', 'lecturer').limit(500).get()
  ])
  const records = new Map(users.docs.map(doc => [doc.id, { uid: doc.id, ...doc.data() }]))
  profiles.docs.forEach(doc => records.set(doc.id, { ...records.get(doc.id), ...doc.data(), uid: doc.id }))
  const lecturers = [...records.values()]
  res.json({ lecturers })
}))

router.put('/admin/lecturers/:uid', ...requireAdmin, asyncRoute(async (req, res) => {
  const parsed = lecturerSchema.strict().safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid lecturer profile.', details: parsed.error.flatten() })
  const account = await auth.getUser(req.params.uid)
  if (account.email?.toLowerCase() !== parsed.data.email.toLowerCase()) return res.status(400).json({ error: 'The profile email must match the Firebase account.' })
  const profile = { ...parsed.data, uid: req.params.uid, role: 'lecturer', updatedAt: timestamp() }
  await Promise.all([
    db.collection('users').doc(req.params.uid).set(profile, { merge: true }),
    db.collection('lecturers').doc(req.params.uid).set(profile, { merge: true }),
    auth.setCustomUserClaims(req.params.uid, { ...(account.customClaims || {}), role: 'lecturer' })
  ])
  res.json({ lecturer: profile, message: 'The lecturer must refresh their ID token to use the updated role.' })
}))

router.get('/lecturer/profile', ...requireLecturer, asyncRoute(async (req, res) => {
  const [user, lecturer] = await Promise.all([
    db.collection('users').doc(req.user.uid).get(),
    db.collection('lecturers').doc(req.user.uid).get()
  ])
  res.json({ profile: { uid: req.user.uid, ...(user.exists ? user.data() : {}), ...(lecturer.exists ? lecturer.data() : {}) } })
}))

router.get('/lecturer/classes', ...requireLecturer, asyncRoute(async (req, res) => {
  const snapshot = await db.collection('classes').where('lecturerUid', '==', req.user.uid).get()
  const classes = await Promise.all(snapshot.docs.map(async doc => {
    const data = doc.data()
    const students = await getUsersByIds(data.studentUids || [])
    return { id: doc.id, ...data, students: students.filter(student => student.role === 'student') }
  }))
  res.json({ classes })
}))

router.get('/lecturer/students', ...requireLecturer, asyncRoute(async (req, res) => {
  const classes = await db.collection('classes').where('lecturerUid', '==', req.user.uid).get()
  const studentIds = classes.docs.flatMap(doc => doc.data().studentUids || [])
  const students = await getUsersByIds(studentIds)
  res.json({ students: students.filter(student => student.role === 'student') })
}))

router.get('/lecturer/timetable', ...requireLecturer, asyncRoute(async (req, res) => {
  const [classes, timetableSnapshot] = await Promise.all([
    db.collection('classes').where('lecturerUid', '==', req.user.uid).get(),
    db.collection('timetables').where('lecturerUid', '==', req.user.uid).get()
  ])
  const assignedClassIds = new Set(classes.docs.map(doc => doc.id))
  const timetables = timetableSnapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(entry => assignedClassIds.has(entry.classId))
  res.json({ timetables })
}))

router.get('/student/timetable', ...requirePortalUser, allowRoles('student'), asyncRoute(async (req, res) => {
  const classes = await db.collection('classes').where('studentUids', 'array-contains', req.user.uid).get()
  const entries = await Promise.all(classes.docs.map(async classDoc => {
    const snapshot = await db.collection('timetables').where('classId', '==', classDoc.id).get()
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), classCode: classDoc.data().classCode, classTitle: classDoc.data().title }))
  }))
  res.json({ timetables: entries.flat() })
}))

router.get('/admin/events', ...requireAdmin, asyncRoute(async (_req, res) => {
  const snapshot = await db.collection('events').get()
  res.json({ events: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) })
}))

router.post('/admin/events', ...requireAdmin, asyncRoute(async (req, res) => {
  const parsed = eventSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid event details.', details: parsed.error.flatten() })
  const ref = await db.collection('events').add({ ...parsed.data, status: 'pending', createdBy: req.user.uid, createdAt: timestamp(), updatedAt: timestamp() })
  res.status(201).json({ id: ref.id, status: 'pending' })
}))

router.patch('/admin/events/:id', ...requireAdmin, asyncRoute(async (req, res) => {
  const parsed = eventFieldsSchema.partial().strict().safeParse(req.body)
  if (!parsed.success || Object.keys(req.body).length === 0) return res.status(400).json({ error: 'Invalid event details.', details: parsed.success ? undefined : parsed.error.flatten() })
  const ref = db.collection('events').doc(req.params.id)
  if (!(await ref.get()).exists) return res.status(404).json({ error: 'Event not found.' })
  const current = (await ref.get()).data()
  const next = { ...current, ...parsed.data }
  if (next.startTime && next.endTime && next.startTime >= next.endTime) return res.status(400).json({ error: 'End time must be after start time.' })
  await ref.update({
    ...parsed.data,
    ...(current.status === 'approved' ? { status: 'pending', approvedBy: null, approvedAt: null } : {}),
    updatedAt: timestamp()
  })
  res.json({ message: 'Event updated.' })
}))

router.patch('/admin/events/:id/status', ...requireAdmin, asyncRoute(async (req, res) => {
  const parsed = z.object({ status: z.enum(['pending', 'approved', 'rejected']) }).strict().safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Status must be pending, approved, or rejected.' })
  const ref = db.collection('events').doc(req.params.id)
  if (!(await ref.get()).exists) return res.status(404).json({ error: 'Event not found.' })
  await ref.update({
    status: parsed.data.status,
    approvedBy: parsed.data.status === 'approved' ? req.user.uid : null,
    approvedAt: parsed.data.status === 'approved' ? timestamp() : null,
    updatedAt: timestamp()
  })
  res.json({ message: 'Event approval status updated.' })
}))

router.delete('/admin/events/:id', ...requireAdmin, asyncRoute(async (req, res) => {
  await db.collection('events').doc(req.params.id).delete()
  res.status(204).end()
}))

router.get('/admin/courses', ...requireAdmin, asyncRoute(async (_req, res) => {
  const snapshot = await db.collection('courses').orderBy('title').get()
  res.json({ courses: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) })
}))

router.post('/admin/courses', ...requireAdmin, asyncRoute(async (req, res) => {
  const parsed = courseSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid course details.', details: parsed.error.flatten() })
  const ref = db.collection('courses').doc(parsed.data.code)
  if ((await ref.get()).exists) return res.status(409).json({ error: 'A course with that code already exists.' })
  await ref.set({ ...parsed.data, createdAt: timestamp(), updatedAt: timestamp() })
  res.status(201).json({ id: ref.id })
}))

router.patch('/admin/courses/:id', ...requireAdmin, asyncRoute(async (req, res) => {
  const parsed = courseSchema.partial().strict().safeParse(req.body)
  if (!parsed.success || Object.keys(req.body).length === 0) return res.status(400).json({ error: 'Invalid course details.', details: parsed.success ? undefined : parsed.error.flatten() })
  if (parsed.data.code && parsed.data.code !== req.params.id) return res.status(400).json({ error: 'Course codes cannot be changed after creation.' })
  const ref = db.collection('courses').doc(req.params.id)
  if (!(await ref.get()).exists) return res.status(404).json({ error: 'Course not found.' })
  await ref.update({ ...parsed.data, updatedAt: timestamp() })
  res.json({ message: 'Course updated.' })
}))

router.delete('/admin/courses/:id', ...requireAdmin, asyncRoute(async (req, res) => {
  const classes = await db.collection('classes').where('courseCode', '==', req.params.id).limit(1).get()
  if (!classes.empty) return res.status(409).json({ error: 'Update or remove class assignments before deleting this course.' })
  await db.collection('courses').doc(req.params.id).delete()
  res.status(204).end()
}))

router.get('/admin/classes', ...requireAdmin, asyncRoute(async (_req, res) => {
  const snapshot = await db.collection('classes').limit(500).get()
  res.json({ classes: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) })
}))

router.post('/admin/classes', ...requireAdmin, asyncRoute(async (req, res) => {
  const parsed = classSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid class assignment.', details: parsed.error.flatten() })
  const lecturer = await db.collection('users').doc(parsed.data.lecturerUid).get()
  if (!lecturer.exists || lecturer.data().role !== 'lecturer') return res.status(400).json({ error: 'Choose an existing lecturer account.' })
  const course = await db.collection('courses').doc(parsed.data.courseCode).get()
  if (!course.exists) return res.status(400).json({ error: 'Choose an existing course code.' })
  const students = await getUsersByIds(parsed.data.studentUids)
  if (students.length !== new Set(parsed.data.studentUids).size || students.some(student => student.role !== 'student')) return res.status(400).json({ error: 'Every assigned UID must belong to an existing student account.' })
  const ref = await db.collection('classes').add({ ...parsed.data, createdAt: timestamp(), updatedAt: timestamp() })
  res.status(201).json({ id: ref.id })
}))

router.patch('/admin/classes/:id', ...requireAdmin, asyncRoute(async (req, res) => {
  const parsed = classSchema.partial().strict().safeParse(req.body)
  if (!parsed.success || Object.keys(req.body).length === 0) return res.status(400).json({ error: 'Invalid class assignment.', details: parsed.success ? undefined : parsed.error.flatten() })
  if (parsed.data.lecturerUid) {
    const lecturer = await db.collection('users').doc(parsed.data.lecturerUid).get()
    if (!lecturer.exists || lecturer.data().role !== 'lecturer') return res.status(400).json({ error: 'Choose an existing lecturer account.' })
  }
  if (parsed.data.courseCode && !(await db.collection('courses').doc(parsed.data.courseCode).get()).exists) return res.status(400).json({ error: 'Choose an existing course code.' })
  if (parsed.data.studentUids) {
    const students = await getUsersByIds(parsed.data.studentUids)
    if (students.length !== new Set(parsed.data.studentUids).size || students.some(student => student.role !== 'student')) return res.status(400).json({ error: 'Every assigned UID must belong to an existing student account.' })
  }
  const classRef = db.collection('classes').doc(req.params.id)
  const classSnapshot = await classRef.get()
  if (!classSnapshot.exists) return res.status(404).json({ error: 'Class assignment not found.' })
  const updatedClass = { ...classSnapshot.data(), ...parsed.data }
  const timetableSnapshot = await db.collection('timetables').where('classId', '==', req.params.id).get()
  if (timetableSnapshot.size > 499) return res.status(409).json({ error: 'This class has too many timetable entries to update safely. Contact support.' })
  const batch = db.batch()
  batch.update(classRef, { ...parsed.data, updatedAt: timestamp() })
  timetableSnapshot.docs.forEach(doc => batch.update(doc.ref, {
    lecturerUid: updatedClass.lecturerUid,
    courseCode: updatedClass.courseCode,
    updatedAt: timestamp()
  }))
  await batch.commit()
  res.json({ message: 'Class assignment updated.' })
}))

router.delete('/admin/classes/:id', ...requireAdmin, asyncRoute(async (req, res) => {
  const ref = db.collection('classes').doc(req.params.id)
  if (!(await ref.get()).exists) return res.status(404).json({ error: 'Class assignment not found.' })
  const timetable = await db.collection('timetables').where('classId', '==', req.params.id).limit(1).get()
  if (!timetable.empty) return res.status(409).json({ error: 'Delete this class’s timetable entries before deleting the class.' })
  await ref.delete()
  res.status(204).end()
}))

router.get('/admin/timetables', ...requireAdmin, asyncRoute(async (_req, res) => {
  const snapshot = await db.collection('timetables').limit(500).get()
  res.json({ timetables: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) })
}))

router.post('/admin/timetables', ...requireAdmin, asyncRoute(async (req, res) => {
  const parsed = timetableSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid timetable entry.', details: parsed.error.flatten() })
  const lecturer = await db.collection('users').doc(parsed.data.lecturerUid).get()
  if (!lecturer.exists || lecturer.data().role !== 'lecturer') return res.status(400).json({ error: 'Choose an existing lecturer account.' })
  const classDoc = await db.collection('classes').doc(parsed.data.classId).get()
  if (!classDoc.exists || classDoc.data().lecturerUid !== parsed.data.lecturerUid || classDoc.data().courseCode !== parsed.data.courseCode) return res.status(400).json({ error: 'The timetable entry must match its assigned class, course, and lecturer.' })
  const ref = await db.collection('timetables').add({ ...parsed.data, createdBy: req.user.uid, createdAt: timestamp(), updatedAt: timestamp() })
  res.status(201).json({ id: ref.id })
}))

router.patch('/admin/timetables/:id', ...requireAdmin, asyncRoute(async (req, res) => {
  const parsed = timetableFieldsSchema.partial().strict().safeParse(req.body)
  if (!parsed.success || Object.keys(req.body).length === 0) return res.status(400).json({ error: 'Invalid timetable entry.', details: parsed.success ? undefined : parsed.error.flatten() })
  const ref = db.collection('timetables').doc(req.params.id)
  if (!(await ref.get()).exists) return res.status(404).json({ error: 'Timetable entry not found.' })
  const current = (await ref.get()).data()
  const next = { ...current, ...parsed.data }
  if (next.startTime >= next.endTime) return res.status(400).json({ error: 'End time must be after start time.' })
  const lecturer = await db.collection('users').doc(next.lecturerUid).get()
  if (!lecturer.exists || lecturer.data().role !== 'lecturer') return res.status(400).json({ error: 'Choose an existing lecturer account.' })
  const classDoc = await db.collection('classes').doc(next.classId).get()
  if (!classDoc.exists || classDoc.data().lecturerUid !== next.lecturerUid || classDoc.data().courseCode !== next.courseCode) return res.status(400).json({ error: 'The timetable entry must match its assigned class, course, and lecturer.' })
  await ref.update({ ...parsed.data, updatedAt: timestamp() })
  res.json({ message: 'Timetable entry updated.' })
}))

router.delete('/admin/timetables/:id', ...requireAdmin, asyncRoute(async (req, res) => {
  await db.collection('timetables').doc(req.params.id).delete()
  res.status(204).end()
}))

export default router
