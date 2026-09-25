import { useEffect, useMemo, useRef, useState } from "react";
import Field from "./webgl/Field.jsx";
import { Cursor, Marquee, PortraitSlot, Preloader, Reveal, SecHead, Stat } from "./components/ui.jsx";
import { GenerativeGallery, ProjectArt } from "./components/generative.jsx";
import SkillConstellation from "./components/constellation.jsx";
import CollatzOracle from "./components/CollatzOracle.jsx";
import { LINKS, PROFILE, PROJECTS, RESEARCH, ROLES, SECTIONS, STATS } from "./data/content.js";
import { GENERATOR_NAMES } from "./generative/core.js";

/* ── typewriter for the role line ── */
function useTypewriter(words, speed = 46, hold = 1500) {
  const [i, setI] = useState(0);
  const [txt, setTxt] = useState("");
  const [del, setDel] = useState(false);
  useEffect(() => {
    const word = words[i % words.length];
    let to;
    if (!del && txt.length < word.length) {
      to = setTimeout(() => setTxt(word.slice(0, txt.length + 1)), speed);
    } else if (!del && txt.length === word.length) {
      to = setTimeout(() => setDel(true), hold);
    } else if (del && txt.length > 0) {
      to = setTimeout(() => setTxt(word.slice(0, txt.length - 1)), speed * 0.45);
    } else {
      setDel(false);
      setI((v) => v + 1);
    }
    return () => clearTimeout(to);
  }, [txt, del, i, words, speed, hold]);
  return txt;
}

/* ── active section tracking ── */
function useActiveSection() {
  const [active, setActive] = useState("hero");
  useEffect(() => {
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean);
    if (!els.length || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (vis) setActive(vis.target.id);
      },
      { rootMargin: "-40% 0px -45% 0px", threshold: [0, 0.15, 0.4, 0.75] }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return active;
}

function HeroName({ name }) {
  const words = name.split(" ");
  let k = 0;
  return (
    <h1 className="hero-name">
      {words.map((w, wi) => (
        <span className="ln" key={wi}>
          {w.split("").map((ch, ci) => {
            const delay = 0.05 + k++ * 0.028;
            return (
              <span className="ch" key={ci} style={{ animationDelay: `${delay}s` }}>
                {ch}
              </span>
            );
          })}
        </span>
      ))}
    </h1>
  );
}

function Nav({ active }) {
  const [open, setOpen] = useState(false);
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header className={`nav ${stuck ? "is-stuck" : ""}`}>
      <a className="nav-mark" href="#hero" aria-label="Back to top">
        {PROFILE.mark}
      </a>
      <button className="nav-burger" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        {open ? "CLOSE" : "MENU"}
      </button>
      <nav className={`nav-links ${open ? "is-open" : ""}`}>
        {SECTIONS.filter((s) => s.id !== "hero").map((s) => (
          <a
            key={s.id}
            className={`nav-link ${active === s.id ? "is-active" : ""}`}
            data-num={s.num}
            href={`#${s.id}`}
            onClick={() => setOpen(false)}
          >
            {s.label}
          </a>
        ))}
      </nav>
      <div className="nav-status">
        <span className="dot" />
        FIELD LIVE
      </div>
    </header>
  );
}

