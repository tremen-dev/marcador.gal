---
id: SPEC-018
tipo: spec
epica: EPIC-002
estado: borrador
aprobada-por:
historial:
  - {estado: borrador, fecha: 2026-09-04, por: sdd-arquitecto}
---
# SPEC-018 — El snapshot del marcador y la pantalla que lo lee por polling

> **Penúltima spec de EPIC-002.** Detrás sólo queda la instrumentación de las
> cuatro cifras. `_epica.md` la describe así: «**Snapshot y una página HTML sin
> diseño** que lo lee por polling: tabla de partidos, marcador, estado, hora del
> último dato y color para provisional / confirmado / *sen sinal*».
>
> **Esa frase es de antes de tres ADRs, y hay que leerla con ellos delante.**
> «Sin diseño» ya no puede leerse como «sin sistema de diseño»: **ADR-026** hizo
> `docs/diseno/` vinculante para toda interfaz. «Color para provisional /
> confirmado» ya no puede leerse como que uno de los dos va apagado:
> **ADR-026 §2** decidió que **ninguno** lo va. Y **ADR-025** puso un suelo de
> foco, teclado y toque que no se baja.
>
> **Y hay una palabra que la épica NO escribió y que casi se da por supuesta:
> «pública».** Se consultó a los tres roles consultivos antes de escribir un
> criterio, y el dictamen de **`sdd-legal-datos` volvió bloqueante**: el proyecto
> ya declaró por escrito —en `/robot`, en `/proxecto` y en la carta a la RFGF,
> las dos primeras sujetas por test— que **no hay marcador público**. `sdd-lingua`
> llegó al mismo hallazgo por su cuenta. **Esta pantalla se construye entera y se
> sirve tras la sesión declarada del operador**; publicarla es una decisión con
> firma propia, escrita en **ADR-027 §3.a**, y no es de esta spec.
>
> Trae **un ADR en `borrador`: ADR-027**. Y contesta, con dictamen de dominio
> detrás, dos cosas que otros artefactos le dejaron con su nombre: la mitad
> abierta de la **entrada 1** y la **entrada 4** del inventario congelado de
> EPIC-004, y las dos preguntas que **ADR-026 §7** dejó con disparador «la spec
> del snapshot» — `descanso` y `suspended`.
>
> Los tres dictámenes están copiados enteros y sin resumir en
> `dictamenes-SPEC-018.md`, en este mismo directorio.

## Problema

**El sistema decide y no lo enseña.** `src/decide/` escribe `Decision` desde el
2026-09-02, el tick las produce dentro de su ventana (SPEC-012), el bot y el panel
son la única ruta a un marcador *confirmado* (SPEC-015, SPEC-017) — y **no hay
ninguna superficie donde se vea una jornada entera moviéndose**. El tablero del
panel enseña partidos, sí, pero es **una cola de trabajo**: se ordena por lo que
necesita a una persona (SPEC-017 CA-12.3), lleva formularios en cada fila y **no
se refresca solo**.

Eso bloquea tres cosas concretas, y ninguna es estética:

1. **La verificación a cronómetro que la épica exige.** «Latencia: segundos entre
   el gol real (**verificado a mano** en 10 partidos) y el dato publicado». Quien
   sostiene el cronómetro necesita **ver la jornada entera refrescándose**, no
   recargar a mano un tablero de urgencias partido a partido.
2. **El contrato de lo que se publica no existe.** ADR-003 lo dibujó en 2026-08-29
   —«snapshot JSON cacheable… `version` global… polling cada 30 s con ETag»— y
   nadie lo ha escrito. Mientras no exista, «lo que publicamos» es lo que cada
   pantalla decida serializar, y el día que entre SSE, la publicación real o un
   feed habrá **dos** definiciones y la segunda se escribirá copiando la primera.
3. **Nadie ha ejercido nunca el modelo desde el lado del lector.** `src/model/`
   existe para que el frontend importe el mismo tipo que el motor (`CLAUDE.md`), y
   ese camino no lo ha recorrido nadie. Estrenarlo el día de la publicación sería
   estrenarlo en el peor día.

**Y hay un problema que esta spec descubrió preguntando, que es más grande que
ella.** El proyecto tiene tres afirmaciones públicas vivas —`crawler.noRepublish`
en `/robot`, `site.noProduct` en `/proxecto`, y la carta enviada el 2026-09-01 a
`info@futgal.es`, con plazo hasta el **2026-09-08**— que dicen, con estas
palabras, que **no hay marcador público**. Las dos primeras están **sujetas por
test** (`tests/site/crawler-page.test.ts` caso 12, `tests/site/pages.test.ts`).
`/robot` no es una página cualquiera: **es la que viaja dentro del `User-Agent` de
cada petición** que este proyecto hace (ADR-011) y la que respalda la carta
(ADR-012 §3).

Servir un marcador en una URL pública las vuelve falsas, y las vuelve falsas
**justo la semana en que la federación decide**. No es un problema de propiedad
intelectual: es que todo el andamio de mitigación de este proyecto —user-agent
declarado, ritmo publicado, buzón delante— **vale porque es verificable y
cierto**, y una sola afirmación desmentida por la propia web lo convierte en lo
contrario de lo que se construyó para ser.

**Esta spec resuelve el problema 1, 2 y 3 sin crear el cuarto.** Construye la
pantalla entera y el contrato entero, y los sirve **tras la sesión que ya existe**
(ADR-024). Lo que queda para el día que se publique es **quitar una comprobación
y firmar un ADR**, y ese ADR está escrito por adelantado en ADR-027 §3.a con sus
cinco requisitos.

**Reglas que gobiernan:** **RN-08** y **D-3** (el motor es la única puerta: esta
pantalla **lee**, no publica nada que el motor no haya publicado antes),
**RN-02/RN-03** (el cualificador, y que hoy lo normal es *provisional*),
**RN-05** (el conflicto **no** se publica: la bandeja es del panel), **RN-06** y
**RN-07** (los cinco estados y el silencio), **RN-11** (esta pantalla no le pide
nada a ningún tercero, ni desde el servidor ni desde el navegador), **RN-12** y
**D-6** (la traza se **registra**, no se **muestra**), **D-2** (galego por
defecto, castellano con paridad), **D-8** (densidad, y legible con mala
cobertura).

## Usuarios / roles afectados

- **El operador** (RN-01, ADR-024). Hoy es el único que la abre. La usa para
  **mirar** —no para operar— mientras corre una jornada de medición: ve las dos
  competiciones a la vez, en orden de reloj, refrescándose solas, y con el
  cualificador y el instante del último dato de cada partido delante. Es lo que le
  falta al panel, que es una cola de trabajo.
- **Quien verifique a cronómetro los 10 partidos** que exige el criterio de éxito
  de la épica. Esta pantalla es lo que mira; **el instrumento sigue siendo la
  base**, y ADR-027 §7.4 lo dice con todas las letras para que la cifra no se mida
  contra el refresco de una pantalla.
- **El lector del día que se publique.** No existe todavía y por eso no se le
  puede consultar, pero **todo lo que esta spec decide se decide pensando en él**:
  el orden, la etiqueta del cualificador, la separación de los tres relojes y la
  proyección cerrada son decisiones que sólo tienen sentido si un día las lee
  alguien de fuera.
- **`sdd-implementador`**: construye `src/api/` y `src/board/` nuevos, **añade una
  puerta de lectura en `src/decide/`** con el precedente exacto de `read-entry.ts`,
  y **toca dos ficheros de specs cerradas** (`src/admin/view/styles.ts` y la suite
  del sitio) bajo la disciplina de CA-17.
- **`sdd-verificador`**: la mitad estática la ve la suite; la mitad de navegador
  —360 px, teclado, foco— la comprueba a mano con capturas en `_qa/SPEC-018/`,
  cotejadas byte a byte contra lo que el manejador sirve, que es el procedimiento
  que F-SPEC-017-17 dejó establecido.
- **`sdd-arquitecto`**: escribe las entradas de `docs/fundacion/dominio.md` que
  CA-16 exige, **después** de que el gate las firme.
- **Los tres roles consultivos**, que ya dictaminaron (`dictamenes-SPEC-018.md`) y
  cuyos dictámenes esta spec absorbe o aplaza con motivo escrito (§7 del diseño).

## Diseño

### §1. Qué se construye, y en qué orden se lee

```
src/api/                     EL CONTRATO. Qué se publica, y nada más
  snapshot.ts                la proyección: función pura de (partidos, decisiones,
                             observaciones, jornadas declaradas) a la carga útil
  contract.ts                el esquema zod de la carga útil y su tipo — LISTA CERRADA
                             de campos con un motivo por entrada (ADR-027 §10)
  ports.ts                   los puertos que la proyección necesita, todos de lectura
  handler.ts                 GET /api/board: sesión, proyección, ETag, caché
  freshness.ts               la constante de refresco y la de caché, en un solo sitio

src/board/                   LA PANTALLA. Consume el contrato, no la base
  view/markup.ts             el documento como cadena, con el patrón de src/admin/view/
  view/styles.ts             la hoja, derivada ENTERA de src/design/
  view/refresh.ts            el guion: pide /api/board, cambia valores, nada más
  order.ts                   el orden de las filas: competición, kickoff, match_id
  handler.ts                 GET /marcador y /es/marcador: sesión, primera pintura

src/decide/board-entry.ts    LA PUERTA DE LECTURA EN LOTE. Tercera hermana de
                             engine-entry.ts y read-entry.ts: valores planos,
                             ningún almacén, importada por nombre

src/app/api/board/route.ts        \
src/app/(gl)/marcador/route.ts     > tres rutas finas, sin lógica
src/app/(es)/es/marcador/route.ts /

src/i18n/board-bundle.ts     el contrato del bundle (la paridad la impone el tipo)
src/i18n/board.ts            el resolutor y la cadena marcada `BoardText`
src/i18n/qualifiers-bundle.ts  el namespace `qualifiers`, extraído de src/i18n/admin.ts
src/i18n/qualifiers.ts         para que el marcador no importe el bundle del panel
```

