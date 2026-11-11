import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react"
import type { User } from "firebase/auth"
import { managementRequest } from "./management-api"

type Role = "admin" | "lecturer"
type EventRecord = {
  id: string
  title: string
  description: string
  date: string
  startTime?: string
  endTime?: string
  location: string
  category: "institution" | "academic"
  organizer: string
  instructions?: string
  status: "pending" | "approved" | "rejected"
}
type ProfileRecord = {
  uid: string
  fullName: string
  email: string
  role: string
  studentId?: string
  programme?: string
  department?: string
  yearOfStudy?: string
  semester?: string
  courses?: string[]
  status?: string
  title?: string
  courseCodes?: string[]
}
type CourseRecord = {
  id: string
  code: string
  title: string
  programme: string
  department?: string
  semester?: string
  credits: number
  description?: string
}
type ClassRecord = {
  id: string
  classCode: string
  title: string
  courseCode: string
  programme: string
  academicYear: string
  semester: string
  lecturerUid: string
  studentUids: string[]
  students?: ProfileRecord[]
}
type TimetableRecord = {
  id: string
  title: string
  classId: string
  courseCode: string
  lecturerUid: string
  dayOfWeek: string
  startTime: string
  endTime: string
  location: string
}
type Request = <T>(path: string, method?: string, body?: unknown) => Promise<T>

const pageNames: Record<string, string> = {
  "admin-dashboard": "Dashboard",
  "admin-events": "Calendar & Events",
  "admin-students": "Students",
  "admin-lecturers": "Lecturers",
  "admin-classes": "Classes",
  "admin-timetables": "Timetables",
  "admin-courses": "Courses & Programmes",
  "admin-settings": "Settings",
  "lecturer-dashboard": "Dashboard",
  "lecturer-profile": "My Profile",
  "lecturer-classes": "My Classes",
  "lecturer-students": "My Students",
  "lecturer-timetable": "Timetable",
  "lecturer-settings": "Settings",
}

function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="management-field">
      <span>{label}</span>
      {children}
    </label>
  )
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: ReactNode
}) {
  return (
    <section className="card management-panel">
      <div className="management-panel-head">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  )
}

function Status({ value }: { value: string }) {
  const tone =
    value === "approved" || value === "active"
      ? "green"
      : value === "pending"
        ? "amber"
        : "gray"
  return <span className={`badge badge-${tone}`}>{value}</span>
}

function EventForm({
  initial,
  busy,
  onCancel,
  onSave,
}: {
  initial?: EventRecord
  busy: boolean
  onCancel: () => void
  onSave: (event: Omit<EventRecord, "id" | "status">) => void
}) {
  const [values, setValues] = useState({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    date: initial?.date ?? "",
    startTime: initial?.startTime ?? "",
    endTime: initial?.endTime ?? "",
    location: initial?.location ?? "",
    category: initial?.category ?? "institution",
    organizer: initial?.organizer ?? "",
    instructions: initial?.instructions ?? "",
  })
  const set = (key: keyof typeof values, value: string) =>
    setValues(current => ({ ...current, [key]: value }))
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSave(values)
  }
  return (
    <form className="management-form" onSubmit={submit}>
      <Field label="Event title">
        <input required minLength={2} maxLength={120} value={values.title} onChange={event => set("title", event.target.value)} />
      </Field>
      <Field label="Category">
        <select value={values.category} onChange={event => set("category", event.target.value)}>
          <option value="institution">Institution event</option>
          <option value="academic">Academic event</option>
        </select>
      </Field>
      <Field label="Date">
        <input type="date" required value={values.date} onChange={event => set("date", event.target.value)} />
      </Field>
      <Field label="Location">
        <input required value={values.location} onChange={event => set("location", event.target.value)} />
      </Field>
      <Field label="Start time">
        <input type="time" value={values.startTime} onChange={event => set("startTime", event.target.value)} />
      </Field>
      <Field label="End time">
        <input type="time" value={values.endTime} onChange={event => set("endTime", event.target.value)} />
      </Field>
      <Field label="Organizer or department">
        <input required value={values.organizer} onChange={event => set("organizer", event.target.value)} />
      </Field>
      <Field label="Description">
        <textarea required minLength={10} value={values.description} onChange={event => set("description", event.target.value)} />
      </Field>
      <Field label="Additional instructions">
        <textarea value={values.instructions} onChange={event => set("instructions", event.target.value)} />
      </Field>
      <div className="management-form-actions">
        <button className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : initial ? "Save changes" : "Create pending event"}</button>
        <button className="btn btn-secondary" type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  )
}

