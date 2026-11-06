'use strict';
// Tri de perles : chaque case a un fond (la couleur de l'image). Toucher une zone envoie
// ses perles mal placées dans les emplacements du bas ; de là, elles rejoignent seules
// les cases vides de leur couleur.

const CAP = 9;        // perles par emplacement (3×3)
const SLOTS = 6;      // emplacements de départ (+1 en bonus, une fois par niveau)

// ---------- Images ----------

const ARTS = [
  { name: 'Cœur', pal: { '.': '#f3e7c9', r: '#e5484d', d: '#a8282e', w: '#fbfbf8' }, rows: [
    '................',
    '................',
    '...rrr....rrr...',
    '..rrrrr..rrrrr..',
    '.rrwwrrrrrrrrrr.',
    '.rrwrrrrrrrrrrr.',
    '.rrrrrrrrrrrrrr.',
    '.rrrrrrrrrrrrdr.',
    '..rrrrrrrrrrdr..',
    '...rrrrrrrrdr...',
    '....rrrrrrdr....',
    '.....rrrrdr.....',
    '......rrdr......',
    '.......rr.......',
    '................',
    '................'] },
  { name: 'Champignon', pal: { '.': '#8ec9ef', r: '#e5484d', w: '#fbfbf8', c: '#f3e7c9', k: '#3f3f46', g: '#5aa84a' }, rows: [
    '................',
    '.....rrrrrr.....',
    '...rrwwrrrrrr...',
    '..rrwwwrrwwrrr..',
    '.rrrwwrrrwwwrrr.',
    '.rrrrrrrrrwwrrr.',
    'rrwwrrrrrrrrrwwr',
    'rwwwrrrwwrrrrwwr',
    'rrwwrrwwwwrrrrrr',
    '.rrrrrrwwrrrrrr.',
    '....cccccccc....',
    '....cckcckcc....',
    '....cccccccc....',
    '....cccccccc....',
    '.....cccccc.....',
    'gggggggggggggggg'] },
  { name: 'Chat', pal: { '.': '#8ec9ef', o: '#f0a830', p: '#f2a0b5', w: '#fbfbf8', k: '#3f3f46' }, rows: [
    '................',
    '.oo..........oo.',
    '.ooo........ooo.',
    '.opoo......oopo.',
    '.oppooooooooppo.',
    '.oooooooooooooo.',
    '.oowkkoooookkwoo',
    '.oookkoooookkoo.',
    '.oooooooooooooo.',
    '.ooooooppoooooo.',
    '.oooowwkkwwoooo.',
    '.ooowwwwwwwwooo.',
    '..oowwwwwwwwoo..',
    '...oooooooooo...',
    '................',
    '................'] },
  { name: 'Maison', pal: { s: '#8ec9ef', c: '#fbfbf8', y: '#f5cf4a', r: '#e5484d', w: '#f3e7c9', n: '#8a5a3b', g: '#5aa84a' }, rows: [
    'ssssssssssssssss',
    'sscccsssssssyyss',
    'scccccssssssyyss',
    'sssssssrrsssssss',
    'ssssssrrrrssssss',
    'sssssrrrrrrsssss',
    'ssssrrrrrrrrssss',
    'sssrrrrrrrrrrsss',
    'ssrrrrrrrrrrrrss',
    'sssswwwwwwwwssss',
    'sssswyywwnnwssss',
    'sssswyywwnnwssss',
    'sssswwwwwnnwssss',
    'gggggggggggggggg',
    'gggggggggggggggg',
    'gggggggggggggggg'] },
];

const LANDSCAPES = [
  { name: 'Vallée', sky: '#8ec9ef', top: '#5b9fd6', sun: '#f5cf4a', mnt: '#7d8299', snow: '#fbfbf8', hill: '#5aa84a', hill2: '#3d7f3a', ground: '#8a5a3b' },
  { name: 'Couchant', sky: '#f0a830', top: '#e5484d', sun: '#f9e27a', mnt: '#7d5ba6', snow: '#f2a0b5', hill: '#4a4a52', hill2: '#2f2f36', ground: '#a8282e' },
  { name: 'Nuit', sky: '#2f4c7a', top: '#1f2f52', sun: '#f3e7c9', mnt: '#5b6c8f', snow: '#d9e3f0', hill: '#2f6c5a', hill2: '#1f4a3f', ground: '#3f3f46' },
];

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function fromHexGrid(name, w, h, hexAt) {
  const colors = [], index = new Map(), target = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const hex = hexAt(x, y);
    if (!index.has(hex)) { index.set(hex, colors.length); colors.push(hex); }
    target.push(index.get(hex));
  }
  return { name, w, h, colors, target };
}

