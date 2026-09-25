/* ═══════════════════════════════════════════════════════════════════
   CONTENT — single source of truth for every claim on this site.
   Curated to professional-public surface. No credentials, no email.
   ═══════════════════════════════════════════════════════════════════ */

export const PALETTE = {
  gold: "#F6D68D",
  teal: "#46E0C8",
  violet: "#9B4DEE",
  coral: "#FE4773",
  cobalt: "#4D8BFF",
  lime: "#CBF24D",
};

export const PROFILE = {
  name: "Md Sadman Bin Masud",
  first: "Sadman",
  mark: "SBM",
  institution: "Military Institute of Science & Technology — MIST, Dhaka",
  dept: "Electrical, Electronic & Communication Engineering",
  degree: "B.Sc. EECE · MIST",
  motto: "Rigor > Breakthrough",
  location: "Dhaka, Bangladesh",
  status: "Open for research collaboration & co-authorship",
  focus: ["Number Theory", "Autonomous AI", "Embedded Systems"],
  roles: [
    "AI Systems Researcher",
    "LangGraph Specialist",
    "IEEE APS Coordinator",
    "Embedded + Number Theory",
    "Autonomous Agent Architect",
    "Prompt Systems Engineer",
  ],
  lede: "I build systems that reason, measure, and then admit what they cannot prove.",
  bio: [
    "EECE undergraduate at MIST, Dhaka, working across three layers that rarely meet in one person: pure number theory, autonomous AI pipelines, and bare-metal embedded firmware.",
    "The through-line is method. I independently found that the stopping times of the Collatz 3n+1 map approximate a log-normal distribution — then turned it into integer-only sampling that runs on microcontrollers with no floating-point unit. I built TDHE, a topologically-deterministic hybrid ensemble, and deployed it to firmware. I co-authored an adversarial teardown of a benchmark pipeline that returned a 0.00% pass rate — and published the negative result.",
    "Alongside research I maintain autonomous operations: cron-driven agent pipelines, a 1,062-prompt research corpus, and an agentic browser harness that solved 164 MATLAB problems without headless injection.",
  ],
  tags: [
    { t: "Number Theory", c: "gold" },
    { t: "Autonomous Agents", c: "teal" },
    { t: "LangGraph", c: "violet" },
    { t: "Embedded / Firmware", c: "coral" },
    { t: "Empirical Validation", c: "gold" },
    { t: "Prompt Systems", c: "teal" },
    { t: "Statistical Rigour", c: "violet" },
  ],
};

export const STATS = [
  { v: 904000, label: "Model Comparisons", sub: "GLM Empirical v2 · 0 mismatches", c: "gold" },
  { v: 1062, label: "Curated Prompts", sub: "13 semantic categories", c: "teal" },
  { v: 164, label: "MATLAB Problems", sub: "Cody Automation harness", c: "coral" },
  { v: 62, label: "OC Transforms Logged", sub: "sync ledger · audit-grade", c: "violet" },
];

export const RESEARCH = [
  {
    label: "[ORIGINAL]",
    title: "Collatz Log-Normal Discovery",
    desc:
      "Independently discovered that stopping times of the Collatz 3n+1 map approximate a log-normal distribution — the bridge that enables integer-only sampling on no-FPU embedded systems.",
    field: "Number Theory",
    c: "gold",
  },
  {
    label: "[SYSTEM]",
    title: "TDHE Framework",
    desc:
      "Topologically-Deterministic Hybrid Ensemble — a firmware-level inference system validated by Renode simulation and deployed to physical hardware through an automated flash pipeline.",
    field: "Embedded Systems",
    c: "teal",
  },
  {
    label: "[EMPIRICAL]",
    title: "GLM Empirical v2",
    desc:
      "904,000 model comparisons. Zero mismatches. A validation framework engineered for adversarial falsification rather than confirmation.",
    field: "Statistics",
    c: "violet",
  },
  {
    label: "[AUDIT]",
    title: "ILCI → CFCE32 Teardown",
    desc:
      "An honest, adversarial benchmark audit co-authored with Md. Abiaz. A 0.00% pass rate — the negative result published with full methodology.",
    field: "Co-Authored",
    c: "coral",
  },
];

