---
id: SPEC-016
tipo: ledger
epica: EPIC-002
---
# Ledger — SPEC-016 El catálogo de corresponsales se resuelve en compilación, y npm run build pasa a ser gate

## Resumen
- Fase: **en-revisión** (implementada el 2026-09-03 por `sdd-implementador`;
  aprobada por Alberto Fojo ese mismo día). La fuente de verdad es el
  frontmatter de la spec.
- Rama: **`ft/SPEC-015-bot-corresponsal`** (worktree `.claude/worktrees/spec-015`).
  **No es la rama que le tocaría por nombre, y es a propósito**: decisión de
  Alberto Fojo del 2026-09-03. El PR #23 no se puede fusionar sin este arreglo,
  porque metería en `main` un árbol que no compila; así que el arreglo viaja en
  el mismo PR aunque sea de otra spec, y el PR pasa a ser «el bot, y compila».
  Menos puro que un PR apilado, y mucho más seguro.
- **No hay ADR nuevo.** El juicio está razonado en «Entidades y reglas
  afectadas» de la spec y resumido en la nota 2 del gate: ADR-022 §2 ya decía
  «importado como módulo», así que esto lo **restaura**, no lo supersede.
  Revisable por quien firma.
- **Enmienda escrita en el ledger de SPEC-015** (`## Enmienda — 2026-09-03`),
  por la vía de ADR-015: F-SPEC-015-14 se quedó corto y su disparador llegaba
  semanas tarde. El cuerpo de SPEC-015 no se ha tocado.