**Qué NO se toca, y es casi todo:**

- **`src/model/` no cambia.** Ni un campo, ni un estado, ni un cualificador. No hay
  migración: esta spec **sólo lee**.
- **`src/decide/`, `src/ingest/`, `src/calendar/`, `src/alias/`, `src/polite/`,
  `src/bot/` y `src/admin/` no se editan**, con **una** excepción declarada por
  fichero y por motivo: `src/decide/board-entry.ts` es **fichero nuevo** (no
  edición) y `src/admin/view/styles.ts` recibe **el arreglo de F-SPEC-017-18**,
  que es deuda cuyo disparador escrito es literalmente esta spec.
- **`src/app/globals.css` no se edita.** ADR-013 punto 3, ADR-025 §4.1 y ADR-026 §1
  lo dicen los tres. Ni una línea.
- **`docs/diseno/` no se edita.** ADR-026 §3.7: sigue congelado en EPIC-004.
- **`src/site/robots-txt.ts` no se toca**, y el motivo está en ADR-027 §3.a: un
  `Disallow` confirma que existe, y `robots.txt` es el fichero con el que este
  proyecto le pide a otros que le dejen pasar.
- **`crawler.noRepublish` y `site.noProduct` no se tocan**, porque **siguen siendo
  ciertas**. Ése es el rendimiento de no publicar.

### §2. El camino de una vuelta, en el orden exacto en que ocurre

El orden **es** la spec. Cada flecha es una garantía que un criterio afirma.

```
  GET /marcador  (o /es/marcador)
    1. sesión ─────────────► sin cookie válida ⇒ el formulario de acceso.
                             CERO LECTURAS DE LA BASE
    2. jornadas declaradas ► MEASUREMENT_WINDOWS. Vacía ⇒ pantalla apagada,
                             CERO CONSULTAS
    3. partidos ───────────► listKickoffsBetween por ventana declarada
    4. decisiones + obs. ──► board-entry.ts, EN LOTE: el número de consultas
                             NO crece con el número de partidos
    5. cualificador ───────► qualifierOf, de src/decide/. NUNCA reimplementado
    6. proyección ─────────► la lista cerrada de campos. Lo que no está, no sale
    7. orden ──────────────► competición, kickoff, match_id. NUNCA por cualificador
    8. documento ──────────► primera pintura CON EL DATO. No hay esqueleto
    9. cabeceras ──────────► noindex, nofollow · Cache-Control privado y corto

  GET /api/board
    1..7 idénticos, y después:
    8'. ETag ──────────────► función del cuerpo. If-None-Match ⇒ 304
    9'. cuerpo ────────────► la MISMA proyección, en JSON

  El guion, en el navegador, cada REFRESH_SECONDS
    a. pide /api/board CON SU ETag ────► 304 ⇒ no toca nada, sólo el reloj
    b. 200 ⇒ sustituye VALORES, no la página
    c. fallo ⇒ NO borra nada, NO atenúa nada: dice la edad de lo que hay
```

**Los pasos 1, 2 y 6 son fronteras negativas** y se afirman como tales: no sólo
«responde lo que debe», sino **cero consultas y cero campos de más**.

**El paso 4 es el único que no existía**, y es lo que obliga a `board-entry.ts`:
el panel hace dos consultas por partido y para él está bien —lo mira una persona y
no se refresca solo—; una pantalla que se recarga cada medio minuto no.

**Y el paso c es el que distingue esta pantalla de todas las anteriores.** Un
fallo de refresco **no cambia ningún valor de la tabla**. Lo único que cambia es
un aviso de página que dice cuántos minutos tiene lo que se está viendo.

### §3. Por qué esta pantalla no se publica, y qué hace falta el día que se publique

Está entero en **ADR-027 §3.a**, y aquí sólo la consecuencia práctica: **la spec
se implementa igual, se prueba igual y sirve el mismo documento**. La diferencia
son dos comprobaciones de sesión y dos cabeceras.

Lo que hace falta ese día, para que sea un trámite:

1. **ADR nuevo con firma del gate**, que recoja las trece condiciones y el
   disparador de re-dictamen de siete puntos que `sdd-legal-datos` §6.2 y §6.3
   dejaron redactados.
2. **`noRepublish` y `noProduct` corregidos en el mismo cambio**, por ADR-015 —el
   cuerpo de SPEC-004 y SPEC-005 no se edita, se enmienda en su ledger— y **nunca
   matizando la frase para que siga pasando el test**.
3. **No antes del 2026-09-08.**
4. **`/` en vez de `/marcador`**, retirando la redirección de `src/site/redirects.ts`
   como ADR-010 §5 previó.
5. **`noindex` sigue puesto, y con la advertencia escrita de que no es una defensa
   jurídica**: una URL pública sin indexar está puesta a disposición del público
   igual.

**Y lo que esta spec deja preparado para eso, sin que cueste nada hoy:** la
proyección es una **lista cerrada con test de filtración** (CA-5), la apertura es
la **jornada declarada** (CA-3), y **nada de la traza de RN-12 sale de la base**
(CA-5.4). Las tres son las condiciones que ese ADR pedirá.

### §4. Los tres relojes, aterrizados en la pantalla

ADR-027 §4 fija el invariante; esto es dónde va cada uno.

| Reloj | Dónde va | Cómo se rotula |
|---|---|---|
| **La fuente** | **en la fila** | *Último dato* + la edad. Es el que dice si hay que creerse ese 1-0, y es sobre el que se mide RN-07 |
| **El dato** | **en el snapshot**, y una vez por página | la `version` del conjunto: la última publicación. Es lo que mide la primera cifra (ADR-027 §7.4) |
| **El transporte** | **fuera de la tabla**, una vez | *Actualizado hai N min* / *Non se puido actualizar. O que ves é de hai N min* |

**Por qué el de la fila es el de la fuente y no el del dato.** El motor **no emite
una `Decision` por tick**: sólo cuando cambia la tupla publicada (ADR-021). Así
que un partido `live` sin goles puede tener un `decided_at` de hace media hora
estando perfectamente vivo, y poner ese instante en la fila diría lo contrario de
lo que pasa. El `observed_at` más reciente sí dice lo que hay que saber: **cuándo
fue la última vez que alguien lo miró**. Es también lo que `sdd-competicion`
recomienda como compensación honesta de no enseñar el minuto (§2 de su dictamen).

**Y la separación se sostiene con una barrera léxica, no con buena voluntad**
(`sdd-lingua` §3.1): *sinal* / *señal* no aparecen en **ninguna** clave del bundle
del marcador —viven sólo en `qualifiers`—, y *actualizar* / *actualizado* no
aparecen en `qualifiers`. Dos ausencias, un caso, y una clase entera de error
cerrada. **Y queda prohibido diagnosticar de quién es la culpa**: el sistema no
sabe si el fallo es del móvil, de la red o del servidor.

### §5. Las cuatro filas que más fácil se publican mal

Son las cuatro que esta spec tiene que dibujar bien, y las cuatro tienen dictamen
de dominio detrás.

**5.1 — El partido sin ninguna `Decision`.** Aparece, con su hora, su competición
y los dos nombres canónicos, **sin marcador y sin cualificador**, y con *Sen
marcador publicado*. **Nunca «sen datos»**, que comparte molde con *Sen sinal* y
reintroduce la confusión que §4 cierra (`sdd-lingua` §3.4). Y **la ausencia de
dato no es un cualificador**: los cuatro de `dominio.md` califican una `Decision`
publicada, y aquí no hay ninguna.

**5.2 — El aplazado.** Se queda **en su sitio**, en su hora original, **sin
marcador** —`migrations/0001` ya lo prohíbe, y es correcto: un aplazado no tiene
0-0, no tiene nada—, con su literal *Aprazado*. No desaparece y no se manda al
final: desaparecer es indistinguible de un fallo de carga, y quien busca su
partido tiene que encontrar la respuesta donde lo busca.

**5.3 — El suspendido.** **Empezó** —ésa es la diferencia con el aplazado— y
`migrations/0001` **obliga** a que lleve marcador, así que su marcador parcial se
enseña con la misma prominencia que el de un `live`. Pero tras una suspensión
decide el Comité de Competición y puede tardar días, así que **«Suspendido 1-0» a
secas se lee como resultado y no lo es**: la fila lleva la reserva de que no es
definitivo.

**5.4 — El `finished` por timeout, que es el peor fallo posible de esta
pantalla.** Hoy **ninguna fuente automática puede aplazar un partido** (RN-06, y
la oficial no es capturable), así que un partido aplazado por lluvia se queda
`scheduled`, entra en ventana a su hora, no llega ninguna observación de juego, y
a `kickoff + 110 min` RN-06 lo cierra a `finished`. **La pantalla enseñaría
«Rematado 0-0» de un partido que no se jugó**, y de noviembre a febrero eso son
cuatro o cinco filas a la vez.

**La mitigación no hay que inventarla: ya está en el modelo.** Ese `finished` es
exactamente *pendente de confirmar* (ADR-021 §6), y ADR-026 §2.4 obliga a
enseñarlo con etiqueta de texto. **Un `Rematado 0-0` marcado *Pendente de
confirmar* y con «último dato hai 3 h» es honesto; el mismo sin esas dos cosas es
mentira.** Que las dos estén en la misma fila **no es decoración: es lo que impide
publicar un resultado falso**, y por eso CA-10 lo afirma con un caso propio.

### §6. Qué contesta esta spec de los inventarios congelados, y qué no

**EPIC-004, entrada 4 — «faltan estados de carga y de dato viejo». CONTESTADA.**
Su disparador escrito era «la primera spec de `src/api/`», y ADR-026 §6 anotó que
estaba «a punto de dispararse». Se contesta en dos mitades (ADR-027 §5): **el
estado de carga no se diseña porque no existe** —el servidor sirve el dato ya
pintado—, y **el de dato viejo son dos, no uno**: el de la fila y el de la página,
los dos texto con etiqueta, y **ninguno cambia un valor de la tabla**.

