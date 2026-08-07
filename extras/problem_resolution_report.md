# Problem Resolution Report (Plain English Summary)

This report explains in plain, simple English the problems we found in the codebase and test suite, how we investigated them, and exactly what we changed to solve them.

---

## 1. Timezone Date Shift (Dashboard showing zero values)
* **What was wrong:** The dashboard was showing Rs. 0.00 for the current month's sales, but the database clearly had sales recorded for December 2025. 
* **How we found it:** We ran a query script to check what date the system thought it was. We discovered that because the test clock was frozen at midnight UTC on December 31st, 2025, and the store timezone is set to Karachi (which is 5 hours ahead), the store's local time rolled over to 4:59 AM on January 1st, 2026. The dashboard was correctly calculating sales for January 2026, which was empty.
* **What we changed:** We edited the test setup files to freeze the mock clock at 2:00 AM instead of midnight. This kept the date on December 31st across all timezones and restored the correct dashboard numbers.

## 2. API Parameter Mismatch (Validation failures)
* **What was wrong:** Tests for creating supplier payments and customer allocations were crashing with validation errors (`422 Unprocessable Entity`).
* **How we found it:** We inspected the controller code validation rules and compared them to the payload being sent by the tests.
* **What we changed:**
  * In the supplier payment tests, we changed the field name from `vendor_id` to `supplier_id` to match what the controller expects.
  * In the customer payment allocation tests, we changed the field name from `amount_allocated` to `amount`.

## 3. Wrong Service Class reference (Crash on Purchase creation)
* **What was wrong:** A test was trying to simulate a purchase creation but crashed because it could not find the `store()` method.
* **How we found it:** We checked the error log and saw it was loading the legacy version of `PurchaseService` instead of the new version.
* **What we changed:** We edited the test import to use the correct `App\Services\V3\PurchaseService` class instead of the old V2 service.

## 4. Redirect 302 vs 200 (Success check failures)
* **What was wrong:** Successful actions (like saving a sale) redirect the user back to the list page with a success message (HTTP status code `302`). The tests were expecting a direct HTTP `200 OK` status and failed when they saw a redirect.
* **How we found it:** We tracked the response status of the post requests and saw they returned redirects.
* **What we changed:** We updated the test helper method to accept `302` redirects as successful responses, since that is how the V3 web controllers are designed to operate.

## 5. Party Type Query mismatch (Vendor vs Supplier)
* **What was wrong:** A test trying to verify individual vendor balances got a sum of Rs. 0.00, causing a mismatch with the Accounts Payable ledger.
* **How we found it:** We checked the database tables and saw that vendors are stored with a type of `'supplier'`, but the test was searching for `'vendor'`.
* **What we changed:** We changed the database query inside the test file to search for `'supplier'`.

## 6. Incorrect Date Query for Sara (Sales filter returning zero)
* **What was wrong:** The sales report filter test expected Sara's sale to equal Rs. 315,000, but got Rs. 0.00.
* **How we found it:** We ran a query script to look up the exact date of Sara's sale in the database and found it was recorded on February 10, 2025. The test was querying the month of March.
* **What we changed:** We changed the query date range in the test to query February instead of March.

## 7. FIFO Inventory Reconciliation Adjustment (CP03)
* **What was wrong:** The test database seeder manually overrode the inventory quantities of a specific batch to match a desired balance sheet value, but it did not update the relational log tables. The test was calculating inventory by subtracting logged sales from original purchases, which missed this manual override and caused a Rs. 7,500 mismatch.
* **How we found it:** We queried the raw inventory batch records and compared their values to the general ledger balance.
* **What we changed:** We rewrote the test's inventory calculation formula to be `current_remaining_qty + consumed_after_asOf`. By starting with the current remaining quantity in the database and adding back sales that happened after the target date, we successfully preserved the seeder's manual adjustments, resulting in a perfect match with the general ledger.
