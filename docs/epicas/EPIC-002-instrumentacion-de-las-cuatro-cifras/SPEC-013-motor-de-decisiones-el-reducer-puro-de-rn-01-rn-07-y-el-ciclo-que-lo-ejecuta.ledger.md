---
id: SPEC-013
tipo: ledger
epica: EPIC-002
---
# Ledger — SPEC-013 Motor de decisiones: el reducer puro de RN-01..RN-07 y el ciclo que lo ejecuta

## Resumen
- Fase: aprobada y **lista para implementar**. SPEC-013 y ADR-021 firmadas por
  Alberto Fojo el 2026-09-02; las cuatro lecturas de ADR-021 §8 ya están en
  `reglas.md`; F-SPEC-013-1 **cerrado** por el gate ese mismo día (salida b) y
  CA-6 reescrito en consecuencia. No queda ninguna decisión pendiente.
- Rama: `ft/SPEC-013-motor-de-decisiones`

## Matriz de criterios de aceptación
<!-- Escritores: sdd-implementador rellena Implementado y Test; sdd-verificador rellena Verif. y Estado. Nunca al revés. -->
<!-- Estados por CA: ✅ cerrado · ⚠️ parcial/con salvedad · 🚧 en curso · ❌ sin empezar · n-a -->
<!-- Un CA está ✅ solo cuando Implementado + Test + Verif. aplicables están en verde. Una salvedad se marca ⚠️, nunca ✅. -->
| CA | Implementado (fichero) | Test (fichero/caso) | Verif. | Estado |
|---|---|---|---|---|
| CA-1 — pesos y roles de RN-01, fallo cerrado | | | | ❌ |
| CA-2 — RN-02/RN-03 en las cinco ramas | | | | ❌ |
| CA-3 — independencia declarada, lista vacía | | | | ❌ |
| CA-4 — precedencia del operador (RN-01) | | | | ❌ |
| CA-5 — RN-04: monotonía y retención | | | | ❌ |
| CA-6 — RN-05: conflicto, alerta y gracia | | | | ❌ |
| CA-7 — RN-06: transiciones y tabla cerrada | | | | ❌ |
| CA-8 — RN-07: silencio publicado y alertado | | | | ❌ |
| CA-9 — RN-12: la regla decisiva | | | | ❌ |
| CA-10 — los cuatro cualificadores derivados | | | | ❌ |
| CA-11 — aplicador, versión arbitrada, `alerts` | | | | ❌ |
| CA-12 — el ciclo dentro del tick y la ruta | | | | ❌ |
| CA-13 — RN-08: la frontera y su residuo | | | | ❌ |
| CA-14 — replay determinista | | | | ❌ |
| CA-15 — los tres gates y las suites enteras | | | | ❌ |

## Veredicto del verificador
<!-- GREEN/RED + fecha + resumen. Lo escribe SOLO sdd-verificador. -->

## Evidencia visual
<!-- Tabla CA → captura en _qa/SPEC-013/. Informe HTML opcional: _qa/SPEC-013/informe.html -->

Previsión: **no aplica**. La spec no tiene superficie de UI. La única HTTP es la
ruta del cron que ya existe (SPEC-012 CA-7), cuyos cuatro casos deben seguir en
verde sin tocar una aserción (CA-12.2).

## Salvedades / follow-ups
<!-- IDs F-SPEC-013-1, F-SPEC-013-2… con destino (spec futura o EPIC-MEJORA). -->

