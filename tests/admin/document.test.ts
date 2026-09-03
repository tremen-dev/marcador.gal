/**
 * CA-1.10 y CA-12 (la mitad que se ve) — el panel no se anuncia, y lo que el
 * operador tiene delante para poder arbitrar.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ESTE FICHERO SUSTITUYE A `tests/admin/view.test.ts`, Y HAY QUE DECIR POR QUÉ.
 *
 * **CA-10 ESTÁ CONGELADO DESDE EL 2026-09-03.** Alberto Fojo decidió que
 * `docs/diseno/` es el sistema de diseño del proyecto y que el panel del
 * operador lo sigue también, lo que contradice **ADR-025 §4.2 y §4.3** —«una
 * interfaz de medición no importa ni deriva los tokens de `docs/diseno/`», «ni
 * un valor de `docs/diseno/` se copia»—. `sdd-arquitecto` está escribiendo
 * **ADR-026** para superseder parcialmente ese punto.
 *
 * La versión anterior de este fichero afirmaba, entre otras cosas, que NINGÚN
 * color de `docs/diseno/` aparecía en la hoja del panel. Bajo ADR-026 eso será
 * exactamente lo contrario de lo que hay que afirmar, así que se retira: una
 * aserción que dice lo opuesto de la regla que viene no es cobertura, es una
 * trampa para quien la lea después. La hoja de estilos se retira con ella.
 *
 * LO QUE SOBREVIVE ES LO QUE NO ES ESTILO: que el panel no se anuncia
 * (ADR-024, no ADR-025), que su documento no carga nada de fuera, y que cada
 * estado y cada cualificador es un NODO DE TEXTO que lo nombra —que es
 * ADR-013 §2, y ADR-013 sigue mandando entero—. Nada de esto depende de qué
 * paleta acabe usando el panel.
 */
import { describe, expect, test } from 'vitest';
import * as cheerio from 'cheerio';
import { MATCH_QUALIFIERS } from '@/model/qualifier';
import { MATCH_STATUSES } from '@/model/match';
import { statusesBundle } from '@/i18n/statuses';
import { gl } from '@/i18n/gl';
import { getPanel, liveDecision, scene, SCENE_MATCH } from './support/doubles';
import type { MatchDecisions } from '@/admin/ports';

const WITH_DECISION = new Map<string, MatchDecisions>([
  [SCENE_MATCH.id, { live: liveDecision(), log: [liveDecision()] }],
]);

const DETAIL_URL = `https://marcador.gal/admin?partido=${encodeURIComponent(SCENE_MATCH.id)}`;

async function panelHtml(url?: string): Promise<string> {
  const built = scene({ decisions: WITH_DECISION });
  return await (await getPanel(built, url === undefined ? {} : { url })).text();
}

describe('CA-1.10 — el panel no se anuncia, y `robots.txt` NO cambia', () => {
  test('1. cabecera `X-Robots-Tag` y `meta name="robots"` en todas sus rutas', async () => {
    const built = scene({ decisions: WITH_DECISION });

    for (const url of ['https://marcador.gal/admin', DETAIL_URL]) {
      const answer = await getPanel(built, { url });
      expect(answer.headers.get('x-robots-tag')).toBe('noindex, nofollow');

      const $ = cheerio.load(await answer.text());
      expect($('meta[name="robots"]').attr('content')).toBe('noindex, nofollow');
    }
  });

  test('2. y el formulario de acceso también, que es lo que ve quien no entra', async () => {
    const built = scene();
    const answer = await getPanel(built, { token: 'no-es-un-token' });

    expect(answer.headers.get('x-robots-tag')).toBe('noindex, nofollow');
    expect(cheerio.load(await answer.text())('meta[name="robots"]').attr('content')).toBe(
      'noindex, nofollow',
    );
  });

  test('3. `robots.txt` NO nombra `/admin`: listarlo publicaría la ruta', async () => {
    const { buildRobotsTxt } = await import('@/site/robots-txt');
    const served = buildRobotsTxt();

    expect(served).not.toContain('/admin');
    expect(served).not.toContain('Disallow: /admin');
  });
});

describe('El documento del panel no carga NADA de fuera', () => {
  test('4. ni hoja externa, ni fuente, ni script: hoy tampoco hoja propia', async () => {
    const $ = cheerio.load(await panelHtml());

    expect($('link').length).toBe(0);
    expect($('script').length).toBe(0);
    // CONGELADO: la hoja del panel llega con CA-10, cuando ADR-026 esté
    // firmado y se sepa qué tokens hereda de `docs/diseno/`.
    expect($('style').length).toBe(0);
  });

  test('5. y no renderiza NINGUNA imagen (ADR-013 §4 y §5, no negociable)', async () => {
    for (const url of [undefined, DETAIL_URL]) {
      const $ = cheerio.load(await panelHtml(url));
      expect($('img').length).toBe(0);
      expect($('svg').length).toBe(0);
      expect($('picture').length).toBe(0);
    }
  });
});

describe('ADR-013 §2 — ningún estado ni cualificador se distingue solo por color', () => {
  test('6. cada estado presente en el árbol tiene un nodo de TEXTO que lo nombra', async () => {
    const $ = cheerio.load(await panelHtml(DETAIL_URL));
    const visible = $('body').text();

    expect(visible).toContain(statusesBundle('gl').live);
    for (const status of MATCH_STATUSES) {
      expect(visible).toContain(statusesBundle('gl')[status]);
    }
  });

  test('7. y el cualificador de la `Decision` vigente también', async () => {
    const $ = cheerio.load(await panelHtml());
    const visible = $('body').text();

    expect(visible).toContain(gl.qualifiers.provisional);
    for (const qualifier of MATCH_QUALIFIERS) {
      expect(gl.qualifiers[qualifier].length).toBeGreaterThan(0);
    }
  });
});

describe('CA-12.1 y CA-12.2 — lo que el operador tiene DELANTE (RN-01)', () => {
  test('8. el tablero enseña los nombres canónicos, el estado y el cualificador', async () => {
    const $ = cheerio.load(await panelHtml());
    const visible = $('body').text();

    // Los nombres canónicos de la RFGF, que NO se traducen (dominio.md).
    expect(visible).toContain('RC Celta B');
    expect(visible).toContain('UD Ourense');
    expect(visible).toContain(statusesBundle('gl').live);
    expect(visible).toContain(gl.qualifiers.provisional);
  });

  test('9. y el detalle, las observaciones de CADA fuente y el log de decisiones', async () => {
    const $ = cheerio.load(await panelHtml(DETAIL_URL));
    const visible = $('body').text();

    expect(visible).toContain(gl.admin.detailObservations);
    expect(visible).toContain(gl.admin.detailDecisions);
    expect(visible).toContain(gl.admin.detailVersion);
    expect(visible).toContain(gl.admin.detailRule);
    expect(visible).toContain(gl.admin.detailSupport);
    // Y las tres operaciones que publican están servidas, cada una con su vale.
    expect(visible).toContain(gl.admin.formCorrection);
    expect(visible).toContain(gl.admin.formStatusChange);
    expect(visible).toContain(gl.admin.formRatify);
  });

  test('10. cada formulario lleva su cancelación, que es un enlace y nada más', async () => {
    const $ = cheerio.load(await panelHtml(DETAIL_URL));

    expect($('form').length).toBeGreaterThan(0);
    $('form').each((_index, element) => {
      expect($(element).find('[data-cancel]').length).toBeGreaterThan(0);
    });
  });
});
