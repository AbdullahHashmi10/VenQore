import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { LuArrowRight, LuArrowUpRight, LuPlus } from 'react-icons/lu';

import Navbar from '../components/landingnew/Navbar/Navbar';
import Footer from '../components/landingnew/Footer/Footer';
import Testimonials from '../components/landingnew/Testimonials/Testimonials';
import ProCta from '../components/common/Pro/ProCta';
import ProReel from '../components/common/Pro/ProReel';
import ColorBends from '../content/Backgrounds/ColorBends/ColorBends';
import { PRO_SECTIONS, PRO_FAQ, PRO_TESTIMONIALS, PRO_FREE_COPY } from '../constants/Pro';
import { proUrl, trackProClick, proAgentKitPreview } from '../utils/pro';
import useProManifest from '../hooks/useProManifest';
import usePageSEO from '../hooks/usePageSEO';
import useScrollToTop from '../hooks/useScrollToTop';

const HERO_PLACEMENT = 'pro-hub-hero';

// The hero pill rotates through what Pro actually ships, so the first thing a
// visitor reads isn't a single headline number they might not care about.
const TAG_ITEMS = [
  { label: '300 App UI Blocks', href: '/docs/app-ui' },
  { label: 'Landing Builder', href: '/builder' },
  { label: '34 Components', href: '/docs/components' },
  { label: 'Agent Kit', href: '/docs/agent-kit' }
];

const TAG_INTERVAL = 3200;

const ProTag = () => {
  const [index, setIndex] = useState(0);
  const [widths, setWidths] = useState(null);
  const slotRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    const id = setInterval(() => setIndex(i => (i + 1) % TAG_ITEMS.length), TAG_INTERVAL);
    return () => clearInterval(id);
  }, []);

  // A fixed slot would leave dead space after the short labels, so each label is
  // measured once and the pill animates to that exact width.
  useEffect(() => {
    let cancelled = false;

    const measure = () => {
      const slot = slotRef.current;
      if (!slot || cancelled) return;

      const probe = document.createElement('span');
      probe.className = 'prox-tag-label';
      // `inset: 0` would stretch the probe to the slot, so it is measured free.
      probe.style.cssText = 'position:absolute;inset:auto;width:auto;white-space:nowrap;visibility:hidden';
      slot.appendChild(probe);

      const next = TAG_ITEMS.map(item => {
        probe.textContent = item.label;
        return Math.ceil(probe.getBoundingClientRect().width);
      });

      probe.remove();
      setWidths(next);
    };

    if (document.fonts?.ready) document.fonts.ready.then(measure);
    else measure();

    return () => {
      cancelled = true;
    };
  }, []);

  const item = TAG_ITEMS[index];

  const inner = (
    <>
      <span className="prox-tag-badge">New</span>
      <span className="prox-tag-slot" ref={slotRef} style={widths ? { width: `${widths[index]}px` } : undefined}>
        <span className="prox-tag-label" key={index}>
          {item.label}
        </span>
      </span>
      <LuArrowRight size={11} />
    </>
  );

  return (
    <a
      className="prox-tag"
      href={proUrl(item.href, `${HERO_PLACEMENT}-tag`)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackProClick(`${HERO_PLACEMENT}-tag`, { item: item.label })}
    >
      {inner}
    </a>
  );
};
const CTA_PLACEMENT = 'pro-hub-cta';

/** Template recordings often open on a black or half-painted frame. */
const VIDEO_START_TIME = 0.4;

