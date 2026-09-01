---
id: SPEC-007
tipo: ledger
epica: EPIC-003
---
# Ledger — SPEC-007 El sitio no nombra a ninguna persona y dice en general que se mide

## Resumen
- Fase: en-revisión (implementación terminada, **con un RED conocido**: ver F-SPEC-007-1)
- Rama: `ft/SPEC-007-el-sitio-no-nombra-a-ninguna-persona-y-dice-en-general-que-se-mide`
- Commits: `dac4823` (CA-1), `c199a28` (CA-2), `ac9b90b` (CA-4 y CA-5)
- Partida: `c80ff82`, punta de `ft/EPIC-003-evidencia-de-produccion` (PR #10), cuyo
  árbol coincide con `origin/main` salvo dos ledgers. Nada se perdió al ramificar:
  esa rama sigue apuntando a `c80ff82`.

## Matriz de criterios de aceptación
<!-- Escritores: sdd-implementador rellena Implementado y Test; sdd-verificador rellena Verif. y Estado. Nunca al revés. -->
<!-- Estados por CA: ✅ cerrado · ⚠️ parcial/con salvedad · 🚧 en curso · ❌ sin empezar · n-a -->
<!-- Un CA está ✅ solo cuando Implementado + Test + Verif. aplicables están en verde. Una salvedad se marca ⚠️, nunca ✅. -->
| CA | Implementado (fichero) | Test (fichero/caso) | Verif. | Estado |
|---|---|---|---|---|
| CA-1 | `src/i18n/gl.ts`, `src/i18n/es.ts` (clave `about` del espacio `site`) | `tests/site/identity.test.ts` 1–5 (los tres espacios de nombres de los dos bundles y el HTML de las cuatro rutas, más el caso 4 que impide que la barrera sea vacua); `tests/site/i18n.test.ts` 6 (modulado: sigue exigiendo `tremen.dev`, pasa a exigir que no haya persona) | | ❌ |
| CA-2 | `src/site/umbrella.ts` (**nuevo**, `UMBRELLA_URL` + contrato en la cabecera), `src/i18n/site-bundle.ts` (clave `umbrellaLink`), `src/i18n/gl.ts`, `src/i18n/es.ts`, `src/site/project-page.tsx` | `tests/site/identity.test.ts` 6 (el `<a href>` real), 7 (etiqueta desde i18n, distinta en cada lengua), 8 (`about` sigue nombrando tremen.dev en prosa), 9 (una sola constante, y **no** en `site/contact.ts`), 10 (el contrato en la cabecera); `tests/site/pages.test.ts` 16 (modulado: barrera estrechada de URL absolutas) | | ❌ |
| CA-3 | — (no es código: se comprueba contra dos sitios vivos) | — . Evidencia recogida abajo en «Evidencia de implementación»; **el CA es del verificador** | | ❌ |
| CA-4 | `src/i18n/gl.ts`, `src/i18n/es.ts` (clave `measuring`) | `tests/site/pages.test.ts` 11 (modulado: de exigir la enumeración a prohibirla, sobre el espacio `site` **entero** y el HTML de las dos rutas de proyecto) | | ❌ |
| CA-5 | `src/i18n/gl.ts`, `src/i18n/es.ts` (clave `measuring`, tercera oración) | `tests/site/i18n.test.ts` 9 (`NOT_MEASURING_YET` ampliada con las cuatro formas de subconjunto) y 10 (referente exigido cambiado; `a fonte oficial` y `robots.txt` intactos) | | ❌ |
| CA-6 | — (es una cláusula sobre el perímetro, no código) | `npm run lint`, `npm run typecheck`, `npx vitest run --typecheck`; comparación de `/robot` con `git archive` **sin `checkout`** | | ❌ |
| CA-7 | — (dictámenes) | 7.2 emitido y transcrito abajo; **7.1 PENDIENTE** | | ❌ |

## Veredicto del verificador
<!-- GREEN/RED + fecha + resumen. Lo escribe SOLO sdd-verificador. -->

## Evidencia visual
<!-- Tabla CA → captura en _qa/SPEC-007/. Informe HTML opcional: _qa/SPEC-007/informe.html -->

## Evidencia de implementación

### Los literales nuevos, citados textualmente

**No están dados por buenos**: `/sdd-lingua` (CA-7.1) no ha dictaminado. Van aquí
íntegros para que pueda hacerlo sin leer el diff.

`gl.site.about`
> marcador.gal é un proxecto de tremen.dev. O enderezo de contacto é {mailbox}. Escribe aí para calquera cousa que teña que ver con este sitio ou co rastrexador, e respondemos.

`gl.site.umbrellaLink` *(nueva)*
> tremen.dev — o paraugas deste proxecto

`gl.site.measuring`
> O obxecto do estudo son as opcións de obter os resultados do fútbol galego: que vías hai para lelos e canto traballo levan. A medición aínda non comezou e non hai ningunha cifra. A fonte oficial das competicións que se queren medir non se rastrexa, porque o seu ficheiro robots.txt non o permite e respectalo é unha norma do proxecto: esa é unha das razóns polas que o estudo está parado.

`es.site.about`
> marcador.gal es un proyecto de tremen.dev. La dirección de contacto es {mailbox}. Escribe ahí para cualquier cosa que tenga que ver con este sitio o con el rastreador, y respondemos.

`es.site.umbrellaLink` *(nueva)*
> tremen.dev — el paraguas de este proyecto

`es.site.measuring`
> El objeto del estudio son las opciones de obtener los resultados del fútbol gallego: qué vías hay para leerlos y cuánto trabajo llevan. La medición todavía no ha empezado y no hay ninguna cifra. La fuente oficial de las competiciones que se quieren medir no se rastrea, porque su fichero robots.txt no lo permite y respetarlo es una norma del proyecto: esa es una de las razones por las que el estudio está parado.

Ninguna otra clave se toca. Los espacios `crawler` y `titles` quedan **byte a
byte como estaban**.

### De dónde sale cada afirmación de hecho que queda en el texto

Dos rondas de SPEC-004 fallaron por redactar desde el enunciado de un finding en
vez de leer la evidencia (F-SPEC-004-5 y F-SPEC-004-8). Frase a frase:

| Afirmación | Fuente, fichero y línea |
|---|---|
| «marcador.gal é un proxecto de tremen.dev» | `docs/adr/ADR-012-identidad-publica-del-sitio-sin-nombre-con-paraguas-y-con-buzon-delante.md`, §Decisión 1: «La identidad pública del proyecto es **tremen.dev**» |
| «O enderezo de contacto é ola@tremen.dev» | `src/site/contact.ts:21` (`MAILBOX`, constante única de SPEC-004 CA-13). Interpolado, nunca escrito: `tests/site/i18n.test.ts` 8 lo comprueba |
| «Escribe aí … e respondemos» (compromiso, no hecho del mundo) | Ya publicado y sin cambiar en `gl.crawler.contact` y `gl.crawler.stop` («escribe a {mailbox} e deixamos de facelo»), y en la carta: `docs/negocio/carta-rfgf-acceso.md:69` («escríbanme a ola@tremen.dev e respondo») |
| «o paraugas deste proxecto» / «el paraguas de este proyecto» | Palabras del propio Alberto Fojo, 2026-09-01, citadas en `SPEC-007.md` §Problema pt. 1: «prefiero que marcador.gal quede **bajo el paraguas de tremen.dev**»; y ADR-012 §Decisión 2 |
| «as opcións de obter os resultados do fútbol galego» | Palabras de Alberto Fojo, 2026-09-01, citadas en `SPEC-007.md` §Problema pt. 2: «con dicir que se medirán as opcións de obter resultados do fútbol galego abonda» |
| «que vías hai para lelos» | `docs/epicas/EPIC-001-spike-ingesta/hallazgos/fontes-capturables.md:64`: «**Hay una sola fuente automática capturable: `ceroacero.es`**». Es literalmente la pregunta abierta del spike |
| «e canto traballo levan» | `CLAUDE.md` §Estado actual: «medir latencia, cobertura, conflictos y **minutos de operación manual**». Es la generalización de esa cuarta cifra, dicha sin nombrarla (CA-4.2) |
| «A medición aínda non comezou e non hai ningunha cifra» | `CLAUDE.md` §Estado actual: «**La ventana de observación no se ha corrido** … EPIC-001 **no tiene todavía ninguna de sus cuatro cifras**». Frase **sin tocar** desde SPEC-004, ya verificada |
| «A fonte oficial … non se rastrexa, porque o seu ficheiro robots.txt non o permite» | `docs/fundacion/dominio.md:57`: «**futgal.es** … **Fuente oficial** de las dos competiciones del spike … **Hoy no capturable** (ADR-008 §1) … termina en `User-agent: *` / `Disallow: /`: nuestro user-agent cae en el comodín». Y `hallazgos/fontes-capturables.md:66`: «`futgal.es`, la **oficial** y de peso 1.0, no es capturable: su `robots.txt` prohíbe el rastreo» |
| «respectalo é unha norma do proxecto» | `docs/fundacion/reglas.md:136` — **RN-11**: «Respetar robots.txt, identificar el user-agent y no bajar de 1 petición por minuto por competición» |
| «esa é unha das razóns polas que o estudo está parado» | El matiz «**unha das**» viene de SPEC-004 y se conserva: `CLAUDE.md` §Estado actual dice que la ventana «hoy **no se puede correr entera**», no que la única causa sea futgal |
| El referente «as competicións que se queren medir» abarca **las dos**, y por eso no reintroduce el error de F-SPEC-004-8 | `hallazgos/fontes-capturables.md:34-35`: `ceroacero.es` sirve **Preferente Futgal G1** (227 KB, **50** equipos) **y** **Terceira RFEF G1** (251 KB, **50** equipos). Lo no capturable es la **fuente oficial de ambas**, nunca «una de las dos» |

### Comprobado rompiendo: 20 mutaciones, 19 muerden y la que no es la que no debe

Cada mutación se aplicó sobre el árbol de trabajo y se revirtió copiando el
fichero original (**sin `git stash`, `git reset` ni `git restore`**). El árbol
quedó idéntico a `HEAD` al terminar (`git diff HEAD -- src tests` vacío).

| # | Mutación | Resultado |
|---|---|---|
| M1 | Vuelve «levado por Alberto Fojo» a `gl.about` | 🔴 `identity` 1 **y** 3, `i18n` 6 — **3 rojos** |
| M2 | Vuelve «Non hai empresa nin equipo detrás: unha soa persoa … por conta propia» | 🔴 `identity` 2 y 3 |
| M3-bis | El nombre reaparece en el bundle **`crawler`**, que no es de donde salió | 🔴 `identity` 1 y 3 — **la barrera ancha gana lo que pagó** |
| M4 | El nombre reaparece en un **título** (`es.titles.project`) | 🔴 `identity` 1 |
| M5 | Se borra el `<a>` del paraguas de `project-page.tsx` | 🔴 `identity` 6 y 7, `pages` 2, 5 y 16 — **5 rojos** |
| M6 | El enlace pasa a texto plano (sin `<a href>`) | 🔴 `identity` 6 y 7, `pages` 16 |
| M7 | La URL se escribe a mano en el JSX (segunda copia) | 🔴 `identity` 9 |
| M8 | La URL se muda a `site/contact.ts`, el cajón de sastre prohibido | 🔴 `identity` 9 **y `contact` 4**, que es la barrera de SPEC-004 que CA-2.2 no quiere tumbar |
| M9 | Cae «THE MAILBOX IS NOT TO BE TOUCHED» del contrato | 🔴 `identity` 10 |
| M10 | Cae «that it resolves» del contrato | 🔴 `identity` 10 |
| M11 | Vuelve «Terceira RFEF G1 e Preferente Futgal G1» a `gl.measuring` | 🔴 `pages` 11 |
| M12 | Vuelven «latencia» y «cobertura» a `es.measuring` | 🔴 `pages` 11 |
| M13 | La enumeración **se muda** de `measuring` a `noProduct` | 🔴 `pages` 11 — por eso la lista negra mira el espacio `site` entero |
| M14 | Cae «oficial» de `gl.measuring` | 🔴 `i18n` 10 |
| M15-bis | Cae `robots.txt` de `es.measuring` | 🔴 `i18n` 10 |
| M16 | **Recaída de F-SPEC-004-8**: «a fonte oficial **dunha das** competicións…» | 🔴 `i18n` 9 |
| M17 | Recaída en castellano: «la fuente oficial **de una de las** competiciones…» | 🔴 `i18n` 9 |
| M18 | Recaída blanda: «la fuente oficial **de una competicion** del estudio» | 🔴 `i18n` 9 **y** 10 |
| M19 | Cae la cláusula del `robots.txt` entera de `gl.measuring` | 🔴 `i18n` 10 |
| M20 | (control) `/robot` sigue sirviendo `medicion de latencia` | 🟢 `crawler-page` no lo penaliza — **la barrera de CA-4 no es global, y por eso `/robot` no se pone rojo**. Es exactamente lo que CA-4 exige |

### Sobre el HTML **servido** por `next build && next start`

`npm run build` limpio; `next start` en `:3117`. Capturadas las cuatro rutas.

- **CA-1.** `grep -oiE 'alberto|fojo|unha soa persoa|una sola persona|por conta
  propia|por cuenta propia|non hai empresa|no hay empresa|nin equipo|ni equipo'`
  sobre `/proxecto`, `/es/proxecto`, `/robot` y `/es/robot` → **cero
  coincidencias en las cuatro**.
- **CA-2.1.** `/proxecto` sirve
  `<a href="https://tremen.dev">tremen.dev — o paraugas deste proxecto</a>`;
  `/es/proxecto` sirve
  `<a href="https://tremen.dev">tremen.dev — el paraguas de este proyecto</a>`.
- **CA-2.4.** Ninguna URL absoluta en `src`, `srcset`, `<link href>` ni `url(…)`
  en **ninguna** de las cuatro rutas (`0` coincidencias). Las únicas URL
  absolutas del HTML servido de las rutas de proyecto son `https://tremen.dev`;
  en las de rastreador, `https://marcador.gal/robot` dentro del user-agent, como
  ya estaba. **Aviso para el verificador**: en el HTML **servido** la URL del
  paraguas aparece **dos veces**, no una — el `<a href>` y la copia serializada
  que Next mete en `self.__next_f.push(...)`. Las dos son la misma URL admitida y
  ninguna descarga nada; el test de la suite mira `renderToStaticMarkup`, donde
  sale una sola vez. Ver F-SPEC-007-2.
- **CA-4.** `grep` desacentuado de `terceira rfef|tercera rfef|preferente
  futgal|futgal|rfef|g1|latencia|cobertura|conflitos|conflictos|operacion manual`
  sobre `/proxecto` y `/es/proxecto` → **cero**. Y sobre `/robot` y `/es/robot`
  **sí** aparece `medicion de latencia`, que es la cadena literal del user-agent
  (SPEC-005 CA-2): la razón exacta por la que CA-4 acota la barrera y no la hace
  global.
- **Terceros nombrados** en las dos rutas de proyecto (`futgal|ceroacero|
  besoccer|flashscore|sofascore|rfgf`) → **cero**.
- **SPEC-004 CA-6 sigue verde sobre lo servido**: sin `<form`, `<input`, `<img`
  y sin ningún año `19xx/20xx` en las cuatro rutas.
- **CA-3.2 (dato para el verificador, que es quien cierra el CA).** El
  `href="mailto:ola@tremen.dev"` aparece en las cuatro rutas. En `/robot` está en
  el byte 1175 y el primer `<h2>` en el 1324; en `/es/robot`, 1185 frente a 1334:
  **el buzón va antes de cualquier encabezado de sección**, SPEC-005 CA-5 intacta.
  `https://tremen.dev` respondió `200` desde esta máquina el 2026-09-01, pero
  **CA-3 se cierra contra el despliegue, no contra `localhost`**.

### CA-6.4 — el HTML de `/robot` es el mismo de hoy

Con `git archive c80ff82` a un directorio temporal (**sin `checkout`**, precedente
de SPEC-006 CA-4.3), `next build` allí y `next start` en `:3118`:

| Ruta | base `sha256` | nuevo `sha256` | Diferencia |
|---|---|---|---|
| `/robot` | `6e466ff5…4abe6e` | `19db67bf…0154d4` | **una sola línea**: el `buildId` de Next (`me4ytNwsn7D0hYliO1nw0` → `FQYlPr_h9jES_nbaexu0i`) |
| `/es/robot` | `afcb0a51…6b0769` | `f7463a1b…99e157` | **la misma, y solo esa** |

Normalizando **únicamente** ese identificador —que aparece **una vez** en cada
documento y cambia en cada `build` pase lo que pase con el contenido—, los dos
pares son **byte a byte idénticos**: `/robot` `sha256 86fbd92a…0a54f`,
`/es/robot` `sha256 f1dbad6a…59b94`. **Control negativo en la misma ejecución:**
la misma normalización aplicada a `/proxecto` **no** los iguala, así que no está
tapando nada. La hoja de estilo servida es el mismo chunk en los dos árboles
(`/_next/static/chunks/00i-w_3ufi7w3.css`), es decir `globals.css` no se tocó.

El diff del **texto visible** de `/proxecto` y `/es/proxecto` entre los dos
despliegues son exactamente los dos cambios pedidos y nada más: la frase de
`about` y la de `measuring`, más el enlace nuevo.

### Gates (salida literal)

```
$ npm run lint
> marcador@0.0.1 lint
> oxlint --type-aware
(exit 0, sin salida)

$ npm run typecheck
> marcador@0.0.1 typecheck
> tsc --noEmit
(exit 0, sin salida)

$ npx vitest run --typecheck
 Test Files  1 failed | 70 passed (71)
      Tests  1 failed | 615 passed (616)
Type Errors  no errors

 FAIL  tests/site/crawler-page.test.ts > CA-13 — la página del rastreador no cita
 a ningún tercero > 19. la prohibición es de ESTAS rutas, no del sitio: /proxecto
 sigue nombrando las competiciones
 AssertionError: expected 'O obxecto do estudo son as opcións de…'
   to contain 'Preferente Futgal G1'
   ❯ tests/site/crawler-page.test.ts:302:31
```

Referencia de partida en `c80ff82`: **70 ficheros, 606 tests, todo verde**.
Ahora: 71 ficheros, 616 tests, **615 verdes y 1 rojo**, el de F-SPEC-007-1.
`lint` y `typecheck` en `0`.

### Perímetro real del cambio (CA-6.2 y CA-6.3)

`src/`, y solo esto:
`src/i18n/gl.ts`, `src/i18n/es.ts` (clave `site`), `src/i18n/site-bundle.ts`,
`src/site/project-page.tsx` y `src/site/umbrella.ts` (el módulo de la constante
de CA-2.2). **`src/mirror/`, `src/model/`, `src/db/`, `src/raw/`, `migrations/` y
los espacios `crawler` y `titles`: ni una línea.**

`tests/`: `tests/site/pages.test.ts` (casos **11** y **16**, más el `import` de
`UMBRELLA_URL`) y `tests/site/i18n.test.ts` (casos **6**, **9** y **10**) —los
cinco autorizados nominalmente— **más un fichero nuevo**,
`tests/site/identity.test.ts`. Ver F-SPEC-007-4: la letra de CA-6.2 dice «el
diff toca exclusivamente» esos dos ficheros; su frase operativa dice «ningún otro
fichero de test **se modifica**» y la nota 7 del gate explica que lo incómodo es
*modificar* material verificado, no añadir. Sin fichero nuevo, CA-1 (barrera sobre
tres espacios y cuatro rutas), CA-2.1, CA-2.2 y CA-2.3 se quedaban **sin test**,
porque `contact.test.ts` está expresamente cerrado por su propio caso 4. Se
interpreta como «no se toca ningún test ajeno», y se declara aquí para que el
verificador lo juzgue en vez de descubrirlo.

**`docs/negocio/carta-rfgf-acceso.md` no se toca en ninguno de los tres commits**
(CA-6.5). Ver F-SPEC-007-3.

## Salvedades / follow-ups

- **F-SPEC-007-1 — CA-4 y CA-6 no pueden cumplirse los dos a la vez: hay un test
  ajeno que se pone rojo, y NO lo he tocado.** `tests/site/crawler-page.test.ts`
  caso **19** —«la prohibición es de ESTAS rutas, no del sitio: /proxecto sigue
  nombrando las competiciones»— afirma literalmente
  `expect(gl.site.measuring).toContain('Preferente Futgal G1')` y lo mismo para
  `es.site.measuring` (el caso empieza en la línea 299; las dos aserciones son las
  líneas 302 y 303). CA-4 prohíbe justo eso. **Los dos no
  pueden ser verdad.**
  La spec previó la coherencia pero se equivocó de caso: CA-4 dice «la salvedad de
  SPEC-005 CA-13 … queda sin objeto, pero **su test no cambia y sigue verde**».
  Eso es cierto del **caso 18** (que `/robot` no nombre a ningún tercero: sigue
  verde) y **falso del caso 19**, que es el *guardián* de esa salvedad y lee el
  bundle del sitio, no el HTML de `/robot`.
  CA-6.2 dice qué hacer con esto y lo dice sin ambigüedad: «**cualquier otro test
  que se ponga rojo es un RED y una vuelta al arquitecto, no una excepción añadida
  a mano**». Así que **no lo he tocado**, no he añadido excepción y no he relajado
  CA-4. Queda un rojo declarado.
  **Destino: `sdd-arquitecto`.** La decisión es suya, no mía: o autoriza retirar el
  caso 19 (su premisa dejó de existir el día que `/proxecto` dejó de nombrar
  competiciones) o modula CA-4. **Consecuencia mientras tanto: CA-6.1 no se
  cumple** y la spec no puede cerrar en GREEN.

- **F-SPEC-007-2 — en el HTML servido, la URL del paraguas aparece dos veces, no
  una.** El `<a href>` y la copia que Next serializa en el payload RSC
  (`self.__next_f.push(...)`). No es un incumplimiento —es la misma URL admitida,
  y el payload no descarga nada de `tremen.dev`— pero quien verifique contra el
  despliegue con un «exactamente una ocurrencia» sacará un RED falso. El test de
  la suite mira `renderToStaticMarkup`, donde aparece una sola vez. **Destino:
  nota para el verificador de esta spec**, no trabajo.

- **F-SPEC-007-3 — la rama de partida ya traía `docs/negocio/carta-rfgf-acceso.md`
  modificada, sin commitear, antes de que yo empezase.** El cambio (añadir «En
  https://marcador.gal/proxecto está quen hai detrás disto e que se vai medir; non
  hai produto nin lista de espera, só iso») no es mío: estaba en el árbol de
  trabajo al crear la rama, junto con `ADR-012`, la spec y el ledger de SPEC-007,
  `_epica.md`, `docs/tablero.md` y el ledger de SPEC-004. **Ninguno de mis tres
  commits lo toca**, así que CA-6.5 se cumple por mi parte, pero conviene que
  nadie lea ese `M` en `git status` como obra de esta implementación. La frase
  además sigue siendo verdadera después del cambio: `/proxecto` sigue diciendo
  quién hay detrás —tremen.dev, ahora además enlazado— y sigue diciendo qué se va
  a medir, en general. **Destino: nota; lo confirma el verificador.**

- **F-SPEC-007-4 — CA-6.2 no deja sitio a los tests que la propia spec exige.**
  Su letra («el diff, acotado a `tests/`, toca **exclusivamente** esos dos
  ficheros») entra en conflicto con CA-1, CA-2.1, CA-2.2 y CA-2.3, que piden
  comprobaciones nuevas que no caben en los cinco casos autorizados y que no
  pueden ir a `contact.test.ts` (su caso 4 lo cierra). He añadido **un** fichero
  nuevo, `tests/site/identity.test.ts`, leyendo la cláusula por su frase operativa
  —«ningún otro fichero de test **se modifica**»— y por la nota 7 del gate. **No he
  modificado ningún test ajeno.** **Destino: confirmación del arquitecto**, junto
  con F-SPEC-007-1.

- **F-SPEC-007-5 — `/sdd-lingua` (CA-7.1) sigue PENDIENTE y los literales nuevos
  NO están dados por buenos.** Están transcritos íntegros y en las dos lenguas
  arriba, en «Los literales nuevos, citados textualmente», para que el dictamen se
  emita sobre el texto y no sobre el diff. Lo gestiona el orquestador; no se ha
  invocado desde aquí. **CA-7 no puede cerrarse sin él.**

- **F-SPEC-007-6 — el paraguas sigue sin identificar a nadie, y ningún test de
  aquí se enterará si deja de responder.** Es el riesgo que ADR-012 ya registra
  con disparador; queda repetido aquí solo porque ahora hay código que se apoya
  en él. La cabecera de `src/site/umbrella.ts` lo dice en la línea que alguien va
  a editar. **Destino: EPIC-MEJORA**, como decide ADR-012.

## Dictámenes

### `/sdd-legal-datos` (CA-7.2) — EMITIDO el 2026-09-01. **No bloquea.**

Transcrito tal y como llegó:

> El art. 10 LSSI-CE obliga a los **prestadores de servicios de la sociedad de la
> información**; la exclusión aplica a sitios **sin ánimo de lucro ni actividad
> comercial**, y hay actividad económica con ingresos **directos o indirectos**
> (publicidad o patrocinio). `marcador.gal` **hoy no tiene ninguna**: sin
> anuncios, sin patrocinio, sin formulario, y **verificado en producción con cero
> cookies, cero analítica y cero peticiones externas**. **RN-11 queda cumplida por
> el buzón.**
>
> **Disparador: el día que el sitio lleve patrocinio, publicidad o formulario de
> lista de espera hay actividad económica indirecta y el art. 10 pasa a aplicar** —
> identificación obligatoria; **revisión profesional antes de monetizar**.

Es decir: **no exige identificación en el propio sitio**, así que ADR-012 no
vuelve al arquitecto por esta vía y el par «paraguas enlazado + buzón delante» es
suficiente. El disparador queda escrito, y lo que lo dispararía —patrocinio,
publicidad, lista de espera— es exactamente lo que `pages.test.ts` caso 8 y CA-6
de SPEC-004 ya prohíben en el HTML, así que el propio sitio avisa antes.

### `/sdd-lingua` (CA-7.1) — **PENDIENTE**

No emitido. Ver F-SPEC-007-5. **Los literales nuevos no están dados por buenos.**

## Cómo retomar (handoff)

**Estado real.** Los cuatro CA de contenido —CA-1, CA-2, CA-4 y CA-5— están
implementados con test y comprobados rompiendo (20 mutaciones), sobre la suite y
sobre el HTML servido por `next build && next start`. CA-6 está cumplido en 6.2
(con la salvedad F-SPEC-007-4), 6.3, 6.4 y 6.5, y **no en 6.1**: la suite tiene un
rojo. CA-3 y CA-7 no son míos.

**Lo primero que hay que resolver, y bloquea el cierre.** F-SPEC-007-1: el caso 19
de `tests/site/crawler-page.test.ts` exige lo contrario que CA-4. Es decisión del
arquitecto, y CA-6.2 dice explícitamente que no se parchea a mano. Hasta que se
decida, `npm run test` sale con un fallo y **la spec no puede ir a `hecho`**.

**Lo segundo.** F-SPEC-007-4: confirmar (o corregir) la interpretación de CA-6.2
que permitió añadir `tests/site/identity.test.ts`. Si el arquitecto lo rechaza,
hay que decidir dónde viven los tests de CA-1, CA-2.1, CA-2.2 y CA-2.3, porque
sin ellos esos criterios no están implementados.

**Lo tercero.** CA-7.1: `/sdd-lingua`, sobre los seis literales transcritos
arriba. Bloqueante para el cierre.

**Lo que le queda al verificador.** CA-3 entero, contra el despliegue y no contra
`localhost`: que `/proxecto` y `/es/proxecto` den `200` y sirvan el enlace, que
`https://tremen.dev` responda `200`, y —la mitad que no puede caerse— que el
buzón siga como `mailto:` en las dos rutas de proyecto y en el **primer bloque**
de `/robot` y `/es/robot`. Y leer «quen está detrás» para juzgar que dice quién
responde sin nombrar a nadie ni insinuar tamaño (CA-1, mitad de lectura).

**Dónde está todo.** Rama
`ft/SPEC-007-el-sitio-no-nombra-a-ninguna-persona-y-dice-en-general-que-se-mide`,
tres commits (`dac4823`, `c199a28`, `ac9b90b`) sobre `c80ff82`. Sin push y sin PR.
Los artefactos de documentación que venían sin commitear de la rama anterior
—`ADR-012`, la spec de SPEC-007, `_epica.md`, `docs/tablero.md`, el ledger de
SPEC-004 y la carta— **siguen sin commitear**: no son míos y no los he tocado
salvo este ledger y la transición de estado de la spec.
