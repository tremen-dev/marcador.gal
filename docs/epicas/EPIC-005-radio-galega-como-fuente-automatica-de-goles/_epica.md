---
id: EPIC-005
tipo: epica
estado: borrador
historial:
  - {estado: borrador, fecha: 2026-09-12, por: sdd-producto}
---
# EPIC-005 — Radio Galega como fuente automática de goles

> Nace el 2026-09-12 de una idea de Alberto Fojo: la Radio Galega sigue el
> fútbol galego en directo, con una persona en cada campo de Terceira, y ese
> audio se puede transcribir y leer. **La parte legal está resuelta antes de
> nacer**: hay consentimiento expreso de la CRTVG para este proyecto (Alberto
> Fojo, 2026-09-12), pendiente de archivar en `docs/legal/`. Lo que queda es
> técnico, y el diseño se conversó y aprobó ese mismo día: la radio entra como
> **fuente automática con peso**, el proceso vive en **una función larga de
> Vercel**, y nada publica hasta que la precisión y la independencia estén
> medidas.

## Objetivo

Dar al motor **la segunda fuente automática independiente que hoy no tiene**.

Desde el 2026-09-01 el proyecto sabe, por aritmética, que solo hay una fuente
automática capturable (`ceroacero.es`, peso 0.7) y que por eso **nada llega a
*confirmado* sin una persona** (ADR-008 §1, `docs/roadmap.md`). La segunda vía
de RN-02 —dos fuentes independientes de peso ≥ 0.7 que coinciden— está escrita,
probada con dobles e **inerte en producción**: la lista de pares independientes
nace vacía (ADR-021 §7). Esta épica existe para poner la primera entrada en esa
lista con un veredicto medido detrás, no por declaración.

La Radio Galega es candidata por tres razones que no comparte ningún agregador:
**no bebe de futgal ni de ceroacero** —tiene una persona en el campo—, su
latencia la fija esa persona y no un refresco de página, y **es capturable**:
hay consentimiento del titular, que es justo lo que falta con `futgal.es`.

**Qué es y qué no es esta fuente.** Toda su cadena es máquina: audio → texto →
propuesta de gol. RN-09 dice que un LLM nunca es la única fuente de un marcador,
y esta épica **no lo relaja**: una observación de radio sola no sostiene una
`Decision`, ni provisional. Lo que aporta es **corroboración automática** —el
segundo voto que ceroacero no tiene— y una medida de latencia que hoy no existe.
Si la precisión medida no da la talla, la radio se queda como lo que también
sirve: alerta al panel y cifra de latencia.

**Por qué ahora y no en *Más adelante*.** El criterio de corte del roadmap sube
«lo que aporte evidencia para el go/no-go». La cifra de conflictos de EPIC-002
hoy «puede no medir nada» porque hay una sola fuente automática; con una segunda
independiente, mide. Y la cifra de operación manual baja si el sistema confirma
sin persona. Las dos cifras del corte duro cambian con esta épica, y ninguna
otra cosa del roadmap las mueve.

## Criterios de éxito

La épica se cierra cuando, sobre **dos jornadas reales declaradas** (ADR-019
§3), el informe publica estas cifras con su degradación escrita al lado:

| Cifra | Cómo se mide | Umbral | Qué la degrada |
|---|---|---|---|
| **Precisión** | Goles propuestos por la radio que el operador o ceroacero confirman, sobre el total propuesto | ≥ 95 % | Falsos positivos por repetición del locutor, resúmenes de otros partidos, marcadores dichos sin contexto |
| **Cobertura** | Goles confirmados en partidos en ventana que la radio detectó, sobre el total | Informativo; se publica por competición | La radio no está en todos los campos: Terceira sí, Preferente por medir. Un gol cantado sin marcador explícito **no cuenta** (no se deriva del estado) |
| **Latencia** | Segundos entre el gol cantado y la `Observation` escrita, y comparación con la primera observación de ceroacero del mismo gol | < 60 s hasta la Observation | La longitud del trozo de audio y el tiempo del ASR. El presupuesto total sigue siendo < 120 s hasta la `Decision` (ADR-021) |
| **Independencia** | Veredicto radio/ceroacero con el instrumento de SPEC-003: quién cambia primero, y si alguna cambia *siempre* después de la otra | Veredicto explícito: independiente / espejo / inconcluso | Si el veredicto no es *independiente*, el par **no entra** en la lista de ADR-021 §7 y la segunda vía sigue cerrada |

**Éxito de la épica ≠ umbrales cumplidos.** Medir y no llegar también es éxito,
igual que en EPIC-002: la épica falla solo si termina sin cifras o con cifras
cuya degradación no está escrita.

**Lo que sí es condición de cierre:** el consentimiento de la CRTVG archivado,
fechado y con su alcance en `docs/legal/`, y el `robots.txt` y aviso legal de la
fuente dictaminados por `sdd-legal-datos` con fecha. Sin eso no hay primera
spec, igual que ADR-023 §6.4 no deja escribir el adaptador del LLM sin su DPA.

## Alcance

