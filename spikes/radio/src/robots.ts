/**
 * robots.txt for the stream host, with CLOSED failure (SPEC-019 §3, RN-11,
 * ADR-028 §9): fetched and ARCHIVED before the first playlist request; if it
 * forbids the path, the spike stops and writes it down — the consent of the
 * titular does not override the host's file, because the host may be a third
 * party (a CDN).
 *
 * This is a second parser of robots.txt and it is allowed to exist ONLY
 * because it lives outside `src/` (ADR-014 forbids a second one inside the
 * roots the architecture test scans). It follows the same reading as
 * `src/polite/robots.ts`: the most specific group whose token prefixes our
 * User-Agent, else `*`; `*` wildcard and `$` anchor; longest match wins and a
 * tie goes to `Allow`.
 *
 * Status semantics (RFC 9309 §2.3.1): 2xx → parse; 404/410 → no restrictions;
 * any other 4xx (403 included: «dato, no permiso», dictamen V3), 5xx, or a
 * network error → DISALLOWED. Silence is not consent.
 */
import { USER_AGENT_TOKEN } from './user-agent.ts';

export type RobotsVerdict =
  | { readonly status: 'allowed'; readonly httpStatus: number; readonly reason: string }
  | { readonly status: 'disallowed'; readonly httpStatus: number | null; readonly reason: string };

interface Rule {
  readonly pattern: string;
  readonly allow: boolean;
  readonly matches: RegExp;
}

export interface RobotsPolicy {
  isAllowed(url: string): boolean;
}

export function parseRobots(text: string, token: string = USER_AGENT_TOKEN): RobotsPolicy {
  const groups = readGroups(text);
  const rules = groups.get(token.toLowerCase()) ?? groups.get('*') ?? [];
  return {
    isAllowed(url: string): boolean {
      const path = pathOf(url);
      let best: Rule | null = null;
      for (const rule of rules) {
        if (!rule.matches.test(path)) continue;
        if (best === null || rule.pattern.length > best.pattern.length) best = rule;
        else if (rule.pattern.length === best.pattern.length && rule.allow) best = rule;
      }
      return best === null || best.allow;
    },
  };
}

/** The verdict for `targetUrl` given what `GET /robots.txt` on its host returned. */
export function robotsVerdict(
  response: { readonly status: number; readonly body: string } | { readonly error: string },
  targetUrl: string,
): RobotsVerdict {
  if ('error' in response) {
    return { status: 'disallowed', httpStatus: null, reason: `robots.txt unreachable: ${response.error} (fail closed)` };
  }
  const { status, body } = response;
  if (status === 404 || status === 410) {
    return { status: 'allowed', httpStatus: status, reason: 'robots.txt absent (404/410): no restrictions' };
  }
  if (status >= 200 && status < 300) {
    const allowed = parseRobots(body).isAllowed(targetUrl);
    return allowed
      ? { status: 'allowed', httpStatus: status, reason: `robots.txt allows ${pathOf(targetUrl)} for ${USER_AGENT_TOKEN}` }
      : { status: 'disallowed', httpStatus: status, reason: `robots.txt disallows ${pathOf(targetUrl)} for ${USER_AGENT_TOKEN} (RN-11)` };
  }
  return { status: 'disallowed', httpStatus: status, reason: `robots.txt returned ${status}: fail closed (RN-11; a 403 is data, not permission)` };
}

export function robotsUrlOf(targetUrl: string): string {
  const u = new URL(targetUrl);
  return `${u.protocol}//${u.host}/robots.txt`;
}

function readGroups(text: string): Map<string, Rule[]> {
  const groups = new Map<string, Rule[]>();
  let current: string[] = [];
  let expectingAgents = true;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, '').trim();
    if (line.length === 0) continue;
    const sep = line.indexOf(':');
    if (sep === -1) continue;
    const field = line.slice(0, sep).trim().toLowerCase();
    const value = line.slice(sep + 1).trim();
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
      if (value.length > 0) rules.push({ pattern: value, allow: field === 'allow', matches: patternToRegExp(value) });
      groups.set(agent, rules);
    }
  }
  return groups;
}

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
  const u = new URL(url);
  return `${u.pathname}${u.search}`;
}