**EPIC-004, entrada 1 — la mitad que ADR-026 §2 dejó abierta. CONTESTADA.** «Cómo
se ve exactamente la etiqueta, dónde va, y si `confirmado` lleva además una
marca». Respuesta, en ADR-027 §8: etiqueta de texto en la fila con el literal
completo, **`confirmado` sin marca adicional**, y **la pantalla no ordena, no
agrupa y no filtra por cualificador**. Esto último es la respuesta de verdad: el
fallo que la entrada temía **no era de color, era de jerarquía** —«cambia cuál es
la fila por defecto»— y una pantalla que no jerarquiza por cualificador no puede
destacar el caso raro **aunque alguien cambie los tokens después**.

**ADR-026 §7 — `descanso` y `suspended`. CONTESTADAS las dos**, con dictamen de
`sdd-competicion` y fijadas en ADR-027 §9. `descanso` **no entra** como sexto
estado; `suspended` **ya está en el modelo** y lo que faltaba era decir cómo se
presenta (§5.3). **Ninguna spec cerrada necesita enmienda por esto**, que es su
principal virtud.

**Lo que sigue abierto y esta spec NO cierra:** la entrada 2 (tabla de
clasificación), la 3 **sobre el artefacto** —el sistema sigue sin foco ni teclado,
y lo cubre ADR-025 §2, que ADR-026 §5 dejó permanente—, la 5 en cuanto a
componentes de formulario, y la 6 (tema claro), cuyo dueño y disparador siguen
siendo los de ADR-026 §1. **Sus disparadores no cambian.**

**F-SPEC-015-9 —«el sistema de diseño dice *Directo* donde el producto dice *En
xogo*»— NO se cierra, y hay que leer por qué.** Su disparador escrito es «el día
que se construya la interfaz del marcador», y podría parecer que es hoy. Pero la
deuda es **del artefacto**, no del producto: esta pantalla dice *En xogo* porque
usa `statusesBundle` (SPEC-015), y **CA-14 prohíbe la palabra «directo» con un
caso**. `docs/diseno/` sigue congelado (ADR-026 §3.7) y sigue diciendo *Directo*
en siete ficheros. **La mitad del producto queda pagada y comprobada; la del
artefacto conserva su disparador: el deshielo de EPIC-004.**

### §7. Qué se absorbió de los dictámenes y qué se dejó fuera

Los tres están copiados enteros en `dictamenes-SPEC-018.md`. Lo que esta spec hace
con ellos:

**`sdd-legal-datos` — absorbido lo vinculante, entero.** V1 y V2 (bloqueantes)
cambian el alcance: la pantalla no se publica (ADR-027 §3.a, CA-2). V6 (proyección
cerrada con test de filtración) es CA-5. V7 (la traza no se enseña) es CA-5.4. V8
(el polling nunca pide a un tercero) es CA-1.4. V10 (nada personal, ni escudos) es
CA-5.3 y CA-15. V5 (blindar que el calendario declarado no se derive de una fuente
rastreada) entra **como línea de runbook**, CA-3.5. **Lo que se aplaza con motivo:
las trece condiciones de publicación y el disparador de siete puntos** (§6.2 y
§6.3 del dictamen), que **son del ADR de publicación y no de esta spec**, porque
no se publica; **quedan transcritos en ADR-027 §3.a** para que ese ADR no empiece
de cero. **Su hallazgo colateral** —`site.measuring` dice «a medición aínda non
comezou»— **sigue siendo cierto hoy**, porque `MEASUREMENT_WINDOWS` está vacía y
no se ha corrido ninguna jornada; **destino: EPIC-MEJORA; disparador: la primera
jornada de medición declarada**, que es el día que esa frase deja de ser verdad.

**`sdd-competicion` — absorbido entero, y sin coste.** `descanso` fuera (ADR-027
§9.1, CA-16), sin minuto (§9.2), `suspended` con reserva (§9.3, CA-10),
aplazado en su sitio (§9.4, CA-10), orden por competición y hora con desempate
total (CA-11), jornada por defecto y navegación (CA-3.4), nombres canónicos sin
abreviar ni truncar (CA-10.2, CA-15). **Su T1 —que el descanso puede tumbar el
extractor entero de una competición— NO es de esta spec**: es de `src/ingest/`
(SPEC-008, `hecho`), no lo puede arreglar quien no toca ese fichero, y su
comprobación es una captura real. **Destino: EPIC-FIX; disparador: la primera
captura durante un descanso**, que hay que mirar y no suponer. **Su T7** —los
horarios de Preferente cambian en bloque a finales de octubre y cualquier caché
servirá horas viejas— **destino: el runbook de carga del calendario; disparador:
el cambio de hora**.

