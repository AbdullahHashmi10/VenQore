/**
 * Pure functions extracted for unit testing and used by NewDashboard.jsx
 */

export function headlineOfPure(card, live, rd = {}) {
  if (live?.status === "unavailable") {
    return {
      value: "—",
      valueCompact: "—",
      dir: "up", pct: "",
      when: live.error?.message || "Not available yet",
    };
  }

  if (live && live.ok && (live.data !== undefined && live.data !== null || live.value !== undefined)) {
    let last = null;
    let prev = null;
    let hasDelta = false;

    if (typeof live.data === 'number') {
      last = live.data;
    } else if (typeof live.data === 'object' && live.data !== null) {
      if (live.data.value !== undefined && live.data.value !== null) {
        last = Number(live.data.value);
        if (live.data.previous !== undefined && live.data.previous !== null) {
          prev = Number(live.data.previous);
          hasDelta = true;
        }
      } else if (live.value !== undefined && live.value !== null) {
        last = Number(live.value);
      } else if (live.data.total !== undefined && live.data.total !== null) {
        last = Number(live.data.total);
      } else if (live.data.current !== undefined && live.data.current !== null) {
        last = Number(live.data.current);
        if (live.data.previous !== undefined && live.data.previous !== null) {
          prev = Number(live.data.previous);
          hasDelta = true;
        }
      } else if (Array.isArray(live.data.slices) && live.data.slices.length > 0) {
        last = live.data.slices.reduce((acc, x) => acc + (x.value !== undefined && x.value !== null ? Number(x.value) : 0), 0);
      } else {
        const seriesSource = live.data.series || live.data.points || live.series;
        if (Array.isArray(seriesSource) && seriesSource.length > 0) {
          const lastPt = seriesSource[seriesSource.length - 1];
          const rawVal = lastPt?.y ?? lastPt?.value ?? (typeof lastPt === 'number' ? lastPt : null);
          if (rawVal !== null && rawVal !== undefined) {
            last = Number(rawVal);
          }
          if (seriesSource.length > 1) {
            const prevPt = seriesSource[seriesSource.length - 2];
            const rawPrev = prevPt?.y ?? prevPt?.value ?? (typeof prevPt === 'number' ? prevPt : null);
            if (rawPrev !== null && rawPrev !== undefined) {
              prev = Number(rawPrev);
              hasDelta = true;
            }
          }
        }
      }
    } else if (typeof live.value === 'number') {
      last = live.value;
    }

    if (last === null || isNaN(last)) {
      return {
        value: "—",
        valueCompact: "—",
        dir: "up", pct: "",
        when: card.period || "Current period",
      };
    }

    let pctNum = null;
    if (hasDelta && prev !== null && !isNaN(prev) && prev !== 0) {
      pctNum = ((last - prev) / Math.abs(prev)) * 100;
    } else if (live.delta?.pct !== undefined && live.delta?.pct !== null) {
      pctNum = Number(live.delta.pct);
    } else if (live.data?.change_pct !== undefined && live.data?.change_pct !== null) {
      pctNum = Number(live.data.change_pct);
    }

    const dir = (pctNum === null || pctNum >= 0) ? "up" : "down";
    const pct = pctNum !== null && !isNaN(pctNum) ? (Math.abs(pctNum).toFixed(1) + "%") : "";
    const formatted = Number(last).toLocaleString('en-US');

    return {
      value: formatted,
      valueCompact: formatted,
      dir, pct,
      when: card.period || "Current period",
    };
  }

  return {
    value: "—",
    valueCompact: "—",
    dir: "up", pct: "",
    when: "No activity recorded",
  };
}

export function buildPartsPure(live, rd = {}) {
  if (live && live.ok && live.status !== "unavailable" && live.data) {
    const rawItems = live.data.slices || live.data.rows || (Array.isArray(live.data) ? live.data : null);
    if (Array.isArray(rawItems) && rawItems.length > 0) {
      const list = rawItems.map((item, i) => ({
        name: item.name || item.label || item.day || `Item ${i + 1}`,
        value: typeof item.value === 'number' ? item.value : typeof item.total === 'number' ? item.total : (item.val !== undefined ? Number(item.val) : (item.sales !== undefined ? Number(item.sales) : (item.count !== undefined ? Number(item.count) : 0))),
        color: `var(--vq-series-${(i % 8) + 1})`,
      }));
      list.sort((a, b) => b.value - a.value);
      const total = Number(live.data.total) || list.reduce((s, x) => s + (x.value || 0), 0);
      return { parts: list, total, unit: rd?.unit || 'currency' };
    }
  }

  return { parts: [], total: 0, unit: rd?.unit || "currency" };
}

export function valuesForPure(live, period, unit, times = [], grain = 'day') {
  const n = times.length;
  if (live && live.ok && live.status !== "unavailable") {
    const seriesSource = (live.data && (live.data.series || live.data.points)) || live.series;
    if (seriesSource && Array.isArray(seriesSource) && seriesSource.length > 0) {
      const xMap = new Map();
      seriesSource.forEach(pt => {
        let k = String(pt.t ?? pt.x ?? '');
        if (pt.t) {
          const ptDate = new Date(pt.t);
          if (grain === 'hour') {
            k = String(ptDate.getHours()).padStart(2, '0');
          } else if (grain === 'month') {
            k = `${ptDate.getFullYear()}-${String(ptDate.getMonth() + 1).padStart(2, '0')}`;
          } else {
            const y = ptDate.getFullYear();
            const m = String(ptDate.getMonth() + 1).padStart(2, '0');
            const d = String(ptDate.getDate()).padStart(2, '0');
            k = `${y}-${m}-${d}`;
          }
        }
        const v = typeof pt.y === 'number' ? pt.y : (typeof pt.value === 'number' ? pt.value : (typeof pt === 'number' ? pt : (Number(pt) || 0)));
        xMap.set(k, v);
      });

      const mapped = times.map(t => {
        let k;
        if (grain === 'hour') {
          k = String(t.getHours()).padStart(2, '0');
        } else if (grain === 'month') {
          k = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}`;
        } else {
          const y = t.getFullYear();
          const m = String(t.getMonth() + 1).padStart(2, '0');
          const d = String(t.getDate()).padStart(2, '0');
          k = `${y}-${m}-${d}`;
        }
        return xMap.has(k) ? xMap.get(k) : null;
      });

      if (mapped.some(v => v !== null)) {
        return mapped.map(v => v ?? 0);
      }

      const pts = seriesSource.map(pt => (
        typeof pt === 'number' ? pt :
        typeof pt?.y === 'number' ? pt.y :
        typeof pt?.value === 'number' ? pt.value : 0
      ));
      if (pts.length === n) return pts;
      if (pts.length > n) return pts.slice(-n);
      return pts;
    }
  }

  return new Array(n).fill(0);
}
