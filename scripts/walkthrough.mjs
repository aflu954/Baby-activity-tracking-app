// End-to-end walkthrough at phone size. Usage: node scripts/walkthrough.mjs [outDir]
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL ?? 'http://localhost:4173';
const out = process.argv[2] ?? 'screenshots';
const errors = [];
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
const shot = (name) => page.screenshot({ path: `${out}/${name}.png`, fullPage: true });
const step = (msg) => console.log('✓', msg);

await page.goto(BASE);
await page.getByLabel('Baby’s name').fill('Mila Rose');
await page.getByLabel('Date of birth').fill('2026-05-14');
await page.getByRole('button', { name: 'Girl' }).click();
await shot('01-onboarding');
await page.getByRole('button', { name: 'Start playing' }).click();
await page.getByRole('heading', { name: 'Mila’s day' }).waitFor();
step('onboarding → Today');
await page.getByText('Today’s checklist').waitFor();
const items = page.locator('.game-item');
if ((await items.count()) !== 5) throw new Error(`expected 5 games, got ${await items.count()}`);
await shot('02-today');
step('checklist has 5 games');

// Play the first game, answer Yes to every watch-for question.
const firstTitle = (await items.first().locator('.title').textContent()).trim();
await items.first().locator('a').click();
await shot('03-game-detail');
await page.getByRole('button', { name: 'Start playing' }).click();
await page.waitForTimeout(1200);
await shot('04-playing');
await page.getByRole('button', { name: 'We’re done' }).click();
await page.getByRole('button', { name: 'Loved it' }).click();
const yesButtons = page.locator('.answer-group .chip.yes');
const yesCount = await yesButtons.count();
for (let i = 0; i < yesCount; i++) await yesButtons.nth(i).click();
await page.getByLabel('Note (optional)').fill('Big smiles!');
await shot('05-log');
await page.getByRole('button', { name: 'Save and tick off' }).click();
await page.getByRole('heading', { name: 'Mila’s day' }).waitFor();
await page.locator('.hero-num', { hasText: '1' }).waitFor();
step(`played "${firstTitle}" and ticked it off (${yesCount} yes answers)`);

// Swap a game.
const beforeSwap = (await items.nth(2).locator('.title').textContent()).trim();
await items.nth(2).getByRole('button', { name: /Swap/ }).click();
await page.waitForFunction((t) => document.querySelectorAll('.game-item')[2]?.querySelector('.title')?.textContent?.trim() !== t, beforeSwap);
step('swapped a game');
await shot('06-today-progress');

// Moments: the yes answers should have marked milestones.
await page.getByRole('link', { name: 'Moments' }).click();
await page.getByRole('heading', { name: 'Moments' }).waitFor();
if (yesCount > 0) {
  await page.locator('.moment-feature .title').waitFor();
  step(`latest moment: "${(await page.locator('.moment-feature .title').textContent()).trim()}"`);
}
await shot('07-moments');

// Growth: add two measurements.
await page.getByRole('link', { name: 'Growth' }).click();
for (const [date, w, l, h] of [['2026-07-16', '5.1', '58.4', '38.9'], ['2026-09-12', '6.2', '62.5', '40.8']]) {
  await page.getByRole('button', { name: 'Add' }).click();
  await page.getByLabel('Date').fill(date);
  await page.getByLabel('Weight (kg)').fill(w);
  await page.getByLabel('Length (cm)').fill(l);
  await page.getByLabel('Head (cm)').fill(h);
  await page.getByRole('button', { name: 'Save' }).click();
  await page.getByRole('dialog').waitFor({ state: 'detached' });
}
const pct = (await page.locator('.stat-big').first().locator('..').locator('..').textContent());
step(`growth added; latest card: ${pct.replace(/\s+/g, ' ').slice(0, 60)}`);
await shot('08-growth');

await page.getByRole('link', { name: 'Games' }).click();
await page.getByRole('heading', { name: 'Games' }).waitFor();
await shot('09-games');
await page.getByRole('link', { name: 'Progress' }).click();
await page.getByRole('heading', { name: 'Progress' }).waitFor();
await shot('10-progress');
await page.getByRole('link', { name: 'Today' }).click();
await page.getByRole('link', { name: 'Settings and baby profile' }).click();
await page.getByRole('heading', { name: 'Settings' }).waitFor();
await page.getByRole('switch', { name: 'Play reminder' }).click();
await shot('11-settings');
step('settings + reminder');

// Reload: data persists.
await page.goto(BASE);
await page.locator('.hero-num', { hasText: '1' }).waitFor();
step('data persists after reload');

await browser.close();
if (errors.length) { console.error('Browser errors:\n' + errors.join('\n')); process.exit(1); }
console.log('Walkthrough passed.');
