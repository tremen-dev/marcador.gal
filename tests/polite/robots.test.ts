/**
 * CA-1 (RN-11, F-SPEC-002-23) — `robots.txt` matched the way RFC 9309 says.
 *
 * The defect this file closes was silent by construction: `parseRobots` used
 * `path.startsWith(rule.path)`, so the `*` of `Disallow: /ajax*` was matched as
 * a literal asterisk, the rule never fired, and the `Allow: /` of the same
 * group won. `isAllowed()` answered `true` for a path the site forbids, and no
 * test went red (`hallazgos/fontes-capturables.md`).
 *
 * Every fixture here is SYNTHETIC, written by hand: the real `robots.txt` of a
 * third party is never versioned (ADR-009 §3).
 */
import { describe, expect, test } from 'vitest';
import { allowAllRobots, parseRobots, robotsRegistry } from '@/polite/robots';
import { USER_AGENT } from '@/polite/user-agent';

/**
 * The shape besoccer publishes, rewritten by hand: an `Allow: /` next to two
 * trailing-wildcard `Disallow`s. It is the exact combination that produced
 * F-SPEC-002-23.
 */
const WILDCARD_GROUP = [
  '# sintético',
  'User-agent: *',
  'Allow: /',
  'Disallow: /scripts*',
  'Disallow: /ajax*',
  '',
].join('\n');

describe('CA-1 — el comodín `*` deja de ser un carácter literal', () => {
  const policy = parseRobots(WILDCARD_GROUP, USER_AGENT);

  test('1. `Disallow: /ajax*` prohíbe `/ajax/algo`, que es donde vive el marcador en vivo', () => {
    expect(policy.isAllowed('https://www.besoccer.es/ajax/algo')).toBe(false);
  });

  test('2. `Disallow: /scripts*` prohíbe `/scripts/x.js`', () => {
    expect(policy.isAllowed('https://www.besoccer.es/scripts/x.js')).toBe(false);
  });

  test('3. y la página de competición, que no casa con ninguno, sigue permitida', () => {
    expect(
      policy.isAllowed('https://www.besoccer.es/competicion/resultados/galicia/2027/grupo1'),
    ).toBe(true);
  });

  test('4. el comodín no es una prohibición general: `/ajaxo` casa, `/ajaxo` no es `/otra`', () => {
    // Control de que la regla muerde por prefijo y no por «contiene».
    expect(policy.isAllowed('https://www.besoccer.es/ajaxo')).toBe(false);
    expect(policy.isAllowed('https://www.besoccer.es/otra/ajax')).toBe(true);
  });
});

describe('CA-1.1 — `$` ancla el final de la ruta', () => {
  const policy = parseRobots(['User-agent: *', 'Allow: /', 'Disallow: /*.pdf$', ''].join('\n'), USER_AGENT);

  test('5. `/a/b.pdf` queda prohibido', () => {
    expect(policy.isAllowed('https://x.example/a/b.pdf')).toBe(false);
  });

  test('6. y `/a/b.pdf?x=1` queda PERMITIDO: el `$` ancla, no basta con contener', () => {
    expect(policy.isAllowed('https://x.example/a/b.pdf?x=1')).toBe(true);
  });
});

describe('CA-1.2 — el comodín en medio del patrón', () => {
  const policy = parseRobots(['User-agent: *', 'Allow: /', 'Disallow: /a*b', ''].join('\n'), USER_AGENT);

  test('7. `/a*b` prohíbe `/a/x/b`', () => {
    expect(policy.isAllowed('https://x.example/a/x/b')).toBe(false);
  });

  test('8. y permite `/a/x`', () => {
    expect(policy.isAllowed('https://x.example/a/x')).toBe(true);
  });
});