- **F-SPEC-013-1 — CERRADO por el gate el 2026-09-02 (Alberto Fojo), salida
  (b).** La gracia de RN-05 retenía la publicación, y eso costaba hasta 3 min de
  latencia contra un presupuesto de 120 s. Levantado por `sdd-arquitecto` el
  2026-09-02, **después de la firma**, al trasladar las lecturas de ADR-021 §8 a
  `reglas.md`.

  **Resolución.** `CONFLICT_GRACE` gobierna **solo la alerta**. Durante la
  gracia se publica la observación más reciente marcada *provisional* (RN-03);
  el plazo decide únicamente si se abre alerta, que es lo único que ADR-021 §8.2
  dice que gobierna. **ADR-021 y `reglas.md` no se tocan** y quedan como están:
  la elección era de la spec sobre lo que el ADR dejó abierto.

  **Qué se corrigió en el cuerpo de la spec** (`aprobada`, no `hecho`, así que
  se corrige directamente): **CA-6.1** pasa a decir que durante la gracia se
  publica y `held` es `null`; **CA-6.2** recoge lo que antes decían 6.1 y 6.2
  juntos —pasado el plazo sí es conflicto: alerta, ninguna `Decision`, la
  vigente se mantiene, `held` nombra `RN-05`— con sus dos casos de borde
  afirmando ahora cosas distintas a cada lado; **CA-6.3** es nuevo y fija que el
  plazo gobierna solo la alerta y con qué regla se atribuye lo publicado durante
  ella; **CA-6.4** es nuevo y cierra la oscilación (la monotonía de RN-04 sigue
  aplicando durante la gracia, así que dos fuentes alternándose no hacen
  retroceder el marcador); **CA-6.5** es el antiguo 6.3, y su valor pasa a ser
  que **no hubo alerta** —ya no hay nada retenido que liberar—. Los antiguos
  6.4, 6.5 y 6.6 corren a **6.6, 6.7 y 6.8** sin cambiar de texto.

  **De rebote, dos referencias cruzadas:** **CA-9.1** («RN-05 nunca aparece en
  `rule`») ahora cita CA-6.2 en vez de CA-6.1 y dice explícitamente con qué
  regla se registra lo publicado durante la gracia —el orden normal de RN-12,
  nunca `RN-05`—; y la nota 3 del gate apunta a CA-6.8. La línea de RN-05 en
  *Entidades y reglas afectadas* se precisa igual. **CA-2 no se movió**: su
  «el motor no emite una `Decision` por tick» sigue en pie, porque una entrada
  `time` no trae observación nueva y la tupla publicada no cambia.

  **Lo que no cambió y conviene saber:** el diagnóstico sigue siendo el mismo
  —hoy es **latente**, con una sola fuente automática capturable (ADR-008 §1) no
  puede haber discrepancia entre dos— pero la letra se arregló **antes** de
  implementarla, que era el punto.

  **Y no se escribió bajo `## Enmienda —`, a propósito.** ADR-015 §2 reserva ese
  encabezado para un CA de una spec **cerrada** que ha dejado de poder ser
  cierto, y lo hace índice (`grep -rn "^## Enmienda —" docs/epicas/`). Aquí la
  spec está `aprobada` y no `hecho`, no hay veredicto que anotar y el cuerpo se
  corrige directamente. Comprobado tras el cambio: el `grep` sigue devolviendo
  diez enmiendas reales y ninguna falsa.

  <details><summary>Diagnóstico original, tal como se levantó</summary>

  **Qué dice la spec.** CA-6.1 y CA-6.2 son explícitos: ante dos fuentes ≥ 0.7
  que discrepan y ninguna oficial, «no se emite ninguna `Decision`», y «antes de
  ese plazo no hay alerta **y tampoco hay `Decision`**». La publicación queda
  retenida durante toda la ventana de gracia, y CA-6.3 solo publica cuando la
  rezagada se pone al día.

  **Qué se ve al escribirlo en `reglas.md`.** ADR-021 §8.2 —firmado— define
  cuándo una discrepancia **es** un conflicto: cuando persiste pasada la gracia.
  De ahí se sigue que **antes** de la gracia no es un conflicto, y si no lo es,
  RN-05 no ha disparado y quien debería decidir es RN-03: *mejor provisional a
  tiempo que confirmado tarde*. La spec eligió lo contrario —retener— y no es una
  contradicción con el ADR, que no dice qué pasa durante la gracia; es una
  **elección de la spec sobre lo que el ADR dejó abierto**, tomada sin ponerla al
  lado de la primera cifra de la épica.

  **Por qué importa.** Con dos fuentes, cada gol produce una discrepancia
  transitoria mientras la segunda no lo ve. Reteniendo, cada gol se publicaría
  con hasta `CONFLICT_GRACE` = **3 min** de retraso; el umbral de la métrica de
  latencia de EPIC-002 es **< 120 s**. La regla que existe para no inflar la
  **tercera** cifra desactivaría la **primera**.

  **Por qué no es urgente y aun así hay que decidirlo antes de implementar.** Hoy
  es **latente**, como lo fue la infracción de SPEC-009: solo hay una fuente
  automática capturable (ADR-008 §1), así que no puede haber discrepancia entre
  dos. Deja de serlo el día que vuelva `futgal.es` o entre una segunda fuente —
  que es exactamente el día en el que menos ganas hay de descubrirlo. Y CA-6 se
  implementa **ahora**: escribir la letra actual y cambiarla después cuesta el
  doble.

  **Las dos salidas, y la recomendación.** (a) Dejar CA-6 como está y aceptar el
  coste el día que haya dos fuentes. (b) Publicar durante la gracia lo que dice
  la observación más reciente, marcado *provisional* (RN-03), y que la gracia
  gobierne **solo la alerta** —que es lo único que ADR-021 §8.2 dice que
  gobierna—. **Recomendación de `sdd-arquitecto`: (b)**, y es un cambio de la
  letra de CA-6.1 y CA-6.2, no del ADR ni de `reglas.md`, que quedan intactos.

  **Destino: gate humano, antes de que empiece la implementación de CA-6.**

  **Y no es una enmienda de ADR-015, a propósito.** ADR-015 §2 reserva el
  encabezado `## Enmienda —` para un CA de una spec **cerrada** que ha dejado de
  poder ser cierto, y hace de ese encabezado el índice
  (`grep -rn "^## Enmienda —" docs/epicas/`). Aquí no se ha invalidado nada:
  CA-6 sigue siendo implementable y testable tal como está escrito, la spec está
  `aprobada` y no `hecho`, y no hay ningún veredicto que anotar. Meterlo bajo ese
  encabezado ensuciaría el índice que ADR-015 hace load-bearing.

  </details>

