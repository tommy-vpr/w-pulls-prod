// components/consent/ConsentModeScript.tsx
// MUST render in <head> BEFORE the GTM script. Sets Google Consent Mode v2
// defaults to "denied" so no analytics/ads storage happens until the user
// opts in. GTM then holds tags until a consent 'update' flips them.

import Script from "next/script";

export function ConsentModeScript() {
  return (
    <Script
      id="consent-mode-default"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('consent', 'default', {
            'analytics_storage': 'denied',
            'ad_storage': 'denied',
            'ad_user_data': 'denied',
            'ad_personalization': 'denied',
            'wait_for_update': 500
          });
        `,
      }}
    />
  );
}
