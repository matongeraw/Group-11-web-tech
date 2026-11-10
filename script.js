/**
 * Africa University Student & Faculty Portal
 * Matching Figma Make Prototype Interaction
 */

let currentRole = 'student';

document.addEventListener('DOMContentLoaded', () => {
  const navButtons = document.querySelectorAll('.nav-btn, .nav-sub');
  const views = document.querySelectorAll('.screen-view');
  const headerTitle = document.getElementById('header-title');
  const sidebar = document.getElementById('app-sidebar');
  const menuBtnOpen = document.getElementById('menu-btn-open');
  const sideCloseBtn = document.getElementById('side-close-btn');

  const routeTitles = {
    // Student Routes
    overview: 'Overview',
    'personal-academic': 'Personal & Academic',
    courses: 'Courses',
    calendar: 'Calendar',
    examination: 'Examination',
    'academic-progress': 'Academic Progress',
    'skills-activities': 'Skills & Activities',
    achievements: 'Achievements',
    'my-cv': 'My CV',
    projects: 'Projects',
    contact: 'Contact',

    // Lecturer / Faculty Routes
    'faculty-dashboard': 'Faculty Dashboard',
    'verification-queue': 'Verification Queue',
    'reference-requests': 'Reference Requests',
    'faculty-modules': 'My Taught Modules',
    'supervised-students': 'Supervised Students',

    // Administrator Routes
    'admin-dashboard': 'Registry Dashboard',
    'admin-transcripts': 'Official Transcripts',
    'admin-id-validation': 'Student ID Validation',
    'admin-verifiers': 'Verifier Governance'
  };

  const studentRoutes = ['overview', 'personal-academic', 'courses', 'calendar', 'examination', 'academic-progress', 'skills-activities', 'achievements', 'my-cv', 'projects', 'contact'];
  const lecturerRoutes = ['faculty-dashboard', 'verification-queue', 'reference-requests', 'faculty-modules', 'supervised-students'];
  const adminRoutes = ['admin-dashboard', 'admin-transcripts', 'admin-id-validation', 'admin-verifiers'];

  let activeRoute = '';
  const courseMenu = document.getElementById('course-submenu');
  const courseButton = document.querySelector('.course-nav-group > .nav-btn');
  const achievementsMenu = document.getElementById('achievements-submenu');
  const achievementsButton = document.querySelector('.achievements-nav-group > .nav-btn');

  window.navigate = function(route) {
    // Validate route or assign default based on current role
    if (currentRole === 'lecturer') {
      if (!lecturerRoutes.includes(route)) {
        if (studentRoutes.includes(route)) {
          showToast('Access restricted per Workshop Section 4.6 (Need-to-Know Privacy).');
        }
        route = 'faculty-dashboard';
      }
    } else if (currentRole === 'admin') {
      if (!adminRoutes.includes(route)) {
        if (studentRoutes.includes(route)) {
          showToast('Restricted: Academic Registry administrative console.');
        }
        route = 'admin-dashboard';
      }
    } else {
      // Student role
      if (!studentRoutes.includes(route)) {
        route = 'overview';
      }
    }

    // Update active nav button
    document.querySelectorAll('.nav-btn, .nav-sub').forEach(btn => {
      const btnRoute = btn.getAttribute('data-route');
      if (
        btnRoute === route ||
        (btnRoute === 'courses' && ['calendar', 'examination'].includes(route)) ||
        (btnRoute === 'achievements' && route === 'my-cv')
      ) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    if (courseMenu && courseButton) {
      const isCourseChild = ['calendar', 'examination'].includes(route);
      if (isCourseChild || (route === 'courses' && activeRoute !== 'courses')) {
        courseMenu.classList.add('open');
      } else if (route !== 'courses') {
        courseMenu.classList.remove('open');
      }
      courseButton.setAttribute('aria-expanded', String(courseMenu.classList.contains('open')));
    }

    if (achievementsMenu && achievementsButton) {
      const isAchievementsChild = route === 'my-cv';
      if (isAchievementsChild || (route === 'achievements' && activeRoute !== 'achievements')) {
        achievementsMenu.classList.add('open');
      } else if (route !== 'achievements') {
        achievementsMenu.classList.remove('open');
      }
      achievementsButton.setAttribute('aria-expanded', String(achievementsMenu.classList.contains('open')));
    }

    // Update active view (Strict single-view display)
    document.querySelectorAll('.screen-view').forEach(v => {
      if (v.id === `view-${route}`) {
        v.classList.add('active');
      } else {
        v.classList.remove('active');
      }
    });

    // Update header title
    if (headerTitle && routeTitles[route]) {
      headerTitle.textContent = routeTitles[route];
    }

    activeRoute = route;

    // Close mobile sidebar if open
    if (sidebar && route !== 'courses' && route !== 'achievements') sidebar.classList.remove('open');

    // Update URL hash
    window.location.hash = `#/${route}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  document.querySelectorAll('.nav-btn, .nav-sub').forEach(btn => {
    btn.addEventListener('click', () => {
      const route = btn.getAttribute('data-route');
      if (!route) return;
      if (route === 'courses' && activeRoute === 'courses' && courseMenu) {
        courseMenu.classList.toggle('open');
        if (courseButton) courseButton.setAttribute('aria-expanded', String(courseMenu.classList.contains('open')));
        return;
      }
      if (route === 'achievements' && activeRoute === 'achievements' && achievementsMenu) {
        achievementsMenu.classList.toggle('open');
        if (achievementsButton) achievementsButton.setAttribute('aria-expanded', String(achievementsMenu.classList.contains('open')));
        return;
      }
      navigate(route);
    });
  });

  const calendarDays = document.getElementById('calendar-days');
  const calendarMonth = document.getElementById('calendar-month');
  const calendarEventCount = document.getElementById('calendar-event-count');
  const agendaDate = document.getElementById('agenda-date');
  const agendaCount = document.getElementById('agenda-count');
  const agendaList = document.getElementById('agenda-list');
  const holidaySourceStatus = document.getElementById('holiday-source-status');
  const calendarTooltip = document.getElementById('calendar-tooltip');
  const eventModal = document.getElementById('calendar-event-modal');
  const eventDialog = eventModal?.querySelector('.calendar-event-dialog');
  const eventDialogTitle = document.getElementById('calendar-event-dialog-title');
  const eventDetails = document.getElementById('calendar-event-details');

  if (calendarDays && calendarMonth && calendarEventCount && agendaDate && agendaCount && agendaList && holidaySourceStatus && calendarTooltip && eventModal && eventDialog && eventDialogTitle && eventDetails) {
    const prototypeEvents = [
      { id: 'wts-project', title: 'WTS201 Project Submission', description: 'Final submission deadline for the Web Technologies project. Submit the project archive and repository link before the portal closes.', date: '2026-11-03', startTime: 'Not specified', endTime: '23:59', location: 'Learning Portal', category: 'academic', approvalStatus: 'Not applicable', organizer: 'Computing & Technology Department', instructions: 'Submit the project archive and repository link before the portal closes.' },
      { id: 'ai-workshop', title: 'Responsible AI Workshop', description: 'A proposed academic workshop exploring responsible and inclusive uses of artificial intelligence. This is a fictional prototype event and has not been verified or approved by the university.', date: '2026-11-07', startTime: '10:00', endTime: '13:00', location: 'Innovation Hub', category: 'pending', approvalStatus: 'Proposed — fictional prototype; institutional approval not verified', organizer: 'Computing & Technology Department (prototype)', instructions: 'Registration and event details are not confirmed. Check official university announcements before making plans.' },
      { id: 'wts-exam', title: 'Web Technologies Examination', description: 'Final examination for Web Technologies (WTS201). This timetable entry is fictional prototype data and must be confirmed with the Academic Registry.', date: '2026-11-10', startTime: '09:00', endTime: '12:00', location: 'Great Hall', category: 'academic', approvalStatus: 'Prototype timetable — verify with Academic Registry', organizer: 'Academic Registry (prototype)', instructions: 'Arrive 30 minutes early with your student ID and approved stationery.' },
      { id: 'sta-exam', title: 'Applied Statistics Examination', description: 'Final examination for Applied Statistics (STA201). This timetable entry is fictional prototype data and must be confirmed with the Academic Registry.', date: '2026-11-12', startTime: '14:00', endTime: '17:00', location: 'New Building 14', category: 'academic', approvalStatus: 'Prototype timetable — verify with Academic Registry', organizer: 'Academic Registry (prototype)', instructions: 'A non-programmable calculator is permitted. Arrive 30 minutes early.' },
      { id: 'sports-day', title: 'University Sports Day', description: 'A proposed day featuring athletics, team sports, wellness activities, and student participation. This is a fictional prototype event; university approval and arrangements have not been verified.', date: '2026-11-14', startTime: '08:00', endTime: '16:00', location: 'University Sports Grounds (prototype)', category: 'pending', approvalStatus: 'Proposed — fictional prototype; institutional approval not verified', organizer: 'University Sports Office (prototype)', instructions: 'Date, venue, registration, and participation requirements are not confirmed. Follow official university announcements.' },
      { id: 'cis-exam', title: 'Mobile Applications Examination', description: 'Final practical examination for Mobile Applications (CIS202). This timetable entry is fictional prototype data and must be confirmed with the Academic Registry.', date: '2026-11-15', startTime: '09:00', endTime: '12:00', location: 'ICT Lab 2', category: 'academic', approvalStatus: 'Prototype timetable — verify with Academic Registry', organizer: 'Academic Registry (prototype)', instructions: 'Use your assigned laboratory workstation and arrive 30 minutes early.' },
      { id: 'robotics-showcase', title: 'Student Robotics Showcase', description: 'A proposed exhibition of student robotics projects. Event details remain subject to institutional approval; this is fictional prototype data.', date: '2026-11-20', startTime: '13:00', endTime: '16:00', location: 'Innovation Hub (proposed)', category: 'pending', approvalStatus: 'Pending — fictional prototype; institutional approval not verified', organizer: 'Developer Student Club (prototype)', instructions: 'Do not make travel or participation arrangements until approval is confirmed through official university channels.' },
      { id: 'unity-day-gathering', title: 'Campus Community Gathering', description: 'A proposed campus gathering shown alongside the public holiday to demonstrate how multiple entries on one date are displayed. This fictional prototype event is not institutionally verified.', date: '2026-12-22', startTime: '10:00', endTime: '12:00', location: 'Main Campus (proposed)', category: 'pending', approvalStatus: 'Proposed — fictional prototype; institutional approval not verified', organizer: 'Student Affairs (prototype)', instructions: 'This prototype listing is not a confirmed event. Confirm university opening hours and arrangements before attending.' },
      { id: 'orientation-2027', title: 'New Student Orientation', description: 'A proposed orientation introducing new students to academic services, campus life, and university policies. This is fictional prototype data and has not been confirmed by the institution.', date: '2027-01-12', startTime: '08:30', endTime: '15:30', location: 'Main Auditorium (proposed)', category: 'pending', approvalStatus: 'Proposed — fictional prototype; institutional approval not verified', organizer: 'Student Affairs (prototype)', instructions: 'Date, venue, and required registration documents must be confirmed through official university channels.' }
    ];
    const holidayCache = new Map();
    let calendarDate = new Date(2026, 10, 1);
    let selectedDate = '2026-11-14';
    let holidayRequestId = 0;
    let tooltipTimer;
    let modalOpenerDate = null;

    const dateKey = (year, month, day) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const parseDate = date => {
      const [year, month, day] = date.split('-').map(Number);
      return new Date(year, month - 1, day);
    };
    const categoryLabel = category => ({
      institution: 'Institution-approved event',
      pending: 'Proposed / pending university event',
      academic: 'Academic event',
      holiday: 'Zimbabwe public holiday'
    }[category] || 'Calendar event');
    const eventsForDate = date => [
      ...prototypeEvents.filter(event => event.date === date),
      ...(holidayCache.get(Number(date.slice(0, 4))) || []).filter(event => event.date === date)
    ];
    const monthEvents = year => [
      ...prototypeEvents.filter(event => event.date.startsWith(`${year}-${String(calendarDate.getMonth() + 1).padStart(2, '0')}`)),
      ...(holidayCache.get(year) || []).filter(event => event.date.startsWith(`${year}-${String(calendarDate.getMonth() + 1).padStart(2, '0')}`))
    ];

    const setHolidayStatus = (message, isError = false, retryYear = null) => {
      holidaySourceStatus.replaceChildren();
      holidaySourceStatus.classList.toggle('error', isError);
      holidaySourceStatus.append(document.createTextNode(message));
      if (retryYear !== null) {
        const retry = document.createElement('button');
        retry.type = 'button';
        retry.className = 'holiday-retry';
        retry.textContent = 'Retry';
        retry.addEventListener('click', () => loadHolidays(retryYear, true));
        holidaySourceStatus.append(' ', retry);
      }
    };

    const loadHolidays = async (year, retry = false) => {
      if (!retry && holidayCache.has(year)) {
        setHolidayStatus(`${holidayCache.get(year).length} Zimbabwe public holidays loaded from Nager.Date for ${year}.`);
        return;
      }

      const requestId = ++holidayRequestId;
      setHolidayStatus(`Loading Zimbabwe public holidays for ${year} from Nager.Date…`);
      try {
        const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/ZW`, {
          headers: { Accept: 'application/json' }
        });
        if (!response.ok) throw new Error(`Holiday source returned HTTP ${response.status}.`);
        const records = await response.json();
        if (!Array.isArray(records)) throw new Error('Holiday source returned an invalid response.');

        const holidays = records.map(record => {
          if (!record || typeof record.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(record.date) || !record.date.startsWith(`${year}-`)) {
            throw new Error('Holiday source returned an invalid date.');
          }
          const title = typeof record.localName === 'string' && record.localName.trim()
            ? record.localName
            : record.name;
          if (typeof title !== 'string' || !title.trim()) throw new Error('Holiday source returned a holiday without a name.');
          return {
            id: `zw-holiday-${record.date}-${title}`,
            title,
            description: `${title} is listed as a Zimbabwe public holiday by Nager.Date. Check current government announcements for official observance and any local arrangements.`,
            date: record.date,
            startTime: 'All day',
            endTime: 'Not specified by the holiday source',
            location: 'Zimbabwe; local arrangements may vary',
            category: 'holiday',
            approvalStatus: 'Listed as a public holiday by Nager.Date; confirm with Zimbabwean authorities',
            organizer: 'Public holiday data: Nager.Date',
            instructions: 'Public holiday dates are provided by a third-party data source and are not an institutional calendar. Verify observance and university opening arrangements with official authorities.'
          };
        });

        holidayCache.set(year, holidays);
        if (requestId !== holidayRequestId || calendarDate.getFullYear() !== year) return;
        setHolidayStatus(`${holidays.length} Zimbabwe public holidays loaded from Nager.Date for ${year}. Verify observance with official authorities.`);
        renderCalendar();
      } catch (error) {
        if (requestId !== holidayRequestId || calendarDate.getFullYear() !== year) return;
        const message = error instanceof Error ? error.message : 'Unknown network error.';
        setHolidayStatus(`Zimbabwe public holidays could not be loaded from Nager.Date: ${message}`, true, year);
        renderCalendar();
      }
    };

    const hideTooltip = () => {
      clearTimeout(tooltipTimer);
      calendarTooltip.hidden = true;
      calendarTooltip.replaceChildren();
    };

    const showTooltip = (events, date, anchor) => {
      clearTimeout(tooltipTimer);
      calendarTooltip.replaceChildren();
      const heading = document.createElement('strong');
      heading.textContent = `${events.length} ${events.length === 1 ? 'event' : 'events'} · ${parseDate(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}`;
      calendarTooltip.append(heading);
      events.slice(0, 2).forEach(event => {
        const item = document.createElement('div');
        item.className = 'calendar-tooltip-event';
        const title = document.createElement('b');
        title.textContent = event.title;
        const category = document.createElement('small');
        category.textContent = categoryLabel(event.category);
        const description = document.createElement('p');
        description.textContent = event.description;
        item.append(title, category, description);
        if (event.approvalStatus && event.category !== 'academic') {
          const status = document.createElement('small');
          status.className = 'calendar-tooltip-status';
          status.textContent = event.approvalStatus;
          item.append(status);
        }
        calendarTooltip.append(item);
      });
      if (events.length > 2) {
        const more = document.createElement('p');
        more.className = 'calendar-tooltip-more';
        more.textContent = `and ${events.length - 2} more scheduled ${events.length - 2 === 1 ? 'event' : 'events'}. Select this date to see all details.`;
        calendarTooltip.append(more);
      } else {
        const hint = document.createElement('p');
        hint.className = 'calendar-tooltip-more';
        hint.textContent = 'Select this date to see full details.';
        calendarTooltip.append(hint);
      }

      calendarTooltip.hidden = false;
      requestAnimationFrame(() => {
        const rect = anchor.getBoundingClientRect();
        const margin = 12;
        const spaceAbove = rect.top - margin * 2;
        const spaceBelow = window.innerHeight - rect.bottom - margin * 2;
        const placeAbove = spaceAbove >= spaceBelow;
        const availableHeight = Math.max(80, Math.min(340, placeAbove ? spaceAbove : spaceBelow));
        calendarTooltip.style.maxHeight = `${availableHeight}px`;
        const tooltipRect = calendarTooltip.getBoundingClientRect();
        const left = Math.min(Math.max(margin, rect.left + rect.width / 2 - tooltipRect.width / 2), window.innerWidth - tooltipRect.width - margin);
        const top = placeAbove
          ? rect.top - tooltipRect.height - margin
          : rect.bottom + margin;
        calendarTooltip.style.left = `${left}px`;
        calendarTooltip.style.top = `${Math.min(Math.max(margin, top), window.innerHeight - tooltipRect.height - margin)}px`;
      });
    };

    const openEventDetails = (events, date) => {
      hideTooltip();
      modalOpenerDate = date;
      eventDetails.replaceChildren();
      eventDialogTitle.textContent = events.length === 1 ? events[0].title : `${events.length} events`;

      events.forEach(event => {
        const article = document.createElement('article');
        article.className = `calendar-event-detail ${event.category}`;
        const title = document.createElement('h3');
        title.textContent = event.title;
        const category = document.createElement('span');
        category.className = `calendar-detail-category ${event.category}`;
        category.textContent = categoryLabel(event.category);
        const description = document.createElement('p');
        description.className = 'calendar-detail-description';
        description.textContent = event.description;
        const details = document.createElement('dl');
        const dateValue = parseDate(event.date);
        const detailRows = [
          ['Date', dateValue.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })],
          ['Start time', event.startTime],
          ['End time', event.endTime],
          ['Venue / location', event.location],
          ['Category', categoryLabel(event.category)]
        ];
        if (event.approvalStatus && event.category !== 'academic') detailRows.push(['Approval / source status', event.approvalStatus]);
        if (event.organizer) detailRows.push(['Organizer', event.organizer]);
        if (event.instructions) detailRows.push(['Instructions', event.instructions]);
        detailRows.forEach(([label, value]) => {
          const row = document.createElement('div');
          const term = document.createElement('dt');
          term.textContent = label;
          const definition = document.createElement('dd');
          definition.textContent = value;
          row.append(term, definition);
          details.append(row);
        });
        article.append(title, category, description, details);
        eventDetails.append(article);
      });

      eventModal.hidden = false;
      eventModal.classList.add('open');
      eventDialog.focus();
    };

    const closeEventDetails = () => {
      if (eventModal.hidden) return;
      eventModal.hidden = true;
      eventModal.classList.remove('open');
      const opener = calendarDays.querySelector(`[data-date="${modalOpenerDate}"]`);
      if (opener) opener.focus();
    };

    const renderAgenda = () => {
      const events = eventsForDate(selectedDate);
      const selected = parseDate(selectedDate);
      agendaDate.textContent = selected.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
      agendaCount.textContent = `${events.length} scheduled ${events.length === 1 ? 'event' : 'events'}`;
      agendaList.replaceChildren();

      if (!events.length) {
        const empty = document.createElement('div');
        empty.className = 'agenda-empty';
        empty.textContent = 'No events scheduled for this day.';
        agendaList.append(empty);
        return;
      }

      events.forEach(event => {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'agenda-item';
        item.setAttribute('aria-label', `${event.title}. Open full event details.`);
        const marker = document.createElement('span');
        marker.className = `event-marker ${event.category}`;
        marker.setAttribute('aria-hidden', 'true');
        const details = document.createElement('div');
        const title = document.createElement('strong');
        title.textContent = event.title;
        const time = document.createElement('small');
        time.textContent = event.startTime === 'All day'
          ? 'All day'
          : `${event.startTime}${event.endTime && event.endTime !== 'Not specified' ? `–${event.endTime}` : ''}`;
        const venue = document.createElement('small');
        venue.textContent = event.location;
        details.append(title, time, venue);
        item.append(marker, details);
        item.addEventListener('click', () => openEventDetails([event], event.date));
        agendaList.append(item);
      });
    };

    const renderCalendar = () => {
      const year = calendarDate.getFullYear();
      const month = calendarDate.getMonth();
      const eventsThisMonth = monthEvents(year);
      const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const today = new Date();
      const todayKey = dateKey(today.getFullYear(), today.getMonth(), today.getDate());

      calendarMonth.textContent = calendarDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
      calendarEventCount.textContent = `${eventsThisMonth.length} events scheduled`;
      calendarDays.replaceChildren();

      for (let blank = 0; blank < firstWeekday; blank += 1) {
        const empty = document.createElement('span');
        empty.setAttribute('role', 'presentation');
        calendarDays.append(empty);
      }

      for (let day = 1; day <= daysInMonth; day += 1) {
        const key = dateKey(year, month, day);
        const dayEvents = eventsForDate(key);
        const button = document.createElement('button');
        button.type = 'button';
        button.setAttribute('role', 'gridcell');
        button.dataset.date = key;
        button.setAttribute('aria-label', `${new Date(year, month, day).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}${dayEvents.length ? `, ${dayEvents.length} scheduled ${dayEvents.length === 1 ? 'event' : 'events'}` : ''}`);
        if (key === selectedDate) button.classList.add('selected');
        if (key === todayKey) button.classList.add('current-day');
        if (dayEvents.length) button.classList.add('has-event');
        if (dayEvents.length) {
          button.setAttribute('aria-describedby', 'calendar-tooltip');
          button.setAttribute('aria-haspopup', 'dialog');
        }

        const number = document.createElement('b');
        number.textContent = day;
        button.append(number);
        if (dayEvents.length) {
          const markers = document.createElement('span');
          markers.className = 'event-dots';
          markers.setAttribute('aria-hidden', 'true');
          [...new Set(dayEvents.map(event => event.category))].forEach(category => {
            const dot = document.createElement('i');
            dot.className = `event-marker ${category}`;
            markers.append(dot);
          });
          if (dayEvents.length > 1) {
            const count = document.createElement('em');
            count.textContent = String(dayEvents.length);
            markers.append(count);
          }
          button.append(markers);
          button.addEventListener('pointerenter', event => {
            if (event.pointerType !== 'touch') showTooltip(dayEvents, key, button);
          });
          button.addEventListener('pointerleave', () => {
            tooltipTimer = setTimeout(() => {
              if (!calendarTooltip.matches(':hover') && !button.matches(':focus-visible')) hideTooltip();
            }, 120);
          });
          button.addEventListener('focus', () => showTooltip(dayEvents, key, button));
        }
        button.addEventListener('click', () => {
          selectedDate = key;
          renderCalendar();
          renderAgenda();
          if (dayEvents.length) openEventDetails(dayEvents, key);
        });
        calendarDays.append(button);
      }

      if (!eventModal.hidden) {
        const refreshedEvents = eventsForDate(modalOpenerDate);
        if (refreshedEvents.length) openEventDetails(refreshedEvents, modalOpenerDate);
      }
    };

    calendarTooltip.addEventListener('pointerenter', () => clearTimeout(tooltipTimer));
    calendarTooltip.addEventListener('pointerleave', hideTooltip);
    calendarTooltip.addEventListener('focusout', event => {
      if (!calendarTooltip.contains(event.relatedTarget)) hideTooltip();
    });
    calendarDays.addEventListener('focusout', event => {
      if (event.target.matches('.has-event') && !calendarTooltip.matches(':hover')) {
        tooltipTimer = setTimeout(() => {
          if (!calendarTooltip.contains(document.activeElement)) hideTooltip();
        }, 120);
      }
    });
    calendarDays.addEventListener('keydown', event => {
      if (event.key === 'Escape') hideTooltip();
    });
    eventModal.addEventListener('click', event => {
      if (event.target === eventModal) closeEventDetails();
    });
    document.getElementById('calendar-event-close')?.addEventListener('click', closeEventDetails);
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        if (!eventModal.hidden) closeEventDetails();
        else hideTooltip();
        return;
      }
      if (event.key === 'Tab' && !eventModal.hidden) {
        const focusable = [...eventDialog.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')];
        if (!focusable.length) {
          event.preventDefault();
          eventDialog.focus();
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === eventDialog)) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });
    window.addEventListener('resize', hideTooltip);
    window.addEventListener('scroll', hideTooltip, true);

    const changeMonth = delta => {
      calendarDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + delta, 1);
      selectedDate = dateKey(calendarDate.getFullYear(), calendarDate.getMonth(), 1);
      hideTooltip();
      renderCalendar();
      loadHolidays(calendarDate.getFullYear());
    };
    document.getElementById('calendar-prev')?.addEventListener('click', () => {
      changeMonth(-1);
    });
    document.getElementById('calendar-next')?.addEventListener('click', () => {
      changeMonth(1);
    });
    document.getElementById('calendar-today')?.addEventListener('click', () => {
      const today = new Date();
      calendarDate = new Date(today.getFullYear(), today.getMonth(), 1);
      selectedDate = dateKey(today.getFullYear(), today.getMonth(), today.getDate());
      hideTooltip();
      renderCalendar();
      loadHolidays(calendarDate.getFullYear());
    });
    renderCalendar();
    renderAgenda();
    loadHolidays(calendarDate.getFullYear());
  }

  // Handle URL hash on load
  function syncHash() {
    const hash = window.location.hash.replace(/^#\/?/, '');
    if (hash && routeTitles[hash]) {
      navigate(hash);
    } else {
      if (currentRole === 'lecturer') navigate('faculty-dashboard');
      else if (currentRole === 'admin') navigate('admin-dashboard');
      else navigate('overview');
    }
  }

  window.addEventListener('hashchange', syncHash);
  syncHash();

  // Mobile menu open / close
  if (menuBtnOpen) {
    menuBtnOpen.addEventListener('click', () => {
      if (sidebar) sidebar.classList.add('open');
    });
  }

  if (sideCloseBtn) {
    sideCloseBtn.addEventListener('click', () => {
      if (sidebar) sidebar.classList.remove('open');
    });
  }

  // Edit Profile Modal
  const editModal = document.getElementById('modal-edit-profile');
  const editTrigger = document.getElementById('btn-edit-profile-trigger');
  const editForm = document.getElementById('edit-profile-form');

  window.openEditModal = function() {
    if (editModal) editModal.style.display = 'grid';
  };

  window.closeEditModal = function() {
    if (editModal) editModal.style.display = 'none';
  };

  if (editTrigger) {
    editTrigger.addEventListener('click', openEditModal);
  }

  if (editModal) {
    editModal.addEventListener('click', (e) => {
      if (e.target === editModal) closeEditModal();
    });
  }

  if (editForm) {
    editForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('input-edit-name').value;
      const prog = document.getElementById('input-edit-programme').value;
      const id = document.getElementById('input-edit-id').value;
      const statusInput = document.getElementById('input-edit-status');

      document.getElementById('hero-name').textContent = name;
      document.getElementById('mini-user-name').textContent = name;
      document.getElementById('hero-programme').textContent = prog;
      document.getElementById('hero-id').textContent = `Student ID: ${id}`;

      if (statusInput) {
        const pill = document.getElementById('hero-status-pill');
        if (pill) {
          if (statusInput.value === 'Alumni') {
            pill.textContent = 'Alumni / Graduate';
            pill.className = 'badge badge-amber';
          } else {
            pill.textContent = 'Active';
            pill.className = 'badge badge-green';
          }
        }
      }

      closeEditModal();
      showToast('Profile changes saved locally for this prototype.');
    });
  }

  // Student / Alumni Quick Toggle (Theophany Bandure - 252012)
  window.toggleStudentAlumni = function() {
    const pill = document.getElementById('hero-status-pill');
    if (!pill) return;
    if (pill.textContent.includes('Active')) {
      pill.textContent = 'Alumni / Graduate';
      pill.className = 'badge badge-amber';
      showToast('Switched profile view to Alumni / Graduate Mode.');
    } else {
      pill.textContent = 'Active';
      pill.className = 'badge badge-green';
      showToast('Switched profile view to Active Student Mode.');
    }
  };

  // Modal backdrop listeners for Share Modal and Recommendation Letter Modal
  const shareModal = document.getElementById('modal-share-link');
  if (shareModal) {
    shareModal.addEventListener('click', (e) => {
      if (e.target === shareModal) closeShareModal();
    });
  }

  const letterModal = document.getElementById('modal-recommendation-letter');
  if (letterModal) {
    letterModal.addEventListener('click', (e) => {
      if (e.target === letterModal) closeLetterModal();
    });
  }

  const btnOpenShare = document.getElementById('btn-open-share-modal');
  if (btnOpenShare) {
    btnOpenShare.addEventListener('click', openShareModal);
  }

  const btnShareClose = document.getElementById('modal-share-close');
  if (btnShareClose) {
    btnShareClose.addEventListener('click', closeShareModal);
  }

  const btnShareCancel = document.getElementById('modal-share-cancel');
  if (btnShareCancel) {
    btnShareCancel.addEventListener('click', closeShareModal);
  }

  // Toast Notification System
  window.showToast = function(msg) {
    const root = document.getElementById('toast-root');
    if (!root) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m5 12 4 4L19 6"/></svg>
      <span>${msg}</span>
      <button onclick="this.parentElement.remove()" style="margin-left: 8px; cursor: pointer; background:none; border:none; color:inherit; font-weight:bold;">&times;</button>
    `;

    root.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 4000);
  };

  // Wire up login form submit
  const loginForm = document.getElementById('auth-login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', window.performLogin);
  }

  // Allow clicking the topbar role badge to cycle through roles for quick testing!
  const topRoleBadge = document.getElementById('topbar-role-badge');
  if (topRoleBadge) {
    topRoleBadge.style.cursor = 'pointer';
    topRoleBadge.title = 'Click to switch role (Student ↔ Lecturer ↔ Admin)';
    topRoleBadge.addEventListener('click', () => {
      if (currentRole === 'student') applyRoleUI('lecturer');
      else if (currentRole === 'lecturer') applyRoleUI('admin');
      else applyRoleUI('student');
      showToast(`Switched active view to: ${currentRole.toUpperCase()}`);
    });
  }

  // Apply initial role UI
  applyRoleUI(currentRole);
});

// Role Selection on Login Screen
window.selectLoginRole = function(role) {
  currentRole = role;

  document.querySelectorAll('.demo-role-tab').forEach(tab => {
    if (tab.getAttribute('data-role') === role) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  const heading = document.getElementById('login-heading');
  const subheading = document.getElementById('login-subheading');
  const label = document.getElementById('label-identity');
  const inputId = document.getElementById('login-identity');
  const inputPass = document.getElementById('login-password');
  const submitBtn = document.getElementById('btn-login-submit');
  const privacyText = document.getElementById('login-privacy-text');

  const cardStudent = document.getElementById('autofill-student-card');
  const cardLecturer = document.getElementById('autofill-lecturer-card');
  const cardAdmin = document.getElementById('autofill-admin-card');

  if (cardStudent) cardStudent.style.display = 'none';
  if (cardLecturer) cardLecturer.style.display = 'none';
  if (cardAdmin) cardAdmin.style.display = 'none';

  if (role === 'student') {
    heading.textContent = 'Welcome back to your student portal.';
    subheading.textContent = 'Sign in with your student ID or university email to access your profile.';
    label.textContent = 'Student ID or university email';
    inputId.value = '250444';
    inputId.placeholder = '250444 or name@africau.edu';
    inputPass.value = 'student250444';
    submitBtn.textContent = 'Sign in to student profile';
    if (privacyText) privacyText.textContent = 'Your academic information is protected and available only through your verified student account.';
    if (cardStudent) cardStudent.style.display = 'flex';
  } else if (role === 'lecturer') {
    heading.textContent = 'Faculty & Verifier Portal Sign-In';
    subheading.textContent = 'Sign in with your staff ID or faculty email to review student credentials & draft recommendations.';
    label.textContent = 'Staff ID or faculty email';
    inputId.value = '250731';
    inputId.placeholder = '250731 or chimedzac@africau.edu';
    inputPass.value = 'faculty2026';
    submitBtn.textContent = 'Sign in to faculty portal';
    if (privacyText) privacyText.textContent = 'Faculty verification actions are cryptographically signed and auditable per AU academic regulations.';
    if (cardLecturer) cardLecturer.style.display = 'flex';
  } else if (role === 'admin') {
    heading.textContent = 'Academic Registry & Admin Login';
    subheading.textContent = 'Sign in to manage student records, official transcripts & institutional governance.';
    label.textContent = 'Administrator ID or registry email';
    inputId.value = '240618';
    inputId.placeholder = '240618 or registry@africau.edu';
    inputPass.value = 'registryAdmin2026';
    submitBtn.textContent = 'Sign in to administrative portal';
    if (privacyText) privacyText.textContent = 'Restricted administrative zone. All verification and transcript actions are logged.';
    if (cardAdmin) cardAdmin.style.display = 'flex';
  }
};

window.autoFill = function(role) {
  selectLoginRole(role);
  showToast(`Auto-filled ${role} demo credentials.`);
};

window.togglePasswordVisibility = function() {
  const input = document.getElementById('login-password');
  const btn = document.getElementById('btn-toggle-password');
  if (!input || !btn) return;
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = 'Hide';
  } else {
    input.type = 'password';
    btn.textContent = 'Show';
  }
};

window.performLogin = function(e) {
  if (e) e.preventDefault();

  const loginView = document.getElementById('login-view');
  const portalShell = document.getElementById('portal-shell');

  if (loginView) loginView.style.display = 'none';
  if (portalShell) portalShell.style.display = 'flex';

  if (typeof applyRoleUI === 'function') applyRoleUI(currentRole || 'student');

  const roleLabels = {
    student: 'Wayne Matongera (Student)',
    lecturer: 'Dr. C. T. Chimedza (Faculty Verifier)',
    admin: 'Academic Registry (Administrator)'
  };

  if (typeof showToast === 'function') {
    showToast(`Welcome back, ${roleLabels[currentRole || 'student'] || 'User'}!`);
  }
  if (typeof navigate === 'function') navigate('overview');
};

window.performLogout = function() {
  const loginView = document.getElementById('login-view');
  const portalShell = document.getElementById('portal-shell');

  if (portalShell) portalShell.style.display = 'none';
  if (loginView) loginView.style.display = 'grid';

  if (typeof showToast === 'function') {
    showToast('You have been signed out securely.');
  }
};

window.applyRoleUI = function(role) {
  currentRole = role || 'student';
  const topKicker = document.getElementById('top-kicker');
  const topRoleBadge = document.getElementById('topbar-role-badge');
  const sideRoleLabel = document.getElementById('sidebar-role-label');
  const miniName = document.getElementById('mini-user-name');
  const miniId = document.getElementById('mini-user-id');
  const miniAvatar = document.getElementById('mini-user-avatar');
  const headerAvatar = document.getElementById('header-avatar');

  const navStudent = document.getElementById('nav-student');
  const navLecturer = document.getElementById('nav-lecturer');
  const navAdmin = document.getElementById('nav-admin');

  if (navStudent) navStudent.style.display = currentRole === 'student' ? 'flex' : 'none';
  if (navLecturer) navLecturer.style.display = currentRole === 'lecturer' ? 'flex' : 'none';
  if (navAdmin) navAdmin.style.display = currentRole === 'admin' ? 'flex' : 'none';

  if (role === 'lecturer') {
    if (topKicker) topKicker.textContent = 'FACULTY & VERIFIER PORTAL';
    if (sideRoleLabel) sideRoleLabel.textContent = 'FACULTY PORTAL';
    if (topRoleBadge) {
      topRoleBadge.textContent = 'Lecturer Mode';
      topRoleBadge.className = 'role-badge-pill role-badge-lecturer';
    }
    if (miniName) miniName.textContent = 'Dr. C. T. Chimedza';
    if (miniId) miniId.textContent = 'Faculty Staff 250731';
    if (miniAvatar) miniAvatar.src = 'assets/africa-university-logo.png';
    if (headerAvatar) headerAvatar.src = 'assets/africa-university-logo.png';
    if (typeof navigate === 'function') navigate('faculty-dashboard');
  } else if (role === 'admin') {
    if (topKicker) topKicker.textContent = 'ACADEMIC REGISTRY & GOVERNANCE';
    if (sideRoleLabel) sideRoleLabel.textContent = 'REGISTRY PORTAL';
    if (topRoleBadge) {
      topRoleBadge.textContent = 'Admin Mode';
      topRoleBadge.className = 'role-badge-pill role-badge-admin';
    }
    if (miniName) miniName.textContent = 'Academic Registry';
    if (miniId) miniId.textContent = 'Admin Authority 240618';
    if (miniAvatar) miniAvatar.src = 'assets/africa-university-logo.png';
    if (headerAvatar) headerAvatar.src = 'assets/africa-university-logo.png';
    if (typeof navigate === 'function') navigate('admin-dashboard');
  } else {
    if (topKicker) topKicker.textContent = 'STUDENT PORTAL';
    if (sideRoleLabel) sideRoleLabel.textContent = 'STUDENT PORTAL';
    if (topRoleBadge) {
      topRoleBadge.textContent = 'Student Mode';
      topRoleBadge.className = 'role-badge-pill role-badge-student';
    }
    if (miniName) miniName.textContent = 'Wayne Matongera';
    if (miniId) miniId.textContent = 'Student ID 250444';
    if (miniAvatar) miniAvatar.src = 'assets/wayne-matongera-profile.jpg';
    if (headerAvatar) headerAvatar.src = 'assets/wayne-matongera-profile.jpg';
  }
};

// Verification & Workflow Actions
window.verifyAchievement = function(btn) {
  const card = btn.closest('.review-row');
  if (card) {
    const badge = card.querySelector('.review-status');
    if (badge) {
      badge.textContent = 'Verified by Dr. Chimedza';
      badge.className = 'badge badge-green';
    }
    btn.parentElement.innerHTML = '<span style="font-size: 12px; color: var(--green); font-weight: 700;">✓ Verified & Timestamped</span>';
    showToast('Achievement successfully verified and cryptographically signed.');
  }
};

window.rejectAchievement = function(btn) {
  const reason = prompt('Please enter feedback/reason for rejection to notify the student:', 'Insufficient evidence: please upload official competition certificate.');
  if (reason) {
    const card = btn.closest('.review-row');
    if (card) {
      const badge = card.querySelector('.review-status');
      if (badge) {
        badge.textContent = 'Rejected: ' + reason;
        badge.className = 'badge badge-red';
      }
      btn.parentElement.innerHTML = '<span style="font-size: 12px; color: var(--red); font-weight: 700;">✗ Rejected (Feedback sent)</span>';
      showToast('Student notified with feedback reason per workshop guidelines.');
    }
  }
};

window.sealTranscript = function(btn) {
  const card = btn.closest('.review-row');
  if (card) {
    const badge = card.querySelector('.review-status');
    if (badge) {
      badge.textContent = 'Official AU Digital Seal Applied';
      badge.className = 'badge badge-green';
    }
    btn.parentElement.innerHTML = '<span style="font-size: 12px; color: var(--green); font-weight: 700;">✓ Sealed & Dispatched (PDF + QR)</span>';
    showToast('Official sealed transcript generated and dispatched.');
  }
};

// Recommendation Letter Modal Actions
window.openLetterModal = function() {
  const modal = document.getElementById('modal-recommendation-letter');
  if (modal) modal.style.display = 'grid';
};

window.closeLetterModal = function() {
  const modal = document.getElementById('modal-recommendation-letter');
  if (modal) modal.style.display = 'none';
};

window.dispatchRecommendationLetter = function(e) {
  if (e) e.preventDefault();
  closeLetterModal();
  showToast("Letter signed with Dr. Chimedza's digital signature and dispatched to recipient!");
  const statusEl = document.querySelector('#lecturer-overview-panel .review-row:last-child .review-status');
  if (statusEl) {
    statusEl.textContent = 'Signed & Dispatched';
    statusEl.className = 'badge badge-green';
  }
};

// =========================================================================
// 5. THEOPHANY BANDURE (252012) - PRIVACY, EXPIRING LINKS & NOTIFICATIONS
// Workshop Reference: Sections 4.6 & 4.7 (Student Data Ownership & Audit)
// =========================================================================

// Shareable Portfolio Link Generator Modal
window.openShareModal = function() {
  const modal = document.getElementById('modal-share-link');
  if (modal) modal.style.display = 'grid';
};

window.closeShareModal = function() {
  const modal = document.getElementById('modal-share-link');
  if (modal) modal.style.display = 'none';
};

window.generateShareLink = function(e) {
  if (e) e.preventDefault();
  const resultBox = document.getElementById('share-link-result');
  const btn = document.getElementById('btn-submit-share');

  // Generate dynamic cryptographic token
  const token = 'au_sec_' + Math.random().toString(36).substring(2, 10);
  const linkInput = document.getElementById('share-link-input');
  if (linkInput) {
    linkInput.value = `https://africau.edu/passport/verify?token=${token}`;
  }

  if (resultBox) resultBox.style.display = 'block';
  if (btn) btn.textContent = 'Regenerate Token';

  copyShareLink();
};

