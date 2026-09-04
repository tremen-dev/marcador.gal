---
id: SPEC-018
tipo: spec
epica: EPIC-002
estado: en-revision
aprobada-por: Alberto Fojo
historial:
  - {estado: borrador, fecha: 2026-09-04, por: sdd-arquitecto}
  - {estado: aprobada, fecha: 2026-09-04, por: Alberto Fojo}
  - {estado: en-progreso, fecha: 2026-09-04, por: sdd-implementador}
  - {estado: en-revision, fecha: 2026-09-04, por: sdd-implementador}
  - {estado: en-progreso, fecha: 2026-09-04, por: sdd-implementador}
  - {estado: en-revision, fecha: 2026-09-04, por: sdd-implementador}
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
> las dos primeras **sujetas por test**— que **no hay marcador público**.
> `sdd-lingua` llegó al mismo hallazgo por su cuenta.
>
> **En el gate del 2026-09-04, Alberto Fojo decidió la salida (B): el marcador se
> publica.** Con el dictamen delante y con sus tres consecuencias sobre la mesa.
> **Esta spec no relitiga esa decisión: la ejecuta**, y ejecutarla incluye lo que
> la hace honesta en vez de sólo firmada — **corregir por ADR-015 las tres
> afirmaciones que dejarían de ser ciertas, en el mismo cambio y no después** (CA-18),
> no desplegar antes del **2026-09-08**, y no fingir que un test puede dar por
> cumplido un aviso a la RFGF que sólo puede dar una persona.
>
> **El dictamen bloqueante no se ha borrado.** Sigue entero en
> `dictamenes-SPEC-018.md`, con una nota de cabecera que registra que una decisión
> de producto lo superó, con fecha y firmante. Y **se reconsultó al mismo rol esa
> misma tarde**, no sobre si se publica sino **bajo qué condiciones se publica
> bien**: ese segundo dictamen es la fuente de CA-2 y CA-18.
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

Servir un marcador en una URL pública **las vuelve falsas si no se corrigen**. No
es un problema de propiedad intelectual: es que todo el andamio de mitigación de
este proyecto —user-agent declarado, ritmo publicado, buzón delante— **vale porque
es verificable y cierto**, y una sola afirmación desmentida por la propia web lo
convierte en lo contrario de lo que se construyó para ser.

**El gate decidió publicar, así que el cuarto problema es de esta spec y no de
otra.** Y su forma exacta importa: **no es «hay que actualizar unos textos». Es
que la corrección tiene que ir en el mismo cambio que la publicación**, porque
cualquier ventana entre las dos cosas es una ventana en la que el proyecto
publica un marcador mientras jura en la página que un tercero audita que no lo
publica. Por eso **CA-18 es un criterio de aceptación y no un follow-up**, y por
eso ordena tres enmiendas de ledger por **ADR-015** —el cuerpo de una spec cerrada
no se edita nunca— en vez de dejarlas para una spec de limpieza.

**Esta spec resuelve los cuatro.** Construye el contrato (`src/api/`) y la
pantalla (`src/board/`), los publica en `/marcador` y `/es/marcador` con la
apertura acotada a las jornadas de medición declaradas, y **corrige en el mismo
cambio lo que la publicación deja obsoleto**.

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

- **Cualquiera.** Es el usuario nuevo del proyecto y el que cambia el peso de cada
  decisión de esta spec: alguien que abre `marcador.gal/marcador` un sábado por la
  tarde, en un móvil, con mala cobertura, y que **no sabe nada de este proyecto**.
  No conoce RN-03, no sabe qué es un cualificador y no tiene por qué. Todo lo que
  se decide aquí —el orden de las filas, la etiqueta completa, la separación de
  los tres relojes, el aviso de degradación— se decide **para que esa persona no
  se lleve una impresión falsa** de un dato que es más frágil de lo que parece.
- **El operador** (RN-01, ADR-024). La usa para **mirar** —no para operar—
  mientras corre una jornada de medición: ve las dos competiciones a la vez, en
  orden de reloj, refrescándose solas. Es lo que le falta al panel, que es una cola
  de trabajo. **Y ahora ve exactamente lo mismo que ve el público**, que es una
  propiedad y no una casualidad: si el operador viese más, habría dos verdades.
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
  CA-17.1 exige, **después** de que el gate las firme.
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
  handler.ts                 GET /api/board: proyección, ETag, caché compartida
  freshness.ts               la constante de refresco y la de caché, en un solo sitio

src/board/                   LA PANTALLA. Consume el contrato, no la base
  view/markup.ts             el documento como cadena, con el patrón de src/admin/view/
  view/styles.ts             la hoja, derivada ENTERA de src/design/
  view/refresh.ts            el guion: pide /api/board, cambia valores, nada más
  order.ts                   el orden de las filas: competición, kickoff, match_id
  handler.ts                 GET /marcador y /es/marcador: primera pintura

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
  GET /marcador  (o /es/marcador)          ← PÚBLICA. Sin sesión, sin cookie,
                                             sin saber nada de quien pide
    1. jornadas declaradas ► MEASUREMENT_WINDOWS. Vacía ⇒ pantalla apagada
                             QUE DICE POR QUÉ, y CERO CONSULTAS
    2. partidos ───────────► listKickoffsBetween por ventana declarada
    3. decisiones + obs. ──► board-entry.ts, EN LOTE: el número de consultas
                             NO crece con el número de partidos
    4. cualificador ───────► qualifierOf, de src/decide/. NUNCA reimplementado
    5. proyección ─────────► la lista cerrada de campos. Lo que no está, no sale
    6. orden ──────────────► competición, kickoff, match_id. NUNCA por cualificador
    7. documento ──────────► primera pintura CON EL DATO. No hay esqueleto
    8. cabeceras ──────────► Cache-Control COMPARTIDO y corto · noindex, noarchive

  GET /api/board
    1..6 idénticos, y después:
    7'. ETag ──────────────► función del cuerpo. If-None-Match ⇒ 304
    8'. cuerpo ────────────► la MISMA proyección, en JSON

  El guion, en el navegador, cada REFRESH_SECONDS
    a. pide /api/board CON SU ETag ────► 304 ⇒ no toca nada, sólo el reloj
    b. 200 ⇒ sustituye VALORES, no la página
    c. fallo ⇒ NO borra nada, NO atenúa nada: dice la edad de lo que hay
