import { useEffect, useMemo, useRef, useState } from "react";
import { C6, colorsFor } from "../generative/core.js";

/* ═══════════════════════════════════════════════════════════════════
   COLLATZ ORACLE — the research made interactive.
   ORBIT mode   : the 3n+1 trajectory of n rendered as a rotatable helix
   DISTRIBUTION : empirical stopping-time histogram for 2..N with the
                  log-normal density fitted to the same samples.
   ═══════════════════════════════════════════════════════════════════ */

function orbitOf(n) {
  const seq = [n];
  let cur = n;
  let guard = 0;
  while (cur !== 1 && guard++ < 20000) {
    cur = cur % 2 === 0 ? cur / 2 : 3 * cur + 1;
    seq.push(cur);
  }
  return seq;
}

function stoppingTimes(M) {
  const st = new Float64Array(M + 1);
  const big = new Map(); // memo for intermediate values above M
  for (let i = 2; i <= M; i++) {
    let cur = i;
    let steps = 0;
    while (cur !== 1) {
      if (cur <= M && st[cur] > 0) {
        steps += st[cur];
        break;
      }
      if (cur > M) {
        const hit = big.get(cur);
        if (hit != null) {
          steps += hit;
          break;
        }
      }
      cur = cur % 2 === 0 ? cur / 2 : 3 * cur + 1;
      steps++;
    }
    st[i] = steps;
  }
  return st;
}

function fitLogNormal(samples) {
  const n = samples.length;
  if (!n) return { mu: 0, sigma: 0 };
  const logs = samples.map((v) => Math.log(v));
  const mu = logs.reduce((a, b) => a + b, 0) / n;
  const varr = logs.reduce((a, b) => a + (b - mu) * (b - mu), 0) / n;
  return { mu, sigma: Math.sqrt(Math.max(varr, 1e-9)) };
}

const FOV = 4.6;

const MODES = [
  { id: "orbit", label: "ORBIT" },
  { id: "dist", label: "DISTRIBUTION" },
];

const QUICK = [
  { n: 27, tag: "111 steps · the rebel" },
  { n: 97, tag: "118 steps" },
  { n: 703, tag: "170 steps" },
  { n: 6171, tag: "261 steps" },
  { n: 77031, tag: "350 steps · record < 1e5" },
];

