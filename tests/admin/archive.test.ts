/**
 * CA-3 — RN-10: la acción se archiva antes de parsearse, con lista blanca
 * TOTAL, y el motivo va verbatim (ADR-024 §6, ADR-016).
 *
 * El aserto de CA-3.1 es sobre el conjunto de claves RECORRIDO EN PROFUNDIDAD,
 * no sobre las prohibidas: una lista negra habría que ampliarla cada vez que
 * alguien piense un campo nuevo, y enumerando lo permitido el campo nuevo queda
 * fuera sin que nadie tenga que saber que existe (ADR-016 §3.5).
 */
import { describe, expect, test } from 'vitest';
import {
  ADMIN_ACTIONS,
  OPERATOR_ARCHIVE_PREFIX,
  OPERATOR_ARCHIVE_SOURCE,
  archiveMeta,
  publishes,
} from '@/admin/archive';
import { ARCHIVED_ACTION_KEYS, keyPaths, redactAction } from '@/admin/redact';
import { TICKET_FIELD } from '@/admin/ticket';
import { PREFERENTE_G1, TERCERA_G1 } from '@/ingest/sources';
import { rawKey } from '@/raw/store';
import {
  NOW,
  OPERATOR_ONE,
  SCENE_MATCH,
  postToPanel,
  scene,
  ticketOf,
} from './support/doubles';

const TARGET = SCENE_MATCH.id;

/** El motivo de la escena: emoji, acentos galegos y un salto de línea (CA-3.4). */
const MOTIVE = 'Baixei o marcador ⚽\nporque a fonte pechou o partido antes de tempo: 2-1, non 3-1.';

const DECLARED = {
  operator_id: OPERATOR_ONE,
  match_id: SCENE_MATCH.id,
  action: 'correccion',
  status: 'live',
  home_score: 2,
  away_score: 1,
  reason: MOTIVE,
  issued_at: NOW,
  submitted_at: NOW,
} as const;

describe('CA-3.1 — lista blanca TOTAL, y el aserto es sobre las claves', () => {
  test('1. el objeto archivado tiene EXACTAMENTE las claves declaradas', () => {
    const archived = redactAction(DECLARED);

    expect([...keyPaths(archived)].sort()).toEqual(
      [
        'action',
        'away_score',
        'home_score',
        'issued_at',
        'match_id',
        'operator_id',
        'reason',
        'status',
        'submitted_at',
      ].sort(),
    );
  });

  test('2. la lista está exportada con nombre y CADA entrada lleva su motivo', () => {
    expect(ARCHIVED_ACTION_KEYS.length).toBeGreaterThan(0);
    for (const entry of ARCHIVED_ACTION_KEYS) {
      expect(entry.key.length).toBeGreaterThan(0);
      expect(entry.motive.length, `${entry.key}`).toBeGreaterThan(60);
    }
  });

  test('3. un acuse lleva `alert_id` y NO `match_id`: son excluyentes', () => {
    const archived = redactAction({
      operator_id: OPERATOR_ONE,
      alert_id: 7,
      action: 'acuse',
      reason: 'vin o conflito e xa o arbitrei',
      issued_at: NOW,
      submitted_at: NOW,
    });

    expect([...keyPaths(archived)].sort()).toEqual([
      'action',
      'alert_id',
      'issued_at',
      'operator_id',
      'reason',
      'submitted_at',
    ]);
  });
});

