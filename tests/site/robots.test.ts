/**
 * CA-11 — nuestro propio `robots.txt`, comprobado con nuestro propio parser.
 *
 * Le pedimos a la RFGF que respete el nuestro (RN-11, y la carta lo dice con
 * todas las letras). Comernos nuestra propia comida —pasar nuestro
 * `robots.txt` por el mismo `parseRobots` con el que decidimos si podemos
 * pedir una página ajena— es la forma barata de que eso no sea una frase.
 */
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { GET } from '@/app/robots.txt/route';
import { parseRobots } from '@/polite/robots';
import { USER_AGENT } from '@/polite/user-agent';
import { MAILBOX } from '@/site/contact';
import { buildRobotsTxt } from '@/site/robots-txt';
import { CRAWLER_PATH, PROJECT_PATH, SITE_ORIGIN } from '@/site/routes';
import { stripComments } from './source-scan';

describe('CA-11 — robots.txt propio', () => {
  test('1. la ruta responde 200 y text/plain', async () => {
    const response = GET();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toMatch(/^text\/plain/);
    expect(await response.text()).toBe(buildRobotsTxt());
  });

  test('2. lo genera la aplicación: no hay un fichero suelto que se desincronice', () => {
    expect(existsSync(join(process.cwd(), 'public/robots.txt'))).toBe(false);
    expect(existsSync(join(process.cwd(), 'src/app/robots.txt/route.ts'))).toBe(true);
  });

  test('3. no lleva ningún Disallow', () => {
    expect(buildRobotsTxt()).not.toMatch(/^\s*disallow:/im);
  });

  test('4. nuestro propio parser nos deja rastrear el sitio entero', () => {
    const policy = parseRobots(buildRobotsTxt(), USER_AGENT);

    const paths = ['/', PROJECT_PATH.gl, PROJECT_PATH.es, CRAWLER_PATH.gl, CRAWLER_PATH.es];

    expect(paths.filter((path) => !policy.isAllowed(`${SITE_ORIGIN}${path}`))).toEqual([]);
  });

  test('5. el buzón del comentario sale de la constante, no escrito a mano', () => {
    expect(buildRobotsTxt()).toContain(MAILBOX);
  });

  test('6. el generador no lleva ninguna dirección escrita', async () => {
    const source = stripComments(
      await readFile(join(process.cwd(), 'src/site/robots-txt.ts'), 'utf8'),
    );

    expect(source).not.toMatch(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);
  });
});