**`sdd-lingua` — absorbido lo vinculante y casi todas las recomendaciones.** El
nombre *o marcador* (§1.1), *Casa*/*Fóra* (§2.2, y su fila de glosario en CA-16),
*Último dato* y no *Última observación* (§2.5), la separación de §3.1 con su
barrera léxica (CA-8.4), los literales de §3.2, la etiqueta larga del cualificador
(§4.1, CA-12), *Rematado* nunca como frase suelta (§4.2, CA-12.3), la barrera de
primera persona del singular (§5.3, CA-14) y la prohibición de «directo» y de
«tempo real» (§6.3, CA-14.3). **Lo que se aplaza con motivo: su §1.2, la ruta
`/`.** Es correcta y es de ADR-010, pero tomar la raíz **es decir que
marcador.gal ya es el marcador**, y hoy no lo es porque la pantalla no se publica.
**Destino: el ADR de publicación (ADR-027 §3.a, requisito 4); disparador: el
mismo.** Y `titles.scoreboard` **sí** se añade (CA-13.5), aunque la pantalla se
sirva desde un manejador de ruta: el título del documento lo escribe el marcado, y
el contrato de `TitlesBundle` es donde viven los títulos.

## Criterios de aceptación

- **CA-1 — Los dos domicilios, las tres rutas, y el marcador no le pide nada a
  nadie (ADR-027 §1 y §2.5, ADR-016 §3.2, SPEC-009, RN-11).**
  Dado el árbol de ficheros y el grafo de importación, entonces:
  1. Existen `src/api/` (el contrato) y `src/board/` (la pantalla), y **`src/board/`
     no importa nada de `src/db/` ni de `src/decide/`**: toma la proyección de
     `src/api/`. Un caso lo afirma recorriendo los imports; **control positivo**:
     añadir un import de `src/db/` en `src/board/` pone rojo un caso nombrado.
  2. Las tres rutas son **manejadores de ruta** (`route.ts`), **no `page.tsx`**, y
     **no tienen lógica**: delegan enteras. Un caso afirma que ninguna exporta nada
     salvo `GET` y `dynamic`, y que ninguna nombra `src/db/`, `src/decide/` ni
     `src/design/`.
  3. **Las tres están declaradas en `ENTRY_POINTS`** (`tests/polite/support/capability.ts`)
     **con su motivo escrito**, como todas las anteriores.
  4. **El grafo de las tres NO alcanza `src/polite/http.ts`.** Un caso lo afirma
     con el mismo mecanismo que SPEC-017 CA-13.2, y por eso **RN-11 no alcanza esta
     spec**. Es la afirmación que `sdd-legal-datos` §6.2.8 marca como la más
     importante de la spec: una implementación que refrescase **bajo demanda**
     convertiría `N` lectores en `N` peticiones a un tercero y **reventaría RN-11 en
     el primer minuto** sin que el número de la regla hubiera cambiado.
  5. **Del lado del navegador, lo mismo.** Un caso recorre el documento servido y
     la hoja y afirma que **no nombran ningún host externo** —ni
     `fonts.googleapis.com`, ni `fonts.gstatic.com`, ni ninguno—, que no hay ningún
     `@import` de una URL, y que **la única URL que el guion pide es una ruta
     relativa de este mismo origen**. Control positivo: escribir un host externo
     pone rojo un caso nombrado.

- **CA-2 — La pantalla no se publica: su puerta es la sesión declarada, y falla
  cerrada (ADR-027 §3.a, ADR-024 §2 y §3).**
  Dada una petición a `/marcador`, `/es/marcador` o `/api/board`, entonces:
  1. **Sin cookie de sesión válida no hay tablero**: se responde el formulario de
     acceso del panel (HTML) o un `401` sin cuerpo de datos (JSON), y **con cero
     lecturas de la base**. Un caso lo afirma con dobles que registran si fueron
     llamados, como los de `tests/admin/`.
  2. **Se reusa `src/admin/session.ts` tal cual**; no se escribe una segunda
     sesión, ni un segundo secreto, ni un segundo catálogo. Un caso afirma que
     `src/board/` y `src/api/` **no leen ninguna variable de entorno propia** más
     allá de las que la sesión ya define.
  3. **Fallo cerrado en las mismas tres formas** que ADR-024 §3: secreto ausente,
     vacío o de menos de 32 caracteres ⇒ **ninguna ruta hace nada, ni siquiera
     leer**; catálogo ausente o ilegible ⇒ nadie entra; firma inválida, caducada o
     `operator_id` retirado ⇒ no hay sesión. Un caso por forma.
  4. **La respuesta no revela cuál de las cuatro condiciones falló**, como ya hace
     el panel.
  5. **`noindex, nofollow` por cabecera `X-Robots-Tag` y por `<meta name="robots">`**,
     las dos. Un caso lo afirma sobre el documento servido y sobre las cabeceras.
  6. **`src/site/robots-txt.ts` no se toca**, y el verificador lo comprueba en el
     diff. Un `Disallow` confirmaría que existe.
  7. **`crawler.noRepublish` y `site.noProduct` siguen intactas y sus casos siguen
     verdes sin tocar una aserción.** El verificador lo comprueba en el diff. **Es
     el criterio que mide que esta spec no rompió lo que fue a proteger.**
  8. **La pantalla no sabe nada de quien la abre** (ADR-027 §4.5): un caso afirma
     que ningún módulo de `src/board/` ni de `src/api/` escribe una cookie propia,
     usa `localStorage`, lee `Accept-Language`, lee cabeceras de cliente, ni escribe
     en ninguna tabla.

- **CA-3 — La apertura es la jornada de medición declarada, y la pantalla nace
  apagada (ADR-027 §3.b, ADR-019 §3, ADR-020 §2).**
  Dada la configuración declarada, entonces:
  1. **La pantalla sólo enseña partidos cuyo `kickoff` cae dentro de una entrada de
     `MEASUREMENT_WINDOWS`.** Un caso con un partido dentro y otro fuera afirma que
     sale uno y no salen dos.
  2. **Con la lista vacía —que es su estado hoy— la carga útil es una lista vacía,
     la pantalla lo dice, y se hacen CERO consultas a la base.** Un caso lo afirma
     con dobles que registran.
  3. **«No hay partidos» y «no se declaró ningún partido» se dicen distinto**
     (`sdd-competicion` §5): la primera es información, la segunda es un fallo
     operativo del que sólo se entera quien mira. Un caso afirma que los dos
     mensajes existen y son distintos.
  4. **La jornada por defecto se elige con un criterio declarado y hay forma de ver
     las otras declaradas.** El criterio, de `sdd-competicion` §5, en este orden:
     (a) la de un partido `live`, sin excepción; (b) la del próximo `kickoff` no
     jugado; (c) durante `RECENT_WINDOW_MS` tras el último partido terminado, la
     recién acabada; (d) la última declarada. **`RECENT_WINDOW_MS` es una constante
     nombrada, elegida y no medida**, con su motivo escrito, como `PRE`/`POST`
     (ADR-019 §2). Un caso por rama, con reloj inyectado.
  5. **Línea de runbook**, en `docs/procedimientos/carga-del-calendario.md`: **el
     calendario declarado no se deriva de ninguna fuente rastreada, ni a mano ni
     con un LLM sobre su HTML**. Es dictamen vinculante de `sdd-legal-datos` §1.4 y
     es la mejor pieza defensiva del proyecto para el día que se publique; hoy
     **nada en el código lo protege y esa línea es lo único que hay**. Un caso
     afirma que la línea está en el fichero.

- **CA-4 — El snapshot es una proyección de sólo lectura: no escribe, no llama al
  motor, y `DECISION_WRITERS` no crece (RN-08, D-3, ADR-027 §2, ADR-021 §6,
  ADR-016).**
  Dado el snapshot, entonces:
  1. **Ningún módulo de `src/api/` ni de `src/board/` escribe nada.** Un caso
     escanea los dos directorios y afirma que **no contienen ninguna plantilla `sql`
     con `insert`, `update` o `delete`**, y que sus puertos declaran **sólo métodos
     de lectura**. Control positivo: añadir un método de escritura al puerto pone
     rojo un caso nombrado.
  2. **No se llama al motor.** Un caso afirma que el grafo de las tres rutas **no
     alcanza `runEngineForMatch`** ni `src/decide/cycle.ts`.
  3. **`DECISION_WRITERS` sigue teniendo dos entradas** y el caso de SPEC-013 que lo
     afirma pasa **sin tocar una aserción**. `src/decide/board-entry.ts` es un
     lector, no un escritor, exactamente como `read-entry.ts`.
  4. **El cualificador sale de `qualifierOf`** (`src/decide/qualifier.ts`) y **no se
     reimplementa**. Un caso afirma que `src/api/` lo importa por nombre y que **no
     contiene ninguno de los cuatro valores de `MATCH_QUALIFIERS` como literal**.
  5. **El snapshot NO envejece un dato** (ADR-027 §2.2). Un caso con una `Decision`
     `live` cuyo `decided_at` tiene cuarenta minutos afirma que la proyección dice
     `live` **y no `sen_sinal`**, y que **la proyección no lee ningún reloj**:
     `src/api/snapshot.ts` es una función pura sin `Date`, sin `Clock` y sin
     `Date.now`. Control positivo: introducir una comparación con el reloj pone rojo
     un caso nombrado.
  6. **Declarado dentro del criterio (ADR-016 §6, obligatorio):** fuera de una
     jornada declarada el motor no corre, así que **nadie escribe la `Decision` de
     RN-07** y un partido puede quedarse `live` indefinidamente en el log. La
     pantalla **no lo tapa**: lo enseña con su instante (CA-8). **Destino: la spec
     de instrumentación de las cuatro cifras**, que tiene que decidir si cerrar una
     jornada ejecuta una pasada final del motor; **disparador: la primera jornada
     declarada que termine.**

- **CA-5 — La proyección es una lista cerrada de campos, y lo que no está no sale
  (ADR-027 §10, `sdd-legal-datos` §4 y §4.1, RN-05, RN-12, D-6).**
  Dada la carga útil, en HTML y en JSON, entonces:
  1. **`src/api/contract.ts` declara la lista cerrada de campos con un motivo por
     entrada**, en la forma de `ALLOWED_PACKAGES` (ADR-016 §3.2). Hoy: competición,
     jornada, `kickoff`, nombre canónico de los dos equipos, `status`, marcador,
     cualificador, e instante del último dato.
  2. **Un caso se pone rojo si un campo de `Decision` o de `Observation` que no esté
     en esa lista aparece en el cuerpo servido**, y lo hace **enumerando las claves
     del esquema canónico** contra la lista, no con una lista negra de nombres.
     Control positivo: añadir `rule` a la proyección pone rojo un caso nombrado.
  3. **Fuera, y cada uno con su caso**: `rule` —que es elocuente: `RN-01` dice «el
     operador impuso su precedencia»—, `supporting_observation_ids` —cuyos ids son
     opacos pero **cuya cardinalidad no lo es**—, `version`, **`raw_ref`** —cuya
     clave lleva **el nombre de la fuente dentro de la cadena** (ADR-009), así que
     publicarlo es publicar la fuente—, `confidence`, **el nombre de cualquier
     fuente**, `operator_id`, `correspondent_id`, y **las alertas y los
     conflictos**, porque **RN-05 dice que el conflicto no se publica** y la bandeja
     es del panel. *Sen sinal* sí sale, pero **como cualificador del partido**,
     jamás como «una fuente lleva quince minutos callada».
  4. **La traza de RN-12 no se enseña, y esto no incumple D-6** (ADR-027 §10.4). Un
     caso afirma que el cuerpo servido no contiene ninguna cadena `RN-0\d` ni ningún
     `ObservationId`. **El sujeto de «un marcador publicado sabe de dónde viene» es
     el sistema, y el verbo de RN-12 es «registra», no «muestra»**: la trazabilidad
     ya la cumplen el log, los `CHECK` de `migrations/0001` y el tipo de
     `SupportingObservationIdsSchema`, y su audiencia declarada son el operador
     (RN-01, por `read-entry.ts`, que consume el panel) y el verificador.
  5. **Ni una imagen.** Ni `<img>`, ni fondo de imagen, ni SVG de escudo: ADR-013
     §4 y `FOUNDATION.md` (no-negociable). Un caso lo afirma sobre el documento
     servido.

- **CA-6 — La lectura en lote vive en `src/decide/`, y el número de consultas no
  crece con el número de partidos (ADR-027 §2, SPEC-013 CA-13, ADR-016).**
  Dada una jornada declarada con N partidos, entonces:
  1. **Existe `src/decide/board-entry.ts`**, con la forma exacta de
     `read-entry.ts`: recibe `sql` y una lista de `MatchId`, devuelve **valores
     planos** (`Decision` y `Observation`), **ningún almacén**, se importa **por
     nombre**, y **compone el repositorio durable él mismo** en vez de tomar
     prestado `composeCyclePorts`, que arrastraría el fetcher de plataforma.
  2. **El motivo de que viva ahí y no en `src/db/` está escrito en su cabecera**: la
     frontera de SPEC-013 CA-13 hace rojo nombrar `PostgresDecisionStore`,
     `DecisionStore` o la tabla `decisions` fuera de `DECISION_WRITERS`. Es el mismo
     razonamiento que `sdd-arquitecto` ratificó para `read-entry.ts` (F-SPEC-017-1).
  3. **El número de consultas por vuelta es constante en N.** Un caso con un doble
     que cuenta afirma que servir 2 partidos y servir 18 hace **el mismo número de
     consultas**. Control positivo: sustituirlo por un bucle de `readMatchDecisions`
     pone rojo el caso.
  4. **Contra la base**: un caso de `tests/db/` afirma que la lectura en lote
     devuelve, para cada partido, **la misma `Decision` vigente** que
     `readMatchDecisions` devolvería una a una.
  5. **La aserción derivada del caso que enumera quién cruza los nombres vigilados
     crece en una entrada, con su motivo en el mismo diff** — que es literalmente lo
     que hicieron SPEC-015 con `engine-entry.ts` y SPEC-017 con `read-entry.ts`.

- **CA-7 — El contrato del snapshot: `version` derivada, `ETag` del cuerpo, y una
  caché corta que es una constante nombrada (ADR-003, ADR-027 §7).**
  Dado `GET /api/board`, entonces:
  1. El cuerpo es **la misma proyección** que sirve la pantalla, validada por el
     esquema `zod` de `contract.ts`. Un caso afirma que las dos salen de la misma
     función.
  2. **`version` es el `decided_at` más reciente del conjunto servido**, o `null` si
     no hay ninguna `Decision`. **No hay contador global y no hay tabla de
     versiones**: un caso afirma que no existe ninguna.
  3. **El `ETag` es función del cuerpo, no del reloj.** Un caso afirma que dos
     invocaciones con el mismo contenido y relojes distintos producen **el mismo
     `ETag`**, y que `If-None-Match` con ese valor devuelve **`304` sin cuerpo**.
  4. **`REFRESH_SECONDS` y el máximo de caché viven en `src/api/freshness.ts`, como
     constantes nombradas y en un solo sitio**, con su motivo escrito: son
     **elegidos, no medidos**, como `PRE`/`POST` (ADR-019 §2) y las 6 h de
     ADR-014 §3.2. Un caso afirma que ningún otro fichero repite esos números, y que
     el literal de la leyenda de la pantalla los **interpola**, no los escribe.
  5. **La caché es privada mientras la pantalla esté tras la sesión**: un caso
     afirma que `Cache-Control` lleva `private` y **no** `s-maxage`. Una respuesta
     que sólo ve quien tiene la cookie no se comparte en un CDN.
  6. **Declarado dentro del criterio (ADR-016 §6):** la `version` derivada **no
     distingue dos snapshots con el mismo `decided_at` máximo y distinto contenido**
     —si cambiase la lista de partidos sin decidirse nada—. El `ETag` sí, porque es
     del cuerpo. **La `version` es información para quien lea el JSON, no el
     mecanismo de caché**, y no se puede construir sobre ella una detección de
     cambios.

- **CA-8 — Los tres relojes, y la barrera léxica que impide confundirlos
  (ADR-027 §4, RN-07, D-8, `sdd-lingua` §3.1).**
  Dado el documento servido, entonces:
  1. **La fila lleva el reloj de la fuente**, rotulado con el literal de *Último
     dato*, derivado del `observed_at` más reciente de las observaciones que
     sostienen la `Decision` vigente. Un caso lo afirma sobre el HTML.
  2. **La página lleva el reloj del transporte**, **fuera de la tabla** y con su
     propio rótulo. Un caso afirma que no está dentro de ninguna fila.
  3. **El fallo de refresco no se pinta como estado ni como cualificador.** Un caso
     afirma que el marcado del aviso de refresco **no usa ninguna de las clases
     `s-*` ni `q-*`**, y que su regla de estilo **no referencia `--accent-live`,
     `--amber` ni `--alert`**. Control positivo: usar uno de esos tokens pone rojo un
     caso nombrado.
  4. **Barrera léxica, en las dos direcciones y en las dos lenguas**: **`sinal` /
     `señal` no aparecen en ninguna clave del bundle del marcador** —viven sólo en
     `qualifiers`— y **`actualizar` / `actualizado` no aparecen en `qualifiers`**. Un
     caso recorre los dos bundles y afirma las dos ausencias. Control positivo: meter
     una de las palabras pone rojo el caso.
  5. **Prohibido diagnosticar de quién es la culpa.** Un caso afirma que el bundle
     no contiene `conexión`/`conexión`, `cobertura` ni `rede`/`red` en ninguna clave
     del aviso de refresco: el sistema no sabe si el fallo es del móvil, de la red o
     del servidor, y señalar al móvil de quien mira es lo que le empuja a
     confundirlo con *sen sinal*.

- **CA-9 — La primera pintura es el dato; el refresco degrada sin romper
  (ADR-027 §5, EPIC-004 entrada 4, D-8).**
  Dado el manejador de la pantalla, entonces:
  1. **El documento servido ya trae los partidos, los marcadores, los estados y los
     cualificadores.** Un caso con tres partidos afirma que las tres filas están en
     el HTML de la **primera** respuesta, con sus valores. **No hay esqueleto de
     carga y no hay ninguna cadena de «cargando» en el documento servido.**
  2. **Sin guion, la página sigue siendo correcta.** Un caso afirma que el documento
     **no depende de ningún script para tener contenido**: quitar el `<script>` del
     HTML no cambia ni un valor de la tabla.
  3. **El guion sólo sustituye valores.** Un caso afirma que su fuente **no contiene
     ninguna escritura de `innerHTML` sobre el contenedor de la tabla** y que no
     reconstruye filas: sustituye nodos de texto de celdas identificadas.
  4. **Un fallo de refresco no borra ni atenúa nada.** Un caso afirma que el guion
     **no toca ninguna clase ni ningún estilo de una fila** en la rama de error, y
     que lo único que cambia es el aviso de página.
  5. **Declarado dentro del criterio (ADR-016 §6):** en la primera pintura el reloj
     del transporte es el de la propia respuesta, así que **una página servida desde
     caché puede nacer vieja**. Por eso el instante de la fila **sale del servidor**
     (CA-8.1) y no del navegador. Y los subpuntos 3 y 4 miran **la fuente del
     guion**, no su ejecución: **ningún test de esta suite ejecuta JavaScript en un
     navegador** — eso es CA-16.

- **CA-10 — Lo que la pantalla enseña por fila, y las cuatro filas que más fácil se
  publican mal (ADR-027 §6 y §9, RN-06, `dominio.md`, `sdd-competicion`).**
  Dada una fila, entonces:
  1. Lleva: la hora de inicio, los **nombres canónicos RFGF** de los dos equipos,
     el marcador si lo hay, el `status` con el literal de `statusesBundle`, el
     cualificador con el literal de `qualifiers`, y el instante del último dato.
  2. **Los nombres canónicos no se traducen, no se abrevian y no se truncan**, en
     **ninguna anchura** (ADR-013 §4, `dominio.md`, `sdd-competicion` §6). Un caso
     afirma que el nombre que sale es idéntico al de `teams.canonical_name` **en las
     dos lenguas**, y que la hoja **no declara `text-overflow: ellipsis` sobre la
     celda del equipo**. El motivo es concreto: en Terceira RFEF juegan filiales que
     se distinguen por una sola letra final, así que `CD Lugo B` truncado a `CD Lugo`
     **son dos clubes con el mismo texto en pantalla**. Si no cabe, **crece la fila**.
  3. **Un partido sin ninguna `Decision`** sale con su hora y sus dos nombres, **sin
     marcador y sin cualificador**, con el literal de *Sen marcador publicado*. Un
     caso afirma que **no aparece ninguno de los cuatro cualificadores** en esa fila
     y que **no aparece la cadena «sen datos»** en ningún bundle.
  4. **Un `postponed`** sale **en su posición por hora original**, **sin marcador**,
     con su literal *Aprazado*. Un caso afirma las tres cosas, incluida la posición.
  5. **Un `suspended`** sale **con su marcador parcial** —`migrations/0001` lo
     obliga— **y con la reserva de que no es el resultado definitivo**. Un caso
     afirma que la fila contiene las dos cosas.
  6. **El caso que impide publicar un resultado falso.** Dado un partido cerrado por
     el timeout de RN-06 sin ninguna observación de apoyo que diga `finished`
     —**que es exactamente lo que le pasa a un partido aplazado que nadie pudo
     aplazar**, porque hoy ninguna fuente automática puede (RN-06, ADR-008 §1)—, un
     caso afirma que la fila lleva **a la vez**: el marcador, el literal *Rematado*,
     el cualificador ***Pendente de confirmar*** y el instante del último dato.
     **Control positivo: quitar cualquiera de los dos últimos pone rojo el caso.** Es
     la trampa T2 de `sdd-competicion`, y en noviembre son cuatro o cinco filas a la
     vez.
  7. **Ningún minuto de juego** (ADR-027 §9.2). Un caso afirma que la proyección no
     tiene campo de minuto y que el bundle no tiene rótulo de minuto.
  8. **Un partido en descanso se enseña como *En xogo***, y no existe ningún sexto
     estado (ADR-027 §9.1). Un caso afirma que `MATCH_STATUSES` sigue teniendo cinco
     valores y que ni `src/api/` ni `src/board/` contienen la cadena `descanso`,
     `DESC` ni `half_time`.

- **CA-11 — El orden: por competición y por hora, estable, y nunca por cualificador
  ni por estado (ADR-027 §8.4, `sdd-competicion` §3).**
  Dado un conjunto de partidos, entonces:
  1. **Se agrupa por competición**, con su nombre canónico entero como cabecera
     —*Preferente Futgal Grupo 1*, *Terceira RFEF Grupo 1*—, **nunca abreviado**.
  2. **Dentro de cada competición, orden ascendente por `kickoff`**, con **desempate
     total y determinista por `match_id`**. Un caso afirma que **dos ordenaciones del
     mismo conjunto en distinto orden de entrada producen la misma salida**.
  3. **`src/board/order.ts` no importa `orderBoard` ni `boardRank` de
     `src/admin/board.ts`.** Un caso lo afirma. El panel se ordena por urgencia
     porque es una cola de trabajo; esto es una jornada.
  4. **El orden no depende del estado ni del cualificador.** Un caso afirma que la
     posición de un partido **no cambia** cuando su `status` pasa de `scheduled` a
     `live` y de `live` a `finished`, ni cuando su cualificador cambia. **Control
     positivo: añadir el estado a la clave de orden pone rojo el caso.** El motivo es
     de uso y no de principio: si un partido sube al empezar y baja al acabar, **quien
     mira pierde de vista el suyo justo cuando más lo mira**.
  5. **Cada fila lleva su fecha, o la pantalla agrupa por día.** Un caso lo afirma:
     en estas dos competiciones **no existe «la hora de la jornada»** —el
     escalonamiento sábado/domingo es la norma— así que una hora sin fecha es
     ambigua.

- **CA-12 — El cualificador, siempre con su etiqueta completa; el estado, nunca
  como frase suelta (ADR-026 §2 y §4, ADR-013 §2 y §6, ADR-027 §8,
  `sdd-lingua` §4).**
  Dado el documento servido, entonces:
  1. **Los cuatro cualificadores se enseñan con el literal completo de
     `dominio.md`** en la lengua de la URL. Un caso afirma que **no aparece ninguna
     abreviatura** —`PROV`, `CONF`, `P. CONF.`, `PEND`— ni ningún glifo `?` o `!`, y
     que **`Pendente de confirmar` nunca se elide con `…`**.
  2. **`provisional` y `confirmado` se sirven los dos con el color de texto
     principal y los dos con etiqueta**, `confirmado` incluido, y **`confirmado` no
     lleva ninguna marca adicional** (ADR-027 §8.2). Un caso lo afirma. **Control
     positivo: apagar o enmudecer uno de los dos pone rojo un caso nombrado.**
  3. **`Rematado` nunca aparece como frase suelta.** Si hay cabecera de columna, la
     cabecera es la etiqueta; si no la hay, el literal viaja con su rótulo (*Estado:
     Rematado*). Un caso afirma que en el documento servido **cada literal de estado
     tiene o una `<th>` que lo encabeza o un rótulo adyacente**. Es lo que
     `dominio.md` exige desde el 2026-09-02 porque *rematar* significa dos cosas en
     fútbol.
  4. **Estado y cualificador nunca quedan pegados sin nada entre ellos**
     (`sdd-lingua` §4.3): los dos son participios y «Rematado Confirmado» se lee como
     un sintagma. Un caso afirma que están en celdas distintas o que cada uno lleva
     su rótulo.
  5. **Ningún estado ni cualificador se distingue solo por color** (ADR-013 §2). Un
     caso recorre el árbol servido y afirma que **para cada estado y cada
     cualificador presente hay un nodo de texto que lo nombra**, en **todas las
     anchuras**. **Y ningún color que porte un dato o un cualificador baja de
     4.5:1** sobre su fondo, **calculado en el test y no estimado** (ADR-013 §6).

- **CA-13 — Galego por defecto, castellano con paridad, y ningún literal escrito en
  el código (D-2, `sdd-lingua`).**
  Dado el marcador, entonces:
  1. Existen `src/i18n/board-bundle.ts` (el contrato) y `src/i18n/board.ts` (el
     resolutor), y los literales viven en `gl.ts` y `es.ts` bajo un espacio de
     nombres nuevo, **con paridad impuesta por el tipo**. Un caso afirma que quitar
     una clave de `es.ts` **no compila**.
  2. **`BoardText` es una cadena con marca** cuyo constructor no se exporta, como
     `AdminText` y `BotText`: **un literal escrito dentro de `src/board/` o de
     `src/api/` no compila**. Control positivo: un `.test-d.ts` con
     `@ts-expect-error`.
  3. **La lengua sale de la URL, nunca del cliente**: `/marcador` en galego,
     `/es/marcador` en castellano. Un caso afirma que ningún módulo lee
     `Accept-Language`.
  4. **Los cinco estados salen de `statusesBundle` y los cuatro cualificadores del
     namespace `qualifiers`**: **no se escribe un segundo juego de ninguno de los
     dos**. Para no importar el bundle del panel, `qualifiers` se **extrae** a
     `src/i18n/qualifiers-bundle.ts` y `qualifiers.ts`, con la forma de `statuses`, y
     `src/i18n/admin.ts` pasa a consumirlo — **sin cambiar ni un literal**, y el
     caso de i18n del panel sigue verde sin tocar una aserción.
  5. **`titles.scoreboard` se añade a `TitlesBundle` en las dos lenguas.** SPEC-006
     dejó escrito que toda página nueva declara su título ahí o no tiene ninguno.
  6. **`tests/site/no-hardcoded-literals.test.ts` sigue verde con las rutas nuevas
     dentro de su alcance y sin añadir ninguna excepción.**
  7. **La pantalla dice de sí misma qué la degrada**, en dos claves separadas para
     que un caso pueda afirmar cada mitad: **que esto es una medición y no un
     producto** (D-1, coherente con `site.purpose`), y **que hay una sola fuente
     automática, así que lo normal es que el marcador sea provisional y llegue con
     atraso** (ADR-008 §1, RN-03). Los literales son los que `sdd-lingua` §6.2
     redactó. Un caso afirma que las dos claves existen en las dos lenguas y que
     ninguna promete producto. **Ver nota §9 para el gate: si se decide que una
     pantalla que sólo abre el operador no lo necesita, este subpunto se cae solo y
     no arrastra a ninguno.**

- **CA-14 — La voz de la pantalla: sin primera persona del singular, sin promesa de
  directo, y sin vocabulario de sucesión (ADR-012 §1, D-1, F-SPEC-007-10,
  `sdd-lingua` §5 y §6.3).**
  Dado el texto visible, entonces:
  1. **Un caso recorre todos los valores de cadena de `site`, `titles` y el espacio
     nuevo del marcador, en `gl` y en `es`**, sobre el texto **desacentuado y en
     minúsculas**, y afirma que ninguno contiene ninguna forma de una **lista cerrada
     de primera persona del singular** declarada en el propio test con su motivo
     escrito (ADR-016 §3.2), **comparando por palabra completa**. Control positivo:
     una cadena de prueba con una de las formas pone el caso en rojo. **Cierra
     F-SPEC-007-10, cuyo disparador escrito es literalmente esta spec.**
  2. **Alcance declarado dentro del criterio:** la barrera **no alcanza `bot`**, y no
     por descuido — el bot habla en 1.ª persona del singular **por dictamen de
     `sdd-lingua` registrado en SPEC-015 §1** («Son o bot de marcador.gal»), y
     meterlo aquí lo pondría en rojo siendo correcto. **Y lo que el mecanismo no
     alcanza, declarado también:** quedan **fuera de la lista** las formas ambiguas
     `son` (gl., también 3.ª del plural), `vin`/`vi`, `mi` y `sei`/`sé`, porque
     incluirlas produciría falsos positivos sobre texto correcto. **Ahí la barrera es
     revisión, no test**, y esta línea es la constancia.
  3. **La pantalla no promete lo que el sistema no hace.** Un caso afirma que el
     bundle no contiene, en ninguna lengua, `directo`, `en vivo`, `tempo real`,
     `tiempo real`, `ao instante`, `al instante` ni `inmediato`. Dos motivos
     independientes: **`Directo` está retirado del producto** desde el 2026-09-03
     (`dominio.md`, ADR-026 §4.4) y **F-SPEC-015-9 tiene como disparador esta spec**;
     y **entre el gol y la pantalla pasan minutos**, así que prometerlo sería un
     fallo de producto, no de traducción.
  4. **La lista negra de sucesión de D-1 alcanza al espacio nuevo.** `tests/site/i18n.test.ts`
     caso 5 la aplica hoy **sólo a `siteBundle`**; esta pantalla es la primera que se
     va a parecer de verdad a marcadorgalego.gal, así que es la primera en la que un
     literal de sucesión es tentador. Se ensancha **en un fichero nuevo**, con el
     precedente de `identity.test.ts` (SPEC-007), **sin tocar el de SPEC-004**.

- **CA-15 — El marcador se dibuja con `src/design/`, sobre el suelo de ADR-025, sin
  declarar ni un valor propio (ADR-026 §2, §3 y §4, ADR-025 §2, §3 y §4.1,
  ADR-013 §1..§6).**
  Dados el marcado y la hoja, entonces:
  1. **Un solo domicilio.** La hoja del marcador **no declara ni un color, ni una
     familia, ni un radio, ni un valor de escala por su cuenta**: los toma de
     `src/design/`, y su `:root` sale de `rootBlock()`. Un caso recorre la fuente y
     afirma que **no contiene ningún `#rrggbb` ni ningún nombre de fuente**. Control
     positivo: escribir uno pone rojo un caso nombrado.
  2. **Se cierra F-SPEC-017-18**, cuyo disparador escrito es «la primera spec que
     toque `src/admin/view/styles.ts` o `src/design/` — la del **snapshot**». Los
     cinco valores de escala que hoy viven fuera de su domicilio se **nombran en
     `src/design/`**, `h1` pasa a usar el rol que corresponde en vez de repetir un
     `20`, y **el caso de paridad se ensancha a radios y escala**. Un caso afirma que
     **ninguna de las dos hojas** —la del panel y la del marcador— **contiene un
     valor de escala literal**.
  3. **El rol `display` NO se usa y su cara NO se carga, y es una decisión, no un
     olvido.** F-SPEC-017-9 tiene destino literal «la spec del snapshot», y la
     respuesta es **que no le toca**: `display` es «el marcador de la **ficha de
     partido**», y esta pantalla es **una lista**, no una ficha. Cargar la cara
     variable de Geist para no usarla sería pagar un fichero con todos los pesos
     dentro contra el «sólo los pesos que se usan» de ADR-026 §3.5. Un caso afirma
     que `LOADED_FACES` **no crece** y que la hoja del marcador no referencia
     `TYPE.display`. **El finding conserva su disparador: la primera interfaz que use
     el rol `display`.**
  4. **`docs/diseno/` no se edita** (ADR-026 §3.7) y **la lista de divergencias
     declaradas sigue teniendo exactamente tres entradas** (ADR-026 §3.4). El caso de
     `tests/design/parity.test.ts` que lo afirma pasa sin tocar una aserción.
  5. **Foco visible y teclado** (ADR-025 §2, **intacto**): `:focus-visible` con
     indicador de ≥ 2 px y contraste ≥ 3:1 **calculado en el test**, ningún
     `outline: none` sin sustituto, ningún `tabindex` positivo.
  6. **Toque ≥ 44 × 44 px** en todo control (ADR-025 §3, **intacto**), con el valor
     tomado de `TOUCH_TARGET_PX` y no reescrito.
  7. **Dígitos tabulares** en marcador, hora e instantes (ADR-013 §3).
  8. **La hoja es propia y no deriva de `globals.css`** (ADR-025 §4.1 y §4.2, lo que
     sobrevive): un caso afirma que ningún módulo de `src/board/` importa CSS de
     `src/app/` ni de `src/site/`, y el verificador comprueba en el diff que
     `globals.css` sigue intacto.
  9. **Sin scroll horizontal del cuerpo a 360 px** por construcción: la tabla vive
     en su propio contenedor con desplazamiento, como ya hace `.scroller` del panel.

- **CA-16 — Lo que sólo ve un navegador (ADR-025 §5, ADR-016 §6).**
  1. **Comprobado a mano y con captura**: a **360 × 640**, la pantalla se recorre
     **sólo con teclado**, con el **foco visible en cada parada**, **sin
     desplazamiento horizontal del cuerpo**, y con **el refresco funcionando y su
     fallo visible** (desconectando la red). Las capturas van a `_qa/SPEC-018/`.
  2. **Cotejadas byte a byte contra lo que el manejador sirve**, que es la
     mitigación que F-SPEC-017-17 dejó **como procedimiento** y no como apaño de una
     vuelta: **Chrome por MCP no alcanza `localhost` en este entorno**.
  3. **Declarado dentro del criterio (ADR-016 §6):** los criterios CA-1 a CA-15 son
     estáticos y **no ven un diseño calculado ni ejecutan una línea de JavaScript**;
     éste es el único que ve el navegador, y lo hace una persona. **Destino:
     F-SPEC-017-17; disparador: el día que exista un entorno con navegador que
     alcance `localhost`**, que convierte esto en configuración en vez de en una
     spec.

- **CA-17 — El glosario se escribe antes de usarse, y tocar la suite de una spec
  cerrada tiene regla (`dominio.md`, ADR-015, F-SPEC-016-8, F-SPEC-004-9 ·
  F-SPEC-005-2).**
  1. **Tres entradas nuevas en `docs/fundacion/dominio.md`**, escritas por
     `sdd-arquitecto` **después de que el gate las firme** y **antes** de que
     aparezcan en ningún literal, que es lo que la cabecera del propio glosario
     exige. Son: **(a)** que **`descanso` no es un estado** —entrada de resolución,
     no un sexto valor— con el texto que `sdd-competicion` §1.b redactó; **(b)**
     **`Casa` / `Fóra`** como etiqueta visible de los dos lados de un `Match`, con
     *local*/*visitante* válidos **en prosa y nunca como etiqueta**; **(c)** una
     línea bajo la tabla de cualificadores diciendo que **un partido sin `Decision`
     no tiene cualificador**, para que ninguna spec futura invente un quinto.
     **Precondición de este criterio y sólo de éste: no se implementa hasta que el
     gate lo firme**, como CA-9.6 de SPEC-017 esperó al suyo. Los otros dieciséis
     criterios avanzan sin eso.
  2. **Disciplina al tocar una spec cerrada.** Esta spec toca dos suites cerradas
     —`src/admin/view/styles.ts` (CA-15.2) y la del sitio (CA-14.4, CA-17.3)— y
     **F-SPEC-016-8 dice que la próxima spec que lo haga necesita una regla que lo
     gobierne, porque SPEC-016 no la tuvo**. La regla, y es la de SPEC-015 CA-15.3:
     **se toca lo mínimo, cada toque va en su propio commit con el motivo escrito, y
     ninguna aserción existente se debilita ni se borra** — el verificador lo
     comprueba en el diff, aserción a aserción.
  3. **Se cierra F-SPEC-004-9 · F-SPEC-005-2**, cuyo disparador es «cualquier
     trabajo que toque rutas del sitio» y cuya nota advierte que **«la barrera
     correcta es una sola sobre las cuatro URL; escribirla a trozos es cómo llegó a
     estar a medias»**. Un caso **único** afirma con **literales**, no con la
     constante comparada consigo misma, que `PROJECT_PATH`, `CRAWLER_PATH` y la
     dirección del marcador valen lo que valen. **Y declara la asimetría dentro del
     propio caso:** las cuatro primeras **no se mueven nunca** (ADR-010 §5, porque
     `/robot` viaja dentro del `User-Agent`); **la del marcador sí puede moverse** el
     día que se publique (ADR-027 §1, §3.a), y por eso el caso las afirma **en dos
     grupos con el motivo de cada uno escrito**.
  4. **F-SPEC-004-7 NO se cierra, y se declara por qué no dispara.** Su disparador
     es «la primera vez que se añada `metadata`, un favicon o un script **a un
     layout**», y esta pantalla **no toca ningún layout**: se sirve desde un
     manejador de ruta, así que **su barrera de contenido afirma sobre el documento
     servido byte a byte** y el agujero que ese finding describe no se reintroduce.
     **Conserva su disparador intacto.**

