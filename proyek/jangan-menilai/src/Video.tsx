import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  useCurrentFrame,
} from 'remotion';

const INK = '#2B2622';
const TERRA = '#C96F4A';
const SAGE = '#7D8C6F';
const MUSTARD = '#D9A441';
const DENIM = '#5B7B9A';
const PLUM = '#8A5A7B';
const TROUSER = '#3A3F4A';

type Pose = 'down' | 'cross' | 'wave' | 'hold' | 'slump' | 'scratch';
type Mouth = 'smile' | 'flat' | 'sad' | 'yawn' | 'soft';

const Person: React.FC<{
  x: number; y: number; s?: number; skin: string; shirt: string; hair: string;
  pose?: Pose; mouth?: Mouth; flip?: boolean; walk?: number; headTilt?: number;
  eyesClosed?: boolean; stern?: boolean;
}> = ({ x, y, s = 1, skin, shirt, hair, pose = 'down', mouth = 'smile', flip = false, walk = 0, headTilt = 0, eyesClosed = false, stern = false }) => {
  const legSwing = Math.sin(walk) * 14;
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      {/* legs */}
      <g transform={`rotate(${legSwing} -38 -190)`}>
        <rect x={-58} y={-195} width={40} height={185} rx={16} fill={TROUSER} />
        <ellipse cx={-36} cy={-4} rx={30} ry={11} fill={INK} />
      </g>
      <g transform={`rotate(${-legSwing} 38 -190)`}>
        <rect x={18} y={-195} width={40} height={185} rx={16} fill={TROUSER} />
        <ellipse cx={40} cy={-4} rx={30} ry={11} fill={INK} />
      </g>
      {/* body */}
      <rect x={-98} y={-478} width={196} height={300} rx={52} fill={shirt} />
      {/* arms */}
      {pose === 'cross' ? (
        <g>
          <g stroke="#000000" strokeOpacity={0.22} strokeWidth={38} strokeLinecap="round">
            <line x1={-78} y1={-420} x2={62} y2={-300} />
            <line x1={78} y1={-420} x2={-62} y2={-300} />
          </g>
          <circle cx={62} cy={-300} r={19} fill={skin} />
          <circle cx={-62} cy={-300} r={19} fill={skin} />
        </g>
      ) : pose === 'wave' ? (
        <g>
          <g transform={`rotate(${-155 + Math.sin(walk * 0.5) * 12} 84 -448)`}>
            <rect x={66} y={-452} width={36} height={215} rx={18} fill={shirt} />
            <circle cx={84} cy={-452} r={21} fill={skin} />
          </g>
          <g transform="rotate(12 -84 -448)">
            <rect x={-102} y={-452} width={36} height={215} rx={18} fill={shirt} />
          </g>
        </g>
      ) : pose === 'hold' ? (
        <g stroke={shirt} strokeWidth={36} strokeLinecap="round">
          <line x1={-84} y1={-440} x2={-30} y2={-330} />
          <line x1={-30} y1={-330} x2={58} y2={-330} />
          <line x1={84} y1={-440} x2={30} y2={-330} />
          <line x1={30} y1={-330} x2={-58} y2={-330} />
        </g>
      ) : pose === 'scratch' ? (
        <g>
          <g transform="rotate(132 84 -448)">
            <rect x={66} y={-452} width={36} height={200} rx={18} fill={shirt} />
            <circle cx={84} cy={-452} r={20} fill={skin} />
          </g>
          <g transform="rotate(12 -84 -448)">
            <rect x={-102} y={-452} width={36} height={215} rx={18} fill={shirt} />
          </g>
        </g>
      ) : (
        <g>
          <g transform={`rotate(${pose === 'slump' ? 4 : 10} -84 -448)`}>
            <rect x={-102} y={-452} width={36} height={218} rx={18} fill={shirt} />
          </g>
          <g transform={`rotate(${pose === 'slump' ? -4 : -10} 84 -448)`}>
            <rect x={66} y={-452} width={36} height={218} rx={18} fill={shirt} />
          </g>
        </g>
      )}
      {/* head */}
      <g transform={`rotate(${headTilt} 0 -478)`}>
        <rect x={-16} y={-500} width={32} height={34} rx={10} fill={skin} />
        <circle cx={0} cy={-568} r={86} fill={skin} />
        <path d="M -86 -568 A 86 86 0 0 1 86 -568 L 86 -596 A 86 62 0 0 0 -86 -596 Z" fill={hair} />
        {eyesClosed ? (
          <g stroke={INK} strokeWidth={6} strokeLinecap="round" fill="none">
            <path d="M -48 -566 Q -32 -556 -16 -566" />
            <path d="M 16 -566 Q 32 -556 48 -566" />
          </g>
        ) : (
          <g fill={INK}>
            <circle cx={-32} cy={-566} r={8.5} />
            <circle cx={32} cy={-566} r={8.5} />
          </g>
        )}
        {stern && (
          <g stroke={INK} strokeWidth={7} strokeLinecap="round">
            <line x1={-52} y1={-596} x2={-14} y2={-586} />
            <line x1={52} y1={-596} x2={14} y2={-586} />
          </g>
        )}
        {mouth === 'smile' && <path d="M -24 -524 Q 0 -504 24 -524" stroke={INK} strokeWidth={6.5} fill="none" strokeLinecap="round" />}
        {mouth === 'flat' && <line x1={-18} y1={-518} x2={18} y2={-518} stroke={INK} strokeWidth={6.5} strokeLinecap="round" />}
        {mouth === 'sad' && <path d="M -24 -508 Q 0 -526 24 -508" stroke={INK} strokeWidth={6.5} fill="none" strokeLinecap="round" />}
        {mouth === 'yawn' && <ellipse cx={0} cy={-516} rx={14} ry={18} fill={INK} />}
        {mouth === 'soft' && <path d="M -16 -522 Q 0 -510 16 -522" stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round" />}
      </g>
    </g>
  );
};

