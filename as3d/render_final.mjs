// Render final Anak Sungai (tanpa audio; audio dimux terpisah):
// node render_final.mjs  -> out/anak-sungai-video.mp4
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "node:path";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const chromiumOptions = { gl: "swangle" };
const concurrency = Number(process.env.CONCURRENCY || 3);
const outFile = path.resolve("out/anak-sungai-video.mp4");

const t0 = Date.now();
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
console.log("bundle_s", ((Date.now() - t0) / 1000).toFixed(1));
const composition = await selectComposition({ serveUrl, id: "AnakSungai", chromiumOptions });
console.log("comp", composition.id, composition.durationInFrames, "frames @", composition.fps, "fps", composition.width + "x" + composition.height);
let lastLog = 0;
await renderMedia({
  composition, serveUrl, codec: "h264", outputLocation: outFile,
  chromiumOptions, concurrency, crf: 18,
  onProgress: ({ progress }) => {
    const now = Date.now();
    if (now - lastLog > 30000) { lastLog = now; console.log("progress", (progress * 100).toFixed(1) + "%", "elapsed_s", ((now - t0) / 1000).toFixed(0)); }
  },
});
const totalS = (Date.now() - t0) / 1000;
const sha = createHash("sha256").update(readFileSync(outFile)).digest("hex");
console.log("DONE", outFile, "total_s", totalS.toFixed(1), "s_per_frame", (totalS / composition.durationInFrames).toFixed(3), "sha256", sha);
