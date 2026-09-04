/**
 * Las fronteras de capacidad de SPEC-015 — CA-2, CA-5 (mitad estática), CA-6,
 * CA-9, CA-10.4, CA-11.2, CA-12.2 y CA-1.2/CA-1.6 (mitad estática).
 *
 * Todas en la forma de ADR-016: se enumera lo permitido, se exige que el resto
 * sea VACÍO, hay control positivo POR MECANISMO, no hay ninguna exención por
 * nombre de fichero, y el residuo de cada una está declarado DENTRO del
 * criterio (en la spec) y repetido aquí donde el mecanismo juzga.
 */
import { describe, expect, test } from 'vitest';
import { readFile } from 'node:fs/promises';
import { existsSync, rmSync, writeFileSync } from 'node:fs';
import { ENTRY_POINTS, syntheticFile, versionedSources } from '../polite/support/capability';
import {
  ID_SCAN_EXCLUSIONS,
  TELEGRAM_ID,
  excludedFromIdScan,
  telegramIdOffences,
  versionedTree,
} from './support/telegram-ids';
import { reachableModules } from '../mirror/support/imports';
import {
  BOT_DOMAIN,
  BOT_TEXT_CASTS,
  BOT_TEXT_PRODUCERS,
  CORRESPONDENT_MAP_NAMES,
  CORRESPONDENT_MAP_READERS,
  LLM_CALLERS,
  PROPRIETARY_NAMES,
  holds,
  modelAdapterOffences,
  moduleOf,
  nameOffences,
  reachableSpecifiers,
  scanned,
  textOffences,
  visibleLiteralOffences,
} from './support/frontier';
import { CORRESPONDENT_MAP_VARIABLE } from '@/bot/correspondents';
import { CORRESPONDENT_PRE_KICKOFF_MS, CORRESPONDENT_POST_KICKOFF_MS } from '@/bot/windows';
import { PRE_KICKOFF_MS, POST_KICKOFF_MS } from '@/ingest/windows';

const SCANNED = await scanned();
const BOT_FILES = SCANNED.filter((file) => file.path.startsWith(BOT_DOMAIN));

describe('CA-2.3 — el mapeo solo lo leen los módulos declarados', () => {
  test('1. el escaneo mide algo: `src/bot/` está entero y no es un conjunto vacío', () => {
    const paths = BOT_FILES.map((file) => file.path);
    expect(paths.length).toBeGreaterThan(10);
    expect(paths).toContain('src/bot/correspondents.ts');
    expect(paths).toContain('src/bot/webhook.ts');
  });

  test('2. el nombre de la variable sale del MÓDULO, nunca de una copia del test', () => {
    expect(CORRESPONDENT_MAP_NAMES).toEqual([CORRESPONDENT_MAP_VARIABLE]);
  });

  test('3. el complemento de `CORRESPONDENT_MAP_READERS` es VACÍO', () => {
    const offences = SCANNED.flatMap((file) =>
      textOffences(file, CORRESPONDENT_MAP_NAMES, CORRESPONDENT_MAP_READERS),
    );
    expect(offences).toEqual([]);
  });

  test('4. cada entrada de la lista llega con su motivo escrito (ADR-016 §3.2)', () => {
    expect(CORRESPONDENT_MAP_READERS.length).toBeGreaterThan(0);
    for (const holder of CORRESPONDENT_MAP_READERS) {
      expect(holder.paths.length).toBeGreaterThan(0);
      expect(holder.motive.length).toBeGreaterThan(60);
    }
  });
});

