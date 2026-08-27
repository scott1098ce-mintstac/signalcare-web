/**
 * Fail the build if source references a /images/* file that is not in public/.
 * Prevents Vercel git deploys from shipping a Command Queue with broken icons.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const assetRe = /['"`(/](\/images\/[a-zA-Z0-9_./-]+\.(?:svg|png|jpg|jpeg|webp))/g
const skipDirs = new Set(['node_modules', '.next', '.git', '.presentation-qa', 'coverage'])

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skipDirs.has(entry.name)) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, files)
    else if (/\.(tsx?|jsx?|mjs|css)$/.test(entry.name)) files.push(full)
  }
  return files
}

const referenced = new Set()
for (const file of walk(root)) {
  const text = fs.readFileSync(file, 'utf8')
  for (const match of text.matchAll(assetRe)) referenced.add(match[1])
}

const missing = [...referenced].filter((rel) => !fs.existsSync(path.join(root, 'public', rel)))
if (missing.length) {
  console.error('assert-public-images: missing files')
  for (const rel of missing.sort()) console.error(`  ${rel}`)
  process.exit(1)
}
console.log(`assert-public-images: ok (${referenced.size} referenced files present)`)
