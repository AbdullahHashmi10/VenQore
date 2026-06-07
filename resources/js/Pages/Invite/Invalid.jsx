import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { ShieldX, ArrowLeft, Clock } from 'lucide-react';

export default function InviteInvalid({ reason = 'not_found' }) {
    const messages = {
        expired:   { title: 'Invite Expired', body: 'This invite link was only valid for 48 hours. Ask your store admin to resend it.' },
        not_found: { title: 'Invalid Link',   body: 'This invite link doesn\'t exist or has already been used. Contact your store admin for a new one.' },
        revoked:   { title: 'Invite Revoked', body: 'The store admin has cancelled this invitation. Contact them for a new invite.' },
    };
    const msg = messages[reason] || messages.not_found;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-950 to-slate-900 flex items-center justify-center p-6">
            <Head title="Invalid Invitation — VenQore" />

            <div className="w-full max-w-md text-center">
                <div className="w-20 h-20 bg-red-500/20 border border-red-500/30 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    {reason === 'expired' ? <Clock size={40} className="text-red-400" /> : <ShieldX size={40} className="text-red-400" />}
                </div>

                <h1 className="text-2xl font-black text-white mb-3">{msg.title}</h1>
                <p className="text-slate-400 text-sm leading-relaxed mb-8">{msg.body}</p>

                <Link href="/login"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-2xl font-bold text-sm transition-all">
                    <ArrowLeft size={16} /> Back to Login
                </Link>
            </div>
        </div>
    );
}
