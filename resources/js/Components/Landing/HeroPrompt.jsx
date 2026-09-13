/**
 * HeroPrompt — the landing page's "describe your business" box.
 *
 * Pattern: Kokonut UI "AI Input With Search" (MIT, via 21st.dev — source kept
 * in extras/21st-components/ai-chat/) — an auto-resizing textarea inside one
 * rounded surface with the actions on a bottom row. Rebuilt in JSX on V6
 * tokens (site-chrome.css → .vq-hp*).
 *
 * Fixes the three things the old legacy-JS box got wrong:
 *  1. It showed one line and scrolled inside itself (with a visible scrollbar)
 *     as soon as the description wrapped. Now it grows with the text up to six
 *     lines and only then scrolls, with a thin themed scrollbar.
 *  2. Coming back with the browser Back button showed the previous search still
 *     sitting in the box (bfcache / form restoration). The value is React
 *     state that starts empty, autocomplete is off, and a `pageshow` from the
 *     back-forward cache clears it.
 *  3. The go button scrolled to a demo section instead of building. Enter (or
 *     the button) now goes straight to /build-workspace with the text.
 */
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, Building2, Check, Mic, Square, X } from 'lucide-react';

const MAX = 600;
const MAX_ROWS = 6;

const EXAMPLES = [
    'A 3-branch pharmacy with batch expiry and 30-day distributor credit',
    'Wholesale auto parts, 10,000 SKUs, tiered prices and delivery routes',
    'Bakery with a central kitchen, recipe costing and four shop drops',
    'Hardware store with trade credit for contractors and unit conversions',
    'Fashion boutique with size/colour variants selling on Amazon too',
];

const CHIPS = [
    { key: 'pharmacy', label: 'Pharmacy', text: 'I run a 3-branch pharmacy with batch expiry tracking and distributor 30-day credit terms.' },
    { key: 'wholesale', label: 'Wholesale distributor', text: 'Auto parts wholesale with 10,000 SKUs, bulk discount tiers, and delivery to shops on credit.' },
    { key: 'cafe', label: 'Restaurant & café', text: 'Artisan bakery and central kitchen with recipe costing, ingredient batching, and 4 shop drops.' },
    { key: 'hardware', label: 'Hardware & parts', text: 'Hardware store with 9,000 SKUs, FIFO valuation, unit conversions and contractor trade credit.' },
    { key: 'multi', label: 'Multi-branch', text: 'Multi-branch retail with a size/colour variant matrix, synced to Amazon and WooCommerce.' },
];

import BusinessPickerModal from './BusinessPickerModal';

