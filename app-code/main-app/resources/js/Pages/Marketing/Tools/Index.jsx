import React from 'react';
import { Link } from '@inertiajs/react';
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
                subtext: "Describe your business once. VenQore assembles it from 140+ modules — you keep the ones you use — and every invoice, label and count sheet comes out of live data instead of a blank form.",
            }}
            wide
        >
            <div className="space-y-12">
                {toolGroups.map((group) => (
                    <section key={group.key}>
                        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-ink-muted mb-5">
                            {group.label}
                        </h2>
                        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
                            {group.tools.map((tool) => {
                                const isLive = tool.status === 'live' && tool.href;

                                const inner = (
                                    <>
                                        <div className="flex items-start justify-between gap-3 mb-2.5">
                                            <h3 className={`text-base font-bold ${isLive ? 'text-ink group-hover:text-brand-500' : 'text-ink-muted'} transition-colors`}>
                                                {tool.name}
                                            </h3>
                                            {!isLive && (
                                                <span className="text-3xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sunken border border-line text-ink-muted shrink-0 mt-0.5">
                                                    Soon
                                                </span>
                                            )}
                                        </div>
                                        <p className={`text-sm leading-relaxed ${isLive ? 'text-ink-secondary' : 'text-ink-muted'}`}>
                                            {tool.description}
                                        </p>
                                    </>
                                );

                                const base = 'p-6 rounded-2xl border transition-all duration-normal group';

                                return isLive ? (
                                    <Link
                                        key={tool.slug}
                                        href={tool.href}
                                        className={`${base} bg-surface border-line hover:border-brand-400/40 hover:shadow-md`}
                                    >
                                        {inner}
                                    </Link>
                                ) : (
                                    <div
                                        key={tool.slug}
                                        className={`${base} bg-surface/50 border-line opacity-60 cursor-default`}
                                    >
                                        {inner}
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                ))}
            </div>

            <p className="mt-12 text-sm text-ink-muted">
                {liveCount} {liveCount === 1 ? 'tool is' : 'tools are'} live now — the rest are on the way. No ads, no trackers beyond basic analytics.
            </p>

            {/* In-copy contextual links */}
            <div className="mt-8 p-6 sm:p-8 rounded-2xl bg-surface border border-line text-sm text-ink-secondary leading-relaxed shadow-sm">
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
