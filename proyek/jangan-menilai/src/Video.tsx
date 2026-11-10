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
const TROUSER_FAR = '#2E333D';

type Mouth = 'smile' | 'flat' | 'sad' | 'yawn' | 'soft';

// ---------- Tokoh tampak depan (adegan diam/duduk) ----------
const Person: React.FC<{
  x: number; y: number; s?: number; skin: string; shirt: string; hair: string;
  pose?: 'down' | 'cross' | 'wave' | 'slump'; mouth?: Mouth; headTilt?: number;
  eyesClosed?: boolean; stern?: boolean;
}> = ({ x, y, s = 1, skin, shirt, hair, pose = 'down', mouth = 'smile', headTilt = 0, eyesClosed = false, stern = false }) => {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-58} y={-195} width={40} height={185} rx={16} fill={TROUSER} />
      <ellipse cx={-36} cy={-4} rx={30} ry={11} fill={INK} />
      <rect x={18} y={-195} width={40} height={185} rx={16} fill={TROUSER} />
      <ellipse cx={40} cy={-4} rx={30} ry={11} fill={INK} />
      <rect x={-98} y={-478} width={196} height={300} rx={52} fill={shirt} />
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
          <g transform="rotate(-152 84 -448)">
            <rect x={66} y={-452} width={36} height={215} rx={18} fill={shirt} />
            <circle cx={84} cy={-452} r={21} fill={skin} />
          </g>
          <rect x={-102} y={-452} width={36} height={215} rx={18} fill={shirt} transform="rotate(12 -84 -448)" />
        </g>
      ) : (
        <g>
          <rect x={-102} y={-452} width={36} height={218} rx={18} fill={shirt} transform={`rotate(${pose === 'slump' ? 4 : 10} -84 -448)`} />
          <rect x={66} y={-452} width={36} height={218} rx={18} fill={shirt} transform={`rotate(${pose === 'slump' ? -4 : -10} 84 -448)`} />
        </g>
      )}
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