window.copyShareLink = function() {
  const linkInput = document.getElementById('share-link-input');
  const btnCopy = document.getElementById('btn-copy-token');
  if (linkInput) {
    linkInput.select();
    navigator.clipboard?.writeText(linkInput.value).catch(() => {});
    if (btnCopy) {
      btnCopy.textContent = 'Copied!';
      setTimeout(() => { btnCopy.textContent = 'Copy'; }, 2500);
    }
    showToast('Secure expiring portfolio link copied to clipboard.');
  }
};

window.revokeAccess = function(btn, entityName) {
  const row = btn.closest('tr') || btn.closest('.audit-row') || btn.closest('.list-row');
  if (row) {
    const badge = row.querySelector('.badge');
    if (badge) {
      badge.textContent = 'Revoked';
      badge.className = 'badge badge-red';
    }
    btn.parentElement.innerHTML = '<span style="font-size: 11px; color: var(--red); font-weight: 700;">✗ Revoked</span>';
    showToast(`Access token for ${entityName || 'external viewer'} revoked immediately per Workshop Section 4.6.`);
  }
};

// In-App Notification Center
window.toggleNotificationCenter = function() {
  const dropdown = document.getElementById('notification-center-dropdown');
  if (!dropdown) return;
  dropdown.style.display = (dropdown.style.display === 'block') ? 'none' : 'block';
};

