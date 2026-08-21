import { page, icon } from '../shell.js';
import { mockDashboard } from '../bits.js';

const TYPES = [
  ['store',   'Retail shop',        'General retail, one counter'],
  ['cart',    'Grocery / karyana',  'High SKU count, fast checkout'],
  ['pill',    'Pharmacy',           'Batch, expiry, distributors'],
  ['coffee',  'Café',               'Counter service, own recipes'],
  ['coffee',  'Restaurant',         'Tables, kitchen, ingredients'],
  ['factory', 'Bakery',             'Production runs and wastage'],
  ['plug',    'Mobile &amp; electronics', 'IMEI, serials, warranties'],
  ['layers',  'Clothing',           'Size and colour variants'],
  ['wrench',  'Hardware &amp; tools',    'Deep catalogue, units'],
  ['truck',   'Wholesale',          'Price tiers, credit terms'],
  ['branch',  'Multi-branch retail','More than one location'],
  ['search',  "I'm not sure yet",   "Describe it and we'll work it out"],
];

const STEPS = ['Business', 'Describe', 'Details', 'Blueprint', 'Plan', 'Account'];

const body = `
<div class="vq-wiz">

  <div class="vq-wiz__bar">
    <div class="vq-wiz__track"><div class="vq-wiz__fill" data-wiz-fill></div></div>
    <div class="vq-container" style="height:64px;display:flex;align-items:center;justify-content:space-between;gap:var(--vq-space-6)">
      <a class="vq-brand" href="index.html" aria-label="VenQore home">
        <img src="assets/logo.png" alt="" width="26" height="26" style="height:26px">
        <span class="vq-brand__word" style="font-size:18px">VenQore</span>
      </a>
      <ol class="vq-row vq-gap-6" data-wiz-steps style="overflow-x:auto;scrollbar-width:none">
        ${STEPS.map((s, i) => `<li class="vq-eyebrow" data-step-label="${i}" style="white-space:nowrap">${s}</li>`).join('')}
      </ol>
      <button class="vq-theme-btn" data-theme-toggle type="button" aria-label="Switch theme">
        <span class="vq-icon-sun">${icon('sun', 17)}</span><span class="vq-icon-moon">${icon('moon', 17)}</span>
      </button>
    </div>
  </div>

  <div class="vq-wiz__stage">

    <!-- 0 · Business type ------------------------------------------------ -->
    <section class="vq-wiz__panel is-on" data-panel="0">
      <span class="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Step 1 of 6</span>
      <h1 class="vq-h1 vq-mt-4">What kind of business?</h1>
      <p class="vq-lede vq-mt-3">Pick the closest — you can change everything later.</p>
      <div class="vq-pick vq-mt-8">
        ${TYPES.map((t, i) => `
        <button class="vq-pick__card" type="button" data-type="${i}" aria-pressed="false">
          ${icon(t[0], 22)}<b>${t[1]}</b><span>${t[2]}</span>
        </button>`).join('')}
      </div>
    </section>

    <!-- 1 · Describe ------------------------------------------------------ -->
    <section class="vq-wiz__panel" data-panel="1">
      <span class="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Step 2 of 6</span>
      <h2 class="vq-h1 vq-mt-4">Now tell us how it actually works.</h2>
      <p class="vq-lede vq-mt-3">Sentences, not a form. What you sell, how you buy, who works there,
        what your accountant asks for. The more you say, the less you have to fix afterwards.</p>
      <div class="vq-card vq-card--xl vq-mt-8">
        <label class="vq-label" for="wiz-desc">Your business, in your words</label>
        <textarea class="vq-textarea vq-mt-2" id="wiz-desc" data-wiz-desc rows="6"
          placeholder="I run two pharmacy branches. I buy on 30-day credit from four distributors, I need batch and expiry tracking, and my accountant wants a trial balance every month."></textarea>
        <div class="vq-row vq-wrap vq-gap-2 vq-mt-4">
          <span class="vq-caption">Or borrow one:</span>
          <button type="button" class="vq-chip" data-example="pharmacy">Pharmacy</button>
          <button type="button" class="vq-chip" data-example="wholesale">Wholesale</button>
          <button type="button" class="vq-chip" data-example="cafe">Café</button>
        </div>
      </div>
      <div class="vq-row vq-gap-3 vq-mt-6">
        <button class="vq-btn vq-btn--secondary vq-btn--lg" data-back>Back</button>
        <button class="vq-btn vq-btn--primary vq-btn--lg" data-next>Continue <span class="vq-btn__arrow">${icon('arrow', 16)}</span></button>
      </div>
    </section>

    <!-- 2 · Details ------------------------------------------------------- -->
    <section class="vq-wiz__panel" data-panel="2">
      <span class="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Step 3 of 6</span>
      <h2 class="vq-h1 vq-mt-4">Four things that change the build.</h2>
      <p class="vq-lede vq-mt-3">Only questions whose answer changes your configuration. Nothing here
        is a marketing field.</p>
      <div class="vq-card vq-card--xl vq-mt-8">
        <div class="vq-grid vq-grid--2" style="gap:var(--vq-space-5)">
          <div class="vq-field">
            <label class="vq-label" for="w-biz">Business name</label>
            <input class="vq-input" id="w-biz" data-wiz-name placeholder="Al-Madina Pharmacy">
            <span class="vq-help">Appears on every receipt, invoice and statement.</span>
          </div>
          <div class="vq-field">
            <label class="vq-label" for="w-cur">Currency</label>
            <select class="vq-select" id="w-cur">
              <option>PKR — Pakistani Rupee (Rs)</option>
              <option>AED — UAE Dirham (د.إ)</option>
              <option>SAR — Saudi Riyal (﷼)</option>
              <option>USD — US Dollar ($)</option>
              <option>GBP — Pound Sterling (£)</option>
            </select>
            <span class="vq-help">Becomes the system default. Critical — it sets the ledger.</span>
          </div>
          <div class="vq-field">
            <label class="vq-label" for="w-loc">How many locations?</label>
            <select class="vq-select" id="w-loc" data-wiz-loc>
              <option value="1">Just one</option>
              <option value="2">2 to 3</option>
              <option value="5">4 to 10</option>
              <option value="12">More than 10</option>
            </select>
          </div>
          <div class="vq-field">
            <label class="vq-label" for="w-team">How many people work there?</label>
            <select class="vq-select" id="w-team" data-wiz-team>
              <option value="2">Just me, or two of us</option>
              <option value="3">3 to 5</option>
              <option value="10">6 to 15</option>
              <option value="40">More than 15</option>
            </select>
            <span class="vq-help">Sets your roles, approval chain and seat count.</span>
          </div>
        </div>
      </div>
      <div class="vq-row vq-gap-3 vq-mt-6">
        <button class="vq-btn vq-btn--secondary vq-btn--lg" data-back>Back</button>
        <button class="vq-btn vq-btn--primary vq-btn--lg" data-next>Build my system <span class="vq-btn__arrow">${icon('arrow', 16)}</span></button>
      </div>
    </section>

    <!-- 3 · Building + Blueprint ------------------------------------------ -->
    <section class="vq-wiz__panel" data-panel="3">
      <div data-wiz-building>
        <span class="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Working</span>
        <h2 class="vq-h1 vq-mt-4">Reading your business…</h2>
        <p class="vq-lede vq-mt-3">This takes a few seconds. Nothing is created yet — you'll see the
          whole plan before anything is real.</p>
        <div class="vq-card vq-card--xl vq-mt-8">
          <div class="vq-steps" data-wiz-steps-list></div>
        </div>
      </div>

      <div data-wiz-plan hidden>
        <span class="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Step 4 of 6</span>
        <h2 class="vq-h1 vq-mt-4">Your Blueprint</h2>
        <p class="vq-lede vq-mt-3" data-wiz-summary></p>
        <div class="vq-card vq-card--xl vq-mt-8" data-wiz-blueprint></div>
        <div class="vq-row vq-gap-3 vq-mt-6">
          <button class="vq-btn vq-btn--secondary vq-btn--lg" data-back>Back</button>
          <button class="vq-btn vq-btn--primary vq-btn--lg" data-next>Looks right <span class="vq-btn__arrow">${icon('arrow', 16)}</span></button>
        </div>
        <p class="vq-caption vq-mt-4" style="max-width:none">Every line is editable, now and later.
          Nothing posts to your books until you approve it.</p>
      </div>
    </section>

    <!-- 4 · Plan ---------------------------------------------------------- -->
    <section class="vq-wiz__panel" data-panel="4">
      <span class="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Step 5 of 6</span>
      <h2 class="vq-h1 vq-mt-4">Pick a plan, or don't.</h2>
      <p class="vq-lede vq-mt-3">The trial is 14 days on the full product either way. We've marked the
        one that fits what you just told us.</p>
      <div class="vq-grid vq-grid--3 vq-mt-8" data-wiz-plans></div>
      <div class="vq-row vq-gap-3 vq-mt-6">
        <button class="vq-btn vq-btn--secondary vq-btn--lg" data-back>Back</button>
        <button class="vq-btn vq-btn--primary vq-btn--lg" data-next>Continue <span class="vq-btn__arrow">${icon('arrow', 16)}</span></button>
      </div>
      <p class="vq-caption vq-mt-4" style="max-width:none">No card now. We'll remind you before day 14.</p>
    </section>

    <!-- 5 · Account ------------------------------------------------------- -->
    <section class="vq-wiz__panel" data-panel="5" style="max-width:460px">
      <span class="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Step 6 of 6</span>
      <h2 class="vq-h1 vq-mt-4">Last thing.</h2>
      <p class="vq-lede vq-mt-3">This is the account that owns your ledger.</p>
      <div class="vq-card vq-card--xl vq-mt-8">
        <form class="vq-stack vq-gap-5" data-demo>
          <div class="vq-field">
            <label class="vq-label" for="w-email">Work email</label>
            <input class="vq-input" id="w-email" type="email" required autocomplete="email" placeholder="you@company.com">
            <span class="vq-help">We'll send the login link here.</span>
          </div>
          <div class="vq-field">
            <label class="vq-label" for="w-pass">Password</label>
            <input class="vq-input" id="w-pass" type="password" required autocomplete="new-password" minlength="10">
            <span class="vq-help">At least 10 characters.</span>
          </div>
          <label class="vq-check">
            <input type="checkbox" required>
            <span class="vq-caption" style="max-width:none">I agree to the <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a>.</span>
          </label>
          <button type="button" class="vq-btn vq-btn--primary vq-btn--xl vq-btn--block" data-next>
            Create my system <span class="vq-btn__arrow">${icon('arrow', 17)}</span>
          </button>
        </form>
      </div>
      <button class="vq-btn vq-btn--ghost vq-btn--lg vq-mt-4" data-back>Back</button>
    </section>

    <!-- 6 · Done ---------------------------------------------------------- -->
    <section class="vq-wiz__panel" data-panel="6" style="max-width:1400px">
      <div class="vq-center" style="max-width:640px;margin-inline:auto">
        <span class="vq-status vq-status--ok">${icon('check', 12)} Live</span>
        <h2 class="vq-display vq-mt-4">Your system is live.</h2>
        <p class="vq-lede vq-mt-4" style="margin-inline:auto">Ledger wired, chart of accounts seeded,
          your words applied. Nothing in it is a template — it is the composition you just approved.</p>
        <div class="vq-row vq-gap-3 vq-mt-8" style="justify-content:center">
          <a class="vq-btn vq-btn--primary vq-btn--lg" href="#">Add your first product <span class="vq-btn__arrow">${icon('arrow', 16)}</span></a>
          <a class="vq-btn vq-btn--secondary vq-btn--lg" href="index.html">Back to the site</a>
        </div>
      </div>
      <div class="vq-mt-12">${mockDashboard()}</div>
    </section>

  </div>
</div>`;

