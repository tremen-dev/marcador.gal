/**
 * CA-13 — RN-08: quién puede escribir una `Decision`, ENUMERADO (ADR-016).
 *
 * La lista no es de ficheros perdonados: es de MÓDULOS CON CAPACIDAD. La
 * pregunta que responde no es «¿a éste se lo dejamos pasar?» sino «¿quién
 * tiene, por diseño, la capacidad de publicar?». Todo lo demás es rojo, y
 * nadie tiene que saber que existe (ADR-016 §3.1 y §3.3).
 *
 * EL LECTOR SE HEREDA, NO SE ESCRIBE (ADR-016 §5 bis: un solo lector). Es el
 * del compilador que sostiene la frontera de SPEC-008 y SPEC-009
 * (`tests/mirror/support/imports.ts`), y las raíces y las exclusiones del
 * escaneo son las que SPEC-008 CA-2.6 ya declaró: no hay una segunda lista de
 * ficheros ni una segunda idea de qué es código.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LO QUE CAMBIÓ EN LA SEGUNDA VUELTA, Y POR QUÉ (F-SPEC-013-7).
 *
 * La primera versión cruzaba los NOMBRES vigilados contra dos cosas: los
 * nombres de los bindings de cada `import`, y los identificadores usados como
 * referencia desnuda. Once líneas la rodearon con los tres gates en verde:
 *
 *     import * as d from '@/db/decisions';
 *     export function evade(sql: postgres.Sql): unknown {
 *       return new d.PostgresDecisionStore(sql);
 *     }
 *
 * El binding de un namespace se llama `*`, no `PostgresDecisionStore`, y el
 * identificador `PostgresDecisionStore` de `d.PostgresDecisionStore` NO es una
 * referencia desnuda —es el `name` de un acceso a propiedad, que el lector
 * excluye por construcción— así que el nombre cruzaba la frontera sin que
 * ninguno de los dos cruces lo viera. El precedente estaba escrito en el mismo
 * fichero del que este guardián hereda el lector (`namespaceOffences` en
 * `tests/polite/support/capability.ts`): un namespace es el objeto de
 * exportación ENTERO entregado en un solo binding, y sin mirarlo la superficie
 * es una formalidad. Se heredó el lector; no se heredó la lección.
 *
 * Así que el mecanismo del grafo mira ahora TRES formas de deletrear el mismo
 * nombre —binding, referencia desnuda y LECTURA DE MIEMBRO (`d.X`, y por tanto
 * también la del alias `const a = d; a.X`)—, falla cerrado ante un módulo que
 * el compilador nombra y este lector no enumeró (`import d = require(…)`, un
 * `import()` en posición de tipo) o ante un especificador que no es literal, y
 * añade un tercer cruce: LA SUPERFICIE ILEGIBLE DE UN MÓDULO CON CAPACIDAD
 * —`import * as`, `import()` dinámico, `export * from`, `export * as`— que es
 * la entrega del objeto entero por otro deletreo (`decisionHandoverOffences`).
 * Cada uno de los tres tiene su control positivo, como pide ADR-016 §3.4.
 *
 * La reexportación en cadena se cierra sola, y por eso no hay un cuarto
 * mecanismo: quien reexporta el nombre lo nombra en su cláusula —rojo— y quien
 * reexporta el módulo entero entrega la superficie ilegible de un módulo con
 * capacidad —rojo—; y quien consume la cadena vuelve a deletrear el nombre en
 * su propio fichero, que es rojo otra vez. El nombre no llega a nadie sin
 * escribirse en algún sitio que el lector lee.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Y LO QUE ESTOS MECANISMOS NO ALCANZAN ESTÁ ESCRITO (ADR-016 §6). Son dos, y
 * los dos tienen destino y disparador:
 *
 *   1. EL SQL COMPUESTO EN TIEMPO DE EJECUCIÓN (CA-13.3, declarado desde el
 *      principio dentro del criterio): un módulo que obtuviera un `Sql` y
 *      escribiera `insert into decisions` componiendo el nombre de la tabla.
 *      Ahí la capacidad no cruza ninguna frontera de módulo que el lector vea y
 *      el nombre de la tabla no aparece en ninguna plantilla. Por eso hay un
 *      SEGUNDO mecanismo, textual y por tanto EXPLÍCITAMENTE INSUFICIENTE, con
 *      su propio control positivo. Destino: EPIC-MEJORA; disparador: el día que
 *      un módulo fuera de `src/decide/` y de `src/db/` necesite escribir en la
 *      base.
 *
 *   2. LA CAPACIDAD ENTREGADA DE FORMA ESTRUCTURAL, SIN NOMBRARLA: un módulo
 *      que reciba por inyección un `{ append, getLatestByMatch }` escrito como
 *      tipo anónimo nunca deletrea `DecisionStore`, y un mecanismo de nombres
 *      —que es lo que ADR-016 §3.1 pide— no puede verlo. Hoy no puede pasar sin
 *      complicidad: quien compone tiene que tener la capacidad, y el único que
 *      la tiene es `src/decide/`. Cerrarlo pide comparar TIPOS, no nombres.
 *      Destino: EPIC-MEJORA; disparador: el día que un módulo fuera de
 *      `src/decide/` reciba un almacén de decisiones por inyección.
 */
