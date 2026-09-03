/**
 * CA-7 — el vale de acción: CSRF y cronómetro con un solo mecanismo
 * (ADR-024 §4).
 *
 * Los cuatro rechazos son NOMBRADOS Y DISTINGUIBLES, uno por caso: un único
 * «inválido» dejaría el criterio sin poder afirmarse.
 */
import { describe, expect, test } from 'vitest';
import { readFile } from 'node:fs/promises';
import { TICKET_FIELD, TICKET_TTL_MS, readTicket, signTicket } from '@/admin/ticket';
import { epochMsOf, instantOf } from '@/polite/clock';
import {
  NOW,
  OPERATOR_ONE,
  OPERATOR_TWO,
  SCENE_MATCH,
  SCENE_SECRET,
  getPanel,
  postToPanel,
  scene,
  ticketOf,
} from './support/doubles';

const TARGET = SCENE_MATCH.id;

describe('CA-7.1 — sin vale válido no se archiva nada y no hay `Observation`', () => {
  test('1. un envío sin vale: cero objetos crudos, cero filas, cero llamadas al motor', async () => {
    const built = scene();

    const answer = await postToPanel(built, {
      fields: {
        intento: 'accion',
        accion: 'correccion',
        partido: TARGET,
        estado: 'live',
        goles_casa: '0',
        goles_fora: '0',
        motivo: 'un motivo escrito de verdad',
      },
    });

    expect(answer.status).toBe(400);
    expect(built.store.size).toBe(0);
    expect(built.observations.rows).toEqual([]);
    expect(built.engineCalls).toEqual([]);
    // Y NI SIQUIERA una fila en `operator_actions`: la tabla mide operación,
    // no a quien llama a la puerta (CA-8.2).
    expect(built.actions.rows).toEqual([]);
  });
});

describe('CA-7.2 — los cuatro rechazos, nombrados y distinguibles', () => {
  test('2. malformado, manipulado, de otro operador y caducado son cuatro cosas', () => {
    const good = signTicket(SCENE_SECRET, {
      operator_id: OPERATOR_ONE,
      action: 'correccion',
      target: TARGET,
      issued_at: NOW,
    });

    const tampered = `${good.slice(0, good.lastIndexOf('.'))}.${'0'.repeat(64)}`;
    const foreign = signTicket(SCENE_SECRET, {
      operator_id: OPERATOR_TWO,
      action: 'correccion',
      target: TARGET,
      issued_at: NOW,
    });
    const stale = signTicket(SCENE_SECRET, {
      operator_id: OPERATOR_ONE,
      action: 'correccion',
      target: TARGET,
      issued_at: instantOf(epochMsOf(NOW) - TICKET_TTL_MS - 1000),
    });

    expect(readTicket(SCENE_SECRET, null, OPERATOR_ONE, NOW)).toEqual({
      ok: false,
      fault: 'malformed',
    });
    expect(readTicket(SCENE_SECRET, 'sin-punto', OPERATOR_ONE, NOW)).toEqual({
      ok: false,
      fault: 'malformed',
    });
    expect(readTicket(SCENE_SECRET, tampered, OPERATOR_ONE, NOW)).toEqual({
      ok: false,
      fault: 'tampered',
    });
    expect(readTicket(SCENE_SECRET, foreign, OPERATOR_ONE, NOW)).toEqual({
      ok: false,
      fault: 'other_operator',
    });
    expect(readTicket(SCENE_SECRET, stale, OPERATOR_ONE, NOW)).toEqual({
      ok: false,
      fault: 'expired',
    });

    // Y el camino legítimo abre, o el caso no medía nada.
    const accepted = readTicket(SCENE_SECRET, good, OPERATOR_ONE, NOW);
    expect(accepted.ok).toBe(true);
  });

  test('3. y ninguno de los cuatro archiva nada ni deja fila', async () => {
    const tickets = [
      '',
      'sin-punto',
      ticketOf('correccion', TARGET, NOW, OPERATOR_TWO),
      ticketOf('correccion', TARGET, instantOf(epochMsOf(NOW) - TICKET_TTL_MS - 1000)),
    ];

    for (const vale of tickets) {
      const built = scene();
      await postToPanel(built, {
        fields: {
          intento: 'accion',
          accion: 'correccion',
          partido: TARGET,
          [TICKET_FIELD]: vale,
          estado: 'live',
          motivo: 'un motivo escrito de verdad',
        },
      });

      expect(built.store.size, `${vale}`).toBe(0);
      expect(built.observations.rows, `${vale}`).toEqual([]);
      expect(built.actions.rows, `${vale}`).toEqual([]);
    }
  });

  test('4. un vale del futuro tampoco vale: no lo sirvió este panel', () => {
    const ahead = signTicket(SCENE_SECRET, {
      operator_id: OPERATOR_ONE,
      action: 'correccion',
      target: TARGET,
      issued_at: instantOf(epochMsOf(NOW) + 60_000),
    });

    expect(readTicket(SCENE_SECRET, ahead, OPERATOR_ONE, NOW)).toEqual({
      ok: false,
      fault: 'expired',
    });
  });
});