export const PROJECTS = [
  {
    kind: "Autonomous Operations",
    title: "AutoSystems",
    desc:
      "An OPAR (Output-Process-Archive-Repeat) pipeline driven by five cron jobs, with a transformation ledger that logs every ordered change for audit.",
    metrics: ["5 cron jobs", "OPAR loop", "sync ledger", "62 transforms"],
    c: "violet",
    seed: "autosystems.opar",
  },
  {
    kind: "Research Corpus",
    title: "Prompt Library",
    desc:
      "1,062 curated prompts organised into 13 semantic categories, with an auto-scan workflow that keeps the corpus indexed and current.",
    metrics: ["1,062 prompts", "13 categories", "auto-scan"],
    c: "teal",
    seed: "prompt.corpus.13",
  },
  {
    kind: "Agentic Execution",
    title: "Cody Automation",
    desc:
      "A browser harness using XHR interception — no headless injection — that solved 164 MATLAB problems across 10 groups on two accounts.",
    metrics: ["164 problems", "10 groups", "XHR-intercept"],
    c: "coral",
    seed: "cody.xhr.164",
  },
  {
    kind: "Embedded Tooling",
    title: "TDHE Firmware Pipeline",
    desc:
      "Renode-simulated ensemble validated before deployment, then flashed to hardware by a single automated script — simulation and silicon in one loop.",
    metrics: ["Renode", "flash_tdhe.py", "no-FPU math"],
    c: "gold",
    seed: "tdhe.flash.renode",
  },
  {
    kind: "Open Source",
    title: "bp-local-monitor",
    desc:
      "An agent-native CLI that classifies blood-pressure readings and writes an append-only JSONL log — deterministic analysis, no cloud, no login.",
    metrics: ["CLI + JSONL", "deterministic", "public repo"],
    c: "lime",
    seed: "bp.monitor.jsonl",
    link: "https://github.com/MdSadman2004/bp-local-monitor",
  },
  {
    kind: "Open Source",
    title: "Hybrid Solar Grid",
    desc:
      "A hybrid smart-microgrid engineering dashboard built for an EEE group project: live load flow, generation mix, and battery-state modelling.",
    metrics: ["dashboard", "generation mix", "public repo"],
    c: "cobalt",
    seed: "solar.grid.hybrid",
    link: "https://github.com/MdSadman2004/hybrid-solar-grid",
  },
];

export const SKILL_CLUSTERS = {
  ai: { name: "AI / Agents", c: "violet", blurb: "Graph-based agent orchestration, autonomous loops, and the browser-level execution layer." },
  math: { name: "Mathematics", c: "gold", blurb: "Number theory, distribution fitting, and the statistical machinery that keeps claims honest." },
  systems: { name: "Systems / Embedded", c: "teal", blurb: "Firmware, simulation, constrained arithmetic, and the pipelines that put math on silicon." },
  dev: { name: "Engineering", c: "coral", blurb: "The implementation languages and architecture work that carry everything above." },
};

export const SKILL_NODES = [
  { id: "langgraph", label: "LangGraph", cluster: "ai", size: 1.25, lore: "Graph-based agentic orchestration — the backbone of multi-step reasoning chains." },
  { id: "agents", label: "Autonomous Agents", cluster: "ai", size: 1.4, lore: "Systems that reason, act, observe and loop without human hand-holding." },
  { id: "opar", label: "OPAR Architecture", cluster: "ai", size: 1.2, lore: "Output-Process-Archive-Repeat — the cron-driven pipeline architecture behind AutoSystems." },
  { id: "prompts", label: "Prompt Engineering", cluster: "ai", size: 1.1, lore: "1,062 curated prompts across 13 categories — a structured corpus, not guesswork." },
  { id: "browser", label: "Browser Harness", cluster: "ai", size: 1.0, lore: "XHR-intercept method — 164 MATLAB problems solved without headless injection." },
  { id: "numtheory", label: "Number Theory", cluster: "math", size: 1.15, lore: "Pure mathematics — the soil the log-normal discovery grew in." },
  { id: "collatz", label: "Collatz Sequences", cluster: "math", size: 1.45, lore: "Stopping times of 3n+1 found to approximate a log-normal distribution." },
  { id: "lognormal", label: "Log-Normal Dist.", cluster: "math", size: 1.15, lore: "The bridge between number theory and embedded sampling." },
  { id: "empirical", label: "Empirical Valid.", cluster: "math", size: 1.2, lore: "GLM Empirical v2 — 904,000 comparisons, zero mismatches." },
  { id: "stats", label: "Statistical Frameworks", cluster: "math", size: 1.0, lore: "Validation machinery — the bedrock of trustworthy research claims." },
  { id: "renode", label: "Renode Firmware", cluster: "systems", size: 1.1, lore: "Simulation for TDHE firmware testing — hardware abstraction without silicon." },
  { id: "nofpu", label: "No-FPU Math", cluster: "systems", size: 1.15, lore: "Integer-only arithmetic enabling sampling on MCUs with no floating-point unit." },
  { id: "cron", label: "Cron Pipelines", cluster: "systems", size: 1.0, lore: "Five timed jobs forming the heartbeat of AutoSystems." },
  { id: "flash", label: "Flash Deploy", cluster: "systems", size: 0.95, lore: "Direct firmware deployment through the TDHE ensemble pipeline." },
  { id: "sync", label: "Sync Ledger", cluster: "systems", size: 0.95, lore: "Transformation ledger tracking 62 ordered changes — audit-grade change management." },
  { id: "python", label: "Python", cluster: "dev", size: 1.3, lore: "Primary research and automation language across every system here." },
  { id: "matlab", label: "MATLAB", cluster: "dev", size: 1.15, lore: "Target of the Cody Automation harness — MATLAB as object, not tool." },
  { id: "webdev", label: "Web Development", cluster: "dev", size: 1.05, lore: "IEEE APS MIST branch website — design-systems thinking applied." },
  { id: "ieee", label: "IEEE Standards", cluster: "dev", size: 1.0, lore: "IEEE APS MIST Student Branch Coordinator — research meeting institution." },
  { id: "sysarch", label: "Systems Architecture", cluster: "dev", size: 1.2, lore: "Coherent engineered systems spanning agents, cron, firmware and math." },
];

