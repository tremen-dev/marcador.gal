/**
 * El informe del modo **sin referencia** (CA-1, CA-2, CA-3, CA-11, CA-12,
 * CA-15).
 *
 * Es un esquema propio y no una variante del de SPEC-002, y eso es deliberado:
 * SPEC-002 está `hecho` y su GREEN se emitió contra su texto. Aquí no se
 * reescribe nada suyo; se añade un modo. Lo que sí cambia respecto de aquel es
 * todo lo que dejó de tener sentido al quitar la referencia, y cada cambio
 * obedece a la misma regla:
 *
 * > **«No lo hemos comprobado» tiene que ser distinguible de «no lo había».**
 * > Un `false`, un `0`, una lista vacía o una clave ausente son todos
 * > indistinguibles de una medición que salió negativa. Lo no medido se
 * > **declara**, con nombre propio y valor propio.
 *
 * De ahí, campo por campo:
 *
 * - `sources` (los dos veredictos contra futgal) no es una lista vacía ni dos
 *   INCONCLUSO: es `veredictos_por_candidata`, con estado `no_medidos` y el
 *   motivo entero (CA-2).
 * - `origen_comun_distinto_de_futgal` **no existe**, y tampoco los contadores
 *   que lo alimentaban: con futgal ausente, «ausentes de futgal» sería el total
 *   dicho como si se hubiese mirado. En su lugar van `origen_comun_probado`,
 *   `atribucion_de_origen: 'no_comprobada'` y `origen_atribuido_a: null` (CA-3).
 * - El veredicto excluye INDEPENDIENTE del propio tipo, y la bandera de RN-02 es
 *   el literal `false`: `true` no es representable (CA-4, CA-5).
 * - `espejo_de` es `null` siempre: nombrar origen es una atribución (CA-7).
 * - La advertencia de la métrica de conflictos deja de ser nulable (CA-12), y el
 *   bloque de retención es obligatorio y no nulable (CA-15).
 *
 * El esquema es **estricto en las dos direcciones**, como el de SPEC-002: una
 * clave de más falla exactamente igual que una de menos (SPEC-001 CA-14).
 */
import { z } from 'zod';
import { InstantSchema, MatchIdSchema, SourceIdSchema } from '@/model/ids';
import {
  EventEvidenceSchema,
  HalfStateSchema,
  PairTemporalCountersSchema,
  PersistentDiscrepancyEvidenceSchema,
  SpellingDivergenceEvidenceSchema,
  ThresholdsSchema,
  WindowReportSchema,
} from '../report';

/** CA-1. El modo se declara; no se infiere de la ausencia de una clave. */
export const REFERENCELESS_MODE = 'sin-referencia';

/** CA-4. El dominio de veredictos de este modo, y no hay un tercero. */
export const ReferencelessVerdictSchema = z.enum(['ESPEJO', 'INCONCLUSO']);

/** Los seis motivos de la regla de decisión de CA-6, en su orden. */
export const ReferencelessReasonSchema = z.enum([
  'muestra_insuficiente',
  'error_replicado',
  'independencia_no_demostrable_sin_referencia',
  'sin_contenido_propio',
  'adelantos_en_una_sola_direccion',
  'sin_senal',
]);

/**
 * CA-15.2. `end` deja de ser nulable: por CA-5 de SPEC-002 y CA-8 de esta, una
 * ventana válida tiene capturas, y una fecha de purga `null` sería justo el
 * valor indistinguible de «no lo hemos comprobado».
 */
export const ReferencelessWindowSchema = WindowReportSchema.extend({
  end: InstantSchema,
});

/**
 * CA-3. El error replicado de este modo NO lleva `also_in_reference`: ese campo
 * se computaba contra las firmas de futgal, que aquí no existen, y con el
 * conjunto vacío diría «ausente de futgal» de todo sin haber mirado a futgal.
 */
export const ReferencelessReplicatedErrorEvidenceSchema = z.strictObject({
  match_id: MatchIdSchema,
  wrong: z.string(),
  corrected: z.string(),
  raw_keys: z.array(z.string().min(1)).length(4),
});

export const ReferencelessEvidenceSchema = z.strictObject({
  leads: z.array(EventEvidenceSchema),
  exclusives: z.array(EventEvidenceSchema),
  replicated_errors: z.array(ReferencelessReplicatedErrorEvidenceSchema),
  persistent_discrepancies: z.array(PersistentDiscrepancyEvidenceSchema),
  /** CA-15.4 de SPEC-002, heredado: se registra y no dicta. */
  spelling_divergences: z.array(SpellingDivergenceEvidenceSchema),
});

