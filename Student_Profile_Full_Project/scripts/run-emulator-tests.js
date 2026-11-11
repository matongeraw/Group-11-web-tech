import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const projectId = process.env.FIREBASE_PROJECT_ID || 'demo-myau-passport'
if (!projectId.startsWith('demo-')) {
  throw new Error('Emulator tests must use a demo- Firebase project ID.')
}

const vitest = fileURLToPath(new URL('../node_modules/vitest/vitest.mjs', import.meta.url))
const result = spawnSync(process.execPath, [vitest, 'run', '--no-file-parallelism', ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: {
    ...process.env,
    FIREBASE_PROJECT_ID: projectId,
    FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099',
    FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080',
    FIREBASE_STORAGE_EMULATOR_HOST: '127.0.0.1:9199'
  }
})

if (result.error) throw result.error
process.exitCode = result.status ?? 1
