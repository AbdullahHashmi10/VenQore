# THE RULEBOOK

### The law that governs VenQore's modules — for you, for your IDE agent, and for the AI

**Version 1.0 · 15 August 2026**

---

## Why this document has authority

You identified the Rulebook as the missing core, and you were right. But a rulebook that lives only in a person's head is a rulebook that gets broken at 2am when a feature is nearly working and one small exception would ship it.

So this document has three properties:

1. **It is short enough to read in one sitting.** A rule nobody reads is not a rule.
2. **Almost every rule here is enforced by a test.** `ModuleRegistryIntegrityTest` fails the build rather than trusting anyone's memory.
3. **It states what wins when documents disagree** — because they already do, and someone will act on the wrong one.

Where this document and any other document conflict, **this one wins**, except where §0 says otherwise.

---

## §0 — WHICH DOCUMENT WINS

Your `extras/` folder has eleven planning documents written over three days, and they contradict each other in places that matter. This is the order of authority. Nothing below rank 1 may override anything above it.

| Rank | Document | Authority over |
|---|---|---|
| 1 | **The running code** | Everything. If the repository disagrees with a plan, the repository is the fact and the plan is the wish. |
| 2 | **`config/qore.php`** | What may never be a module. |
| 3 | **This Rulebook** | How modules relate, change, and get added. |
| 4 | **`config/modules.php`** | What the modules *are*. |
| 5 | **`VENQORE_FINAL_BUILD_PLAN.md`** (14 Aug) | Scope, numbering, billing, build order. |
| 6 | `VENQORE_V2_MASTER_PLAN.md`, `AI_BUILDER_MASTER_MAP.md`, `CAPABILITIES_FILE_GUIDE.md` | Method and reasoning. Superseded on facts. |
| 7 | `01`–`07` audit files | History. Useful for *why*, unreliable for *what*. |

### The three contradictions you will hit, resolved

**1. Billing.** `07_ANSWERS_AND_DECISIONS.md` (13 Aug) says *"Change nothing about billing. Not one line."* The `FINAL_BUILD_PLAN` (14 Aug) replaces plans-as-feature-lists with usage-based billing and every module included.

> **The build plan wins.** It is a day newer and it says so explicitly. `07` was right about the *mechanism* — entitlement and configuration are separate concerns — and wrong about the *conclusion*, because you then decided the entitlement layer should stop gating features at all. Both can be true: the split is what makes the new model cheap to implement.

**2. Module count and numbering.** V2 says 45 modules; the final plan says 46 but its Part 2 table cites the **old** V2 numbers (`#37` for Accounting, `#38` for Tax, `#15–18` for Inventory).

> **The final plan's Group A–G list wins**, and `config/modules.php` encodes it: Accounting Workspace is **#38**, Tax & Compliance is **#39**, Inventory is **#16**, Khata is **#32**. Anywhere you see the old numbers, they are stale cross-references, not decisions.

**3. File name.** The guide says `config/capabilities.php` with 25–35 capabilities. The build plan says `config/modules.php` with 46.

> **`config/modules.php` wins.** The guide's *validation method* — the eight questions, the alias method, the red flags — is fully absorbed and still binding. Only its file name and its count are superseded.

---

## §1 — THE ONE TEST THAT SETTLES EVERY ARGUMENT

You will be asked *"should X be in the Qore or be a module?"* fifty more times. Apply this mechanically, and do not negotiate with it.

> ### If switching it off could make a NUMBER wrong → **QORE**
> ### If switching it off only removes a SCREEN → **MODULE**

| Thing | Off means… | Answer |
|---|---|---|
| Double-entry ledger | profit is wrong | **QORE** |
| Chart of accounts, journals, trial balance screens | screens gone, numbers fine | **MODULE #38** |
| Stock ledger / FIFO costing | COGS and margin are wrong | **QORE** |
| Inventory screens, stock takes, transfers | screens gone, ledger still recording | **MODULES #16–19** |
| The `parties` row | a transaction has no counterparty | **QORE** |
| Customer directory, khata, statements | screens gone | **MODULES #3, #32** |
| Tax calculation | totals are wrong | **QORE** |
| Tax reports and e-invoicing | screens gone | **MODULE #39** |
| Invoice numbering | duplicate invoice numbers | **QORE** |
| Unit conversion on a line | a stored quantity changes | **QORE** |
| The screen where units are defined | screen gone | **MODULE #24** |

**The pattern: the Qore owns *recording*. Modules own *seeing and doing*.**

Accounting the discipline is Qore. Accounting the department is a module. Say it that way to anyone who is confused, including yourself in three months.

