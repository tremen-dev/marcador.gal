/**
 * CA-9 — galego por defecto, castellano con paridad, y ningún literal escrito
 * en el código (D-2).
 *
 * La paridad SE IMPONE CON UN TIPO, no con un test de longitud: la prueba de
 * que quitar una clave de `es.ts` no compila vive en
 * `tests/types/spec017-admin.test-d.ts`, en `@ts-expect-error`, que es donde un
 * invariante de tipo se prueba en este repositorio.
 */
import { describe, expect, test } from 'vitest';
import { readFile } from 'node:fs/promises';
import {
  ADMIN_LOCALES,
  DEFAULT_ADMIN_LOCALE,
  adminBundle,
  adminQualifier,
  adminStatus,
  fill,
  rawAdminBundle,
} from '@/i18n/admin';
import { es } from '@/i18n/es';
import { gl } from '@/i18n/gl';
import { statusesBundle } from '@/i18n/statuses';
import { MATCH_QUALIFIERS } from '@/model/qualifier';
import { MATCH_STATUSES } from '@/model/match';
import { getPanel, scene } from './support/doubles';

describe('CA-9.1 — el contrato, el resolutor y la paridad clave a clave', () => {
  test('1. las dos lenguas tienen exactamente las mismas claves', () => {
    const glKeys = Object.keys(rawAdminBundle('gl')).sort();
    const esKeys = Object.keys(rawAdminBundle('es')).sort();

    expect(glKeys).toEqual(esKeys);
    expect(glKeys.length).toBeGreaterThan(30);
  });

  test('2. ninguna clave está vacía en ninguna de las dos', () => {
    const empty = ADMIN_LOCALES.flatMap((locale) =>
      Object.entries(rawAdminBundle(locale))
        .filter(([, value]) => value.trim() === '')
        .map(([key]) => `${locale}.${key}`),
    );

    expect(empty).toEqual([]);
  });

  test('3. y galego es el DEFECTO, que es lo que D-2 dice', () => {
    expect(DEFAULT_ADMIN_LOCALE).toBe('gl');
    expect(ADMIN_LOCALES[0]).toBe('gl');
  });
});

describe('CA-9.2 — la lengua sale de la URL, nunca del cliente', () => {
  test('4. `/admin` sirve galego y `/es/admin` sirve castellano', async () => {
    const { adminHandler } = await import('@/admin/handler');
    const { sceneEnv } = await import('./support/doubles');

    const pages = await Promise.all(
      (['gl', 'es'] as const).map(async (locale) => {
        const built = scene();
        const answer = await adminHandler({
          ports: built.ports,
          env: sceneEnv(),
          locale,
        })(new Request('https://marcador.gal/admin'));
        return await answer.text();
      }),
    );

    expect(pages[0]).toContain(gl.admin.accessHeading);
    expect(pages[1]).toContain(es.admin.accessHeading);
    expect(pages[0]).toContain('<html lang="gl">');
    expect(pages[1]).toContain('<html lang="es">');
  });

  test('5. y el `Accept-Language` del cliente NO cambia nada', async () => {
    const built = scene();
    const answer = await getPanel(built, { token: 'no-vale' });
    void (await answer.text());

    // El doble no registra ninguna negociación porque no hay ninguna: la
    // lengua es un parámetro del handler, que la ruta fija.
    const source = await readFile('src/admin/handler.ts', 'utf8');
    expect(source.toLowerCase()).not.toContain('accept-language');
  });
});

describe('CA-9.5 — los cinco estados salen de `statuses`, que ya existía', () => {
  test('6. `adminStatus` devuelve exactamente lo del espacio de nombres compartido', () => {
    for (const locale of ADMIN_LOCALES) {
      for (const status of MATCH_STATUSES) {
        expect(adminStatus(locale, status)).toBe(statusesBundle(locale)[status]);
      }
    }
  });

  test('7. y no hay un segundo juego: `AdminBundle` no tiene ninguna clave de estado', () => {
    const keys = Object.keys(rawAdminBundle('gl'));

    for (const status of MATCH_STATUSES) {
      expect(keys).not.toContain(status);
    }
  });
});

