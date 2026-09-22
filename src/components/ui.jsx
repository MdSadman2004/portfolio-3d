import { useEffect, useRef, useState } from "react";

/* ── scroll reveal ── */
export function useReveal(threshold = 0.16) {
  const ref = useRef(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      setOn(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setOn(true);
          io.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return { ref, on };
}

export function Reveal({ children, delay = 0, as: Tag = "div", className = "", ...rest }) {
  const { ref, on } = useReveal();
  const d = ["", "rv-d1", "rv-d2", "rv-d3", "rv-d4"][delay] || "";
  return (
    <Tag ref={ref} className={`rv ${d} ${on ? "on" : ""} ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

/* ── section header ── */
export function SecHead({ num, title, note, accent = "var(--gold)" }) {
  return (
    <>
      <div className="sechead" style={{ "--accent": accent }}>
        <Reveal as="span" className="sechead-num">
          {num}
        </Reveal>
        <Reveal as="h2" delay={1}>
          {title}
        </Reveal>
        {note ? (
          <Reveal as="p" className="sechead-note" delay={2}>
            {note}
          </Reveal>
        ) : null}
      </div>
      <div className="sechead-rule" style={{ "--accent": accent }} />
    </>
  );
}

/* ── count-up stat ── */
export function Stat({ value, label, sub, color = "gold" }) {
  const { ref, on } = useReveal(0.3);
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!on) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setN(value);
      return;
    }
    const start = performance.now();
    const dur = 1500;
    let raf = 0;
    const tick = (now) => {
      const t = Math.min((now - start) / dur, 1);
      setN(Math.round((1 - Math.pow(1 - t, 3)) * value));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [on, value]);
  return (
    <div className="stat" ref={ref} style={{ "--sc": `var(--${color})` }}>
      <div className="stat-v">{n.toLocaleString()}</div>
      <div className="stat-l">{label}</div>
      <div className="stat-s">{sub}</div>
    </div>
  );
}

/* ── marquee ── */
export function Marquee({ items, accent = "teal" }) {
  const row = (key) => (
    <div className="marquee-row" key={key} aria-hidden={key === "b"}>
      {items.map((t, i) => (
        <span key={i}>{t}</span>
      ))}
    </div>
  );
  return (
    <div className="marquee" style={{ "--accent": `var(--${accent})` }}>
      {row("a")}
      {row("b")}
    </div>
  );
}

/* ── portrait slot (drop public/portrait.jpg in later, zero code change) ── */
export function PortraitSlot() {
  const [ok, setOk] = useState(true);
  return (
    <div className="pslot">
      <div className="pslot-frame">
        {ok ? (
          <img
            src="/portrait.jpg"
            alt="Portrait of Md Sadman Bin Masud"
            loading="lazy"
            onError={() => setOk(false)}
          />
        ) : (
          <div className="pslot-ph">
            <div className="pslot-scan" />
            <div className="pmark">SBM</div>
            <div className="pcap">
              portrait slot
              <br />
              public/portrait.jpg
            </div>
          </div>
        )}
      </div>
      <div className="pslot-cap">Md Sadman · MIST · EECE</div>
    </div>
  );
}

/* ── custom cursor ── */
export function Cursor() {
  const ring = useRef(null);
  const dot = useRef(null);
  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const p = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const r = { x: p.x, y: p.y };
    let raf = 0;
    let hot = false;
    const move = (e) => {
      p.x = e.clientX;
      p.y = e.clientY;
      const t = e.target;
      const isHot = !!(t && t.closest && t.closest("a, button, [data-hot]"));
      if (isHot !== hot) {
        hot = isHot;
        ring.current && ring.current.classList.toggle("is-hot", hot);
      }
    };
    const loop = () => {
      r.x += (p.x - r.x) * 0.18;
      r.y += (p.y - r.y) * 0.18;
      if (ring.current) ring.current.style.transform = `translate3d(${r.x - 17}px, ${r.y - 17}px, 0)`;
      if (dot.current) dot.current.style.transform = `translate3d(${p.x - 2.5}px, ${p.y - 2.5}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("pointermove", move, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("pointermove", move);
      cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <>
      <div className="cur" ref={ring} aria-hidden="true" />
      <div className="cur-dot" ref={dot} aria-hidden="true" />
    </>
  );
}

/* ── boot sequence ── */
const BOOT_LINES = [
  "initialising generative field …",
  "compiling shaders … 6-stop palette",
  "seeding particle system … 38,000 points",
  "linking skill constellation … 20 nodes",
  "mounting research index …",
  "ready.",
];

export function Preloader() {
  const [line, setLine] = useState(0);
  const [done, setDone] = useState(false);
  useEffect(() => {
    document.body.classList.add("is-locked");
    let i = 0;
    const iv = setInterval(() => {
      i += 1;
      setLine(Math.min(i, BOOT_LINES.length - 1));
    }, 210);
    const finish = () => {
      setDone(true);
      document.body.classList.remove("is-locked");
    };
    const to = setTimeout(finish, 1500);
    return () => {
      clearInterval(iv);
      clearTimeout(to);
      document.body.classList.remove("is-locked");
    };
  }, []);
  return (
    <div className={`boot ${done ? "done" : ""}`} aria-hidden={done}>
      <div className="boot-in">
        <div className="boot-mark">GENERATIVE SYSTEMS</div>
        <div className="boot-bar">
          <i />
        </div>
        <div className="boot-line">{BOOT_LINES[line]}</div>
      </div>
    </div>
  );
}
