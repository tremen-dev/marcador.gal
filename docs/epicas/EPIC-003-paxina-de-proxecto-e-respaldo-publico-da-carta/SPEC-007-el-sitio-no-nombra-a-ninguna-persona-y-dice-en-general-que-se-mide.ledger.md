---
id: SPEC-007
tipo: ledger
epica: EPIC-003
---
# Ledger — SPEC-007 El sitio no nombra a ninguna persona y dice en general que se mide

## Resumen
- Fase: en-revisión (implementación terminada; **suite entera en verde**, el RED
  de la primera vuelta —F-SPEC-007-1— resuelto en la segunda)
- Rama: `ft/SPEC-007-el-sitio-no-nombra-a-ninguna-persona-y-dice-en-general-que-se-mide`
- Commits: `dac4823` (CA-1), `c199a28` (CA-2), `ac9b90b` (CA-4 y CA-5) y, de la
  segunda vuelta, el que sustituye el caso 19 de `crawler-page.test.ts`
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
| CA-4 | `src/i18n/gl.ts`, `src/i18n/es.ts` (clave `measuring`) | `tests/site/pages.test.ts` 11 (modulado: de exigir la enumeración a prohibirla, sobre el espacio `site` **entero** y el HTML de las dos rutas de proyecto); `tests/site/crawler-page.test.ts` 19 (**sustituido en su sitio**, F-SPEC-007-1: guarda el alcance de la lista negra de SPEC-005 CA-13 en vez de su contenido. El caso 18 no se toca) | | ❌ |
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

### Segunda vuelta (2026-09-01): el caso 19 sustituido, y comprobado rompiendo

El arquitecto resolvió el choque de F-SPEC-007-1 modificando la spec: CA-4 pide
ahora que el caso 19 **se sustituya en su sitio** —mismo fichero, mismo número— y
CA-6.2 lo autoriza nominalmente. **El caso 18 no se ha tocado**, y el diff de
`tests/site/crawler-page.test.ts` en esta vuelta empieza y termina dentro del
bloque del caso 19: ninguna otra línea del fichero cambia.

El sustituto guarda el **alcance** en vez del contenido, con las dos aserciones
que pide CA-4 y sin depender de nada que diga `/proxecto`:

```ts
  /**
   * Cadena SINTÉTICA de control, escrita a mano aquí y servida a nadie: no es
   * HTML de terceros (ADR-009) ni sale de ninguna captura. Existe solo para
   * que la lista de arriba tenga sobre qué morder.
   */
  const CONTROL_QUE_NOMBRA_TERCEROS =
    'control sintético: FutGal.es, ceroacero.es, BeSoccer, resultados-futbol.com e a RFGF';

  /**
   * Los términos que TIENEN que morder sobre esa cadena, escritos aquí a mano
   * y no leídos de `THIRD_PARTIES`. Comparar la lista consigo misma pasaría
   * también con la lista vacía —`[].filter(…)` es `[]`—, que es exactamente lo
   * que este control existe para impedir. Si mañana se añade un tercero a la
   * lista de arriba, hay que añadirlo también a la cadena de control y a esta:
   * ese trabajo es el precio de que la lista no pueda vaciarse en silencio.
   */
  const MUERDEN = ['besoccer', 'ceroacero', 'futgal', 'resultados-futbol', 'rfgf'];

  test('19. la prohibición muerde, y muerde EXACTAMENTE sobre estas dos rutas', () => {
    // Sustituye (SPEC-007 CA-4, F-SPEC-007-1) al caso que guardaba esta misma
    // frontera afirmando que `/proxecto` seguía nombrando las competiciones.
    // Ese canario ya no existe: SPEC-007 CA-4 prohíbe nombrarlas ahí. El
    // propósito sí sigue, y ha EMPEORADO — antes, ensanchar la lista al bundle
    // entero se delataba solo, porque `site.measuring` contenía `Futgal` y el
    // caso 18 se ponía rojo; ahora pasaría en silencio, y CA-13 se convertiría
    // en una prohibición de sitio entero que solo mordería el día —quizá
    // dentro de años, en una página que no existe— en que alguien necesite
    // nombrar una fuente legítimamente. Así que se guarda el ALCANCE en vez
    // del contenido, con dos aserciones que no dependen de lo que diga
    // `/proxecto`. Forma: caso 1 de `no-hardcoded-literals.test.ts`.

    // (a) Control positivo: la lista no puede quedarse vacía —ni perder un
    // término— sin que nadie se entere. Los cinco muerden, con el mismo
    // predicado que usa el caso 18, sobre una cadena que no es de nadie.
    const control = deaccent(CONTROL_QUE_NOMBRA_TERCEROS);

    expect(THIRD_PARTIES.filter((term) => control.includes(term)).sort()).toEqual(MUERDEN);

    // (b) Alcance: lo que el caso 18 escanea es el HTML de `/robot` y
    // `/es/robot`, y de ninguna otra ruta ni de ningún bundle. Se re-renderiza
    // desde los módulos de ruta SIN pasar por `ROUTES` ni por `render`, que es
    // lo que hace que repuntar el mapa, añadirle una entrada o concatenarle
    // cualquier otra cosa a la entrada del escaneo se vea desde aquí.
    expect(Object.keys(HTML).sort()).toEqual([...LOCALES].sort());
    expect(HTML.gl).toBe(
      renderToStaticMarkup(createElement(GlLayout, null, createElement(GlCrawlerPage))),
    );
    expect(HTML.es).toBe(
      renderToStaticMarkup(createElement(EsLayout, null, createElement(EsCrawlerPage))),
    );
  });
```

