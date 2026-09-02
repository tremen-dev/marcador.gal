/**
 * Las fronteras de capacidad de SPEC-015, en la forma de ADR-016.
 *
 * TRES LISTAS DE MÓDULOS CON CAPACIDAD, y cada una enumera LO PERMITIDO y
 * exige que el resto sea vacío. No son listas de ficheros perdonados: la
 * pregunta que contestan no es «¿a éste se lo dejamos pasar?» sino «¿quién
 * tiene, por diseño, esta capacidad?». Todo lo demás es rojo, y nadie tiene que
 * saber que existe (ADR-016 §3.1 y §3.3).
 *
 * EL LECTOR SE HEREDA, NO SE ESCRIBE (ADR-016 §5 bis: un solo lector). Es el
 * del compilador que sostiene las fronteras de SPEC-008, SPEC-009 y SPEC-013
 * (`tests/mirror/support/imports.ts`), y las raíces, exclusiones y extensiones
 * del escaneo son las que SPEC-008 CA-2.6 ya declaró: no hay una segunda lista
 * de ficheros ni una segunda idea de qué es código.
 *
 * La forma es la de `tests/decide/support/rn08.ts`, deliberadamente: los
 * mismos tres cruces —binding de un `import`, referencia desnuda y lectura de
 * miembro—, el mismo fallo cerrado ante un módulo que el compilador nombra y
 * este lector no enumeró, y el mismo control positivo por mecanismo.
 */
import { relative } from 'node:path';
import { resolveModule } from '../../mirror/support/imports';
import { readModule } from '../../mirror/support/imports';
import { scanRepository } from '../../polite/support/capability';
import type { ScannedFile } from '../../polite/support/capability';

const ROOT = process.cwd();

/** Un módulo con una capacidad declarada, y por qué la tiene. */
export interface CapabilityHolder {
  /** Prefijo de directorio (termina en `/`) o ruta exacta de fichero. */
  readonly paths: readonly string[];
  /** Por qué este módulo tiene la capacidad. Obligatorio (ADR-016 §3.2). */
  readonly motive: string;
}

