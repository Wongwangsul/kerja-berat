#!/usr/bin/env bash
# Ekstraksi frame klip Flow -> sekuens JPG 1080x1920 @60fps per segmen.
# Pemetaan segmen (detik sumber -> target): lihat CATATAN-TRIM di proyek.
set -u
cd "$(dirname "$0")"
ekstrak() { # nama klip ss_in faktor_setpts jumlah_frame
  local seg="$1" clip="$2" ss="$3" faktor="$4" n="$5"
  mkdir -p "frames/$seg"
  ffmpeg -y -v error -i "clips/$clip" -ss "$ss" \
    -vf "setpts=${faktor}*PTS,fps=60,scale=1080:1920:flags=lanczos" \
    -frames:v "$n" -q:v 3 -start_number 0 "frames/$seg/f%05d.jpg"
  echo "$seg: $(ls frames/$seg | wc -l) frame"
}
ekstrak sapa  sapa.mp4  0.12 1         285
ekstrak tanya tanya.mp4 0.90 1         298
ekstrak doa1  doa1.mp4  0.00 1.106383  312
ekstrak doa2  doa2.mp4  0.50 1         360
ekstrak makan makan.mp4 0.17 1         402
ekstrak tutup tutup.mp4 0.75 1         236
echo EKSTRAKSI-SELESAI
