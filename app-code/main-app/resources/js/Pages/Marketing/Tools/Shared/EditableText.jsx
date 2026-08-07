import React, { useState, useRef, useEffect } from 'react';
import { Pencil } from 'lucide-react';

/**
 * EditableText — click-to-edit inline text, the core primitive behind every
 * "the preview IS the editor" document tool (Invoice, Receipt, PO, Quote,
 * Packing Slip, Credit Note, Price Tag, Label Sheet, Stock Count, Cash
 * Drawer). Renders as plain styled text/number until clicked, then swaps to
 * an input/textarea sized and styled to match, and commits back to plain
 * text on blur or Enter (Escape reverts).
 *
 * DISCOVERABILITY: a document pre-filled with realistic sample data reads
 * as "already finished" — nothing about plain text signals "you can change
 * this." So every field carries a permanent (not hover-only) dashed
 * underline, a small pencil glyph that fades in on hover, and — for the
 * first few seconds after the page loads — a soft indigo pulse so first-
 * time visitors notice the whole document is interactive before they've
 * touched anything. Pass `pulse={false}` to opt a field out (e.g. inside a
 * tight table cell where the pulse ring would clip awkwardly).
 *
 * Deliberately dumb/controlled: parent owns the value and onChange, this
 * component only owns the "am I currently being edited" boolean and a
 * local draft string so keystrokes don't round-trip through the parent on
 * every character (matters once a document has 20+ editable fields).
 */
export default function EditableText({
    value,
    onChange,
    placeholder = 'Click to edit',
    as = 'input', // 'input' | 'textarea' | 'number' | 'date'
    className = '',
    editClassName = '',
    multiline = false,
    rows = 2,
    emptyLabel = null, // shown (styled as placeholder) when value is empty and not focused
    formatDisplay = null, // (value) => string, for read-mode-only formatting (e.g. currency)
    min,
    max,
    step,
    pulse = true,
    inline = true, // set false for fields that should be block-level (own line) rather than inline-block
}) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value ?? '');
    const [showPulse, setShowPulse] = useState(pulse);
    const ref = useRef(null);

    // Pulse fades out on its own after a few seconds, or immediately the
    // first time the user interacts with ANY editable field on the page
    // (see the 'venqore-tool-edited' event dispatched below) — once they've
    // discovered the pattern once, every other field can stop announcing it.
    useEffect(() => {
        if (!pulse) return undefined;
        const stop = () => setShowPulse(false);
        const timer = setTimeout(stop, 4500);
        window.addEventListener('venqore-tool-edited', stop);
        return () => { clearTimeout(timer); window.removeEventListener('venqore-tool-edited', stop); };
    }, [pulse]);

    useEffect(() => {
        if (!editing) setDraft(value ?? '');
    }, [value, editing]);

    useEffect(() => {
        if (editing && ref.current) {
            ref.current.focus();
            if (ref.current.select) ref.current.select();
        }
    }, [editing]);

    const commit = () => {
        setEditing(false);
        if (draft !== value) onChange(draft);
        window.dispatchEvent(new Event('venqore-tool-edited'));
    };

    const cancel = () => {
        setDraft(value ?? '');
        setEditing(false);
    };

    const onKeyDown = (e) => {
        if (e.key === 'Enter' && !multiline) {
            e.preventDefault();
            commit();
        } else if (e.key === 'Enter' && multiline && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            commit();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            cancel();
        }
    };

    if (editing) {
        const sharedProps = {
            ref,
            value: draft,
            onChange: (e) => setDraft(e.target.value),
            onBlur: commit,
            onKeyDown,
            placeholder,
            className: `bg-indigo-50 dark:bg-indigo-500/10 outline-none ring-2 ring-indigo-400/60 rounded px-1 -mx-1 ${className} ${editClassName}`,
        };

        if (as === 'textarea' || multiline) {
            return <textarea {...sharedProps} rows={rows} className={`${sharedProps.className} w-full resize-none block`} />;
        }
        if (as === 'number') {
            return <input {...sharedProps} type="number" min={min} max={max} step={step ?? 'any'} />;
        }
        if (as === 'date') {
            return <input {...sharedProps} type="date" />;
        }
        return <input {...sharedProps} type="text" />;
    }

    const isEmpty = value === '' || value === null || value === undefined;
    const display = isEmpty ? (emptyLabel ?? placeholder) : (formatDisplay ? formatDisplay(value) : value);

    return (
        <span
            role="button"
            tabIndex={0}
            onClick={() => setEditing(true)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setEditing(true); } }}
            className={`group/edit relative ${inline ? 'inline-block' : 'block'} cursor-text rounded px-1.5 -mx-1.5 py-0.5 -my-0.5 transition-colors
                border-b border-dashed border-slate-300 dark:border-slate-600
                hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:border-indigo-400 dark:hover:border-indigo-400
                ${showPulse ? 'animate-[editablePulse_1.8s_ease-in-out_2]' : ''}
                ${isEmpty ? 'italic text-slate-500 dark:text-slate-600' : ''} ${className}`}
        >
            {display}
            <Pencil
                size={11}
                aria-hidden="true"
                className="hidden sm:inline-block ml-1 -mt-0.5 align-middle opacity-0 group-hover/edit:opacity-60 text-indigo-500 transition-opacity"
            />
        </span>
    );
}
