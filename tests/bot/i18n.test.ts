/**
 * CA-12 — todo texto visible sale del bundle, con paridad gl/es (D-2, D-8), y
 * CA-11.4 — sin preferencia guardada, la lengua es `gl`.
 *
 * La mitad estructural de CA-12.1 y CA-12.2 —que una lengua incompleta sea un
 * fallo de compilación, y que un literal escrito en `src/bot/` no compile— vive
 * en `tests/types/spec015-bot.test-d.ts`, porque es un invariante de TIPO y ahí
 * es donde este proyecto los prueba (prueba invertida, `@ts-expect-error`).
 * Aquí queda lo que se puede afirmar en ejecución.
 */
import { describe, expect, test } from 'vitest';
import { BOT_COMMANDS, TELEGRAM_COMMAND_PATTERN, commandOf } from '@/bot/commands';
import {
  BOT_LOCALES,
  DEFAULT_BOT_LOCALE,
  botBundle,
  botStatus,
  fill,
  joinLines,
  rawBotBundle,
} from '@/i18n/bot';
import { es } from '@/i18n/es';
import { gl } from '@/i18n/gl';
import { statusesBundle } from '@/i18n/statuses';
import { MATCH_STATUSES } from '@/model/match';
import type { BotBundle } from '@/i18n/bot-bundle';

describe('CA-12.1 — las dos lenguas satisfacen el MISMO contrato', () => {
  test('1. el espacio de nombres `bot` existe en gl y en es, y no está vacío', () => {
    expect(Object.keys(gl.bot).length).toBeGreaterThan(30);
    expect(Object.keys(es.bot).length).toBe(Object.keys(gl.bot).length);
  });

  test('2. paridad de claves exacta, en los dos sentidos', () => {
    const galego = Object.keys(gl.bot).sort();
    const castelan = Object.keys(es.bot).sort();
    expect(castelan).toEqual(galego);
  });

  test('3. ninguna clave llega vacía en ninguna de las dos lenguas', () => {
    for (const locale of BOT_LOCALES) {
      for (const [key, value] of Object.entries(rawBotBundle(locale))) {
        expect(value.trim(), `${locale}.${key}`).not.toBe('');
      }
    }
  });

  test('4. y las dos lenguas dicen cosas DISTINTAS donde tiene que haberlas', () => {
    // Si alguien copiase el bundle galego al castellano, la paridad de claves
    // pasaría y D-2 estaría igual de incumplido. `Marcador`, `Minuto` y
    // `Estado` son legítimamente iguales en las dos lenguas.
    const shared = new Set(['cardScoreLabel', 'cardMinuteLabel', 'cardStatusLabel',
      'cardConfirm', 'cardDiscard', 'languageGalego', 'openMatchesHeading']);
    const identical = Object.keys(gl.bot).filter(
      (key) =>
        !shared.has(key) &&
        gl.bot[key as keyof BotBundle] === es.bot[key as keyof BotBundle],
    );
    expect(identical).toEqual([]);
  });
});

describe('CA-12.4 — los comandos del dictamen, y NINGÚN `/estado`', () => {
  test('5. son los ocho declarados, en el orden del dictamen', () => {
    expect(BOT_COMMANDS.map((command) => command.name)).toEqual([
      'start',
      'axuda',
      'partidos',
      'cancelar',
      'lingua',
      'privacidade',
      'baixa',
      'parar',
    ]);
  });

  test('6. ninguno lleva acento ni `ñ`: Telegram no los admite', () => {
    for (const command of BOT_COMMANDS) {
      expect(TELEGRAM_COMMAND_PATTERN.test(command.name), `${command.name}`).toBe(true);
    }
  });

  test('7. `/estado` NO existe: colisionaría con el término del modelo canónico', () => {
    expect(BOT_COMMANDS.map((command) => command.name)).not.toContain('estado');
    expect(commandOf('/estado')).toBeNull();
  });

  test('8. cada comando tiene su descripción en las DOS lenguas', () => {
    for (const command of BOT_COMMANDS) {
      expect(gl.bot[command.description]).toBeTruthy();
      expect(es.bot[command.description]).toBeTruthy();
    }
  });

  test('9. `commandOf` lee el comando, con o sin sufijo de bot, y nada más', () => {
    expect(commandOf('/axuda')).toBe('axuda');
    expect(commandOf('  /axuda@marcadorbot  ')).toBe('axuda');
    expect(commandOf('/lingua es')).toBe('lingua');
    expect(commandOf('2-1 no minuto 70')).toBeNull();
    expect(commandOf('/inventado')).toBeNull();
  });
});

