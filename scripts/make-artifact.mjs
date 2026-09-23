// Turns the single-file build (dist-artifact/index.html) into a claude.ai artifact page:
// no <html>/<head>/<body> wrapper, a <title> first, Poppins from Google Fonts.
import { readFileSync, writeFileSync } from 'node:fs';

const html = readFileSync('dist-artifact/index.html', 'utf8');
const head = html.match(/<head>([\s\S]*?)<\/head>/)[1];
const body = html.match(/<body>([\s\S]*?)<\/body>/)[1];
const assets = [...head.matchAll(/<(script|style)\b[\s\S]*?<\/\1>/g)].map((m) => m[0]);
const page = [
  '<title>Sbaby Play</title>',
  '<link rel="preconnect" href="https://fonts.googleapis.com">',
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap">',
  ...assets.filter((a) => a.startsWith('<style')),
  body.trim(),
  ...assets.filter((a) => a.startsWith('<script')),
].join('\n');
writeFileSync('dist-artifact/sbaby-play.html', page);
console.log(`wrote dist-artifact/sbaby-play.html (${(page.length / 1024).toFixed(0)} KB)`);
