/**
 * The crawler page (SPEC-005 CA-2, CA-5, CA-6): the destination of the `+` in
 * our User-Agent, and the public backing of the five checkable claims of the
 * letter to the RFGF.
 *
 * TWO THINGS ABOUT ITS SHAPE ARE CRITERIA, NOT TASTE.
 *
 * 1. The User-Agent is IMPORTED, never transcribed. The criterion of the epic
 *    is that the published string matches the sent one character for
 *    character — «if they diverge, the site lies» — and transcription is
 *    exactly how the code and the letter came to diverge in the first place.
 *    In one deployment (ADR-010) that identity is a property of the program.
 *
 * 2. The mailbox goes in the FIRST block, before any section heading. When the
 *    contact stopped travelling inside the header, this link became the only
 *    thing left telling an operator where to ask us to stop, which is half of
 *    what RN-11 means by "identified". If it drifts down the page, the change
 *    that put the URL in the header turns into a regression (ADR-011 §4).
 *
 * It says nothing else. No product, no form, no request for anybody's address.
 */
import { crawlerBundle } from '@/i18n/crawler';
import { otherLocale } from '@/i18n/site';
import type { SiteLocale } from '@/i18n/site-bundle';
import { USER_AGENT } from '@/polite/user-agent';
import { withHosting } from '@/site/hosting';
import { withMailbox } from '@/site/mailbox-link';
import { CRAWLER_PATH, SCOREBOARD_PATH } from '@/site/routes';

export function CrawlerPage({ locale }: { locale: SiteLocale }) {
  const t = crawlerBundle(locale);
  const other = otherLocale(locale);

  return (
    <main>
      <h1>{t.heading}</h1>
      <p>{t.intro}</p>
      <p>{withMailbox(t.contact)}</p>

      <section>
        <h2>{t.userAgentHeading}</h2>
        <p>{t.userAgent}</p>
        <p>
          <code>{USER_AGENT}</code>
        </p>
        <p>{t.userAgentNote}</p>
      </section>

      <section>
        <h2>{t.rateHeading}</h2>
        <p>{t.rate}</p>
      </section>

      <section>
        <h2>{t.robotsHeading}</h2>
        <p>{t.robots}</p>
      </section>

      <section>
        <h2>{t.noRepublishHeading}</h2>
        <p>{t.noRepublish}</p>
      </section>

      {/* SPEC-018 CA-2.9: la pantalla se enlaza desde la página que un tercero audita. */}
      <section>
        <h2>{t.scoreboardHeading}</h2>
        <p>
          <a href={SCOREBOARD_PATH[locale]}>{t.scoreboardLink}</a>
        </p>
      </section>

      <section>
        <h2>{t.noNamesHeading}</h2>
        <p>{withMailbox(t.noNames)}</p>
      </section>

      <section>
        <h2>{t.storageHeading}</h2>
        <p>{t.storage}</p>
      </section>

      {/*
        SPEC-018 CA-18.2 — one claim, one paragraph, in the order the ruling
        fixed: no trackers, what is logged, who processes it, on what basis, for
        how long, who answers, the rights, the authority, and the sentence that
        keeps this block from being read as the one above it.
      */}
      <section>
        <h2>{t.privacyHeading}</h2>
        <p>{t.privacyNoTrackers}</p>
        <p>{t.privacyLog}</p>
        <p>{withHosting(t.privacyProcessor)}</p>
        <p>{t.privacyBasis}</p>
        <p>{withHosting(t.privacyRetention)}</p>
        <p>{t.privacyController}</p>
        <p>{withMailbox(t.privacyRights)}</p>
        <p>{t.privacyAuthority}</p>
        <p>{t.privacyNotTheArchive}</p>
      </section>

      <section>
        <h2>{t.stopHeading}</h2>
        <p>{withMailbox(t.stop)}</p>
      </section>

      <nav>
        <a href={CRAWLER_PATH[other]} lang={other} hrefLang={other}>
          {t.otherLanguage}
        </a>
      </nav>
    </main>
  );
}
