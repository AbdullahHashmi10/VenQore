# VenQore Design System — Section 15: Design Tokens

> **Production Engineering**: Design tokens in VenQore bridge design intent directly to frontend code. They are single-source-of-truth values compiled for CSS, Tailwind, Figma, and JSON theme engines.

---

# 1. Production CSS Variables (`variables.css`)

```css
/**
 * VenQore HIG Design Tokens v1.0.0
 * Pure Vanilla CSS Custom Properties
 */

:root {
  /* Color Palette - Neutrals (Dark Baseline) */
  --vq-color-dark-bg-base: #090A0C;
  --vq-color-dark-bg-s1: #101216;
  --vq-color-dark-bg-s2: #171A21;
  --vq-color-dark-bg-s3: #20242E;
  --vq-color-dark-bg-s4: #2B303C;

  --vq-color-dark-text-primary: #F3F4F6;
  --vq-color-dark-text-secondary: #9CA3AF;
  --vq-color-dark-text-tertiary: #6B7280;

  --vq-color-dark-border-hairline: #1F242D;
  --vq-color-dark-border-strong: #374151;

  /* Color Palette - Neutrals (Light Baseline) */
  --vq-color-light-bg-base: #F8F9FA;
  --vq-color-light-bg-s1: #FFFFFF;
  --vq-color-light-bg-s2: #F1F3F5;
  --vq-color-light-bg-s3: #E9ECEF;

  --vq-color-light-text-primary: #111827;
  --vq-color-light-text-secondary: #4B5563;
  --vq-color-light-text-tertiary: #9CA3AF;

  --vq-color-light-border-hairline: #E2E8F0;
  --vq-color-light-border-strong: #CBD5E1;

  /* Brand Primary Accent - Tungsten Gold */
  --vq-color-tungsten-main: #D8A24A;
  --vq-color-tungsten-hover: #E5B35C;
  --vq-color-tungsten-sub: #2C2213;

  /* Domain & Semantic Chromas */
  --vq-color-emerald-success: #10B981;
  --vq-color-crimson-error: #EF4444;
  --vq-color-amber-warning: #F59E0B;
  --vq-color-cyan-info: #06B6D4;
  --vq-color-cyan-offline: #38BDF8;
  --vq-color-amethyst-pending: #8B5CF6;
  --vq-color-copper-manufacture: #E67E22;

  /* Typography */
  --vq-font-sans: 'Inter Variable', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --vq-font-mono: 'JetBrains Mono', SFMono-Regular, Consolas, monospace;
  --vq-font-serif: 'Newsreader Variable', Georgia, serif;

  /* Spacing Scale (4pt Grid) */
  --vq-space-1: 4px;
  --vq-space-2: 8px;
  --vq-space-3: 12px;
  --vq-space-4: 16px;
  --vq-space-6: 24px;
  --vq-space-8: 32px;
  --vq-space-12: 48px;
  --vq-space-16: 64px;

  /* Corner Radii */
  --vq-radius-sm: 3px;
  --vq-radius-md: 5px;
  --vq-radius-lg: 8px;
  --vq-radius-xl: 12px;

  /* Transitions */
  --vq-ease-spring: cubic-bezier(0.16, 1, 0.3, 1);
  --vq-duration-fast: 100ms;
  --vq-duration-base: 150ms;
  --vq-duration-slow: 200ms;
}
```

---

# 2. Tailwind CSS Configuration (`tailwind.config.js`)

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        vq: {
          dark: {
            base: '#090A0C',
            s1: '#101216',
            s2: '#171A21',
            s3: '#20242E',
            s4: '#2B303C',
            primary: '#F3F4F6',
            secondary: '#9CA3AF',
            tertiary: '#6B7280',
            hairline: '#1F242D',
            strong: '#374151',
          },
          light: {
            base: '#F8F9FA',
            s1: '#FFFFFF',
            s2: '#F1F3F5',
            s3: '#E9ECEF',
            primary: '#111827',
            secondary: '#4B5563',
            tertiary: '#9CA3AF',
            hairline: '#E2E8F0',
            strong: '#CBD5E1',
          },
          tungsten: {
            DEFAULT: '#D8A24A',
            hover: '#E5B35C',
            sub: '#2C2213',
          },
          emerald: '#10B981',
          crimson: '#EF4444',
          amber: '#F59E0B',
          cyan: '#06B6D4',
          offline: '#38BDF8',
          amethyst: '#8B5CF6',
          copper: '#E67E22',
        },
      },
      fontFamily: {
        sans: ['var(--vq-font-sans)'],
        mono: ['var(--vq-font-mono)'],
        serif: ['var(--vq-font-serif)'],
      },
      borderRadius: {
        'vq-sm': '3px',
        'vq-md': '5px',
        'vq-lg': '8px',
        'vq-xl': '12px',
      },
      transitionTimingFunction: {
        'vq-spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};
```

---

# 3. Theme JSON Definition (`theme.json`)

```json
{
  "$schema": "https://venqore.com/schemas/theme.v1.json",
  "name": "VenQore Master Theme",
  "version": "1.0.0",
  "author": "VenQore HIG Architecture Team",
  "tokens": {
    "color": {
      "brand": {
        "primary": { "value": "#D8A24A", "type": "color" },
        "hover": { "value": "#E5B35C", "type": "color" },
        "background_tint": { "value": "#2C2213", "type": "color" }
      },
      "dark": {
        "background": { "value": "#090A0C", "type": "color" },
        "surface_1": { "value": "#101216", "type": "color" },
        "surface_2": { "value": "#171A21", "type": "color" },
        "surface_3": { "value": "#20242E", "type": "color" },
        "text_primary": { "value": "#F3F4F6", "type": "color" },
        "border_hairline": { "value": "#1F242D", "type": "color" }
      },
      "semantic": {
        "success": { "value": "#10B981", "type": "color" },
        "error": { "value": "#EF4444", "type": "color" },
        "warning": { "value": "#F59E0B", "type": "color" },
        "info": { "value": "#06B6D4", "type": "color" },
        "offline": { "value": "#38BDF8", "type": "color" }
      }
    },
    "grid": {
      "base_unit": { "value": "4px", "type": "dimension" }
    }
  }
}
```
