import React from 'react';
import { Activity } from 'lucide-react';
import MarketingLayout, { RevealOnScroll, SectionLabel } from '@/Pages/Marketing/Shared/MarketingLayout';

/**
 * Public status board.
 *
 * What changed:
 *   · It renders inside MarketingLayout now. A status page is one of the pages
 *     people arrive at cold and in a hurry, and it used to have no header, no
 *     footer and no route back to the site.
 *   · The forced near-black ground and the true-neutral ramp are gone; surfaces,
 *     ink and lines are roles, so the board reads in both themes (§4, §15).
 *   · The three status pills were hand-picked ramp stops. They now use the
 *     SEMANTIC roles — success / info / warning — which is the whole point of
 *     §4's state table: the reader has already learned what those colours mean
 *     everywhere else in the product, and a status pill is exactly where that
 *     learning should pay off. Each carries a light stop and a dark stop.
 *
 * Removed class names are described rather than quoted — Tailwind scans raw
 * file text, so a class named in a comment gets built.
 *
 * `issues`, `lastUpdated` and every string are untouched.
 */

/*
 * Anything that is not resolved and not mitigated is still open, and open is
 * `warning` — "needs attention". Falling back to a tone rather than indexing
 * blind means an unrecognised status renders as unresolved instead of unstyled.
 */
const STATUS_TONES = {
    Resolved: 'border-success-200 bg-success-50 text-success-600 dark:border-success-900 dark:bg-success-950 dark:text-success-300',
    Mitigated: 'border-info-200 bg-info-50 text-info-600 dark:border-info-900 dark:bg-info-950 dark:text-info-300',
};

const OPEN_TONE = 'border-warning-200 bg-warning-50 text-warning-600 dark:border-warning-900 dark:bg-warning-950 dark:text-warning-300';

export default function KnownIssues({ issues, lastUpdated }) {
    return (
        <MarketingLayout
            title="Known Issues — VenQore POS"
            description="Live status board updated during launch week. Check active issues and verified workarounds below."
        >
            <section className="max-w-4xl mx-auto px-6 pt-32 pb-12 text-center">
                <RevealOnScroll direction="up">
                    <SectionLabel icon={Activity} text="SYSTEM STATUS" />

                    <h1 className="text-4xl font-bold tracking-tight text-ink">System Status &amp; Known Issues</h1>

                    <p className="mt-4 max-w-2xl mx-auto text-ink-secondary leading-relaxed">
                        Live status board updated during launch week. Check active issues and verified workarounds below.
                    </p>

                    <div className="mt-6 inline-block rounded-full bg-accent-quiet px-3 py-1 font-numeric text-xs text-accent-text">
                        Last Updated: {lastUpdated}
                    </div>
                </RevealOnScroll>
            </section>

            <section className="max-w-4xl mx-auto px-6 pb-24">
                <div className="space-y-6">
                    {issues.map((issue) => (
                        <RevealOnScroll key={issue.id} direction="up">
                            <article className="space-y-3 rounded-lg border border-line bg-surface p-6">
                                <div className="flex items-center justify-between gap-3">
                                    <span className="font-numeric text-xs text-ink-muted">{issue.id}</span>
                                    <span
                                        className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_TONES[issue.status] || OPEN_TONE}`}
                                    >
                                        {issue.status}
                                    </span>
                                </div>

                                <h2 className="text-lg font-bold text-ink">{issue.title}</h2>

                                <p className="text-sm text-ink-secondary">{issue.impact}</p>

                                {/* Nested panel inside a 20px card takes the 14px base radius (§7). */}
                                <div className="space-y-1 rounded-md bg-sunken p-3 text-xs">
                                    <span className="font-semibold text-accent-text">Workaround / Fix:</span>
                                    <p className="text-ink-muted">{issue.workaround}</p>
                                </div>
                            </article>
                        </RevealOnScroll>
                    ))}
                </div>
            </section>
        </MarketingLayout>
    );
}
