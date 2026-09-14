import React, { useEffect } from 'react';
import { useTheme } from '@/Contexts/ThemeContext';
import { Head, Link, usePage } from '@inertiajs/react';
import SiteHeader from '@/Components/Site/SiteHeader';
import SiteFooter from '@/Components/Site/SiteFooter';
import CookieConsent from '@/Components/CookieConsent';

export default function SmartCapture() {
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
                <title>SmartCapture — a photo in, a posted transaction out | VenQore</title>
                <meta name="description" content="Photograph a supplier bill or send a voice note. SmartCapture reads it, matches each line to your catalogue, and hands you a transaction to approve." />
                <link rel="canonical" href="https://venqore.com/smartcapture" />
                <meta property="og:title" content="SmartCapture — a photo in, a posted transaction out | VenQore" />
                <meta property="og:description" content="Photograph a supplier bill or send a voice note. SmartCapture reads it, matches each line to your catalogue, and hands you a transaction to approve." />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://venqore.com/smartcapture" />
                <meta property="og:image" content="https://venqore.com/images/og/venqore-og.png" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="SmartCapture — a photo in, a posted transaction out | VenQore" />
                <meta name="twitter:description" content="Photograph a supplier bill or send a voice note. SmartCapture reads it, matches each line to your catalogue, and hands you a transaction to approve." />
                <meta name="twitter:image" content="https://venqore.com/images/og/venqore-og.png" />
            </Head>

            <div className="vq-site vq-app-body" style={{ background: 'var(--vq-bg)', color: 'var(--vq-text)', overflow: 'visible', minHeight: '100vh' }}>



  <SiteHeader />

<main id="main">

<section className="vq-section" style={{"paddingTop":"clamp(140px,15vw,200px)","paddingBottom":"clamp(48px,6vw,72px)"}}>
  <div className="vq-amb"><span className="vq-amb__aurora" style={{"opacity":".30"}}></span></div>
  <div className="vq-container" style={{"position":"relative"}}>
    <div style={{"maxWidth":"820px"}}>
      <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">SmartCapture</span>
      <h1 className="vq-display vq-mt-4">The order came in as a voice note. It <em className="vq-italic">leaves</em> as a sale.</h1>
      <p className="vq-lede vq-mt-6">SmartCapture is VenQore's AI document scanner. Photograph a supplier invoice, forward a WhatsApp screenshot or send a voice note, and it extracts the line items, matches each one to your product catalogue, flags what it cannot match, and hands you a draft purchase or sale to approve. Nothing posts to your accounts until you say so.</p>
      <div className="vq-row vq-wrap vq-gap-3 vq-mt-8"><a className="vq-btn vq-btn--primary vq-btn--lg" href="/build-workspace">Try it free <span className="vq-btn__arrow"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a>
        <a className="vq-btn vq-btn--secondary vq-btn--lg" href="/pricing#ai">What it costs</a></div>
    </div>
  </div>
</section>

<section className="vq-section" style={{"paddingTop":"0"}}>
  <div className="vq-container">
    <div className="vq-demo vq-reveal" data-capture>
      <div className="vq-demo__bar">
        <div className="vq-demo__dots"><i></i><i></i><i></i></div>
        <div className="vq-demo__url"><svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> www.venqore.com/capture</div>
        <span className="vq-demo__live">Live · try it</span>
      </div>
      <div className="vq-demo__controls">
        <span className="vq-eyebrow" style={{"flex":"none"}}>Point it at</span>
        <div className="vq-demo__scroller" data-capture-tabs role="tablist"></div>
      </div>
      <div className="vq-cap">
        <div className="vq-cap__in">
          <div className="vq-cap__stage" data-capture-stage></div>
          <button type="button" className="vq-btn vq-btn--primary vq-btn--lg vq-btn--block vq-mt-4" data-capture-run>Read it</button>
        </div>
        <div className="vq-cap__out" data-capture-out></div>
      </div>
    </div>
  </div>
</section>

<section className="vq-section vq-section--alt">
  <div className="vq-container">
    <div className="vq-section-head vq-reveal">
      <span className="vq-eyebrow">The arithmetic</span>
      <h2 className="vq-display">Where the day actually goes.</h2>
      <p className="vq-lede">Nobody opens a business to type. A forty-line supplier bill is twenty minutes of entry and one
        transposed digit away from a stock count that will not tie for a month.</p>
    </div>
    <div className="vq-grid vq-grid--4">
      <div className="vq-card vq-card--xl vq-card--accent vq-stat vq-reveal">
        <span className="vq-stat__label">A 40-line bill</span>
        <span className="vq-stat__value">11<span className="vq-stat__unit">seconds</span></span>
        <span className="vq-stat__note">Photograph, read, match, review, post</span>
      </div>
      
      <div className="vq-card vq-card--xl vq-stat vq-reveal">
        <span className="vq-stat__label">By hand</span>
        <span className="vq-stat__value">20<span className="vq-stat__unit">minutes</span></span>
        <span className="vq-stat__note">Item, quantity, rate, tax, line by line</span>
      </div>
      <div className="vq-card vq-card--xl vq-stat vq-reveal">
        <span className="vq-stat__label">Bills a week</span>
        <span className="vq-stat__value">30<span className="vq-stat__unit">+</span></span>
        <span className="vq-stat__note">For a shop with four regular distributors</span>
      </div>
      <div className="vq-card vq-card--xl vq-stat vq-reveal">
        <span className="vq-stat__label">Hours a month</span>
        <span className="vq-stat__value">38</span>
        <span className="vq-stat__note">Spent typing what a camera can read</span>
      </div>
    </div>
    <p className="vq-caption vq-mt-5 vq-reveal" style={{"maxWidth":"74ch"}}>
      Those are our own timings on our own bills, on a shop with four distributors — not an industry study. Yours will differ.
      The point is not the number; it is that the work is a photograph rather than an afternoon.
    </p>
  </div>
</section>

<section className="vq-section">
  <div className="vq-container">
    <div className="vq-section-head vq-reveal">
      <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">What it will read</span>
      <h2 className="vq-display">Whatever the day hands you.</h2>
    </div>
    <div className="vq-grid vq-grid--3">
      
      <article className="vq-card vq-card--xl vq-tile vq-reveal vq-card--interactive">
        <span className="vq-tile__icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 12h10"/></svg></span>
        <h3 className="vq-tile__title">A photograph of a bill</h3>
        <p className="vq-tile__body">Crumpled, angled, thermal, handwritten totals. It reads the lines, not the layout — so a distributor changing their template does not break anything.</p>
      </article>
      <article className="vq-card vq-card--xl vq-tile vq-reveal vq-card--interactive">
        <span className="vq-tile__icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg></span>
        <h3 className="vq-tile__title">A PDF or a screenshot</h3>
        <p className="vq-tile__body">The order that arrived as a WhatsApp picture of a list. The statement your supplier emailed. Forward it in and it comes back structured.</p>
      </article>
      <article className="vq-card vq-card--xl vq-tile vq-reveal vq-card--interactive">
        <span className="vq-tile__icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 19v3"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><rect x="9" y="2" width="6" height="13" rx="3"/></svg></span>
        <h3 className="vq-tile__title">A voice note</h3>
        <p className="vq-tile__body">In Urdu, in English, or in the mix people actually speak. Say what you sold and to whom; it comes back as a sale with the customer attached.</p>
      </article>
      <article className="vq-card vq-card--xl vq-tile vq-reveal vq-card--interactive">
        <span className="vq-tile__icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg></span>
        <h3 className="vq-tile__title">A packing list</h3>
        <p className="vq-tile__body">Against the purchase order you already raised, so the goods receipt shows ordered, received and remaining side by side.</p>
      </article>
      <article className="vq-card vq-card--xl vq-tile vq-reveal vq-card--interactive">
        <span className="vq-tile__icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="19" x2="5" y1="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg></span>
        <h3 className="vq-tile__title">A price list</h3>
        <p className="vq-tile__body">Bulk-update cost prices from the sheet your distributor sent, with every change shown before anything is applied.</p>
      </article>
      <article className="vq-card vq-card--xl vq-tile vq-reveal vq-card--interactive">
        <span className="vq-tile__icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></span>
        <h3 className="vq-tile__title">A stack of business cards</h3>
        <p className="vq-tile__body">Straight into your customer book, deduplicated against the numbers you already have.</p>
      </article>
    </div>
  </div>
</section>

<section className="vq-section vq-band-dark">
  <div className="vq-amb"><span className="vq-amb__beams"><i></i><i></i><i></i></span><span className="vq-amb__grain"></span></div>
  <div className="vq-container" style={{"position":"relative"}}>
    <div className="vq-section-head vq-reveal" style={{"maxWidth":"820px"}}>
      <span className="vq-eyebrow">The part that matters</span>
      <h2 className="vq-display">It matches. It does not guess.</h2>
      <p className="vq-lede">Reading a bill is the easy half. The half that decides whether this saves you time or costs you a
        weekend is what happens to a line the system has never seen before.</p>
    </div>
    <div className="vq-grid vq-grid--2">
      
      <div className="vq-card vq-card--xl vq-reveal">
        <h3 className="vq-h3" style={{"color":"#fff"}}>Matched against your catalogue, not a dictionary</h3>
        <p className="vq-tile__body vq-mt-3">Every line resolves to an item you actually stock — by SKU, by barcode, by the name your distributor uses, or by the name you use. The mapping is remembered, so the second bill from that supplier is cleaner than the first.</p>
      </div>
      <div className="vq-card vq-card--xl vq-reveal">
        <h3 className="vq-h3" style={{"color":"#fff"}}>A line it cannot match is flagged, never invented</h3>
        <p className="vq-tile__body vq-mt-3">It says "new item" and stops. You decide whether to create it. There is no threshold at which the system quietly makes something up, because a plausible wrong line is far more expensive than an obvious blank one.</p>
      </div>
      <div className="vq-card vq-card--xl vq-reveal">
        <h3 className="vq-h3" style={{"color":"#fff"}}>It checks the rate against what you last paid</h3>
        <p className="vq-tile__body vq-mt-3">A cost that jumped 40% since the last delivery is surfaced before you post, not discovered at month end when the margin looks wrong.</p>
      </div>
      <div className="vq-card vq-card--xl vq-reveal">
        <h3 className="vq-h3" style={{"color":"#fff"}}>Nothing posts until you approve it</h3>
        <p className="vq-tile__body vq-mt-3">The extraction is a proposal. You see every line, every match, every quantity and every rate, and the ledger is untouched until you press post.</p>
      </div>
    </div>
    <div className="vq-card vq-card--xl vq-mt-8 vq-reveal">
      <div className="vq-row vq-wrap vq-gap-6" style={{"justifyContent":"space-between","alignItems":"center"}}>
        <p className="vq-h3" style={{"color":"#fff","maxWidth":"52ch"}}>The rule the whole system is built on: a source may only return a
          value it read from the data. Never a sample, never a placeholder, never a realistic-looking default.</p>
        <a className="vq-btn vq-btn--lg vq-btn--onDark" href="/reckoner">Why we are strict about this <span className="vq-btn__arrow"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a>
      </div>
    </div>
  </div>
</section>

<section className="vq-section">
  <div className="vq-container">
    <div className="vq-grid vq-grid--2" style={{"gap":"var(--vq-space-16)","alignItems":"center"}}>
      <div className="vq-reveal">
        <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">What it costs</span>
        <h2 className="vq-display vq-mt-4">One page in, one credit out. Visible before you spend it.</h2>
        <p className="vq-lede vq-mt-6">Models cost money to run. Rather than bury that in the plan price and quietly raise it
          later, we show you the meter. A fourteen-page PDF will use fourteen pages, and the screen says so and asks once.</p>
        <a className="vq-btn vq-btn--primary vq-btn--lg vq-mt-8" href="/pricing#ai">See the AI pricing <span className="vq-btn__arrow"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a>
      </div>
      <div className="vq-stack vq-gap-4 vq-reveal">
        
        <div className="vq-card"><b className="vq-small" style={{"fontWeight":"var(--vq-fw-semi)"}}>Included every month</b>
        <p className="vq-caption vq-mt-2" style={{"maxWidth":"none"}}>Solo 10 scans · Starter 500 credits · Core 2,000 · Scale 10,000. Enough for everyday capture and queries without thinking about it.</p></div>
        <div className="vq-card"><b className="vq-small" style={{"fontWeight":"var(--vq-fw-semi)"}}>Top up when you need to</b>
        <p className="vq-caption vq-mt-2" style={{"maxWidth":"none"}}>1,000 more credits for $10. A one-off purchase, not a change to your subscription — and we stop at your cap rather than billing past it.</p></div>
        <div className="vq-card"><b className="vq-small" style={{"fontWeight":"var(--vq-fw-semi)"}}>Or bring your own key</b>
        <p className="vq-caption vq-mt-2" style={{"maxWidth":"none"}}>Connect your own model provider and pay them directly. We do not mark up a key you supply. One unlock, then free for as long as you use VenQore.</p></div>
        <div className="vq-card"><b className="vq-small" style={{"fontWeight":"var(--vq-fw-semi)"}}>We never silently truncate</b>
        <p className="vq-caption vq-mt-2" style={{"maxWidth":"none"}}>And we never silently charge. If a document is too long for your remaining allowance, you are told before it runs, not after.</p></div>
      </div>
    </div>
  </div>
</section>

<section className="vq-section vq-section--alt">
  <div className="vq-container vq-container--narrow">
    <div className="vq-section-head vq-reveal"><h2 className="vq-display">The questions people ask.</h2></div>
    <div className="vq-faq vq-reveal">
      
      <div className="vq-faq__item">
        <button className="vq-faq__q" type="button" aria-expanded="false">What happens to my photographs?<span className="vq-faq__sign"></span></button>
        <div className="vq-faq__a"><div><p>They go to the model provider to be read, and then they are yours. We do not train anything on your bills, we do not sell them, and you can delete a capture and its source image together.</p></div></div>
      </div>
      <div className="vq-faq__item">
        <button className="vq-faq__q" type="button" aria-expanded="false">How accurate is it, honestly?<span className="vq-faq__sign"></span></button>
        <div className="vq-faq__a"><div><p>On clean printed bills from a distributor you buy from regularly, near enough that reviewing is faster than typing. On a crumpled handwritten note it will get most of it and flag the rest. It is designed to be reviewed, which is why every line shows its match.</p></div></div>
      </div>
      <div className="vq-faq__item">
        <button className="vq-faq__q" type="button" aria-expanded="false">Does it work in Urdu?<span className="vq-faq__sign"></span></button>
        <div className="vq-faq__a"><div><p>Voice notes, yes — including the English-Urdu mix people actually speak. Handwritten Urdu on a bill is harder and you should expect to correct lines.</p></div></div>
      </div>
      <div className="vq-faq__item">
        <button className="vq-faq__q" type="button" aria-expanded="false">What if my distributor changes their invoice layout?<span className="vq-faq__sign"></span></button>
        <div className="vq-faq__a"><div><p>Nothing breaks. It reads the lines, not the template — there is no per-supplier setup to maintain and nothing to re-map when a format changes.</p></div></div>
      </div>
      <div className="vq-faq__item">
        <button className="vq-faq__q" type="button" aria-expanded="false">Can it post straight through without me looking?<span className="vq-faq__sign"></span></button>
        <div className="vq-faq__a"><div><p>No, and that is deliberate. The extraction is a proposal. Anything that writes to your ledger without a human approving it is one bad read away from a month of reconciliation.</p></div></div>
      </div>
      <div className="vq-faq__item">
        <button className="vq-faq__q" type="button" aria-expanded="false">Do I need an AI key?<span className="vq-faq__sign"></span></button>
        <div className="vq-faq__a"><div><p>No. Every plan includes a monthly allowance on our infrastructure. Bringing your own key is an option for heavy use, not a requirement.</p></div></div>
      </div>
    </div>
  </div>
</section>

<section className="vq-section vq-section--alt">
  <div className="vq-container">
    <div className="vq-section-head vq-reveal"><span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Keep reading</span><h2 className="vq-h2 vq-mt-4">What it feeds</h2></div>
    <div className="vq-grid vq-grid--3"><a className="vq-card vq-card--interactive vq-reveal" href="/documents"><h3 className="vq-h3">The documents it creates</h3><p className="vq-tile__body vq-mt-3">A photo in, a posted transaction out.</p><span className="vq-link vq-mt-4">Read on <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a><a className="vq-card vq-card--interactive vq-reveal" href="/ledger"><h3 className="vq-h3">Where the posting lands</h3><p className="vq-tile__body vq-mt-3">Reviewed by you, posted by the engine.</p><span className="vq-link vq-mt-4">Read on <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a><a className="vq-card vq-card--interactive vq-reveal" href="/tools/smart-capture"><h3 className="vq-h3">Try it on your own bill</h3><p className="vq-tile__body vq-mt-3">No signup, no watermark.</p><span className="vq-link vq-mt-4">Read on <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a></div>
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
