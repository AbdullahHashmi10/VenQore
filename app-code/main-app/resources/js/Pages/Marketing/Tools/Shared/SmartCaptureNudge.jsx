import React from 'react';
import { Link } from '@inertiajs/react';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function SmartCaptureNudge({ documentType = 'invoice' }) {
    return (
        <div className="mb-6 relative overflow-hidden rounded-2xl border border-violet-500/25 bg-gradient-to-r from-brand-600/[0.04] to-brand-600/[0.02] p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[0_0_15px_rgba(139,92,246,0.05)]">
            {/* Top decorative gradient glow */}
            <div className="absolute top-0 right-1/4 w-32 h-[1px] bg-gradient-to-r from-transparent via-violet-400 to-transparent" />
            
            <div className="flex gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center flex-shrink-0 animate-pulse">
                    <Sparkles size={18} />
                </div>
                <div>
                    <h4 className="text-xs font-bold text-ink uppercase tracking-wide flex items-center gap-1.5">
                        <span>Create this {documentType} with Smart Capture AI</span>
                        <span className="px-1.5 py-0.5 rounded-md bg-violet-500/10 text-violet-600 dark:text-violet-400 text-4xs font-bold uppercase tracking-wider scale-90">
                            92% Faster
                        </span>
                    </h4>
                    <p className="text-2xs sm:text-xs text-ink-muted mt-1 leading-relaxed">
                        Tired of typing line items manually? Upload any vendor bill, handwritten list, or photo, and let AI parse it in 3 seconds. You have <strong className="text-violet-600 dark:text-violet-400 font-bold">5 free pages left</strong> this month.
                    </p>
                </div>
            </div>

            <Link
                href="/tools/smart-capture"
                className="w-full sm:w-auto px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold text-2xs uppercase tracking-wider rounded-lg shadow-md transition shrink-0 flex items-center justify-center gap-1"
            >
                <span>Use Smart Capture</span>
                <ArrowRight size={12} />
            </Link>
        </div>
    );
}
