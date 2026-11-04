#!/usr/bin/env bash
# Jajal serbaguna kedua: ulangi uji CPU dengan konteks fork (perbaikan jajal-001).
set -e
echo "=== Jajal kerja berat serbaguna (2) ==="
python3 - <<'PY'
import time, hashlib, os, multiprocessing as mp

print("Mengalokasikan 10 GB RAM (melebihi total RAM mesin Muse)...")
b = bytearray(10 * 1024**3)
for i in range(0, len(b), 4096):
    b[i] = 1
print("10 GB berhasil dialokasikan dan disentuh penuh.")
del b

def bakar(n):
    x = b"kerja-berat" * 100
    t = time.time()
    c = 0
    while time.time() - t < 30:
        for _ in range(1000):
            x = hashlib.sha256(x).digest()
        c += 1000
    return c

if __name__ == "__main__":
    inti = os.cpu_count()
    print(f"Menghitung SHA-256 paralel di {inti} inti selama ~30 detik (konteks fork)...")
    ctx = mp.get_context("fork")
    t0 = time.time()
    with ctx.Pool(inti) as p:
        hasil = p.map(bakar, range(inti))
    dt = time.time() - t0
    total = sum(hasil)
    print(f"Total hash: {total:,} dalam {dt:.1f} detik = {total/dt:,.0f} hash/detik")
    with open("hasil-run/ringkasan-jajal.txt", "w") as f:
        f.write("JAJAL KERJA BERAT SERBAGUNA\n")
        f.write(f"Inti CPU: {inti}\n")
        f.write("RAM: alokasi 10 GB berhasil (melebihi total RAM mesin Muse 8 GB)\n")
        f.write(f"CPU: {total:,} hash SHA-256 dalam {dt:.1f} detik ({total/dt:,.0f}/detik)\n")
print("Jajal selesai.")
PY
echo
cat hasil-run/ringkasan-jajal.txt
