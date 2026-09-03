/**
 * CA-1, CA-2 (mitad de comportamiento), CA-4, CA-5.2/5.6, CA-6, CA-7 (con
 * dobles), CA-11, CA-13 y CA-14.
 *
 * La afirmación de CA-7.1 CONTRA LA BASE vive en `tests/db/bot-flow.test.ts`,
 * como pide el punto 3 de «Para el verificador» del ledger. Aquí se prueba el
 * camino entero con dobles, que es lo único posible mientras el bot esté
 * apagado (ADR-022, *Consecuencias negativas*).
 */
import { describe, expect, test } from 'vitest';
import { handleUpdate, telegramWebhookHandler, SECRET_HEADER, constantTimeEquals } from '@/bot/webhook';
import { confirmData, discardData, chooseData, languageData } from '@/bot/card';
import { CORRESPONDENT_ARCHIVE_PREFIX, ARCHIVE_EVENT_KINDS } from '@/bot/archive';
import { botBundle } from '@/i18n/bot';
import { COMPETITION, OTHER_COMPETITION } from './support/doubles';
import {
  CORRESPONDENT_ID,
  FOREIGN_MATCH_ID,
  INACTIVE_SENDER_ID,
  MATCH_ID,
  NOW,
  SECOND_SENDER_ID,
  SENDER_ID,
  UNKNOWN_SENDER_ID,
  jsonAnswer,
  rawAnswer,
  scene,
} from './support/doubles';
import {
  FIXTURE_FIRST_NAME,
  FIXTURE_LAST_NAME,
  FIXTURE_USERNAME,
  telegramCallbackUpdate,
  telegramMessageUpdate,
} from '../fixtures/telegram';
import type { CorrespondentId } from '@/bot/correspondents';
import type { Outbound } from '@/bot/telegram';

const GL = botBundle('gl');
const ES = botBundle('es');

const textOf = (outbound: Outbound): string =>
  outbound.kind === 'message' ? outbound.message.text : '';

const keyboardOf = (outbound: Outbound) =>
  outbound.kind === 'message' ? (outbound.message.keyboard ?? []) : [];

// ─────────────────────────────────────────────────────────────────────────────
// CA-1 — el webhook rechaza antes de tocar el cuerpo, y falla cerrado.
// ─────────────────────────────────────────────────────────────────────────────

