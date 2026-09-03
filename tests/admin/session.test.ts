/**
 * CA-1 (mitad de comportamiento) — la sesión del operador: catálogo en
 * entorno, fallo cerrado, y una respuesta que no dice cuál de los cuatro falló
 * (ADR-024 §2 y §3).
 *
 * La mitad de FRONTERA DE CAPACIDAD —CA-1.7, CA-1.8 y CA-1.9, en la forma de
 * ADR-016— vive en `tests/admin/frontier.test.ts`, con el mismo lector del
 * compilador que sostiene las de SPEC-008, SPEC-009, SPEC-013 y SPEC-015.
 */
import { describe, expect, test } from 'vitest';
import { readFile } from 'node:fs/promises';
import {
  ADMIN_SESSION_COOKIE,
  MIN_SESSION_SECRET_LENGTH,
  OperatorIdSchema,
  SESSION_TTL_MS,
  UnusableSessionSecretError,
  authenticate,
  constantTimeEquals,
  newSession,
  operatorDigest,
  readCookie,
  readOperators,
  readSession,
  readSessionSecret,
  sessionSetCookie,
  signSession,
} from '@/admin/session';
import { adminHandler } from '@/admin/handler';
import {
  NOW,
  OPERATOR_ONE,
  OPERATOR_ONE_SECRET,
  OPERATOR_TWO,
  SCENE_SECRET,
  scene,
  sceneEnv,
} from './support/doubles';
import { epochMsOf, instantOf } from '@/polite/clock';
import type { Instant } from '@/model/ids';

const CATALOG = readOperators(sceneEnv());

function cookieOf(token: string): Headers {
  return new Headers({ cookie: `${ADMIN_SESSION_COOKIE}=${token}` });
}

describe('CA-1.1 — un secreto ausente, vacío o corto no hace NADA', () => {
  test('1. los tres son un error CON NOMBRE, nunca un secreto aceptado', () => {
    const cases: readonly [Readonly<Record<string, string | undefined>>, string][] = [
      [{}, 'absent'],
      [{ ADMIN_SESSION_SECRET: '' }, 'empty'],
      [{ ADMIN_SESSION_SECRET: 'x'.repeat(MIN_SESSION_SECRET_LENGTH - 1) }, 'too_short'],
    ];

    for (const [env, fault] of cases) {
      let caught: unknown;
      try {
        readSessionSecret(env);
      } catch (error) {
        caught = error;
      }
      expect(caught).toBeInstanceOf(UnusableSessionSecretError);
      expect((caught as UnusableSessionSecretError).fault).toBe(fault);
    }
  });

  test('2. un secreto de exactamente 32 caracteres SÍ sirve: el suelo es el suelo', () => {
    const floor = 'y'.repeat(MIN_SESSION_SECRET_LENGTH);
    expect(readSessionSecret({ ADMIN_SESSION_SECRET: floor })).toBe(floor);
  });

  test('3. y ninguna ruta del panel hace nada: 401 SIN INVOCAR NINGÚN PUERTO', async () => {
    for (const env of [{}, { ADMIN_SESSION_SECRET: 'corto' }]) {
      const built = scene();
      const handler = adminHandler({ ports: built.ports, env, locale: 'gl' });

      const answer = await handler(new Request('https://marcador.gal/admin'));

      expect(answer.status).toBe(401);
      // TODOS los dobles registran, y TODOS están sin llamar.
      expect(built.log.calls).toEqual([]);
      expect(built.store.size).toBe(0);
      expect(built.observations.rows).toEqual([]);
      expect(built.actions.rows).toEqual([]);
    }
  });

  test('4. tampoco un POST con formulario: el secreto se lee ANTES que el cuerpo', async () => {
    const built = scene();
    const handler = adminHandler({ ports: built.ports, env: {}, locale: 'gl' });

    const answer = await handler(
      new Request('https://marcador.gal/admin', {
        method: 'POST',
        body: 'intento=accion&accion=correccion',
      }),
    );

    expect(answer.status).toBe(401);
    expect(built.log.calls).toEqual([]);
  });
});

