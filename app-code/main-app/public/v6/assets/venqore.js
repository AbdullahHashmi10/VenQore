/**
 * VenQore · Master Platform Controller
 * Complete support for Dark/Light Theme Switcher, Mobile Menu Drawer, Sticky Header,
 * 5-Stage Compiler Theater, Zero Bloat 24-Engine Matrix, 10x Scrollytelling Track,
 * Scroll-Driven Marquee, Side Live Rail, and FAQ Accordion.
 */

(function () {
  'use strict';

  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  /* ── 1. Theme Switcher (data-theme-toggle & #theme-toggle) ─────────────── */
  function initTheme() {
    function setTheme(t) {
      var html = document.documentElement;
      html.classList.add('vq-theming');
      html.setAttribute('data-theme', t);
      html.classList.toggle('dark', t === 'dark');
      try {
        localStorage.setItem('vq-theme', t);
        localStorage.setItem('vq_theme', t);
      } catch (e) {}
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { html.classList.remove('vq-theming'); });
      });
    }

    var saved = localStorage.getItem('vq-theme') || localStorage.getItem('vq_theme');
    if (!saved) {
      saved = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    setTheme(saved);

    var toggles = $$('[data-theme-toggle], #theme-toggle');
    toggles.forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.preventDefault();
        var curr = document.documentElement.getAttribute('data-theme') || (document.documentElement.classList.contains('dark') ? 'dark' : 'light');
        var next = curr === 'dark' ? 'light' : 'dark';
        setTheme(next);
      });
    });
  }

  /* ── 2. Header Sticky & Mobile Menu Drawer ─────────────────────────────── */
  function initHeaderAndMenu() {
    var header = $('[data-header]');
    if (header) {
      var stick = function () { header.classList.toggle('is-stuck', window.scrollY > 24); };
      stick();
      window.addEventListener('scroll', stick, { passive: true });
    }

    var menu = $('[data-menu]');
    if (menu) {
      var setMenu = function (open) {
        menu.hidden = false;
        requestAnimationFrame(function () {
          menu.classList.toggle('is-open', open);
          var btn = $('[data-menu-open]');
          if (btn) btn.setAttribute('aria-expanded', String(open));
        });
        if (!open) setTimeout(function () { if (!menu.classList.contains('is-open')) menu.hidden = true; }, 320);
      };
      var ot = $('[data-menu-open]'); if (ot) ot.addEventListener('click', function () { setMenu(true); });
      var ct = $('[data-menu-close]'); if (ct) ct.addEventListener('click', function () { setMenu(false); });
      $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
      window.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
    }
  }

  /* ── 3. Top Progress Bar & Side Live Rail Tracking ─────────────────────── */
  function initProgressAndRail() {
    var prog = $('[data-prog="1"]');
    var rail = $('[data-rail="1"]');
    var dots = $$('[data-dot="1"]').map(function (d) {
      return {
        d: d,
        on: d.getAttribute('data-for'),
        mark: d.querySelector('[data-dotmark]'),
        label: d.querySelector('[data-dotlabel]')
      };
    });
    var sections = $$('[data-sec]');

    function onScroll() {
      var scrollY = window.pageYOffset || document.documentElement.scrollTop;
      var docH = document.documentElement.scrollHeight - window.innerHeight;
      if (prog && docH > 0) {
        var p = clamp(scrollY / docH, 0, 1) * 100;
        prog.style.width = p.toFixed(1) + '%';
      }

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

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── 4. Reveal Animations ─────────────────────────────────────────────── */
  function initReveals() {
    var reveals = $$('.vq-reveal');
    if (!('IntersectionObserver' in window)) {
      reveals.forEach(function (el) { el.style.opacity = '1'; });
      return;
    }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.style.opacity = '1';
          en.target.style.transform = 'none';
          en.target.style.transition = 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
          obs.unobserve(en.target);
        }
      });
    }, { threshold: 0.1 });

    reveals.forEach(function (el) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(24px)';
      obs.observe(el);
    });
  }

  /* ── 5. Hero Section Prompt & Business Picker Modal ────────────────────── */
  function initHero() {
    var textarea = $('#hero-prompt');
    var placeholder = $('#shiny-placeholder') || $('[data-hero-placeholder]');
    var btnGo = $('[data-hero-go]');
    var chips = $$('[data-hero-chip]');
    var btnSelectBusiness = $('#btn-select-business');
    var modal = $('#modal-select-business');
    var modalClose = $('#modal-close-btn');
    var modalCancel = $('#modal-cancel-btn');
    var modalConfirm = $('#btn-confirm-business');

    var scenarios = {
      pharmacy: 'I run a 3-branch pharmacy with batch expiry tracking and distributor 30-day credit terms.',
      wholesale: 'Auto parts wholesale with 10,000 SKUs, bulk discount tiers, and container logistics.',
      cafe: 'Artisan bakery and central kitchen with recipe costing, ingredient batching, and 4 shop drops.',
      hardware: 'Hardware store with 9,000 SKUs, FIFO valuation, variant dimensions and contractor trade credit.',
      multi: 'Multi-branch retail with variant matrix (size/color) synced live to Amazon and WooCommerce.'
    };

    if (textarea && placeholder) {
      textarea.addEventListener('input', function () {
        placeholder.style.display = textarea.value.trim() ? 'none' : 'block';
      });
    }

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var key = chip.getAttribute('data-hero-chip');
        if (scenarios[key] && textarea) {
          textarea.value = scenarios[key];
          if (placeholder) placeholder.style.display = 'none';
          textarea.focus();
        }
      });
    });

    if (btnGo && textarea) {
      btnGo.addEventListener('click', function (e) {
        e.preventDefault();
        if (!textarea.value.trim()) {
          textarea.value = scenarios.pharmacy;
          if (placeholder) placeholder.style.display = 'none';
        }
        var comp = $('#compiler');
        if (comp) comp.scrollIntoView({ behavior: 'smooth' });
      });
    }

    function openModal() {
      if (!modal) return;
      modal.style.opacity = '1';
      modal.style.pointerEvents = 'auto';
      modal.setAttribute('aria-hidden', 'false');
    }
    function closeModal() {
      if (!modal) return;
      modal.style.opacity = '0';
      modal.style.pointerEvents = 'none';
      modal.setAttribute('aria-hidden', 'true');
    }

    if (btnSelectBusiness) btnSelectBusiness.addEventListener('click', openModal);
    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (modalCancel) modalCancel.addEventListener('click', closeModal);

    var itemBoxes = $$('.modal-window .item-box');
    var selectedBiz = "Retail Pharmacy with batch & expiry tracking";
    itemBoxes.forEach(function (box) {
      box.addEventListener('click', function () {
        itemBoxes.forEach(function (b) { b.classList.remove('is-selected'); b.style.borderColor = 'var(--vq-line)'; b.style.background = 'transparent'; });
        box.classList.add('is-selected');
        box.style.borderColor = 'var(--vq-accent)';
        box.style.background = 'var(--vq-sunken)';
        selectedBiz = box.getAttribute('data-biz');
      });
    });

    if (modalConfirm) {
      modalConfirm.addEventListener('click', function () {
        if (textarea) {
          textarea.value = "I run a " + selectedBiz + ".";
          if (placeholder) placeholder.style.display = 'none';
        }
        closeModal();
        var comp = $('#compiler');
        if (comp) comp.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }

  /* ── 6. 5-Stage Compiler Theater (#compiler) ───────────────────────────── */
  function initCompilerTheater() {
    var theater = $('[data-theater="1"]');
    if (!theater) return;

    var INTENT = "I run a 3-branch pharmacy with batch expiry tracking and distributor 30-day credit terms.";
    var titles = [
      "BLUEPRINT · READING INTENT",
      "DOMAIN PARSE · 3 FINANCIAL PASSES",
      "ENGINE SELECTION · 6 OF 24 BOUND",
      "TOPOLOGY · ROUTES BOUND TO CORE LEDGER",
      "YOUR SYSTEM · COMPILED & RUNNING"
    ];

    var layers = $$('[data-layer]', theater).map(function (e) {
      return { e: e, i: parseInt(e.getAttribute('data-layer'), 10) };
    });
    var rows = $$('[data-stagerow]', theater).map(function (e) {
      return {
        e: e,
        i: parseInt(e.getAttribute('data-stagerow'), 10),
        bar: e.querySelector('[data-stagebar]')
      };
    });

    var frametitle = theater.querySelector('[data-frametitle]');
    var typedEl = theater.querySelector('[data-typed="1"]');
    var tokens = $$('[data-token]', theater);
    var engines = $$('[data-engine]', theater).map(function (e) {
      return {
        e: e,
        i: parseInt(e.getAttribute('data-engine'), 10),
        on: e.getAttribute('data-on') === '1'
      };
    });
    var selcount = theater.querySelector('[data-selcount="1"]');

    var wiresSvg = theater.querySelector('[data-wires="1"]');
    var wires = $$('[data-wire="1"]', theater);
    var nodesIn = $$('[data-node="in"]', theater);
    var nodesMid = $$('[data-node="mid"]', theater);
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

  /* ── 7. Zero Bloat 24-Engine Reactive Matrix (#tailored) ───────────────── */
  function initZeroBloat() {
    var container = $('#tailored');
    if (!container) return;

    var allEngines = [
      "POS checkout", "Batch & expiry", "Stock ledger", "Manufacturing BOM",
      "Purchases & credit", "Branch transfers", "Payroll", "Container logistics",
      "Core Ledger", "Table service", "Tier pricing matrix", "Channel sync",
      "Recipe costing", "Ingredient batching", "Wholesale quotes", "Delivery routes",
      "Variant matrix", "Online storefront", "SmartCapture photo", "VenSynQ offline",
      "Vena queries", "Signals alerts", "Audit trails", "Multi-currency"
    ];

    var industries = {
      pharmacy: {
        active: [0, 1, 2, 4, 5, 8, 18, 19, 20, 21, 22],
        count: "8 of 24 shipped",
        eyebrow: "PHARMACY · 3 BRANCHES",
        title: "Batch expiry lives inside checkout",
        blurb: "Not in a settings page, not in a separate module. The counter picks the nearest-expiry batch first, and the write-off posts itself.",
        points: [
          "FEFO picking enforced at barcode scan",
          "Distributor 30-day credit terms tracked automatically",
          "Branch stock transfers balance double-entry across entities"
        ]
      },
      bakery: {
        active: [0, 2, 3, 4, 8, 12, 13, 19, 20, 21, 22],
        count: "7 of 24 shipped",
        eyebrow: "CENTRAL BAKERY & 4 SHOPS",
        title: "Recipe yield directly decrements raw stock",
        blurb: "Baking 500 baguettes auto-converts 250kg flour and 5kg yeast into finished goods inventory at exact weighted cost.",
        points: [
          "BOM breakdown on daily production runs",
          "Early morning store delivery manifest & reconciliation",
          "Daily spoilage write-offs balanced to Cost of Goods"
        ]
      },
      wholesale: {
        active: [2, 4, 5, 7, 8, 10, 14, 15, 20, 21, 22, 23],
        count: "9 of 24 shipped",
        eyebrow: "AUTO PARTS WHOLESALE",
        title: "Volume discount tiers & container aging",
        blurb: "10,000 SKUs with trade customer credit limits, multi-currency container shipments, and automated overdue aging alerts.",
        points: [
          "Bulk tiered price sheets per distributor tier",
          "Container freight & duty allocation to landed cost",
          "Automated ledger dunning with WhatsApp receipt triggers"
        ]
      },
      boutique: {
        active: [0, 2, 4, 8, 11, 16, 17, 19, 20, 21, 22],
        count: "7 of 24 shipped",
        eyebrow: "MULTI-CHANNEL BOUTIQUE",
        title: "Variant matrix synced to online store",
        blurb: "Size, color, and fit matrix synced live between physical counter and online store. Zero double-selling risk.",
        points: [
          "Live 2-way stock sync under 100ms",
          "Split tender checkout (Cash + Card + Gift card)",
          "Customer loyalty points recorded as balance sheet liabilities"
        ]
      }
    };

    var grid = container.querySelector('[data-modules-grid]');
    var countEl = container.querySelector('[data-ind-count]');
    var eyebrowEl = container.querySelector('[data-ind-eyebrow]');
    var titleEl = container.querySelector('[data-ind-title]');
    var blurbEl = container.querySelector('[data-ind-blurb]');
    var pointsEl = container.querySelector('[data-ind-points]');
    var btns = $$('[data-ind]', container);

    function renderIndustry(key) {
      var data = industries[key];
      if (!data) return;

      btns.forEach(function (b) {
        if (b.getAttribute('data-ind') === key) {
          b.classList.add('is-active');
        } else {
          b.classList.remove('is-active');
        }
      });

      if (countEl) countEl.textContent = data.count;
      if (eyebrowEl) eyebrowEl.textContent = data.eyebrow;
      if (titleEl) titleEl.textContent = data.title;
      if (blurbEl) blurbEl.textContent = data.blurb;

      if (pointsEl) {
        pointsEl.innerHTML = data.points.map(function (p) {
          return '<span style="display: flex; gap: 10px; font: 500 13.5px/1.5 var(--vq-font-sans); color: #EDF2EF;"><span style="color: #4BD99B; font-family: var(--vq-font-numeric);">+</span>' + p + '</span>';
        }).join('');
      }

      if (grid) {
        grid.innerHTML = allEngines.map(function (name, idx) {
          var on = data.active.indexOf(idx) !== -1;
          var border = on ? "rgba(35, 196, 166, 0.35)" : "var(--vq-line)";
          var bg = on ? "rgba(35, 196, 166, 0.12)" : "var(--vq-surface)";
          var color = on ? "var(--vq-text)" : "var(--vq-text-3)";
          var status = on ? "SELECTED" : "not needed";
          var statusColor = on ? "var(--vq-accent-text)" : "var(--vq-text-3)";
          var opacity = on ? "1" : "0.32";
          return '<div style="padding: 10px 12px; border-radius: var(--vq-r-md, 10px); border: 1px solid ' + border + '; background: ' + bg + '; opacity: ' + opacity + '; transition: all 0.3s ease;"><span style="display: block; font: 600 12px/1.25 var(--vq-font-display); color: ' + color + ';">' + name + '</span><span style="display: block; margin-top: 3px; font: 500 9.5px/1 var(--vq-font-numeric); color: ' + statusColor + ';">' + status + '</span></div>';
        }).join('');
      }
    }

    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var k = btn.getAttribute('data-ind');
        renderIndustry(k);
      });
    });

    renderIndustry('pharmacy');
  }

  /* ── 8. Horizontal 10x Track (#tenx) ────────────────────────────────────── */
  function initTenxTrack() {
    var tenx = $('[data-track="1"]');
    var row = $('[data-trackrow="1"]');
    var bar = $('[data-trackbar="1"]');
    if (!tenx || !row) return;

    function onScroll() {
      var r = tenx.getBoundingClientRect();
      var h = r.height - window.innerHeight;
      if (h <= 0) return;
      var prog = clamp(-r.top / h, 0, 1);

      if (bar) bar.style.width = (prog * 100).toFixed(1) + '%';

      var totalW = row.scrollWidth;
      var viewW = window.innerWidth;
      var maxTranslate = Math.max(0, totalW - viewW + 120);
      var tx = -(prog * maxTranslate);
      row.style.transform = 'translate3d(' + tx.toFixed(1) + 'px, 0, 0)';
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
  }

  /* ── 9. Scroll-Driven Black Marquee Strip ───────────────────────────────── */
  function initMarqueeScroll() {
    var mq = $('[data-marquee="1"]');
    if (!mq) return;

    function onScroll() {
      var scrollY = window.pageYOffset || document.documentElement.scrollTop;
      var offset = (scrollY * 0.4) % 1200;
      mq.style.transform = 'translate3d(' + (-offset).toFixed(1) + 'px, 0, 0)';
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── 10. FAQ Accordion ─────────────────────────────────────────────────── */
  function initFaq() {
    $$('.vq-faq__q').forEach(function (q) {
      q.addEventListener('click', function () {
        var item = q.closest('.vq-faq__item');
        var open = item.classList.toggle('is-open');
        q.setAttribute('aria-expanded', String(open));
      });
    });
  }

  /* ── 11. Pricing Toggle (Monthly / Annual) ────────────────────────────── */
  function initPricingToggle() {
    var toggles = $$('[data-period], .vq-seg');
    if (toggles.length === 0) return;

    toggles.forEach(function (toggle) {
      var btns = $$('.vq-seg__btn, [data-per]', toggle);
      if (btns.length === 0) return;

      var planCards = $$('.vq-plan');
      var amts = $$('[data-price]');
      var pers = $$('[data-per-label]');

      function setPeriod(period) {
        btns.forEach(function (btn) {
          var isThis = btn.getAttribute('data-per') === period ||
            (period === 'year' && btn.textContent.toLowerCase().indexOf('annual') !== -1) ||
            (period === 'month' && btn.textContent.toLowerCase().indexOf('month') !== -1 && btn.textContent.toLowerCase().indexOf('annual') === -1);
          btn.setAttribute('aria-selected', isThis ? 'true' : 'false');
        });

        amts.forEach(function (amt) {
          var priceMonth = amt.getAttribute('data-price');
          var priceYear = amt.getAttribute('data-price-year');
          if (period === 'year' && priceYear) {
            amt.textContent = priceYear;
          } else if (priceMonth) {
            amt.textContent = priceMonth;
          }
        });

        pers.forEach(function (per) {
          per.textContent = period === 'year' ? '/year' : '/month';
        });

        planCards.forEach(function (card) {
          var link = card.querySelector('a.vq-btn');
          if (link) {
            var href = link.getAttribute('href');
            if (href && href.indexOf('javascript') === -1) {
              try {
                var url = new URL(href, window.location.origin);
                if (period === 'year') {
                  url.searchParams.set('billing', 'annual');
                } else {
                  url.searchParams.delete('billing');
                }
                link.setAttribute('href', url.pathname + url.search);
              } catch (err) {}
            }
          }
        });
      }

      btns.forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          var per = btn.getAttribute('data-per');
          if (!per) {
            per = btn.textContent.toLowerCase().indexOf('annual') !== -1 ? 'year' : 'month';
          }
          setPeriod(per);
        });
      });

      setPeriod('month');
    });
  }

  /* ── Initialize Everything on DOM Load ─────────────────────────────────── */
  function init() {
    initTheme();
    initHeaderAndMenu();
    initProgressAndRail();
    initReveals();
    initHero();
    initCompilerTheater();
    initZeroBloat();
    initTenxTrack();
    initMarqueeScroll();
    initFaq();
    initPricingToggle();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
