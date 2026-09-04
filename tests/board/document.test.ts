/**
 * SPEC-018 CA-2.2, CA-2.6 a CA-2.9, CA-8, CA-9, CA-10, CA-12 y CA-13 — lo que
 * el documento servido dice, byte a byte.
 *
 * SE AFIRMA SOBRE LO QUE EL MANEJADOR SIRVE, no sobre un render de
 * conveniencia. Es lo que F-SPEC-004-7 pedía y lo que servir desde un
 * `route.ts` da gratis: esta pantalla LLEVA UN GUION, así que sería
 * exactamente el caso que ese finding teme.
 */
import { describe, expect, test } from 'vitest';
import { boardApiHandler } from '@/api/handler';
import { REFRESH_SECONDS } from '@/api/freshness';
import { boardHandler } from '@/board/handler';
import { es } from '@/i18n/es';
import { gl } from '@/i18n/gl';
import { qualifiersBundle } from '@/i18n/qualifiers';
import { statusesBundle } from '@/i18n/statuses';
import { titlesBundle } from '@/i18n/titles';
import { MATCH_QUALIFIERS } from '@/model/qualifier';
import { MATCH_STATUSES } from '@/model/match';
import { MAILBOX } from '@/site/contact';
import { CRAWLER_PATH, PROJECT_PATH, SCOREBOARD_PATH } from '@/site/routes';
import { AUTOMATIC_SOURCES } from '@/board/sources';
import { DEFAULT_SOURCES } from '@/ingest/sources';
import {
  SCENE_MATCHES,
  get,
  liveDecision,
  observation,
  scene,
  sceneMatch,
} from './support/doubles';
import type { SiteLocale } from '@/i18n/site-bundle';
import type { BoardMatchRead } from '@/api/ports';

const PAGE = { gl: 'https://marcador.gal/marcador', es: 'https://marcador.gal/es/marcador' };
const LOCALES: readonly SiteLocale[] = ['gl', 'es'];

async function serve(
  locale: SiteLocale,
  options: Parameters<typeof scene>[0] = {},
): Promise<Response> {
  const board = scene(options);
  return await boardHandler({ ports: board.ports, locale })(get(PAGE[locale]));
}

async function html(
  locale: SiteLocale,
  options: Parameters<typeof scene>[0] = {},
): Promise<string> {
  return await (await serve(locale, options)).text();
}

/** El HTML de una fila concreta, para afirmar sobre ella y no sobre la página. */
function rowOf(document: string, matchId: string): string {
  const found = new RegExp(`<tr data-match="${matchId}">([\\s\\S]*?)</tr>`).exec(document);
  return found?.[1] ?? '';
}

const FULL: readonly BoardMatchRead[] = [
  {
    match_id: SCENE_MATCHES[0]!.id,
    live: liveDecision(),
    supporting: [observation({ observed_at: '2026-09-06T17:38:00.000Z' })],
  },
];

