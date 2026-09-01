/**
 * `/robot` — the address that travels inside the User-Agent of every request
 * we make. Third parties copy it into their logs and their robots.txt, so it
 * never moves (ADR-010 §5) and it answers 200 directly, with no hop in front.
 */
import { CrawlerPage } from '@/site/crawler-page';

export default function Page() {
  return <CrawlerPage locale="gl" />;
}
