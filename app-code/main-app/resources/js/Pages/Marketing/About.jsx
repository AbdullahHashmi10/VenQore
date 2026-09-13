import React, { useEffect, useState } from 'react';
import { useTheme } from '@/Contexts/ThemeContext';
import { Head, Link, usePage } from '@inertiajs/react';
import SiteHeader from '@/Components/Site/SiteHeader';
import SiteFooter from '@/Components/Site/SiteFooter';
import CookieConsent from '@/Components/CookieConsent';

const QUESTIONS_AND_ANSWERS = [
    {
        id: '01',
        title: 'What is VenQore?',
        content: 'VenQore is an AI ERP builder that replaces fragmented point-of-sale terminals, disconnected spreadsheets, and rigid enterprise software with one unified operating system. You describe your operational workflows in plain language, and VenQore automatically composes a tailor-made system backed by an immutable double-entry general ledger.',
    },
    {
        id: '02',
        title: 'Why did we build it?',
        content: 'For decades, growing businesses were forced to choose between simplistic cash registers that blind them to true profit and bloated ERP consulting projects that cost thousands and take six months. We lived this reality behind live counters — where cash drawers mismatch, FIFO inventory costs drift, and reports conflict — so we wrote the software that should have existed from day one.',
    },
    {
        id: '03',
        title: 'How does the AI builder assemble your system?',
        content: 'VenQore maintains an architectural library of 140+ battle-tested operational modules (POS, FIFO inventory, multi-branch dispatch, recipe costing, batch tracking, customer Khata, SP-API sync). The AI composer maps your plain-language description to the exact modules, fields, and approval tiers your business needs — turning on only what you use with zero extraneous clutter.',
    },
    {
        id: '04',
        title: 'Why is our accounting mathematical & immutable?',
        content: 'While AI composes the interface and workflows, it never touches the financial math. Every transaction — checkout, purchase order, stock write-off, or supplier return — writes balanced debits and credits into Core Ledger. All writes pass through 8 inviolable accounting laws and DECIMAL(20,4) precision, guaranteeing that no two screens or reports can ever disagree.',
    },
    {
        id: '05',
        title: 'What industries does VenQore run?',
        content: 'VenQore powers 85+ business categories across retail, food & beverage, wholesale, services, and light manufacturing. Whether you need batch-expiry controls for pharmacy, IMEI tracking for electronics, recipe costing for central kitchens, or tier-pricing dispatch for wholesale, the underlying ledger engine adapts seamlessly.',
    },
    {
        id: '06',
        title: 'How do we verify system accuracy?',
        content: 'We believe buyers of financial software deserve proof over marketing claims. Every build is validated against 35,000+ automated correctness checks guarding ledger balances, inventory lot relief, and tax separation before any code ships to production.',
    },
    {
        id: '07',
        title: 'Who supports and builds VenQore?',
        content: 'VenQore is built and supported by dedicated systems engineers and domain specialists with shop-floor experience. We ship weekly improvements, respond directly to customer requests, and never trap your data with export barriers.',
    },
];

function EditorialAccordion() {
    const [openId, setOpenId] = useState('01');

    const toggle = (id) => {
        setOpenId((prev) => (prev === id ? null : id));
    };

    return (
        <div className="w-full max-w-4xl mx-auto divide-y divide-white/10 dark:divide-white/10 border-y border-white/10">
            {QUESTIONS_AND_ANSWERS.map((item) => {
                const isOpen = openId === item.id;
                return (
                    <div key={item.id} className="group transition-colors duration-200">
                        <button
                            type="button"
                            onClick={() => toggle(item.id)}
                            className={`w-full text-left py-6 sm:py-8 px-2 sm:px-4 flex items-start justify-between gap-6 cursor-pointer transition-all duration-300 ${
                                isOpen
                                    ? 'text-[var(--vq-accent-text,#0BAA8F)]'
                                    : 'text-white/40 hover:text-white/90'
                            }`}
                            aria-expanded={isOpen}
                        >
                            <div className="flex items-start gap-4 sm:gap-6 flex-1 min-w-0">
                                <span className="text-xs sm:text-sm font-mono font-bold tracking-widest pt-1.5 opacity-60">
                                    {item.id}
                                </span>
                                <h3 className="font-display font-black uppercase text-2xl sm:text-3xl md:text-4xl lg:text-5xl tracking-tight leading-[1.05]">
                                    {item.title}
                                </h3>
                            </div>
                            <span className="flex-shrink-0 pt-1.5 opacity-70 group-hover:opacity-100 transition-transform duration-300">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="22"
                                    height="22"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className={`transition-transform duration-300 ${isOpen ? 'rotate-45 text-[var(--vq-accent-text,#0BAA8F)]' : 'rotate-0'}`}
                                >
                                    <path d="M12 5v14" />
                                    <path d="M5 12h14" />
                                </svg>
                            </span>
                        </button>
                        <div
                            className={`grid transition-all duration-300 ease-out px-2 sm:px-4 ${
                                isOpen ? 'grid-rows-[1fr] opacity-100 pb-8' : 'grid-rows-[0fr] opacity-0 pb-0 pointer-events-none'
                            }`}
                        >
                            <div className="overflow-hidden">
                                <div className="pl-8 sm:pl-12 md:pl-16 pr-4 sm:pr-8 text-slate-300 text-base sm:text-lg md:text-xl leading-relaxed font-normal">
                                    <p>{item.content}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

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



  <SiteHeader />

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
          <span className="vq-stat__value vq-stat__value--sm">35,000+</span>
          <span className="vq-stat__note">Automated correctness tests run on every release</span>
        </div>
        <div className="vq-card vq-stat">
          <span className="vq-stat__label">Universal ERP Modules</span>
          <span className="vq-stat__value vq-stat__value--sm">140+</span>
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

{/*  ══ EDITORIAL ACCORDION: WHAT WE DO & HOW WE DO IT ══════════════════  */}
<section className="vq-section vq-band-dark" style={{"paddingTop":"clamp(80px,9vw,130px)","paddingBottom":"clamp(80px,9vw,130px)"}}>
  <div className="vq-amb"><span className="vq-amb__aurora" style={{"opacity":".22"}}></span></div>
  <div className="vq-container" style={{"position":"relative"}}>
    <div className="vq-section-head vq-reveal" style={{"textAlign":"center","marginInline":"auto","marginBottom":"clamp(36px,5vw,64px)"}}>
      <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Architecture &amp; Methodology</span>
      <h2 className="vq-display">What we do, and how we do it.</h2>
      <p className="vq-lede" style={{"color":"rgb(255 255 255 / .75)","maxWidth":"42rem","marginInline":"auto"}}>
        The engineering, accounting principles, and operational design that make VenQore unlike any traditional ERP or simple cash register.
      </p>
    </div>

    <EditorialAccordion />
  </div>
</section>

<section className="vq-section vq-band-dark" style={{"borderTop":"1px solid rgba(255,255,255,0.06)"}}>
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

  <SiteFooter />
  <CookieConsent />





{/*  Privacy-first cookieless analytics  */}


            </div>
        </>
    );
}
