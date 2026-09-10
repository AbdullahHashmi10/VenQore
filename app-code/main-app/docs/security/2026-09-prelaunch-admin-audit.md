# Pre-launch platform-admin audit — 2026-09-09

## Scope and environment

This is the read-only local audit required by remediation task T-02. It was run
against the database configured by the local application:

- Database: `venqore_pos`
- Environment: local development machine
- Production access: not available from this workspace

This file is **not production breach evidence**. The same queries must be run on
production by an authorised operator before launch, and their dated output must
replace or accompany this local record.

## Platform administrators

The plan's literal predicate
`is_platform_admin = 1 OR platform_role IS NOT NULL` returned seven rows because
this schema uses the non-null string `none` for ordinary users. That predicate
therefore produces false positives.

The corrected read-only predicate was:

```sql
SELECT id, name, email, is_platform_admin, platform_role, created_at, last_store_id
FROM users
WHERE is_platform_admin = 1
   OR (platform_role IS NOT NULL AND platform_role NOT IN ('none', ''));
```

Local result: **0 rows**. There is no elevated local account. This is acceptable
only as a local-development observation; production is expected to contain the
recognised platform owner and must be checked independently.

## Known debug-route artefacts

```sql
SELECT id, email, created_at FROM users WHERE email = 'testpk@venqore.com';
SELECT id, name, slug, created_at FROM tenants WHERE slug = 'test-pk-store';
```

Local results:

- `testpk@venqore.com`: 0 rows
- `test-pk-store`: 0 rows

No purge was performed because neither artefact exists locally.

## Tenant creation clustering

```text
2026-09-09  8
2026-09-08  5
2026-09-04  1
```

These are local fixtures/development records. Production clustering still needs
human review against known signup and migration activity.

## Local plan prices

Read-only result from `plans`, ordered by `sort_order`:

| Slug | Monthly | Annual | Monthly PKR | Annual PKR |
|---|---:|---:|---:|---:|
| trial | 0 | 0 | null | null |
| scale | 299 | 2990 | null | null |
| core | 99 | 990 | null | null |
| solo | 0 | 0 | null | null |
| counter | 18 | 180 | null | null |
| custom | 800 | 0 | null | null |
| ltd_1 | 0 | 0 | null | null |
| starter | 49 | 490 | null | null |
| ltd_2 | 0 | 0 | null | null |
| growth | 99 | 990 | null | null |
| business | 299 | 2990 | null | null |
| ltd_3 | 0 | 0 | null | null |

No data was changed. Price reconciliation must wait for T-15's canonical plan
mapping and then be repeated against production.

## Production actions still required before launch

1. Run the corrected elevated-user query above on production and have the repo
   owner recognise every row.
2. Run the two debug-artefact queries on production. Preserve evidence before
   any deletion or demotion.
3. Review production tenant-creation clustering against known activity.
4. Reconcile production plan prices after T-15 resolves the canonical slug map.
5. If an unrecognised elevated user exists, demote it, invalidate its sessions,
   and retain the account and logs for investigation.
6. Audit `settings.value` rows for `key = 'print_logo_path'` whose path ends in
   `.svg`. SVG logo uploads are now rejected and generic `/storage` serving no
   longer permits SVG, so any existing production SVG logo needs an
   owner-approved raster replacement. Do not rename or convert it blindly.
