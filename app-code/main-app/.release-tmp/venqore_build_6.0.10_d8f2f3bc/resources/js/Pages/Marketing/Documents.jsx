import React, { useEffect } from 'react';
import { useTheme } from '@/Contexts/ThemeContext';
import { Head, Link, usePage } from '@inertiajs/react';
import SiteHeader from '@/Components/Site/SiteHeader';
import SiteFooter from '@/Components/Site/SiteFooter';
import CookieConsent from '@/Components/CookieConsent';

export default function Documents() {
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



  <SiteHeader />

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
        <div className="vq-demo__url"><svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> www.venqore.com/documents</div>
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

  <SiteFooter />
  <CookieConsent />





{/*  Privacy-first cookieless analytics  */}


            </div>
        </>
    );
}
