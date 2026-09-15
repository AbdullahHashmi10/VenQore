import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

import { periodChoices, periodLabel } from '../periods';

/**
 * The period switcher that lives on the card face.
 *
 * "Rank 2 · Adjust — one gesture away, contextual to the selected object."
 * Which window a figure covers is the single most common thing a person wants
 * to change about a card, and until now changing it meant opening the editor,
 * which is where rank-3 configuration lives. This is that one gesture.
 *
 * The card is the object, so the control is on the card. It is not a board
 * filter: two cards can sit side by side showing today and this month, which
 * is exactly how you read a spike.
 */
export default function CardPeriodPicker({ value, definition, onChange, disabled }) {
    const [open, setOpen] = useState(false);
    const wrapRef = useRef(null);

    const choices = periodChoices(definition, value);

    /* Close on an outside press or on Escape.
       `pointerdown` rather than `click`: a click listener fires after the
       button's own onClick, so opening the menu immediately closed it. */
    useEffect(() => {
        if (!open) return undefined;

        const onDown = (e) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
        };
        const onKey = (e) => {
            if (e.key === 'Escape') setOpen(false);
        };

        document.addEventListener('pointerdown', onDown);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('pointerdown', onDown);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    // One option is not a choice. Show the window as a plain label instead of
    // a control that does nothing when pressed.
    if (choices.length < 2 || disabled) {
        return <span className="vqc-per-b" aria-hidden="true">{periodLabel(value)}</span>;
    }

    return (
        <span className="vqc-per" ref={wrapRef}>
            <button
                type="button"
                className="vqc-per-b"
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-label={`Period: ${periodLabel(value)}`}
                onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
            >
                {periodLabel(value)}
                <ChevronDown size={10} strokeWidth={3} aria-hidden="true" />
            </button>

            {open && (
                <span className="vqc-per-m" role="listbox">
                    {choices.map((key) => (
                        <button
                            key={key}
                            type="button"
                            role="option"
                            aria-selected={key === value}
                            className={`vqc-per-i${key === value ? ' is-on' : ''}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                setOpen(false);
                                if (key !== value) onChange(key);
                            }}
                        >
                            {periodLabel(key)}
                        </button>
                    ))}
                </span>
            )}
        </span>
    );
}
