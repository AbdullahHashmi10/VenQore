import React, { useEffect } from 'react';
import { useTheme } from '@/Contexts/ThemeContext';
import { Head, Link, usePage } from '@inertiajs/react';
import SiteHeader from '@/Components/Site/SiteHeader';
import SiteFooter from '@/Components/Site/SiteFooter';
import CookieConsent from '@/Components/CookieConsent';

export default function VenSynQ() {
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
                <title>VenSynQ — sell in five places, count stock once | VenQore</title>
                <meta name="description" content="One catalogue behind your counter, your web store, WooCommerce, Amazon and eBay. Real-time webhooks and a channel margin that is the real one." />
                <link rel="canonical" href="https://venqore.com/vensynq" />
                <meta property="og:title" content="VenSynQ — sell in five places, count stock once | VenQore" />
                <meta property="og:description" content="One catalogue behind your counter, your web store, WooCommerce, Amazon and eBay. Real-time webhooks and a channel margin that is the real one." />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://venqore.com/vensynq" />
                <meta property="og:image" content="https://venqore.com/images/og/venqore-og.png" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="VenSynQ — sell in five places, count stock once | VenQore" />
                <meta name="twitter:description" content="One catalogue behind your counter, your web store, WooCommerce, Amazon and eBay. Real-time webhooks and a channel margin that is the real one." />
                <meta name="twitter:image" content="https://venqore.com/images/og/venqore-og.png" />
            </Head>

            <div className="vq-site vq-app-body" style={{ background: 'var(--vq-bg)', color: 'var(--vq-text)', overflow: 'visible', minHeight: '100vh' }}>



  <SiteHeader />

<main id="main">

<section className="vq-section" style={{"paddingTop":"clamp(140px,15vw,200px)","paddingBottom":"clamp(48px,6vw,72px)"}}>
  <div className="vq-amb"><span className="vq-amb__aurora" style={{"opacity":".30"}}></span></div>
  <div className="vq-container" style={{"position":"relative"}}>
    <div style={{"maxWidth":"820px"}}>
      <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">VenSynQ</span>
      <h1 className="vq-display vq-mt-4">Sell in five places. Count your stock <em className="vq-italic">once</em>.</h1>
      <p className="vq-lede vq-mt-6">VenSynQ is VenQore's multi-channel inventory sync. One product catalogue and one ledger stay in step across your counter, your web store, WooCommerce, Amazon, eBay and TikTok Shop, so selling the last unit in one place removes it everywhere. Sold as an add-on at $10 per connected account per month.</p>
      <div className="vq-row vq-wrap vq-gap-3 vq-mt-8"><a className="vq-btn vq-btn--primary vq-btn--lg" href="/build-workspace">Start building <span className="vq-btn__arrow"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a>
        <a className="vq-btn vq-btn--secondary vq-btn--lg" href="/pricing">Channel pricing</a></div>
    </div>
  </div>
</section>

<section className="vq-section" style={{"paddingTop":"0"}}>
  <div className="vq-container">
    <div className="vq-card vq-card--xl vq-reveal">
      <div className="vq-grid vq-grid--2" style={{"gap":"var(--vq-space-10)","alignItems":"center"}}>
        <div>
          <span className="vq-eyebrow vq-eyebrow--accent">The failure this prevents</span>
          <h2 className="vq-h2 vq-mt-3">Overselling is a refund, a bad review and a customer you do not get back.</h2>
          <p className="vq-tile__body vq-mt-4">The last unit sells at the counter and on your website in the same minute,
            because the two systems reconcile overnight. VenSynQ has one stock number and every channel reads it —
            so the second sale is refused, not apologised for.</p>
        </div>
        <div><div className="vq-chart" style={{"height":"110px"}}>
    <svg viewBox="0 0 340 110" preserveAspectRatio="none" role="img" aria-label="Trend, last 12 periods">
      <defs><linearGradient id="vqFade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="var(--vq-series-1-ink)" stopOpacity=".22"/>
        <stop offset="100%" stopColor="var(--vq-series-1-ink)" stopOpacity="0"/>
      </linearGradient></defs>
      <path className="area" d="M0.0 107.0 L30.9 95.9 L61.8 101.4 L92.7 81.0 L123.6 86.6 L154.5 66.1 L185.5 71.7 L216.4 45.7 L247.3 51.3 L278.2 25.3 L309.1 30.9 L340.0 3.0 L340 110 L0 110 Z"/><path className="line" d="M0.0 107.0 L30.9 95.9 L61.8 101.4 L92.7 81.0 L123.6 86.6 L154.5 66.1 L185.5 71.7 L216.4 45.7 L247.3 51.3 L278.2 25.3 L309.1 30.9 L340.0 3.0"/>
    </svg></div></div>
      </div>
    </div>
  </div>
</section>

<section className="vq-section vq-section--alt">
  <div className="vq-container">
    <div className="vq-section-head vq-reveal">
      <span className="vq-eyebrow">What is connected</span>
      <h2 className="vq-display">Five channels, one catalogue.</h2>
    </div>
    <div className="vq-grid vq-grid--3">
      
      <article className="vq-card vq-card--xl vq-tile vq-reveal">
        <div className="vq-row" style={{"justifyContent":"space-between"}}>
          <span className="vq-tile__icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2 2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7"/></svg></span>
          <span className="vq-badge vq-badge--success"><svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg> Live</span>
        </div>
        <h3 className="vq-tile__title">Your counter</h3>
        <p className="vq-tile__body">The register is a channel like any other. A sale at the till moves the same stock number a website order does.</p>
      </article>
      <article className="vq-card vq-card--xl vq-tile vq-reveal">
        <div className="vq-row" style={{"justifyContent":"space-between"}}>
          <span className="vq-tile__icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg></span>
          <span className="vq-badge vq-badge--success"><svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg> Live</span>
        </div>
        <h3 className="vq-tile__title">Your web store</h3>
        <p className="vq-tile__body">Catalogue controls, per-channel pricing, and a QR menu for anyone who wants to browse before they buy.</p>
      </article>
      <article className="vq-card vq-card--xl vq-tile vq-reveal">
        <div className="vq-row" style={{"justifyContent":"space-between"}}>
          <span className="vq-tile__icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"/></svg></span>
          <span className="vq-badge vq-badge--success"><svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg> Live</span>
        </div>
        <h3 className="vq-tile__title">WooCommerce</h3>
        <p className="vq-tile__body">Three-click OAuth, real-time webhooks, two-way stock, and customers registered into your book automatically.</p>
      </article>
      <article className="vq-card vq-card--xl vq-tile vq-reveal">
        <div className="vq-row" style={{"justifyContent":"space-between"}}>
          <span className="vq-tile__icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg></span>
          <span className="vq-badge vq-badge--success"><svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg> Live</span>
        </div>
        <h3 className="vq-tile__title">Amazon</h3>
        <p className="vq-tile__body">SP-API approved. Orders in as sales, bulk tracking IDs out, commission isolated from your margin.</p>
      </article>
      <article className="vq-card vq-card--xl vq-tile vq-reveal">
        <div className="vq-row" style={{"justifyContent":"space-between"}}>
          <span className="vq-tile__icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg></span>
          <span className="vq-badge vq-badge--soon">Coming</span>
        </div>
        <h3 className="vq-tile__title">eBay</h3>
        <p className="vq-tile__body">Listing and order sync, on the same catalogue and the same stock number.</p>
      </article>
      <article className="vq-card vq-card--xl vq-tile vq-reveal">
        <div className="vq-row" style={{"justifyContent":"space-between"}}>
          <span className="vq-tile__icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 6V2H8"/><rect width="16" height="12" x="4" y="6" rx="2"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="M15 11v2"/><path d="M9 11v2"/></svg></span>
          <span className="vq-badge vq-badge--soon">Coming</span>
        </div>
        <h3 className="vq-tile__title">TikTok Shop</h3>
        <p className="vq-tile__body">Same model again — one catalogue, one stock number, isolated commission.</p>
      </article>
    </div>
  </div>
</section>

<section className="vq-section vq-band-dark">
  <div className="vq-amb"><span className="vq-amb__beams"><i></i><i></i><i></i></span><span className="vq-amb__grain"></span></div>
  <div className="vq-container" style={{"position":"relative"}}>
    <div className="vq-section-head vq-reveal" style={{"maxWidth":"800px"}}>
      <span className="vq-eyebrow">The number that actually matters</span>
      <h2 className="vq-display">Your marketplace margin is not your shop margin.</h2>
      <p className="vq-lede">A 15% commission, a referral fee, a fulfilment charge and a returned unit are the difference
        between a channel you should grow and a channel you should close. Most systems book the gross and let you
        find out at the end of the quarter.</p>
    </div>
    <div className="vq-grid vq-grid--2">
      
      <div className="vq-card vq-card--xl vq-reveal">
        <h3 className="vq-h3" style={{"color":"#fff"}}>Commission is isolated, per channel</h3>
        <p className="vq-tile__body vq-mt-3">It posts to its own account, not into cost of goods. Your item margin stays the item margin, and your channel cost is a line you can look at on its own.</p>
      </div>
      <div className="vq-card vq-card--xl vq-reveal">
        <h3 className="vq-h3" style={{"color":"#fff"}}>Fees follow the order that caused them</h3>
        <p className="vq-tile__body vq-mt-3">Referral, fulfilment, storage and return handling attach to the sale they came from — so channel profitability is a real figure, not an allocation.</p>
      </div>
      <div className="vq-card vq-card--xl vq-reveal">
        <h3 className="vq-h3" style={{"color":"#fff"}}>Just-in-time purchase orders</h3>
        <p className="vq-tile__body vq-mt-3">A channel order for something you do not hold raises the purchase order against the supplier who stocks it, with the lead time already known.</p>
      </div>
      <div className="vq-card vq-card--xl vq-reveal">
        <h3 className="vq-h3" style={{"color":"#fff"}}>One place to look</h3>
        <p className="vq-tile__body vq-mt-3">Sales by channel, spend by channel and margin by channel, over any of the eighteen period windows, against the right comparison.</p>
      </div>
    </div>
  </div>
</section>

<section className="vq-section">
  <div className="vq-container">
    <div className="vq-section-head vq-reveal">
      <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Setup</span>
      <h2 className="vq-display">Three clicks, then it runs.</h2>
    </div>
    <div className="vq-steps-big">
      
      <div className="vq-bigstep vq-reveal">
        <h3 className="vq-h3">Connect</h3>
        <p className="vq-tile__body vq-mt-3">OAuth into the channel. No API keys to copy, no plugin to install on your store, no developer to hire for an afternoon.</p>
      </div>
      <div className="vq-bigstep vq-reveal">
        <h3 className="vq-h3">Map once</h3>
        <p className="vq-tile__body vq-mt-3">Match your catalogue to the listings you already have. Anything unmatched is shown, never guessed — you decide whether it is a new product or the same one under another name.</p>
      </div>
      <div className="vq-bigstep vq-reveal">
        <h3 className="vq-h3">Sell</h3>
        <p className="vq-tile__body vq-mt-3">Stock, prices and orders move both ways from that moment. A webhook, not a nightly job, so the gap where overselling happens does not exist.</p>
      </div>
    </div>
    <div className="vq-card vq-card--xl vq-mt-12 vq-reveal">
      <div className="vq-row vq-wrap vq-gap-6" style={{"justifyContent":"space-between","alignItems":"center"}}>
        <div>
          <span className="vq-eyebrow vq-eyebrow--accent">Priced per channel</span>
          <p className="vq-h3 vq-mt-2">$10 a month per connected store. Nothing for the one you already have.</p>
          <p className="vq-caption vq-mt-2" style={{"maxWidth":"none"}}>Your counter and your own web store are included in every plan.
            You pay for a marketplace only while you are selling on it.</p>
        </div>
        <a className="vq-btn vq-btn--primary vq-btn--lg" href="/pricing">See pricing <span className="vq-btn__arrow"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a>
      </div>
    </div>
  </div>
</section>

<section className="vq-section vq-section--alt">
  <div className="vq-container">
    <div className="vq-section-head vq-reveal"><span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Keep reading</span><h2 className="vq-h2 vq-mt-4">Selling in more than one place</h2></div>
    <div className="vq-grid vq-grid--3"><a className="vq-card vq-card--interactive vq-reveal" href="/pricing"><h3 className="vq-h3">What channel sync costs</h3><p className="vq-tile__body vq-mt-3">$10 per connected account, at every tier.</p><span className="vq-link vq-mt-4">Read on <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a><a className="vq-card vq-card--interactive vq-reveal" href="/solutions/multi-store"><h3 className="vq-h3">Running more than one branch</h3><p className="vq-tile__body vq-mt-3">One truth across every location.</p><span className="vq-link vq-mt-4">Read on <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a><a className="vq-card vq-card--interactive vq-reveal" href="/documents"><h3 className="vq-h3">Orders become documents</h3><p className="vq-tile__body vq-mt-3">Same editor, same ledger.</p><span className="vq-link vq-mt-4">Read on <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a></div>
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
