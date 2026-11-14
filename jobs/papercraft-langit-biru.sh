#!/usr/bin/env bash
# Render video paper craft "Kenapa Langit Berwarna Biru?" (1080x1920, 30fps)
# Masukan: pc/index.html + pc/export-frames.mjs + pc/audio-*.b64 (base64 mix-final.mp3)
# Keluaran: hasil-run/part-* (base64 MP4 terpotong) + hasil-run/info.txt
set -euo pipefail
echo "=== papercraft-langit-biru ==="
node --version
ffmpeg -version 2>/dev/null | head -1 || sudo apt-get install -y ffmpeg >/dev/null 2>&1 && ffmpeg -version | head -1

cat pc/audio-*.b64 | base64 -d > mix.mp3
ls -la mix.mp3

mkdir -p work
cp pc/index.html pc/export-frames.mjs work/
cd work
npm init -y >/dev/null 2>&1
npm i puppeteer@25.16.0 --no-fund --no-audit 2>&1 | tail -1
python3 -m http.server 5178 >/dev/null 2>&1 &
SRV=$!
sleep 1
FPS=30 URL=http://127.0.0.1:5178/index.html?clean=1 node export-frames.mjs
kill $SRV 2>/dev/null || true
echo "jumlah frame: $(ls frames | wc -l)"
cd ..

mkdir -p hasil-run
ffmpeg -y -framerate 30 -i work/frames/f%05d.jpg -i mix.mp3 \
  -c:v libx264 -pix_fmt yuv420p -crf 24 -preset medium \
  -c:a aac -b:a 128k -shortest hasil-run/video.mp4 2>&1 | tail -2
ffprobe -v error -show_entries format=duration,size -show_entries stream=codec_name,width,height \
  -of default=noprint_wrappers=1 hasil-run/video.mp4 | tee hasil-run/info.txt
base64 -w0 hasil-run/video.mp4 > video.b64
split -b 600000 -d -a 3 video.b64 hasil-run/part-
rm -f hasil-run/video.mp4 video.b64
ls -la hasil-run/
echo "=== selesai ==="
