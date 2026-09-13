import React, { useEffect, useState } from 'react';
import { useTheme } from '@/Contexts/ThemeContext';
import { Head, Link, usePage } from '@inertiajs/react';
import SiteHeader from '@/Components/Site/SiteHeader';
import SiteFooter from '@/Components/Site/SiteFooter';
import CookieConsent from '@/Components/CookieConsent';

export default function Pricing() {
    const { isDarkMode, toggleTheme } = useTheme();
    const { auth = {}, flash = {}, ...props } = usePage().props;
    const [billingPeriod, setBillingPeriod] = useState('year');
    const isAnnual = billingPeriod === 'year';

    useEffect(() => {
        // Unlock document and body scrolling for marketing shell
        document.documentElement.setAttribute('data-vq-shell', 'marketing');
        document.documentElement.style.overflowY = 'auto';
        document.documentElement.style.overflowX = 'clip';
        document.body.style.overflow = 'visible';
        document.body.style.height = 'auto';
        const appRoot = document.getElementById('app');
        if (appRoot) {
            appRoot.style.height = 'auto';
            appRoot.style.overflow = 'visible';
        }

        let active = true;

        const loadScript = (src) => {
            return new Promise((resolve, reject) => {
                const existing = document.querySelector(`script[src="${src}"]`);
                if (existing) {
                    existing.remove();
                }
                const script = document.createElement('script');
                script.src = src;
                script.async = false;
                script.onload = () => resolve();
                script.onerror = () => reject(new Error(`Failed to load ${src}`));
                document.body.appendChild(script);
            });
        };

        const initEngines = async () => {
            try {
                await loadScript('/v6/assets/venqore.js');
                await loadScript('/v6/assets/venqore-forms.js');
                
                window.dispatchEvent(new Event('resize'));
                window.dispatchEvent(new Event('scroll'));
            } catch (err) {
                console.warn('VenQore visual engines init notice:', err);
            }
        };

        const timer = setTimeout(() => {
            if (active) initEngines();
        }, 50);

        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, []);

    return (
        <>
            <Head>
                <title>Pricing — from $41/month or free forever, no implementation fee | VenQore</title>
                <meta name="description" content="Traditional ERP implementations can cost tens of thousands of dollars a year. VenQore starts at $41 a month (billed annually) — or free. Every plan carries universal business modules and the complete double-entry ledger. Reports start at $49." />
                <link rel="canonical" href="https://venqore.com/pricing" />
                <meta property="og:title" content="Pricing — from $41/month or free forever, no implementation fee | VenQore" />
                <meta property="og:description" content="Traditional ERP implementations can cost tens of thousands of dollars a year. VenQore starts at $41 a month (billed annually) — or free. Every plan carries universal business modules and the complete double-entry ledger. Reports start at $49." />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://venqore.com/pricing" />
                <meta property="og:image" content="https://venqore.com/images/og/venqore-og.png" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Pricing — from $41/month or free forever, no implementation fee | VenQore" />
                <meta name="twitter:description" content="Traditional ERP implementations can cost tens of thousands of dollars a year. VenQore starts at $41 a month (billed annually) — or free. Every plan carries universal business modules and the complete double-entry ledger. Reports start at $49." />
                <meta name="twitter:image" content="https://venqore.com/images/og/venqore-og.png" />
            </Head>

            <div className="vq-site vq-app-body" style={{ background: 'var(--vq-bg)', color: 'var(--vq-text)', overflow: 'visible', minHeight: '100vh' }}>



  <SiteHeader />

<main id="main">

<section className="vq-section" style={{"paddingTop":"clamp(140px,15vw,200px)","paddingBottom":"clamp(40px,5vw,60px)"}}>
  <div className="vq-amb"><span className="vq-amb__aurora" style={{"opacity":".30"}}></span></div>
  <div className="vq-container" style={{"position":"relative"}}>
    <div style={{"maxWidth":"860px"}}>
      <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Pricing</span>
      <h1 className="vq-display vq-mt-4">Priced like software. Not like a <em className="vq-italic">project</em>.</h1>
      <p className="vq-lede vq-mt-6"><strong>Traditional ERP implementations can cost tens of thousands of dollars a year. VenQore starts at $41 a month — or free.</strong><br /><span className="vq-small vq-text-2" style={{"display":"inline-block","marginTop":"8px"}}>* Published industry benchmarks put traditional ERP implementations in the tens of thousands of dollars per year. VenQore serves small and independent businesses; the comparison is to overall total cost of ownership.</span></p>
      <p className="vq-text-2 vq-mt-4">Every paid plan carries universal business modules, the full double-entry ledger and tiered financial reports. Plans differ by operational scale: seats, locations, catalogue capacity, and advanced scale fences.</p>
    </div>
  </div>
</section>

<section className="vq-section" style={{"paddingTop":"clamp(24px,3vw,44px)","paddingBottom":"clamp(64px,8vw,100px)"}}>
  <div className="vq-container">
    <div className="vq-center vq-reveal" style={{"marginBottom":"clamp(40px,5vw,64px)","paddingTop":"12px"}}>
      <div className="vq-seg" role="tablist" aria-label="Billing period">
        <button
          type="button"
          className="vq-seg__btn"
          role="tab"
          aria-selected={!isAnnual}
          onClick={() => setBillingPeriod('month')}
        >
          Monthly
        </button>
        <button
          type="button"
          className="vq-seg__btn"
          role="tab"
          aria-selected={isAnnual}
          onClick={() => setBillingPeriod('year')}
        >
          Annual — 2 months free
        </button>
      </div>
    </div>

    <div className="vq-grid vq-grid--4">
      
      <div className="vq-plan vq-reveal">
        <span className="vq-plan__flag" style={{"background":"var(--vq-surface-2)","color":"var(--vq-text-2)","borderColor":"var(--vq-line)"}}>Free forever</span>
        <h2 className="vq-plan__name">Solo</h2>
        <p className="vq-plan__for">One person, one register. Free forever with structural limits.</p>
        <div className="vq-plan__price">
          <span className="vq-plan__amt">$0</span>
          <span className="vq-plan__per">/forever</span>
        </div>
        <div className="vq-plan__billing-note" style={{ fontSize: '12.5px', color: 'var(--vq-text-3)', minHeight: '20px', marginTop: '2px', marginBottom: '8px' }}>
          <span>Free forever · No credit card required</span>
        </div>
        <ul className="vq-plan__list">
          <li><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span>Up to <b>500 products</b> (SKUs)</span></li>
          <li><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span><b>1 location</b>, <b>1 full seat</b></span></li>
          <li><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span><b>1 register</b> (2 cashier PIN logins)</span></li>
          <li><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span>100 sales &amp; 20 service jobs/month</span></li>
          <li><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span>Core Ledger + <b>9 live dashboard cards</b> (no report screens)</span></li>
          <li><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span><b>30-day history visible</b> (older data safely kept)</span></li>
          <li><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span>SmartCapture: 10 scans / 100 AI credits</span></li>
          <li><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span>Help centre + Vena support</span></li>
        </ul>
        <a href="/build-workspace?plan=solo" className="vq-btn vq-btn--secondary vq-btn--lg vq-btn--block">Choose Solo</a>
      </div>

      <div className="vq-plan vq-reveal">
        <h2 className="vq-plan__name">Starter</h2>
        <p className="vq-plan__for">A shop with a couple of people on the till and full history.</p>
        <div className="vq-plan__price">
          <span className="vq-plan__amt">{isAnnual ? '$41' : '$49'}</span>
          <span className="vq-plan__per">/month</span>
        </div>
        <div className="vq-plan__billing-note" style={{ fontSize: '12.5px', color: 'var(--vq-text-3)', minHeight: '20px', marginTop: '2px', marginBottom: '8px' }}>
          {isAnnual ? (
            <span>Billed annually <b style={{ color: 'var(--vq-text-2)', fontWeight: 600 }}>($490/yr)</b> · <span style={{ color: 'var(--vq-accent-text)', fontWeight: 600 }}>2 months free</span></span>
          ) : (
            <span>Billed monthly ($588/yr)</span>
          )}
        </div>
        <ul className="vq-plan__list">
          <li><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span>Up to <b>5,000 products</b> (SKUs)</span></li>
          <li><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span><b>1 location</b>, <b>1 full seat</b> (+ $15/mo per extra seat)</span></li>
          <li><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span><b>2 registers</b> (cashier PIN logins unlimited)</span></li>
          <li><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span><b>20 Essential reports</b> (P&amp;L, Sales, Cash &amp; Tax)</span></li>
          <li><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span><b>Full history retention</b> (unlimited days)</span></li>
          <li><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span>Google Drive backup included</span></li>
          <li><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span>500 AI credits/month + 1 rebuild / 90 days</span></li>
          <li><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span>Email support (2 business days)</span></li>
        </ul>
        <a href={isAnnual ? "/build-workspace?plan=starter&billing=annual" : "/build-workspace?plan=starter"} className="vq-btn vq-btn--secondary vq-btn--lg vq-btn--block">Choose Starter</a>
      </div>

      <div className="vq-plan vq-plan--featured vq-reveal">
        <span className="vq-plan__flag">Most popular</span>
        <h2 className="vq-plan__name">Core</h2>
        <p className="vq-plan__for">Multi-branch stock, API access, audit logs, custom roles and signals.</p>
        <div className="vq-plan__price">
          <span className="vq-plan__amt">{isAnnual ? '$83' : '$99'}</span>
          <span className="vq-plan__per">/month</span>
        </div>
        <div className="vq-plan__billing-note" style={{ fontSize: '12.5px', color: 'var(--vq-text-3)', minHeight: '20px', marginTop: '2px', marginBottom: '8px' }}>
          {isAnnual ? (
            <span>Billed annually <b style={{ color: 'var(--vq-text-2)', fontWeight: 600 }}>($990/yr)</b> · <span style={{ color: 'var(--vq-accent-text)', fontWeight: 600 }}>2 months free</span></span>
          ) : (
            <span>Billed monthly ($1,188/yr)</span>
          )}
        </div>
        <ul className="vq-plan__list">
          <li><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span>Up to <b>25,000 products</b> (SKUs)</span></li>
          <li><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span><b>1 location</b>, <b>5 full seats</b> (+ $15/mo per extra seat)</span></li>
          <li><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span>Up to <b>6 registers</b> (cashier PIN logins unlimited)</span></li>
          <li><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span><b>32 Core reports &amp; analytics</b> (Profitability &amp; Aging)</span></li>
          <li><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span>Multi-branch transfers (activates with 2nd location)</span></li>
          <li><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span><b>Full API access &amp; webhooks</b></span></li>
          <li><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span>Audit trail &amp; custom granular roles</span></li>
          <li><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span>2,000 AI credits/month + 1 rebuild / 90 days</span></li>
        </ul>
        <a href={isAnnual ? "/build-workspace?plan=core&billing=annual" : "/build-workspace?plan=core"} className="vq-btn vq-btn--primary vq-btn--lg vq-btn--block">Start 14-day trial</a>
      </div>

      <div className="vq-plan vq-reveal">
        <h2 className="vq-plan__name">Scale</h2>
        <p className="vq-plan__for">Large operations, custom roles, white-label and channel sync.</p>
        <div className="vq-plan__price">
          <span className="vq-plan__amt">{isAnnual ? '$249' : '$299'}</span>
          <span className="vq-plan__per">/month</span>
        </div>
        <div className="vq-plan__billing-note" style={{ fontSize: '12.5px', color: 'var(--vq-text-3)', minHeight: '20px', marginTop: '2px', marginBottom: '8px' }}>
          {isAnnual ? (
            <span>Billed annually <b style={{ color: 'var(--vq-text-2)', fontWeight: 600 }}>($2,990/yr)</b> · <span style={{ color: 'var(--vq-accent-text)', fontWeight: 600 }}>2 months free</span></span>
          ) : (
            <span>Billed monthly ($3,588/yr)</span>
          )}
        </div>
        <ul className="vq-plan__list">
          <li><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span>Up to <b>250,000 products</b> (SKUs)</span></li>
          <li><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span><b>1 location</b>, <b>25 full seats</b></span></li>
          <li><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span>Up to <b>20 registers</b> (cashier PIN logins unlimited)</span></li>
          <li><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span><b>All 40 reports</b> &amp; Consolidated multi-entity</span></li>
          <li><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span>Multi-branch &amp; inter-branch transfers</span></li>
          <li><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span>White-label &amp; custom domain</span></li>
          <li><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span><b>2 channel syncs included</b> (WooCommerce/Amazon)</span></li>
          <li><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span>Named contact (4 business hours SLA)</span></li>
        </ul>
        <a href={isAnnual ? "/build-workspace?plan=scale&billing=annual" : "/build-workspace?plan=scale"} className="vq-btn vq-btn--secondary vq-btn--lg vq-btn--block">Choose Scale</a>
      </div>
    </div>

    <p className="vq-center vq-small vq-text-2 vq-mt-8 vq-reveal" style={{"maxWidth":"none"}}>
      Need more users, more branches, or custom SLA? <a href="/contact">Tell us what you need →</a>
    </p>
  </div>
</section>

<section className="vq-section vq-section--alt">
  <div className="vq-container">
    <div className="vq-card vq-card--xl vq-reveal">
      <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">In every plan</span>
      <h2 className="vq-h2 vq-mt-4">Nothing important is withheld.</h2>
      <div className="vq-grid vq-grid--3 vq-mt-8">
        <div className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">The complete double-entry ledger</span></div><div className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Tiered financial reports (Starter and up)</span></div><div className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Unlimited monthly transactions</span></div><div className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Your data exportable at any time</span></div><div className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Every new feature we ship, at no extra cost</span></div><div className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Offline mode at the POS till</span></div>
      </div>
      <div className="vq-hr" style={{"marginBlock":"var(--vq-space-8)"}}></div>
      <p className="vq-h3">No implementation fee. No setup fee. No module fees. No consultant.</p>
    </div>
  </div>
</section>

<section className="vq-section">
  <div className="vq-container">
    <div className="vq-section-head vq-reveal">
      <span className="vq-eyebrow">Line by line</span>
      <h2 className="vq-display">Compare the plans.</h2>
    </div>
    <div className="vq-table-wrap vq-reveal">
      <table className="vq-table vq-table--compare">
        <colgroup><col style={{"width":"34%"}} /><col /><col /><col className="is-us" /><col /></colgroup>
        <thead><tr>
          <th></th><th>Solo (Free)</th><th>Starter</th><th style={{"color":"var(--vq-accent-text)"}}>Core</th><th>Scale</th>
        </tr></thead>
        <tbody>
        <tr><td colSpan="5" style={{"padding":"22px 0 6px","background":"var(--vq-surface-2)","borderBottom":"1px solid var(--vq-line)"}}><span className="vq-eyebrow vq-eyebrow--accent" style={{"paddingLeft":"2px"}}>Operational limits</span></td></tr>
        <tr><td className="vq-table__row-head">Monthly price ({isAnnual ? 'annual billing' : 'monthly billing'})</td><td><span className="vq-num vq-small">$0</span></td><td><span className="vq-num vq-small">{isAnnual ? '$41/mo ($490/yr)' : '$49/mo'}</span></td><td><span className="vq-num vq-small">{isAnnual ? '$83/mo ($990/yr)' : '$99/mo'}</span></td><td><span className="vq-num vq-small">{isAnnual ? '$249/mo ($2,990/yr)' : '$299/mo'}</span></td></tr>
        <tr><td className="vq-table__row-head">Product SKUs</td><td><span className="vq-num vq-small">500</span></td><td><span className="vq-num vq-small">5,000</span></td><td><span className="vq-num vq-small">25,000</span></td><td><span className="vq-num vq-small">250,000</span></td></tr>
        <tr><td className="vq-table__row-head">Full Staff seats</td><td><span className="vq-num vq-small">1</span></td><td><span className="vq-num vq-small">1</span></td><td><span className="vq-num vq-small">5</span></td><td><span className="vq-num vq-small">25</span></td></tr>
        <tr><td className="vq-table__row-head">Locations / Branches (included)</td><td><span className="vq-num vq-small">1</span></td><td><span className="vq-num vq-small">1</span></td><td><span className="vq-num vq-small">1</span></td><td><span className="vq-num vq-small">1</span></td></tr>
        <tr><td className="vq-table__row-head">POS Registers (devices)</td><td><span className="vq-num vq-small">1</span></td><td><span className="vq-num vq-small">2</span></td><td><span className="vq-num vq-small">6</span></td><td><span className="vq-num vq-small">20</span></td></tr>
        <tr><td className="vq-table__row-head">Cashier PIN till logins</td><td><span className="vq-num vq-small">2</span></td><td><span className="vq-num vq-small">Unlimited</span></td><td><span className="vq-num vq-small">Unlimited</span></td><td><span className="vq-num vq-small">Unlimited</span></td></tr>
        <tr><td className="vq-table__row-head">Transactions per month</td><td><span className="vq-num vq-small">100</span></td><td><span className="vq-num vq-small">Unlimited</span></td><td><span className="vq-num vq-small">Unlimited</span></td><td><span className="vq-num vq-small">Unlimited</span></td></tr>
        <tr><td className="vq-table__row-head">Service jobs per month</td><td><span className="vq-num vq-small">20</span></td><td><span className="vq-num vq-small">Unlimited</span></td><td><span className="vq-num vq-small">Unlimited</span></td><td><span className="vq-num vq-small">Unlimited</span></td></tr>
        <tr><td className="vq-table__row-head">History retention visible</td><td><span className="vq-num vq-small">30 days</span></td><td><span className="vq-num vq-small">Unlimited</span></td><td><span className="vq-num vq-small">Unlimited</span></td><td><span className="vq-num vq-small">Unlimited</span></td></tr>

        <tr><td colSpan="5" style={{"padding":"22px 0 6px","background":"var(--vq-surface-2)","borderBottom":"1px solid var(--vq-line)"}}><span className="vq-eyebrow vq-eyebrow--accent" style={{"paddingLeft":"2px"}}>In every plan, at every price</span></td></tr>
        <tr><td className="vq-table__row-head">Universal business modules</td><td><span className="vq-tick"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span></td><td><span className="vq-tick"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span></td><td><span className="vq-tick"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span></td><td><span className="vq-tick"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span></td></tr>
        <tr><td className="vq-table__row-head">Point of sale, offline mode, barcode, receipts</td><td><span className="vq-tick"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span></td><td><span className="vq-tick"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span></td><td><span className="vq-tick"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span></td><td><span className="vq-tick"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span></td></tr>
        <tr><td className="vq-table__row-head">All 13 document types</td><td><span className="vq-tick"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span></td><td><span className="vq-tick"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span></td><td><span className="vq-tick"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span></td><td><span className="vq-tick"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span></td></tr>
        <tr><td className="vq-table__row-head">Dashboard cards (sales, expenses, cash, stock, low stock, expiry, receivables, payables, profit peek)</td><td><span className="vq-tick"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span></td><td><span className="vq-tick"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span></td><td><span className="vq-tick"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span></td><td><span className="vq-tick"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span></td></tr>
        <tr><td className="vq-table__row-head">Financial &amp; analytical reports</td><td><span className="vq-cross"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/></svg></span> <span className="vq-text-3 vq-small" style={{ marginLeft: '4px' }}>Dashboard cards only</span></td><td><span className="vq-num vq-small">20 Essential (P&amp;L, Cash, Tax)</span></td><td><span className="vq-num vq-small">32 Core (Profitability, Aging)</span></td><td><span className="vq-num vq-small">All 40 &amp; Consolidated</span></td></tr>
        <tr><td className="vq-table__row-head">Customer &amp; supplier khata, party statements</td><td><span className="vq-tick"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span></td><td><span className="vq-tick"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span></td><td><span className="vq-tick"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span></td><td><span className="vq-tick"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span></td></tr>
        <tr><td className="vq-table__row-head">Purchases, orders, expenses &amp; stock take</td><td><span className="vq-tick"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span></td><td><span className="vq-tick"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span></td><td><span className="vq-tick"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span></td><td><span className="vq-tick"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span></td></tr>
        <tr><td className="vq-table__row-head">Production, recipes, BOM &amp; work orders</td><td><span className="vq-tick"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span></td><td><span className="vq-tick"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span></td><td><span className="vq-tick"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span></td><td><span className="vq-tick"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span></td></tr>
        <tr><td className="vq-table__row-head">Services, service jobs, contracts &amp; calendar</td><td><span className="vq-tick"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span></td><td><span className="vq-tick"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span></td><td><span className="vq-tick"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span></td><td><span className="vq-tick"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span></td></tr>
        <tr><td className="vq-table__row-head">Serial, IMEI, batch &amp; expiry tracking</td><td><span className="vq-tick"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span></td><td><span className="vq-tick"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span></td><td><span className="vq-tick"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span></td><td><span className="vq-tick"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span></td></tr>
        <tr><td className="vq-table__row-head">Loyalty points, gift cards &amp; marketing</td><td><span className="vq-tick"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span></td><td><span className="vq-tick"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span></td><td><span className="vq-tick"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span></td><td><span className="vq-tick"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span></td></tr>
        <tr><td className="vq-table__row-head">Google Drive automated backup</td><td><span className="vq-cross"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/></svg></span></td><td><span className="vq-tick"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span></td><td><span className="vq-tick"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span></td><td><span className="vq-tick"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span></td></tr>

        <tr><td colSpan="5" style={{"padding":"22px 0 6px","background":"var(--vq-surface-2)","borderBottom":"1px solid var(--vq-line)"}}><span className="vq-eyebrow vq-eyebrow--accent" style={{"paddingLeft":"2px"}}>Scale Fences</span></td></tr>
        <tr><td className="vq-table__row-head">1. Multi-branch &amp; inter-branch transfers</td><td><span className="vq-cross"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/></svg></span></td><td><span className="vq-text-2 vq-small">With 2nd location</span></td><td><span className="vq-text-2 vq-small">With 2nd location</span></td><td><span className="vq-tick"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span></td></tr>
        <tr><td className="vq-table__row-head">2. REST API &amp; webhooks</td><td><span className="vq-cross"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/></svg></span></td><td><span className="vq-num vq-small">$29/mo</span></td><td><span className="vq-tick"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span></td><td><span className="vq-tick"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span></td></tr>
        <tr><td className="vq-table__row-head">3. Security audit trail &amp; custom roles</td><td><span className="vq-cross"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/></svg></span></td><td><span className="vq-num vq-small">$39/mo</span></td><td><span className="vq-tick"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span></td><td><span className="vq-tick"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span></td></tr>
        <tr><td className="vq-table__row-head">4. White-label &amp; custom domain</td><td><span className="vq-cross"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/></svg></span></td><td><span className="vq-cross"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/></svg></span></td><td><span className="vq-num vq-small">$49/mo</span></td><td><span className="vq-tick"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span></td></tr>
        <tr><td className="vq-table__row-head">5. B2B Network — unlimited connections</td><td><span className="vq-cross"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/></svg></span></td><td><span className="vq-text-2 vq-small">Basic</span></td><td><span className="vq-tick"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span></td><td><span className="vq-tick"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span></td></tr>
        <tr><td className="vq-table__row-head">6. Consolidated multi-entity reporting</td><td><span className="vq-cross"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/></svg></span></td><td><span className="vq-cross"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/></svg></span></td><td><span className="vq-cross"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/></svg></span></td><td><span className="vq-tick"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span></td></tr>
        <tr><td className="vq-table__row-head">7. Channel sync (WooCommerce, Amazon, eBay, TikTok)</td><td><span className="vq-cross"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/></svg></span></td><td><span className="vq-num vq-small">$19/mo</span></td><td><span className="vq-num vq-small">$19/mo</span></td><td><span className="vq-num vq-small">2 included</span></td></tr>

        <tr><td colSpan="5" style={{"padding":"22px 0 6px","background":"var(--vq-surface-2)","borderBottom":"1px solid var(--vq-line)"}}><span className="vq-eyebrow vq-eyebrow--accent" style={{"paddingLeft":"2px"}}>AI allowance &amp; support</span></td></tr>
        <tr><td className="vq-table__row-head">Monthly AI credits included</td><td><span className="vq-num vq-small">100 (10 scans)</span></td><td><span className="vq-num vq-small">500</span></td><td><span className="vq-num vq-small">2,000</span></td><td><span className="vq-num vq-small">10,000</span></td></tr>
        <tr><td className="vq-table__row-head">AI system rebuilds</td><td><span className="vq-text-2 vq-small">—</span></td><td><span className="vq-text-2 vq-small">1 / 90 days</span></td><td><span className="vq-text-2 vq-small">1 / 90 days</span></td><td><span className="vq-text-2 vq-small">1 / month</span></td></tr>
        <tr><td className="vq-table__row-head">Vena conversational AI assistant</td><td><span className="vq-tick"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span></td><td><span className="vq-tick"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span></td><td><span className="vq-tick"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span></td><td><span className="vq-tick"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span></td></tr>
        <tr><td className="vq-table__row-head">Support SLA</td><td><span className="vq-text-2 vq-small">Vena + Help centre</span></td><td><span className="vq-text-2 vq-small">Email (2 days)</span></td><td><span className="vq-text-2 vq-small">Priority email (1 day)</span></td><td><span className="vq-text-2 vq-small">Named contact (4 hours)</span></td></tr>

        <tr><td colSpan="5" style={{"padding":"22px 0 6px","background":"var(--vq-surface-2)","borderBottom":"1px solid var(--vq-line)"}}><span className="vq-eyebrow vq-eyebrow--accent" style={{"paddingLeft":"2px"}}>Add-ons</span></td></tr>
        <tr><td className="vq-table__row-head">Extra store location</td><td><span className="vq-text-2 vq-small">—</span></td><td><span className="vq-num vq-small">$45/mo</span></td><td><span className="vq-num vq-small">$45/mo</span></td><td><span className="vq-num vq-small">$45/mo</span></td></tr>
        <tr><td className="vq-table__row-head">Extra full staff seat</td><td><span className="vq-text-2 vq-small">—</span></td><td><span className="vq-num vq-small">$15/mo</span></td><td><span className="vq-num vq-small">$15/mo</span></td><td><span className="vq-num vq-small">$15/mo</span></td></tr>
        <tr><td className="vq-table__row-head">Extra register (POS device)</td><td><span className="vq-text-2 vq-small">—</span></td><td><span className="vq-num vq-small">$20/mo</span></td><td><span className="vq-num vq-small">$20/mo</span></td><td><span className="vq-num vq-small">$20/mo</span></td></tr>
        <tr><td className="vq-table__row-head">+50,000 catalogue items</td><td><span className="vq-text-2 vq-small">—</span></td><td><span className="vq-num vq-small">$25/mo</span></td><td><span className="vq-num vq-small">$25/mo</span></td><td><span className="vq-num vq-small">$25/mo</span></td></tr>
        <tr><td className="vq-table__row-head">Channel sync (each)</td><td><span className="vq-text-2 vq-small">—</span></td><td><span className="vq-num vq-small">$19/mo</span></td><td><span className="vq-num vq-small">$19/mo</span></td><td><span className="vq-num vq-small">2 included (+ $19/mo)</span></td></tr>
        <tr><td className="vq-table__row-head">1,000 AI credits top-up</td><td><span className="vq-text-2 vq-small">—</span></td><td><span className="vq-num vq-small">$10 once</span></td><td><span className="vq-num vq-small">$10 once</span></td><td><span className="vq-num vq-small">$10 once</span></td></tr>
        <tr><td className="vq-table__row-head">5 AI rebuilds</td><td><span className="vq-text-2 vq-small">—</span></td><td><span className="vq-num vq-small">$10 once</span></td><td><span className="vq-num vq-small">$10 once</span></td><td><span className="vq-num vq-small">$10 once</span></td></tr>
        <tr><td className="vq-table__row-head">Bring your own key (BYOK)</td><td><span className="vq-text-2 vq-small">—</span></td><td><span className="vq-num vq-small">$19 once</span></td><td><span className="vq-num vq-small">$19 once</span></td><td><span className="vq-num vq-small">$19 once</span></td></tr>
        </tbody>
      </table>
    </div>
    <p className="vq-small vq-text-2 vq-mt-6 vq-reveal" style={{"maxWidth":"78ch"}}>
      <b>About data retention on Solo.</b> Solo displays the last 30 days of detail across lists and recent views. All account balances, khata ledgers, and cumulative totals continue to compute from your complete, all-time records. Nothing is ever deleted, and upgrading to any paid plan immediately opens your full historical detail.
    </p>
  </div>
</section>

<section className="vq-section vq-band-dark" id="ai">
  <div className="vq-amb"><span className="vq-amb__beams"><i></i><i></i><i></i></span><span className="vq-amb__grain"></span></div>
  <div className="vq-container" style={{"position":"relative"}}>
    <div className="vq-section-head vq-reveal" style={{"maxWidth":"760px"}}>
      <span className="vq-eyebrow">AI usage</span>
      <h2 className="vq-display">Models cost money to run. We'd rather show you the meter.</h2>
      <p className="vq-lede">Blueprint, SmartCapture, Vena and Signals use AI models. Rather than hide
        that inside bloated retainers, we make it transparent. Your monthly plan allowance covers everyday use, and you can top up anytime.</p>
    </div>
    <div className="vq-grid vq-grid--3">
      
      <div className="vq-card vq-card--xl vq-reveal">
        <h3 className="vq-h3" style={{"color":"#fff"}}>Included Monthly</h3>
        <p className="vq-tile__body vq-mt-3">Starter (500 credits), Core (2,000 credits), and Scale (10,000 credits) include generous allowances for captures, queries, and assistant actions.</p>
      </div>
      <div className="vq-card vq-card--xl vq-reveal">
        <h3 className="vq-h3" style={{"color":"#fff"}}>Top up anytime</h3>
        <p className="vq-tile__body vq-mt-3">1,000 extra credits for $10, anytime. It is a one-off purchase, not a recurring subscription — and we never silently bill you past your cap.</p>
      </div>
      <div className="vq-card vq-card--xl vq-reveal">
        <h3 className="vq-h3" style={{"color":"#fff"}}>Bring your own key</h3>
        <p className="vq-tile__body vq-mt-3">Connect your own OpenAI, Anthropic, or Gemini API key. One-time $19 unlock on paid plans, then managed AI is never metered or billed by VenQore again.</p>
      </div>
    </div>
  </div>
</section>

<section className="vq-section">
  <div className="vq-container">
    <div className="vq-section-head vq-reveal">
      <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Add-ons</span>
      <h2 className="vq-display">Buy only the shape you need.</h2>
    </div>
    <div className="vq-table-wrap vq-reveal">
      <table className="vq-table">
        <thead><tr><th>Add-on</th><th>What it is</th><th className="num" style={{"width":"150px"}}>Price</th></tr></thead>
        <tbody>
        <tr><td className="vq-table__row-head">Extra store location</td><td className="vq-text-2">One more branch with its own stock, pricing and reporting (Starter, Core, Scale)</td><td className="num">$45 / month</td></tr>
        <tr><td className="vq-table__row-head">Extra full staff seat</td><td className="vq-text-2">One more person with full management permissions (Starter, Core, Scale)</td><td className="num">$15 / month</td></tr>
        <tr><td className="vq-table__row-head">Extra register (POS device)</td><td className="vq-text-2">Additional concurrent till device with offline mode (Starter, Core, Scale)</td><td className="num">$20 / month</td></tr>
        <tr><td className="vq-table__row-head">+50,000 catalogue items</td><td className="vq-text-2">Increase product catalogue capacity by 50,000 items (Starter, Core, Scale)</td><td className="num">$25 / month</td></tr>
        <tr><td className="vq-table__row-head">Channel sync (each)</td><td className="vq-text-2">WooCommerce, Amazon, eBay or TikTok shop integration (Starter, Core)</td><td className="num">$19 / month</td></tr>
        <tr><td className="vq-table__row-head">API + webhooks</td><td className="vq-text-2">Developer REST API access and webhook events (Starter)</td><td className="num">$29 / month</td></tr>
        <tr><td className="vq-table__row-head">Audit trail + custom roles</td><td className="vq-text-2">Granular permission editor and security activity audit log (Starter)</td><td className="num">$39 / month</td></tr>
        <tr><td className="vq-table__row-head">White-label</td><td className="vq-text-2">Custom branding and custom domain (Core)</td><td className="num">$49 / month</td></tr>
        <tr><td className="vq-table__row-head">1,000 AI credits top-up</td><td className="vq-text-2">1,000 additional credits, one-off and repeatable (Paid plans)</td><td className="num">$10 once</td></tr>
        <tr><td className="vq-table__row-head">5 AI rebuilds</td><td className="vq-text-2">5 additional AI blueprint rebuilds (Paid plans)</td><td className="num">$10 once</td></tr>
        <tr><td className="vq-table__row-head">Bring your own key (BYOK)</td><td className="vq-text-2">One-time unlock for direct provider API keys (Paid plans)</td><td className="num">$19 once</td></tr>
        <tr><td className="vq-table__row-head">Setup &amp; migration</td><td className="vq-text-2">Full database onboarding &amp; product catalog import service</td><td className="num">$249 once</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</section>

<section className="vq-section vq-section--alt">
  <div className="vq-container vq-container--narrow">
    <div className="vq-section-head vq-reveal"><h2 className="vq-display">Pricing questions.</h2></div>
    <div className="vq-faq vq-reveal">
      
      <div className="vq-faq__item">
        <button className="vq-faq__q" type="button" aria-expanded="false">Is there a free trial?<span className="vq-faq__sign"></span></button>
<div className="vq-faq__a"><div><p>14 days at Core level, no credit card required, cancel anytime. That includes multi-branch, API access, audit trail, Vena, Signals and all 40 reports — so you are trying the real thing, not a demo of it. We send a reminder on day 11 before the trial ends, not after.</p></div></div>
      </div>
      <div className="vq-faq__item">
        <button className="vq-faq__q" type="button" aria-expanded="false">What happens after the trial?<span className="vq-faq__sign"></span></button>
        <div className="vq-faq__a"><div><p>If you don't select a paid plan, your system drops smoothly to Solo — free forever. Your data is preserved and nothing is deleted or reset.</p></div></div>
      </div>
      <div className="vq-faq__item">
        <button className="vq-faq__q" type="button" aria-expanded="false">Can I change plans?<span className="vq-faq__sign"></span></button>
        <div className="vq-faq__a"><div><p>Any time, both directions, prorated. Downgrading never deletes anything: detail beyond 30 days on Solo is hidden from lists while totals stay complete, and full history immediately unlocks the moment you upgrade.</p></div></div>
      </div>
      <div className="vq-faq__item">
        <button className="vq-faq__q" type="button" aria-expanded="false">Do you charge to import my data?<span className="vq-faq__sign"></span></button>
        <div className="vq-faq__a"><div><p>No. Import is included, and so is the help getting it in.</p></div></div>
      </div>
      <div className="vq-faq__item">
        <button className="vq-faq__q" type="button" aria-expanded="false">Do you charge to leave?<span className="vq-faq__sign"></span></button>
        <div className="vq-faq__a"><div><p>No. Export everything, any time, in a format your next system can read.</p></div></div>
      </div>
      <div className="vq-faq__item">
        <button className="vq-faq__q" type="button" aria-expanded="false">Is there a contract?<span className="vq-faq__sign"></span></button>
        <div className="vq-faq__a"><div><p>Monthly is month-to-month. Annual is twelve months at two months off ($490, $990, or $2,990). There is no minimum term and no notice period.</p></div></div>
      </div>
      <div className="vq-faq__item">
        <button className="vq-faq__q" type="button" aria-expanded="false">Why does the cheapest plan include everything?<span className="vq-faq__sign"></span></button>
        <div className="vq-faq__a"><div><p>Because a feature you need should not be a negotiation. A one-person shop needs a correct trial balance exactly as much as a ten-branch one does — it just needs fewer seats. You pay for the size of your business, not for permission to run it properly.</p></div></div>
      </div>
    </div>
  </div>
</section>

<section className="vq-section vq-section--alt">
  <div className="vq-container">
    <div className="vq-section-head vq-reveal"><span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Keep reading</span><h2 className="vq-h2 vq-mt-4">Before you decide</h2></div>
    <div className="vq-grid vq-grid--3"><a className="vq-card vq-card--interactive vq-reveal" href="/compare"><h3 className="vq-h3">What you are comparing against</h3><p className="vq-tile__body vq-mt-3">Square and Vyapar, fee maths included.</p><span className="vq-link vq-mt-4">Read on <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a><a className="vq-card vq-card--interactive vq-reveal" href="/security"><h3 className="vq-h3">Who can reach your data</h3><p className="vq-tile__body vq-mt-3">Isolation, roles and the record.</p><span className="vq-link vq-mt-4">Read on <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a><a className="vq-card vq-card--interactive vq-reveal" href="/onboarding"><h3 className="vq-h3">See it built first</h3><p className="vq-tile__body vq-mt-3">Four minutes, start to live.</p><span className="vq-link vq-mt-4">Read on <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a></div>
  </div>
</section>
</main>

  <SiteFooter />
  <CookieConsent />






{/*  Privacy-first cookieless analytics  */}


            </div>
        </>
    );
}
