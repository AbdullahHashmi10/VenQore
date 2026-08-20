import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { LuArrowUpRight } from 'react-icons/lu';

import { PRO_REEL_FEATURED } from '../../../constants/Pro';
import {
  proUrl,
  trackProClick,
  proComponentPreview,
  proVariantPreview,
  proAgentKitPreview,
  playPreview,
  dampenPreview
} from '../../../utils/pro';

/** Tiles per row. Kept low on purpose: every extra tile is another animated
 *  decode, and the track repeats itself to fill wide screens anyway. */
const ROW_ITEMS = 6;

/** Marquee speed in px/sec. Rows differ slightly so they never sync up. */
const ROW_SPEED = [34, 27];

/** How long each category holds before the reel advances. */
const CYCLE_MS = 5200;

/** Template recordings often open on a black frame. */
const VIDEO_START = 0.4;

const REEL_PLACEMENT = 'pro-hub-reel';

/** Crossfade between a component's poster and its animated clip, in ms. Kept
 *  in step with the .prox-reel-clip transition. */
const CLIP_FADE = 320;

/** Sources that have already been decoded once. Re-hovering a tile should start
 *  fading immediately instead of paying for another decode round-trip. */
const decodedClips = new Set();

/** Seconds for the marquee to ease in or out of motion. */
const RAMP = 0.42;

const REEL_CATEGORIES = [
  { id: 'components', label: 'Components' },
  { id: 'blocks', label: 'Blocks' },
  { id: 'app-ui', label: 'App UI' },
  { id: 'templates', label: 'Templates' },
  { id: 'agent-kit', label: 'Agent Kit' }
];

/** Evenly spaced pick, so a sample spans the whole catalogue instead of the
 *  first N entries (which are all one category for blocks and app UI). */
const spread = (items, n) => {
  const list = items || [];
  if (list.length <= n) return list;
  const stride = list.length / n;
  return Array.from({ length: n }, (_, i) => list[Math.floor(i * stride)]);
};

/**
 * Curated line-up for a section, in the order listed in PRO_REEL_FEATURED.
 * Falls back to an even sample when a section has no picks, so a manifest that
 * renames things degrades to the old behaviour instead of an empty row.
 */
const pick = (items, section, key = item => item.slug) => {
  const list = items || [];
  const featured = PRO_REEL_FEATURED[section];
  if (!featured?.length) return spread(list, ROW_ITEMS * 2);

  const bySlug = new Map(list.map(item => [key(item), item]));
  const curated = featured.map(slug => bySlug.get(slug)).filter(Boolean);
  return curated.length ? curated : spread(list, ROW_ITEMS * 2);
};

const flattenVariants = categories =>
  (categories || []).flatMap(category => (category.variants || []).map(variant => ({ ...variant })));

/** Normalises each catalogue section into the tile shape the reel renders. */
const buildTiles = manifest => {
  if (!manifest) return {};

  const components = pick(manifest.components, 'components').map(item => ({
    key: `c-${item.slug}`,
    kind: 'clip',
    alt: item.name,
    slug: item.slug,
    href: item.href,
    section: 'components',
    ...proComponentPreview(item.slug)
  }));

  const variantTiles = (list, dir, prefix, section) =>
    pick(flattenVariants(list), section).map(item => ({
      key: `${prefix}-${item.slug}`,
      kind: 'image',
      zoom: true,
      alt: item.name,
      slug: item.slug,
      href: item.href,
      section,
      src: proVariantPreview(dir, item.slug)
    }));

  const templates = spread(
    (manifest.templates || []).filter(t => t.videoUrl),
    ROW_ITEMS * 2
  ).map(item => ({
    key: `t-${item.slug}`,
    kind: 'video',
    alt: item.name,
    slug: item.slug,
    href: item.href,
    section: 'templates',
    src: item.videoUrl
  }));

  const agentKit = pick(manifest.agentKit, 'agent-kit', item => `${item.kind}-${item.slug}`).map(item => ({
    key: `a-${item.kind}-${item.slug}`,
    kind: 'image',
    alt: item.name,
    slug: item.slug,
    href: item.href,
    section: 'agent-kit',
    src: proAgentKitPreview(item)
  }));

  return {
    components,
    blocks: variantTiles(manifest.blocks, 'blocks', 'b', 'blocks'),
    'app-ui': variantTiles(manifest.appUi, 'app-ui', 'u', 'app-ui'),
    templates,
    'agent-kit': agentKit
  };
};

