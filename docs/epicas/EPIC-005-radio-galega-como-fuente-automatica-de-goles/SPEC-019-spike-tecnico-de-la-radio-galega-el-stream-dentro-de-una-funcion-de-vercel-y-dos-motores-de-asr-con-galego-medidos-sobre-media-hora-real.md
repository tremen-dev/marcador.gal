---
id: SPEC-019
tipo: spec
epica: EPIC-005
estado: borrador
aprobada-por:
historial:
  - {estado: borrador, fecha: 2026-09-12, por: sdd-arquitecto}
---
# SPEC-019 — Spike técnico de la Radio Galega — el stream dentro de una función de Vercel y dos motores de ASR con galego, medidos sobre media hora real

> **Primera spec de EPIC-005, y es un spike desechable.** Su salida es **una
> cifra y una elección de proveedor de ASR**, no código que se conserve: el
> código vive en `spikes/radio/`, **fuera de `src/` y de `tests/`** —fuera de
> `rutasVigiladas` de `.sdd.json`—, **no se despliega a producción** y se tira
> al cerrar. Lo que sobrevive es el informe en `hallazgos/` y lo que ADR-028 y
> ADR-029 hagan con sus números.
>
> Nace con **dos ADRs en `borrador`**: **ADR-028** (la Radio Galega como
> fuente derivada de máquina) y **ADR-029** (el oyente como función larga con
> segundo cron). **No ejecuta ninguno de los dos**: los mide. ADR-029 §9 dice
> qué cifra de aquí lo reabriría, y ADR-028 §7 delega en el CA-6 de aquí la
> recomendación del proveedor.
>
> **No toca `src/`, ni `docs/fundacion/reglas.md`, ni `INDEPENDENT_PAIRS`, ni
> `vercel.json`**, y no declara ninguna jornada de medición. Lo único del
> repositorio que cambia fuera de `spikes/` y `docs/` son **tres líneas de
> configuración de raíz** (§1), para que el spike no entre en `npm run gates`.

## Problema

**La épica descansa sobre dos incógnitas que nadie ha medido, y las dos son
anteriores a la primera línea de código de producto.**

1. **¿Se sostiene un stream HLS dentro de una función de Vercel?** ADR-029
   decide «función larga» —11 minutos por invocación, `maxDuration` 800—
   sobre límites leídos en documentación (2026-09-12), no sobre una función
   corriendo. Nadie en este proyecto ha tenido una invocación viva más de un
   minuto. Y hay un riesgo concreto que ADR-029 §7 deja abierto a propósito:
   **si un segmento HLS con AAC se puede mandar a un ASR tal cual, o hay que
   decodificarlo** —y decodificar dentro de una función tiene coste de tamaño,
   de CPU y una entrada nueva en `ALLOWED_PACKAGES`—.
2. **¿Transcribe bien algún motor el galego radiofónico con ruido de campo?**
   Los motores genéricos rinden mal en lenguas de pocos recursos. La mejor
   evidencia disponible es que Proxecto Nós transcribió Radio Galega con Chirp
   2 de Google (consultado el 2026-09-12), y **una evidencia ajena no es una
   cifra nuestra**. Si ningún motor pasa, **la épica se cierra con esa cifra y
   sin fuente**, y es mejor saberlo en media hora de spike que en dos jornadas
   de medición con tres specs escritas.

Y hay una tercera pregunta que las dos anteriores no contestan solas: **cuánto
cuesta escuchar**. Se paga por minuto de audio y no por gol (`_epica.md`,
*Riesgos*: 3–17 $ por jornada según motor), y D-7 exige que el proyecto se
pague. La cifra tiene que salir medida, no proyectada desde una página de
precios.

**Lo que este spike no es.** No es el oyente (segunda spec), no evalúa el
extractor LLM (tercera), no mide independencia (cuarta). No produce ninguna
`Observation`, no escribe en Postgres, no usa `src/raw/`. Es un instrumento de
una tarde y su código se borra.

## Usuarios / roles afectados

- **Alberto Fojo**, como gate: decide sobre las cuatro decisiones de §Notas
  antes de que corra —la más importante, si el spike puede correr sobre audio
  real con la declaración del consentimiento y sin la copia adjunta, y con los
  DPA de los motores aceptados o pendientes—.
