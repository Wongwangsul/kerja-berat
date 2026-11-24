#!/bin/bash
set -x
cat hasil/bima3d-tangga2/chunk-00 hasil/bima3d-tangga2/chunk-01 > /tmp/video.mp4
sha256sum /tmp/video.mp4
sudo apt-get update -qq && sudo apt-get install -y -qq ffmpeg > /dev/null 2>&1
python3 -m pip install -q numpy pillow 2>&1 | tail -1
python3 bima3d/qa/short_qa.py /tmp/video.mp4 hasil-run bima3d/qa/shots.json
ls -la hasil-run/
echo QA_JOB_DONE
