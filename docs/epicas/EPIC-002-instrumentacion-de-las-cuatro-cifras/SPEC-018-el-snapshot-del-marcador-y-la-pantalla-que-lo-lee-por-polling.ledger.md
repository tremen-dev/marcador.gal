---
id: SPEC-018
tipo: ledger
epica: EPIC-002
---
# Ledger — SPEC-018 El snapshot del marcador y la pantalla que lo lee por polling

## Resumen
- Fase: `en-revision` — implementada el 2026-09-04 por `sdd-implementador`.
  **ADR-027 aprobado** el 2026-09-04. Gate de calidad **verde**:
  `npm run gates` (147 ficheros, 1710 casos, 0 errores de tipo) y
  `npm run test:db` (27 ficheros, 345 casos) por separado.
- Decidido en el gate del 2026-09-04 por Alberto Fojo: **el marcador se
  publica** (salida B), en `/marcador` y `/es/marcador`, **no en la raíz**;
  título `marcador.gal` a secas; `/api/board` sigue sirviendo JSON (R1 del rol
  legal considerada y descartada, y el residuo escrito).
- Dictámenes de dominio: `dictamenes-SPEC-018.md` (los tres roles, copiados enteros;
  `sdd-legal-datos` dictaminó **dos veces**, y el segundo manda donde hablen de lo mismo).
- Rama: `ft/SPEC-018-snapshot-e-paxina-minima`
- **Verificación: RED el 2026-09-04** por `sdd-verificador`. Cuatro findings
  (`F-SPEC-018-V1..V4`) y un residuo declarado (`V5`). La spec **se queda en
  `en-revision`**.

### Gates corridos por el verificador — 2026-09-04, SEGUNDA VUELTA

**`npm run gates`** — **VERDE**, salida literal:

```
 RUN  v4.1.11 /Users/albertofojo/src/tremen-dev/marcador.gal

 Test Files  147 passed (147)
      Tests  1717 passed (1717)
Type Errors  no errors
   Start at  15:28:33
   Duration  17.73s (transform 3.10s, setup 0ms, import 13.80s, tests 10.92s, environment 6ms, typecheck 292ms)
```

Y el build lista **trece rutas**, con las tres de esta spec dinámicas:

```
├ ƒ /admin          ├ ƒ /es/marcador   ├ ○ /proxecto
├ ƒ /api/board      ├ ○ /es/proxecto   ├ ○ /robot
├ ƒ /es/admin       ├ ○ /es/robot      └ ○ /robots.txt
├ ƒ /marcador       ├ ƒ /api/cron/ingest · ƒ /api/telegram/webhook · ○ /_not-found
```

**`npm run test:db`** — **VERDE**, salida literal:

```
 Test Files  27 passed (27)
      Tests  345 passed (345)
   Start at  15:30:14
   Duration  243.16s (transform 306ms, setup 0ms, import 1.30s, tests 239.73s, environment 1ms)
```

**Lo corrí yo, no lo tomé del encargo.** El host de Neon que el 04 por la mañana
daba `ENOTFOUND` resuelve ahora, así que **CA-6.4 queda ejercido** y
F-SPEC-018-V5 cerrado.

### Gates corridos por el verificador — 2026-09-04, PRIMERA VUELTA

**`npm run gates`** (typecheck → lint → build → test) — **VERDE**, salida literal
de la cola:

```
Route (app)
┌ ○ /_not-found        ├ ƒ /es/marcador
├ ƒ /admin             ├ ○ /es/proxecto
├ ƒ /api/board         ├ ○ /es/robot
├ ƒ /api/cron/ingest   ├ ƒ /marcador
├ ƒ /api/telegram/webhook  ├ ○ /proxecto
├ ƒ /es/admin          ├ ○ /robot
                       └ ○ /robots.txt

 RUN  v4.1.11 /Users/albertofojo/src/tremen-dev/marcador.gal

 Test Files  147 passed (147)
      Tests  1710 passed (1710)
Type Errors  no errors
   Start at  14:14:13
   Duration  17.73s (transform 3.25s, setup 0ms, import 13.86s, tests 10.93s, environment 6ms, typecheck 315ms)
```

**El `build` está dentro del gate por SPEC-016 y aquí se ve para qué sirve:** las
tres rutas nuevas aparecen en el manifiesto —`ƒ /marcador`, `ƒ /es/marcador`,
`ƒ /api/board`, las tres dinámicas—, que es algo que `npm test` no puede ver.

**`npm run test:db`** — **NO EJECUTABLE en este entorno**, salida literal:

```
 FAIL  tests/db/board-batch.test.ts [ tests/db/board-batch.test.ts ]
 … (27 ficheros)
Error: getaddrinfo ENOTFOUND ep-soft-river-b1ocpgd1-pooler.c-5.eu-central-1.aws.neon.tech

 Test Files  27 failed (27)
      Tests  345 skipped (345)
   Start at  14:14:55
   Duration  8.99s
```

Reproducido dos veces, con sandbox de red y sin él. **No es un fallo de la
implementación** —los ficheros mueren al importar, no al afirmar— pero **CA-6.4
queda sin verificar** (F-SPEC-018-V5).

## Matriz de criterios de aceptación
<!-- Escritores: sdd-implementador rellena Implementado y Test; sdd-verificador rellena Verif. y Estado. Nunca al revés. -->
<!-- Estados por CA: ✅ cerrado · ⚠️ parcial/con salvedad · 🚧 en curso · ❌ sin empezar · n-a -->
<!-- Un CA está ✅ solo cuando Implementado + Test + Verif. aplicables están en verde. Una salvedad se marca ⚠️, nunca ✅. -->
| CA | Implementado (fichero) | Test (fichero/caso) | Verif. | Estado |
|---|---|---|---|---|
| CA-1 | `src/api/` (5 ficheros) · `src/board/` (6) · `src/app/api/board/route.ts` · `src/app/(gl)/marcador/route.ts` · `src/app/(es)/es/marcador/route.ts` · `tests/polite/support/capability.ts` (`ENTRY_POINTS`) | `tests/board/frontier.test.ts` 1–9 (con controles positivos 3, 7, 9) · `tests/polite/containment.test.ts` 13 (heredado) | **Mutación M1**: import de `@/db/client` en `src/board/order.ts` ⇒ rojo el caso 2. **Mutación M3**: import de `@/polite/http` en `src/api/handler.ts` ⇒ rojo el caso 6. El control positivo del grafo (caso 7) es REAL: conduce `src/ingest/adapter.ts`, que sí alcanza la puerta. Navegador: cero peticiones externas (`performance.getEntriesByType('resource')` filtrado por origen = `[]`). | ✅ |
| CA-2 | `src/api/handler.ts` · `src/api/freshness.ts` · `src/board/handler.ts` · `src/board/view/markup.ts` · `src/site/project-page.tsx` · `src/site/crawler-page.tsx` | `tests/board/frontier.test.ts` 10–13 · `tests/board/document.test.ts` 1–8 (control positivo 3) | **Mutación M2**: import de `@/admin/session` en `src/board/handler.ts` ⇒ rojo el caso 10. **M4**: `Access-Control-Allow-Origin` en `boardHeaders` ⇒ rojo el caso 2. **M6**: `nofollow` en `BOARD_ROBOTS` ⇒ rojo el caso 1. **Diff**: `src/site/robots-txt.ts` intacto (`git diff` vacío). **Servidor real** (`next dev`, `curl -D -`): `x-robots-tag: noindex, noarchive`, sin `nofollow`. `@vercel/analytics` ausente de `package.json` y de todo `src/`. | ✅ |
| CA-3 | `src/api/handler.ts` (`boardSnapshotOf`, `asksForSomethingArbitrary`) · `src/api/contract.ts` (`PUBLISHED_COMPETITIONS`) · `src/api/snapshot.ts` · `docs/procedimientos/carga-del-calendario.md` | `tests/board/snapshot.test.ts` 1–10 (control positivo 7) · `tests/board/runbook.test.ts` 1–3 | **Mutación M5**: tercera competición en `PUBLISHED_COMPETITIONS` ⇒ rojos los casos 4, 5, 6 y 7. Los ids son los del registro de fuentes (`futgal-preferente-g1`, `rfef-tercera-g1`) y no los nombres informales que el cuerpo del CA transcribe; el caso 5 ata las dos listas. | ✅ |
| CA-4 | `src/api/snapshot.ts` (pura, sin reloj) · `src/api/ports.ts` (sólo lectura) · `src/decide/board-entry.ts` | `tests/board/frontier.test.ts` 14–21 (controles positivos 16, 21) · `tests/board/snapshot.test.ts` 31 | `DECISION_WRITERS` sigue en **dos** entradas y `tests/decide/` **no aparece en el diff** (`git diff --stat a63e23e..HEAD -- tests/decide/` vacío): el verde del caso 18 no se compró tocando la lista. `src/api/snapshot.ts` leído entero: función pura, sin `Date` ni `Clock`. | ✅ |
| CA-5 | `src/api/contract.ts` (`PUBLISHED_FIELDS`) · `src/api/snapshot.ts` | `tests/board/snapshot.test.ts` 11–16 (control positivo 13) | **Mutación M10**: `rule` añadido de verdad a la proyección y al esquema ⇒ rojos los casos 12, 14 y 15. El mecanismo enumera las claves de `DecisionSchema`/`ObservationSchema`, no una lista negra. | ✅ |
| CA-6 | `src/decide/board-entry.ts` · `src/api/ports.ts` (`BoardReader`) | `tests/board/frontier.test.ts` 22–23 · `tests/db/board-batch.test.ts` 1–5 (`npm run test:db`) | 6.1–6.3 verificados por lectura y por el caso 22 (3 vs 18 partidos, misma cuenta, una sola llamada con los 18). **6.4 EJERCIDO EN LA 2ª VUELTA**: corrí yo `npm run test:db` y pasa — **27 ficheros, 345 casos, 243 s**. El DNS de Neon que fallaba el 04 por la mañana resuelve ahora; **F-SPEC-018-V5 cerrado**. **6.5 sigue incumplido por imposibilidad**, con su enmienda de ADR-015: **⚠ aceptada**, con el precedente de SPEC-008 CA-2. | ⚠️ |
| CA-7 | `src/api/freshness.ts` · `src/api/handler.ts` (`etagOf`, `matchesEtag`) · `src/api/snapshot.ts` (`version`) | `tests/board/snapshot.test.ts` 17–24 | Servidor real: `cache-control: public, s-maxage=10, stale-while-revalidate=10`, sin `private` ni `no-store`. Navegador: un solo `fetch` a `/api/board` en 33 s ⇒ `REFRESH_SECONDS = 30` es el que rige de verdad. | ✅ |
| CA-8 | `src/board/handler.ts` (`minutesSince`, `lastDataOf`) · `src/board/view/markup.ts` (`transportNotice`) · `src/board/view/styles.ts` (`.transport`) · `src/i18n/board-bundle.ts` | `tests/board/document.test.ts` 9–16 (control positivo 13, 15) · `tests/board/snapshot.test.ts` 32 | **Navegador**: con el refresco caído, `#board-transport` computa `color: rgb(167,165,160)` (`--fg-muted`), `border: rgb(61,54,44)` (`--line-strong`), `opacity: 1` y `class="transport"` — ningún token de estado ni de cualificador. La fila lleva *Hai 22 min*, nunca un instante con segundos. | ✅ |
| CA-9 | `src/board/handler.ts` · `src/board/view/refresh.ts` | `tests/board/document.test.ts` 17–21 | **Navegador, con cuatro filas reales**: tras un poll con éxito el `innerHTML` de las cuatro filas es **byte a byte idéntico**; tras `Network.emulateNetworkConditions{offline:true}` sigue siendo idéntico, `opacity: 1`, `display: table-row` y el color del marcador sin cambiar. Lo único que cambia es el aviso de página. | ✅ |
| CA-10 | `src/board/handler.ts` (`boardRowMarkup`) · `src/api/snapshot.ts` | `tests/board/document.test.ts` 22–29 (control positivo 27) | **Mutación M7**: sustituir el cualificador de la fila por `noScoreYet` ⇒ rojos los casos 26, 27, 30, 33 y 34. CA-10.6 muerde de verdad. Navegador: `Rematado` + *Pendente de confirmar* + *Hai 180 min* en la misma fila; `CD Lugo B` sin truncar (`scrollWidth === clientWidth`, `text-overflow: clip`). | ✅ |
| CA-11 | `src/api/snapshot.ts` (`compareBoardRows`) · `src/board/order.ts` | `tests/board/snapshot.test.ts` 25–30 (control positivo 28) · `tests/board/frontier.test.ts` 24 | Orden verificado sobre el HTML servido: el aplazado conserva su posición por hora original. | ✅ |
| CA-12 | `src/board/handler.ts` · `src/board/view/styles.ts` · `src/i18n/qualifiers.ts` | `tests/board/document.test.ts` 30–34 (control positivo 32) · `tests/board/style.test.ts` 17–18 | **Navegador, contraste computado**: `.q-provisional` y `.q-confirmado` los dos `rgb(245,241,234)` = `--fg` — el énfasis del cualificador queda invertido como ADR-026 §2 obliga; `pendente_de_confirmar` ámbar, `sen_sinal` alerta, los cuatro con su NODO DE TEXTO completo al lado. Ninguna abreviatura, ningún glifo. | ✅ |
| CA-13 | `src/i18n/board-bundle.ts` · `src/i18n/board.ts` · `src/i18n/qualifiers-bundle.ts` · `src/i18n/qualifiers.ts` · `src/i18n/gl.ts` · `src/i18n/es.ts` · `src/i18n/titles-bundle.ts` · `src/board/sources.ts` | `tests/board/document.test.ts` 35–43 (control positivo 41) · `tests/types/spec018-board.test-d.ts` 1–5 · `tests/site/titles-i18n.test.ts` 4 · `tests/site/document-titles.test.ts` 1–5 · `tests/site/robots.test.ts` 4 | `src/i18n/admin.ts` cambia de resolutor **sin tocar un literal** (diff leído línea a línea). Navegador: `/marcador` `lang="gl"` con *En xogo* / *Provisional*; `/es/marcador` `lang="es"` con *En juego* / *Provisional*. CA-13.8 se juzga con la enmienda (derivación + singular/plural). | ✅ |
| CA-14 | `src/i18n/gl.ts` · `src/i18n/es.ts` (espacio `board`) | `tests/board/voice.test.ts` 1–10 (controles positivos 2, 7, 10) | 52 formas de 1.ª del singular, comparadas por palabra completa sobre texto desacentuado; siete ambiguas declaradas fuera con su motivo. `tests/site/i18n.test.ts` **no se ha tocado** (diff vacío): la lista negra de D-1 se ensancha en fichero nuevo, como CA-14.4 pide. | ✅ |
| CA-15 | `src/board/view/styles.ts` · `src/design/tokens.ts` (`MEASURE`, `HAIRLINE_PX`) · `src/admin/view/styles.ts` | `tests/board/style.test.ts` 1–20 (controles positivos 3, 19, 20) · `tests/board/cascade.ts` (instrumento) · `tests/design/scale.test.ts` 1–6 (control positivo 5) | **Mutación M11**: `#8a8a8a` en `.soft` ⇒ rojo el caso 1. `docs/diseno/` intacto, `DECLARED_DIVERGENCES` sigue en 3, `LOADED_FACES` en 5: **EPIC-004 no se ha descongelado**. **CA-15.7 CERRADO en la 2ª vuelta (V1)**: **M12** —devolver el atajo `font:` a `role()`, que es exactamente la hoja que yo encontré rota— ⇒ **rojo el caso 14**; **M13** —usar `role('display')`— ⇒ **rojo el caso 8**, así que se adaptó y no se debilitó. **Y en el navegador**: `font-variant-numeric` computa `tabular-nums` en las tres celdas (antes `normal`), y con el estilo real de la celda forzado a la cara **proporcional** `111111` y `000000` miden **75,53 px los dos**, mientras un `<p>` en esa misma cara mide 42,66 y 58,59. La declaración es ahora el mecanismo. | ✅ |
| CA-16 | — (no lo implementa el implementador: es del verificador, con capturas en `_qa/SPEC-018/`) | — | **EJECUTADO POR EL VERIFICADOR EN UN NAVEGADOR DE VERDAD**, no por lectura de la hoja. Chromium 149 headless por CDP crudo contra `next dev`, 360 × 640, dsf 2, `mobile: true`. Diez capturas y dos informes JSON en `_qa/SPEC-018/`. Resultados abajo. | ✅ |
| CA-17 | `tests/site/url-permanence.test.ts` · censos de `PAGES`, `ROUTES` y rutas de `robots.test.ts` | `tests/site/url-permanence.test.ts` 1 | 17.1 ✅ · 17.3 ✅ (caso único, con literales, en dos grupos, y `/` sigue redirigiendo) · 17.4 ✅ (ningún layout tocado). **17.2 CERRADO en la 2ª vuelta (V3)**: la cláusula del commit propio **no se cumplió y no se finge que sí**; `sdd-arquitecto` la declara mala con tres argumentos, la sustituye por una propiedad comprobable —el inventario fichero a fichero en el ledger, cotejado contra `git diff --name-only`—, **deja F-SPEC-016-8 abierto** y declara que **no es retroactiva a SPEC-018**. Las otras dos cláusulas —lo mínimo, ninguna aserción debilitada— sí se cumplen, y las comprobé en el diff. | ✅ |
| CA-18 | `src/i18n/gl.ts` · `src/i18n/es.ts` · `src/i18n/site-bundle.ts` · `src/i18n/crawler-bundle.ts` · **`src/site/hosting.ts`** (nuevo, V4) · `src/site/project-page.tsx` · `src/site/crawler-page.tsx` · ledgers de SPEC-004, SPEC-005 y SPEC-007 | `tests/site/crawler-page.test.ts` 12, 12 bis/ter · **12 quater/quinquies/sexies/septies/octies (V4, control positivo 12 septies)** · `tests/site/identity.test.ts` 1–4 · `tests/board/no-contradiction.test.ts` 1–6 (control positivo 2, 3) · `tests/board/document.test.ts` 8 · **`tests/board/runbook.test.ts` 7, 8, 10** | **Mutación M8**: `board.heading` con un nombre de persona ⇒ rojos los casos 1 y 3 de `identity.test.ts`: la barrera de SPEC-007 **cubre de verdad** el espacio y las dos rutas nuevas, y sus dos números crecieron (4 espacios, 6 rutas). **Mutación M9**: reponer «Non republicamos os datos de ninguén» ⇒ rojos `no-contradiction` 1 y `crawler-page` 12. **Diff**: ningún cuerpo ni frontmatter de spec cerrada tocado; sólo ledgers. **V2 y V4 CERRADOS en la 2ª vuelta.** **V2**: la enmienda de SPEC-006 pasa a cubrir **tres** guardianes, admite con tabla antes/después que en el caso 4 **sí se relajó el predicado**, corrige por escrito la frase que lo negaba, y declara **tres** sitios con menos red —uno de ellos, que el número esperado dejó de ser literal, no se lo había pedido nadie—. **V4**: seis mutaciones mías (**MP1–MP6**) ponen rojo un caso nombrado cada una, y en las seis **el caso viejo habría pasado en verde** —reconstruido y ejecutado por mí—. | ✅ |
| CA-19 | `docs/procedimientos/calendario-de-compromisos.md` | `tests/board/runbook.test.ts` 4–9 | Las cuatro filas están escritas, el disparador tiene **ocho** puntos con la aclaración de CA-2.9, el punto de tráfico está sustituido y el párrafo de cierre dice «Ocho de estas nueve fechas». **Escrito no es cumplido**, y CA-19.6 lo declara: son compromisos humanos y quedan para la persona. | ✅ |