- **F-SPEC-013-2 — Un corresponsal que baja el marcador más de dos goles cae
  entre las dos frases de RN-04, y ninguna manda sobre la otra.** Levantado por
  `sdd-arquitecto` el 2026-09-02 al escribir la aclaración de RN-04 en
  `reglas.md`. **Decisión del gate ese mismo día (Alberto Fojo): se deja abierto
  y sin tocar** — ni quinta aclaración en `reglas.md`, ni cambio en CA-5.

  **El caso, concreto.** La `Decision` vigente dice 5-1. Llega una observación
  del **corresponsal** (0.8) que dice 1-1. Las dos frases de RN-04 apuntan en
  direcciones opuestas y las dos son literales:
  - la **monotonía** se lo **permite**, porque el corresponsal es humano
    —«operador **o** corresponsal», RN-01— y RN-04 deja bajar a la fuente
    oficial o a un humano;
  - la **retención del salto** se lo **retiene**, porque el salto es de más de
    dos goles y su peso es 0.8, por debajo del 0.9 que la aclaración firmada el
    2026-09-02 dejó fuera del alcance de la retención.

  **Y es el caso realista, no el rebuscado:** el corresponsal que se queda sin
  cobertura veinte minutos y escribe cuando la recupera manda de una vez lo que
  vio en ese rato. Un salto grande desde el campo es exactamente lo que se
  espera de esa fuente, no una anomalía.

  **Por qué no se cierra ahora.** No puede darse: **no hay puerta de entrada
  para observaciones de corresponsal**. El bot de Telegram es la spec que la
  trae, y es quien tendrá delante el comportamiento real de la fuente para
  decidir con evidencia en vez de por simetría.

  **Destino: la spec del bot de Telegram** (EPIC-002, la siguiente).
  **Disparador: el día que exista esa puerta** — la primera spec que permita
  persistir una `Observation` con `source` de corresponsal.

  **Estado hoy en el código:** ninguno. CA-5 no lo cubre —CA-5.2 solo prueba una
  bajada de un gol— y **no se le añade nada**: la spec queda deliberadamente
  silenciosa, que es distinto de haberlo resuelto sin mirar.

