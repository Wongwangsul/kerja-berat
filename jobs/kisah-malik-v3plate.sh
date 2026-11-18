#!/usr/bin/env bash
# Kerja Berat job: render 3-pass Blender scene (plate/glow/fg) for the
# Imam Malik 10-second opener. Outputs land in hasil-run/.
set -euxo pipefail
mkdir -p hasil-run
DIR="$(cd "$(dirname "$0")" && pwd)"
export HASIL_DIR="$(pwd)/hasil-run"
BL=""
for v in 5.3.0 5.2.0 5.1.0; do
  ver_dir="Blender${v%.*}"
  if curl -fL --retry 2 -o /tmp/blender.tar.xz "https://download.blender.org/release/${ver_dir}/blender-${v}-linux-x64.tar.xz"; then
    mkdir -p /tmp/blender && tar -xf /tmp/blender.tar.xz -C /tmp/blender --strip-components=1
    BL=/tmp/blender/blender
    break
  fi
done
[ -n "$BL" ] || { echo "BLENDER DOWNLOAD FAILED"; exit 1; }
"$BL" --version
export KM_SAMPLES=256
"$BL" -b --python "$DIR/kisah-malik-v3plate.py"
ls -la hasil-run
