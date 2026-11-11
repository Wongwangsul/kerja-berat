#!/usr/bin/env bash
# Render uji HyperFrames: "Doa Setelah Makan" (LALA) vertikal 1080x1920 30fps, 44,1 detik, DENGAN narasi kloning.
# Job baru dibuat 11 Nov 2026 (perubahan berkas .sh ini yang memicu workflow).
# Revisi 2 (11 Nov 2026): kepala kucing adegan 1 disembunyikan sampai waktunya, uap piring tidak ikut terangkat, lengan ibu lebih ramping diagonal + pegangan tepi depan piring, telapak tepukan ibu lebih lebar menempel puncak hijab.
# Masukan proyek ada di jobs/lala-setelah-proj/ (dikirim dalam commit yang sama), termasuk assets/narasi.b64.*.
# Hasil besar (MP4) dikembalikan lewat GitHub Release; berkas kecil ke hasil-run/.
set -x

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROJ="$ROOT/jobs/lala-setelah-proj"
OUTDIR="$ROOT/hasil-run"
mkdir -p "$OUTDIR"
cd "$PROJ" || exit 1

# --- Pulihkan MP3 narasi dari potongan base64 (jalur kirim repo hanya aman untuk teks) ---
cat assets/narasi.b64.* | base64 -d > assets/narasi.mp3 || exit 1
ffprobe -v error -show_entries format=duration,size -of default=noprint_wrappers=1 assets/narasi.mp3

# --- Node 22+ (HyperFrames membutuhkannya) ---
node_ok() { node -e 'process.exit(parseInt(process.versions.node.split(".")[0],10)>=22?0:1)' 2>/dev/null; }
if ! node_ok; then
  export NVM_DIR="$HOME/.nvm"
  if [ -s "$NVM_DIR/nvm.sh" ]; then
    . "$NVM_DIR/nvm.sh"
    nvm install 22 || true
    nvm use 22 || true
  fi
fi
if ! node_ok; then
  T=node-v22.14.0-linux-x64
  curl -fsSL "https://nodejs.org/dist/v22.14.0/$T.tar.xz" -o /tmp/node.tar.xz || exit 1
  tar -xJf /tmp/node.tar.xz -C /tmp || exit 1
  export PATH="/tmp/$T/bin:$PATH"
fi
node --version || exit 1
node_ok || exit 1

# --- ffmpeg + pustaka sistem untuk Chrome headless ---
if ! command -v ffmpeg >/dev/null 2>&1; then
  sudo apt-get update -qq
  sudo apt-get install -y -qq ffmpeg libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2t64 libpango-1.0-0 libcairo2 >/dev/null 2>&1 || \
  sudo apt-get install -y ffmpeg libnss3 libatk1.0-0t64 libatk-bridge2.0-0t64 libcups2t64 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2t64 libpango-1.0-0 libcairo2
fi
ffmpeg -version | head -1

# --- Font: Amiri (Arab untuk teks doa) + Baloo 2 (Latin) ---
mkdir -p assets/fonts
curl -fsSL "https://raw.githubusercontent.com/google/fonts/main/ofl/amiri/Amiri-Regular.ttf" -o assets/fonts/Amiri-Regular.ttf || true
curl -fsSL "https://raw.githubusercontent.com/google/fonts/main/ofl/amiri/Amiri-Bold.ttf" -o assets/fonts/Amiri-Bold.ttf || true
curl -fsSL "https://raw.githubusercontent.com/google/fonts/main/ofl/baloo2/Baloo2%5Bwght%5D.ttf" -o assets/fonts/Baloo2.ttf || true
ls -la assets/fonts/

# --- Chrome headless shell untuk HyperFrames ---
export HYPERFRAMES_EXTRACT_CACHE_DIR="$PROJ/.framecache"
mkdir -p "$HYPERFRAMES_EXTRACT_CACHE_DIR"
npx -y hyperframes@0.9.33 browser ensure || exit 1

# --- Render video (tanpa suara) ---
npx -y hyperframes@0.9.33 render -o renders/lala-setelah.mp4 -f 30 -q delivery || exit 1
ls -la renders/
ffprobe -v error -show_format -show_streams renders/lala-setelah.mp4 | tee "$OUTDIR/ffprobe-video.txt"

# --- Mux narasi: loudnorm ke -14 LUFS (nilai ukur MP3 asli), pad ke 44,1 detik ---
# Ukuran MP3 asli: I=-17.92 TP=-1.79 LRA=2.90 thresh=-28.34 offset=-0.03
ffmpeg -y -i renders/lala-setelah.mp4 -i assets/narasi.mp3 \
  -filter_complex "[1:a]loudnorm=I=-14:TP=-1.0:LRA=11:measured_I=-17.92:measured_TP=-1.79:measured_LRA=2.90:measured_thresh=-28.34:offset=-0.03:linear=false,aresample=48000,apad=whole_dur=44.1[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -t 44.1 renders/lala-setelah-final.mp4 || exit 1
ls -la renders/
ffprobe -v error -show_format -show_streams renders/lala-setelah-final.mp4 | tee "$OUTDIR/ffprobe.txt"
ffmpeg -hide_banner -i renders/lala-setelah-final.mp4 -af loudnorm=print_format=json -f null - 2>&1 | tail -14 | tee "$OUTDIR/loudnorm-final.txt" || true

# --- Kembalikan MP4 lewat GitHub Release (token checkout dari extraheader) ---
TAG="lala-doa-setelah-uji-$(date +%Y%m%d%H%M%S)"
HDR="$(git -C "$ROOT" config --get http.https://github.com/.extraheader)"
API="https://api.github.com/repos/Wongwangsul/kerja-berat"
curl -s -X POST -H "$HDR" -H "Accept: application/vnd.github+json" \
  "$API/releases" \
  -d "{\"tag_name\":\"$TAG\",\"name\":\"Lala Doa Setelah Makan HyperFrames Uji\",\"body\":\"Render uji HyperFrames: Doa Setelah Makan (LALA) vertikal 1080x1920 30fps 44,1 detik dengan narasi kloning asli.\"}" \
  -o rel.json
cat rel.json
RID="$(python3 -c "import json;print(json.load(open('rel.json'))['id'])")"
echo "release id: $RID tag: $TAG"
CODE="$(curl -s -o up.json -w '%{http_code}' -X POST -H "$HDR" -H "Content-Type: video/mp4" \
  --data-binary @renders/lala-setelah-final.mp4 \
  "https://uploads.github.com/repos/Wongwangsul/kerja-berat/releases/$RID/assets?name=lala-doa-setelah-hyperframes-uji.mp4")"
echo "upload http: $CODE"
cat up.json
{
  echo "tag: $TAG"
  echo "release_id: $RID"
  echo "upload_http: $CODE"
} > "$OUTDIR/release.txt"
[ "$CODE" = "201" ] || exit 1
echo "SELESAI: MP4 terunggah ke Release tag $TAG"