## Veredicto del verificador
<!-- GREEN/RED + fecha + resumen. Lo escribe SOLO sdd-verificador. -->

### **GREEN** — 2026-09-04 (segunda vuelta), `sdd-verificador`

**Los cinco findings del RED están cerrados, y ninguno lo doy por cerrado porque
me lo dijeran: los cinco los volví a atacar.** Dieciocho criterios ✅ y **uno
⚠️ justificada y aceptada** (CA-6, por CA-6.5). **La spec pasa a `hecho`.**

**Gates, corridos por mí sobre el árbol limpio.** `npm run gates` **VERDE**: 147
ficheros, **1717 casos** (eran 1710), 0 errores de tipo, y el build lista **trece
rutas**. **`npm run test:db` VERDE: 27 ficheros, 345 casos, 243 s** — el host de
Neon que el 04 por la mañana no resolvía resuelve ahora, así que **CA-6.4 está
ejercido de verdad** y F-SPEC-018-V5 se cierra sin excusa.

#### Los cinco findings, uno a uno, y con qué los ataqué

| Finding | Cómo lo comprobé | Resultado |
|---|---|---|
| **V1** dígitos tabulares | **M12**: devolver el atajo `font:` a `role()` — la hoja exacta que yo encontré rota. **M13**: usar `role('display')`. Y el navegador otra vez. | **CERRADO.** M12 ⇒ rojo el caso 14; M13 ⇒ rojo el caso 8. En Chromium, `font-variant-numeric` computa **`tabular-nums`** en las tres celdas y, forzado a la cara **proporcional**, `111111` = `000000` = **75,53 px**. |
| **V2** la enmienda incompleta | Lectura del §6 nuevo del ledger de SPEC-006 contra `git diff`. | **CERRADO.** Tres guardianes, tabla antes/después del predicado relajado, y la frase falsa corregida por escrito. |
| **V3** la disciplina de commit | Lectura de la reformulación y del estado de F-SPEC-016-8. | **CERRADO como finding.** No se finge cumplida: se declara mala, se sustituye por algo comprobable y **el finding de EPIC-MEJORA sigue abierto**. |
| **V4** la línea de privacidad | **MP1–MP6**, seis mutaciones mías sobre `gl.ts` y `es.ts`. | **CERRADO.** Las seis ponen rojo un caso nombrado, y **en las seis el caso viejo habría pasado en verde**. |
| **V5** CA-6.4 sin ejercer | `npm run test:db`. | **CERRADO.** 27/345 en verde. |

**La comprobación que más me importaba de esta vuelta era la de V4**, porque era
una afirmación sobre un test que ya no existe. La ejercí reconstruyendo las seis
aserciones del caso viejo —`cookies`, `/analitica/`, `/terceiros|terceros/`,
`/interese lexitimo|interes legitimo/`, el buzón, y sin nombre de persona— y
evaluándolas sobre las nueve claves concatenadas e interpoladas, mutación a
mutación. **Las seis veces salió verde.** Un caso que no se puede poner rojo con
seis defectos distintos del texto que dice vigilar no vigila nada, y el nuevo se
pone rojo con los seis. La causa raíz que el implementador nombra —seis
afirmaciones dentro de una sola cadena hacen invisible que falten dos— es
correcta, y es la lección de este hallazgo.

**Y lo que ha aparecido de nuevo, juzgado:**

- **F-SPEC-018-N1 — mis propias capturas rompían el gate. Bien resuelto, y lo
  medí yo.** Sobre los **23** PNG/WOFF2 versionados: `ca16-6-filas-360x640-gl.png`
  da **una** ofensa, en el **offset 3033**, con una tirada de **once** dígitos; y
  `ca16-5-360x640-es.png` lleva una tirada de **nueve** que sólo escapa porque el
  byte siguiente no es un dígito. Las dos afirmaciones del arreglo son ciertas
  exactamente como están escritas. **La exclusión está acotada** —`*.png` y
  `*.woff2`, nada más— y **no ciega el mecanismo**: **M14** (un id en un `.ts` de
  `src/`) y **M15** (el mismo id en `corresponsais/2026-27.json`) ponen rojos
  **cuatro** casos cada una, incluidos los dos controles positivos y el caso 32,
  «ninguna exclusión es decorativa». La quinta enmienda de ADR-015 lleva sus cinco
  puntos y declara la red que pierde en tres partes, incluida la que más vale:
  **un contenedor comprimido nuevo —`.zip`, `.pdf`, `.gz`— no está excluido y
  entraría sin que nadie lo decidiera.**
- **El toque a `tests/board/runbook.test.ts`: correcto, y no es lo que CA-17.2
  vigila.** Es la suite **de esta misma spec**, viva. Y no se debilitó nada: el
  caso 7 pasa de una aserción a **dos** —la cadena nueva **y** una negativa que
  prohíbe la vieja—, el caso 8 conserva sus dos con el censo actualizado, y el
  caso 10 es puro añadido. El motivo está escrito y es bueno: **publicar un plazo
  de 24 h vuelve falsa una fila que mandaba mirar el tráfico al día siguiente**,
  cuando ya no queda nada que mirar.
- **El paso por `en-progreso` y la vuelta a `en-revision` (`f2fba6f`) queda
  constatado.** Es el gate del harness, que no deja tocar código en `en-revision`,
  y tiene precedente en `344260e`. No es una irregularidad; se anota para que
  quien lea el `historial:` no lo lea como una vuelta atrás del veredicto.
- **N3, N4 y N5 están inventariados con destino y disparador**, y no los cuento
  contra la spec. Van al informe para el humano: **N3 apunta a `EPIC-FIX`, que no
  existe todavía como directorio** —crearla es de `sdd-producto`— y su disparador
  es «inmediato, y en todo caso antes del 2026-09-08».

#### Lo que dejo escrito y NO bloquea

**El inventario fichero a fichero que la cláusula nueva de V3 va a exigir no
existe todavía para SPEC-018, y es coherente que no exista**: la propia
reformulación declara que **no es retroactiva** a esta spec. Lo anoto porque el
ledger de SPEC-018 no permite hoy reconstruir qué tocó de specs cerradas —
`tests/bot/support/telegram-ids.ts` no aparece en él ni una vez, y está enmendado
en el ledger de SPEC-015, que es donde ADR-015 lo pide—. **No es un defecto de
seguridad**: comprobé el diff de `tests/bot/` entero y no hay ninguna aserción
borrada ni debilitada. Es de reconstruibilidad, y **escribir esa lista costaría un
párrafo y convertiría la cláusula nueva en un precedente con ejemplo** en vez de
en una regla sin estrenar. **Queda a criterio de `sdd-arquitecto`; no lo exijo,
porque exigirlo sería aplicar retroactivamente una regla que ella misma declaró no
retroactiva.**

**Una imprecisión menor en un motivo, sin consecuencia hoy.** La entrada `*.png`
de `ID_SCAN_EXCLUSIONS` dice que «cualquier texto incrustado viaja comprimido e
ilegible». **Para un chunk `tEXt` de PNG eso no es cierto** —`tEXt` es Latin-1 sin
comprimir; `zTXt` e `iTXt` sí pueden ir comprimidos—. Comprobado sobre los 18 PNG
versionados: **ninguno tiene un chunk de texto de ningún tipo**, así que no cambia
ninguna conclusión ni ninguna medida. Se anota para que nadie apoye en esa frase
una exclusión futura más ancha.

#### Lo que sostiene este GREEN, y lo que no sostiene

Sigue en pie todo lo que verifiqué en la primera vuelta y volví a mirar aquí:
`robots.txt` intacto y sin `Disallow`; `noindex, noarchive` sin `nofollow`; cero
analítica; ninguna llamada a la acción; los tres enlaces salientes; `/proxecto` y
`/robot` enlazando la pantalla; la ausencia de sesión como frontera; el grafo que
no alcanza `src/polite/http.ts`; `DECISION_WRITERS` en dos entradas con
`tests/decide/` fuera del diff; EPIC-004 sin descongelar. Y **CA-16 vuelto a
correr contra la hoja nueva**: nada de lo que ya estaba verde se movió.

**Lo que este veredicto NO dice, y conviene que se lea:** ningún test de esta spec
prueba que lo publicado sea **cierto** —que el plazo de 24 h sea el real, que el
plan de alojamiento no cambie, que no se añada un desvío de registros—. Eso está
declarado dentro del propio criterio y vive en el calendario de compromisos. Y
**CA-19 entero sigue siendo compromiso humano**: escrito no es cumplido.

---

### **RED** — 2026-09-04 (primera vuelta), `sdd-verificador`

**Quince de los diecinueve criterios cierran ✅ y cuatro quedan ⚠️** (CA-6, CA-15,
CA-17, CA-18). **La spec no pasa a `hecho`.** No es un veredicto sobre la calidad
de la implementación —que es alta, y todas las barreras que ataqué mordieron— sino
sobre **dos piezas abiertas dentro de CA-18**, que es el criterio que la propia
spec llama «el que separa publicar de publicar y mentir», más un defecto de
interfaz que sólo se ve en un navegador y un residuo de entorno.

**Lo que sí está probado, y no por lectura.** Ejercí **once mutaciones** sobre el
árbol real, comprobé el caso que se pone rojo y **revertí cada una**: `git diff
src/ tests/` queda vacío al final de la verificación. Las once mordieron. Y **CA-16
se ejecutó de verdad**: no había forma de hacerlo por MCP —el único navegador
conectado es `Browser 1`, `osPlatform: Windows`, `isLocal: false`, así que no
alcanza el `localhost` de esta máquina, exactamente lo que F-SPEC-017-17
describe—, así que lancé el Chromium 149 de la caché de Playwright en modo
headless y lo conduje por CDP crudo contra `next dev`. **Diez capturas y dos
informes JSON en `_qa/SPEC-018/`.**

**Gates.** `npm run gates` **VERDE**: 147 ficheros, 1710 casos, 0 errores de tipo,
17,73 s, corrido por mí el 2026-09-04. `npm run test:db` **NO EJECUTABLE en este
entorno**: `getaddrinfo ENOTFOUND ep-soft-river-b1ocpgd1-pooler.c-5.eu-central-1.aws.neon.tech`,
27 ficheros fallan al importar y los 345 casos quedan `skipped`, con sandbox y sin
él. **No lo doy por verde por lo que dice el ledger**: queda declarado como
residuo (F-SPEC-018-V5) y **CA-6.4 sigue sin verificar por nadie**.

**Lo que devuelve la spec, en orden de importancia:**

1. **F-SPEC-018-V4 — la línea de privacidad se publica con dos no-respuestas.**
   Es lo único de esta lista que **llega al público el 08**.
2. **F-SPEC-018-V2 — la cuarta enmienda de ADR-015 enumera dos aserciones y hay
   tres.** La que falta está debilitada de verdad, y la enmienda afirma por
   escrito lo contrario.
3. **F-SPEC-018-V1 — los dígitos tabulares de ADR-013 §3 computan `normal`.** El
   resultado visible es correcto por el lado de la familia mono; el mecanismo
   declarado está muerto y el único test que lo vigila mira una cadena.
4. **F-SPEC-018-V3 — la disciplina de commit de CA-17.2 no se siguió**, y por eso
   existe `9628e3e`, un commit en el que la pantalla ya está y `/robot` todavía
   jura que no hay marcador público.

**Lo que NO encontré, y lo busqué a propósito porque era donde más daño se podía
hacer:** `robots.txt` está intacto y sin un solo `Disallow`; `noindex, noarchive`
viaja por cabecera y por `<meta>` en las tres rutas y **sin `nofollow`** (mutación
M6); no hay analítica de ninguna clase y `@vercel/analytics` no está ni en
`package.json`; no hay formulario, ni `<input>`, ni `<button>`, ni `<iframe>`, ni
una sola de las diez formas de llamada a la acción; los únicos enlaces salientes
son `/robot`, `/proxecto` y el buzón; `/proxecto` y `/robot` **sí** enlazan la
pantalla en las dos lenguas; la ausencia de sesión es una frontera con control
positivo que muerde (M2); el grafo de las tres rutas **no** alcanza
`src/polite/http.ts` y su control positivo es real, no sintético (M3, y el caso 7
conduce `src/ingest/adapter.ts`, que sí la alcanza); `DECISION_WRITERS` sigue en
dos entradas **y `tests/decide/` no aparece en el diff**, así que ese verde no se
compró tocando la lista; ningún cuerpo ni frontmatter de spec cerrada está
editado; y la barrera de identidad de SPEC-007 **no se quedó corta en silencio** —
la mutación M8 lo demuestra: un nombre de persona en el espacio `board` pone rojos
dos casos. **EPIC-004 no se ha descongelado de hecho**: `docs/diseno/` intacto,
`DECLARED_DIVERGENCES` en tres, `LOADED_FACES` en cinco.

**Sobre las cuatro enmiendas del arquitecto.** Las leí antes de puntuar y juzgo
contra ellas. **CA-2.6 (iii)** ✅ con la letra de ADR-027 §3.a. **CA-13.8** ✅ en su
mitad de derivación, con el control de singular/plural. **CA-18.4** se lee con
cuatro entradas, y **ahí está V2**. **CA-6.5**: acepto que **⚠ cierra ese
subpunto** —el precedente de SPEC-008 CA-2 vale, el mecanismo es por importación y
`board-entry.ts` está dentro de `DECISION_WRITERS`, así que no hay capacidad nueva
que se cuele— **pero CA-6 no cierra ✅ por CA-6.4**, que es otra cosa: no está
incumplido, está **sin ejecutar**.

## Evidencia visual
<!-- Tabla CA → captura en _qa/SPEC-018/. Informe HTML opcional: _qa/SPEC-018/informe.html -->

**Cómo se obtuvo, porque importa para leerla.** Chrome por MCP **no sirve aquí**:
`list_connected_browsers` devuelve un solo navegador, en Windows y `isLocal:
false`. Así que: Chromium 149 headless (caché de Playwright) con
`--remote-debugging-port`, conducido por CDP crudo desde Node; `next dev` en
`:3000`; y, para las filas —`MEASUREMENT_WINDOWS` está vacía, así que el servidor
real sirve la pantalla apagada—, el **documento del propio manejador**
(`boardDocument`, empaquetado con esbuild y una escena de cuatro partidos que
cubre `live`, `finished`-por-timeout, `postponed` y `suspended`) servido en
`:3100` con `/api/board` reenviado al servidor real. Eso es el cotejo byte a byte
contra lo que el manejador sirve que F-SPEC-017-17 dejó como procedimiento.