export default function ManagementWorkspace({
  role,
  route,
  user,
  go,
  notify,
}: {
  role: Role
  route: string
  user: User
  go: (path: string) => void
  notify: (message: string) => void
}) {
  const [events, setEvents] = useState<EventRecord[]>([])
  const [students, setStudents] = useState<ProfileRecord[]>([])
  const [lecturers, setLecturers] = useState<ProfileRecord[]>([])
  const [accounts, setAccounts] = useState<ProfileRecord[]>([])
  const [courses, setCourses] = useState<CourseRecord[]>([])
  const [classes, setClasses] = useState<ClassRecord[]>([])
  const [timetables, setTimetables] = useState<TimetableRecord[]>([])
  const [summary, setSummary] = useState<Record<string, number>>({})
  const [profile, setProfile] = useState<ProfileRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [eventEditor, setEventEditor] = useState<EventRecord | null | undefined>(undefined)
  const [editingStudent, setEditingStudent] = useState<ProfileRecord | null>(null)
  const [editingCourse, setEditingCourse] = useState<CourseRecord | null>(null)
  const [editingClass, setEditingClass] = useState<ClassRecord | null>(null)
  const [editingTimetable, setEditingTimetable] = useState<TimetableRecord | null>(null)

  const request = useCallback<Request>(
    <T,>(path: string, method = "GET", body?: unknown) =>
      managementRequest<T>(user, path, {
        method,
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      }),
    [user],
  )

  const refresh = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      if (route === "admin-dashboard") {
        const result = await request<{ summary: Record<string, number> }>("/admin/summary")
        setSummary(result.summary)
      } else if (route === "admin-events") {
        const result = await request<{ events: EventRecord[] }>("/admin/events")
        setEvents(result.events)
      } else if (route === "admin-students") {
        const [result, accountsResult] = await Promise.all([
          request<{ students: ProfileRecord[] }>("/admin/students"),
          request<{ users: ProfileRecord[] }>("/admin/users"),
        ])
        setStudents(result.students)
        setAccounts(accountsResult.users)
      } else if (route === "admin-lecturers") {
        const [result, accountsResult] = await Promise.all([
          request<{ lecturers: ProfileRecord[] }>("/admin/lecturers"),
          request<{ users: ProfileRecord[] }>("/admin/users"),
        ])
        setLecturers(result.lecturers)
        setAccounts(accountsResult.users)
      } else if (route === "admin-classes") {
        const [classResult, lecturerResult, studentResult] = await Promise.all([
          request<{ classes: ClassRecord[] }>("/admin/classes"),
          request<{ lecturers: ProfileRecord[] }>("/admin/lecturers"),
          request<{ students: ProfileRecord[] }>("/admin/students"),
        ])
        setClasses(classResult.classes)
        setLecturers(lecturerResult.lecturers)
        setStudents(studentResult.students)
      } else if (route === "admin-timetables") {
        const [result, classResult, lecturerResult] = await Promise.all([
          request<{ timetables: TimetableRecord[] }>("/admin/timetables"),
          request<{ classes: ClassRecord[] }>("/admin/classes"),
          request<{ lecturers: ProfileRecord[] }>("/admin/lecturers"),
        ])
        setTimetables(result.timetables)
        setClasses(classResult.classes)
        setLecturers(lecturerResult.lecturers)
      } else if (route === "admin-courses") {
        const result = await request<{ courses: CourseRecord[] }>("/admin/courses")
        setCourses(result.courses)
      } else if (route === "admin-settings") {
        const result = await request<{ users: ProfileRecord[] }>("/admin/users")
        setAccounts(result.users)
      } else if (route === "lecturer-profile") {
        const result = await request<{ profile: ProfileRecord }>("/lecturer/profile")
        setProfile(result.profile)
      } else if (route === "lecturer-classes") {
        const result = await request<{ classes: ClassRecord[] }>("/lecturer/classes")
        setClasses(result.classes)
      } else if (route === "lecturer-students") {
        const result = await request<{ students: ProfileRecord[] }>("/lecturer/students")
        setStudents(result.students)
      } else if (route === "lecturer-timetable") {
        const result = await request<{ timetables: TimetableRecord[] }>("/lecturer/timetable")
        setTimetables(result.timetables)
      } else if (route === "lecturer-dashboard") {
        const [classResult, studentResult, timetableResult] = await Promise.all([
          request<{ classes: ClassRecord[] }>("/lecturer/classes"),
          request<{ students: ProfileRecord[] }>("/lecturer/students"),
          request<{ timetables: TimetableRecord[] }>("/lecturer/timetable"),
        ])
        setClasses(classResult.classes)
        setStudents(studentResult.students)
        setTimetables(timetableResult.timetables)
      } else if (route === "lecturer-settings") {
        const result = await request<{ profile: ProfileRecord }>("/lecturer/profile")
        setProfile(result.profile)
      }
      return true
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load this section.")
      return false
    } finally {
      setLoading(false)
    }
  }, [request, route])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const save = async (path: string, method: string, body?: unknown): Promise<boolean> => {
    setBusy(true)
    setError("")
    try {
      await request(path, method, body)
      const refreshed = await refresh()
      notify(refreshed ? "Changes saved successfully." : "Changes saved, but the list could not be refreshed.")
      return true
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save changes.")
      return false
    } finally {
      setBusy(false)
    }
  }

  const title = pageNames[route] ?? (role === "admin" ? "Administration" : "Lecturer portal")
  const dataLoading = loading && !error
  return (
    <div className="page-stack management-workspace">
      <div className="management-page-heading">
        <div>
          <span className="eyebrow">{role === "admin" ? "UNIVERSITY ADMINISTRATION" : "LECTURER PORTAL"}</span>
          <h1>{title}</h1>
          <p>{role === "admin" ? "Manage university records, approved events, and academic schedules." : "View only the classes and students assigned to your account."}</p>
        </div>
        {route === "admin-events" && <button className="btn btn-primary" onClick={() => setEventEditor(null)}>Add event</button>}
        {route === "admin-students" && <button className="btn btn-primary" onClick={() => setEditingStudent({ uid: "", fullName: "", email: "", role: "student" })}>Add student profile</button>}
        {route === "admin-lecturers" && <button className="btn btn-primary" onClick={() => setEditingStudent({ uid: "", fullName: "", email: "", role: "lecturer" })}>Add lecturer profile</button>}
        {route === "admin-classes" && <button className="btn btn-primary" onClick={() => setEditingClass({ id: "", classCode: "", title: "", courseCode: "", programme: "", academicYear: "", semester: "", lecturerUid: "", studentUids: [] })}>Assign class</button>}
        {route === "admin-timetables" && <button className="btn btn-primary" onClick={() => setEditingTimetable({ id: "", title: "", classId: "", courseCode: "", lecturerUid: "", dayOfWeek: "Monday", startTime: "", endTime: "", location: "" })}>Add timetable entry</button>}
        {route === "admin-courses" && <button className="btn btn-primary" onClick={() => setEditingCourse({ id: "", code: "", title: "", programme: "", credits: 3 })}>Add course</button>}
      </div>

      {error && <div className="management-alert" role="alert">{error}</div>}
      {dataLoading ? <div className="card management-empty">Loading {title.toLowerCase()}…</div> : null}
      {!dataLoading && route === "admin-dashboard" && (
        <div className="management-stats">
          {([
            ["Students", summary.students],
            ["Lecturers", summary.lecturers],
            ["Classes", summary.classes],
            ["Courses", summary.courses],
            ["Timetable entries", summary.timetables],
            ["Pending events", summary.pendingEvents],
          ] as [string, number][]).map(([label, count]) => (
            <button className="card management-stat" key={label} onClick={() => go(label === "Pending events" ? "admin-events" : label === "Students" ? "admin-students" : label === "Lecturers" ? "admin-lecturers" : label === "Classes" ? "admin-classes" : label === "Courses" ? "admin-courses" : "admin-timetables")}>
              <span>{label}</span><strong>{count ?? 0}</strong><small>Manage {label.toLowerCase()}</small>
            </button>
          ))}
          <Panel title="Event approvals" subtitle="Institutional events stay hidden from students until approved.">
            <button className="btn btn-secondary" onClick={() => go("admin-events")}>Review event submissions</button>
          </Panel>
        </div>
      )}

      {!dataLoading && route === "admin-events" && (
        <>
          {eventEditor !== undefined && <Panel title={eventEditor ? "Edit event" : "Create an event"} subtitle="New institution events are pending until an administrator approves them.">
            <EventForm
              initial={eventEditor ?? undefined}
              busy={busy}
              onCancel={() => setEventEditor(undefined)}
              onSave={values => void save(eventEditor ? `/admin/events/${eventEditor.id}` : "/admin/events", eventEditor ? "PATCH" : "POST", values).then(saved => { if (saved) setEventEditor(undefined) })}
            />
          </Panel>}
          <Panel title="Institution and academic events" subtitle="Only approved entries appear on the student calendar.">
            <div className="management-list">
              {events.map(item => <article className="management-row" key={item.id}>
                <div className="management-row-main"><strong>{item.title}</strong><span>{item.date} · {item.startTime || "Time not set"} · {item.location}</span><small>{item.category} · {item.organizer}</small></div>
                <Status value={item.status}/>
                <div className="management-row-actions">
                  <button className="btn btn-secondary" onClick={() => setEventEditor(item)}>Edit</button>
                  {item.status !== "approved" && <button className="btn btn-secondary" onClick={() => void save(`/admin/events/${item.id}/status`, "PATCH", { status: "approved" })}>Approve</button>}
                  {item.status === "pending" && <button className="btn btn-danger" onClick={() => void save(`/admin/events/${item.id}/status`, "PATCH", { status: "rejected" })}>Reject</button>}
                  {item.status === "approved" && <button className="btn btn-secondary" onClick={() => void save(`/admin/events/${item.id}/status`, "PATCH", { status: "rejected" })}>Withdraw</button>}
                  <button className="btn btn-danger" onClick={() => { if (window.confirm(`Delete “${item.title}”?`)) void save(`/admin/events/${item.id}`, "DELETE") }}>Delete</button>
                </div>
              </article>)}
              {events.length === 0 && <p className="management-empty">No events have been submitted yet.</p>}
            </div>
          </Panel>
        </>
      )}

      {!dataLoading && (route === "admin-students" || route === "admin-lecturers") && (
        <>
          {editingStudent && <Panel title={editingStudent.uid ? "Edit profile" : `Add ${route === "admin-students" ? "student" : "lecturer"} profile`}>
            <ProfileForm
              profile={editingStudent}
              role={route === "admin-students" ? "student" : "lecturer"}
              accounts={accounts}
              busy={busy}
              onCancel={() => setEditingStudent(null)}
              onSave={values => {
                const path = route === "admin-students" ? `/admin/students${editingStudent.uid ? `/${editingStudent.uid}` : ""}` : `/admin/lecturers/${values.uid}`
                const method = route === "admin-students" ? (editingStudent.uid ? "PATCH" : "POST") : "PUT"
                const { uid, ...details } = values
                void save(path, method, route === "admin-students" ? values : details).then(saved => { if (saved) setEditingStudent(null) })
              }}
            />
          </Panel>}
          <Panel title={route === "admin-students" ? "Student records" : "Lecturer records"} subtitle="Profiles are linked to existing university Firebase accounts.">
            <div className="management-list">
              {(route === "admin-students" ? students : lecturers).map(person => <article className="management-row" key={person.uid}>
                <div className="management-row-main"><strong>{person.fullName || "Name not provided"}</strong><span>{person.email}</span><small>{route === "admin-students" ? `${person.studentId || "No student ID"} · ${person.programme || "Programme not set"}` : `${person.title || "Lecturer"} · ${person.department || "Department not set"}`}</small></div>
                <Status value={person.status || person.role}/>
                <div className="management-row-actions">
                  <button className="btn btn-secondary" onClick={() => setEditingStudent(person)}>Edit</button>
                  {route === "admin-students" && <button className="btn btn-secondary" onClick={() => void save(`/users/${person.uid}/status`, "PATCH", { status: person.status === "suspended" ? "active" : "suspended" })}>{person.status === "suspended" ? "Reactivate" : "Suspend"}</button>}
                </div>
              </article>)}
              {(route === "admin-students" ? students : lecturers).length === 0 && <p className="management-empty">No records found. Add a profile for an existing account to get started.</p>}
            </div>
          </Panel>
        </>
      )}

      {!dataLoading && route === "admin-classes" && (
        <>
          {editingClass && <Panel title={editingClass.id ? "Edit class assignment" : "Assign a class"}>
            <ClassForm
              item={editingClass}
              lecturers={lecturers}
              students={students}
              busy={busy}
              onCancel={() => setEditingClass(null)}
              onSave={values => void save(editingClass.id ? `/admin/classes/${editingClass.id}` : "/admin/classes", editingClass.id ? "PATCH" : "POST", values).then(saved => { if (saved) setEditingClass(null) })}
            />
          </Panel>}
          <Panel title="Class assignments" subtitle="Lecturers can access students only through classes assigned to them.">
            <div className="management-list">
              {classes.map(item => <article className="management-row" key={item.id}>
                <div className="management-row-main"><strong>{item.title} · {item.classCode}</strong><span>{item.courseCode} · {item.programme}</span><small>{item.academicYear} · {item.semester} · {item.studentUids.length} students</small></div>
                <div className="management-row-actions"><button className="btn btn-secondary" onClick={() => setEditingClass(item)}>Edit</button><button className="btn btn-danger" onClick={() => { if (window.confirm(`Delete class ${item.classCode}?`)) void save(`/admin/classes/${item.id}`, "DELETE") }}>Delete</button></div>
              </article>)}
              {classes.length === 0 && <p className="management-empty">No class assignments have been created.</p>}
            </div>
          </Panel>
        </>
      )}

      {!dataLoading && route === "admin-timetables" && (
        <>
          {editingTimetable && <Panel title={editingTimetable.id ? "Edit timetable entry" : "Add timetable entry"}>
            <TimetableForm item={editingTimetable} lecturers={lecturers} classes={classes} busy={busy} onCancel={() => setEditingTimetable(null)} onSave={values => void save(editingTimetable.id ? `/admin/timetables/${editingTimetable.id}` : "/admin/timetables", editingTimetable.id ? "PATCH" : "POST", values).then(saved => { if (saved) setEditingTimetable(null) })}/>
          </Panel>}
          <Panel title="Academic timetable">
            <TimetableList timetables={timetables} lecturers={lecturers} onEdit={setEditingTimetable} onDelete={item => { if (window.confirm(`Delete ${item.title}?`)) void save(`/admin/timetables/${item.id}`, "DELETE") }}/>
          </Panel>
        </>
      )}

      {!dataLoading && route === "admin-courses" && (
        <>
          {editingCourse && <Panel title={editingCourse.id ? "Edit course" : "Add course"}>
            <CourseForm item={editingCourse} busy={busy} onCancel={() => setEditingCourse(null)} onSave={values => void save(editingCourse.id ? `/admin/courses/${editingCourse.id}` : "/admin/courses", editingCourse.id ? "PATCH" : "POST", values).then(saved => { if (saved) setEditingCourse(null) })}/>
          </Panel>}
          <Panel title="Courses and programmes" subtitle="Each course record belongs to a programme and can be assigned to a class.">
            <div className="management-list">
              {courses.map(item => <article className="management-row" key={item.id}>
                <div className="management-row-main"><strong>{item.code} · {item.title}</strong><span>{item.programme} · {item.credits} credits</span><small>{item.department || "Department not set"} · {item.semester || "Semester not set"}</small></div>
                <div className="management-row-actions"><button className="btn btn-secondary" onClick={() => setEditingCourse(item)}>Edit</button><button className="btn btn-danger" onClick={() => { if (window.confirm(`Delete course ${item.code}?`)) void save(`/admin/courses/${item.id}`, "DELETE") }}>Delete</button></div>
              </article>)}
              {courses.length === 0 && <p className="management-empty">No courses have been created yet.</p>}
            </div>
          </Panel>
        </>
      )}

      {!dataLoading && route === "admin-settings" && (
        <Panel title="Account roles" subtitle="Assign the least-privileged portal role. Users must refresh their ID token after a role change.">
          <div className="management-list">
            {accounts.map(account => <RoleRow key={account.uid} account={account} busy={busy} onSave={roleValue => void save(`/admin/users/${account.uid}/role`, "POST", { role: roleValue })}/>)}
          </div>
        </Panel>
      )}

      {!dataLoading && (route === "lecturer-dashboard" || route === "lecturer-classes") && (
        <Panel title={route === "lecturer-dashboard" ? "Your assigned classes" : "My classes"} subtitle="Student records shown here are limited to the classes assigned to you.">
          <ClassList classes={classes}/>
        </Panel>
      )}
      {!dataLoading && route === "lecturer-students" && (
        <Panel title="Students in your assigned classes">
          <PeopleList people={students} empty="No students are assigned to your classes."/>
        </Panel>
      )}
      {!dataLoading && (route === "lecturer-profile" || route === "lecturer-settings") && profile && (
        <Panel title="Your profile" subtitle="Contact your administrator to update employment or account details.">
          <dl className="management-details">
            <div><dt>Name</dt><dd>{profile.fullName || "Not set"}</dd></div>
            <div><dt>Email</dt><dd>{profile.email}</dd></div>
            <div><dt>Role</dt><dd>Lecturer</dd></div>
            <div><dt>Department</dt><dd>{profile.department || "Not set"}</dd></div>
            <div><dt>Title</dt><dd>{profile.title || "Not set"}</dd></div>
            <div><dt>Courses</dt><dd>{profile.courseCodes?.join(", ") || "No courses assigned"}</dd></div>
          </dl>
        </Panel>
      )}
      {!dataLoading && route === "lecturer-timetable" && (
        <Panel title="Your assigned timetable">
          <TimetableList timetables={timetables} lecturers={[]} onEdit={() => undefined}/>
        </Panel>
      )}
    </div>
  )
}

