// ============================================================
// script.ts — Satu-satunya sumber kebenaran untuk narasi & waktu.
// Teks & waktu klausa PERSIS dari narasi/batas-klausa.json.
// Durasi adegan DITURUNKAN dari data ini (lihat SCENES di bawah) —
// tidak ada durasi adegan yang di-hardcode di komponen mana pun.
// ============================================================

export const FPS = 30;

export type Clause = {
  id: string;
  start: number; // detik
  end: number; // detik
  text: string;
  arab?: string; // potongan teks Arab doa (khusus klausa doa-*)
};

export const SCRIPT: Clause[] = [
  // ------------------------------------------------ SAPA (0:00–0:04,74)
  {id: 'sapa-1', start: 0, end: 2.2, text: "Assalamu'alaikum, teman-teman!"},
  {id: 'sapa-2', start: 2.2, end: 4.74, text: 'Hari ini aku mau makan.'},

  // ------------------------------------------------ TANYA (0:04,74–0:09,70)
  {id: 'tanya-1', start: 4.74, end: 6.52, text: 'Tapi tunggu dulu!'},
  {id: 'tanya-2', start: 6.52, end: 9.7, text: 'Apa ya yang harus kita baca sebelum makan?'},

  // ------------------------------------------------ BERDOA (0:09,70–0:20,88)
  {id: 'berdoa-1', start: 9.7, end: 12.28, text: 'Yuk, kita berdoa bersama-sama!'},
  {id: 'doa-1', start: 12.28, end: 14.86, text: 'Allahumma barik lana', arab: 'اللَّهُمَّ بَارِكْ لَنَا'},
  {id: 'doa-2', start: 14.86, end: 16.94, text: 'fima razaqtana', arab: 'فِيمَا رَزَقْتَنَا'},
  {id: 'doa-3', start: 16.94, end: 20.88, text: "waqina 'adzabannar", arab: 'وَقِنَا عَذَابَ النَّارِ'},

  // ------------------------------------------------ MAKAN (0:20,88–0:27,60)
  {id: 'makan-1', start: 20.88, end: 22.78, text: 'Bismillahirrahmanirrahim'},
  {id: 'makan-2', start: 22.78, end: 24.82, text: 'Hmm, yummy!'},
  {id: 'makan-3', start: 24.82, end: 27.6, text: 'Alhamdulillah, makanannya enak.'},

  // ------------------------------------------------ TUTUP (0:27,60–0:31,50)
  {id: 'tutup-1', start: 27.6, end: 29.22, text: 'Jangan lupa baca doa ya, teman-teman.'},
  {id: 'tutup-2', start: 29.22, end: 31.5, text: 'Dadah!'},
];

// ------------------------------------------------------------
// Adegan: start/end DIHITUNG dari klausa pertama & terakhirnya.
// ------------------------------------------------------------
export type Scene = {
  id: string;
  title: string;
  clauseIds: string[];
  start: number;
  end: number;
  clauses: Clause[];
};

const SCENE_DEFS: {id: string; title: string; clauseIds: string[]}[] = [
  {id: 'sapa', title: 'Sapa', clauseIds: ['sapa-1', 'sapa-2']},
  {id: 'tanya', title: 'Tanya', clauseIds: ['tanya-1', 'tanya-2']},
  {id: 'berdoa', title: 'Berdoa', clauseIds: ['berdoa-1', 'doa-1', 'doa-2', 'doa-3']},
  {id: 'makan', title: 'Makan', clauseIds: ['makan-1', 'makan-2', 'makan-3']},
  {id: 'tutup', title: 'Tutup', clauseIds: ['tutup-1', 'tutup-2']},
];

const byId = new Map(SCRIPT.map((c) => [c.id, c]));

export const SCENES: Scene[] = SCENE_DEFS.map((def) => {
  const clauses = def.clauseIds.map((id) => {
    const c = byId.get(id);
    if (!c) throw new Error(`Klausa tidak ditemukan: ${id}`);
    return c;
  });
  return {
    id: def.id,
    title: def.title,
    clauseIds: def.clauseIds,
    clauses,
    start: clauses[0].start,
    end: clauses[clauses.length - 1].end,
  };
});

/** Total durasi video (detik), diturunkan dari klausa terakhir. */
export const TOTAL_SECONDS = Math.max(...SCRIPT.map((c) => c.end));

/** Klausa yang aktif pada detik t (untuk subtitle). */
export const clauseAt = (t: number): Clause | undefined =>
  SCRIPT.find((c) => t >= c.start && t < c.end) ??
  (t >= TOTAL_SECONDS ? SCRIPT[SCRIPT.length - 1] : undefined);
