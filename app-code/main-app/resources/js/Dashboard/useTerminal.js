import { useEffect, useMemo, useState } from 'react';

import { resolveTerminal, validateTerminal } from './terminalLaw';

/**
 * The Layout Law §10 composition for the current viewport.
 *
 *     const { axis, panes, cartLines, paneOf } = useTerminal('column');
 *
 *     {paneOf('catalog').residency === 'resident' && <Catalog width={paneOf('catalog').width} />}
 *
 * ── Why it listens to resize and not just to a breakpoint ───────────────────
 *
 * A terminal is exactly one viewport tall and never scrolls, so it has to react
 * to the actual viewport rather than to a breakpoint bucket. The law is swept
 * against every integer width from 320 to 3440 for the same reason: three of
 * its findings — the 1280 laptop cliff, the v1.0 subnav defect, and the fact
 * that a pushing sidebar can never arrive for free — are invisible if you only
 * test at the breakpoints you chose.
 *
 * ── The one thing a caller must handle ──────────────────────────────────────
 *
 * `viable` is false when the cart resolves below three lines. Below that it is
 * not a cart, it is a receipt preview, and the answer is the Counter variant —
 * which is why Counter is a first-class variant rather than Column's failure
 * mode. The hook falls back on its own; `viable` is there so a caller can also
 * tell the user why the shape changed.
 */
export function useTerminal(variant = 'column') {
    const [vp, setVp] = useState(() => ({
        width: typeof window === 'undefined' ? 1280 : window.innerWidth,
        height: typeof window === 'undefined' ? 720 : window.innerHeight,
    }));

    useEffect(() => {
        if (typeof window === 'undefined') return;

        let frame = null;
        const onResize = () => {
            // Coalesced to one frame: a drag-resize fires this hundreds of times
            // and re-laying a terminal per event is how a POS drops a barcode.
            if (frame) return;
            frame = requestAnimationFrame(() => {
                frame = null;
                setVp({ width: window.innerWidth, height: window.innerHeight });
            });
        };

        window.addEventListener('resize', onResize, { passive: true });
        window.addEventListener('orientationchange', onResize, { passive: true });
        return () => {
            if (frame) cancelAnimationFrame(frame);
            window.removeEventListener('resize', onResize);
            window.removeEventListener('orientationchange', onResize);
        };
    }, []);

    return useMemo(() => {
        let composition = resolveTerminal(variant, vp);

        // Counter exists so that below 600px the terminal is DESIGNED rather
        // than degraded. Falling back to it is the law working, not failing.
        if (!composition.viable && variant !== 'counter') {
            composition = resolveTerminal('counter', vp);
        }

        const byKey = new Map(composition.panes.map((p) => [p.key, p]));

        return {
            ...composition,
            requestedVariant: variant,
            fellBack: composition.variant !== variant,
            paneOf: (key) => byKey.get(key) ?? { key, residency: 'sheet', fit: null, width: 0 },
            problems: validateTerminal(composition),
        };
    }, [variant, vp.width, vp.height]);
}

export default useTerminal;