- **El operador del spike** (el autor): escribe el corpus de referencia a mano
  (CA-3), que es la única parte que ninguna máquina puede hacer, y elige la
  ventana de captura.
- **`sdd-implementador`**: escribe el código desechable en `spikes/radio/`, con
  la disciplina mínima que §1 fija (raw antes de parsear, nada real en git,
  gates verdes) y **sin TDD sobre el desechable** salvo donde un número
  dependa de un cálculo (CA-3.4).
- **`sdd-verificador`**: juzga contra los CA leyendo el informe y los ficheros
  que lo sostienen, y **corre los tres gates** para comprobar que el spike no
  los ha tocado (CA-7). No hay flujo de usuario que conducir.
- **`sdd-arquitecto`**, como autor de las tres specs siguientes: hereda de aquí
  el proveedor, el contenedor de audio, los números de trozo y la respuesta a
  ADR-029 §9. Si el spike los deja mal, las tres specs los arrastran.
- **`sdd-legal-datos`**, consultivo: el dictamen sobre el aviso legal de la
  CRTVG y el `robots.txt` del host del stream es condición de cierre de la
  épica (`_epica.md`) y precondición de la primera spec de código (ADR-028 §4);
  **no lo es de este spike**, pero el gate puede pedirlo antes (§Notas 2).

## Diseño

### §1. Dónde vive, y por qué ahí

```
spikes/radio/                 TODO el código del spike. Se borra al cerrar la épica
  package.json                dependencias PROPIAS; no toca el package.json de la raíz
  tsconfig.json               propio; la raíz lo excluye
  api/listen.ts               la función de Vercel: escucha N min y archiva (CA-1)
  vercel.json                 maxDuration 800 para esa función; SIN crons
  src/hls.ts                  lista de reproducción y segmentos, a la cadencia del stream
  src/chunks.ts               agrupa segmentos en trozos de 20 y de 30 s
  src/asr/<motor>.ts          un cliente delgado por motor: POST, bytes de vuelta
  src/wer.ts                  la métrica, CON TESTS (CA-3.4)
  src/report.ts               genera las tablas del informe desde data/
  data/                       GITIGNORED: audio, respuestas crudas, corpus, transcripciones
```

**Fuera de `src/` por tres motivos, y cada uno bastaría.** (1) `src/` está
bajo `rutasVigiladas` y `gates.requireSpec`: todo lo que entre ahí es producto
y se verifica como producto, y esto se tira. (2) Los guardianes de SPEC-008,
SPEC-009 y SPEC-013 recorren `src/` entero (`SCAN_ROOTS`,
`tests/polite/support/capability.ts`): un cliente de ASR y un lector de HLS
desechables pondrían rojos tests de arquitectura que existen para el código
que se queda. (3) `tsconfig.json` de la raíz incluye `**/*.ts` y `.oxlintrc.json`
no ignora `spikes/`: **sin dos exclusiones explícitas, el spike entraría en
`npm run typecheck` y `npm run lint`**, y con ellas no entra. Son **tres líneas
en dos ficheros de raíz** —`"spikes"` en `exclude` de `tsconfig.json`,
`"/spikes/"` en `ignorePatterns` de `.oxlintrc.json`— más una en `.gitignore`
(`spikes/*/data/`), y son **lo único** que el spike cambia fuera de `spikes/` y
de `docs/` (CA-7).

**Un proyecto de Vercel aparte y temporal, no el de producción.** Una función
de Vercel tiene que ser una ruta de un proyecto, y la única forma de tenerla
sin tocar `src/app/` es un **segundo proyecto de Vercel** (`marcador-spike-radio`
o similar) con *Root Directory* `spikes/radio`, **solo despliegues de
vista previa**, protección de despliegue activada, y **borrado al cerrar la
spec** (CA-7.5). **Esto no reabre ADR-010**: ADR-010 decide que el sitio y el
producto comparten proyecto, y esto no es ni sitio ni producto; su propia lista
de alternativas deja «dos proyectos» explícitamente disponible. El proyecto
`marcador-gal` **no recibe ningún despliegue** de esta spec.

