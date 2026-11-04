#!/bin/bash
# Sapuan Turath untuk kajian hukum mewakafkan uang (fikih Syafi'i cat 16 + usul cat 11).
set -e
mkdir -p hasil-run
cd aset-turath
npm install --no-audit --no-fund --loglevel=error
node sweep.mjs ../hasil-run
ls -la ../hasil-run
