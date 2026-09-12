---
tipo: procedimiento
---
# Calendario de compromisos con fecha

> Índice, no fuente. Cada fila apunta a dónde vive la decisión; si mañana cambia
> una fecha, cambia en su sitio y aquí solo el enlace tiene que seguir valiendo.
> Nace porque hoy las fechas con plazo están dispersas en seis ficheros
> (`docs/roadmap.md`, `docs/negocio/carta-rfgf-acceso.md`, las épicas de
> EPIC-001, EPIC-002 y EPIC-004, el ledger de SPEC-003 y
> `hallazgos/fontes-capturables.md`) y ninguno las junta.

| Fecha | Qué vence | Quién puede hacerlo | Qué pasa si nadie lo hace | Dónde vive la verdad |
|---|---|---|---|---|
| **2026-09-06** (domingo) | Verificar `lapreferente.com` con partidos en juego: candidata a tercera fuente automática. Sirve HTML real y usa el nombre canónico `preferente-futgal-grupo-1`, pero no se le encontró hora de comienzo ni rastro de directo, y en reposo «no publica en vivo» y «no hay nada en vivo» son la misma página — solo se distingue con partidos. Única ventana con partidos suficientes: **17 partidos ese domingo** (8 de Preferente, 9 de Terceira RFEF); el sábado 5 hay uno y N_min es 10. Si sirve, hace falta dictamen de `sdd-legal-datos` y un ADR que enmiende ADR-008 | Una persona, con partidos en juego el domingo — no es automatizable | La candidata queda sin verificar y EPIC-001 se cierra con la única fuente automática capturable que ya hay (`ceroacero.es`) | `docs/epicas/EPIC-001-spike-ingesta/_epica.md`, «Fechas que nadie va a recordar solo» y «Lo que desbloquea» |
| **2026-09-08** | Vence el plazo de una semana dado a la RFGF (carta enviada el 2026-09-01 a `info@futgal.es`). Sin respuesta, se da por no contestada y **no se insiste, ni por teléfono ni por otra vía**. Ese día EPIC-001 puede cerrarse diga lo que diga la federación | Alberto Fojo (única persona que decide el cierre de la épica; el vencimiento en sí no requiere acción, es automático) | Nada roto: es justo el resultado previsto — EPIC-001 se cierra con una sola fuente automática capturable, que es un resultado, no un fracaso | `docs/roadmap.md` |
| **2026-09-08** | Decisión pendiente, no tarea: si se manda un segundo correo (a otra dirección o a un contacto de sistemas) o no se manda ninguno. Alberto Fojo ya descartó el teléfono; sobre el segundo correo no se ha pronunciado | Alberto Fojo — es la única persona que puede tomar esta decisión | **Mientras no se pronuncie, no se manda ninguno**: es la regla por defecto, no un olvido | `docs/roadmap.md` |
| **2026-09-07** | **Ajustar el aviso de degradación del marcador y el número que declara**, si la verificación del 06 cambió el hecho. El número de fuentes automáticas se DERIVA de `DEFAULT_SOURCES` (`src/board/sources.ts`, SPEC-018 CA-13.8), así que lo que hay que ajustar es **el literal**, que hoy dice «unha soa fonte» — y con dos fuentes el aviso pasa a su forma plural y hay que releerlo entero. **La ordenación de los tres días importa y conviene no descubrirla sobre la marcha: 06 verificar · 07 ajustar · 08 desplegar. En ese orden** | Una persona: es una decisión de redacción sobre un hecho medido el día anterior | El marcador se despliega con un aviso que puede ser falso sobre nuestra propia actividad, **en su primer día** y en la semana en que la federación decide. **Nada se pone rojo** | ADR-027 §3.e, SPEC-018 CA-13.8 y CA-19.1 |
| **2026-09-08** | **No se despliega el marcador antes de esta fecha, y no antes de que la RFGF haya sido avisada — lo que ocurra MÁS TARDE de los dos.** El 08 es la fecha en que la carta se da por no contestada. No es una fecha de calendario: es una condición de **secuencia**, y su motivo es no poner la pantalla delante de la federación en la misma semana en la que se le pide algo diciéndole que no publicamos nada | Alberto Fojo — es una restricción de despliegue, no una tarea | **Nada impide técnicamente un despliegue anticipado y nada se pone rojo.** Es un compromiso escrito, no una barrera (SPEC-018 CA-19.6) | ADR-027 §3.e, SPEC-018 CA-19.1 |
| **2026-09-08** (o antes del despliegue) | **Avisar a la RFGF de que el marcador se publica.** Corrige una afirmación que se les hizo por escrito el 2026-09-01 —«Non republico os seus datos… aínda sen publicar»— y **se les debe conteste o no conteste**: una carta enviada no se enmienda editando un fichero. **NO es el segundo correo que la fila de abajo deja en suspenso**: lo prohibido es un RECORDATORIO. Este aviso **no pide nada** — va sin ninguna petición nueva, sin repetir la anterior y sin plazo. **Si pide algo, se convierte en el correo que la regla prohíbe** | Alberto Fojo, y sólo él. **Ninguna spec puede ejecutarlo y ningún criterio puede darlo por cumplido** | **Nada se pone rojo, y nadie detecta que el aviso no se dio.** El proyecto publicaría un marcador habiéndole escrito a la federación siete días antes que no publica nada | ADR-027 §3.e, SPEC-018 CA-19.2 |
| **2026-09-08** (antes del despliegue) | **Confirmar que el plan de alojamiento sigue siendo el que fija el plazo de retención que `/robot` publica, y que no hay ni desvío de registros (*log drain*) ni observabilidad ampliada.** La línea de privacidad publica ese plazo con el nombre de quien lo fija (SPEC-018 CA-18.2), y **es lo único de esa línea que puede envejecer sin que nadie la toque**. **Y la observabilidad ampliada no se contrata**: multiplicaría por treinta la retención de datos personales para vigilar un umbral —peor minimización, art. 5.1.c RGPD— y pondría el plazo publicado en 30 días justo al lado de los 30 del archivo, que es la confusión que esa línea existe para deshacer | Una persona, en el panel del proveedor. No es automatizable desde este repositorio | **El plazo publicado nace falso el primer día**, en la página que un tercero audita y en la semana en que la federación decide. **Ningún test lo ve:** las aserciones de `tests/site/crawler-page.test.ts` prueban que las palabras están escritas, nunca que sean ciertas | SPEC-018 CA-18.2 y el dictamen de `sdd-legal-datos` del 2026-09-04 |
| **El mismo día, al cerrar cada jornada declarada** | **Mirar el punto de tráfico del disparador de re-dictamen y escribir el número en el ledger de esa jornada.** Se cuentan, de los registros que la plataforma ya produce, **las cargas del DOCUMENTO** `/marcador` y `/es/marcador` en un día —el documento y **no** la ruta de refresco, que a un poll por minuto inflaría el número unas noventa veces por lector y hora— y **la primera aparición de un `Referer` que no sea este origen**. Umbral: **100 cargas** en un día. **Esta fila decía «al día siguiente» y se corrige el 2026-09-04, en el mismo cambio que publica el plazo**: el registro de acceso dura lo que la línea de privacidad de `/robot` dice que dura, y al día siguiente **ya no está**. Mirarlo tarde no es mirarlo mal: es no poder mirarlo. **Y lo que se declara no vigilable, sin eufemismos: no sabemos ni sabremos quién abre esta pantalla, cuánto se queda ni si vuelve** — no hay analítica, no la habrá (SPEC-018 CA-2.5), y esa ausencia **es una decisión, no una carencia** | Una persona, a posteriori y del lado del servidor. **No añade ni un byte a la página** | El umbral se cruza sin que nadie lo vea y la publicación deja de ser «el operador y su entorno» sin que se reabra el dictamen. **Nada se pone rojo** | ADR-027 §3.d, SPEC-018 CA-19.3 y CA-19.4 |
| **2026-09-30** | Purga del raw store: las 12 capturas del 2026-08-31 que viven en `raw/`, fuera de git a propósito (ADR-009, opción B). Hay que borrarlas y escribir el acuse en el ledger de SPEC-003 | Una persona, a mano sobre `raw/` o sobre el store de Blob — `RawStore` no tiene operación de borrado a propósito (ADR-009 §5) | **Ningún test se pondrá rojo si nadie lo hace.** El finding `F-SPEC-005-V2` ya avisa de que la purga no tiene ejecutor: `retention.ts` solo declara fechas en el informe, sin consultar la hora. Techo duro: **2026-11-29** | ADR-009 (`docs/adr/ADR-009-*.md`) y `docs/epicas/EPIC-001-spike-ingesta/SPEC-003-test-de-espejo-sin-referencia-el-cruce-entre-candidatas.ledger.md` |
| **Antes de que `sdd-implementador` capture un segmento del spike** (SPEC-019 CA-0; fecha de captura por elegir) | **Cuatro constancias que solo una persona puede escribir en el ledger de SPEC-019:** los **DPA de Google Cloud y de OpenAI** aceptados y con copia fechada en `docs/legal/` (CA-0.2, sin exención para el spike: gate del 2026-09-12 y dictamen V4); la **URL del stream** y de dónde sale —la oficial pedida a la CRTVG, o la pública con esa anotación— (CA-0.3); la **fecha de purga** (CA-0.4); y la **media hora elegida** (un sábado o domingo con Terceira RFEF G1 en juego durante *Galicia en goles*). El spike corre con la **declaración** del consentimiento y sin la copia: decidido por Alberto Fojo el 2026-09-12 y escrito en CA-0.1 | Alberto Fojo (los DPA y la petición a la CRTVG son actos de la cuenta y del titular; nadie más puede) | El spike no puede capturar: CA-0 exige las cuatro constancias **anteriores** al `fetched_at` del primer segmento, y el verificador lo comprueba. **Nada se pone rojo** si alguien captura antes: es disciplina, no barrera | Ledger de SPEC-019, «Precondiciones y purga» y «Cómo retomar»; ADR-028 §4 y §7; `dictamenes-EPIC-005.md` §0 |
| **Captura del spike + 30 días** (la fecha exacta la fija CA-0.4 antes de capturar; techo 90 con una prórroga escrita) | **Purga del material del spike** —audio, respuestas crudas de los motores, corpus y transcripciones en `spikes/radio/data/` y en el almacén del proyecto temporal— y **acuse en el ledger de SPEC-019** con fecha, rutas y recuento; más el **borrado del proyecto temporal de Vercel** con su acuse (CA-7.5). El informe de `hallazgos/` declara esa fecha (CA-6.6) | Una persona, a mano: `data/` está fuera de git y el almacén del proyecto temporal no tiene ejecutor de purga | **Ningún test se pondrá rojo.** Es el mismo hueco que F-SPEC-005-V2, con audio con voces dentro (ADR-028 §6) | SPEC-019 §3, CA-0.4, CA-6.6 y CA-7.5; ADR-009 §4; ADR-020 §3 |
| **Antes de que la primera spec de código de EPIC-005 pase a `en-progreso`** (la segunda de la épica, ADR-028 §12: oyente y archivo) | **Copia del consentimiento de la CRTVG adjunta en `docs/legal/`**, con el frontmatter del registro pasado a `estado: documento adjunto` y las dos filas «no dicho» —programa o emisión entera; vigencia y revocación— leídas contra el documento. Si dice menos de lo declarado, ADR que supersede parcialmente a ADR-028 **antes** de la siguiente jornada declarada (disparador 3 del registro). Con ella, el **DPA del ASR elegido** por el spike y el dictamen de `sdd-legal-datos` sobre la fuente (**ya emitido el 2026-09-12**, `dictamenes-EPIC-005.md`) | Alberto Fojo: es él quien tiene el documento y la relación con la CRTVG | La spec no se aprueba ni arranca: ADR-028 §4 y el dictamen V1 lo dicen sin excepción. **Nada se pone rojo** si alguien la arranca igual | `docs/legal/2026-09-12-consentimiento-crtvg-radio-galega.md` (disparador 1); ADR-028 §4 y §12; `dictamenes-EPIC-005.md` §0 V1 y V2 |
| **Antes de que la tercera spec de EPIC-005 (extractor y motor) se apruebe** — se pide cuando esa spec esté en `borrador` | **Re-dictamen de `sdd-legal-datos` sobre la publicación** (ADR-027 §3.d, disparador 8: «una segunda fuente automática»). ADR-028 §10 lo pisa por decisión firmada el 2026-09-12: **nada de la radio alcanza el marcador público** —ni como corroboración que cambie un cualificador, ni como cambio del aviso de degradación— hasta que ese re-dictamen esté emitido y el gate firme. La misma spec ensancha la derivación de `AUTOMATIC_SOURCES` (SPEC-018 CA-13.8, enmienda por ADR-015) y `sdd-lingua` relee el literal plural del aviso | El orquestador pide el dictamen; Alberto Fojo firma el gate | El marcador publicaría con un aviso «unha soa fonte» falso sobre nuestra propia actividad, y con una fuente en pantalla que el dictamen del 2026-09-04 no cubre. **Nada se pone rojo** | ADR-027 §3.d.8; ADR-028 §10 y §12; `dictamenes-EPIC-005.md` §2 |
| **2027-08-31** | Expira el dominio `marcador.gal` (contratado el 2026-08-31 en Dinahosting) | Quien gestione la cuenta de Dinahosting | El dominio queda libre y se pierde | `docs/negocio/marca.md` |