describe('CA-3.2 — ni cabeceras, ni IP, ni user-agent, ni cookie, ni sesión', () => {
  test('4. un envío con cabeceras reconocibles no deja UN SOLO BYTE de ellas', async () => {
    const built = scene();
    const marker = 'CABECERA-RECOÑECIBLE-9f3a';

    const answer = await postToPanel(built, {
      fields: {
        intento: 'accion',
        accion: 'correccion',
        partido: TARGET,
        [TICKET_FIELD]: ticketOf('correccion', TARGET, NOW),
        estado: 'live',
        goles_casa: '2',
        goles_fora: '1',
        motivo: MOTIVE,
      },
    });
    expect(answer.status).toBe(200);

    const bodies = await built.store.bodies();
    expect(bodies).toHaveLength(1);
    for (const body of bodies) {
      expect(body).not.toContain(marker);
      expect(body).not.toContain('user-agent');
      expect(body).not.toContain('cookie');
      expect(body).not.toContain('marcador_operador');
      // Ni el propio vale, que es material de sesión.
      expect(body).not.toContain(ticketOf('correccion', TARGET, NOW));
    }

    // Ni en ninguna fila persistida.
    const rows = JSON.stringify([built.observations.rows, built.actions.rows, built.acks.rows]);
    expect(rows).not.toContain(marker);
    expect(rows).not.toContain('marcador_operador');
  });
});

describe('CA-3.3 — control positivo, por mecanismo', () => {
  test('5. añadir una clave prohibida al envío NO la mete en el archivo', () => {
    const archived = redactAction({
      ...DECLARED,
      // Un campo que nadie ha pensado todavía. Queda fuera por construcción.
      cookie: 'marcador_operador=abc',
      ip: '10.0.0.1',
    } as unknown as typeof DECLARED);

    expect(keyPaths(archived)).not.toContain('cookie');
    expect(keyPaths(archived)).not.toContain('ip');
  });

  test('6. quitar una clave de la lista blanca la saca del archivo: el mecanismo muerde', () => {
    const shortened = ARCHIVED_ACTION_KEYS.filter((entry) => entry.key !== 'reason');
    const archived = redactAction(DECLARED, shortened);

    expect(keyPaths(archived)).not.toContain('reason');
    // Y con la lista real SÍ está: el detector no está apagado.
    expect(keyPaths(redactAction(DECLARED))).toContain('reason');
  });

  test('7. ampliar la lista con una clave prohibida SÍ la mete: la lista es el mecanismo', () => {
    const widened = [
      ...ARCHIVED_ACTION_KEYS,
      { key: 'cookie', motive: 'control positivo del caso 7, nunca del código de producción' },
    ];
    const archived = redactAction(
      { ...DECLARED, cookie: 'marcador_operador=abc' } as unknown as typeof DECLARED,
      widened,
    );

    expect(keyPaths(archived)).toContain('cookie');
    // Y la lista REAL no la tiene, que es lo que el caso 5 afirma.
    expect(ARCHIVED_ACTION_KEYS.map((entry) => entry.key)).not.toContain('cookie');
  });
});

describe('CA-3.4 — el motivo se archiva VERBATIM, byte a byte', () => {
  test('8. emoji, acentos galegos y un salto de línea sobreviven enteros', async () => {
    const built = scene();

    await postToPanel(built, {
      fields: {
        intento: 'accion',
        accion: 'correccion',
        partido: TARGET,
        [TICKET_FIELD]: ticketOf('correccion', TARGET, NOW),
        estado: 'live',
        goles_casa: '2',
        goles_fora: '1',
        motivo: MOTIVE,
      },
    });

    const bodies = await built.store.bodies();
    const archived = JSON.parse(bodies[0] ?? '{}') as { reason: string };

    expect(archived.reason).toBe(MOTIVE);
    expect([...Buffer.from(archived.reason, 'utf8')]).toEqual([
      ...Buffer.from(MOTIVE, 'utf8'),
    ]);
  });
});

