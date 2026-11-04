## 2026-11-04 - Scroll-spy navigation needs active state announced
**Learning:** Relying purely on conditional CSS classes (e.g. `is-active`) for scroll-spy navigation is not accessible. Screen readers have no way of knowing which section is currently active as the user scrolls, unless explicitly told.
**Action:** When adding or modifying inline styling and custom classes to indicate UI state selection (like active/selected), always pair them with appropriate ARIA attributes (e.g. `aria-current="true"`, `aria-pressed="true"`) for accessibility.
