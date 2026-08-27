/**
 * Fail the build if a referenced /images/* UI asset is missing, untracked, or
 * has content that does not match its extension (the 28 Aug 2026 production
 * regression: SVG payloads stored as .png, plus untracked public/images).
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const assetRe = /['"`(/](\/images\/[a-zA-Z0-9_./-]+\.(?:svg|png|jpg|jpeg|webp))/g
const skipDirs = new Set(['node_modules', '.next', '.git', '.presentation-qa', 'coverage', 'visual-lock/baselines'])

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skipDirs.has(entry.name)) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, files)
    else if (/\.(tsx?|jsx?|mjs|css)$/.test(entry.name)) files.push(full)
  }
  return files
}

function gitTrackedPublicImages() {
  try {
    const out = execFileSync('git', ['ls-files', '--', 'public/images'], {
      cwd: root,
      encoding: 'utf8',
    })
    return new Set(out.split('\n').map((line) => line.trim()).filter(Boolean))
  } catch {
    throw new Error('assert-public-images: git ls-files failed; cannot prove assets are tracked')
  }
}

function looksLikeSvg(buf) {
  const head = buf.subarray(0, 512).toString('utf8').replace(/^\uFEFF/, '').trimStart()
  return head.startsWith('<svg') || (head.startsWith('<?xml') && /<svg[\s>]/i.test(head))
}

function looksLikePng(buf) {
  return buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47
}

function looksLikeJpeg(buf) {
  return buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff
}

function looksLikeWebp(buf) {
  return (
    buf.length >= 12 &&
    buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buf.subarray(8, 12).toString('ascii') === 'WEBP'
  )
}

function contentMatchesExtension(absPath, ext) {
  const buf = fs.readFileSync(absPath)
  if (buf.length === 0) return 'empty file'
  if (ext === 'svg') {
    if (looksLikePng(buf) || looksLikeJpeg(buf) || looksLikeWebp(buf)) {
      return 'binary raster payload stored as .svg'
    }
    if (!looksLikeSvg(buf)) return 'not an SVG document'
    return null
  }
  if (ext === 'png') {
    if (looksLikeSvg(buf)) return 'SVG payload stored as .png'
    if (!looksLikePng(buf)) return 'not a PNG file'
    return null
  }
  if (ext === 'jpg' || ext === 'jpeg') {
    if (!looksLikeJpeg(buf)) return 'not a JPEG file'
    return null
  }
  if (ext === 'webp') {
    if (!looksLikeWebp(buf)) return 'not a WEBP file'
    return null
  }
  return null
}

const referenced = new Set()
for (const file of walk(root)) {
  const text = fs.readFileSync(file, 'utf8')
  for (const match of text.matchAll(assetRe)) referenced.add(match[1])
}

const tracked = gitTrackedPublicImages()
const missing = []
const untracked = []
const mimeMismatch = []

for (const rel of [...referenced].sort()) {
  const publicRel = path.posix.join('public', rel.replace(/^\//, ''))
  const abs = path.join(root, publicRel)
  if (!fs.existsSync(abs)) {
    missing.push(rel)
    continue
  }
  if (!tracked.has(publicRel)) {
    untracked.push(rel)
    continue
  }
  const ext = path.extname(abs).slice(1).toLowerCase()
  const mimeError = contentMatchesExtension(abs, ext)
  if (mimeError) mimeMismatch.push(`${rel} (${mimeError})`)
}

if (missing.length || untracked.length || mimeMismatch.length) {
  if (missing.length) {
    console.error('assert-public-images: missing files')
    for (const rel of missing) console.error(`  ${rel}`)
  }
  if (untracked.length) {
    console.error('assert-public-images: required UI assets exist locally but are not git tracked')
    for (const rel of untracked) console.error(`  ${rel}`)
  }
  if (mimeMismatch.length) {
    console.error('assert-public-images: content does not match extension/MIME expectations')
    for (const rel of mimeMismatch) console.error(`  ${rel}`)
  }
  process.exit(1)
}

console.log(
  `assert-public-images: ok (${referenced.size} referenced files present, git tracked, content matches extension)`,
)