export const SKILL_EDGES = [
  ["langgraph", "agents"], ["agents", "opar"], ["opar", "cron"], ["agents", "browser"], ["prompts", "agents"],
  ["numtheory", "collatz"], ["collatz", "lognormal"], ["lognormal", "empirical"], ["empirical", "stats"],
  ["renode", "nofpu"], ["renode", "flash"], ["opar", "sync"], ["cron", "sync"], ["flash", "cron"],
  ["python", "matlab"], ["matlab", "webdev"], ["webdev", "ieee"],
  ["collatz", "nofpu"], ["python", "langgraph"], ["matlab", "empirical"],
  ["empirical", "langgraph"], ["sysarch", "opar"], ["sysarch", "cron"], ["ieee", "sysarch"],
  ["python", "empirical"], ["nofpu", "sync"],
];

export const ROLES = [
  { title: "IEEE APS Coordinator", sub: "MIST Student Branch", glyph: "◎", c: "gold", desc: "Coordinating chapter activities and research programming for the IEEE Antennas & Propagation Society at MIST." },
  { title: "IEEE APS Webmaster", sub: "MIST Student Branch", glyph: "◈", c: "teal", desc: "Designing, building and maintaining the branch website — applying systems thinking to institutional communication." },
  { title: "LangGraph Specialist", sub: "AI Research Lab", glyph: "◆", c: "violet", desc: "Building multi-step agentic pipelines in LangGraph, orchestrating autonomous reasoning chains under OPAR." },
  { title: "System Designer", sub: "Innovation Club", glyph: "◐", c: "cobalt", desc: "Architecting technical systems for club initiatives — turning research ideas into executable prototypes." },
  { title: "AI Co-Researcher", sub: "with Md. Abiaz", glyph: "◇", c: "coral", desc: "Co-authored the ILCI → CFCE32 honest teardown: adversarial evaluation of benchmark methodology." },
  { title: "Member", sub: "Robotics Club", glyph: "◉", c: "lime", desc: "Contributing embedded-systems and firmware knowledge — where no-FPU math and Renode simulation become practical." },
];

export const SECTIONS = [
  { id: "hero", label: "Home", num: "00" },
  { id: "about", label: "About", num: "01" },
  { id: "research", label: "Research", num: "02" },
  { id: "projects", label: "Projects", num: "03" },
  { id: "skills", label: "Skills", num: "04" },
  { id: "roles", label: "Roles", num: "05" },
  { id: "contact", label: "Contact", num: "06" },
];

export const LINKS = [
  { k: "GitHub", v: "github.com/MdSadman2004", href: "https://github.com/MdSadman2004" },
  { k: "Institution", v: "MIST, Dhaka, Bangladesh", href: "https://mist.ac.bd" },
  { k: "Branch", v: "IEEE APS MIST Student Branch", href: null },
  { k: "Status", v: "Open for collaboration & co-authorship", href: null },
];
