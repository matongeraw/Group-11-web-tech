# Africa University Student Profile Portal

Responsive student profile portal based on the supplied Figma Make prototype. The React/Vite interface and original visual assets are retained. The project adds Firebase Authentication, Firestore and Storage configuration, an Express API, role-aware server authorization, security rules, and VS Code setup.

## Current implementation status

- **Frontend:** React + TypeScript + Vite. The supplied Figma prototype is retained, including its navigation, student profile sections, courses, progress, activities, achievements, projects, contact, calendar and notifications.
- **Authentication:** Firebase email/password sign-in, account creation for student users, and password reset. Only `@africau.edu` addresses are accepted in the UI.
- **Backend:** Express API with Firebase Admin token verification, input validation, rate limiting, security headers and role-protected endpoints.
- **Roles:** `student`, `lecturer`, and `admin` are stored as Firebase custom claims and mirrored in Firestore. Admin-only role/status management is enforced by the API, not just by hiding interface controls.
- **Database and storage:** Firestore and Storage rules are included. Firebase configuration and credentials are not included.

## Important prototype limitations

The Figma design contains sample academic records, example courses, dates, CGPA values and activity information. These are retained as clearly labelled prototype content and are **not verified Africa University records**. Not every original profile edit, document, timetable or course action has yet been migrated from local prototype state to Firestore. The API and Firebase foundations are provided, but live data persistence for each page requires the institution's approved data model and Firebase project credentials. Do not treat demo values as official academic results.

No Firebase project credentials were supplied, so Firebase connectivity, registration, login, database writes, Storage uploads and role permissions have not been tested against a live project. The API health endpoint reports whether the backend can initialize Firebase.

## Quick start

1. Install Node.js 20 LTS or newer.
2. Extract this ZIP and open the `Student_Profile_Full_Project` folder in VS Code.
3. Run `npm install`.
4. Copy `.env.example` to `.env` and add the Firebase web app configuration values.
5. Configure backend Firebase Admin credentials as described in `INSTALLATION.md`.
6. Run `npm run dev:full`.
7. Open `http://localhost:5173`.

See [INSTALLATION.md](INSTALLATION.md) for full Firebase setup, user roles, testing and deployment.