describe('CA-2.4 — control positivo POR MECANISMO (ADR-016 §3.4)', () => {
  test('5. un fichero FUERA de la lista que nombre la variable es ROJO', () => {
    const evasion = syntheticFile(
      'src/probe/map-reader.ts',
      `export const map = process.env['${CORRESPONDENT_MAP_VARIABLE}'];`,
    );
    expect(textOffences(evasion, CORRESPONDENT_MAP_NAMES, CORRESPONDENT_MAP_READERS)).toEqual([
      `src/probe/map-reader.ts: names \`${CORRESPONDENT_MAP_VARIABLE}\``,
    ]);
  });

  test('6. vaciar la lista de NOMBRES VIGILADOS deja el mecanismo sin medir nada', () => {
    // El control del propio detector: si el conjunto vacío del caso 3 fuese
    // vacío porque no se vigila nada, esto lo dice.
    const crossing = SCANNED.filter(
      (file) => textOffences(file, CORRESPONDENT_MAP_NAMES, []).length > 0,
    );
    expect(crossing.map((file) => file.path).sort()).toEqual(['src/bot/correspondents.ts']);

    const withNoNames = SCANNED.filter((file) => textOffences(file, [], []).length > 0);
    expect(withNoNames).toEqual([]);
  });

  test('7. un fichero que el LECTOR NO SABE CLASIFICAR es rojo, y lo dice el compilador', () => {
    const unreadable = syntheticFile(
      'src/probe/unreadable-map.ts',
      "const where = '@/bot' + '/correspondents';\nconst m = await import(where);\nexport const x = m;",
    );
    expect(nameOffences(unreadable, ['whatever'], [])).toEqual([
      'src/probe/unreadable-map.ts: specifier is not a static literal — where',
    ]);
  });
});

describe('CA-2.5 — el cargador del mapeo no alcanza `node:fs` por su GRAFO', () => {
  test('8. ni directa ni transitivamente', async () => {
    const reachable = await reachableSpecifiers('src/bot/correspondents.ts');
    expect([...reachable].sort()).toEqual(['zod']);
  });

  test('9. control positivo: una importación de `node:fs` lo pone ROJO', async () => {
    syntheticFile(
      'src/probe/map-with-fs.ts',
      [
        "import { readFileSync } from 'node:fs';",
        "import { readCorrespondentMap } from '@/bot/correspondents';",
        'export const map = readCorrespondentMap({ x: readFileSync("x", "utf8") });',
      ].join('\n'),
    );
    const reachable = await reachableSpecifiers('src/probe/map-with-fs.ts');
    expect([...reachable]).toContain('node:fs');
  });

  test('10. y el mecanismo mide el GRAFO, no el texto: `src/db/migrate.ts` SÍ lee ficheros', async () => {
    // El sujeto de este control positivo era `src/bot/catalog.ts` hasta
    // SPEC-016 (2026-09-03), porque leía el catálogo versionado con `readFile`.
    // Ya no lee nada: lo importa en compilación, y `node:fs` no le queda
    // alcanzable por ningún camino. El control se muda a un módulo de
    // producción que sí lo alcanza — el caso 9 hace lo mismo con un fichero
    // sintético, y este lo hace sobre el árbol real.
    const reachable = await reachableSpecifiers('src/db/migrate.ts');
    expect([...reachable]).toContain('node:fs/promises');

    // Y la mitad que SPEC-016 añade, medida sobre el GRAFO y no sobre el texto:
    // el cargador del catálogo tampoco alcanza `node:fs` ya.
    const catalog = await reachableSpecifiers('src/bot/catalog.ts');
    expect([...catalog]).not.toContain('node:fs/promises');
    expect([...catalog]).not.toContain('node:fs');
  });
});

describe('CA-2.6 — ninguna exención por nombre de fichero (ADR-016 §3.3)', () => {
  test('11. este criterio no tiene ninguna lista de exclusiones propia', async () => {
    const source = await readFile('tests/bot/support/frontier.ts', 'utf8');
    expect(source).not.toContain('EXCLUDED');
    expect(source).not.toContain('IGNORED');
    expect(source).not.toContain('ALLOWED_FILES');
  });

  test('12. y el juicio sale SOLO de lo declarado: lista sintética invertida', () => {
    // Con la lista vacía, `src/bot/correspondents.ts` es rojo; con la lista
    // real, no lo es. Nada del veredicto sale del nombre del fichero.
    const loader = SCANNED.find((file) => file.path === 'src/bot/correspondents.ts');
    expect(loader).toBeDefined();
    if (loader === undefined) return;

    expect(textOffences(loader, CORRESPONDENT_MAP_NAMES, []).length).toBe(1);
    expect(textOffences(loader, CORRESPONDENT_MAP_NAMES, CORRESPONDENT_MAP_READERS)).toEqual([]);
  });
});