export default function CollatzOracle() {
  const [n, setN] = useState(27);
  const [draft, setDraft] = useState("27");
  const [mode, setMode] = useState("orbit");
  const [M, setM] = useState(2000);

  const orbit = useMemo(() => orbitOf(n), [n]);
  const peak = useMemo(() => orbit.reduce((a, b) => Math.max(a, b), 0), [orbit]);
  const st = orbit.length - 1;

  const dist = useMemo(() => {
    const times = stoppingTimes(M);
    const samples = [];
    for (let i = 2; i <= M; i++) if (times[i] > 0) samples.push(times[i]);
    const { mu, sigma } = fitLogNormal(samples);
    const lo = Math.min(...samples, 1);
    const hi = Math.max(...samples, 2);
    const BINS = 44;
    const a = Math.log(lo), b = Math.log(hi), w = (b - a) / BINS;
    const bins = new Array(BINS).fill(0);
    for (const s of samples) {
      let idx = Math.floor((Math.log(s) - a) / w);
      if (idx < 0) idx = 0;
      if (idx >= BINS) idx = BINS - 1;
      bins[idx]++;
    }
    const maxCount = Math.max(...bins, 1);
    const pdf = (x) =>
      (1 / (x * sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-Math.pow(Math.log(x) - mu, 2) / (2 * sigma * sigma));
    /* residual between the empirical density and the fitted density */
    let err = 0;
    let c = 0;
    for (let i = 0; i < BINS; i++) {
      const x = Math.exp(a + (i + 0.5) * w);
      const emp = bins[i] / samples.length / w;
      const fit = pdf(x);
      err += Math.pow(emp - fit, 2);
      c++;
    }
    const rms = Math.sqrt(err / Math.max(c, 1));
    const meanDensity = samples.length ? 1 / Math.max(...bins, 1) : 0;
    return {
      bins, a, w, BINS, mu, sigma, maxCount, pdf, rms, samples: samples.length,
      lo, hi,
      median: samples.length ? samples.slice().sort((x, y) => x - y)[Math.floor(samples.length / 2)] : 0,
      meanDensity,
    };
  }, [M]);

  const wrap = useRef(null);
  const canvas = useRef(null);
  const st3d = useRef({ yaw: 0.55, pitch: -0.16, dragging: false, lx: 0, ly: 0, idle: 0, w: 0, h: 0 });

  useEffect(() => {
    const holder = wrap.current;
    const el = canvas.current;
    if (!holder || !el) return;
    const ctx = el.getContext("2d");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cos = C6;
    let raf = 0;
    let visible = true;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = holder.clientWidth;
      const h = holder.clientHeight;
      const s = st3d.current;
      s.w = w; s.h = h;
      el.width = Math.max(1, Math.round(w * dpr));
      el.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const project = (x, y, z, s) => {
      const cY = Math.cos(s.yaw), sY = Math.sin(s.yaw);
      const cX = Math.cos(s.pitch), sX = Math.sin(s.pitch);
      const x1 = x * cY - z * sY;
      const z1 = x * sY + z * cY;
      const y2 = y * cX - z1 * sX;
      const z2 = y * sX + z1 * cX;
      const k = FOV / (FOV + z2);
      const scale = Math.min(s.w, s.h) * 0.19;
      return [s.w / 2 + x1 * k * scale, s.h / 2 - y2 * k * scale, k, z2];
    };

    const colAt = (t) => {
      const x = Math.max(0, Math.min(1, t)) * (cos.length - 1);
      const i = Math.floor(x);
      const j = Math.min(cos.length - 1, i + 1);
      return mixHex(cos[i], cos[j], x - i);
    };

    const draw = () => {
      const s = st3d.current;
      if (!s.w || !s.h) return;
      if (!s.dragging) {
        s.idle++;
        if (s.idle > 60) s.yaw += reduced ? 0 : 0.0032;
      }
      ctx.clearRect(0, 0, s.w, s.h);

      /* ground grid for spatial reference */
      ctx.save();
      ctx.strokeStyle = "rgba(166,138,217,0.10)";
      ctx.lineWidth = 1;
      for (let i = -3; i <= 3; i++) {
        const a = project(i * 1.02, -1.72, -1.6, s);
        const b = project(i * 1.02, -1.72, 1.6, s);
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
        const c = project(-3 * 1.02, -1.72, i * 0.55, s);
        const d = project(3 * 1.02, -1.72, i * 0.55, s);
        ctx.beginPath(); ctx.moveTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); ctx.stroke();
      }
      ctx.restore();

      if (mode === "orbit") {
        const steps = orbit.length;
        const logPeak = Math.log2(peak + 1);
        const pts = orbit.map((v, i) => {
          const a = i * 0.46 + Math.log2(n + 1) * 0.5;
          const r = 0.55 + 1.25 * (Math.log2(v + 1) / Math.max(logPeak, 1));
          const y = -1.55 + (i / Math.max(steps - 1, 1)) * 3.1;
          return { x: Math.cos(a) * r, y, z: Math.sin(a) * r, v, i };
        });
        const proj = pts.map((p) => ({ p, s: project(p.x, p.y, p.z, s) }));

        /* trajectory segments */
        for (let i = 0; i < proj.length - 1; i++) {
          const A = proj[i], B = proj[i + 1];
          const t = i / Math.max(proj.length - 2, 1);
          ctx.strokeStyle = colAt(t * 0.92);
          ctx.globalAlpha = 0.25 + 0.6 * ((A.s[2] + B.s[2]) / 2 - 0.55);
          ctx.lineWidth = 0.7 + 1.5 * (A.s[2] - 0.6);
          ctx.beginPath();
          ctx.moveTo(A.s[0], A.s[1]);
          ctx.lineTo(B.s[0], B.s[1]);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;

        /* step nodes (sampled for very long orbits) */
        const stride = steps > 260 ? 3 : 1;
        for (let i = 0; i < proj.length; i += stride) {
          const { p, s: q } = proj[i];
          const isPeak = p.v === peak;
          const isEnd = i === proj.length - 1;
          const r = (isPeak ? 4.2 : isEnd ? 3.4 : 1.5) * q[2];
          const c = isEnd ? "#CBF24D" : isPeak ? "#FE4773" : colAt(i / Math.max(proj.length - 1, 1) * 0.9);
          ctx.fillStyle = c;
          ctx.beginPath();
          ctx.arc(q[0], q[1], Math.max(r, 0.8), 0, Math.PI * 2);
          ctx.fill();
          if (isPeak || isEnd) {
            ctx.strokeStyle = hexA(c, 0.6);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(q[0], q[1], r * 2.6, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
        /* labels */
        const pIdx = orbit.indexOf(peak);
        const labelAt = (idx, text, colr) => {
          const q = project(pts[idx].x, pts[idx].y, pts[idx].z, s);
          ctx.font = '400 10px "JetBrains Mono", monospace';
          ctx.fillStyle = colr;
          ctx.globalAlpha = 0.9;
          ctx.fillText(text, q[0] + 9, q[1] + 3.5);
          ctx.globalAlpha = 1;
        };
        labelAt(0, `n = ${n}`, "rgba(246,214,141,0.95)");
        if (pIdx > 0) labelAt(pIdx, `peak ${peak.toLocaleString()}`, "rgba(254,71,115,0.95)");
        labelAt(proj.length - 1, "1 — attractor", "rgba(203,242,77,0.95)");

        /* axis caption */
        ctx.font = '400 9px "JetBrains Mono", monospace';
        ctx.fillStyle = "rgba(166,138,217,0.55)";
        ctx.fillText("STEP 0", 12, 18);
        ctx.fillText(`STEP ${steps - 1}`, 12, s.h - 12);
      } else {
        /* ── distribution mode ── */
        const { bins, BINS, maxCount, pdf, a, w, samples } = dist;
        const bars = [];
        for (let i = 0; i < BINS; i++) {
          const t = i / (BINS - 1);
          const x = -2.9 + t * 5.8;
          const hgt = (bins[i] / maxCount) * 3.0;
          bars.push({ x, hgt, t, count: bins[i] });
        }
        /* ghost mirror histogram behind */
        for (const b of bars) {
          const A = project(b.x, -1.72, -0.95, s);
          const B = project(b.x, -1.72 + b.hgt * 0.9, -0.95, s);
          ctx.strokeStyle = hexA("#4D8BFF", 0.16);
          ctx.lineWidth = 6 * A[2];
          ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke();
        }
        /* 3D bars: front face + top face + side face */
        for (let i = 0; i < bars.length; i++) {
          const b = bars[i];
          const depth = 0.26;
          const x0 = b.x;
          const x1 = b.x + (5.8 / BINS) * 0.82;
          const y0 = -1.72;
          const y1 = -1.72 + Math.max(b.hgt, 0.012);
          const c = colAt(b.t);
          const corners = [
            project(x0, y0, 0, s), project(x0, y1, 0, s), project(x1, y1, 0, s), project(x1, y0, 0, s),
          ];
          const back = [
            project(x0, y0, depth, s), project(x0, y1, depth, s), project(x1, y1, depth, s), project(x1, y0, depth, s),
          ];
          /* side face */
          ctx.fillStyle = hexA(c, 0.3);
          ctx.beginPath();
          ctx.moveTo(corners[2][0], corners[2][1]);
          ctx.lineTo(back[2][0], back[2][1]);
          ctx.lineTo(back[1][0], back[1][1]);
          ctx.lineTo(corners[1][0], corners[1][1]);
          ctx.closePath();
          ctx.fill();
          /* top face */
          ctx.fillStyle = hexA(c, 0.5);
          ctx.beginPath();
          ctx.moveTo(corners[1][0], corners[1][1]);
          ctx.lineTo(back[1][0], back[1][1]);
          ctx.lineTo(back[2][0], back[2][1]);
          ctx.lineTo(corners[2][0], corners[2][1]);
          ctx.closePath();
          ctx.fill();
          /* front face */
          const g = ctx.createLinearGradient(corners[0][0], corners[0][1], corners[1][0], corners[1][1]);
          g.addColorStop(0, hexA(c, 0.16));
          g.addColorStop(1, hexA(c, 0.78));
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.moveTo(corners[0][0], corners[0][1]);
          ctx.lineTo(corners[1][0], corners[1][1]);
          ctx.lineTo(corners[2][0], corners[2][1]);
          ctx.lineTo(corners[3][0], corners[3][1]);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = hexA(c, 0.55);
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
        /* fitted log-normal density — expected count per bin, same scale as bars */
        ctx.beginPath();
        let started = false;
        for (let i = 0; i <= 180; i++) {
          const t = i / 180;
          const xv = Math.exp(a + t * (w * BINS));
          const expected = samples * w * pdf(xv);
          const yv = -1.72 + Math.min((expected / maxCount) * 3.0, 3.6);
          const sx = -2.9 + t * 5.8;
          const q = project(sx, yv, 0.34, s);
          if (!started) {
            ctx.moveTo(q[0], q[1]);
            started = true;
          } else ctx.lineTo(q[0], q[1]);
        }
        ctx.strokeStyle = "rgba(255,255,255,0.20)";
        ctx.lineWidth = 5;
        ctx.stroke();
        ctx.strokeStyle = "rgba(255,255,255,0.94)";
        ctx.lineWidth = 1.7;
        ctx.stroke();

        ctx.font = '400 10px "JetBrains Mono", monospace';
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.fillText(`log-normal fit  μ=${dist.mu.toFixed(2)}  σ=${dist.sigma.toFixed(2)}`, 12, 18);
        ctx.fillStyle = "rgba(166,138,217,0.6)";
        ctx.fillText(`stopping times · n = 2 … ${M}  (${samples} samples)`, 12, s.h - 12);
      }
    };

    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (!visible || document.hidden) return;
      draw();
    };
    raf = requestAnimationFrame(loop);

    const onDown = (e) => {
      const s = st3d.current;
      s.dragging = true;
      s.idle = 0;
      s.lx = e.clientX;
      s.ly = e.clientY;
      el.setPointerCapture && el.setPointerCapture(e.pointerId);
    };
    const onMove = (e) => {
      const s = st3d.current;
      if (!s.dragging) return;
      s.yaw += (e.clientX - s.lx) * 0.007;
      s.pitch = Math.max(-0.85, Math.min(0.85, s.pitch + (e.clientY - s.ly) * 0.005));
      s.lx = e.clientX;
      s.ly = e.clientY;
      s.idle = 0;
    };
    const onUp = () => {
      st3d.current.dragging = false;
      st3d.current.idle = 0;
    };
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("pointerleave", onUp);

    let ro;
    if ("ResizeObserver" in window) {
      ro = new ResizeObserver(resize);
      ro.observe(holder);
    } else window.addEventListener("resize", resize);
    let io;
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.02 });
      io.observe(holder);
    }

    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("pointerleave", onUp);
      if (ro) ro.disconnect();
      else window.removeEventListener("resize", resize);
      if (io) io.disconnect();
    };
  }, [mode, orbit, peak, n, dist, M]);

  const commit = (val) => {
    const v = Math.max(1, Math.min(999999, Math.floor(Number(val) || 1)));
    setN(v);
    setDraft(String(v));
  };

  return (
    <div className="oracle">
      <div className="oracle-ctl">
        <div className="oracle-in">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
            onKeyDown={(e) => e.key === "Enter" && commit(draft)}
            inputMode="numeric"
            aria-label="Starting value n for the Collatz orbit"
          />
          <button onClick={() => commit(draft)}>Run</button>
        </div>
        <div className="quickn">
          {QUICK.map((q) => (
            <button key={q.n} onClick={() => commit(q.n)} title={q.tag}>
              {q.n.toLocaleString()}
            </button>
          ))}
        </div>
        <div className="quickn">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              style={
                mode === m.id
                  ? { color: "var(--gold)", borderColor: "var(--gold)", background: "rgba(246,214,141,0.08)" }
                  : undefined
              }
            >
              {m.label}
            </button>
          ))}
          {mode === "dist"
            ? [500, 2000, 8000].map((v) => (
                <button key={v} onClick={() => setM(v)} style={M === v ? { color: "var(--teal)", borderColor: "var(--teal)" } : undefined}>
                  n≤{v}
                </button>
              ))
            : null}
        </div>

        <div className="oracle-out">
          {mode === "orbit" ? (
            <>
              <div><span className="k">Stopping time</span><span className="v">{st} steps</span></div>
              <div><span className="k">Peak value</span><span className="v">{peak.toLocaleString()}</span></div>
              <div><span className="k">Peak / n</span><span className="v">{(peak / n).toFixed(1)}×</span></div>
              <div><span className="k">log₂ n</span><span className="v">{Math.log2(n).toFixed(3)}</span></div>
              <div><span className="k">Orbit length</span><span className="v">{orbit.length}</span></div>
            </>
          ) : (
            <>
              <div><span className="k">Samples</span><span className="v">{dist.samples.toLocaleString()}</span></div>
              <div><span className="k">μ (ln)</span><span className="v">{dist.mu.toFixed(4)}</span></div>
              <div><span className="k">σ (ln)</span><span className="v">{dist.sigma.toFixed(4)}</span></div>
              <div><span className="k">Median ST</span><span className="v">{dist.median}</span></div>
              <div><span className="k">Range ST</span><span className="v">{dist.lo}–{dist.hi}</span></div>
              <div><span className="k">Fit residual (RMS)</span><span className="v">{dist.rms.toExponential(3)}</span></div>
            </>
          )}
        </div>

        <p className="oracle-note">
          {mode === "orbit"
            ? "Each node is one step of 3n+1. Radius encodes log₂ of the current value, height encodes step index — so the orbit's excursions into its tail are literally the widest turns of the helix."
            : "Bars are the empirical stopping-time histogram; the white curve is the log-normal density fitted to the same samples. Drag to rotate the field."}
        </p>
      </div>

      <div className="oracle-stage" ref={wrap}>
        <canvas ref={canvas} aria-label="Interactive 3D Collatz visualisation — drag to rotate" role="img" />
        <div className="oracle-hint">drag to rotate · runs locally, no data leaves the page</div>
      </div>
    </div>
  );
}

/* ── tiny colour helpers ── */
function hexA(hex, a) {
  const n = parseInt(hex.replace("#", ""), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
function mixHex(a, b, t) {
  const na = parseInt(a.replace("#", ""), 16);
  const nb = parseInt(b.replace("#", ""), 16);
  const r = Math.round(((na >> 16) & 255) * (1 - t) + ((nb >> 16) & 255) * t);
  const g = Math.round(((na >> 8) & 255) * (1 - t) + ((nb >> 8) & 255) * t);
  const bl = Math.round((na & 255) * (1 - t) + (nb & 255) * t);
  return `rgb(${r},${g},${bl})`;
}
