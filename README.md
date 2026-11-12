# AU Veritas (MyAU Passport) — Africa University
### SOE2103 Web Technologies &amp; Requirements Engineering &bull; Group 11

**A Lifetime Student Identity, Academic Standing &amp; Verified Evidence Ecosystem**

---

## 1. Project Overview

**AU Veritas (MyAU Passport)** is a rapid prototype portal gathering a student's entire university journey into a single verified, tamper-evident digital profile: personal details, academic standing, course progress, competencies, extracurricular activities, verified achievements, industrial attachment logbooks, automated recommendation letter drafting, and official transcript sealing.

Unlike a conventional registry screen or unverified CV/LinkedIn page, it follows the student through graduation into alumni life, establishing institutional provenance and verified evidence for employers and postgraduate institutions.

### Prototype Demo Credentials & Roles
| Role | Identifier / Email | Password | Primary Purpose |
|:---|:---|:---|:---|
| **Student** | `250444` / `matongeraw@africau.edu` | `student250444` | Profile view, achievement logging, recommendation requests, attachment status |
| **Faculty Verifier** | `250731` / `chimedzac@africau.edu` | `faculty2026` | Verification queue, proof inspection, recommendation letter drafting & signing |
| **Academic Registry** | `240618` / `registry@africau.edu` | `registryAdmin2026` | Official transcript sealing, holds management, verifier governance, immutable audit trail |

