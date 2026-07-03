import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import { ArrowLeft, User, Shield, Briefcase, Calculator, ShoppingCart, Eye } from 'lucide-react';

/* Demo role picker — "The Ledger" system (2026-07-03).
   Dark cover page, mono entry labels, no ambient effects.
   Crawler HTML for /demo lives in app/Support/MarketingSeo.php. */
export default function DemoLanding() {
    const { post, processing } = useForm();

    const roles = [
        { id: 'owner', name: 'Store Owner', icon: Shield, desc: 'Full access to every feature and report' },
        { id: 'admin', name: 'Store Admin', icon: Briefcase, desc: 'Operations & staff management' },
        { id: 'manager', name: 'Manager', icon: User, desc: 'Reports and floor supervision' },
        { id: 'cashier', name: 'Cashier', icon: ShoppingCart, desc: 'POS checkout only' },
        { id: 'accountant', name: 'Accountant', icon: Calculator, desc: 'Finance, journals and reconciliation' },
        { id: 'viewer', name: 'Viewer', icon: Eye, desc: 'Read-only reports' },
    ];

    const loginAs = (roleId) => {
        post(route('demo.login', { role: roleId }));
    };

    return (
        <div className="min-h-screen bg-[#071614] text-[#F5F2E9] flex flex-col items-center justify-center px-6 py-16 relative overflow-hidden antialiased" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
            <Head title="VenQore Live Demo — Explore a Real Store, No Signup">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=fraunces:400,500,600|ibm-plex-mono:400,500,600|inter:400,500,600,700&display=swap" rel="stylesheet" />
            </Head>

            <div aria-hidden="true" className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(75% 60% at 50% 12%, rgba(30,126,130,0.28) 0%, rgba(7,22,20,0) 62%)' }} />

            <div className="relative z-10 w-full max-w-4xl">
                <a href="/" className="inline-flex items-center gap-2 text-[#7FE9CE] hover:text-white mb-12 transition-colors font-mono text-[11px] tracking-[0.28em] uppercase focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#7FE9CE] rounded">
                    <ArrowLeft size={15} aria-hidden="true" /> Back to VenQore
                </a>

                <div className="text-center mb-14">
                    <p className="font-mono text-[11px] tracking-[0.34em] uppercase text-[#C4A468] mb-6">
                        A real store · resets daily · no signup
                    </p>
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-medium mb-6 leading-[1.05]" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
                        Walk into the demo store.
                    </h1>
                    <p className="text-base sm:text-lg text-[rgba(245,242,233,0.68)] max-w-2xl mx-auto leading-relaxed">
                        A shared environment with live sample data. Pick a role to see exactly
                        what that staff member sees — then sell something and watch it land in
                        the books, balanced.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {roles.map((role) => {
                        const Icon = role.icon;
                        return (
                            <button
                                key={role.id}
                                onClick={() => loginAs(role.id)}
                                disabled={processing}
                                className="group p-6 text-left rounded-2xl bg-[rgba(245,242,233,0.03)] border border-[rgba(245,242,233,0.1)] hover:border-[rgba(127,233,206,0.45)] hover:bg-[rgba(127,233,206,0.04)] transition-colors duration-300 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7FE9CE]"
                            >
                                <Icon size={21} className="text-[#7FE9CE] mb-5" aria-hidden="true" />
                                <h2 className="text-lg font-semibold mb-1.5" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>{role.name}</h2>
                                <p className="text-[13px] leading-relaxed text-[rgba(245,242,233,0.55)]">{role.desc}</p>
                            </button>
                        );
                    })}
                </div>

                <p className="mt-16 text-center text-[rgba(245,242,233,0.45)] text-[13px] font-mono tracking-wide">
                    The demo resets every 24 hours · data is shared among active visitors
                </p>
            </div>
        </div>
    );
}