**El `User-Agent` es el de ADR-011, copiado a mano y dicho.** ADR-010 §6 dice
que nada de lo que la aplicación publica sobre sí misma se transcribe; aquí
**no se puede importar** `src/polite/user-agent.ts` sin meter `src/` en el
spike, así que la cadena se copia **una vez**, con un comentario que lo diga y
con la fecha. Es la excepción que un desechable puede permitirse y el producto
no; quien lea el spike tiene que verla.

### §2. Lo que se mide, en el orden en que ocurre

```
  1. CA-0   precondiciones leídas y decididas por el gate (nada corre antes)
  2. CA-1   la función: N min de stream → segmentos archivados, huecos, tamaño, arranque
  3. CA-2   los segmentos, tal cual y decodificados en el portátil → dos motores
            → respuestas CRUDAS archivadas antes de leer nada
  4. CA-3   corpus de referencia a mano → acierto en frases de gol, WER global
  5. CA-4   latencia por trozo (20 s y 30 s), desde el portátil y desde Vercel
  6. CA-5   coste medido por minuto → proyección por jornada y temporada
  7. CA-6   informe con recomendación de proveedor y respuesta a ADR-029 §9
  8. CA-7   el spike no tocó nada: gates verdes, nada real en git, proyecto borrado
```

**El orden importa por una razón concreta:** CA-2 y CA-4 usan los mismos
segmentos que CA-1 archivó, así que **la media hora de captura es una sola**
—una ventana de un programa en directo con partidos de Terceira RFEF G1 en
juego— y todo lo demás se hace en frío sobre ella, como el test de espejo
separó capturar de analizar (SPEC-002). Si la media hora no llega a las
**veinte frases de gol** de CA-3.1, la captura se alarga hasta sesenta minutos
en la misma sesión; no se hacen dos sesiones.

### §3. Lo que el spike hereda de las reglas aunque sea desechable

- **RN-10, en espíritu:** cada respuesta cruda de cada motor se escribe en
  `data/` **antes** de parsearla, y el informe cita los ficheros. Sin eso, la
  tasa de acierto no se puede rehacer con otro criterio de corrección.
- **ADR-009 §3, sin excepción:** **ni audio, ni transcripción, ni corpus de
  terceros entran en git.** `data/` está ignorado y CA-7.3 lo comprueba con
  `git ls-files`. El informe lleva **agregados y filas con nombres de equipo y
  marcadores**, nunca nombres de personas ni frases enteras con ellos.
- **Retención:** el material del spike —audio, respuestas, corpus— se purga a
  los **30 días** de la sesión de captura, con la fecha escrita en el ledger
  **antes** de capturar y el acuse después (ADR-009 §4, ADR-028 §6 por
  analogía). El techo es el mismo, 90.
- **Cortesía:** el `robots.txt` del host del stream se pide y se archiva
  **antes** de pedir la lista de reproducción, y si prohíbe la ruta **el spike
  para y lo escribe** —no lo puentea con el consentimiento— (ADR-028 §9). La
  cadencia de peticiones es la que la lista de reproducción declara y nunca
  más alta.

## Criterios de aceptación

- **CA-0 — Precondiciones, leídas y decididas antes de que corra nada.**
  Dado el spike listo para capturar,
  cuando el operador va a abrir el stream,
  entonces en el ledger consta, **con fecha y antes de la captura**:
  - **CA-0.1** que el registro
    `docs/legal/2026-09-12-consentimiento-crtvg-radio-galega.md` existe y su
    alcance declarado cubre grabar, archivar y transcribir el audio y el
    tratamiento por terceros; **y si la copia del documento está adjunta o
    no**. Si no lo está, **el gate ha decidido explícitamente** que el spike
    corre solo con la declaración (§Notas 1), y la decisión está citada.
  - **CA-0.2** por cada motor al que se le vaya a mandar audio real: la copia
    fechada de su DPA en `docs/legal/`, **o** la decisión explícita del gate de
    mandarle media hora de emisión pública con el DPA pendiente (§Notas 2),
    con el motivo escrito.
  - **CA-0.3** la URL del stream que se va a usar y de dónde sale: la oficial
    entregada por la CRTVG, o la pública de listados de terceros con esa
    constancia.
  - **CA-0.4** la fecha de purga del material del spike (§3).
  **Test:** no es de código; el verificador lee el ledger y comprueba que las
  cuatro constancias son anteriores al `fetched_at` del primer segmento
  archivado.

