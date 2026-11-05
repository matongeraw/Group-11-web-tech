# Team 11 Development Starting Guide
## AU Student Achievement & Recommendation Profile (MyAU Passport)
**SOE2103 Web Technologies & Requirements Engineering**

---

## 1. Origin Confirmation & Git Architecture

### Can we use the current prototype as the `origin` base?
**YES, absolutely.** 

The website created in the workspace is the ideal **baseline origin (`main`)** for everyone to pull from:
1. **Full Brand Identity**: Africa University Red, Black & White design tokens, typography (Inter & Merriweather), campus hero graphics, and AU crest logos are already configured.
2. **Reusable Component Architecture**: Cards, badges, modals, tab filters, progress bars, and forms are fully responsive down to 360px.
3. **Clean Codebase**: It is written in standard semantic HTML5, modern CSS3 variables, and vanilla JavaScript (no npm build steps required to run).

### How Wayne (Lead) Initializes `origin/main`:
Once the team is ready to push this baseline to GitHub:
```bash
# 1. Stage all baseline files
git add .

# 2. Make the initial baseline commit
git commit -m "feat: initial AU student profile baseline prototype"

# 3. Ensure branch is named main
git branch -M main

# 4. Push baseline to GitHub origin
git push -u origin main
```

---

## 2. Team Member Work Breakdown Based on Workshop Findings

Based on the **Compiled Workshop Findings (Teams 1–7)**, the system needs five major enhancements:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        MyAU PASSPORT ECOSYSTEM                         │
├────────────────────┬────────────────────┬──────────────────────────────┤
│ Wayne (Lead)       │ Nothando           │ Natasha                      │
│ Role Switching     │ Achievement Log &  │ Recommendation Letter Engine │
│ & Global Nav Shell │ Evidence Review    │ & Auto-Drafting              │
├────────────────────┴────────────────────┼──────────────────────────────┤
│ Jordy                                   │ Theophany                    │
│ Industrial Attachment Supervisor Portal │ Privacy, Expiring Links      │
│ (Team 7 Findings)                       │ & Access Audit Log           │
└─────────────────────────────────────────┴──────────────────────────────┘
```

---

## 3. Step-by-Step Task Assignment & Starting Place for Everyone

### Member 1: Wayne Matongera (250444) &mdash; Team Lead & System Architecture
* **Branch**: `wayne/role-architecture`
* **Focus Area**: Multi-role switcher, baseline review, and repository coordination.
* **Requirements to Implement**:
  - Add a **Role Selector** dropdown or toggle in the top bar:
    1. *Student / Alumni* (default profile view)
    2. *Lecturer / Verifier* (review queue view)
    3. *Attachment Supervisor* (workplace tracking view)
    4. *External Recipient / Employer* (scoped view)
  - Dynamically toggle which navigation items and action buttons are visible depending on the active role.
* **Where to start in the code**:
  - `index.html`: Update `<div class="persona-switcher">` to support a role dropdown or expand the persona switch.
  - `script.js`: Create `function switchActiveRole(role)` to hide/show sections based on current user role.

---

### Member 2: Nothando V Makova (250764) &mdash; Achievement Logging & Verification
* **Branch**: `nothando/achievement-logging`
* **Focus Area**: Section 4.1 & 4.2 of Workshop Findings (Teams 1, 3, 5).
* **Requirements to Implement**:
  - **"Log New Achievement" Form Modal**:
    - Fields: Title, Category (Academic Awards, Dean's List, Leadership, Sports, Volunteering, Certifications, Conferences), Date, Issuing Body, and Evidence Description / Link.
    - Level radio buttons: *Major, Moderate, Minor* (for reporting per Team 5).
  - **3-State Verification Workflow**:
    - Achievements must display status tags: `<span class="badge badge-pending">Pending</span>`, `<span class="badge badge-verified">Verified</span>`, or `<span class="badge badge-rejected">Rejected</span>`.
    - If rejected, display the verifier's rejection reason (e.g., *"Please attach official certificate"*).
  - **Verification Action (Lecturer Mode)**:
    - Quick "Verify" and "Request Changes / Reject" buttons visible when logged in as a Lecturer.
* **Where to start in the code**:
  - `index.html`: Under `<section id="view-achievements">`, add a `+ Log New Achievement` button and a dedicated modal `#modal-add-achievement`.
  - `script.js`: Add `achievementsData` array and an `addAchievement(data)` function that appends new cards with dynamic status badges.

---