## Matriz de criterios de aceptación
<!-- Escritores: sdd-implementador rellena Implementado y Test; sdd-verificador rellena Verif. y Estado. Nunca al revés. -->
<!-- Estados por CA: ✅ cerrado · ⚠️ parcial/con salvedad · 🚧 en curso · ❌ sin empezar · n-a -->
<!-- Un CA está ✅ solo cuando Implementado + Test + Verif. aplicables están en verde. Una salvedad se marca ⚠️, nunca ✅. -->
| CA | Implementado (fichero) | Test (fichero/caso) | Verif. | Estado |
|---|---|---|---|---|
| CA-1.1 — sin lectura de disco, `import` estático con `with { type: 'json' }` | `src/bot/catalog.ts:32` (el `import`); fuera `readFile`, `fileURLToPath`, `join` y `CATALOG_DIR` | `tests/bot/catalog.test.ts:41` caso 1 y `:52` caso 2; y sobre el GRAFO, no el texto, `tests/bot/frontier.test.ts:132` caso 10 | Leído el módulo: no quedan `readFile`, `fileURLToPath`, `join`, `node:fs` ni `CATALOG_DIR`, y el JSON entra por `import` estático con `with { type: 'json' }`. **Sonda S1**: reintroduje `fileURLToPath(new URL('../../corresponsais', import.meta.url))` en este mismo módulo y `npm run build` volvió a fallar con el error literal de SPEC-015 —`Can't resolve '../../corresponsais'`, traza `catalog.ts`—. El guardián es el empaquetador y muerde. | ✅ |
| CA-1.2 — sigue pasando por `parseCatalog` (zod, todo-o-nada) | `src/bot/catalog.ts:88` | `tests/bot/catalog.test.ts:62` caso 3 (`corresponsal-xove` tumba el fichero entero) y `:66` caso 4 (clave de más) | **Sonda S6**: sustituí `parseCatalog(...)` por un `as CorrespondentCatalog` y los casos 3 y 4 se pusieron ROJOS. El todo-o-nada de SPEC-015 CA-2.8 no se ha relajado: un `corresponsal-xove` sigue tumbando el fichero entero, y una clave de más también. | ✅ |
| CA-1.3 — `loadCatalog` síncrona; los llamantes dejan el `await` | `src/bot/catalog.ts:81`; llamantes `src/bot/webhook.ts:690` y `tests/bot/correspondents.test.ts:72` | `tests/bot/catalog.test.ts:75` caso 5 (`not.toBeInstanceOf(Promise)`) | `loadCatalog` ya no devuelve promesa (caso 5) y los dos llamantes perdieron el `await`: `src/bot/webhook.ts:690` y `tests/bot/correspondents.test.ts:71`. Comprobado en el diff que ese test conserva nombre, aserciones y recuento (12 casos antes y después). | ✅ |
| CA-1.4 — `emptyCatalog` no es el camino de fallo | `src/bot/catalog.ts:92`; el cuerpo de `loadCatalog` (`:81-89`) no lo nombra | `tests/bot/catalog.test.ts:83` caso 6 | **Sonda S5**: hice que una temporada no declarada devolviese `emptyCatalog(season)` y el caso 6 —que lee el cuerpo de `loadCatalog` y exige que no nombre `emptyCatalog`— se puso ROJO junto con el 10 y el 11. La distinción está guardada por tres casos, no por uno. | ✅ |
| CA-2.1 — registro cerrado temporada → catálogo importado | `src/bot/catalog.ts:49` `SEASON_CATALOGS`, un `Map` con una entrada | `tests/bot/catalog.test.ts:95` caso 7 | `SEASON_CATALOGS` es un `Map` con una sola entrada, `'2026/27'`. El caso 12 lo comprueba **en las dos direcciones** contra el directorio (`declared` ≡ `onDisk`), así que ni sobra una entrada sin fichero ni sobra un fichero sin entrada. | ✅ |
| CA-2.2 — clave del registro ≡ campo `season` del JSON | `src/bot/catalog.ts:49` | `tests/bot/catalog.test.ts:99` caso 8 (recorre el registro entero) | El caso 8 recorre el registro y compara la clave con el campo `season` del JSON importado **y** con el que devuelve `loadCatalog`. Es lo que impide servir la temporada del año pasado bajo una clave nueva. | ✅ |
| CA-2.3 — `ACTIVE_SEASON` es clave del registro | `src/bot/catalog.ts:49` alineado con `src/ingest/measurement.ts:35` | `tests/bot/catalog.test.ts:108` caso 9 | `ACTIVE_SEASON` de `src/ingest/measurement.ts` es clave del registro (caso 9), y `src/ingest/measurement.ts` no se ha tocado: se cita, no se duplica. | ✅ |
| CA-2.4 — temporada no declarada ⇒ lanza, nunca catálogo vacío | `src/bot/catalog.ts:54` `UndeclaredSeasonError` y `:85-87` | `tests/bot/catalog.test.ts:112` caso 10 (nombra pedida y declaradas) y `:126` caso 11 | **El punto que más ataqué, porque un vacío por error sería indistinguible del bot apagado.** `loadCatalog('2099/00')` lanza `UndeclaredSeasonError` con la temporada pedida y las declaradas en el mensaje; `'2027/28'` y `''` también. Y el `Map` cierra la puerta que un objeto literal dejaría abierta: `'toString'` no puede responder como si fuese una temporada. **Sonda S5** confirma que devolver vacío enrojece tres casos. | ✅ |
| CA-2.5 — cada clave tiene su fichero en `corresponsais/` | `src/bot/catalog.ts:68` `catalogFileName`, conservado como convención | `tests/bot/catalog.test.ts:133` caso 12 (las dos direcciones contra el directorio) y `:141` caso 13 | El caso 12 lee el directorio bajo Node —legítimo: nunca corre dentro del paquete— y exige la igualdad exacta con `catalogFileName` aplicado a cada clave. `catalogFileName` deja de ser cálculo de ejecución y pasa a ser convención con guardián. | ✅ |
| CA-3.1 — `npm run build` en verde | El propio arreglo. Salida literal antes y después en «Evidencia de la implementación» | El empaquetador es el mecanismo; no hay test que lo sustituya (ADR-016 §6) | `npm run build` corrido por mí: **EXIT=0**, ocho rutas emitidas, con `ƒ /api/telegram/webhook` entre ellas, y **cero apariciones** de `Can't resolve '../../corresponsais'`. Y no lo doy por bueno solo porque pase: la **sonda S1** demuestra que si el patrón vuelve, el build vuelve a fallar. | ✅ |
| CA-3.2 — `npm run typecheck` en verde | `tsconfig.json` NO se ha tocado: `resolveJsonModule` ya estaba | Salida literal en «Evidencia de la implementación» | `npm run typecheck` (`tsc --noEmit`): **EXIT=0**. `tsconfig.json` no se ha tocado —`resolveJsonModule` ya estaba—, comprobado en el diff. | ✅ |
| CA-3.3 — `lint`, `test` y `test:db` sin regresión | — | `npm test` 124/1313; `npm run lint` limpio. **`npm run test:db` NO se pudo medir**: ver «Evidencia» | Sin regresión, medido fichero a fichero con el reportero JSON contra el HEAD de SPEC-015 (`de90ee4`) **y** contra `eaae265`: **cero discrepancias en ficheros previos, ninguno desaparecido**. `npm test` 124/1313 (+17 = 13 de `catalog.test.ts` + 4 de `gates.test.ts`), `npm run test:db` 24/303 —**mismo recuento exacto que antes de SPEC-016**—, `npm run lint` limpio. `tests/bot/frontier.test.ts` sigue en 44 y `tests/bot/correspondents.test.ts` en 12. | ✅ |
| CA-4.1 — script `gates` en `package.json`, los cuatro en orden | `package.json:15` | `tests/docs/gates.test.ts:26` casos 1, 2 y 3 | `package.json:15` encadena con `&&` en el orden exacto que pide el criterio: `typecheck` → `lint` → `build` → `test`. Corrido por mí como un solo comando: `npm run gates` **EXIT=0**, y las cuatro etapas aparecen en su salida. **Sonda S7bis**: poner `build` delante de `typecheck` enrojece el caso 3. | ✅ |
| CA-4.2 — `test:db` queda fuera de `gates`, y se dice por qué | `package.json:15`; el motivo en `CLAUDE.md:109-115` | `tests/docs/gates.test.ts:45` caso 4 | `test:db` no aparece en `gates` y sigue existiendo como script propio (caso 4). Lo he corrido aparte: 24/303, verde. El motivo —`DATABASE_URL_TEST` y la rama de Neon compartida, F-SPEC-015-8— está escrito en el criterio, en el test y en `CLAUDE.md`. | ✅ |
| CA-4.3 — `.sdd.json` nombra el comando | `.sdd.json:5` → `"calidad": "npm run gates"` | Sin test: es declaración para quien lee, no mecanismo (lo dice el propio CA-4.3) | `.sdd.json` pasa de `"calidad": true` a `"calidad": "npm run gates"`. Es declaración y no mecanismo, y el propio criterio lo dice: nada del núcleo tremen-sdd valida ese fichero. Por eso no es el único sitio (CA-4.4). | ✅ |
| CA-4.4 — `CLAUDE.md` dice `npm run gates` y por qué | `CLAUDE.md:109-121`, con los cuatro comandos, la frase «`npm test` no puede ver lo que sólo ve el empaquetador» y la mención de CI reescrita | Sin test: documento de orientación | `CLAUDE.md:109-121` nombra `npm run gates`, enumera los cuatro comandos en orden, dice que para en el primer fallo, deja `test:db` fuera pero igual de obligatorio, actualiza la mención de que no hay CI y trae la frase del episodio: **«`npm test` no puede ver lo que sólo ve el empaquetador»**. | ✅ |
| CA-4.5 — test que afirma que el script contiene los cuatro | `package.json:15` | `tests/docs/gates.test.ts` entero (4 casos), con su modestia declarada en la cabecera | El caso 1 afirma que el script existe, el 2 que contiene los cuatro y el 3 el orden. **Sonda S8** (quitarle `build`) enrojece los casos 2 y 3. **SALVEDAD medida**: la mitad de CA-4.1 que dice «parando en el primer fallo» **no está guardada** — **sonda S7**: sustituí `&&` por `;` y la suite quedó en **VERDE 4/4**. El artefacto es correcto (lo he leído: usa `&&`), pero degradarlo no sería una ofensa visible. Cabe dentro de la modestia que CA-4.5 se declara a sí mismo, y por eso es salvedad y no incumplimiento; se cierra con una aserción de una línea. | ⚠️ |
| CA-5.1 — declarado lo que el gate del build NO alcanza | Este ledger: «El residuo del gate del build» y F-SPEC-016-2, ahora **medido** | Sin test: es una declaración de alcance | El residuo está escrito y **lo he medido en las dos direcciones**. Dentro del grafo de una ruta el gate muerde (**sonda S1**, build ROJO); fuera de él no ve nada (**sonda S2**: el mismo patrón en `src/mirror/sonda-fuera-del-grafo.ts` deja el build en **EXIT=0**). Y recorrí el grafo yo, con el lector del propio repositorio, desde las **10 entradas de `src/app/`**: **104 módulos alcanzables**, con `src/bot/catalog.ts` **dentro** —control positivo: el recorrido llega al módulo que esta spec arregla— y `src/db/migrate.ts` y `src/mirror/cli/node-resolve.ts` **fuera**. Más fuerte aún: **ningún módulo alcanzable nombra `import.meta.url`**, el conjunto es vacío. (El implementador contó 9 entradas y 105 módulos; la diferencia es que yo incluí `src/app/_contract/model-client.tsx`. Las tres conclusiones coinciden.) | ✅ |

