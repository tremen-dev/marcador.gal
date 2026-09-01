---
id: ADR-014
tipo: adr
estado: borrador
historial:
  - {estado: borrador, fecha: 2026-09-01, por: sdd-arquitecto}
---
# ADR-014: La cortesía RN-11 tiene un solo dueño, y sale de `src/mirror/`

- Deciders: propone `sdd-arquitecto` el 2026-09-01, al escribir la primera spec
  de EPIC-002 y encontrarse con que el primer adaptador de producción necesita
  exactamente la máquina de cortesía que hoy vive dentro del instrumento de
  medición de EPIC-001. **Aprueba: pendiente de gate humano.**
- Specs relacionadas: **SPEC-008** (adaptador de `ceroacero.es`, la que lo
  origina y lo consume), **SPEC-002** y **SPEC-003** (`hecho`: son las dueñas
  del código que se traslada), y aguas abajo todas las specs de EPIC-002 que
  pidan algo por HTTP a un tercero.

## Contexto

**RN-11 es regla dura y el no-negociable de legalidad de `FOUNDATION.md` la
repite.** Dice tres cosas verificables: respetar `robots.txt`, identificar el
user-agent y no bajar de 1 petición por minuto por competición. Hoy las tres
están implementadas **una vez**, y esa vez está dentro de `src/mirror/`, que es
el instrumento de medición de EPIC-001:

| Deber de RN-11 | Dónde vive hoy |
|---|---|
| `robots.txt` | `src/mirror/capture/robots.ts` (`parseRobots`, `robotsRegistry`, `robotsSkipReason`) |
| User-agent identificado | `src/mirror/user-agent.ts` (`USER_AGENT`, `USER_AGENT_PATTERN`, ADR-011) y `src/mirror/capture/http.ts` (`politeRequest`, la única puerta de salida) |
| 1 petición/min por par | `Capturer.#lastRequestAt` + `MIN_REQUEST_INTERVAL_MS` en `src/mirror/thresholds.ts` |

Ese código está verificado GREEN y no se ha tocado. Y ya hay una señal de que su
domicilio no es el correcto: **`src/site/crawler-page.tsx` importa
`@/mirror/user-agent`** para publicar la UA en `/robot` (SPEC-005). El sitio
público no tiene nada que ver con un test de espejo; importa de ahí porque es el
único sitio donde está.

EPIC-002 estrena `src/ingest/`, y su primer adaptador necesita las tres cosas.
La pregunta —de dónde las saca— no la ha decidido nadie, y la respuesta por
defecto de cualquiera que empiece a teclear es «me escribo un `parseRobots`».

**Y hay una prueba de que la respuesta por defecto es la peligrosa, con nombre y
fecha: F-SPEC-002-23.** El `parseRobots` que existe trata el `*` de una ruta como
carácter literal: `isAllowed()` devuelve `true` para
`https://www.besoccer.es/ajax/algo` pese a que besoccer publica
`Disallow: /ajax*`. Es un incumplimiento de RN-11 **sin que ningún test se ponga
rojo**, y muerde justo donde EPIC-002 va a trabajar, porque los marcadores en
vivo de los agregadores viven en endpoints `/ajax…`
(`hallazgos/fontes-capturables.md`).

Con **una** implementación, ese fallo se arregla una vez y queda arreglado para
todos los adaptadores presentes y futuros. Con **dos**, se arregla en la que
alguien miró. Y el modo de fallo de RN-11 no es una excepción en un log: es una
petición que sale, se sirve y no vuelve.

## Decisión

### 1. Existe **un solo** módulo de cortesía RN-11, y no está en `src/mirror/`

Se crea **`src/polite/`** —el nombre que el propio código ya usa
(`politeRequest`, `politeFetch`)— y se trasladan a él, **sin cambio de
comportamiento**, las piezas de la tabla de arriba:

```
src/polite/robots.ts       RobotsPolicy, parseRobots, robotsRegistry, robotsSkipReason
src/polite/http.ts         politeRequest, politeFetch, globalFetcher y sus tres errores
src/polite/user-agent.ts   USER_AGENT, USER_AGENT_PATTERN y las constantes de ADR-011
src/polite/rate-limit.ts   el mínimo de 1 petición/minuto por par, extraído del Capturer
```

`src/mirror/`, `src/ingest/` y `src/site/` **importan de ahí**. `src/mirror/` no
conserva copias ni reexporta: el traslado es un traslado, no una capa de
compatibilidad, porque una fachada que reexporta deja dos nombres para la misma
cosa y el siguiente que llegue elegirá el que encuentre antes.

