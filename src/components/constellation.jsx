import { useEffect, useMemo, useRef, useState } from "react";
import { SKILL_NODES, SKILL_EDGES, SKILL_CLUSTERS } from "../data/content.js";
import { rngFor } from "../generative/core.js";

/* ── deterministic layout: cluster seeding + force relaxation ── */
const CENTERS = {
  ai: [0.0, 1.35, 0.35],
  math: [-1.55, 0.15, -0.35],
  systems: [0.25, -1.3, -0.5],
  dev: [1.5, 0.1, 0.75],
};

function buildLayout() {
  const rnd = rngFor("constellation.v1");
  const nodes = SKILL_NODES.map((n) => {
    const c = CENTERS[n.cluster] || [0, 0, 0];
    return {
      ...n,
      p: [
        c[0] + (rnd() - 0.5) * 1.7,
        c[1] + (rnd() - 0.5) * 1.7,
        c[2] + (rnd() - 0.5) * 1.7,
      ],
    };
  });
  const byId = {};
  nodes.forEach((n) => (byId[n.id] = n));
  const edges = SKILL_EDGES.map(([a, b]) => [byId[a], byId[b]]).filter(([a, b]) => a && b);

  const ITER = 180;
  for (let it = 0; it < ITER; it++) {
    const damp = 0.28 * (1 - it / ITER) + 0.06;
    // repulsion
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i].p, b = nodes[j].p;
        const dx = a[0] - b[0], dy = a[1] - b[1], dz = a[2] - b[2];
        const d2 = dx * dx + dy * dy + dz * dz + 0.02;
        const f = 0.055 / d2;
        const d = Math.sqrt(d2);
        const fx = (dx / d) * f, fy = (dy / d) * f, fz = (dz / d) * f;
        a[0] += fx; a[1] += fy; a[2] += fz;
        b[0] -= fx; b[1] -= fy; b[2] -= fz;
      }
    }
    // springs
    for (const [a, b] of edges) {
      const dx = b.p[0] - a.p[0], dy = b.p[1] - a.p[1], dz = b.p[2] - a.p[2];
      const d = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.001;
      const f = (d - 1.15) * 0.012;
      const fx = (dx / d) * f, fy = (dy / d) * f, fz = (dz / d) * f;
      a.p[0] += fx; a.p[1] += fy; a.p[2] += fz;
      b.p[0] -= fx; b.p[1] -= fy; b.p[2] -= fz;
    }
    // cluster gravity + containment
    for (const n of nodes) {
      const c = CENTERS[n.cluster] || [0, 0, 0];
      n.p[0] += (c[0] - n.p[0]) * 0.02 * damp * 3;
      n.p[1] += (c[1] - n.p[1]) * 0.02 * damp * 3;
      n.p[2] += (c[2] - n.p[2]) * 0.02 * damp * 3;
      const r = Math.hypot(n.p[0], n.p[1], n.p[2]) + 0.001;
      if (r > 3.05) {
        const k = 3.05 / r;
        n.p[0] *= k; n.p[1] *= k; n.p[2] *= k;
      }
    }
    // relaxation jitter
    for (const n of nodes) {
      n.p[0] += (rnd() - 0.5) * 0.012 * damp;
      n.p[1] += (rnd() - 0.5) * 0.012 * damp;
      n.p[2] += (rnd() - 0.5) * 0.012 * damp;
    }
  }
  return { nodes, edges };
}

const FOV = 3.6;