```

**Los pasos 1 y 5 son fronteras negativas** y se afirman como tales: no sólo
«responde lo que debe», sino **cero consultas y cero campos de más**.

**El paso 3 es el único que no existía**, y es lo que obliga a `board-entry.ts`:
el panel hace dos consultas por partido y para él está bien —lo mira una persona y
no se refresca solo—; una pantalla pública que se recarga cada medio minuto en `N`
navegadores, no.

**Y hay un paso que ya no está, y su ausencia es la decisión del gate:** no hay
comprobación de sesión. La pantalla **no sabe nada de quien la pide** —ni cookie,
ni `Accept-Language`, ni cabeceras de cliente— y por eso su respuesta **no depende
de quién pregunte**, que es lo que permite servirla desde una caché compartida
(CA-7.5) sin filtrar nada de nadie.

**Y el paso c es el que distingue esta pantalla de todas las anteriores.** Un
fallo de refresco **no cambia ningún valor de la tabla**. Lo único que cambia es
un aviso de página que dice cuántos minutos tiene lo que se está viendo.

### §3. Qué obliga publicar, y dónde va cada obligación

La decisión es del gate y está en **ADR-027 §3**. Lo que esta sección hace es
**repartir**: `sdd-legal-datos` fue explícito en que la spec **no puede colocar en
un criterio de aceptación lo que sólo puede sostener una persona**, y ese reparto
es la mitad del trabajo de esta spec.

| Obligación | Dónde vive | Criterio |
|---|---|---|
| Sin sesión, sin cookie, sin saber nada de quien pide | test | CA-2.1, CA-2.4 |
| `noindex, noarchive`, sin `nofollow` | test | CA-2.2 |
| `robots.txt` intacto | diff | CA-2.3 |
| Cero medición de audiencia, `@vercel/analytics` incluido | test | CA-2.5 |
| `/api/board` sin CORS, sin documentar, con la lista cerrada | test | CA-2.6 |
| Ninguna llamada a la acción; tres enlaces salientes | test | CA-2.7 |
| El buzón en un clic | test | CA-2.8 |
| `/proxecto` y `/robot` enlazan la pantalla | test | CA-2.9 |
| Dos competiciones, dos jornadas, nada arbitrario, sin histórico | test | CA-3.5, CA-3.6, CA-3.7 |
| La proyección cerrada, con test de filtración | test | CA-5 |
| El polling nunca pide a un tercero | test | CA-1.4 |
| El aviso con sus cuatro cosas, y el número derivado | test | CA-13.8 |
| Los tres literales corregidos, en el mismo cambio | test + diff | CA-18 |
| El calendario no se deriva de la fuente · parar es vaciar la lista | runbook | CA-3.8, CA-3.9 |
| **No desplegar antes del 08 · avisar a la RFGF · el re-dictamen** | **compromiso humano** | **CA-19** |

**Las cinco últimas no las sostiene ningún test, y CA-19.6 lo declara.** El
proyecto no tiene CI, así que ni siquiera las que sí son test se ponen rojas solas:
alguien tiene que correr `npm run gates`. Eso también va al runbook.

**Y hay una obligación que no está en la tabla porque no es de esta spec y aun así
la condiciona: la carta.** Se envió el 2026-09-01 diciendo «Non republico os seus
datos» y «aínda sen publicar». **Una carta enviada no se enmienda editando un
fichero** —el destinatario ya tiene el texto, y `tests/docs/carta-y-rastro.test.ts`
ni siquiera sujeta esa frase—. Lo único que la repara es **una persona avisando**,
y por eso CA-19.2 la manda al calendario de compromisos en vez de fingir que un
criterio la cubre.

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

**`sdd-legal-datos` — dos dictámenes, y hay que leerlos en orden.**

**Del primero (bloqueante), lo que la decisión de producto superó y lo que no.**
**V1 y V2 —que no puede haber pantalla pública— quedan superados por la decisión
de Alberto Fojo del 2026-09-04**, tomada con ese dictamen delante. *Superados, no
borrados*: el texto sigue entero en `dictamenes-SPEC-018.md` con la nota de
cabecera que lo registra, y **la mitad de V2 que sí sobrevive —no antes del
2026-09-08— es CA-19.1**. **Todo lo demás del dictamen se absorbe entero y sin
descuento**, y con la publicación decidida *vale más*, no menos, porque ahora sí
hay alguien al otro lado: V6 (proyección cerrada con test de filtración) es CA-5;
V7 (la traza no se enseña) es CA-5.4; V8 (el polling nunca pide a un tercero) es
CA-1.4; V10 (nada personal, ni escudos) es CA-5.3 y CA-15; V5 (blindar que el
calendario declarado no se derive de una fuente rastreada) es la línea de runbook
de CA-3.5 — y **es la mejor pieza defensiva del proyecto justo ahora que publica**.
**Y lo que el dictamen cierra expresamente sigue cerrado y la decisión de producto
no lo abre:** no vale matizar la frase publicada para que siga pasando el test
(CA-18.2).

**Lo que en la primera redacción se aplazaba «al ADR de publicación» ya no se
aplaza: es de esta spec.** Las **trece condiciones** de su §6.2 y el **disparador
de re-dictamen de siete puntos** de su §6.3 se reparten según lo que cada una
pueda sostener —criterio de aceptación, línea de runbook, o compromiso humano— y
ese reparto es CA-2, CA-3, CA-5 y CA-19. **Ninguna se cuenta como cubierta por un
test si no lo está**, que es lo que CA-19.5 declara.

**Su hallazgo colateral sube de rango y entra en la spec.** `site.measuring` dice
«a medición aínda non comezou e non hai ningunha cifra», y **ya era falso antes de
esta spec** —desde SPEC-012, SPEC-013 y SPEC-017—. En la primera redacción se
aplazaba a EPIC-MEJORA con disparador «la primera jornada declarada»; el segundo
dictamen lo sube a **vinculante en la misma enmienda**, y el motivo es de forma:
**una afirmación falsa en la misma página que ahora enlaza el marcador público es
el mismo fallo del §0, en el mismo sitio y con más audiencia**. Es **CA-18.1**.

**`sdd-competicion` — absorbido entero, y sin coste.** `descanso` fuera (ADR-027
§9.1, CA-17.1), sin minuto (§9.2), `suspended` con reserva (§9.3, CA-10),
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
nombre *o marcador* (§1.1), *Casa*/*Fóra* (§2.2, y su fila de glosario en CA-17.1),
*Último dato* y no *Última observación* (§2.5), la separación de §3.1 con su
barrera léxica (CA-8.4), los literales de §3.2, la etiqueta larga del cualificador
(§4.1, CA-12), *Rematado* nunca como frase suelta (§4.2, CA-12.3), la barrera de
primera persona del singular (§5.3, CA-14), la prohibición de «directo» y de
«tempo real» (§6.3, CA-14.3), y **el literal de la advertencia de degradación de
su §6.2** (CA-13.8), que con la publicación decidida deja de ser opcional.

**Y su §6.1 —«dos specs cerradas quedan desmentidas»— queda contestado por la
primera de las tres salidas que él mismo enumera**: se reescriben las dos frases
por el procedimiento de ADR-015. Es CA-18. `sdd-lingua` llegó a ese hallazgo por
su cuenta, sin coordinarse con `sdd-legal-datos`, y que dos roles distintos
tropezaran con lo mismo el mismo día es la razón de que no se despachara como un
detalle de redacción.

**Lo único que NO se sigue de este dictamen es su §1.2, la ruta `/`.** Sus dos
argumentos son correctos —la tautología `marcador.gal/marcador`, y que ADR-010 §5
ya preveía el traslado— y **Alberto Fojo lo descartó igualmente el 2026-09-04**,
descartando también dejar un disparador escrito. **No se declara equivocado: se
declara superado por una decisión de producto sobre qué es hoy este dominio.** Su
§1.1 —que la pantalla se llama *el marcador*— **sí se sigue entero**, incluido el
nombre de la ruta.

Y `titles.scoreboard` se añade (CA-13.5), aunque la pantalla se sirva desde un
manejador de ruta: el título del documento lo escribe el marcado, y el contrato de
`TitlesBundle` es donde viven los títulos. **Su valor lo decidió el gate:
`marcador.gal` a secas**, no la forma `O marcador — marcador.gal` que este
dictamen proponía como primera opción y que él mismo dejaba abierta como decisión
de producto.

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

- **CA-2 — La pantalla es pública, no sabe nada de quien la abre, y lo que publicar
  obliga (ADR-027 §3.a y §3.d, `sdd-legal-datos` C6, C9, C11, C16, C17 y §4.2).**
  Dada una petición a `/marcador`, `/es/marcador` o `/api/board`, entonces:
  1. **Se responde el tablero sin sesión y sin cookie.** Un caso afirma que ningún
     módulo de `src/board/` ni de `src/api/` importa `src/admin/session.ts` ni lee
     `ADMIN_SESSION_SECRET` o `ADMIN_OPERATORS`. **Control positivo**: introducir
     una comprobación de sesión pone rojo un caso nombrado. **Es una frontera, no
     una omisión**: si alguien «protege» esta pantalla, ha partido el producto en
     dos verdades.
  2. **`X-Robots-Tag: noindex, noarchive` en la cabecera y
     `<meta name="robots" content="noindex, noarchive">` en el documento, las dos,
     y en las tres rutas.** **Sin `nofollow`**, que trabajaría contra `/robot`
     —el único enlace saliente y la página que viaja dentro del `User-Agent`—. Un
     caso lo afirma sobre cabeceras y sobre el documento servido, en las dos
     lenguas.
  3. **`src/site/robots-txt.ts` no se toca**, y el verificador lo comprueba en el
     diff. El motivo dejó de ser «un `Disallow` confirma que existe» y pasó a ser
     técnico: **un `Disallow` derrotaría al `noindex`**, porque sin rastrear el
     buscador nunca lo lee y la URL puede indexarse desnuda. `tests/site/robots.test.ts`
     caso 3 ya lo prohíbe; lo único que crece ahí es su censo de rutas (CA-13.6).
  4. **La respuesta no depende de quién pregunte.** Un caso afirma que ningún
     módulo de `src/board/` ni de `src/api/` escribe cookie propia, usa
     `localStorage` o `sessionStorage`, lee `Accept-Language`, lee cabeceras de
     cliente, ni escribe en ninguna tabla. **La lengua sale de la URL.** Es lo que
     permite la caché compartida de CA-7.5 y lo que retira el art. 22.2 LSSI sin
     banner y sin consentimiento.
  5. **Cero medición de audiencia, y con nombre propio.** El mismo caso afirma que
     **`@vercel/analytics` no está en `package.json` ni se importa en ninguna
     parte**, y que el documento no inyecta ningún guion de terceros (ya CA-1.5).
     **Declarado dentro del criterio (ADR-016 §6):** lo que este mecanismo **no**
     alcanza es saber cuánta gente abre la pantalla, cuánto se queda o si vuelve.
     **Eso es querido**, y es la razón de que el punto 7 del disparador de
     re-dictamen no se pueda vigilar desde la página (CA-19.3).
  6. **`GET /api/board` es un endpoint JSON público, y las cuatro cosas que lo
     mantienen del lado correcto se afirman, no se suponen**: *(i)* **nunca** se
     emite `Access-Control-Allow-Origin` ni ninguna cabecera CORS —**control
     positivo**: añadirla pone rojo un caso nombrado—; *(ii)* lleva el mismo
     `X-Robots-Tag` que el documento; *(iii)* **no se documenta en ningún sitio**
     —un caso afirma que su ruta no aparece en `src/i18n/`, ni en `src/site/`, ni
     en ningún fichero servido—; *(iv)* sirve **exactamente** la lista cerrada de
     CA-5.1, ni un campo más. **Y el residuo va escrito en la spec, no disimulado:
     cualquiera con las herramientas del navegador puede leer ese JSON.** Llamarlo
     privado sería el mismo error que llamar defensa a `noindex`.
  7. **Ninguna llamada a la acción, y sólo tres enlaces salientes.** Un caso
     afirma que el documento no contiene formulario, ni `<input>`, ni `<iframe>`,
     ni ninguna forma de una **lista cerrada declarada en el test con su motivo**
     —`patrocina`, `patrocinio`, `publicidade`, `publicidad`, `anuncio`, `doar`,
     `donar`, `apoia`, `apoya`, `subscri`— y que **sus únicos `<a href>` salientes
     son `/robot`, `/proxecto` y el buzón**. Es lo que mantiene el art. 10 LSSI
     fuera: **el disparador de ese artículo no es que la página sea pública, es que
     haya actividad económica**, y hoy no la hay.
  8. **El buzón se alcanza en un clic**, y **recomendado: en el pie de la propia
     pantalla**. Un caso lo afirma en las dos lenguas. El proyecto promete «abonda
     con pedilo» y ahora eso cubre también la publicación (CA-18.2): quien venga a
     pedir que se pare no debería tener que buscar dónde.
  9. **`/proxecto` y `/robot` enlazan la pantalla, en las dos lenguas.** Cuatro
     casos, uno por página y lengua. **No es navegación: es lo que convierte
     `noindex` en no-amplificación en vez de en ocultación.** Enlazarla **no**
     dispara el re-dictamen —lo dice CA-19.3 expresamente—, porque es obligatorio.
  10. **Declarado dentro del criterio (ADR-016 §6):** **`noindex` no es una defensa
      jurídica, es mitigación de descubrimiento.** «Poner a disposición del
      público» se cumple con una URL pública, indexada o no, y nadie podrá alegar
      más adelante «no lo publicábamos, estaba en `noindex`».

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
  5. **La apertura se acota por los dos lados, no por uno.** `MEASUREMENT_WINDOWS`
     acota **cuándo**; una lista cerrada nueva acota **qué**: `PUBLISHED_COMPETITIONS`,
     con **exactamente** `preferente-futgal-grupo-1` y `terceira-rfef-grupo-1` y un
     motivo escrito por entrada (la forma de `ALLOWED_PACKAGES`, ADR-016 §3.2). El
     snapshot filtra por ella. Un caso afirma que un partido de una competición no
     listada **no sale ni en el HTML ni en el JSON**; **control positivo**: añadir
     una tercera pone rojo un caso nombrado. Sin esta lista, cargar el calendario
     de otra competición la publicaría **sin que nadie decidiera nada**.
  6. **Como máximo dos jornadas declaradas.** Un caso afirma que
     `MEASUREMENT_WINDOWS` no pasa de dos entradas. Es el número que la épica
     escribió y **es el número que sostiene el análisis del art. 7.5**: la línea no
     está entre «un partido» y «una jornada», está entre **una ventana acotada y
     declarada** y **una publicación continua**.
  7. **Nada arbitrario es alcanzable desde fuera.** Ninguna ruta acepta una fecha,
     una jornada ni un identificador libres: lo alcanzable **es igual** a lo
     declarado, y una petición por una jornada no declarada responde `404` **con
     cero lecturas de la base**. **Control positivo**: aceptar un parámetro de
     fecha pone rojo un caso nombrado. Y **no hay histórico navegable**: se sirve
     la jornada, no la temporada.
  8. **Línea de runbook**, en `docs/procedimientos/carga-del-calendario.md`: **el
     calendario declarado no se deriva de ninguna fuente rastreada, ni a mano ni
     con un LLM sobre su HTML**. Es dictamen vinculante de `sdd-legal-datos` y es
     la mejor pieza defensiva del proyecto ahora que publica; **nada en el código
     lo protege y esa línea es lo único que hay** — un fichero escrito a mano y uno
     derivado del HTML de la fuente **son el mismo fichero**. **Y con la precisión
     que el rol añadió, porque la lectura mala es la que perjudica**: lo prohibido
     es derivarlo **de la fuente rastreada**; una persona que consulta con su
     navegador el calendario publicado por la RFGF y lo teclea **no incumple
     nada** —RN-11 gobierna la petición automatizada, no la lectura humana— y es
     además la mejor posición defensiva disponible. Un caso afirma que la línea
     está en el fichero.
  9. **Segunda línea de runbook, y es la parada de emergencia**: **parar es vaciar
     `MEASUREMENT_WINDOWS`**, con esas palabras. Por CA-3.2 la pantalla sirve
     entonces lista vacía con cero consultas, y no hay que tocar una línea de
     lógica. **El botón ya existe y nadie lo sabrá el día que haga falta** si no
     está escrito. Un caso afirma que la línea está en el fichero.

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
     fuente, su dominio y su tipo** —«un agregador», «una web de resultados»:
     tipo + «una» + la competición estrecha mucho y no compra nada—,
     `operator_id`, `correspondent_id`, y **las alertas y los conflictos**, porque
     **RN-05 dice que el conflicto no se publica** y la bandeja es del panel. *Sen
     sinal* sí sale, pero **como cualificador del partido**, jamás como «una fuente
     lleva quince minutos callada».
     **Y este subpunto es el único de la spec cuyo fallo es irreversible**: bajo la
     salida (A) una filtración llegaba a un operador autenticado; publicando, llega
     a cualquiera, se cachea, se captura y **la archiva un tercero fuera de nuestro
     alcance**. Por eso el mecanismo enumera el esquema canónico y lleva control
     positivo, en vez de confiar en una lista de nombres prohibidos.
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
  5. **La caché es compartida y corta**: un caso afirma que `Cache-Control` lleva
     `s-maxage` con el valor de la constante y **no** `private` ni `no-store`. Se
     puede compartir porque **la respuesta no depende de quién pida** (CA-2.4): no
     hay sesión, no hay cookie, no se lee `Accept-Language` y no se lee ninguna
     cabecera de cliente. Sin caché compartida, `N` navegadores refrescando cada
     medio minuto son `N` proyecciones por medio minuto contra una base que a la
     vez está ingiriendo — y **la ingesta tiene prioridad sobre la pantalla**,
     porque sin `Decision` no hay nada que enseñar.
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
     **Y se publica como edad redondeada a minutos, nunca como instante absoluto
     con precisión de segundo.** Un caso afirma que ni el HTML ni el JSON contienen
     ningún instante nuestro con segundos —un `<time datetime>` **redondeado al
     minuto** sí es admisible, por accesibilidad—. El motivo es de
     `sdd-legal-datos`: `observed_at` es **nuestro** reloj y nuestra cadencia ya
     está publicada por RN-11 y por `/robot`, así que no revela nada de nadie; lo
     que sí sería un residuo es **un log público, partido a partido y al segundo,
     de cuándo pedimos**, y redondear al minuto lo cierra sin quitarle nada a quien
     mira.
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
  5. **`titles.scoreboard` se añade a `TitlesBundle` en las dos lenguas, y su valor
     es `marcador.gal` en las dos.** SPEC-006 dejó escrito que toda página nueva
     declara su título ahí o no tiene ninguno. **Decidido por Alberto Fojo el
     2026-09-04**, descartando la forma `O marcador — marcador.gal` que sigue el
     patrón de las otras dos (`O proxecto — marcador.gal`, `O rastrexador —
     marcador.gal`): la portada del marcador **no repite el dominio detrás de un
     guion**. Un caso afirma el valor literal en las dos lenguas.
  6. **Las tres listas cerradas que enumeran las páginas del sitio crecen en una
     entrada**, y esto **no es una enmienda de ADR-015 sino el mecanismo
     funcionando**: `PAGES` en `tests/site/titles-i18n.test.ts` caso 4 —que hoy
     dice `['project','crawler']` y se pone **rojo** en cuanto exista el título
     nuevo—, `ROUTES` en `tests/site/document-titles.test.ts`, y la lista de rutas
     permitidas de `tests/site/robots.test.ts` caso 4. Las tres son **datos de un
     guardián, no la regla que guarda**, y crecer es lo que se espera de ellas
     cuando el sitio gana una página. Se tocan bajo la disciplina de CA-17.2.
  7. **`tests/site/no-hardcoded-literals.test.ts` sigue verde con las rutas nuevas
     dentro de su alcance y sin añadir ninguna excepción.**
  8. **El aviso de la pantalla, que ya no es opcional y que lleva cuatro cosas.**
     **Confirmado por Alberto Fojo el 2026-09-04**, y con la publicación decidida
     cambia de naturaleza: deja de ser cortesía interna y pasa a ser **la
     declaración de degradación que EPIC-002 exige** y **lo que sostiene la
     coherencia entre la pantalla, `/robot` y la carta**. Contenido obligado, en
     claves separadas para que un caso afirme cada mitad:
     - **(i)** esto es una **medición, no un producto** (D-1);
     - **(ii)** **no es oficial, no es de la RFGF y no viene de `futgal.es`.** Es
       la adición que la publicación obliga: con una pantalla de operador nadie
       podía confundirla con un marcador oficial; **en público, la confusión es el
       fallo por defecto**, y llega en la semana en que la federación decide;
     - **(iii)** la **degradación**: hay **una sola fuente automática**, así que lo
       normal es que el marcador sea provisional y llegue con atraso (ADR-008 §1,
       RN-03);
     - **(iv)** **cómo pedir que pare**: el buzón, o `/robot`.

     **Forma, y es testable:** visible **sin interacción**, **antes de la tabla** en
     orden del documento, con paridad gl/es, y **sin ningún control de descarte que
     escriba estado** —ni cookie ni `localStorage`, que rompería CA-2.4—. Un
     `<details>` plegado vale para la explicación larga, **nunca para la primera
     línea**.

     **El número de fuentes se DERIVA, no se teclea.** Un caso afirma que lo que el
     aviso declara coincide con la longitud de `DEFAULT_SOURCES`
     (`src/ingest/sources.ts`, hoy una entrada); **control positivo**: declarar una
     segunda fuente pone rojo un caso nombrado hasta que el aviso se corrija. El
     motivo tiene fecha: **`lapreferente.com` se verifica el 2026-09-06** (fila 1
     del calendario de compromisos), dos días antes del despliegue, y **un aviso
     público falso sobre la propia actividad nacería falso el primer día**.

     **Y la línea que el aviso NO puede cruzar** (CA-5.3): no nombra la fuente, ni
     su dominio, ni su peso, ni **su tipo** —«un agregador», «una web de
     resultados»—, ni le atribuye cadencia, ni la compara con la oficial. **Y no
     dice que «la fuente oficial no nos deja»**: eso está en `/robot`, es correcto
     ahí, y en el marcador —junto a las dos competiciones de la RFGF y en esta
     semana— **se leería como un reproche a la federación en la página que publica
     sus competiciones**.

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
  3. **Declarado dentro del criterio (ADR-016 §6):** CA-1 a CA-15 son estáticos y
     **no ven un diseño calculado ni ejecutan una línea de JavaScript**; éste es el
     único que ve el navegador, y lo hace una persona. (CA-17 a CA-19 no son
     estáticos ni de navegador: son disciplina, enmiendas y compromisos escritos, y
     CA-19.5 declara lo que no sostienen.) **Destino:
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
  2. **Disciplina al tocar una spec cerrada, y la distinción que la hace utilizable.**
     **F-SPEC-016-8 dice que la próxima spec que toque la suite de una spec cerrada
     necesita una regla que lo gobierne, porque SPEC-016 no la tuvo.** La regla, que
     es la de SPEC-015 CA-15.3: **se toca lo mínimo, cada toque va en su propio
     commit con el motivo escrito, y ninguna aserción existente se debilita ni se
     borra** — el verificador lo comprueba en el diff, aserción a aserción.

     **Y hay que distinguir tres cosas que parecen la misma y no lo son**, porque
     esta spec hace las tres y sin la distinción este subpunto se contradice con
     CA-18:

     - **(i) Ensanchar por conveniencia. PROHIBIDO.** «Ya que estamos, añadimos
       aserciones que le faltan a la suite de al lado.» Es lo que se le declina a
       F-SPEC-017-16 en *Fuera de alcance*, y lo que este subpunto existe para
       impedir.
     - **(ii) Actualizar el dato de un guardián cuyo dato cambió. PERMITIDO, y es
       el mecanismo funcionando.** La lista `PAGES` de los títulos, la de rutas de
       `robots.test.ts` caso 4, la `ROUTES` de `document-titles.test.ts`
       (CA-13.6): son **listas cerradas que enumeran las páginas del sitio**, y el
       sitio gana una. La regla que guardan no cambia; su censo sí.
     - **(iii) Corregir una afirmación que esta misma decisión vuelve falsa.
       OBLIGATORIO, y va por ADR-015. Es CA-18.** No es conveniencia ni censo: es
       que **el producto mentiría** si no se hace, y mentiría en la página que un
       tercero audita. La diferencia con (i) es de dirección: en (i) la spec
       aprovecha para arreglar algo ajeno; en (iii) **la spec repara el daño que
       ella misma causa**, y no hacerlo no es prudencia, es dejar una mentira
       publicada. La disciplina de arriba —lo mínimo, commit propio, ninguna
       aserción debilitada— **se aplica igual a las tres**.
  3. **Se cierra F-SPEC-004-9 · F-SPEC-005-2**, cuyo disparador es «cualquier
     trabajo que toque rutas del sitio» y cuya nota advierte que **«la barrera
     correcta es una sola sobre las cuatro URL; escribirla a trozos es cómo llegó a
     estar a medias»**. Un caso **único** afirma con **literales**, no con la
     constante comparada consigo misma, que `PROJECT_PATH`, `CRAWLER_PATH` y la
     dirección del marcador valen lo que valen. **Y declara la asimetría dentro del
     propio caso:** las cuatro primeras **no se mueven nunca** (ADR-010 §5, porque
     `/robot` viaja dentro del `User-Agent`); **la del marcador no lleva esa
     promesa** (ADR-027 §1), y por eso el caso las afirma **en dos grupos con el
     motivo de cada uno escrito**. **Y `/` sigue redirigiendo a `/proxecto`**: un
     caso afirma que `SITE_REDIRECTS` conserva la regla `'/' → PROJECT_PATH.gl`,
     porque el gate del 2026-09-04 **descartó explícitamente** tomar la raíz.
  4. **F-SPEC-004-7 NO se cierra, y se declara por qué no dispara.** Su disparador
     es «la primera vez que se añada `metadata`, un favicon o un script **a un
     layout**», y esta pantalla **no toca ningún layout**: se sirve desde un
     manejador de ruta, así que **su barrera de contenido afirma sobre el documento
     servido byte a byte** y el agujero que ese finding describe no se reintroduce.
     **Conserva su disparador intacto.**

- **CA-18 — Lo que publicar vuelve falso se corrige EN EL MISMO CAMBIO, por
  ADR-015 (ADR-027 §3.c, `sdd-legal-datos` §0 y §6).**
  **Éste es el criterio que separa «publicar» de «publicar y mentir», y su
  requisito temporal es parte del criterio:** no hay ninguna versión desplegable en
  la que la pantalla exista y las afirmaciones sigan sin corregir.
  1. **`site.noProduct` y `site.measuring`, las dos, en la misma enmienda de
     SPEC-004.**
     - **`noProduct`** dice hoy «nin marcador público, nin aplicación, nin conta
       que crear». **Deja de afirmar** la primera. **Pasa a afirmar** que hay una
       pantalla pública, dónde está —y la enlaza (CA-2.9)—, que enseña **sólo** las
       jornadas declaradas de **dos** competiciones, que es un instrumento de
       medición, que **normalmente será provisional y llegará con atraso**, y que
       **se apaga cuando la medición acaba**. **Y lo que NO puede cambiar, porque
       es de carga:** «no hay aplicación, ni cuenta que crear, ni lista de espera»
       sigue siendo verdad y **es exactamente lo que mantiene el art. 10 LSSI
       fuera** (CA-2.7). Quien edite este literal tiene que saber que esa mitad no
       es prosa sobrante.
     - **`measuring`** dice «a medición aínda non comezou e non hai ningunha
       cifra», y **ya era falsa antes de esta spec** —desde SPEC-012, SPEC-013 y
       SPEC-017—. En la primera redacción se aplazaba a EPIC-MEJORA; **con la
       publicación sube a vinculante y entra aquí**: una afirmación falsa en la
       misma página que enlaza el marcador público es el mismo fallo, en el mismo
       sitio y con más audiencia. **Cuidado al reescribirla**: `tests/site/i18n.test.ts`
       caso 9 (`NOT_MEASURING_YET`) **no exige** decir «aínda non comezou» —sólo
       **prohíbe** decir que se está midiendo—, y el caso 10 **sí exige** que siga
       diciendo que la fuente oficial no se rastrea y por qué.
     - Casos afectados: `tests/site/pages.test.ts` **12** (exige `informe interno`
       sobre `site.purpose`) y **13**; `tests/site/i18n.test.ts` **9** y **10**.
  2. **`crawler.noRepublish` deja de afirmar las tres cosas** —«non republicamos os
     datos de ninguén», «o resultado é un informe interno», «non hai marcador
     público, nin ficheiro de datos, nin nada que se poida consultar fóra do
     proxecto»— **y reconstruye la promesa, que sigue siendo grande y es más
     auditable que la que se retira**: que **no hay redistribución en bloque** —ni
     fichero, ni volcado, ni feed, ni API, ni widget, ni exportación—; que **no hay
     histórico**; que son **dos competiciones y sólo las jornadas declaradas**, con
     el número; que por partido salen **cuatro cosas y ninguna más**; que **no hay
     ni un dato personal**; que **no hay monetización**; que **la retención no se
     mueve**; y que **el buzón sigue delante y ahora también para la publicación**
     —«abonda con pedilo» cubría el rastreo y pasa a cubrir lo que se publica—.
     **Ésa es la adición más importante de todo el cambio en `/robot`: la
     publicación no puede prometer menos que la captura.**
     Caso afectado: `tests/site/crawler-page.test.ts` **12**, que hoy exige
     literalmente `non republicamos` / `no republicamos` e `informe interno`.
     **Lo que NO vale, y el dictamen lo cierra dos veces:** matizar la frase para
     que el caso siga verde («non republicamos… salvo unha pantalla de medición»),
     **ni reinterpretarla sobre datos personales** —que sería literalmente cierto y
     sería peor—. **La frase se va; la promesa se reconstruye.**
     **Y la fuente sigue sin nombrarse**, aquí tampoco: no hay deber de atribución
     y nombrarla sería la primera divulgación, escrita y fechada por nosotros. **El
     silencio se declara en una línea** —no nombramos los sitios que leemos; si
     crees que leemos el tuyo, escribe y paramos—, que es lo que lo hace una
     postura en vez de una ocultación.
     **Añadido en la misma clave o en una vecina: la línea de privacidad.** No es
     un aviso legal ni un banner: qué registra el servidor, quién lo procesa, con
     qué base, cuánto se conserva, **que no hay cookies ni analítica ni terceros**,
     y el buzón para los arts. 15-22 RGPD. Va **dentro de `/robot`**, que ya tiene
     el bloque de qué se guarda y cuánto: un solo lugar honesto, una superficie
     menos. Y **sin nombrar a ninguna persona física**, que la barrera de SPEC-007
     ya vigila.
  3. **La barrera de identidad de SPEC-007 se ensancha al espacio y a la ruta
     nuevos.** `tests/site/identity.test.ts` caso 4 fija hoy **exactamente tres
     espacios de nombres y cuatro rutas**, así que **NO se pone rojo** cuando
     aparece un quinto sitio con texto visible: **deja de cubrirlo en silencio**,
     que es peor. `NO_PERSON` y `NO_HEADCOUNT` pasan a recorrer también el espacio
     del marcador y el HTML de `/marcador` y `/es/marcador`, y los números del caso
     4 se actualizan.
  4. **Tres enmiendas de ledger, con los cinco puntos que ADR-015 §3 exige**
     —qué afirmaba el CA y por qué era razonable, qué lo invalida citado por
     número, con qué se sustituye y si la red que queda es menor, si el veredicto
     sigue en pie, y qué lo despierta— bajo el encabezado literal
     `## Enmienda — 2026-09-04: <qué la invalida>`, que **es el índice**
     (`grep -rn "^## Enmienda —" docs/epicas/`):
     **SPEC-004** (`site.noProduct`, `site.purpose`), **SPEC-005**
     (`crawler.noRepublish`, que es una de las seis afirmaciones auditables de
     `/robot`) y **SPEC-007** (el alcance cerrado de la barrera de identidad).
     **El cuerpo de las tres specs no se edita, y su frontmatter tampoco**
     (ADR-015 §1 y §4): siguen `hecho` y siguen GREEN.
  5. **Un caso, nuevo y en fichero propio, afirma que la contradicción no puede
     volver**: ninguna clave de `site` ni de `crawler`, en ninguna de las dos
     lenguas, contiene ya —desacentuado y en minúsculas— `marcador publico`, `non
     republicamos`, `no republicamos` ni `nada que se poida consultar fora do
     proxecto` / `nada que se pueda consultar fuera del proyecto`. **Control
     positivo**: reponer una de esas cadenas pone el caso en rojo. Es la barrera
     que impide que una spec futura restaure la frase vieja por copiar-pegar.
  6. **Declarado dentro del criterio (ADR-016 §6):** hay una afirmación de la misma
     familia que **este criterio no toca y no puede tocar** — la de la **carta**,
     enviada el 2026-09-01, que dice «Non republico os seus datos» y «aínda sen
     publicar». **Una carta enviada no se enmienda editando un fichero.** Editar
     `docs/negocio/carta-rfgf-acceso.md` no pondría rojo nada
     (`tests/docs/carta-y-rastro.test.ts` sólo sujeta el user-agent y las dos
     líneas de `robots.txt`) y **tampoco arreglaría nada**, porque el destinatario
     ya tiene el texto. Lo único que repara esa afirmación es **una persona
     avisando**, y eso es CA-19.
  7. **Y una contradicción que ya existía antes de esta spec, y que la enmienda
     recoge de paso porque va en la misma frase:** el bundle del **bot** lleva
     desde SPEC-015 «se procede, **sae no marcador**» y «o interese lexítimo de
     poder auditar **un marcador publicado**». Es decir, **`noRepublish` y el bot
     ya se contradecían el 2026-09-03**, y nadie lo vio porque el marcador no
     existía. Se anota en la enmienda de SPEC-005 como lo que es: la prueba de que
     esta corrección estaba pendiente antes de que esta spec la hiciera urgente.