// ---------- Tokoh profil melangkah (gaya Mindwander) ----------
// Kaki dua ruas: paha berayun, lutut menekuk saat kaki mengayun ke depan,
// lengan berayun lawan arah kaki, badan naik-turun halus mengikuti langkah.
const ProfilePerson: React.FC<{
  x: number; y: number; s?: number; skin: string; shirt: string; hair: string;
  phase: number; flip?: boolean; mouth?: Mouth; pose?: 'walk' | 'stand' | 'hold' | 'scratch';
  speed?: number;
}> = ({ x, y, s = 1, skin, shirt, hair, phase, flip = false, mouth = 'smile', pose = 'walk', speed = 1 }) => {
  const walking = pose === 'walk' || pose === 'hold';
  const p = phase;
  const bob = walking ? -Math.abs(Math.sin(p)) * 9 : 0;
  const lean = walking ? 3.5 : 0;
  const leg = (hipX: number, ph: number, far: boolean) => {
    const A = walking ? Math.sin(ph) * 0.42 : 0.03;
    const bend = walking ? Math.max(0, -Math.cos(ph)) * 0.75 : 0;
    const thigh = 94, shin = 94;
    const kx = hipX + Math.sin(A) * thigh;
    const ky = -196 + Math.cos(A) * thigh;
    const sa = A - bend;
    const ax = kx + Math.sin(sa) * shin;
    const ay = ky + Math.cos(sa) * shin;
    const col = far ? TROUSER_FAR : TROUSER;
    return (
      <g key={hipX + String(far)}>
        <polyline points={`${hipX},-196 ${kx},${ky} ${ax},${ay}`} fill="none" stroke={col} strokeWidth={37} strokeLinecap="round" strokeLinejoin="round" />
        <ellipse cx={ax + 10} cy={ay - 2} rx={23} ry={10} fill={INK} />
      </g>
    );
  };
  const armSwing = walking && pose === 'walk' ? Math.sin(p + Math.PI) * 0.3 : 0;
  const armSwingFar = walking && pose === 'walk' ? Math.sin(p) * 0.3 : 0;
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      <g transform={`translate(0 ${bob}) rotate(${lean} 0 -240)`}>
        {leg(-6, p + Math.PI, true)}
        {/* lengan jauh */}
        {pose === 'hold' ? (
          <g transform="rotate(-84 -2 -442)">
            <rect x={-19} y={-446} width={34} height={196} rx={17} fill={shirt} opacity={0.72} />
          </g>
        ) : pose === 'scratch' ? (
          <rect x={-19} y={-446} width={34} height={196} rx={17} fill={shirt} opacity={0.72} transform="rotate(8 -2 -442)" />
        ) : (
          <g transform={`rotate(${armSwingFar} -2 -442)`}>
            <rect x={-19} y={-446} width={34} height={202} rx={17} fill={shirt} opacity={0.72} />
            <circle cx={-2} cy={-240} r={19} fill={skin} opacity={0.85} />
          </g>
        )}
        {/* badan */}
        <rect x={-64} y={-472} width={126} height={292} rx={48} fill={shirt} />
        {/* kepala */}
        <g>
          <rect x={-12} y={-502} width={30} height={36} rx={10} fill={skin} />
          <circle cx={12} cy={-566} r={82} fill={skin} />
          <circle cx={90} cy={-548} r={15} fill={skin} />
          <path d="M -70 -566 A 82 82 0 0 1 94 -566 L 94 -592 A 82 58 0 0 0 -70 -592 Z" fill={hair} />
          <circle cx={38} cy={-562} r={8.5} fill={INK} />
          {mouth === 'smile' && <path d="M 56 -524 Q 72 -512 84 -524" stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round" />}
          {mouth === 'flat' && <line x1={58} y1={-518} x2={82} y2={-518} stroke={INK} strokeWidth={6} strokeLinecap="round" />}
          {mouth === 'sad' && <path d="M 56 -510 Q 70 -522 84 -510" stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round" />}
          {mouth === 'soft' && <path d="M 58 -522 Q 70 -513 82 -522" stroke={INK} strokeWidth={5.5} fill="none" strokeLinecap="round" />}
        </g>
        {leg(8, p, false)}
        {/* lengan dekat */}
        {pose === 'hold' ? (
          <g transform="rotate(-88 4 -442)">
            <rect x={-13} y={-446} width={34} height={200} rx={17} fill={shirt} />
            <circle cx={4} cy={-242} r={19} fill={skin} />
          </g>
        ) : pose === 'scratch' ? (
          <g transform="rotate(-148 4 -442)">
            <rect x={-13} y={-446} width={34} height={196} rx={17} fill={shirt} />
            <circle cx={4} cy={-246} r={19} fill={skin} />
          </g>
        ) : (
          <g transform={`rotate(${armSwing} 4 -442)`}>
            <rect x={-13} y={-446} width={34} height={202} rx={17} fill={shirt} />
            <circle cx={4} cy={-240} r={19} fill={skin} />
          </g>
        )}
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

// garis tanah mengalir ke belakang: kesan melangkah maju
const FlowLines: React.FC<{ y?: number; speed?: number; col?: string }> = ({ y = 1620, speed = 5, col = '#FFFFFF' }) => {
  const f = useCurrentFrame();
  const off = (f * speed) % 300;
  return (
    <g stroke={col} strokeWidth={9} strokeLinecap="round" opacity={0.5}>
      {[0, 1, 2, 3].map((i) => (
        <line key={i} x1={-80 + i * 300 - off + 300} y1={y + (i % 2) * 54} x2={70 + i * 300 - off + 300} y2={y + (i % 2) * 54} />
      ))}
    </g>
  );
};

const Fade: React.FC<{ children: React.ReactNode; dur: number }> = ({ children, dur }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 9], [0, 1], { extrapolateRight: 'clamp' });
  const o2 = interpolate(f, [dur - 7, dur], [1, 0.25], { extrapolateLeft: 'clamp' });
  return <g opacity={Math.min(o, o2)}>{children}</g>;
};

// S1 — salah sangka: tiga pejalan profil bersilangan
const S1: React.FC = () => {
  const f = useCurrentFrame();
  const ax = interpolate(f, [0, 119], [-160, 620]);
  const bx = interpolate(f, [0, 119], [1240, 480]);
  const cx = interpolate(f, [0, 119], [-320, 300]);
  return (
    <Fade dur={120}>
      <Sky top="#FFF7E8" ground="#E9DCC3" sunX={880} sunY={230} />
      <ProfilePerson x={cx} y={1510} s={0.88} skin="#E0AC7E" shirt={DENIM} hair="#4A3222" phase={f * 0.16 + 4} />
      <ProfilePerson x={ax} y={1580} s={0.98} skin="#C68B59" shirt={SAGE} hair="#33302B" phase={f * 0.17} />
      <ProfilePerson x={bx} y={1650} s={1.06} skin="#8A5A3B" shirt={MUSTARD} hair="#1E1B18" phase={f * 0.18 + 2} flip />
      <Bubble x={ax + 30} y={730} delay={16} s={0.9} />
      <Bubble x={bx - 30} y={800} delay={38} s={1} />
      <Bubble x={cx + 20} y={690} delay={58} s={0.85} />
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
      <g>
        <rect x={250} y={1180} width={580} height={44} rx={20} fill="#9C6644" />
        <rect x={292} y={1220} width={30} height={330} fill="#7C4F33" />
        <rect x={758} y={1220} width={30} height={330} fill="#7C4F33" />
      </g>
      <g transform={`translate(0 ${Math.sin(f * 0.05) * 4})`}>
        <Person x={540} y={1466} s={0.94} skin="#C68B59" shirt={TERRA} hair="#33302B" pose="slump" mouth="yawn" headTilt={13} eyesClosed />
      </g>
      <rect x={228} y={1284} width={624} height={42} rx={19} fill="#9C6644" />
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
      <g transform={`translate(492 1050) rotate(${shake}) scale(1.25)`} opacity={0.5}>
        <path d="M0 130 C -170 30 -150 -120 -60 -140 C -20 -148 0 -118 0 -96 C 0 -118 20 -148 60 -140 C 150 -120 170 30 0 130 Z" fill={TERRA} />
      </g>
      <Person x={480} y={1560} skin="#8A5A3B" shirt={PLUM} hair="#1E1B18" pose="cross" mouth="flat" stern />
    </Fade>
  );
};

// S4 — terlihat baik, menyelipkan niat lain
const S4: React.FC = () => {
  return (
    <Fade dur={122}>
      <Sky top="#F9E8C8" ground="#E3D2AC" sunX={810} sunY={290} />
      <polygon points="470,1560 1010,1700 1010,1810 480,1640" fill={INK} opacity={0.16} />
      <g transform="translate(880 1668) rotate(-8)" opacity={0.85}>
        <rect x={-58} y={-44} width={116} height={88} rx={10} fill={INK} opacity={0.55} />
        <rect x={-8} y={-44} width={16} height={88} fill={MUSTARD} opacity={0.8} />
        <rect x={-58} y={-10} width={116} height={14} fill={MUSTARD} opacity={0.8} />
      </g>
      <Person x={440} y={1560} skin="#E0AC7E" shirt={SAGE} hair="#4A3222" pose="wave" mouth="smile" />
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
        <g transform="rotate(38)"><rect x={-26} y={-118} width={52} height={236} rx={24} fill="#D64541" /></g>
        <g transform="rotate(-38)"><rect x={-26} y={-118} width={52} height={236} rx={24} fill="#D64541" /></g>
      </g>
      <Person x={540} y={1560} skin="#C68B59" shirt={DENIM} hair="#33302B" mouth="sad" headTilt={7} />
      <PointHand x={150} y={980} r={-6} cuff={INK} />
      <PointHand x={930} y={900} r={6} flip cuff={SAGE} />
      <PointHand x={150} y={1300} r={4} cuff={PLUM} />
    </Fade>
  );
};

// S6 — ternyata punya alasan: bergegas membawa beban
const S6: React.FC = () => {
  const f = useCurrentFrame();
  const xFade = interpolate(f, [0, 26], [1, 0], { extrapolateRight: 'clamp' });
  return (
    <Fade dur={100}>
      <Sky top="#F3D5B4" ground="#DEC79A" sunX={770} sunY={330} />
      <g transform="translate(190 470)" opacity={xFade * 0.8}>
        <g transform="rotate(38)"><rect x={-16} y={-72} width={32} height={144} rx={15} fill="#D64541" /></g>
        <g transform="rotate(-38)"><rect x={-16} y={-72} width={32} height={144} rx={15} fill="#D64541" /></g>
      </g>
      <FlowLines y={1640} speed={9} />
      <g stroke="#FFFFFF" strokeWidth={13} strokeLinecap="round" opacity={0.6}>
        <line x1={90} y1={1000} x2={250} y2={1000} />
        <line x1={60} y1={1110} x2={240} y2={1110} />
      </g>
      <ProfilePerson x={520} y={1560} skin="#C68B59" shirt={DENIM} hair="#33302B" phase={f * 0.34} pose="hold" mouth="flat" />
      {/* tumpukan barang di depan dada */}
      <g transform="translate(648 1252)">
        <rect x={-110} y={-60} width={220} height={98} rx={12} fill="#B07B4F" />
        <rect x={-90} y={-138} width={180} height={82} rx={12} fill="#C98F5E" />
        <rect x={-60} y={-202} width={122} height={68} rx={12} fill="#A96F42" />
        <rect x={-6} y={-60} width={12} height={98} fill="#8A5A33" />
      </g>
      <g transform="translate(880 690)">
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
  const walking = f < 60;
  const px = interpolate(f, [0, 60], [130, 440], { extrapolateRight: 'clamp' });
  return (
    <Fade dur={131}>
      <Sky top="#EFC9A5" ground="#DABE90" sunX={740} sunY={360} />
      <line x1={40} y1={1470} x2={520} y2={1470} stroke={INK} strokeWidth={10} strokeDasharray="34 26" strokeLinecap="round" opacity={0.75} />
      <path d="M520 1470 C 620 1380, 700 1540, 790 1440 C 860 1360, 900 1520, 970 1430 C 1010 1380, 1040 1460, 1060 1440" fill="none" stroke={INK} strokeWidth={10} strokeLinecap="round" opacity={0.75} />
      <ProfilePerson x={px} y={1560} skin="#8A5A3B" shirt={MUSTARD} hair="#1E1B18" phase={walking ? f * 0.22 : 0.6} pose={walking ? 'walk' : 'scratch'} mouth="flat" />
      {!walking && <Bubble x={640} y={742} s={0.8} delay={2} />}
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
  const panLX = 540 - Math.cos(rad) * 300; const panLY = 760 + Math.sin(rad) * 300;
  const panRX = 540 + Math.cos(rad) * 300; const panRY = 760 + Math.sin(rad) * 300;
  return (
    <Fade dur={102}>
      <Sky top="#E3AC8B" ground="#D2A87E" sunX={720} sunY={420} sun="#EE9B5F" />
      <g transform={`translate(540 ${haloY})`} opacity={haloO}>
        <circle r={64} fill="#FFD98A" opacity={0.3} />
        <circle r={46} fill="none" stroke="#FFD98A" strokeWidth={11} />
      </g>
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
      <g transform={`translate(${panLX} ${panLY + 118})`}>
        <path d="M -120 0 A 120 44 0 0 0 120 0 Z" fill={MUSTARD} />
        <circle cx={0} cy={-52} r={52} fill="#5A5148" />
      </g>
      <g transform={`translate(${panRX} ${panRY + 118})`}>
        <path d="M -120 0 A 120 44 0 0 0 120 0 Z" fill={MUSTARD} />
        <path d="M -8 -18 C -52 -64 -20 -104 26 -96 C 58 -64 34 -22 -8 -18 Z" fill={SAGE} />
      </g>
      <circle cx={540} cy={760} r={24} fill={MUSTARD} />
    </Fade>
  );
};

// S9 — setiap orang membawa cerita: berjalan bersama ke senja
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
  const folks: Array<[number, string, string, string, number]> = [
    [150, '#C68B59', TERRA, '#33302B', 0],
    [330, '#8A5A3B', PLUM, '#1E1B18', 2.1],
    [510, '#E0AC7E', SAGE, '#4A3222', 4.2],
    [690, '#C68B59', DENIM, '#33302B', 1.3],
    [870, '#8A5A3B', MUSTARD, '#1E1B18', 3.4],
  ];
  const driftX = interpolate(f, [0, 124], [0, 36]);
  return (
    <Fade dur={125}>
      <rect x={0} y={0} width={1080} height={1920} fill="#4A3A63" />
      <rect x={0} y={980} width={1080} height={300} fill="#E88B5A" opacity={0.55} />
      <circle cx={540} cy={1010} r={120} fill="#F2A65A" opacity={0.9} />
      <g fill="#FFE9B8" opacity={starO}>
        {stars.map(([sx, sy], i) => (<circle key={i} cx={sx} cy={sy} r={6} />))}
      </g>
      <rect x={0} y={1560} width={1080} height={360} fill="#3A3153" />
      <FlowLines y={1660} speed={3.4} col="#8E7FB8" />
      {folks.map(([fx, skin, shirt, hair, ph], i) => (
        <g key={i}>
          <ProfilePerson x={fx + driftX} y={1560} s={0.94} skin={skin} shirt={shirt} hair={hair} mouth="soft" phase={f * 0.13 + ph} />
          <Book x={fx + driftX + 10} y={726} d={10 + i * 9} />
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
