// "Kabar Baik, Kabar Buruk — Kenapa Bumi Tidak Jatuh?" — the world: the petir-guntur
// stage (graphite wall and floor, two near-black silhouettes with a violet rim, drawn
// exactly as in the Keran episode) under a space diorama: an amber Sun at centre, a
// dashed violet orbit ellipse, and a blue-green Earth that rests, falls, veers and
// finally loops. Everything is a function of the timeline's time plus the state
// film.js tweens. No clock is ever read.

const TAU = Math.PI * 2;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const mulberry = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let z = Math.imul(seed ^ (seed >>> 15), 1 | seed); z = (z + Math.imul(z ^ (z >>> 7), 61 | z)) ^ z; return ((z ^ (z >>> 14)) >>> 0) / 4294967296; };

export const GY = 1500;
const INK = "#07070f";
const RIM = [169, 139, 255];   // violet rim: the night side of the stage, and B's colour
const AMBER = [255, 179, 71];  // the Sun's light, and A's colour
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a.toFixed(3)})`;

// The diorama's geometry (world coordinates).
const CX = 540, CY = 690, RX = 360, RY = 165;   // the orbit ellipse, Sun at its centre
const SUN_R = 86, EARTH_R = 78;

// ── Figure poses: copied verbatim from the Keran episode (the format's figures) ──
export const POSES = {
  idle:    { hx: 0.03, hy: -0.905, shx: 0.01, shy: -0.76, e1x: 0.07, e1y: -0.52, h1x: 0.05, h1y: -0.30, e2x: 0.04, e2y: -0.52, h2x: 0.02, h2y: -0.30, hpx: 0, hpy: -0.50, k1x: 0.05, k1y: -0.25, f1x: 0.06, f1y: 0, k2x: -0.05, k2y: -0.25, f2x: -0.06, f2y: 0 },
  talk:    { hx: 0.04, hy: -0.905, shx: 0.01, shy: -0.76, e1x: 0.17, e1y: -0.62, h1x: 0.26, h1y: -0.52, e2x: 0.04, e2y: -0.52, h2x: 0.02, h2y: -0.30, hpx: 0, hpy: -0.50, k1x: 0.05, k1y: -0.25, f1x: 0.06, f1y: 0, k2x: -0.05, k2y: -0.25, f2x: -0.06, f2y: 0 },
  listen:  { hx: 0.055, hy: -0.90, shx: 0.01, shy: -0.76, e1x: 0.07, e1y: -0.52, h1x: 0.05, h1y: -0.30, e2x: 0.04, e2y: -0.52, h2x: 0.02, h2y: -0.30, hpx: 0, hpy: -0.50, k1x: 0.05, k1y: -0.25, f1x: 0.06, f1y: 0, k2x: -0.05, k2y: -0.25, f2x: -0.06, f2y: 0 },
  cross:   { hx: 0.05, hy: -0.90, shx: 0.01, shy: -0.76, e1x: 0.14, e1y: -0.57, h1x: -0.02, h1y: -0.63, e2x: 0.11, e2y: -0.54, h2x: -0.04, h2y: -0.585, hpx: 0, hpy: -0.50, k1x: 0.05, k1y: -0.25, f1x: 0.06, f1y: 0, k2x: -0.05, k2y: -0.25, f2x: -0.06, f2y: 0 },
  palm:    { hx: 0.04, hy: -0.905, shx: 0.01, shy: -0.76, e1x: 0.18, e1y: -0.64, h1x: 0.27, h1y: -0.71, e2x: 0.04, e2y: -0.52, h2x: 0.02, h2y: -0.30, hpx: 0, hpy: -0.50, k1x: 0.05, k1y: -0.25, f1x: 0.06, f1y: 0, k2x: -0.05, k2y: -0.25, f2x: -0.06, f2y: 0 },
  reach:   { hx: 0.07, hy: -0.90, shx: 0.07, shy: -0.765, e1x: 0.17, e1y: -0.83, h1x: 0.30, h1y: -0.935, e2x: 0.05, e2y: -0.52, h2x: 0.03, h2y: -0.30, hpx: 0.03, hpy: -0.50, k1x: 0.07, k1y: -0.25, f1x: 0.09, f1y: 0, k2x: -0.04, k2y: -0.25, f2x: -0.05, f2y: 0 },
  delight: { hx: 0.02, hy: -0.915, shx: 0.01, shy: -0.77, e1x: 0.16, e1y: -0.86, h1x: 0.24, h1y: -1.06, e2x: 0.05, e2y: -0.52, h2x: 0.03, h2y: -0.30, hpx: 0, hpy: -0.50, k1x: 0.05, k1y: -0.25, f1x: 0.06, f1y: 0, k2x: -0.05, k2y: -0.25, f2x: -0.06, f2y: 0 },
  point:   { hx: 0.05, hy: -0.905, shx: 0.02, shy: -0.76, e1x: 0.16, e1y: -0.56, h1x: 0.29, h1y: -0.33, e2x: 0.04, e2y: -0.52, h2x: 0.02, h2y: -0.30, hpx: 0.01, hpy: -0.50, k1x: 0.05, k1y: -0.25, f1x: 0.06, f1y: 0, k2x: -0.05, k2y: -0.25, f2x: -0.06, f2y: 0 },
  holdUp:  { hx: 0.065, hy: -0.915, shx: 0.01, shy: -0.765, e1x: 0.16, e1y: -0.87, h1x: 0.23, h1y: -1.08, e2x: 0.04, e2y: -0.52, h2x: 0.02, h2y: -0.30, hpx: 0, hpy: -0.50, k1x: 0.05, k1y: -0.25, f1x: 0.06, f1y: 0, k2x: -0.05, k2y: -0.25, f2x: -0.06, f2y: 0 },
  handsUp: { hx: 0.0, hy: -0.915, shx: 0.0, shy: -0.765, e1x: 0.19, e1y: -0.90, h1x: 0.27, h1y: -1.12, e2x: 0.13, e2y: -0.88, h2x: 0.18, h2y: -1.10, hpx: -0.01, hpy: -0.50, k1x: 0.09, k1y: -0.27, f1x: 0.13, f1y: -0.055, k2x: -0.06, k2y: -0.25, f2x: -0.07, f2y: 0 },
  tired:   { hx: 0.07, hy: -0.875, shx: 0.02, shy: -0.745, e1x: 0.07, e1y: -0.51, h1x: 0.05, h1y: -0.29, e2x: 0.04, e2y: -0.51, h2x: 0.02, h2y: -0.29, hpx: 0.01, hpy: -0.495, k1x: 0.05, k1y: -0.25, f1x: 0.06, f1y: 0, k2x: -0.05, k2y: -0.25, f2x: -0.06, f2y: 0 },
};
const poseCopy = (p) => ({ ...p });

export function createWorld(canvas, shots) {
  const ctx = canvas.getContext("2d");
  const W = 1080, H = 1920;
  const S = {
    cam: { x: 540, y: 960, z: 1 },
    dim: 0,        // the end: the picture sinks toward night
    flash: 0,      // the one lightning crack in the panic shot
    warm: 1,       // the Sun's glow strength (grows as Earth nears)
    earth: { x: CX - RX, y: CY },  // rest: the ellipse's left point
    orbiting: 0,   // 1 once Earth rides the ellipse (s09 on)
    orbA: Math.PI, // the ellipse angle when orbiting (PI = left point)
    arrowDown: 0,  // the imagined 'down' arrow under Earth (s03)
    crossP: 0,     // its crossing-out (s04)
    appleP: 0,     // the apple's fall to Earth's centre (s04): 0..1
    centreGlow: 0, // Earth's centre dot, lit from s04 on
    fallP: 0,      // the dashed fall-arrow toward the Sun (s06)
    tremble: 0,    // Earth's shake beside the Sun (s07)
    speedP: 0,     // the sideways speed streaks + tangent arrow (s08)
    ellipse: 0.25, // the orbit ellipse's light: faint, then lit (s09)
    figA: { x: 400, dir: 1, h: 640, yOff: 0, phase: 0, j: poseCopy(POSES.idle) },
    figB: { x: 880, dir: -1, h: 640, yOff: 0, phase: 2.1, j: poseCopy(POSES.cross) },
  };
  const sx = (x) => (x - S.cam.x) * S.cam.z + W / 2;
  const sy = (y) => (y - S.cam.y) * S.cam.z + H / 2;
  const zz = (v) => v * S.cam.z;

  const stars = []; { const r = mulberry(7); for (let i = 0; i < 150; i++) stars.push([r() * 1160 - 40, r() * 1450, 0.7 + r() * 1.7, r() * TAU]); }
  const lands = []; { const r = mulberry(41); for (let i = 0; i < 7; i++) lands.push([r() * TAU, 0.25 + r() * 0.45, 0.16 + r() * 0.22]); }
  const bolt = []; { let x = 838, y = 120; const r = mulberry(99); while (y < 560) { bolt.push([x, y]); x += (r() - 0.55) * 70; y += 70 + r() * 70; } bolt.push([x, 590]); }

  function earthPos(t) {
    if (S.orbiting > 0.5) return [CX + RX * Math.cos(S.orbA), CY + RY * Math.sin(S.orbA)];
    const bob = S.orbiting > 0.5 ? 0 : Math.sin(t * 0.9) * 5;
    const tr = S.tremble * Math.sin(t * 47) * 3.5;
    return [S.earth.x + tr, S.earth.y + bob];
  }

  // ── The stage ─────────────────────────────────────────────────────────────
  function wall(t) {
    const g = ctx.createLinearGradient(0, 0, 0, sy(GY));
    g.addColorStop(0, "#14142b"); g.addColorStop(0.6, "#0e0e20"); g.addColorStop(1, "#0b0b17");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, Math.max(0, sy(GY)));
    for (const [x, y, r, ph] of stars) {
      ctx.fillStyle = `rgba(226,224,255,${0.14 + 0.22 * (0.5 + 0.5 * Math.sin(t * 0.8 + ph))})`;
      ctx.beginPath(); ctx.arc(sx(x), sy(y), Math.max(0.8, zz(r)), 0, TAU); ctx.fill();
    }
  }
  function floor() {
    ctx.fillStyle = "#090914";
    ctx.fillRect(0, sy(GY), W, H - sy(GY));
    ctx.strokeStyle = "rgba(190,190,230,0.06)"; ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (const y of [1570, 1660, 1780, 1930]) { ctx.moveTo(0, sy(y)); ctx.lineTo(W, sy(y)); }
    for (let x = -80; x <= 1160; x += 146) { ctx.moveTo(sx(x), sy(GY)); ctx.lineTo(sx(x + (x - 540) * 0.24), sy(1960)); }
    ctx.stroke();
    ctx.fillStyle = rgba(RIM, 0.15);
    ctx.fillRect(0, sy(GY), W, Math.max(1.5, zz(3)));
  }
  function shadow(x, w, a = 0.32) {
    const e = ctx.createRadialGradient(sx(x), sy(GY + 8), 0, sx(x), sy(GY + 8), zz(w));
    e.addColorStop(0, `rgba(0,0,0,${a})`); e.addColorStop(1, "rgba(0,0,0,0)");
    ctx.save(); ctx.translate(sx(x), sy(GY + 8)); ctx.scale(1, 0.15); ctx.translate(-sx(x), -sy(GY + 8));
    ctx.fillStyle = e; ctx.beginPath(); ctx.arc(sx(x), sy(GY + 8), zz(w), 0, TAU); ctx.fill(); ctx.restore();
  }

  // ── The diorama ───────────────────────────────────────────────────────────
  function ellipsePath() {
    ctx.beginPath();
    for (let i = 0; i <= 72; i++) {
      const a = (i / 72) * TAU;
      const px = sx(CX + RX * Math.cos(a)), py = sy(CY + RY * Math.sin(a));
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
  }
  function orbitEllipse() {
    ctx.save();
    ctx.setLineDash([zz(14), zz(12)]);
    ctx.strokeStyle = rgba(RIM, 0.22 + 0.55 * S.ellipse);
    ctx.lineWidth = Math.max(1.6, zz(3 + 2.5 * S.ellipse));
    ellipsePath(); ctx.stroke();
    ctx.restore();
  }
  function sun(t) {
    const glowR = 330 * (0.9 + 0.25 * S.warm);
    const rg = ctx.createRadialGradient(sx(CX), sy(CY), 0, sx(CX), sy(CY), zz(glowR));
    rg.addColorStop(0, rgba(AMBER, 0.34 * S.warm)); rg.addColorStop(1, rgba(AMBER, 0));
    ctx.fillStyle = rg; ctx.fillRect(sx(CX - glowR), sy(CY - glowR), zz(glowR * 2), zz(glowR * 2));
    // rays, turning very slowly
    ctx.strokeStyle = rgba(AMBER, 0.55); ctx.lineWidth = Math.max(2, zz(6)); ctx.lineCap = "round";
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU + t * 0.05;
      const r0 = SUN_R + 16, r1 = SUN_R + 40 + 10 * Math.sin(t * 1.3 + i * 1.7);
      ctx.beginPath();
      ctx.moveTo(sx(CX + r0 * Math.cos(a)), sy(CY + r0 * Math.sin(a)));
      ctx.lineTo(sx(CX + r1 * Math.cos(a)), sy(CY + r1 * Math.sin(a)));
      ctx.stroke();
    }
    const cg = ctx.createRadialGradient(sx(CX - 20), sy(CY - 20), 0, sx(CX), sy(CY), zz(SUN_R));
    cg.addColorStop(0, "#ffe9bd"); cg.addColorStop(0.7, "#ffc46b"); cg.addColorStop(1, "#f59e3d");
    ctx.fillStyle = cg;
    ctx.beginPath(); ctx.arc(sx(CX), sy(CY), zz(SUN_R), 0, TAU); ctx.fill();
  }
  function earth(t) {
    const [ex, ey] = earthPos(t);
    // the imagined 'down' arrow, drawn under Earth before the planet (so Earth overlaps its top)
    if (S.arrowDown > 0.02 && S.orbiting < 0.5) {
      const y0 = ey + EARTH_R + 26, y1 = y0 + 118 * S.arrowDown;
      ctx.strokeStyle = rgba(AMBER, 0.9); ctx.lineWidth = Math.max(2.4, zz(9)); ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(sx(ex), sy(y0)); ctx.lineTo(sx(ex), sy(y1)); ctx.stroke();
      if (S.arrowDown > 0.85) {
        ctx.fillStyle = rgba(AMBER, 0.95);
        ctx.beginPath();
        ctx.moveTo(sx(ex), sy(y1 + 30)); ctx.lineTo(sx(ex - 17), sy(y1 + 2)); ctx.lineTo(sx(ex + 17), sy(y1 + 2));
        ctx.closePath(); ctx.fill();
      }
      if (S.crossP > 0.02) {
        ctx.strokeStyle = rgba(RIM, 0.95); ctx.lineWidth = Math.max(2.2, zz(8));
        const cx0 = ex - 44, cx1 = ex + 44, cy0 = y0 - 8, cy1 = y1 + 34;
        const k = S.crossP;
        ctx.beginPath(); ctx.moveTo(sx(cx0), sy(cy0)); ctx.lineTo(sx(lerp(cx0, cx1, k)), sy(lerp(cy0, cy1, k))); ctx.stroke();
        if (k > 0.5) {
          const k2 = (k - 0.5) * 2;
          ctx.beginPath(); ctx.moveTo(sx(cx1), sy(cy0)); ctx.lineTo(sx(lerp(cx1, cx0, k2)), sy(lerp(cy0, cy1, k2))); ctx.stroke();
        }
      }
    }
    // the dashed fall-arrow toward the Sun, ahead of the falling Earth
    if (S.fallP > 0.02 && S.orbiting < 0.5) {
      const dx = CX - ex, dy = CY - ey, len = Math.hypot(dx, dy) || 1;
      const ux = dx / len, uy = dy / len;
      const x0 = ex + ux * (EARTH_R + 14), y0 = ey + uy * (EARTH_R + 14);
      const x1 = ex + ux * (EARTH_R + 14 + (len - EARTH_R - SUN_R - 30) * S.fallP), y1 = ey + uy * (EARTH_R + 14 + (len - EARTH_R - SUN_R - 30) * S.fallP);
      ctx.save(); ctx.setLineDash([zz(16), zz(13)]);
      ctx.strokeStyle = rgba(AMBER, 0.85); ctx.lineWidth = Math.max(2.2, zz(7)); ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(sx(x0), sy(y0)); ctx.lineTo(sx(x1), sy(y1)); ctx.stroke(); ctx.restore();
    }
    // sideways speed streaks, trailing behind Earth as it veers (s08)
    if (S.speedP > 0.02) {
      ctx.strokeStyle = rgba(RIM, 0.8 * S.speedP); ctx.lineWidth = Math.max(2, zz(6)); ctx.lineCap = "round";
      for (let i = 0; i < 4; i++) {
        const oy = (i - 1.5) * 30, ln = 90 + i * 26;
        ctx.beginPath();
        ctx.moveTo(sx(ex - EARTH_R - 18), sy(ey + oy));
        ctx.lineTo(sx(ex - EARTH_R - 18 - ln), sy(ey + oy + 22));
        ctx.stroke();
      }
    }
    // the planet
    const g = ctx.createRadialGradient(sx(ex - 26), sy(ey - 26), 0, sx(ex), sy(ey), zz(EARTH_R));
    g.addColorStop(0, "#7cc4ff"); g.addColorStop(0.65, "#3d7bd6"); g.addColorStop(1, "#274b8f");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(sx(ex), sy(ey), zz(EARTH_R), 0, TAU); ctx.fill();
    ctx.save();
    ctx.beginPath(); ctx.arc(sx(ex), sy(ey), zz(EARTH_R), 0, TAU); ctx.clip();
    ctx.fillStyle = "rgba(94,199,126,0.85)";
    for (const [ang, dist, rad] of lands) {
      ctx.beginPath();
      ctx.arc(sx(ex + Math.cos(ang) * EARTH_R * dist), sy(ey + Math.sin(ang) * EARTH_R * dist), zz(EARTH_R * rad), 0, TAU);
      ctx.fill();
    }
    // the lit centre the apple falls to
    if (S.centreGlow > 0.02) {
      const cg = ctx.createRadialGradient(sx(ex), sy(ey), 0, sx(ex), sy(ey), zz(30));
      cg.addColorStop(0, rgba(AMBER, 0.95 * S.centreGlow)); cg.addColorStop(1, rgba(AMBER, 0));
      ctx.fillStyle = cg; ctx.fillRect(sx(ex - 30), sy(ey - 30), zz(60), zz(60));
      ctx.fillStyle = rgba([255, 226, 170], S.centreGlow);
      ctx.beginPath(); ctx.arc(sx(ex), sy(ey), Math.max(1.6, zz(6)), 0, TAU); ctx.fill();
    }
    ctx.restore();
    ctx.strokeStyle = rgba(RIM, 0.5); ctx.lineWidth = Math.max(1.4, zz(3));
    ctx.beginPath(); ctx.arc(sx(ex), sy(ey), zz(EARTH_R), 0, TAU); ctx.stroke();
    // the tiny figure on top, and his apple on its way to the centre (s04)
    if (S.appleP > 0.001 && S.appleP < 0.999) {
      const fx = ex + 16, fy = ey - EARTH_R;
      ctx.strokeStyle = "#e8e6ff"; ctx.lineWidth = Math.max(1.6, zz(4)); ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(sx(fx), sy(fy)); ctx.lineTo(sx(fx), sy(fy - 20)); ctx.stroke();
      ctx.fillStyle = "#e8e6ff";
      ctx.beginPath(); ctx.arc(sx(fx), sy(fy - 28), Math.max(1.6, zz(7)), 0, TAU); ctx.fill();
      const p = S.appleP;
      const ax = lerp(fx + 20, ex, p * p), ay = lerp(fy - 16, ey, p);
      ctx.fillStyle = "#ff7a6b";
      ctx.beginPath(); ctx.arc(sx(ax), sy(ay), Math.max(1.6, zz(8)), 0, TAU); ctx.fill();
    }
  }
  function lightning() {
    if (S.flash <= 0.02) return;
    ctx.strokeStyle = `rgba(216,204,255,${(0.9 * S.flash).toFixed(3)})`;
    ctx.lineWidth = Math.max(2, zz(5)); ctx.lineJoin = "round"; ctx.lineCap = "round";
    ctx.beginPath();
    bolt.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(sx(x), sy(y)) : ctx.lineTo(sx(x), sy(y))));
    ctx.stroke();
    ctx.fillStyle = `rgba(200,190,255,${(0.30 * S.flash).toFixed(3)})`;
    ctx.fillRect(0, 0, W, H);
  }

  // ── Figures (the format's silhouettes, as drawn in the Keran episode) ──────
  function figure(fig, t) {
    const { x, dir, h, j } = fig;
    const gy = GY + (fig.yOff || 0);
    const breathe = Math.sin(t * 1.5 + fig.phase) * 0.0045;
    for (const pass of [1, 0]) {
      const dx = pass ? -3.2 : 0;
      ctx.strokeStyle = pass ? rgba(RIM, 0.42) : INK;
      ctx.fillStyle = pass ? rgba(RIM, 0.42) : INK;
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      const X = (v) => sx(x + dx + dir * v * h), Y = (v) => sy(gy + v * h);
      const lw = Math.max(1.8, zz(h * 0.078));
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(X(j.shx - 0.03), Y(j.shy + 0.012 + breathe)); ctx.lineTo(X(j.e2x - 0.03), Y(j.e2y)); ctx.lineTo(X(j.h2x - 0.03), Y(j.h2y));
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(X(j.hpx), Y(j.hpy)); ctx.lineTo(X(j.k2x), Y(j.k2y)); ctx.lineTo(X(j.f2x), Y(j.f2y));
      ctx.moveTo(X(j.hpx), Y(j.hpy)); ctx.lineTo(X(j.k1x), Y(j.k1y)); ctx.lineTo(X(j.f1x), Y(j.f1y));
      ctx.stroke();
      ctx.lineWidth = Math.max(2.2, zz(h * 0.135));
      ctx.beginPath(); ctx.moveTo(X(j.hpx), Y(j.hpy)); ctx.lineTo(X(j.shx), Y(j.shy + breathe)); ctx.stroke();
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(X(j.shx), Y(j.shy + breathe)); ctx.lineTo(X(j.e1x), Y(j.e1y)); ctx.lineTo(X(j.h1x), Y(j.h1y));
      ctx.stroke();
      ctx.beginPath(); ctx.arc(X(j.hx), Y(j.hy + breathe), zz(h * 0.088), 0, TAU); ctx.fill();
    }
  }

  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    wall(t);
    floor();
    orbitEllipse();
    sun(t);
    earth(t);
    shadow(S.figA.x, 190); shadow(S.figB.x, 190);
    figure(S.figB, t);
    figure(S.figA, t);
    lightning();
    if (S.dim > 0) { ctx.fillStyle = `rgba(3,4,12,${(S.dim * 0.88).toFixed(3)})`; ctx.fillRect(0, 0, W, H); }
  }

  return { S, draw };
}
