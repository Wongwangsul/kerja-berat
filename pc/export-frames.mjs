/* Render frame-by-frame 9:16 di runner: seek deterministik via window.OPENER. */
import puppeteer from 'puppeteer';
import { mkdir } from 'node:fs/promises';
const URL = process.env.URL, FPS = Number(process.env.FPS || 30), OUT = process.env.OUT || 'frames';
await mkdir(OUT, { recursive: true });
const browser = await puppeteer.launch({ headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader',
         '--use-angle=swiftshader', '--ignore-certificate-errors',
         '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage();
page.on('pageerror', e => console.log('PAGEERROR', e.message));
page.on('console', m => console.log('PAGE', m.type(), m.text().slice(0, 200)));
await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
await page.goto(URL, { waitUntil: 'networkidle0', timeout: 120000 });
await page.waitForFunction('window.OPENER && window.OPENER.ready', { timeout: 120000 });
const DUR = await page.evaluate(() => window.OPENER.DURATION);
const total = Math.round(DUR * FPS);
console.log('render', total, 'frame @', FPS, 'fps, durasi', DUR);
for (let i = 0; i < total; i++) {
  const t = i / FPS;
  await page.evaluate(async (time) => {
    window.OPENER.seek(time);
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    window.OPENER.seek(time);
  }, t);
  await page.screenshot({ path: `${OUT}/f${String(i).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 88,
                          clip: { x: 0, y: 0, width: 1080, height: 1920 } });
  if (i % 150 === 0) console.log('frame', i, '/', total);
}
await browser.close();
console.log('selesai', total, 'frame');
