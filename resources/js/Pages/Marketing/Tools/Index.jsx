import React from 'react';
import { Link } from '@inertiajs/react';
import ToolShell from './Shared/ToolShell';

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
        >
            <div className="space-y-10">
                {toolGroups.map((group) => (
                    <section key={group.key}>
                        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600 mb-4">
                            {group.label}
                        </h2>
                        <div className="grid sm:grid-cols-2 gap-3">
                            {group.tools.map((tool) => {
                                const isLive = tool.status === 'live' && tool.href;

                                const inner = (
                                    <>
                                        <div className="flex items-start justify-between gap-3 mb-2">
                                            <h3 className={`text-base font-black ${isLive ? 'text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300' : 'text-slate-400 dark:text-slate-600'} transition-colors`}>
                                                {tool.name}
                                            </h3>
                                            {!isLive && (
                                                <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-900/[0.05] dark:bg-white/[0.06] text-slate-400 dark:text-slate-500 shrink-0 mt-0.5">
                                                    Soon
                                                </span>
                                            )}
                                        </div>
                                        <p className={`text-sm leading-relaxed ${isLive ? 'text-slate-600 dark:text-slate-400' : 'text-slate-400 dark:text-slate-600'}`}>
                                            {tool.description}
                                        </p>
                                    </>
                                );

                                const base = 'p-5 rounded-2xl border transition-all group';

                                return isLive ? (
                                    <Link
                                        key={tool.slug}
                                        href={tool.href}
                                        className={`${base} bg-slate-900/[0.02] dark:bg-white/[0.03] border-slate-900/[0.06] dark:border-white/10 hover:border-indigo-400/40 hover:bg-slate-900/[0.04] dark:hover:bg-white/[0.05]`}
                                    >
                                        {inner}
                                    </Link>
                                ) : (
                                    <div
                                        key={tool.slug}
                                        className={`${base} bg-slate-900/[0.01] dark:bg-white/[0.015] border-slate-900/[0.04] dark:border-white/[0.06] cursor-default`}
                                    >
                                        {inner}
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                ))}
            </div>

            <p className="mt-10 text-sm text-slate-500 dark:text-slate-500">
                {liveCount} {liveCount === 1 ? 'tool is' : 'tools are'} live now — the rest are on the way. No ads, no trackers beyond basic analytics.
            </p>
        </ToolShell>
    );
}
