/* ═══════════════════════════════════════════════════════════════════
   FIELD SCENE — the live 3D layer
   · generative flow-field background (fbm domain warp, 6-stop palette)
   · 38k-point GPU-animated particle cloud (no CPU per-frame work)
   · noise-displaced iridescent core + wireframe cage + orbital rings
   · scroll-driven camera path through 7 zones
   ═══════════════════════════════════════════════════════════════════ */
import * as THREE from "three";

/* ── shared GLSL ── */
const GLSL_RAMP = /* glsl */ `
vec3 ramp(float t){
  t = clamp(t, 0.0, 1.0);
  vec3 c0 = vec3(0.016, 0.008, 0.047);
  vec3 c1 = vec3(0.30, 0.14, 0.62);
  vec3 c2 = vec3(0.24, 0.42, 1.00);
  vec3 c3 = vec3(0.27, 0.88, 0.78);
  vec3 c4 = vec3(0.97, 0.84, 0.55);
  vec3 c5 = vec3(1.00, 0.28, 0.45);
  float x = t * 5.0;
  vec3 c = mix(c0, c1, clamp(x, 0.0, 1.0));
  c = mix(c, c2, clamp(x - 1.0, 0.0, 1.0));
  c = mix(c, c3, clamp(x - 2.0, 0.0, 1.0));
  c = mix(c, c4, clamp(x - 3.0, 0.0, 1.0));
  c = mix(c, c5, clamp(x - 4.0, 0.0, 1.0));
  return c;
}
`;

const GLSL_NOISE2 = /* glsl */ `
float hash21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p){
  vec2 i = floor(p); vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
float fbm(vec2 p){
  float v = 0.0; float a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 6; i++){ v += a * vnoise(p); p = m * p; a *= 0.5; }
  return v;
}
`;

