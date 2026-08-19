# CAPABILITIES FILE GUIDE
## How to validate, own, and evolve `config/capabilities.php`
**Companion to `AI_BUILDER_MASTER_MAP.md` Appendix A**

---

# WHY THIS FILE MATTERS MORE THAN ANY OTHER

Read this once, then keep it in mind for the rest of the project.

`config/capabilities.php` is the **only** place in VenQore where these six questions are answered:

1. What can a customer switch on or off?
2. What is the AI allowed to promise?
3. What can a preset combine?
4. What appears in the navigation?
5. What does the route gate enforce?
6. What does the dashboard show?

Every other file *reads* from it. Nothing writes to it but you.

**The consequences of getting it wrong are asymmetric:**

| Mistake | What the customer experiences |
|---|---|
| A capability whose feature doesn't actually work | AI promises it → they enable it → **404 or crash**. Refund. |
| A wrong `requires` | They enable Manufacturing, nothing appears. "It's broken." |
| A missing `requires` | They get a module that half-works. Worse than not having it. |
| A wrong `entitlement` key | They pay for a feature they can't reach, **or get a paid feature free forever** |
| A Tier 0 key listed by mistake | Someone disables Accounting. **Silent financial corruption.** |
| A wrong route name | The gate never fires → **disabled module still reachable by URL** |

> **The governing rule: this file must describe the software that EXISTS, not the software you INTEND. An aspirational entry here becomes a lie the AI tells a paying customer.**

---

# PART 1 — THE VALIDATION PROTOCOL

Work through these seven steps in order. Do not write the final file until step 7 passes. **Budget a full day.** It is the highest-leverage day in the project.

---

## STEP 0 — Regenerate the route list (5 minutes)

```bash
php artisan route:list --json > route_list_current.json
```

**Why:** every route name in Appendix A came from `route_list.json` dated **2026-07-08** — five weeks stale, and predating the V3→Engines consolidation. Some route names in the draft are certainly wrong.

Also refresh the other three source lists you'll check against:

```bash
php artisan tinker
>>> collect(config('permissions'))            # 49 permission keys
>>> array_keys(\App\Services\Dashboard\DashboardRegistry::all())   # 20 card keys
>>> (new ReflectionClass(\App\Support\Terms::class))->getStaticPropertyValue('fallbacks')  # 26 term keys
```

---

## STEP 1 — The eight questions, per capability

For every one of the ~34 draft entries, answer these. **If you cannot answer question 1 or 2, delete the entry.**

### Q1. Can I open this feature in the browser right now and use it end to end?
Not "does the route exist." Not "is there a page file." **Open it. Create a record. Save it. See it in a list.**
- ✅ works → keep
- ⚠️ loads but errors on save → `'status' => 'beta'`, exclude from all presets
- ❌ 404 / blank / crash → **delete the entry entirely**

### Q2. What breaks if I switch this off and a customer tries to use the app normally?
Try it mentally, then actually. If the answer is *"a page 500s"* or *"a report shows nothing with no explanation"*, you have found a hidden dependency. Add it to `requires`.

### Q3. Which route names does this actually own?
Grep the fresh route list. Use wildcards (`store.inventory.*`) only where every route under that prefix belongs to this capability. **Where a prefix is shared** (e.g. `store.reports.*` spans three reporting capabilities), list specific route names instead — otherwise your gate will block routes that belong to a different, enabled capability.

### Q4. Is there an existing `feature:` gate for this?
Check the 38 keys in Master Map §1.3. If one matches → that's your `entitlement`. If none matches → `null` (ungated, available to everyone).
**Do not invent a new entitlement key.** Adding one means touching the pricing matrix, which means touching billing, which is out of scope for V1.

### Q5. What does this capability contribute to the interface?
- Its own nav item? → `provides_nav`
- Dashboard cards? → `provides_cards` (must be one of the 20 real card keys)
- Terminology it lets users rename? → `provides_terms` (must be one of the 26 real term keys)

Sub-features that live *inside* another page (variants, parked sales, purchase returns) get `'provides_nav' => []`. That is correct and normal.

