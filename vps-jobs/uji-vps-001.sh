#!/usr/bin/env bash
# Uji pekerja VPS instabox #001: render video uji 5 detik + laporan tertulis.
# Dijalankan manual oleh Icul dari Terminal dashboard VPS (bukan GitHub Actions).
set -x
cd "$(dirname "$0")/.." || exit 1
mkdir -p vps-hasil/uji-vps-001
L=vps-hasil/uji-vps-001/info.txt
{
  echo "mesin: $(hostname)"
  echo "sistem: $(grep PRETTY /etc/os-release)"
  echo "ffmpeg: $(ffmpeg -version 2>/dev/null | head -1)"
  echo "node: $(node -v 2>/dev/null)"
  echo "python: $(python3 -V 2>&1)"
  echo "waktu: $(date -Is)"
} > "$L"
ffmpeg -y -f lavfi -i testsrc=duration=5:size=1280x720:rate=30 -f lavfi -i sine=frequency=440:duration=5 -c:v libx264 -pix_fmt yuv420p -c:a aac -shortest vps-hasil/uji-vps-001/uji.mp4 2> vps-hasil/uji-vps-001/render.log
echo "render-exit: $?" >> "$L"
ls -la vps-hasil/uji-vps-001/ >> "$L"
ffprobe -v error -show_entries format=duration,size -of default=noprint_wrappers=1 vps-hasil/uji-vps-001/uji.mp4 >> "$L" 2>&1
cat "$L"
