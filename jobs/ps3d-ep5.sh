#!/bin/bash
# Kerja-berat job GABUNGAN (SATU job, SATU commit hasil): render Ep5 Panggung Satwa
# "Lumba-Lumba dan Penyu Mengejar Matahari" — model 3D halus, 1920x1080 @30fps.
# Folder proyek di repo bernama ps3d. Video-only (audio di-mux lokal).
set -x
cd ps3d || exit 1
export REMOTION_TMP=$PWD/remotion-tmp TEMP=$PWD/remotion-tmp TMP=$PWD/remotion-tmp
mkdir -p remotion-tmp out public
node --version; npm --version
npm ci --no-audit --no-fund 2>&1 | tail -2 || npm install --no-audit --no-fund 2>&1 | tail -2
node render_ep5.mjs > render_ep5.log 2>&1
RC=$?
tail -40 render_ep5.log
mkdir -p ../hasil-run
cp render_ep5.log ../hasil-run/
if [ "$RC" -ne 0 ]; then echo "RENDER FAILED rc=$RC"; exit $RC; fi
f=out/lumbalumba-penyu-matahari.mp4
ffprobe -v error -show_entries format=duration,size -of default=nw=1 "$f" || true
sha256sum "$f"
split -b 20M -d -a 2 "$f" "../hasil-run/lumbalumba-penyu-matahari-chunk-"
ls -la ../hasil-run/
echo RENDER_JOB_DONE