const ProPage = () => {
  useScrollToTop();
  usePageSEO({
    title: 'React Bits Pro - Components, Blocks, App UI & Templates',
    description:
      'See everything that ships with React Bits Pro: animated components, marketing blocks, app UI blocks, complete Next.js templates and an Agent Kit for AI coding tools. Lifetime or annual, full source, yours to edit.',
    path: '/pro'
  });

  const [openFaq, setOpenFaq] = useState(null);

  const { manifest } = useProManifest();
  const counts = manifest?.counts;

  const templates = manifest?.templates || [];

  // The free template and free skill are the strongest proof on the page, so
  // they get their own strip rather than hiding inside a grid.
  const freeTemplate = templates.find(t => t.isFree);
  const freeSkill = manifest?.agentKit?.find(a => a.tier === 'free');

  return (
    <>
      <Navbar showDocs />

      <main className="prox">
        <section className="prox-hero">
          <div className="prox-hero-bg" aria-hidden="true">
            <ColorBends rotation={90} speed={0.2} frequency={1} noise={0.15} intensity={1.5} colors={['#A855F7']} />
          </div>

          <div className="prox-inner prox-hero-inner">
            <ProTag />

            <h1 className="prox-hero-title">
              The complete React toolkit
              <br />
              for crafting memorable UI
            </h1>

            <p className="prox-hero-desc">
              React Bits stays free forever. Pro adds 134 more components, built to the same standard, plus page blocks,
              app UI blocks, templates and an agent kit.
            </p>

            <div className="prox-actions">
              <a
                className="prox-btn prox-btn-primary"
                href={proUrl('/', HERO_PLACEMENT)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackProClick(HERO_PLACEMENT)}
              >
                Get React Bits Pro
                <LuArrowUpRight size={14} />
              </a>
              <Link className="prox-btn prox-btn-ghost" to="/pro/components">
                Browse the catalogue
                <LuArrowRight size={14} />
              </Link>
            </div>

            <ul className="prox-proof">
              <li>{counts?.total ?? 683} pieces</li>
              <li aria-hidden="true" className="prox-proof-sep" />
              <li>Lifetime option</li>
              <li aria-hidden="true" className="prox-proof-sep" />
              <li>Full source</li>
            </ul>
          </div>

          <ProReel manifest={manifest} />
        </section>

        <section className="prox-section">
          <div className="prox-inner">
            <header className="prox-head">
              <h2 className="prox-title">What you get</h2>
              <p className="prox-sub">
                One library, five kinds of building blocks. Everything installs as source you own and can edit.
              </p>
            </header>

            <div className="prox-pillars">
              {PRO_SECTIONS.map(section => {
                const count = counts?.[section.countKey];
                return (
                  <Link key={section.slug} to={`/pro/${section.slug}`} className="prox-pillar">
                    <span className="prox-pillar-arrow" aria-hidden="true">
                      <LuArrowUpRight size={15} />
                    </span>

                    <span className="prox-pillar-body">
                      <span className="prox-pillar-count">{count ?? '—'}</span>
                      <span className="prox-pillar-name">{section.countLabel || section.label}</span>
                      <span className="prox-pillar-desc">{section.tagline}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {(freeTemplate || freeSkill) && (
          <section className="prox-section prox-section-alt">
            <div className="prox-inner">
              <header className="prox-head">
                <h2 className="prox-title">Judge it before you buy</h2>
                <p className="prox-sub">We also have some freebies on Pro, try one of our templates and skills.</p>
              </header>

              <div className="prox-free">
                {freeTemplate && (
                  <article className="prox-free-card">
                    {freeTemplate.videoUrl && (
                      <span className="prox-free-media">
                        <video
                          src={freeTemplate.videoUrl}
                          muted
                          loop
                          playsInline
                          autoPlay
                          preload="metadata"
                          aria-hidden="true"
                          onLoadedMetadata={e => {
                            e.currentTarget.currentTime = VIDEO_START_TIME;
                          }}
                        />
                      </span>
                    )}
                    <span className="prox-free-tag">Free template</span>
                    <h3 className="prox-free-title">{freeTemplate.name}</h3>
                    <p className="prox-free-desc">{PRO_FREE_COPY[freeTemplate.slug] || freeTemplate.description}</p>
                    <div className="prox-free-actions">
                      <a
                        className="prox-btn prox-btn-sm prox-btn-primary"
                        href={proUrl(freeTemplate.href, 'pro-hub-free-template', { rb_item: freeTemplate.slug })}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackProClick('pro-hub-free-template', { item: freeTemplate.slug })}
                      >
                        Download it
                        <LuArrowUpRight size={13} />
                      </a>
                      {freeTemplate.livePreviewUrl && (
                        <a
                          className="prox-btn prox-btn-sm prox-btn-ghost"
                          href={proUrl(freeTemplate.livePreviewUrl, 'pro-hub-free-template-live', {
                            rb_item: freeTemplate.slug
                          })}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => trackProClick('pro-hub-free-template-live', { item: freeTemplate.slug })}
                        >
                          Live site
                        </a>
                      )}
                    </div>
                  </article>
                )}

                {freeSkill && (
                  <article className="prox-free-card">
                    <span className="prox-free-media">
                      <img src={proAgentKitPreview(freeSkill)} alt="" loading="lazy" decoding="async" />
                    </span>
                    <span className="prox-free-tag">Free agent skill</span>
                    <h3 className="prox-free-title">{freeSkill.name}</h3>
                    <p className="prox-free-desc">{PRO_FREE_COPY[freeSkill.slug] || freeSkill.summary}</p>
                    <div className="prox-free-actions">
                      <a
                        className="prox-btn prox-btn-sm prox-btn-primary"
                        href={proUrl(freeSkill.href, 'pro-hub-free-skill', { rb_item: freeSkill.slug })}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackProClick('pro-hub-free-skill', { item: freeSkill.slug })}
                      >
                        Install it
                        <LuArrowUpRight size={13} />
                      </a>
                      <Link className="prox-btn prox-btn-sm prox-btn-ghost" to="/pro/agent-kit">
                        See all skills
                      </Link>
                    </div>
                  </article>
                )}
              </div>
            </div>
          </section>
        )}

        <Testimonials tweets={PRO_TESTIMONIALS} />

        <section className="prox-section prox-section-alt">
          <div className="prox-inner prox-faq-layout">
            <div className="prox-faq-aside">
              <h2 className="prox-title">Questions, answered</h2>
              <p className="prox-sub">
                The things people ask before buying. If yours is not here, email{' '}
                <a href="mailto:pro@reactbits.dev">pro@reactbits.dev</a>.
              </p>
            </div>

            <div className="prox-faq">
              {PRO_FAQ.map((item, i) => {
                const isOpen = openFaq === i;
                return (
                  <div className={`prox-faq-item${isOpen ? ' open' : ''}`} key={item.q}>
                    <button
                      type="button"
                      className="prox-faq-q"
                      id={`prox-faq-q-${i}`}
                      aria-expanded={isOpen}
                      aria-controls={`prox-faq-panel-${i}`}
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                    >
                      <span>{item.q}</span>
                      <LuPlus className="prox-faq-icon" size={17} />
                    </button>

                    <div
                      className="prox-faq-panel"
                      id={`prox-faq-panel-${i}`}
                      role="region"
                      aria-labelledby={`prox-faq-q-${i}`}
                      aria-hidden={!isOpen}
                    >
                      <div className="prox-faq-panel-inner">
                        <p className="prox-faq-a">{item.a}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <div className="prox-inner prox-cta-wrap">
          <ProCta
            title="Own the whole library."
            description="Every file is yours to edit, and lifetime access includes every future update."
            placement={CTA_PLACEMENT}
            secondary={{ to: '/pro/templates', label: 'See the templates' }}
          />
        </div>
      </main>

      <Footer />
    </>
  );
};

export default ProPage;