const Tile = ({ tile, index, hovered, duplicate, onHover }) => {
  // `mounted` and `visible` are separate so the clip can fade out before it is
  // removed. Unmounting on mouse-out is what made leaving a tile snap.
  const [clip, setClip] = useState({ mounted: false, visible: false });
  const videoRef = useRef(null);
  const unmountRef = useRef(0);

  // An animated webp starts painting mid-download, so mounting it straight into
  // a fade shows a half-drawn frame. Decoding first means the crossfade always
  // runs against a complete image, and the decode is cached for later hovers.
  useEffect(() => {
    if (tile.kind !== 'clip') return undefined;

    clearTimeout(unmountRef.current);

    if (!hovered) {
      setClip(state => (state.mounted ? { mounted: true, visible: false } : state));
      unmountRef.current = setTimeout(() => setClip({ mounted: false, visible: false }), CLIP_FADE);
      return undefined;
    }

    let cancelled = false;
    setClip(state => ({ mounted: true, visible: state.visible }));

    const reveal = () => {
      if (cancelled) return;
      decodedClips.add(tile.animated);
      // A frame of headroom so the element is in the DOM at opacity 0 before it
      // is flipped, otherwise the transition is skipped entirely.
      requestAnimationFrame(() => !cancelled && setClip({ mounted: true, visible: true }));
    };

    if (decodedClips.has(tile.animated)) {
      reveal();
    } else {
      const image = new Image();
      image.src = tile.animated;
      if (image.decode) image.decode().then(reveal).catch(reveal);
      else image.onload = reveal;
    }

    return () => {
      cancelled = true;
    };
  }, [hovered, tile.kind, tile.animated]);

  useEffect(() => () => clearTimeout(unmountRef.current), []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (hovered) playPreview(video);
    else dampenPreview(video);
  }, [hovered]);

  return (
    <a
      className={`prox-reel-tile${tile.zoom ? ' is-zoomed' : ''}`}
      style={{ '--i': index }}
      href={proUrl(tile.href, REEL_PLACEMENT, { rb_item: tile.slug })}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={duplicate ? undefined : tile.alt}
      aria-hidden={duplicate ? 'true' : undefined}
      tabIndex={duplicate ? -1 : undefined}
      onClick={() => trackProClick(REEL_PLACEMENT, { section: tile.section, item: tile.slug })}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onFocus={() => onHover(true)}
      onBlur={() => onHover(false)}
    >
      {tile.kind === 'video' && (
        <video
          ref={videoRef}
          src={tile.src}
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          onLoadedMetadata={e => {
            e.currentTarget.currentTime = VIDEO_START;
          }}
        />
      )}

      {tile.kind === 'clip' && (
        <>
          <img src={tile.poster} alt="" loading="lazy" decoding="async" />
          {clip.mounted && (
            <img
              src={tile.animated}
              alt=""
              decoding="async"
              className={`prox-reel-clip${clip.visible ? ' is-ready' : ''}`}
            />
          )}
        </>
      )}

      {tile.kind === 'image' && <img src={tile.src} alt="" loading="lazy" decoding="async" />}

      <span className="prox-reel-pill">
        View live
        <LuArrowUpRight size={12} />
      </span>
    </a>
  );
};

/**
 * One marquee row.
 *
 * The track holds N copies of the same set and shifts left by exactly one set
 * width, so the loop is seamless by construction. Both the set width and the
 * copy count are measured rather than assumed, which is what keeps it gapless
 * on ultrawide displays where a hardcoded track would run out of tiles.
 */
