---
id: SPEC-017
tipo: ledger
epica: EPIC-002
---
# Ledger — SPEC-017 Panel del operador: sesión declarada sin usuarios, toda corrección como `Observation`, y la bandeja que `alerts` no tiene

## Resumen
- Fase: **`borrador`** — escrita por `sdd-arquitecto` el 2026-09-03, **pendiente
  del gate humano**. La fuente de verdad es el frontmatter de la spec.
- Rama: `ft/SPEC-017-panel-do-operador`
- ADRs que trae, los dos en `borrador`:
  - **ADR-024** — el panel: sesión declarada sin sistema de usuarios, el vale de
    acción, toda operación como `Observation` por la puerta estrecha, la bandeja,
    el registro de operación y la llave de la jornada.
  - **ADR-025** — el suelo de interfaz mientras EPIC-004 está congelada: foco
    visible, teclado, toque de 44 px, y estilos que no comparten una línea con
    `globals.css`.
- **Precondición de una sola parte:** CA-9.6 (los cuatro cualificadores en
  castellano) **no se implementa hasta que el gate firme la nota §3 de la spec** y
  `sdd-arquitecto` escriba la fila en `docs/fundacion/dominio.md`. Los otros doce
  criterios avanzan sin eso.

## Matriz de criterios de aceptación
<!-- Escritores: sdd-implementador rellena Implementado y Test; sdd-verificador rellena Verif. y Estado. Nunca al revés. -->
<!-- Estados por CA: ✅ cerrado · ⚠️ parcial/con salvedad · 🚧 en curso · ❌ sin empezar · n-a -->
<!-- Un CA está ✅ solo cuando Implementado + Test + Verif. aplicables están en verde. Una salvedad se marca ⚠️, nunca ✅. -->
| CA | Implementado (fichero) | Test (fichero/caso) | Verif. | Estado |
|---|---|---|---|---|
| CA-1 — sesión, fallo cerrado, frontera del secreto, sin anunciarse | | | | ❌ |
| CA-2 — toda operación es `Observation`; `DECISION_WRITERS` no crece | | | | ❌ |
| CA-3 — RN-10: archivo antes de parsear, lista blanca, motivo verbatim | | | | ❌ |
| CA-4 — RN-12: la cadena llega al operador y su motivo; modelo intacto | | | | ❌ |
| CA-5 — lo que el operador puede hacer y cómo lo trata el motor | | | | ❌ |
| CA-6 — la bandeja, el acuse trazable, `alerts` intacta, `migrations/0008` | | | | ❌ |
| CA-7 — el vale de acción: CSRF y cronómetro | | | | ❌ |
| CA-8 — la cuarta cifra medible, declarada como cota inferior | | | | ❌ |
| CA-9 — galego por defecto, castellano con paridad, cero literales | | | | ❌ |
| CA-10 — el suelo de interfaz de ADR-025, cumplido y comprobado | | | | ❌ |
| CA-11 — nace apagado, y la llave es el partido, no el reloj | | | | ❌ |
| CA-12 — lo que el operador ve para poder arbitrar | | | | ❌ |
| CA-13 — puntos de entrada declarados; el panel no le pide nada a nadie | | | | ❌ |

## Veredicto del verificador
<!-- GREEN/RED + fecha + resumen. Lo escribe SOLO sdd-verificador. -->

_Sin veredicto: la spec está en `borrador`._

**Nota para el verificador, escrita por adelantado porque esta spec tiene dos
centros y uno de ellos no se parece a los anteriores:**

1. **CA-1, CA-2 y CA-13 son fronteras de capacidad en la forma de ADR-016.** Son
   las que dicen si esta spec protege algo o solo lo promete. Comprueba los
   controles positivos uno por uno, apaga cada mecanismo y mira el rojo, y **lee
   los residuos declarados dentro de cada criterio**: si falta un residuo es
   *finding* con destino `sdd-arquitecto`, no una corrección del test. El caso de
   SPEC-013 que afirma que `DECISION_WRITERS` tiene **exactamente dos entradas**
   tiene que pasar sin que nadie lo toque — si alguien lo tocó, ése es el hallazgo.
2. **CA-10.7 es la mitad de la accesibilidad que ningún test ve, y la haces tú a
   mano.** Navegador a **360 × 640**, recorrido **solo con teclado** por el tablero
   y por una corrección, foco visible en cada parada, `Escape` que cancela, sin
   desplazamiento horizontal del cuerpo. Capturas a `_qa/SPEC-017/`. **No hay
   Playwright en el proyecto y esta spec no lo mete** (ADR-025 §5): si lo echas de
   menos, es *finding* con destino la spec futura que ya tiene disparador escrito,
   no una carencia de ésta.
3. **`npm run gates`** (typecheck → lint → build → test, SPEC-016) **y**
   `npm run test:db` aparte. Sin `DATABASE_URL_TEST` los criterios con base son
   **UNMET, no *skipped*** (gate del 2026-08-29). CA-4, CA-5 y CA-6 son de base.
4. **Comprueba en el diff que `src/app/globals.css` y `docs/diseno/` siguen
   intactos** (CA-10.6). Es la clase de regla que solo se incumple sin querer.

## Evidencia visual
<!-- Tabla CA → captura en _qa/SPEC-017/. Informe HTML opcional: _qa/SPEC-017/informe.html -->

