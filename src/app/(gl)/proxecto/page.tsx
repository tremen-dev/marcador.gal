/** `/proxecto` — the canonical address of the project page. It never moves. */
import type { Metadata } from 'next';
import { titlesBundle } from '@/i18n/titles';
import { ProjectPage } from '@/site/project-page';

/**
 * The title is a datum of THIS route, not markup of the document shell: a root
 * layout cannot receive anything from the page it wraps, which is how `/robot`
 * came to announce itself as this one (SPEC-006 CA-1).
 */
export const metadata: Metadata = { title: titlesBundle('gl').project };

export default function Page() {
  return <ProjectPage locale="gl" />;
}
