import React, { useEffect } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';

export default function Documents() {
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
                await loadScript('/v6/assets/demos.js');
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
                <title>Documents — thirteen types, one editor | VenQore</title>
                <meta name="description" content="Thirteen document types on one editor, one payload builder, one tax source and one ledger path. A field that renders is a field that posts." />
                <link rel="canonical" href="https://venqore.com/documents" />
                <meta property="og:title" content="Documents — thirteen types, one editor | VenQore" />
                <meta property="og:description" content="Thirteen document types on one editor, one payload builder, one tax source and one ledger path. A field that renders is a field that posts." />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://venqore.com/documents" />
                <meta property="og:image" content="https://venqore.com/images/og/venqore-og.png" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Documents — thirteen types, one editor | VenQore" />
                <meta name="twitter:description" content="Thirteen document types on one editor, one payload builder, one tax source and one ledger path. A field that renders is a field that posts." />
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
            <a href="/blueprint" className="vq-nav__link" aria-current="page">Product <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></a>
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
      <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Documents</span>
      <h1 className="vq-display vq-mt-4">Thirteen documents. <em className="vq-italic">One</em> editor.</h1>
      <p className="vq-lede vq-mt-6">An invoice, a purchase return, a goods receipt and a stock audit are not four screens. They are one screen with different switches on — which is why a field that renders is always a field that posts.</p>
      <div className="vq-row vq-wrap vq-gap-3 vq-mt-8"><a className="vq-btn vq-btn--primary vq-btn--lg" href="/build-workspace">Start building <span className="vq-btn__arrow"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a>
        <a className="vq-btn vq-btn--secondary vq-btn--lg" href="/ledger">How they post</a></div>
    </div>
  </div>
</section>

<section className="vq-section" style={{"paddingTop":"0"}}>
  <div className="vq-container vq-container--wide">
    <div className="vq-demo vq-reveal" data-doc>
      <div className="vq-demo__bar">
        <div className="vq-demo__dots"><i></i><i></i><i></i></div>
        <div className="vq-demo__url"><svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> app.venqore.com/documents</div>
        <span className="vq-demo__live">Live · try it</span>
      </div>
      <div className="vq-demo__controls">
        <span className="vq-eyebrow" style={{"flex":"none"}}>Document type</span>
        <div className="vq-demo__scroller" data-doc-tabs role="tablist"></div>
      </div>
      <div className="vq-grid" style={{"gridTemplateColumns":"minmax(0,1fr) 300px","gap":"1px","background":"var(--vq-line)"}}>
        <div data-doc-stage style={{"background":"var(--vq-surface)"}}></div>
        <div data-doc-meta style={{"background":"var(--vq-surface-2)","padding":"var(--vq-space-5)"}}></div>
      </div>
    </div>
    <p className="vq-caption vq-center vq-mt-4" style={{"maxWidth":"none"}}>
      Same editor every time. The type changes the labels, the columns, the totals block and which capabilities are switched on.
    </p>
  </div>
</section>

<section className="vq-section vq-section--alt">
  <div className="vq-container">
    <div className="vq-section-head vq-reveal">
      <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">All thirteen</span>
      <h2 className="vq-display">Everything a trading business actually issues.</h2>
    </div>
    <div className="vq-grid vq-grid--3">
      
      <div className="vq-card vq-card--xl vq-reveal">
        <span className="vq-eyebrow vq-eyebrow--accent">Sell side · 5</span>
        <ul className="vq-stack vq-gap-3 vq-mt-5">
          <li className="vq-row vq-gap-3" style={{"justifyContent":"space-between"}}>
              <span className="vq-small">Sales invoice</span>
              <span className="vq-badge">INV</span></li><li className="vq-row vq-gap-3" style={{"justifyContent":"space-between"}}>
              <span className="vq-small">Quotation</span>
              <span className="vq-badge">QT</span></li><li className="vq-row vq-gap-3" style={{"justifyContent":"space-between"}}>
              <span className="vq-small">Sales order</span>
              <span className="vq-badge">SO</span></li><li className="vq-row vq-gap-3" style={{"justifyContent":"space-between"}}>
              <span className="vq-small">Sale return</span>
              <span className="vq-badge">SRET</span></li><li className="vq-row vq-gap-3" style={{"justifyContent":"space-between"}}>
              <span className="vq-small">Recurring invoice</span>
              <span className="vq-badge">REC</span></li>
        </ul>
      </div>
      <div className="vq-card vq-card--xl vq-reveal">
        <span className="vq-eyebrow vq-eyebrow--accent">Buy side · 6</span>
        <ul className="vq-stack vq-gap-3 vq-mt-5">
          <li className="vq-row vq-gap-3" style={{"justifyContent":"space-between"}}>
              <span className="vq-small">Purchase invoice</span>
              <span className="vq-badge">BILL</span></li><li className="vq-row vq-gap-3" style={{"justifyContent":"space-between"}}>
              <span className="vq-small">Purchase order</span>
              <span className="vq-badge">PO</span></li><li className="vq-row vq-gap-3" style={{"justifyContent":"space-between"}}>
              <span className="vq-small">Goods receipt</span>
              <span className="vq-badge">GRN</span></li><li className="vq-row vq-gap-3" style={{"justifyContent":"space-between"}}>
              <span className="vq-small">Purchase return</span>
              <span className="vq-badge">PRET</span></li><li className="vq-row vq-gap-3" style={{"justifyContent":"space-between"}}>
              <span className="vq-small">Debit note</span>
              <span className="vq-badge">DN</span></li><li className="vq-row vq-gap-3" style={{"justifyContent":"space-between"}}>
              <span className="vq-small">Expense</span>
              <span className="vq-badge">EXP</span></li>
        </ul>
      </div>
      <div className="vq-card vq-card--xl vq-reveal">
        <span className="vq-eyebrow vq-eyebrow--accent">Stock side · 2</span>
        <ul className="vq-stack vq-gap-3 vq-mt-5">
          <li className="vq-row vq-gap-3" style={{"justifyContent":"space-between"}}>
              <span className="vq-small">Stock transfer</span>
              <span className="vq-badge">TRF</span></li><li className="vq-row vq-gap-3" style={{"justifyContent":"space-between"}}>
              <span className="vq-small">Stock audit</span>
              <span className="vq-badge">AUD</span></li>
        </ul>
      </div>
    </div>
    <p className="vq-caption vq-mt-6 vq-reveal" style={{"maxWidth":"70ch"}}>
      Sale return plays the credit-note role on the sell side; Debit note is its counterpart on the buy side. Which side a
      document is on is not cosmetic — it decides whether the party picker offers customers or suppliers, whether the rate
      column says Price or Unit cost, and whether shipping appears in the totals at all.
    </p>
  </div>
</section>

<section className="vq-section vq-band-dark">
  <div className="vq-amb"><span className="vq-amb__grain"></span></div>
  <div className="vq-container" style={{"position":"relative"}}>
    <div className="vq-section-head vq-reveal" style={{"maxWidth":"820px"}}>
      <span className="vq-eyebrow">Why one editor matters</span>
      <h2 className="vq-display">Copy-pasted screens are where the money leaks.</h2>
      <p className="vq-lede">In most systems these are separate files, copied and edited. When they drift, they drift silently
        — and the drift is always in the direction of a number being wrong. Here are four real ones we found and closed
        when we collapsed thirteen screens into one.</p>
    </div>
    <div className="vq-grid vq-grid--2">
      
      <div className="vq-card vq-card--xl vq-reveal">
        <div className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-danger)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></span>
          <div><h3 className="vq-h3" style={{"color":"#fff"}}>A debit note that never restored stock</h3>
          <p className="vq-tile__body vq-mt-2">It did not send a warehouse ID. The credit hit the supplier account, the goods never came back into inventory, and stock and ledger disagreed from that moment on.</p></div>
        </div>
      </div>
      <div className="vq-card vq-card--xl vq-reveal">
        <div className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-danger)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></span>
          <div><h3 className="vq-h3" style={{"color":"#fff"}}>A sale return that zeroed tax and discount</h3>
          <p className="vq-tile__body vq-mt-2">The screen collected both. The server threw both away and picked the first warehouse it found. The refund was wrong, quietly, every time.</p></div>
        </div>
      </div>
      <div className="vq-card vq-card--xl vq-reveal">
        <div className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-danger)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></span>
          <div><h3 className="vq-h3" style={{"color":"#fff"}}>One tax source, then five</h3>
          <p className="vq-tile__body vq-mt-2">Only the sales invoice read the tax settings. Every other document carried its own copy, and the copies aged apart.</p></div>
        </div>
      </div>
      <div className="vq-card vq-card--xl vq-reveal">
        <div className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
          <span style={{"color":"var(--vq-danger)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></span>
          <div><h3 className="vq-h3" style={{"color":"#fff"}}>The same cart, totalled differently</h3>
          <p className="vq-tile__body vq-mt-2">Round-off was implemented per screen. The same basket produced two different totals depending on which document you raised it as.</p></div>
        </div>
      </div>
    </div>
    <div className="vq-row vq-wrap vq-gap-6 vq-mt-12 vq-reveal" style={{"justifyContent":"space-between","alignItems":"center"}}>
      <p className="vq-h3" style={{"color":"#fff","maxWidth":"48ch"}}>One payload builder for all thirteen. A field that renders is a field that posts.</p>
      <a className="vq-btn vq-btn--lg vq-btn--onDark" href="/ledger">See where they post <span className="vq-btn__arrow"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a>
    </div>
  </div>
</section>

<section className="vq-section">
  <div className="vq-container">
    <div className="vq-grid vq-grid--2" style={{"gap":"var(--vq-space-16)","alignItems":"center"}}>
      <div className="vq-reveal">
        <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Density</span>
        <h2 className="vq-display vq-mt-4">Three densities, because a receipt is not a bill.</h2>
        <p className="vq-lede vq-mt-6">A stock transfer needs two fields and four columns. A purchase invoice with landed cost,
          per-line tax and foreign currency needs twelve and nine. The editor carries all three and each document type
          declares which it wants — and you can override it.</p>
      </div>
      <div className="vq-table-wrap vq-reveal">
        <table className="vq-table">
          <thead><tr><th>Density</th><th className="num">Header fields</th><th className="num">Line columns</th><th className="num">Total rows</th></tr></thead>
          <tbody>
            <tr><td className="vq-table__row-head">Simple</td><td className="num">2</td><td className="num">5</td><td className="num">3</td></tr>
            <tr><td className="vq-table__row-head">Standard</td><td className="num">7</td><td className="num">7</td><td className="num">7</td></tr>
            <tr><td className="vq-table__row-head">Pro</td><td className="num">12</td><td className="num">10</td><td className="num">10</td></tr>
          </tbody>
        </table>
        <div style={{"padding":"var(--vq-space-4)","borderTop":"1px solid var(--vq-line)"}}>
          <p className="vq-caption" style={{"maxWidth":"none"}}>Below the width a line needs, the table wraps to cards rather than clipping a column.
            Collapsing the customer block is worth five to ten more visible item rows on a laptop.</p>
        </div>
      </div>
    </div>
  </div>
</section>

<section className="vq-section vq-section--alt">
  <div className="vq-container">
    <div className="vq-section-head vq-section-head--center vq-reveal">
      <h2 className="vq-display">Shared by all thirteen.</h2>
    </div>
    <div className="vq-grid vq-grid--4">
      
      <div className="vq-reveal">
        <h3 className="vq-small" style={{"fontWeight":"var(--vq-fw-semi)"}}>One numbering scheme</h3>
        <p className="vq-caption vq-mt-2" style={{"maxWidth":"none"}}>INV-000148, PO-000148, AUD-000148. Same shape, one sequence per type, never reused.</p>
      </div>
      <div className="vq-reveal">
        <h3 className="vq-small" style={{"fontWeight":"var(--vq-fw-semi)"}}>One tax source</h3>
        <p className="vq-caption vq-mt-2" style={{"maxWidth":"none"}}>Change a rate in settings and every document type follows it in the same instant.</p>
      </div>
      <div className="vq-reveal">
        <h3 className="vq-small" style={{"fontWeight":"var(--vq-fw-semi)"}}>One round-off rule</h3>
        <p className="vq-caption vq-mt-2" style={{"maxWidth":"none"}}>A document property applied once, not thirteen implementations that drift.</p>
      </div>
      <div className="vq-reveal">
        <h3 className="vq-small" style={{"fontWeight":"var(--vq-fw-semi)"}}>One ledger path</h3>
        <p className="vq-caption vq-mt-2" style={{"maxWidth":"none"}}>Every type posts through the Core Ledger. There is no document that skips the books.</p>
      </div>
      <div className="vq-reveal">
        <h3 className="vq-small" style={{"fontWeight":"var(--vq-fw-semi)"}}>One keymap</h3>
        <p className="vq-caption vq-mt-2" style={{"maxWidth":"none"}}>24 shortcuts, identical at the register and in the editor.</p>
      </div>
      <div className="vq-reveal">
        <h3 className="vq-small" style={{"fontWeight":"var(--vq-fw-semi)"}}>One layout law</h3>
        <p className="vq-caption vq-mt-2" style={{"maxWidth":"none"}}>Header, lines, summary. Three zones, measured floors, nothing pushed off the edge.</p>
      </div>
      <div className="vq-reveal">
        <h3 className="vq-small" style={{"fontWeight":"var(--vq-fw-semi)"}}>One set of actions</h3>
        <p className="vq-caption vq-mt-2" style={{"maxWidth":"none"}}>Save, print, email, WhatsApp, PDF, duplicate, record payment — wherever they make sense.</p>
      </div>
      <div className="vq-reveal">
        <h3 className="vq-small" style={{"fontWeight":"var(--vq-fw-semi)"}}>One audit trail</h3>
        <p className="vq-caption vq-mt-2" style={{"maxWidth":"none"}}>Who raised it, when, what changed, and the reversal if it was corrected.</p>
      </div>
    </div>
  </div>
</section>

<section className="vq-section vq-section--alt">
  <div className="vq-container">
    <div className="vq-section-head vq-reveal"><span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Keep reading</span><h2 className="vq-h2 vq-mt-4">Where documents come from</h2></div>
    <div className="vq-grid vq-grid--3"><a className="vq-card vq-card--interactive vq-reveal" href="/pos"><h3 className="vq-h3">The register that issues them</h3><p className="vq-tile__body vq-mt-3">A till you compose yourself.</p><span className="vq-link vq-mt-4">Read on <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a><a className="vq-card vq-card--interactive vq-reveal" href="/ledger"><h3 className="vq-h3">What each one posts</h3><p className="vq-tile__body vq-mt-3">Every document lands in the same ledger.</p><span className="vq-link vq-mt-4">Read on <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a><a className="vq-card vq-card--interactive vq-reveal" href="/tools"><h3 className="vq-h3">Free document generators</h3><p className="vq-tile__body vq-mt-3">Invoices, quotes, receipts and purchase orders, no signup.</p><span className="vq-link vq-mt-4">Read on <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a></div>
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