- Dentro:
  - **Una fuente nueva en el registro** (`src/ingest/sources.ts`): `radio_galega`,
    categoría nueva en RN-01, peso 0.7, marcada como derivada de máquina. Su peso y
    la aclaración de RN-09 que la acompaña son decisión de gate, escrita en
    `docs/fundacion/reglas.md` con fecha, y ADR del arquitecto.
  - **El oyente**: una función larga en Vercel (`/api/cron/radio`, cron cada
    10 min, `maxDuration` 800) que solo abre el stream si hay partidos en ventana
    de una jornada declarada, escucha 11 min con un minuto de solape, corta en
    trozos de 20–30 s y archiva cada segmento tal como lo sirve el CDN **antes**
    de tocarlo (RN-10).
  - **Un puerto de ASR** con proveedor detrás de un adaptador, como el puerto del
    LLM de ADR-022 §6: recibe bytes, devuelve bytes, y el dominio archiva la
    respuesta antes de parsearla.
  - **El extractor**: un LLM que propone goles dentro de la lista cerrada de
    partidos en ventana, con salida zod y rechazos enumerados (el patrón de
    `src/bot/proposal.ts`), y un catálogo de alias declarado de nombres orales
    por equipo, cargado como fuente `radio_galega` (ADR-018). Sin marcador
    explícito en la transcripción no hay `Observation`.
  - **La frontera**: `src/radio/` no importa `DecisionStore` ni construye
    `Decision`; un ciclo en `src/decide/` es quien lo llama y pasa el motor
    tras cada trozo, en la dirección que ya fija `cycle.ts`.
  - **La medición**: las cuatro cifras de arriba, sobre jornadas declaradas, y
    el veredicto de independencia con el instrumento de SPEC-003.
  - **Retención y datos personales** del audio y la transcripción: 30 días desde
    el fin de la jornada, prórroga escrita, techo de 90 (ADR-009, ADR-020), y el
    régimen de las voces y nombres que el audio contiene, al modo de ADR-023.
  - **Un spike técnico previo y desechable**: media hora de stream a través de
    una función de Vercel y de dos motores de ASR con galego, con tasa de acierto
    sobre las frases de gol. Su salida es una cifra y una elección de proveedor,
    no código que se conserva.
- Fuera (aparcado a propósito, no por descuido):
  - **Que la radio publique sola.** Ni provisional. Si algún día una cifra lo
    justifica, es un ADR que aclare RN-09 con esa evidencia delante, no esta
    épica.
  - **Derivar el marcador del estado** cuando el locutor canta el gol sin decir
    el resultado. Sería LLM más estado, y se mide cuántas veces pasa en vez de
    resolverse.
  - **Otras emisoras o programas.** Una fuente, un consentimiento. Las radios
    comarcales siguen en *Más adelante* como socios B2B, no como fuentes.
  - **ASR autoalojado** (Proxecto Nós): exige una máquina que Vercel no da. Queda
    como alternativa escrita en el ADR de hosting, con su disparador.
  - **Un proceso vivo fuera de Vercel.** Se decidió función larga; si el spike
    demuestra que no puede sostener el stream, es un ADR nuevo que supersede
    parcialmente a ADR-004 y ADR-010, no una excepción silenciosa.
  - **Reconocer al locutor, diarización o cualquier tratamiento de la voz** más
    allá de transcribirla. Minimización: solo el texto sirve.

## Specs

Desglose orientativo, propuesto por producto y no autorado: el arquitecto decide
la partición real.

1. **Spike técnico** — stream dentro de una función de Vercel, dos ASR con
   galego, tasa de acierto. Cifra y elección de proveedor; código desechable.
2. **Oyente y archivo** — función larga, ventanas, segmentos al raw store,
   puerto de ASR con el proveedor elegido y su DPA en `docs/legal/`.
3. **Extractor y motor** — propuesta dentro de lista cerrada, catálogo de
   nombres orales, `Observation` con fuente `radio_galega`, la propiedad
   `machine_derived` en el reducer, segundo cron enmendando SPEC-012 CA-8 por
   la vía de ADR-015.
4. **Medición e independencia** — las cuatro cifras sobre dos jornadas y el
   veredicto que, si es *independiente*, pone la primera entrada en la lista de
   ADR-021 §7.

ADRs previstos: uno para la radio como fuente (fila de RN-01, aclaración de
RN-09, consentimiento como precondición, retención y datos personales) y otro
para el proceso largo en Vercel con segundo cron.

## Riesgos

- **El galego radiofónico con ruido de campo.** Los motores genéricos rinden mal
  en lenguas de pocos recursos; Proxecto Nós transcribió Radio Galega con Chirp 2
  de Google, que es la mejor evidencia disponible (consultado el 2026-09-12),
  pero no una garantía. El spike existe para esto, y si ningún motor pasa, la
  épica se cierra con esa cifra y sin fuente.
- **Cobertura parcial.** *Galicia en goles* dice estar «en todos os campos de
  Terceira»; de Preferente no hay evidencia de cobertura en directo. La radio
  puede ser segunda fuente de una competición y no de la otra.
- **Audio dentro de una función serverless.** Decodificar HLS en Vercel (ffmpeg,
  límites de tamaño) o enviar los segmentos comprimidos al ASR tal cual es lo que
  el spike tiene que demostrar antes de la primera spec de código.
- **Falsos positivos por el formato del programa.** Un carrusel repite goles,
  resume otros partidos y cambia de campo sin avisar. La lista cerrada de
  candidatos en ventana y el marcador explícito son la defensa; la precisión
  medida dice si basta.
- **Coste por escucha continua.** Se paga cada minuto de audio, no cada gol:
  entre 3 y 17 $ por jornada según el motor (consultado el 2026-09-12), 100 a
  600 $ por temporada. Lo fija el ASR, no el LLM.
- **El consentimiento tiene alcance.** Si no cubre archivar el audio, RN-10 se
  cumple archivando la transcripción y el ADR tiene que decirlo. Se lee antes
  de escribir la primera spec, no después.
- **Un cron nuevo y una función de 800 s** son la primera pieza del proyecto que
  vive más de un minuto. Sin CI, solo `npm run gates` en local la vigila.
