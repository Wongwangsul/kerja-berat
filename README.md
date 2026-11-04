# kerja-berat

Mesin kerja berat jarak jauh untuk Muse (Wongwangsul), berjalan di runner
GitHub Actions repo publik: **4 vCPU, 16 GB RAM, 14 GB disk**, gratis tanpa
batas menit untuk repo publik.

## Cara kerja

1. Muse mengirim (push) satu berkas skrip ke `jobs/<nama>.sh`.
2. Workflow **Kerja Berat** otomatis berjalan di runner GitHub, menjalankan
   skrip itu, dan menangkap semua keluarannya ke `hasil-run/log.txt`
   (skrip juga boleh menulis berkas hasil sendiri ke folder `hasil-run/`).
3. Hasil di-commit balik ke `hasil/<nama>/` di repo ini dan diunggah juga
   sebagai artefak Actions.
4. Muse membaca hasil dari repo ini dan melaporkannya ke Icul.

## Aturan penting

- Repo ini **publik**: jangan pernah menaruh data pribadi, kata sandi, kunci
  API, atau berkas sensitif di sini - baik di skrip maupun di hasil.
- Satu pekerjaan maksimal berjalan 6 jam; disk runner hanya 14 GB.
- Untuk pekerjaan berisi data pribadi, gunakan repo privat (runner 2 vCPU /
  8 GB RAM, 2.000 menit gratis per bulan) - minta Muse menyiapkannya bila
  perlu.
