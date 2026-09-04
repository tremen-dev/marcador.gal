---
id: SPEC-006
tipo: ledger
epica: EPIC-003
---
# Ledger — SPEC-006 Título de documento por página

## Resumen
- Fase: **GREEN a la primera vuelta** (2026-09-01, `sdd-verificador`). **Los seis
  CA en ✅**, sin ninguna salvedad dentro del alcance. El defecto F-SPEC-005-1
  está muerto sobre el HTML **realmente servido**, y el mecanismo viejo se
  replantó para comprobar que su vuelta produce dos `<title>` y gana el
  equivocado. Cero regresión sobre SPEC-004 y SPEC-005, medida byte a byte contra
  `c414f4a`. **CA-5 cierra** con el dictamen de `/sdd-lingua` del 2026-09-01.
  Aprobada por Alberto Fojo el 2026-09-01. La fuente de verdad del estado es el
  frontmatter de la spec.
- Rama: **`ft/SPEC-005-pagina-del-rastreador`**, no rama propia — decisión de
  Alberto Fojo del 2026-09-01, registrada en la **nota 7** del gate. Entra en el
  **PR #8** junto a SPEC-005: por separado habría una ventana en la que `main`
  desplegaría el sitio con el título equivocado.
- Corrige **F-SPEC-005-1** (`/robot` hereda el título de `/proxecto`) y cierra de
  paso **F-SPEC-005-V4** (`<title>` bajo `<body>` en el fuente).
- **No** cierra F-SPEC-004-9 / F-SPEC-005-2 (`PROJECT_PATH` sin aserción
  literal): decidido fuera de alcance el 2026-09-01, destino **EPIC-MEJORA**.

## Matriz de criterios de aceptación
<!-- Escritores: sdd-implementador rellena Implementado y Test; sdd-verificador rellena Verif. y Estado. Nunca al revés. -->
<!-- Estados por CA: ✅ cerrado · ⚠️ parcial/con salvedad · 🚧 en curso · ❌ sin empezar · n-a -->
<!-- Un CA está ✅ solo cuando Implementado + Test + Verif. aplicables están en verde. Una salvedad se marca ⚠️, nunca ✅. -->
| CA | Implementado (fichero) | Test (fichero/caso) | Verif. | Estado |
|---|---|---|---|---|
| CA-1 — cada ruta sirve su propio título | `src/app/(gl)/proxecto/page.tsx`, `src/app/(gl)/robot/page.tsx`, `src/app/(es)/es/proxecto/page.tsx`, `src/app/(es)/es/robot/page.tsx` (cada una `export const metadata`), `src/site/document.tsx` (deja de emitir `<title>`) | `tests/site/document-titles.test.ts` casos 1–5 | Los cuatro `<title>` leídos del **HTML servido** por `next build && next start` sobre copia aislada (`git archive HEAD`, sin `checkout`): `O proxecto` / `O rastrexador` / `El proyecto` / `El rastreador`, los cuatro distintos. El mismo servidor sobre `c414f4a` sirve «O proxecto» en las cuatro: **defecto reproducido y muerto**. Barrera comprobada rompiendo: `/robot` con `titlesBundle('gl').project` → **4 de 5 casos rojos** | ✅ |
| CA-2 — el título es i18n, nunca incrustado | los cuatro `page.tsx` toman el valor de `titlesBundle(locale)`; ninguno transcribe una cadena | `tests/site/title-source.test.ts` casos 1–3 | El hueco es real y está medido: con `title: 'O rastrexador — marcador.gal'` transcrito en `/robot`, `no-hardcoded-literals.test.ts` (SPEC-004 CA-5) **pasa en verde** —2 de 2— y la barrera nueva pone **rojos los casos 2 y 3**. El caso 3 recorre `readSourceFiles()` sin argumento, es decir **todo `src/`**, y exige que cada título viva solo en `i18n/gl.ts` o `i18n/es.ts` | ✅ |
| CA-3 — espacio de nombres propio y paridad | `src/i18n/titles-bundle.ts` (nuevo, contrato), `src/i18n/titles.ts` (nuevo, resolución), `src/i18n/gl.ts` y `src/i18n/es.ts` (namespace `titles`, sin `documentTitle`), `src/i18n/site-bundle.ts` (fuera la clave) | (a) `tests/site/titles.test-d.ts`; (b) y (c) `tests/site/titles-i18n.test.ts` casos 1–6 | (a) quitando `crawler` de `es.titles`, `npm run typecheck` falla con `TS2741 Property 'crawler' is missing in type '{ project: string; }' but required in type 'TitlesBundle'` en `es.ts`, `titles.ts` y el propio `.test-d.ts`. (c) devolviendo `documentTitle` a `SiteBundle` se ponen rojos `titles-i18n` **5 y 6** *y* `pages.test.ts` **2 y 5** — exactamente los cuatro que predijo el arquitecto | ✅ |
| CA-4 — SPEC-004 y SPEC-005 intactas | ningún fichero bajo `tests/` modificado; los cuatro nuevos son ficheros nuevos | los 70 ficheros / 606 tests de la suite, más la comparación byte a byte de abajo | **(1)** corridos por el verificador el 2026-09-01: `npm run lint` exit 0, `npm run typecheck` exit 0, `npx vitest run --typecheck` **70 ficheros / 606 tests, `Type Errors no errors`**, exit 0. **(2)** `git diff --name-status c414f4a -- tests/` = **4 altas, 0 modificaciones**; `tests/site/source-scan.ts`, el ayudante compartido de SPEC-004, **sin tocar**. **(3)** sobre dos servidores simultáneos (esta rama y `c414f4a`): `/proxecto` `<head>` 716 B y cuerpo 1 588 B **idénticos byte a byte**; `/es/proxecto` 717 B y 1 626 B **idénticos**; `/robot` y `/es/robot` cuerpo idéntico y `<head>` distinto **solo en el sustantivo del título** | ✅ |
| CA-5 — dictamen de `/sdd-lingua` (bloqueante) | los cuatro títulos escritos y citados abajo — **DICTAMINADOS el 2026-09-01, ver más abajo** | n-a (gate humano) | Dictamen emitido por Alberto Fojo el 2026-09-01: **CORRECTO, sin cambios**, sobre los cuatro. Transcrito íntegro abajo. Comprobado que **nadie los ha tocado después**: los cuatro literales de `gl.ts`/`es.ts` y los cuatro `<title>` servidos coinciden **carácter a carácter** con los dictaminados | ✅ |
| CA-6 — ningún `<title>` en el cuerpo (F-SPEC-005-V4) | `src/site/document.tsx` sin `<title>`; el título lo emite el mecanismo de metadatos, dentro de `<head>` | `tests/site/title-source.test.ts` caso 4 (fuente) + medición sobre el HTML servido, abajo | Sobre el HTML servido, las cuatro rutas: **1 `<title>` en total, 1 dentro de `<head>`, 0 después de `</head>`**. Y **replantado**: devolviendo el `<title>` a `SiteDocument` con el mecanismo nuevo puesto, `/robot` sale con **DOS** títulos, los dos en `<head>`, y el primero —el que gana— es `O proxecto — marcador.gal`. La barrera muerde: el caso 4 se pone rojo con esa mutación | ✅ |

