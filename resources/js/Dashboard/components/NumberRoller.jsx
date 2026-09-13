import React, { useEffect, useRef } from 'react';

/**
 * NumberRoller — a figure that is seen to change.
 *
 * Each digit lives in a 0–9 column that slides to its new glyph; separators,
 * currency prefixes and units swap without motion. So "Rs 12,340 → Rs 12,910"
 * rolls two columns and leaves the rest of the string still, which reads as
 * *this number moved* rather than *this element was replaced*.
 *
 * ── Why the DOM is written by hand ──────────────────────────────────────────
 *
 * React re-renders by diffing, and a diff cannot express "keep this element,
 * change only its transform, and stagger the change by position". Rendering
 * ten `<i>` per digit through JSX and driving them with state would rebuild
 * the column on every tick and lose the transition. So the columns are built
 * once, imperatively, and only the transform is touched afterwards.
 *
 * The rebuild is keyed on the number's *shape* — the string with every digit
 * flattened to `D`. Same shape, the digits slide. Different shape (a comma
 * appeared, the currency changed, the value went negative), the whole thing is
 * rebuilt, because there is no honest animation between "Rs 990" and
 * "Rs 1,010" — the columns do not correspond.
 *
 * Ported from the v6 card builder's `buildRoller` / `setRoller`.
 */

const DIGITS = '0123456789';

/** The string with every digit flattened. `Rs 1,240` → `Rs D,DDD`. */
const shapeOf = (s) => String(s).replace(/\d/g, 'D');

/**
 * Build the columns from scratch.
 *
 * Each digit gets its own 10-glyph stack offset by -10% per step, and a delay
 * proportional to its position so the number settles left-to-right instead of
 * every column landing on the same frame.
 */
function build(el, text) {
    const s = String(text ?? '');
    el.dataset.shape = shapeOf(s);
    el.dataset.value = s;

    let html = '';
    let digitIndex = 0;

    for (const ch of s) {
        if (DIGITS.includes(ch)) {
            html += '<span class="nf-c nf-d">'
                + `<span class="nf-col" style="transform:translateY(${-ch * 10}%);`
                + `transition-delay:${digitIndex * 22}ms">`
                + '<i>0</i><i>1</i><i>2</i><i>3</i><i>4</i>'
                + '<i>5</i><i>6</i><i>7</i><i>8</i><i>9</i>'
                + '</span></span>';
            digitIndex += 1;
        } else {
            html += `<span class="nf-c nf-s">${ch === ' ' ? '&nbsp;' : escapeHtml(ch)}</span>`;
        }
    }

    el.innerHTML = html;
}

/**
 * The only text that reaches innerHTML is a single non-digit character out of
 * a formatted number — a comma, a space, a currency symbol, a minus. Escaping
 * it anyway costs four replacements and means this function stays safe if it
 * is ever handed something less predictable.
 */
function escapeHtml(ch) {
    switch (ch) {
        case '&': return '&amp;';
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '"': return '&quot;';
        default: return ch;
    }
}

/** Same shape → slide the columns that moved. New shape → rebuild. */
function set(el, text) {
    if (!el) return;
    const s = String(text ?? '');

    if (el.dataset.value === s) return;
    if (el.dataset.shape !== shapeOf(s)) { build(el, s); return; }

    el.dataset.value = s;

    const columns = el.querySelectorAll('.nf-d .nf-col');
    let i = 0;
    for (const ch of s) {
        if (!DIGITS.includes(ch)) continue;
        const column = columns[i];
        i += 1;
        if (column) column.style.transform = `translateY(${-ch * 10}%)`;
    }
}

export default function NumberRoller({ value, className = '', title }) {
    const ref = useRef(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        // First run builds; every run after it slides, unless the shape moved.
        if (el.dataset.shape === undefined) build(el, value);
        else set(el, value);
    }, [value]);

    return (
        <span
            ref={ref}
            className={`nf ${className}`.trim()}
            title={title}
            /*
             * `role="img"` with an aria-label, not role="text".
             *
             * Each digit is a stack of all ten glyphs, so the accessible name
             * computed from the DOM is "0123456789" once per column — a screen
             * reader would read "Rs 920,625" as roughly ninety characters of
             * nonsense. An img role makes the element a single labelled object
             * and its children ignored, which is exactly the intent: this is a
             * picture of a number, and the label is the number.
             */
            role="img"
            aria-label={String(value ?? '')}
        />
    );
}