export const ReferencelessPairCountersSchema = z.strictObject({
  n_comparable: z.int(),
  n_min: z.int(),
  exclusive_to_first: z.int(),
  exclusive_to_second: z.int(),
  replicated_errors_total: z.int(),
  persistent_discrepancies: z.int(),
  spelling_divergences: z.int(),
  /** `null` mientras la mitad temporal siga pendiente. */
  temporal: PairTemporalCountersSchema.nullable(),
});

export const ReferencelessPairReportSchema = z.strictObject({
  /** `candidatas` y no `sources`: aquí ninguna es «la fuente» (CA-2). */
  candidatas: z.tuple([SourceIdSchema, SourceIdSchema]),
  verdict: ReferencelessVerdictSchema,
  reason: ReferencelessReasonSchema,
  /** CA-5. El literal, no el booleano: `true` no es representable. */
  rn02_segunda_via_entre_automaticas: z.literal(false),
  mirror_indication: z.boolean(),
  /** CA-7. Null en todos los desenlaces. */
  espejo_de: z.null(),
  /** CA-3.1. */
  origen_comun_probado: z.boolean(),
  /** CA-3.2. */
  atribucion_de_origen: z.literal('no_comprobada'),
  /** CA-3.3. */
  origen_atribuido_a: z.null(),
  counters: ReferencelessPairCountersSchema,
  evidence: ReferencelessEvidenceSchema,
  prose: z.string().min(1),
});

/**
 * CA-2. En el lugar que SPEC-002 ocupa con `sources`.
 *
 * No una lista vacía —que se lee como «se midió y no salió nada»—, no dos
 * INCONCLUSO —que se leen como «se midió y fue indeciso»— y no la clave
 * ausente. Las tres harían que alguien sacase conclusiones sobre futgal a
 * partir de una ventana en la que futgal no aparece.
 */
export const UnmeasuredCandidateVerdictsSchema = z.strictObject({
  estado: z.literal('no_medidos'),
  referencia_prevista: z.literal('futgal'),
  motivo: z.string().min(1),
  /** La fecha del dictamen de `sdd-legal-datos`. */
  dictamen: z.string().min(1),
});

/** CA-11. Una afirmación con su identificador estable y su texto en castellano. */
export const DeclaredLimitationSchema = z.strictObject({
  id: z.string().min(1),
  texto: z.string().min(1),
});

/**
 * CA-12. Aquí la advertencia no es nulable: en SPEC-002 era condicional porque
 * había un escenario en que la métrica sí medía lo que dice, y aquí no lo hay.
 * Una advertencia condicional cuya condición es siempre verdadera es una
 * advertencia que alguien acabará creyendo que a veces no aplica.
 */
export const ReferencelessConflictWarningSchema = z.strictObject({
  metric: z.literal('conflictos'),
  hard_cut_15_percent_applies: z.literal(false),
  text: z.string().min(1),
});

/** CA-15. Las ocho claves de ADR-009, todas derivadas del propio archivo. */
export const ArchiveRetentionSchema = z.strictObject({
  adr: z.literal('ADR-009'),
  fin_de_ventana: InstantSchema,
  plazo_dias: z.int(),
  purga_prevista: InstantSchema,
  prorrogas_permitidas: z.int(),
  techo_dias: z.int(),
  purga_maxima: InstantSchema,
  nota: z.string().min(1),
});

export const ReferencelessReportSchema = z.strictObject({
  spec: z.literal('SPEC-003'),
  modo: z.literal(REFERENCELESS_MODE),
  /** CA-1. No nulable «por si acaso»: `null` es el único valor posible aquí. */
  referencia: z.null(),
  window: ReferencelessWindowSchema,
  thresholds: ThresholdsSchema,
  halves: z.strictObject({
    content: HalfStateSchema,
    temporal: HalfStateSchema,
    planned_temporal_window: z.string().min(1).nullable(),
  }),
  veredictos_por_candidata: UnmeasuredCandidateVerdictsSchema,
  pair: ReferencelessPairReportSchema,
  conflict_metric_warning: ReferencelessConflictWarningSchema,
  limitaciones_declaradas: z.array(DeclaredLimitationSchema).min(5),
  retencion_del_archivo: ArchiveRetentionSchema,
  prose: z.string().min(1),
});

export type ReferencelessReport = z.infer<typeof ReferencelessReportSchema>;
export type ReferencelessPairReport = z.infer<typeof ReferencelessPairReportSchema>;
export type DeclaredLimitation = z.infer<typeof DeclaredLimitationSchema>;

/**
 * CA-2. El texto entero, porque el lector de dentro de seis meses no tiene este
 * contexto y el ledger no viaja con el fichero.
 */
