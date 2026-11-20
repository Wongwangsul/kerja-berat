set -ex
cd payload/tacoma
node --version; npm --version
# Aset Kenney CC0 (26 GLB) dikirim sebagai tar base64 karena push_files hanya menerima teks UTF-8
base64 -d kenney.tar.b64 | tar -x
ls public/bridge/kenney | wc -l
npm ci --no-audit --no-fund 2>&1 | tail -2
npx remotion browser ensure 2>&1 | tail -2
node render-range.mjs 0 1034 1 3 TacomaShort partA.mp4
ls -la partA.mp4
mkdir -p ../../hasil-run
split -b 40M partA.mp4 ../../hasil-run/partA.mp4.
ls -la ../../hasil-run/
