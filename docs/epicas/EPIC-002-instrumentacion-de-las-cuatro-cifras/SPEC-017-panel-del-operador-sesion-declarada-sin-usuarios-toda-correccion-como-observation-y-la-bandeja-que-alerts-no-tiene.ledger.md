---
id: SPEC-017
tipo: ledger
epica: EPIC-002
---
# Ledger — SPEC-017 Panel del operador: sesión declarada sin usuarios, toda corrección como `Observation`, y la bandeja que `alerts` no tiene

## Resumen
- Fase: **`en-progreso`** (RED de `sdd-verificador`, 2026-09-03) — escrita por `sdd-arquitecto` el 2026-09-03, firmada
  por Alberto Fojo el 2026-09-03, implementada por `sdd-implementador` el
  2026-09-03. La fuente de verdad es el frontmatter de la spec. **LOS TRECE
  CRITERIOS ENTREGADOS.** CA-10 estuvo congelado unas horas por el cambio de
  rumbo del mismo día, se reescribió de 7 a 15 subpuntos con **ADR-026**, y se
  implementó entero (ver *CA-10 descongelado*). **Lista para `sdd-verificador`.**
- Rama: `ft/SPEC-017-panel-do-operador`
- ADRs que trae, los dos **aprobados por Alberto Fojo el 2026-09-03**. CA-1,
  CA-7, CA-8, CA-10 y CA-11 los ejecutan literalmente. **ADR-025 §4 quedó
  superseded parcialmente por ADR-026** (`2278cb1`, aprobado el mismo día), que
  hace vinculante `docs/diseno/` y es la letra bajo la que CA-10 se implementó.
  De ADR-025 **sobreviven enteros §2, §3, §4.1 y §5**, y ahora son permanentes:
  el sistema de diseño **no tiene foco, ni teclado, ni componentes de
  formulario, ni suelo de toque**, así que no supersede nada de lo que ellos
  cubren.
  - **ADR-024** — el panel: sesión declarada sin sistema de usuarios, el vale de
    acción, toda operación como `Observation` por la puerta estrecha, la bandeja,
    el registro de operación y la llave de la jornada.
  - **ADR-025** — el suelo de interfaz mientras EPIC-004 está congelada: foco
    visible, teclado, toque de 44 px, y estilos que no comparten una línea con
    `globals.css`.
- **Precondición de CA-9.6 — CUMPLIDA el 2026-09-03.** El gate firmó la nota §3
  de la spec: **los cuatro cualificadores se traducen al castellano**, descartando
  dejarlos en galego como vocabulario de marca. `sdd-arquitecto` escribió ese
  mismo día la tabla en `docs/fundacion/dominio.md` —dos columnas nuevas, *Literal
  galego* y *Literal castellano*, con la forma de la tabla de estados— y la nota
  fechada que la explica. **CA-9.6 deja de estar bloqueado y el cuerpo de la spec
  no cambia**: el criterio ya rutaba al glosario, que es donde ahora está la
  respuesta.

## Respuestas del gate humano — 2026-09-03 (Alberto Fojo)

Las tres preguntas que la spec llevaba al gate, contestadas:

1. **¿Se traducen los cuatro cualificadores al castellano? → SÍ.** Ver arriba.
   *Provisional* y *Confirmado* quedan idénticos en las dos lenguas; *Pendente de
   confirmar* → **Pendiente de confirmar**; *Sen sinal* → **Sin señal**. Los
   **identificadores** de `MATCH_QUALIFIERS` **siguen en galego** (SPEC-001 CA-8):
   lo que gana forma castellana es el literal, nunca la clave.
2. **¿El hallazgo del runbook sale a EPIC-MEJORA o se cierra aquí? → Se cierra
   aquí, en CA-3.8.** La misma línea cubre `corresponsal/` y `operador/`, y así la
   purga del archivo del bot deja de depender de que alguien recuerde un prefijo
   que no está escrito en ninguna parte.
3. **La sesión de ADR-024 §3 y partir la decisión en dos ADR → sin objeción.** El
   juicio de `sdd-arquitecto` queda en pie en los dos casos. El disparador de
   reapertura de la sesión sigue escrito y sin cambios: **el segundo operador**.

