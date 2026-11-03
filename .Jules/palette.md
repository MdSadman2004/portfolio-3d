
## 2024-11-04 - Adding semantic active states
**Learning:** Application relies on conditional inline styles and custom classes (`is-active`, style properties) to indicate UI state selection, but assistive technologies lack semantic access to this state.
**Action:** When adding or modifying these states (like selected mode tabs, or active navigation links), pair them with `aria-current="true"` for navigation and `aria-pressed="true"` for mode-toggle buttons.
