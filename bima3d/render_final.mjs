// Final render on the kerja-berat runner: node render_final.mjs <out.mp4>
// Env: CHROME_BIN (optional path to chrome headless shell), CONCURRENCY (default 3)
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition, ensureBrowser } from "@remotion/renderer";
import path from "node:path";

const out = process.argv[2] || "out/video.mp4";
const t0 = Date.now();
let browserExecutable = process.env.CHROME_BIN || undefined;
if (!browserExecutable) {
  await ensureBrowser();
  console.log("browser ensured (remotion default)");
}
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
console.log("bundle_s", ((Date.now() - t0) / 1000).toFixed(1));
const composition = await selectComposition({ serveUrl, id: "BimaTangga", browserExecutable, chromiumOptions: { gl: "swangle" } });
console.log("comp", composition.id, composition.durationInFrames, "frames");
const t1 = Date.now();
let last = 0;
await renderMedia({
  composition, serveUrl, codec: "h264", outputLocation: out,
  scale: 1, browserExecutable, chromiumOptions: { gl: "swangle" },
  concurrency: Number(process.env.CONCURRENCY || 3), crf: 18,
  timeoutInMilliseconds: 600000,
  onProgress: ({ progress }) => { const p = Math.floor(progress * 100); if (p >= last + 5) { last = p; console.log("progress", p + "%", ((Date.now() - t1) / 1000).toFixed(0) + "s"); } },
});
const dt = (Date.now() - t1) / 1000;
console.log(`renderMedia ${composition.durationInFrames} frames in ${dt.toFixed(1)}s = ${(dt / composition.durationInFrames).toFixed(2)}s/frame`);