## Matriz de criterios de aceptación
<!-- Escritores: sdd-implementador rellena Implementado y Test; sdd-verificador rellena Verif. y Estado. Nunca al revés. -->
<!-- Estados por CA: ✅ cerrado · ⚠️ parcial/con salvedad · 🚧 en curso · ❌ sin empezar · n-a -->
<!-- Un CA está ✅ solo cuando Implementado + Test + Verif. aplicables están en verde. Una salvedad se marca ⚠️, nunca ✅. -->
| CA | Implementado (fichero) | Test (fichero/caso) | Verif. | Estado |
|---|---|---|---|---|
| CA-1 — sesión, fallo cerrado, frontera del secreto, sin anunciarse | `src/admin/session.ts` · `src/admin/handler.ts` (`adminHandler`, `unauthorized`) · `src/admin/view/markup.ts` (`document`, la `meta`) | `tests/admin/session.test.ts` casos 1-18 · `tests/admin/frontier.test.ts` casos 1-11 (CA-1.7, 1.8, 1.9, 1.11) · `tests/admin/document.test.ts` casos 1-3 (CA-1.10) | Evasión probada y ROJA: un módulo fuera de `ADMIN_SECRET_READERS` que nombra `ADMIN_SESSION_SECRET` (caso 3 rojo). Sonda propia: sin secreto y con secreto corto ⇒ 401 y `log.calls === []`; catálogo vacío/ilegible ⇒ 401 sin `Set-Cookie`. Cookie emitida por el handler comprobada por sonda: `Path=/; HttpOnly; Secure; SameSite=Strict`. **Salvedades**: (a) cuatro métodos de los dobles no registran en el `CallLog`, así que «todos sin llamar» no es exhaustivo; (b) el detector de CA-1.3 es textual sobre `===`/`!==` y no declara ese residuo. | ⚠️ |
| CA-2 — toda operación es `Observation`; `DECISION_WRITERS` no crece | `src/admin/observation.ts` · `src/admin/actions.ts` · `src/admin/handler.ts` (`onAction`) · `src/admin/ports.ts` (`AdminPorts`) | `tests/admin/flow.test.ts` casos 1-3 · `tests/admin/frontier.test.ts` casos 12-19 · `tests/types/spec017-admin.test-d.ts` (CA-2.5) | `DECISION_WRITERS` sigue con DOS entradas y el caso de SPEC-013 que lo afirma NO se tocó (verificado en `git diff cd2870c..HEAD -- tests/decide/rn08-frontier.test.ts`: lo único que crece es la enumeración derivada de quién cruza, que gana `src/decide/read-entry.ts` con motivo en el mismo diff, igual que SPEC-015 hizo con `engine-entry.ts`). `src/decide/read-entry.ts` leído: solo lectura, devuelve `Decision[]` y ningún almacén. Evasiones probadas y ROJAS: `PostgresDecisionStore` importado desde `src/admin/view/styles.ts`. Los 13 ficheros de `src/admin/` entran en el escaneo (medido). | ✅ |
| CA-3 — RN-10: archivo antes de parsear, lista blanca, motivo verbatim | `src/admin/redact.ts` · `src/admin/archive.ts` · `docs/procedimientos/jornada-de-medicion.md` (paso 2 bis y paso 3) | `tests/admin/archive.test.ts` casos 1-15 · `tests/docs/purga.test.ts` casos 1-4 (CA-3.8) | **CA-3.2 NO CUMPLE.** El caso 4 declara `marker` en `tests/admin/archive.test.ts:99` y **nunca lo envía**; `postToPanel` (`tests/admin/support/doubles.ts:396`) no admite cabeceras, así que ninguna petición de la suite lleva `user-agent`, IP ni cabecera reconocible alguna, y los `not.toContain` son vacuos. **Fuga reproducida**: archivando UA + `X-Forwarded-For` + la cookie de sesión entera en el objeto crudo de la acción `estado`, `npm run gates` da 1515/1515 y `npm run test:db` 339/339, todos verdes. 3.1, 3.3-3.9 sí cumplen (runbook y prefijo verificados). | ❌ |
| CA-4 — RN-12: la cadena llega al operador y su motivo; modelo intacto | `src/admin/handler.ts` (paso 7 y 9) · `migrations/0008_admin.sql` | `tests/db/admin-flow.test.ts` casos 12-16 · `tests/db/admin-schema.test.ts` casos 15-16 (CA-4.3) · `tests/admin/flow.test.ts` casos 4-5 (CA-4.2) | Recorrido de punta a punta en sonda propia contra Postgres: `Decision.supporting_observation_ids` → `Observation(operador, 1.0)` → `raw_ref` → objeto crudo → `operator_id` **y** motivo, los dos presentes. `migrations/` solo añade `0008_admin.sql`, sin `alter table`; `src/model/` intacto en el diff. RN-13 comprobado en vivo: `update observations` y `update decisions` reciben «table … is append-only (RN-13)». | ✅ |
| CA-5 — lo que el operador puede hacer y cómo lo trata el motor | `src/admin/actions.ts` (`proposalFor`) · `src/admin/observation.ts` · `src/decide/read-entry.ts` | `tests/db/admin-flow.test.ts` casos 1-13 (los siete subpuntos, contra Postgres y con el motor real) | Los siete subpuntos con caso contra Postgres y el motor real (casos 1-14). Reverificado por sonda propia: ratificar una `Decision` provisional de `ceroacero` (2-0, v1) emite **`Decision` v2, `rule: RN-02`, `provisional=false`**, sin escribir ningún marcador — CA-5.6, la operación que hace verdadera la frase central de la spec. | ✅ |
| CA-6 — la bandeja, el acuse trazable, `alerts` intacta, `migrations/0008` | `migrations/0008_admin.sql` · `src/db/admin.ts` · `src/admin/alerts.ts` · `src/admin/handler.ts` (`onAcknowledge`) | `tests/db/admin-schema.test.ts` casos 1-14 · `tests/db/admin-flow.test.ts` casos 17-19 · `tests/admin/board.test.ts` casos 1-4 · `tests/admin/flow.test.ts` caso 3 (CA-6.6) | `alerts` intacta (diff de `migrations/` y lectura del esquema). Las dos tablas nuevas append-only con su trigger; ninguna columna capaz de albergar una persona; «abierta» derivada. Acuse idempotente y sin publicar nada, contra la base. **Salvedad (6.8)**: la segunda fila de `alerts` la siembra un helper del test, no el motor, así que «el motor escribe otra fila» queda simulado. | ⚠️ |
| CA-7 — el vale de acción: CSRF y cronómetro | `src/admin/ticket.ts` · `src/admin/view/markup.ts` (`ticketField`, `hidden`) | `tests/admin/ticket.test.ts` casos 1-9 | 7.1, 7.2, 7.3 y 7.5 cumplen. **7.4 primera mitad sin ejercitar**: el caso 6 (`tests/admin/ticket.test.ts:168`) dice en su comentario «El mismo vale, en la query en vez de en el cuerpo» y su `Request` **no lleva ninguna query**: es el caso 1 repetido. El comportamiento es correcto (sonda: `POST /admin?vale=<válido>` con cuerpo sin vale ⇒ 400, cero crudos, cero filas), pero ningún caso afirma lo que el CA pide. La segunda mitad (ningún `href`) sí, caso 7. | ⚠️ |
| CA-8 — la cuarta cifra medible, declarada como cota inferior | `src/admin/ports.ts` (`OperatorActionRecord`) · `src/db/admin.ts` (`PostgresOperatorActionLog`) · `src/admin/handler.ts` (`record`) | `tests/admin/flow.test.ts` casos 6-9 · `tests/db/admin-flow.test.ts` caso 20 (CA-8.3 contra la base) | Los cuatro subpuntos con caso. Comprobado en vivo: una corrección aceptada deja **una** fila con `started_at = issued_at` del vale y `submitted_at = ahora`; un rechazo por razón de dominio deja fila con su desenlace; un rechazo antes de sesión o de vale no deja ninguna. La cota inferior está declarada dentro del criterio y ejercida (dos cargas del tablero ⇒ cero filas). | ✅ |
| CA-9 — galego por defecto, castellano con paridad, cero literales | `src/i18n/admin-bundle.ts` · `src/i18n/admin.ts` · `src/i18n/gl.ts` y `es.ts` (espacios `admin` y `qualifiers`) | `tests/admin/i18n.test.ts` casos 1-16 · `tests/types/spec017-admin.test-d.ts` (CA-9.1, 9.3, 9.7) · `tests/admin/frontier.test.ts` casos 20-23 (CA-9.2, 9.5) · `tests/site/i18n.test.ts` caso 4 (enmendado) | Paridad impuesta por tipo (`const castelan: AdminBundle = es.admin`), `asAdminText` sin exportar y sin ninguna escapatoria por cast, cuatro cualificadores en las dos lenguas con la tabla escrita en `dominio.md` **antes** del código (`456038f` < `ba0be1c`). `no-hardcoded-literals.test.ts` sin tocar y sin excepciones nuevas. Notas ya declaradas por el implementador (F-SPEC-017-7) y una menor: la directiva `@ts-expect-error` etiquetada CA-9.7 prueba otra cosa. | ✅ |
| CA-10 — **REESCRITO 2026-09-03 (ADR-026)**: el sistema de diseño, sobre el suelo de ADR-025, sin heredar lo que el sistema no cumple | `src/design/tokens.ts` y `system.ts` (dueño único, tabla y divergencias) · `src/admin/view/styles.ts` (la hoja, sin un valor propio) · `src/admin/view/markup.ts` y `pages.ts` (clases de estado y cualificador, gesto de `Escape`) · `public/fonts/` (cinco caras de Geist autoalojadas + OFL) | `tests/design/parity.test.ts` casos 1-17 (CA-10.2..10.6) · `tests/admin/style.test.ts` casos 1-32 (CA-10.1, 10.6..10.13) · **CA-10.14 A MANO**: `_qa/SPEC-017/` — cuatro capturas a 360 × 640, `CA-10.14-medidas.json` y `README.md` | `docs/diseno/` y `src/app/globals.css` **intactos en el diff**. Evasiones probadas UNA A UNA y todas ROJAS: `#rrggbb` en la hoja · apagar `provisional` con `--fg-muted` · enmudecer el cualificador en el tablero **y** en el detalle · `confirmado` con `--brand` · `@import` de Google Fonts · `TOUCH_TARGET_PX = 43`. La paridad de tokens cierra: las tres divergencias, ni una más, y el complemento vacío. `_qa/SPEC-017/` revisado captura a captura: es evidencia real de Chrome a 360 × 640 y sostiene lo que 10.14 afirma. **Salvedades**: (a) la letra de 10.1 dice «ni un radio, ni un valor de escala por su cuenta» y la hoja sí escribe algunos (`h1{font-size:20px}`, `line-height:1.45`, `max-width:22rem`, `min-height:5rem`, `main{max-width:60rem}`); el mecanismo del propio subpunto solo cubre color y familia y 10.4 declara el residuo de la escala; (b) quedan **tres restos de la versión congelada** que dicen lo contrario de lo vigente (ver findings V4). | ⚠️ |
| CA-11 — nace apagado, y la llave es el partido, no el reloj | `src/admin/handler.ts` (`declaredMatches`, el paso 6) · `src/ingest/measurement.ts` (sin tocar: nace vacía) | `tests/admin/flow.test.ts` casos 10-13 | 11.2, 11.3 y 11.4 cumplen, y 11.3 está bien hecho (reloj el lunes, jornada del sábado, la corrección funciona). **11.1 primera mitad sin caso**: `MEASUREMENT_WINDOWS` sí se afirma con la lista de producción (casos 10-11), pero **no hay ni un test que ejercite el camino de acceso** (`intento=acceso`) por el handler, ni el éxito ni el fallo, así que «con `ADMIN_OPERATORS` vacía no entra nadie» no lo afirma ningún caso. Comportamiento verificado por sonda propia (401, sin `Set-Cookie`, cero puertos); lo que falta es la aserción. | ⚠️ |
| CA-12 — lo que el operador ve para poder arbitrar | `src/admin/board.ts` · `src/admin/view/pages.ts` · `src/decide/read-entry.ts` | `tests/admin/board.test.ts` casos 5-10 · `tests/admin/document.test.ts` casos 8-10 | Nombres canónicos RFGF, estado, marcador, cualificador con `qualifierOf`, instante y alertas abiertas, comprobados sobre el árbol renderizado y en el navegador. El detalle enseña las `Observation` de cada fuente y el log de `Decision` con `version`, `rule` y apoyos. El orden (alerta → *sen sinal* → `live` → resto) tiene caso, con el contra-caso de que `confirmado` no adelanta a nadie. | ✅ |
| CA-13 — puntos de entrada declarados; el panel no le pide nada a nadie | `src/app/(gl)/admin/route.ts` · `src/app/(es)/es/admin/route.ts` · `tests/polite/support/capability.ts` (`ENTRY_POINTS`) | `tests/admin/frontier.test.ts` casos 24-28 | Las dos rutas en `ENTRY_POINTS` con motivo; la suite cerrada de SPEC-009 pasa sin tocar aserciones. Evasión probada y ROJA: `politeFetch` importado en `src/admin/handler.ts` mete `src/polite/http.ts` en el grafo. Las cuatro entradas nuevas de `capability.ts` (`createHmac`, `Array.isArray`, `URLSearchParams`, `encodeURIComponent`) revisadas una a una: **ninguna abre la puerta a pedir bytes a un tercero**. Rutas sin lógica: su único destino resuelto es `src/admin/handler.ts`. | ✅ |

## Veredicto del verificador
<!-- GREEN/RED + fecha + resumen. Lo escribe SOLO sdd-verificador. -->

## 🔴 RED — 2026-09-03, `sdd-verificador`

**Cuatro criterios en ⚠️ y uno ❌. El que decide es CA-3.2, y no es una
formalidad: su mecanismo NO EXISTE, y la fuga que ese subpunto está escrito para
impedir —el `user-agent`, la IP y la cookie de sesión entera archivados en el
objeto crudo del operador— pasa con `npm run gates` y `npm run test:db` enteros
en verde.** Es exactamente el modo de fallo que ADR-016 §3.4 existe para
impedir: un caso que se lee como cobertura y no mide nada.

**Lo que sí está bien, y es mucho, dicho primero para que el RED se lea en su
sitio.** Las tres fronteras de ADR-016 aguantan las evasiones: intenté catorce y
las catorce dieron rojo. `DECISION_WRITERS` sigue con dos entradas y el caso de
SPEC-013 que lo afirma no se tocó. `docs/diseno/` y `src/app/globals.css` están
intactos en el diff. La paridad de tokens de CA-10 cierra de verdad —tres
divergencias, ni una más, complemento vacío—. `_qa/SPEC-017/` es evidencia real
de un Chrome real y sostiene lo que CA-10.14 afirma. Y el flujo real corre de
punta a punta: el panel arranca por HTTP (`/admin` en galego, `/es/admin` en
castellano, 200, `X-Robots-Tag: noindex, nofollow`), una corrección acaba en
`Observation(operador, 1.0)` → motor → `Decision` confirmada, y la cadena de
RN-12 se recorre entera hasta el motivo escrito por la persona.

**Gates, medidos por mí sobre `1b76730`:** `npm run gates` → **137 ficheros,
1515 casos, verdes**, `Type Errors: no errors`, `next build` con `ƒ /admin` y
`ƒ /es/admin`. `npm run test:db` → **26 ficheros, 339 casos, verdes**. Cuadran
con las cifras de referencia. **Ningún gate falla: por eso este RED sale de las
evasiones y del flujo real, no del semáforo.**

