#!/bin/bash
# Kerja-berat job: render RubahLembut final (1080x1920, 150 frame) — uji gaya 3D halus Panggung Satwa.
set -x
cd ps3d || exit 1
export REMOTION_TMP=$PWD/remotion-tmp TEMP=$PWD/remotion-tmp TMP=$PWD/remotion-tmp
mkdir -p remotion-tmp out public
node --version; npm --version
npm ci --no-audit --no-fund 2>&1 | tail -2 || npm install --no-audit --no-fund 2>&1 | tail -2
node render_final.mjs out/video.mp4 2>&1 | tail -30
ls -la out/
ffprobe -v error -show_entries format=duration,size -of default=nw=1 out/video.mp4 || true
sha256sum out/video.mp4
mkdir -p ../hasil-run
split -b 20M -d -a 2 out/video.mp4 ../hasil-run/chunk-
ls -la ../hasil-run/
echo RENDER_JOB_DONE
