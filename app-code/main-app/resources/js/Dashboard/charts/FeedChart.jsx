import React from 'react';
import { CreditCard, ArrowRight } from 'lucide-react';

export default function FeedChart({ data }) {
    const items = data?.items || [];

    if (items.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-ink-muted dark:text-ink-secondary text-3xs font-bold uppercase tracking-wider select-none">
                No Activity Feed
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col justify-start overflow-hidden">
            <div className="grow overflow-y-auto max-h-[96px] custom-scrollbar flex flex-col gap-2 pr-1">
                {items.slice(0, 3).map((item, i) => (
                    <div 
                        key={item.id || i}
                        className="flex items-center justify-between gap-3 p-1.5 rounded-xl border border-border dark:border-border bg-sunken dark:bg-sunken select-none text-[9px] font-bold"
                    >
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="p-1 rounded-lg bg-brand-500/10 text-brand-500 shrink-0">
                                <CreditCard size={10} />
                            </div>
                            <div className="min-w-0">
                                <div className="text-ink truncate max-w-[120px]">{item.title}</div>
                                <div className="text-ink-muted dark:text-ink-muted text-[8px] font-semibold">{item.subtitle}</div>
                            </div>
                        </div>
                        <div className="text-right shrink-0">
                            <div className="text-brand-600 dark:text-brand-400">{item.value}</div>
                            <div className="text-[7px] text-ink-muted font-semibold">{item.at}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