const Bubble: React.FC<{ x: number; y: number; s?: number; delay: number }> = ({ x, y, s = 1, delay }) => {
  const f = useCurrentFrame();
  const pop = interpolate(f, [delay, delay + 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <g transform={`translate(${x} ${y}) scale(${s * pop})`} opacity={pop}>
      <circle cx={-58} cy={52} r={11} fill="#FFFFFF" opacity={0.95} />
      <circle cx={-38} cy={30} r={16} fill="#FFFFFF" opacity={0.95} />
      <ellipse cx={0} cy={-8} rx={86} ry={58} fill="#FFFFFF" opacity={0.95} />
      <g fill={INK}>
        <circle cx={-34} cy={-8} r={10} />
        <circle cx={0} cy={-8} r={10} />
        <circle cx={34} cy={-8} r={10} />
      </g>
    </g>
  );
};

const Sky: React.FC<{ top: string; ground: string; sunX?: number; sunY?: number; sun?: string }> = ({ top, ground, sunX = 880, sunY = 240, sun = '#F4C95D' }) => {
  const f = useCurrentFrame();
  const drift = (f * 0.35) % 130;
  return (
    <g>
      <rect x={0} y={0} width={1080} height={1920} fill={top} />
      <circle cx={sunX} cy={sunY} r={86} fill={sun} opacity={0.9} />
      <g fill="#FFFFFF" opacity={0.75}>
        <ellipse cx={180 + drift} cy={300} rx={110} ry={36} />
        <ellipse cx={640 - drift * 0.6} cy={190} rx={140} ry={42} />
        <ellipse cx={950 + drift * 0.4} cy={420} rx={90} ry={30} />
      </g>
      <rect x={0} y={1560} width={1080} height={360} fill={ground} />
      <rect x={0} y={1546} width={1080} height={16} fill={ground} opacity={0.7} />
    </g>
  );
};

const Fade: React.FC<{ children: React.ReactNode; dur: number }> = ({ children, dur }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 9], [0, 1], { extrapolateRight: 'clamp' });
  const o2 = interpolate(f, [dur - 7, dur], [1, 0.25], { extrapolateLeft: 'clamp' });
  return <g opacity={Math.min(o, o2)}>{children}</g>;
};

