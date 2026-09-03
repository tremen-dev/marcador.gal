/**
 * CA-2.8 — el catálogo declarado se valida con zod y RECHAZA ENTERO un fichero
 * con un `correspondent_id` que no case con `corresponsal-\d+` (ADR-022 §2).
 *
 * La forma prohíbe POR CONSTRUCCIÓN `corresponsal-<localidad>` y
 * `corresponsal-<nombre>`, que en un repositorio público, cruzados con el
 * calendario declarado, identifican a una persona en una comarca pequeña.
 */
import { describe, expect, test } from 'vitest';
import {
  CORRESPONDENT_ID_PATTERN,
  correspondentOf,
  parseCatalog,
  readCorrespondentMap,
  resolveCorrespondent,
} from '@/bot/correspondents';
import { catalogFileName, emptyCatalog, loadCatalog } from '@/bot/catalog';
import { ACTIVE_SEASON } from '@/ingest/measurement';
import type { CorrespondentId } from '@/bot/correspondents';

const VALID = {
  season: '2026/27',
  correspondents: [
    { correspondent_id: 'corresponsal-01', competitions: ['futgal-preferente-g1'], alta: '2026-03-01', activo: true },
  ],
};

describe('CA-2.8 — la forma del `correspondent_id`', () => {
  test('1. `corresponsal-01` vale; `corresponsal-xove` y `corresponsal-alberto` no', () => {
    expect(CORRESPONDENT_ID_PATTERN.test('corresponsal-01')).toBe(true);
    expect(CORRESPONDENT_ID_PATTERN.test('corresponsal-12')).toBe(true);
    expect(CORRESPONDENT_ID_PATTERN.test('corresponsal-xove')).toBe(false);
    expect(CORRESPONDENT_ID_PATTERN.test('corresponsal-alberto')).toBe(false);
    expect(CORRESPONDENT_ID_PATTERN.test('corresponsal-01-vigo')).toBe(false);
  });

  test('2. el catálogo se RECHAZA ENTERO, no fila a fila', () => {
    const poisoned = {
      season: '2026/27',
      correspondents: [
        ...VALID.correspondents,
        { correspondent_id: 'corresponsal-xove', competitions: ['x'], alta: '2026-03-01', activo: true },
      ],
    };

    expect(() => parseCatalog(poisoned)).toThrow(/invalid_format|regex/);
    // Y no queda medio cargado: no hay valor de retorno parcial que consultar.
    expect(parseCatalog(VALID).correspondents.length).toBe(1);
  });

  test('3. y una clave de más también lo rechaza: el esquema es estricto', () => {
    expect(() =>
      parseCatalog({
        season: '2026/27',
        correspondents: [{ ...VALID.correspondents[0], telegram_user_id: 1 }],
      }),
    ).toThrow(/unrecognized|Unrecognized/);
  });

  test('4. un corresponsal sin competiciones no es un corresponsal', () => {
    expect(() =>
      parseCatalog({
        season: '2026/27',
        correspondents: [{ ...VALID.correspondents[0], competitions: [] }],
      }),
    ).toThrow(/too_small|at least/);
  });
});

describe('CA-2 — el catálogo REAL nace vacío, y el bot con él', () => {
  test('5. `corresponsais/2026-27.json` existe, es válido y no tiene a nadie', () => {
    const catalog = loadCatalog(ACTIVE_SEASON);
    expect(catalog.season).toBe(ACTIVE_SEASON);
    expect(catalog.correspondents).toEqual([]);
  });

  test('6. el nombre del fichero se deriva de la temporada de la RFGF', () => {
    expect(catalogFileName('2026/27')).toBe('2026-27.json');
  });

  test('7. y con el catálogo vacío no se reconoce a nadie, esté mapeado o no', () => {
    const map = new Map([['4242', 'corresponsal-01' as CorrespondentId]]);
    expect(resolveCorrespondent(map, emptyCatalog('2026/27'), 4242)).toBeNull();
  });
});

describe('CA-2.2 — no mapeado, no activo y de baja son indistinguibles', () => {
  const catalog = parseCatalog({
    season: '2026/27',
    correspondents: [
      { correspondent_id: 'corresponsal-01', competitions: ['c'], alta: '2026-03-01', activo: true },
      { correspondent_id: 'corresponsal-02', competitions: ['c'], alta: '2026-03-01', activo: false },
    ],
  });
  const map = new Map([
    ['1', 'corresponsal-01' as CorrespondentId],
    ['2', 'corresponsal-02' as CorrespondentId],
  ]);

  test('8. el activo se resuelve; el inactivo y el desconocido dan el MISMO `null`', () => {
    expect(resolveCorrespondent(map, catalog, 1)?.correspondent_id).toBe('corresponsal-01');
    expect(resolveCorrespondent(map, catalog, 2)).toBeNull();
    expect(resolveCorrespondent(map, catalog, 99)).toBeNull();
  });

  test('9. y `correspondentOf` no inventa nada', () => {
    expect(correspondentOf(catalog, 'corresponsal-09' as CorrespondentId)).toBeNull();
  });
});

describe('CA-2.5 — el mapeo, leído del entorno y de ningún otro sitio', () => {
  test('10. sin la variable, el mapa está VACÍO: no reconoce a nadie', () => {
    expect(readCorrespondentMap({}).size).toBe(0);
    expect(readCorrespondentMap({ TELEGRAM_CORRESPONDENTS: '' }).size).toBe(0);
    expect(readCorrespondentMap({ TELEGRAM_CORRESPONDENTS: '   ' }).size).toBe(0);
  });

  test('11. un valor ilegible es un mapa vacío, nunca una excepción', () => {
    // Fallo CERRADO: un despliegue mal configurado no reconoce a nadie, que es
    // el estado en el que el bot nace.
    expect(readCorrespondentMap({ TELEGRAM_CORRESPONDENTS: 'non é json' }).size).toBe(0);
    expect(readCorrespondentMap({ TELEGRAM_CORRESPONDENTS: '{"1":"pepe"}' }).size).toBe(0);
    expect(readCorrespondentMap({ TELEGRAM_CORRESPONDENTS: '[1,2,3]' }).size).toBe(0);
  });

  test('12. y un valor válido se lee entero', () => {
    const map = readCorrespondentMap({
      TELEGRAM_CORRESPONDENTS: '{"111":"corresponsal-01","222":"corresponsal-02"}',
    });
    expect(map.get('111')).toBe('corresponsal-01');
    expect(map.get('222')).toBe('corresponsal-02');
    expect(map.size).toBe(2);
  });
});