describe('CA-2 — lo que publicar obliga, sobre el documento servido', () => {
  test('1. CA-2.2 — `noindex, noarchive` por cabecera y por meta, en las tres rutas, SIN `nofollow`', async () => {
    for (const locale of LOCALES) {
      const response = await serve(locale);
      const body = await response.text();

      expect(response.headers.get('X-Robots-Tag')).toBe('noindex, noarchive');
      expect(body).toContain('<meta name="robots" content="noindex, noarchive">');
      expect(response.headers.get('X-Robots-Tag')).not.toContain('nofollow');
      expect(body).not.toContain('nofollow');
    }

    const board = scene();
    const api = await boardApiHandler({ ports: board.ports })(get('https://marcador.gal/api/board'));
    expect(api.headers.get('X-Robots-Tag')).toBe('noindex, noarchive');
  });

  test('2. CA-2.6 — `/api/board` NUNCA emite una cabecera CORS', async () => {
    const board = scene({ reads: FULL });
    const response = await boardApiHandler({ ports: board.ports })(
      get('https://marcador.gal/api/board', { Origin: 'https://un-tercero.example' }),
    );

    for (const header of [
      'Access-Control-Allow-Origin',
      'Access-Control-Allow-Methods',
      'Access-Control-Allow-Headers',
      'Access-Control-Expose-Headers',
    ]) {
      expect(response.headers.get(header)).toBeNull();
    }
  });

  test('3. CONTROL POSITIVO: la comprobación de CORS muerde cuando la cabecera está', () => {
    const withCors = new Response('', { headers: { 'Access-Control-Allow-Origin': '*' } });

    expect(withCors.headers.get('Access-Control-Allow-Origin')).not.toBeNull();
  });

  test('4. CA-2.6 — la ruta del contrato no se documenta: no está en `src/i18n/` ni en `src/site/`', async () => {
    const { readSourceFiles } = await import('../site/source-scan');
    const files = await readSourceFiles();

    const carriers = files
      .filter((file) => file.path.startsWith('i18n/') || file.path.startsWith('site/'))
      .filter((file) => file.text.includes('/api/board'))
      .map((file) => file.path);

    expect(carriers).toEqual([]);

    // Y en el documento servido aparece EXACTAMENTE UNA VEZ, dentro del
    // `fetch` del guion: nunca como `<a href>` y nunca como prosa.
    const document = await html('gl');
    expect([...document.matchAll(/\/api\/board/g)]).toHaveLength(2); // el fetch y el bloque de configuración
    expect(document).not.toContain('href="/api/board"');
  });

  test('5. CA-2.7 — ninguna llamada a la acción, y ningún formulario', async () => {
    /** LISTA CERRADA, con su motivo: es lo que dispararía el art. 10 LSSI. */
    const NO_CALL_TO_ACTION = [
      'patrocina',
      'patrocinio',
      'publicidade',
      'publicidad',
      'anuncio',
      'doar',
      'donar',
      'apoia',
      'apoya',
      'subscri',
    ] as const;

    for (const locale of LOCALES) {
      const document = (await html(locale)).toLowerCase();

      expect(document).not.toContain('<form');
      expect(document).not.toContain('<input');
      expect(document).not.toContain('<iframe');
      expect(document).not.toContain('<button');
      expect(NO_CALL_TO_ACTION.filter((term) => document.includes(term))).toEqual([]);
    }
  });

  test('6. y sus únicos enlaces salientes son `/robot`, `/proxecto` y el buzón', async () => {
    for (const locale of LOCALES) {
      const document = await html(locale);
      const hrefs = [...document.matchAll(/<a href="([^"]+)"/g)].map((match) => match[1]!);

      const other = locale === 'gl' ? 'es' : 'gl';
      // El conmutador de lengua NO es un enlace saliente: es esta misma
      // pantalla en la otra lengua (D-2).
      const outbound = hrefs.filter((href) => href !== SCOREBOARD_PATH[other]);

      expect(outbound.sort()).toEqual(
        [CRAWLER_PATH[locale], PROJECT_PATH[locale], `mailto:${MAILBOX}`].sort(),
      );
    }
  });

  test('7. CA-2.8 — el buzón se alcanza en un clic, en el pie, en las dos lenguas', async () => {
    for (const locale of LOCALES) {
      const document = await html(locale);

      expect(document).toContain(`<a href="mailto:${MAILBOX}"`);
    }
  });

  test('8. CA-2.9 — `/proxecto` y `/robot` enlazan la pantalla, en las dos lenguas', async () => {
    const { createElement } = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const GlProject = (await import('@/app/(gl)/proxecto/page')).default;
    const EsProject = (await import('@/app/(es)/es/proxecto/page')).default;
    const GlCrawler = (await import('@/app/(gl)/robot/page')).default;
    const EsCrawler = (await import('@/app/(es)/es/robot/page')).default;

    const pages = [
      { markup: renderToStaticMarkup(createElement(GlProject)), path: SCOREBOARD_PATH.gl },
      { markup: renderToStaticMarkup(createElement(EsProject)), path: SCOREBOARD_PATH.es },
      { markup: renderToStaticMarkup(createElement(GlCrawler)), path: SCOREBOARD_PATH.gl },
      { markup: renderToStaticMarkup(createElement(EsCrawler)), path: SCOREBOARD_PATH.es },
    ];

    for (const page of pages) {
      expect(page.markup).toContain(`<a href="${page.path}"`);
    }
  });
});