function Rail({ active }) {
  const [h, setH] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setH(max > 0 ? Math.min(1, window.scrollY / max) * 100 : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const idx = SECTIONS.findIndex((s) => s.id === active);
  return (
    <aside className="rail" aria-hidden="true">
      <span>{String(Math.max(idx, 0)).padStart(2, "0")}</span>
      <div className="rail-track">
        <div className="rail-fill" style={{ height: `${h}%` }} />
      </div>
      <div className="rail-marks">
        {SECTIONS.map((s) => (
          <i key={s.id} className={s.id === active ? "on" : ""} />
        ))}
      </div>
      <span>{SECTIONS.length - 1}</span>
    </aside>
  );
}

export default function App() {
  const active = useActiveSection();
  const typed = useTypewriter(PROFILE.roles);
  const gallerySeeds = useMemo(
    () => GENERATOR_NAMES.map((k, i) => `gallery.${k.toLowerCase().replace(/\s+/g, "-")}.${i}`),
    []
  );

  return (
    <>
      <Preloader />
      <Field />
      <div className="vignette" aria-hidden="true" />
      <div className="scanlines" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
      <Cursor />
      <Nav active={active} />
      <Rail active={active} />

      <main className="shell">
        {/* ═══ 00 · HERO ═══ */}
        <section id="hero" className="sec sec-hero">
          <div className="hero-badge">
            <span className="dot" />
            MIST · EECE · Dhaka <b>/</b> {PROFILE.motto}
          </div>
          <div className="hero-grid">
            <div>
              <HeroName name={PROFILE.name} />
              <p className="hero-role">
                {typed}
                <span className="cursor-bar" />
              </p>
              <p className="hero-lede">{PROFILE.lede}</p>
              <div className="hero-actions">
                <a className="btn btn-solid" href="#research">
                  <span>Enter the research →</span>
                </a>
                <a className="btn" href="#projects">
                  <span>See the systems</span>
                </a>
                <a className="btn" href="https://github.com/MdSadman2004" target="_blank" rel="noreferrer noopener">
                  <span>GitHub ↗</span>
                </a>
              </div>
            </div>
            <div className="hero-meta">
              <div>
                <span className="k">Focus</span>
                <span className="v">{PROFILE.focus.join(" · ")}</span>
              </div>
              <div>
                <span className="k">Programme</span>
                <span className="v">{PROFILE.degree}</span>
              </div>
              <div>
                <span className="k">Status</span>
                <span className="v">{PROFILE.status}</span>
              </div>
              <div>
                <span className="k">Method</span>
                <span className="v">Discover → formalise → falsify → deploy</span>
              </div>
            </div>
          </div>
          <div className="scroll-cue">
            <i />
            scroll to drive the field
          </div>
        </section>
      </main>

      <Marquee items={PROFILE.roles} accent="teal" />

      <main className="shell">
        {/* ═══ 01 · ABOUT ═══ */}
        <section id="about" className="sec">
          <SecHead
            num="01"
            title="About"
            accent="var(--gold)"
            note="Number theory at one end, firmware at the other, autonomous agents in between"
          />
          <div className="about-grid">
            <Reveal className="panel about-bio">
              <div className="panel-title">Profile</div>
              <p className="lede">{PROFILE.bio[0]}</p>
              <p style={{ marginTop: 18 }}>{PROFILE.bio[1]}</p>
              <p>{PROFILE.bio[2]}</p>
              <div className="about-tags">
                {PROFILE.tags.map((t) => (
                  <span className={`tag t-${t.c}`} key={t.t}>
                    {t.t}
                  </span>
                ))}
              </div>
            </Reveal>
            <Reveal delay={2}>
              <PortraitSlot />
            </Reveal>
          </div>
          <div className="stats">
            {STATS.map((s) => (
              <Stat key={s.label} value={s.v} label={s.label} sub={s.sub} color={s.c} />
            ))}
          </div>
        </section>

        {/* ═══ 02 · RESEARCH ═══ */}
        <section id="research" className="sec">
          <SecHead
            num="02"
            title="Research"
            accent="var(--teal)"
            note="Four lines of work — an original result, a deployed system, an empirical framework, and a published negative"
          />
          <div className="res-list">
            {RESEARCH.map((r, i) => (
              <Reveal
                key={r.title}
                delay={Math.min(i + 1, 4)}
                className="res-item"
                style={{ "--rc": `var(--${r.c})` }}
              >
                <span className="res-tag">{r.label}</span>
                <div>
                  <h3>{r.title}</h3>
                  <p>{r.desc}</p>
                </div>
                <span className="res-field">{r.field}</span>
              </Reveal>
            ))}
          </div>

          <Reveal className="panel" delay={2} style={{ marginTop: 26 }}>
            <div className="panel-title">Interactive · Collatz Oracle — original research, computed in your browser</div>
            <CollatzOracle />
          </Reveal>
        </section>

        {/* ═══ 03 · PROJECTS ═══ */}
        <section id="projects" className="sec">
          <SecHead
            num="03"
            title="Projects"
            accent="var(--violet)"
            note="Every artwork below is generated from the project's own seed — no stock imagery anywhere on this page"
          />
          <div className="proj-grid">
            {PROJECTS.map((p, i) => (
              <Reveal key={p.title} className="proj" delay={Math.min((i % 3) + 1, 4)} style={{ "--pc": `var(--${p.c})` }}>
                <ProjectArt seed={p.seed} accent={p.c} variant={i % 8} />
                <div className="proj-body">
                  <span className="proj-kind">{p.kind}</span>
                  <h3>{p.title}</h3>
                  <p>{p.desc}</p>
                  <div className="proj-metrics">
                    {p.metrics.map((m) => (
                      <span className="pm" key={m}>
                        {m}
                      </span>
                    ))}
                  </div>
                  {p.link ? (
                    <a className="proj-link" href={p.link} target="_blank" rel="noreferrer noopener">
                      <i />
                      Repository ↗
                    </a>
                  ) : (
                    <span className="proj-link" style={{ color: "var(--dimmer)" }}>
                      <i />
                      In-house system
                    </span>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={2}>
            <GenerativeGallery seeds={gallerySeeds} />
          </Reveal>
        </section>

        {/* ═══ 04 · SKILLS ═══ */}
        <section id="skills" className="sec">
          <SecHead
            num="04"
            title="Skills"
            accent="var(--coral)"
            note="20 capabilities in four clusters — drag the constellation; the layout is force-simulated, not hand-placed"
          />
          <Reveal>
            <SkillConstellation />
          </Reveal>
        </section>

        {/* ═══ 05 · ROLES ═══ */}
        <section id="roles" className="sec">
          <SecHead num="05" title="Roles" accent="var(--cobalt)" note="Where the research meets institution and team" />
          <div className="roles-grid">
            {ROLES.map((r, i) => (
              <Reveal key={r.title} className="role" delay={Math.min((i % 3) + 1, 4)} style={{ "--rc": `var(--${r.c})` }}>
                <span className="role-glyph">{r.glyph}</span>
                <h3>{r.title}</h3>
                <div className="sub">{r.sub}</div>
                <p>{r.desc}</p>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ═══ 06 · CONTACT ═══ */}
        <section id="contact" className="sec">
          <SecHead num="06" title="Contact" accent="var(--lime)" note="Open to research collaboration, co-authorship, and hard problems" />
          <div className="contact-grid">
            <Reveal>
              <p className="contact-big">
                Let's validate
                <br />
                something <em>rigorous.</em>
              </p>
              <p style={{ marginTop: 22, color: "var(--dim)", maxWidth: "46ch", fontSize: 15, lineHeight: 1.75 }}>
                I collaborate on number theory, autonomous agent systems, and embedded inference — especially work where
                the honest result might be negative. Reach me through GitHub.
              </p>
              <div className="hero-actions">
                <a className="btn btn-solid" href="https://github.com/MdSadman2004" target="_blank" rel="noreferrer noopener">
                  <span>Open GitHub ↗</span>
                </a>
                <a className="btn" href="https://github.com/MdSadman2004/bp-local-monitor" target="_blank" rel="noreferrer noopener">
                  <span>Pinned repo ↗</span>
                </a>
              </div>
            </Reveal>
            <Reveal delay={2} className="contact-links">
              {LINKS.filter((l) => l.href).map((l) => (
                <a key={l.k} href={l.href} target="_blank" rel="noreferrer noopener">
                  <span className="k">{l.k}</span>
                  <span className="v">{l.v}</span>
                  <span className="arw">↗</span>
                </a>
              ))}
              {LINKS.filter((l) => !l.href).map((l) => (
                <a key={l.k} as="div" href="#contact" onClick={(e) => e.preventDefault()} style={{ cursor: "default" }}>
                  <span className="k">{l.k}</span>
                  <span className="v">{l.v}</span>
                  <span className="arw">·</span>
                </a>
              ))}
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="foot">
        <span>
          <b>{PROFILE.name}</b> · {PROFILE.institution}
        </span>
        <span>Generative Systems Portfolio · built with React + three.js · 2026</span>
      </footer>
    </>
  );
}
