
## 2024-05-18 - Menu and Toggle Accessibility
**Learning:** Proper ARIA roles and relationships (`aria-controls`, `aria-current`, `aria-expanded`) are critical for context when using screen readers on custom navigation components. Adding an Escape key listener to close modals or flyout menus significantly improves the experience for keyboard-only users.
**Action:** When creating or auditing custom menus/toggles, ensure the trigger points to the content using `aria-controls`, its state is announced using `aria-expanded`, active items are marked with `aria-current`, and the container gracefully handles keyboard escape sequences.