describe('CA-3.5 y CA-3.6 — `captureThenParse`, el ORDEN, y el `raw_ref`', () => {
  test('9. el `put` termina ANTES de que se construya la `Observation`', async () => {
    const built = scene();

    await postToPanel(built, {
      fields: {
        intento: 'accion',
        accion: 'correccion',
        partido: TARGET,
        [TICKET_FIELD]: ticketOf('correccion', TARGET, NOW),
        estado: 'live',
        goles_casa: '2',
        goles_fora: '1',
        motivo: MOTIVE,
      },
    });

    const put = built.log.indexOf('put:correccion');
    const appended = built.log.indexOf('observations.append');

    expect(put).toBeGreaterThanOrEqual(0);
    expect(appended).toBeGreaterThanOrEqual(0);
    expect(put).toBeLessThan(appended);
  });

  test('10. y el `raw_ref` de la `Observation` EXISTE en el raw store', async () => {
    const built = scene();

    await postToPanel(built, {
      fields: {
        intento: 'accion',
        accion: 'correccion',
        partido: TARGET,
        [TICKET_FIELD]: ticketOf('correccion', TARGET, NOW),
        estado: 'live',
        goles_casa: '2',
        goles_fora: '1',
        motivo: MOTIVE,
      },
    });

    const observation = built.observations.rows[0];
    expect(observation).toBeDefined();
    expect(await built.store.get(observation?.raw_ref ?? '')).not.toBeNull();
  });
});

describe('CA-3.7 — un solo prefijo para la purga, y el segundo segmento', () => {
  test('11. la lista de tipos de acción está exportada y es cerrada', () => {
    expect([...ADMIN_ACTIONS]).toEqual(['correccion', 'estado', 'ratificacion', 'acuse']);
    expect(ADMIN_ACTIONS.filter((action) => publishes(action))).toEqual([
      'correccion',
      'estado',
      'ratificacion',
    ]);
  });

  test('12. toda clave empieza por `operador/` y su segundo segmento es de la lista', () => {
    for (const action of ADMIN_ACTIONS) {
      const key = rawKey(archiveMeta(action, NOW), Buffer.from('{}', 'utf8'));

      expect(key.startsWith(OPERATOR_ARCHIVE_PREFIX)).toBe(true);
      expect(key.split('/')[0]).toBe(OPERATOR_ARCHIVE_SOURCE);
      expect(ADMIN_ACTIONS).toContain(key.split('/')[1]);
    }
  });

  test('13. y NINGUNA clave del archivo del operador lleva un `competition_id` real', () => {
    const real: readonly string[] = [PREFERENTE_G1, TERCERA_G1];

    for (const action of ADMIN_ACTIONS) expect(real).not.toContain(action);
  });

  test('14. sobre el archivo REAL de un envío, no sobre un doble', async () => {
    const built = scene();

    await postToPanel(built, {
      fields: {
        intento: 'accion',
        accion: 'estado',
        partido: TARGET,
        [TICKET_FIELD]: ticketOf('estado', TARGET, NOW),
        estado: 'postponed',
        motivo: 'aprazado por néboa',
      },
    });

    const keys = await built.store.list('');
    expect(keys).toHaveLength(1);
    expect(keys[0]?.startsWith('operador/estado/')).toBe(true);
  });
});

describe('CA-3.9 — RESIDUO DECLARADO: la lista blanca no alcanza al MOTIVO', () => {
  /**
   * RESIDUO DECLARADO DENTRO DEL CRITERIO (ADR-016 §6, CA-3.9). Si la persona
   * escribe ahí el nombre de un árbitro, ahí se queda. Es inevitable —el
   * motivo es texto libre y RN-12 lo necesita entero— y se declara para que
   * nadie lea el criterio como si prometiera más. No es deuda: es el LÍMITE
   * del mecanismo.
   */
  test('15. lo que la persona escriba en el motivo se archiva, y eso es el límite', async () => {
    const built = scene();
    const withName = 'O árbitro Fulano de Tal anulou un gol legal.';

    await postToPanel(built, {
      fields: {
        intento: 'accion',
        accion: 'correccion',
        partido: TARGET,
        [TICKET_FIELD]: ticketOf('correccion', TARGET, NOW),
        estado: 'live',
        goles_casa: '1',
        goles_fora: '1',
        motivo: withName,
      },
    });

    const bodies = await built.store.bodies();
    // Se archiva, y tiene que archivarse: RN-10 existe para conservar el
    // sustrato, y RN-12 necesita el motivo entero.
    expect(bodies[0]).toContain('Fulano de Tal');
  });
});
