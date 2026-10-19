## 2025-02-14 - Navigation & Toggle Accessibility
**Learning:** Native `title` attributes on buttons do not guarantee robust screen reader context, and active navigation/toggle states require explicit semantic flags (`aria-current` and `aria-pressed`) to be communicated correctly by assistive tech.
**Action:** Added `aria-current="page"` for the active navigation link, added an Escape key handler for the mobile menu, applied `aria-pressed` for mode toggles, and converted `title` contexts into explicit `aria-label`s on quick-start buttons.
