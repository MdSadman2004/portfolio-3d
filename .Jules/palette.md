## 2026-05-18 - Accessibility for Selected States
**Learning:** Components that visually indicate a selected or active state (via custom CSS classes like `is-active` or inline conditional styling like `color: var(--gold)`) are inaccessible to screen readers unless they also include appropriate ARIA attributes (e.g., `aria-current="true"`, `aria-pressed="true"`).
**Action:** Always check interactive elements (links, buttons, toggles) for conditional "active/selected" styling and pair them with the correct ARIA attributes.
