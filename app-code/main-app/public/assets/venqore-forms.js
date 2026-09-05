/* ═══════════════════════════════════════════════════════════════════════════
   VenQore V6 — form wiring

   The V6 marketing pages were authored as static HTML with placeholder forms:
   [data-hero-prompt], [data-waitlist] and [data-demo] carried no handlers, no
   action and no method, so every one of them reloaded the page and lost what
   the visitor typed. This file is the whole conversion path.

     [data-hero-prompt]  homepage hero  → /build-workspace?prompt=<description>
     [data-waitlist]     "Start building" email capture (12 pages)
                                        → /build-workspace?email=<email>
     [data-demo] w/ message field  contact form → POST /contact

   The CSRF token comes from <meta name="csrf-token">, injected by
   App\Http\Controllers\Marketing\V6PageController. If the meta is absent the
   contact form says so rather than silently failing.

   No dependencies, no build step — this file is served as-is.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    var BUILD = '/build-workspace';

    function csrf() {
        var m = document.querySelector('meta[name="csrf-token"]');
        return m ? m.getAttribute('content') : '';
    }

    function go(url) {
        window.location.assign(url);
    }

    /* Inline status line under a form — the static pages have no flash-message
       slot, so we create one on demand rather than relying on a redirect. */
    function status(form, message, kind) {
        var el = form.querySelector('[data-form-status]');
        if (!el) {
            el = document.createElement('p');
            el.setAttribute('data-form-status', '');
            el.className = 'vq-caption vq-mt-4';
            el.setAttribute('role', 'status');
            el.setAttribute('aria-live', 'polite');
            form.appendChild(el);
        }
        el.textContent = message;
        el.style.color = kind === 'error' ? 'var(--vq-danger, #d64545)' : 'var(--vq-accent, #327882)';
    }

    /* ── 1 · Hero prompt ────────────────────────────────────────────────────
       "Describe your business" is the primary CTA of the whole site. Carry the
       text into the builder rather than dropping the visitor on an empty form. */
    var hero = document.querySelector('[data-hero-prompt]');
    if (hero) {
        var box = hero.querySelector('#hero-prompt') || hero.querySelector('textarea');

        var start = function (e) {
            if (e) e.preventDefault();
            var v = box && box.value ? box.value.trim() : '';
            if (!v) {
                if (box) box.focus();
                return;
            }
            // 600 chars is well under any sane URL limit and far more than the
            // builder needs to pick a preset.
            go(BUILD + '?prompt=' + encodeURIComponent(v.slice(0, 600)));
        };

        hero.addEventListener('submit', start);

        var goBtn = hero.querySelector('[data-hero-go]');
        if (goBtn) goBtn.addEventListener('click', start);

        if (box) {
            box.addEventListener('keydown', function (e) {
                // Enter submits, Shift+Enter keeps the newline.
                if (e.key === 'Enter' && !e.shiftKey) start(e);
            });
        }
    }

    /* ── 2 · "Start building" email capture ─────────────────────────────────
       All 12 of these sit under the heading "Describe your business. See what
       it becomes." — they are signup entry points, not a newsletter. */
    Array.prototype.forEach.call(
        document.querySelectorAll('[data-waitlist]'),
        function (form) {
            form.addEventListener('submit', function (e) {
                e.preventDefault();
                var input = form.querySelector('input[type="email"]');
                var v = input && input.value ? input.value.trim() : '';
                go(v ? BUILD + '?email=' + encodeURIComponent(v) : BUILD);
            });
        }
    );

    /* ── 3 · Contact form ───────────────────────────────────────────────────
       The only form here that genuinely posts to the app. Field names differ
       from what ContactController expects, so map them:
         business → company,  topic → subject. */
    Array.prototype.forEach.call(
        document.querySelectorAll('form[data-demo]'),
        function (form) {
            if (!form.querySelector('[name="message"]')) return; // not the contact form

            form.addEventListener('submit', function (e) {
                e.preventDefault();

                var token = csrf();
                if (!token) {
                    status(form, 'Something is wrong with this page. Please email us directly.', 'error');
                    return;
                }

                var val = function (n) {
                    var f = form.querySelector('[name="' + n + '"]');
                    return f ? f.value : '';
                };

                var body = new FormData();
                body.append('name', val('name'));
                body.append('email', val('email'));
                body.append('message', val('message'));
                body.append('company', val('business'));
                body.append('subject', val('topic'));
                body.append('_token', token);

                var btn = form.querySelector('button[type="submit"]');
                var label = btn ? btn.innerHTML : '';
                if (btn) {
                    btn.disabled = true;
                    btn.textContent = 'Sending…';
                }

                var restore = function () {
                    if (btn) {
                        btn.disabled = false;
                        btn.innerHTML = label;
                    }
                };

                fetch('/contact', {
                    method: 'POST',
                    body: body,
                    credentials: 'same-origin',
                    headers: {
                        'X-CSRF-TOKEN': token,
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                })
                    .then(function (res) {
                        if (res.ok) {
                            form.reset();
                            status(form, 'Thank you — your message is with us. A person answers this one.', 'ok');
                        } else if (res.status === 422) {
                            status(form, 'Please check the form and try again.', 'error');
                        } else {
                            status(form, 'That did not send. Please try again, or email us directly.', 'error');
                        }
                        restore();
                    })
                    .catch(function () {
                        status(form, 'That did not send — check your connection and try again.', 'error');
                        restore();
                    });
            });
        }
    );
})();
