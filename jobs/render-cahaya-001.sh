#!/usr/bin/env bash
# Render video Remotion "Cahaya Matahari" (1920x1080, 112 dtk) di runner GitHub Actions.
# Masukan: render-data/cahaya-001 (proyek Remotion; narasi.mp3 sebagai teks base64 terpotong).
# Hasil kecil (poster + url) -> hasil-run/ ; video besar -> GitHub Release.
set -u
ROOT="$PWD"
DATA="$ROOT/render-data/cahaya-001"
OUT="$ROOT/hasil-run"
mkdir -p "$OUT"
cd "$DATA"

echo "== Rakit narasi.mp3 dari potongan base64 =="
cat public/narasi.mp3.b64.part-* | base64 -d > public/narasi.mp3
UKURAN=$(stat -c%s public/narasi.mp3)
echo "Ukuran narasi.mp3: $UKURAN (harus 1799114)"
if [ "$UKURAN" != "1799114" ]; then
  echo "UKURAN NARASI SALAH"
  exit 1
fi

echo "== Periksa alat =="
if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg belum ada di runner ini, pasang via apt..."
  sudo apt-get update -qq && sudo apt-get install -y -qq ffmpeg
fi
ffmpeg -version | head -1
node --version
npm --version

echo "== Pasang dependensi proyek =="
npm ci --no-audit --no-fund

echo "== Pastikan browser Remotion tersedia =="
npx remotion browser ensure

echo "== Render =="
npx remotion render CahayaMatahari cahaya-matahari.mp4 --concurrency=4
VIDEO="$DATA/cahaya-matahari.mp4"
if [ ! -f "$VIDEO" ]; then
  echo "RENDER GAGAL: video tidak terbentuk"
  exit 1
fi
ls -la "$VIDEO"
ffprobe -v error -show_entries format=duration,size -of default=noprint_wrappers=1 "$VIDEO" || true

echo "== Poster (frame detik 40) =="
ffmpeg -y -v error -ss 40 -i "$VIDEO" -frames:v 1 "$OUT/poster.jpg" || true

echo "== Unggah video ke GitHub Release =="
TAG="render-cahaya-001"
NAME="cahaya-matahari.mp4"
REPO="Wongwangsul/kerja-berat"
API="https://api.github.com/repos/$REPO"
UP="https://uploads.github.com/repos/$REPO"

# Ambil token dari kredensial git yang dipasang actions/checkout
HDR="$(git config --local --get http.https://github.com/.extraheader || true)"
TOKEN=""
if [ -n "$HDR" ]; then
  B64="$(echo "$HDR" | awk '{print $NF}')"
  TOKEN="$(echo "$B64" | base64 -d 2>/dev/null | sed -n 's/^x-access-token://p')"
fi

rilis_ok=0
if [ -n "$TOKEN" ]; then
  AUTH="Authorization: Bearer $TOKEN"
  # Cari rilis lama dengan tag sama; buat baru bila belum ada
  REL_ID="$(curl -s -H "$AUTH" "$API/releases/tags/$TAG" | python3 -c 'import sys,json
try:
  d=json.load(sys.stdin); print(d.get("id",""))
except Exception: print("")')"
  if [ -z "$REL_ID" ]; then
    REL_ID="$(curl -s -X POST -H "$AUTH" -H 'Content-Type: application/json' \
      -d "{\"tag_name\":\"$TAG\",\"name\":\"Render cahaya-001\",\"body\":\"Video Remotion Cahaya Matahari hasil render GitHub Actions.\"}" \
      "$API/releases" | python3 -c 'import sys,json
try:
  d=json.load(sys.stdin); print(d.get("id",""))
except Exception: print("")')"
  fi
  echo "Release id: $REL_ID"
  if [ -n "$REL_ID" ]; then
    # Hapus aset lama bernama sama agar unggahan ulang tidak bentrok
    OLD_ASSET="$(curl -s -H "$AUTH" "$API/releases/$REL_ID/assets" | python3 -c 'import sys,json
try:
  d=json.load(sys.stdin)
  print(next((a["id"] for a in d if a.get("name")=="'"$NAME"'"),""))
except Exception: print("")')"
    if [ -n "$OLD_ASSET" ]; then
      curl -s -X DELETE -H "$AUTH" "$API/releases/assets/$OLD_ASSET" >/dev/null
      echo "Aset lama dihapus: $OLD_ASSET"
    fi
    CODE="$(curl -s -o /tmp/resp.json -w '%{http_code}' -X POST -H "$AUTH" \
      -H 'Content-Type: video/mp4' --data-binary @"$VIDEO" \
      "$UP/releases/$REL_ID/assets?name=$NAME")"
    echo "Kode unggah aset: $CODE"
    if [ "$CODE" = "201" ]; then
      rilis_ok=1
      URL="https://github.com/$REPO/releases/download/$TAG/$NAME"
      echo "$URL" > "$OUT/release-url.txt"
      echo "Video tersedia di: $URL"
    else
      cat /tmp/resp.json || true
    fi
  fi
else
  echo "Token tidak ditemukan dari kredensial checkout."
fi

if [ "$rilis_ok" != "1" ]; then
  echo "JALUR CADANGAN: video disalin ke hasil-run (artefak + commit)."
  cp "$VIDEO" "$OUT/$NAME"
fi
echo "Selesai."
