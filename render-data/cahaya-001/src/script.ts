// ============================================================
// script.ts — Satu-satunya sumber kebenaran untuk narasi & waktu.
// Seluruh teks klausa PERSIS seperti skrip Icul. Durasi adegan
// DITURUNKAN dari data ini (lihat SCENES di bawah) — tidak ada
// durasi adegan yang di-hardcode di komponen mana pun.
// ============================================================

export const FPS = 30;

export type Clause = {
  id: string;
  start: number; // detik
  end: number; // detik
  text: string;
};

export const SCRIPT: Clause[] = [
  // ------------------------------------------------ HOOK (0:00–0:18)
  {id: 'hook-1', start: 0, end: 2.72, text: 'Bayangin kamu lagi berjemur pagi-pagi.'},
  {id: 'hook-2', start: 2.72, end: 4.06, text: 'Hangatnya langsung terasa, kan?'},
  {id: 'hook-3', start: 4.06, end: 7.92, text: 'Padahal cahaya itu berangkat 8 menit yang lalu.'},
  {id: 'hook-4', start: 7.92, end: 10.18, text: 'Coba kalau Matahari tiba-tiba lenyap.'},
  {id: 'hook-5', start: 10.18, end: 13.86, text: 'Kita masih terang-benderang... selama 8 menit.'},
  {id: 'hook-6', start: 13.86, end: 17.88, text: 'Tapi, benarkah perjalanan cahaya cuma 8 menit?'},

  // ------------------------------------------------ SEBERAPA CEPAT (0:18–0:33)
  {id: 'cepat-1', start: 17.88, end: 21.7, text: 'Cahaya itu cepat banget. 300 ribu kilometer per detik.'},
  {id: 'cepat-2', start: 21.7, end: 25.34, text: 'Dalam satu detik, dia muter Bumi 7 setengah kali.'},
  {id: 'cepat-3', start: 25.34, end: 28.28, text: 'Jakarta ke Surabaya? Kurang dari tiga milidetik.'},
  {id: 'cepat-4', start: 28.28, end: 31.56, text: 'Ke Bulan? Sekitar 1,3 detik.'},
  {id: 'cepat-5', start: 31.56, end: 33.28, text: 'Dan itu baru Bulan.'},

  // ------------------------------------------------ JARAK KE MATAHARI (0:33–1:05)
  {id: 'jarak-1', start: 33.28, end: 38.18, text: 'Sekarang ke Matahari. Jaraknya sekitar 150 juta kilometer.'},
  {id: 'jarak-2', start: 38.18, end: 42.36, text: 'Itu kira-kira 390 kali jarak Bumi ke Bulan.'},
  {id: 'jarak-3', start: 42.36, end: 46.4, text: 'Atau sekitar 11.800 Bumi berjejer.'},
  {id: 'jarak-4', start: 46.4, end: 50.98, text: 'Naik pesawat 900 km/jam? 19 tahun nonstop.'},
  {id: 'jarak-5', start: 50.98, end: 55.64, text: 'Naik mobil 100 km/jam? Lebih dari 170 tahun.'},
  {id: 'jarak-6', start: 55.64, end: 57.34, text: 'Cahaya? 500 detik.'},
  {id: 'jarak-7', start: 57.34, end: 64.78, text: 'Orbit Bumi agak lonjong, jadi bisa 8 menit 10 sampai 8 menit 27 detik.'},

  // ------------------------------------------------ JEDA NAPAS (1:05–1:10)
  {id: 'jeda-1', start: 64.78, end: 66.1, text: 'Tarik napas dulu.'},
  {id: 'jeda-2', start: 66.1, end: 69.62, text: 'Soalnya 8 menit itu bukan awal ceritanya.'},

  // ------------------------------------------------ DI DALAM MATAHARI (1:10–1:36)
  {id: 'dalam-1', start: 69.62, end: 72.52, text: '8 menit itu cuma bagian terakhir.'},
  {id: 'dalam-2', start: 72.52, end: 75.2, text: 'Cahaya lahir di inti, hasil fusi.'},
  {id: 'dalam-3', start: 75.2, end: 81.12, text: 'Tapi di sini padat banget. Energi nabrak partikel, dipancarkan lagi, arahnya acak.'},
  {id: 'dalam-4', start: 81.12, end: 83.72, text: 'Kadang maju. Kadang malah mundur.'},
  {id: 'dalam-5', start: 83.72, end: 87.32, text: 'Namanya jalan acak. Kayak orang mabuk jalan pulang.'},
  {id: 'dalam-6', start: 87.32, end: 93.44, text: 'Menurut perkiraan NASA, sekitar 170 ribu tahun cuma buat sampai ke lapisan luar.'},
  {id: 'dalam-7', start: 93.44, end: 95.88, text: 'Dibanding itu, 8 menit tadi?'},

  // ------------------------------------------------ TUTUP REFLEKTIF (1:36–1:52)
  {id: 'tutup-1', start: 95.88, end: 98.06, text: 'Jadi hangat di kulitmu pagi ini...'},
  {id: 'tutup-2', start: 98.06, end: 103.38, text: 'energinya mulai berjalan jauh sebelum ada pertanian, jauh sebelum ada tulisan.'},
  {id: 'tutup-3', start: 103.38, end: 106.26, text: 'Dan kamu ada di ujung perjalanan itu.'},
  {id: 'tutup-4', start: 106.26, end: 112, text: 'Besok pagi pas berjemur, ingat ya: kamu lagi nerima kiriman dari masa lalu.'},
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
  {id: 'hook', title: 'Hook', clauseIds: ['hook-1', 'hook-2', 'hook-3', 'hook-4', 'hook-5', 'hook-6']},
  {id: 'cepat', title: 'Seberapa Cepat', clauseIds: ['cepat-1', 'cepat-2', 'cepat-3', 'cepat-4', 'cepat-5']},
  {id: 'jarak', title: 'Jarak ke Matahari', clauseIds: ['jarak-1', 'jarak-2', 'jarak-3', 'jarak-4', 'jarak-5', 'jarak-6', 'jarak-7']},
  {id: 'jeda', title: 'Jeda Napas', clauseIds: ['jeda-1', 'jeda-2']},
  {id: 'dalam', title: 'Di Dalam Matahari', clauseIds: ['dalam-1', 'dalam-2', 'dalam-3', 'dalam-4', 'dalam-5', 'dalam-6', 'dalam-7']},
  {id: 'tutup', title: 'Tutup Reflektif', clauseIds: ['tutup-1', 'tutup-2', 'tutup-3', 'tutup-4']},
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
