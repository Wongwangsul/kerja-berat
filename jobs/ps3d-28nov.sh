#!/bin/bash
# Kerja-berat job GABUNGAN: render 3 Short Panggung Satwa tayang 28 Nov 2026
# (PelikanGagak, SingaMonyet, PausKepiting) — model 3D halus.
# Satu job, satu commit hasil. Folder proyek di repo bernama ps3d.
# v1 (25 Nov) — pola job-kerja-berat.sh 27 Nov
set -x
cd ps3d || exit 1
export REMOTION_TMP=$PWD/remotion-tmp TEMP=$PWD/remotion-tmp TMP=$PWD/remotion-tmp
mkdir -p remotion-tmp out public
node --version; npm --version
npm ci --no-audit --no-fund 2>&1 | tail -2 || npm install --no-audit --no-fund 2>&1 | tail -2
node render_all.mjs > render_all.log 2>&1
RC=$?
tail -40 render_all.log
mkdir -p ../hasil-run
cp render_all.log ../hasil-run/
if [ "$RC" -ne 0 ]; then echo "RENDER FAILED rc=$RC"; exit $RC; fi
for f in out/pelikan-gagak.mp4 out/singa-monyet.mp4 out/paus-kepiting.mp4; do
  slug=$(basename "$f" .mp4)
  ffprobe -v error -show_entries format=duration,size -of default=nw=1 "$f" || true
  sha256sum "$f"
  split -b 20M -d -a 2 "$f" "../hasil-run/${slug}-chunk-"
done
ls -la ../hasil-run/
echo RENDER_JOB_DONE
