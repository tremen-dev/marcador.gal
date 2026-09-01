/**
 * CA-2 (ADR-014 §1 y §4) — la cortesía RN-11 tiene UNA sola implementación.
 *
 * Las tres prohibiciones del ADR se comprueban con un test, no con revisión de
 * código: fuera de `src/polite/` no puede haber (a) análisis de un
 * `robots.txt`, (b) construcción de la cabecera `User-Agent`, ni (c) una
 * llamada a `globalThis.fetch` **o equivalente** dirigida a un tercero. El
 * modo de fallo de RN-11 es una petición que sale, se sirve y no vuelve, así
 * que nada se pone rojo solo.
 *
 * Cada detector lleva su CONTROL POSITIVO: se aplica sobre texto sintético que
 * simula una segunda implementación en `src/mirror/`, en `src/ingest/` y en
 * `src/site/`, y se exige que muerda en los tres. Sin ese control, un detector
 * que dejara de encontrar nada pasaría en verde para siempre.
 *
 * Y LOS CONTROLES POSITIVOS NO SON UNA COLECCIÓN CERRADA. El verificador
 * demostró —ejecutando, con la suite entera en verde— tres formas de rodear
 * este guardián (F-SPEC-008-V1): una segunda puerta de salida por
 * `node:https`, un segundo parser que escribe el campo dentro de una regex, y
 * una recomposición de la cadena declarada desde las constantes exportadas.
 * Las tres viven ahora en `EVASIONS` y el caso 7 exige que mueran. Cuando
 * aparezca la cuarta, se añade ahí: un detector literal caza lo que ya se sabe
 * escribir, y por eso lo que se sabe se escribe.
 */
import { describe, expect, test } from 'vitest';
import { readSourceTree, stripComments } from '../support/source-tree';
import type { SourceFile } from '../support/source-tree';

const TREE = await readSourceTree();
const OUTSIDE = TREE.filter((file) => !file.path.startsWith('polite/'));

/** El módulo dueño, y la prueba de que el escaneo mide algo. */
const POLITE = TREE.filter((file) => file.path.startsWith('polite/'));

/**
 * Un `import` nombra un módulo; no analiza nada ni compone nada. Sin quitar el
 * especificador, `from '@/polite/user-agent'` cuenta como la palabra
 * `user-agent`, y el detector se convertiría en ruido.
 *
 * Se quitan SOLO para los detectores de texto (a) y (b): el detector (c) mira
 * precisamente los especificadores, porque una segunda puerta de salida
 * empieza por importar el módulo que la abre.
 */
