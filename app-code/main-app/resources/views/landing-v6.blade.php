<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5">
<title>VenQore — The AI Business Compiler for ERP &amp; Point of Sale</title>
<meta name="description" content="Describe your business in plain language. VenQore assembles the custom operating system that runs it — with double-entry accounting under every module.">
<meta property="og:title" content="VenQore — The AI Business Compiler for ERP &amp; Point of Sale">
<meta property="og:description" content="Describe your business in plain language. VenQore assembles the custom operating system that runs it — with double-entry accounting under every module.">
<meta property="og:type" content="website">
<meta property="og:site_name" content="VenQore">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0BAA8F">
<link rel="icon" href="assets/logo.png">
<link rel="stylesheet" href="assets/venqore.css">
<script>
/* Theme before paint — no flash. */
(function(){
  try {
    var saved = localStorage.getItem('vq-theme') || localStorage.getItem('vq_theme');
    if (!saved) saved = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', saved);
    document.documentElement.classList.toggle('dark', saved === 'dark');
  } catch(e) {}
})();
</script>
<style>
  /* ── Seamless Marquee Ticker ── */
  @keyframes vqMarqueeInfinite {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  .vq-ticker-strip {
    background: var(--vq-sunken);
    border-top: 1px solid var(--vq-line);
    border-bottom: 1px solid var(--vq-line);
    padding: 16px 0;
    overflow: hidden;
    position: relative;
    z-index: 5;
  }
  .vq-ticker-track {
    display: flex;
    gap: 52px;
    width: max-content;
    animation: vqMarqueeInfinite 34s linear infinite;
    white-space: nowrap;
  }
  .vq-ticker-track:hover {
    animation-play-state: paused;
  }
  .vq-ticker-item {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    font: 500 13px/1 var(--vq-font-sans);
    color: var(--vq-text);
  }
  .vq-ticker-dot {
    width: 6px;
    height: 6px;
    border-radius: 999px;
    background: var(--vq-accent);
    box-shadow: 0 0 8px var(--vq-accent);
  }

  /* Fluid canvas fixed over hero */
  #fluid-canvas {
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    z-index: 2;
    filter: blur(1px);
    opacity: 0.9;
  }
  @media (max-width: 767px) { #fluid-canvas { display: none; } }
</style>
</head>
<body class="vq-app-body" style="background: var(--vq-bg); color: var(--vq-text); overflow-x: hidden;">
  <!-- Real-time WebGL Fluid Canvas (Full-page viewport persistent) -->
  <canvas id="fluid-canvas" class="pointer-events-none fixed inset-0" style="position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:2;filter:blur(1px);opacity:0.9;"></canvas>
  

  

  <!-- Scroll Progress Indicator -->
  <div data-prog="1" style="position: fixed; top: 0; left: 0; height: 3px; width: 0%; background: linear-gradient(90deg, #0BAA8F, #59DBC0); z-index: 500; box-shadow: 0 0 18px rgba(35, 196, 166, 0.6);"></div>

  <a class="vq-skip" href="#main">Skip to content</a>

  <!-- SECTION A: ORIGINAL MAIN HEADER (PRESERVED) -->
  <header class="vq-header vq-header--onHero" data-header style="z-index: 300;">
    <div class="vq-header__inner">
      <a class="vq-brand" href="index.html" aria-label="VenQore home">
        <img src="assets/logo.png" alt="" width="30" height="30">
        <span class="vq-brand__word">VenQore</span>
      </a>

      <nav class="vq-nav" aria-label="Main">
        <ul class="vq-nav__list">
          <li class="vq-nav__item">
            <a href="blueprint.html" class="vq-nav__link">Product <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></a>
            <div class="vq-mega" style="min-width:660px">
              <div class="vq-mega__grid" style="grid-template-columns:1fr 1fr 1fr">
                <div class="vq-mega__col">
                  <span class="vq-eyebrow vq-eyebrow--accent">Build</span>
                  <a class="vq-mega__link" href="blueprint.html"><b>Blueprint</b><span>Describe it. Approve the plan.</span></a>
                  <a class="vq-mega__link" href="onboarding.html"><b>See a build</b><span>Four minutes, start to live.</span></a>
                  <a class="vq-mega__link" href="#compiler"><b>Watch it assemble</b><span>5 stages, live compilation.</span></a>
                </div>
                <div class="vq-mega__col">
                  <span class="vq-eyebrow vq-eyebrow--accent">Run</span>
                  <a class="vq-mega__link" href="pos.html"><b>The register</b><span>A till you compose yourself.</span></a>
                  <a class="vq-mega__link" href="documents.html"><b>Documents</b><span>Thirteen types, one editor.</span></a>
                  <a class="vq-mega__link" href="vensynq.html"><b>VenSynQ</b><span>Sell in five places, count once.</span></a>
                </div>
                <div class="vq-mega__col">
                  <span class="vq-eyebrow vq-eyebrow--accent">Know</span>
                  <a class="vq-mega__link" href="dashboard.html"><b>The dashboard</b><span>108 readings, self-assembling.</span></a>
                  <a class="vq-mega__link" href="reckoner.html"><b>The Reckoner</b><span>One place a number is defined.</span></a>
                  <a class="vq-mega__link" href="ledger.html"><b>Core Ledger</b><span>One engine. Every number.</span></a>
                </div>
              </div>
              <div class="vq-mega__foot">
                <a class="vq-link" href="smartcapture.html">SmartCapture — a photo in, a posted transaction out <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></a>
              </div>
            </div>
          </li>
          <li class="vq-nav__item"><a href="features.html" class="vq-nav__link">Features</a></li>
          <li class="vq-nav__item">
            <a href="about.html" class="vq-nav__link">Company <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></a>
            <div class="vq-mega" style="min-width:320px">
              <div class="vq-mega__grid" style="grid-template-columns:1fr">
                <div class="vq-mega__col">
                  <a class="vq-mega__link" href="about.html"><b>About</b><span>Built on a shop counter in Okara.</span></a>
                  <a class="vq-mega__link" href="ledger.html"><b>How we prove it</b><span>The checks we publish.</span></a>
                  <a class="vq-mega__link" href="contact.html"><b>Contact</b><span>A person answers this one.</span></a>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </nav>
      <div class="vq-header__actions">
        <button class="vq-theme-btn" data-theme-toggle type="button" aria-label="Switch theme">
          <span class="vq-icon-sun"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg></span><span class="vq-icon-moon"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg></span>
        </button>
        <a href="signin.html" class="vq-nav__link">Sign in</a>
        <a href="register.html" class="vq-btn vq-btn--primary">Start building <span class="vq-btn__arrow"><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a>
      </div>
      <button class="vq-burger" type="button" data-menu-open aria-label="Open menu" aria-expanded="false"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg></button>
    </div>
  </header>

  <!-- Mobile Menu Drawer -->
  <div class="vq-mobile" data-menu hidden>
    <button class="vq-burger" type="button" data-menu-close aria-label="Close menu"
            style="position:absolute;top:24px;right:20px"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
    <a href="blueprint.html">Blueprint</a>
    <a href="pos.html">The register</a>
    <a href="documents.html">Documents</a>
    <a href="dashboard.html">Dashboard</a>
    <a href="smartcapture.html">SmartCapture</a>
    <a href="reckoner.html">The Reckoner</a>
    <a href="ledger.html">Core Ledger</a>
    <a href="vensynq.html">VenSynQ</a>
    <a href="features.html">Features</a>
    <a href="about.html">About</a>
    <a href="contact.html">Contact</a>
    <div class="vq-mobile__actions">
      <a href="signin.html" class="vq-btn vq-btn--secondary vq-btn--lg vq-btn--block">Sign in</a>
      <a href="register.html" class="vq-btn vq-btn--primary vq-btn--lg vq-btn--block">Start building <span class="vq-btn__arrow"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a>
    </div>
  </div>

  <!-- Side Live Slider Rail Tracking Sections -->
  <aside data-rail="1">
    <a data-dot="1" data-for="top" href="#top" aria-label="Intent"><span data-dotlabel="1">Intent</span><span data-dotmark="1"></span></a>
    <a data-dot="1" data-for="compiler" href="#compiler" aria-label="Compiler"><span data-dotlabel="1">Compiler</span><span data-dotmark="1"></span></a>
    <a data-dot="1" data-for="extremes" href="#extremes" aria-label="Extremes"><span data-dotlabel="1">Extremes</span><span data-dotmark="1"></span></a>
    <a data-dot="1" data-for="tailored" href="#tailored" aria-label="Zero Bloat"><span data-dotlabel="1">Zero Bloat</span><span data-dotmark="1"></span></a>
    <a data-dot="1" data-for="tenx" href="#tenx" aria-label="10x Speed"><span data-dotlabel="1">10x Speed</span><span data-dotmark="1"></span></a>
    <a data-dot="1" data-for="day2" href="#day2" aria-label="Day 2"><span data-dotlabel="1">Day 2</span><span data-dotmark="1"></span></a>
    <a data-dot="1" data-for="ledger" href="#ledger" aria-label="Core Ledger"><span data-dotlabel="1">Ledger</span><span data-dotmark="1"></span></a>
    <a data-dot="1" data-for="start" href="#start" aria-label="Start"><span data-dotlabel="1">Start</span><span data-dotmark="1"></span></a>
  </aside>

  <main id="main">

  <!-- SECTION 1: HERO SECTION (PRESERVED) -->
  <section id="top" data-sec="top" class="vq-hero-section" style="position:relative;min-height:100svh;width:100%;display:flex;flex-direction:column;padding-top:clamp(85px,10vw,120px);overflow:hidden">
    <div class="hero-gradient-overlay" aria-hidden="true" style="position:absolute;inset:0;pointer-events:none;z-index:0;"></div>
    

    <!-- Floating Domain Pills -->
    <div class="hero-floaters" style="position: absolute; inset: 0; overflow: hidden; pointer-events: none; z-index: 5;">
      <span class="hero-pill-float" style="top: 20%; left: 5%; animation-duration: 7.2s;">
        <span class="hero-pill-dot"></span>Batch &amp; expiry
      </span>
      <span class="hero-pill-float" style="top: 58%; left: 8%; animation-duration: 8.4s;">
        <span class="hero-pill-dot"></span>Core Ledger
      </span>
      <span class="hero-pill-float" style="top: 16%; right: 9%; animation-duration: 9.2s;">
        <span class="hero-pill-dot"></span>Payables · 30 days
      </span>
      <span class="hero-pill-float" style="top: 42%; right: 5%; animation-duration: 7.8s;">
        <span class="hero-pill-dot"></span>POS checkout
      </span>
      <span class="hero-pill-float" style="top: 72%; right: 12%; animation-duration: 6.6s;">
        <span class="hero-pill-dot"></span>Branch transfers
      </span>
    </div>

    <div class="vq-hero-inner" style="position:relative;z-index:10;margin-block:auto;margin-inline:auto;max-width:64rem;width:100%;display:flex;flex-direction:column;align-items:center;gap:var(--vq-space-4);padding-inline:var(--vq-space-6);text-align:center">

      <span class="vq-eyebrow vq-hero-eyebrow" style="display: inline-flex; align-items: center; gap: 8px; height: 30px; padding: 0 14px; border-radius: 9999px; background: rgba(255, 255, 255, 0.12); border: 1px solid rgba(255, 255, 255, 0.22); backdrop-filter: blur(8px); font: 700 11px/1 var(--vq-font-numeric); letter-spacing: .14em; color: var(--vq-text);">
        <span style="width: 6px; height: 6px; border-radius: 9999px; background: var(--vq-accent); box-shadow: 0 0 8px var(--vq-accent);"></span>
        THE AI BUSINESS COMPILER
      </span>

      <h1 id="main-heading" class="vq-hero vq-hero-h1 fold-text-container" style="font-weight:600;font-size:clamp(44px,7.2vw,84px);line-height:1.0;letter-spacing:-0.04em;max-width:22ch;text-align:center;margin:0">
        Tell us how you operate.<br>
        We <span style="position: relative; color: #23C4A6; display: inline-block;">assemble<span style="position: absolute; left: 0; right: 0; bottom: 6px; height: 6px; border-radius: 999px; background: rgba(35, 196, 166, 0.38);"></span></span> your system.
      </h1>

      <p class="vq-lede vq-hero-subhead" style="max-width:44rem;color:var(--vq-text-2);font-size:clamp(1.05rem,1.4vw,1.25rem);line-height:1.55;margin-top:var(--vq-space-2)">
        VenQore takes your requirements and snaps together battle-tested modules into a custom platform that never breaks.
      </p>

      <!-- The interactive prompt & business picker -->
      <form class="vq-mt-6" data-hero-prompt style="width:100%;display:flex;flex-direction:column;align-items:center;max-width:44rem">
        <div class="vq-hero-rule" style="width:100%;display:flex;align-items:flex-end;gap:var(--vq-space-4);padding-bottom:10px;position:relative">
          <div id="shiny-placeholder" data-hero-placeholder class="shiny-text" aria-hidden="true"
               style="position:absolute;left:8px;bottom:20px;pointer-events:none;font-size:var(--vq-fs-lede);text-align:left;max-width:calc(100% - 108px);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Describe your business (e.g. "Retail pharmacy with batch & expiry")...</div>
          <textarea id="hero-prompt" rows="1" aria-label="Describe your business" class="vq-hero-input"
            style="flex:1;resize:none;background:transparent;border:0;outline:none;font-size:var(--vq-fs-lede);line-height:1.5;padding:8px;max-height:160px;font-family:inherit;color:var(--vq-text);"></textarea>
          <div style="display:flex;align-items:center;gap:8px;padding-bottom:4px">
            <button type="button" class="vq-hero-icon" aria-label="Voice input" title="Voice input"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19v3"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><rect x="9" y="2" width="6" height="13" rx="3"/></svg></button>
            <button type="button" class="vq-hero-go" data-hero-go aria-label="Build my system" title="Build my system"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></button>
          </div>
        </div>

        <div class="vq-row vq-wrap vq-gap-2 vq-mt-6" style="justify-content:center;align-items:center">
          <button id="btn-select-business" type="button" class="vq-btn vq-btn--secondary" style="font-weight:600;display:inline-flex;align-items:center;gap:6px">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            Select your business
          </button>
          <button type="button" class="vq-chip vq-chip--onHero" data-hero-chip="pharmacy">Pharmacy</button>
          <button type="button" class="vq-chip vq-chip--onHero" data-hero-chip="wholesale">Wholesale distributor</button>
          <button type="button" class="vq-chip vq-chip--onHero" data-hero-chip="cafe">Restaurant &amp; café</button>
          <button type="button" class="vq-chip vq-chip--onHero" data-hero-chip="hardware">Hardware &amp; parts</button>
          <button type="button" class="vq-chip vq-chip--onHero" data-hero-chip="multi">Multi-branch</button>
        </div>

        <div style="display:flex;align-items:center;gap:18px;flex-wrap:wrap;justify-content:center;margin-top:16px;font:500 13px/1 var(--vq-font-sans);color:var(--vq-text-3);">
          <span>1,600+ automated tests</span><span style="opacity:.4">·</span>
          <span>11,000+ assertions</span><span style="opacity:.4">·</span>
          <span>7 correctness checks on every post</span>
        </div>

        <p class="vq-caption vq-mt-4 vq-hero-caret" style="max-width:none">
          Free to try. No card. You'll see your live system before you sign up for anything.
        </p>
      </form>
    </div>

    <div class="vq-hero-foot" style="margin-inline:auto;width:100%;max-width:58rem;display:flex;align-items:flex-end;justify-content:space-between;gap:var(--vq-space-6);padding:var(--vq-space-8) var(--vq-space-6) var(--vq-space-10)">
      <p class="vq-small" style="max-width:26rem;color:var(--vq-text-2);">
        Describe how you actually work. VenQore assembles the system that runs it — and every
        number it produces is backed by double-entry accounting.
      </p>
      <a href="#compiler" aria-label="How it works">
        <span class="animate-bounce-slow" style="display:block"><svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg></span>
      </a>
    </div>
  </section>

  <!-- MOVING STRIP 1: LIVE BUSINESSES & AUTOMATED TESTS TICKER -->
  <div class="vq-ticker-strip">
    <div class="vq-ticker-track">
      <span class="vq-ticker-item"><span class="vq-ticker-dot"></span><b>2 businesses live today</b> running real money through Core Ledger</span>
      <span class="vq-ticker-item"><span class="vq-ticker-dot"></span><b>1,600+ automated tests</b> guarding compilation integrity</span>
      <span class="vq-ticker-item"><span class="vq-ticker-dot"></span><b>11,000+ assertions</b> verifying accounting invariants</span>
      <span class="vq-ticker-item"><span class="vq-ticker-dot"></span><b>46 proven modules</b> parameterized in milliseconds</span>
      <span class="vq-ticker-item"><span class="vq-ticker-dot"></span><b>7 correctness checks</b> run on every transaction post</span>
      <span class="vq-ticker-item"><span class="vq-ticker-dot"></span><b>0 balance drift</b> with immutable double-entry ledger</span>
      <!-- Seamless Loop Duplicate -->
      <span class="vq-ticker-item"><span class="vq-ticker-dot"></span><b>2 businesses live today</b> running real money through Core Ledger</span>
      <span class="vq-ticker-item"><span class="vq-ticker-dot"></span><b>1,600+ automated tests</b> guarding compilation integrity</span>
      <span class="vq-ticker-item"><span class="vq-ticker-dot"></span><b>11,000+ assertions</b> verifying accounting invariants</span>
      <span class="vq-ticker-item"><span class="vq-ticker-dot"></span><b>46 proven modules</b> parameterized in milliseconds</span>
      <span class="vq-ticker-item"><span class="vq-ticker-dot"></span><b>7 correctness checks</b> run on every transaction post</span>
      <span class="vq-ticker-item"><span class="vq-ticker-dot"></span><b>0 balance drift</b> with immutable double-entry ledger</span>
    </div>
  </div>

  <!-- SECTION B: SECOND SECTION - 5-STAGE COMPILER THEATER (PRESERVED) -->
  <section id="compiler" data-sec="compiler" data-theater="1" style="position: relative; height: 600vh; background: var(--vq-bg); z-index: 10;">
    <div style="position: sticky; top: 0; height: 100vh; overflow: hidden; display: flex; flex-direction: column;">
      <div style="position: absolute; inset: 0; background: radial-gradient(70% 60% at 50% 0%, rgba(11, 170, 143, 0.16), transparent 70%);"></div>

      <div data-thgrid="1" style="position: relative; flex: 1; max-width: 1240px; width: 100%; margin: 0 auto; padding: 96px 28px 40px; display: grid; grid-template-columns: 250px 1fr; gap: 40px; align-items: start; min-height: 0;">

        <div style="display: flex; flex-direction: column; gap: 4px; padding-top: 4px;">
          <span style="font: 700 11px/1 var(--vq-font-numeric); letter-spacing: .14em; color: var(--vq-accent); margin-bottom: 16px;">COMPILATION PASS</span>
          
          <div data-stagerow="0" style="display: grid; grid-template-columns: 34px 1fr; gap: 12px; padding: 10px 0; opacity: 1; transition: opacity var(--vq-dur-3) var(--vq-ease-out);">
            <span style="font: 600 12px/1.6 var(--vq-font-numeric); color: var(--vq-text-3);">01</span>
            <span style="display: flex; flex-direction: column; gap: 3px;">
              <span style="font: 600 15px/1.2 var(--vq-font-display); letter-spacing: -.02em; color: var(--vq-text);">Intent</span>
              <span style="font: 500 12.5px/1.45 var(--vq-font-sans); color: var(--vq-text-2);">You describe how you operate</span>
              <span data-stagebar="0" style="height: 2px; width: 0%; margin-top: 5px; border-radius: 999px; background: linear-gradient(90deg, #0BAA8F, #59DBC0);"></span>
            </span>
          </div>

          <div data-stagerow="1" style="display: grid; grid-template-columns: 34px 1fr; gap: 12px; padding: 10px 0; opacity: .34; transition: opacity var(--vq-dur-3) var(--vq-ease-out);">
            <span style="font: 600 12px/1.6 var(--vq-font-numeric); color: var(--vq-text-3);">02</span>
            <span style="display: flex; flex-direction: column; gap: 3px;">
              <span style="font: 600 15px/1.2 var(--vq-font-display); letter-spacing: -.02em; color: var(--vq-text);">Parse</span>
              <span style="font: 500 12.5px/1.45 var(--vq-font-sans); color: var(--vq-text-2);">Entities, workflows, financial routes</span>
              <span data-stagebar="1" style="height: 2px; width: 0%; margin-top: 5px; border-radius: 999px; background: linear-gradient(90deg, #0BAA8F, #59DBC0);"></span>
            </span>
          </div>

          <div data-stagerow="2" style="display: grid; grid-template-columns: 34px 1fr; gap: 12px; padding: 10px 0; opacity: .34; transition: opacity var(--vq-dur-3) var(--vq-ease-out);">
            <span style="font: 600 12px/1.6 var(--vq-font-numeric); color: var(--vq-text-3);">03</span>
            <span style="display: flex; flex-direction: column; gap: 3px;">
              <span style="font: 600 15px/1.2 var(--vq-font-display); letter-spacing: -.02em; color: var(--vq-text);">Select</span>
              <span style="font: 500 12.5px/1.45 var(--vq-font-sans); color: var(--vq-text-2);">Proven engines, parameterized</span>
              <span data-stagebar="2" style="height: 2px; width: 0%; margin-top: 5px; border-radius: 999px; background: linear-gradient(90deg, #0BAA8F, #59DBC0);"></span>
            </span>
          </div>

          <div data-stagerow="3" style="display: grid; grid-template-columns: 34px 1fr; gap: 12px; padding: 10px 0; opacity: .34; transition: opacity var(--vq-dur-3) var(--vq-ease-out);">
            <span style="font: 600 12px/1.6 var(--vq-font-numeric); color: var(--vq-text-3);">04</span>
            <span style="display: flex; flex-direction: column; gap: 3px;">
              <span style="font: 600 15px/1.2 var(--vq-font-display); letter-spacing: -.02em; color: var(--vq-text);">Wire</span>
              <span style="font: 500 12.5px/1.45 var(--vq-font-sans); color: var(--vq-text-2);">Routes bound to the double-entry core</span>
              <span data-stagebar="3" style="height: 2px; width: 0%; margin-top: 5px; border-radius: 999px; background: linear-gradient(90deg, #0BAA8F, #59DBC0);"></span>
            </span>
          </div>

          <div data-stagerow="4" style="display: grid; grid-template-columns: 34px 1fr; gap: 12px; padding: 10px 0; opacity: .34; transition: opacity var(--vq-dur-3) var(--vq-ease-out);">
            <span style="font: 600 12px/1.6 var(--vq-font-numeric); color: var(--vq-text-3);">05</span>
            <span style="display: flex; flex-direction: column; gap: 3px;">
              <span style="font: 600 15px/1.2 var(--vq-font-display); letter-spacing: -.02em; color: var(--vq-text);">Live</span>
              <span style="font: 500 12.5px/1.45 var(--vq-font-sans); color: var(--vq-text-2);">Your system, running</span>
              <span data-stagebar="4" style="height: 2px; width: 0%; margin-top: 5px; border-radius: 999px; background: linear-gradient(90deg, #0BAA8F, #59DBC0);"></span>
            </span>
          </div>
        </div>

        <div style="position: relative; height: min(620px, 66vh); border-radius: var(--vq-r-2xl, 24px); border: 1px solid var(--vq-line); background: var(--vq-surface); box-shadow: var(--vq-elev-3); overflow: hidden;">
          <div style="display: flex; align-items: center; gap: 8px; padding: 14px 18px; border-bottom: 1px solid var(--vq-line-soft);">
            <span style="width: 9px; height: 9px; border-radius: 999px; background: #FF8A6B;"></span>
            <span style="width: 9px; height: 9px; border-radius: 999px; background: #FFCD5B;"></span>
            <span style="width: 9px; height: 9px; border-radius: 999px; background: #A9E34B;"></span>
            <span data-frametitle="1" style="margin-left: 12px; font: 600 11px/1 var(--vq-font-numeric); letter-spacing: .12em; color: var(--vq-text-3);">BLUEPRINT · READING INTENT</span>
            <span style="margin-left: auto; font: 600 11px/1 var(--vq-font-numeric); letter-spacing: .1em; color: var(--vq-accent);">LIVE</span>
          </div>

          <div style="position: relative; height: calc(100% - 45px);">

            <!-- Stage 01: Intent -->
            <div data-layer="0" style="position: absolute; inset: 0; padding: 44px 48px; display: flex; flex-direction: column; justify-content: center; gap: 24px; opacity: 1;">
              <span style="font: 700 11px/1 var(--vq-font-numeric); letter-spacing: .14em; color: var(--vq-text-3);">THE OWNER TYPES</span>
              <p style="margin: 0; font: 600 clamp(22px, 2.5vw, 34px)/1.32 var(--vq-font-display); letter-spacing: -.028em; color: var(--vq-text); max-width: 30ch;"><span data-typed="1"></span><span style="display: inline-block; width: 3px; height: 1em; margin-left: 4px; vertical-align: -0.12em; background: var(--vq-accent); animation: vqBlink 1s steps(1) infinite;"></span></p>
              <span style="font: 500 14px/1.5 var(--vq-font-sans); color: var(--vq-text-2);">No forms. No implementation consultant. One paragraph in your own words.</span>
            </div>

            <!-- Stage 02: Parse -->
            <div data-layer="1" style="position: absolute; inset: 0; padding: 40px 48px; display: flex; flex-direction: column; justify-content: center; gap: 20px; opacity: 0;">
              <span style="font: 700 11px/1 var(--vq-font-numeric); letter-spacing: .14em; color: var(--vq-text-3);">DOMAIN PARSE</span>
              <div style="display: flex; flex-direction: column; gap: 12px;">
                <div style="display: flex; flex-direction: column; gap: 6px;">
                  <span style="font: 600 12px/1 var(--vq-font-sans); color: var(--vq-text);">ENTITIES</span>
                  <div style="display: flex; flex-wrap: wrap; gap: 7px;">
                    <span data-token="0" style="display: inline-flex; align-items: center; gap: 7px; padding: 6px 12px; border-radius: 999px; border: 1px solid var(--vq-line); background: var(--vq-sunken); font: 500 12.5px/1 var(--vq-font-sans); color: var(--vq-text); opacity: 0; transform: translateY(8px) scale(.96); transition: all 320ms var(--vq-ease-spring);"><span style="width: 5px; height: 5px; border-radius: 999px; background: var(--vq-accent);"></span>Drugs &amp; SKUs</span>
                    <span data-token="1" style="display: inline-flex; align-items: center; gap: 7px; padding: 6px 12px; border-radius: 999px; border: 1px solid var(--vq-line); background: var(--vq-sunken); font: 500 12.5px/1 var(--vq-font-sans); color: var(--vq-text); opacity: 0; transform: translateY(8px) scale(.96); transition: all 320ms var(--vq-ease-spring);"><span style="width: 5px; height: 5px; border-radius: 999px; background: var(--vq-accent);"></span>Batches</span>
                    <span data-token="2" style="display: inline-flex; align-items: center; gap: 7px; padding: 6px 12px; border-radius: 999px; border: 1px solid var(--vq-line); background: var(--vq-sunken); font: 500 12.5px/1 var(--vq-font-sans); color: var(--vq-text); opacity: 0; transform: translateY(8px) scale(.96); transition: all 320ms var(--vq-ease-spring);"><span style="width: 5px; height: 5px; border-radius: 999px; background: var(--vq-accent);"></span>Expiry dates</span>
                    <span data-token="3" style="display: inline-flex; align-items: center; gap: 7px; padding: 6px 12px; border-radius: 999px; border: 1px solid var(--vq-line); background: var(--vq-sunken); font: 500 12.5px/1 var(--vq-font-sans); color: var(--vq-text); opacity: 0; transform: translateY(8px) scale(.96); transition: all 320ms var(--vq-ease-spring);"><span style="width: 5px; height: 5px; border-radius: 999px; background: var(--vq-accent);"></span>Branches</span>
                    <span data-token="4" style="display: inline-flex; align-items: center; gap: 7px; padding: 6px 12px; border-radius: 999px; border: 1px solid var(--vq-line); background: var(--vq-sunken); font: 500 12.5px/1 var(--vq-font-sans); color: var(--vq-text); opacity: 0; transform: translateY(8px) scale(.96); transition: all 320ms var(--vq-ease-spring);"><span style="width: 5px; height: 5px; border-radius: 999px; background: var(--vq-accent);"></span>Distributors</span>
                  </div>
                </div>
                <div style="display: flex; flex-direction: column; gap: 6px;">
                  <span style="font: 600 12px/1 var(--vq-font-sans); color: var(--vq-text);">WORKFLOWS</span>
                  <div style="display: flex; flex-wrap: wrap; gap: 7px;">
                    <span data-token="5" style="display: inline-flex; align-items: center; gap: 7px; padding: 6px 12px; border-radius: 999px; border: 1px solid var(--vq-line); background: var(--vq-sunken); font: 500 12.5px/1 var(--vq-font-sans); color: var(--vq-text); opacity: 0; transform: translateY(8px) scale(.96); transition: all 320ms var(--vq-ease-spring);"><span style="width: 5px; height: 5px; border-radius: 999px; background: #55C4EC;"></span>Counter checkout</span>
                    <span data-token="6" style="display: inline-flex; align-items: center; gap: 7px; padding: 6px 12px; border-radius: 999px; border: 1px solid var(--vq-line); background: var(--vq-sunken); font: 500 12.5px/1 var(--vq-font-sans); color: var(--vq-text); opacity: 0; transform: translateY(8px) scale(.96); transition: all 320ms var(--vq-ease-spring);"><span style="width: 5px; height: 5px; border-radius: 999px; background: #55C4EC;"></span>Batch-first picking</span>
                    <span data-token="7" style="display: inline-flex; align-items: center; gap: 7px; padding: 6px 12px; border-radius: 999px; border: 1px solid var(--vq-line); background: var(--vq-sunken); font: 500 12.5px/1 var(--vq-font-sans); color: var(--vq-text); opacity: 0; transform: translateY(8px) scale(.96); transition: all 320ms var(--vq-ease-spring);"><span style="width: 5px; height: 5px; border-radius: 999px; background: #55C4EC;"></span>Branch transfers</span>
                    <span data-token="8" style="display: inline-flex; align-items: center; gap: 7px; padding: 6px 12px; border-radius: 999px; border: 1px solid var(--vq-line); background: var(--vq-sunken); font: 500 12.5px/1 var(--vq-font-sans); color: var(--vq-text); opacity: 0; transform: translateY(8px) scale(.96); transition: all 320ms var(--vq-ease-spring);"><span style="width: 5px; height: 5px; border-radius: 999px; background: #55C4EC;"></span>Expiry write-off</span>
                  </div>
                </div>
                <div style="display: flex; flex-direction: column; gap: 6px;">
                  <span style="font: 600 12px/1 var(--vq-font-sans); color: var(--vq-text);">FINANCIAL ROUTES</span>
                  <div style="display: flex; flex-wrap: wrap; gap: 7px;">
                    <span data-token="9" style="display: inline-flex; align-items: center; gap: 7px; padding: 6px 12px; border-radius: 999px; border: 1px solid var(--vq-line); background: var(--vq-sunken); font: 500 12.5px/1 var(--vq-font-sans); color: var(--vq-text); opacity: 0; transform: translateY(8px) scale(.96); transition: all 320ms var(--vq-ease-spring);"><span style="width: 5px; height: 5px; border-radius: 999px; background: #FFCD5B;"></span>Accounts payable · 30-day terms</span>
                    <span data-token="10" style="display: inline-flex; align-items: center; gap: 7px; padding: 6px 12px; border-radius: 999px; border: 1px solid var(--vq-line); background: var(--vq-sunken); font: 500 12.5px/1 var(--vq-font-sans); color: var(--vq-text); opacity: 0; transform: translateY(8px) scale(.96); transition: all 320ms var(--vq-ease-spring);"><span style="width: 5px; height: 5px; border-radius: 999px; background: #FFCD5B;"></span>Sales tax on invoice</span>
                    <span data-token="11" style="display: inline-flex; align-items: center; gap: 7px; padding: 6px 12px; border-radius: 999px; border: 1px solid var(--vq-line); background: var(--vq-sunken); font: 500 12.5px/1 var(--vq-font-sans); color: var(--vq-text); opacity: 0; transform: translateY(8px) scale(.96); transition: all 320ms var(--vq-ease-spring);"><span style="width: 5px; height: 5px; border-radius: 999px; background: #FFCD5B;"></span>Inventory valuation</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Stage 03: Select -->
            <div data-layer="2" style="position: absolute; inset: 0; padding: 36px 44px; display: flex; flex-direction: column; justify-content: center; gap: 18px; opacity: 0;">
              <div style="display: flex; align-items: baseline; justify-content: space-between; gap: 16px;">
                <span style="font: 700 11px/1 var(--vq-font-numeric); letter-spacing: .14em; color: var(--vq-text-3);">ENGINE SELECTION</span>
                <span style="font: 500 12px/1 var(--vq-font-sans); color: var(--vq-text-2);"><span data-selcount="1" style="font-family: var(--vq-font-numeric); color: var(--vq-accent);">0</span> of 24 engines wired</span>
              </div>
              <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
                <div data-engine="0" data-on="1" style="padding: 12px 14px; border-radius: var(--vq-r-md, 12px); border: 1px solid var(--vq-line); background: var(--vq-sunken); opacity: .28; transition: all 380ms var(--vq-ease-spring);"><span style="display: block; font: 600 13px/1.25 var(--vq-font-display); color: var(--vq-text);">POS checkout</span><span style="display: block; margin-top: 4px; font: 500 10.5px/1.3 var(--vq-font-numeric); color: var(--vq-accent-text);">SELECTED</span></div>
                <div data-engine="1" data-on="1" style="padding: 12px 14px; border-radius: var(--vq-r-md, 12px); border: 1px solid var(--vq-line); background: var(--vq-sunken); opacity: .28; transition: all 380ms var(--vq-ease-spring);"><span style="display: block; font: 600 13px/1.25 var(--vq-font-display); color: var(--vq-text);">Batch &amp; expiry</span><span style="display: block; margin-top: 4px; font: 500 10.5px/1.3 var(--vq-font-numeric); color: var(--vq-accent-text);">SELECTED</span></div>
                <div data-engine="2" data-on="1" style="padding: 12px 14px; border-radius: var(--vq-r-md, 12px); border: 1px solid var(--vq-line); background: var(--vq-sunken); opacity: .28; transition: all 380ms var(--vq-ease-spring);"><span style="display: block; font: 600 13px/1.25 var(--vq-font-display); color: var(--vq-text);">Stock ledger</span><span style="display: block; margin-top: 4px; font: 500 10.5px/1.3 var(--vq-font-numeric); color: var(--vq-accent-text);">SELECTED</span></div>
                <div data-engine="3" data-on="0" style="padding: 12px 14px; border-radius: var(--vq-r-md, 12px); border: 1px solid var(--vq-line); background: var(--vq-sunken); opacity: .12;"><span style="display: block; font: 600 13px/1.25 var(--vq-font-display); color: var(--vq-text-3);">Manufacturing BOM</span><span style="display: block; margin-top: 4px; font: 500 10.5px/1.3 var(--vq-font-numeric); color: var(--vq-text-3);">not needed</span></div>
                <div data-engine="4" data-on="1" style="padding: 12px 14px; border-radius: var(--vq-r-md, 12px); border: 1px solid var(--vq-line); background: var(--vq-sunken); opacity: .28; transition: all 380ms var(--vq-ease-spring);"><span style="display: block; font: 600 13px/1.25 var(--vq-font-display); color: var(--vq-text);">Purchases &amp; credit</span><span style="display: block; margin-top: 4px; font: 500 10.5px/1.3 var(--vq-font-numeric); color: var(--vq-accent-text);">SELECTED</span></div>
                <div data-engine="5" data-on="1" style="padding: 12px 14px; border-radius: var(--vq-r-md, 12px); border: 1px solid var(--vq-line); background: var(--vq-sunken); opacity: .28; transition: all 380ms var(--vq-ease-spring);"><span style="display: block; font: 600 13px/1.25 var(--vq-font-display); color: var(--vq-text);">Branch transfers</span><span style="display: block; margin-top: 4px; font: 500 10.5px/1.3 var(--vq-font-numeric); color: var(--vq-accent-text);">SELECTED</span></div>
                <div data-engine="6" data-on="0" style="padding: 12px 14px; border-radius: var(--vq-r-md, 12px); border: 1px solid var(--vq-line); background: var(--vq-sunken); opacity: .12;"><span style="display: block; font: 600 13px/1.25 var(--vq-font-display); color: var(--vq-text-3);">Payroll</span><span style="display: block; margin-top: 4px; font: 500 10.5px/1.3 var(--vq-font-numeric); color: var(--vq-text-3);">not needed</span></div>
                <div data-engine="7" data-on="0" style="padding: 12px 14px; border-radius: var(--vq-r-md, 12px); border: 1px solid var(--vq-line); background: var(--vq-sunken); opacity: .12;"><span style="display: block; font: 600 13px/1.25 var(--vq-font-display); color: var(--vq-text-3);">Container logistics</span><span style="display: block; margin-top: 4px; font: 500 10.5px/1.3 var(--vq-font-numeric); color: var(--vq-text-3);">not needed</span></div>
                <div data-engine="8" data-on="1" style="padding: 12px 14px; border-radius: var(--vq-r-md, 12px); border: 1px solid var(--vq-line); background: var(--vq-sunken); opacity: .28; transition: all 380ms var(--vq-ease-spring);"><span style="display: block; font: 600 13px/1.25 var(--vq-font-display); color: var(--vq-text);">Core Ledger</span><span style="display: block; margin-top: 4px; font: 500 10.5px/1.3 var(--vq-font-numeric); color: var(--vq-accent);">ALWAYS ON</span></div>
                <div data-engine="9" data-on="0" style="padding: 12px 14px; border-radius: var(--vq-r-md, 12px); border: 1px solid var(--vq-line); background: var(--vq-sunken); opacity: .12;"><span style="display: block; font: 600 13px/1.25 var(--vq-font-display); color: var(--vq-text-3);">Table service</span><span style="display: block; margin-top: 4px; font: 500 10.5px/1.3 var(--vq-font-numeric); color: var(--vq-text-3);">not needed</span></div>
                <div data-engine="10" data-on="0" style="padding: 12px 14px; border-radius: var(--vq-r-md, 12px); border: 1px solid var(--vq-line); background: var(--vq-sunken); opacity: .12;"><span style="display: block; font: 600 13px/1.25 var(--vq-font-display); color: var(--vq-text-3);">Tier pricing matrix</span><span style="display: block; margin-top: 4px; font: 500 10.5px/1.3 var(--vq-font-numeric); color: var(--vq-text-3);">not needed</span></div>
                <div data-engine="11" data-on="0" style="padding: 12px 14px; border-radius: var(--vq-r-md, 12px); border: 1px solid var(--vq-line); background: var(--vq-sunken); opacity: .12;"><span style="display: block; font: 600 13px/1.25 var(--vq-font-display); color: var(--vq-text-3);">Channel sync</span><span style="display: block; margin-top: 4px; font: 500 10.5px/1.3 var(--vq-font-numeric); color: var(--vq-text-3);">not needed</span></div>
              </div>
            </div>

            <!-- Stage 04: Wire -->
            <div data-layer="3" style="position: absolute; inset: 0; padding: 34px 44px; opacity: 0;">
              <span style="font: 700 11px/1 var(--vq-font-numeric); letter-spacing: .14em; color: var(--vq-text-3);">TOPOLOGY · ROUTES BOUND TO CORE LEDGER</span>
              <div style="position: relative; height: calc(100% - 26px); margin-top: 18px; display: grid; grid-template-columns: 1fr 1fr 1.15fr; gap: 40px; align-items: center;">
                <svg data-wires="1" style="position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; overflow: visible;">
                  <path data-wire="1" fill="none" stroke="#0BAA8F" stroke-width="2.2" stroke-linecap="round"></path>
                  <path data-wire="1" fill="none" stroke="#0BAA8F" stroke-width="2.2" stroke-linecap="round"></path>
                  <path data-wire="1" fill="none" stroke="#0BAA8F" stroke-width="2.2" stroke-linecap="round"></path>
                  <path data-wire="1" fill="none" stroke="#59DBC0" stroke-width="2.6" stroke-linecap="round"></path>
                  <path data-wire="1" fill="none" stroke="#59DBC0" stroke-width="2.6" stroke-linecap="round"></path>
                </svg>
                <div style="display: flex; flex-direction: column; gap: 14px; position: relative;">
                  <div data-node="in" style="position: relative; padding: 13px 16px; border-radius: var(--vq-r-md, 12px); border: 1px solid var(--vq-line); background: var(--vq-sunken); font: 600 13px/1.25 var(--vq-font-display); color: var(--vq-text);">POS terminals<span style="display: block; margin-top: 4px; font: 500 10.5px/1 var(--vq-font-numeric); letter-spacing: .08em; color: var(--vq-text-3);">3 BRANCHES</span><span style="position: absolute; right: -5px; top: 50%; transform: translateY(-50%); width: 8px; height: 8px; border-radius: 999px; background: var(--vq-accent); border: 2px solid var(--vq-surface); box-shadow: 0 0 8px var(--vq-accent);"></span></div>
                  <div data-node="in" style="position: relative; padding: 13px 16px; border-radius: var(--vq-r-md, 12px); border: 1px solid var(--vq-line); background: var(--vq-sunken); font: 600 13px/1.25 var(--vq-font-display); color: var(--vq-text);">Purchase receipts<span style="display: block; margin-top: 4px; font: 500 10.5px/1 var(--vq-font-numeric); letter-spacing: .08em; color: var(--vq-text-3);">DISTRIBUTORS</span><span style="position: absolute; right: -5px; top: 50%; transform: translateY(-50%); width: 8px; height: 8px; border-radius: 999px; background: var(--vq-accent); border: 2px solid var(--vq-surface); box-shadow: 0 0 8px var(--vq-accent);"></span></div>
                  <div data-node="in" style="position: relative; padding: 13px 16px; border-radius: var(--vq-r-md, 12px); border: 1px solid var(--vq-line); background: var(--vq-sunken); font: 600 13px/1.25 var(--vq-font-display); color: var(--vq-text);">SmartCapture<span style="display: block; margin-top: 4px; font: 500 10.5px/1 var(--vq-font-numeric); letter-spacing: .08em; color: var(--vq-text-3);">PHOTO · VOICE</span><span style="position: absolute; right: -5px; top: 50%; transform: translateY(-50%); width: 8px; height: 8px; border-radius: 999px; background: var(--vq-accent); border: 2px solid var(--vq-surface); box-shadow: 0 0 8px var(--vq-accent);"></span></div>
                </div>
                <div style="display: flex; flex-direction: column; gap: 18px; position: relative;">
                  <div data-node="mid" style="position: relative; padding: 15px 18px; border-radius: var(--vq-r-md, 12px); border: 1px solid var(--vq-accent-quiet-line); background: var(--vq-accent-quiet); font: 600 13px/1.25 var(--vq-font-display); color: var(--vq-text);"><span style="position: absolute; left: -5px; top: 50%; transform: translateY(-50%); width: 8px; height: 8px; border-radius: 999px; background: var(--vq-accent); border: 2px solid var(--vq-surface);"></span>Stock &amp; batch engine<span style="display: block; margin-top: 4px; font: 500 10.5px/1 var(--vq-font-numeric); letter-spacing: .08em; color: var(--vq-accent-text);">FEFO · EXPIRY GUARD</span><span style="position: absolute; right: -5px; top: 50%; transform: translateY(-50%); width: 8px; height: 8px; border-radius: 999px; background: #59DBC0; border: 2px solid var(--vq-surface); box-shadow: 0 0 8px #59DBC0;"></span></div>
                  <div data-node="mid" style="position: relative; padding: 15px 18px; border-radius: var(--vq-r-md, 12px); border: 1px solid var(--vq-accent-quiet-line); background: var(--vq-accent-quiet); font: 600 13px/1.25 var(--vq-font-display); color: var(--vq-text);"><span style="position: absolute; left: -5px; top: 50%; transform: translateY(-50%); width: 8px; height: 8px; border-radius: 999px; background: var(--vq-accent); border: 2px solid var(--vq-surface);"></span>Payables &amp; terms<span style="display: block; margin-top: 4px; font: 500 10.5px/1 var(--vq-font-numeric); letter-spacing: .08em; color: var(--vq-accent-text);">30-DAY AGING</span><span style="position: absolute; right: -5px; top: 50%; transform: translateY(-50%); width: 8px; height: 8px; border-radius: 999px; background: #59DBC0; border: 2px solid var(--vq-surface); box-shadow: 0 0 8px #59DBC0;"></span></div>
                </div>
                <div style="position: relative;">
                  <div data-node="core" style="position: relative; padding: 22px 20px; border-radius: var(--vq-r-lg, 16px); background: var(--vq-grad-mint); box-shadow: var(--vq-glow-accent-strong); color: #fff;">
                    <span style="position: absolute; left: -5px; top: 50%; transform: translateY(-50%); width: 8px; height: 8px; border-radius: 999px; background: #fff; border: 2px solid #088975; box-shadow: 0 0 10px #fff;"></span>
                    <span style="font: 700 10.5px/1 var(--vq-font-numeric); letter-spacing: .14em; color: rgba(255, 255, 255, 0.75);">THE ENGINE</span>
                    <span style="display: block; margin-top: 8px; font: 600 20px/1.1 var(--vq-font-display); letter-spacing: -.03em;">Core Ledger</span>
                    <span style="display: block; margin-top: 8px; font: 500 12px/1.45 var(--vq-font-sans); color: rgba(255, 255, 255, 0.84);">Every module posts here. Debits equal credits or the post is refused.</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Stage 05: Live -->
            <div data-layer="4" style="position: absolute; inset: 0; padding: 30px 34px; opacity: 0;">
              <div style="height: 100%; display: grid; grid-template-columns: 1.35fr 1fr; gap: 16px;">
                <div style="border-radius: var(--vq-r-lg, 16px); border: 1px solid var(--vq-line); background: var(--vq-sunken); padding: 18px; display: flex; flex-direction: column; gap: 12px; min-height: 0;">
                  <div style="display: flex; align-items: center; justify-content: space-between;">
                    <span style="font: 600 13px/1 var(--vq-font-display); letter-spacing: -.02em; color: var(--vq-text);">Checkout · Branch 2</span>
                    <span style="font: 600 10.5px/1 var(--vq-font-numeric); letter-spacing: .1em; color: var(--vq-success);">BATCH EXPIRY ON</span>
                  </div>
                  <div style="display: flex; flex-direction: column; gap: 8px;">
                    <div style="display: grid; grid-template-columns: 1fr auto; gap: 8px; padding: 8px 0; border-bottom: 1px solid var(--vq-line-soft);">
                      <span style="display: flex; flex-direction: column; gap: 3px;">
                        <span style="font: 500 13px/1 var(--vq-font-sans); color: var(--vq-text);">Amoxicillin 500mg × 2</span>
                        <span style="font: 500 11px/1 var(--vq-font-numeric); letter-spacing: .05em; color: var(--vq-text-3);">BATCH A-2291 · EXP 03/2027</span>
                      </span>
                      <span style="font: 600 13px/1 var(--vq-font-numeric); font-variant-numeric: tabular-nums; color: var(--vq-text); align-self: center;">Rs 1,240.00</span>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr auto; gap: 8px; padding: 8px 0; border-bottom: 1px solid var(--vq-line-soft);">
                      <span style="display: flex; flex-direction: column; gap: 3px;">
                        <span style="font: 500 13px/1 var(--vq-font-sans); color: var(--vq-text);">Insulin pen refill</span>
                        <span style="font: 500 11px/1 var(--vq-font-numeric); letter-spacing: .05em; color: var(--vq-text-3);">BATCH C-0417 · EXP 11/2026</span>
                      </span>
                      <span style="font: 600 13px/1 var(--vq-font-numeric); font-variant-numeric: tabular-nums; color: var(--vq-text); align-self: center;">Rs 2,660.00</span>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr auto; gap: 8px; padding: 8px 0; border-bottom: 1px solid var(--vq-line-soft);">
                      <span style="display: flex; flex-direction: column; gap: 3px;">
                        <span style="font: 500 13px/1 var(--vq-font-sans); color: var(--vq-text);">Paracetamol strip × 4</span>
                        <span style="font: 500 11px/1 var(--vq-font-numeric); letter-spacing: .05em; color: var(--vq-text-3);">BATCH P-8802 · EXP 08/2028</span>
                      </span>
                      <span style="font: 600 13px/1 var(--vq-font-numeric); font-variant-numeric: tabular-nums; color: var(--vq-text); align-self: center;">Rs 418.00</span>
                    </div>
                  </div>
                  <div style="margin-top: auto; display: flex; align-items: baseline; justify-content: space-between; padding-top: 12px; border-top: 1px solid var(--vq-line);">
                    <span style="font: 700 10.5px/1 var(--vq-font-numeric); letter-spacing: .14em; color: var(--vq-text-3);">TOTAL</span>
                    <span style="font: 600 24px/1 var(--vq-font-numeric); font-variant-numeric: tabular-nums; letter-spacing: -.03em; color: var(--vq-text);">Rs 4,318.00</span>
                  </div>
                </div>
                <div style="display: flex; flex-direction: column; gap: 12px; min-height: 0;">
                  <div style="border-radius: var(--vq-r-lg, 16px); border: 1px solid var(--vq-success-line); background: var(--vq-success-bg); padding: 14px 16px;">
                    <span style="font: 700 10.5px/1 var(--vq-font-numeric); letter-spacing: .14em; color: var(--vq-success);">POSTED · 7 CHECKS PASSED</span>
                    <div style="margin-top: 10px; display: grid; grid-template-columns: 1fr auto; gap: 6px 10px; font: 500 12px/1.5 var(--vq-font-numeric); font-variant-numeric: tabular-nums; color: var(--vq-text);">
                      <span>Debits</span><span>Rs 4,318.00</span>
                      <span>Credits</span><span>Rs 4,318.00</span>
                    </div>
                  </div>
                  <div style="flex: 1; border-radius: var(--vq-r-lg, 16px); border: 1px solid var(--vq-line); background: var(--vq-sunken); padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; min-height: 0;">
                    <span style="font: 700 10.5px/1 var(--vq-font-numeric); letter-spacing: .14em; color: var(--vq-text-3);">EXPIRING IN 45 DAYS</span>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                      <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; font: 500 12px/1.4 var(--vq-font-sans); color: var(--vq-text-2);"><span>Batch C-0417 · Insulin</span><span style="font: 600 11px/1 var(--vq-font-numeric); color: var(--vq-warning);">18 DAYS</span></div>
                      <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; font: 500 12px/1.4 var(--vq-font-sans); color: var(--vq-text-2);"><span>Batch V-1120 · Vitamin D</span><span style="font: 600 11px/1 var(--vq-font-numeric); color: var(--vq-warning);">31 DAYS</span></div>
                      <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; font: 500 12px/1.4 var(--vq-font-sans); color: var(--vq-text-2);"><span>Batch A-9043 · Syrup</span><span style="font: 600 11px/1 var(--vq-font-numeric); color: var(--vq-warning);">44 DAYS</span></div>
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

  <div class="vq-page" style="position: relative; z-index: 10;">

    <!-- SECTION 3: THE TWO BROKEN EXTREMES -->
    <section id="extremes" data-sec="extremes" style="position: relative; background: var(--vq-bg-alt); padding: 112px 24px;">
      <div style="max-width: 1240px; margin: 0 auto;">
        <div class="vq-section-head vq-reveal" style="display: flex; flex-direction: column; gap: 14px; max-width: 720px;">
          <span style="font: 700 11px/1 var(--vq-font-numeric); letter-spacing: .14em; color: var(--vq-accent-text);">THE TWO BROKEN EXTREMES</span>
          <h2 class="vq-display" style="margin: 0; font: 600 var(--vq-fs-display)/var(--vq-lh-display) var(--vq-font-display); letter-spacing: var(--vq-ls-display); color: var(--vq-text); text-wrap: balance;">Rigid software, or hallucinated software.</h2>
          <p class="vq-lede" style="margin: 0; max-width: 62ch; font: 400 var(--vq-fs-lede)/var(--vq-lh-lede) var(--vq-font-sans); color: var(--vq-text-2);">For thirty years those were the only two options. One asks your business to change shape. The other invents your numbers.</p>
        </div>

        <div style="margin-top: 52px; display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; align-items: stretch;">
          <div class="vq-card vq-reveal" style="padding: 28px; border-radius: var(--vq-r-xl, 20px); background: var(--vq-surface); border: 1px solid var(--vq-line); display: flex; flex-direction: column; gap: 14px;">
            <span style="font: 700 10.5px/1 var(--vq-font-numeric); letter-spacing: .14em; color: var(--vq-text-3);">LEGACY ERP / POS</span>
            <h3 style="margin: 0; font: 600 var(--vq-fs-h3)/var(--vq-lh-h3) var(--vq-font-display); letter-spacing: var(--vq-ls-h3); color: var(--vq-text);">Clunky and inflexible</h3>
            <p style="margin: 0; font: 400 15px/1.6 var(--vq-font-sans); color: var(--vq-text-2);">Five hundred pre-built menus and rigid settings. A bakery gets buried in wholesale manufacturing screens. A pharmacy finds batch expiry was never part of checkout.</p>
            <div style="margin-top: auto; display: flex; flex-direction: column; gap: 8px; padding-top: 16px; border-top: 1px solid var(--vq-line-soft);">
              <span style="display: flex; align-items: center; gap: 8px; font: 500 13px/1.4 var(--vq-font-sans); color: var(--vq-text-3);"><span style="color: var(--vq-danger); font-family: var(--vq-font-numeric);">−</span> 3 to 6 months of implementation</span>
              <span style="display: flex; align-items: center; gap: 8px; font: 500 13px/1.4 var(--vq-font-sans); color: var(--vq-text-3);"><span style="color: var(--vq-danger); font-family: var(--vq-font-numeric);">−</span> Hundreds of menus you will never use</span>
            </div>
          </div>

          <div class="vq-card vq-reveal" style="padding: 28px; border-radius: var(--vq-r-xl, 20px); background: var(--vq-surface); border: 1px solid var(--vq-line); display: flex; flex-direction: column; gap: 14px;">
            <span style="font: 700 10.5px/1 var(--vq-font-numeric); letter-spacing: .14em; color: var(--vq-text-3);">GENERIC AI APP BUILDERS</span>
            <h3 style="margin: 0; font: 600 var(--vq-fs-h3)/var(--vq-lh-h3) var(--vq-font-display); letter-spacing: var(--vq-ls-h3); color: var(--vq-text);">Hallucinated books</h3>
            <p style="margin: 0; font: 400 15px/1.6 var(--vq-font-sans); color: var(--vq-text-2);">A prompt generates raw code from scratch. Raw code breaks accounting rules, invents totals, and cracks under real transaction load. You cannot run real money on it.</p>
            <div style="margin-top: auto; display: flex; flex-direction: column; gap: 8px; padding-top: 16px; border-top: 1px solid var(--vq-line-soft);">
              <span style="display: flex; align-items: center; gap: 8px; font: 500 13px/1.4 var(--vq-font-sans); color: var(--vq-text-3);"><span style="color: var(--vq-danger); font-family: var(--vq-font-numeric);">−</span> No double-entry ledger invariants</span>
              <span style="display: flex; align-items: center; gap: 8px; font: 500 13px/1.4 var(--vq-font-sans); color: var(--vq-text-3);"><span style="color: var(--vq-danger); font-family: var(--vq-font-numeric);">−</span> Brittle code that cracks under changes</span>
            </div>
          </div>

          <div class="vq-card vq-reveal" style="position: relative; overflow: hidden; padding: 28px; border-radius: var(--vq-r-xl, 20px); background: var(--vq-grad-mint); box-shadow: var(--vq-glow-accent-strong); color: #fff; display: flex; flex-direction: column; gap: 14px;">
            <span style="position: relative; font: 700 10.5px/1 var(--vq-font-numeric); letter-spacing: .14em; color: rgba(255, 255, 255, 0.78);">VENQORE · THE AI COMPILER</span>
            <h3 style="position: relative; margin: 0; font: 600 var(--vq-fs-h3)/var(--vq-lh-h3) var(--vq-font-display); letter-spacing: var(--vq-ls-h3);">Both, without the trade</h3>
            <p style="position: relative; margin: 0; font: 400 15px/1.6 var(--vq-font-sans); color: rgba(255, 255, 255, 0.9);">AI compiles your intent into parameterized, battle-tested financial modules. The agility of natural language, the arithmetic of hardened double-entry accounting.</p>
            <div style="position: relative; margin-top: auto; display: flex; flex-direction: column; gap: 8px; padding-top: 16px; border-top: 1px solid rgba(255, 255, 255, 0.24);">
              <span style="display: flex; align-items: center; gap: 8px; font: 500 13px/1.4 var(--vq-font-sans); color: rgba(255, 255, 255, 0.92);"><span style="font-family: var(--vq-font-numeric);">+</span> 100% custom, 0% hallucinated</span>
              <span style="display: flex; align-items: center; gap: 8px; font: 500 13px/1.4 var(--vq-font-sans); color: rgba(255, 255, 255, 0.92);"><span style="font-family: var(--vq-font-numeric);">+</span> Live in minutes, not quarters</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- SECTION 4: ZERO BLOAT ENGINE SET SELECTOR -->
    <section id="tailored" data-sec="tailored" style="position: relative; background: var(--vq-bg); padding: 112px 24px;">
      <div style="max-width: 1240px; margin: 0 auto;">
        <div class="vq-section-head vq-reveal" style="display: flex; flex-direction: column; gap: 14px; max-width: 760px;">
          <span style="font: 700 11px/1 var(--vq-font-numeric); letter-spacing: .14em; color: var(--vq-accent-text);">ZERO BLOAT</span>
          <h2 class="vq-display" style="margin: 0; font: 600 var(--vq-fs-display)/var(--vq-lh-display) var(--vq-font-display); letter-spacing: var(--vq-ls-display); color: var(--vq-text); text-wrap: balance;">Same compiler. A different system every time.</h2>
          <p class="vq-lede" style="margin: 0; max-width: 62ch; font: 400 var(--vq-fs-lede)/var(--vq-lh-lede) var(--vq-font-sans); color: var(--vq-text-2);">Pick a business below and watch the engine set change. Everything that goes dim is software you never have to look at.</p>
        </div>

        <div class="vq-reveal" style="margin-top: 34px; display: flex; flex-wrap: wrap; gap: 10px;" data-ind-chips>
          <button type="button" class="vq-chip is-active" data-ind="pharmacy">3-branch pharmacy</button>
          <button type="button" class="vq-chip" data-ind="bakery">Bakery, central kitchen</button>
          <button type="button" class="vq-chip" data-ind="wholesale">Auto parts wholesale</button>
          <button type="button" class="vq-chip" data-ind="boutique">Boutique + online</button>
        </div>

        <div class="vq-reveal" data-indgrid="1" style="margin-top: 26px; display: grid; grid-template-columns: 1.55fr 1fr; gap: 20px; align-items: start;">
          <div style="padding: 24px; border-radius: var(--vq-r-xl, 20px); background: var(--vq-surface); border: 1px solid var(--vq-line); box-shadow: var(--vq-elev-1);">
            <div style="display: flex; align-items: baseline; justify-content: space-between; gap: 14px; margin-bottom: 18px;">
              <span style="font: 700 10.5px/1 var(--vq-font-numeric); letter-spacing: .14em; color: var(--vq-text-3);">COMPILED ENGINE SET</span>
              <span data-ind-count style="font: 600 12px/1 var(--vq-font-numeric); color: var(--vq-accent-text);">8 of 24 shipped</span>
            </div>
            <div data-modules-grid style="display: grid; grid-template-columns: repeat(auto-fill, minmax(148px, 1fr)); gap: 8px;">
              <!-- Javascript populates engine tokens -->
            </div>
          </div>

          <div data-ind-card style="display: flex; flex-direction: column; gap: 16px; padding: 24px; border-radius: var(--vq-r-xl, 20px); background: var(--vq-sunken); border: 1px solid var(--vq-line); color: var(--vq-text);">
            <span data-ind-eyebrow style="font: 700 10.5px/1 var(--vq-font-numeric); letter-spacing: .14em; color: var(--vq-accent);">PHARMACY · 3 BRANCHES</span>
            <h3 data-ind-title style="margin: 0; font: 600 21px/1.25 var(--vq-font-display); letter-spacing: -.02em;">Batch expiry lives inside checkout</h3>
            <p data-ind-blurb style="margin: 0; font: 400 15px/1.62 var(--vq-font-sans); color: var(--vq-text-2);">Not in a settings page, not in a separate module. The counter picks the nearest-expiry batch first, and the write-off posts itself.</p>
            <div data-ind-points style="display: flex; flex-direction: column; gap: 10px; padding-top: 16px; border-top: 1px solid var(--vq-line-soft);">
              <span style="display: flex; gap: 10px; font: 500 13.5px/1.5 var(--vq-font-sans); color: var(--vq-text);"><span style="color: var(--vq-success); font-family: var(--vq-font-numeric);">+</span>Distributor invoices on 30-day terms, aged automatically</span>
              <span style="display: flex; gap: 10px; font: 500 13.5px/1.5 var(--vq-font-sans); color: var(--vq-text);"><span style="color: var(--vq-success); font-family: var(--vq-font-numeric);">+</span>Expiry watchlist at 45, 30 and 15 days</span>
              <span style="display: flex; gap: 10px; font: 500 13.5px/1.5 var(--vq-font-sans); color: var(--vq-text);"><span style="color: var(--vq-success); font-family: var(--vq-font-numeric);">+</span>Stock moves between branches without a spreadsheet</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- MOVING STRIP 2: BLACK MARQUEE STRIP (SCROLL-DRIVEN) -->
    <div data-dark="1" class="vq-dark" style="position: relative; overflow: hidden; background: #0C1211; padding: 28px 0; border-top: 1px solid rgba(255, 255, 255, 0.08); border-bottom: 1px solid rgba(255, 255, 255, 0.08);">
      <div data-marquee="1" style="display: flex; gap: 48px; white-space: nowrap; will-change: transform;">
        <span style="display: inline-flex; align-items: center; gap: 48px; font: 600 clamp(20px, 2.4vw, 34px)/1 var(--vq-font-display); letter-spacing: -.03em; color: rgba(237, 242, 239, 0.5);">Blueprint<span style="width: 6px; height: 6px; border-radius: 999px; background: #23C4A6;"></span></span>
        <span style="display: inline-flex; align-items: center; gap: 48px; font: 600 clamp(20px, 2.4vw, 34px)/1 var(--vq-font-display); letter-spacing: -.03em; color: #59DBC0;">Core Ledger<span style="width: 6px; height: 6px; border-radius: 999px; background: #23C4A6;"></span></span>
        <span style="display: inline-flex; align-items: center; gap: 48px; font: 600 clamp(20px, 2.4vw, 34px)/1 var(--vq-font-display); letter-spacing: -.03em; color: rgba(237, 242, 239, 0.5);">SmartCapture<span style="width: 6px; height: 6px; border-radius: 999px; background: #23C4A6;"></span></span>
        <span style="display: inline-flex; align-items: center; gap: 48px; font: 600 clamp(20px, 2.4vw, 34px)/1 var(--vq-font-display); letter-spacing: -.03em; color: #59DBC0;">VenSynQ<span style="width: 6px; height: 6px; border-radius: 999px; background: #23C4A6;"></span></span>
        <span style="display: inline-flex; align-items: center; gap: 48px; font: 600 clamp(20px, 2.4vw, 34px)/1 var(--vq-font-display); letter-spacing: -.03em; color: rgba(237, 242, 239, 0.5);">Vena<span style="width: 6px; height: 6px; border-radius: 999px; background: #23C4A6;"></span></span>
        <span style="display: inline-flex; align-items: center; gap: 48px; font: 600 clamp(20px, 2.4vw, 34px)/1 var(--vq-font-display); letter-spacing: -.03em; color: #59DBC0;">Signals<span style="width: 6px; height: 6px; border-radius: 999px; background: #23C4A6;"></span></span>
        <span style="display: inline-flex; align-items: center; gap: 48px; font: 600 clamp(20px, 2.4vw, 34px)/1 var(--vq-font-display); letter-spacing: -.03em; color: rgba(237, 242, 239, 0.5);">Blueprint<span style="width: 6px; height: 6px; border-radius: 999px; background: #23C4A6;"></span></span>
        <span style="display: inline-flex; align-items: center; gap: 48px; font: 600 clamp(20px, 2.4vw, 34px)/1 var(--vq-font-display); letter-spacing: -.03em; color: #59DBC0;">Core Ledger<span style="width: 6px; height: 6px; border-radius: 999px; background: #23C4A6;"></span></span>
        <span style="display: inline-flex; align-items: center; gap: 48px; font: 600 clamp(20px, 2.4vw, 34px)/1 var(--vq-font-display); letter-spacing: -.03em; color: rgba(237, 242, 239, 0.5);">SmartCapture<span style="width: 6px; height: 6px; border-radius: 999px; background: #23C4A6;"></span></span>
        <span style="display: inline-flex; align-items: center; gap: 48px; font: 600 clamp(20px, 2.4vw, 34px)/1 var(--vq-font-display); letter-spacing: -.03em; color: #59DBC0;">VenSynQ<span style="width: 6px; height: 6px; border-radius: 999px; background: #23C4A6;"></span></span>
        <span style="display: inline-flex; align-items: center; gap: 48px; font: 600 clamp(20px, 2.4vw, 34px)/1 var(--vq-font-display); letter-spacing: -.03em; color: rgba(237, 242, 239, 0.5);">Vena<span style="width: 6px; height: 6px; border-radius: 999px; background: #23C4A6;"></span></span>
        <span style="display: inline-flex; align-items: center; gap: 48px; font: 600 clamp(20px, 2.4vw, 34px)/1 var(--vq-font-display); letter-spacing: -.03em; color: #59DBC0;">Signals<span style="width: 6px; height: 6px; border-radius: 999px; background: #23C4A6;"></span></span>
      </div>
    </div>

    <!-- SECTION 5: WHAT CHANGES ON MONDAY (4 THINGS A COMPILER DOES) -->
    <section id="tenx" data-sec="tenx" data-track="1" style="position: relative; height: 380vh; background: var(--vq-bg);">
      <div style="position: sticky; top: 0; height: 100vh; overflow: hidden; display: flex; flex-direction: column; justify-content: center;">
        <div style="max-width: 1240px; width: 100%; margin: 0 auto; padding: 0 24px 26px; display: flex; align-items: flex-end; justify-content: space-between; gap: 20px;">
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <span style="font: 700 11px/1 var(--vq-font-numeric); letter-spacing: .14em; color: var(--vq-accent-text);">WHAT CHANGES ON MONDAY</span>
            <h2 class="vq-display" style="margin: 0; max-width: 22ch; font: 600 var(--vq-fs-h1)/var(--vq-lh-h1) var(--vq-font-display); letter-spacing: var(--vq-ls-h1); color: var(--vq-text);">Four things a compiler does that software cannot.</h2>
          </div>
          <span style="display: flex; align-items: center; gap: 10px; font: 600 11px/1 var(--vq-font-numeric); letter-spacing: .12em; color: var(--vq-text-3); padding-bottom: 6px;">
            KEEP SCROLLING
            <span style="width: 54px; height: 3px; background: var(--vq-line-strong); position: relative; overflow: hidden; border-radius: 999px;">
              <span data-trackbar="1" style="position: absolute; inset: 0; width: 0%; background: var(--vq-accent); border-radius: 999px;"></span>
            </span>
          </span>
        </div>
        <div data-trackrow="1" style="display: flex; gap: 24px; padding: 0 clamp(24px, 8vw, 120px); will-change: transform;">
          <div class="vq-card vq-tile" style="flex: 0 0 auto; width: clamp(300px, 38vw, 520px); padding: 30px; border-radius: var(--vq-r-2xl, 24px); background: var(--vq-surface); border: 1px solid var(--vq-line); box-shadow: var(--vq-elev-1); display: flex; flex-direction: column; gap: 16px;">
            <span style="font: 600 44px/1 var(--vq-font-numeric); letter-spacing: -.03em; color: var(--vq-accent);">01</span>
            <h3 style="margin: 0; font: 600 var(--vq-fs-h2)/var(--vq-lh-h2) var(--vq-font-display); letter-spacing: var(--vq-ls-h2); color: var(--vq-text); text-wrap: balance;">Minutes instead of months</h3>
            <p style="margin: 0; font: 400 15.5px/1.62 var(--vq-font-sans); color: var(--vq-text-2);">No implementers, no custom-field mapping, no database chart to draw. You write how you operate and the system exists.</p>
            <div style="margin-top: auto; display: grid; grid-template-columns: auto 1fr; gap: 8px 12px; padding-top: 18px; border-top: 1px solid var(--vq-line-soft); font: 500 13px/1.5 var(--vq-font-sans);">
              <span style="font: 700 10px/1.5 var(--vq-font-numeric); letter-spacing: .12em; color: var(--vq-text-3);">BEFORE</span><span style="color: var(--vq-text-3);">3–6 months of implementation</span>
              <span style="font: 700 10px/1.5 var(--vq-font-numeric); letter-spacing: .12em; color: var(--vq-accent-text);">AFTER</span><span style="color: var(--vq-text);">Scanning barcodes on day one</span>
            </div>
          </div>

          <div class="vq-card vq-tile" style="flex: 0 0 auto; width: clamp(300px, 38vw, 520px); padding: 30px; border-radius: var(--vq-r-2xl, 24px); background: var(--vq-surface); border: 1px solid var(--vq-line); box-shadow: var(--vq-elev-1); display: flex; flex-direction: column; gap: 16px;">
            <span style="font: 600 44px/1 var(--vq-font-numeric); letter-spacing: -.03em; color: var(--vq-accent);">02</span>
            <h3 style="margin: 0; font: 600 var(--vq-fs-h2)/var(--vq-lh-h2) var(--vq-font-display); letter-spacing: var(--vq-ls-h2); color: var(--vq-text); text-wrap: balance;">Only the software you use</h3>
            <p style="margin: 0; font: 400 15.5px/1.62 var(--vq-font-sans); color: var(--vq-text-2);">A boutique gets variant matrixes and fast checkout. A wholesaler gets container logistics and credit aging. Neither sees the other's screens.</p>
            <div style="margin-top: auto; display: grid; grid-template-columns: auto 1fr; gap: 8px 12px; padding-top: 18px; border-top: 1px solid var(--vq-line-soft); font: 500 13px/1.5 var(--vq-font-sans);">
              <span style="font: 700 10px/1.5 var(--vq-font-numeric); letter-spacing: .12em; color: var(--vq-text-3);">BEFORE</span><span style="color: var(--vq-text-3);">500 menus, 40 of them yours</span>
              <span style="font: 700 10px/1.5 var(--vq-font-numeric); letter-spacing: .12em; color: var(--vq-accent-text);">AFTER</span><span style="color: var(--vq-text);">Every screen earns its place</span>
            </div>
          </div>

          <div class="vq-card vq-tile" style="flex: 0 0 auto; width: clamp(300px, 38vw, 520px); padding: 30px; border-radius: var(--vq-r-2xl, 24px); background: var(--vq-surface); border: 1px solid var(--vq-line); box-shadow: var(--vq-elev-1); display: flex; flex-direction: column; gap: 16px;">
            <span style="font: 600 44px/1 var(--vq-font-numeric); letter-spacing: -.03em; color: var(--vq-accent);">03</span>
            <h3 style="margin: 0; font: 600 var(--vq-fs-h2)/var(--vq-lh-h2) var(--vq-font-display); letter-spacing: var(--vq-ls-h2); color: var(--vq-text); text-wrap: balance;">The books cannot drift</h3>
            <p style="margin: 0; font: 400 15.5px/1.62 var(--vq-font-sans); color: var(--vq-text-2);">The interface is generated. The ledger underneath is immutable double-entry, checked seven ways before anything posts.</p>
            <div style="margin-top: auto; display: grid; grid-template-columns: auto 1fr; gap: 8px 12px; padding-top: 18px; border-top: 1px solid var(--vq-line-soft); font: 500 13px/1.5 var(--vq-font-sans);">
              <span style="font: 700 10px/1.5 var(--vq-font-numeric); letter-spacing: .12em; color: var(--vq-text-3);">BEFORE</span><span style="color: var(--vq-text-3);">Reconciliation is archaeology</span>
              <span style="font: 700 10px/1.5 var(--vq-font-numeric); letter-spacing: .12em; color: var(--vq-accent-text);">AFTER</span><span style="color: var(--vq-text);">Debits equal credits, always</span>
            </div>
          </div>

          <div class="vq-card vq-tile" style="flex: 0 0 auto; width: clamp(300px, 38vw, 520px); padding: 30px; border-radius: var(--vq-r-2xl, 24px); background: var(--vq-surface); border: 1px solid var(--vq-line); box-shadow: var(--vq-elev-1); display: flex; flex-direction: column; gap: 16px;">
            <span style="font: 600 44px/1 var(--vq-font-numeric); letter-spacing: -.03em; color: var(--vq-accent);">04</span>
            <h3 style="margin: 0; font: 600 var(--vq-fs-h2)/var(--vq-lh-h2) var(--vq-font-display); letter-spacing: var(--vq-ls-h2); color: var(--vq-text); text-wrap: balance;">Growth is a sentence</h3>
            <p style="margin: 0; font: 400 15.5px/1.62 var(--vq-font-sans); color: var(--vq-text-2);">“Add wholesale distribution with warehouse transfer workflows.” The compiler re-wires your topology without downtime.</p>
            <div style="margin-top: auto; display: grid; grid-template-columns: auto 1fr; gap: 8px 12px; padding-top: 18px; border-top: 1px solid var(--vq-line-soft); font: 500 13px/1.5 var(--vq-font-sans);">
              <span style="font: 700 10px/1.5 var(--vq-font-numeric); letter-spacing: .12em; color: var(--vq-text-3);">BEFORE</span><span style="color: var(--vq-text-3);">A new project, a new quote</span>
              <span style="font: 700 10px/1.5 var(--vq-font-numeric); letter-spacing: .12em; color: var(--vq-accent-text);">AFTER</span><span style="color: var(--vq-text);">A new module, same afternoon</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- SECTION 6: DAY 2 ONWARD (OPERATING PARTNER) -->
    <section id="day2" data-sec="day2" style="position: relative; background: var(--vq-bg-alt); padding: 112px 24px;">
      <div style="max-width: 1240px; margin: 0 auto;">
        <div class="vq-section-head vq-reveal" style="display: flex; flex-direction: column; gap: 14px; max-width: 760px;">
          <span style="font: 700 11px/1 var(--vq-font-numeric); letter-spacing: .14em; color: var(--vq-accent-text);">DAY 2 ONWARD</span>
          <h2 class="vq-display" style="margin: 0; font: 600 var(--vq-fs-display)/var(--vq-lh-display) var(--vq-font-display); letter-spacing: var(--vq-ls-display); color: var(--vq-text); text-wrap: balance;">The compiler becomes an operating partner.</h2>
          <p class="vq-lede" style="margin: 0; max-width: 62ch; font: 400 var(--vq-fs-lede)/var(--vq-lh-lede) var(--vq-font-sans); color: var(--vq-text-2);">Once your system is running, the same intelligence that built it starts working inside it.</p>
        </div>

        <div style="margin-top: 52px; display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
          <div class="vq-card vq-reveal" style="padding: 26px; border-radius: var(--vq-r-xl, 20px); background: var(--vq-surface); border: 1px solid var(--vq-line); box-shadow: var(--vq-elev-1); display: flex; flex-direction: column; gap: 16px;">
            <span style="font: 700 10.5px/1 var(--vq-font-numeric); letter-spacing: .14em; color: var(--vq-text-3);">PREDICTIVE REPLENISHMENT</span>
            <h3 style="margin: 0; font: 600 var(--vq-fs-h3)/var(--vq-lh-h3) var(--vq-font-display); letter-spacing: var(--vq-ls-h3); color: var(--vq-text);">Purchase orders before the stockout</h3>
            <p style="margin: 0; font: 400 14.5px/1.6 var(--vq-font-sans); color: var(--vq-text-2);">Sales velocity, supplier lead times and seasonality read together, then drafted into a PO you approve.</p>
            <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 4px;">
              <div style="display: flex; flex-direction: column; gap: 6px;">
                <div style="display: flex; justify-content: space-between; font: 500 12.5px/1 var(--vq-font-sans); color: var(--vq-text-2);"><span>Amoxicillin 500mg</span><span style="font-family: var(--vq-font-numeric); color: var(--vq-text-3);">reorder in 4 days</span></div>
                <div style="height: 6px; border-radius: 999px; background: var(--vq-chart-track); overflow: hidden;"><span style="display: block; height: 100%; width: 82%; border-radius: 999px; background: var(--vq-grad-mint);"></span></div>
              </div>
              <div style="display: flex; flex-direction: column; gap: 6px;">
                <div style="display: flex; justify-content: space-between; font: 500 12.5px/1 var(--vq-font-sans); color: var(--vq-text-2);"><span>Insulin pen refill</span><span style="font-family: var(--vq-font-numeric); color: var(--vq-text-3);">reorder in 9 days</span></div>
                <div style="height: 6px; border-radius: 999px; background: var(--vq-chart-track); overflow: hidden;"><span style="display: block; height: 100%; width: 58%; border-radius: 999px; background: var(--vq-grad-mint);"></span></div>
              </div>
              <div style="display: flex; flex-direction: column; gap: 6px;">
                <div style="display: flex; justify-content: space-between; font: 500 12.5px/1 var(--vq-font-sans); color: var(--vq-text-2);"><span>Vitamin D 60k</span><span style="font-family: var(--vq-font-numeric); color: var(--vq-text-3);">reorder in 21 days</span></div>
                <div style="height: 6px; border-radius: 999px; background: var(--vq-chart-track); overflow: hidden;"><span style="display: block; height: 100%; width: 31%; border-radius: 999px; background: var(--vq-grad-mint);"></span></div>
              </div>
            </div>
          </div>

          <div class="vq-card vq-reveal" style="padding: 26px; border-radius: var(--vq-r-xl, 20px); background: var(--vq-surface); border: 1px solid var(--vq-line); box-shadow: var(--vq-elev-1); display: flex; flex-direction: column; gap: 16px;">
            <span style="font: 700 10.5px/1 var(--vq-font-numeric); letter-spacing: .14em; color: var(--vq-text-3);">AUTONOMOUS RECONCILIATION</span>
            <h3 style="margin: 0; font: 600 var(--vq-fs-h3)/var(--vq-lh-h3) var(--vq-font-display); letter-spacing: var(--vq-ls-h3); color: var(--vq-text);">Bank feed, card receipts, POS logs</h3>
            <p style="margin: 0; font: 400 14.5px/1.6 var(--vq-font-sans); color: var(--vq-text-2);">Matched line by line against the ledger. What matches is closed. What does not is flagged with the reason.</p>
            <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 4px;">
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 12px; border-radius: var(--vq-r-sm); background: var(--vq-sunken); font: 500 12.5px/1 var(--vq-font-sans); color: var(--vq-text-2);">
                <span style="display: flex; align-items: center; gap: 8px;"><span style="width: 6px; height: 6px; border-radius: 999px; background: var(--vq-success);"></span>Bank feed · 142 lines</span>
                <span style="font: 600 11px/1 var(--vq-font-numeric); letter-spacing: .06em; color: var(--vq-success);">MATCHED</span>
              </div>
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 12px; border-radius: var(--vq-r-sm); background: var(--vq-sunken); font: 500 12.5px/1 var(--vq-font-sans); color: var(--vq-text-2);">
                <span style="display: flex; align-items: center; gap: 8px;"><span style="width: 6px; height: 6px; border-radius: 999px; background: var(--vq-success);"></span>Card settlement · 38 lines</span>
                <span style="font: 600 11px/1 var(--vq-font-numeric); letter-spacing: .06em; color: var(--vq-success);">MATCHED</span>
              </div>
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 12px; border-radius: var(--vq-r-sm); background: var(--vq-sunken); font: 500 12.5px/1 var(--vq-font-sans); color: var(--vq-text-2);">
                <span style="display: flex; align-items: center; gap: 8px;"><span style="width: 6px; height: 6px; border-radius: 999px; background: var(--vq-warning);"></span>POS drawer · branch 2</span>
                <span style="font: 600 11px/1 var(--vq-font-numeric); letter-spacing: .06em; color: var(--vq-warning);">SHORT 240.00</span>
              </div>
            </div>
          </div>

          <div class="vq-card vq-reveal" style="padding: 26px; border-radius: var(--vq-r-xl, 20px); background: var(--vq-surface); border: 1px solid var(--vq-line); color: var(--vq-text); display: flex; flex-direction: column; gap: 16px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <img src="/images/vena-logo.svg" style="width: 20px; height: 20px;" alt="Vena Logo" />
              <span style="font: 700 10.5px/1 var(--vq-font-numeric); letter-spacing: .14em; color: var(--vq-accent);">VENA · ASK IN PLAIN WORDS</span>
            </div>
            <h3 style="margin: 0; font: 600 var(--vq-fs-h3)/var(--vq-lh-h3) var(--vq-font-display); letter-spacing: var(--vq-ls-h3);">Answers straight off the ledger</h3>
            <div style="padding: 14px 16px; border-radius: var(--vq-r-md); background: var(--vq-sunken); font: 500 14px/1.5 var(--vq-font-sans); color: var(--vq-text);">“What was our gross margin at branch 2 this weekend?”</div>
            <div style="display: grid; grid-template-columns: 1fr auto; gap: 8px 14px; font: 500 13px/1.6 var(--vq-font-numeric); font-variant-numeric: tabular-nums; color: var(--vq-text-2);">
              <span>Revenue</span><span style="color: var(--vq-text);">Rs 1,284,900.00</span>
              <span>Cost of goods</span><span style="color: var(--vq-text);">Rs 861,883.00</span>
              <span style="color: var(--vq-success);">Gross margin</span><span style="color: var(--vq-success);">32.9%</span>
            </div>
            <span style="font: 500 12px/1.5 var(--vq-font-sans); color: var(--vq-text-3);">Every figure traceable to the journal entries behind it.</span>
          </div>
        </div>
      </div>
    </section>

    <!-- SECTION 7: CORE LEDGER PROOF -->
    <section id="ledger" data-sec="ledger" style="position: relative; overflow: hidden; background: var(--vq-bg); padding: 120px 24px;">
      <div style="position: relative; max-width: 1240px; margin: 0 auto;">
        <div class="vq-section-head vq-reveal" style="display: flex; flex-direction: column; align-items: center; text-align: center; gap: 16px;">
          <span style="font: 700 11px/1 var(--vq-font-numeric); letter-spacing: .14em; color: var(--vq-accent);">CORE LEDGER · THE PART AI NEVER TOUCHES</span>
          <h2 class="vq-display" style="margin: 0; max-width: 24ch; font: 600 var(--vq-fs-display)/var(--vq-lh-display) var(--vq-font-display); letter-spacing: var(--vq-ls-display); color: var(--vq-text); text-wrap: balance;">AI decides what your system looks like. It never decides what your numbers say.</h2>
        </div>

        <div class="vq-reveal" style="margin: 48px auto 0; max-width: 760px; display: flex; align-items: center; justify-content: center; gap: clamp(16px, 4vw, 48px); padding: 34px 28px; border-radius: var(--vq-r-2xl, 24px); border: 1px solid var(--vq-line); background: var(--vq-surface); backdrop-filter: blur(18px);">
          <div style="display: flex; flex-direction: column; gap: 8px; text-align: right;">
            <span style="font: 700 10.5px/1 var(--vq-font-numeric); letter-spacing: .14em; color: var(--vq-text-3);">TOTAL DEBITS</span>
            <span style="font: 600 clamp(22px, 3vw, 34px)/1 var(--vq-font-numeric); font-variant-numeric: tabular-nums; letter-spacing: -.03em; color: var(--vq-text);">Rs 6,636,549.20</span>
          </div>
          <span style="font: 600 34px/1 var(--vq-font-numeric); color: var(--vq-accent);">=</span>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <span style="font: 700 10.5px/1 var(--vq-font-numeric); letter-spacing: .14em; color: var(--vq-text-3);">TOTAL CREDITS</span>
            <span style="font: 600 clamp(22px, 3vw, 34px)/1 var(--vq-font-numeric); font-variant-numeric: tabular-nums; letter-spacing: -.03em; color: var(--vq-text);">Rs 6,636,549.20</span>
          </div>
        </div>

        <div style="margin-top: 44px; display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px;">
          <div class="vq-card vq-reveal" style="padding: 22px; border-radius: var(--vq-r-xl, 20px); border: 1px solid var(--vq-line); background: var(--vq-surface);">
            <span style="display: block; font: 600 38px/1 var(--vq-font-numeric); letter-spacing: -.03em; color: var(--vq-accent);">7</span>
            <span style="display: block; margin-top: 12px; font: 700 10.5px/1 var(--vq-font-numeric); letter-spacing: .14em; color: var(--vq-text-3);">CORRECTNESS CHECKS</span>
            <span style="display: block; margin-top: 8px; font: 500 13px/1.55 var(--vq-font-sans); color: var(--vq-text-2);">Run on every post before it is allowed into the immutable ledger.</span>
          </div>

          <div class="vq-card vq-reveal" style="padding: 22px; border-radius: var(--vq-r-xl, 20px); border: 1px solid var(--vq-line); background: var(--vq-surface);">
            <span style="display: block; font: 600 38px/1 var(--vq-font-numeric); letter-spacing: -.03em; color: var(--vq-accent);">1,600+</span>
            <span style="display: block; margin-top: 12px; font: 700 10.5px/1 var(--vq-font-numeric); letter-spacing: .14em; color: var(--vq-text-3);">TESTS &amp; 11,000+ ASSERTIONS</span>
            <span style="display: block; margin-top: 8px; font: 500 13px/1.55 var(--vq-font-sans); color: var(--vq-text-2);">The engines are tested; only the topology arrangement is generated.</span>
          </div>

          <div class="vq-card vq-reveal" style="padding: 22px; border-radius: var(--vq-r-xl, 20px); border: 1px solid var(--vq-line); background: var(--vq-surface);">
            <span style="display: block; font: 600 38px/1 var(--vq-font-numeric); letter-spacing: -.03em; color: var(--vq-accent);">46</span>
            <span style="display: block; margin-top: 12px; font: 700 10.5px/1 var(--vq-font-numeric); letter-spacing: .14em; color: var(--vq-text-3);">MODULES COMPILED</span>
            <span style="display: block; margin-top: 8px; font: 500 13px/1.55 var(--vq-font-sans); color: var(--vq-text-2);">Already built, proven in production, waiting to be wired for your business.</span>
          </div>

          <div class="vq-card vq-reveal" style="padding: 22px; border-radius: var(--vq-r-xl, 20px); border: 1px solid var(--vq-line); background: var(--vq-surface);">
            <span style="display: block; font: 600 38px/1 var(--vq-font-numeric); letter-spacing: -.03em; color: var(--vq-accent);">2</span>
            <span style="display: block; margin-top: 12px; font: 700 10.5px/1 var(--vq-font-numeric); letter-spacing: .14em; color: var(--vq-text-3);">BUSINESSES LIVE TODAY</span>
            <span style="display: block; margin-top: 8px; font: 500 13px/1.55 var(--vq-font-sans); color: var(--vq-text-2);">Running their live point-of-sale and money through Core Ledger.</span>
          </div>
        </div>
      </div>
    </section>

    <!-- SECTION 8: FAQ SECTION -->
    <section class="vq-section" style="padding: 100px 24px; background: var(--vq-bg-alt);">
      <div class="vq-container vq-container--narrow">
        <div class="vq-section-head vq-reveal"><h2 class="vq-display">Questions people actually ask.</h2></div>
        <div class="vq-faq vq-reveal">
          
          <div class="vq-faq__item">
            <button class="vq-faq__q" type="button" aria-expanded="false">Is my accounting safe if an AI configured it?<span class="vq-faq__sign"></span></button>
            <div class="vq-faq__a"><div><p>The AI composes your system — which modules run, what your fields are called, who approves what. It never touches the accounting engine. Debits equal credits or the transaction does not post, and that rule is in the engine, not in a prompt.</p></div></div>
          </div>
          <div class="vq-faq__item">
            <button class="vq-faq__q" type="button" aria-expanded="false">What if the Blueprint gets it wrong?<span class="vq-faq__sign"></span></button>
            <div class="vq-faq__a"><div><p>You see it before anything is real. Every line is editable, nothing posts to your books until you approve it, and every applied configuration keeps a version snapshot you can roll back.</p></div></div>
          </div>
          <div class="vq-faq__item">
            <button class="vq-faq__q" type="button" aria-expanded="false">Can I change my system later?<span class="vq-faq__sign"></span></button>
            <div class="vq-faq__a"><div><p>Describe the change. Blueprint shows you a diff — what is added, what changes, what is affected — and you approve it or you don't. Adding a branch is a sentence, not a change request.</p></div></div>
          </div>
          <div class="vq-faq__item">
            <button class="vq-faq__q" type="button" aria-expanded="false">Do you charge to import my data, or to leave?<span class="vq-faq__sign"></span></button>
            <div class="vq-faq__a"><div><p>No, and no. Import is included. Export everything, any time, in a format your next system can read.</p></div></div>
          </div>
          <div class="vq-faq__item">
            <button class="vq-faq__q" type="button" aria-expanded="false">How big is the team?<span class="vq-faq__sign"></span></button>
            <div class="vq-faq__a"><div><p>One founder, currently. That is a real trade-off: you get someone who answers your email personally and ships weekly, and you don't get a 40-person support org. If that trade doesn't work for you, it's better we both know now.</p></div></div>
          </div>
        </div>
      </div>
    </section>

  </div>
  </main>

  <!-- SECTION C: ORIGINAL MASTER FOOTER (PRESERVED) -->
  <footer id="start" data-sec="start" class="vq-footer">
    <div class="footer-bg"></div>
    
    <div class="vq-container" style="position:relative;z-index:10;padding-bottom:var(--vq-space-16)">
      <div class="mesh-gradient-card" style="border-radius:var(--vq-r-2xl);padding:clamp(32px,5vw,56px);border:1px solid rgb(255 255 255 / .10);box-shadow:var(--vq-elev-3)">
        <div style="max-width:36rem">
          <h2 class="vq-h2" style="color:#fff">Describe your business. See what it becomes.</h2>
          <p class="vq-lede vq-mt-3" style="color:rgb(255 255 255 / .74)">Free to try. No card. You'll see your whole system before you decide anything.</p>
          <form class="vq-row vq-wrap vq-gap-3 vq-mt-8" data-waitlist style="max-width:520px">
            <input type="email" class="vq-input" required placeholder="you@company.com" aria-label="Work email"
                   style="flex:1 1 240px;background:rgb(0 0 0 / .35);border-color:rgb(255 255 255 / .16);color:#fff">
            <button type="submit" class="vq-btn vq-btn--lg vq-btn--light">Start building</button>
          </form>
          <p class="vq-caption vq-mt-4" style="color:rgb(255 255 255 / .55)">Takes about four minutes. Nothing goes live until you approve it.</p>
        </div>
      </div>
    </div>

    <div class="vq-container" style="position:relative;z-index:10;padding-bottom:var(--vq-space-20)">
      <div style="display:flex;flex-direction:column;gap:var(--vq-space-12)" class="vq-foot-cols">
        <div style="display:grid;gap:var(--vq-space-8);grid-template-columns:repeat(auto-fit,minmax(150px,1fr));flex:1">
          <div>
            <h3 class="vq-footer__head">Product</h3>
            <ul style="margin-top:var(--vq-space-4);display:flex;flex-direction:column;gap:var(--vq-space-3)">
              <li><a href="blueprint.html">Blueprint</a></li>
              <li><a href="pos.html">The register</a></li>
              <li><a href="documents.html">Documents</a></li>
              <li><a href="dashboard.html">Dashboard</a></li>
              <li><a href="smartcapture.html">SmartCapture</a></li>
              <li><a href="reckoner.html">The Reckoner</a></li>
              <li><a href="ledger.html">Core Ledger</a></li>
              <li><a href="vensynq.html">VenSynQ</a></li>
            </ul>
          </div>
          <div>
            <h3 class="vq-footer__head">Company</h3>
            <ul style="margin-top:var(--vq-space-4);display:flex;flex-direction:column;gap:var(--vq-space-3)">
              <li><a href="about.html">About</a></li>
              <li><a href="contact.html">Contact</a></li>
              <li><a href="/blog">Blog</a></li>
              <li><a href="/roadmap">Roadmap</a></li>
            </ul>
          </div>
          <div>
            <h3 class="vq-footer__head">Resources</h3>
            <ul style="margin-top:var(--vq-space-4);display:flex;flex-direction:column;gap:var(--vq-space-3)">
              <li><a href="/docs">Documentation</a></li>
              <li><a href="/help">Help centre</a></li>
              <li><a href="onboarding.html">See a build</a></li>
              <li><a href="signin.html">Sign in</a></li>
            </ul>
          </div>
          <div>
            <h3 class="vq-footer__head">Social</h3>
            <div style="margin-top:var(--vq-space-4);display:flex;gap:var(--vq-space-3)">
              <a class="vq-footer__social" href="#" aria-label="Facebook"><svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg></a>
              <a class="vq-footer__social" href="#" aria-label="X"><svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg></a>
              <a class="vq-footer__social" href="#" aria-label="LinkedIn"><svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg></a>
            </div>
          </div>
        </div>
      </div>

      <div style="margin-top:var(--vq-space-12);padding-top:var(--vq-space-8);border-top:1px solid rgb(255 255 255 / .08);display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:var(--vq-space-4);padding-bottom:14vw">
        <p class="vq-small" style="color:var(--vq-ink-500);max-width:none">© 2026 VenQore, Inc. The AI Business Compiler for ERP &amp; POS.</p>
        <div style="display:flex;gap:var(--vq-space-6)">
          <a class="vq-small" href="/terms">Terms</a>
          <a class="vq-small" href="/privacy">Privacy</a>
          <a class="vq-small" href="/cookies">Cookies</a>
        </div>
      </div>

      <div class="watermark-wrapper"><span>VenQore</span></div>
    </div>
  </footer>

  <!-- Business Picker Modal -->
  <div id="modal-select-business" class="modal-overlay" aria-hidden="true" style="position: fixed; inset: 0; z-index: 9999; display: flex; align-items: center; justify-content: center; opacity: 0; pointer-events: none; transition: opacity 0.25s ease;">
    <div class="modal-backdrop" style="position: absolute; inset: 0; background: rgba(2, 20, 22, 0.75); backdrop-filter: blur(12px);"></div>
    <div class="modal-window vq-app" style="position: relative; z-index: 1; max-width: 600px; width: 92%; max-height: 85vh; border-radius: 28px; background: var(--vq-raised); border: 1px solid var(--vq-line-strong); box-shadow: 0 32px 80px -20px rgba(0,0,0,0.8); display: flex; flex-direction: column; overflow: hidden;">
      <div style="padding: 24px 28px 16px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--vq-line-soft);">
        <h3 style="margin: 0; font: 600 19px/1.2 var(--vq-font-display); color: var(--vq-text);">Select Your Business</h3>
        <button id="modal-close-btn" type="button" style="background: transparent; border: 0; font-size: 20px; color: var(--vq-text-2); cursor: pointer; padding: 4px;">✕</button>
      </div>
      <div class="scroll-list" style="padding: 20px 28px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 10px;">
        <div class="item-box is-selected" data-biz="Retail Pharmacy with batch & expiry tracking" style="padding: 14px 18px; border-radius: 14px; border: 1px solid var(--vq-line); cursor: pointer; transition: all 0.2s;"><p style="margin:0;font-weight:600;color:var(--vq-text);">Retail Pharmacy</p><span style="font-size:12px;color:var(--vq-text-3);">Batch & expiry, distributor credit</span></div>
        <div class="item-box" data-biz="Auto Parts Wholesale with tier pricing and dispatch" style="padding: 14px 18px; border-radius: 14px; border: 1px solid var(--vq-line); cursor: pointer; transition: all 0.2s;"><p style="margin:0;font-weight:600;color:var(--vq-text);">Wholesale Distribution</p><span style="font-size:12px;color:var(--vq-text-3);">Tier pricing, credit aging, dispatch</span></div>
        <div class="item-box" data-biz="Bakery with Central Kitchen and recipe costing" style="padding: 14px 18px; border-radius: 14px; border: 1px solid var(--vq-line); cursor: pointer; transition: all 0.2s;"><p style="margin:0;font-weight:600;color:var(--vq-text);">Restaurant &amp; Café</p><span style="font-size:12px;color:var(--vq-text-3);">Recipe costing, central kitchen, fast till</span></div>
        <div class="item-box" data-biz="Hardware & Construction Parts with unit conversions" style="padding: 14px 18px; border-radius: 14px; border: 1px solid var(--vq-line); cursor: pointer; transition: all 0.2s;"><p style="margin:0;font-weight:600;color:var(--vq-text);">Hardware &amp; Building Supplies</p><span style="font-size:12px;color:var(--vq-text-3);">SKU matrix, contractor credit</span></div>
        <div class="item-box" data-biz="Multi-branch Fashion Boutique with Amazon & Shopify" style="padding: 14px 18px; border-radius: 14px; border: 1px solid var(--vq-line); cursor: pointer; transition: all 0.2s;"><p style="margin:0;font-weight:600;color:var(--vq-text);">Multi-branch Retail</p><span style="font-size:12px;color:var(--vq-text-3);">Branch stock transfers, channel sync</span></div>
        <div class="item-box" data-biz="Custom Business Operating System" style="padding: 14px 18px; border-radius: 14px; border: 1px solid var(--vq-line); cursor: pointer; transition: all 0.2s;"><p style="margin:0;font-weight:600;color:var(--vq-text);">Custom Business Profile</p><span style="font-size:12px;color:var(--vq-text-3);">Tailored to your specific workflows</span></div>
      </div>
      <div style="padding: 16px 28px 24px; border-top: 1px solid var(--vq-line-soft); display: flex; justify-content: flex-end; gap: 12px;">
        <button id="modal-cancel-btn" type="button" class="vq-btn vq-btn--ghost">Cancel</button>
        <button id="btn-confirm-business" type="button" class="vq-btn vq-btn--primary">Confirm selection</button>
      </div>
    </div>
  </div>

      <!-- Three.js Library -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>

  <!-- WebGL Fluid Simulation Engine -->
  <script src="assets/fluid.js"></script>

  <!-- LaserFlow Component Effect -->
  <script src="assets/laserflow.js"></script>

  <!-- Application Logic -->
  <script src="assets/venqore.js"></script>
</body>
</html>
