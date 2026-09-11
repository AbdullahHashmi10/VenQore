import React, { useEffect } from 'react';
import { useTheme } from '@/Contexts/ThemeContext';
import { Head, Link, usePage } from '@inertiajs/react';
import SiteHeader from '@/Components/Site/SiteHeader';
import SiteFooter from '@/Components/Site/SiteFooter';
import CookieConsent from '@/Components/CookieConsent';

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



  <SiteHeader />

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

  <SiteFooter />
  <CookieConsent />





{/*  Privacy-first cookieless analytics  */}


            </div>
        </>
    );
}
