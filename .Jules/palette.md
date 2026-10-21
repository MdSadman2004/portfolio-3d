## 2024-10-21 - Accessible Single-Page Navigation
**Learning:** Scroll-spied navigation links visually highlight the current section but fail to convey this state to screen readers without `aria-current="page"`. Additionally, custom mobile menus built without native `<dialog>` or `<details>` elements require manual event listeners for `Escape` key to meet expected keyboard interaction patterns.
**Action:** Always pair visual `.is-active` states on navigation with `aria-current`. Ensure custom mobile menus map `Escape` to close state and use `aria-controls` on their toggle buttons.