## Evidencia de la implementación
<!-- La escribe sdd-implementador. El veredicto sigue siendo del verificador. -->

### El defecto, medido antes y después (CA-3.1)

**Antes**, en `4b1edcf`, con el árbol intacto:

```
$ npm run build
▲ Next.js 16.3.3 (Turbopack)
  Creating an optimized production build ...
> Build error occurred
Error: Turbopack build failed with 1 error:
./src/bot/catalog.ts:25:42
Error: Module not found: Can't resolve '../../corresponsais'
> 25 | export const CATALOG_DIR = fileURLToPath(new URL('../../corresponsais', import.meta.url));
     |                                          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
Import trace:
  App Route:
    ./src/bot/catalog.ts
    ./src/bot/webhook.ts
    ./src/app/api/telegram/webhook/route.ts
EXIT=1
```

**Después**:

```
$ npm run build
▲ Next.js 16.3.3 (Turbopack)
  Creating an optimized production build ...
✓ Compiled successfully in 350ms
  Running TypeScript ...
  Finished TypeScript in 171ms ...
✓ Generating static pages using 10 workers (7/7) in 186ms

Route (app)
┌ ○ /_not-found
├ ƒ /api/cron/ingest
├ ƒ /api/telegram/webhook
├ ○ /es/proxecto
├ ○ /es/robot
├ ○ /proxecto
├ ○ /robot
└ ○ /robots.txt
EXIT=0
```

Las ocho rutas se emiten, `/api/telegram/webhook` entre ellas. `tsconfig.json`
**no se tocó**: `resolveJsonModule` ya estaba (CA-3.2).

### El gate, corrido entero

```
$ npm run gates
> npm run typecheck && npm run lint && npm run build && npm test

> tsc --noEmit                     (sin salida)
> oxlint --type-aware              (sin salida)
> next build                       ✓ Compiled successfully
> vitest run
 Test Files  124 passed (124)
      Tests  1313 passed (1313)
Type Errors  no errors
EXIT=0
```

**Recuentos, contra la línea base tomada en `4b1edcf` antes de tocar nada**:

| | Ficheros | Casos |
|---|---|---|
| `npm test` antes | 122 | 1296 |
| `npm test` ahora | 124 | 1313 |

