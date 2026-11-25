#!/bin/bash
# Ulang b1 (run b1 hilang tanpa hasil): render Anak Sungai frame 0-3599, shadow 1024, concurrency 4
set -x
cd as3d || exit 1
export REMOTION_TMP=$PWD/remotion-tmp TEMP=$PWD/remotion-tmp TMP=$PWD/remotion-tmp
mkdir -p remotion-tmp out public
node --version; npm --version
npm ci --no-audit --no-fund 2>&1 | tail -2 || npm install --no-audit --no-fund 2>&1 | tail -2
FSTART=0 FEND=3599 OUTNAME=part1.mp4 CONCURRENCY=4 node render_final.mjs > render_final.log 2>&1
RC=$?
tail -40 render_final.log
mkdir -p ../hasil-run
cp render_final.log ../hasil-run/
if [ "$RC" -ne 0 ]; then echo "RENDER FAILED rc=$RC"; exit $RC; fi
f=out/part1.mp4
ffprobe -v error -show_entries format=duration,size -of default=nw=1 "$f" || true
sha256sum "$f"
split -b 20M -d -a 2 "$f" "../hasil-run/part1-chunk-"
ls -la ../hasil-run/
echo RENDER_JOB_DONE
