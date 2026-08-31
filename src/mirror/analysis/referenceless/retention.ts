/**
 * CA-15 (ADR-009) — cuándo dejan de existir las capturas que sostienen el
 * informe.
 *
 * El consumidor real de este JSON es la spec del motor, y dentro de seis meses
 * alguien lo abrirá para auditar una afirmación y tirar de sus `raw_keys`. Tras
 * la purga esas citas **no están rotas**: siguen nombrando exactamente los
 * bytes que las sostuvieron, porque la clave lleva `sha256(body)[0..12]`
 * (SPEC-001 CA-10). Lo que dejan de ser es **recuperables**. Sin este bloque,
 * quien tire de una clave y no encuentre nada no puede distinguir un archivo
 * purgado según lo previsto de un archivo perdido — que es la regla del
 * §Problema aplicada a lo que ya no se conserva. El ledger no viaja con el
 * fichero; este bloque sí.
 *
 * Tres propiedades gobiernan el módulo:
 *
 * - **El ancla es el archivo, ni el reloj ni el log.** `fin_de_ventana` es
 *   `window.end`, el mayor `fetched_at` de las capturas archivadas, que es
 *   literalmente lo que ADR-009 §2 llama fin de la ventana. Un tick fallido o
 *   omitido posterior no archiva ni un byte, así que no alarga nada de lo que
 *   hay que conservar; y la asimetría cae del lado seguro, porque anclar en el
 *   archivo da una fecha igual o anterior a la que daría el log.
 * - **Nada aquí consulta la hora.** Un informe que se compara con hoy deja de
 *   ser reproducible byte a byte y rompe CA-7 de SPEC-002. Por eso tampoco hay
 *   ningún campo tipo `ya_purgado`: el informe pone las tres fechas y el lector
 *   compara.
 * - **Las fechas son tres porque la prórroga no se puede calcular.** ADR-009 §2
 *   permite UNA prórroga escrita y motivada en el ledger, y puede escribirse
 *   después de emitir el informe. Un informe es función del archivo y no se
 *   reescribe, así que no puede conocerla: no se predice, se declara.
 */
import { canonicalInstant, instantToEpochMs } from '@/mirror/instants';
import type { Instant } from '@/model/ids';

const DAY_MS = 24 * 60 * 60 * 1000;

/** ADR-009 §2, opción B, firmada por el gate humano el 2026-08-31. */
export const ARCHIVE_RETENTION_ADR = 'ADR-009';
export const ARCHIVE_RETENTION_DAYS = 30;
export const ARCHIVE_RETENTION_EXTENSIONS = 1;
export const ARCHIVE_RETENTION_CEILING_DAYS = 90;

/** Donde viven la fecha escrita antes de capturar y el acuse de purga (§4). */
export const SPEC_003_LEDGER =
  'docs/epicas/EPIC-001-spike-ingesta/' +
  'SPEC-003-test-de-espejo-sin-referencia-el-cruce-entre-candidatas.ledger.md';

export interface ArchiveRetention {
  readonly adr: string;
  /** Idéntico a `window.end`: el mayor `fetched_at` archivado. */
  readonly fin_de_ventana: Instant;
  readonly plazo_dias: number;
  readonly purga_prevista: Instant;
  readonly prorrogas_permitidas: number;
  readonly techo_dias: number;
  /** `fin_de_ventana` + 90 días. Es dura: ninguna decisión posterior la mueve. */
  readonly purga_maxima: Instant;
  readonly nota: string;
}

/**
 * Las constantes viajan en el informe igual que los umbrales (SPEC-002 §5): si
 * mañana otro ADR supersede a ADR-009 con otro plazo, los informes ya emitidos
 * siguen diciendo bajo qué política se emitieron.
 */
export function archiveRetention(windowEnd: Instant): ArchiveRetention {
  const end = instantToEpochMs(windowEnd);
  const purga_prevista = canonicalInstant(end + ARCHIVE_RETENTION_DAYS * DAY_MS);
  const purga_maxima = canonicalInstant(end + ARCHIVE_RETENTION_CEILING_DAYS * DAY_MS);

  return {
    adr: ARCHIVE_RETENTION_ADR,
    fin_de_ventana: windowEnd,
    plazo_dias: ARCHIVE_RETENTION_DAYS,
    purga_prevista,
    prorrogas_permitidas: ARCHIVE_RETENTION_EXTENSIONS,
    techo_dias: ARCHIVE_RETENTION_CEILING_DAYS,
    purga_maxima,
    nota: retentionNote(purga_prevista, purga_maxima),
  };
}

/** Cómo se leen las tres fechas, en el propio fichero y no en el ledger. */
export function retentionNote(purgaPrevista: Instant, purgaMaxima: Instant): string {
  return (
    `Retención del archivo raw que sostiene este informe, según ${ARCHIVE_RETENTION_ADR} ` +
    `(${ARCHIVE_RETENTION_DAYS} días desde el fin de la ventana, una prórroga escrita, techo duro ` +
    `de ${ARCHIVE_RETENTION_CEILING_DAYS} días). Cómo se leen las tres fechas: ` +
    `antes de ${purgaPrevista}, las capturas citadas deberían existir; ` +
    `entre ${purgaPrevista} y ${purgaMaxima} existen SOLO si hay una prórroga escrita y motivada ` +
    `en ${SPEC_003_LEDGER} — este fichero no puede saberlo y el ledger sí, así que ` +
    `${purgaPrevista} es un suelo y no una promesa; ` +
    `después de ${purgaMaxima} no existen, y ese techo no admite prórroga: es la única de las ` +
    'tres fechas que ninguna decisión posterior puede mover. ' +
    'Este informe es función del archivo y no se reescribe, así que no puede conocer una prórroga ' +
    'posterior ni decir si la purga ya ocurrió: eso exigiría consultar el reloj y rompería la ' +
    'reproducibilidad byte a byte (SPEC-002 CA-7). El acuse de purga —fecha real, prefijos y ' +
    `número de claves borradas— vive en ${SPEC_003_LEDGER} (${ARCHIVE_RETENTION_ADR} §4). ` +
    'Las citas no quedan rotas tras la purga: la clave lleva el sha256 del cuerpo, así que siguen ' +
    'nombrando exactamente los bytes que las sostuvieron. Dejan de ser recuperables, no de ser ' +
    'verificables contra una copia.'
  );
}
