import 'dotenv/config'
import { createApp } from './app.js'
import { admin, auth, db, firebaseReady } from './config/firebaseAdmin.js'

const PORT = Number(process.env.PORT || 4000)
const app = createApp({ auth, db, admin, firebaseReady })

app.listen(PORT, () => console.log(`Student Profile API listening on http://localhost:${PORT}`))
