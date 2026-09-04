---
id: ADR-027
tipo: adr
estado: aprobada
historial:
  - {estado: borrador, fecha: 2026-09-04, por: sdd-arquitecto}
  - {estado: aprobada, fecha: 2026-09-04, por: Alberto Fojo}
aprobada-por: Alberto Fojo
---
# ADR-027: El marcador se publica — proyección de sólo lectura, la jornada de medición como única apertura, y los tres relojes de la frescura

- Deciders: **decide Alberto Fojo el 2026-09-04, en el gate de SPEC-018: el
  marcador se publica.** Es la **salida (B)** que el propio dictamen de
  `sdd-legal-datos` había enumerado como admisible, y la tomó **con ese dictamen
  delante y con sus tres consecuencias sobre la mesa**: que `/proxecto` y `/robot`
  afirman **bajo test** que «non hai marcador público», que la carta a la RFGF
  sigue viva hasta el **2026-09-08**, y que corregir esas afirmaciones es
  obligatorio y va por **ADR-015**. En el mismo gate decidió la ruta —`/marcador`
  y `/es/marcador`, **no la raíz**, con ADR-010 §5 intacto—, el título del
  documento —`marcador.gal` a secas— y que la pantalla **lleva su declaración de
  degradación visible**.
  Escribe `sdd-arquitecto` el ADR que lo sostiene. **Aprueba: pendiente de gate
  humano.**
- **El dictamen bloqueante no se borra, y este ADR no lo relitiga.** La primera
  redacción de SPEC-018 tomó la salida (A) —no publicar— siguiendo el dictamen de
  `sdd-legal-datos` del 2026-09-04 por la mañana, al que `sdd-lingua` había llegado
  por su cuenta (§6.1). Ese texto **se conserva íntegro** en
  `dictamenes-SPEC-018.md`, con una nota de cabecera que registra que una decisión
  de producto lo superó, con fecha y firmante — que es como se supera un dictamen
  consultivo, no reescribiéndolo. **Se reconsultó al mismo rol esa misma tarde**,
  y no sobre si se publica sino **bajo qué condiciones se publica bien**; su
  segundo dictamen está en el mismo fichero y es la fuente de §3.
  **Lo que el dictamen cierra expresamente sigue cerrado, y la decisión de
  producto no lo abre:** no vale matizar la frase publicada para que siga pasando
  el test. Se corrige de verdad o no se publica.
- Specs relacionadas: **SPEC-018** (la que lo ejecuta); **SPEC-013** (`hecho`; el
  motor, el cualificador derivado y la frontera `DECISION_WRITERS`, que este ADR
  **no** ensancha); **SPEC-017** (`hecho`; el panel, cuyo precedente de forma se
  hereda casi entero y del que este ADR se aparta en **tres** puntos —el orden de
  las filas, la puerta de lectura en lote y el destinatario—); **SPEC-012**
  (`hecho`; las jornadas de medición declaradas, que son también la apertura de
  esta pantalla); **SPEC-010** (`hecho`; el calendario declarado); **SPEC-004**,
  **SPEC-005** y **SPEC-007** (`hecho`, GREEN; el sitio público, cuyas
  afirmaciones publicadas **este ADR obliga a enmendar por ADR-015** — §3.c, y es
  la parte más delicada de esta decisión).
- Relacionado: **ADR-003** (SSE y el snapshot cacheable; este ADR lo **aterriza
  sin superseder**), **ADR-004** (sin proceso vivo, sin disco, sin
  `LISTEN/NOTIFY`), **ADR-006** (instantes ISO, sin ORM), **ADR-008 §1 y §5** (una
  sola fuente automática capturable, y el límite escrito «es medición, no
  producción: ningún dato se publica»), **ADR-009 §3 y §6**, **ADR-010 §5** (`/`
  reservada para el producto), **ADR-011** y **ADR-012 §1 y §3** (la identidad
  pública y el buzón delante), **ADR-013 §1..§6**, **ADR-015** (cómo se enmienda
  una spec cerrada — **este ADR obliga a usarlo tres veces**), **ADR-016** (lista cerrada
  con motivo por entrada, y declarar lo que un mecanismo no alcanza), **ADR-017**
  (calendario declarado), **ADR-019 §2 y §3**, **ADR-020 §2**, **ADR-021 §2, §5 y
  §6**, **ADR-024 §1, §3 y §9** (el panel, del que esta pantalla toma la llave de
  la jornada declarada y **no** la puerta), **ADR-025 §2, §3, §4.1 y §5** (el suelo de
  interfaz, intacto), **ADR-026 §1, §2, §3, §4 y §7** (el sistema de diseño
  vinculante, el énfasis invertido, y la pregunta de `descanso`/`suspended` que
  §9 contesta), **EPIC-004** (`aprobada` y **congelada**; su inventario, entradas
  **1** y **4**), **D-1, D-2, D-6, D-7, D-8**, **RN-02, RN-03, RN-05, RN-06,
  RN-07, RN-08, RN-11, RN-12, RN-13**.

## Contexto

### Lo que cambia hoy: el dato sale del proyecto

Hasta ahora el sistema **capturaba, decidía y guardaba en privado**. `src/mirror/`
midió, `src/ingest/` ingirió, `src/decide/` decidió, `src/bot/` recogió y
`src/admin/` arbitró, y **ninguna de esas cinco piezas enseñó nunca un marcador a
nadie que no sea el operador**. El panel se sirve `noindex, nofollow`, detrás de
una sesión firmada y con `Cache-Control: no-store`.

**Esta pantalla es lo contrario en las tres dimensiones: pública, cacheable y
legible por cualquiera.** No es «una pantalla más»: es el punto donde el verbo
cambia de **obtener** a **publicar**, y donde tres cosas que hasta hoy eran
internas se vuelven afirmaciones frente a terceros.

**Se consultó a los tres roles consultivos antes de escribir un solo criterio, y
el de `sdd-legal-datos` volvió bloqueante.** No por el derecho *sui generis*
—que también analiza, y cuyo análisis es ahora la materia de §3— sino por un
hecho del propio repositorio que estaba delante de todos:

> El proyecto **ya ha declarado por escrito, en público y ante un tercero
> concreto, que no publica nada**. Tres veces, y las tres siguen vivas hoy.

1. **`/robot` y `/es/robot`**, clave `noRepublish` (SPEC-005, `hecho`, GREEN, y
   **sujeta por test**, `tests/site/crawler-page.test.ts` caso 12): «**Non
   republicamos os datos de ninguén.** Isto é unha medición, e o resultado é un
   informe interno. **Non hai marcador público**, nin ficheiro de datos, nin nada
   que se poida consultar fóra do proxecto.»
2. **`/proxecto` y `/es/proxecto`**, clave `noProduct` (SPEC-004, `hecho`, GREEN,
   sujeta por test): «Hoxe non hai nada que usar: **nin marcador público**, nin
   aplicación, nin conta que crear.»
3. **La carta a la RFGF**, enviada el **2026-09-01** a `info@futgal.es`: «Non
   republico os seus datos: isto é medición, e o resultado é un informe interno.»
   Su plazo **vence el 2026-09-08** y **está sin contestar ahora mismo**.

Servir un marcador de Preferente Futgal Grupo 1 y Terceira RFEF Grupo 1 en una
URL pública convierte las tres en **falsas si no se corrigen**. Y `/robot` no es
una página cualquiera: **es la página que viaja dentro del `User-Agent` de cada
petición que este proyecto hace** (ADR-011), la que sostiene RN-11 frente a
terceros y la que respalda la carta. Todo el andamio de mitigación de este
proyecto —el user-agent declarado, el ritmo publicado, el buzón delante
(ADR-012 §3)— vale **porque es verificable y cierto**.

**Y ahí está la decisión, y por qué este ADR gasta una sección entera en algo que
parece documentación.** El gate eligió publicar. Publicar sin corregir esas tres
afirmaciones no es un descuido de mantenimiento: **es convertir la mitigación en
su contrario**, y hacerlo en la página que un tercero audita. Así que las
correcciones **no son un follow-up de esta decisión: son parte de ella**, van en
el mismo cambio, y §3.c las escribe una por una.

Hay además una corrección de premisa que el dictamen deja escrita y que conviene
no perder: **el riesgo residual que ADR-008 §5 aceptó no cubre publicar.** Lo que
el gate firmó el 2026-08-31 fue **capturar**, bajo el límite expreso «es
medición, no producción: ningún dato se publica»; y el amparo del art. 4 de la
Directiva (UE) 2019/790 que ADR-009 apunta cubre **extraer y reproducir**, no
**reutilizar**. Publicar es otro acto y necesita su propia firma — **y ésta es
esa firma**, no una remisión a la anterior.

**Este ADR no relitiga la decisión de publicar. La ejecuta, y escribe las
condiciones bajo las cuales publicar es honesto en vez de sólo legal.**

### Cinco hechos del repositorio que deciden la forma, medidos el 2026-09-04

**1. `src/api/` no existe.** `CLAUDE.md` lo lista en la estructura y **ADR-026 §1**
lo nombra entre paréntesis al declarar el alcance del sistema de diseño. Es una
**previsión**, no un directorio: hoy todo lo HTTP vive bajo `src/app/`, y cada
ruta delega entera en un módulo de `src/<dominio>/`.

**2. No hay lectura en lote de decisiones, y la frontera de RN-08 impide
escribirla fuera de `src/decide/`.** Lo único que existe es
`readMatchDecisions({sql, matchId})` (`src/decide/read-entry.ts`, SPEC-017,
ratificado por `sdd-arquitecto` en su ledger). El tablero del panel hace **dos
consultas por partido**, lo cual es correcto para una pantalla que mira **una**
persona detrás de una sesión y que no se refresca sola. Una pantalla que se
recarga cada medio minuto no puede pagar `2 × partidos` consultas por vuelta. Y
la salida obvia —escribir la consulta en `src/db/`— **es roja**: nombrar
`PostgresDecisionStore`, `DecisionStore` o la tabla `decisions` fuera de
`DECISION_WRITERS` pone rojo el guardián de SPEC-013 CA-13.

