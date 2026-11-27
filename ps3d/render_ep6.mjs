// Render Ep6 Panggung Satwa (SATU komposisi, video-only, tanpa audio):
// node render_ep6.mjs [out.mp4]
// Env: CHROME_BIN (optional), CONCURRENCY (default 3)
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition, ensureBrowser } from "@remotion/renderer";
import { createHash } from "node:crypto";
import { createReadStream, statSync } from "node:fs";
import path from "node:path";

const out = process.argv[2] || "out/kelinci-rubah-peta.mp4";
const t0 = Date.now();
let browserExecutable = process.env.CHROME_BIN || undefined;
if (!browserExecutable) {
  await ensureBrowser();
  console.log("browser ensured (remotion default)");
}
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
console.log("bundle_s", ((Date.now() - t0) / 1000).toFixed(1));
const composition = await selectComposition({ serveUrl, id: "KelinciRubahPeta", browserExecutable, chromiumOptions: { gl: "swangle" } });
console.log("comp", composition.id, composition.durationInFrames, "frames @", composition.fps, "fps", composition.width + "x" + composition.height);
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
const size = statSync(out).size;
const hash = await new Promise((resolve, reject) => {
  const h = createHash("sha256");
  createReadStream(out).on("data", (d) => h.update(d)).on("end", () => resolve(h.digest("hex"))).on("error", reject);
});
console.log(`DONE KelinciRubahPeta ${composition.durationInFrames} frames in ${dt.toFixed(1)}s = ${(dt / composition.durationInFrames).toFixed(2)}s/frame size=${size} sha256=${hash}`);
