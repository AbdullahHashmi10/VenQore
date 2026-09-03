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
            answer="Free, practical tools for retail and small business owners — no signup, no watermark, no ads. Built by the team behind VenQore, an offline-first POS and ERP with verified double-entry accounting."
            toolGroups={toolGroups}
            cta={{
                headline: 'Stop doing this manually.',
                subtext: 'VenQore automates the busywork on every sale and keeps a balanced set of books while it does.',
            }}
            wide
        >
            <div className="space-y-10">
                {toolGroups.map((group) => (
                    <section key={group.key}>
                        <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-ink-muted mb-4">
                            {group.label}
                        </h2>
                        <div className="grid sm:grid-cols-2 gap-3">
                            {group.tools.map((tool) => {
                                const isLive = tool.status === 'live' && tool.href;

                                const inner = (
                                    <>
                                        <div className="flex items-start justify-between gap-3 mb-2">
                                            <h3 className={`text-base font-bold ${isLive ? 'text-ink group-hover:text-brand-600 dark:group-hover:text-brand-300' : 'text-ink-muted'} transition-colors`}>
                                                {tool.name}
                                            </h3>
                                            {!isLive && (
                                                <span className="text-3xs font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-sunken dark:bg-white/[0.06] text-ink-muted shrink-0 mt-0.5">
                                                    Soon
                                                </span>
                                            )}
                                        </div>
                                        <p className={`text-sm leading-relaxed ${isLive ? 'text-ink-secondary' : 'text-ink-muted'}`}>
                                            {tool.description}
                                        </p>
                                    </>
                                );

                                const base = 'p-5 rounded-2xl border transition-all group';

                                return isLive ? (
                                    <Link
                                        key={tool.slug}
                                        href={tool.href}
                                        className={`${base} bg-sunken dark:bg-white/[0.03] border-line dark:border-white/10 hover:border-brand-400/40 hover:bg-interactive-hover/[0.04] dark:hover:bg-white/[0.05]`}
                                    >
                                        {inner}
                                    </Link>
                                ) : (
                                    <div
                                        key={tool.slug}
                                        className={`${base} bg-sunken dark:bg-white/[0.015] border-line dark:border-white/[0.06] cursor-default`}
                                    >
                                        {inner}
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                ))}
            </div>

            <p className="mt-10 text-sm text-ink-muted">
                {liveCount} {liveCount === 1 ? 'tool is' : 'tools are'} live now — the rest are on the way. No ads, no trackers beyond basic analytics.
            </p>

            {/* In-copy contextual links: the tools hub is a top-of-funnel entry
                point, so it should hand readers a route into the product and
                industry clusters rather than dead-ending on a tool list. */}
            <div className="mt-6 p-5 rounded-2xl bg-sunken dark:bg-white/[0.03] border border-line dark:border-white/10 text-sm text-ink-secondary leading-relaxed">
                Doing this by hand every day? These tools come from{' '}
                <InlineLink href="/features/point-of-sale">VenQore's point of sale</InlineLink>, which
                generates the same documents automatically and posts each one to a{' '}
                <InlineLink href="/features/accounting">real double-entry ledger</InlineLink> with{' '}
                <InlineLink href="/features/inventory-management">FIFO stock costing</InlineLink>. See how it
                fits your trade — <InlineLink href="/solutions/pharmacy">pharmacy</InlineLink>,{' '}
                <InlineLink href="/solutions/grocery">grocery</InlineLink>,{' '}
                <InlineLink href="/solutions/wholesale">wholesale</InlineLink> — or{' '}
                <InlineLink href="/compare">compare it against what you use now</InlineLink>.
            </div>
        </ToolShell>
    );
}
