// Sapuan Turath: hukum mewakafkan uang — kueri x kategori (16 fikih Syafi'i, 11 usul fikih).
// Satu sesi MCP, banyak panggilan search_turath. Keluaran: digest.json + ringkasan.txt di argv[2].
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { writeFileSync, mkdirSync } from "node:fs";

const OUT = process.argv[2] || ".";
mkdirSync(OUT, { recursive: true });

const QUERIES = [
  "وقف الدراهم والدنانير",
  "وقف الدراهم",
  "وقف النقود",
  "وقف الأثمان",
  "وقف المنقول",
  "لا يصح وقف الدراهم",
  "وقف المثليات",
  "الدراهم الموقوفة",
];
const CATS = [16, 11];
const PAGES = [1, 2];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const transport = new StreamableHTTPClientTransport(new URL("https://mcp.turath.io/mcp"), {
  requestInit: { headers: {} },
});
const client = new Client({ name: "muse-sweep-turath", version: "1" }, { capabilities: {} });
await client.connect(transport, { timeout: 60000 });

const seen = new Map();
const counts = [];
try {
  for (const q of QUERIES) {
    for (const cat of CATS) {
      for (const page of PAGES) {
        try {
          const res = await client.callTool(
            { name: "search_turath", arguments: { q, cat_id: [cat], page } },
            undefined,
            { timeout: 60000 }
          );
          const inner = JSON.parse(res.content[0].text);
          if (page === 1) counts.push({ q, cat, count: inner.count ?? null });
          for (const h of inner.results || []) {
            const key = `${h.book_id}:${h.meta?.page_id}`;
            if (seen.has(key)) continue;
            seen.set(key, {
              q,
              cat: h.cat_id,
              book_id: h.book_id,
              book: h.meta?.book_name || "",
              author: h.meta?.author_name || "",
              vol: h.meta?.vol || "",
              page: h.meta?.page ?? null,
              page_id: h.meta?.page_id ?? null,
              headings: h.meta?.headings || [],
              link: h.link || "",
              excerpt: (h.text || "").slice(0, 280),
            });
          }
          console.log(`ok q="${q}" cat=${cat} page=${page} total=${inner.count}`);
        } catch (e) {
          console.log(`ERR q="${q}" cat=${cat} page=${page}: ${e.message || e}`);
        }
        await sleep(800);
      }
    }
  }
} finally {
  await client.close().catch(() => {});
}

const hits = [...seen.values()];
const books = new Map();
for (const h of hits) books.set(h.book_id, `${h.book} — ${h.author}`);
writeFileSync(`${OUT}/digest.json`, JSON.stringify({ generated: new Date().toISOString(), counts, hits }, null, 1));
const lines = [
  `Total hit unik (book_id:page_id): ${hits.length}`,
  `Kitab berbeda: ${books.size}`,
  "",
  "Jumlah hasil per kueri/kategori (halaman 1):",
  ...counts.map((c) => `- "${c.q}" cat=${c.cat}: ${c.count}`),
  "",
  "Daftar kitab yang kena:",
  ...[...books.entries()].map(([id, s]) => `- [${id}] ${s}`),
];
writeFileSync(`${OUT}/ringkasan.txt`, lines.join("\n"));
console.log(lines.slice(0, 3).join("\n"));
