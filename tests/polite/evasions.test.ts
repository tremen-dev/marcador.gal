/**
 * SPEC-009 CA-3 — LA BATERÍA DE LAS ONCE EVASIONES (ADR-016 §3.4).
 *
 * Cada caso de este fichero es código que alguien escribió Y EJECUTÓ con los
 * tres gates en verde en el momento de escribirlo, durante las cinco
 * verificaciones de SPEC-008. No es anécdota: es la única batería de ataque
 * que este proyecto ha construido, y vive aquí como CASOS para que apagar un
 * mecanismo del criterio ponga rojo al menos uno nombrado.
 *
 * Cada evasión se ejecuta contra el mecanismo QUE LA MATA HOY (o que la deja
 * vivir, cuando eso es lo firmado):
 *
 *   E1  el import de `node:https` con cabecera por clave computada → CA-2.3
 *   E2  el segundo parser de `robots.txt` por regex → DEJÓ DE SER INFRACCIÓN
 *   E3  la segunda composición del User-Agent → el guardián de la cadena
 *   E4  `const { fetch: send } = globalThis` → CA-1 (y `containment` 6)
 *   E5  `await import('node:' + 'https')` → CA-2.3 (y `containment` 7)
 *   E6  `await import(MOD)` → CA-2.3
 *   E7  un parser real dentro del fichero antes EXENTO → sobrevive (CA-2.8)
 *   E8  `cheerio.fromURL` → la concesión por superficie (CA-2.3)
 *   E9  el `import` a mitad de línea, en sus tres escrituras → el lector
 *   E10 el `.mts` bajo una raíz → la declaración de extensiones (CA-2.6)
 *   E11 `process.getBuiltinModule` → la lista blanca de globales (CA-1)
 *
 * Y la que sobrevive A PROPÓSITO va nombrada: N4, el parser funcional dentro
 * de `src/site/robots-txt.ts`, es la pérdida que Alberto Fojo firmó el
 * 2026-09-01 (SPEC-008 CA-2.8, F-SPEC-008-20). Un cierre que la matara por
 * accidente sería un cambio de criterio sin firma, y el caso N4 existe para
 * que se note.
 *
 * LA DUODÉCIMA ENTRA AQUÍ EL DÍA QUE APAREZCA. Quien la encuentre — casi
 * seguro un verificador, que es quien ha encontrado las once — la escribe como
 * caso en este fichero, contra el mecanismo que la deja pasar, ANTES de que
 * nadie escriba el cierre. Así la batería no envejece y el expediente entero
 * de SPEC-008 (su ledger: cinco verificaciones, cuatro enmiendas) sigue
 * siendo ejecutable sin leerse entero.
 */
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import {
  USER_AGENT,
  USER_AGENT_CONTACT,
  USER_AGENT_PRODUCT,
  USER_AGENT_VERSION,
} from '@/polite/user-agent';
import { readModule } from '../mirror/support/imports';
import { stripComments } from '../support/source-tree';
import {
  SCAN_EXCLUSIONS,
  SCAN_EXTENSIONS,
  capabilityOffences,
  extensionPathspec,
  importOffences,
  isCodeFile,
  scannedSources,
  syntheticFile,
  walkRefusals,
} from './support/capability';
import type { ScannedFile } from './support/capability';

/** Un fichero REAL del repositorio, leído por el mismo lector único. */
async function realFile(path: string): Promise<ScannedFile> {
  const text = await readFile(path, 'utf8');
  const reading = readModule(path);
  return { path, text, code: stripComments(text), reading, specifiers: reading.specifiers };
}

