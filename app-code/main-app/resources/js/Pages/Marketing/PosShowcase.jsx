import React, { useEffect } from 'react';
import { useTheme } from '@/Contexts/ThemeContext';
import { Head, Link, usePage } from '@inertiajs/react';

export default function PosShowcase() {
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
                <title>The register — a POS that composes itself | VenQore</title>
                <meta name="description" content="Seven starting points, eight controls, and a layout engine whose job is to stop your arrangement from breaking. A register you compose yourself." />
                <link rel="canonical" href="https://venqore.com/pos" />
                <meta property="og:title" content="The register — a POS that composes itself | VenQore" />
                <meta property="og:description" content="Seven starting points, eight controls, and a layout engine whose job is to stop your arrangement from breaking. A register you compose yourself." />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://venqore.com/pos" />
                <meta property="og:image" content="https://venqore.com/images/og/venqore-og.png" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="The register — a POS that composes itself | VenQore" />
                <meta name="twitter:description" content="Seven starting points, eight controls, and a layout engine whose job is to stop your arrangement from breaking. A register you compose yourself." />
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
  <div className="vq-amb"><span className="vq-amb__grid"></span></div>
  <div className="vq-container" style={{"position":"relative"}}>
    <div style={{"maxWidth":"820px"}}>
      <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">The register</span>
      <h1 className="vq-display vq-mt-4">A till is composed by the person <em className="vq-italic">standing</em> at it.</h1>
      <p className="vq-lede vq-mt-6">Most point-of-sale software ships a fixed layout and hopes it suits you. VenQore ships seven starting points and eight controls, and the layout engine's only job is to stop your arrangement from breaking.</p>
      <div className="vq-row vq-wrap vq-gap-3 vq-mt-8"><a className="vq-btn vq-btn--primary vq-btn--lg" href="/build-workspace">Start building <span className="vq-btn__arrow"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a>
        <a className="vq-btn vq-btn--secondary vq-btn--lg" href="/features#selling">Everything in Selling</a></div>
    </div>
  </div>
</section>

<section className="vq-section" style={{"paddingTop":"0"}}>
  <div className="vq-container vq-container--wide">
    <div className="vq-demo vq-reveal" data-pos>
      <div className="vq-demo__bar">
        <div className="vq-demo__dots"><i></i><i></i><i></i></div>
        <div className="vq-demo__url"><svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> www.venqore.com/pos</div>
        <span className="vq-demo__live">Live · try it</span>
      </div>
      <div className="vq-demo__controls">
        <span className="vq-eyebrow" style={{"flex":"none"}}>Starting point</span>
        <div className="vq-demo__scroller" data-pos-tabs role="tablist"></div>
      </div>
      <div className="vq-demo__body vq-demo__body--flush" data-pos-stage></div>
      <div style={{"padding":"var(--vq-space-5)","borderTop":"1px solid var(--vq-line)","background":"var(--vq-surface-2)"}} data-pos-why></div>
    </div>
    <p className="vq-caption vq-center vq-mt-4" style={{"maxWidth":"none"}}>
      Seven presets, and the composition behind each one — from the product's own layout law. Tap a name to recompose the register.
    </p>
  </div>
</section>

<section className="vq-section vq-section--alt">
  <div className="vq-container">
    <div className="vq-section-head vq-reveal">
      <span className="vq-eyebrow">The point</span>
      <h2 className="vq-display">Nobody else in this category ships resizable panes.</h2>
      <p className="vq-lede">We checked. Toast lets you set rows and columns. Lightspeed sizes tiles. Loyverse toggles grid or list.
        Shopify and Square let you edit what is on a tile. The one product with free pane geometry authors it in an admin
        tool as XML — not at the register, and not by the person using it.</p>
    </div>
    <div className="vq-grid vq-grid--3">
      
      <article className="vq-card vq-card--xl vq-tile vq-reveal">
        <span className="vq-tile__icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"/><path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12"/><path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"/></svg></span>
        <h3 className="vq-tile__title">A preset is a starting point, not a cage</h3>
        <p className="vq-tile__body">Pick the one closest to how you work, then drag a divider. The catalogue can take 20% or 40% of the screen, sit on top, sit on the left, or not exist at all.</p>
      </article>
      <article className="vq-card vq-card--xl vq-tile vq-reveal">
        <span className="vq-tile__icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg></span>
        <h3 className="vq-tile__title">The engine measures, it does not guess</h3>
        <p className="vq-tile__body">Every pane declares the width its text actually needs. Drag past that floor and the catalogue becomes a full-screen button rather than a broken column. Nothing is ever deleted to save space.</p>
      </article>
      <article className="vq-card vq-card--xl vq-tile vq-reveal">
        <span className="vq-tile__icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
        <h3 className="vq-tile__title">Proven, not eyeballed</h3>
        <p className="vq-tile__body">35,255 automated checks with zero disagreements. Every arrangement swept every 8 pixels from a 320px phone to a 3440px ultrawide. Zero controls covered, zero content stranded off screen.</p>
      </article>
    </div>
  </div>
</section>

<section className="vq-section vq-band-dark">
  <div className="vq-amb"><span className="vq-amb__beams"><i></i><i></i><i></i></span><span className="vq-amb__grain"></span></div>
  <div className="vq-container" style={{"position":"relative"}}>
    <div className="vq-grid vq-grid--2" style={{"gap":"var(--vq-space-16)"}}>
      <div className="vq-reveal">
        <span className="vq-eyebrow">The rule that keeps it usable</span>
        <h2 className="vq-display vq-mt-4">Seven controls on the surface. No more.</h2>
        <p className="vq-lede vq-mt-6">Seven is the working-memory span. Past it a cashier scans the screen instead of acting on it.
          So the register carries at most seven rank-one controls on a desktop and five on a phone; everything else is one
          gesture away, and monthly settings are not on the till at all.</p>
        <div className="vq-grid vq-grid--3 vq-mt-10" style={{"gap":"var(--vq-space-6)"}}>
          
          <div><div className="vq-num" style={{"fontSize":"var(--vq-fs-metric)","fontWeight":"600","color":"#fff","letterSpacing":"-.03em","lineHeight":"1"}}>60</div>
          <div className="vq-caption vq-mt-1" style={{"color":"rgb(237 242 239 / .55)"}}>capabilities</div></div>
          <div><div className="vq-num" style={{"fontSize":"var(--vq-fs-metric)","fontWeight":"600","color":"#fff","letterSpacing":"-.03em","lineHeight":"1"}}>15</div>
          <div className="vq-caption vq-mt-1" style={{"color":"rgb(237 242 239 / .55)"}}>on the surface</div></div>
          <div><div className="vq-num" style={{"fontSize":"var(--vq-fs-metric)","fontWeight":"600","color":"#fff","letterSpacing":"-.03em","lineHeight":"1"}}>0</div>
          <div className="vq-caption vq-mt-1" style={{"color":"rgb(237 242 239 / .55)"}}>settings docked</div></div>
        </div>
      </div>
      <div className="vq-reveal vq-stack vq-gap-4">
        
        <div className="vq-card"><b className="vq-small" style={{"fontWeight":"var(--vq-fw-semi)"}}>Same controls, three shapes</b>
        <p className="vq-caption vq-mt-2" style={{"maxWidth":"none"}}>The payment panel is built once and used in three places — a resident column, a full-screen sheet, a 56px docked bar. Nothing a cashier learned in one arrangement is missing from another.</p></div>
        <div className="vq-card"><b className="vq-small" style={{"fontWeight":"var(--vq-fw-semi)"}}>The keypad lives in the sheet</b>
        <p className="vq-caption vq-mt-2" style={{"maxWidth":"none"}}>Never in the resident column. A keypad in a narrow column only pushes the things that matter into a scroll.</p></div>
        <div className="vq-card"><b className="vq-small" style={{"fontWeight":"var(--vq-fw-semi)"}}>The dock is a layout row</b>
        <p className="vq-caption vq-mt-2" style={{"maxWidth":"none"}}>Not a floating button. Its height is subtracted before anything else is measured, so Complete can never end up below the fold.</p></div>
        <div className="vq-card"><b className="vq-small" style={{"fontWeight":"var(--vq-fw-semi)"}}>A table is a held sale</b>
        <p className="vq-caption vq-mt-2" style={{"maxWidth":"none"}}>On the Table preset, hold becomes automatic and back means back to the floor — because the unit of work is the table, not the sale.</p></div>
      </div>
    </div>
  </div>
</section>

<section className="vq-section">
  <div className="vq-container">
    <div className="vq-section-head vq-reveal">
      <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">At the counter</span>
      <h2 className="vq-display">Seventeen things that matter at 5pm on a Saturday.</h2>
    </div>
    <div className="vq-grid vq-grid--3">
      
      <div className="vq-reveal vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
        <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
        <div><b className="vq-small" style={{"fontWeight":"var(--vq-fw-semi)"}}>Instant barcode scanner</b>
        <p className="vq-caption vq-mt-1" style={{"maxWidth":"none"}}>Wedge or camera. Unknown codes offer to create the item rather than beeping at you.</p></div>
      </div>
      <div className="vq-reveal vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
        <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
        <div><b className="vq-small" style={{"fontWeight":"var(--vq-fw-semi)"}}>Serial &amp; IMEI scanner</b>
        <p className="vq-caption vq-mt-1" style={{"maxWidth":"none"}}>The serial follows the unit through sale, return and warranty.</p></div>
      </div>
      <div className="vq-reveal vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
        <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
        <div><b className="vq-small" style={{"fontWeight":"var(--vq-fw-semi)"}}>Park &amp; recall</b>
        <p className="vq-caption vq-mt-1" style={{"maxWidth":"none"}}>Hold a bill, serve the next customer, bring it back. Also how table service works.</p></div>
      </div>
      <div className="vq-reveal vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
        <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
        <div><b className="vq-small" style={{"fontWeight":"var(--vq-fw-semi)"}}>Cart rescue</b>
        <p className="vq-caption vq-mt-1" style={{"maxWidth":"none"}}>Power cut, browser crash, accidental refresh — the cart is still there.</p></div>
      </div>
      <div className="vq-reveal vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
        <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
        <div><b className="vq-small" style={{"fontWeight":"var(--vq-fw-semi)"}}>Typo-tolerant search</b>
        <p className="vq-caption vq-mt-1" style={{"maxWidth":"none"}}>Finds "panadol" from "pandol", and the SKU from half of it.</p></div>
      </div>
      <div className="vq-reveal vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
        <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
        <div><b className="vq-small" style={{"fontWeight":"var(--vq-fw-semi)"}}>Multi-account split payment</b>
        <p className="vq-caption vq-mt-1" style={{"maxWidth":"none"}}>Part cash, part card, part on account, in one sale.</p></div>
      </div>
      <div className="vq-reveal vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
        <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
        <div><b className="vq-small" style={{"fontWeight":"var(--vq-fw-semi)"}}>Automatic cash rounding</b>
        <p className="vq-caption vq-mt-1" style={{"maxWidth":"none"}}>To your smallest coin, posted to a rounding account so the ledger still ties.</p></div>
      </div>
      <div className="vq-reveal vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
        <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
        <div><b className="vq-small" style={{"fontWeight":"var(--vq-fw-semi)"}}>Daily cash register audit</b>
        <p className="vq-caption vq-mt-1" style={{"maxWidth":"none"}}>Counted versus expected, per register, per shift, with the variance explained.</p></div>
      </div>
      <div className="vq-reveal vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
        <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
        <div><b className="vq-small" style={{"fontWeight":"var(--vq-fw-semi)"}}>Negative stock alert &amp; lock</b>
        <p className="vq-caption vq-mt-1" style={{"maxWidth":"none"}}>Choose whether selling what you do not have is a warning or a wall.</p></div>
      </div>
      <div className="vq-reveal vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
        <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
        <div><b className="vq-small" style={{"fontWeight":"var(--vq-fw-semi)"}}>In-flight product creation</b>
        <p className="vq-caption vq-mt-1" style={{"maxWidth":"none"}}>Create the item mid-sale without leaving the cart.</p></div>
      </div>
      <div className="vq-reveal vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
        <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
        <div><b className="vq-small" style={{"fontWeight":"var(--vq-fw-semi)"}}>Auto-applying customer discounts</b>
        <p className="vq-caption vq-mt-1" style={{"maxWidth":"none"}}>The tier follows the customer; nobody has to remember it.</p></div>
      </div>
      <div className="vq-reveal vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
        <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
        <div><b className="vq-small" style={{"fontWeight":"var(--vq-fw-semi)"}}>Change calculator</b>
        <p className="vq-caption vq-mt-1" style={{"maxWidth":"none"}}>Tendered in, change out, printed on the receipt.</p></div>
      </div>
      <div className="vq-reveal vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
        <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
        <div><b className="vq-small" style={{"fontWeight":"var(--vq-fw-semi)"}}>Keyboard-first checkout</b>
        <p className="vq-caption vq-mt-1" style={{"maxWidth":"none"}}>24 shortcuts. A trained cashier never touches the screen.</p></div>
      </div>
      <div className="vq-reveal vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
        <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
        <div><b className="vq-small" style={{"fontWeight":"var(--vq-fw-semi)"}}>Silent thermal printing</b>
        <p className="vq-caption vq-mt-1" style={{"maxWidth":"none"}}>WebUSB, no print dialog, custom roll widths and cut-line padding.</p></div>
      </div>
      <div className="vq-reveal vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
        <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
        <div><b className="vq-small" style={{"fontWeight":"var(--vq-fw-semi)"}}>Tax verification QR</b>
        <p className="vq-caption vq-mt-1" style={{"maxWidth":"none"}}>On the receipt, where the regulator expects it.</p></div>
      </div>
      <div className="vq-reveal vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
        <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
        <div><b className="vq-small" style={{"fontWeight":"var(--vq-fw-semi)"}}>Offline mode</b>
        <p className="vq-caption vq-mt-1" style={{"maxWidth":"none"}}>The till keeps selling when the internet does not. It reconciles when it returns.</p></div>
      </div>
      <div className="vq-reveal vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
        <span style={{"color":"var(--vq-accent)","flex":"none","marginTop":"3px"}}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
        <div><b className="vq-small" style={{"fontWeight":"var(--vq-fw-semi)"}}>Cashier PIN login</b>
        <p className="vq-caption vq-mt-1" style={{"maxWidth":"none"}}>Fast switching between staff, with an inactivity auto-logout behind it.</p></div>
      </div>
    </div>
  </div>
</section>

<section className="vq-section vq-section--alt">
  <div className="vq-container vq-container--narrow vq-center vq-reveal">
    <h2 className="vq-display">Every sale posts to the ledger. All of it.</h2>
    <p className="vq-lede vq-mt-5" style={{"marginInline":"auto"}}>Cash in, revenue, tax payable, cost of goods, inventory out —
      five postings from one barcode scan, with the cost taken from the batch that actually left the shelf.</p>
    <a className="vq-btn vq-btn--secondary vq-btn--lg vq-mt-8" href="/ledger">See the Core Ledger <span className="vq-btn__arrow"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a>
  </div>
</section>

<section className="vq-section vq-section--alt">
  <div className="vq-container">
    <div className="vq-section-head vq-reveal"><span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Keep reading</span><h2 className="vq-h2 vq-mt-4">Around the counter</h2></div>
    <div className="vq-grid vq-grid--3"><a className="vq-card vq-card--interactive vq-reveal" href="/documents"><h3 className="vq-h3">Thirteen document types, one editor</h3><p className="vq-tile__body vq-mt-3">Invoice to stock audit.</p><span className="vq-link vq-mt-4">Read on <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a><a className="vq-card vq-card--interactive vq-reveal" href="/solutions/grocery"><h3 className="vq-h3">A high-speed grocery till</h3><p className="vq-tile__body vq-mt-3">Weight, shrink and daily margins.</p><span className="vq-link vq-mt-4">Read on <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a><a className="vq-card vq-card--interactive vq-reveal" href="/compare/venqore-vs-square"><h3 className="vq-h3">How this compares to Square</h3><p className="vq-tile__body vq-mt-3">Fee maths and what is built in.</p><span className="vq-link vq-mt-4">Read on <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a></div>
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
