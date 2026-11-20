#!/bin/bash
echo "node: $(node -v 2>&1)  npm: $(npm -v 2>&1)"
which ffmpeg && ffmpeg -version 2>/dev/null | head -1
cd payload/tacoma || exit 1
npm ci --no-audit --no-fund 2>&1 | tail -2
npx remotion browser ensure 2>&1 | tail -2
run_probe () { node probe-render.mjs 0 59 1 2 BridgeShort probe60.mp4; }
if ! run_probe; then
  echo "== probe gagal; pasang dependensi chrome lalu ulang =="
  sudo apt-get update -qq && sudo apt-get install -y -qq libnss3 libatk1.0-0t64 libatk-bridge2.0-0t64 libcups2t64 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2t64 libpango-1.0-0 libcairo2 2>&1 | tail -2
  run_probe || exit 1
fi
cp probe60.mp4 ../../hasil-run/ 2>/dev/null || cp probe60.mp4 /tmp/
ls -la
