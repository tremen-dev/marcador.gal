/**
 * Las fronteras de capacidad de SPEC-017, en la forma de ADR-016.
 *
 * DOS LISTAS DE MÓDULOS CON CAPACIDAD, y cada una enumera LO PERMITIDO y exige
 * que el resto sea VACÍO. No son listas de ficheros perdonados: la pregunta que
 * contestan no es «¿a éste se lo dejamos pasar?» sino «¿quién tiene, por
 * diseño, esta capacidad?». Todo lo demás es rojo, y nadie tiene que saber que
 * existe (ADR-016 §3.1 y §3.3).
 *
 * EL LECTOR SE HEREDA, NO SE ESCRIBE (ADR-016 §5 bis: UN SOLO LECTOR). Es el
 * del compilador que sostiene las fronteras de SPEC-008, SPEC-009, SPEC-013 y
 * SPEC-015, y los MECANISMOS son literalmente los de SPEC-015
 * (`tests/bot/support/frontier.ts`): `nameOffences`, `textOffences` y `holds`
 * se importan de allí, no se copian. Las raíces, exclusiones y extensiones del
 * escaneo son las que SPEC-008 CA-2.6 ya declaró: no hay una segunda lista de
 * ficheros ni una segunda idea de qué es código.
 */
import { ADMIN_OPERATORS_VARIABLE, ADMIN_SESSION_SECRET_VARIABLE } from '@/admin/session';
import type { CapabilityHolder } from '../../bot/support/frontier';

export {
  holds,
  moduleOf,
  nameOffences,
  reachableSpecifiers,
  scanned,
  textOffences,
  visibleLiteralOffences,
} from '../../bot/support/frontier';
export type { CapabilityHolder } from '../../bot/support/frontier';

/** El dominio del panel: todo lo que cuelga de aquí. */
export const ADMIN_DOMAIN = 'src/admin/';

// ─────────────────────────────────────────────────────────────────────────────
// CA-1.7 — quién puede nombrar el catálogo de operadores y el secreto de firma.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * UNA SOLA ENTRADA. `ADMIN_OPERATORS` guarda los DIGESTS de las credenciales
 * de la superficie de peso 1.0 CON PRECEDENCIA (RN-01), y `ADMIN_SESSION_SECRET`
 * es la llave con la que se firman las sesiones y los vales: quien pueda
 * nombrar cualquiera de las dos está en el camino de emitir una sesión.
 * Cualquier otro fichero que las nombre es rojo.
 */
export const ADMIN_SECRET_READERS: readonly CapabilityHolder[] = [
  {
    paths: ['src/admin/session.ts'],
    motive:
      'El cargador del catálogo y del secreto de firma. Es el único sitio que traduce una credencial ofrecida en una sesión, y todo lo demás del panel recibe el secreto YA LEÍDO, por parámetro: `ticket.ts` firma con lo que le dan y `handler.ts` lo obtiene llamando aquí, sin nombrar ninguna de las dos variables (ADR-024 §2 y §3).',
  },
];

/** LOS NOMBRES VIGILADOS. Salen del propio módulo: nunca una copia del test. */
export const ADMIN_SECRET_NAMES = [
  ADMIN_OPERATORS_VARIABLE,
  ADMIN_SESSION_SECRET_VARIABLE,
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// CA-2.3 — quién puede tener la capacidad de escribir una `Decision`.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LOS NOMBRES QUE CA-2.3 PROHÍBE EN `src/admin/`, tal y como cruzan una
 * frontera de módulo.
 *
 * Los tres primeros son los de la frontera de SPEC-013 —la implementación, el
 * error con nombre de su arbitraje de versión, y el TIPO del puerto, porque un
 * módulo que declara depender de `DecisionStore` está pidiendo la capacidad
 * aunque el inyector se la dé desde fuera— y los dos últimos son los que
 * ADR-024 §5 nombra: las dos funciones de `src/decide/` cuyo tipo de retorno SÍ
 * contiene un almacén.
 *
 * LA LISTA ES DE `src/admin/`, NO DE TODO EL REPOSITORIO: la frontera global de
 * RN-08 la sigue sosteniendo SPEC-013 CA-13, que pasa sin tocar una aserción.
 */
export const DECISION_NAMES_FORBIDDEN_IN_ADMIN = [
  'PostgresDecisionStore',
  'DecisionVersionConflictError',
  'DecisionStore',
  'applyEngine',
  'composeCyclePorts',
] as const;

/** LA TABLA `decisions` Y LAS OTRAS TRES, en una plantilla SQL de `src/admin/`. */
export const MUTATED_TABLES = ['observations', 'decisions', 'matches', 'alerts'] as const;

/**
 * MECANISMO TEXTUAL de CA-2.4, y por tanto EXPLÍCITAMENTE INSUFICIENTE.
 *
 * RESIDUO DECLARADO (ADR-016 §6, CA-2.4): NO ALCANZA A SQL COMPUESTO EN
 * EJECUCIÓN —`sql.unsafe('update ' + table)`—. Es el mismo límite que
 * SPEC-013 CA-13.3 ya declaró, en otro sitio, y no se promete más de lo que
 * ve.
 */
export function mutationOffences(
  code: string,
  path: string,
  tables: readonly string[] = MUTATED_TABLES,
): readonly string[] {
  const offences: string[] = [];

  for (const table of tables) {
    const pattern = new RegExp(`(?:update|delete\\s+from)\\s+"?${table}"?\\b`, 'i');
    if (pattern.test(code)) offences.push(`${path}: mutates \`${table}\``);
  }

  return offences;
}
