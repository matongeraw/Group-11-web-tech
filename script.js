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

  const studentRoutes = ['overview', 'personal-academic', 'courses', 'calendar', 'examination', 'academic-progress', 'skills-activities', 'achievements', 'projects', 'contact'];
  const lecturerRoutes = ['faculty-dashboard', 'verification-queue', 'reference-requests', 'faculty-modules', 'supervised-students'];
  const adminRoutes = ['admin-dashboard', 'admin-transcripts', 'admin-id-validation', 'admin-verifiers'];

  let activeRoute = '';
  const courseMenu = document.getElementById('course-submenu');
  const courseButton = document.querySelector('.course-nav-group > .nav-btn');

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
      if (btnRoute === route || (btnRoute === 'courses' && ['calendar', 'examination'].includes(route))) {
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
    if (sidebar && route !== 'courses') sidebar.classList.remove('open');

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
      navigate(route);
    });
  });

  const calendarDays = document.getElementById('calendar-days');
  const calendarMonth = document.getElementById('calendar-month');
  const calendarEventCount = document.getElementById('calendar-event-count');
  const agendaDate = document.getElementById('agenda-date');
  const agendaCount = document.getElementById('agenda-count');
  const agendaList = document.getElementById('agenda-list');

  if (calendarDays && calendarMonth && calendarEventCount && agendaDate && agendaCount && agendaList) {
    const calendarEvents = [
      { date: '2026-11-03', title: 'WTS201 Project Submission', time: 'Due by 23:59', location: 'Learning Portal', category: 'academic' },
      { date: '2026-11-07', title: 'Responsible AI Workshop', time: '10:00–13:00', location: 'Innovation Hub', category: 'institution' },
      { date: '2026-11-10', title: 'Web Technologies Examination', time: '09:00–12:00', location: 'Great Hall', category: 'academic' },
      { date: '2026-11-12', title: 'Applied Statistics Examination', time: '14:00–17:00', location: 'New Building 14', category: 'academic' },
      { date: '2026-11-14', title: 'University Sports Day', time: '08:00–16:00', location: 'University Sports Grounds', category: 'institution' },
      { date: '2026-11-15', title: 'Mobile Applications Examination', time: '09:00–12:00', location: 'ICT Lab 2', category: 'academic' },
      { date: '2026-11-20', title: 'Student Robotics Showcase', time: '13:00–16:00 · Pending approval', location: 'Innovation Hub', category: 'pending' }
    ];
    let calendarDate = new Date(2026, 10, 1);
    let selectedDate = '2026-11-14';

    const dateKey = (year, month, day) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const renderAgenda = () => {
      const events = calendarEvents.filter(event => event.date === selectedDate);
      const selected = new Date(`${selectedDate}T00:00:00`);
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
        const item = document.createElement('div');
        item.className = 'agenda-item';
        const marker = document.createElement('span');
        marker.className = `event-marker ${event.category}`;
        marker.setAttribute('aria-hidden', 'true');
        const details = document.createElement('div');
        const title = document.createElement('strong');
        title.textContent = event.title;
        const time = document.createElement('small');
        time.textContent = event.time;
        const venue = document.createElement('small');
        venue.textContent = event.location;
        details.append(title, time, venue);
        item.append(marker, details);
        agendaList.append(item);
      });
    };

    const renderCalendar = () => {
      const year = calendarDate.getFullYear();
      const month = calendarDate.getMonth();
      const monthEvents = calendarEvents.filter(event => event.date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`));
      const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const today = new Date();
      const todayKey = dateKey(today.getFullYear(), today.getMonth(), today.getDate());

      calendarMonth.textContent = calendarDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
      calendarEventCount.textContent = `${monthEvents.length} events scheduled`;
      calendarDays.replaceChildren();

      for (let blank = 0; blank < firstWeekday; blank += 1) {
        const empty = document.createElement('span');
        empty.setAttribute('role', 'presentation');
        calendarDays.append(empty);
      }

      for (let day = 1; day <= daysInMonth; day += 1) {
        const key = dateKey(year, month, day);
        const dayEvents = calendarEvents.filter(event => event.date === key);
        const button = document.createElement('button');
        button.type = 'button';
        button.setAttribute('role', 'gridcell');
        button.setAttribute('aria-label', `${new Date(year, month, day).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}${dayEvents.length ? `, ${dayEvents.length} scheduled ${dayEvents.length === 1 ? 'event' : 'events'}` : ''}`);
        if (key === selectedDate) button.classList.add('selected');
        if (key === todayKey) button.classList.add('current-day');
        if (dayEvents.length) button.classList.add('has-event');

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
          button.append(markers);
        }
        button.addEventListener('click', () => {
          selectedDate = key;
          renderCalendar();
        });
        calendarDays.append(button);
      }

      renderAgenda();
    };

    document.getElementById('calendar-prev')?.addEventListener('click', () => {
      calendarDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1);
      selectedDate = dateKey(calendarDate.getFullYear(), calendarDate.getMonth(), 1);
      renderCalendar();
    });
    document.getElementById('calendar-next')?.addEventListener('click', () => {
      calendarDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1);
      selectedDate = dateKey(calendarDate.getFullYear(), calendarDate.getMonth(), 1);
      renderCalendar();
    });
    document.getElementById('calendar-today')?.addEventListener('click', () => {
      const today = new Date();
      calendarDate = new Date(today.getFullYear(), today.getMonth(), 1);
      selectedDate = dateKey(today.getFullYear(), today.getMonth(), today.getDate());
      renderCalendar();
    });
    renderCalendar();
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

  applyRoleUI(currentRole);

  const roleLabels = {
    student: 'Wayne Matongera (Student)',
    lecturer: 'Dr. C. T. Chimedza (Faculty Verifier)',
    admin: 'Academic Registry (Administrator)'
  };

  showToast(`Welcome back, ${roleLabels[currentRole] || 'User'}!`);
  window.navigate('overview');
};

window.performLogout = function() {
  const loginView = document.getElementById('login-view');
  const portalShell = document.getElementById('portal-shell');

  if (portalShell) portalShell.style.display = 'none';
  if (loginView) loginView.style.display = 'grid';

  showToast('You have been signed out securely.');
};

window.applyRoleUI = function(role) {
  currentRole = role;
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

  // Hide navbars first
  if (navStudent) navStudent.style.display = 'none';
  if (navLecturer) navLecturer.style.display = 'none';
  if (navAdmin) navAdmin.style.display = 'none';

  if (role === 'lecturer') {
    if (navLecturer) navLecturer.style.display = 'block';

    if (topKicker) topKicker.textContent = 'FACULTY & VERIFIER PORTAL';
    if (sideRoleLabel) sideRoleLabel.textContent = 'FACULTY PORTAL';
    if (topRoleBadge) {
      topRoleBadge.textContent = 'Lecturer / Verifier Mode';
      topRoleBadge.className = 'role-badge-pill role-badge-lecturer';
    }
    if (miniName) miniName.textContent = 'Dr. C. T. Chimedza';
    if (miniId) miniId.textContent = 'Faculty Staff 250731';
    if (miniAvatar) miniAvatar.src = 'assets/africa-university-logo.png';
    if (headerAvatar) headerAvatar.src = 'assets/africa-university-logo.png';
    navigate('faculty-dashboard');
  } else if (role === 'admin') {
    if (navAdmin) navAdmin.style.display = 'block';

    if (topKicker) topKicker.textContent = 'ACADEMIC REGISTRY & GOVERNANCE';
    if (sideRoleLabel) sideRoleLabel.textContent = 'REGISTRY PORTAL';
    if (topRoleBadge) {
      topRoleBadge.textContent = 'Administrator Mode';
      topRoleBadge.className = 'role-badge-pill role-badge-admin';
    }
    if (miniName) miniName.textContent = 'Academic Registry';
    if (miniId) miniId.textContent = 'Admin Authority 240618';
    if (miniAvatar) miniAvatar.src = 'assets/africa-university-logo.png';
    if (headerAvatar) headerAvatar.src = 'assets/africa-university-logo.png';
    navigate('admin-dashboard');
  } else {
    if (navStudent) navStudent.style.display = 'block';

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
    navigate('overview');
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

// refresh the lists whenever someone logs in or clicks around
document.addEventListener('click', () => setTimeout(renderRequests, 60));