### Connected Prototypes
- **Interactive Figma Make Prototype**: [cerise-round-80477491.figma.site](https://cerise-round-80477491.figma.site)
- **Figma Design Project**: [Figma Make File](https://www.figma.com/make/K6hUxLMzzCqL9IncLTAbgx/Student-Profile-Rapid-Prototype?p=f&t=ajcF3H2WJ2eIUwoe-0)
- **Official GitHub Repository**: [matongeraw/Group-11-web-tech](https://github.com/matongeraw/Group-11-web-tech)

---

## 2. Team 11 Group Members

| No. | Student Full Name | Registration No. | Role & Contribution |
|:---:|:---|:---:|:---|
| 1 | **Wayne Matongera** | 250444 | Team Lead, Core Layout &amp; Project Integration |
| 2 | **Nothando V Makova** | 250764 | Personal &amp; Academic Info Cards, Course Structure |
| 3 | **Natasha Nyamutsaka** | 250426 | Academic Progress Gauges &amp; Extracurriculars |
| 4 | **Jordy Musul** | 240439 | Achievements, Document Vault &amp; Modals |
| 5 | **Theophany Bandure** | 252012 | Request Form Validation &amp; Student/Alumni Switch |

---

## 3. Visual Identity & Design Direction

Following the design brief given to **Figma Make**:
- **Palette**: Red, Black, and White brand palette inspired by Africa University.
  - White main backgrounds and cards (`#FFFFFF`, canvas: `#F8F9FA`).
  - Charcoal black for headers and high-contrast typography (`#151515`, `#222226`).
  - AU Crimson Red (`#B5122B`, `#8F1024`) for active navigation, buttons, highlights, badges, and progress indicators.
- **Typography**: Google Fonts **Inter** (clean body text and UI labels) paired with **Merriweather** (distinguished serif headings).
- **Cards & Elements**: Generous whitespace, rounded cards (`border-radius: 14px`), subtle drop shadows, and responsive layout scaling down to 360px mobile viewports.
- **Branding**: Prominent Africa University crest and campus photography banner.

---

## 4. Key Prototype Features & Connected Screens

The portal features a **10-item navigation sidebar** and **9 connected screen views**:

1. **Student Profile Overview**:
   - Quick statistics cards: Cumulative GPA (3.84 / 4.0), Credits Completed (32 / 144), Verified Accreditations (5), and Showcase Projects (3).
   - Welcome banner and degree progress overview.
   - Recent activity audit timeline and quick-action shortcuts.
2. **Personal Information**:
   - Two-column responsive card marked with a private registry badge.
   - Date of birth, gender, nationality, phone, email, campus hall residence, and emergency contact.
3. **Academic Information**:
   - Highlighted visual cards for Cumulative GPA (3.84) and Dean's Honour Roll standing (First Class pace).
   - Degree programme, faculty, department, academic level, and advisor information.
4. **Courses / Modules**:
   - Filterable curriculum table: All, Current (In Progress), Completed, and Outstanding.
   - Detailed modules including *WTS201 Web Technologies*, *STA201 Applied Statistics*, *CIS202 Mobile Applications*, and *CSC201 Data Structures*.
   - "Request Official Transcript" interactive trigger button.
5. **Academic Progress**:
   - Circular SVG graduation progress gauge (animates between 22% and 100%).
   - Horizontal credit breakdown bars: Completed (32), Current (20), and Outstanding (92).
   - Projected graduation year indicator.
6. **Skills &amp; Interests**:
   - Visual chip groups for *Programming*, *Web Development*, *Database Management*, *UI/UX Design*, *AI & IoT*, and *Leadership*.
7. **Extracurricular Activities**:
   - Compact cards for Google Developer Student Club (GDSC), Innovation Society, Peer Learning Circle, and AU Intramural Basketball.
8. **Achievements &amp; Certifications**:
   - Verified credentials with dates, issuing authorities, and verification IDs (Dean's Honour Roll, Cisco CCNA, GDSC Solution Challenge).
9. **Projects Showcase**:
   - Featured cards with technology badges, student roles, descriptions, and direct repository links.
10. **Contact, Document Vault &amp; Validated Request Form**:
    - Direct communication links (email, LinkedIn, GitHub).
    - Document vault with sample transcript summaries and registration certificates.
    - **Interactive Request Form** with real-time validation:
      - Validates non-empty legal full name.
      - Enforces Student ID format: `AU` followed by 6 digits (`/^AU\d{6}$/`).
      - Validates standard email address format.
      - Confirms document request selection with ARIA live feedback.
11. **Edit Profile Modal**:
    - Interactive dialog allowing instant live updates to name, programme, bio, contact details, and address.
12. **Current Student vs. Alumni (2029) Switch**:
    - Switches the profile between active student status and graduated alumni status.
    - Dynamically updates the status badge, graduation year, credit counter (144 / 144), and fills progress gauges to 100%.

---

## 5. Technology Stack

- **HTML5**: Semantic document structure (`<header>`, `<nav>`, `<main>`, `<section>`, `<aside>`, `<dl>`, `<table>`, `<form>`), skip-to-content accessibility link, and ARIA live regions.
- **CSS3**: CSS custom properties (variables), responsive flexbox and CSS grid layouts, smooth transitions, print stylesheet, and visible `:focus-visible` focus outlines.
- **JavaScript (ES6+)**: View switching, mobile drawer navigation, live form validation, dynamic persona switching, modal management, and accessible toast notifications.
- **Google Fonts**: Inter &amp; Merriweather.
- **Git &amp; GitHub**: Version control and team branch-and-PR workflow.

---

## 6. Project Structure

```
.
├── AU_logo.png                  # Africa University Crest
├── assets/
│   ├── africa_university_logo.png # High-res university branding logo
│   ├── campus-hero.png          # Africa University campus banner image
│   ├── student_avatar.png       # Student profile avatar fallback
│   └── wayne_avatar.png         # Team lead profile photo
├── index.html                   # Semantic markup for all 9 screens & modals
├── style.css                    # Design tokens, layout, typography & media queries
├── script.js                    # Interaction, persona toggle, validation & modals
├── .gitignore                   # System, editor, and build ignore rules
└── README.md                    # Project documentation & team attribution
```

---

## 7. How to Run Locally

1. Clone or download this repository:
   ```bash
   git clone https://github.com/matongeraw/Group-11-web-tech.git
   cd Group-11-web-tech
   ```
2. Open `index.html` in any modern web browser, or launch it with VS Code Live Server.

---

## 8. Git Collaboration Workflow

To ensure clean teamwork and peer review:
1. Ensure your local branch is synchronized with main:
   ```bash
   git pull origin main
   ```
2. Create a feature branch:
   ```bash
   git checkout -b <your-name>/<feature-name>
   ```
3. Make your edits and stage the files:
   ```bash
   git add .
   git commit -m "feat: descriptive commit message"
   ```
4. Push your branch to GitHub:
   ```bash
   git push -u origin <your-name>/<feature-name>
   ```
5. Open a Pull Request (PR) on GitHub and request a peer review from another team member before merging into `main`.
