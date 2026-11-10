/* Render frame-per-frame untuk proyek 9:16 (1080x1920) — adaptasi export-frames.mjs Bang Motion.
   Pakai: URL=http://127.0.0.1:5178/index.html?clean=1 FPS=60 OUT=frames node tools/export-frames-916.mjs
   Butuh server http di folder proyek (python3 -m http.server 5178) + puppeteer terpasang. */
import puppeteer from 'puppeteer';
import { mkdir } from 'node:fs/promises';

const URL = process.env.URL || 'http://127.0.0.1:5178/index.html?clean=1';
const FPS = Number(process.env.FPS || 60);
const OUT = process.env.OUT || 'frames';
const MAXF = Number(process.env.MAXF || 0);   // >0 = batasi jumlah frame (uji waktu)
await mkdir(OUT, { recursive: true });

const browser = await puppeteer.launch({
  headless: 'new',
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

const total = MAXF > 0 ? MAXF : Math.ceil(DURATION * FPS);
console.log(`${total} frame @ ${FPS} fps (${DURATION}s) ukuran ${W}x${H} -> ${OUT}/`);
const t0 = Date.now();
for (let i = 0; i < total; i++) {
  const t = i / FPS;
  await page.evaluate(async (time) => {
    window.OPENER.seek(time);
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    window.OPENER.seek(time);
  }, t);
  await page.screenshot({ path: `${OUT}/f${String(i).padStart(5, '0')}.png`, clip: { x: 0, y: 0, width: W, height: H }, optimizeForSpeed: true });
  if (i % FPS === 0) process.stdout.write(`\r${i}/${total}  ${t.toFixed(1)}s  ${(Date.now() - t0) / 1000}s berlalu`);
}
console.log(`\nselesai — ${total} frame dalam ${((Date.now() - t0) / 1000).toFixed(1)} detik`);
await browser.close();