const BG_VERT = /* glsl */ `
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const BG_FRAG = /* glsl */ `
precision highp float;
uniform float uTime;
uniform float uScroll;
uniform float uZone;
uniform vec2  uMouse;
uniform vec2  uRes;
varying vec2 vUv;
${GLSL_NOISE2}
${GLSL_RAMP}
void main(){
  vec2 uv = gl_FragCoord.xy / uRes.xy;
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes.xy) / uRes.y;
  float t = uTime * 0.042;
  vec2 m = (uMouse - 0.5) * 0.34;

  vec2 q = vec2(
    fbm(p * 1.35 + t + m),
    fbm(p * 1.35 + vec2(5.2, 1.3) - t * 0.7)
  );
  vec2 r = vec2(
    fbm(p * 2.05 + 4.0 * q + vec2(1.7, 9.2) + t * 0.55),
    fbm(p * 2.05 + 4.0 * q + vec2(8.3, 2.8) - t * 0.48)
  );
  float f = fbm(p * 1.05 + 3.3 * r);

  float band = uScroll * 1.25 + uZone * 0.06;
  vec3 col = ramp(f * 0.85 + r.x * 0.5 + band);
  col *= 0.3 + 0.7 * pow(clamp(f, 0.0, 1.0), 1.1);

  /* technical grid — faint structure, denser in later zones */
  vec2 gv = abs(fract(p * 9.0 + vec2(0.0, uTime * 0.015)) - 0.5);
  float grid = smoothstep(0.028, 0.0, gv.x) + smoothstep(0.028, 0.0, gv.y);
  col += grid * (0.03 + uZone * 0.008);

  /* travelling scan band */
  float sy = fract(uTime * 0.045);
  float scan = exp(-pow((uv.y - sy) * 13.0, 2.0));
  col += ramp(fract(sy + 0.35)) * scan * 0.16;

  /* horizontal chromatic striping at the extremes */
  col += vec3(0.4, 0.0, 0.35) * smoothstep(0.75, 1.0, r.y) * 0.35;
  col += vec3(0.0, 0.35, 0.4) * smoothstep(0.75, 1.0, q.x) * 0.3;

  float vig = smoothstep(1.35, 0.2, length(p * 1.02));
  col *= mix(0.28, 1.0, vig);
  col += (hash21(gl_FragCoord.xy + fract(uTime) * 91.7) - 0.5) * 0.03;
  gl_FragColor = vec4(col, 1.0);
}
`;

const PT_VERT = /* glsl */ `
attribute float aSeed;
attribute float aSize;
uniform float uTime;
uniform float uScroll;
uniform float uTurb;
uniform float uZone;
varying float vT;
varying float vSeed;
void main(){
  vec3 p = position;
  float s = aSeed * 6.2831853;
  float t = uTime * 0.17 + s;
  float amp = uTurb * (0.35 + 0.55 * fract(aSeed * 7.13));
  p.x += sin(t * 0.90 + p.y * 0.42) * amp;
  p.y += cos(t * 1.13 + p.z * 0.37) * amp;
  p.z += sin(t * 0.77 + p.x * 0.45) * amp;
  p *= 1.0 + 0.05 * sin(uTime * 0.55 + s);
  p.y += uScroll * 0.9;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float dist = max(-mv.z, 0.25);
  gl_PointSize = clamp(aSize * (300.0 / dist), 0.55, 10.0);
  vT = clamp(length(p) / 9.0, 0.0, 1.0);
  vSeed = aSeed;
}
`;

const PT_FRAG = /* glsl */ `
precision highp float;
uniform float uTime;
uniform float uScroll;
varying float vT;
varying float vSeed;
${GLSL_RAMP}
void main(){
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if (d > 0.5) discard;
  float a = smoothstep(0.5, 0.02, d);
  float pulse = 0.55 + 0.45 * sin(uTime * 1.5 + vSeed * 41.0);
  vec3 col = ramp(fract(vT * 1.15 + uScroll * 0.8 + vSeed * 0.11));
  gl_FragColor = vec4(col, a * a * pulse * 0.9);
}
`;

const CORE_VERT = /* glsl */ `
uniform float uTime;
uniform float uAmp;
varying vec3 vN;
varying vec3 vP;
varying float vD;
float h31(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float n31(vec3 x){
  vec3 i = floor(x); vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(h31(i + vec3(0.0,0.0,0.0)), h31(i + vec3(1.0,0.0,0.0)), f.x),
        mix(h31(i + vec3(0.0,1.0,0.0)), h31(i + vec3(1.0,1.0,0.0)), f.x), f.y),
    mix(mix(h31(i + vec3(0.0,0.0,1.0)), h31(i + vec3(1.0,0.0,1.0)), f.x),
        mix(h31(i + vec3(0.0,1.0,1.0)), h31(i + vec3(1.0,1.0,1.0)), f.x), f.y), f.z);
}
float fbm3(vec3 p){
  float v = 0.0; float a = 0.5;
  for (int i = 0; i < 4; i++){ v += a * n31(p); p *= 2.03; a *= 0.5; }
  return v;
}
void main(){
  vec3 nrm = normalize(position);
  float n = fbm3(nrm * 1.65 + vec3(0.0, 0.0, uTime * 0.15));
  vD = n;
  vec3 p = position + nrm * ((n - 0.5) * 2.0 * uAmp);
  vP = p;
  vN = normalize(normalMatrix * nrm);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`;

const CORE_FRAG = /* glsl */ `
precision highp float;
uniform float uTime;
uniform float uScroll;
uniform float uZone;
varying vec3 vN;
varying vec3 vP;
varying float vD;
${GLSL_RAMP}
void main(){
  vec3 V = normalize(cameraPosition - vP);
  float fres = pow(1.0 - max(dot(normalize(vN), V), 0.0), 2.1);
  float band = vD * 1.5 + fres * 0.95 + uTime * 0.055 + uScroll * 0.65 + uZone * 0.05;
  vec3 col = ramp(fract(band));
  col = mix(col * 0.7, vec3(1.0), fres * 0.42);
  gl_FragColor = vec4(col * (0.42 + 0.75 * fres), 0.92);
}
`;

/* ── the 7-zone camera path (one per page section) ── */
const ZONES = [
  { pos: [0.0, 0.1, 9.6], turb: 1.00, amp: 0.20, drill: 0.0 },
  { pos: [3.2, 1.0, 7.6], turb: 0.75, amp: 0.30, drill: 0.6 },
  { pos: [-3.0, -1.2, 7.9], turb: 1.30, amp: 0.24, drill: 1.2 },
  { pos: [1.1, 1.7, 6.7], turb: 0.95, amp: 0.38, drill: 1.8 },
  { pos: [3.6, -1.4, 8.4], turb: 1.45, amp: 0.28, drill: 2.4 },
  { pos: [-1.6, 1.3, 7.1], turb: 0.85, amp: 0.34, drill: 3.0 },
  { pos: [0.0, 0.4, 8.9], turb: 1.10, amp: 0.22, drill: 3.6 },
];

const GOLDEN = 2.399963;

export class FieldScene {
  constructor(canvas, { quality = 1 } = {}) {
    this.canvas = canvas;
    this.ok = false;
    this.time = 0;
    this.scroll = 0;
    this.scrollTarget = 0;
    this.mouse = new THREE.Vector2(0.5, 0.5);
    this.mouseSmooth = new THREE.Vector2(0.5, 0.5);
    this.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.quality = quality;
    this.raf = 0;
    this.lastFrame = 0;

    try {
      this._init();
      this.ok = true;
    } catch (e) {
      console.warn("[field] WebGL unavailable:", e && e.message);
      this.ok = false;
    }
  }

  _init() {
    const canvas = this.canvas;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      powerPreference: "high-performance",
      failIfMajorPerformanceCaveat: false,
    });
    this.renderer.setClearColor(0x05030c, 1);
    this.dpr = Math.min(window.devicePixelRatio || 1, this.quality > 0.7 ? 1.75 : 1.25);
    this.renderer.setPixelRatio(this.dpr);

    /* ── background field ── */
    this.bgScene = new THREE.Scene();
    this.bgCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.bgUniforms = {
      uTime: { value: 0 },
      uScroll: { value: 0 },
      uZone: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uRes: { value: new THREE.Vector2(1, 1) },
    };
    const bgMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({
        vertexShader: BG_VERT,
        fragmentShader: BG_FRAG,
        uniforms: this.bgUniforms,
        depthTest: false,
        depthWrite: false,
      })
    );
    bgMesh.frustumCulled = false;
    this.bgScene.add(bgMesh);

    /* ── main scene ── */
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(56, 1, 0.1, 160);
    this.camera.position.set(0, 0.1, 9.6);

    const count = Math.round((window.innerWidth < 780 ? 16000 : 38000) * this.quality * (this.reduced ? 0.35 : 1));
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    const size = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const r = 2.0 + Math.pow(Math.random(), 0.62) * 7.4;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      let x = Math.sin(ph) * Math.cos(th) * r;
      let y = Math.cos(ph) * r * 0.62;
      let z = Math.sin(ph) * Math.sin(th) * r;
      /* two dense lobes so the cloud reads as structure, not noise */
      if (i % 3 === 0) {
        x += Math.cos(i * GOLDEN) * 1.9;
        y += Math.sin(i * GOLDEN * 1.3) * 1.1;
        z += Math.cos(i * GOLDEN * 0.7) * 1.9;
      }
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
      seed[i] = Math.random();
      size[i] = 0.7 + Math.random() * 2.4;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    geo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    this.ptUniforms = {
      uTime: { value: 0 },
      uScroll: { value: 0 },
      uTurb: { value: 1.0 },
      uZone: { value: 0 },
    };
    this.points = new THREE.Points(
      geo,
      new THREE.ShaderMaterial({
        vertexShader: PT_VERT,
        fragmentShader: PT_FRAG,
        uniforms: this.ptUniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    this.scene.add(this.points);

    /* ── iridescent core ── */
    this.coreUniforms = {
      uTime: { value: 0 },
      uAmp: { value: 0.2 },
      uScroll: { value: 0 },
      uZone: { value: 0 },
    };
    this.core = new THREE.Mesh(
      new THREE.SphereGeometry(1.42, 96, 96),
      new THREE.ShaderMaterial({
        vertexShader: CORE_VERT,
        fragmentShader: CORE_FRAG,
        uniforms: this.coreUniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    this.scene.add(this.core);

    /* ── wireframe cage ── */
    this.cage = new THREE.Mesh(
      new THREE.IcosahedronGeometry(2.85, 1),
      new THREE.MeshBasicMaterial({
        color: 0x9b4dee,
        wireframe: true,
        transparent: true,
        opacity: 0.16,
      })
    );
    this.scene.add(this.cage);

    /* ── orbital rings ── */
    this.rings = new THREE.Group();
    const ringColors = [0x46e0c8, 0xf6d68d, 0xfe4773];
    ringColors.forEach((c, i) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(3.1 + i * 0.62, 0.0075, 6, 240),
        new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.5 })
      );
      ring.rotation.set(
        Math.PI * (0.32 + i * 0.24),
        Math.PI * (0.12 + i * 0.3),
        Math.PI * (i * 0.18)
      );
      this.rings.add(ring);
    });
    this.scene.add(this.rings);

    this.resize();
  }

  resize() {
    if (!this.ok) return;
    const w = this.canvas.clientWidth || window.innerWidth || 1;
    const h = this.canvas.clientHeight || window.innerHeight || 1;
    const dpr = Math.min(window.devicePixelRatio || 1, this.quality > 0.7 ? 1.75 : 1.25);
    if (w < 2 || h < 2) return;
    if (this._w === w && this._h === h && this.dpr === dpr) return;
    this._w = w;
    this._h = h;
    this.dpr = dpr;
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.bgUniforms.uRes.value.set(Math.round(w * dpr), Math.round(h * dpr));
    if (this.reduced) this.renderOnce();
  }

  setScroll(p) {
    this.scrollTarget = Math.min(1, Math.max(0, p));
  }

  setMouse(nx, ny) {
    this.mouse.set(nx, ny);
  }

  _cameraTargets() {
    const n = ZONES.length - 1;
    const f = Math.min(0.9999, Math.max(0, this.scroll)) * n;
    const i = Math.floor(f);
    const j = Math.min(n, i + 1);
    const t = f - i;
    const e = t * t * (3 - 2 * t);
    const a = ZONES[i];
    const b = ZONES[j];
    return {
      x: a.pos[0] + (b.pos[0] - a.pos[0]) * e,
      y: a.pos[1] + (b.pos[1] - a.pos[1]) * e,
      z: a.pos[2] + (b.pos[2] - a.pos[2]) * e,
      turb: a.turb + (b.turb - a.turb) * e,
      amp: a.amp + (b.amp - a.amp) * e,
      zone: f,
    };
  }

  frame(dt) {
    const t = this._cameraTargets();
    const mx = (this.mouse.x - 0.5) * 2;
    const my = (this.mouse.y - 0.5) * 2;

    /* damped follow — cheap, stable, no per-frame allocation */
    const k = 1 - Math.pow(0.0016, Math.min(dt, 0.05));
    this.scroll += (this.scrollTarget - this.scroll) * k;
    this.mouseSmooth.x += (this.mouse.x - this.mouseSmooth.x) * k;
    this.mouseSmooth.y += (this.mouse.y - this.mouseSmooth.y) * k;

    const smx = (this.mouseSmooth.x - 0.5) * 2;
    const smy = (this.mouseSmooth.y - 0.5) * 2;

    this.camera.position.x += (t.x + smx * 0.85 - this.camera.position.x) * k * 0.85;
    this.camera.position.y += (t.y - smy * 0.6 - this.camera.position.y) * k * 0.85;
    this.camera.position.z += (t.z - this.camera.position.z) * k * 0.6;
    this.camera.lookAt(smx * 0.35, smy * 0.28, 0);

    const ct = this._cameraTargets();

    this.bgUniforms.uTime.value = this.time;
    this.bgUniforms.uScroll.value = this.scroll;
    this.bgUniforms.uZone.value = ct.zone;
    this.bgUniforms.uMouse.value.set(this.mouseSmooth.x, 1 - this.mouseSmooth.y);

    this.ptUniforms.uTime.value = this.time;
    this.ptUniforms.uScroll.value = this.scroll;
    this.ptUniforms.uTurb.value = ct.turb;
    this.ptUniforms.uZone.value = ct.zone;

    this.coreUniforms.uTime.value = this.time;
    this.coreUniforms.uAmp.value = ct.amp * (1 + Math.sin(this.time * 0.5) * 0.08);
    this.coreUniforms.uScroll.value = this.scroll;
    this.coreUniforms.uZone.value = ct.zone;
    this.core.rotation.y = this.time * 0.045 + this.scroll * 1.6;
    this.core.rotation.x = Math.sin(this.time * 0.11) * 0.22 + this.scroll * 0.5;

    this.cage.rotation.y = -this.time * 0.03 - this.scroll * 2.1;
    this.cage.rotation.x = this.time * 0.017 + this.scroll * 0.7;
    this.rings.rotation.y = this.time * 0.026 + this.scroll * 3.4;
    this.rings.rotation.z = Math.sin(this.time * 0.07) * 0.16;
  }

  renderOnce() {
    if (!this.ok) return;
    this.renderer.autoClear = true;
    this.renderer.render(this.bgScene, this.bgCam);
    this.renderer.autoClear = false;
    this.renderer.clearDepth();
    this.renderer.render(this.scene, this.camera);
    this.renderer.autoClear = true;
  }

  start() {
    if (!this.ok || this.raf) return;
    if (this.reduced) {
      this.frame(0.016);
      this.renderOnce();
      return;
    }
    const loop = (now) => {
      this.raf = requestAnimationFrame(loop);
      if (document.hidden) return;
      const dt = Math.min((now - (this.lastFrame || now)) / 1000, 0.05);
      this.lastFrame = now;
      this.time += dt;
      this.frame(dt);
      this.renderOnce();
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  dispose() {
    this.stop();
    if (!this.ok) return;
    this.scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) Array.isArray(o.material) ? o.material.forEach((m) => m.dispose()) : o.material.dispose();
    });
    this.bgScene.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) o.material.dispose();
    });
    this.renderer.dispose();
    this.ok = false;
  }
}
