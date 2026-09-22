import { useEffect, useRef, useState } from "react";
import { FieldScene } from "./FieldScene.js";

/* Fullscreen fixed WebGL layer. Degrades to a static gradient if WebGL is
   unavailable — the page must never depend on the canvas to be readable. */
export default function Field() {
  const ref = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || typeof window === "undefined") return;
    const probe = document.createElement("canvas");
    const gl = probe.getContext("webgl2") || probe.getContext("webgl");
    if (!gl) {
      setFailed(true);
      return;
    }

    /* Wait one frame so the stylesheet is applied and the canvas has its
       real viewport size — otherwise the render buffer locks to 300x150. */
    let scene = null;
    let raf0 = 0;
    let ro = null;
    const boot = () => {
      scene = new FieldScene(canvas, { quality: window.innerWidth < 780 ? 0.6 : 1 });
      if (!scene.ok) {
        setFailed(true);
        return;
      }
      scene.resize();
      scene.start();
      onScroll();
      ro = new ResizeObserver(() => scene.resize());
      ro.observe(canvas);
    };
    raf0 = requestAnimationFrame(boot);

    let ticking = false;
    const onScroll = () => {
      if (!scene || ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        scene.setScroll(max > 0 ? window.scrollY / max : 0);
        ticking = false;
      });
    };
    const onMove = (e) => {
      if (scene) scene.setMouse(e.clientX / window.innerWidth, e.clientY / window.innerHeight);
    };
    const onResize = () => scene && scene.resize();
    const onVis = () => {
      if (!scene) return;
      document.hidden ? scene.stop() : scene.start();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelAnimationFrame(raf0);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVis);
      if (ro) ro.disconnect();
      if (scene) scene.dispose();
    };
  }, []);

  if (failed) return <div className="field-fallback" aria-hidden="true" />;
  return <canvas className="field-canvas" ref={ref} aria-hidden="true" />;
}
