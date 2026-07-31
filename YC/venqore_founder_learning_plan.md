# VenQore Founder Learning Plan — from AI-director to engineer in 12 months

> **Goal in one sentence**: In 12 months, be a founder who can read, debug, and defend every layer of VenQore without AI open — and within the next few weeks, be able to survive a YC technical interview honestly.
>
> **The two rules that make this work**
> 1. **Flip the roles.** Until now: AI typed, you watched. From today: **you type, AI explains and reviews.** You will be slower. That's the point — speed was never your problem; understanding is.
> 2. **45 minutes every day reading your own code with AI closed.** Then reopen AI and check what you got wrong. Reading code you didn't write is the single skill that separates a director from an engineer — and it's the exact skill a YC partner probes.
>
> **Safety rule**: All experiments run on the `amd_pos_test` database or a scratch copy — never on `venqore_pos` (the live data). Practice this discipline now; it's also the production discipline.

---

## Phase 0 — This week: stop being a passenger in your own codebase

Prove you can operate the machine, not just request features. Everything here uses tools you already have.

1. Start the app yourself from a cold machine: `php artisan serve`, `npm run dev` — then break it on purpose (rename `.env`, kill MySQL) and read the error screens until you can say *why* each one happened.
2. Run `php artisan test`. Watch it pass. Open one test file from the suite, pick the simplest test, and read it line by line. A test is the easiest code to read — it says "given this, do that, expect this."
3. Open `storage/logs/laravel.log`. Trigger an error (visit a fake route), find its entry, read the stack trace top to bottom. The top line is *where* it died; the lines below are *how it got there*. This one habit is 50% of debugging.
4. Learn 5 artisan commands until they're reflexes: `php artisan tinker` (poke your data live), `migrate`, `route:list`, `optimize:clear`, `test`.

**Pass/fail for Phase 0**: You can explain, out loud, what happens between typing `venqore.com/pos` in a browser and pixels appearing — in your own words, even roughly.

---

## Phase 1 — Weeks 1–4: The interview-ready sprint (trace your own system)

You don't need computer science to survive a technical interview. You need to know how **your** system does the six things it does. Method for each flow: (a) ask AI to walk you through it file-by-file, (b) close AI and re-trace it alone, writing a one-page explanation by hand, (c) rehearse it as a spoken 60–90 second answer.

The six flows, one per 3–4 days:

| # | Flow | Files to trace | The interview question it answers |
|---|---|---|---|
| 1 | A POS sale, end to end | `resources/js/Pages/Pos.jsx` → route in `routes/web.php` → controller → services → `Transaction`, `Stock`, `JournalEntry` models | "Walk me through what happens when a cashier hits Pay." |
| 2 | FIFO stock deduction | `app/Services/InventoryService` + `Stock` model | "How do you cost inventory? What if two sales hit the same batch at once?" (find the DB transaction / locking in the code — ask AI to point at the exact lines) |
| 3 | Double-entry posting | `JournalEntry` / `JournalItem` creation path from a sale, purchase, expense | "How do you guarantee the ledger always balances?" (answer includes: single writer service + the tests that block direct writes) |
| 4 | Tenant isolation | `Tenant`, `TenantUser`, how `tenant_id` gets applied to every query, how the active tenant is resolved per request | "How do you stop one store seeing another store's data?" |
| 5 | WooCommerce webhook → sale | webhook receiver → queued job (Horizon) → sale creation; what happens on failure/retry | "A webhook fails mid-transaction — what happens to the ledger?" |
| 6 | Offline POS sync | Dexie/IndexedDB caching in `Pos.jsx`, what syncs back and when | "POS is offline for an hour — what's the conflict story when it reconnects?" |

**Pass/fail for Phase 1**: Someone asks you any of the six questions above with your laptop closed, and you answer for 90 seconds without stalling. Rehearse with AI playing a hostile YC partner — literally prompt it: "Grill me like a YC technical partner on my POS flow; interrupt me when I'm vague."

*If an interview lands before you finish: answer what you know, and for the rest use the honest fallback from the application file — "I don't know that layer by hand yet; here's how I'd find out, and here's why the test suite still guarantees the behavior."*

---

## Phase 2 — Months 2–3: PHP, Laravel, SQL — the language under your product

Now build the floor under the tracing you did. Free-first resources, in order:

- **PHP**: Laracasts "PHP for Beginners" (free). You're not learning to program from zero — you're learning to *read* what's already in front of you, so take it fast and shallow first, deep second.
- **Laravel**: Laracasts "30 Days to Learn Laravel," then the official **Laravel Bootcamp** (bootcamp.laravel.com) — build their little app by hand, typing everything.
- **SQL**: SQLBolt (sqlbolt.com) end to end, then spend a week in `php artisan tinker` and raw MySQL querying *your own* tables: "show me today's journal items," "which products went negative." Your data is the best textbook you own.
- **Git**: You need branch, commit, diff, log, revert — nothing fancy. Practice by committing your learning exercises.

