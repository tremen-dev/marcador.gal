/**
 * robots.txt, the part of RN-11 that is a duty towards each site (CA-2).
 *
 * Deliberately NOT fetched from inside the tick loop. Two reasons: a robots.txt
 * request would be a request the RN-11 budget of the window does not account
 * for, and the policy of a site does not change during one hour of observation.
 * The operator loads it once, before the window, and hands it to the capturer
 * (F-SPEC-002-2).
 *
 * An origin with no policy loaded is DISALLOWED. Silence is not consent, and a
 * permissive default would make the whole criterion decorative.
 */

export interface RobotsPolicy {
  isAllowed(url: string): boolean;
}

interface Rule {
  readonly path: string;
  readonly allow: boolean;
}

/** A policy that allows everything. Only for fixtures and for hosts we own. */
export function allowAllRobots(): RobotsPolicy {
  return { isAllowed: () => true };
}

/**
 * Parses robots.txt for OUR user-agent: the most specific group whose token is
 * a prefix of ours, falling back to `*`. Between an `Allow` and a `Disallow`
 * that both match, the longest pattern wins — the rule every major crawler
 * follows, and the one that makes `Disallow: /edicion/` +
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
        if (!path.startsWith(rule.path)) continue;
        if (best === null || rule.path.length > best.path.length) best = rule;
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
      if (value.length > 0) rules.push({ path: value, allow: field === 'allow' });
      groups.set(agent, rules);
    }
  }

  return groups;
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
