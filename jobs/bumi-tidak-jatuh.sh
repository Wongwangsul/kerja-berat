#!/bin/bash
# Kerja berat: render + mix episode "Kabar Baik, Kabar Buruk - Kenapa Bumi Tidak Jatuh"
# Payload ada di jobs/bumi-payload (kit motion-educator + sumber film). Berkas mp3
# dikirim sebagai .b64 (teks) karena push snapshot hanya menerima UTF-8; di-decode di sini.
set -x
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/jobs/bumi-payload" || exit 1

for b in $(find . -name '*.b64'); do base64 -d "$b" > "${b%.b64}"; done
find . -name '*.mp3' -exec ls -la {} \;

node --version
python3 --version
command -v ffmpeg >/dev/null 2>&1 || { sudo apt-get update -qq && sudo apt-get install -y -qq ffmpeg; }
ffmpeg -version | head -1
python3 -c "import numpy" 2>/dev/null || { sudo apt-get update -qq && sudo apt-get install -y -qq python3-numpy; }
python3 -c "import numpy; print('numpy', numpy.__version__)"

npm install --no-audit --no-fund
npm i --no-save playwright@1.65.1 --no-audit --no-fund
npx playwright install --with-deps --only-shell chromium || npx playwright install --with-deps chromium

node kit/tools/render.mjs films/bumi-tidak-jatuh --fps 30 --jobs 4
ls -la films/bumi-tidak-jatuh/out/ films/bumi-tidak-jatuh/out/segments/ || true

python3 kit/audio/mix.py films/bumi-tidak-jatuh
cat films/bumi-tidak-jatuh/out/bumi-tidak-jatuh.mix.txt || true

mkdir -p "$ROOT/hasil-run"
cp films/bumi-tidak-jatuh/out/bumi-tidak-jatuh.mix.txt "$ROOT/hasil-run/" 2>/dev/null || true
ffmpeg -y -v error -i films/bumi-tidak-jatuh/out/bumi-tidak-jatuh.mp4 -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k -movflags +faststart "$ROOT/hasil-run/bumi-final.mp4"
ffprobe -v error -show_entries format=duration,size -show_entries stream=codec_type,width,height,r_frame_rate -of default=noprint_wrappers=1 "$ROOT/hasil-run/bumi-final.mp4" > "$ROOT/hasil-run/probe.txt" 2>&1 || true
ffmpeg -hide_banner -i "$ROOT/hasil-run/bumi-final.mp4" -af loudnorm=print_format=json -f null - 2> "$ROOT/hasil-run/loudness.txt" || true
ls -la "$ROOT/hasil-run/"
echo "BUMI JOB SELESAI"