## El disparador de re-dictamen de la publicación

**Añadido el 2026-09-04** (ADR-027 §3.d, SPEC-018 CA-19.3). La publicación del
marcador se firmó **acotada**. Cualquiera de estas **ocho** cosas **reabre el
dictamen de `sdd-legal-datos`**, y **no se sirve una petición más** hasta que
ese rol vuelva a dictaminar y el gate firme:

1. una **tercera jornada** de medición, o que la publicación se vuelva continua;
2. una **competición** fuera de `PUBLISHED_COMPETITIONS` (`src/api/contract.ts`);
3. **cualquier dato nuevo** — clasificación, goleadores, alineaciones, árbitros,
   entrenadores, minuto a minuto, estadísticas;
4. **amplificación**: que la pantalla deje de ser `noindex`, que aparezca en
   `robots.txt`, que aparezca **un enlace entrante externo**, o que la pantalla
   **se mude a `/`**. **Enlazarla desde `/proxecto` y `/robot` NO dispara: es
   obligatorio** (SPEC-018 CA-2.9) — y hay que decirlo, porque el disparador
   anterior lo listaba como amplificación y cumplir la obligación lo habría
   disparado el primer día;
5. **acceso programático ofrecido a un tercero**: documentación, CORS, feed,
   widget, exportación o API;
