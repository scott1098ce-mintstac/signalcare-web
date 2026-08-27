export function loadEnvFile(filePath, fs) {
  if (!fs.existsSync(filePath)) return
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (!match || process.env[match[1]]) continue
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '')
  }
}

export function isSerifFallback(fontFamily) {
  const family = String(fontFamily || '').toLowerCase()
  if (!family.trim()) return true
  if (/\btimes\b/.test(family) || /\btimes new roman\b/.test(family)) return true
  if (/\bgeorgia\b/.test(family) || /\bpalatino\b/.test(family) || /\bgaramond\b/.test(family)) {
    return true
  }
  const first = family.split(',')[0]?.replace(/['"]/g, '').trim()
  return first === 'serif'
}

export function interResolved(fontFamily, fontInterVar) {
  const family = String(fontFamily || '')
  const variable = String(fontInterVar || '').trim()
  if (/inter/i.test(family)) return true
  if (variable && family.includes(variable.replace(/['"]/g, ''))) return true
  if (/__inter/i.test(family)) return true
  return false
}