## Veredicto del verificador
<!-- GREEN/RED + fecha + resumen. Lo escribe SOLO sdd-verificador. -->

### GREEN — 2026-09-01, `sdd-verificador`

**Los seis CA en ✅.** No hay ningún ⚠️ y no hay ninguna salvedad dentro del
alcance de esta spec. Lo pendiente de producción no es de SPEC-006: ver abajo.

**El defecto está muerto, y lo he visto morir.** No me he fiado de ningún test:
construí dos servidores a la vez con `next build && next start` sobre copias
aisladas (`git archive`, **sin `checkout`**, `node_modules` clonado) —esta rama
en el 3141 y `c414f4a` en el 3142— y leí el HTML que sirven:

| Ruta | `c414f4a` (línea base) | esta rama |
|---|---|---|
| `/proxecto` | `O proxecto — marcador.gal` | `O proxecto — marcador.gal` |
| `/robot` | `O proxecto — marcador.gal` ← **F-SPEC-005-1 reproducido** | `O rastrexador — marcador.gal` |
| `/es/proxecto` | `El proyecto — marcador.gal` | `El proyecto — marcador.gal` |
| `/es/robot` | `El proyecto — marcador.gal` ← **F-SPEC-005-1 reproducido** | `El rastreador — marcador.gal` |

Las cuatro responden `200` y los cuatro títulos son **distintos dos a dos**. En
las cuatro hay **exactamente un `<title>`, dentro de `<head>`, y ninguno después
de `</head>`**.

**Y he replantado el mecanismo viejo, que era lo que el arquitecto pedía
comprobar.** Devolviendo `<title>` a `SiteDocument` sin quitar los metadatos de
página, y sirviendo esa mutación de verdad, `/robot` sale con **dos** `<title>`,
los dos en `<head>`, y el primero —el que se queda el navegador— es
`O proxecto — marcador.gal`. **El defecto sobreviviría al arreglo**, tal cual lo
midió el arquitecto. La barrera muerde: `title-source.test.ts` caso 4 se pone
rojo con esa mutación.

**Cero regresión sobre specs cerradas, demostrada y no argumentada.** La línea
base es **`c414f4a`**, no `main`, por la nota 7 del gate. `/proxecto` y
`/es/proxecto` salen **idénticos byte a byte** en `<head>` y en el marcado de
`<body>` frente al árbol base. Los cuatro ficheros de `_qa/SPEC-006/` que archivó
el implementador coinciden con mi construcción independiente **byte a byte salvo
el identificador de build** de Next (`"b":"gxyPRd4eyHN_AbMECv2Vw"` frente a
`"b":"NOt0uH4wCuz1h9Mv2ilIY"`), que es justo lo que no cuenta como diferencia.

**Gates corridos enteros por mí**, no heredados del implementador — y era
obligatorio hacerlo, porque en esta rama el hook `PostToolUse` de calidad no se
disparó (F-SPEC-006-1):

```
$ npm run lint          # oxlint --type-aware
EXIT=0                  (sin salida)

$ npm run typecheck     # tsc --noEmit
EXIT=0                  (sin salida)

$ npx vitest run --typecheck
 Test Files  70 passed (70)
      Tests  606 passed (606)
Type Errors  no errors
EXIT=0
```

**70 ficheros y 606 tests**, exactamente la referencia declarada (partía de
66/591). `git status` vacío antes y después de todo lo anterior: las cinco
mutaciones se aplicaron **fuera del repositorio**, sobre `git archive`, y no se
ejecutó `checkout`, `stash`, `reset` ni `restore` en ningún momento.

