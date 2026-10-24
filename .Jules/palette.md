## 2026-10-24 - Toggle Button Accessibility Pattern
**Learning:** Found toggle buttons (mode switchers and N-value limits in CollatzOracle) relying purely on visual styling (color, borderColor, background) to indicate active state, meaning screen readers get no feedback on which option is currently active.
**Action:** Always add `aria-pressed={isActive}` to any button acting as a toggle in a button group so screen readers announce the selected state properly alongside the visual indication.