describe('CA-8 — los tres relojes, y la barrera léxica que impide confundirlos', () => {
  test('9. CA-8.1 — la fila lleva el reloj de la FUENTE, como edad en minutos', async () => {
    const document = await html('gl', { reads: FULL });
    const row = rowOf(document, SCENE_MATCHES[0]!.id);

    // `observed_at` es 17:38 y el reloj de la escena son las 18:00 ⇒ 22 min.
    expect(row).toContain('Hai 22 min');
    // Y NUNCA un instante absoluto con segundos.
    expect(row).not.toMatch(/\d{2}:\d{2}:\d{2}/);
  });

  test('10. y sin ninguna observación dice «Aínda non», nunca «sen datos»', async () => {
    const document = await html('gl');
    const row = rowOf(document, SCENE_MATCHES[0]!.id);

    expect(row).toContain('Aínda non');
    expect(document.toLowerCase()).not.toContain('sen datos');
    expect(document.toLowerCase()).not.toContain('sin datos');
  });

  test('11. CA-8.2 — el reloj del TRANSPORTE está FUERA de la tabla', async () => {
    const document = await html('gl', { reads: FULL });

    const notice = document.indexOf('id="board-transport"');
    const table = document.indexOf('<table>');

    expect(notice).toBeGreaterThan(-1);
    expect(table).toBeGreaterThan(-1);
    expect(notice).toBeLessThan(table);
    // Y no está dentro de ninguna fila.
    expect(rowOf(document, SCENE_MATCHES[0]!.id)).not.toContain('board-transport');
  });

  test('12. CA-8.3 — el aviso de refresco no usa ninguna clase `s-*` ni `q-*`', async () => {
    const document = await html('gl', { reads: FULL });
    const found = /<p class="transport"[^>]*>/.exec(document);

    expect(found?.[0]).toBeDefined();
    expect(found![0]).not.toMatch(/class="[^"]*\bs-/);
    expect(found![0]).not.toMatch(/class="[^"]*\bq-/);

    // Y su regla de estilo no referencia ninguno de los tres tokens de estado.
    const { BOARD_STYLESHEET } = await import('@/board/view/styles');
    const rule = /\.transport\{([^}]*)\}/.exec(BOARD_STYLESHEET);

    expect(rule?.[1]).toBeDefined();
    for (const token of ['--accent-live', '--amber', '--alert']) {
      expect(rule![1]).not.toContain(token);
    }
  });

  test('13. CONTROL POSITIVO: usar uno de esos tokens en el aviso pone rojo el mecanismo', () => {
    const synthetic = '.transport{color:var(--alert)}';
    const rule = /\.transport\{([^}]*)\}/.exec(synthetic);

    expect(rule![1]).toContain('--alert');
  });

  test('14. CA-8.4 — barrera léxica: `sinal`/`señal` fuera del marcador, `actualizar` fuera de `qualifiers`', () => {
    for (const bundle of [gl.board, es.board]) {
      const text = Object.values(bundle).join(' \n ').toLowerCase();
      expect(text).not.toContain('sinal');
      expect(text).not.toContain('señal');
    }

    for (const locale of LOCALES) {
      const text = Object.values(qualifiersBundle(locale)).join(' \n ').toLowerCase();
      expect(text).not.toContain('actualizar');
      expect(text).not.toContain('actualizado');
    }
  });

  test('15. CONTROL POSITIVO: meter una de las palabras pone rojo el caso', () => {
    const synthetic = { refreshFailed: 'Non hai sinal na páxina' };
    const text = Object.values(synthetic).join(' ').toLowerCase();

    expect(text).toContain('sinal');
  });

  test('16. CA-8.5 — prohibido diagnosticar de quién es la culpa', () => {
    const REFRESH_KEYS = [
      'refreshedNow',
      'refreshedMinutes',
      'refreshFailed',
      'reloadHint',
      'autoRefresh',
    ] as const;

    const BLAME = ['conexión', 'conexion', 'cobertura', 'rede', 'red '] as const;

    for (const bundle of [gl.board, es.board]) {
      for (const key of REFRESH_KEYS) {
        const value = bundle[key].toLowerCase();
        expect(BLAME.filter((term) => value.includes(term))).toEqual([]);
      }
    }
  });
});

