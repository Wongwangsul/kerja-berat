#!/usr/bin/env bash
# Render video "Doa Sebelum Makan" versi Studio Cerita (panel StoryBoardku,
# gerak zoompan ffmpeg, narasi asli) 720x1280, 31,5 dtk, di runner GitHub Actions.
# Masukan: render-data/doa-makan-001 (panel, narasi, font sebagai teks base64).
# Hasil kecil (poster + url) -> hasil-run/ ; video besar -> GitHub Release.
set -u
ROOT="$PWD"
DATA="$ROOT/render-data/doa-makan-001"
OUT="$ROOT/hasil-run"
mkdir -p "$OUT"
cd "$DATA"

echo "== Dekode semua masukan base64 =="
for f in *.b64; do
  base64 -d "$f" > "${f%.b64}"
done
ls -la
UKURAN=$(stat -c%s narasi.mp3)
echo "Ukuran narasi.mp3: $UKURAN (harus 490728)"
if [ "$UKURAN" != "490728" ]; then
  echo "UKURAN NARASI SALAH"
  exit 1
fi
for p in p1.webp p2.webp p3.webp p4.webp p5.webp p6.webp; do
  if [ ! -s "$p" ]; then echo "PANEL HILANG: $p"; exit 1; fi
done

echo "== Periksa alat =="
if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg belum ada di runner ini, pasang via apt..."
  sudo apt-get update -qq && sudo apt-get install -y -qq ffmpeg
fi
ffmpeg -version | head -1
python3 --version

echo "== Render =="
python3 build_render.py
VIDEO="$DATA/doa-sebelum-makan-studio.mp4"
if [ ! -f "$VIDEO" ]; then
  echo "RENDER GAGAL: video tidak terbentuk"
  exit 1
fi
ls -la "$VIDEO"
ffprobe -v error -show_entries format=duration,size -of default=noprint_wrappers=1 "$VIDEO" || true

echo "== Poster (frame detik 16, adegan doa) =="
ffmpeg -y -v error -ss 16 -i "$VIDEO" -frames:v 1 "$OUT/poster.jpg" || true

echo "== Unggah video ke GitHub Release =="
TAG="render-doa-makan-002"
NAME="doa-sebelum-makan-studio.mp4"
REPO="Wongwangsul/kerja-berat"
API="https://api.github.com/repos/$REPO"
UP="https://uploads.github.com/repos/$REPO"

# Ambil token dari kredensial git yang dipasang actions/checkout
HDR="$(git config --local --get http.https://github.com/.extraheader || true)"
TOKEN=""
if [ -n "$HDR" ]; then
  B64="$(echo "$HDR" | awk '{print $NF}')"
  TOKEN="$(echo "$B64" | base64 -d 2>/dev/null | sed 's/^x-access-token://')"
  if [ -z "$TOKEN" ]; then
    TOKEN="$(echo "$B64" | base64 -d 2>/dev/null | cut -d: -f2-)"
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
      -d "{\"tag_name\":\"$TAG\",\"name\":\"Render doa-makan-002\",\"body\":\"Video Doa Sebelum Makan versi Studio Cerita (panel StoryBoardku) hasil render GitHub Actions.\"}" \
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
