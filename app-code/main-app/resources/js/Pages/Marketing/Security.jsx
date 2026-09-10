import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { ArrowRight, ShieldCheck, Lock, Users, KeyRound, Database, Server } from 'lucide-react';
import MarketingLayout from './Shared/MarketingLayout';

export default function Security() {
  const PILLARS = [
    { title: 'Tenant Scope on 116 Models', desc: 'Every database query applies global tenant isolation scopes automatically.', icon: Database },
    { title: '49 Granular Permissions', desc: 'Seven role templates with precise permission controls across sell, buy, stock and cash.', icon: KeyRound },
    { title: 'Automated Isolation Laws', desc: 'Eight correctness laws executed in CI to verify cross-tenant data leakage is impossible.', icon: ShieldCheck },
    { title: '2FA & Cashier PINs', desc: 'Manager overrides, cashier unlock PINs, and time-based two-factor authentication.', icon: Lock },
    { title: 'Immutable Financial Trails', desc: 'Financial records use append-only adjustments; records cannot be silently rewritten.', icon: Server }
  ];

  return (
    <MarketingLayout
      title="Security & Isolation — How Your Books Are Protected | VenQore"
      description="VenQore security architecture: tenant isolation on 116 models, 49 permissions across 7 roles, and automated correctness laws."
    >
      <Head>
        <link rel="canonical" href="https://venqore.com/security" />
      </Head>

      <section className="vq-section pt-32 pb-16">
        <div className="vq-container relative">
          <div className="max-w-3xl">
            <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Security</span>
            <h1 className="vq-display text-4xl sm:text-5xl font-bold mt-4 tracking-tight">
              Your books are yours. <em className="vq-italic">Structurally</em>.
            </h1>
            <p className="vq-lede text-lg sm:text-xl text-ink-muted mt-6 leading-relaxed">
              When software holds your money and inventory records, security cannot be an afterthought or a marketing claim. It must be built into the database architecture, query filters, and deployment laws.
            </p>
            <div className="flex flex-wrap gap-4 mt-8">
              <Link className="vq-btn vq-btn--primary vq-btn--lg" href="/build-workspace">
                Start building <span className="vq-btn__arrow"><ArrowRight size={16} /></span>
              </Link>
              <Link className="vq-btn vq-btn--secondary vq-btn--lg" href="/ledger">
                See ledger correctness
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="vq-section pt-0 pb-20">
        <div className="vq-container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PILLARS.map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.title} className="vq-card p-6 rounded-2xl bg-sunken dark:bg-void-900 border border-line dark:border-white/10 space-y-3">
                  <span className="p-3 bg-accent-fill/10 text-accent-text rounded-xl inline-block"><Icon size={20} /></span>
                  <h3 className="text-base font-bold text-ink">{p.title}</h3>
                  <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">{p.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
