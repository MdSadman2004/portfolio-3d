## 2024-03-21 - Active States on Custom Elements
**Learning:** Custom UI elements like scroll-spy navigations and toggle button groups often visually indicate active state using colors or styles, but fail to communicate this to screen readers if semantic HTML isn't used properly.
**Action:** Always verify that elements visually acting as current pages/sections use `aria-current="page"` (or "location", "step" etc.) and elements visually acting as toggled buttons use `aria-pressed="true"`.