### Findings, en orden de gravedad

Cada uno con el CA que incumple y cómo reproducirlo. Escritos para alguien que
no recuerda nada de esta rama.

---

#### 🔴 **F-SPEC-017-V1 — CA-3.2: el mecanismo no existe, y la fuga real pasa verde**

**Qué pide el CA (letra):** «Ni cabeceras, ni IP, ni user-agent, ni cookie, ni
valor de sesión aparecen en el objeto ni en ninguna fila persistida. **Un caso lo
afirma con un envío sintético cuyas cabeceras llevan valores reconocibles** que
no aparecen en ningún byte.»

**Qué hay.** `tests/admin/archive.test.ts:99` declara

```ts
const marker = 'CABECERA-RECOÑECIBLE-9f3a';
```

y **no lo envía nunca**. `grep -rn "CABECERA-RECO" tests/ src/` devuelve **una
sola línea**: la declaración. Y no puede enviarlo: `postToPanel`
(`tests/admin/support/doubles.ts:396-420`) tiene `PostOptions` con `fields`,
`token`, `locale` y `env`, y **ninguna forma de fijar una cabecera**. La única
que la petición lleva es la `cookie` que el propio helper pone. Así que
`expect(body).not.toContain(marker)`, `not.toContain('user-agent')` y
`not.toContain('x-forwarded-for')` son **vacuos por construcción**: ninguna
petición de las 1854 de este repositorio lleva un `user-agent` ni una IP.

**Reproducción de la fuga (hecha, no supuesta).** En un worktree limpio sobre
`1b76730`, en `src/admin/handler.ts`, justo antes de `return await onAction(…)`:

```ts
if (submitted.get(FIELDS.action) === 'estado') {
  submitted.set(
    FIELDS.reason,
    `${submitted.get(FIELDS.reason) ?? ''} [ua=${request.headers.get('user-agent') ?? ''} ip=${request.headers.get('x-forwarded-for') ?? ''} ck=${request.headers.get('cookie') ?? ''}]`,
  );
}
```

Con eso, **cada acción `estado` archiva el user-agent, la IP y la cookie de
sesión entera** dentro del objeto crudo, que es lo que `dominio.md` llama «la
observación con más poder del sistema» y lo que ADR-023 entero existe para
vigilar. Resultado medido:

```
npm run gates    → Test Files 137 passed · Tests 1515 passed · Type Errors: no errors
npm run test:db  → Test Files  26 passed · Tests  339 passed
```

**Verde entero.** (Se eligió `estado` y no `correccion` a propósito: el caso 8
—motivo verbatim— usa `correccion` y caza cualquier cosa añadida al motivo *de
esa acción*, por un motivo ajeno a CA-3.2. La protección de CA-3.2 no existe en
ninguna de las dos.)

**Matiz honesto, porque cambia la urgencia y no el veredicto:** hoy la propiedad
se sostiene **estructuralmente** —`onAction` no recibe el `Request`,
`DeclaredAction` es una forma cerrada y `redactAction` copia *hacia fuera* de la
lista blanca—, así que **no hay fuga en el código entregado**. Lo que falta es el
mecanismo que el criterio exige y la protección ante la regresión. CA-3.2 sigue
siendo ❌: el criterio pide un caso y no lo hay.

**Cómo se cierra.** `PostOptions` gana `headers?: Readonly<Record<string,string>>`
y el caso 4 envía de verdad un `user-agent`, un `x-forwarded-for` y un
`referer` con valores reconocibles, sobre **las cuatro acciones** —`correccion`,
`estado`, `ratificacion` y `acuse`—, y afirma que ninguno aparece en ningún byte
del objeto ni de ninguna fila. Con control positivo: un handler sintético que
copie una cabecera al motivo tiene que poner rojo ese caso.

---

#### 🟠 **F-SPEC-017-V2 — CA-11.1: el camino de acceso no tiene NI UN test**

**Qué pide el CA:** «Con `ADMIN_OPERATORS` vacía **no entra nadie** […] **Un caso
lo afirma** con las listas de producción, no con dobles.»

**Qué hay.** La mitad de `MEASUREMENT_WINDOWS` está bien hecha y con la lista de
producción (`tests/admin/flow.test.ts` casos 10-11, que importan
`MEASUREMENT_WINDOWS` de `@/ingest/measurement` y afirman `toEqual([])`). La
mitad de `ADMIN_OPERATORS` **no tiene caso**, porque **`onAccess`
(`src/admin/handler.ts:203-221`) no lo ejerce ninguna suite**:

```
grep -rn "intento: 'acceso'\|intento=acceso" tests/   →  0 aciertos
```

`readOperators` y `authenticate` se prueban **aisladas** en
`tests/admin/session.test.ts` (casos 5 y 8), pero **el único intercambio de todo
el proyecto que convierte un secreto en una sesión —la entrada a la superficie
de peso 1.0 con precedencia sobre la RFGF— no pasa por ningún test**. Ni el
éxito (secreto correcto ⇒ 303 + `Set-Cookie` firmada) ni el fallo.

Y arrastra a CA-1.5: `sessionSetCookie` se afirma como función, pero **la
cabecera `Set-Cookie` que el handler emite de verdad no la inspecciona ningún
caso**.

**Comportamiento verificado por mí (sonda, borrada después):** con el catálogo
correcto y la clave correcta ⇒ `303`, `Location: /admin`,
`Set-Cookie: marcador_operador=…; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800`,
y `log.calls === []`. Con clave incorrecta, y con `ADMIN_OPERATORS` a `''`, `'{}'`
o `'no-es-json'` ⇒ `401`, sin cookie, cero puertos. **El comportamiento es
correcto. Lo que no existe es la aserción**, y CA-11.1 pide una.

**Cómo se cierra.** Dos casos en `tests/admin/flow.test.ts` sobre el handler:
uno que entra y afirma el 303 y los cuatro atributos de la cookie emitida; otro
que con `ADMIN_OPERATORS` vacía afirma 401, **sin `Set-Cookie`** y `log.calls`
vacío.

---

#### 🟠 **F-SPEC-017-V3 — CA-7.4: el caso 6 dice que hace algo que no hace**

**Qué pide el CA:** «El vale no viaja en la URL. **Un caso afirma que ninguna
ruta del panel lo acepta como parámetro de consulta**, y que ninguna vista lo
escribe en un `href`.»

**Qué hay.** `tests/admin/ticket.test.ts:168-184`, caso 6, lleva el comentario

```ts
// El mismo vale, en la query en vez de en el cuerpo. No abre nada.
```

y su petición **no lleva ninguna query**: `postToPanel` construye siempre
`new Request('https://marcador.gal/admin', …)` sin cadena de consulta. El caso es
**el caso 1 repetido** (un POST sin vale ⇒ 400). La primera mitad de CA-7.4 no
la ejerce nadie. La segunda (ningún `href` lo escribe) sí, caso 7.

**Comportamiento verificado (sonda):** `POST /admin?vale=<válido>` con el vale
fuera del cuerpo ⇒ `400`, cero crudos, cero `Observation`, cero filas, cero
llamadas al motor. Correcto, sin aserción.

**Cómo se cierra.** Que `postToPanel` acepte una `url` (ya lo hace `getPanel`) y
que el caso 6 mande el vale **en la query** con el cuerpo sin él.

---

#### 🟡 **F-SPEC-017-V4 — quedan tres restos de la versión congelada de CA-10, y los tres dicen lo contrario de lo vigente**

No hay ninguna **aserción** superviviente de la primera versión —la que exigía
que ningún color de `docs/diseno/` apareciera en la hoja se fue entera con
`tests/admin/view.test.ts`, verificado en el diff—. Lo que queda es **prosa que
miente a quien la lea después**, que es el mismo defecto por el que se retiró
aquel fichero:

1. `tests/admin/frontier.test.ts:44-46` — «`src/admin/view/styles.ts` **NO está**,
   y es una decisión del 2026-09-03: CA-10 quedó CONGELADO». **Sí está.** Medido:
   el escaneo de la frontera devuelve los **trece** ficheros de `src/admin/`,
   `view/styles.ts` incluido. El comentario invita a creer que hay un fichero de
   `src/admin/` fuera de las fronteras de CA-2.3, CA-2.4 y CA-9.5, y no lo hay.
2. `tests/admin/document.test.ts:11-22` — «**CA-10 ESTÁ CONGELADO DESDE EL
   2026-09-03** […] La hoja de estilos se retira con ella», tres líneas debajo de
   las 6-9, que dicen lo contrario y son las correctas.
3. Este mismo ledger, sección *Evidencia visual*: «**`_qa/SPEC-017/` ESTÁ VACÍO A
   PROPÓSITO, y no es un descuido**», inmediatamente encima de la tabla de las
   cuatro capturas que sí existen.

**Cómo se cierra.** Tres ediciones de comentario. Ninguna toca comportamiento.

---

#### 🟡 **F-SPEC-017-V5 — `docs/fundacion/dominio.md` contradice a ADR-026 §2, en la tabla que esta spec reescribió**

`docs/fundacion/dominio.md` es documento de verdad y **esta spec lo editó**
(`456038f`). Dos frases suyas quedaron sin revisar cuando ADR-026 se aprobó el
mismo día:

- la nota de **`provisional`** sigue diciendo «La interfaz lo distingue (p. ej.
  **marcador en gris**)» — que es literalmente lo que **ADR-026 §2.1** prohíbe:
  «Ningún cualificador se distingue apagándolo. `provisional` y `confirmado` se
  sirven los dos con el color de texto principal»;
- el párrafo de cierre dice que «cuál de los dos cualificadores es el estado
  normal **y cuál va apagado en la pantalla**» sigue siendo la entrada 1 del
  inventario de EPIC-004 — cuando **ADR-026 §2 la cierra** y la propia sección
  *Fuera de alcance* de esta spec lo escribe («la 1 la cierra ADR-026 §2»).

