import { useEffect, useState } from "react"
import type { User } from "firebase/auth"
import { managementRequest } from "./management-api"

type TimetableEntry = {
  id: string
  title: string
  classCode: string
  classTitle: string
  courseCode: string
  dayOfWeek: string
  startTime: string
  endTime: string
  location: string
}

const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

export default function StudentTimetable({ user }: { user: User | null }) {
  const [entries, setEntries] = useState<TimetableEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let active = true
    if (!user) {
      setError("Sign in to load your timetable.")
      setLoading(false)
      return
    }
    setLoading(true)
    setError("")
    managementRequest<{ timetables: TimetableEntry[] }>(user, "/student/timetable")
      .then(result => { if (active) setEntries(result.timetables) })
      .catch(reason => { if (active) setError(reason instanceof Error ? reason.message : "Could not load your timetable.") })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [user, refreshKey])

  const sortedEntries = [...entries].sort((a, b) =>
    weekDays.indexOf(a.dayOfWeek) - weekDays.indexOf(b.dayOfWeek) ||
    a.startTime.localeCompare(b.startTime),
  )

  return (
    <div className="page-stack">
      <div className="page-head"><div><h1>My Timetable</h1><p>Your schedule for assigned classes</p></div><button className="today-button" disabled={loading} onClick={() => setRefreshKey(value => value + 1)}>Refresh</button></div>
      {error && <div className="management-alert" role="alert">{error}</div>}
      <section className="card">
        <div className="section-head"><div><h2>Weekly class timetable</h2><p>Only timetable entries for your enrolled classes are shown.</p></div></div>
        {loading ? <p className="management-empty">Loading your timetable…</p> : sortedEntries.length === 0 ? <p className="management-empty">No timetable entries are available for your assigned classes yet. Check with your department if you expected a schedule.</p> : <div className="management-list">
          {sortedEntries.map(entry => <article className="management-row" key={entry.id}>
            <div className="management-row-main"><strong>{entry.dayOfWeek} · {entry.startTime}–{entry.endTime}</strong><span>{entry.title} · {entry.courseCode}</span><small>{entry.classCode} · {entry.classTitle} · {entry.location}</small></div>
          </article>)}
        </div>}
      </section>
    </div>
  )
}
