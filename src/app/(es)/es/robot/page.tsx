/** `/es/robot` — the castellano twin of `/robot`. It never moves either. */
import type { Metadata } from 'next';
import { titlesBundle } from '@/i18n/titles';
import { CrawlerPage } from '@/site/crawler-page';

/** Its own title too: the inherited one was wrong in both languages. */
export const metadata: Metadata = { title: titlesBundle('es').crawler };

export default function Page() {
  return <CrawlerPage locale="es" />;
}