- **CA-19 — Lo que ningún test puede sostener: la fecha y el aviso (ADR-027 §3.b y
  §3.e, ADR-016 §6).**
  1. **No se despliega antes del 2026-09-08, y no antes de que la RFGF haya sido
     avisada — lo que ocurra más tarde de los dos.** El 08 es la fecha en que la
     carta se da por no contestada (`docs/roadmap.md`, decisión de Alberto Fojo del
     2026-09-01). **Esto no es verificable con un test y no se finge que lo sea**:
     es una restricción de despliegue, y su sitio es
     `docs/procedimientos/calendario-de-compromisos.md`.
     **Y hay una ordenación de tres días que conviene no descubrir sobre la
     marcha**, porque una fecha decide el contenido de otra: el **06** se verifica
     `lapreferente.com` (fila 1 de ese fichero), el **07** se ajusta el aviso de
     degradación y el número que declara si esa verificación cambió el hecho
     (CA-13.8), y el **08** se despliega. En ese orden.
  2. **Avisar a la RFGF es un compromiso humano con nombre y fecha.** Ninguna spec
     puede ejecutarlo y ningún criterio puede darlo por cumplido. Va al mismo
     fichero, con las cinco columnas que ese documento ya tiene, y con la respuesta
     honesta en la cuarta: **nada se pone rojo**.
     **Y no es el segundo correo que la regla por defecto prohíbe.** La fila 3 de
     ese fichero dice que no se insiste mientras Alberto Fojo no se pronuncie, y
     sigue en pie: lo prohibido es **un recordatorio**. Este aviso **no pide nada**
     —corrige una afirmación que se les hizo por escrito, y se les debe conteste o
     no conteste—. Va **sin ninguna petición nueva, sin repetir la anterior y sin
     plazo**; **si pide algo, se convierte en el correo que la regla prohíbe**.
  3. **El disparador de re-dictamen entra en ese mismo fichero**, con sus **ocho**
     puntos: una tercera jornada o publicación continua · una competición fuera de
     la lista · cualquier dato nuevo · amplificación —perder el `noindex`, aparecer
     en `robots.txt`, **un enlace entrante externo**, o mudar la pantalla a `/`— ·
     acceso programático ofrecido a un tercero · cualquier monetización · que deje
     de ser el operador y su entorno quien la abre · que el aviso de degradación
     deje de ser cierto. **Enlazarla desde `/proxecto` y `/robot` NO dispara: es
     obligatorio** (CA-2.9), y hay que decirlo porque el disparador anterior lo
     listaba como amplificación y cumplir la obligación lo habría disparado el
     primer día.
     **Más la cláusula permanente:** si ZOS, Lda. o la RFGF piden que se pare, **se
     para primero y se dictamina después**, y **parar es vaciar
     `MEASUREMENT_WINDOWS`** (CA-3.9). **En la duda, se para.**
  4. **El punto de tráfico se sustituye, porque como estaba escrito nadie podía
     observarlo.** Decía «más de 100 visitantes distintos», y con CA-2.4 y CA-2.5
     no hay analítica ni la va a haber; un disparador que nadie puede observar es
     peor que ninguno, porque hace creer que algo vigila. **La sustitución no añade
     ni un byte a la página**: se miran, del lado del servidor y a posteriori,
     **las cargas del documento** de las dos rutas en un día —el documento y **no**
     la ruta de refresco, que a un poll por minuto inflaría el número unas noventa
     veces por lector y hora— y **la primera aparición de un `Referer` que no sea
     este origen**, que es el indicador que de verdad importa y es gratis. **Y una
     fila más en el calendario:** al día siguiente de cada jornada, una persona los
     mira y escribe el número en el ledger de esa jornada.
  5. **Y el párrafo de cierre de ese fichero dice «cuatro de estas cinco fechas»**:
     al añadir filas queda desactualizado y **ningún test lo vigila**. Se actualiza
     en el mismo cambio. Es pequeño y es exactamente la clase de cosa por la que ese
     documento pierde autoridad.
  6. **Lo que estos cinco puntos NO dan, declarado (ADR-016 §6):** ninguno impide
     técnicamente un despliegue anticipado, ninguno detecta que el aviso no se dio,
     ninguno detecta que se cruzó un umbral del re-dictamen, y **nadie sabrá cuánta
     gente abre la pantalla** — eso es la contrapartida querida de CA-2.5, no una
     carencia. **Son compromisos escritos, no barreras**, y esta línea existe para
     que nadie los cuente como barreras al leer la matriz del ledger. **Son cinco
     de las condiciones de publicación, y el proyecto no tiene CI**
     (F-SPEC-004-3 · F-SPEC-005-4): van al calendario de compromisos por el mismo
     motivo por el que ese fichero existe.

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

