/**
 * CookieConsent — first-layer banner + preferences dialog for the public site.
 *
 * Pattern: the 21st.dev "Banner / BannerCookie" (Serafim, MIT — see
 * extras/21st-components/cookie/) — a compact card with Accept / Decline on
 * the first layer — extended with a category dialog. Rebuilt on V6 classes
 * (site-chrome.css → .vq-cookie*) so it follows the theme and the token set.
 *
 * Rules it keeps:
 *  - "Reject non-essential" is on the FIRST layer and exactly as easy as
 *    "Accept all" (GDPR/ePrivacy expectation; hiding reject behind
 *    "Customize" is the dark pattern regulators name).
 *  - Nothing optional is on until the visitor says so.
 *  - The footer's "Cookie settings" reopens the dialog
 *    (window event 'open-cookie-preferences').
 *  - Storage keys are unchanged, so existing choices survive this rewrite.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BarChart3, Cookie, Megaphone, ShieldCheck, X } from 'lucide-react';

const STORAGE_KEY = 'venqore_cookie_preferences_v1';
const CONSENT_KEY = 'venqore_cookie_consent_v1';

export const DEFAULT_COOKIE_CATEGORIES = [
    {
        id: 'essential',
        name: 'Essential',
        description: 'Sign-in, security, and keeping your workspace and choices working. Always on.',
        icon: ShieldCheck,
        isEssential: true,
    },
    {
        id: 'analytics',
        name: 'Analytics',
        description: 'Anonymous measurements of which pages load slowly and which features get used. No personal profile.',
        icon: BarChart3,
    },
    {
        id: 'marketing',
        name: 'Marketing',
        description: 'Lets us show relevant VenQore updates on other sites you visit.',
        icon: Megaphone,
    },
];

const readStored = (count) => {
    try {
        if (localStorage.getItem(CONSENT_KEY) !== 'true') return null;
        const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
        return Array.isArray(parsed) && parsed.length === count ? parsed : null;
    } catch (e) {
        return null;
    }
};

function Switch({ id, checked, disabled, onChange, label }) {
    return (
        <button
            type="button"
            id={id}
            role="switch"
            aria-checked={checked}
            aria-label={label}
            disabled={disabled}
            className="vq-switch"
            onClick={() => !disabled && onChange(!checked)}
        />
    );
}

function PreferencesDialog({ categories, prefs, onToggle, onSave, onRejectAll, onAcceptAll, onClose }) {
    const cardRef = useRef(null);

    useEffect(() => {
        const prevFocus = document.activeElement;
        cardRef.current?.focus();
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('keydown', onKey);
            if (prevFocus && prevFocus.focus) prevFocus.focus();
        };
    }, [onClose]);

    return (
        <div className="vq-cookie-dialog" data-tone-ignore="">
            <motion.div
                className="vq-cookie-dialog__scrim"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            />
            <motion.div
                ref={cardRef}
                tabIndex={-1}
                role="dialog"
                aria-modal="true"
                aria-labelledby="vq-cookie-title"
                className="vq-cookie-dialog__card"
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.98 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
                <div className="vq-cookie-dialog__head">
                    <div>
                        <h2 id="vq-cookie-title">Cookie preferences</h2>
                        <p>Choose what VenQore may store in this browser. You can change this any time from the footer.</p>
                    </div>
                    <button type="button" className="vq-sh-icon" onClick={onClose} aria-label="Close">
                        <X size={18} aria-hidden="true" />
                    </button>
                </div>
                <div className="vq-cookie-dialog__body">
                    {categories.map((cat, i) => {
                        const Icon = cat.icon || Cookie;
                        const on = !!prefs[i];
                        return (
                            <div key={cat.id} className={`vq-cookie-cat${on ? ' is-on' : ''}`}>
                                <div className="vq-cookie-cat__top">
                                    <span className="vq-row vq-gap-3" style={{ alignItems: 'center' }}>
                                        <Icon size={18} aria-hidden="true" />
                                        <span className="vq-cookie-cat__name">
                                            {cat.name}
                                            {cat.isEssential && <span className="vq-cookie-cat__req">Required</span>}
                                        </span>
                                    </span>
                                    <Switch
                                        id={`vq-cookie-${cat.id}`}
                                        label={cat.name}
                                        checked={on}
                                        disabled={cat.isEssential}
                                        onChange={(v) => onToggle(i, v)}
                                    />
                                </div>
                                <p>{cat.description}</p>
                            </div>
                        );
                    })}
                </div>
                <div className="vq-cookie-dialog__foot">
                    <button type="button" className="vq-btn vq-btn--secondary" onClick={onRejectAll}>Reject non-essential</button>
                    <span className="vq-row vq-gap-2">
                        <button type="button" className="vq-btn vq-btn--quiet" onClick={onAcceptAll}>Accept all</button>
                        <button type="button" className="vq-btn vq-btn--primary" onClick={onSave}>Save choices</button>
                    </span>
                </div>
            </motion.div>
        </div>
    );
}

export default function CookieConsent({
    categories = DEFAULT_COOKIE_CATEGORIES,
    cookiePolicyUrl = '/privacy#cookies',
    onAccept,
    onDecline,
}) {
    const [mounted, setMounted] = useState(false);
    const [banner, setBanner] = useState(false);
    const [dialog, setDialog] = useState(false);
    const [prefs, setPrefs] = useState(() => categories.map((c) => !!c.isEssential));

    useEffect(() => {
        setMounted(true);
        const stored = readStored(categories.length);
        if (stored) {
            setPrefs(stored);
            onAccept?.(stored);
        } else {
            setBanner(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [categories.length]);

    useEffect(() => {
        const open = () => {
            const stored = readStored(categories.length);
            if (stored) setPrefs(stored);
            setDialog(true);
        };
        window.addEventListener('open-cookie-preferences', open);
        return () => window.removeEventListener('open-cookie-preferences', open);
    }, [categories.length]);

    const save = useCallback((next) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            localStorage.setItem(CONSENT_KEY, 'true');
        } catch (e) { /* storage blocked — the choice holds for this visit */ }
        setPrefs(next);
        setBanner(false);
        setDialog(false);
        window.dispatchEvent(new CustomEvent('cookie-consent-changed', { detail: next }));
        onAccept?.(next);
    }, [onAccept]);

    const acceptAll = useCallback(() => save(categories.map(() => true)), [categories, save]);
    const rejectAll = useCallback(() => {
        save(categories.map((c) => !!c.isEssential));
        onDecline?.();
    }, [categories, save, onDecline]);
    const toggle = useCallback((i, v) => {
        if (categories[i]?.isEssential) return;
        setPrefs((p) => p.map((x, j) => (j === i ? v : x)));
    }, [categories]);
    const closeDialog = useCallback(() => setDialog(false), []);

    if (!mounted) return null;

    return (
        <>
            <AnimatePresence>
                {banner && !dialog && (
                    <motion.aside
                        key="banner"
                        className="vq-cookie"
                        role="region"
                        aria-label="Cookie consent"
                        data-tone-ignore=""
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 40 }}
                        transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <div className="vq-cookie__row">
                            <span className="vq-cookie__icon"><Cookie size={20} aria-hidden="true" /></span>
                            <div>
                                <p className="vq-cookie__title">We use a few cookies</p>
                                <p className="vq-cookie__text">
                                    Essential ones keep you signed in and secure. Optional analytics help us fix slow pages — only if you allow it.{' '}
                                    <a href={cookiePolicyUrl}>Cookie policy</a>
                                </p>
                            </div>
                        </div>
                        <div className="vq-cookie__actions">
                            <button type="button" className="vq-btn vq-btn--secondary" onClick={rejectAll}>Reject non-essential</button>
                            <button type="button" className="vq-btn vq-btn--primary" onClick={acceptAll}>Accept all</button>
                            <button type="button" className="vq-cookie__more" onClick={() => setDialog(true)}>Choose what to allow</button>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {dialog && (
                    <PreferencesDialog
                        key="dialog"
                        categories={categories}
                        prefs={prefs}
                        onToggle={toggle}
                        onSave={() => save(prefs)}
                        onRejectAll={rejectAll}
                        onAcceptAll={acceptAll}
                        onClose={closeDialog}
                    />
                )}
            </AnimatePresence>
        </>
    );
}
