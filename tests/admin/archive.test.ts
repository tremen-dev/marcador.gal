/**
 * CA-3 — RN-10: la acción se archiva antes de parsearse, con lista blanca
 * TOTAL, y el motivo va verbatim (ADR-024 §6, ADR-016).
 *
 * El aserto de CA-3.1 es sobre el conjunto de claves RECORRIDO EN PROFUNDIDAD,
 * no sobre las prohibidas: una lista negra habría que ampliarla cada vez que
 * alguien piense un campo nuevo, y enumerando lo permitido el campo nuevo queda
 * fuera sin que nadie tenga que saber que existe (ADR-016 §3.5).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CA-3.2 SE REESCRIBIÓ EL 2026-09-03 (F-SPEC-017-V1). La versión anterior
 * declaraba un marcador reconocible y NUNCA LO ENVIABA —el transporte de los
 * dobles no admitía cabeceras—, así que sus tres `not.toContain` eran vacuos:
 * afirmaban que no aparece algo que nunca entró, y la fuga real —archivar el
 * `user-agent`, la IP y la cookie de sesión dentro del objeto crudo del
 * operador— pasaba con la suite entera en verde. Ahora las cabeceras SE ENVÍAN
 * de verdad, sobre las CUATRO acciones, y el caso 6 es el control positivo que
 * ADR-016 §3.4 exige: el MISMO recorrido, con la fuga dentro, se pone ROJO.
 */
import { describe, expect, test } from 'vitest';
import {
  ADMIN_ACTIONS,
  OPERATOR_ARCHIVE_PREFIX,
  OPERATOR_ARCHIVE_SOURCE,
  archiveMeta,
  publishes,
} from '@/admin/archive';
import { adminHandler } from '@/admin/handler';
import { ARCHIVED_ACTION_KEYS, keyPaths, redactAction } from '@/admin/redact';
import { TICKET_FIELD } from '@/admin/ticket';
import { PREFERENTE_G1, TERCERA_G1 } from '@/ingest/sources';
import { ObservationIdSchema } from '@/model/ids';
import { rawKey } from '@/raw/store';
import {
  NOW,
  OPERATOR_ONE,
  SCENE_MATCH,
  liveDecision,
  panelRequest,
  postToPanel,
  scene,
  sceneEnv,
  sessionTokenOf,
  ticketOf,
} from './support/doubles';
import type { Scene } from './support/doubles';
import type { AdminAction } from '@/admin/archive';
import type { MatchDecisions } from '@/admin/ports';
import type { Alert } from '@/decide/alert';

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

