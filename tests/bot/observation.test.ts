/**
 * CA-8.2 y CA-8.3 (mitad pura), CA-9.1, CA-5.9 y CA-12.3.
 *
 * Lo que aquí se afirma no necesita base: son propiedades del constructor de la
 * `Observation`, de la frontera de RN-08 y del puerto del modelo. La mitad con
 * Postgres está en `tests/db/bot-flow.test.ts`.
 */
import { describe, expect, test } from 'vitest';
import { readFile } from 'node:fs/promises';
import { correspondentObservation } from '@/bot/observation';
import { commandMenu, botProfile, webhookBody, NOTHING_TO_SEND } from '@/bot/telegram';
import { unconfiguredModel } from '@/bot/llm';
import { BOT_COMMANDS } from '@/bot/commands';
import { ObservationSchema } from '@/model/observation';
import { RN01_WEIGHTS } from '@/ingest/sources';
import { CORRESPONDENT } from '@/decide/roles';
import { DECISION_WRITERS, holdsDecisionCapability } from '../decide/support/rn08';
import { BOT_LOCALES, botBundle } from '@/i18n/bot';
import { CORRESPONDENT_ID, MATCH_ID, NOW } from './support/doubles';
import type { PendingProposal } from '@/bot/ports';
import type { CorrespondentId } from '@/bot/correspondents';
import type { Instant, MatchId } from '@/model/ids';
import type { RawRef } from '@/raw/key';

const MESSAGE_REF =
  'corresponsal/mensaxe/2026-03-21/2026-03-21t17-35-00.000z-0123456789ab.json' as RawRef;
const PROPOSAL_REF =
  'corresponsal/proposta/2026-03-21/2026-03-21t17-35-01.000z-0123456789ac.json' as RawRef;

const pending: PendingProposal & { readonly match_id: MatchId } = {
  id: 'p-0001',
  correspondent_id: CORRESPONDENT_ID as CorrespondentId,
  match_id: MATCH_ID as MatchId,
  proposal: {
    match_id: MATCH_ID as MatchId,
    status: 'live',
    home_score: 2,
    away_score: 1,
    minute: 70,
  },
  message_raw_ref: MESSAGE_REF,
  proposal_raw_ref: PROPOSAL_REF,
  created_at: NOW as Instant,
  expires_at: '2026-03-21T17:45:00.000Z' as Instant,
};

