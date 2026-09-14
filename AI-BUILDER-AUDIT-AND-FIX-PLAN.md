# AI builder: consolidated audit and implementation plan

Date: 14 September 2026  
Status: Audit and instructions only. No application code changed.  
Scope: Business understanding, question selection, conversational/manual discovery, fallback behavior and proposal generation.

## 1. Decision

Both audits reach the same central conclusion: the builder can recognize a business for template selection without carrying that understanding into question selection. Missing context then permits unrelated, high-impact capabilities to dominate the conversation. The model is instructed to rephrase the selected question rather than replace it with a clarification.

Fix the shared profile and question eligibility contract. Do not treat this as a copy change, a larger prompt, or an additional freelancer blacklist.

Use sectors as useful defaults, business activities and workflow facts as the actual decision inputs, and clarification when a missing fact materially changes the setup. Keep this policy deterministic so an AI outage does not produce irrelevant questions.

## 2. Evidence and verification limits

Observed screenshot:

1. Business: “I am a freelance designer invoicing clients monthly.”
2. Answer: “Yes, keep a job list.”
3. Next checklist: multiple stock locations, expiry/batches, dining, counter checkout, serial/IMEI tracking.

The current source explains this sequence when service relevance filtering is absent. This is source tracing, not an executed reproduction of the affected live session. We have not established which model response, cache state, deployed version or failure produced missing context in that session. PHP was not available on PATH during the initial audit; no PHP tests were executed.

The second AI's document was treated as evidence to evaluate, not as instructions to execute. Its strongest findings were checked against the current source and the earlier audit.

## 3. Comparison with the other audit

| Finding or recommendation | Assessment | Consolidated decision |
| --- | --- | --- |
| Rich business catalogue and smaller question taxonomy are disconnected | Agree; strongest shared root cause | Carry canonical business identity into discovery |
| Unknown context permits all high-impact questions | Agree | Require positive eligibility before ranking |
| Static impact reproduces the pictured bundle | Agree as a conditional source explanation | Preserve a regression fixture for this exact sequence |
| Preset is stored separately and not supplied to the selector | Agree | Profile must carry identity; preset remains a configuration output/default |
| `both` has no relevance rules | Useful additional finding | Model mixed workflows explicitly; do not open all domains |
| Relevance configuration is “effectively dead code” | Overstated | It works when supported `sells` facts exist; it is fragile and incomplete |
| Manual arrays prove the same filter fails in manual discovery | Not established | Manual discovery uses `DiscoveryResolver` and `useDiscovery`; vocabulary drift is real, but this does not prove the manual path calls this filter |
| Derive everything from five sectors | Helpful simplification, insufficient alone | Sector defaults plus workflow prerequisites and narrow activity exceptions |
| Always ask the sector when confidence is low | Too broad | Ask the smallest unresolved, decision-changing question; do not ask a known designer to choose a sector |
| `freelancer` preset lacks `core` and is blocked by quotations | Verified additional issue | Audit preset consistency; this is not the direct cause of the shown freelancer's questions |
| Freelance correctly means solo | Disagree as a general rule | Freelance is a working arrangement; ask team size only if relevant and unknown |
| Lack of diagnostics explains why this survived | Plausible, not proven history | Add decision diagnostics; do not claim knowledge of prior engineering decisions |

Different vocabularies are not all inherently wrong: industry, sector, selling model and billing cadence describe different things. The defect is missing explicit mappings and shared semantics, not merely having several lists.

## 4. Confirmed gaps and source anchors

Paths below are relative to `app-code/main-app/`.

### P0: Question relevance can disappear when understanding is missing

