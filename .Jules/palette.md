## 2026-10-11 - Pairing Visual Active States with Programmatic Equivalents
**Learning:** When adding visual active states to navigation links or toggle buttons, it's critical to provide equivalent programmatic state (like `aria-current` or `aria-pressed`) for screen reader users to understand which item is currently active.
**Action:** Always pair visual active states (e.g., highlighting the current page link or the active toggle button) with appropriate ARIA attributes (`aria-current="page"`, `aria-pressed="true"`).