// Close notification dropdown when clicking outside
document.addEventListener('click', (e) => {
  const dropdown = document.getElementById('notification-center-dropdown');
  const bellBtn = document.getElementById('btn-notifications-bell');
  if (dropdown && dropdown.style.display === 'block') {
    if (!dropdown.contains(e.target) && !bellBtn.contains(e.target)) {
      dropdown.style.display = 'none';
    }
  }
});

window.markAllNotificationsRead = function() {
  const dot = document.getElementById('notification-badge-dot');
  if (dot) dot.style.display = 'none';
  const dropdown = document.getElementById('notification-center-dropdown');
  if (dropdown) {
    dropdown.querySelectorAll('.notification-item').forEach(item => {
      item.style.opacity = '0.6';
    });
  }
  showToast('All notifications marked as read.');
};

/* ===== Recommendations page navigation (Natasha) ===== */
document.addEventListener('DOMContentLoaded', () => {
  const recNav = document.querySelector('.nav-btn[data-route="recommendations"]');
  if (!recNav) return;

  recNav.addEventListener('click', (e) => {
    e.stopImmediatePropagation();

    // hide every view, show mine
    document.querySelectorAll('.screen-view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-recommendations').classList.add('active');

    // highlight my nav button only
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    recNav.classList.add('active');

    // update the header title
    const title = document.getElementById('header-title');
    if (title) title.textContent = 'Recommendations';

    window.scrollTo(0, 0);
  }, true);

  // make the Request button open the existing letter modal
  document.getElementById('btn-open-request-letter')?.addEventListener('click', () => {
    if (typeof openLetterModal === 'function') openLetterModal();
  });
});

