/**
 * SPEC-018 CA-13.1 y CA-13.2 — LA MITAD DE TIPO, que es donde vive el
 * mecanismo de verdad.
 *
 * `asBoardText` NO SE EXPORTA, así que un literal visible escrito dentro de
 * `src/board/` o de `src/api/` NO COMPILA: no hay forma de fabricar un
 * `BoardText` fuera de `src/i18n/board.ts`. Eso es lo que hace de D-2 un fallo
 * de compilación en vez de una costumbre — un escaneo de prosa no puede
 * distinguir `Confirmar` de un identificador.
 *
 * Y la PARIDAD LA IMPONE EL TIPO: quitarle una clave a `es.ts` rompe el
 * `typecheck`, no un test que cuenta claves.
 */
import { describe, expectTypeOf, test } from 'vitest';
import { boardBundle, fillBoard } from '@/i18n/board';
import type { BoardText } from '@/i18n/board';
import type { BoardBundle } from '@/i18n/board-bundle';
import type { QualifiersBundle } from '@/i18n/qualifiers-bundle';
import { cell, heading, paragraph, text } from '@/board/view/markup';
import type { MatchQualifier } from '@/model/qualifier';

describe('CA-13.2 — `BoardText` es una cadena con marca y no se fabrica fuera de i18n', () => {
  test('1. la superficie de marcado sólo acepta `BoardText`', () => {
    const bundle = boardBundle('gl');

    expectTypeOf(text).parameter(0).toEqualTypeOf<BoardText>();
    expectTypeOf(heading).parameter(1).toEqualTypeOf<BoardText>();
    expectTypeOf(paragraph).parameter(0).toEqualTypeOf<BoardText>();
    expectTypeOf(cell).parameter(0).toEqualTypeOf<BoardText>();

    expectTypeOf(bundle.heading).toEqualTypeOf<BoardText>();
  });

  test('2. un literal escrito a mano NO compila', () => {
    // @ts-expect-error un `string` no es un `BoardText`: D-2 es un fallo de
    // compilación, no una costumbre.
    text('Marcador');

    // @ts-expect-error tampoco en una celda, que es donde más tienta.
    cell('En xogo', 'status');

    // @ts-expect-error ni en un encabezado.
    heading(1, 'O marcador');

    // Y la marca no es asignable desde `string` en ninguna dirección útil.
    expectTypeOf<string>().not.toEqualTypeOf<BoardText>();
    expectTypeOf<BoardText>().toExtend<string>();
  });

  test('3. `fillBoard` interpola dentro de la marca y no puede fabricarla', () => {
    const bundle = boardBundle('gl');

    expectTypeOf(fillBoard(bundle.lastDataMinutes, { n: '3' })).toEqualTypeOf<BoardText>();

    // @ts-expect-error no se puede interpolar sobre una cadena cualquiera.
    fillBoard('Hai {n} min', { n: '3' });
  });
});

describe('CA-13.1 — la paridad la impone el TIPO', () => {
  test('4. `BoardBundle` es un contrato completo, y ninguna clave es opcional', () => {
    expectTypeOf<BoardBundle>().toExtend<Readonly<Record<keyof BoardBundle, string>>>();
    expectTypeOf<Required<BoardBundle>>().toEqualTypeOf<BoardBundle>();
  });

  test('5. y las claves de `qualifiers` SON `MATCH_QUALIFIERS`, no una copia', () => {
    expectTypeOf<keyof QualifiersBundle>().toEqualTypeOf<MatchQualifier>();
  });
});
