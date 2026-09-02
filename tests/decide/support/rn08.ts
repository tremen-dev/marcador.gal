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
 * Y LO QUE ESTE MECANISMO NO ALCANZA ESTÁ ESCRITO, dentro del criterio y aquí
 * (ADR-016 §6, CA-13.3): el grafo de imports no ve a un módulo que obtuviera
 * un `Sql` y escribiera `insert into decisions` con SQL etiquetado compuesto,
 * porque ahí la capacidad no cruza ninguna frontera de módulo. Por eso hay un
 * SEGUNDO mecanismo, textual y por tanto EXPLÍCITAMENTE INSUFICIENTE, con su
 * propio control positivo. Lo que queda sin cubrir es el nombre de tabla
 * compuesto en tiempo de ejecución, y su destino es EPIC-MEJORA con disparador
 * escrito: el día que un módulo fuera de `src/decide/` y de `src/db/` necesite
 * escribir en la base.
 */
import { scanRepository } from '../../polite/support/capability';
import type { ScannedFile } from '../../polite/support/capability';

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
 * §5 bis.2).
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

  const crossing = new Set<string>();
  for (const specifier of file.specifiers) {
    for (const binding of specifier.bindings) {
      if (names.includes(binding.name)) crossing.add(binding.name);
    }
  }
  for (const name of names) {
    if (file.reading.bareIdentifiers.has(name)) crossing.add(name);
  }

  if (crossing.size === 0) return [];
  if (holdsDecisionCapability(file.path, writers)) return [];

  return [...crossing]
    .sort()
    .map((name) => `${file.path}: crosses \`${name}\` and is not a declared decision writer`);
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

/** Todo lo que el escaneo cubre, leído una vez, por el único lector. */
export const scanned = async (): Promise<readonly ScannedFile[]> => await scanRepository();
