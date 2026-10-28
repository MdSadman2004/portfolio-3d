## 2024-11-20 - Visual state without ARIA
**Learning:** The application heavily relies on visual indicators like `is-active` classes and inline color styles for toggled state (e.g. active menu items, selected modes, and selected data ranges in the Collatz tool) but fails to expose these to screen readers via ARIA states like `aria-current` or `aria-pressed`.
**Action:** Add appropriate ARIA states such as `aria-pressed` and `aria-current` alongside visual indicators to ensure blind and visually impaired users can perceive interactive element states.