describe('CA-9.6 — los cuatro cualificadores existen en las DOS lenguas', () => {
  test('8. las cuatro claves, en galego y en castellano', () => {
    for (const qualifier of MATCH_QUALIFIERS) {
      expect(gl.qualifiers[qualifier].length).toBeGreaterThan(0);
      expect(es.qualifiers[qualifier].length).toBeGreaterThan(0);
    }
  });

  test('9. los literales son LOS DEL GLOSARIO, copiados y no inventados', () => {
    // `docs/fundacion/dominio.md`, tabla de cualificadores, escrita por
    // `sdd-arquitecto` el 2026-09-03 tras la firma del gate.
    expect(gl.qualifiers).toEqual({
      provisional: 'Provisional',
      confirmado: 'Confirmado',
      pendente_de_confirmar: 'Pendente de confirmar',
      sen_sinal: 'Sen sinal',
    });
    expect(es.qualifiers).toEqual({
      provisional: 'Provisional',
      confirmado: 'Confirmado',
      pendente_de_confirmar: 'Pendiente de confirmar',
      sen_sinal: 'Sin señal',
    });
  });

  test('10. dos de los cuatro son IDÉNTICOS en las dos lenguas, y eso es correcto', () => {
    // No es un descuido de traducción y no se «arregla»: lo dice el glosario.
    expect(es.qualifiers.provisional).toBe(gl.qualifiers.provisional);
    expect(es.qualifiers.confirmado).toBe(gl.qualifiers.confirmado);
    expect(es.qualifiers.sen_sinal).not.toBe(gl.qualifiers.sen_sinal);
    expect(es.qualifiers.pendente_de_confirmar).not.toBe(gl.qualifiers.pendente_de_confirmar);
  });

  test('11. EL IDENTIFICADOR NO SE TRADUCE: las claves siguen en galego', () => {
    expect([...MATCH_QUALIFIERS]).toEqual([
      'provisional',
      'confirmado',
      'pendente_de_confirmar',
      'sen_sinal',
    ]);
    expect(Object.keys(es.qualifiers)).toEqual([...MATCH_QUALIFIERS]);
  });

  test('12. y el glosario los tiene escritos ANTES de usarse', async () => {
    const glossary = await readFile('docs/fundacion/dominio.md', 'utf8');

    for (const value of Object.values(es.qualifiers)) {
      expect(glossary, `${value}`).toContain(value);
    }
  });

  test('13. `adminQualifier` resuelve por lengua y devuelve texto del bundle', () => {
    expect(adminQualifier('gl', 'sen_sinal')).toBe('Sen sinal');
    expect(adminQualifier('es', 'sen_sinal')).toBe('Sin señal');
  });
});

describe('CA-9.3 — `AdminText`: el único productor es el bundle', () => {
  test('14. `asAdminText` NO se exporta, que es el mecanismo entero', async () => {
    const source = await readFile('src/i18n/admin.ts', 'utf8');

    expect(source).toContain('function asAdminText');
    expect(source).not.toMatch(/export\s+function\s+asAdminText/);
    expect(source).not.toMatch(/export\s*\{[^}]*asAdminText/);
  });

  test('15. y `src/admin/` no lo fabrica con un `as`', async () => {
    const { scanned } = await import('./support/frontier');
    const files = (await scanned()).filter((file) => file.path.startsWith('src/admin/'));

    for (const file of files) {
      expect(file.code, `${file.path}`).not.toContain('as AdminText');
      expect(file.code, `${file.path}`).not.toContain('asAdminText');
    }
  });

  test('16. `fill` interpola en un `AdminText` y devuelve un `AdminText`', () => {
    const bundle = adminBundle('gl');
    const filled = fill(bundle.ackPublished, {
      home: 'RC Celta B',
      away: 'UD Ourense',
      homeScore: '2',
      awayScore: '1',
      qualifier: 'Confirmado',
    });

    expect(filled).toContain('RC Celta B');
    expect(filled).toContain('2-1');
    expect(filled).not.toContain('{home}');
  });
});
