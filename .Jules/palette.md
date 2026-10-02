## 2024-05-18 - Programmatic State Indicators for Custom Toggles
**Learning:** Found custom toggle buttons (in `CollatzOracle`) and navigation links (`App.jsx`) where active state was purely visual (inline styles and CSS classes). Screen reader users wouldn't know which item was active.
**Action:** Always add explicit ARIA attributes (`aria-pressed` for toggles, `aria-current="page"` or `aria-current="true"` for navigation) to make visually selected states semantically accessible.
