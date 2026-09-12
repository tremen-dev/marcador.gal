---
id: SPEC-019
tipo: ledger
epica: EPIC-005
---
# Ledger — SPEC-019 Spike técnico de la Radio Galega — el stream dentro de una función de Vercel y dos motores de ASR con galego, medidos sobre media hora real

## Resumen
- Fase: aprobada (2026-09-12, firmada por Alberto Fojo; ADR-028 y ADR-029 aprobados el mismo día). Spike desechable: el código va en `spikes/radio/`, fuera de `rutasVigiladas`, y se borra al cerrar la épica.
- Rama: `ft/SPEC-019-spike-tecnico-de-la-radio-galega-el-stream-dentro-de-una-funcion-de-vercel-y-dos-motores-de-asr-con-galego-medidos-sobre-media-hora-real`

## Matriz de criterios de aceptación
<!-- Escritores: sdd-implementador rellena Implementado y Test; sdd-verificador rellena Verif. y Estado. Nunca al revés. -->
<!-- Estados por CA: ✅ cerrado · ⚠️ parcial/con salvedad · 🚧 en curso · ❌ sin empezar · n-a -->
<!-- Un CA está ✅ solo cuando Implementado + Test + Verif. aplicables están en verde. Una salvedad se marca ⚠️, nunca ✅. -->
| CA | Implementado (fichero) | Test (fichero/caso) | Verif. | Estado |
|---|---|---|---|---|
| CA-0 | | | | ❌ |
| CA-1 | | | | ❌ |
| CA-2 | | | | ❌ |
| CA-3 | | | | ❌ |
| CA-4 | | | | ❌ |
| CA-5 | | | | ❌ |
| CA-6 | | | | ❌ |
| CA-7 | | | | ❌ |

## Veredicto del verificador
<!-- GREEN/RED + fecha + resumen. Lo escribe SOLO sdd-verificador. -->

## Evidencia visual
<!-- Tabla CA → captura en _qa/SPEC-019/. Informe HTML opcional: _qa/SPEC-019/informe.html -->

## Salvedades / follow-ups
<!-- IDs F-SPEC-019-1, F-SPEC-019-2… con destino (spec futura o EPIC-MEJORA). -->

## Precondiciones y purga (CA-0, §3 de la spec)
<!-- Lo escribe el operador ANTES de capturar: CA-0.1 copia del consentimiento o decisión del gate · CA-0.2 DPA por motor o decisión del gate · CA-0.3 URL del stream y origen · CA-0.4 fecha de purga. Y DESPUÉS: acuse de purga con fecha, rutas y recuento; acuse del borrado del proyecto temporal de Vercel (CA-7.5). -->

### Decisiones del gate — 2026-09-12, Alberto Fojo (registradas por `sdd-arquitecto`)

- **CA-0.1 — El spike corre con la declaración del consentimiento, sin
  esperar la copia.** El registro
  `docs/legal/2026-09-12-consentimiento-crtvg-radio-galega.md` existe
  (declarado por Alberto Fojo el 2026-09-12; frontmatter `estado: alcance
  declarado; copia del documento PENDIENTE de adjuntar`) y su alcance declarado
  cubre grabar y archivar el audio, transcribir, y el tratamiento automático
  por proveedores terceros de ASR y LLM. **La copia del documento NO está
  adjunta.** En el gate del 2026-09-12 Alberto Fojo decidió explícitamente la
  opción «correr ya» de §Notas 1: el spike captura media hora de emisión con la
  declaración como única constancia, con el argumento escrito en la spec —riesgo
  acotado, material purgado a los 30 días, comunicado por el propio titular— y
  con el dictamen de `sdd-legal-datos` del mismo día (`dictamenes-EPIC-005.md`
  §0 V1), que lo califica de riesgo acotado y decisión de gate. **Lo que no
  cambia:** la copia sigue pendiente y **sigue siendo precondición de la
  primera spec de código de la épica** (ADR-028 §4, disparador 1 del registro,
  dictamen V1) —ninguna pasa a `en-progreso` sin ella—. Esta constancia es
  anterior a cualquier captura: a fecha de hoy no hay ningún segmento
  archivado.
