/**
 * SurePath demo recorder — the form beat.
 *
 * Fills the personal-information step, scrolls smoothly as it goes, clicks Continue,
 * fills the criminal-history step, clicks Continue. Stops before the AI conversation
 * so you can drive that part yourself.
 *
 * Run:
 *   npm i -D playwright && npx playwright install chromium
 *   npm run dev                      # another terminal
 *   node demo/record-form.mjs
 *
 * Output: demo/video/*.webm →
 *   ffmpeg -i demo/video/*.webm -c:v libx264 -crf 18 -pix_fmt yuv420p demo/form.mp4
 */
import { chromium } from 'playwright'

const BASE = 'http://localhost:5173'
const START = `${BASE}/texas/apply`

// ── timing — tune these, touch nothing else ──────────────────────────────────
const T = {
  keystroke: 28, // per character. lower = faster typing
  betweenFields: 260, // pause after finishing a field
  afterScroll: 420, // settle after a smooth scroll
  beforeContinue: 900, // beat before hitting Continue
  afterContinue: 1400, // hold on the new page before filling
  tail: 1800,
}

// ── smooth scroll to an element, then act on it ──────────────────────────────
async function reveal(page, locator) {
  await locator.waitFor({ state: 'visible', timeout: 10_000 })
  await locator.evaluate((el) =>
    el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' }),
  )
  await page.waitForTimeout(T.afterScroll)
}

async function type(page, label, value) {
  const field = page.getByLabel(label, { exact: false }).first()
  await reveal(page, field)
  await field.click()
  await field.pressSequentially(value, { delay: T.keystroke })
  await page.waitForTimeout(T.betweenFields)
  console.log(`    ${label} → ${value}`)
}

async function choose(page, label, value) {
  const field = page.getByLabel(label, { exact: false }).first()
  await reveal(page, field)
  await field.selectOption({ label: value })
  await page.waitForTimeout(T.betweenFields)
  console.log(`    ${label} → ${value}`)
}

async function pick(page, name) {
  // (locator fix) the radio inputs are sr-only 1px elements — the styled <label>
  // wrapping each one is the visible, clickable control
  const opt = page
    .getByRole('radio', { name, exact: false })
    .first()
    .locator('xpath=ancestor::label')
  await reveal(page, opt)
  await opt.click()
  await page.waitForTimeout(T.betweenFields)
  console.log(`    ◉ ${name}`)
}

async function advance(page) {
  const btn = page.getByRole('button', { name: /continue/i }).first()
  await reveal(page, btn)
  await page.waitForTimeout(T.beforeContinue)
  await btn.click()
  await page.waitForTimeout(T.afterContinue)
  console.log('  → Continue')
}

// ── run ──────────────────────────────────────────────────────────────────────
const browser = await chromium.launch({ headless: false })
const context = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 2,
  recordVideo: { dir: 'demo/video', size: { width: 1920, height: 1080 } },
})
const page = await context.newPage()

await page.goto(START, { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)

console.log('step 1 — identifying information')
await type(page, 'Last name', 'Rivera')
await type(page, 'First name', 'Marcus')
await type(page, 'Middle name', 'Daniel')
await type(page, 'Date of birth', '04/18/1979')
await pick(page, 'Male')
await type(page, 'Street address', '4412 Larkspur Lane, Apt 3B')
await type(page, 'City', 'Houston')
await choose(page, 'State', 'Texas')
await type(page, 'ZIP', '77021')
await type(page, 'Phone', '(713) 555-0148')
await type(page, 'Email', 'mdrivera79@example.com')
await pick(page, 'No') // parole
await advance(page)

console.log('step 2 — criminal history')
// (added — locator fix) the record step opens empty; the first incident card only
// exists after "+ Add an incident"
const addIncident = page.getByRole('button', { name: /add an incident/i }).first()
await reveal(page, addIncident)
await addIncident.click()
await page.waitForTimeout(T.afterContinue)
await type(page, 'County', 'Dallas')
await type(page, 'Court', '283rd District Court')
await type(page, 'Date the crime was committed', '08/21/1998')
await type(page, 'Date of conviction', '01/12/1999')
await type(page, 'Exact offense', 'Possession of Marijuana, 2 ounces or less')
await type(page, 'Sentence', '12 months deferred adjudication, $500 fine')
await pick(page, 'Deferred adjudication')
await advance(page)

await page.waitForTimeout(T.tail)
await context.close()
await browser.close()
console.log('done → demo/video/')
