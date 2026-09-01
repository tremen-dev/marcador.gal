/** `/es/proxecto` — the castellano twin of `/proxecto`. It never moves either. */
import type { Metadata } from 'next';
import { titlesBundle } from '@/i18n/titles';
import { ProjectPage } from '@/site/project-page';

/** Its own title, in its own language, fixed by the route and never negotiated. */
export const metadata: Metadata = { title: titlesBundle('es').project };

export default function Page() {
  return <ProjectPage locale="es" />;
}