// S1 — salah sangka: orang-orang berlalu dengan gelembung pikiran
const S1: React.FC = () => {
  const f = useCurrentFrame();
  const bob = Math.abs(Math.sin(f * 0.22)) * 10;
  return (
    <Fade dur={120}>
      <Sky top="#FFF7E8" ground="#E9DCC3" sunX={880} sunY={230} />
      <g transform={`translate(0 ${-bob})`}>
        <Person x={268} y={1560} skin="#C68B59" shirt={SAGE} hair="#33302B" walk={f * 0.22} />
      </g>
      <g transform={`translate(0 ${-Math.abs(Math.sin(f * 0.22 + 2)) * 10})`}>
        <Person x={548} y={1560} skin="#8A5A3B" shirt={MUSTARD} hair="#1E1B18" flip walk={f * 0.22 + 2} />
      </g>
      <g transform={`translate(0 ${-Math.abs(Math.sin(f * 0.22 + 4)) * 10})`}>
        <Person x={822} y={1560} skin="#E0AC7E" shirt={DENIM} hair="#4A3222" walk={f * 0.22 + 4} />
      </g>
      <Bubble x={268} y={760} delay={14} s={0.9} />
      <Bubble x={548} y={700} delay={34} s={1} />
      <Bubble x={822} y={760} delay={54} s={0.9} />
    </Fade>
  );
};

// S2 — cuek, ternyata hanya lelah
const S2: React.FC = () => {
  const f = useCurrentFrame();
  const blink = 0.55 + 0.45 * Math.sin(f * 0.14);
  return (
    <Fade dur={113}>
      <Sky top="#FDF1DC" ground="#E7D8BC" sunX={850} sunY={250} />
      {/* bangku */}
      <g>
        <rect x={250} y={1180} width={580} height={44} rx={20} fill="#9C6644" />
        <rect x={292} y={1220} width={30} height={330} fill="#7C4F33" />
        <rect x={758} y={1220} width={30} height={330} fill="#7C4F33" />
      </g>
      <g transform={`translate(0 ${Math.sin(f * 0.05) * 4})`}>
        <Person x={540} y={1466} s={0.94} skin="#C68B59" shirt={TERRA} hair="#33302B" pose="slump" mouth="yawn" headTilt={13} eyesClosed walk={f * 0.05} />
      </g>
      {/* papan duduk di pinggul + kaki menggantung: kesan duduk */}
      <rect x={228} y={1284} width={624} height={42} rx={19} fill="#9C6644" />
      {/* baterai lemah */}
      <g transform="translate(742 700)" opacity={blink}>
        <rect x={-95} y={-42} width={170} height={84} rx={18} fill="none" stroke={INK} strokeWidth={9} />
        <rect x={82} y={-16} width={22} height={32} rx={7} fill={INK} />
        <rect x={-76} y={-24} width={42} height={48} rx={9} fill="#D64541" />
      </g>
    </Fade>
  );
};

// S3 — tampak tegas, menyimpan ragu
const S3: React.FC = () => {
  const f = useCurrentFrame();
  const shake = Math.sin(f * 0.4) * 2.6;
  return (
    <Fade dur={106}>
      <Sky top="#FBEED3" ground="#E5D5B4" sunX={830} sunY={270} />
      {/* hati ragu tersembunyi di balik punggung */}
      <g transform={`translate(492 1050) rotate(${shake}) scale(1.25)`} opacity={0.5}>
        <path d="M0 130 C -170 30 -150 -120 -60 -140 C -20 -148 0 -118 0 -96 C 0 -118 20 -148 60 -140 C 150 -120 170 30 0 130 Z" fill={TERRA} />
      </g>
      <Person x={480} y={1560} skin="#8A5A3B" shirt={PLUM} hair="#1E1B18" pose="cross" mouth="flat" stern />
    </Fade>
  );
};

