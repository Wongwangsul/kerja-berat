/* Render frame-per-frame versi klip Flow (1080x1920) — adaptasi export-frames-916.mjs.
   Bedanya: setiap frame memanggil OPENER.seekFx(t) yang MENUKAR frame klip (JPG)
   dan menunggu decode selesai sebelum screenshot -> deterministik.
   Pakai: URL=http://127.0.0.1:5178/index.html?clean=1 FPS=60 OUT=out-frames node tools/export-frames-flow.mjs
   Mode asap: TIMES="0.6,5.6,13.5" OUT=shots node tools/export-frames-flow.mjs  (screenshot pada detik2 itu saja)
   Butuh server http di folder proyek + puppeteer terpasang. */
import puppeteer from 'puppeteer';
import { mkdir } from 'node:fs/promises';

const URL = process.env.URL || 'http://127.0.0.1:5178/index.html?clean=1';
const FPS = Number(process.env.FPS || 60);
const OUT = process.env.OUT || 'out-frames';
const MAXF = Number(process.env.MAXF || 0);
const TIMES = (process.env.TIMES || '').split(',').map(s => s.trim()).filter(Boolean).map(Number);
await mkdir(OUT, { recursive: true });

const browser = await puppeteer.launch({
  headless: 'new',
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader',
         '--use-angle=swiftshader', '--ignore-certificate-errors',
         '--autoplay-policy=no-user-gesture-required'],
});
const page = await browser.newPage();
page.on('pageerror', e => console.log('PAGEERROR', e.message));
await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
await page.goto(URL, { waitUntil: 'networkidle0' });
await page.waitForFunction('window.OPENER && window.OPENER.ready', { timeout: 120000 });
await page.evaluate(() => document.fonts.ready);
const { W, H, DURATION } = await page.evaluate(() => ({ W: window.OPENER.W, H: window.OPENER.H, DURATION: window.OPENER.DURATION }));
await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
await page.evaluate(() => { window.OPENER.tl.pause(0); });

async function shot(t, path) {
  await page.evaluate(async (time) => { await window.OPENER.seekFx(time); }, t);
  await page.screenshot({ path, clip: { x: 0, y: 0, width: W, height: H }, optimizeForSpeed: true });
}

if (TIMES.length) {
  for (const t of TIMES) {
    const name = `${OUT}/t${t.toFixed(2).replace('.', '_')}.png`;
    await shot(t, name);
    console.log('shot', name);
  }
  console.log('mode asap selesai');
  await browser.close();
  process.exit(0);
}

const total = MAXF > 0 ? MAXF : Math.ceil(DURATION * FPS);
console.log(`${total} frame @ ${FPS} fps (${DURATION}s) ukuran ${W}x${H} -> ${OUT}/`);
const t0 = Date.now();
for (let i = 0; i < total; i++) {
  const t = i / FPS;
  await shot(t, `${OUT}/f${String(i).padStart(5, '0')}.png`);
  if (i % FPS === 0) process.stdout.write(`\r${i}/${total}  ${t.toFixed(1)}s  ${(Date.now() - t0) / 1000}s berlalu`);
}
console.log(`\nselesai — ${total} frame dalam ${((Date.now() - t0) / 1000).toFixed(1)} detik`);
await browser.close();
