## 2024-05-14 - ARIA selection states for visually selected inline items
**Learning:** This app extensively uses conditional inline styling (`style={{...}}`) and custom classes (`className="is-active"`) to indicate UI state selection, such as active navigation links and active data modes in the Collatz Oracle.
**Action:** When adding or modifying selection states that rely on inline styles or classes for visual indication, ensure they are paired with appropriate ARIA attributes (e.g., `aria-current="true"`, `aria-pressed="true"`) to communicate the selection to screen reader users.