**ADRs**: **ADR-027** (`borrador`, esta spec lo trae, y es el ADR de publicación
con firma del gate que el dictamen exige) · **ADR-003** (el snapshot cacheable,
aterrizado en CA-7 sin superseder; SSE sigue fuera) · **ADR-004** ·
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

**Normas citadas por los dictámenes, y que no viven en este repositorio**:
Directiva 96/9/CE arts. 7.2.b y **7.5** (derecho *sui generis*, reutilización
repetida y sistemática) · TRLPI arts. 133-137 · Directiva (UE) 2019/790 art. 4
(minería: **cubre extraer, no reutilizar**) · RGPD arts. 5.1.c, 6.1.f, 15-22 ·
**LSSI arts. 10 y 22.2** · Ley 3/1991 art. 5 · TJUE *Innoweb* (C-202/12) y
*CV-Online Latvia* (C-762/19). Se citan aquí para que quien lea la spec dentro de
un año sepa **contra qué** están escritos CA-2, CA-3 y CA-5, y no los tome por
prudencia genérica.

**Épicas**: **EPIC-002** (esta spec es la penúltima) · **EPIC-004**
(`aprobada`, **congelada**; se cierran la entrada **4** y la mitad abierta de la
**1**, y **no se descongela nada**) · **EPIC-MEJORA** (se cierran
**F-SPEC-007-10**, **F-SPEC-004-9 · F-SPEC-005-2**, **F-SPEC-017-18** y
**F-SPEC-016-8**; conservan su disparador **F-SPEC-004-7**, **F-SPEC-005-V3 ·
F-SPEC-017-17**, **F-SPEC-017-9**, **F-SPEC-017-10**, **F-SPEC-017-16** y
**F-SPEC-015-9**).

