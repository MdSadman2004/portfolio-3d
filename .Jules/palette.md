## 2026-11-06 - ARIA for Custom Selected States
**Learning:** The application heavily relies on conditional inline styling and custom classes (like `is-active`) to visually indicate selected/active states in custom UI components (navigation, toggle button groups) without semantic ARIA attributes.
**Action:** When adding or modifying these custom state selections, ensure they are paired with appropriate ARIA attributes (`aria-current="true"` for navigation, `aria-pressed="true"` for toggle buttons) to communicate the state to screen readers.
