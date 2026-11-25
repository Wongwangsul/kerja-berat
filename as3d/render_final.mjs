// Render Anak Sungai per rentang frame: env FSTART, FEND, OUTNAME, CONCURRENCY
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition, ensureBrowser } from "@remotion/renderer";
import path from "node:path";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const chromiumOptions = { gl: "swangle" };
const concurrency = Number(process.env.CONCURRENCY || 4);
const fstart = Number(process.env.FSTART || 0);
const fend = Number(process.env.FEND || 7199);
const outFile = path.resolve("out/" + (process.env.OUTNAME || "anak-sungai-video.mp4"));

const t0 = Date.now();
await ensureBrowser();
console.log("browser ensured");
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
console.log("bundle_s", ((Date.now() - t0) / 1000).toFixed(1));
const composition = await selectComposition({ serveUrl, id: "AnakSungai", chromiumOptions });
console.log("comp", composition.id, composition.durationInFrames, "frames @", composition.fps, "fps", composition.width + "x" + composition.height, "range", fstart, fend);
let last = 0;
await renderMedia({
  composition, serveUrl, codec: "h264", outputLocation: outFile,
  chromiumOptions, concurrency, crf: 18, frameRange: [fstart, fend],
  timeoutInMilliseconds: 600000,
  onProgress: ({ progress }) => {
    const p = Math.floor(progress * 100);
    if (p >= last + 2) { last = p; console.log("progress", p + "%", "elapsed_s", ((Date.now() - t0) / 1000).toFixed(0)); }
  },
});
const totalS = (Date.now() - t0) / 1000;
const sha = createHash("sha256").update(readFileSync(outFile)).digest("hex");
console.log("DONE", outFile, "total_s", totalS.toFixed(1), "s_per_frame", (totalS / (fend - fstart + 1)).toFixed(3), "sha256", sha);