function ProfileForm({
  profile,
  role,
  accounts,
  busy,
  onCancel,
  onSave,
}: {
  profile: ProfileRecord
  role: "student" | "lecturer"
  accounts: ProfileRecord[]
  busy: boolean
  onCancel: () => void
  onSave: (values: Record<string, unknown> & { uid: string }) => void
}) {
  const [uid, setUid] = useState(profile.uid)
  const [fullName, setFullName] = useState(profile.fullName)
  const [email, setEmail] = useState(profile.email)
  const [studentId, setStudentId] = useState(profile.studentId || "")
  const [programme, setProgramme] = useState(profile.programme || "")
  const [department, setDepartment] = useState(profile.department || "")
  const [title, setTitle] = useState(profile.title || "")
  const [yearOfStudy, setYearOfStudy] = useState(profile.yearOfStudy || "")
  const [semester, setSemester] = useState(profile.semester || "")
  const [courses, setCourses] = useState((role === "student" ? profile.courses : profile.courseCodes)?.join(", ") || "")
  const availableAccounts = accounts.filter(account => account.role === role || !account.role || account.uid === profile.uid)
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const courseCodes = courses.split(",").map(value => value.trim()).filter(Boolean)
    onSave({
      uid,
      fullName,
      email,
      ...(role === "student"
        ? { studentId, programme, department, yearOfStudy, semester, courses: courseCodes, status: profile.status || "active" }
        : { department, title, courseCodes }),
    })
  }
  return <form className="management-form" onSubmit={onSubmit}>
    {!profile.uid && <Field label="Existing account"><select required value={uid} onChange={event => { setUid(event.target.value); const selected = availableAccounts.find(account => account.uid === event.target.value); setFullName(selected?.fullName || ""); setEmail(selected?.email || "") }}><option value="">Choose account</option>{availableAccounts.map(account => <option value={account.uid} key={account.uid}>{account.email} · {account.uid.slice(0, 8)}</option>)}</select></Field>}
    <Field label="Full name"><input required minLength={2} value={fullName} onChange={event => setFullName(event.target.value)}/></Field>
    <Field label="University email"><input required type="email" value={email} onChange={event => setEmail(event.target.value)}/></Field>
    {role === "student" ? <>
      <Field label="Student ID"><input required pattern="\d{6}" maxLength={6} value={studentId} onChange={event => setStudentId(event.target.value)}/></Field>
      <Field label="Programme"><input value={programme} onChange={event => setProgramme(event.target.value)}/></Field>
      <Field label="Department"><input value={department} onChange={event => setDepartment(event.target.value)}/></Field>
      <Field label="Year of study"><input value={yearOfStudy} onChange={event => setYearOfStudy(event.target.value)}/></Field>
      <Field label="Semester"><input value={semester} onChange={event => setSemester(event.target.value)}/></Field>
      <Field label="Course codes (up to 5, comma separated)"><input value={courses} onChange={event => setCourses(event.target.value)}/></Field>
    </> : <>
      <Field label="Title"><input value={title} onChange={event => setTitle(event.target.value)}/></Field>
      <Field label="Department"><input value={department} onChange={event => setDepartment(event.target.value)}/></Field>
      <Field label="Course codes (comma separated)"><input value={courses} onChange={event => setCourses(event.target.value)}/></Field>
    </>}
    <div className="management-form-actions"><button className="btn btn-primary" disabled={busy || (!profile.uid && !uid)}>{busy ? "Saving…" : "Save profile"}</button><button className="btn btn-secondary" type="button" onClick={onCancel}>Cancel</button></div>
  </form>
}

