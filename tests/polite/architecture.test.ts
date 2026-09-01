/**
 * CA-2, the static half — CA-2.3 to CA-2.7 (ADR-014 §1 y §4; ADR-016).
 *
 * ESTE FICHERO YA NO BUSCA PALABRAS. Buscaba tres cosas prohibidas —un
 * `robots.txt` analizado, una cabecera `User-Agent` construida, una llamada a
 * `fetch` «o equivalente»— y en dos vueltas de verificación se rodeó siete
 * veces. No por flojo: **una lista de formas de escribir una llamada crece con
 * la imaginación de quien la rodea, y no tiene última entrada**
 * (F-SPEC-008-10, y el arbitraje del 2026-09-01 lo firma).
 *
 * Ahora **enumera lo permitido y exige que el resto sea vacío**:
 *
 *   CA-2.3  todo especificador de módulo es un literal de `ALLOWED_PACKAGES` o
 *           una ruta que resuelve dentro del repositorio; uno que no sea
 *           literal estático es rojo por construcción.
 *   CA-2.4  fuera de `src/polite/` no se toma prestada la capacidad global.
 *   CA-2.5  nada huérfano en `src/ingest/`, `src/polite/` y `src/site/`.
 *   CA-2.6  el escaneo cubre todo el `.ts`/`.tsx` versionado fuera de `tests/`.
 *   CA-2.7  cada mecanismo lleva su control positivo, y las tres evasiones
 *           vivas están escritas como controles.
 *
 * NO QUEDA NINGUNA EXENCIÓN POR NOMBRE DE FICHERO. `src/site/robots-txt.ts` y
 * `src/mirror/analysis/referenceless/report.ts` dejan de necesitarla porque el
 * criterio deja de mirar palabras, y con la lista desaparece el agujero de
 * F-SPEC-008-V9. Ninguno de los dos ficheros cambia (CA-3).
 *
 * La mitad en EJECUCIÓN —CA-2.1 y CA-2.2— vive en `containment.test.ts`, que
 * instala las trampas antes de importar nada de `src/`.
 */
import { readFile } from 'node:fs/promises';
import { describe, expect, test } from 'vitest';
import { reachableModules } from '../mirror/support/imports';
import { stripComments } from '../support/source-tree';
import {
  ALLOWED_PACKAGES,
  CONTAINED_DIRS,
  COURTESY_DIR,
  ENTRY_POINTS,
  SCAN_ROOTS,
  capabilityOffences,
  importOffences,
  scanRepository,
  syntheticFile,
  underScanRoots,
  versionedSources,
} from './support/capability';

const SCANNED = await scanRepository();
const OUTSIDE = SCANNED.filter((file) => !file.path.startsWith(COURTESY_DIR));
const POLITE = SCANNED.filter((file) => file.path.startsWith(COURTESY_DIR));

async function offendersOf(
  files: readonly (typeof SCANNED)[number][],
): Promise<readonly string[]> {
  const all: string[] = [];
  for (const file of files) all.push(...(await importOffences(file)));
  return all;
}

describe('CA-2.6 — el escaneo cubre todo el código, no solo `src/`', () => {
  test('1. todo `.ts`/`.tsx` versionado fuera de `tests/` cae bajo una raíz declarada', () => {
    const uncovered = versionedSources().filter((path) => !underScanRoots(path));

    // `next.config.ts` es código ejecutable y hasta hoy quedaba ENTERO fuera
    // del escaneo, con `src/site/redirects.ts` alcanzable solo desde ahí
    // (F-SPEC-008-V14). Las dos configuraciones de vitest, igual.
    expect(uncovered).toEqual([]);
    expect(SCAN_ROOTS).toContain('next.config.ts');
  });

  test('2. y el escaneo mide algo: hay ficheros, y `src/polite/` está entero', () => {
    expect(SCANNED.length).toBeGreaterThan(40);
    expect(POLITE.map((file) => file.path)).toEqual([
      'src/polite/clock.ts',
      'src/polite/http.ts',
      'src/polite/policy.ts',
      'src/polite/rate-limit.ts',
      'src/polite/robots.ts',
      'src/polite/user-agent.ts',
    ]);
  });
});

