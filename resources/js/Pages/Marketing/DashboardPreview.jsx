import React, { useEffect } from 'react';
import { useTheme } from '@/Contexts/ThemeContext';
import { Head, Link, usePage } from '@inertiajs/react';
import SiteHeader from '@/Components/Site/SiteHeader';
import SiteFooter from '@/Components/Site/SiteFooter';
import CookieConsent from '@/Components/CookieConsent';

export default function DashboardPreview() {
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
                <title>The dashboard — 58 readings that assemble themselves | VenQore</title>
                <meta name="description" content="Pick what you want to know; the card sizes itself. 58 readings across five areas, 21 chart types, and three server-side gates on every card." />
                <link rel="canonical" href="https://venqore.com/dashboard-preview" />
                <meta property="og:title" content="The dashboard — 58 readings that assemble themselves | VenQore" />
                <meta property="og:description" content="Pick what you want to know; the card sizes itself. 58 readings across five areas, 21 chart types, and three server-side gates on every card." />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://venqore.com/dashboard-preview" />
                <meta property="og:image" content="https://venqore.com/images/og/venqore-og.png" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="The dashboard — 58 readings that assemble themselves | VenQore" />
                <meta name="twitter:description" content="Pick what you want to know; the card sizes itself. 58 readings across five areas, 21 chart types, and three server-side gates on every card." />
                <meta name="twitter:image" content="https://venqore.com/images/og/venqore-og.png" />
            </Head>

            <div className="vq-site vq-app-body" style={{ background: 'var(--vq-bg)', color: 'var(--vq-text)', overflow: 'visible', minHeight: '100vh' }}>



  <SiteHeader />

<main id="main">

<section className="vq-section" style={{"paddingTop":"clamp(140px,15vw,200px)","paddingBottom":"clamp(48px,6vw,72px)"}}>
  <div className="vq-amb"><span className="vq-amb__aurora" style={{"opacity":".30"}}></span></div>
  <div className="vq-container" style={{"position":"relative"}}>
    <div style={{"maxWidth":"820px"}}>
      <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">The dashboard</span>
      <h1 className="vq-display vq-mt-4">Your dashboard is <em className="vq-italic">assembled</em>, not chosen.</h1>
      <p className="vq-lede vq-mt-6">58 readings, five areas, twenty-one chart types and eighteen size fits. You pick what you want to know — never what shape it should be — and the card works out the smallest size it can be read at.</p>
      <div className="vq-row vq-wrap vq-gap-3 vq-mt-8"><a className="vq-btn vq-btn--primary vq-btn--lg" href="/build-workspace">Start building <span className="vq-btn__arrow"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a>
        <a className="vq-btn vq-btn--secondary vq-btn--lg" href="/reckoner">Where the numbers come from</a></div>
    </div>
  </div>
</section>

<section className="vq-section" style={{"paddingTop":"0"}}>
  <div className="vq-container vq-container--wide">
    <div className="vq-demo vq-reveal" data-builder>
      <div className="vq-demo__bar">
        <div className="vq-demo__dots"><i></i><i></i><i></i></div>
        <div className="vq-demo__url"><svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> www.venqore.com/dashboard</div>
        <span className="vq-demo__live">Live · try it</span>
      </div>
      <div className="vq-build">
        <div className="vq-build__board" data-builder-board></div>
        <div className="vq-build__lib">
          <div className="vq-row" style={{"justifyContent":"space-between","marginBottom":"var(--vq-space-3)"}}>
            <span className="vq-eyebrow vq-eyebrow--accent">Add a reading</span>
            <span className="vq-caption vq-num" data-builder-count></span>
          </div>
          <div className="vq-build__search"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg> Search 58 readings…</div>
          <div className="vq-build__list" data-builder-list></div>
        </div>
      </div>
    </div>
    <p className="vq-caption vq-center vq-mt-4" style={{"maxWidth":"none"}}>
      A sample of the registry. Tap a reading to put it on the board — the card picks its own size, and the headline metric takes the accent fill.
    </p>
  </div>
</section>

<section className="vq-section vq-section--alt">
  <div className="vq-container">
    <div className="vq-section-head vq-reveal">
      <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">58 readings</span>
      <h2 className="vq-display">Everything a trading business is judged by.</h2>
      <p className="vq-lede">Grouped by the part of the business it belongs to, not by which screen it happens to live on.</p>
    </div>
    <div className="vq-grid vq-grid--2">
      
      <article className="vq-card vq-card--xl vq-reveal vq-card--accent">
        <div className="vq-row" style={{"justifyContent":"space-between","alignItems":"baseline"}}>
          <h3 className="vq-h3">Sales</h3>
          <span className="vq-stat__value vq-stat__value--sm" style={{"fontSize":"26px"}}>32</span>
        </div>
        <p className="vq-tile__body vq-mt-3">Revenue, payment split, top products, top customers, basket size, discount given, return rate, funnel, by hour and day, by channel, by region, live feed…</p>
      </article>
      <article className="vq-card vq-card--xl vq-reveal">
        <div className="vq-row" style={{"justifyContent":"space-between","alignItems":"baseline"}}>
          <h3 className="vq-h3">Finance</h3>
          <span className="vq-stat__value vq-stat__value--sm" style={{"fontSize":"26px"}}>28</span>
        </div>
        <p className="vq-tile__body vq-mt-3">Profit trend, cash in vs out, receivables ageing, books balanced, cash runway, days sales outstanding, days payable outstanding, quick ratio, expense ratio, tax liability…</p>
      </article>
      <article className="vq-card vq-card--xl vq-reveal">
        <div className="vq-row" style={{"justifyContent":"space-between","alignItems":"baseline"}}>
          <h3 className="vq-h3">Inventory</h3>
          <span className="vq-stat__value vq-stat__value--sm" style={{"fontSize":"26px"}}>26</span>
        </div>
        <p className="vq-tile__body vq-mt-3">Stock value, low stock, out of stock, turnover, days of cover, sell-through, dead stock, expiring in 30 days, batch tracking, serial lifecycle, stock by warehouse…</p>
      </article>
      <article className="vq-card vq-card--xl vq-reveal">
        <div className="vq-row" style={{"justifyContent":"space-between","alignItems":"baseline"}}>
          <h3 className="vq-h3">Purchasing</h3>
          <span className="vq-stat__value vq-stat__value--sm" style={{"fontSize":"26px"}}>11</span>
        </div>
        <p className="vq-tile__body vq-mt-3">Spend trend, spend by supplier, supplier concentration, average lead time, on-time delivery, purchase orders pending and received, debit notes and open credits.</p>
      </article>
      <article className="vq-card vq-card--xl vq-reveal">
        <div className="vq-row" style={{"justifyContent":"space-between","alignItems":"baseline"}}>
          <h3 className="vq-h3">Operations</h3>
          <span className="vq-stat__value vq-stat__value--sm" style={{"fontSize":"26px"}}>11</span>
        </div>
        <p className="vq-tile__body vq-mt-3">Staff present and absent, hours today, attendance rate, sales per staff member, new vs returning, customer retention, open tickets, plan usage.</p>
      </article>
      <article className="vq-card vq-card--xl vq-reveal">
        <h3 className="vq-h3">And the multiplier</h3>
        <p className="vq-tile__body vq-mt-3">Every reading resolves over eighteen period windows, most with a comparison window behind it.
          That is <b style={{"color":"var(--vq-text)"}}>1,944 distinct figures</b> before anyone picks a chart type or a size.</p>
        <a className="vq-link vq-mt-4" href="/reckoner">How the periods work <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></a>
      </article>
    </div>
  </div>
</section>

<section className="vq-section">
  <div className="vq-container">
    <div className="vq-section-head vq-reveal">
      <span className="vq-eyebrow">The rule that makes it work</span>
      <h2 className="vq-display">No card can clip its own content.</h2>
      <p className="vq-lede">Every card declares the smallest size it can still be read at. Sizes below that floor are not
        offered — they render disabled with the reason. A bar chart cannot be placed in a tile, and a tile is not
        allowed to pretend it is a chart.</p>
    </div>
    <div className="vq-table-wrap vq-reveal">
      <table className="vq-table">
        <thead><tr><th style={{"width":"90px"}}>Category</th><th style={{"width":"120px"}}>Name</th><th>Holds</th><th>Legal fits (columns × rows)</th></tr></thead>
        <tbody>
        <tr><td className="vq-table__row-head vq-num">C1</td><td>Tile</td>
          <td className="vq-text-2">A single glyph and a number. No chart host at all.</td><td className="vq-num vq-text-2">2×1 · 1×1</td></tr><tr><td className="vq-table__row-head vq-num">C2</td><td>Strip</td>
          <td className="vq-text-2">One KPI on one line — label left, value right.</td><td className="vq-num vq-text-2">4×1 · 3×2</td></tr><tr><td className="vq-table__row-head vq-num">C3</td><td>Metric</td>
          <td className="vq-text-2">A KPI with a delta, a sparkline or a comparison.</td><td className="vq-num vq-text-2">4×3 · 3×2 · 2×2 · 2×3</td></tr><tr><td className="vq-table__row-head vq-num">C4</td><td>Panel</td>
          <td className="vq-text-2">A ranked list, a breakdown, a small chart, a table excerpt.</td><td className="vq-num vq-text-2">4×4 · 3×4 · 3×5 · 2×6</td></tr><tr><td className="vq-table__row-head vq-num">C5</td><td>Board</td>
          <td className="vq-text-2">A full chart, multi-series, a wide table.</td><td className="vq-num vq-text-2">6×6 · 5×7 · 4×8</td></tr><tr><td className="vq-table__row-head vq-num">C6</td><td>Canvas</td>
          <td className="vq-text-2">A hero chart, a P&amp;L, a cohort grid, a map.</td><td className="vq-num vq-text-2">8×8 · 6×10 · 4×12</td></tr>
        </tbody>
      </table>
    </div>
    <div className="vq-grid vq-grid--4 vq-mt-10">
      
      <div className="vq-reveal"><h3 className="vq-small" style={{"fontWeight":"var(--vq-fw-semi)"}}>18 fits, all verified</h3>
      <p className="vq-caption vq-mt-2" style={{"maxWidth":"none"}}>18 of 18 render at exact geometry, with zero ladder mismatches across 292 catalogue cards and all ten roles.</p></div>
      <div className="vq-reveal"><h3 className="vq-small" style={{"fontWeight":"var(--vq-fw-semi)"}}>A card widens before it degrades</h3>
      <p className="vq-caption vq-mt-2" style={{"maxWidth":"none"}}>It only drops to a leaner fit when widening is exhausted — and then it re-lays its inside rather than shrinking the type.</p></div>
      <div className="vq-reveal"><h3 className="vq-small" style={{"fontWeight":"var(--vq-fw-semi)"}}>Numbers step down, never clip</h3>
      <p className="vq-caption vq-mt-2" style={{"maxWidth":"none"}}>Currency drops first, then decimals, then magnitude. The exact value is always one hover away.</p></div>
      <div className="vq-reveal"><h3 className="vq-small" style={{"fontWeight":"var(--vq-fw-semi)"}}>Exactly one filled card</h3>
      <p className="vq-caption vq-mt-2" style={{"maxWidth":"none"}}>One card on the board carries the accent fill, and it is the headline metric. Two is a fail. Zero is a fail.</p></div>
    </div>
  </div>
</section>

<section className="vq-section vq-band-dark">
  <div className="vq-amb"><span className="vq-amb__beams"><i></i><i></i><i></i></span><span className="vq-amb__grain"></span></div>
  <div className="vq-container" style={{"position":"relative"}}>
    <div className="vq-grid vq-grid--2" style={{"gap":"var(--vq-space-16)"}}>
      <div className="vq-reveal">
        <span className="vq-eyebrow">Who sees what</span>
        <h2 className="vq-display vq-mt-4">A cashier is never offered the P&amp;L.</h2>
        <p className="vq-lede vq-mt-6">Three independent gates decide whether a card is even in the picker, and all three are
          enforced on the server. A card you are not entitled to does not render blank — it is not there.</p>
        <ul className="vq-stack vq-gap-5 vq-mt-8">
          <li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
            <span style={{"color":"var(--vq-teal-300)","flex":"none","marginTop":"2px"}}><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
            <div><b className="vq-body" style={{"color":"#fff","fontWeight":"var(--vq-fw-semi)"}}>Permission</b>
            <p className="vq-small vq-mt-1" style={{"maxWidth":"none"}}>Your role. A cashier sees eight cards; a store owner sees eighty-five.</p></div></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
            <span style={{"color":"var(--vq-teal-300)","flex":"none","marginTop":"2px"}}><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
            <div><b className="vq-body" style={{"color":"#fff","fontWeight":"var(--vq-fw-semi)"}}>Plan feature</b>
            <p className="vq-small vq-mt-1" style={{"maxWidth":"none"}}>Production, stock valuation and channel cards appear when your plan includes them.</p></div></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
            <span style={{"color":"var(--vq-teal-300)","flex":"none","marginTop":"2px"}}><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
            <div><b className="vq-body" style={{"color":"#fff","fontWeight":"var(--vq-fw-semi)"}}>Capability</b>
            <p className="vq-small vq-mt-1" style={{"maxWidth":"none"}}>A cached probe of what your business actually records. No products yet means no stock cards — not empty ones.</p></div></li>
        </ul>
        <p className="vq-small vq-mt-8" style={{"maxWidth":"52ch"}}>
          A metric that fails any gate executes zero database queries. And a card the platform knows cannot work is never
          offered at all — an option that always renders "not available" is worse than an option that does not exist.
        </p>
      </div>
      <div className="vq-reveal">
        <div className="vq-card vq-card--xl">
          <span className="vq-eyebrow">Cards visible, by role</span>
          <div className="vq-rank vq-mt-5">
            <div className="vq-rank__row"><span className="vq-rank__name">Store owner</span>
                <span className="vq-rank__val">85</span>
                <span className="vq-rank__track"><span className="vq-rank__fill" style={{"--w":"100%","width":"100%"}}></span></span></div><div className="vq-rank__row"><span className="vq-rank__name">General manager</span>
                <span className="vq-rank__val">78</span>
                <span className="vq-rank__track"><span className="vq-rank__fill" style={{"--w":"92%","width":"92%"}}></span></span></div><div className="vq-rank__row"><span className="vq-rank__name">Internal accountant</span>
                <span className="vq-rank__val">36</span>
                <span className="vq-rank__track"><span className="vq-rank__fill" style={{"--w":"42%","width":"42%"}}></span></span></div><div className="vq-rank__row"><span className="vq-rank__name">Inventory manager</span>
                <span className="vq-rank__val">26</span>
                <span className="vq-rank__track"><span className="vq-rank__fill" style={{"--w":"31%","width":"31%"}}></span></span></div><div className="vq-rank__row"><span className="vq-rank__name">External auditor</span>
                <span className="vq-rank__val">25</span>
                <span className="vq-rank__track"><span className="vq-rank__fill" style={{"--w":"29%","width":"29%"}}></span></span></div><div className="vq-rank__row"><span className="vq-rank__name">Shift manager</span>
                <span className="vq-rank__val">19</span>
                <span className="vq-rank__track"><span className="vq-rank__fill" style={{"--w":"22%","width":"22%"}}></span></span></div><div className="vq-rank__row"><span className="vq-rank__name">Cashier</span>
                <span className="vq-rank__val">8</span>
                <span className="vq-rank__track"><span className="vq-rank__fill" style={{"--w":"9%","width":"9%"}}></span></span></div><div className="vq-rank__row"><span className="vq-rank__name">Purchasing agent</span>
                <span className="vq-rank__val">7</span>
                <span className="vq-rank__track"><span className="vq-rank__fill" style={{"--w":"8%","width":"8%"}}></span></span></div>
          </div>
          <p className="vq-caption vq-mt-6" style={{"maxWidth":"none"}}>Ten roles ship out of the box. 292 card placements across
            all of them, and every one of those placements is checked before it renders.</p>
        </div>
      </div>
    </div>
  </div>
</section>

<section className="vq-section vq-section--alt">
  <div className="vq-container">
    <div className="vq-section-head vq-reveal"><span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Keep reading</span><h2 className="vq-h2 vq-mt-4">Behind the cards</h2></div>
    <div className="vq-grid vq-grid--3"><a className="vq-card vq-card--interactive vq-reveal" href="/reckoner"><h3 className="vq-h3">One place a number can be defined</h3><p className="vq-tile__body vq-mt-3">So the dashboard and the P&amp;L cannot disagree.</p><span className="vq-link vq-mt-4">Read on <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a><a className="vq-card vq-card--interactive vq-reveal" href="/blueprint"><h3 className="vq-h3">How your card set was chosen</h3><p className="vq-tile__body vq-mt-3">Describe the business; the modules follow.</p><span className="vq-link vq-mt-4">Read on <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a><a className="vq-card vq-card--interactive vq-reveal" href="/features"><h3 className="vq-h3">Everything that ships today</h3><p className="vq-tile__body vq-mt-3">140+ modules, 13 document types, 40 reports.</p><span className="vq-link vq-mt-4">Read on <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a></div>
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
