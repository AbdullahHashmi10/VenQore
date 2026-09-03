import React from 'react';
import { ArrowRight, BookOpen, Inbox } from 'lucide-react';
import { Link } from '@inertiajs/react';

export default function EmptyState({
 icon: Icon = Inbox,
 title = 'No data available',
 body = 'There is currently no information to display here.',
 primaryAction = null, // { label: string, onClick?: fn, href?: string }
 docsHref = null,
}) {
 return (
 <div className="flex flex-col items-center justify-center text-center p-8 sm:p-16 bg-white/[0.02] border border-white/[0.04] rounded-2xl backdrop-blur-md relative overflow-hidden my-6 select-none animate-in fade-in duration-slower">
 {/* Ambient background glow */}
 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-brand-500/5 rounded-full blur-[60px] pointer-events-none" />

 {/* Icon */}
 <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-ink-muted mb-6 shadow-inner relative transition-transform duration-slow">
 <Icon size={32} className="stroke-[1.5]" />
 </div>

 {/* Content */}
 <h3 className="text-xl font-bold text-white tracking-tight mb-2" style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif" }}>
 {title}
 </h3>
 <p className="text-sm text-ink-muted max-w-md mb-8 leading-relaxed">
 {body}
 </p>

 {/* Actions */}
 <div className="flex flex-wrap items-center justify-center gap-4 relative z-10">
 {primaryAction && (
 primaryAction.href ? (
 <Link
 href={primaryAction.href}
 className="flex items-center gap-2 px-6 py-3 bg-gradient-brand text-white font-semibold text-sm rounded-xl transition-all shadow-lg active:scale-[0.98]"
 >
 {primaryAction.label}
 <ArrowRight size={16} />
 </Link>
 ) : (
 <button
 onClick={primaryAction.onClick}
 className="flex items-center gap-2 px-6 py-3 bg-gradient-brand text-white font-semibold text-sm rounded-xl transition-all shadow-lg active:scale-[0.98]"
 >
 {primaryAction.label}
 <ArrowRight size={16} />
 </button>
 )
 )}

 {docsHref && (
 <a
 href={docsHref}
 target="_blank"
 rel="noopener noreferrer"
 className="flex items-center gap-2 px-6 py-3 bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.12] text-neutral-300 font-semibold text-sm rounded-xl transition-all active:scale-[0.98]"
 >
 <BookOpen size={16} />
 Learn More
 </a>
 )}
 </div>
 </div>
 );
}
