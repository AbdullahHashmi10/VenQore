import React, { useEffect } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';

export default function Features() {
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
                <title>Features — 46 modules, nothing charged extra | VenQore</title>
                <meta name="description" content="Everything VenQore ships today: 46 modules, 58 dashboard readings, 13 document types and 40 reports. Every plan includes the whole system." />
                <link rel="canonical" href="https://venqore.com/features" />
                <meta property="og:title" content="Features — 46 modules, nothing charged extra | VenQore" />
                <meta property="og:description" content="Everything VenQore ships today: 46 modules, 58 dashboard readings, 13 document types and 40 reports. Every plan includes the whole system." />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://venqore.com/features" />
                <meta property="og:image" content="https://venqore.com/images/og/venqore-og.png" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Features — 46 modules, nothing charged extra | VenQore" />
                <meta name="twitter:description" content="Everything VenQore ships today: 46 modules, 58 dashboard readings, 13 document types and 40 reports. Every plan includes the whole system." />
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
                  <a className="vq-mega__link" href="/features"><b>Watch it assemble</b><span>46 modules in, only yours out.</span></a>
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
          <li className="vq-nav__item"><a href="/features" className="vq-nav__link" aria-current="page">Features</a></li>
          <li className="vq-nav__item"><a href="/pricing" className="vq-nav__link">Pricing</a></li>
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
        <button className="vq-theme-btn" data-theme-toggle type="button" aria-label="Switch theme">
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
  <div className="vq-amb"><span className="vq-amb__dots"></span></div>
  <div className="vq-container" style={{"position":"relative"}}>
    <div style={{"maxWidth":"820px"}}>
      <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">What's inside</span>
      <h1 className="vq-display vq-mt-4">Everything the business actually runs on. Nothing charged as a <em className="vq-italic">module</em>.</h1>
      <p className="vq-lede vq-mt-6">Everything VenQore ships today, across ten groups: point of sale with offline mode, FIFO inventory with batch and expiry tracking, purchasing, invoicing, customer credit, expenses, staff and permissions, multi-channel sync, AI capture, and double-entry accounting. 46 modules, 13 document types, 40 reports and 58 dashboard readings — all of it on every plan.</p>
      <div className="vq-row vq-wrap vq-gap-3 vq-mt-8"><a className="vq-btn vq-btn--primary vq-btn--lg" href="/build-workspace">Start building <span className="vq-btn__arrow"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a>
        <a className="vq-btn vq-btn--secondary vq-btn--lg" href="/pricing">See pricing</a></div>
    </div>
  </div>
</section>

<section className="vq-section" style={{"paddingTop":"0"}}>
  <div className="vq-container">
    <div className="vq-grid vq-grid--4">
      
      <div className="vq-card vq-card--xl vq-stat vq-reveal vq-card--accent">
        <span className="vq-stat__label">Modules to compose</span>
        <span className="vq-stat__value"><span data-count="46">46</span></span>
        <span className="vq-stat__note">Turned on by your Blueprint, not bought one at a time</span>
      </div>
      <div className="vq-card vq-card--xl vq-stat vq-reveal">
        <span className="vq-stat__label">Dashboard readings</span>
        <span className="vq-stat__value"><span data-count="108">108</span></span>
        <span className="vq-stat__note">Across 18 period windows — 1,944 distinct figures</span>
      </div>
      <div className="vq-card vq-card--xl vq-stat vq-reveal">
        <span className="vq-stat__label">Document types</span>
        <span className="vq-stat__value"><span data-count="13">13</span></span>
        <span className="vq-stat__note">One editor, one payload builder, one ledger path</span>
      </div>
      <div className="vq-card vq-card--xl vq-stat vq-reveal">
        <span className="vq-stat__label">Passing tests</span>
        <span className="vq-stat__value"><span data-count="1610">1610</span></span>
        <span className="vq-stat__note">Run against every reading, on every release</span>
      </div>
    </div>

    <nav className="vq-row vq-wrap vq-gap-2 vq-mt-10 vq-reveal" aria-label="Jump to a group">
      <a className="vq-chip" href="#selling">Selling</a><a className="vq-chip" href="#stock">Stock</a><a className="vq-chip" href="#buying">Buying</a><a className="vq-chip" href="#money">Money</a><a className="vq-chip" href="#parties">Customers &amp; suppliers</a><a className="vq-chip" href="#reports">Reports</a><a className="vq-chip" href="#people">People &amp; access</a><a className="vq-chip" href="#channels">Channels</a><a className="vq-chip" href="#ai">AI &amp; intelligence</a><a className="vq-chip" href="#platform">Platform</a>
    </nav>
  </div>
</section>


<section className="vq-section vq-section--tight" style={{"paddingTop":"0"}}>
  <div className="vq-container">
    <div className="vq-section-head vq-reveal">
      <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">See them working</span>
      <h2 className="vq-h1">Six live demos, not six screenshots.</h2>
    </div>
    <div className="vq-grid vq-grid--3">
      
      <a className="vq-card vq-card--xl vq-fcard vq-reveal" href="/pos">
        <span className="vq-tile__icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg></span>
        <h3 className="vq-tile__title">The register</h3>
        <p className="vq-tile__body">Seven starting points and eight controls. Recompose the till and watch the panes re-derive.</p>
        <div className="vq-fcard__meta">
          <span className="vq-fcard__n">7<small>layouts</small></span>
          <span className="vq-link">Open <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span>
        </div>
      </a>
      <a className="vq-card vq-card--xl vq-fcard vq-reveal" href="/documents">
        <span className="vq-tile__icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg></span>
        <h3 className="vq-tile__title">Documents</h3>
        <p className="vq-tile__body">Switch between all thirteen types and watch the same editor reconfigure itself.</p>
        <div className="vq-fcard__meta">
          <span className="vq-fcard__n">13<small>types</small></span>
          <span className="vq-link">Open <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span>
        </div>
      </a>
      <a className="vq-card vq-card--xl vq-fcard vq-reveal" href="/dashboard-preview">
        <span className="vq-tile__icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg></span>
        <h3 className="vq-tile__title">The dashboard</h3>
        <p className="vq-tile__body">Tap a reading and the card lands, already sized to what it needs.</p>
        <div className="vq-fcard__meta">
          <span className="vq-fcard__n">58<small>readings</small></span>
          <span className="vq-link">Open <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span>
        </div>
      </a>
      <a className="vq-card vq-card--xl vq-fcard vq-reveal" href="/smartcapture">
        <span className="vq-tile__icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 12h10"/></svg></span>
        <h3 className="vq-tile__title">SmartCapture</h3>
        <p className="vq-tile__body">Point it at a bill, a screenshot or a voice note and watch a transaction come back.</p>
        <div className="vq-fcard__meta">
          <span className="vq-fcard__n">11<small>seconds</small></span>
          <span className="vq-link">Open <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span>
        </div>
      </a>
      <a className="vq-card vq-card--xl vq-fcard vq-reveal" href="/reckoner">
        <span className="vq-tile__icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/><path d="M9 7h6"/><path d="M9 11h4"/></svg></span>
        <h3 className="vq-tile__title">The Reckoner</h3>
        <p className="vq-tile__body">One definition per figure, eighteen windows, and a history that survives every rename.</p>
        <div className="vq-fcard__meta">
          <span className="vq-fcard__n">18<small>windows</small></span>
          <span className="vq-link">Open <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span>
        </div>
      </a>
      <a className="vq-card vq-card--xl vq-fcard vq-reveal" href="/vensynq">
        <span className="vq-tile__icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"/></svg></span>
        <h3 className="vq-tile__title">VenSynQ</h3>
        <p className="vq-tile__body">One catalogue behind five channels, with commission isolated from your margin.</p>
        <div className="vq-fcard__meta">
          <span className="vq-fcard__n">5<small>channels</small></span>
          <span className="vq-link">Open <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span>
        </div>
      </a>
    </div>
  </div>
</section>


<section className="vq-section vq-section--tight" id="selling">
  <div className="vq-container">
    <div className="vq-grid" style={{"gridTemplateColumns":"minmax(0,280px) minmax(0,1fr)","gap":"var(--vq-space-12)"}}>
      <div className="vq-reveal" style={{"position":"sticky","top":"120px","alignSelf":"start"}}>
        <span className="vq-tile__icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg></span>
        <h2 className="vq-h2 vq-mt-4">Selling</h2>
        <p className="vq-tile__body vq-mt-3">The counter, and everything that happens at it.</p>
        <span className="vq-badge vq-badge--accent vq-mt-4" style={{"display":"inline-flex"}}>17 shipped</span>
      </div>
      <ul className="vq-grid vq-grid--2 vq-reveal" style={{"gap":"var(--vq-space-3) var(--vq-space-6)","alignContent":"start"}}>
        <li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Instant barcode scanner</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Serial &amp; IMEI scanner</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Park &amp; recall (hold bill)</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Cart rescue &amp; session protection</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Typo-tolerant search</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Multi-account split payments</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Daily cash register audit</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Negative stock alert &amp; lock</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Barcode pattern recognition</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Service fee &amp; freight additions</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Automatic VAT / GST calculation</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">A4 &amp; letter invoice PDF</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Recurring invoicing</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Sales return vouchers</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Pre-sales inventory reservation</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Wholesale vs retail price tiers</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Barcode label print factory</span></li>
      </ul>
    </div>
  </div>
</section>
<section className="vq-section vq-section--tight vq-section--alt" id="stock">
  <div className="vq-container">
    <div className="vq-grid" style={{"gridTemplateColumns":"minmax(0,280px) minmax(0,1fr)","gap":"var(--vq-space-12)"}}>
      <div className="vq-reveal" style={{"position":"sticky","top":"120px","alignSelf":"start"}}>
        <span className="vq-tile__icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg></span>
        <h2 className="vq-h2 vq-mt-4">Stock</h2>
        <p className="vq-tile__body vq-mt-3">What you have, what it cost, and where it is.</p>
        <span className="vq-badge vq-badge--accent vq-mt-4" style={{"display":"inline-flex"}}>14 shipped</span>
      </div>
      <ul className="vq-grid vq-grid--2 vq-reveal" style={{"gap":"var(--vq-space-3) var(--vq-space-6)","alignContent":"start"}}>
        <li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Product variant support</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Variant-aware FIFO costing</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Batch intake number tracking</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Stock take audit wizard</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Category management centre</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Low stock threshold alerts</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">IMEI &amp; serial lifecycle tracking</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Unit of measure converter</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Stock reservation rules</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Disaster &amp; asset claim manager</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Multi-warehouse isolation (godown)</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Stock transfer vouchers</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Stock valuation by location</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Inbound expiry date tracking</span></li>
      </ul>
    </div>
  </div>
</section>
<section className="vq-section vq-section--tight" id="buying">
  <div className="vq-container">
    <div className="vq-grid" style={{"gridTemplateColumns":"minmax(0,280px) minmax(0,1fr)","gap":"var(--vq-space-12)"}}>
      <div className="vq-reveal" style={{"position":"sticky","top":"120px","alignSelf":"start"}}>
        <span className="vq-tile__icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg></span>
        <h2 className="vq-h2 vq-mt-4">Buying</h2>
        <p className="vq-tile__body vq-mt-3">Suppliers, terms, and what you actually paid.</p>
        <span className="vq-badge vq-badge--accent vq-mt-4" style={{"display":"inline-flex"}}>17 shipped</span>
      </div>
      <ul className="vq-grid vq-grid--2 vq-reveal" style={{"gap":"var(--vq-space-3) var(--vq-space-6)","alignContent":"start"}}>
        <li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Purchase order tracker</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Auto-generated purchase orders</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Supplier debit notes</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Purchase returns register</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Supplier account registry (khata)</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Delayed supplier payments</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Supplier statement generator</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Aged payables directory</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Outstanding payables dashboard</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Supplier lead time tracker</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Supplier SKU mapping</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Custom supplier payment terms</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Landing cost allocations</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Cost price increase alert</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Bulk supplier payments</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Tax-inclusive procurement toggle</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Supplier credit limit alerts</span></li>
      </ul>
    </div>
  </div>
</section>
<section className="vq-section vq-section--tight vq-section--alt" id="money">
  <div className="vq-container">
    <div className="vq-grid" style={{"gridTemplateColumns":"minmax(0,280px) minmax(0,1fr)","gap":"var(--vq-space-12)"}}>
      <div className="vq-reveal" style={{"position":"sticky","top":"120px","alignSelf":"start"}}>
        <span className="vq-tile__icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/><path d="M9 7h6"/><path d="M9 11h4"/></svg></span>
        <h2 className="vq-h2 vq-mt-4">Money</h2>
        <p className="vq-tile__body vq-mt-3">The Core Ledger and everything that posts through it.</p>
        <span className="vq-badge vq-badge--accent vq-mt-4" style={{"display":"inline-flex"}}>14 shipped</span>
      </div>
      <ul className="vq-grid vq-grid--2 vq-reveal" style={{"gap":"var(--vq-space-3) var(--vq-space-6)","alignContent":"start"}}>
        <li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Double-entry journal engine</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Automated cash reconciliation</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Fixed asset depreciation tracker</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Business loan ledger</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Inter-register cash transfers</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Advance payment allocation</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Fiscal year closing wizard</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Bank reconciliation checker</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Tax summary engine</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Expense manager + receipt uploads</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Charity allocation engine</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Balanced reversal engine</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Multi-currency configuration</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Custom tax rate configurator</span></li>
      </ul>
    </div>
  </div>
</section>
<section className="vq-section vq-section--tight" id="parties">
  <div className="vq-container">
    <div className="vq-grid" style={{"gridTemplateColumns":"minmax(0,280px) minmax(0,1fr)","gap":"var(--vq-space-12)"}}>
      <div className="vq-reveal" style={{"position":"sticky","top":"120px","alignSelf":"start"}}>
        <span className="vq-tile__icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg></span>
        <h2 className="vq-h2 vq-mt-4">Customers &amp; suppliers</h2>
        <p className="vq-tile__body vq-mt-3">Who owes what, and who is worth keeping.</p>
        <span className="vq-badge vq-badge--accent vq-mt-4" style={{"display":"inline-flex"}}>16 shipped</span>
      </div>
      <ul className="vq-grid vq-grid--2 vq-reveal" style={{"gap":"var(--vq-space-3) var(--vq-space-6)","alignContent":"start"}}>
        <li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Customer account registry (khata)</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Customer payments log</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Customer statement generator</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Aged receivables report</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Multi-payment invoices</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Outstanding balance dashboard</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Unified party ledger</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Customer address book</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Credit limit enforcement</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Credit limit breach alerts</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Customer milestone tracker</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Anniversary &amp; birthday tracker</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Tax-exempt customer flag</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Customer wallet credit</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Loyalty points system</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Digital gift cards</span></li>
      </ul>
    </div>
  </div>
</section>
<section className="vq-section vq-section--tight vq-section--alt" id="reports">
  <div className="vq-container">
    <div className="vq-grid" style={{"gridTemplateColumns":"minmax(0,280px) minmax(0,1fr)","gap":"var(--vq-space-12)"}}>
      <div className="vq-reveal" style={{"position":"sticky","top":"120px","alignSelf":"start"}}>
        <span className="vq-tile__icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg></span>
        <h2 className="vq-h2 vq-mt-4">Reports</h2>
        <p className="vq-tile__body vq-mt-3">40 built reports, all reading the same ledger.</p>
        <span className="vq-badge vq-badge--accent vq-mt-4" style={{"display":"inline-flex"}}>25 shipped</span>
      </div>
      <ul className="vq-grid vq-grid--2 vq-reveal" style={{"gap":"var(--vq-space-3) var(--vq-space-6)","alignContent":"start"}}>
        <li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Profit &amp; loss statement</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Balance sheet</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Double-entry trial balance</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Sales summary &amp; daily trend</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Day book log</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Account ledger report</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Party statement (khata ledger)</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Stock valuation report</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Low stock shortages</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Stock movement history</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Tax compliance summary</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Item-wise profit analysis</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Party-wise profitability</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Bill-wise profitability</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Sales aging report</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Expense by category</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Stock summary &amp; aging</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Loan repayment statement</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Purchases report</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Transactions history</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Bank statements log</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Expiring soon alert</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Category profit &amp; loss</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Discount &amp; tax rate breakdown</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Sale orders report</span></li>
      </ul>
    </div>
  </div>
</section>
<section className="vq-section vq-section--tight" id="people">
  <div className="vq-container">
    <div className="vq-grid" style={{"gridTemplateColumns":"minmax(0,280px) minmax(0,1fr)","gap":"var(--vq-space-12)"}}>
      <div className="vq-reveal" style={{"position":"sticky","top":"120px","alignSelf":"start"}}>
        <span className="vq-tile__icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></span>
        <h2 className="vq-h2 vq-mt-4">People &amp; access</h2>
        <p className="vq-tile__body vq-mt-3">Roles, limits, and a trail of who did what.</p>
        <span className="vq-badge vq-badge--accent vq-mt-4" style={{"display":"inline-flex"}}>9 shipped</span>
      </div>
      <ul className="vq-grid vq-grid--2 vq-reveal" style={{"gap":"var(--vq-space-3) var(--vq-space-6)","alignContent":"start"}}>
        <li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Granular multi-store roles</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Cashier PIN login</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Staff invitation codes</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Owner daily pulse</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Owner profit peek</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Security activity log</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Cashier inactivity auto-logout</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Passcode security standards</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Senior mode accessibility</span></li>
      </ul>
    </div>
  </div>
</section>
<section className="vq-section vq-section--tight vq-section--alt" id="channels">
  <div className="vq-container">
    <div className="vq-grid" style={{"gridTemplateColumns":"minmax(0,280px) minmax(0,1fr)","gap":"var(--vq-space-12)"}}>
      <div className="vq-reveal" style={{"position":"sticky","top":"120px","alignSelf":"start"}}>
        <span className="vq-tile__icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"/></svg></span>
        <h2 className="vq-h2 vq-mt-4">Channels</h2>
        <p className="vq-tile__body vq-mt-3">Sell in five places. Count stock once.</p>
        <span className="vq-badge vq-badge--accent vq-mt-4" style={{"display":"inline-flex"}}>10 shipped</span>
      </div>
      <ul className="vq-grid vq-grid--2 vq-reveal" style={{"gap":"var(--vq-space-3) var(--vq-space-6)","alignContent":"start"}}>
        <li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">VenSynQ command centre</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">3-click OAuth store connection</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Automated commission isolation</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Just-in-time purchase orders</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Bulk tracking ID sync</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">WooCommerce real-time webhook</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">WooCommerce stock sync</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">WooCommerce customer auto-registry</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Web store catalog controls</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Multi-channel expense allocation</span></li>
      </ul>
    </div>
  </div>
</section>
<section className="vq-section vq-section--tight" id="ai">
  <div className="vq-container">
    <div className="vq-grid" style={{"gridTemplateColumns":"minmax(0,280px) minmax(0,1fr)","gap":"var(--vq-space-12)"}}>
      <div className="vq-reveal" style={{"position":"sticky","top":"120px","alignSelf":"start"}}>
        <span className="vq-tile__icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/></svg></span>
        <h2 className="vq-h2 vq-mt-4">AI &amp; intelligence</h2>
        <p className="vq-tile__body vq-mt-3">Deterministic where it can be, honest where it can't.</p>
        <span className="vq-badge vq-badge--accent vq-mt-4" style={{"display":"inline-flex"}}>9 shipped</span>
      </div>
      <ul className="vq-grid vq-grid--2 vq-reveal" style={{"gap":"var(--vq-space-3) var(--vq-space-6)","alignContent":"start"}}>
        <li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Smart capture (image &amp; audio)</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Floating AI assistant</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Reorder due alerts</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Evidence on every insight</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Self-scoring accuracy loop</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Self-tuning thresholds</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Learns your scale</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Runs without an AI key</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Daily business snapshots</span></li>
      </ul>
    </div>
  </div>
</section>
<section className="vq-section vq-section--tight vq-section--alt" id="platform">
  <div className="vq-container">
    <div className="vq-grid" style={{"gridTemplateColumns":"minmax(0,280px) minmax(0,1fr)","gap":"var(--vq-space-12)"}}>
      <div className="vq-reveal" style={{"position":"sticky","top":"120px","alignSelf":"start"}}>
        <span className="vq-tile__icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg></span>
        <h2 className="vq-h2 vq-mt-4">Platform</h2>
        <p className="vq-tile__body vq-mt-3">The parts you only notice when they are missing.</p>
        <span className="vq-badge vq-badge--accent vq-mt-4" style={{"display":"inline-flex"}}>13 shipped</span>
      </div>
      <ul className="vq-grid vq-grid--2 vq-reveal" style={{"gap":"var(--vq-space-3) var(--vq-space-6)","alignContent":"start"}}>
        <li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Progressive web app (PWA)</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Multi-tenant store isolation</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Subscription plan enforcement</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Automated limit override manager</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Soft-delete trash management</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Backups &amp; Google Drive sync</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Import / export tools</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Test data wipe</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Instant store creator</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Self-guiding setup tour</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Custom domain mapping</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">SSO / SAML authentication</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
          <span className="vq-small">Dark &amp; light themes</span></li>
      </ul>
    </div>
  </div>
</section>

<section className="vq-section vq-band-dark">
  <div className="vq-amb"><span className="vq-amb__grain"></span></div>
  <div className="vq-container" style={{"position":"relative"}}>
    <div className="vq-grid vq-grid--2" style={{"gap":"var(--vq-space-16)"}}>
      <div className="vq-reveal">
        <span className="vq-eyebrow">Being straight about it</span>
        <h2 className="vq-display vq-mt-4">What isn't here yet.</h2>
        <p className="vq-lede vq-mt-6">A site that admits one real limitation is believed about everything
          else. So: these are named in our own catalogue and are <b style={{"color":"#fff"}}>not</b> shipping.
          We will not sell you a feature that does not function.</p>
      </div>
      <div className="vq-stack vq-gap-4 vq-reveal">
        
        <div className="vq-card">
          <div className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
            <span style={{"color":"var(--vq-text-3)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/></svg></span>
            <div><b className="vq-small">SMS &amp; WhatsApp reminders</b><p className="vq-caption vq-mt-2" style={{"maxWidth":"none"}}>The gateway is not built, so debt reminders do not send. Statements and PDFs do.</p></div>
          </div>
        </div>
        <div className="vq-card">
          <div className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
            <span style={{"color":"var(--vq-text-3)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/></svg></span>
            <div><b className="vq-small">Custom SMTP mail gateway</b><p className="vq-caption vq-mt-2" style={{"maxWidth":"none"}}>Mail goes out on our infrastructure. You cannot yet point it at your own server.</p></div>
          </div>
        </div>
        <div className="vq-card">
          <div className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
            <span style={{"color":"var(--vq-text-3)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/></svg></span>
            <div><b className="vq-small">Appointments &amp; scheduling</b><p className="vq-caption vq-mt-2" style={{"maxWidth":"none"}}>Which is why we do not sell to salons, clinics, gyms or hotels yet. When scheduling ships, all four unlock at once.</p></div>
          </div>
        </div>
        <div className="vq-card">
          <div className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
            <span style={{"color":"var(--vq-text-3)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/></svg></span>
            <div><b className="vq-small">A support organisation</b><p className="vq-caption vq-mt-2" style={{"maxWidth":"none"}}>One founder answers the email. That is a real trade-off, and it is better you know now.</p></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<section className="vq-section vq-section--alt">
  <div className="vq-container">
    <div className="vq-section-head vq-reveal"><span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Keep reading</span><h2 className="vq-h2 vq-mt-4">Go deeper</h2></div>
    <div className="vq-grid vq-grid--3"><a className="vq-card vq-card--interactive vq-reveal" href="/solutions"><h3 className="vq-h3">Your trade, specifically</h3><p className="vq-tile__body vq-mt-3">Six industry configurations.</p><span className="vq-link vq-mt-4">Read on <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a><a className="vq-card vq-card--interactive vq-reveal" href="/compare"><h3 className="vq-h3">How this compares</h3><p className="vq-tile__body vq-mt-3">Against Square and Vyapar, with the maths.</p><span className="vq-link vq-mt-4">Read on <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a><a className="vq-card vq-card--interactive vq-reveal" href="/docs"><h3 className="vq-h3">Guides and how-tos</h3><p className="vq-tile__body vq-mt-3">Setting it up, screen by screen.</p><span className="vq-link vq-mt-4">Read on <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a></div>
  </div>
</section>
</main>

  <footer className="vq-footer">
    <div className="footer-bg"></div>
    
    <div className="vq-container" style={{"position":"relative","zIndex":"10","paddingBottom":"var(--vq-space-16)"}}>
      <div className="mesh-gradient-card" style={{"borderRadius":"var(--vq-r-2xl)","padding":"clamp(32px,5vw,56px)","border":"1px solid rgb(255 255 255 / .10)","boxShadow":"var(--vq-elev-3)"}}>
        <div style={{"maxWidth":"36rem"}}>
          <h2 className="vq-h2" style={{"color":"#fff"}}>Describe your business. See what it becomes.</h2>
          <p className="vq-lede vq-mt-3" style={{"color":"rgb(255 255 255 / .74)"}}>14-day free trial. Full access. You'll see your whole system before you decide anything.</p>
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
        <div style={{"display":"flex","gap":"var(--vq-space-6)"}}>
          <a className="vq-small" href="/terms">Terms</a>
          <a className="vq-small" href="/privacy">Privacy</a>
          <a className="vq-small" href="/privacy#cookies">Cookies</a>
          <a className="vq-small" href="/refund-policy">Refund Policy</a>
          <a className="vq-small" href="/known-issues">Known Issues</a>
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
