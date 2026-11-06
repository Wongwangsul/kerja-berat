#!/usr/bin/env bash
# Render video cerita "Dompet Menjelang Magrib" di runner GitHub Actions.
# Masukan: render-data/dompet-001 (panel+audio sebagai berkas teks base64).
# Hasil kecil (poster + info) -> hasil-run/ ; video besar -> GitHub Release.
set -u
ROOT="$PWD"
DATA="$ROOT/render-data/dompet-001"
OUT="$ROOT/hasil-run"
mkdir -p "$OUT"
cd "$DATA"

echo "== Dekode masukan base64 =="
for f in panels/*.b64; do base64 -d "$f" > "${f%.b64}"; done
for f in audio/*.b64; do base64 -d "$f" > "${f%.b64}"; done
ls -la panels audio

echo "== Periksa alat =="
if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg belum ada di runner ini, pasang via apt..."
  sudo apt-get update -qq && sudo apt-get install -y -qq ffmpeg
fi
ffmpeg -version | head -1
python3 --version
if ! fc-list | grep -qi dejavu; then
  echo "Font DejaVu belum ada, pasang..."
  sudo apt-get update -qq && sudo apt-get install -y -qq fonts-dejavu-core
fi
fc-list | grep -i dejavu | head -3

echo "== Render =="
python3 build_render.py
VIDEO="$DATA/dompet-menjelang-magrib.mp4"
if [ ! -f "$VIDEO" ]; then
  echo "RENDER GAGAL: video tidak terbentuk"
  exit 1
fi
cp "$DATA/poster.jpg" "$OUT/poster.jpg" 2>/dev/null || true
ls -la "$VIDEO"

echo "== Unggah video ke GitHub Release =="
TAG="render-dompet-001"
NAME="dompet-menjelang-magrib.mp4"
REPO="Wongwangsul/kerja-berat"
API="https://api.github.com/repos/$REPO"
UP="https://uploads.github.com/repos/$REPO"

# Ambil token dari kredensial git yang dipasang actions/checkout
HDR="$(git config --local --get http.https://github.com/.extraheader || true)"
TOKEN=""
if [ -n "$HDR" ]; then
  B64="$(echo "$HDR" | awk '{print $NF}')"
  TOKEN="$(echo "$B64" | base64 -d 2>/dev/null | sed 's/^[^:]*://')"
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
      -d "{\"tag_name\":\"$TAG\",\"name\":\"Render dompet-001\",\"body\":\"Video hasil render GitHub Actions untuk Studio Cerita.\"}" \
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