describe('CA-12.5 — los cinco estados salen de un espacio de nombres COMPARTIDO', () => {
  test('10. hay una entrada por cada valor de `MATCH_STATUSES` en las dos lenguas', () => {
    for (const locale of BOT_LOCALES) {
      const bundle = statusesBundle(locale);
      expect(Object.keys(bundle).sort()).toEqual([...MATCH_STATUSES].sort());
      for (const status of MATCH_STATUSES) expect(bundle[status]).not.toBe('');
    }
  });

  test('11. `live` es «En xogo», en una sola forma, y nunca «Directo»', () => {
    // Decidido por Alberto Fojo el 2026-09-03: una sola forma en todo el
    // producto (`dominio.md`). El sistema de diseño usa «Directo» como
    // etiqueta de filtro y queda desalineado: F-SPEC-015-9, EPIC-MEJORA.
    expect(botStatus('gl', 'live')).toBe('En xogo');
    expect(Object.values(statusesBundle('gl'))).not.toContain('Directo');
  });

  test('12. y son los literales que `dominio.md` registró ANTES de usarse', () => {
    expect(statusesBundle('gl')).toEqual({
      scheduled: 'Programado',
      live: 'En xogo',
      finished: 'Rematado',
      postponed: 'Aprazado',
      suspended: 'Suspendido',
    });
    expect(statusesBundle('es')).toEqual({
      scheduled: 'Programado',
      live: 'En juego',
      finished: 'Finalizado',
      postponed: 'Aplazado',
      suspended: 'Suspendido',
    });
  });

  test('13. el bot NO guarda su propia copia de los cinco estados', () => {
    // Están en `statuses`, no en `bot`: si alguien los duplicase, el bot y el
    // marcador podrían acabar diciendo cosas distintas del mismo estado.
    const values = Object.values(rawBotBundle('gl'));
    for (const status of Object.values(statusesBundle('gl'))) {
      expect(values, `${status}`).not.toContain(status);
    }
  });
});

describe('CA-12.6 — los nombres canónicos de la RFGF no se traducen', () => {
  test('14. «Celta B» se interpola tal cual en la tarjeta castellana', () => {
    const filled = fill(botBundle('es').ackRegistered, {
      home: 'UD Ourense',
      away: 'Celta B',
      homeScore: '2',
      awayScore: '1',
    });
    expect(filled).toBe('Registrado: UD Ourense 2 - 1 Celta B.');
  });

  test('15. un hueco sin valor se queda escrito: no se vacía en silencio', () => {
    expect(fill(botBundle('gl').ackRegistered, { home: 'Ourense' })).toContain('{away}');
  });

  test('16. `joinLines` compone líneas ya traducidas y nada más', () => {
    const bundle = botBundle('gl');
    expect(joinLines(bundle.cardHeading, bundle.cardHint)).toBe(
      `${bundle.cardHeading}\n${bundle.cardHint}`,
    );
  });
});

describe('CA-12.7 — el acuse dice que todavía no está publicado, sin jerga', () => {
  test('17. no nombra el motor de decisiones en ninguna de las dos lenguas', () => {
    for (const locale of BOT_LOCALES) {
      const text = rawBotBundle(locale).ackNotPublication.toLowerCase();
      expect(text).not.toContain('motor');
      expect(text).not.toContain('observation');
      expect(text).not.toContain('observaci');
    }
  });

  test('18. pero sí dice que no está publicado y que se compara con otras fuentes', () => {
    expect(rawBotBundle('gl').ackNotPublication).toContain('Aínda non está publicado');
    expect(rawBotBundle('gl').ackNotPublication).toContain('fontes');
    expect(rawBotBundle('es').ackNotPublication).toContain('Todavía no está publicado');
    expect(rawBotBundle('es').ackNotPublication).toContain('fuentes');
  });
});

describe('CA-11.4 — sin preferencia guardada, la lengua es galego', () => {
  test('19. el defecto declarado es `gl`, y es el primero de la lista', () => {
    expect(DEFAULT_BOT_LOCALE).toBe('gl');
    expect(BOT_LOCALES[0]).toBe('gl');
  });
});
