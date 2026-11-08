#!/usr/bin/env bash
# Render penuh "Doa Sebelum Makan" versi Bang Motion (kartun kolase):
# frame-per-frame Chromium 1080x1920 @60fps -> MP4 + mux VO final user.
set -u
cd proyek-doa-bangmotion || { echo "folder proyek tidak ada"; exit 1; }

echo "== pulihkan aset biner dari base64 =="
mkdir -p assets
for f in assets-b64/*.b64; do base64 -d "$f" > "assets/$(basename "${f%.b64}")"; done
ls -la assets/

echo "== dependensi sistem untuk Chromium (bila belum ada) =="
sudo apt-get update -qq && sudo apt-get install -y -qq libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2t64 libpango-1.0-0 libcairo2 ffmpeg >/dev/null 2>&1 || echo "apt dilewati/gagal sebagian (lanjut)"

echo "== pastikan ffmpeg tersedia (gagal cepat sebelum render panjang) =="
if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg dari apt tidak ada; unduh build statis"
  curl -sL https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz -o /tmp/ff.tar.xz && tar -xJf /tmp/ff.tar.xz -C /tmp && export PATH="$(ls -d /tmp/ffmpeg-*-amd64-static):$PATH"
fi
command -v ffmpeg || { echo "ffmpeg tetap tidak tersedia; berhenti sebelum render"; exit 1; }
ffmpeg -version | head -1

echo "== pasang puppeteer =="
npm init -y >/dev/null 2>&1
npm i puppeteer --no-fund --no-audit 2>&1 | tail -2

echo "== layani proyek di 127.0.0.1:5178 =="
python3 -m http.server 5178 >/dev/null 2>&1 &
SERVER=$!
sleep 2

echo "== render frame 60 fps =="
URL="http://127.0.0.1:5178/index.html?clean=1" FPS=60 OUT=frames node tools/export-frames-916.mjs
KODE=$?
kill $SERVER 2>/dev/null
if [ $KODE -ne 0 ]; then echo "RENDER GAGAL, kode $KODE"; exit $KODE; fi
JUMLAH=$(ls frames/*.png | wc -l)
echo "frame terender: $JUMLAH (target 1890)"

echo "== gabung video + mux VO =="
ffmpeg -y -framerate 60 -i frames/f%05d.png -c:v libx264 -pix_fmt yuv420p -crf 17 -preset medium -movflags +faststart video-diam.mp4 || exit 1
mkdir -p ../hasil-run
OUT="../hasil-run/doa-sebelum-makan-bang-motion.mp4"
ffmpeg -y -i video-diam.mp4 -i assets/vo.mp3 -c:v copy -c:a aac -b:a 160k -af apad -t 31.5 "$OUT" || exit 1
ffprobe -v error -show_entries format=duration,size -show_entries stream=codec_type,codec_name,width,height,r_frame_rate -of default=noprint_wrappers=1 "$OUT"

echo "== unggah MP4 ke GitHub Release =="
cd ..
HDR=$(git config --get http.https://github.com/.extraheader || true)
TOK=$(printf '%s' "$HDR" | sed 's/.*basic //' | base64 -d 2>/dev/null | cut -d: -f2)
if [ -n "$TOK" ]; then
  GH_TOKEN=$TOK gh release create render-doa-bangmotion-001 "hasil-run/doa-sebelum-makan-bang-motion.mp4" --title "Doa Sebelum Makan — versi Bang Motion" --notes "Render final 1080x1920 60fps + VO. Hasil job render-doa-bangmotion-001." 2>&1 | tail -2 || echo "release gagal; MP4 tetap ada di artefak/hasil"
else
  echo "token git tidak ditemukan; lewati release"
fi
echo "SELESAI"
