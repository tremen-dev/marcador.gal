/**
 * `/robot` — the address that travels inside the User-Agent of every request
 * we make. Third parties copy it into their logs and their robots.txt, so it
 * never moves (ADR-010 §5) and it answers 200 directly, with no hop in front.
 */
import type { Metadata } from 'next';
import { titlesBundle } from '@/i18n/titles';
import { CrawlerPage } from '@/site/crawler-page';

/**
 * ITS OWN TITLE, AND THIS IS THE POINT OF SPEC-006. This tab is the first thing
 * whoever receives the letter reads about us — before the `<h1>`, and it is
 * what survives in a bookmark or in an internal email. Until now it said «O
 * proxecto — marcador.gal» (F-SPEC-005-1): the page that exists to prove we are
 * serious announced itself as another one.
 */
export const metadata: Metadata = { title: titlesBundle('gl').crawler };

export default function Page() {
  return <CrawlerPage locale="gl" />;
}