const wizardJS = `<script>
(function(){
'use strict';
var $=function(s,r){return (r||document).querySelector(s)},
    $$=function(s,r){return [].slice.call((r||document).querySelectorAll(s))};

var EXAMPLES={
 pharmacy:"I run two pharmacy branches. I buy on 30-day credit from four distributors, I need batch and expiry tracking, and my accountant wants a trial balance every month.",
 wholesale:"We distribute FMCG to about 300 shops. Everyone buys on different price tiers, most on credit, and I need to know which customer stopped ordering.",
 cafe:"Small caf\\u00e9, one location, six staff. We make our own bread and pastries, we sell over the counter, and I keep losing track of what the flour actually costs me."
};

/* The composition rules. This is a public demonstration of what the builder
   does — the same eleven signals the capability resolver reads, applied to
   the same module list. Nothing here is invented for the page. */
var BASE=['Point of sale','Products','Customers','Core Ledger','Chart of accounts','Cash & bank','Tax handling','Reports','Roles & permissions'];
var SIGNALS=[
 {re:/expir|batch|pharma|medicine|drug/i,   add:['Batch & expiry','Expiring-soon alerts'],   why:'expiry'},
 {re:/credit|khata|owe|due|30.day|receivab/i,add:['Customer khata','Aged receivables','Credit limits'], why:'credit'},
 {re:/supplier|distributor|purchas|buy /i,  add:['Purchase orders','Supplier khata','Aged payables'], why:'suppliers'},
 {re:/branch|location|store[s]|outlet/i,    add:['Multi-branch stock','Stock transfers','Per-branch pricing'], why:'branches'},
 {re:/recipe|bake|kitchen|ingredient|cook|caf|restaur|flour/i, add:['Recipes / BOM','Ingredient draw-down','Wastage'], why:'recipes'},
 {re:/tier|wholesale|distribut|b2b/i,       add:['Price tiers','Sales orders','Statements'], why:'wholesale'},
 {re:/imei|serial|warrant|mobile|electron/i,add:['Serial & IMEI tracking','Warranty register'], why:'serials'},
 {re:/size|colour|color|variant|cloth|garment|apparel/i, add:['Variant factory','Variant-aware costing'], why:'variants'},
 {re:/staff|employee|people|shift|attend|team/i, add:['Shift & attendance','Approval chains'], why:'staff'},
 {re:/online|website|amazon|woocommerce|ebay|tiktok|channel/i, add:['VenSynQ channels','Channel commission isolation'], why:'channels'},
 {re:/trial balance|accountant|p&l|profit|balance sheet|ledger/i, add:['Trial balance','Profit & loss','Balance sheet'], why:'accounting'}
];
var ALL_OFF=['Recipes / BOM','Table service','Production runs','Serial & IMEI tracking','Variant factory','Multi-branch stock','Price tiers','VenSynQ channels','Batch & expiry','Loyalty','Gift cards'];
var OPTIONAL=['Loyalty','Gift cards','Online store','Proposals & quotes','Recurring invoices','Barcode labels'];

var TYPE_HINT=['retail shop','grocery shop with a lot of SKUs','pharmacy with batch and expiry','caf\\u00e9 with our own recipes','restaurant with a kitchen','bakery with production runs','mobile and electronics shop with IMEI tracking','clothing shop with size and colour variants','hardware shop with a deep catalogue','wholesale distributor with price tiers','retail business with several branches',''];

var state={step:0,type:-1,desc:'',loc:1,team:2,plan:1,mods:[],off:[]};

var fill=$('[data-wiz-fill]');
function show(n){
 state.step=n;
 $$('.vq-wiz__panel').forEach(function(p){p.classList.toggle('is-on',+p.dataset.panel===n)});
 $$('[data-step-label]').forEach(function(l,i){
   l.style.color = i<n ? 'var(--vq-accent-text)' : i===n ? 'var(--vq-text)' : 'var(--vq-text-3)';
   l.style.fontWeight = i===n ? '600' : '500';
 });
 fill.style.width=Math.round(Math.min(n,6)/6*100)+'%';
 window.scrollTo({top:0,behavior:'auto'});
 if(n===3) build();
 if(n===4) plans();
}

/* Step 1 */
$$('[data-type]').forEach(function(b){
 b.addEventListener('click',function(){
  $$('[data-type]').forEach(function(x){x.setAttribute('aria-pressed','false')});
  b.setAttribute('aria-pressed','true');
  state.type=+b.dataset.type;
  var ta=$('[data-wiz-desc]');
  if(ta && !ta.value && TYPE_HINT[state.type]) ta.placeholder='I run a '+TYPE_HINT[state.type]+'…';
  setTimeout(function(){show(1)},220);
 });
});

/* Step 2 */
$$('[data-example]').forEach(function(c){
 c.addEventListener('click',function(){ $('[data-wiz-desc]').value=EXAMPLES[c.dataset.example]; });
});

/* Navigation */
$$('[data-next]').forEach(function(b){b.addEventListener('click',function(){
  if(state.step===1) state.desc=($('[data-wiz-desc]').value||$('[data-wiz-desc]').placeholder||'');
  if(state.step===2){ state.loc=+$('[data-wiz-loc]').value; state.team=+$('[data-wiz-team]').value; }
  show(Math.min(state.step+1,6));
})});
$$('[data-back]').forEach(function(b){b.addEventListener('click',function(){show(Math.max(state.step-1,0))})});

/* Step 4 — the build */
var STEP_TEXT=['Reading your business','Selecting modules','Naming your fields','Setting roles and approvals','Wiring the ledger'];
function build(){
 var box=$('[data-wiz-building]'), out=$('[data-wiz-plan]'), list=$('[data-wiz-steps-list]');
 box.hidden=false; out.hidden=true;
 list.innerHTML=STEP_TEXT.map(function(s){return '<div class="vq-step"><span class="vq-step__mark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span>'+s+'\\u2026</div>'}).join('');
 var steps=$$('.vq-step',list), i=0;
 (function next(){
   if(state.step!==3) return;
   if(i>0){steps[i-1].classList.remove('is-live');steps[i-1].classList.add('is-done')}
   if(i>=steps.length){ setTimeout(reveal,320); return; }
   steps[i].classList.add('is-live'); i++;
   setTimeout(next,300+Math.random()*180);
 })();
}

function compose(){
 var text=(state.desc+' '+(TYPE_HINT[state.type]||'')).toLowerCase();
 if(state.loc>1) text+=' branches locations';
 if(state.team>5) text+=' staff team shifts';
 var on=BASE.slice(), why={};
 SIGNALS.forEach(function(s){ if(s.re.test(text)) s.add.forEach(function(m){ if(on.indexOf(m)<0){on.push(m);why[m]=s.why} }) });
 var opt=OPTIONAL.filter(function(m){return on.indexOf(m)<0}).slice(0,4);
 var off=ALL_OFF.filter(function(m){return on.indexOf(m)<0 && opt.indexOf(m)<0});
 state.mods=on; state.off=off;
 return {on:on,off:off,opt:opt};
}

function chip(label,cls,d){
 var mark = cls==='vq-mod--on'
   ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>'
   : cls==='vq-mod--off'
   ? '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>'
   : '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>';
 return '<button type="button" class="vq-mod '+cls+'" style="--d:'+d+'ms" data-toggle>'+mark+(cls==='vq-mod--off'?'<s>'+label+'</s>':label)+'</button>';
}

function reveal(){
 var c=compose(), d=0;
 $('[data-wiz-summary]').innerHTML=c.on.length+' modules \\u00b7 '+(state.team>5?7:4)+' roles \\u00b7 '+(9+Math.min(c.on.length-9,14))+' reports. Composed from what you wrote \\u2014 not from a template.';
 $('[data-wiz-blueprint]').innerHTML=
  '<span class="vq-eyebrow vq-eyebrow--accent">Included</span><div class="vq-mods vq-mt-3">'+
   c.on.map(function(m){d+=22;return chip(m,'vq-mod--on',d)}).join('')+'</div>'+
  '<div class="vq-mt-6"><span class="vq-eyebrow">Optional \\u2014 tap to add</span><div class="vq-mods vq-mt-3">'+
   c.opt.map(function(m){d+=22;return chip(m,'',d)}).join('')+'</div></div>'+
  '<div class="vq-mt-6"><span class="vq-eyebrow">Left off, on purpose</span><div class="vq-mods vq-mt-3">'+
   c.off.map(function(m){d+=22;return chip(m,'vq-mod--off',d)}).join('')+'</div></div>'+
  '<div class="vq-hr" style="margin-block:var(--vq-space-6)"></div>'+
  '<div class="vq-row vq-wrap vq-gap-6"><div><span class="vq-eyebrow">Currency</span><p class="vq-small vq-mt-1">'+
   ($('#w-cur').value.split(' ')[0])+'</p></div><div><span class="vq-eyebrow">Locations</span><p class="vq-small vq-mt-1">'+
   state.loc+'</p></div><div><span class="vq-eyebrow">Seats</span><p class="vq-small vq-mt-1">'+state.team+'</p></div>'+
   '<div><span class="vq-eyebrow">Ledger</span><p class="vq-small vq-mt-1">Double-entry, seeded</p></div></div>';

 $$('[data-toggle]','[data-wiz-blueprint]'.length?$('[data-wiz-blueprint]'):document).forEach(function(b){
   b.addEventListener('click',function(){
     if(b.classList.contains('vq-mod--off')) return;      /* left off stays off here */
     b.classList.toggle('vq-mod--on');
   });
 });

 $('[data-wiz-building]').hidden=true;
 $('[data-wiz-plan]').hidden=false;
}

/* Step 5 — recommend by capacity, never by capability */
var PLANS=[
 {n:'Starter',p:'$36',l:['1 branch, 3 users','The whole system','20 AI pages/month']},
 {n:'Growth', p:'$63',l:['3 branches, 10 users','Multi-branch + production','60 AI pages/month']},
 {n:'Scale',  p:'$129',l:['10 branches, 50 users','Channels, API, loyalty','150 AI pages/month']}
];
function plans(){
 var rec = state.loc>3||state.team>15 ? 2 : (state.loc>1||state.team>3 ? 1 : 0);
 state.plan=rec;
 $('[data-wiz-plans]').innerHTML=PLANS.map(function(p,i){
  return '<div class="vq-plan'+(i===rec?' vq-plan--featured':'')+'" data-plan="'+i+'">'+
   (i===rec?'<span class="vq-plan__flag">Fits what you told us</span>':'')+
   '<h3 class="vq-plan__name">'+p.n+'</h3>'+
   '<div class="vq-plan__price"><span class="vq-plan__amt">'+p.p+'</span><span class="vq-plan__per">/month</span></div>'+
   '<ul class="vq-plan__list">'+p.l.map(function(x){return '<li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg><span>'+x+'</span></li>'}).join('')+'</ul>'+
   '<button type="button" class="vq-btn '+(i===rec?'vq-btn--primary':'vq-btn--secondary')+' vq-btn--lg vq-btn--block">Choose '+p.n+'</button></div>';
 }).join('');
 $$('[data-plan]').forEach(function(el){
  el.querySelector('button').addEventListener('click',function(){
    state.plan=+el.dataset.plan;
    $$('[data-plan]').forEach(function(x){
      var on = x===el;
      x.classList.toggle('vq-plan--featured',on);
      var b=x.querySelector('button');
      b.classList.toggle('vq-btn--primary',on);
      b.classList.toggle('vq-btn--secondary',!on);
    });
  });
 });
}

/* Carry the sentence in from the landing hero. */
try{
 var q=new URLSearchParams(location.search).get('prompt');
 if(q){ $('[data-wiz-desc]').value=q; show(1); } else { show(0); }
}catch(e){ show(0); }
})();
</script>`;

export default page({
  title: 'See a build — describe a business, watch it become a system | VenQore',
  description: 'The VenQore onboarding flow: describe your business, review the Blueprint it composes, pick a plan, go live. Four minutes, and nothing is real until you approve it.',
  bare: true,
  body,
  extraBody: wizardJS,
});
