## 2026-10-12 - Keyboard Accessibility for Canvas Interactives
**Learning:** Custom 3D interactive components (like the Collatz Oracle and Constellation) built on `<canvas>` are completely inaccessible to keyboard users unless explicitly made focusable.
**Action:** Always add `tabIndex={0}`, an appropriate `aria-label`, and an `onKeyDown` handler mapped to arrow keys (with `e.preventDefault()` to stop page scroll) to make canvas-based visualizations natively rotatable/interactive via keyboard.