### Member 3: Natasha Nyamutsaka (250426) &mdash; Recommendation Letter Engine
* **Branch**: `natasha/recommendation-engine`
* **Focus Area**: Section 4.4 of Workshop Findings (Teams 1, 2, 3, 4, 6).
* **Requirements to Implement**:
  - **Student Request Flow**:
    - "Request Recommendation Letter" modal:
      - Purpose: Academic Reference, Scholarship, Job Application, Postgraduate Study.
      - Key points text area (student drafts personal highlights).
      - Checkboxes to select which **Verified Achievements** to attach to this request.
      - Target due date.
  - **Lecturer Auto-Drafting View**:
    - Auto-generated formal recommendation letter template pulling in the student's name, degree, GPA (3.84), and only the verified achievements selected by the student.
    - Editable text area so the lecturer can customize and approve.
    - "Download Official PDF" button.
* **Where to start in the code**:
  - `index.html`: Add a new navigation section `<section id="view-recommendations">` in sidebar & main area.
  - `script.js`: Write `generateLetterDraft(student, selectedAchievements)` to build the letter template automatically.

---

### Member 4: Jordy Musul (240439) &mdash; Attachment Supervisor Module
* **Branch**: `jordy/attachment-supervisor`
* **Focus Area**: Section 4.5 of Workshop Findings (Team 7 Attachment Supervisor Report).
* **Requirements to Implement**:
  - **Industrial Attachment Log Section**:
    - **Attendance Tracker**: Weekly log of days attended, hours, arrival/departure, and absences.
    - **Assigned Tasks & Projects**: Table of assigned duties, deadlines, completion status, and student submissions.
    - **Supervisor Assessment Form**:
      - Ratings (1 to 5 stars or scale) for *Technical Skills, Communication, Teamwork, Problem Solving, and Punctuality*.
      - Written supervisor comments and final recommendation for future employment.
* **Where to start in the code**:
  - `index.html`: Add `<section id="view-attachment">` accessible from the sidebar.
  - `style.css`: Add styles for rating stars, attendance badges, and supervisor review cards.
  - `script.js`: Add sample attendance data and interactive task completion toggles.

---

### Member 5: Theophany Bandure (252012) &mdash; Privacy, Expiring Links & Audit Log
* **Branch**: `theophany/privacy-security`
* **Focus Area**: Section 4.6 & 4.7 of Workshop Findings (Teams 1, 2, 6).
* **Requirements to Implement**:
  - **Sharable Link Generator**:
    - "Generate Portfolio Link" modal with:
      - Expiry selection (24 hours, 7 days, 30 days, or Until Revoked).
      - Scope selector: What to include (*All Verified*, *Academic Only*, *Hide Contact Details*).
      - "Revoke Access" button to immediately disable a shared link.
  - **Access Audit Log (Who Viewed My Profile)**:
    - Table/list displaying recent profile views: Viewer Role, Date/Time, and Access Status.
  - **In-App Notification Center**:
    - Dropdown bell icon in the topbar showing real-time notifications (e.g. *"Dr. Chimedza approved your CCNA achievement"*, *"Employer viewed your shared link"*).
* **Where to start in the code**:
  - `index.html`: Add a Privacy & Sharing panel or integrate into the Contact & Vault screen; add a notification bell `<button id="btn-notifications">` in `.topbar-actions`.
  - `script.js`: Implement `generateShareLink()` with simulated copy-to-clipboard and the view history log.

---

## 4. Universal Team Git Workflow Cheatsheet

Every member should execute these commands on their computer:

### Step 1: Clone the repository (once Wayne has pushed `main`):
```bash
git clone https://github.com/matongeraw/Group-11-web-tech.git
cd Group-11-web-tech
```

### Step 2: Create your assigned feature branch:
```bash
# Wayne:
git checkout -b wayne/role-architecture

# Nothando:
git checkout -b nothando/achievement-logging

# Natasha:
git checkout -b natasha/recommendation-engine

# Jordy:
git checkout -b jordy/attachment-supervisor

# Theophany:
git checkout -b theophany/privacy-security
```

### Step 3: Test changes locally
Open `index.html` in your browser (or use VS Code "Live Server").

### Step 4: Commit and push your feature branch:
```bash
git add .
git commit -m "feat: implement assigned workshop module"
git push -u origin <your-branch-name>
```

### Step 5: Open a Pull Request (PR)
1. Go to `https://github.com/matongeraw/Group-11-web-tech`.
2. Click **Compare & pull request**.
3. Tag another group member to review your code before merging into `main`.