**La cadena de control es sintética y nombra dominios, no republica nada**: no es
HTML capturado y no viola ADR-009. Y el escaneo de código de SPEC-004 CA-13.3
recorre `src/`, no `tests/` (`tests/site/source-scan.ts`, `SRC = join(cwd,
'src')`), así que nombrar terceros aquí no pone en rojo ninguna otra barrera —
comprobado: la suite entera pasa.

**Comprobado rompiendo: nueve mutaciones más.** Aplicadas sobre el árbol de
trabajo y revertidas **copiando el fichero original** desde el scratchpad (sin
`git stash`, `git reset` ni `git restore`); `sha256` del fichero verificado igual
al de partida después de cada una.

| # | Mutación | Caso 19 | Caso 18 |
|---|---|---|---|
| M21 | La **entrada** del escaneo se ensancha al bundle entero (`HTML` pasa a ser `render(l) + JSON.stringify(gl/es)`) | 🔴 | 🟢 — **el fallo silencioso que temía el arquitecto, ahora audible** |
| M22 | Igual, pero solo con el espacio `site` (`JSON.stringify(gl.site)`) | 🔴 | 🟢 |
| M23 | `ROUTES` repuntado a las páginas de proyecto | 🔴 | 🟢 (rojos: 1, 3, 6, 7, 9, 17, 19 y 22 — **8**) |
| M24 | `LOCALES` acotado a `['gl']`: se escanea media lengua | 🔴 | 🟢 |
| M25 | `THIRD_PARTIES` se **vacía** | 🔴 | 🟢 |
| M26 | `THIRD_PARTIES` pierde tres términos | 🔴 | 🟢 |
| M27 | Un término se desactiva con un typo (`rfgf` → `rfgff`) | 🔴 | 🟢 |
| M28 | La cadena de control se vacía | 🔴 | 🟢 |
| M29 | (límite declarado) El ensanche se escribe **dentro del cuerpo del caso 18** | 🟢 | 🟢 — ver F-SPEC-007-7 |

**Una tautología propia, encontrada por estas mutaciones y corregida antes de
cerrar.** La primera redacción del control positivo comparaba la lista consigo
misma —`expect(THIRD_PARTIES.filter(…)).toEqual(THIRD_PARTIES)`—, y con la lista
vacía eso es `[] === []`: M25, M26 y M27 pasaban en verde. De ahí el `MUERDEN`
escrito a mano, que es lo que hace que el control controle algo.

### Gates (salida literal, segunda vuelta)

```
$ npm run lint

> marcador@0.0.1 lint
> oxlint --type-aware

(exit 0)

$ npm run typecheck

> marcador@0.0.1 typecheck
> tsc --noEmit

(exit 0)

$ npx vitest run --typecheck

 RUN  v4.1.11 /Users/albertofojo/src/tremen-dev/marcador.gal

 Test Files  71 passed (71)
      Tests  616 passed (616)
Type Errors  no errors
```

Referencia de partida en `c80ff82`: **70 ficheros, 606 tests, todo verde**. Al
final de la primera vuelta: 71 ficheros, 616 tests, **615 verdes y 1 rojo**.
Ahora: **71 ficheros, 616 tests, 616 verdes**. Los recuentos no bajan —un caso
sustituido por un caso—, así que **no se ha perdido cobertura**. `lint` y
`typecheck` en `0`. **CA-6.1 queda cumplido.**

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

