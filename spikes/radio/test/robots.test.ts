import { describe, expect, it } from 'vitest';
import { parseRobots, robotsUrlOf, robotsVerdict } from '../src/robots.ts';

const TARGET = 'https://stream.example.test/radio/playlist.m3u8';

describe('robotsVerdict (RN-11, fail closed)', () => {
  it('2xx that allows the path → allowed', () => {
    const v = robotsVerdict({ status: 200, body: 'User-agent: *\nDisallow: /admin/\n' }, TARGET);
    expect(v.status).toBe('allowed');
  });

  it('2xx that disallows the path → disallowed, saying which rule', () => {
    const v = robotsVerdict({ status: 200, body: 'User-agent: *\nDisallow: /radio/\n' }, TARGET);
    expect(v).toMatchObject({ status: 'disallowed', httpStatus: 200 });
    expect(v.reason).toMatch(/disallows \/radio\/playlist\.m3u8/);
  });

  it('a group for our token beats the wildcard group', () => {
    const body = 'User-agent: *\nDisallow: /\n\nUser-agent: marcador.gal\nAllow: /radio/\n';
    expect(robotsVerdict({ status: 200, body }, TARGET).status).toBe('allowed');
    expect(parseRobots(body, 'otherbot').isAllowed(TARGET)).toBe(false);
  });

  it('404 → no restrictions', () => {
    expect(robotsVerdict({ status: 404, body: '' }, TARGET).status).toBe('allowed');
  });

  it('403 → disallowed: data, not permission (dictamen V3)', () => {
    const v = robotsVerdict({ status: 403, body: '' }, TARGET);
    expect(v).toMatchObject({ status: 'disallowed', httpStatus: 403 });
  });

  it('5xx and network errors → disallowed', () => {
    expect(robotsVerdict({ status: 503, body: '' }, TARGET).status).toBe('disallowed');
    expect(robotsVerdict({ error: 'ECONNREFUSED' }, TARGET)).toMatchObject({ status: 'disallowed', httpStatus: null });
  });

  it('wildcards and anchors follow RFC 9309', () => {
    const p = parseRobots('User-agent: *\nDisallow: /*.m3u8$\n');
    expect(p.isAllowed(TARGET)).toBe(false);
    expect(p.isAllowed('https://stream.example.test/radio/seg-1.ts')).toBe(true);
  });

  it('derives the robots.txt URL from the target host', () => {
    expect(robotsUrlOf(TARGET)).toBe('https://stream.example.test/robots.txt');
  });
});
