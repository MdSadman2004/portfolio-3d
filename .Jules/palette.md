## 2026-11-05 - [Accessibility State Semantics]
**Learning:** Relying solely on inline styles and custom CSS classes (like `is-active` or `style={mode === m.id ? ... : undefined}`) for state selection drops the semantic meaning for screen readers.
**Action:** Always pair visual active/selected states with appropriate ARIA attributes (e.g., `aria-current="true"` for navigation, `aria-pressed="true"` for toggle buttons).
