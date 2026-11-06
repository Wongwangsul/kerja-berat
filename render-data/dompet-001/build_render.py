import subprocess, os

BASE = os.path.dirname(os.path.abspath(__file__))
os.makedirs(f"{BASE}/srt", exist_ok=True)
os.makedirs(f"{BASE}/seg", exist_ok=True)

scenes = [
    (1, 5.85, "in",  "Menjelang magrib, Farhan berkeliling\nkampung Ketapang, menjajakan\ngorengan hangatnya."),
    (2, 6.50, "out", "Di jalan yang sepi, ia menemukan\ndompet kulit berisi banyak uang,\ndan sebuah KTP."),
    (3, 8.31, "in",  "Di rumah, ibunya terbaring sakit,\ndan obatnya telah habis. Uang itu\nbisa membantu... tetapi bukan miliknya."),
    (4, 5.57, "out", "Farhan memutuskan: dompet ini\nharus dikembalikan, sekarang juga."),
    (5, 8.87, "in",  "Ia berlari menuju alamat di KTP itu,\ndan terkejut. Pemilik dompet itu\nternyata guru ngajinya sendiri,\nUstadz Hasyim."),
    (6, 6.17, "out", "Sang Ustadz membawakan obat\nuntuk ibunya. Kejujuran Farhan,\npulang sebagai berkah."),
]

def ts(sec):
    h = int(sec // 3600); m = int((sec % 3600) // 60); s = sec % 60
    return f"{h:02d}:{m:02d}:{s:06.3f}".replace(".", ",")

style = ("FontName=DejaVu Sans,FontSize=16,PrimaryColour=&HFFFFFF,"
         "BorderStyle=3,BoxColour=&H99000000,OutlineColour=&H99000000,"
         "Alignment=2,MarginV=42")

for n, dur, direction, text in scenes:
    srt = f"{BASE}/srt/s{n}.srt"
    with open(srt, "w") as f:
        f.write(f"1\n00:00:00,200 --> {ts(dur-0.25)}\n{text}\n")
    frames = int(dur * 30)
    zexpr = "zoom+0.0011" if direction == "in" else "if(eq(on,0),1.095,zoom-0.0011)"
    vf = (
        f"scale=1440:2560,"
        f"zoompan=z='{zexpr}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'"
        f":d={frames}:s=720x1280:fps=30,"
        f"subtitles='{srt}':force_style='{style}',"
        f"fade=t=in:st=0:d=0.35,fade=t=out:st={dur-0.35:.2f}:d=0.35,format=yuv420p"
    )
    af = f"apad,atrim=0:{dur:.2f},afade=t=out:st={dur-0.3:.2f}:d=0.3"
    out = f"{BASE}/seg/s{n}.mp4"
    cmd = ["ffmpeg", "-y", "-v", "error",
           "-loop", "1", "-i", f"{BASE}/panels/s{n}.webp",
           "-i", f"{BASE}/audio/s{n}.mp3",
           "-filter_complex", f"[0:v]{vf}[v];[1:a]{af}[a]",
           "-map", "[v]", "-map", "[a]",
           "-t", f"{dur:.2f}", "-r", "30",
           "-c:v", "libx264", "-preset", "medium", "-crf", "20",
           "-c:a", "aac", "-b:a", "128k", "-ar", "44100",
           out]
    r = subprocess.run(cmd, capture_output=True, text=True)
    print("SEG", n, "OK" if r.returncode == 0 else "FAIL", r.stderr[-300:] if r.returncode else "", flush=True)
    if r.returncode != 0:
        raise SystemExit(1)

with open(f"{BASE}/concat.txt", "w") as f:
    for n, *_ in scenes:
        f.write(f"file '{BASE}/seg/s{n}.mp4'\n")

final = f"{BASE}/dompet-menjelang-magrib.mp4"
r = subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0",
                    "-i", f"{BASE}/concat.txt", "-c", "copy", final],
                   capture_output=True, text=True)
print("FINAL", "OK" if r.returncode == 0 else "FAIL", r.stderr[-300:] if r.returncode else "", flush=True)
if r.returncode != 0:
    raise SystemExit(1)

r = subprocess.run(["ffmpeg", "-y", "-v", "error", "-ss", "3", "-i", final,
                    "-frames:v", "1", "-q:v", "4", f"{BASE}/poster.jpg"],
                   capture_output=True, text=True)
print("POSTER", "OK" if r.returncode == 0 else "FAIL", flush=True)
print("SIZE", os.path.getsize(final), flush=True)
