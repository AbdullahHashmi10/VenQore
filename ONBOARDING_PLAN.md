# VenQore POS Onboarding & Configuration Overhaul Plan

## Overview
This plan outlines the roadmap to transform the VenQore POS experience from a generic "Clean Slate" to a guided, industry-tailored onboarding journey. The goal is to hold the user's hand from the very first login, ensuring they feel confident and key system configurations (like currency, categories) are set up automatically.

## Phase 1: Foundational "Fixes" (Immediate)
**Goal:** Ensure the current "Add Product" flow references a robust category creation process and respects global settings.

1.  **Fix Category Creation in Product Modal:**
    *   Investigate `ProductModal.jsx` and `PremiumSelect.jsx`.
    *   Ensure clicking "Create New Category" either clearly opens the inline form or, preferably, opens a **Dedicated Category Creation Modal** to avoid UI clutter.
    *   Verify backend logic handles on-the-fly category creation.
2.  **Global Currency Implementation:**
    *   Replace all hardcoded `Rs`, `PKR`, `$`, and `£` symbols in the frontend with a dynamic `settings.currency_symbol` prop.
    *   Update `SettingsHelper` or `ShareInertiaData` to provide this globally.

## Phase 2: User Onboarding Journey (The "First Time" Experience)

### Step 1: The "Welcome & Setup" Wizard
*   **Trigger:** Detect if the system is "fresh" (e.g., `setup_completed` flag in settings is false) on login.
*   **Action:** Redirect the Platform Owner to a dedicated, unskippable (but polite) Setup Wizard.

**Wizard Steps:**

1.  **Business Profile:**
    *   Business Name.
    *   **Currency Selection:** (Critical) Dropdown of all world currencies with symbols. This selection becomes the system default.
    *   Timezone/Locale.
    
2.  **Industry Selection (The "Magic" Step):**
    *   Ask: "What kind of business is this?"
    *   **Group 1: Big Retail** (Karyana, Fashion, Electronics, Pharmacy)
    *   **Group 2: Hard Goods** (Hardware, Auto Parts, Furniture, Mobile Repair)
    *   **Group 3: Lifestyle** (Cosmetics, Sports, Toys, Optical, Pet Shop)
    *   **Group 4: Food & Beverage** (Restaurant, Cafe, Bakery)
    *   **Group 5: Niche / B2B** (Bookstore, Solar, IT, Jewelry)
    
3.  **Smart Seeding & Configuration:**
    *   Based on the selection, load data from `config/industries.php`.
    *   **Populate Categories:** e.g., "Fresh Produce" for Karyana, "Solar Panels" for Solar business.
    *   **Apply System Tweaks:**
        *   **Fashion/Apparel:** Enable Variants (Size/Color) by default.
        *   **Electronics/IT/Solar:** Enable Serial Number Tracking (IMEI) by default.
        *   **Pharmacy:** Enable Batch Tracking & Expiry Dates by default.
        *   **Jewelry:** Enable high precision weight decimals.

### Step 2: The "Dimmed" Tour (Interactive Walkthrough)
*   **Technology:** Use a library like `driver.js` or `react-joyride`.
*   **Flow:**
    *   After the Wizard, land on the Dashboard.
    *   Screen dims.
    *   Spotlight key areas:
        1.  **"Growth Engine"**: Explain high-level stats.
        2.  **"Sidebar"**: Quick explanation of huge modules (Sell, Stock, Money).
        3.  **"Quick Actions"**: How to make a sale *now*.
    *   Keep it short but comprehensive.
    *   End with a "Create your first product" CTA.

## Phase 3: "Empty State" Improvements
**Goal:** If a user skips everything or deletes data, the empty screens should be helpful, not blank.

*   **Product List (Empty):** Show "Create Product" + "Import Demo Products" button.
*   **Category List (Empty):** Show "Use Industry Presets" button.

## Phase 4: Refinement & User Types
*   **Platform Owner:** The flow above is for the owner.
*   **Staff Accounts:** When a *new* staff member logs in:
    *   Don't show the setup wizard.
    *   Show a simplified Tour based on their *Permissions* (e.g., a Cashier only sees how to use POS).

## Implementation Checklist

- [ ] **Phase 1:** Fix `ProductModal` category creation Bug.
- [ ] **Phase 1:** Refactor codebase to use `settings.currency_symbol`.
- [ ] **Phase 2:** Create `SetupWizard` Page & Route.
- [ ] **Phase 2:** Implement `IndustrySeeders` (Retail, Tech, etc.).
- [ ] **Phase 2:** Implement `finishSetup` controller logic to save business profile.
- [ ] **Phase 2:** Integrate `driver.js` for the interactive tour.

---
**Next Step Recommendation:**
We should start with **Phase 1 (Fixing Category Creation & Currency)** as it immediately improves the current "Clean Slate" usability, then proceed to build the **Setup Wizard**.
