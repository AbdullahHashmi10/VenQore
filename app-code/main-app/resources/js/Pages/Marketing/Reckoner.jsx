import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { ArrowRight, BarChart2, ShieldCheck, Database, Cpu, CheckCircle } from 'lucide-react';
import MarketingLayout from './Shared/MarketingLayout';

export default function Reckoner() {
  return (
    <MarketingLayout
      title="The Reckoner — The Single Place Any Metric Is Defined | VenQore"
      description="The Reckoner is VenQore's metric layer: the single place any business number is defined. All 58 dashboard readings and 40 reports query it."
    >
      <Head>
        <link rel="canonical" href="https://venqore.com/reckoner" />
      </Head>

      <section className="vq-section pt-32 pb-16">
        <div className="vq-container relative">
          <div className="max-w-3xl">
            <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">The Reckoner</span>
            <h1 className="vq-display text-4xl sm:text-5xl font-bold mt-4 tracking-tight">
              One place a number can be <em className="vq-italic">defined</em>.
            </h1>
            <p className="vq-lede text-lg sm:text-xl text-ink-muted mt-6 leading-relaxed">
              The Reckoner is VenQore's metric layer: the single place any business number — revenue, margin, stock value, receivables — is defined. All 58 dashboard readings and every one of the 40 reports ask it rather than calculating their own. That is why your dashboard and your profit and loss cannot disagree.
            </p>
            <div className="flex flex-wrap gap-4 mt-8">
              <Link className="vq-btn vq-btn--primary vq-btn--lg" href="/build-workspace">
                Start building <span className="vq-btn__arrow"><ArrowRight size={16} /></span>
              </Link>
              <Link className="vq-btn vq-btn--secondary vq-btn--lg" href="/dashboard-preview">
                See it on a dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="vq-section pt-0">
        <div className="vq-container">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="vq-card p-6 rounded-2xl bg-sunken dark:bg-void-900 border border-line dark:border-white/10">
              <span className="text-xs font-bold text-ink-secondary uppercase tracking-widest block">Readings</span>
              <span className="text-3xl font-bold text-ink mt-2 block font-mono">58</span>
              <span className="text-xs text-ink-muted mt-1 block">Every figure the product shows, defined once</span>
            </div>
            <div className="vq-card p-6 rounded-2xl bg-sunken dark:bg-void-900 border border-line dark:border-white/10">
              <span className="text-xs font-bold text-ink-secondary uppercase tracking-widest block">Period windows</span>
              <span className="text-3xl font-bold text-ink mt-2 block font-mono">18</span>
              <span className="text-xs text-ink-muted mt-1 block">Each with a comparison window behind it</span>
            </div>
            <div className="vq-card p-6 rounded-2xl bg-sunken dark:bg-void-900 border border-line dark:border-white/10">
              <span className="text-xs font-bold text-ink-secondary uppercase tracking-widest block">Correctness Laws</span>
              <span className="text-3xl font-bold text-ink mt-2 block font-mono">8</span>
              <span className="text-xs text-ink-muted mt-1 block">Rigorous invariant laws tested on every build</span>
            </div>
            <div className="vq-card p-6 rounded-2xl bg-sunken dark:bg-void-900 border border-line dark:border-white/10">
              <span className="text-xs font-bold text-ink-secondary uppercase tracking-widest block">Single Definition</span>
              <span className="text-3xl font-bold text-ink mt-2 block font-mono">1</span>
              <span className="text-xs text-ink-muted mt-1 block">A build check fails if duplicate math appears</span>
            </div>
          </div>
        </div>
      </section>

      <section className="vq-section vq-section--alt py-20">
        <div className="vq-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="vq-eyebrow">The problem it exists to kill</span>
              <h2 className="vq-display text-3xl sm:text-4xl font-bold mt-4">Six places computed "revenue". They disagreed.</h2>
              <p className="vq-lede text-base sm:text-lg text-ink-muted mt-6 leading-relaxed">
                That is the state most business software is in, and nobody tells you. A sale reversed by a journal entry vanishes from one figure and not the other. The dashboard says one number and the P&amp;L says another, and you cannot tell which is real.
              </p>
              <p className="text-sm sm:text-base text-ink-muted mt-4 leading-relaxed">
                Once you cannot tell, you stop trusting all of them — and an ERP whose numbers you do not trust is a very expensive filing cabinet. So we made it structurally impossible: one registry, one definition per figure, and a check in the build that fails if a second definition appears anywhere in the codebase.
              </p>
            </div>
            <div className="vq-card p-8 rounded-2xl bg-surface dark:bg-void-950 border border-line dark:border-white/10 font-mono text-xs sm:text-sm text-ink space-y-3">
              <span className="text-2xs font-bold uppercase tracking-widest text-accent-text block">One request, one answer</span>
              <div className="p-4 rounded-xl bg-sunken dark:bg-void-900 border border-line dark:border-white/5 space-y-1">
                <div><span className="text-teal-500">reckoner</span>.read(<b>'finance.gross_profit'</b>,</div>
                <div className="pl-6">period: <b>'this_quarter'</b>)</div>
                <div className="text-ink-muted pt-2">→ value &nbsp; &nbsp; &nbsp; &nbsp;842,610</div>
                <div className="text-ink-muted">→ previous &nbsp; &nbsp; 731,400</div>
                <div className="text-emerald-500">→ delta &nbsp; &nbsp; &nbsp; &nbsp;+15.2%</div>
              </div>
              <p className="text-xs text-ink-muted pt-2">
                Every chart, summary card, export and AI prompt receives the identical response.
              </p>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
