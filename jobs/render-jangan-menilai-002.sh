#!/bin/bash
set -e
ROOT=$PWD
mkdir -p "$ROOT/hasil-run"
cd proyek/jangan-menilai
npm ci --no-audit --no-fund
node render.mjs "$ROOT/hasil-run/video-tanpa-suara.mp4"
ls -la "$ROOT/hasil-run/"
