/**
 * CA-1 — el modo se declara y no se infiere.
 *
 * El test de espejo tiene dos modos (ADR-008 §3), y desde aquí se elige uno de
 * los dos **de forma explícita**: `analyzeInMode` exige `modo` y no tiene valor
 * por defecto. Un operador que olvida un flag tiene que recibir un error, no un
 * informe parecido; y como el campo es el discriminante de una unión, olvidarlo
 * no compila.
 *
 * El esquema es una **unión discriminada por `modo`**, con las dos ramas atadas
 * a lo que cada una puede decir de su referencia: un informe `sin-referencia`
 * con `referencia` no nula no valida, y uno `con-referencia` con
 * `referencia: null` tampoco.
 *
 * **Qué NO se hace aquí, y por qué.** La rama `con-referencia` es el informe de
 * SPEC-002 con el sobre del modo encima, no un informe distinto: el esquema de
 * SPEC-002 se reutiliza tal cual y su `analyze` no se toca. SPEC-002 está
 * `hecho`, su PR está verificado GREEN y CA-14 pide que su suite siga verde sin
 * cambiar una sola expectativa, así que su informe propio se sigue emitiendo
 * exactamente como se emitía. El sobre existe para que la unión de CA-1 tenga
 * las dos ramas que el criterio exige, no para reescribir a SPEC-002.
 */
import { z } from 'zod';
import { SourceIdSchema } from '@/model/ids';
import { analyze, type AnalyzeInput } from './analyze';
import { MirrorReportSchema } from './report';
import { analyzeWithoutReference, type ReferencelessAnalyzeInput } from './referenceless/analyze';
import { ReferencelessReportSchema } from './referenceless/report';

export const MirrorModeSchema = z.enum(['con-referencia', 'sin-referencia']);
export type MirrorMode = z.infer<typeof MirrorModeSchema>;

/** El informe de SPEC-002 con su modo declarado. `referencia` nunca es null. */
export const ReferencedReportSchema = MirrorReportSchema.extend({
  modo: z.literal('con-referencia'),
  referencia: SourceIdSchema,
});

export const ModalReportSchema = z.discriminatedUnion('modo', [
  ReferencedReportSchema,
  ReferencelessReportSchema,
]);

export type ReferencedReport = z.infer<typeof ReferencedReportSchema>;
export type ModalReport = z.infer<typeof ModalReportSchema>;

/**
 * El modo va dentro de la entrada y es obligatorio: no hay sobrecarga sin él ni
 * valor por defecto que lo adivine.
 */
export type ModalAnalyzeInput =
  | (AnalyzeInput & { readonly modo: 'con-referencia' })
  | (ReferencelessAnalyzeInput & { readonly modo: 'sin-referencia' });

export async function analyzeInMode(input: ModalAnalyzeInput): Promise<ModalReport> {
  if (input.modo === 'sin-referencia') {
    const { modo: _modo, ...rest } = input;
    return await analyzeWithoutReference(rest);
  }

  const { modo: _modo, ...rest } = input;
  const report = await analyze(rest);
  return ReferencedReportSchema.parse({
    ...report,
    modo: 'con-referencia',
    referencia: report.reference,
  });
}