| CA | Captura / dato | Qué demuestra |
|---|---|---|
| CA-16.1 · CA-15.9 | `ca16-1-360x640-gl.png`, `ca16-6-filas-360x640-gl.png` | A 360 × 640: `documentElement.scrollWidth === clientWidth === 360` y `body.scrollWidth === 360`. **Cero desplazamiento horizontal del cuerpo.** Con cuatro filas, los dos `.scroller` miden `scrollWidth` 1028 y 771 sobre `clientWidth` 344: **lo que desplaza es el contenedor, nunca el cuerpo.** |
| CA-16.1 · CA-15.5 · CA-15.6 | `ca16-2-foco-teclado.png`, `ca16-7-filas-foco.png` | Recorrido completo con `Tab`: **seis paradas**, todas con `:focus-visible === true` y `outline: 2px solid rgb(245,241,234)` con `outline-offset: 2px`. Alturas 139, 100, 46, 44, 44, 44 px: **ninguna baja de 44**. Las dos primeras son los `.scroller`, focalizables por ser desplazables, que es lo correcto. Ningún `tabindex` positivo, ninguna trampa de foco. |
| CA-16.1 · CA-7.4 | `ca16-3-refresco-ok.png`, `ca16-8-filas-tras-refresco.png` | **El refresco funciona**: un solo `fetch` a `/api/board` en 33 s ⇒ el intervalo real es 30 s. El aviso se queda en *Actualizado agora mesmo* y el `innerHTML` de las cuatro filas es **byte a byte idéntico** al de la primera pintura. |
| CA-16.1 · CA-9.4 · CA-8.3 | `ca16-4-refresco-fallido.png`, `ca16-9-filas-fallo-refresco.png` | Con la red cortada (`Network.emulateNetworkConditions{offline:true}`) el aviso pasa a *«Non se puido actualizar. O que ves é de hai 0 min. Carga a páxina de novo.»* y **las filas no cambian ni un byte**: `opacity: 1`, `display: table-row`, color del marcador intacto. El aviso computa `color: rgb(167,165,160)` y `border: rgb(61,54,44)` — **ningún token de estado ni de cualificador**, y no dice de quién es la culpa. |
| CA-12.2 · CA-12.5 · ADR-026 §2 | `ca16-6-filas-360x640-gl.png` | Estilo **computado** de las cuatro filas: `q-provisional` y `q-confirmado` los dos `rgb(245,241,234)` = `--fg`, sin marca adicional; `q-pendente-de-confirmar` `rgb(240,177,53)`; `q-sen-sinal` `rgb(255,101,90)`; `s-live` `rgb(255,107,0)`. **Cada uno con su nodo de texto completo al lado** — *Provisional*, *Confirmado*, *Pendente de confirmar*, *Sen sinal*, *En xogo*, *Rematado*, *Aprazado*, *Suspendido*. Ningún estado se distingue sólo por color. |
| CA-10.2 · CA-10.6 | `ca16-6-filas-360x640-gl.png` | `RC Celta B`, `SD Compostela`, `CD Lugo B`, `Racing Villalbés`: `scrollWidth === clientWidth` en todas, `text-overflow: clip`. **Ningún nombre canónico truncado.** Y la fila del `finished` por timeout lleva a la vez `0-0`, *Rematado*, *Pendente de confirmar* y *Hai 180 min*. |
| CA-13.3 | `ca16-5-360x640-es.png`, `ca16-10-filas-360x640-es.png` | `/es/marcador` sirve `lang="es"`, *En juego* / *Provisional*, `<title>marcador.gal</title>`, sin desplazamiento horizontal. |
| CA-1.5 | `ca16-informe.json` | `performance.getEntriesByType('resource')` filtrado por origen: **lista vacía**. Ni una petición a un tercero desde el navegador. `document.styleSheets` = `[null]`: la hoja es inline y **`globals.css` no se carga** (ADR-025 §4.1, por construcción, porque es un `route.ts`). |
| ADR-026 §3.6 | `ca16-1-360x640-gl.png` | Fondo computado `rgb(17,17,16)`, texto `rgb(245,241,234)`: la pantalla nace oscura sin tocar el sitio público. |
| **CA-15.7 — FALLABA (1ª vuelta)** | `ca16-filas-informe.json` | Sobre las celdas que **sí llevan cifras**: `font-variant-numeric: normal` y `font-feature-settings: normal`. Medido: `111111` y `000000` miden **72,25 px los dos**, así que los dígitos **sí salían tabulares** — pero por la familia mono, no por la declaración. Fue **F-SPEC-018-V1**. |
| **CA-15.7 — CERRADO (2ª vuelta)** | `ca16-11-v2-filas-360x640-gl.png`, `ca16-12-v2-foco.png`, `ca16-v2-informe.json` | **Reejecutado contra la hoja nueva**, porque `role()` cambió de forma de emitir tipografía. Ahora las tres celdas computan `font-variant-numeric: tabular-nums` y `font-feature-settings: "tnum"`. **Y la prueba de fuego**: tomando el estilo **computado real** de la celda del marcador y forzándolo a la cara **proporcional** `--sans`, `111111` y `000000` miden **75,53 px los dos**; un `<p>` en esa misma cara mide **42,66** y **58,59**. La igualdad ya no la puede firmar `--mono`: la firma la declaración. Y nada más se movió — 360/360 sin desplazamiento del cuerpo, cuatro filas, seis paradas de foco con anillo de 2 px, ningún nombre truncado, `q-provisional` y `q-confirmado` los dos en `--fg`. |
| — | `servido-gl.html`, `ca16-informe.json`, `ca16-filas-informe.json` | El documento servido y los dos volcados de estilo computado, para que esto sea reproducible sin volver a montar el andamio. |

## Salvedades / follow-ups

**F-SPEC-018-1 — `titles.scoreboard = 'marcador.gal'` rompe DOS guardianes de
SPEC-006, y hacen falta una decisión y una enmienda que CA-18.4 no ordenó.**
El gate decidió el título **`marcador.gal` a secas**. Ese valor **es el nombre
del dominio**, y eso lo hace estructuralmente incompatible con dos aserciones
de SPEC-006, que está cerrada y GREEN:
1. `tests/site/titles-i18n.test.ts` caso 6 — «ningún título es un valor de los
   que el sitio sirve en su cuerpo». `site.heading` **también** es
   `marcador.gal`: es el `<h1>` de `/proxecto` desde SPEC-004.
2. `tests/site/title-source.test.ts` caso 3 — «cada título vive en el bundle de
   su lengua y en ningún otro punto de `src/`». El dominio aparece por
   construcción en once ficheros (`polite/user-agent.ts`, `site/contact.ts`,
   `site/routes.ts`, `site/robots-txt.ts`…).
**No hay forma de implementar la decisión del gate sin tocar los dos.** La
alternativa —`O marcador — marcador.gal`, que el dictamen de `sdd-lingua` §1.1
proponía como primera opción— pasaría los dos sin tocar nada, y el gate la
descartó expresamente. Lo hecho, declarándolo: en cada caso se añade **una
colisión declarada por identidad de clave Y de valor**, con su motivo escrito y
con una aserción nueva que la ata (`scoreboard` vuelve a ser rojo en cuanto deje
de valer `marcador.gal`). **Ninguna otra clave se relaja.** Pero eso **es tocar
una aserción de una spec cerrada sin la enmienda de ADR-015 que la ampare**, y
CA-18.4 ordena tres enmiendas —SPEC-004, SPEC-005, SPEC-007— y no una cuarta
sobre SPEC-006. **Destino: `sdd-arquitecto`, que es quien puede firmar esa
cuarta enmienda o decidir el título alternativo. Disparador: la verificación de
esta spec.**

**F-SPEC-018-2 — `docs/fundacion/dominio.md` NO se ha editado: el harness me lo
impide, y CA-17.1 queda sin cumplir.**
Las tres entradas de CA-17.1 están **firmadas por Alberto Fojo en el gate del
2026-09-04** y el encargo me pedía escribirlas. `docs/fundacion/dominio.md` es
un **documento de verdad** cuyos dueños son `sdd-arquitecto` y `sdd-producto`, y
el harness rechaza la escritura con ese motivo — que es también lo que dice mi
contrato de rol («PROHIBIDO … editar documentos de verdad»). **El texto exacto
de las tres entradas va en el informe final**, listo para pegar. El resto de la
spec avanzó sin ellas, como CA-17.1 permite expresamente. **Destino:
`sdd-arquitecto`. Disparador: inmediato — el glosario tiene que estar escrito
antes de que la pantalla se despliegue, porque `Casa`/`Fóra` ya son texto
visible.**

**F-SPEC-018-3 — CA-6.5 no se puede cumplir como está escrito: la puerta de
lectura en lote NO cruza ningún nombre vigilado.**
CA-6.5 exige que «la aserción derivada del caso que enumera quién cruza los
nombres vigilados crezca en una entrada» — el caso 10 de
`tests/decide/rn08-frontier.test.ts`, que hoy lista cinco ficheros. Ese caso
mide quién cruza `PostgresDecisionStore`, `DecisionVersionConflictError` o
`DecisionStore`. **`src/decide/board-entry.ts` no cruza ninguno**: la lectura en
lote necesita SQL propio —`distinct on (match_id) … order by version desc`— que
`PostgresDecisionStore` no expone, y escribirla ahí habría exigido editar
`src/db/decisions.ts`, fichero de una spec cerrada cuyo puerto un test de tipos
sujeta. Se escribió el SQL dentro de `board-entry.ts`, que es legítimo porque
`src/decide/` es la primera entrada de `DECISION_WRITERS`. **Consecuencia: el
censo del caso 10 sigue en cinco entradas y CA-6.5 queda sin cumplir por
imposibilidad, no por omisión.** Forzar un import sin uso para que el censo
creciera habría sido peor. **Destino: `sdd-verificador` / `sdd-arquitecto`;
disparador: la verificación de esta spec.**

**F-SPEC-018-4 — la barrera de 1.ª persona deja fuera una forma más de las
cuatro que CA-14.2 enumera: `min`.**
CA-14.2 declara fuera de la lista cerrada las formas ambiguas `son`, `vin`/`vi`,
`mi` y `sei`/`sé`. Hay una quinta que el dictamen no previó: **`min`**, pronombre
galego de 1.ª persona tras preposición, **que es también la abreviatura de
*minuto*** que el propio `sdd-lingua` §3.2 propone en cinco literales de esta
pantalla («Actualizado hai {n} min»). Incluirla pondría rojo texto correcto
escrito por el mismo dictamen. Queda declarada en el propio test con su motivo,
que es el criterio con el que él deja fuera las otras cuatro. **Destino:
EPIC-MEJORA; disparador: el día que la barrera pase de lista de formas a
análisis morfológico.**

**F-SPEC-018-5 — CA-2.6 (iii) no se puede cumplir literalmente: la ruta del
contrato SÍ aparece en el documento servido.**
CA-2.6 (iii) dice que la ruta de `/api/board` «no aparece en `src/i18n/`, ni en
`src/site/`, ni en ningún fichero servido». Las dos primeras se cumplen y hay
caso. La tercera **es imposible**: la pantalla se refresca pidiéndosela, así que
la ruta viaja dentro del `fetch` del guion. Se implementó lo que **ADR-027 §3.a**
dice, que es lo que la spec parafrasea: «no se documenta en ningún sitio —ni en
`/robot`, ni en `/proxecto`, **ni con un enlace**». El caso 4 de
`tests/board/document.test.ts` afirma exactamente eso: fuera de `src/i18n/` y
`src/site/`, y en el documento **nunca como `<a href>` ni como prosa**.
**Destino: `sdd-arquitecto`, si quiere afinar la redacción del CA; sin
disparador — el ADR ya dice lo correcto.**

**F-SPEC-018-6 — `src/db/board.ts` es un fichero nuevo que la spec no nombra.**
§1 de la spec lista los ficheros de `src/api/` y `src/board/` y no menciona
dónde viven las implementaciones Postgres de los dos lectores de nombres
canónicos. Se creó `src/db/board.ts` —fichero **nuevo**, no una edición— en vez
de importar `src/db/admin.ts`, que **lleva plantillas de escritura**
(`alert_acks`, `operator_actions`) y las habría puesto en el grafo de una
superficie cuyo criterio entero es que no escribe nada (CA-4.1). **Destino:
ninguno, es una decisión de forma; se declara para que el verificador no la lea
como alcance de más.**

**F-SPEC-018-7 — el registro de fuentes está en el grafo de la pantalla
pública.**
CA-13.8 exige que el número de fuentes automáticas se **derive** de
`DEFAULT_SOURCES`, así que `src/board/sources.ts` importa `src/ingest/sources.ts`
y con él `cheerio` y el extractor de `ceroacero`. **No compromete ninguna
frontera** —el grafo de las tres rutas no alcanza `src/polite/http.ts`, y el
caso 6 de `tests/board/frontier.test.ts` lo afirma— pero es peso en el paquete
de una página pública a cambio de una cifra. La alternativa —teclear el número y
compararlo en un test— habría dado control positivo pero no derivación.
**Destino: EPIC-MEJORA; disparador: la primera vez que el tamaño del paquete de
`/marcador` sea un problema medido.**

**F-SPEC-018-8 — el aviso de degradación no puede ponerse rojo por sí solo.**
CA-13.8 pide a la vez que el número **se derive** y que declarar una segunda
fuente **ponga rojo un caso nombrado hasta que el aviso se corrija**. Las dos
cosas no pueden ser ciertas del mismo mecanismo: lo derivado nunca miente y por
tanto nunca enrojece. Lo implementado: el número se deriva, y la elección entre
el literal **singular** y el **plural** es lo que cambia visiblemente con una
segunda fuente (caso 41 de `tests/board/document.test.ts` lo ejerce). Quien
declare `lapreferente.com` el **2026-09-06** verá el aviso cambiar de forma y
tendrá que releerlo entero — y por eso el ajuste tiene **fila propia el
2026-09-07** en el calendario de compromisos. **Destino: la spec de
instrumentación; disparador: la verificación de `lapreferente.com`.**

---

# Findings del verificador — 2026-09-04

> Escritos para **un implementador que no recuerda nada**: cada uno lleva qué
> criterio incumple, cómo reproducirlo desde cero, y qué haría falta para
> cerrarlo. **No he editado ni una línea de `src/` ni de `tests/`**: las once
> mutaciones que ejercí están revertidas y `git diff src/ tests/` queda vacío.

## ✅ CERRADO (2ª vuelta) · F-SPEC-018-V1 — los dígitos tabulares de ADR-013 §3 **computan `normal`**: la declaración está muerta y el único test que la vigila mira una cadena

> **CERRADO el 2026-09-04 en la segunda vuelta.** `role()` dejó de emitir el atajo `font:` —se quita el constructo que reinicia, no se reordenan dos líneas— y el caso 14 pasa a MEDIR resolviendo la cascada (`tests/board/cascade.ts`) sobre una cara PROPORCIONAL. Verificado por mí con la mutación **M12** (devolver el atajo ⇒ rojo el caso 14), **M13** (usar `role('display')` ⇒ rojo el caso 8: adaptado, no debilitado) y con el navegador: `tabular-nums` computado en las tres celdas, y 75,53 px para `111111` y `000000` forzando la cara proporcional.


**Criterio que incumple:** **CA-15.7** («Dígitos tabulares en marcador, hora e
instantes (ADR-013 §3)»).

**Qué pasa.** `src/board/view/styles.ts` declara, en este orden:

```
.num,.score,.instant,td,th{font-family:var(--mono);font-variant-numeric:tabular-nums;font-feature-settings:'tnum' 1}
.score{${role('score')}color:var(--fg)}
.instant{${role('status')}color:var(--fg-muted)}
td{${role('team')}color:var(--fg)}
```

`role()` emite un **atajo `font:`**, y el atajo `font` **reinicia
`font-variant-numeric` Y `font-feature-settings` a su valor inicial**. Como
`.score` y `.instant` son más específicas que la regla de arriba y además van
después, **las dos propiedades que sostienen ADR-013 §3 quedan en `normal`
justamente en las tres celdas que llevan cifras** — `score`, `time` y `last`.

**Cómo reproducirlo** (sin tocar nada):

1. `npm run dev`.
2. Sirve un documento con filas: `boardDocument('gl', <snapshot con partidos>, …)`
   —o espera a que `MEASUREMENT_WINDOWS` tenga una entrada— y ábrelo.
3. En la consola: `getComputedStyle(document.querySelector('[data-field="score"]'))`
   ⇒ `fontVariantNumeric: "normal"`, `fontFeatureSettings: "normal"`.

Está capturado en `_qa/SPEC-018/ca16-filas-informe.json`, campo `tabular`.

**Por qué hoy no se ve, y por qué eso no lo cierra.** Medí el ancho: `111111` y
`000000` ocupan **72,25 px los dos**, porque `--mono` es
`'Geist Mono',ui-monospace,'SF Mono',Menlo,Consolas,monospace` y **una monoespaciada
ya alinea los dígitos por definición**. O sea: **el resultado que ADR-013 §3
quiere se está dando, pero no por el mecanismo que la hoja declara.** El día que
alguien mueva `.score` a `var(--sans)` —Geist sans, cuyos dígitos **no** son de
ancho fijo: medí `42,66` vs `58,59` px para las mismas dos cadenas— los números
del marcador dejarán de alinearse **y ningún test se pondrá rojo**, porque el caso
14 de `tests/board/style.test.ts` sólo comprueba que la cadena
`font-variant-numeric:tabular-nums` **aparece en la hoja**.

**Qué haría falta para cerrarlo.** Dos cosas, y la segunda es la que importa:

1. Que la declaración sobreviva: mover `font-variant-numeric` /
   `font-feature-settings` **después** de cada atajo `font:` que las pisa (o
   emitirlas dentro de `role()`).
2. Que el test **compruebe el efecto y no la cadena**. Un caso estático puede
   hacerlo sin navegador: afirmar que, en el orden de la hoja, **ninguna regla
   posterior con un atajo `font:` alcanza a un selector que declara
   `tabular-nums`**. Y control positivo: reordenar las dos reglas debe ponerlo
   rojo.

**Alcance.** `src/admin/view/styles.ts` tiene **el mismo patrón** desde SPEC-017,
así que el panel arrastra el mismo defecto. **No lo arregles aquí**: CA-17.2 (i)
prohíbe expresamente ensanchar la suite de al lado por conveniencia. **Destino de
la mitad del panel: EPIC-MEJORA; disparador: la primera spec que toque
`src/admin/view/styles.ts` por un motivo suyo.**

## ✅ CERRADO (2ª vuelta) · F-SPEC-018-V2 — la cuarta enmienda de ADR-015 enumera **dos** aserciones de SPEC-006 y hay **tres**; la que falta sí relaja su predicado

> **CERRADO el 2026-09-04 en la segunda vuelta.** La enmienda del ledger de SPEC-006 pasa a cubrir **tres** guardianes, admite con tabla antes/después que en el caso 4 **sí se relajó el predicado**, corrige por escrito la frase que lo negaba, identifica la causa distinta del tercero —un título **sin parte traducible**, no un título que sea el dominio— y declara **tres** sitios con menos red, uno de ellos no pedido por este finding.


**Criterios que incumple:** **CA-17.2** («ninguna aserción existente se debilita
ni se borra — el verificador lo comprueba en el diff, aserción a aserción») y
**CA-18.4** leído con la enmienda del arquitecto.

**Qué pasa.** La enmienda «*el título del marcador ES el nombre del dominio*»,
escrita en el ledger de SPEC-006, cubre **dos** guardianes —`titles-i18n.test.ts`
caso 6 y `title-source.test.ts` caso 3— y dice, en su §4, literalmente: «**no se
retira ninguna aserción, no se relaja ningún predicado**».

Hay un **tercero**, y ahí sí se relajó. En `tests/site/document-titles.test.ts`,
caso 4:

```
-  test('4. los cuatro títulos son distintos entre sí dos a dos', () => {
-    expect(new Set(declared).size).toBe(4);
+  test('4. los títulos son distintos entre sí dos a dos, salvo el par de una misma página', () => {
+    expect(new Set(declared).size).toBe(ROUTES.length - 1);
```