Y dos residuos ya **declarados por la spec** antes de implementar, que el
implementador no tiene que descubrir y el verificador no tiene que levantar como
hallazgo:

- **Residuo de CA-13.3** — la frontera de RN-08 no alcanza al nombre de tabla
  compuesto en tiempo de ejecución. Declarado dentro del propio criterio, como
  ADR-016 §6 obliga. **Destino: EPIC-MEJORA**; disparador: el día que un módulo
  fuera de `src/decide/` y de `src/db/` necesite escribir en la base.
- **Residuo de §Fuera de alcance** — la tabla de pesos de RN-01 vive en
  `src/ingest/sources.ts`, que es vocabulario del motor en el módulo de
  ingesta. **Destino: EPIC-MEJORA**; disparador: la próxima spec que ya tenga
  que tocar ese fichero por otro motivo.

## Cómo retomar (handoff)
<!-- Estado real del trabajo para la siguiente sesión: qué está hecho, qué falta, dónde seguir. -->

**Estado (2026-09-02, sdd-arquitecto):** spec y **ADR-021 `aprobada`**, firmadas
por Alberto Fojo. Las tres cosas que tenían que pasar antes de implementar están
hechas:

1. ✅ **Firma de ADR-021**, con sus §8.1 a §8.4 aprobados tal como se propusieron.
2. ✅ **Las cuatro lecturas trasladadas a `reglas.md`** como aclaraciones
   fechadas, con la forma de las de RN-01 y RN-03: el peso congelado en la
   `Observation` en RN-01; la retención que no alcanza a ≥ 0.9 en RN-04; «la
   vigente» y la persistencia en RN-05; la tabla cerrada y la corrección humana
   en RN-06. Cada una con su comentario de quién, qué gate, qué fecha y qué hueco
   cerraba, y diciendo que **no son umbrales nuevos**.
3. ✅ **Firma de la spec.**

4. ✅ **F-SPEC-013-1 resuelto** por el gate el 2026-09-02 (salida b) y **CA-6
   reescrito**: la gracia gobierna solo la alerta. Ya no queda ninguna decisión
   pendiente y la spec se puede implementar entera.

**Si vas a CA-6, lee su texto nuevo y no el del primer commit.** Cambió después
de la firma, y la diferencia es justo la que importa: durante la gracia **se
publica** (provisional, RN-03) y el plazo decide **solo** si se abre alerta.

No hay una línea de `src/` ni de `tests/` escrita.

Para el implementador, cuando llegue el turno:

- **Empezar por `src/decide/rules.ts` y `attribution.ts`**, que son puros y no
  necesitan base: CA-1 a CA-10 se cierran enteros con `npm test`.
- **`DATABASE_URL_TEST` hace falta desde CA-11.** Sin él, CA-11 y CA-12 son
  UNMET, no *skipped*.
- **`src/ingest/`, `src/polite/`, `src/calendar/` y `src/alias/` no se tocan**
  (CA-12.4). La **única** línea autorizada fuera de `src/decide/`, `src/db/` y
  `migrations/` es la función que `src/app/api/cron/ingest/route.ts` le inyecta
  al handler (CA-12.2), y esa línea obliga a escribir la enmienda de ADR-015 en
  el ledger de SPEC-012 (CA-12.3).
- **El lector de CA-13 se hereda, no se escribe**: es el del compilador que
  sostiene la frontera de SPEC-008/SPEC-009 (ADR-016 §5 bis: un solo lector).