/* ===== Recommendation requests: student -> lecturer (Natasha) ===== */
const REQ_KEY = 'auRecommendationRequests';
const loadReqs = () => { try { return JSON.parse(localStorage.getItem(REQ_KEY)) || []; } catch (e) { return []; } };
const saveReqs = (l) => { try { localStorage.setItem(REQ_KEY, JSON.stringify(l)); } catch (e) {} };
const escHtml = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function openRequestModal() { document.getElementById('modal-request-letter').style.display = 'flex'; }
function closeRequestModal() { document.getElementById('modal-request-letter').style.display = 'none'; }

function reqBadge(status) {
  if (status === 'approved') return '<span class="badge badge-green">Approved &amp; Sealed</span>';
  if (status === 'declined') return '<span class="badge badge-red">Declined by Lecturer</span>';
  return '<span class="badge badge-amber">Pending Lecturer Review</span>';
}


function renderRequests() {
  const list = loadReqs();

  // Student side
  const mine = document.getElementById('my-requests-list');
  if (mine) {
    mine.innerHTML = list.length ? list.map(r => `
      <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; border:1px solid var(--line); border-radius:10px; padding:12px 14px;">
        <span><strong>${escHtml(r.purpose)} &rarr; ${escHtml(r.target)}</strong>
        <small style="display:block; color:var(--muted);">Attached: ${escHtml(r.picked.join(', ') || 'None')}</small></span>
        ${reqBadge(r.status)}
      </div>`).join('')
      : '<p style="font-size:13px; color:var(--muted);">No requests yet.</p>';
  }

  // Lecturer side
  const inc = document.getElementById('incoming-requests-list');
  if (inc) {
    inc.innerHTML = list.length ? list.map(r => `
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; border:1px solid var(--line); border-left:4px solid var(--red); border-radius:10px; padding:14px 16px;">
        <span>
          ${reqBadge(r.status)}
          <strong style="display:block; margin-top:6px;">Wayne Matongera (250444) &mdash; ${escHtml(r.purpose)}</strong>
          <small style="display:block; color:var(--muted);">To: ${escHtml(r.target)} &bull; Attached: ${escHtml(r.picked.join(', ') || 'None')}</small>
        </span>
        ${r.status === 'pending' ? `
        <span style="display:flex; gap:8px;">
          <button type="button" class="btn btn-secondary" onclick="reviewRequestDraft('${r.id}')" style="font-size:12px; padding:7px 14px;">Review &amp; Edit Draft</button>
          <button type="button" class="btn btn-primary" onclick="decideRequest('${r.id}', 'approved')" style="font-size:12px; padding:7px 14px;">Approve</button>
          <button type="button" class="btn btn-secondary" onclick="decideRequest('${r.id}', 'declined')" style="font-size:12px; padding:7px 14px;">Decline</button>
        </span>` : ''}
      </div>`).join('')
      : '<p style="font-size:13px; color:var(--muted);">No student requests yet.</p>';
  }
}