function artImage(art) {
  const w = Math.max(...art.rows.map(r => r.length)), h = art.rows.length;
  const bg = Object.keys(art.pal)[0];
  return fromHexGrid(art.name, w, h, (x, y) => art.pal[art.rows[y][x]] || art.pal[bg]);
}

function landscapeImage(n) {
  const rng = mulberry32(9973 * n + 17), P = LANDSCAPES[n % LANDSCAPES.length];
  const W = 20, H = 20;
  const sx = 3 + rng() * 14, sy = 2.5 + rng() * 2.5, sr = 1.8 + rng() * 1.2;
  const p1 = rng() * 6, p2 = rng() * 6, p3 = rng() * 6;
  const mnt = x => 8.5 + 2.5 * Math.sin(x * 0.45 + p1) + 1.4 * Math.sin(x * 0.95 + p2);
  const hill = x => 13 + 1.3 * Math.sin(x * 0.33 + p3);
  return fromHexGrid(P.name, W, H, (x, y) => {
    const m = mnt(x), hl = hill(x);
    if (y >= 17) return P.ground;
    if (y >= hl + 2) return P.hill2;
    if (y >= hl) return P.hill;
    if (y >= m) return (y < m + 1.4 && m < 8.2) ? P.snow : P.mnt;
    if (Math.hypot(x + 0.5 - sx, y + 0.5 - sy) < sr) return P.sun;
    return y < 5 ? P.top : P.sky;
  });
}

function levelImage(n) {
  return n < ARTS.length ? artImage(ARTS[n]) : landscapeImage(n);
}

// ---------- Génération du niveau ----------

function partition(w, h, rng) {
  const out = [];
  (function split(x, y, bw, bh) {
    const area = bw * bh;
    if ((area > 28 || (area > 12 && rng() < 0.45)) && (bw >= 4 || bh >= 4)) {
      const vert = bw > bh ? true : bw < bh ? false : rng() < 0.5;
      if (vert && bw >= 4) { const c = 2 + Math.floor(rng() * (bw - 3)); split(x, y, c, bh); split(x + c, y, bw - c, bh); return; }
      if (!vert && bh >= 4) { const c = 2 + Math.floor(rng() * (bh - 3)); split(x, y, bw, c); split(x, y + c, bw, bh - c); return; }
    }
    out.push({ x, y, w: bw, h: bh });
  })(0, 0, w, h);
  return out;
}

function scramble(img, blocks, keep, rng) {
  const bead = img.target.slice(), nc = img.colors.length;
  const mixed = blocks.filter(() => rng() >= keep);
  for (let i = mixed.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [mixed[i], mixed[j]] = [mixed[j], mixed[i]]; }
  const pool = new Array(nc).fill(0);
  for (const b of mixed) for (const i of b) pool[img.target[i]]++;
  const best = (avoid) => {
    let c = -1;
    for (let k = 0; k < nc; k++) if (pool[k] > 0 && k !== avoid && (c < 0 || pool[k] > pool[c])) c = k;
    return c;
  };
  for (const b of mixed) {
    const count = new Array(nc).fill(0);
    for (const i of b) count[img.target[i]]++;
    const dom = count.indexOf(Math.max(...count));
    let cur = best(dom);
    for (const i of b) {
      if (cur < 0 || pool[cur] === 0) cur = best(dom);
      let c = cur;
      if (c < 0 || c === img.target[i]) c = best(img.target[i]);
      if (c < 0) c = best(-1);
      bead[i] = c; pool[c]--;
    }
  }
  return bead;
}

function makeState(img, rects, bead) {
  const blockOf = new Array(img.w * img.h), blocks = [];
  rects.forEach((r, b) => {
    const cells = [];
    for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) { cells.push(y * img.w + x); blockOf[y * img.w + x] = b; }
    blocks.push(cells);
  });
  return {
    img, rects, blocks, blockOf, target: img.target, bead: bead.slice(),
    nSlots: SLOTS, slotColor: new Array(SLOTS + 1).fill(-1), slotN: new Array(SLOTS + 1).fill(0),
  };
}

function clone(st) {
  return Object.assign({}, st, { bead: st.bead.slice(), slotColor: st.slotColor.slice(), slotN: st.slotN.slice() });
}