- **CA-1 — El stream dentro de una función de Vercel con `maxDuration` 800.**
  Dado el proyecto temporal desplegado en vista previa con
  `api/listen.ts` y `maxDuration: 800`,
  cuando se invoca con su secreto y `minutes=11` durante un programa en
  directo con partidos en ventana,
  entonces:
  - **CA-1.1** la función descarga la lista de reproducción y los segmentos a
    la cadencia del stream durante **11 minutos** sin que la plataforma la
    corte, y devuelve un JSON con: número de segmentos, bytes totales,
    **segundos de audio contiguo** (suma de las duraciones declaradas en la
    lista, contando discontinuidades), **huecos** (saltos de secuencia o
    segmentos no obtenidos, con instante), instante de arranque, instante del
    primer segmento y región de ejecución.
  - **CA-1.2** los segmentos se archivan **tal como los sirve el CDN**, byte a
    byte, con su contenedor y con el `sha256` del cuerpo en el nombre, en un
    almacén del spike (Blob del proyecto temporal o descarga al portátil);
    **el `robots.txt` del host está archivado antes que el primer segmento**.
  - **CA-1.3** se hacen **tres** invocaciones, dos de ellas **arrancadas con
    10 minutos de diferencia** para medir el solape real de ADR-029 §3: el
    informe da, por invocación, el tiempo de arranque (desde la invocación
    hasta el primer segmento), la duración efectiva de escucha, y entre las
    dos solapadas los **segundos de solape o de hueco** medidos por número de
    secuencia de los segmentos.
  - **CA-1.4** el informe dice **qué contenedor** sirve el stream (MPEG-TS,
    ADTS, fMP4…), la duración de segmento declarada y el **tamaño por minuto
    de audio**, que es lo que dimensiona el archivo de ADR-028 §6.
  - **CA-1.5** si la plataforma corta antes de los 11 minutos, o hay huecos
    mayores que un segmento **en más de una invocación**, el informe lo dice
    con números en la sección de ADR-029 §9 — es un resultado, no un fallo del
    spike.
  **Test:** los tres JSON de respuesta y el listado del almacén, citados en el
  informe con sus rutas; el verificador cruza el número de segmentos con los
  ficheros y con la suma de duraciones.

- **CA-2 — Los mismos segmentos a dos motores de ASR con galego, con las
  respuestas crudas archivadas.**
  Dado el audio de CA-1 agrupado en trozos de **20 s** y de **30 s** (los
  mismos segmentos, dos agrupaciones),
  cuando cada trozo se manda a **Google Speech-to-Text v2 (Chirp)** con
  galego como lengua, y a **al menos un segundo motor** con galego —OpenAI
  `gpt-4o-transcribe` / Whisper, o AssemblyAI si su cobertura de galego se
  verifica y se cita con fecha—,
  entonces:
  - **CA-2.1** por cada motor se prueba **primero el segmento comprimido tal
    cual** (el contenedor de CA-1.4) y, si el motor lo rechaza o transcribe
    silencio, **el mismo trozo decodificado en el portátil** (WAV/PCM, con
    `ffmpeg` fuera de la función); el informe tiene una **tabla motor ×
    contenedor** con «aceptado / rechazado / aceptado pero vacío», que es la
    respuesta a ADR-029 §7.
  - **CA-2.2** **toda respuesta se archiva en bytes, antes de leer un
    carácter**, en `data/asr/<motor>/<trozo>.<ext>`, y el informe cita el
    directorio y el recuento; una respuesta parseada sin fichero detrás
    invalida su fila.
  - **CA-2.3** si un trozo falla por límite del motor (duración, tamaño,
    formato), se registra el motivo tal como lo devuelve el motor y el trozo
    cuenta como **no transcrito**, nunca como transcrito vacío.
  - **CA-2.4** ningún motor recibe petición de **diarización, etiquetas de
    hablante ni identificación de voz** (ADR-028 §6): el informe lista los
    parámetros exactos enviados a cada uno.
  **Test:** el verificador toma tres trozos al azar y comprueba que su
  respuesta cruda existe, que es de ese trozo (instante en el nombre) y que la
  fila de la tabla coincide con lo que el fichero dice.