## Fuera de alcance

Aparcado a propósito, no por descuido. Cada cosa con su destino y su disparador.

- **Ampliar la publicación.** Publicar está **dentro** —lo decidió el gate del
  2026-09-04— pero **acotado**: dos jornadas de medición declaradas, dos
  competiciones, los campos de CA-5.1 y nada más. **Una tercera jornada, una
  competición nueva, un dato nuevo, un histórico navegable, un acceso programático
  o cualquier monetización NO entran en esta spec: reabren el dictamen** (CA-2).
  **Destino: `sdd-legal-datos` y un ADR nuevo; disparador: cualquiera de los puntos
  del re-dictamen, escritos en `calendario-de-compromisos.md` (CA-19.3).**
- **Tomar la raíz `/`.** `sdd-lingua` §1.2 tiene razón en que `marcador.gal/marcador`
  es una tautología y ADR-010 §5 reservó `/` para el producto. **Alberto Fojo lo
  descartó el 2026-09-04**, y descartó también dejar escrito un disparador para
  mudarse a `/` en el go/no-go. **Sin destino y sin disparador a propósito**:
  moverla exige una decisión nueva, no una condición cumplida. `/` sigue
  redirigiendo a `/proxecto` y CA-17.3 lo afirma.
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
  CA-2.5 lo hace estructural, **`@vercel/analytics` incluido con nombre propio**.
  La contrapartida es querida y está declarada: **nadie sabrá cuánta gente abre la
  pantalla**. **Disparador: la landing con lista de espera**, que vive en *Más
  adelante* y llegará con esa pregunta puesta — y que además dispararía el art. 10
  LSSI (CA-2.7).
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
- ~~**Corregir `site.measuring`.**~~ **Ya no está fuera: entra en CA-18.1.** La
  primera redacción la aplazaba a EPIC-MEJORA con disparador «la primera jornada
  declarada», y el segundo dictamen la subió a vinculante — la frase ya era falsa
  antes de esta spec, y ahora vive en la página que enlaza el marcador público.
