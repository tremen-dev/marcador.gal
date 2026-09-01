/**
 * The one way the public mailbox reaches a page: interpolated into an i18n
 * literal as a `mailto:` link.
 *
 * Shared and not copied per page because SPEC-004 CA-13 concentrates the
 * address in `contact.ts` precisely so that migrating it is one edit. Two
 * pages each rendering it their own way would put the second copy back, only
 * in the markup instead of in the string.
 *
 * On `/robot` this is load-bearing rather than decorative: the mailbox no
 * longer travels inside the User-Agent header, so the link in the first block
 * of that page is the ONLY place an operator can find where to ask us to stop
 * (ADR-011 §4, SPEC-005 CA-5).
 */
import type { ReactNode } from 'react';
import { MAILBOX } from '@/site/contact';

const MAILBOX_PLACEHOLDER = '{mailbox}';

/** Splits a literal on its mailbox slot and puts the address in as a link. */
export function withMailbox(value: string): ReactNode {
  const [before, after] = value.split(MAILBOX_PLACEHOLDER);
  return (
    <>
      {before}
      <a href={`mailto:${MAILBOX}`}>{MAILBOX}</a>
      {after}
    </>
  );
}
