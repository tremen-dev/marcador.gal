/**
 * CA-13 — el buzón vive en un solo sitio, porque va a migrar.
 *
 * `ola@tremen.dev` es provisional (Alberto Fojo, 2026-08-31): en producción
 * será alguno `@marcador.gal`. Aparece en `/proxecto`, en `/robot` (SPEC-005) y
 * en el `robots.txt` propio. Una sola definición y todo lo demás la referencia,
 * de modo que migrar sea UNA edición y no una cacería.
 */
import { describe, expect, test } from 'vitest';
import { MAILBOX } from '@/site/contact';
import { headerComment, readSourceFiles, SRC } from './source-scan';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const CONTACT_MODULE = 'site/contact.ts';

/**
 * TEMPORARY. `src/mirror/user-agent.ts` still carries the address inside
 * `USER_AGENT_CONTACT` (`mailto:ola@tremen.dev`). SPEC-005 replaces it with
 * `https://marcador.gal/robot` (ADR-011 §4), and SPEC-004 is explicitly
 * forbidden from touching `src/mirror/`. The exception is an EXACT match, not
 * a subset, so the day SPEC-005 lands this test goes red and whoever is there
 * has to delete this line — which is the only way an exception ever leaves a
 * codebase. See F-SPEC-004-1 in the ledger.
 */
const PENDING_SPEC_005 = 'mirror/user-agent.ts';

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;

describe('CA-13 — el buzón en un solo sitio', () => {
  test('1. hay una constante y hoy vale ola@tremen.dev', () => {
    expect(MAILBOX).toBe('ola@tremen.dev');
  });

  test('2. ninguna dirección de correo aparece en src/ fuera de ese módulo', async () => {
    const files = await readSourceFiles();
    const offenders = files.filter((f) => EMAIL.test(f.text)).map((f) => f.path);

    expect(offenders).toEqual([CONTACT_MODULE, PENDING_SPEC_005].sort((a, b) => a.localeCompare(b)));
  });

  test('3. la cabecera del módulo lleva escrito el contrato de la migración', async () => {
    const header = headerComment(await readFile(join(SRC, CONTACT_MODULE), 'utf8'));

    // The warning has to reach whoever edits THAT line, in the moment they
    // edit it: after the move, the old address must still be read.
    expect(header).toContain('ola@tremen.dev');
    expect(header).toContain('@marcador.gal');
    expect(header).toContain('must still be read');
  });

  test('4. el módulo no exporta más que la dirección: no es un cajón de sastre', async () => {
    const source = await readFile(join(SRC, CONTACT_MODULE), 'utf8');
    const exported = [...source.matchAll(/^export const (\w+)/gm)].map((m) => m[1]);

    expect(exported).toEqual(['MAILBOX']);
  });
});
