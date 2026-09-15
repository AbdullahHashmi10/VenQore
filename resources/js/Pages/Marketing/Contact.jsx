import React, { useEffect } from 'react';
import { useTheme } from '@/Contexts/ThemeContext';
import { Head, Link, usePage } from '@inertiajs/react';
import SiteHeader from '@/Components/Site/SiteHeader';
import useTurnstile from '@/Components/Builder/useTurnstile';
import SiteFooter from '@/Components/Site/SiteFooter';
import CookieConsent from '@/Components/CookieConsent';

export default function Contact() {
    const { isDarkMode, toggleTheme } = useTheme();
    const { auth = {}, flash = {}, ...props } = usePage().props;
    const getTurnstileToken = useTurnstile();

    // venqore-forms.js posts the contact form; it asks for a Turnstile token here.
    useEffect(() => {
        window.__vqTurnstile = getTurnstileToken;
        return () => { if (window.__vqTurnstile === getTurnstileToken) delete window.__vqTurnstile; };
    }, [getTurnstileToken]);

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
                <title>Contact — a person answers this one | VenQore</title>
                <meta name="description" content="Tell us what your business does and what is currently painful. No ticket queue and no chatbot — a reply from someone who built the thing." />
                <link rel="canonical" href="https://venqore.com/contact" />
                <meta property="og:title" content="Contact — a person answers this one | VenQore" />
                <meta property="og:description" content="Tell us what your business does and what is currently painful. No ticket queue and no chatbot — a reply from someone who built the thing." />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://venqore.com/contact" />
                <meta property="og:image" content="https://venqore.com/images/og/venqore-og.png" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Contact — a person answers this one | VenQore" />
                <meta name="twitter:description" content="Tell us what your business does and what is currently painful. No ticket queue and no chatbot — a reply from someone who built the thing." />
                <meta name="twitter:image" content="https://venqore.com/images/og/venqore-og.png" />
            </Head>

            <div className="vq-site vq-app-body" style={{ background: 'var(--vq-bg)', color: 'var(--vq-text)', overflow: 'visible', minHeight: '100vh' }}>



  <SiteHeader />

<main id="main">

<section className="vq-section" style={{"paddingTop":"clamp(140px,15vw,200px)"}}>
  <div className="vq-amb"><span className="vq-amb__aurora" style={{"opacity":".26"}}></span></div>
  <div className="vq-container" style={{"position":"relative"}}>
    <div className="vq-grid" style={{"gridTemplateColumns":"minmax(0,1fr) minmax(0,520px)","gap":"var(--vq-space-16)","alignItems":"start"}}>

      <div className="vq-reveal">
        <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Contact</span>
        <h1 className="vq-display vq-mt-4">A <em className="vq-italic">person</em> answers this one.</h1>
        <p className="vq-lede vq-mt-6">There is no ticket queue and no chatbot in front of it. Tell us
          what you are trying to do and you will get a reply from someone who can actually change
          the product.</p>

        <div className="vq-stack vq-gap-4 vq-mt-10">
          
          <div className="vq-card vq-reveal">
            <div className="vq-row vq-gap-4" style={{"alignItems":"flex-start"}}>
              <span className="vq-tile__icon" style={{"marginBottom":"0"}}><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/></svg></span>
              <div>
                <h2 className="vq-h3">Trying VenQore</h2>
                <p className="vq-tile__body vq-mt-2">You do not need to talk to anyone to start. Describe your business, review the Blueprint, and go live the same day.</p>
                <a className="vq-link vq-mt-3" href="/build-workspace">Start building <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></a>
              </div>
            </div>
          </div>
          <div className="vq-card vq-reveal">
            <div className="vq-row vq-gap-4" style={{"alignItems":"flex-start"}}>
              <span className="vq-tile__icon" style={{"marginBottom":"0"}}><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg></span>
              <div>
                <h2 className="vq-h3">More than 10 branches, or something specific</h2>
                <p className="vq-tile__body vq-mt-2">Multi-entity, an unusual tax regime, a migration off something large — say so in the form and we will scope it properly.</p>
                <a className="vq-link vq-mt-3" href="/pricing">See pricing <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></a>
              </div>
            </div>
          </div>
          <div className="vq-card vq-reveal">
            <div className="vq-row vq-gap-4" style={{"alignItems":"flex-start"}}>
              <span className="vq-tile__icon" style={{"marginBottom":"0"}}><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"/></svg></span>
              <div>
                <h2 className="vq-h3">Partnerships &amp; integrations</h2>
                <p className="vq-tile__body vq-mt-2">If you run a channel, a payment rail or an accounting practice, there is probably something worth building.</p>
                <a className="vq-link vq-mt-3" href="/features">Read the feature list <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></a>
              </div>
            </div>
          </div>
        </div>

        <div className="vq-hr"></div>
        <div className="vq-row vq-wrap vq-gap-8">
          <div>
            <span className="vq-eyebrow">Email</span>
            <p className="vq-small vq-mt-2"><a href="mailto:hello@venqore.com">hello@venqore.com</a></p>
          </div>
          <div>
            <span className="vq-eyebrow">Where we are</span>
            <p className="vq-small vq-mt-2">Okara, Punjab, Pakistan · UTC+5</p>
          </div>
          <div>
            <span className="vq-eyebrow">Typical reply</span>
            <p className="vq-small vq-mt-2">Within one working day</p>
          </div>
        </div>
      </div>

      <div className="vq-card vq-card--xl vq-reveal" style={{"position":"sticky","top":"120px"}}>
        <h2 className="vq-h3">Tell us what you need</h2>
        <p className="vq-caption vq-mt-2" style={{"maxWidth":"none"}}>The more specific you are, the more useful the reply.</p>
        <form className="vq-stack vq-gap-5 vq-mt-6" data-demo>
          <div className="vq-grid vq-grid--2" style={{"gap":"16px"}}>
            <div className="vq-field">
              <label className="vq-label" htmlFor="c-name">Your name</label>
              <input className="vq-input" id="c-name" name="name" required autoComplete="name" placeholder="John Doe" />
            </div>
            <div className="vq-field">
              <label className="vq-label" htmlFor="c-biz">Business name</label>
              <input className="vq-input" id="c-biz" name="business" autoComplete="organization" placeholder="Acme Retail" />
            </div>
          </div>
          <div className="vq-field">
            <label className="vq-label" htmlFor="c-email">Work email</label>
            <input className="vq-input" id="c-email" name="email" type="email" required autoComplete="email" placeholder="you@company.com" />
            <span className="vq-help">We reply here. No list, no sequence.</span>
          </div>
          <div className="vq-field">
            <label className="vq-label" id="c-topic-label" htmlFor="c-topic-trigger">What is this about?</label>
            <div className="vq-custom-select" data-custom-select>
              <input type="hidden" id="c-topic" name="topic" value="Getting started" />
              <button type="button" className="vq-custom-select__trigger" id="c-topic-trigger" aria-haspopup="listbox" aria-expanded="false" aria-labelledby="c-topic-label c-topic-trigger">
                <span className="vq-custom-select__value">Getting started</span>
                <svg className="vq-custom-select__chevron" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
              </button>
              <ul className="vq-custom-select__menu" role="listbox" aria-labelledby="c-topic-label" tabIndex="-1">
                <li className="vq-custom-select__item is-selected" role="option" aria-selected="true" data-value="Getting started">
                  <span>Getting started</span>
                  <svg className="vq-custom-select__check" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </li>
                <li className="vq-custom-select__item" role="option" aria-selected="false" data-value="Something specific my business needs">
                  <span>Something specific my business needs</span>
                  <svg className="vq-custom-select__check" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </li>
                <li className="vq-custom-select__item" role="option" aria-selected="false" data-value="Migrating from another system">
                  <span>Migrating from another system</span>
                  <svg className="vq-custom-select__check" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </li>
                <li className="vq-custom-select__item" role="option" aria-selected="false" data-value="Pricing for more than 10 branches">
                  <span>Pricing for more than 10 branches</span>
                  <svg className="vq-custom-select__check" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </li>
                <li className="vq-custom-select__item" role="option" aria-selected="false" data-value="Partnership or integration">
                  <span>Partnership or integration</span>
                  <svg className="vq-custom-select__check" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </li>
                <li className="vq-custom-select__item" role="option" aria-selected="false" data-value="Something is broken">
                  <span>Something is broken</span>
                  <svg className="vq-custom-select__check" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </li>
              </ul>
            </div>
          </div>
          <div className="vq-field">
            <label className="vq-label" htmlFor="c-msg">How does your business work?</label>
            <textarea className="vq-textarea" id="c-msg" name="message" required
              placeholder="What you sell, how you buy, how many people, how many locations — and the thing that is currently painful." />
          </div>
          <label className="vq-check">
            <input type="checkbox" name="updates" />
            <span className="vq-caption" style={{"maxWidth":"none"}}>Send me product updates, roughly monthly. No marketing.</span>
          </label>
          <button type="submit" className="vq-btn vq-btn--primary vq-btn--lg vq-btn--block">Send it</button>
          <p className="vq-caption vq-center" style={{"maxWidth":"none"}}>
            You do not need to do this to try VenQore. <a href="/build-workspace">Start building →</a>
          </p>
        </form>
      </div>

    </div>
  </div>
</section>

<section className="vq-section vq-section--alt">
  <div className="vq-container">
    <div className="vq-section-head vq-reveal"><span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Keep reading</span><h2 className="vq-h2 vq-mt-4">Answers you may not need to ask for</h2></div>
    <div className="vq-grid vq-grid--3"><a className="vq-card vq-card--interactive vq-reveal" href="/help"><h3 className="vq-h3">The help centre</h3><p className="vq-tile__body vq-mt-3">Answers organised by screen.</p><span className="vq-link vq-mt-4">Read on <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a><a className="vq-card vq-card--interactive vq-reveal" href="/docs"><h3 className="vq-h3">Documentation</h3><p className="vq-tile__body vq-mt-3">Guides and how-tos.</p><span className="vq-link vq-mt-4">Read on <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a><a className="vq-card vq-card--interactive vq-reveal" href="/pricing"><h3 className="vq-h3">Plans and limits</h3><p className="vq-tile__body vq-mt-3">From $49/month or free.</p><span className="vq-link vq-mt-4">Read on <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a></div>
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
