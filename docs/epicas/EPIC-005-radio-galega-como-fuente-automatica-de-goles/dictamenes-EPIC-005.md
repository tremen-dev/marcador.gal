# Dictámenes de dominio para EPIC-005 — la Radio Galega como fuente

> Consultivos: guardan el modelo, no implementan. Cada uno lleva fecha de
> consulta; un dictamen legal sin fecha no vale. Se anotan encima, nunca se
> reescriben (patrón de `dictamenes-SPEC-018.md`).

## Dictamen de `sdd-legal-datos` — 2026-09-12: la fuente, su captura y sus datos

**Alcance.** Captar, archivar y transcribir la emisión en directo de la Radio
Galega (*Galicia en goles*), extraer goles con un LLM y usarlos como fuente
automática de corroboración (ADR-028, ADR-029, SPEC-019). Dictamen pedido por la
épica como condición de cierre y por SPEC-019 Notas 2.

### §0. Veredicto

**Correcto, condicionado.** La tesis del proyecto se mantiene: los goles son
hechos sin copyright; el riesgo está en **cómo** se obtiene el dato. Aquí el
«cómo» es grabar una emisión con copyright, y eso solo es lícito porque el
titular lo consiente. Todo lo demás cuelga de esa autorización y de su prueba.

Condiciones, en orden de bloqueo:

- **V1 — La copia del consentimiento, antes de la primera spec de código.**
  `docs/legal/2026-09-12-consentimiento-crtvg-radio-galega.md` es una
  declaración de Alberto Fojo, no el documento. El aviso legal de la CRTVG,
  consultado hoy en `https://www.crtvg.es/aviso-legal`, declara suyos los
  «clips de audio», prohíbe «a reprodución ... nin o seu tratamento informático
  ... sen o permiso previo» y limita el uso a «persoal e privado, quedando
  prohibido o seu uso con fins comerciais». Mientras no haya copia, ese texto
  es lo único probado, y prohíbe exactamente lo que SPEC-019 CA-1 hace.
  **Para el spike** (media hora, purgada a 30 días, comunicada por el propio
  titular), correr con la declaración es un riesgo acotado y **decisión de
  gate**, coincido con SPEC-019 Notas 1; lo que no admite excepción es la
  primera spec de código (ADR-028 §4).
- **V2 — Lo que la copia tiene que decir y el registro no declara:** programa
  o emisión entera, vigencia, revocación, y si nombra la URL del stream. Si el
  documento dice menos que el registro, ADR nuevo antes de la siguiente
  jornada (disparador 3 del registro).
- **V3 — `robots.txt` del host del stream, verificado con la URL oficial.**
  Hoy, desde este entorno: `https://www.crtvg.es/robots.txt` responde 200 con
  `Crawl-delay: 10` y cuatro `Disallow` que no alcanzan a la emisión;
  `https://www.agalegaaudio.gal/robots.txt` devuelve **403 de CloudFront** a
  nuestro `User-Agent`; `https://crtvg-radiogalega-hls.flumotion.cloud/robots.txt`
  **no responde** (fallo de conexión). **No se puede dictaminar el host del
  stream hoy.** SPEC-019 CA-0.3 lo verifica con la URL que dé la CRTVG y lo
  archiva por el `PolicyGate` (ADR-028 §9). Un 403 al `User-Agent` de ADR-011
  en el portal es dato, no permiso: se anota y, si persiste con la URL
  oficial, se pregunta a la CRTVG en vez de cambiar de identidad.
- **V4 — DPA por proveedor antes de enviar audio real, spike incluido.** El
  audio lleva voces de periodistas y nombres de personas dichos en antena:
  datos personales. Cada motor de ASR y el LLM del extractor son encargados
  del tratamiento (RGPD art. 28) y, si procesan fuera de la UE, hay
  transferencia internacional (cap. V). El consentimiento de la CRTVG es del
  titular de la emisión, **no de los interesados**, y no sustituye el
  encargo. Coincido con SPEC-019 Notas 2: **no eximir**; los DPA de Google
  Cloud y OpenAI se aceptan por autoservicio y la copia fechada va a
  `docs/legal/` (ADR-023 §6.4).
- **V5 — Minimización y plazo.** Solo texto: sin diarización, sin
  reconocimiento de locutor, sin huella de voz. La voz no se usa para
  identificar a nadie, así que no se trata como biométrico (art. 9), pero es
  una afirmación que requiere revisión profesional (ADR-028 §11.2). Retención
  del audio y la transcripción igual que el archivo de medición: 30 días desde
  el fin de la jornada, prórroga escrita, techo 90 (ADR-009, ADR-020). Que 30
  días sea defendible para audio con voces también va a revisión profesional.
- **V6 — Base jurídica.** Interés legítimo (art. 6.1.f) para un tratamiento de
  medición acotado a jornadas declaradas, con la ponderación (LIA) escrita en
  `docs/legal/` como ya exige ADR-023 §4 para el corresponsal; extiéndase esa
  LIA a esta fuente en vez de escribir otra.

### §1. Lo que NO aplica, y por qué conviene decirlo

- **Derecho *sui generis* de bases de datos:** no. Una emisión de radio no es
  una base de datos; lo protegido es la obra y la señal, y eso lo cubre el
  consentimiento. Los goles extraídos son hechos.
- **Excepción de minería de textos y datos (art. 4 Directiva 2019/790, art.
  67 RDL 24/2021):** no hace falta invocarla. Con consentimiento del titular no
  hay que discutir si su aviso legal es una reserva válida. Si el
  consentimiento se revocara, esta vía **no** sirve de repuesto: el aviso
  legal reserva expresamente el tratamiento informático.
- **RN-11 como tope de una petición por minuto:** está escrito para páginas.
  Coincido con ADR-028 §9: el stream se consume a la cadencia que él declara,
  con `User-Agent` y `robots.txt` como siempre, y sin rastrear ninguna página
  de la CRTVG. Que la frase entre en `reglas.md` es decisión de gate; el
  invariante que protege —identificarse y no pedir de más— queda intacto.

### §2. Invariantes afectados y specs que lo heredan

- **RN-10:** se cumple por triplicado (audio tal cual, ASR en bytes, LLM en
  bytes). Cubierto por el alcance declarado; si la copia no cubriera el audio,
  ADR nuevo.
- **RN-09:** no se relaja; la aclaración de ADR-028 §2 la estrecha. Correcto.
- **ADR-027 §3.d.8:** una segunda fuente automática dispara el re-dictamen de
  la publicación. Lo pediré cuando la tercera spec esté en borrador, no antes:
  hoy nada de la radio alcanza el marcador público.
- **ADR-023:** su régimen B por jornada y su LIA se extienden a esta fuente
  (V5, V6).
- **Publicidad y apuestas (RD 958/2020):** sin cambio; la fuente no abre
  ninguna puerta a patrocinio.

### §3. Nivel de riesgo y revisión profesional

Riesgo **bajo** una vez adjunta la copia y firmados los DPA; **alto** si se
captura sin ninguna de las dos cosas, porque el aviso legal es explícito y el
titular es una corporación pública con servicios jurídicos propios.

**Requieren revisión profesional antes de que esto pase de medición a
exposición:** las cinco de ADR-028 §11, más una: si la CRTVG pide atribución
al renegociar, cómo se formula sin que el sitio nombre a un tercero como
aval, que es lo que ADR-012 evita.

*Fecha de consulta de todas las fuentes citadas: 2026-09-12.*
