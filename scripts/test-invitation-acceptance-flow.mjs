import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const run = spawnSync('npx', ['tsx', 'scripts/test-invitation-acceptance-flow.ts'], {
  cwd: root,
  encoding: 'utf8',
  stdio: 'inherit',
  env: {
    ...process.env,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:9',
  },
})
process.exit(run.status ?? 1)
