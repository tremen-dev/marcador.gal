/**
 * The project page (SPEC-004 CA-8): who is behind this, what is being
 * measured, what for, that there is no product yet, and where to read how the
 * crawler works.
 *
 * It says nothing else, and that is a criterion, not a style note. EPIC-003
 * names "drift towards the landing page" as its main risk: the day this grows
 * a waiting list, the letter that pointed here is contradicted by its own
 * link.
 *
 * Every visible string comes from an i18n bundle (D-2) and the mailbox comes
 * from `src/site/contact.ts` (CA-13) — it is interpolated into the literal,
 * never written inside it, through the shared helper that `/robot` uses too.
 */
import { otherLocale, siteBundle } from '@/i18n/site';
import type { SiteLocale } from '@/i18n/site-bundle';
import { withMailbox } from '@/site/mailbox-link';
import { CRAWLER_PATH, PROJECT_PATH, SCOREBOARD_PATH } from '@/site/routes';
import { UMBRELLA_URL } from '@/site/umbrella';

export function ProjectPage({ locale }: { locale: SiteLocale }) {
  const t = siteBundle(locale);
  const other = otherLocale(locale);

  return (
    <main>
      <h1>{t.heading}</h1>

      <section>
        <h2>{t.aboutHeading}</h2>
        <p>{withMailbox(t.about)}</p>
        <p>
          <a href={UMBRELLA_URL}>{t.umbrellaLink}</a>
        </p>
      </section>

      <section>
        <h2>{t.measuringHeading}</h2>
        <p>{t.measuring}</p>
      </section>

      <section>
        <h2>{t.purposeHeading}</h2>
        <p>{t.purpose}</p>
      </section>

      <section>
        <h2>{t.noProductHeading}</h2>
        <p>{t.noProduct}</p>
      </section>

      {/*
        SPEC-018 CA-2.9. NO ES NAVEGACIÓN: es lo que convierte `noindex` en
        no-amplificación en vez de en ocultación. Publicar, no indexar y no
        enlazar sería esconderse, y leería fatal al lado de la carta.
      */}
      <section>
        <h2>{t.scoreboardHeading}</h2>
        <p>
          <a href={SCOREBOARD_PATH[locale]}>{t.scoreboardLink}</a>
        </p>
      </section>

      <section>
        <h2>{t.crawlerHeading}</h2>
        <p>
          <a href={CRAWLER_PATH[locale]}>{t.crawlerLink}</a>
        </p>
      </section>

      <nav>
        <a href={PROJECT_PATH[other]} lang={other} hrefLang={other}>
          {t.otherLanguage}
        </a>
      </nav>
    </main>
  );
}
