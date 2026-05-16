# Midnight Nebula Design System

**"Midnight Nebula"** is the signature premium aesthetic used in the VenQore POS application. It combines deep dark backgrounds with ambient colored light and cinematic grain to create a high-depth, "alive" interface element.

## 🎨 The Recipe

To recreate this look, you need **4 distinct layers** stacked using absolute positioning:

1.  **The Base (The Void)**: A deep `bg-slate-900` canvas.
2.  **The Ambient Orbs (The Glow)**: Two blurred, colored circles at opposite corners (Indigo & Purple).
3.  **The Texture (The Film Grain)**: A noise SVG overlay (`opacity-20`) for a tactile feel.
4.  **The Accent (The Laser Line)**: A 1px gradient line at the bottom.

## 📦 React Component

We have a reusable component located at: `resources/js/Components/MidnightNebula.jsx`

### Usage

```jsx
import MidnightNebula from '@/Components/MidnightNebula';

// Basic Usage
<MidnightNebula className="rounded-2xl p-4">
    <h1 className="text-white font-bold">Premium Card</h1>
</MidnightNebula>

// With Custom Colors
<MidnightNebula 
    className="rounded-xl p-3" 
    primaryColor="emerald" 
    secondaryColor="teal"
>
    <span className="text-white">Success State</span>
</MidnightNebula>
```

## 📋 Copy-Paste Tailwind Code

If you cannot use the React component, use this raw HTML/Tailwind structure:

```html
<div class="relative overflow-hidden rounded-2xl bg-slate-900 p-4 group">
    
    <!-- LAYER 1: Ambient Orbs -->
    <div class="absolute top-0 right-0 w-32 h-32 bg-indigo-600/40 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
    <div class="absolute bottom-0 left-0 w-32 h-32 bg-purple-600/30 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3"></div>

    <!-- LAYER 2: Noise Texture -->
    <div class="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>

    <!-- LAYER 3: Bottom Highlight Line -->
    <div class="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50"></div>

    <!-- CONTENT (Must be relative & z-10) -->
    <div class="relative z-10 text-white">
        Your Content Here
    </div>

</div>
```
