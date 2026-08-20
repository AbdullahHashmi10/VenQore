import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { LuArrowRight } from 'react-icons/lu';

import { CATEGORY_PRO_GROUPS } from '../../../constants/Pro';
import { useProManifest } from '../../../hooks/useProManifest';

/**
 * One quiet line at the bottom of a component page pointing at the Pro
 * equivalent of the category being read.
 *
 * It links to the on-domain preview page rather than straight to Pro, so the
 * next step is still a page of previews on reactbits.dev, not a purchase.
 *
 * The manifest is 340KB, which is far too much to pull in on every component
 * page for a single line of text. It is only fetched once this scrolls into
 * view, which on a full-length docs page means the reader actually got to the
 * bottom. The result is cached for the rest of the session.
 */
const CategoryProFooter = ({ category }) => {
  const config = CATEGORY_PRO_GROUPS[category];
  const sentinelRef = useRef(null);
  const [inView, setInView] = useState(false);

  const { manifest } = useProManifest({ enabled: inView && Boolean(config) });

  useEffect(() => {
    if (!config || inView) return undefined;

    const node = sentinelRef.current;
    if (!node) return undefined;

    if (typeof IntersectionObserver !== 'function') {
      setInView(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) setInView(true);
      },
      { rootMargin: '200px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [config, inView]);

  const count = useMemo(() => {
    if (!manifest || !config) return 0;
    if (!config.group) return manifest.counts?.components ?? manifest.components?.length ?? 0;
    return (manifest.components || []).filter(item => item.group === config.group).length;
  }, [manifest, config]);

  if (!config) return null;

  const to = config.group ? `/pro/components?group=${encodeURIComponent(config.group)}` : '/pro/components';

  return (
    <div className="cat-pro" ref={sentinelRef}>
      {count > 0 && (
        <Link className="cat-pro-card" to={to}>
          <span className="cat-pro-body">
            <span className="cat-pro-eyebrow">React Bits Pro</span>
            <span className="cat-pro-title">
              {count} more {config.noun}
            </span>
          </span>
          <span className="cat-pro-arrow" aria-hidden="true">
            <LuArrowRight size={16} />
          </span>
        </Link>
      )}
    </div>
  );
};

export default CategoryProFooter;
