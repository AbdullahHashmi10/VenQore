import React, { useState } from 'react';
import { Link } from '@inertiajs/react';
import { Menu, X, Lock } from 'lucide-react';

/**
 * ToolsSidebar — left navigation across the whole free-tools surface.
 *
 * Fed by App\Support\ToolRegistry (PHP) so the sidebar, hub page and
 * sitemap can never drift apart. Tools with status 'soon' render as
 * non-clickable, clearly-labelled items — showing the full planned set
 * makes the toolbox look deep and gives people a reason to come back,
 * without ever producing a dead link or a 404.
 *
 * Desktop: sticky left rail. Mobile: slide-down drawer behind a button,
 * so it never eats the top of the screen on a phone.
 */
export default function ToolsSidebar({ groups = [], currentSlug = null }) {
    const [open, setOpen] = useState(false);

    const Item = ({ tool }) => {
        const isCurrent = tool.slug === currentSlug;
        const base = 'flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-colors';

        if (tool.status !== 'live' || !tool.href) {
            return (
                <div
                    className={`${base} text-ink-muted cursor-default select-none`}
                    title="Coming soon"
                >
                    <span className="truncate">{tool.short}</span>
                    <span className="text-3xs font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-sunken dark:bg-white/[0.06] text-ink-muted shrink-0">
                        Soon
                    </span>
                </div>
            );
        }

        return (
            <Link
                href={tool.href}
                onClick={() => setOpen(false)}
                className={`${base} ${
                    isCurrent
                        ? 'bg-brand-500/10 text-brand-600 dark:text-brand-300 font-bold border border-brand-500/20'
                        : 'text-ink-secondary hover:text-ink dark:hover:text-white hover:bg-interactive-hover/[0.04] dark:hover:bg-white/[0.05]'
                }`}
            >
                <span className="truncate">{tool.short}</span>
            </Link>
        );
    };

    const Nav = () => {
        let smartCaptureTool = null;
        const filteredGroups = groups.map(group => {
            const sc = group.tools.find(t => t.slug === 'smart-capture');
            if (sc) {
                smartCaptureTool = sc;
            }
            return {
                ...group,
                tools: group.tools.filter(t => t.slug !== 'smart-capture')
            };
        }).filter(group => group.tools.length > 0);

        return (
            <nav className="space-y-6">
                {smartCaptureTool && (
                    <div>
                        <p className="text-2xs font-bold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400 mb-2 px-3 flex items-center gap-1">
                            <span>Premium AI Feature</span>
                        </p>
                        <div className="space-y-0.5">
                            <Link
                                href={smartCaptureTool.href}
                                onClick={() => setOpen(false)}
                                className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm transition-all duration-slow border ${
                                    currentSlug === 'smart-capture'
                                        ? 'bg-gradient-to-r from-brand-600/20 to-brand-600/10 text-brand-700 dark:text-brand-300 font-bold border-brand-500/40 shadow-[0_0_15px_rgba(139,92,246,0.15)]'
                                        : 'bg-gradient-to-r from-brand-500/[0.04] to-brand-500/[0.01] hover:from-brand-500/[0.08] hover:to-brand-500/[0.05] border-brand-500/15 hover:border-brand-500/30 text-ink dark:text-ink-secondary hover:text-brand-600 dark:hover:text-brand-400 font-bold'
                                }`}
                            >
                                <span className="flex items-center gap-2 truncate">
                                    <span className="animate-pulse">✨</span>
                                    <span className="truncate">{smartCaptureTool.short}</span>
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-brand-500/15 text-brand-600 dark:text-brand-400 text-3xs font-bold uppercase tracking-wider shrink-0 scale-90">
                                    PRO
                                </span>
                            </Link>
                        </div>
                    </div>
                )}

                {filteredGroups.map((group) => (
                    <div key={group.key}>
                        <p className="text-2xs font-bold uppercase tracking-[0.2em] text-ink-muted mb-2 px-3">
                            {group.label}
                        </p>
                        <div className="space-y-0.5">
                            {group.tools.map((tool) => (
                                <Item key={tool.slug} tool={tool} />
                            ))}
                        </div>
                    </div>
                ))}
            </nav>
        );
    };

    return (
        <>
            {/* Mobile toggle */}
            <div className="lg:hidden mb-6">
                <button
                    onClick={() => setOpen((v) => !v)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sunken dark:bg-white/[0.04] border border-line dark:border-white/10 text-sm font-bold text-ink-secondary"
                >
                    {open ? <X size={16} /> : <Menu size={16} />}
                    All tools
                </button>
                {open && (
                    <div className="mt-4 p-4 rounded-2xl bg-sunken dark:bg-white/[0.03] border border-line dark:border-white/10">
                        <Nav />
                    </div>
                )}
            </div>

            {/* Desktop rail */}
            <aside className="hidden lg:block w-56 shrink-0 sticky top-36 self-start">
                <Nav />
            </aside>
        </>
    );
}
