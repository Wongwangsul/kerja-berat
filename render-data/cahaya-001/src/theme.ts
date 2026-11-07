import {loadFont} from '@remotion/google-fonts/Poppins';

// Palet resmi proyek (persis spek Icul — jangan menambah warna inti lain).
export const COLORS = {
  navy: '#0B1D3A',
  yellow: '#FFB703',
  orange: '#FB8500',
  earthBlue: '#219EBC',
  white: '#F1F5F9',
} as const;

// Poppins: Bold (700) untuk judul/angka, Medium (500) untuk subtitle.
const {fontFamily, waitUntilDone} = loadFont('normal', {
  weights: ['500', '700'],
  subsets: ['latin'],
});

export const poppins = fontFamily;
export const waitForPoppins = waitUntilDone;
