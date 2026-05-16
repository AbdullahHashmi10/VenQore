import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import { ArrowLeft, User, Shield, Briefcase, Calculator, ShoppingCart, Eye } from 'lucide-react';

export default function DemoLanding() {
    const { post, processing } = useForm();

    const roles = [
        { id: 'owner', name: 'Store Owner', icon: Shield, desc: 'Full access to all features', color: 'text-purple-500', bg: 'bg-purple-500/10' },
        { id: 'admin', name: 'Store Admin', icon: Briefcase, desc: 'Operations & staff management', color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
        { id: 'manager', name: 'Manager', icon: User, desc: 'Reports and floor supervision', color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { id: 'cashier', name: 'Cashier', icon: ShoppingCart, desc: 'POS checkout only', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        { id: 'accountant', name: 'Accountant', icon: Calculator, desc: 'Finance and journals', color: 'text-rose-500', bg: 'bg-rose-500/10' },
        { id: 'viewer', name: 'Viewer', icon: Eye, desc: 'Read-only reports', color: 'text-slate-500', bg: 'bg-slate-500/10' },
    ];

    const loginAs = (roleId) => {
        post(route('demo.login', { role: roleId }));
    };

    return (
        <div className="min-h-screen bg-[#020010] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
            <Head title="VenQore Live Demo" />

            <div className="absolute inset-0 bg-[url('/images/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-900/20 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative z-10 w-full max-w-4xl">
                <a href="/" className="inline-flex items-center gap-2 text-indigo-400 hover:text-white mb-12 transition-colors font-bold tracking-widest uppercase text-xs">
                    <ArrowLeft size={16} /> Back to VenQore
                </a>

                <div className="text-center mb-16">
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 uppercase leading-none">
                        Live Demo <span className="text-indigo-500">Store.</span>
                    </h1>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                        A real, shared environment with sample data. No sign-up required. Choose a role below to see exactly what that staff member sees.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {roles.map((role) => {
                        const Icon = role.icon;
                        return (
                            <button
                                key={role.id}
                                onClick={() => loginAs(role.id)}
                                disabled={processing}
                                className="group p-6 text-left rounded-[2rem] bg-white/5 border border-white/10 hover:bg-white/10 hover:border-indigo-500/50 transition-all active:scale-95"
                            >
                                <div className={`w-12 h-12 rounded-2xl ${role.bg} ${role.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                    <Icon size={24} />
                                </div>
                                <h3 className="text-xl font-bold mb-2">{role.name}</h3>
                                <p className="text-sm text-slate-400">{role.desc}</p>
                            </button>
                        );
                    })}
                </div>

                <div className="mt-20 text-center text-slate-500 text-sm">
                    ⚠️ The demo store resets automatically every 24 hours. Data is shared among all active demo visitors.
                </div>
            </div>
        </div>
    );
}
