#!/bin/bash
# Kerja-berat job GABUNGAN: render 4 Short Panggung Satwa tayang 25 Nov 2026
# (LebahPelikan, KelinciSinga, KudaLautPaus, BadakJawa) — model 3D halus.
# Satu job, satu commit hasil. Folder proyek di repo bernama ps3d.
# v2 (24 Nov ~17.55 WIB): picu ulang sesudah perbaikan ps3d/src/index.ts
# (v1 gagal: bundle hanya berisi RubahLembut karena index.ts lama).
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
for f in out/lebah-pelikan.mp4 out/kelinci-singa.mp4 out/kudalaut-paus.mp4 out/badak-jawa.mp4; do
  slug=$(basename "$f" .mp4)
  ffprobe -v error -show_entries format=duration,size -of default=nw=1 "$f" || true
  sha256sum "$f"
  split -b 20M -d -a 2 "$f" "../hasil-run/${slug}-chunk-"
done
ls -la ../hasil-run/
echo RENDER_JOB_DONE
