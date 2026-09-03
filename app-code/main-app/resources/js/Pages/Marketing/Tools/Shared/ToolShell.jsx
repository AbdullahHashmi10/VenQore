import React, { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import { MousePointerClick, X } from 'lucide-react';
import MarketingLayout, { SectionLabel } from '../../Shared/MarketingLayout';
import ToolsSidebar from './ToolsSidebar';
import HousePromo from './HousePromo';

const EDIT_HINT_DISMISSED_KEY = 'venqore_tools_edit_hint_dismissed_v1';

/**
 * EditHintBanner — one-time onboarding hint for `wide` (editable-preview)
 * tools: "this document is not just a preview, click it." Shown once per
 * browser; dismissing it (explicitly, or by editing any field — see the
 * 'venqore-tool-edited' event in EditableText.jsx) hides it for good.
 */
function EditHintBanner() {
    const [dismissed, setDismissed] = useState(true);

    useEffect(() => {
        try {
            setDismissed(localStorage.getItem(EDIT_HINT_DISMISSED_KEY) === '1');
        } catch (e) { setDismissed(false); }
    }, []);

    useEffect(() => {
        const dismiss = () => {
            setDismissed(true);
            try { localStorage.setItem(EDIT_HINT_DISMISSED_KEY, '1'); } catch (e) { /* non-fatal */ }
        };
        window.addEventListener('venqore-tool-edited', dismiss);
        return () => window.removeEventListener('venqore-tool-edited', dismiss);
    }, []);

    if (dismissed) return null;

    const dismiss = () => {
        setDismissed(true);
        try { localStorage.setItem(EDIT_HINT_DISMISSED_KEY, '1'); } catch (e) { /* non-fatal */ }
    };

    return (
        <div className="flex items-center gap-3 mb-4 px-4 py-3 rounded-xl bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-400/20 text-sm text-brand-700 dark:text-brand-300">
            <MousePointerClick size={16} className="shrink-0" />
            <span className="flex-1">
                <strong className="font-bold">This preview is the editor.</strong> Click any text below — the business name, dates, line items, anything — to change it. What you see is exactly what downloads.
            </span>
            <button
                type="button"
                onClick={dismiss}
                aria-label="Dismiss"
                className="shrink-0 p-1 rounded-lg hover:bg-brand-100 dark:hover:bg-brand-500/20 transition-colors"
            >
                <X size={14} />
            </button>
        </div>
    );
}

function FAQItem({ q, a }) {
    const [isExpanded, setIsExpanded] = useState(false);
    return (
        <div className="p-5 rounded-2xl bg-sunken dark:bg-white/[0.03] border border-line dark:border-white/10 transition-all duration-normal">
            <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between text-left font-bold text-ink group focus:outline-none"
            >
                <span className="pr-4">{q}</span>
                <span className={`transform transition-transform duration-normal text-ink-muted group-hover:text-ink-secondary dark:group-hover:text-neutral-300 shrink-0`}>
                    <svg className={`w-4 h-4 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                </span>
            </button>
            <div className={`grid transition-all duration-normal ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100 mt-3' : 'grid-rows-[0fr] opacity-0 overflow-hidden'}`}>
                <div className="overflow-hidden">
                    <p className="text-sm text-ink-secondary leading-relaxed">{a}</p>
                </div>
            </div>
        </div>
    );
}

/**
 * ToolShell — shared page anatomy for every /tools/* page.
 *
 * Layout: [ left tool nav ] [ tool content ] [ house promo rail ]
 *  - lg: sidebar appears
 *  - xl: promo rail appears
 *  - below lg: sidebar becomes a drawer, promo hidden — the tool itself
 *    always gets full width on a phone.
 *
 * Content order inside the middle column is fixed: H1 → answer block →
 * tool → supporting content → FAQ → CTA → related. The answer block must
 * stay in the first ~150 words for GEO citation purposes (plan §5.1).
 * No breadcrumbs — the sidebar orients the user instead.
 */
export default function ToolShell({
    title,
    metaDescription,
    eyebrow,
    h1,
    answer,
    children,
    faqs = [],
    cta,
    related = [],
    toolGroups = [],
    currentSlug = null,
    showPromo = true,
    wide = false,
}) {
    // The promo rail is part of the standard /tools page furniture — it
    // must show and behave identically (sticky, always visible on scroll)
    // on every tool page, `wide` or not. `wide` only affects how much room
    // the middle document-preview column gets; it must never hide the rail.
    return (
        <MarketingLayout title={title} description={metaDescription}>
            <div className="pt-32 md:pt-36 pb-24 px-2 sm:px-4">
                <div className={`mx-auto px-2 md:px-4 flex gap-4 md:gap-6 ${wide ? 'max-w-[96rem]' : 'max-w-7xl'}`}>
                    <ToolsSidebar groups={toolGroups} currentSlug={currentSlug} />

                    <div className="flex-1 min-w-0">
                        {eyebrow && <SectionLabel>{eyebrow}</SectionLabel>}

                        <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-6 text-ink">
                            {h1}
                        </h1>

                        {answer && (
                            <p className="text-base md:text-lg text-ink-secondary leading-relaxed mb-10">
                                {answer}
                            </p>
                        )}

                        {wide && <EditHintBanner />}

                        <div className="mb-16">{children}</div>

                        {faqs.length > 0 && (
                            <section className="mb-16">
                                <h2 className="text-2xl font-bold mb-6 text-ink">
                                    Frequently asked questions
                                </h2>
                                <div className="space-y-4">
                                    {faqs.map((qa) => (
                                        <FAQItem key={qa.q} q={qa.q} a={qa.a} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {cta && (
                            <section className="mb-16 p-8 rounded-2xl bg-gradient-to-br from-brand-500/10 to-brand-500/5 dark:from-brand-600/20 dark:to-brand-600/10 border border-brand-500/20 text-center">
                                <p className="text-lg font-bold text-ink mb-2">{cta.headline}</p>
                                {cta.subtext && <p className="text-sm text-ink-secondary mb-6">{cta.subtext}</p>}
                                <div className="flex items-center justify-center gap-3 flex-wrap">
                                    <Link
                                        href="/pricing"
                                        className="px-6 py-3 bg-accent-fill text-accent-on rounded-full text-sm font-bold uppercase tracking-wide transition-transform"
                                    >
                                        Start your 14-day free trial
                                    </Link>
                                    <Link
                                        href="/demo"
                                        className="px-6 py-3 bg-sunken dark:bg-white/[0.06] border border-line dark:border-white/15 text-ink rounded-full text-sm font-bold uppercase tracking-wide hover:bg-interactive-hover/[0.1] dark:hover:bg-white/[0.1] transition-colors"
                                    >
                                        Try the live demo
                                    </Link>
                                </div>
                            </section>
                        )}

                        {related.length > 0 && (
                            <section>
                                <h2 className="text-lg font-bold text-ink-secondary mb-4">Related tools</h2>
                                <div className="flex flex-wrap gap-3">
                                    {related.map((tool) => (
                                        <Link
                                            key={tool.href}
                                            href={tool.href}
                                            className="px-5 py-2.5 rounded-full bg-sunken dark:bg-white/[0.04] border border-line dark:border-white/10 text-sm font-bold text-ink-secondary hover:text-ink dark:hover:text-white hover:border-brand-400/40 transition-colors"
                                        >
                                            {tool.label}
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>

                    {showPromo && <HousePromo />}
                </div>
            </div>
        </MarketingLayout>
    );
}
