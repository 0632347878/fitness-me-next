/**
 * One-time migration script: download all exercise gifs from WorkoutX
 * and save them to public/gifs/, then update gifUrl in the backend DB.
 *
 * Usage:
 *   ACCESS_TOKEN=<your_token> node scripts/download-gifs.mjs
 *
 * Get ACCESS_TOKEN from browser DevTools:
 *   Application → Session Storage → sessionStorage.accessToken
 */

import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const API_URL    = process.env.NEXT_PUBLIC_API_URL        || "http://localhost:3001";
const WX_KEY     = process.env.NEXT_PUBLIC_WORKOUTX_API_KEY;
const TOKEN      = process.env.ACCESS_TOKEN;
const DELAY_MS   = 300; // pause between downloads to avoid rate limiting
const BATCH_SIZE = 50;

if (!WX_KEY)  { console.error("❌  Missing NEXT_PUBLIC_WORKOUTX_API_KEY"); process.exit(1); }
if (!TOKEN)   { console.error("❌  Missing ACCESS_TOKEN\n    Get it from DevTools → Application → Session Storage → accessToken"); process.exit(1); }

const GIF_DIR = join(__dirname, "../public/gifs");
mkdirSync(GIF_DIR, { recursive: true });

const headers = (extra = {}) => ({
  Authorization: `Bearer ${TOKEN}`,
  "Content-Type": "application/json",
  ...extra,
});

async function fetchPage(page) {
  const res = await fetch(`${API_URL}/exercises?page=${page}&limit=${BATCH_SIZE}`, {
    headers: headers(),
  });
  if (!res.ok) throw new Error(`GET /exercises page ${page} → ${res.status}`);
  return res.json();
}

async function downloadGif(url) {
  const res = await fetch(url, { headers: { "X-WorkoutX-Key": WX_KEY } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function patchExercise(id, gifUrl) {
  const res = await fetch(`${API_URL}/exercises/${id}`, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify({ gifUrl }),
  });
  if (!res.ok) throw new Error(`PATCH /exercises/${id} → ${res.status}`);
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function main() {
  console.log(`API:  ${API_URL}`);
  console.log(`Dir:  ${GIF_DIR}\n`);

  const first = await fetchPage(1);
  const total = first.total;
  const pages = Math.ceil(total / BATCH_SIZE);
  console.log(`Total exercises: ${total} (${pages} pages)\n`);

  let downloaded = 0, skipped = 0, errors = 0;

  for (let page = 1; page <= pages; page++) {
    const { items } = page === 1 ? first : await fetchPage(page);

    for (const ex of items) {
      // Skip if no gif or already migrated to local path
      if (!ex.gifUrl || !ex.gifUrl.includes("workoutxapp.com")) {
        skipped++;
        continue;
      }

      const filename  = ex.gifUrl.split("/").pop();
      const localPath = join(GIF_DIR, filename);
      const localUrl  = `/gifs/${filename}`;

      if (!existsSync(localPath)) {
        try {
          process.stdout.write(`  ↓ ${filename} ... `);
          const buf = await downloadGif(ex.gifUrl);
          writeFileSync(localPath, buf);
          process.stdout.write(`${(buf.length / 1024).toFixed(0)} KB\n`);
          downloaded++;
          await sleep(DELAY_MS);
        } catch (err) {
          process.stdout.write(`ERROR: ${err.message}\n`);
          errors++;
          continue;
        }
      } else {
        skipped++;
      }

      // Update gifUrl in backend to local path
      try {
        await patchExercise(ex.id, localUrl);
      } catch (err) {
        console.error(`  ✗ PATCH ${ex.id}: ${err.message}`);
      }
    }

    console.log(`  Page ${page}/${pages} ✓`);
  }

  console.log(`\n✅  Done!`);
  console.log(`   Downloaded : ${downloaded}`);
  console.log(`   Skipped    : ${skipped}`);
  console.log(`   Errors     : ${errors}`);
  console.log(`\n   Gifs are at: public/gifs/`);
  console.log(`   Add public/gifs/ to .gitignore if you don't want to commit them.`);
}

main().catch((err) => { console.error(err); process.exit(1); });