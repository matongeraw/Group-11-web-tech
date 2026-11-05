# Team 11 Task Specification & Implementation Guide
## AU Student Achievement & Recommendation Profile (MyAU Passport)
**SOE2103 Web Technologies & Requirements Engineering**

---

## Table of Contents
1. [Overview & Baseline Repository Setup](#overview--baseline-repository-setup)
2. [Wayne Matongera (250444) &mdash; Multi-Role System Architecture](#1-wayne-matongera-250444--multi-role-system-architecture)
3. [Nothando V Makova (250764) &mdash; Achievement Logging & Verification](#2-nothando-v-makova-250764--achievement-logging--verification)
4. [Natasha Nyamutsaka (250426) &mdash; Recommendation Letter Engine](#3-natasha-nyamutsaka-250426--recommendation-letter-engine)
5. [Jordy Musul (240439) &mdash; Attachment Supervisor Workplace Portal](#4-jordy-musul-240439--attachment-supervisor-workplace-portal)
6. [Theophany Bandure (252012) &mdash; Privacy, Expiring Links & Audit Log](#5-theophany-bandure-252012--privacy-expiring-links--audit-log)
7. [Universal Git Workflow Cheatsheet](#universal-git-workflow-cheatsheet)

---

## Overview & Baseline Repository Setup

All five members will build upon the **MyAU Passport** baseline in repository:
`https://github.com/matongeraw/Group-11-web-tech.git`

Every member creates their own feature branch, tests locally in their browser, and submits a Pull Request for peer review.

---

## 1. Wayne Matongera (250444) &mdash; Multi-Role System Architecture
* **Role**: Team Lead & Lead Architect
* **Branch**: `wayne/role-architecture`
* **Workshop Reference**: Sections 3, 4.3 & 7 (Role-Based Access for Student, Lecturer, Attachment Supervisor & External Recipient)

### User Story
> *As a user of the portal, I need the interface to adapt to my designated role so that students see their personal records, lecturers see verification queues, supervisors see workplace tracking, and employers see only permitted verified summaries.*

### Deliverables & Features to Build
1. **Global Role Switcher in Topbar**:
   - Expand `.persona-switcher` to support 4 distinct system roles:
     - `student` (Student / Alumni view)
     - `lecturer` (Lecturer / Verifier view)
     - `supervisor` (Industrial Attachment Supervisor view)
     - `recipient` (External Employer / Consented Recipient view)
2. **Dynamic Navigation & View Visibility**:
   - When **Lecturer** is active: Sidebar highlights "Review Queue" and shows "Verify / Reject" controls on student achievements.
   - When **Supervisor** is active: Sidebar prioritizes "Attachment Evaluation" and "Attendance Log".
   - When **Recipient** is active: Disables private contact info, shows only consented verified items.
3. **Role Context Banner**:
   - An indicator bar at the top explaining the currently active perspective and access boundaries.

### Exact Code Implementation

#### In `index.html` (Topbar Role Control):
```html
<!-- Replace or extend .persona-switcher with: -->
<div class="role-selector-wrap">
  <label for="system-role-select" class="role-selector-label">ACTIVE ROLE:</label>
  <select id="system-role-select" class="role-dropdown">
    <option value="student">Student / Alumni (Wayne Matongera)</option>
    <option value="lecturer">Lecturer / Verifier (Dr. Chimedza)</option>
    <option value="supervisor">Attachment Supervisor (Eng. Ndlovu)</option>
    <option value="recipient">External Employer / Reviewer</option>
  </select>
</div>
```

#### In `script.js` (Role Switching Logic):
```javascript
const roleSelect = document.getElementById('system-role-select');

roleSelect.addEventListener('change', (e) => {
  const currentRole = e.target.value;
  document.body.setAttribute('data-role', currentRole);
  
  if (currentRole === 'lecturer') {
    showToast('Switched to Lecturer / Verifier view.');
    // Show reviewer queues, hide student edit profile buttons
  } else if (currentRole === 'supervisor') {
    showToast('Switched to Attachment Supervisor portal.');
    switchView('attachment');
  } else if (currentRole === 'recipient') {
    showToast('Viewing as External Consented Recipient.');
  } else {
    showToast('Switched to Student Profile view.');
  }
});
```

---

## 2. Nothando V Makova (250764) &mdash; Achievement Logging & Verification
* **Role**: Frontend Developer & Data Analyst
* **Branch**: `nothando/achievement-logging`
* **Workshop Reference**: Sections 4.1, 4.2 & 4.3 (Teams 1, 3, 5: Student logging, evidence criteria, 3-state status: Pending, Verified, Rejected with reason)

### User Story
> *As a student, I want to log my co-curricular accomplishments, categorize them, and submit supporting evidence so that authorized staff can review and officially verify them.*

### Deliverables & Features to Build
1. **"Log New Achievement" Modal & Form**:
   - Title, Category dropdown (*Academic Distinction, Leadership, Sports, Volunteering, Certifications, Technical / Innovation, Competitions*).
   - Date achieved.
   - Issuing Organization.
   - Level indicator: *Major, Moderate, Minor* (Team 5 recommendation).
   - Evidence Description or File URL.
2. **3-State Verification Workflow**:
   - Visual badges:
     - `<span class="badge badge-verified">Verified</span>`
     - `<span class="badge badge-pending">Pending Review</span>`
     - `<span class="badge badge-rejected">Changes Requested / Rejected</span>`
   - Rejection feedback callout: When status is Rejected, display the verifier's written feedback.
3. **Category Filtering**:
   - Filter chips to view achievements by category.

### Exact Code Implementation

#### In `index.html` (Achievements Section Header & Modal):
```html
<!-- Inside #view-achievements .screen-actions: -->
<button type="button" class="btn btn-primary" id="btn-open-add-achievement">
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
  + Log New Achievement
</button>

<!-- New Modal: #modal-add-achievement -->
<div class="modal-backdrop" id="modal-add-achievement" role="dialog" aria-modal="true">
  <div class="modal-window">
    <div class="modal-header">
      <h2>Log New Student Achievement</h2>
      <button type="button" class="modal-close-btn" id="modal-achievement-close">&times;</button>
    </div>
    <form id="form-log-achievement">
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Achievement Title *</label>
          <input type="text" id="achieve-title" class="form-input" placeholder="e.g. 1st Place National Hackathon" required>
        </div>
        <div class="form-group">
          <label class="form-label">Category *</label>
          <select id="achieve-category" class="form-select" required>
            <option value="Academic">Academic Awards & Honors</option>
            <option value="Leadership">Student Leadership & Governance</option>
            <option value="Certifications">Industry Certifications</option>
            <option value="Innovation">Projects & Innovation</option>
            <option value="Sports">Sports & Athletics</option>
            <option value="Volunteering">Community Engagement & Volunteering</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Date Completed *</label>
          <input type="date" id="achieve-date" class="form-input" required>
        </div>
        <div class="form-group">
          <label class="form-label">Impact Level</label>
          <select id="achieve-level" class="form-select">
            <option value="Major">Major (National / International recognition)</option>
            <option value="Moderate">Moderate (University-wide impact)</option>
            <option value="Minor">Minor (Departmental / Class activity)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Evidence Description or Document URL *</label>
          <textarea id="achieve-evidence" class="form-textarea" placeholder="Describe the certificate, supervisor reference, or paste link..." required></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" id="modal-achievement-cancel">Cancel</button>
        <button type="submit" class="btn btn-primary">Submit for Verification</button>
      </div>
    </form>
  </div>
</div>
```

#### In `script.js` (Achievement Handler):
```javascript
const addAchieveForm = document.getElementById('form-log-achievement');
addAchieveForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const title = document.getElementById('achieve-title').value;
  const cat = document.getElementById('achieve-category').value;
  const date = document.getElementById('achieve-date').value;
  const evidence = document.getElementById('achieve-evidence').value;

  const cardHtml = `
    <article class="achievement-card">
      <div class="achievement-header">
        <div>
          <span class="achievement-cat">${cat}</span>
          <h3 class="achievement-title">${title}</h3>
        </div>
        <span class="badge badge-pending">Pending Review</span>
      </div>
      <p class="achievement-desc">Evidence: ${evidence}</p>
      <div class="achievement-meta">
        <span>Date: ${date}</span>
        <span>Status: Awaiting Faculty Verification</span>
      </div>
    </article>
  `;

  document.querySelector('.achievements-grid').insertAdjacentHTML('afterbegin', cardHtml);
  closeModal(document.getElementById('modal-add-achievement'));
  showToast('Achievement submitted! It will appear as Verified once reviewed.');
});
```

---

## 3. Natasha Nyamutsaka (250426) &mdash; Recommendation Letter Engine
* **Role**: Frontend Developer & UX Specialist
* **Branch**: `natasha/recommendation-engine`
* **Workshop Reference**: Section 4.4 (Teams 1, 2, 3, 4, 6: Recommendation letter request, auto-drafting from verified achievements, lecturer approval)

### User Story
> *As a student, I want to request a recommendation letter and specify my target opportunity, so that the system generates a verified evidence draft for my lecturer, reducing letter turnaround time from days to minutes.*

### Deliverables & Features to Build
1. **Student Recommendation Request Interface**:
   - Request modal:
     - Purpose: Academic Reference, Master's Degree, Industrial Attachment, Scholarship.
     - Target Institution / Organization.
     - Student's personal statement or key points.
     - Multi-select list of **Verified Achievements** to attach to the draft.
2. **Lecturer Auto-Draft Generator & Preview Screen**:
   - Synthesizes student profile data (Name, AU ID, GPA 3.84, Degree) and attaches the selected verified achievements into an official academic letterhead template.
   - Text editor area allowing the lecturer to customize the draft.
   - "Approve & Generate Sealed PDF" button.

### Exact Code Implementation

#### In `index.html` (Recommendation View & Letter Generator):
```html
<section class="screen-view" id="view-recommendations" aria-labelledby="heading-recommendations">
  <div class="screen-header">
    <div>
      <div class="screen-eyebrow">FAIR & EVIDENCE-BASED REFERENCES</div>
      <h2 class="screen-title" id="heading-recommendations">Recommendation Letter Engine</h2>
    </div>
    <div class="screen-actions">
      <button type="button" class="btn btn-primary" id="btn-open-request-letter">
        + Request New Recommendation
      </button>
    </div>
  </div>

  <!-- Recommendation Hero Card -->
  <div class="welcome-card" style="background: linear-gradient(135deg, #151515 0%, #2a151b 100%);">
    <div class="welcome-content">
      <span class="eyebrow" style="color: #fca5a5;">INSTANT LETTER SYNTHESIS</span>
      <h2>Cut letter writing turnaround from 10 days to minutes.</h2>
      <p>The system auto-compiles your Dean's List standing, cumulative GPA, and faculty-verified achievements into an editable draft for your lecturer.</p>
    </div>
  </div>

  <!-- Generated Letter Preview Area -->
  <article class="card" style="margin-top: 2rem;">
    <div class="card-header">
      <h3 class="card-title">Simulated Recommendation Draft (AU Official Letterhead)</h3>
      <button type="button" class="btn btn-secondary" onclick="window.print()">Print Official Letter</button>
    </div>
    <div class="recommendation-letter-box" id="recommendation-letter-preview" style="background: #fafafa; border: 1px solid #e2e8f0; padding: 2rem; font-family: var(--font-heading); line-height: 1.8;">
      <div style="border-bottom: 2px solid var(--au-red); padding-bottom: 1rem; margin-bottom: 1.5rem;">
        <strong style="color: var(--au-red); font-size: 1.25rem;">AFRICA UNIVERSITY &bull; FACULTY OF ENGINEERING</strong>
        <p style="font-size: 0.8125rem; font-family: var(--font-body); color: var(--text-muted); margin: 0;">Academic Reference &amp; Verified Credential Statement</p>
      </div>
      <p><strong>To the Admissions / Selection Committee,</strong></p>
      <p>I am pleased to provide this official academic recommendation for <strong>Wayne Matongera (Student ID: AU250444)</strong>, currently enrolled in the Bachelor of Science (Honours) in Computer Science program at Africa University.</p>
      <p>Wayne has maintained an exemplary academic record with a cumulative GPA of <strong>3.84 / 4.00</strong>, earning a confirmed position on the <strong>Dean's Honour Roll</strong>. Through verified coursework in Web Technologies (WTS201) and Data Structures (CSC201), he has demonstrated superior analytical ability and technical execution.</p>
      <p>Beyond classroom excellence, the Africa University Student Verification Registry confirms his leadership as <strong>Vice Lead of the Google Developer Student Club (GDSC)</strong> and <strong>1st Runner Up in the Campus Solution Challenge 2025</strong>.</p>
      <p>I recommend him without reservation.</p>
      <div style="margin-top: 2rem;">
        <strong>Dr. C. T. Chimedza, Ph.D.</strong><br>
        <span style="font-size: 0.875rem; color: var(--text-muted);">Senior Lecturer &amp; Academic Supervisor &bull; Africa University</span>
      </div>
    </div>
  </article>
</section>
```

---

## 4. Jordy Musul (240439) &mdash; Attachment Supervisor Workplace Portal
* **Role**: Frontend Developer & Form Integrator
* **Branch**: `jordy/attachment-supervisor`
* **Workshop Reference**: Section 4.5 (Team 7: Industrial Attachment Supervisor requirements: attendance log, tasks/projects, 1–5 performance evaluations, progress reports)

### User Story
> *As an industrial attachment supervisor, I want to record student attendance, monitor assigned duties, and rate technical competencies so that Africa University receives a structured assessment of workplace performance.*

### Deliverables & Features to Build
1. **Industrial Attachment Dashboard**:
   - Workplace details: Organization name, Company Supervisor, Start/End dates.
2. **Weekly Attendance Tracker**:
   - Table displaying days, check-in time, check-out time, hours completed, and attendance status (*Present, Late, Excused Absence*).
3. **Tasks & Duty Log**:
   - Task name, assigned deadline, status (*In Progress, Completed, Under Review*), and supervisor feedback.
4. **Supervisor Competency Evaluation Form**:
   - Rating matrix (1 to 5 stars) covering:
     1. Technical & Coding Skills
     2. Communication & Reporting
     3. Team Collaboration
     4. Problem Solving & Initiative
     5. Punctuality & Time Management
   - Written supervisor remarks & final employment recommendation toggle.

### Exact Code Implementation

#### In `index.html` (Attachment Section):
```html
<section class="screen-view" id="view-attachment" aria-labelledby="heading-attachment">
  <div class="screen-header">
    <div>
      <div class="screen-eyebrow">INDUSTRIAL ATTACHMENT &bull; TEAM 7 FINDINGS</div>
      <h2 class="screen-title" id="heading-attachment">Workplace Attachment &amp; Supervisor Log</h2>
    </div>
    <div class="screen-actions">
      <span class="badge badge-verified">Company: Econet Wireless Innovations Lab</span>
    </div>
  </div>

  <!-- Attendance & Tasks Grid -->
  <div class="overview-grid-2col">
    <!-- Weekly Attendance Card -->
    <article class="card">
      <div class="card-header">
        <h3 class="card-title">Weekly Attendance Log</h3>
        <span class="badge badge-completed">100% Attendance Rate</span>
      </div>
      <table class="courses-table" style="font-size: 0.8125rem;">
        <thead>
          <tr>
            <th>Date</th>
            <th>Check In</th>
            <th>Check Out</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Mon, 22 Jun</td>
            <td>08:00 AM</td>
            <td>04:30 PM</td>
            <td><span class="badge badge-completed">Present</span></td>
          </tr>
          <tr>
            <td>Tue, 23 Jun</td>
            <td>07:55 AM</td>
            <td>04:30 PM</td>
            <td><span class="badge badge-completed">Present</span></td>
          </tr>
          <tr>
            <td>Wed, 24 Jun</td>
            <td>08:05 AM</td>
            <td>04:45 PM</td>
            <td><span class="badge badge-completed">Present</span></td>
          </tr>
        </tbody>
      </table>
    </article>

    <!-- Workplace Tasks -->
    <article class="card">
      <div class="card-header">
        <h3 class="card-title">Assigned Projects &amp; Duties</h3>
        <span class="badge badge-current">2 In Progress</span>
      </div>
      <div class="activity-timeline">
        <div class="activity-item">
          <div class="activity-dot verified"></div>
          <div class="activity-body">
            <strong>REST API Gateway Integration</strong>
            <span>Completed microservice authentication layer</span>
            <time>Verified by Workplace Supervisor</time>
          </div>
        </div>
        <div class="activity-item">
          <div class="activity-dot pending"></div>
          <div class="activity-body">
            <strong>Customer Portal Usability Audit</strong>
            <span>Synthesizing feedback from 12 client interviews</span>
            <time>Due Friday</time>
          </div>
        </div>
      </div>
    </article>
  </div>

  <!-- Supervisor Performance Ratings Matrix -->
  <article class="card" style="margin-top: 1.5rem;">
    <div class="card-header">
      <h3 class="card-title">Supervisor Assessment Ratings (1 to 5 Scale)</h3>
      <span class="badge badge-verified">Overall Rating: 4.8 / 5.0</span>
    </div>
    <div class="definition-grid two-col-desktop">
      <div class="definition-item">
        <dt>Technical &amp; Computer Skills</dt>
        <dd>★★★★★ 5.0 &bull; Exceptional problem solving</dd>
      </div>
      <div class="definition-item">
        <dt>Communication &amp; Professional Reporting</dt>
        <dd>★★★★☆ 4.5 &bull; Very clear written updates</dd>
      </div>
      <div class="definition-item">
        <dt>Cooperation &amp; Team Collaboration</dt>
        <dd>★★★★★ 5.0 &bull; Highly proactive in team scrums</dd>
      </div>
      <div class="definition-item">
        <dt>Future Employment Recommendation</dt>
        <dd style="color: var(--status-verified); font-weight: 700;">✓ Highly Recommended for Graduate Hire</dd>
      </div>
    </div>
  </article>
</section>
```

---

## 5. Theophany Bandure (252012) &mdash; Privacy, Expiring Links & Audit Log
* **Role**: Security & Frontend Accessibility Specialist
* **Branch**: `theophany/privacy-security`
* **Workshop Reference**: Sections 4.6 & 4.7 (Teams 1, 2, 6: Student data ownership, expiring shareable links, instant revocation, access audit log)

### User Story
> *As a privacy-conscious student, I want to share my profile via a time-limited link that I can revoke at any time, and see an audit trail of who has viewed my credentials.*

### Deliverables & Features to Build
1. **Shareable Portfolio Link Generator Modal**:
   - Expiry selector: *24 Hours, 7 Days, 30 Days, or Until Revoked*.
   - Scope checkboxes:
     - `[x] Include Verified Achievements`
     - `[x] Include Academic Standing & GPA`
     - `[ ] Include Personal Phone & Hall Address` (Disabled by default for privacy)
   - "Generate Link" button with simulated clipboard copy.
   - "Revoke Link Immediately" button.
2. **Access Audit Trail ("Who Viewed My Profile")**:
   - Table logging: Date/Time, Viewer Organization, Shared Scope, and Link Expiry Status.
3. **In-App Notification Center**:
   - Bell icon button in the header showing an unread badge indicator.
   - Dropdown list with alerts for verified credentials, letters approved, and link views.

### Exact Code Implementation

#### In `index.html` (Share Link Modal & Audit Log Section):
```html
<!-- Inside #view-contact or as dedicated Privacy Card: -->
<article class="card" style="margin-top: 1.5rem;">
  <div class="card-header">
    <div class="card-title-group">
      <div class="card-icon-bubble">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
      </div>
      <h3 class="card-title">Expiring Share Links &amp; Access Controls</h3>
    </div>
    <button type="button" class="btn btn-primary" id="btn-open-share-modal">
      Create Time-Limited Link
    </button>
  </div>

  <p style="font-size: 0.8125rem; color: var(--text-muted);">
    You control who sees your achievements. Create an authenticated link for an employer or graduate school with an automatic expiration date.
  </p>

  <!-- Access Audit Log Table -->
  <div class="table-responsive" style="margin-top: 1.25rem;">
    <table class="courses-table" style="font-size: 0.8125rem;">
      <thead>
        <tr>
          <th>Viewer Identity / Entity</th>
          <th>Access Scope</th>
          <th>Time Accessed</th>
          <th>Status</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Econet Innovations Recruitment</strong></td>
          <td>Verified Achievements &amp; Projects</td>
          <td>Today, 14:22</td>
          <td><span class="badge badge-completed">Active (Expires in 4 days)</span></td>
          <td><button type="button" class="btn-reset-demo" onclick="showToast('Access revoked.')">Revoke</button></td>
        </tr>
        <tr>
          <td><strong>University of Cape Town Admissions</strong></td>
          <td>Full Academic Standing &amp; Transcript</td>
          <td>Yesterday, 09:15</td>
          <td><span class="badge badge-outstanding">Expired</span></td>
          <td>&mdash;</td>
        </tr>
      </tbody>
    </table>
  </div>
</article>

<!-- Modal: #modal-share-link -->
<div class="modal-backdrop" id="modal-share-link" role="dialog" aria-modal="true">
  <div class="modal-window" style="max-width: 500px;">
    <div class="modal-header">
      <h2>Generate Expiring Profile Link</h2>
      <button type="button" class="modal-close-btn" id="modal-share-close">&times;</button>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <label class="form-label">Link Expiration Duration</label>
        <select id="share-expiry-select" class="form-select">
          <option value="24h">Expires in 24 Hours</option>
          <option value="7d" selected>Expires in 7 Days</option>
          <option value="30d">Expires in 30 Days</option>
          <option value="manual">Active Until Manually Revoked</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Audience Visibility Scope</label>
        <label style="display: block; font-size: 0.8125rem; margin-bottom: 6px;">
          <input type="checkbox" checked disabled> Verified Achievements &amp; Certifications
        </label>
        <label style="display: block; font-size: 0.8125rem; margin-bottom: 6px;">
          <input type="checkbox" checked> GPA &amp; Academic Honours
        </label>
        <label style="display: block; font-size: 0.8125rem; color: var(--text-muted);">
          <input type="checkbox"> Include Private Contact Details (Phone, Hall)
        </label>
      </div>
      <div id="share-link-result" style="display: none; background: var(--bg-subtle); padding: 12px; border-radius: var(--radius-md); font-size: 0.8125rem; word-break: break-all;">
        <strong>Generated Secure Link:</strong><br>
        <code>https://africau.edu/passport/verify?token=au_sec_9942a78f</code>
      </div>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-secondary" id="modal-share-cancel">Cancel</button>
      <button type="button" class="btn btn-primary" id="btn-generate-link">Copy Secure Link</button>
    </div>
  </div>
</div>
```

#### In `script.js` (Share Link Generator Logic):
```javascript
const btnGenerateLink = document.getElementById('btn-generate-link');
if (btnGenerateLink) {
  btnGenerateLink.addEventListener('click', () => {
    const resultBox = document.getElementById('share-link-result');
    resultBox.style.display = 'block';
    btnGenerateLink.textContent = 'Copied to Clipboard!';
    showToast('Secure expiring link copied to clipboard.');
  });
}
```

---

## Universal Git Workflow Cheatsheet

### 1. Wayne initializes the baseline:
```bash
git add .
git commit -m "feat: initial Africa University student profile baseline prototype"
git branch -M main
git push -u origin main
```

### 2. Every team member pulls from main and creates their branch:
```bash
git clone https://github.com/matongeraw/Group-11-web-tech.git
cd Group-11-web-tech

# Create and switch to your feature branch:
git checkout -b <your-branch-name>
```

### 3. Commit your changes:
```bash
git add .
git commit -m "feat: add assigned workshop module"
git push -u origin <your-branch-name>
```

### 4. Create a Pull Request (PR) on GitHub:
1. Navigate to: `https://github.com/matongeraw/Group-11-web-tech`
2. Click **Compare & pull request**.
3. Add a descriptive summary of your changes and request a peer review.