export default function HeroPrompt({ action = '/build-workspace' }) {
    const [value, setValue] = useState('');
    const [focused, setFocused] = useState(false);
    const [exampleIx, setExampleIx] = useState(0);
    const [picker, setPicker] = useState(false);
    const [listening, setListening] = useState(false);
    const [speechOk, setSpeechOk] = useState(false);
    const taRef = useRef(null);
    const recRef = useRef(null);

    /* Grow with the content; scroll only past MAX_ROWS lines. */
    const fit = useCallback(() => {
        const ta = taRef.current;
        if (!ta) return;
        ta.style.height = 'auto';
        const cs = getComputedStyle(ta);
        const line = parseFloat(cs.lineHeight) || 30;
        const pad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
        const max = line * MAX_ROWS + pad;
        const next = Math.min(ta.scrollHeight, max);
        ta.style.height = `${next}px`;
        ta.style.overflowY = ta.scrollHeight > max ? 'auto' : 'hidden';
    }, []);
    useLayoutEffect(fit, [value, fit]);
    useEffect(() => {
        window.addEventListener('resize', fit);
        return () => window.removeEventListener('resize', fit);
    }, [fit]);

    /* Back/forward cache restores the whole page, React state included. */
    useEffect(() => {
        const onShow = (e) => { if (e.persisted) setValue(''); };
        window.addEventListener('pageshow', onShow);
        return () => window.removeEventListener('pageshow', onShow);
    }, []);

    /* Rotate the placeholder while the box is empty and unfocused. */
    useEffect(() => {
        if (value || focused) return undefined;
        const t = window.setInterval(() => setExampleIx((i) => (i + 1) % EXAMPLES.length), 3600);
        return () => window.clearInterval(t);
    }, [value, focused]);

    useEffect(() => {
        setSpeechOk(typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition));
        return () => recRef.current?.abort?.();
    }, []);

    const submit = (e) => {
        e?.preventDefault();
        const v = value.trim();
        if (!v) { taRef.current?.focus(); return; }
        window.location.href = `${action}?prompt=${encodeURIComponent(v.slice(0, MAX))}`;
    };

    const fill = (text) => {
        setValue(text.slice(0, MAX));
        requestAnimationFrame(() => {
            const ta = taRef.current;
            if (!ta) return;
            ta.focus();
            ta.setSelectionRange(ta.value.length, ta.value.length);
        });
    };

    const toggleVoice = () => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) return;
        if (listening) { recRef.current?.stop(); return; }
        const rec = new SR();
        rec.lang = navigator.language || 'en-US';
        rec.interimResults = true;
        rec.continuous = false;
        const base = value ? `${value.trim()} ` : '';
        rec.onresult = (ev) => {
            const said = Array.from(ev.results).map((r) => r[0].transcript).join('');
            setValue((base + said).slice(0, MAX));
        };
        rec.onend = () => setListening(false);
        rec.onerror = () => setListening(false);
        recRef.current = rec;
        setListening(true);
        rec.start();
    };

    const left = MAX - value.length;

    return (
        <div className="vq-hp">
            <form className={`vq-hp__single-line${focused ? ' is-focused' : ''}`} onSubmit={submit} autoComplete="off">
                <label htmlFor="vq-hero-describe" className="vq-sr-only">Describe your business</label>
                <div className="vq-hp__field">
                    {!value && (
                        <span className="vq-hp__placeholder" aria-hidden="true" key={exampleIx}>
                            Describe your business (e.g. "{EXAMPLES[exampleIx]}")…
                        </span>
                    )}
                    <textarea
                        id="vq-hero-describe"
                        ref={taRef}
                        rows={1}
                        value={value}
                        maxLength={MAX}
                        autoComplete="off"
                        autoCorrect="on"
                        spellCheck
                        enterKeyHint="go"
                        onChange={(e) => setValue(e.target.value)}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) submit(e);
                        }}
                        className="vq-hp__input"
                    />
                </div>
                <div className="vq-hp__actions">
                    {left <= 100 && <span className="vq-hp__count" aria-live="polite">{left}</span>}
                    {speechOk && (
                        <button
                            type="button"
                            className={`vq-hp__icon${listening ? ' is-live' : ''}`}
                            onClick={toggleVoice}
                            aria-pressed={listening}
                            aria-label={listening ? 'Stop voice input' : 'Describe it by voice'}
                            title={listening ? 'Stop' : 'Speak instead'}
                        >
                            {listening ? <Square size={14} aria-hidden="true" /> : <Mic size={17} aria-hidden="true" />}
                        </button>
                    )}
                    <button type="submit" className="vq-hp__go" disabled={!value.trim()}>
                        Build my system <ArrowRight size={16} aria-hidden="true" className="vq-btn__arrow" />
                    </button>
                </div>
            </form>

            <div className="vq-hp__chips-row" role="group" aria-label="Examples">
                <button type="button" className="vq-hp__pick-btn" onClick={() => setPicker(true)}>
                    <Building2 size={15} aria-hidden="true" /> Select your business
                </button>
                {CHIPS.map((c) => (
                    <button key={c.key} type="button" className="vq-chip vq-chip--onHero vq-hp__chip" onClick={() => fill(c.text)}>{c.label}</button>
                ))}
            </div>
            <p className="vq-caption vq-hero-caret vq-hp__hint">Enter to build · Shift + Enter for a new line · nothing goes live until you approve it</p>

            {picker && (
                <BusinessPickerModal
                    onClose={() => setPicker(false)}
                    onPick={(p) => { setPicker(false); fill(p.text); }}
                />
            )}
        </div>
    );
}