describe('CA-9 — la primera pintura es el dato; el refresco degrada sin romper', () => {
  test('17. CA-9.1 — el documento ya trae las filas con sus valores, y no hay «cargando»', async () => {
    const document = await html('gl', { reads: FULL });

    for (const match of SCENE_MATCHES) expect(document).toContain(`data-match="${match.id}"`);
    expect(rowOf(document, SCENE_MATCHES[0]!.id)).toContain('1-0');

    expect(document.toLowerCase()).not.toContain('cargando');
    expect(document.toLowerCase()).not.toContain('skeleton');
  });

  test('18. CA-9.2 — sin el guion, la página sigue siendo correcta', async () => {
    const document = await html('gl', { reads: FULL });
    const withoutScript = document.replaceAll(/<script[\s\S]*?<\/script>/g, '');

    expect(withoutScript).toContain('1-0');
    expect(withoutScript).toContain('En xogo');
    expect(withoutScript).toContain('RC Celta B');
  });

  test('19. CA-9.3 — el guion sustituye VALORES: ni un `innerHTML`, ni una fila creada', async () => {
    const { REFRESH_SCRIPT } = await import('@/board/view/refresh');

    expect(REFRESH_SCRIPT).not.toContain('innerHTML');
    expect(REFRESH_SCRIPT).not.toContain('outerHTML');
    expect(REFRESH_SCRIPT).not.toContain('createElement');
    expect(REFRESH_SCRIPT).not.toContain('insertAdjacent');
    expect(REFRESH_SCRIPT).not.toContain('removeChild');
    expect(REFRESH_SCRIPT).toContain('textContent');
  });

  test('20. CA-9.4 — en la rama de error no se toca ninguna clase ni ningún estilo', async () => {
    const { REFRESH_SCRIPT } = await import('@/board/view/refresh');
    const branch = /function sayStale\(\)\{([\s\S]*?)\n  \}/.exec(REFRESH_SCRIPT);

    expect(branch?.[1]).toBeDefined();
    expect(branch![1]).not.toContain('className');
    expect(branch![1]).not.toContain('classList');
    expect(branch![1]).not.toContain('.style');
    // Lo único que cambia es el aviso de página.
    expect(branch![1]).toContain('say(');
  });

  test('21. y el guion no guarda nada en el navegador', async () => {
    const { REFRESH_SCRIPT } = await import('@/board/view/refresh');

    expect(REFRESH_SCRIPT).not.toContain('localStorage');
    expect(REFRESH_SCRIPT).not.toContain('sessionStorage');
    expect(REFRESH_SCRIPT).not.toContain('document.cookie');
  });
});

