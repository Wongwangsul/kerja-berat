#!/usr/bin/env bash
# Render "My Mom" — Bang Motion HTML (lipatan kertas, 6 foto) -> MP4 senyap 15 dtk 1080x1920 30fps.
set -x
cd jobs/my-mom || exit 1

# Gambar dikirim sebagai teks base64 (snapshot push hanya menerima UTF-8) — pulihkan byte persisnya.
for f in assets/*.b64; do base64 -d "$f" > "${f%.b64}"; done
md5sum assets/*.jpg

node --version; npm --version; python3 --version
command -v ffmpeg >/dev/null || { sudo apt-get update -qq && sudo apt-get install -y -qq ffmpeg; }
ffmpeg -version | head -1

npm init -y >/dev/null 2>&1
npm i puppeteer 2>&1 | tail -2

python3 -m http.server 5178 &
SRV=$!
sleep 2
URL=http://127.0.0.1:5178/index.html?clean=1 FPS=30 OUT=frames node export-mom.mjs
kill $SRV 2>/dev/null || true
echo "JUMLAH FRAME: $(ls frames | wc -l)"

ffmpeg -y -framerate 30 -i frames/f%05d.png -c:v libx264 -pix_fmt yuv420p -crf 16 -movflags +faststart my-mom-silent.mp4
ffprobe -v error -show_entries format=duration,size -show_entries stream=codec_name,width,height,r_frame_rate my-mom-silent.mp4

# MP4 dipotong <1MB per potong agar bisa diambil balik lewat API isi GitHub.
mkdir -p ../../hasil-run/chunks
split -b 900k my-mom-silent.mp4 ../../hasil-run/chunks/part-
ls -la ../../hasil-run/chunks/
md5sum my-mom-silent.mp4 | tee ../../hasil-run/md5.txt