**3. El panel eligió `route.ts` y no `page.tsx`, y sus cuatro motivos escritos
siguen valiendo aquí.** `src/app/globals.css` sólo se carga bajo un layout de
`(gl)`/`(es)`; ese layout sirve **claro por defecto** y **ADR-026 §3.6** hace
**oscuras** las interfaces que gobierna, ésta incluida; `next/font` no está
disponible en un manejador de ruta, y por eso el `@font-face` se escribe a mano
contra `public/fonts/`; y un manejador devuelve una `Response` cuyo cuerpo un
test puede afirmar **byte a byte**.

**4. `TYPE.display` está declarado y su cara no se carga.** `src/design/tokens.ts`
declara `display: {px:44, weight:800, family:'sans'}` y deja escrito el
compromiso: Vercel distribuye el peso **800 de Geist sólo en cursiva** como cara
estática, así que el 800 recto exige la **cara variable**, un fichero con todos
los pesos dentro. Es **F-SPEC-017-9**, con destino literal «la spec del
snapshot».

**5. `MEASUREMENT_WINDOWS` sigue vacía y `calendario/` todavía no existe.** El
tick no pide nada, no hay `Observation`, no hay `Decision` y el panel entrega un
tablero vacío. Y `sdd-competicion` añade la fecha: **la jornada 1 de Preferente
Futgal Grupo 1 es el domingo 6 de septiembre de 2026**, dentro de dos días, y el
calendario declarado no está escrito.

## Decisión

Se fijan **diez decisiones** (§1..§10) más lo que este ADR no decide (§11),
citables por número (`ADR-027 §N`).

### §1. Dos domicilios, porque son dos cosas: `src/api/` es el contrato y `src/board/` es la pantalla

**`src/api/` nace con esta decisión y contiene el snapshot**: la proyección pura,
el esquema `zod` de la carga útil, y el manejador de `GET /api/board`. Es el
nombre que `CLAUDE.md` y **ADR-026 §1** ya le habían reservado, y no se cambia.

**`src/board/` nace con esta decisión y contiene la pantalla**: el marcado, su
hoja de estilos, el guion de refresco y los dos manejadores de ruta. **No es un
directorio de conveniencia: es la frontera.** La pantalla **consume la proyección
y no tiene ningún acceso privilegiado a la base**; lo que importa de `src/api/`
es la proyección, exactamente la misma que sirve el JSON.

Meterlo todo en `src/api/` —como SPEC-017 metió su vista en `src/admin/view/`—
sería más corto y estaría peor: un directorio llamado `api` con marcado dentro
invita a que la pantalla se salte el contrato «porque está al lado», y el día que
entre SSE (ADR-003), o el marcador se publique, o exista un feed para un medio
comarcal, habrá **tres** consumidores del mismo dato. La separación es lo que
hace que ese día no haya nada que reescribir.

**Las rutas son finas y no tienen lógica**, como `src/app/api/cron/ingest/route.ts`
y las dos del panel:

```
src/app/api/board/route.ts       → GET, delega en src/api/handler.ts
src/app/(gl)/marcador/route.ts   → GET, delega en src/board/handler.ts  (galego)
src/app/(es)/es/marcador/route.ts→ GET, delega en src/board/handler.ts  (castellano)
```

**Manejadores de ruta, no `page.tsx`**, por los cuatro motivos del panel
(Contexto, hecho 3) y **por un quinto que es de esta spec**: la barrera de
contenido tiene que afirmar sobre **lo que se sirve**. `F-SPEC-004-7` describe el
agujero contrario —`pages.test.ts` afirma sobre `renderToStaticMarkup`, y «un
`metadata` con `openGraph`, un favicon remoto o un script en un layout futuro
entrarían sin poner nada rojo»—. Esta pantalla **lleva un guion**, así que sería
exactamente el caso que ese finding teme; servirla desde un manejador de ruta
hace que el test vea **el documento entero, byte a byte**, y el agujero no se
reintroduce. Las rutas nuevas se declaran en `ENTRY_POINTS` con su motivo
(SPEC-009).

**El nombre de la pantalla es *o marcador*, y lo dictamina `sdd-lingua`** con un
motivo que no es de gusto: el bot ya le promete al corresponsal que lo que
confirme «**sae no marcador**» (`gl.ts`, SPEC-015, `hecho`), y *resultado* es el
desenlace, no lo que pasa en el minuto 30. **`/marcador` y `/es/marcador`.**

**La dirección es `/marcador`, y la raíz NO se toca. Decidido por Alberto Fojo el
2026-09-04**, descartando explícitamente las dos alternativas que estaban sobre la
mesa: tomar `/` ahora, y dejar escrito un disparador para mudarse a `/` en el
go/no-go. **ADR-010 §5 queda intacto y `/` sigue redirigiendo a `/proxecto`.**

`sdd-lingua` §1.2 recomendaba la raíz con dos argumentos correctos —que
`marcador.gal/marcador` es una tautología, y que ADR-010 §5 ya había previsto que
quitar la redirección «sea una línea y no una discusión»—. **No se declaran
equivocados: se declaran superados por una decisión de producto sobre qué es hoy
este dominio.** Publicar una pantalla de medición no es lo mismo que declarar que
`marcador.gal` **es** el marcador, y la raíz es esa declaración.

**Consecuencia que se acepta y se escribe:** la dirección **entra en
`src/site/routes.ts`**, porque las direcciones del sitio viven en un solo sitio,
**y NO gana la promesa de permanencia de ADR-010 §5**, que cubre `/proxecto` y
`/robot` por un motivo que ésta no tiene —`/robot` viaja dentro del
`User-Agent`—. Que `/marcador` pueda moverse algún día es cierto y **no lleva
disparador escrito a propósito**: el gate descartó ponerle uno, y un disparador
que nadie ha decidido es peor que ninguno.

### §2. El snapshot es una proyección, y no deriva nada que derive el motor

**El snapshot no decide.** Es una función de los dos logs y del calendario a una
estructura serializable, y su regla es de una línea: **todo lo que la pantalla
enseña sale de una `Decision` escrita o del calendario declarado, y nada más.**

En concreto, y esto es lo que hay que leer despacio porque es donde una pantalla
rompe RN-08 sin querer:

1. **El cualificador sale de `qualifierOf`** (`src/decide/qualifier.ts`,
   ADR-021 §6), **nunca reimplementado**, como ya exige SPEC-017 CA-12.1.
2. **El snapshot NO envejece un dato.** Si la `Decision` vigente es `live` y su
   `decided_at` tiene cuarenta minutos, el snapshot dice `live` con su instante,
   **no** *sen sinal*. *Sen sinal* es un cualificador del dominio que **emite una
   `Decision`** (ADR-021 §6: «entrar en *sen sinal* emite `Decision`… nada llega
   al usuario sin pasar por el motor»), y una pantalla que lo dedujese por su
   cuenta estaría publicando un cualificador que **ninguna `Decision` sostiene**
   — que es lo que RN-08 y D-3 prohíben, sin la excepción que `reglas.md` se
   molesta en negarle al corresponsal. Y hay un motivo práctico además del de
   principio: el resultado dependería del reloj del navegador, así que **dos
   personas verían cualificadores distintos del mismo partido**.
3. **Consecuencia incómoda, y se acepta de frente:** fuera de una jornada
   declarada el motor no corre, así que **nadie escribe la `Decision` de RN-07** y
   un partido puede quedarse `live` para siempre en la última `Decision` del log.
   La respuesta correcta **no** es que la pantalla lo tape: es que la pantalla
   enseñe **cuándo fue el último dato** (§4) y que quien lo lea vea que es viejo.
   Tapar el hueco calculando sería mentir con mejor aspecto.
4. **El snapshot no escribe nada.** Ni `Decision`, ni `Observation`, ni
   `alert_acks`, ni `operator_actions`, ni una tabla de visitas. **No llama al
   motor**: no hay ninguna ruta desde `src/api/` ni desde `src/board/` a
   `runEngineForMatch`. **`DECISION_WRITERS` no crece**, y el caso de SPEC-013 que
   afirma que son exactamente dos entradas pasa sin tocar una aserción.
5. **Y no le pide nada a ningún tercero.** El grafo de las tres rutas nuevas **no
   alcanza `src/polite/http.ts`**, igual que el del panel (ADR-024 §1), así que
   **RN-11 no alcanza esta spec** — y conviene que esté escrito para que nadie lo
   lea al revés. Del lado del navegador, lo mismo: la página **no carga nada de
   ningún host que no sea el suyo** (ADR-026 §3.5), y su única petición de salida
   es a su propio `/api/board`.

   **Este punto tiene el peor modo de fallo disponible en esta spec, y lo nombra
   `sdd-legal-datos` §6.2.8:** una implementación que refrescase **bajo demanda**
   convertiría `N` lectores en `N` peticiones a la fuente y **reventaría RN-11 en
   el primer minuto**, sin que el número de la regla hubiera cambiado. La página
   lee **el snapshot ya persistido**; quien pide a un tercero sigue siendo el
   cron, a 1/minuto por competición.

**La lectura en lote vive dentro de `src/decide/`**, hermana de `read-entry.ts` y
con su forma exacta: recibe `sql` y una lista de `MatchId`, devuelve **valores
planos**, ningún almacén, se importa **por nombre**, y compone el repositorio
durable ella misma en vez de tomar prestado `composeCyclePorts`, que arrastraría
el fetcher de plataforma. Es el precedente que `engine-entry.ts` fijó para la
escritura y `read-entry.ts` para la lectura por partido; ésta es la tercera puerta
de la misma familia y **no ensancha ninguna capacidad**: devuelve lo mismo, para
más partidos y en menos viajes.

### §3. La pantalla no se publica, y lo que enseña es sólo la jornada de medición declarada

Son **dos** límites y no uno, y conviene no confundirlos: el primero dice **quién
puede abrirla**, el segundo dice **qué contiene**. Los dos se deciden aquí porque
protegen lo mismo por caminos distintos, y porque el día que caiga el primero el
segundo tiene que seguir en pie.

#### 3.a — La puerta: no hay. La pantalla es pública y no sabe nada de quien la abre

**`/marcador` y `/es/marcador` se sirven sin sesión, sin cookie y sin
autenticación de ninguna clase.** No hay formulario de acceso, no hay secreto
compartido, no hay `ADMIN_OPERATORS` y no hay nada del mecanismo de ADR-024 en el
camino de estas rutas — y **eso es una frontera, no una omisión**: si mañana
alguien mete una comprobación de sesión aquí para «proteger» algo, lo que ha hecho
es partir el producto en dos verdades.

