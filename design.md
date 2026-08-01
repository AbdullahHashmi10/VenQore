# VenQore POS — Master Design System (`design.md`)

Welcome to the official **VenQore POS & Public Tools Design System**. This document defines the visual language, design architecture, color tokens, typography, component guidelines, and the signature **Midnight Nebula** aesthetic used across the entire application and landing pages.

---

## 🌌 1. Core Visual Identity: "Midnight Nebula"

**Midnight Nebula** is VenQore’s signature premium dark-mode aesthetic. It combines deep dark voids (`bg-slate-900` / `bg-slate-950`) with soft ambient light orbs, subtle film-grain texture, and precision gradient laser lines to create a living, high-depth interface.

### The 4-Layer Stacking Recipe
Every Midnight Nebula element is built by stacking **4 distinct visual layers**:

1. **Layer 1: The Void (Base Canvas)**  
   `bg-slate-900` or `bg-slate-950` solid container with `relative overflow-hidden`.
2. **Layer 2: Ambient Orbs (The Glow)**  
   Two high-blur colored circles positioned at opposite corners (Indigo & Purple or Emerald & Teal):
   - Top Right: `absolute top-0 right-0 w-32 h-32 bg-indigo-600/40 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2`
   - Bottom Left: `absolute bottom-0 left-0 w-32 h-32 bg-purple-600/30 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3`
3. **Layer 3: Tactile Film Grain (Texture Overlay)**  
   `absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none`
4. **Layer 4: Laser Highlight Line (Edge Accent)**  
   `absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50`

---

## 🎨 2. Color Palette & Design Tokens

### Dark Mode Tokens (Primary Theme)
- **Background Voids**: `bg-slate-950` (Page Root), `bg-slate-900` (Cards & Containers), `bg-slate-800/80` (Elevated Panels)
- **Borders & Dividers**: `border-slate-800`, `border-slate-700/60`, `border-indigo-500/20`
- **Primary Accents**:
  - Indigo / Violet: `from-indigo-600 to-purple-600` (Primary Brand & CTA)
  - Cyan / Sky: `from-cyan-500 to-blue-600` (Data & Highlights)
  - Emerald / Teal: `from-emerald-500 to-teal-600` (Success & Positive Profit Metrics)
- **Text Hierarchies**:
  - Primary Text: `text-white` / `text-slate-100`
  - Muted Text: `text-slate-400`
  - Subdued Labels: `text-slate-500`

### Light Mode Fallback Tokens
- **Background Canvas**: `bg-slate-50`, `bg-white`
- **Borders**: `border-slate-200`, `border-slate-300`
- **Primary Text**: `text-slate-900`
- **Muted Text**: `text-slate-600`

---

## 🖋️ 3. Typography & Layout Hierarchy

- **Font Family**: Inter, System UI, sans-serif
- **Headings**:
  - `H1 (Page Titles)`: `text-3xl sm:text-4xl font-extrabold tracking-tight text-white`
  - `H2 (Section Titles)`: `text-xl sm:text-2xl font-bold tracking-tight text-slate-100`
  - `H3 (Card Titles)`: `text-lg font-semibold text-slate-200`
- **Gradient Text**:
  ```html
  <span class="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
    VenQore POS
  </span>
  ```

---

## 📐 4. Spacing & Container Boundaries

- **Full-Width Landing & Tool Shell**: `max-w-full` with responsive padding (`px-2 sm:px-4 md:px-6`).
- **Sidebar Spacing**: `gap-4 md:gap-6` between main content and sidebars.
- **Sticky Sidebars**: Left navigation and right promotional rails feature `sticky top-36 self-start` positioning with `overflow-x-clip` on parent containers to guarantee sticky behavior without breaking vertical scrolling.

---

## 📦 5. React Component Implementations

### Reusable `MidnightNebula` Component (`resources/js/Components/MidnightNebula.jsx`)

```jsx
import React from 'react';

export default function MidnightNebula({
    children,
    className = '',
    primaryColor = 'indigo',
    secondaryColor = 'purple',
    showLine = true,
}) {
    return (
        <div className={`relative overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 ${className}`}>
            {/* Layer 1: Ambient Orbs */}
            <div className={`absolute top-0 right-0 w-40 h-40 bg-${primaryColor}-600/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none`} />
            <div className={`absolute bottom-0 left-0 w-40 h-40 bg-${secondaryColor}-600/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none`} />

            {/* Layer 2: Film Grain */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />

            {/* Layer 3: Laser Highlight */}
            {showLine && (
                <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent pointer-events-none" />
            )}

            {/* Layer 4: Content */}
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
}
```

---

## 🚀 6. Landing Page & Public Tools Standards

1. **Maximized Screen Space**: Public tools utilize `max-w-full` layout wrappers with high-density control panels to provide ample room for document generators, receipt previews, and AI scan tools.
2. **Sticky Navigation & Promotion Rails**: Both navigation sidebar (`ToolsSidebar.jsx`) and promotion rail (`HousePromo.jsx`) remain sticky on screen during vertical scrolling.
3. **No Ads & Zero Tracker Guarantee**: Public tools maintain a clean, distraction-free environment focused entirely on utility.
