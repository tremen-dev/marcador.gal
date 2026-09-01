/**
 * CA-2 (ADR-014 §1 y §4) — la cortesía RN-11 tiene UNA sola implementación.
 *
 * Las tres prohibiciones del ADR se comprueban con un test, no con revisión de
 * código: fuera de `src/polite/` no puede haber (a) análisis de un
 * `robots.txt`, (b) construcción de la cabecera `User-Agent`, ni (c) una
 * llamada al `fetch` de la plataforma. El modo de fallo de RN-11 es una
 * petición que sale, se sirve y no vuelve, así que nada se pone rojo solo.
 *
 * Cada detector lleva su CONTROL POSITIVO: se aplica sobre texto sintético que
 * simula una segunda implementación en `src/mirror/`, en `src/ingest/` y en
 * `src/site/`, y se exige que muerda en los tres. Sin ese control, un detector
 * que dejara de encontrar nada pasaría en verde para siempre.
 */
import { describe, expect, test } from 'vitest';
import { readSourceTree, stripComments } from '../support/source-tree';
import type { SourceFile } from '../support/source-tree';

const TREE = await readSourceTree();
const OUTSIDE = TREE.filter((file) => !file.path.startsWith('polite/'));

/** El módulo dueño, y la prueba de que el escaneo mide algo. */
const POLITE = TREE.filter((file) => file.path.startsWith('polite/'));

/**
 * (a) Analizar un `robots.txt` es comparar el nombre de un campo con los
 * tokens en minúscula del formato, o declarar una de las piezas del parser.
 *
 * Se mira el token ENTRECOMILLADO Y EXACTO (`'disallow'`), no la palabra
 * suelta: `src/site/robots-txt.ts` escribe `'User-agent: *'` para GENERAR el
 * nuestro —que no es analizar el de nadie— y el informe de SPEC-003 cita
 * «Disallow: /» dentro de una frase en castellano. Ninguno de los dos casa.
 */
const ROBOTS_FIELD = /(['"])(?:user-agent|allow|disallow)\1/;
const ROBOTS_SYMBOL =
  /\b(?:function|const|class|interface|type)\s+(?:parseRobots|robotsRegistry|robotsSkipReason|allowAllRobots|RobotsPolicy)\b/;

/** (b) Construir la cabecera es escribir su nombre como clave de un objeto. */
const UA_HEADER = /['"]user-agent['"]\s*:/i;
/** …o componer la cadena declarada, que se hace en un solo sitio (ADR-011). */
const UA_LITERAL = /USER_AGENT(?:_PRODUCT|_VERSION|_CONTACT|_PATTERN)?\s*=/;

/**
 * (c) Llamar al `fetch` de la plataforma. La FIRMA de un puerto
 * —`fetch(request: X): Promise<Y>;`— es una declaración, no una llamada: una
 * llamada no lleva anotación de tipo de retorno tras los paréntesis. Misma
 * forma que el caso 4 de `tests/mirror/capture/redirects.test.ts`.
 */
function callsPlatformFetch(code: string): boolean {
  const withoutSignatures = code.replaceAll(/^\s*fetch\s*\([^)]*\)\s*:.*$/gm, '');
  return /globalThis\.fetch\s*\(|(?<![.\w])fetch\s*\(/.test(withoutSignatures);
}

function offenders(files: readonly SourceFile[], detect: (file: SourceFile) => boolean): string[] {
  return files.filter(detect).map((file) => file.path);
}

/** Texto sintético que simula una segunda implementación, por destino. */
const SECOND_IMPLEMENTATIONS: readonly { readonly path: string; readonly text: string }[] = [
  {
    path: 'mirror/capture/robots.ts',
    text: [
      "export function parseRobots(text: string) {",
      "  if (field === 'disallow') return false;",
      "  return globalThis.fetch(url, { headers: { 'User-Agent': USER_AGENT } });",
      '}',
    ].join('\n'),
  },
  {
    path: 'ingest/courtesy.ts',
    text: [
      "const rules = lines.filter((l) => l.field === 'allow');",
      "await fetch(url, { headers: { 'user-agent': ua } });",
      'export const USER_AGENT = `marcador.gal/0.0.1`;',
    ].join('\n'),
  },
  {
    path: 'site/crawler-fetch.ts',
    text: [
      "export interface RobotsPolicy { isAllowed(url: string): boolean }",
      "const headers = { 'User-Agent': 'marcador.gal/0.0.1' };",
      'const body = await fetch(target);',
    ].join('\n'),
  },
];

function asSourceFile(entry: { path: string; text: string }): SourceFile {
  return { path: entry.path, text: entry.text, code: stripComments(entry.text) };
}

describe('CA-2 — fuera de `src/polite/` no hay cortesía RN-11', () => {
  test('1. el escaneo mide algo: `src/polite/` existe y lleva la cortesía entera', () => {
    // Los cuatro de ADR-014 §1, más el reloj inyectable que no podía quedarse
    // detrás sin invertir la dependencia, y la vigencia del robots.txt de §3.
    expect(POLITE.map((file) => file.path)).toEqual([
      'polite/clock.ts',
      'polite/http.ts',
      'polite/policy.ts',
      'polite/rate-limit.ts',
      'polite/robots.ts',
      'polite/user-agent.ts',
    ]);
    expect(OUTSIDE.length).toBeGreaterThan(20);
  });

  test('2. (a) nadie más analiza un `robots.txt`', () => {
    expect(
      offenders(OUTSIDE, (f) => ROBOTS_FIELD.test(f.code) || ROBOTS_SYMBOL.test(f.code)),
    ).toEqual([]);
  });

  test('3. (b) nadie más construye la cabecera `User-Agent` ni compone la cadena', () => {
    expect(offenders(OUTSIDE, (f) => UA_HEADER.test(f.code) || UA_LITERAL.test(f.code))).toEqual([]);
  });

  test('4. (c) nadie más llama al `fetch` de la plataforma', () => {
    expect(offenders(OUTSIDE, (f) => callsPlatformFetch(f.code))).toEqual([]);
    // Y dentro de `src/polite/` hay exactamente UNA puerta.
    expect(offenders(POLITE, (f) => callsPlatformFetch(f.code))).toEqual(['polite/http.ts']);
  });

  test('5. los tres consumidores importan de `src/polite/`, que es la puerta', () => {
    const importsPolite = (file: SourceFile) => /from\s+['"]@\/polite\//.test(file.code);

    expect(TREE.filter((f) => f.path.startsWith('mirror/')).some(importsPolite)).toBe(true);
    expect(TREE.filter((f) => f.path.startsWith('ingest/')).some(importsPolite)).toBe(true);
    expect(TREE.filter((f) => f.path === 'site/crawler-page.tsx').every(importsPolite)).toBe(true);
  });

  test('6. y el test FALLA si se añade una segunda implementación en cualquiera de los tres', () => {
    // Control positivo. Sin él, un detector roto —o vaciado— pasaría en verde
    // exactamente igual que uno que funciona, que es el fallo que este
    // criterio existe para impedir.
    const flagged = SECOND_IMPLEMENTATIONS.map(asSourceFile).filter(
      (file) =>
        (ROBOTS_FIELD.test(file.code) || ROBOTS_SYMBOL.test(file.code)) &&
        (UA_HEADER.test(file.code) || UA_LITERAL.test(file.code)) &&
        callsPlatformFetch(file.code),
    );

    expect(flagged.map((file) => file.path)).toEqual([
      'mirror/capture/robots.ts',
      'ingest/courtesy.ts',
      'site/crawler-fetch.ts',
    ]);
  });
});