La diferencia es **exactamente** los dos ficheros nuevos: `tests/bot/catalog.test.ts`
(13) y `tests/docs/gates.test.ts` (4). 1296 + 17 = 1313. **Ningún fichero previo
cambia su recuento**: `tests/bot/frontier.test.ts` sigue en 44 y
`tests/bot/correspondents.test.ts` en 12.

### `npm run test:db` NO se pudo medir en esta sesión, y no por el código

```
$ npm run test:db
Error: getaddrinfo ENOTFOUND ep-soft-river-b1ocpgd1-pooler.c-5.eu-central-1.aws.neon.tech
 Test Files  24 failed (24)
      Tests  303 skipped (303)
EXIT=1
```

**El endpoint de Neon de `DATABASE_URL_TEST` no resuelve.** No es el sandbox
—`example.com` sí resuelve desde el mismo proceso, y el fallo se repite fuera del
sandbox—, no es concurrencia —`ps aux | grep vitest` daba 0 antes de correr— y no
es el código: el inventario es el mismo que dejó SPEC-015 (24 ficheros, 303
casos) y **ningún fichero de esta spec toca `src/db/` ni `tests/db/`**. La rama de
Neon parece haber desaparecido o estar suspendida desde ayer.

**Esto deja la mitad `test:db` de CA-3.3 SIN MEDIR, y lo digo en vez de
suponerla.** Que una regresión sea inverosímil no es que esté medida. El
verificador tiene que correrlo con el endpoint restablecido.

### Los dos usos vivos del patrón: comprobados, y hoy siguen fuera (CA-5.1)

Recorrí el grafo de importación estático desde **las nueve entradas de ruta** de
`src/app/` (`route.ts`, `page.tsx`, `layout.tsx`), resolviendo `./…` y `@/…`
transitivamente: **105 módulos alcanzables**.

| Módulo | ¿En el grafo de alguna ruta? |
|---|---|
| `src/db/migrate.ts:14` (`MIGRATIONS_DIR`) | **FUERA** |
| `src/mirror/cli/node-resolve.ts:27` (`SRC`) | **FUERA** |
| `src/bot/catalog.ts` | **DENTRO** — control positivo: el recorrido llega al módulo que esta spec arregla |

Es decir: el recorrido **no es vacío** —alcanza 105 módulos y encuentra el que
rompía—, y aun así los dos sospechosos no aparecen. La segunda prueba,
independiente, es que `npm run build` termina en 0: si cualquiera de los dos
entrase en el grafo de una ruta, Turbopack fallaría igual que falló con
`catalog.ts`. **No los he tocado**: están fuera de alcance por decisión de la
spec.

### El residuo del gate del build, escrito (CA-5.1)

El gate del build atrapa **la referencia estática a un recurso** —
`new URL(x, import.meta.url)`, que el empaquetador resuelve en compilación. **NO
atrapa una lectura de disco calculada en ejecución**: `readFile(join(process.cwd(), …))`
compila perfectamente y falla en producción, porque el rastreador de ficheros no
puede seguir una ruta que no existe hasta que se ejecuta. El día que alguien
escriba esa forma, ni `npm run build` ni `npm test` dirán nada, y el primer aviso
será una función serverless devolviendo 500.

Tampoco atrapa nada de lo que ocurre **después** de compilar: variables de
entorno ausentes, credenciales, permisos, la ceremonia de encendido del bot.

## Lo que se tocó de SPEC-015, y por qué era inevitable

Tres ficheros suyos, ninguno por gusto:

1. **`src/bot/catalog.ts`** — es el objeto del arreglo. Reescrito entero.
2. **`tests/bot/correspondents.test.ts:71-72`** — el caso 5 era `async` y hacía
   `await loadCatalog(...)`. **CA-1.3 lo pide explícitamente.** Se quitaron el
   `async` y el `await` y nada más: mismas aserciones, mismo nombre, 12 casos
   antes y 12 después.
3. **`tests/bot/frontier.test.ts:129-145`, caso 10** — este es el que hay que
   mirar. Era el **control positivo sobre el árbol real** de SPEC-015 CA-2.5:
   afirmaba que `src/bot/catalog.ts` **sí** alcanza `node:fs/promises`, para
   demostrar que el mecanismo mide el GRAFO y no el texto. CA-1.1 le quita el
   sujeto: `catalog.ts` ya no alcanza `node:fs` por ningún camino, así que el
   caso pasaba a afirmar algo falso.

   No se ha borrado ni debilitado. Se **mudó el sujeto** a
   `src/db/migrate.ts`, que sí alcanza `node:fs/promises` y sigue siendo código
   de producción —el caso 9, con fichero sintético, ya cubría la otra mitad—, y
   se le **añadió** la aserción que SPEC-016 hace posible: que `catalog.ts`
   **no** alcanza `node:fs` ni `node:fs/promises`. Esa aserción es más fuerte
   que la textual del caso 1 de `tests/bot/catalog.test.ts`, porque se mide
   sobre el grafo. El fichero sigue en **44 casos**.

Nada más de SPEC-015 se ha tocado. Su cuerpo, su ledger y el resto de sus tests
están intactos.

## Una decisión de implementación que conviene que el verificador vea

