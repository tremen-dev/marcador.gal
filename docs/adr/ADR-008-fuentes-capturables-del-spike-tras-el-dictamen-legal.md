---
id: ADR-008
tipo: adr
estado: borrador
historial:
  - {estado: borrador, fecha: 2026-08-31, por: sdd-arquitecto}
supersede: ADR-002 (parcialmente; ver §Alcance de la supersesión)
---
# ADR-008: Fuentes capturables del spike tras el dictamen legal

- Deciders: propone `sdd-arquitecto` a partir del dictamen de `sdd-legal-datos`
  del 2026-08-31 (ledger de SPEC-002) y de la decisión de producto del gate ese
  mismo día. **Aprueba: Alberto Fojo.** Al firmar acepta explícitamente el riesgo
  residual de la §Decisión 5, que es lo único de este ADR que no viene dictado
  por una regla dura.
- Specs relacionadas: **SPEC-002** (test de espejo con referencia, `hecho`),
  **SPEC-003** (test de espejo sin referencia). Y, aguas abajo, la spec del motor,
  que hereda la lista de fuentes y sus pesos.

## Contexto

**ADR-002 decidió cuatro fuentes para el spike y encargó el test de espejo contra
futgal.es.** Se escribió el 2026-08-29 sin dictamen legal: el propio ADR-002 dejó
como follow-up «las ToS de resultados-futbol.com hay que revisarlas igual que las
de ceroacero (consultar a `sdd-legal-datos`)».

El dictamen llegó el **2026-08-31**, al cerrar SPEC-002 (ledger de SPEC-002,
§*Dictamen de `sdd-legal-datos`*). Tres hechos suyos son verificables por
cualquiera y cambian lo que se puede capturar:

1. **`https://www.futgal.es/robots.txt` termina en `User-agent: *` /
   `Disallow: /`.** Nuestro user-agent cae en el comodín. **RN-11 obliga a
   respetar robots.txt** y el no-negociable de legalidad de `FOUNDATION.md` lo
   repite para el spike. No admite ponderación.
2. **`resultados-futbol.com` hace 301 entero a `besoccer.es`** —la raíz y el
   `robots.txt`—. El operador real es **BESOCCER SOLUTIONS S.L.** (CIF
   B-93693042, Málaga). ADR-002 ya anotaba «resultados-futbol.com (BeSoccer)»,
   pero hoy no es una marca de BeSoccer: es una redirección.
3. **`ceroacero.es` prohíbe una sola ruta** (`/zzmap_v3.php`) y permite el resto.
   Su operador es **ZOS, Lda.** (Portugal). La afirmación de ADR-002 «las ToS de
   ceroacero restringen el scraping» **no tiene fuente localizable hoy**: el
   dictamen buscó esa página y no la encontró.

El código de SPEC-002 hace lo correcto y por eso duele: `robotsRegistry` resuelve
por origen y el capturador consulta `isAllowed` **antes** de pedir nada, así que
todos los ticks de futgal saldrían `skipped`, la cobertura de sus dos pares sería
0 % y por **CA-5 la ventana entera sería inválida sin informe**. El instrumento se
protege solo; lo que no puede es inventar permiso.

**La decisión de producto ya está tomada por el gate (2026-08-31):** no se pide
autorización a la RFGF por ahora. Este ADR registra las consecuencias de eso
sobre la lista de fuentes, que es lo que ADR-002 decidió y lo que la spec del
motor va a heredar.

## Decisión

### 1. futgal.es sale del conjunto **capturable**, no del modelo

Mientras `https://www.futgal.es/robots.txt` diga `Disallow: /` para `*`,
**futgal.es no se captura por HTTP**. No es un juicio sobre la fuente: sigue
siendo la **fuente oficial** de las dos competiciones y **conserva su peso 1.0**
(RN-01). Lo que se retira es la posibilidad de obtener su dato por rastreo sin
incumplir RN-11.

Se levanta con **una de estas dos cosas, y con ninguna otra**: (a) autorización
escrita de la RFGF —que es de todos modos el objetivo estratégico declarado en
`retos.md`—; (b) un `robots.txt` que nos permita. Ni un user-agent distinto, ni
un tope de peticiones más bajo, ni «es solo una hora» levantan un `Disallow: /`.

**Consecuencia que hay que decir entera:** sin futgal, el spike **no tiene ninguna
fuente automática de peso ≥ 0.9**. La primera vía de RN-02 —publicar *confirmado*
por peso— queda cerrada para todo lo que no sea una persona (operador 1.0). La
segunda vía —dos fuentes independientes ≥ 0.7— pasa a ser la **única** ruta
automática a *confirmado*, y por tanto la pregunta que SPEC-002 existía para
responder deja de ser una entre varias y pasa a ser **la** pregunta del motor.

### 2. La segunda candidata es `besoccer.es`, y se llama por su nombre