El código hace lo correcto; el glosario canónico dice lo contrario. Quien
implemente la pantalla del marcador leerá `dominio.md`.

**Destino: `sdd-arquitecto`** (el glosario no es artefacto de `sdd-implementador`
ni mío). No bloquea por sí solo; se arregla en la misma vuelta.

---

### Salvedades escritas dentro de su CA (⚠️, no findings)

- **CA-1.1** — cuatro métodos de los dobles no llaman a `log.record`
  (`MemoryAckStore.ackedAt`, `MemoryObservationStore.getById`,
  `MemoryMatchStore.listByRound` y `listByTeams`), así que «**todos** están sin
  llamar» no es exhaustivo. No los toca el camino del 401, pero el mecanismo no
  lo demuestra.
- **CA-1.3** — el detector de comparaciones es textual sobre `===`/`!==`. La
  letra del criterio dice «con `===`», así que **se cumple**; pero `Object.is`,
  `==` y `!a.localeCompare(b)` lo esquivarían y **ADR-016 §6 pediría declararlo
  dentro del criterio**. Residuo sin destino escrito.
- **CA-6.8** — el caso ejerce alerta → acuse → alerta nueva → abierta contra
  Postgres, pero **las filas de `alerts` las siembra un helper del test**, no el
  motor. «El motor escribe otra fila» queda simulado.
- **CA-7.5, CA-8.4, CA-3.9, CA-10.4, CA-10.15, CA-12.4, CA-2.6, CA-1.11** —
  residuos declarados **dentro** de su criterio, con destino y disparador, y
  ejercidos donde procede. Leídos uno a uno: **no falta ninguno**, así que no hay
  *finding* con destino `sdd-arquitecto` por ese lado.
- **CA-10.1** — la letra dice «el panel no declara ni un color, ni una familia
  tipográfica, **ni un radio, ni un valor de escala** por su cuenta», y la hoja
  sí escribe algunos valores propios: `h1{…font-size:20px}`, `body{line-height:1.45}`,
  `input,select,textarea{max-width:22rem}`, `textarea{min-height:5rem}` y
  `main{max-width:60rem}`. El mecanismo que el propio subpunto describe cubre
  **color y familia** —y ahí no hay ni un literal— y CA-10.4 declara que la
  escala no se puede comprobar contra nada. **Residuo: la mitad de escala de
  CA-10.1 la sostiene la revisión humana, como la de CA-10.4. Destino: EPIC-004;
  disparador: el deshielo.**

### Lo que comprobé y salió bien (para que no se repita el trabajo)

**Evasiones intentadas de verdad, todas ROJAS** (en worktree aislado, revertidas):

| Evasión | Mecanismo que la caza |
|---|---|
| `#123456` en `src/admin/view/styles.ts` | CA-10.1 casos 1 y 3 |
| Apagar `provisional` con `--fg-muted` | CA-10.7 caso 9 |
| Enmudecer el cualificador en el **tablero** | CA-10.7 caso 10 + CA-10.12 caso 27 |
| Enmudecer el cualificador en el **detalle** | CA-10.12 caso 27 |
| `confirmado` pintado con `--brand` | CA-10.8 caso 12 |
| `@import` de Google Fonts en la hoja | CA-10.6 caso 6 |
| `TOUCH_TARGET_PX = 43` | CA-10.11 casos 24-25 |
| `src/site/leak.ts` nombrando `ADMIN_SESSION_SECRET` | CA-1.7 caso 3 |
| `PostgresDecisionStore` importado en `src/admin/` | CA-2.3 caso 13 |
| `politeFetch` importado en `src/admin/handler.ts` | CA-13.2 caso 25 |

**Diff de zonas protegidas:** `docs/diseno/` **sin una línea de cambio**;
`src/app/globals.css` **sin una línea de cambio**; `src/model/` **sin cambios**;
`migrations/` solo añade `0008_admin.sql`, sin ningún `alter table`; de
`src/decide/` solo nace `read-entry.ts`.

**`src/decide/read-entry.ts` (mi encargo explícito):** leído entero. Es de solo
lectura, devuelve `Decision[]` y **ningún almacén**, y su existencia es la misma
desviación precedentada que `engine-entry.ts` trajo con SPEC-015.
`DECISION_WRITERS` sigue con **dos** entradas y **el caso que lo afirma no se
tocó**: lo único que cambió en `tests/decide/rn08-frontier.test.ts` es la
enumeración **derivada** de qué ficheros cruzan, que gana `read-entry.ts` con su
motivo escrito en el mismo diff (ADR-016 §3.2), igual que hizo SPEC-015. **No es
un ablandamiento.**

**Las cuatro entradas nuevas de `tests/polite/support/capability.ts`:**
`createHmac` en la superficie de `node:crypto`, y `Array` (`isArray`),
`URLSearchParams` y `encodeURIComponent` en `ALLOWED_GLOBALS`. Revisadas una a
una: **ninguna abre la puerta a pedir bytes a un tercero**, y las dos rutas
nuevas de `ENTRY_POINTS` llegan con motivo. RN-11 sigue sin alcanzar a esta spec,
y CA-13.2 lo sostiene con un mecanismo (evasión probada).

**Flujo real, corrido por mí:**

- **El panel arranca por HTTP** (`next dev`, repo real): `GET /admin` ⇒ 200,
  `lang="gl"`, `<title>Panel do operador — marcador.gal</title>`, formulario de
  acceso, `X-Robots-Tag: noindex, nofollow`, `cache-control: no-store`;
  `GET /es/admin` ⇒ 200, `lang="es"`, `Panel del operador`.
- **Una corrección acaba en `Observation` y `Decision` por el motor (RN-08),**
  contra Postgres real: archivo en
  `operador/correccion/2026-03-21/2026-03-21t17-45-00.000z-b729151bcdd0.json`
  con **exactamente** las nueve claves de la lista blanca
  (`action`, `away_score`, `home_score`, `issued_at`, `match_id`, `operator_id`,
  `reason`, `status`, `submitted_at`), el motivo **verbatim con emoji y acentos**,
  y sin un byte de cookie ni de user-agent; después `Observation(source=operador,
  confidence=1)` con ese `raw_ref`; después `Decision` del motor.
- **RN-12 de punta a punta:** `Decision.supporting_observation_ids` →
  `Observation` → `raw_ref` → objeto crudo → `operator_id` **y** el motivo escrito
  por la persona. Los dos están.
- **CA-5.6 reverificado aparte**, que es la operación central: sobre una
  `Decision` provisional de `ceroacero` (2-0, v1), ratificar emite **`Decision`
  v2, `rule: RN-02`, `provisional=false`** sin escribir ningún marcador.
- **Idempotencia:** reenviar el mismo vale con el mismo cuerpo deja **una** sola
  `Observation`.
- **RN-13 en vivo:** `update observations` y `update decisions` ⇒ «table … is
  append-only (RN-13): UPDATE is not allowed».
- **El panel entrega apagado:** `MEASUREMENT_WINDOWS` sigue `[]` en
  `src/ingest/measurement.ts`, y `ADMIN_OPERATORS` y `ADMIN_SESSION_SECRET` no
  existen en ninguna parte versionada.

**Nota operativa, no es finding de esta spec:** correr `next dev` **reescribe
`CLAUDE.md`** añadiéndole un bloque `nextjs-agent-rules`. Me pasó al arrancar el
panel y lo revertí; no está commiteado en esta rama. Quien repita la comprobación
manual tiene que mirar `git status` después.

### Qué hace falta para el GREEN

Los tres primeros findings. **V1 es el que bloquea**; V2 y V3 son el mismo
defecto en menor grado —un criterio que pide un caso y no lo tiene— y se
arreglan en la misma vuelta. V4 y V5 son ediciones de prosa que no tocan
comportamiento, pero V5 deja el glosario canónico contradiciendo un ADR
aprobado, así que tampoco se deja para después.

**No hay que tocar nada de lo que ya está verde**, y en particular **no hay que
tocar ninguna frontera ni ninguna aserción de una spec cerrada**: los tres
findings se cierran añadiendo casos y cambiando comentarios.

---

**Nota para el verificador, escrita por adelantado porque esta spec tiene dos
centros y uno de ellos no se parece a los anteriores:**

1. **CA-1, CA-2 y CA-13 son fronteras de capacidad en la forma de ADR-016.** Son
   las que dicen si esta spec protege algo o solo lo promete. Comprueba los
   controles positivos uno por uno, apaga cada mecanismo y mira el rojo, y **lee
   los residuos declarados dentro de cada criterio**: si falta un residuo es
   *finding* con destino `sdd-arquitecto`, no una corrección del test. El caso de
   SPEC-013 que afirma que `DECISION_WRITERS` tiene **exactamente dos entradas**
   tiene que pasar sin que nadie lo toque — si alguien lo tocó, ése es el hallazgo.
2. **CA-10 ESTÁ IMPLEMENTADO ENTERO, en la letra NUEVA de quince subpuntos.**
   Lee la sección *CA-10 descongelado — evidencia subpunto a subpunto* antes de
   empezar: dice qué caso sostiene cada uno. Tres cosas que conviene mirar con
   lupa porque son las que decidirían un RED:
   - **la paridad de tokens** (`tests/design/parity.test.ts`) es una lista
     cerrada en la forma de ADR-016: apaga sus cuatro controles positivos uno a
     uno y mira el rojo, y **lee la lista de divergencias**: son tres, motivadas
     en ADR-026 §3.4, y una cuarta sin ADR detrás sería el hallazgo;
   - **`docs/diseno/` y `src/app/globals.css` siguen intactos** en el diff;
   - **`_qa/SPEC-017/` es la mitad manual y está hecha**, con Chrome real y las
     medidas sin retocar. Si algo de ahí no te cuadra, el `README.md` de ese
     directorio dice cómo reproducirlo.
   **Y hay una asimetría honesta que declarar**: los subpuntos 1 a 13 son
   estáticos y no ven un diseño calculado; el 14 lo vio un navegador y el 15 es
   un residuo declarado, no una promesa.
