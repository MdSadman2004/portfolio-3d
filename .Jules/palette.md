## 2026-10-04 - Adding aria-controls and aria-current for better structural context
**Learning:** Hamburger menus using aria-expanded should also be associated with their target elements using aria-controls and active navigation links should use aria-current to indicate what the screen reader should communicate as the current selection. This creates a solid foundation for robust screen reader support.
**Action:** Always pair aria-expanded with aria-controls on button elements that show/hide another element, and use aria-current for the active items in navigation blocks.
