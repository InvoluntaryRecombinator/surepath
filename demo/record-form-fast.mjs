/**
 * SurePath demo recorder — fast form beat.
 *
 * Every field snaps full at once. No typing animation, no per-field scrolling.
 * Page zooms out so the whole form is visible in one frame, holds a couple of
 * seconds, clicks Continue, repeats.
 *
 * Run:
 *   npm i -D playwright && npx playwright install chromium
 *   npm run dev                       # another terminal
 *   node demo/record-form.mjs
 *
 *   ffmpeg -i demo/video/*.webm -c:v libx264 -crf 18 -pix_fmt yuv420p demo/form.mp4
 */
import { chromium } from 'playwright'

const BASE = 'http://localhost:5173'
const START = `${BASE}/texas/apply`

const T = {
  beforeFill: 1000, // empty form on screen before it snaps full
  afterFill: 2200, // filled form held on screen — your main beat
  afterContinue: 800, // pause on the new page before it fills
  tail: 1600,
}

// shrink the page so the entire form fits in one frame — no scrolling needed
const ZOOM = 0.62

const STEP_1 = {
  'Last name': 'Rivera',
  'First name': 'Marcus',
  'Middle name': 'Daniel',
  'Date of birth': '04/18/1979',
  'Street address': '4412 Larkspur Lane, Apt 3B',
  City: 'Houston',
  ZIP: '77021',
  Phone: '(713) 555-0148',
  Email: 'mdrivera79@example.com',
}

const STEP_2 = {
  County: 'Dallas',
  Court: '283rd District Court',
  'Date the crime was committed': '08/21/1998',
  'Date of conviction': '01/12/1999',
  'Exact offense': 'Possession of Marijuana, 2 ounces or less',
  Sentence: '12 months deferred adjudication, $500 fine',
}

async function fillAll(page, fields) {
  for (const [label, value] of Object.entries(fields)) {
    const field = page.getByLabel(label, { exact: false }).first()
    if (await field.count()) await field.fill(value)
  }
}

async function radio(page, name) {
  // (locator fix) the radio inputs are sr-only — click the styled label around them
  const opt = page
    .getByRole('radio', { name, exact: false })
    .first()
    .locator('xpath=ancestor::label')
  if (await opt.count()) await opt.click()
}

async function advance(page) {
  await page.getByRole('button', { name: /continue/i }).first().click()
  await page.waitForTimeout(T.afterContinue)
  await page.evaluate((z) => (document.body.style.zoom = String(z)), ZOOM)
}

const browser = await chromium.launch({ headless: false })
const context = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 2,
  recordVideo: { dir: 'demo/video', size: { width: 1920, height: 1080 } },
})
const page = await context.newPage()

await page.goto(START, { waitUntil: 'networkidle' })
await page.evaluate((z) => (document.body.style.zoom = String(z)), ZOOM)
await page.waitForTimeout(T.beforeFill)

// step 1 — snaps full in one frame
await fillAll(page, STEP_1)
await radio(page, 'Male')
await radio(page, 'No')
await page.waitForTimeout(T.afterFill)
await advance(page)

// step 2
// (added — locator fix) the record step opens empty; create the first incident card
await page.getByRole('button', { name: /add an incident/i }).first().click()
await page.evaluate((z) => (document.body.style.zoom = String(z)), ZOOM)
await page.waitForTimeout(T.beforeFill)
await fillAll(page, STEP_2)
await radio(page, 'Deferred adjudication')
await page.waitForTimeout(T.afterFill)
await advance(page)

await page.waitForTimeout(T.tail)
await context.close()
await browser.close()
console.log('done → demo/video/')
