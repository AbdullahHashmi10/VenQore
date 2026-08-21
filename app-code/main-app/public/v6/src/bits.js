// ═══════════════════════════════════════════════════════════════════════════
// Reusable renderings. The mock product surfaces obey the product's own laws
// (M1–M7, chart ink, the number ladder) — a marketing screenshot that breaks
// them is a lie about the product.
// ═══════════════════════════════════════════════════════════════════════════
import { icon } from './shell.js';

/* ── Chart primitives ─────────────────────────────────────────────────── */
const spark = (pts, w = 200, h = 46) => {
  const max = Math.max(...pts), min = Math.min(...pts);
  const d = pts.map((v, i) => {
    const x = (i / (pts.length - 1)) * w;
    const y = h - ((v - min) / (max - min || 1)) * (h - 6) - 3;
    return `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');
  const area = `${d} L${w} ${h} L0 ${h} Z`;
  return `<div class="vq-chart" style="height:${h}px">
    <svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img" aria-label="Trend, last ${pts.length} periods">
      <defs><linearGradient id="vqFade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--vq-series-1-ink)" stop-opacity=".22"/>
        <stop offset="100%" stop-color="var(--vq-series-1-ink)" stop-opacity="0"/>
      </linearGradient></defs>
      <path class="area" d="${area}"/><path class="line" d="${d}"/>
    </svg></div>`;
};

const bars = (vals, hot, labels, h = 84) => {
  const w = 260, n = vals.length, gap = 6;
  const bw = (w - gap * (n - 1)) / n, max = Math.max(...vals);
  const grid = [0.33, 0.66, 1].map(f => `<line class="grid" x1="0" x2="${w}" y1="${(h - 14) * f}" y2="${(h - 14) * f}"/>`).join('');
  const rects = vals.map((v, i) => {
    const bh = Math.max(3, (v / max) * (h - 20));
    return `<rect class="bar${i === hot ? ' is-on' : ''}" x="${(i * (bw + gap)).toFixed(1)}" y="${(h - 14 - bh).toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}"/>`;
  }).join('');
  const lbl = labels ? labels.map((t, i) =>
    `<text class="lbl" x="${(i * (bw + gap) + bw / 2).toFixed(1)}" y="${h - 2}" text-anchor="middle">${t}</text>`).join('') : '';
  return `<div class="vq-chart" style="height:${h}px">
    <svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img" aria-label="Comparison by period">${grid}${rects}${lbl}</svg></div>`;
};

const rank = (rows) => `<div class="vq-rank">${rows.map(r => `
  <div class="vq-rank__row"><span class="vq-rank__name">${r[0]}</span><span class="vq-rank__val">${r[1]}</span>
    <span class="vq-rank__track"><span class="vq-rank__fill" style="--w:${r[2]}%"></span></span>
  </div>`).join('')}</div>`;

/* ── The mock dashboard ───────────────────────────────────────────────────
   M1 · exactly one filled card, and it is the headline metric.
   M2 · three type sizes in the number block.
   M3 · the delta is a pill with a glyph and it is the smallest thing there.
   M5 · one hue, dashed horizontal grid, no spines, no Y labels. */
export const mockDashboard = ({ title = 'Today', preset = 'Pharmacy · 2 branches' } = {}) => `
<div class="vq-app">
  <div class="vq-app__bar">
    <div class="vq-app__dots"><i></i><i></i><i></i></div>
    <div class="vq-app__omni">${icon('search', 13)} Ask your business a question…</div>
    <div style="margin-left:auto;display:flex;align-items:center;gap:10px">
      <span class="vq-badge vq-badge--accent">${preset}</span>
    </div>
  </div>
  <div class="vq-app__body">
    <nav class="vq-app__rail" aria-label="Product navigation (illustration)">
      <span class="vq-app__nav" aria-current="true">${icon('grid')} Dashboard</span>
      <span class="vq-app__nav">${icon('cart')} Sell</span>
      <span class="vq-app__nav">${icon('box')} Stock</span>
      <span class="vq-app__nav">${icon('truck')} Buy</span>
      <span class="vq-app__nav">${icon('ledger')} Money</span>
      <span class="vq-app__nav">${icon('users')} People</span>
      <span class="vq-app__nav">${icon('chart')} Reports</span>
      <span class="vq-app__nav" style="margin-top:auto">${icon('settings')} Settings</span>
    </nav>
    <div class="vq-app__main">
      <div class="vq-app__title">
        <div><h3 class="vq-h3" style="font-size:19px">${title}</h3>
          <span class="vq-caption">Wednesday, 4 September</span></div>
        <span class="vq-status vq-status--ok">${icon('check', 11)} Ledger balanced</span>
      </div>
      <div class="vq-cards">

        <div class="vq-dcard vq-dcard--accent c5 r2">
          <div class="vq-stat">
            <span class="vq-stat__label">Sales today</span>
            <span class="vq-stat__value">184.2<span class="vq-stat__unit">k PKR</span></span>
          </div>
          <div class="vq-row vq-gap-2">
            <span class="vq-delta">▲ 8.2%</span>
            <span class="vq-stat__note">vs last Wednesday</span>
          </div>
        </div>

        <div class="vq-dcard c4 r2">
          <div class="vq-dcard__head"><span class="vq-dcard__title">Gross margin</span></div>
          <div class="vq-stat">
            <span class="vq-stat__value vq-stat__value--sm">31.4<span class="vq-stat__unit">%</span></span>
          </div>
          <div class="vq-row vq-gap-2">
            <span class="vq-delta vq-delta--down">▼ 1.1pt</span>
            <span class="vq-stat__note">vs last month</span>
          </div>
        </div>

        <div class="vq-dcard c3 r2">
          <div class="vq-dcard__head"><span class="vq-dcard__title">Expiring ≤30 days</span></div>
          <div class="vq-stat">
            <span class="vq-stat__value vq-stat__value--sm">27<span class="vq-stat__unit">batches</span></span>
          </div>
          <span class="vq-status vq-status--warn">${icon('clock', 11)} Review</span>
        </div>

        <div class="vq-dcard c7 r3">
          <div class="vq-dcard__head">
            <span class="vq-dcard__title">Sales, last 14 days</span>
            <span class="vq-badge">Branch: all</span>
          </div>
          <div style="margin-top:auto">${spark([31, 34, 30, 38, 41, 37, 44, 42, 48, 46, 52, 49, 57, 61], 320, 108)}</div>
        </div>

        <div class="vq-dcard c5 r3">
          <div class="vq-dcard__head"><span class="vq-dcard__title">Top lines by margin</span></div>
          <div class="vq-mt-4">${rank([
            ['Panadol 500mg', '41.2%', 92],
            ['Augmentin 625', '33.8%', 76],
            ['Surgical masks', '28.1%', 63],
            ['Glucose strips', '19.4%', 44],
          ])}</div>
        </div>

        <div class="vq-dcard c4 r2">
          <div class="vq-dcard__head"><span class="vq-dcard__title">Cash vs card</span></div>
          <div style="margin-top:auto">${bars([42, 51, 38, 60, 47, 66, 58], 5, ['M', 'T', 'W', 'T', 'F', 'S', 'S'], 78)}</div>
        </div>

        <div class="vq-dcard c4 r2">
          <div class="vq-dcard__head"><span class="vq-dcard__title">Owed to you</span></div>
          <div class="vq-stat">
            <span class="vq-stat__value vq-stat__value--sm">612<span class="vq-stat__unit">k</span></span>
            <span class="vq-stat__note">Rs 84k over 60 days</span>
          </div>
        </div>

        <div class="vq-dcard c4 r2">
          <div class="vq-dcard__head"><span class="vq-dcard__title">You owe</span></div>
          <div class="vq-stat">
            <span class="vq-stat__value vq-stat__value--sm">(438)<span class="vq-stat__unit">k</span></span>
            <span class="vq-stat__note">4 distributors · next due Fri</span>
          </div>
        </div>

      </div>
    </div>
  </div>
</div>`;

/* ── The Blueprint console ────────────────────────────────────────────── */
export const blueprintConsole = () => `
<div class="vq-bp" data-bp>
  <div class="vq-bp__bar">
    <span class="vq-eyebrow" style="flex:none">Try one</span>
    <div class="vq-bp__tabs" role="tablist">
      <button class="vq-bp__tab" role="tab" data-bp-key="pharmacy"  aria-selected="true">Pharmacy</button>
      <button class="vq-bp__tab" role="tab" data-bp-key="wholesale" aria-selected="false">Wholesale</button>
      <button class="vq-bp__tab" role="tab" data-bp-key="cafe"      aria-selected="false">Café</button>
      <button class="vq-bp__tab" role="tab" data-bp-key="hardware"  aria-selected="false">Hardware store</button>
      <button class="vq-bp__tab" role="tab" data-bp-key="multi"     aria-selected="false">Multi-branch</button>
    </div>
  </div>
  <div class="vq-bp__body">
    <div class="vq-bp__in">
      <span class="vq-eyebrow">What the owner typed</span>
      <div class="vq-bp__prompt vq-mt-3" data-bp-prompt></div>
      <div class="vq-steps" data-bp-steps></div>
      <p class="vq-caption" style="margin-top:auto;padding-top:var(--vq-space-6);max-width:none">
        Blueprint cannot post a transaction. It cannot alter the accounting engine. It cannot
        change historical data. <b style="color:var(--vq-text-2)">It builds the room; it doesn't touch the safe.</b>
      </p>
    </div>
    <div class="vq-bp__out">
      <div class="vq-bp__result" data-bp-result></div>
    </div>
  </div>
</div>`;

export { spark, bars, rank };

/* ── Inner-page head ──────────────────────────────────────────────────────
   Public pages may be expressive (§14), but only the landing page gets the
   full-bleed hero. Inner pages get a light head with one ambient layer. */
export const pageHead = ({ eyebrow, h1, lede, cta, amb = 'aurora' }) => `
<section class="vq-section" style="padding-top:clamp(140px,15vw,200px);padding-bottom:clamp(48px,6vw,72px)">
  <div class="vq-amb">${amb === 'aurora' ? '<span class="vq-amb__aurora" style="opacity:.30"></span>'
    : amb === 'dots' ? '<span class="vq-amb__dots"></span>'
    : amb === 'grid' ? '<span class="vq-amb__grid"></span>' : ''}</div>
  <div class="vq-container" style="position:relative">
    <div style="max-width:820px">
      ${eyebrow ? `<span class="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">${eyebrow}</span>` : ''}
      <h1 class="vq-display vq-mt-4">${h1}</h1>
      ${lede ? `<p class="vq-lede vq-mt-6">${lede}</p>` : ''}
      ${cta ? `<div class="vq-row vq-wrap vq-gap-3 vq-mt-8">${cta}</div>` : ''}
    </div>
  </div>
</section>`;
