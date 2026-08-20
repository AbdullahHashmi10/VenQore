import { Link } from 'react-router-dom';
import { LuArrowRight, LuArrowUpRight } from 'react-icons/lu';

import MoltenMetal from '@/content/Backgrounds/MoltenMetal/MoltenMetal';
import { PRO_PROMO } from '../../../constants/Pro';
import { proUrl, trackProClick } from '../../../utils/pro';

/**
 * Closing CTA for the on-domain Pro pages.
 *
 * Deliberately mirrors the landing page's final CTA (rotating conic border,
 * dark card, shader wash, mono buttons) so the Pro pages close on the same
 * note as the rest of the site rather than a plain outlined panel.
 */
const ProCta = ({ title, description, placement, secondary, trackParams, showShader = true }) => (
  <section className="pro-cta">
    <div className="pro-cta-border" aria-hidden="true" />

    <div className="pro-cta-card">
      {showShader && (
        <div className="pro-cta-bg" aria-hidden="true">
          <MoltenMetal opacity={0.4} mouseInteraction={false} />
        </div>
      )}

      <h2 className="pro-cta-title">{title}</h2>
      <p className="pro-cta-desc">{description}</p>

      <div className="pro-cta-actions">
        <a
          className="pro-cta-btn pro-cta-btn-primary"
          href={proUrl('/', placement)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackProClick(placement, trackParams)}
        >
          Get React Bits Pro
          <LuArrowUpRight size={15} />
        </a>

        {secondary && (
          <Link className="pro-cta-btn pro-cta-btn-secondary" to={secondary.to}>
            {secondary.label}
            <LuArrowRight size={15} />
          </Link>
        )}
      </div>

      {PRO_PROMO && <p className="pro-cta-promo">{PRO_PROMO.label}</p>}
    </div>
  </section>
);

export default ProCta;
