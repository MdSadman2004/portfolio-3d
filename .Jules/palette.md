## 2024-05-24 - Missing Semantic State in Custom Toggles
**Learning:** Custom interactive components (like nav links and mode toggles) use visual styling for active states but lack semantic attributes like `aria-current` or `aria-pressed`, rendering them inaccessible to screen readers.
**Action:** Add appropriate semantic ARIA attributes when implementing visually active states on custom toggle buttons and navigation links.
