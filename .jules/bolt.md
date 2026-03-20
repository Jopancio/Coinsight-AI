## 2026-03-18 - Debounce Search Inputs
**Learning:** Adding a basic `debounce` function directly into `script.js` and `market.js` was necessary as there were no existing utility modules or libraries (like lodash) handling this. The rapid keystrokes were unnecessarily triggering multiple UI renders and filtering calculations.
**Action:** Always check if a debouncing mechanism exists in the codebase before implementing a custom one. Add inline performance comments as requested.