function reviewRequestDraft(id) {
  const r = loadReqs().find(x => x.id === id);
  const box = document.getElementById('recommendation-letter-preview');
  if (!r || !box) return;
  const ach = r.picked.length
    ? `<p>The Africa University Student Verification Registry confirms: <strong>${r.picked.map(escHtml).join('</strong>; <strong>')}</strong>.</p>` : '';
  const note = r.statement ? `<p>The student has asked that the following be noted: ${escHtml(r.statement)}</p>` : '';
  box.innerHTML = `
    <div style="border-bottom:2px solid var(--red); padding-bottom:1rem; margin-bottom:1.5rem;">
      <strong style="color:var(--red); font-size:1.25rem;">AFRICA UNIVERSITY &bull; FACULTY OF ENGINEERING</strong>
      <p style="font-size:0.8125rem; color:var(--muted); margin:0;">${escHtml(r.purpose)} &amp; Verified Credential Statement</p>
    </div>
    <div contenteditable="true">
      <p><strong>To the ${escHtml(r.target)} Selection Committee,</strong></p>
      <p>I am pleased to provide this official ${escHtml(r.purpose)} recommendation for <strong>Wayne Matongera (Student ID: 250444)</strong>, currently enrolled in the BSc. Computer Information Systems programme at Africa University.</p>
      <p>Wayne has maintained an exemplary academic record with a cumulative GPA of <strong>3.78 / 4.00</strong>, earning a confirmed position on the <strong>Dean's Honour Roll</strong>.</p>
      ${ach}${note}
      <p>I recommend him without reservation.</p>
      <div style="margin-top:2rem;"><strong>Dr. C. T. Chimedza, Ph.D.</strong><br>
      <span style="font-size:0.875rem; color:var(--muted);">Senior Lecturer &amp; Academic Supervisor &bull; Africa University</span></div>
    </div>`;
  box.scrollIntoView({ behavior: 'smooth' });
  showToast('Draft generated. Click the letter text to edit it.');
}