6. **cualquier monetización** (D-7): publicidad, patrocinio, muro de pago,
   afiliación, o usar esta pantalla para vender servicios del paraguas;
7. **que deje de ser el operador y su entorno quien la abre** — se mide con la
   fila del día siguiente a cada jornada, no con instrumentación;
8. **que el aviso de degradación deje de ser cierto**: una segunda fuente
   automática, o que `futgal.es` pase a ser capturable.

**El disparador 8 está pisado desde el 2026-09-12** (ADR-028 §10, aprobado por
Alberto Fojo): la Radio Galega es la segunda fuente automática. **Todavía no
reabre nada en la práctica** porque nada de la radio alcanza el marcador
público hasta la tercera spec de EPIC-005, y el dictamen de `sdd-legal-datos`
del 2026-09-12 fija cuándo se pide el re-dictamen: cuando esa spec esté en
`borrador`. La fila correspondiente está en la tabla de arriba.

**Más la cláusula permanente:** si **ZOS, Lda.** o la **RFGF** piden que se
pare, **se para primero y se dictamina después**, y **parar es vaciar
`MEASUREMENT_WINDOWS`** (`src/ingest/measurement.ts`). **En la duda, se para.**

**Y la respuesta de la federación, si llega, hay que saber clasificarla**,
porque llegará en un párrafo de prosa: **«no nos rastreéis» NO detiene la
publicación** —no se les rastrea y no se les iba a rastrear—; **cualquier frase
sobre la publicación misma sí la detiene**. Lo decide una persona.

