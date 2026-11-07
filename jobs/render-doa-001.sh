#!/usr/bin/env bash
# Render video Remotion "Doa Sebelum Makan" (1920x1080, 31.5 dtk) di runner GitHub Actions.
# Masukan: render-data/doa-001 (proyek Remotion; narasi.mp3 sebagai teks base64 satu berkas).
# Hasil kecil (poster + url) -> hasil-run/ ; video besar -> GitHub Release.
set -u
ROOT="$PWD"
DATA="$ROOT/render-data/doa-001"
OUT="$ROOT/hasil-run"
mkdir -p "$OUT"
cd "$DATA"

echo "== Rakit narasi.mp3 dari base64 =="
base64 -d public/narasi.mp3.b64 > public/narasi.mp3
UKURAN=$(stat -c%s public/narasi.mp3)
echo "Ukuran narasi.mp3: $UKURAN (harus 490728)"
if [ "$UKURAN" != "490728" ]; then
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
npx remotion render DoaSebelumMakan doa-sebelum-makan.mp4 --concurrency=4
VIDEO="$DATA/doa-sebelum-makan.mp4"
if [ ! -f "$VIDEO" ]; then
  echo "RENDER GAGAL: video tidak terbentuk"
  exit 1
fi
ls -la "$VIDEO"
ffprobe -v error -show_entries format=duration,size -of default=noprint_wrappers=1 "$VIDEO" || true

echo "== Poster (frame detik 14, adegan doa) =="
ffmpeg -y -v error -ss 14 -i "$VIDEO" -frames:v 1 "$OUT/poster.jpg" || true

echo "== Unggah video ke GitHub Release =="
TAG="render-doa-001"
NAME="doa-sebelum-makan.mp4"
REPO="Wongwangsul/kerja-berat"
API="https://api.github.com/repos/$REPO"
UP="https://uploads.github.com/repos/$REPO"

# Ambil token dari kredensial git yang dipasang actions/checkout
HDR="$(git config --local --get http.https://github.com/.extraheader || true)"
TOKEN=""
if [ -n "$HDR" ]; then
  B64="$(echo "$HDR" | awk '{print $NF}')"
  TOKEN="$(printf '%s' "$B64" | base64 -d 2>/dev/null | sed -n 's/^x-access-token://p')"
  if [ -z "$TOKEN" ]; then
    TOKEN="$(printf '%s' "$B64" | base64 -d 2>/dev/null | sed -n 's/^[^:]*://p')"
  fi
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
      -d "{\"tag_name\":\"$TAG\",\"name\":\"Render doa-001\",\"body\":\"Video Remotion Doa Sebelum Makan hasil render GitHub Actions.\"}" \
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
