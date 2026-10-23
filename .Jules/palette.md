## 2025-02-06 - Missing programmatic state in toggle buttons
**Learning:** React state-driven toggle buttons that use CSS (e.g. style overrides or classes) to indicate selection often lack `aria-pressed`, leaving screen readers unaware of the active option.
**Action:** When inspecting interactive components with multiple toggle states, verify that the visually active button also has `aria-pressed={true}`.