describe('CA-1.2 — `readOperators` NUNCA lanza: apagado y roto no se confunden', () => {
  test('5. ausente, vacía, ilegible o con una clave mala ⇒ catálogo VACÍO', () => {
    const broken: readonly Readonly<Record<string, string | undefined>>[] = [
      {},
      { ADMIN_OPERATORS: '' },
      { ADMIN_OPERATORS: '   ' },
      { ADMIN_OPERATORS: 'esto no es json' },
      { ADMIN_OPERATORS: '{"operador-alberto":"' + operatorDigest('x') + '"}' },
      { ADMIN_OPERATORS: '{"operador-01":"no-es-un-digest"}' },
    ];

    for (const env of broken) {
      expect(readOperators(env).size).toBe(0);
    }
  });

  test('6. y con un catálogo bueno lee lo que hay, sin lanzar en ningún caso', () => {
    expect([...CATALOG.keys()]).toEqual([OPERATOR_ONE]);
  });
});

describe('CA-1.3 — comparación en tiempo constante, sin `===` sobre el secreto', () => {
  test('7. `constantTimeEquals` recorre TODAS las posiciones y no cortocircuita', () => {
    expect(constantTimeEquals('abc', 'abc')).toBe(true);
    expect(constantTimeEquals('abc', 'abd')).toBe(false);
    // Longitudes distintas: se pliegan en el mismo acumulador, no se sale antes.
    expect(constantTimeEquals('abc', 'abcd')).toBe(false);
    expect(constantTimeEquals('', '')).toBe(true);
  });

  /**
   * CA-1.3, EN LA FORMA DE ADR-016: se ENUMERA cada comparación estricta que
   * el módulo tiene derecho a hacer, con su motivo al lado, y se exige que el
   * resto sea VACÍO.
   *
   * Una lista de «comparaciones prohibidas» sería una lista negra, y ya se
   * sabe cómo acaban (ADR-016 §3.5): habría que adivinar cómo se llamará la
   * variable que guarde el digest. Enumerando lo permitido, un
   * `if (offered === stored)` es rojo SIN QUE NADIE TENGA QUE SABER QUE
   * EXISTE, se llame como se llame.
   */
  const ALLOWED_COMPARISONS: readonly { line: string; motive: string }[] = [
    {
      line: 'return difference === 0;',
      motive:
        'El final de `constantTimeEquals`: el acumulador XOR, que ya recorrió TODAS las posiciones. Comparar el acumulador no filtra tiempo — es el mecanismo, no una fuga.',
    },
    {
      line: "if (typeof raw !== 'string') throw new UnusableSessionSecretError('absent');",
      motive:
        'El operando es el `typeof`, no el valor: es lo que decide si la variable está configurada, que es el fallo cerrado de CA-1.1.',
    },
    {
      line: "if (raw.length === 0) throw new UnusableSessionSecretError('empty');",
      motive:
        'La LONGITUD, no el valor. Un secreto vacío es un error con nombre, y su longitud no es un secreto: el criterio de longitud está escrito en el propio ADR.',
    },
    {
      line: "if (typeof raw !== 'string' || raw.trim().length === 0) return new Map();",
      motive:
        'Lo mismo para el catálogo: `typeof` y longitud deciden si hay algo que leer, y `readOperators` devuelve el catálogo vacío en vez de lanzar (CA-1.2).',
    },
    {
      line: 'if (token === null) return null;',
      motive:
        'La AUSENCIA de la cookie: no hay ningún material secreto en juego todavía, y sin valor no hay nada que comparar en tiempo constante.',
    },
    {
      line: 'if (header === null) return null;',
      motive:
        'La ausencia de la cabecera `Cookie` entera. Igual que la anterior: se decide si hay algo que leer, nunca qué vale lo que hay.',
    },
    {
      line: 'if (part.slice(0, cut).trim() !== name) continue;',
      motive:
        'El NOMBRE de una cookie, que viaja en claro en cada petición y no es material secreto de ningún tipo.',
    },
  ];

  test('8. el módulo NO compara el secreto ni su digest con `===`', async () => {
    const source = await readFile('src/admin/session.ts', 'utf8');
    const code = source.replaceAll(/\/\*[\s\S]*?\*\//g, '').replaceAll(/^\s*\/\/.*$/gm, '');

    const comparisons = code
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => /[=!]==/.test(line));

    // El complemento de la lista declarada es VACÍO, y cada entrada llega con
    // su motivo escrito (ADR-016 §3.2).
    expect(comparisons).toEqual(ALLOWED_COMPARISONS.map((entry) => entry.line));
    for (const entry of ALLOWED_COMPARISONS) expect(entry.motive.length).toBeGreaterThan(60);
  });

  test('9. control positivo: una comparación nueva sobre el digest sería ROJA', () => {
    // El mecanismo se ejercita sobre un módulo sintético con la MISMA función:
    // si alguien reintrodujese el cortocircuito, la lista no lo contendría.
    const evasion = "  if (offered === catalog.get(operatorId)) return true;";
    const declared = ALLOWED_COMPARISONS.map((entry) => entry.line);

    expect(declared).not.toContain(evasion.trim());
    expect(/[=!]==/.test(evasion)).toBe(true);
  });

  test('10. un operador desconocido NO cortocircuita: compara contra un digest imposible', () => {
    // Si saliera antes, «este operador no existe» y «esta clave está mal»
    // tomarían caminos distintos, que es el oráculo que CA-1.3 cierra.
    expect(authenticate(CATALOG, OPERATOR_TWO, OPERATOR_ONE_SECRET)).toBe(false);
    expect(authenticate(CATALOG, OPERATOR_ONE, 'outra clave')).toBe(false);
    expect(authenticate(CATALOG, OPERATOR_ONE, OPERATOR_ONE_SECRET)).toBe(true);
  });
});

