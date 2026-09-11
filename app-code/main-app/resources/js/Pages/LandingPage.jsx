import React, { useEffect } from 'react';
import { useTheme } from '@/Contexts/ThemeContext';
import { Head, Link, usePage } from '@inertiajs/react';
import SiteHeader from '@/Components/Site/SiteHeader';
import SiteFooter from '@/Components/Site/SiteFooter';
import HeroPrompt from '@/Components/Landing/HeroPrompt';
import BusinessTypes from '@/Components/Site/BusinessTypes';
import { BUSINESS_TYPE_CLAIM, SECTOR_COUNT } from '@/Components/Site/sectorCatalog';
import CookieConsent from '@/Components/CookieConsent';

export default function LandingPage() {
    const { isDarkMode, toggleTheme } = useTheme();
    const { auth = {}, flash = {} } = usePage().props;

    useEffect(() => {
        // Unlock document and body scrolling for marketing landing page
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

        // Master initializer for Fluid Ink simulation and Scroll Choreography
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
                // Ensure canvas is ready
                const canvas = document.getElementById('fluid-canvas');
                if (canvas) {
                    canvas.width = window.innerWidth;
                    canvas.height = window.innerHeight;
                }

                await loadScript('/v6/assets/fluid.js');
                await loadScript('/v6/assets/venqore.js');
                await loadScript('/v6/assets/venqore-landing.js');
                await loadScript('/v6/assets/venqore-forms.js');
                
                // Trigger scroll bus recalculation once loaded
                window.dispatchEvent(new Event('resize'));
                window.dispatchEvent(new Event('scroll'));
            } catch (err) {
                console.warn('VenQore visual engines init notice:', err);
            }
        };

        // Small timeout to allow DOM to paint before attaching WebGL & observers
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
                <title>VenQore — The AI ERP Builder for POS, Stock &amp; Accounting</title>
                <meta name="description" content="Describe your business in plain language. VenQore assembles the operating system that runs it — for 85+ kinds of business across retail, services, food, wholesale and light manufacturing — with double-entry accounting under every module." />
                <link rel="canonical" href="https://venqore.com/" />
                <meta property="og:title" content="VenQore — The AI ERP Builder for POS, Stock &amp; Accounting" />
                <meta property="og:description" content="Describe your business in plain language. VenQore assembles the operating system that runs it, with double-entry accounting under every module." />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://venqore.com/" />
                <meta property="og:image" content="https://venqore.com/images/og/venqore-og.png" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="VenQore — The AI ERP Builder for POS, Stock &amp; Accounting" />
                <meta name="twitter:description" content="Describe your business in plain language. VenQore assembles the operating system that runs it, with double-entry accounting under every module." />
                <meta name="twitter:image" content="https://venqore.com/images/og/venqore-og.png" />
            </Head>

            <div className="vq-site vq-app-body" style={{ background: 'var(--vq-bg)', color: 'var(--vq-text)', overflow: 'visible', minHeight: '100vh' }}>

  {/*  Real-time WebGL Fluid Canvas (Full-page viewport persistent)  */}
  <canvas id="fluid-canvas" className="pointer-events-none fixed inset-0" style={{"position":"fixed","inset":"0","width":"100%","height":"100%","pointerEvents":"none","zIndex":"2","filter":"blur(1px)","opacity":"0.9"}}></canvas>
  

  

  {/*  Scroll Progress Indicator  */}
  <div data-prog="1" style={{"position":"fixed","top":"0","left":"0","height":"3px","width":"0%","background":"linear-gradient(90deg, #0BAA8F, #59DBC0)","zIndex":"500","boxShadow":"0 0 18px rgba(35, 196, 166, 0.6)"}}></div>

  <SiteHeader />

  <main id="main">

  {/*  SECTION 1: HERO SECTION (PRESERVED)  */}
  <section id="top" data-sec="top" data-tone="dark" className="vq-hero-section" style={{"position":"relative","minHeight":"100svh","width":"100%","display":"flex","flexDirection":"column","paddingTop":"clamp(85px,10vw,120px)","overflow":"hidden"}}>
    <div className="hero-gradient-overlay" aria-hidden="true" style={{"position":"absolute","inset":"0","pointerEvents":"none","zIndex":"0"}}></div>
    

    {/*  Floating Domain Pills  */}
    <div className="hero-floaters" style={{"position":"absolute","inset":"0","overflow":"hidden","pointerEvents":"none","zIndex":"5"}}>
      <span className="hero-pill-float" style={{"top":"20%","left":"5%","animationDuration":"7.2s"}}>
        <span className="hero-pill-dot"></span>Batch &amp; expiry
      </span>
      <span className="hero-pill-float" style={{"top":"58%","left":"8%","animationDuration":"8.4s"}}>
        <span className="hero-pill-dot"></span>Core Ledger
      </span>
      <span className="hero-pill-float" style={{"top":"16%","right":"9%","animationDuration":"9.2s"}}>
        <span className="hero-pill-dot"></span>Payables · 30 days
      </span>
      <span className="hero-pill-float" style={{"top":"42%","right":"5%","animationDuration":"7.8s"}}>
        <span className="hero-pill-dot"></span>POS checkout
      </span>
      <span className="hero-pill-float" style={{"top":"72%","right":"12%","animationDuration":"6.6s"}}>
        <span className="hero-pill-dot"></span>Branch transfers
      </span>
    </div>

    <div className="vq-hero-inner" style={{"position":"relative","zIndex":"10","marginBlock":"auto","marginInline":"auto","maxWidth":"64rem","width":"100%","display":"flex","flexDirection":"column","alignItems":"center","gap":"var(--vq-space-4)","paddingInline":"var(--vq-space-6)","textAlign":"center"}}>

      <span className="vq-eyebrow vq-hero-eyebrow" style={{"display":"inline-flex","alignItems":"center","gap":"8px","height":"30px","padding":"0 14px","borderRadius":"9999px","background":"rgba(255, 255, 255, 0.12)","border":"1px solid rgba(255, 255, 255, 0.22)","backdropFilter":"blur(8px)","font":"700 12px/1 var(--vq-font-numeric)","letterSpacing":".14em","color":"var(--vq-text)"}}>
        <span style={{"width":"6px","height":"6px","borderRadius":"9999px","background":"var(--vq-accent)","boxShadow":"0 0 8px var(--vq-accent)"}}></span>
        THE AI ERP BUILDER
      </span>

      <h1 id="main-heading" className="vq-hero vq-hero-h1 fold-text-container" style={{"fontWeight":"600","fontSize":"clamp(44px,7.2vw,84px)","lineHeight":"1.0","letterSpacing":"-0.04em","maxWidth":"22ch","textAlign":"center","margin":"0"}}>
        Tell us how you operate.<br />
        We <span style={{"position":"relative","color":"var(--vq-accent-text)","display":"inline-block"}}>assemble<span style={{"position":"absolute","left":"0","right":"0","bottom":"6px","height":"6px","borderRadius":"999px","background":"rgba(35, 196, 166, 0.38)"}}></span></span> your system.
      </h1>

      <p className="vq-lede vq-hero-subhead" style={{"maxWidth":"44rem","color":"var(--vq-text-2)","fontSize":"clamp(1.05rem,1.4vw,1.25rem)","lineHeight":"1.55","marginTop":"var(--vq-space-2)"}}>
        VenQore is an AI ERP builder for {BUSINESS_TYPE_CLAIM} kinds of business — retail, services and repairs, food, wholesale and light manufacturing. Describe how you operate and it assembles the system that runs it — point of sale, inventory, purchasing, invoicing and real double-entry accounting — keeping only the modules you use. Starts at $49 a month, or free on Solo, with no implementation project.
      </p>

      {/*  The interactive prompt & business picker  */}
      <div className="vq-mt-6" style={{"width":"100%"}}>
        <HeroPrompt />
        <div style={{"display":"flex","alignItems":"center","gap":"18px","flexWrap":"wrap","justifyContent":"center","marginTop":"16px","font":"500 13px/1 var(--vq-font-sans)","color":"var(--vq-text-3)"}}>
          <span>{BUSINESS_TYPE_CLAIM} business types, {SECTOR_COUNT} sectors</span><span style={{"opacity":".4"}}>·</span>
          <span>140+ modules, only yours switched on</span><span style={{"opacity":".4"}}>·</span>
          <span>58 readings, one definition each</span><span style={{"opacity":".4"}}>·</span>
          <span>8 correctness laws on every post</span>
        </div>
      </div>
    </div>

    <div className="vq-hero-foot" style={{"marginInline":"auto","width":"100%","maxWidth":"58rem","display":"flex","alignItems":"flex-end","justifyContent":"space-between","gap":"var(--vq-space-6)","padding":"var(--vq-space-8) var(--vq-space-6) var(--vq-space-10)"}}>
      <p className="vq-small" style={{"maxWidth":"26rem","color":"var(--vq-text-2)"}}>
        Describe how you actually work. VenQore assembles the system that runs it — and every
        number it produces is backed by double-entry accounting.
      </p>
      <a href="#compiler" aria-label="How it works">
        <span className="animate-bounce-slow" style={{"display":"block"}}><svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg></span>
      </a>
    </div>
  </section>

  {/*  MOVING STRIP 1: LIVE BUSINESSES & AUTOMATED TESTS TICKER  */}
  <div className="vq-ticker-strip">
    <div className="vq-ticker-track">
      <span className="vq-ticker-item"><span className="vq-ticker-dot"></span><b>{BUSINESS_TYPE_CLAIM} business types</b> across {SECTOR_COUNT} sectors, built from one engine</span>
      <span className="vq-ticker-item"><span className="vq-ticker-dot"></span><b>140+ universal features</b> ready to assemble for your business</span>
      <span className="vq-ticker-item"><span className="vq-ticker-dot"></span><b>Eight correctness laws</b> run against every reading on every release</span>
      <span className="vq-ticker-item"><span className="vq-ticker-dot"></span><b>One Core Ledger</b> under every module, so no two screens disagree</span>
      <span className="vq-ticker-item"><span className="vq-ticker-dot"></span><b>35,255 automated checks</b> verified on every commit</span>
      <span className="vq-ticker-item"><span className="vq-ticker-dot"></span><b>8 invariant rules</b> run on every transaction post</span>
      <span className="vq-ticker-item"><span className="vq-ticker-dot"></span><b>0 balance drift</b> with immutable double-entry ledger</span>
      {/*  Seamless Loop Duplicate  */}
      <span className="vq-ticker-item"><span className="vq-ticker-dot"></span><b>{BUSINESS_TYPE_CLAIM} business types</b> across {SECTOR_COUNT} sectors, built from one engine</span>
      <span className="vq-ticker-item"><span className="vq-ticker-dot"></span><b>140+ universal features</b> ready to assemble for your business</span>
      <span className="vq-ticker-item"><span className="vq-ticker-dot"></span><b>Eight correctness laws</b> run against every reading on every release</span>
      <span className="vq-ticker-item"><span className="vq-ticker-dot"></span><b>One Core Ledger</b> under every module, so no two screens disagree</span>
      <span className="vq-ticker-item"><span className="vq-ticker-dot"></span><b>35,255 automated checks</b> verified on every commit</span>
      <span className="vq-ticker-item"><span className="vq-ticker-dot"></span><b>8 invariant rules</b> run on every transaction post</span>
      <span className="vq-ticker-item"><span className="vq-ticker-dot"></span><b>0 balance drift</b> with immutable double-entry ledger</span>
    </div>
  </div>

  <div className="vq-page" style={{"position":"relative","zIndex":"10"}}>

    {/*  ══ 3 · TRUST / SOCIAL PROOF ══════════════════════════════════════  */}
    <section id="trust" data-sec="trust" className="vq-trust">
      <div data-par="-0.12" aria-hidden="true" style={{"position":"absolute","left":"50%","top":"-30%","width":"min(980px,120vw)","aspectRatio":"1","transform":"translateX(-50%)","pointerEvents":"none","background":"radial-gradient(circle,var(--vq-accent-quiet),transparent 60%)"}}></div>

      <div className="vq-sec__in">
        <div className="vq-reveal" style={{"display":"flex","flexWrap":"wrap","alignItems":"flex-end","justifyContent":"space-between","gap":"18px","marginBottom":"24px"}}>
          <span className="vq-kicker">WHAT WE CAN ACTUALLY PROVE</span>
          <span className="vq-seal">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>
            AMAZON SP-API APPROVED
          </span>
        </div>

        <div className="vq-trust__row vq-reveal">
          <div className="vq-trust__cell">
            <span className="vq-trust__n" data-count="140" data-count-suf="+" data-count-dur="900">0</span>
            <span className="vq-trust__l">FEATURES &amp; MODULES</span>
            <span className="vq-trust__s">Universal business building blocks ready to assemble for your exact workflow.</span>
          </div>
          <div className="vq-trust__cell">
            <span className="vq-trust__n" data-count="35255" data-count-suf="+">0</span>
            <span className="vq-trust__l">AUTOMATED CHECKS</span>
            <span className="vq-trust__s">Run against every reading, ledger invariant, and release build.</span>
          </div>
          <div className="vq-trust__cell">
            <span className="vq-trust__n" data-count="8" data-count-suf=" / 8" data-count-dur="900">0</span>
            <span className="vq-trust__l">CORRECTNESS LAWS ENFORCED</span>
            <span className="vq-trust__s">Every post is verified against 8 strict accounting laws before the ledger accepts it.</span>
          </div>
          <div className="vq-trust__cell">
            <span className="vq-trust__n" data-count="100" data-count-suf="%">0</span>
            <span className="vq-trust__l">DOUBLE-ENTRY GENERAL LEDGER</span>
            <span className="vq-trust__s">One immutable posting path under every screen so no two reports can ever disagree.</span>
          </div>
        </div>

        <p className="vq-trust__note vq-reveal">
          No vanity metrics or fake logos. What you can inspect and verify is our test suite, the correctness audit, and the immutable ledger architecture that runs underneath every module.
          <a className="vq-link" href="/ledger">Read the latest correctness report</a>.
        </p>
      </div>
    </section>

    {/*  ══ 4 · PROBLEM ═══════════════════════════════════════════════════  */}
    <section id="extremes" data-sec="extremes" className="vq-sec vq-sec--alt">
      <div className="vq-sec__in">
        <div className="vq-head vq-reveal">
          <span className="vq-kicker">THE PROBLEM</span>
          <h2 className="vq-sfloat">Rigid software, or hallucinated software.</h2>
          <p>For thirty years those were the only two options. One asks your business to change shape. The other invents your numbers.</p>
        </div>

        <div className="vq-reveal" style={{"marginTop":"34px","display":"flex","flexWrap":"wrap","gap":"8px","alignItems":"center"}}>
          <span style={{"font":"700 12px/1 var(--vq-font-numeric)","letterSpacing":".14em","color":"var(--vq-text-3)","marginRight":"6px"}}>MEANWHILE YOU RUN ON</span>
          <span className="vq-mocktag">A POS that can't see stock</span>
          <span className="vq-mocktag">A spreadsheet for credit</span>
          <span className="vq-mocktag">WhatsApp for orders</span>
          <span className="vq-mocktag">A book for the counter</span>
          <span className="vq-mocktag">An accountant who sees it in March</span>
        </div>

        <div style={{"marginTop":"44px","display":"grid","gridTemplateColumns":"repeat(auto-fit,minmax(300px,1fr))","gap":"20px","alignItems":"stretch"}}>
          <div className="vq-card vq-reveal" data-par="0.05" style={{"padding":"28px","borderRadius":"var(--vq-r-lg)","background":"var(--vq-surface)","border":"1px solid var(--vq-line)","display":"flex","flexDirection":"column","gap":"14px"}}>
            <span style={{"font":"700 12px/1 var(--vq-font-numeric)","letterSpacing":".14em","color":"var(--vq-text-3)"}}>LEGACY ERP / POS</span>
            <h3 style={{"margin":"0","font":"600 var(--vq-fs-h3)/var(--vq-lh-h3) var(--vq-font-display)","letterSpacing":"var(--vq-ls-h3)","color":"var(--vq-text)"}}>Clunky and inflexible</h3>
            <p style={{"margin":"0","font":"400 15px/1.6 var(--vq-font-sans)","color":"var(--vq-text-2)"}}>Five hundred pre-built menus and rigid settings. A bakery gets buried in wholesale manufacturing screens. A pharmacy finds batch expiry was never part of checkout.</p>
            <div style={{"marginTop":"auto","display":"flex","flexDirection":"column","gap":"8px","paddingTop":"16px","borderTop":"1px solid var(--vq-line-soft)"}}>
              <span style={{"display":"flex","alignItems":"center","gap":"8px","font":"500 13px/1.4 var(--vq-font-sans)","color":"var(--vq-text-3)"}}><span style={{"color":"var(--vq-danger)","fontFamily":"var(--vq-font-numeric)"}}>&minus;</span> 3 to 6 months of implementation</span>
              <span style={{"display":"flex","alignItems":"center","gap":"8px","font":"500 13px/1.4 var(--vq-font-sans)","color":"var(--vq-text-3)"}}><span style={{"color":"var(--vq-danger)","fontFamily":"var(--vq-font-numeric)"}}>&minus;</span> Hundreds of menus you will never use</span>
            </div>
          </div>

          <div className="vq-card vq-reveal" data-par="0.11" style={{"padding":"28px","borderRadius":"var(--vq-r-lg)","background":"var(--vq-surface)","border":"1px solid var(--vq-line)","display":"flex","flexDirection":"column","gap":"14px"}}>
            <span style={{"font":"700 12px/1 var(--vq-font-numeric)","letterSpacing":".14em","color":"var(--vq-text-3)"}}>GENERIC AI APP BUILDERS</span>
            <h3 style={{"margin":"0","font":"600 var(--vq-fs-h3)/var(--vq-lh-h3) var(--vq-font-display)","letterSpacing":"var(--vq-ls-h3)","color":"var(--vq-text)"}}>Hallucinated books</h3>
            <p style={{"margin":"0","font":"400 15px/1.6 var(--vq-font-sans)","color":"var(--vq-text-2)"}}>A prompt generates raw code from scratch. Raw code breaks accounting rules, invents totals, and cracks under real transaction load. You cannot run real money on it.</p>
            <div style={{"marginTop":"auto","display":"flex","flexDirection":"column","gap":"8px","paddingTop":"16px","borderTop":"1px solid var(--vq-line-soft)"}}>
              <span style={{"display":"flex","alignItems":"center","gap":"8px","font":"500 13px/1.4 var(--vq-font-sans)","color":"var(--vq-text-3)"}}><span style={{"color":"var(--vq-danger)","fontFamily":"var(--vq-font-numeric)"}}>&minus;</span> No double-entry ledger invariants</span>
              <span style={{"display":"flex","alignItems":"center","gap":"8px","font":"500 13px/1.4 var(--vq-font-sans)","color":"var(--vq-text-3)"}}><span style={{"color":"var(--vq-danger)","fontFamily":"var(--vq-font-numeric)"}}>&minus;</span> Brittle code that cracks under changes</span>
            </div>
          </div>

          <div className="vq-card vq-reveal" data-par="0.17" style={{"position":"relative","overflow":"hidden","padding":"28px","borderRadius":"var(--vq-r-lg)","background":"linear-gradient(135deg, var(--vq-teal-600) 0%, var(--vq-teal-700) 55%, var(--vq-teal-900) 100%)","boxShadow":"var(--vq-glow-accent-strong)","color":"#fff","display":"flex","flexDirection":"column","gap":"14px"}}>
            <span style={{"position":"relative","font":"700 12px/1 var(--vq-font-numeric)","letterSpacing":".14em","color":"rgba(255,255,255,.78)"}}>VENQORE · THE AI COMPILER</span>
            <h3 style={{"position":"relative","margin":"0","font":"600 var(--vq-fs-h3)/var(--vq-lh-h3) var(--vq-font-display)","letterSpacing":"var(--vq-ls-h3)"}}>Both, without the trade</h3>
            <p style={{"position":"relative","margin":"0","font":"400 15px/1.6 var(--vq-font-sans)","color":"rgba(255,255,255,.9)"}}>AI compiles your intent into parameterized, battle-tested financial modules. The agility of natural language, the arithmetic of hardened double-entry accounting.</p>
            <div style={{"position":"relative","marginTop":"auto","display":"flex","flexDirection":"column","gap":"8px","paddingTop":"16px","borderTop":"1px solid rgba(255,255,255,.24)"}}>
              <span style={{"display":"flex","alignItems":"center","gap":"8px","font":"500 13px/1.4 var(--vq-font-sans)","color":"rgba(255,255,255,.92)"}}><span style={{"fontFamily":"var(--vq-font-numeric)"}}>+</span> 100% custom, 0% hallucinated</span>
              <span style={{"display":"flex","alignItems":"center","gap":"8px","font":"500 13px/1.4 var(--vq-font-sans)","color":"rgba(255,255,255,.92)"}}><span style={{"fontFamily":"var(--vq-font-numeric)"}}>+</span> Live in minutes, not quarters</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/*  ══ 5 · CORE VALUE PROPOSITION ════════════════════════════════════  */}
    <section id="value" data-sec="value" className="vq-sec vq-sec--base">
      <div className="vq-sec__in">
        <div className="vq-head vq-head--center vq-reveal">
          <span className="vq-kicker">THE CORE VALUE</span>
          <h2 className="vq-sfloat">Flexible where it should be. Rigid where it must be.</h2>
          <p>The AI decides what your system looks like. It never decides what your numbers say. Those are two different jobs, and VenQore is the only one that keeps them apart.</p>
        </div>

        <div className="vq-balance vq-reveal" style={{"marginTop":"44px"}}>
          <div style={{"display":"flex","flexDirection":"column","gap":"8px","textAlign":"right"}}>
            <span className="vq-balance__l">TOTAL DEBITS</span>
            <span className="vq-balance__v">Rs <span data-count="6636549.20" data-count-dec="2">0</span></span>
          </div>
          <span className="vq-balance__eq">=</span>
          <div style={{"display":"flex","flexDirection":"column","gap":"8px"}}>
            <span className="vq-balance__l">TOTAL CREDITS</span>
            <span className="vq-balance__v">Rs <span data-count="6636549.20" data-count-dec="2">0</span></span>
          </div>
        </div>
        <p className="vq-reveal" style={{"margin":"16px auto 0","maxWidth":"60ch","textAlign":"center","font":"500 13.5px/1.6 var(--vq-font-sans)","color":"var(--vq-text-3)"}}>
          Live from Core Ledger. Debits equal credits or the transaction is refused — that rule lives in the engine, not in a prompt.
        </p>
      </div>
    </section>

    {/*  ══ 5b · FOUR THINGS A COMPILER DOES (pinned horizontal track) ════  */}
    <section id="tenx" data-sec="tenx" data-track="1" style={{"position":"relative","height":"380vh","background":"var(--vq-bg-alt)"}}>
      <div style={{"position":"sticky","top":"0","height":"100vh","overflow":"hidden","display":"flex","flexDirection":"column","justifyContent":"center"}}>
        <div style={{"maxWidth":"1240px","width":"100%","margin":"0 auto","padding":"0 24px 26px","display":"flex","alignItems":"flex-end","justifyContent":"space-between","gap":"20px","flexWrap":"wrap"}}>
          <div style={{"display":"flex","flexDirection":"column","gap":"12px"}}>
            <span className="vq-kicker">WHAT CHANGES ON MONDAY</span>
            <h2 style={{"margin":"0","maxWidth":"22ch","font":"600 var(--vq-fs-h1)/var(--vq-lh-h1) var(--vq-font-display)","fontSize":"clamp(27px,4.2vw,var(--vq-fs-h1))","letterSpacing":"var(--vq-ls-h1)","color":"var(--vq-text)"}}>Four things a compiler does that software cannot.</h2>
          </div>
          <span style={{"display":"flex","alignItems":"center","gap":"10px","font":"600 12px/1 var(--vq-font-numeric)","letterSpacing":".12em","color":"var(--vq-text-3)","paddingBottom":"6px"}}>
            KEEP SCROLLING
            <span style={{"width":"54px","height":"3px","background":"var(--vq-line-strong)","position":"relative","overflow":"hidden","borderRadius":"999px"}}>
              <span data-trackbar="1" style={{"position":"absolute","inset":"0","width":"0%","background":"var(--vq-accent)","borderRadius":"999px"}}></span>
            </span>
          </span>
        </div>
        <div data-trackrow="1" style={{"display":"flex","gap":"24px","padding":"0 clamp(24px,8vw,120px)","willChange":"transform"}}>

          <div className="vq-card vq-tile" style={{"flex":"0 0 auto","width":"clamp(300px,38vw,520px)","padding":"30px","borderRadius":"var(--vq-r-xl)","background":"var(--vq-surface)","border":"1px solid var(--vq-line)","boxShadow":"var(--vq-elev-1)","display":"flex","flexDirection":"column","gap":"16px"}}>
            <span style={{"font":"600 44px/1 var(--vq-font-numeric)","letterSpacing":"-.03em","color":"var(--vq-accent-text)"}}>01</span>
            <h3 style={{"margin":"0","font":"600 var(--vq-fs-h2)/var(--vq-lh-h2) var(--vq-font-display)","letterSpacing":"var(--vq-ls-h2)","color":"var(--vq-text)","textWrap":"balance"}}>Minutes instead of months</h3>
            <p style={{"margin":"0","font":"400 15.5px/1.62 var(--vq-font-sans)","color":"var(--vq-text-2)"}}>No implementers, no custom-field mapping, no database chart to draw. You write how you operate and the system exists.</p>
            <div style={{"marginTop":"auto","display":"grid","gridTemplateColumns":"auto 1fr","gap":"8px 12px","paddingTop":"18px","borderTop":"1px solid var(--vq-line-soft)","font":"500 13px/1.5 var(--vq-font-sans)"}}>
              <span style={{"font":"700 10px/1.5 var(--vq-font-numeric)","letterSpacing":".12em","color":"var(--vq-text-3)"}}>BEFORE</span><span style={{"color":"var(--vq-text-3)"}}>3&ndash;6 months of implementation</span>
              <span style={{"font":"700 10px/1.5 var(--vq-font-numeric)","letterSpacing":".12em","color":"var(--vq-accent-text)"}}>AFTER</span><span style={{"color":"var(--vq-text)"}}>Scanning barcodes on day one</span>
            </div>
          </div>

          <div className="vq-card vq-tile" style={{"flex":"0 0 auto","width":"clamp(300px,38vw,520px)","padding":"30px","borderRadius":"var(--vq-r-xl)","background":"var(--vq-surface)","border":"1px solid var(--vq-line)","boxShadow":"var(--vq-elev-1)","display":"flex","flexDirection":"column","gap":"16px"}}>
            <span style={{"font":"600 44px/1 var(--vq-font-numeric)","letterSpacing":"-.03em","color":"var(--vq-accent-text)"}}>02</span>
            <h3 style={{"margin":"0","font":"600 var(--vq-fs-h2)/var(--vq-lh-h2) var(--vq-font-display)","letterSpacing":"var(--vq-ls-h2)","color":"var(--vq-text)","textWrap":"balance"}}>Only the software you use</h3>
            <p style={{"margin":"0","font":"400 15.5px/1.62 var(--vq-font-sans)","color":"var(--vq-text-2)"}}>A boutique gets variant matrixes and fast checkout. A wholesaler gets container logistics and credit aging. Neither sees the other's screens.</p>
            <div style={{"marginTop":"auto","display":"grid","gridTemplateColumns":"auto 1fr","gap":"8px 12px","paddingTop":"18px","borderTop":"1px solid var(--vq-line-soft)","font":"500 13px/1.5 var(--vq-font-sans)"}}>
              <span style={{"font":"700 10px/1.5 var(--vq-font-numeric)","letterSpacing":".12em","color":"var(--vq-text-3)"}}>BEFORE</span><span style={{"color":"var(--vq-text-3)"}}>500 menus, 40 of them yours</span>
              <span style={{"font":"700 10px/1.5 var(--vq-font-numeric)","letterSpacing":".12em","color":"var(--vq-accent-text)"}}>AFTER</span><span style={{"color":"var(--vq-text)"}}>Every screen earns its place</span>
            </div>
          </div>

          <div className="vq-card vq-tile" style={{"flex":"0 0 auto","width":"clamp(300px,38vw,520px)","padding":"30px","borderRadius":"var(--vq-r-xl)","background":"var(--vq-surface)","border":"1px solid var(--vq-line)","boxShadow":"var(--vq-elev-1)","display":"flex","flexDirection":"column","gap":"16px"}}>
            <span style={{"font":"600 44px/1 var(--vq-font-numeric)","letterSpacing":"-.03em","color":"var(--vq-accent-text)"}}>03</span>
            <h3 style={{"margin":"0","font":"600 var(--vq-fs-h2)/var(--vq-lh-h2) var(--vq-font-display)","letterSpacing":"var(--vq-ls-h2)","color":"var(--vq-text)","textWrap":"balance"}}>The books cannot drift</h3>
            <p style={{"margin":"0","font":"400 15.5px/1.62 var(--vq-font-sans)","color":"var(--vq-text-2)"}}>The interface is generated. The ledger underneath is immutable double-entry, checked seven ways before anything posts.</p>
            <div style={{"marginTop":"auto","display":"grid","gridTemplateColumns":"auto 1fr","gap":"8px 12px","paddingTop":"18px","borderTop":"1px solid var(--vq-line-soft)","font":"500 13px/1.5 var(--vq-font-sans)"}}>
              <span style={{"font":"700 10px/1.5 var(--vq-font-numeric)","letterSpacing":".12em","color":"var(--vq-text-3)"}}>BEFORE</span><span style={{"color":"var(--vq-text-3)"}}>Reconciliation is archaeology</span>
              <span style={{"font":"700 10px/1.5 var(--vq-font-numeric)","letterSpacing":".12em","color":"var(--vq-accent-text)"}}>AFTER</span><span style={{"color":"var(--vq-text)"}}>Debits equal credits, always</span>
            </div>
          </div>

          <div className="vq-card vq-tile" style={{"flex":"0 0 auto","width":"clamp(300px,38vw,520px)","padding":"30px","borderRadius":"var(--vq-r-xl)","background":"var(--vq-surface)","border":"1px solid var(--vq-line)","boxShadow":"var(--vq-elev-1)","display":"flex","flexDirection":"column","gap":"16px"}}>
            <span style={{"font":"600 44px/1 var(--vq-font-numeric)","letterSpacing":"-.03em","color":"var(--vq-accent-text)"}}>04</span>
            <h3 style={{"margin":"0","font":"600 var(--vq-fs-h2)/var(--vq-lh-h2) var(--vq-font-display)","letterSpacing":"var(--vq-ls-h2)","color":"var(--vq-text)","textWrap":"balance"}}>Growth is a sentence</h3>
            <p style={{"margin":"0","font":"400 15.5px/1.62 var(--vq-font-sans)","color":"var(--vq-text-2)"}}>&ldquo;Add wholesale distribution with warehouse transfer workflows.&rdquo; The compiler re-wires your topology without downtime.</p>
            <div style={{"marginTop":"auto","display":"grid","gridTemplateColumns":"auto 1fr","gap":"8px 12px","paddingTop":"18px","borderTop":"1px solid var(--vq-line-soft)","font":"500 13px/1.5 var(--vq-font-sans)"}}>
              <span style={{"font":"700 10px/1.5 var(--vq-font-numeric)","letterSpacing":".12em","color":"var(--vq-text-3)"}}>BEFORE</span><span style={{"color":"var(--vq-text-3)"}}>A new project, a new quote</span>
              <span style={{"font":"700 10px/1.5 var(--vq-font-numeric)","letterSpacing":".12em","color":"var(--vq-accent-text)"}}>AFTER</span><span style={{"color":"var(--vq-text)"}}>A new module, same afternoon</span>
            </div>
          </div>

        </div>
      </div>
    </section>

    {/*  ══ 6 · HOW IT WORKS — the COMPILATION PASS theatre (preserved) ══  */}
  {/*  SECTION B: SECOND SECTION - 5-STAGE COMPILER THEATER (PRESERVED)  */}
  <section id="compiler" data-sec="compiler" data-theater="1" style={{"position":"relative","height":"600vh","background":"var(--vq-bg)","zIndex":"10"}}>
    <div style={{"position":"sticky","top":"0","height":"100vh","overflow":"hidden","display":"flex","flexDirection":"column"}}>
      <div style={{"position":"absolute","inset":"0","background":"radial-gradient(70% 60% at 50% 0%, rgba(11, 170, 143, 0.16), transparent 70%)"}}></div>

      <div data-thgrid="1" style={{"position":"relative","flex":"1","maxWidth":"1240px","width":"100%","margin":"0 auto","padding":"96px 28px 40px","display":"grid","gridTemplateColumns":"250px 1fr","gap":"40px","alignItems":"start","minHeight":"0"}}>

        <div style={{"display":"flex","flexDirection":"column","gap":"4px","paddingTop":"4px"}}>
          <span style={{"font":"700 12px/1 var(--vq-font-numeric)","letterSpacing":".14em","color":"var(--vq-accent-text)","marginBottom":"16px"}}>COMPILATION PASS</span>
          
          <div data-stagerow="0" style={{"display":"grid","gridTemplateColumns":"34px 1fr","gap":"12px","padding":"10px 0","opacity":"1","transition":"opacity var(--vq-dur-3) var(--vq-ease-out)"}}>
            <span style={{"font":"600 12px/1.6 var(--vq-font-numeric)","color":"var(--vq-text-3)"}}>01</span>
            <span style={{"display":"flex","flexDirection":"column","gap":"3px"}}>
              <span style={{"font":"600 15px/1.2 var(--vq-font-display)","letterSpacing":"-.02em","color":"var(--vq-text)"}}>Intent</span>
              <span style={{"font":"500 12.5px/1.45 var(--vq-font-sans)","color":"var(--vq-text-2)"}}>You describe how you operate</span>
              <span data-stagebar="0" style={{"height":"2px","width":"0%","marginTop":"5px","borderRadius":"999px","background":"linear-gradient(90deg, #0BAA8F, #59DBC0)"}}></span>
            </span>
          </div>

          <div data-stagerow="1" style={{"display":"grid","gridTemplateColumns":"34px 1fr","gap":"12px","padding":"10px 0","opacity":".34","transition":"opacity var(--vq-dur-3) var(--vq-ease-out)"}}>
            <span style={{"font":"600 12px/1.6 var(--vq-font-numeric)","color":"var(--vq-text-3)"}}>02</span>
            <span style={{"display":"flex","flexDirection":"column","gap":"3px"}}>
              <span style={{"font":"600 15px/1.2 var(--vq-font-display)","letterSpacing":"-.02em","color":"var(--vq-text)"}}>Parse</span>
              <span style={{"font":"500 12.5px/1.45 var(--vq-font-sans)","color":"var(--vq-text-2)"}}>Entities, workflows, financial routes</span>
              <span data-stagebar="1" style={{"height":"2px","width":"0%","marginTop":"5px","borderRadius":"999px","background":"linear-gradient(90deg, #0BAA8F, #59DBC0)"}}></span>
            </span>
          </div>

          <div data-stagerow="2" style={{"display":"grid","gridTemplateColumns":"34px 1fr","gap":"12px","padding":"10px 0","opacity":".34","transition":"opacity var(--vq-dur-3) var(--vq-ease-out)"}}>
            <span style={{"font":"600 12px/1.6 var(--vq-font-numeric)","color":"var(--vq-text-3)"}}>03</span>
            <span style={{"display":"flex","flexDirection":"column","gap":"3px"}}>
              <span style={{"font":"600 15px/1.2 var(--vq-font-display)","letterSpacing":"-.02em","color":"var(--vq-text)"}}>Select</span>
              <span style={{"font":"500 12.5px/1.45 var(--vq-font-sans)","color":"var(--vq-text-2)"}}>Proven engines, parameterized</span>
              <span data-stagebar="2" style={{"height":"2px","width":"0%","marginTop":"5px","borderRadius":"999px","background":"linear-gradient(90deg, #0BAA8F, #59DBC0)"}}></span>
            </span>
          </div>

          <div data-stagerow="3" style={{"display":"grid","gridTemplateColumns":"34px 1fr","gap":"12px","padding":"10px 0","opacity":".34","transition":"opacity var(--vq-dur-3) var(--vq-ease-out)"}}>
            <span style={{"font":"600 12px/1.6 var(--vq-font-numeric)","color":"var(--vq-text-3)"}}>04</span>
            <span style={{"display":"flex","flexDirection":"column","gap":"3px"}}>
              <span style={{"font":"600 15px/1.2 var(--vq-font-display)","letterSpacing":"-.02em","color":"var(--vq-text)"}}>Wire</span>
              <span style={{"font":"500 12.5px/1.45 var(--vq-font-sans)","color":"var(--vq-text-2)"}}>Routes bound to the double-entry core</span>
              <span data-stagebar="3" style={{"height":"2px","width":"0%","marginTop":"5px","borderRadius":"999px","background":"linear-gradient(90deg, #0BAA8F, #59DBC0)"}}></span>
            </span>
          </div>

          <div data-stagerow="4" style={{"display":"grid","gridTemplateColumns":"34px 1fr","gap":"12px","padding":"10px 0","opacity":".34","transition":"opacity var(--vq-dur-3) var(--vq-ease-out)"}}>
            <span style={{"font":"600 12px/1.6 var(--vq-font-numeric)","color":"var(--vq-text-3)"}}>05</span>
            <span style={{"display":"flex","flexDirection":"column","gap":"3px"}}>
              <span style={{"font":"600 15px/1.2 var(--vq-font-display)","letterSpacing":"-.02em","color":"var(--vq-text)"}}>Live</span>
              <span style={{"font":"500 12.5px/1.45 var(--vq-font-sans)","color":"var(--vq-text-2)"}}>Your system, running</span>
              <span data-stagebar="4" style={{"height":"2px","width":"0%","marginTop":"5px","borderRadius":"999px","background":"linear-gradient(90deg, #0BAA8F, #59DBC0)"}}></span>
            </span>
          </div>
        </div>

        <div style={{"position":"relative","height":"min(620px, 66vh)","borderRadius":"var(--vq-r-2xl, 24px)","border":"1px solid var(--vq-line)","background":"var(--vq-surface)","boxShadow":"var(--vq-elev-3)","overflow":"hidden"}}>
          <div style={{"display":"flex","alignItems":"center","gap":"8px","padding":"14px 18px","borderBottom":"1px solid var(--vq-line-soft)"}}>
            <span style={{"width":"9px","height":"9px","borderRadius":"999px","background":"#FF8A6B"}}></span>
            <span style={{"width":"9px","height":"9px","borderRadius":"999px","background":"#FFCD5B"}}></span>
            <span style={{"width":"9px","height":"9px","borderRadius":"999px","background":"#A9E34B"}}></span>
            <span data-frametitle="1" style={{"marginLeft":"12px","font":"600 12px/1 var(--vq-font-numeric)","letterSpacing":".12em","color":"var(--vq-text-3)"}}>BLUEPRINT · READING INTENT</span>
            <span style={{"marginLeft":"auto","font":"600 12px/1 var(--vq-font-numeric)","letterSpacing":".1em","color":"var(--vq-accent-text)"}}>LIVE</span>
          </div>

          <div style={{"position":"relative","height":"calc(100% - 45px)"}}>

            {/*  Stage 01: Intent  */}
            <div data-layer="0" style={{"position":"absolute","inset":"0","padding":"44px 48px","display":"flex","flexDirection":"column","justifyContent":"center","gap":"24px","opacity":"1"}}>
              <span style={{"font":"700 12px/1 var(--vq-font-numeric)","letterSpacing":".14em","color":"var(--vq-text-3)"}}>THE OWNER TYPES</span>
              <p style={{"margin":"0","font":"600 clamp(22px, 2.5vw, 34px)/1.32 var(--vq-font-display)","letterSpacing":"-.028em","color":"var(--vq-text)","maxWidth":"30ch"}}><span data-typed="1"></span><span style={{"display":"inline-block","width":"3px","height":"1em","marginLeft":"4px","verticalAlign":"-0.12em","background":"var(--vq-accent)","animation":"vqBlink 1s steps(1) infinite"}}></span></p>
              <span style={{"font":"500 14px/1.5 var(--vq-font-sans)","color":"var(--vq-text-2)"}}>No forms. No implementation consultant. One paragraph in your own words.</span>
            </div>

            {/*  Stage 02: Parse  */}
            <div data-layer="1" style={{"position":"absolute","inset":"0","padding":"40px 48px","display":"flex","flexDirection":"column","justifyContent":"center","gap":"20px","opacity":"0"}}>
              <span style={{"font":"700 12px/1 var(--vq-font-numeric)","letterSpacing":".14em","color":"var(--vq-text-3)"}}>DOMAIN PARSE</span>
              <div style={{"display":"flex","flexDirection":"column","gap":"12px"}}>
                <div style={{"display":"flex","flexDirection":"column","gap":"6px"}}>
                  <span style={{"font":"600 12px/1 var(--vq-font-sans)","color":"var(--vq-text)"}}>ENTITIES</span>
                  <div style={{"display":"flex","flexWrap":"wrap","gap":"7px"}}>
                    <span data-token="0" style={{"display":"inline-flex","alignItems":"center","gap":"7px","padding":"6px 12px","borderRadius":"999px","border":"1px solid var(--vq-line)","background":"var(--vq-sunken)","font":"500 12.5px/1 var(--vq-font-sans)","color":"var(--vq-text)","opacity":"0","transform":"translateY(8px) scale(.96)","transition":"all 320ms var(--vq-ease-spring)"}}><span style={{"width":"5px","height":"5px","borderRadius":"999px","background":"var(--vq-accent)"}}></span>Drugs &amp; SKUs</span>
                    <span data-token="1" style={{"display":"inline-flex","alignItems":"center","gap":"7px","padding":"6px 12px","borderRadius":"999px","border":"1px solid var(--vq-line)","background":"var(--vq-sunken)","font":"500 12.5px/1 var(--vq-font-sans)","color":"var(--vq-text)","opacity":"0","transform":"translateY(8px) scale(.96)","transition":"all 320ms var(--vq-ease-spring)"}}><span style={{"width":"5px","height":"5px","borderRadius":"999px","background":"var(--vq-accent)"}}></span>Batches</span>
                    <span data-token="2" style={{"display":"inline-flex","alignItems":"center","gap":"7px","padding":"6px 12px","borderRadius":"999px","border":"1px solid var(--vq-line)","background":"var(--vq-sunken)","font":"500 12.5px/1 var(--vq-font-sans)","color":"var(--vq-text)","opacity":"0","transform":"translateY(8px) scale(.96)","transition":"all 320ms var(--vq-ease-spring)"}}><span style={{"width":"5px","height":"5px","borderRadius":"999px","background":"var(--vq-accent)"}}></span>Expiry dates</span>
                    <span data-token="3" style={{"display":"inline-flex","alignItems":"center","gap":"7px","padding":"6px 12px","borderRadius":"999px","border":"1px solid var(--vq-line)","background":"var(--vq-sunken)","font":"500 12.5px/1 var(--vq-font-sans)","color":"var(--vq-text)","opacity":"0","transform":"translateY(8px) scale(.96)","transition":"all 320ms var(--vq-ease-spring)"}}><span style={{"width":"5px","height":"5px","borderRadius":"999px","background":"var(--vq-accent)"}}></span>Branches</span>
                    <span data-token="4" style={{"display":"inline-flex","alignItems":"center","gap":"7px","padding":"6px 12px","borderRadius":"999px","border":"1px solid var(--vq-line)","background":"var(--vq-sunken)","font":"500 12.5px/1 var(--vq-font-sans)","color":"var(--vq-text)","opacity":"0","transform":"translateY(8px) scale(.96)","transition":"all 320ms var(--vq-ease-spring)"}}><span style={{"width":"5px","height":"5px","borderRadius":"999px","background":"var(--vq-accent)"}}></span>Distributors</span>
                  </div>
                </div>
                <div style={{"display":"flex","flexDirection":"column","gap":"6px"}}>
                  <span style={{"font":"600 12px/1 var(--vq-font-sans)","color":"var(--vq-text)"}}>WORKFLOWS</span>
                  <div style={{"display":"flex","flexWrap":"wrap","gap":"7px"}}>
                    <span data-token="5" style={{"display":"inline-flex","alignItems":"center","gap":"7px","padding":"6px 12px","borderRadius":"999px","border":"1px solid var(--vq-line)","background":"var(--vq-sunken)","font":"500 12.5px/1 var(--vq-font-sans)","color":"var(--vq-text)","opacity":"0","transform":"translateY(8px) scale(.96)","transition":"all 320ms var(--vq-ease-spring)"}}><span style={{"width":"5px","height":"5px","borderRadius":"999px","background":"#55C4EC"}}></span>Counter checkout</span>
                    <span data-token="6" style={{"display":"inline-flex","alignItems":"center","gap":"7px","padding":"6px 12px","borderRadius":"999px","border":"1px solid var(--vq-line)","background":"var(--vq-sunken)","font":"500 12.5px/1 var(--vq-font-sans)","color":"var(--vq-text)","opacity":"0","transform":"translateY(8px) scale(.96)","transition":"all 320ms var(--vq-ease-spring)"}}><span style={{"width":"5px","height":"5px","borderRadius":"999px","background":"#55C4EC"}}></span>Batch-first picking</span>
                    <span data-token="7" style={{"display":"inline-flex","alignItems":"center","gap":"7px","padding":"6px 12px","borderRadius":"999px","border":"1px solid var(--vq-line)","background":"var(--vq-sunken)","font":"500 12.5px/1 var(--vq-font-sans)","color":"var(--vq-text)","opacity":"0","transform":"translateY(8px) scale(.96)","transition":"all 320ms var(--vq-ease-spring)"}}><span style={{"width":"5px","height":"5px","borderRadius":"999px","background":"#55C4EC"}}></span>Branch transfers</span>
                    <span data-token="8" style={{"display":"inline-flex","alignItems":"center","gap":"7px","padding":"6px 12px","borderRadius":"999px","border":"1px solid var(--vq-line)","background":"var(--vq-sunken)","font":"500 12.5px/1 var(--vq-font-sans)","color":"var(--vq-text)","opacity":"0","transform":"translateY(8px) scale(.96)","transition":"all 320ms var(--vq-ease-spring)"}}><span style={{"width":"5px","height":"5px","borderRadius":"999px","background":"#55C4EC"}}></span>Expiry write-off</span>
                  </div>
                </div>
                <div style={{"display":"flex","flexDirection":"column","gap":"6px"}}>
                  <span style={{"font":"600 12px/1 var(--vq-font-sans)","color":"var(--vq-text)"}}>FINANCIAL ROUTES</span>
                  <div style={{"display":"flex","flexWrap":"wrap","gap":"7px"}}>
                    <span data-token="9" style={{"display":"inline-flex","alignItems":"center","gap":"7px","padding":"6px 12px","borderRadius":"999px","border":"1px solid var(--vq-line)","background":"var(--vq-sunken)","font":"500 12.5px/1 var(--vq-font-sans)","color":"var(--vq-text)","opacity":"0","transform":"translateY(8px) scale(.96)","transition":"all 320ms var(--vq-ease-spring)"}}><span style={{"width":"5px","height":"5px","borderRadius":"999px","background":"#FFCD5B"}}></span>Accounts payable · 30-day terms</span>
                    <span data-token="10" style={{"display":"inline-flex","alignItems":"center","gap":"7px","padding":"6px 12px","borderRadius":"999px","border":"1px solid var(--vq-line)","background":"var(--vq-sunken)","font":"500 12.5px/1 var(--vq-font-sans)","color":"var(--vq-text)","opacity":"0","transform":"translateY(8px) scale(.96)","transition":"all 320ms var(--vq-ease-spring)"}}><span style={{"width":"5px","height":"5px","borderRadius":"999px","background":"#FFCD5B"}}></span>Sales tax on invoice</span>
                    <span data-token="11" style={{"display":"inline-flex","alignItems":"center","gap":"7px","padding":"6px 12px","borderRadius":"999px","border":"1px solid var(--vq-line)","background":"var(--vq-sunken)","font":"500 12.5px/1 var(--vq-font-sans)","color":"var(--vq-text)","opacity":"0","transform":"translateY(8px) scale(.96)","transition":"all 320ms var(--vq-ease-spring)"}}><span style={{"width":"5px","height":"5px","borderRadius":"999px","background":"#FFCD5B"}}></span>Inventory valuation</span>
                  </div>
                </div>
              </div>
            </div>

            {/*  Stage 03: Select  */}
            <div data-layer="2" style={{"position":"absolute","inset":"0","padding":"36px 44px","display":"flex","flexDirection":"column","justifyContent":"center","gap":"18px","opacity":"0"}}>
              <div style={{"display":"flex","alignItems":"baseline","justifyContent":"space-between","gap":"16px"}}>
                <span style={{"font":"700 12px/1 var(--vq-font-numeric)","letterSpacing":".14em","color":"var(--vq-text-3)"}}>ENGINE SELECTION</span>
                <span style={{"font":"500 12px/1 var(--vq-font-sans)","color":"var(--vq-text-2)"}}><span data-selcount="1" style={{"fontFamily":"var(--vq-font-numeric)","color":"var(--vq-accent-text)"}}>0</span> of 24 engines wired</span>
              </div>
              <div style={{"display":"grid","gridTemplateColumns":"repeat(4, 1fr)","gap":"10px"}}>
                <div data-engine="0" data-on="1" style={{"padding":"12px 14px","borderRadius":"var(--vq-r-md, 12px)","border":"1px solid var(--vq-line)","background":"var(--vq-sunken)","opacity":".28","transition":"all 380ms var(--vq-ease-spring)"}}><span style={{"display":"block","font":"600 13px/1.25 var(--vq-font-display)","color":"var(--vq-text)"}}>POS checkout</span><span style={{"display":"block","marginTop":"4px","font":"500 10.5px/1.3 var(--vq-font-numeric)","color":"var(--vq-accent-text)"}}>SELECTED</span></div>
                <div data-engine="1" data-on="1" style={{"padding":"12px 14px","borderRadius":"var(--vq-r-md, 12px)","border":"1px solid var(--vq-line)","background":"var(--vq-sunken)","opacity":".28","transition":"all 380ms var(--vq-ease-spring)"}}><span style={{"display":"block","font":"600 13px/1.25 var(--vq-font-display)","color":"var(--vq-text)"}}>Batch &amp; expiry</span><span style={{"display":"block","marginTop":"4px","font":"500 10.5px/1.3 var(--vq-font-numeric)","color":"var(--vq-accent-text)"}}>SELECTED</span></div>
                <div data-engine="2" data-on="1" style={{"padding":"12px 14px","borderRadius":"var(--vq-r-md, 12px)","border":"1px solid var(--vq-line)","background":"var(--vq-sunken)","opacity":".28","transition":"all 380ms var(--vq-ease-spring)"}}><span style={{"display":"block","font":"600 13px/1.25 var(--vq-font-display)","color":"var(--vq-text)"}}>Stock ledger</span><span style={{"display":"block","marginTop":"4px","font":"500 10.5px/1.3 var(--vq-font-numeric)","color":"var(--vq-accent-text)"}}>SELECTED</span></div>
                <div data-engine="3" data-on="0" style={{"padding":"12px 14px","borderRadius":"var(--vq-r-md, 12px)","border":"1px solid var(--vq-line)","background":"var(--vq-sunken)","opacity":".12"}}><span style={{"display":"block","font":"600 13px/1.25 var(--vq-font-display)","color":"var(--vq-text-3)"}}>Manufacturing BOM</span><span style={{"display":"block","marginTop":"4px","font":"500 10.5px/1.3 var(--vq-font-numeric)","color":"var(--vq-text-3)"}}>not needed</span></div>
                <div data-engine="4" data-on="1" style={{"padding":"12px 14px","borderRadius":"var(--vq-r-md, 12px)","border":"1px solid var(--vq-line)","background":"var(--vq-sunken)","opacity":".28","transition":"all 380ms var(--vq-ease-spring)"}}><span style={{"display":"block","font":"600 13px/1.25 var(--vq-font-display)","color":"var(--vq-text)"}}>Purchases &amp; credit</span><span style={{"display":"block","marginTop":"4px","font":"500 10.5px/1.3 var(--vq-font-numeric)","color":"var(--vq-accent-text)"}}>SELECTED</span></div>
                <div data-engine="5" data-on="1" style={{"padding":"12px 14px","borderRadius":"var(--vq-r-md, 12px)","border":"1px solid var(--vq-line)","background":"var(--vq-sunken)","opacity":".28","transition":"all 380ms var(--vq-ease-spring)"}}><span style={{"display":"block","font":"600 13px/1.25 var(--vq-font-display)","color":"var(--vq-text)"}}>Branch transfers</span><span style={{"display":"block","marginTop":"4px","font":"500 10.5px/1.3 var(--vq-font-numeric)","color":"var(--vq-accent-text)"}}>SELECTED</span></div>
                <div data-engine="6" data-on="0" style={{"padding":"12px 14px","borderRadius":"var(--vq-r-md, 12px)","border":"1px solid var(--vq-line)","background":"var(--vq-sunken)","opacity":".12"}}><span style={{"display":"block","font":"600 13px/1.25 var(--vq-font-display)","color":"var(--vq-text-3)"}}>Payroll</span><span style={{"display":"block","marginTop":"4px","font":"500 10.5px/1.3 var(--vq-font-numeric)","color":"var(--vq-text-3)"}}>not needed</span></div>
                <div data-engine="7" data-on="0" style={{"padding":"12px 14px","borderRadius":"var(--vq-r-md, 12px)","border":"1px solid var(--vq-line)","background":"var(--vq-sunken)","opacity":".12"}}><span style={{"display":"block","font":"600 13px/1.25 var(--vq-font-display)","color":"var(--vq-text-3)"}}>Container logistics</span><span style={{"display":"block","marginTop":"4px","font":"500 10.5px/1.3 var(--vq-font-numeric)","color":"var(--vq-text-3)"}}>not needed</span></div>
                <div data-engine="8" data-on="1" style={{"padding":"12px 14px","borderRadius":"var(--vq-r-md, 12px)","border":"1px solid var(--vq-line)","background":"var(--vq-sunken)","opacity":".28","transition":"all 380ms var(--vq-ease-spring)"}}><span style={{"display":"block","font":"600 13px/1.25 var(--vq-font-display)","color":"var(--vq-text)"}}>Core Ledger</span><span style={{"display":"block","marginTop":"4px","font":"500 10.5px/1.3 var(--vq-font-numeric)","color":"var(--vq-accent-text)"}}>ALWAYS ON</span></div>
                <div data-engine="9" data-on="0" style={{"padding":"12px 14px","borderRadius":"var(--vq-r-md, 12px)","border":"1px solid var(--vq-line)","background":"var(--vq-sunken)","opacity":".12"}}><span style={{"display":"block","font":"600 13px/1.25 var(--vq-font-display)","color":"var(--vq-text-3)"}}>Table service</span><span style={{"display":"block","marginTop":"4px","font":"500 10.5px/1.3 var(--vq-font-numeric)","color":"var(--vq-text-3)"}}>not needed</span></div>
                <div data-engine="10" data-on="0" style={{"padding":"12px 14px","borderRadius":"var(--vq-r-md, 12px)","border":"1px solid var(--vq-line)","background":"var(--vq-sunken)","opacity":".12"}}><span style={{"display":"block","font":"600 13px/1.25 var(--vq-font-display)","color":"var(--vq-text-3)"}}>Tier pricing matrix</span><span style={{"display":"block","marginTop":"4px","font":"500 10.5px/1.3 var(--vq-font-numeric)","color":"var(--vq-text-3)"}}>not needed</span></div>
                <div data-engine="11" data-on="0" style={{"padding":"12px 14px","borderRadius":"var(--vq-r-md, 12px)","border":"1px solid var(--vq-line)","background":"var(--vq-sunken)","opacity":".12"}}><span style={{"display":"block","font":"600 13px/1.25 var(--vq-font-display)","color":"var(--vq-text-3)"}}>Channel sync</span><span style={{"display":"block","marginTop":"4px","font":"500 10.5px/1.3 var(--vq-font-numeric)","color":"var(--vq-text-3)"}}>not needed</span></div>
              </div>
            </div>

            {/*  Stage 04: Wire  */}
            <div data-layer="3" style={{"position":"absolute","inset":"0","padding":"34px 44px","opacity":"0"}}>
              <span style={{"font":"700 12px/1 var(--vq-font-numeric)","letterSpacing":".14em","color":"var(--vq-text-3)"}}>TOPOLOGY · ROUTES BOUND TO CORE LEDGER</span>
              <div style={{"position":"relative","height":"calc(100% - 26px)","marginTop":"18px","display":"grid","gridTemplateColumns":"1fr 1fr 1.15fr","gap":"40px","alignItems":"center"}}>
                <svg data-wires="1" style={{"position":"absolute","inset":"0","width":"100%","height":"100%","pointerEvents":"none","overflow":"visible"}}>
                  <path data-wire="1" fill="none" stroke="#0BAA8F" strokeWidth="2.2" strokeLinecap="round"></path>
                  <path data-wire="1" fill="none" stroke="#0BAA8F" strokeWidth="2.2" strokeLinecap="round"></path>
                  <path data-wire="1" fill="none" stroke="#0BAA8F" strokeWidth="2.2" strokeLinecap="round"></path>
                  <path data-wire="1" fill="none" stroke="#59DBC0" strokeWidth="2.6" strokeLinecap="round"></path>
                  <path data-wire="1" fill="none" stroke="#59DBC0" strokeWidth="2.6" strokeLinecap="round"></path>
                </svg>
                <div style={{"display":"flex","flexDirection":"column","gap":"14px","position":"relative"}}>
                  <div data-node="in" style={{"position":"relative","padding":"13px 16px","borderRadius":"var(--vq-r-md, 12px)","border":"1px solid var(--vq-line)","background":"var(--vq-sunken)","font":"600 13px/1.25 var(--vq-font-display)","color":"var(--vq-text)"}}>POS terminals<span style={{"display":"block","marginTop":"4px","font":"500 10.5px/1 var(--vq-font-numeric)","letterSpacing":".08em","color":"var(--vq-text-3)"}}>3 BRANCHES</span><span style={{"position":"absolute","right":"-5px","top":"50%","transform":"translateY(-50%)","width":"8px","height":"8px","borderRadius":"999px","background":"var(--vq-accent)","border":"2px solid var(--vq-surface)","boxShadow":"0 0 8px var(--vq-accent)"}}></span></div>
                  <div data-node="in" style={{"position":"relative","padding":"13px 16px","borderRadius":"var(--vq-r-md, 12px)","border":"1px solid var(--vq-line)","background":"var(--vq-sunken)","font":"600 13px/1.25 var(--vq-font-display)","color":"var(--vq-text)"}}>Purchase receipts<span style={{"display":"block","marginTop":"4px","font":"500 10.5px/1 var(--vq-font-numeric)","letterSpacing":".08em","color":"var(--vq-text-3)"}}>DISTRIBUTORS</span><span style={{"position":"absolute","right":"-5px","top":"50%","transform":"translateY(-50%)","width":"8px","height":"8px","borderRadius":"999px","background":"var(--vq-accent)","border":"2px solid var(--vq-surface)","boxShadow":"0 0 8px var(--vq-accent)"}}></span></div>
                  <div data-node="in" style={{"position":"relative","padding":"13px 16px","borderRadius":"var(--vq-r-md, 12px)","border":"1px solid var(--vq-line)","background":"var(--vq-sunken)","font":"600 13px/1.25 var(--vq-font-display)","color":"var(--vq-text)"}}>SmartCapture<span style={{"display":"block","marginTop":"4px","font":"500 10.5px/1 var(--vq-font-numeric)","letterSpacing":".08em","color":"var(--vq-text-3)"}}>PHOTO · VOICE</span><span style={{"position":"absolute","right":"-5px","top":"50%","transform":"translateY(-50%)","width":"8px","height":"8px","borderRadius":"999px","background":"var(--vq-accent)","border":"2px solid var(--vq-surface)","boxShadow":"0 0 8px var(--vq-accent)"}}></span></div>
                </div>
                <div style={{"display":"flex","flexDirection":"column","gap":"18px","position":"relative"}}>
                  <div data-node="mid" style={{"position":"relative","padding":"15px 18px","borderRadius":"var(--vq-r-md, 12px)","border":"1px solid var(--vq-accent-quiet-line)","background":"var(--vq-accent-quiet)","font":"600 13px/1.25 var(--vq-font-display)","color":"var(--vq-text)"}}><span style={{"position":"absolute","left":"-5px","top":"50%","transform":"translateY(-50%)","width":"8px","height":"8px","borderRadius":"999px","background":"var(--vq-accent)","border":"2px solid var(--vq-surface)"}}></span>Stock &amp; batch engine<span style={{"display":"block","marginTop":"4px","font":"500 10.5px/1 var(--vq-font-numeric)","letterSpacing":".08em","color":"var(--vq-accent-text)"}}>FEFO · EXPIRY GUARD</span><span style={{"position":"absolute","right":"-5px","top":"50%","transform":"translateY(-50%)","width":"8px","height":"8px","borderRadius":"999px","background":"#59DBC0","border":"2px solid var(--vq-surface)","boxShadow":"0 0 8px #59DBC0"}}></span></div>
                  <div data-node="mid" style={{"position":"relative","padding":"15px 18px","borderRadius":"var(--vq-r-md, 12px)","border":"1px solid var(--vq-accent-quiet-line)","background":"var(--vq-accent-quiet)","font":"600 13px/1.25 var(--vq-font-display)","color":"var(--vq-text)"}}><span style={{"position":"absolute","left":"-5px","top":"50%","transform":"translateY(-50%)","width":"8px","height":"8px","borderRadius":"999px","background":"var(--vq-accent)","border":"2px solid var(--vq-surface)"}}></span>Payables &amp; terms<span style={{"display":"block","marginTop":"4px","font":"500 10.5px/1 var(--vq-font-numeric)","letterSpacing":".08em","color":"var(--vq-accent-text)"}}>30-DAY AGING</span><span style={{"position":"absolute","right":"-5px","top":"50%","transform":"translateY(-50%)","width":"8px","height":"8px","borderRadius":"999px","background":"#59DBC0","border":"2px solid var(--vq-surface)","boxShadow":"0 0 8px #59DBC0"}}></span></div>
                </div>
                <div style={{"position":"relative"}}>
                  <div data-node="core" style={{"position":"relative","padding":"22px 20px","borderRadius":"var(--vq-r-lg, 16px)","background":"linear-gradient(135deg, var(--vq-teal-600) 0%, var(--vq-teal-700) 55%, var(--vq-teal-900) 100%)","boxShadow":"var(--vq-glow-accent-strong)","color":"#fff"}}>
                    <span style={{"position":"absolute","left":"-5px","top":"50%","transform":"translateY(-50%)","width":"8px","height":"8px","borderRadius":"999px","background":"#fff","border":"2px solid #088975","boxShadow":"0 0 10px #fff"}}></span>
                    <span style={{"font":"700 12px/1 var(--vq-font-numeric)","letterSpacing":".14em","color":"rgba(255, 255, 255, 0.75)"}}>THE ENGINE</span>
                    <span style={{"display":"block","marginTop":"8px","font":"600 20px/1.1 var(--vq-font-display)","letterSpacing":"-.03em"}}>Core Ledger</span>
                    <span style={{"display":"block","marginTop":"8px","font":"500 12px/1.45 var(--vq-font-sans)","color":"rgba(255, 255, 255, 0.84)"}}>Every module posts here. Debits equal credits or the post is refused.</span>
                  </div>
                </div>
              </div>
            </div>

            {/*  Stage 05: Live  */}
            <div data-layer="4" style={{"position":"absolute","inset":"0","padding":"30px 34px","opacity":"0"}}>
              <div style={{"height":"100%","display":"grid","gridTemplateColumns":"1.35fr 1fr","gap":"16px"}}>
                <div style={{"borderRadius":"var(--vq-r-lg, 16px)","border":"1px solid var(--vq-line)","background":"var(--vq-sunken)","padding":"18px","display":"flex","flexDirection":"column","gap":"12px","minHeight":"0"}}>
                  <div style={{"display":"flex","alignItems":"center","justifyContent":"space-between"}}>
                    <span style={{"font":"600 13px/1 var(--vq-font-display)","letterSpacing":"-.02em","color":"var(--vq-text)"}}>Checkout · Branch 2</span>
                    <span style={{"font":"600 10.5px/1 var(--vq-font-numeric)","letterSpacing":".1em","color":"var(--vq-success)"}}>BATCH EXPIRY ON</span>
                  </div>
                  <div style={{"display":"flex","flexDirection":"column","gap":"8px"}}>
                    <div style={{"display":"grid","gridTemplateColumns":"1fr auto","gap":"8px","padding":"8px 0","borderBottom":"1px solid var(--vq-line-soft)"}}>
                      <span style={{"display":"flex","flexDirection":"column","gap":"3px"}}>
                        <span style={{"font":"500 13px/1 var(--vq-font-sans)","color":"var(--vq-text)"}}>Amoxicillin 500mg × 2</span>
                        <span style={{"font":"500 11px/1 var(--vq-font-numeric)","letterSpacing":".05em","color":"var(--vq-text-3)"}}>BATCH A-2291 · EXP 03/2027</span>
                      </span>
                      <span style={{"font":"600 13px/1 var(--vq-font-numeric)","fontVariantNumeric":"tabular-nums","color":"var(--vq-text)","alignSelf":"center"}}>Rs 1,240.00</span>
                    </div>
                    <div style={{"display":"grid","gridTemplateColumns":"1fr auto","gap":"8px","padding":"8px 0","borderBottom":"1px solid var(--vq-line-soft)"}}>
                      <span style={{"display":"flex","flexDirection":"column","gap":"3px"}}>
                        <span style={{"font":"500 13px/1 var(--vq-font-sans)","color":"var(--vq-text)"}}>Insulin pen refill</span>
                        <span style={{"font":"500 11px/1 var(--vq-font-numeric)","letterSpacing":".05em","color":"var(--vq-text-3)"}}>BATCH C-0417 · EXP 11/2026</span>
                      </span>
                      <span style={{"font":"600 13px/1 var(--vq-font-numeric)","fontVariantNumeric":"tabular-nums","color":"var(--vq-text)","alignSelf":"center"}}>Rs 2,660.00</span>
                    </div>
                    <div style={{"display":"grid","gridTemplateColumns":"1fr auto","gap":"8px","padding":"8px 0","borderBottom":"1px solid var(--vq-line-soft)"}}>
                      <span style={{"display":"flex","flexDirection":"column","gap":"3px"}}>
                        <span style={{"font":"500 13px/1 var(--vq-font-sans)","color":"var(--vq-text)"}}>Paracetamol strip × 4</span>
                        <span style={{"font":"500 11px/1 var(--vq-font-numeric)","letterSpacing":".05em","color":"var(--vq-text-3)"}}>BATCH P-8802 · EXP 08/2028</span>
                      </span>
                      <span style={{"font":"600 13px/1 var(--vq-font-numeric)","fontVariantNumeric":"tabular-nums","color":"var(--vq-text)","alignSelf":"center"}}>Rs 418.00</span>
                    </div>
                  </div>
                  <div style={{"marginTop":"auto","display":"flex","alignItems":"baseline","justifyContent":"space-between","paddingTop":"12px","borderTop":"1px solid var(--vq-line)"}}>
                    <span style={{"font":"700 12px/1 var(--vq-font-numeric)","letterSpacing":".14em","color":"var(--vq-text-3)"}}>TOTAL</span>
                    <span style={{"font":"600 24px/1 var(--vq-font-numeric)","fontVariantNumeric":"tabular-nums","letterSpacing":"-.03em","color":"var(--vq-text)"}}>Rs 4,318.00</span>
                  </div>
                </div>
                <div style={{"display":"flex","flexDirection":"column","gap":"12px","minHeight":"0"}}>
                  <div style={{"borderRadius":"var(--vq-r-lg, 16px)","border":"1px solid var(--vq-success-line)","background":"var(--vq-success-bg)","padding":"14px 16px"}}>
                    <span style={{"font":"700 12px/1 var(--vq-font-numeric)","letterSpacing":".14em","color":"var(--vq-success)"}}>POSTED · 7 CHECKS PASSED</span>
                    <div style={{"marginTop":"10px","display":"grid","gridTemplateColumns":"1fr auto","gap":"6px 10px","font":"500 12px/1.5 var(--vq-font-numeric)","fontVariantNumeric":"tabular-nums","color":"var(--vq-text)"}}>
                      <span>Debits</span><span>Rs 4,318.00</span>
                      <span>Credits</span><span>Rs 4,318.00</span>
                    </div>
                  </div>
                  <div style={{"flex":"1","borderRadius":"var(--vq-r-lg, 16px)","border":"1px solid var(--vq-line)","background":"var(--vq-sunken)","padding":"14px 16px","display":"flex","flexDirection":"column","gap":"10px","minHeight":"0"}}>
                    <span style={{"font":"700 12px/1 var(--vq-font-numeric)","letterSpacing":".14em","color":"var(--vq-text-3)"}}>EXPIRING IN 45 DAYS</span>
                    <div style={{"display":"flex","flexDirection":"column","gap":"8px"}}>
                      <div style={{"display":"flex","alignItems":"center","justifyContent":"space-between","gap":"8px","font":"500 12px/1.4 var(--vq-font-sans)","color":"var(--vq-text-2)"}}><span>Batch C-0417 · Insulin</span><span style={{"font":"600 12px/1 var(--vq-font-numeric)","color":"var(--vq-warning)"}}>18 DAYS</span></div>
                      <div style={{"display":"flex","alignItems":"center","justifyContent":"space-between","gap":"8px","font":"500 12px/1.4 var(--vq-font-sans)","color":"var(--vq-text-2)"}}><span>Batch V-1120 · Vitamin D</span><span style={{"font":"600 12px/1 var(--vq-font-numeric)","color":"var(--vq-warning)"}}>31 DAYS</span></div>
                      <div style={{"display":"flex","alignItems":"center","justifyContent":"space-between","gap":"8px","font":"500 12px/1.4 var(--vq-font-sans)","color":"var(--vq-text-2)"}}><span>Batch A-9043 · Syrup</span><span style={{"font":"600 12px/1 var(--vq-font-numeric)","color":"var(--vq-warning)"}}>44 DAYS</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  </section>

    {/*  ══ 7 · PRODUCT SHOWCASE (pinned ScrollStack) ═════════════════════  */}
    <section id="showcase" data-sec="showcase" data-stack="1" className="vq-stackwrap" style={{"height":"520vh","background":"var(--vq-bg)"}}>
      <div className="vq-stackpin">
        <div aria-hidden="true" data-par="-0.06" style={{"position":"absolute","inset":"0","background":"radial-gradient(62% 52% at 50% 8%,var(--vq-accent-quiet),transparent 68%)","pointerEvents":"none"}}></div>
        <div className="vq-stackpin__in">
          <div style={{"display":"flex","alignItems":"flex-end","justifyContent":"space-between","gap":"20px","flexWrap":"wrap","marginBottom":"26px"}}>
            <div style={{"display":"flex","flexDirection":"column","gap":"11px"}}>
              <span className="vq-kicker">THE SURFACES YOU ACTUALLY TOUCH</span>
              <h2 style={{"margin":"0","maxWidth":"27ch","font":"600 var(--vq-fs-h1)/var(--vq-lh-h1) var(--vq-font-display)","fontSize":"clamp(26px,4vw,var(--vq-fs-h1))","letterSpacing":"var(--vq-ls-h1)","color":"var(--vq-text)"}}>Five screens, and everything else is behind them.</h2>
            </div>
            <span data-stackcount style={{"font":"600 12px/1 var(--vq-font-numeric)","letterSpacing":".14em","color":"var(--vq-text-3)","paddingBottom":"6px"}}>01 / 05</span>
          </div>

          <div className="vq-stagebox">

            <article className="vq-stackcard" data-stackcard>
              <div className="vq-stackcard__bar">
                <span className="vq-stackcard__dot" style={{"background":"#FF8A6B"}}></span><span className="vq-stackcard__dot" style={{"background":"#FFCD5B"}}></span><span className="vq-stackcard__dot" style={{"background":"#A9E34B"}}></span>
                <span className="vq-stackcard__ttl">THE REGISTER · BRANCH 2</span>
                <span style={{"marginLeft":"auto","font":"600 12px/1 var(--vq-font-numeric)","letterSpacing":".1em","color":"var(--vq-accent-text)"}}>LIVE</span>
              </div>
              <div className="vq-stackcard__body">
                <div className="vq-stackcard__say">
                  <span className="vq-stackcard__n">01 · THE REGISTER</span>
                  <h3>A till you compose yourself.</h3>
                  <p>Keyboard-first, barcode-first, and laid out the way your counter actually works. Split tender, held sales, returns against the original line — and a cashier PIN that switches staff in under a second.</p>
                  <a className="vq-link" href="/pos">See the register &rarr;</a>
                </div>
                <div className="vq-stackcard__see">
                  <div className="vq-mockrow"><span><b>Amoxicillin 500mg &times; 2</b>BATCH A-2291 · EXP 03/2027</span><span className="vq-mocknum">1,240.00</span></div>
                  <div className="vq-mockrow"><span><b>Insulin pen refill</b>BATCH C-0417 · EXP 11/2026</span><span className="vq-mocknum">2,660.00</span></div>
                  <div className="vq-mockrow"><span><b>Paracetamol strip &times; 4</b>BATCH P-8802 · EXP 08/2028</span><span className="vq-mocknum">418.00</span></div>
                  <div style={{"display":"flex","alignItems":"baseline","justifyContent":"space-between","paddingTop":"12px","marginTop":"2px","borderTop":"1px solid var(--vq-line)"}}>
                    <span style={{"font":"700 12px/1 var(--vq-font-numeric)","letterSpacing":".14em","color":"var(--vq-text-3)"}}>TOTAL</span>
                    <span style={{"font":"600 23px/1 var(--vq-font-numeric)","fontVariantNumeric":"tabular-nums","letterSpacing":"-.03em","color":"var(--vq-text)"}}>Rs 4,318.00</span>
                  </div>
                </div>
              </div>
            </article>

            <article className="vq-stackcard" data-stackcard>
              <div className="vq-stackcard__bar">
                <span className="vq-stackcard__dot" style={{"background":"#FF8A6B"}}></span><span className="vq-stackcard__dot" style={{"background":"#FFCD5B"}}></span><span className="vq-stackcard__dot" style={{"background":"#A9E34B"}}></span>
                <span className="vq-stackcard__ttl">DOCUMENTS · INVOICE 2026-0417</span>
                <span style={{"marginLeft":"auto","font":"600 12px/1 var(--vq-font-numeric)","letterSpacing":".1em","color":"var(--vq-accent-text)"}}>DRAFT</span>
              </div>
              <div className="vq-stackcard__body">
                <div className="vq-stackcard__say">
                  <span className="vq-stackcard__n">02 · DOCUMENTS</span>
                  <h3>Thirteen document types, one editor.</h3>
                  <p>Quote, sales order, delivery note, invoice, credit note, purchase order, GRN, supplier bill, statement — all the same editor, all posting through the same ledger. Change a template once and every document follows.</p>
                  <a className="vq-link" href="/documents">See Documents &rarr;</a>
                </div>
                <div className="vq-stackcard__see">
                  <div style={{"display":"flex","flexWrap":"wrap","gap":"7px","marginBottom":"4px"}}>
                    <span className="vq-mocktag">Quote</span><span className="vq-mocktag">Sales order</span><span className="vq-mocktag">Delivery note</span><span className="vq-mocktag">Invoice</span><span className="vq-mocktag">Credit note</span><span className="vq-mocktag">Purchase order</span><span className="vq-mocktag">GRN</span><span className="vq-mocktag">Supplier bill</span><span className="vq-mocktag">Statement</span>
                  </div>
                  <div className="vq-mockrow"><span><b>Converted from Quote Q-0288</b>Same lines, same tax, same customer</span><span className="vq-mocknum" style={{"color":"var(--vq-success)"}}>LINKED</span></div>
                  <div className="vq-mockrow"><span><b>Posted to Core Ledger</b>AR 4,318.00 &nbsp;/&nbsp; Revenue 3,659.32 &nbsp;/&nbsp; Tax 658.68</span><span className="vq-mocknum" style={{"color":"var(--vq-success)"}}>7/7</span></div>
                </div>
              </div>
            </article>

            <article className="vq-stackcard" data-stackcard>
              <div className="vq-stackcard__bar">
                <span className="vq-stackcard__dot" style={{"background":"#FF8A6B"}}></span><span className="vq-stackcard__dot" style={{"background":"#FFCD5B"}}></span><span className="vq-stackcard__dot" style={{"background":"#A9E34B"}}></span>
                <span className="vq-stackcard__ttl">BLUEPRINT · CHANGE REVIEW</span>
                <span style={{"marginLeft":"auto","font":"600 12px/1 var(--vq-font-numeric)","letterSpacing":".1em","color":"var(--vq-accent-text)"}}>AWAITING APPROVAL</span>
              </div>
              <div className="vq-stackcard__body">
                <div className="vq-stackcard__say">
                  <span className="vq-stackcard__n">03 · BLUEPRINT</span>
                  <h3>Describe the change. Read the diff. Approve it.</h3>
                  <p>Adding a branch, a channel or a whole product line is a sentence. Blueprint shows you exactly what it will add, what it will alter and what it will touch downstream — before a single row moves. Every applied change keeps a snapshot you can roll back.</p>
                  <a className="vq-link" href="/blueprint">See Blueprint &rarr;</a>
                </div>
                <div className="vq-stackcard__see">
                  <div className="vq-quotebox" style={{"fontSize":"13.5px"}}>&ldquo;Add wholesale distribution with warehouse transfer workflows.&rdquo;</div>
                  <div className="vq-mockrow"><span><b>+ Tier pricing matrix</b>New module</span><span className="vq-mocknum" style={{"color":"var(--vq-success)"}}>ADD</span></div>
                  <div className="vq-mockrow"><span><b>+ Branch transfers</b>New module</span><span className="vq-mocknum" style={{"color":"var(--vq-success)"}}>ADD</span></div>
                  <div className="vq-mockrow"><span><b>~ Customer record</b>Gains credit terms &amp; price tier</span><span className="vq-mocknum" style={{"color":"var(--vq-warning)"}}>ALTER</span></div>
                  <div className="vq-mockrow"><span><b>Core Ledger</b>Chart of accounts unchanged</span><span className="vq-mocknum" style={{"color":"var(--vq-text-3)"}}>UNTOUCHED</span></div>
                </div>
              </div>
            </article>

            <article className="vq-stackcard" data-stackcard>
              <div className="vq-stackcard__bar">
                <span className="vq-stackcard__dot" style={{"background":"#FF8A6B"}}></span><span className="vq-stackcard__dot" style={{"background":"#FFCD5B"}}></span><span className="vq-stackcard__dot" style={{"background":"#A9E34B"}}></span>
                <span className="vq-stackcard__ttl">THE RECKONER · GROSS MARGIN</span>
                <span style={{"marginLeft":"auto","font":"600 12px/1 var(--vq-font-numeric)","letterSpacing":".1em","color":"var(--vq-accent-text)"}}>DEFINED ONCE</span>
              </div>
              <div className="vq-stackcard__body">
                <div className="vq-stackcard__say">
                  <span className="vq-stackcard__n">04 · THE RECKONER</span>
                  <h3>One place a number is defined.</h3>
                  <p>Every figure on every screen resolves to a single definition you can open and read. No two reports disagreeing about what &ldquo;margin&rdquo; means, because there is only one definition of it in the whole system.</p>
                  <a className="vq-link" href="/reckoner">See the Reckoner &rarr;</a>
                </div>
                <div className="vq-stackcard__see">
                  <div className="vq-mockrow"><span><b>Gross margin</b>(Revenue &minus; COGS) &divide; Revenue</span><span className="vq-mocknum">32.9%</span></div>
                  <div className="vq-mockrow"><span><b>Revenue</b>Posted sales, net of returns and tax</span><span className="vq-mocknum">1,284,900.00</span></div>
                  <div className="vq-mockrow"><span><b>COGS</b>Weighted average at time of sale</span><span className="vq-mocknum">861,883.00</span></div>
                  <div className="vq-mockrow"><span><b>Used by</b>Dashboard · P&amp;L · Signals · Vena</span><span className="vq-mocknum" style={{"color":"var(--vq-accent-text)"}}>4 SURFACES</span></div>
                </div>
              </div>
            </article>

            <article className="vq-stackcard" data-stackcard>
              <div className="vq-stackcard__bar">
                <span className="vq-stackcard__dot" style={{"background":"#FF8A6B"}}></span><span className="vq-stackcard__dot" style={{"background":"#FFCD5B"}}></span><span className="vq-stackcard__dot" style={{"background":"#A9E34B"}}></span>
                <span className="vq-stackcard__ttl">DASHBOARD · SELF-ASSEMBLING</span>
                <span style={{"marginLeft":"auto","font":"600 12px/1 var(--vq-font-numeric)","letterSpacing":".1em","color":"var(--vq-accent-text)"}}>108 READINGS</span>
              </div>
              <div className="vq-stackcard__body">
                <div className="vq-stackcard__say">
                  <span className="vq-stackcard__n">05 · THE DASHBOARD</span>
                  <h3>It builds itself out of what you turned on.</h3>
                  <p>A pharmacy sees expiry exposure and distributor aging. A boutique sees variant sell-through and channel split. Same engine, same 58 readings underneath — only the ones your business has a use for ever reach the screen.</p>
                  <a className="vq-link" href="/dashboard-preview">See the dashboard &rarr;</a>
                </div>
                <div className="vq-stackcard__see">
                  <div className="vq-mockrow"><span><b>Cash position</b>Across 3 branches</span><span className="vq-mocknum">2,118,400.00</span></div>
                  <div className="vq-mockrow"><span><b>Expiring in 45 days</b>11 batches</span><span className="vq-mocknum" style={{"color":"var(--vq-warning)"}}>184,220.00</span></div>
                  <div className="vq-mockrow"><span><b>Payables over 30 days</b>4 distributors</span><span className="vq-mocknum">612,050.00</span></div>
                  <div className="vq-mockrow"><span><b>Gross margin · this week</b>vs 31.4% last week</span><span className="vq-mocknum" style={{"color":"var(--vq-success)"}}>32.9%</span></div>
                </div>
              </div>
            </article>

          </div>
        </div>
      </div>
    </section>

    {/*  MOVING STRIP 2: BLACK MARQUEE STRIP (SCROLL-DRIVEN)  */}
    <div data-dark="1" className="vq-dark" style={{"position":"relative","overflow":"hidden","background":"#0C1211","padding":"28px 0","borderTop":"1px solid rgba(255, 255, 255, 0.08)","borderBottom":"1px solid rgba(255, 255, 255, 0.08)"}}>
      <div data-marquee="1" style={{"display":"flex","gap":"48px","whiteSpace":"nowrap","willChange":"transform"}}>
        <span style={{"display":"inline-flex","alignItems":"center","gap":"48px","font":"600 clamp(20px, 2.4vw, 34px)/1 var(--vq-font-display)","letterSpacing":"-.03em","color":"rgba(237, 242, 239, 0.5)"}}>Blueprint<span style={{"width":"6px","height":"6px","borderRadius":"999px","background":"#23C4A6"}}></span></span>
        <span style={{"display":"inline-flex","alignItems":"center","gap":"48px","font":"600 clamp(20px, 2.4vw, 34px)/1 var(--vq-font-display)","letterSpacing":"-.03em","color":"#59DBC0"}}>Core Ledger<span style={{"width":"6px","height":"6px","borderRadius":"999px","background":"#23C4A6"}}></span></span>
        <span style={{"display":"inline-flex","alignItems":"center","gap":"48px","font":"600 clamp(20px, 2.4vw, 34px)/1 var(--vq-font-display)","letterSpacing":"-.03em","color":"rgba(237, 242, 239, 0.5)"}}>SmartCapture<span style={{"width":"6px","height":"6px","borderRadius":"999px","background":"#23C4A6"}}></span></span>
        <span style={{"display":"inline-flex","alignItems":"center","gap":"48px","font":"600 clamp(20px, 2.4vw, 34px)/1 var(--vq-font-display)","letterSpacing":"-.03em","color":"#59DBC0"}}>VenSynQ<span style={{"width":"6px","height":"6px","borderRadius":"999px","background":"#23C4A6"}}></span></span>
        <span style={{"display":"inline-flex","alignItems":"center","gap":"48px","font":"600 clamp(20px, 2.4vw, 34px)/1 var(--vq-font-display)","letterSpacing":"-.03em","color":"rgba(237, 242, 239, 0.5)"}}>Vena<span style={{"width":"6px","height":"6px","borderRadius":"999px","background":"#23C4A6"}}></span></span>
        <span style={{"display":"inline-flex","alignItems":"center","gap":"48px","font":"600 clamp(20px, 2.4vw, 34px)/1 var(--vq-font-display)","letterSpacing":"-.03em","color":"#59DBC0"}}>Signals<span style={{"width":"6px","height":"6px","borderRadius":"999px","background":"#23C4A6"}}></span></span>
        <span style={{"display":"inline-flex","alignItems":"center","gap":"48px","font":"600 clamp(20px, 2.4vw, 34px)/1 var(--vq-font-display)","letterSpacing":"-.03em","color":"rgba(237, 242, 239, 0.5)"}}>Blueprint<span style={{"width":"6px","height":"6px","borderRadius":"999px","background":"#23C4A6"}}></span></span>
        <span style={{"display":"inline-flex","alignItems":"center","gap":"48px","font":"600 clamp(20px, 2.4vw, 34px)/1 var(--vq-font-display)","letterSpacing":"-.03em","color":"#59DBC0"}}>Core Ledger<span style={{"width":"6px","height":"6px","borderRadius":"999px","background":"#23C4A6"}}></span></span>
        <span style={{"display":"inline-flex","alignItems":"center","gap":"48px","font":"600 clamp(20px, 2.4vw, 34px)/1 var(--vq-font-display)","letterSpacing":"-.03em","color":"rgba(237, 242, 239, 0.5)"}}>SmartCapture<span style={{"width":"6px","height":"6px","borderRadius":"999px","background":"#23C4A6"}}></span></span>
        <span style={{"display":"inline-flex","alignItems":"center","gap":"48px","font":"600 clamp(20px, 2.4vw, 34px)/1 var(--vq-font-display)","letterSpacing":"-.03em","color":"#59DBC0"}}>VenSynQ<span style={{"width":"6px","height":"6px","borderRadius":"999px","background":"#23C4A6"}}></span></span>
        <span style={{"display":"inline-flex","alignItems":"center","gap":"48px","font":"600 clamp(20px, 2.4vw, 34px)/1 var(--vq-font-display)","letterSpacing":"-.03em","color":"rgba(237, 242, 239, 0.5)"}}>Vena<span style={{"width":"6px","height":"6px","borderRadius":"999px","background":"#23C4A6"}}></span></span>
        <span style={{"display":"inline-flex","alignItems":"center","gap":"48px","font":"600 clamp(20px, 2.4vw, 34px)/1 var(--vq-font-display)","letterSpacing":"-.03em","color":"#59DBC0"}}>Signals<span style={{"width":"6px","height":"6px","borderRadius":"999px","background":"#23C4A6"}}></span></span>
      </div>
    </div>

    {/*  ══ 7b · 85+ BUSINESS TYPES — one engine, five sectors ══════════════  */}
    <BusinessTypes />

    {/*  ══ 8 · CORE BUSINESS MODULES / PILLARS ═══════════════════════════  */}
    <section id="tailored" data-sec="tailored" className="vq-sec vq-sec--base">
      <div className="vq-sec__in">
        <div className="vq-head vq-reveal">
          <span className="vq-kicker">WHAT&rsquo;S INSIDE</span>
          <h2 className="vq-sfloat">Everything the business runs on. Nothing charged as a module.</h2>
          <p>Nine pillars, 46 engines, 240+ features in the box. Your Blueprint turns on the ones you operate &mdash; the rest are one sentence away, at no extra cost.</p>
        </div>

        <div className="vq-bento vq-reveal" style={{"marginTop":"44px"}}>
          <div className="vq-spot">
            <div className="vq-bento__hd"><span className="vq-bento__ic"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3H8l-2 4h12z"/><path d="M12 12v5"/></svg></span><h3>Selling</h3></div>
            <ul><li>Point of sale</li><li>Quotes &amp; invoices</li><li>Returns &amp; exchanges</li><li>Layaway &amp; credit sales</li><li>Multi-currency</li></ul>
          </div>
          <div className="vq-spot">
            <div className="vq-bento__hd"><span className="vq-bento__ic"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m21 8-9-5-9 5v8l9 5 9-5z"/><path d="m3 8 9 5 9-5"/><path d="M12 13v8"/></svg></span><h3>Stock</h3></div>
            <ul><li>Multi-location inventory</li><li>Batch, serial &amp; expiry</li><li>Stock transfers</li><li>Adjustments &amp; counts</li><li>Reorder points</li></ul>
          </div>
          <div className="vq-spot">
            <div className="vq-bento__hd"><span className="vq-bento__ic"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 7h14l-1.4 10.2a2 2 0 0 1-2 1.8H8.4a2 2 0 0 1-2-1.8z"/><path d="M9 7V5a3 3 0 0 1 6 0v2"/></svg></span><h3>Buying</h3></div>
            <ul><li>Purchase orders</li><li>Supplier bills</li><li>Goods received notes</li><li>Landed cost</li><li>Supplier credit terms</li></ul>
          </div>
          <div className="vq-spot">
            <div className="vq-bento__hd"><span className="vq-bento__ic"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 2v20"/><path d="M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></span><h3>Money</h3></div>
            <ul><li>Double-entry ledger</li><li>Chart of accounts</li><li>Bank &amp; cash</li><li>Tax handling</li><li>Trial balance, P&amp;L, balance sheet</li></ul>
          </div>
          <div className="vq-spot">
            <div className="vq-bento__hd"><span className="vq-bento__ic"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/></svg></span><h3>People &amp; access</h3></div>
            <ul><li>7 roles out of the box</li><li>Custom permissions</li><li>Approval chains</li><li>Shift &amp; attendance</li><li>Commission</li></ul>
          </div>
          <div className="vq-spot">
            <div className="vq-bento__hd"><span className="vq-bento__ic"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span><h3>Customers &amp; suppliers</h3></div>
            <ul><li>Customer accounts</li><li>Credit limits</li><li>Loyalty</li><li>Statements</li><li>Payment history</li></ul>
          </div>
          <div className="vq-spot">
            <div className="vq-bento__hd"><span className="vq-bento__ic"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-6h6v6"/></svg></span><h3>Branches</h3></div>
            <ul><li>Unlimited locations</li><li>Per-branch stock &amp; pricing</li><li>Inter-branch transfers</li><li>Consolidated view</li></ul>
          </div>
          <div className="vq-spot">
            <div className="vq-bento__hd"><span className="vq-bento__ic"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 3v18h18"/><path d="m7 15 4-5 3 3 5-7"/></svg></span><h3>Intelligence</h3></div>
            <ul><li>Dashboards</li><li>Custom reports</li><li>Signals (retention &amp; risk)</li><li>Export to anything</li></ul>
          </div>
          <div className="vq-spot">
            <div className="vq-bento__hd"><span className="vq-bento__ic"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20"/></svg></span><h3>Channels</h3></div>
            <ul><li>VenSynQ multi-channel sync</li><li>WooCommerce</li><li>Amazon</li><li>eBay</li><li>TikTok Shop</li></ul>
          </div>
        </div>

        <div className="vq-reveal" style={{"marginTop":"18px"}}>
          <a className="vq-link" href="/features">See all 240+ features &rarr;</a>
        </div>

        <div className="vq-head vq-reveal" style={{"marginTop":"72px"}}>
          <span className="vq-kicker">ZERO BLOAT</span>
          <h2 style={{"fontSize":"clamp(26px,3.8vw,var(--vq-fs-h1))"}}>Same compiler. A different system every time.</h2>
          <p>Pick a business below and watch the engine set change. Everything that goes dim is software you never have to look at.</p>
        </div>
        <div className="vq-reveal" style={{"marginTop":"34px","display":"flex","flexWrap":"wrap","gap":"10px"}} data-ind-chips>
          <button type="button" className="vq-chip is-active" data-ind="pharmacy">3-branch pharmacy</button>
          <button type="button" className="vq-chip" data-ind="bakery">Bakery, central kitchen</button>
          <button type="button" className="vq-chip" data-ind="wholesale">Auto parts wholesale</button>
          <button type="button" className="vq-chip" data-ind="boutique">Boutique + online</button>
        </div>

        <div className="vq-reveal" data-indgrid="1" style={{"marginTop":"26px","display":"grid","gridTemplateColumns":"1.55fr 1fr","gap":"20px","alignItems":"start"}}>
          <div style={{"padding":"24px","borderRadius":"var(--vq-r-xl, 20px)","background":"var(--vq-surface)","border":"1px solid var(--vq-line)","boxShadow":"var(--vq-elev-1)"}}>
            <div style={{"display":"flex","alignItems":"baseline","justifyContent":"space-between","gap":"14px","marginBottom":"18px"}}>
              <span style={{"font":"700 12px/1 var(--vq-font-numeric)","letterSpacing":".14em","color":"var(--vq-text-3)"}}>COMPILED ENGINE SET</span>
              <span data-ind-count style={{"font":"600 12px/1 var(--vq-font-numeric)","color":"var(--vq-accent-text)"}}>8 of 24 shipped</span>
            </div>
            <div data-modules-grid style={{"display":"grid","gridTemplateColumns":"repeat(auto-fill, minmax(148px, 1fr))","gap":"8px"}}>
              {/*  Javascript populates engine tokens  */}
            </div>
          </div>

          <div data-ind-card style={{"display":"flex","flexDirection":"column","gap":"16px","padding":"24px","borderRadius":"var(--vq-r-xl, 20px)","background":"var(--vq-sunken)","border":"1px solid var(--vq-line)","color":"var(--vq-text)"}}>
            <span data-ind-eyebrow style={{"font":"700 12px/1 var(--vq-font-numeric)","letterSpacing":".14em","color":"var(--vq-accent-text)"}}>PHARMACY · 3 BRANCHES</span>
            <h3 data-ind-title style={{"margin":"0","font":"600 21px/1.25 var(--vq-font-display)","letterSpacing":"-.02em"}}>Batch expiry lives inside checkout</h3>
            <p data-ind-blurb style={{"margin":"0","font":"400 15px/1.62 var(--vq-font-sans)","color":"var(--vq-text-2)"}}>Not in a settings page, not in a separate module. The counter picks the nearest-expiry batch first, and the write-off posts itself.</p>
            <div data-ind-points style={{"display":"flex","flexDirection":"column","gap":"10px","paddingTop":"16px","borderTop":"1px solid var(--vq-line-soft)"}}>
              <span style={{"display":"flex","gap":"10px","font":"500 13.5px/1.5 var(--vq-font-sans)","color":"var(--vq-text)"}}><span style={{"color":"var(--vq-success)","fontFamily":"var(--vq-font-numeric)"}}>+</span>Distributor invoices on 30-day terms, aged automatically</span>
              <span style={{"display":"flex","gap":"10px","font":"500 13.5px/1.5 var(--vq-font-sans)","color":"var(--vq-text)"}}><span style={{"color":"var(--vq-success)","fontFamily":"var(--vq-font-numeric)"}}>+</span>Expiry watchlist at 45, 30 and 15 days</span>
              <span style={{"display":"flex","gap":"10px","font":"500 13.5px/1.5 var(--vq-font-sans)","color":"var(--vq-text)"}}><span style={{"color":"var(--vq-success)","fontFamily":"var(--vq-font-numeric)"}}>+</span>Stock moves between branches without a spreadsheet</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/*  ══ 9 · AI CAPABILITIES ═══════════════════════════════════════════  */}
    <section id="day2" data-sec="day2" className="vq-sec vq-sec--alt">
      <div className="vq-sec__in">
        <div className="vq-head vq-reveal">
          <span className="vq-kicker">AI THAT DOES THE WORK</span>
          <h2 className="vq-sfloat">The AI isn't a chat box in the corner.</h2>
          <p>It compiled the system on day one. From day two it works inside it &mdash; drafting the purchase order, matching the bank feed, reading the voice note, and telling you which customer stopped ordering.</p>
        </div>

        <div className="vq-ai vq-reveal" style={{"marginTop":"48px"}}>

          <div className="vq-spot vq-ai__card" data-par="0.04">
            <span className="vq-ai__name">SMARTCAPTURE</span>
            <h3>A photo in, a posted transaction out</h3>
            <p>The order arrived as a WhatsApp voice note, a photo of a handwritten list, or a screenshot. Point SmartCapture at it and it comes out the other side as a real sale &mdash; items matched, quantities set, customer attached, ledger posted.</p>
            <div style={{"display":"flex","flexDirection":"column","gap":"8px","marginTop":"2px"}}>
              <div className="vq-mockrow"><span><b>voice-note-1142.ogg</b>&ldquo;Two boxes amoxicillin, one insulin, put it on Rafiq&rsquo;s account&rdquo;</span><span className="vq-mocknum" style={{"color":"var(--vq-text-3)"}}>READ</span></div>
              <div className="vq-mockrow"><span><b>3 lines matched to SKUs</b>Customer: Rafiq Medical Store</span><span className="vq-mocknum" style={{"color":"var(--vq-success)"}}>DRAFTED</span></div>
            </div>
            <a className="vq-link" style={{"marginTop":"auto","paddingTop":"10px"}} href="/smartcapture">See SmartCapture &rarr;</a>
          </div>

          <div className="vq-spot vq-ai__card" data-par="0.09">
            <span className="vq-ai__name">VENA · ASK IN PLAIN WORDS</span>
            <h3>Answers straight off the ledger</h3>
            <p>Ask your business a question the way you'd ask your manager. Vena answers from your posted data &mdash; and shows you the definition and the journal entries behind every figure, so you can check its work.</p>
            <div className="vq-quotebox">&ldquo;What was our gross margin at branch 2 this weekend?&rdquo;</div>
            <div style={{"display":"grid","gridTemplateColumns":"1fr auto","gap":"8px 14px","font":"500 13px/1.6 var(--vq-font-numeric)","fontVariantNumeric":"tabular-nums","color":"var(--vq-text-2)"}}>
              <span>Revenue</span><span style={{"color":"var(--vq-text)"}}>Rs 1,284,900.00</span>
              <span>Cost of goods</span><span style={{"color":"var(--vq-text)"}}>Rs 861,883.00</span>
              <span style={{"color":"var(--vq-success)"}}>Gross margin</span><span style={{"color":"var(--vq-success)"}}>32.9%</span>
            </div>
            <span style={{"font":"500 12px/1.5 var(--vq-font-sans)","color":"var(--vq-text-3)"}}>Every figure traceable to the journal entries behind it.</span>
          </div>

          <div className="vq-spot vq-ai__card" data-par="0.14">
            <span className="vq-ai__name">SIGNALS · RETENTION &amp; RISK</span>
            <h3>The customer who quietly stopped</h3>
            <p>The account that used to order every two weeks hasn't ordered in six. You'd usually notice three months late. Signals tells you this week, while it's still a phone call and not a loss.</p>
            <div style={{"display":"flex","flexDirection":"column","gap":"8px","marginTop":"2px"}}>
              <div className="vq-mockrow"><span><b>Rafiq Medical Store</b>Ordered every 14 days &middot; last order 41 days ago</span><span className="vq-mocknum" style={{"color":"var(--vq-danger)"}}>AT RISK</span></div>
              <div className="vq-mockrow"><span><b>City Pharmacy (Model Town)</b>Order size down 38% over 3 months</span><span className="vq-mocknum" style={{"color":"var(--vq-warning)"}}>SLIPPING</span></div>
              <div className="vq-mockrow"><span><b>Al-Shifa Chemist</b>Steady &middot; 22 orders this quarter</span><span className="vq-mocknum" style={{"color":"var(--vq-success)"}}>HEALTHY</span></div>
            </div>
          </div>

          <div className="vq-spot vq-ai__card" data-par="0.04">
            <span className="vq-ai__name">PREDICTIVE REPLENISHMENT</span>
            <h3>Purchase orders before the stockout</h3>
            <p>Sales velocity, supplier lead times and seasonality read together, then drafted into a purchase order you approve or edit. It never orders anything on its own.</p>
            <div style={{"display":"flex","flexDirection":"column","gap":"10px","marginTop":"2px"}}>
              <div style={{"display":"flex","flexDirection":"column","gap":"6px"}}>
                <div style={{"display":"flex","justifyContent":"space-between","font":"500 12.5px/1 var(--vq-font-sans)","color":"var(--vq-text-2)"}}><span>Amoxicillin 500mg</span><span style={{"fontFamily":"var(--vq-font-numeric)","color":"var(--vq-text-3)"}}>reorder in 4 days</span></div>
                <div style={{"height":"6px","borderRadius":"999px","background":"var(--vq-chart-track)","overflow":"hidden"}}><span style={{"display":"block","height":"100%","width":"82%","borderRadius":"999px","background":"var(--vq-grad-mint)"}}></span></div>
              </div>
              <div style={{"display":"flex","flexDirection":"column","gap":"6px"}}>
                <div style={{"display":"flex","justifyContent":"space-between","font":"500 12.5px/1 var(--vq-font-sans)","color":"var(--vq-text-2)"}}><span>Insulin pen refill</span><span style={{"fontFamily":"var(--vq-font-numeric)","color":"var(--vq-text-3)"}}>reorder in 9 days</span></div>
                <div style={{"height":"6px","borderRadius":"999px","background":"var(--vq-chart-track)","overflow":"hidden"}}><span style={{"display":"block","height":"100%","width":"58%","borderRadius":"999px","background":"var(--vq-grad-mint)"}}></span></div>
              </div>
              <div style={{"display":"flex","flexDirection":"column","gap":"6px"}}>
                <div style={{"display":"flex","justifyContent":"space-between","font":"500 12.5px/1 var(--vq-font-sans)","color":"var(--vq-text-2)"}}><span>Vitamin D 60k</span><span style={{"fontFamily":"var(--vq-font-numeric)","color":"var(--vq-text-3)"}}>reorder in 21 days</span></div>
                <div style={{"height":"6px","borderRadius":"999px","background":"var(--vq-chart-track)","overflow":"hidden"}}><span style={{"display":"block","height":"100%","width":"31%","borderRadius":"999px","background":"var(--vq-grad-mint)"}}></span></div>
              </div>
            </div>
          </div>

          <div className="vq-spot vq-ai__card" data-par="0.09">
            <span className="vq-ai__name">AUTONOMOUS RECONCILIATION</span>
            <h3>Bank feed, card receipts, POS logs</h3>
            <p>Matched line by line against the ledger. What matches is closed. What doesn't is flagged with the reason, not just the difference &mdash; so the drawer short at branch 2 lands on someone's desk the same day.</p>
            <div style={{"display":"flex","flexDirection":"column","gap":"8px","marginTop":"2px"}}>
              <div className="vq-mockrow"><span style={{"display":"flex","alignItems":"center","gap":"8px"}}><span style={{"width":"6px","height":"6px","borderRadius":"999px","background":"var(--vq-success)"}}></span>Bank feed &middot; 142 lines</span><span className="vq-mocknum" style={{"color":"var(--vq-success)"}}>MATCHED</span></div>
              <div className="vq-mockrow"><span style={{"display":"flex","alignItems":"center","gap":"8px"}}><span style={{"width":"6px","height":"6px","borderRadius":"999px","background":"var(--vq-success)"}}></span>Card settlement &middot; 38 lines</span><span className="vq-mocknum" style={{"color":"var(--vq-success)"}}>MATCHED</span></div>
              <div className="vq-mockrow"><span style={{"display":"flex","alignItems":"center","gap":"8px"}}><span style={{"width":"6px","height":"6px","borderRadius":"999px","background":"var(--vq-warning)"}}></span>POS drawer &middot; branch 2</span><span className="vq-mocknum" style={{"color":"var(--vq-warning)"}}>SHORT 240.00</span></div>
            </div>
          </div>

          <div className="vq-spot vq-ai__card" data-par="0.14" style={{"background":"linear-gradient(135deg, var(--vq-teal-600) 0%, var(--vq-teal-700) 55%, var(--vq-teal-900) 100%)","borderColor":"transparent","boxShadow":"var(--vq-glow-accent-strong)","color":"#fff"}}>
            <span className="vq-ai__name" style={{"color":"rgba(255,255,255,.78)"}}>THE LINE THE AI DOES NOT CROSS</span>
            <h3 style={{"color":"#fff"}}>It composes. It never posts a number it made up.</h3>
            <p style={{"color":"rgba(255,255,255,.9)"}}>Everything above drafts, matches, reads and flags. A human approves, and Core Ledger &mdash; hand-written, with seven correctness checks &mdash; decides whether the entry is allowed to exist at all.</p>
            <div style={{"marginTop":"auto","paddingTop":"14px","borderTop":"1px solid rgba(255,255,255,.24)","display":"flex","flexDirection":"column","gap":"8px"}}>
              <span style={{"display":"flex","alignItems":"center","gap":"8px","font":"500 13px/1.4 var(--vq-font-sans)","color":"rgba(255,255,255,.92)"}}><span style={{"fontFamily":"var(--vq-font-numeric)"}}>+</span> No AI-written accounting logic, ever</span>
              <span style={{"display":"flex","alignItems":"center","gap":"8px","font":"500 13px/1.4 var(--vq-font-sans)","color":"rgba(255,255,255,.92)"}}><span style={{"fontFamily":"var(--vq-font-numeric)"}}>+</span> Debits equal credits or the post is refused</span>
            </div>
          </div>

        </div>
      </div>
    </section>

    {/*  ══ 10 · OFFLINE / SYNC (pinned theatre) ══════════════════════════  */}
    <section id="offline" data-sec="offline" data-offline="1" className="vq-off" style={{"height":"400vh"}}>
      <div className="vq-off__pin">
        <div aria-hidden="true" data-par="-0.05" style={{"position":"absolute","inset":"0","background":"radial-gradient(66% 56% at 50% 100%,var(--vq-accent-quiet),transparent 70%)","pointerEvents":"none"}}></div>

        <div style={{"width":"100%","maxWidth":"1180px","margin":"0 auto 26px","padding":"0 24px","display":"flex","alignItems":"flex-end","justifyContent":"space-between","gap":"20px","flexWrap":"wrap"}}>
          <div style={{"display":"flex","flexDirection":"column","gap":"11px"}}>
            <span className="vq-kicker">OFFLINE &amp; SYNC</span>
            <h2 style={{"margin":"0","maxWidth":"22ch","font":"600 var(--vq-fs-h1)/var(--vq-lh-h1) var(--vq-font-display)","fontSize":"clamp(26px,4vw,var(--vq-fs-h1))","letterSpacing":"var(--vq-ls-h1)","color":"var(--vq-text)"}}>The internet goes down. The queue does not.</h2>
          </div>
          <p style={{"margin":"0","maxWidth":"38ch","font":"400 15px/1.6 var(--vq-font-sans)","color":"var(--vq-text-2)","paddingBottom":"4px"}}>Scroll through a real outage: the line keeps moving, the sales hold, and the ledger takes them the moment the connection returns.</p>
        </div>

        <div className="vq-off__grid">
          <div className="vq-off__steps">
            <div className="vq-off__step" data-offstep data-on="1">
              <i>01</i>
              <span><b>Selling normally</b><s>Every sale posts to Core Ledger as it happens</s><span className="vq-off__track"><span className="vq-off__bar" data-offbar></span></span></span>
            </div>
            <div className="vq-off__step" data-offstep>
              <i>02</i>
              <span><b>The line drops</b><s>The till notices in under a second and keeps going</s><span className="vq-off__track"><span className="vq-off__bar" data-offbar></span></span></span>
            </div>
            <div className="vq-off__step" data-offstep>
              <i>03</i>
              <span><b>The queue holds</b><s>Sales, stock moves and tenders written locally, in order</s><span className="vq-off__track"><span className="vq-off__bar" data-offbar></span></span></span>
            </div>
            <div className="vq-off__step" data-offstep>
              <i>04</i>
              <span><b>Reconnect &amp; drain</b><s>Replayed in sequence, checked seven ways, posted</s><span className="vq-off__track"><span className="vq-off__bar" data-offbar></span></span></span>
            </div>
          </div>

          <div className="vq-till" data-till data-net="up">
            <div className="vq-till__bar">
              <span className="vq-stackcard__dot" style={{"background":"#FF8A6B"}}></span><span className="vq-stackcard__dot" style={{"background":"#FFCD5B"}}></span><span className="vq-stackcard__dot" style={{"background":"#A9E34B"}}></span>
              <span style={{"marginLeft":"8px","color":"var(--vq-text-3)"}}>TILL 2 · MODEL TOWN</span>
              <span className="vq-till__sig">
                <span className="vq-till__led"></span>
                <span data-netlabel style={{"color":"var(--vq-text-2)"}}>ONLINE</span>
              </span>
            </div>

            <div className="vq-till__body">
              <div className="vq-till__left">
                <div style={{"display":"flex","alignItems":"center","justifyContent":"space-between"}}>
                  <span style={{"font":"600 13px/1 var(--vq-font-display)","letterSpacing":"-.02em","color":"var(--vq-text)"}}>Held for sync</span>
                  <span style={{"font":"600 12px/1 var(--vq-font-numeric)","letterSpacing":".1em","color":"var(--vq-text-3)"}}><span data-qcount style={{"color":"var(--vq-accent-text)"}}>0</span> IN QUEUE</span>
                </div>

                <div className="vq-q" data-qrow data-in="0" data-state="queued">
                  <span><b style={{"display":"block","font":"600 12.5px/1.3 var(--vq-font-sans)","color":"var(--vq-text)"}}>Sale #4471 · Cash</b>3 lines · Rs 4,318.00</span>
                  <span className="vq-q__st">QUEUED</span>
                </div>
                <div className="vq-q" data-qrow data-in="0" data-state="queued">
                  <span><b style={{"display":"block","font":"600 12.5px/1.3 var(--vq-font-sans)","color":"var(--vq-text)"}}>Sale #4472 · Card</b>1 line · Rs 980.00</span>
                  <span className="vq-q__st">QUEUED</span>
                </div>
                <div className="vq-q" data-qrow data-in="0" data-state="queued">
                  <span><b style={{"display":"block","font":"600 12.5px/1.3 var(--vq-font-sans)","color":"var(--vq-text)"}}>Return #R-118</b>Against invoice 2026-0388 · Rs 1,240.00</span>
                  <span className="vq-q__st">QUEUED</span>
                </div>
                <div className="vq-q" data-qrow data-in="0" data-state="queued">
                  <span><b style={{"display":"block","font":"600 12.5px/1.3 var(--vq-font-sans)","color":"var(--vq-text)"}}>Sale #4473 · Split tender</b>Cash 2,000 + Card 1,660</span>
                  <span className="vq-q__st">QUEUED</span>
                </div>
                <div className="vq-q" data-qrow data-in="0" data-state="queued">
                  <span><b style={{"display":"block","font":"600 12.5px/1.3 var(--vq-font-sans)","color":"var(--vq-text)"}}>Stock move · Branch 2 &rarr; 3</b>14 units · batch A-2291</span>
                  <span className="vq-q__st">QUEUED</span>
                </div>
              </div>

              <div className="vq-till__right">
                <span style={{"font":"700 12px/1 var(--vq-font-numeric)","letterSpacing":".14em","color":"var(--vq-text-3)"}}>WHAT KEEPS WORKING</span>
                <div style={{"display":"flex","flexDirection":"column","gap":"7px"}}>
                  <span style={{"display":"flex","alignItems":"center","gap":"8px","font":"500 12.5px/1.4 var(--vq-font-sans)","color":"var(--vq-text-2)"}}><span style={{"color":"var(--vq-success)"}}><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>Barcode scanning &amp; price lookup</span>
                  <span style={{"display":"flex","alignItems":"center","gap":"8px","font":"500 12.5px/1.4 var(--vq-font-sans)","color":"var(--vq-text-2)"}}><span style={{"color":"var(--vq-success)"}}><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>Cash, card and split tender</span>
                  <span style={{"display":"flex","alignItems":"center","gap":"8px","font":"500 12.5px/1.4 var(--vq-font-sans)","color":"var(--vq-text-2)"}}><span style={{"color":"var(--vq-success)"}}><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>Batch picking &amp; expiry guard</span>
                  <span style={{"display":"flex","alignItems":"center","gap":"8px","font":"500 12.5px/1.4 var(--vq-font-sans)","color":"var(--vq-text-2)"}}><span style={{"color":"var(--vq-success)"}}><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>Receipt printing &amp; cash drawer</span>
                  <span style={{"display":"flex","alignItems":"center","gap":"8px","font":"500 12.5px/1.4 var(--vq-font-sans)","color":"var(--vq-text-3)"}}><span style={{"color":"var(--vq-warning)","fontFamily":"var(--vq-font-numeric)"}}>&minus;</span>Channel sync waits for the line</span>
                </div>

                <div data-posted style={{"marginTop":"auto","padding":"13px 15px","borderRadius":"var(--vq-r-md)","border":"1px solid var(--vq-success-line, var(--vq-line))","background":"var(--vq-success-bg, var(--vq-accent-quiet))","opacity":"0","transform":"translateY(10px)","transition":"opacity 320ms var(--vq-ease-out),transform 320ms var(--vq-ease-out)"}}>
                  <span style={{"font":"700 12px/1 var(--vq-font-numeric)","letterSpacing":".14em","color":"var(--vq-success)"}}>DRAINED · <span data-drained>0</span> OF 5 POSTED</span>
                  <div style={{"marginTop":"9px","display":"grid","gridTemplateColumns":"1fr auto","gap":"5px 10px","font":"500 12px/1.5 var(--vq-font-numeric)","fontVariantNumeric":"tabular-nums","color":"var(--vq-text)"}}>
                    <span>Debits</span><span>Rs 9,478.00</span>
                    <span>Credits</span><span>Rs 9,478.00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p style={{"width":"100%","maxWidth":"1180px","margin":"22px auto 0","padding":"0 24px","font":"500 13.5px/1.6 var(--vq-font-sans)","color":"var(--vq-text-3)"}}>
          Nothing is posted twice. Each queued entry carries its own idempotency key, and replay is refused if the ledger has already seen it.
        </p>
      </div>
    </section>

    {/*  ══ 11 · INDUSTRY SOLUTIONS ═══════════════════════════════════════  */}
    <section id="industries" data-sec="industries" className="vq-sec vq-sec--base">
      <div className="vq-sec__in">
        <div className="vq-head vq-reveal">
          <span className="vq-kicker">PRESETS</span>
          <h2 className="vq-sfloat">Or start from a system that already fits.</h2>
          <p>Not everyone wants to describe their business from scratch. Pick the closest preset, change what's different, go live. You still get the Blueprint &mdash; you just start it further along.</p>
        </div>

        <div className="vq-presets vq-reveal" style={{"marginTop":"46px"}}>
          <div className="vq-spot" data-par="0.04">
            <span className="vq-presets__k">RETAIL SHOP</span>
            <h3>Fast checkout, real margins</h3>
            <p>Stock that's right at closing time, because every sale moved it. Barcode-first till, day-close that balances, and a margin figure that means one thing.</p>
            <span className="vq-presets__go">Retail preset <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span>
          </div>
          <div className="vq-spot" data-par="0.08">
            <span className="vq-presets__k">WHOLESALE &amp; DISTRIBUTION</span>
            <h3>Credit terms and price tiers</h3>
            <p>Per-customer tiers, 30- and 60-day terms aged automatically, dispatch notes that draw from real stock &mdash; and Signals telling you which account stopped ordering.</p>
            <span className="vq-presets__go">Wholesale preset <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span>
          </div>
          <div className="vq-spot" data-par="0.12">
            <span className="vq-presets__k">PHARMACY</span>
            <h3>Batch and expiry inside checkout</h3>
            <p>Not a settings page and not a separate module. The counter picks nearest-expiry first, an expired item cannot ring up, and the write-off posts itself.</p>
            <span className="vq-presets__go">Pharmacy preset <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span>
          </div>
          <div className="vq-spot" data-par="0.04">
            <span className="vq-presets__k">RESTAURANT &amp; CAF&Eacute;</span>
            <h3>Recipes that draw down ingredients</h3>
            <p>Not just plates sold. A cappuccino takes milk, beans and a cup out of stock, the central kitchen transfers at cost, and the food-cost percentage is a real number.</p>
            <span className="vq-presets__go">Restaurant preset <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span>
          </div>
          <div className="vq-spot" data-par="0.08">
            <span className="vq-presets__k">SERVICES &amp; REPAIR</span>
            <h3>Jobs, parts, labour, one invoice</h3>
            <p>A job card that collects the parts issued and the hours booked, then becomes the invoice that ties them together &mdash; with the parts already off the shelf.</p>
            <span className="vq-presets__go">Services preset <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span>
          </div>
          <div className="vq-spot" data-par="0.12">
            <span className="vq-presets__k">MULTI-BRANCH</span>
            <h3>One truth across every location</h3>
            <p>Without a nightly sync. Per-branch stock and pricing, transfers that post both sides at once, and a consolidated view that adds up because it is the same ledger.</p>
            <span className="vq-presets__go">Multi-branch preset <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span>
          </div>
        </div>

        <div className="vq-reveal" style={{"marginTop":"26px"}}>
          <a className="vq-link" href="/onboarding">Watch a preset go live in four minutes &rarr;</a>
        </div>
      </div>
    </section>

    {/*  ══ 12 · INTEGRATIONS ═════════════════════════════════════════════  */}
    <section id="integrations" data-sec="integrations" className="vq-sec vq-sec--alt" style={{"overflow":"hidden"}}>
      <div className="vq-sec__in">
        <div className="vq-head vq-reveal">
          <span className="vq-kicker">INTEGRATIONS</span>
          <h2 className="vq-sfloat">The other places your stock is already sold.</h2>
          <p>Channels, hardware and files. Where something is live it says live; where it isn't, it says so. We'd rather list four working integrations than forty logos.</p>
        </div>
      </div>

      <div className="vq-loop vq-reveal" data-loop="1" data-loop-speed="38" style={{"marginTop":"44px"}}>
        <div className="vq-loop__track" data-looptrack>
          <span className="vq-loop__item">WooCommerce <span>LIVE</span></span>
          <span className="vq-loop__item">Amazon <span>SP-API APPROVED</span></span>
          <span className="vq-loop__item">eBay <span>LIVE</span></span>
          <span className="vq-loop__item" data-soon="1">TikTok Shop <span>IN ROLLOUT</span></span>
          <span className="vq-loop__item">Barcode scanners <span>USB &amp; BLUETOOTH</span></span>
          <span className="vq-loop__item">Thermal receipt printers <span>ESC/POS</span></span>
          <span className="vq-loop__item">Cash drawers <span>RJ11 KICK</span></span>
          <span className="vq-loop__item">Label printers <span>ZPL</span></span>
        </div>
      </div>

      <div className="vq-loop vq-reveal" data-loop="-1" data-loop-speed="30" style={{"marginTop":"14px"}}>
        <div className="vq-loop__track" data-looptrack>
          <span className="vq-loop__item">CSV &amp; Excel import <span>ANY SYSTEM</span></span>
          <span className="vq-loop__item">Full data export <span>ANY TIME, FREE</span></span>
          <span className="vq-loop__item">REST API <span>SCALE PLAN</span></span>
          <span className="vq-loop__item">Webhooks <span>SCALE PLAN</span></span>
          <span className="vq-loop__item">Bank statement import <span>CSV / OFX</span></span>
          <span className="vq-loop__item">WhatsApp voice notes <span>VIA SMARTCAPTURE</span></span>
          <span className="vq-loop__item" data-soon="1">Shopify <span>ON THE ROADMAP</span></span>
          <span className="vq-loop__item" data-soon="1">Payment gateways <span>ON THE ROADMAP</span></span>
        </div>
      </div>

      <div className="vq-sec__in">
        <div className="vq-synq vq-reveal">
          <div style={{"display":"flex","flexDirection":"column","gap":"14px"}}>
            <span className="vq-kicker">VENSYNQ</span>
            <h3>Sell in five places. Count your stock once.</h3>
            <p>List on WooCommerce, Amazon, eBay and TikTok Shop from the same inventory that runs your counter. One unit sells anywhere, it comes off everywhere &mdash; in seconds, not on tonight's sync. Overselling is an account-health problem before it is a customer-service problem, and this is the fix.</p>
            <span className="vq-seal" style={{"alignSelf":"flex-start"}}>
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>
              AMAZON SP-API APPROVED · UK LIVE
            </span>
            <a className="vq-link" href="/vensynq">See VenSynQ &rarr;</a>
          </div>

          <div className="vq-synq__viz">
            <div className="vq-mockrow"><span><b>Counter · Model Town</b>1 sold &middot; 14:02:11</span><span className="vq-mocknum">&minus;1</span></div>
            <div className="vq-mockrow" style={{"borderColor":"var(--vq-accent-quiet-line)","background":"var(--vq-accent-quiet)"}}><span><b>Stock on hand · SKU 44-2291</b>Single source of truth</span><span className="vq-mocknum" style={{"color":"var(--vq-accent-text)"}}>37 &rarr; 36</span></div>
            <div className="vq-mockrow"><span><b>WooCommerce</b>Updated 14:02:11</span><span className="vq-mocknum" style={{"color":"var(--vq-success)"}}>36</span></div>
            <div className="vq-mockrow"><span><b>Amazon</b>Updated 14:02:12</span><span className="vq-mocknum" style={{"color":"var(--vq-success)"}}>36</span></div>
            <div className="vq-mockrow"><span><b>eBay</b>Updated 14:02:12</span><span className="vq-mocknum" style={{"color":"var(--vq-success)"}}>36</span></div>
          </div>
        </div>
      </div>
    </section>

    {/*  ══ 13 · DASHBOARD / ANALYTICS (pinned, scroll-scrubbed) ══════════  */}
    <section id="analytics" data-sec="analytics" data-analytics="1" className="vq-an" style={{"height":"300vh"}}>
      <div className="vq-an__pin">
        <div aria-hidden="true" data-par="-0.08" style={{"position":"absolute","inset":"0","background":"radial-gradient(60% 50% at 78% 12%,var(--vq-accent-quiet),transparent 66%)","pointerEvents":"none"}}></div>

        <div className="vq-an__in">
          <div style={{"display":"flex","alignItems":"flex-end","justifyContent":"space-between","gap":"20px","flexWrap":"wrap","marginBottom":"22px"}}>
            <div style={{"display":"flex","flexDirection":"column","gap":"11px"}}>
              <span className="vq-kicker">DASHBOARD &amp; ANALYTICS</span>
              <h2 style={{"margin":"0","maxWidth":"24ch","font":"600 var(--vq-fs-h1)/var(--vq-lh-h1) var(--vq-font-display)","fontSize":"clamp(26px,4vw,var(--vq-fs-h1))","letterSpacing":"var(--vq-ls-h1)","color":"var(--vq-text)"}}>58 readings. Only the ones your business has a use for.</h2>
            </div>
            <p style={{"margin":"0","maxWidth":"36ch","font":"400 15px/1.6 var(--vq-font-sans)","color":"var(--vq-text-2)","paddingBottom":"4px"}}>Every tile resolves to a Reckoner definition, and every definition resolves to journal entries. Click any number and you can read your way down to the posting.</p>
          </div>

          <div className="vq-board">
            <div className="vq-board__bar">
              <span className="vq-stackcard__dot" style={{"background":"#FF8A6B"}}></span><span className="vq-stackcard__dot" style={{"background":"#FFCD5B"}}></span><span className="vq-stackcard__dot" style={{"background":"#A9E34B"}}></span>
              <span style={{"marginLeft":"8px"}}>DASHBOARD · ALL BRANCHES · THIS WEEK</span>
              <span style={{"marginLeft":"auto","color":"var(--vq-accent-text)"}}>LIVE</span>
            </div>

            <div className="vq-board__grid">
              <div className="vq-kpi" data-anrise>
                <span className="vq-kpi__l">REVENUE</span>
                <span className="vq-kpi__v">Rs <span data-count="1284900" data-count-dur="1700">0</span></span>
                <span className="vq-kpi__d">&uarr; 8.4% vs last week</span>
              </div>
              <div className="vq-kpi" data-anrise>
                <span className="vq-kpi__l">GROSS MARGIN</span>
                <span className="vq-kpi__v"><span data-count="32.9" data-count-dec="1" data-count-suf="%" data-count-dur="1700">0</span></span>
                <span className="vq-kpi__d">&uarr; 1.5 pts vs last week</span>
              </div>
              <div className="vq-kpi" data-anrise>
                <span className="vq-kpi__l">CASH POSITION</span>
                <span className="vq-kpi__v">Rs <span data-count="2118400" data-count-dur="1700">0</span></span>
                <span className="vq-kpi__d">3 branches reconciled</span>
              </div>
              <div className="vq-kpi" data-anrise>
                <span className="vq-kpi__l">PAYABLES &gt; 30 DAYS</span>
                <span className="vq-kpi__v">Rs <span data-count="612050" data-count-dur="1700">0</span></span>
                <span className="vq-kpi__d" data-dir="down">&darr; 4 distributors</span>
              </div>

              <div className="vq-chartbox vq-board__wide" data-anrise>
                <div style={{"display":"flex","alignItems":"baseline","justifyContent":"space-between","gap":"12px"}}>
                  <span style={{"font":"600 13px/1 var(--vq-font-display)","letterSpacing":"-.02em","color":"var(--vq-text)"}}>Revenue vs cost of goods · 12 weeks</span>
                  <span className="vq-legend">
                    <span><i style={{"background":"var(--vq-series-1,#0BAA8F)"}}></i>Revenue</span>
                    <span><i style={{"background":"var(--vq-series-2,#F26A47)"}}></i>Cost of goods</span>
                  </span>
                </div>
                <svg className="vq-spark" data-spark viewBox="0 0 640 160" preserveAspectRatio="none" role="img" aria-label="Revenue rising ahead of cost of goods over twelve weeks">
                  <path d="M0 122 L58 116 L116 108 L174 112 L232 96 L290 88 L348 92 L406 74 L464 66 L522 58 L580 44 L640 30"
                        fill="none" stroke="var(--vq-series-1,#0BAA8F)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M0 140 L58 138 L116 134 L174 136 L232 128 L290 126 L348 130 L406 120 L464 118 L522 114 L580 110 L640 104"
                        fill="none" stroke="var(--vq-series-2,#F26A47)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="0" opacity=".85"/>
                </svg>
              </div>

              <div className="vq-chartbox vq-board__side" data-anrise>
                <span style={{"font":"600 13px/1 var(--vq-font-display)","letterSpacing":"-.02em","color":"var(--vq-text)"}}>Sales by day</span>
                <div className="vq-bars" data-bars>
                  <i data-h="46"></i><i data-h="58"></i><i data-h="41"></i><i data-h="69"></i><i data-h="84"></i><i data-h="97"></i><i data-h="62"></i>
                </div>
                <span className="vq-legend"><span>Mon</span><span style={{"marginLeft":"auto"}}>Sun</span></span>
              </div>
            </div>
          </div>

          <div style={{"display":"flex","flexWrap":"wrap","gap":"10px","marginTop":"18px"}}>
            <span className="vq-mocktag">Expiry exposure</span>
            <span className="vq-mocktag">Distributor aging</span>
            <span className="vq-mocktag">Branch comparison</span>
            <span className="vq-mocktag">Variant sell-through</span>
            <span className="vq-mocktag">Channel split</span>
            <span className="vq-mocktag">Cashier variance</span>
            <span className="vq-mocktag" style={{"borderColor":"var(--vq-accent-quiet-line)","background":"var(--vq-accent-quiet)","color":"var(--vq-accent-text)"}}>+ 102 more readings</span>
          </div>
        </div>
      </div>
    </section>

    {/*  ══ 14 · CUSTOMER PROOF (the honest version) ══════════════════════  */}
    <section id="ledger" data-sec="ledger" className="vq-sec vq-sec--alt">
      <div className="vq-sec__in">
        <div className="vq-head vq-reveal">
          <span className="vq-kicker">PROOF</span>
          <h2 className="vq-sfloat">We'd rather show you the tests than a wall of logos.</h2>
          <p>VenQore is new. Here is exactly what that means, and what it doesn't. Every number on this page is one you can ask us to demonstrate.</p>
        </div>

        <div className="vq-proof vq-reveal" style={{"marginTop":"46px"}}>
          <div className="vq-spot" data-par="0.03">
            <span className="vq-proof__n" data-count="140" data-count-suf="+" data-count-dur="900">0</span>
            <span className="vq-proof__l">MODULAR ERP FEATURES</span>
            <span className="vq-proof__s">Universal business modules assembled specifically for your business model with zero extraneous clutter.</span>
          </div>
          <div className="vq-spot" data-par="0.07">
            <span className="vq-proof__n" data-count="35255" data-count-suf="+">0</span>
            <span className="vq-proof__l">CORRECTNESS CHECKS RUN EVERY RELEASE</span>
            <span className="vq-proof__s">Automated tests guarding every calculation, balance sheet integrity check, and ledger posting invariant.</span>
          </div>
          <div className="vq-spot" data-par="0.11">
            <span className="vq-proof__n" data-count="8" data-count-suf=" / 8" data-count-dur="900">0</span>
            <span className="vq-proof__l">INVIOLABLE ACCOUNTING LAWS</span>
            <span className="vq-proof__s">Run on every post before it is allowed into the immutable ledger. One failure and nothing is written.</span>
          </div>
          <div className="vq-spot" data-par="0.15">
            <span className="vq-proof__n" data-count="100" data-count-suf="%">0</span>
            <span className="vq-proof__l">DOUBLE-ENTRY LEDGER BACKED</span>
            <span className="vq-proof__s">Every transaction writes balanced debits and credits. Zero balance drift, zero unverified estimates.</span>
          </div>
        </div>

        <div className="vq-founder vq-reveal">
          <span className="vq-kicker">ENGINEERED FOR MATHEMETICAL CERTAINTY</span>
          <p>VenQore was built on a single core principle: accounting and inventory software should never lose a single cent, mismatch a receipt, or hallucinate a ledger balance.</p>
          <p>Every transaction posts through an immutable double-entry ledger verified against 8 strict accounting laws and 35,255 automated correctness checks before anything is committed to your books.</p>
          <b>&mdash; The VenQore Engineering Team</b>
          <a className="vq-link" href="/about">Read our technical architecture &rarr;</a>
        </div>
      </div>
    </section>

    {/*  ══ 16 · FAQ ══════════════════════════════════════════════════════  */}
    <section id="faq" data-sec="faq" className="vq-section" style={{"padding":"100px 24px","background":"var(--vq-bg-alt)"}}>
      <div className="vq-container vq-container--narrow">
        <div className="vq-section-head vq-reveal" style={{"textAlign":"center","marginInline":"auto"}}><span className="vq-kicker" style={{"display":"block","marginBottom":"12px"}}>FAQ</span><h2 className="vq-display">Questions people actually ask.</h2></div>
        <div className="vq-faq vq-reveal">
          
          <div className="vq-faq__item">
            <button className="vq-faq__q" type="button" aria-expanded="false">Is my accounting safe if an AI configured it?<span className="vq-faq__sign"></span></button>
            <div className="vq-faq__a"><div><p>The AI composes your system — which modules run, what your fields are called, who approves what. It never touches the accounting engine. Debits equal credits or the transaction does not post, and that rule is in the engine, not in a prompt.</p></div></div>
          </div>
          <div className="vq-faq__item">
            <button className="vq-faq__q" type="button" aria-expanded="false">What if the Blueprint gets it wrong?<span className="vq-faq__sign"></span></button>
            <div className="vq-faq__a"><div><p>You see it before anything is real. Every line is editable, nothing posts to your books until you approve it, and every applied configuration keeps a version snapshot you can roll back.</p></div></div>
          </div>
          <div className="vq-faq__item">
            <button className="vq-faq__q" type="button" aria-expanded="false">Can I change my system later?<span className="vq-faq__sign"></span></button>
            <div className="vq-faq__a"><div><p>Describe the change. Blueprint shows you a diff — what is added, what changes, what is affected — and you approve it or you don't. Adding a branch is a sentence, not a change request.</p></div></div>
          </div>
          <div className="vq-faq__item">
            <button className="vq-faq__q" type="button" aria-expanded="false">Do you charge to import my data, or to leave?<span className="vq-faq__sign"></span></button>
            <div className="vq-faq__a"><div><p>No, and no. Import is included. Export everything, any time, in a format your next system can read.</p></div></div>
          </div>
          <div className="vq-faq__item">
            <button className="vq-faq__q" type="button" aria-expanded="false">How is support and engineering handled?<span className="vq-faq__sign"></span></button>
            <div className="vq-faq__a"><div><p>VenQore is built and maintained by dedicated systems and accounting engineers. You get direct support from product specialists who deploy weekly improvements and verify every release against 35,255 automated checks.</p></div></div>
          </div>
        </div>
      </div>
    </section>

    {/*  ══ 17 · FINAL CTA ════════════════════════════════════════════════  */}
    {/*  The footer carries the email capture and its own headline; this beat
         answers "what actually happens if I click" so the two do not repeat.  */}
    <section id="cta" data-sec="cta" className="vq-finale">
      <div className="vq-finale__glow" data-par="-0.14" aria-hidden="true"></div>
      <div className="vq-finale__in">
        <span className="vq-kicker vq-reveal">WHAT THE NEXT FOUR MINUTES LOOK LIKE</span>
        <h2 className="vq-sfloat">No demo call. No sales pipeline. Just the thing.</h2>
        <p className="vq-reveal">You type a paragraph and watch your system compile. Nothing is charged, nothing goes live, and nothing touches your books until you have read the plan and said yes.</p>

        <ol className="vq-steps4 vq-reveal">
          <li>
            <span className="vq-steps4__n">01</span>
            <b>Describe it</b>
            <s>One paragraph, in your own words. About forty seconds.</s>
          </li>
          <li>
            <span className="vq-steps4__n">02</span>
            <b>Read the Blueprint</b>
            <s>Modules, documents, chart of accounts, roles. Every line editable.</s>
          </li>
          <li>
            <span className="vq-steps4__n">03</span>
            <b>Approve it</b>
            <s>Or change it and look again. Nothing is real until this click.</s>
          </li>
          <li>
            <span className="vq-steps4__n">04</span>
            <b>Sell something</b>
            <s>Scan a barcode. Watch it post. Free on Solo, upgrade anytime.</s>
          </li>
        </ol>

        <div className="vq-finale__acts vq-reveal">
          <a className="vq-btn vq-btn--primary vq-btn--xl" href="/build-workspace">Start building <span className="vq-btn__arrow"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a>
          <a className="vq-btn vq-btn--secondary vq-btn--xl" href="/onboarding">Watch someone else's build first</a>
        </div>
        <div className="vq-finale__meta vq-reveal">
          <span>Free to try</span><span style={{"opacity":".4"}}>&middot;</span>
          <span>Cancel anytime</span><span style={{"opacity":".4"}}>&middot;</span>
          <span>Export everything, any time</span><span style={{"opacity":".4"}}>&middot;</span>
          <span>A person answers your email</span>
        </div>
      </div>
    </section>

  </div>
  </main>

  {/*  SECTION C: ORIGINAL MASTER FOOTER (PRESERVED)  */}
  <SiteFooter />


  {/*  V6 Cookie Consent Banner & Preferences Customizer  */}
  <CookieConsent />

</div>
</>
);
}
