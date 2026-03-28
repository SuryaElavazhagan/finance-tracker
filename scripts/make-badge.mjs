// Reads vitest JSON output and writes a shields.io endpoint badge JSON
// into public/badges/tests.json so it gets served from GitHub Pages.
import { readFileSync, mkdirSync, writeFileSync } from 'fs'

const raw = JSON.parse(readFileSync('test-results.json', 'utf8'))

const numPassed = raw.numPassedTests ?? 0
const numFailed = raw.numFailedTests ?? 0
const numTotal  = raw.numTotalTests  ?? 0

const color   = numFailed === 0 ? 'brightgreen' : 'red'
const message = numFailed === 0
  ? `${numPassed}/${numTotal} passed`
  : `${numFailed} failed (${numPassed}/${numTotal})`

const badge = {
  schemaVersion: 1,
  label: 'tests',
  message,
  color,
}

mkdirSync('public/badges', { recursive: true })
writeFileSync('public/badges/tests.json', JSON.stringify(badge, null, 2))
console.log(`Badge written: ${message}`)
