// Leonida Trophy Guide — the entry program for make.fun's gta6-trophy-guide-01.
// It hands the guide in: app/ (the static guide) and screenshots/ (renders of
// it) are copied from beside this file into the output directory, and a
// dossier.json is written there with the vendored make.fun library, so the
// judge reads the same summary the scorer computes itself.
//
// The guide is plain static files: app/index.html opens in desktop Chrome
// with no build step and no network — its trophy list is app/data/trophies.json
// and its behaviour is app/app.js. Nothing is fetched from the internet.
//
// Run it outside the grader's container with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The scorer refuses an entry with more than 4 screenshots or one over
// 256 KiB, and more than 993 files or 48 MiB under app/. Check the same caps
// here first, so a bad hand-in fails loudly on the author's machine instead
// of silently at the scorer.
const screenshotDir = join(here, 'screenshots');
const shots = existsSync(screenshotDir)
  ? readdirSync(screenshotDir, { withFileTypes: true })
      .filter((e) => e.isFile() && /\.(png|jpe?g)$/i.test(e.name))
      .map((e) => e.name)
      .sort()
  : [];
if (shots.length === 0) {
  throw new Error('no screenshots in screenshots/ (need 3 or 4 renders of the guide)');
}
if (shots.length > 4) {
  throw new Error(`too many screenshots: ${shots.length} (max 4)`);
}
for (const shot of shots) {
  const size = statSync(join(screenshotDir, shot)).size;
  if (size > 262144) {
    throw new Error(`screenshot ${shot} is ${size} bytes (max 262144)`);
  }
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(screenshotDir)) {
  cpSync(screenshotDir, join(out, 'screenshots'), { recursive: true });
}

writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);

console.log(`Leonida Trophy Guide handed in to ${out}: ${shots.length} screenshots (${shots.join(', ')}).`);