function post(body: unknown, headers: Readonly<Record<string, string>> = {}): Request {
  return new Request('https://marcador.gal/api/telegram/webhook', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

describe('CA-1.1 — sin secreto configurado, 401 sin invocar NADA del bot', () => {
  test('1. variable ausente: 401 y todos los dobles sin llamar', async () => {
    const world = scene();
    const handler = telegramWebhookHandler({ ports: world.ports, env: {} });

    const response = await handler(post(telegramMessageUpdate(), { [SECRET_HEADER]: 'x' }));

    expect(response.status).toBe(401);
    expect(world.log.calls).toEqual([]);
    expect(world.store.size).toBe(0);
    expect(world.proposals.rows.size).toBe(0);
    expect(world.observations.rows).toEqual([]);
    expect(world.rejections.total).toBe(0);
    expect(world.model.calls).toBe(0);
  });

  test('2. variable vacía: lo mismo. Es fallo CERRADO, no un modo degradado', async () => {
    const world = scene();
    const handler = telegramWebhookHandler({
      ports: world.ports,
      env: { TELEGRAM_WEBHOOK_SECRET: '' },
    });

    expect((await handler(post(telegramMessageUpdate(), { [SECRET_HEADER]: '' }))).status).toBe(401);
    expect(world.log.calls).toEqual([]);
  });
});

describe('CA-1.2 — la comparación es de tiempo constante', () => {
  test('3. cabecera distinta ⇒ 401', async () => {
    const world = scene();
    const handler = telegramWebhookHandler({
      ports: world.ports,
      env: { TELEGRAM_WEBHOOK_SECRET: 'segredo-bo' },
    });

    const response = await handler(post(telegramMessageUpdate(), { [SECRET_HEADER]: 'segredo-ma' }));
    expect(response.status).toBe(401);
  });

  test('4. `constantTimeEquals` decide igual que `===` y no corta por longitud', () => {
    expect(constantTimeEquals('abc', 'abc')).toBe(true);
    expect(constantTimeEquals('abc', 'abd')).toBe(false);
    expect(constantTimeEquals('abc', 'ab')).toBe(false);
    expect(constantTimeEquals('', '')).toBe(true);
    expect(constantTimeEquals('a', '')).toBe(false);
    // Un prefijo correcto no acierta: es la mitad que un `===` sí regalaría.
    expect(constantTimeEquals('segredo', 'segredo-longo')).toBe(false);
  });
});

describe('CA-1.3 — un update con secreto inválido no deja rastro', () => {
  test('5. cero objetos crudos, cero filas y ningún identificador en la traza', async () => {
    const world = scene();
    const handler = telegramWebhookHandler({
      ports: world.ports,
      env: { TELEGRAM_WEBHOOK_SECRET: 'segredo-bo' },
    });

    await handler(post(telegramMessageUpdate(), { [SECRET_HEADER]: 'falso' }));

    expect(await world.store.list('')).toEqual([]);
    expect(world.proposals.rows.size).toBe(0);
    expect(world.state.rows.size).toBeLessThanOrEqual(2); // solo el aviso sembrado
    expect(world.observations.rows).toEqual([]);
    expect(world.rejections.total).toBe(0);
    expect(world.log.calls).toEqual([]);
  });
});

describe('CA-1.4 y CA-1.5 — método, cuerpo y la forma de la respuesta', () => {
  test('6. método distinto de POST ⇒ error sin archivar nada', async () => {
    const world = scene();
    const handler = telegramWebhookHandler({
      ports: world.ports,
      env: { TELEGRAM_WEBHOOK_SECRET: 's' },
    });

    const response = await handler(
      new Request('https://marcador.gal/api/telegram/webhook', {
        method: 'GET',
        headers: { [SECRET_HEADER]: 's' },
      }),
    );

    expect(response.status).toBe(405);
    expect(world.store.size).toBe(0);
  });

  test('7. cuerpo que no parsea como JSON ⇒ error sin archivar nada', async () => {
    const world = scene();
    const handler = telegramWebhookHandler({
      ports: world.ports,
      env: { TELEGRAM_WEBHOOK_SECRET: 's' },
    });

    const response = await handler(
      new Request('https://marcador.gal/api/telegram/webhook', {
        method: 'POST',
        headers: { [SECRET_HEADER]: 's', 'content-type': 'application/json' },
        body: 'isto non é json',
      }),
    );

    expect(response.status).toBe(400);
    expect(world.store.size).toBe(0);
  });

  test('8. la respuesta lleva el cuerpo que Telegram ejecuta, y es JSON válido', async () => {
    const world = scene();
    const handler = telegramWebhookHandler({
      ports: world.ports,
      env: { TELEGRAM_WEBHOOK_SECRET: 's' },
    });

    const response = await handler(post(telegramMessageUpdate(), { [SECRET_HEADER]: 's' }));
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/json');
    expect(body['method']).toBe('sendMessage');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CA-2 — la lista cerrada de corresponsales.
// ─────────────────────────────────────────────────────────────────────────────

describe('CA-2.1 y CA-2.2 — el remitente no autorizado no deja rastro', () => {
  test('9. no mapeado: frase neutra, cero archivo, cero filas, +1 contador', async () => {
    const world = scene();
    const outbound = await handleUpdate(
      telegramMessageUpdate({ senderId: UNKNOWN_SENDER_ID }),
      world.ports,
    );

    expect(textOf(outbound)).toBe(GL.errNotAuthorised);
    expect(await world.store.list('')).toEqual([]);
    expect(world.proposals.rows.size).toBe(0);
    expect(world.observations.rows).toEqual([]);
    expect(world.model.calls).toBe(0);
    expect(world.rejections.counts.get('unauthorised')).toBe(1);
  });

  test('10. mapeado pero NO ACTIVO: la MISMA cadena, y nada más', async () => {
    const world = scene();
    const outbound = await handleUpdate(
      telegramMessageUpdate({ senderId: INACTIVE_SENDER_ID }),
      world.ports,
    );

    expect(textOf(outbound)).toBe(GL.errNotAuthorised);
    expect(world.store.size).toBe(0);
  });

  test('11. dado de baja: la MISMA cadena que los otros dos', async () => {
    const world = scene();
    await world.ports.state.optOut(CORRESPONDENT_ID as CorrespondentId, NOW);

    const outbound = await handleUpdate(telegramMessageUpdate(), world.ports);

    expect(textOf(outbound)).toBe(GL.errNotAuthorised);
    expect(world.store.size).toBe(0);
    expect(world.observations.rows).toEqual([]);
  });

  test('12. el contador es AGREGADO: no hay sitio donde meter a nadie', async () => {
    const world = scene();
    await handleUpdate(telegramMessageUpdate({ senderId: UNKNOWN_SENDER_ID }), world.ports);
    await handleUpdate(telegramMessageUpdate({ senderId: INACTIVE_SENDER_ID }), world.ports);

    expect([...world.rejections.counts.keys()]).toEqual(['unauthorised']);
    expect(world.rejections.counts.get('unauthorised')).toBe(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CA-13 — el bot nace apagado.
// ─────────────────────────────────────────────────────────────────────────────

describe('CA-13 — fuera de una jornada de medición declarada no recoge nada', () => {
  test('13. con la lista de PRODUCCIÓN, que está vacía: cero de todo', async () => {
    // ADR-023 §1: es la forma ejecutable de «esta spec entrega un bot apagado».
    // No es un modo de error: es el estado en el que nace.
    const world = scene({ windows: [] });

    const outbound = await handleUpdate(telegramMessageUpdate(), world.ports);

    expect(textOf(outbound)).toBe(GL.errNoOpenMatch);
    expect(await world.store.list('')).toEqual([]);
    expect(world.proposals.rows.size).toBe(0);
    expect(world.observations.rows).toEqual([]);
    expect(world.rejections.counts.get('out_of_matchday')).toBe(1);
  });

  test('14. y NI UNA LLAMADA al modelo: cuesta dinero y sale del proceso', async () => {
    const world = scene({ windows: [] });
    await handleUpdate(telegramMessageUpdate(), world.ports);
    expect(world.model.calls).toBe(0);
    expect(world.log.calls).toEqual([]);
  });

  test('15. con una jornada INYECTADA, el mismo mensaje recorre el camino entero', async () => {
    const world = scene();
    const outbound = await handleUpdate(telegramMessageUpdate(), world.ports);

    expect(world.model.calls).toBe(1);
    expect(world.proposals.rows.size).toBe(1);
    expect(textOf(outbound)).toContain(GL.cardHeading);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CA-4 — RN-10: los tres objetos crudos, y el ORDEN.
// ─────────────────────────────────────────────────────────────────────────────

describe('CA-4 — archivo antes de parsear, y los dos colgantes declarados', () => {
  test('16. el `put` del mensaje termina ANTES de que se llame al modelo', async () => {
    const world = scene();
    await handleUpdate(telegramMessageUpdate(), world.ports);

    expect(world.log.indexOf('put:mensaxe')).toBeGreaterThanOrEqual(0);
    expect(world.log.indexOf('put:mensaxe')).toBeLessThan(world.log.indexOf('model'));
  });

  test('17. y el `put` de la respuesta del modelo, ANTES de validarla con zod', async () => {
    const world = scene();
    await handleUpdate(telegramMessageUpdate(), world.ports);

    expect(world.log.calls).toEqual(['put:mensaxe', 'model', 'put:proposta']);
  });

  test('18. los TRES objetos se archivan en el camino completo', async () => {
    const world = scene();
    await handleUpdate(telegramMessageUpdate(), world.ports);
    const [pending] = [...world.proposals.rows.values()];
    expect(pending).toBeDefined();
    if (pending === undefined) return;

    await handleUpdate(telegramCallbackUpdate(confirmData(pending.id)), world.ports);

    const keys = await world.store.list('');
    expect(keys.length).toBe(3);
    expect(world.log.count('put:confirmacion')).toBe(1);
  });

  test('19. las claves empiezan por `corresponsal/` y su segundo segmento es del CATÁLOGO', async () => {
    const world = scene();
    await handleUpdate(telegramMessageUpdate(), world.ports);

    const keys = await world.store.list('');
    expect(keys.length).toBeGreaterThan(0);
    for (const key of keys) {
      expect(key.startsWith(CORRESPONDENT_ARCHIVE_PREFIX)).toBe(true);
      const second = key.split('/')[1];
      expect(ARCHIVE_EVENT_KINDS as readonly string[]).toContain(second);
      // Y NUNCA una competición real: no se conoce antes de parsear (ADR-022 §3).
      expect(second).not.toBe(COMPETITION);
      expect(second).not.toBe(OTHER_COMPETITION);
    }
  });

  test('20. la `Observation` cita el objeto del MENSAJE, y ese objeto existe', async () => {
    const world = scene();
    await handleUpdate(telegramMessageUpdate(), world.ports);
    const [pending] = [...world.proposals.rows.values()];
    if (pending === undefined) throw new Error('no pending proposal');

    await handleUpdate(telegramCallbackUpdate(confirmData(pending.id)), world.ports);

    const observation = world.observations.rows[0];
    expect(observation).toBeDefined();
    expect(observation?.raw_ref).toBe(pending.message_raw_ref);
    expect(await world.store.get(pending.message_raw_ref)).not.toBeNull();
    expect(pending.message_raw_ref.startsWith('corresponsal/mensaxe/')).toBe(true);
  });

  test('21. y los otros dos objetos NO tienen ninguna `Observation` que los cite', async () => {
    // RESULTADO ESPERADO, no tolerancia (CA-4.3), con el precedente de
    // ADR-020 §4 en la dirección contraria.
    const world = scene();
    await handleUpdate(telegramMessageUpdate(), world.ports);
    const [pending] = [...world.proposals.rows.values()];
    if (pending === undefined) throw new Error('no pending proposal');

    await handleUpdate(telegramCallbackUpdate(confirmData(pending.id)), world.ports);

    const cited = new Set(world.observations.rows.map((row) => row.raw_ref));
    const keys = await world.store.list('');
    const dangling = keys.filter((key) => !cited.has(key as never));

    expect(dangling.length).toBe(2);
    expect(dangling.some((key) => key.startsWith('corresponsal/proposta/'))).toBe(true);
    expect(dangling.some((key) => key.startsWith('corresponsal/confirmacion/'))).toBe(true);
  });

  test('22. un mensaje que NO llega a propuesta deja igualmente su objeto archivado', async () => {
    const world = scene({ answer: rawAnswer('isto non é json') });

    const outbound = await handleUpdate(telegramMessageUpdate(), world.ports);

    expect(textOf(outbound)).toBe(GL.errNotUnderstood);
    expect((await world.store.list('corresponsal/mensaxe/')).length).toBe(1);
    expect(world.observations.rows).toEqual([]);
    expect(world.proposals.rows.size).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CA-5 — lo que se puede probar del modelo contra un doble.
// ─────────────────────────────────────────────────────────────────────────────

describe('CA-5.2 y CA-5.3 — el prompt no transporta identidad', () => {
  test('23. las tres cadenas del fixture no aparecen en el prompt renderizado', async () => {
    const world = scene();
    await handleUpdate(telegramMessageUpdate(), world.ports);

    const prompt = world.model.prompts[0] ?? '';
    expect(prompt.length).toBeGreaterThan(0);
    expect(prompt).not.toContain(FIXTURE_FIRST_NAME);
    expect(prompt).not.toContain(FIXTURE_LAST_NAME);
    expect(prompt).not.toContain(FIXTURE_USERNAME);
    expect(prompt).not.toContain(CORRESPONDENT_ID);
    expect(prompt).not.toContain(`${SENDER_ID}`);
  });

  test('24. el contexto de candidatos NO va indexado por persona', async () => {
    const world = scene();
    await handleUpdate(telegramMessageUpdate(), world.ports);

    const prompt = world.model.prompts[0] ?? '';
    expect(prompt).toContain(MATCH_ID);
    expect(prompt).toContain('UD Ourense');
    expect(prompt.toLowerCase()).not.toContain('corresponsal');
  });

  test('25. y el texto de la persona SÍ viaja: es el residuo declarado (CA-5.8)', async () => {
    // No alcanza a que el corresponsal escriba su propio nombre dentro del
    // texto. Es suyo y es inevitable; se trata en el aviso (CA-14.3).
    const world = scene();
    await handleUpdate(telegramMessageUpdate({ text: '2-1, asina Alberto' }), world.ports);
    expect(world.model.prompts[0] ?? '').toContain('asina Alberto');
  });
});

describe('CA-5.6 — las cinco formas de rechazo, y ninguna llega a la tarjeta', () => {
  const cases: readonly [string, unknown][] = [
    ['salida que no parsea', 'JSON roto {'],
    [
      '`match_id` que no está entre los candidatos',
      { match_id: FOREIGN_MATCH_ID, status: 'live', home_score: 1, away_score: 0, minute: 10 },
    ],
    [
      'marcador negativo',
      { match_id: MATCH_ID, status: 'live', home_score: -1, away_score: 0, minute: 10 },
    ],
    [
      'estado fuera de `MATCH_STATUSES`',
      { match_id: MATCH_ID, status: 'cancelado', home_score: 1, away_score: 0, minute: 10 },
    ],
    [
      'marcador presente en una rama sin marcador',
      { match_id: MATCH_ID, status: 'postponed', home_score: 1, away_score: 0, minute: null },
    ],
  ];

  for (const [name, payload] of cases) {
    test(`26. ${name}: aviso y CERO filas`, async () => {
      const world = scene({
        answer: typeof payload === 'string' ? rawAnswer(payload) : jsonAnswer(payload),
      });

      const outbound = await handleUpdate(telegramMessageUpdate(), world.ports);

      expect([GL.errNotUnderstood, GL.errMatchNotFound]).toContain(textOf(outbound));
      expect(world.observations.rows).toEqual([]);
      expect(world.proposals.rows.size).toBe(0);
    });
  }

  test('27. basura PLAUSIBLE —JSON bien formado con un partido inventado— también cae', async () => {
    // Cuanto más débil sea el modelo, más trabaja esta validación: tiene que
    // caer aquí, NO en la tarjeta de confirmación (ADR-022 §6). Esto no es JSON
    // roto: es una respuesta impecable que se inventa un partido.
    const world = scene({
      answer: jsonAnswer({
        match_id: 'futgal-preferente-g1-2026-27-j23-inventado',
        status: 'live',
        home_score: 3,
        away_score: 2,
        minute: 88,
      }),
    });

    const outbound = await handleUpdate(telegramMessageUpdate(), world.ports);

    expect(textOf(outbound)).toBe(GL.errMatchNotFound);
    expect(textOf(outbound)).not.toContain(GL.cardHeading);
    expect(world.proposals.rows.size).toBe(0);
    expect(world.observations.rows).toEqual([]);
  });

  test('28. el modelo sin adaptador falla CERRADO y no escribe nada', async () => {
    const world = scene({ answer: { ok: false, reason: 'unconfigured' } });

    const outbound = await handleUpdate(telegramMessageUpdate(), world.ports);

    expect(textOf(outbound)).toBe(GL.errServiceDown);
    expect(world.observations.rows).toEqual([]);
    expect(world.proposals.rows.size).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CA-6 — la lista cerrada de candidatos.
// ─────────────────────────────────────────────────────────────────────────────

describe('CA-6 — la identidad del partido sale de los candidatos', () => {
  test('29. un `match_id` real de OTRA competición se rechaza igual', async () => {
    const world = scene({
      answer: jsonAnswer({
        match_id: FOREIGN_MATCH_ID,
        status: 'live',
        home_score: 1,
        away_score: 0,
        minute: 10,
      }),
    });

    const outbound = await handleUpdate(telegramMessageUpdate(), world.ports);

    expect(textOf(outbound)).toBe(GL.errMatchNotFound);
    expect(world.proposals.rows.size).toBe(0);
  });

  test('30. la tarjeta muestra el nombre CANÓNICO, no lo que escribió la persona', async () => {
    const world = scene();
    const outbound = await handleUpdate(
      telegramMessageUpdate({ text: 'ourense 2-1 celta, minuto 70' }),
      world.ports,
    );

    expect(textOf(outbound)).toContain('UD Ourense - Celta B');
    expect(textOf(outbound)).not.toContain('ourense 2-1 celta');
  });

  test('31. más de un candidato sin identificar ⇒ teclado, y CERO `Observation`', async () => {
    const world = scene({
      answer: jsonAnswer({
        match_id: null,
        status: 'live',
        home_score: 2,
        away_score: 1,
        minute: 70,
      }),
    });

    const outbound = await handleUpdate(telegramMessageUpdate(), world.ports);

    expect(textOf(outbound)).toBe(GL.errAmbiguous);
    expect(keyboardOf(outbound).length).toBe(2);
    expect(keyboardOf(outbound)[0]?.[0]?.label).toBe('UD Ourense - Celta B');
    expect(world.observations.rows).toEqual([]);
  });

  test('32. y al elegir, llega la tarjeta — todavía sin `Observation`', async () => {
    const world = scene({
      answer: jsonAnswer({
        match_id: null,
        status: 'live',
        home_score: 2,
        away_score: 1,
        minute: 70,
      }),
    });

    await handleUpdate(telegramMessageUpdate(), world.ports);
    const outbound = await handleUpdate(
      telegramCallbackUpdate(chooseData(MATCH_ID)),
      world.ports,
    );

    expect(textOf(outbound)).toContain(GL.cardHeading);
    expect(world.observations.rows).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CA-7 — nada entra sin confirmación humana.
// ─────────────────────────────────────────────────────────────────────────────

describe('CA-7 — el instante exacto en el que RN-09 es comprobable', () => {
  test('33. ANTES del botón no hay ninguna `Observation`. Es el criterio central', async () => {
    const world = scene();
    const card = await handleUpdate(telegramMessageUpdate(), world.ports);

    expect(textOf(card)).toContain(GL.cardHeading);
    expect(world.proposals.rows.size).toBe(1);
    expect(world.observations.rows).toEqual([]);
    expect(world.engineCalls).toEqual([]);
  });

  test('34. descartar: acuse, CERO `Observation`, y la fila ya no existe', async () => {
    const world = scene();
    await handleUpdate(telegramMessageUpdate(), world.ports);
    const [pending] = [...world.proposals.rows.values()];
    if (pending === undefined) throw new Error('no pending proposal');

    const outbound = await handleUpdate(
      telegramCallbackUpdate(discardData(pending.id)),
      world.ports,
    );

    expect(textOf(outbound)).toBe(GL.ackDiscarded);
    expect(world.observations.rows).toEqual([]);
    expect(world.proposals.rows.size).toBe(0);
  });

  test('35. caducar: el mismo resultado, con el aviso que pide reescribirlo', async () => {
    const world = scene();
    await handleUpdate(telegramMessageUpdate(), world.ports);
    const [pending] = [...world.proposals.rows.values()];
    if (pending === undefined) throw new Error('no pending proposal');

    // Un mundo idéntico cuyo reloj está DESPUÉS de la caducidad.
    const later = scene({ now: '2026-03-21T18:00:00.000Z' });
    await later.ports.proposals.put(pending);
    const outbound = await handleUpdate(
      telegramCallbackUpdate(confirmData(pending.id)),
      later.ports,
    );

    expect(textOf(outbound)).toBe(GL.cardExpired);
    expect(GL.cardExpired).toContain('Escríbeo outra vez');
    expect(later.proposals.rows.size).toBe(0);
    expect(later.observations.rows).toEqual([]);
  });

  test('36. SOLO el mismo corresponsal puede confirmar su propia propuesta', async () => {
    const world = scene();
    await handleUpdate(telegramMessageUpdate(), world.ports);
    const [pending] = [...world.proposals.rows.values()];
    if (pending === undefined) throw new Error('no pending proposal');

    const outbound = await handleUpdate(
      telegramCallbackUpdate(confirmData(pending.id), { senderId: SECOND_SENDER_ID }),
      world.ports,
    );

    expect(textOf(outbound)).toBe(GL.errNotAuthorised);
    expect(world.observations.rows).toEqual([]);
    expect(world.proposals.rows.size).toBe(1);
  });

  test('37. un callback REPETIDO no produce una segunda `Observation`', async () => {
    const world = scene();
    await handleUpdate(telegramMessageUpdate(), world.ports);
    const [pending] = [...world.proposals.rows.values()];
    if (pending === undefined) throw new Error('no pending proposal');

    await handleUpdate(telegramCallbackUpdate(confirmData(pending.id)), world.ports);
    const second = await handleUpdate(
      telegramCallbackUpdate(confirmData(pending.id)),
      world.ports,
    );

    expect(world.observations.rows.length).toBe(1);
    expect(textOf(second)).toBe(GL.errNothingPending);
  });

  test('38. la tarjeta lleva partido, marcador, minuto y estado, cada uno con etiqueta', async () => {
    const world = scene();
    const outbound = await handleUpdate(telegramMessageUpdate(), world.ports);
    const text = textOf(outbound);

    expect(text).toContain('UD Ourense - Celta B');
    expect(text).toContain(`${GL.cardScoreLabel}: 2-1`);
    expect(text).toContain(`${GL.cardMinuteLabel}: 70`);
    expect(text).toContain(`${GL.cardStatusLabel}: En xogo`);
  });

  test('39. y el estado va con TEXTO, nunca solo con un glifo (ADR-013)', async () => {
    const world = scene();
    const text = textOf(await handleUpdate(telegramMessageUpdate(), world.ports));

    // Ni un emoji en toda la tarjeta ni en las etiquetas de los botones.
    expect(/\p{Extended_Pictographic}/u.test(text)).toBe(false);
    const labels = keyboardOf(await handleUpdate(telegramMessageUpdate(), world.ports))
      .flat()
      .map((button) => button.label);
    expect(labels).toEqual([GL.cardConfirm, GL.cardDiscard]);
    for (const label of labels) expect(/\p{Extended_Pictographic}/u.test(label)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CA-11 — la lengua.
// ─────────────────────────────────────────────────────────────────────────────

describe('CA-11 — preferencia explícita, galego por defecto, nunca del cliente', () => {
  test('40. un update con `language_code: es` recibe GALEGO. D-2 sin fallo silencioso', async () => {
    // Telegram no ofrece galego: casi todos los corresponsales gallegos llegan
    // como `es`. Si la lengua saliese del cliente, el galego por defecto
    // dejaría de existir de facto SIN QUE NADIE LO VIESE.
    const world = scene();
    const outbound = await handleUpdate(telegramMessageUpdate(), world.ports);

    expect(textOf(outbound)).toContain(GL.cardHeading);
    expect(textOf(outbound)).not.toContain(ES.cardHeading);
  });

  test('41. `/lingua` cambia la preferencia, se persiste, y el siguiente mensaje la sigue', async () => {
    const world = scene();

    const prompt = await handleUpdate(telegramMessageUpdate({ text: '/lingua' }), world.ports);
    expect(textOf(prompt)).toBe(GL.languagePrompt);

    const changed = await handleUpdate(
      telegramCallbackUpdate(languageData('es')),
      world.ports,
    );
    expect(textOf(changed)).toBe(ES.languageChanged);
    expect(world.state.rows.get(CORRESPONDENT_ID)?.locale).toBe('es');

    const card = await handleUpdate(telegramMessageUpdate(), world.ports);
    expect(textOf(card)).toContain(ES.cardHeading);
    expect(textOf(card)).toContain('UD Ourense - Celta B'); // el canónico no se traduce
  });

  test('42. y vuelve al galego por el mismo camino', async () => {
    const world = scene();
    await handleUpdate(telegramCallbackUpdate(languageData('es')), world.ports);
    const back = await handleUpdate(telegramCallbackUpdate(languageData('gl')), world.ports);

    expect(textOf(back)).toBe(GL.languageChanged);
    expect(world.state.rows.get(CORRESPONDENT_ID)?.locale).toBe('gl');
  });

  test('43. sin preferencia guardada, la lengua es `gl`', async () => {
    const world = scene();
    expect(world.state.rows.get(CORRESPONDENT_ID)?.locale ?? null).toBeNull();
    expect(textOf(await handleUpdate(telegramMessageUpdate(), world.ports))).toContain(
      GL.cardHeading,
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CA-14 — el aviso del art. 13, y la baja.
// ─────────────────────────────────────────────────────────────────────────────

describe('CA-14 — transparencia y derecho de oposición', () => {
  test('44. `/start` emite el aviso con los elementos del art. 13', async () => {
    const world = scene({ noticeSent: false });
    const text = textOf(await handleUpdate(telegramMessageUpdate({ text: '/start' }), world.ports));

    for (const key of [
      'noticeController',
      'noticeWhat',
      'noticePurpose',
      'noticeLegalBasis',
      'noticeAiProvider',
      'noticeRetention',
      'noticeRights',
      'noticeDoNotSend',
      'noticeLink',
    ] as const) {
      const literal = GL[key].replace('{mailbox}', 'ola@tremen.dev');
      expect(text, `${key}`).toContain(literal);
    }
  });

  test('45. y dice que el texto se manda a un proveedor de IA, y cuánto se conserva', async () => {
    const world = scene({ noticeSent: false });
    const text = textOf(await handleUpdate(telegramMessageUpdate({ text: '/start' }), world.ports));

    expect(text).toContain('intelixencia artificial');
    expect(text).toContain('30 días');
    expect(text).toContain('90 días');
    expect(text).toContain('https://marcador.gal/privacidade');
  });

  test('46. un mensaje de contenido de quien NUNCA recibió el aviso no se procesa', async () => {
    const world = scene({ noticeSent: false });

    const outbound = await handleUpdate(telegramMessageUpdate(), world.ports);

    expect(textOf(outbound)).toContain(GL.noticeWhat);
    expect(await world.store.list('')).toEqual([]);
    expect(world.proposals.rows.size).toBe(0);
    expect(world.observations.rows).toEqual([]);
    expect(world.model.calls).toBe(0);
    expect(world.rejections.counts.get('notice_pending')).toBe(1);
  });

  test('47. el aviso dice, en galego, QUÉ NO HACE FALTA ENVIAR', async () => {
    expect(GL.noticeDoNotSend).toContain('xogadores');
    expect(GL.noticeDoNotSend).toContain('árbitros');
    expect(GL.noticeDoNotSend).toContain('saúde');
  });

  test('48. `/privacidade` reimprime el aviso y el enlace', async () => {
    const world = scene();
    const text = textOf(
      await handleUpdate(telegramMessageUpdate({ text: '/privacidade' }), world.ports),
    );

    expect(text).toContain(GL.noticeWhat);
    expect(text).toContain('https://marcador.gal/privacidade');
  });

  test('49. `/baixa` deja de aceptar mensajes EN EL ACTO', async () => {
    const world = scene();

    const acknowledged = textOf(
      await handleUpdate(telegramMessageUpdate({ text: '/baixa' }), world.ports),
    );
    expect(acknowledged).toContain('Non acepto máis mensaxes');

    const after = await handleUpdate(telegramMessageUpdate(), world.ports);
    expect(textOf(after)).toBe(GL.errNotAuthorised);
    expect(world.store.size).toBe(0);
  });

  test('50. y el acuse dice qué se ha borrado y qué NO (RN-13)', () => {
    expect(GL.optOutDone).toContain('non se borra');
    expect(GL.optOutDone).toContain('unha persoa');
    expect(ES.optOutDone).toContain('no se borra');
  });

  test('51. NO hay ningún botón de consentimiento en ninguna tarjeta ni teclado', async () => {
    const world = scene();
    const outbounds = [
      await handleUpdate(telegramMessageUpdate({ text: '/start' }), world.ports),
      await handleUpdate(telegramMessageUpdate({ text: '/lingua' }), world.ports),
      await handleUpdate(telegramMessageUpdate(), world.ports),
    ];

    const labels = outbounds.flatMap((outbound) =>
      keyboardOf(outbound)
        .flat()
        .map((button) => button.label.toLowerCase()),
    );
    for (const label of labels) {
      expect(label).not.toContain('acepto');
      expect(label).not.toContain('consent');
      expect(label).not.toContain('de acordo');
    }
  });
});