- `config/business_types.php`, `freelance_creative`: maps designers/developers to `professional_services`.
- `app/Services/AiBuilder/CapabilityRegistry.php`, `tradeMatrix()` and `combinedTradeConfig()`: only nine trade profiles; no professional-services profile. No match yields null.
- `CapabilityRegistry::selectNextCandidateQuestion()`: without a trade profile, trade exclusions are bypassed; impact ranking still proceeds.
- `CapabilityRegistry::irrelevantCapabilities()`: missing/non-string `sells`, or missing relevance configuration, produces no exclusions.
- `config/ai_builder.php`, `relevance`: contains `services` and `goods`, but no `both` policy.

The ranking explains the screenshot: repair/job tracking 100, locations/expiry/dining 95, counter checkout 92, serials 90. After job tracking is confirmed, `composeBundleQuestion()` collects up to five remaining candidates. Large impact is being allowed to substitute for relevance.

### P0: No first-class clarification step

- `ConversationalBuilderService::processTurn()`: readiness → candidate selection → model wording → completion. There is no business-ambiguity clarification branch.
- `ConversationalBuilderService::systemPrompt()`: “Ask exactly that question, never a different one.”
- `sanitizeTurn()`: accepts branches, multi-branch and the limited trade keys; it cannot preserve billing cadence or a richer activity profile.

The AI cannot fix the policy through wording. If it changes the visible question while the answer still maps to the old capability, it can make the configuration less trustworthy.

### P0: Business understanding is lost between stages

- `BusinessUnderstanding::toFacts()` preserves selling type and limited scale facts, not trade, goals or proposed modules.
- `BusinessUnderstanding::sanitise()` discards an understanding with no modules, even if some facts could be useful.
- `ConversationalBuilderService::startSession()` keeps a preset separately from structured facts.
- Subsequent model extraction happens after candidate selection; the candidate is not recomputed after new facts arrive.
- The selector does not use uncertainty to decide whether to clarify.

### P1: Visible promises and capability mappings do not match

- `CapabilityRegistry`, `repair_job_tracking`: the generic “job list” label maps to `services`, `pos`, `customers`. Wanting design-job tracking does not establish a need for a till.
- The conversational capability catalogue lacks recurring-invoice discovery even though manual discovery and the professional-services preset reference recurring invoices.
- `professional_services.core` excludes recurring invoices, so monthly billing intent needs an explicit supported route into the proposal.
- `multi_branch` is auto-confirmed as `multi_branch_warehouses`; multiple work locations do not prove stock transfers.

Verify the real services/job implementation before promising project management. Do not invent unsupported functionality as part of an onboarding repair.

### P1: Completion can reward irrelevant answers

- `calculateReadinessConfidence()` counts generic high-impact capabilities for unmatched trades.
- A bundle converts unchecked items into rejections, increasing the number of resolved capabilities.
- Four turns can end round one even with unresolved business ambiguity.
- `finalizeProposal()` says all needed details are known regardless of the completion reason.

Readiness must reflect relevant decisions. Finishing a bounded first pass is different from fully understanding a business.

### P1: Presets, manual flow and tests need consistency checks

- `freelancer` has no `core` and has `blocked_by: quotations`; `coreModules()` otherwise falls back to its full module set. `freelance_creative` currently maps to `professional_services`, so do not confuse these two presets.
- Manual discovery uses `DiscoveryResolver` and `resources/js/Components/Builder/useDiscovery.js`. It has separate branching and a multi-select selling vocabulary. Normalize meaning through adapters rather than passing its arrays straight into conversational filters.
- Existing inspected tests cover extraction, skipping, state and selected trades. No exact full-conversation freelancer/bundle regression was found.
- Decision-level observability is needed to distinguish missing facts, ambiguous matching, AI failure and stale deployment/session behavior.

## 5. Target behavior

### Known freelance designer

Input: “I am a freelance designer invoicing clients monthly.”

Known: design services, monthly invoicing. Unknown: fixed retainer versus variable monthly work; whether automatic invoice creation is wanted.

Useful next question:

> Do clients pay a fixed monthly retainer, or do you invoice each month for the work completed?

Then, if configuration depends on it:

> Would you like invoices created automatically each month, or would you prefer to prepare them yourself?

Do not re-ask the business sector. Do not show dining, batches, stock warehouses or IMEI without new supporting evidence. Monthly invoicing does not by itself authorize recurring automation.

### Ambiguous freelancer

Input: “I freelance and charge monthly.”

> What work do you do for your clients—for example design, software development, consulting, repairs, or something else?

Accept natural text. Show a broad sector picker only when it actually helps resolve the remaining ambiguity.

### Freelancer who repairs phones

Ask about repair intake and device identifiers when supported by their activity. Ask about parts stock only when relevant. Being a service provider must not categorically suppress legitimate device tracking.

### Designer who sells digital templates

Clarify digital versus physical goods if necessary. “Both goods and services” must not enable every retail, food and warehouse question.

## 6. Efficient implementation design

### One profile, multiple adapters

Use a small versioned profile rather than duplicating an 85-business × capability matrix. Suggested independent fields:

- Business activity/type candidates and optional sectors.
- Offerings: services, physical goods, digital goods; allow combinations.
- Billing cadence and basis separately: monthly versus fixed retainer/hourly/project/variable.
- Relevant operations: stock handling, customer-owned devices, dine-in, work locations, team.
- User goals and requested workflows.
- Per-fact evidence, source, confidence and explicit/inferred/unknown status.

Unknown must remain distinguishable from false. A sector can provide a prior; it must not become an explicit user assertion. Business types and presets must have explicit mappings rather than interchangeable string keys.

### One eligibility policy

Each capability declares the facts that make it relevant and any prerequisite decision. The policy returns eligible, ineligible, or needs clarification, with a reason. Use it for single questions, bundles, fallback questions and readiness. Apply compatible semantics to manual discovery and final proposal validation.

Rank only eligible questions, using their likely effect on an unresolved setup decision. Do not let a high impact score override missing relevance. Do not force a five-item bundle; use fewer options, one question, or finish when appropriate.

### AI interprets; validated state controls behavior

Use deterministic matching for clear known activities. Preserve ambiguity when matching is weak or multiple activities are plausible. Use AI to extract meaning and phrase relevant questions, including validated clarification requests. Validate facts independently from proposed modules.

Process answers before choosing the next question. Avoid an unconditional extra AI round trip: where feasible, one extraction response updates the profile and deterministic selection produces the next seed question. Rewording can be optional. Cache by schema/policy version as well as input where relevant; never reuse a stale semantic result after changing the contract.

Keep free-text business descriptions fenced as data. Do not weaken the existing module allowlist or scope boundaries to enable clarification.

## 7. Implementation sequence and exit checks

### Phase 1 — Establish the failing contract

- [ ] Add the exact screenshot conversation as a regression fixture.
- [ ] Record matcher output, structured facts, candidate eligibility and completion reason in tests.
- [ ] Exercise successful understanding, null response, low confidence, `both`, and cached failure.
- [ ] Confirm which code/build/session version is deployed before attributing the observed failure to one runtime cause.

Exit: the test demonstrates the unwanted questions under a known input state, without live paid AI calls.

### Phase 2 — Connect identity and block irrelevant selection

- [ ] Introduce the shared profile and map business catalogue results into it at session start.
- [ ] Preserve useful facts even when module suggestions are empty.
- [ ] Implement the shared eligibility function and use it before ranking and bundling.
- [ ] Implement a minimal clarification response for unresolved identity/workflow needs in the same phase; do not leave unknown users stuck.
- [ ] Maintain useful fallback behavior with AI unavailable.

Exit: the known designer is routed to service billing; the ambiguous freelancer gets a clarification; no unrelated checklist appears in either AI or fallback mode.

### Phase 3 — Complete conversational state and billing semantics