const ReelRow = ({ tiles, reverse, speed, animate: rowAnimate, onHoverChange }) => {
  const rowRef = useRef(null);
  const setRef = useRef(null);
  const trackRef = useRef(null);
  const [setWidth, setSetWidth] = useState(0);
  const [copies, setCopies] = useState(2);
  const [hoveredId, setHoveredId] = useState(null);

  // Only the row being inspected stops; the other one keeps moving.
  const animate = rowAnimate && !hoveredId;

  const measure = useCallback(() => {
    const set = setRef.current;
    const row = rowRef.current;
    if (!set || !row) return;

    // The set carries a trailing gap as padding, so its own width is the exact
    // distance to travel for a seamless wrap.
    const width = set.offsetWidth;
    if (!width) return;

    setSetWidth(width);
    setCopies(Math.max(2, Math.ceil(row.clientWidth / width) + 1));
  }, []);

  useLayoutEffect(() => {
    measure();
    const observer = new ResizeObserver(measure);
    if (setRef.current) observer.observe(setRef.current);
    if (rowRef.current) observer.observe(rowRef.current);
    return () => observer.disconnect();
  }, [measure, tiles]);

  // The track is driven by rAF rather than a CSS keyframe so hovering can ease
  // the row to a stop instead of snapping it, which a CSS `animation-play-state`
  // toggle can't do. Position is kept modulo one set width, so the wrap stays
  // seamless no matter where the ramp leaves it.
  //
  // `animate` is read through a ref on purpose: putting it in the dependency
  // list would tear down and restart the loop on every hover, which resets the
  // position and reads as a jump rather than a slowdown.
  const animateRef = useRef(animate);
  const posRef = useRef(0);
  const factorRef = useRef(animate ? 1 : 0);
  const startRef = useRef(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || !setWidth) return undefined;

    let frame = 0;
    let last = 0;
    let idle = true;

    const tick = now => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;

      const target = animateRef.current ? 1 : 0;
      // Exponential approach: ~90% of the way to the target in RAMP seconds.
      let factor = factorRef.current + (target - factorRef.current) * (1 - Math.exp(-dt / RAMP));
      if (!target && factor < 0.002) factor = 0;
      factorRef.current = factor;

      posRef.current = (posRef.current + speed * factor * dt) % setWidth;
      track.style.transform = `translate3d(${reverse ? posRef.current - setWidth : -posRef.current}px, 0, 0)`;

      // A fully stopped row schedules no further frames until it is woken up.
      if (!target && factor === 0) {
        idle = true;
        return;
      }

      frame = requestAnimationFrame(tick);
    };

    const start = () => {
      if (!idle) return;
      idle = false;
      last = 0;
      frame = requestAnimationFrame(tick);
    };

    startRef.current = start;
    start();

    return () => {
      idle = true;
      startRef.current = null;
      cancelAnimationFrame(frame);
    };
  }, [reverse, speed, setWidth]);

  useEffect(() => {
    animateRef.current = animate;
    if (animate) startRef.current?.();
  }, [animate]);

  // Videos are hover-driven, so this only has to catch the case where the reel
  // leaves the viewport while a tile is still playing.
  useEffect(() => {
    if (animate) return;
    rowRef.current?.querySelectorAll('video').forEach(video => video.pause());
  }, [animate, tiles]);

  if (!tiles?.length) return null;

  return (
    <div className="prox-reel-row" ref={rowRef}>
      <div className="prox-reel-track" ref={trackRef}>
        {Array.from({ length: copies }, (_, copy) => (
          <div className="prox-reel-set" key={copy} ref={copy === 0 ? setRef : null}>
            {tiles.map((tile, i) => {
              const id = `${copy}-${tile.key}`;
              return (
                <Tile
                  key={tile.key}
                  tile={tile}
                  index={i}
                  hovered={hoveredId === id}
                  duplicate={copy > 0}
                  onHover={on => {
                    setHoveredId(on ? id : null);
                    onHoverChange?.(on);
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

const ProReel = ({ manifest }) => {
  const hostRef = useRef(null);
  const [active, setActive] = useState(0);
  const [inView, setInView] = useState(true);
  const [paused, setPaused] = useState(false);
  const [inspecting, setInspecting] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!query) return undefined;

    const sync = () => setReduced(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  // Nothing here should burn a frame once the hero is scrolled past.
  useEffect(() => {
    const node = hostRef.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const tiles = useMemo(() => buildTiles(manifest), [manifest]);
  const current = REEL_CATEGORIES[active];
  const currentTiles = useMemo(() => tiles[current.id] || [], [tiles, current.id]);

  // Hovering a tile stops that row only (handled inside ReelRow) and holds the
  // category cycle, so the thing being inspected can't be swapped out mid-look.
  const running = inView && !reduced;
  const cycling = running && !paused && !inspecting && currentTiles.length > 0;

  useEffect(() => {
    if (!cycling) return undefined;
    const timer = setTimeout(() => setActive(i => (i + 1) % REEL_CATEGORIES.length), CYCLE_MS);
    return () => clearTimeout(timer);
  }, [cycling, active]);

  const rows = useMemo(
    () => [currentTiles.filter((_, i) => i % 2 === 0), currentTiles.filter((_, i) => i % 2 === 1)],
    [currentTiles]
  );

  if (!currentTiles.length) return null;

  return (
    <div className="prox-reel" ref={hostRef}>
      <div className="prox-reel-rows">
        {rows.map((rowTiles, i) => (
          <ReelRow
            // Remounting on category change replays the staggered entrance.
            key={`${current.id}-${i}`}
            tiles={rowTiles}
            reverse={i === 1}
            speed={ROW_SPEED[i]}
            animate={running}
            onHoverChange={setInspecting}
          />
        ))}
      </div>

      <div
        className="prox-reel-tabs"
        role="tablist"
        aria-label="Preview category"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {REEL_CATEGORIES.map((category, i) => (
          <button
            key={category.id}
            type="button"
            role="tab"
            aria-selected={i === active}
            className={`prox-reel-tab${i === active ? ' is-active' : ''}`}
            onClick={() => setActive(i)}
          >
            {category.label}
            {i === active && (
              <span
                key={`${active}-${cycling}`}
                className={`prox-reel-tab-bar${cycling ? ' is-running' : ''}`}
                style={{ animationDuration: `${CYCLE_MS}ms` }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProReel;