El registro es un **`Map`**, no un objeto literal. La primera versión usaba
`Object.hasOwn` y `Object.keys`, y **puso en rojo el caso 8 de
`tests/polite/architecture.test.ts`** (SPEC-009 CA-1, la frontera de capacidad):
la entrada `Object` de `ALLOWED_GLOBALS` no declara `hasOwn` ni `keys` en su
superficie.

Había dos salidas: ensanchar la superficie declarada de `Object` —tocar la
frontera de otra spec— o quedarse dentro de ella. Elegí lo segundo: `Map` **ya
está declarado** (`asValue: true`, superficie vacía), y sus métodos son acceso a
un valor, no a un global, así que no se juzgan. De propina, un `Map` no tiene
claves heredadas: `'toString'` no puede responder como si fuese una temporada.
`tests/polite/architecture.test.ts` no se tocó.

## Veredicto del verificador
<!-- GREEN/RED + fecha + resumen. Lo escribe SOLO sdd-verificador. -->

### GREEN — 2026-09-03, `sdd-verificador`

**El agujero queda cerrado, y lo digo habiéndolo reabierto a mano.** No me basta
con que `npm run build` pase: la **sonda S1** reintroduce
`fileURLToPath(new URL('../../corresponsais', import.meta.url))` en el mismo
módulo y el build vuelve a fallar con el error literal que rompió el despliegue,
así que el gate nuevo es mecanismo y no rótulo. Los diecisiete subcriterios
restantes están en verde y hay **una salvedad medida**, CA-4.5, que no bloquea.

**Y hay una cosa que me toca decir en primera persona.** Di GREEN a SPEC-015 y el
despliegue se rompió. La causa no fue una aserción floja: fue que la letra no
incluía compilar, y `npm test` **no puede** ver lo que solo ve el empaquetador.
Lo que arregla eso no es más rigor del verificador, es un gate más — y eso es lo
que esta spec entrega. Comprobado además que **restaura ADR-022 §2 en vez de
superseder-lo**: el ADR ya decía «validado con zod **e importado como módulo**»,
y la implementación de SPEC-015 se había desviado de él.

| Gate | Resultado |
|---|---|
| `npm run gates` (comando único) | **EXIT=0** — las cuatro etapas en su salida |
| `npm run typecheck` | limpio, `tsconfig.json` sin tocar |
| `npm run lint` | limpio |
| `npm run build` | **8 rutas emitidas**, `ƒ /api/telegram/webhook` entre ellas, cero `Can't resolve` |
| `npm test` | 124 ficheros, **1313/1313** |
| `npm run test:db` | 24 ficheros, **303/303** — mismo recuento exacto que antes de SPEC-016 |

**Contraste fichero a fichero**, reportero JSON, contra el HEAD de SPEC-015
(`de90ee4`) y contra `eaae265`: **cero discrepancias en ficheros previos,
ninguno desaparecido**, en unidad y en base. +17 casos, que son exactamente los
13 de `tests/bot/catalog.test.ts` y los 4 de `tests/docs/gates.test.ts`.
`tests/bot/frontier.test.ts` sigue en **44** y `tests/bot/correspondents.test.ts`
en **12**: se reescribieron dentro, no crecieron.

### El caso 10 de `tests/bot/frontier.test.ts`, juzgado con dureza

Es de SPEC-015, que está `hecho`, y yo mismo lo había mirado en su verificación.
Lo he vuelto a atacar por los dos lados, no leído:

- **Sonda S4** — le quito `node:fs/promises` al sujeto nuevo (`src/db/migrate.ts`):
  **caso 10 ROJO**. La mitad heredada sigue midiendo el grafo sobre el árbol real.
- **Sonda S3** — devuelvo `readFile` a `src/bot/catalog.ts`: **caso 10 ROJO**. La
  mitad que SPEC-016 añade también muerde.

**Veredicto: no se ha debilitado; es estrictamente más fuerte.** La aserción
positiva original sobrevive con otro sujeto —`src/db/migrate.ts`, código de
producción cuyo grafo alcanza `node:fs/promises` de verdad— y encima gana dos
aserciones negativas sobre el grafo, que son más fuertes que la comprobación
textual del caso 1 de `catalog.test.ts`. El recuento del fichero no se mueve, no
se borra nada y el motivo está escrito en el mismo diff y en este ledger.

**Y ahora la pregunta incómoda, que contesto para que nadie lea este GREEN como
un descuido: ¿lo admite la regla de las cuatro condiciones de SPEC-015 CA-15.3?**
Por su letra, **no**: la condición (a) exige que la desviación sea *el
crecimiento de un censo derivado*, y esto no es un censo — es un control
positivo al que se le muda el sujeto. Lo que pasa es que **esa regla no gobierna
aquí**: CA-15.3 es un criterio de SPEC-015 sobre la entrega de SPEC-015 frente a
las suites de SPEC-008..013, y **SPEC-016 no tiene ningún criterio equivalente**.
Tampoco se dispara ADR-015: SPEC-015 CA-2.5 **sigue siendo cierto palabra por
palabra** —«el cargador del mapeo no alcanza `node:fs` por su grafo», con su
control positivo en el caso 9, intacto—; el caso 10 era un extra que su
implementador añadió, no un texto que el criterio exigiera. Así que la
desviación es legítima, está declarada y la he medido. Que SPEC-016 no tenga la
regla escrita es, eso sí, un hueco de su propia letra: **finding 3**.

