/**
 * The one React-aware corner of the theme engine.
 *
 * Kept separate from `runtime.js` so that plain utility modules — and anything
 * running outside the React tree — can read theme colours without pulling in
 * React and the theme context.
 */

import { useTheme } from '@/Contexts/ThemeContext';
import { getSemanticTokens } from './runtime.js';

/**
 * Mode-aware surface and text colours, for the cases where a semantic value is
 * needed as a plain string rather than a class — most often a chart, where SVG
 * presentation attributes cannot accept `var()`.
 *
 *     const t = useSemanticTokens();
 *     <CartesianGrid stroke={t.border} />
 *     <XAxis tick={{ fill: t['ink-muted'] }} />
 *
 * Anywhere a class will do, use the class (`text-ink-muted`): no JavaScript, no
 * re-render when the user toggles dark mode.
 */
export function useSemanticTokens() {
    const { isDarkMode } = useTheme();
    return getSemanticTokens(isDarkMode);
}

export default useSemanticTokens;