**El traslado es de ficheros, no de comportamiento.** La prueba de que no cambió
nada es que `tests/mirror/` pasa entero sin tocar una sola aserción —solo rutas
de `import`—. Si hubiera que enmendar una aserción para que pasara, el traslado
está mal hecho y se para.

### 2. El único cambio de comportamiento admitido en el traslado es el arreglo de RN-11

`parseRobots` pasa a emparejar rutas conforme a **RFC 9309**: `*` como comodín de
cualquier secuencia, `$` como ancla de final de ruta, y el desempate entre un
`Allow` y un `Disallow` que casan por **longitud del patrón** —con el `Allow`
ganando el empate—. Los CA están en SPEC-008 (CA-1).

Va aquí y no queda como detalle de implementación porque es lo que convierte
esta decisión en urgente: sin el arreglo, centralizar la cortesía centraliza
también el defecto.

### 3. La política de `robots.txt` de un origen se obtiene, se archiva y caduca

`src/mirror/` carga el `robots.txt` desde disco antes de la ventana, y hace bien:
la ventana dura una hora y el operador está delante (F-SPEC-002-2). **En
producción no hay ninguna de las dos cosas**: no hay disco (ADR-004, ADR-005) y
no hay un momento «antes» —el cron es un tick de un minuto sin nadie mirando—.

Se decide, por tanto, para todo lo que corra fuera del instrumento:

1. El `robots.txt` de un origen se pide **como cualquier otra respuesta cruda**,
   por la misma puerta de `src/polite/http.ts`, y se **archiva en el raw store
   antes de parsearse**. RN-10 no tiene excepción por tipo de respuesta, y el
   motivo por el que un tick se saltó una fuente pasa a ser auditable **desde el
   archivo solo**, sin fe en un log.
2. **Como mucho una vez cada 6 horas por origen.** Es el mismo refresco que la
   épica fija para el calendario. Su coste es una petición por origen y medio
   día, que no compite con el presupuesto de 1/min por competición de RN-11 y se
   contabiliza aparte.
3. **Se falla cerrado.** Sin política vigente para un origen —nunca obtenida,
   caducada, o la petición falló— **no sale ninguna petición hacia ese origen** y
   el tick registra el motivo. Es la regla que `robotsRegistry` ya aplica por
   origen desconocido —«silencio no es consentimiento»— extendida al tiempo:
   una política de hace un mes es silencio con fecha vieja.
4. Se archiva con la clave que ya existe, sin migración y sin formato nuevo:
   `<source>/robots/<día>/<instante>-<digest>.txt`. Que el segundo segmento de la
   clave se llame `competition_id` y aquí lleve `robots` es una **licencia
   consciente y nombrada**, no un descuido: la clave se lee bien, el patrón de
   `src/raw/key.ts` no se toca y ninguna fuente queda mal etiquetada, que es el
   daño que ADR-008 §2 existe para evitar.

### 4. Qué queda prohibido a partir de aquí

- **Un segundo parser de `robots.txt`** en el repositorio, sea en `src/ingest/`,
  en un adaptador o en un script.
- **Construir la cabecera `User-Agent` fuera de `src/polite/http.ts`.** Una sola
  puerta de salida es lo único que hace demostrable el deber de identificación de
  RN-11; el comentario de cabecera de `http.ts` ya lo dice y esta decisión lo
  eleva a frontera del repositorio.
- **Pedir algo a un tercero sin pasar por `politeFetch`**, y por tanto sin
  consultar la política del origen antes.

Las tres se comprueban con un test de arquitectura, no con revisión de código
(SPEC-008 CA-2). Una prohibición que solo vive en un ADR es una prohibición que
se incumple el día que nadie relee el ADR — que es exactamente cómo nació
F-SPEC-002-23.

## Consecuencias

### Positivas

- **RN-11 se arregla en un sitio y queda arreglado para siempre.** El día que
  `futgal.es` sea capturable, su adaptador hereda la cortesía correcta sin que
  nadie tenga que acordarse.
- **La dirección de la dependencia se endereza.** Hoy el sitio público de
  producción importa de un instrumento de medición desechable; después, los dos
  importan de un módulo que no es de ninguno de los dos.
- **El archivo explica sus propias omisiones.** Con el `robots.txt` dentro del
  raw store, «por qué no se capturó esta competición esa tarde» se contesta
  leyendo el archivo, que es el único artefacto del spike que le sobrevive.
- **El instrumento de EPIC-001 sigue ejecutable.** SPEC-002 espera a la RFGF con
  su ventana intacta; este ADR le cambia rutas de `import`, no comportamiento, y
  su suite es la prueba.