describe('CA-2.3 — cierre de imports: todo especificador es un literal permitido', () => {
  test('3. ningún fichero del escaneo importa nada fuera de la lista', async () => {
    expect(await offendersOf(SCANNED)).toEqual([]);
  });

  test('4. y la lista no lleva ningún cliente HTTP ni ninguna puerta de salida', () => {
    // La lista crece cuando llega una dependencia real, y eso es un diff que
    // un revisor lee. Este caso es lo que hace que crecer con una puerta de
    // salida NO sea silencioso.
    const doors = [
      'node:http',
      'node:https',
      'node:http2',
      'node:net',
      'node:tls',
      'node:dgram',
      'node:dns',
      'node:child_process',
      'undici',
      'axios',
      'got',
      'node-fetch',
      'superagent',
    ];

    for (const door of doors) expect(ALLOWED_PACKAGES).not.toContain(door);
    // `node:module` sí está, y con su motivo escrito: el hook de resolución de
    // las CLI. Es la única capacidad de resolución fuera de `src/polite/`.
    expect(ALLOWED_PACKAGES).toContain('node:module');
  });

  test('5. un especificador NO literal es rojo, también dentro de `src/polite/`', async () => {
    // Control positivo, y es la evasión F-SPEC-008-V7 escrita como caso. Las
    // dos formas: la honesta —una variable— y la que se coló entre los dos
    // detectores viejos, `'node:' + 'https'`, que empieza por comilla.
    const computed = syntheticFile(
      'src/polite/late-door.ts',
      [
        "const MOD = 'node:https';",
        'export async function open(url: string): Promise<void> {',
        '  const gate = await import(MOD);',
        "  const other = await import('node:' + 'https');",
        '  gate.request(url).end();',
        '  other.request(url).end();',
        '}',
      ].join('\n'),
    );

    const offences = await importOffences(computed);
    expect(offences).toHaveLength(2);
    for (const offence of offences) expect(offence).toContain('not a static literal');
  });

  test('6. y un paquete fuera de la lista es rojo aunque sea un literal', async () => {
    const undici = syntheticFile(
      'src/ingest/undici-door.ts',
      ["import { request } from 'undici';", 'export const ask = request;'].join('\n'),
    );

    expect(await importOffences(undici)).toEqual([
      'src/ingest/undici-door.ts: undici is not in ALLOWED_PACKAGES',
    ]);
  });

  test('7. y una ruta relativa que no resuelve dentro del repositorio también', async () => {
    const dangling = syntheticFile(
      'src/ingest/dangling.ts',
      "export { nothing } from './does-not-exist';",
    );

    expect(await importOffences(dangling)).toEqual([
      'src/ingest/dangling.ts: ./does-not-exist does not resolve inside the repository',
    ]);
  });
});