describe('CA-3 — las que hoy mueren, siguen muriendo, y se comprueba ejecutando', () => {
  test('E1 — `node:https` importado, con la cabecera armada por clave computada', async () => {
    // Primera evasión (1ª vuelta). Rodeaba a `callsPlatformFetch`, que solo
    // conocía `fetch(`. Hoy muere ANTES de mirar ninguna forma: `node:https`
    // no es una entrada declarada de `ALLOWED_PACKAGES`.
    const evasion = syntheticFile(
      'src/ingest/evasion1.ts',
      [
        "import { request } from 'node:https';",
        "const KEY = 'User-' + 'Agent';",
        '',
        'export function ask(url: string, ua: string): void {',
        '  const headers: Record<string, string> = {};',
        '  headers[KEY] = ua;',
        '  request(url, { headers }).end();',
        '}',
      ].join('\n'),
    );

    expect(await importOffences(evasion)).toEqual([
      'src/ingest/evasion1.ts: node:https is not a declared package entry',
    ]);
  });

  test('E4 — `const { fetch: send } = globalThis`, la más natural de todas (F-SPEC-008-V6)', () => {
    // Cuarta evasión (2ª vuelta). La llamada es `send(`, no hay `import`, y la
    // cadena `user-agent` no se escribe entera jamás. Muere porque la
    // capacidad se saca de `globalThis` y `globalThis` no es una entrada
    // declarada. Su mitad en EJECUCIÓN es `containment.test.ts` caso 6: la
    // trampa la ve salir y no la atribuye.
    const evasion = syntheticFile(
      'src/ingest/evasion4.ts',
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

    expect(capabilityOffences(evasion)).toEqual([
      'src/ingest/evasion4.ts: `globalThis` is not a declared global identifier',
    ]);
  });

  test("E5 — `await import('node:' + 'https')` (F-SPEC-008-V7)", async () => {
    // Quinta evasión (2ª vuelta): el hueco entre dos detectores textuales.
    // Hoy un especificador no literal es rojo POR CONSTRUCCIÓN, también dentro
    // de `src/polite/`. Su mitad en ejecución es `containment` caso 7: la
    // trampa no vive en el registro de módulos.
    const evasion = syntheticFile(
      'src/ingest/evasion5.ts',
      [
        'export async function open(url: string): Promise<void> {',
        "  const gate = await import('node:' + 'https');",
        '  gate.request(url).end();',
        '}',
      ].join('\n'),
    );

    const offences = await importOffences(evasion);
    expect(offences).toHaveLength(1);
    expect(offences[0]).toContain('not a static literal');
  });

  test('E6 — `await import(MOD)`, con el especificador en una variable', async () => {
    // Sexta evasión: la forma honesta de la quinta, muerta en el sitio contra
    // `COMPUTED_IMPORT` y hoy roja por el mismo juicio que E5.
    const evasion = syntheticFile(
      'src/ingest/evasion6.ts',
      [
        "const MOD = 'node:https';",
        'export async function open(url: string): Promise<void> {',
        '  const gate = await import(MOD);',
        '  gate.request(url).end();',
        '}',
      ].join('\n'),
    );

    const offences = await importOffences(evasion);
    expect(offences).toHaveLength(1);
    expect(offences[0]).toContain('not a static literal');
  });

  test('E8 — `cheerio.fromURL`: la que entró por la puerta principal (F-SPEC-008-V15)', async () => {
    // Octava evasión (3ª vuelta), la primera que MANDÓ UN PAQUETE. `cheerio`
    // estaba concedido entero y ES un cliente HTTP; la obligación «ninguna
    // entrada es una puerta» se mecanizaba con trece nombres prohibidos que no
    // la incluían. Con la concesión por superficie muere sin que nadie la
    // nombre. Su mitad en ejecución es `containment` casos 14 y 15.
    const evasion = syntheticFile(
      'src/ingest/evasion8.ts',
      [
        "import { fromURL } from 'cheerio';",
        'export async function preflight(url: string): Promise<number> {',
        '  const $ = await fromURL(url);',
        "  return $('tr').length;",
        '}',
      ].join('\n'),
    );

    expect(await importOffences(evasion)).toEqual([
      'src/ingest/evasion8.ts: cheerio does not declare `fromURL` in its surface',
    ]);
  });

  test('E9 — el `import` que el lector viejo no veía, en sus TRES escrituras (F-SPEC-008-V27)', async () => {
    // Novena evasión (4ª vuelta), y también mandó un paquete. Tres expresiones
    // regulares ancladas a principio de sentencia; DOCE CARACTERES separaban
    // verde de rojo, y no fallaba cerrado: callaba. Hoy el lector es el árbol
    // del compilador y la posición en la línea no cambia el veredicto.
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
      const evasion = syntheticFile('src/ingest/evasion9.ts', [head, ...body].join('\n'));
      expect(await importOffences(evasion), `${label}`).toContain(
        'src/ingest/evasion9.ts: node:child_process is not a declared package entry',
      );
    }
  });

  test('E10 — el `.mts` bajo una raíz que ninguna de las dos listas veía (F-SPEC-008-V33)', async () => {
    // Décima evasión (5ª vuelta): la lista de extensiones vivía dentro de dos
    // funciones y ninguna casaba con `.mts`. Una letra del nombre separaba
    // verde de rojo, y el fichero llegaba a producción con un `git add`
    // normal. Hoy `SCAN_EXTENSIONS` es UNA declaración y las dos listas
    // derivan de ella.
    //
    // Las dos mitades, SIN escribir en disco — la reproducción en disco es el
    // control 2g de `architecture.test.ts`, que convive con su propio escaneo;
    // un segundo fichero real bajo `src/` desde ESTA suite correría en
    // paralelo con aquel escaneo y lo pondría rojo por el motivo equivocado.
    //
    // Mitad de la LISTA: qué cuenta como código lo dice la declaración, y el
    // pathspec de la cobertura deriva de ella.
    expect(isCodeFile('src/ingest/door.mts')).toBe(true);
    expect(extensionPathspec()).toContain('*.mts');

    // Mitad del JUICIO: el mismo fichero de la medición, leído por el lector,
    // es rojo con el mismo mensaje que su gemelo `.ts`.
    const source = [
      "import { execFileSync } from 'node:child_process';",
      '',
      'export function preflight(url: string): string {',
      "  return execFileSync('curl', ['-s', '-A', '', url], { encoding: 'utf8' });",
      '}',
    ].join('\n');
    const evasion = syntheticFile('src/ingest/evasion10.mts', source);
    expect(evasion.reading.unparseable).toBe(false);
    expect(await importOffences(evasion)).toEqual([
      'src/ingest/evasion10.mts: node:child_process is not a declared package entry',
    ]);

    const twin = syntheticFile('src/ingest/evasion10-twin.ts', source);
    expect(await importOffences(twin)).toEqual([
      'src/ingest/evasion10-twin.ts: node:child_process is not a declared package entry',
    ]);
  });

  test('E11 — `process.getBuiltinModule`: la que crea esta spec (F-SPEC-008-V34)', () => {
    // Undécima evasión (5ª vuelta), la materia de SPEC-009. Sin ningún
    // `import` que CA-2.3 pueda juzgar, sin pasar por un socket que CA-2.1
    // vea, y sin ninguno de los nueve nombres de la lista negra que sostenía
    // CA-2.4. Muere contra la lista blanca de globales: `process` está
    // concedido con la superficie [argv, env, stdout] y `getBuiltinModule` no
    // está en ella — nadie tuvo que saber que existía.
    const evasion = syntheticFile(
      'src/ingest/evasion11.ts',
      [
        "const cp = process.getBuiltinModule('node:child_process');",
        '',
        'export function preflight(url: string): string {',
        "  return cp.execFileSync('curl', ['-s', '-A', '', url], { encoding: 'utf8' });",
        '}',
      ].join('\n'),
    );

    expect(capabilityOffences(evasion)).toEqual([
      'src/ingest/evasion11.ts: the global `process` does not declare `getBuiltinModule` in its surface',
    ]);
  });

  test('E12a — un SYMLINK de código era invisible a las TRES listas a la vez (F-SPEC-009-V1)', () => {
    // Duodécima evasión, primera forma (primera verificación de SPEC-009,
    // 2026-09-02). Un dirent de symlink no es `isFile()` ni `isDirectory()`, y
    // el paseo viejo lo saltaba EN SILENCIO: sin raíz, sin exclusión y sin
    // motivo. Medido dos veces con los tres gates en verde: (S1)
    // `robots/evil-link.ts` en la raíz, escondido además por `.gitignore:17` —
    // `tests/polite` 114/114—; (S2) `src/ingest/robots/evil.ts` BAJO UNA RAÍZ
    // del escaneo, importado desde `src/ingest/adapter.ts` — `lint exit=0`,
    // `npm test` 800/800—. Y con un symlink de DIRECTORIO el agujero es un
    // árbol entero. Hoy el paseo DECIDE: un symlink es rojo por construcción,
    // nombrándose (`walkRefusals`), y la única salida es una exclusión
    // declarada con su motivo — que es literalmente lo que CA-2 pide.
    //
    // La reproducción vive sobre un árbol sintético FUERA del repositorio por
    // lo mismo que E10 no escribe en disco: un symlink real aquí correría en
    // paralelo con el control 2l de `architecture.test.ts` y lo pondría rojo
    // por el motivo equivocado. El paseo y las listas declaradas son los
    // REALES; solo la raíz del árbol es del caso.
    const SYMLINK = 'a symbolic link, which the walk refuses by construction (F-SPEC-009-V1)';
    const base = mkdtempSync(join(tmpdir(), 'spec009-e12a-'));
    try {
      const outside = join(base, 'outside-evil.ts');
      writeFileSync(outside, "import { fromURL } from 'cheerio';\nexport const ask = fromURL;\n", 'utf8');

      const tree = join(base, 'tree');
      mkdirSync(join(tree, 'robots'), { recursive: true });
      mkdirSync(join(tree, 'src', 'ingest', 'robots'), { recursive: true });
      mkdirSync(join(tree, 'node_modules'), { recursive: true });
      symlinkSync(outside, join(tree, 'robots', 'evil-link.ts')); // S1: la raíz
      symlinkSync(outside, join(tree, 'src', 'ingest', 'robots', 'evil.ts')); // S2: bajo una raíz
      symlinkSync(base, join(tree, 'src', 'vendor')); // de DIRECTORIO: un árbol entero

      // Y las dos formas de quedar fuera POR DECISIÓN DECLARADA: dentro de una
      // exclusión el paseo no entra, y un symlink EN una ruta excluida tampoco
      // se refusa — la exclusión con su motivo es la decisión.
      symlinkSync(outside, join(tree, 'node_modules', 'hidden.ts'));
      symlinkSync(base, join(tree, 'raw'));

      expect(walkRefusals(SCAN_EXTENSIONS, SCAN_EXCLUSIONS, tree)).toEqual([
        `robots/evil-link.ts: ${SYMLINK}`,
        `src/ingest/robots/evil.ts: ${SYMLINK}`,
        `src/vendor: ${SYMLINK}`,
      ]);
    } finally {
      rmSync(base, { recursive: true, force: true });
    }
  });
});