| CA | Captura esperada |
|---|---|
| CA-10.7 | Tablero a 360 × 640, con el foco visible sobre el primer control |
| CA-10.7 | Formulario de corrección a 360 × 640, con el foco visible y sin scroll horizontal |
| CA-10.7 | El paso de confirmación, y la vuelta del foco tras `Escape` |
| CA-12 | El tablero con una alerta abierta arriba y el orden de la cola |

## Salvedades / follow-ups
<!-- IDs F-SPEC-017-1, F-SPEC-017-2… con destino (spec futura o EPIC-MEJORA). -->

_Sin hallazgos: no hay implementación todavía._ Lo que ya está **declarado en el
cuerpo de la spec** y no es un hallazgo sino una decisión con disparador escrito
—no se renumera aquí, se cita— es:

- **La sesión no tiene revocación, ni límite de intentos, ni segundo factor**
  (ADR-024 §3, CA-1.11). **Destino: ADR nuevo, no un parche**; **disparador: el
  segundo operador, o el día que el panel se use fuera de una jornada declarada.**
- **El vale no es de un solo uso** (CA-7.5). **Destino: EPIC-MEJORA**;
  **disparador: la primera operación del panel cuyo efecto no sea idempotente.**
- **`operator_actions` mide una cota inferior** (CA-8.4). No es deuda: es el límite
  del mecanismo, y la épica obliga a publicarlo al lado de la cifra.
- **La lista blanca no alcanza al contenido del motivo** (CA-3.9). Tampoco es
  deuda: es el límite del mecanismo.
- **Dos implementaciones de comparación en tiempo constante.** **Destino:
  EPIC-MEJORA**; **disparador: la tercera.**
- **F-SPEC-013-11 vuelve a contestarse sin cerrarse** (CA-2.6). **Destino:
  EPIC-MEJORA**; disparador sin cambios.
- **Las entradas 1 y 5 del inventario de EPIC-004 quedan abiertas con su disparador
  intacto** (CA-12.4 y §7 del diseño). La 3 queda contestada por ADR-025 §2 solo
  para lo que se construya antes del deshielo.
- **F-SPEC-001-1 se estrecha por cuarta vez y no se cierra**: la purga sigue sin
  ejecutor automático.

## Cómo retomar (handoff)
<!-- Estado real del trabajo para la siguiente sesión: qué está hecho, qué falta, dónde seguir. -->

**Estado al 2026-09-03.** Escritos y commiteados en `ft/SPEC-017-panel-do-operador`:
la spec, este ledger, **ADR-024** y **ADR-025**. Los tres frontmatter están en
`borrador`. **No se ha tocado ni una línea de `src/` ni de `tests/`**, y no debe
tocarse hasta que el gate firme.

**Lo que espera al humano (Alberto Fojo), por orden de lo que bloquea:**

1. **Firmar o tumbar la spec y los dos ADR.** Sin eso no empieza nada.
2. **Contestar la pregunta de lengua de la nota §3**: ¿los cuatro cualificadores se
   traducen al castellano, o se quedan en galego? **Bloquea solo CA-9.6.** Si la
   respuesta es «traducir», `sdd-arquitecto` escribe la fila en
   `docs/fundacion/dominio.md` **antes** de que la implementación empiece.
3. **Mirar la sesión con lupa** (nota §2). Es lo más débil del proyecto delante de
   la superficie con más poder, y las tres alternativas están rechazadas con motivo
   en ADR-024. Si el juicio no te convence, el cambio es de ADR-024 §3 y de CA-1.

**Si el gate firma, el orden de implementación que propongo** —y el motivo es que
cada peldaño se pueda verificar solo—:

1. `migrations/0008` y `src/db/admin.ts` (CA-6.1, CA-6.2, CA-6.3).
2. `src/admin/session.ts` y `ticket.ts`, con sus fronteras (CA-1, CA-7).
3. `redact.ts`, `archive.ts`, `observation.ts`, `actions.ts` (CA-2, CA-3, CA-4).
4. El motor por la puerta estrecha y los escenarios contra la base (CA-5).
5. La bandeja (CA-6.4 a CA-6.8) y el tablero (CA-12).
6. i18n (CA-9, salvo 9.6 hasta que haya firma), vista y estilos (CA-10.1 a 10.6).
7. `ENTRY_POINTS` y la contención (CA-13), la llave de la jornada (CA-11), el
   registro de operación (CA-8).
8. La comprobación manual con navegador (CA-10.7) y las capturas.

**Lo que no hay que olvidar y es fácil olvidar:** `docs/procedimientos/jornada-de-medicion.md`
tiene que ganar **dos** prefijos en la ceremonia de purga (CA-3.8): `operador/`,
que es de esta spec, y **`corresponsal/`, que falta desde SPEC-015** —cero
apariciones, medido el 2026-09-03—. Sin esas líneas los dos archivos sobreviven a
su jornada y ADR-020 §2 y ADR-023 §2 se incumplen por omisión, **sin que ningún
test se ponga rojo**, porque la purga es ceremonia manual sin ejecutor
(ADR-009 §4). Está en la nota §7 del gate por si el humano prefiere sacarlo a
EPIC-MEJORA en vez de cerrarlo aquí.