### Q6. What must be enabled for this to make sense?
Three different things — don't conflate them:
- **`requires`** — technically cannot work without it. Cascade-enabled automatically.
- **`optional`** — works, better together. Suggested in the proposal, never auto-enabled.
- **Foundation** — Tier 0. **Never write it.** `requires` must never contain `products`, `sales`, `accounting`, `payments`, `parties`, `tax`, `uom`.

**The test for `requires`:** *"If this is off, does my capability throw an error or show a permanently empty screen?"* Yes → `requires`. Merely less useful → `optional`.

### Q7. What words would a real shopkeeper use for this?
This is `aliases`, and it is what makes the AI accurate. Write **6–10 per capability**, and include:
- The plain word ("stock" for inventory)
- The industry word ("materials", "godown", "yard")
- **Urdu/Hindi/Roman-Urdu terms your actual market uses** — `khata`, `udhaar`, `kharid`, `wapsi`, `bill`
- What a competitor calls it
- The misspelling someone would type

**Aliases are the single highest-return field in the file** and the one you are uniquely qualified to write. You have run a real shop's software for months; the model has not. Every good alias is an onboarding that lands on the right preset. **Spend disproportionate time here.**

### Q8. If someone disables this after using it for six months, what happens to their data?
The answer must always be *"it's hidden, nothing is deleted, re-enabling restores it."* If any capability's answer is different, it needs a data-safety rule and probably shouldn't be user-disableable at all.

---

## STEP 2 — Resolve the 12 `NEEDS_VALIDATION` entries

These are the ones I could not verify. Handle them explicitly:

| Capability | What to check | If it fails |
|---|---|---|
| **`service_jobs`** ⚠️ | Migration `2026_08_12_210000_create_services_engine_tables.php` is **1 day old**. Does a service job exist as a usable screen? Does a service-only sale post correctly? | Mark `'status' => 'beta'`, **remove presets 11 & 12 from V1** |
| **`restaurant_tables`** ⚠️ | No `store.restaurant.*` routes in the July list. Find the real routes | If no working routes → delete entry, drop the Restaurant preset |
| `parked_sales` | Confirm `store.parked-sales.*` and its page | Delete if unverifiable |
| `quotations` | `store.v3.quotations.*` — 2 routes only. Is that a full CRUD surface? | Downgrade to `beta` |
| `loyalty`, `gift_cards`, `variants`, `serials`, `batch_expiry`, `bank_accounts`, `woocommerce` | Whether each has a real `feature:` entitlement or is genuinely free | Set `entitlement` correctly — a wrong value here gives away paid features |
| `reports_advanced` | It spans several gate keys (`customer_insights`, `supplier_insights`, `stock_aging`…). Pick **one** as the entitlement, or split the capability | Split if the keys are sold separately |
| `bulk_upload`, `ai_insights` | Confirm the page paths | Set `pages` correctly |

**Rule: an entry you cannot verify in 10 minutes gets deleted, not guessed.** A 28-capability file where every entry is true beats a 34-capability file with 6 lies.

---

## STEP 3 — Fix the `ai_insights` entitlement bug first

**FACT:** `ai_insights` maps to entitlement `growth_engine`, and `PlanTruthFailClosedTest` is currently failing because `growth_engine` is **on by default on `ltd_2`**.

If you write this file before fixing that, you encode the bug into the capability registry and it becomes much harder to see. **Fix the plan matrix, get that test green, then write this entry.**

---

## STEP 4 — Verify the Tier 0 exclusion list

Read your finished file and confirm **none** of these appear as keys or in any `requires`:

```
accounting  ledger  journal  double_entry  fifo  stock_ledger  costing
products    parties customers_core  suppliers_core  payments  tax  uom
sequences   users   roles  permissions  tenancy  sales
```

**One Tier 0 key slipping in is the worst outcome in this entire project** — it means a customer or an AI can switch off the thing that makes the numbers correct. Write `TierZeroExclusionTest` as a hard-coded deny-list and run it in CI forever.

**Note the subtlety:** `customers_directory` and `suppliers` ARE Tier 1 (the *screens* are optional). The `parties` table and `PartyService` are Tier 0 (the *data layer* is mandatory). Same domain, different layer. Keep the naming distinct so nobody confuses them later.

---

## STEP 5 — Walk the dependency graph by hand