function ClassForm({ item, lecturers, students, busy, onCancel, onSave }: {
  item: ClassRecord
  lecturers: ProfileRecord[]
  students: ProfileRecord[]
  busy: boolean
  onCancel: () => void
  onSave: (values: Omit<ClassRecord, "id" | "students">) => void
}) {
  const [values, setValues] = useState({ classCode: item.classCode, title: item.title, courseCode: item.courseCode, programme: item.programme, academicYear: item.academicYear, semester: item.semester, lecturerUid: item.lecturerUid, studentUids: item.studentUids })
  const set = (key: Exclude<keyof typeof values, "studentUids">, value: string) => setValues(current => ({ ...current, [key]: value }))
  return <form className="management-form" onSubmit={event => { event.preventDefault(); onSave(values) }}>
    <Field label="Class code"><input required value={values.classCode} onChange={event => set("classCode", event.target.value)}/></Field>
    <Field label="Class title"><input required value={values.title} onChange={event => set("title", event.target.value)}/></Field>
    <Field label="Course code"><input required value={values.courseCode} onChange={event => set("courseCode", event.target.value)}/></Field>
    <Field label="Programme"><input required value={values.programme} onChange={event => set("programme", event.target.value)}/></Field>
    <Field label="Academic year"><input required placeholder="2026/2027" value={values.academicYear} onChange={event => set("academicYear", event.target.value)}/></Field>
    <Field label="Semester"><input required value={values.semester} onChange={event => set("semester", event.target.value)}/></Field>
    <Field label="Assigned lecturer"><select required value={values.lecturerUid} onChange={event => set("lecturerUid", event.target.value)}><option value="">Choose lecturer</option>{lecturers.map(lecturer => <option key={lecturer.uid} value={lecturer.uid}>{lecturer.fullName} · {lecturer.email}</option>)}</select></Field>
    <Field label={`Students in class (${values.studentUids.length} selected)`}><div className="management-student-picker">{students.map(student => <label key={student.uid}><input type="checkbox" checked={values.studentUids.includes(student.uid)} onChange={event => setValues(current => ({ ...current, studentUids: event.target.checked ? [...current.studentUids, student.uid] : current.studentUids.filter(uid => uid !== student.uid) }))}/><span>{student.fullName || student.email}<small>{student.studentId || student.email}</small></span></label>)}{students.length === 0 && <small>No student profiles are available yet.</small>}</div></Field>
    <div className="management-form-actions"><button className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : "Save class assignment"}</button><button className="btn btn-secondary" type="button" onClick={onCancel}>Cancel</button></div>
  </form>
}

