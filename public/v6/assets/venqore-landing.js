/* ══════════════════════════════════════════════════════════════════════════
   VenQore — landing page scroll choreography
   Vanilla ports of the react-bits components the site uses, written to the
   same house pattern as animatedlist.js (no build step, no framework).

     ScrollFloat   → per-character scrub reveal on section headlines
     AnimatedContent → [data-par] parallax layers
     SpotlightCard → pointer-tracked radial on .vq-spot
     CountUp       → [data-count] tabular numbers
     ScrollStack   → the pinned product showcase
     LogoLoop      → the integrations marquees (scroll-velocity aware)
     GradualBlur   → soft edges on pinned frames

   Runs after venqore.js. Touches nothing the hero, the compiler theatre or
   the footer depend on.
   ══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── LITE mode ────────────────────────────────────────────────────────────
     Every effect below is a scroll-scrubbed animation: it reads layout and
     writes inline styles on each rAF tick. On desktop that is a handful of
     elements and the compositor absorbs it. On a phone it is not.

     Three of these sections are `position: sticky; height: 100vh` pins whose
     parents run 2500-5000px tall, so on a 390px screen the page measures
     44,100px — 52 viewports, most of it dead scroll while pinned content
     scrubs. ScrollFloat is worse: it splits every .vq-sfloat heading into one
     <span> per character (315 on this page), each carrying a permanent
     `will-change: transform, opacity`, then rewrites .style.opacity and
     .style.transform on all 315 every frame.

     LITE switches the scrubbed choreography off below 900px so the same
     content lays out as ordinary stacked sections. Nothing is hidden: each
     effect renders its finished state instead of its scrubbed one. */
  var LITE = reduced;

  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function progressOf(el) {
    var r = el.getBoundingClientRect();
    var h = r.height - window.innerHeight;
    if (h <= 0) return r.top <= 0 ? 1 : 0;
    return clamp(-r.top / h, 0, 1);
  }

  /* Scroll bus — one listener, many subscribers. */
  var subs = [];
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      for (var i = 0; i < subs.length; i++) { try { subs[i](); } catch (e) {} }
      ticking = false;
    });
  }
  function subscribe(fn) { subs.push(fn); fn(); }

  /* ── ScrollFloat ──────────────────────────────────────────────────────── */
  function initScrollFloat() {
    var heads = $$('.vq-sfloat');
    if (!heads.length) return;

    /* LITE: do not split at all. 315 permanently layer-promoted character
       spans is the single most expensive thing on this page, and the payoff
       is a per-letter rise nobody can perceive on a phone anyway. The heading
       stays one element and gets a plain CSS fade-up via .vq-reveal. */
    var liteFloat = LITE || (window.matchMedia && window.matchMedia('(max-width: 860px)').matches);
    if (liteFloat) {
      /* One IntersectionObserver that unobserves on first hit, rather than
         anything per-frame. Note this cannot lean on venqore.js's .vq-reveal
         observer: that one runs at its own load, which is before this file
         executes, and it drives opacity through inline styles rather than a
         class. If IO is unavailable, the heading is simply visible — the
         failure mode has to be "no animation", never "no text". */
      if (!window.IntersectionObserver) return;
      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          en.target.classList.add('is-in');
          obs.unobserve(en.target);
        });
      }, { threshold: 0.15 });
      heads.forEach(function (h) {
        h.classList.add('vq-sfloat--lite');
        obs.observe(h);
      });
      return;
    }

    heads.forEach(function (h) {
      if (h.dataset.split === '1') return;
      /* Split per character, but keep each word in its own inline-block so a
         line can only break between words. Splitting straight to characters
         lets the browser break mid-word ("hallucin / ated"), which is the one
         thing a display headline must never do. */
      var words = h.textContent.split(/(\s+)/);
      h.textContent = '';
      var frag = document.createDocumentFragment();
      words.forEach(function (w) {
        if (w === '') return;
        if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(' ')); return; }
        var wrap = document.createElement('span');
        wrap.className = 'vqw';
        for (var i = 0; i < w.length; i++) {
          var c = document.createElement('span');
          c.className = 'vqch';
          c.textContent = w[i];
          wrap.appendChild(c);
        }
        frag.appendChild(wrap);
      });
      h.appendChild(frag);
      h.dataset.split = '1';
    });

    if (reduced) return;

    /* Cache the character lists once. The original queried .vqch inside the
       scroll callback, so every heading ran a fresh querySelectorAll on every
       frame. Also cache the last progress per heading so a heading that has
       finished (or has not started) writes nothing. */
    var tracked = heads.map(function (h) {
      return { el: h, chars: h.querySelectorAll('.vqch'), last: -1 };
    });

    subscribe(function () {
      var vh = window.innerHeight;            /* read once, not once per heading */
      tracked.forEach(function (t) {
        var h = t.el;
        var r = h.getBoundingClientRect();
        /* Cull: off-screen headings cannot change appearance. */
        if (r.bottom < -vh * 0.5 || r.top > vh * 1.5) return;
        /* start when the block's top reaches 92% of the viewport, finish at 46% */
        var p = clamp((vh * 0.98 - r.top) / (vh * 0.42), 0, 1);
        /* Settled at either end — nothing to repaint. */
        if (p === t.last) return;
        t.last = p;
        var chars = t.chars;
        var n = chars.length || 1;
        for (var i = 0; i < n; i++) {
          var local = clamp(p * (n + 12) - i, 0, 1);
          var e = 1 - Math.pow(1 - local, 3);
          chars[i].style.opacity = e.toFixed(3);
          chars[i].style.transform =
            'translateY(' + ((1 - e) * 88).toFixed(2) + '%) scale(' +
            (0.86 + e * 0.14).toFixed(3) + ', ' + (1.9 - e * 0.9).toFixed(3) + ')';
        }
      });
    });
  }

  /* ── Parallax layers ──────────────────────────────────────────────────── */
  function initParallax() {
    var layers = $$('[data-par]');
    /* LITE: parallax is a per-frame transform write on decorative gradient
       blobs. It buys nothing on a small screen and costs a layer each. */
    if (!layers.length || LITE) return;

    subscribe(function () {
      var vh = window.innerHeight;
      layers.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var speed = parseFloat(el.getAttribute('data-par')) || 0;
        /* -1 .. 1 across the viewport, 0 when centred */
        var centred = (r.top + r.height / 2 - vh / 2) / vh;
        el.style.transform = 'translate3d(0,' + (centred * speed * 100).toFixed(2) + 'px,0)';
      });
    });
  }

  /* ── SpotlightCard ────────────────────────────────────────────────────── */
  function initSpotlight() {
    if (window.matchMedia && window.matchMedia('(hover: none)').matches) return;
    document.addEventListener('pointermove', function (e) {
      var card = e.target && e.target.closest ? e.target.closest('.vq-spot') : null;
      if (!card) return;
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }, { passive: true });
  }

  /* ── CountUp ──────────────────────────────────────────────────────────── */
  function initCountUp() {
    var nodes = $$('[data-count]');
    if (!nodes.length) return;

    function format(el, v) {
      var dec = parseInt(el.getAttribute('data-count-dec') || '0', 10);
      var s = dec ? v.toFixed(dec) : String(Math.round(v));
      if (el.getAttribute('data-count-sep') !== '0') {
        var parts = s.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        s = parts.join('.');
      }
      return (el.getAttribute('data-count-pre') || '') + s + (el.getAttribute('data-count-suf') || '');
    }

    function run(el) {
      var to = parseFloat(el.getAttribute('data-count'));
      if (isNaN(to)) return;
      if (reduced) { el.textContent = format(el, to); return; }
      var dur = parseInt(el.getAttribute('data-count-dur') || '1500', 10);
      var t0 = null;
      function step(ts) {
        if (t0 === null) t0 = ts;
        var p = clamp((ts - t0) / dur, 0, 1);
        var e = 1 - Math.pow(1 - p, 4);
        el.textContent = format(el, to * e);
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    nodes.forEach(function (el) { el.textContent = format(el, 0); });

    if (!('IntersectionObserver' in window)) { nodes.forEach(run); return; }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { run(en.target); obs.unobserve(en.target); }
      });
    }, { threshold: 0.4 });
    nodes.forEach(function (el) { obs.observe(el); });
  }

  /* ── ScrollStack — the pinned product showcase ────────────────────────── */
  function initScrollStack() {
    var wrap = $('[data-stack="1"]');
    if (!wrap) return;
    var cards = $$('[data-stackcard]', wrap);
    var counter = $('[data-stackcount]', wrap);
    if (!cards.length) return;

    var N = cards.length;
    cards.forEach(function (c, i) { c.style.zIndex = String(10 + i); });

    /* LITE: the deck stops being a deck. CSS unpins the section and lays the
       cards out as a normal vertical list, so every inline style this writes
       (absolute-positioning transforms, blur, opacity, visibility) has to be
       cleared or the cards sit blurred and invisible on top of each other. */
    if (LITE) {
      cards.forEach(function (c) {
        c.style.transform = '';
        c.style.opacity = '';
        c.style.filter = '';
        c.style.visibility = '';
        c.style.zIndex = '';
      });
      if (counter) counter.textContent = '';
      return;
    }

    subscribe(function () {
      var p = progressOf(wrap);
      var d0 = p * (N - 1);
      var top = Math.min(N - 1, Math.round(d0));
      if (counter) counter.textContent = String(top + 1).padStart(2, '0') + ' / ' + String(N).padStart(2, '0');

      cards.forEach(function (card, i) {
        var d = d0 - i;
        var ty, scale, blur, op;

        if (d < 0) {
          /* still below the stack — rises into place one step ahead, and is
             hidden before that so the deck does not ghost through the top card */
          var enter = clamp(1 + d, 0, 1);           /* 0 far below … 1 at rest */
          var e = 1 - Math.pow(1 - enter, 3);
          ty = (1 - e) * 46;                        /* percent of the stage box */
          scale = 0.94 + e * 0.06;
          blur = (1 - e) * 2.4;
          op = d < -1 ? 0 : e;
          card.style.visibility = d < -1.02 ? 'hidden' : 'visible';
          card.style.transform = 'translate3d(0,' + ty.toFixed(2) + '%,0) scale(' + scale.toFixed(3) + ')';
        } else {
          card.style.visibility = 'visible';
          /* stacked — settles back and softens as later cards land on it */
          var dd = Math.min(d, 3.4);
          scale = 1 - dd * 0.045;
          ty = -dd * 2.1;
          blur = dd * 1.7;
          op = clamp(1 - dd * 0.13, 0.28, 1);
          card.style.transform = 'translate3d(0,' + ty.toFixed(2) + '%,0) scale(' + scale.toFixed(3) + ')';
        }
        card.style.opacity = op.toFixed(3);
        card.style.filter = blur > 0.05 ? 'blur(' + blur.toFixed(2) + 'px)' : 'none';
      });
    });
  }

  /* ── Offline / sync theatre ───────────────────────────────────────────── */
  function initOfflineTheater() {
    var sec = $('[data-offline="1"]');
    if (!sec) return;
    var steps = $$('[data-offstep]', sec);
    var bars  = $$('[data-offbar]', sec);
    var till  = $('[data-till]', sec);
    var queue = $$('[data-qrow]', sec);
    var netLabel = $('[data-netlabel]', sec);
    var counter  = $('[data-qcount]', sec);
    var postedBox = $('[data-posted]', sec);
    var drained   = $('[data-drained]', sec);

    var BEATS = 4;

    function render(p) {
      var f = p * BEATS;                     /* 0 … 4 */
      var active = Math.min(BEATS - 1, Math.floor(f));
      var local = clamp(f - active, 0, 1);

      steps.forEach(function (s, i) {
        s.setAttribute('data-on', i === active ? '1' : '0');
      });
      bars.forEach(function (b, i) {
        b.style.width = (i < active ? 100 : (i === active ? local * 100 : 0)).toFixed(1) + '%';
      });

      /* beat 0: online.  beat 1–2: offline, queue fills.  beat 3: drains. */
      var offline = active === 1 || active === 2;
      if (till) till.setAttribute('data-net', offline ? 'down' : 'up');
      if (netLabel) netLabel.textContent = offline ? 'OFFLINE · STILL SELLING' : (active === 3 ? 'RECONNECTED · SYNCING' : 'ONLINE');

      var shown, state;
      if (active <= 0)      { shown = 0; state = 'queued'; }
      else if (active === 1){ shown = Math.round(local * 3); state = 'queued'; }
      else if (active === 2){ shown = 3 + Math.round(local * 2); state = 'queued'; }
      else                  { shown = 5; state = 'posted'; }

      queue.forEach(function (row, i) {
        var on = i < shown;
        row.setAttribute('data-in', on ? '1' : '0');
        var settled = active === 3 ? clamp(local * queue.length - i, 0, 1) : 0;
        row.setAttribute('data-state', settled >= 1 ? 'posted' : state);
        var st = row.querySelector('.vq-q__st');
        if (st) st.textContent = settled >= 1 ? 'POSTED' : 'QUEUED';
      });

      if (counter) {
        var queued = active === 3 ? Math.max(0, 5 - Math.round(local * 5)) : shown;
        counter.textContent = String(queued);
      }
      if (drained) {
        var posted = queue.length - (active === 3 ? Math.max(0, 5 - Math.round(local * 5)) : shown);
        drained.textContent = String(posted);
        var lbl = drained.parentNode;
        if (lbl) lbl.firstChild.nodeValue = posted >= queue.length ? 'DRAINED \u00B7 ' : 'SYNCING \u00B7 ';
      }
      if (postedBox) {
        postedBox.style.opacity = active === 3 ? clamp(local * 1.6, 0, 1).toFixed(2) : '0';
        postedBox.style.transform = 'translateY(' + (active === 3 ? (1 - clamp(local * 1.6, 0, 1)) * 10 : 10).toFixed(1) + 'px)';
      }
    }

    /* LITE: the section is unpinned, so there is no scroll range to scrub
       against — progressOf would sit at 0 and the queue would read as empty
       forever. Render the resolved end state once: reconnected, queue drained. */
    if (LITE) { render(1); return; }
    subscribe(function () { render(progressOf(sec)); });
  }

  /* ── Dashboard / analytics theatre ────────────────────────────────────── */
  function initAnalytics() {
    var sec = $('[data-analytics="1"]');
    if (!sec) return;
    var spark = $$('[data-spark] path', sec);
    var bars  = $$('[data-bars] i', sec);
    var cards = $$('[data-anrise]', sec);

    spark.forEach(function (p) {
      var len = p.getTotalLength ? p.getTotalLength() : 600;
      p.style.setProperty('--len', len);
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = len;
    });

    function render(p) {
      var draw = clamp((p - 0.12) / 0.5, 0, 1);

      spark.forEach(function (path, i) {
        var len = parseFloat(path.style.getPropertyValue('--len')) || 600;
        var local = clamp(draw * 1.25 - i * 0.14, 0, 1);
        path.style.strokeDashoffset = (len * (1 - local)).toFixed(1);
      });

      bars.forEach(function (b, i) {
        var target = parseFloat(b.getAttribute('data-h')) || 40;
        var local = clamp(draw * 1.5 - i * 0.07, 0, 1);
        b.style.height = (target * local).toFixed(1) + '%';
      });

      cards.forEach(function (c, i) {
        var local = clamp((p - 0.06 - i * 0.045) / 0.2, 0, 1);
        var e = 1 - Math.pow(1 - local, 3);
        c.style.opacity = e.toFixed(3);
        c.style.transform = 'translate3d(0,' + ((1 - e) * 22).toFixed(1) + 'px,0)';
      });
    }

    /* LITE: unpinned, so draw the charts complete rather than scrubbing them. */
    if (LITE) { render(1); return; }
    subscribe(function () { render(progressOf(sec)); });
  }

  /* ── LogoLoop ─────────────────────────────────────────────────────────── */
  function initLogoLoop() {
    var loops = $$('[data-loop]');
    if (!loops.length) return;

    var lastY = window.pageYOffset || 0;
    var velocity = 0;
    window.addEventListener('scroll', function () {
      var y = window.pageYOffset || 0;
      velocity = clamp((y - lastY) * 0.6, -60, 60);
      lastY = y;
    }, { passive: true });

    loops.forEach(function (loop) {
      var track = loop.querySelector('[data-looptrack]');
      if (!track) return;
      /* duplicate the row once so the wrap is seamless */
      track.innerHTML = track.innerHTML + track.innerHTML;
      var dir = parseFloat(loop.getAttribute('data-loop')) || 1;
      var base = parseFloat(loop.getAttribute('data-loop-speed')) || 42;   /* px per second */
      var x = 0, last = null, running = false, rafId = 0;

      /* scrollWidth was read inside the frame loop, which forces a synchronous
         layout of the whole track 60 times a second, forever. It only changes
         on resize, so measure it there instead. */
      var half = 0;
      function measure() { half = track.scrollWidth / 2; }
      measure();
      window.addEventListener('resize', measure);

      function frame(ts) {
        if (last === null) last = ts;
        var dt = Math.min(64, ts - last) / 1000;
        last = ts;
        if (half > 0) {
          x -= (base + Math.abs(velocity) * 1.4) * dir * dt;
          if (dir > 0 && x <= -half) x += half;
          if (dir < 0 && x >= 0) x -= half;
          track.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0)';
        }
        velocity *= 0.92;
        rafId = requestAnimationFrame(frame);
      }

      /* And it ran whether or not the strip was on screen. A marquee nobody
         can see is pure battery. Start and stop it with visibility. */
      function start() { if (running) return; running = true; last = null; rafId = requestAnimationFrame(frame); }
      function stop()  { if (!running) return; running = false; cancelAnimationFrame(rafId); }

      if (reduced) return;
      if (window.IntersectionObserver) {
        new IntersectionObserver(function (entries) {
          entries[0].isIntersecting ? start() : stop();
        }, { rootMargin: '100px' }).observe(loop);
      } else {
        start();
      }
      document.addEventListener('visibilitychange', function () {
        document.hidden ? stop() : start();
      });
    });
  }

  /* ── GradualBlur — builds the layered mask at a pinned frame's edge ───── */
  function initGradualBlur() {
    /* Seven stacked backdrop-filter layers per host. backdrop-filter forces the
       compositor to re-read what is behind the element on every frame it moves,
       which is the most expensive thing you can put on a scrolling mobile page —
       and the edges it softens belong to pins that LITE removes anyway. */
    if (LITE) return;
    $$('.vq-gblur').forEach(function (host) {
      if (host.childElementCount) return;
      var strength = parseFloat(host.getAttribute('data-blur')) || 2;
      var flip = host.getAttribute('data-edge') === 'top';
      for (var i = 0; i < 7; i++) {
        var seg = document.createElement('i');
        var k = flip ? (6 - i) : i;
        seg.style.setProperty('--b', ((k + 1) * strength * 0.28).toFixed(2) + 'px');
        seg.style.setProperty('--m0', 'rgba(0,0,0,0)');
        seg.style.setProperty('--m1', 'rgba(0,0,0,1)');
        seg.style.setProperty('--m2', 'rgba(0,0,0,1)');
        seg.style.setProperty('--m3', 'rgba(0,0,0,0)');
        host.appendChild(seg);
      }
    });
  }

  /* ── Pricing period toggle ────────────────────────────────────────────── */
  function initPricingToggle() {
    var wrap = $('[data-pricing]');
    if (!wrap) return;
    var btns = $$('[data-period]', wrap);
    var amts = $$('[data-price]', wrap);
    var pers = $$('[data-per-label]', wrap);

    function set(period) {
      btns.forEach(function (b) { b.classList.toggle('is-on', b.getAttribute('data-period') === period); });
      amts.forEach(function (a) {
        a.textContent = period === 'year' ? a.getAttribute('data-price-year') : a.getAttribute('data-price');
      });
      pers.forEach(function (p) { p.textContent = period === 'year' ? '/year' : '/month'; });
    }
    btns.forEach(function (b) {
      b.addEventListener('click', function () { set(b.getAttribute('data-period')); });
    });
    set('month');
  }

  /* ── Boot ─────────────────────────────────────────────────────────────── */
  function init() {
    initGradualBlur();
    initScrollFloat();
    initParallax();
    initSpotlight();
    initCountUp();
    initScrollStack();
    initOfflineTheater();
    initAnalytics();
    initLogoLoop();
    initPricingToggle();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