### Negativas / follow-ups

- **Se toca código de dos specs `hecho` y verificadas.** SPEC-002 y SPEC-003
  cerraron con GREEN contra un árbol de ficheros que este ADR mueve. Es
  deliberado y está autorizado por el propio ledger de SPEC-002, que ruta
  F-SPEC-002-23 a la primera spec de adaptador de EPIC-002; pero el gate debe
  saber que el GREEN de esas dos specs se sostiene, después del traslado, sobre
  la suite y no sobre la inmovilidad del código.
- **`src/site/crawler-page.tsx` cambia de `import`.** Es la única línea de
  EPIC-003 que toca este ADR, y `/robot` es lo que sostiene la mitad de RN-11
  que la UA delega en una página (ADR-011). Su suite tiene que seguir verde.
- **El arreglo del comodín puede volver `skipped` algún objetivo que hoy pasa.**
  Es el efecto buscado, no un daño colateral, pero conviene decirlo: un `Disallow`
  que hasta hoy no casaba pasará a casar. En las URL de `ceroacero.es` de
  SPEC-008 no ocurre —su `robots.txt` prohíbe una sola ruta, `/zzmap_v3.php`—;
  en `besoccer.es` sí, y eso es precisamente lo correcto.
- **El desempate por `Allow` es un cambio adicional al comodín.** Hoy, ante dos
  patrones de igual longitud, gana el que aparece primero. Pasa a ganar el
  `Allow`, que es lo que dice RFC 9309. Es más permisivo en un caso muy estrecho
  y va nombrado aquí para que el gate lo vea, en vez de viajar escondido dentro
  de «se arregla el comodín».
- **Las 6 horas de vigencia son un número elegido, no medido.** Se apoya en la
  cadencia que la épica ya fija para el calendario. Bajarlo cuesta peticiones;
  subirlo cuesta obedecer más tarde una restricción nueva. Revisable con
  evidencia; hoy no la hay.
- **`competition_id: 'robots'` en la clave del raw store es una licencia.** La
  alternativa limpia es una migración `0002` con su tabla, y se rechaza abajo por
  desproporcionada. Si algún día el raw store crece un índice propio, esto es lo
  primero que se recoloca.
- **Nada de esto autoriza a capturar más.** El ADR reordena de dónde sale la
  cortesía; no amplía el conjunto capturable, que sigue siendo el de ADR-008.

## Alternativas consideradas

- **Que `src/ingest/` escriba su propia cortesía.** Rechazada: es la alternativa
  que produce dos implementaciones de una regla dura, y ya tenemos la prueba
  documental de que un defecto en una de ellas puede vivir semanas sin que ningún
  test se ponga rojo (F-SPEC-002-23). Duplicar RN-11 es duplicar su modo de
  fallo, que es silencioso por naturaleza.
- **Que `src/ingest/` importe de `src/mirror/capture/`.** Rechazada por la
  dirección de la dependencia: `src/mirror/` es el instrumento desechable de
  EPIC-001 —`_epica.md` dice explícitamente qué parte del andamio se tira— y el
  camino de producción no puede colgar de él. Es además el error que el sitio
  público ya comete hoy y que este ADR corrige, no el patrón que hay que
  extender.
- **Dejar los ficheros donde están y prohibir por convención el segundo parser.**
  Rechazada: una convención sin test es exactamente lo que falló. Y no resuelve
  que `src/site/` siga importando de un instrumento de medición.
- **Versionar el `robots.txt` de cada fuente en el repositorio.** Rechazada por
  dos motivos independientes: caduca en silencio —y un `robots.txt` viejo es la
  forma más limpia de incumplir RN-11 creyendo cumplirla—, y acerca peligrosamente
  la línea que ADR-009 traza sobre no versionar contenido de terceros. El
  archivo, que ya sabe caducar y no está en git, es el sitio.
- **Pedir el `robots.txt` en cada tick del cron.** Rechazada: es una petición por
  origen y minuto que RN-11 no presupuesta, y la política de un sitio no cambia
  cada sesenta segundos. Pedir de más también es descortesía.
- **Una tabla `robots_policies` en Postgres, con migración `0002`.** Rechazada
  hoy por desproporción: añade una migración irreversible (ADR-006: deshacer es
  escribir la siguiente) para guardar un documento que el raw store ya sabe
  guardar, versionar por instante y purgar (ADR-009). Queda anotada arriba como
  el sitio al que esto se muda si el archivo deja de bastar.