describe('CA-2.7 — el residuo declarado, repetido donde el mecanismo juzga', () => {
  test('13. la inyección desde un módulo autorizado NO la ve este mecanismo', () => {
    // Un módulo que RECIBE el mapeo ya leído no nombra la variable, así que un
    // mecanismo de nombres no puede verlo. Es exactamente el segundo residuo de
    // SPEC-013 CA-13.3 en otro sitio. Destino: EPIC-MEJORA; disparador: el día
    // que un módulo fuera de `CORRESPONDENT_MAP_READERS` reciba el mapeo por
    // inyección. Y tampoco alcanza a que alguien copie el valor a mano fuera
    // del repositorio: eso no es una frontera de código.
    const injected = syntheticFile(
      'src/probe/injected-map.ts',
      [
        'export function whoIs(map: ReadonlyMap<string, string>, id: number): string | undefined {',
        '  return map.get(`${id}`);',
        '}',
      ].join('\n'),
    );
    expect(textOffences(injected, CORRESPONDENT_MAP_NAMES, CORRESPONDENT_MAP_READERS)).toEqual([]);
  });
});

describe('CA-5.4 — quién puede llamar al proveedor del modelo', () => {
  test('14. `src/bot/models/` no existe todavía, y la lista lo declara igual', () => {
    // CA-5 tiene una precondición: sin proveedor elegido y sin DPA guardado y
    // fechado no se escribe el adaptador (ADR-023 §6.4). La frontera se declara
    // ANTES, porque una lista que solo llega tras la medición llega tarde.
    expect(SCANNED.filter((file) => file.path.startsWith('src/bot/models/'))).toEqual([]);
    expect(LLM_CALLERS.map((holder) => holder.paths).flat()).toEqual(['src/bot/models/']);
  });

  test('15. el complemento es VACÍO: nada fuera de la lista importa un cliente', async () => {
    expect(await modelAdapterOffences(SCANNED, LLM_CALLERS)).toEqual([]);
  });

  test('16. control positivo: un fichero fuera de la lista que lo importe es ROJO', async () => {
    // EJERCITA EL MISMO PREDICADO QUE EL CASO 15 —resolver el especificador con
    // el lector y mirar a dónde apunta—, no un `includes` escrito aquí. Para
    // que haya adaptador que resolver se declara uno sintético: el directorio
    // real está vacío hasta que haya proveedor y DPA (ADR-023 §6.4).
    syntheticFile('src/bot/models/probe.ts', 'export const call = (): string => "x";');
    const evasion = syntheticFile(
      'src/probe/llm-caller.ts',
      "import { call } from '@/bot/models/probe';\nexport const x = call;",
    );

    expect(await modelAdapterOffences([evasion], LLM_CALLERS)).toEqual([
      'src/probe/llm-caller.ts: imports the model adapter src/bot/models/probe.ts',
    ]);
    // Y el mismo fichero, DENTRO de la lista, no es ofensa: el veredicto sale
    // de lo declarado y de nada más.
    expect(await modelAdapterOffences([evasion], [{ paths: ['src/probe/'], motive: 'control' }]))
      .toEqual([]);
  });

  test('17. y vaciar la lista de módulos vigilados deja el mecanismo sin medir nada', () => {
    expect(holds('src/bot/models/anything.ts', [])).toBe(false);
    expect(holds('src/bot/models/anything.ts', LLM_CALLERS)).toBe(true);
  });
});

