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
                    className={`${base} text-slate-500 dark:text-slate-600 cursor-default select-none`}
                    title="Coming soon"
                >
                    <span className="truncate">{tool.short}</span>
                    <span className="text-3xs font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-900/[0.05] dark:bg-white/[0.06] text-slate-500 dark:text-slate-500 shrink-0">
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
                        ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 font-bold border border-indigo-500/20'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-900/[0.04] dark:hover:bg-white/[0.05]'
                }`}
            >
                <span className="truncate">{tool.short}</span>
            </Link>
        );
    };

    const Nav = () => (
        <nav className="space-y-6">
            {groups.map((group) => (
                <div key={group.key}>
                    <p className="text-2xs font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-600 mb-2 px-3">
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

    return (
        <>
            {/* Mobile toggle */}
            <div className="lg:hidden mb-6">
                <button
                    onClick={() => setOpen((v) => !v)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/[0.03] dark:bg-white/[0.04] border border-slate-900/10 dark:border-white/10 text-sm font-bold text-slate-700 dark:text-slate-300"
                >
                    {open ? <X size={16} /> : <Menu size={16} />}
                    All tools
                </button>
                {open && (
                    <div className="mt-4 p-4 rounded-2xl bg-slate-900/[0.02] dark:bg-white/[0.03] border border-slate-900/[0.06] dark:border-white/10">
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
