# kerja-berat

Runner GitHub Actions untuk **pekerjaan yang berkaitan dengan proyek
perangkat lunak kami** - membangun (build), menguji, mengemas, dan
menerbitkan hasil proyek (mis. aplikasi Ustadzah AI dan perkakas kajian).
Runner repo publik: **4 vCPU, 16 GB RAM, disk lega (88 GB bebas teramati
pada uji pertama 2026-11-04)**, gratis tanpa batas menit untuk repo publik.

## Batas pemakaian (sesuai Ketentuan GitHub untuk Actions)

GitHub melarang Actions dipakai untuk cryptomining, komputasi serverless
serbaguna, membebani server secara tidak proporsional, dan - untuk runner
bawaan GitHub - aktivitas yang tidak berkaitan dengan produksi, pengujian,
deployment, atau publikasi proyek perangkat lunak pada repo tempat Actions
dijalankan. Pelanggaran dapat berakibat pekerjaan dihentikan, Actions
dibatasi, atau repo dinonaktifkan. Karena itu repo ini:

- HANYA menjalankan pekerjaan yang merupakan bagian dari produksi,
  pengujian, pengemasan, atau publikasi proyek perangkat lunak kami.
- Bukan mesin hitung serbaguna dan tidak menjalankan layanan/proses
  terus-menerus.
- Diperlakukan sebagai repo sekali pakai: tidak ada apa pun yang berharga
  di sini, jadi bila GitHub membatasinya, tidak ada kerugian berarti.

## Cara kerja

1. Muse mengirim (push) satu berkas skrip ke `jobs/<nama>.sh`.
2. Workflow **Kerja Berat** otomatis berjalan di runner GitHub, menjalankan
   skrip itu, dan menangkap semua keluarannya ke `hasil-run/log.txt`
   (skrip juga boleh menulis berkas hasil sendiri ke folder `hasil-run/`).
3. Hasil KECIL (log dan berkas ringkas) di-commit balik ke `hasil/<nama>/`
   di repo ini; hasil besar cukup lewat artefak Actions atau Releases,
   jangan di-commit agar repo tidak membengkak.
4. Muse membaca hasil dari repo ini dan melaporkannya ke Icul.

## Aturan penting

- Repo ini **publik**: jangan pernah menaruh data pribadi, kata sandi, kunci
  API, atau berkas sensitif di sini - baik di skrip maupun di hasil. Semua
  log dan hasil terlihat siapa saja.
- Satu pekerjaan maksimal berjalan 6 jam.
- Untuk pekerjaan berisi data pribadi, gunakan repo privat (runner 2 vCPU /
  8 GB RAM, 2.000 menit gratis per bulan) - minta Muse menyiapkannya bila
  perlu.