// S4 — terlihat baik, menyelipkan niat lain
const S4: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <Fade dur={122}>
      <Sky top="#F9E8C8" ground="#E3D2AC" sunX={810} sunY={290} />
      {/* bayangan panjang memegang bungkusan tersembunyi */}
      <polygon points="470,1560 1010,1700 1010,1810 480,1640" fill={INK} opacity={0.16} />
      <g transform="translate(880 1668) rotate(-8)" opacity={0.85}>
        <rect x={-58} y={-44} width={116} height={88} rx={10} fill={INK} opacity={0.55} />
        <rect x={-8} y={-44} width={16} height={88} fill={MUSTARD} opacity={0.8} />
        <rect x={-58} y={-10} width={116} height={14} fill={MUSTARD} opacity={0.8} />
      </g>
      <Person x={440} y={1560} skin="#E0AC7E" shirt={SAGE} hair="#4A3222" pose="wave" mouth="smile" walk={f * 0.3} />
    </Fade>
  );
};

// S5 — yang kita duga salah
const S5: React.FC = () => {
  const f = useCurrentFrame();
  const pulse = 1 + Math.sin(f * 0.16) * 0.06;
  const PointHand: React.FC<{ x: number; y: number; r: number; flip?: boolean; cuff: string }> = ({ x, y, r, flip = false, cuff }) => (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${flip ? -1 : 1} 1)`}>
      <rect x={-190} y={-27} width={330} height={54} rx={27} fill="#E8B48C" />
      <rect x={-196} y={-38} width={64} height={76} rx={12} fill={cuff} />
      <circle cx={168} cy={0} r={43} fill="#E8B48C" />
      <rect x={192} y={-16} width={158} height={31} rx={15} fill="#E8B48C" />
      <rect x={188} y={17} width={102} height={27} rx={13} fill="#E8B48C" />
      <rect x={138} y={30} width={74} height={26} rx={13} fill="#E8B48C" transform="rotate(28 138 30)" />
    </g>
  );
  return (
    <Fade dur={107}>
      <Sky top="#F6DFC0" ground="#E0CBA2" sunX={790} sunY={310} />
      <g transform={`translate(540 560) scale(${pulse})`}>
        <g transform="rotate(38)">
          <rect x={-26} y={-118} width={52} height={236} rx={24} fill="#D64541" />
        </g>
        <g transform="rotate(-38)">
          <rect x={-26} y={-118} width={52} height={236} rx={24} fill="#D64541" />
        </g>
      </g>
      <Person x={540} y={1560} skin="#C68B59" shirt={DENIM} hair="#33302B" mouth="sad" headTilt={7} />
      <PointHand x={150} y={980} r={-6} cuff={INK} />
      <PointHand x={930} y={900} r={6} flip cuff={SAGE} />
      <PointHand x={150} y={1300} r={4} cuff={PLUM} />
    </Fade>
  );
};

// S6 — ternyata punya alasan yang tak kita tahu
const S6: React.FC = () => {
  const f = useCurrentFrame();
  const xFade = interpolate(f, [0, 26], [1, 0], { extrapolateRight: 'clamp' });
  const stride = f * 0.3;
  return (
    <Fade dur={100}>
      <Sky top="#F3D5B4" ground="#DEC79A" sunX={770} sunY={330} />
      <g transform="translate(190 470)" opacity={xFade * 0.8}>
        <g transform="rotate(38)"><rect x={-16} y={-72} width={32} height={144} rx={15} fill="#D64541" /></g>
        <g transform="rotate(-38)"><rect x={-16} y={-72} width={32} height={144} rx={15} fill="#D64541" /></g>
      </g>
      {/* garis gerak */}
      <g stroke="#FFFFFF" strokeWidth={13} strokeLinecap="round" opacity={0.65}>
        <line x1={120} y1={1010} x2={300} y2={1010} />
        <line x1={80} y1={1120} x2={290} y2={1120} />
        <line x1={130} y1={1230} x2={300} y2={1230} />
      </g>
      <Person x={590} y={1560} skin="#C68B59" shirt={DENIM} hair="#33302B" pose="hold" mouth="flat" walk={stride} />
      {/* tumpukan barang bawaan */}
      <g transform="translate(590 1268)">
        <rect x={-118} y={-66} width={236} height={104} rx={12} fill="#B07B4F" />
        <rect x={-96} y={-150} width={192} height={88} rx={12} fill="#C98F5E" />
        <rect x={-64} y={-222} width={128} height={76} rx={12} fill="#A96F42" />
        <rect x={-6} y={-66} width={12} height={104} fill="#8A5A33" />
      </g>
      {/* jam kecil: terburu waktu */}
      <g transform="translate(856 700)">
        <circle r={66} fill="#FFFFFF" stroke={INK} strokeWidth={8} />
        <line x1={0} y1={0} x2={0} y2={-40} stroke={INK} strokeWidth={8} strokeLinecap="round" />
        <line x1={0} y1={0} x2={30} y2={10} stroke={INK} strokeWidth={8} strokeLinecap="round" />
      </g>
    </Fade>
  );
};

// S7 — yang kita anggap benar, tak sesederhana kelihatannya
const S7: React.FC = () => {
  const f = useCurrentFrame();
  const px = interpolate(f, [0, 62], [150, 470], { extrapolateRight: 'clamp' });
  const walking = f < 62 ? f * 0.3 : 0;
  return (
    <Fade dur={131}>
      <Sky top="#EFC9A5" ground="#DABE90" sunX={740} sunY={360} />
      {/* jalan lurus lalu kusut */}
      <line x1={40} y1={1470} x2={520} y2={1470} stroke={INK} strokeWidth={10} strokeDasharray="34 26" strokeLinecap="round" opacity={0.75} />
      <path d="M520 1470 C 620 1380, 700 1540, 790 1440 C 860 1360, 900 1520, 970 1430 C 1010 1380, 1040 1460, 1060 1440" fill="none" stroke={INK} strokeWidth={10} strokeLinecap="round" opacity={0.75} />
      <Bubble x={668} y={742} s={0.8} delay={64} />
      <Person x={px} y={1560} skin="#8A5A3B" shirt={MUSTARD} hair="#1E1B18" pose={f < 62 ? 'down' : 'scratch'} mouth="flat" walk={walking} />
    </Fade>
  );
};

// S8 — jangan cepat menilai: timbangan yang menenangkan diri
const S8: React.FC = () => {
  const f = useCurrentFrame();
  const ang = interpolate(f, [6, 78], [-13, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const haloY = interpolate(f, [30, 78], [400, 760], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const haloO = interpolate(f, [30, 44], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const rad = (ang * Math.PI) / 180;
  const panLX = 540 - Math.cos(rad) * 300; const panLY = 760 + Math.sin(rad) * -300 * -1;
  const panRX = 540 + Math.cos(rad) * 300; const panRY = 760 + Math.sin(rad) * 300;
  return (
    <Fade dur={102}>
      <Sky top="#E3AC8B" ground="#D2A87E" sunX={720} sunY={420} sun="#EE9B5F" />
      {/* lingkaran cahaya lembut turun menenangkan poros */}
      <g transform={`translate(540 ${haloY})`} opacity={haloO}>
        <circle r={64} fill="#FFD98A" opacity={0.3} />
        <circle r={46} fill="none" stroke="#FFD98A" strokeWidth={11} />
      </g>
      {/* tiang + balok */}
      <rect x={522} y={730} width={36} height={706} rx={16} fill={INK} />
      <polygon points="470,1400 610,1400 650,1470 430,1470" fill={INK} />
      <g transform={`translate(540 760) rotate(${ang})`}>
        <rect x={-330} y={-17} width={660} height={34} rx={17} fill={INK} />
      </g>
      <g stroke={INK} strokeWidth={7} strokeLinecap="round">
        <line x1={540 - Math.cos(rad) * 300} y1={760 - Math.sin(rad) * 300} x2={panLX - 84} y2={panLY + 112} />
        <line x1={540 - Math.cos(rad) * 300} y1={760 - Math.sin(rad) * 300} x2={panLX + 84} y2={panLY + 112} />
        <line x1={540 + Math.cos(rad) * 300} y1={760 + Math.sin(rad) * 300} x2={panRX - 84} y2={panRY + 112} />
        <line x1={540 + Math.cos(rad) * 300} y1={760 + Math.sin(rad) * 300} x2={panRX + 84} y2={panRY + 112} />
      </g>
      {/* piringan kiri: batu berat */}
      <g transform={`translate(${panLX} ${panLY + 118})`}>
        <path d="M -120 0 A 120 44 0 0 0 120 0 Z" fill={MUSTARD} />
        <circle cx={0} cy={-52} r={52} fill="#5A5148" />
      </g>
      {/* piringan kanan: daun ringan */}
      <g transform={`translate(${panRX} ${panRY + 118})`}>
        <path d="M -120 0 A 120 44 0 0 0 120 0 Z" fill={MUSTARD} />
        <path d="M -8 -18 C -52 -64 -20 -104 26 -96 C 58 -64 34 -22 -8 -18 Z" fill={SAGE} />
      </g>
      <circle cx={540} cy={760} r={24} fill={MUSTARD} />
    </Fade>
  );
};

// S9 — setiap orang membawa cerita
const S9: React.FC = () => {
  const f = useCurrentFrame();
  const Book: React.FC<{ x: number; y: number; d: number }> = ({ x, y, d }) => {
    const o = interpolate(f, [d, d + 16], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    const fl = Math.sin(f * 0.06 + d) * 5;
    return (
      <g transform={`translate(${x} ${y + fl})`} opacity={o}>
        <circle r={86} fill="#FFD98A" opacity={0.28} />
        <g transform="rotate(-14)"><rect x={-64} y={-36} width={62} height={76} rx={9} fill="#FFF6DE" /></g>
        <g transform="rotate(14)"><rect x={2} y={-36} width={62} height={76} rx={9} fill="#FFF6DE" /></g>
        <rect x={-4} y={-38} width={8} height={78} fill="#E8C87E" />
      </g>
    );
  };
  const stars = [[120, 200], [300, 130], [520, 240], [760, 150], [950, 260], [200, 420], [880, 430], [420, 90]];
  const starO = interpolate(f, [18, 60], [0, 0.9], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const folks: Array<[number, string, string, string]> = [
    [172, '#C68B59', TERRA, '#33302B'],
    [356, '#8A5A3B', PLUM, '#1E1B18'],
    [540, '#E0AC7E', SAGE, '#4A3222'],
    [724, '#C68B59', DENIM, '#33302B'],
    [908, '#8A5A3B', MUSTARD, '#1E1B18'],
  ];
  return (
    <Fade dur={125}>
      <rect x={0} y={0} width={1080} height={1920} fill="#4A3A63" />
      <rect x={0} y={980} width={1080} height={300} fill="#E88B5A" opacity={0.55} />
      <circle cx={540} cy={1010} r={120} fill="#F2A65A" opacity={0.9} />
      <g fill="#FFE9B8" opacity={starO}>
        {stars.map(([sx, sy], i) => (<circle key={i} cx={sx} cy={sy} r={6} />))}
      </g>
      <rect x={0} y={1560} width={1080} height={360} fill="#3A3153" />
      {folks.map(([fx, skin, shirt, hair], i) => (
        <g key={i}>
          <Person x={fx} y={1560} s={0.92} skin={skin} shirt={shirt} hair={hair} mouth="soft" walk={f * 0.1 + i * 2} />
          <Book x={fx} y={730} d={10 + i * 9} />
        </g>
      ))}
    </Fade>
  );
};

export const Video: React.FC = () => {
  const f = useCurrentFrame();
  const endFade = interpolate(f, [1008, 1026], [0, 0.85], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ backgroundColor: '#FFF7E8' }}>
      <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <Sequence layout="none" from={0} durationInFrames={120}><S1 /></Sequence>
        <Sequence layout="none" from={120} durationInFrames={113}><S2 /></Sequence>
        <Sequence layout="none" from={233} durationInFrames={106}><S3 /></Sequence>
        <Sequence layout="none" from={339} durationInFrames={122}><S4 /></Sequence>
        <Sequence layout="none" from={461} durationInFrames={107}><S5 /></Sequence>
        <Sequence layout="none" from={568} durationInFrames={100}><S6 /></Sequence>
        <Sequence layout="none" from={668} durationInFrames={131}><S7 /></Sequence>
        <Sequence layout="none" from={799} durationInFrames={102}><S8 /></Sequence>
        <Sequence layout="none" from={901} durationInFrames={125}><S9 /></Sequence>
      </svg>
      <AbsoluteFill style={{ backgroundColor: '#241D33', opacity: endFade }} />
    </AbsoluteFill>
  );
};
