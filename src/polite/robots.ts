/**
 * robots.txt, the part of RN-11 that is a duty towards each site.
 *
 * It lives in `src/polite/` and NOT inside the measuring instrument because
 * RN-11 has one owner (ADR-014 §1). A second parser anywhere in this
 * repository is forbidden, and a test of architecture says so
 * (SPEC-008 CA-2): the failure mode of RN-11 is a request that leaves, is
 * served, and never comes back — nothing goes red on its own.
 *
 * An origin with no policy loaded is DISALLOWED. Silence is not consent, and a
 * permissive default would make the whole criterion decorative.
 *
 * MATCHING FOLLOWS RFC 9309, AND THAT IS A FIX, NOT A DETAIL (F-SPEC-002-23).
 * The previous implementation compared paths with `startsWith`, so the `*` of
 * `Disallow: /ajax*` was a literal asterisk, the rule never fired, and the
 * `Allow: /` of the same group won. `isAllowed()` said `true` for a path
 * besoccer forbids — an open breach of a hard rule that no test could see.
 * Three things are therefore true here and were not before:
 *
 *   1. `*` matches any sequence of characters.
 *   2. `$` at the end of a pattern anchors the end of the path.
 *   3. Between an `Allow` and a `Disallow` that both match, the LONGEST
 *      pattern wins, and on a tie the `Allow` wins. That tie-break is a second
 *      change of behaviour, more permissive in a narrow case, and it is named
 *      as such in ADR-014 instead of travelling hidden inside "the wildcard
 *      was fixed".
 */

export interface RobotsPolicy {
  isAllowed(url: string): boolean;
}

interface Rule {
  /** The pattern as the site wrote it. Its LENGTH is what breaks ties. */
  readonly pattern: string;
  readonly allow: boolean;
  readonly matches: RegExp;
}

/** A policy that allows everything. Only for fixtures and for hosts we own. */
export function allowAllRobots(): RobotsPolicy {
  return { isAllowed: () => true };
}

/**
 * Parses robots.txt for OUR user-agent: the most specific group whose token is
 * a prefix of ours, falling back to `*`. Between an `Allow` and a `Disallow`
 * that both match, the longest pattern wins — and on a tie the `Allow` does,
 * which is what RFC 9309 says and what makes `Disallow: /edicion/` +
 * `Allow: /edicion/publica/` mean what its author meant.
 */
export function parseRobots(text: string, userAgent: string): RobotsPolicy {
  const groups = readGroups(text);
  const token = (userAgent.split('/')[0] ?? userAgent).toLowerCase();

  const rules = groups.get(token) ?? groups.get('*') ?? [];

  return {
    isAllowed(url: string): boolean {
      const path = pathOf(url);
      let best: Rule | null = null;

      for (const rule of rules) {
        if (!rule.matches.test(path)) continue;
        if (best === null || rule.pattern.length > best.pattern.length) {
          best = rule;
          continue;
        }
        // Equal length: the `Allow` wins, whatever the order in the file.
        if (rule.pattern.length === best.pattern.length && rule.allow) best = rule;
      }

      return best === null || best.allow;
    },
  };
}

/** Policies by origin (`https://host`). Anything else is disallowed. */
export function robotsRegistry(
  entries: Iterable<readonly [origin: string, policy: RobotsPolicy]>,
): RobotsPolicy {
  const byOrigin = new Map<string, RobotsPolicy>();
  for (const [origin, policy] of entries) byOrigin.set(normalizeOrigin(origin), policy);

  return {
    isAllowed(url: string): boolean {
      const policy = byOrigin.get(originOf(url));
      return policy === undefined ? false : policy.isAllowed(url);
    },
  };
}

/** The sentence a skipped tick records, so the archive says WHY. */
export function robotsSkipReason(url: string): string {
  return `robots.txt disallows ${pathOf(url)} (RN-11)`;
}

function readGroups(text: string): Map<string, Rule[]> {
  const groups = new Map<string, Rule[]>();
  let current: string[] = [];
  let expectingAgents = true;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, '').trim();
    if (line.length === 0) continue;

    const separator = line.indexOf(':');
    if (separator === -1) continue;

    const field = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();

    if (field === 'user-agent') {
      if (!expectingAgents) {
        current = [];
        expectingAgents = true;
      }
      current.push(value.toLowerCase());
      continue;
    }

    if (field !== 'allow' && field !== 'disallow') continue;

    expectingAgents = false;
    for (const agent of current) {
      const rules = groups.get(agent) ?? [];
      // `Disallow:` with an empty value means "nothing is disallowed".
      if (value.length > 0) {
        rules.push({ pattern: value, allow: field === 'allow', matches: patternToRegExp(value) });
      }
      groups.set(agent, rules);
    }
  }

  return groups;
}

/**
 * A robots.txt path pattern as a regular expression (RFC 9309 §2.2.2).
 *
 * The pattern always anchors the START of the path — matching is by prefix —
 * and anchors the end only when it terminates in `$`. Everything except `*` is
 * escaped, so a pattern like `/a.b` cannot match `/axb`.
 */
function patternToRegExp(pattern: string): RegExp {
  const anchored = pattern.endsWith('$');
  const body = anchored ? pattern.slice(0, -1) : pattern;
  const source = body.split('*').map(escapeRegExp).join('.*');

  return new RegExp(`^${source}${anchored ? '$' : ''}`, 'u');
}

function escapeRegExp(value: string): string {
  return value.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
}

function pathOf(url: string): string {
  const parsed = new URL(url);
  return `${parsed.pathname}${parsed.search}`;
}

function originOf(url: string): string {
  return new URL(url).origin;
}

function normalizeOrigin(origin: string): string {
  return new URL(origin).origin;
}
