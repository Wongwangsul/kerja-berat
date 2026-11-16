// "Every Door Is Different" — the world, drawn on one canvas. Four sets stand along one
// wide world: the teaching hall (x≈0), the worshipper's mountain (x≈3000), the plain of
// five doors (x≈6000) and the waking city (x≈9000). film.js only moves the camera and the
// state; every figure is a silhouette in deep indigo, and all light is the same amber-gold.
export function createWorld(canvas, shots) {
  const ctx = canvas.getContext("2d");
  const S = {
    cam: { x: 0, y: 545, z: 1 },
    letter: 0, bird: -1, studentsDim: 0, vision: 0, scatter: 0,
    umariBow: 0, umariPros: 0, umariSit: 0,
    chain: 0, carry: -1,
    doorGlow: [0, 0, 0, 0, 0], arc: 0, d1bow: 0, d1pros: 0,
    cityLit: 0.06, doorCity: 0, doorFigure: 0,
    split: 0, seam: 0, dim: 0, dawn: 0, fade: 0,
  };
  const FIG = "#15152e", FIG2 = "#1b1b3a", PAPER = "#e9dfc4", GOLD = "#ffb347";

  // ── figures ────────────────────────────────────────────────────────────────
  function rim(x, y, r) {
    ctx.strokeStyle = "rgba(255,179,71,0.30)"; ctx.lineWidth = r * 0.16;
    ctx.beginPath(); ctx.arc(x, y, r, -2.4, -0.7); ctx.stroke();
  }
  function figStand(x, y, s, col = FIG) {
    ctx.fillStyle = col;
    ctx.beginPath(); // robe: hem wide, shoulders narrow, one smooth silhouette
    ctx.moveTo(x - 0.16 * s, y);
    ctx.quadraticCurveTo(x - 0.15 * s, y - 0.45 * s, x - 0.105 * s, y - 0.70 * s);
    ctx.quadraticCurveTo(x, y - 0.78 * s, x + 0.105 * s, y - 0.70 * s);
    ctx.quadraticCurveTo(x + 0.15 * s, y - 0.45 * s, x + 0.16 * s, y);
    ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.arc(x, y - 0.865 * s, 0.088 * s, 0, 7); ctx.fill();
    rim(x, y - 0.865 * s, 0.088 * s);
  }
  function figSit(x, y, s, col = FIG) {
    ctx.fillStyle = col;
    ctx.beginPath(); // crossed-leg base
    ctx.moveTo(x - 0.31 * s, y);
    ctx.quadraticCurveTo(x - 0.30 * s, y - 0.20 * s, x - 0.10 * s, y - 0.22 * s);
    ctx.lineTo(x + 0.10 * s, y - 0.22 * s);
    ctx.quadraticCurveTo(x + 0.30 * s, y - 0.20 * s, x + 0.31 * s, y);
    ctx.closePath(); ctx.fill();
    ctx.beginPath(); // torso
    ctx.moveTo(x - 0.115 * s, y - 0.20 * s);
    ctx.quadraticCurveTo(x - 0.12 * s, y - 0.50 * s, x - 0.09 * s, y - 0.60 * s);
    ctx.quadraticCurveTo(x, y - 0.66 * s, x + 0.09 * s, y - 0.60 * s);
    ctx.quadraticCurveTo(x + 0.12 * s, y - 0.50 * s, x + 0.115 * s, y - 0.20 * s);
    ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.arc(x, y - 0.735 * s, 0.09 * s, 0, 7); ctx.fill();
    rim(x, y - 0.735 * s, 0.09 * s);
  }
  function figTeach(x, y, s, col = FIG) {
    figSit(x, y, s, col);
    ctx.save(); ctx.translate(x + 0.20 * s, y - 0.40 * s); ctx.rotate(-0.10);
    ctx.fillStyle = PAPER; ctx.fillRect(-0.15 * s, -0.10 * s, 0.30 * s, 0.20 * s);
    ctx.fillStyle = "rgba(20,20,40,0.55)"; ctx.fillRect(-0.008 * s, -0.10 * s, 0.016 * s, 0.20 * s);
    ctx.restore();
    ctx.strokeStyle = col; ctx.lineWidth = 0.045 * s; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(x + 0.08 * s, y - 0.52 * s); ctx.lineTo(x + 0.13 * s, y - 0.42 * s); ctx.stroke();
  }
  function figBow(x, y, s, col = FIG) {
    // Ruku': back level as a table, head a fraction below the back's line, arms straight
    // down to the knees, legs straight. (Checked against the pray-yourself pose gate.)
    ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineCap = "round";
    ctx.lineWidth = 0.105 * s; // legs
    ctx.beginPath(); ctx.moveTo(x - 0.10 * s, y); ctx.lineTo(x - 0.06 * s, y - 0.50 * s); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 0.06 * s, y); ctx.lineTo(x + 0.05 * s, y - 0.50 * s); ctx.stroke();
    ctx.lineWidth = 0.17 * s; // the level back, hips to shoulders
    ctx.beginPath(); ctx.moveTo(x - 0.16 * s, y - 0.55 * s); ctx.lineTo(x + 0.24 * s, y - 0.57 * s); ctx.stroke();
    ctx.lineWidth = 0.05 * s; // arms, straight to the knees
    ctx.beginPath(); ctx.moveTo(x + 0.20 * s, y - 0.55 * s); ctx.lineTo(x + 0.06 * s, y - 0.08 * s); ctx.stroke();
    ctx.beginPath(); ctx.arc(x + 0.335 * s, y - 0.475 * s, 0.088 * s, 0, 7); ctx.fill(); // head, below the line
    rim(x + 0.335 * s, y - 0.475 * s, 0.088 * s);
  }
  function figProstrate(x, y, s, col = FIG) {
    // Sujud: forehead and nose to the ground, hands flat beside the head, back rising to
    // the hips, knees folded under, feet back with toes bent.
    ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineCap = "round";
    ctx.lineWidth = 0.15 * s; // the rising back: shoulders to hips
    ctx.beginPath(); ctx.moveTo(x + 0.26 * s, y - 0.10 * s); ctx.lineTo(x - 0.16 * s, y - 0.36 * s); ctx.stroke();
    ctx.lineWidth = 0.11 * s; // thighs down to the folded knees
    ctx.beginPath(); ctx.moveTo(x - 0.16 * s, y - 0.36 * s); ctx.lineTo(x - 0.24 * s, y - 0.04 * s); ctx.stroke();
    ctx.lineWidth = 0.07 * s; // shins along the ground, feet back
    ctx.beginPath(); ctx.moveTo(x - 0.24 * s, y - 0.03 * s); ctx.lineTo(x - 0.46 * s, y - 0.03 * s); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 0.46 * s, y - 0.03 * s); ctx.lineTo(x - 0.47 * s, y - 0.12 * s); ctx.stroke();
    ctx.lineWidth = 0.05 * s; // forearm flat on the ground beside the head
    ctx.beginPath(); ctx.moveTo(x + 0.24 * s, y - 0.09 * s); ctx.lineTo(x + 0.44 * s, y - 0.02 * s); ctx.stroke();
    ctx.beginPath(); ctx.arc(x + 0.335 * s, y - 0.075 * s, 0.082 * s, 0, 7); ctx.fill(); // forehead down
  }
  function prayerFigure(x, y, s, bow, pros, sit) {
    const aStand = 1 - Math.max(bow, pros, sit);
    if (aStand > 0.01) { ctx.globalAlpha = aStand; figStand(x, y, s); }
    if (bow > 0.01) { ctx.globalAlpha = bow * (1 - pros); figBow(x, y, s); }
    if (pros > 0.01) { ctx.globalAlpha = pros; figProstrate(x, y, s); }
    if (sit > 0.01) { ctx.globalAlpha = sit; figSit(x, y, s); }
    ctx.globalAlpha = 1;
  }
  function lamp(x, y, s, glow, t) {
    const fl = 1 + Math.sin(t * 7 + x) * 0.05;
    if (glow > 0.02) {
      const g = ctx.createRadialGradient(x, y - 0.5 * s, 4, x, y - 0.5 * s, s * 2.3 * glow);
      g.addColorStop(0, "rgba(255,179,71,0.50)"); g.addColorStop(1, "rgba(255,179,71,0)");
      ctx.fillStyle = g; ctx.fillRect(x - s * 2.4, y - 0.5 * s - s * 2.4, s * 4.8, s * 4.8);
    }
    ctx.strokeStyle = "rgba(230,220,255,0.5)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x, y - 0.62 * s); ctx.stroke();
    ctx.fillStyle = "#0e0e22"; ctx.fillRect(x - 0.05 * s, y - 0.05 * s, 0.10 * s, 0.05 * s);
    ctx.fillStyle = `rgba(255,${185 + Math.round(30 * fl)},90,${0.35 + 0.65 * glow})`;
    ctx.beginPath(); ctx.ellipse(x, y - 0.38 * s, 0.13 * s, 0.24 * s * fl, 0, 0, 7); ctx.fill();
  }
  function doorFrame(x, floorY, w, h, glow) {
    const top = floorY - h;
    if (glow > 0.02) { // light spilling out onto the ground
      const g = ctx.createRadialGradient(x, floorY - h * 0.45, 10, x, floorY - h * 0.45, w * 1.5);
      g.addColorStop(0, `rgba(255,179,71,${0.42 * glow})`); g.addColorStop(1, "rgba(255,179,71,0)");
      ctx.fillStyle = g; ctx.fillRect(x - w * 1.5, floorY - h, w * 3, h + 160);
      ctx.fillStyle = `rgba(255,190,90,${0.30 * glow})`;
      ctx.beginPath(); ctx.ellipse(x, floorY + 14, w * 0.85, 26, 0, 0, 7); ctx.fill();
    }
    ctx.beginPath();
    ctx.moveTo(x - w / 2, floorY); ctx.lineTo(x - w / 2, top + w / 2);
    ctx.arc(x, top + w / 2, w / 2, Math.PI, 0);
    ctx.lineTo(x + w / 2, floorY); ctx.closePath();
    const ig = ctx.createLinearGradient(0, top, 0, floorY);
    ig.addColorStop(0, `rgba(255,196,100,${0.16 + 0.62 * glow})`);
    ig.addColorStop(1, `rgba(255,160,60,${0.10 + 0.45 * glow})`);
    ctx.fillStyle = ig; ctx.fill();
    ctx.strokeStyle = "rgba(255,205,120,0.85)"; ctx.lineWidth = 7; ctx.stroke();
  }

  // ── sets ───────────────────────────────────────────────────────────────────
  function paintMajelis(t) {
    const wall = ctx.createLinearGradient(0, 40, 0, 900);
    wall.addColorStop(0, "#1d1d42"); wall.addColorStop(1, "#12122a");
    ctx.fillStyle = wall; ctx.fillRect(-1500, 40, 3000, 870);
    ctx.strokeStyle = "rgba(169,139,255,0.28)"; ctx.lineWidth = 7;
    for (const cx of [-640, 0, 640]) {
      ctx.beginPath();
      ctx.moveTo(cx - 235, 900); ctx.lineTo(cx - 235, 430);
      ctx.arc(cx, 430, 235, Math.PI, 0);
      ctx.lineTo(cx + 235, 900); ctx.stroke();
    }
    ctx.fillStyle = "#0c0c1e"; ctx.fillRect(-1500, 900, 3000, 180);
    ctx.fillStyle = "rgba(255,179,71,0.05)"; ctx.fillRect(-1500, 900, 3000, 10);
    for (const [lx, ly] of [[-430, 300], [0, 258], [430, 300]]) lamp(lx, ly + 120, 58, 0.85, t);
    const nChain = Math.round(S.chain * 6);
    for (let i = 0; i < nChain; i++) lamp(-760 + i * 250, 470, 40, 0.9, t + i);
    // students: a ring of seated figures, dimmed or scattered by the state
    const studs = [[-580, 918, 200], [-315, 934, 216], [315, 934, 216], [580, 918, 200], [800, 928, 182]];
    ctx.globalAlpha = 1 - 0.78 * Math.max(S.studentsDim, S.scatter * 0.9);
    for (const [sx, sy, ss] of studs) {
      const ox = S.scatter * (sx > 0 ? 130 : -130), oy = S.scatter * 26;
      figSit(sx + ox, sy + oy, ss, FIG2);
    }
    ctx.globalAlpha = 1;
    figTeach(0, 908, 345);
    // the low table, the book, and the letter when it has landed
    ctx.fillStyle = "#23233f"; ctx.fillRect(215, 862, 190, 16);
    ctx.fillStyle = PAPER; ctx.fillRect(238, 838, 66, 26);
    if (S.letter > 0.01) {
      ctx.save(); ctx.translate(345, 850); ctx.rotate(-0.07); ctx.globalAlpha = S.letter;
      ctx.fillStyle = "#f2e8cd"; ctx.fillRect(-62, -42, 124, 84);
      ctx.strokeStyle = "rgba(90,70,30,0.6)"; ctx.lineWidth = 2;
      for (let i = -1; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-46, i * 18); ctx.lineTo(46, i * 18); ctx.stroke(); }
      ctx.restore(); ctx.globalAlpha = 1;
    }
    lamp(-330, 884, 96, 1, t);
    if (S.carry >= 0) { // a student carrying the light out of the hall
      const cx = 120 + S.carry * 1050;
      figStand(cx, 930, 235, FIG2);
      lamp(cx + 52, 800, 44, 1, t);
    }
  }

  function paintMountain(t) {
    ctx.fillStyle = "#0f0f24";
    ctx.beginPath();
    ctx.moveTo(1750, 1080); ctx.lineTo(2050, 720); ctx.lineTo(2480, 645); ctx.lineTo(2880, 725);
    ctx.lineTo(3300, 555); ctx.lineTo(3720, 665); ctx.lineTo(4250, 590); ctx.lineTo(4250, 1080);
    ctx.closePath(); ctx.fill();
    for (let i = 0; i < 26; i++) { // the world he left: a field of tiny lights far below
      const vx = 1980 + ((i * 173) % 620), vy = 985 + ((i * 37) % 55);
      ctx.fillStyle = "rgba(255,196,110,0.5)"; ctx.fillRect(vx, vy, 5, 5);
    }
    // the hut and its one lamp
    ctx.fillStyle = "#181832"; ctx.fillRect(3480, 690, 250, 185);
    ctx.beginPath(); ctx.moveTo(3455, 690); ctx.lineTo(3605, 610); ctx.lineTo(3755, 690); ctx.closePath(); ctx.fill();
    lamp(3605, 800, 52, 0.95, t);
    // the rug on the ledge, and the worshipper upon it
    ctx.fillStyle = "rgba(255,179,71,0.20)"; ctx.fillRect(2725, 866, 340, 16);
    ctx.strokeStyle = "rgba(255,179,71,0.45)"; ctx.lineWidth = 2; ctx.strokeRect(2725, 866, 340, 16);
    prayerFigure(2895, 868, 305, S.umariBow, S.umariPros, S.umariSit);
    lamp(3160, 866, 62, 1, t);
    if (S.letter > 0.01 && S.split > 0) { /* the reply, in his hands when split */ }
  }

  const DOORX = [5140, 5570, 6000, 6430, 6860];
  function paintDoors(t) {
    ctx.fillStyle = "#101024"; ctx.fillRect(4800, 905, 2400, 175);
    ctx.fillStyle = "rgba(255,179,71,0.06)"; ctx.fillRect(4800, 905, 2400, 8);
    if (S.arc > 0.01) {
      ctx.strokeStyle = `rgba(255,196,100,${0.30 * S.arc})`; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(DOORX[0], 330);
      ctx.quadraticCurveTo(6000, 130, DOORX[4], 330); ctx.stroke();
    }
    DOORX.forEach((dx, i) => {
      const g = S.doorGlow[i];
      doorFrame(dx, 910, 300, 565, 0.12 + 0.88 * g);
      ctx.globalAlpha = 0.25 + 0.75 * g;
      if (i === 0) {
        ctx.fillStyle = "rgba(255,179,71,0.16)"; ctx.fillRect(dx - 70, 884, 140, 12);
        prayerFigure(dx, 888, 252, S.d1bow, S.d1pros, 0);
      } else if (i === 1) {
        figSit(dx - 20, 892, 238);
        ctx.fillStyle = PAPER; ctx.beginPath(); ctx.ellipse(dx + 88, 878, 34, 12, 0, 0, 7); ctx.fill();
      } else if (i === 2) {
        figStand(dx - 55, 892, 250);
        ctx.fillStyle = "#8a6a3a"; ctx.fillRect(dx + 6, 700, 52, 40);
        ctx.fillStyle = FIG2; ctx.fillRect(dx + 92, 640, 12, 252);
      } else if (i === 3) {
        figTeach(dx - 58, 894, 228);
        figStand(dx + 112, 894, 148, FIG2);
      } else {
        figStand(dx - 72, 892, 250);
        ctx.save(); ctx.translate(dx + 62, 892); ctx.rotate(0.16);
        figStand(0, 0, 222, FIG2); ctx.restore();
        ctx.strokeStyle = FIG; ctx.lineWidth = 7; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(dx + 108, 690); ctx.lineTo(dx + 128, 888); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    });
  }

  function paintCity(t) {
    ctx.fillStyle = "#d9d4c5"; ctx.beginPath(); ctx.arc(9680, 175, 52, 0, 7); ctx.fill();
    ctx.fillStyle = "#12122b";
    ctx.beginPath();
    ctx.moveTo(7750, 930);
    const roofs = [[7750, 800], [7950, 800], [7950, 740], [8200, 740], [8200, 810], [8500, 810], [8500, 700], [8620, 700], [8620, 620], [8680, 540], [8740, 620], [8740, 700], [8900, 700], [8900, 790], [9250, 790], [9250, 720], [9560, 720], [9560, 800], [9900, 800], [9900, 745], [10150, 745], [10150, 930]];
    for (const [x, y] of roofs) ctx.lineTo(x, y);
    ctx.lineTo(10150, 930); ctx.closePath(); ctx.fill();
    for (let gx = 0; gx < 18; gx++) for (let gy = 0; gy < 3; gy++) {
      const h = ((gx * 31 + gy * 57) % 100) / 100;
      if (h < S.cityLit) {
        const wx = 7860 + gx * 128 + (gy % 2) * 44, wy = 800 + gy * 52;
        ctx.fillStyle = "rgba(255,183,71,0.92)"; ctx.fillRect(wx, wy, 15, 19);
      }
    }
    ctx.fillStyle = "#0b0b1c"; ctx.fillRect(7750, 930, 2400, 150);
    if (S.doorCity > 0.01) {
      doorFrame(9000, 952, 245, 435, S.doorCity);
      ctx.globalAlpha = S.doorFigure; figStand(9000, 950, 252); ctx.globalAlpha = 1;
    }
  }

  // ── frame ──────────────────────────────────────────────────────────────────
  function paintSky() {
    const g = ctx.createLinearGradient(0, 0, 0, 1080);
    const d = S.dawn;
    g.addColorStop(0, d > 0.5 ? "#232040" : "#0a0a24");
    g.addColorStop(0.62, d > 0.5 ? "#3a2c50" : "#141436");
    g.addColorStop(1, d > 0.03 ? "#8a5a44" : "#241d3d");
    ctx.fillStyle = g; ctx.fillRect(0, 0, 1920, 1080);
    ctx.fillStyle = `rgba(255,255,255,${0.75 * (1 - d)})`;
    for (let i = 0; i < 90; i++) {
      const sx = (i * 389) % 1920, sy = (i * 271) % 430;
      ctx.fillRect(sx, sy, i % 5 === 0 ? 3 : 2, i % 5 === 0 ? 3 : 2);
    }
  }
  function drawWorld(cx, screenCx, z, t) {
    ctx.save();
    ctx.translate(screenCx, 540); ctx.scale(z, z); ctx.translate(-cx, -S.cam.y);
    paintMajelis(t); paintMountain(t); paintDoors(t); paintCity(t);
    ctx.restore();
  }
  function draw(t) {
    paintSky();
    if (S.split > 0.02) {
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, 960, 1080); ctx.clip();
      drawWorld(3000, 480, 0.94, t); ctx.restore();
      ctx.save(); ctx.beginPath(); ctx.rect(960, 0, 960, 1080); ctx.clip();
      drawWorld(0, 1440, 0.94, t); ctx.restore();
      if (S.seam > 0.01) {
        const g = ctx.createLinearGradient(0, 0, 0, 1080);
        g.addColorStop(0, "rgba(255,196,100,0)"); g.addColorStop(0.5, `rgba(255,196,100,${0.75 * S.seam})`);
        g.addColorStop(1, "rgba(255,196,100,0)");
        ctx.fillStyle = g; ctx.fillRect(958, 0, 4, 1080);
      }
    } else {
      drawWorld(S.cam.x, 960, S.cam.z, t);
    }
    if (S.bird >= 0) {
      const bx = -120 + S.bird * 2160, by = 300 - Math.sin(S.bird * Math.PI) * 130;
      ctx.strokeStyle = "#0a0a1e"; ctx.lineWidth = 7; ctx.lineCap = "round";
      const w = Math.sin(t * 9) * 12;
      ctx.beginPath(); ctx.moveTo(bx - 34, by + w); ctx.quadraticCurveTo(bx - 8, by - 14, bx, by);
      ctx.quadraticCurveTo(bx + 8, by - 14, bx + 34, by + w); ctx.stroke();
      ctx.fillStyle = "#f2e8cd"; ctx.fillRect(bx - 7, by + 8, 14, 20);
    }
    if (S.vision > 0.01) {
      ctx.fillStyle = `rgba(88,76,180,${0.12 * S.vision})`; ctx.fillRect(0, 0, 1920, 1080);
      ctx.strokeStyle = `rgba(205,195,255,${0.55 * S.vision})`; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.roundRect(105, 84, 1710, 912, 26); ctx.stroke();
      ctx.strokeStyle = `rgba(205,195,255,${0.25 * S.vision})`;
      ctx.beginPath(); ctx.roundRect(121, 100, 1678, 880, 20); ctx.stroke();
    }
    if (S.fade > 0.01) { ctx.fillStyle = `rgba(4,4,12,${S.fade})`; ctx.fillRect(0, 0, 1920, 1080); }
    if (S.dim > 0.01) { ctx.fillStyle = `rgba(3,3,10,${0.88 * S.dim})`; ctx.fillRect(0, 0, 1920, 1080); }
  }
  return { S, draw };
}