function decideRequest(id, decision) {
  const list = loadReqs();
  const r = list.find(x => x.id === id);
  if (!r) return;
  r.status = decision;
  saveReqs(list);
  renderRequests();
  showToast(decision === 'approved' ? 'Letter approved and sealed. Student notified.' : 'Request declined. Student notified.');
}

document.addEventListener('DOMContentLoaded', () => {
  renderRequests();

  document.getElementById('request-letter-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const list = loadReqs();
    list.unshift({
      id: 'req' + Date.now(),
      purpose: document.getElementById('letter-purpose').value,
      target: document.getElementById('letter-target').value,
      statement: document.getElementById('letter-statement').value.trim(),
      picked: [...document.querySelectorAll('input[name="letter-achievement"]:checked')].map(cb => cb.value),
      status: 'pending'
    });
    saveReqs(list);
    renderRequests();
    closeRequestModal();

    e.target.reset();
    showToast('Request sent to your lecturer.');
  });
});
function openAddAchievementModal() {
  const modal = document.getElementById('modal-add-achievement');
  if (modal) modal.style.display = 'flex';
}

function closeAddAchievementModal() {
  const modal = document.getElementById('modal-add-achievement');
  if (modal) modal.style.display = 'none';
}

function handleAchievementSubmit(e) {
  e.preventDefault();
  const title = document.getElementById('achieve-title').value;
  const category = document.getElementById('achieve-category').value;
  const date = document.getElementById('achieve-date').value;
  
  const grid = document.querySelector('#view-achievements .achievement-grid');
  if (grid) {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="medal">&#127941;</div>
      <span class="badge badge-amber">Pending Review</span>
      <h3>${title}</h3>
      <p>${category} &bull; Submitted ${date}</p>
    `;
    grid.prepend(card);
  }
  
  closeAddAchievementModal();
  document.getElementById('form-log-achievement').reset();
  if (typeof showToast === 'function') {
    showToast('Achievement submitted for faculty verification!');
  }
}
// refresh the lists whenever someone logs in or clicks around
document.addEventListener('click', () => setTimeout(renderRequests, 60));

 feat/task4-skills-activities
/* ===== Skills and extracurricular activities demo ===== */
document.addEventListener('DOMContentLoaded', () => {
  const activityList = document.getElementById('activity-list');
  const activitySearch = document.getElementById('activity-search');
  const categoryFilter = document.getElementById('activity-category-filter');
  const statusFilter = document.getElementById('activity-status-filter');
  const resultsLabel = document.getElementById('activity-results');
  const emptyMessage = document.getElementById('activity-empty');
  const detailModal = document.getElementById('activity-detail-modal');
  const formModal = document.getElementById('activity-form-modal');
  const activityForm = document.getElementById('activity-form');
  if (!activityList || !activitySearch || !categoryFilter || !statusFilter || !resultsLabel || !emptyMessage || !detailModal || !formModal || !activityForm) return;

  let activities = [
    {
      id: 'demo-gdsc',
      name: 'Google Developer Student Club',
      category: 'Technology',
      organization: 'Africa University student community',
      role: 'Workshop coordinator',
      start: '2024-09-01',
      end: '2025-06-30',
      description: 'Helped organize peer learning sessions introducing students to web development and collaborative project work.',
      achievements: ['Coordinated three introductory workshops', 'Supported a student project showcase'],
      status: 'Verified'
    },
    {
      id: 'demo-community',
      name: 'Digital literacy outreach',
      category: 'Community service',
      organization: 'Community outreach programme',
      role: 'Student volunteer',
      start: '2025-02-01',
      end: '',
      description: 'Volunteered with a small student group to support introductory digital skills sessions for community learners.',
      achievements: ['Prepared beginner-friendly learning materials', 'Provided one-to-one support during sessions'],
      status: 'Pending'
    },
    {
      id: 'demo-sports',
      name: 'Inter-faculty football',
      category: 'Sports',
      organization: 'University sports programme',
      role: 'Team member',
      start: '2024-03-01',
      end: '2024-11-30',
      description: 'Participated in regular training and represented the faculty in the inter-faculty student competition.',
      achievements: ['Maintained regular training attendance'],
      status: 'Rejected'
    }
  ];

  const escapeActivityHTML = value => String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[character]));

  const formatActivityDate = value => {
    if (!value) return 'Present';
    const [year, month, day] = value.split('-').map(Number);
    return new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' })
      .format(new Date(Date.UTC(year, month - 1, day)));
  };

  const statusClass = status => ({
    Pending: 'activity-status-pending',
    Verified: 'activity-status-verified',
    Rejected: 'activity-status-rejected'
  }[status] || 'activity-status-pending');

  function renderActivities() {
    const query = activitySearch.value.trim().toLowerCase();
    const category = categoryFilter.value;
    const status = statusFilter.value;
    const matches = activities.filter(activity => {
      const searchable = [
        activity.name, activity.category, activity.organization, activity.role,
        activity.description, ...activity.achievements
      ].join(' ').toLowerCase();
      return (!query || searchable.includes(query))
        && (!category || activity.category === category)
        && (!status || activity.status === status);
    });

    activityList.innerHTML = matches.map(activity => `
      <article class="activity-card">
        <div class="activity-card-top">
          <span class="activity-category">${escapeActivityHTML(activity.category)}</span>
          <span class="activity-status ${statusClass(activity.status)}">${escapeActivityHTML(activity.status)} <span class="sr-only">demonstration status</span></span>
        </div>
        <h3>${escapeActivityHTML(activity.name)}</h3>
        <p class="activity-organization">${escapeActivityHTML(activity.organization)}</p>
        <p class="activity-role">${escapeActivityHTML(activity.role)}</p>
        <p class="activity-card-description">${escapeActivityHTML(activity.description)}</p>
        <p class="activity-card-dates">${formatActivityDate(activity.start)} – ${formatActivityDate(activity.end)}</p>
        <div class="activity-card-actions">
          <button type="button" class="text-link" data-activity-action="details" data-activity-id="${escapeActivityHTML(activity.id)}">View details <span aria-hidden="true">&rarr;</span></button>
          <button type="button" class="text-link" data-activity-action="edit" data-activity-id="${escapeActivityHTML(activity.id)}">Edit</button>
        </div>
      </article>
    `).join('');
    resultsLabel.textContent = `${matches.length} ${matches.length === 1 ? 'activity' : 'activities'} shown`;
    emptyMessage.hidden = matches.length > 0;
  }

  let lastFocusedElement = null;
  function showActivityModal(modal) {
    lastFocusedElement = document.activeElement;
    modal.style.display = 'grid';
    modal.setAttribute('aria-hidden', 'false');
    modal.querySelector('[role="dialog"]').focus();
  }

  function hideActivityModal(modal) {
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    const focusTarget = lastFocusedElement && lastFocusedElement.isConnected
      ? lastFocusedElement
      : document.getElementById('activity-add-button');
    if (focusTarget) focusTarget.focus();
  }

  function openActivityDetails(id) {
    const activity = activities.find(item => item.id === id);
    if (!activity) return;
    const content = document.getElementById('activity-detail-content');
    const achievements = activity.achievements.length
      ? `<ul>${activity.achievements.map(item => `<li>${escapeActivityHTML(item)}</li>`).join('')}</ul>`
      : '<p>No achievements have been added to this demonstration entry.</p>';
    content.innerHTML = `
      <span class="activity-category">${escapeActivityHTML(activity.category)}</span>
      <span class="activity-status ${statusClass(activity.status)}">${escapeActivityHTML(activity.status)} <span class="sr-only">demonstration status</span></span>
      <h2 id="activity-detail-title">${escapeActivityHTML(activity.name)}</h2>
      <dl class="activity-detail-list">
        <div><dt>Organization</dt><dd>${escapeActivityHTML(activity.organization)}</dd></div>
        <div><dt>Student role</dt><dd>${escapeActivityHTML(activity.role)}</dd></div>
        <div><dt>Dates</dt><dd>${formatActivityDate(activity.start)} – ${formatActivityDate(activity.end)}</dd></div>
      </dl>
      <h3>About this activity</h3><p>${escapeActivityHTML(activity.description)}</p>
      <h3>Achievements</h3>${achievements}
      <p class="activity-form-note">Demonstration entry only. This status is not officially verified or connected to an institutional database.</p>
      <div class="form-actions"><button type="button" class="btn btn-secondary" id="activity-detail-done">Close details</button></div>
    `;
    document.getElementById('activity-detail-title').textContent = activity.name;
    showActivityModal(detailModal);
    document.getElementById('activity-detail-done').addEventListener('click', () => hideActivityModal(detailModal));
  }

  function resetActivityForm() {
    activityForm.reset();
    document.getElementById('activity-id').value = '';
    document.getElementById('activity-form-title').textContent = 'Add activity';
    document.getElementById('activity-form-submit').textContent = 'Add activity';
  }

  function openActivityForm(activity) {
    resetActivityForm();
    if (activity) {
      document.getElementById('activity-id').value = activity.id;
      document.getElementById('activity-name').value = activity.name;
      document.getElementById('activity-category').value = activity.category;
      document.getElementById('activity-organization').value = activity.organization;
      document.getElementById('activity-role').value = activity.role;
      document.getElementById('activity-start').value = activity.start;
      document.getElementById('activity-end').value = activity.end;
      document.getElementById('activity-description').value = activity.description;
      document.getElementById('activity-achievements').value = activity.achievements.join('\n');
      document.getElementById('activity-status').value = activity.status;
      document.getElementById('activity-form-title').textContent = 'Edit activity';
      document.getElementById('activity-form-submit').textContent = 'Save changes';
    }
    showActivityModal(formModal);
    document.getElementById('activity-name').focus();
  }

  document.getElementById('activity-add-button').addEventListener('click', () => openActivityForm());
  document.getElementById('activity-form-close').addEventListener('click', () => hideActivityModal(formModal));
  document.getElementById('activity-form-cancel').addEventListener('click', () => hideActivityModal(formModal));
  document.getElementById('activity-detail-close').addEventListener('click', () => hideActivityModal(detailModal));
  [activitySearch, categoryFilter, statusFilter].forEach(control => {
    control.addEventListener(control === activitySearch ? 'input' : 'change', renderActivities);
  });

  activityList.addEventListener('click', event => {
    const button = event.target.closest('[data-activity-action]');
    if (!button) return;
    const activity = activities.find(item => item.id === button.dataset.activityId);
    if (!activity) return;
    if (button.dataset.activityAction === 'details') openActivityDetails(activity.id);
    else openActivityForm(activity);
  });

  [detailModal, formModal].forEach(modal => {
    modal.addEventListener('click', event => {
      if (event.target === modal) hideActivityModal(modal);
    });
    modal.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        hideActivityModal(modal);
      }
      if (event.key !== 'Tab') return;
      const focusable = [...modal.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])')]
        .filter(element => element.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  });

  document.getElementById('activity-end').addEventListener('input', event => {
    const startDate = document.getElementById('activity-start').value;
    event.target.setCustomValidity(event.target.value && startDate && event.target.value < startDate
      ? 'End date must be on or after the start date.'
      : '');
  });

  activityForm.addEventListener('submit', event => {
    event.preventDefault();
    const start = document.getElementById('activity-start').value;
    const end = document.getElementById('activity-end').value;
    const endInput = document.getElementById('activity-end');
    endInput.setCustomValidity(end && start && end < start ? 'End date must be on or after the start date.' : '');
    if (!activityForm.reportValidity()) return;

    const id = document.getElementById('activity-id').value;
    const activity = {
      id: id || `demo-${Date.now()}`,
      name: document.getElementById('activity-name').value.trim(),
      category: document.getElementById('activity-category').value,
      organization: document.getElementById('activity-organization').value.trim(),
      role: document.getElementById('activity-role').value.trim(),
      start,
      end,
      description: document.getElementById('activity-description').value.trim(),
      achievements: document.getElementById('activity-achievements').value.split('\n').map(item => item.trim()).filter(Boolean),
      status: document.getElementById('activity-status').value
    };
    const existingIndex = activities.findIndex(item => item.id === id);
    if (existingIndex < 0) activities.unshift(activity);
    else activities[existingIndex] = activity;
    renderActivities();
    hideActivityModal(formModal);
    resetActivityForm();
    showToast(existingIndex < 0 ? 'Demonstration activity added for this page session.' : 'Demonstration activity updated for this page session.');
  });

  renderActivities();
});

// =========================================================================
// CV MANAGEMENT & VIEWER (Figma Make Replica)
// =========================================================================

let currentCvData = {
  name: 'Wayne_Matongera_Academic_CV.pdf',
  type: 'PDF',
  updated: '20 Oct 2026 · 09:30',
  size: '624 KB',
  version: 1,
  blobUrl: null
};

window.triggerCvUpload = function() {
  const fileInput = document.getElementById('cv-file-input');
  if (fileInput) fileInput.click();
};

window.handleCvFileSelect = function(e) {
  const file = e.target?.files?.[0];
  if (!file) return;

  const errorBox = document.getElementById('cv-error-box');
  const errorText = document.getElementById('cv-error-text');
  const progressBox = document.getElementById('cv-upload-progress-box');
  const progressBar = document.getElementById('cv-progress-bar');
  const progressPct = document.getElementById('cv-upload-pct');
  const progressLabel = document.getElementById('cv-upload-label');

  if (errorBox) errorBox.style.display = 'none';

  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext !== 'pdf' && ext !== 'docx') {
    if (errorBox && errorText) {
      errorText.textContent = 'Unsupported file format. Please upload a PDF or DOCX file.';
      errorBox.style.display = 'flex';
    }
    showToast('Unsupported file type. Please choose a PDF or DOCX document.');
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    if (errorBox && errorText) {
      errorText.textContent = 'File exceeds maximum limit of 5 MB.';
      errorBox.style.display = 'flex';
    }
    showToast('Document exceeds 5 MB. Please choose a smaller file.');
    return;
  }

  // Simulated upload progress animation
  if (progressBox) progressBox.style.display = 'block';
  if (progressLabel) progressLabel.textContent = 'Uploading CV…';
  let pct = 15;
  if (progressBar) progressBar.value = pct;
  if (progressPct) progressPct.textContent = `${pct}%`;

  const interval = setInterval(() => {
    pct = Math.min(pct + 25, 95);
    if (progressBar) progressBar.value = pct;
    if (progressPct) progressPct.textContent = `${pct}%`;
  }, 120);

  setTimeout(() => {
    clearInterval(interval);
    if (progressBar) progressBar.value = 100;
    if (progressPct) progressPct.textContent = '100%';
    if (progressLabel) progressLabel.textContent = 'Upload complete';

    currentCvData = {
      name: file.name,
      type: ext === 'pdf' ? 'PDF' : 'DOCX',
      updated: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + ' · ' + new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      size: `${Math.max(1, Math.round(file.size / 1024))} KB`,
      version: currentCvData.version + 1,
      blobUrl: URL.createObjectURL(file)
    };

    // Update UI elements
    const docName = document.getElementById('cv-doc-name');
    const docType = document.getElementById('cv-doc-type');
    const docMeta = document.getElementById('cv-doc-meta');
    const docUpdated = document.getElementById('cv-doc-updated');
    const modalTitle = document.getElementById('cv-preview-title');
    const modalMeta = document.getElementById('cv-modal-meta');

    if (docName) docName.textContent = currentCvData.name;
    if (docType) docType.textContent = currentCvData.type;
    if (docMeta) docMeta.textContent = `Version ${currentCvData.version} • ${currentCvData.size}`;
    if (docUpdated) docUpdated.textContent = `Last updated ${currentCvData.updated}`;
    if (modalTitle) modalTitle.textContent = currentCvData.name;
    if (modalMeta) modalMeta.textContent = `Version ${currentCvData.version} • Updated ${currentCvData.updated}`;

    showToast('Your CV has been replaced and verified successfully.');

    setTimeout(() => {
      if (progressBox) progressBox.style.display = 'none';
    }, 1500);
  }, 700);
};

window.openCvPreviewModal = function() {
  const modal = document.getElementById('modal-cv-preview');
  if (modal) modal.style.display = 'grid';
};

window.closeCvPreviewModal = function() {
  const modal = document.getElementById('modal-cv-preview');
  if (modal) modal.style.display = 'none';
};

window.downloadCV = function() {
  const cvText = `WAYNE MATONGERA
BSc Computer Information Systems Student
Africa University | w.matongera@africau.edu | +263 77 456 7821
Mutare, Zimbabwe | linkedin.com/in/wayne-matongera | github.com/waynematongera

PROFILE
Computer Information Systems student focused on accessible digital products, mobile development, data-informed solutions, and technology for community impact.

EDUCATION
BSc Computer Information Systems, Africa University — Expected Nov 2028
Current GPA: 3.78 / 4.00 (Dean's Honour Roll)

RELEVANT COURSES
Web Technologies (WTS201), Applied Statistics (STA201), Mobile Applications (CIS202)

ACHIEVEMENTS
Dean's List — Semester 2, 2025
Google UX Design Certificate — August 2025
Inter-University Hackathon — 2nd Place, March 2025
GDSC Solution Challenge 2025 — 1st Runner Up

SELECTED PROJECTS
Smart Campus Navigator — Product designer and Flutter developer
Student Performance Analytics — Data analyst and backend developer
EcoTrack Web Platform — Frontend lead

LEADERSHIP & COMMUNITY
Vice President — Women in Technology Club
Volunteer Mentor — Code for Community
Core Team Member — Google Developer Student Club

SKILLS
React, Flutter, SQL, Python, UI/UX Design, Database Management, Teamwork, Leadership

LANGUAGES & INTERESTS
English, Shona | Digital inclusion, robotics, photography

REFERENCES
Available upon request:
Dr. C. T. Chimedza, Ph.D.
Senior Lecturer & Academic Supervisor
Faculty of Engineering & Applied Sciences, Africa University
`;

  const blob = new Blob([cvText], { type: 'text/plain;charset=utf-8' });
  const url = currentCvData.blobUrl || URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = currentCvData.blobUrl ? currentCvData.name : 'Wayne_Matongera_Academic_CV.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast('Downloading official student CV…');
};

// Modal backdrop click for CV preview
const cvModal = document.getElementById('modal-cv-preview');
if (cvModal) {
  cvModal.addEventListener('click', (e) => {
    if (e.target === cvModal) closeCvPreviewModal();
  });
}
development
