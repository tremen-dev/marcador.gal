/**
 * CA-10.4 — NINGÚN FICHERO DEL REPOSITORIO CONTIENE UN `telegram_user_id`.
 *
 * Vive en su propio fichero, y no dentro de `support/frontier.ts`, por dos
 * razones: la lista de exclusiones de más abajo no tiene nada que ver con las
 * tres listas de capacidad de aquel —el caso 11 de la suite afirma que aquel
 * fichero no tiene NINGUNA lista de exclusiones propia, y sigue siendo verdad—,
 * y este mecanismo no lee módulos: lee BYTES DE FICHEROS, todos, sean código o
 * no.
 *
 * POR QUÉ ES EL ÁRBOL ENTERO Y NO TRES SOSPECHOSOS. La primera versión de este
 * criterio leía `corresponsais/<temporada>.json`, `.env.example` y
 * `tests/fixtures/`, que son los tres sitios que el CA nombra a modo de
 * ejemplo. La sonda P14 del veredicto RED del 2026-09-03 lo midió: un
 * `src/bot/notes.ts` versionado con un número de diez cifras dejó la suite en
 * VERDE, 42/42. La regla que este guardián sostiene es de las irreversibles
 * —git no se purga, se reescribe (ADR-009 §3)— y el criterio dice «ningún
 * fichero del repositorio… sobre el árbol versionado». Así que se recorre el
 * árbol versionado ENTERO.
 *
 * LA LISTA CERRADA ES LA DE EXCLUSIONES, cada una con su motivo (ADR-016 §3.2),
 * y el complemento —todo lo demás, casi quinientos ficheros— tiene que dar
 * CERO. Ninguna exclusión es por nombre de fichero (ADR-016 §3.3): las dos son
 * categorías estructurales, y un caso comprueba que ninguna es decorativa
 * exigiendo que TODO lo que el escaneo encuentra sin exclusiones caiga bajo una
 * de ellas.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

/**
 * LA FORMA DE UN `telegram_user_id`: un entero de 9 a 12 cifras.
 *
 * No es una lista de identificadores conocidos —esa lista no existe y no puede
 * existir— sino la forma. Por eso el fixture de `tests/fixtures/telegram.ts`
 * usa a propósito un `from.id` CORTO (`4242`): uno con esta forma sería
 * indistinguible de uno real para este mecanismo, y un guardián que tiene que
 * perdonar a sus propios datos de prueba ya no es un guardián.
 */
export const TELEGRAM_ID = /\b\d{9,12}\b/;

/** Un sitio del árbol que este escaneo no juzga, y por qué. */
export interface IdScanExclusion {
  /**
   * Prefijo de directorio si termina en `/`, sufijo de nombre si empieza por
   * `*`, y ruta exacta en cualquier otro caso.
   */
  readonly path: string;
  /** Por qué queda fuera. Obligatorio (ADR-016 §3.2). */
  readonly motive: string;
}

export const ID_SCAN_EXCLUSIONS: readonly IdScanExclusion[] = [
  {
    path: 'docs/diseno/',
    motive:
      'Las fuentes del sistema de diseño de EPIC-004. Los artboards llevan inyectado un runtime minificado cuyas constantes de máscara de bits tienen 9 y 10 cifras, que es la forma que este mecanismo caza y no es ningún identificador de nadie. Es la MISMA frontera que ya está declarada, con el mismo motivo, en `SCAN_EXCLUSIONS` de `tests/polite/support/capability.ts` y en `.oxlintrc.json` desde el 2026-09-01: no es código de la aplicación y nadie escribe ahí un corresponsal.',
  },
  {
    path: '*.ledger.md',
    motive:
      'El registro de verificación de cada spec, que es donde se escribe LO QUE SE MIDIÓ, carga útil de la sonda incluida: el veredicto RED del 2026-09-03 cita literalmente el número de diez cifras de la sonda P14 mientras describe el agujero que este caso cierra. Es el mismo motivo por el que `SCAN_EXCLUSIONS` deja fuera `tests/`: un guardián que convierte en ofensa documentar su propia sonda no se puede documentar, y un veredicto que no puede citar lo que midió no se puede reproducir. RESIDUO DECLARADO: un identificador real escrito en un ledger queda fuera de este mecanismo. No es donde vive el mapeo —su único domicilio durable es el entorno (ADR-023 §4)—, pero queda dicho para que nadie lea el criterio como si prometiera más.',
  },
];

export function excludedFromIdScan(
  path: string,
  exclusions: readonly IdScanExclusion[] = ID_SCAN_EXCLUSIONS,
): boolean {
  return exclusions.some((exclusion) => {
    if (exclusion.path.startsWith('*')) return path.endsWith(exclusion.path.slice(1));
    if (exclusion.path.endsWith('/')) return path.startsWith(exclusion.path);
    return path === exclusion.path;
  });
}

/**
 * EL ÁRBOL VERSIONADO ENTERO, sin filtro de extensión.
 *
 * `--cached` es lo que git ya guarda y `--others --exclude-standard` lo que se
 * commitearía con un `git add` normal: las dos mitades de «lo que entra en el
 * repositorio». Sin pathspec de extensiones, a diferencia de
 * `versionedSources()`, porque un identificador escrito en un `.json`, en un
 * `.md`, en un `.sql` o en el `.env.example` es exactamente igual de
 * irreversible que uno escrito en un `.ts` — y los tres sitios que el CA nombra
 * son, precisamente, dos de ellos y un directorio de `tests/`.
 */
export function versionedTree(): readonly string[] {
  return execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], {
    encoding: 'utf8',
  })
    .split('\n')
    .filter((path) => path.length > 0)
    .sort();
}

/**
 * Las ofensas del árbol, una por fichero que lleve la forma.
 *
 * Se lee en `latin1` y no en `utf8` a propósito: un byte, un carácter, sin
 * pérdida ni sustituciones. Un PNG o cualquier otro binario versionado se juzga
 * con la misma regla que un fichero de texto, porque un identificador escrito
 * dentro de un binario está igual de versionado.
 *
 * Un fichero que no se puede leer es ROJO nombrándose, nunca silencio: es la
 * misma obligación de fallo cerrado que el recorrido de SPEC-009 CA-2 (ADR-016
 * §5 bis).
 */
export function telegramIdOffences(
  paths: readonly string[] = versionedTree(),
  exclusions: readonly IdScanExclusion[] = ID_SCAN_EXCLUSIONS,
): readonly string[] {
  const offences: string[] = [];

  for (const path of paths) {
    if (excludedFromIdScan(path, exclusions)) continue;

    let text: string;
    try {
      text = readFileSync(path, 'latin1');
    } catch {
      offences.push(`${path}: versioned and unreadable, which this scan refuses by construction`);
      continue;
    }

    const found = TELEGRAM_ID.exec(text);
    if (found !== null) offences.push(`${path}: looks like a telegram_user_id — ${found[0]}`);
  }

  return offences;
}
