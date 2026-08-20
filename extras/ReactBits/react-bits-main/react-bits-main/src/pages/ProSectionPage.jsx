import { useMemo } from 'react';
import { Link, useParams, useSearchParams, Navigate } from 'react-router-dom';
import { LuArrowRight, LuArrowUpRight } from 'react-icons/lu';

import { PRO_SECTIONS, PRO_SECTION_MAP } from '../constants/Pro';
import { proUrl, trackProClick } from '../utils/pro';
import useProManifest from '../hooks/useProManifest';
import usePageSEO from '../hooks/usePageSEO';
import BackToTopButton from '../components/common/BackToTopButton';
import {
  ComponentCard,
  CategoryCard,
  VariantCard,
  TemplateCard,
  AgentKitCard
} from '../components/common/Pro/ProCards';
import ProCta from '../components/common/Pro/ProCta';

const ALL = 'All';

const KIND_ORDER = ['skill', 'prompt', 'recipe'];
const KIND_LABELS = { skill: 'Skills', prompt: 'Prompts', recipe: 'Recipes' };

/**
 * Blocks and App UI arrive grouped by category. Flattening to one card per
 * variant shows the real catalogue instead of 21 or 38 category tiles, and
 * carries the parent category down so the filter chips still work.
 */
const flattenVariants = categories =>
  categories.flatMap(category =>
    (category.variants || []).map(variant => ({
      ...variant,
      category: category.name,
      categorySlug: category.slug,
      categoryHref: category.href
    }))
  );

/** Which field a section filters on, and how its chips are labelled. */
const getFilterConfig = (section, items, manifest) => {
  if (section.slug === 'agent-kit') {
    const kinds = KIND_ORDER.filter(kind => items.some(item => item.kind === kind));
    return { key: 'kind', options: kinds, labels: KIND_LABELS };
  }

  if (section.variantLevel) {
    const declared = (manifest?.[section.manifestKey] || []).map(category => category.name);
    const present = declared.filter(name => items.some(item => item.category === name));
    return { key: 'category', options: present, labels: null };
  }

  if (section.groupKey) {
    const declared = manifest?.groups?.[section.groupKey] || [];
    const present = declared.filter(group => items.some(item => (item.group || item.category) === group));
    return { key: 'group', options: present, labels: null };
  }

  return null;
};

const getFilterValue = (item, key) => (key === 'kind' ? item.kind : item.group || item.category);