// ---------- Règles ----------

function slotFor(st, c) {
  for (let s = 0; s < st.nSlots; s++) if (st.slotN[s] > 0 && st.slotColor[s] === c && st.slotN[s] < CAP) return s;
  for (let s = 0; s < st.nSlots; s++) if (st.slotN[s] === 0) return s;
  return -1;
}

function pull(st, b) {
  const moves = [];
  for (const i of st.blocks[b]) {
    const c = st.bead[i];
    if (c < 0 || c === st.target[i]) continue;
    const s = slotFor(st, c);
    if (s < 0) continue;
    st.slotColor[s] = c; st.bead[i] = -1;
    moves.push({ cell: i, slot: s, k: st.slotN[s]++, color: c });
  }
  return moves;
}

function flow(st) {
  const moves = [];
  for (let s = 0; s < st.nSlots; s++) {
    if (!st.slotN[s]) continue;
    const c = st.slotColor[s];
    for (let i = 0; i < st.bead.length && st.slotN[s] > 0; i++) {
      if (st.bead[i] < 0 && st.target[i] === c) { st.bead[i] = c; moves.push({ cell: i, slot: s, k: --st.slotN[s], color: c }); }
    }
    if (!st.slotN[s]) st.slotColor[s] = -1;
  }
  return moves;
}

const misplaced = (st, i) => st.bead[i] >= 0 && st.bead[i] !== st.target[i];
const solved = st => st.bead.every((c, i) => c === st.target[i]);
const correctCount = st => st.bead.reduce((n, c, i) => n + (c === st.target[i]), 0);

function canPull(st) {
  for (let i = 0; i < st.bead.length; i++) if (misplaced(st, i) && slotFor(st, st.bead[i]) >= 0) return true;
  return false;
}

// Bot glouton : sert à vérifier qu'un niveau généré est faisable avec 6 emplacements.
function botSolve(st0, rng, tries) {
  for (let t = 0; t < tries; t++) {
    const st = clone(st0);
    for (let step = 0; step < 1000; step++) {
      if (solved(st)) return true;
      let bestB = -1, bestScore = -Infinity;
      for (let b = 0; b < st.blocks.length; b++) {
        if (!st.blocks[b].some(i => misplaced(st, i))) continue;
        const c = clone(st);
        if (!pull(c, b).length) continue;
        flow(c);
        let used = 0, beads = 0;
        for (let s = 0; s < c.nSlots; s++) if (c.slotN[s]) { used++; beads += c.slotN[s]; }
        const score = -used * 10 - beads * 0.5 + (t ? rng() * 8 : 0);
        if (score > bestScore) { bestScore = score; bestB = b; }
      }
      if (bestB < 0) break;
      pull(st, bestB); flow(st);
    }
  }
  return false;
}

function buildLevel(n) {
  const img = levelImage(n);
  let st = null;
  for (let attempt = 0; attempt < 60; attempt++) {
    const rng = mulberry32(n * 1000 + attempt + 1);
    const keep = Math.min(0.7, 0.1 + Math.floor(attempt / 8) * 0.1);
    const rects = partition(img.w, img.h, rng);
    const tmp = makeState(img, rects, img.target);
    st = makeState(img, rects, scramble(img, tmp.blocks, keep, rng));
    if (!solved(st) && botSolve(st, rng, 10)) return st;
  }
  return st;
}

if (typeof module !== 'undefined') module.exports = { buildLevel, pull, flow, solved, canPull, botSolve, clone, ARTS };

// ---------- Interface ----------