- **Notificar a nadie de nada.** La pantalla se mira; no avisa. Es la misma frontera
  que SPEC-017 puso al panel.

## Notas para el gate humano

> **Segunda redacción, 2026-09-04.** La primera tomaba la salida (A) —no
> publicar— siguiendo el dictamen bloqueante. **El gate decidió la (B)** y esta
> spec la ejecuta. Estas notas ya no vuelven a plantear esa pregunta: lo que
> señalan es lo que la decisión **arrastra** y hay que mirar antes de firmar.

**§1. Lo que hay que mirar con más lupa ya no es si se publica, sino CA-18.**
Publicar está decidido. Lo que decide si está bien hecho es que **las tres
afirmaciones que dejan de ser ciertas se corrijan en el mismo cambio**, y ahí hay
una tentación concreta y barata que conviene nombrar antes de que aparezca en una
revisión: **estrechar la frase hasta que el test siga verde** en vez de
reescribirla. «Non republicamos os datos de ninguén… salvo unha pantalla de
medición» pasaría el caso 12 y sería exactamente lo que un tercero enseñaría. El
dictamen lo cierra expresamente y CA-18.2 lo repite; **si algo de esta spec no se
puede recortar en la implementación, es eso**.

Y hay un detalle del inventario que refuerza por qué esta corrección estaba
pendiente antes de esta spec: **el bundle del bot ya se contradice hoy con
`noRepublish`** —dice «se procede, **sae no marcador**» y habla de «un marcador
publicado» desde SPEC-015—. Nadie lo vio porque el marcador no existía. Va anotado
en la enmienda (CA-18.7).

