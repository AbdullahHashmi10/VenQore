import React, { useRef, useEffect } from 'react';

/**
 * WheelInput - A number input that correctly supports onWheel scroll
 * without triggering "Unable to preventDefault inside passive event listener" warnings.
 *
 * React 17+ attaches all events passively, which blocks e.preventDefault() in onWheel.
 * This component attaches a real non-passive native wheel listener via a ref instead.
 *
 * Usage: Same as <input type="number"> but pass onWheel as a prop.
 */
export default function WheelInput({ onWheel, style, className, ...props }) {
    const ref = useRef(null);
    // Keep the handler in a ref so the effect closure never goes stale
    const onWheelRef = useRef(onWheel);

    useEffect(() => {
        onWheelRef.current = onWheel;
    }, [onWheel]);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const handler = (e) => {
            if (onWheelRef.current) {
                onWheelRef.current(e);
            }
        };

        el.addEventListener('wheel', handler, { passive: false });
        return () => el.removeEventListener('wheel', handler);
    }, []); // Runs once on mount only

    return (
        <input
            ref={ref}
            className={className}
            style={style}
            {...props}
        />
    );
}
