import { PNG } from 'pngjs'
import pixelmatch from 'pixelmatch'
import fs from 'node:fs'
import path from 'node:path'
import { MAX_DIFF_RATIO, PIXELMATCH_THRESHOLD } from './config.mjs'

export function comparePngBuffers(actualBuf, baselineBuf, diffPath) {
  const actual = PNG.sync.read(actualBuf)
  const baseline = PNG.sync.read(baselineBuf)
  if (actual.width !== baseline.width || actual.height !== baseline.height) {
    return {
      ok: false,
      reason: `dimension mismatch actual=${actual.width}x${actual.height} baseline=${baseline.width}x${baseline.height}`,
      diffPixels: null,
      ratio: 1,
    }
  }
  const diff = new PNG({ width: actual.width, height: actual.height })
  const diffPixels = pixelmatch(
    actual.data,
    baseline.data,
    diff.data,
    actual.width,
    actual.height,
    { threshold: PIXELMATCH_THRESHOLD },
  )
  const total = actual.width * actual.height
  const ratio = total === 0 ? 1 : diffPixels / total
  const maxDiff = Math.max(64, Math.floor(total * MAX_DIFF_RATIO))
  if (diffPixels > maxDiff) {
    fs.mkdirSync(path.dirname(diffPath), { recursive: true })
    fs.writeFileSync(diffPath, PNG.sync.write(diff))
    return {
      ok: false,
      reason: `pixel diff ${diffPixels}/${total} (${(ratio * 100).toFixed(3)}%) exceeds max ${maxDiff} (${(MAX_DIFF_RATIO * 100).toFixed(2)}%)`,
      diffPixels,
      ratio,
    }
  }
  return { ok: true, reason: null, diffPixels, ratio }
}