export default function SkillConstellation() {
  const wrap = useRef(null);
  const canvas = useRef(null);
  const tip = useRef(null);
  const state = useRef({
    yaw: 0.6,
    pitch: -0.28,
    vy: 0.0016,
    dragging: false,
    lastX: 0,
    lastY: 0,
    idle: 0,
    hover: null,
    w: 0,
    h: 0,
  });

  const { nodes, edges } = useMemo(buildLayout, []);

  useEffect(() => {
    const el = canvas.current;
    const holder = wrap.current;
    if (!el || !holder) return;
    const ctx = el.getContext("2d");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let visible = true;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = holder.clientWidth;
      const h = holder.clientHeight;
      const s = state.current;
      s.w = w; s.h = h;
      el.width = Math.max(1, Math.round(w * dpr));
      el.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const colourOf = (n) => SKILL_CLUSTERS[n.cluster]?.c || "gold";
    const varOf = (n) => getComputedStyle(document.documentElement).getPropertyValue(`--${colourOf(n)}`).trim() || "#F6D68D";

    const project = (p, s, cosY, sinY, cosX, sinX, scale, cx, cy) => {
      const x1 = p[0] * cosY - p[2] * sinY;
      const z1 = p[0] * sinY + p[2] * cosY;
      const y1 = p[1];
      const y2 = y1 * cosX - z1 * sinX;
      const z2 = y1 * sinX + z1 * cosX;
      const k = FOV / (FOV + z2);
      return [cx + x1 * k * scale, cy + y2 * k * scale, k, z2, x1, y2];
    };

    const draw = () => {
      const s = state.current;
      const { w, h } = s;
      if (!w || !h) return;
      if (!s.dragging) {
        s.idle += 1;
        if (s.idle > 90) s.yaw += reduced ? 0 : 0.0022;
      }
      const cosY = Math.cos(s.yaw), sinY = Math.sin(s.yaw);
      const cosX = Math.cos(s.pitch), sinX = Math.sin(s.pitch);
      const scale = Math.min(w, h) * 0.115;
      const cx = w / 2, cy = h / 2;

      ctx.clearRect(0, 0, w, h);

      /* faint depth rings for parallax cue */
      ctx.save();
      ctx.strokeStyle = "rgba(166,138,217,0.09)";
      ctx.lineWidth = 1;
      for (let r = 1; r <= 3; r++) {
        ctx.beginPath();
        ctx.ellipse(cx, cy, r * scale * 1.5, r * scale * 0.42, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      const proj = nodes.map((n) => ({ n, s: project(n.p, s, cosY, sinY, cosX, sinX, scale, cx, cy) }));
      proj.sort((a, b) => b.s[3] - a.s[3]);

      const hoverId = s.hover ? s.hover.id : null;
      const neighbours = new Set();
      if (hoverId) {
        edges.forEach(([a, b]) => {
          if (a.id === hoverId) neighbours.add(b.id);
          if (b.id === hoverId) neighbours.add(a.id);
        });
      }

      /* edges */
      for (const [a, b] of edges) {
        const pa = proj.find((p) => p.n.id === a.id);
        const pb = proj.find((p) => p.n.id === b.id);
        if (!pa || !pb) continue;
        const dim = hoverId ? (a.id === hoverId || b.id === hoverId ? 1 : 0.12) : 1;
        const k = (pa.s[2] + pb.s[2]) / 2;
        const grad = ctx.createLinearGradient(pa.s[0], pa.s[1], pb.s[0], pb.s[1]);
        grad.addColorStop(0, hexA(varOf(a), 0.34 * dim * k));
        grad.addColorStop(1, hexA(varOf(b), 0.34 * dim * k));
        ctx.strokeStyle = grad;
        ctx.lineWidth = 0.5 + 1.1 * k;
        ctx.beginPath();
        ctx.moveTo(pa.s[0], pa.s[1]);
        ctx.lineTo(pb.s[0], pb.s[1]);
        ctx.stroke();
      }

      /* nodes */
      for (const { n, s: p } of proj) {
        const k = p[2];
        const base = (2.6 + (n.size || 1) * 3.4) * k * 1.05;
        const isHover = n.id === hoverId;
        const near = !hoverId || isHover || neighbours.has(n.id);
        const col = varOf(n);
        ctx.globalAlpha = near ? 1 : 0.3;

        /* glow */
        const g = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], base * 3.4);
        g.addColorStop(0, hexA(col, 0.5));
        g.addColorStop(1, hexA(col, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p[0], p[1], base * 3.4, 0, Math.PI * 2);
        ctx.fill();

        /* body */
        ctx.fillStyle = isHover ? "#fff" : col;
        ctx.beginPath();
        ctx.arc(p[0], p[1], base * (isHover ? 1.35 : 1), 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = hexA(col, 0.85);
        ctx.lineWidth = 1;
        ctx.stroke();

        /* labels for foreground nodes */
        if (k > 0.92 || isHover) {
          ctx.globalAlpha = (isHover ? 1 : 0.72) * (near ? 1 : 0.25);
          ctx.font = `${isHover ? 600 : 400} ${Math.max(9.5, 10.5 * k)}px "JetBrains Mono", monospace`;
          ctx.fillStyle = isHover ? "#fff" : "rgba(226,216,246,0.86)";
          ctx.textAlign = "center";
          ctx.fillText(n.label.toUpperCase(), p[0], p[1] - base - 7);
          ctx.globalAlpha = 1;
        }
      }
      ctx.globalAlpha = 1;
    };

    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (!visible || document.hidden) return;
      draw();
    };
    raf = requestAnimationFrame(loop);

    /* interaction */
    const pos = (e) => {
      const r = el.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top];
    };
    const pick = (mx, my) => {
      const s = state.current;
      const cosY = Math.cos(s.yaw), sinY = Math.sin(s.yaw);
      const cosX = Math.cos(s.pitch), sinX = Math.sin(s.pitch);
      const scale = Math.min(s.w, s.h) * 0.115;
      let best = null;
      let bestD = 30;
      for (const n of nodes) {
        const p = project(n.p, s, cosY, sinY, cosX, sinX, scale, s.w / 2, s.h / 2);
        const d = Math.hypot(p[0] - mx, p[1] - my);
        if (d < bestD) {
          bestD = d;
          best = n;
        }
      }
      return best;
    };

    const onDown = (e) => {
      const s = state.current;
      s.dragging = true;
      s.idle = 0;
      s.lastX = e.clientX;
      s.lastY = e.clientY;
      el.setPointerCapture && el.setPointerCapture(e.pointerId);
    };
    const onMove = (e) => {
      const s = state.current;
      const [mx, my] = pos(e);
      if (s.dragging) {
        s.yaw += (e.clientX - s.lastX) * 0.006;
        s.pitch = Math.max(-1.15, Math.min(1.15, s.pitch - (e.clientY - s.lastY) * 0.005));
        s.lastX = e.clientX;
        s.lastY = e.clientY;
        s.idle = 0;
        return;
      }
      const hit = pick(mx, my);
      s.hover = hit;
      if (tip.current) {
        if (hit) {
          tip.current.classList.add("on");
          tip.current.style.left = `${Math.min(mx + 14, s.w - 270)}px`;
          tip.current.style.top = `${Math.max(8, my - 10)}px`;
          tip.current.innerHTML = `<b>${hit.label}</b>${hit.lore}`;
        } else {
          tip.current.classList.remove("on");
        }
      }
    };
    const onUp = () => {
      state.current.dragging = false;
      state.current.idle = 0;
    };
    const onLeave = () => {
      state.current.dragging = false;
      state.current.hover = null;
      tip.current && tip.current.classList.remove("on");
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("pointerleave", onLeave);

    let ro;
    if ("ResizeObserver" in window) {
      ro = new ResizeObserver(resize);
      ro.observe(holder);
    } else {
      window.addEventListener("resize", resize);
    }
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
      el.removeEventListener("pointerleave", onLeave);
      if (ro) ro.disconnect();
      else window.removeEventListener("resize", resize);
      if (io) io.disconnect();
    };
  }, [nodes, edges]);

  const counts = useMemo(() => {
    const c = {};
    SKILL_NODES.forEach((n) => (c[n.cluster] = (c[n.cluster] || 0) + 1));
    return c;
  }, []);

  return (
    <div className="skills-wrap">
      <div className="const" ref={wrap}>
        <canvas ref={canvas} aria-label="Interactive 3D constellation of skills — drag to rotate" role="img" />
        <div className="const-tip" ref={tip} />
      </div>
      <div className="skills-side">
        {Object.entries(SKILL_CLUSTERS).map(([k, v]) => (
          <div className="cluster" key={k} style={{ "--cc": `var(--${v.c})` }}>
            <h4>{v.name}</h4>
            <p>{v.blurb}</p>
            <span className="cnt">
              {counts[k] || 0} NODES · {SKILL_NODES.filter((n) => n.cluster === k).map((n) => n.label).join(" · ")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function hexA(hex, a) {
  const h = (hex || "#F6D68D").replace("#", "").trim();
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  if (isNaN(n)) return `rgba(246,214,141,${a})`;
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
