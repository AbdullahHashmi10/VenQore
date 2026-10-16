# VenQore Mobile Release 1.1.4 (Build 6)

**Date:** 2026-10-16  
**Artifact:** `VenQore-Mobile-1.1.4-build6.apk`  
**Size:** 49,399,815 bytes (47.1 MB)  
**SHA256:** `85A8718A23693A0E2D9631083F5CBECAE39368B72B70DABD7CB74B5C1A5104A0`  

---

## What Changed in this Release

### 1. Motion Graphics Animated Splash Screen (`SplashScreen`)
- Added a code-driven, hardware-accelerated vector motion graphics entrance (1.8s duration with tap-to-skip).
- Features the canonical VenQore logo scaling with spring physics, expanding luminous pulse rings, rotating 3D particle resonance, brand typography glide, and mint shimmer loader.

### 2. Native 3D ThinkingOrb Engine (`ThinkingOrb`)
- Ported the web app's 3D dotted ThinkingOrb engine into pure Flutter (`CustomPainter`).
- Computes 3D projected orbital trajectories, depth-sorted particle nodes, and smooth continuous rotational kinematics at 60/120fps.
- Integrated into the splash screen, AI workspace builder, and new business registration screens.

### 3. Unified Sign-In (Role Selection Questions Removed)
- Completely bypassed `AccessTypeScreen` (which previously asked users to choose between "Owner/Manager" vs "Employee/Cashier").
- Tapping *"I work at or run a store"* now navigates directly to the unified `SignInScreen`. Roles and permissions load automatically from the backend (`PostLoginRedirect`).

### 4. Native Sign-In & Register Screens (`SignInScreen` & `RegisterScreen`)
- **`SignInScreen`:** Modern V6 styling with dual tabs:
  - **Store Account:** Work email & password with visibility toggle, forgot password recovery.
  - **Staff / POS PIN:** Store handle + 4-6 digit staff PIN for fast till and counter access.
  - **Continue with Google:** Direct OAuth initiation with clean in-app tab/browser user-agent.
  - Links to create a new business or use the AI workspace builder.
- **`RegisterScreen`:** Clean native form for business profile creation with trade/sector chips (Retail, Food & Cafe, Services, Wholesale) and AI builder integration.

### 5. Overhauled AI Workspace Builder ("Describe my business")
- Redesigned `AiBuilderIntroScreen` with the animated 3D `ThinkingOrb` hero container.
- Added interactive trade suggestion chips (Grocery, Restaurant, Repair, Salon, Wholesale) that prefill the prompt.
- Modern text area with responsive 20px padding (eliminating excessive side margins).

### 6. Master Plan Workstreams A & B (Kitchen Order Changes & Unified Rider Notifications)
- **Workstream B0/B1:** Created `App\Services\Delivery\RiderNotifier.php` hooked into `DeliveryService::assign()` and `TableServiceController`. Automatically generates pre-filled WhatsApp links (`https://wa.me/...`) and rider portal URLs (`/rider/{token}`) for both online and restaurant deliveries.
- **Workstream A2:** Added `sent_signature` change detection in `KitchenTicketService::fireOccupancy`. Modified notes and modifier changes on already-sent lines automatically print `[CHANGED]` dockets showing `WAS: ... -> NOW: ...` to prevent double-cooking and waste.

### 7. Verification & Tests
- All 11 Flutter unit & widget tests passed with 0 failures and 0 warnings.
- Clean Gradle cache rebuild executed before final packaging.