3. **`npm run gates`** (typecheck → lint → build → test, SPEC-016) **y**
   `npm run test:db` aparte. Sin `DATABASE_URL_TEST` los criterios con base son
   **UNMET, no *skipped*** (gate del 2026-08-29). CA-4, CA-5 y CA-6 son de base.
4. **Comprueba en el diff que `src/app/globals.css` y `docs/diseno/` siguen
   intactos.** Es la clase de regla que solo se incumple sin querer, y con
   CA-10 implementado es MÁS necesaria, no menos: ahora el panel **deriva** del
   sistema, y la tentación de «arreglar» el artefacto para que el panel salga
   bien es real. ADR-026 §3.7 lo prohíbe; lo que se mueve, se mueve en la lista
   de divergencias.
5. **Mira con lupa `src/decide/read-entry.ts` (F-SPEC-017-1)**, que es la única
   desviación estructural de la spec, y las cuatro entradas nuevas de
   `tests/polite/support/capability.ts` (F-SPEC-017-4).

## Evidencia visual
<!-- Tabla CA → captura en _qa/SPEC-017/. Informe HTML opcional: _qa/SPEC-017/informe.html -->

> **Corrección de `sdd-verificador` (2026-09-03):** el párrafo que seguía aquí
> —«`_qa/SPEC-017/` ESTÁ VACÍO A PROPÓSITO»— es un **resto de la versión
> congelada de CA-10** y hoy es falso: el directorio tiene las cuatro capturas,
> las medidas y el README que la tabla de abajo enumera. Es el resto nº 3 de
> **F-SPEC-017-V4**. Se deja tachado en vez de borrado porque el ledger es
> registro, no estado.

~~**`_qa/SPEC-017/` ESTÁ VACÍO A PROPÓSITO, y no es un descuido.** Las tres
capturas de CA-10.7 se hacen sobre una pantalla con estilos, y CA-10 quedó
congelado el 2026-09-03 a la espera de ADR-026.~~

> **Cerrado por `sdd-implementador` (2026-09-03), F-SPEC-017-V4 nº 3.** El
> párrafo tachado es mío y era el tercer resto de la versión congelada de
> CA-10. Lo vigente es la tabla de abajo: `_qa/SPEC-017/` tiene **cuatro
> capturas**, `CA-10.14-medidas.json` y `README.md`. Los otros dos restos —el
> comentario de `tests/admin/frontier.test.ts` y la cabecera de
> `tests/admin/document.test.ts`— están corregidos en el código, y el primero
> **dejó de ser un comentario para ser una aserción**: el escaneo de la
> frontera afirma que `src/admin/view/styles.ts` está dentro.

| CA | Captura | Fichero |
|---|---|---|
| CA-10.14 | Acceso a 360 × 640, con el foco visible sobre el primer campo | `CA-10.14-gl-360x640-acceso-foco.png` |
| CA-10.14 | Tablero a 360 × 640, con el foco visible sobre el primer control y **la alerta abierta arriba** | `CA-10.14-gl-360x640-taboleiro-foco.png` |
| CA-10.14 | Formulario de corrección a 360 × 640, foco visible, sin scroll horizontal | `CA-10.14-gl-360x640-correccion-foco.png` |
| CA-10.14 | La vuelta del foco tras `Escape`, con el motivo ya vaciado | `CA-10.14-gl-360x640-escape-foco-devolto.png` |
| CA-10.14 | Las medidas que devolvió el navegador, sin retocar | `CA-10.14-medidas.json` |
| CA-12 | El tablero con la alerta abierta primero — es la misma captura del tablero | `CA-10.14-gl-360x640-taboleiro-foco.png` |

**Cómo se hizo y qué encontró: `_qa/SPEC-017/README.md`.** Se hizo con **Chrome
real**, conducido por CDP desde un guion que vive en `_qa/` y **no en `tests/`**,
porque la spec decidió no meter un navegador automatizado en el proyecto
(ADR-025 §5) y esto no es una suite: es el instrumento de una comprobación
manual, y no lo corre ningún gate.

## Cambio de rumbo — 2026-09-03: CA-10 queda CONGELADO a la espera de ADR-026

**Qué pasó, con fecha, para que nadie lo lea como un CA abandonado.** Con la
implementación ya en marcha —y con la hoja de estilos del panel escrita y sus
aserciones en verde— **Alberto Fojo decidió que `docs/diseno/` es el sistema de
diseño del proyecto y que el panel del operador lo sigue también**. Eso
contradice **ADR-025 §4.2 y §4.3**, que prohíben a una interfaz de medición
importar, derivar o copiar nada de `docs/diseno/`, y `sdd-arquitecto` está
escribiendo **ADR-026** para superseder parcialmente ese punto. Hasta que esté
firmado, la regla vieja sigue escrita y **ya se sabe que va a caer**.

**Qué se congela: CA-10 entero** —foco visible, toque de 44 px, dígitos
tabulares, hoja de estilos aislada— **y la mitad manual de CA-10.7**, que no se
ha hecho: no hay ninguna captura en `_qa/SPEC-017/` y no debe haberla todavía.

**Qué se retiró, y por qué se retiró en vez de dejarse:**

- `src/admin/view/styles.ts`, con su paleta propia (`#ffffff` / `#101010` /
  `#0b3d91`). Escribirla ahora era escribir una paleta para tirar.
- El `<style>` en línea del documento y el guion de progresión de `Escape`
  (ADR-025 §2.5, que viaja con CA-10).
- `tests/admin/view.test.ts` entero. Una de sus aserciones decía que **ningún
  color de `docs/diseno/` aparece en la hoja del panel**; bajo ADR-026 eso será
  exactamente lo contrario de lo que hay que afirmar. Una aserción que dice lo
  opuesto de la regla que viene no es cobertura: es una trampa para quien la lea
  después.

**Qué sobrevive, porque no es estilo**, y vive ahora en
`tests/admin/document.test.ts`: que el panel **no se anuncia** (CA-1.10, que es
de ADR-024 y no de ADR-025), que su documento **no carga nada de fuera**, que
**no renderiza ninguna imagen** (ADR-013 §4 y §5), que **cada estado y cada
cualificador es un nodo de texto que lo nombra** (ADR-013 §2 — y ADR-013 sigue
mandando entero) y lo que CA-12 exige que el operador tenga delante.

**Qué entrega el panel mientras tanto: MARCADO SEMÁNTICO SIN APARIENCIA
DECIDIDA.** Ni un color, ni una tipografía, ni un token inventado. Las clases
`score`, `instant`, `num` y `scroller` siguen en el marcado como **enganches**,
porque son estructura y no apariencia; qué hacen con ellas los tokens de
`docs/diseno/` lo decide CA-10 cuando se descongele.

**Los otros doce criterios no cambian y están implementados y probados.**

**Y hay un punto abierto que el arquitecto tiene que resolver y que afecta a
este panel**, anotado aquí para que no se pierda: el sistema de `docs/diseno/`
pinta `provisional` como excepción y en este proyecto `provisional` es el estado
**normal** (entrada 1 del inventario de EPIC-004). El tablero de este panel ya
está construido **sin** apoyarse en esa decisión —se ordena por lo que necesita
a una persona, no por cualificador (CA-12.3)—, así que la resolución de ADR-026
no debería obligar a reescribirlo.

### Contestado — ADR-026 escrito, y qué cambia en CA-10 (`sdd-arquitecto`, 2026-09-03)

**Tu punto abierto era el correcto y era el que bloqueaba.** Lo resuelve
**ADR-026 §2**, en la dirección que suponías: **ninguno de los dos cualificadores
se apaga**. Los dos van con el color de texto principal, **los dos llevan
etiqueta** —también `confirmado`, que el sistema deja mudo porque «el normal no se
anuncia»— y lo que los distingue es el texto, no la falta de color. **Tu tablero
no se reescribe**: ordenar por lo que necesita a una persona era lo correcto y
CA-12.3 no cambia. Y **retirar `tests/admin/view.test.ts` fue el juicio correcto**:
su aserción decía lo contrario de ADR-026 §3.

**CA-10 pasa de 7 a 15 subpuntos**, y lo demás de la spec no cambia. Se pudo
reescribir porque **la spec no está cerrada** (ADR-015 gobierna las cerradas).

**Corrección al paso 1 de tu plan de retomada, y es importante: `src/design/` NO
se construye solo de `_tokens.css`.** Al inventariar el artefacto entero
aparecieron seis hechos que no se sabían, y dos de ellos cambian el trabajo:

1. **`_tokens.css` no lo usa ningún artboard.** Los seis `.dc.html` duplican su
   `<style>` y escriben hexadecimales en línea. Es un **documento de referencia**,
   no la definición ejecutable. Por eso ADR-026 §3.2 construye `src/design/` de
   **tres** fuentes: los 13 colores y 2 familias de `_tokens.css`, **las escalas
   declaradas en prosa en `Main.dc.html`** (paso de 4 px, radios 8·10·14·999, los
   cinco roles tipográficos) y **los tres colores en uso sin token** —`#131211`,
   `#1E1A16`, `#1D1A16`—.
2. **El sistema no tiene tokens de espaciado, radio, sombra, tamaño ni peso**, y
   **incumple sus propias escalas** (huecos de 3, 5, 6, 7, 10, 14, 28; radios 7,
   12, 6). **Se adopta lo declarado, no lo practicado**, y **CA-10.4 declara que
   esa mitad ningún test la puede comprobar**: ahí la adherencia la sostiene la
   revisión humana.
3. **Cero foco, cero teclado, cero componentes de formulario** en los diez
   ficheros. Tu paso 2 acertaba: **ADR-025 §2 y §3 sobreviven enteros** porque el
   sistema no cubre nada de lo que ellos cubren. Y **CA-10.15 declara** que los
   controles del panel **hay que inventarlos dentro del lenguaje del sistema**,
   que no es lo mismo que aplicarlo.
