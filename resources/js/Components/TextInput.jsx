import React, { forwardRef, useEffect, useRef } from 'react';
import { Input } from '@/Components/ds';

/**
 * Breeze's text input, backed by the V6 `Input`.
 *
 * Keeps the `isFocused` prop the Breeze auth pages pass, and the ref forward,
 * because those are the only two things that ever used it.
 *
 * The V6 input is 48px tall with a 16px font — that floor is not cosmetic.
 * Anything smaller makes iOS Safari zoom the viewport on focus, which reads as
 * the page breaking.
 */
export default forwardRef(function TextInput(
    // `className` is accepted and dropped — the V6 `Input` declares no such
    // prop, so React was discarding it silently anyway (ds/no-unknown-prop).
    { type = 'text', className: _ignoredClassName, isFocused = false, ...props },
    ref,
) {
    const local = useRef(null);
    const el = ref || local;

    useEffect(() => {
        if (isFocused) el.current?.focus();
    }, [isFocused, el]);

    return <Input ref={el} type={type} {...props} />;
});