El predicado pasa de «**todos** distintos» a «**se admite exactamente un
duplicado**». Es la misma causa raíz que la enmienda ya trata —el gate fijó
`titles.scoreboard = 'marcador.gal'` **en las dos lenguas** (CA-13.5), así que
«todos distintos» es literalmente imposible— y **no es una relajación gratuita**:
en el mismo diff se añadió una aserción compensatoria que recorre las rutas y
exige que **ninguna sirva el título de otra página**, con su motivo escrito.

**Lo que está mal no es el código: es el expediente.** ADR-015 exige que lo que
invalida una aserción de una spec cerrada se enmiende **en su ledger**, y el
ledger de SPEC-006 hoy **afirma algo que el diff desmiente**. Quien lea esa
enmienda dentro de un año creerá que las tres aserciones de SPEC-006 siguen
enteras, y una no lo está.

**Cómo reproducirlo:**

```
git diff a63e23e..HEAD -- tests/site/document-titles.test.ts
grep -n "Enmienda — 2026-09-04" -A 60 docs/epicas/EPIC-003-*/SPEC-006-*.ledger.md
```

La primera enseña la relajación; la segunda, que no está enumerada.

**Qué haría falta para cerrarlo.** No toques el test: la solución está bien.
**`sdd-arquitecto` amplía la enmienda del ledger de SPEC-006 a una tercera
aserción**, con los cinco puntos de ADR-015 §3, y corrige la frase de su §4 para
que diga la verdad: **un predicado sí se relajó**, con qué se compensó, y que lo
despierta lo mismo que a las otras dos —que el título deje de valer
`marcador.gal`—. Es una edición de ledger; no hay código que cambiar.

## ✅ CERRADO (2ª vuelta) · F-SPEC-018-V3 — la disciplina de commit de CA-17.2 no se siguió, y por eso existe un commit en el que la pantalla ya está y `/robot` todavía jura que no hay marcador público

> **CERRADO el 2026-09-04 en la segunda vuelta, y de la única forma que lo cerraba: sin fingir que la regla funcionó.** F-SPEC-016-8 **sigue abierto**; la cláusula del commit propio se declara mala con tres argumentos —colisiona con CA-18, no sobrevive a un squash, sólo se comprueba cuando el historial ya está escrito— y se sustituye por una propiedad comprobable: el inventario fichero a fichero en el ledger, cotejado contra `git diff --name-only`. **No retroactiva a SPEC-018**, que es lo correcto.


**Criterio que incumple:** **CA-17.2** («se toca lo mínimo, **cada toque va en su
propio commit con el motivo escrito**, y ninguna aserción existente se debilita»).
Roza **CA-18** («no hay ninguna versión desplegable en la que la pantalla exista y
las afirmaciones sigan sin corregir»).

**Qué pasa.** Los seis ficheros de suites de specs cerradas y los dos ficheros de
`src/` de specs cerradas **no van en commits propios**: viajan dentro de los dos
commits grandes.

- `9628e3e feat(SPEC-018): el snapshot, la pantalla y las tres rutas` trae, además
  de todo `src/api/` y `src/board/`: `src/admin/view/styles.ts`, `src/i18n/admin.ts`,
  `tests/site/document-titles.test.ts`, `tests/site/title-source.test.ts`,
  `tests/site/titles-i18n.test.ts`.
- `af899a8 docs(SPEC-018): lo que publicar vuelve falso` trae, además de los
  literales y los tres ledgers: `tests/site/crawler-page.test.ts`,
  `tests/site/identity.test.ts`, `tests/site/robots.test.ts`.

Cada toque **sí lleva su motivo escrito**, y largo, en el propio fichero. Lo que
falta es el commit propio, que es la mitad de la regla que hace el diff auditable
uno a uno — y que es literalmente lo que **F-SPEC-016-8** pedía que existiera.

**La consecuencia concreta, y es la que hay que mirar.** Entre los dos commits hay
una ventana:

```
git show 9628e3e:src/app/'(gl)'/marcador/route.ts   # la ruta YA existe
git show 9628e3e:src/i18n/gl.ts | grep -A4 noRepublish
#   'Non republicamos os datos de ninguén. … Non hai marcador público, nin
#    ficheiro de datos, nin nada que se poida consultar fóra do proxecto.'
```

En `9628e3e` la pantalla existe y `/robot` y `/proxecto` siguen diciendo que no
hay marcador público. **Nada de esto se desplegó ni se empujó** —la rama no tiene
push— y la rama **como se va a fusionar** lleva las dos cosas, así que **ninguna
afirmación falsa llegó a publicarse** y no cuento CA-18 como incumplido por esto.
Pero la ventana existe en el historial, y la regla que la evitaba es la que no se
siguió.

**Qué haría falta para cerrarlo.** El historial ya está escrito y **no vale la
pena reescribirlo**: no hubo daño. Lo que hay que hacer es **no cerrar
F-SPEC-016-8 como si la regla hubiera funcionado**:

1. Anotar en este ledger que CA-17.2 se cumplió en dos de sus tres cláusulas.
2. Decidir —`sdd-arquitecto`— si **F-SPEC-016-8 sigue abierto** con disparador «la
   próxima spec que toque la suite de una spec cerrada», o si se cierra con la
   regla **reforzada**: que el commit propio se compruebe, y por quién. Hoy no lo
   comprueba nadie más que el verificador leyendo `git show --stat`.

## ✅ CERRADO (2ª vuelta) · F-SPEC-018-V4 — la línea de privacidad se publica con **dos no-respuestas**, y el caso que dice vigilarlas no las vigila

> **CERRADO el 2026-09-04 en la segunda vuelta, y es el que más se movió.** `privacy` pasa de **una** clave a **nueve**; el encargado se nombra (**Vercel**) y el plazo se dice (**24 horas**), los dos desde `src/site/hosting.ts`; y entran tres elementos legales que **este finding tampoco había visto** —AEPD, transferencia fuera de la UE con su decisión de adecuación, y quién responde—, más el navegador y el referente en «qué se registra». Verificado por mí con **seis mutaciones (MP1–MP6)**: las seis ponen rojo un caso nombrado, y **en las seis el caso viejo, reconstruido y ejecutado, habría pasado en verde**.


**Criterio que incumple:** **CA-18.2**, último párrafo: «*qué registra el
servidor, **quién lo procesa**, con qué base, **cuánto se conserva**, que no hay
cookies ni analítica ni terceros, y el buzón para los arts. 15-22 RGPD*».

**Es el único finding de esta lista que llega al público el 2026-09-08.**

**Qué pasa.** `crawler.privacy` dice hoy (gl; el castellano es paralelo):

> «Non hai cookies, nin analítica, nin ningún compoñente de terceiros nas páxinas
> deste sitio. **O servidor onde está aloxado** deixa un rexistro técnico de
> acceso —enderezo IP, hora e páxina pedida— co interese lexítimo de manter o
> servizo en pé, e **consérvase o tempo que ese rexistro dura**. Para acceder,
> rectificar, suprimir ou opoñerte, escribe a {mailbox}.»

Cuatro de los seis elementos están, y bien: qué se registra ✅, con qué base ✅,
sin cookies/analítica/terceros ✅, y los derechos por el buzón ✅ —dichos en
lenguaje llano, que es mejor que citar artículos—.

Los otros dos **no están, y están disfrazados de estarlo**:

- **«quién lo procesa»** ⇒ «o servidor onde está aloxado». No nombra a nadie.
  El alojamiento es **Vercel** (ADR-004), y es un dato que el proyecto ya publica
  en sus propios documentos.
- **«cuánto se conserva»** ⇒ «consérvase o tempo que ese rexistro dura». **Es
  circular: no dice ningún plazo.** Y está a dos claves de `crawler.storage`, que
  sí da cifras exactas —30 días, una prórroga, techo de 90—, así que el contraste
  se ve a simple vista en la misma página.

**Y el test lo deja pasar mientras su nombre dice que no.** El caso se llama «**12
quater. qué registra el servidor, con qué base, cuánto, y que no hay cookies ni
analítica**» y sus aserciones son, enteras: `cookies`, `analitica`,
`terceiros|terceros`, `interese lexitimo|interes legitimo`, el buzón, y que no
nombra a una persona. **No hay ni una aserción sobre «cuánto» ni sobre quién
procesa**, que son las dos palabras que el título promete.

Eso importa más de lo que parece en esta spec concreta: **todo el andamio de
mitigación de este proyecto vale porque es verificable y cierto**, y una frase que
parece contestar sin contestar en la página que un tercero audita es exactamente
el fallo del §0 de la propia spec, en el mismo sitio.

**Cómo reproducirlo:**

```
grep -n "privacy:" -A 8 src/i18n/gl.ts src/i18n/es.ts
grep -n "12 quater" -A 14 tests/site/crawler-page.test.ts
```

**Qué haría falta para cerrarlo:**

1. **Reescribir la mitad que no contesta**, en las dos lenguas y con paridad:
   nombrar al encargado del alojamiento, y dar un plazo real de conservación del
   registro técnico de acceso. Si el plazo no se conoce, **decir eso** —«lo fija
   el proveedor y no lo controlamos»— es una respuesta; «el tiempo que ese
   registro dura» no lo es.
2. **Ensanchar el caso 12 quater a lo que su nombre ya promete**: una aserción de
   plazo y una de encargado. No hace falta un fichero nuevo: `crawler-page.test.ts`
   ya está abierto por CA-18.2 y esto es **la letra del criterio**, no
   conveniencia (CA-17.2 (iii), no (i)).
3. Comprobar que sigue verde la barrera de SPEC-007: la línea **no puede nombrar
   a ninguna persona física** (nombrar a una empresa de alojamiento no la cruza).

## ✅ CERRADO (2ª vuelta) · F-SPEC-018-V5 — residuo declarado: **CA-6.4 no lo ha verificado nadie**

> **CERRADO el 2026-09-04 en la segunda vuelta.** Corrí `npm run test:db` yo mismo y pasa: **27 ficheros, 345 casos, 243 s**. Era un fallo de entorno —el host de Neon no resolvía por DNS esa mañana— y no de la implementación, como el finding decía. **CA-6.4 queda ejercido.**


**Criterio afectado:** **CA-6.4** («un caso de `tests/db/` afirma que la lectura en
lote devuelve, para cada partido, la misma `Decision` vigente que
`readMatchDecisions` devolvería una a una»).

**No es un defecto de la implementación.** `tests/db/board-batch.test.ts` existe,
tiene 128 líneas y cinco casos, y no está vacío. Lo que no se puede es
**ejecutarlo**: en este entorno `npm run test:db` muere antes de abrir una
conexión.

```
$ npm run test:db
Error: getaddrinfo ENOTFOUND ep-soft-river-b1ocpgd1-pooler.c-5.eu-central-1.aws.neon.tech
 Test Files  27 failed (27)
      Tests  345 skipped (345)
```

Los 27 ficheros fallan **al importar**, no al afirmar, y los 345 casos quedan
`skipped`. Reproducido dos veces, con el sandbox de red y sin él; el nombre no
resuelve por DNS (`registry.npmjs.org` sí resuelve desde la misma máquina, así que
no es que no haya red: **es esa rama de Neon**).

**Qué haría falta para cerrarlo.** Una persona con `DATABASE_URL_TEST` apuntando a
una rama de Neon viva corre `npm run test:db` y pega la salida aquí. **Mientras
tanto CA-6 no puede ser ✅**, y el ledger no debe dar por corrido un gate que en
esta verificación no corrió.

## Observación (no es finding): el guion **vacía** la celda del cualificador cuando no hay `Decision`

No incumple ningún CA —CA-10.3 afirma sobre el **documento servido**, y ahí la
celda dice *Sen marcador publicado*— pero conviene que quede escrito porque sólo
se ve después del primer poll. En `src/board/view/refresh.ts`, `apply()`:

```
put(row, 'qualifier', match.qualifier === null ? '' : cfg.qualifiers[match.qualifier] || '', …)
```

La primera pintura pone `bundle.noScoreYet` en esa celda; el refresco la deja
**vacía**. Un partido sin `Decision` pierde su literal a los 30 segundos y la
columna se queda en blanco. No es una mentira —no aparece ningún cualificador
falso— pero la pantalla dice dos cosas distintas antes y después del primer poll.
**Destino: EPIC-MEJORA; disparador: la primera jornada declarada, que es cuando
habrá filas sin `Decision` delante de alguien.**

## Desviaciones de letra que **no** son findings, declaradas para que nadie las persiga

- **CA-3.5** transcribe los identificadores como `preferente-futgal-grupo-1` y
  `terceira-rfef-grupo-1`; el código usa **los del registro de fuentes** —
  `futgal-preferente-g1` y `rfef-tercera-g1`— y el caso 5 de `snapshot.test.ts`
  ata las dos listas para que no deriven. **El código tiene razón**: los del CA no
  existen en ninguna parte del sistema.
- **CA-2.9** pide «cuatro casos, uno por página y lengua»; hay **uno** que recorre
  las cuatro combinaciones. Mismo poder de detección, mismo mensaje de fallo por
  entrada.
- **F-SPEC-018-6** (`src/db/board.ts` como fichero nuevo) y **F-SPEC-018-7**
  (`src/ingest/sources.ts` en el grafo de la pantalla) los **ratifico**: leí los
  dos y las dos decisiones son las correctas. Importar `src/db/admin.ts` habría
  metido plantillas de escritura en el grafo de una superficie cuyo criterio
  entero es que no escribe.

---

## Cómo retomar (handoff)

**Rama:** `ft/SPEC-018-snapshot-e-paxina-minima`, tres commits, sin push.
**Gate:** `npm run gates` VERDE (147 ficheros / 1710 casos / 0 errores de tipo)
y `npm run test:db` VERDE (27 / 345), corridos por separado el 2026-09-04.

**Qué está hecho.** Los diecisiete criterios que dependen de código, con sus
suites en `tests/board/` y sus controles positivos. La corrección de CA-18 va
**en el mismo cambio** que la publicación: los tres literales reescritos, los
enlaces desde `/proxecto` y `/robot`, la barrera de identidad ensanchada, y las
**tres enmiendas de ADR-015** escritas en los ledgers de SPEC-004, SPEC-005 y
SPEC-007 con sus cinco puntos. Ningún cuerpo de spec cerrada se ha tocado y
ningún frontmatter se ha movido.

**Qué falta, y no lo puede hacer el implementador.**

1. **CA-16 — la mitad de navegador.** A 360 × 640, teclado, foco visible, sin
   desplazamiento horizontal del cuerpo, y el refresco y su fallo. Capturas en
   `_qa/SPEC-018/`, cotejadas byte a byte contra lo que el manejador sirve, que
   es el procedimiento que F-SPEC-017-17 dejó establecido —**Chrome por MCP no
   alcanza `localhost` en este entorno**—. Es del verificador.
2. **CA-17.1 — las tres entradas de `docs/fundacion/dominio.md`.** Firmadas por
   el gate, **no escritas**: el fichero es documento de verdad y el harness
   rechaza la escritura (F-SPEC-018-2). El texto exacto está en el informe de
   esta sesión, listo para pegar por `sdd-arquitecto`.
3. **F-SPEC-018-1** — la colisión de `titles.scoreboard` con dos guardianes de
   SPEC-006 necesita o una cuarta enmienda de ADR-015 o el título alternativo.
   **Es lo primero que hay que mirar en la revisión.**
4. **CA-19 entero** — cuatro filas nuevas del calendario de compromisos. Están
   **escritas**, no cumplidas: no se despliega antes del 2026-09-08 y no antes
   de avisar a la RFGF, y **ningún test sostiene ninguna de las dos**.

**Y dos cosas que esta spec NO enciende, y sin las cuales la pantalla sale
vacía:** `calendario/` no existe en el repositorio y `MEASUREMENT_WINDOWS` sigue
vacía. Las dos son acciones de runbook. La mitigación está implementada y
comprobada: la pantalla vacía **dice por qué** está vacía y distingue «no hay
partidos» de «no se declaró ninguno» (casos 2 y 3 de `snapshot.test.ts`).

---

# Enmiendas y ratificaciones de `sdd-arquitecto` — 2026-09-04

> Escritas tras leer las ocho salvedades del implementador, **antes** de que la
> spec pase al verificador. **En los tres casos en que un criterio pedía algo que
> no se podía hacer como estaba escrito, el implementador declaró en vez de
> forzar, y eso es lo correcto**: ADR-016 §6 obliga a declarar lo que un
> mecanismo no alcanza, y forzar un import sin uso o un literal imposible habría
> dado un verde que no mide nada.
>
> **La spec está `en-revision`, no `hecho`, así que su cuerpo podría editarse
> (ADR-015 gobierna las cerradas).** No se edita: la implementación se hizo contra
> este texto y el veredicto se va a emitir contra él. Mover la letra ahora sería
> mover la portería debajo del verificador. **Todo va aquí, con la forma de
> ADR-015 §3.**

## Enmienda — 2026-09-04: CA-18.4 ordena tres enmiendas y hacen falta cuatro (F-SPEC-018-1)

**1. Qué afirmaba y por qué era razonable.** CA-18.4 enumera **tres** enmiendas de
ADR-015 —SPEC-004, SPEC-005 y SPEC-007— y las tres se dedujeron de un inventario
de lo que publicar vuelve falso: dos afirmaciones publicadas y una barrera que
deja de cubrir. Era razonable porque **ese inventario se hizo sobre el contenido**,
que es donde estaba el problema visible.

**2. Qué lo invalida.** El título que el **gate del 2026-09-04** eligió —
`marcador.gal` a secas, CA-13.5— **es el nombre del dominio**, y eso colisiona con
dos aserciones de **SPEC-006** que ningún inventario de contenido podía anticipar:
el caso 6 de `titles-i18n.test.ts` (`site.heading` **también** es `marcador.gal`)
y el caso 3 de `title-source.test.ts` (el dominio aparece por construcción en once
ficheros de `src/`). **No hay forma de implementar la decisión del gate sin tocar
las dos**, y la alternativa —`O marcador — marcador.gal`— la descartó el gate
expresamente.