`resultados-futbol.com` **no es una fuente: es una redirección**. La fuente es
**besoccer.es**. El `SourceId` del spike pasa a ser `besoccer` y las URL objetivo
apuntan al host final. **El peso no cambia** (0.7, RN-01: la fila de RN-01 nombra
a «BeSoccer / ceroacero / resultados-futbol.com», que hoy son dos cosas y no
tres).

Motivo, y no es cosmético: archivar HTML de `besoccer.es` bajo el `SourceId`
`resultados-futbol` mete en el raw store una fuente **mal etiquetada**, y el raw
store es el único artefacto del spike que sobrevive al spike. Es además la mitad
de **F-SPEC-002-22**; la otra mitad —que el capturador no siga redirecciones en
silencio— es CA de SPEC-003 y no de este ADR.

### 3. El test de espejo tiene dos modos, y ADR-002 solo describía uno

ADR-002 encarga «una hora de observación el día 2 … contra futgal». **Ese encargo
no se puede cumplir hoy y no se cancela.** Se desdobla:

| Modo | Spec | Referencia | Pregunta que responde | Ejecutable |
|---|---|---|---|---|
| **con referencia** | SPEC-002 (`hecho`) | futgal | ¿es cada candidata espejo de futgal? **y** ¿son espejos entre sí? | cuando futgal sea capturable (§1) |
| **sin referencia** | SPEC-003 | ninguna | ¿son las dos candidatas espejos **entre sí**? | hoy, si se cumple §5 |

El modo sin referencia **no sustituye** al de SPEC-002 ni lo hace innecesario:
responde **menos**, y SPEC-003 está escrita alrededor de decir exactamente cuánto
menos. Lo que sí hace es dar al motor la única respuesta accionable disponible
hoy sobre RN-02, en vez de ninguna.

### 4. La afirmación de ADR-002 sobre las ToS de ceroacero deja de sostener razonamiento

ADR-002 dice «las ToS de ceroacero restringen el scraping». **No se declara
falsa** —ausencia de prueba no es prueba de ausencia, y pudo existir una página
que ya no está—: se declara **sin fuente localizable a 2026-08-31**, y por tanto
**deja de ser premisa de nada**. Quien necesite apoyarse en ella, que la
localice y la cite.

### 5. Capturar `besoccer.es`: lo que el gate acepta al firmar

**Esto es lo único de este ADR que no viene dictado por una regla dura, y por eso
va aparte.**

- Su `robots.txt` **permite**: `User-agent: *` con `Allow: /`, prohibidas solo
  `/scripts*` y `/ajax*`; bloquea por nombre a cinco bots entre los que **no**
  estamos. RN-11, en su cláusula de robots.txt, se cumple.
- Su página legal **prohíbe**: «El contenido … no podrá ser reproducido … **ni
  registrado por ningún sistema de recuperación de información** … a menos que se
  cuente con la autorización previa, por escrito, de BESOCCER SOLUTIONS».
  Guardar la respuesta cruda en el raw store **es** registrarla en un sistema de
  recuperación de información: **RN-10 choca de frente con esa cláusula.**
- El dictamen lo marca **DUDOSO** y pide **revisión profesional**. Su matiz, que
  no es coartada: son condiciones *browse-wrap* —sin clic de aceptación ni
  registro— y su oponibilidad a quien no las acepta está discutida.

**Decisión propuesta: se captura `besoccer.es` para la ventana acotada de
SPEC-003**, y quien firma acepta el riesgo residual con estos límites, que son
parte de la decisión y no adorno:

1. **Ventana acotada**: una hora, dos competiciones, a 1 petición/minuto por par
   (RN-11). El dictamen la considera cuantitativamente insustancial a efectos del
   derecho *sui generis* (TJUE *Fixtures Marketing* y *BHB v. William Hill*).
2. **Es medición, no producción.** Ningún dato de besoccer.es se publica. Un
   sondeo continuo sobre muchas competiciones **es** el art. 7.5 de la Directiva
   96/9/CE y ahí no hay lectura benigna: se licencia o se acuerda. Esto ya lo dice
   el no-negociable de `FOUNDATION.md`; este ADR lo confirma, no lo amplía.
3. **Plazo de conservación fijado antes de la ventana.** Ver *Negativas*: es
   precondición, no follow-up.
4. **Si el gate no acepta este riesgo, no hay par y SPEC-003 no tiene nada que
   medir.** No hay tercera opción disponible hoy: con una sola candidata no hay
   cruce. La alternativa es buscar una tercera fuente automática, que necesita su
   propio dictamen y su propio adaptador (ver *Alternativas*).

## Alcance de la supersesión

Este ADR **supersede a ADR-002 únicamente en**: la composición de la lista de
fuentes **capturables** (§1, §2), la identidad y el nombre de la segunda
candidata (§2), la forma del encargo del test de espejo (§3) y el estatus de su
afirmación sobre las ToS de ceroacero (§4).