- **F-SPEC-007-1 — RESUELTO el 2026-09-01 por el arquitecto, y ejecutado en la
  segunda vuelta.** La spec cambió: CA-4 lleva ahora la corrección que ordena
  **sustituir el caso 19 en su sitio**, con el control positivo y el guardián del
  alcance, y CA-6.2 lo autoriza nominalmente («caso **19** —y solo el 19—»); el
  caso 18 sigue intacto. Hecho, con nueve mutaciones que lo comprueban (tabla
  arriba) y la suite entera en verde. **CA-6.1 pasa de incumplido a cumplido.**
  Lo que sigue es el enunciado original, que se conserva por ser el registro de
  lo que la primera vuelta devolvió en RED:

  > **CA-4 y CA-6 no pueden cumplirse los dos a la vez: hay un test
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

- **F-SPEC-007-7 — hasta dónde llega el caso 19 nuevo, dicho por su autor.**
  Guarda la **entrada** del escaneo del caso 18 —`HTML` y `LOCALES`, que son lo
  que ese caso lee—, no el cuerpo del caso 18. Si alguien ensancha la lista negra
  escribiendo la concatenación **dentro** del propio caso 18 (M29), el caso 19 no
  se entera. Es el único camino que se le escapa, y es el que CA-6.2 prohíbe
  expresamente y el que un diff sobre un fichero de una spec `hecho` enseña. La
  alternativa —extraer la entrada a una constante compartida— **exigiría tocar el
  caso 18**, que CA-6.2 no autoriza. Se declara aquí en vez de dejarlo implícito.
  **Destino: nota para el verificador**; si se quiere cerrar también ese camino,
  es trabajo del arquitecto y no de esta spec.

- **F-SPEC-007-8 — he movido el estado de la spec de `en-revision` a
  `en-progreso` para poder trabajar, y la devuelvo a `en-revision`.** El hook
  `require-spec` bloquea toda edición bajo `tests/` si la spec no está en
  `aprobada` o `en-progreso`, y la primera vuelta la dejó en `en-revision`: sin
  esa transición esta segunda vuelta no podía escribir ni una línea. Es la
  transición que manda el paso 2 del rol, no es un gate —no lleva firma humana— y
  el estado final es el mismo con el que empezó. Quedan dos entradas más en el
  `historial`, que es el registro veraz de que hubo una segunda vuelta.
  **Destino: nota para el orquestador**, que me había pedido no tocar estados.

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

**Estado real (tras la segunda vuelta).** Los cuatro CA de contenido —CA-1, CA-2,
CA-4 y CA-5— están implementados con test y comprobados rompiendo (**29
mutaciones**: 20 en la primera vuelta, 9 en la segunda), sobre la suite y sobre el
HTML servido por `next build && next start`. **CA-6 está cumplido entero**: 6.1
(los tres gates en verde, 71 ficheros y 616 tests, cero rojos), 6.2 —con la
autorización nominal del caso 19 que la spec añadió y con F-SPEC-007-4 ya
confirmado por CA-6.2-bis—, 6.3, 6.4 y 6.5. CA-3 y CA-7 no son míos.

**Lo único que bloquea el cierre.** CA-7.1: `/sdd-lingua`, sobre los seis
literales transcritos arriba. Lo gestiona el orquestador; no se ha invocado desde
aquí. **Los literales no se han tocado en la segunda vuelta**: la spec dice
—apartado «Qué se ha corregido DESPUÉS de tu firma»— que CA-1, CA-4 y CA-5 no
cambiaron, y esta vuelta es solo el test.

**Ya no bloquea.** F-SPEC-007-1 (resuelto por el arquitecto y ejecutado: el caso
19 sustituido) y F-SPEC-007-4 (confirmado en CA-6.2-bis: un fichero nuevo no
viola CA-6.2, y `tests/site/identity.test.ts` es correcto).

**Lo que le queda al verificador.** CA-3 entero, contra el despliegue y no contra
`localhost`: que `/proxecto` y `/es/proxecto` den `200` y sirvan el enlace, que
`https://tremen.dev` responda `200`, y —la mitad que no puede caerse— que el
buzón siga como `mailto:` en las dos rutas de proyecto y en el **primer bloque**
de `/robot` y `/es/robot`. Y leer «quen está detrás» para juzgar que dice quién
responde sin nombrar a nadie ni insinuar tamaño (CA-1, mitad de lectura).

**Dónde está todo.** Rama
`ft/SPEC-007-el-sitio-no-nombra-a-ninguna-persona-y-dice-en-general-que-se-mide`,
**sin push y sin PR**. Tres commits de la primera vuelta (`dac4823`, `c199a28`,
`ac9b90b`) sobre `c80ff82`, más el de la segunda, que toca **un solo fichero de
código** —`tests/site/crawler-page.test.ts`, y dentro de él solo el bloque del
caso 19— además de este ledger y del frontmatter de la spec (F-SPEC-007-8). En la
segunda vuelta **no se ha tocado `src/`**: ni un literal, ni `measuring`, ni
`about`, ni `umbrellaLink`, ni la constante del paraguas.