**Y la ausencia de puerta tiene una consecuencia técnica que se decide aquí:
la respuesta no depende de quién pregunte.** No se lee cookie, ni
`Accept-Language`, ni ninguna cabecera de cliente; la lengua sale **de la URL**.
Por eso la respuesta **se puede compartir en una caché** (§7.3) sin filtrar nada
de nadie, y por eso **no hay nada que registrar sobre el visitante** (§4.5).

**Lo que se publica, dicho como lista para que nadie tenga que deducirlo:** los
partidos de una jornada de medición declarada (§3.b), con los campos de §10 y
ninguno más. **No** hay endpoint documentado, **no** hay CORS abierto, **no** hay
feed, **no** hay widget, **no** hay exportación y **no** hay API. `GET /api/board`
existe **porque la pantalla lo usa**, no como superficie ofrecida a terceros, y
esa distinción no es retórica: es la diferencia entre publicar una pantalla y
publicar unos datos. **Cero monetización** (D-7), que además es lo que mantiene
vivo el argumento de que esto no menoscaba la inversión de nadie.

**Indexación: `noindex, noarchive`, por cabecera `X-Robots-Tag` y por
`<meta name="robots">`, las dos. Sin `nofollow`.** El precedente de forma es el
panel (SPEC-017 CA-1.10); **el contenido lo fija el segundo dictamen**, que
modificó su propio V9 al saber que la pantalla sería pública. Los tres, uno a uno:

- **`noindex` se queda, y no es esconderse: es no competir.** La carta a la RFGF
  construye su gancho sobre una búsqueda concreta —«aparecen ocho agregadores
  privados y ninguna liga a futgal.es»—, y **el día que `marcador.gal/marcador`
  sea el noveno resultado de esa búsqueda, el argumento de la carta se vuelve
  contra quien la firmó**. Además, una pantalla que vive dos jornadas no tiene
  nada que hacer en un índice: las entradas sobreviven a la página y producirían
  resultados obsoletos sobre partidos ya jugados.
- **`nofollow` se retira, y en el dictamen anterior estaba.** En público le diría
  al rastreador que no siga los enlaces salientes de la pantalla — y los únicos
  que hay son `/robot` y `/proxecto`, precisamente la página que viaja dentro de
  nuestro `User-Agent` (ADR-011) y que queremos que un tercero alcance. Declararlo
  trabaja contra el proyecto y no protege nada.
- **`noarchive` se añade, y es un hueco que sólo aparece al publicar.** Una página
  pública **la archivan terceros**, y ese archivo sobrevive a nuestras dos
  jornadas y a nuestros 30 días de retención: la defensa de «acotada en el tiempo»
  es sobre *nuestra* publicación, no sobre la copia de otro. `noarchive` lo mitiga
  en los buscadores y **no es exigible frente al Internet Archive** — se dice así,
  y lo que de verdad lo acota es que lo archivable sea mínimo (§3.b, §10).

**Y `noindex` no es ocultación porque no va solo.** Solo, sería esconderse, y
leería fatal junto a la carta. Va con **tres cosas que lo compensan y son
obligatorias**: `/proxecto` y `/robot` **enlazan la pantalla** en las dos lenguas
(§3.c), los literales se corrigen para decir que existe (§3.c), y **la RFGF es
avisada** (§3.e). El resultado es una postura describible en una frase:
**descubrible por una persona, no amplificada por un buscador.**

**Y se escribe la advertencia, porque es donde alguien se engañaría dentro de seis
meses: `noindex` no es una defensa jurídica, es mitigación de descubrimiento.**
«Poner a disposición del público» (art. 7.2.b Dir. 96/9/CE) se cumple con una URL
pública, indexada o no. Nadie podrá alegar más adelante «no lo publicábamos,
estaba en `noindex`».

**`robots.txt` no gana ningún `Disallow`, y el motivo cambió y ahora es técnico.**
Bajo la salida (A) el argumento era que un `Disallow` confirma que la ruta existe;
con una pantalla deliberadamente pública eso ya no aplica. Los que quedan son
mejores:

1. **Un `Disallow: /marcador` derrotaría al `noindex`.** `Disallow` impide
   **rastrear**, y sin rastrear el buscador **nunca lee el `noindex`**: la URL
   puede seguir apareciendo como URL desnuda, alimentada por enlaces externos, y
   sin forma de retirarla. Las dos directivas juntas son **estrictamente peores
   que `noindex` sola**. Quien proponga «pues lo bloqueamos también en robots.txt»
   estará empeorando justo lo que quiere arreglar.
2. **`robots.txt` es el fichero con el que este proyecto le pide a otro que le
   deje pasar** — es literalmente el objeto de la carta a la RFGF, que pide dos
   líneas de él. Ensuciar el propio con exclusiones defensivas mientras se pide lo
   contrario es un mal negocio.

Además `tests/site/robots.test.ts` caso 3 **ya prohíbe** cualquier `Disallow`. Lo
único que cambia ahí es su **lista cerrada de rutas permitidas** (caso 4), que gana
la del marcador: es un censo, no una regla (§3.c).

**Y una superficie que la publicación deja expuesta, dicha sin adornos porque
llamarla privada sería el mismo error que llamar defensa a `noindex`:
`GET /api/board` es un endpoint JSON público, y cualquiera con las herramientas
del navegador puede leerlo.** Existe **porque la pantalla lo usa**, no como
superficie ofrecida a terceros, y esa distinción se sostiene con cuatro cosas
comprobables, no con una intención: **nunca emite ninguna cabecera CORS**, lleva
el mismo `X-Robots-Tag` que el documento, **no se documenta en ningún sitio** —ni
en `/robot`, ni en `/proxecto`, ni con un enlace— y sirve **exactamente** la lista
cerrada de §10, ni un campo más. `sdd-legal-datos` recomendaba en su lugar que el
refresco devolviese **fragmento HTML**, con lo que la condición sería literalmente
cierta en vez de sostenida; **no se toma, y el motivo está en §11**.

#### 3.b — La apertura: sólo los partidos de una jornada de medición declarada

**El snapshot sirve exactamente los partidos cuyo `kickoff` cae dentro de una
jornada de medición declarada** (`MEASUREMENT_WINDOWS`, ADR-019 §3). Ni uno más.
Con la lista vacía, la carga útil es una lista vacía y la pantalla lo dice.

Es la misma llave que ADR-024 §9 le puso al panel, y aquí hace **dos** trabajos
más que allí:

- **Ancla la retención en un solo sitio.** Lo que la pantalla enseña cuelga de la
  misma jornada de la que cuelga el archivo (ADR-020 §2). No hay un segundo
  calendario de caducidad que alguien tenga que comparar con el primero.
- **Y es la propiedad que hace posible publicar algún día.** El límite de
  `sdd-legal-datos` §1.3 no separa «un resultado» de «una jornada» de «una
  temporada» como tamaños de pantalla: separa **una ventana acotada y declarada**
  de **una publicación continua**, que es el supuesto del art. 7.5 de la Directiva
  96/9/CE. Con esta llave, lo que se sirve **no puede** ser continuo, y no por
  promesa de conducta —«publicaremos poco»— sino porque es una **lista cerrada,
  versionada, con un motivo por entrada, que nace vacía** y cuyo crecimiento es un
  diff revisado. Es el argumento que ADR-008 §5.2 usó para la captura, ejercido en
  la salida.

**El calendario declarado no ensancha la apertura.** Un partido cargado en
`matches` cuya jornada nadie declaró **no aparece**, aunque exista, aunque tenga
`Observation` y aunque el operador pueda corregirlo desde el panel. El panel puede
mirar más que esta pantalla a propósito: es una herramienta, no una vista del
producto.

**Y la apertura se acota por los dos lados, no por uno.** `MEASUREMENT_WINDOWS`
acota **cuándo**; una lista cerrada nueva, `PUBLISHED_COMPETITIONS`, acota
**qué**: exactamente `preferente-futgal-grupo-1` y `terceira-rfef-grupo-1`, con su
motivo escrito por entrada (la forma de `ALLOWED_PACKAGES`, ADR-016 §3.2). Sin
ella, cargar el calendario de una tercera competición la publicaría **sin que
nadie tomase ninguna decisión**. Y **ninguna ruta acepta una fecha, una jornada ni
un identificador arbitrarios**: lo alcanzable desde fuera es **igual** a lo
declarado, y una petición por una jornada no declarada responde `404` con cero
lecturas de la base.

**Ésta es también la parada de emergencia, y conviene que esté escrito porque el
día que haga falta nadie va a leer un ADR:** si ZOS, Lda. o la RFGF piden que se
pare, **parar es vaciar `MEASUREMENT_WINDOWS`**. La pantalla sirve entonces lista
vacía con cero consultas, y no hay que tocar una línea de lógica. **Se para
primero y se dictamina después**, que es lo que `/robot` promete al rastreo — y la
publicación no puede prometer menos que la captura.

#### 3.c — Lo que hay que corregir en el mismo cambio, y por qué no es un follow-up

**Tres afirmaciones publicadas dejan de ser ciertas el día que esta pantalla
exista, y se corrigen en el mismo cambio, por ADR-015, en el ledger de la spec que
las escribió.** No en una spec de limpieza posterior: **cualquier ventana entre las
dos cosas es una ventana en la que el proyecto publica un marcador mientras jura
en la página que un tercero audita que no lo publica.**

| Qué | Dónde | Deja de afirmar | Enmienda |
|---|---|---|---|
| `site.noProduct` | `/proxecto` | que no hay marcador público | **SPEC-004** |
| `site.measuring` | `/proxecto` | «a medición aínda non comezou» — **ya era falsa** desde SPEC-012/013/017 | **SPEC-004** |
| `crawler.noRepublish` | `/robot` | «non republicamos os datos de ninguén», «o resultado é un informe interno», «non hai marcador público» | **SPEC-005** |

**Y una cuarta cosa, que no es una afirmación sino una barrera que deja de
cubrir:** `tests/site/identity.test.ts` fija **exactamente tres espacios de
nombres y cuatro rutas**, así que **no se pone rojo** cuando aparece un quinto
sitio con texto visible — **deja de vigilarlo en silencio**, que es peor.
Enmienda: **SPEC-007**.