describe('CA-5.10 — ninguna forma propietaria cruza al dominio', () => {
  test('18. ningún módulo de `src/bot/` deletrea un nombre propietario', () => {
    const offences = BOT_FILES.flatMap((file) =>
      PROPRIETARY_NAMES.filter((name) => file.code.toLowerCase().includes(name.toLowerCase())).map(
        (name) => `${file.path}: names \`${name}\``,
      ),
    );
    expect(offences).toEqual([]);
  });

  test('19. control positivo: mover un nombre propietario al tipo del puerto lo pone ROJO', () => {
    const leaked = syntheticFile(
      'src/bot/leaked-port.ts',
      [
        'export interface ModelAnswer {',
        '  readonly content_block: string;',
        '  readonly stop_reason: string;',
        '}',
      ].join('\n'),
    );
    const found = PROPRIETARY_NAMES.filter((name) =>
      leaked.code.toLowerCase().includes(name.toLowerCase()),
    );
    expect([...found].sort()).toEqual(['content_block', 'stop_reason']);
  });

  test('20. el identificador del modelo no vive en ningún fichero del dominio', () => {
    // No hay adaptador todavía, así que la afirmación es la más fuerte posible:
    // NADA en `src/bot/` parece un identificador de modelo.
    const modelish = /\b(?:claude|gpt|llama|kimi|qwen|mistral)-[a-z0-9.-]+/i;
    const offenders = BOT_FILES.filter((file) => modelish.test(file.code)).map((f) => f.path);
    expect(offenders).toEqual([]);
  });
});

describe('CA-6.2 y CA-6.6 — la ventana del corresponsal, y `src/alias/`', () => {
  test('21. los dos módulos exportan constantes DISTINTAS', () => {
    expect(CORRESPONDENT_PRE_KICKOFF_MS).not.toBe(PRE_KICKOFF_MS);
    expect(CORRESPONDENT_POST_KICKOFF_MS).not.toBe(POST_KICKOFF_MS);
  });

  test('22. y el bot NO importa las del tick', () => {
    const offences = BOT_FILES.flatMap((file) =>
      file.specifiers.flatMap((specifier) =>
        specifier.bindings
          .filter((binding) =>
            ['PRE_KICKOFF_MS', 'POST_KICKOFF_MS', 'MATCH_WINDOW'].includes(binding.name),
          )
          .map((binding) => `${file.path}: ${binding.name}`),
      ),
    );
    expect(offences).toEqual([]);
  });

  test('23. `src/bot/` no importa `src/alias/`, y es la forma ejecutable de ADR-022 §5', async () => {
    const offences: string[] = [];
    for (const file of BOT_FILES) {
      for (const specifier of file.specifiers) {
        if (specifier.text === null) continue;
        const target = await moduleOf(specifier.text, file.path);
        if (target !== null && target.startsWith('src/alias/')) {
          offences.push(`${file.path}: imports ${target}`);
        }
      }
    }
    expect(offences).toEqual([]);
  });
});

describe('CA-9.3 — el bot importa la puerta estrecha POR NOMBRE', () => {
  test('24. ningún `import * as` sobre `src/decide/` en `src/bot/`', async () => {
    const offences: string[] = [];
    for (const file of BOT_FILES) {
      for (const specifier of file.specifiers) {
        if (specifier.text === null || specifier.typeOnly) continue;
        const target = await moduleOf(specifier.text, file.path);
        if (target === null || !target.startsWith('src/decide/')) continue;
        if (specifier.kind === 'dynamic' || specifier.kind === 'side-effect') {
          offences.push(`${file.path}: ${specifier.kind} import of ${target}`);
        }
        for (const binding of specifier.bindings) {
          if (binding.kind === 'namespace') offences.push(`${file.path}: namespace of ${target}`);
        }
      }
    }
    expect(offences).toEqual([]);
  });

  test('25. control positivo: convertirlo en namespace pone rojo el caso', () => {
    const evasion = syntheticFile(
      'src/bot/namespaced.ts',
      "import * as engine from '@/decide/engine-entry';\nexport const run = engine;",
    );
    const namespaces = evasion.specifiers.flatMap((specifier) =>
      specifier.bindings.filter((binding) => binding.kind === 'namespace').map((b) => b.local),
    );
    expect(namespaces).toEqual(['engine']);
  });

  test('26. y lo que sí hay es el nombre, en el fichero de la composición', () => {
    const webhook = BOT_FILES.find((file) => file.path === 'src/bot/webhook.ts');
    expect(webhook).toBeDefined();
    const names = (webhook?.specifiers ?? [])
      .filter((specifier) => specifier.text === '@/decide/engine-entry')
      .flatMap((specifier) => specifier.bindings.map((binding) => binding.name));
    expect(names).toContain('runEngineForMatch');
  });
});

