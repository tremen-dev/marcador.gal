/**
 * The document shell of the public site: the single place where a language
 * becomes `<html lang>` (SPEC-004 CA-2, CA-3).
 *
 * Deliberately empty of everything else. The site runs nothing on the client
 * and asks nobody for anything: no analytics, no remote fonts, no third-party
 * scripts, no cookies, no images. That is not minimalism as taste — it is D-8
 * (readable on a bad connection) and it is what makes "we do not measure our
 * visitors" checkable by opening the inspector instead of a promise.
 */
import type { ReactNode } from 'react';
import { siteBundle } from '@/i18n/site';
import type { SiteLocale } from '@/i18n/site-bundle';

export function SiteDocument({
  locale,
  children,
}: {
  locale: SiteLocale;
  children: ReactNode;
}) {
  return (
    <html lang={locale}>
      <body>
        <title>{siteBundle(locale).documentTitle}</title>
        {children}
      </body>
    </html>
  );
}
