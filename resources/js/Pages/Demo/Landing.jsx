import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, User, Shield, Briefcase, Calculator, ShoppingCart, Eye, RefreshCw } from 'lucide-react';
import SiteChrome from '@/Components/Site/SiteChrome';

/* Live demo role picker — now inside the shared site chrome (header, footer,
   cookie consent) and on V6 tokens, so it reads in both themes. The role
   login is unchanged: a full-page navigation to route('demo.login', {role}). */
export default function DemoLanding() {
    const { post, processing } = useForm();

    const roles = [
        { id: 'owner', name: 'Store Owner', icon: Shield, desc: 'Full access to all features', tone: 'var(--vq-accent-text)' },
        { id: 'admin', name: 'Store Admin', icon: Briefcase, desc: 'Operations & staff management', tone: 'var(--vq-accent-text)' },
        { id: 'manager', name: 'Manager', icon: User, desc: 'Reports and floor supervision', tone: 'var(--vq-info)' },
        { id: 'cashier', name: 'Cashier', icon: ShoppingCart, desc: 'POS checkout only', tone: 'var(--vq-success)' },
        { id: 'accountant', name: 'Accountant', icon: Calculator, desc: 'Finance and journals', tone: 'var(--vq-danger)' },
        { id: 'viewer', name: 'Viewer', icon: Eye, desc: 'Read-only reports', tone: 'var(--vq-text-2)' },
    ];

    const loginAs = (roleId) => {
        window.location.href = route('demo.login', { role: roleId });
    };

    return (
        <SiteChrome underHeader>
            <Head title="VenQore Live Demo" />

            <section className="vq-section vq-mc-top">
                <div className="vq-amb" aria-hidden="true"><span className="vq-amb__aurora" style={{ opacity: 0.26 }} /></div>
                <div className="vq-container" style={{ position: 'relative' }}>
                    <div className="vq-mc-back">
                        <a href="/" className="vq-link">
                            <ArrowLeft size={16} aria-hidden="true" /> Back to VenQore
                        </a>
                    </div>

                    <div className="vq-mc-head">
                        <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Live demo · no sign-up</span>
                        <h1 className="vq-display vq-mt-4">Live demo <em className="vq-italic">store.</em></h1>
                        <p className="vq-lede vq-mt-6">
                            A real, shared environment with sample data. No sign-up required. Choose a role below to see exactly what that staff member sees.
                        </p>
                    </div>
                </div>
            </section>

            <section className="vq-section vq-mc-body">
                <div className="vq-container">
                    <div className="vq-mc-rowhead">
                        <h2 className="vq-h2">Choose a role</h2>
                    </div>

                    <div className="vq-grid vq-grid--3">
                        {roles.map((role) => {
                            const Icon = role.icon;
                            return (
                                <button
                                    key={role.id}
                                    type="button"
                                    onClick={() => loginAs(role.id)}
                                    disabled={processing}
                                    className="vq-card vq-card--interactive vq-mc-role"
                                >
                                    <span className="vq-mc-icon" style={{ '--tone': role.tone }}>
                                        <Icon size={22} aria-hidden="true" />
                                    </span>
                                    <span className="vq-mc-lcard__title">{role.name}</span>
                                    <span className="vq-body vq-text-2">{role.desc}</span>
                                    <span className="vq-mc-lcard__cta vq-mc-role__go">
                                        Enter as {role.name} <ArrowRight size={15} aria-hidden="true" />
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="vq-mc-callout vq-mc-callout--warning vq-mt-12" role="note">
                        <RefreshCw size={20} aria-hidden="true" />
                        <p style={{ color: 'var(--vq-text)', maxWidth: 'none' }}>
                            The demo store resets automatically every 24 hours. Data is shared among all active demo visitors.
                        </p>
                    </div>
                </div>
            </section>
        </SiteChrome>
    );
}
