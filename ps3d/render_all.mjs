// Combined heavy-run render: bundle ONCE, then render all three 26 Nov Shorts
// in sequence (video only, no audio) into out/<slug>.mp4.
// Env: CHROME_BIN (optional path to chrome headless shell), CONCURRENCY (default 3)
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition, ensureBrowser } from "@remotion/renderer";
import { createHash } from "node:crypto";
import { createReadStream, statSync } from "node:fs";
import path from "node:path";

const JOBS = [
  { id: "PenguinUdang", out: "out/penguin-udang.mp4" },
  { id: "FlamingoPipit", out: "out/flamingo-pipit.mp4" },
  { id: "AnjingPanda", out: "out/anjing-panda.mp4" },
];

function sha256(file) {
  return new Promise((resolve, reject) => {
    const h = createHash("sha256");
    createReadStream(file).on("data", (d) => h.update(d)).on("end", () => resolve(h.digest("hex"))).on("error", reject);
  });
}

const t0 = Date.now();
let browserExecutable = process.env.CHROME_BIN || undefined;
if (!browserExecutable) {
  await ensureBrowser();
  console.log("browser ensured (remotion default)");
}
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
console.log("bundle_s", ((Date.now() - t0) / 1000).toFixed(1));

for (const job of JOBS) {
  const composition = await selectComposition({ serveUrl, id: job.id, browserExecutable, chromiumOptions: { gl: "swangle" } });
  console.log("comp", composition.id, composition.durationInFrames, "frames");
  const t1 = Date.now();
  let last = 0;
  await renderMedia({
    composition, serveUrl, codec: "h264", outputLocation: job.out,
    scale: 1, browserExecutable, chromiumOptions: { gl: "swangle" },
    concurrency: Number(process.env.CONCURRENCY || 3), crf: 18,
    timeoutInMilliseconds: 600000,
    onProgress: ({ progress }) => { const p = Math.floor(progress * 100); if (p >= last + 5) { last = p; console.log(job.id, "progress", p + "%", ((Date.now() - t1) / 1000).toFixed(0) + "s"); } },
  });
  const dt = (Date.now() - t1) / 1000;
  const size = statSync(job.out).size;
  const hash = await sha256(job.out);
  console.log(`DONE ${job.id} ${composition.durationInFrames} frames in ${dt.toFixed(1)}s = ${(dt / composition.durationInFrames).toFixed(2)}s/frame size=${size} sha256=${hash}`);
}
console.log("ALL_DONE total_s", ((Date.now() - t0) / 1000).toFixed(1));