## Entidades y reglas afectadas

**Reglas de negocio** (`docs/fundacion/reglas.md`): **RN-02** y **RN-03** (el
cualificador, y que hoy lo normal es *provisional*) · **RN-05** (el conflicto no se
publica: CA-5.3) · **RN-06** (los cinco estados, la tabla cerrada de transiciones,
y el timeout que produce el peor fallo de esta pantalla: CA-10.6) · **RN-07** (*sen
sinal*, y que lo escribe el motor y no la pantalla: CA-4.5) · **RN-08** (el motor
es la única puerta: CA-4 entero) · **RN-11** (esta spec no le pide nada a nadie:
CA-1.4 y CA-1.5) · **RN-12** (la traza se registra, no se muestra: CA-5.4) ·
**RN-13** (no se edita nada: CA-4.1).

**Decisiones locked** (`FOUNDATION.md`): **D-1** (ni una palabra de sucesión:
CA-14.4) · **D-2** (galego por defecto, castellano con paridad: CA-13) · **D-3**
(el motor es la única puerta) · **D-6** (un marcador publicado sabe de dónde viene
— y el sujeto es el sistema: CA-5.4) · **D-7** (cero monetización, que es también
una condición de publicación) · **D-8** (densidad, y legible con mala cobertura:
CA-8, CA-9, CA-15.9). **No-negociable:** sin escudos (CA-5.5).