const ProSectionPage = () => {
  const { section: sectionSlug } = useParams();
  const section = PRO_SECTION_MAP[sectionSlug];
  const { manifest, loading, error } = useProManifest();

  // The active filter lives in the URL so other pages can deep-link straight to
  // a group, and so a filtered view is shareable and survives a reload.
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedFilter = searchParams.get('group') || ALL;

  const setFilter = value => {
    const next = new URLSearchParams(searchParams);
    if (value === ALL) next.delete('group');
    else next.set('group', value);
    setSearchParams(next, { replace: true });
  };

  usePageSEO({
    title: section?.seoTitle,
    description: section?.seoDescription,
    path: `/pro/${sectionSlug}`
  });

  const items = useMemo(() => {
    if (!manifest || !section) return [];
    const raw = manifest[section.manifestKey] || [];
    return section.variantLevel ? flattenVariants(raw) : raw;
  }, [manifest, section]);

  const filterConfig = useMemo(
    () => (section ? getFilterConfig(section, items, manifest) : null),
    [section, items, manifest]
  );

  // A group from another section, or one that no longer exists, falls back to
  // showing everything rather than an empty grid.
  const filter = useMemo(() => {
    if (requestedFilter === ALL) return ALL;
    return filterConfig?.options?.includes(requestedFilter) ? requestedFilter : ALL;
  }, [requestedFilter, filterConfig]);

  const visible = useMemo(() => {
    if (filter === ALL || !filterConfig) return items;
    return items.filter(item => getFilterValue(item, filterConfig.key) === filter);
  }, [items, filter, filterConfig]);

  const counts = useMemo(() => {
    if (!filterConfig) return {};
    const tally = { [ALL]: items.length };
    for (const item of items) {
      const value = getFilterValue(item, filterConfig.key);
      if (value) tally[value] = (tally[value] || 0) + 1;
    }
    return tally;
  }, [items, filterConfig]);

  if (!section) return <Navigate to="/pro" replace />;

  // Blocks and App UI render one card per category, so the card count badly
  // undersells the catalogue. Show the real variant total alongside it.
  const total = manifest?.counts?.[section.countKey];
  const categoryTotal = section.categoryCountKey ? manifest?.counts?.[section.categoryCountKey] : null;
  const totalLabel = total
    ? categoryTotal
      ? `${total} ${section.countNoun} across ${categoryTotal} ${section.categoryNoun}`
      : `${total} ${section.countNoun}`
    : null;

  const headerPlacement = `pro-${section.slug}-header`;
  const itemPlacement = `pro-${section.slug}-item`;
  const ctaPlacement = `pro-${section.slug}-cta`;
  const otherSections = PRO_SECTIONS.filter(s => s.slug !== section.slug);

  const renderCard = item => {
    switch (section.slug) {
      case 'components':
        return <ComponentCard key={item.slug} item={item} placement={itemPlacement} />;
      case 'templates':
        return <TemplateCard key={item.slug} item={item} placement={itemPlacement} />;
      case 'agent-kit':
        return <AgentKitCard key={item.slug} item={item} placement={itemPlacement} />;
      default:
        return section.variantLevel ? (
          <VariantCard
            key={`${item.categorySlug}-${item.slug}`}
            item={item}
            placement={itemPlacement}
            section={section.slug}
            previewDir={section.previewDir}
          />
        ) : (
          <CategoryCard
            key={item.slug}
            item={item}
            placement={itemPlacement}
            section={section.slug}
            previewDir={section.previewDir}
          />
        );
    }
  };

  return (
    <div className="category-page pro-page">
      <div className="page-transition-fade">
        <header className="pro-section-head">
          <h2 className="sub-category">{section.pageTitle}</h2>
          <p className="pro-section-desc">{section.description}</p>
          {totalLabel && <span className="pro-section-total">{totalLabel}</span>}

          <div className="pro-section-actions">
            <a
              className="pro-btn pro-btn-primary"
              href={proUrl(section.proPath, headerPlacement)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackProClick(headerPlacement, { section: section.slug })}
            >
              Browse Live
              <LuArrowUpRight size={14} />
            </a>
            <Link className="pro-btn pro-btn-ghost" to="/pro">
              What&apos;s in Pro
              <LuArrowRight size={14} />
            </Link>
          </div>
        </header>

        {filterConfig?.options?.length > 1 && (
          <div className="pro-filters" role="tablist" aria-label={`${section.label} filters`}>
            {[ALL, ...filterConfig.options].map(option => (
              <button
                key={option}
                type="button"
                role="tab"
                aria-selected={filter === option}
                className={`pro-filter${filter === option ? ' active' : ''}`}
                onClick={() => setFilter(option)}
              >
                {option === ALL ? 'All' : filterConfig.labels?.[option] || option}
                {counts[option] > 0 && <span className="pro-filter-count">{counts[option]}</span>}
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div className="pro-grid">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="pro-item pro-item-skeleton" />
            ))}
          </div>
        )}

        {error && (
          <div className="pro-empty">
            <h2 className="pro-empty-title">Couldn&apos;t load the catalogue</h2>
            <p className="pro-empty-desc">The full, interactive collection is always available on the Pro app.</p>
            <a
              className="pro-btn pro-btn-primary"
              href={proUrl(section.proPath, `pro-${section.slug}-error`)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackProClick(`pro-${section.slug}-error`, { section: section.slug })}
            >
              See it live
              <LuArrowUpRight size={14} />
            </a>
          </div>
        )}

        {!loading && !error && <div className="pro-grid">{visible.map(renderCard)}</div>}

        <ProCta
          title="Own the whole library."
          description="Components, blocks, app UI, templates and agent skills. One license, unlimited projects."
          placement={ctaPlacement}
          trackParams={{ section: section.slug }}
          secondary={{ to: `/pro/${otherSections[0].slug}`, label: `Browse ${otherSections[0].label}` }}
        />
      </div>

      <BackToTopButton />
    </div>
  );
};

export default ProSectionPage;