describe('CA-10.4 — ningún fichero del repositorio contiene un `telegram_user_id`', () => {
  // LA CARGA ÚTIL DE LA SONDA SE COMPONE, NO SE ESCRIBE. Este fichero está
  // DENTRO del escaneo —`tests/` no se excluye, y por eso `tests/fixtures/`,
  // que el CA nombra, queda cubierto—, así que un literal de diez cifras aquí
  // convertiría al guardián en su propia ofensa. Se compone, y queda dicho.
  const PROBE_ID = '7'.repeat(10);
  const PROBE_PATH = 'src/bot/notes-p14-probe.md';
  const PROBE_TEXT = `El corresponsal de A Estrada es ${PROBE_ID} en Telegram.\n`;

  test('27. el escaneo cubre el ÁRBOL VERSIONADO ENTERO, no tres sospechosos', () => {
    const tree = versionedTree();

    // Los tres sitios que el CA nombra, y el sitio donde la sonda P14 escribió.
    expect(tree).toContain('corresponsais/2026-27.json');
    expect(tree).toContain('.env.example');
    expect(tree).toContain('src/bot/webhook.ts');
    expect(tree.filter((path) => path.startsWith('tests/fixtures/')).length).toBeGreaterThan(0);
    expect(tree.filter((path) => path.startsWith('migrations/')).length).toBeGreaterThan(0);
    expect(tree.length).toBeGreaterThan(400);

    // Y CONTIENE ENTERA la lista de código de SPEC-009 CA-2: lo que aquel
    // recorrido lee es un subconjunto de lo que éste lee, nunca al revés.
    const scanned = new Set(tree);
    const missing = versionedSources().filter((path) => !scanned.has(path));
    expect(missing).toEqual([]);
  });

  test('28. y no hay NINGUNA ofensa en él', () => {
    expect(telegramIdOffences()).toEqual([]);
  });

  test('29. `.env.example` declara la variable SIN VALOR', async () => {
    const example = await readFile('.env.example', 'utf8');
    expect(example).toContain(`${CORRESPONDENT_MAP_VARIABLE}=`);
    expect(example).not.toMatch(new RegExp(`${CORRESPONDENT_MAP_VARIABLE}=\\S`));
  });

  test('30. control positivo: un fichero escrito bajo `src/bot/` pone ROJO EL MISMO escaneo', () => {
    // La reproducción de la sonda P14, dentro de la suite y con el escaneo
    // real: se escribe, se mide, se borra. La extensión es `.md` y no `.ts`
    // A PROPÓSITO — un módulo huérfano bajo `src/` pondría rojo el caso de
    // cobertura de `tests/polite/architecture.test.ts`, que corre en otro
    // worker (F-SPEC-013-10) —, y no debilita nada: que alcanza a los `.ts` de
    // `src/` lo afirma el caso 27.
    //
    // MATIZ DESDE EL 2026-09-04 (enmienda ADR-015, F-SPEC-018-N1): este
    // mecanismo SÍ mira la extensión, pero sólo para dejar fuera dos
    // contenedores comprimidos —`*.png` y `*.woff2`— donde no puede informar en
    // ninguna dirección. Para todo lo demás, incluida la extensión de esta
    // sonda, sigue sin mirarla.
    writeFileSync(PROBE_PATH, PROBE_TEXT, 'utf8');
    try {
      const offences = telegramIdOffences();
      expect(offences).toEqual([`${PROBE_PATH}: looks like a telegram_user_id — ${PROBE_ID}`]);
    } finally {
      rmSync(PROBE_PATH, { force: true });
    }
  });

  test('31. residuo declarado: mira el ÁRBOL DE TRABAJO, no la historia de git', () => {
    // Los MISMOS bytes que el caso 30 acaba de ver en rojo son ahora
    // invisibles, solo porque el fichero salió del árbol. Eso es exactamente
    // el residuo: si un identificador entrara alguna vez en un commit,
    // quitarlo del árbol no lo quitaría del repositorio —ésa es la razón
    // entera de la regla (ADR-009 §3)—. EL MECANISMO PREVIENE, NO REPARA, y
    // aquí está medido en vez de prometido.
    expect(existsSync(PROBE_PATH)).toBe(false);
    expect(telegramIdOffences()).toEqual([]);
    expect(TELEGRAM_ID.test(PROBE_TEXT)).toBe(true);
  });

  test('32. control del propio detector: ninguna exclusión es decorativa', () => {
    // Con la lista de exclusiones VACÍA el escaneo tiene que encontrar algo:
    // si no, el conjunto vacío del caso 28 sería vacío porque el mecanismo no
    // lee bytes. Y todo lo que encuentra cae bajo una exclusión DECLARADA con
    // su motivo — el complemento es vacío, que es la forma de ADR-016.
    const withoutExclusions = telegramIdOffences(versionedTree(), []);
    expect(withoutExclusions.length).toBeGreaterThan(0);

    const undeclared = withoutExclusions.filter(
      (offence) => !excludedFromIdScan(offence.slice(0, offence.indexOf(': '))),
    );
    expect(undeclared).toEqual([]);

    for (const exclusion of ID_SCAN_EXCLUSIONS) {
      expect(exclusion.motive.length).toBeGreaterThan(60);
    }
  });
});

