import React from 'react';

/**
 * Midnight Nebula Container
 * 
 * A premium, high-depth container style that combines a deep dark background 
 * with ambient colored light "orbs" and a cinematic grain texture.
 * 
 * @param {React.ReactNode} children - The content to be wrapped (text, icons, etc.)
 * @param {string} className - Additional classes for the container (e.g., width, height, padding)
 * @param {boolean} active - Whether the effect is active (default: true)
 * @param {string} primaryColor - The primary glow color (default: indigo)
 * @param {string} secondaryColor - The secondary glow color (default: purple)
 */
const MidnightNebula = ({
    children,
    className = "",
    active = true,
    primaryColor = "indigo",
    secondaryColor = "purple"
}) => {
    if (!active) {
        return <div className={`relative ${className}`}>{children}</div>;
    }

    return (
        <div className={`relative overflow-hidden ${className}`}>
            {/* LAYER 1: Base Background */}
            <div className="absolute inset-0 bg-slate-900 z-0"></div>

            {/* LAYER 2: Ambient Orbs (The Glow) */}
            {/* Top-Right Orb */}
            <div className={`absolute top-0 right-0 w-32 h-32 bg-${primaryColor}-600/40 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2`}></div>
            {/* Bottom-Left Orb */}
            <div className={`absolute bottom-0 left-0 w-32 h-32 bg-${secondaryColor}-600/30 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3`}></div>

            {/* LAYER 3: Texture (The Film Grain) */}
            <div className="absolute inset-0 bg-[url('/images/noise.svg')] opacity-20"></div>

            {/* LAYER 4: Accent (The Laser Line) */}
            <div className={`absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-${primaryColor}-500 to-transparent opacity-50`}></div>

            {/* CONTENT */}
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
};

export default MidnightNebula;

/**
 * USAGE EXAMPLES:
 * 
 * 1. Standard Button:
 * <MidnightNebula className="rounded-2xl p-4">
 *    <span className="text-white font-bold">Click Me</span>
 * </MidnightNebula>
 * 
 * 2. Active Sidebar Item:
 * <MidnightNebula className="rounded-xl p-3" active={isActive}>
 *    <div className="flex items-center gap-2 text-white">
 *       <Icon /> <span>Dashboard</span>
 *    </div>
 * </MidnightNebula>
 */