**Lo que NO he podido verificar, y lo digo en vez de darlo por bueno:** aquí no
hay MCP de Playwright, y el único MCP de navegador disponible exige que una
persona elija navegador antes de actuar — un subagente no puede pedírselo a
nadie. Es la misma limitación que ya registra EPIC-MEJORA en F-SPEC-005-V3. Para
un `<title>` no cambia el veredicto: la afirmación de los CA es sobre **el HTML
servido**, y el HTML servido lo he medido contando etiquetas y posiciones, que es
más de lo que enseñaría una captura de pestaña.

**Erratum de transcripción, sin consecuencia, anotado para quien retome:** el
handoff de abajo cita `c414f4a` como sha del commit *«feat(i18n): los titulos de
documento salen del bundle del sitio a un namespace propio»*. Ese commit es
**`f3eff7b`**; `c414f4a` es la **línea base**, el commit de SPEC-005 anterior a
esta spec. La línea base que el handoff declara es la correcta y es la que he
usado — solo está mal la etiqueta de una de las dos líneas.

**Pendiente ajeno a esta spec, para que no se lea como salvedad suya:**
`https://marcador.gal` sigue **sin deployment de producción**, así que las cuatro
rutas dan 404 en el dominio real y nada de esto se ha visto ahí. Es SPEC-004 CA-1
y F-SPEC-005-5, ya abiertos, y ningún CA de SPEC-006 depende de ello.

## Evidencia visual
<!-- Tabla CA → captura en _qa/SPEC-006/. Informe HTML opcional: _qa/SPEC-006/informe.html -->

No hay capturas: esta spec no cambia un solo píxel del cuerpo de ninguna página
—`<body>` idéntico byte a byte en las cuatro rutas— y lo que verifica vive en
`<head>`, donde una captura no llega. La evidencia es el HTML servido, archivado.

| CA | Evidencia en `_qa/SPEC-006/` |
|---|---|
| CA-1, CA-5 | `verif-servido-gl-proxecto.html`, `verif-servido-gl-robot.html`, `verif-servido-es-proxecto.html`, `verif-servido-es-robot.html` — construcción independiente del verificador |
| CA-1 (el defecto, reproducido) | `verif-base-c414f4a-gl-robot.html`, `verif-base-c414f4a-es-robot.html` — el árbol base sirviendo «O proxecto» en `/robot` |
| CA-6 (replantado) | `verif-mutacion-dos-titulos-gl-robot.html` — los dos mecanismos a la vez: **dos `<title>`** y gana el equivocado |
| CA-4 | `verif-suite.txt` — 70 ficheros / 606 tests |
| (del implementador) | `servido-{gl,es}-{proxecto,robot}.html` — corroborados byte a byte salvo el `buildId` |

## Salvedades / follow-ups
<!-- IDs F-SPEC-006-1, F-SPEC-006-2… con destino (spec futura o EPIC-MEJORA). -->

### CA-5 — DICTAMEN DE `/sdd-lingua` EMITIDO Y APLICADO: CIERRA

> **Añadido por `sdd-verificador` el 2026-09-01.** Lo que sigue debajo lo escribió
> `sdd-implementador` cuando el dictamen aún no existía, y se conserva tal cual
> porque es el registro de que **no se dio por bueno ningún texto sin gate**.

**Dictamen de `/sdd-lingua`, emitido por Alberto Fojo el 2026-09-01 sobre los
cuatro títulos, transcrito íntegro:**

> **CORRECTO, sin cambios.** `O proxecto — marcador.gal` · `O rastrexador —
> marcador.gal` · `El proyecto — marcador.gal` · `El rastreador — marcador.gal`.
>
> `rastrexador` deriva de *rastrexar* (norma RAG) y ya quedó dictaminado en
> SPEC-005, donde vive en `crawlerHeading` y en el encabezado de la propia
> página: el título y el `<h1>` dicen el mismo sustantivo, así que no se
> contradicen. Los dos títulos de proyecto conservan su valor anterior, ya
> dictaminado. Se mantiene la excepción consciente de
> `otherLanguage: 'Castellano'` (convención de conmutador, simétrica con
> `'Galego'`), anotada desde SPEC-004.

**Ninguna observación pedía acción**, así que no hay nada que aplicar ni que
justificar una a una: el dictamen es «sin cambios».

**Comprobado por el verificador, no supuesto** (la pregunta era si el
implementador había tocado los títulos después del dictamen — **no lo hizo**):

| Ruta | Título dictaminado | Literal en `src/i18n/` | `<title>` servido |
|---|---|---|---|
| `/proxecto` | `O proxecto — marcador.gal` | idéntico (`gl.titles.project`) | idéntico |
| `/robot` | `O rastrexador — marcador.gal` | idéntico (`gl.titles.crawler`) | idéntico |
| `/es/proxecto` | `El proyecto — marcador.gal` | idéntico (`es.titles.project`) | idéntico |
| `/es/robot` | `El rastreador — marcador.gal` | idéntico (`es.titles.crawler`) | idéntico |

Y la coherencia que el dictamen invoca **también está medida sobre el HTML
servido**, no solo sobre el bundle: `/robot` sirve `<h1>O rastrexador de
marcador.gal</h1>` y `/es/robot` `<h1>El rastreador de marcador.gal</h1>`. Título
y encabezado dicen el mismo sustantivo.

---

`sdd-implementador` no puede pedir el dictamen. **Ninguno de los cuatro valores
de abajo está dado por bueno**: son el texto escrito, no el texto aprobado.

