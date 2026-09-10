import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { ArrowRight, Play, Check, Clock, Sparkles } from 'lucide-react';
import MarketingLayout from './Shared/MarketingLayout';

export default function Onboarding() {
  const STEPS = [
    { num: '01', title: 'Describe your business', desc: 'Type what you sell, where you operate, and how your team works in natural language.' },
    { num: '02', title: 'Blueprint drafts your ERP', desc: 'AI selects exact modules, configures your taxonomy, and sets up approval rules.' },
    { num: '03', title: 'Review & adjust every line', desc: 'Inspect the generated configuration. Edit vocabulary, toggle modules, approve tax settings.' },
    { num: '04', title: 'Start taking transactions', desc: 'Your live workspace launches immediately with initial charts of accounts and registers.' }
  ];

  return (
    <MarketingLayout
      title="See a Build — From Business Idea to Working ERP in 4 Minutes | VenQore"
      description="Watch how Blueprint builds an entire point of sale and accounting platform from a plain English prompt in four minutes."
    >
      <Head>
        <link rel="canonical" href="https://venqore.com/onboarding" />
      </Head>

      <section className="vq-section pt-32 pb-16">
        <div className="vq-container relative">
          <div className="max-w-3xl">
            <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">See a Build</span>
            <h1 className="vq-display text-4xl sm:text-5xl font-bold mt-4 tracking-tight">
              Four minutes. <em className="vq-italic">Prompt</em> to live system.
            </h1>
            <p className="vq-lede text-lg sm:text-xl text-ink-muted mt-6 leading-relaxed">
              No months-long consultant implementations, no $15,000 setup invoices. See how VenQore constructs a complete, production-ready system tailored specifically to your trade.
            </p>
            <div className="flex flex-wrap gap-4 mt-8">
              <Link className="vq-btn vq-btn--primary vq-btn--lg" href="/build-workspace">
                Build your workspace <span className="vq-btn__arrow"><ArrowRight size={16} /></span>
              </Link>
              <Link className="vq-btn vq-btn--secondary vq-btn--lg" href="/blueprint">
                Explore Blueprint
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="vq-section pt-0 pb-20">
        <div className="vq-container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((s) => (
              <div key={s.num} className="vq-card p-6 rounded-2xl bg-sunken dark:bg-void-900 border border-line dark:border-white/10 space-y-3">
                <span className="font-mono text-sm font-bold text-accent-text block">{s.num}</span>
                <h3 className="text-base font-bold text-ink">{s.title}</h3>
                <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
