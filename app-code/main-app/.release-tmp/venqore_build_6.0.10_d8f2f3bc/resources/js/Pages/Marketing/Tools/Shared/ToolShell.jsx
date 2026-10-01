import React, { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import { MousePointerClick, X, ChevronDown } from 'lucide-react';
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
        <div className="vq-tools__hint" role="note">
            <MousePointerClick size={18} aria-hidden="true" />
            <span>
                <strong>This preview is the editor.</strong> Click any text below — the business name, dates, line items, anything — to change it. What you see is exactly what downloads.
            </span>
            <button type="button" onClick={dismiss} aria-label="Dismiss">
                <X size={16} />
            </button>
        </div>
    );
}

function FAQItem({ q, a }) {
    const [isExpanded, setIsExpanded] = useState(false);
    return (
        <div className="vq-tools__faq-item" data-open={isExpanded ? 'true' : 'false'}>
            <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                aria-expanded={isExpanded}
                className="vq-tools__faq-q"
            >
                <span>{q}</span>
                <ChevronDown size={20} aria-hidden="true" />
            </button>
            {isExpanded && <p className="vq-tools__faq-a">{a}</p>}
        </div>
    );
}

/**
 * ToolShell — shared page anatomy for every /tools/* page.
 *
 * Layout: [ left tool nav ] [ tool content ] [ house promo rail ]
 *  - ≥1024px: sidebar appears
 *  - ≥1440px: promo rail appears (only once the tool still gets ≥720px)
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
    return (
        <MarketingLayout title={title} description={metaDescription}>
            <div className={`vq-tools ${wide ? 'vq-tools--wide' : ''}`}>
                <div className={`vq-tools__layout ${showPromo ? 'vq-tools__layout--promo' : ''}`}>
                    <ToolsSidebar groups={toolGroups} currentSlug={currentSlug} />

                    <div className="vq-tools__main">
                        <header className="vq-tools__head">
                            {eyebrow && <SectionLabel>{eyebrow}</SectionLabel>}
                            <h1 className="vq-h1">{h1}</h1>
                            {answer && <p className="vq-lede vq-tools__answer">{answer}</p>}
                        </header>

                        {wide && currentSlug && <EditHintBanner />}

                        <div className="vq-tool-ui">{children}</div>

                        {faqs.length > 0 && (
                            <section className="vq-tools__block" aria-labelledby="tool-faq">
                                <h2 id="tool-faq" className="vq-h2">Frequently asked questions</h2>
                                <div className="vq-tools__faq">
                                    {faqs.map((qa) => (
                                        <FAQItem key={qa.q} q={qa.q} a={qa.a} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {cta && (
                            <section className="vq-tools__block vq-card vq-card--xl vq-tools__cta">
                                <h2 className="vq-h2">{cta.headline}</h2>
                                {cta.subtext && <p>{cta.subtext}</p>}
                                <div className="vq-row vq-gap-3 vq-wrap vq-tools__cta-actions">
                                    <Link href="/build-workspace" className="vq-btn vq-btn--primary vq-btn--lg">
                                        Build your system free
                                    </Link>
                                    <Link href="/demo" className="vq-btn vq-btn--secondary vq-btn--lg">
                                        Try the live demo
                                    </Link>
                                </div>
                            </section>
                        )}

                        {related.length > 0 && (
                            <section className="vq-tools__block" aria-labelledby="tool-related">
                                <h2 id="tool-related" className="vq-h3">Related tools</h2>
                                <div className="vq-row vq-gap-3 vq-wrap">
                                    {related.map((tool) => (
                                        <Link key={tool.href} href={tool.href} className="vq-chip">
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