- **CA-0.2 — DPA por motor, sin exención para el spike.** Decidido en el gate
  del 2026-09-12 (§Notas 2, recomendación «no eximir», y dictamen V4): **ningún
  motor recibe audio real sin la copia fechada de su DPA en `docs/legal/`**.
  Los dos motores son **Google Cloud Speech-to-Text v2 (Chirp)** y **OpenAI
  (`gpt-4o-transcribe` / Whisper)**, el segundo por decisión del gate sobre
  §Notas 3; **AssemblyAI solo como tercero si su cobertura de galego se
  confirma con fecha**, y con su propio DPA. **Estado a 2026-09-12: ninguno de
  los dos DPA está en `docs/legal/`.** Es lo que el operador tiene que
  completar antes de capturar (ver handoff).
- **CA-0.3 — URL del stream: PENDIENTE del operador.** Tiene que escribir aquí,
  con fecha, **la URL exacta que se va a usar y de dónde sale**: (a) la oficial
  entregada por la CRTVG —lo que ADR-028 §4 y el dictamen V3 piden—, o (b) la
  pública de listados de terceros
  (`https://crtvg-radiogalega-hls.flumotion.cloud/playlist.m3u8`, consultada el
  2026-09-12) **con esa anotación explícita** y con la constancia de que se pidió
  la oficial. En los dos casos, el `robots.txt` del host de esa URL se archiva
  antes que el primer segmento (CA-1.2) y su contenido se cita en el informe
  (CA-6.1); el 2026-09-12 ese host no respondía desde este entorno (dictamen
  V3).
- **CA-0.4 — Fecha de purga: PENDIENTE del operador.** Tiene que escribir
  aquí, **antes de capturar**, la fecha de la sesión de captura y la de purga
  (**30 días** después; techo 90 con una prórroga escrita, §3 de la spec), y
  **después** el acuse de purga con fecha, rutas y recuento, más el acuse del
  borrado del proyecto temporal de Vercel (CA-7.5).
- **Proyecto temporal de Vercel** (§Notas 4): aprobado en el gate del
  2026-09-12. Se crea con *Root Directory* `spikes/radio`, solo vistas previas
  protegidas, y se borra al cerrar la spec.

## Cómo retomar (handoff)
<!-- Estado real del trabajo para la siguiente sesión: qué está hecho, qué falta, dónde seguir. -->

**Estado (2026-09-12, `sdd-arquitecto`):** spec `aprobada`, sin una línea de
código todavía. Las decisiones del gate están arriba. **Antes de que
`sdd-implementador` capture un solo segmento, una persona tiene que hacer
cuatro cosas, y ninguna es automatizable:**

1. **Aceptar los DPA de Google Cloud y de OpenAI** por la vía de autoservicio
   de cada cuenta y **guardar copia fechada en `docs/legal/`** (un fichero por
   proveedor, con fecha de aceptación, versión del texto y cláusulas de
   transferencia; patrón ADR-023 §6.4). Sin las dos copias, CA-0.2 no se
   cumple y no se manda audio a ningún motor. Si se prueba AssemblyAI, tercer
   DPA y cita fechada de su cobertura de galego.
2. **Pedir a la CRTVG la URL oficial del stream** junto con la copia del
   consentimiento, **o decidir usar la pública de listados de terceros** y
   escribirlo en CA-0.3 con esa anotación. Comprobar y archivar el
   `robots.txt` de ese host antes del primer segmento.
3. **Fijar y escribir la fecha de purga** en CA-0.4 (fecha de captura + 30
   días).
4. **Elegir la media hora:** un sábado o domingo con partidos de **Terceira
   RFEF G1 en juego durante *Galicia en goles***, y escribir programa, fecha y
   hora previstas. Si la media hora no da veinte frases de gol, se alarga en la
   misma sesión hasta sesenta minutos (§2 de la spec); no hay segunda sesión.

**Lo que no bloquea el spike pero sí lo que viene detrás:** la copia del
consentimiento (precondición de la primera spec de código, ADR-028 §4) y el
re-dictamen de ADR-027 §3.d.8 (precondición de la tercera spec; el dictamen del
2026-09-12 dice que se pide cuando esa spec esté en borrador).

**Dónde seguir:** con las cuatro constancias de CA-0 escritas, crear el proyecto
temporal de Vercel, `spikes/radio/` con las tres líneas de configuración de
raíz (§1), y capturar en el orden de §2.