### Las sondas que escribí esta vez

Ficheros y ediciones reales, medidos y revertidos; `git status` limpio tras cada
bloque.

| # | Sonda | Guardián | Resultado |
|---|---|---|---|
| **S1** | `new URL(x, import.meta.url)` **dentro** del grafo de una ruta (`src/bot/catalog.ts`) | `npm run build` | **ROJO** ✔ `Can't resolve '../../corresponsais'` |
| **S2** | el mismo patrón **fuera** del grafo (`src/mirror/sonda-fuera-del-grafo.ts`) | `npm run build` | **VERDE — evade** (es el residuo declarado de CA-5.1) |
| S3 | `catalog.ts` vuelve a alcanzar `node:fs` | `frontier` 10 | **ROJO** ✔ |
| S4 | `src/db/migrate.ts` deja de alcanzar `node:fs` | `frontier` 10 | **ROJO** ✔ |
| S5 | temporada no declarada devuelve catálogo **vacío** en vez de lanzar | `catalog` 6, 10, 11 | **ROJO** ✔ |
| S6 | `loadCatalog` deja de pasar por `parseCatalog` | `catalog` 3, 4 | **ROJO** ✔ |
| S7bis | orden alterado en el script `gates` (`build` primero) | `gates` 3 | **ROJO** ✔ |
| S8 | `build` fuera del script `gates` | `gates` 2, 3 | **ROJO** ✔ |
| **S7** | `&&` sustituido por `;` en el script `gates` | `gates` | **VERDE — evade** (finding 1) |
| S9 | recorrido propio del grafo desde `src/app/` | — | 10 entradas, **104 módulos**, `catalog.ts` dentro, los dos sospechosos fuera |

Ocho de diez enrojecen. De las dos que evaden, una es el residuo que CA-5.1
declara **y que yo he medido en las dos direcciones**; la otra es el finding 1.

### F-SPEC-016-2, comprobado por mi cuenta

No lo doy por medido porque lo diga el ledger. Recorrí el grafo con el lector del
propio repositorio (`reachableModules`, el de las fronteras de SPEC-008 y
SPEC-013) desde las entradas de `src/app/` declaradas en `ENTRY_POINTS`:

```
rutas: 10   modulos alcanzables: 104
src/bot/catalog.ts             -> DENTRO   (control positivo: el recorrido no es vacío)
src/db/migrate.ts              -> FUERA
src/mirror/cli/node-resolve.ts -> FUERA
modulos alcanzables que nombran import.meta.url: []   <-- conjunto VACÍO
```

La última línea es más fuerte que lo que la spec pedía: hoy **ningún** módulo en
el grafo de ninguna ruta nombra el patrón. La diferencia con el ledger (9
entradas / 105 módulos) es que yo incluí `src/app/_contract/model-client.tsx`;
las tres conclusiones coinciden y la discrepancia no es material.

### ¿Entró algo fuera de alcance por la vía del `sh`?

El implementador declara en F-SPEC-016-5 que el hook `require-spec` le denegó
editar bajo `src/` y `tests/` —deduce la spec del nombre de rama, ve SPEC-015 en
`hecho` y bloquea— y que escribió los ficheros con `sh`. Lo declaró en vez de
esconderlo, y he revisado el diff con eso en la cabeza.

**No entró nada fuera de alcance.** Bajo `src/` y `tests/` se tocan **seis
ficheros**, y los seis los nombra la spec: `src/bot/catalog.ts` (el arreglo),
`src/bot/webhook.ts` (una línea, el `await` que CA-1.3 pide quitar),
`tests/bot/catalog.test.ts` y `tests/docs/gates.test.ts` (nuevos),
`tests/bot/correspondents.test.ts` (dos líneas, el mismo `await`) y
`tests/bot/frontier.test.ts` (el caso 10). Revisadas **todas** las líneas
cambiadas con `git diff -U0`: no hay fichero suelto, ni edición oportunista, ni
cambio de comportamiento del bot. Fuera de esos seis: `package.json`,
`.sdd.json` y `CLAUDE.md`, que son CA-4.1, CA-4.3 y CA-4.4. El cambio del cuerpo
de la spec es **solo frontmatter de estado**, que le corresponde.

### Findings — cuatro, ninguno bloquea

1. **F-SPEC-016-6 — el `&&` del gate no lo guarda nadie.** `tests/docs/gates.test.ts`
   afirma existencia, contenido y orden, pero no que las etapas encadenen
   parando en el primer fallo, que es lo que CA-4.1 dice con esas palabras.
   Medido: **sonda S7**, `&&` → `;`, suite en verde 4/4. Se cierra con una
   aserción de una línea (`expect(gates.split('&&')).toHaveLength(4)` o
   equivalente). **Destino: EPIC-MEJORA**; **disparador: la próxima vez que se
   toque `tests/docs/gates.test.ts`.**