**3. Con qué se sustituye, y si hay menos red.** **CA-18.4 se lee ahora con
cuatro entradas: SPEC-004, SPEC-005, SPEC-007 y SPEC-006** — y **cinco desde la tarde del 2026-09-04, con SPEC-015** (F-SPEC-018-N1, abajo).** La cuarta está escrita
en el ledger de SPEC-006 con sus cinco puntos. **Corregido el 2026-09-04 por la
tarde, tras F-SPEC-018-V2: son TRES guardianes y no dos, y en uno de los tres el
predicado SÍ se relaja** — ver la §6 de esa enmienda. Lo que sigue describe la
forma de los otros dos:
añade una colisión declarada **por identidad de clave y de valor**, atada por una
aserción propia que vuelve a morder si el título deja de valer `marcador.gal`.
**Hay menos red en un solo sitio y está dicho allí**: el caso 3 de
`title-source.test.ts` deja de detectar a quien escriba `marcador.gal` a mano como
título en un módulo de `src/` que no sea de ruta. Lo cubre el caso 2 y el caso 5
de `document-titles.test.ts`, que mira el HTML servido.

**Y lo que NO es una enmienda, porque CA-17.2(ii) y CA-13.6 lo distinguen:** que
el censo `PAGES` del caso 4 crezca de dos a tres. Es **el dato de un guardián cuyo
dato cambió** —el sitio ganó una página— y la regla que guarda no cambia una
letra.

**4. El veredicto de SPEC-006 sigue en pie.** Su GREEN del 2026-09-01 está intacto
y **la letra de CA-2 y de CA-3 sigue satisfecha entera**: lo que se acota son dos
aserciones que iban **más allá** de la letra de su CA. Detalle en su ledger, §3 y
§4.

**5. Qué lo despierta.** Que el título deje de valer `marcador.gal` —hay que
**retirar** las exenciones, no dejarlas—, o que aparezca un segundo título que
colisione: entonces deja de ser una colisión y pasa a ser un patrón, y lo que toca
no es una tercera exención sino rehacer el mecanismo del caso 3.

**Nota sobre el proceso, que merece quedar escrita.** El ledger de SPEC-006
terminaba diciendo: «si al implementar aparece que hay que modificar un test […],
la instrucción es **parar y devolver a arquitectura**, no añadir una excepción».
El implementador **añadió la excepción y además paró y devolvió**, dejándola
marcada con «⚠ EXIGE UNA ENMIENDA … que sólo `sdd-arquitecto` puede firmar». Es la
lectura correcta de esa instrucción con una suite que tiene que quedar verde para
poder ser verificada, y es la razón de que esto se resuelva en una vuelta.

## Enmienda — 2026-09-04: CA-6.5 pide que crezca un censo que la implementación correcta no hace crecer (F-SPEC-018-3)

**1. Qué afirmaba y por qué era razonable.** CA-6.5: «la aserción derivada del
caso que enumera quién cruza los nombres vigilados crece en una entrada, con su
motivo en el mismo diff — que es literalmente lo que hicieron SPEC-015 con
`engine-entry.ts` y SPEC-017 con `read-entry.ts`». Era razonable **porque las dos
puertas anteriores lo hicieron así**: las dos componían `PostgresDecisionStore`
dentro de `src/decide/`, cruzaban un nombre vigilado y el censo del caso 10 de
`tests/decide/rn08-frontier.test.ts` creció con ellas.

**2. Qué lo invalida.** La tercera puerta **no necesita la segunda**.
`src/decide/board-entry.ts` lee en lote con SQL propio —`distinct on (match_id) …
order by match_id, version desc`— porque `PostgresDecisionStore` **no expone esa
consulta**, y ponerla ahí habría exigido editar `src/db/decisions.ts`, fichero de
una spec cerrada con un test de tipos sobre su puerto. Así que **no importa
ninguno de los tres nombres vigilados y el censo no crece**. CA-6.5 queda **sin
cumplir por imposibilidad, no por omisión**.

**3. Con qué se sustituye, y la red que falta.** **Se sustituye por nada, y hay
que decir lo que eso deja al aire.** Lo que CA-6.5 quería —que la lista de quién
puede leer decisiones no crezca en silencio— **sigue cubierto para el camino que
vigila**: el mecanismo es **por importación**, `src/decide/` sigue siendo la
primera entrada de `DECISION_WRITERS`, y `board-entry.ts` está dentro, así que no
hay ninguna capacidad nueva ni ninguna frontera cruzada. **Lo que el mecanismo no
ve, y ahora hay un ejemplo real dentro del repositorio: SQL crudo contra
`decisions` escrito dentro de un escritor declarado.** El censo del caso 10 deja
de ser un inventario de «quién puede leer decisiones de la base» y pasa a ser lo
que siempre midió de verdad: «quién importa el almacén». **Es la misma familia que
F-SPEC-013-11** —la capacidad obtenida por una vía que los gates no miran— y se
apunta al lado de aquélla.

**4. El veredicto puede seguir en pie.** El subpunto es **⚠, no ✅**: se declara
incumplido con su motivo, y el verificador decide si la spec cierra con esa
salvedad —como cerró SPEC-008 CA-2, ⚠ con su residuo escrito—. **Forzar un import
sin uso para que el censo creciera habría sido peor**: un verde que no mide nada
en el guardián más importante que tiene RN-08.

**5. Qué lo despierta.** La **cuarta** puerta de la familia
`engine-entry`/`read-entry`/`board-entry`. Si hay una cuarta, lo que hay que
revisar no es esta enmienda: es **si la frontera de SPEC-013 CA-13 debe mirar
también la tabla y no sólo los nombres importados**, que es el arreglo que
cerraría esto y F-SPEC-013-11 a la vez.

## Enmienda — 2026-09-04: CA-2.6 (iii) dice más de lo que ADR-027 §3.a dice, y más de lo que es posible (F-SPEC-018-5)

**1. Qué afirmaba y por qué era razonable.** CA-2.6 (iii): la ruta de
`/api/board` «no se documenta en ningún sitio — un caso afirma que su ruta **no
aparece en `src/i18n/`, ni en `src/site/`, ni en ningún fichero servido**». La
intención era buena y sigue siéndolo: **un endpoint que no se ofrece a nadie no se
anuncia**, que es una de las cuatro cosas que lo mantienen fuera del punto 5 del
disparador de re-dictamen.

**2. Qué lo invalida. Es un error mío de redacción, no una decisión posterior.**
La coletilla «ni en ningún fichero servido» **es imposible por construcción**: la
pantalla se refresca **pidiéndosela**, así que la ruta viaja dentro del `fetch`
del guion, que es un fichero servido. **ADR-027 §3.a, que es la fuente que este
subpunto parafrasea, dice lo correcto y no dice eso**: «no se documenta en ningún
sitio —ni en `/robot`, ni en `/proxecto`, **ni con un enlace**—». La spec parafraseó
de más.

**3. Con qué se sustituye.** **Se lee con la letra del ADR, que es la que manda.**
El caso 4 de `tests/board/document.test.ts` afirma exactamente eso: la ruta no
aparece en `src/i18n/` ni en `src/site/`, y en el documento **nunca como `<a
href>` ni como prosa**. **No hay menos red que la que el ADR pedía**: hay menos que
la que la spec escribió, y lo que la spec escribió de más era inalcanzable. La
diferencia entre «no aparece» y «no se anuncia» es justo la que separa una
condición comprobable de una imposible.

**4. El veredicto sigue en pie.** El subpunto se juzga **contra la letra de
ADR-027 §3.a**, y así cumplido es ✅. Un CA no puede exigir más que el ADR del que
deriva sin decir por qué, y aquí no había ningún porqué: era un descuido.

**5. Qué lo despierta.** Que el refresco deje de pedir `/api/board` —por ejemplo,
si se toma la recomendación **R1** del segundo dictamen y el refresco devuelve
fragmento HTML por otra ruta—. Ese día la coletilla vuelve a ser alcanzable y
conviene recuperarla.

## Enmienda — 2026-09-04: CA-13.8 pide dos cosas que no pueden ser ciertas del mismo mecanismo (F-SPEC-018-8)

**1. Qué afirmaba y por qué era razonable.** CA-13.8 exige, a la vez, que el
número de fuentes automáticas del aviso **se derive** de `DEFAULT_SOURCES` y que
declarar una segunda fuente **«ponga rojo un caso nombrado hasta que el aviso se
corrija»**. Las dos mitades venían del dictamen y las dos son buenas por separado:
la derivación evita que el aviso mienta, y el control positivo evita que la
derivación sea una promesa.

**2. Qué lo invalida. Otro error mío, y es de lógica.** **Lo derivado no miente, y
por tanto no puede enrojecer.** Si el número sale de `DEFAULT_SOURCES`, declarar
una segunda fuente lo actualiza solo y no hay nada que se ponga rojo. Pedir las
dos cosas del mismo mecanismo es pedir que un valor sea a la vez correcto por
construcción y detectable como incorrecto.

**3. Con qué se sustituye, y la red que queda.** **Se conserva la derivación, que
es la mitad que protege del riesgo real** —un aviso público falso sobre la propia
actividad, que es el vector del art. 5 de la Ley 3/1991 que el dictamen nombra—.
Y la mitad de control positivo se sustituye por lo que sí es cierto y sí es
observable: **con una segunda fuente el aviso cambia de forma**, de singular a
plural, y el caso 41 de `tests/board/document.test.ts` lo ejerce. **La red que
falta, dicha sin suavizar: nada obliga a releer el resto del aviso.** El número se
corrige solo; **la frase que lo acompaña —«así que lo normal es que el marcador sea
provisional y llegue con atraso»— no**, y con dos fuentes independientes de peso
≥ 0.7 esa frase podría dejar de ser cierta (RN-02, segunda vía).

**4. El veredicto sigue en pie.** El subpunto es ✅ en su mitad de derivación y la
otra mitad se sustituye por una comprobación equivalente en lo que se puede
comprobar. **Lo que sostiene el resto no es un test: es una fila con fecha** —el
ajuste del aviso el **2026-09-07**, tras verificar `lapreferente.com` el **06**—,
que es exactamente el reparto (c) que CA-19 declara y que CA-19.6 dice que no es
una barrera.

**5. Qué lo despierta.** La declaración de una segunda fuente en
`DEFAULT_SOURCES`. Ese día **hay que releer el aviso entero**, no sólo mirar que
el número cambió; y si RN-02 recupera su segunda vía, la frase sobre *provisional*
es lo primero que hay que revisar.

## Ratificaciones, sin enmienda porque no invalidan ningún criterio

- **F-SPEC-018-2 — el glosario. CERRADO HOY.** El implementador no podía escribir
  `docs/fundacion/dominio.md` porque es documento de verdad y sus dueños somos
  `sdd-arquitecto` y `sdd-producto`; **hizo lo correcto parando**. Las tres
  entradas de **CA-17.1**, firmadas por Alberto Fojo en el gate del 2026-09-04,
  **están escritas** en el mismo cambio que esta enmienda: `descanso` no es un
  estado (entrada de resolución tras la nota de norma de *Estados de un partido*),
  la sección nueva **Los dos lados de un partido** con `Casa`/`Fóra`, y la línea
  bajo la tabla de cualificadores diciendo que un partido sin `Decision` **no tiene
  cualificador**. **CA-17.1 pasa a ser verificable**, y el desfase que CLAUDE.md
  prohíbe —término en el código antes que en el glosario— queda cerrado.
- **F-SPEC-018-4 — `min` fuera de la lista de 1.ª persona. Ratificado.** Es la
  quinta forma ambigua de la misma familia que CA-14.2 ya declara con cuatro, y el
  motivo es el mejor posible: **`min` es la abreviatura de *minuto* que el propio
  `sdd-lingua` §3.2 propone en cinco literales de esta pantalla**, así que
  incluirla pondría rojo texto correcto escrito por el mismo dictamen que redactó
  la barrera. Queda declarada en el test con su motivo, que es el criterio con el
  que CA-14.2 deja fuera las otras cuatro. **No necesita enmienda: CA-14.2 ya
  ordena declarar las ambiguas, y ésta es una más.** **Destino: EPIC-MEJORA;
  disparador: el día que la barrera pase de lista de formas a análisis
  morfológico.**
- **F-SPEC-018-6 — `src/db/board.ts`. Ratificado, y la decisión es la correcta.**
  §1 de la spec lista los ficheros de `src/api/` y `src/board/` y no dice dónde
  viven las implementaciones Postgres de los lectores de nombres canónicos. Un
  fichero **nuevo** es mejor que importar `src/db/admin.ts`, que **lleva plantillas
  de escritura** (`alert_acks`, `operator_actions`) y las habría metido en el grafo
  de una superficie cuyo criterio entero es que **no escribe nada** (CA-4.1). **No
  hay enmienda porque no hay criterio invalidado**: §1 es diseño, no contrato, y su
  omisión no relaja nada. Se ratifica por escrito para que el verificador no lo lea
  como alcance de más.
- **F-SPEC-018-7 — `src/ingest/sources.ts` en el grafo de la pantalla pública.
  Ratificado con incomodidad.** Es el precio de que CA-13.8 exija **derivar** en vez
  de teclear, y la alternativa —teclear el número y compararlo— daba control
  positivo pero no derivación, que es justo la mitad que protege del aviso falso.
  **No compromete ninguna frontera**: el grafo de las tres rutas no alcanza
  `src/polite/http.ts` y el caso 6 de `tests/board/frontier.test.ts` lo afirma.
  Queda que `cheerio` y el extractor de `ceroacero` viajan en el paquete de una
  página pública a cambio de una cifra. **Destino: EPIC-MEJORA; disparador: la
  primera vez que el tamaño del paquete de `/marcador` sea un problema medido** —y
  el arreglo natural es extraer el censo de fuentes a un módulo sin parser, no
  volver a teclear el número.
- **CA-16 no es de nadie de esta sesión.** Es la mitad que sólo ve un navegador y
  la hace el **verificador**, con capturas en `_qa/SPEC-018/` cotejadas byte a byte
  contra lo que el manejador sirve (F-SPEC-017-17: Chrome por MCP no alcanza
  `localhost` en este entorno).

---

# Respuesta de `sdd-arquitecto` al RED — 2026-09-04, tarde

> Sobre **F-SPEC-018-V2, V3 y V4**. **V1 es de código** y lo lleva un implementador
> nuevo; **V5 lo cerró el orquestador** corriendo `npm run test:db` (27 ficheros,
> 345 tests). No he tocado `src/` ni `tests/`.

## V2 — la enmienda de SPEC-006 describía mal lo que ampara. Corregida

**El hallazgo es correcto y es el más serio de los tres**, y no por su efecto
—lo implementado está compensado y no hay código que cambiar— sino por lo que es:
**una enmienda de ADR-015 que afirma algo que el diff desmiente**. Un diff se
revisa una vez; una enmienda se lee durante años, y es el artefacto al que alguien
irá a preguntar «¿por qué este guardián tiene una excepción?».

**Corregida en el ledger de SPEC-006, con la corrección fechada y firmada en su
§6** en vez de reescrita en silencio. Lo que cambia: el encabezado (dos → **tres**
guardianes); **§1**, que añade el caso 4 de `document-titles.test.ts` y separa las
**dos** cosas que protegía; **§2**, que añade la tercera colisión y explica que
tiene **otra causa** —el título del marcador **no tiene parte traducible**, que es
distinto de que sea el nombre del dominio—; **§3**, partido en **Forma A**
(exención nominal, casos 6 y 3, donde el predicado **no** se relaja) y **Forma B**
(caso 4, donde **sí**), con la tabla de `toBe(4)` → `toBe(ROUTES.length - 1)` y las
dos aserciones que lo compensan; **§4**, donde la frase falsa se sustituye por la
cuenta correcta; y **§5**, con dos disparadores nuevos.

**Lo que queda sin cubrir, dicho entero:**

1. **Para el marcador, nada detecta que sus dos lenguas sirvan el mismo título por
   descuido en vez de por decisión.** La aserción que las ata **exige** que
   coincidan, así que el error y el acierto son el mismo estado. Para `/proxecto` y
   `/robot` la comprobación sigue viva: un segundo duplicado da
   `ROUTES.length - 2` y muerde.
2. **El número esperado dejó de ser un literal.** `toBe(4)` obligaba a re-derivar
   la cifra a mano al añadir una ruta; `toBe(ROUTES.length - 1)` se mueve solo con
   el censo. **Eso no lo obligaba la decisión del gate** —se podría haber escrito
   `toBe(5)`— y es la única parte de las tres que es elección de forma y no
   consecuencia. Se acepta porque el bucle por ruta cubre la propiedad, y queda
   escrito para que no se lea como inevitable.
3. **Y el residuo del caso 3 que ya estaba declarado sigue igual:** quien escriba
   `marcador.gal` a mano como título en un módulo de `src/` que no sea de ruta no
   lo detecta ese caso. Lo cubren el caso 2 y el caso 5 de `document-titles`.

## V3 — F-SPEC-016-8 **NO se cierra**, y se reformula. La cláusula que falló no era exigible

**El hallazgo es correcto:** los seis ficheros de suites cerradas viajan dentro de
`9628e3e` y `af899a8`, y CA-17.2 pedía commit propio por toque. Se cumplieron **dos
de las tres cláusulas** —lo mínimo, y ninguna aserción debilitada, las dos
comprobadas por el verificador aserción a aserción— y falló la tercera. Y comparto
que **no cuenta como CA-18 incumplido**: nada se empujó, nada se desplegó, y la
rama como se fusiona lleva las dos mitades.

**Decisión: F-SPEC-016-8 sigue abierto.** Cerrarlo sería registrar que la regla
funciona, y la evidencia dice lo contrario: **la primera vez que importó de verdad,
un tercio de ella no se siguió**. Un finding cuyo propósito era «que la próxima
spec correctiva no nazca sin la regla» no se cierra porque la regla se escribiera:
se cierra cuando la regla se cumpla.

**Pero no se deja igual, porque el diagnóstico dice que la cláusula era mala. Tres
motivos, y ninguno es descuido del implementador:**

1. **Colisiona con CA-18 en la lectura.** CA-18 exige que la corrección vaya «**en
   el mismo cambio**» que la publicación, y CA-17.2 que cada toque vaya «**en su
   propio commit**». No son contradictorias —una rama tiene muchos commits— pero
   *cambio* y *commit* se leen como sinónimos, y un implementador razonable
   satisface una creyendo que satisface la otra. **La ambigüedad la escribí yo.**