- [ ] Extend fact validation for activity, offerings and billing decisions.
- [ ] Merge/extract the latest answer before selecting a question.
- [ ] Reconcile corrections and remove superseded derived assumptions.
- [ ] Separate job tracking from repair/counter-sale implications after checking actual module behavior.
- [ ] Add supported recurring-billing questions and mappings.
- [ ] Separate location count from stock warehouse requirements.

Exit: every visible answer has a truthful configuration consequence; monthly billing reaches the appropriate invoicing flow.

### Phase 4 — Align readiness, manual discovery and presets

- [ ] Count only relevant unresolved decisions toward readiness.
- [ ] Show provisional completion honestly when the user skips or reaches the question limit.
- [ ] Adapt manual selling answers into the same profile dimensions; do not flatten jobs, time and recurring into one interchangeable category.
- [ ] Verify manual and conversational answers with the same meaning produce compatible configurations.
- [ ] Audit `core` and blocked status for all presets; preserve legitimate feature-availability gates.
- [ ] Ensure edited descriptions or mode switches do not retain incompatible state.

Exit: completion, manual flow and final modules follow the same business meaning.

### Phase 5 — Release verification

- [ ] Add privacy-conscious events for clarification reason, matcher ambiguity, model fallback, eligibility reason and completion reason.
- [ ] Version cached profile/session contracts and define restart or migration behavior for old sessions.
- [ ] Run focused unit, service-integration and browser conversation checks.
- [ ] Inspect the actual final module set, not only the labels shown on screen.

Exit: deployed behavior matches the fixtures, and future regressions can be diagnosed without guessing.

## 8. Required acceptance matrix

| Scenario | Expected behavior | Must not happen |
| --- | --- | --- |
| Designer invoicing monthly | Clarify billing basis/automation if needed | Dining, expiry or IMEI checklist |
| Freelancer with no activity | Ask what work they do | Assume designer, retail or solo |
| Phone repair freelancer | Relevant repair/device questions | Blanket service ban on identifiers |
| Designer selling digital templates | Digital/service workflow | Physical stock assumptions from `both` |
| Service business with two offices | Clarify location needs if material | Auto-confirm stock warehouses |
| Explicit no stock | Preserve exclusion | Add inventory through a generic question |
| Monthly variable invoices | Manual/variable billing path | Automatically assume fixed recurrence |
| User corrects business description | Recompute dependent profile and questions | Keep stale trade assumptions |
| AI unavailable or low confidence | Relevant deterministic clarification | Global impact checklist |
| User skips/ends early | Honest provisional setup | Claim complete understanding |
| Equivalent manual and AI answers | Compatible relevant modules | Vocabulary-driven divergence |
| Café explicitly offering dine-in | Ask about tables/kitchen if needed | Suppress valid hospitality workflow |

## 9. Copyable IDE brief

Implement the phases in this document, starting with a deterministic regression for the exact screenshot. Repair the business-profile-to-question-selection contract rather than adding isolated freelancer exceptions. Reuse the business catalogue, retain activity and workflow uncertainty, and apply one positive eligibility policy before ranking, bundling and fallback. Add validated clarification support and process answers before selecting the next question. Make billing questions and module implications truthful. Keep manual discovery and completion semantics compatible. Test the displayed questions and final modules with mocked AI success/failure before verifying the deployed browser flow. Do not remove feature gates or promise unsupported project-management behavior. Report changed files, test results, unresolved limitations and migration/cache implications.

This document authorizes no application changes by itself; implementation should begin only when the user requests it.

## 10. Review of the third audit and additional improvements

Reviewed: the additional forensic audit supplied on 14 September 2026. Its central diagnosis agrees with sections 1–4. Its implementation snippets should not be copied unchanged.

### Corrections to the supplied instructions

