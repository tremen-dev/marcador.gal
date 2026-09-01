/**
 * SPEC-005 CA-1, CA-3, CA-4, CA-9 y CA-10 — la cadena que un tercero va a ver
 * en su registro de acceso y a escribir en su `robots.txt`.
 *
 * Hasta hoy NINGÚN test fijaba el literal: todos importaban `USER_AGENT`, y por
 * eso cambiarlo era barato (EPIC-003 §Hallazgo). A partir de aquí deja de
 * serlo, y eso es el objetivo y no un efecto secundario: la cadena pasa a ser
 * un compromiso público que alguien escribe en su servidor, y cambiarla en
 * silencio tiene que doler. El coste, dicho entero: cualquier cambio futuro
 * rompe este fichero a propósito y exige una spec.
 */
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { parseRobots } from '@/mirror/capture/robots';
import {
  USER_AGENT,
  USER_AGENT_CONTACT,
  USER_AGENT_PATTERN,
  USER_AGENT_PRODUCT,
  USER_AGENT_VERSION,
} from '@/mirror/user-agent';
import { CRAWLER_PATH, SITE_ORIGIN } from '@/site/routes';

const SOURCE = join(process.cwd(), 'src/mirror/user-agent.ts');

/** La cadena vieja, la que filtraba vocabulario interno. No puede volver. */
const OLD_USER_AGENT = 'marcador.gal/0.0.1 (+mailto:ola@tremen.dev; medicion SPEC-002, RN-11)';

/** El leading block comment del módulo. */
function headerComment(source: string): string {
  return /^\s*\/\*[\s\S]*?\*\//.exec(source)?.[0] ?? '';
}

describe('CA-1 — la cadena nueva, y su comentario', () => {
  test('1. `USER_AGENT` es exactamente la forma que aprobó el humano', () => {
    // Literal a propósito: si se compusiera aquí de las mismas partes que allí,
    // el test compararía el valor consigo mismo y no fijaría nada.
    expect(USER_AGENT).toBe('marcador.gal/0.0.1 (+https://marcador.gal/robot; medicion de latencia)');
    expect(USER_AGENT).not.toBe(OLD_USER_AGENT);
  });

  test('2. se compone del producto y de la versión: subir de 0.0.1 no rompe nada', () => {
    expect(USER_AGENT).toBe(
      `${USER_AGENT_PRODUCT}/${USER_AGENT_VERSION} (+${USER_AGENT_CONTACT}; medicion de latencia)`,
    );
  });

  test('3. el token de producto está congelado: es la clave con la que emparejan los robots.txt ajenos', () => {
    expect(USER_AGENT_PRODUCT).toBe('marcador.gal');
    // Y es lo que el parser mira, y solo eso: `robots.ts` hace split('/')[0].
    expect(USER_AGENT.split('/')[0]).toBe(USER_AGENT_PRODUCT);
  });

  test('4. `medicion` va sin tilde: los valores de cabecera HTTP son US-ASCII', () => {
    expect(USER_AGENT).toMatch(/^[\x20-\x7e]+$/);
    expect(USER_AGENT).toContain('medicion de latencia');
    expect(USER_AGENT).not.toContain('medición');
  });

  test('5. sigue casando con `USER_AGENT_PATTERN`, sin tocar el patrón', () => {
    expect(USER_AGENT).toMatch(USER_AGENT_PATTERN);
    expect(USER_AGENT_PATTERN.source).toContain('https?');
    expect(USER_AGENT_PATTERN.source).toContain('mailto');
  });

  test('6. la cabecera deja escrito por qué el contacto es una URL, y que la razón vieja caducó', async () => {
    const header = headerComment(await readFile(SOURCE, 'utf8'));

    // Un comentario que documenta una razón caducada es una trampa para quien
    // lo lea dentro de seis meses: la fecha y el finding tienen que estar.
    expect(header).toContain('2026-08-31');
    expect(header).toContain('F-SPEC-002-1');
    expect(header).toContain('RN-11');
    // Y dónde vive ahora la exigencia de RN-11: en la página, que lleva el buzón.
    expect(header).toContain(CRAWLER_PATH.gl);
    expect(header.toLowerCase()).toContain('mailbox');
  });

  test('7. la cabecera no lleva ninguna dirección de correo: el buzón vive en un solo sitio', async () => {
    const source = await readFile(SOURCE, 'utf8');

    expect(source).not.toMatch(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);
  });
});

