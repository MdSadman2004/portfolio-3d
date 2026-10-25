## 2024-10-25 - Interactive Data Viz Accessibility
**Learning:** Custom interactive panels (like the Collatz Oracle) often implement toggle buttons without semantic state (missing `aria-pressed`) and have dynamically changing output regions that are not announced to screen readers.
**Action:** Always add `aria-pressed={isActive}` to custom segmented controls/toggle buttons and use `aria-live="polite"` on output regions where user action triggers data recalculation.
