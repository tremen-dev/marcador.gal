/**
 * CA-11 — una fuente es una entrada del registro, no una rama en el código.
 *
 * El test está escrito como la simulación literal de «llega el sí de la RFGF»:
 * se añade `futgal` con peso 1.0 y su función de extracción, y se comprueba
 * que queda capturable y legible sin tocar ninguna firma ni ningún módulo
 * existente. El día que la carta se conteste, el diff es esta entrada.
 */
import { describe, expect, test } from 'vitest';
import { SourceAdapter } from '@/ingest/adapter';
import { tableExtractor } from '@/ingest/ceroacero';
import {
  CEROACERO_ENTRY,
  DEFAULT_SOURCES,
  FUTGAL,
  RN01_WEIGHTS,
  TERCERA_G1,
  UnknownSourceError,
  sourceRegistry,
} from '@/ingest/sources';
import { RobotsGate } from '@/polite/policy';
import { USER_AGENT } from '@/polite/user-agent';
import { FakeClock, MemoryRawStore, RESOLVE_ALL, spyFetcher } from './support/doubles';
import type { RowShape } from '@/ingest/ceroacero';
import type { SourceEntry } from '@/ingest/sources';
import type { HttpRequest, HttpResponse } from '@/polite/http';

const START = '2026-09-06T17:00:00.000Z';
const FUTGAL_URL = 'https://www.futgal.es/pnfg/NPcd/NFG_CmpJornada?cod_primaria=1000120&codgrupo=1';

/** Una forma de página DISTINTA, para que la fuente nueva no herede la de nadie. */
const FUTGAL_SHAPE: RowShape = {
  rowSelector: 'table.jornada tr.partido',
  identitySelector: 'td.marcador a[href]',
  identityAttribute: 'href',
  nameSelector: 'td.local, td.visitante',
  resultSelector: 'td.marcador',
  scorePattern: /(\d+)\s*[-–—]\s*(\d+)/u,
  kickoffPattern: /\b([01]?\d|2[0-3])[:.h]([0-5]\d)\b/u,
  statusWords: [['adiado', 'postponed']],
  liveMarker: /\bxogando\b/u,
};

/** Página SINTÉTICA, escrita a mano: no es HTML de nadie (ADR-009 §3). */
const FUTGAL_PAGE = new TextEncoder().encode(
  [
    '<html><body><table class="jornada">',
    '<tr class="partido"><td class="local">Bergantiños FC</td>',
    '<td class="marcador"><a href="/xornada/1/partido/7">1-0</a></td>',
    '<td class="visitante">UD Somozas</td></tr>',
    '<tr class="partido"><td class="local">Arosa SC</td>',
    '<td class="marcador"><a href="/xornada/1/partido/8">18:00</a></td>',
    '<td class="visitante">Silva SD</td></tr>',
    '</table></body></html>',
  ].join(''),
);

const FUTGAL_ENTRY: SourceEntry = {
  source: FUTGAL,
  weight: RN01_WEIGHTS.official,
  ext: 'html',
  competitions: [[TERCERA_G1, FUTGAL_URL]],
  extract: tableExtractor(FUTGAL, FUTGAL_SHAPE),
};

const ROBOTS_TXT = ['User-agent: *', 'Allow: /', ''].join('\n');

function respond(request: HttpRequest): HttpResponse {
  if (request.url.endsWith('/robots.txt')) {
    return { status: 200, body: new TextEncoder().encode(ROBOTS_TXT) };
  }
  return { status: 200, body: FUTGAL_PAGE };
}

function adapterFor(entries: readonly SourceEntry[]) {
  const clock = new FakeClock(START);
  const store = new MemoryRawStore();
  const spy = spyFetcher(clock, respond);
  const registry = sourceRegistry(entries);
  const adapter = new SourceAdapter({
    registry,
    fetcher: spy.fetcher,
    store,
    clock,
    robots: new RobotsGate({ fetcher: spy.fetcher, store, userAgent: USER_AGENT }),
    resolver: RESOLVE_ALL,
  });
  return { adapter, clock, spy, store, registry };
}