4. **`provisional` va solo por color en Móvil y en Global**: el sistema incumple
   **ADR-013 §2** dentro de sí mismo. **No se hereda** (ADR-026 §4.1) — la
   etiqueta va siempre, en todas las anchuras.
5. **`?` y `!` como etiquetas, y `FIN`/`APR`/`DESC` como estados**: intraducibles
   y fuera de `dominio.md`. **No se heredan** (§4.2, §4.3). Y **`Directo` aparece
   en siete ficheros** donde `dominio.md` dice *En xogo* (§4.4).
6. **El botón primario del sistema sale a ≈43 px y la fila compacta a ≈34 px**,
   con la concesión declarada en voz alta. **Gana ADR-025 §3** (§4.5).

**El `@import` de Google Fonts no llega al código** (§3.5): fuentes autoalojadas,
solo los pesos que se usan, y **ninguna petición a un tercero desde el navegador
de quien abre el panel**. Es CA-10.6, y la spec que elija el mecanismo declara la
dependencia nueva.

**Sigue todo congelado hasta que Alberto Fojo firme ADR-026**, que está en
`borrador`.

## CA-10 descongelado — evidencia subpunto a subpunto (`sdd-implementador`, 2026-09-03)

**ADR-026 quedó `aprobada` (commit `2278cb1`) y CA-10 se implementó entero**, en
la letra nueva del arquitecto: quince subpuntos, no siete. Aquí va cada uno con
lo que lo sostiene, para que el verificador no tenga que reconstruirlo.

**Gates de esta pasada, con el CSS de CA-10 dentro** (medidos sobre `1c9dd45`):
`npm run gates` → **137 ficheros, 1515 casos, todos verdes**, `Type Errors: no
errors`, `next build` con `ƒ /admin` y `ƒ /es/admin` en la tabla de rutas;
`npm run test:db` → **26 ficheros, 339 casos, todos verdes**.

### Los tokens (ADR-026 §3)

| # | Qué pide | Evidencia |
|---|---|---|
| **10.1** | Un solo domicilio; el panel no declara ni un color, ni una familia, ni un radio, ni un valor de escala | `src/design/tokens.ts` y `src/design/system.ts`. `tests/admin/style.test.ts` **casos 1-5**: el módulo de la hoja no tiene **ni un** `#rrggbb`, ni `rgb(`, ni `hsl(`; toda `font-family` fuera de un `@font-face` es `var(--sans)` o `var(--mono)`; fuera del `:root` **generado** no queda un solo hexadecimal, y cada `var(--x)` apunta a una fila de la tabla. **Control positivo (caso 5)**: un `#rrggbb` en la hoja pone rojo el mismo mecanismo del caso 1 |
| **10.2** | Paridad token a token, con tabla de correspondencia y lista cerrada de divergencias; el complemento vacío | `tests/design/parity.test.ts` **casos 1-9**. El mecanismo es **uno solo y parametrizado** (`parityOffences`), así que los controles ejercitan el mismo predicado y no una comprobación escrita dentro del caso. **Cuatro controles positivos**: torcer un valor (caso 5), **vaciar la tabla** (caso 6: quedan huérfanos los 15 tokens que no son divergencia), **vaciar las divergencias** (caso 7: `--fg-prov` queda huérfano, que es exactamente el que falta) y **añadir un token nuevo** al sistema (caso 8: rojo nombrándose, sin que nadie sepa que existe) |
| **10.3** | Las divergencias son las tres de ADR-026 §3.4 y ninguna más | `tests/design/parity.test.ts` **casos 10-12**: la lista tiene **exactamente tres** entradas, en ese orden, cada una con más de 120 caracteres de motivo; `--fg-prov` no existe en el código **ni por nombre ni por valor**; y ningún nombre emitido contiene `marca`, `directo` ni `alerta`, con la traducción escrita y auditable |
| **10.4** | Residuo: la paridad solo cubre color y familia | `tests/design/parity.test.ts` **casos 13-15**, y está escrito en la cabecera de `src/design/tokens.ts` y en el propio bloque `describe`. El caso 13 **mide** que el sistema no tiene ni un token de espaciado, radio, sombra o tamaño; el 14 y el 15 comprueban que las escalas del código son las **declaradas en prosa** en `Main.dc.html` (`4 · 8 · 12 · 16 · 24 · 32 · 48`, `Radios 8 · 10 · 14 · 999`) y que los cinco roles son los que el sistema nombra con su par `px / peso`. **Destino: EPIC-004; disparador: el deshielo** |
| **10.5** | `docs/diseno/` no se edita | `tests/design/parity.test.ts` **caso 16**: `_tokens.css` sigue con su `@import`, su `--fg-prov` y su `--directo` **intactos**. Y en el diff: `docs/diseno/` no aparece |
| **10.6** | Fuentes autoalojadas; el panel no le pide nada a ningún tercero | `tests/admin/style.test.ts` **casos 6-8** y `tests/design/parity.test.ts` **caso 17**: ni la hoja ni el marcado nombran `fonts.googleapis.com`, `fonts.gstatic.com`, ningún `@import` ni ningún `https?://`; las cinco caras existen en `public/fonts/` con su OFL; y **no se sirve ninguna cara que no esté declarada** (el directorio y `LOADED_FACES` son el mismo conjunto). Comprobado además **en el navegador**: `document.fonts.check('16px Geist')` y `'16px "Geist Mono"'` → `true` |

### Lo que NO se hereda del sistema (ADR-026 §4)

| # | Qué pide | Evidencia |
|---|---|---|
| **10.7** | Ningún cualificador se apaga; los dos llevan etiqueta, `confirmado` incluido; nada por debajo de 4.5:1 | `tests/admin/style.test.ts` **casos 9-11 y 13**. El caso 9 afirma la regla `.q-provisional,.q-confirmado{color:var(--fg)}` y que **ninguno de los dos aparece en una segunda regla**. El **caso 10 recorre el árbol renderizado para los CUATRO cualificadores** y afirma que la celda existe y su texto es el literal del bundle — `confirmado` incluido, que es el que el sistema deja mudo. El caso 13 **calcula** el contraste (luminancia relativa de WCAG) de `fg`, `fgMuted`, `amber`, `alert` y `accentLive` contra `--bg` **y** contra `--bg-elevated`: todos ≥ 4.5:1. **Control positivo (caso 11)**: apagar uno o dejarlo mudo rompe la regla que el caso 9 afirma |
| **10.8** | `confirmado` no se pinta con el acento de marca | `tests/admin/style.test.ts` **caso 12**: ninguna regla `.q-…` **ni ninguna regla `.s-…`** contiene `--brand` |
| **10.9** | Literales del glosario, nunca un glifo ni una abreviatura; `live` es *En xogo* | `tests/admin/style.test.ts` **casos 14-16**: los cinco estados salen de `statusesBundle`; `live` es **En xogo** / **En juego** y el documento **no contiene `Directo`**; y no aparece `FIN`, `APR` ni `DESC`. Medido también en el navegador: `s-live = "En xogo"` |

### El suelo de ADR-025, que el sistema no cubre

| # | Qué pide | Evidencia |
|---|---|---|
| **10.10** | Foco visible ≥ 2 px y ≥ 3:1, sin `outline:none` sin sustituto, sin `tabindex` positivo, `Escape` que devuelve el foco | `tests/admin/style.test.ts` **casos 17-23**. El anillo es `outline:2px solid var(--fg)` con offset; el contraste se **calcula** contra los tres fondos (`bg`, `bg-elevated`, `bg-step`); no hay `outline:none` ni `outline:0`; ningún `tabindex` positivo; nada modal. **Control positivo (caso 20)**: quitar el sustituto pone rojo el caso 17. **`Escape` comprobado en el navegador**: el `textarea` queda vacío y el foco pasa al enlace `[data-cancel]` con su anillo (`04-escape-foco-devolto.png`) |
| **10.11** | Toque ≥ 44 × 44 px como constante en un solo sitio, y campos ≥ 16 px | `tests/admin/style.test.ts` **casos 24-26**: `TOUCH_TARGET_PX` se declara **una vez** en `src/design/tokens.ts`, la hoja **no escribe el `44` ni una vez** (lo interpola), la regla cubre `a, button, input, select, textarea, summary`, y `INPUT_FONT_PX` es 16 y **gana** sobre el rol `team` del sistema, que es 15. Medido en el navegador: `input`, `select`, `button` y `a` a **44 px** de alto y `font-size: 16px` |
| **10.12** | Nada solo por color, dígitos tabulares, ninguna imagen | `tests/admin/style.test.ts` **casos 27-29**: **cada** nodo con clase `s-…` o `q-…` del árbol renderizado tiene texto dentro; `tabular-nums` y `'tnum' 1` sobre `.num, .score, .instant`; cero `<img>`, `<svg>` y `<picture>` en las dos pantallas; ni `background-image` ni ningún `url(` que no sea una cara propia |
| **10.13** | Hoja propia, alcanzable solo desde las rutas del panel, y `globals.css` sin editar ni cargar | `tests/admin/style.test.ts` **casos 30-32**: ningún módulo de `src/admin/` importa CSS ni nada de `@/site/`; el documento del panel **no contiene ni `--paper`, ni `--ink`, ni ninguno de los cinco colores de `globals.css`**; y la hoja **no se sirve por ninguna URL** — va en línea, que es la lectura más estricta de lo que sobrevive de ADR-025 §4.2. En el diff, `src/app/globals.css` intacto |

### Lo que solo ve un navegador

