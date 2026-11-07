#!/usr/bin/env python3
"""Render 'Doa Sebelum Makan' versi Studio Cerita (panel StoryBoardku + narasi asli).
720x1280, 30 fps, total 31.5 detik. Panel digerakkan zoompan bergantian,
teks klausa dibakar per jendela waktu peta klausa, teks Arab doa tampil
per potongan selama adegan doa. Dijalankan di folder ini (semua masukan
sudah didekode dari .b64 oleh skrip job).
"""
import subprocess, sys, os

FPS = 30
TOTAL = 31.5

SEGMENTS = [  # (berkas, mulai, selesai)
    ("p1.webp", 0.00, 4.74),
    ("p2.webp", 4.74, 9.70),
    ("p3.webp", 9.70, 12.28),
    ("p4.webp", 12.28, 20.88),
    ("p5.webp", 20.88, 27.60),
    ("p6.webp", 27.60, 31.50),
]

CAPTIONS = [  # (mulai, selesai, teks)
    (0.00, 2.20, "Assalamu'alaikum, teman-teman!"),
    (2.20, 4.74, "Hari ini aku mau makan."),
    (4.74, 6.52, "Tapi tunggu dulu!"),
    (6.52, 9.70, "Apa ya yang harus kita baca\nsebelum makan?"),
    (9.70, 12.28, "Yuk, kita berdoa bersama-sama!"),
    (12.28, 14.86, "Allahumma barik lana"),
    (14.86, 16.94, "fima razaqtana"),
    (16.94, 20.88, "waqina 'adzabannar"),
    (20.88, 22.78, "Bismillahirrahmanirrahim"),
    (22.78, 24.82, "Hmm, yummy!"),
    (24.82, 27.60, "Alhamdulillah, makanannya enak."),
    (27.60, 29.22, "Jangan lupa baca doa ya,\nteman-teman."),
    (29.22, 31.50, "Dadah!"),
]

ARABIC = [  # (mulai, selesai, teks Arab per potongan doa)
    (12.28, 14.86, "اللَّهُمَّ بَارِكْ لَنَا"),
    (14.86, 16.94, "فِيمَا رَزَقْتَنَا"),
    (16.94, 20.88, "وَقِنَا عَذَابَ النَّارِ"),
]

def run(cmd):
    print("+", " ".join(cmd[:3]), "...", flush=True)
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print(r.stdout[-2000:]); print(r.stderr[-4000:]); sys.exit(1)

# 1) Render tiap segmen panel dengan zoompan + fade
seg_files = []
for i, (img, start, end) in enumerate(SEGMENTS):
    dur = end - start
    frames = max(1, round(dur * FPS))
    if i % 2 == 0:
        zexpr = f"1+0.09*on/{frames}"
    else:
        zexpr = f"1.09-0.09*on/{frames}"
    vf = (
        f"scale=1440:2560:flags=lanczos,"
        f"zoompan=z='{zexpr}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'"
        f":d={frames}:s=720x1280:fps={FPS},"
        f"fade=t=in:st=0:d=0.35,fade=t=out:st={dur-0.35:.2f}:d=0.35,"
        f"format=yuv420p"
    )
    out = f"seg{i+1}.mp4"
    run(["ffmpeg", "-y", "-v", "error", "-loop", "1", "-framerate", str(FPS),
         "-i", img, "-vf", vf, "-frames:v", str(frames),
         "-c:v", "libx264", "-crf", "18", "-preset", "medium", out])
    seg_files.append(out)

# 2) Gabung segmen
with open("concat.txt", "w") as f:
    for s in seg_files:
        f.write(f"file '{s}'\n")
run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0",
     "-i", "concat.txt", "-c", "copy", "base.mp4"])

# 3) Berkas teks untuk drawtext (menghindari masalah escaping)
filters = []
for i, (s, e, txt) in enumerate(CAPTIONS):
    fn = f"cap{i}.txt"
    with open(fn, "w", encoding="utf-8") as f:
        f.write(txt)
    filters.append(
        f"drawtext=fontfile=DejaVuSans-Bold.ttf:textfile={fn}"
        f":fontsize=30:fontcolor=white:box=1:boxcolor=black@0.55"
        f":boxborderw=10:x=(w-text_w)/2:y=h-text_h-64"
        f":enable='between(t,{s:.2f},{e:.2f})'"
    )
for i, (s, e, txt) in enumerate(ARABIC):
    fn = f"arab{i}.txt"
    with open(fn, "w", encoding="utf-8") as f:
        f.write(txt)
    filters.append(
        f"drawtext=fontfile=NotoNaskhArabic-Bold.ttf:textfile={fn}"
        f":fontsize=64:fontcolor=0xFFD97A:box=1:boxcolor=black@0.45"
        f":boxborderw=16:x=(w-text_w)/2:y=96"
        f":enable='between(t,{s:.2f},{e:.2f})'"
    )

fc = "[0:v]" + ",".join(filters) + "[v];[1:a]apad=whole_dur=31.5[a]"
run(["ffmpeg", "-y", "-v", "error", "-i", "base.mp4", "-i", "narasi.mp3",
     "-filter_complex", fc, "-map", "[v]", "-map", "[a]",
     "-c:v", "libx264", "-crf", "20", "-preset", "medium",
     "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k",
     "-t", "31.5", "-movflags", "+faststart",
     "doa-sebelum-makan-studio.mp4"])
print("RENDER SELESAI")
