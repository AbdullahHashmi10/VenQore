# Tailwind Theming Engine
**Path:** `resources/js/theme/active.js`

## Overview
The platform dynamically scales colors, micro-font sizing, spacing, and border radii using a centralized Tailwind Theming Engine. The core configuration operates as a drop-in layer for Tailwind, overriding hardcoded utility classes without requiring mass rewrites. 

## Mechanism
1. **The Core Switch (`active.js`)**: All 393 components and views import their styling parameters dynamically. By modifying a single line in `resources/js/theme/active.js`, the entire platform reskins (e.g., swapping `midnight-nebula.js` for `daylight-calm.js`).
2. **Variable Injection**: The engine converts exact Tailwind hex matches to CSS custom properties. 
3. **No-Op Compilation**: The engine has 100% byte-identical parity with the hardcoded baseline, but unifies ~40,000 color classes and ~2,700 micro-font hardcoded instances into the root tokens.

## Important Note
Third-party brand colors (Amazon, Google, TikTok, WooCommerce) are explicitly excluded from the codemod to ensure brand compliance.