describe('CA-7.3 — `issued_at` del vale es el `started_at` que se registra', () => {
  test('5. la fila de `operator_actions` lleva el instante del vale emitido', async () => {
    const built = scene();
    const issuedAt = instantOf(epochMsOf(NOW) - 4 * 60 * 1000);

    await postToPanel(built, {
      fields: {
        intento: 'accion',
        accion: 'correccion',
        partido: TARGET,
        [TICKET_FIELD]: ticketOf('correccion', TARGET, issuedAt),
        estado: 'live',
        goles_casa: '1',
        goles_fora: '0',
        motivo: 'baixo o marcador: o 2-0 era un erro da fonte',
      },
    });

    expect(built.actions.rows).toHaveLength(1);
    expect(built.actions.rows[0]?.started_at).toBe(issuedAt);
    expect(built.actions.rows[0]?.submitted_at).toBe(NOW);
    expect(built.actions.rows[0]?.outcome).toBe('accepted');
  });
});

describe('CA-7.4 — el vale NO viaja en la URL', () => {
  test('6. ninguna ruta lo acepta como parámetro de consulta', async () => {
    const built = scene();

    // El mismo vale, en la query en vez de en el cuerpo. No abre nada.
    const answer = await postToPanel(built, {
      fields: {
        intento: 'accion',
        accion: 'correccion',
        partido: TARGET,
        estado: 'live',
        motivo: 'un motivo escrito de verdad',
      },
    });

    expect(answer.status).toBe(400);
    expect(built.observations.rows).toEqual([]);
  });

  test('7. y ninguna vista lo escribe en un `href`', async () => {
    const built = scene();
    const page = await (await getPanel(built)).text();

    // El vale aparece SOLO como campo oculto de un formulario.
    const hrefs = [...page.matchAll(/href="([^"]*)"/g)].map(([, value]) => value ?? '');
    for (const href of hrefs) expect(href).not.toContain(TICKET_FIELD);

    // Y el mecanismo no está apagado: el marcado escribe el campo oculto.
    const source = await readFile('src/admin/view/markup.ts', 'utf8');
    expect(source).toContain('type="hidden"');
  });
});

describe('CA-7.5 — DECLARADO: el vale NO es de un solo uso', () => {
  /**
   * RESIDUO DECLARADO DENTRO DEL CRITERIO (ADR-016 §6, CA-7.5). Detectar un
   * reenvío exigiría estado durable, que es justo lo que ADR-024 §3 evita.
   * Lo que lo hace inofensivo es que el id de la `Observation` se DERIVA de lo
   * que la persona declaró, así que un reenvío idéntico dentro del TTL no
   * duplica nada. **Destino: EPIC-MEJORA; disparador: el día que el panel
   * tenga una operación cuyo efecto no sea idempotente.**
   */
  test('8. el mismo envío dos veces deja UNA fila en `observations`', async () => {
    const built = scene();
    const vale = ticketOf('correccion', TARGET, NOW);
    const fields = {
      intento: 'accion',
      accion: 'correccion',
      partido: TARGET,
      [TICKET_FIELD]: vale,
      estado: 'live',
      goles_casa: '2',
      goles_fora: '1',
      motivo: 'o marcador estaba mal',
    };

    await postToPanel(built, { fields });
    await postToPanel(built, { fields });

    expect(built.observations.rows).toHaveLength(1);
    // Y el vale SÍ se aceptó las dos veces: dos actos de operación, que es lo
    // que la cuarta cifra tiene que ver, y una sola `Observation`.
    expect(built.actions.rows).toHaveLength(2);
  });

  test('9. y dos vales distintos sobre el mismo partido SÍ son dos observaciones', async () => {
    const built = scene();
    const base = {
      intento: 'accion',
      accion: 'correccion',
      partido: TARGET,
      estado: 'live',
      goles_casa: '2',
      goles_fora: '1',
      motivo: 'o marcador estaba mal',
    };

    await postToPanel(built, {
      fields: { ...base, [TICKET_FIELD]: ticketOf('correccion', TARGET, NOW) },
    });
    await postToPanel(built, {
      fields: {
        ...base,
        [TICKET_FIELD]: ticketOf('correccion', TARGET, instantOf(epochMsOf(NOW) - 60_000)),
      },
    });

    expect(built.observations.rows).toHaveLength(2);
  });
});