function TimetableForm({ item, lecturers, classes, busy, onCancel, onSave }: {
  item: TimetableRecord
  lecturers: ProfileRecord[]
  classes: ClassRecord[]
  busy: boolean
  onCancel: () => void
  onSave: (values: Omit<TimetableRecord, "id">) => void
}) {
  const [values, setValues] = useState({ title: item.title, classId: item.classId || "", courseCode: item.courseCode, lecturerUid: item.lecturerUid, dayOfWeek: item.dayOfWeek || "Monday", startTime: item.startTime, endTime: item.endTime, location: item.location })
  const set = (key: keyof typeof values, value: string) => setValues(current => ({ ...current, [key]: value }))
  return <form className="management-form" onSubmit={event => { event.preventDefault(); onSave(values) }}>
    <Field label="Entry title"><input required value={values.title} onChange={event => set("title", event.target.value)}/></Field>
    <Field label="Class"><select required value={values.classId} onChange={event => { const selected = classes.find(item => item.id === event.target.value); set("classId", event.target.value); if (selected) { set("courseCode", selected.courseCode); set("lecturerUid", selected.lecturerUid) } }}><option value="">Choose assigned class</option>{classes.map(item => <option value={item.id} key={item.id}>{item.classCode} · {item.title}</option>)}</select></Field>
    <Field label="Course code"><input required value={values.courseCode} onChange={event => set("courseCode", event.target.value)}/></Field>
    <Field label="Lecturer"><select required value={values.lecturerUid} onChange={event => set("lecturerUid", event.target.value)}><option value="">Choose lecturer</option>{lecturers.map(lecturer => <option key={lecturer.uid} value={lecturer.uid}>{lecturer.fullName}</option>)}</select></Field>
    <Field label="Day"><select value={values.dayOfWeek} onChange={event => set("dayOfWeek", event.target.value)}>{["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => <option key={day}>{day}</option>)}</select></Field>
    <Field label="Start time"><input required type="time" value={values.startTime} onChange={event => set("startTime", event.target.value)}/></Field>
    <Field label="End time"><input required type="time" value={values.endTime} onChange={event => set("endTime", event.target.value)}/></Field>
    <Field label="Location"><input required value={values.location} onChange={event => set("location", event.target.value)}/></Field>
    <div className="management-form-actions"><button className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : "Save timetable entry"}</button><button className="btn btn-secondary" type="button" onClick={onCancel}>Cancel</button></div>
  </form>
}

function CourseForm({ item, busy, onCancel, onSave }: {
  item: CourseRecord
  busy: boolean
  onCancel: () => void
  onSave: (values: Omit<CourseRecord, "id">) => void
}) {
  const [values, setValues] = useState({ code: item.code, title: item.title, programme: item.programme, department: item.department || "", semester: item.semester || "", credits: item.credits, description: item.description || "" })
  const set = (key: keyof typeof values, value: string) => setValues(current => ({ ...current, [key]: key === "credits" ? Number(value) : value }))
  return <form className="management-form" onSubmit={event => { event.preventDefault(); onSave(values) }}>
    <Field label="Course code"><input required disabled={Boolean(item.id)} value={values.code} onChange={event => set("code", event.target.value.toUpperCase())}/></Field>
    <Field label="Course title"><input required value={values.title} onChange={event => set("title", event.target.value)}/></Field>
    <Field label="Programme"><input required value={values.programme} onChange={event => set("programme", event.target.value)}/></Field>
    <Field label="Department"><input value={values.department} onChange={event => set("department", event.target.value)}/></Field>
    <Field label="Semester"><input value={values.semester} onChange={event => set("semester", event.target.value)}/></Field>
    <Field label="Credits"><input required type="number" min={1} max={30} value={values.credits} onChange={event => set("credits", event.target.value)}/></Field>
    <Field label="Description"><textarea value={values.description} onChange={event => set("description", event.target.value)}/></Field>
    <div className="management-form-actions"><button className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : "Save course"}</button><button className="btn btn-secondary" type="button" onClick={onCancel}>Cancel</button></div>
  </form>
}

