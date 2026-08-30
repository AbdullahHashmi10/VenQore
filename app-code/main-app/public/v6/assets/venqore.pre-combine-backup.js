/* ═══════════════════════════════════════════════════════════════════════════
   VenQore V6 — public page behaviour
   Motion budget: four durations (120/200/320/520) and one ambient (9000).
   Everything here degrades to nothing under prefers-reduced-motion.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Theme ───────────────────────────────────────────────────────────────
     The toggle adds .vq-theming to <html>, flips data-theme, and removes it
     on the next frame. That class kills every transition so a property bound
     to a theme variable is never left painted at the old value. */
  function setTheme(t) {
    var html = document.documentElement;
    html.classList.add('vq-theming');
    html.setAttribute('data-theme', t);
    html.classList.toggle('dark', t === 'dark');
    try { localStorage.setItem('vq-theme', t); } catch (e) {}
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { html.classList.remove('vq-theming'); });
    });
  }
  $$('[data-theme-toggle]').forEach(function (b) {
    b.addEventListener('click', function () {
      setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    });
  });

  /* ── Header ─────────────────────────────────────────────────────────── */
  var header = $('[data-header]');
  if (header) {
    var stick = function () { header.classList.toggle('is-stuck', window.scrollY > 24); };
    stick();
    addEventListener('scroll', stick, { passive: true });
  }

  /* ── Mobile menu ────────────────────────────────────────────────────── */
  var menu = $('[data-menu]');
  if (menu) {
    var setMenu = function (open) {
      menu.hidden = false;
      requestAnimationFrame(function () { menu.classList.toggle('is-open', open); });
      document.body.style.overflow = open ? 'hidden' : '';
      var t = $('[data-menu-open]');
      if (t) t.setAttribute('aria-expanded', String(open));
      if (!open) setTimeout(function () { if (!menu.classList.contains('is-open')) menu.hidden = true; }, 320);
    };
    var ot = $('[data-menu-open]'); if (ot) ot.addEventListener('click', function () { setMenu(true); });
    var ct = $('[data-menu-close]'); if (ct) ct.addEventListener('click', function () { setMenu(false); });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  }

  /* ── Scroll reveal — 60ms stagger inside a group ────────────────────── */
  var revealables = $$('.vq-reveal');
  if (revealables.length) {
    if (REDUCED || !('IntersectionObserver' in window)) {
      revealables.forEach(function (el) { el.classList.add('is-in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          var el = en.target;
          var group = el.parentElement ? $$('.vq-reveal', el.parentElement) : [el];
          var i = group.indexOf(el);
          el.style.setProperty('--vq-reveal-delay', Math.min(i < 0 ? 0 : i, 8) * 60 + 'ms');
          el.classList.add('is-in');
          io.unobserve(el);
        });
      }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
      revealables.forEach(function (el) { io.observe(el); });
    }
  }

  /* ── Count-up. Marketing KPIs only — never a ledger balance. ────────── */
  $$('[data-count]').forEach(function (el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var suffix = el.getAttribute('data-suffix') || '';
    var dp = parseInt(el.getAttribute('data-dp') || '0', 10);
    var fmt = function (v) { return v.toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp }) + suffix; };
    if (REDUCED || !('IntersectionObserver' in window)) { el.textContent = fmt(target); return; }
    el.textContent = fmt(0);
    var seen = false;
    new IntersectionObserver(function (en, obs) {
      if (!en[0].isIntersecting || seen) return;
      seen = true; obs.disconnect();
      var t0 = performance.now(), D = 900;
      (function tick(now) {
        var p = Math.min((now - t0) / D, 1);
        el.textContent = fmt(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
    }, { threshold: 0.4 }).observe(el);
  });

  /* ── FAQ ────────────────────────────────────────────────────────────── */
  $$('.vq-faq__q').forEach(function (q) {
    q.addEventListener('click', function () {
      var item = q.closest('.vq-faq__item');
      var open = item.classList.toggle('is-open');
      q.setAttribute('aria-expanded', String(open));
    });
  });

  /* ── Pricing period toggle ──────────────────────────────────────────── */
  var seg = $('[data-period]');
  if (seg) {
    $$('.vq-seg__btn', seg).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var per = btn.getAttribute('data-per');
        $$('.vq-seg__btn', seg).forEach(function (b) { b.setAttribute('aria-selected', String(b === btn)); });
        $$('[data-price]').forEach(function (el) {
          el.textContent = el.getAttribute(per === 'year' ? 'data-price-year' : 'data-price');
        });
        $$('[data-per-label]').forEach(function (el) {
          el.textContent = per === 'year' ? '/year' : '/month';
        });
        document.documentElement.setAttribute('data-period', per);
      });
    });
  }

  /* ── Chart draw-in: measure each path so the dash animation is exact ─── */
  $$('.vq-chart .line').forEach(function (p) {
    try { p.style.setProperty('--len', Math.ceil(p.getTotalLength()) + 'px'); } catch (e) {}
  });

  /* ═══ The Blueprint console ══════════════════════════════════════════════
     Narrate the wait — never "Loading...". These are the real six states the
     product reports while it composes a system. */
  var BP_STEPS = [
    'Reading your business',
    'Selecting modules',
    'Naming your fields',
    'Setting roles and approvals',
    'Wiring the ledger',
  ];

  var BLUEPRINTS = {
    pharmacy: {
      chip: 'Pharmacy',
      prompt: 'I run two pharmacy branches. I buy on 30-day credit from four distributors, I need batch and expiry tracking, and my accountant wants a trial balance every month.',
      counts: [16, 6, 11],
      on:  ['Point of sale', 'Batch & expiry', 'Multi-branch stock', 'Supplier credit', 'Purchase orders', 'Core Ledger', 'Trial balance', 'Customer khata', 'Aged payables', 'Stock transfers', 'Tax handling', 'Approvals'],
      opt: ['Loyalty', 'Gift cards', 'Online store'],
      off: ['Recipes / BOM', 'Table service', 'Production runs'],
      words: [['Products', 'Items'], ['Customers', 'Patients'], ['Suppliers', 'Distributors']],
    },
    wholesale: {
      chip: 'Wholesale',
      prompt: 'We distribute FMCG to about 300 shops. Everyone buys on different price tiers, most on credit, and I need to know which customer stopped ordering.',
      counts: [14, 7, 9],
      on:  ['Sales orders', 'Price tiers', 'Credit limits', 'Party ledger', 'Aged receivables', 'Purchase orders', 'Core Ledger', 'Signals', 'Multi-warehouse', 'Statements', 'Landed cost'],
      opt: ['Van sales', 'Route planning', 'Proposals'],
      off: ['Point of sale', 'Recipes / BOM', 'Expiry alerts'],
      words: [['Customers', 'Accounts'], ['Invoices', 'Bills'], ['Locations', 'Godowns']],
    },
    cafe: {
      chip: 'Café',
      prompt: 'Small café, one location, six staff. We make our own bread and pastries, we sell over the counter, and I keep losing track of what the flour actually costs me.',
      counts: [11, 5, 14],
      on:  ['Point of sale', 'Recipes / BOM', 'Ingredient draw-down', 'Wastage', 'Shift & attendance', 'Core Ledger', 'Expense manager', 'Daily cash audit', 'Item profitability'],
      opt: ['Loyalty', 'Table service', 'Online orders'],
      off: ['Multi-branch stock', 'Serial tracking', 'Purchase returns'],
      words: [['Products', 'Menu items'], ['Recipes', 'Recipes'], ['Staff', 'Team']],
    },
    hardware: {
      chip: 'Hardware store',
      prompt: 'Hardware and tools, one big shop. Nine thousand SKUs, half of them sold by weight or length, and I want to stop guessing my real margin per item.',
      counts: [13, 6, 10],
      on:  ['Point of sale', 'Unit converter', 'Variant factory', 'FIFO costing', 'Item profitability', 'Purchase orders', 'Core Ledger', 'Low-stock alerts', 'Barcode labels', 'Supplier khata'],
      opt: ['Wholesale tiers', 'Quotations', 'Delivery notes'],
      off: ['Batch & expiry', 'Recipes / BOM', 'Table service'],
      words: [['Products', 'Items'], ['Categories', 'Aisles'], ['Customers', 'Customers']],
    },
    multi: {
      chip: 'Multi-branch',
      prompt: 'Five retail branches across two cities. Each one prices a little differently, stock moves between them constantly, and month-end currently takes me nine days.',
      counts: [18, 9, 7],
      on:  ['Multi-branch stock', 'Per-branch pricing', 'Stock transfers', 'Consolidated reports', 'Approval chains', 'Custom roles', 'Core Ledger', 'Inter-branch ledger', 'Period closing', 'Signals', 'Point of sale', 'Purchase orders'],
      opt: ['Loyalty', 'VenSynQ channels', 'API access'],
      off: ['Recipes / BOM', 'Serial tracking'],
      words: [['Locations', 'Branches'], ['Staff', 'Team'], ['Reports', 'Reports']],
    },
  };

  function typeInto(el, text, done) {
    if (REDUCED) { el.textContent = text; done && done(); return; }
    el.textContent = '';
    var i = 0;
    var caret = document.createElement('span');
    caret.className = 'vq-bp__caret';
    el.appendChild(caret);
    var timer = setInterval(function () {
      i += Math.random() < 0.45 ? 3 : 2;
      caret.remove();
      el.textContent = text.slice(0, i);
      el.appendChild(caret);
      if (i >= text.length) { clearInterval(timer); caret.remove(); done && done(); }
    }, 14);
    return function () { clearInterval(timer); };
  }

  function runBlueprint(root, key) {
    var bp = BLUEPRINTS[key];
    if (!bp) return;
    var promptEl = $('[data-bp-prompt]', root);
    var stepsEl  = $('[data-bp-steps]', root);
    var resultEl = $('[data-bp-result]', root);

    if (root._stop) root._stop();
    var cancelled = false;
    root._stop = function () { cancelled = true; };

    resultEl.classList.remove('is-in');
    stepsEl.innerHTML = BP_STEPS.map(function (s) {
      return '<div class="vq-step"><span class="vq-step__mark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span>' + s + '…</div>';
    }).join('');

    typeInto(promptEl, bp.prompt, function () {
      if (cancelled) return;
      var steps = $$('.vq-step', stepsEl);
      var i = 0;
      (function next() {
        if (cancelled) return;
        if (i > 0) { steps[i - 1].classList.remove('is-live'); steps[i - 1].classList.add('is-done'); }
        if (i >= steps.length) { render(); return; }
        steps[i].classList.add('is-live');
        i++;
        setTimeout(next, REDUCED ? 0 : 230 + Math.random() * 150);
      })();
    });

    function render() {
      if (cancelled) return;
      var d = 0, step = 26;
      var chip = function (label, cls) {
        var mark = cls === 'vq-mod--on' ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>'
                 : cls === 'vq-mod--off' ? '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>'
                 : '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>';
        d += step;
        return '<span class="vq-mod ' + cls + '" style="--d:' + d + 'ms">' + mark + (cls === 'vq-mod--off' ? '<s>' + label + '</s>' : label) + '</span>';
      };
      resultEl.innerHTML =
        '<div class="vq-row vq-wrap vq-gap-3" style="justify-content:space-between;align-items:baseline">' +
          '<h3 class="vq-h3">Your Blueprint</h3>' +
          '<span class="vq-caption vq-num">' + bp.counts[0] + ' modules · ' + bp.counts[1] + ' roles · ' + bp.counts[2] + ' reports</span>' +
        '</div>' +
        '<div class="vq-mt-5"><span class="vq-eyebrow vq-eyebrow--accent">Included</span>' +
          '<div class="vq-mods vq-mt-3">' + bp.on.map(function (m) { return chip(m, 'vq-mod--on'); }).join('') + '</div></div>' +
        '<div class="vq-mt-5"><span class="vq-eyebrow">Optional — add any time</span>' +
          '<div class="vq-mods vq-mt-3">' + bp.opt.map(function (m) { return chip(m, ''); }).join('') + '</div></div>' +
        '<div class="vq-mt-5"><span class="vq-eyebrow">Left off, on purpose</span>' +
          '<div class="vq-mods vq-mt-3">' + bp.off.map(function (m) { return chip(m, 'vq-mod--off'); }).join('') + '</div></div>' +
        '<div class="vq-mt-5"><span class="vq-eyebrow">Your vocabulary</span>' +
          '<div class="vq-mt-3" style="display:flex;flex-direction:column;gap:6px">' +
            bp.words.map(function (w) {
              return '<div class="vq-caption vq-row vq-gap-2"><span class="vq-text-3">' + w[0] + '</span>' +
                     '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color:var(--vq-text-3)"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>' +
                     '<b style="color:var(--vq-text)">' + w[1] + '</b></div>';
            }).join('') +
          '</div></div>' +
        '<div class="vq-mt-6" style="margin-top:auto;padding-top:var(--vq-space-6)">' +
          '<a href="register.html" class="vq-btn vq-btn--primary vq-btn--lg vq-btn--block">Build this system <span class="vq-btn__arrow"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a>' +
          '<p class="vq-caption vq-mt-3 vq-center" style="max-width:none">Every line is editable. Nothing posts to your books until you approve it.</p>' +
        '</div>';
      requestAnimationFrame(function () { resultEl.classList.add('is-in'); });
    }
  }

  $$('[data-bp]').forEach(function (root) {
    var tabs = $$('.vq-bp__tab', root);
    var start = function (btn) {
      tabs.forEach(function (b) { b.setAttribute('aria-selected', String(b === btn)); });
      runBlueprint(root, btn.getAttribute('data-bp-key'));
    };
    tabs.forEach(function (b) { b.addEventListener('click', function () { start(b); }); });
    var first = tabs[0];
    if (first) {
      if (!('IntersectionObserver' in window)) { start(first); return; }
      var fired = false;
      new IntersectionObserver(function (en, obs) {
        if (!en[0].isIntersecting || fired) return;
        fired = true; obs.disconnect(); start(first);
      }, { threshold: 0.25 }).observe(root);
    }
  });

  /* ── Hero prompt → carries the sentence into the builder ────────────── */
  var heroForm = $('[data-hero-prompt]');
  if (heroForm) {
    var ta = $('textarea', heroForm);
    var ph = $('[data-hero-placeholder]');
    if (ta && ph) {
      var sync = function () { ph.style.opacity = ta.value.length ? '0' : '1'; };
      ta.addEventListener('input', function () {
        sync();
        ta.style.height = 'auto';
        ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
      });
      ta.addEventListener('focus', sync);
      sync();
    }
    var go = function () {
      var v = ta && ta.value.trim();
      location.href = 'onboarding.html' + (v ? '?prompt=' + encodeURIComponent(v) : '');
    };
    heroForm.addEventListener('submit', function (e) { e.preventDefault(); go(); });
    $$('[data-hero-go]', heroForm).forEach(function (b) { b.addEventListener('click', go); });
    if (ta) ta.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); go(); }
    });
  }
  $$('[data-hero-chip]').forEach(function (c) {
    c.addEventListener('click', function () {
      var ta2 = $('[data-hero-prompt] textarea');
      var key = c.getAttribute('data-hero-chip');
      var b = BLUEPRINTS[key];
      if (ta2 && b) {
        ta2.value = b.prompt;
        ta2.dispatchEvent(new Event('input'));
        ta2.focus();
      }
    });
  });

  /* ── Forms — these are marketing pages, so nothing posts anywhere yet ── */
  $$('form[data-waitlist], form[data-demo]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = $('button[type="submit"]', f);
      if (!btn || btn.dataset.done) return;
      btn.dataset.done = '1';
      btn.textContent = 'Check your email';
      btn.classList.remove('vq-btn--primary');
      btn.classList.add('vq-btn--secondary');
    });
  });
})();

  /* ═══════════════════════════════════════════════════════════════════════════
     5-STAGE COMPILER THEATER & SIDE RAIL CONTROLLER
     ═══════════════════════════════════════════════════════════════════════════ */
  (function () {
    function clamp(v, min, max) {
      return Math.max(min, Math.min(max, v));
    }

    var theater = document.querySelector('[data-theater="1"]');
    if (theater) {
      var INTENT = "I run a 3-branch pharmacy with batch expiry tracking and distributor 30-day credit terms.";
      var titles = [
        "BLUEPRINT · READING INTENT",
        "DOMAIN PARSE · 3 FINANCIAL PASSES",
        "ENGINE SELECTION · 6 OF 24 BOUND",
        "TOPOLOGY · ROUTES BOUND TO CORE LEDGER",
        "YOUR SYSTEM · COMPILED & RUNNING"
      ];

      var layers = Array.from(theater.querySelectorAll('[data-layer]')).map(function (e) {
        return { e: e, i: parseInt(e.getAttribute('data-layer'), 10) };
      });
      var rows = Array.from(theater.querySelectorAll('[data-stagerow]')).map(function (e) {
        return {
          e: e,
          i: parseInt(e.getAttribute('data-stagerow'), 10),
          bar: e.querySelector('[data-stagebar]')
        };
      });

      var frametitle = theater.querySelector('[data-frametitle]');
      var typedEl = theater.querySelector('[data-typed="1"]');
      var tokens = Array.from(theater.querySelectorAll('[data-token]'));
      var engines = Array.from(theater.querySelectorAll('[data-engine]')).map(function (e) {
        return {
          e: e,
          i: parseInt(e.getAttribute('data-engine'), 10),
          on: e.getAttribute('data-on') === '1'
        };
      });
      var selcount = theater.querySelector('[data-selcount="1"]');

      var wiresSvg = theater.querySelector('[data-wires="1"]');
      var wires = Array.from(theater.querySelectorAll('[data-wire="1"]'));
      var nodesIn = Array.from(theater.querySelectorAll('[data-node="in"]'));
      var nodesMid = Array.from(theater.querySelectorAll('[data-node="mid"]'));
      var nodeCore = theater.querySelector('[data-node="core"]');

      function updateWires() {
        if (!wiresSvg || !nodeCore || nodesIn.length < 3 || nodesMid.length < 2) return;
        var svgRect = wiresSvg.getBoundingClientRect();
        if (svgRect.width <= 0 || svgRect.height <= 0) return;

        function getRightPort(el) {
          var r = el.getBoundingClientRect();
          return {
            x: r.right - svgRect.left,
            y: r.top + r.height / 2 - svgRect.top
          };
        }

        function getLeftPort(el) {
          var r = el.getBoundingClientRect();
          return {
            x: r.left - svgRect.left,
            y: r.top + r.height / 2 - svgRect.top
          };
        }

        var connections = [
          { from: getRightPort(nodesIn[0]), to: getLeftPort(nodesMid[0]) },
          { from: getRightPort(nodesIn[1]), to: getLeftPort(nodesMid[0]) },
          { from: getRightPort(nodesIn[2]), to: getLeftPort(nodesMid[1]) },
          { from: getRightPort(nodesMid[0]), to: getLeftPort(nodeCore) },
          { from: getRightPort(nodesMid[1]), to: getLeftPort(nodeCore) }
        ];

        wires.forEach(function (w, i) {
          var conn = connections[i];
          if (!conn) return;
          var x1 = conn.from.x;
          var y1 = conn.from.y;
          var x2 = conn.to.x;
          var y2 = conn.to.y;
          var dx = Math.max(20, (x2 - x1) * 0.52);
          var d = "M " + x1.toFixed(1) + " " + y1.toFixed(1) + " C " + (x1 + dx).toFixed(1) + " " + y1.toFixed(1) + ", " + (x2 - dx).toFixed(1) + " " + y2.toFixed(1) + ", " + x2.toFixed(1) + " " + y2.toFixed(1);
          w.setAttribute("d", d);
          var len = Math.hypot(x2 - x1, y2 - y1) * 1.25;
          w.style.strokeDasharray = len.toFixed(1);
        });
      }

      function onScroll() {
        var r = theater.getBoundingClientRect();
        var h = r.height - window.innerHeight;
        if (h <= 0) return;
        var prog = clamp(-r.top / h, 0, 1);

        var N = 5;
        var local = prog * N * 0.999;
        var idx = clamp(Math.floor(local), 0, N - 1);
        var frac = clamp(local - idx, 0, 1);

        if (frametitle && frametitle.textContent !== titles[idx]) {
          frametitle.textContent = titles[idx];
        }

        layers.forEach(function (o2) {
          var L = o2.e, i = o2.i;
          var o = 0, ty = 0, sc = 1;
          if (i === idx) {
            o = clamp(frac / 0.16, 0, 1) * (i === N - 1 ? 1 : 1 - clamp((frac - 0.86) / 0.14, 0, 1));
            ty = (1 - clamp(frac / 0.22, 0, 1)) * 26 - clamp((frac - 0.84) / 0.16, 0, 1) * 18;
            sc = 1 - clamp((frac - 0.84) / 0.16, 0, 1) * 0.02;
          }
          L.style.opacity = o.toFixed(3);
          L.style.transform = "translate3d(0," + ty.toFixed(1) + "px,0) scale(" + sc.toFixed(3) + ")";
          L.style.pointerEvents = o > 0.5 ? "auto" : "none";
        });

        rows.forEach(function (o3) {
          var i = o3.i;
          o3.e.style.opacity = i === idx ? "1" : i < idx ? ".5" : ".28";
          if (o3.bar) o3.bar.style.width = (i < idx ? 100 : i === idx ? frac * 100 : 0).toFixed(1) + "%";
        });

        if (typedEl) {
          var n = Math.round(clamp((idx === 0 ? frac : idx > 0 ? 1 : 0) / 0.72, 0, 1) * INTENT.length);
          var s = INTENT.slice(0, n);
          if (typedEl.textContent !== s) typedEl.textContent = s;
        }

        tokens.forEach(function (t, i) {
          var q = idx > 1 ? 1 : idx === 1 ? clamp((frac - i * 0.045) / 0.14, 0, 1) : 0;
          t.style.opacity = q.toFixed(2);
          t.style.transform = q > 0.5 ? "none" : "translateY(8px) scale(.96)";
        });

        var sel = 0;
        engines.forEach(function (o4) {
          var e = o4.e, i = o4.i, on = o4.on;
          var q = idx > 2 ? 1 : idx === 2 ? clamp((frac - i * 0.035) / 0.16, 0, 1) : 0;
          if (on) {
            if (q > 0.5) sel++;
            e.style.opacity = (0.28 + q * 0.72).toFixed(2);
            e.style.borderColor = q > 0.5 ? "rgba(35, 196, 166, 0.42)" : "rgba(255, 255, 255, 0.08)";
            e.style.background = q > 0.5 ? "rgba(35, 196, 166, 0.12)" : "#1A2220";
            e.style.transform = q > 0.5 ? "translateY(-2px)" : "none";
            e.style.boxShadow = q > 0.5 ? "0 10px 26px -14px rgba(35, 196, 166, 0.7)" : "none";
          } else {
            e.style.opacity = (0.28 - q * 0.16).toFixed(2);
            e.style.filter = "grayscale(1)";
          }
        });
        if (selcount) {
          var v = idx > 2 ? "6" : String(sel);
          if (selcount.textContent !== v) selcount.textContent = v;
        }

        if (idx === 3) updateWires();
      }

      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', function () {
        updateWires();
        onScroll();
      });
      updateWires();
      onScroll();
    }

    /* ── Side Live Slider Rail Tracking ── */
    var rail = document.querySelector('[data-rail="1"]');
    var dots = Array.from(document.querySelectorAll('[data-dot="1"]')).map(function (d) {
      return {
        d: d,
        on: d.getAttribute('data-for'),
        mark: d.querySelector('[data-dotmark]'),
        label: d.querySelector('[data-dotlabel]')
      };
    });
    var sections = Array.from(document.querySelectorAll('[data-sec]'));

    function updateSideRail() {
      if (!rail || sections.length === 0) return;
      var vh = window.innerHeight;
      var active = null;
      sections.forEach(function (s) {
        var r = s.getBoundingClientRect();
        if (r.top <= vh * 0.45 && r.bottom > vh * 0.45) {
          active = s.getAttribute('data-sec');
        }
      });
      dots.forEach(function (dd) {
        var on = dd.on === active;
        if (on) {
          dd.d.classList.add('is-active');
        } else {
          dd.d.classList.remove('is-active');
        }
      });
    }

    window.addEventListener('scroll', updateSideRail, { passive: true });
    updateSideRail();
  })();