export const UNMEASURED_CANDIDATE_VERDICTS: z.infer<typeof UnmeasuredCandidateVerdictsSchema> = {
  estado: 'no_medidos',
  referencia_prevista: 'futgal',
  motivo:
    'No medidos, y no «medidos sin resultado»: futgal no se capturó en esta ventana. ' +
    'https://www.futgal.es/robots.txt termina en «User-agent: *» / «Disallow: /», nuestro ' +
    'user-agent cae en el comodín y RN-11 obliga a respetarlo, igual que el no-negociable de ' +
    'legalidad de FOUNDATION.md. Sin capturas de futgal no hay contra qué medir a cada ' +
    'candidata: una lista vacía se leería como «se midió y no salió nada» y dos INCONCLUSO ' +
    'como «se midió y fue indeciso», y las dos harían sacar conclusiones sobre futgal a partir ' +
    'de una ventana en la que futgal no aparece.',
  dictamen: '2026-08-31',
};

/**
 * CA-12. Texto propio del modo, y a propósito distinto del de SPEC-002: allí la
 * advertencia decía que ninguna candidata había salido INDEPENDIENTE; aquí dice
 * que **ninguna se ha medido** contra la fuente oficial, que es un enunciado
 * más fuerte y lo incluye.
 */
export const REFERENCELESS_CONFLICT_WARNING_TEXT =
  'La métrica de conflictos de EPIC-001 no se puede leer sobre esta ventana: su denominador ya ' +
  'no incluye a la fuente oficial. No es que ninguna candidata haya resultado INDEPENDIENTE de ' +
  'futgal — es que ninguna se ha medido contra ella, porque futgal no se capturó (robots.txt, ' +
  'RN-11). El corte duro del 15 % NO aplica sobre esta ventana, y esta advertencia es ' +
  'incondicional: no hay ningún desenlace de este modo en que la métrica mida lo que su nombre ' +
  'dice.';

export const REFERENCELESS_CONFLICT_WARNING: z.infer<
  typeof ReferencelessConflictWarningSchema
> = {
  metric: 'conflictos',
  hard_cut_15_percent_applies: false,
  text: REFERENCELESS_CONFLICT_WARNING_TEXT,
};

/**
 * CA-11. Las cinco preguntas que este informe NO responde, en el JSON y —por
 * `prose`— en castellano corrido. Escribirlo en el ledger no basta: el ledger
 * no viaja con el fichero, y quien abra `hallazgos/` dentro de seis meses no
 * tendrá este contexto.
 */
export const DECLARED_LIMITATIONS: readonly DeclaredLimitation[] = [
  {
    id: 'espejo_de_futgal_no_medido',
    texto:
      'No se ha medido si alguna candidata es espejo de futgal. Futgal no se capturó en esta ' +
      'ventana: su robots.txt lo prohíbe («User-agent: *» / «Disallow: /») y RN-11 obliga a ' +
      'respetarlo. Nada de este informe dice nada sobre la relación de ninguna candidata con la ' +
      'fuente oficial.',
  },
  {
    id: 'origen_comun_sin_atribuir',
    texto:
      'Un origen común probado queda sin atribuir: se sabe que lo hay, no de quién. Probar que ' +
      'dos fuentes derivan de una tercera y decir cuál es esa tercera son cosas distintas, y ' +
      'este modo solo puede hacer la primera — atribuir exige observar a la tercera.',
  },
  {
    id: 'independiente_no_emitible',
    texto:
      'Este modo no puede emitir INDEPENDIENTE, así que la ausencia de ese veredicto NO es ' +
      'evidencia de dependencia. Un espejo sí puede adelantar a otro espejo; lo que no puede es ' +
      'adelantar a su origen, y sin la referencia el adelanto mutuo queda solo y es compatible ' +
      'con dos hermanas de un origen que no hemos mirado.',
  },
  {
    id: 'metrica_de_conflictos_no_legible',
    texto:
      'La métrica de conflictos de EPIC-001 no se puede leer sobre esta ventana, ni siquiera con ' +
      'la advertencia de SPEC-002 CA-13: su denominador ya no incluye a la fuente oficial. Es un ' +
      'enunciado más fuerte que aquella advertencia y la incluye.',
  },
  {
    id: 'latencia_cobertura_operacion_no_medidas',
    texto:
      'Latencia, cobertura y minutos de operación manual de EPIC-001 no se miden aquí. La ' +
      'cobertura, en particular, no tiene contra qué medirse: no hay calendario oficial ' +
      'capturado en esta ventana.',
  },
];
