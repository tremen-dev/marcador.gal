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
import { ENTRY_POINTS, syntheticFile, versionedSources } from '../polite/support/capability';
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
  moduleOf,
  nameOffences,
  reachableSpecifiers,
  scanned,
  textOffences,
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

  test('10. y el mecanismo mide el GRAFO, no el texto: `catalog.ts` SÍ lee ficheros', async () => {
    // La otra mitad del criterio: leer el catálogo versionado es legítimo, y
    // por eso vive en otro módulo. Si los dos estuviesen juntos, el caso 8
    // sería imposible de satisfacer sin renunciar al catálogo.
    const reachable = await reachableSpecifiers('src/bot/catalog.ts');
    expect([...reachable]).toContain('node:fs/promises');
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
    const offences: string[] = [];
    for (const file of SCANNED) {
      if (holds(file.path, LLM_CALLERS)) continue;
      for (const specifier of file.specifiers) {
        if (specifier.text === null) continue;
        const target = await moduleOf(specifier.text, file.path);
        if (target !== null && target.startsWith('src/bot/models/')) {
          offences.push(`${file.path}: imports the model adapter ${target}`);
        }
      }
    }
    expect(offences).toEqual([]);
  });

  test('16. control positivo: un fichero fuera de la lista que lo importe es ROJO', () => {
    const evasion = syntheticFile(
      'src/probe/llm-caller.ts',
      "import { call } from '@/bot/models/whatever';\nexport const x = call;",
    );
    const targets = evasion.specifiers
      .map((specifier) => specifier.text)
      .filter((text): text is string => text !== null && text.includes('/bot/models/'));
    expect(targets).toEqual(['@/bot/models/whatever']);
    expect(holds('src/probe/llm-caller.ts', LLM_CALLERS)).toBe(false);
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
  const TELEGRAM_ID = /\b\d{9,12}\b/;

  test('27. ni el catálogo declarado, ni los fixtures, ni `.env.example`', async () => {
    const suspects = [
      'corresponsais/2026-27.json',
      '.env.example',
      ...versionedSources().filter((path) => path.startsWith('tests/fixtures/')),
    ];

    const offenders: string[] = [];
    for (const path of suspects) {
      const text = await readFile(path, 'utf8');
      if (TELEGRAM_ID.test(text)) offenders.push(path);
    }
    expect(offenders).toEqual([]);
  });

  test('28. `.env.example` declara la variable SIN VALOR', async () => {
    const example = await readFile('.env.example', 'utf8');
    expect(example).toContain(`${CORRESPONDENT_MAP_VARIABLE}=`);
    expect(example).not.toMatch(new RegExp(`${CORRESPONDENT_MAP_VARIABLE}=\\S`));
  });

  test('29. control positivo: uno de ejemplo en el catálogo pone ROJO el caso', () => {
    const withId = '{"season":"2026/27","correspondents":[{"telegram":123456789}]}';
    expect(TELEGRAM_ID.test(withId)).toBe(true);
  });

  test('30. residuo declarado: esto mira el ÁRBOL DE TRABAJO, no la historia de git', () => {
    // Si un identificador entrara alguna vez en un commit, quitarlo del árbol
    // no lo quita del repositorio — ésa es la razón entera de la regla
    // (ADR-009 §3). El mecanismo PREVIENE, NO REPARA, y se declara para que
    // nadie lea el criterio como si prometiera más.
    expect(true).toBe(true);
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
    const offenders: string[] = [];
    for (const file of BOT_FILES) {
      for (const [, literal] of file.code.matchAll(/'([^'\\\n]*)'/g)) {
        if (literal !== undefined && /[^ -~]/.test(literal)) {
          offenders.push(`${file.path}: «${literal}»`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  test('38. control positivo del segundo mecanismo', () => {
    const evasion = "export const hint = 'Se algo non cadra, descarta';";
    expect(/[^ -~]/.test('Aínda non está publicado')).toBe(true);
    expect(/[^ -~]/.test(evasion)).toBe(false);
  });

  test('39. residuo declarado: un literal ASCII sin espacios NO lo ve el segundo mecanismo', () => {
    // «Confirmar» pasa el escaneo de prosa y es incumplimiento de D-2 igual.
    // Lo cierra el TIPO (`tests/types/spec015-bot.test-d.ts`), que es el
    // mecanismo principal y por eso está declarado como tal.
    expect(/[^ -~]/.test('Confirmar')).toBe(false);
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