Draw it on paper. Then check three things:

1. **No cycles.** A requires B requires A is a boot-time infinite loop.
2. **Depth ≤ 3.** Draft max is `stock_transfers → warehouses → inventory`. Deeper than 3 means a user enables one thing and five appear — confusing, and a sign you've modelled something as `requires` that should be `optional`.
3. **Every `requires` target exists in the file.** A typo here fails silently at runtime and loudly in production.

---

## STEP 6 — The three-preset sanity test

Before writing the final file, mentally apply your three most important presets:

**POS Only** → `pos, returns, barcodes, reports_basic`
- Can they add a product with a price? (Tier 0 ✅)
- Can they scan, sell, take cash, print? Return an item? See yesterday's sales?
- Is the dashboard useful or three empty boxes?
- **Does it feel like a real product, or a demo?**

**Retail/Grocery** → 9 capabilities
- Purchase stock → sell it → see the stock drop → see the profit?

**Freelancer** → `customers_directory, quotations, recurring_invoices, khata_credit, expenses, reports_basic`
- **No inventory, no POS, no products page.** Does the app still look coherent, or does it look broken?

**If any of these feels thin, the fix is in the PRESET, not the file.** Add capabilities to the preset — that's exactly the disappointment problem you identified, and presets are where it's solved.

---

## STEP 7 — Write the integrity test, then the file

Write `tests/Feature/Capability/CapabilityRegistryIntegrityTest.php` **before** finalising the file, so the file has to pass something real:

```php
public function test_registry_is_internally_consistent(): void
{
    $caps  = config('capabilities');
    $cards = array_keys(\App\Services\Dashboard\DashboardRegistry::all());
    $terms = array_keys((new \ReflectionClass(\App\Support\Terms::class))
                ->getStaticPropertyValue('fallbacks'));
    $perms = $this->flattenPermissionKeys(config('permissions'));
    $gates = $this->featureGateKeysFromRoutesFile();   // the 38 keys

    $this->assertGreaterThanOrEqual(25, count($caps));
    $this->assertLessThanOrEqual(35, count($caps));

    foreach ($caps as $key => $c) {
        // 1. no Tier 0 leakage
        $this->assertNotContains($key, self::TIER_ZERO_DENYLIST, "TIER 0 LEAK: {$key}");

        // 2. routes resolve
        foreach ($c['routes'] as $r) {
            $this->assertTrue($this->routeExists($r), "{$key}: unknown route {$r}");
        }
        // 3. pages exist on disk
        foreach ($c['pages'] as $p) {
            $this->assertFileOrDirExists(resource_path("js/Pages/{$p}"), "{$key}: missing page {$p}");
        }
        // 4. permissions real
        foreach ($c['permissions'] as $p) {
            $this->assertContains($p, $perms, "{$key}: unknown permission {$p}");
        }
        // 5. cards real
        foreach ($c['provides_cards'] as $card) {
            $this->assertContains($card, $cards, "{$key}: unknown card {$card}");
        }
        // 6. terms real
        foreach ($c['provides_terms'] as $t) {
            $this->assertContains($t, $terms, "{$key}: unknown term {$t}");
        }
        // 7. entitlement is a real gate key or null
        if ($c['entitlement'] !== null) {
            $this->assertContains($c['entitlement'], $gates, "{$key}: unknown gate {$c['entitlement']}");
        }
        // 8. dependencies exist and are not Tier 0
        foreach (array_merge($c['requires'], $c['optional']) as $dep) {
            $this->assertArrayHasKey($dep, $caps, "{$key}: unknown dependency {$dep}");
            $this->assertNotContains($dep, self::TIER_ZERO_DENYLIST, "{$key}: Tier 0 in requires");
        }
        // 9. aliases are worth having
        $this->assertGreaterThanOrEqual(3, count($c['aliases']), "{$key}: too few aliases");
        // 10. nothing unverified ships
        $this->assertNotSame('NEEDS_VALIDATION', $c['status'], "{$key} still unvalidated");
    }
    $this->assertNoCycles($caps);
    $this->assertMaxDepth($caps, 3);
}
```

**When this is green, the file is done.** Not before.

---

# PART 2 — HOW TO UPDATE THE FILE LATER