import { relative } from 'node:path';
import { resolveModule } from '../../mirror/support/imports';
import { scanRepository } from '../../polite/support/capability';
import type { ScannedFile } from '../../polite/support/capability';

const ROOT = process.cwd();

/** Un módulo con capacidad de escribir una `Decision`, y por qué la tiene. */
export interface DecisionWriter {
  /** Prefijo de directorio (termina en `/`) o ruta exacta de fichero. */
  readonly paths: readonly string[];
  /** Por qué este módulo tiene la capacidad. Obligatorio, como en ADR-016 §3.2. */
  readonly motive: string;
}

/**
 * LAS DOS ENTRADAS. Cualquier otra cosa que cruce uno de los nombres
 * vigilados es roja, y para dejar de serlo hace falta una entrada aquí con su
 * motivo — un diff que un revisor lee, nunca un arbitraje.
 */
export const DECISION_WRITERS: readonly DecisionWriter[] = [
  {
    paths: ['src/decide/'],
    motive:
      'El motor. RN-08 y D-3 dicen que ninguna fuente publica un marcador sin pasar por él, y publicar ES escribir una `Decision`: éste es el módulo al que la regla le da esa capacidad, y el único.',
  },
  {
    paths: ['src/db/alerts.ts', 'src/db/decisions.ts'],
    motive:
      'Implementan los puertos sobre Postgres y NO DECIDEN NADA: traducen a SQL etiquetado lo que el motor ya decidió, y su superficie es la del puerto — sin `update` y sin `delete`, porque el log es append-only. La capacidad de escribir la fila vive necesariamente donde vive la sentencia; lo que RN-08 protege es quién la ORDENA, y eso es `src/decide/`.',
  },
];

/**
 * LOS NOMBRES VIGILADOS: la capacidad, tal y como cruza una frontera de módulo.
 *
 * Los tres son la puerta a escribir una `Decision`: la implementación, el error
 * con nombre que su arbitraje de versión levanta, y el TIPO del puerto — que
 * está aquí porque un módulo que declara depender de `DecisionStore` está
 * pidiendo la capacidad, aunque el inyector se la dé desde fuera.
 */
export const DECISION_CAPABILITY_NAMES = [
  'PostgresDecisionStore',
  'DecisionVersionConflictError',
  'DecisionStore',
] as const;

/** True cuando la ruta está declarada en la lista de módulos con capacidad. */
export function holdsDecisionCapability(
  path: string,
  writers: readonly DecisionWriter[] = DECISION_WRITERS,
): boolean {
  return writers.some((writer) =>
    writer.paths.some((declared) =>
      declared.endsWith('/') ? path.startsWith(declared) : path === declared,
    ),
  );
}

/**
 * MECANISMO 1 — el grafo de imports, leído por el compilador.
 *
 * Un fichero que el lector NO SABE CLASIFICAR es rojo, y lo es contra lo que
 * el compilador publica para ese fichero, no contra nosotros (ADR-016
 * §5 bis.2). Eso son tres cosas antes de mirar ningún nombre: que no se pueda
 * parsear; que el compilador NOMBRE un módulo que este lector no enumeró —así
 * entra `import d = require('@/db/decisions')`, cuya declaración el lector no
 * modela y que sin esto no dejaría rastro—; y que un especificador no sea un
 * literal estático, porque un import que nadie puede leer no cierra ninguna
 * puerta.
 *
 * Y luego EL NOMBRE, EN SUS TRES DELETREOS: el binding de un `import`/`export`
 * —que es el nombre tal y como lo exporta el módulo, nunca el alias—, la
 * referencia desnuda, y la LECTURA DE MIEMBRO `algo.PostgresDecisionStore`,
 * que es por donde se coló la evasión de la primera vuelta (F-SPEC-013-7) y
 * que cubre a la vez el namespace, su alias y el `const d = await import(…)`.
 *
 * Los `import type` no traen bindings —`verbatimModuleSyntax` los borra
 * enteros— así que el tipo del puerto se busca donde el compilador SÍ lo deja
 * ver: entre las referencias del fichero. El precio está dicho: un fichero que
 * declarase un `DecisionStore` propio también sería rojo. Es fallar cerrado, y
 * es el lado correcto en el que equivocarse.
 */
export function decisionImportOffences(
  file: ScannedFile,
  names: readonly string[] = DECISION_CAPABILITY_NAMES,
  writers: readonly DecisionWriter[] = DECISION_WRITERS,
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
  if (holdsDecisionCapability(file.path, writers)) return [];

  return [
    ...blind,
    ...[...crossing]
      .sort()
      .map((name) => `${file.path}: crosses \`${name}\` and is not a declared decision writer`),
  ];
}