**Qué se puede seguir prometiendo en `/robot`, que es más de lo que parece y más
auditable que lo que se retira**: que **no hay redistribución en bloque** —ni
fichero, ni volcado, ni feed, ni API, ni widget, ni exportación—, que **no hay
histórico** navegable, que son **dos competiciones y sólo las jornadas
declaradas**, que por partido salen **cuatro cosas y ninguna más**, que **no hay
ni un dato personal**, que **no hay monetización**, y que **la retención no se
mueve**. Cualquiera puede abrir la pantalla y verificarlo en diez segundos, que es
más de lo que se podía hacer con «non republicamos».

**Y la promesa de parar se ensancha, que es la adición más importante del cambio
en `/robot`:** «abonda con pedilo» cubría el **rastreo**; pasa a cubrir también
**la publicación**. La publicación no puede prometer menos que la captura.

**Lo que NO vale, y el dictamen lo cierra dos veces:** matizar la frase para que el
test siga verde. Ni «non republicamos… salvo unha pantalla de medición», ni
reinterpretarla sobre datos personales —que sería literalmente cierto y sería
peor—. **La frase se va; la promesa se reconstruye.**

**Y hay una cosa que no se arregla editando nada.** La **carta**, enviada el
2026-09-01, dice «Non republico os seus datos» y «aínda sen publicar». Una carta
enviada no se enmienda: el destinatario ya tiene el texto, y editar
`docs/negocio/carta-rfgf-acceso.md` no pondría rojo nada y tampoco arreglaría
nada. Lo único que la repara es §3.e.

#### 3.d — Qué reabre esto: el disparador de re-dictamen, y el punto que nadie puede vigilar

La publicación se firma **acotada**. Cualquiera de estas ocho cosas **reabre el
dictamen** y no se sirve una petición más hasta que `sdd-legal-datos` vuelva a
dictaminar y el gate firme:

1. una **tercera jornada** de medición, o que la publicación se vuelva continua;
2. una **competición** fuera de `PUBLISHED_COMPETITIONS`;
3. **cualquier dato nuevo** — clasificación, goleadores, alineaciones, árbitros,
   entrenadores, minuto a minuto, estadísticas;
4. **amplificación**: que la pantalla deje de ser `noindex` (4.a), que aparezca en
   `robots.txt` (4.b), que aparezca un **enlace entrante externo** (4.c), o que la
   pantalla **se mueva a `/`** (4.e). **Enlazarla desde `/proxecto` y `/robot` NO
   dispara: es obligatorio** (§3.c) — y decirlo importa, porque el disparador
   anterior lo listaba como amplificación y cumplir la obligación lo habría
   disparado el primer día;
5. **acceso programático ofrecido a un tercero**: documentación, CORS, feed,
   widget, exportación o API;
6. **cualquier monetización** (D-7): publicidad, patrocinio, muro de pago,
   afiliación, o usar esta pantalla para vender servicios del paraguas;
7. **que deje de ser el operador y su entorno quien la abre** — ver abajo;
8. **que el aviso de degradación deje de ser cierto**: una segunda fuente
   automática, o que `futgal.es` pase a ser capturable.

**Y el punto 7 no se sostenía como estaba escrito, así que se sustituye.** Decía
«más de 100 visitantes distintos», y **con §4.5 nadie puede observar eso**: no hay
analítica y no la va a haber. Un disparador que nadie puede observar es peor que
ninguno, porque hace creer que algo vigila. La sustitución **no añade ni un byte a
la página**:

- **cargas del documento** `/marcador` y `/es/marcador` en un día, leídas de los
  registros que la plataforma ya produce — se cuenta **el documento y no la ruta
  de refresco**, que a un poll por minuto inflaría el número unas noventa veces
  por lector y hora. El umbral de 100 se conserva, en cargas;
- **la primera aparición de un `Referer` que no sea este origen**, que es el
  indicador que de verdad importa y es gratis: un enlace de un medio, un club o la
  federación **es** el momento en que esto dejó de ser el operador y su entorno;
- **y lo que se declara no vigilable, sin eufemismos: no sabemos ni sabremos quién
  abre esta pantalla, cuánto se queda ni si vuelve.** No hay analítica, no la
  habrá, y esa ausencia **es una decisión, no una carencia**.

**Queda prohibido cualquier mecanismo de audiencia en la página, y con nombre
propio porque es la respuesta de un clic: `@vercel/analytics` no entra.** Inyecta
un guion, convierte la IP de cada visitante en una cesión a un tercero, y pondría
rojo el caso de §2.5 — que es exactamente para lo que ese caso está.

**Y un disparador que no es de esta pantalla y que hay que dejar escrito aquí
porque ADR-012 es inmutable y no admite añadidos:** **el día que exista cualquier
contraprestación sobre esta pantalla, el art. 10 LSSI pasa a aplicar y ADR-012 §1
cede en lo relativo a identificar al prestador.** Ese día se escribe un ADR que lo
sustituya, y **se pide revisión profesional antes de monetizar, no después**. Lo
que hoy mantiene eso lejos es comprobable y barato: **la pantalla no lleva ninguna
llamada a la acción** —ni alta, ni lista de espera, ni boletín, ni formulario— y
sus únicos enlaces salientes son `/robot`, `/proxecto` y el buzón.

#### 3.e — Lo que sólo puede hacer una persona, y ningún criterio puede dar por cumplido

**No se despliega antes del 2026-09-08, y no antes de que la RFGF haya sido
avisada — lo que ocurra más tarde de los dos.** El 08 es la fecha en que la carta
se da por no contestada (`docs/roadmap.md`, decisión del 2026-09-01). Bajo la
salida (A) esa fecha era un motivo para no publicar; aquí es una condición de
**secuencia**: no poner la pantalla delante de la federación en la misma semana en
que se le pide algo diciéndole que no publicamos nada.

**Y el aviso a la RFGF no es un segundo correo de los que la regla por defecto
prohíbe.** `calendario-de-compromisos.md` dice que no se insiste mientras Alberto
Fojo no se pronuncie, y eso sigue en pie: lo prohibido es **un recordatorio**. Este
aviso **no pide nada**: corrige una afirmación que se les hizo por escrito, y se
les debe conteste o no conteste. Va sin ninguna petición nueva, sin repetir la
anterior y sin plazo — **si pide algo, se convierte en el correo que la regla
prohíbe**.

**Hay además una ordenación de tres días que conviene no descubrir sobre la
marcha**, porque una de las fechas decide el contenido de la otra: el **06** se
verifica `lapreferente.com` (fila 1 del calendario de compromisos), el **07** se
ajusta el aviso de degradación y el número que declara si esa verificación cambió
el hecho, y el **08** se despliega. En ese orden.

**Y la respuesta de la federación, si llega, hay que saber clasificarla**, porque
llegará en un párrafo de prosa: **«no nos rastreéis» no detiene la publicación**
—no se les rastrea y no se les iba a rastrear—; **cualquier frase sobre la
publicación misma sí la detiene**, y entonces se para primero y se dictamina
después (§3.b). **En la duda, se para.**

**Nada de este apartado lo sostiene un test, y no se finge que lo haga.** Su sitio
es `docs/procedimientos/calendario-de-compromisos.md`, que existe exactamente
porque el proyecto **no tiene CI** y «nadie va a enterarse en rojo de que se pasó
un plazo».

### §4. Tres relojes, y no se confunden nunca

Ésta es la mitad del ADR que no existía en ninguna otra pantalla, y es donde una
interfaz de directo miente sin querer. En una pantalla que se refresca sola hay
**tres** instantes distintos y los tres se llaman en la conversación «la última
actualización»:

| Reloj | Qué es | De dónde sale | Quién lo mueve |
|---|---|---|---|
| **El dato** | Cuándo se publicó lo que se está viendo | `Decision.decided_at` | El motor, y sólo él (RN-08) |
| **La fuente** | Cuándo lo dijo por última vez quien lo dijo | el `observed_at` más reciente de las observaciones de apoyo | La ingesta, el bot o el panel |
| **El transporte** | Cuándo consiguió el navegador su última respuesta | el propio navegador | La red de quien mira |

**Decisión, y es un invariante de toda interfaz de este proyecto, no sólo de
ésta:**

1. **Los tres se enseñan por separado y con etiqueta distinta.** Ninguno se
   presenta como «actualizado» a secas. **La fila lleva el reloj de la fuente**,
   rotulado *Último dato* —es el que dice si hay que creerse ese 1-0, y es sobre
   el que se mide RN-07—; **la página lleva el reloj del transporte**, fuera de la
   tabla; y **el reloj del dato viaja en el snapshot** y se resume una vez por
   página como la última publicación del conjunto (§7.1).

   **Y el de la fila se publica como edad redondeada a minutos, nunca como
   instante absoluto con precisión de segundo.** `sdd-legal-datos` rectificó aquí
   su propia tabla —había puesto `decided_at`— y confirmó que `last_observed_at`
   es la elección correcta **y también la segura**: `observed_at` es **nuestro**
   reloj, no el de la fuente, y nuestra cadencia ya está publicada por RN-11 y por
   `/robot`, así que no hay primera divulgación de nada. Lo que sí sería un
   residuo es un **log público, partido a partido y al segundo, de cuándo
   pedimos**; redondear al minuto lo cierra sin quitarle nada al lector. Y
   `decided_at` en la fila sería además **engañoso**: el motor no emite `Decision`
   por tick, así que no distingue «no ha pasado nada» de «nadie ha mirado».
2. **El fallo del transporte NUNCA se pinta como un cualificador ni como un
   estado.** Que el navegador no consiga refrescar **no** es *sen sinal*, no es
   `postponed` y no es «el partido paró»: es que **esta pantalla** está vieja. Se
   dice con sus propias palabras y en su propio sitio, y **jamás con los tokens de
   estado ni con los de cualificador** —ni `--accent-live`, ni `--amber`, ni
   `--alert`, que ya significan otra cosa (ADR-013 §1, regla general)—.
3. **Y al revés: *sen sinal* nunca se enseña como un problema de la pantalla.** Es
   un hecho del partido, escrito por el motor bajo RN-07, y quien lo lee tiene que
   poder distinguirlo de su propia cobertura. Es **D-8** —«legible con mala
   cobertura»— llevado a su consecuencia menos obvia: en un campo con mala
   cobertura, **lo primero que hay que saber es de quién es el silencio**.