function RoleRow({ account, busy, onSave }: { account: ProfileRecord; busy: boolean; onSave: (role: string) => void }) {
  const [role, setRole] = useState(account.role || "student")
  return <article className="management-row">
    <div className="management-row-main"><strong>{account.fullName || account.email}</strong><span>{account.email}</span><small>{account.uid}</small></div>
    <select aria-label={`Role for ${account.email}`} value={role} onChange={event => setRole(event.target.value)}><option value="student">Student</option><option value="lecturer">Lecturer</option><option value="admin">Administrator</option></select>
    <button className="btn btn-secondary" disabled={busy || role === account.role} onClick={() => onSave(role)}>Update role</button>
  </article>
}

function ClassList({ classes }: { classes: ClassRecord[] }) {
  return <div className="management-list">
    {classes.map(item => <article className="management-class" key={item.id}>
      <div className="management-row-main"><strong>{item.title} · {item.classCode}</strong><span>{item.courseCode} · {item.programme}</span><small>{item.academicYear} · {item.semester}</small></div>
      <PeopleList people={item.students || []} empty={`${item.studentUids.length} student account(s) assigned`}/>
    </article>)}
    {classes.length === 0 && <p className="management-empty">No classes are currently assigned to your account.</p>}
  </div>
}

function PeopleList({ people, empty }: { people: ProfileRecord[]; empty: string }) {
  if (!people.length) return <p className="management-empty">{empty}</p>
  return <div className="management-people">{people.map(person => <div key={person.uid}><strong>{person.fullName || "Student"}</strong><span>{person.studentId || person.email}</span><small>{person.programme || person.department || ""}</small></div>)}</div>
}

function TimetableList({ timetables, lecturers, onEdit, onDelete }: {
  timetables: TimetableRecord[]
  lecturers: ProfileRecord[]
  onEdit?: (item: TimetableRecord) => void
  onDelete?: (item: TimetableRecord) => void
}) {
  const ordered = [...timetables].sort((a, b) => a.dayOfWeek.localeCompare(b.dayOfWeek) || a.startTime.localeCompare(b.startTime))
  return <div className="management-list">
    {ordered.map(item => <article className="management-row" key={item.id}>
      <div className="management-row-main"><strong>{item.title} · {item.courseCode}</strong><span>{item.dayOfWeek}, {item.startTime}–{item.endTime} · {item.location}</span><small>{lecturers.find(lecturer => lecturer.uid === item.lecturerUid)?.fullName || "Assigned lecturer"}{item.classId ? ` · Class ${item.classId}` : ""}</small></div>
      {onDelete && <div className="management-row-actions"><button className="btn btn-secondary" onClick={() => onEdit?.(item)}>Edit</button><button className="btn btn-danger" onClick={() => onDelete(item)}>Delete</button></div>}
    </article>)}
    {ordered.length === 0 && <p className="management-empty">No timetable entries are available.</p>}
  </div>
}