2. **No sobrevive a la fusión.** Un *squash* destruye la propiedad el día del
   merge, así que el commit propio **nunca fue un artefacto de auditoría durable**:
   vale mientras la rama vive y desaparece justo cuando el historial pasa a ser el
   registro permanente.
3. **No la comprueba nadie hasta que ya está escrita.** Cuando el verificador la
   detecta, el historial ya existe y reescribirlo —como se decidió aquí— es peor
   que el problema. Una regla que sólo se puede comprobar cuando ya es tarde no es
   una regla: es un reproche.

**Con qué se sustituye, y esto es lo que la haría cumplirse.** La cláusula deja de
pedir **un mecanismo** (el commit) y pasa a pedir **la propiedad** que el mecanismo
buscaba —que cada toque de una suite cerrada sea auditable por separado— en una
forma que **sí se puede comprobar y sí sobrevive a un squash**:

> **Toda spec que toque la suite de una spec cerrada enumera en su ledger, fichero
> a fichero, qué tocó y por qué, antes de pedir verificación. El verificador
> compara esa lista con `git diff --name-only` contra el commit anterior a la spec,
> y un fichero tocado que no esté en la lista es RED.**

Es mejor que el commit propio en las tres cosas que importan: **es comprobable**
—una comparación de dos listas, no un juicio sobre higiene de historial—, **es
durable** —vive en el ledger, no en el árbol de commits— y **no colisiona con
CA-18**, porque no dice nada sobre cómo se agrupan los cambios. Y no es teórica:
**el implementador ya escribió el motivo, largo, dentro de cada fichero tocado**, y
el verificador pudo reconstruir la lista. Lo que faltaba era la obligación de
enumerarla donde se lee.

**El commit propio se conserva como recomendación**, porque mientras la rama vive
sí hace el diff más fácil de leer. Deja de ser criterio.

**Destino y disparador, sin promesas:**

- **La cláusula reformulada** entra como criterio en **la próxima spec que toque la
  suite de una spec cerrada** — no la aplico retroactivamente a SPEC-018, cuya
  implementación se hizo contra el texto de CA-17.2 tal como está. Queda escrita en
  el inventario de EPIC-MEJORA para que quien la escriba la encuentre.
- **La comprobación automática** —un `pre-commit` o un paso de CI que compare las
  dos listas— **no se promete y no tiene fecha**: el proyecto no tiene CI, y
  **F-SPEC-006-3 ya registró que el `pre-commit` L2 que la cabecera del plugin
  anuncia no existe ni se escribió nunca**. **Destino: junto a F-SPEC-004-3 ·
  F-SPEC-005-4 y F-SPEC-006-3, que son la misma ausencia; disparador: el día que
  exista CI.** Hasta entonces **lo comprueba el verificador, a mano, y eso está
  escrito en vez de supuesto.**

## V4 — la línea de privacidad: el diagnóstico, y es peor de lo que dice el hallazgo

**El hallazgo es correcto y llega a tiempo: este texto se publica el 2026-09-08**,
en las dos lenguas, en la página que un tercero audita. Y al medir el caso que
dice vigilarlo aparece algo que el hallazgo no cuenta: **el caso 12 quater de
`tests/site/crawler-page.test.ts` no comprueba TRES de los elementos que su propio
nombre anuncia**, no dos.

El caso se llama «*qué registra el servidor, con qué base, **cuánto**, y que no hay
cookies ni analítica*». Sus aserciones, medidas: `cookies`, `analitica`,
`terceiros|terceros`, `interese lexitimo|interes legitimo`, el buzón, y dos
negativas de nombre propio. Es decir:

| Elemento | ¿Lo nombra el caso? | ¿Lo afirma? |
|---|---|---|
| No hay cookies, analítica ni terceros | sí | **sí** |
| Con qué base jurídica | sí | **sí** |
| El buzón para ejercer derechos | no | **sí** |
| **Qué registra el servidor** (IP, hora, página) | **sí, en el título** | **NO** |
| **Cuánto se conserva** | **sí, en el título** | **NO** |
| **Quién lo procesa** | no lo nombra siquiera | **NO** |

**Los tres huecos coinciden exactamente con las tres cosas que el texto contesta
mal o no contesta**, y eso no es casualidad: **un criterio que no afirma un
elemento es un elemento que nadie escribe.** «Qué registra» sobrevivió por suerte
—el texto sí enumera IP, hora y página pedida— y los otros dos no.

**Y la forma del fallo tiene nombre y conviene ponérselo, porque es la misma dos
veces:** no es que falte información, es que **hay una frase en el sitio donde
debería estar la información**, y una frase ocupa el hueco lo bastante bien como
para que nadie note que falta. «*O servidor onde está aloxado*» ocupa el sitio de
un nombre; «*consérvase o tempo que ese rexistro dura*» ocupa el sitio de un plazo
**y además es circular**: dice que se conserva mientras se conserva. Un lector que
quiera saber cuánto tiempo se guarda su IP **no puede saberlo**, y está a dos
claves de `crawler.storage`, que sí da 30 y 90 días — pero de **otra cosa**, del
raw store (ADR-009, ADR-020). **La cercanía empeora el defecto**: invita a suponer
que esos plazos también valen aquí.

### V4 — qué tiene que decir la línea, y qué tiene que afirmar el caso

**Los seis elementos son los de CA-18.2 y no cambian.** Lo que cambia es que
**cada uno pasa a tener una aserción**, porque el diagnóstico de arriba muestra
que lo que no se afirma no se escribe. La lista es **cerrada**: un elemento que no
esté aquí no entra en el texto, y ninguno de los seis puede faltar.

| # | Elemento | Hoy | Aserción exigida |
|---|---|---|---|
| 1 | No hay cookies, ni analítica, ni componentes de terceros | ✅ | `cookies` · `analitica` · `terceiros\|terceros` |
| 2 | Qué registra el servidor: IP, hora y página pedida | ✅ **sin aserción** | las tres cosas, por separado |
| 3 | **Quién lo procesa** | ❌ disfrazado | **el nombre del proveedor, literal** |
| 4 | Con qué base jurídica | ✅ | `interese lexitimo\|interes legitimo` |
| 5 | **Cuánto se conserva** | ❌ circular | **un plazo, y que no sea el propio registro** |
| 6 | El buzón para ejercer derechos | ✅ **con aserción** | el buzón, y los cuatro verbos |

Y **dos aserciones negativas nuevas**, que son las que impiden que el defecto
vuelva por donde vino:

- **Nada de circularidad en el plazo.** El texto **no** puede contener
  `o tempo que ese rexistro dura` / `el tiempo que ese registro dura` ni ninguna
  fórmula que defina la conservación por sí misma. Es la forma exacta que hay que
  cazar, porque es la que ya se escribió una vez.
- **Nada de rodeos para el encargado.** El texto **no** puede contener
  `o servidor onde está aloxado` / `el servidor donde está alojado` como sujeto de
  la frase del registro. Un servidor no procesa datos: los procesa **quien lo
  opera**, y ésa es la pregunta que el art. 13.1.e obliga a contestar.

**Y una tercera, de coherencia interna**, que sale del propio diagnóstico: el
plazo de esta línea y el de `crawler.storage` son de **cosas distintas** —el
registro técnico de acceso y el raw store— y están a dos claves. **El texto tiene
que hacer esa distinción explícita**, y un caso tiene que afirmar que la hace, o
un lector razonable supondrá que los 30/90 días también valen aquí.

**Lo que este ensanche NO es:** conveniencia. `tests/site/crawler-page.test.ts`
ya está abierto por CA-18.2, y esto es **la letra del criterio, que hoy promete
tres cosas que no comprueba** — es CA-17.2 **(iii)**, corregir lo que esta misma
decisión vuelve falso, no **(i)**. El verificador lo dice con las mismas palabras.

---

# Respuesta de `sdd-implementador` al RED — 2026-09-04, tarde

Un implementador nuevo, sin memoria de la primera vuelta, con **un solo
encargo**: **F-SPEC-018-V1**, el único hallazgo de código. V2, V3 y V4 los
llevaba `sdd-arquitecto` en paralelo y **no se han tocado**.

## V1 — CA-15.7: los dígitos tabulares. **Cerrado, y con las dos mitades**

### 1. El CSS: se deja de emitir el reset, no se reordenan dos líneas

`role()` en `src/board/view/styles.ts` emitía el **atajo `font:`**. El atajo
escribe cuatro cosas y hace una quinta que nunca nombra: **resetea a su valor
inicial todas las demás propiedades de fuente**, `font-variant-numeric` y
`font-feature-settings` entre ellas. `.score` y `.instant` son más específicas
que la regla que declara `tabular-nums`, y `td` va después, así que las dos
propiedades que sostienen **ADR-013 §3** computaban `normal` **justo en las tres
celdas que llevan cifras**.

**Se eligió la segunda de las dos salidas que el hallazgo ofrecía: quitar el
atajo, no reordenar.** El motivo, escrito en el propio `role()`:

- **Reordenar es disciplina, y la disciplina es lo que ya falló.** Emitir las
  dos propiedades después del atajo repara el defecto de hoy y deja la trampa
  armada: vuelve en cuanto alguien añada una regla en el orden equivocado, y el
  test tendría que vigilar un **orden**, no un **valor**.
- **El atajo resetea ocho propiedades más que nunca menciona.** Reordenar repara
  las dos que hoy conocemos. Quitar el atajo quita **el constructo que resetea**,
  así que ninguna regla de esta hoja puede apagar en silencio una propiedad de
  fuente que no nombra, en ningún orden.
- **Cuesta unos bytes de CSS.** `role()` decía cuatro cosas; ahora las dice en
  cuatro longhands. No cambia ni un valor: mismo peso, mismo tamaño, mismo
  interlineado, misma familia. Nada de lo que se ve en pantalla se mueve —
  **salvo que las cifras ahora sí son tabulares por el mecanismo que la hoja
  declara**.

### 2. El test: el caso 14 **mide**, y mide donde `--mono` no puede contestar

El caso 14 comprobaba que la **cadena** `font-variant-numeric:tabular-nums`
aparecía en la hoja. Aparecía. Ahora resuelve **la cascada** y **mide anchuras**.

**El instrumento: `tests/board/cascade.ts`.** Una cascada pequeña —reglas de la
hoja, especificidad del selector que encaja, orden de documento— con **la
expansión del atajo `font:` incluyendo lo que resetea**, que es exactamente la
semántica donde vive el defecto. Y un modelo de anchuras con **números medidos
en un navegador de verdad**, los que este ledger citó al levantar V1:

| cara | `111111` | `000000` |
|---|---|---|
| Geist sans (proporcional) | 42,66 px | 58,59 px |
| Geist Mono | 72,25 px | 72,25 px |

**La trampa, y cómo se cierra.** En `--mono` los dos anchos coinciden **diga lo
que diga la hoja**: medir ahí contesta que sí por el motivo equivocado, que es
precisamente lo que el verificador señaló. Por eso **el caso 14 mide en la cara
PROPORCIONAL**: en `sans`, que `111111` y `000000` midan lo mismo **sólo puede
venir de las figuras tabulares**. La familia deja de poder responder por la
declaración.

**Las tres celdas no se escriben en el test**: se leen de `src/board/handler.ts`
(`'time' → instant`, `'score' → score`, `'last' → instant`), así que si mañana
una cambia de clase el modelo cambia con ella en vez de quedarse midiendo un
elemento que ya no existe.

**Declarado dentro del caso lo que el mecanismo no alcanza (ADR-016 §6):** el
resolutor no sabe decidir selectores con combinador ni con pseudoclase. Eso no
se supone — `unresolvableSelectors()` **enumera** los que podrían alcanzar a esas
tres celdas y el caso 14 exige que la lista sea **vacía**. Y sigue siendo un caso
**estático**: no hay navegador ni se ejecuta una línea de JavaScript de página,
como CA-16.3 declara para CA-1..CA-15.

### 3. La medición, antes y después

Con la cascada del commit `238ba38`, sobre las tres celdas:

| celda | fvn | ffs | `111111` | `000000` |
|---|---|---|---|---|
| **ANTES** `time` `td.instant` | `normal` | `normal` | 42,66 px | 58,59 px |
| **ANTES** `score` `td.score` | `normal` | `normal` | 42,66 px | 58,59 px |
| **ANTES** `last` `td.instant` | `normal` | `normal` | 42,66 px | 58,59 px |
| **DESPUÉS** `time` `td.instant` | `tabular-nums` | `'tnum' 1` | 58,59 px | 58,59 px |
| **DESPUÉS** `score` `td.score` | `tabular-nums` | `'tnum' 1` | 58,59 px | 58,59 px |
| **DESPUÉS** `last` `td.instant` | `tabular-nums` | `'tnum' 1` | 58,59 px | 58,59 px |

### 4. El control positivo, con la mutación exacta

**Mutación M-V1**, en `src/board/view/styles.ts`, dentro de `role()` — devolver
el atajo:

```diff
   const lines = [
-    `font-weight:${declared.weight}`,
-    `font-size:${declared.px}px`,
-    `line-height:${declared.leading}`,
-    `font-family:var(--${declared.family})`,
+    `font:${declared.weight} ${declared.px}px/${declared.leading} var(--${declared.family})`,
   ];
```

Resultado, medido: **un solo caso rojo, y es el 14**.

```
FAIL tests/board/style.test.ts > CA-15.5 a CA-15.9 — el suelo de ADR-025, intacto
     > 14. CA-15.7 — las tres celdas con cifras MIDEN igual `111111` y `000000` (ADR-013 §3)
AssertionError: expected [ …(9) ] to deeply equal []
+ [
+   "time  → <td class=\"instant\">: 111111 mide 42.66 px y 000000 mide 58.59 px",
+   "time  → <td class=\"instant\">: font-variant-numeric computa normal",
+   "time  → <td class=\"instant\">: font-feature-settings computa normal",
+   "score → <td class=\"score\">:   111111 mide 42.66 px y 000000 mide 58.59 px",
+   "score → <td class=\"score\">:   font-variant-numeric computa normal",
+   "score → <td class=\"score\">:   font-feature-settings computa normal",
+   "last  → <td class=\"instant\">: 111111 mide 42.66 px y 000000 mide 58.59 px",
+   "last  → <td class=\"instant\">: font-variant-numeric computa normal",
+   "last  → <td class=\"instant\">: font-feature-settings computa normal",
+ ]
   Tests  1 failed | 51 passed (52)
```

Las nueve ofensas son las **tres celdas por tres comprobaciones**: la anchura
medida y los dos valores computados. Ni una sola de las otras 51 se mueve.

**Y la mutación está en la historia, no sólo aquí.** El commit `238ba38`
(`test(SPEC-018)`) es el **rojo del ciclo**: trae el caso 14 que mide con la hoja
todavía sin arreglar. `git stash push src/board/view/styles.ts` sobre `801bef0`
reproduce el mismo estado. El caso viejo —el que buscaba la cadena— **pasa en
los dos**, que es el defecto entero en una frase.

**Dos controles positivos más, dentro de la suite**, para que nadie tenga que
mutar nada a mano:

- **Caso 19**: con el atajo devuelto, `fvn` y `ffs` computan `normal` y las
  anchuras se separan (42,66 vs 58,59 px).
- **Caso 20 — la trampa, escrita**: **la misma hoja rota**, medida en `--mono`,
  da **72,25 px los dos**. Verde con la declaración muerta. Es el motivo por el
  que la familia no puede ser el mecanismo, y por el que el caso 14 mide en
  `sans`.

### 5. Lo que se tocó, y lo que no

| fichero | qué |
|---|---|
| `src/board/view/styles.ts` | `role()` emite longhands; comentario del porqué |
| `tests/board/cascade.ts` | **nuevo** — la cascada y el modelo de anchuras |
| `tests/board/style.test.ts` | caso 14 reescrito, casos 19 y 20 nuevos, caso 8 adaptado |

**El caso 8 se adaptó, no se debilitó** (CA-17.2): afirmaba que la hoja no
contiene el rol `display` *en la forma en que la hoja lo emitía*. La hoja emite
ahora longhands, así que la aserción pasa a pedir los tres números del rol
seguidos en esa forma. Mismo predicado, misma fuerza; sin el cambio la aserción
habría quedado **vacua** — buscando una cadena que ya no puede existir, que es
la misma clase de defecto que este hallazgo.

**Numeración**: los casos nuevos son **19 y 20**, al final del bloque, para no
renumerar 15–18, que este ledger ya cita por su número.

**`src/admin/view/styles.ts` NO se ha tocado.** Arrastra el mismo patrón desde
SPEC-017 y **CA-17.2 (i) lo prohíbe**. Queda como **F-SPEC-018-N2**, abajo.

### 6. Gate

`npm run gates` — `typecheck` ✅ · `lint` ✅ · `build` ✅ · `test` **4 rojos, y
ninguno es de este cambio**: los cuatro son de `tests/bot/frontier.test.ts`
(CA-10.4 de SPEC-015) y los cuatro los provoca **el mismo PNG**, `_qa/SPEC-018/`,
que este cambio no toca. Es **F-SPEC-018-N1**, abajo. **Medido**: con
`git stash -u` de los tres ficheros de arriba, esos cuatro casos siguen rojos y
con la misma ofensa.

`tests/board/style.test.ts`: **52/52 verdes** (52 porque importa `contrast` de la
suite del panel, que se registra con ella).

`npm run test:db` no se ha corrido: no se ha tocado nada de base de datos.

## Findings nuevos

### F-SPEC-018-N1 — el guardián de CA-10.4 (SPEC-015) lee **bytes de PNG**, y una captura de CA-16 lo pone rojo

**Qué pasa.** `tests/bot/frontier.test.ts` casos 28, 30, 31 y 32 recorren el
árbol versionado entero **sin filtro de extensión** —a propósito: «lee BYTES DE
FICHEROS, todos, sean código o no»— buscando `/\b\d{9,12}\b/`. La captura
`_qa/SPEC-018/ca16-6-filas-360x640-gl.png`, que **el verificador versionó como
evidencia de CA-16**, contiene en sus bytes comprimidos la secuencia
`33350004404`. Cuatro casos rojos, incluidos los dos controles positivos del
propio mecanismo.

