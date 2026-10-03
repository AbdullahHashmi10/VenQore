import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

import CardChart from './CardChart';
import { useReducedMotion } from '../charts/kit';

/* ══════════════════════════════════════════════════════════════════════════
   The bridge between the board engine (which paints card frames as HTML) and
   the React chart layer.

   The engine hands us a host element and the card's resolved props. We keep
   one React root per host, re-render it in place when props change, and
   measure the host ourselves — so resizing a card re-lays the plot without
   replaying its entry animation. Roots whose host has been removed from the
   document (the engine repaints the board wholesale) are swept and unmounted.
   ══════════════════════════════════════════════════════════════════════════ */

const ROOTS = new Map();          // host element → root
const PLAYED = new Map();         // card id → signature whose entry already played
let sweepTimer = null;

function sweep() {
  sweepTimer = null;
  for (const [host, root] of ROOTS) {
    if (!host.isConnected) {
      ROOTS.delete(host);
      try { root.unmount(); } catch { /* already gone */ }
    }
  }
}

function scheduleSweep() {
  if (sweepTimer) return;
  sweepTimer = setTimeout(sweep, 0);
}

/** Should this render play the entry animation? Once per card look. */
function shouldEnter(card, primaryState) {
  if (primaryState !== 'ready' || card.motion === false) return false;
  const sig = `${card.family}|${card.variant}|${card.period || ''}|${card.dataSig || ''}`;
  const id = card.id || 'anon';
  if (PLAYED.get(id) === sig) return false;
  PLAYED.set(id, sig);
  return true;
}

function Hosted({ host, card, series, currency, enter }) {
  const reduced = useReducedMotion();
  const [box, setBox] = useState(() => ({ w: host.clientWidth, h: host.clientHeight }));
  const enterRef = useRef(enter);
  if (enter) enterRef.current = true;

  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return undefined;
    let raf = 0;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const w = host.clientWidth, h = host.clientHeight;
        setBox(b => (Math.abs(b.w - w) < 1 && Math.abs(b.h - h) < 1 ? b : { w, h }));
      });
    });
    ro.observe(host);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [host]);

  /* Entry plays on the first ready paint only; later re-renders keep the
     plot still (data refreshes tween, they do not redraw from zero). */
  const playEnter = enterRef.current;
  useEffect(() => { enterRef.current = false; });

  return (
    <div className="vqcc-root" data-family={card.family}>
      <CardChart card={card} series={series} width={box.w} height={box.h}
        enter={playEnter} reduced={reduced} currency={currency} />
    </div>
  );
}

/**
 * Mount (or update) the chart for one card into `host`.
 * props: { card: {id, family, variant, legend, goal, link, period, dataSig},
 *          series: [{env, label, key}], currency }
 */
export function mountCardChart(host, props) {
  if (!host) return;
  let root = ROOTS.get(host);
  if (!root) {
    host.innerHTML = '';
    root = createRoot(host);
    ROOTS.set(host, root);
  }
  const enter = shouldEnter(props.card, props.series?.[0]?.env?.state);
  root.render(<Hosted host={host} card={props.card} series={props.series}
    currency={props.currency || 'Rs'} enter={enter} />);
  scheduleSweep();
}

/** Forget a card's played animation (e.g. the editor's throwaway preview). */
export function resetCardAnimation(id) { PLAYED.delete(id); }

/** A card got its server id — carry its "already animated" mark across. */
export function renameCardAnimation(from, to) {
  if (!PLAYED.has(from)) return;
  PLAYED.set(to, PLAYED.get(from));
  PLAYED.delete(from);
}

/** Unmount every chart root inside a container (or everywhere). */
export function unmountCardCharts(container) {
  for (const [host, root] of ROOTS) {
    if (!container || container.contains(host) || !host.isConnected) {
      ROOTS.delete(host);
      try { root.unmount(); } catch { /* ignore */ }
    }
  }
}

/** Is this host already owned by a chart root? */
export function hasCardChart(host) { return ROOTS.has(host); }
