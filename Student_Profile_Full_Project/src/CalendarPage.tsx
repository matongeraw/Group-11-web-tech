import { useEffect, useMemo, useState } from "react"
import type { User } from "firebase/auth"
import { managementRequest } from "./management-api"

type EventCategory = "University Event" | "National Holiday" | "Academic"
type CalendarEvent = {
  id: string
  title: string
  description: string
  date: string
  startTime?: string
  endTime?: string
  location: string
  category: EventCategory
  approval: string
  organizer: string
  instructions: string
  demo?: boolean
}
type ApiEvent = {
  id: string
  title: string
  description: string
  date: string
  startTime?: string
  endTime?: string
  location: string
  category: "institution" | "academic"
  status: "pending" | "approved" | "rejected"
  organizer: string
  instructions?: string
}
type PublicHoliday = { date: string; localName: string; name: string }

const demoEvent = (year: number, month: number): CalendarEvent[] => [
  {
    id: `demo-workshop-${year}-${month}`,
    title: "Sample Academic Workshop",
    description: "A fictional calendar example used to demonstrate event details and interactions.",
    date: `${year}-${String(month + 1).padStart(2, "0")}-08`,
    startTime: "10:00",
    endTime: "12:00",
    location: "Example Learning Centre",
    category: "University Event",
    approval: "Fictional sample · not approved",
    organizer: "Prototype data",
    instructions: "This sample is not a real university event. Confirm event information through official university channels.",
    demo: true,
  },
  {
    id: `demo-deadline-${year}-${month}`,
    title: "Sample Assignment Deadline",
    description: "A fictional academic deadline illustrating how course events appear in the calendar.",
    date: `${year}-${String(month + 1).padStart(2, "0")}-18`,
    endTime: "23:59",
    location: "Learning Portal",
    category: "Academic",
    approval: "Fictional sample · unverified",
    organizer: "Prototype data",
    instructions: "This sample date and course information are fictional. Check the learning portal for verified deadlines.",
    demo: true,
  },
]

function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

function isPublicHoliday(value: unknown): value is PublicHoliday {
  if (typeof value !== "object" || value === null) return false
  if (!("date" in value) || !("localName" in value) || !("name" in value)) return false
  return typeof value.date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value.date) &&
    typeof value.localName === "string" &&
    typeof value.name === "string"
}

function eventTone(event: CalendarEvent) {
  if (event.category === "National Holiday") return "holiday"
  if (event.demo && event.category === "University Event") return "pending"
  return event.category === "University Event" ? "institution" : "academic"
}

