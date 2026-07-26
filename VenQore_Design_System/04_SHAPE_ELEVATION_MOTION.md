# VenQore Design System — Section 5, 6 & 7: Shape, Elevation & Motion

> **Architectural Integrity**: VenQore's physical UI forms are grounded in precision machining. Curves are subtle, lighting is directional, and motion is near-instantaneous.

---

# SECTION 5: SHAPE LANGUAGE

## 1. Corner Radius Architecture

VenQore rejects bubbly 16px+ border radii and rounded pill forms for functional enterprise UI. Large border radii waste critical screen real estate in dense tables and form grids.

```
┌────────────────────────────────────────────────────────────────────────┐
│                      CORNER RADIUS SPECIFICATION                       │
├─────────────────┬───────────┬──────────────────────────────────────────┤
│ TOKEN           │ RADIUS    │ APPLIED COMPONENTS                       │
├─────────────────┼───────────┼──────────────────────────────────────────┤
│ --vq-radius-none│ 0px       │ Table rows, sticky headers, full banners │
│ --vq-radius-sm  │ 3px       │ Badges, inline code tags, micro inputs   │
│ --vq-radius-md  │ 5px       │ Standard buttons, form fields, cards     │
│ --vq-radius-lg  │ 8px       │ Modal dialogs, floating dropdown panels  │
│ --vq-radius-xl  │ 12px      │ Hero imagery, high-level dashboard cards │
└─────────────────┴───────────┴──────────────────────────────────────────┘
```

---

## 2. Geometry Across Components

* **Buttons & Inputs:** `5px` corner radius with `1px` subtle stroke border. Provides crisp, tactile alignment with neighboring grid elements.
* **Cards & Containers:** `5px` corner radius. In dense grids, cards align flush with 1px border gaps to simulate milled modular panels.
* **Modal Dialogs:** `8px` corner radius. Accompanied by a `1px` inner highlight hairline (`rgba(255,255,255,0.08)` in dark mode).
* **Badges & Status Tags:** `3px` corner radius with all-caps monospaced text. Never circular pills, maintaining a structured, architectural aesthetic.

---

# SECTION 6: ELEVATION & LIGHTING SYSTEM

## 1. Lighting Philosophy

VenQore uses a **Single 90° Overhead Light Source** model. 

In real-world physical equipment, light falls from above. Key highlights appear on top edges; ambient shadows gather underneath.

```
                  ┌───────────────────────────┐  ← Top Edge Highlight (1px Hairline: rgba(255,255,255,0.08))
                  │                           │
  OVERHEAD LIGHT  │     COMPONENT SURFACE     │
       │          │                           │
       ▼          └───────────────────────────┘  ← Bottom Shadow (0 4px 12px rgba(0,0,0,0.40))
```

---

## 2. Elevation Levels & CSS Variables

```css
:root {
  /* Level 0: Flat Base Canvas */
  --vq-elevation-0: none;
  
  /* Level 1: Subtly Raised Surface (Cards, Active Row Focus) */
  --vq-elevation-1: 
    0 1px 2px 0 rgba(0, 0, 0, 0.05),
    inset 0 1px 0 0 rgba(255, 255, 255, 0.04);
    
  /* Level 2: Interactive Elevate (Dropdown Menus, Tooltips) */
  --vq-elevation-2: 
    0 4px 12px -2px rgba(0, 0, 0, 0.25),
    0 2px 4px -1px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 0 rgba(255, 255, 255, 0.06);

  /* Level 3: Overlay Windows (Modals, Slide-over Drawers) */
  --vq-elevation-3: 
    0 20px 32px -8px rgba(0, 0, 0, 0.50),
    0 8px 16px -4px rgba(0, 0, 0, 0.30),
    inset 0 1px 0 0 rgba(255, 255, 255, 0.08);

  /* Inner Bevel stroke rule for Dark Mode depth */
  --vq-border-hairline-dark: 1px solid rgba(255, 255, 255, 0.07);
}
```

---

## 3. Glass, Blur, & Surface Texture Rules

* 🚫 **NO Blurry Glassmorphism on Data Tables:** Backdrop blur is strictly banned on data grids because backdrop filters cause text anti-aliasing artifacts and lag lower-spec POS hardware GPUs.
* **Modal Backdrop Overlay:** Modals use a clean, solid dark backdrop tint: `rgba(9, 10, 12, 0.75)` with `backdrop-filter: blur(4px)`.
* **Micro-Noise Texture:** Optional `1.5%` monochromatic noise texture applied strictly to background canvas panels to prevent banding on OLED POS displays.

---

# SECTION 7: MOTION LANGUAGE

## 1. Animation Philosophy

In a fast-paced retail or accounting environment, slow transitions are considered system latency. Motion in VenQore is functional, spatial, and ultra-fast.

* **Maximum Animation Duration:** `150ms` for micro-interactions, `200ms` for panel transitions.
* **Easing Function:** Custom Apple/Linear deceleration spring curve: `cubic-bezier(0.16, 1, 0.3, 1)`.

---

## 2. Standard Motion Tokens

```css
:root {
  /* Motion Durations */
  --vq-motion-fast: 100ms;
  --vq-motion-base: 150ms;
  --vq-motion-slow: 200ms;

  /* Motion Easing Curves */
  --vq-ease-out-quint: cubic-bezier(0.22, 1, 0.36, 1);
  --vq-ease-spring: cubic-bezier(0.16, 1, 0.3, 1);
  --vq-ease-linear: cubic-bezier(0, 0, 1, 1);
}
```

---

## 3. Interaction Motion Rules

| Interaction | Duration | Easing | Transform / Effect |
| :--- | :--- | :--- | :--- |
| **Button Click Press** | `80ms` | `ease-out` | `scale(0.985)` (tactile physical depress) |
| **Dropdown Popover Open** | `120ms` | `--vq-ease-spring` | `translateY(-4px) -> translateY(0)`, `opacity: 0 -> 1` |
| **Table Row Hover Accent** | `100ms` | `ease-out` | Background shift (`var(--vq-dark-bg-surface-4)`) |
| **Notification Toast In** | `180ms` | `--vq-ease-spring` | `translateX(16px) -> translateX(0)` |
| **Skeleton Pulse (Loading)**| `1200ms`| `--vq-ease-linear` | Opacity pulse `0.4 -> 0.8 -> 0.4` |
| **Data Metric Flash Update**| `300ms` | `ease-out` | Subtle text color glow flash (`#D8A24A`) |
