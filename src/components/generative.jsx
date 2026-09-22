import { useEffect, useRef } from "react";
import { paintPoster, colorsFor, GENERATOR_NAMES } from "../generative/core.js";

/* A canvas that paints one deterministic generative artwork.
   Re-paints on size change; never repaints on scroll. */
export function GenerativeCanvas({ seed, accent = "teal", variant, className = "", style, label = "Generative artwork" }) {
  const ref = useRef(null);
  const meta = useRef({ key: "", name: "" });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const draw = () => {
      raf = 0;
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (!w || !h) return;
      const key = `${w}x${h}:${seed}:${variant}`;
      if (key === meta.current.key) return;
      meta.current.key = key;
      meta.current.name = paintPoster(el, seed, colorsFor(accent), variant);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(draw);
    };
    schedule();
    let ro;
    if ("ResizeObserver" in window) {
      ro = new ResizeObserver(schedule);
      ro.observe(el);
    } else {
      window.addEventListener("resize", schedule);
    }
    return () => {
      if (raf) cancelAnimationFrame(raf);
      if (ro) ro.disconnect();
      else window.removeEventListener("resize", schedule);
    };
  }, [seed, accent, variant]);

  return <canvas ref={ref} className={className} style={style} role="img" aria-label={label} />;
}

/* Project poster: artwork + honest seed badge */
export function ProjectArt({ seed, accent, variant }) {
  return (
    <div className="proj-art" data-seed={`SEED ${seed.toUpperCase().slice(0, 14)}`}>
      <GenerativeCanvas
        seed={seed}
        accent={accent}
        variant={variant}
        label={`Generative system artwork for ${seed}`}
      />
    </div>
  );
}

/* Gallery strip — eight systems, one per generator */
export function GenerativeGallery({ seeds = [] }) {
  return (
    <div className="gal">
      <div className="gal-head">
        <h3>Generative Gallery</h3>
        <p>Eight seeded systems — every tile is computed in-browser, no image assets</p>
      </div>
      <div className="gal-strip">
        {seeds.map((s, i) => (
          <figure className="gal-tile" key={s} style={{ "--gt": `var(--${["gold", "teal", "violet", "coral", "cobalt", "lime"][i % 6]})` }}>
            <GenerativeCanvas seed={s} accent={["gold", "teal", "violet", "coral", "cobalt", "lime"][i % 6]} variant={i} label={`${GENERATOR_NAMES[i]} generative tile`} />
            <span>{GENERATOR_NAMES[i]}</span>
          </figure>
        ))}
      </div>
    </div>
  );
}
