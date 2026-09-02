/**
 * CA-3 — lo que se archiva es una LISTA BLANCA TOTAL, y `message.text` va
 * verbatim (RN-10, ADR-022 §3, ADR-016, arts. 5.1.c y 25.2 del RGPD).
 *
 * El aserto central NO es sobre las seis claves prohibidas: es sobre el
 * CONJUNTO DE CLAVES recorrido en profundidad, comparado con la lista exportada
 * con nombre. Una lista negra caza lo que alguien pensó; una lista blanca deja
 * fuera lo que nadie ha pensado todavía, que es lo que Telegram añadirá mañana.
 */
import { describe, expect, test } from 'vitest';
import { ARCHIVED_KEYS, keyPaths, redact } from '@/bot/redact';
import { encode } from '@/bot/archive';
import { FORBIDDEN_FIELDS } from './support/frontier';
import {
  FIXTURE_CHAT_ID,
  FIXTURE_FIRST_NAME,
  FIXTURE_SENDER_ID,
  FIXTURE_TEXT,
  telegramCallbackUpdate,
  telegramMessageUpdate,
} from '../fixtures/telegram';

const CORRESPONDENT = 'corresponsal-01';

describe('CA-3.1 — lista blanca TOTAL, no lista negra', () => {
  test('1. cada entrada de la lista llega con su motivo al lado (ADR-016 §3.2)', () => {
    expect(ARCHIVED_KEYS.length).toBe(8);
    for (const key of ARCHIVED_KEYS) {
      expect(key.path.length).toBeGreaterThan(0);
      expect(key.motive.length).toBeGreaterThan(40);
    }
  });

  test('2. el objeto archivado tiene EXACTAMENTE las claves de la lista que existen', () => {
    const archived = redact(telegramMessageUpdate(), CORRESPONDENT);

    expect([...keyPaths(archived)].sort()).toEqual([
      'correspondent_id',
      'message.date',
      'message.message_id',
      'message.text',
      'update_id',
    ]);
  });

  test('3. y del callback, sus tres claves, el `update_id` y ninguna más', () => {
    const archived = redact(telegramCallbackUpdate('c:abc'), CORRESPONDENT);

    expect([...keyPaths(archived)].sort()).toEqual([
      'callback_query.data',
      'callback_query.id',
      'callback_query.message_id',
      'correspondent_id',
      'update_id',
    ]);
  });

  test('4. todo lo archivado cae DENTRO de la lista, sin excepción', () => {
    const declared = new Set(ARCHIVED_KEYS.map((key) => key.path));
    for (const update of [telegramMessageUpdate(), telegramCallbackUpdate('d:abc')]) {
      for (const path of keyPaths(redact(update, CORRESPONDENT))) {
        expect(declared, `${path}`).toContain(path);
      }
    }
  });
});

describe('CA-3.2 — las seis claves prohibidas no aparecen', () => {
  test('5. ni en el objeto archivado', () => {
    const archived = redact(telegramMessageUpdate(), CORRESPONDENT);
    const serialised = JSON.stringify(archived);

    const leaked = FORBIDDEN_FIELDS.filter((field) => serialised.includes(field));
    expect(leaked).toEqual([]);
  });

  test('6. ni sus VALORES: el nombre civil no viaja en ningún byte', () => {
    const archived = JSON.stringify(redact(telegramMessageUpdate(), CORRESPONDENT));
    expect(archived).not.toContain(FIXTURE_FIRST_NAME);
  });
});