**And this is why you can give 42 modules away.** One engine, tested once, means each extra module is nearly free to build and verify. Fork the money layer and every module costs double forever. The mandatory Qore is what *funds* the free-modules promise — they are not in tension, one pays for the other.

---

## §2 — THE ABSOLUTE PROHIBITIONS

These have no exceptions. Not for a demo, not for a deadline, not for one important customer.

**2.1 No Qore key may ever appear in `config/modules.php`** — not as a key, not in `requires`, not in `requires_one`, not in `enhances`.
*Why: it lets a person or a model switch off the thing that makes the numbers correct. The corruption is silent and is discovered months later.*
*Enforced by: `test_no_qore_key_appears_in_the_registry`.*

**2.2 The AI never writes to the database.** It returns JSON. Deterministic PHP validates it. `ApplyConfigurationService` performs every write inside a transaction.

**2.3 The AI never generates code** — no PHP, SQL, migrations, routes, schema or financial logic. Ever. If a request seems to need generated code, the answer is "not yet", logged to the demand log.

**2.4 A proposal is always shown before anything is applied.** No auto-apply, for anyone, ever. The proposal screen is where the customer sees that you understood them; it is the product, not a confirmation dialog.

**2.5 Disabling a module never deletes data.** It hides screens and blocks routes. Re-enabling restores everything, exactly as it was. If any module cannot honour this, it is not user-disableable and does not belong in the registry.

**2.6 Never rename a module key.** The key is a primary identifier in `tenant_modules`, in every preset, in every AI prompt, and in every config version snapshot. Change `label` as often as you like. If you truly must change a key, ship a data migration that rewrites every affected row in the same deployment.

**2.7 Never hard-delete a module.** Set `status => 'retired'`, hide it from the builder, leave existing tenants' rows alone. Deleting a key orphans live configuration rows and breaks the integrity test against a database you cannot easily fix.

**2.8 Never list a module that does not fully work.** If you cannot open it in a browser, create a record, save it and see it in a list, it is `beta` at best — and `beta` means excluded from every preset and never proposed by the AI.

---

## §3 — THE FOUR RELATIONSHIPS

Only four. Adding a fifth kind of relationship is how dependency systems become unexplainable.

| Type | Meaning | What the system does |
|---|---|---|
| **REQUIRES** | Cannot work without it | Auto-enabled, explained in plain words |
| **REQUIRES ONE OF** | Needs A **or** B — the user chooses | **Asks which. Never guesses.** |
| **ENHANCES** | Better together, fine alone | Suggested, never forced |
| **QORE** | Foundation | Never mentioned, never listed, never offered |

### On `REQUIRES ONE OF`

**This is the relationship nobody else builds, and the one this product depends on.**

Invoicing needs Products *or* Services. Khata needs Customers *or* Suppliers. Without it, every freelancer is forced to carry a Products module they will never open — which is precisely the complaint that started this redesign.

Build it into the resolver on day one. Retrofitting it later means re-deriving every existing tenant's configuration.

### The test for `requires` vs `enhances`

> *"With this switched off, does my module throw an error or show a permanently empty screen?"*

Yes → `requires`. Merely less useful → `enhances`.

Getting this wrong in the generous direction is the most common way a dependency graph becomes a wall: the user enables one thing and five appear, and the product feels like it is arguing with them.

### Depth

**Maximum 4.** The deepest legal chain is `table_service → park_recall → pos → products`. If you need a fifth level, something modelled as `requires` is really an `enhances`.
*Enforced by: `test_dependency_graph_has_no_cycles_and_is_shallow`.*

---

## §4 — WHAT THE USER MUST NEVER EXPERIENCE

Three failures, and the exact shape of the fix. These strings live in `config/ai_builder.php` under `messages` so their tone stays consistent.

**A dead end.** Every "no" carries a next step.

> *"I want to monitor what my employees are working on."*
> **"VenQore doesn't do employee monitoring yet — it's on the list. For now, Staff & Attendance tracks who's working and when. Shall I note your request?"**

That log is your roadmap *and* your warm launch list: people already paying you who asked for the feature by name.

**A silent failure.** Nothing is ever removed without saying so.

> *"Remove Products."*
> **"POS and Cookbook need Products. I can remove all three, or keep Products just for POS. Which?"**

**A reachable ghost.** Hiding a nav item is not disabling a module. The URL must stop working too.

The rule has three parts and all three must hold, or the rule leaks:

1. The AI never offers it — the validator strips modules whose `requires` are unmet.
2. The nav never shows it — nav is derived from enabled modules.
3. **The URL does not work** — `EnsureModule` blocks the route.