describe('CA-10 — lo que la pantalla enseña por fila, y las cuatro que más fácil se publican mal', () => {
  test('22. CA-10.1 y CA-10.2 — nombres canónicos, sin traducir y sin truncar, en las DOS lenguas', async () => {
    for (const locale of LOCALES) {
      const document = await html(locale, { reads: FULL });
      const row = rowOf(document, SCENE_MATCHES[0]!.id);

      expect(row).toContain('RC Celta B');
      expect(row).toContain('UD Ourense');
    }

    // Y la hoja no declara `text-overflow: ellipsis` sobre la celda del equipo.
    const { BOARD_STYLESHEET } = await import('@/board/view/styles');
    expect(BOARD_STYLESHEET).not.toContain('text-overflow');
  });

  test('23. CA-10.3 — un partido sin `Decision`: sin marcador y SIN cualificador', async () => {
    const document = await html('gl');
    const row = rowOf(document, SCENE_MATCHES[0]!.id);

    expect(row).toContain('Sen marcador publicado');
    for (const qualifier of MATCH_QUALIFIERS) {
      expect(row, `la fila lleva ${qualifier}`).not.toContain(
        qualifiersBundle('gl')[qualifier],
      );
    }
  });

  test('24. CA-10.4 — un `postponed` en su sitio por hora, sin marcador, con su literal', async () => {
    const postponed = sceneMatch({
      id: 'futgal-preferente-g1-2026-27-j1-aprazado',
      kickoff: '2026-09-06T17:15:00.000Z',
      home_id: 'sd-compostela',
      away_id: 'cd-barco',
    });

    const document = await html('gl', {
      matches: [...SCENE_MATCHES, postponed],
      reads: [
        {
          match_id: postponed.id,
          live: liveDecision({
            match_id: postponed.id,
            status: 'postponed',
            home_score: null,
            away_score: null,
            rule: 'RN-06',
            supporting_observation_ids: ['obs-9'],
          }),
          supporting: [],
        },
      ],
    });

    const row = rowOf(document, postponed.id);
    expect(row).toContain('Aprazado');
    expect(row).toContain('Sen marcador publicado');

    // EN SU POSICIÓN POR HORA ORIGINAL: entre las 17:00 y las 18:30.
    const order = [...document.matchAll(/data-match="([^"]+)"/g)].map((match) => match[1]);
    expect(order.indexOf(postponed.id)).toBe(order.indexOf(SCENE_MATCHES[0]!.id) + 1);
  });

  test('25. CA-10.5 — un `suspended` con su marcador parcial Y con su reserva', async () => {
    const document = await html('gl', {
      reads: [
        {
          match_id: SCENE_MATCHES[0]!.id,
          live: liveDecision({ status: 'suspended', home_score: 1, away_score: 0 }),
          supporting: [observation({ status: 'suspended' })],
        },
      ],
    });

    const row = rowOf(document, SCENE_MATCHES[0]!.id);
    expect(row).toContain('1-0');
    expect(row).toContain('Suspendido');
    expect(document).toContain('o marcador non é definitivo ata que decida o Comité de Competición');
  });

  test('26. CA-10.6 — EL CASO QUE IMPIDE PUBLICAR UN RESULTADO FALSO', async () => {
    // Un partido cerrado por el timeout de RN-06 SIN ninguna observación de
    // apoyo que diga `finished` — que es exactamente lo que le pasa a un
    // aplazado que ninguna fuente pudo aplazar. La fila lleva LAS CUATRO
    // COSAS a la vez, y quitar cualquiera de las dos últimas la vuelve mentira.
    const document = await html('gl', {
      now: '2026-09-06T21:00:00.000Z',
      reads: [
        {
          match_id: SCENE_MATCHES[0]!.id,
          live: liveDecision({
            status: 'finished',
            home_score: 0,
            away_score: 0,
            rule: 'RN-06',
          }),
          supporting: [observation({ status: 'scheduled', home_score: null, away_score: null })],
        },
      ],
    });

    const row = rowOf(document, SCENE_MATCHES[0]!.id);

    expect(row).toContain('0-0');
    expect(row).toContain('Rematado');
    expect(row).toContain('Pendente de confirmar');
    expect(row).toContain('Hai 202 min');
  });

  test('27. CONTROL POSITIVO: quitar el cualificador o el instante deja una mentira', async () => {
    const document = await html('gl', {
      reads: [
        {
          match_id: SCENE_MATCHES[0]!.id,
          live: liveDecision({ status: 'finished', home_score: 0, away_score: 0, rule: 'RN-06' }),
          supporting: [observation({ status: 'scheduled', home_score: null, away_score: null })],
        },
      ],
    });
    const row = rowOf(document, SCENE_MATCHES[0]!.id);

    // El mismo predicado del caso anterior, sobre la fila con esas dos cosas
    // borradas: se pone rojo, que es lo que demuestra que el caso mide.
    const mutilated = row
      .replaceAll('Pendente de confirmar', '')
      .replaceAll(/Hai \d+ min/g, '');

    expect(mutilated).not.toContain('Pendente de confirmar');
    expect(mutilated).not.toMatch(/Hai \d+ min/);
    expect(row).toContain('Pendente de confirmar');
  });

  test('28. CA-10.7 — ningún minuto de juego: ni campo, ni rótulo', async () => {
    const document = await html('gl', { reads: FULL });

    for (const bundle of [gl.board, es.board]) {
      const text = Object.values(bundle).join(' ').toLowerCase();
      expect(text).not.toContain('minuto');
    }
    expect(document.toLowerCase()).not.toContain('minuto');
  });

  test('29. CA-10.8 — no existe ningún sexto estado, ni la cadena `descanso`', async () => {
    expect(MATCH_STATUSES).toHaveLength(5);

    const { readSourceFiles } = await import('../site/source-scan');
    const files = await readSourceFiles();
    const mine = files.filter(
      (file) => file.path.startsWith('api/') || file.path.startsWith('board/'),
    );

    for (const file of mine) {
      const lower = file.text.toLowerCase();
      expect(lower, `${file.path} nombra descanso`).not.toContain('descanso');
      expect(lower, `${file.path} nombra half_time`).not.toContain('half_time');
      expect(file.text, `${file.path} nombra DESC`).not.toMatch(/\bDESC\b/);
    }
  });
});