describe('CA-11.2 — `language_code` no existe dentro del proceso', () => {
  test('31. ningún fichero de `src/bot/` lo nombra', () => {
    const offenders = BOT_FILES.filter((file) => file.code.includes('language_code')).map(
      (file) => file.path,
    );
    expect(offenders).toEqual([]);
  });

  test('32. control positivo: escribirlo pone ROJO el caso', () => {
    const evasion = syntheticFile(
      'src/bot/from-client.ts',
      "export const locale = (u: { language_code: string }) => u.language_code;",
    );
    expect(evasion.code.includes('language_code')).toBe(true);
  });

  test('33. y tampoco está en la lista blanca de lo archivado (CA-3.1)', async () => {
    const redact = await readFile('src/bot/redact.ts', 'utf8');
    // Aparece SOLO en la lista de campos prohibidos, que existe para que un
    // caso pueda afirmar su ausencia. No en `ARCHIVED_KEYS`.
    const whitelist = /export const ARCHIVED_KEYS[\s\S]*?\n\];/.exec(redact)?.[0] ?? '';
    expect(whitelist.length).toBeGreaterThan(100);
    expect(whitelist).not.toContain('language_code');
  });
});

describe('CA-12.2 — nadie fuera de `src/i18n/` fabrica texto visible', () => {
  test('34. ningún fichero de `src/bot/` fabrica un `BotText` con un `as`', () => {
    const offences = SCANNED.flatMap((file) =>
      textOffences(file, BOT_TEXT_CASTS, BOT_TEXT_PRODUCERS),
    );
    expect(offences).toEqual([]);
  });

  test('35. control positivo: un `as BotText` fuera de `src/i18n/` es ROJO', () => {
    const evasion = syntheticFile(
      'src/bot/cast.ts',
      "export const text = 'Confirmar' as unknown as BotText;",
    );
    expect(textOffences(evasion, BOT_TEXT_CASTS, BOT_TEXT_PRODUCERS).length).toBeGreaterThan(0);
  });

  test('36. y `asBotText` no se exporta: el mecanismo principal es el TIPO', async () => {
    const source = await readFile('src/i18n/bot.ts', 'utf8');
    expect(source).toContain('function asBotText');
    expect(source).not.toContain('export function asBotText');
  });

  test('37. segundo mecanismo: ningún literal de `src/bot/` lleva un carácter no ASCII', () => {
    // El galego y el castellano visibles llevan acentos, «», comillas y «—».
    // No los cazan todos —«Confirmar» no lleva ninguno— y por eso el mecanismo
    // principal es el tipo; éste cierra el descuido más probable.
    expect(BOT_FILES.flatMap((file) => visibleLiteralOffences(file))).toEqual([]);
  });

  test('38. control positivo del segundo mecanismo, sobre EL MISMO escaneo', () => {
    // La primera vuelta afirmaba `/[^ -~]/.test('Aínda non está publicado')`
    // sobre una cadena escrita aquí: eso mide la expresión regular, no el
    // escaneo de literales. Ahora se escribe un fichero de `src/bot/` y se
    // pasa por la misma función que juzga al módulo real.
    const evasion = syntheticFile(
      'src/bot/hardcoded.ts',
      "export const hint = 'Aínda non está publicado';",
    );
    expect(visibleLiteralOffences(evasion)).toEqual([
      'src/bot/hardcoded.ts: «Aínda non está publicado»',
    ]);
  });

  test('39. residuo declarado: un literal ASCII sin espacios NO lo ve el segundo mecanismo', () => {
    // «Confirmar» pasa el escaneo de prosa y es incumplimiento de D-2 igual, y
    // se mide con el escaneo, no con la regex: el mismo fichero sintético del
    // caso 38 con un literal ASCII sale LIMPIO. Lo cierra el TIPO
    // (`tests/types/spec015-bot.test-d.ts`), que es el mecanismo principal y
    // por eso está declarado como tal.
    const ascii = syntheticFile('src/bot/ascii-label.ts', "export const label = 'Confirmar';");
    expect(visibleLiteralOffences(ascii)).toEqual([]);
  });
});