Part 3 does not exist in the codebase today. It is a launch blocker.

---

## §5 — THE BILLING PROMISE

> **You pay for scale. You never pay for features.**

Four meters, all already built and enforced: transactions/month, staff users, locations, products.

**42 of the 46 modules are free on every plan.** Exactly four things may cost extra, and each has a real marginal cost or a genuinely different buyer:

| Exception | Why it is honest |
|---|---|
| AI builds & AI Insights (#43) | Every model call costs you money |
| Marketplace / WooCommerce Sync (#45) | Per-connection infrastructure |
| API access & webhooks | Enterprise buyer, and no general-purpose API exists yet — do not market it as a developer platform |
| SSO/SAML, custom domain, dedicated support | Real enterprise cost |

> **The rule to hold yourself to: charge for what costs you money to run, and for scale. Never for a feature you already built.**

*Enforced by: `test_the_billing_promise_holds`. Moving a module out of `included` fails the build unless it is on the exception list — which forces the decision to be conscious, and to update the pricing page in the same commit.*

**Migration is additive.** Every existing customer gains modules; nobody loses anything.

> *"Every VenQore module is now included in every plan. Nothing was taken away — a lot was added. You now pay only for how much you use, not for which features you're allowed to touch."*

---

## §6 — HOW TO CHANGE THE REGISTRY SAFELY

### Adding a module

Ask, in order, and stop at the first "no":

1. **Does it fully work today?** Open it. Create a record. Save it. See it in a list. No → stop.
2. **Is it a surface, not foundation?** Apply §1. If disabling it can make a number wrong, it is Qore.
3. **Would a real customer ask for it by name?** No → it is a sub-feature. Fold it into a parent's `enhances`.
4. **Does it open a business type?** *"VenQore runs repair shops"* is a reason to split. A bigger number is not.
5. **Does it push past 46?** Then merge two related entries first. **A registry that grows without bound becomes a checkbox wall, and a checkbox wall is a worse experience than no builder at all.**

Then: write the entry → write 6–10 aliases → extend the integrity test → add it to **at most two** presets → ship.

### Changing a dependency

**This is the most dangerous edit in the file**, because existing tenants already have configurations built on the old graph. Before changing any `requires`:

```sql
SELECT COUNT(*) FROM tenant_modules
WHERE module_key = 'the_child' AND enabled = 1
  AND tenant_id NOT IN (
    SELECT tenant_id FROM tenant_modules
    WHERE module_key = 'the_new_parent' AND enabled = 1
  );
```

If that returns more than zero, those tenants are about to be in an invalid state. **Write a data migration that enables the new parent for them, in the same deployment.** Never ship a dependency change without one.

### Promoting `beta` → `live`

Every item in the module's `verify` array must be cleared — not argued away, cleared, by opening the thing in a browser. Then:

- routes resolve (the integrity test proves it),
- pages exist on disk,
- a golden preset test creates a real transaction through it and the ledger balances.

Only then may it appear in a preset or in an AI proposal.

---

## §7 — RED FLAGS

If any of these becomes true, stop and reconsider. Each one has cost somebody a launch.

| Red flag | What it actually means | Fix |
|---|---|---|
| More than 46 modules | Billing features or field-level config crept in | Merge; re-apply §1 |
| A `requires` chain deeper than 4 | You modelled `enhances` as `requires` | Loosen the graph |
| A module with no nav **and** no cards | The user cannot see any effect of toggling it | Fold it into a parent's `enhances` |
| Two modules always on or off together | They are one module | Merge them |
| A module you are not sure works | It does not | `beta`, or delete it |
| `requires` containing a Qore key | Tier 0 leak | Remove immediately; the test should have caught it |
| A module added because a preset "needed" it | Preset-driven invention | Presets combine what exists; they never justify a new entry |
| More than 5 non-live modules | Too much unfinished work in V1 | Cut to the most valuable |
| An entry you cannot verify in 10 minutes | Guessing | **Delete it. A 40-module file where every entry is true beats a 46-module file with 6 lies.** |

---

## §8 — RULES FOR YOUR IDE AGENT

Paste this section into whatever agent is editing the repository.

> You are working inside a system with a mandatory foundation called the Qore and 46 optional modules defined in `config/modules.php`.
>
> **You may not:**
> - add, rename or remove a key in `config/modules.php` without being asked to
> - add anything from `config/qore.php`'s `denylist` to the registry, in any field
> - mark a module `live` on the basis of a file existing — only a working screen counts
> - invent a route name, page path, permission, dashboard card or terminology key; every one must exist in the repository
> - delete or weaken an assertion in `ModuleRegistryIntegrityTest` to make it pass
> - write to `tenant_modules` from anywhere except `ApplyConfigurationService`
>
> **You must:**
> - when asked whether a module works, answer with a file path and a line number, or say you do not know
> - when you clear a `verify` item, delete that line from the registry and say in the commit message how you confirmed it
> - when a route pattern fails the integrity test, fix the *pattern*, never the test
> - treat `store.pos` and `store.pos.*` as different things
>
> **Fifteen questions worth asking, one at a time, per module — demand file-and-line evidence, never accept "yes":**
>
> 1. List every route whose name matches this module's patterns. Show name → controller → method.
> 2. For each of those controllers, which models, services and Engines does it call, and which belong to a *different* module?
> 3. Grep this module's pages for `route()` and `<Link href>`. Which point at routes owned by another module? Those are hidden dependencies.
> 4. Does any controller, report or dashboard card assume this module is enabled without checking? File and line.
> 5. Which reports query a table this module owns, and what happens to them when it is off?
> 6. Is the `legacy_gate` key actually used as `plan.feature:` in `routes/web.php`? How many times, on which routes?
> 7. Are all `cards` present in `DashboardRegistry::all()`?
> 8. Are all `terms` present in `Terms::$fallbacks`?
> 9. Are all `permissions` present in `config/permissions.php`, and which of the 7 roles hold them?
> 10. Build the dependency graph. Report cycles, maximum depth, orphans, and any `requires` target that does not exist.
> 11. Count rows in this module's primary tables across all tenants. Is it used in production today?
> 12. Which module keys have zero test coverage anywhere in `tests/`?
> 13. Simulate a preset: list the resolved module set, the nav, and the cards. Is anything missing a real business would expect?
> 14. Find every place that reads plan features to decide UI visibility. Which should now read modules instead?
> 15. If I disable this module for a tenant with existing rows, trace every code path that still reads that data. Would any of them throw?
>
> **Questions 3 and 15 find the bugs that otherwise reach customers.** A page that links to a hidden module is a dead-end click. A report that queries a disabled module's table is a 500. Run both for every module before launch.

---

## §9 — RULES FOR THE AI

The full pipeline is in `config/ai_builder.php`. These are the ten that matter, restated so they can be quoted in a code review.

1. The AI never writes to the database.
2. The AI never generates code of any kind.
3. AI output is untrusted input, validated deterministically — like a form post from a stranger.
4. Unknown keys are dropped **silently**. A dropped hallucination should be invisible.
5. Qore keys are stripped **silently**.
6. Non-live modules are never enabled; they become "coming soon".
7. Conflicts are rejected before the proposal renders.
8. A proposal is always shown before apply.
9. AI failure never blocks onboarding → preset picker, always.
10. Every change is versioned and revertible.

**The sentence that explains all ten:** *the AI proposes, the validator disposes.* Steps 3–10 of the pipeline are pure PHP. There is no path from a hostile model response to an invalid configuration — and that is a property of your code, not a promise about the model.

---

## §10 — THE THINGS THAT ARE FROZEN

From the build plan, Part 7. The test for all of them: *"Will a paying customer notice this in their first week?"* No → frozen.

Composable Dashboard Builder (new features only — **do** fix the overlapping Manager dashboard) · Growth Engine expansion · Marketing tools suite · Smart Capture · VenSynQ expansion · Blog/SEO · desktop & mobile builds · migrating ~300 pages to the Next shell · **field-level config** · Construction/Projects domain · Protocol VII · themes and colours · open-ended AI chat · more than 15 presets.

**Field-level config deserves its own warning.** *"Hide the payment-terms box"* lives inside individual React components across ~300 pages, and there is no field-visibility infrastructure in the repository. It is months of work, and nobody has ever refunded a product over a form field. V1.2 ships a plain Settings page covering the five or six fields customers actually complain about. Nothing more.

---

## §11 — THE SHORT VERSION

If you remember nothing else:

1. **The Qore records. Modules show.** If switching it off can make a number wrong, it is not a module.
2. **Describe what exists, never what you intend.** An aspirational entry is a lie the AI tells a paying customer.
3. **The AI translates; it never decides.** Unknown keys vanish, Qore keys vanish, the user always approves.
4. **Charge for scale, never for features.** 42 modules free on every plan is the positioning, and it is verifiable in five seconds.
5. **Never a dead end, never a silent failure, always a next step.**
6. **Fix the registry, not the test.**

---

*This document governs `config/modules.php`, `config/qore.php`, `config/ai_builder.php`, `ModuleRegistryIntegrityTest.php` and every preset. When you change one of them, re-read the section that governs it.*
