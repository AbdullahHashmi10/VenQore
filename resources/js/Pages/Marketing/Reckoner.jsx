import React, { useEffect } from 'react';
import { useTheme } from '@/Contexts/ThemeContext';
import { Head, Link, usePage } from '@inertiajs/react';
import SiteHeader from '@/Components/Site/SiteHeader';
import SiteFooter from '@/Components/Site/SiteFooter';
import CookieConsent from '@/Components/CookieConsent';

export default function Reckoner() {
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
                <title>The Reckoner — one place a number can be defined | VenQore</title>
                <meta name="description" content="58 readings, 18 period windows, one definition each. The dashboard and the P&amp;L cannot disagree, and your history survives every rename." />
                <link rel="canonical" href="https://venqore.com/reckoner" />
                <meta property="og:title" content="The Reckoner — one place a number can be defined | VenQore" />
                <meta property="og:description" content="58 readings, 18 period windows, one definition each. The dashboard and the P&amp;L cannot disagree, and your history survives every rename." />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://venqore.com/reckoner" />
                <meta property="og:image" content="https://venqore.com/images/og/venqore-og.png" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="The Reckoner — one place a number can be defined | VenQore" />
                <meta name="twitter:description" content="58 readings, 18 period windows, one definition each. The dashboard and the P&amp;L cannot disagree, and your history survives every rename." />
                <meta name="twitter:image" content="https://venqore.com/images/og/venqore-og.png" />
            </Head>

            <div className="vq-site vq-app-body" style={{ background: 'var(--vq-bg)', color: 'var(--vq-text)', overflow: 'visible', minHeight: '100vh' }}>



  <SiteHeader />

<main id="main">

<section className="vq-section" style={{"paddingTop":"clamp(140px,15vw,200px)","paddingBottom":"clamp(48px,6vw,72px)"}}>
  <div className="vq-amb"><span className="vq-amb__grid"></span></div>
  <div className="vq-container" style={{"position":"relative"}}>
    <div style={{"maxWidth":"820px"}}>
      <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">The Reckoner</span>
      <h1 className="vq-display vq-mt-4">One place a number can be <em className="vq-italic">defined</em>.</h1>
      <p className="vq-lede vq-mt-6">The Reckoner is VenQore's metric layer: the single place any business number — revenue, margin, stock value, receivables — is defined. All 58 dashboard readings and every one of the 40 reports ask it rather than calculating their own. That is why your dashboard and your profit and loss cannot disagree.</p>
      <div className="vq-row vq-wrap vq-gap-3 vq-mt-8"><a className="vq-btn vq-btn--primary vq-btn--lg" href="/build-workspace">Start building <span className="vq-btn__arrow"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a>
        <a className="vq-btn vq-btn--secondary vq-btn--lg" href="/dashboard-preview">See it on a dashboard</a></div>
    </div>
  </div>
</section>

<section className="vq-section" style={{"paddingTop":"0"}}>
  <div className="vq-container">
    <div className="vq-grid vq-grid--4">
      <div className="vq-card vq-card--xl vq-card--accent vq-stat vq-reveal">
        <span className="vq-stat__label">Readings</span>
        <span className="vq-stat__value"><span data-count="108">108</span></span>
        <span className="vq-stat__note">Every figure the product can show you, defined once</span>
      </div>
      
      <div className="vq-card vq-card--xl vq-stat vq-reveal">
        <span className="vq-stat__label">Period windows</span>
        <span className="vq-stat__value">18</span>
        <span className="vq-stat__note">Each with a comparison window behind it</span>
      </div>
      <div className="vq-card vq-card--xl vq-stat vq-reveal">
        <span className="vq-stat__label">Distinct figures</span>
        <span className="vq-stat__value">1,944</span>
        <span className="vq-stat__note">Before anyone picks a chart or a size</span>
      </div>
      <div className="vq-card vq-card--xl vq-stat vq-reveal">
        <span className="vq-stat__label">Places a number is defined</span>
        <span className="vq-stat__value">1</span>
        <span className="vq-stat__note">And a build that fails if a second one appears</span>
      </div>
    </div>
  </div>
</section>

<section className="vq-section vq-section--alt">
  <div className="vq-container">
    <div className="vq-grid vq-grid--2" style={{"gap":"var(--vq-space-16)","alignItems":"center"}}>
      <div className="vq-reveal">
        <span className="vq-eyebrow">The problem it exists to kill</span>
        <h2 className="vq-display vq-mt-4">Six places computed "revenue". They disagreed.</h2>
        <p className="vq-lede vq-mt-6">That is the state most business software is in, and nobody tells you. A sale reversed by a
          journal entry vanishes from one figure and not the other. The dashboard says one number and the P&amp;L says
          another, and you cannot tell which is real.</p>
        <p className="vq-body vq-mt-6 vq-text-2">Once you cannot tell, you stop trusting all of them — and an ERP whose numbers
          you do not trust is a very expensive filing cabinet. So we made it structurally impossible: one registry, one
          definition per figure, and a check in the build that fails if a second definition appears anywhere in the codebase.</p>
      </div>
      <div className="vq-reveal">
        <div className="vq-card vq-card--xl">
          <span className="vq-eyebrow">One request, one answer</span>
          <div className="vq-mt-4" style={{"fontFamily":"var(--vq-font-numeric)","fontSize":"var(--vq-fs-caption)","lineHeight":"1.9","color":"var(--vq-text-2)","wordSpacing":"normal"}}>
            <div><span style={{"color":"var(--vq-accent-text)"}}>reckoner</span>.read(<b style={{"color":"var(--vq-text)"}}>'finance.gross_profit'</b>,</div>
            <div style={{"paddingLeft":"22px"}}>period: <b style={{"color":"var(--vq-text)"}}>'this_quarter'</b>)</div>
            <div className="vq-mt-3" style={{"opacity":".55"}}>→ value        842,610</div>
            <div style={{"opacity":".55"}}>→ previous     731,400</div>
            <div style={{"opacity":".55"}}>→ change_pct   +15.2</div>
            <div style={{"opacity":".55"}}>→ compare      vs Q3 last year</div>
            <div style={{"opacity":".55"}}>→ meta         cached · 4 min ago</div>
            <div style={{"opacity":".55"}}>→ drill        /reports/profit-loss</div>
          </div>
          <div className="vq-hr" style={{"marginBlock":"var(--vq-space-5)"}}></div>
          <p className="vq-caption" style={{"maxWidth":"none"}}>The dashboard card, the P&amp;L report, the mobile app and the Windows
            app all ask this. They cannot disagree, because there is nothing for them to disagree about.</p>
        </div>
      </div>
    </div>
  </div>
</section>

<section className="vq-section">
  <div className="vq-container">
    <div className="vq-section-head vq-reveal">
      <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Eighteen windows</span>
      <h2 className="vq-display">Every figure, over any period, against the right comparison.</h2>
      <p className="vq-lede">The comparison is the hard part. "Up 15%" means nothing unless you know what it is up against —
        so every window carries its own, and the answer says which one it used.</p>
    </div>
    <div className="vq-table-wrap vq-reveal">
      <table className="vq-table">
        <thead><tr><th style={{"width":"200px"}}>Window</th><th>Compared against</th></tr></thead>
        <tbody>
          <tr><td className="vq-table__row-head">today</td><td className="vq-text-2">yesterday</td></tr><tr><td className="vq-table__row-head">yesterday</td><td className="vq-text-2">the day before</td></tr><tr><td className="vq-table__row-head">this week</td><td className="vq-text-2">the same span last week</td></tr><tr><td className="vq-table__row-head">last week</td><td className="vq-text-2">the week before</td></tr><tr><td className="vq-table__row-head">this month</td><td className="vq-text-2">the same span last month</td></tr><tr><td className="vq-table__row-head">last month</td><td className="vq-text-2">the month before</td></tr><tr><td className="vq-table__row-head">this quarter</td><td className="vq-text-2">the same quarter last year</td></tr><tr><td className="vq-table__row-head">last quarter</td><td className="vq-text-2">the quarter before</td></tr><tr><td className="vq-table__row-head">this year</td><td className="vq-text-2">the same span last year</td></tr><tr><td className="vq-table__row-head">last year</td><td className="vq-text-2">the year before</td></tr><tr><td className="vq-table__row-head">last 7 days</td><td className="vq-text-2">the preceding 7</td></tr><tr><td className="vq-table__row-head">last 30 days</td><td className="vq-text-2">the preceding 30</td></tr><tr><td className="vq-table__row-head">last 90 days</td><td className="vq-text-2">the preceding 90</td></tr><tr><td className="vq-table__row-head">last 12 months</td><td className="vq-text-2">the preceding 12</td></tr><tr><td className="vq-table__row-head">all time</td><td className="vq-text-2">—</td></tr><tr><td className="vq-table__row-head">a custom range</td><td className="vq-text-2">an equal-length preceding window</td></tr><tr><td className="vq-table__row-head">as of a date</td><td className="vq-text-2">—</td></tr><tr><td className="vq-table__row-head">live</td><td className="vq-text-2">—</td></tr>
        </tbody>
      </table>
    </div>
    <p className="vq-caption vq-mt-4" style={{"maxWidth":"74ch"}}>
      Quarters are calendar quarters and the year starts on 1 January — and every figure with a yearly window states that
      rule in its own help text, so nobody is guessing what they are looking at.
    </p>
  </div>
</section>

<section className="vq-section vq-band-dark">
  <div className="vq-amb"><span className="vq-amb__beams"><i></i><i></i><i></i></span><span className="vq-amb__grain"></span></div>
  <div className="vq-container" style={{"position":"relative"}}>
    <div className="vq-section-head vq-reveal" style={{"maxWidth":"820px"}}>
      <span className="vq-eyebrow">You never start from zero</span>
      <h2 className="vq-display">Your history outlives every change you make.</h2>
      <p className="vq-lede">Most systems lose your past the moment you tidy something up. Rename a category and its history
        splits in two. Change your business type and the labels move but the comparisons break. Neither happens here,
        and both are design decisions rather than luck.</p>
    </div>
    <div className="vq-grid vq-grid--2" style={{"gap":"var(--vq-space-16)"}}>
      <div className="vq-reveal">
        <div className="vq-timeline">
          
          <div className="vq-timeline__item">
            <span className="vq-timeline__when">Day one</span>
            <p className="vq-body vq-mt-2" style={{"color":"rgb(237 242 239 / .78)","maxWidth":"46ch"}}>Your ledger opens. Every transaction from here is recorded against a permanent key, not a display name.</p>
          </div>
          <div className="vq-timeline__item">
            <span className="vq-timeline__when">Month three</span>
            <p className="vq-body vq-mt-2" style={{"color":"rgb(237 242 239 / .78)","maxWidth":"46ch"}}>You rename "Utilities" to "Electricity &amp; gas". The label changes everywhere. The three months behind it stay attached — because the history is keyed to the account, not the word.</p>
          </div>
          <div className="vq-timeline__item">
            <span className="vq-timeline__when">Month nine</span>
            <p className="vq-body vq-mt-2" style={{"color":"rgb(237 242 239 / .78)","maxWidth":"46ch"}}>You switch business type from Retail to Wholesale. Every figure relabels itself. Not one stored number moves.</p>
          </div>
          <div className="vq-timeline__item">
            <span className="vq-timeline__when">Year two</span>
            <p className="vq-body vq-mt-2" style={{"color":"rgb(237 242 239 / .78)","maxWidth":"46ch"}}>You add a second branch, and eight new cards. "This quarter versus the same quarter last year" answers immediately, because last year was never thrown away.</p>
          </div>
          <div className="vq-timeline__item">
            <span className="vq-timeline__when">Year four</span>
            <p className="vq-body vq-mt-2" style={{"color":"rgb(237 242 239 / .78)","maxWidth":"46ch"}}>You are still comparing against year one. Same keys, same definitions, same ledger.</p>
          </div>
        </div>
      </div>
      <div className="vq-stack vq-gap-4 vq-reveal">
        
        <div className="vq-card vq-card--xl">
          <h3 className="vq-h3" style={{"color":"#fff"}}>A key is permanent</h3>
          <p className="vq-tile__body vq-mt-3">The identifier behind every figure is a public, immutable name. To change what you see, we change the label. To retire a figure, we point it at its replacement. We never rename a key — because your saved dashboards and your history are hanging off it.</p>
        </div>
        <div className="vq-card vq-card--xl">
          <h3 className="vq-h3" style={{"color":"#fff"}}>History groups by identity, not by text</h3>
          <p className="vq-tile__body vq-mt-3">Expenses group by the account, displayed by the account name. Rename it and the past comes with it. This is a real bug we found and fixed in our own reports.</p>
        </div>
        <div className="vq-card vq-card--xl">
          <h3 className="vq-h3" style={{"color":"#fff"}}>Business type is a label layer</h3>
          <p className="vq-tile__body vq-mt-3">It changes display names per industry and never touches the maths. Switching it relabels everything and moves no data.</p>
        </div>
        <div className="vq-card vq-card--xl">
          <h3 className="vq-h3" style={{"color":"#fff"}}>Closed periods are sealed, not frozen</h3>
          <p className="vq-tile__body vq-mt-3">Historical months are precomputed and served instantly — and a snapshot is dropped the moment anyone back-dates an entry into its window. Turning the whole optimisation off changes no number, only the speed.</p>
        </div>
      </div>
    </div>
  </div>
</section>

<section className="vq-section">
  <div className="vq-container">
    <div className="vq-section-head vq-reveal">
      <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Questions a report cannot answer</span>
      <h2 className="vq-display">Six things we do differently, on purpose.</h2>
    </div>
    <div className="vq-grid vq-grid--3">
      
      <article className="vq-card vq-card--xl vq-tile vq-reveal">
        <h3 className="vq-tile__title">We do not show zero when we mean "we do not know"</h3>
        <p className="vq-tile__body">A confident 0 where the truth is unknown is the most damaging thing a dashboard can display. Ours says not applicable, and explains why.</p>
      </article>
      <article className="vq-card vq-card--xl vq-tile vq-reveal">
        <h3 className="vq-tile__title">A loss is called a loss</h3>
        <p className="vq-tile__body">Gross Profit becomes Gross Loss. Net Cash Inflow becomes Net Cash Outflow. Tax Payable becomes Tax Refundable. Seven figures flip their word rather than just going red.</p>
      </article>
      <article className="vq-card vq-card--xl vq-tile vq-reveal">
        <h3 className="vq-tile__title">Growth against nothing is not +100%</h3>
        <p className="vq-tile__body">If last month was zero, this month's growth is null, not infinity dressed up as a triumph.</p>
      </article>
      <article className="vq-card vq-card--xl vq-tile vq-reveal">
        <h3 className="vq-tile__title">What you bought and what you paid are two numbers</h3>
        <p className="vq-tile__body">Purchases and Paid to Suppliers are kept apart and neither is ever labelled just "Purchases". A top spender with no receipts is not a data error — it is your biggest credit risk.</p>
      </article>
      <article className="vq-card vq-card--xl vq-tile vq-reveal">
        <h3 className="vq-tile__title">"Do my books balance" is a status, not a trend</h3>
        <p className="vq-tile__body">A discrepancy needs action, not a chart to watch it drift. It answers balanced or out of balance, with the amount as detail.</p>
      </article>
      <article className="vq-card vq-card--xl vq-tile vq-reveal">
        <h3 className="vq-tile__title">Thresholds are yours, and they say so</h3>
        <p className="vq-tile__body">Heavy discount, dormant customer, overstock, expiry warning — eight thresholds you set, and every figure that uses one names it in its own help text.</p>
      </article>
    </div>
  </div>
</section>

<section className="vq-section vq-section--alt">
  <div className="vq-container">
    <div className="vq-grid vq-grid--2" style={{"gap":"var(--vq-space-16)","alignItems":"center"}}>
      <div className="vq-reveal">
        <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Speed</span>
        <h2 className="vq-display vq-mt-4">Nobody waits at the till so a dashboard can stay warm.</h2>
        <p className="vq-lede vq-mt-6">The obvious way to make a dashboard fast is to recompute everything whenever anything
          changes. Post a sale, recalculate every figure over every window — thousands of numbers, inside the checkout
          request, with a customer standing at the counter. Adding a chart would make the till slower. That is backwards.</p>
        <p className="vq-body vq-mt-6 vq-text-2">So we compute when asked, remember the answer, and forget it the moment the
          underlying data changes. The number is always there and always right. The only difference is <b style={{"color":"var(--vq-text)"}}>when</b>
          the work happens: while someone is looking, not while someone is selling.</p>
      </div>
      <div className="vq-reveal">
        <div className="vq-card vq-card--xl">
          <span className="vq-eyebrow">What invalidates what</span>
          <div className="vq-mt-5 vq-stack vq-gap-3">
            <div className="vq-row vq-gap-3" style={{"justifyContent":"space-between","alignItems":"baseline"}}>
                <span className="vq-small">Sale posted, voided or returned</span>
                <span className="vq-caption vq-num" style={{"color":"var(--vq-accent-text)","whiteSpace":"nowrap"}}>sales · finance · inventory</span></div><div className="vq-row vq-gap-3" style={{"justifyContent":"space-between","alignItems":"baseline"}}>
                <span className="vq-small">Purchase or goods receipt</span>
                <span className="vq-caption vq-num" style={{"color":"var(--vq-accent-text)","whiteSpace":"nowrap"}}>purchasing · inventory · finance</span></div><div className="vq-row vq-gap-3" style={{"justifyContent":"space-between","alignItems":"baseline"}}>
                <span className="vq-small">Journal entry</span>
                <span className="vq-caption vq-num" style={{"color":"var(--vq-accent-text)","whiteSpace":"nowrap"}}>finance</span></div><div className="vq-row vq-gap-3" style={{"justifyContent":"space-between","alignItems":"baseline"}}>
                <span className="vq-small">Stock movement or adjustment</span>
                <span className="vq-caption vq-num" style={{"color":"var(--vq-accent-text)","whiteSpace":"nowrap"}}>inventory</span></div><div className="vq-row vq-gap-3" style={{"justifyContent":"space-between","alignItems":"baseline"}}>
                <span className="vq-small">Expense recorded</span>
                <span className="vq-caption vq-num" style={{"color":"var(--vq-accent-text)","whiteSpace":"nowrap"}}>finance</span></div><div className="vq-row vq-gap-3" style={{"justifyContent":"space-between","alignItems":"baseline"}}>
                <span className="vq-small">Production run completed</span>
                <span className="vq-caption vq-num" style={{"color":"var(--vq-accent-text)","whiteSpace":"nowrap"}}>inventory · finance</span></div><div className="vq-row vq-gap-3" style={{"justifyContent":"space-between","alignItems":"baseline"}}>
                <span className="vq-small">Payment received or made</span>
                <span className="vq-caption vq-num" style={{"color":"var(--vq-accent-text)","whiteSpace":"nowrap"}}>finance · party</span></div><div className="vq-row vq-gap-3" style={{"justifyContent":"space-between","alignItems":"baseline"}}>
                <span className="vq-small">Staff clock in or out</span>
                <span className="vq-caption vq-num" style={{"color":"var(--vq-accent-text)","whiteSpace":"nowrap"}}>operations</span></div>
          </div>
          <p className="vq-caption vq-mt-5" style={{"maxWidth":"none"}}>Eight write events, invalidating by domain. Everything else
            stays warm — so a stock adjustment never makes your P&amp;L recompute for no reason.</p>
        </div>
      </div>
    </div>
  </div>
</section>

<section className="vq-section vq-band-dark">
  <div className="vq-amb"><span className="vq-amb__grain"></span></div>
  <div className="vq-container vq-container--narrow" style={{"position":"relative"}}>
    <div className="vq-reveal">
      <span className="vq-eyebrow">Being straight about it</span>
      <h2 className="vq-display vq-mt-4">We audited ourselves and found twelve cards lying.</h2>
      <p className="vq-lede vq-mt-6">In August we ran a line-by-line audit of our own metrics against the code on disk. Twelve
        of them were returning invented data — a customer called Ali Raza who did not exist in anyone's database, a payment
        split of 60/40 cash to card pulled from nothing and applied to a real total.</p>
      <p className="vq-body vq-mt-6" style={{"color":"rgb(237 242 239 / .74)"}}>We withdrew all twelve the same week, told the users
        who had them on their dashboards exactly which figures were affected, and wrote the rule that stops it happening
        again: a source may only return a value it read from the data. Not a sample, not a placeholder, not a
        realistic-looking default. There is no flag that makes it acceptable.</p>
      <div className="vq-quote vq-mt-8">
        <p style={{"color":"#fff"}}>The deeper failure was not the twelve. It was that 112 green tests and a clean build
        reported success while the product returned invented data. Every check we had was structural.</p>
      </div>
      <p className="vq-body vq-mt-8" style={{"color":"rgb(237 242 239 / .74)"}}>What replaced them: a test that seeds two different
        datasets, asks the same figure of each, and fails if the answers match. A grep that fails the build if a sample
        value appears in a data source. And a rule that an implemented figure executing zero queries is fabricated by
        definition.</p>
      <a className="vq-btn vq-btn--lg vq-btn--onDark vq-mt-8" href="/ledger">The seven correctness checks <span className="vq-btn__arrow"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a>
    </div>
  </div>
</section>

<section className="vq-section vq-section--alt">
  <div className="vq-container">
    <div className="vq-section-head vq-reveal"><span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Keep reading</span><h2 className="vq-h2 vq-mt-4">Where the numbers surface</h2></div>
    <div className="vq-grid vq-grid--3"><a className="vq-card vq-card--interactive vq-reveal" href="/dashboard-preview"><h3 className="vq-h3">The dashboard that assembles itself</h3><p className="vq-tile__body vq-mt-3">58 readings, cards that size themselves.</p><span className="vq-link vq-mt-4">Read on <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a><a className="vq-card vq-card--interactive vq-reveal" href="/ledger"><h3 className="vq-h3">The engine underneath</h3><p className="vq-tile__body vq-mt-3">One posting path for every module.</p><span className="vq-link vq-mt-4">Read on <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a><a className="vq-card vq-card--interactive vq-reveal" href="/features"><h3 className="vq-h3">All 140+ modules and what each does</h3><p className="vq-tile__body vq-mt-3">The full capability map.</p><span className="vq-link vq-mt-4">Read on <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a></div>
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
