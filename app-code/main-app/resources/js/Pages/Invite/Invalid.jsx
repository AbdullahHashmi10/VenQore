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
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4 sm:p-6">
            <Head title="Invalid Invitation — VenQore" />

            <div className="w-full max-w-md">
                {/* Card */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl text-center animate-fade-in">
                    {/* Icon */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center justify-center mx-auto mb-5 sm:mb-6 shadow-xl shadow-red-900/10">
                        {reason === 'expired' ? (
                            <Clock className="text-red-400 w-8 h-8 sm:w-10 sm:h-10" />
                        ) : (
                            <ShieldX className="text-red-400 w-8 h-8 sm:w-10 sm:h-10" />
                        )}
                    </div>

                    <h1 className="text-xl sm:text-2xl font-black text-white mb-2 sm:mb-3">{msg.title}</h1>
                    <p className="text-slate-400 text-sm leading-relaxed mb-6 sm:mb-8 max-w-sm mx-auto">{msg.body}</p>

                    <Link href="/login"
                        className="w-full inline-flex items-center justify-center gap-2 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl font-bold text-sm transition-all active:scale-98">
                        <ArrowLeft size={16} /> Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}