/** La ruta de este repositorio que nombra un especificador, o `null`. */
async function moduleOf(specifier: string, fromFile: string): Promise<string | null> {
  const resolved = await resolveModule(specifier, fromFile);
  return resolved === null ? null : relative(ROOT, resolved).replaceAll('\\', '/');
}

/**
 * MECANISMO 1 bis — LA SUPERFICIE ILEGIBLE DE UN MÓDULO CON CAPACIDAD.
 *
 * El mecanismo de nombres cierra el nombre; éste cierra la forma en la que el
 * nombre no hace falta. Cuatro deletreos entregan el objeto de exportación
 * ENTERO de un módulo con capacidad, y ninguno escribe `PostgresDecisionStore`
 * en ninguna parte que el lector pueda enumerar:
 *
 *   - `import * as d from '@/db/decisions'`, y después `d[nombre]` compuesto o
 *     `d` viajando como valor;
 *   - `await import('@/db/decisions')` con el miembro leído en la misma
 *     expresión —`(await import(…)).PostgresDecisionStore`—, que no deja
 *     identificador que mirar;
 *   - `export * from '@/db/decisions'` y `export * as d from '@/db/decisions'`,
 *     que son la reexportación de la superficie entera;
 *   - un `import` de solo efecto, que ejecuta el módulo con capacidad.
 *
 * La lista que decide qué es «un módulo con capacidad» es LA MISMA de arriba,
 * leída en la otra dirección: no hay una segunda enumeración, y quien la vacía
 * apaga los dos mecanismos a la vez. Quien resuelve el especificador a un
 * fichero es el resolvedor del lector heredado, no una segunda idea de qué es
 * un módulo.
 */
export async function decisionHandoverOffences(
  file: ScannedFile,
  writers: readonly DecisionWriter[] = DECISION_WRITERS,
): Promise<readonly string[]> {
  if (file.reading.unparseable) return [`${file.path}: the compiler cannot parse this file`];
  if (holdsDecisionCapability(file.path, writers)) return [];

  const offences: string[] = [];
  for (const specifier of file.specifiers) {
    if (specifier.typeOnly || specifier.text === null) continue;

    const target = await moduleOf(specifier.text, file.path);
    if (target === null || !holdsDecisionCapability(target, writers)) continue;

    if (specifier.kind === 'dynamic') {
      offences.push(`${file.path}: dynamic import() of the decision writer ${target}`);
      continue;
    }
    if (specifier.kind === 'side-effect') {
      offences.push(`${file.path}: side-effect import of the decision writer ${target}`);
      continue;
    }
    if (specifier.unreadableClause) {
      offences.push(`${file.path}: hands over the whole namespace of the decision writer ${target}`);
      continue;
    }
    for (const binding of specifier.bindings) {
      if (binding.kind !== 'namespace') continue;
      offences.push(
        `${file.path}: binds the whole namespace \`${binding.local}\` of the decision writer ${target}`,
      );
    }
  }

  return offences;
}

/**
 * MECANISMO 2 — textual, y por tanto EXPLÍCITAMENTE INSUFICIENTE (CA-13.3).
 *
 * Ningún fichero fuera de la lista nombra la tabla `decisions` en una
 * plantilla SQL. Lee el código sin comentarios, porque media docena de
 * comentarios de este repositorio citan las mismas palabras que caza.
 *
 * NO ALCANZA al nombre de tabla compuesto en tiempo de ejecución
 * —`sql.unsafe('insert into ' + table)`— y eso está declarado, no disfrazado.
 */
const SQL_DECISIONS_TABLE = /(?:insert\s+into|update|delete\s+from|from|join)\s+"?decisions"?\b/i;

export function decisionSqlOffences(
  file: ScannedFile,
  writers: readonly DecisionWriter[] = DECISION_WRITERS,
  pattern: RegExp = SQL_DECISIONS_TABLE,
): readonly string[] {
  if (!pattern.test(file.code)) return [];
  if (holdsDecisionCapability(file.path, writers)) return [];
  return [`${file.path}: names the table \`decisions\` in a SQL template and is not a declared decision writer`];
}

/** Los tres mecanismos sobre un fichero, que es como el criterio los usa. */
export async function decisionOffences(
  file: ScannedFile,
  writers: readonly DecisionWriter[] = DECISION_WRITERS,
): Promise<readonly string[]> {
  return [
    ...decisionImportOffences(file, DECISION_CAPABILITY_NAMES, writers),
    ...(await decisionHandoverOffences(file, writers)),
    ...decisionSqlOffences(file, writers),
  ];
}

/** Todo lo que el escaneo cubre, leído una vez, por el único lector. */
export const scanned = async (): Promise<readonly ScannedFile[]> => await scanRepository();