describe('CA-2.4 — la capacidad global no se toma prestada fuera de `src/polite/`', () => {
  test('8. fuera de `src/polite/` no aparece ninguna de las cuatro vías', () => {
    expect(OUTSIDE.flatMap(capabilityOffences)).toEqual([]);
  });

  test('9. y dentro de `src/polite/` aparece EXACTAMENTE una vez, en la puerta', () => {
    // Que el detector mida algo: `globalThis` existe en el árbol, y está donde
    // ADR-014 §4 dice que tiene que estar.
    expect(POLITE.flatMap(capabilityOffences)).toEqual([
      'src/polite/http.ts: globalThis',
      'src/polite/http.ts: bare `fetch`',
    ]);
  });

  test('10. control positivo: la cuarta evasión, la más natural de todas', () => {
    // F-SPEC-008-V6, escrita literalmente como la escribió el verificador. Con
    // el guardián viejo convivía con `npm test` en 705/705 y `lint exit=0`:
    // la llamada es `send(`, no hay `import`, y la cadena `user-agent` no se
    // escribe nunca entera. Aquí cae por lo único que no puede esconder — que
    // la capacidad se saca de `globalThis`.
    const sideDoor = syntheticFile(
      'src/ingest/side-door.ts',
      [
        'const { fetch: send } = globalThis;',
        "const KEY = ['User', 'Agent'].join('-');",
        '',
        'export async function ask(url: string, ua: string): Promise<number> {',
        '  const headers: Record<string, string> = {};',
        '  headers[KEY] = ua;',
        '  const res = await send(url, { headers });',
        '  return res.status;',
        '}',
      ].join('\n'),
    );

    expect(capabilityOffences(sideDoor)).toEqual(['src/ingest/side-door.ts: globalThis']);
  });

  test('11. y las otras tres vías del lenguaje llevan cada una su control', () => {
    const cases: readonly (readonly [string, string, string])[] = [
      ['bare `fetch`', 'const r = await fetch(url);', 'bare `fetch`'],
      ['eval', "const f = eval('(' + src + ')');", 'eval'],
      ['new Function', "const f = new Function('u', 'return u');", 'new Function'],
      ['require', "const https = require('node:https');", 'require'],
      ['XMLHttpRequest', 'const x = new XMLHttpRequest();', 'XMLHttpRequest'],
      ['WebSocket', "const s = new WebSocket('wss://x');", 'WebSocket'],
      ['EventSource', "const s = new EventSource('/x');", 'EventSource'],
      ['navigator', 'navigator.sendBeacon(url, body);', 'navigator'],
    ];

    for (const [name, line, expected] of cases) {
      const file = syntheticFile('src/site/probe.ts', line);
      expect(capabilityOffences(file), `${name} no se caza`).toContain(
        `src/site/probe.ts: ${expected}`,
      );
    }
  });

  test('12. y NO se caza la prosa ni el nombre de un módulo: el detector no es ruido', () => {
    // Sin esto el criterio se vuelve inservible y alguien lo afloja. Un
    // comentario que cita `globalThis.fetch` y un `import … from '@/polite/http'`
    // no son una capacidad tomada prestada.
    const innocent = syntheticFile(
      'src/site/innocent.ts',
      [
        '/** Nunca se llama a globalThis.fetch fuera de la puerta (ADR-014 §4). */',
        "import { politeFetch } from '@/polite/http';",
        "export const ask = (f: HttpFetcher) => politeFetch(f, 'https://x/', 'ua');",
      ].join('\n'),
    );

    expect(capabilityOffences(innocent)).toEqual([]);
  });
});

const reachable = await reachableModules(ENTRY_POINTS);