describe('CA-1.4 — los cuatro fallos de sesión dan LA MISMA respuesta', () => {
  const valid = signSession(SCENE_SECRET, newSession(OPERATOR_ONE, NOW));

  test('11. firma inválida, cookie manipulada, caducada, u operador fuera ⇒ null', () => {
    const expired = signSession(
      SCENE_SECRET,
      newSession(OPERATOR_ONE, instantOf(epochMsOf(NOW) - SESSION_TTL_MS - 1000)),
    );
    const tampered = `${valid.slice(0, valid.lastIndexOf('.'))}.${'0'.repeat(64)}`;
    const foreign = signSession(SCENE_SECRET, newSession(OPERATOR_TWO, NOW));

    expect(readSession(SCENE_SECRET, CATALOG, 'no-es-un-token', NOW)).toBeNull();
    expect(readSession(SCENE_SECRET, CATALOG, tampered, NOW)).toBeNull();
    expect(readSession(SCENE_SECRET, CATALOG, expired, NOW)).toBeNull();
    expect(readSession(SCENE_SECRET, CATALOG, foreign, NOW)).toBeNull();

    // Y el camino legítimo sí abre, o el caso no medía nada.
    expect(readSession(SCENE_SECRET, CATALOG, valid, NOW)).toBe(OPERATOR_ONE);
  });

  test('12. y la RESPUESTA es la misma en los cuatro: el formulario de acceso', async () => {
    const tokens = [
      'no-es-un-token',
      `${valid.slice(0, valid.lastIndexOf('.'))}.${'0'.repeat(64)}`,
      signSession(
        SCENE_SECRET,
        newSession(OPERATOR_ONE, instantOf(epochMsOf(NOW) - SESSION_TTL_MS - 1000)),
      ),
      signSession(SCENE_SECRET, newSession(OPERATOR_TWO, NOW)),
    ];

    const bodies: string[] = [];
    for (const token of tokens) {
      const built = scene();
      const answer = await adminHandler({
        ports: built.ports,
        env: sceneEnv(),
        locale: 'gl',
      })(new Request('https://marcador.gal/admin', { headers: cookieOf(token) }));

      expect(answer.status).toBe(200);
      bodies.push(await answer.text());
    }

    expect(new Set(bodies).size).toBe(1);
  });

  test('13. sin cookie válida NO SE LEE LA BASE: cero lecturas (§2, paso 1)', async () => {
    const built = scene();
    await adminHandler({ ports: built.ports, env: sceneEnv(), locale: 'gl' })(
      new Request('https://marcador.gal/admin'),
    );

    expect(built.log.calls).toEqual([]);
  });
});

