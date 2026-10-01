import React from 'react';
import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ links = [] }) {
    if (links.length < 3) return null;

    return (
        <div className="flex flex-wrap items-center justify-center gap-1 mt-6">
            {links.map((link, key) => {
                let label = link.label;
                let isPrev = label.includes('&laquo;');
                let isNext = label.includes('&raquo;');

                if (isPrev) label = <ChevronLeft size={16} />;
                if (isNext) label = <ChevronRight size={16} />;

                return link.url === null ? (
                    <div
                        key={key}
                        className="flex items-center justify-center w-8 h-8 rounded-lg text-ink-muted bg-sunken cursor-not-allowed border border-line"
                    >
                        {label}
                    </div>
                ) : (
                    <Link
                        key={key}
                        href={link.url}
                        className={`flex items-center justify-center min-w-[2rem] h-8 px-3 rounded-lg text-sm font-bold transition-all border ${link.active
                                ? 'bg-brand-600 border-brand-600 text-white shadow-lg '
                                : 'bg-surface border-line text-ink-secondary hover:bg-interactive-hover dark:hover:bg-interactive-hover hover:border-line dark:hover:border-line-strong'
                            }`}
                        preserveScroll
                        preserveState
                    >
                        {label}
                    </Link>
                );
            })}
        </div>
    );
}
