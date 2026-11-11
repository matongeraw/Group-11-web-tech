# Database setup (Cloud Firestore)

The static site (`index.html`, `script.js`, `style.css`) can save its data in a shared
cloud database, **Cloud Firestore**, so that every device sees the same data live.

Until the steps below are done the site works exactly as before: data is saved only in
each visitor's own browser, and the top bar shows **Local only**.

## Files

| File | What it is |
|---|---|
| `firebase-config.js` | Your Firebase project settings. `null` = database off. |
| `db.js` | The sync layer between the site and Firestore. No need to edit it. |
| `firestore.rules` | Security rules to paste into the Firebase console. |

## One-time setup (about 5 minutes)

Menu names in the Firebase console change from time to time; look for the closest match.

1. **Create a project.** Go to <https://console.firebase.google.com>, sign in with a Google
   account and click **Create a project** (or **Add project**). Name it, for example,
   `au-student-portal`. You can switch Google Analytics off. The free **Spark** plan is enough.
2. **Create the database.** In the left menu open **Build > Firestore Database** and click
   **Create database**. Pick a location (it cannot be changed later) and choose
   **Start in production mode**.
3. **Publish the rules.** Open the **Rules** tab of Firestore. Delete what is there, paste the
   whole contents of `firestore.rules`, and click **Publish**.
4. **Register the website.** Click the gear icon > **Project settings**. Under **Your apps**
   click the web icon (`</>`), give it a nickname, and click **Register app**. You do not need
   Firebase Hosting.
5. **Copy the config.** Firebase shows a block starting `const firebaseConfig = { ... }`.
   Copy the part between the curly brackets.
6. **Paste it into `firebase-config.js`.** Replace `null` so the line reads
   `window.AU_FIREBASE_CONFIG = { apiKey: "...", authDomain: "...", projectId: "...", ... };`
   then commit and push.
7. **Check it.** Open the site and sign in. The top bar should show **Cloud database** with a
   green dot. In the Firebase console, the Firestore **Data** tab now lists the collections below.
   The first person to open the site fills the empty database with the sample data.

If the pill shows **Database offline**, hover over it for the reason. The usual causes are:
the rules were not published (step 3), the database was not created (step 2), or a typo in
the pasted config.

## What is stored

| Collection | Contents | Used by |
|---|---|---|
| `verifications` | Achievement claims and their status | Lecturer verification queue |
| `referenceLetters` | Recommendation letter drafts | Lecturer reference requests |
| `recommendationRequests` | Letter requests made by students | Recommendations page |
| `transcripts` | Transcript requests, holds and seals | Admin transcripts |
| `verifiers` | Designated verifiers and their status | Admin verifier governance |
| `logbooks` | Weekly attachment logbook entries | Lecturer supervised students |
| `auditTrail` | Every staff action (cannot be edited or deleted) | Admin audit trail |
| `portalState` | Assignment submitted / pending status | Student assignments |

Everything else on the site (profile edits, skills, CV, calendar) is not saved anywhere yet,
with or without the database.

## Things to know

- **Sample data only.** The static site has a demo login, not real accounts, so the rules
  cannot tell a student from a lecturer. Anyone who opens the site can read and change this
  data. Do not store real student records until real sign-in (Firebase Authentication) is added.
- **The config is not a secret.** The values in `firebase-config.js` are public identifiers and
  are meant to be visible in a website. Never commit a service-account or private key.
- **Offline.** Changes made without a connection stay in that browser and are sent the next
  time the site connects.
- **Reset demo data** (admin audit trail) resets the queues for everyone. The audit trail is kept.
- **Free plan limits** (50,000 reads and 20,000 writes a day at the time of writing) are far
  above what a class demo uses.

## Adding another list to the database

1. Save it to `localStorage` as a JSON array of objects that each have an `id`.
2. Add one line to `COLLECTIONS` in `db.js`, for example `auMyList: { name: 'myList' }`.
3. Add a matching `match /myList/{id}` line to `firestore.rules` and publish the rules again.
4. To refresh the page when another device changes it, listen for the `au-db-change` event.
