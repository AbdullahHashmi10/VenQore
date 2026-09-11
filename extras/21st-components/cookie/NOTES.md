# Cookie consent: 21st.dev components with NO source captured

None of these pages render component source (only the demo usage), and I found no upstream repo for them. No code was written for them.

## Cookie Consent (preferences with categories) by Bankk (@bankkroll)
- URL: https://21st.dev/community/components/bankkroll/cookie-consent (library https://21st.dev/@bankkroll/library/bankk)
- License: not stated. Deps listed: next, lucide-react, framer-motion
- API, from the demo: `<CookieConsent className cookiePolicyUrl categories=[{id,name,description,icon,isEssential}] onAccept={(prefs:boolean[])=>…} onDecline />`. It stores `cookie_preferences` and `cookie_consent_given` in localStorage.
- This is the closest match to a "cookie preferences dialog". To use it you would need the source from the author or a clean-room build from this API.
- Demo usage, verbatim from the page (captured with WebFetch on 2026-09-10):

```tsx
"use client";

import * as React from "react";
import { CookieConsent } from "@/components/ui/cookie-consent";
import { Shield, BarChart3, Target } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DemoMain() {
  const handleReset = () => {
    try {
      localStorage.removeItem("cookie_preferences");
      localStorage.removeItem("cookie_consent_given");
      window.location.reload();
    } catch (error) {
      console.error("Error resetting cookies:", error);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-12">
      <div className="flex justify-center mb-4">
        <Button onClick={handleReset} size="sm">
          Reset Example Cookie Preferences
        </Button>
      </div>

      {/* Cookie Consent with ALL props demonstrated */}
      <CookieConsent
        className="custom-cookie-banner" // Custom CSS class

        cookiePolicyUrl="/privacy-policy" // Custom cookie policy URL

        // Custom categories with icons
        categories={[
          {
            id: "essential",
            name: "Essential Cookies",
            description: "Required for core website functionality, security, and basic operations. These cannot be disabled.",
            icon: <Shield className="h-4 w-4 text-green-600" />,
            isEssential: true, // OPIONAL TO MAKE CATEGORY STAY TRUE
          },
          {
            id: "analytics",
            name: "Analytics & Performance",
            description: "Help us understand how visitors interact with our website by collecting anonymous usage data.",
            icon: <BarChart3 className="h-4 w-4 text-blue-600" />,
          },
          {
            id: "marketing",
            name: "Marketing & Advertising",
            description: "Enable personalized ads and marketing content across websites and social platforms.",
            icon: <Target className="h-4 w-4 text-purple-600" />,
          },
        ]}
  
        // Accept callback with detailed logging
        onAccept={(preferences) => {
          console.log('🍪 Cookie preferences breakdown:', {
            essential: preferences[0] ? '✅ Enabled' : '❌ Disabled',
            analytics: preferences[1] ? '✅ Enabled' : '❌ Disabled',
            marketing: preferences[2] ? '✅ Enabled' : '❌ Disabled',
          });
          console.log('💾 Stored in localStorage as JSON array');
  
          // Example: Send to analytics service
          // analytics.track('cookie_consent_given', { preferences });
        }}
  
        // Decline callback
        onDecline={() => {
          console.log('❌ User declined all non-essential cookies');
          console.log('🔒 Only essential cookies are active');
  
          // Example: Track decline event
          // analytics.track('cookie_consent_declined');
        }}
      />
    </div>
  );
}
```

## Cookie Banner by Arunachalam (@arunachalam)
- URLs: https://21st.dev/@arunachalam/components/cookie-banner and https://21st.dev/@arunachalam/components/cookie-banner-1
- License: not stated. Deps: none listed (the page mentions Tailwind v4). The demo only shows `<CookieBanner />` with no props.

## Cookies by PrebuiltUI (@prebuiltui)
- URL: https://21st.dev/@prebuiltui/components/cookies. Variants: basic-cookie-alert, privacy-first-notice and privacy-choices-panel (the last is a preferences panel).
- License: PrebuiltUI "Template License" (https://prebuiltui.com/policies/template-license), "All Rights Reserved". This is not MIT, so check the terms before using it.

## Also seen, not from 21st.dev
- github.com/r2hu1/shadcn-cookie-consent: shadcn Card banner with accept/decline, about 208 lines. **The repo has no LICENSE file**, so all rights are reserved by default. I could not find it on 21st.dev (the `@r2hu1/components/cookie-consent` URL returns 404). No code was copied.
