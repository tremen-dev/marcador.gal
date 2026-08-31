/**
 * `/robots.txt`, served by the application (SPEC-004 CA-11).
 *
 * A route handler and not a file in `public/` so that the policy is generated
 * from the same code that knows the routes, and so that the courtesy mailbox
 * comes from `contact.ts` instead of being typed again.
 *
 * `force-static` keeps it prerendered at build time: this site runs no
 * functions and reads nothing about whoever asks (CA-10).
 */
import { buildRobotsTxt } from '@/site/robots-txt';

export const dynamic = 'force-static';

export function GET(): Response {
  return new Response(buildRobotsTxt(), {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
