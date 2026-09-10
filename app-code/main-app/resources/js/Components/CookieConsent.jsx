import React, { useState, useEffect, useCallback } from 'react';
import { Link } from '@inertiajs/react';
import { AnimatePresence, motion } from 'motion/react';
import { Cookie, ChevronRight, Shield, BarChart3, Target, X, Check, SlidersHorizontal } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════
   VENQORE V6 COOKIE CONSENT BANNER & PREFERENCE CUSTOMIZER
   100% V6 Design System: frosted glass canvas, mint accents, high-contrast
   typography, custom animated switches, and persistent localStorage consent.
   ═══════════════════════════════════════════════════════════════════════════ */

const STORAGE_KEY = 'venqore_cookie_preferences_v1';
const CONSENT_KEY = 'venqore_cookie_consent_v1';

export const DEFAULT_COOKIE_CATEGORIES = [
    {
        id: 'essential',
        name: 'Essential Cookies',
        description: 'Required for authentication, security session integrity, workspace loading, and core app operations. These cannot be disabled.',
        icon: <Shield className="h-4 w-4 text-emerald-500" />,
        isEssential: true,
    },
    {
        id: 'analytics',
        name: 'Analytics & Performance',
        description: 'Help us measure aggregate site speed, diagnose page rendering bottlenecks, and anonymously evaluate feature adoption without tracking personal identity.',
        icon: <BarChart3 className="h-4 w-4 text-teal-400" />,
    },
    {
        id: 'marketing',
        name: 'Marketing & Tailored Updates',
        description: 'Enable non-intrusive product announcements, webinar invitations, and relevant ERP feature updates across trusted discovery channels.',
        icon: <Target className="h-4 w-4 text-emerald-400" />,
    },
];

/* ── Custom V6 Animated Switch ────────────────────────────────────────────── */
function V6Switch({ id, checked, onChange, disabled }) {
    return (
        <button
            type="button"
            id={id}
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => !disabled && onChange(!checked)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                disabled ? 'cursor-not-allowed opacity-75' : ''
            } ${checked ? 'bg-brand-500' : 'bg-neutral-300 dark:bg-white/20'}`}
        >
            <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out mt-0.5 ${
                    checked ? 'translate-x-5.5' : 'translate-x-0.5'
                }`}
            />
        </button>
    );
}

