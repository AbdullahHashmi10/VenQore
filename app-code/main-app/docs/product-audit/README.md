# VenQore product coverage and selling reference

Snapshot: **16 October 2026**.

## Read these three documents

1. [Feature catalog](FEATURE_CATALOG.md): itemized capabilities, purpose, operating notes, source families, exact internal counts, every registered module and the report catalogue.
2. [Customer problems and workflows](CUSTOMER_PROBLEMS_AND_WORKFLOWS.md): what each business family struggles with, how work is done, exception scenarios and ways to measure improvement.
3. [Marketing by business](MARKETING_BY_BUSINESS.md): outcome-led messaging for retail, wholesale, food, services, light manufacturing and mixed operations. Internal feature counts are excluded from customer copy.

## Supporting evidence

- [Verification and claims](VERIFICATION_AND_CLAIMS.md): what was actually checked, local screen observations, contradictions and remaining verification.
- [Every business type and starting setup](BUSINESS_TYPE_COVERAGE.md), with [scenario matrix](business-type-scenario-matrix.csv).
- [Canonical how-to guides](GENERATED_HOW_TO_GUIDES.md).
- [Every page and source scope](PAGE_AND_SOURCE_COVERAGE.md), [page inventory](page-inventory.csv), [file coverage](file-coverage.csv), and [document index](document-index.csv).
- [Page-by-page purpose, interface text and action references](PAGE_BY_PAGE_REFERENCE.md), [page capability rows](page-capabilities.csv), and [historical feature claims retained for reconciliation](HISTORICAL_CLAIM_REGISTER.md).
- [Capability rows](capability-catalog.csv), [report destinations](report-catalog.csv), [metric definitions](metric-catalog.csv), [routes](route-inventory.csv), and [registry export](registry-evidence.json).
- [Internal count definitions](COUNTS.md).
- [Explicit implementation markers](IMPLEMENTATION_MARKERS.md), [marker rows](implementation-markers.csv), [source function index](source-function-index.csv), and [documentation validation result](validation-result.json).

## Status and boundaries

The source-backed documentation package is written. The exhaustive page-by-page, role-by-role and scenario-by-scenario operational audit remains incomplete. A source scan and page rendering are separate from submitting a workflow and reconciling its outcome. The verification record identifies the remaining work instead of presenting it as passed.

The current application is `app-code/main-app`. Mobile and Station source/docs were included. Historical application copies, dependencies, generated bundles, private records and unrelated projects were not used as current feature proof. The inventory records scope so exclusions stay visible.

The source registries remain authoritative. These files are dated snapshots for people to read, not new runtime configuration lists. Do not alter the application from these generated snapshots.

## Refresh the evidence

From the main application directory, run `php docs/product-audit/tools/export.php` and save its standard output as UTF-8 to `docs/product-audit/registry-evidence.json`. It boots the framework and reflects route/configuration definitions without invoking business actions. Then run `docs/product-audit/tools/inventory.py`, `docs/product-audit/tools/build_documents.py`, `docs/product-audit/tools/page_reference.py` and `docs/product-audit/tools/source_findings.py` using the available Python runtime. Finally run `docs/product-audit/tools/validate.py`.

The capability definitions in `tools/capabilities.txt` are editorial, evidence-linked rows; review them when product behavior changes. The problems/workflow, marketing and verification documents require editorial review and are not overwritten by the generator. A regeneration does not certify a release or replace browser, financial, device or integration testing.