4. **La separación se sostiene con una barrera léxica, no con buena voluntad.**
   Es de `sdd-lingua` §3.1 y es comprobable: las palabras *sinal* / *señal* no
   aparecen en **ninguna** clave del espacio de nombres del marcador —viven sólo
   en `qualifiers`—, y *actualizar* / *actualizado* no aparecen en `qualifiers`.
   Dos ausencias, seis líneas de test, y una clase entera de error cerrada. Y
   **queda prohibido diagnosticar de quién es la culpa** —nada de «comproba a túa
   conexión»—: el sistema no sabe si el fallo es del móvil, de la red o del
   servidor, y señalar al móvil de quien mira es exactamente lo que le empuja a
   confundirlo con *sen sinal*.
5. **El reloj del transporte no se guarda en ninguna parte.** Vive en la pestaña
   de quien mira y muere con ella. No hay tabla de visitas, ni cookie propia de la
   pantalla, ni almacenamiento local: **la pantalla no sabe nada de quien la
   abre**, que es lo que ya afirma SPEC-004 CA-10 del sitio público.

### §5. La primera pintura es el dato; el refresco es una mejora que puede faltar

**El servidor sirve el tablero ya pintado.** No hay esqueleto de carga, no hay
«cargando…», no hay pantalla vacía que se rellena: el primer byte que llega al
navegador ya trae los partidos, los marcadores, los estados y los cualificadores.
**El guion sólo refresca**, y si no corre —JavaScript apagado, guion que no llega,
navegador viejo— **la página sigue siendo correcta**: enseña un dato bueno con su
instante al lado, en vez de un dato fresco que no llegó.

Esto **contesta la entrada 4 del inventario de EPIC-004** —«faltan estados de
carga y de dato viejo»—, que ADR-026 §6 dejó anotada como «a punto de dispararse:
su disparador escrito era la primera spec de `src/api/`, y ésa es la del
snapshot». La contesta así:

- **El estado de carga no se diseña porque no existe.** La forma correcta de no
  tener un esqueleto que parpadea no es dibujarlo bien: es servir el dato.
- **El estado de dato viejo sí existe, y son dos, no uno**: el de la fila (reloj
  de la fuente, §4.1) y el de la página (reloj del transporte). Los dos son
  **texto con su etiqueta**, con tokens neutros, y **ninguno cambia un valor de la
  tabla**. Una pantalla vieja enseña lo último que supo, sin borrarlo y sin
  atenuarlo: atenuar el marcador porque la red falla sería apagar un dato por un
  motivo que no es del dato (ADR-013 §6).

**Y una consecuencia que se acepta:** en la primera pintura el reloj del
transporte es el de la propia respuesta, así que **una página servida desde caché
puede nacer vieja**. Por eso el instante de la fila sale del servidor y no del
navegador (§4.1).

### §6. La fila sin `Decision`: el calendario declarado no es una publicación

Un partido de una jornada declarada sobre el que **todavía no hay ninguna
`Decision`** —el caso normal antes del primer tick— **aparece en la pantalla**,
con su hora, su competición y los dos nombres canónicos, **sin marcador y sin
cualificador**, y con una etiqueta que dice que **aún no hay marcador publicado**.

Se decide así, y no dejándolo fuera, por tres motivos:

1. **La lista de partidos es el denominador de la cobertura** (`_epica.md` de
   EPIC-002) y es una **declaración humana**, no un dato de nadie (ADR-017): es lo
   único de esta pantalla que no procede de una fuente. Enseñarla no publica
   ningún marcador. Y `sdd-legal-datos` §1.4 lo señala como **la mejor pieza
   defensiva que tiene el proyecto** el día que publique: la selección, el orden y
   los nombres son nuestros, y lo que se toma de un tercero se reduce a **un campo
   volátil por partido**.
2. **Una lista que sólo tiene los partidos que ya dieron señal esconde
   precisamente lo que la segunda cifra mide.** Un partido que no aparece porque
   nadie lo vio es exactamente el fallo de cobertura, y una pantalla que lo oculta
   lo hace invisible en el sitio donde más se mira.
3. **La ausencia de dato no es un cualificador.** Los cuatro de `dominio.md`
   califican **una `Decision` publicada**; aquí no hay ninguna. Se dice con su
   propio literal —*Sen marcador publicado*, y **nunca «sen datos»**, que comparte
   molde con *sen sinal* y reintroduce la confusión que §4 cierra— y **nunca** con
   los tokens de aviso, que ya significan otra cosa.

**Y hay un caso que se distingue del anterior y que la pantalla no puede
confundir con él** (`sdd-competicion` §5): «no hay partidos» y «no se declaró
ningún partido» son cosas distintas. La primera es información; la segunda es un
fallo operativo del que sólo se entera quien mira. **La pantalla las dice
distinto.**

### §7. Caché, versión y ETag — y la latencia se mide sobre `decided_at`, jamás sobre la pantalla

ADR-003 dejó el boceto: «snapshot JSON cacheable… estado completo con `version`
global, cacheable en CDN 10 s… fallback a polling del snapshot cada 30 s con
ETag». **Este ADR lo aterriza y no lo supersede.** Lo que concreta:

1. **La `version` global es derivada, no una columna.** Es el `decided_at` más
   reciente del conjunto servido, o `null` si el conjunto no tiene ninguna
   `Decision`. No se inventa un contador global: un contador es estado durable
   compartido, ADR-004 no lo da y ADR-021 §2 lo evita a propósito. **La `version`
   de `Decision` sigue siendo por partido y no se toca** (SPEC-001).
2. **El `ETag` es una función del cuerpo servido**, no del reloj: dos respuestas
   con el mismo contenido tienen el mismo `ETag` aunque se generen con un minuto
   de diferencia. Es lo que hace que un cliente que refresca cada 30 s pague `304`
   casi siempre.
3. **La caché es corta, compartida y su número vive como constante nombrada en un
   solo sitio**, como `PRE`/`POST` (ADR-019 §2), `TOUCH_TARGET_PX` (ADR-025 §3) y
   las 6 h de ADR-014 §3.2: **elegido, no medido**, y revisable con la primera
   jornada delante. Compartida —`s-maxage` en el CDN, que es lo que ADR-003 ya
   dibujó— porque **ahora sí hay más de un lector**, y sin ella `N` navegadores
   refrescando cada medio minuto son `N` proyecciones por medio minuto contra una
   base que a la vez está ingiriendo. **La respuesta no depende de quién pida**
   (§4.5), así que compartirla no filtra nada de nadie.
4. **Y la regla que protege la primera cifra: la latencia se mide sobre
   `decided_at`.** «Publicado» es `Decision` escrita (RN-08), y **el intervalo de
   refresco de esta pantalla y su caché no son parte de esa definición**. Quien
   verifique a cronómetro los 10 partidos que la épica exige compara **el gol real
   contra ese instante**, que está en el snapshot, **no contra el momento en que
   lo vio aparecer en la pantalla**.

   **Dicho al revés, porque es la trampa:** medir «cuándo apareció en mi móvil» es
   medir `latencia de la fuente + tick + motor + caché + intervalo de refresco + su
   cobertura`, y publicar eso como «latencia». La pantalla existe para **poder
   mirar**; el instrumento sigue siendo la base.

### §8. Cómo se enseña el cualificador, y la decisión que ninguna paleta puede sustituir

ADR-026 §2 cerró lo duro —**ninguno de los dos se apaga**, los dos con el color de
texto principal, los dos con etiqueta, `confirmado` sin el acento de marca— y
dejó escrito lo que faltaba: «cómo se ve exactamente la etiqueta, dónde va, y si
`confirmado` lleva además una marca. Eso es de la spec que dibuje cada pantalla».
SPEC-017 CA-12.4 lo reenvió aquí. Se decide **en el ADR y no sólo en la spec**
porque vale para la pantalla del marcador entera, no para una versión suya.

1. **El cualificador es una etiqueta de texto en la fila, con el literal completo
   de `dominio.md` en la lengua de la URL.** Nunca un glifo, nunca una
   abreviatura, nunca un color solo (ADR-026 §4.1 y §4.2, ADR-013 §2). **Y no se
   abrevia aunque no quepa**, que es el dictamen de `sdd-lingua` §4.1 con el
   argumento de ADR-026 §4.3: `P. CONF.` no está en el glosario, no es
   autoexplicativo y no es traducible — cambiar un signo ilegible por unas letras
   ilegibles es el mismo defecto en alfabeto latino. Si no cabe, **crece la fila**.
2. **`confirmado` no lleva ninguna marca adicional.** Se contesta la pregunta que
   ADR-026 §2 dejó abierta, y se contesta que **no**: una marca extra en
   `confirmado` es la forma elegante de volver a decir que lo confirmado es lo
   bueno y lo demás lo dudoso, que es justo lo que §2 corrigió. Los dos llevan la
   misma clase de etiqueta, en el mismo sitio y con el mismo peso; lo único que
   cambia es la palabra.
3. **Estado y cualificador nunca quedan pegados sin nada entre ellos.** Es un
   riesgo que sólo aparece al juntarlos y que `sdd-lingua` §4.2 y §4.3 detectan:
   los dos son participios —«Rematado Confirmado», «Aprazado Provisional»— y se
   leen como un sintagma. O van en columnas con cabecera propia, o cada uno lleva
   su rótulo. Y **`Rematado` nunca aparece como frase suelta**, que es lo que
   `dominio.md` exige desde el 2026-09-02 porque *rematar* significa dos cosas en
   fútbol.
4. **Y la decisión que ninguna paleta puede sustituir: la pantalla no ordena, no
   agrupa y no filtra por cualificador ni por estado.** Las filas van **por
   competición y, dentro, por hora de inicio ascendente**, con desempate total y
   determinista por `match_id` para que dos renderizados del mismo dato no ordenen
   distinto. Ésta es la respuesta de verdad a la entrada 1 del inventario de
   EPIC-004: **el fallo que esa entrada temía no era de color, era de jerarquía**
   —«no se arregla cambiando un color: cambia cuál es la fila por defecto»—, y una
   pantalla que no jerarquiza por cualificador no puede destacar el caso raro ni
   apagar el dominante **aunque alguien cambie los tokens después**.
