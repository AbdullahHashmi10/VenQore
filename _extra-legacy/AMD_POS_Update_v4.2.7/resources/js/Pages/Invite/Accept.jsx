import React from 'react';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import { Shield, CheckCircle, XCircle, Building2, User, Briefcase } from 'lucide-react';

export default function InviteAccept({ invitation, store, admin_name, token }) {
    const { post, processing } = useForm({ token });

    const accept  = () => post('/invite/accept', { preserveState: true, preserveScroll: true });
    const decline = () => router.post('/invite/decline', { token }, { preserveState: true, preserveScroll: true });

    const roles = invitation?.roles || ['cashier'];
    const roleLabels = {
        admin: 'Admin', manager: 'Manager', cashier: 'Cashier',
        inventory_staff: 'Inventory Staff', accountant: 'Accountant',
        support: 'Support', custom: 'Custom', viewer: 'Viewer',
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4 sm:p-6">
            <Head title="Accept Invitation — VenQore" />

            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-6 sm:mb-8">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-2xl shadow-indigo-500/40">
                        <Shield className="text-white w-6 h-6 sm:w-8 sm:h-8" />
                    </div>
                    <h1 className="text-2xl font-black text-white">VenQore</h1>
                </div>

                {/* Card */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-8 shadow-2xl">
                    <h2 className="text-xl font-bold text-white mb-1">You're invited!</h2>
                    <p className="text-slate-400 text-sm mb-6 sm:mb-8">
                        <strong className="text-indigo-400">{admin_name}</strong> has invited you to join their store on VenQore.
                    </p>

                    {/* Store Info */}
                    <div className="flex items-center gap-3 sm:gap-4 p-3.5 sm:p-4 bg-white/5 rounded-2xl border border-white/10 mb-3 sm:mb-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-600/30 rounded-xl flex items-center justify-center shrink-0">
                            <Building2 className="text-indigo-400 w-5 h-5 sm:w-[22px] sm:h-[22px]" />
                        </div>
                        <div>
                            <p className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider">Store</p>
                            <p className="text-sm sm:text-base font-bold text-white leading-tight">{store?.name}</p>
                        </div>
                    </div>

                    {/* Your Name */}
                    <div className="flex items-center gap-3 sm:gap-4 p-3.5 sm:p-4 bg-white/5 rounded-2xl border border-white/10 mb-3 sm:mb-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-600/30 rounded-xl flex items-center justify-center shrink-0">
                            <User className="text-emerald-400 w-5 h-5 sm:w-[22px] sm:h-[22px]" />
                        </div>
                        <div>
                            <p className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider">Invited As</p>
                            <p className="text-sm sm:text-base font-bold text-white leading-tight">{invitation?.invitee_name}</p>
                            <p className="text-xs text-slate-400/90 leading-tight mt-0.5">{invitation?.invitee_email}</p>
                        </div>
                    </div>

                    {/* Roles */}
                    <div className="flex items-start gap-3 sm:gap-4 p-3.5 sm:p-4 bg-white/5 rounded-2xl border border-white/10 mb-6 sm:mb-8">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-violet-600/30 rounded-xl flex items-center justify-center shrink-0">
                            <Briefcase className="text-violet-400 w-5 h-5 sm:w-[22px] sm:h-[22px]" />
                        </div>
                        <div>
                            <p className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider mb-2">Your Role(s)</p>
                            <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                {roles.map(r => (
                                    <span key={r} className="px-2.5 py-0.5 sm:px-3 sm:py-1 bg-indigo-600/40 text-indigo-200 rounded-full text-[10px] sm:text-xs font-bold border border-indigo-500/30">
                                        {roleLabels[r] || r}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Note */}
                    <p className="text-xs text-slate-400 mb-5 sm:mb-6 text-center leading-relaxed">
                        After accepting, you will be redirected to the store hub to access your dashboard.
                    </p>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button onClick={accept} disabled={processing}
                            className="w-full sm:flex-1 order-1 sm:order-2 flex items-center justify-center gap-2 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-500/30 transition-all active:scale-95">
                            <CheckCircle size={18} />
                            {processing ? 'Accepting...' : 'Accept Invite'}
                        </button>
                        <button onClick={decline} disabled={processing}
                            className="w-full sm:flex-1 order-2 sm:order-1 flex items-center justify-center gap-2 py-3.5 bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 text-slate-300 hover:text-red-300 rounded-2xl font-bold text-sm transition-all">
                            <XCircle size={18} /> Decline
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