- **CA-3 — Corpus de referencia a mano, acierto en frases de gol y WER
  global.**
  Dado el audio de CA-1,
  cuando **una persona** escribe a mano:
  - **CA-3.1** **todas las frases de gol** de la captura —cada mención de un
    gol o de un marcador de un partido de las dos competiciones—, con
    instante, competición, los dos equipos **como los dice el locutor** y el
    marcador **si se dice explícitamente** (y si no se dice, marcado como «sin
    marcador explícito», que es la cifra de `_epica.md` *Fuera*); **mínimo
    veinte** frases, alargando la captura si hace falta (§2);
  - **CA-3.2** **cinco minutos contiguos** transcritos enteros, elegidos con
    partidos en juego, para el WER global;
  entonces el informe da, **por motor y por longitud de trozo**:
  - **CA-3.3** la **tasa de acierto en frases de gol**: una frase acierta si
    la transcripción del trozo que la contiene lleva **los dos equipos
    reconocibles** y **el marcador correcto** (en cifra o en palabra); se
    juzga con los dos motores **a ciegas** —sin saber cuál es cuál— y el
    criterio está escrito antes de mirar la primera; se dan también las tasas
    parciales (equipos sí / marcador no, y viceversa), porque son las que
    dicen qué rechazo de ADR-028 §8 dispararía;
  - **CA-3.4** el **WER global** sobre los cinco minutos, calculado por
    `src/wer.ts`, **que tiene tests**: al menos cinco casos con pares
    (referencia, hipótesis) de WER conocido —idénticas, una sustitución, una
    inserción, una eliminación, y una combinación— y una normalización
    escrita (minúsculas, sin puntuación, sin acentos) que el informe declara;
  - **CA-3.5** el corpus y las transcripciones **no entran en git** (§3); el
    informe lleva las filas de CA-3.3 con equipos y marcadores, y **ningún
    nombre de persona ni frase entera con uno**.
  **Test:** `npm test` dentro de `spikes/radio/` en verde para `wer.ts`; el
  verificador recalcula la tasa de CA-3.3 sobre cinco frases elegidas por él
  contra los ficheros crudos de CA-2.2.

- **CA-4 — Latencia por trozo, desde el portátil y desde Vercel.**
  Dado cada motor y cada longitud de trozo (20 s y 30 s),
  cuando se miden las peticiones de CA-2,
  entonces el informe da:
  - **CA-4.1** **p50 y p95** del tiempo de respuesta por trozo, sobre **al
    menos veinte** trozos por combinación, desde el portátil;
  - **CA-4.2** la misma medida para **al menos diez** trozos por motor
    **desde la función de Vercel** (la de CA-1 gana un modo que reenvía un
    trozo ya archivado al motor y devuelve el tiempo), en la región de
    producción, porque es desde donde el oyente llamará;
  - **CA-4.3** la suma **longitud de trozo + p95 del motor** por combinación,
    comparada con los **60 s hasta la `Observation`** de la épica y con el
    presupuesto de **120 s** de ADR-021, dejando el margen que queda para el
    LLM y la escritura; y la conclusión de si **20 s o 30 s** es el número que
    la segunda spec debe fijar en `src/radio/schedule.ts` (ADR-029 §3).
  **Test:** los tiempos vienen de los ficheros de CA-2.2 (instante de envío y
  de recepción en el nombre o en un índice) y el verificador recalcula un p95.