describe('CA-1.3 — el desempate es por longitud de patrón, y a igual longitud gana `Allow`', () => {
  test('9. el patrón más largo gana, esté escrito antes o después', () => {
    const disallowFirst = parseRobots(
      ['User-agent: *', 'Disallow: /a/', 'Allow: /a/b/', ''].join('\n'),
      USER_AGENT,
    );
    const allowFirst = parseRobots(
      ['User-agent: *', 'Allow: /a/b/', 'Disallow: /a/', ''].join('\n'),
      USER_AGENT,
    );

    for (const policy of [disallowFirst, allowFirst]) {
      expect(policy.isAllowed('https://x.example/a/b/c')).toBe(true);
      expect(policy.isAllowed('https://x.example/a/z')).toBe(false);
    }
  });

  test('10. a IGUAL longitud gana el `Allow`, aunque el `Disallow` esté escrito primero', () => {
    // ESTE es el cambio de comportamiento adicional al comodín, y va desnudo:
    // hoy ganaba el que apareciera antes en el fichero (ADR-014, consecuencias).
    // Es más permisivo en un caso estrecho, y es lo que dice RFC 9309.
    const policy = parseRobots(
      ['User-agent: *', 'Disallow: /a/b', 'Allow: /a/b', ''].join('\n'),
      USER_AGENT,
    );

    expect(policy.isAllowed('https://x.example/a/b')).toBe(true);
  });

  test('11. y también cuando el `Allow` va primero: el orden del fichero no decide nada', () => {
    const policy = parseRobots(
      ['User-agent: *', 'Allow: /a/b', 'Disallow: /a/b', ''].join('\n'),
      USER_AGENT,
    );

    expect(policy.isAllowed('https://x.example/a/b')).toBe(true);
  });
});

describe('CA-1.4 — no se rompe nada de lo que ya funcionaba', () => {
  test('12. varios grupos `User-agent: *` se acumulan', () => {
    const policy = parseRobots(
      [
        'User-agent: *',
        'Disallow: /uno/',
        '',
        'User-agent: *',
        'Disallow: /dos/',
        '',
      ].join('\n'),
      USER_AGENT,
    );

    expect(policy.isAllowed('https://x.example/uno/a')).toBe(false);
    expect(policy.isAllowed('https://x.example/dos/a')).toBe(false);
    expect(policy.isAllowed('https://x.example/tres/a')).toBe(true);
  });

  test('13. `Disallow:` con valor vacío significa «nada prohibido»', () => {
    const policy = parseRobots(['User-agent: *', 'Disallow:', ''].join('\n'), USER_AGENT);

    expect(policy.isAllowed('https://x.example/cualquier/cosa')).toBe(true);
  });

  test('14. el grupo específico gana al `*`, esté donde esté en el fichero', () => {
    const policy = parseRobots(
      ['User-agent: BadBot', 'Disallow: /', '', 'User-agent: *', 'Disallow: /privado/', ''].join(
        '\n',
      ),
      USER_AGENT,
    );

    expect(policy.isAllowed('https://x.example/publico')).toBe(true);
    expect(policy.isAllowed('https://x.example/privado/a')).toBe(false);
  });

  test('15. un origen sin política cargada queda DENEGADO: silencio no es consentimiento', () => {
    const registry = robotsRegistry([['https://www.ceroacero.es', allowAllRobots()]]);

    expect(registry.isAllowed('https://www.ceroacero.es/edicion/x')).toBe(true);
    expect(registry.isAllowed('https://otro.example/x')).toBe(false);
  });

  test('16. `Disallow: /edicion/` + `Allow: /edicion/publica/` significa lo que su autor quiso', () => {
    const policy = parseRobots(
      ['User-agent: *', 'Disallow: /edicion/', 'Allow: /edicion/publica/', ''].join('\n'),
      USER_AGENT,
    );

    expect(policy.isAllowed('https://www.ceroacero.es/edicion/tercera-rfef-grupo-1/live')).toBe(
      false,
    );
    expect(policy.isAllowed('https://www.ceroacero.es/edicion/publica/tercera-rfef-grupo-1')).toBe(
      true,
    );
  });

  test('17. empareja por token de producto de NUESTRA user-agent, no por la cadena entera', () => {
    const policy = parseRobots(
      ['User-agent: marcador.gal', 'Allow: /', '', 'User-agent: *', 'Disallow: /', ''].join('\n'),
      USER_AGENT,
    );

    expect(policy.isAllowed('https://x.example/competicion/tercera-rfef-g1')).toBe(true);
  });
});

describe('CA-1 — el motivo que registra un tick omitido nombra la ruta y cita RN-11', () => {
  test('18. `robotsSkipReason` lleva la ruta y el número de la regla', async () => {
    const { robotsSkipReason } = await import('@/polite/robots');

    const reason = robotsSkipReason('https://www.besoccer.es/ajax/algo?x=1');

    expect(reason).toContain('/ajax/algo?x=1');
    expect(reason).toContain('RN-11');
  });
});