describe('CA-3.3 — control positivo POR MECANISMO', () => {
  test('7. añadir una clave prohibida a la LISTA la deja pasar, y el caso lo ve', () => {
    // El fixture ya trae las seis rellenas (caso 5). Lo que este control mide es
    // el MECANISMO: si la lista blanca dejase de ser total —si alguien añadiese
    // una ruta prohibida— el objeto archivado la llevaría, y el caso 5 en rojo.
    const widened = [
      ...ARCHIVED_KEYS,
      { path: 'message.from.first_name', motive: 'control positivo, no producción' },
    ];
    const archived = redact(telegramMessageUpdate(), CORRESPONDENT, widened);

    expect(JSON.stringify(archived)).toContain(FIXTURE_FIRST_NAME);
    expect(keyPaths(archived)).toContain('message.from.first_name');
  });

  test('8. quitar una clave de la lista blanca deja el archivo SIN el sustrato', () => {
    const shortened = ARCHIVED_KEYS.filter((key) => key.path !== 'message.text');
    const archived = redact(telegramMessageUpdate(), CORRESPONDENT, shortened);

    expect(keyPaths(archived)).not.toContain('message.text');
    // Y eso es exactamente lo que CA-3.4 prohíbe: sin el texto no hay RN-10.
    expect(JSON.stringify(archived)).not.toContain('minuto 70');
  });
});

describe('CA-3.4 — `message.text` se archiva VERBATIM, byte a byte', () => {
  test('9. con emoji, acentos galegos y un salto de línea', () => {
    const archived = redact(telegramMessageUpdate(), CORRESPONDENT) as {
      message: { text: string };
    };

    expect(archived.message.text).toBe(FIXTURE_TEXT);

    // Byte a byte, no carácter a carácter: el emoji ocupa cuatro.
    const written = encode(archived);
    const expected = encode({ message: { text: FIXTURE_TEXT } });
    const decoded = new TextDecoder().decode(written);
    expect(decoded).toContain(new TextDecoder().decode(expected).slice(13, -2));
    expect(encode(archived.message.text).length).toBe(encode(FIXTURE_TEXT).length);
  });

  test('10. y esto es lo que separa esta decisión de la que ADR-009 rechazó', () => {
    // ADR-009 rechazó anonimizar el crudo porque destruye RN-10 y porque saber
    // qué tachar exigiría un parser fiable, lo cual es circular. Aquí no hay
    // circularidad: se decide por CLAVE, sin interpretar una palabra del texto.
    const weird = 'Lesionouse o 9 — sae en padiola 🚑\ne o árbitro non o viu';
    const archived = redact(telegramMessageUpdate({ text: weird }), CORRESPONDENT) as {
      message: { text: string };
    };
    expect(archived.message.text).toBe(weird);
  });
});

describe('CA-3.5 — `from.id` y `chat.id` no se archivan', () => {
  test('11. en su lugar va el `correspondent_id`', () => {
    const archived = redact(telegramMessageUpdate(), CORRESPONDENT);
    const serialised = JSON.stringify(archived);

    expect(serialised).not.toContain(`${FIXTURE_SENDER_ID}`);
    expect(serialised).not.toContain(`${FIXTURE_CHAT_ID}`);
    expect(archived['correspondent_id']).toBe(CORRESPONDENT);
  });

  test('12. y el `correspondent_id` va aunque la fuente traiga uno propio', () => {
    // No se copia del update: se pone. Un update no puede dictar quién es.
    const forged = { ...telegramMessageUpdate(), correspondent_id: 'corresponsal-99' };
    expect(redact(forged, CORRESPONDENT)['correspondent_id']).toBe(CORRESPONDENT);
  });
});

describe('CA-3.6 — el residuo declarado, donde el mecanismo juzga', () => {
  test('13. la lista blanca NO alcanza al contenido del propio `message.text`', () => {
    // Si la persona firma con su nombre dentro del texto, ahí se queda. Es
    // inevitable, y se trata donde se puede: en el aviso, que le dice qué no
    // hace falta escribir (CA-14.3). No es deuda: es el límite del mecanismo,
    // y se declara para que nadie lea el criterio como si prometiera más.
    const signed = 'son as 19:40, 2-1. Asina: Alberto';
    const archived = redact(telegramMessageUpdate({ text: signed }), CORRESPONDENT) as {
      message: { text: string };
    };
    expect(archived.message.text).toContain('Alberto');
  });
});
