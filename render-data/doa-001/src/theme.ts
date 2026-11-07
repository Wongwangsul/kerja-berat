import {loadFont} from '@remotion/google-fonts/Poppins';

// Palet hangat proyek (persis brief — jangan menambah warna inti lain).
export const COLORS = {
  cream: '#FFF7E6',
  orange: '#FB8500',
  yellow: '#FFB703',
  green: '#1F7A4D',
  wood: '#8D6E63',
  ink: '#263238',
} as const;

// Poppins: Bold (700) untuk judul/angka, Medium (500) untuk subtitle.
const {fontFamily, waitUntilDone} = loadFont('normal', {
  weights: ['500', '700'],
  subsets: ['latin'],
});

export const poppins = fontFamily;
export const waitForPoppins = waitUntilDone;

// Font teks Arab doa: cadangan pendukung Arab (Amiri tidak terpasang di VM
// ini; Noto Sans Arabic terpasang dan mendukung harakat penuh).
export const arabicFont = "'Amiri', 'Noto Sans Arabic', 'Traditional Arabic', 'DejaVu Sans', serif";
