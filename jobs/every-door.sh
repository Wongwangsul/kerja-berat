#!/usr/bin/env bash
# Kerja berat: render penuh "Every Door Is Different" (493.31 dtk, 1920x1080, 30 fps,
# 14.799 frame) dengan kit Motion Educator. picture.mp4 hasil render dikembalikan
# sebagai aset GitHub Release tag every-door-v1 (dibagi <=1800 MB per berkas,
# gabung kembali dengan `cat pic-part-* > picture.mp4`); ringkasan kecil ditulis
# ke hasil-run/ untuk commit-back workflow.
set -u
WS="${GITHUB_WORKSPACE:-$PWD}"
ED="$WS/kerja/ed"
REL_TAG="every-door-v1"
API="https://api.github.com/repos/Wongwangsul/kerja-berat"
SUM="$WS/hasil-run"
mkdir -p "$SUM"

echo "== Mesin runner =="
nproc; node --version; ffmpeg -version 2>/dev/null | head -1; df -h / | tail -1

# --- Token dari kredensial checkout, untuk membuat Release (fail-fast) ---
HDR="$(git -C "$WS" config --get http.https://github.com/.extraheader || true)"
TOKEN=""
if [ -n "$HDR" ]; then
  B64="$(echo "$HDR" | awk '{print $NF}')"
  DEC="$(echo "$B64" | base64 -d 2>/dev/null || true)"
  TOKEN="$(echo "$DEC" | sed 's/^[^:]*://')"
fi
if [ -z "$TOKEN" ]; then
  echo "GAGAL: token checkout tidak terbaca; berhenti sebelum render."
  exit 1
fi
AUTH="Authorization: Bearer $TOKEN"
REL_ID="$(curl -s -H "$AUTH" -H 'Accept: application/vnd.github+json' "$API/releases/tags/$REL_TAG" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("id",""))' 2>/dev/null)"
if [ -z "$REL_ID" ]; then
  REL_ID="$(curl -s -X POST -H "$AUTH" -H 'Accept: application/vnd.github+json' "$API/releases" \
    -d "{\"tag_name\":\"$REL_TAG\",\"name\":\"Every Door — hasil render\",\"body\":\"picture.mp4 film Every Door Is Different (493.31 dtk, 1920x1080, 30 fps), dibagi per 1800 MB. Gabung: cat pic-part-* > picture.mp4, lalu cocokkan sha256 di hasil/every-door/sha256.txt.\"}" \
    | python3 -c 'import sys,json; print(json.load(sys.stdin).get("id",""))' 2>/dev/null)"
fi
if [ -z "$REL_ID" ]; then
  echo "GAGAL: release tidak bisa dibuat/ditemukan; berhenti sebelum render."
  exit 1
fi
echo "Release siap, id: $REL_ID"

# --- Siapkan workspace film ---
cd "$ED" || exit 1
npm install --no-audit --no-fund || exit 1
npm install --no-save --no-audit --no-fund playwright@1.65.1 || exit 1
npx playwright install --with-deps chromium || npx playwright install chromium || exit 1

# --- Render penuh ---
echo "== Render mulai: $(date -u +%H:%M:%S) UTC =="
node kit/tools/render.mjs films/every-door --fps 30
PIC="$ED/films/every-door/out/picture.mp4"
if [ ! -s "$PIC" ]; then
  echo "GAGAL: picture.mp4 tidak terbuat."
  exit 1
fi
echo "== Render selesai: $(date -u +%H:%M:%S) UTC =="
ffprobe -v error -show_entries format=duration,size -show_entries stream=codec_name,width,height,r_frame_rate -of default=noprint_wrappers=1 "$PIC" | tee "$SUM/probe.txt"

# --- Bagi dan unggah sebagai aset release ---
cd "$(dirname "$PIC")" || exit 1
split -b 1800m -d -a 2 picture.mp4 pic-part-
sha256sum pic-part-* | tee "$SUM/sha256.txt"
ls -la pic-part-*
GAGAL=0
for P in pic-part-*; do
  echo "Mengunggah $P ..."
  RESP="$(curl -s -X POST -H "$AUTH" -H 'Accept: application/vnd.github+json' -H 'Content-Type: application/octet-stream' \
    --data-binary @"$P" "https://uploads.github.com/repos/Wongwangsul/kerja-berat/releases/$REL_ID/assets?name=$P")"
  echo "$RESP" | python3 -c 'import sys,json; d=json.load(sys.stdin); print("aset:", d.get("name"), d.get("size"), d.get("state"))' || GAGAL=1
done
if [ "$GAGAL" != "0" ]; then
  echo "GAGAL: ada aset yang tidak terunggah."
  exit 1
fi
echo "SELESAI: render + unggah beres. Tag rilis: $REL_TAG" | tee "$SUM/ringkasan.txt"
