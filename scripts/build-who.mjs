// Converts the official WHO Child Growth Standards LMS tables (by day of age,
// from the WHO `anthro` package: github.com/WorldHealthOrganization/anthro,
// data-raw/growthstandards) into a compact JSON for 0–24 months.
import { readFileSync, writeFileSync } from 'node:fs';

const MAX_DAY = 731;
const sources = { weight: 'weianthro', length: 'lenanthro', head: 'hcanthro' };
const out = { source: 'WHO Child Growth Standards (2006), LMS by day of age', maxDay: MAX_DAY };

for (const [key, file] of Object.entries(sources)) {
  const rows = readFileSync(new URL(`./who/${file}.txt`, import.meta.url), 'utf8').trim().split('\n').slice(1);
  const table = { male: [], female: [] };
  for (const row of rows) {
    const [sex, age, l, m, s] = row.split('\t');
    const day = Number(age);
    if (day > MAX_DAY) continue;
    table[sex === '1' ? 'male' : 'female'][day] = [Number(l), Number(m), Number(s)];
  }
  out[key] = table;
}
writeFileSync(new URL('../src/data/who-lms.json', import.meta.url), JSON.stringify(out));
console.log('wrote src/data/who-lms.json');
