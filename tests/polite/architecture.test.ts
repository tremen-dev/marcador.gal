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
 *   CA-2.6  el escaneo cubre todo el código versionado fuera de `tests/`, y qué
 *           extensiones son código va DECLARADO junto a las raíces.
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
import { existsSync, lstatSync, mkdirSync, rmSync, rmdirSync, symlinkSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { describe, expect, test } from 'vitest';
import { freeReferences, readModule, reachableModules } from '../mirror/support/imports';
import { stripComments } from '../support/source-tree';
import {
  ALLOWED_GLOBALS,
  ALLOWED_PACKAGES,
  CONTAINED_DIRS,
  COURTESY_DIR,
  ENTRY_POINTS,
  SCAN_EXCLUSIONS,
  SCAN_EXTENSIONS,
  SCAN_ROOTS,
  capabilityOffences,
  importOffences,
  packageEntry,
  repositorySources,
  resolvesInsideRepository,
  scanRepository,
  scannedSources,
  syntheticFile,
  underScanRoots,
  versionedSources,
  walkRefusals,
} from './support/capability';
import type { GlobalEntry } from './support/capability';

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
  test('1. todo fichero de código versionado fuera de `tests/` cae bajo una raíz declarada', () => {
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

  test('2b. las exclusiones del escaneo son SUYAS, van declaradas y llevan motivo', () => {
    // Hasta la cuarta vuelta esta lista no existía, porque las exclusiones eran
    // las de `.gitignore` — un fichero escrito para otra cosa. La segunda llega
    // con `.js` declarado (F-SPEC-008-V37) y trae su motivo, como manda CA-2.6.2.
    // Desde SPEC-009 CA-2 la cobertura recorre el árbol ENTERO del repositorio,
    // así que quedar fuera de él también es una decisión declarada: las seis
    // entradas nuevas son exactamente eso. Si algún día un motivo es «ahí hay
    // ficheros que molestan», la frontera está mal trazada.
    expect(SCAN_EXCLUSIONS.map((exclusion) => exclusion.path)).toEqual([
      'node_modules/',
      'docs/diseno/',
      'tests/',
      '.git/',
      '.next/',
      '.claude/',
      'raw/',
      'next-env.d.ts',
    ]);
    for (const exclusion of SCAN_EXCLUSIONS) {
      expect(exclusion.motive, `${exclusion.path} sin motivo`).toBeTruthy();
    }
  });

  test('2j. la cobertura sale del ÁRBOL DE FICHEROS, no de `git` (SPEC-009 CA-2)', () => {
    // F-SPEC-008-V35: bajo las raíces la LECTURA ya no heredaba `.gitignore`,
    // pero la COBERTURA —el caso que hace que quedar fuera sea una decisión
    // declarada— seguía saliendo de `git ls-files --exclude-standard`, y `git`
    // no ve lo que `.gitignore` esconde. Un `robots/side.ts` en la raíz del
    // repositorio dejaba `lint exit=0`, `npm test` 772/772 y `tests/polite`
    // 86/86 sin aparecer en `git status`. Aquí la pregunta se le hace al árbol
    // de ficheros, que es de lo que ninguna otra regla decide.
    const uncovered = repositorySources().filter((path) => !underScanRoots(path));
    expect(uncovered).toEqual([]);

    // Y el paseo mide algo fuera de las raíces: sin la exclusión declarada de
    // `docs/diseno/`, encuentra los ficheros reales del sistema de diseño —
    // exactamente los que `git` también echa de menos en 2h.
    const withoutDesign = SCAN_EXCLUSIONS.filter((exclusion) => exclusion.path !== 'docs/diseno/');
    const uncoveredThen = repositorySources(SCAN_EXTENSIONS, withoutDesign).filter(
      (path) => !underScanRoots(path),
    );
    expect(uncoveredThen).toContain('docs/diseno/_logic.js');
    expect(uncoveredThen).toContain('docs/diseno/build.mjs');

    // Dentro de las raíces, el árbol y la lectura son LA MISMA lista: la
    // cobertura no puede quedarse más corta que lo que se lee.
    const scanned = scannedSources();
    const underRoots = repositorySources().filter(underScanRoots);
    expect(underRoots).toEqual(scanned);
  });

  test('2k. control positivo (F-SPEC-008-V35): lo que `.gitignore` esconde fuera de las raíces ES ROJO', async () => {
    // Reproducción exacta del tercer hueco. `.gitignore:17` (`**/robots/*`)
    // esconde el contenido del directorio `robots/` de la raíz —regla legítima
    // y ajena: los `robots.txt` de terceros quedan fuera del repositorio por
    // ADR-009 §3, y NO SE TOCA—. `git` no lo lista, así que el caso 1 no lo
    // puede echar de menos; `resolvesInsideRepository` acepta la ruta relativa
    // desde `src/ingest/adapter.ts`, así que el importador NO ofende. La única
    // red es la cobertura del árbol (2j), y esto comprueba que la tiene.
    //
    // Nombre propio de este caso, y NO el `side.ts` de la medición, por lo
    // mismo que 2d y 2g: el verificador repite la mutación con ese nombre, y
    // un control que la pisara la borraría al limpiar.
    const path = 'robots/side-control.ts';
    const source = [
      "import { fromURL } from 'cheerio';",
      'export const ask = async (url: string) => await fromURL(url);',
    ].join('\n');

    expect(existsSync(path), `${path} ya existe: este caso no lo pisa`).toBe(false);
    try {
      writeFileSync(path, `${source}\n`, 'utf8');

      // Las tres mitades de la reproducción: `git` NO lo ve…
      expect(versionedSources()).not.toContain(path);
      // …el importador no ofendería —la ruta resuelve dentro del repositorio—…
      expect(await resolvesInsideRepository('../../robots/side-control', 'src/ingest/adapter.ts')).toBe(
        true,
      );
      // …y el árbol SÍ lo ve, fuera de toda raíz y de toda exclusión: rojo,
      // nombrándose, por el mismo juicio que aplica 2j.
      expect(repositorySources()).toContain(path);
      expect(repositorySources().filter((entry) => !underScanRoots(entry))).toContain(path);
    } finally {
      rmSync(path, { force: true });
    }

    expect(existsSync(path)).toBe(false);
    expect(repositorySources().filter((entry) => !underScanRoots(entry))).not.toContain(path);
  });

  test('2l. un symlink NO queda fuera en silencio: el paseo lo REFUSA, nombrándose (F-SPEC-009-V1)', () => {
    // F-SPEC-009-V1, la duodécima evasión en su primera forma. Un dirent de
    // symlink no es `isFile()` ni `isDirectory()`, y el paseo lo saltaba EN
    // SILENCIO — sin raíz, sin exclusión y sin motivo: un accidente de
    // `readdirSync(withFileTypes)`, «una regla escrita para otra cosa» ni
    // siquiera. Medido dos veces (2026-09-02): un `robots/evil-link.ts` en la
    // raíz y un `src/ingest/robots/evil.ts` BAJO UNA RAÍZ, importado desde
    // `adapter.ts`, dejaron `lint exit=0` y `npm test` 800/800 con
    // `cheerio.fromURL` dentro y sin que NADIE juzgara el fichero. Hoy el paseo
    // decide de forma DECLARADA: refusa el symlink, nombrándose, y la única
    // salida es una exclusión declarada con su motivo.
    const SYMLINK = 'a symbolic link, which the walk refuses by construction (F-SPEC-009-V1)';

    // Hoy el árbol está limpio: nada que el paseo no sepa clasificar.
    expect(walkRefusals()).toEqual([]);

    // Control positivo, con nombre propio (el verificador repite S1/S2 con
    // `evil-link.ts`/`evil.ts`, y este caso no los pisa): las dos formas
    // medidas. `existsSync` SIGUE el enlace y mentiría sobre uno colgante, así
    // que se pregunta con `lstatSync`.
    const filePath = 'robots/refusal-control.ts';
    const treePath = 'src/ingest/refusal-control-tree';
    const present = (path: string): boolean => {
      try {
        lstatSync(path);
        return true;
      } catch {
        return false;
      }
    };
    expect(present(filePath), `${filePath} ya existe: este caso no lo pisa`).toBe(false);
    expect(present(treePath), `${treePath} ya existe: este caso no lo pisa`).toBe(false);
    try {
      // Colgantes a propósito: refusar no es seguir, y el destino da igual —
      // también da igual para el paseo, que no hace `stat` de lo que refusa.
      symlinkSync('outside-the-repository.ts', filePath);
      symlinkSync('outside-the-repository-tree', treePath);

      const refusals = walkRefusals();
      expect(refusals).toContain(`${filePath}: ${SYMLINK}`);
      expect(refusals).toContain(`${treePath}: ${SYMLINK}`);

      // Y refusar NO es leer: ninguno entra en la lista de ficheros de nadie.
      expect(repositorySources()).not.toContain(filePath);
      expect(scannedSources()).not.toContain(treePath);
    } finally {
      rmSync(filePath, { force: true });
      rmSync(treePath, { force: true });
    }
    expect(present(filePath)).toBe(false);
    expect(present(treePath)).toBe(false);
    expect(walkRefusals()).toEqual([]);
  });

  test('2c. la lista de lo que se LEE no la decide `git`: es la más ancha de las dos', () => {
    // Dos listas distintas y a propósito. `git` sigue siendo autoridad de lo
    // que está versionado (caso 1); de lo que se AUDITA, no.
    const scanned = new Set(scannedSources());
    const versionedUnderRoots = versionedSources().filter(underScanRoots);

    expect(versionedUnderRoots.length).toBeGreaterThan(40);
    expect(versionedUnderRoots.filter((path) => !scanned.has(path))).toEqual([]);
  });

  test('2d. control positivo (F-SPEC-008-V28): un fichero que `.gitignore` esconde SE LEE Y SE JUZGA', async () => {
    // Reproducción exacta. `.gitignore:17` esconde todo lo que cuelga de un
    // directorio `robots/` —regla legítima, protege los `robots.txt` de
    // terceros que ADR-009 §3 mantiene fuera del repositorio, y NO SE TOCA—.
    // Con la lista de ficheros heredada de `git ls-files --exclude-standard`,
    // un `src/ingest/robots/side.ts` con un `cheerio.fromURL` sin restricción
    // dejaba `tests/polite` en 76/76: no aparecía en `git status`, no se leía,
    // y no se juzgaba.
    const directory = 'src/ingest/robots';
    // Nombre propio de este caso, y NO el `side.ts` de la medición: un caso que
    // borra un fichero que no ha escrito borraría la mutación del verificador
    // —comprobado: pasaba— y se pondría verde por el motivo equivocado.
    const path = `${directory}/hidden-control.ts`;
    const hidden = [
      "import { fromURL } from 'cheerio';",
      'export const ask = async (url: string) => await fromURL(url);',
    ].join('\n');

    // El directorio no existe hoy, y si algún día existiera no se borra: solo
    // se retira el fichero que este caso escribe, y solo si lo escribió él.
    expect(existsSync(path), `${path} ya existe: este caso no lo pisa`).toBe(false);
    const directoryExisted = existsSync(directory);
    mkdirSync(directory, { recursive: true });
    try {
      writeFileSync(path, `${hidden}\n`, 'utf8');

      // La mitad que hace de esto la reproducción y no una comprobación
      // cualquiera: `git` NO lo ve, y el escaneo SÍ.
      expect(versionedSources()).not.toContain(path);
      expect(scannedSources()).toContain(path);

      const scanned = await scanRepository();
      const file = scanned.find((entry) => entry.path === path);
      expect(file, 'el escaneo no leyó el fichero escondido').toBeDefined();
      expect(await importOffences(file!)).toEqual([
        'src/ingest/robots/hidden-control.ts: cheerio does not declare `fromURL` in its surface',
      ]);
    } finally {
      rmSync(path, { force: true });
      if (!directoryExisted) rmSync(directory, { force: true, recursive: true });
    }

    expect(existsSync(path)).toBe(false);
  });

  test('2e. las extensiones que se leen van DECLARADAS junto a las raíces, y llevan motivo', () => {
    // La cuarta lista escrita dentro de una función, y la que faltaba. Las
    // raíces, las exclusiones y las entradas de paquete ya estaban declaradas;
    // ésta vivía en un `endsWith` dentro de `scannedSources()` y en un pathspec
    // de `git` dentro de `versionedSources()` (F-SPEC-008-V33).
    expect(SCAN_EXTENSIONS.map((extension) => extension.suffix)).toEqual([
      '.ts',
      '.tsx',
      '.mts',
      '.cts',
      '.js',
      '.jsx',
      '.mjs',
      '.cjs',
    ]);
    for (const extension of SCAN_EXTENSIONS) {
      expect(extension.motive, `${extension.suffix} sin motivo`).toBeTruthy();
      // Es un sufijo de nombre de fichero, no un patrón: si algún día lleva un
      // `*`, la lista dejó de ser una lista de extensiones.
      expect(extension.suffix.startsWith('.')).toBe(true);
      expect(extension.suffix).not.toContain('*');
    }
  });

  test('2f. la cobertura pregunta por la MISMA declaración, no por una segunda', () => {
    // Dos listas de extensiones son dos oportunidades de que una se quede
    // corta, y es literalmente lo que pasó. Se comprueba haciéndolas mover
    // JUNTAS: con una declaración recortada, la lista que se LEE y la lista de
    // COBERTURA se recortan las dos. Si `versionedSources()` volviera a
    // escribir su pathspec a mano, este caso se pone rojo.
    const onlyTsx = [{ suffix: '.tsx', motive: 'sólo para este caso' }];

    const scanned = scannedSources(onlyTsx);
    const versioned = versionedSources(onlyTsx);

    expect(scanned.length).toBeGreaterThan(0);
    expect(versioned.length).toBeGreaterThan(0);
    expect(scanned.filter((path) => !path.endsWith('.tsx'))).toEqual([]);
    expect(versioned.filter((path) => !path.endsWith('.tsx'))).toEqual([]);

    // Y con la declaración entera vuelven a ser las dos más anchas, así que el
    // recorte de arriba mide algo y no es una lista vacía disfrazada.
    expect(scannedSources().length).toBeGreaterThan(scanned.length);
    expect(versionedSources().length).toBeGreaterThan(versioned.length);
  });

  test('2g. control positivo (F-SPEC-008-V33): un `.mts` bajo una raíz se lee, se juzga y es ROJO', async () => {
    // Reproducción exacta de la décima evasión. `scannedSources()` filtraba con
    // `endsWith('.ts') || endsWith('.tsx')` y `versionedSources()` le pasaba a
    // `git` el pathspec `'*.ts', '*.tsx'`: ninguna de las dos casaba con
    // `.mts`, así que el fichero no se leía Y la cobertura tampoco lo echaba de
    // menos. Con `node:child_process` dentro dejaba `lint exit=0`, `npm test`
    // 772/772 y `tests/polite` 86/86 — y, a diferencia de F-SPEC-008-V28, SE
    // COMMITEA CON UN `git add` NORMAL: llega a producción.
    // Nombre propio de este caso, y NO el `door.mts` de la medición, por lo
    // mismo que 2d no usa `side.ts`: el verificador repite la mutación con ese
    // nombre, y un caso que se niega a pisar un fichero que ya existe se
    // pondría rojo por la guarda y no por la detección. Con nombre propio, la
    // mutación y el control conviven y el rojo lo da el caso 3.
    const path = 'src/ingest/extension-control.mts';
    const twin = 'src/ingest/extension-control.ts';
    const outside = 'extension-control-outside-the-roots.mts';
    const source = [
      "import { execFileSync } from 'node:child_process';",
      '',
      'export function preflight(url: string): string {',
      "  return execFileSync('curl', ['-s', '-A', '', url], { encoding: 'utf8' });",
      '}',
    ].join('\n');

    expect(existsSync(path), `${path} ya existe: este caso no lo pisa`).toBe(false);
    expect(existsSync(outside), `${outside} ya existe: este caso no lo pisa`).toBe(false);
    try {
      writeFileSync(path, `${source}\n`, 'utf8');

      // La mitad de la LECTURA: el escaneo lo ve, y lo juzga con el mismo
      // mensaje que su gemelo `.ts`. Una letra en el nombre del fichero
      // separaba verde de rojo.
      expect(scannedSources()).toContain(path);
      const scanned = await scanRepository();
      const file = scanned.find((entry) => entry.path === path);
      expect(file, 'el escaneo no leyó el `.mts`').toBeDefined();
      const offences = await importOffences(file!);
      expect(offences).toEqual([`${path}: node:child_process is not a declared package entry`]);

      // «Rojo POR EL MISMO CASO»: el gemelo renombrado a `.ts` da la misma
      // ofensa, del mismo detector, salvo el nombre del fichero.
      const twinOffences = await importOffences(syntheticFile(twin, source));
      expect(twinOffences).toEqual([`${twin}: node:child_process is not a declared package entry`]);
      expect(offences.map((offence) => offence.replace(path, ''))).toEqual(
        twinOffences.map((offence) => offence.replace(twin, '')),
      );

      // La mitad de la COBERTURA: `git` lo lista —el pathspec sale de la misma
      // declaración—, así que el caso 1 sí lo echaría de menos si estuviera
      // fuera de las raíces. Y no es hipotético: se escribe uno fuera.
      expect(versionedSources()).toContain(path);
      expect(underScanRoots(path)).toBe(true);

      writeFileSync(outside, `${source}\n`, 'utf8');
      expect(versionedSources()).toContain(outside);
      expect(versionedSources().filter((entry) => !underScanRoots(entry))).toContain(outside);
    } finally {
      rmSync(path, { force: true });
      rmSync(outside, { force: true });
    }

    expect(existsSync(path)).toBe(false);
    expect(existsSync(outside)).toBe(false);
    // Y sin la mutación, la cobertura deja de echarlo de menos. Se comprueba
    // por este fichero y no sobre el conjunto entero, para no ponerse rojo por
    // la mutación de otro (el caso 1 es el que juzga el conjunto).
    expect(versionedSources().filter((entry) => !underScanRoots(entry))).not.toContain(outside);
  });

  test('2h. `docs/diseno/` es una exclusión DECLARADA, y sin ella la cobertura la echaría de menos', () => {
    // La otra mitad de F-SPEC-008-V37, y la que destapó la mutación X5 del
    // verificador: en cuanto `.js` y `.mjs` son código, `git` empieza a listar
    // las fuentes del sistema de diseño de EPIC-004. No son código de la
    // aplicación —`_logic.js` ni siquiera es un módulo autónomo: es el bloque
    // que `build.mjs` inyecta en los artboards— y por eso mismo
    // `.oxlintrc.json` ya las ignora desde el 2026-09-01 (commit 5b632df, «el
    // gate de calidad ignora docs/diseno, que no es codigo»).
    //
    // Quedar fuera tiene que ser UNA DECISIÓN DECLARADA y no un efecto
    // colateral — que es literalmente lo que dice CA-2.6 —, así que va como
    // exclusión con su motivo y no como silencio.
    const design = SCAN_EXCLUSIONS.find((exclusion) => exclusion.path === 'docs/diseno/');
    expect(design, '`docs/diseno/` no está declarada como exclusión').toBeDefined();
    expect(design?.motive).toBeTruthy();

    // Y la exclusión SOSTIENE ALGO: sin ella, la cobertura del caso 1 se pone
    // roja con ficheros reales que existen hoy en el repositorio.
    const withoutDesign = SCAN_EXCLUSIONS.filter((exclusion) => exclusion.path !== 'docs/diseno/');
    const uncovered = versionedSources(SCAN_EXTENSIONS, withoutDesign).filter(
      (path) => !underScanRoots(path),
    );

    // Por estos dos ficheros y no sobre el conjunto entero, por lo mismo que
    // 2g: el conjunto lo juzga el caso 1, y este caso no tiene por qué ponerse
    // rojo por la mutación de otro.
    expect(uncovered).toContain('docs/diseno/_logic.js');
    expect(uncovered).toContain('docs/diseno/build.mjs');
    expect(existsSync('docs/diseno/_logic.js')).toBe(true);
    expect(existsSync('docs/diseno/build.mjs')).toBe(true);

    // Con ella, la cobertura no los ve — y es lo único que la exclusión hace:
    // no se lee nada de ahí porque `docs/` no cuelga de ninguna raíz.
    expect(versionedSources()).not.toContain('docs/diseno/_logic.js');
    expect(versionedSources()).not.toContain('docs/diseno/build.mjs');
    expect(scannedSources().filter((path) => path.startsWith('docs/'))).toEqual([]);
  });

  test('2i. control positivo (F-SPEC-008-V37): un `.js` bajo una raíz se lee, se juzga y es ROJO', async () => {
    // Reproducción exacta de la undécima evasión, y es PEOR que la del `.mts`
    // en la dimensión que decidió su destino: aquélla era un huérfano, ésta es
    // un ENDPOINT HTTP VIVO. `src/app/(gl)/vprobe/route.js` con
    // `node:child_process` lo compila `next build` (`ƒ /vprobe` en la tabla de
    // rutas de producción), lo sirve `next start`, deja `lint exit=0`,
    // `npm test` 775/775, `tests/polite` 89/89 y `test:db` 144/144, y se
    // commitea con un `git add` NORMAL. Ninguna de las dos listas lo veía,
    // porque `SCAN_EXTENSIONS` se paró en la familia de TypeScript y `.js`,
    // `.jsx`, `.mjs` y `.cjs` quedaban fuera POR EFECTO COLATERAL Y NO POR
    // DECISIÓN DECLARADA — que es lo que CA-2.6 garantiza que no pasa.
    //
    // Nombre propio, como 2d y 2g: el verificador repite la mutación con
    // `vprobe`/`vdoor`, y un control que pisara ese nombre borraría su mutación.
    const directory = 'src/app/(gl)/js-control';
    const route = `${directory}/route.js`;
    const twin = `${directory}/route.ts`;
    const module_ = 'src/ingest/extension-control-js.mjs';
    const outside = 'extension-control-outside-the-roots.js';
    const source = [
      "import { execFileSync } from 'node:child_process';",
      '',
      'export function GET() {',
      "  return new Response(execFileSync('echo', ['js-control'], { encoding: 'utf8' }));",
      '}',
    ].join('\n');

    expect(existsSync(route), `${route} ya existe: este caso no lo pisa`).toBe(false);
    expect(existsSync(module_), `${module_} ya existe: este caso no lo pisa`).toBe(false);
    expect(existsSync(outside), `${outside} ya existe: este caso no lo pisa`).toBe(false);
    const directoryExisted = existsSync(directory);
    mkdirSync(directory, { recursive: true });
    try {
      writeFileSync(route, `${source}\n`, 'utf8');
      writeFileSync(module_, `${source}\n`, 'utf8');

      // LA LECTURA: el escaneo los ve, los lee y los juzga.
      expect(scannedSources()).toContain(route);
      expect(scannedSources()).toContain(module_);

      const scanned = await scanRepository();
      for (const path of [route, module_]) {
        const file = scanned.find((entry) => entry.path === path);
        expect(file, `el escaneo no leyó ${path}`).toBeDefined();
        expect(file!.reading.unparseable, `${path} no se pudo parsear`).toBe(false);
        expect(await importOffences(file!)).toEqual([
          `${path}: node:child_process is not a declared package entry`,
        ]);
      }

      // «Rojo POR EL MISMO CASO»: el gemelo renombrado a `.ts` da la misma
      // ofensa, del mismo detector, salvo el nombre del fichero. Una letra en
      // el nombre separaba un endpoint auditado de uno que nadie mira.
      const routeOffences = await importOffences(
        (await scanRepository()).find((entry) => entry.path === route)!,
      );
      const twinOffences = await importOffences(syntheticFile(twin, source));
      expect(twinOffences).toEqual([`${twin}: node:child_process is not a declared package entry`]);
      expect(routeOffences.map((offence) => offence.replace(route, ''))).toEqual(
        twinOffences.map((offence) => offence.replace(twin, '')),
      );

      // LA COBERTURA: `git` los lista —el pathspec sale de la misma
      // declaración—, así que el caso 1 los echaría de menos si estuvieran
      // fuera de las raíces. Y no es hipotético: se escribe uno fuera.
      expect(versionedSources()).toContain(route);
      expect(versionedSources()).toContain(module_);
      expect(underScanRoots(route)).toBe(true);

      writeFileSync(outside, `${source}\n`, 'utf8');
      expect(versionedSources().filter((entry) => !underScanRoots(entry))).toContain(outside);
    } finally {
      rmSync(route, { force: true });
      rmSync(module_, { force: true });
      rmSync(outside, { force: true });
      // Se borra EL FICHERO, no el árbol: `rmdirSync` no recursivo se niega a
      // llevarse por delante nada que no haya escrito este caso.
      if (!directoryExisted && existsSync(directory)) rmdirSync(directory);
    }

    expect(existsSync(route)).toBe(false);
    expect(existsSync(module_)).toBe(false);
    expect(existsSync(outside)).toBe(false);
    expect(versionedSources().filter((entry) => !underScanRoots(entry))).not.toContain(outside);
  });
});

describe('CA-2.3 — no se concede un paquete, se concede una superficie', () => {
  test('3. ningún fichero del escaneo cruza un nombre fuera de su superficie', async () => {
    expect(await offendersOf(SCANNED)).toEqual([]);
  });

  test('3b. NADA SE PIERDE EN SILENCIO, y lo dice el compilador y no nosotros', () => {
    // La obligación 2 del lector, sobre el árbol REAL. Para cada fichero del
    // escaneo, lo que el lector enumeró cubre la lista de módulos que el propio
    // compilador registra para ese fichero — como multiconjunto, para que «se
    // ve el primero y se pierde el segundo» también sea rojo (F-SPEC-008-V27,
    // caso B de la medición).
    const lost: string[] = [];

    for (const file of SCANNED) {
      const enumerated = new Map<string, number>();
      for (const specifier of file.specifiers) {
        if (specifier.text === null) continue;
        enumerated.set(specifier.text, (enumerated.get(specifier.text) ?? 0) + 1);
      }
      const counted = new Map<string, number>();
      for (const named of file.reading.compilerModules) {
        const seen = (counted.get(named) ?? 0) + 1;
        counted.set(named, seen);
        if ((enumerated.get(named) ?? 0) < seen) lost.push(`${file.path}: ${named}`);
      }
    }

    expect(lost).toEqual([]);
    // Y que la comprobación mida algo: el compilador nombra módulos de verdad.
    expect(SCANNED.flatMap((file) => [...file.reading.compilerModules]).length).toBeGreaterThan(100);
  });

  test('3c. un fichero que el compilador NO PUEDE PARSEAR es rojo, nombrándose', async () => {
    // Hoy una cláusula que el lector no ve NO EXISTE, decía el veredicto de la
    // cuarta vuelta, «que es lo contrario» de fallar cerrado. Aquí lo contrario
    // de lo contrario: lo que no se puede leer es rojo.
    const broken = syntheticFile(
      'src/ingest/broken.ts',
      ['export const half = (((;;;', "import { load } from 'cheerio';"].join('\n'),
    );

    expect(broken.reading.unparseable).toBe(true);
    expect(await importOffences(broken)).toEqual([
      'src/ingest/broken.ts: the compiler cannot parse this file',
    ]);
    expect(capabilityOffences(broken)).toEqual([
      'src/ingest/broken.ts: the compiler cannot parse this file',
    ]);
  });

  test('3d. un nodo que nombra un módulo en una forma NO CLASIFICADA es rojo', async () => {
    // `import x = require('…')` nombra un módulo por una tercera vía que este
    // lector no clasifica. No hace falta que nadie la haya previsto: el
    // compilador la registra, el lector no la enumeró, y la comparación del
    // caso 3b es lo que la caza. Ésa es la diferencia entre fallar cerrado y
    // callar.
    const equals = syntheticFile(
      'src/ingest/import-equals.ts',
      ["import undici = require('undici');", 'export const ask = undici;'].join('\n'),
    );

    expect(equals.reading.compilerModules).toContain('undici');
    expect(equals.reading.specifiers).toEqual([]);
    expect(await importOffences(equals)).toEqual([
      'src/ingest/import-equals.ts: the compiler names undici and the reader did not enumerate it',
    ]);
  });

  test('3e. LA POSICIÓN EN LA LÍNEA no cambia el veredicto (F-SPEC-008-V27)', async () => {
    // La novena evasión, en sus tres escrituras. Con el lector de expresiones
    // regulares la primera era ROJA y las otras dos VERDES —`lint exit=0`,
    // `npm test` 762/762, `tests/polite` 76/76— con `node:child_process`, que
    // no es entrada de la lista, mandando una petición de verdad sin
    // User-Agent, sin `robots.txt` y sin turno. DOCE CARACTERES SEPARABAN
    // VERDE DE ROJO.
    const body = [
      'export function preflight(url: string): string {',
      "  return execFileSync('curl', ['-s', url], { encoding: 'utf8' });",
      '}',
    ];
    const writings: readonly (readonly [string, string])[] = [
      ['al principio de la línea', "import { execFileSync } from 'node:child_process';"],
      [
        'detrás de otra sentencia',
        "const noop = 0; import { execFileSync } from 'node:child_process'; export const n = noop;",
      ],
      [
        'como segundo `import` de la línea',
        "import { load } from 'cheerio'; import { execFileSync } from 'node:child_process'; export const l = load;",
      ],
    ];

    for (const [label, head] of writings) {
      const file = syntheticFile(`src/db/preflight9.ts`, [head, ...body].join('\n'));

      expect(await importOffences(file), `${label}`).toContain(
        'src/db/preflight9.ts: node:child_process is not a declared package entry',
      );
    }
  });

  test('3f. y los controles sintéticos NO ESCRIBEN EN DISCO', () => {
    // Sonda H de la enmienda: `fs` virtual y `openFiles`. Un control que
    // falla no puede dejar una mutación detrás, y el escaneo del caso 3 no
    // puede verse contaminado por lo que juzgan los controles.
    const file = syntheticFile('src/ingest/never-written.ts', "export const nothing = 0;\n");

    // Las rutas de este caso son solo de controles sintéticos: ninguna es un
    // sitio donde un verificador vaya a poner una mutación, para que romper
    // otra cosa no ponga rojo a éste por el lado equivocado.
    expect(file.reading.unparseable).toBe(false);
    for (const path of [
      'src/ingest/never-written.ts',
      'src/ingest/inverted.ts',
      'src/ingest/computed.ts',
      'src/ingest/escape.ts',
      'src/polite/late-door.ts',
      'src/ingest/door11.ts',
      'src/ingest/env-user.ts',
      'src/ingest/inverted11.ts',
      'src/ingest/ambient.ts',
      'src/ingest/augmented.ts',
      'src/ingest/shorthand.ts',
      'src/ingest/declared.ts',
    ]) {
      expect(existsSync(path), `${path}`).toBe(false);
    }
  });

  test('3g. UN SOLO LECTOR: los tres consumidores de CA-2 preguntan al mismo', () => {
    // Obligación 1 de CA-2.3. Un caso que necesite saber qué importa un
    // fichero y se escriba su propio patrón es el mecanismo volviendo por la
    // puerta de atrás: le pasó al control del orden de CA-2.1, que anclaba su
    // expresión regular igual que el lector viejo (F-SPEC-008-V27, segunda
    // mitad). Comprobado CON EL PROPIO LECTOR, que es la única forma coherente.
    const consumers = [
      'tests/polite/support/capability.ts',
      'tests/polite/architecture.test.ts',
      'tests/polite/containment.test.ts',
    ];

    for (const consumer of consumers) {
      const reading = readModule(consumer);
      expect(reading.unparseable, `${consumer}`).toBe(false);
      const names = reading.specifiers
        .filter((specifier) => specifier.text?.endsWith('mirror/support/imports') === true)
        .flatMap((specifier) => specifier.bindings.map((binding) => binding.name));
      expect(names, `${consumer} no usa el lector`).toContain('readModule');
    }
  });

  test('4. la lista es cerrada EN SUS DOS EJES, y no esconde una lista negra', () => {
    // La obligación vieja —«que ninguna entrada sea una puerta de salida»— se
    // mecanizaba con TRECE NOMBRES PROHIBIDOS, y `cheerio` entró porque nadie
    // sabía que lo era (F-SPEC-008-V15). Había quedado una lista negra viva
    // dentro del criterio que vino a sustituirlas. Aquí ya no hay ninguna: la
    // pertenencia se decide contra lo que la entrada DECLARA, y este caso es
    // lo que impide que la lista negra vuelva por la puerta de atrás.
    const guard = ALLOWED_PACKAGES;

    // Eje 1: qué entradas hay. Cada una es un especificador literal, una vez.
    const specifiers = guard.map((entry) => entry.specifier);
    expect(new Set(specifiers).size).toBe(specifiers.length);
    expect([...specifiers].sort()).toEqual(specifiers);

    // Eje 2: qué nombres concede cada una. Nada de comodines, y una superficie
    // VACÍA es legítima y explícita — hoy `next` y `react`.
    for (const entry of guard) {
      expect(Array.isArray(entry.surface), `${entry.specifier}`).toBe(true);
      expect(entry.surface, `${entry.specifier}`).not.toContain('*');
      expect(new Set(entry.surface).size, `${entry.specifier}`).toBe(entry.surface.length);
    }
    expect(packageEntry('next')?.surface).toEqual([]);
    expect(packageEntry('react')?.surface).toEqual([]);

    // Y las entradas que no se explican solas llegan con su motivo escrito
    // junto a la lista (obligación 3).
    expect(packageEntry('node:module')?.motive).toBeTruthy();
    expect(packageEntry('vitest/config')?.motive).toBeTruthy();

    // El lector se paga con una entrada, como cualquier otra cosa. El
    // especificador se juzga TAL COMO ESTÁ ESCRITO, así que las entradas son
    // los dos subcaminos que el lector escribe —en `typescript@7` el API
    // clásico no existe: la raíz exporta solo `version` y `versionMajorMinor`—
    // y las dos caen entre `react` y `vitest/config`.
    const reader = specifiers.filter((specifier) => specifier.startsWith('typescript/'));
    expect(reader).toEqual(['typescript/unstable/ast', 'typescript/unstable/sync']);
    expect(specifiers.indexOf('react')).toBeLessThan(specifiers.indexOf(reader[0]!));
    expect(specifiers.indexOf(reader[1]!)).toBeLessThan(specifiers.indexOf('vitest/config'));
    for (const specifier of reader) expect(packageEntry(specifier)?.motive).toBeTruthy();
    // Y su superficie es la que el lector toma y ni un nombre más: ninguno de
    // esos nombres le pide bytes a un tercero, que es lo único que habría
    // exigido una firma humana.
    expect(packageEntry('typescript/unstable/sync')?.surface).toEqual(['API']);
  });

  test('4b. `fromURL` es rojo SIN QUE NADIE LO NOMBRE, y `load` no', async () => {
    // La octava evasión, escrita como control: entró por la puerta principal
    // porque `cheerio` estaba concedido entero. Con la concesión al grano de
    // la capacidad, la pregunta «¿es este paquete una puerta?» desaparece.
    const named = syntheticFile(
      'src/ingest/preflight.ts',
      [
        "import { fromURL } from 'cheerio';",
        'export async function preflight(url: string): Promise<number> {',
        '  const $ = await fromURL(url);',
        "  return $('tr').length;",
        '}',
      ].join('\n'),
    );

    expect(await importOffences(named)).toEqual([
      'src/ingest/preflight.ts: cheerio does not declare `fromURL` in its surface',
    ]);

    // Y por el espacio de nombres, que es como el árbol importa `cheerio` de
    // verdad: cada `ns.x` tiene que estar declarado.
    const namespaced = syntheticFile(
      'src/ingest/preflight-ns.ts',
      [
        "import * as cheerio from 'cheerio';",
        'export const read = async (url: string) => await cheerio.fromURL(url);',
      ].join('\n'),
    );

    expect(await importOffences(namespaced)).toEqual([
      'src/ingest/preflight-ns.ts: cheerio does not declare `fromURL` in its surface',
    ]);

    // El control de que el mecanismo no está apagado: `load` sí está.
    const allowed = syntheticFile(
      'src/ingest/reader.ts',
      [
        "import * as cheerio from 'cheerio';",
        'export const rows = (html: string) => cheerio.load(html)(\'tr\').length;',
      ].join('\n'),
    );

    expect(await importOffences(allowed)).toEqual([]);
  });

  test('4c. y el juicio sale SOLO de lo declarado: no hay nombres benditos ni malditos', async () => {
    // Con una lista sintética, `fromURL` pasa y `load` no. Si quedara un
    // nombre cableado en el guardián —una lista negra, o una lista blanca de
    // «nombres seguros»— este caso lo destapa.
    const inverted = [{ specifier: 'cheerio', surface: ['fromURL'] }];
    const file = syntheticFile(
      'src/ingest/inverted.ts',
      ["import { fromURL, load } from 'cheerio';", 'export const both = [fromURL, load];'].join('\n'),
    );

    expect(await importOffences(file, inverted)).toEqual([
      'src/ingest/inverted.ts: cheerio does not declare `load` in its surface',
    ]);
  });

  test('4d. un alias no ensancha una superficie: cuenta el nombre original', async () => {
    const aliased = syntheticFile(
      'src/ingest/aliased.ts',
      ["import { fromURL as read } from 'cheerio';", 'export const ask = read;'].join('\n'),
    );

    expect(await importOffences(aliased)).toEqual([
      'src/ingest/aliased.ts: cheerio does not declare `fromURL` in its surface',
    ]);
  });

  test('4e. un acceso computado sobre un espacio de nombres es rojo por construcción', async () => {
    const computed = syntheticFile(
      'src/ingest/computed.ts',
      [
        "import * as cheerio from 'cheerio';",
        'export const ask = (url: string) => cheerio[\'from\' + \'URL\'](url);',
      ].join('\n'),
    );

    const offences = await importOffences(computed);
    expect(offences).toContain(
      'src/ingest/computed.ts: computed access on the namespace `cheerio` of cheerio',
    );
  });

  test('4f. y un espacio de nombres que escapa como valor también', async () => {
    // Reexportarlo o pasarlo entero devuelve la concesión al grano del
    // paquete, que es exactamente lo que esta enmienda quitó.
    const escaping = syntheticFile(
      'src/ingest/escape.ts',
      ["import * as cheerio from 'cheerio';", 'export const everything = cheerio;'].join('\n'),
    );

    expect(await importOffences(escaping)).toContain(
      'src/ingest/escape.ts: the namespace `cheerio` of cheerio escapes as a value',
    );
  });

  test('4g. `import()` dinámico y `import` de efecto lateral de un paquete son rojos', async () => {
    // Los dos entregan algo que el sitio del `import` no puede cerrar: el
    // espacio de nombres entero, y ningún nombre en absoluto.
    const dynamic = syntheticFile(
      'src/ingest/dyn.ts',
      "export const open = async () => await import('cheerio');",
    );
    const sideEffect = syntheticFile('src/ingest/side.ts', "import 'cheerio';");

    expect(await importOffences(dynamic)).toEqual([
      'src/ingest/dyn.ts: dynamic import() of the package entry cheerio',
    ]);
    expect(await importOffences(sideEffect)).toEqual([
      'src/ingest/side.ts: side-effect import of the package entry cheerio',
    ]);
  });

  test('4h. `import type` no cuenta, y por eso `next` y `react` tienen superficie vacía', async () => {
    // `verbatimModuleSyntax` lo borra entero: no cruza ninguna capacidad, y
    // exigirle superficie sería peaje.
    const typeOnly = syntheticFile(
      'src/app/(gl)/page.tsx',
      ["import type { Metadata } from 'next';", 'export const metadata: Metadata = {};'].join('\n'),
    );
    const inline = syntheticFile(
      'src/db/probe.ts',
      ["import postgres, { type Sql } from 'postgres';", 'export const sql: Sql = postgres();'].join(
        '\n',
      ),
    );

    expect(await importOffences(typeOnly)).toEqual([]);
    expect(await importOffences(inline)).toEqual([]);
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
      'src/ingest/undici-door.ts: undici is not a declared package entry',
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

describe('CA-2.4 y SPEC-009 CA-1 — la capacidad global se CONCEDE, no se prohíbe', () => {
  test('8. fuera de `src/polite/` todo identificador libre es una entrada declarada', () => {
    // SPEC-009 CA-1: ya no hay nueve nombres prohibidos. Se enumeran, desde el
    // árbol del compilador, los identificadores que cada fichero usa como
    // referencia LIBRE, y cada uno tiene que ser una entrada de
    // `ALLOWED_GLOBALS` usada dentro de su superficie. Lo que no está, es rojo,
    // y no hace falta que nadie sepa que existe.
    expect(OUTSIDE.flatMap((file) => capabilityOffences(file))).toEqual([]);
  });

  test('9. y dentro de `src/polite/` queda EXACTAMENTE una ofensa, en la puerta', () => {
    // Que el mecanismo mida algo: `globalThis` existe en el árbol, está donde
    // ADR-014 §4 dice que tiene que estar, y NO es una entrada de la lista —
    // no porque un nombre lo prohíba, sino porque nadie lo declara. Este caso
    // es lo que fija la puerta a UN sitio.
    expect(POLITE.flatMap((file) => capabilityOffences(file))).toEqual([
      'src/polite/http.ts: `globalThis` is not a declared global identifier',
    ]);
  });

  test('10. control positivo: la cuarta evasión, la más natural de todas', () => {
    // F-SPEC-008-V6, escrita literalmente como la escribió el verificador. Con
    // el guardián viejo convivía con `npm test` en 705/705 y `lint exit=0`:
    // la llamada es `send(`, no hay `import`, y la cadena `user-agent` no se
    // escribe nunca entera. Aquí cae por lo único que no puede esconder — que
    // la capacidad se saca de `globalThis`, y `globalThis` no está declarado.
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

    expect(capabilityOffences(sideDoor)).toEqual([
      'src/ingest/side-door.ts: `globalThis` is not a declared global identifier',
    ]);
  });

  test('11. y las vías que ya morían llevan cada una su control (SPEC-009 CA-1.3)', () => {
    // Las ocho formas que CAPABILITY_NAMES prohibía por nombre siguen siendo
    // rojas — ahora POR NO ESTAR DECLARADAS, que es lo que no tiene última
    // entrada que olvidar.
    const cases: readonly (readonly [string, string, string])[] = [
      ['bare `fetch`', 'const r = await fetch(url);', '`fetch`'],
      ['eval', "const f = eval('(' + src + ')');", '`eval`'],
      ['new Function', "const f = new Function('u', 'return u');", '`Function`'],
      ['require', "const https = require('node:https');", '`require`'],
      ['XMLHttpRequest', 'const x = new XMLHttpRequest();', '`XMLHttpRequest`'],
      ['WebSocket', "const s = new WebSocket('wss://x');", '`WebSocket`'],
      ['EventSource', "const s = new EventSource('/x');", '`EventSource`'],
      ['navigator', 'navigator.sendBeacon(url, body);', '`navigator`'],
    ];

    for (const [name, line, expected] of cases) {
      const file = syntheticFile('src/site/probe.ts', line);
      expect(capabilityOffences(file), `${name} no se caza`).toContain(
        `src/site/probe.ts: ${expected} is not a declared global identifier`,
      );
    }
  });

  test('11b. un identificador escrito con escapes Unicode es EL MISMO identificador', () => {
    // CA-2.3 dejó esto escrito como residuo —«un identificador escrito con
    // escapes Unicode es el mismo para el compilador y no para un patrón»— y
    // decía que cerrarlo sería barato el día que el árbol estuviera ahí. El
    // árbol está ahí, y esto es ese día. Con el detector de texto,
    // `globalThis` no casaba con /\bglobalThis\b/ y salía verde. SPEC-009
    // CA-1.5 lo conserva: se lee del árbol, y el árbol no tiene texto.
    const escaped = syntheticFile(
      'src/ingest/escaped.ts',
      [
        'export async function ask(url: string): Promise<number> {',
        "  const send = globalThi\\u0073.fetch;",
        '  return (await send(url)).status;',
        '}',
      ].join('\n'),
    );

    expect(capabilityOffences(escaped)).toEqual([
      'src/ingest/escaped.ts: `globalThis` is not a declared global identifier',
    ]);
  });

  test('12. y NO se caza la prosa ni el nombre de un módulo: el detector no es ruido', () => {
    // Sin esto el criterio se vuelve inservible y alguien lo afloja. Un
    // comentario que cita `globalThis.fetch` y un `import … from '@/polite/http'`
    // no son una capacidad tomada prestada. Y `HttpFetcher` en posición de TIPO
    // se borra entero en la emisión: no cruza ninguna capacidad, igual que un
    // `import type` (CA-2.3).
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

  test('11c. control positivo (F-SPEC-008-V34): la undécima evasión es ROJA sin lista negra', () => {
    // La reproducción exacta de la evasión que crea SPEC-009, con la fuente
    // literal del ledger. `process` ES una entrada declarada —el escaneo usa
    // `process.env`, `process.argv` y `process.stdout`— y por eso el rojo no lo
    // da el identificador sino LA SUPERFICIE: `getBuiltinModule` no está
    // declarado, y nadie tuvo que saber que existía para que sea rojo.
    const door11 = syntheticFile(
      'src/ingest/door11.ts',
      [
        "const cp = process.getBuiltinModule('node:child_process');",
        '',
        'export function preflight(url: string): string {',
        "  return cp.execFileSync('curl', ['-s', '-A', '', url], { encoding: 'utf8' });",
        '}',
      ].join('\n'),
    );

    expect(capabilityOffences(door11)).toEqual([
      'src/ingest/door11.ts: the global `process` does not declare `getBuiltinModule` in its surface',
    ]);

    // Y la otra mitad de CA-1.2: `process.env` está declarado con su motivo,
    // así que NO es una ofensa. El grano es la superficie, no el identificador.
    const env = syntheticFile(
      'src/ingest/env-user.ts',
      "export const token = process.env['BLOB_READ_WRITE_TOKEN'];",
    );
    expect(capabilityOffences(env)).toEqual([]);
  });

  test('11d. el juicio sale SOLO de lo declarado: lista sintética invertida (CA-1.1)', () => {
    // Como el caso 4c hace con `ALLOWED_PACKAGES`: con una lista que concede
    // exactamente lo contrario, el veredicto se invierte. Si quedara un nombre
    // cableado en el guardián —una lista negra, o una lista de «globales
    // seguros» escondida en la condición de admisión— este caso la destapa.
    const inverted: readonly GlobalEntry[] = [
      {
        identifier: 'process',
        asValue: false,
        surface: ['getBuiltinModule'],
        motive: 'solo para este caso: la superficie invertida',
      },
    ];
    const file = syntheticFile(
      'src/ingest/inverted11.ts',
      [
        "const cp = process.getBuiltinModule('node:fs');",
        'const home = process.env;',
        "const r = fetch('https://x/');",
        'export const all = [cp, home, r];',
      ].join('\n'),
    );

    const offences = capabilityOffences(file, inverted);
    expect(offences).not.toContain(
      'src/ingest/inverted11.ts: the global `process` does not declare `getBuiltinModule` in its surface',
    );
    expect(offences).toContain(
      'src/ingest/inverted11.ts: the global `process` does not declare `env` in its surface',
    );
    expect(offences).toContain(
      'src/ingest/inverted11.ts: `fetch` is not a declared global identifier',
    );
  });

  test('11e. una declaración AMBIENT no es una ligadura: `declare` no fabrica permiso', () => {
    // `declare const fetch` no emite ninguna ligadura: en el JavaScript emitido
    // esa referencia resuelve al global de la plataforma. Un lector que se
    // creyera la declaración diría «ligado» y dejaría pasar la capacidad. Se
    // falla cerrado: una declaración que no liga en ejecución no liga aquí.
    const ambient = syntheticFile(
      'src/ingest/ambient.ts',
      [
        'declare const fetch: (u: string) => Promise<unknown>;',
        'export const ask = (u: string) => fetch(u);',
      ].join('\n'),
    );
    expect(capabilityOffences(ambient)).toEqual([
      'src/ingest/ambient.ts: `fetch` is not a declared global identifier',
    ]);

    // Y `declare global` tampoco: aumentar el objeto global es DESCRIBIR una
    // capacidad del anfitrión, no crearla.
    const augmented = syntheticFile(
      'src/ingest/augmented.ts',
      [
        'declare global { var sneak: (u: string) => Promise<unknown>; }',
        'export const ask = (u: string) => sneak(u);',
      ].join('\n'),
    );
    expect(capabilityOffences(augmented)).toEqual([
      'src/ingest/augmented.ts: `sneak` is not a declared global identifier',
    ]);
  });

  test('11f. la propiedad shorthand es una REFERENCIA: `{ fetch }` roba la capacidad', () => {
    // `export const stolen = { fetch }` lee `globalThis.fetch` y lo entrega en
    // un objeto. Para el árbol, ese `fetch` es a la vez el nombre de la
    // propiedad y una referencia al valor; un lector que solo mirara «¿es un
    // nombre de declaración?» lo saltaría EN SILENCIO.
    const shorthand = syntheticFile(
      'src/ingest/shorthand.ts',
      'export const stolen = { fetch };',
    );
    expect(capabilityOffences(shorthand)).toEqual([
      'src/ingest/shorthand.ts: `fetch` is not a declared global identifier',
    ]);
  });

  test('11g. un identificador declarado por el fichero no es una capacidad (CA-1.4)', () => {
    // El falso positivo que la quinta vuelta corrigió no vuelve: el miembro
    // `fetch` de una interfaz es una DECLARACIÓN, no una referencia libre; y un
    // parámetro llamado `fetch` es una ligadura del ámbito que lo contiene.
    const declared = syntheticFile(
      'src/ingest/declared.ts',
      [
        'export interface Fetcher { fetch(url: string): Promise<number>; }',
        'export function ok(fetch: (u: string) => number): number {',
        "  return fetch('x');",
        '}',
      ].join('\n'),
    );
    expect(capabilityOffences(declared)).toEqual([]);

    // Y sobre el fichero REAL que motivó la corrección: la única ofensa de
    // `src/polite/http.ts` es la puerta, nunca su interfaz.
    const http = SCANNED.find((file) => file.path === 'src/polite/http.ts');
    expect(http).toBeDefined();
    expect(capabilityOffences(http!)).toEqual([
      'src/polite/http.ts: `globalThis` is not a declared global identifier',
    ]);
  });

  test('11h. la lista es cerrada en sus dos ejes, cada entrada llega con motivo, y la lista negra está BORRADA', async () => {
    // Eje 1: qué identificadores hay. Literales, únicos, ordenados.
    const names = ALLOWED_GLOBALS.map((entry) => entry.identifier);
    expect(new Set(names).size).toBe(names.length);
    expect([...names].sort()).toEqual(names);

    // Eje 2: qué concede cada uno — el uso como valor y los miembros leídos.
    // Nada de comodines, y el motivo es obligatorio en TODAS las entradas: un
    // global es capacidad del anfitrión, y ninguno se explica solo.
    for (const entry of ALLOWED_GLOBALS) {
      expect(entry.motive, `${entry.identifier} sin motivo`).toBeTruthy();
      expect(entry.surface, `${entry.identifier}`).not.toContain('*');
      expect(new Set(entry.surface).size, `${entry.identifier}`).toBe(entry.surface.length);
    }

    // La lista no se ensancha «por si acaso»: cada entrada la usa hoy el
    // escaneo real. Una entrada que deje de usarse se borra, no se hereda.
    const used = new Set(
      SCANNED.flatMap((file) =>
        file.reading.unparseable ? [] : freeReferences(file.path).map((ref) => ref.name),
      ),
    );
    for (const entry of ALLOWED_GLOBALS) {
      expect(used.has(entry.identifier), `${entry.identifier} no se usa en el escaneo`).toBe(true);
    }

    // Y la lista negra está borrada DE VERDAD, no envuelta: no queda ninguna
    // constante de nombres prohibidos en el guardián.
    const guard = await readFile(new URL('./support/capability.ts', import.meta.url), 'utf8');
    expect(stripComments(guard)).not.toMatch(/\bCAPABILITY_NAMES\b/);
  });
});

const reachable = await reachableModules(ENTRY_POINTS);

describe('CA-2.5 — nada huérfano en los tres destinos que el CA nombra', () => {
  test('13. todo fichero de código de `src/ingest/`, `src/polite/` y `src/site/` se alcanza', () => {
    // La lista sale del escaneo y no de `git`, por lo mismo que CA-2.6: un
    // fichero que `.gitignore` esconda bajo uno de los tres destinos es código
    // que corre, y hasta la cuarta vuelta no era huérfano porque no existía
    // para este caso (F-SPEC-008-V28).
    const contained = scannedSources().filter((path) =>
      CONTAINED_DIRS.some((dir) => path.startsWith(dir)),
    );

    expect(contained.length).toBeGreaterThan(15);
    expect(contained.filter((path) => !reachable.has(path))).toEqual([]);
  });

  test('14. el lector ve las tres clases de arista sobre ficheros REALES', () => {
    // Sobre el árbol, no sobre un doble. Hasta hoy sólo se leía
    // `import … from '…'`, y lo que no se lee no se cierra.
    const layout = SCANNED.find((file) => file.path === 'src/app/(gl)/layout.tsx');
    const cli = SCANNED.find((file) => file.path === 'src/mirror/cli/capturar-cli.ts');
    const adapter = SCANNED.find((file) => file.path === 'src/ingest/adapter.ts');

    expect(layout?.specifiers.some((s) => s.kind === 'side-effect')).toBe(true);
    expect(cli?.specifiers.some((s) => s.kind === 'dynamic' && s.text !== null)).toBe(true);
    expect(adapter?.specifiers.some((s) => s.kind === 'static')).toBe(true);
  });

  test('15. y el grafo llega adonde sólo se llega por esas aristas', () => {
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

  test('16. control positivo: un fichero nuevo en `src/ingest/` que nadie importa', async () => {
    // Es la tercera evasión viva de CA-2.7. Se comprueba sobre el mecanismo
    // real —el conjunto alcanzable— y no sobre un doble.
    const orphan = 'src/ingest/nobody-imports-me.ts';
    expect(reachable.has(orphan)).toBe(false);

    // Y el mecanismo no está apagado: lo que SÍ se importa, se alcanza.
    expect(reachable.has('src/ingest/ceroacero.ts')).toBe(true);
  });

  test('17. `ENTRY_POINTS` no envejece: nombra todas las rutas de `src/app/`', () => {
    // Una ruta nueva sin declarar es código que Next ejecuta y que CA-2.1 no
    // conduciría nunca. Que aparezca aquí es lo que lo impide.
    // Las rutas salen del escaneo —una ruta nueva sin commitear también la
    // ejecuta Next—; que cada punto de entrada esté versionado se lo sigue
    // preguntando a `git`, que es de lo que es autoridad.
    const routes = scannedSources().filter((path) => path.startsWith('src/app/'));

    expect(routes.length).toBeGreaterThan(0);
    for (const route of routes) expect(ENTRY_POINTS).toContain(route);
    for (const entry of ENTRY_POINTS) expect(versionedSources()).toContain(entry);
  });
});

describe('CA-2.7 — y no queda ninguna exención por nombre de fichero', () => {
  test('18. los dos ficheros que la tenían siguen intactos y ya no la necesitan', async () => {
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

  test('19. ningún mecanismo de CA-2 mira el nombre de un fichero para perdonarlo', async () => {
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