- **CA-5 — Coste medido por minuto y proyección por jornada.**
  Dado lo enviado en CA-2 y CA-4,
  cuando se lee la facturación o el panel de uso de cada motor **después** de
  la sesión,
  entonces el informe da:
  - **CA-5.1** el **coste medido por minuto de audio** por motor, con la fecha
    de consulta, junto al precio de lista que la épica citó el 2026-09-12
    (Google v2 0,016 $/min con 60 min gratis al mes y 300 $ de crédito
    inicial; OpenAI `gpt-4o-transcribe` / Whisper 0,006 $/min y
    `gpt-4o-mini-transcribe` 0,003 $/min; Deepgram Nova-3 0,0077 $/min sin
    galego probable; AssemblyAI Universal streaming 0,0025 $/min con galego
    por verificar), diciendo si coinciden;
  - **CA-5.2** la **proyección por jornada**: minutos de escucha = unión de
    las ventanas de partido (`[kickoff − 10 min, kickoff + 150 min)`, ADR-019
    §2) de una jornada real del calendario declarado de las dos competiciones
    (se toma la jornada 1 de `calendario/2026-27/`), **más el 10 % del
    solape** de ADR-029 §3; y con ella el coste **por jornada, por las dos
    jornadas de la épica y por temporada** (34 jornadas), por motor;
  - **CA-5.3** el **coste de la función** por invocación de 11 minutos,
    leído del panel de uso de Vercel del proyecto temporal (memoria
    provisionada y CPU activa), y su proyección por jornada con seis
    invocaciones por hora de ventana.
  **Test:** las cifras citan la captura de pantalla o la exportación del
  panel en `data/` (no versionada) y el cálculo de CA-5.2 está en
  `src/report.ts` con la jornada usada nombrada.

- **CA-6 — El informe, con la recomendación y la respuesta a ADR-029 §9.**
  Dado todo lo anterior,
  cuando se escribe
  `docs/epicas/EPIC-005-radio-galega-como-fuente-automatica-de-goles/hallazgos/spike-radio-galega.md`
  con frontmatter `tipo: hallazgo`, `epica: EPIC-005` y `fecha`,
  entonces contiene, en este orden:
  - **CA-6.1** método y ventana: programa, fecha, hora, minutos capturados,
    partidos en juego, URL usada y de dónde salió (CA-0.3), `robots.txt` del
    host archivado y qué dice;
  - **CA-6.2** las tablas de CA-1 a CA-5, cada una citando los ficheros que la
    sostienen;
  - **CA-6.3** **la respuesta a «¿sostiene la función el stream?»**, sí o no
    con los números de CA-1, **y el escalón de ADR-029 §7** que resultó
    necesario (tal cual / remultiplexado en JS / `ffmpeg`), con lo que costó;
    si es «no» según ADR-029 §9, lo dice con esas palabras;
  - **CA-6.4** **la recomendación de proveedor de ASR**, con la tasa de
    acierto, el WER, la latencia y el coste **en una sola tabla comparada**,
    el estado de su DPA (adjunto / pendiente / no disponible), y **la longitud
    de trozo** recomendada;
  - **CA-6.5** **lo que no se midió**, con nombre: el extractor LLM, la
    independencia, la cobertura de Preferente, el ruido de un campo concreto
    frente a otro, y lo que la media hora no contuvo;
  - **CA-6.6** la **fecha de purga** del material del spike (CA-0.4), para que
    quien abra el informe dentro de seis meses sepa que sus citas son
    arqueológicas (ADR-009 §3, «el informe declara la fecha de purga de su
    ventana»).
  **Test:** el verificador comprueba las seis secciones y que cada cifra del
  resumen aparece en su tabla de origen.

