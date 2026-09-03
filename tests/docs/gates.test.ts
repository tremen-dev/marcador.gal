/**
 * SPEC-016 CA-4.5 — el gate de calidad es UN SOLO COMANDO, y quitarle una
 * pieza es una ofensa visible en vez de un descuido.
 *
 * LA ASERCIÓN ES MODESTA Y SE DECLARA COMO TAL. Este caso NO prueba que el
 * gate se ejecute: no hay CI (F-SPEC-016-1) y quien lo corre sigue siendo una
 * persona o un rol. Lo único que sujeta es que el script exista y siga
 * encadenando los cuatro comandos, en el orden de coste creciente y
 * diagnóstico decreciente que fija CA-4.1.
 *
 * Por qué existe: `npm test` no puede ver lo que solo ve el empaquetador. El
 * defecto que abrió SPEC-016 pasó por una suite entera en verde.
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';

const PACKAGE_JSON = join(process.cwd(), 'package.json');

async function scripts(): Promise<Record<string, string>> {
  const parsed: unknown = JSON.parse(await readFile(PACKAGE_JSON, 'utf8'));
  return (parsed as { scripts: Record<string, string> }).scripts;
}

describe('CA-4 — `npm run gates` encadena los cuatro comandos', () => {
  test('1. el script `gates` existe', async () => {
    expect((await scripts()).gates).toBeTypeOf('string');
  });

  test('2. y contiene los cuatro: `typecheck`, `lint`, `build` y `test`', async () => {
    const gates = (await scripts()).gates ?? '';

    for (const command of ['typecheck', 'lint', 'build', 'test']) {
      expect(gates).toContain(command);
    }
  });

  test('3. en el orden que fija CA-4.1: tipos, lint, build, tests', async () => {
    const gates = (await scripts()).gates ?? '';
    const positions = ['typecheck', 'lint', 'build', 'test'].map((c) => gates.indexOf(c));

    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  test('4. `test:db` queda FUERA: necesita `DATABASE_URL_TEST` y una rama de Neon compartida', async () => {
    // F-SPEC-015-8. Meterlo dentro haría que el gate fallase por motivos que no
    // son del código. Sigue siendo obligatorio para el verificador; no es este
    // comando.
    const all = await scripts();

    expect(all.gates).not.toContain('test:db');
    expect(all['test:db']).toBeTypeOf('string');
  });
});
