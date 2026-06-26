# VenQore Development Session Issue Log
**Date:** June 24, 2026

This log captures all the issues encountered, diagnosed, and resolved during this debugging and optimization session for VenQore.

---

## 1. Chatbot Widget Mobile Overlay Conflict
* **Status:** Resolved ✅
* **Files Modified:** [ChatWidget.jsx](file:///e:/AMD%20POS/AMD%20POS/resources/js/Components/ChatWidget.jsx)
* **Problem Description:** 
  The floating chatbot widget was using a very high CSS z-index (`z-[9998]`). This caused it to overlay and block interaction with the mobile bottom navigation bar and dropdown menus on mobile devices.
* **Root Cause:** 
  The z-index was set to a hardcoded high value without accounting for the mobile navigation layout hierarchy.
* **How It Was Fixed:** 
  We adjusted the z-index of the chatbot bubble in [ChatWidget.jsx](file:///e:/AMD%20POS/AMD%20POS/resources/js/Components/ChatWidget.jsx#L582) to `z-[55]`. This keeps it above normal page content but safely below header dropdowns (`z-60`) and the mobile bottom navigation bar (`z-80`).

---

## 2. Onboarding Widget Mobile Overlap & Page Distractions
* **Status:** Resolved ✅
* **Files Modified:** [GlobalOnboardingWidget.jsx](file:///e:/AMD%20POS/AMD%20POS/resources/js/Components/GlobalOnboardingWidget.jsx)
* **Problem Description:** 
  1. On mobile screens, the onboarding widget overlapped with the bottom navigation bar and the chat bubble.
  2. The onboarding widget remained visible on operational/transaction pages (like POS and Sales Creation), cluttering the UI during critical user operations.
* **How It Was Fixed:** 
  1. **Dynamic Offset:** Added conditional offset logic to shift the widget to `bottom-[172px]` on mobile when the bottom nav bar is visible.
  2. **Page Exclusions:** Configured a route exclusion list to automatically hide the widget on POS (`/pos`), return, refund, setup, and transaction creation pages.

---

## 3. Email Verification Redirect Trap (`/error/200`)
* **Status:** Resolved ✅
* **Files Modified:** [create_test_user.php](file:///e:/AMD%20POS/AMD%20POS/create_test_user.php), [404.blade.php](file:///e:/AMD%20POS/AMD%20POS/resources/views/errors/404.blade.php)
* **Problem Description:** 
  Clicking "Sell" redirected the user to `/verify-email`. Since `/verify-email` is a non-Inertia Blade view, the Inertia frontend failed to parse the HTML response (expecting JSON) and redirected the entire page to `/error/200`.
* **Root Cause:** 
  1. The test user `test@venqore.com` was seeded with `email_verified_at` set to `NULL`.
  2. The database creation script (`create_test_user.php`) attempted to set `email_verified_at => now()`, but this attribute is protected from mass-assignment on the `User` model (`$fillable`), so Laravel silently discarded the update.
* **How It Was Fixed:** 
  1. Updated the seeder to bypass mass assignment by directly setting the attribute (`$user->email_verified_at = now()`) and saving.
  2. Ran the updated script via XAMPP CLI:
     ```powershell
     & "E:\Software\xampp\php\php.exe" create_test_user.php
     ```
  3. Added `@viteReactRefresh` to `404.blade.php` to resolve a related Vite preamble error on error views.

---

## 4. Sales Dashboard AJAX / Inertia Collision
* **Status:** Resolved ✅
* **Files Modified:** [SaleController.php](file:///e:/AMD%20POS/AMD%20POS/app/Http/Controllers/SaleController.php)
* **Problem Description:** 
  Even after verifying the user, clicking the **Sell** button in the sidebar still threw an `/error/200` crash screen.
* **Root Cause:** 
  In `SaleController.php` 's `dashboard()` method, the controller returned raw JSON data when detecting an AJAX/JSON request:
  ```php
  if (request()->wantsJson() || request()->ajax()) {
      return response()->json($data);
  }
  ```
  Since Inertia requests are made via Axios, they are detected as AJAX requests. Returning raw JSON data instead of the structured Inertia component payload triggered Inertia's `invalid` handler, prompting a redirect to `/error/200`.
* **How It Was Fixed:** 
  We modified the conditional check to ensure it only returns raw JSON for non-Inertia AJAX requests (verifying the absence of the `X-Inertia` header):
  ```php
  if (!request()->header('X-Inertia') && (request()->wantsJson() || request()->ajax())) {
      return response()->json($data);
  }
  ```
