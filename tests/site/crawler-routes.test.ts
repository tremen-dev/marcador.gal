/**
 * SPEC-005 CA-7 — `/robot` responde directo, no por redirección.
 *
 * La dirección viaja dentro del user-agent en cada petición que hacemos, y un
 * tercero la va a copiar en su `robots.txt` o en su lista de bloqueo. Un `3xx`
 * en medio la convierte en dos direcciones, y la que él anotó deja de ser la
 * que sirve la página.
 *
 * Lo que este fichero NO puede comprobar, y por eso lo comprueba el verificador
 * sobre el servidor real: que la respuesta sea un `200` y que no haya ningún
 * salto por delante. Aquí se fija lo que sí es del programa: que las rutas
 * existen donde dicen existir y que ninguna redirección las toca.
 *
 * Las direcciones se afirman con LITERALES y no solo con la constante. Leerlas
 * de forma simbólica compara el valor consigo mismo y deja pasar un renombrado
 * silencioso (F-SPEC-004-9), y estas dos son justamente las que ADR-010 §5
 * dice que no se mueven nunca.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import nextConfig from '../../next.config';
import { USER_AGENT_CONTACT } from '@/polite/user-agent';
import { SITE_REDIRECTS } from '@/site/redirects';
import { CRAWLER_PATH, SITE_ORIGIN } from '@/site/routes';

async function redirects() {
  const configured = await nextConfig.redirects?.();
  return configured ?? [];
}

describe('CA-7 — `/robot` y `/es/robot` responden directo', () => {
  test('1. las direcciones son exactamente `/robot` y `/es/robot`', () => {
    expect(CRAWLER_PATH.gl).toBe('/robot');
    expect(CRAWLER_PATH.es).toBe('/es/robot');
  });

  test('2. y hay una ruta del App Router sirviendo cada una de las dos', () => {
    // No basta con que la constante diga `/robot`: el directorio tiene que
    // llamarse igual, o la constante apuntaría a un 404 sin que nada avisara.
    expect(existsSync(join(process.cwd(), 'src/app/(gl)/robot/page.tsx'))).toBe(true);
    expect(existsSync(join(process.cwd(), 'src/app/(es)/es/robot/page.tsx'))).toBe(true);

    expect(existsSync(join(process.cwd(), `src/app/(gl)${CRAWLER_PATH.gl}/page.tsx`))).toBe(true);
    expect(existsSync(join(process.cwd(), `src/app/(es)${CRAWLER_PATH.es}/page.tsx`))).toBe(true);
  });

  test('3. ninguna redirección tiene a `/robot` ni a `/es/robot` por origen', async () => {
    const sources = (await redirects()).map((r) => r.source);

    expect(sources).not.toContain('/robot');
    expect(sources).not.toContain('/es/robot');
    expect(sources).not.toContain(CRAWLER_PATH.gl);
    expect(sources).not.toContain(CRAWLER_PATH.es);
  });

  test('4. ni ninguna redirección de comodín distinta de la del `www`, que sale del ápice', async () => {
    // El comodín `/:path*` sí alcanza a `/robot`, pero solo en `www`, y su
    // destino es la MISMA ruta en el ápice. Cualquier otro comodín sería un
    // salto que la dirección del user-agent no puede permitirse.
    const wildcards = SITE_REDIRECTS.filter((r) => r.source.includes(':path*'));

    expect(wildcards).toHaveLength(1);
    expect(wildcards[0]?.has).toEqual([{ type: 'host', value: 'www.marcador.gal' }]);
    expect(wildcards[0]?.destination).toBe(`${SITE_ORIGIN}/:path*`);
  });

  test('5. la dirección que viaja en el user-agent es la del ápice, la que no salta', () => {
    expect(USER_AGENT_CONTACT).toBe('https://marcador.gal/robot');
    expect(USER_AGENT_CONTACT).not.toContain('www.');
  });
});