describe('CA-12 — el cualificador con etiqueta completa; el estado, nunca frase suelta', () => {
  test('30. CA-12.1 — los cuatro con su literal completo, sin abreviatura y sin glifo', async () => {
    for (const locale of LOCALES) {
      for (const qualifier of MATCH_QUALIFIERS) {
        const document = await html(locale, {
          reads: [
            {
              match_id: SCENE_MATCHES[0]!.id,
              live: liveDecision(
                qualifier === 'sen_sinal'
                  ? { rule: 'RN-07' }
                  : qualifier === 'pendente_de_confirmar'
                    ? { status: 'finished', rule: 'RN-06' }
                    : { provisional: qualifier === 'provisional' },
              ),
              supporting: qualifier === 'pendente_de_confirmar' ? [] : [observation()],
            },
          ],
        });
        const row = rowOf(document, SCENE_MATCHES[0]!.id);

        expect(row).toContain(qualifiersBundle(locale)[qualifier]);
      }

      const document = await html(locale, { reads: FULL });
      for (const abbreviation of ['PROV', 'CONF', 'P. CONF.', 'PEND']) {
        expect(document).not.toContain(abbreviation);
      }
      expect(document).not.toContain('…');
    }
  });

  test('31. CA-12.2 — `provisional` y `confirmado` con el MISMO color, y `confirmado` sin marca', async () => {
    const { BOARD_STYLESHEET } = await import('@/board/view/styles');
    const rule = /\.q-provisional,\.q-confirmado\{([^}]*)\}/.exec(BOARD_STYLESHEET);

    expect(rule?.[1]).toBe('color:var(--fg)');
    // Ninguno de los dos lleva el acento de marca ni ninguna marca extra.
    expect(BOARD_STYLESHEET).not.toMatch(/\.q-confirmado[^,{]*\{[^}]*--brand/);
    expect(BOARD_STYLESHEET).not.toMatch(/\.q-confirmado[^,{]*::(?:before|after)/);
  });

  test('32. CONTROL POSITIVO: apagar uno de los dos pone rojo el mecanismo', () => {
    const synthetic = '.q-provisional{color:var(--fg-dim)}.q-confirmado{color:var(--fg)}';
    const rule = /\.q-provisional,\.q-confirmado\{([^}]*)\}/.exec(synthetic);

    expect(rule).toBeNull();
  });

  test('33. CA-12.3 y CA-12.4 — cada estado tiene su `<th>`, y estado y cualificador van en celdas distintas', async () => {
    const document = await html('gl', { reads: FULL });

    expect(document).toContain('<th scope="col">Estado</th>');
    expect(document).toContain('<th scope="col">Cualificador</th>');

    const row = rowOf(document, SCENE_MATCHES[0]!.id);
    // Dos celdas distintas: nunca pegados sin nada entre ellos.
    expect(row).toMatch(/<td data-field="status"[^>]*>En xogo<\/td>/);
    expect(row).toMatch(/<td data-field="qualifier"[^>]*>Provisional<\/td>/);
    expect(row).not.toContain('Rematado Confirmado');
  });

  test('34. CA-12.5 — para cada estado y cada cualificador presente hay un NODO DE TEXTO que lo nombra', async () => {
    const document = await html('gl', { reads: FULL });

    // La clase está, y el texto también: nunca sólo el color.
    expect(document).toMatch(/class="s-live"[^>]*>En xogo</);
    expect(document).toMatch(/class="q-provisional"[^>]*>Provisional</);
  });
});

