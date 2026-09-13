import React from 'react';
import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import ToolShell from './Shared/ToolShell';
import { InlineLink } from '../Shared/MarketingLayout';

export default function ToolsIndex({ toolGroups = [] }) {
    const liveCount = toolGroups.flatMap((g) => g.tools).filter((t) => t.status === 'live').length;

    return (
        <ToolShell
            title="Free Retail Tools — Barcode Generator & More | VenQore"
            metaDescription="Free tools for retail and small business: barcode generator, label sheets, invoice templates and more. No signup required, no watermark."
            eyebrow="Free Tools"
            h1="Free Retail Tools"
            answer="Free, practical tools for retail and small business owners — no signup, no watermark, no ads. They come from VenQore, the AI ERP builder: describe your business in a sentence and it assembles a working system — till, stock, purchasing and a real double-entry ledger — that issues these documents for you."
            toolGroups={toolGroups}
            cta={{
                headline: "Every document here is one a built system would have issued for you.",
                subtext: "Describe your business once. VenQore assembles it from 46 modules — you keep the ones you use — and every invoice, label and count sheet comes out of live data instead of a blank form.",
            }}
            wide
        >
            <div className="vq-tools-hub">
                {toolGroups.map((group) => (
                    <section key={group.key} className="vq-tools-hub__group" aria-labelledby={`tools-${group.key}`}>
                        <h2 id={`tools-${group.key}`} className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">
                            {group.label}
                        </h2>
                        <div className="vq-grid vq-grid--2 vq-mt-5">
                            {group.tools.map((tool) => {
                                const isLive = tool.status === 'live' && tool.href;

                                const inner = (
                                    <>
                                        <div className="vq-row vq-gap-3" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <h3 className="vq-tools-hub__name">{tool.name}</h3>
                                            {isLive
                                                ? <ArrowRight size={18} className="vq-tools-hub__arrow" aria-hidden="true" />
                                                : <span className="vq-badge vq-badge--soon">Soon</span>}
                                        </div>
                                        <p className="vq-tools-hub__desc">{tool.description}</p>
                                    </>
                                );

                                return isLive ? (
                                    <Link key={tool.slug} href={tool.href} className="vq-card vq-card--interactive vq-tools-hub__card">
                                        {inner}
                                    </Link>
                                ) : (
                                    <div key={tool.slug} className="vq-card vq-card--flat vq-tools-hub__card vq-tools-hub__card--soon">
                                        {inner}
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                ))}
            </div>

            <p className="vq-small vq-text-2 vq-mt-12">
                {liveCount} {liveCount === 1 ? 'tool is' : 'tools are'} live now — the rest are on the way. No ads, no trackers beyond basic analytics.
            </p>

            {/* In-copy contextual links */}
            <div className="vq-card vq-card--xl vq-mt-8 vq-tools-hub__links">
                Doing this by hand every day? These tools are the manual version of what a built system
                does on its own. Describe your business to{' '}
                <InlineLink href="/blueprint">Blueprint</InlineLink> and it proposes the modules you need —{' '}
                <InlineLink href="/features/point-of-sale">a till</InlineLink>,{' '}
                <InlineLink href="/features/inventory-management">FIFO stock</InlineLink> and{' '}
                <InlineLink href="/features/accounting">a real double-entry ledger</InlineLink> — then issues
                these same documents from live data. See how it lands in your trade:{' '}
                <InlineLink href="/solutions/pharmacy">pharmacy</InlineLink>,{' '}
                <InlineLink href="/solutions/grocery">grocery</InlineLink>,{' '}
                <InlineLink href="/solutions/wholesale">wholesale</InlineLink> — or{' '}
                <InlineLink href="/compare">compare it against what you use now</InlineLink>.
            </div>
        </ToolShell>
    );
}
