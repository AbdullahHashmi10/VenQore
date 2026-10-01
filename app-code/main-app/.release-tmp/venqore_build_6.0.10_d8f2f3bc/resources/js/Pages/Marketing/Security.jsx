import React, { useEffect } from 'react';
import { useTheme } from '@/Contexts/ThemeContext';
import { Head, Link, usePage } from '@inertiajs/react';
import SiteHeader from '@/Components/Site/SiteHeader';
import SiteFooter from '@/Components/Site/SiteFooter';
import CookieConsent from '@/Components/CookieConsent';

export default function Security() {
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



  <SiteHeader />

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


  <SiteFooter />
  <CookieConsent />





{/*  Privacy-first cookieless analytics  */}


            </div>
        </>
    );
}
