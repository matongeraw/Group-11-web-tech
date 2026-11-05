# Installation and setup guide (Windows / VS Code)

## 1. Prerequisites

- Node.js 20 LTS or newer (includes npm).
- Visual Studio Code.
- A Firebase project that you are authorised to administer.
- Git for GitHub publishing.

## 2. Install the project

Open PowerShell in the extracted project folder:

```powershell
npm install
Copy-Item .env.example .env
```

Open `.env` and fill in the six `VITE_FIREBASE_*` values from Firebase Console → Project settings → General → Your apps → Web app. These are browser configuration values, not service-account secrets.

## 3. Configure Firebase Authentication

In Firebase Console:

1. Open **Authentication → Get started → Sign-in method**.
2. Enable **Email/Password**.
3. Add your development and production domains under **Authentication → Settings → Authorized domains**.
4. Use institutional test accounts only. Student addresses must end in `@africau.edu`.

## 4. Configure Firestore and Storage

1. Create a Cloud Firestore database.
2. Create a Storage bucket if profile/document uploads are required.
3. Deploy the supplied rules with Firebase CLI:

```powershell
npm install -g firebase-tools
firebase login
firebase use --add
firebase deploy --only firestore:rules,firestore:indexes,storage
```

The repository contains `firebase/firestore.rules`, `firebase/firestore.indexes.json` and `firebase/storage.rules`. Create a `firebase.json` file or use the Firebase CLI prompts to associate these paths with your Firebase project.

## 5. Configure Firebase Admin for the backend

Create a Firebase service account in Project settings → Service accounts. Download its JSON key and store it **outside this repository**, for example:

`C:\secure\au-student-profile-service-account.json`

Set `GOOGLE_APPLICATION_CREDENTIALS` in `.env` to that full path. Alternatively, set `FIREBASE_SERVICE_ACCOUNT_JSON` to a one-line JSON string. Never commit the service-account key or put it in frontend code.

Set `FIREBASE_STORAGE_BUCKET` to your bucket name and `CLIENT_ORIGIN=http://localhost:5173`.

## 6. Run the application

```powershell
npm run dev:full
```

- Frontend: `http://localhost:5173`
- Backend health: `http://localhost:4000/api/health`

The health response includes `firebaseConfigured`. If false, check the Admin credential path and restart the server. Frontend Firebase configuration is read at Vite startup, so restart Vite after editing `.env`.

To run separately:

```powershell
npm run server
npm run dev
```

To create a production frontend build:

```powershell
npm run build
```

## 7. Student account registration

Use **Create account** on the sign-in screen. The student registers with an `@africau.edu` email, six-digit student ID, full name and password. Firebase Authentication creates the identity; the backend writes a student profile and assigns the `student` custom claim. Configure Firebase email verification and institutional identity checks before public deployment. For a production university system, student IDs must be verified against an authoritative Registry source rather than trusting self-registration.

## 8. Create administrator and lecturer accounts

First create the user in Firebase Authentication (or have them register), then assign the role using the trusted backend service account:

```powershell
npm run set-role -- admin.name@africau.edu admin
npm run set-role -- lecturer.name@africau.edu lecturer
```

The command updates Firebase custom claims and the Firestore user record. The account must sign out and sign in again to refresh its ID token. Keep the administrator service account private. Do not give admin rights to ordinary users.

The supplied interface is currently the student-profile experience. Role-protected API endpoints for listing users, changing account status/roles and creating notifications are included. Separate lecturer/admin user-interface dashboards and page-by-page Firestore persistence are future integration work, not claimed as completed features.

## 9. API overview

| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/health` | Public health status |
| GET | `/api/me` | Authenticated active user |
| POST | `/api/profile/complete-registration` | Firebase-authenticated new user |
| GET | `/api/users` | Admin or lecturer |
| PATCH | `/api/users/:uid/status` | Admin |
| POST | `/api/admin/users/:uid/role` | Admin |
| POST | `/api/admin/notifications` | Admin or lecturer |

Authenticated endpoints require `Authorization: Bearer <Firebase ID token>`.

## 10. GitHub publishing

```powershell
git init
git add .
git commit -m "Initial student profile portal"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

Check `git status` and confirm `.env`, service-account JSON files and `node_modules` are not staged. `.gitignore` is included. Upload the source ZIP or push the extracted project folder; do not upload secrets.

## 11. Deployment

Build the frontend with `npm run build`. Deploy the frontend to Firebase Hosting or another static host and deploy the Express API to a Node-compatible host (Cloud Run, App Hosting, or another managed service). Set production environment variables and service-account permissions in the hosting provider's secret manager. Configure `CLIENT_ORIGIN`, Firebase authorized domains, HTTPS, and the production API URL. Do not use development credentials in production.

## 12. Testing checklist

- [ ] `npm run build` completes without TypeScript/build errors.
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
