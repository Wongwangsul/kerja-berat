import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'node:path';

const entryPoint = path.resolve('src/index.ts');
const outputLocation = process.argv[2];
if (!outputLocation) throw new Error('usage: node render.mjs <output.mp4>');

console.log('bundling...');
const serveUrl = await bundle({ entryPoint });
const composition = await selectComposition({ serveUrl, id: 'JanganMenilai' });
console.log('composition ok:', composition.id, composition.durationInFrames, 'frames');

let lastPct = -1;
await renderMedia({
  composition,
  serveUrl,
  codec: 'h264',
  outputLocation,
  onProgress: ({ progress }) => {
    const pct = Math.round(progress * 100);
    if (pct >= lastPct + 20) {
      lastPct = pct;
      console.log('render progress:', pct + '%');
    }
  },
});
console.log('DONE', outputLocation);