describe('CA-1.2 y CA-1.6 — la mitad estática del webhook', () => {
  test('40. no hay ninguna comparación con `===` sobre el secreto en el módulo', () => {
    const webhook = BOT_FILES.find((file) => file.path === 'src/bot/webhook.ts');
    expect(webhook).toBeDefined();
    expect(webhook?.code ?? '').toMatch(/constantTimeEquals/);
    // `typeof secret !== 'string'` NO es una comparación sobre el secreto: su
    // operando es el `typeof`, y es lo que decide si está configurado. Lo que
    // el criterio prohíbe es comparar el VALOR, que es el oráculo de tiempo.
    const withoutTypeof = (webhook?.code ?? '').replaceAll('typeof secret', 'typeof x');
    expect(withoutTypeof).not.toMatch(/\bsecret\s*[=!]==|[=!]==\s*secret\b/);
  });

  test('41. la ruta no importa nada de `src/db/`, `src/raw/` ni `src/decide/`', async () => {
    const route = SCANNED.find(
      (file) => file.path === 'src/app/api/telegram/webhook/route.ts',
    );
    expect(route).toBeDefined();

    const targets: string[] = [];
    for (const specifier of route?.specifiers ?? []) {
      if (specifier.text === null) continue;
      const target = await moduleOf(specifier.text, 'src/app/api/telegram/webhook/route.ts');
      if (target !== null) targets.push(target);
    }
    expect(targets).toEqual(['src/bot/webhook.ts']);
  });

  test('42. la ruta es un punto de entrada declarado y NO alcanza la puerta de salida', async () => {
    const route = 'src/app/api/telegram/webhook/route.ts';
    expect(ENTRY_POINTS).toContain(route);
    expect([...(await reachableModules([route]))]).not.toContain('src/polite/http.ts');
  });
});