**Es previo a este cambio y no lo causa ningún código**: llegó con `f29d2cf`, el
commit del veredicto. Medido con `git stash -u`.

**Por qué importa.** `npm run gates` **no puede pasar en esta rama**, y el gate
de calidad es lo único que hay: no hay CI. Un guardián irreversible —git no se
purga, se reescribe (ADR-009 §3)— que se dispara con un falso positivo se acaba
silenciando, y ése es el peor final posible para éste.

**Lo que NO se ha hecho aquí, y por qué.** Arreglarlo es tocar la suite de
**SPEC-015, cerrada**: o se excluye `_qa/` de `ID_SCAN_EXCLUSIONS` —lo que
**debilita** el guardián y no es ninguno de los tres casos de CA-17.2—, o el
escaneo deja de mirar binarios —lo mismo—, o las capturas dejan de versionarse.
Las tres son **decisiones**, no un arreglo, y ninguna es mía.

**Destino: `sdd-arquitecto`, en esta misma vuelta de SPEC-018** — el rojo es de
esta rama y sale de la evidencia de CA-16 de esta spec. **Disparador: ya está
disparado.**

### F-SPEC-018-N2 — el panel arrastra el mismo atajo `font:` desde SPEC-017

`src/admin/view/styles.ts` tiene su propia copia de `role()`, emitiendo el
atajo, y su propia regla `.num,.score,.instant,td,th` con `tabular-nums`
declarado antes. **El defecto es idéntico** y el panel también enseña marcadores
y horas.

**No se toca aquí: CA-17.2 (i) prohíbe ensanchar la suite de al lado por
conveniencia**, y el propio hallazgo V1 lo dice con esas palabras.

**Destino: EPIC-MEJORA. Disparador: la primera spec que toque
`src/admin/view/styles.ts` por un motivo suyo** — que es el mismo disparador que
el verificador le escribió. El arreglo está probado y cabe en un diff: `role()`
emite longhands, y el caso equivalente al 14 puede reusar `tests/board/cascade.ts`
sin copiar una línea.

### V4 — el texto, listo para escribir

Con **dos dictámenes nuevos** del 2026-09-04, copiados enteros en
`dictamenes-SPEC-018.md`: el **tercero de `sdd-legal-datos`** (contenido) y el
**tercero de `sdd-lingua`** (forma). **No escribo yo los literales de i18n**: esto
es lo que tienen que decir, y lo escribe el implementador.

**Y lo primero, porque cambia la forma del arreglo: `privacy` deja de ser una
clave.** Es dictamen vinculante de `sdd-lingua` (L4) y **es la causa raíz del
RED**: con seis afirmaciones dentro de una sola cadena, que falten dos **no se ve
ni en el diff ni en un test**. Se parte en nueve claves, una por afirmación, como
ya hace el bot con `notice*`. `CrawlerBundle` es contrato de **SPEC-018, que está
viva**: partirlo **no es enmienda de ADR-015, es su uso previsto**.

**Y son nueve, no seis, porque el dictamen legal encontró tres elementos más:**
falta el **derecho a reclamar ante la AEPD** (art. 13.2.d — *«mi C18 enumeró seis
elementos y eran siete»*), falta la **transferencia fuera de la UE** en cuanto se
nombra al proveedor (art. 13.1.f), y falta **quién responde** (art. 13.1.a). Y hay
**un tercer defecto que el verificador no enumeró**: el literal **se queda corto
en «qué se registra»** — el registro incluye también **navegador** y **referente**,
que es el mismo `Referer` en el que se apoya el punto 7 del disparador de
re-dictamen (CA-19.4).

#### Los dos datos que faltaban, cerrados

| | Valor | De dónde sale |
|---|---|---|
| **`{provider}`** | **Vercel** | **Se nombra.** Un encargado **es** «destinatario» (arts. 4.9 + 13.1.e RGPD); la perífrasis no es una categoría —hay **un solo encargado**— y sobre todo **no es auditable**, mientras que el nombre se comprueba con `curl -I` (las respuestas llevan `x-vercel-id`). **ADR-012 §1 no lo alcanza**: prohíbe nombrar **persona física**, declarar cuántas y bajo qué forma jurídica, las tres sobre **el titular**; Vercel es persona jurídica y un tercero proveedor, y `NO_PERSON` es `['alberto','fojo']` |
| **`{retention}`** | **24 horas** | Retención de *runtime logs* en **Vercel Pro = 1 día**, comprobado el 2026-09-04 en la tabla de límites de su documentación. **24 horas** y no «1 día» para no depender de un plural: `{retention} días` daría «1 días» (aviso de `sdd-lingua` L5) |

**Y por qué no vale «el plazo que fija el proveedor» a secas:** es **el mismo
defecto circular** que el verificador señala, con otra ropa. Ni es plazo (art.
13.2.a, primera mitad) ni es criterio (segunda mitad). **La forma correcta es
atribución + número.**

#### Las nueve claves

| # | Clave | **Galego** | **Castellano** |
|---|---|---|---|
| 1 | `privacyNoTrackers` | `Non hai cookies, nin analítica, nin ningún compoñente de terceiros nas páxinas deste sitio.` | `No hay cookies, ni analítica, ni ningún componente de terceros en las páginas de este sitio.` |
| 2 | `privacyLog` | `O servidor deixa un rexistro técnico de cada petición: o enderezo IP, a hora, a páxina pedida, o navegador e de onde vén a ligazón. Non se recolle ningún outro dato de quen visita.` | `El servidor deja un registro técnico de cada petición: la dirección IP, la hora, la página pedida, el navegador y de dónde viene el enlace. No se recoge ningún otro dato de quien visita.` |
| 3 | `privacyProcessor` | `O sitio está aloxado en {provider}, que é quen garda ese rexistro por conta de marcador.gal. {provider} está nos Estados Unidos, e a transferencia está amparada por unha decisión de adecuación da Comisión Europea.` | `El sitio está alojado en {provider}, que es quien guarda ese registro por cuenta de marcador.gal. {provider} está en Estados Unidos, y la transferencia está amparada por una decisión de adecuación de la Comisión Europea.` |
| 4 | `privacyBasis` | `A base xurídica é o interese lexítimo de manter o servizo en pé e seguro: sen ese rexistro non se pode saber se algo falla nin frear un abuso.` | `La base jurídica es el interés legítimo de mantener el servicio en pie y seguro: sin ese registro no se puede saber si algo falla ni frenar un abuso.` |
| 5 | `privacyRetention` | `marcador.gal non garda nada de quen visita nin exporta copia dese rexistro. Consérvao {provider} durante {retention}, que é o prazo que fixa ela.` | `marcador.gal no guarda nada de quien visita ni exporta copia de ese registro. Lo conserva {provider} durante {retention}, que es el plazo que fija ella.` |
| 6 | `privacyController` | `Do sitio responde o proxecto, baixo o paraugas de tremen.dev.` | `Del sitio responde el proyecto, bajo el paraguas de tremen.dev.` |
| 7 | `privacyRights` | `Podes pedir acceso, rectificación, supresión, limitación ou oposición: escribe a {mailbox}.` | `Puedes pedir acceso, rectificación, supresión, limitación u oposición: escribe a {mailbox}.` |
| 8 | `privacyAuthority` | `E podes reclamar ante a Axencia Española de Protección de Datos.` | `Y puedes reclamar ante la Agencia Española de Protección de Datos.` |
| 9 | `privacyNotTheArchive` | `Ese rexistro non é o arquivo do que fala «Que gardamos e canto tempo»: aquel garda o que se le doutros sitios; este, o rastro que deixa quen visita.` | `Ese registro no es el archivo del que habla «Qué guardamos y cuánto tiempo»: aquel guarda lo que se lee de otros sitios; este, el rastro que deja quien visita.` |

`privacyHeading` **no se toca**: *«Que se rexistra de quen visita»* ya nombra al
sujeto y ya es media desambiguación. Está bien elegida.

**Reglas de forma que van con los literales, todas de `sdd-lingua` y todas
vinculantes:**

- **Tuteo, sin excepción** (L1), y **el `nós` está prohibido en este bloque salvo
  en el buzón** (L2) — no por estilo: **sería falso** —el registro no lo hace
  marcador.gal— **y fundiría este bloque con `crawler.storage`**, que empieza
  literalmente con «Gardamos…» y habla de otra cosa y de otro plazo.
- ***«Non hai cookies»* se queda impersonal** (L3): afirma **más** que «non usamos
  cookies» y evita meter un `nós` donde el actor no somos nosotros.
- **El proveedor es el sujeto de su frase** (L6). Prohibidas por implicatura *«o
  meu provedor»*, *«a empresa que contratei»* —ya RED por la barrera de 1.ª
  persona— y **prohibidas escala, precio y geografía** (*«un provedor pequeno»*,
  *«unha conta gratuíta»*), que **filtran cuántas personas hay detrás**: ésa es la
  puerta trasera de ADR-012 §1, no el nombre de la empresa.
- **Marcadores en inglés** (L5): `{provider}` y `{retention}`, como `{mailbox}`.
- **Trampas de norma medidas**: `prazo` (no *plazo*, y **ojo a la hipercorrección
  inversa**, que es correcto aunque coincida con el portugués), `datos` (nunca
  *dados*), `provedor` con una sola `e`, `aloxado` (no *hospedaxe*), `enderezo`
  (no *dirección*), `rexistro` y `lexítimo` con `x`, `consérvase`/`elimínase` con
  enclisis y tilde pero `non se recolle` con proclisis, **`fai falta`** —que la
  regla «hai, nunca fai» de mi propio dictamen anterior **no** alcanza—, y en
  castellano **`u oposición`**, no *o oposición*.
- **`por conta de {provider}` sí; `por conta propia` es RED mecánico** —está en
  `NO_HEADCOUNT`—. Son dos palabras de distancia.

#### El CA corregido: qué tiene que afirmar el caso 12 quater

Nueve aserciones positivas, tres negativas de control y una barrera léxica. **Es
la letra del criterio, que hoy promete tres cosas que no comprueba** — CA-17.2
**(iii)**, no (i).

| Elemento | Aserción |
|---|---|
| E1 | `cookies` · `analitica` · `terceiros\|terceros` *(ya existe)* |
| E2 | IP, hora y página *(hoy sin aserción)* **más `navegador`** y **`ligazon\|enlace`** |
| **E3** | **`toContain('vercel')`, en las dos lenguas** |
| E4 | `interese lexitimo\|interes legitimo` *(ya existe)* **más** `manter o servizo\|mantener el servicio` |
| **E5** | **`24 horas`** **y** una forma de atribución (`fixa ela\|fija ella`) **y** que el proyecto no guarda copia |
| E6 | el buzón *(ya existe)* **más las cinco formas de derecho**, `limitación` incluida |
| **E7** | `proteccion de datos` |
| **E8** | `estados unidos` **y** `adecuacion` |
| **P6** | `tremen.dev` |

**Tres negativas, que son las que impiden que el defecto vuelva por donde vino:**

1. **Nada de circularidad**: el texto **no** contiene `o tempo que ese rexistro
   dura` / `el tiempo que ese registro dura`, ni ninguna fórmula que defina la
   conservación por sí misma. **Control positivo: reponer esa frase pone rojo un
   caso nombrado.**
2. **Nada de rodeos para el encargado**: **no** contiene `o servidor onde está
   aloxado` / `el servidor donde está alojado` como sujeto del registro. Un
   servidor no procesa datos: los procesa **quien lo opera**.
3. **Ninguna persona física** *(ya existe)*, y **ninguna llamada a la acción**
   —lista cerrada: `patrocina`, `publicidade`, `doar`, `subscri`…—, que es lo que
   mantiene el art. 10 LSSI fuera.

**Y la barrera léxica de L10, con su excepción declarada, que el propio dictamen
no vio:** *arquivo*/*archivo* no aparece en ninguna clave `privacy*` y
*rexistro*/*registro* no aparece en `storage`. **Excepción por identidad de
clave: `privacyNotTheArchive`**, cuyo trabajo entero es nombrar las dos cosas para
distinguirlas. Sin esa excepción la barrera pondría roja la clave que existe para
arreglar el problema.

**Declarado dentro del criterio (ADR-016 §6):** todas estas aserciones prueban que
**unas palabras están escritas, no que sean ciertas**. Que el plazo sea de verdad
de 24 horas, que el plan siga siendo Pro, que no haya *log drain* y que no se
añada analítica **no lo alcanza ningún test**. Es **(c)**, y va al calendario de
compromisos.

#### Lo que va al calendario de compromisos, no a un test

1. **Confirmar antes del 08 que el plan es Pro y que no hay Observability Plus ni
   *log drain***. Si lo hubiera, **el plazo publicado nacería falso el primer
   día**, que es el mismo vector del §0 de la propia spec.
2. **El cambio de plataforma de alojamiento obliga a corregir la línea en el mismo
   cambio.** Ningún test lo verá.
3. **Corrección de una fila que escribí ayer**: el punto de tráfico del disparador
   decía «al día siguiente de cada jornada», y **los logs de Vercel Pro duran un
   día**, así que llega tarde. Pasa a **«el mismo día, al cerrar la jornada»**. Y
   **no se contrata Observability Plus**: multiplicaría por treinta la retención de
   datos personales para vigilar un umbral —peor minimización, art. 5.1.c— y
   **cambiaría el plazo publicado a 30 días justo al lado de los 30 del raw
   store**.

#### Dos cosas que declaro y no resuelvo

- **P6 no cierra del todo el art. 13.1.a.** «Del sitio responde el proyecto, bajo
  el paraguas de tremen.dev» da contacto pero **no da identidad del responsable**,
  y ADR-012 §1 impide darla aquí. **Es un residual que el gate firma con los ojos
  abiertos**, en la misma forma en que ADR-012 firmó el suyo. La salida limpia es
  **PR3** y va al informe del gate: publicar la identificación **en `tremen.dev`**,
  que es otro sitio, cierra el art. 13.1.a **sin tocar un literal de este
  repositorio** — y **es el disparador que ADR-012 escribió él mismo**, «el día que
  `/sdd-legal-datos` lo pida». **Hoy lo pide. No bloquea el 08.**
- **Tensión dentro del propio dictamen legal, que resuelvo:** su **PR5** pide
  «cuatro oraciones, no una página», y sus **P5, P6 y P7** añaden tres deberes
  nuevos. **Gana el deber, y se paga en brevedad por frase**: nueve claves de una
  oración corta son dos párrafos, no una página. Si al implementarlo crece más, se
  ha implementado otra cosa.

## F-SPEC-018-N1 — el guardián de SPEC-015 y las capturas de CA-16. **Resuelto**

**Bloqueaba el GREEN de toda la rama**, no sólo de esta spec. Cuatro casos de
`tests/bot/frontier.test.ts` en rojo porque una de las diez capturas que **CA-16
obliga a versionar** lleva, dentro de su flujo comprimido, una tirada de once
dígitos que el detector de `telegram_user_id` lee como un identificador.

**Decisión: se excluyen `*.png` y `*.woff2` del escaneo, con su motivo, y es
QUINTA enmienda de ADR-015 — sobre SPEC-015.** Escrita en su ledger con los cinco
puntos. **CA-18.4 vuelve a moverse: de cuatro enmiendas a cinco.**

**Y el argumento no es el que traía el encargo, así que lo digo con cuidado.** La
propuesta era «excluir binarios no debilita el guardián: corrige un error de
alcance, el mecanismo nunca quiso mirar dentro de un PNG». **La primera mitad es
correcta; la segunda no**: la cabecera de `telegramIdOffences` **declaraba lo
contrario, a propósito** — *«Un PNG o cualquier otro binario versionado se juzga
con la misma regla que un fichero de texto»*. Sí quería. Lo que pasa es que **la
premisa de esa frase era falsa en la mitad que importa**: «un identificador dentro
de un binario está igual de versionado» es cierto, **«y por tanto este mecanismo
lo encuentra» no**. Dentro de DEFLATE no hay nada que encontrar — lo que se ve en
una captura son **píxeles**, no dígitos ASCII. **Así que no se pierde ninguna
detección que el mecanismo tuviera**, y esa es la razón por la que la exclusión es
legítima: no porque nadie quisiera mirar, sino porque **mirar ahí no informa**.

**Medido, porque la pregunta de si era suerte tiene respuesta** (2026-09-04, sobre
los 18 PNG y 5 WOFF2 versionados):

- la tirada está en el **offset 3033, dentro del primer IDAT**, y el fichero **no
  tiene ni un chunk de texto**;
- **un segundo PNG** —`ca16-5-360x640-es.png`— lleva una tirada de **exactamente
  nueve dígitos** que sólo escapa porque el byte siguiente es una letra y `\b` no
  casa;
- el resto se queda en 5–8. **La distribución tiene masa en el umbral**, así que
  que `_qa/SPEC-004/` y `_qa/SPEC-017/` nunca hubieran disparado era **suerte con
  ocho ficheros**, exactamente como sospechaba el encargo.

**Lo que queda con menos red, en el ledger de SPEC-015 §3 y aquí en corto:** un id
**visible** en una captura no lo caza este mecanismo —y no lo cazaba antes—; lo
cubre **una persona** mirando lo que archiva. `*.woff2` es **preventiva y hoy no
caza nada**. Y un contenedor comprimido de otra extensión —`.zip`, `.pdf`— **no
está excluido y produciría el mismo falso positivo**, con disparador escrito.

**Y una lección que costó una vuelta:** la primera redacción del motivo **citaba
el número** y el guardián **se puso rojo sobre su propio fichero fuente**. Es
**F-SPEC-015-19 apareciendo por segunda vez** —«componer la carga útil en vez de
escribirla»—. El motivo ahora **describe** la tirada sin escribirla.

**`npm run gates`: 147 ficheros, 1712 casos, 0 errores de tipo.**

## F-SPEC-018-N2 — inventariado

El panel arrastra desde SPEC-017 el mismo atajo `font:` que V1 corrigió en el
marcador. El implementador **no lo tocó, y por la regla correcta**: es CA-17.2
**(i)**, ensanchar por conveniencia la suite de una spec cerrada. **Destino:
EPIC-MEJORA; disparador: la primera spec que toque `src/admin/view/styles.ts` por
un motivo suyo.** Con la nota que él añade y que vale su peso: **el arreglo puede
reusar `tests/board/cascade.ts` sin copiar una línea**, así que llega con su
herramienta ya escrita.