**ADRs**: **ADR-027** (`borrador`, esta spec lo trae) · **ADR-003** (el snapshot
cacheable, aterrizado en CA-7 sin superseder; SSE sigue fuera) · **ADR-004** ·
**ADR-006** · **ADR-008 §1 y §5** · **ADR-009** · **ADR-010 §5** · **ADR-011** ·
**ADR-012 §1 y §3** · **ADR-013 §1..§6** · **ADR-015** (esta spec **evita** tener
que usarlo) · **ADR-016 §3.2 y §6** · **ADR-017** · **ADR-019 §2 y §3** ·
**ADR-020 §2** · **ADR-021 §2, §5 y §6** · **ADR-024 §1, §3 y §9** · **ADR-025 §2,
§3, §4.1 y §5** · **ADR-026 §1, §2, §3, §4 y §7**.

**Dominio** (`docs/fundacion/dominio.md`): `Decision`, `Observation`, `Match`,
`Competition`, `Team`, los **cinco estados** con sus literales, los **cuatro
cualificadores** con los suyos, *calendario declarado*, *jornada de medición
declarada*, *ventana de partido*, *Preferente Futgal*, *Terceira RFEF grupo 1*.
**Gana tres entradas** (CA-17.1) y **no pierde ninguna**.

**Épicas**: **EPIC-002** (esta spec es la penúltima) · **EPIC-004**
(`aprobada`, **congelada**; se cierran la entrada **4** y la mitad abierta de la
**1**, y **no se descongela nada**) · **EPIC-MEJORA** (se cierran
**F-SPEC-007-10**, **F-SPEC-004-9 · F-SPEC-005-2**, **F-SPEC-017-18** y
**F-SPEC-016-8**; conservan su disparador **F-SPEC-004-7**, **F-SPEC-005-V3 ·
F-SPEC-017-17**, **F-SPEC-017-9**, **F-SPEC-017-10**, **F-SPEC-017-16** y
**F-SPEC-015-9**).