/* ── Cookie Customize Modal Dialog ───────────────────────────────────────── */
function CookieCustomizeDialog({
    open,
    onClose,
    categories = DEFAULT_COOKIE_CATEGORIES,
    preferences,
    onToggle,
    onSave,
    onRejectAll,
}) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-neutral-950/60 backdrop-blur-md transition-opacity"
            />

            {/* Modal Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-full max-w-xl rounded-2xl bg-surface border border-line shadow-2xl overflow-hidden z-10 my-8"
                style={{ background: 'var(--vq-surface)', borderColor: 'var(--vq-line)' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 pb-4 border-b border-line">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                            <SlidersHorizontal className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-ink tracking-tight">Cookie Preferences</h2>
                            <p className="text-xs text-ink-muted mt-0.5">Control which data and cookies we store in your browser.</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close dialog"
                        className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-sunken transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Categories List */}
                <div className="p-6 space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto">
                    {categories.map((category, index) => {
                        const isChecked = preferences[index] || false;
                        return (
                            <div
                                key={category.id}
                                className={`p-4 rounded-xl border transition-all duration-200 ${
                                    isChecked
                                        ? 'bg-brand-500/[0.04] border-brand-500/30'
                                        : 'bg-surface/50 border-line hover:border-line-strong'
                                }`}
                            >
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${isChecked ? 'bg-brand-500/10' : 'bg-sunken'}`}>
                                            {category.icon || <Cookie className="h-4 w-4 text-brand-500" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-sm sm:text-base text-ink">{category.name}</span>
                                                {category.isEssential && (
                                                    <span className="px-2 py-0.5 rounded-full text-3xs font-bold uppercase tracking-wider bg-brand-500/15 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                                                        Required
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <V6Switch
                                        id={`cookie-switch-${category.id}`}
                                        checked={isChecked}
                                        disabled={category.isEssential}
                                        onChange={(checked) => onToggle(index, checked)}
                                    />
                                </div>
                                <p className="text-xs sm:text-sm text-ink-secondary mt-3 leading-relaxed">
                                    {category.description}
                                </p>
                            </div>
                        );
                    })}
                </div>

                {/* Footer Controls */}
                <div className="p-5 sm:p-6 border-t border-line bg-sunken/40 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
                    <button
                        type="button"
                        onClick={onRejectAll}
                        className="vq-btn vq-btn--quiet text-xs font-bold"
                    >
                        Reject Non-Essential
                    </button>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="vq-btn vq-btn--secondary text-xs font-bold flex-1 sm:flex-initial"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={onSave}
                            className="vq-btn vq-btn--primary text-xs font-bold flex-1 sm:flex-initial"
                        >
                            Save Preferences
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

/* ── Main Cookie Banner ─────────────────────────────────────────────────── */
function CookieBanner({
    isVisible,
    onAcceptAll,
    onCustomize,
    cookiePolicyUrl = '/privacy#cookies',
    className = '',
}) {
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.aside
                    initial={{ opacity: 0, y: 60, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 60, scale: 0.98 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className={`fixed bottom-4 left-4 right-4 sm:right-auto sm:max-w-md z-[550] ${className}`}
                >
                    <div
                        className="p-5 sm:p-6 rounded-2xl bg-surface/95 backdrop-blur-xl border border-line shadow-2xl"
                        style={{
                            background: 'var(--vq-surface)',
                            borderColor: 'var(--vq-line)',
                            boxShadow: 'var(--vq-elev-3)'
                        }}
                    >
                        <div className="flex items-start gap-3.5 mb-3">
                            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 shrink-0 mt-0.5">
                                <Cookie className="h-5 w-5 text-brand-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-base font-bold text-ink tracking-tight">
                                    Cookie &amp; Privacy Choices
                                </h3>
                                <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed mt-1">
                                    We use essential cookies for system integrity and optional analytics to understand how you explore our ERP builder.
                                </p>
                            </div>
                        </div>

                        <div className="mb-4 pl-11">
                            <Link
                                href={cookiePolicyUrl}
                                className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline inline-flex items-center gap-1 group"
                            >
                                Read our Cookie Policy <ChevronRight size={12} className="transition-transform group-hover:translate-x-0.5" />
                            </Link>
                        </div>

                        <div className="flex items-center gap-2.5 pt-2 border-t border-line">
                            <button
                                type="button"
                                onClick={onAcceptAll}
                                className="vq-btn vq-btn--primary text-xs font-bold flex-1 py-2.5 justify-center"
                            >
                                Accept All
                            </button>
                            <button
                                type="button"
                                onClick={onCustomize}
                                className="vq-btn vq-btn--secondary text-xs font-bold flex-1 py-2.5 justify-center"
                            >
                                Customize
                            </button>
                        </div>
                    </div>
                </motion.aside>
            )}
        </AnimatePresence>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════
   EXPORTED PRIMARY COMPONENT: CookieConsent
   ═══════════════════════════════════════════════════════════════════════════ */
export default function CookieConsent({
    className = '',
    categories = DEFAULT_COOKIE_CATEGORIES,
    cookiePolicyUrl = '/privacy#cookies',
    onAccept,
    onDecline,
}) {
    const [mounted, setMounted] = useState(false);
    const [showBanner, setShowBanner] = useState(false);
    const [showCustomizeDialog, setShowCustomizeDialog] = useState(false);

    const [preferences, setPreferences] = useState(() =>
        categories.map((cat) => !!cat.isEssential)
    );

    useEffect(() => {
        setMounted(true);
        try {
            const consentGiven = localStorage.getItem(CONSENT_KEY) === 'true';
            const storedPrefs = localStorage.getItem(STORAGE_KEY);

            if (consentGiven && storedPrefs) {
                const parsedPrefs = JSON.parse(storedPrefs);
                if (Array.isArray(parsedPrefs) && parsedPrefs.length === categories.length) {
                    setPreferences(parsedPrefs);
                    onAccept?.(parsedPrefs);
                    return;
                }
            }
            setShowBanner(true);
        } catch (e) {
            setShowBanner(true);
        }
    }, [categories.length, onAccept]);

    // Listen for custom event to reopen modal from footer links
    useEffect(() => {
        const handleOpen = () => {
            setShowCustomizeDialog(true);
        };
        window.addEventListener('open-cookie-preferences', handleOpen);
        return () => window.removeEventListener('open-cookie-preferences', handleOpen);
    }, []);

    const savePreferences = useCallback((prefs) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
            localStorage.setItem(CONSENT_KEY, 'true');
        } catch (e) {
            console.warn('Cookie preferences could not be stored in localStorage:', e);
        }
        setShowBanner(false);
        setShowCustomizeDialog(false);
        onAccept?.(prefs);
    }, [onAccept]);

    const handleAcceptAll = useCallback(() => {
        const allTrue = categories.map(() => true);
        setPreferences(allTrue);
        savePreferences(allTrue);
    }, [categories, savePreferences]);

    const handleRejectAll = useCallback(() => {
        const essentialOnly = categories.map((cat) => !!cat.isEssential);
        setPreferences(essentialOnly);
        savePreferences(essentialOnly);
        onDecline?.();
    }, [categories, savePreferences, onDecline]);

    const handleSaveCustom = useCallback(() => {
        savePreferences(preferences);
    }, [preferences, savePreferences]);

    const handleToggle = useCallback((index, checked) => {
        if (categories[index]?.isEssential) return;
        setPreferences((prev) => {
            const next = [...prev];
            next[index] = checked;
            return next;
        });
    }, [categories]);

    if (!mounted) return null;

    return (
        <>
            <CookieBanner
                isVisible={showBanner}
                onAcceptAll={handleAcceptAll}
                onCustomize={() => setShowCustomizeDialog(true)}
                cookiePolicyUrl={cookiePolicyUrl}
                className={className}
            />

            <AnimatePresence>
                {showCustomizeDialog && (
                    <CookieCustomizeDialog
                        open={showCustomizeDialog}
                        onClose={() => setShowCustomizeDialog(false)}
                        categories={categories}
                        preferences={preferences}
                        onToggle={handleToggle}
                        onSave={handleSaveCustom}
                        onRejectAll={handleRejectAll}
                    />
                )}
            </AnimatePresence>
        </>
    );
}