function correctionFields(): Readonly<Record<string, string>> {
  return {
    intento: 'accion',
    accion: 'correccion',
    partido: TARGET,
    [TICKET_FIELD]: ticketOf('correccion', TARGET, NOW),
    estado: 'live',
    goles_casa: '2',
    goles_fora: '1',
    motivo: MOTIVE,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CA-3.2: lo que un navegador manda de verdad, y que no puede quedar archivado.
// ─────────────────────────────────────────────────────────────────────────────

/** El marcador que hace el recorrido sobre algo QUE ENTRÓ (F-SPEC-017-V1). */
const HEADER_MARK = 'CABECERA-RECOÑECIBLE-9f3a';

/**
 * Cabeceras reales de un navegador detrás de un proxy. Cada valor lleva el
 * marcador dentro, así que basta con buscarlo para saber si alguna cruzó.
 */
const BROWSER_HEADERS: Readonly<Record<string, string>> = {
  'user-agent': `Mozilla/5.0 (Android 14; Mobile) ${HEADER_MARK}-ua`,
  'x-forwarded-for': `203.0.113.7, ${HEADER_MARK}-ip`,
  'x-real-ip': `198.51.100.4 ${HEADER_MARK}-realip`,
  referer: `https://marcador.gal/admin?rastro=${HEADER_MARK}-ref`,
  'accept-language': `gl-ES,gl;q=0.9 ${HEADER_MARK}-lang`,
};

/** Lo que se busca: los valores enviados, los nombres, y el material de sesión. */
const MARKERS: readonly string[] = [
  HEADER_MARK,
  ...Object.values(BROWSER_HEADERS),
  ...Object.keys(BROWSER_HEADERS),
  '203.0.113.7',
  '198.51.100.4',
  'marcador_operador',
  'cookie',
];

/**
 * El recorrido: TODO lo que el panel deja durable. No solo el cuerpo del objeto
 * archivado —una cabecera cabe igual de bien en su clave o en su meta— y no
 * solo el archivo: también las filas de `observations`, `operator_actions` y
 * `alert_acks`, que es lo que el criterio llama «ninguna fila persistida».
 */
async function traces(built: Scene, needles: readonly string[]): Promise<readonly string[]> {
  const haystacks: (readonly [string, string])[] = [];

  for (const object of await built.store.archived()) {
    haystacks.push([`clave ${object.key}`, object.key]);
    haystacks.push([`meta ${object.key}`, object.meta]);
    haystacks.push([`corpo ${object.key}`, object.body]);
  }
  haystacks.push(['filas observations', JSON.stringify(built.observations.rows)]);
  haystacks.push(['filas operator_actions', JSON.stringify(built.actions.rows)]);
  haystacks.push(['filas alert_acks', JSON.stringify(built.acks.rows)]);

  const offences: string[] = [];
  for (const [where, hay] of haystacks) {
    for (const needle of needles) if (hay.includes(needle)) offences.push(`${where} ← ${needle}`);
  }
  return offences;
}

const SCENE_ALERT: Alert = {
  id: 1,
  match_id: TARGET,
  rule: 'RN-05' as const,
  raised_at: '2026-03-21T17:50:00.000Z' as const,
  reason: 'ceroacero di 1-0 e o corresponsal 2-0',
  observation_ids: [ObservationIdSchema.parse('obs-0001')],
};

const WITH_LIVE = new Map<string, MatchDecisions>([
  [TARGET, { live: liveDecision(), log: [liveDecision()] }],
]);

/** Un envío por CADA una de las cuatro acciones, cada uno en su escena. */
const EVERY_ACTION: readonly {
  readonly action: AdminAction;
  readonly built: Scene;
  readonly fields: Readonly<Record<string, string>>;
}[] = [
  { action: 'correccion', built: scene(), fields: correctionFields() },
  {
    action: 'estado',
    built: scene({ decisions: WITH_LIVE }),
    fields: {
      intento: 'accion',
      accion: 'estado',
      partido: TARGET,
      [TICKET_FIELD]: ticketOf('estado', TARGET, NOW),
      estado: 'postponed',
      motivo: 'aprazado por néboa',
    },
  },
  {
    action: 'ratificacion',
    built: scene({ decisions: WITH_LIVE }),
    fields: {
      intento: 'accion',
      accion: 'ratificacion',
      partido: TARGET,
      [TICKET_FIELD]: ticketOf('ratificacion', TARGET, NOW),
      motivo: 'vin o partido enteiro: o marcador é ese',
    },
  },
  {
    action: 'acuse',
    built: scene({ alerts: [SCENE_ALERT] }),
    fields: {
      intento: 'accion',
      accion: 'acuse',
      alerta: '1',
      [TICKET_FIELD]: ticketOf('acuse', '1', NOW),
      motivo: 'xa o mirei, arbitro eu',
    },
  },
];

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
  test('4. las CUATRO acciones, con cabeceras enviadas de verdad: ni un byte', async () => {
    for (const envio of EVERY_ACTION) {
      const answer = await postToPanel(envio.built, {
        fields: envio.fields,
        headers: BROWSER_HEADERS,
      });

      // El mecanismo mide algo: la acción se aceptó y HAY archivo que recorrer.
      expect(answer.status, `${envio.action}`).toBe(200);
      expect((await envio.built.store.archived()).length, `${envio.action}`).toBeGreaterThan(0);

      expect(await traces(envio.built, MARKERS), `${envio.action}`).toEqual([]);
    }
  });

  test('5. y tampoco el vale ni el token de sesión, que son material de sesión', async () => {
    const built = scene();

    await postToPanel(built, { fields: correctionFields(), headers: BROWSER_HEADERS });

    expect(built.store.size).toBe(1);
    expect(await traces(built, [ticketOf('correccion', TARGET, NOW), sessionTokenOf()])).toEqual([]);
  });
});

