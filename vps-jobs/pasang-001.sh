#!/usr/bin/env bash
# pasang-001.sh — Pasang Bang Story + flow2api di VPS instabox, satu jalan.
# Dijalankan Icul dari Terminal VPS di dalam clone repo kerja-berat:
#   bash vps-jobs/pasang-001.sh
# Semua keluaran dicatat ke vps-hasil/pasang-001/laporan.txt (di clone LOKAL
# VPS — tidak pernah di-push; laporan memuat api_key lokal flow2api).
# Aman dijalankan ulang: tahap yang sudah beres dilewati/ditimpa aman.
set -u
REPO="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$REPO/vps-hasil/pasang-001"
APPS="$HOME/apps"
mkdir -p "$OUT" "$APPS"
exec > >(tee -a "$OUT/laporan.txt") 2>&1
echo "=== pasang-001 mulai: $(date) ==="
echo "mesin: $(hostname) | user: $(whoami) | home: $HOME"
step() { echo; echo "--- $* ---"; }

step "TAHAP 0: uji render mesin pekerja"
if [ -f "$REPO/vps-hasil/uji-vps-001/uji.mp4" ]; then
  echo "uji.mp4 sudah ada — dilewati."
else
  bash "$REPO/vps-jobs/uji-vps-001.sh" || echo "TAHAP 0 GAGAL (tetap lanjut)"
fi

step "TAHAP A: prasyarat sistem"
sudo apt-get update -qq
sudo apt-get install -y -qq git python3 python3-venv build-essential curl \
  || echo "TAHAP A: apt GAGAL"
which ffmpeg; node -v; python3 --version

step "TAHAP B: clone Bang Story + flow2api"
cd "$APPS"
[ -d bang-story ] || git clone --depth 1 https://github.com/bangtutorial/bang-story bang-story \
  || echo "TAHAP B: clone bang-story GAGAL"
[ -d flow2api ] || git clone --depth 1 https://github.com/TheSmallHanCat/flow2api flow2api \
  || echo "TAHAP B: clone flow2api GAGAL"
ls -d "$APPS/bang-story" "$APPS/flow2api" 2>&1

step "TAHAP C: salin berkas integrasi Flow2API ke Bang Story"
cp -r "$REPO/vps-files/bang-story-flow/src/." "$APPS/bang-story/src/" \
  && echo "tersalin." || echo "TAHAP C GAGAL"
ls "$APPS/bang-story/src/main/services/flow2api.ts" \
   "$APPS/bang-story/src/shared/flow2api.ts" 2>&1

step "TAHAP D: flow2api — venv, dependensi, konfigurasi, server"
cd "$APPS/flow2api" || echo "TAHAP D: folder flow2api tidak ada"
[ -d .venv ] || python3 -m venv .venv
.venv/bin/pip install -q -r requirements.txt > "$OUT/pip.log" 2>&1 \
  && echo "pip: OK" || { echo "TAHAP D: pip GAGAL — 5 baris terakhir pip.log:"; tail -5 "$OUT/pip.log"; }
if [ ! -f config/setting.toml ]; then
  cp config/setting_example.toml config/setting.toml
  NEWKEY="f2a-$(head -c 12 /dev/urandom | od -An -tx1 | tr -d ' \n')"
  sed -i "s/^api_key = .*/api_key = \"$NEWKEY\"/" config/setting.toml
  echo "api_key lokal BARU dibuat (bukan bawaan contoh)."
fi
KEY="$(sed -n 's/^api_key = "\(.*\)"/\1/p' config/setting.toml | head -1)"
pkill -f "python main.py" 2>/dev/null
nohup .venv/bin/python main.py > "$OUT/flow2api-server.log" 2>&1 &
CODE=""
for i in $(seq 1 30); do
  CODE="$(curl -s -o /dev/null -w '%{http_code}' http://localhost:8000/v1/models -H "Authorization: Bearer $KEY" || true)"
  [ "$CODE" = "200" ] && break
  sleep 2
done
if [ "$CODE" = "200" ]; then
  echo "flow2api HIDUP: GET /v1/models -> 200"
else
  echo "flow2api belum menjawab (HTTP terakhir: ${CODE:-kosong}) — 5 baris log server:"
  tail -5 "$OUT/flow2api-server.log" 2>&1
fi

step "TAHAP E: Bang Story — npm install"
cd "$APPS/bang-story" || echo "TAHAP E: folder bang-story tidak ada"
npm install --no-audit --no-fund > "$OUT/npm-install.log" 2>&1 \
  && echo "npm install: OK" || { echo "TAHAP E: npm install GAGAL — 8 baris terakhir npm-install.log:"; tail -8 "$OUT/npm-install.log"; }

step "TAHAP E2: Bang Story — typecheck + build"
npm run typecheck > "$OUT/typecheck.log" 2>&1 \
  && echo "typecheck: OK" || { echo "typecheck GAGAL — 15 baris terakhir typecheck.log:"; tail -15 "$OUT/typecheck.log"; }
npm run build > "$OUT/build.log" 2>&1 \
  && echo "build: OK" || { echo "build GAGAL — 15 baris terakhir build.log:"; tail -15 "$OUT/build.log"; }

step "RINGKASAN"
echo "flow2api : http://localhost:8000"
echo "api_key  : $KEY"
echo "folder   : $APPS/bang-story dan $APPS/flow2api"
echo "jalankan Bang Story nanti dengan: cd ~/apps/bang-story lalu npm run dev"
echo "=== pasang-001 selesai: $(date) ==="
sleep 2