| # | Qué pide | Evidencia |
|---|---|---|
| **10.14** | A 360 × 640, teclado solo, foco visible en cada parada, `Escape`, sin scroll horizontal, capturas | **HECHO A MANO** con **Chrome real** a 360 × 640: `_qa/SPEC-017/`, cuatro capturas, `CA-10.14-medidas.json` y `README.md` con el método y los números. `document.scrollWidth / clientWidth = 360 / 360` en las dos pantallas; la tabla ancha scrollea **dentro de `.scroller`** (856 vs 344); del `select` al `textarea` en **3 tabuladores**; el motivo se escribió **con el teclado**. **Encontró un defecto que ningún test estático veía** —la tabla partía los nombres canónicos de la RFGF carácter a carácter a 360 px— y está arreglado (`width:max-content;min-width:100%`), con la captura tomada **después** |
| **10.15** | Residuo: el sistema no trae ni un componente de formulario ni un estado de foco | Declarado en la cabecera de `src/admin/view/styles.ts`, donde se escribe: los controles del panel **son nuevos y solo su vocabulario es del sistema**. Este criterio **no promete** que el panel salga dibujado del sistema, solo que no se aparte de él. **Destino: EPIC-004, cuya entrada 3 sigue abierta sobre el artefacto; disparador: el deshielo** |

### Lo que la fuente cuesta, dicho entero

Se autoaloja **copiando cinco caras `.woff2` del paquete `geist@1.7.2` de Vercel
a `public/fonts/`**, con su `LICENSE.txt` (OFL 1.1) al lado. **No se añade
ninguna dependencia de npm**: nada de `src/` importa el paquete, así que
`ALLOWED_PACKAGES` no cambia. Los pesos son **exactamente los que los roles
usados piden**: Geist 400, 500 y 600, y Geist Mono 500 y 600 — 256 KB en total.

**El rol `display` (44 / 800) no se carga, y no es un descuido**: el panel no lo
usa —no tiene ficha de partido, tiene una cola de trabajo y formularios— y
cargar su cara sería cargar un peso que nadie usa (ADR-026 §3.5). El rol **queda
declarado** en `src/design/tokens.ts` porque ése es el domicilio del lenguaje del
sistema para toda interfaz, y la ficha del snapshot lo va a querer. **Y quien
llegue ahí tiene una decisión esperándole, escrita en el propio módulo:** Vercel
distribuye el peso 800 de Geist **solo en cursiva** como cara estática; las
verticales son 700 y 900. El 800 exacto pide la cara variable, que es un fichero
con todos los pesos dentro — y eso cambia «solo los pesos que se usan» por una
sola petición. Es un compromiso real y **es de la spec que primero necesite
`display`**, no de ésta (F-SPEC-017-10).

## Salvedades / follow-ups
<!-- IDs F-SPEC-017-1, F-SPEC-017-2… con destino (spec futura o EPIC-MEJORA). -->

**Lo que ya estaba declarado en el cuerpo de la spec** —el vale que no es de un
solo uso (CA-7.5), la cota inferior de `operator_actions` (CA-8.4), el límite de
la lista blanca ante el contenido del motivo (CA-3.9), las dos implementaciones
de comparación en tiempo constante, F-SPEC-013-11 contestado sin cerrarse
(CA-2.6), las entradas 1 y 5 del inventario de EPIC-004 y F-SPEC-001-1— **no se
renumera aquí: se cita**, y cada uno tiene su caso que lo repite donde el
mecanismo juzga.

Lo que la implementación abre, con su id:

- **F-SPEC-017-1 — `src/decide/read-entry.ts` es una DESVIACIÓN DECLARADA del
  §1 de la spec, y es la decisión más importante que tomé.** El §1 dice que
  `src/decide/` «no se edita». CA-12.1 y CA-12.2 exigen que el panel enseñe la
  `Decision` vigente y **el log entero**, y la frontera de SPEC-013 CA-13 hace
  eso **imposible desde fuera de `src/decide/`** por sus dos mecanismos:
  `PostgresDecisionStore`/`DecisionStore` son rojos en cualquier fichero que no
  sea escritor declarado, y **nombrar la tabla `decisions` en una plantilla SQL
  también**. Así que no cabía ni en `src/admin/` ni en `src/db/admin.ts`.
  Lo resolví con **un FICHERO NUEVO en `src/decide/`**, con la forma y el
  precedente exactos de `engine-entry.ts`, que SPEC-015 añadió para la mitad de
  escritura: devuelve **valores** (`Decision`), ningún almacén, se importa **por
  nombre**, no alcanza `src/polite/http.ts`, y **`DECISION_WRITERS` sigue
  teniendo dos entradas** (caso 12 de `tests/admin/frontier.test.ts` y caso 1 de
  `tests/decide/rn08-frontier.test.ts`, sin tocar una aserción). Lo único que
  crece es la **aserción derivada** del caso 10 de ese fichero —la enumeración
  de quién cruza los nombres—, con el motivo escrito en el mismo diff, que es
  literalmente lo que hizo SPEC-015 con `engine-entry.ts`.
  **Destino: ratificación de `sdd-arquitecto`.** Si prefiere otra forma, es un
  fichero y su test; no toca nada más.
- **F-SPEC-017-2 — CERRADO el 2026-09-03, revisado con ADR-026 firmado: las
  rutas siguen siendo `route.ts` y no `page.tsx`.** El motivo está escrito en
  los dos ficheros de ruta, que es donde se decide, y son **cuatro**:
  1. **`src/app/globals.css` no se edita NI SE CARGA.** ADR-025 §4.1 sigue
     INTACTO (ADR-026 §5) y un manejador de ruta **no lo envuelve ningún
     layout**, así que la hoja del sitio nunca entra en este documento. Con una
     `page.tsx` bajo `(gl)/` sí entraría.
  2. **ADR-026 §3.6 hace el panel oscuro-only** y el sitio público sirve claro
     por defecto. Bajo una página, las **dos bases opuestas** compartirían
     documento; así **no se tocan por construcción**, que es el estado que la
     entrada 6 del inventario de EPIC-004 describe como el bueno. Un caso lo
     afirma (`style.test.ts` 31): el documento del panel no lleva ni `--paper`,
     ni `--ink`, ni ninguno de los cinco colores de `globals.css`.
  3. **CA-13.3 y CA-13.4 dejarían de tener sujeto.** Una `page.tsx` no
     construye ninguna `Response`, así que «se construye con
     `new Response(JSON.stringify(…))` y nunca con `Response.json`» sería un
     criterio sobre nada.
  4. **La fuente se autoaloja igual, y de forma más auditable**: `@font-face`
     escrito en nuestra propia hoja, con una URL de nuestro origen que un test
     lee (`style.test.ts` 7).
  **El precio, dicho en voz alta y no escondido:** se pierde la optimización de
  `next/font` —el `preload` automático de la cara y las métricas de la fuente de
  respaldo, que reducen el salto de maquetación al cargar—. Es el coste de la
  decisión, no un efecto secundario que se descubra después. **Se revisa el día
  que el panel deje de ser un manejador de ruta**, y si eso pasa, `next/font`
  vuelve a estar sobre la mesa.
- **F-SPEC-017-3 — `ADMIN_OPERATORS` y `ADMIN_SESSION_SECRET` no están
  documentadas en ningún runbook ni en `.env.example`.** ADR-024 §Consecuencias
  lo dejó dicho —«van al runbook de configuración»— y esta spec no declara ese
  fichero entre lo que toca, así que no lo he tocado. Sin esas dos variables el
  panel **falla cerrado y es ruidoso a propósito**, así que no rompe nada; lo que
  falta es la instrucción de cómo generarlas (`ADMIN_OPERATORS` guarda el
  **digest** SHA-256 hex del secreto, nunca el secreto). **Destino:
  `sdd-documentalista` tras el GREEN.**
- **F-SPEC-017-4 — `tests/polite/support/capability.ts` crece en cuatro
  entradas, y las cuatro necesitan el ojo del verificador.** `node:crypto` gana
  `createHmac` en su superficie (la sesión y el vale se firman con HMAC-SHA-256,
  ADR-024 §3 y §4), y `ALLOWED_GLOBALS` gana `Array` (`isArray`, para no fiarse
  de la forma de un vale decodificado), `URLSearchParams` (leer el cuerpo de un
  formulario) y `encodeURIComponent` (el enlace propio al detalle de un
  partido). **Ninguna de las cuatro le pide bytes a un tercero**, que es lo único
  que habría necesitado una firma humana, y las cuatro llegan con su motivo
  escrito. **Destino: revisión del verificador en el diff.**
- **F-SPEC-017-5 — un `match_id` o un `alert_id` que no existen NO dejan fila en
  `operator_actions`.** Está declarado en el propio `handler.ts`, donde se
  decide: el objetivo de una fila es una **clave ajena** a `matches` o a
  `alerts` (migración 0008), así que una fila sobre un partido que no existe no
  es representable — y tampoco es un acto de operación, porque este panel nunca
  sirvió un formulario para él. Lo que CA-8.2 nombra —«partido fuera de
  jornada»— **sí deja su fila**, y hay caso (caso 12 de `flow.test.ts`).
  **Destino: EPIC-MEJORA si alguien quiere contar también los envíos con
  objetivo inexistente; disparador: el día que eso pase alguna vez.**
- **F-SPEC-017-6 — la purga del archivo humano es POR FAMILIA, no por día.** El
  renglón de runbook de CA-3.8 borra `objects/operador/` y `objects/corresponsal/`
  enteros, y no puede cortar por día: sus claves llevan el **tipo de evento**
  donde toda fuente automática lleva un `competition_id`, que es la
  irregularidad que ADR-023 §2 y ADR-024 §6 declaran. Mientras haya **una**
  jornada declarada a la vez —el régimen que ADR-019 §3 entrega— purgar la
  familia y purgar la jornada son lo mismo. **Disparador: dos jornadas
  declaradas vivas a la vez.** Está escrito también en el runbook.