## F-SPEC-018-N3 — hallazgo colateral de `sdd-lingua`: el bot promete una página que no existe

**No es de esta línea y no lo arreglo aquí, pero no puede quedarse sin destino,
porque es una afirmación falsa publicada.** `bot.noticeLink` sirve hoy —comprobado
el 2026-09-04— *«Tes a información completa en `https://marcador.gal/privacidade`»*
(`gl.ts:80`) y su gemela castellana (`es.ts:73`). **`/privacidade` no existe**:
`src/site/routes.ts` declara tres rutas —`/proxecto`, `/robot`, `/marcador`— y no
hay directorio bajo `src/app/(gl)/`.

Es **la misma clase de defecto que el §0 de esta spec** —un literal servido y
verificado GREEN que afirma algo que no es cierto— **con el agravante de que aquí
lo afirma el aviso de protección de datos del bot**, que es donde peor sienta. Y
es anterior a SPEC-018: viene de SPEC-015.

**Destino: no es EPIC-MEJORA.** El propio inventario de esa épica dice que «si un
finding hace falsa una afirmación publicada, no es deuda, es un fallo, y va a
`EPIC-FIX` o a la spec que lo causó». **Va a `EPIC-FIX`, y `EPIC-FIX` no existe
todavía como directorio** —crearla es de `sdd-producto`, no mía—. **Disparador:
inmediato**, y en todo caso **antes del 2026-09-08**, porque ese día el proyecto
publica y esta frase la reciben los corresponsales.

**Las dos salidas, para que quien la coja no empiece de cero:** o **se crea
`/privacidade`** —y entonces manda la regla L12 de `sdd-lingua`: **`/robot` la
enlaza y no la duplica**, porque dos textos de retención en dos páginas es el
problema de la desambiguación multiplicado por dos—, o **`noticeLink` apunta a
`/robot`**, que es donde la línea de privacidad vive de verdad por la **R2** del
segundo dictamen legal («un solo lugar honesto, una superficie menos»). **La
segunda es más barata y más coherente con lo ya decidido**, pero es decisión de
producto, no mía.

---

# Respuesta de `sdd-implementador` al RED — 2026-09-04, noche

> Un implementador nuevo, sin memoria de las vueltas anteriores, con **un solo
> encargo: F-SPEC-018-V4**, el único hallazgo que llega al público el 08. V1 lo
> cerró otro implementador, V2 y V3 el arquitecto y V5 el orquestador; **no se
> ha tocado nada de ellos**. La spec pasó a `en-progreso` sólo para poder tocar
> código —el gate del estándar lo exige— y **vuelve a `en-revision`**, que es
> donde el verificador la dejó y desde donde él la mueve.

## V4 — la línea de privacidad. **Cerrado, y con las tres mitades**

El hallazgo tenía dos: el texto y el caso. La resolución del arquitecto añadió
la tercera, que es la que explica por qué esto pasó: **`privacy` era una clave
con seis afirmaciones dentro**, y dentro de una sola cadena **una afirmación que
falta no se ve ni en el diff ni en un test**.

### 1. Las nueve claves, con su literal

Tomadas del ledger tal como el arquitecto las escribió, sin cambiar una palabra.
**No hubo que consultar a `sdd-lingua`**: se leyeron las nueve en las dos lenguas
contra las trampas de norma que el dictamen enumera —`prazo`, `datos`, `provedor`,
`aloxado`, `enderezo`, `rexistro` y `lexítimo` con `x`, enclisis en `consérvao`
frente a proclisis en `non se recolle`, y `u oposición` en castellano— y **no
apareció ningún problema de lengua ni de sentido**. `privacyHeading` no se toca.

| # | Clave | Galego | Castellano |
|---|---|---|---|
| 1 | `privacyNoTrackers` | Non hai cookies, nin analítica, nin ningún compoñente de terceiros nas páxinas deste sitio. | No hay cookies, ni analítica, ni ningún componente de terceros en las páginas de este sitio. |
| 2 | `privacyLog` | O servidor deixa un rexistro técnico de cada petición: o enderezo IP, a hora, a páxina pedida, o navegador e de onde vén a ligazón. Non se recolle ningún outro dato de quen visita. | El servidor deja un registro técnico de cada petición: la dirección IP, la hora, la página pedida, el navegador y de dónde viene el enlace. No se recoge ningún otro dato de quien visita. |
| 3 | `privacyProcessor` | O sitio está aloxado en {provider}, que é quen garda ese rexistro por conta de marcador.gal. {provider} está nos Estados Unidos, e a transferencia está amparada por unha decisión de adecuación da Comisión Europea. | El sitio está alojado en {provider}, que es quien guarda ese registro por cuenta de marcador.gal. {provider} está en Estados Unidos, y la transferencia está amparada por una decisión de adecuación de la Comisión Europea. |
| 4 | `privacyBasis` | A base xurídica é o interese lexítimo de manter o servizo en pé e seguro: sen ese rexistro non se pode saber se algo falla nin frear un abuso. | La base jurídica es el interés legítimo de mantener el servicio en pie y seguro: sin ese registro no se puede saber si algo falla ni frenar un abuso. |
| 5 | `privacyRetention` | marcador.gal non garda nada de quen visita nin exporta copia dese rexistro. Consérvao {provider} durante {retention}, que é o prazo que fixa ela. | marcador.gal no guarda nada de quien visita ni exporta copia de ese registro. Lo conserva {provider} durante {retention}, que es el plazo que fija ella. |
| 6 | `privacyController` | Do sitio responde o proxecto, baixo o paraugas de tremen.dev. | Del sitio responde el proyecto, bajo el paraguas de tremen.dev. |
| 7 | `privacyRights` | Podes pedir acceso, rectificación, supresión, limitación ou oposición: escribe a {mailbox}. | Puedes pedir acceso, rectificación, supresión, limitación u oposición: escribe a {mailbox}. |
| 8 | `privacyAuthority` | E podes reclamar ante a Axencia Española de Protección de Datos. | Y puedes reclamar ante la Agencia Española de Protección de Datos. |
| 9 | `privacyNotTheArchive` | Ese rexistro non é o arquivo do que fala «Que gardamos e canto tempo»: aquel garda o que se le doutros sitios; este, o rastro que deixa quen visita. | Ese registro no es el archivo del que habla «Qué guardamos y cuánto tiempo»: aquel guarda lo que se lee de otros sitios; este, el rastro que deja quien visita. |

**Dónde viven los dos datos nuevos: `src/site/hosting.ts`, fichero nuevo.**
`HOSTING_PROVIDER` y `ACCESS_LOG_RETENTION`, más `withHosting()`, que rellena
los dos huecos. La forma es la de `site/contact.ts` y la razón es la misma: **un
bundle por lengua serían ya dos copias de un dato que va a moverse**, y aquí el
dato es además de otro —de la plataforma, no de este repositorio—. `site/contact.ts`
no vale como domicilio: su caso 4 exige que no exporte nada más que el buzón.
La cabecera del fichero lleva escrito el contrato de migración, que es lo único
que protege a esas dos líneas de envejecer en silencio.

**La página sirve nueve `<p>`, uno por clave, en el orden de la tabla.** Sólo
dos pasan por interpolación de proveedor (`privacyProcessor`, `privacyRetention`)
y uno por la del buzón (`privacyRights`); `withHosting` devuelve **texto plano y
no un nodo**, porque ninguno de los dos datos es un enlace y esta página no
manda a nadie a otro sitio a leer lo que ya dice.

### 2. El caso: nueve aserciones positivas, tres negativas y una barrera léxica

El caso 12 quater se llamaba «qué registra el servidor, con qué base, **cuánto**,
y que no hay cookies ni analítica» y **no tenía ni una aserción sobre «cuánto» ni
sobre quién procesa**. Ahora son cinco casos, y ninguno de los nueve elementos
puede faltar sin que uno se ponga rojo.

| Caso | Qué afirma |
|---|---|
| **12 quater** | Los nueve elementos sobre el texto de las nueve claves ya interpolado. **E1** `cookies` · `analitica` · `terceiros\|terceros`. **E2** `enderezo ip\|direccion ip`, `, a hora,\|, la hora,`, `paxina pedida\|pagina pedida`, **`navegador`** y **`ligazon\|enlace`**. **E3** el nombre del encargado, en las dos lenguas. **E4** `interese lexitimo\|interes legitimo` **más** `manter o servizo\|mantener el servicio`. **E5** el plazo, `fixa ela\|fija ella`, `non garda nada\|no guarda nada` y `exporta copia`. **E6** el buzón y las **cinco** formas de derecho, `limitacion` incluida. **E7** `proteccion de datos`. **E8** `estados unidos` y `adecuacion`. **P6** `tremen.dev` |
| **12 quinquies** | Las nueve claves existen en las dos lenguas y **se sirven enteras** en las dos rutas; y los dos datos nuevos **se interpolan en vez de escribirse** —ningún valor del bundle los contiene y el HTML servido sí— |
| **12 sexies** | Las tres negativas: **nada circular** (la fórmula exacta que causó esto), **nadie disfrazado de servidor** (`o servidor onde está aloxado` / su gemela), y **ninguna persona física** más **ninguna llamada a la acción** (`patrocina`, `publicidade`, `publicidad`, `doar`, `subscri`) |
| **12 septies** | **CONTROL POSITIVO**: las dos fórmulas retiradas —copiadas del texto que el sitio servía hasta hoy— **muerden** sobre una cadena sintética en las dos lenguas, y los cinco términos de llamada a la acción también. Sin él, dos expresiones regulares mal escritas darían verde el caso anterior sin comprobar nada |
| **12 octies** | **La barrera léxica de L10 con su excepción declarada**: `arquivo`/`archivo` no aparece en ninguna clave `privacy*` **salvo `privacyNotTheArchive`**, y `rexistro`/`registro` no aparece en `storage`. **La excepción no es un agujero**: el mismo caso exige que la clave exenta use **las dos** palabras y que **cite el otro bloque por el texto de su cabecera**, no por su posición |

**Declarado dentro del caso (ADR-016 §6):** todas estas aserciones prueban que
**unas palabras están escritas, no que sean ciertas**. Que el plazo publicado sea
el real depende del plan de alojamiento y de que nadie añada un desvío de
registros, y eso pasa **fuera de este repositorio**. Va al calendario de
compromisos, y esa fila **existe** — ver §4.

### 3. Las mutaciones: seis, y las seis muerden

Ejercidas sobre el árbol real y **revertidas todas** (`git status` limpio salvo el
frontmatter de estado).

| # | Mutación | Casos rojos |
|---|---|---|
| **M-V4a** | `privacyRetention` (gl) vuelve a «Consérvase o tempo que ese rexistro dura» | **12 quater** (falta el plazo), **12 quinquies** (el plazo no llega al HTML) y **12 sexies** (la fórmula circular) — **tres** |
| **M-V4b** | Quitar `o navegador e de onde vén a ligazón` de `privacyLog` (gl) | **12 quater**: `expected … to contain 'navegador'` |
| **M-V4c** | `privacyProcessor` (es) vuelve al rodeo «el servidor donde está alojado» y pierde la transferencia | **12 quater** (`estados unidos`) y **12 sexies** (el rodeo) |
| **M-V4d** | `privacyAuthority` (gl) pasa a «ante a autoridade que corresponda» | **12 quater**: `expected … to contain 'proteccion de datos'` |
| **M-V4e** | Meter `arquivo` en `privacyBasis` (gl) | **12 octies**: `expected [ 'gl.privacyBasis' ] to deeply equal []` |
| **M-V4f** | La clave existe pero **la página deja de servirla**: se borra el `<p>` de `privacyRetention` | **12 quinquies**: `expected [ 'gl.privacyRetention', …(1) ] to deeply equal []` |

**M-V4a es la mutación del hallazgo**: repone exactamente lo que el sitio servía
esta mañana. **Con el caso viejo, las seis habrían pasado en verde menos ninguna**
— el caso viejo afirmaba `cookies`, `analitica`, `terceiros`, `interese lexitimo`
y el buzón, y **las seis mutaciones dejan esas cinco cosas intactas**. Ése es el
hallazgo entero en una frase.

**Y el rojo está en la historia, no sólo aquí**: el commit `477579c`
(`test(SPEC-018)`) trae los cinco casos contra unas claves que todavía no
existen — cuatro casos rojos, `Tests 4 failed | 25 passed`.

### 4. Lo que publicar el plazo vuelve falso, corregido en el mismo cambio

**Una fila del calendario de compromisos escrita ayer dejó de ser cierta hoy**, y
la causa es el dato que esta línea publica: decía **«al día siguiente de cada
jornada declarada, mirar el punto de tráfico»**, y el registro de acceso dura lo
que `/robot` dice que dura, así que **al día siguiente ya no está**. Mirarlo tarde
no es mirarlo mal: es no poder mirarlo. Pasa a **«El mismo día, al cerrar cada
jornada declarada»**. Es la regla de CA-18 —lo que publicar vuelve falso se
corrige en el mismo cambio— aplicada al documento operativo en vez de a un
literal.

**Y entra la fila que el dictamen dejó escrita**: confirmar antes del despliegue
que el plan de alojamiento sigue siendo el que fija el plazo y que **no hay ni
desvío de registros ni observabilidad ampliada**; y que **la ampliada no se
contrata**, porque multiplicaría por treinta la retención de datos personales
para vigilar un umbral —peor minimización, art. 5.1.c— y pondría el plazo
publicado en 30 días **justo al lado de los 30 del archivo**, que es la confusión
que `privacyNotTheArchive` existe para deshacer.

Los dos números de los casos **7** y **8** de `tests/board/runbook.test.ts`
crecen con ella —la fila del tráfico y el censo de filas y su párrafo de cierre—
y **crecen ahí y no en silencio**: son el dato de un guardián cuyo dato cambió, y
**ningún predicado se relaja**. **Caso 10 nuevo** para la fila nueva. Es la suite
de **esta** spec, que está viva; no hay ninguna spec cerrada tocada por esto.

### 5. Lo que se tocó, y lo que no

| fichero | qué |
|---|---|
| `src/i18n/crawler-bundle.ts` | `privacy` → nueve claves, con el porqué de la forma escrito en el contrato |
| `src/i18n/gl.ts` · `src/i18n/es.ts` | los nueve literales, con paridad |
| `src/site/hosting.ts` | **nuevo** — los dos datos, `withHosting()` y el contrato de migración |
| `src/site/crawler-page.tsx` | nueve `<p>` en el orden de la tabla |
| `tests/site/crawler-page.test.ts` | 12 quater reescrito; 12 quinquies/sexies/septies/octies nuevos; `fill()` en el ayudante |
| `docs/procedimientos/calendario-de-compromisos.md` | la fila del tráfico corregida, la fila del plan nueva, la cuenta del cierre |
| `tests/board/runbook.test.ts` | casos 7 y 8 con su dato nuevo, caso 10 nuevo |

**NO se ha tocado nada de V1, V2, V3 ni V5**, ni `src/board/view/styles.ts`, ni
`tests/board/style.test.ts`, ni `tests/board/cascade.ts`, ni
`tests/bot/frontier.test.ts`, ni ninguna de las cinco enmiendas de ADR-015.
**Y `https://marcador.gal/privacidade` sigue sin arreglarse a propósito**: es
F-SPEC-018-N3, es de SPEC-015 y va a `EPIC-FIX`.

**Numeración**: los casos nuevos van al final de la familia `12 …` con nombres
latinos, para no renumerar 13–22, que este ledger cita por su número.

### 6. Gate

**`npm run gates` — VERDE**, corrido entero al terminar:

```
Route (app)
┌ ○ /_not-found        ├ ƒ /es/marcador
├ ƒ /admin             ├ ○ /es/proxecto
├ ƒ /api/board         ├ ○ /es/robot
├ ƒ /api/cron/ingest   ├ ƒ /marcador
├ ƒ /api/telegram/webhook  ├ ○ /proxecto
├ ƒ /es/admin          ├ ○ /robot
                       └ ○ /robots.txt

 Test Files  147 passed (147)
      Tests  1717 passed (1717)
Type Errors  no errors
```

Eran **1712** al empezar: **+5 casos**, los cuatro de `crawler-page.test.ts` y el
10 de `runbook.test.ts`. **`npm run test:db` no se ha corrido: no se ha tocado
nada de base de datos.**

## Findings nuevos

### F-SPEC-018-N4 — el plazo publicado depende de un plan que nadie de este repositorio puede ver

**No es un defecto: es el residuo de este arreglo, y hay que decirlo con el mismo
cuidado con el que se dice el plazo.** La línea publica un número que es una
propiedad **de la plataforma**, no del programa, y **ninguna aserción puede
comprobarlo**: las nueve prueban que las palabras están escritas. Si el plan
cambia, si se contrata observabilidad ampliada o si alguien añade un desvío de
registros, **el plazo publicado se vuelve falso sin que nada se ponga rojo** — y
lo hace en la página que un tercero audita.

Mitigado con lo único que se puede: la fila del calendario (§4), el contrato
escrito en la cabecera de `src/site/hosting.ts`, y que el dato viva en **una sola
línea** en vez de en dos literales. **Destino: el calendario de compromisos, con
disparador `antes del despliegue del 2026-09-08` y permanente después.
Reaparecerá el día que el proyecto tenga CI, que es cuando se podrá al menos
comprobar la cabecera del proveedor.**

### F-SPEC-018-N5 — `privacyController` da contacto, no identidad, y eso es de gate

**Ya está declarado por el arquitecto como residual (P6) y no lo resuelvo: lo
repito aquí porque ahora está publicado.** «Do sitio responde o proxecto, baixo o
paraugas de tremen.dev» **no cierra del todo el art. 13.1.a** —da a quién
escribir, no quién responde— y **ADR-012 §1 impide darlo en este repositorio**. La
salida limpia no toca ningún literal de aquí: **publicar la identificación en
`tremen.dev`**, que es otro sitio. **Destino: el gate; disparador: ya está
disparado —el rol legal lo pide hoy— y no bloquea el 08.**