describe('CA-11 — llega el sí de la RFGF: el diff es una entrada', () => {
  const entries = [...DEFAULT_SOURCES, FUTGAL_ENTRY];

  test('1. el registro de hoy tiene UNA fuente, y la nueva se suma sin tocarla', () => {
    expect(DEFAULT_SOURCES).toHaveLength(1);
    expect(entries).toHaveLength(2);
    // Identidad, no igualdad estructural: la entrada vieja es LA MISMA.
    expect(sourceRegistry(entries).entry(CEROACERO_ENTRY.source)).toBe(CEROACERO_ENTRY);
  });

  test('2. queda capturable: su par aparece en los objetivos y sale la petición', async () => {
    const h = adapterFor(entries);

    expect(h.registry.targets().map((t) => `${t.source}/${t.competition_id}`)).toEqual([
      'ceroacero/futgal-preferente-g1',
      'ceroacero/rfef-tercera-g1',
      'futgal/rfef-tercera-g1',
    ]);

    const target = h.registry.targets()[2]!;
    const outcome = await h.adapter.capture(target, h.clock.now());

    expect(outcome.kind).toBe('captured');
    expect(h.spy.forUrl(FUTGAL_URL)).toHaveLength(1);
    if (outcome.kind !== 'captured') return;
    expect(outcome.raw_ref.startsWith('futgal/rfef-tercera-g1/')).toBe(true);
  });

  test('3. y legible: sus filas salen con SU forma, no con la de ceroacero', async () => {
    const h = adapterFor(entries);
    const target = h.registry.targets()[2]!;
    const outcome = await h.adapter.capture(target, h.clock.now());
    if (outcome.kind !== 'captured') throw new Error('esperaba una captura');

    const { observations } = await h.adapter.read(
      target,
      outcome.body,
      outcome.raw_ref,
      outcome.at,
    );

    expect(observations).toHaveLength(2);
    expect(observations.map((o) => o.status)).toEqual(['finished', 'scheduled']);
    expect(observations.map((o) => o.source)).toEqual(['futgal', 'futgal']);
  });

  test('4. el `confidence` sale del peso del registro: 1.0, no el 0.7 del agregador', async () => {
    const h = adapterFor(entries);
    const target = h.registry.targets()[2]!;
    const outcome = await h.adapter.capture(target, h.clock.now());
    if (outcome.kind !== 'captured') throw new Error('esperaba una captura');

    const { observations } = await h.adapter.read(
      target,
      outcome.body,
      outcome.raw_ref,
      outcome.at,
    );

    expect(observations.map((o) => o.confidence)).toEqual([1, 1]);
    expect(RN01_WEIGHTS.official).toBe(1);
    expect(RN01_WEIGHTS.aggregator).toBe(0.7);
  });

  test('5. cambiar el peso EN EL REGISTRO cambia el `confidence`, sin tocar el adaptador', async () => {
    const demoted: SourceEntry = { ...FUTGAL_ENTRY, weight: RN01_WEIGHTS.club_tweet };
    const h = adapterFor([demoted]);
    const target = h.registry.targets()[0]!;
    const outcome = await h.adapter.capture(target, h.clock.now());
    if (outcome.kind !== 'captured') throw new Error('esperaba una captura');

    const { observations } = await h.adapter.read(
      target,
      outcome.body,
      outcome.raw_ref,
      outcome.at,
    );

    expect(observations.map((o) => o.confidence)).toEqual([0.5, 0.5]);
  });

  test('6. la tabla de pesos de RN-01 vive aquí, entera y ejecutable', () => {
    expect(RN01_WEIGHTS).toEqual({
      operator: 1,
      official: 1,
      paid_api: 0.9,
      correspondent: 0.8,
      aggregator: 0.7,
      club_tweet: 0.5,
    });
  });

  test('7. una fuente que no está en el registro no se atiende en silencio', () => {
    expect(() => sourceRegistry(DEFAULT_SOURCES).entry(FUTGAL)).toThrow(UnknownSourceError);
  });
});