## Por qué existe este documento

**Trece de estas catorce fechas no las vigila ningún test** —las nueve
originales sin red más las cuatro filas de EPIC-005 añadidas el 2026-09-12;
la cuenta se corrige el 2026-09-13 bajo SPEC-019 CA-7.1, porque el caso 8 de
`tests/board/runbook.test.ts` afirma este número y esta frase—, y el proyecto no
tiene CI (`F-SPEC-004-3` · `F-SPEC-005-4`): nadie va a enterarse en rojo de que
se pasó un plazo. La única con cierta red es la del dominio, y esa red es
externa (el registrador, no este repositorio). Este documento no sustituye esa
ausencia —sigue sin haber nada que falle si una fila de esta tabla se
incumple— pero al menos las junta en un sitio, para que «nadie lo va a
recordar solo» deje de ser cierto por dispersión.

**Las cinco filas del 2026-09-07, del 2026-09-08 y la del cierre de cada
jornada llegan con SPEC-018** y son, literalmente, **lo que ningún test puede
sostener**: ninguna impide técnicamente un despliegue anticipado, ninguna
detecta que el aviso no se dio, ninguna detecta que se cruzó un umbral del
re-dictamen, **ninguna comprueba que el plazo que la página publica siga siendo
el real** —las aserciones prueban que unas palabras están escritas, no que sean
ciertas (ADR-016 §6)— y **nadie sabrá cuánta gente abre la pantalla** — eso
último es la contrapartida **querida** de no tener analítica, no una carencia. **Son
compromisos escritos, no barreras** (SPEC-018 CA-19.6), y esta línea existe
para que nadie los cuente como barreras al leer la matriz del ledger.
