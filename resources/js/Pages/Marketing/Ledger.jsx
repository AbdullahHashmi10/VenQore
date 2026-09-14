import React, { useEffect } from 'react';
import { useTheme } from '@/Contexts/ThemeContext';
import { Head, Link, usePage } from '@inertiajs/react';
import SiteHeader from '@/Components/Site/SiteHeader';
import SiteFooter from '@/Components/Site/SiteFooter';
import CookieConsent from '@/Components/CookieConsent';

export default function Ledger() {
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
                <title>Core Ledger — double-entry under every module | VenQore</title>
                <meta name="description" content="One double-entry engine under sales, purchases, stock and expenses, with seven correctness checks on every release. The AI never decides your numbers." />
                <link rel="canonical" href="https://venqore.com/ledger" />
                <meta property="og:title" content="Core Ledger — double-entry under every module | VenQore" />
                <meta property="og:description" content="One double-entry engine under sales, purchases, stock and expenses, with seven correctness checks on every release. The AI never decides your numbers." />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://venqore.com/ledger" />
                <meta property="og:image" content="https://venqore.com/images/og/venqore-og.png" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Core Ledger — double-entry under every module | VenQore" />
                <meta name="twitter:description" content="One double-entry engine under sales, purchases, stock and expenses, with seven correctness checks on every release. The AI never decides your numbers." />
                <meta name="twitter:image" content="https://venqore.com/images/og/venqore-og.png" />
            </Head>

            <div className="vq-site vq-app-body" style={{ background: 'var(--vq-bg)', color: 'var(--vq-text)', overflow: 'visible', minHeight: '100vh' }}>



  <SiteHeader />

<main id="main">

<section className="vq-section" style={{"paddingTop":"clamp(140px,15vw,200px)","paddingBottom":"clamp(48px,6vw,72px)"}}>
  <div className="vq-amb"><span className="vq-amb__grid"></span></div>
  <div className="vq-container" style={{"position":"relative"}}>
    <div style={{"maxWidth":"820px"}}>
      <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Core Ledger</span>
      <h1 className="vq-display vq-mt-4">The one part of VenQore the AI can't <em className="vq-italic">touch</em>.</h1>
      <p className="vq-lede vq-mt-6">Core Ledger is VenQore's double-entry accounting engine. Every sale, purchase, return, payment and expense writes a balanced journal entry automatically, so the trial balance, profit and loss and balance sheet come from the same postings your POS produced. The AI configures the system around it; it never decides what your numbers say.</p>
      <div className="vq-row vq-wrap vq-gap-3 vq-mt-8"><a className="vq-btn vq-btn--primary vq-btn--lg" href="/build-workspace">Start building <span className="vq-btn__arrow"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a>
        <a className="vq-btn vq-btn--secondary vq-btn--lg" href="/features#money">See the money modules</a></div>
    </div>
  </div>
</section>

<section className="vq-section" style={{"paddingTop":"var(--vq-space-8)"}}>
  <div className="vq-container">
    <div className="vq-grid vq-grid--3">
      <div className="vq-card vq-card--xl vq-card--accent vq-stat vq-reveal">
        <span className="vq-stat__label">Correctness checks</span>
        <span className="vq-stat__value">7<span className="vq-stat__unit">/ 7 passing</span></span>
        <span className="vq-stat__note">Run on every release, not once at launch</span>
      </div>
      <div className="vq-card vq-card--xl vq-tile vq-reveal">
        <span className="vq-tile__icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/><path d="M9 7h6"/><path d="M9 11h4"/></svg></span>
        <h3 className="vq-tile__title">One engine, every module</h3>
        <p className="vq-tile__body">There is no second version of the truth to reconcile, because there is no second version.</p>
      </div>
      <div className="vq-card vq-card--xl vq-tile vq-reveal">
        <span className="vq-tile__icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg></span>
        <h3 className="vq-tile__title">Auditable by design</h3>
        <p className="vq-tile__body">Every posting traces to the document, the user and the timestamp. Your accountant can follow the trail without asking you a single question.</p>
      </div>
    </div>
  </div>
</section>

<section className="vq-section vq-section--alt">
  <div className="vq-container">
    <div className="vq-section-head vq-reveal">
      <span className="vq-eyebrow">The seven checks</span>
      <h2 className="vq-display">We'd rather publish the check than ask you to trust it.</h2>
      <p className="vq-lede">These are the seven independent correctness tests the ledger runs against
        itself. All seven currently pass. When one fails, the release does not ship.</p>
    </div>
    <div className="vq-table-wrap vq-reveal">
      <table className="vq-table">
        <thead><tr><th style={{"width":"220px"}}>Check</th><th>What it proves</th><th style={{"width":"120px"}}>Status</th></tr></thead>
        <tbody>
        <tr>
          <td className="vq-table__row-head">Balance integrity</td>
          <td className="vq-text-2">Every journal entry nets to zero. Debits equal credits or the transaction does not post — there is no partial write and no override.</td>
          <td><span className="vq-status vq-status--ok"><svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg> Passing</span></td>
        </tr><tr>
          <td className="vq-table__row-head">Cost of goods</td>
          <td className="vq-text-2">FIFO costing follows the batch, variant and location it actually came from. A margin that is right on the invoice is right in the P&amp;L.</td>
          <td><span className="vq-status vq-status--ok"><svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg> Passing</span></td>
        </tr><tr>
          <td className="vq-table__row-head">Tax handling</td>
          <td className="vq-text-2">Inclusive and exclusive rates, per-item overrides, exemptions and the reverse case all resolve to the same figure the return expects.</td>
          <td><span className="vq-status vq-status--ok"><svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg> Passing</span></td>
        </tr><tr>
          <td className="vq-table__row-head">Multi-currency</td>
          <td className="vq-text-2">The rate at the transaction, the rate at settlement and the difference between them all land somewhere explicit.</td>
          <td><span className="vq-status vq-status--ok"><svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg> Passing</span></td>
        </tr><tr>
          <td className="vq-table__row-head">Inter-branch movement</td>
          <td className="vq-text-2">Stock leaving one location and arriving at another is one movement with two sides, not two adjustments that happen to agree.</td>
          <td><span className="vq-status vq-status--ok"><svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg> Passing</span></td>
        </tr><tr>
          <td className="vq-table__row-head">Period closing</td>
          <td className="vq-text-2">A closed period is closed. Postings dated into it are refused, and the closing entries reconcile against the pre-close balances.</td>
          <td><span className="vq-status vq-status--ok"><svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg> Passing</span></td>
        </tr><tr>
          <td className="vq-table__row-head">Reversal integrity</td>
          <td className="vq-text-2">Nothing is edited in place. A correction is a reversal plus a new entry, and both are visible.</td>
          <td><span className="vq-status vq-status--ok"><svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg> Passing</span></td>
        </tr>
        </tbody>
      </table>
    </div>
  </div>
</section>

<section className="vq-section vq-band-dark">
  <div className="vq-amb"><span className="vq-amb__beams"><i></i><i></i><i></i></span><span className="vq-amb__grain"></span></div>
  <div className="vq-container" style={{"position":"relative"}}>
    <div className="vq-section-head vq-reveal">
      <span className="vq-eyebrow">In practice</span>
      <h2 className="vq-display">What that actually means on a Tuesday.</h2>
    </div>
    <div className="vq-grid vq-grid--2">
      
      <div className="vq-card vq-card--xl vq-reveal">
        <h3 className="vq-h3" style={{"color":"#fff"}}>Your P&amp;L is not a report someone generated.</h3>
        <p className="vq-tile__body vq-mt-3">It is the same data your till produced, read from the other end. Nobody assembles it and nobody can quietly adjust it.</p>
      </div>
      <div className="vq-card vq-card--xl vq-reveal">
        <h3 className="vq-h3" style={{"color":"#fff"}}>A stock adjustment moves inventory <em>and</em> posts the cost.</h3>
        <p className="vq-tile__body vq-mt-3">You cannot do half of it. There is no state where the shelf is right and the books are not.</p>
      </div>
      <div className="vq-card vq-card--xl vq-reveal">
        <h3 className="vq-h3" style={{"color":"#fff"}}>Month-end isn't a reconstruction. It's a date range.</h3>
        <p className="vq-tile__body vq-mt-3">Because everything posted when it happened, closing a month is selecting two dates, not rebuilding six weeks of history.</p>
      </div>
      <div className="vq-card vq-card--xl vq-reveal">
        <h3 className="vq-h3" style={{"color":"#fff"}}>Your accountant gets a trial balance that ties, first time.</h3>
        <p className="vq-tile__body vq-mt-3">And a day book, an account ledger and a party statement that agree with it, because they are all the same rows read differently.</p>
      </div>
    </div>
  </div>
</section>

<section className="vq-section">
  <div className="vq-container">
    <div className="vq-grid vq-grid--2" style={{"alignItems":"center","gap":"var(--vq-space-16)"}}>
      <div className="vq-reveal">
        <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">The line</span>
        <h2 className="vq-display vq-mt-4">Flexible where it should be.<br />Rigid where it must be.</h2>
        <p className="vq-lede vq-mt-6">A system that will bend anywhere is a system you cannot trust with
          money. A system that bends nowhere is one you spend six months forcing your business into.
          The whole design of VenQore is the placement of that line.</p>
        <a className="vq-btn vq-btn--primary vq-btn--lg vq-mt-8" href="/blueprint">See what does bend <span className="vq-btn__arrow"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a>
      </div>
      <div className="vq-reveal">
        <div className="vq-card vq-card--xl">
          <span className="vq-eyebrow">A single sale, both sides</span>
          <div className="vq-table-wrap vq-mt-4" style={{"border":"0"}}>
            <table className="vq-table" style={{"minWidth":"0"}}>
              <thead><tr><th>Account</th><th className="num">Debit</th><th className="num">Credit</th></tr></thead>
              <tbody>
                <tr><td>Cash</td><td className="num">4,850</td><td className="num vq-text-3">—</td></tr>
                <tr><td>Sales revenue</td><td className="num vq-text-3">—</td><td className="num">4,220</td></tr>
                <tr><td>Tax payable</td><td className="num vq-text-3">—</td><td className="num">630</td></tr>
                <tr><td>Cost of goods sold</td><td className="num">2,905</td><td className="num vq-text-3">—</td></tr>
                <tr><td>Inventory</td><td className="num vq-text-3">—</td><td className="num">2,905</td></tr>
                <tr style={{"borderTop":"1px solid var(--vq-line)"}}>
                  <td style={{"fontWeight":"var(--vq-fw-semi)"}}>Total</td>
                  <td className="num" style={{"fontWeight":"var(--vq-fw-semi)"}}>7,755</td>
                  <td className="num" style={{"fontWeight":"var(--vq-fw-semi)"}}>7,755</td></tr>
              </tbody>
            </table>
          </div>
          <p className="vq-caption vq-mt-4" style={{"maxWidth":"none"}}>One barcode scan at the counter. Five
            postings, balanced, with the cost taken from the batch that actually left the shelf.</p>
        </div>
      </div>
    </div>
  </div>
</section>

<section className="vq-section vq-section--alt">
  <div className="vq-container">
    <div className="vq-section-head vq-reveal"><span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Keep reading</span><h2 className="vq-h2 vq-mt-4">The rest of the argument</h2></div>
    <div className="vq-grid vq-grid--3"><a className="vq-card vq-card--interactive vq-reveal" href="/reckoner"><h3 className="vq-h3">Where a number is defined</h3><p className="vq-tile__body vq-mt-3">One definition per reading, 18 period windows.</p><span className="vq-link vq-mt-4">Read on <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a><a className="vq-card vq-card--interactive vq-reveal" href="/security"><h3 className="vq-h3">Who can reach your books</h3><p className="vq-tile__body vq-mt-3">Tenant isolation, roles, and an unedited record.</p><span className="vq-link vq-mt-4">Read on <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a><a className="vq-card vq-card--interactive vq-reveal" href="/features/accounting"><h3 className="vq-h3">Double-entry accounting in detail</h3><p className="vq-tile__body vq-mt-3">Journals, trial balance, balance sheet.</p><span className="vq-link vq-mt-4">Read on <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a></div>
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