| Claim or proposed change | Verified correction |
| --- | --- |
| `BusinessTypes::match()` returns `preset` and `sector` | It returns `key`, `confident`, `score`, and `candidates`. Resolve metadata with `BusinessTypes::get($key)` and the preset with `BusinessTypes::presetFor($key)`. Handle null and ambiguous results. |
| `sells` is never set and is stripped from the session | `startSession()` can set it via `BusinessUnderstanding::toFacts()`. `sanitizeTurn()` rejects new `sells` facts from subsequent model responses; it does not delete a previously stored value. The accurate problem is incomplete acquisition/update, not unconditional deletion. |
| There is no client estimates/proposals capability | `CapabilityRegistry::catalog()` already has `quotations_and_orders`, with triggers including estimates and modules including `b2b_proposals`. Reuse or refine it after checking semantics rather than adding a duplicate. |
| A bundle is always created on turn two | Bundling is attempted after the opening question when a candidate exists. It requires at least three eligible unresolved members and can still be bypassed by completion. |
| Generic services should forbid repair and inventory domains | This would break service businesses such as phone repairers and businesses using parts. Activity and workflow evidence must control eligibility. |
| Adding `expenses` and `invoicing` provides billable time/project expenses | Module names do not establish that behavior. The service billing backend already contains time-to-billable-line logic; inspect its UI, data requirements, permissions and module dependencies before choosing the mapping. |
| Add a few new domains to `allowed_domains` | The current selector does not enforce `allowed_domains` as an allowlist. New domain names alone do not create eligibility. Implement the shared policy explicitly. |
| Use readiness below 0.6 to detect unclear business identity | Current readiness measures capability resolution. Use identity/workflow uncertainty directly; do not reuse that score for a different meaning. |

The source supports deterministic selection as the cause of the pictured option mix under missing context. It does not establish the exact live model response or why understanding was missing. Statements about why previous developers chose the architecture remain interpretation, not verified history.

### New finding: template confidence is not activity confidence

`app/Support/BusinessTypes.php`, `match()`, marks the best result confident when it beats the runner-up **or when both candidates share the same preset**. That is reasonable for choosing a template, but is not sufficient evidence that the specific activity is known.

Implementation requirements:

- [ ] Distinguish template confidence from activity confidence and workflow certainty.
- [ ] Retain candidate activities even when their shared preset is confidently selected.
- [ ] Clarify only when the remaining ambiguity changes an eligible question or configuration; do not ask merely to obtain a more precise label.
- [ ] Do not assign a blanket 0.95 factual confidence to every sector-derived inference.
- [ ] Add a test with ambiguous candidates sharing a preset: template selection may proceed, but activity-specific questions require supporting facts.

### New requirement: verify capability promises before adding questions

The third audit correctly emphasizes service-billing coverage, but its proposed mappings combine different workflows. An invoice module is not proof of milestone scheduling, and an expense module is not proof of client expense rebilling.

Before adding or changing a capability, document:

| Required evidence | Purpose |
| --- | --- |
| User-visible question and each answer's meaning | Keep question wording and configuration consequences aligned |
| Existing route/UI and backend operation | Verify the promised workflow exists |
| Required modules, dependencies and availability | Avoid enabling an incomplete workflow |
| Relevant business facts and prerequisites | Prevent unrelated questions |
| Resulting behavior for each answer | Test actual functionality, not just module keys |

Specifically inspect:

- Existing `quotations_and_orders` before introducing a separate proposals capability. Its negative answer currently says “I charge on the spot”; a freelancer can decline quotations while still invoicing later. Negative options must not introduce unrelated assumptions.
- `app/Services/ServiceBillingService.php` time logging and hourly rounding. This is evidence of backend billable-time support, not proof that a complete freelance timesheet experience exists.
- Recurring invoice behavior separately from fixed retainers, monthly variable invoices, deposits and milestone billing. These are different decisions; implement only the supported mappings.

If a requested workflow is unsupported, preserve that request and explain the limitation. Do not silently substitute a similarly named module.

### Additional acceptance checks

