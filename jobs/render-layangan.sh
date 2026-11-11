#!/usr/bin/env bash
# Render uji HyperFrames: video layang-layang vertikal 1080x1920 30fps, 15 detik, tanpa suara.
# Masukan proyek ada di jobs/layangan-proj/ (dikirim dalam commit yang sama).
# Hasil besar (MP4) dikembalikan lewat GitHub Release; berkas kecil ke hasil-run/.
set -x

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROJ="$ROOT/jobs/layangan-proj"
OUTDIR="$ROOT/hasil-run"
mkdir -p "$OUTDIR"
cd "$PROJ" || exit 1

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

# --- Chrome headless shell untuk HyperFrames ---
export HYPERFRAMES_EXTRACT_CACHE_DIR="$PROJ/.framecache"
mkdir -p "$HYPERFRAMES_EXTRACT_CACHE_DIR"
npx -y hyperframes@0.9.33 browser ensure || exit 1

# --- Render ---
npx -y hyperframes@0.9.33 render -o renders/layangan.mp4 -f 30 -q delivery || exit 1
ls -la renders/
ffprobe -v error -show_format -show_streams renders/layangan.mp4 | tee "$OUTDIR/ffprobe.txt"

# --- Kembalikan MP4 lewat GitHub Release (token checkout dari extraheader) ---
TAG="layangan-uji-$(date +%Y%m%d%H%M%S)"
HDR="$(git -C "$ROOT" config --get http.https://github.com/.extraheader)"
API="https://api.github.com/repos/Wongwangsul/kerja-berat"
curl -s -X POST -H "$HDR" -H "Accept: application/vnd.github+json" \
  "$API/releases" \
  -d "{\"tag_name\":\"$TAG\",\"name\":\"Layangan HyperFrames Uji\",\"body\":\"Render uji HyperFrames: layang-layang vertikal 1080x1920 30fps 15 detik.\"}" \
  -o rel.json
cat rel.json
RID="$(python3 -c "import json;print(json.load(open('rel.json'))['id'])")"
echo "release id: $RID tag: $TAG"
CODE="$(curl -s -o up.json -w '%{http_code}' -X POST -H "$HDR" -H "Content-Type: video/mp4" \
  --data-binary @renders/layangan.mp4 \
  "https://uploads.github.com/repos/Wongwangsul/kerja-berat/releases/$RID/assets?name=layangan-hyperframes-uji.mp4")"
echo "upload http: $CODE"
cat up.json
{
  echo "tag: $TAG"
  echo "release_id: $RID"
  echo "upload_http: $CODE"
} > "$OUTDIR/release.txt"
[ "$CODE" = "201" ] || exit 1
echo "SELESAI: MP4 terunggah ke Release tag $TAG"