5. **Se aparta del panel a propósito, y el motivo está escrito.** SPEC-017 CA-12.3
   ordena su tablero por lo que necesita a una persona —alerta abierta, *sen
   sinal*, `live`, el resto— porque **es una cola de trabajo**. Esto no lo es: es
   una jornada. Y hay un motivo de uso además del de principio, que aporta
   `sdd-competicion` §3: si un partido sube al empezar y baja al acabar, **quien
   mira pierde de vista el suyo justo cuando más lo mira**. El orden es estable
   toda la tarde; lo que cambia es el contenido de la fila, no su posición.

### §9. `descanso` no es un estado, y `suspended` se enseña con su marcador y con su reserva

**Contesta ADR-026 §7 en sus dos mitades**, que dejó las dos con destino
`sdd-arquitecto` y `sdd-competicion` y disparador «la spec del snapshot». El
dictamen de `sdd-competicion` del 2026-09-04 las resuelve y este ADR las fija.

**9.1 — `descanso` NO entra como sexto estado.** El intervalo entre las dos partes
(Regla 7 IFAB, ≤ 15 min) es un momento **dentro de `live`**: un partido en el
descanso está *En xogo*. `MATCH_STATUSES` sigue teniendo **cinco** valores, RN-06
no gana ninguna transición, `migrations/0001` no se toca y **ninguna spec cerrada
necesita enmienda**. Cuatro motivos, cada uno suficiente: no es un estado en el
modelo de la competición; RN-06 es una tabla cerrada y no tiene sitio para él —
habría que decidir quién puede provocarlo y qué le pasa al timeout de
`kickoff + 110 min`—; el coste cae sobre SPEC-001, SPEC-008 y SPEC-013, las tres
`hecho`; y el `DESC` que dibuja `docs/diseno/` **no es evidencia de dominio** sino
una invención del canvas sobre datos que su propio `canvas.json` declara
inventados (ADR-026 §4.3 ya lo trata como desviación).

**Lo que la fuente escriba como «Descanso» se lee como `live`**, que es lo que
`CEROACERO_SHAPE.statusWords` **ya hace** desde SPEC-008. Ese mapeo es correcto y
esta spec no lo toca. Y si algún día se quiere enseñar el descanso, **la vía es un
cualificador derivado, no un estado** —la forma de *pendente de confirmar* y *sen
sinal*, ADR-021 §6—, que hoy no se puede derivar porque el modelo no guarda ni
minuto ni periodo.

**`dominio.md` gana una entrada de resolución** —no un estado— para que la
pregunta no vuelva. La escribe `sdd-arquitecto` **antes** de que SPEC-018 la use,
como exige la cabecera del propio glosario.

**9.2 — El minuto de juego no se enseña, y el motivo es de dominio antes que de
coste.** En Preferente Futgal y en Terceira RFEF **no hay cronómetro oficial
publicado**: el minuto de un agregador se calcula desde *su* estimación del
inicio, y en estas categorías el kickoff real se retrasa, el añadido lo decide el
árbitro y no se publica, y el descanso dura lo que dura. **Un minuto que se desvía
sin que nadie pueda detectarlo, puesto al lado de un marcador, contamina el
marcador** — es lo contrario de D-6, y es RN-03 con el signo cambiado. Lo que se
pierde es real —no se distingue un 1-0 del minuto 5 de uno del 85— y lo que lo
compensa es honesto: el reloj de la fuente de §4.1.

**9.3 — `suspended` se enseña con su marcador parcial y con la reserva de que no
es el resultado.** Un suspendido **empezó** —esa es la diferencia con
`postponed`— y `migrations/0001` **obliga** a que lleve marcador. Ocultarlo
contradiría el `CHECK` que lo exige. Pero tras una suspensión decide el Comité de
Competición —reanudación, repetición o resultado del momento, y puede tardar
días—, así que **«Suspendido 1-0» a secas se lee como resultado y no lo es**. La
fila lo dice. El literal exacto de esa reserva lo emite `sdd-lingua`, que no lo
inventa este ADR.

**9.4 — Un `postponed` se queda en la lista, en su sitio, sin marcador.**
Desaparecer es indistinguible de un fallo de carga, y quien busca su partido tiene
que encontrar la respuesta —«no se juega»— donde lo busca. No se manda al final,
porque mover la fila la esconde y rompe la estabilidad de §8.4. Y `migrations/0001`
ya prohíbe que lleve marcador: un aplazado no tiene 0-0, no tiene nada.

**9.5 — Y el peor fallo posible de esta pantalla queda nombrado, porque su
mitigación es una decisión de presentación.** Hoy **ninguna fuente automática
puede aplazar un partido** (RN-06, y la oficial no es capturable, ADR-008 §1), así
que un partido aplazado por lluvia se queda `scheduled`, entra en ventana a su
hora, no llega ninguna observación de juego y a `kickoff + 110 min` **RN-06 lo
cierra a `finished`** — es decir, **la pantalla enseñaría «Rematado 0-0» de un
partido que no se jugó**, y en noviembre eso son cuatro o cinco filas a la vez.
**La mitigación existe y ya está en el modelo:** ese `finished` es exactamente
*pendente de confirmar* (ADR-021 §6: `finished` sin ninguna observación de apoyo
que lo cierre), y ADR-026 §2.4 obliga a mostrarlo con etiqueta de texto. **Un
`Rematado 0-0` marcado *Pendente de confirmar* y con «último dato hai 3 h» es
honesto; el mismo sin esas dos cosas es mentira.** Que las dos estén presentes en
la misma fila **no es decoración: es lo que impide publicar un resultado falso.**

### §10. La proyección es un tipo propio, y lo que no está en ella no sale

**Lo que la pantalla y el JSON sirven es una proyección construida a propósito,
nunca el `Decision` canónico.** Es dictamen vinculante de `sdd-legal-datos` §4.1,
y con la publicación decidida **deja de ser una precaución y pasa a ser la
frontera**: lo que entre aquí lo lee cualquiera, para siempre y sin poder
retirarlo.

El camino fácil lo pisa: `read-entry.ts` devuelve `Decision`, «el modelo canónico
que el frontend ya recibe», y servirlo tal cual filtra tres cosas que no son del
lector:

- **`rule`**, que es elocuente: `RN-01` dice «el operador impuso su precedencia»,
  `RN-04` dice «se bajó un marcador», `RN-02` dice «dos fuentes independientes
  coincidieron» — que tras ADR-008 §1 es información sobre la arquitectura de
  fuentes por sí sola;
- **`supporting_observation_ids`**, cuyos ids son opacos pero **cuya cardinalidad
  no lo es**: dos ids en una fila dicen «hay dos fuentes» sin nombrar ninguna;
- **`version`**, que es el número de rectificaciones de ese partido.

Y hay uno más, terminante: **`raw_ref` no sale nunca, en ningún formato**. La
clave del raw store lleva **el nombre de la fuente dentro de la cadena**
(ADR-009), así que publicar un `raw_ref` es publicar la fuente aunque nadie lo
pretenda — ni en HTML, ni en JSON, ni en un atributo, ni en un comentario.

**Decisión:**

1. **La proyección es una lista cerrada de campos, con un motivo por entrada**, en
   la forma de ADR-016 §3.2. Hoy: competición, jornada, `kickoff`, nombres
   canónicos de los dos equipos, `status`, marcador, cualificador y el instante
   del último dato.
2. **Un test se pone rojo si un campo de `Decision` o de `Observation` que no esté
   en esa lista aparece en el cuerpo servido.** Sin ese test es una convención, y
   las convenciones no sobreviven a la spec siguiente.
3. **Fuera, además de los cuatro de arriba: `confidence` y el nombre de cualquier
   fuente** —publicar «0.7» es publicar la naturaleza de la fuente sin nombrarla—;
   **`operator_id` y `correspondent_id`**, que son seudónimos y **la
   seudonimización no saca un dato del RGPD** mientras exista la clave de
   reidentificación, que el proyecto tiene (ADR-022 §2, ADR-023); y **las alertas
   y los conflictos**, porque **RN-05 dice literalmente que el conflicto no se
   publica** y la bandeja es del panel. *Sen sinal* sí sale — pero como
   cualificador del partido, jamás como «la fuente X lleva quince minutos
   callada».
4. **Y la traza de RN-12 no se enseña, ni aquí ni el día que se publique.** D-6
   dice que cada `Decision` **registra** su regla y sus apoyos, y que un marcador
   publicado **sabe** de dónde viene: **el sujeto de «sabe» es el sistema, y el
   verbo es «registra», no «muestra»**. La trazabilidad ya está cumplida por el
   log, por los `CHECK` de `migrations/0001` y por el tipo de
   `SupportingObservationIdsSchema`. Su audiencia declarada son dos y las dos
   autenticadas: **el operador**, porque RN-01 le exige arbitrar «con el contexto
   de todas las fuentes y del histórico delante» —para eso existe `read-entry.ts`
   y lo consume el panel—, y **el verificador**, contra el ledger.

### §11. Lo que este ADR no decide

- **Si el marcador se publica.** Ya está decidido y no es de este ADR: lo decidió
  **Alberto Fojo el 2026-09-04**. Lo que este ADR decide es **bajo qué condiciones**
  (§3), y esas condiciones **no incluyen ampliar el alcance de la publicación**:
  una tercera jornada, una competición más, un dato más o un acceso programático
  **reabren el dictamen** (§3.d).
- **Mudar la pantalla a `/`.** Descartado en el gate del 2026-09-04, **y sin
  disparador escrito a propósito**: el gate rechazó tanto tomar la raíz como
  dejar puesto un disparador para hacerlo. ADR-010 §5 sigue diciendo lo que dice y
  quien quiera moverla necesita una decisión nueva, no una condición cumplida.
- **SSE.** Sigue fuera por decisión de la épica, y ADR-003 lo previó: «ninguna
  métrica la necesita». Lo que este ADR hace es dejar el contrato en un sitio
  (`src/api/`) desde el que un segundo transporte no obliga a reescribir la
  proyección. **Disparador sin cambios: la épica de producto.**
- **La interfaz definitiva del marcador.** Sigue congelada en **EPIC-004**, y este
  ADR **no la descongela**: las entradas 2 (tabla de clasificación), 3 (foco y
  teclado **sobre el artefacto**), 5 (componentes de formulario) y 6 (tema claro)
  siguen abiertas con sus disparadores. Se cierra la **4**, y sólo para el
  producto (§5).
