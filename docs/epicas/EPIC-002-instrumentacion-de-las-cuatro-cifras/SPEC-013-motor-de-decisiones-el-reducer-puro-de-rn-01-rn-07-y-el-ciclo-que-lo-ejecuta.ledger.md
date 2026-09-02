---
id: SPEC-013
tipo: ledger
epica: EPIC-002
---
# Ledger — SPEC-013 Motor de decisiones: el reducer puro de RN-01..RN-07 y el ciclo que lo ejecuta

## Resumen
- Fase: aprobada (SPEC-013 y ADR-021 firmadas por Alberto Fojo el 2026-09-02;
  las cuatro lecturas de ADR-021 §8 ya están en `reglas.md`). **Bloqueada para
  CA-6 hasta que el gate decida F-SPEC-013-1**; el resto de los criterios puede
  empezar.
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

- **F-SPEC-013-1 — La gracia de RN-05 retiene la publicación, y eso cuesta hasta
  3 min de latencia contra un presupuesto de 120 s.** Levantado por
  `sdd-arquitecto` el 2026-09-02, **después de la firma**, al trasladar las
  lecturas de ADR-021 §8 a `reglas.md`.

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

Queda **una** cosa antes de tocar CA-6: **F-SPEC-013-1** (arriba). Apareció al
escribir la aclaración de RN-05 y es una decisión del gate, no del implementador.
El resto de los criterios no depende de ella.

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