**§1 bis. Y lo que no se puede arreglar editando nada: la carta.** Se envió el
2026-09-01 diciendo «Non republico os seus datos» y «aínda sen publicar». **Una
carta enviada no se enmienda**, y `tests/docs/carta-y-rastro.test.ts` no sujeta esa
frase, así que editar el fichero no pondría rojo nada **y tampoco arreglaría
nada**. Lo único que la repara es **una persona avisando**, y por eso CA-19.2 la
manda al calendario de compromisos como lo que es —un compromiso humano con nombre
y fecha— en vez de fingir que un criterio la cubre. **Es la parte de esta decisión
que ningún test va a sostener nunca.**

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

**§8. De qué depende que esta pantalla no salga vacía, y ninguna de las dos cosas
es de esta spec.** `sdd-competicion` avisa de que **la jornada 1 de Preferente
Futgal Grupo 1 es el domingo 6 de septiembre de 2026 y `calendario/` no existe en
el repositorio**. Sin calendario declarado no hay denominador, no hay identidad de
partido y **esta pantalla no tiene nada que enseñar**, aunque sus diecinueve
criterios estén en verde. Y `MEASUREMENT_WINDOWS` sigue vacía, con sus dos
precondiciones escritas (ADR-020 §3). Las dos son **acciones de runbook**, no
alcance de esta spec, y no las amplío.