**No toca** el resto de ADR-002: las dos competiciones, la exclusión de las APIs
de pago y de X API, el bot de Telegram como corresponsal, los pesos de RN-01, ni
la razón por la que el test de espejo existe.

**ADR-002 no se edita.** Es inmutable y aprobado. Marcar su frontmatter como
parcialmente superseded, si el estándar lo pide, es del humano o de
`sdd-documentalista`, no mío.

## Consecuencias

### Positivas

- **Se desbloquea una medición hoy.** La pregunta que gobierna RN-02 —¿pueden las
  dos candidatas confirmarse la una a la otra?— se puede responder sin futgal, y
  un veredicto de espejo la cierra de forma definitiva.
- **El instrumento se estrena contra HTML real** antes de la ventana con
  referencia: calibración de extractores, emparejamiento manual y catálogo
  incipiente de alias quedan hechos y depurados, no contra fixtures.
- **Deja de haber una fuente mal etiquetada en el raw store** antes de que haya
  un solo byte dentro (§2).
- **La conversación con la RFGF gana un argumento**: se llega con la medición que
  sí se pudo hacer y con el motivo documentado de la que no.

### Negativas / follow-ups

- **Las otras tres métricas de EPIC-001 no se rescatan.** Latencia, cobertura y
  operación se definieron contra un conjunto de fuentes que incluía la oficial.
  Sin futgal, «cobertura» no tiene contra qué medirse —no hay calendario oficial
  capturado— y «conflictos» pierde el denominador que le da sentido. **Esto es de
  `sdd-producto` y de `_epica.md`, no de este ADR ni de SPEC-003**, y hay que
  mirarlo antes de dar EPIC-001 por medible. Se señala; no se toca una épica
  aprobada.
- **PRECONDICIÓN, no follow-up: el plazo de conservación del raw store.**
  ADR-005 deja la retención explícitamente «no definida» y **F-SPEC-001-1** sigue
  viva por eso. Las páginas de competición contienen, según el sitio, nombres de
  jugadores, árbitros y entrenadores: datos personales. Con datos personales
  dentro, la retención indefinida deja de ser deuda técnica y pasa a ser
  minimización y plazo de conservación del RGPD (art. 5.1.c y 5.1.e), y es además
  lo que el art. 4 de la Directiva (UE) 2019/790 exige para no perder la
  excepción de minería. **Hay que fijar un plazo antes de correr la ventana**,
  aunque sea corto y groseramente conservador. Destino: `sdd-arquitecto` + gate;
  no entra aquí porque toca ADR-005 y SPEC-001, no la lista de fuentes.
- **El buzón de la User-Agent tiene que leerse.** `mailto:ola@tremen.dev`
  identifica a alguien solo si alguien contesta. RN-11 lo pide y **ningún test se
  pondrá rojo** si no se cumple.
- **La cláusula de BeSoccer requiere revisión profesional** si algo de esto pasa
  de medición a exposición. El proyecto no tiene abogado y este ADR no lo
  sustituye.
- **Si la RFGF autoriza más adelante**, SPEC-002 se puede correr tal cual: está
  `hecho`, verificada y no se ha tocado. Lo que **no** se puede es reanalizar la
  ventana de SPEC-003 con referencia: los bytes de futgal no estarán en ese
  archivo. Son dos ventanas, no una.

## Alternativas consideradas

- **Pedir autorización a la RFGF ahora y esperar.** Es el camino más limpio y el
  objetivo estratégico declarado. **Rechazada por el gate el 2026-08-31**: el
  roadmap dice que esa conversación «solo tiene sentido con el informe en la
  mano» y el informe necesitaba a la RFGF. Ese círculo se rompe corriendo la
  medición que sí se puede correr, no esperando.
- **Buscar otra superficie oficial de la RFGF cuyo robots.txt permita** (app,
  subdominio, feed). No descartada como idea, sí como camino de hoy: exige
  encontrarla, comprobar que el `Disallow: /` del dominio no la cubre, y un
  dictamen legal propio. Y ADR-002 ya prohíbe construir sobre el backend de la
  app: se observa para saber qué publica, no se consume.
- **Sustituir a futgal por una tercera fuente automática como referencia.**
  Rechazada: cambia lo que el test mide —la referencia deja de ser la oficial— y
  necesita fuente, dictamen y adaptador nuevos. No desbloquea nada hoy.
- **Ignorar el `robots.txt` de futgal «porque es solo una hora».** Rechazada sin
  ponderación: RN-11 es regla dura y el no-negociable de `FOUNDATION.md` la
  repite. Un proyecto cuyo argumento ante la federación es «vuestro dato, nuestra
  pantalla» no puede empezar saltándose su instrucción legible por máquina.
- **No hacer nada hasta que haya autorización.** Rechazada: deja la spec del
  motor esperando indefinidamente a una respuesta que nadie ha pedido, y
  desperdicia un instrumento construido, verificado y ocioso.