## Fuera de alcance

Aparcado a propósito, no por descuido. Cada cosa con su destino y su disparador.

- **Publicar el marcador.** Es la decisión central de ADR-027 §3.a y **no es de
  esta spec**. **Destino: un ADR nuevo con firma del gate**, cuyos cinco requisitos
  y cuyas trece condiciones ya están escritos; **disparador: el go/no-go, o antes
  si el humano lo decide con el dictamen delante — y en ningún caso antes del
  2026-09-08**.
- **Tomar la raíz `/`.** `sdd-lingua` §1.2 tiene razón en que `marcador.gal/marcador`
  es una tautología y ADR-010 §5 ya reservó `/` para el producto. Pero tomar la raíz
  **es decir que marcador.gal ya es el marcador**. **Destino: el mismo ADR de
  publicación (requisito 4); disparador: el mismo.**
- **SSE** (ADR-003). Sigue fuera por decisión de la épica. Lo que esta spec deja es
  el contrato en un sitio desde el que un segundo transporte no obliga a reescribir
  la proyección. **Disparador: la épica de producto.**
- **Las cuatro cifras.** Esta spec construye la superficie donde se **miran**; **no
  mide ninguna**, y ADR-027 §7.4 declara además que medirlas contra esta pantalla
  sería medir la pantalla. **Destino: la spec de instrumentación.**
- **Que el cierre de una jornada ejecute una pasada final del motor.** Sin ella, un
  partido puede quedarse `live` para siempre fuera de una jornada declarada
  (CA-4.6). **Destino: la spec de instrumentación; disparador: la primera jornada
  declarada que termine.**
- **La trampa T1 de `sdd-competicion`: que el descanso tumbe el extractor entero de
  una competición.** `tableExtractor` exige marcador en toda fila `live` y
  `statusWords` mapea `'descanso' → 'live'`; si la fuente escribe «Descanso» **en
  lugar del** marcador, la fila lanza y **aborta el extractor entero** — cero
  observaciones para los nueve partidos, y *sen sinal* para todos a los quince
  minutos. Es de `src/ingest/` (SPEC-008, `hecho`) y su comprobación es **una
  captura real**, no un test. **Destino: EPIC-FIX; disparador: la primera captura
  durante un descanso.**
