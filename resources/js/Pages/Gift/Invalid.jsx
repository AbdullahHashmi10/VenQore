import React from 'react';
import { Head } from '@inertiajs/react';
import { XCircle, Ban, Clock, CheckCircle2, HelpCircle } from 'lucide-react';

const REASON_COPY = {
    not_found: {
        icon: HelpCircle,
        title: "This link doesn't exist",
        body: "The gift link you followed isn't recognized. Double-check the URL, or ask whoever sent it to you for a fresh one.",
    },
    revoked: {
        icon: Ban,
        title: 'This gift link was revoked',
        body: 'Whoever sent you this link has cancelled it. Reach out to them if you were expecting access.',
    },
    expired: {
        icon: Clock,
        title: 'This gift link has expired',
        body: "This link was only valid for a limited time and that window has passed. Ask for a new one.",
    },
    exhausted: {
        icon: CheckCircle2,
        title: 'This gift link has already been used',
        body: 'This link was limited to a certain number of redemptions, and it has reached that limit.',
    },
};

export default function GiftInvalid({ reason }) {
    const copy = REASON_COPY[reason] || REASON_COPY.not_found;
    const Icon = copy.icon;

    return (
        <div className="min-h-screen bg-[#020010] text-white font-sans flex items-center justify-center p-8">
            <Head><title>Gift Link Unavailable — VenQore</title></Head>

            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-[500px] h-[500px] bg-slate-600/10 rounded-full blur-[120px]" />
                </div>
            </div>

            <div className="relative z-10 max-w-lg w-full text-center">
                <div className="w-20 h-20 mx-auto rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center mb-8">
                    <Icon size={32} className="text-slate-400" />
                </div>

                <h1 className="text-2xl font-black mb-3">{copy.title}</h1>
                <p className="text-slate-500 text-base leading-relaxed mb-8">{copy.body}</p>

                <a
                    href="/"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 font-bold text-sm transition-all"
                >
                    Go to VenQore
                </a>
            </div>
        </div>
    );
}
