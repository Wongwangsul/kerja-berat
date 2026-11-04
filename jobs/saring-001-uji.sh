#!/usr/bin/env bash
# Saring-001 UJI: hanya 2 berkas pertama di data/csv, kata kunci: بريرة
set -e
cat > /tmp/saring.py <<'PYEOF'
import csv, glob, os, re, time

t0 = time.time()
KEYWORDS = ["بريرة"]
MARKS = re.compile("[ً-ٰٟۖ-ۭ]")

def norm(s):
    if not s:
        return ""
    s = MARKS.sub("", s)
    s = s.replace("ـ", "")
    s = s.replace("أ", "ا").replace("إ", "ا").replace("آ", "ا").replace("ٱ", "ا")
    s = s.replace("ى", "ي")
    s = s.replace("ة", "ه")
    return s

PRIORITY_NEEDLES = ["الهيتمي", "ابن حجر", "الرملي", "الشبراملسي",
                    "النووي", "زكريا", "سليمان الجمل", "البجيرمي"]

def is_priority(row):
    hay = norm((row.get("author_name") or "") + " " + (row.get("book_name") or ""))
    return any(n in hay for n in PRIORITY_NEEDLES)

files = sorted(glob.glob("data/csv/*.csv"))[:2]
os.makedirs("hasil-run", exist_ok=True)
errors = []
total_rows = 0
matched = []
per_book = {}

for path in files:
    try:
        with open(path, encoding="utf-8-sig", newline="") as f:
            r = csv.DictReader(f)
            fields = r.fieldnames
            for row in r:
                total_rows += 1
                ntext = norm(row.get("text"))
                hits = [k for k in KEYWORDS if norm(k) in ntext]
                if hits:
                    row["kata_kunci_cocok"] = ";".join(hits)
                    pr = is_priority(row)
                    row["prioritas"] = "ya" if pr else "tidak"
                    matched.append(row)
                    b = row.get("book_name") or ""
                    e = per_book.setdefault(b, [0, False])
                    e[0] += 1
                    e[1] = e[1] or pr
    except Exception as e:
        errors.append(f"{path}: {type(e).__name__}: {e}")

out_fields = list(fields) + ["kata_kunci_cocok", "prioritas"]
with open("hasil-run/hasil.csv", "w", encoding="utf-8-sig", newline="") as f:
    w = csv.DictWriter(f, fieldnames=out_fields)
    w.writeheader()
    for row in matched:
        w.writerow(row)

with open("hasil-run/ringkasan_per_kitab.csv", "w", encoding="utf-8-sig", newline="") as f:
    w = csv.writer(f)
    w.writerow(["book_name", "jumlah_baris_cocok", "prioritas"])
    for b, (n, pr) in sorted(per_book.items(), key=lambda kv: -kv[1][0]):
        w.writerow([b, n, "ya" if pr else "tidak"])

dur = time.time() - t0
with open("hasil-run/log.txt", "w", encoding="utf-8") as f:
    f.write("SARING-001 UJI (2 berkas pertama)\n")
    f.write(f"kata_kunci: {', '.join(KEYWORDS)}\n")
    f.write(f"berkas_diproses: {len(files)}\n")
    for p in files:
        f.write(f" - {p}\n")
    f.write(f"total_baris_diproses: {total_rows}\n")
    f.write(f"baris_cocok: {len(matched)}\n")
    f.write(f"baris_cocok_prioritas: {sum(1 for r in matched if r['prioritas'] == 'ya')}\n")
    f.write(f"durasi_detik: {dur:.1f}\n")
    f.write(f"error: {len(errors)}\n")
    for e in errors:
        f.write(f" - {e}\n")
print(f"Uji selesai: {len(matched)} baris cocok dari {total_rows} baris, {len(files)} berkas, {dur:.1f} detik, error {len(errors)}")

PYEOF
python3 /tmp/saring.py