- **CA-7 — El spike no tocó nada, y se tira.**
  Dado la rama al cerrar la spec,
  cuando se compara con `main`,
  entonces:
  - **CA-7.1** `git diff main --stat` muestra cambios **solo** bajo
    `spikes/`, `docs/`, y las tres líneas de §1 en `tsconfig.json`,
    `.oxlintrc.json` y `.gitignore`; **ningún fichero de `src/`, `tests/`,
    `migrations/`, `vercel.json`, `package.json` ni `docs/fundacion/reglas.md`
    cambia**;
  - **CA-7.2** `npm run gates` (typecheck → lint → build → test) sale en
    `exit=0` en la raíz, con la salida literal en el ledger, y el spike **no
    aparece** en ninguna de las cuatro salidas;
  - **CA-7.3** `git ls-files spikes/` lista **solo código, configuración y
    tests**: ningún fichero de audio (`.aac`, `.m4a`, `.wav`, `.mp3`, ni
    segmentos MPEG-TS, que comparten la extensión `.ts` con TypeScript y por
    eso se reconocen **por contenido** —los primeros bytes— y no por nombre),
    ningún fichero bajo `data/`, ningún corpus ni transcripción — y un caso de
    `wer.test.ts` no lee nada fuera de fixtures sintéticos;
  - **CA-7.4** `MEASUREMENT_WINDOWS` sigue vacía e `INDEPENDENT_PAIRS` también
    (son ficheros de `src/`, cubiertos por CA-7.1, y se nombran porque son los
    dos que la épica prohíbe tocar aquí);
  - **CA-7.5** el proyecto temporal de Vercel está **borrado** y el ledger lo
    acusa con fecha; el proyecto `marcador-gal` **no tiene ningún despliegue**
    originado en esta rama.
  **Test:** CA-7.1 a CA-7.4 son comandos con salida literal en el ledger;
  CA-7.5 es un acuse del operador que el verificador lee.

## Entidades y reglas afectadas

**Ninguna entidad del modelo canónico se toca ni se lee**: el spike no produce
`Observation`, no escribe en Postgres, no usa `src/raw/` ni `src/polite/`.

- **RN-10** — en espíritu (§3): raw antes de parsear, para que la tasa de
  acierto sea rehacible. No es el `RawStore` del producto.
- **RN-11** — el `robots.txt` del host se respeta con fallo cerrado y la
  cadencia es la del stream (ADR-028 §9); el `User-Agent` es el de ADR-011,
  copiado con su comentario (§1).
- **ADR-009 §3** — nada real de terceros en git, sin excepción (CA-3.5, CA-7.3).
- **ADR-009 §4 / ADR-020 §3** — fecha de purga antes, acuse después (CA-0.4,
  CA-6.6).
- **ADR-023 §3 ter / §6.4** — un DPA por proveedor antes de mandarle datos
  personales; aquí, con la decisión de gate de §Notas 2 (CA-0.2).
- **ADR-028 §4, §6, §7, §9** — el consentimiento y su copia, minimización sin
  diarización (CA-2.4), los proveedores y su régimen, la cortesía del stream.
- **ADR-029 §3, §7, §9** — los números que este spike revisa, el orden de
  preferencia ante HLS/AAC, y la cifra que reabre la decisión (CA-6.3).
- **ADR-010** — no se reabre: el proyecto temporal no es sitio ni producto y
  se borra (§1, CA-7.5).
- **ADR-016** — esta spec **no escribe ningún test de arquitectura** y
  tampoco relaja ninguno: el spike queda fuera de `SCAN_ROOTS` porque está
  fuera de `src/`, no por una exención por nombre.
- **`.sdd.json`** — `rutasVigiladas` son `src/` y `tests/`; `spikes/` queda
  fuera a propósito y por eso el código desechable no exige la cadena de
  verificación de producto.

**Términos de `dominio.md`** que esta spec consume: `raw store` (por
analogía), *ventana de partido*, *jornada de medición declarada*, *Radio
Galega*, *oyente*. **Los términos nuevos de la épica —`broadcaster`, *derivada
de máquina*, `radio_galega`, *nombre oral*, *oyente*, *extractor de goles*— se
añaden a `dominio.md` en el mismo commit que ADR-028**, que es quien los
introduce; esta spec no añade ninguno.

## Fuera de alcance

- **El oyente de producto** (`src/radio/`, `radio_chunks`, la ruta
  `/api/cron/radio`, el segundo cron): segunda spec, con los números de aquí.
- **El extractor LLM y su tasa de acierto sobre goles**: tercera spec. Este
  spike mide el ASR; si el gate quiere una prueba rápida de extracción sobre
  las transcripciones de CA-2, es una fila más de CA-6.5 («no medido») o una
  spec aparte, no un CA colado aquí.
- **La independencia radio/ceroacero**: cuarta spec, y con la salida que
  ADR-028 §3 deja al gate.
