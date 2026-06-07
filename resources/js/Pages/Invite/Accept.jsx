import React from 'react';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import { Shield, CheckCircle, XCircle, Building2, User, Briefcase } from 'lucide-react';

export default function InviteAccept({ invitation, store, admin_name, token }) {
    const { post, processing } = useForm({ token });

    const accept  = () => post(route('invite.submit'));
    const decline = () => router.post(route('invite.decline'), { token });

    const roles = invitation?.roles || ['cashier'];
    const roleLabels = {
        admin: 'Admin', manager: 'Manager', cashier: 'Cashier',
        inventory_staff: 'Inventory Staff', accountant: 'Accountant',
        support: 'Support', custom: 'Custom', viewer: 'Viewer',
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-6">
            <Head title="Accept Invitation — VenQore" />

            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-indigo-500/40">
                        <Shield size={32} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-black text-white">VenQore</h1>
                </div>

                {/* Card */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                    <h2 className="text-xl font-bold text-white mb-1">You're invited!</h2>
                    <p className="text-slate-400 text-sm mb-8">
                        <strong className="text-indigo-400">{admin_name}</strong> has invited you to join their store on VenQore.
                    </p>

                    {/* Store Info */}
                    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 mb-4">
                        <div className="w-12 h-12 bg-indigo-600/30 rounded-xl flex items-center justify-center">
                            <Building2 size={22} className="text-indigo-400" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase tracking-wider">Store</p>
                            <p className="font-bold text-white">{store?.name}</p>
                        </div>
                    </div>

                    {/* Your Name */}
                    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 mb-4">
                        <div className="w-12 h-12 bg-emerald-600/30 rounded-xl flex items-center justify-center">
                            <User size={22} className="text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase tracking-wider">Invited As</p>
                            <p className="font-bold text-white">{invitation?.invitee_name}</p>
                            <p className="text-xs text-slate-400">{invitation?.invitee_email}</p>
                        </div>
                    </div>

                    {/* Roles */}
                    <div className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 mb-8">
                        <div className="w-12 h-12 bg-violet-600/30 rounded-xl flex items-center justify-center shrink-0">
                            <Briefcase size={22} className="text-violet-400" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Your Role(s)</p>
                            <div className="flex flex-wrap gap-2">
                                {roles.map(r => (
                                    <span key={r} className="px-3 py-1 bg-indigo-600/40 text-indigo-200 rounded-full text-xs font-bold border border-indigo-500/30">
                                        {roleLabels[r] || r}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Note */}
                    <p className="text-xs text-slate-500 mb-6 text-center">
                        After accepting, the store admin will review and confirm your access before you can log in.
                    </p>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button onClick={decline} disabled={processing}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 text-slate-300 hover:text-red-300 rounded-2xl font-bold text-sm transition-all">
                            <XCircle size={18} /> Decline
                        </button>
                        <button onClick={accept} disabled={processing}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-500/30 transition-all active:scale-95">
                            <CheckCircle size={18} />
                            {processing ? 'Accepting...' : 'Accept Invite'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