Weekly drills:
- **One break-fix per week, no AI**: have AI secretly plant a small bug in a scratch branch ("change one thing in a service, don't tell me what"), then find it using logs, `git diff`, and the failing tests. Time yourself. This is the debugging muscle, directly.
- **One hand-written feature**: something tiny and real (a new filter on a report, a new field on a form), typed by you, reviewed by AI *after* it works.

**Pass/fail exam (end of month 3)**: Find and fix a planted bug in under 2 hours without AI. Explain a `SELECT ... JOIN` across `transactions` and `journal_items` cold.

---

## Phase 3 — Months 4–6: JavaScript, React, and the bridge

- **JavaScript**: javascript.info — parts 1 and 2, skipping nothing about promises/async (your sync logic lives there).
- **React**: the official react.dev "Learn" track, then re-read `Pos.jsx` — it will be a different file to your eyes.
- **Inertia**: its docs are short; the payoff is big — Inertia *is* the answer to "how do your frontend and backend talk," a guaranteed interview topic.
- **HTTP fundamentals**: MDN's HTTP overview — requests, responses, status codes, cookies/sessions. One weekend.
- **Database depth**: transactions, isolation, deadlocks, indexes — read "Use The Index, Luke" (use-the-index-luke.com) selectively, then find every `DB::transaction` in your codebase and explain why each one exists.

**Pass/fail exam (end of month 6)**: Build one small full-stack feature — new page, new route, new table, new test — typing every line yourself, AI allowed only as a reviewer at the end. Ship it behind the test suite.

---

## Phase 4 — Months 7–9: Own the architecture

This is where you become the person who could have designed it:

- **Multi-tenancy**: study your own approach (shared DB + `tenant_id` scoping) vs database-per-tenant. Know the trade-offs cold — it's the architecture question you'll be asked for the rest of your career.
- **Queues and failure**: Horizon, retries, idempotency. Kill a worker mid-job on the test DB and watch what happens. Make peace with the phrase "at-least-once delivery."
- **Security basics**: OWASP Top 10, then audit one controller with AI: "find every place this trusts user input." Fix one thing yourself.
- **Backups and disaster**: practice restoring a backup of the production schema to a scratch database until it's boring. The founder who has done a restore is a different founder in a crisis.
- **Testing**: write 10 new tests by hand for edge cases *you* invent from shop-floor memory (returns after partial payment, negative stock, expired batches). You know the business cases better than any engineer — this is where your domain knowledge and new skills fuse.

**Pass/fail exam (end of month 9)**: Explain tenant isolation, FIFO-under-concurrency, and webhook failure recovery to a technical person for 10 minutes, questions allowed, laptop closed. (This is the YC interview bar, exceeded.)

---

## Phase 5 — Months 10–12: Production readiness

- **Performance**: find and fix one real N+1 query (AI can teach you Laravel Debugbar / query logging; you do the finding).
- **Monitoring**: wire up error tracking so production exceptions reach you; do one week of being genuinely "on call" for your own three businesses.
- **Deployment**: deploy the app to a fresh server yourself, once, by hand, documenting every step. Painful and irreplaceable.
- **Hand-build one meaningful module** end to end (a small report suite or a settings area) — you first, AI as reviewer.

**Pass/fail exam (month 12)**: A senior engineer (your first hire, by then) reviews your month-12 module and would merge it. You can hold your own in their architecture discussions. That was the goal: *in a year, the skills and the product.*

---

## The cadence that holds it together

| Daily (1.5–2h) | Weekly | Monthly |
|---|---|---|
| 45 min reading your own code, AI closed | One break-fix drill, timed, no AI | One hand-written feature shipped behind tests |
| 45–60 min course/book work, typing everything | One flow re-explained aloud (rotate the six) | Re-run the current phase's pass/fail; don't advance until it passes |
| 15 min: write down what confused you; ask AI at day's end | Update a learning log (one paragraph — future interviews love this) | |

Three honesty rules, because they're also strategy: never ship what you can't explain; never claim in an interview what you haven't done in this plan; and when AI explains something, make it quiz you back — explanation without recall is entertainment, not learning.

The day this plan finishes, "I direct AI" becomes "I engineer with AI" — the exact profile YC said it funds. Until then, the truth plus this trajectory is a better pitch than any claim: *"Here's what I couldn't do six months ago, here's what I can do today, and here's the system I built so that my not-knowing could never corrupt a customer's books."*