describe('CA-2.5 — nada huérfano en los tres destinos que el CA nombra', () => {
  test('13. todo `.ts`/`.tsx` de `src/ingest/`, `src/polite/` y `src/site/` se alcanza', () => {
    const contained = versionedSources().filter((path) =>
      CONTAINED_DIRS.some((dir) => path.startsWith(dir)),
    );

    expect(contained.length).toBeGreaterThan(15);
    expect(contained.filter((path) => !reachable.has(path))).toEqual([]);
  });

  test('14. y el recorrido ve las tres clases de arista, o no es un cierre', () => {
    // Hasta hoy `reachableModules` solo leía `import … from '…'`. Sin las
    // otras dos —y sin `.tsx`— el cierre no era un cierre: `src/site/` entero
    // habría quedado inalcanzable y el criterio habría pasado en verde
    // diciendo lo contrario de lo que quiere decir.
    // El de efecto lateral: `src/app/(gl)/layout.tsx` importa `globals.css`.
    expect(reachable).toContain('src/site/document.tsx');
    // El dinámico: las tres `*-cli.ts` importan su `main` así.
    expect(reachable).toContain('src/mirror/cli/capturar.ts');
    expect(reachable).toContain('src/mirror/cli/analizar.ts');
    expect(reachable).toContain('src/mirror/cli/analizar-sin-referencia.ts');
    // Y `.tsx`, que la resolución vieja leía y luego descartaba.
    expect(reachable).toContain('src/site/crawler-page.tsx');
    // Y lo que solo cuelga de `next.config.ts` (CA-2.6).
    expect(reachable).toContain('src/site/redirects.ts');
  });

  test('15. control positivo: un fichero nuevo en `src/ingest/` que nadie importa', async () => {
    // Es la tercera evasión viva de CA-2.7. Se comprueba sobre el mecanismo
    // real —el conjunto alcanzable— y no sobre un doble.
    const orphan = 'src/ingest/nobody-imports-me.ts';
    expect(reachable.has(orphan)).toBe(false);

    // Y el mecanismo no está apagado: lo que SÍ se importa, se alcanza.
    expect(reachable.has('src/ingest/ceroacero.ts')).toBe(true);
  });

  test('16. `ENTRY_POINTS` no envejece: nombra todas las rutas de `src/app/`', () => {
    // Una ruta nueva sin declarar es código que Next ejecuta y que CA-2.1 no
    // conduciría nunca. Que aparezca aquí es lo que lo impide.
    const routes = versionedSources().filter((path) => path.startsWith('src/app/'));

    expect(routes.length).toBeGreaterThan(0);
    for (const route of routes) expect(ENTRY_POINTS).toContain(route);
    for (const entry of ENTRY_POINTS) expect(versionedSources()).toContain(entry);
  });
});

describe('CA-2.7 — y no queda ninguna exención por nombre de fichero', () => {
  test('17. los dos ficheros que la tenían siguen intactos y ya no la necesitan', async () => {
    // `src/site/robots-txt.ts` (SPEC-004) GENERA el nuestro y
    // `src/mirror/analysis/referenceless/report.ts` (SPEC-003) CITA el de
    // futgal en una frase en castellano. Los dos escriben las palabras del
    // formato, ninguno manda un byte, y CA-2.8 dice que eso deja de ser una
    // infracción. Ninguno cambia: CA-3 lo prohíbe.
    const exempt = ['src/site/robots-txt.ts', 'src/mirror/analysis/referenceless/report.ts'];

    for (const path of exempt) {
      const file = SCANNED.find((entry) => entry.path === path);
      expect(file, `${path} ya no existe`).toBeDefined();
      expect(file!.code).toMatch(/\b(?:user-agent|disallow)\b/i);
      // Y aun escribiendo la palabra, no ofenden a ningún mecanismo vivo.
      expect(capabilityOffences(file!)).toEqual([]);
      expect(await importOffences(file!)).toEqual([]);
    }
  });

  test('18. ningún mecanismo de CA-2 mira el nombre de un fichero para perdonarlo', async () => {
    // F-SPEC-008-V9: el caso que vigilaba la LISTA de exenciones no vigilaba
    // el MECANISMO, y cambiarla por un patrón `startsWith('site/')` dejaba
    // 435/435 en verde. Con la lista fuera no hay nada que aflojar, y esto es
    // lo que impide que vuelva por la puerta de atrás.
    const guard = await readFile(new URL('./support/capability.ts', import.meta.url), 'utf8');
    const code = stripComments(guard);

    expect(code).not.toMatch(/\bROBOTS_PROSE\b/);
    expect(code).not.toMatch(/\bEXEMPT|\bexempt\b/);
    expect(code).not.toMatch(/file\.path\s*(?:===|\.startsWith|\.includes)/);
    expect(code).not.toMatch(/\.includes\(\s*file\.path\s*\)/);

    // Y la prueba de que el mecanismo se aplica a los dos ficheros de verdad:
    // pasan por los mismos detectores que todos los demás, sin atajo.
    for (const path of ['src/site/robots-txt.ts', 'src/mirror/analysis/referenceless/report.ts']) {
      expect(SCANNED.map((file) => file.path)).toContain(path);
    }
  });
});
