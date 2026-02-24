'use client';

import { useEffect } from 'react';
import Script from 'next/script';
import { createOrganizationSchema } from '@/lib/seo/metadata';

export function SEOScripts() {
  const organizationSchema = createOrganizationSchema();

  useEffect(() => {
    // Clear any lingering data
    return () => {};
  }, []);

  return (
    <>
      {/* Google Analytics */}
      {process.env.NEXT_PUBLIC_GA_ID && (
        <>
          <Script
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
          />
          <Script
            id="ga-script"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
                  page_path: window.location.pathname,
                  anonymize_ip: true,
                  allow_google_signals: false,
                });
              `,
            }}
          />
        </>
      )}

      {/* Google Tag Manager */}
      {process.env.NEXT_PUBLIC_GTM_ID && (
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${process.env.NEXT_PUBLIC_GTM_ID}');`,
          }}
        />
      )}

      {/* Organization Schema */}
      <Script
        id="org-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />

      {/* Breadcrumb Schema Template */}
      <Script
        id="breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: process.env.NEXT_PUBLIC_SITE_URL || 'https://nulumbung.id',
              },
            ],
          }),
        }}
      />

      {/* Search Engine Verification Meta Tags */}
      {process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION && (
        <meta
          name="google-site-verification"
          content={process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION}
        />
      )}
      {process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION && (
        <meta
          name="msvalidate.01"
          content={process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION}
        />
      )}
      {process.env.NEXT_PUBLIC_YANDEX_SITE_VERIFICATION && (
        <meta
          name="yandex-verification"
          content={process.env.NEXT_PUBLIC_YANDEX_SITE_VERIFICATION}
        />
      )}

      {/* Pinterest Verification */}
      {process.env.NEXT_PUBLIC_PINTEREST_VERIFICATION && (
        <meta
          name="p:domain_verify"
          content={process.env.NEXT_PUBLIC_PINTEREST_VERIFICATION}
        />
      )}
    </>
  );
}