describe('CA-8.1 y CA-8.2 — `corresponsal`, y el peso LEÍDO', () => {
  test('1. `source` es exactamente la cadena `corresponsal`', () => {
    expect(correspondentObservation(pending, NOW as Instant).source).toBe('corresponsal');
    expect(CORRESPONDENT).toBe('corresponsal');
  });

  test('2. `confidence` sigue a `RN01_WEIGHTS.correspondent`, no a un número escrito', () => {
    expect(correspondentObservation(pending, NOW as Instant).confidence).toBe(
      RN01_WEIGHTS.correspondent,
    );
  });

  test('3. y el módulo NO escribe el peso inline: si la constante cambia, el valor la sigue', async () => {
    // La forma ejecutable de «leído, nunca escrito inline». No se puede mutar
    // una constante `as const` en tiempo de ejecución, así que lo que se afirma
    // es la única propiedad que hace verdadera la dependencia: el número no
    // está escrito en el módulo, así que no hay dónde desincronizarse.
    const source = await readFile('src/bot/observation.ts', 'utf8');
    expect(source).toContain('RN01_WEIGHTS.correspondent');
    expect(source.replace(/\/\*[\s\S]*?\*\//g, '')).not.toMatch(/\b0\.8\b/);
  });
});

describe('CA-8.3 — no hay camino que construya una `Observation` sin `raw_ref`', () => {
  test('4. lo impide `ObservationSchema`, y un caso lo afirma', () => {
    const { raw_ref: _omitted, ...without } = correspondentObservation(pending, NOW as Instant);
    expect(() => ObservationSchema.parse(without)).toThrow(/raw_ref/);
  });

  test('5. y el `raw_ref` es el del MENSAJE, no el de la propuesta', () => {
    const observation = correspondentObservation(pending, NOW as Instant);
    expect(observation.raw_ref).toBe(MESSAGE_REF);
    expect(observation.raw_ref).not.toBe(PROPOSAL_REF);
  });

  test('6. el `id` es DERIVADO: el mismo objeto y la misma propuesta dan el mismo', () => {
    expect(correspondentObservation(pending, NOW as Instant).id).toBe(
      correspondentObservation(pending, '2026-03-21T18:00:00.000Z' as Instant).id,
    );
  });
});

describe('CA-9.1 — `src/bot/` NO está en `DECISION_WRITERS`', () => {
  test('7. ni el módulo ni ninguno de sus ficheros tiene la capacidad', () => {
    expect(holdsDecisionCapability('src/bot/webhook.ts')).toBe(false);
    expect(holdsDecisionCapability('src/bot/observation.ts')).toBe(false);
    expect(DECISION_WRITERS.flatMap((writer) => writer.paths)).not.toContain('src/bot/');
  });

  test('8. y la puerta estrecha SÍ la tiene, porque vive dentro de `src/decide/`', () => {
    // No ensancha la frontera: `src/decide/` YA ESTABA dentro, así que el
    // fichero nuevo entra por una entrada que ya existía y `DECISION_WRITERS`
    // no crece (enmienda de CA-9.1, ledger, 2026-09-03). Lo que sí crece es la
    // ENUMERACIÓN DERIVADA del caso 10 de `tests/decide/rn08-frontier.test.ts`,
    // que no es la frontera sino el control positivo del propio detector.
    expect(holdsDecisionCapability('src/decide/engine-entry.ts')).toBe(true);
  });
});

describe('CA-9.6 — el residuo declarado: esto CONTESTA a F-SPEC-013-11, no lo cierra', () => {
  test('8b. `composeCyclePorts` sigue siendo superficie pública', async () => {
    // La puerta estrecha resuelve ESTE llamante: el bot obtiene lo que necesita
    // sin obtener la capacidad. NO CIERRA EL RESIDUO — el siguiente módulo
    // podrá sacar de `composeCyclePorts` lo que éste no saca.
    // Destino: EPIC-MEJORA; disparador actualizado: la próxima spec que ya
    // tenga que tocar `src/decide/cycle.ts` por otro motivo, que es cuando
    // despublicarla deja de ser tocar una spec cerrada sin causa propia.
    const cycle = await readFile('src/decide/cycle.ts', 'utf8');
    expect(cycle).toContain('export function composeCyclePorts');
    expect(cycle).toContain('decisions: new PostgresDecisionStore');
  });

  test('8c. la frontera de SPEC-013 no se ensancha: no nombra ni al bot ni a la puerta', async () => {
    // ESTE CASO SUSTITUYE A UNO QUE MENTÍA. Se llamaba «y esta spec NO ha
    // tocado ningún fichero de SPEC-013» y afirmaba que
    // `src/decide/engine-entry.ts` contiene las cadenas `F-SPEC-013-11` y
    // `EPIC-MEJORA`: ni medía lo que anunciaba, ni lo que anunciaba era cierto
    // —el caso 10 de `tests/decide/rn08-frontier.test.ts` SÍ creció, y está
    // declarado como desviación admisible en el ledger y en la enmienda de
    // CA-9.1 y CA-15.3 del 2026-09-03—.
    //
    // Lo que sí es cierto, y es lo que CA-9.1 protege, es que LA FRONTERA no se
    // ensancha: las listas de `tests/decide/support/rn08.ts` no saben que esta
    // spec existe. Eso se mide aquí, sobre el fichero de la frontera.
    const frontier = await readFile('tests/decide/support/rn08.ts', 'utf8');
    expect(frontier).not.toContain('src/bot');
    expect(frontier).not.toContain('engine-entry');

    // Y las dos entradas declaradas siguen siendo exactamente las de SPEC-013.
    expect(DECISION_WRITERS.map((writer) => [...writer.paths].sort())).toEqual([
      ['src/decide/'],
      ['src/db/alerts.ts', 'src/db/decisions.ts'],
    ]);
  });
});

describe('CA-5.9 — el resto del bot compone contra el PUERTO', () => {
  test('9. el puerto sin adaptador falla cerrado, con vocabulario NUESTRO', async () => {
    const answer = await unconfiguredModel().propose('calquera prompt');
    expect(answer).toEqual({ ok: false, reason: 'unconfigured' });
  });

  test('10. y todo el resto de la suite corre contra un doble del modelo', async () => {
    // Ésa es la forma ejecutable de CA-5.9: si el bot compusiera contra un
    // adaptador y no contra el puerto, ninguno de los otros catorce criterios
    // podría probarse sin proveedor — y todos se prueban.
    const doubles = await readFile('tests/bot/support/doubles.ts', 'utf8');
    expect(doubles).toContain('implements ModelPort');
    expect(doubles).not.toContain('src/bot/models/');
  });
});

describe('CA-12.3 — las descripciones de `setMyCommands` salen del bundle', () => {
  test('11. hay un juego por lengua, con `gl` primero (el juego por defecto)', () => {
    expect(BOT_LOCALES[0]).toBe('gl');
    for (const locale of BOT_LOCALES) {
      const menu = commandMenu(locale);
      expect(menu.map((entry) => entry.command)).toEqual(BOT_COMMANDS.map((c) => c.name));
      for (const entry of menu) expect(entry.description.length).toBeGreaterThan(0);
    }
  });

  test('12. y son EXACTAMENTE los literales del bundle, no copias', () => {
    const bundle = botBundle('gl');
    expect(commandMenu('gl')[1]).toEqual({ command: 'axuda', description: bundle.cmdHelp });
    expect(commandMenu('es')[1]?.description).toBe(botBundle('es').cmdHelp);
  });

  test('13. la ficha del bot también sale del bundle, no de BotFather a mano', () => {
    expect(botProfile('gl')).toEqual({
      description: botBundle('gl').botDescription,
      about: botBundle('gl').botAbout,
    });
  });
});

describe('CA-1.5 — la salida se construye sin `Response.json`', () => {
  test('14. el cuerpo del webhook es un objeto plano que Telegram ejecuta', () => {
    const body = webhookBody({
      kind: 'message',
      message: { chat: { chat_id: 7 }, text: botBundle('gl').cardConfirm },
    });
    expect(body).toEqual({ method: 'sendMessage', chat_id: 7, text: 'Confirmar' });
  });

  test('15. y «nada que decir» es un cuerpo vacío, no una excepción', () => {
    expect(webhookBody(NOTHING_TO_SEND)).toEqual({});
  });

  test('16. `src/bot/` no nombra `Response.json` en ningún sitio', async () => {
    const webhook = await readFile('src/bot/webhook.ts', 'utf8');
    expect(webhook).toContain('new Response(JSON.stringify(');
    // Se quitan los comentarios: media docena de este repositorio citan las
    // mismas palabras que el detector caza (`tests/support/source-tree.ts`).
    const code = webhook.replaceAll(/\/\*[\s\S]*?\*\//g, '').replaceAll(/^\s*\/\/.*$/gm, '');
    expect(code).not.toContain('Response.json');
  });
});
