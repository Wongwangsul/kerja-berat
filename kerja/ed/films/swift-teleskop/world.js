// "Teleskop NASA Jatuh di Langit Sumatra" — the world, drawn on one canvas.
// Nine stages stand along one wide world: the Sumatra coast (x≈0), the orbit
// (x≈3200), deep space and the burst (x≈6400), the three instruments (x≈9600),
// the swelling atmosphere (x≈12800), the altitude chart (x≈16000), the rescue
// (x≈19200), the map of Sumatra (x≈22400) and the archive (x≈25600). film.js
// only moves the camera and the state; every animated value is a function of
// the timeline's time or of that state — nothing here reads a clock or a dice.
export function createWorld(canvas, shots) {
  const ctx = canvas.getContext("2d");
  const S = {
    cam: { x: 0, y: 540, z: 1 },
    streakA: -1, burstI: 0, slew: 0, panelA: 0, panelB: 0, panelC: 0,
    swell: 0, sinkP: 0, chartP: 0, lowOrb: 0,
    spin: 0, arms: 0, thrust: 0, measure: 0, linkFall: 0,
    mapP: 0, entryI: 0, archI: 0,
    dim: 0, fade: 0,
  };
  const GOLD = "#ffb347", BLUE = "#7fb2ff", FIG = "#12122a", PAPER = "#e9dfc4";
  const X = { sumatra: 0, orbit: 3200, burst: 6400, panels: 9600, atmos: 12800, chart: 16000, rescue: 19200, map: 22400, legacy: 25600 };

  const rng = (seed) => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  // stars per stage, generated once: [dx, dy, r, phase, speed]
  const STARS = {};
  for (const [name, cx] of Object.entries(X)) {
    const r = rng(1234 + cx);
    STARS[name] = Array.from({ length: 150 }, () => [(r() * 2 - 1) * 1500, r() * 1250 - 180, 0.7 + r() * 1.5, r() * 6.28, 0.4 + r() * 1.2]);
  }
  function stars(name, cx, t, bright = 1) {
    for (const [dx, dy, rad, ph, sp] of STARS[name]) {
      const a = (0.28 + 0.30 * (0.5 + 0.5 * Math.sin(t * sp + ph))) * bright;
      ctx.fillStyle = `rgba(210,224,255,${a.toFixed(3)})`;
      ctx.beginPath(); ctx.arc(cx + dx, dy, rad, 0, 7); ctx.fill();
    }
  }

  // ── shared painters ────────────────────────────────────────────────────────
  function satellite(x, y, s, ang = 0, fire = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    // solar wings
    ctx.fillStyle = "#1d2c5e"; ctx.strokeStyle = "#3a5aa8"; ctx.lineWidth = 2;
    for (const dir of [-1, 1]) {
      ctx.fillRect(dir * 0.42 * s - (dir < 0 ? 0.62 * s : 0), -0.16 * s, 0.62 * s, 0.32 * s);
      ctx.strokeRect(dir * 0.42 * s - (dir < 0 ? 0.62 * s : 0), -0.16 * s, 0.62 * s, 0.32 * s);
      ctx.beginPath();
      for (let i = 1; i < 4; i++) {
        const gx = dir * 0.42 * s + (dir < 0 ? -0.62 * s + i * 0.155 * s : i * 0.155 * s);
        ctx.moveTo(gx, -0.16 * s); ctx.lineTo(gx, 0.16 * s);
      }
      ctx.stroke();
    }
    // body
    ctx.fillStyle = "#2a2a4a"; ctx.strokeStyle = "#565680"; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.roundRect(-0.42 * s, -0.21 * s, 0.84 * s, 0.42 * s, 0.08 * s); ctx.fill(); ctx.stroke();
    // telescope tube + dish
    ctx.fillStyle = "#3a3a63"; ctx.fillRect(-0.10 * s, -0.38 * s, 0.20 * s, 0.18 * s);
    ctx.beginPath(); ctx.ellipse(0, -0.42 * s, 0.17 * s, 0.07 * s, 0, 0, 7); ctx.fillStyle = "#49497a"; ctx.fill();
    // beacon
    ctx.fillStyle = GOLD; ctx.beginPath(); ctx.arc(0.30 * s, -0.21 * s, 0.035 * s, 0, 7); ctx.fill();
    if (fire > 0) { // entry fire: a cone of flame behind the body
      const g = ctx.createLinearGradient(-0.4 * s, 0, -2.4 * s, 0);
      g.addColorStop(0, `rgba(255,190,90,${0.85 * fire})`); g.addColorStop(0.5, `rgba(255,110,40,${0.45 * fire})`); g.addColorStop(1, "rgba(255,80,30,0)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(-0.42 * s, -0.16 * s); ctx.lineTo(-2.4 * s, 0); ctx.lineTo(-0.42 * s, 0.16 * s); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  function linkCraft(x, y, s, rot, t) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    const open = S.arms;
    ctx.strokeStyle = "#8a8ab0"; ctx.lineWidth = 0.055 * s; ctx.lineCap = "round";
    for (const [ax, ay, bx, by] of [[-0.2, -0.28, -0.55, -0.62], [0.2, -0.28, 0.55, -0.62], [0, 0.3, 0, 0.72]]) {
      const mx = ax + (bx - ax) * open, my = ay + (by - ay) * open;
      ctx.beginPath(); ctx.moveTo(ax * s, ay * s);
      ctx.lineTo((ax + mx) / 2 * s + 0.08 * s, (ay + my) / 2 * s);
      ctx.lineTo(mx * s, my * s); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(mx * s, my * s); ctx.lineTo((mx + 0.07) * s, (my - 0.07) * s);
      ctx.moveTo(mx * s, my * s); ctx.lineTo((mx - 0.07) * s, (my - 0.07) * s); ctx.stroke();
    }
    ctx.fillStyle = "#262640"; ctx.strokeStyle = "#6a6a96"; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.roundRect(-0.34 * s, -0.28 * s, 0.68 * s, 0.56 * s, 0.07 * s); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#3d3d68"; ctx.fillRect(-0.34 * s, -0.28 * s, 0.68 * s, 0.14 * s);
    ctx.fillStyle = GOLD; ctx.beginPath(); ctx.arc(0, 0.02 * s, 0.045 * s, 0, 7); ctx.fill();
    if (S.thrust > 0) {
      const fl = (0.6 + 0.4 * Math.sin(t * 31)) * S.thrust;
      const g = ctx.createLinearGradient(0, 0.28 * s, 0, 0.75 * s);
      g.addColorStop(0, `rgba(160,200,255,${0.8 * fl})`); g.addColorStop(1, "rgba(160,200,255,0)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(-0.10 * s, 0.28 * s); ctx.lineTo(0, 0.75 * s); ctx.lineTo(0.10 * s, 0.28 * s); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  function figStand(x, y, s, phone = 0) {
    ctx.fillStyle = FIG;
    ctx.beginPath();
    ctx.moveTo(x - 0.15 * s, y);
    ctx.quadraticCurveTo(x - 0.14 * s, y - 0.45 * s, x - 0.10 * s, y - 0.70 * s);
    ctx.quadraticCurveTo(x, y - 0.78 * s, x + 0.10 * s, y - 0.70 * s);
    ctx.quadraticCurveTo(x + 0.14 * s, y - 0.45 * s, x + 0.15 * s, y);
    ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.arc(x, y - 0.865 * s, 0.088 * s, 0, 7); ctx.fill();
    ctx.strokeStyle = "rgba(255,179,71,0.35)"; ctx.lineWidth = 0.03 * s;
    ctx.beginPath(); ctx.arc(x, y - 0.865 * s, 0.088 * s, -2.4, -0.7); ctx.stroke();
    if (phone > 0) { // one arm raised, a small lit phone in the hand
      ctx.strokeStyle = FIG; ctx.lineWidth = 0.075 * s; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(x + 0.08 * s, y - 0.62 * s); ctx.lineTo(x + 0.30 * s, y - 0.95 * s); ctx.stroke();
      ctx.fillStyle = `rgba(200,220,255,${0.9 * phone})`;
      ctx.fillRect(x + 0.27 * s, y - 1.06 * s, 0.09 * s, 0.14 * s);
    }
  }

  function earth(cx, cy, r, atmo = 0.5) {
    const g = ctx.createRadialGradient(cx, cy - r * 0.92, r * 0.1, cx, cy, r);
    g.addColorStop(0, "#274a86"); g.addColorStop(0.55, "#16294f"); g.addColorStop(1, "#0a1428");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill();
    // land hints
    ctx.fillStyle = "rgba(46,90,60,0.20)";
    ctx.beginPath(); ctx.ellipse(cx - r * 0.34, cy - r * 0.80, r * 0.16, r * 0.055, -0.4, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + r * 0.28, cy - r * 0.86, r * 0.12, r * 0.04, 0.3, 0, 7); ctx.fill();
    // atmosphere: a bright rim and a soft halo
    ctx.strokeStyle = `rgba(127,178,255,${0.55 * atmo})`; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.stroke();
    const hg = ctx.createRadialGradient(cx, cy, r * 0.98, cx, cy, r * 1.10);
    hg.addColorStop(0, `rgba(127,178,255,${0.20 * atmo})`); hg.addColorStop(1, "rgba(127,178,255,0)");
    ctx.fillStyle = hg;
    ctx.beginPath(); ctx.arc(cx, cy, r * 1.10, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.985, 0, 7); ctx.fill();
  }

  function label(x, y, text, size = 30, col = "rgba(190,208,240,0.85)", align = "center") {
    ctx.fillStyle = col; ctx.font = `600 ${size}px system-ui, sans-serif`;
    ctx.textAlign = align; ctx.fillText(text, x, y); ctx.textAlign = "center";
  }

  // ── stages ─────────────────────────────────────────────────────────────────
  function paintSumatra(t) {
    const cx = X.sumatra;
    stars("sumatra", cx, t);
    // moon, a thin crescent
    ctx.strokeStyle = "rgba(220,228,250,0.8)"; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(cx + 760, 150, 34, 0.6, 5.4); ctx.stroke();
    // sea sheen, left
    const sg = ctx.createLinearGradient(cx - 1500, 0, cx - 300, 0);
    sg.addColorStop(0, "rgba(70,110,190,0.16)"); sg.addColorStop(1, "rgba(70,110,190,0)");
    ctx.fillStyle = sg; ctx.fillRect(cx - 1500, 880, 1200, 200);
    // a breath of village glow on the horizon, so the silhouettes read
    const vg = ctx.createRadialGradient(cx, 905, 60, cx, 905, 1050);
    vg.addColorStop(0, "rgba(255,170,90,0.07)"); vg.addColorStop(1, "rgba(255,170,90,0)");
    ctx.fillStyle = vg; ctx.beginPath(); ctx.arc(cx, 905, 1050, 0, 7); ctx.fill();
    // land silhouette: hills, rooftops, palms
    ctx.fillStyle = "#0a0a20";
    ctx.beginPath();
    ctx.moveTo(cx - 1500, 1080); ctx.lineTo(cx - 1500, 930);
    ctx.quadraticCurveTo(cx - 1000, 860, cx - 560, 905);
    ctx.lineTo(cx - 470, 905); ctx.lineTo(cx - 470, 845); ctx.lineTo(cx - 415, 812); ctx.lineTo(cx - 360, 845); ctx.lineTo(cx - 360, 905);
    ctx.lineTo(cx - 180, 900); ctx.lineTo(cx - 180, 852); ctx.lineTo(cx - 128, 824); ctx.lineTo(cx - 76, 852); ctx.lineTo(cx - 76, 900);
    ctx.quadraticCurveTo(cx + 300, 872, cx + 700, 908);
    ctx.lineTo(cx + 790, 908); ctx.lineTo(cx + 790, 858); ctx.lineTo(cx + 838, 830); ctx.lineTo(cx + 886, 858); ctx.lineTo(cx + 886, 908);
    ctx.quadraticCurveTo(cx + 1200, 880, cx + 1500, 925); ctx.lineTo(cx + 1500, 1080);
    ctx.closePath(); ctx.fill();
    // palms
    ctx.strokeStyle = "#0a0a20"; ctx.lineWidth = 13; ctx.lineCap = "round";
    for (const [px, ph] of [[-1080, 120], [240, 150], [1080, 110]]) {
      ctx.beginPath(); ctx.moveTo(cx + px, 920); ctx.quadraticCurveTo(cx + px + 14, 920 - ph * 0.6, cx + px + 26, 920 - ph); ctx.stroke();
      ctx.lineWidth = 8;
      for (const a of [-0.5, -0.15, 0.2, 0.55]) {
        ctx.beginPath(); ctx.moveTo(cx + px + 26, 920 - ph);
        ctx.quadraticCurveTo(cx + px + 26 + Math.sin(a) * 62, 920 - ph - 26 + Math.abs(a) * 22, cx + px + 26 + Math.sin(a) * 105, 920 - ph - 6 + Math.abs(a) * 46);
        ctx.stroke();
      }
      ctx.lineWidth = 13;
    }
    // lit windows
    for (const [wx, wy] of [[-415, 868], [-128, 872], [838, 878]]) {
      const fl = 0.75 + 0.25 * Math.sin(t * 2.1 + wx);
      ctx.fillStyle = `rgba(255,179,71,${0.85 * fl})`;
      ctx.fillRect(cx + wx, wy, 13, 16);
    }
    // the watchers
    figStand(cx - 40, 902, 300, S.streakA >= 0 ? 1 : 0);
    figStand(cx + 210, 908, 265);
    figStand(cx - 265, 910, 245);
    // the fireball
    if (S.streakA >= 0) {
      const p = Math.min(1, S.streakA);
      const hx = cx - 760 + p * 1420, hy = 165 + p * 265 + p * p * 60;
      const tail = 340 + p * 120;
      const tg = ctx.createLinearGradient(hx - tail, hy - tail * 0.19, hx, hy);
      tg.addColorStop(0, "rgba(255,150,60,0)"); tg.addColorStop(0.75, "rgba(255,170,80,0.55)"); tg.addColorStop(1, "rgba(255,230,180,0.95)");
      ctx.strokeStyle = tg; ctx.lineCap = "round";
      ctx.lineWidth = 15; ctx.beginPath(); ctx.moveTo(hx - tail, hy - tail * 0.19); ctx.lineTo(hx, hy); ctx.stroke();
      ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(hx - tail * 0.8, hy - tail * 0.15); ctx.lineTo(hx, hy); ctx.stroke();
      const hg = ctx.createRadialGradient(hx, hy, 2, hx, hy, 90);
      hg.addColorStop(0, "rgba(255,240,205,0.95)"); hg.addColorStop(0.35, "rgba(255,180,90,0.5)"); hg.addColorStop(1, "rgba(255,150,60,0)");
      ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(hx, hy, 90, 0, 7); ctx.fill();
      if (p > 0.72) { // it breaks: three fragments diverge and fall
        const fp = (p - 0.72) / 0.28;
        for (const [ox, oy, len] of [[26, 34, 120], [58, 8, 90], [12, 62, 140]]) {
          const fx = hx + ox * fp * 2.2, fy = hy + oy * fp * 2.2;
          ctx.strokeStyle = `rgba(255,180,95,${0.75 * (1 - fp * 0.4)})`; ctx.lineWidth = 6;
          ctx.beginPath(); ctx.moveTo(fx - len * 0.5, fy - len * 0.12); ctx.lineTo(fx, fy); ctx.stroke();
          ctx.fillStyle = "rgba(255,225,175,0.9)"; ctx.beginPath(); ctx.arc(fx, fy, 5.5, 0, 7); ctx.fill();
        }
      }
      if (p >= 1) { // spent: two faint smoke wisps
        ctx.strokeStyle = "rgba(160,170,200,0.20)"; ctx.lineWidth = 10;
        ctx.beginPath(); ctx.moveTo(cx + 300, 420); ctx.quadraticCurveTo(cx + 520, 395, cx + 760, 430); ctx.stroke();
      }
    }
    label(cx - 880, 118, "S U M A T R A   U T A R A", 26, "rgba(160,180,220,0.55)", "left");
  }

  function paintOrbit(t) {
    const cx = X.orbit;
    stars("orbit", cx, t);
    earth(cx, 1690, 1150, 0.55);
    // high orbit ring (600 km) and, when lowOrb, the fallen ring (275 km)
    const ring = (ry, alpha, dash) => {
      ctx.strokeStyle = `rgba(160,190,240,${alpha})`; ctx.lineWidth = 2.5;
      ctx.setLineDash(dash || []);
      ctx.beginPath(); ctx.ellipse(cx, 415, 860, ry, 0, 0, 7); ctx.stroke();
      ctx.setLineDash([]);
    };
    ring(265, 0.5);
    if (S.lowOrb > 0.02) ring(175, 0.45 * S.lowOrb, [10, 9]);
    label(cx - 830, 170, "±600 km", 27, "rgba(170,195,235,0.75)", "left");
    if (S.lowOrb > 0.02) label(cx + 830, 300, "±275 km", 27, `rgba(255,190,110,${0.85 * S.lowOrb})`, "right");
    // Swift travels the ring it currently belongs to
    const a = t * (Math.PI * 2 / 26) + 2.2;
    const ry = 265 + (175 - 265) * S.lowOrb;
    const sx = cx + Math.cos(a) * 860, sy = 415 + Math.sin(a) * ry;
    satellite(sx, sy, 120, Math.cos(a) * 0.12);
    if (S.lowOrb > 0.4) { // at 275 km the air worries it: a faint heat shimmer astern
      ctx.fillStyle = `rgba(255,150,70,${0.20 * S.lowOrb})`;
      ctx.beginPath(); ctx.ellipse(sx - 130, sy, 95, 16, 0, 0, 7); ctx.fill();
    }
  }

  function paintBurst(t) {
    const cx = X.burst;
    stars("burst", cx, t, 1.25);
    // a faint galaxy smudge
    const gg = ctx.createRadialGradient(cx + 500, 300, 10, cx + 500, 300, 330);
    gg.addColorStop(0, "rgba(140,150,220,0.13)"); gg.addColorStop(1, "rgba(140,150,220,0)");
    ctx.fillStyle = gg;
    ctx.save(); ctx.translate(cx + 500, 300); ctx.rotate(-0.5); ctx.scale(1, 0.36); ctx.translate(-(cx + 500), -300);
    ctx.beginPath(); ctx.arc(cx + 500, 300, 330, 0, 7); ctx.fill(); ctx.restore();
    // the burst: flash + expanding rings
    const bx = cx + 380, by = 395;
    for (let i = 0; i < 3; i++) {
      const rr = ((t * 95 + i * 190) % 570) + 20;
      ctx.strokeStyle = `rgba(255,190,105,${(0.34 * (1 - rr / 590) * (0.35 + S.burstI)).toFixed(3)})`;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(bx, by, rr, 0, 7); ctx.stroke();
    }
    const fg = ctx.createRadialGradient(bx, by, 2, bx, by, 120 + 130 * S.burstI);
    fg.addColorStop(0, `rgba(255,244,214,${0.55 + 0.45 * S.burstI})`);
    fg.addColorStop(0.4, `rgba(255,180,90,${0.35 + 0.3 * S.burstI})`);
    fg.addColorStop(1, "rgba(255,160,80,0)");
    ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(bx, by, 120 + 130 * S.burstI, 0, 7); ctx.fill();
    ctx.strokeStyle = `rgba(255,220,160,${0.5 + 0.5 * S.burstI})`; ctx.lineWidth = 4; ctx.lineCap = "round";
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4 + 0.4, L = 44 + 30 * S.burstI;
      ctx.beginPath(); ctx.moveTo(bx + Math.cos(a) * 26, by + Math.sin(a) * 26);
      ctx.lineTo(bx + Math.cos(a) * (26 + L), by + Math.sin(a) * (26 + L)); ctx.stroke();
    }
    label(bx, by - 215, "SEMBURAN SINAR GAMA", 26, `rgba(255,205,130,${0.45 + 0.5 * S.burstI})`);
    // Swift, turning toward the burst as slew rises
    const sx = cx - 470, sy = 585;
    satellite(sx, sy, 150, -0.5 * S.slew);
    if (S.slew > 0.45) {
      ctx.strokeStyle = `rgba(255,179,71,${0.5 * S.slew})`; ctx.lineWidth = 2.5; ctx.setLineDash([8, 9]);
      ctx.beginPath(); ctx.moveTo(sx + 60, sy - 40); ctx.lineTo(bx - 40, by + 30); ctx.stroke(); ctx.setLineDash([]);
    }
    label(cx - 470, 705, "SWIFT", 27, "rgba(170,195,235,0.7)");
  }

  function paintPanels(t) {
    const cx = X.panels;
    stars("panels", cx, t, 0.8);
    const defs = [
      ["BAT", "pendeteksi sinar gama", S.panelA, (px, py) => { // wide coded-mask eye
        ctx.fillStyle = "#23234a"; ctx.beginPath(); ctx.moveTo(px - 95, py + 40); ctx.lineTo(px + 95, py + 40); ctx.lineTo(px + 60, py - 70); ctx.lineTo(px - 60, py - 70); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = "#4a5a96"; ctx.lineWidth = 2;
        for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(px + i * 24, py - 62); ctx.lineTo(px + i * 30, py + 34); ctx.stroke(); }
      }],
      ["XRT", "teleskop sinar-X", S.panelB, (px, py) => { // a long tube, angled up
        ctx.save(); ctx.translate(px, py); ctx.rotate(-0.5);
        ctx.fillStyle = "#23234a"; ctx.fillRect(-110, -26, 220, 52);
        ctx.fillStyle = "#34345f"; ctx.fillRect(84, -33, 26, 66);
        ctx.restore();
      }],
      ["UVOT", "ultraviolet + cahaya tampak", S.panelC, (px, py) => { // tube with a sparkle
        ctx.save(); ctx.translate(px, py); ctx.rotate(-0.5);
        ctx.fillStyle = "#23234a"; ctx.fillRect(-95, -21, 190, 42);
        ctx.fillStyle = "#34345f"; ctx.fillRect(72, -27, 23, 54);
        ctx.restore();
        ctx.strokeStyle = GOLD; ctx.lineWidth = 3.5; ctx.lineCap = "round";
        const sx2 = px + 128, sy2 = py - 62;
        ctx.beginPath(); ctx.moveTo(sx2 - 16, sy2); ctx.lineTo(sx2 + 16, sy2); ctx.moveTo(sx2, sy2 - 16); ctx.lineTo(sx2, sy2 + 16); ctx.stroke();
      }],
    ];
    defs.forEach(([name, sub, glowV, glyph], i) => {
      const px = cx + (i - 1) * 590, py = 520;
      ctx.fillStyle = "rgba(18,26,58,0.72)";
      ctx.strokeStyle = `rgba(127,178,255,${0.35 + 0.55 * glowV})`; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.roundRect(px - 255, 225, 510, 590, 22); ctx.fill(); ctx.stroke();
      if (glowV > 0.02) {
        const g = ctx.createRadialGradient(px, py, 20, px, py, 330);
        g.addColorStop(0, `rgba(255,179,71,${0.20 * glowV})`); g.addColorStop(1, "rgba(255,179,71,0)");
        ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(px - 255, 225, 510, 590, 22); ctx.fill();
      }
      glyph(px, py - 30);
      label(px, 330, name, 44, `rgba(235,240,255,${0.75 + 0.25 * glowV})`);
      label(px, 762, sub, 25, "rgba(165,185,225,0.8)");
    });
    label(cx, 130, "TIGA TELESKOP · SATU TIM", 28, "rgba(170,195,235,0.65)");
  }

  function paintAtmos(t) {
    const cx = X.atmos;
    stars("atmos", cx, t);
    // the Sun, streaming
    const sunX = cx + 790, sunY = 155;
    const sgr = ctx.createRadialGradient(sunX, sunY, 8, sunX, sunY, 200);
    sgr.addColorStop(0, "rgba(255,214,130,0.9)"); sgr.addColorStop(0.25, "rgba(255,170,80,0.35)"); sgr.addColorStop(1, "rgba(255,160,70,0)");
    ctx.fillStyle = sgr; ctx.beginPath(); ctx.arc(sunX, sunY, 200, 0, 7); ctx.fill();
    ctx.fillStyle = "#ffd98c"; ctx.beginPath(); ctx.arc(sunX, sunY, 52, 0, 7); ctx.fill();
    label(sunX, sunY - 105, "MAKSIMUM MATAHARI", 25, "rgba(255,205,130,0.8)");
    // solar wind particles, lanes from the Sun toward the Earth
    const r = rng(77);
    for (let i = 0; i < 42; i++) {
      const lane = r(), off = r() * 260 - 130, sp = 0.05 + r() * 0.05;
      const p = (t * sp + lane) % 1;
      const px = sunX - p * 1150, py = sunY + p * 330 + off * p;
      ctx.fillStyle = `rgba(255,190,110,${(0.55 * (1 - p) * (0.3 + S.swell)).toFixed(3)})`;
      ctx.beginPath(); ctx.arc(px, py, 2.6, 0, 7); ctx.fill();
    }
    // Earth with swelling air bands
    earth(cx, 1990, 1400, 0.5);
    for (let i = 0; i < 3; i++) {
      const rr = 1400 + (26 + i * 30) * (1 + S.swell * 1.15);
      ctx.strokeStyle = `rgba(127,178,255,${0.34 - i * 0.09})`; ctx.lineWidth = 13 + S.swell * 7;
      ctx.beginPath(); ctx.arc(cx, 1990, rr, Math.PI * 1.18, Math.PI * 1.82); ctx.stroke();
    }
    // the sinking spiral (dashed) and Swift upon it
    const pt = (p) => {
      const a = Math.PI * (1.08 + p * 0.85);
      const rr = 1560 - p * 210;
      return [cx + Math.cos(a) * rr * 0.92, 1990 + Math.sin(a) * rr];
    };
    ctx.strokeStyle = "rgba(170,200,250,0.5)"; ctx.lineWidth = 2.5; ctx.setLineDash([9, 9]);
    ctx.beginPath();
    for (let i = 0; i <= 40; i++) { const [px, py] = pt(i / 40); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
    ctx.stroke(); ctx.setLineDash([]);
    const [sx, sy] = pt(S.sinkP);
    satellite(sx, sy, 118, 0.35, S.entryI * (S.sinkP > 0.8 ? 1 : 0.25));
    if (S.entryI > 0.02) { // the limb itself begins to glow where he will enter
      const eg = ctx.createRadialGradient(cx - 420, 615, 20, cx - 420, 615, 330);
      eg.addColorStop(0, `rgba(255,150,70,${0.22 * S.entryI})`); eg.addColorStop(1, "rgba(255,140,60,0)");
      ctx.fillStyle = eg;
      ctx.beginPath(); ctx.arc(cx - 420, 615, 330, 0, 7); ctx.fill();
    }
    label(cx - 1080, 240, "ATMOSFER MENGEBANG", 26, `rgba(170,200,250,${0.4 + 0.55 * S.swell})`, "left");
  }

  function paintChart(t) {
    const cx = X.chart;
    stars("chart", cx, t, 0.55);
    ctx.fillStyle = "rgba(15,22,48,0.78)";
    ctx.strokeStyle = "rgba(127,178,255,0.4)"; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.roundRect(cx - 830, 180, 1660, 720, 20); ctx.fill(); ctx.stroke();
    const gx0 = cx - 700, gx1 = cx + 700, gy0 = 300, gy1 = 800; // plot box; y: 650 km top, 0 bottom
    const Y = (km) => gy1 - (km / 650) * (gy1 - gy0);
    ctx.strokeStyle = "rgba(140,170,230,0.20)"; ctx.lineWidth = 1.5;
    for (const km of [150, 300, 450, 600]) {
      ctx.beginPath(); ctx.moveTo(gx0, Y(km)); ctx.lineTo(gx1, Y(km)); ctx.stroke();
      label(gx0 - 24, Y(km) + 8, String(km), 24, "rgba(165,185,225,0.75)", "right");
    }
    label(gx0 - 120, gy0 - 26, "KETINGGIAN (KM)", 24, "rgba(165,185,225,0.8)", "left");
    label(gx0, gy1 + 52, "2004", 24, "rgba(165,185,225,0.8)", "left");
    label(gx1, gy1 + 52, "2026", 24, "rgba(165,185,225,0.8)", "right");
    label((gx0 + gx1) / 2, gy1 + 52, "TAHUN", 24, "rgba(165,185,225,0.55)");
    // the decay curve: flat for years, then the dive
    const kmAt = (x) => (x <= 0.55 ? 600 - 26 * x : 600 - 26 * x - 345 * Math.pow((x - 0.55) / 0.45, 2.1));
    ctx.strokeStyle = GOLD; ctx.lineWidth = 4.5; ctx.lineCap = "round";
    ctx.beginPath();
    const n = Math.max(2, Math.floor(60 * S.chartP));
    for (let i = 0; i <= n; i++) {
      const x = (i / 60) * Math.min(1, S.chartP * 1.0);
      const px = gx0 + x * (gx1 - gx0), py = Y(Math.max(48, kmAt(x)));
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.stroke();
    if (S.chartP > 0.9) {
      const ex = gx0 + (gx1 - gx0), ey = Y(Math.max(48, kmAt(1)));
      ctx.fillStyle = GOLD; ctx.beginPath(); ctx.arc(ex, ey, 8, 0, 7); ctx.fill();
      label(ex - 12, ey - 30, "275 km · OKT 2026", 27, "rgba(255,205,130,0.95)", "right");
    }
    label(gx0 + 14, Y(600) - 22, "600 km", 26, "rgba(255,205,130,0.9)", "left");
    label(cx, 130, "ORBIT YANG MENURUN", 28, "rgba(170,195,235,0.65)");
  }

  function paintRescue(t) {
    const cx = X.rescue;
    stars("rescue", cx, t, 0.9);
    // Swift, steady, on the left
    const fallY = S.linkFall * 190, fallA = 1 - S.linkFall * 0.85;
    satellite(cx - 430, 520, 170, 0);
    label(cx - 430, 800, "SWIFT", 28, "rgba(170,195,235,0.75)");
    // LINK on the right: spins when spin is up; falls away at the end
    ctx.save(); ctx.globalAlpha = fallA;
    linkCraft(cx + 430, 500 + fallY, 165, t * 2.4 * S.spin + S.linkFall * 0.8, t);
    ctx.restore();
    label(cx + 430, 800 + fallY, "LINK", 28, `rgba(170,195,235,${0.75 * fallA})`);
    if (S.linkFall > 0.03) { // its own small fire, bottom right
      const fx = cx + 430 + S.linkFall * 120, fy = 500 + fallY;
      const g = ctx.createLinearGradient(fx, fy - 60, fx - 40, fy - 260);
      g.addColorStop(0, `rgba(255,170,90,${0.7 * S.linkFall})`); g.addColorStop(1, "rgba(255,140,60,0)");
      ctx.strokeStyle = g; ctx.lineWidth = 13; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(fx - 30, fy - 250); ctx.lineTo(fx, fy - 55); ctx.stroke();
    }
    // the measure between them
    if (S.measure > 0.02) {
      ctx.strokeStyle = `rgba(255,205,130,${0.7 * S.measure})`; ctx.lineWidth = 2.5; ctx.setLineDash([7, 8]);
      ctx.beginPath(); ctx.moveTo(cx - 250, 655); ctx.lineTo(cx + 250, 655); ctx.stroke(); ctx.setLineDash([]);
      label(cx, 705, "12–15 KM", 30, `rgba(255,205,130,${0.9 * S.measure})`);
    }
    if (S.spin > 0.05) label(cx + 430, 240, "BERPUTAR TAK TERKENDALI", 26, `rgba(255,150,110,${0.85 * S.spin})`);
  }

  function paintMap(t) {
    const cx = X.map;
    stars("map", cx, t, 0.5);
    // faint graticule
    ctx.strokeStyle = "rgba(127,178,255,0.13)"; ctx.lineWidth = 1.5;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath(); ctx.moveTo(cx + i * 300, 120); ctx.lineTo(cx + i * 300, 960); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - 780, 540 + i * 190); ctx.lineTo(cx + 780, 540 + i * 190); ctx.stroke();
    }
    // Sumatra, stylised: NW tip up-left, Lampung down-right
    const pts = [[-540, -300], [-330, -338], [-120, -268], [30, -308], [185, -195], [300, -62], [408, 78], [520, 238], [438, 335], [268, 262], [95, 192], [-58, 92], [-208, -8], [-358, -118], [-472, -208]];
    ctx.beginPath();
    pts.forEach(([px, py], i) => { const Xp = cx + px, Yp = 520 + py; i ? ctx.lineTo(Xp, Yp) : ctx.moveTo(Xp, Yp); });
    ctx.closePath();
    ctx.fillStyle = "rgba(90,130,200,0.10)"; ctx.fill();
    ctx.strokeStyle = "rgba(150,190,250,0.85)"; ctx.lineWidth = 3; ctx.stroke();
    label(cx - 560, 130, "SUMATRA", 30, "rgba(170,200,245,0.8)", "left");
    label(cx + 700, 292, "3,4° LU · 98,6° BT", 25, "rgba(170,200,245,0.65)");
    // the re-entry marker, on the north-east coast
    const mx = cx - 30, my = 330;
    const pulse = (t * 0.7) % 1;
    ctx.strokeStyle = `rgba(255,179,71,${0.65 * (1 - pulse)})`; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(mx, my, 14 + pulse * 46, 0, 7); ctx.stroke();
    ctx.fillStyle = GOLD; ctx.beginPath(); ctx.arc(mx, my, 9, 0, 7); ctx.fill();
    label(mx + 30, my - 26, "TITIK MASUK ATMOSFER", 25, "rgba(255,205,130,0.9)", "left");
    // the streak path across the point
    if (S.mapP > 0.01) {
      const x0 = cx - 760, y0 = 205, x1 = cx + 720, y1 = 470;
      const ex = x0 + (x1 - x0) * S.mapP, ey = y0 + (y1 - y0) * S.mapP;
      const g = ctx.createLinearGradient(x0, y0, ex, ey);
      g.addColorStop(0, "rgba(255,160,80,0)"); g.addColorStop(1, "rgba(255,190,105,0.9)");
      ctx.strokeStyle = g; ctx.lineWidth = 7; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(ex, ey); ctx.stroke();
      const hg = ctx.createRadialGradient(ex, ey, 2, ex, ey, 70);
      hg.addColorStop(0, "rgba(255,240,205,0.9)"); hg.addColorStop(1, "rgba(255,160,80,0)");
      ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(ex, ey, 70, 0, 7); ctx.fill();
    }
    // north arrow
    ctx.strokeStyle = "rgba(190,208,240,0.7)"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(cx + 700, 210); ctx.lineTo(cx + 700, 130); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 686, 152); ctx.lineTo(cx + 700, 128); ctx.lineTo(cx + 714, 152); ctx.stroke();
    label(cx + 700, 250, "U", 26, "rgba(190,208,240,0.8)");
  }

  function paintLegacy(t) {
    const cx = X.legacy;
    stars("legacy", cx, t, 1.1);
    label(cx, 150, "ARSIP SWIFT", 34, "rgba(190,208,240,0.85)");
    const cols = 5, rows = 4, w = 268, h = 118, gap = 22;
    const x0 = cx - (cols * w + (cols - 1) * gap) / 2, y0 = 235;
    const total = cols * rows;
    for (let i = 0; i < total; i++) {
      const px = x0 + (i % cols) * (w + gap), py = y0 + Math.floor(i / cols) * (h + gap);
      const on = i < S.archI * total;
      ctx.fillStyle = on ? "rgba(38,44,86,0.9)" : "rgba(16,20,44,0.85)";
      ctx.strokeStyle = on ? "rgba(255,190,105,0.65)" : "rgba(110,135,190,0.30)";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(px, py, w, h, 12); ctx.fill(); ctx.stroke();
      ctx.fillStyle = on ? "rgba(220,230,255,0.55)" : "rgba(160,180,220,0.28)";
      for (let ln = 0; ln < 3; ln++) ctx.fillRect(px + 22, py + 26 + ln * 26, w - 44 - (ln * 37) % 60, 7);
      if (on) {
        ctx.fillStyle = "rgba(255,179,71,0.9)";
        ctx.beginPath(); ctx.arc(px + w - 24, py + 24, 5, 0, 7); ctx.fill();
      }
    }
    if (S.archI > 0.55) {
      const a = Math.min(1, (S.archI - 0.55) / 0.45);
      label(cx - 320, 905, "12 TERABYTE DATA", 30, `rgba(255,205,130,${0.9 * a})`);
      label(cx + 320, 905, "±7.000 MAKALAH", 30, `rgba(255,205,130,${0.9 * a})`);
    }
  }

  const PAINTERS = [
    ["sumatra", paintSumatra], ["orbit", paintOrbit], ["burst", paintBurst], ["panels", paintPanels],
    ["atmos", paintAtmos], ["chart", paintChart], ["rescue", paintRescue], ["map", paintMap], ["legacy", paintLegacy],
  ];

  function paintSky() {
    const g = ctx.createLinearGradient(0, 0, 0, 1080);
    g.addColorStop(0, "#04060f"); g.addColorStop(0.55, "#081026"); g.addColorStop(1, "#05070f");
    ctx.fillStyle = g; ctx.fillRect(0, 0, 1920, 1080);
  }

  function draw(t) {
    paintSky();
    ctx.save();
    ctx.translate(960, 540); ctx.scale(S.cam.z, S.cam.z); ctx.translate(-S.cam.x, -S.cam.y);
    for (const [name, paint] of PAINTERS) {
      if (Math.abs(X[name] - S.cam.x) < 2500) paint(t);
    }
    ctx.restore();
    if (S.fade > 0.01) { ctx.fillStyle = `rgba(3,4,10,${S.fade})`; ctx.fillRect(0, 0, 1920, 1080); }
    if (S.dim > 0.01) { ctx.fillStyle = `rgba(2,3,8,${0.88 * S.dim})`; ctx.fillRect(0, 0, 1920, 1080); }
  }
  return { S, draw };
}
