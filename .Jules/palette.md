## 2023-11-01 - [ARIA for visual states]
**Learning:** Visual selection state changes (like navigation link being active or interactive buttons toggled) were relying purely on CSS classes and inline styles (`is-active`, and conditional style block checking `mode === m.id`). Screen readers require explicit ARIA flags.
**Action:** Pair visual active classes with `aria-current="true"` or `aria-current="page"` and toggle buttons with `aria-pressed="true"`.
