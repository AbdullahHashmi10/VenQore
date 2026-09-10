import React, { useEffect } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';

export default function Security() {
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
                <title>Security — isolation, roles and an unedited record | VenQore</title>
                <meta name="description" content="How one business's data is kept from another's: a tenant scope on 116 models, 49 permissions across 7 roles, and postings that are reversed rather than edited." />
                <link rel="canonical" href="https://venqore.com/security" />
                <meta property="og:title" content="Security — isolation, roles and an unedited record | VenQore" />
                <meta property="og:description" content="How one business's data is kept from another's: a tenant scope on 116 models, 49 permissions across 7 roles, and postings that are reversed rather than edited." />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://venqore.com/security" />
                <meta property="og:image" content="https://venqore.com/images/og/venqore-og.png" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Security — isolation, roles and an unedited record | VenQore" />
                <meta name="twitter:description" content="How one business's data is kept from another's: a tenant scope on 116 models, 49 permissions across 7 roles, and postings that are reversed rather than edited." />
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
  <div className="vq-amb"><span className="vq-amb__aurora" style={{"opacity":".30"}}></span></div>
  <div className="vq-container" style={{"position":"relative"}}>
    <div style={{"maxWidth":"820px"}}>
      <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Security</span>
      <h1 className="vq-display vq-mt-4">Your books are yours. <em className="vq-italic">Structurally.</em></h1>
      <p className="vq-lede vq-mt-6">This page explains how VenQore keeps one business's accounting data separate from another's in a multi-tenant system: a tenant scope applied to 116 models rather than to individual queries, 49 permissions across 7 roles, two-factor authentication, and a ledger where a correction is a reversal plus a new entry rather than an edit.</p>
    </div>
  </div>
</section>

<section className="vq-section" style={{"paddingTop":"0"}}>
  <div className="vq-container">
    <div className="vq-grid vq-grid--3">
      <div className="vq-card vq-card--xl vq-reveal">
        <span className="vq-num" style={{"fontSize":"var(--vq-fs-metric)"}}>116</span>
        <p className="vq-tile__body vq-mt-3">models carry the tenant scope. Not a filter a query has to remember — a
          global scope applied at the model, so a query that forgets is still scoped.</p>
      </div>
      <div className="vq-card vq-card--xl vq-reveal">
        <span className="vq-num" style={{"fontSize":"var(--vq-fs-metric)"}}>49</span>
        <p className="vq-tile__body vq-mt-3">permissions across 7 roles — owner, admin, manager, cashier, accountant,
          purchasing officer and viewer. A role is a set of these, not a label.</p>
      </div>
      <div className="vq-card vq-card--xl vq-reveal">
        <span className="vq-num" style={{"fontSize":"var(--vq-fs-metric)"}}>8</span>
        <p className="vq-tile__body vq-mt-3">correctness laws run on every release. The first one exists purely to try
          to read one tenant's numbers from another's session.</p>
      </div>
    </div>
  </div>
</section>

<section className="vq-section vq-section--alt">
  <div className="vq-container">
    <div className="vq-section-head vq-reveal" style={{"maxWidth":"760px"}}>
      <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Isolation</span>
      <h2 className="vq-display">A query cannot forget which business it belongs to.</h2>
      <p className="vq-lede">The usual way to separate tenants is to add <code>where tenant_id = ?</code> to every
        query and hope nobody forgets. Forgetting once is a breach. VenQore does it the other way round.</p>
    </div>
    <div className="vq-grid vq-grid--2">
      <div className="vq-card vq-card--xl vq-reveal">
        <h3 className="vq-h3">Scoped at the model, not the query</h3>
        <p className="vq-tile__body vq-mt-3">Every tenant-owned model applies a global scope that adds the tenant
          condition to <b>every</b> query it builds — reads, writes, counts, joins. A developer who writes a
          query and forgets the tenant still gets a scoped query. Bypassing it takes an explicit, greppable
          call that exists for console commands and platform administration.</p>
      </div>
      <div className="vq-card vq-card--xl vq-reveal">
        <h3 className="vq-h3">Assigned on write, too</h3>
        <p className="vq-tile__body vq-mt-3">The same layer stamps the owning business onto every new record at
          creation. A row cannot be written without an owner, so there is no orphaned data to leak later and
          no import path that quietly creates unowned rows.</p>
      </div>
      <div className="vq-card vq-card--xl vq-reveal">
        <h3 className="vq-h3">Proved, not asserted</h3>
        <p className="vq-tile__body vq-mt-3">The first of the eight correctness laws sets up two businesses and
          tries to read one's figures while authenticated as the other, across the whole metric registry. It
          runs on every release. If isolation regresses, that release does not ship.</p>
      </div>
      <div className="vq-card vq-card--xl vq-reveal">
        <h3 className="vq-h3">Modules you switched off are actually off</h3>
        <p className="vq-tile__body vq-mt-3">Turning a module off removes it from the navigation and closes its
          URLs. The gate is middleware on the route, not a hidden menu item — typing the address of a
          disabled module gets you nothing.</p>
      </div>
    </div>
  </div>
</section>

<section className="vq-section">
  <div className="vq-container">
    <div className="vq-section-head vq-reveal" style={{"maxWidth":"760px"}}>
      <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">The record</span>
      <h2 className="vq-display">Nothing is edited in place.</h2>
      <p className="vq-lede">The strongest security property in an accounting system is not who can log in. It is
        whether a posted number can be quietly changed afterwards.</p>
    </div>
    <div className="vq-grid vq-grid--2">
      <div className="vq-card vq-card--xl vq-reveal">
        <h3 className="vq-h3">A correction is a reversal plus a new entry</h3>
        <p className="vq-tile__body vq-mt-3">Both are visible, both are dated, and the original stays where it was.
          There is no version of a transaction that only the last person to touch it can see, because there is
          no second version.</p>
      </div>
      <div className="vq-card vq-card--xl vq-reveal">
        <h3 className="vq-h3">Every posting traces to a document, a user and a timestamp</h3>
        <p className="vq-tile__body vq-mt-3">Your accountant can follow the trail from a figure in a report to the
          document that produced it and the person who entered it, without asking anyone a question.</p>
      </div>
      <div className="vq-card vq-card--xl vq-reveal">
        <h3 className="vq-h3">A closed period is closed</h3>
        <p className="vq-tile__body vq-mt-3">Postings dated into a closed period are refused rather than absorbed,
          and the closing entries reconcile against the balances that existed before the close.</p>
      </div>
      <div className="vq-card vq-card--xl vq-reveal">
        <h3 className="vq-h3">Export is a right, not a retention lever</h3>
        <p className="vq-tile__body vq-mt-3">Your data is exportable at any time, in a format your next system can
          read, on every plan including Solo. We do not charge to leave.</p>
        <a className="vq-link vq-mt-4" href="/ledger">How the ledger proves itself
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></a>
      </div>
    </div>
  </div>
</section>

<section className="vq-section vq-section--alt">
  <div className="vq-container">
    <div className="vq-section-head vq-reveal" style={{"maxWidth":"760px"}}>
      <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Access</span>
      <h2 className="vq-display">Who can do what, and who did it.</h2>
    </div>
    <div className="vq-table-wrap vq-reveal">
      <table className="vq-table">
        <thead><tr><th style={{"width":"34%"}}>Control</th><th>What it means in practice</th></tr></thead>
        <tbody>
          <tr><td className="vq-table__row-head">Seven roles</td><td className="vq-text-2">Owner, admin, manager, cashier, accountant, purchasing officer, viewer — each a defined set of the 49 permissions, not a name on a dropdown.</td></tr>
          <tr><td className="vq-table__row-head">Permission-gated routes</td><td className="vq-text-2">Permissions are checked on the route, so a screen a role cannot use is a URL that role cannot open.</td></tr>
          <tr><td className="vq-table__row-head">Two-factor authentication</td><td className="vq-text-2">Available on every account, and enforceable so that a user without it confirmed cannot proceed.</td></tr>
          <tr><td className="vq-table__row-head">Cashier PIN login</td><td className="vq-text-2">A till can be handed between staff without sharing a password, and each sale still carries who made it.</td></tr>
          <tr><td className="vq-table__row-head">Security activity log</td><td className="vq-text-2">Included on Scale. Who signed in, from where, and what changed.</td></tr>
          <tr><td className="vq-table__row-head">Support access is bounded</td><td className="vq-text-2">Platform administration is a separate role behind its own gate, and impersonation runs through a guard rather than a shared login.</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</section>

<section className="vq-section">
  <div className="vq-container">
    <div className="vq-section-head vq-reveal"><h2 className="vq-display">Straight answers.</h2></div>
    <div className="vq-faq vq-reveal">
      <div className="vq-faq__item">
        <button className="vq-faq__q" type="button" aria-expanded="false">Do you have SOC 2 or ISO 27001?<span className="vq-faq__sign"></span></button>
        <div className="vq-faq__a"><div><p>No, and we are not going to imply otherwise on a marketing page. Those are audits of a company, and VenQore is a small, self-funded one. What we can show you is the architecture on this page and the checks the ledger runs against itself, which you can read about on the Core Ledger page. If a certification is a hard requirement for you, tell us and we will say plainly where we are rather than waste your evaluation cycle.</p></div></div>
      </div>
      <div className="vq-faq__item">
        <button className="vq-faq__q" type="button" aria-expanded="false">Can VenQore staff see my numbers?<span className="vq-faq__sign"></span></button>
        <div className="vq-faq__a"><div><p>Platform administration is a separate role behind its own gate, and support access to a workspace runs through an impersonation guard rather than a shared login. We do not browse tenant data casually, and we do not pool your figures into anything. The shared product catalogue — the one feature that draws on what tenants type — uses product names only, never your pricing, and it is opt-in with an unticked box at signup.</p></div></div>
      </div>
      <div className="vq-faq__item">
        <button className="vq-faq__q" type="button" aria-expanded="false">Where does my data live?<span className="vq-faq__sign"></span></button>
        <div className="vq-faq__a"><div><p>On our hosting, in one database, separated by the tenant scope described above rather than by one database per customer. If you need a dedicated or regional deployment, that is a conversation rather than a checkbox — ask us.</p></div></div>
      </div>
      <div className="vq-faq__item">
        <button className="vq-faq__q" type="button" aria-expanded="false">What happens to a photo I send to SmartCapture?<span className="vq-faq__sign"></span></button>
        <div className="vq-faq__a"><div><p>It is sent to a model provider to be read, and what comes back is a draft transaction you approve or discard. You can also connect your own provider key, in which case you are dealing with that provider directly and we do not sit in the middle of it.</p></div></div>
      </div>
      <div className="vq-faq__item">
        <button className="vq-faq__q" type="button" aria-expanded="false">Does the AI decide what my numbers say?<span className="vq-faq__sign"></span></button>
        <div className="vq-faq__a"><div><p>No. The AI configures the system — which modules you have, what things are called, how a screen is laid out. Every figure is computed by the ledger and the calculation core, which are ordinary deterministic code. A model never writes a number into your books.</p></div></div>
      </div>
      <div className="vq-faq__item">
        <button className="vq-faq__q" type="button" aria-expanded="false">How do I report a vulnerability?<span className="vq-faq__sign"></span></button>
        <div className="vq-faq__a"><div><p>Use the contact form and say it is a security report — it reaches a person, not a queue. We would rather hear it from you than from a customer. Tell us what you found and how you found it, and we will confirm receipt and tell you what we are doing about it.</p></div></div>
      </div>
    </div>
    <p className="vq-center vq-small vq-text-2 vq-mt-8 vq-reveal" style={{"maxWidth":"none"}}>
      Something here that does not answer your question? <a href="/contact">Ask us directly →</a>
    </p>
  </div>
</section>


<section className="vq-section vq-section--alt">
  <div className="vq-container">
    <div className="vq-section-head vq-reveal"><span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Keep reading</span><h2 className="vq-h2 vq-mt-4">Related</h2></div>
    <div className="vq-grid vq-grid--3"><a className="vq-card vq-card--interactive vq-reveal" href="/ledger"><h3 className="vq-h3">How the ledger proves itself</h3><p className="vq-tile__body vq-mt-3">Seven independent correctness checks.</p><span className="vq-link vq-mt-4">Read on <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a><a className="vq-card vq-card--interactive vq-reveal" href="/pricing"><h3 className="vq-h3">What each plan includes</h3><p className="vq-tile__body vq-mt-3">Every plan carries the whole system.</p><span className="vq-link vq-mt-4">Read on <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a><a className="vq-card vq-card--interactive vq-reveal" href="/docs"><h3 className="vq-h3">Setting up roles and access</h3><p className="vq-tile__body vq-mt-3">Guides, screen by screen.</p><span className="vq-link vq-mt-4">Read on <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a></div>
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