export function holds(path: string, holders: readonly CapabilityHolder[]): boolean {
  return holders.some((holder) =>
    holder.paths.some((declared) =>
      declared.endsWith('/') ? path.startsWith(declared) : path === declared,
    ),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CA-2.3 — quién puede leer el mapeo `telegram_user_id → correspondent_id`.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * UNA SOLA ENTRADA. El mapeo es información adicional de seudonimización
 * (ADR-023 §4): quien lo tiene puede reidentificar a una persona a partir de
 * todo el archivo. Cualquier otro fichero que nombre la variable es rojo.
 */
export const CORRESPONDENT_MAP_READERS: readonly CapabilityHolder[] = [
  {
    paths: ['src/bot/correspondents.ts'],
    motive:
      'El cargador del mapeo. Es el único sitio que traduce un `telegram_user_id` a un `correspondent_id`, y su grafo de importaciones NO ALCANZA `node:fs` — ni directa ni transitivamente (CA-2.5), que es lo que hace verdad que el mapeo no salga de un fichero del repositorio.',
  },
];

/**
 * LOS SEIS CAMPOS DEL UPDATE QUE LLEVAN UNA PERSONA Y QUE NINGÚN PARSER LEE.
 *
 * VIVEN AQUÍ Y NO EN `src/bot/`, y no es domicilio: CA-11.2 exige que NINGÚN
 * fichero de `src/bot/` nombre `language_code`, y una lista de campos
 * prohibidos escrita ahí lo nombraría. Además el mecanismo de CA-3 es la LISTA
 * BLANCA (`ARCHIVED_KEYS`), no ésta: esta lista solo sirve para que un caso
 * pueda afirmar una CONSECUENCIA, y un séptimo campo que Telegram añada mañana
 * queda fuera sin que nadie tenga que saber que existe (ADR-016 §3.5).
 */
export const FORBIDDEN_FIELDS: readonly string[] = [
  'first_name',
  'last_name',
  'username',
  'language_code',
  'is_bot',
  'is_premium',
];

/** El nombre vigilado. Uno, y sale del propio módulo: nunca una copia. */
export const CORRESPONDENT_MAP_NAMES = ['TELEGRAM_CORRESPONDENTS'] as const;

// ─────────────────────────────────────────────────────────────────────────────
// CA-5.4 — quién puede llamar al proveedor del modelo.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ENUMERA MÓDULOS NUESTROS, NO NOMBRES DE PROVEEDOR, así que sobrevive al
 * cambio de proveedor (ADR-022 §6). Hoy el directorio está VACÍO —CA-5 tiene
 * una precondición y no hay adaptador— y la lista se declara igual: una lista
 * que solo llega después de la medición llega tarde.
 */
export const LLM_CALLERS: readonly CapabilityHolder[] = [
  {
    paths: ['src/bot/models/'],
    motive:
      'Un adaptador por proveedor, y nada más. Es el único sitio que puede hablar con un tercero que no es una fuente de resultados; el resto del bot compone contra el puerto `src/bot/llm.ts` (CA-5.9). HOY ESTÁ VACÍO: sin proveedor elegido y sin DPA guardado y fechado no se escribe el adaptador (ADR-023 §6.4).',
  },
];

/**
 * LAS FORMAS PROPIETARIAS QUE NO CRUZAN AL DOMINIO (CA-5.10).
 *
 * No es una lista negra de proveedores: es la enumeración de LO QUE UN PUERTO
 * DEL DOMINIO NO PUEDE DELETREAR. El identificador del modelo vive dentro de su
 * adaptador y en ningún otro sitio; los bloques de contenido, los parámetros de
 * razonamiento o esfuerzo, las cabeceras y los códigos de error propios son la
 * silueta del SDK filtrándose.
 *
 * RESIDUO DECLARADO (ADR-016 §6, CA-5.10): ESTE MECANISMO ES DE NOMBRES. No
 * alcanza a una forma propietaria copiada ESTRUCTURALMENTE —un tipo anónimo con
 * la misma silueta que la respuesta de un proveedor— ni a una semántica
 * filtrada sin nombre, como asumir que la salida trae siempre un solo bloque de
 * texto. Destino: EPIC-MEJORA; disparador: el segundo adaptador, que es cuando
 * la fuga se hace visible porque algo deja de encajar.
 */
export const PROPRIETARY_NAMES = [
  'anthropic',
  'openai',
  'gemini',
  'mistral',
  'cohere',
  'moonshot',
  'qwen',
  'content_block',
  'contentBlock',
  'stop_reason',
  'stopReason',
  'max_tokens',
  'maxTokens',
  'reasoning_effort',
  'reasoningEffort',
  'thinking_budget',
  'anthropic-version',
  'x-api-key',
] as const;

/** El dominio del bot: todo lo que NO es un adaptador de proveedor. */
export const BOT_DOMAIN = 'src/bot/';

// ─────────────────────────────────────────────────────────────────────────────
// CA-12.2 — quién puede fabricar texto visible.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * `asBotText` NO SE EXPORTA, así que el mecanismo principal es el TIPO y vive
 * en `tests/types/spec015-bot.test-d.ts`. Esta lista cierra el segundo camino:
 * que alguien reintroduzca la fabricación con un `as`.
 */
export const BOT_TEXT_PRODUCERS: readonly CapabilityHolder[] = [
  {
    paths: ['src/i18n/'],
    motive:
      'Los bundles y su resolutor. `BotText` sale de aquí y de ningún otro sitio, que es lo que hace de D-2 un fallo de compilación y no una costumbre (CA-12.2).',
  },
];

/** Las formas de fabricar un `BotText` sin pasar por el bundle. */
export const BOT_TEXT_CASTS = ['as BotText', 'as unknown as BotText', 'asBotText'] as const;

// ─────────────────────────────────────────────────────────────────────────────
// El mecanismo, uno solo, parametrizado por lista y nombres.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * MECANISMO DE NOMBRES, leído por el compilador.
 *
 * Un fichero que el lector NO SABE CLASIFICAR es rojo, y lo es contra lo que el
 * compilador publica para ese fichero, no contra nosotros (ADR-016 §5 bis.2):
 * que no se pueda parsear; que el compilador NOMBRE un módulo que este lector
 * no enumeró; y que un especificador no sea un literal estático.
 *
 * Y luego el nombre, en sus tres deletreos: el binding de un `import`/`export`,
 * la referencia desnuda, y la lectura de miembro `algo.NOMBRE`.
 */
export function nameOffences(
  file: ScannedFile,
  names: readonly string[],
  holders: readonly CapabilityHolder[],
): readonly string[] {
  if (file.reading.unparseable) return [`${file.path}: the compiler cannot parse this file`];

  const blind: string[] = [];
  const enumerated = new Map<string, number>();
  for (const specifier of file.specifiers) {
    if (specifier.text === null) {
      blind.push(`${file.path}: specifier is not a static literal — ${specifier.raw}`);
      continue;
    }
    enumerated.set(specifier.text, (enumerated.get(specifier.text) ?? 0) + 1);
  }
  const counted = new Map<string, number>();
  for (const named of file.reading.compilerModules) {
    const seen = (counted.get(named) ?? 0) + 1;
    counted.set(named, seen);
    if ((enumerated.get(named) ?? 0) < seen) {
      blind.push(`${file.path}: the compiler names ${named} and the reader did not enumerate it`);
    }
  }

  const crossing = new Set<string>();
  for (const specifier of file.specifiers) {
    for (const binding of specifier.bindings) {
      if (names.includes(binding.name)) crossing.add(binding.name);
    }
  }
  for (const name of names) {
    if (file.reading.bareIdentifiers.has(name)) crossing.add(name);
  }
  for (const read of file.reading.namespaceReads) {
    if (read.member !== null && names.includes(read.member)) crossing.add(read.member);
  }

  if (blind.length === 0 && crossing.size === 0) return [];
  if (holds(file.path, holders)) return [];

  return [
    ...blind,
    ...[...crossing].sort().map((name) => `${file.path}: crosses \`${name}\``),
  ];
}

/**
 * MECANISMO TEXTUAL, y por tanto EXPLÍCITAMENTE INSUFICIENTE.
 *
 * El nombre de una variable de entorno no cruza ninguna frontera de módulo: se
 * escribe como una cadena. Así que este mecanismo lee el código SIN COMENTARIOS
 * —media docena de comentarios de este repositorio citan las mismas palabras
 * que caza— y no alcanza a un nombre compuesto en tiempo de ejecución
 * (`'TELEGRAM_' + 'CORRESPONDENTS'`). Eso está declarado, no disfrazado.
 */
export function textOffences(
  file: ScannedFile,
  needles: readonly string[],
  holders: readonly CapabilityHolder[],
): readonly string[] {
  const found = needles.filter((needle) => file.code.includes(needle));
  if (found.length === 0) return [];
  if (holds(file.path, holders)) return [];
  return found.sort().map((needle) => `${file.path}: names \`${needle}\``);
}

/** La ruta de este repositorio que nombra un especificador, o `null`. */
export async function moduleOf(specifier: string, fromFile: string): Promise<string | null> {
  const resolved = await resolveModule(specifier, fromFile);
  return resolved === null ? null : relative(ROOT, resolved).replaceAll('\\', '/');
}

/**
 * CA-2.5 — EL GRAFO DE IMPORTACIONES de un módulo, y qué especificadores
 * externos alcanza por él. NO es un `grep`: se recorre el grafo con el
 * resolvedor del lector heredado, y lo que se devuelve es el conjunto de
 * especificadores no relativos que aparecen en cualquier fichero alcanzable.
 */
export async function reachableSpecifiers(entry: string): Promise<ReadonlySet<string>> {
  const seen = new Set<string>();
  const external = new Set<string>();
  const pending = [entry];

  while (pending.length > 0) {
    const current = pending.pop();
    if (current === undefined || seen.has(current)) continue;
    seen.add(current);

    const reading = readModule(current);
    for (const specifier of reading.specifiers) {
      if (specifier.text === null) {
        external.add(`<non-literal in ${current}>`);
        continue;
      }
      const target = await moduleOf(specifier.text, current);
      if (target === null) {
        external.add(specifier.text);
        continue;
      }
      pending.push(target);
    }
  }

  return external;
}

/**
 * Todo lo que el escaneo cubre, leído por el ÚNICO lector — con un reintento
 * del escaneo ENTERO, y hay que decir por qué.
 *
 * F-SPEC-013-10, inventariado en EPIC-MEJORA y anticipado por el ledger de esta
 * spec (F-SPEC-015-7): los controles positivos de `tests/polite/architecture.
 * test.ts` ESCRIBEN FICHEROS REALES bajo `src/` y los borran después, y vitest
 * corre los ficheros de test en paralelo. Un escaneo concurrente puede listar
 * uno de esos ficheros y encontrárselo ya borrado al leerlo: `ENOENT`, y el
 * fichero de test entero cae con 0 casos. Medido en la rama base, sin una sola
 * línea de SPEC-015: 1 de cada 6 ejecuciones.
 *
 * Lo que se hace aquí NO DEBILITA NADA, y por eso se reintenta el escaneo
 * ENTERO y no se perdona un fichero: el resultado sigue siendo la foto
 * consistente de un instante, con las MISMAS raíces, exclusiones y extensiones
 * que SPEC-008 CA-2.6 declaró. Un fichero que desaparece a mitad de la lectura
 * no es código que se despliegue; uno que sigue ahí se lee y se juzga.
 *
 * Si tras los intentos sigue fallando, PROPAGA: fallar cerrado es lo que este
 * guardián hace con todo lo demás.
 */
export async function scanned(attempts = 5): Promise<readonly ScannedFile[]> {
  let last: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await scanRepository();
    } catch (error) {
      last = error;
    }
  }
  throw last;
}
