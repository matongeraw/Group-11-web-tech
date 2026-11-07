# Africa University Student Profile Portal

Responsive student profile portal based on the supplied Figma Make prototype. The React/Vite interface and original visual assets are retained. The project adds Firebase Authentication, Firestore and Storage configuration, an Express API, role-aware server authorization, security rules, and VS Code setup.

## Current implementation status

- **Frontend:** React + TypeScript + Vite. The supplied Figma prototype is retained, including its navigation, student profile sections, courses, progress, activities, achievements, projects, contact, calendar and notifications.
- **Authentication:** Firebase email/password sign-in, verified institutional email, account creation, and password reset. Self-registration creates a pending account; an administrator must confirm institutional identity before activation.
- **Backend:** Express API with revoked-token checks, current Firestore role/status authorization, input validation, rate limiting, security headers and role-protected endpoints. Lecturer student listings are limited to active review assignments.
- **Roles:** `student`, `lecturer`, and `admin` are stored as Firebase custom claims and mirrored in Firestore. Admin-only role/status management is enforced by the API, not just by hiding interface controls.
- **Database and storage:** Firestore and Storage rules deny privileged writes from clients, protect verification records, and restrict evidence to owners, admins, and assigned lecturers. Firebase Emulator Suite configuration and automated authorization tests use the isolated `demo-myau-passport` project.
- **API architecture:** Routes, controllers, middleware, validators, services, and Firestore data access are separated. Typed frontend models, a runtime-validated API client, and a reusable async loading/success/empty/error state hook are available for incremental migration.

## Important prototype limitations

The Figma design contains sample academic records, example courses, dates, CGPA values and activity information. These are retained as clearly labelled prototype content and are **not verified Africa University records**. Not every original profile edit, document, timetable or course action has yet been migrated from local prototype state to Firestore. The API and Firebase foundations are provided, but live data persistence for each page requires the institution's approved data model and Firebase project credentials. Do not treat demo values as official academic results.

No production Firebase project is configured. Firebase connectivity, registration, login, database writes, Storage uploads and role permissions have not been tested against a live project. Local emulator tests use generated test users only. The API health endpoint reports whether the backend can initialize Firebase; a true value does not prove live service connectivity.

## Quick start

1. Install Node.js 20 or 22 LTS and Java 21 LTS for Firebase emulators. Firebase CLI dependencies currently warn on Node.js 24.
2. Extract this ZIP and open the `Student_Profile_Full_Project` folder in VS Code.
3. Run `npm install`.
4. Copy `.env.emulator.example` to `.env`; it contains demo-only settings and no real credentials.
5. In one terminal run `npm run emulators`.
6. In a second terminal run `npm run dev:full`.
7. Open `http://localhost:5173`.

Run `npm test` to start the demo Auth, Firestore, and Storage emulators and execute the backend and security authorization tests without real Firebase credentials. See [INSTALLATION.md](INSTALLATION.md) for local setup and future deployment notes.
