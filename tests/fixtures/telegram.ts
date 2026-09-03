/**
 * Updates de Telegram SINTÉTICOS (ADR-009 §3: `tests/fixtures/` nunca lleva
 * datos reales de terceros, y aquí «tercero» sería una persona).
 *
 * NINGUNO DE ESTOS DATOS ES DE NADIE. El `from.id` es un número reconocible
 * elegido para que un caso pueda buscarlo byte a byte en el objeto archivado y
 * comprobar que no aparece (CA-3.5); los nombres son cadenas marcadas para el
 * test de fuga del prompt (CA-5.2); y el texto lleva a propósito un emoji,
 * acentos galegos y un salto de línea, porque CA-3.4 exige que `message.text`
 * se archive VERBATIM, byte a byte.
 *
 * Los seis campos que ADR-022 §3 deja fuera de la lista blanca —`first_name`,
 * `last_name`, `username`, `language_code`, `is_bot`, `is_premium`— vienen
 * TODOS rellenos: un fixture que no los traiga no prueba nada.
 */

/**
 * El `from.id` sintético. Reconocible, CORTO, y no es de nadie.
 *
 * Corto a propósito: el caso de CA-10.4 caza cualquier número de 9 a 12 cifras
 * en un fichero versionado, que es la FORMA de un `telegram_user_id`, y un
 * fixture con esa forma sería indistinguible de uno real para el mecanismo.
 */
export const FIXTURE_SENDER_ID = 4242;

/** El `chat.id` sintético, distinto del anterior para poder distinguirlos. */
export const FIXTURE_CHAT_ID = 5151;

/** Las tres cadenas que el test de fuga del prompt busca (CA-5.2). */
export const FIXTURE_FIRST_NAME = 'NomeDeProbaAlfa';
export const FIXTURE_LAST_NAME = 'ApelidoDeProbaBeta';
export const FIXTURE_USERNAME = 'alcumeDeProbaGamma';

/** Emoji, acentos galegos y un salto de línea. Se archiva byte a byte. */
export const FIXTURE_TEXT = '2-1 no minuto 70 ⚽\nOurense - Celta B, xa case remata';

export function telegramMessageUpdate(
  overrides: {
    readonly text?: string;
    readonly senderId?: number;
    readonly updateId?: number;
  } = {},
): Record<string, unknown> {
  return {
    update_id: overrides.updateId ?? 900001,
    message: {
      message_id: 77,
      date: 1_774_000_000,
      text: overrides.text ?? FIXTURE_TEXT,
      from: {
        id: overrides.senderId ?? FIXTURE_SENDER_ID,
        is_bot: false,
        is_premium: true,
        first_name: FIXTURE_FIRST_NAME,
        last_name: FIXTURE_LAST_NAME,
        username: FIXTURE_USERNAME,
        language_code: 'es',
      },
      chat: {
        id: FIXTURE_CHAT_ID,
        type: 'private',
        first_name: FIXTURE_FIRST_NAME,
        username: FIXTURE_USERNAME,
      },
      entities: [],
    },
  };
}

export function telegramCallbackUpdate(
  data: string,
  overrides: { readonly senderId?: number; readonly updateId?: number } = {},
): Record<string, unknown> {
  return {
    update_id: overrides.updateId ?? 900002,
    callback_query: {
      id: 'cb-0001',
      data,
      from: {
        id: overrides.senderId ?? FIXTURE_SENDER_ID,
        is_bot: false,
        is_premium: true,
        first_name: FIXTURE_FIRST_NAME,
        last_name: FIXTURE_LAST_NAME,
        username: FIXTURE_USERNAME,
        language_code: 'es',
      },
      message: {
        message_id: 78,
        date: 1_774_000_100,
        chat: { id: FIXTURE_CHAT_ID, type: 'private', first_name: FIXTURE_FIRST_NAME },
      },
    },
  };
}
