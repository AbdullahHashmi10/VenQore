import React, { useEffect } from 'react';
import { useTheme } from '@/Contexts/ThemeContext';
import { Head, Link, usePage } from '@inertiajs/react';
import SiteHeader from '@/Components/Site/SiteHeader';
import SiteFooter from '@/Components/Site/SiteFooter';
import CookieConsent from '@/Components/CookieConsent';

export default function Onboarding() {
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
                <title>See a build — a description to a live system | VenQore</title>
                <meta name="description" content="Describe your business, review the Blueprint it composes, pick a plan, go live. Four minutes — and nothing is real until you approve it." />
                <link rel="canonical" href="https://venqore.com/onboarding" />
                <meta property="og:title" content="See a build — a description to a live system | VenQore" />
                <meta property="og:description" content="Describe your business, review the Blueprint it composes, pick a plan, go live. Four minutes — and nothing is real until you approve it." />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://venqore.com/onboarding" />
                <meta property="og:image" content="https://venqore.com/images/og/venqore-og.png" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="See a build — a description to a live system | VenQore" />
                <meta name="twitter:description" content="Describe your business, review the Blueprint it composes, pick a plan, go live. Four minutes — and nothing is real until you approve it." />
                <meta name="twitter:image" content="https://venqore.com/images/og/venqore-og.png" />
            </Head>

            <div className="vq-site vq-app-body" style={{ background: 'var(--vq-bg)', color: 'var(--vq-text)', overflow: 'visible', minHeight: '100vh' }}>



  <SiteHeader />

<main id="main" className="vq-onb-main">

<div className="vq-wiz">

  <div className="vq-wiz__bar">
    <div className="vq-wiz__track"><div className="vq-wiz__fill" data-wiz-fill></div></div>
    <div className="vq-container" style={{"height":"64px","display":"flex","alignItems":"center","justifyContent":"space-between","gap":"var(--vq-space-6)"}}>
      <ol className="vq-row vq-gap-6" data-wiz-steps style={{"overflowX":"auto","scrollbarWidth":"none"}}>
        <li className="vq-eyebrow" data-step-label="0" style={{"whiteSpace":"nowrap"}}>Business</li><li className="vq-eyebrow" data-step-label="1" style={{"whiteSpace":"nowrap"}}>Describe</li><li className="vq-eyebrow" data-step-label="2" style={{"whiteSpace":"nowrap"}}>Details</li><li className="vq-eyebrow" data-step-label="3" style={{"whiteSpace":"nowrap"}}>Blueprint</li><li className="vq-eyebrow" data-step-label="4" style={{"whiteSpace":"nowrap"}}>Plan</li><li className="vq-eyebrow" data-step-label="5" style={{"whiteSpace":"nowrap"}}>Account</li>
      </ol>
    </div>
  </div>

  <div className="vq-wiz__stage">

    {/*  0 · Business type ------------------------------------------------  */}
    <section className="vq-wiz__panel is-on" data-panel="0">
      <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Step 1 of 6</span>
      <h1 className="vq-h1 vq-mt-4">What kind of business?</h1>
      <p className="vq-lede vq-mt-3">Pick the closest — you can change everything later.</p>
      <div className="vq-pick vq-mt-8">
        
        <button className="vq-pick__card" type="button" data-type="0" aria-pressed="false">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2 2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7"/></svg><b>Retail shop</b><span>General retail, one counter</span>
        </button>
        <button className="vq-pick__card" type="button" data-type="1" aria-pressed="false">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg><b>Grocery / karyana</b><span>High SKU count, fast checkout</span>
        </button>
        <button className="vq-pick__card" type="button" data-type="2" aria-pressed="false">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg><b>Pharmacy</b><span>Batch, expiry, distributors</span>
        </button>
        <button className="vq-pick__card" type="button" data-type="3" aria-pressed="false">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 2v2"/><path d="M14 2v2"/><path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1z"/><path d="M6 2v2"/><path d="M17 9h1a3 3 0 0 1 0 6h-1"/></svg><b>Café</b><span>Counter service, own recipes</span>
        </button>
        <button className="vq-pick__card" type="button" data-type="4" aria-pressed="false">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 2v2"/><path d="M14 2v2"/><path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1z"/><path d="M6 2v2"/><path d="M17 9h1a3 3 0 0 1 0 6h-1"/></svg><b>Restaurant</b><span>Tables, kitchen, ingredients</span>
        </button>
        <button className="vq-pick__card" type="button" data-type="5" aria-pressed="false">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 16h.01"/><path d="M16 16h.01"/><path d="M3 19a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7.5a.5.5 0 0 0-.769-.422l-4.462 2.844A.5.5 0 0 1 15 9.5v-2a.5.5 0 0 0-.769-.422L9.77 9.922A.5.5 0 0 1 9 9.5V3.5a.5.5 0 0 0-.5-.5h-3a2 2 0 0 0-2 2Z"/><path d="M8 16h.01"/></svg><b>Bakery</b><span>Production runs and wastage</span>
        </button>
        <button className="vq-pick__card" type="button" data-type="6" aria-pressed="false">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"/></svg><b>Mobile &amp; electronics</b><span>IMEI, serials, warranties</span>
        </button>
        <button className="vq-pick__card" type="button" data-type="7" aria-pressed="false">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"/><path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12"/><path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"/></svg><b>Clothing</b><span>Size and colour variants</span>
        </button>
        <button className="vq-pick__card" type="button" data-type="8" aria-pressed="false">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg><b>Hardware &amp; tools</b><span>Deep catalogue, units</span>
        </button>
        <button className="vq-pick__card" type="button" data-type="9" aria-pressed="false">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg><b>Wholesale</b><span>Price tiers, credit terms</span>
        </button>
        <button className="vq-pick__card" type="button" data-type="10" aria-pressed="false">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="6" x2="6" y1="3" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg><b>Multi-branch retail</b><span>More than one location</span>
        </button>
        <button className="vq-pick__card" type="button" data-type="11" aria-pressed="false">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg><b>I'm not sure yet</b><span>Describe it and we'll work it out</span>
        </button>
      </div>
    </section>

    {/*  1 · Describe ------------------------------------------------------  */}
    <section className="vq-wiz__panel" data-panel="1">
      <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Step 2 of 6</span>
      <h2 className="vq-h1 vq-mt-4">Now tell us how it actually works.</h2>
      <p className="vq-lede vq-mt-3">Sentences, not a form. What you sell, how you buy, who works there,
        what your accountant asks for. The more you say, the less you have to fix afterwards.</p>
      <div className="vq-card vq-card--xl vq-mt-8">
        <label className="vq-label" htmlFor="wiz-desc">Your business, in your words</label>
        <textarea className="vq-textarea vq-mt-2" id="wiz-desc" data-wiz-desc rows="6"
          placeholder="I run two pharmacy branches. I buy on 30-day credit from four distributors, I need batch and expiry tracking, and my accountant wants a trial balance every month." />
        <div className="vq-row vq-wrap vq-gap-2 vq-mt-4">
          <span className="vq-caption">Or borrow one:</span>
          <button type="button" className="vq-chip" data-example="pharmacy">Pharmacy</button>
          <button type="button" className="vq-chip" data-example="wholesale">Wholesale</button>
          <button type="button" className="vq-chip" data-example="cafe">Café</button>
        </div>
      </div>
      <div className="vq-row vq-gap-3 vq-mt-6">
        <button className="vq-btn vq-btn--secondary vq-btn--lg" data-back>Back</button>
        <button className="vq-btn vq-btn--primary vq-btn--lg" data-next>Continue <span className="vq-btn__arrow"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></button>
      </div>
    </section>

    {/*  2 · Details -------------------------------------------------------  */}
    <section className="vq-wiz__panel" data-panel="2">
      <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Step 3 of 6</span>
      <h2 className="vq-h1 vq-mt-4">Four things that change the build.</h2>
      <p className="vq-lede vq-mt-3">Only questions whose answer changes your configuration. Nothing here
        is a marketing field.</p>
      <div className="vq-card vq-card--xl vq-mt-8">
        <div className="vq-grid vq-grid--2" style={{"gap":"var(--vq-space-5)"}}>
          <div className="vq-field">
            <label className="vq-label" htmlFor="w-biz">Business name</label>
            <input className="vq-input" id="w-biz" data-wiz-name placeholder="Al-Madina Pharmacy" />
            <span className="vq-help">Appears on every receipt, invoice and statement.</span>
          </div>
          <div className="vq-field">
            <label className="vq-label" id="w-cur-label" htmlFor="w-cur-trigger">Currency</label>
            <div className="vq-custom-select" data-custom-select>
              <input type="hidden" id="w-cur" value="PKR — Pakistani Rupee (Rs)" />
              <button type="button" className="vq-custom-select__trigger" id="w-cur-trigger" aria-haspopup="listbox" aria-expanded="false" aria-labelledby="w-cur-label w-cur-trigger">
                <span className="vq-custom-select__value">PKR — Pakistani Rupee (Rs)</span>
                <svg className="vq-custom-select__chevron" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
              </button>
              <ul className="vq-custom-select__menu" role="listbox" aria-labelledby="w-cur-label" tabIndex="-1">
                <li className="vq-custom-select__item is-selected" role="option" aria-selected="true" data-value="PKR — Pakistani Rupee (Rs)">
                  <span>PKR — Pakistani Rupee (Rs)</span>
                  <svg className="vq-custom-select__check" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </li>
                <li className="vq-custom-select__item" role="option" aria-selected="false" data-value="AED — UAE Dirham (د.إ)">
                  <span>AED — UAE Dirham (د.إ)</span>
                  <svg className="vq-custom-select__check" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </li>
                <li className="vq-custom-select__item" role="option" aria-selected="false" data-value="SAR — Saudi Riyal (﷼)">
                  <span>SAR — Saudi Riyal (﷼)</span>
                  <svg className="vq-custom-select__check" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </li>
                <li className="vq-custom-select__item" role="option" aria-selected="false" data-value="USD — US Dollar ($)">
                  <span>USD — US Dollar ($)</span>
                  <svg className="vq-custom-select__check" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </li>
                <li className="vq-custom-select__item" role="option" aria-selected="false" data-value="GBP — Pound Sterling (£)">
                  <span>GBP — Pound Sterling (£)</span>
                  <svg className="vq-custom-select__check" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </li>
              </ul>
            </div>
            <span className="vq-help">Becomes the system default. Critical — it sets the ledger.</span>
          </div>
          <div className="vq-field">
            <label className="vq-label" id="w-loc-label" htmlFor="w-loc-trigger">How many locations?</label>
            <div className="vq-custom-select" data-custom-select>
              <input type="hidden" id="w-loc" data-wiz-loc value="1" />
              <button type="button" className="vq-custom-select__trigger" id="w-loc-trigger" aria-haspopup="listbox" aria-expanded="false" aria-labelledby="w-loc-label w-loc-trigger">
                <span className="vq-custom-select__value">Just one</span>
                <svg className="vq-custom-select__chevron" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
              </button>
              <ul className="vq-custom-select__menu" role="listbox" aria-labelledby="w-loc-label" tabIndex="-1">
                <li className="vq-custom-select__item is-selected" role="option" aria-selected="true" data-value="1">
                  <span>Just one</span>
                  <svg className="vq-custom-select__check" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </li>
                <li className="vq-custom-select__item" role="option" aria-selected="false" data-value="2">
                  <span>2 to 3</span>
                  <svg className="vq-custom-select__check" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </li>
                <li className="vq-custom-select__item" role="option" aria-selected="false" data-value="5">
                  <span>4 to 10</span>
                  <svg className="vq-custom-select__check" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </li>
                <li className="vq-custom-select__item" role="option" aria-selected="false" data-value="12">
                  <span>More than 10</span>
                  <svg className="vq-custom-select__check" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </li>
              </ul>
            </div>
          </div>
          <div className="vq-field">
            <label className="vq-label" id="w-team-label" htmlFor="w-team-trigger">How many people work there?</label>
            <div className="vq-custom-select" data-custom-select>
              <input type="hidden" id="w-team" data-wiz-team value="2" />
              <button type="button" className="vq-custom-select__trigger" id="w-team-trigger" aria-haspopup="listbox" aria-expanded="false" aria-labelledby="w-team-label w-team-trigger">
                <span className="vq-custom-select__value">Just me, or two of us</span>
                <svg className="vq-custom-select__chevron" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
              </button>
              <ul className="vq-custom-select__menu" role="listbox" aria-labelledby="w-team-label" tabIndex="-1">
                <li className="vq-custom-select__item is-selected" role="option" aria-selected="true" data-value="2">
                  <span>Just me, or two of us</span>
                  <svg className="vq-custom-select__check" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </li>
                <li className="vq-custom-select__item" role="option" aria-selected="false" data-value="3">
                  <span>3 to 5</span>
                  <svg className="vq-custom-select__check" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </li>
                <li className="vq-custom-select__item" role="option" aria-selected="false" data-value="10">
                  <span>6 to 15</span>
                  <svg className="vq-custom-select__check" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </li>
                <li className="vq-custom-select__item" role="option" aria-selected="false" data-value="40">
                  <span>More than 15</span>
                  <svg className="vq-custom-select__check" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </li>
              </ul>
            </div>
            <span className="vq-help">Sets your roles, approval chain and seat count.</span>
          </div>
        </div>
      </div>
      <div className="vq-row vq-gap-3 vq-mt-6">
        <button className="vq-btn vq-btn--secondary vq-btn--lg" data-back>Back</button>
        <button className="vq-btn vq-btn--primary vq-btn--lg" data-next>Build my system <span className="vq-btn__arrow"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></button>
      </div>
    </section>

    {/*  3 · Building + Blueprint ------------------------------------------  */}
    <section className="vq-wiz__panel" data-panel="3">
      <div data-wiz-building>
        <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Working</span>
        <h2 className="vq-h1 vq-mt-4">Reading your business…</h2>
        <p className="vq-lede vq-mt-3">This takes a few seconds. Nothing is created yet — you'll see the
          whole plan before anything is real.</p>
        <div className="vq-card vq-card--xl vq-mt-8">
          <div className="vq-steps" data-wiz-steps-list></div>
        </div>
      </div>

      <div data-wiz-plan hidden>
        <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Step 4 of 6</span>
        <h2 className="vq-h1 vq-mt-4">Your Blueprint</h2>
        <p className="vq-lede vq-mt-3" data-wiz-summary></p>
        <div className="vq-card vq-card--xl vq-mt-8" data-wiz-blueprint></div>
        <div className="vq-row vq-gap-3 vq-mt-6">
          <button className="vq-btn vq-btn--secondary vq-btn--lg" data-back>Back</button>
          <button className="vq-btn vq-btn--primary vq-btn--lg" data-next>Looks right <span className="vq-btn__arrow"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></button>
        </div>
        <p className="vq-caption vq-mt-4" style={{"maxWidth":"none"}}>Every line is editable, now and later.
          Nothing posts to your books until you approve it.</p>
      </div>
    </section>

    {/*  4 · Plan ----------------------------------------------------------  */}
    <section className="vq-wiz__panel" data-panel="4">
      <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Step 5 of 6</span>
      <h2 className="vq-h1 vq-mt-4">Pick a plan, or don't.</h2>
      <p className="vq-lede vq-mt-3">The trial is 14 days on the full product either way. We've marked the
        one that fits what you just told us.</p>
      <div className="vq-grid vq-grid--3 vq-mt-8" data-wiz-plans></div>
      <div className="vq-row vq-gap-3 vq-mt-6">
        <button className="vq-btn vq-btn--secondary vq-btn--lg" data-back>Back</button>
        <button className="vq-btn vq-btn--primary vq-btn--lg" data-next>Continue <span className="vq-btn__arrow"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></button>
      </div>
      <p className="vq-caption vq-mt-4" style={{"maxWidth":"none"}}>Cancel anytime. We'll remind you before day 14.</p>
    </section>

    {/*  5 · Account -------------------------------------------------------  */}
    <section className="vq-wiz__panel" data-panel="5" style={{"maxWidth":"460px"}}>
      <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Step 6 of 6</span>
      <h2 className="vq-h1 vq-mt-4">Last thing.</h2>
      <p className="vq-lede vq-mt-3">This is the account that owns your ledger.</p>
      <div className="vq-card vq-card--xl vq-mt-8">
        <form className="vq-stack vq-gap-5" data-demo>
          <div className="vq-field">
            <label className="vq-label" htmlFor="w-email">Work email</label>
            <input className="vq-input" id="w-email" type="email" required autoComplete="email" placeholder="you@company.com" />
            <span className="vq-help">We'll email your sign-in code here.</span>
          </div>
          <div className="vq-field">
            <label className="vq-label" htmlFor="w-pass">Password</label>
            <input className="vq-input" id="w-pass" type="password" required autoComplete="new-password" minLength="10" />
            <span className="vq-help">At least 10 characters.</span>
          </div>
          <label className="vq-check">
            <input type="checkbox" required />
            <span className="vq-caption" style={{"maxWidth":"none"}}>I agree to the <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a>.</span>
          </label>
          <button type="button" className="vq-btn vq-btn--primary vq-btn--xl vq-btn--block" data-next>
            Create my system <span className="vq-btn__arrow"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span>
          </button>
        </form>
      </div>
      <button className="vq-btn vq-btn--ghost vq-btn--lg vq-mt-4" data-back>Back</button>
    </section>

    {/*  6 · Done ----------------------------------------------------------  */}
    <section className="vq-wiz__panel" data-panel="6" style={{"maxWidth":"1400px"}}>
      <div className="vq-center" style={{"maxWidth":"640px","marginInline":"auto"}}>
        <span className="vq-status vq-status--ok"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg> Live</span>
        <h2 className="vq-display vq-mt-4">Your system is live.</h2>
        <p className="vq-lede vq-mt-4" style={{"marginInline":"auto"}}>Ledger wired, chart of accounts seeded,
          your words applied. Nothing in it is a template — it is the composition you just approved.</p>
        <div className="vq-row vq-gap-3 vq-mt-8" style={{"justifyContent":"center"}}>
          <a className="vq-btn vq-btn--primary vq-btn--lg" href="#">Add your first product <span className="vq-btn__arrow"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a>
          <a className="vq-btn vq-btn--secondary vq-btn--lg" href="/">Back to the site</a>
        </div>
      </div>
      <div className="vq-mt-12">
<div className="vq-app">
  <div className="vq-app__bar">
    <div className="vq-app__dots"><i></i><i></i><i></i></div>
    <div className="vq-app__omni"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg> Ask your business a question…</div>
    <div style={{"marginLeft":"auto","display":"flex","alignItems":"center","gap":"10px"}}>
      <span className="vq-badge vq-badge--accent">Pharmacy · 2 branches</span>
    </div>
  </div>
  <div className="vq-app__body">
    <nav className="vq-app__rail" aria-label="Product navigation (illustration)">
      <span className="vq-app__nav" aria-current="true"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg> Dashboard</span>
      <span className="vq-app__nav"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg> Sell</span>
      <span className="vq-app__nav"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg> Stock</span>
      <span className="vq-app__nav"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg> Buy</span>
      <span className="vq-app__nav"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/><path d="M9 7h6"/><path d="M9 11h4"/></svg> Money</span>
      <span className="vq-app__nav"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> People</span>
      <span className="vq-app__nav"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg> Reports</span>
      <span className="vq-app__nav" style={{"marginTop":"auto"}}><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2"/><circle cx="12" cy="12" r="3"/></svg> Settings</span>
    </nav>
    <div className="vq-app__main">
      <div className="vq-app__title">
        <div><h3 className="vq-h3" style={{"fontSize":"19px"}}>Today</h3>
          <span className="vq-caption">Wednesday, 4 September</span></div>
        <span className="vq-status vq-status--ok"><svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg> Ledger balanced</span>
      </div>
      <div className="vq-cards">

        <div className="vq-dcard vq-dcard--accent c5 r2">
          <div className="vq-stat">
            <span className="vq-stat__label">Sales today</span>
            <span className="vq-stat__value">184.2<span className="vq-stat__unit">k PKR</span></span>
          </div>
          <div className="vq-row vq-gap-2">
            <span className="vq-delta">▲ 8.2%</span>
            <span className="vq-stat__note">vs last Wednesday</span>
          </div>
        </div>

        <div className="vq-dcard c4 r2">
          <div className="vq-dcard__head"><span className="vq-dcard__title">Gross margin</span></div>
          <div className="vq-stat">
            <span className="vq-stat__value vq-stat__value--sm">31.4<span className="vq-stat__unit">%</span></span>
          </div>
          <div className="vq-row vq-gap-2">
            <span className="vq-delta vq-delta--down">▼ 1.1pt</span>
            <span className="vq-stat__note">vs last month</span>
          </div>
        </div>

        <div className="vq-dcard c3 r2">
          <div className="vq-dcard__head"><span className="vq-dcard__title">Expiring ≤30 days</span></div>
          <div className="vq-stat">
            <span className="vq-stat__value vq-stat__value--sm">27<span className="vq-stat__unit">batches</span></span>
          </div>
          <span className="vq-status vq-status--warn"><svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Review</span>
        </div>

        <div className="vq-dcard c7 r3">
          <div className="vq-dcard__head">
            <span className="vq-dcard__title">Sales, last 14 days</span>
            <span className="vq-badge">Branch: all</span>
          </div>
          <div style={{"marginTop":"auto"}}><div className="vq-chart" style={{"height":"108px"}}>
    <svg viewBox="0 0 320 108" preserveAspectRatio="none" role="img" aria-label="Trend, last 14 periods">
      <defs><linearGradient id="vqFade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="var(--vq-series-1-ink)" stopOpacity=".22"/>
        <stop offset="100%" stopColor="var(--vq-series-1-ink)" stopOpacity="0"/>
      </linearGradient></defs>
      <path className="area" d="M0.0 101.7 L24.6 91.8 L49.2 105.0 L73.8 78.7 L98.5 68.8 L123.1 82.0 L147.7 58.9 L172.3 65.5 L196.9 45.8 L221.5 52.4 L246.2 32.6 L270.8 42.5 L295.4 16.2 L320.0 3.0 L320 108 L0 108 Z"/><path className="line" d="M0.0 101.7 L24.6 91.8 L49.2 105.0 L73.8 78.7 L98.5 68.8 L123.1 82.0 L147.7 58.9 L172.3 65.5 L196.9 45.8 L221.5 52.4 L246.2 32.6 L270.8 42.5 L295.4 16.2 L320.0 3.0"/>
    </svg></div></div>
        </div>

        <div className="vq-dcard c5 r3">
          <div className="vq-dcard__head"><span className="vq-dcard__title">Top lines by margin</span></div>
          <div className="vq-mt-4"><div className="vq-rank">
  <div className="vq-rank__row"><span className="vq-rank__name">Panadol 500mg</span><span className="vq-rank__val">41.2%</span>
    <span className="vq-rank__track"><span className="vq-rank__fill" style={{"--w":"92%"}}></span></span>
  </div>
  <div className="vq-rank__row"><span className="vq-rank__name">Augmentin 625</span><span className="vq-rank__val">33.8%</span>
    <span className="vq-rank__track"><span className="vq-rank__fill" style={{"--w":"76%"}}></span></span>
  </div>
  <div className="vq-rank__row"><span className="vq-rank__name">Surgical masks</span><span className="vq-rank__val">28.1%</span>
    <span className="vq-rank__track"><span className="vq-rank__fill" style={{"--w":"63%"}}></span></span>
  </div>
  <div className="vq-rank__row"><span className="vq-rank__name">Glucose strips</span><span className="vq-rank__val">19.4%</span>
    <span className="vq-rank__track"><span className="vq-rank__fill" style={{"--w":"44%"}}></span></span>
  </div></div></div>
        </div>

        <div className="vq-dcard c4 r2">
          <div className="vq-dcard__head"><span className="vq-dcard__title">Cash vs card</span></div>
          <div style={{"marginTop":"auto"}}><div className="vq-chart" style={{"height":"78px"}}>
    <svg viewBox="0 0 260 78" preserveAspectRatio="none" role="img" aria-label="Comparison by period"><line className="grid" x1="0" x2="260" y1="21.12" y2="21.12"/><line className="grid" x1="0" x2="260" y1="42.24" y2="42.24"/><line className="grid" x1="0" x2="260" y1="64" y2="64"/><rect className="bar" x="0.0" y="27.1" width="32.0" height="36.9"/><rect className="bar" x="38.0" y="19.2" width="32.0" height="44.8"/><rect className="bar" x="76.0" y="30.6" width="32.0" height="33.4"/><rect className="bar" x="114.0" y="11.3" width="32.0" height="52.7"/><rect className="bar" x="152.0" y="22.7" width="32.0" height="41.3"/><rect className="bar is-on" x="190.0" y="6.0" width="32.0" height="58.0"/><rect className="bar" x="228.0" y="13.0" width="32.0" height="51.0"/><text className="lbl" x="16.0" y="76" textAnchor="middle">M</text><text className="lbl" x="54.0" y="76" textAnchor="middle">T</text><text className="lbl" x="92.0" y="76" textAnchor="middle">W</text><text className="lbl" x="130.0" y="76" textAnchor="middle">T</text><text className="lbl" x="168.0" y="76" textAnchor="middle">F</text><text className="lbl" x="206.0" y="76" textAnchor="middle">S</text><text className="lbl" x="244.0" y="76" textAnchor="middle">S</text></svg></div></div>
        </div>

        <div className="vq-dcard c4 r2">
          <div className="vq-dcard__head"><span className="vq-dcard__title">Owed to you</span></div>
          <div className="vq-stat">
            <span className="vq-stat__value vq-stat__value--sm">612<span className="vq-stat__unit">k</span></span>
            <span className="vq-stat__note">Rs 84k over 60 days</span>
          </div>
        </div>

        <div className="vq-dcard c4 r2">
          <div className="vq-dcard__head"><span className="vq-dcard__title">You owe</span></div>
          <div className="vq-stat">
            <span className="vq-stat__value vq-stat__value--sm">(438)<span className="vq-stat__unit">k</span></span>
            <span className="vq-stat__note">4 distributors · next due Fri</span>
          </div>
        </div>

      </div>
    </div>
  </div>
</div></div>
    </section>

  </div>
</div>

<section className="vq-section vq-section--alt">
  <div className="vq-container">
    <div className="vq-section-head vq-reveal"><span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Keep reading</span><h2 className="vq-h2 vq-mt-4">After the build</h2></div>
    <div className="vq-grid vq-grid--3"><a className="vq-card vq-card--interactive vq-reveal" href="/pricing"><h3 className="vq-h3">Pick a plan when you are ready</h3><p className="vq-tile__body vq-mt-3">14 days at Core level, or start free on Solo.</p><span className="vq-link vq-mt-4">Read on <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a><a className="vq-card vq-card--interactive vq-reveal" href="/dashboard-preview"><h3 className="vq-h3">The dashboard you will land on</h3><p className="vq-tile__body vq-mt-3">58 readings, self-assembling.</p><span className="vq-link vq-mt-4">Read on <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a><a className="vq-card vq-card--interactive vq-reveal" href="/solutions"><h3 className="vq-h3">Or start from your industry</h3><p className="vq-tile__body vq-mt-3">Six ready configurations.</p><span className="vq-link vq-mt-4">Read on <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a></div>
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