describe('CA-3.3 — control positivo, por mecanismo', () => {
  /**
   * EL CONTROL POSITIVO DE CA-3.2 (ADR-016 §3.4), y es el que faltaba.
   *
   * Es la fuga que `sdd-verificador` reprodujo el 2026-09-03 sobre el código de
   * producción y que la suite entera se tragó en verde: copiar las cabeceras al
   * motivo antes de archivar. Aquí se monta EN EL TEST —el `handler` de
   * producción no se toca— y se recorre con el MISMO `traces` y los MISMOS
   * marcadores del caso 4. Si el recorrido no viera la fuga, este caso estaría
   * verde y el mecanismo no valdría nada.
   */
  test('6. el MISMO recorrido, con la fuga dentro, se pone ROJO', async () => {
    const built = scene();
    const request = panelRequest({ fields: correctionFields(), headers: BROWSER_HEADERS });

    const leaked = new URLSearchParams(await request.text());
    leaked.set(
      'motivo',
      `${leaked.get('motivo') ?? ''} [ua=${request.headers.get('user-agent') ?? ''}` +
        ` ip=${request.headers.get('x-forwarded-for') ?? ''}` +
        ` ck=${request.headers.get('cookie') ?? ''}]`,
    );

    await adminHandler({ ports: built.ports, env: sceneEnv(), locale: 'gl' })(
      new Request(request.url, {
        method: 'POST',
        headers: request.headers,
        body: leaked.toString(),
      }),
    );

    const offences = await traces(built, MARKERS);

    // Rojo, y nombrando qué cruzó y por dónde.
    expect(offences.length).toBeGreaterThan(0);
    expect(offences.join(' | ')).toContain(HEADER_MARK);
    expect(offences.some((offence) => offence.startsWith('corpo operador/'))).toBe(true);
    // Y la cookie de sesión entera, que es lo que más duele.
    expect(await traces(built, [sessionTokenOf()])).not.toEqual([]);

    // La OTRA MITAD del recorrido —las filas persistidas— tampoco está apagada:
    // un dato que sí vive en ellas se ve. Sin esto, «cero rastros en las filas»
    // podría estar diciendo lo mismo que decía el caso 4 antes de arreglarlo.
    const inRows = (await traces(built, [TARGET])).filter((offence) =>
      offence.startsWith('filas '),
    );
    expect(inRows.length).toBeGreaterThan(0);
  });

  test('7. añadir una clave prohibida al envío NO la mete en el archivo', () => {
    const archived = redactAction({
      ...DECLARED,
      // Un campo que nadie ha pensado todavía. Queda fuera por construcción.
      cookie: 'marcador_operador=abc',
      ip: '10.0.0.1',
    } as unknown as typeof DECLARED);

    expect(keyPaths(archived)).not.toContain('cookie');
    expect(keyPaths(archived)).not.toContain('ip');
  });

  test('8. quitar una clave de la lista blanca la saca del archivo: el mecanismo muerde', () => {
    const shortened = ARCHIVED_ACTION_KEYS.filter((entry) => entry.key !== 'reason');
    const archived = redactAction(DECLARED, shortened);

    expect(keyPaths(archived)).not.toContain('reason');
    // Y con la lista real SÍ está: el detector no está apagado.
    expect(keyPaths(redactAction(DECLARED))).toContain('reason');
  });

  test('9. ampliar la lista con una clave prohibida SÍ la mete: la lista es el mecanismo', () => {
    const widened = [
      ...ARCHIVED_ACTION_KEYS,
      { key: 'cookie', motive: 'control positivo del caso 9, nunca del código de producción' },
    ];
    const archived = redactAction(
      { ...DECLARED, cookie: 'marcador_operador=abc' } as unknown as typeof DECLARED,
      widened,
    );

    expect(keyPaths(archived)).toContain('cookie');
    // Y la lista REAL no la tiene, que es lo que el caso 7 afirma.
    expect(ARCHIVED_ACTION_KEYS.map((entry) => entry.key)).not.toContain('cookie');
  });
});

