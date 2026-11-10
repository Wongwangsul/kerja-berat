#!/usr/bin/env bash
# Render MP4 dari animasi web Mie Instan Tengah Malam (1080x1920, 30fps, senyap)
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$DIR/.." && pwd)"
mkdir -p "$ROOT/hasil-run"
node --version; python3 --version
WORK=$(mktemp -d)
cp "$DIR/render-mie-web-001/index.html" "$WORK/"
cp "$DIR/render-mie-web-001/export-frames.mjs" "$WORK/"
cd "$WORK"
npm init -y >/dev/null 2>&1
npm i puppeteer 2>&1 | tail -2
(python3 -m http.server 5178 --directory "$WORK" >/dev/null 2>&1 &)
sleep 1
URL="http://127.0.0.1:5178/index.html?clean=1" FPS=30 OUT="$WORK/frames" node export-frames.mjs
which ffmpeg || (sudo apt-get update -qq && sudo apt-get install -y -qq ffmpeg)
ffmpeg -y -loglevel error -framerate 30 -i "$WORK/frames/f%05d.png" -c:v libx264 -pix_fmt yuv420p -crf 18 -movflags +faststart "$ROOT/hasil-run/Video Lucu - Mie Instan Tengah Malam (Animasi Web).mp4"
ls -la "$ROOT/hasil-run/"