- **F-SPEC-017-7 — CA-9.4 pasa, y su alcance real es más estrecho de lo que
  suena.** `tests/site/no-hardcoded-literals.test.ts` sigue verde, las dos rutas
  nuevas están dentro de `siteSources()` y **no se añadió ninguna excepción**.
  Pero sus tres reglas son de JSX y **solo se aplican a los `.tsx`**, y las
  rutas del panel son `.ts`: lo que de verdad guarda los literales del panel es
  CA-9.3 —`AdminText`, cuyo constructor no se exporta, así que un literal en
  `src/admin/` **no compila**— más el mecanismo de `frontier.test.ts` que
  prohíbe cualquier literal visible de estado o de cualificador. Se dice aquí
  para que nadie lea CA-9.4 como si cubriera más de lo que cubre.
- **F-SPEC-017-8 — CERRADO el 2026-09-03. CA-10 estaba congelado y ya no lo
  está.** ADR-026 quedó `aprobada` (`2278cb1`), el arquitecto reescribió el
  criterio de 7 a 15 subpuntos, y los quince están implementados y probados: ver
  *CA-10 descongelado — evidencia subpunto a subpunto*. La hoja de estilos
  volvió, esta vez **derivada del sistema** y sin un valor propio, y la suite de
  estilo vive en `tests/admin/style.test.ts` y `tests/design/parity.test.ts` —
  **no** en el `tests/admin/view.test.ts` que se retiró, cuyas aserciones decían
  lo contrario de lo que ADR-026 acabó diciendo.

Y lo que la implementación de CA-10 abre:

- **F-SPEC-017-9 — el rol `display` del sistema no tiene cara estática vertical
  en el peso que declara.** El sistema escribe `display: 44 / 800` y Vercel
  distribuye el 800 de Geist **solo en cursiva**; las verticales son 700
  (`Bold`) y 900 (`Black`). El panel **no usa `display`**, así que aquí no
  muerde y su cara no se carga; la ficha de partido del snapshot sí lo va a
  usar, y tendrá que elegir entre la **cara variable** —un fichero con todos los
  pesos, que cambia «solo los pesos que se usan» por una sola petición— y
  desviarse a 700 o 900 **declarándolo como divergencia**. Está escrito en
  `src/design/tokens.ts`, junto a `LOADED_FACES`. **Destino: la spec del
  snapshot; disparador: la primera interfaz que use el rol `display`.**
- **F-SPEC-017-10 — la adherencia a la escala no la comprueba nada, y no es
  culpa de esta spec.** `_tokens.css` declara **color y familia y nada más**:
  cero tokens de espaciado, radio, sombra, tamaño, peso o duración (medido,
  caso 13 de `parity.test.ts`). El espaciado, los radios, la escala tipográfica
  y la densidad **no se pueden comparar contra nada**, así que ahí la adherencia
  la sostiene la revisión humana. Lo declara ADR-026 §3.3, lo repite CA-10.4 y
  lo repite la cabecera de `src/design/tokens.ts`. **Destino: EPIC-004**,
  convertir sus escalas en tokens; **disparador: el deshielo.**
- **F-SPEC-017-11 — el guardián de `telegram_user_id` de SPEC-015 CA-10.4 tiene
  un modo de FALSO POSITIVO sobre datos comprimidos que su criterio no
  declara.** Una de las capturas de `_qa/SPEC-017/`, tal como Chrome la
  escribió, llevaba en su flujo de compresión una tirada de once dígitos, y el
  caso 28 de `tests/bot/frontier.test.ts` la marcó como un identificador de
  Telegram. **No se tocó el guardián ni su lista de exclusiones**: su premisa
  —«un identificador escrito dentro de un binario está igual de versionado»— es
  correcta y es de una spec cerrada. Se **recodificó el PNG** sin pérdida (mismo
  tamaño, mismos píxeles) y el flujo nuevo ya no lleva la tirada. Lo que queda
  abierto es que **el mecanismo puede volver a dar rojo por azar** con cualquier
  captura futura, y su criterio no lo dice. **Destino: `sdd-arquitecto`;
  disparador: la segunda vez que ocurra** — que con la interfaz del marcador
  produciendo capturas es cuestión de tiempo.
- **F-SPEC-017-12 — el guion de la comprobación manual se versiona con
  extensión `.txt`.** `.mjs` es una extensión de CÓDIGO declarada en
  `SCAN_EXTENSIONS` (SPEC-008 CA-2.6), y un fichero de código fuera de las
  raíces del escaneo es **rojo** — con razón, porque así es como F-SPEC-008-V37
  metió una ruta viva sin auditar. El guion **no es código que el repositorio
  ejecute**: es el instrumento de una persona haciendo una comprobación manual,
  y no lo corre ningún gate. Se guarda legible y **fuera del conjunto que la
  frontera audita, sin ensanchar ninguna lista de exclusiones**. **Destino: la
  spec que automatice la comprobación** (ADR-025 §5, disparador ya escrito: la
  primera spec que construya la interfaz del marcador).

### Enmienda escrita fuera de esta spec (ADR-015)

El gate decidió traducir los cualificadores, así que `src/i18n/es.ts` gana el
espacio de nombres `qualifiers` y **una aserción de SPEC-004 CA-4 deja de ser
cierta** (`expect(es).not.toHaveProperty('qualifiers')`). El cuerpo de SPEC-004
**no se edita**; la enmienda está escrita en su ledger, bajo
`## Enmienda — 2026-09-03`, y el caso sigue afirmando lo que CA-4 protege de
verdad: que `qualifiers` **no entra en la paridad del sitio**.


## Cómo retomar (handoff)
<!-- Estado real del trabajo para la siguiente sesión: qué está hecho, qué falta, dónde seguir. -->

**Estado al 2026-09-03, al terminar `sdd-implementador`. LOS TRECE CRITERIOS
ESTÁN ENTREGADOS.** En `ft/SPEC-017-panel-do-operador`, sobre `81a10f5`:

| Commit | Qué trae |
|---|---|
| `ba0be1c` | El esqueleto de `src/admin/`, `migrations/0008`, `src/db/admin.ts`, `src/decide/read-entry.ts`, las dos rutas, y la enmienda de ADR-015 en el ledger de SPEC-004 |
| `6263f27` | Las suites sin base: sesión, vale, archivo, bandeja, tablero, i18n y fronteras, más la edición del runbook de purga |
| `81f0cd5` | Las suites contra Postgres: el esquema de `0008` y la jornada del panel con el motor real |
| `62c8da5` | El congelado de CA-10: se retiran la hoja de estilos y sus aserciones |
| `1c9dd45` | **CA-10 descongelado**: `src/design/`, la hoja derivada del sistema, las fuentes autoalojadas, y la comprobación manual con navegador |
| `2de2b9f` · `571b643` · `212fc85` | El ledger: evidencia visual, los quince subpuntos de CA-10, y los hallazgos |

**Gates, medidos sobre `1c9dd45`, con el CSS de CA-10 dentro:**

- `npm run gates` (typecheck → lint → build → test): **137 ficheros, 1515 casos,
  todos verdes**; `Type Errors: no errors`; `next build` con `ƒ /admin` y
  `ƒ /es/admin` en la tabla de rutas.
- `npm run test:db` aparte: **26 ficheros, 339 casos, todos verdes**.

**Lo que NO queda pendiente de esta spec.** No hay ningún criterio a medias y no
hay ningún trozo de CA-10 aplazado: la hoja está escrita, la paridad se
comprueba, las fuentes se sirven de nuestro origen y la mitad manual está hecha
con capturas. Lo que queda son **hallazgos con destino escrito** —F-SPEC-017-1,
3, 5, 6, 7, 9, 10, 11 y 12— y los residuos que el cuerpo de la spec ya declaraba.

**Lo que sigue esperando a alguien que no soy yo:**

- **`sdd-verificador`**: el veredicto. Empieza por las tres fronteras de ADR-016
  (CA-1, CA-2, CA-13), por la paridad de tokens de CA-10.2, y por el diff de
  `docs/diseno/` y `globals.css`.
- **`sdd-producto`**: el **cambio de alcance de EPIC-004** (ADR-026 §6) en su
  `_epica.md` y en el roadmap. **No es trabajo de esta spec y sin él el ADR y la
  épica se contradicen desde el día uno.**
- **`sdd-documentalista`**, tras el GREEN: `src/admin/`, `src/design/` y
  `public/fonts/` son estructura nueva en `CLAUDE.md`; `migrations/0008`, una
  migración más; y **F-SPEC-017-3** —cómo se generan `ADMIN_OPERATORS` (el
  **digest** SHA-256 hex, nunca el secreto) y `ADMIN_SESSION_SECRET`— sigue sin
  runbook.

**Y una advertencia para quien retome, que es la misma de antes y no ha
cambiado:** el panel **entrega apagado y hay que dejarlo así**.
`MEASUREMENT_WINDOWS` sigue vacía —se declaró una jornada temporal para la
comprobación manual y **se revirtió antes de commitear**, verificado en el
diff—, `ADMIN_OPERATORS` no existe y `ADMIN_SESSION_SECRET` tampoco. Encenderlo
es un acto posterior con su propia ceremonia.

---

**Follow-up que no es de esta spec pero nace de su ADR, anotado aquí para que no
se pierda:** `sdd-producto` tiene que escribir el **cambio de alcance de
EPIC-004** en su `_epica.md` y en `docs/roadmap.md` (ADR-026 §6) — salen de ella
el panel del operador y los tokens como código, **entra** la reparación del
propio artefacto (escalas como tokens, foco, componentes de formulario, la
etiqueta de `provisional` en las tres vistas, el vocabulario alineado con
`dominio.md`), y su **entrada 1 queda cerrada** por ADR-026 §2 mientras la 2, 3,
4 y 6 siguen abiertas. **Si esa edición no ocurre, el ADR y la épica se
contradicen desde el día uno**, que es exactamente la patología que hizo nacer a
EPIC-004. **No es trabajo de `sdd-arquitecto`: las épicas y el roadmap son de
`sdd-producto`.**