function dateLabel(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export default function CalendarPage({ user }: { user: User | null }) {
  const today = new Date()
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDate, setSelectedDate] = useState(localDateKey(today))
  const [hoveredDate, setHoveredDate] = useState<string | null>(null)
  const [detail, setDetail] = useState<CalendarEvent | null>(null)
  const [apiEvents, setApiEvents] = useState<ApiEvent[]>([])
  const [eventsLoaded, setEventsLoaded] = useState(false)
  const [eventsRefresh, setEventsRefresh] = useState(0)
  const [eventError, setEventError] = useState("")
  const [holidays, setHolidays] = useState<CalendarEvent[]>([])
  const [holidayError, setHolidayError] = useState("")
  const [holidayLoading, setHolidayLoading] = useState(false)
  const [holidayRetry, setHolidayRetry] = useState(0)
  const year = viewDate.getFullYear()
  const monthIndex = viewDate.getMonth()
  const monthName = viewDate.toLocaleString("en-GB", { month: "long" })

  useEffect(() => {
    let active = true
    setEventsLoaded(false)
    setEventError("")
    if (!user) {
      setEventError("Sign in to load institution-approved events.")
      setEventsLoaded(true)
      return
    }
    managementRequest<{ events: ApiEvent[] }>(user, "/events")
      .then(result => {
        if (active) setApiEvents(result.events)
      })
      .catch(error => {
        if (active) setEventError(error instanceof Error ? error.message : "Could not load university events.")
      })
      .finally(() => {
        if (active) setEventsLoaded(true)
      })
    return () => { active = false }
  }, [user, eventsRefresh])

  useEffect(() => {
    const timer = window.setInterval(() => setEventsRefresh(value => value + 1), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    setHolidayLoading(true)
    setHolidayError("")
    setHolidays([])
    fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/ZW`, { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error(`Zimbabwe public holidays could not be loaded (${response.status}).`)
        return await response.json() as unknown
      })
      .then(records => {
        if (!Array.isArray(records) || !records.every(isPublicHoliday)) throw new Error("The public holiday service returned invalid data.")
        setHolidays(records.map((holiday, index) => ({
          id: `zw-holiday-${year}-${index}`,
          title: holiday.localName || holiday.name,
          description: `${holiday.name || holiday.localName} is listed as a Zimbabwe public holiday.`,
          date: holiday.date,
          location: "Zimbabwe",
          category: "National Holiday",
          approval: "Public holiday · Nager.Date",
          organizer: "Nager.Date public holiday data",
          instructions: "Confirm university opening and service arrangements through official institutional notices.",
        })))
      })
      .catch(error => {
        if (error instanceof DOMException && error.name === "AbortError") return
        setHolidayError(error instanceof Error ? error.message : "Could not load Zimbabwe public holidays.")
      })
      .finally(() => {
        if (!controller.signal.aborted) setHolidayLoading(false)
      })
    return () => controller.abort()
  }, [year, holidayRetry])

  useEffect(() => {
    if (!detail) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDetail(null)
    }
    window.addEventListener("keydown", closeOnEscape)
    return () => window.removeEventListener("keydown", closeOnEscape)
  }, [detail])

  const institutionEvents = useMemo<CalendarEvent[]>(() => {
    if (!eventsLoaded || eventError || apiEvents.length === 0) return []
    return apiEvents.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location,
      category: event.category === "institution" ? "University Event" : "Academic",
      approval: "Approved by the institution",
      organizer: event.organizer,
      instructions: event.instructions || "Follow instructions from the event organizer.",
    }))
  }, [apiEvents, eventError, eventsLoaded])

  const demoEvents = useMemo(
    () => eventsLoaded && !eventError && apiEvents.length === 0 ? demoEvent(year, monthIndex) : [],
    [apiEvents.length, eventError, eventsLoaded, monthIndex, year],
  )
  const monthEvents = useMemo(
    () => [...institutionEvents, ...demoEvents, ...holidays].filter(event => event.date.startsWith(`${year}-${String(monthIndex + 1).padStart(2, "0")}`)),
    [demoEvents, holidays, institutionEvents, monthIndex, year],
  )
  const eventsByDate = useMemo(() => monthEvents.reduce<Record<string, CalendarEvent[]>>((result, event) => {
    result[event.date] = [...(result[event.date] || []), event]
    return result
  }, {}), [monthEvents])
  const selectedEvents = eventsByDate[selectedDate] || []
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const firstDay = (new Date(year, monthIndex, 1).getDay() + 6) % 7
  const days = Array.from({ length: daysInMonth }, (_, index) => index + 1)

  const changeMonth = (delta: number) => {
    const next = new Date(year, monthIndex + delta, 1)
    setViewDate(next)
    setSelectedDate(localDateKey(next))
    setHoveredDate(null)
  }
  const goToday = () => {
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1))
    setSelectedDate(localDateKey(today))
    setHoveredDate(null)
  }
  const showEvent = (event: CalendarEvent) => setDetail(event)
  const formattedMonth = `${monthName} ${year}`

  return (
    <div className="page-stack">
      <div className="page-head">
        <div>
          <h1>Course Calendar</h1>
          <p>Student Profile → Courses → Calendar</p>
        </div>
        <div className="head-actions"><button className="today-button" disabled={!eventsLoaded} onClick={() => setEventsRefresh(value => value + 1)}>Refresh events</button><button className="today-button" onClick={goToday}>Today</button></div>
      </div>

      <div className="calendar-source-note" role="note">
        <p>University events are loaded from approved institutional records. Zimbabwe public holidays are retrieved for the selected year from Nager.Date. Sample events, when shown, are fictional and unverified.</p>
      </div>
      {eventError && <div className="management-alert" role="alert">University events are unavailable: {eventError}</div>}
      {holidayError && <div className="management-alert" role="alert">{holidayError} <button className="text-link" onClick={() => setHolidayRetry(value => value + 1)}>Retry</button></div>}

      <div className="event-legend" aria-label="Calendar event legend">
        <span><i className="institution"/>Approved university event</span>
        <span><i className="pending"/>Fictional sample</span>
        <span><i className="holiday"/>Zimbabwe public holiday</span>
        <span><i className="academic"/>Academic event</span>
        <span><i className="today"/>Today</span>
      </div>

      <div className="calendar-layout">
        <section className="card calendar-card interactive-calendar">
          <div className="calendar-head">
            <button onClick={() => changeMonth(-1)} aria-label="Previous month">‹</button>
            <div><h2>{formattedMonth}</h2><p>{holidayLoading ? "Loading public holidays…" : `${monthEvents.length} event${monthEvents.length === 1 ? "" : "s"} scheduled`}</p></div>
            <button onClick={() => changeMonth(1)} aria-label="Next month">›</button>
          </div>
          <div className="calendar-weekdays" aria-hidden="true">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => <span key={day}>{day}</span>)}</div>
          <div className="calendar-days">
            {Array.from({ length: firstDay }, (_, index) => <span key={`blank-${index}`}/>)}
            {days.map(day => {
              const date = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
              const events = eventsByDate[date] || []
              const isToday = date === localDateKey(today)
              return <button
                type="button"
                key={date}
                className={`${selectedDate === date ? "selected" : ""} ${events.length ? "has-event" : ""} ${isToday ? "current-day" : ""}`}
                onClick={() => { setSelectedDate(date); if (events.length) showEvent(events[0]) }}
                onMouseEnter={() => events.length > 0 && setHoveredDate(date)}
                onMouseLeave={() => setHoveredDate(null)}
                onFocus={() => events.length > 0 && setHoveredDate(date)}
                onBlur={() => setHoveredDate(null)}
                aria-label={`${dateLabel(date)}${events.length ? `, ${events.length} event${events.length === 1 ? "" : "s"}` : ""}`}
                aria-haspopup={events.length > 0 ? "dialog" : undefined}
              >
                <b>{day}</b>
                {events.length > 0 && <div className="event-dots">{Array.from(new Set(events.map(eventTone))).slice(0, 4).map(tone => <i className={tone} key={tone}/>)}</div>}
                {hoveredDate === date && events.length > 0 && <div className="calendar-tooltip" role="tooltip">
                  <strong>{events.length === 1 ? events[0].title : `${events.length} events scheduled`}</strong>
                  {events.length === 1 ? <><span>{events[0].category} · {events[0].approval}</span><p>{events[0].description}</p></> : <ul>{events.slice(0, 3).map(event => <li key={event.id}>{event.title}</li>)}</ul>}
                </div>}
              </button>
            })}
          </div>
        </section>

        <section className="card day-agenda">
          <div className="section-head"><div><h2>{dateLabel(selectedDate)}</h2><p>{selectedEvents.length ? `${selectedEvents.length} scheduled event${selectedEvents.length === 1 ? "" : "s"}` : "No scheduled events"}</p></div></div>
          {selectedEvents.length ? selectedEvents.map(event => <button className="agenda-event" key={event.id} onClick={() => showEvent(event)}>
            <span className={`event-symbol ${eventTone(event)}`}/>
            <div><strong>{event.title}</strong><small>{event.startTime ? `${event.startTime}${event.endTime ? `–${event.endTime}` : ""} · ` : ""}{event.category}</small><small>{event.approval}</small></div>
            <span aria-hidden="true">›</span>
          </button>) : <div className="agenda-empty"><p>No academic, institutional, or national events are scheduled for this date.</p></div>}
          {eventsLoaded && !eventError && demoEvents.length > 0 && <p className="management-empty">The entries marked as samples are fictional, for demonstration only, and have not been verified by the university.</p>}
          {holidayLoading && <p className="management-empty">Loading official public holiday data…</p>}
        </section>
      </div>

      {detail && <div className="modal-scrim" onMouseDown={() => setDetail(null)}>
        <section className="modal event-modal" role="dialog" aria-modal="true" aria-labelledby="event-detail-title" onMouseDown={event => event.stopPropagation()}>
          <button className="modal-close" onClick={() => setDetail(null)} aria-label="Close event details">×</button>
          <span className={`event-modal-icon ${eventTone(detail)}`}/>
          <span className="eyebrow">{detail.category}</span>
          <h2 id="event-detail-title">{detail.title}</h2>
          <p className="event-description">{detail.description}</p>
          {detail.demo && <div className="management-alert">Fictional prototype data · not verified or approved by the university.</div>}
          <dl className="event-details">
            <div><dt>Date</dt><dd>{dateLabel(detail.date)}</dd></div>
            <div><dt>Time</dt><dd>{detail.startTime || detail.endTime ? `${detail.startTime || "Not set"}${detail.endTime ? `–${detail.endTime}` : ""}` : "All day / not specified"}</dd></div>
            <div><dt>Location</dt><dd>{detail.location}</dd></div>
            <div><dt>Approval status</dt><dd>{detail.approval}</dd></div>
            <div><dt>Organizer</dt><dd>{detail.organizer}</dd></div>
            <div><dt>Additional instructions</dt><dd>{detail.instructions || "No additional instructions provided."}</dd></div>
          </dl>
        </section>
      </div>}
    </div>
  )
}
