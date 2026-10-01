## 2024-05-24 - Accessible Stateful Controls
**Learning:** Custom toggle buttons and segmented controls need explicit state indication for screen readers, as visual styling (like border colors) is not conveyed. Also, grouping buttons visually often requires grouping them semantically with `role="group"` and an `aria-label`.
**Action:** Always add `aria-pressed` to stateful toggle buttons and wrap related controls in a `role="group"` with a descriptive label.