- **Añadir `descanso` como sexto estado, o capturar el minuto de juego.** Los dos
  **rechazados con dictamen de dominio** (ADR-027 §9.1 y §9.2). Reabrirlos exigiría
  una migración irreversible y enmiendas a SPEC-001, SPEC-008 y SPEC-013.
  **Disparador: que la RFGF publique un cronómetro oficial, o que el descanso
  resulte capturable y alguien pueda decir para qué sirve enseñarlo.**
- **Tabla de clasificación, ficha de partido, histórico navegable, filtros y
  buscador.** Son producto, y la tabla de clasificación es además **la entrada 2 del
  inventario de EPIC-004**, con su disparador intacto. Un histórico navegable es
  además la acumulación que el art. 7.5 castiga (`sdd-legal-datos` §6.2.3).
- **Analítica, contador de visitas y cualquier medición de audiencia.** No hay, y
  CA-2.8 lo hace estructural. **Disparador: la landing con lista de espera**, que
  vive en *Más adelante* y llegará con esa pregunta puesta.
- **Repintar `src/app/globals.css` o migrar el sitio público al sistema de
  diseño.** ADR-013 punto 3, ADR-025 §4.1 y ADR-026 §1 lo niegan los tres.
  **Destino y disparador: los de ADR-026 §1, intactos.**
- **Arreglar `docs/diseno/`.** Congelado (ADR-026 §3.7). Las seis desviaciones de
  ADR-026 §4 se resuelven en el producto. **Destino: EPIC-004; disparador: el
  deshielo.**
- **Un navegador automatizado.** Sigue sin haberlo y **Chrome por MCP no alcanza
  `localhost`** (F-SPEC-017-17). **Destino: spec propia; disparador: el día que
  exista un entorno con navegador que alcance `localhost`.**
- **Los cuatro huecos de cobertura del panel (F-SPEC-017-16).** Su nota dice que
  «la del snapshot es candidata inmediata para las dos de CA-12», y **se declina con
  motivo**: son aserciones sobre `tests/admin/document.test.ts`, que es la suite de
  una spec cerrada, y CA-17.2 acaba de fijar que a esas suites se las toca **lo
  mínimo y por su propio motivo**. Ensancharlas «ya que estamos» es exactamente lo
  contrario. **Destino: EPIC-MEJORA; disparador: la primera spec que toque
  `src/admin/view/` por un motivo suyo.**
- **F-SPEC-017-10** —que la adherencia a la escala no se puede comparar contra nada
  porque `_tokens.css` sólo declara color y familia—. **No se cierra y no es de esta
  spec: Destino: EPIC-004; disparador: el deshielo.** No confundirlo con
  F-SPEC-017-18, que sí se cierra aquí (CA-15.2).
- **La mitad de `F-SPEC-015-9` que vive en `docs/diseno/`.** El producto queda
  pagado —esta pantalla dice *En xogo* y CA-14.3 prohíbe *Directo* con un caso—; el
  artefacto sigue diciendo *Directo* en siete ficheros y **sigue congelado**.
  **Destino: EPIC-004; disparador: el deshielo.**
- **Corregir `site.measuring`** («a medición aínda non comezou»), que
  `sdd-legal-datos` señala como drift potencial. **Hoy sigue siendo cierta**:
  `MEASUREMENT_WINDOWS` está vacía y no se ha corrido ninguna jornada. **Destino:
  EPIC-MEJORA; disparador: la primera jornada de medición declarada.**
- **Notificar a nadie de nada.** La pantalla se mira; no avisa. Es la misma frontera
  que SPEC-017 puso al panel.

## Notas para el gate humano

**§1. La decisión que hay que mirar con más lupa: esta pantalla no se publica.**
La épica escribió «página HTML que lo lee por polling» y nadie escribió «pública»,
pero todos lo dimos por hecho. **`sdd-legal-datos` volvió con un dictamen
bloqueante** y `sdd-lingua` con el mismo hallazgo por su cuenta: `/robot`,
`/proxecto` y la carta enviada dicen que **no hay marcador público**, las dos
primeras **sujetas por test**, y la carta está en manos de la RFGF hasta el
**2026-09-08**. Publicar las volvería falsas en la peor semana posible.

**He tomado la salida (A) —no publicar— y quiero que se revise, porque es una
reducción de alcance frente a lo que la épica prometió.** Los argumentos a favor:
la épica mide «publicado» como `Decision` escrita, así que **no pierde ninguna
cifra**; la pantalla se construye entera y se prueba entera; y lo que queda para
publicarla es **quitar una comprobación y firmar un ADR** que ya está escrito por
adelantado (ADR-027 §3.a). El argumento en contra, y es real: **nadie de fuera va a
ver el marcador en EPIC-002**, y si lo que se quería era enseñárselo a alguien,
esto no lo hace. **La salida (B) —publicar y enmendar `/robot` y `/proxecto` por
ADR-015— sigue disponible y está redactada; lo que no está disponible es hacerlo
antes del 2026-09-08.**

**§2. Tres entradas de glosario que hay que firmar antes de implementarlas**
(CA-17.1), y una de ellas es una decisión de dominio con consecuencias:

- **`descanso` no es un sexto estado.** Lo dictamina `sdd-competicion` con cuatro
  motivos, y el ahorro es grande: **ninguna spec cerrada necesita enmienda y no hay
  migración**. Pero significa que **un partido en el descanso se enseña como *En
  xogo***, y que `docs/diseno/`, que dibuja un `DESC`, seguirá diciendo otra cosa.
- **`Casa` / `Fóra`** como etiqueta visible, con *local*/*visitante* válidos en
  prosa y **nunca** como etiqueta. Es elegir entre dos pares que ya circulan, y
  gana el que ya es texto visible en dos specs cerradas.
- **Un partido sin `Decision` no tiene cualificador.** Es una aclaración del
  glosario, no un término nuevo, y existe para que ninguna spec futura invente un
  quinto cualificador para el hueco.

**§3. `confirmado` no lleva marca adicional, y la pantalla no ordena por
cualificador.** Es la mitad de la entrada 1 de EPIC-004 que ADR-026 §2 dejó
abierta, y la contesto en ADR-027 §8. Lo que quiero que se mire: **la respuesta
importante no es la etiqueta, es el orden**. Una pantalla que no agrupa ni ordena
por cualificador no puede destacar el caso raro **aunque alguien cambie los tokens
después**, y eso es lo que la entrada temía cuando decía «no se arregla cambiando
un color: cambia cuál es la fila por defecto».

**§4. El caso que más me importa de toda la spec es CA-10.6.** Hoy ninguna fuente
automática puede aplazar un partido, así que un aplazado por lluvia acaba en
`finished 0-0` por timeout. **La pantalla enseñaría un resultado de un partido que
no se jugó**, y en noviembre son cuatro o cinco filas a la vez. La mitigación ya
está en el modelo —ese `finished` es *pendente de confirmar*— pero **sólo funciona
si la etiqueta y el instante están los dos en la fila**, y por eso ese criterio
tiene control positivo. Si algo de esta spec no se puede recortar, es eso.

**§5. Dos directorios donde SPEC-017 hizo uno.** `src/api/` (el contrato) y
`src/board/` (la pantalla). Es más andamiaje para la misma cantidad de pantalla, y
el beneficio no se cobra hasta que haya un segundo consumidor —SSE, la publicación
o un feed—. Lo defiendo en ADR-027 §1 y acepto que se discuta: la alternativa
—todo en `src/api/`— es más corta y sólo peor a plazo.

**§6. Un fichero nuevo en `src/decide/`, que es la tercera vez.** `board-entry.ts`
sigue el precedente exacto de `engine-entry.ts` (SPEC-015) y `read-entry.ts`
(SPEC-017, ratificado). El motivo es duro: **la frontera de SPEC-013 CA-13 hace
imposible leer decisiones en lote desde fuera de `src/decide/`**, y el panel puede
permitirse dos consultas por partido porque no se refresca solo. Si esto se
repite una cuarta vez, quizá lo que hay que revisar es la frontera; hoy no.

**§7. Lo que esta spec cierra de EPIC-MEJORA, y lo que declina.** Cierra
**F-SPEC-007-10** (primera persona del singular — su disparador es literalmente
esta spec), **F-SPEC-004-9 · F-SPEC-005-2** (permanencia de las URL, en un caso
único como el finding pedía), **F-SPEC-017-18** (los cinco valores de escala fuera
de su domicilio) y **F-SPEC-016-8** (la regla que gobierna tocar la suite de una
spec cerrada). **Declina con motivo escrito** F-SPEC-017-16, F-SPEC-004-7,
F-SPEC-017-9, F-SPEC-017-10 y la mitad de artefacto de F-SPEC-015-9. Los motivos
están en *Fuera de alcance*, uno por uno.

**§8. Una cosa que no es de esta spec y que hay que decir hoy porque tiene fecha.**
`sdd-competicion` avisa de que **la jornada 1 de Preferente Futgal Grupo 1 es el
domingo 6 de septiembre de 2026 —dentro de dos días— y `calendario/` no existe en
el repositorio**. Sin calendario declarado no hay denominador, no hay identidad de
partido y **esta pantalla no tiene nada que enseñar**, aunque sus diecisiete
criterios estén en verde. Y `MEASUREMENT_WINDOWS` sigue vacía, con sus dos
precondiciones escritas (ADR-020 §3). **Esto no bloquea la spec; bloquea que sirva
para algo.**

**§9. Y una pregunta abierta que no resuelvo porque es de producto.** La épica
obliga a declarar junto a cada cifra qué la degrada, y `sdd-lingua` propuso el
literal para que la pantalla lo diga de sí misma —«Isto é unha medición, non un
produto. Hai unha soa fonte automática, así que o normal é que o marcador sexa
provisional e que chegue con atraso»—. **Lo he dejado dentro** (CA-13, con los
literales de su dictamen) porque cuesta dos claves y evita que alguien lea la
pantalla como un producto. **Si el gate prefiere que una pantalla que sólo abre el
operador no lleve ese aviso, se quita y no rompe nada.**
