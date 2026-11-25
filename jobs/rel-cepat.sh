#!/bin/bash
# Kerja-berat job: render uji rel versi cepat bernarasi (1080x1920, 714 frame).
set -x
cd rel || exit 1
export REMOTION_TMP=$PWD/remotion-tmp TEMP=$PWD/remotion-tmp TMP=$PWD/remotion-tmp
mkdir -p remotion-tmp out public
base64 -d public/narasi.ogg.b64 > public/narasi.ogg
base64 -d public/musik.ogg.b64 > public/musik.ogg
ls -la public/
node --version; npm --version
npm install --no-audit --no-fund 2>&1 | tail -2
node render_cepat.mjs out/video.mp4 2>&1 | tail -30
ls -la out/
ffprobe -v error -show_entries format=duration,size -of default=nw=1 out/video.mp4 || true
sha256sum out/video.mp4
mkdir -p ../hasil-run
split -b 20M -d -a 2 out/video.mp4 ../hasil-run/chunk-
ls -la ../hasil-run/
echo RENDER_JOB_DONE