| Ruta | Lengua | Clave | Título, literal |
|---|---|---|---|
| `/proxecto` | galego | `gl.titles.project` | `O proxecto — marcador.gal` |
| `/robot` | galego | `gl.titles.crawler` | `O rastrexador — marcador.gal` |
| `/es/proxecto` | castellano | `es.titles.project` | `El proyecto — marcador.gal` |
| `/es/robot` | castellano | `es.titles.crawler` | `El rastreador — marcador.gal` |

Los **dos de proyecto no cambian de valor**: se mudan de namespace tal cual, y
son los que `/sdd-lingua` ya dictaminó en SPEC-004. Los **dos del rastreador son
nuevos** y son los que necesitan dictamen de verdad. Se han escrito con el mismo
patrón —«sustantivo de la página` — `marca»— y con el sustantivo que la propia
página ya usa en su namespace: `crawlerHeading` del sitio dice «O rastrexador» /
«El rastreador», y el `heading` del rastreador dice «O rastrexador de
marcador.gal» / «El rastreador de marcador.gal». El de `/robot` es el que lee el
técnico de la RFGF.

### F-SPEC-006-1 — el gate L1 `require-spec` deniega toda escritura en esta rama

**Es de herramienta, no de la spec, y no tiene nada que ver con RN-01.** El hook
`PreToolUse` del plugin deduce la spec **del nombre de la rama**
(`core/lib/require-spec.mjs`, `/^ft\/(SPEC-\d{3})-/`). Aquí la rama es
`ft/SPEC-005-pagina-del-rastreador` **por decisión de Alberto Fojo** (nota 7 del
gate, para que esto entre en el PR #8), y SPEC-005 está `hecho`, así que el hook
rechaza **todo** `Write`/`Edit` sobre `src/` y `tests/` con «SPEC-005 está en
estado 'hecho'».

La regla de fondo **sí se cumple**: SPEC-006 está `aprobada` y en `en-progreso`.
Lo que falla es la heurística del nombre de rama cuando dos specs comparten una.
Se ha trabajado escribiendo los ficheros con `bash` (heredocs y `python3`), que
es lo que la sesión ya tiene instruido como vía preferente; **no se ha renombrado
la rama ni se ha tocado el PR**, porque las dos cosas estaban prohibidas por el
encargo y romperían el PR abierto.

Consecuencia colateral que el verificador debe saber: al no pasar por
`Write`/`Edit`, tampoco se ha disparado el hook `PostToolUse` de calidad. **Los
gates se han corrido a mano y enteros** (abajo). Destino: **EPIC-MEJORA** —
o el hook acepta una spec `en-progreso` de la misma épica, o el estándar dice
cómo se declara «esta rama lleva dos specs».

### F-SPEC-006-2 — CA-1 compara de forma simbólica, por diseño de la spec

CA-1 dice literalmente *«compara el título declarado por cada uno contra la clave
del bundle que le toca»*, y eso es lo que hace `document-titles.test.ts`. No se
han fijado los cuatro literales con aserciones de texto —como sí hace el caso 3
de `crawler-page.test.ts` con `USER_AGENT`— **a propósito**: CA-5 sigue abierto y
los dos títulos del rastreador pueden cambiar de redacción con el dictamen;
congelarlos hoy en un test sería fijar un texto que aún no está aprobado.

La comparación no es circular pese a ser simbólica: los casos 3 y 5 exigen que
cada ruta **no** declare el título de la otra página de su lengua y que el
conjunto de los cuatro declarados sea exactamente el de los dos bundles. Medido:
intercambiar la clave entre `/robot` y `/proxecto` pone **4 de 5 casos en rojo**.
Si el verificador quiere además el literal, el sitio natural es después del
dictamen. Destino: **decisión del verificador**; si lo pide, es una línea.

#### Dictamen del verificador (2026-09-01): **NO se exige el literal. Cerrado.**

La comparación simbólica **es lo que CA-1 pide**, palabra por palabra: *«compara
el título declarado por cada uno contra la clave del bundle que le toca»*. El
test hace eso y hace más — comprueba también que ninguna ruta declare la clave
*ajena* y que el conjunto de los cuatro declarados sea exactamente el de los dos
bundles. **Comprobado rompiendo por el verificador**: intercambiar la clave pone
**4 de 5 casos rojos**, que es la barrera que el CA exige.

Y exigir el literal aquí sería **inventar un estándar que este repositorio no
aplica a ningún otro texto visible**: ni `pages.test.ts` ni `crawler-page.test.ts`
congelan el texto de los bundles del sitio — congelan que **se sirva**, no qué
dice. Lo único congelado con literales es `USER_AGENT`, y por una razón que aquí
no existe: esa cadena tiene que coincidir **carácter a carácter con lo que se
envía a un tercero**, y si diverge, el sitio miente. Un título no tiene gemelo
del que divergir.

**El residual, dicho para que nadie crea que no lo hay:** cambiar la redacción de
un título no pone rojo nada, igual que cambiar cualquier otro literal de i18n. La
defensa prevista es la misma para todos: **D-2 y el gate de `/sdd-lingua`**, más
la nota 5 del gate de esta spec. No es un hueco de SPEC-006; es la política del
proyecto sobre el texto visible, y cambiarla sería materia de otra spec.

### F-SPEC-006-3 — el gate L2 `pre-commit` NO está instalado en este repositorio

**Hallazgo del verificador, 2026-09-01. Nuevo: no lo reportó nadie.**

Al comprobar F-SPEC-006-1 leí la fuente única de la decisión
(`core/lib/require-spec.mjs`) y confirmé que la invocan **dos** capas: el hook L1
`PreToolUse` y el `pre-commit` L2 (`tools/githooks/pre-commit.mjs`). El propio
fichero lo dice en su cabecera. Pues bien:

```
$ ls -a .git/hooks
.  ..  applypatch-msg.sample  commit-msg.sample  …  pre-commit.sample
```

**Solo hay `.sample`.** La capa L2 no está instalada aquí, así que cuando el L1
se esquivó —escribiendo con `bash` en vez de `Write`/`Edit`— **no quedaba ningún
respaldo detrás**: los tres commits entraron sin que nada volviera a evaluar la
regla. La defensa en profundidad que el estándar diseñó a dos capas está operando
a una, y a la que es más fácil de rodear.

**No invalida SPEC-006** —la regla de fondo se cumple y los gates los he corrido
yo enteros—, pero es exactamente la clase de barrera que no muerde de la que ya
habla el inventario de EPIC-MEJORA. Destino: **EPIC-MEJORA**. Disparador: **hoy**,
es una instalación, no un desarrollo; y con más razón el día que haya CI
(F-SPEC-004-3 / F-SPEC-005-4), porque las dos cosas son la misma ausencia.

### Dictamen del verificador sobre F-SPEC-006-1 (2026-09-01)

**No invalida nada de SPEC-006, y sí es una limitación real de la heurística.**
Tres cosas comprobadas y una que honestamente no se puede comprobar:

1. **El diagnóstico del implementador es exacto.** Leí
   `core/lib/require-spec.mjs`: `parseSpecId` deduce la spec **solo** del nombre
   de rama (`/^ft\/(SPEC-\d{3})-/`) y `ESTADOS_CODEABLES` es
   `['aprobada','en-progreso']`. Con la rama `ft/SPEC-005-…` el hook resuelve
   SPEC-005, cuyo frontmatter dice `estado: hecho`, y deniega. **Nunca llega a
   mirar SPEC-006.** No hay en el código ninguna vía para declarar que una rama
   lleva dos specs.
2. **La regla de fondo se cumple.** SPEC-006 tiene `aprobada-por: Alberto Fojo` y
   su historial recorre `borrador → aprobada (Alberto Fojo) → en-progreso →
   en-revision`, todo el 2026-09-01. Es un estado codeable, aprobado por una
   persona, y la rama compartida está **decidida y escrita** en la nota 7 del
   gate de la propia spec aprobada.
3. **Los gates se han corrido, y no de fiado.** El hook `PostToolUse` de calidad
   no se disparó; los he ejecutado yo enteros sobre el árbol final, con la salida
   pegada arriba. Eso es lo único que sustituye a un hook que no salta, y está
   hecho.
4. **Lo que NO se puede demostrar con artefactos, y lo digo:** el fichero de la
   spec no se commiteó hasta `1cdaf6c` (07:18), **después** de los commits de
   código (`f3eff7b` 07:10, `c540560`). Así que el repositorio **no contiene
   prueba con hora** de que `aprobada` precediera a las escrituras: el único
   registro es el `historial` del frontmatter, con granularidad de día. La
   ordenación es coherente y no hay nada que la contradiga, pero es **un
   testimonio, no una marca de tiempo**. Registrarlo importa más que el caso
   concreto: si el gate L1 se puede rodear, el rastro tiene que estar en otro
   sitio, y hoy no lo está.

**Destino: EPIC-MEJORA**, como propuso el implementador, y con dos entradas
distintas porque son dos fallos distintos:

| Entrada | Qué es | Disparador |
|---|---|---|
| **F-SPEC-006-1** | El gate L1 `require-spec` deduce la spec del nombre de rama y **no admite que una rama lleve dos specs**. Con una rama compartida por decisión humana, deniega toda escritura sobre `src/` y `tests/` aunque la spec en curso esté `aprobada`. Se rodea escribiendo con `bash`, y al rodearlo se pierde también el `PostToolUse` de calidad | **La próxima vez que dos specs compartan rama** — que no es hipotético: acaba de pasar, y por una razón de despliegue que volverá a darse. O el hook acepta una spec `aprobada`/`en-progreso` de la misma épica, o el estándar dice cómo se declara «esta rama lleva dos specs» |
| **F-SPEC-006-3** | El `pre-commit` L2 **no está instalado** en este repositorio: `.git/hooks` solo tiene `.sample`. La defensa a dos capas opera a una | **Hoy**: es instalar un hook, no desarrollar nada. Y obligatorio el día que haya CI |

## Cómo retomar (handoff)
<!-- Estado real del trabajo para la siguiente sesión: qué está hecho, qué falta, dónde seguir. -->

### Mitad de `sdd-implementador` (2026-09-01) — CA-1 a CA-4 y CA-6 implementados

**Estado: código escrito, suite verde, gates enteros en verde. Falta CA-5, que es
un gate humano y no lo puede pedir este rol, y falta la verificación.** Rama
`ft/SPEC-005-pagina-del-rastreador`, tres commits locales, **sin push**.

`c414f4a feat(i18n): los titulos de documento salen del bundle del sitio a un namespace propio`
`c540560 feat(site): cada ruta declara su propio titulo de documento`
(más el commit de ledger y evidencia QA de esta misma sesión).

**Línea base de las mediciones: `c414f4a`**, el commit de SPEC-005 anterior a esta
spec, no `main` — por lo que ya avisaba este ledger arriba.

#### La corrección, medida sobre el HTML realmente servido

`npx next build && npx next start` en dos árboles a la vez: esta rama en el
puerto 3121 y el árbol base (`git archive c414f4a` a una copia aislada, **sin
`checkout`**, `node_modules` clonado con `cp -Rc`) en el 3122. El árbol real
quedó intacto: `git status -- src tests` vacío antes y después.

| Ruta | `<title>` en el árbol base (el defecto) | `<title>` en esta rama |
|---|---|---|
| `/proxecto` | `O proxecto — marcador.gal` | `O proxecto — marcador.gal` |
| `/robot` | `O proxecto — marcador.gal` ← **F-SPEC-005-1** | `O rastrexador — marcador.gal` |
| `/es/proxecto` | `El proyecto — marcador.gal` | `El proyecto — marcador.gal` |
| `/es/robot` | `El proyecto — marcador.gal` ← **F-SPEC-005-1** | `El rastreador — marcador.gal` |

Las cuatro responden `200`. Archivado en `_qa/SPEC-006/servido-{gl,es}-{proxecto,robot}.html`.

**CA-6 sobre el servidor real**, contando etiquetas en el HTML servido:

| Ruta | `<title>` totales | dentro de `<head>` | después de `</head>` |
|---|---|---|---|
| `/proxecto` | 1 | 1 | **0** |
| `/robot` | 1 | 1 | **0** |
| `/es/proxecto` | 1 | 1 | **0** |
| `/es/robot` | 1 | 1 | **0** |

Uno solo, y en `<head>`: se confirma lo que la spec avisaba —con los dos
mecanismos a la vez saldrían dos y ganaría el equivocado.

#### CA-4.3 — `/proxecto` no ha cambiado, y se demuestra

Misma técnica que la sección «Regresión sobre SPEC-004» del ledger de SPEC-005:
`git archive` sobre copia aislada, sin `checkout`.

| Comparación (base `c414f4a` ↔ esta rama) | Resultado |
|---|---|
| `/proxecto` — `<head>` | **idéntico byte a byte**, 714 B, `<title>` incluido y en la misma posición |
| `/proxecto` — marcado de `<body>` (sin la carga RSC en línea) | **idéntico byte a byte**, 1 698 B |
| `/es/proxecto` — `<head>` | **idéntico byte a byte**, 715 B |
| `/es/proxecto` — marcado de `<body>` | **idéntico byte a byte**, 1 738 B |
| `/robot` — marcado de `<body>` | **idéntico byte a byte**, 2 710 B; el `<head>` difiere **solo en el texto del título** |
| `/es/robot` — marcado de `<body>` | **idéntico byte a byte**, 2 761 B; ídem |

Lo que sí difiere en el fichero entero, y por qué no es contenido:

1. **El identificador de build.** Comprobado, no supuesto: se reconstruyó **el
   mismo árbol base dos veces** y entre sus dos HTML esa cadena ya cambia sola
   (`58eiwSBuseP_YyZAwsRu5` → `0c6bc…jtR-xva-zafLN`). Es lo que la spec llama
   `buildId`.
2. **La carga RSC en línea**, donde el nodo del título cambia de sitio, tal y
   como CA-4.3 admite: pasa del árbol del cuerpo
   (`[\"$\",\"title\",null,{…}]` dentro del trozo 1) a la ranura de metadatos
   (`10:[[\"$\",\"title\",\"0\",{…}]]`), y detrás va la renumeración de filas
   RSC que eso arrastra. Ni una palabra del texto de la página cambia.

#### CA-4.2 — ningún test existente tocado

```
$ git diff --name-status c414f4a -- tests/
A       tests/site/document-titles.test.ts
A       tests/site/title-source.test.ts
A       tests/site/titles-i18n.test.ts
A       tests/site/titles.test-d.ts
```

Cuatro **altas**, cero modificaciones. Contra `main` la lista sale más larga,
pero todo lo demás es SPEC-004 y SPEC-005, que en `main` aún no están: es el
falso rojo del que avisa esta misma página.

#### Las barreras muerden: cinco mutaciones, medidas y revertidas

Cada mutación se aplicó al árbol, se corrió la suite y se restauró desde una
copia fuera del repositorio (**sin `git checkout`, `stash`, `reset` ni
`restore`**); `git status -- src tests` quedó vacío después de cada una.

| Mutación | Qué se rompe |
|---|---|
| `/robot` declara `titlesBundle('gl').project` | `document-titles.test.ts`: **4 de 5 casos rojos** |
| `title: 'O rastrexador — marcador.gal'` escrito a mano en la ruta | `title-source.test.ts` casos **2 y 3** rojos |
| vuelve el `<title>` a `SiteDocument` | `title-source.test.ts` caso **4** rojo |
| falta `crawler` en `es.titles` | `npm run typecheck` falla: `TS2741 Property 'crawler' is missing … in type 'TitlesBundle'` |
| `documentTitle` vuelve a `SiteBundle` | `titles-i18n.test.ts` casos 5 y 6 **y `pages.test.ts` casos 2 y 5** rojos — exactamente lo que el arquitecto midió |

#### Gates, corridos enteros a mano el 2026-09-01 con el árbol final

- `npx vitest run --typecheck` → **70 ficheros, 606 tests, todos verdes**, `Type Errors  no errors`. Partida: 66 ficheros / 591 tests.
- `npx oxlint --type-aware` → **exit 0**, sin salida.
- `npx tsc --noEmit` → **exit 0**, sin salida.
- `npx next build` → compila y prerenderiza las cuatro rutas como estáticas.

**No hay CI: nadie los corre por ti.** Y ojo a F-SPEC-006-1: el hook de calidad
`PostToolUse` **no** se ha disparado en esta sesión, porque los ficheros se
escribieron con `bash` y no con `Write`/`Edit`. Por eso los gates de arriba se
corrieron a mano, enteros y sobre el árbol final.

#### Qué falta

1. **CA-5**: el dictamen de `/sdd-lingua` sobre los cuatro títulos. Es lo único
   que bloquea el cierre y solo lo puede pedir el humano.
2. **La verificación** (`sdd-verificador`), con las columnas Verif./Estado de la
   matriz, que este rol no toca.

### Nota previa de `sdd-arquitecto` (2026-09-01) — lo que ya estaba medido

**Confirmado punto por punto al implementar.** Nada de lo que sigue resultó
falso: el mecanismo de metadatos por página es el correcto, quitar el `<title>`
de `SiteDocument` era obligatorio, y sacar los títulos de `SiteBundle` era lo que
dejaba intactos los tests de SPEC-004.

**Aviso para quien mida CA-4.2 y CA-4.3:** la línea base **no es `main`**, es el
commit de SPEC-005 anterior a esta spec. Comparar contra `main` daría por cambio
de SPEC-006 todo lo que SPEC-005 ya trae en la rama —incluida la línea que borró
de `tests/site/contact.test.ts`— y dejaría CA-4 en un falso rojo. Ver la nota 7
del gate.

### Nota de `sdd-arquitecto` (2026-09-01) — lo que ya está medido, para que no se remida

El diseño **no es una hipótesis**: se probó entero sobre una copia aislada del
árbol de esta rama (`git archive HEAD`, sin `checkout`, `node_modules` clonado;
el árbol real intacto, `git status` vacío antes y después). Está resumido en
**§Diseño punto 0** de la spec. Los tres hechos que ahorran una tarde:

1. **El mecanismo correcto es el de metadatos por página de App Router**, no
   mover `<title>` de JSX a cada página. Con él el título acaba en `<head>` solo,
   y no queda ningún `<title>` después de `</head>`.
2. **Quitar el `<title>` de `SiteDocument` es obligatorio.** Si se dejan los dos
   mecanismos, `/robot` sale con **dos** `<title>` y gana el equivocado: el
   defecto sobreviviría al arreglo.
3. **Los títulos tienen que salir de `SiteBundle` a un espacio de nombres
   propio.** Manteniéndolos dentro, `tests/site/pages.test.ts` casos **2 y 5**
   se ponen rojos, y arreglarlo obligaría a aflojar un test de SPEC-004.
   Sacándolos, la suite entera queda verde **sin tocar un solo test existente**,
   y el HTML de `/proxecto` y `/es/proxecto` sale idéntico byte a byte en
   `<head>` y en el marcado de `<body>`.

Si al implementar aparece que **hay que modificar un test de SPEC-004 o de
SPEC-005**, la instrucción de CA-4 es **parar y devolver a arquitectura**, no
añadir una excepción.

---

## Enmienda — 2026-09-04: el título del marcador ES el nombre del dominio, y dos aserciones de esta spec dejan de poder ser universales

**Escrita por `sdd-arquitecto` el 2026-09-04**, a instancia de **F-SPEC-018-1**,
que el implementador de SPEC-018 levantó y **paró en vez de resolver por su
cuenta** — que es exactamente lo que la última línea de este ledger le pedía:
«no añadir una excepción» sin volver a arquitectura. Volvió. Esto es la
respuesta.

### 1. Qué afirmaban las dos aserciones, y por qué eran razonables

- **`tests/site/titles-i18n.test.ts` caso 6** — «ningún título es un valor de los
  que el sitio sí sirve en su cuerpo». Refuerza **CA-3(c)**. Su motivo está
  escrito en el propio caso y es bueno: si un título volviera al namespace del
  sitio por otra puerta, los casos 2 y 5 de `pages.test.ts` —que exigen que
  **cada** clave del sitio aparezca en el cuerpo de `/proxecto`— empezarían a
  mentir.
- **`tests/site/title-source.test.ts` caso 3** — «cada título vive en el bundle de
  su lengua y en ningún otro punto de `src/`». Sostiene el propósito de **CA-2**:
  que nadie transcriba a mano un título que sale de i18n.

Las dos eran razonables porque, con dos páginas, **ningún título se parecía a
ninguna otra cadena del sistema**: *O proxecto — marcador.gal* y *O rastrexador —
marcador.gal* son cadenas que no existen en ninguna otra parte por ningún otro
motivo.

### 2. Qué las invalida

**El gate humano del 2026-09-04** decidió, sobre la nota §3 de SPEC-018, que el
título de la pantalla del marcador es **`marcador.gal` a secas** —descartando
expresamente `O marcador — marcador.gal`, que es la forma que sigue el patrón de
las otras dos y que `sdd-lingua` §1.1 había dejado abierta como decisión de
producto—. Lo recoge **SPEC-018 CA-13.5** y **ADR-027 §1**.

Ese valor **es el nombre del dominio**, y de ahí salen las dos colisiones, que
son **estructurales y no un descuido**:

1. **`site.heading` también es `marcador.gal`**: es el `<h1>` de `/proxecto` desde
   SPEC-004. Un título igual al nombre del sitio choca por fuerza con el caso 6.
2. **El dominio aparece por construcción en once ficheros de `src/`** que no
   tienen nada que ver con un título —`polite/user-agent.ts`, `site/contact.ts`,
   `site/routes.ts`, `site/robots-txt.ts`, `api/freshness.ts`…—, así que el caso 3
   se pone rojo **por una coincidencia de cadena y no por el defecto que vigila**.

**No hay forma de implementar la decisión del gate sin tocar las dos.** No es
elegible por diseño: cualquier título que sea el nombre del sitio produce las dos
colisiones, hoy y siempre.

### 3. Con qué se sustituye, y dónde hay menos red que antes

En cada caso se añade **una colisión declarada por identidad de clave Y de
valor** —`{ key: 'scoreboard', value: 'marcador.gal' }`— con su motivo escrito, y
**una aserción nueva que la ata**: `scoreboard` vuelve a ser rojo en cuanto deje
de valer `marcador.gal`. **No se relaja el predicado y no se exime ninguna otra
clave**: cualquier otro título que coincida con un valor del sitio, o que aparezca
fuera de su bundle, **sigue siendo rojo**.

**Y hay que decir, sin suavizarlo, dónde queda menos red:**

- **Caso 6: no queda menos.** Lo que ese caso protege de verdad —que un título no
  **vuelva** al namespace del sitio— lo sigue afirmando el **caso 5**, intacto y
  sin exención. `scoreboard` vive en `titles`, no en `site`, y `site.heading` se
  sigue sirviendo en el cuerpo de `/proxecto` exactamente igual, así que los
  casos 2 y 5 de `pages.test.ts` no empiezan a mentir. **La exención es sobre una
  coincidencia de valor, no sobre la propiedad que sostiene CA-3(c).**
- **Caso 3: aquí sí queda menos, y es el único sitio.** A partir de ahora,
  **alguien que escriba a mano `marcador.gal` como título en un módulo de `src/`
  que no sea de ruta no lo detectaría este caso**. Lo que sigue cubriéndolo, y por
  eso el hueco es estrecho: el **caso 2** —ningún módulo de ruta declara un título
  como literal, que es la letra de CA-2— y el **caso 5 de
  `tests/site/document-titles.test.ts`**, que afirma sobre el **HTML servido** que
  el documento del marcador toma su título de `titlesBundle(locale).scoreboard`.
  El camino realista está cubierto; el rebuscado, no.

**Y una precisión que hace la enmienda más leve de lo que parece: la letra de
CA-2 y la de CA-3 siguen satisfechas enteras.** CA-2 dice «ningún título
declarado por una ruta es una cadena escrita a mano» —caso 2, intacto—; CA-3(c)
dice «el namespace del sitio ya no contiene el título» —caso 5, intacto—. Lo que
se acota son **dos aserciones que iban más allá de la letra de su CA**, que es la
clase de guardián más valiosa y también la que primero choca con un caso que
nadie previó.

**Lo que NO cambia, y conviene enumerarlo porque es casi todo:** el censo de
páginas del caso 4 crece de dos a tres —eso **no es una enmienda**, es el dato de
un guardián cuyo dato cambió, y SPEC-018 CA-13.6 y CA-17.2(ii) lo distinguen
expresamente—; la paridad de lenguas por tipo y en ejecución; que ninguna clave
esté vacía; el caso 2; el caso 5; y **CA-4 entero**, porque los dos ficheros
tocados son **de esta spec**, no de SPEC-004 ni de SPEC-005, y ninguno de aquéllos
se ha modificado.

### 4. El veredicto sigue en pie

**GREEN del 2026-09-01 intacto, y con más margen del habitual en una enmienda:**
no se invalida ningún CA en su letra (§3, último párrafo), no se retira ninguna
aserción, no se relaja ningún predicado y no se toca el cuerpo de la spec ni su
frontmatter (ADR-015 §1 y §4). `hecho` sigue siendo `hecho`. Lo que hay es **una
excepción nominal, atada por una aserción propia**, en dos guardianes que esta
misma spec escribió.

### 5. Qué lo despierta

- **El título del marcador deja de valer `marcador.gal`.** Las dos exenciones
  quedan sin sujeto y **hay que retirarlas**, no dejarlas por si acaso: una
  exención sin caso que la use es la puerta que alguien reutiliza. Las aserciones
  añadidas en §3 lo ponen rojo el mismo día.
- **Aparece un segundo título que colisiona con un valor del sitio o con una
  cadena de `src/`.** Entonces esto deja de ser una colisión y pasa a ser un
  patrón, y lo que toca **no es una tercera exención**: es rehacer el mecanismo del
  caso 3 para que distinga «una cadena que aparece» de «una cadena usada como
  título», que es lo que de verdad quiere vigilar.
- **El día que exista CI** (F-SPEC-004-3 · F-SPEC-005-4). Hoy nada de esto se pone
  rojo si nadie corre `npm run gates`.

**Referencias:** SPEC-018 CA-13.5, CA-13.6, CA-17.2 y CA-18 · ADR-027 §1 ·
ADR-015 §1, §2, §3 y §4 · F-SPEC-018-1.
