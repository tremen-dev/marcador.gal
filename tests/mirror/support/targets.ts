/**
 * The six pairs (source, competition) of the spike window: 3 automatic sources
 * × 2 competitions (ADR-002). Shared by the phase A tests so the arithmetic of
 * RN-11 is done against the real shape of the window, not a toy of two.
 */
import { competitionId, sourceId } from '@/mirror/ids';
import type { CaptureTarget } from '@/mirror/capture/ports';

export const TERCERA = competitionId('rfef-tercera-g1');
export const PREFERENTE = competitionId('futgal-preferente-g1');

export const FUTGAL = sourceId('futgal');
export const CEROACERO = sourceId('ceroacero');
export const RESULTADOS = sourceId('resultados-futbol');

export const TARGETS: readonly CaptureTarget[] = [
  {
    source: FUTGAL,
    competition_id: TERCERA,
    url: 'https://www.futgal.es/pnfg/NPcd/NFG_CmpJornada?cod_primaria=1000120&codgrupo=1',
    ext: 'html',
  },
  {
    source: FUTGAL,
    competition_id: PREFERENTE,
    url: 'https://www.futgal.es/pnfg/NPcd/NFG_CmpJornada?cod_primaria=1000110&codgrupo=1',
    ext: 'html',
  },
  {
    source: CEROACERO,
    competition_id: TERCERA,
    url: 'https://www.ceroacero.es/edicion/tercera-rfef-grupo-1/live',
    ext: 'html',
  },
  {
    source: CEROACERO,
    competition_id: PREFERENTE,
    url: 'https://www.ceroacero.es/edicion/preferente-galicia-grupo-1/live',
    ext: 'html',
  },
  {
    source: RESULTADOS,
    competition_id: TERCERA,
    url: 'https://www.resultados-futbol.com/tercera-rfef-grupo1/directo',
    ext: 'html',
  },
  {
    source: RESULTADOS,
    competition_id: PREFERENTE,
    url: 'https://www.resultados-futbol.com/preferente-galicia-grupo1/directo',
    ext: 'html',
  },
];
