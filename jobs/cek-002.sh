#!/bin/bash
mkdir -p hasil-run
{
echo "tanggal: $(date -Is)"
echo "kernel: $(uname -r)"
echo "cpu_inti: $(nproc)"
free -h
df -h . | tail -1
grep -E "MemTotal|MemAvailable" /proc/meminfo
} > hasil-run/kondisi.txt
cat hasil-run/kondisi.txt