You will change this file for the rest of the product's life. Each change type has a different risk profile.

## Adding a new capability

Ask, in order:
1. **Does the feature fully work today?** No → stop.
2. **Is it Tier 1?** Own page + nav entry + can be hidden without breaking anything → yes. Otherwise it's Tier 0 (never list) or Tier 2 (defer).
3. **Would a real customer ask for it by name?** No → it's a sub-feature; fold it into a parent's `optional`.
4. **Does it push the file past 35?** Then merge two related entries first. **A registry that grows without bound becomes a checkbox wall, and a checkbox wall is a worse experience than no builder at all.**

Then: write the entry → add aliases → extend the integrity test → add it to at most 2 presets → ship.

## Changing a dependency

**This is the most dangerous edit in the file**, because existing tenants already have configurations built on the old graph.

Before changing any `requires`:
```sql
SELECT COUNT(*) FROM tenant_capabilities
WHERE capability_key = 'the_child' AND enabled = 1
  AND tenant_id NOT IN (
    SELECT tenant_id FROM tenant_capabilities
    WHERE capability_key = 'the_new_parent' AND enabled = 1
  );
```
If that returns > 0, those tenants are about to be in an invalid state. **Write a data migration that enables the new parent for them, in the same deployment.** Never ship a dependency change without it.

## Removing a capability

Never hard-delete. Set `'status' => 'retired'`, hide it from the builder UI, leave existing tenants' rows alone. Deleting the key orphans live configuration rows and makes the integrity test fail on a database you can't easily fix.

## Renaming a key

**Don't.** The key is a primary identifier in `tenant_capabilities`, in preset definitions, in AI prompts, and in every config version snapshot. Change `label` freely; never change the key. If you truly must, ship a data migration that rewrites every affected row in the same deployment.

---

# PART 3 — THE 15 QUESTIONS TO ASK YOUR IDE AGENT

Paste these one at a time. Do not accept "yes" — demand file and line evidence.

```
1.  For capability '<key>', list every route in the current route list whose
    name matches its 'routes' patterns. Show name → controller → method.

2.  For each of those controllers, list every model, service and Engine class
    it calls. Which of those belong to a DIFFERENT capability in my registry?

3.  Grep the frontend page(s) of '<key>' for route() and Link href calls.
    Which point to routes owned by another capability? Those are hidden
    dependencies — list them.

4.  Does any controller, service, report or dashboard card assume '<key>'
    is enabled without checking? Show the file and line.

5.  Show every report in ReportController that queries a table owned by
    '<key>'. What happens to those reports when '<key>' is disabled?

6.  Is 'entitlement' => '<x>' actually used as a feature: gate in
    routes/web.php? How many times, on which routes?

7.  Are every key in 'provides_cards' present in DashboardRegistry::all()?
    List any that are not.

8.  Are every key in 'provides_terms' present in Terms::$fallbacks?
    List any that are not.

9.  Are every key in 'permissions' present in config/permissions.php?
    Which of the 7 roles actually hold each one?

10. Build the full dependency graph from my registry. Report: cycles,
    maximum depth, orphans, and any 'requires' target that doesn't exist.

11. For each capability, count rows in its primary table across all tenants.
    Which capabilities are actually being used in production today?

12. Which of my registry keys have ZERO test coverage anywhere in tests/?

13. Simulate preset '<name>': list the resolved capability set after
    dependency resolution, the resulting nav items, and the dashboard cards.
    Is anything missing that a real business would expect?

14. Find every place in the codebase that reads plan features to decide
    UI visibility. Which should now read capabilities instead?

15. If I disable '<key>' for a tenant with existing data in its tables,
    trace every code path that would still try to read that data.
    Would any of them throw?
```

**Question 3 and question 15 find the bugs that would otherwise reach customers.** A page that links to a hidden module produces a dead-end click; a report that queries a disabled module's table produces a 500. Run those two for every capability before launch.

---

# PART 4 — WRITING GREAT ALIASES

This is the part only you can do well, so here is a method.

**For each capability, write down:**