**Lo que sí cambia con la publicación es cuánto cuesta que falten.** Una pantalla
privada vacía no la ve nadie; **una pública vacía parece rota**, y la vería
cualquiera que abra el enlace. Por eso CA-3.2 y CA-3.3 exigen que la pantalla
**diga por qué está vacía** y que distinga «no hay partidos» de «no se declaró
ninguno». Es la mitigación que está en mi mano; el resto es el diff de la primera
jornada declarada.

**§9. Una recomendación del rol legal que NO he tomado, y quiero que se vea.**
`sdd-legal-datos` recomienda (**R1**) que el refresco devuelva **fragmento HTML en
vez de JSON**: entonces «sin superficie programática» sería literalmente cierto en
vez de sostenido por cuatro comprobaciones, y no habría que defender que un
endpoint alcanzable con `curl` no es una superficie. **No la he tomado por dos
motivos** —**ADR-003 fijó un snapshot JSON**, y cambiar el formato del cuerpo sería
superseder una decisión aprobada para satisfacer una recomendación; y **el contrato
serializado es medio entregable de esta spec**: si nunca se sirve, no se ha
ejercido—. Los cuatro mínimos vinculantes se cumplen enteros (CA-2.6) y el residuo
va escrito: **ese JSON lo lee cualquiera**. **Si el gate prefiere R1, se cambia
CA-2.6 y CA-7 y no arrastra a ningún otro criterio.**

**§10. Y lo que queda abierto de verdad, que es poco y no bloquea nada.** La
respuesta de la RFGF, si llega antes del 08, **no cambia esta spec pero sí cambia
el tono del aviso**, y hay una regla de clasificación en CA-19.3 para el caso de
que conteste que no: «no nos rastreéis» no detiene la publicación; cualquier frase
sobre la publicación misma sí, y entonces se para primero y se dictamina después.
**En la duda, se para.** Lo decide una persona y está en el calendario de
compromisos.

**Lo que ya NO está abierto, y en la primera redacción sí lo estaba:** si
`/proxecto` y `/robot` enlazan la pantalla. **Es obligatorio** (CA-2.9), y no por
navegación: **es lo que convierte `noindex` en no-amplificación en vez de en
ocultación**. Publicar, no indexar y no enlazar sería esconderse, y leería fatal
al lado de la carta.
