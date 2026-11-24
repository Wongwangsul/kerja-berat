#!/bin/bash
# Kerja-berat job: render BimaTangga final (1080x1920) and split the mp4 into <45MB chunks.
set -x
cd bima3d || exit 1
export REMOTION_TMP=$PWD/remotion-tmp TEMP=$PWD/remotion-tmp TMP=$PWD/remotion-tmp
mkdir -p remotion-tmp out hasil-run public
node --version; npm --version
npm ci --no-audit --no-fund 2>&1 | tail -2 || npm install --no-audit --no-fund 2>&1 | tail -2
node render_final.mjs out/video.mp4 2>&1 | tail -30
ls -la out/
ffprobe -v error -show_entries format=duration,size -of default=nw=1 out/video.mp4 || true
sha256sum out/video.mp4
split -b 40M -d -a 2 out/video.mp4 hasil-run/chunk-
ls -la hasil-run/
echo RENDER_JOB_DONE