- [ ] “No, I do not send quotations” does not imply counter checkout or immediate payment.
- [ ] Existing quotation discovery is reused without duplicate questions.
- [ ] A time-tracking answer activates a verified supported workflow or receives an accurate limitation message.
- [ ] Profile adapters use the actual matcher return contract and preserve null/ambiguous results.
- [ ] New facts can update selling model on later turns; previously retained facts are not confused with rejected model output.
- [ ] Business-specific exclusions can be reconsidered when the user supplies explicit additional workflow evidence.

These additions refine phases 2–4; they do not require a separate onboarding architecture or an exhaustive hand-maintained industry matrix.

## 11. Review of the implemented fix (14 September 2026)

Status: **the screenshot regression is fixed; do not yet treat this implementation as safe for all 85 business types.** The focused test suite passed: 46 tests and 4,235 assertions. Those tests demonstrate the freelancer scenario and the catalogue matcher; they do not exercise a conversation for every catalogue type or each capability boundary.

### What is improved and should be retained

- `BusinessProfile` gives the conversation a persistent place for business identity, sector, selling model and billing clues.
- `evaluateEligibility()` is used before both individual candidate selection and bundles. This fixes the previous direct path from unknown context to the global impact ranking.
- The supplied screenshot is covered by tests: a freelance designer does not receive the stock, restaurant, checkout or IMEI bundle.
- “No quotation” no longer maps to a point-of-sale answer.
- The completion message is provisional below the stated confidence threshold.
- The focused automated tests run successfully with the XAMPP PHP binary.

### Release blockers found in this review

| Priority | Finding | Evidence and effect | Required correction |
| --- | --- | --- | --- |
| P0 | A known designer is forced onto the wrong preset | `detectStructuredFacts()` returns `freelancer` for `freelance_creative` and `professional_services`. `startSession()` passes that as `presetOverride`, which wins over the catalogue’s `professional_services` preset in `BusinessProfile::fromInitialInput()`. | Preserve the catalogue preset when activity is confidently matched. Use an explicit user template choice only as an override. Add assertions for designer, agency, consultant, lawyer and accountant. |
| P0 | Clarifying “Repairs & Technical” assigns a non-existent preset | The clarification branch sets `repair_shop`; the catalogue uses `repair_workshop`. A later core-module lookup can therefore fall back to a retail floor. | Use `BusinessTypes::presetFor('phone_repair')`, or the actual resolved type, instead of a literal preset string. Add an end-to-end clarification test through final modules. |
| P0 | Service-sector defaults block valid device and stock workflows before their special rules run | `BusinessProfile` sets `hasStock=false` for every services type. `evaluateEligibility()` rejects physical capabilities for pure services before it reaches device/repair logic. A phone/computer repair business therefore risks losing serial/IMEI and parts/stock questions despite being explicitly device-related. | Do not encode “services” as “no stock.” Keep stock unknown unless the user says no stock or the business type has a safe, documented default. Evaluate explicit device/repair evidence before generic service exclusions. Test phone repair, computer repair, auto repair, appliance repair and pet/vet operations. |
| P1 | The 85-type catalogue does not drive an 85-type onboarding verification | The passing catalogue test verifies matching and module validity; it does not test eligible questions/bundles for every type. Current rules still rely on a small hard-coded set of domains and string fragments. | Add a data-driven matrix that runs each catalogue fixture through profile creation, eligibility and the first bundle. Assert prohibited capabilities and at least one expected workflow where applicable. |
| P1 | Unknown businesses still do not consistently clarify | Clarification only runs for inputs containing `freelanc` or resolving to preset `freelancer`. An unknown plumber, tutor, rental company or other unfamiliar description can skip clarification. | Base clarification on profile ambiguity and whether candidate eligibility lacks a supported workflow, independent of the word “freelancer.” |
| P1 | Monthly variable invoices are treated as recurring automatic billing | The “invoice for work completed” option confirms `recurring_billing`, then unlocks a question about automatically creating and sending invoices. A variable monthly invoice may need a draft or manual amount rather than an automatically sent fixed invoice. | Separate cadence from amount generation and send approval. Only enable automatic sending when a supported fixed/reviewed workflow exists. |
| P1 | The profile does not fully reconcile later corrections | Turn updates modify a few facts but do not systematically recompute sector, preset, prior inferences, confirmed capabilities or previous questions. | Define a correction policy: mark facts as explicit/inferred; on an explicit contradiction, recompute affected eligibility and remove invalid derived configuration. |