- **La migración del sitio público al sistema de diseño.** ADR-026 §1 le puso
  dueño y disparador y este ADR los deja intactos. Los dos temas opuestos siguen
  sin compartir una línea de CSS — pero **el choque deja hoy de ser latente**: con
  la pantalla pública, `marcador.gal` sirve el marcador **oscuro** y `/proxecto`
  **claro** en el mismo dominio, y ahora lo ve cualquiera que navegue entre los
  dos. **Es exactamente la entrada 6 del inventario de EPIC-004 empeorando de la
  forma que ADR-026 §1 anticipó**, y su dueño y su disparador no cambian.
- **Los literales.** `sdd-lingua` propuso el juego entero y esta spec lo aterriza;
  lo que este ADR fija son las **reglas** —la barrera léxica de §4.4, la etiqueta
  larga de §8.1, la prohibición de «en directo» y de «sen datos»—, no las cadenas.
  Lo mismo con la redacción nueva de `noRepublish` y `noProduct`: §3.c dice **qué
  tienen que dejar de afirmar y qué tienen que pasar a afirmar**; las palabras son
  de `sdd-lingua` y del implementador.
- **Que el refresco devuelva fragmento HTML en vez de JSON.** Es la recomendación
  **R1** del segundo dictamen y haría la condición «sin superficie programática»
  literalmente cierta en vez de sostenida por cuatro comprobaciones. **No se toma**,
  por dos motivos: **ADR-003 fijó un snapshot JSON** y este ADR lo aterriza sin
  superseder —cambiar el formato del cuerpo sería superseder una decisión aprobada
  para satisfacer una recomendación—, y **el contrato serializado es medio
  entregable de esta spec**: si nunca se sirve, no se ha ejercido. Los cuatro
  mínimos vinculantes del dictamen se cumplen enteros (§3.a) y **el residuo queda
  escrito**: ese JSON lo lee cualquiera. **Destino: la épica de producto, con SSE;
  disparador: el día que haya un segundo consumidor del contrato.**
- **La tabla de clasificación, la ficha de partido, el histórico, los filtros y el
  buscador.** Son producto. Esta pantalla es una jornada y nada más.
- **Analítica, contador de visitas o cualquier medición de audiencia.** No hay, y
  §4.5 lo hace estructural. **`@vercel/analytics` queda prohibido con nombre
  propio** (§3.d): es la respuesta de un clic y es justo la trampa.
- **La retención de producción del raw store.** Sigue sin dueño (ADR-009 §6,
  F-SPEC-001-1). Esta pantalla no archiva nada, y publicar no alargaría la
  retención: si alguien lo alega, es señal de que dejó de ser medición.
- **La forma de la degradación publicada junto a cada cifra.** Es criterio de la
  **épica** y su sitio es el informe; lo que la pantalla dice de sí misma (§5, §6)
  no es ese informe.

## Consecuencias

### Positivas

- **El proyecto puede por fin enseñar lo que hace.** Es lo que compra la decisión,
  y no es poco: el go/no-go llega con un producto que se ha visto funcionando una
  jornada real, no sólo con cuatro números sacados de una base. La épica lo pedía
  en su alcance desde el primer día.
- **Y lo hace sin dejar ninguna afirmación publicada en falso**, porque la
  corrección va **en el mismo cambio** y no en una spec de limpieza posterior
  (§3.c). El andamio de `/robot` —user-agent declarado, ritmo, buzón delante—
  **sigue siendo verificable y cierto**, que es lo único que lo hace valer.
- **El aviso de la propia pantalla es ahora la declaración de degradación que la
  épica exige**, no una cortesía interna: quien la abra lee, en la misma pantalla,
  que esto es medición y por qué lo normal es *provisional*.
- **Ninguna spec cerrada cambia de cuerpo, y sólo tres cambian de ledger.**
  SPEC-001, SPEC-008 y SPEC-013 quedan intactas —no hay sexto estado, no hay
  minuto, no hay columna nueva—; SPEC-004, SPEC-005 y SPEC-007 reciben **una
  enmienda de ledger cada una**, que es exactamente el mecanismo que ADR-015
  existe para dar.
- **La entrada 4 del inventario de EPIC-004 se cierra por el lado bueno**, y por
  el mismo procedimiento que cerró la 1: contestándola **antes** de dibujar, y
  contestándola con un cambio de forma —servir el dato— y no con un dibujo mejor
  del problema.
- **La entrada 1 termina de cerrarse donde le tocaba**, y con una respuesta que
  sobrevive a un cambio de paleta: **la jerarquía, no el color** (§8.4).
- **ADR-026 §7 queda contestado en sus dos mitades**, con dictamen de dominio
  detrás y sin tocar el modelo.
- **Los tres relojes dejan de ser una fuente de mentira barata.** Es la clase de
  error que ninguna suite detecta y que en un campo, un sábado, hace que alguien
  crea que el partido paró cuando lo que paró fue su móvil.
- **La primera cifra queda protegida de su propia pantalla** (§7.4). Es el riesgo
  más caro de esta spec y no cuesta nada evitarlo si está escrito antes.
- **El peor fallo de la pantalla queda nombrado y mitigado con lo que ya existe**
  (§9.5): el «Rematado 0-0» de un partido aplazado es honesto **sólo** si lleva su
  cualificador y su instante, y ahora eso es un criterio y no una esperanza.
- **El contrato del snapshot queda en un sitio** desde el que SSE, la publicación
  o un feed son transportes y no reescrituras.
- **`src/model/`, `migrations/` y `DECISION_WRITERS` no se tocan.** La primera
  pantalla del marcador no añade una columna, una tabla ni una capacidad.

### Negativas / follow-ups

- **Se publica con la carta a la RFGF todavía viva, y eso es un riesgo real que la
  decisión asume.** No se elimina, se acota: **no se despliega antes del
  2026-09-08** (§3.b) y **avisar a la federación es un compromiso humano con
  nombre y fecha** (§3.e), no un criterio que un test pueda dar por cumplido. **El
  dictamen bloqueante decía que ésta era la peor semana imaginable para
  reescribir `/robot`, y sigue en el expediente diciéndolo.** Que se publique de
  todas formas es una decisión firmada, y lo que este ADR puede hacer —y hace— es
  que no se publique **antes** de esa fecha y que la federación no se entere sola.
- **La página nace apagada y ahora eso lo ve cualquiera.** Con
  `MEASUREMENT_WINDOWS` vacía no hay ni un partido, y una URL pública que no
  enseña nada es peor que una privada que no enseña nada: parece rota. Es la
  **cuarta** pieza apagada que entrega este proyecto —SPEC-012, SPEC-015,
  SPEC-017— y **lo que enciende las cuatro es el mismo diff**, la primera jornada
  declarada con sus dos precondiciones escritas (ADR-020 §3). Y hoy falta algo
  antes incluso que eso: **`calendario/` no existe y la jornada 1 es el
  2026-09-06**. **Mitigación, y por eso es un criterio y no una nota:** la pantalla
  vacía **dice por qué está vacía**, y distingue «no hay partidos» de «no se
  declaró ninguno» (§3.b, §6).
- **Un partido puede quedarse `live` para siempre** fuera de una jornada declarada
  (§2.3), porque nadie corre el motor para escribirle su RN-07. La mitigación es
  el instante en la fila, que es honesto y no bonito. **Destino: la spec de
  instrumentación de las cuatro cifras**, que tiene que decidir si cerrar una
  jornada de medición ejecuta una pasada final del motor; **disparador: la primera
  jornada declarada que termine.**
- **T1 de `sdd-competicion`, que no es de esta spec y es lo más peligroso que
  encontró:** `tableExtractor` (SPEC-008, `hecho`) exige marcador en toda fila
  `live`, y `statusWords` mapea `'descanso' → 'live'`. **Si la fuente escribe
  «Descanso» *en lugar del* marcador, la fila lanza y aborta el extractor entero**
  — cero observaciones para los nueve partidos de esa competición mientras
  cualquiera esté en el descanso, y *sen sinal* para todos a los quince minutos. Y
  es justo el trozo de `SHAPE` que su propio fichero declara **convención no
  calibrada**. **Destino: EPIC-FIX o la spec de instrumentación; disparador: la
  primera captura real durante un descanso — que hay que mirar, no suponer.**
- **Se crean dos directorios donde SPEC-017 creó uno.** Es más andamiaje para la
  misma cantidad de pantalla, y el beneficio (§1) no se cobra hasta que haya un
  segundo consumidor. Se acepta a sabiendas.
- **El número de la caché es elegido, no medido**, como los otros cuatro de la
  familia. Vive como constante nombrada para que revisarlo sea un diff.
- **La `version` derivada no distingue dos snapshots con el mismo `decided_at`
  máximo y distinto contenido** —por ejemplo, si cambiase la lista de partidos sin
  que se decidiera nada—. El `ETag` sí, porque es del cuerpo; la `version` es
  información para quien lea el JSON, no el mecanismo de caché. Declarado aquí
  para que nadie construya sobre ella una detección de cambios.
- **Tres enmiendas de ledger sobre specs `hecho` y GREEN**, y son la parte de esta
  decisión que más fácil se hace mal. ADR-015 da el mecanismo, pero el mecanismo
  no impide la tentación: **estrechar la frase hasta que el test siga verde en vez
  de corregirla**. §3.c lo prohíbe y CA-18 lo mide, y aun así es lo que hay que
  mirar en la revisión.
- **`/robot` deja de poder prometer una cosa que hoy promete**, y no hay forma de
  compensarla del todo: hasta hoy la respuesta a «¿qué hacéis con lo que leéis?»
  era «nada, es un informe interno», que es la respuesta más fuerte posible.
  Después de esto es una respuesta más larga y por tanto más débil. **Es el coste
  directo de la decisión** y no se disimula.
- **El disparador de re-dictamen no lo vigila ningún test, y su punto de tráfico no
  lo puede vigilar nadie** — la pantalla no tiene analítica y §4.5 lo hace
  estructural. Va a `docs/procedimientos/calendario-de-compromisos.md` con los
  otros compromisos que **nadie va a recordar solo**, y ese fichero existe
  precisamente porque el proyecto **no tiene CI** (F-SPEC-004-3 · F-SPEC-005-4).