- **Cobertura de Preferente**: la captura se elige con Terceira en juego; si el
  programa cubre Preferente en esa media hora, se anota, y si no, va a CA-6.5.
- **Elegir el proveedor de LLM del extractor**: sigue aplazado (ADR-023 §3
  bis).
- **Streaming ASR por websocket** (ADR-029 §Alternativas): no se prueba; si
  el implementador lo ve viable al pasar, es una línea en CA-6.5.
- **Declarar una jornada de medición**: el spike escucha media hora con el
  consentimiento del titular, no declara nada en `MEASUREMENT_WINDOWS` y no
  enciende ningún cron.
- **Conservar el código**: se borra al cerrar la épica, y lo que de él valga
  para la segunda spec se reescribe en `src/radio/` con TDD, no se mueve.

## Notas para el gate humano

1. **¿Corre el spike sobre audio real con la declaración del consentimiento y
   sin la copia adjunta?** El registro de `docs/legal/` declara que el
   consentimiento cubre grabar, archivar, transcribir y tratar por terceros,
   y él mismo dice que es una declaración y no una prueba. **ADR-028 §4 exige
   la copia para la primera spec de código**; para media hora de spike cuyo
   material se purga a los 30 días, el argumento a favor es que el riesgo es
   acotado y que el propio titular ya lo comunicó; el argumento en contra es
   que el aviso legal de la CRTVG sigue diciendo lo que dice hasta que la copia
   demuestre lo contrario. **Recomendación del arquitecto: esperar la copia
   si llega en la semana; si no, correr con la declaración y dejarlo escrito
   en CA-0.1.** Es decisión de gate.
2. **¿Se manda audio real a un motor con su DPA pendiente?** El audio lleva
   voces y nombres: datos personales, y el motor es un encargado del
   tratamiento (art. 28) aunque sea media hora de emisión pública. ADR-023
   §6.4 no deja escribir el adaptador del producto sin DPA, y el spike no es
   el producto. **Recomendación del arquitecto: no eximir.** Los DPA de
   Google Cloud y de OpenAI se aceptan por vía autoservicio en la cuenta
   (comprobación del 2026-09-12 pendiente de confirmar contra el texto, no
   contra una fuente secundaria — ADR-023 §7) y cuestan minutos; una excepción
   para ahorrarlos no vale lo que abre. Si el gate exime por tratarse de media
   hora de emisión pública procesada una vez y purgada a los 30 días, que lo
   escriba en CA-0.2 con esas palabras. **Y el dictamen de `sdd-legal-datos`
   sobre la fuente** —condición de cierre de la épica— puede pedirse ya y
   servir aquí, aunque este spike no lo exige.
3. **El segundo motor.** Google v2 (Chirp) es fijo por la evidencia de
   Proxecto Nós. Para el segundo, OpenAI (`gpt-4o-transcribe` / Whisper, con
   galego declarado) es el candidato con galego seguro; AssemblyAI es más
   barato y su galego está por verificar. **Recomendación: OpenAI como segundo
   obligatorio, AssemblyAI como tercero solo si su galego se confirma con
   fecha.** Cada motor probado es un DPA más (nota 2).
4. **El proyecto de Vercel temporal.** Es un proyecto más en la cuenta, sin
   coste por asiento (ADR-010 §Contexto), con despliegues de vista previa
   protegidos y borrado al cerrar (CA-7.5). Si el gate prefiere no crear
   ningún proyecto, CA-1 no se puede cumplir sin tocar `src/app/`, y eso es
   otra spec: no hay tercera vía.
5. **Los números.** 11 minutos, 20 y 30 s de trozo, veinte frases de gol,
   cinco minutos de referencia, tres invocaciones. Son los de ADR-029 §3 y
   mínimos elegidos para que las tasas signifiquen algo; si el gate quiere más
   muestra, es más media hora, no otro diseño.
6. **Lo que este spike puede devolver y sería igual de bueno.** Que ningún
   motor pase, que la función no sostenga el stream, o que el coste por
   jornada no encaje con D-7. La épica dice que medir y no llegar también es
   éxito; este spike existe para que eso se sepa en una tarde.