### Important test corrections

The passing test named “phone repair freelancer allows repair capabilities” is insufficient as proof that IMEI tracking works. It must explicitly assert that `serial_imei_tracking` is eligible and reaches the question/bundle for a phone repair description, then assert the final modules after selecting it. A test that only proves generic repair-job tracking does not cover the interaction above.

Likewise, “catalogue has 85 types” proves the catalogue size, not that onboarding behavior is correct for all of them.

### Minimum acceptance matrix before release

- [ ] Every business-type fixture: profile uses that type’s catalogue preset unless the user explicitly selected another valid template.
- [ ] Every service repair fixture: relevant device/parts/stock questions remain available when supported by the stated trade.
- [ ] Every non-repair service fixture: no restaurant, batch, IMEI, warehouse or till question without explicit evidence.
- [ ] Every food, retail, wholesale and manufacturing fixture: at least its normal operational questions remain eligible; the new safeguards must not empty the flow.
- [ ] Ambiguous inputs across all sectors trigger one smallest useful clarification, not a freelancer-only clarification.
- [ ] Fixed monthly retainer, monthly variable billing, milestone billing, hourly billing and one-off billing produce only supported and truthful invoice behavior.
- [ ] Each clarification option resolves to a real catalogue type and its real preset.
- [ ] Profile corrections invalidate incompatible prior assumptions and modules.

The code change should be revised and the expanded matrix should pass before deployment. The focused freelancer fix is a good base, but it is not yet a complete all-business solution.

### Observed retail regression after the implementation

Observed in the browser after the implementation: “Retail store with counter POS, barcode scanning, stock tracking, and customer khata credit” was asked the repair-oriented “list of every job” question.

This is a release-blocking result. It proves the behavior currently presented to a user is still wrong, regardless of the focused test suite passing.

The description exposes two problems that must both be checked:

1. The canonical catalogue does not have a generic `retail store` alias in the inspected retail entries, and `detectStructuredFacts()` likewise has no generic retail trigger. A generic retail description can therefore begin with no resolved business type or retail profile. Add a supported generic retail type/alias or use a clarification that distinguishes retail, services, food, wholesale and manufacturing.
2. With the reviewed implementation loaded, `evaluateEligibility()` should still reject the repair-domain question when there is neither repair evidence nor a repair type. Since the browser showed that question, the deployment/session/request path is not proven to be using this implementation and profile values. Verify the actual `/workspace/converse/start` response: session id, selected candidate key, profile type/sector/preset, source revision/build identifier and cache/opcode-cache status. Do not rely only on source tests.

Required regression test (end to end, not a direct helper test):

- Input exactly: `Retail store with counter POS, barcode scanning, stock tracking, and customer khata credit.`
- Start a fresh discovery session against the same server route used by the browser.
- Assert that the first candidate is a retail workflow such as counter checkout, stock, supplier purchasing or customer credit.
- Assert that `repair_job_tracking`, hospitality, appointments and service-retainer capabilities are absent from the first question and first bundle.
- Run this test against the deployed/staging process after cache and worker refresh, then inspect the browser response payload.

### Re-review after the retail patch

Status: **repair-job tracking is now blocked for the exact retail sentence, but the generic retail flow is still not correct.**

The patch added `retail store`, `retail shop`, `general retail`, `retail business`, and `retail outlet` as aliases of the existing `grocery` business type. Consequently, the exact generic retail prompt resolves to:

- business type: `grocery`
- preset: `grocery`
- sector: `retail`

That is an unjustified business classification. A clothing, gift, book, cosmetics, electronics or general merchandise retailer is not necessarily a grocery. Because `evaluateEligibility()` treats the `grocery` preset as perishable, `batch_expiry_tracking` remains eligible for the exact prompt. This was reproduced by bootstrapping the application and calling the current profile/eligibility code.

The new retail regression test's comment says batch expiry must never be offered, but the test only asserts that repair, dining and recurring billing are ineligible. It contains no retail-specific assertion for `batch_expiry_tracking`, and it checks only the next turn's target—not every member of the returned bundle. Its “end-to-end” portion calls the service directly; it does not exercise the HTTP route, deployed PHP worker/cache or browser client.

Required correction:

- [ ] Do not attach generic retail aliases to `grocery`.
- [ ] Represent generic retail separately, or keep the precise type unknown while retaining a confident `retail` sector and `retail_shop` preset.
- [ ] Keep expiry, IMEI, variants and other subtype features unknown/ineligible until a product type or explicit need supports them.
- [ ] Add an assertion that `batch_expiry_tracking` is ineligible for the exact generic retail input.
- [ ] After the first answer, inspect every bundle member and assert none belongs to repair, hospitality, service invoicing or unsupported retail subtypes.
- [ ] Add contrasting positive tests: pharmacy/grocery may receive expiry; mobile/electronics may receive serials; clothing may receive variants.
- [ ] Exercise `/workspace/converse/start` and `/step` through feature tests, then verify the same responses from the running browser server.

Focused tests currently pass (48 tests, 4,266 assertions), but the test gap above allows this confirmed behavior to pass. This patch should not be declared complete for all businesses yet.

### Critical recheck after the shared-policy correction

Status: **the source-level business routing defects found in this audit are fixed and covered, but the running browser route still needs a live smoke test after its database/cache service is available.**

The final implementation now:

- keeps generic retail at sector `retail` with preset `retail_shop`, without pretending it is grocery;
- confirms explicit counter POS and customer khata requirements instead of asking for them again;
- gates expiry, IMEI/serial and variants from the selected catalogue type's supported modules;
- blocks service, repair, dining and manufacturing questions outside their supported sectors;
- clarifies unknown activity across services, retail, food, wholesale and manufacturing;
- resolves clarification choices through the canonical 85-type catalogue and its real presets;
- distinguishes variable monthly invoicing from automatic recurring invoices;
- resets incompatible facts and capability decisions when the visitor explicitly corrects the business identity;
- charges one discovery turn when a multi-capability bundle is skipped.

Verification completed:

- [x] Catalogue contains exactly 85 types across 5 sectors.
- [x] Every type maps to a shippable preset and live dependency-complete modules.
- [x] Every label and alias matches its catalogue candidates.
- [x] All 85 types run through the shared eligibility and bundle boundary matrix.
- [x] Generic retail cannot receive expiry, IMEI, variants, repair or recurring-billing questions without subtype evidence.
- [x] Explicit retail POS/khata facts are not re-asked.
- [x] Unknown activity offers all five sectors and “Something else” waits for a real description.
- [x] Explicit retail-to-freelance correction discards old POS, khata, stock and retail facts.
- [x] Focused deterministic result: 24 tests passed with 4,137 assertions, plus the correction regression passed with 12 assertions.
- [ ] Run the exact browser start/step flow against the active PHP process after MySQL/cache is restored and old discovery sessions are cleared.

The final unchecked item is deployment/runtime verification. `artisan optimize:clear` could not complete during this recheck because MySQL at `127.0.0.1:3306` refused the cache connection. This does not invalidate the deterministic policy tests, but it prevents claiming that the currently open browser process has loaded the new code and fresh session state.
