/**
 * CA-5 — ningún literal incrustado. La barrera de D-2, escrita como aserción.
 *
 * D-2 dice «nunca hardcodeados». Una costumbre no sobrevive a un año de
 * cambios; un test que lee el código fuente sí. Precedente y forma: el caso 8
 * de `tests/mirror/capture/robots.test.ts`, que recorre
 * `src/mirror/capture/*.ts` y falla si `.fetch(` aparece fuera de `http.ts`.
 *
 * Se revisan los ficheros de ruta y componente del sitio. Los bundles de i18n
 * quedan fuera por definición: son el sitio donde el texto DEBE estar.
 */
import { describe, expect, test } from 'vitest';
import { readSourceFiles, SRC, stripComments, type SourceFile } from './source-scan';
import { join } from 'node:path';

/**
 * `_contract/model-client.tsx` no es una ruta —Next ignora las carpetas con
 * guion bajo— sino la prueba de SPEC-001 de que el modelo canónico cruza al
 * cliente. Su texto son valores de ejemplo del modelo, no interfaz.
 */
const NOT_A_ROUTE = 'app/_contract/';

/** Texto entre `>` y el siguiente tag: si lleva letras, es texto incrustado. */
const JSX_TEXT = /(?<!=)>([^<>{}]*\p{L}[^<>{}]*)<\/?[A-Za-z]/gu;

/**
 * Un literal como hijo de JSX: `{'Hola'}`. Va detrás de un `>` o de otra
 * expresión, que es lo que lo distingue de un literal de atributo —`href={…}`,
 * con `=` delante— y de una clave de objeto en código normal.
 */
const LITERAL_CHILD = /[>}]\s*\{\s*['"`]\p{L}/u;

/** Atributos que el usuario LEE. Los demás (href, className, lang) no lo son. */
const VISIBLE_ATTRIBUTE =
  /\b(?:title|alt|aria-label|placeholder|content)\s*=\s*(?:["']|\{\s*["'`])/;

/**
 * Solo TypeScript: las tres reglas de este fichero hablan de JSX y CA-5 habla
 * de «ficheros de ruta y componente». El escaneo compartido ya no filtra por
 * extensión —CA-13.3 necesita `src/` entero, F-SPEC-004-6—, así que el filtro
 * vive aquí, que es donde es cierto.
 */
function isTypeScript(file: SourceFile): boolean {
  return file.path.endsWith('.ts') || file.path.endsWith('.tsx');
}

async function siteSources(): Promise<SourceFile[]> {
  const files = [
    ...(await readSourceFiles(join(SRC, 'app'))),
    ...(await readSourceFiles(join(SRC, 'site'))),
  ];
  return files.filter((f) => isTypeScript(f) && !f.path.startsWith(NOT_A_ROUTE));
}

describe('CA-5 — ningún literal incrustado', () => {
  test('1. el escaneo mira de verdad las rutas del sitio, no un conjunto vacío', async () => {
    const paths = (await siteSources()).map((f) => f.path);

    expect(paths).toContain('app/(gl)/proxecto/page.tsx');
    expect(paths).toContain('app/(es)/es/proxecto/page.tsx');
    expect(paths).toContain('site/project-page.tsx');
    expect(paths).toContain('site/document.tsx');
  });

  test('2. ningún fichero de ruta o componente lleva texto visible escrito a mano', async () => {
    const offenders: string[] = [];

    // Solo `.tsx`: las tres reglas hablan de JSX, y un `.ts` no tiene.
    const components = (await siteSources()).filter((f) => f.path.endsWith('.tsx'));

    for (const file of components) {
      const code = stripComments(file.text);

      for (const [, captured] of code.matchAll(JSX_TEXT)) {
        if (captured !== undefined && captured.trim().length > 0) {
          offenders.push(`${file.path}: texto JSX «${captured.trim()}»`);
        }
      }
      if (LITERAL_CHILD.test(code)) offenders.push(`${file.path}: literal como hijo de JSX`);
      if (VISIBLE_ATTRIBUTE.test(code)) offenders.push(`${file.path}: literal en atributo visible`);
    }

    expect(offenders).toEqual([]);
  });
});
