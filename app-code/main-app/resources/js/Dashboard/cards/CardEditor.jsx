import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import * as Fam from './families';
import * as Geo from './geometry';
import FamilyGlyph, { SpanGlyph } from './FamilyGlyph';
import { formatValue } from './envelope';
import './card-editor.css';

/* ══════════════════════════════════════════════════════════════════════════
   The card editor — a nearly full-screen modal with a controls pane and a
   live preview of the real card.

   The preview is not a mock: it is painted by the board engine's own
   renderCard + mountChart at the board's real column width, then scaled to
   fit the stage. What you see here is exactly what lands on the dashboard.

   Everything is a draft until Save. Cancel, Escape and the backdrop discard
   it (after asking, if something changed).
   ══════════════════════════════════════════════════════════════════════════ */

const PERIODS = ['Today', 'Week', 'Month', 'Quarter', 'Year'];
const TABS = [
  { id: 'look', label: 'Look', hint: 'Pick the chart and size' },
  { id: 'data', label: 'Data', hint: 'Period, comparison, goal' },
  { id: 'card', label: 'Finish', hint: 'Background and extras' },
];

const clone = (o) => JSON.parse(JSON.stringify(o || {}));

export default function CardEditor({
  engine, mode = 'reading', initial, isNew, targetSlot, catalog = {}, onSave, onCancel, onDirtyChange,
}) {
  const initialRef = useRef(clone(initial));
  const [draft, setDraft] = useState(() => clone(initial));
  const [tab, setTab] = useState('look');
  const [zoom, setZoom] = useState('fit');
  const [pane, setPane] = useState('controls');       /* small screens: controls | preview */
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);                /* bumps when new readings land */
  const [goalText, setGoalText] = useState(initial?.goal?.target ? String(initial.goal.target) : '');
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');

  const patch = useCallback((p) => setDraft(d => ({ ...d, ...p })), []);
  const isReading = mode === 'reading';
  const isShortcut = mode === 'shortcut';

  /* ── derived ─────────────────────────────────────────────────────────── */
  const reading = isReading ? engine.getReadingOf(draft.key) : null;
  const card = useMemo(() => {
    const c = clone(draft);
    c.id = draft.id || 'preview-card';
    return engine.normalise ? engine.normalise(c) : c;
  }, [draft, engine]);
  const caps = useMemo(() => (isReading ? engine.capabilitiesFor(card) : []), [isReading, card, engine]);
  const cap = caps.find(c => c.family === card.chart);

  const dirty = JSON.stringify(stripVolatile(draft)) !== JSON.stringify(stripVolatile(initialRef.current));
  useEffect(() => { onDirtyChange?.(dirty); }, [dirty, onDirtyChange]);

  /* goal: typed text → validated number */
  const goalNum = goalText.trim() === '' ? null : Number(goalText.replace(/,/g, ''));
  const goalError = goalText.trim() !== '' && !(Number.isFinite(goalNum) && goalNum > 0)
    ? 'Enter a positive number.' : '';
  useEffect(() => {
    if (!isReading) return;
    if (goalError) return;
    const cur = draft.goal?.target ?? null;
    if (goalNum !== cur) patch({ goal: goalNum ? { target: goalNum } : undefined });
  }, [goalNum, goalError]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── live data for the preview ───────────────────────────────────────── */
  useEffect(() => {
    const on = () => setTick(t => t + 1);
    window.addEventListener('vq:readings-updated', on);
    return () => window.removeEventListener('vq:readings-updated', on);
  }, []);
  const readSig = isReading ? `${card.key}|${card.period}|${card.chart}|${(card.extraKeys || []).join(',')}` : '';
  useEffect(() => {
    if (!isReading) return;
    engine.queueReads?.([card]);
  }, [readSig]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── geometry on the real board ──────────────────────────────────────── */
  const cols = engine.boardCols ? engine.boardCols() : 12;
  const colW = engine.boardColW ? engine.boardColW() : 112;
  const geo = engine.geometryOf(card, cols, colW);
  const cardPx = { w: Math.round(Geo.colsToPx(geo.w, colW)), h: Geo.rowsToPx(geo.h) };
  const minWH = engine.minSizeFor(card);

  /* ── the preview ─────────────────────────────────────────────────────── */
  const stageRef = useRef(null);
  const hostRef = useRef(null);
  const handleRef = useRef(null);
  const [stage, setStage] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(() => setStage({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setStage({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, [pane]);

  const PAD = 28;
  const scale = zoom === 'actual' || !stage.w
    ? 1
    : Math.min(1, (stage.w - PAD * 2) / cardPx.w, (stage.h - PAD * 2) / cardPx.h);
  const scaleRef = useRef(scale);
  scaleRef.current = scale;

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    host.style.width = `${Math.round(cardPx.w * scale)}px`;
    host.style.height = `${Math.round(cardPx.h * scale)}px`;
    let scaler = host.firstElementChild;
    if (!scaler || !scaler.classList.contains('vqe-scaler')) {
      host.innerHTML = '<div class="vqe-scaler"></div>';
      scaler = host.firstElementChild;
    }
    scaler.style.width = `${cardPx.w}px`;
    scaler.style.height = `${cardPx.h}px`;
    scaler.style.transform = `scale(${scale})`;
    scaler.innerHTML = engine.renderCard(card, cols, colW);
    const el = scaler.querySelector('.vqc');
    if (el) {
      Object.assign(el.style, { width: '100%', height: '100%', gridColumn: 'auto', gridRow: 'auto', animation: 'none' });
      el.querySelectorAll('.vqc-resize, .vqc-tools').forEach(n => n.remove());
    }
    const chartHost = scaler.querySelector('.vqc-host');
    if (chartHost) engine.mountChart(chartHost, card);
    engine.fitValues?.(scaler);
  }, [card, cols, colW, cardPx.w, cardPx.h, scale, tick, engine]);

  /* ── resizing: drag the corner, or use the keyboard on it ────────────── */
  const clampSpan = useCallback((w, h) => {
    const [mw, mh] = minWH;
    return {
      w: Math.max(mw, Math.min(Geo.GRID.cols, w)),
      h: Math.max(mh, Math.min(Geo.GRID.maxRows, h)),
    };
  }, [minWH]);

  const applySpan = useCallback((w, h) => {
    if (isReading) {
      const s = clampSpan(w, h);
      patch({ w: s.w, h: s.h, full: s.w >= Geo.GRID.cols ? draft.full : false });
      return;
    }
    const chip = nearestLegalChip(engine, card, mode, w, h);
    if (chip) patch({ cat: chip.cat, w: chip.w, h: chip.h });
  }, [isReading, clampSpan, patch, engine, card, mode, draft.full]);

  const dragRef = useRef(null);
  const onHandleDown = (e) => {
    e.preventDefault(); e.stopPropagation();
    const handle = e.currentTarget;
    handle.setPointerCapture?.(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, w: geo.authoredW ?? geo.w, h: geo.authoredH ?? geo.h, id: e.pointerId };
    document.body.classList.add('is-reordering');
  };
  const onHandleMove = (e) => {
    const st = dragRef.current; if (!st || st.id !== e.pointerId) return;
    const next = Geo.snapDrag(st, e.clientX - st.x, e.clientY - st.y, scaleRef.current, colW);
    applySpan(next.w, next.h);
  };
  const endDrag = (e) => {
    if (!dragRef.current) return;
    dragRef.current = null;
    try { e.currentTarget.releasePointerCapture?.(e.pointerId); } catch { /* not captured */ }
    document.body.classList.remove('is-reordering');
  };
  const onHandleKey = (e) => {
    const step = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] }[e.key];
    if (!step) return;
    e.preventDefault();
    applySpan((geo.authoredW ?? geo.w) + step[0], (geo.authoredH ?? geo.h) + step[1]);
  };
  useEffect(() => () => document.body.classList.remove('is-reordering'), []);

  /* ── closing ─────────────────────────────────────────────────────────── */
  const requestClose = useCallback(() => {
    if (saving) return;
    if (dirty && !window.confirm('Discard your changes to this card?')) return;
    onCancel();
  }, [dirty, saving, onCancel]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); requestClose(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [requestClose]);

  const rootRef = useRef(null);
  const stepIndex = Math.max(0, TABS.findIndex(t => t.id === tab));
  const goStep = (i) => { setTab(TABS[Math.max(0, Math.min(TABS.length - 1, i))].id); setPane('controls'); };
  useEffect(() => { rootRef.current?.querySelector('.vqe-step.is-on button')?.focus(); }, []);

  /* ── saving ──────────────────────────────────────────────────────────── */
  const save = async () => {
    if (saving || goalError) return;
    setSaving(true); setError('');
    try {
      const out = clone(draft);
      if (!out.goal || !(Number(out.goal.target) > 0)) out.goal = undefined;
      if (isReading && (!out.title || out.title.trim() === '' || out.title === reading?.label)) out.title = undefined;
      await onSave(out);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || 'The server did not accept the change.';
      setError(`Saved on this device, but not to your account yet — ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  /* ── family & variant ────────────────────────────────────────────────── */
  const chooseFamily = (fc) => {
    if (!fc.enabled) { setNotice(fc.reason); return; }
    setNotice('');
    const keep = fc.variants.find(v => v.id === draft.variant && v.enabled);
    const first = fc.variants.find(v => v.enabled) || fc.variants[0];
    const variant = keep ? keep.id : first.id;
    const [mw, mh] = Geo.minSize(fc.family, variant, { legend: draft.legend !== false, seriesCount: 1 + (draft.extraKeys || []).length });
    const w = geo.authoredW ?? geo.w, h = geo.authoredH ?? geo.h;
    if (w < mw || h < mh) setNotice(`Made the card ${Math.max(w, mw)} × ${Math.max(h, mh)} — the smallest size a ${fc.label.toLowerCase()} reads well at.`);
    const extraKeys = ['area', 'line', 'composed'].includes(fc.family) ? (draft.extraKeys || []) : [];
    if ((draft.extraKeys || []).length && !extraKeys.length) setNotice('Compared readings were set aside — this chart shows one reading.');
    patch({ chart: fc.family, variant, w: Math.max(w, mw), h: Math.max(h, mh), extraKeys });
  };

  /* ── renders ─────────────────────────────────────────────────────────── */
  const tones = catalog.tones || [];
  const destLabel = engine.destinationName?.(card.targetUrl || card.link || (isReading ? engine.deepLinkFor(card.key) : '')) || '';
  const title = isReading ? (draft.title || reading?.label) : (draft.title || catalog.templateName || 'Card');
  const eyebrow = isReading ? 'Metric & chart' : isShortcut ? 'Shortcut' : 'Smart panel';
  const scalePct = Math.round(scale * 100);

  return (
    <div className="vqe" ref={rootRef}>
      <header className="vqe-top">
        <div className="vqe-top-title">
          <span className="vqe-eyebrow">{isNew ? 'Add a card' : 'Edit card'} · {eyebrow}</span>
          <h2 className="vqe-heading" id="vqe-heading">{title}</h2>
        </div>
        <div className="vqe-pane-switch" role="tablist" aria-label="Show">
          <button type="button" className={pane === 'controls' ? 'is-on' : ''} onClick={() => setPane('controls')}>Settings</button>
          <button type="button" className={pane === 'preview' ? 'is-on' : ''} onClick={() => setPane('preview')}>Preview</button>
        </div>
        <button type="button" className="vqe-x" onClick={requestClose} aria-label="Close editor">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
        </button>
      </header>

      <ol className="vqe-steps" aria-label="Steps">
        {TABS.map((t, i) => {
          const at = TABS.findIndex(x => x.id === tab);
          const state = i === at ? 'is-on' : i < at ? 'is-done' : '';
          return (
            <li key={t.id} className={`vqe-step ${state}`}>
              <button type="button" aria-current={i === at ? 'step' : undefined}
                onClick={() => { setTab(t.id); setPane('controls'); }}>
                <span className="vqe-step-n" aria-hidden="true">
                  {i < at
                    ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5 9-10" /></svg>
                    : i + 1}
                </span>
                <span className="vqe-step-text"><b>{t.label}</b><small>{t.hint}</small></span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className={`vqe-body is-${pane}`}>
        <aside className="vqe-controls" aria-labelledby="vqe-heading">
          <div className="vqe-identity">
            <span className="vqe-identity-eyebrow">{eyebrow}</span>
            <span className="vqe-identity-name">{isReading ? reading?.label : title}</span>
            {isReading && reading?.desc ? <span className="vqe-identity-desc">{reading.desc}</span> : null}
            {!isReading && catalog.templateDesc ? <span className="vqe-identity-desc">{catalog.templateDesc}</span> : null}
            {destLabel ? <span className="vqe-identity-opens">Opens {destLabel}</span> : null}
          </div>

          {notice && <p className="vqe-notice" role="status">{notice}</p>}

          {tab === 'look' && isReading && (
            <>
              <Section title="Chart" sub="Only what this reading can honestly show">
                <div className="vqe-family-grid" role="radiogroup" aria-label="Chart type">
                  {caps.map(fc => (
                    <button key={fc.family} type="button" role="radio" aria-checked={card.chart === fc.family}
                      aria-disabled={!fc.enabled}
                      className={`vqe-family ${card.chart === fc.family ? 'is-on' : ''} ${fc.enabled ? '' : 'is-off'}`}
                      title={fc.enabled ? fc.blurb : fc.reason}
                      onClick={() => chooseFamily(fc)}>
                      <FamilyGlyph family={fc.family} />
                      <span className="vqe-family-name">{fc.label}</span>
                      <span className="vqe-family-blurb">{fc.enabled ? fc.blurb : 'Not for this data'}</span>
                    </button>
                  ))}
                </div>
              </Section>

              {cap && cap.variants.length > 1 && (
                <Section title="Style" sub={cap.label}>
                  <div className="vqe-pills" role="radiogroup" aria-label="Style">
                    {cap.variants.map(v => (
                      <button key={v.id} type="button" role="radio" aria-checked={card.variant === v.id}
                        aria-disabled={!v.enabled} title={v.enabled ? '' : v.reason}
                        className={`vqe-pill ${card.variant === v.id ? 'is-on' : ''} ${v.enabled ? '' : 'is-off'}`}
                        onClick={() => { if (!v.enabled) { setNotice(v.reason); return; } setNotice(''); patch({ variant: v.id }); }}>
                        {v.label}
                      </button>
                    ))}
                  </div>
                </Section>
              )}

              <SizeSection engine={engine} card={card} geo={geo} minWH={minWH} cols={cols}
                onPick={(p) => patch({ w: p.w, h: p.h, full: !!p.full })}
                onStep={(dw, dh) => applySpan((geo.authoredW ?? geo.w) + dw, (geo.authoredH ?? geo.h) + dh)} />
            </>
          )}

          {tab === 'look' && !isReading && (
            <>
              <LegacySizeSection engine={engine} card={card} mode={mode}
                onPick={(c) => patch({ cat: c.cat, w: c.w, h: c.h })} />
              {isShortcut && <ShortcutSection catalog={catalog} engine={engine} draft={draft} patch={patch} />}
            </>
          )}

          {tab === 'data' && isReading && (
            <>
              <QuickCompare engine={engine} card={card}
                onPick={(p) => {
                  const fam = Fam.FAMILIES.composed;
                  const variant = (fam.variants.find(v => v.enabled !== false) || fam.variants[0]).id;
                  const [mw, mh] = Geo.minSize('composed', variant, { legend: true, seriesCount: 2 });
                  const w = geo.authoredW ?? geo.w, h = geo.authoredH ?? geo.h;
                  setNotice(`Comparing ${p.label.toLowerCase()} — drawn as bars and a line.`);
                  patch({ key: p.a, extraKeys: [p.b], chart: 'composed', variant, title: undefined,
                          w: Math.max(w, mw), h: Math.max(h, mh), goal: undefined });
                }} />

              <Section title="Timeframe" sub="What the card reads when it loads">
                <div className="vqe-pills">
                  {PERIODS.map(p => (
                    <button key={p} type="button" className={`vqe-pill ${card.period === p ? 'is-on' : ''}`}
                      aria-pressed={card.period === p} onClick={() => patch({ period: p })}>{p}</button>
                  ))}
                </div>
              </Section>

              <GoalSection reading={reading} card={card} goalText={goalText} setGoalText={setGoalText}
                goalError={goalError} currency={engine.getCurrency?.() || 'Rs'} />

              {['area', 'line', 'composed'].includes(card.chart) && (
                <CompareSection engine={engine} card={card} reading={reading} query={query} setQuery={setQuery}
                  onAdd={(k) => patch({ extraKeys: [...(draft.extraKeys || []), k].slice(0, 3) })}
                  onRemove={(k) => patch({ extraKeys: (draft.extraKeys || []).filter(x => x !== k) })} />
              )}

              <Section title="Name on the card" sub="Leave empty to use the reading's own name">
                <input className="vqe-input" type="text" maxLength={80} value={draft.title || ''}
                  placeholder={reading?.label || ''} onChange={(e) => patch({ title: e.target.value })} />
              </Section>
            </>
          )}

          {tab === 'data' && !isReading && (
            <p className="vqe-note">This card shows live figures from {catalog.templateName || 'your store'} — there is nothing to configure here.</p>
          )}

          {tab === 'card' && (
            <>
              <Section title="Background" sub="Readable on light and dark pages">
                <div className="vqe-tones">
                  {tones.map(t => (
                    <button key={t.id} type="button" className={`vqe-tone ${(card.tone || 'surface') === t.id ? 'is-on' : ''}`}
                      aria-pressed={(card.tone || 'surface') === t.id}
                      onClick={() => patch({ tone: t.id, accent: t.id === 'accent' })}>
                      <span className="vqe-tone-swatch" style={{ background: t.swatchBg }} />
                      <span className="vqe-tone-text"><b>{t.name}</b><small>{t.desc}</small></span>
                    </button>
                  ))}
                </div>
              </Section>
              <Section title="On the card" sub="Hidden automatically when the card is too small">
                <div className="vqe-switches">
                  <Switch on={card.showOpenArrow !== false} set={(v) => patch({ showOpenArrow: v })}
                    title="Open arrow" sub={destLabel ? `Jumps to ${destLabel}` : 'Opens the related page'} />
                  {isReading && !Fam.SELF_LABELLED.has(card.chart) && (
                    <Switch on={card.showDelta !== false} set={(v) => patch({ showDelta: v })}
                      title="Change vs last period" sub="Derived from the real previous period"
                      hint={geo.w < 2 ? 'Needs 2 columns' : ''} />
                  )}
                  {isReading && !Fam.SELF_LABELLED.has(card.chart) && (
                    <Switch on={card.showWhen !== false} set={(v) => patch({ showWhen: v })}
                      title="Date range caption" sub="The dates the number covers"
                      hint={geo.h < (card.chart === 'number' ? 3 : 4) ? `Needs ${card.chart === 'number' ? 3 : 4} rows` : ''} />
                  )}
                  {isReading && (
                    <Switch on={card.showPeriodPicker !== false} set={(v) => patch({ showPeriodPicker: v })}
                      title="Timeframe picker" sub="Change Today / Week / Month from the card"
                      hint={geo.w < 3 || geo.h < 2 ? 'Needs 3 × 2' : ''} />
                  )}
                  {isReading && engine.capCtx(card).recentKey && card.chart !== 'records' && (
                    <Switch on={card.showRecent !== false} set={(v) => patch({ showRecent: v })}
                      title="Latest entries" sub="List the newest items under the chart"
                      hint={geo.h < 5 ? 'Needs 5 rows' : ''} />
                  )}
                  {isReading && ['pie', 'ring', 'area', 'line', 'composed'].includes(card.chart) && (
                    <Switch on={card.legend !== false} set={(v) => patch({ legend: v })}
                      title="Legend" sub="Names and values beside the chart" />
                  )}
                  {isReading && (
                    <Switch on={card.motion !== false} set={(v) => patch({ motion: v })}
                      title="Animate when it loads" sub="Always off if your device asks for reduced motion" />
                  )}
                </div>
              </Section>
            </>
          )}
        </aside>

        <section className="vqe-stage" aria-label="Live preview">
          <div className="vqe-stage-bar">
            <span className="vqe-stage-title">Live preview</span>
            <span className="vqe-stage-meta">
              {geo.w} × {geo.h}{geo.full ? ' · full width' : ''} · {cardPx.w} × {cardPx.h}px{scalePct !== 100 ? ` · shown at ${scalePct}%` : ''}
            </span>
            <span className="vqe-zoom" role="group" aria-label="Zoom">
              <button type="button" className={zoom === 'fit' ? 'is-on' : ''} aria-pressed={zoom === 'fit'} onClick={() => setZoom('fit')}>Fit</button>
              <button type="button" className={zoom === 'actual' ? 'is-on' : ''} aria-pressed={zoom === 'actual'} onClick={() => setZoom('actual')}>100%</button>
            </span>
          </div>
          <div className={`vqe-canvas ${zoom === 'actual' ? 'is-actual' : ''}`} ref={stageRef}
            style={{
              '--vqe-col': `${(colW + Geo.GRID.gutter) * scale}px`,
              '--vqe-row': `${(Geo.GRID.unit + Geo.GRID.gutter) * scale}px`,
            }}>
            <div className="vqe-card-wrap" style={{ padding: PAD }}>
              <div className="vqe-card-host" ref={hostRef} />
              <button type="button" ref={handleRef} className="vqe-handle"
                style={{ left: PAD + Math.round(cardPx.w * scale) - 11, top: PAD + Math.round(cardPx.h * scale) - 11 }}
                aria-label={`Resize card, now ${geo.w} columns by ${geo.h} rows. Use arrow keys to change.`}
                title="Drag to resize · arrow keys work too"
                onPointerDown={onHandleDown} onPointerMove={onHandleMove}
                onPointerUp={endDrag} onPointerCancel={endDrag} onLostPointerCapture={endDrag}
                onKeyDown={onHandleKey} />
            </div>
          </div>
          <p className="vqe-stage-foot">
            {geo.reason || (geo.clamped ? 'Narrowed to fit this screen; it returns to its full width on a wider one.' : 'Drag the corner to resize — it snaps to whole columns and rows.')}
          </p>
        </section>
      </div>

      <footer className="vqe-foot">
        <span className={`vqe-foot-status ${error ? 'is-error' : ''}`} role={error ? 'alert' : 'status'}>
          {error || (saving ? 'Saving…' : dirty ? 'Unsaved changes' : '')}
        </span>
        <div className="vqe-foot-actions">
          <button type="button" className="vqe-btn" onClick={requestClose} disabled={saving}>Cancel</button>
          {stepIndex > 0 && (
            <button type="button" className="vqe-btn" onClick={() => goStep(stepIndex - 1)} disabled={saving}>Back</button>
          )}
          {stepIndex < TABS.length - 1 && (
            <button type="button" className={`vqe-btn ${isNew ? 'is-primary' : ''}`} onClick={() => goStep(stepIndex + 1)} disabled={saving}>
              Next: {TABS[stepIndex + 1].label}
            </button>
          )}
          {(stepIndex === TABS.length - 1 || !isNew) && (
            <button type="button" className="vqe-btn is-primary" onClick={save} disabled={saving || !!goalError}>
              {saving ? 'Saving…' : error ? 'Retry save' : isNew ? 'Add to dashboard' : 'Save changes'}
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}

function stripVolatile(c) {
  const { id, ...rest } = c || {};
  return rest;
}

/* ── pieces ──────────────────────────────────────────────────────────────── */

function Section({ title, sub, children }) {
  return (
    <section className="vqe-section">
      <header className="vqe-section-head">
        <h3>{title}</h3>
        {sub ? <span>{sub}</span> : null}
      </header>
      {children}
    </section>
  );
}

function Switch({ on, set, title, sub, hint }) {
  return (
    <button type="button" role="switch" aria-checked={on} className="vqe-switch" onClick={() => set(!on)}>
      <span className="vqe-switch-text">
        <b>{title}</b>
        <small>{sub}</small>
        {hint && on ? <em>{hint} — hidden at this size</em> : null}
      </span>
      <span className={`vqe-switch-track ${on ? 'is-on' : ''}`}><i /></span>
    </button>
  );
}

function Stepper({ label, value, min, max, onStep }) {
  return (
    <div className="vqe-stepper">
      <span className="vqe-stepper-label">{label}</span>
      <span className="vqe-stepper-ctl">
        <button type="button" aria-label={`Fewer ${label.toLowerCase()}`} disabled={value <= min} onClick={() => onStep(-1)}>−</button>
        <output aria-live="polite">{value}</output>
        <button type="button" aria-label={`More ${label.toLowerCase()}`} disabled={value >= max} onClick={() => onStep(1)}>+</button>
      </span>
    </div>
  );
}

function SizeSection({ card, geo, minWH, cols, onPick, onStep }) {
  const opts = { legend: card.legend !== false, seriesCount: 1 + (card.extraKeys || []).length };
  const aw = geo.authoredW ?? geo.w, ah = geo.authoredH ?? geo.h;
  return (
    <Section title="Size" sub={`Smallest readable: ${minWH[0]} × ${minWH[1]}`}>
      <div className="vqe-sizes">
        {Geo.SIZE_PRESETS.map(p => {
          const st = Geo.presetState(p, card.chart, card.variant, opts);
          const on = p.full ? !!card.full : (!card.full && aw === p.w && ah === p.h);
          return (
            <button key={p.id} type="button" className={`vqe-size ${on ? 'is-on' : ''} ${st.enabled ? '' : 'is-off'}`}
              aria-pressed={on} aria-disabled={!st.enabled} title={st.enabled ? p.hint : st.reason}
              onClick={() => st.enabled && onPick(p)}>
              <SpanGlyph w={p.w} h={p.h} full={p.full} />
              <span className="vqe-size-text">
                <b>{p.label}</b>
                <small>{p.full ? `12 × ${p.h}` : `${p.w} × ${p.h}`} · {st.enabled ? p.hint : 'Too small'}</small>
              </span>
            </button>
          );
        })}
      </div>
      <div className="vqe-custom">
        <Stepper label="Columns" value={card.full ? Geo.GRID.cols : aw} min={minWH[0]} max={Geo.GRID.cols} onStep={(d) => onStep(d, 0)} />
        <Stepper label="Rows" value={ah} min={minWH[1]} max={Geo.GRID.maxRows} onStep={(d) => onStep(0, d)} />
        <span className="vqe-custom-readout">
          {Geo.spanName(aw, ah, card.full)}
          {cols < Geo.GRID.cols ? <em>{cols}-column screen</em> : null}
        </span>
      </div>
    </Section>
  );
}

/** Hubs and shortcuts keep their category ladder — offered as named sizes. */
function legacyChips(engine, card, mode) {
  if (mode === 'shortcut') {
    return [
      { cat: 'C1', w: 1, h: 1, label: 'Icon only', hint: 'Glyph; the name shows on hover' },
      { cat: 'C1', w: 2, h: 1, label: 'Standard', hint: 'Icon and name' },
      { cat: 'C1', w: 3, h: 2, label: 'Roomy', hint: 'Icon, name and destination' },
    ];
  }
  const names = { C3: 'Compact', C4: 'Standard', C5: 'Large', C6: 'Extra large' };
  const hints = { C3: 'Just the essentials', C4: 'Room for its buttons', C5: 'Spacious', C6: 'The whole width' };
  const out = [];
  let cats = [];
  try { cats = engine.catsFor(card); } catch { cats = []; }
  cats.forEach(cat => {
    try {
      const probe = { ...card, cat };
      const T = engine.fitsTable(probe);
      const floor = engine.minSizeFor(probe);
      engine.presetsFor(cat, T)
        .filter(s => s.w >= floor[0] && s.h >= floor[1])
        .slice(0, 3)
        .forEach((s, i) => out.push({ cat, w: s.w, h: s.h, label: i === 0 ? (names[cat] || cat) : `${names[cat] || cat} ${s.w}×${s.h}`, hint: hints[cat] || '' }));
    } catch { /* category not usable */ }
  });
  return out;
}

function nearestLegalChip(engine, card, mode, w, h) {
  const chips = legacyChips(engine, card, mode);
  let best = null, bestD = Infinity;
  chips.forEach(c => { const d = Math.abs(c.w - w) + Math.abs(c.h - h); if (d < bestD) { bestD = d; best = c; } });
  return best;
}

function LegacySizeSection({ engine, card, mode, onPick }) {
  const chips = legacyChips(engine, card, mode);
  return (
    <Section title="Size" sub="Or drag the corner of the preview">
      <div className="vqe-sizes">
        {chips.map(c => {
          const on = card.w === c.w && card.h === c.h;
          return (
            <button key={`${c.cat}-${c.w}x${c.h}`} type="button" className={`vqe-size ${on ? 'is-on' : ''}`}
              aria-pressed={on} onClick={() => onPick(c)}>
              <SpanGlyph w={c.w} h={c.h} />
              <span className="vqe-size-text"><b>{c.label}</b><small>{c.w} × {c.h} · {c.hint}</small></span>
            </button>
          );
        })}
      </div>
    </Section>
  );
}

function GoalSection({ reading, card, goalText, setGoalText, goalError, currency }) {
  const unit = reading?.unit || 'currency';
  const needs = ['ring', 'gauge'].includes(card.chart) || (card.chart === 'number' && card.variant === 'progress');
  const prefix = unit === 'currency' ? currency : '';
  const suffix = unit === 'percent' ? '%' : unit === 'count' ? '' : '';
  return (
    <Section title="Goal" sub={`For the ${String(card.period || 'Month').toLowerCase()} on this card`}>
      <div className={`vqe-goal ${goalError ? 'is-error' : ''}`}>
        {prefix ? <span className="vqe-goal-affix">{prefix}</span> : null}
        <input className="vqe-input" inputMode="decimal" aria-label="Goal" aria-invalid={!!goalError}
          placeholder={needs ? 'Required for this chart' : 'Optional'} value={goalText}
          onChange={(e) => setGoalText(e.target.value)} />
        {suffix ? <span className="vqe-goal-affix">{suffix}</span> : null}
        {goalText ? <button type="button" className="vqe-link" onClick={() => setGoalText('')}>Clear</button> : null}
      </div>
      <p className={`vqe-hint ${goalError ? 'is-error' : ''}`}>
        {goalError || (needs
          ? (unit === 'percent' && !goalText ? 'Percent readings use 100% as the scale until you set a goal.' : 'Rings, gauges and progress bars measure the reading against this goal.')
          : 'Set a goal to unlock the ring, gauge and progress views.')}
      </p>
    </Section>
  );
}

/* One-click comparisons people actually ask for. A pair is offered only when
   both readings exist for this store and both can draw a history. */
const COMPARE_PAIRS = [
  { label: 'Revenue vs Net profit',   a: 'core.revenue',        b: 'core.net_profit' },
  { label: 'Gross profit vs Net profit', a: 'core.gross_profit', b: 'core.net_profit' },
  { label: 'Revenue vs Expenses',     a: 'core.revenue',        b: 'core.expenses_total' },
  { label: 'Revenue vs Cost of goods', a: 'core.revenue',       b: 'core.cogs' },
  { label: 'Sales vs Purchases',      a: 'core.revenue',        b: 'purchases.spend' },
  { label: 'Money in vs Money out',   a: 'payments.received',   b: 'payments.paid' },
  { label: 'Online vs Counter sales', a: 'marketplace.online_revenue', b: 'pos.revenue' },
];

function QuickCompare({ engine, card, onPick }) {
  const keys = useMemo(() => new Set((engine.getAvailableReadings ? engine.getAvailableReadings() : [])
    .filter(r => r && r.contract_state !== 'unimplemented').map(r => r.key)), [engine]);
  const hasSeries = (k) => {
    const r = engine.getReadingOf?.(k);
    if (!r || !keys.has(k)) return false;
    return Fam.kindOf(r) === 'series' || !!engine.trendCompanionKey?.(k);
  };
  const pairs = COMPARE_PAIRS.filter(p => hasSeries(p.a) && hasSeries(p.b));
  if (!pairs.length) return null;
  const active = (p) => card.key === p.a && (card.extraKeys || [])[0] === p.b;
  return (
    <Section title="Compare two things" sub="One tap draws both as bars and a line">
      <div className="vqe-pairs">
        {pairs.map(p => (
          <button key={p.label} type="button" className={`vqe-pair ${active(p) ? 'is-on' : ''}`}
            aria-pressed={active(p)} onClick={() => onPick(p)}>{p.label}</button>
        ))}
      </div>
    </Section>
  );
}

function CompareSection({ engine, card, reading, query, setQuery, onAdd, onRemove }) {
  const all = engine.getAvailableReadings ? engine.getAvailableReadings() : [];
  const extra = card.extraKeys || [];
  const q = query.trim().toLowerCase();
  const candidates = useMemo(() => all.filter(r => {
    if (!r || r.key === card.key || extra.includes(r.key) || r.contract_state === 'unimplemented') return false;
    const kind = Fam.kindOf(r);
    const series = kind === 'series' || (kind === 'scalar' && engine.trendCompanionKey?.(r.key));
    return series && (r.unit || 'currency') === (reading?.unit || 'currency');
  }), [all, card.key, extra, reading, engine]);
  const hits = q ? candidates.filter(r => r.label.toLowerCase().includes(q) || r.key.includes(q)).slice(0, 6) : [];
  return (
    <Section title="Compare with" sub="Up to three readings in the same unit">
      {extra.length > 0 && (
        <div className="vqe-chips">
          {extra.map(k => (
            <span key={k} className="vqe-chip">
              {engine.getReadingOf(k)?.label || k}
              <button type="button" aria-label="Remove" onClick={() => onRemove(k)}>×</button>
            </span>
          ))}
        </div>
      )}
      {extra.length < 3 && (
        <div className="vqe-search">
          <input className="vqe-input" type="search" placeholder={candidates.length ? 'Search readings to compare…' : 'No other readings share this unit'}
            disabled={!candidates.length} value={query} onChange={(e) => setQuery(e.target.value)} />
          {hits.length > 0 && (
            <div className="vqe-suggest" role="listbox">
              {hits.map(r => (
                <button key={r.key} type="button" role="option" aria-selected="false" onClick={() => { onAdd(r.key); setQuery(''); }}>
                  <b>{r.label}</b><small>{r.area}</small>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </Section>
  );
}

function ShortcutSection({ catalog, engine, draft, patch }) {
  const targets = catalog.shortcutTargets || [];
  const colors = catalog.shortcutColors || [];
  const icons = catalog.shortcutIcons || [];
  const storePath = catalog.storePath || (p => p);
  return (
    <>
      <Section title="Where it goes" sub="The tile is named after its destination">
        {Object.entries(targets.reduce((m, t) => { (m[t.group || 'More'] ||= []).push(t); return m; }, {})).map(([group, list]) => (
          <div key={group} className="vqe-dest-group">
            <p className="vqe-dest-gt">{group}</p>
            <div className="vqe-dests">
              {list.map(t => {
                const url = t.absolute ? t.path : storePath(t.path);
                const on = draft.targetUrl === url;
                return (
                  <button key={t.path} type="button" className={`vqe-dest ${on ? 'is-on' : ''}`} aria-pressed={on}
                    onClick={() => patch({ targetUrl: url, title: t.label, icon: t.icon, btnColor: t.color })}>
                    <span className="vqe-dest-glyph" style={{ background: t.color }}
                      dangerouslySetInnerHTML={{ __html: engine.iconMarkup?.(t.icon, 15) || '' }} />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </Section>
      <Section title="Glyph">
        <div className="vqe-icons">
          {icons.map(n => (
            <button key={n} type="button" aria-label={n} aria-pressed={draft.icon === n}
              className={`vqe-icon ${draft.icon === n ? 'is-on' : ''}`} onClick={() => patch({ icon: n })}
              dangerouslySetInnerHTML={{ __html: engine.iconMarkup?.(n, 18) || '' }} />
          ))}
        </div>
      </Section>
      <Section title="Glyph colour">
        <div className="vqe-colors">
          {colors.map(col => (
            <button key={col} type="button" aria-label={col} aria-pressed={draft.btnColor === col}
              className={`vqe-color ${draft.btnColor === col ? 'is-on' : ''}`} style={{ background: col }}
              onClick={() => patch({ btnColor: col })} />
          ))}
        </div>
      </Section>
    </>
  );
}

export { formatValue };
