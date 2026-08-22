/* ═══════════════════════════════════════════════════════════════════════════
   VenQore V6 — live demos
   Every dataset here is lifted from the product's own source of truth:
   the seven POS presets from LAW.pos.presets, the thirteen document types
   and their capability switches from DATA.types, the 108 readings from the
   card builder's READINGS registry. Nothing on this page is invented.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var el = function (t, c, h) { var n = document.createElement(t); if (c) n.className = c; if (h != null) n.innerHTML = h; return n; };

  var ICON = {
    grid:   '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>',
    cart:   '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2 2h2l2.7 12.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L22 6H5"/></svg>',
    box:    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>',
    ledger: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/></svg>',
    chart:  '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>',
    cog:    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    search: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
    check:  '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
  };

  /* ═══ 1 · THE REGISTER ══════════════════════════════════════════════════
     Seven presets, verbatim from LAW.pos.presets. A preset is not a layout —
     it is seeded values for the same eight knobs, and the engine re-derives
     the rest from measured floors. */
  var POS = [
    { id: 'scan', name: 'Scan', tag: 'No catalog. Scanner and keyboard only.',
      who: 'Large inventory over 2,000 SKUs, barcode-driven. Pharmacy, hardware, grocery, distribution.',
      why: 'A catalog nobody browses is 40% of the screen spent on nothing. Removing it is the single biggest calm-down available.',
      catalog: 'off', cart: .62, tender: .38, shape: 'column', floor: false, search: 'Scan a barcode, or type a name or SKU' },
    { id: 'column', name: 'Column', tag: 'A narrow catalog column, and a big cart.',
      who: 'Mixed inventory, 200–2,000 SKUs, where staff both scan and browse. General retail.',
      why: 'One tile wide is enough to confirm you picked the right thing, and cheap enough that the cart keeps the room it needs.',
      catalog: 'left', cw: .20, fit: 'up1', cart: .50, tender: .30, shape: 'column', floor: false },
    { id: 'row', name: 'Row', tag: 'A tile strip on top, cart underneath.',
      who: 'Small inventory under 200 SKUs, fast repeat items. Café, bakery, kiosk, pharmacy counter.',
      why: 'The band snaps to whole tile rows, so a 40% share that only buys one row hands the remaining pixels back to the cart.',
      catalog: 'top', fit: 'up3', cart: .70, tender: .30, shape: 'column', floor: false },
    { id: 'grid', name: 'Grid', tag: 'Catalog and cart share the screen 40 / 60.',
      who: 'Visual products, walk-up counters, staff who point rather than type. Café, QSR, boutique.',
      why: 'When the product IS the interface the cart only has to confirm — but the cart still gets the larger half, because that is the half the customer is reading.',
      catalog: 'left', cw: .40, fit: 'up2', cart: 1, tender: 0, shape: 'sheet', floor: false },
    { id: 'stack', name: 'Stack', tag: 'Catalog above, cart below, pay takes the screen.',
      who: 'Wide-but-short screens, and anyone who prefers to look down rather than across.',
      why: 'Vertical space is the cheapest space on a landscape till. Stacking spends it instead of fighting for width.',
      catalog: 'top', fit: 'up3', cart: 1, tender: 0, shape: 'sheet', floor: false, stacked: true },
    { id: 'counter', name: 'Counter', tag: 'One column. Cart first, everything docked.',
      who: 'Phone and small tablet, market stalls, delivery riders, single-hand use.',
      why: 'The dock is a real layout row whose height is subtracted before anything else is measured. A floating button was the bug.',
      catalog: 'overlay', cart: 1, tender: 0, shape: 'bar', floor: false, lean: 'is-minimal' },
    { id: 'table', name: 'Table', tag: 'Floor plan, then order.',
      who: 'Restaurants, cafés with table service, salons, any seat or slot business.',
      why: 'The unit of work is the table, not the sale — so the floor is a step, not a fourth column competing for width.',
      catalog: 'top', fit: 'up3', cart: .70, tender: .30, shape: 'column', floor: true },
  ];

  var CART = [
    ['Panadol 500mg ×20', 2, 185], ['Surgical mask (box)', 1, 640],
    ['Glucose strips', 3, 1250], ['Augmentin 625mg', 1, 890],
  ];
  var PRODUCTS = ['Panadol 500mg', 'Augmentin 625', 'Surgical mask', 'Glucose strips', 'Disprin', 'Brufen 400'];

  function posPane(cls, head, meta, body, foot) {
    var p = el('div', 'vq-pane');
    p.dataset.pane = cls;
    p.appendChild(el('div', 'vq-pane__head', '<span>' + head + '</span>' + (meta ? '<span>' + meta + '</span>' : '')));
    var b = el('div', 'vq-pane__body'); b.appendChild(body); p.appendChild(b);
    if (foot) { var f = el('div', 'vq-pane__foot'); f.appendChild(foot); p.appendChild(f); }
    return p;
  }

  function buildPos(root, p) {
    var stage = $('[data-pos-stage]', root);
    var pos = el('div', 'vq-pos' + (p.lean ? ' ' + p.lean : ''));

    var rail = el('div', 'vq-pos__rail');
    ['grid', 'cart', 'box', 'ledger', 'chart', 'cog'].forEach(function (k) { rail.appendChild(el('i', '', ICON[k])); });
    pos.appendChild(rail);

    var main = el('div', 'vq-pos__main');

    var top = el('div', 'vq-pos__top');
    top.appendChild(el('div', 'vq-pos__search',
      ICON.search + '<span>' + (p.search || 'Scan or search…') + '</span>'));
    top.appendChild(el('span', 'vq-pos__kbd', 'F1'));
    main.appendChild(top);

    var panes = el('div', 'vq-pos__panes' + (p.stacked ? ' is-stacked' : ''));

    /* Catalog — a resident pane, a band, or a button. Never a broken column. */
    var tiles = el('div', 'vq-pos__tiles ' + (p.fit || 'up2'));
    var n = p.catalog === 'top' ? 6 : 6;
    for (var i = 0; i < n; i++) {
      tiles.appendChild(el('div', 'vq-tile-p',
        '<i></i><b>' + PRODUCTS[i % PRODUCTS.length] + '</b><span>Rs ' + (120 + i * 65) + '</span>'));
    }
    if (p.catalog === 'left' || p.catalog === 'top') {
      var cat = posPane('catalog', 'Catalog', '22 items', tiles);
      cat.style.flex = p.catalog === 'left' ? '0 0 ' + (p.cw * 100) + '%' : '0 0 38%';
      panes.appendChild(cat);
    }

    if (p.floor) {
      var fl = el('div', 'vq-floor');
      ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'B1', 'B2', 'P1', 'P2'].forEach(function (t, i) {
        fl.appendChild(el('i', [0, 2, 5, 9].indexOf(i) >= 0 ? 'on' : '', t));
      });
      var fp = posPane('floor', 'Floor', '4 of 12 seated', fl);
      fp.style.flex = '0 0 26%';
      panes.appendChild(fp);
    }

    /* Cart */
    var lines = el('div');
    CART.forEach(function (c) {
      lines.appendChild(el('div', 'vq-cart__line',
        '<b>' + c[0] + '</b>' +
        '<span class="vq-cart__step"><i>−</i>' + c[1] + '<i>+</i></span>' +
        '<span class="rate">' + c[2].toLocaleString() + '</span>' +
        '<span class="tot">' + (c[1] * c[2]).toLocaleString() + '</span>'));
    });
    var cart = posPane('cart', 'Cart', CART.length + ' lines · 7 qty', lines);
    cart.style.flex = p.cart >= 1 ? '1 1 auto' : '0 0 ' + (p.cart * 100) + '%';
    panes.appendChild(cart);

    /* Tender — built once, used in three places */
    var tb = el('div');
    tb.appendChild(el('div', 'vq-tender__chips',
      '<span>Cash</span><span>Disc 5%</span><span>GST 18%</span><span>Main</span>'));
    [['Subtotal', '4,825'], ['Discount', '−241'], ['Tax 18%', '825']].forEach(function (r) {
      tb.appendChild(el('div', 'vq-tender__row', '<span>' + r[0] + '</span><span>' + r[1] + '</span>'));
    });
    tb.appendChild(el('div', 'vq-tender__total', '<span>Total</span><b>5,409</b>'));
    var acts = el('div', 'vq-pos__acts',
      '<span class="vq-pos__btn">Complete · 5,409</span>' +
      '<span class="vq-pos__btn vq-pos__btn--ghost">Hold</span>' +
      '<span class="vq-pos__btn vq-pos__btn--ghost">Drawer</span>');

    if (p.shape === 'column') {
      var td = posPane('tender', 'Tender', 'Ahsan Traders', tb, acts);
      td.style.flex = '0 0 ' + (p.tender * 100) + '%';
      panes.appendChild(td);
    }

    main.appendChild(panes);

    if (p.shape === 'sheet') {
      var dock = el('div', 'vq-pos__dock');
      dock.appendChild(el('span', 'vq-pos__btn', 'Take payment · Rs 5,409'));
      main.appendChild(dock);
    }
    if (p.shape === 'bar') {
      var bar = el('div', 'vq-pos__dock');
      if (p.catalog === 'overlay') bar.appendChild(el('span', 'vq-pos__btn vq-pos__btn--ghost', 'Catalog'));
      bar.appendChild(el('span', 'vq-pos__btn', 'Pay · Rs 5,409'));
      main.appendChild(bar);
    }

    pos.appendChild(main);
    stage.innerHTML = '';
    stage.appendChild(pos);

    var w = $('[data-pos-why]', root);
    if (w) w.innerHTML =
      '<b class="vq-small" style="font-weight:var(--vq-fw-semi)">' + p.tag + '</b>' +
      '<p class="vq-caption vq-mt-2" style="max-width:none">' + p.who + '</p>' +
      '<p class="vq-caption vq-mt-3" style="max-width:none;color:var(--vq-text-2);border-left:2px solid var(--vq-accent-quiet-line);padding-left:10px">' + p.why + '</p>';
  }

  $$('[data-pos]').forEach(function (root) {
    var tabs = $('[data-pos-tabs]', root);
    POS.forEach(function (p, i) {
      var b = el('button', 'vq-tab', p.name);
      b.type = 'button'; b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', String(i === 0));
      b.addEventListener('click', function () {
        $$('.vq-tab', tabs).forEach(function (x) { x.setAttribute('aria-selected', String(x === b)); });
        buildPos(root, p);
      });
      tabs.appendChild(b);
    });
    buildPos(root, POS[0]);

    /* Cycle through the presets once the section is on screen — the point is
       that the register recomposes, and a static shot cannot say that. */
    if (!REDUCED && 'IntersectionObserver' in window) {
      var i = 0, timer = null;
      new IntersectionObserver(function (en) {
        if (en[0].isIntersecting && !timer) {
          timer = setInterval(function () {
            i = (i + 1) % POS.length;
            $$('.vq-tab', tabs)[i].click();
            if (i === POS.length - 1) { clearInterval(timer); timer = 'done'; }
          }, 2600);
        }
      }, { threshold: 0.35 }).observe(root);
      tabs.addEventListener('click', function () { if (timer && timer !== 'done') { clearInterval(timer); timer = 'done'; } });
    }
  });

  /* ═══ 2 · THE DOCUMENT EDITOR ═══════════════════════════════════════════
     Thirteen types, verbatim from DATA.types. A type is a configuration —
     capability switches and label overrides — never a different screen. */
  var DOCS = [
    { id: 'sales_invoice',    name: 'Sales invoice',    px: 'INV',  side: 'Sell',  party: 'Customer', dens: 'standard', save: 'Complete sale',      rate: 'Price',     on: ['Party balance', 'Scan to add', 'Quick entry', 'Tax dropdown', 'Overpayment', 'Posted lock'] },
    { id: 'purchase_invoice', name: 'Purchase invoice', px: 'BILL', side: 'Buy',   party: 'Supplier', dens: 'pro',      save: 'Post purchase',      rate: 'Unit cost', on: ['Landed costs', 'Per-line tax', 'Business %', 'Zero-cost ack', 'Payable flip', 'Round-off'] },
    { id: 'quotation',        name: 'Quotation',        px: 'QT',   side: 'Sell',  party: 'Customer', dens: 'standard', save: 'Save quote',         rate: 'Price',     on: ['Valid until', 'Draft / sent / accepted', 'Convert to order'] },
    { id: 'sales_order',      name: 'Sales order',      px: 'SO',   side: 'Sell',  party: 'Customer', dens: 'standard', save: 'Confirm order',      rate: 'Price',     on: ['Reserve stock', 'Advance payment', 'Convert to invoice'] },
    { id: 'purchase_order',   name: 'Purchase order',   px: 'PO',   side: 'Buy',   party: 'Supplier', dens: 'standard', save: 'Place order',        rate: 'Unit cost', on: ['Tax-inclusive flag', 'Goods status', 'Receive against'] },
    { id: 'sale_return',      name: 'Sale return',      px: 'SRET', side: 'Sell',  party: 'Customer', dens: 'standard', save: 'Confirm return',     rate: 'Price',     on: ['Source document', 'Quantity cap', 'Reason required', 'Refund account'] },
    { id: 'purchase_return',  name: 'Purchase return',  px: 'PRET', side: 'Buy',   party: 'Supplier', dens: 'standard', save: 'Confirm return',     rate: 'Unit cost', on: ['Source document', 'Quantity cap', 'Batch pick', 'Reason required'] },
    { id: 'debit_note',       name: 'Debit note',       px: 'DN',   side: 'Buy',   party: 'Supplier', dens: 'standard', save: 'Create debit note',  rate: 'Unit cost', on: ['Reason required', 'Refund account', 'Warehouse restore'] },
    { id: 'goods_receipt',    name: 'Goods receipt',    px: 'GRN',  side: 'Buy',   party: 'Supplier', dens: 'standard', save: 'Receive goods',      rate: '—',         on: ['Ordered / received / remaining', 'Batch entry', 'Expiry entry'], off: ['Rate', 'Discount', 'Money summary'] },
    { id: 'expense',          name: 'Expense',          px: 'EXP',  side: 'Buy',   party: 'Payee',    dens: 'simple',   save: 'Save record',        rate: '—',         on: ['Category', 'Attachment', 'Tax amount', 'Cash or bank'], off: ['Line table'] },
    { id: 'stock_transfer',   name: 'Stock transfer',   px: 'TRF',  side: 'Stock', party: '—',        dens: 'simple',   save: 'Create transfer',    rate: '—',         on: ['Location pair', 'Quantity only', 'Draft / sent / accepted'], off: ['Party', 'Rate', 'Tax', 'Money summary'] },
    { id: 'stock_audit',      name: 'Stock audit',      px: 'AUD',  side: 'Stock', party: '—',        dens: 'simple',   save: 'Save audit',         rate: '—',         on: ['Expected / counted / difference', 'Draft / sent / accepted'], off: ['Party', 'Money summary'] },
    { id: 'recurring_invoice',name: 'Recurring invoice',px: 'REC',  side: 'Sell',  party: 'Customer', dens: 'standard', save: 'Save template',      rate: 'Price',     on: ['Frequency', 'Next run', 'Active / paused'] },
  ];

  var DENS = {
    simple:   { fields: ['Date', 'Reference #'], cols: ['Item', 'Qty', 'Rate', 'Total'], tot: ['Total', 'Settled', 'Balance'] },
    standard: { fields: ['Date', 'Party', 'Document #', 'Due date', 'Terms', 'Salesperson', 'Notes'],
                cols: ['#', 'Item', 'Qty', 'Rate', 'Disc', 'Total'],
                tot: ['Subtotal', 'Item discount', 'Document discount', 'Tax', 'Total', 'Settled', 'Balance'] },
    pro:      { fields: ['Date', 'Party', 'Document #', 'Supplier invoice #', 'Due date', 'Terms', 'Location', 'Project', 'Currency', 'FX rate', 'Salesperson', 'Notes'],
                cols: ['#', 'Item', 'Qty', 'Free', 'UoM', 'Rate', 'Disc', 'Tax', 'Total'],
                tot: ['Subtotal', 'Item discount', 'Document discount', 'Tax breakdown', 'Shipping', 'Extra', 'Round-off', 'Total', 'Settled', 'Balance'] },
  };
  var LINES = [['Panadol 500mg ×20', 12, 185], ['Surgical mask (box)', 4, 640], ['Glucose strips 50s', 6, 1250]];

  function buildDoc(root, d) {
    var stage = $('[data-doc-stage]', root);
    var D = DENS[d.dens];
    var noSummary = (d.off || []).indexOf('Money summary') >= 0;
    var noLines = (d.off || []).indexOf('Line table') >= 0;

    var wrap = el('div', 'vq-doc');
    var zones = el('div', 'vq-doc__zones' + (noSummary ? ' no-summary' : ''));
    var left = el('div', 'vq-doc__left');

    left.appendChild(el('span', 'vq-doc__zone-tag', 'Header · ' + D.fields.length + ' fields'));
    var f = el('div', 'vq-doc__fields');
    D.fields.forEach(function (name, i) {
      var label = name === 'Party' ? d.party : name === 'Document #' ? d.px + ' #' : name;
      var val = name === 'Party' ? (d.side === 'Buy' ? 'Khan Distributors' : d.side === 'Stock' ? '—' : 'Ahsan Traders')
        : name === 'Document #' ? d.px + '-000148'
        : name === 'Date' ? '4 Sep 2026'
        : name === 'Due date' ? '4 Oct 2026'
        : name === 'Terms' ? 'Net 30'
        : name === 'Currency' ? 'PKR' : name === 'FX rate' ? '1.0000'
        : name === 'Location' ? 'Main' : name === 'Project' ? '—'
        : name === 'Salesperson' ? 'Bilal' : '—';
      var n = el('div', 'vq-doc__field', '<b>' + label + '</b><span>' + val + '</span>');
      n.style.setProperty('--d', (i * 26) + 'ms');
      f.appendChild(n);
    });
    left.appendChild(f);

    if (!noLines) {
      left.appendChild(el('span', 'vq-doc__zone-tag', 'Lines · ' + D.cols.length + ' columns'));
      var tw = el('div', 'vq-doc__wrap');
      var cols = D.cols.map(function (c) { return c === 'Rate' ? d.rate : c; }).filter(function (c) { return c !== '—'; });
      var t = el('table', 'vq-doc__table');
      t.innerHTML = '<thead><tr>' + cols.map(function (c) {
        return '<th' + (['Qty', 'Rate', 'Price', 'Unit cost', 'Disc', 'Tax', 'Total', 'Free'].indexOf(c) >= 0 ? ' class="n"' : '') + '>' + c + '</th>';
      }).join('') + '</tr></thead><tbody>' + LINES.map(function (l, i) {
        return '<tr>' + cols.map(function (c) {
          if (c === '#') return '<td class="n">' + (i + 1) + '</td>';
          if (c === 'Item') return '<td>' + l[0] + '</td>';
          if (c === 'Qty') return '<td class="n">' + l[1] + '</td>';
          if (c === 'Free') return '<td class="n">0</td>';
          if (c === 'UoM') return '<td>Box</td>';
          if (c === 'Disc') return '<td class="n">5%</td>';
          if (c === 'Tax') return '<td class="n">18%</td>';
          if (c === 'Total') return '<td class="n">' + (l[1] * l[2]).toLocaleString() + '</td>';
          return '<td class="n">' + l[2].toLocaleString() + '</td>';
        }).join('') + '</tr>';
      }).join('') + '</tbody>';
      tw.appendChild(t); left.appendChild(tw);
    } else {
      left.appendChild(el('span', 'vq-doc__zone-tag', 'Lines · none'));
      left.appendChild(el('p', 'vq-caption', 'An expense has no line table. The amount, the category and the receipt are the whole record — so the editor removes the table rather than showing an empty one.'));
    }
    zones.appendChild(left);

    if (!noSummary) {
      var right = el('div', 'vq-doc__right');
      right.appendChild(el('span', 'vq-doc__zone-tag', 'Summary · ' + D.tot.length + ' rows'));
      var vals = { 'Subtotal': '18,520', 'Item discount': '−926', 'Document discount': '−200', 'Tax': '3,133',
        'Tax breakdown': '3,133', 'Shipping': '450', 'Extra': '0', 'Round-off': '−0.40',
        'Total': '20,977', 'Settled': '10,000', 'Balance': '10,977' };
      D.tot.forEach(function (r) {
        var isTot = r === 'Total';
        right.appendChild(el('div', isTot ? 'vq-tender__total' : 'vq-tender__row',
          '<span>' + (r === 'Settled' ? (d.side === 'Buy' ? 'Amount paid' : 'Amount received') : r) + '</span>' +
          (isTot ? '<b>' + vals[r] + '</b>' : '<span>' + vals[r] + '</span>')));
      });
      right.appendChild(el('div', 'vq-pos__btn', d.save));
      $('.vq-pos__btn', right).style.marginTop = '14px';
      zones.appendChild(right);
    }

    wrap.appendChild(zones);
    stage.innerHTML = ''; stage.appendChild(wrap);

    var meta = $('[data-doc-meta]', root);
    if (meta) {
      meta.innerHTML =
        '<div class="vq-row vq-wrap vq-gap-2">' +
          '<span class="vq-badge vq-badge--accent">' + d.side + '</span>' +
          '<span class="vq-badge">' + d.px + '-000148</span>' +
          '<span class="vq-badge">' + d.dens + ' density</span>' +
        '</div>' +
        '<p class="vq-caption vq-mt-4" style="max-width:none"><b style="color:var(--vq-text)">Switched on for this type</b></p>' +
        '<div class="vq-mods vq-mt-2">' + d.on.map(function (m, i) {
          return '<span class="vq-mod vq-mod--on" style="--d:' + (i * 30) + 'ms">' + ICON.check + m + '</span>';
        }).join('') + '</div>' +
        (d.off ? '<p class="vq-caption vq-mt-4" style="max-width:none"><b style="color:var(--vq-text)">Switched off</b></p>' +
          '<div class="vq-mods vq-mt-2">' + d.off.map(function (m, i) {
            return '<span class="vq-mod vq-mod--off" style="--d:' + (i * 30) + 'ms"><s>' + m + '</s></span>';
          }).join('') + '</div>' : '');
    }
  }

  $$('[data-doc]').forEach(function (root) {
    var tabs = $('[data-doc-tabs]', root);
    DOCS.forEach(function (d, i) {
      var b = el('button', 'vq-tab', d.name);
      b.type = 'button'; b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', String(i === 0));
      b.addEventListener('click', function () {
        $$('.vq-tab', tabs).forEach(function (x) { x.setAttribute('aria-selected', String(x === b)); });
        buildDoc(root, d);
      });
      tabs.appendChild(b);
    });
    buildDoc(root, DOCS[0]);
  });

  /* ═══ 3 · THE DASHBOARD THAT ASSEMBLES ITSELF ═══════════════════════════
     A sample of the 108 readings the builder ships. The user picks a
     reading — never a chart — and the card decides its own smallest honest
     size. Nothing here can be placed below the size it needs to be read. */
  var READINGS = [
    { k: 'sales.revenue',        a: 'Sales',      l: 'Total sale',           s: 'SCALAR',    v: 'Rs 1,284,300', d: '↑ 16.5%', c: 5, r: 2 },
    { k: 'sales.revenue_trend',  a: 'Sales',      l: 'Revenue trend',        s: 'SERIES',    chart: 'area',  c: 7, r: 3 },
    { k: 'sales.top_products',   a: 'Sales',      l: 'Top products',         s: 'RANKING',   chart: 'rank',  c: 5, r: 3 },
    { k: 'sales.payment_split',  a: 'Sales',      l: 'Payment breakdown',    s: 'BREAKDOWN', chart: 'bars',  c: 4, r: 2 },
    { k: 'sales.avg_order',      a: 'Sales',      l: 'Average order value',  s: 'SCALAR',    v: 'Rs 2,480',   d: '↑ 4.1%',  c: 4, r: 2 },
    { k: 'sales.return_rate',    a: 'Sales',      l: 'Return rate',          s: 'SCALAR',    v: '1.8%',       d: '↓ 0.3pt', c: 3, r: 2, down: true },
    { k: 'finance.gross_margin', a: 'Finance',    l: 'Gross margin',         s: 'SCALAR',    v: '31.4%',      d: '↓ 1.1pt', c: 4, r: 2, down: true },
    { k: 'finance.profit_trend', a: 'Finance',    l: 'Profit trend',         s: 'SERIES',    chart: 'area',  c: 6, r: 3 },
    { k: 'finance.receivable',   a: 'Finance',    l: 'Total receivable',     s: 'SCALAR',    v: 'Rs 612,400', d: '↑ 8.0%',  c: 4, r: 2 },
    { k: 'finance.payable',      a: 'Finance',    l: 'Total payable',        s: 'SCALAR',    v: '(438,900)',  d: '↑ 2.2%',  c: 4, r: 2, down: true },
    { k: 'finance.books_ok',     a: 'Finance',    l: 'Books balanced',       s: 'STATUS',    status: 'Balanced', c: 3, r: 2 },
    { k: 'finance.dso',          a: 'Finance',    l: 'Days sales outstanding', s: 'SCALAR',  v: '34',  unit: 'days', d: '↓ 3', c: 3, r: 2 },
    { k: 'inventory.value',      a: 'Inventory',  l: 'Inventory value',      s: 'SCALAR',    v: 'Rs 3,940,000', d: '↑ 1.9%', c: 5, r: 2 },
    { k: 'inventory.low_stock',  a: 'Inventory',  l: 'Low stock',            s: 'SCALAR',    v: '18',  unit: 'items', d: '↑ 4', c: 3, r: 2, down: true },
    { k: 'inventory.expiring',   a: 'Inventory',  l: 'Expiring in 30 days',  s: 'SCALAR',    v: '27',  unit: 'batches', d: '↑ 6', c: 3, r: 2, down: true },
    { k: 'inventory.turnover',   a: 'Inventory',  l: 'Inventory turnover',   s: 'SCALAR',    v: '5.2', unit: '× / yr', d: '↑ 0.4', c: 4, r: 2 },
    { k: 'inventory.dead_stock', a: 'Inventory',  l: 'Dead stock value',     s: 'SCALAR',    v: 'Rs 214,000', d: '↓ 9.1%', c: 4, r: 2 },
    { k: 'purchasing.spend',     a: 'Purchasing', l: 'Purchase spend trend', s: 'SERIES',    chart: 'area',  c: 6, r: 3 },
    { k: 'purchasing.lead_time', a: 'Purchasing', l: 'Average lead time',    s: 'SCALAR',    v: '6.4', unit: 'days', d: '↓ 1.1', c: 4, r: 2 },
    { k: 'purchasing.on_time',   a: 'Purchasing', l: 'On-time delivery',     s: 'SCALAR',    v: '92%',        d: '↑ 3pt',   c: 4, r: 2 },
    { k: 'operations.staff',     a: 'Operations', l: 'Present today',        s: 'SCALAR',    v: '9',  unit: 'of 11', d: '', c: 3, r: 2 },
    { k: 'operations.retention', a: 'Operations', l: 'Customer retention',   s: 'SCALAR',    v: '68%',        d: '↑ 2pt',   c: 4, r: 2 },
  ];

  function sparkPath(seed, w, h) {
    var s = seed, pts = [];
    for (var i = 0; i < 14; i++) { s = (s * 1103515245 + 12345) & 0x7fffffff; pts.push(0.35 + (s % 1000) / 1000 * 0.5 + i * 0.028); }
    return pts.map(function (v, i) {
      return (i ? 'L' : 'M') + (i / 13 * w).toFixed(1) + ' ' + (h - v * h * 0.9).toFixed(1);
    }).join(' ');
  }

  function cardHtml(x) {
    var body = '';
    if (x.chart === 'area') {
      var d = sparkPath(x.k.length * 977, 300, 74);
      body = '<div class="vq-chart" style="margin-top:auto;height:74px"><svg viewBox="0 0 300 74" preserveAspectRatio="none">' +
        '<defs><linearGradient id="g' + x.k.replace(/\W/g, '') + '" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="var(--vq-series-1-ink)" stop-opacity=".22"/>' +
        '<stop offset="100%" stop-color="var(--vq-series-1-ink)" stop-opacity="0"/></linearGradient></defs>' +
        '<path class="area" fill="url(#g' + x.k.replace(/\W/g, '') + ')" d="' + d + ' L300 74 L0 74 Z"/>' +
        '<path class="line" d="' + d + '"/></svg></div>';
    } else if (x.chart === 'rank') {
      body = '<div class="vq-rank" style="margin-top:12px">' + [['Panadol 500mg', '41.2%', 92], ['Augmentin 625', '33.8%', 76], ['Surgical masks', '28.1%', 63]]
        .map(function (r) {
          return '<div class="vq-rank__row"><span class="vq-rank__name">' + r[0] + '</span><span class="vq-rank__val">' + r[1] + '</span>' +
            '<span class="vq-rank__track"><span class="vq-rank__fill" style="--w:' + r[2] + '%;width:' + r[2] + '%"></span></span></div>';
        }).join('') + '</div>';
    } else if (x.chart === 'bars') {
      body = '<div class="vq-chart" style="margin-top:auto;height:54px"><svg viewBox="0 0 200 54" preserveAspectRatio="none">' +
        [46, 30, 38, 22, 50, 34].map(function (v, i) {
          return '<rect class="bar' + (i === 4 ? ' is-on' : '') + '" x="' + (i * 34) + '" y="' + (54 - v) + '" width="26" height="' + v + '"/>';
        }).join('') + '</svg></div>';
    } else if (x.s === 'STATUS') {
      body = '<div style="margin-top:auto"><span class="vq-status vq-status--ok">' + ICON.check + ' ' + x.status + '</span></div>';
    } else {
      body = '<div class="vq-stat" style="margin-top:auto">' +
        '<span class="vq-stat__value vq-stat__value--sm">' + x.v + (x.unit ? '<span class="vq-stat__unit">' + x.unit + '</span>' : '') + '</span>' +
        (x.d ? '<div class="vq-row vq-gap-2"><span class="vq-delta ' + (x.down ? 'vq-delta--down' : 'vq-delta--up') + '">' + x.d + '</span></div>' : '') +
        '</div>';
    }
    return '<div class="vq-dcard__head"><span class="vq-dcard__title">' + x.l + '</span>' +
      '<span class="vq-badge">' + x.c + '×' + x.r + '</span></div>' + body;
  }

  $$('[data-builder]').forEach(function (root) {
    var board = $('[data-builder-board]', root);
    var list  = $('[data-builder-list]', root);
    var count = $('[data-builder-count]', root);
    var picked = [];

    function draw() {
      if (!picked.length) {
        board.innerHTML = '<div class="vq-build__empty"><div><p class="vq-small" style="max-width:none">Nothing on the board yet.</p>' +
          '<p class="vq-caption vq-mt-2" style="max-width:none">Pick a reading on the right — the card sizes itself.</p></div></div>';
      } else {
        var g = el('div', 'vq-build__grid');
        picked.forEach(function (x, i) {
          var c = el('div', 'vq-dcard vq-fly c' + x.c + ' r' + x.r, cardHtml(x));
          c.classList.add('c' + x.c);
          c.style.gridColumn = 'span ' + x.c;
          c.style.gridRow = 'span ' + x.r;
          c.style.setProperty('--d', (i === picked.length - 1 ? 0 : 0) + 'ms');
          if (i === 0) c.classList.add('vq-dcard--accent');
          g.appendChild(c);
        });
        board.innerHTML = ''; board.appendChild(g);
      }
      if (count) count.textContent = picked.length + (picked.length === 1 ? ' card' : ' cards');
    }

    READINGS.forEach(function (x) {
      var row = el('button', 'vq-build__row',
        '<b>' + x.l + '</b><em>' + x.a + '</em><i>+</i>');
      row.type = 'button';
      row.addEventListener('click', function () {
        var at = picked.indexOf(x);
        if (at >= 0) { picked.splice(at, 1); row.classList.remove('is-on'); $('i', row).innerHTML = '+'; }
        else { picked.push(x); row.classList.add('is-on'); $('i', row).innerHTML = ICON.check; }
        draw();
      });
      list.appendChild(row);
    });

    /* Seed the board the way the product seeds it — never empty. */
    ['sales.revenue', 'sales.revenue_trend', 'finance.gross_margin', 'inventory.expiring', 'sales.top_products', 'finance.receivable']
      .forEach(function (k) { $$('.vq-build__row', list)[READINGS.map(function (r) { return r.k; }).indexOf(k)].click(); });
  });

  /* ═══ 4 · "WE ARE BUILDING YOUR SOFTWARE" ═══════════════════════════════
     Every module and every card in the catalogue drifts on screen. The ones
     the business asked for light up. The rest drain away. What flies into
     the frame is only ever what was chosen. */
  var CLOUD_MODULES = ['Point of sale', 'Products', 'Categories', 'Batch & expiry', 'Serial tracking', 'Variants',
    'Multi-branch stock', 'Stock transfers', 'Stock audit', 'Purchase orders', 'Goods receipt', 'Supplier khata',
    'Debit notes', 'Landed cost', 'Customer khata', 'Credit limits', 'Loyalty', 'Gift cards', 'Recipes / BOM',
    'Production runs', 'Wastage', 'Table service', 'Core Ledger', 'Chart of accounts', 'Bank & cash',
    'Bank reconciliation', 'Tax handling', 'Fixed assets', 'Expense manager', 'Payroll', 'Shift & attendance',
    'Roles & permissions', 'Approval chains', 'Price tiers', 'Sales orders', 'Quotations', 'Recurring invoices',
    'Reminders', 'Statements', 'VenSynQ channels', 'WooCommerce', 'Amazon', 'Barcode labels', 'Reports',
    'Signals', 'SmartCapture'];

  var PROFILES = {
    pharmacy: { label: 'Pharmacy · 2 branches',
      mods: ['Point of sale', 'Products', 'Batch & expiry', 'Multi-branch stock', 'Stock transfers', 'Purchase orders',
        'Goods receipt', 'Supplier khata', 'Customer khata', 'Credit limits', 'Core Ledger', 'Chart of accounts',
        'Bank & cash', 'Tax handling', 'Roles & permissions', 'Reports'],
      cards: ['sales.revenue', 'sales.revenue_trend', 'inventory.expiring', 'finance.receivable', 'finance.payable', 'finance.books_ok'] },
    cafe: { label: 'Café · one location',
      mods: ['Point of sale', 'Products', 'Recipes / BOM', 'Production runs', 'Wastage', 'Table service',
        'Shift & attendance', 'Core Ledger', 'Chart of accounts', 'Bank & cash', 'Expense manager', 'Reports'],
      cards: ['sales.revenue', 'sales.avg_order', 'finance.gross_margin', 'sales.top_products', 'operations.staff', 'inventory.value'] },
    wholesale: { label: 'Wholesale · 300 accounts',
      mods: ['Products', 'Sales orders', 'Price tiers', 'Credit limits', 'Customer khata', 'Statements',
        'Purchase orders', 'Supplier khata', 'Multi-branch stock', 'Core Ledger', 'Chart of accounts',
        'Tax handling', 'Signals', 'Reports'],
      cards: ['finance.receivable', 'sales.revenue_trend', 'operations.retention', 'purchasing.spend', 'finance.dso', 'sales.top_products'] },
  };

  $$('[data-assemble]').forEach(function (root) {
    var cloud = $('[data-assemble-cloud]', root);
    var out   = $('[data-assemble-out]', root);
    var cap   = $('[data-assemble-caption]', root);
    var tabs  = $('[data-assemble-tabs]', root);
    var flecks = {};

    CLOUD_MODULES.forEach(function (m) {
      var f = el('span', 'vq-fleck', m);
      flecks[m] = f; cloud.appendChild(f);
    });

    var running = null;
    function run(key) {
      var P = PROFILES[key];
      if (running) { clearTimeout(running); running = null; }
      out.classList.remove('is-in');
      cloud.style.opacity = '1';
      CLOUD_MODULES.forEach(function (m) { flecks[m].className = 'vq-fleck'; });
      cap.textContent = 'Reading the business — 46 modules on the table…';

      var t = [];
      var push = function (fn, ms) { t.push(setTimeout(fn, REDUCED ? 0 : ms)); };
      var STEP = 95, lit = 900 + P.mods.length * STEP;

      /* 1 · every module VenQore ships is on screen. The ones this business
             asked for light up, one at a time, so you can read them. */
      P.mods.forEach(function (m, i) {
        push(function () { if (flecks[m]) flecks[m].classList.add('is-picked'); }, 900 + i * STEP);
      });
      push(function () {
        cap.innerHTML = '<b style="color:var(--vq-accent-text)">' + P.mods.length + ' selected</b> · ' +
          (CLOUD_MODULES.length - P.mods.length) + ' left off';
      }, lit);

      /* 2 · and everything it did not ask for drains away */
      push(function () {
        CLOUD_MODULES.forEach(function (m, i) {
          if (P.mods.indexOf(m) < 0) setTimeout(function () { flecks[m].classList.add('is-dropped'); }, REDUCED ? 0 : (i % 11) * 45);
        });
        cap.textContent = 'Naming your fields, setting roles, wiring the ledger…';
      }, lit + 1100);

      /* 3 · the chosen ones converge into the frame */
      push(function () {
        var box = cloud.getBoundingClientRect();
        P.mods.forEach(function (m, i) {
          var f = flecks[m], r = f.getBoundingClientRect();
          f.style.setProperty('--tx', ((box.left + box.width / 2) - (r.left + r.width / 2)) + 'px');
          f.style.setProperty('--ty', ((box.top + box.height / 2) - (r.top + r.height / 2)) + 'px');
          setTimeout(function () { f.classList.add('is-flying'); }, REDUCED ? 0 : i * 32);
        });
      }, lit + 2300);

      /* 4 · and the software is there */
      push(function () {
        cloud.style.opacity = '0';
        out.innerHTML = renderResult(P);
        out.classList.add('is-in');
        cap.innerHTML = P.label + ' · <b style="color:var(--vq-accent-text)">' + P.mods.length + ' modules · ' +
          P.cards.length + ' cards</b> · ledger live · <button type="button" data-replay style="color:var(--vq-accent-text);text-decoration:underline;text-underline-offset:3px;font:inherit">replay</button>';
        var rp = cap.querySelector('[data-replay]');
        if (rp) rp.addEventListener('click', function () { run(key); });
      }, lit + 3200);

      root._clear = function () { t.forEach(clearTimeout); };
    }

    function renderResult(P) {
      var byKey = {};
      READINGS.forEach(function (r) { byKey[r.k] = r; });
      return '<div class="vq-app" style="height:100%">' +
        '<div class="vq-app__bar"><div class="vq-app__dots"><i></i><i></i><i></i></div>' +
        '<div class="vq-app__omni">' + ICON.search + ' Ask your business a question…</div>' +
        '<div style="margin-left:auto"><span class="vq-badge vq-badge--accent">' + P.label + '</span></div></div>' +
        '<div class="vq-app__body"><nav class="vq-app__rail">' +
          ['Dashboard', 'Sell', 'Stock', 'Buy', 'Money', 'People', 'Reports'].map(function (n, i) {
            return '<span class="vq-app__nav"' + (i === 0 ? ' aria-current="true"' : '') + '>' +
              ICON[['grid', 'cart', 'box', 'ledger', 'ledger', 'chart', 'chart'][i]] + ' ' + n + '</span>';
          }).join('') + '</nav>' +
        '<div class="vq-app__main"><div class="vq-cards">' +
          P.cards.map(function (k, i) {
            var x = byKey[k]; if (!x) return '';
            return '<div class="vq-dcard vq-fly ' + (i === 0 ? 'vq-dcard--accent ' : '') + 'c' + x.c + ' r' + x.r + '" style="--d:' + (i * 90) + 'ms">' + cardHtml(x) + '</div>';
          }).join('') +
        '</div></div></div></div>';
    }

    if (tabs) {
      Object.keys(PROFILES).forEach(function (k, i) {
        var b = el('button', 'vq-tab', PROFILES[k].label.split(' ·')[0]);
        b.type = 'button'; b.setAttribute('aria-selected', String(i === 0));
        b.addEventListener('click', function () {
          $$('.vq-tab', tabs).forEach(function (x) { x.setAttribute('aria-selected', String(x === b)); });
          if (root._clear) root._clear();
          run(k);
        });
        tabs.appendChild(b);
      });
    }

    var fired = false;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en, obs) {
        if (!en[0].isIntersecting || fired) return;
        fired = true; obs.disconnect(); run('pharmacy');
      }, { threshold: 0.3 }).observe(root);
    } else run('pharmacy');
  });

  /* ═══ 5 · SMARTCAPTURE ══════════════════════════════════════════════════ */
  var CAP = {
    photo: {
      label: 'Photo of a supplier bill',
      note: 'One page. 11 seconds. It would have been 20 minutes of typing.',
      head: ['Purchase', 'Khan Distributors', 'BILL-4471 · 4 Sep'],
      rows: [
        ['Cola 500ml (24-case)', 'BEV-COLA-500', 5, 1680, 'matched'],
        ['Dark chocolate bar',   'SNK-CHOCO-01', 40, 78,  'matched'],
        ['Mango juice 1L',       'BEV-MNGO-1L',  12, 132, 'matched'],
        ['Lemon soda 300ml',     '—',            24, 46,  'new'],
      ],
    },
    voice: {
      label: 'A voice note, in Urdu or English',
      note: 'Said while walking back from the counter. Posted before he sat down.',
      head: ['Sale', 'Bilal General Store', 'Credit · 30 days'],
      quote: '“Bilal ko teen cola, do hand wash aur ek coffee jar udhaar pe de diye.”',
      rows: [
        ['Cola 500ml',  'BEV-COLA-500', 3, 80,  'matched'],
        ['Hand wash',   'CARE-HW-01',   2, 210, 'matched'],
        ['Coffee jar',  'BEV-COFF-JR',  1, 540, 'matched'],
      ],
    },
    screenshot: {
      label: 'A screenshot from WhatsApp',
      note: 'The order arrived as a picture of a list. It leaves as a sales order.',
      head: ['Sales order', 'Noor Traders', 'SO-000312 · delivery Fri'],
      rows: [
        ['Panadol 500mg ×20', 'MED-PAN-500', 30, 185,  'matched'],
        ['Surgical mask box', 'MED-MSK-50',  10, 640,  'matched'],
        ['Glucose strips 50s','MED-GLU-50',   6, 1250, 'matched'],
      ],
    },
  };

  $$('[data-capture]').forEach(function (root) {
    var tabs  = $('[data-capture-tabs]', root);
    var stage = $('[data-capture-stage]', root);
    var outEl = $('[data-capture-out]', root);
    var btn   = $('[data-capture-run]', root);
    var mode = 'photo', phase = 'idle', timer = null;

    function draw() {
      var C = CAP[mode];

      /* Left — the thing you point at it. */
      if (mode === 'voice') {
        var bars = '';
        for (var i = 0; i < 30; i++) bars += '<i></i>';
        stage.innerHTML = '<div class="vq-wave' + (phase === 'working' ? ' is-live' : '') + '">' + bars + '</div>';
      } else {
        stage.innerHTML = '<div class="vq-receipt"><i class="hd"></i><i style="width:92%"></i><i style="width:78%"></i>' +
          '<i style="width:86%"></i><i style="width:64%"></i><i style="width:80%"></i><i style="width:56%"></i><i class="tot"></i></div>' +
          (phase === 'working' ? '<div class="vq-cap__scan"></div>' : '');
      }

      /* Right — what comes back. */
      if (phase === 'idle') {
        outEl.innerHTML = '<span class="vq-eyebrow">' + C.label + '</span>' +
          '<p class="vq-lede vq-mt-4" style="font-size:var(--vq-fs-body)">' + C.note + '</p>' +
          '<p class="vq-caption vq-mt-auto" style="max-width:none;padding-top:var(--vq-space-6)">Nothing posts until you press Post. Every line shows what it matched to, and what it could not.</p>';
        btn.textContent = mode === 'voice' ? 'Play the note' : 'Read it';
        btn.disabled = false;
      } else if (phase === 'working') {
        outEl.innerHTML = '<span class="vq-eyebrow vq-eyebrow--accent">Reading</span>' +
          '<div class="vq-steps vq-mt-4">' +
          ['Finding the lines', 'Matching to your catalogue', 'Reading quantities and rates', 'Checking against your last price']
            .map(function (s, i) { return '<div class="vq-step' + (i === 0 ? ' is-live' : '') + '"><span class="vq-step__mark"></span>' + s + '…</div>'; })
            .join('') + '</div>';
        var steps = $$('.vq-step', outEl), i = 0;
        timer = setInterval(function () {
          if (i > 0) { steps[i - 1].classList.remove('is-live'); steps[i - 1].classList.add('is-done'); steps[i - 1].querySelector('.vq-step__mark').innerHTML = ICON.check; }
          if (i >= steps.length) { clearInterval(timer); phase = 'done'; draw(); return; }
          steps[i].classList.add('is-live'); i++;
        }, REDUCED ? 1 : 420);
        btn.textContent = 'Reading…'; btn.disabled = true;
      } else {
        var total = C.rows.reduce(function (s, r) { return s + r[2] * r[3]; }, 0);
        outEl.innerHTML =
          '<div class="vq-row vq-wrap vq-gap-2" style="justify-content:space-between">' +
            '<span class="vq-eyebrow vq-eyebrow--accent">Ready to post</span>' +
            '<span class="vq-status vq-status--ok">' + ICON.check + ' ' + C.rows.length + ' lines read</span>' +
          '</div>' +
          '<div class="vq-row vq-wrap vq-gap-2 vq-mt-3">' + C.head.map(function (h, i) {
            return '<span class="vq-badge' + (i === 0 ? ' vq-badge--accent' : '') + '">' + h + '</span>';
          }).join('') + '</div>' +
          (C.quote ? '<p class="vq-caption vq-mt-4" style="max-width:none;font-style:italic;color:var(--vq-text-2)">' + C.quote + '</p>' : '') +
          '<div class="vq-cap__rows vq-mt-4">' + C.rows.map(function (r, i) {
            return '<div class="vq-cap__row" style="--d:' + (i * 70) + 'ms">' +
              '<div><b>' + r[0] + '</b><em>' + r[1] + '</em></div>' +
              '<span class="vq-cap__match' + (r[4] === 'new' ? ' vq-cap__match--new' : '') + '">' + (r[4] === 'new' ? 'new item' : 'matched') + '</span>' +
              '<span>' + r[2] + ' × ' + r[3].toLocaleString() + '</span>' +
              '<span class="m">' + (r[2] * r[3]).toLocaleString() + '</span></div>';
          }).join('') + '</div>' +
          '<div class="vq-tender__total vq-mt-4"><span>Total</span><b>Rs ' + total.toLocaleString() + '</b></div>' +
          '<p class="vq-caption vq-mt-4" style="max-width:none">' +
            (C.rows.some(function (r) { return r[4] === 'new'; })
              ? 'One line has no match in your catalogue. It is flagged, not guessed — you decide whether to create it.'
              : 'Every line matched an item you already stock, at the rate you last paid.') +
          '</p>';
        btn.textContent = 'Post it'; btn.disabled = false;
      }
    }

    ['photo', 'voice', 'screenshot'].forEach(function (m, i) {
      var b = el('button', 'vq-tab', m === 'photo' ? 'Photo' : m === 'voice' ? 'Voice note' : 'Screenshot');
      b.type = 'button'; b.setAttribute('aria-selected', String(i === 0));
      b.addEventListener('click', function () {
        $$('.vq-tab', tabs).forEach(function (x) { x.setAttribute('aria-selected', String(x === b)); });
        if (timer) clearInterval(timer);
        mode = m; phase = 'idle'; draw();
      });
      tabs.appendChild(b);
    });

    btn.addEventListener('click', function () {
      if (phase === 'idle') { phase = 'working'; draw(); }
      else if (phase === 'done') {
        btn.textContent = 'Posted · ledger updated';
        btn.classList.remove('vq-btn--primary'); btn.classList.add('vq-btn--secondary');
        btn.disabled = true;
      }
    });

    draw();
    if (!REDUCED && 'IntersectionObserver' in window) {
      var fired = false;
      new IntersectionObserver(function (en, obs) {
        if (!en[0].isIntersecting || fired) return;
        fired = true; obs.disconnect();
        setTimeout(function () { if (phase === 'idle') btn.click(); }, 600);
      }, { threshold: 0.4 }).observe(root);
    }
  });
})();
