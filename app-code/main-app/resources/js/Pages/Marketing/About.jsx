import React, { useEffect } from 'react';
import { useTheme } from '@/Contexts/ThemeContext';
import { Head, Link, usePage } from '@inertiajs/react';

export default function About() {
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
                <title>About VenQore — Mission, Architecture & Origin</title>
                <meta name="description" content="VenQore is the AI ERP builder: describe your business and it assembles an operating system backed by verified double-entry accounting. Built by operators, engineered for truth." />
                <link rel="canonical" href="https://venqore.com/about" />
                <meta property="og:title" content="About VenQore — Mission, Architecture & Origin" />
                <meta property="og:description" content="VenQore is the AI ERP builder: describe your business and it assembles an operating system backed by verified double-entry accounting. Built by operators, engineered for truth." />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://venqore.com/about" />
                <meta property="og:image" content="https://venqore.com/images/og/venqore-og.png" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="About VenQore — Mission, Architecture & Origin" />
                <meta name="twitter:description" content="VenQore is the AI ERP builder: describe your business and it assembles an operating system backed by verified double-entry accounting. Built by operators, engineered for truth." />
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
          <li className="vq-nav__item"><a href="/pricing" className="vq-nav__link">Pricing</a></li>
          <li className="vq-nav__item">
            <a href="/about" className="vq-nav__link" aria-current="page">Company <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></a>
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
      <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">About VenQore</span>
      <h1 className="vq-display vq-mt-4">Built from the counter up. <em className="vq-italic">Engineered for truth.</em></h1>
      <p className="vq-lede vq-mt-6">VenQore is an AI ERP builder created for businesses that have outgrown fragmented spreadsheets and disconnected tools, but refuse to endure bloated six-month consulting projects. We combine composable operational modules with an immutable double-entry general ledger — giving you an operating system that fits your business on day one.</p>
      <div className="vq-row vq-wrap vq-gap-3 vq-mt-8">
        <a className="vq-btn vq-btn--primary vq-btn--lg" href="/build-workspace">Start building <span className="vq-btn__arrow"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a>
        <a className="vq-btn vq-btn--secondary vq-btn--lg" href="/ledger">Explore Core Ledger</a>
      </div>
    </div>
  </div>
</section>

<section className="vq-section" style={{"paddingTop":"0"}}>
  <div className="vq-container">
    <div className="vq-grid" style={{"gridTemplateColumns":"minmax(0,1fr) minmax(0,400px)","gap":"var(--vq-space-16)","alignItems":"start"}}>
      <div className="vq-reveal">
        <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">The Origin</span>
        <h2 className="vq-h2 vq-mt-3">The three disconnected worlds.</h2>
        <p className="vq-lede vq-mt-4" style={{"color":"var(--vq-text)"}}>For years, growing retail, wholesale, and service businesses have been forced to survive across three fractured tools: a till that only tallies daily cash, a notebook tracking customer credit and khata, and a spreadsheet desperately trying to hold inventory and margins together.</p>
        <p className="vq-body vq-mt-6 vq-text-2">None of them agree. The till says sales are strong, the bank account says payroll is tight, and real profitability is an unsolved riddle until someone loses an entire weekend to manually force the numbers to reconcile.</p>
        
        <h3 className="vq-h3 vq-mt-10">The consulting racket that solved nothing.</h3>
        <p className="vq-body vq-mt-4 vq-text-2">Every traditional enterprise ERP that offered to fix this followed the exact same playbook: a discovery call, an impenetrable statement of work, an expensive third-party implementation team, and four months of configuration delays with an extra digit on the invoice. By month four, exhausted by endless change requests, most operators give up and decide the spreadsheet was fine.</p>
        
        <h3 className="vq-h3 vq-mt-10">The architectural breakthrough.</h3>
        <p className="vq-body vq-mt-4 vq-text-2">We wrote the software that should have existed from day one. We started with the mathematical foundation: <strong>Core Ledger</strong>. Because a point of sale that cannot report your true FIFO margins is just a cash drawer with a screen, and an inventory system that doesn't post double-entry journals is just a guesswork list.</p>
        <p className="vq-body vq-mt-6 vq-text-2">Then came the defining shift: every business operates with distinct workflows, but custom development does not scale. We turned configuration into the engine. Describe your business in plain language, and VenQore automatically composes your fields, registers, approval tiers, and reports from 46 battle-tested modules — all posting immutably through one general ledger.</p>

        <div className="vq-quote vq-mt-10">
          <p>“We are not building twenty disconnected tools and hoping they sync. We built one unified engine, proved it on live counters, and engineer it to assemble itself around any business model.”</p>
        </div>
      </div>

      <aside className="vq-stack vq-gap-4 vq-reveal" style={{"position":"sticky","top":"120px"}}>
        <div className="vq-card vq-card--accent vq-stat">
          <span className="vq-stat__label">Trial balance drift</span>
          <span className="vq-stat__value vq-stat__value--sm">0.00</span>
          <span className="vq-stat__note">Debits equal credits, mathematically enforced</span>
        </div>
        <div className="vq-card vq-stat">
          <span className="vq-stat__label">Automated verification</span>
          <span className="vq-stat__value vq-stat__value--sm">636+</span>
          <span className="vq-stat__note">Green regression tests on every release</span>
        </div>
        <div className="vq-card vq-stat">
          <span className="vq-stat__label">Composable modules</span>
          <span className="vq-stat__value vq-stat__value--sm">46</span>
          <span className="vq-stat__note">POS, FIFO Stock, Ledger, Documents, Sync</span>
        </div>
        <div className="vq-card vq-stat">
          <span className="vq-stat__label">Double-entry audit trail</span>
          <span className="vq-stat__value vq-stat__value--sm">100%</span>
          <span className="vq-stat__note">Every journal entry immutable and traceable</span>
        </div>
      </aside>
    </div>
  </div>
</section>

<section className="vq-section vq-band-dark">
  <div className="vq-amb"><span className="vq-amb__beams"><i></i><i></i><i></i></span><span className="vq-amb__grain"></span></div>
  <div className="vq-container" style={{"position":"relative"}}>
    <div className="vq-section-head vq-reveal">
      <span className="vq-eyebrow">Our Convictions</span>
      <h2 className="vq-display">Four opinions, held on purpose.</h2>
      <p className="vq-lede" style={{"color":"rgb(255 255 255 / .72)"}}>The architectural principles behind everything we engineer.</p>
    </div>
    <div className="vq-grid vq-grid--2">
      <div className="vq-card vq-card--xl vq-reveal">
        <h3 className="vq-h3" style={{"color":"#fff"}}>1. Software should fit the business, not the reverse.</h3>
        <p className="vq-tile__body vq-mt-3">Every off-the-shelf ERP was built for a generic business that isn't yours. The industry's answer is an army of consultants to bend your workflows to their database. Ours is an AI builder that assembles the exact system you need.</p>
      </div>
      <div className="vq-card vq-card--xl vq-reveal">
        <h3 className="vq-h3" style={{"color":"#fff"}}>2. Money is not a place to be clever.</h3>
        <p className="vq-tile__body vq-mt-3">The AI composes your screens, fields, and workflows. It never touches the mathematical engine that decides what your numbers say. Flexible where it should be, strictly deterministic where it must be.</p>
      </div>
      <div className="vq-card vq-card--xl vq-reveal">
        <h3 className="vq-h3" style={{"color":"#fff"}}>3. Publish the proof, don't ask for trust.</h3>
        <p className="vq-tile__body vq-mt-3">Where conventional software websites show superficial logo walls, we publish automated reconciliation gates and double-entry mathematical proofs. Buyers of financial software deserve rigour over marketing.</p>
      </div>
      <div className="vq-card vq-card--xl vq-reveal">
        <h3 className="vq-h3" style={{"color":"#fff"}}>4. Institutional clarity priced for real commerce.</h3>
        <p className="vq-tile__body vq-mt-3">The businesses that most need one honest set of numbers are exactly the ones priced out by predatory enterprise licenses. We deliver institutional-grade ERP capabilities at software prices, not project prices.</p>
      </div>
    </div>
  </div>
</section>

<section className="vq-section">
  <div className="vq-container">
    <div className="vq-section-head vq-reveal">
      <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Engineered for Commerce</span>
      <h2 className="vq-display">Deep native capabilities across industries.</h2>
      <p className="vq-lede">VenQore is not a single vertical template. It is an engine of 46 interoperable modules assembled specifically for your operational model.</p>
    </div>
    <div className="vq-table-wrap vq-reveal">
      <table className="vq-table">
        <thead>
          <tr>
            <th>Industry Vertical</th>
            <th style={{"width":"230px"}}>Operational Engine</th>
            <th>Native Capabilities</th>
            <th className="num" style={{"width":"130px"}}>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="vq-table__row-head">Retail, Supermarket &amp; Grocery</td>
            <td>High-velocity counter POS</td>
            <td className="vq-text-2">Barcode scanning, fast hold/recall, weight scale integration, cash drawer controls, real-time inventory decrement.</td>
            <td className="num vq-table__win">Live &middot; Production</td>
          </tr>
          <tr>
            <td className="vq-table__row-head">Wholesale &amp; Distribution</td>
            <td>Trade credit &amp; tier pricing</td>
            <td className="vq-text-2">Customer Khata balances, credit limits, automated aging, tiered price lists, bulk invoice dispatching.</td>
            <td className="num vq-table__win">Live &middot; Production</td>
          </tr>
          <tr>
            <td className="vq-table__row-head">Pharmacy &amp; Health Supplies</td>
            <td>Batch &amp; expiry controls</td>
            <td className="vq-text-2">Strict FIFO lot relief, manufacture/expiry tracking, batch quarantine alerts, unit of measure conversion.</td>
            <td className="num vq-table__win">Live &middot; Production</td>
          </tr>
          <tr>
            <td className="vq-table__row-head">Hardware, Auto Parts &amp; Electronics</td>
            <td>Serialized &amp; variant inventory</td>
            <td className="vq-text-2">Serial number / IMEI tracking, warranty records, deep multi-attribute catalogs, bin locations.</td>
            <td className="num vq-table__win">Live &middot; Production</td>
          </tr>
          <tr>
            <td className="vq-table__row-head">Manufacturing &amp; Light Assembly</td>
            <td>Bill of materials &amp; recipes</td>
            <td className="vq-text-2">Multi-stage component assembly, automatic raw material deduction, finished goods costing.</td>
            <td className="num vq-table__win">Live &middot; Production</td>
          </tr>
          <tr>
            <td className="vq-table__row-head">Multi-Branch Chains &amp; Warehouses</td>
            <td>Consolidated general ledger</td>
            <td className="vq-text-2">Inter-branch inventory transfers with transit tracking, unified customer khata, central financial oversight.</td>
            <td className="num vq-table__win">Live &middot; Production</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p className="vq-caption vq-mt-4" style={{"maxWidth":"none"}}>Every vertical runs on the exact same core ledger engine. Every sale, purchase order, receipt, and stock transfer automatically posts balanced journal entries.</p>
  </div>
</section>

<section className="vq-section vq-section--alt">
  <div className="vq-container vq-container--narrow">
    <div className="vq-reveal">
      <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Direct Accountability</span>
      <h2 className="vq-display vq-mt-4">Built by operators. Supported with conviction.</h2>
      <p className="vq-lede vq-mt-6">When you run mission-critical business software, the last thing you need is a bloated support queue where nobody has ever stood behind a cash counter. VenQore was conceived and tested in the daily realities of live commerce — where if a till lags or an inventory count drifts, real customers wait and real money is lost.</p>
      <p className="vq-body vq-mt-6 vq-text-2">Every feature in this platform exists because real operations demanded it: batch expiration alerts because an expired product was once delivered; offline POS caching because internet connections drop at peak hours; and immutable general ledgers because accounting errors destroy businesses.</p>
      <p className="vq-body vq-mt-6 vq-text-2">We ship improvements every single week. When you reach out to VenQore, you get direct answers from the people who design and engineer your software.</p>
      <div className="vq-row vq-gap-4 vq-mt-8" style={{"alignItems":"center"}}>
        <div style={{"width":"52px","height":"52px","borderRadius":"var(--vq-r-full)","background":"var(--vq-accent-quiet)","border":"1px solid var(--vq-accent-quiet-line)","display":"grid","placeItems":"center","color":"var(--vq-accent-text)","fontFamily":"var(--vq-font-numeric)","fontWeight":"700","fontSize":"18px"}}>AH</div>
        <div>
          <div className="vq-small" style={{"fontWeight":"var(--vq-fw-semi)","fontSize":"16px"}}>Abdullah Hashmi</div>
          <div className="vq-caption" style={{"marginTop":"2px"}}>Founder &amp; Chief Architect &middot; <a href="/contact" className="vq-link" style={{"display":"inline-flex","alignItems":"center","gap":"4px"}}>Get in touch <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></a></div>
        </div>
      </div>
    </div>
  </div>
</section>

<section className="vq-section vq-section--alt">
  <div className="vq-container">
    <div className="vq-section-head vq-reveal"><span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Keep reading</span><h2 className="vq-h2 vq-mt-4">What we built</h2></div>
    <div className="vq-grid vq-grid--3"><a className="vq-card vq-card--interactive vq-reveal" href="/ledger"><h3 className="vq-h3">The correctness argument</h3><p className="vq-tile__body vq-mt-3">Seven checks the ledger runs on itself.</p><span className="vq-link vq-mt-4">Read on <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a><a className="vq-card vq-card--interactive vq-reveal" href="/roadmap"><h3 className="vq-h3">What ships next</h3><p className="vq-tile__body vq-mt-3">Now, next and later, in public.</p><span className="vq-link vq-mt-4">Read on <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a><a className="vq-card vq-card--interactive vq-reveal" href="/blog"><h3 className="vq-h3">How we think about retail</h3><p className="vq-tile__body vq-mt-3">Operations and accounting playbooks.</p><span className="vq-link vq-mt-4">Read on <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a></div>
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
