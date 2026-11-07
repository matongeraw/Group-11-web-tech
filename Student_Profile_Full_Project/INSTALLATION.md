# Installation and setup guide (Windows / VS Code)

## 1. Prerequisites

- Node.js 20 or 22 LTS (includes npm). Firebase CLI dependencies currently warn on Node.js 24.
- Java 21 LTS for Firebase Emulator Suite.
- Visual Studio Code.
- Git for GitHub publishing.

## 2. Install the project

Open PowerShell in the extracted project folder:

```powershell
npm install
Copy-Item .env.emulator.example .env
```

The emulator template selects the isolated `demo-myau-passport` project and uses demo-only client values. It requires no Firebase account, project credentials, or service-account key. The checked-in `.firebaserc` defaults to this demo project to reduce the risk of accidentally deploying emulator configuration to a live project.

## 3. Start local emulators and the app

In the first PowerShell terminal:

```powershell
npm run emulators
```

In a second terminal:

```powershell
npm run dev:full
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`
- Emulator Auth, Firestore, and Storage: ports `9099`, `8080`, and `9199`.

For automated tests, `npm test` starts the same demo emulators, runs the API and security suites, then stops the emulators. It does not create a real Firebase project or use real student data.

## 4. Configure a future non-production Firebase project

Live project configuration is intentionally not part of this phase. Before connecting any non-demo project, the university must approve the data model, identity-verification process, assignment policy, and least-privilege service-account permissions.

For a separately authorized non-production project only, configure Firebase Authentication email/password, authorized domains, Firestore, and Storage through Firebase Console. Deploy the reviewed `firebase/firestore.rules`, `firebase/firestore.indexes.json`, and `firebase/storage.rules` only after confirming the target project and approval.

## 5. Configure Firebase Admin for a future non-production backend

Use an institution-approved service account and store its key **outside this repository**. Set `GOOGLE_APPLICATION_CREDENTIALS` to its path in a private environment or use the hosting provider's secret manager. Alternatively, set `FIREBASE_SERVICE_ACCOUNT_JSON` as a secret. Never commit credentials or put them in frontend code.

The local emulator profile does not use either credential variable. Do not mix emulator hosts or a `demo-` project ID with live project credentials.

```powershell
npm run build
npm run lint
```

## 6. Student account registration

Use **Create account** on the sign-in screen. An `@africau.edu` email must be verified before the backend accepts registration. Registration reserves a unique six-digit ID and creates a **pending** account; it does not provision active student access or assert that the ID belongs to an enrolled student. An authorized institutional process must review identity before an administrator activates the account. This phase does not connect to a Registry source.

## 7. Create administrator and lecturer accounts

First create the user in Firebase Authentication (or have them register), then assign the role using the trusted backend service account:

```powershell
npm run set-role -- admin.name@africau.edu admin
npm run set-role -- lecturer.name@africau.edu lecturer
```

The command updates Firebase custom claims and the Firestore user record. The account must sign out and sign in again to refresh its ID token. Keep the administrator service account private. Do not give admin rights to ordinary users.

The supplied interface is currently the student-profile experience. Role-protected API endpoints for listing users, changing account status/roles and creating notifications are included. Separate lecturer/admin user-interface dashboards and page-by-page Firestore persistence are future integration work, not claimed as completed features.

## 8. API overview

| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/health` | Public health status |
| GET | `/api/me` | Authenticated active user |
| POST | `/api/profile/complete-registration` | Verified institutional-email token; new UID only; creates pending account |
| GET | `/api/users` | Admin or lecturer assigned to the listed active students |
| PATCH | `/api/users/:uid/status` | Admin |
| POST | `/api/admin/users/:uid/role` | Admin |
| POST | `/api/admin/notifications` | Admin or lecturer |

Authenticated endpoints require `Authorization: Bearer <Firebase ID token>`.

## 9. GitHub publishing

```powershell
git init
git add .
git commit -m "Initial student profile portal"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

Check `git status` and confirm `.env`, service-account JSON files and `node_modules` are not staged. `.gitignore` is included. Upload the source ZIP or push the extracted project folder; do not upload secrets.

## 10. Deployment

Build the frontend with `npm run build`. Deploy the frontend to Firebase Hosting or another static host and deploy the Express API to a Node-compatible host (Cloud Run, App Hosting, or another managed service). Set production environment variables and service-account permissions in the hosting provider's secret manager. Configure `CLIENT_ORIGIN`, Firebase authorized domains, HTTPS, and the production API URL. Do not use development credentials in production.

## 11. Testing checklist

- [ ] `npm run build` completes without TypeScript/build errors.
- [ ] `npm run lint` completes without lint errors.
- [ ] `npm test` executes API and Firestore/Storage security tests with demo emulators.
- [ ] `/api/health` returns `status: ok` and `firebaseConfigured: true`.
- [ ] A student can register using an approved institutional email.
- [ ] A student can sign in and reset their password.
- [ ] An unauthenticated request to `/api/me` is rejected.
- [ ] A student cannot call admin-only endpoints.
- [ ] Lecturer access is limited to the permitted user listing/notification operations.
- [ ] An admin can assign roles and suspend accounts.
- [ ] Firestore and Storage rules are tested with the Firebase Emulator Suite before production.
- [ ] Responsive layout is checked on desktop, tablet and mobile.

Live Firebase tests are not possible until you configure a Firebase project and credentials.
