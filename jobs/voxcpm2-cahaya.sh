#!/usr/bin/env bash
# Kerja berat: sintesis sampel suara "Cahaya" dengan VoxCPM2 (CPU) — kloning dari ref-cahaya.wav
set -x
ROOT="${GITHUB_WORKSPACE:-$(pwd)}"
if [ -f "$ROOT/jobs/ref-cahaya.wav.b64" ]; then base64 -d "$ROOT/jobs/ref-cahaya.wav.b64" > /tmp/ref-cahaya.wav; fi
REF="/tmp/ref-cahaya.wav"
OUT="$PWD/hasil-run"
mkdir -p "$OUT"
nproc; free -m | head -2; df -h . | tail -1
ls -la "$REF"

PY=""
for c in /opt/hostedtoolcache/Python/3.12.*/x64/bin/python3 /opt/hostedtoolcache/Python/3.11.*/x64/bin/python3 "$(command -v python3.12)" "$(command -v python3.11)" "$(command -v python3.13)" "$(command -v python3)"; do
  if [ -n "$c" ] && [ -x "$c" ]; then PY="$c"; break; fi
done
echo "PY=$PY"; "$PY" --version

"$PY" -m venv "$PWD/.venv-vox"
source "$PWD/.venv-vox/bin/activate"
pip install -q --upgrade pip
pip install -q torch torchaudio --index-url https://download.pytorch.org/whl/cpu
pip install -q "voxcpm>=2.0.3" soundfile
python -c "import torchaudio" 2>/dev/null || pip install -q --force-reinstall --no-deps "torchaudio==$(python -c 'import torch; print(torch.__version__.split(chr(43))[0])')" --index-url https://download.pytorch.org/whl/cpu
python -c "import torch, voxcpm; print('torch', torch.__version__, '| voxcpm OK')"

cat > gen.py << 'PYEOF'
import os, resource
import numpy as np
import soundfile as sf
from voxcpm import VoxCPM

REF_WAV = os.environ["REF_WAV"]
OUT_DIR = os.environ["OUT_DIR"]
REF_TEXT = "Lo sadar ga sih kalo teknologi itu udah ngerubah cara kita hidup, ngobrol, kerja, bahkan mikir?"
TEXT = "Di malam yang tenang, kunang-kunang beterbangan di atas sawah. Cahayanya berkelap-kelip seperti bintang kecil yang turun ke bumi."

print("loading VoxCPM2...", flush=True)
model = VoxCPM.from_pretrained("openbmb/VoxCPM2", load_denoiser=False, optimize=False, device="cpu")
print("loaded. peak RSS GB:", resource.getrusage(resource.RUSAGE_SELF).ru_maxrss / 1e6, flush=True)
rate = getattr(model, "sampling_rate", None) or getattr(model, "sample_rate", None) or 48000
print("sample rate:", rate, flush=True)
wav = model.generate(TEXT, prompt_text=REF_TEXT, prompt_wav_path=REF_WAV)
arr = wav.detach().cpu().numpy() if hasattr(wav, "detach") else np.asarray(wav)
arr = np.squeeze(arr).astype(np.float32)
print("samples:", arr.shape, "duration_s:", len(arr) / int(rate), flush=True)
out_wav = os.path.join(OUT_DIR, "sampel-cahaya-voxcpm2.wav")
sf.write(out_wav, arr, int(rate))
print("SAVED", out_wav, "peak RSS GB:", resource.getrusage(resource.RUSAGE_SELF).ru_maxrss / 1e6, flush=True)
PYEOF

REF_WAV="$REF" OUT_DIR="$OUT" TOKENIZERS_PARALLELISM=false python gen.py
ffmpeg -y -i "$OUT/sampel-cahaya-voxcpm2.wav" -codec:a libmp3lame -q:a 3 "$OUT/sampel-cahaya-voxcpm2.mp3" || true
ls -la "$OUT"
