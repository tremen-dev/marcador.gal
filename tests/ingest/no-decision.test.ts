/**
 * CA-12 (RN-08, D-3) — el adaptador no publica nada.
 *
 * Publicar es escribir una `Decision`, y la única puerta es el motor. Es un
 * test de arquitectura y no de comportamiento: se busca en el árbol, porque
 * una frontera que solo vive en una spec es una frontera que alguien cruza el
 * día que nadie relee la spec.
 */
import { describe, expect, test } from 'vitest';
import { SourceAdapter } from '@/ingest/adapter';
import { CEROACERO_ENTRY, sourceRegistry } from '@/ingest/sources';
import { RobotsGate } from '@/polite/policy';
import { USER_AGENT } from '@/polite/user-agent';
import { readSourceTree, stripComments } from '../support/source-tree';
import { FIVE_BRANCHES, ceroaceroPage } from '../fixtures/ceroacero';
import { FakeClock, MemoryRawStore, RESOLVE_ALL, spyFetcher } from './support/doubles';
import type { HttpRequest, HttpResponse } from '@/polite/http';

/** Lo que significa «construir una `Decision`», escrito como algo que muerde. */
const DECISION_MARKERS = [
  /\bDecisionStore\b/,
  /\bDecisionSchema\b/,
  /\bDecision\b\s*[,;)\]]/,
  /from\s+['"]@\/model\/decision['"]/,
  /decisions\s*\(/,
];

describe('CA-12 — `src/ingest/` no menciona `DecisionStore` ni construye `Decision`', () => {
  test('1. ningún fichero de `src/ingest/` cruza la frontera', async () => {
    const tree = await readSourceTree();
    const ingest = tree.filter((file) => file.path.startsWith('ingest/'));

    // Control de que el escaneo mide algo: el directorio existe y no está vacío.
    expect(ingest.length).toBeGreaterThanOrEqual(4);

    const offenders = ingest.filter((file) =>
      DECISION_MARKERS.some((marker) => marker.test(file.code)),
    );

    expect(offenders.map((file) => file.path)).toEqual([]);
  });

  test('2. y el detector muerde: falla si alguien lo añade', async () => {
    // Control positivo. Sin él, un detector vaciado pasaría igual de verde.
    const intruders = [
      "import type { DecisionStore } from '@/db/ports';",
      "import { DecisionSchema } from '@/model/decision';",
      "import type { Decision } from '@/model/decision';",
      'await store.decisions(match_id);',
    ];

    for (const intruder of intruders) {
      const code = stripComments(intruder);
      expect(DECISION_MARKERS.some((marker) => marker.test(code))).toBe(true);
    }
  });

  test('3. y ningún camino de ejecución escribe una: el adaptador solo devuelve `Observation`', async () => {
    const clock = new FakeClock('2026-09-06T17:00:00.000Z');
    const store = new MemoryRawStore();
    const page = ceroaceroPage(FIVE_BRANCHES);
    const respond = (request: HttpRequest): HttpResponse =>
      request.url.endsWith('/robots.txt')
        ? { status: 200, body: new TextEncoder().encode('User-agent: *\nAllow: /\n') }
        : { status: 200, body: page };
    const spy = spyFetcher(clock, respond);
    const registry = sourceRegistry([CEROACERO_ENTRY]);
    const adapter = new SourceAdapter({
      registry,
      fetcher: spy.fetcher,
      store,
      clock,
      robots: new RobotsGate({ fetcher: spy.fetcher, store, userAgent: USER_AGENT }),
      resolver: RESOLVE_ALL,
    });

    const target = registry.targets()[0]!;
    const outcome = await adapter.capture(target, clock.now());
    if (outcome.kind !== 'captured') throw new Error('esperaba una captura');
    const result = await adapter.read(target, outcome.body, outcome.raw_ref, outcome.at);

    // Lo que sale son `Observation` y filas sin resolver, y nada más.
    expect(Object.keys(result).sort()).toEqual(['observations', 'unresolved']);
    // Y en el archivo solo hay respuestas crudas: ni una fila de decisión.
    expect(store.keys.every((key) => key.endsWith('.html') || key.endsWith('.txt'))).toBe(true);
  });
});
