/**
 * CA-1, la mitad que es código: el ápice sirve el sitio y las direcciones no
 * se rompen.
 *
 * `/` redirige `308` a `/proxecto` y `www` redirige `308` al ápice. Parece un
 * rodeo y no lo es: ADR-010 §5 reserva `/` para el producto, y el día que el
 * producto la ocupe, cualquier enlace que la carta o un tercero hayan guardado
 * tiene que seguir funcionando. Una URL que se rompe es una de las cosas que
 * esta épica existe para no publicar.
 *
 * La OTRA mitad de CA-1 —apuntar el DNS de `marcador.gal` en Dinahosting al
 * despliegue de Vercel— es acción humana y ningún test la observa. Hoy el
 * dominio sigue resolviendo a `82.98.135.43`, el aparcamiento del registrador.
 */
import { describe, expect, test } from 'vitest';
import nextConfig from '../../next.config';
import { SITE_REDIRECTS } from '@/site/redirects';
import { PROJECT_PATH, SITE_ORIGIN } from '@/site/routes';

async function redirects() {
  const configured = await nextConfig.redirects?.();
  return configured ?? [];
}

describe('CA-1 — el dominio deja de ser un aparcamiento (mitad de código)', () => {
  test('1. next.config sirve exactamente las redirecciones del sitio', async () => {
    expect(await redirects()).toEqual(SITE_REDIRECTS);
  });

  test('2. `/` redirige permanente a la dirección canónica de la página', async () => {
    const rule = (await redirects()).find((r) => r.source === '/' && r.has === undefined);

    expect(rule?.destination).toBe(PROJECT_PATH.gl);
    expect(rule?.permanent).toBe(true);
  });

  test('3. `/es` redirige permanente a su gemela en castellano', async () => {
    const rule = (await redirects()).find((r) => r.source === '/es' && r.has === undefined);

    expect(rule?.destination).toBe(PROJECT_PATH.es);
    expect(rule?.permanent).toBe(true);
  });

  test('4. www redirige permanente al ápice, y no al revés', async () => {
    const rules = await redirects();
    const www = rules.find((r) => r.has?.some((h) => h.value === 'www.marcador.gal'));

    expect(www?.permanent).toBe(true);
    expect(www?.destination).toBe(`${SITE_ORIGIN}/:path*`);
    // Va primero: si no, `/` en www redirigiría a `/proxecto` sin salir de www.
    expect(rules.indexOf(www!)).toBe(0);
  });

  test('5. ninguna ruta de contenido se redirige: `/proxecto` y `/robot` no se mueven', async () => {
    const sources = (await redirects()).map((r) => r.source);

    expect(sources).not.toContain(PROJECT_PATH.gl);
    expect(sources).not.toContain(PROJECT_PATH.es);
    expect(sources).not.toContain('/robot');
    expect(sources).not.toContain('/es/robot');
  });
});