if (typeof document !== 'undefined') (function () {
  const canvas = document.getElementById('jeu'), ctx = canvas.getContext('2d');
  const $ = id => document.getElementById(id);
  let level = +(localStorage.getItem('triperles.niveau') || 0);
  let initial, st, bonusUsed, busy = false;
  let flights = [], hiddenCells = new Set(), incoming = [], flash = null, dirty = true;
  let L = {}; // géométrie

  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    let r = n >> 16, g = n >> 8 & 255, b = n & 255;
    const t = f < 0 ? 0 : 255, a = Math.abs(f);
    r = Math.round(r + (t - r) * a); g = Math.round(g + (t - g) * a); b = Math.round(b + (t - b) * a);
    return `rgb(${r},${g},${b})`;
  }

  function rr(x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  function drawBead(x, y, s, hex) {
    rr(x, y, s, s, s * 0.3);
    ctx.fillStyle = hex; ctx.fill();
    ctx.lineWidth = Math.max(1, s * 0.09); ctx.strokeStyle = shade(hex, -0.3); ctx.stroke();
    ctx.fillStyle = shade(hex, 0.55); ctx.globalAlpha = 0.7;
    ctx.beginPath(); ctx.ellipse(x + s * 0.34, y + s * 0.3, s * 0.16, s * 0.1, -0.5, 0, 7); ctx.fill();
    ctx.globalAlpha = 1;
  }

  function layout() {
    const img = st.img, dpr = window.devicePixelRatio || 1;
    const W = Math.min(window.innerWidth - 16, 520);
    const cell = Math.floor(W / img.w), bw = cell * img.w, bh = cell * img.h;
    const n = st.nSlots, gap = Math.max(6, Math.round(bw * 0.02));
    const slot = Math.min(Math.floor((bw - gap * (n - 1)) / n), 90);
    const trayW = slot * n + gap * (n - 1);
    L = { cell, bw, bh, gap, slot, trayX: Math.round((bw - trayW) / 2), trayY: bh + 26, H: bh + 26 + slot + 8 };
    canvas.width = bw * dpr; canvas.height = L.H * dpr;
    canvas.style.width = bw + 'px'; canvas.style.height = L.H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    dirty = true;
  }

  const cellXY = i => ({ x: (i % st.img.w) * L.cell, y: Math.floor(i / st.img.w) * L.cell });
  function slotBeadXY(s, k) {
    const sx = L.trayX + s * (L.slot + L.gap), pad = L.slot * 0.1, d = (L.slot - 2 * pad) / 3;
    return { x: sx + pad + (k % 3) * d + d * 0.08, y: L.trayY + pad + Math.floor(k / 3) * d + d * 0.08, s: d * 0.84 };
  }

  function draw(now) {
    const img = st.img, c = L.cell;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < st.bead.length; i++) {
      const { x, y } = cellXY(i), bg = img.colors[st.target[i]];
      ctx.fillStyle = bg; ctx.fillRect(x, y, c, c);
      const b = st.bead[i];
      if (b >= 0 && !hiddenCells.has(i)) drawBead(x + c * 0.1, y + c * 0.1, c * 0.8, img.colors[b]);
      else { ctx.fillStyle = shade(bg, -0.25); ctx.beginPath(); ctx.arc(x + c / 2, y + c / 2, c * 0.16, 0, 7); ctx.fill(); }
    }
    // contours des zones encore à trier
    ctx.lineWidth = 2;
    st.rects.forEach((r, b) => {
      const done = st.blocks[b].every(i => st.bead[i] === st.target[i]);
      if (done) return;
      ctx.strokeStyle = flash && flash.b === b ? 'rgba(229,72,77,0.95)' : 'rgba(40,40,60,0.55)';
      ctx.lineWidth = flash && flash.b === b ? 4 : 2;
      ctx.strokeRect(r.x * c + 1, r.y * c + 1, r.w * c - 2, r.h * c - 2);
    });
    // plateau d'emplacements
    for (let s = 0; s < st.nSlots; s++) {
      const sx = L.trayX + s * (L.slot + L.gap);
      rr(sx, L.trayY, L.slot, L.slot, L.slot * 0.14);
      ctx.fillStyle = s === SLOTS ? '#fff7d6' : '#fbfbfd'; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = flash && flash.tray ? '#e5484d' : '#c9cbd8'; ctx.stroke();
      const shown = st.slotN[s] - (incoming[s] || 0);
      for (let k = 0; k < CAP; k++) {
        const p = slotBeadXY(s, k);
        if (k < shown) drawBead(p.x, p.y, p.s, img.colors[st.slotColor[s]]);
        else { rr(p.x, p.y, p.s, p.s, p.s * 0.3); ctx.fillStyle = '#e4e5ee'; ctx.fill(); }
      }
    }
    // perles en vol
    for (const f of flights) {
      const t = Math.min(1, Math.max(0, (now - f.t0) / f.dur));
      if (t <= 0) continue;
      const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const x = f.x0 + (f.x1 - f.x0) * e, y = f.y0 + (f.y1 - f.y0) * e - Math.sin(Math.PI * t) * 30;
      const s = f.s0 + (f.s1 - f.s0) * e;
      drawBead(x, y, s, img.colors[f.color]);
    }
  }

  function loop(now) {
    if (flash && now > flash.until) { flash = null; dirty = true; }
    if (flights.length) {
      const landed = flights.filter(f => now >= f.t0 + f.dur);
      if (landed.length) {
        flights = flights.filter(f => now < f.t0 + f.dur);
        for (const f of landed) f.land();
      }
      dirty = true;
    }
    if (dirty || flights.length) { draw(now); dirty = false; }
    requestAnimationFrame(loop);
  }

  function animate(moves, toTray, done) {
    if (!moves.length) { done(); return; }
    const now = performance.now(), c = L.cell;
    let left = moves.length;
    moves.forEach((m, j) => {
      const cp = cellXY(m.cell), sp = slotBeadXY(m.slot, m.k);
      const a = { x: cp.x + c * 0.1, y: cp.y + c * 0.1, s: c * 0.8 }, b = sp;
      const from = toTray ? a : b, to = toTray ? b : a;
      if (toTray) incoming[m.slot] = (incoming[m.slot] || 0) + 1; else hiddenCells.add(m.cell);
      flights.push({
        color: m.color, x0: from.x, y0: from.y, s0: from.s, x1: to.x, y1: to.y, s1: to.s,
        t0: now + Math.min(j * 14, 300), dur: 340,
        land() {
          if (toTray) incoming[m.slot]--; else hiddenCells.delete(m.cell);
          if (--left === 0) done();
        },
      });
    });
  }

  function updateHud() {
    const pct = Math.floor(100 * correctCount(st) / st.bead.length);
    $('barre').style.width = pct + '%'; $('pct').textContent = pct + ' %';
    $('titre').textContent = `Niveau ${level + 1} · ${st.img.name}`;
    $('bonus').disabled = bonusUsed;
  }

  function message(text, buttons) {
    $('msg-texte').textContent = text;
    const box = $('msg-boutons'); box.innerHTML = '';
    for (const [label, fn] of buttons) {
      const b = document.createElement('button'); b.textContent = label;
      b.onclick = () => { $('msg').hidden = true; fn(); };
      box.appendChild(b);
    }
    $('msg').hidden = false;
  }

  function checkEnd() {
    updateHud();
    if (solved(st)) {
      localStorage.setItem('triperles.niveau', level + 1);
      setTimeout(() => message('Bravo, image terminée !', [['Niveau suivant', () => startLevel(level + 1)]]), 350);
    } else if (!canPull(st)) {
      const btns = [];
      if (!bonusUsed) btns.push(['+1 emplacement', addSlot]);
      btns.push(['Recommencer', restart]);
      message('Plus de place dans les emplacements…', btns);
    }
  }

  function tap(ev) {
    if (busy) return;
    const r = canvas.getBoundingClientRect(), x = ev.clientX - r.left, y = ev.clientY - r.top;
    if (x < 0 || y < 0 || x >= L.bw || y >= L.bh) return;
    const i = Math.floor(y / L.cell) * st.img.w + Math.floor(x / L.cell), b = st.blockOf[i];
    if (!st.blocks[b].some(j => misplaced(st, j))) return;
    const moves = pull(st, b);
    if (!moves.length) { flash = { b, tray: true, until: performance.now() + 350 }; dirty = true; navigator.vibrate && navigator.vibrate(40); return; }
    busy = true;
    animate(moves, true, () => {
      updateHud();
      animate(flow(st), false, () => { busy = false; dirty = true; checkEnd(); });
    });
  }

  function addSlot() {
    if (bonusUsed) return;
    bonusUsed = true; st.nSlots = SLOTS + 1;
    layout(); updateHud();
  }

  function restart() {
    st = clone(initial); st.nSlots = SLOTS; st.slotColor = initial.slotColor.slice(); st.slotN = initial.slotN.slice();
    bonusUsed = false; flights = []; hiddenCells.clear(); incoming = []; busy = false;
    $('msg').hidden = true;
    layout(); updateHud();
  }

  function startLevel(n) {
    level = n; localStorage.setItem('triperles.niveau', n);
    initial = buildLevel(n);
    restart();
  }

  window.triPerlesEtat = () => st; // pour les tests
  canvas.addEventListener('pointerdown', tap);
  $('bonus').onclick = addSlot;
  $('recommencer').onclick = () => { if (!busy) restart(); };
  $('precedent').onclick = () => { if (!busy && level > 0) startLevel(level - 1); };
  window.addEventListener('resize', () => st && layout());
  startLevel(level);
  requestAnimationFrame(loop);
})();
