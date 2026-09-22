/* ═══════════════════════════════════════════════════════════════════
   GENERATIVE ENGINE
   Deterministic, seeded, dependency-free canvas art systems.
   Same seed  →  same artwork, forever.
   ═══════════════════════════════════════════════════════════════════ */

/* ── seeded RNG (mulberry32) ── */
export function hashStr(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rngFor(str) {
  return mulberry32(hashStr(str));
}

/* ── small helpers ── */
const TAU = Math.PI * 2;

function pick(rnd, arr) {
  return arr[Math.floor(rnd() * arr.length) % arr.length];
}

function shuffle(rnd, arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* cheap smooth value noise on a lattice, seeded */
function makeNoise2(rnd) {
  const G = 256;
  const grid = new Float32Array(G * G);
  for (let i = 0; i < G * G; i++) grid[i] = rnd();
  const at = (x, y) => grid[((y % G) + G) % G * G + (((x % G) + G) % G)];
  return function noise(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf);
    const v = yf * yf * (3 - 2 * yf);
    const a = at(xi, yi), b = at(xi + 1, yi), c = at(xi, yi + 1), d = at(xi + 1, yi + 1);
    return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
  };
}

function fbmFactory(noise, octaves = 4) {
  return function fbm(x, y) {
    let v = 0, amp = 0.5, f = 1;
    for (let i = 0; i < octaves; i++) {
      v += amp * noise(x * f, y * f);
      f *= 2.03;
      amp *= 0.5;
    }
    return v;
  };
}

function hexA(hex, alpha) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function bg(ctx, w, h, rnd, C) {
  const g = ctx.createLinearGradient(0, 0, w * (0.3 + rnd() * 0.7), h);
  g.addColorStop(0, "#06030e");
  g.addColorStop(0.55, hexA(pick(rnd, C), 0.1));
  g.addColorStop(1, "#0a0518");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

/* ═══════════════ GENERATOR 1 — FLOW FIELD ═══════════════ */
function flowField(ctx, w, h, rnd, C) {
  bg(ctx, w, h, rnd, C);
  const noise = makeNoise2(rnd);
  const fbm = fbmFactory(noise, 3);
  const scale = 0.0028 + rnd() * 0.0022;
  const N = 1500;
  const cols = shuffle(rnd, C);
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < N; i++) {
    let x = rnd() * w, y = rnd() * h;
    let life = 30 + Math.floor(rnd() * 150);
    const col = cols[i % cols.length];
    const sw = 0.6 + rnd() * 1.9;
    ctx.strokeStyle = hexA(col, 0.055 + rnd() * 0.14);
    ctx.lineWidth = sw;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let s = 0; s < life; s++) {
      const a = fbm(x * scale, y * scale) * TAU * 2.2 + (i / N) * TAU;
      x += Math.cos(a) * 2.1;
      y += Math.sin(a) * 2.1;
      if (x < -20 || x > w + 20 || y < -20 || y > h + 20) break;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.globalCompositeOperation = "source-over";
}

/* ═══════════════ GENERATOR 2 — MOIRÉ INTERFERENCE ═══════════════ */
function moire(ctx, w, h, rnd, C) {
  bg(ctx, w, h, rnd, C);
  const centers = Array.from({ length: 3 + Math.floor(rnd() * 2) }, () => ({
    x: rnd() * w,
    y: rnd() * h,
    f: 5 + rnd() * 12,
    c: pick(rnd, C),
    ph: rnd() * TAU,
  }));
  ctx.globalCompositeOperation = "lighter";
  const maxR = Math.hypot(w, h);
  for (const ct of centers) {
    for (let r = 3; r < maxR; r += ct.f) {
      const alpha = Math.max(0, 0.16 - r / maxR * 0.13);
      if (alpha <= 0.004) continue;
      ctx.strokeStyle = hexA(ct.c, alpha);
      ctx.lineWidth = 1 + (r % (ct.f * 3) < 1 ? 1.6 : 0);
      ctx.beginPath();
      ctx.arc(ct.x, ct.y, r, 0, TAU);
      ctx.stroke();
    }
  }
  ctx.globalCompositeOperation = "source-over";
  // focus nodes
  for (const ct of centers) {
    ctx.fillStyle = hexA(ct.c, 0.9);
    ctx.beginPath();
    ctx.arc(ct.x, ct.y, 2.6, 0, TAU);
    ctx.fill();
  }
}

/* ═══════════════ GENERATOR 3 — WARPED LATTICE ═══════════════ */
function lattice(ctx, w, h, rnd, C) {
  bg(ctx, w, h, rnd, C);
  const noise = makeNoise2(rnd);
  const fbm = fbmFactory(noise, 4);
  const cols = 14 + Math.floor(rnd() * 10);
  const rows = Math.round(cols * (h / w));
  const amp = 12 + rnd() * 34;
  const warp = 0.0016 + rnd() * 0.002;
  const pt = (i, j) => {
    const bx = (i / cols) * w, by = (j / rows) * h;
    const n1 = fbm(bx * warp, by * warp) - 0.5;
    const n2 = fbm(bx * warp + 40, by * warp + 17) - 0.5;
    return [bx + n1 * amp, by + n2 * amp];
  };
  const nodes = shuffle(rnd, C);
  ctx.lineCap = "round";
  for (let j = 0; j <= rows; j++) {
    ctx.strokeStyle = hexA(nodes[j % nodes.length], 0.12 + rnd() * 0.1);
    ctx.lineWidth = 0.7 + rnd() * 0.9;
    ctx.beginPath();
    for (let i = 0; i <= cols; i++) {
      const [x, y] = pt(i, j);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  for (let i = 0; i <= cols; i++) {
    ctx.strokeStyle = hexA(nodes[(i + 2) % nodes.length], 0.1 + rnd() * 0.09);
    ctx.lineWidth = 0.6 + rnd() * 0.8;
    ctx.beginPath();
    for (let j = 0; j <= rows; j++) {
      const [x, y] = pt(i, j);
      j === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  // lit intersections
  ctx.globalCompositeOperation = "lighter";
  for (let k = 0; k < 120; k++) {
    const i = Math.floor(rnd() * (cols + 1));
    const j = Math.floor(rnd() * (rows + 1));
    const [x, y] = pt(i, j);
    const c = nodes[(i + j) % nodes.length];
    ctx.fillStyle = hexA(c, 0.4 + rnd() * 0.5);
    ctx.beginPath();
    ctx.arc(x, y, 0.8 + rnd() * 2.6, 0, TAU);
    ctx.fill();
  }
  ctx.globalCompositeOperation = "source-over";
}

/* ═══════════════ GENERATOR 4 — ORBITAL TRAJECTORIES ═══════════════ */
function orbits(ctx, w, h, rnd, C) {
  bg(ctx, w, h, rnd, C);
  const cx = w * (0.32 + rnd() * 0.36);
  const cy = h * (0.34 + rnd() * 0.32);
  const cols = shuffle(rnd, C);
  const rings = 9 + Math.floor(rnd() * 8);
  ctx.globalCompositeOperation = "lighter";
  for (let r = 0; r < rings; r++) {
    const rad = (0.06 + (r / rings) * 0.52) * Math.min(w, h);
    const ecc = 0.55 + rnd() * 0.7;
    const rot = rnd() * TAU;
    const col = cols[r % cols.length];
    const steps = 200 + Math.floor(rnd() * 260);
    const trailStart = rnd() * TAU;
    ctx.lineWidth = 0.5 + rnd() * 1.4;
    for (let s = 0; s < steps; s++) {
      const t0 = trailStart + (s / steps) * TAU * (1 + rnd() * 0.02);
      const t1 = trailStart + ((s + 1) / steps) * TAU * 1.0;
      const a0 = t0 * ecc + rot, a1 = t1 * ecc + rot;
      const p0 = [cx + Math.cos(a0) * rad, cy + Math.sin(a0) * rad * 0.62];
      const p1 = [cx + Math.cos(a1) * rad, cy + Math.sin(a1) * rad * 0.62];
      ctx.strokeStyle = hexA(col, (1 - s / steps) * 0.2);
      ctx.beginPath();
      ctx.moveTo(p0[0], p0[1]);
      ctx.lineTo(p1[0], p1[1]);
      ctx.stroke();
    }
    // node
    const na = trailStart * ecc + rot;
    const nx = cx + Math.cos(na) * rad, ny = cy + Math.sin(na) * rad * 0.62;
    ctx.fillStyle = hexA(col, 0.85);
    ctx.beginPath();
    ctx.arc(nx, ny, 1.4 + rnd() * 2.4, 0, TAU);
    ctx.fill();
  }
  // attractor
  ctx.fillStyle = hexA("#ffffff", 0.9);
  ctx.beginPath();
  ctx.arc(cx, cy, 2.4, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = hexA(cols[0], 0.34);
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.arc(cx, cy, 22, 0, TAU);
  ctx.stroke();
  ctx.globalCompositeOperation = "source-over";
}

/* ═══════════════ GENERATOR 5 — HALFTONE FIELD ═══════════════ */
function halftone(ctx, w, h, rnd, C) {
  bg(ctx, w, h, rnd, C);
  const noise = makeNoise2(rnd);
  const fbm = fbmFactory(noise, 4);
  const step = 9 + Math.floor(rnd() * 7);
  const scale = 0.004 + rnd() * 0.006;
  const cols = shuffle(rnd, C);
  const fx = w * (0.2 + rnd() * 0.6), fy = h * (0.2 + rnd() * 0.6);
  ctx.globalCompositeOperation = "lighter";
  for (let y = step / 2; y < h; y += step) {
    for (let x = step / 2; x < w; x += step) {
      const n = fbm(x * scale, y * scale);
      const d = Math.min(1, Math.hypot(x - fx, y - fy) / (Math.hypot(w, h) * 0.55));
      const v = Math.max(0, n * (1.15 - d * 0.5));
      const r = v * step * 0.62;
      if (r < 0.35) continue;
      const c = cols[Math.floor((1 - v) * cols.length) % cols.length];
      ctx.fillStyle = hexA(c, 0.1 + v * 0.5);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.fill();
    }
  }
  ctx.globalCompositeOperation = "source-over";
}

/* ═══════════════ GENERATOR 6 — STRATA / BARCODE ═══════════════ */
function strata(ctx, w, h, rnd, C) {
  bg(ctx, w, h, rnd, C);
  const noise = makeNoise2(rnd);
  const cols = shuffle(rnd, C);
  let y = 0, i = 0;
  ctx.globalCompositeOperation = "lighter";
  while (y < h) {
    const bh = 3 + Math.pow(rnd(), 2.4) * 34;
    const c = cols[i % cols.length];
    const n = noise(i * 1.7, 3.1);
    const g = ctx.createLinearGradient(0, y, w, y + bh);
    g.addColorStop(0, hexA(c, 0.02 + n * 0.3));
    g.addColorStop(0.5 + rnd() * 0.4, hexA(c, 0.06 + n * 0.34));
    g.addColorStop(1, hexA(c, 0.01));
    ctx.fillStyle = g;
    ctx.fillRect(0, y, w, bh * (0.5 + rnd() * 0.5));
    // ticks
    const tickCount = Math.floor(rnd() * 26);
    for (let t = 0; t < tickCount; t++) {
      const tx = rnd() * w;
      ctx.fillStyle = hexA(pick(rnd, C), 0.1 + rnd() * 0.45);
      ctx.fillRect(tx, y, 0.6 + rnd() * 1.4, bh * (0.3 + rnd() * 0.7));
    }
    y += bh;
    i++;
  }
  // floating discs
  for (let k = 0; k < 22; k++) {
    const r = 3 + rnd() * 22;
    ctx.strokeStyle = hexA(pick(rnd, C), 0.14 + rnd() * 0.3);
    ctx.lineWidth = 0.8 + rnd() * 1.5;
    ctx.beginPath();
    ctx.arc(rnd() * w, rnd() * h, r, 0, TAU);
    ctx.stroke();
  }
  ctx.globalCompositeOperation = "source-over";
}

/* ═══════════════ GENERATOR 7 — SHARD MOSAIC ═══════════════ */
function shards(ctx, w, h, rnd, C) {
  bg(ctx, w, h, rnd, C);
  const cols = shuffle(rnd, C);
  const cx = w * (0.3 + rnd() * 0.4), cy = h * (0.3 + rnd() * 0.4);
  const N = 46 + Math.floor(rnd() * 40);
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < N; i++) {
    const a0 = rnd() * TAU;
    const spread = 0.18 + rnd() * 1.05;
    const r0 = 10 + rnd() * Math.hypot(w, h) * 0.5;
    const r1 = r0 + 12 + rnd() * 90;
    const p = [];
    const segs = 3 + Math.floor(rnd() * 3);
    for (let s = 0; s <= segs; s++) {
      const a = a0 + (spread * s) / segs;
      p.push([cx + Math.cos(a) * r1, cy + Math.sin(a) * r1]);
    }
    for (let s = segs; s >= 0; s--) {
      const a = a0 + (spread * s) / segs;
      p.push([cx + Math.cos(a) * r0, cy + Math.sin(a) * r0]);
    }
    const c = cols[i % cols.length];
    const g = ctx.createLinearGradient(p[0][0], p[0][1], cx, cy);
    g.addColorStop(0, hexA(c, 0.02));
    g.addColorStop(1, hexA(c, 0.16 + rnd() * 0.2));
    ctx.fillStyle = g;
    ctx.strokeStyle = hexA(c, 0.24 + rnd() * 0.3);
    ctx.lineWidth = 0.6 + rnd() * 0.8;
    ctx.beginPath();
    p.forEach(([x, y], k) => (k === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = hexA("#fff", 0.85);
  ctx.beginPath();
  ctx.arc(cx, cy, 1.8, 0, TAU);
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";
}

/* ═══════════════ GENERATOR 8 — SPIRAL DUST ═══════════════ */
function spiral(ctx, w, h, rnd, C) {
  bg(ctx, w, h, rnd, C);
  const cx = w / 2, cy = h / 2;
  const arms = 2 + Math.floor(rnd() * 4);
  const cols = shuffle(rnd, C);
  const maxR = Math.hypot(w, h) * 0.55;
  ctx.globalCompositeOperation = "lighter";
  const N = 5200;
  for (let i = 0; i < N; i++) {
    const t = Math.pow(rnd(), 0.62);
    const arm = Math.floor(rnd() * arms);
    const a = t * 7.5 + (arm / arms) * TAU + Math.sin(t * 9) * 0.22;
    const jitter = (rnd() - 0.5) * (14 + t * 58);
    const r = t * maxR;
    const x = cx + Math.cos(a) * r + jitter;
    const y = cy + Math.sin(a) * r * 0.78 + jitter * 0.6;
    const c = cols[(arm + Math.floor(t * cols.length)) % cols.length];
    ctx.fillStyle = hexA(c, (1 - t) * 0.3 + 0.03);
    const s = 0.5 + rnd() * 2.1 * (1 - t * 0.55);
    ctx.fillRect(x, y, s, s);
  }
  // core glow
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 0.4);
  g.addColorStop(0, hexA(cols[0], 0.5));
  g.addColorStop(1, hexA(cols[0], 0));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = "source-over";
}

export const GENERATORS = [flowField, moire, lattice, orbits, halftone, strata, shards, spiral];
export const GENERATOR_NAMES = [
  "FLOW FIELD", "MOIRÉ", "WARPED LATTICE", "ORBITAL",
  "HALFTONE", "STRATA", "SHARD MOSAIC", "SPIRAL DUST",
];

/* ── public: paint one poster into a canvas ── */
export function paintPoster(canvas, seedStr, colors, variant) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(1, Math.round((rect.width || canvas.width) * dpr));
  const h = Math.max(1, Math.round((rect.height || canvas.height) * dpr));
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  const rnd = rngFor(seedStr);
  const idx = variant != null ? variant % GENERATORS.length : Math.floor(rnd() * GENERATORS.length);
  ctx.save();
  try {
    GENERATORS[idx](ctx, w, h, rnd, colors);
  } catch (e) {
    /* never let art break the page */
    ctx.fillStyle = "#0a0518";
    ctx.fillRect(0, 0, w, h);
  }
  ctx.restore();
  // glass sheen
  ctx.globalCompositeOperation = "source-over";
  const sheen = ctx.createLinearGradient(0, 0, w, h);
  sheen.addColorStop(0, "rgba(255,255,255,0.06)");
  sheen.addColorStop(0.4, "rgba(255,255,255,0)");
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, w, h);
  return GENERATOR_NAMES[idx];
}

/* ── the 6-colour system used across the site ── */
export const C6 = ["#F6D68D", "#46E0C8", "#9B4DEE", "#FE4773", "#4D8BFF", "#CBF24D"];

export function colorsFor(accentKey) {
  const map = {
    gold: ["#F6D68D", "#FE4773", "#9B4DEE", "#4D8BFF"],
    teal: ["#46E0C8", "#4D8BFF", "#9B4DEE", "#CBF24D"],
    violet: ["#9B4DEE", "#4D8BFF", "#FE4773", "#F6D68D"],
    coral: ["#FE4773", "#F6D68D", "#9B4DEE", "#46E0C8"],
    cobalt: ["#4D8BFF", "#46E0C8", "#9B4DEE", "#FE4773"],
    lime: ["#CBF24D", "#46E0C8", "#F6D68D", "#4D8BFF"],
  };
  return map[accentKey] || C6;
}