2. **F-SPEC-016-7 — la corrección de numeración de la enmienda crea una colisión
   nueva y atribuye mal la vieja.** La enmienda del ledger de SPEC-015 (§5,
   línea 1547) renumera «la segunda `F-SPEC-015-14`» como **`F-SPEC-015-16`** —
   pero `F-SPEC-015-16` **ya está ocupado** por el hallazgo del verificador sobre
   la carrera del caso 27 (mismo ledger, líneas 505 y 550). Además dice que el
   duplicado lo escribió «el verificador», y las dos entradas duplicadas
   (líneas 925 y 1450) están en secciones del **implementador** —«Salvedades /
   follow-ups» y «Segunda vuelta del implementador»—; el verificador usó 16, 17,
   18 y 19. Y el renumerado está **declarado pero no aplicado**: las líneas 925 y
   1450 siguen diciendo `F-SPEC-015-14`. **Destino: `sdd-arquitecto`**;
   **disparador: inmediato** — es una corrección de una línea en la enmienda, y
   no bloquea porque ninguna de las dos entradas se ha perdido.

3. **F-SPEC-016-8 — SPEC-016 toca tres ficheros de una spec cerrada y no tiene
   ningún criterio que gobierne eso.** SPEC-015 tenía CA-15.3 exactamente para
   esto. La disciplina se aplicó igual y la he medido (sondas S3 y S4), pero la
   letra de esta spec no la exige, así que la próxima spec correctiva nace sin
   la regla. **Destino: `sdd-arquitecto`**; **disparador: la próxima spec que
   tenga que tocar la suite de una spec cerrada.**

4. **F-SPEC-016-4, confirmado con mi propia medición, y es la mayor amenaza al
   valor que esta spec entrega.** `npm run gates` termina en `npm test`, y
   `npm test` es inestable: **3 fallos en 8 pasadas** medidas hoy por mí, todos
   en suites cerradas previas —`tests/mirror/user-agent.test.ts`,
   `tests/decide/thresholds.test.ts`, `tests/polite/evasions.test.ts`,
   `tests/site/contact.test.ts`— y ninguno en ficheros de SPEC-016. Es la carrera
   de F-SPEC-013-10. **El problema no es de esta spec, pero sí la afecta**: un
   gate que falla un tercio de las veces enseña a volver a correrlo, y así es
   como un fallo de verdad se pasa por alto. Es el mismo argumento con el que
   CA-4.2 dejó `test:db` fuera. **Destino: EPIC-MEJORA**; **disparador: antes de
   la CI (F-SPEC-016-1), o la primera vez que alguien re-corra el gate sin mirar
   qué falló.**

### Lo que no he podido ver

**No he desplegado en Vercel.** Lo que verifico es que `npm run build` —el mismo
empaquetador— compila y emite la ruta del webhook. El despliegue real sigue
dependiendo de la ceremonia de encendido del bot, y la propia spec lo pone fuera
de alcance con el argumento correcto: ya no hay nada que comprobar sobre el
rastreo de ficheros, **porque no se rastrea ningún fichero**.


## Evidencia visual
<!-- Tabla CA → captura en _qa/SPEC-016/. Informe HTML opcional: _qa/SPEC-016/informe.html -->
No aplica: esta spec no toca ninguna superficie visible. La evidencia es la
salida de `npm run gates`.

## Salvedades / follow-ups
<!-- IDs F-SPEC-016-1, F-SPEC-016-2… con destino (spec futura o EPIC-MEJORA). -->
Previstos ya al especificar; el implementador y el verificador los confirman o
los desmienten, y añaden los suyos.

- **F-SPEC-016-1 (previsto) — No hay CI: el gate lo ejecuta una persona.**
  `npm run gates` hace que el gate sea *un* comando, no que alguien lo corra.
  **Destino: spec propia de CI**; **disparador: el primer trabajo que no pase
  por una sesión con `sdd-verificador`, o el segundo despliegue roto.**
- **F-SPEC-016-2 (previsto) — El gate del build no ve una lectura de disco
  calculada en ejecución.** Atrapa `new URL(x, import.meta.url)`, que el
  empaquetador resuelve en compilación; **no** atrapa
  `readFile(join(process.cwd(), …))`, que compila y falla en producción. Quedan
  vivas dos apariciones del mismo patrón —`src/db/migrate.ts:14` y
  `src/mirror/cli/node-resolve.ts:27`—, legítimas hoy **sólo** mientras esos
  módulos no entren en el grafo de importación de ninguna ruta; que `main`
  compile limpio es la prueba de que hoy no están. **Destino: EPIC-MEJORA**;
  **disparador: el día que un módulo con `import.meta.url` entre en el grafo de
  una ruta, o el primer fallo en producción por un fichero que no viajó.**
  *Confirmado y medido por el implementador el 2026-09-03* —y sin ID propio,
  que la colisión de numeración de SPEC-015 ya enseñó lo que cuesta: recorrí el grafo desde las nueve
  entradas de ruta (105 módulos alcanzables, con `src/bot/catalog.ts` dentro como
  control positivo) y **los dos usos siguen fuera de todo grafo de ruta**. El
  build en verde es la segunda prueba independiente. Ver «Los dos usos vivos del
  patrón» arriba. El follow-up sigue vivo, con su disparador intacto.