| Source | Example for `inventory` |
|---|---|
| The plain English word | stock |
| What your father's shop calls it | godown, maal |
| Roman Urdu / Hindi | stock, maal, saman |
| The formal/industry term | inventory management, stock control |
| What a construction business calls it | materials |
| What a restaurant calls it | ingredients, supplies |
| What a competitor's menu says | items, stock levels |
| The typo | inventry, invetory |

**Then test them.** Take your 12 fixture business descriptions and, for each, ask: *"which alias in my file would make an AI pick this capability?"* If a bakery says *"I need to track ingredients"* and `ingredients` isn't an alias of `inventory` or `compositions`, the AI will miss it.

**Target 6–10 aliases per capability, weighted toward how your actual market speaks.** Your Pakistani retail market vocabulary is a genuine competitive advantage — no global competitor's onboarding understands `khata` or `udhaar`. Use it.

---

# PART 5 — RED FLAGS: STOP AND RECONSIDER

If any of these become true while writing the file, something has gone wrong:

| Red flag | What it means | Fix |
|---|---|---|
| More than 35 capabilities | You're exposing billing features, or Tier 2 has crept in | Merge related entries; re-check the tier test |
| Any capability with `requires` depth > 3 | You've modelled `optional` as `requires` | Loosen the graph |
| A capability with no `provides_nav` **and** no `provides_cards` | The user cannot see any effect of toggling it | It's a sub-feature — fold into a parent's `optional` |
| Two capabilities that are always on/off together | They're one capability | Merge them |
| A capability you're not sure works | It doesn't | Delete it |
| `requires` containing `products`, `sales`, or `accounting` | **Tier 0 leak** | Remove immediately |
| An entry added because a preset "needed" it | Preset-driven invention | Presets combine what exists; they never justify new entries |
| More than 3 `beta` entries | Too much unfinished work in V1 | Cut to the 3 most valuable |

---

# PART 6 — THE FINAL CHECKLIST

Do not write `config/capabilities.php` until every line is ticked:

```
[ ] route_list_current.json regenerated today
[ ] Every capability opened in a browser and used end-to-end
[ ] Every route name verified against the fresh list
[ ] Every page path verified to exist on disk
[ ] Every permission key verified in config/permissions.php
[ ] Every dashboard card verified in DashboardRegistry::all()
[ ] Every terminology key verified in Terms::$fallbacks
[ ] Every entitlement key verified among the 38 feature: gates
[ ] growth_engine / ltd_2 bug fixed BEFORE writing ai_insights
[ ] Zero NEEDS_VALIDATION entries remain
[ ] Zero Tier 0 keys present, as keys or in requires
[ ] Dependency graph drawn: no cycles, depth ≤ 3
[ ] 6-10 aliases per capability, including Urdu/market terms
[ ] Capability count between 25 and 35
[ ] The three sanity presets mentally applied and felt complete
[ ] CapabilityRegistryIntegrityTest written and GREEN
[ ] File committed on its own, with a message explaining the tier model
```

---

# PART 7 — WHAT GOOD LOOKS LIKE

When this file is right, all of the following are true at once:

- You can hand it to a stranger and they understand your product in five minutes.
- The AI's system prompt is *literally this file*, so the AI can never promise something you don't have.
- A new preset takes 10 minutes to write, because it's just a list of keys.
- A new capability takes 30 minutes, because the pattern is fixed.
- Nobody ever asks "wait, is inventory a plan feature or a business setting?" again.
- When a customer says "it doesn't do X," you check one file to know whether that's true.

**And the deeper point:** this file is where your eight months of ERP work becomes *legible*. Right now that value is spread across 716 backend files and ~300 pages, where nobody — not an investor, not a customer, not an AI — can see it. In this one file it becomes a menu of things your software genuinely does.

That's not documentation. **That's the product.**

---

# THE ONE-PARAGRAPH VERSION

> Open a blank `config/capabilities.php`. For each module you'd let a customer switch off, open it in a browser and actually use it. If it works, write an entry: key, label, description, the real route names, what it truly requires, the real dashboard cards and terminology keys, the real entitlement gate, and 6–10 aliases in the words your customers actually use. If it doesn't fully work, leave it out. Never list accounting, stock, products, parties, payments or tax — those are foundation and must never be switchable. Stop between 25 and 35. Write the integrity test. Make it green. **Then, and only then, start building on top of it.**