describe('CA-3 — las que dejaron de ser infracción, nombradas y comprobadas', () => {
  test('E2 — el segundo parser de `robots.txt` por regex YA NO es infracción (CA-2.8)', async () => {
    // Segunda evasión (1ª vuelta). Murió contra `ROBOTS_WORD`; después el
    // criterio DEJÓ DE MIRAR PALABRAS y esta forma dejó de ser infracción, con
    // la pérdida firmada (F-SPEC-008-20). Lo que un segundo parser NO puede
    // hacer sigue cerrado por otro sitio: DECIDIR una salida lo caza CA-2.2
    // (`containment` caso 10) y ABRIR una puerta lo cazan CA-2.3/CA-1.
    const evasion = syntheticFile(
      'src/ingest/evasion2.ts',
      [
        'const DISALLOW = /^\\s*disallow\\s*:\\s*(\\S*)/i;',
        'export function disallowedRules(robots: string): string[] {',
        "  return robots.split('\\n').flatMap((line) => {",
        '    const rule = DISALLOW.exec(line)?.[1];',
        "    return rule !== undefined && rule.length > 0 ? [rule] : [];",
        '  });',
        '}',
      ].join('\n'),
    );

    expect(await importOffences(evasion)).toEqual([]);
    expect(capabilityOffences(evasion)).toEqual([]);
  });

  test('E3 — la segunda composición del User-Agent: su guardián es la cadena, no la frontera', async () => {
    // Tercera evasión (1ª vuelta). Murió contra `UA_PARTS`; hoy la frontera de
    // capacidad no la mira — importar de `@/polite/user-agent` resuelve dentro
    // del repositorio y no cruza capacidad —, y su guardián es el de la cadena
    // declarada (`tests/mirror/user-agent.test.ts`, SPEC-005). La evasión solo
    // reproduce el User-Agent arrastrando el tramo congelado…
    const composed = `${USER_AGENT_PRODUCT}/${USER_AGENT_VERSION} (+${USER_AGENT_CONTACT}; medicion de latencia)`;
    expect(composed).toBe(USER_AGENT);
    expect(composed).toContain('medicion de latencia');

    // …y ese tramo vive en EXACTAMENTE un fichero de `src/`: el mecanismo del
    // caso 15 de aquel guardián, ejecutado aquí sobre la misma lista de
    // ficheros que audita la frontera. Una segunda composición en `src/`
    // pondría rojos a los dos.
    const carriers: string[] = [];
    for (const path of scannedSources()) {
      if (!path.startsWith('src/')) continue;
      const text = await readFile(path, 'utf8');
      if (text.includes('medicion de latencia')) carriers.push(path);
    }
    expect(carriers).toEqual(['src/polite/user-agent.ts']);
  });

  test('E7 y N4 — el parser funcional dentro de `src/site/robots-txt.ts` SIGUE SOBREVIVIENDO', async () => {
    // Séptima evasión (2ª vuelta), y la pérdida que Alberto Fojo firmó el
    // 2026-09-01 (SPEC-008 CA-2.8, F-SPEC-008-20): un segundo parser de
    // `robots.txt` puede existir mientras no pueda decidir ni abrir una
    // puerta. La mutación N4 del verificador —un parser FUNCIONAL añadido al
    // fichero que genera el nuestro— tiene que dejar la suite en verde, y un
    // cierre futuro que la matara por accidente sería un cambio de criterio
    // sin firma. ESTE CASO ES EL QUE LO HARÍA VISIBLE: reproduce N4 y exige
    // que NO ofenda.
    const real = await realFile('src/site/robots-txt.ts');
    expect(real.code).toMatch(/\b(?:user-agent|disallow)\b/i);
    expect(await importOffences(real)).toEqual([]);
    expect(capabilityOffences(real)).toEqual([]);

    // N4, reproducida: el mismo fichero CON un parser funcional dentro.
    const parser = [
      '',
      'export function n4Disallows(robots: string): string[] {',
      "  return robots.split('\\n').flatMap((line) => {",
      "    const [key, value] = line.split(':');",
      "    return key !== undefined && key.trim().toLowerCase() === 'disallow' && value !== undefined",
      '      ? [value.trim()]',
      '      : [];',
      '  });',
      '}',
    ].join('\n');
    const mutated = syntheticFile('src/site/robots-txt.ts', `${real.text}${parser}\n`);

    expect(await importOffences(mutated)).toEqual([]);
    expect(capabilityOffences(mutated)).toEqual([]);
  });
});

describe('CA-4.3 — el residuo del cierre estático, alcanzable con un ejemplo', () => {
  test('el árbol dice qué nombres cruzan, no qué hacen: `z` de `zod` es el caso vivo', async () => {
    // El cierre estático es SINTAXIS, no semántica, y de UN nivel: una
    // superficie concedida cuyo contenido tenga capacidad dentro no queda
    // cerrada por dentro. `z` está declarado en `ALLOWED_PACKAGES` —es el
    // contrato del modelo entero (D-en-ADR-001)— y lo que cuelga de `z` no lo
    // juzga nadie. Un residuo que nadie puede escribir no es un residuo: éste
    // se escribe así de fácil, y por eso va declarado dentro del criterio
    // (ADR-016 §6) en vez de prometerse cerrado.
    const inside = syntheticFile(
      'src/ingest/residue3.ts',
      [
        "import { z } from 'zod';",
        'export const anything = z.custom<(url: string) => Promise<unknown>>();',
      ].join('\n'),
    );

    expect(await importOffences(inside)).toEqual([]);
    expect(capabilityOffences(inside)).toEqual([]);
  });
});