describe('CA-3 — la cadena no habla el idioma del repositorio', () => {
  test('8. no contiene ningún identificador interno', () => {
    for (const marker of ['SPEC-', 'RN-', 'EPIC-', 'ADR-']) {
      expect(USER_AGENT.toUpperCase()).not.toContain(marker);
    }
  });
});

describe('CA-4 — el `+` lleva a una dirección que existe', () => {
  test('9. `USER_AGENT_CONTACT` es la URL de la página del rastreador', () => {
    expect(USER_AGENT_CONTACT).toBe('https://marcador.gal/robot');
  });

  test('10. y es la MISMA dirección que sirve el sitio, no una copia que puede derivar', () => {
    // Literal arriba, comparación con las rutas del sitio aquí: así renombrar
    // `CRAWLER_PATH.gl` o `SITE_ORIGIN` pone esto rojo en vez de pasar
    // comparando el valor consigo mismo (F-SPEC-004-9).
    expect(USER_AGENT_CONTACT).toBe(`${SITE_ORIGIN}${CRAWLER_PATH.gl}`);
    expect(SITE_ORIGIN).toBe('https://marcador.gal');
    expect(CRAWLER_PATH.gl).toBe('/robot');
  });

  test('11. ya no es un `mailto:`, y ningún código futuro debería asumir que lo es', () => {
    expect(USER_AGENT_CONTACT.startsWith('https://')).toBe(true);
    expect(USER_AGENT_CONTACT).not.toContain('mailto:');
  });
});

describe('CA-9 — lo que se le pide a la RFGF sigue funcionando con la cadena nueva', () => {
  /**
   * Fixture SINTÉTICO, escrito aquí y no capturado: nunca se versiona el
   * `robots.txt` real de un tercero (ADR-009 §3). Es, línea a línea, lo que la
   * carta pide que añadan, junto al comodín que hoy nos deja fuera.
   */
  const WITH_OUR_GROUP = [
    'User-agent: marcador.gal',
    'Allow: /',
    '',
    'User-agent: *',
    'Disallow: /',
    '',
  ].join('\n');

  const WITHOUT_OUR_GROUP = ['User-agent: *', 'Disallow: /', ''].join('\n');

  /** Las dos competiciones del estudio, en rutas sintéticas de un origen ficticio. */
  const PATHS = [
    'https://example.invalid/competicion/tercera-rfef-g1',
    'https://example.invalid/competicion/preferente-g1',
  ];

  test('12. con el grupo que pide la carta, las dos competiciones quedan permitidas', () => {
    const policy = parseRobots(WITH_OUR_GROUP, USER_AGENT);

    expect(PATHS.filter((url) => !policy.isAllowed(url))).toEqual([]);
  });

  test('13. sin ese grupo, el comodín nos deja fuera de las dos', () => {
    const policy = parseRobots(WITHOUT_OUR_GROUP, USER_AGENT);

    expect(PATHS.filter((url) => policy.isAllowed(url))).toEqual([]);
  });

  test('14. empareja por token de producto, no por la cadena entera: por eso el cambio fue barato', () => {
    // La misma línea `User-agent: marcador.gal` sigue emparejando con la cadena
    // vieja y con la nueva. Es lo que hace que la petición de la carta no
    // caduque cada vez que cambie el propósito declarado.
    for (const agent of [USER_AGENT, OLD_USER_AGENT]) {
      expect(parseRobots(WITH_OUR_GROUP, agent).isAllowed(PATHS[0]!)).toBe(true);
    }
  });
});

describe('CA-10 — el cambio es de un solo fichero dentro de src/mirror/', () => {
  test('15. ninguna otra línea de src/mirror/ se ha tocado', () => {
    const output = execFileSync('git', ['diff', '--name-only', 'main', '--', 'src/mirror/'], {
      cwd: process.cwd(),
      encoding: 'utf8',
    });

    const changed = output.split('\n').filter((line) => line.trim().length > 0);

    // Subconjunto y no igualdad: después de fusionar en `main` el diff queda
    // vacío y eso también es correcto. Lo que nunca puede aparecer es un
    // segundo fichero — ahí es donde «alinear una cadena» se convertiría en
    // «reabrir una spec cerrada».
    expect(changed.filter((file) => file !== 'src/mirror/user-agent.ts')).toEqual([]);
  });
});