function withoutModuleSpecifiers(code: string): string {
  return code.replaceAll(/(?:\bfrom|\bimport|\brequire)\s*\(?\s*(['"])[^'"]*\1/g, '');
}

/**
 * (a) Analizar un `robots.txt` es reconocer los nombres de sus campos, y RFC
 * 9309 los fija: no hay parser que no los escriba.
 *
 * Tres detectores, y el tercero es el que cierra el agujero de F-SPEC-008-V1:
 * mirar solo el token ENTRECOMILLADO Y EXACTO deja pasar un segundo parser que
 * los escriba dentro de una expresión regular (`/^\s*disallow\s*:/i`), que es
 * la forma más natural de escribir el segundo.
 */
const ROBOTS_FIELD = /(['"])(?:user-agent|allow|disallow)\1/;
const ROBOTS_SYMBOL =
  /\b(?:function|const|class|interface|type)\s+(?:parseRobots|robotsRegistry|robotsSkipReason|allowAllRobots|RobotsPolicy)\b/;
/** La palabra del campo, escrita como sea: cadena, regex o identificador. */
const ROBOTS_WORD = /\b(?:disallow|user-agent)\b/i;

/**
 * Los DOS ficheros que escriben las palabras del formato sin analizar el de
 * nadie. Van nombrados uno a uno —no por patrón— para que añadir un tercero
 * sea un diff visible, y el caso 7 comprueba que la lista no envejece.
 *
 * `site/robots-txt.ts` GENERA el nuestro (SPEC-004 CA-11) y el informe de
 * SPEC-003 CITA el de futgal dentro de una frase en castellano. Ninguno de los
 * dos queda exento de `ROBOTS_FIELD` ni de `ROBOTS_SYMBOL`: la exención es solo
 * de la palabra suelta.
 */
const ROBOTS_PROSE: readonly string[] = [
  'mirror/analysis/referenceless/report.ts',
  'site/robots-txt.ts',
];

function parsesRobots(file: SourceFile): boolean {
  if (ROBOTS_FIELD.test(file.code) || ROBOTS_SYMBOL.test(file.code)) return true;
  if (ROBOTS_PROSE.includes(file.path)) return false;
  return ROBOTS_WORD.test(withoutModuleSpecifiers(file.code));
}

/** (b) Construir la cabecera es escribir su nombre como clave de un objeto. */
const UA_HEADER = /['"]user-agent['"]\s*:/i;
/** …o componer la cadena declarada, que se hace en un solo sitio (ADR-011). */
const UA_LITERAL = /USER_AGENT(?:_PRODUCT|_VERSION|_CONTACT|_PATTERN)?\s*=/;
/**
 * …o recomponerla desde las piezas exportadas, sin asignar a ningún nombre
 * `USER_AGENT*` y sin copiar el literal del propósito. Es la tercera evasión
 * de F-SPEC-008-V1: las tres constantes de ADR-011 son de `src/polite/` y solo
 * ahí se leen. Quien necesite la cadena importa `USER_AGENT`, ya compuesta.
 */
const UA_PARTS = /\bUSER_AGENT_(?:PRODUCT|VERSION|CONTACT)\b/;
/** …o partir el nombre de la cabecera para escaparse de `UA_HEADER`. */
const UA_SPLIT = /['"`]\s*user-?\s*['"`]\s*\+|\+\s*['"`]\s*-?\s*agent\s*['"`]/i;

function buildsUserAgent(file: SourceFile): boolean {
  const code = withoutModuleSpecifiers(file.code);
  return (
    UA_HEADER.test(code) || UA_LITERAL.test(code) || UA_PARTS.test(code) || UA_SPLIT.test(code)
  );
}

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

/**
 * «…o equivalente», dice el CA, y `fetch` no es la única puerta que abre un
 * socket. Se prohíbe IMPORTAR la puerta, no llamarla: el `import` es lo que no
 * se puede escribir de veinte maneras, y por eso muerde aunque la llamada
 * venga ofuscada (F-SPEC-008-V1, evasión 1). `child_process` está en la lista
 * porque `curl` también pide a un tercero.
 */
const NETWORK_MODULE =
  /(?:\bfrom|\bimport|\brequire)\s*\(?\s*['"](?:node:)?(?:http|https|http2|net|tls|dgram|dns|child_process|undici|axios|got|node-fetch|superagent|phin|needle)['"]/;
/** Las puertas que ya están en el ámbito global y no hay que importar. */
const NETWORK_GLOBAL = /\b(?:XMLHttpRequest|WebSocket|EventSource)\b|\bsendBeacon\s*\(/;
/** Un `import()` con especificador calculado es un `import` que no se puede leer. */
const COMPUTED_IMPORT = /\bimport\s*\(\s*(?!['"])/;

function reachesTheNetwork(file: SourceFile): boolean {
  return (
    callsPlatformFetch(file.code) ||
    NETWORK_MODULE.test(file.code) ||
    NETWORK_GLOBAL.test(file.code) ||
    COMPUTED_IMPORT.test(file.code)
  );
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

/**
 * Las TRES evasiones que el verificador demostró ejecutando (F-SPEC-008-V1):
 * cada una convivía con la suite entera en verde, y cada una rodea uno de los
 * tres detectores por su lado literal. Van aquí como control positivo, con el
 * detector que tiene que morderlas nombrado al lado, para que el día que
 * alguien afloje un detector el control caiga con él.
 */
const EVASIONS: readonly {
  readonly path: string;
  readonly detector: 'robots' | 'ua' | 'red';
  readonly text: string;
}[] = [
  {
    // Evasión 1: una segunda puerta de salida que no es `fetch`, con la
    // cabecera puesta por clave calculada. Es la tercera prohibición de
    // ADR-014 §4 y la de fallo más silencioso.
    path: 'ingest/back-door.ts',
    detector: 'red',
    text: [
      "import { request } from 'node:https';",
      "const key = 'User-' + 'Agent';",
      'export function ask(url: string, ua: string): void {',
      '  const headers: Record<string, string> = {};',
      '  headers[key] = ua;',
      '  request(url, { headers }).end();',
      '}',
    ].join('\n'),
  },
  {
    // Evasión 2: un segundo parser que escribe el campo dentro de una regex,
    // sin token entrecomillado y sin ninguno de los cinco nombres declarados.
    path: 'ingest/second-robots.ts',
    detector: 'robots',
    text: [
      'const FIELD = /^\\s*disallow\\s*:/i;',
      'export function forbids(txt: string, path: string): boolean {',
      '  const rules = txt.split(String.fromCharCode(10)).filter((line) => FIELD.test(line));',
      '  return rules.some((line) => path.startsWith(line.slice(line.indexOf(":") + 1).trim()));',
      '}',
    ].join('\n'),
  },
  {
    // Evasión 3: la cadena declarada, recompuesta fuera de `src/polite/` desde
    // las constantes exportadas y sin el literal del propósito, que es lo que
    // el guardián de `tests/mirror/user-agent.test.ts` sí vigila.
    path: 'site/second-ua.ts',
    detector: 'ua',
    text: [
      "import { USER_AGENT_CONTACT, USER_AGENT_PRODUCT, USER_AGENT_VERSION } from '@/polite/user-agent';",
      "const purpose = ['medicion', 'de', 'latencia'].join(' ');",
      'export const declared = `${USER_AGENT_PRODUCT}/${USER_AGENT_VERSION} (+${USER_AGENT_CONTACT}; ${purpose})`;',
    ].join('\n'),
  },
];

const DETECTORS: Record<'robots' | 'ua' | 'red', (file: SourceFile) => boolean> = {
  robots: parsesRobots,
  ua: buildsUserAgent,
  red: reachesTheNetwork,
};

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
    expect(offenders(OUTSIDE, parsesRobots)).toEqual([]);
  });

  test('3. (b) nadie más construye la cabecera `User-Agent` ni compone la cadena', () => {
    expect(offenders(OUTSIDE, buildsUserAgent)).toEqual([]);
  });

  test('4. (c) nadie más llama al `fetch` de la plataforma NI ABRE OTRA PUERTA', () => {
    expect(offenders(OUTSIDE, reachesTheNetwork)).toEqual([]);
    // Y dentro de `src/polite/` hay exactamente UNA puerta, que es `fetch`:
    // ni siquiera la dueña de la cortesía tiene una segunda.
    expect(offenders(POLITE, (f) => callsPlatformFetch(f.code))).toEqual(['polite/http.ts']);
    expect(offenders(POLITE, reachesTheNetwork)).toEqual(['polite/http.ts']);
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
      (file) => parsesRobots(file) && buildsUserAgent(file) && reachesTheNetwork(file),
    );

    expect(flagged.map((file) => file.path)).toEqual([
      'mirror/capture/robots.ts',
      'ingest/courtesy.ts',
      'site/crawler-fetch.ts',
    ]);
  });

  test('7. y FALLA también con las tres evasiones que rodearon al guardián (F-SPEC-008-V1)', () => {
    // Las tres convivían con la suite entera en verde. Cada una se comprueba
    // contra el detector que le toca, uno a uno, para que el control no pueda
    // pasar en verde porque otro detector la cazó por accidente.
    for (const evasion of EVASIONS) {
      expect(
        DETECTORS[evasion.detector](asSourceFile(evasion)),
        `${evasion.path} tenía que caer por el detector «${evasion.detector}»`,
      ).toBe(true);
    }

    // Y ninguna la caza el guardián viejo: si esta línea se pusiera roja
    // significaría que el caso 7 dejó de probar lo que dice probar.
    for (const evasion of EVASIONS.map(asSourceFile)) {
      const old =
        ROBOTS_FIELD.test(evasion.code) ||
        ROBOTS_SYMBOL.test(evasion.code) ||
        UA_HEADER.test(evasion.code) ||
        UA_LITERAL.test(evasion.code) ||
        callsPlatformFetch(evasion.code);
      expect(old, `${evasion.path} ya lo cazaba el guardián viejo`).toBe(false);
    }
  });

  test('8. las dos exenciones nominales de (a) siguen vivas, y son exactamente dos', () => {
    // Una exención por patrón se convierte en un agujero en cuanto alguien
    // crea un fichero que encaje. Éstas van por nombre, y aquí se comprueba
    // que ninguna sobra —el fichero existe— y que ninguna se ha vuelto
    // innecesaria —el fichero todavía escribe la palabra—.
    expect([...ROBOTS_PROSE].sort()).toEqual([
      'mirror/analysis/referenceless/report.ts',
      'site/robots-txt.ts',
    ]);

    for (const path of ROBOTS_PROSE) {
      const file = TREE.find((f) => f.path === path);
      expect(file, `la exención nombra ${path}, que ya no existe`).toBeDefined();
      expect(ROBOTS_WORD.test(withoutModuleSpecifiers(file!.code))).toBe(true);
      // Exentas de la palabra suelta, NUNCA del parser: el token
      // entrecomillado y los cinco nombres declarados les siguen aplicando.
      expect(ROBOTS_FIELD.test(file!.code) || ROBOTS_SYMBOL.test(file!.code)).toBe(false);
    }
  });
});
