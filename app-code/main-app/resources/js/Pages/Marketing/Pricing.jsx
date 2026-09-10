import React, { useEffect } from 'react';
import { useTheme } from '@/Contexts/ThemeContext';
import { Head, Link, usePage } from '@inertiajs/react';

export default function Pricing() {
    const { isDarkMode, toggleTheme } = useTheme();
    const { auth = {}, flash = {}, ...props } = usePage().props;

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
                <title>Pricing — from $49/month or free forever, no implementation fee | VenQore</title>
                <meta name="description" content="Traditional ERP implementations can cost tens of thousands of dollars a year. VenQore starts at $49 a month — or free. Every plan carries universal business modules, the complete double-entry ledger and all reports." />
                <link rel="canonical" href="https://venqore.com/pricing" />
                <meta property="og:title" content="Pricing — from $49/month or free forever, no implementation fee | VenQore" />
                <meta property="og:description" content="Traditional ERP implementations can cost tens of thousands of dollars a year. VenQore starts at $49 a month — or free. Every plan carries universal business modules, the complete double-entry ledger and all reports." />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://venqore.com/pricing" />
                <meta property="og:image" content="https://venqore.com/images/og/venqore-og.png" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Pricing — from $49/month or free forever, no implementation fee | VenQore" />
                <meta name="twitter:description" content="Traditional ERP implementations can cost tens of thousands of dollars a year. VenQore starts at $49 a month — or free. Every plan carries universal business modules, the complete double-entry ledger and all reports." />
                <meta name="twitter:image" content="https://venqore.com/images/og/venqore-og.png" />
            </Head>

            <div className="vq-site vq-app-body" style={{ background: 'var(--vq-bg)', color: 'var(--vq-text)', overflow: 'visible', minHeight: '100vh' }}>



  <a className="vq-skip" href="#main">Skip to content</a>
  <header className="vq-header" data-header>
    <div className="vq-header__inner">
      <a className="vq-brand" href="/" aria-label="VenQore home">
        <img src="/v6/assets/logo.png" alt="" width="30" height="30" />
        <span className="vq-brand__word">VenQore</span>
      </a>

      <nav className="vq-nav" aria-label="Main">
        <ul className="vq-nav__list">
          <li className="vq-nav__item">
            <a href="/blueprint" className="vq-nav__link">Product <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></a>
            <div className="vq-mega" style={{"minWidth":"660px"}}>
              <div className="vq-mega__grid" style={{"gridTemplateColumns":"1fr 1fr 1fr"}}>
                <div className="vq-mega__col">
                  <span className="vq-eyebrow vq-eyebrow--accent">Build</span>
                  <a className="vq-mega__link" href="/blueprint"><b>Blueprint</b><span>Describe it. Approve the plan.</span></a>
                  <a className="vq-mega__link" href="/onboarding"><b>See a build</b><span>Four minutes, start to live.</span></a>
                  <a className="vq-mega__link" href="/features"><b>Watch it assemble</b><span>140+ modules in, only yours out.</span></a>
                </div>
                <div className="vq-mega__col">
                  <span className="vq-eyebrow vq-eyebrow--accent">Run</span>
                  <a className="vq-mega__link" href="/pos"><b>The register</b><span>A till you compose yourself.</span></a>
                  <a className="vq-mega__link" href="/documents"><b>Documents</b><span>Thirteen types, one editor.</span></a>
                  <a className="vq-mega__link" href="/vensynq"><b>VenSynQ</b><span>Sell in five places, count once.</span></a>
                </div>
                <div className="vq-mega__col">
                  <span className="vq-eyebrow vq-eyebrow--accent">Know</span>
                  <a className="vq-mega__link" href="/dashboard-preview"><b>The dashboard</b><span>58 readings, self-assembling.</span></a>
                  <a className="vq-mega__link" href="/reckoner"><b>The Reckoner</b><span>One place a number is defined.</span></a>
                  <a className="vq-mega__link" href="/ledger"><b>Core Ledger</b><span>One engine. Every number.</span></a>
                </div>
              </div>
              <div className="vq-mega__foot">
                <a className="vq-link" href="/smartcapture">SmartCapture — a photo in, a posted transaction out <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></a>
              </div>
            </div>
          </li>
          <li className="vq-nav__item">
            <a href="/solutions" className="vq-nav__link">Solutions <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></a>
            <div className="vq-mega" style={{"minWidth":"420px"}}>
              <div className="vq-mega__grid">
                <div className="vq-mega__col">
                  <a className="vq-mega__link" href="/solutions/grocery"><b>Grocery &amp; supermarket</b><span>Fast checkout, real margins.</span></a>
                  <a className="vq-mega__link" href="/solutions/wholesale"><b>Wholesale &amp; distribution</b><span>Credit terms and price tiers.</span></a>
                  <a className="vq-mega__link" href="/solutions/pharmacy"><b>Pharmacy</b><span>Batch and expiry that hold the line.</span></a>
                </div>
                <div className="vq-mega__col">
                  <a className="vq-mega__link" href="/solutions/clothing"><b>Apparel &amp; fashion</b><span>Size and colour, counted properly.</span></a>
                  <a className="vq-mega__link" href="/solutions/electronics-store"><b>Electronics &amp; hardware</b><span>Serial and IMEI, tracked to the unit.</span></a>
                  <a className="vq-mega__link" href="/solutions/multi-store"><b>Multi-branch chains</b><span>One truth across every location.</span></a>
                </div>
              </div>
            </div>
          </li>
          <li className="vq-nav__item"><a href="/features" className="vq-nav__link">Features</a></li>
          <li className="vq-nav__item"><a href="/pricing" className="vq-nav__link" aria-current="page">Pricing</a></li>
          <li className="vq-nav__item">
            <a href="/about" className="vq-nav__link">Company <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></a>
            <div className="vq-mega" style={{"minWidth":"320px"}}>
              <div className="vq-mega__grid" style={{"gridTemplateColumns":"1fr"}}>
                <div className="vq-mega__col">
                  <a className="vq-mega__link" href="/about"><b>About</b><span>Our mission, architecture, and principles.</span></a>
                  <a className="vq-mega__link" href="/ledger"><b>How we prove it</b><span>The checks we publish.</span></a>
                  <a className="vq-mega__link" href="/contact"><b>Contact</b><span>A person answers this one.</span></a>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </nav>
      <div className="vq-header__actions">
        <button className="vq-theme-btn" data-theme-toggle type="button" aria-label="Switch theme" onClick={toggleTheme}>
          <span className="vq-icon-sun"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg></span><span className="vq-icon-moon"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg></span>
        </button>
        <a href="/login" className="vq-nav__link">Sign in</a>
        <a href="/build-workspace" className="vq-btn vq-btn--primary">Start building <span className="vq-btn__arrow"><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a>
      </div>
      <button className="vq-burger" type="button" data-menu-open aria-label="Open menu" aria-expanded="false"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg></button>
    </div>
  </header>
  <div className="vq-mobile" data-menu hidden>
    <button className="vq-burger" type="button" data-menu-close aria-label="Close menu"
            style={{"position":"absolute","top":"24px","right":"20px"}}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
    <a href="/blueprint">Blueprint</a>
    <a href="/pos">The register</a>
    <a href="/documents">Documents</a>
    <a href="/dashboard-preview">Dashboard</a>
    <a href="/smartcapture">SmartCapture</a>
    <a href="/reckoner">The Reckoner</a>
    <a href="/ledger">Core Ledger</a>
    <a href="/vensynq">VenSynQ</a>
    <a href="/features">Features</a>
    <a href="/pricing">Pricing</a>
    <a href="/about">About</a>
    <a href="/contact">Contact</a>
    <div className="vq-mobile__actions">
      <a href="/login" className="vq-btn vq-btn--secondary vq-btn--lg vq-btn--block">Sign in</a>
      <a href="/build-workspace" className="vq-btn vq-btn--primary vq-btn--lg vq-btn--block">Start building <span className="vq-btn__arrow"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a>
    </div>
  </div>
<main id="main">

<section className="vq-section" style={{"paddingTop":"clamp(140px,15vw,200px)","paddingBottom":"clamp(48px,6vw,72px)"}}>
  <div className="vq-amb"><span className="vq-amb__aurora" style={{"opacity":".30"}}></span></div>
  <div className="vq-container" style={{"position":"relative"}}>
    <div style={{"maxWidth":"860px"}}>
      <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Pricing</span>
      <h1 className="vq-display vq-mt-4">Priced like software. Not like a <em className="vq-italic">project</em>.</h1>
      <p className="vq-lede vq-mt-6"><strong>Traditional ERP implementations can cost tens of thousands of dollars a year. VenQore starts at $49 a month — or free.</strong><br /><span className="vq-small vq-text-2" style={{"display":"inline-block","marginTop":"8px"}}>* Published industry benchmarks put traditional ERP implementations in the tens of thousands of dollars per year. VenQore serves small and independent businesses; the comparison is to overall total cost of ownership.</span></p>
      <p className="vq-text-2 vq-mt-4">Every paid plan carries universal business modules, the full double-entry ledger and all 43 financial reports. Plans differ by operational scale: seats, locations, catalogue capacity, and advanced scale fences.</p>
    </div>
  </div>
</section>

<section className="vq-section" style={{"paddingTop":"0"}}>
  <div className="vq-container">
    <div className="vq-center vq-reveal" style={{"marginBottom":"var(--vq-space-10)"}}>
      <div className="vq-seg" data-period role="tablist" aria-label="Billing period">
        <button className="vq-seg__btn" role="tab" data-per="month" aria-selected="true">Monthly</button>
        <button className="vq-seg__btn" role="tab" data-per="year"  aria-selected="false">Annual — 2 months free</button>
      </div>
    </div>

    <div className="vq-grid vq-grid--4">
      
      <div className="vq-plan vq-reveal">
        <span className="vq-plan__flag" style={{"background":"var(--vq-surface-2)","color":"var(--vq-text-2)","borderColor":"var(--vq-line)"}}>Free forever</span>
        <h2 className="vq-plan__name">Solo</h2>
        <p className="vq-plan__for">One person, one register. Free forever with structural limits.</p>
        <div className="vq-plan__price">
          <span className="vq-plan__amt" data-price="$0" data-price-year="$0" data-price-pkr="Rs 0" data-price-year-pkr="Rs 0">$0</span>
          <span className="vq-plan__per" data-per-label>/forever</span>
        </div>
        <ul className="vq-plan__list">
          <li><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span>Up to <b>500 products</b> (SKUs)</span></li>
          <li><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span><b>1 location</b>, <b>1 full seat</b></span></li>
          <li><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span><b>1 register</b> (2 cashier PIN logins)</span></li>
          <li><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span>100 sales &amp; 20 service jobs/month</span></li>
          <li><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span>Core Ledger + all 43 financial reports</span></li>
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
          <span className="vq-plan__amt" data-price="$49" data-price-year="$490" data-price-pkr="Rs 13,700" data-price-year-pkr="Rs 136,800">$49</span>
          <span className="vq-plan__per" data-per-label>/month</span>
        </div>
        <ul className="vq-plan__list">
          <li><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span>Up to <b>5,000 products</b> (SKUs)</span></li>
          <li><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span><b>1 location</b>, <b>1 full seat</b> (+ $15/mo per extra seat)</span></li>
          <li><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span><b>2 registers</b> (cashier PIN logins unlimited)</span></li>
          <li><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span><b>Full history retention</b> (unlimited days)</span></li>
          <li><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span>Google Drive backup included</span></li>
          <li><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span>500 AI credits/month + 1 rebuild / 90 days</span></li>
          <li><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span>Email support (2 business days)</span></li>
        </ul>
        <a href="/build-workspace?plan=starter" className="vq-btn vq-btn--secondary vq-btn--lg vq-btn--block">Choose Starter</a>
      </div>

      <div className="vq-plan vq-plan--featured vq-reveal">
        <span className="vq-plan__flag">Most popular</span>
        <h2 className="vq-plan__name">Core</h2>
        <p className="vq-plan__for">Multi-branch stock, API access, audit logs, custom roles and signals.</p>
        <div className="vq-plan__price">
          <span className="vq-plan__amt" data-price="$99" data-price-year="$990" data-price-pkr="Rs 27,700" data-price-year-pkr="Rs 277,200">$99</span>
          <span className="vq-plan__per" data-per-label>/month</span>
        </div>
        <ul className="vq-plan__list">
          <li><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span>Up to <b>25,000 products</b> (SKUs)</span></li>
          <li><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span><b>1 location</b>, <b>5 full seats</b> (+ $15/mo per extra seat)</span></li>
          <li><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span>Up to <b>6 registers</b> (cashier PIN logins unlimited)</span></li>
          <li><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span>Multi-branch transfers (activates with 2nd location)</span></li>
          <li><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span><b>Full API access &amp; webhooks</b></span></li>
          <li><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span>Audit trail &amp; custom granular roles</span></li>
          <li><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span>2,000 AI credits/month + 1 rebuild / 90 days</span></li>
          <li><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span>Priority email support (1 business day)</span></li>
        </ul>
        <a href="/build-workspace?plan=core" className="vq-btn vq-btn--primary vq-btn--lg vq-btn--block">Start 14-day trial</a>
      </div>

      <div className="vq-plan vq-reveal">
        <h2 className="vq-plan__name">Scale</h2>
        <p className="vq-plan__for">Large operations, custom roles, white-label and channel sync.</p>
        <div className="vq-plan__price">
          <span className="vq-plan__amt" data-price="$299" data-price-year="$2,990" data-price-pkr="Rs 83,700" data-price-year-pkr="Rs 836,400">$299</span>
          <span className="vq-plan__per" data-per-label>/month</span>
        </div>
        <ul className="vq-plan__list">
          <li><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span>Up to <b>250,000 products</b> (SKUs)</span></li>
          <li><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span><b>1 location</b>, <b>25 full seats</b></span></li>
          <li><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span>Up to <b>20 registers</b> (cashier PIN logins unlimited)</span></li>
          <li><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span>Multi-branch &amp; inter-branch transfers</span></li>
          <li><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span>White-label &amp; consolidated multi-entity reporting</span></li>
          <li><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span><b>2 channel syncs included</b> (WooCommerce/Amazon)</span></li>
          <li><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span>10,000 AI credits/month + 1 rebuild / month</span></li>
          <li><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span>Named contact (4 business hours SLA)</span></li>
        </ul>
        <a href="/build-workspace?plan=scale" className="vq-btn vq-btn--secondary vq-btn--lg vq-btn--block">Choose Scale</a>
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
          <span className="vq-small">All 43 financial reports</span></div><div className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
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
        <tr><td className="vq-table__row-head">Monthly price (annual billing)</td><td><span className="vq-num vq-small">$0</span></td><td><span className="vq-num vq-small">$490/yr ($49/mo)</span></td><td><span className="vq-num vq-small">$990/yr ($99/mo)</span></td><td><span className="vq-num vq-small">$2,990/yr ($299/mo)</span></td></tr>
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
        <tr><td className="vq-table__row-head">Core Ledger — double entry, every posting</td><td><span className="vq-tick"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span></td><td><span className="vq-tick"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span></td><td><span className="vq-tick"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span></td><td><span className="vq-tick"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span></td></tr>
        <tr><td className="vq-table__row-head">P&amp;L, balance sheet, trial balance, all 43 reports</td><td><span className="vq-tick"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span></td><td><span className="vq-tick"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span></td><td><span className="vq-tick"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span></td><td><span className="vq-tick"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span></td></tr>
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
      <b>About data retention on Solo.</b> Solo is free forever and keeps your core operational features active. Historical transactions older than 30 days are safely archived in your database and immediately reappear the moment you upgrade to any paid plan.
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
<div className="vq-faq__a"><div><p>14 days at Core level, no credit card required, cancel anytime. That includes multi-branch, API access, audit trail, Vena, Signals and all 43 reports — so you are trying the real thing, not a demo of it. We send a reminder on day 11 before the trial ends, not after.</p></div></div>
      </div>
      <div className="vq-faq__item">
        <button className="vq-faq__q" type="button" aria-expanded="false">What happens after the trial?<span className="vq-faq__sign"></span></button>
        <div className="vq-faq__a"><div><p>If you don't select a paid plan, your system drops smoothly to Solo — free forever. Your data is preserved and nothing is deleted or reset.</p></div></div>
      </div>
      <div className="vq-faq__item">
        <button className="vq-faq__q" type="button" aria-expanded="false">Can I change plans?<span className="vq-faq__sign"></span></button>
        <div className="vq-faq__a"><div><p>Any time, both directions, prorated. Downgrading never deletes anything: data above the new limit or beyond 30 days on Solo becomes read-only and safely archived, and comes back the moment you upgrade.</p></div></div>
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

  <footer className="vq-footer">
    <div className="footer-bg"></div>
    
    <div className="vq-container" style={{"position":"relative","zIndex":"10","paddingBottom":"var(--vq-space-16)"}}>
      <div className="mesh-gradient-card" style={{"borderRadius":"var(--vq-r-2xl)","padding":"clamp(32px,5vw,56px)","border":"1px solid rgb(255 255 255 / .10)","boxShadow":"var(--vq-elev-3)"}}>
        <div style={{"maxWidth":"36rem"}}>
          <h2 className="vq-h2" style={{"color":"#fff"}}>Describe your business. See what it becomes.</h2>
<p className="vq-lede vq-mt-3" style={{"color":"rgb(255 255 255 / .74)"}}>Start your 14-day trial. No credit card required. You'll see your whole system before you decide anything.</p>
          <form className="vq-row vq-wrap vq-gap-3 vq-mt-8" data-waitlist style={{"maxWidth":"520px"}}>
            <input type="email" className="vq-input" required placeholder="you@company.com" aria-label="Work email"
                   style={{"flex":"1 1 240px","background":"rgb(0 0 0 / .35)","borderColor":"rgb(255 255 255 / .16)","color":"#fff"}} />
            <button type="submit" className="vq-btn vq-btn--lg vq-btn--light">Start building</button>
          </form>
          <p className="vq-caption vq-mt-4" style={{"color":"rgb(255 255 255 / .55)"}}>Takes about four minutes. Nothing goes live until you approve it.</p>
        </div>
      </div>
    </div>

    <div className="vq-container" style={{"position":"relative","zIndex":"10","paddingBottom":"var(--vq-space-8)"}}>
      <div style={{"display":"flex","flexDirection":"column","gap":"var(--vq-space-12)"}} className="vq-foot-cols">
        <div style={{"display":"grid","gap":"var(--vq-space-8)","gridTemplateColumns":"repeat(auto-fit,minmax(150px,1fr))","flex":"1"}}>
          <div>
            <h3 className="vq-footer__head">Product</h3>
            <ul style={{"marginTop":"var(--vq-space-4)","display":"flex","flexDirection":"column","gap":"var(--vq-space-3)"}}>
              <li><a href="/blueprint">Blueprint</a></li>
              <li><a href="/pos">The register</a></li>
              <li><a href="/documents">Documents</a></li>
              <li><a href="/dashboard-preview">Dashboard</a></li>
              <li><a href="/smartcapture">SmartCapture</a></li>
              <li><a href="/reckoner">The Reckoner</a></li>
              <li><a href="/ledger">Core Ledger</a></li>
              <li><a href="/vensynq">VenSynQ</a></li>
            </ul>
          </div>
          <div>
            <h3 className="vq-footer__head">Company</h3>
            <ul style={{"marginTop":"var(--vq-space-4)","display":"flex","flexDirection":"column","gap":"var(--vq-space-3)"}}>
              <li><a href="/about">About</a></li>
              <li><a href="/contact">Contact</a></li>
              <li><a href="/blog">Blog</a></li>
              <li><a href="/roadmap">Roadmap</a></li>
            </ul>
          </div>
          <div>
            <h3 className="vq-footer__head">Resources</h3>
            <ul style={{"marginTop":"var(--vq-space-4)","display":"flex","flexDirection":"column","gap":"var(--vq-space-3)"}}>
              <li><a href="/docs">Documentation</a></li>
              <li><a href="/help">Help centre</a></li>
              <li><a href="/security">Security</a></li>
              <li><a href="/onboarding">See a build</a></li>
              <li><a href="/login">Sign in</a></li>
            </ul>
          </div>
          <div>
            <h3 className="vq-footer__head">Social</h3>
            <div style={{"marginTop":"var(--vq-space-4)","display":"flex","gap":"var(--vq-space-3)"}}>
              <a className="vq-footer__social" href="https://wa.me/923091999489" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" title="WhatsApp: +92 309 1999489"><svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg></a>
              <a className="vq-footer__social" href="#" aria-label="Facebook"><svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg></a>
              <a className="vq-footer__social" href="#" aria-label="X"><svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg></a>
              <a className="vq-footer__social" href="#" aria-label="LinkedIn"><svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg></a>
            </div>
          </div>
        </div>
      </div>

      <div style={{"marginTop":"var(--vq-space-12)","paddingTop":"var(--vq-space-8)","borderTop":"1px solid rgb(255 255 255 / .08)","display":"flex","flexWrap":"wrap","alignItems":"center","justifyContent":"space-between","gap":"var(--vq-space-4)","paddingBottom":"var(--vq-space-6)"}}>
        <p className="vq-small" style={{"color":"var(--vq-ink-500)","maxWidth":"none"}}>© 2026 VenQore, Inc. The AI ERP builder.</p>
        <div style={{"display":"flex","gap":"var(--vq-space-6)","flexWrap":"wrap"}}>
          <a className="vq-small" href="/terms">Terms</a>
          <a className="vq-small" href="/privacy">Privacy</a>
          <a className="vq-small" href="/privacy#cookies">Cookies</a>
          <a className="vq-small" href="/refund-policy">Refund Policy</a>
          <a className="vq-small" href="/known-issues">Known Issues</a>
          <a className="vq-small" href="/contact?subject=regional" rel="noindex,nofollow">Regional pricing enquiry</a>
        </div>
      </div>

      <div className="watermark-wrapper"><span>VenQore</span></div>
    </div>
  </footer>





{/*  Privacy-first cookieless analytics  */}


            </div>
        </>
    );
}