describe('CA-3.4 — el motivo se archiva VERBATIM, byte a byte', () => {
  test('10. emoji, acentos galegos y un salto de línea sobreviven enteros', async () => {
    const built = scene();

    await postToPanel(built, { fields: correctionFields() });

    const bodies = await built.store.bodies();
    const archived = JSON.parse(bodies[0] ?? '{}') as { reason: string };

    expect(archived.reason).toBe(MOTIVE);
    expect([...Buffer.from(archived.reason, 'utf8')]).toEqual([...Buffer.from(MOTIVE, 'utf8')]);
  });
});

describe('CA-3.5 y CA-3.6 — `captureThenParse`, el ORDEN, y el `raw_ref`', () => {
  test('11. el `put` termina ANTES de que se construya la `Observation`', async () => {
    const built = scene();

    await postToPanel(built, { fields: correctionFields() });

    const put = built.log.indexOf('put:correccion');
    const appended = built.log.indexOf('observations.append');

    expect(put).toBeGreaterThanOrEqual(0);
    expect(appended).toBeGreaterThanOrEqual(0);
    expect(put).toBeLessThan(appended);
  });

  test('12. y el `raw_ref` de la `Observation` EXISTE en el raw store', async () => {
    const built = scene();

    await postToPanel(built, { fields: correctionFields() });

    const observation = built.observations.rows[0];
    expect(observation).toBeDefined();
    expect(await built.store.get(observation?.raw_ref ?? '')).not.toBeNull();
  });
});

describe('CA-3.7 — un solo prefijo para la purga, y el segundo segmento', () => {
  test('13. la lista de tipos de acción está exportada y es cerrada', () => {
    expect([...ADMIN_ACTIONS]).toEqual(['correccion', 'estado', 'ratificacion', 'acuse']);
    expect(ADMIN_ACTIONS.filter((action) => publishes(action))).toEqual([
      'correccion',
      'estado',
      'ratificacion',
    ]);
  });

  test('14. toda clave empieza por `operador/` y su segundo segmento es de la lista', () => {
    for (const action of ADMIN_ACTIONS) {
      const key = rawKey(archiveMeta(action, NOW), Buffer.from('{}', 'utf8'));

      expect(key.startsWith(OPERATOR_ARCHIVE_PREFIX)).toBe(true);
      expect(key.split('/')[0]).toBe(OPERATOR_ARCHIVE_SOURCE);
      expect(ADMIN_ACTIONS).toContain(key.split('/')[1]);
    }
  });

  test('15. y NINGUNA clave del archivo del operador lleva un `competition_id` real', () => {
    const real: readonly string[] = [PREFERENTE_G1, TERCERA_G1];

    for (const action of ADMIN_ACTIONS) expect(real).not.toContain(action);
  });

  test('16. sobre el archivo REAL de un envío, no sobre un doble', async () => {
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
  test('17. lo que la persona escriba en el motivo se archiva, y eso es el límite', async () => {
    const built = scene();
    const withName = 'O árbitro Fulano de Tal anulou un gol legal.';

    await postToPanel(built, {
      fields: { ...correctionFields(), motivo: withName },
    });

    const bodies = await built.store.bodies();
    // Se archiva, y tiene que archivarse: RN-10 existe para conservar el
    // sustrato, y RN-12 necesita el motivo entero.
    expect(bodies[0]).toContain('Fulano de Tal');
  });
});
