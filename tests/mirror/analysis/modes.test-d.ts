/**
 * CA-1 y CA-4, a nivel de TIPO. La prueba invertida: si el invariante deja de
 * sostenerse, la directiva `@ts-expect-error` queda sin usar y `tsc` falla.
 *
 * - **CA-1.** El punto de entrada del análisis exige el modo de forma
 *   explícita: no hay valor por defecto. Un operador que olvida el flag tiene
 *   que recibir un error, no un informe silenciosamente distinto.
 * - **CA-4.** El tipo del campo veredicto de este modo excluye
 *   `'INDEPENDIENTE'`, de modo que emitirlo **no compila**. La declaración
 *   *load-bearing* que el gate firmó no depende de que nadie escriba mal una
 *   rama: no hay rama que escribir.
 */
import { analyzeInMode } from '@/mirror/analysis/mode';
import type { ModalAnalyzeInput } from '@/mirror/analysis/mode';
import type { ReferencelessReport } from '@/mirror/analysis/referenceless/report';
import type { ReferencelessVerdict } from '@/mirror/analysis/referenceless/verdict';
import type { Verdict } from '@/mirror/analysis/report';

declare const referencelessInput: Omit<
  Extract<ModalAnalyzeInput, { modo: 'sin-referencia' }>,
  'modo'
>;

/** Declarado: compila. */
export const declared = () => analyzeInMode({ ...referencelessInput, modo: 'sin-referencia' });

// @ts-expect-error CA-1: sin `modo` no hay análisis. No hay valor por defecto.
export const undeclared = () => analyzeInMode({ ...referencelessInput });

// @ts-expect-error CA-1: y un modo que no existe tampoco cuela.
export const invented = () => analyzeInMode({ ...referencelessInput, modo: 'a-medias' });

declare const report: ReferencelessReport;

/** CA-4: los dos veredictos emitibles, y no hay un tercero. */
const espejo: ReferencelessVerdict = 'ESPEJO';
const inconcluso: ReferencelessVerdict = 'INCONCLUSO';

// @ts-expect-error CA-4: INDEPENDIENTE no es emitible en este modo.
const independiente: ReferencelessVerdict = 'INDEPENDIENTE';

// @ts-expect-error CA-4: tampoco por la puerta del informe.
const fromReport: typeof report.pair.verdict = 'INDEPENDIENTE';

/** Y el dominio de SPEC-002 sí lo tiene: los dos modos no son el mismo. */
const withReference: Verdict = 'INDEPENDIENTE';

/** CA-5: la bandera es el literal `false`; `true` no es asignable. */
// @ts-expect-error
const flag: typeof report.pair.rn02_segunda_via_entre_automaticas = true;

/** CA-7: `espejo_de` es `null` y nada más. */
// @ts-expect-error
const mirrorOf: typeof report.pair.espejo_de = 'ceroacero';

export const assertions = [
  espejo,
  inconcluso,
  independiente,
  fromReport,
  withReference,
  flag,
  mirrorOf,
];
