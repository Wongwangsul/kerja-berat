// Probe: renderMedia frame range, timed, NO local browserExecutable (runner downloads its own chrome).
// usage: node probe-render.mjs <start> <end> <scale> <concurrency> <compId> <out.mp4>
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "node:path";
const [start, end, scale, conc, compId, out] = process.argv.slice(2);
const chromiumOptions = { gl: "swangle" };
const t0 = Date.now();
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
console.log("bundle_s", ((Date.now() - t0) / 1000).toFixed(1));
const composition = await selectComposition({ serveUrl, id: compId, chromiumOptions });
console.log("comp", composition.id, composition.durationInFrames, "frames", composition.width + "x" + composition.height);
const t1 = Date.now();
await renderMedia({ composition, serveUrl, codec: "h264", outputLocation: out,
  frameRange: [Number(start), Number(end)], scale: Number(scale),
  chromiumOptions, concurrency: Number(conc), crf: 23, timeoutInMilliseconds: 600000,
  onProgress: ({ progress }) => console.log("progress", Math.floor(progress * 100) + "%", ((Date.now() - t1) / 1000).toFixed(0) + "s") });
const dt = (Date.now() - t1) / 1000, n = Number(end) - Number(start) + 1;
console.log(`renderMedia ${n} frames in ${dt.toFixed(1)}s = ${(dt / n).toFixed(2)}s/frame @conc${conc} scale${scale}`);
