---
id: SPEC-006
tipo: ledger
epica: EPIC-003
---
# Ledger — SPEC-006 Título de documento por página

## Resumen
- Fase: **aprobada** por Alberto Fojo el 2026-09-01, implementación en curso. La
  fuente de verdad es el frontmatter de la spec.
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
| CA-1 — cada ruta sirve su propio título | `src/app/(gl)/proxecto/page.tsx`, `src/app/(gl)/robot/page.tsx`, `src/app/(es)/es/proxecto/page.tsx`, `src/app/(es)/es/robot/page.tsx` (cada una `export const metadata`), `src/site/document.tsx` (deja de emitir `<title>`) | `tests/site/document-titles.test.ts` casos 1–5 | | ❌ |
| CA-2 — el título es i18n, nunca incrustado | los cuatro `page.tsx` toman el valor de `titlesBundle(locale)`; ninguno transcribe una cadena | `tests/site/title-source.test.ts` casos 1–3 | | ❌ |
| CA-3 — espacio de nombres propio y paridad | `src/i18n/titles-bundle.ts` (nuevo, contrato), `src/i18n/titles.ts` (nuevo, resolución), `src/i18n/gl.ts` y `src/i18n/es.ts` (namespace `titles`, sin `documentTitle`), `src/i18n/site-bundle.ts` (fuera la clave) | (a) `tests/site/titles.test-d.ts`; (b) y (c) `tests/site/titles-i18n.test.ts` casos 1–6 | | ❌ |
| CA-4 — SPEC-004 y SPEC-005 intactas | ningún fichero bajo `tests/` modificado; los cuatro nuevos son ficheros nuevos | los 70 ficheros / 606 tests de la suite, más la comparación byte a byte de abajo | | ❌ |
| CA-5 — dictamen de `/sdd-lingua` (bloqueante) | los cuatro títulos escritos y citados abajo — **PENDIENTES DE DICTAMEN, no dados por buenos** | n-a (gate humano) | | ❌ |
| CA-6 — ningún `<title>` en el cuerpo (F-SPEC-005-V4) | `src/site/document.tsx` sin `<title>`; el título lo emite el mecanismo de metadatos, dentro de `<head>` | `tests/site/title-source.test.ts` caso 4 (fuente) + medición sobre el HTML servido, abajo | | ❌ |

## Veredicto del verificador
<!-- GREEN/RED + fecha + resumen. Lo escribe SOLO sdd-verificador. -->

## Evidencia visual
<!-- Tabla CA → captura en _qa/SPEC-006/. Informe HTML opcional: _qa/SPEC-006/informe.html -->

## Salvedades / follow-ups
<!-- IDs F-SPEC-006-1, F-SPEC-006-2… con destino (spec futura o EPIC-MEJORA). -->

### CA-5 — LOS CUATRO TÍTULOS ESTÁN PENDIENTES DE `/sdd-lingua`, Y BLOQUEAN EL CIERRE

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
