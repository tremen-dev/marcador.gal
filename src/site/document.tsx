/**
 * The document shell of the public site: the single place where a language
 * becomes `<html lang>` (SPEC-004 CA-2, CA-3).
 *
 * IT DOES NOT EMIT `<title>`, AND THAT IS A CRITERION (SPEC-006 CA-1, CA-6).
 * This is a root layout, so it cannot receive anything from the page it wraps:
 * while the title lived here, the four routes shared one, and `/robot` — the
 * address that travels inside our User-Agent — announced itself as «O
 * proxecto» (F-SPEC-005-1). Each route now declares its own title as a datum,
 * through the metadata mechanism of the App Router, and the shell decides
 * nothing for pages it does not know. Leaving a `<title>` here as well would
 * not be redundant but wrong: the served HTML would carry TWO, and the first
 * one — the one the browser keeps — would be the inherited, wrong one.
 *
 * Deliberately empty of everything else. The site runs nothing on the client
 * and asks nobody for anything: no analytics, no remote fonts, no third-party
 * scripts, no cookies, no images. That is not minimalism as taste — it is D-8
 * (readable on a bad connection) and it is what makes "we do not measure our
 * visitors" checkable by opening the inspector instead of a promise.
 */
import type { ReactNode } from 'react';
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
      <body>{children}</body>
    </html>
  );
}