- **Los horarios cambian en bloque a finales de octubre** (`sdd-competicion` T7):
  con el paso a horario de invierno, los campos sin iluminación homologada
  —mayoría en Preferente— adelantan sus horas y el calendario declarado se recarga
  casi entero. **Cualquier caché servirá horas viejas y quien llegue tarde al
  campo culpará al marcador.** Es un dato de dominio que ningún test ve.
  **Destino: el runbook de carga del calendario; disparador: el cambio de hora.**
- **Cuatro residuales que el gate firma con los ojos abiertos**, y los cuatro los
  nombra `sdd-legal-datos` en su segundo dictamen:
  1. **El archivo de un tercero sobrevive a todo.** Una página pública la archivan
     otros, y `noarchive` no es exigible frente al Internet Archive. La defensa de
     «acotada en el tiempo» es sobre **nuestra** publicación, no sobre la copia de
     otro. Lo único que la mitiga de verdad es que lo archivable sea mínimo (§3.b,
     §10).
  2. **El JSON del refresco lo lee cualquiera** con las herramientas del navegador
     (§3.a). Está declarado, no disimulado.
  3. **Nadie sabrá cuánta gente la abre**, y es la contrapartida querida de §4.5.
     El disparador de §3.d se sostiene con registros de servidor y con el primer
     `Referer` externo, no con instrumentación.
  4. **Cinco de las condiciones no las vigila ningún test y no hay CI.** Van al
     calendario de compromisos, que existe por eso.
- **El juicio de valor central sigue sin cerrarse, y no lo cierra este ADR:** si
  dos jornadas publicadas sobre dos competiciones caen del lado bueno del art. 7.5
  frente a ZOS, Lda. El criterio del rol es que sí; **su dictamen no lo cierra y la
  firma del gate lo asume.** Requiere revisión profesional, como la requiere
  cualquier monetización futura (§3.d).
- **Este ADR se aprueba sin haber sobrevivido a un sábado**, como ADR-013, ADR-025
  y ADR-026. Y ahora eso pesa más: **el primer sábado lo va a ver alguien que no
  somos nosotros.**

## Alternativas consideradas

- **No publicar: servir la pantalla tras la sesión declarada del operador.** Era
  la salida **(A)** y **fue la primera redacción entera de SPEC-018 y de este
  ADR**, siguiendo el dictamen bloqueante. Sus argumentos eran buenos y siguen
  siéndolo como hechos: la épica mide «publicado» como `Decision` escrita, así que
  **no perdía ninguna cifra**; no había que enmendar nada; y el análisis de
  reutilización del art. 7.2.b no llegaba a aplicarse. **Rechazada por decisión de
  Alberto Fojo el 2026-09-04**, tomada con todo eso delante. Lo que la decisión
  compra, y que (A) no daba: **el proyecto puede enseñar lo que hace**, y la spec
  siguiente —la de las cifras— no llega al go/no-go con un producto que nadie ha
  visto nunca funcionando. Se registra aquí entera porque es la alternativa que un
  lector futuro va a querer entender, no un descarte de trámite.
- **Matizar el literal para que siga pasando el test** («non republicamos… salvo
  unha pantalla de medición»). **Rechazada, y es el rechazo que la decisión de
  publicar hace más importante, no menos**: la frase se publicó y se mandó por
  correo **sin matiz**, y matizarla *a posteriori* para que quepa lo que se acaba
  de hacer es exactamente lo que un tercero enseñaría. §3.c exige que las
  afirmaciones **se corrijan de verdad**, diciendo lo que ahora es cierto, no que
  se estrechen hasta seguir siendo literalmente verdaderas.
- **Publicar y arreglar `/robot` y `/proxecto` después**, en una spec de limpieza.
  **Rechazada, y es la tentación real de esta decisión**, porque es la que ahorra
  trabajo hoy: dejaría al proyecto, durante el tiempo que tarde esa spec,
  publicando un marcador **y jurando en la página que un tercero audita que no lo
  publica**. La corrección no es un follow-up de esta decisión: es parte de ella, y
  por eso §3.c está dentro del ADR y no en una nota.
- **No construir la pantalla en absoluto**, ya que la épica mide sobre la base.
  Rechazada: la verificación a cronómetro de 10 partidos que la épica exige
  necesita **ver la jornada entera refrescándose**, y el tablero del panel es una
  cola de trabajo ordenada por urgencia que no sirve para eso. Además, sin
  pantalla el snapshot se escribiría sin que nadie lo haya ejercido nunca.
- **Servir la pantalla dentro del panel, como una vista más de `src/admin/`.**
  Rechazada, y con la decisión de publicar deja de ser siquiera discutible: el
  panel escribe y ésta no, el panel se ordena por urgencia y ésta por hora, el
  panel es de una persona y ésta es de cualquiera. Meterla dentro habría atado la
  publicación a desmontar `src/admin/`.
- **Que la pantalla lea la base directamente, sin snapshot.** Rechazada: es más
  corto y deja el proyecto sin contrato. El día que entre SSE, la publicación o un
  feed, habría **dos** definiciones de «lo que se publica» y la segunda se
  escribiría copiando la primera.
- **Que la pantalla se pida a sí misma `/api/board` por HTTP.** Rechazada: una
  función llamándose a sí misma por la red paga una latencia y un modo de fallo que
  no compra nada. La proyección se importa como función; el JSON es **otro
  transporte de la misma proyección**, no su origen.
- **Servir la pantalla como `page.tsx` bajo `(gl)`/`(es)`**, con `metadata` y
  layout, como `/proxecto` y `/robot`. Rechazada por los cuatro motivos escritos
  del panel más el quinto de §1: heredaría `globals.css`, que sirve claro por
  defecto, contra un ADR-026 §3.6 que hace esta pantalla oscura; no podría usar
  `next/font`; y sus barreras afirmarían sobre `renderToStaticMarkup` en vez de
  sobre el documento servido, justo cuando esta spec **añade un guion**.
- **Calcular *sen sinal* en la pantalla**, comparando `decided_at` con el reloj.
  Rechazada, y es el rechazo central del §2: sería publicar un cualificador que
  ninguna `Decision` sostiene. RN-08 no tiene excepción, ADR-021 §6 ya decidió que
  entrar en *sen sinal* **emite `Decision`** justamente para que ninguna interfaz
  tenga que hacer esto, y el resultado dependería del reloj del navegador.
- **Refrescar pidiéndole a la fuente**, en vez de leer el snapshot persistido.
  Rechazada, y merece nombrarse porque es el peor error disponible: convertiría
  `N` lectores en `N` peticiones a un tercero y **reventaría RN-11 en el primer
  minuto** sin que el número de la regla hubiera cambiado (§2.5).
- **Ocultar las filas sin `Decision`**, para que la pantalla sólo enseñe lo que se
  ha publicado. Rechazada en §6: esconde exactamente lo que la segunda cifra mide,
  y convierte un fallo de cobertura en una ausencia que nadie ve.
- **Atenuar el marcador cuando el refresco falla.** Rechazada: apaga un dato por un
  motivo que no es del dato, y ADR-013 §6 ya cerró esa puerta —«un marcador que no
  se lee no está marcado como provisional; está ausente»—.
- **Un solo instante en la interfaz, «actualizado hai N minutos».** Rechazada, y es
  la que parecía más limpia: los tres relojes de §4 se llaman igual en la
  conversación y significan cosas distintas. El precio de tenerlos separados es
  ruido en la pantalla; el precio de juntarlos es no poder distinguir un partido
  parado de un móvil sin cobertura.
- **Ordenar la pantalla por cualificador o por urgencia**, reusando `orderBoard`
  del panel. Rechazada en §8.4: reutilizar ese orden habría reintroducido por la
  puerta de atrás exactamente la jerarquía que ADR-026 §2 corrigió, y además
  mueve de sitio la fila que alguien está mirando.
- **Añadir `descanso` como sexto estado**, ya que el sistema de diseño lo dibuja.
  Rechazada en §9.1 con dictamen de dominio: no es un estado en la competición, y
  el `DESC` del canvas está sobre datos que su propio fichero declara inventados.
  Habría costado una migración irreversible, dos enmiendas de ledger y reabrir
  RN-06, por un intervalo de quince minutos que nadie ha comprobado que la fuente
  publique.
- **Capturar y enseñar el minuto de juego.** Rechazada en §9.2: no hay cronómetro
  oficial en estas categorías, el minuto de un agregador es una estimación que se
  desvía sin que nadie pueda detectarlo, y un minuto poco fiable al lado de un
  marcador **contamina el marcador**. Habría tocado SPEC-001, SPEC-008 y SPEC-013,
  las tres `hecho`.
- **Abreviar el cualificador cuando no cabe** (`P. CONF.`, `PEND.`). Rechazada en
  §8.1: ADR-026 §4.3 ya mató `FIN`, `APR` y `DESC` con este argumento exacto, y el
  motivo por el que cayeron `?` y `!` —no autoexplicativos, no traducibles— vale
  igual para unas letras.
- **Truncar los nombres de equipo para que la fila quepa en una línea.** Rechazada
  por `sdd-competicion` §6: en Terceira RFEF juegan filiales que se distinguen por
  una sola letra final, así que `CD Lugo B` truncado a `CD Lugo` **son dos clubes
  con el mismo texto en pantalla**. La fila crece o se parte; el nombre canónico no
  se toca.
- **Poner un contador global de versión en una tabla.** Rechazada en §7.1: es
  estado durable compartido, ADR-004 no lo da y ADR-021 §2 evita a propósito todo
  estado que pueda desincronizarse de los dos logs.
- **Servir la temporada entera y dejar que el cliente filtre.** Rechazada, y no por
  rendimiento: rompería la única propiedad que hace que lo servido no pueda ser una
  parte sustancial de la base de nadie el día que se publique — y la rompería en el
  sitio donde más caro sale, que es la salida.
- **Enseñar la traza de RN-12 al lector**, «ya que D-6 dice que un marcador sabe de
  dónde viene». Rechazada en §10.4: el sujeto de «sabe» es el sistema y el verbo es
  «registra». La trazabilidad ya está cumplida por el log; enseñarla no añade nada
  y entrega un registro por partido, fechado y firmado, de extracción sistemática.