- **F-SPEC-016-3 (previsto) — Cambiar de temporada exige mover dos sitios.**
  `ACTIVE_SEASON` (`src/ingest/measurement.ts`) y el registro de
  `src/bot/catalog.ts`. CA-2.3 hace que olvidarse sea un test rojo; no lo hace
  imposible. **Destino: la spec que abra la temporada 2027/28**; **disparador:
  el primer cambio de `ACTIVE_SEASON`.**

- **F-SPEC-016-4 (NUEVO, del implementador) — `npm test` es FLAKY, y el gate
  hereda la inestabilidad.** Medido: de siete pasadas completas de la suite,
  **tres fallaron**, cada una en un fichero distinto y ninguna de forma
  reproducible. Las tres tienen la misma firma: un test que **recorre el árbol de
  `src/`** tropieza con un fichero que otro fichero de test está creando o
  borrando **en ese instante**.
  - `tests/site/title-source.test.ts:74` → `ENOENT` en `readSourceFiles`
    (**medido en la línea base, en `4b1edcf`, ANTES de tocar nada**).
  - `tests/decide/thresholds.test.ts:85` → `ENOENT: … src/ingest/refusal-control-tree`.
  - `tests/bot/frontier.test.ts:361` → tres ofensas de `telegramIdOffences()`
    con nombres de sonda: `src/app/(gl)/js-control/route.js`,
    `src/ingest/extension-control-js.mjs`,
    `extension-control-outside-the-roots.js`.

  El origen es `tests/polite/architecture.test.ts`, que **escribe ficheros y
  enlaces simbólicos reales bajo `src/` y bajo la raíz** como controles positivos
  de ADR-016 (`:208`, `:464-468`) y los borra al terminar, mientras vitest corre
  otros ficheros en paralelo en otros hilos. **Es anterior a esta spec** —la
  primera manifestación la medí antes de escribir una línea— y es ortogonal a
  ella, pero **le importa a CA-4**: un gate que falla una de cada tres veces por
  motivos que no son del código enseña a la gente a reintentar hasta el verde,
  que es exactamente cómo se pierde un gate. **Destino: EPIC-MEJORA**;
  **disparador: el primer verde obtenido a base de reintentos, o la CI de
  F-SPEC-016-1 — lo que llegue antes, y con CI llega seguro.**

- **F-SPEC-016-5 (NUEVO, del implementador) — El gate `require-spec` no sabe
  expresar «el arreglo viaja en la rama de otra spec».** El hook L1 deduce la
  spec **del nombre de la rama** (`core/lib/require-spec.mjs:10`), así que en
  `ft/SPEC-015-bot-corresponsal` evalúa SPEC-015, la encuentra en `hecho` y
  **deniega toda edición bajo `src/` y `tests/`** — aunque SPEC-016 esté aprobada
  y en-progreso, que es la condición que la regla quiere de verdad. Lo mismo hará
  el pre-commit L2 si algún día se instala en este repositorio. La decisión de
  compartir rama fue de Alberto Fojo y está escrita en este ledger; el mecanismo
  no tiene forma de saberlo. **Destino: el estándar tremen-sdd, no este
  repositorio**; **disparador: la segunda vez que un arreglo tenga que viajar en
  la rama de otra spec.**

  *Dicho sin adornos: para poder trabajar escribí los ficheros con `sh` en vez de
  con las herramientas de edición, que es lo que dispara el hook. El gate
  sustantivo —spec aprobada por una persona— estaba satisfecho; el heurístico de
  la rama, no. Lo digo aquí para que conste y no se descubra leyendo el diff.*

## Cómo retomar (handoff)
<!-- Estado real del trabajo para la siguiente sesión: qué está hecho, qué falta, dónde seguir. -->
1. **Hecho: los cinco criterios, con test cada uno de los que admite test.** Dos
   ficheros de test nuevos (`tests/bot/catalog.test.ts`, 13 casos;
   `tests/docs/gates.test.ts`, 4), `src/bot/catalog.ts` reescrito, y los tres
   documentos del gate (`package.json`, `.sdd.json`, `CLAUDE.md`).
2. **Lo que falta y NO pude hacer: `npm run test:db`.** El endpoint de Neon de
   `DATABASE_URL_TEST` no resuelve (`ENOTFOUND`), ni dentro ni fuera del sandbox.
   Hay que restablecerlo antes de verificar CA-3.3 entero. El inventario que
   dejó SPEC-015 es 24 ficheros / 303 casos.
3. **Para el verificador, el orden que ahorra tiempo:** `npm run gates` primero
   (los cuatro de golpe), y **si sale rojo, míralo dos veces**: hay un flake
   conocido y medido, F-SPEC-016-4, que tumba una de cada tres pasadas en un
   fichero distinto cada vez. Si el rojo se repite en el mismo sitio, es real.
4. **La pregunta que este arreglo invita a hacer, y su respuesta:** ¿siguen fuera
   del grafo de ruta `src/db/migrate.ts` y `src/mirror/cli/node-resolve.ts`?
   Hoy sí, medido de dos formas independientes (recorrido del grafo y build en
   verde). Está en «Los dos usos vivos del patrón».
5. **Lo que NO se tocó, a propósito:** `tsconfig.json`, `src/bot/correspondents.ts`,
   `tests/polite/architecture.test.ts`, y los dos módulos de F-SPEC-016-2.