describe('CA-1.5 — la cookie, y la caducidad DENTRO de la firma', () => {
  test('14. `httpOnly`, `Secure`, `SameSite=Strict`, `Path=/`', () => {
    const header = sessionSetCookie('x.y', 3600);

    expect(header).toContain('HttpOnly');
    expect(header).toContain('Secure');
    expect(header).toContain('SameSite=Strict');
    expect(header).toContain('Path=/');
  });

  test('15. MOVER EL `Max-Age` NO ALARGA UNA SESIÓN', () => {
    const past = instantOf(epochMsOf(NOW) - SESSION_TTL_MS - 1000);
    const token = signSession(SCENE_SECRET, newSession(OPERATOR_ONE, past));

    // Una cookie con un Max-Age de un año sobre una sesión ya caducada.
    const header = sessionSetCookie(token, 60 * 60 * 24 * 365);
    expect(header).toContain('Max-Age=31536000');

    const offered = readCookie(`${ADMIN_SESSION_COOKIE}=${token}`, ADMIN_SESSION_COOKIE);
    expect(readSession(SCENE_SECRET, CATALOG, offered, NOW)).toBeNull();
  });

  test('16. y el instante de caducidad viaja firmado: cambiarlo rompe la firma', () => {
    const token = signSession(SCENE_SECRET, newSession(OPERATOR_ONE, NOW));
    const body = token.slice(0, token.lastIndexOf('.'));
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as {
      expires_at: Instant;
    };

    const stretched = Buffer.from(
      JSON.stringify({
        operator_id: OPERATOR_ONE,
        issued_at: NOW,
        expires_at: instantOf(epochMsOf(payload.expires_at) + SESSION_TTL_MS * 100),
      }),
      'utf8',
    ).toString('base64url');

    const forged = `${stretched}.${token.slice(token.lastIndexOf('.') + 1)}`;
    expect(readSession(SCENE_SECRET, CATALOG, forged, NOW)).toBeNull();
  });
});

describe('CA-1.6 — la forma del `operator_id` es una barrera, no un convenio', () => {
  test('17. `^operador-\\d+$` y nada más', () => {
    expect(OperatorIdSchema.safeParse('operador-01').success).toBe(true);
    expect(OperatorIdSchema.safeParse('operador-137').success).toBe(true);

    for (const bad of [
      'operador-alberto',
      'operador-xove',
      'operador',
      'operador-',
      'corresponsal-01',
      ' operador-01',
      'operador-01 ',
      'OPERADOR-01',
    ]) {
      expect(OperatorIdSchema.safeParse(bad).success, `${bad}`).toBe(false);
    }
  });

  test('18. y el catálogo se rechaza ENTERO si una sola clave no casa', () => {
    const env = {
      ADMIN_OPERATORS: JSON.stringify({
        'operador-01': operatorDigest('a'),
        'operador-vigo': operatorDigest('b'),
      }),
    };

    // No queda la mitad buena: queda vacío. Un catálogo a medias es un
    // catálogo sobre el que nadie puede razonar (ADR-018 §3, prestado).
    expect(readOperators(env).size).toBe(0);
  });
});
