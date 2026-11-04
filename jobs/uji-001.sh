#!/usr/bin/env bash
# Pekerjaan uji pertama: buktikan spesifikasi runner dan jalur pengiriman hasil.
# Keluaran standar otomatis ditangkap ke hasil-run/log.txt oleh workflow.
set -e

echo "Halo dari runner GitHub Actions - uji pertama jalur kerja berat."
echo
echo "--- Uji RAM: mengalokasikan dan menyentuh 4 GB ---"
python3 - <<'PY'
ukuran = 4 * 1024 * 1024 * 1024
b = bytearray(ukuran)
langkah = 4096
for i in range(0, ukuran, langkah):
    b[i] = 1
print("Berhasil mengalokasikan dan menyentuh 4 GB RAM penuh.")
PY
echo
echo "--- Memori saat ini ---"
free -h
echo
echo "Menulis berkas bukti ke hasil-run/ ..."
echo "Uji pertama berhasil dijalankan di runner GitHub Actions." > hasil-run/bukti-uji.txt
date -u +"Waktu UTC di runner: %Y-%m-%d %H:%M:%S" >> hasil-run/bukti-uji.txt
echo "Selesai."