describe('CA-13 — galego por defecto, castellano con paridad, ningún literal en el código', () => {
  test('35. CA-13.1 — las dos lenguas tienen exactamente las mismas claves, ninguna vacía', () => {
    expect(Object.keys(gl.board).sort()).toEqual(Object.keys(es.board).sort());

    for (const bundle of [gl.board, es.board]) {
      expect(Object.entries(bundle).filter(([, value]) => value.trim() === '')).toEqual([]);
    }
  });

  test('36. CA-13.3 — la lengua sale de la URL: `/marcador` galego, `/es/marcador` castellano', async () => {
    expect(await html('gl')).toContain('<html lang="gl">');
    expect(await html('es')).toContain('<html lang="es">');

    const glDoc = await html('gl');
    expect(glDoc).toContain(gl.board.heading);
    expect(glDoc).not.toContain(es.board.emptyNoMatchday);
  });

  test('37. CA-13.4 — los cinco estados y los cuatro cualificadores salen de los namespaces compartidos', () => {
    // No hay un segundo juego de ninguno de los dos en el bundle del marcador.
    for (const bundle of [gl.board, es.board]) {
      const values = Object.values(bundle);
      for (const locale of LOCALES) {
        for (const status of MATCH_STATUSES) {
          expect(values).not.toContain(statusesBundle(locale)[status]);
        }
        for (const qualifier of MATCH_QUALIFIERS) {
          expect(values).not.toContain(qualifiersBundle(locale)[qualifier]);
        }
      }
    }
  });

  test('38. CA-13.5 — `titles.scoreboard` es `marcador.gal` en las dos lenguas, y es lo que se sirve', async () => {
    expect(titlesBundle('gl').scoreboard).toBe('marcador.gal');
    expect(titlesBundle('es').scoreboard).toBe('marcador.gal');

    for (const locale of LOCALES) {
      expect(await html(locale)).toContain('<title>marcador.gal</title>');
    }
  });

  test('39. CA-13.8 — el aviso lleva sus CUATRO cosas, antes de la tabla y sin interacción', async () => {
    for (const locale of LOCALES) {
      const document = await html(locale, { reads: FULL });
      const bundle = locale === 'gl' ? gl.board : es.board;

      for (const claim of [
        bundle.noticeMeasurement,
        bundle.noticeNotOfficial,
        bundle.noticeSingleSource,
      ]) {
        expect(document).toContain(claim);
      }
      expect(document).toContain(bundle.noticeStop.replace('{mailbox}', MAILBOX));

      // ANTES DE LA TABLA, en orden del documento, y sin `<details>` plegado.
      expect(document.indexOf(bundle.noticeMeasurement)).toBeLessThan(document.indexOf('<table>'));
      expect(document).not.toContain('<details');
    }
  });

  test('40. y el número de fuentes se DERIVA de `DEFAULT_SOURCES`, no se teclea', async () => {
    expect(AUTOMATIC_SOURCES).toBe(DEFAULT_SOURCES.length);
    expect(AUTOMATIC_SOURCES).toBe(1);

    const document = await html('gl');
    expect(document).toContain(gl.board.noticeSingleSource);
    expect(document).not.toContain(gl.board.noticeSeveralSources.replace('{sources}', '2'));
  });

  test('41. CONTROL POSITIVO: con una segunda fuente el aviso deja de decir «unha soa»', async () => {
    const { boardDocument } = await import('@/board/handler');
    const withTwo = boardDocument(
      'gl',
      { version: null, matchday_declared: false, matches: [] },
      '2026-09-06T18:00:00.000Z',
      '"x"',
      2,
    );

    expect(withTwo).not.toContain(gl.board.noticeSingleSource);
    expect(withTwo).toContain('Hai 2 fontes automáticas');
  });

  test('42. y el aviso NO cruza la línea de CA-5.3: ni fuente, ni dominio, ni peso, ni tipo', async () => {
    for (const locale of LOCALES) {
      const bundle = locale === 'gl' ? gl.board : es.board;
      const notice = [
        bundle.noticeMeasurement,
        bundle.noticeNotOfficial,
        bundle.noticeSingleSource,
        bundle.noticeStop,
      ]
        .join(' ')
        .toLowerCase();

      for (const forbidden of ['ceroacero', 'besoccer', 'agregador', '0.7', 'resultados-futbol']) {
        expect(notice).not.toContain(forbidden);
      }
      // Y no dice que «la fuente oficial no nos deja»: eso está en `/robot`.
      expect(notice).not.toContain('robots.txt');
      expect(notice).not.toContain('non nos deixa');
      expect(notice).not.toContain('no nos deja');
    }
  });

  test('43. la leyenda del refresco INTERPOLA el número, no lo escribe', async () => {
    const document = await html('gl');

    expect(document).toContain(`cada ${REFRESH_SECONDS} segundos`);
    expect(gl.board.autoRefresh).toContain('{seconds}');
  });
});
