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
                        className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 bg-slate-100 dark:bg-slate-800/50 cursor-not-allowed border border-slate-200 dark:border-slate-700"
                    >
                        {label}
                    </div>
                ) : (
                    <Link
                        key={key}
                        href={link.url}
                        className={`flex items-center justify-center min-w-[2rem] h-8 px-3 rounded-lg text-sm font-bold transition-all border ${link.active
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
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
