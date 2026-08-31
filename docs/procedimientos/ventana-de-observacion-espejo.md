---
tipo: procedimiento
spec: SPEC-002
epica: EPIC-001
---
# Runbook — ventana de observación del test de espejo

> Cierra **F-SPEC-002-14**. Procedimiento operativo de SPEC-002: cómo se corre la
> hora de observación y cómo se analiza después. Escrito contra el código, no
> contra la intención; si el código y este documento discrepan, manda el código y
> este documento está roto.

El test responde una sola pregunta: **¿ceroacero y la segunda candidata son
independientes de futgal, o espejos suyos?** Si son espejos, la segunda vía de
RN-02 no existe y el motor tiene que nacer sabiéndolo (ADR-002).

El diseño es de **dos fases que no se hablan**. La fase A captura en vivo y
**archiva sin parsear** (RN-10): es irrepetible, y por eso no se le pide nada
más. La fase B analiza en frío desde el archivo, es determinista y **se puede
repetir cuantas veces haga falta**. Consecuencia práctica que gobierna todo lo de
abajo: **no hace falta entender las páginas antes de capturarlas.**

---

## Paso 0 — Bloqueantes que no son técnicos

**Nada de lo demás importa si esto no está resuelto.**

### 0.1 futgal.es prohíbe el rastreo (BLOQUEANTE, sin resolver)

`https://www.futgal.es/robots.txt` (consultado el 2026-08-31) termina con:

```
User-agent: *
Disallow: /
```

Nuestro user-agent cae en `*`. RN-11 obliga a respetar robots.txt, así que **el
capturador marcará todos los ticks de futgal como `skipped`**, la cobertura de
sus dos pares será 0 %, y por **CA-5 la ventana será inválida y no se escribirá
informe de nada**. El código hace lo correcto; no hay forma de configurarlo para
saltárselo, ni debe haberla.

**futgal es la referencia contra la que se miden las candidatas.** Sin ella no
hay test. Esto se resuelve con una **autorización escrita de la RFGF** o
cambiando el diseño del test, y las dos son decisiones de producto. Dictamen
completo en el ledger de SPEC-002 (`sdd-legal-datos`, 2026-08-31).

### 0.2 El buzón de contacto tiene que existir y leerse

La User-Agent declara `mailto:ola@tremen.dev` (`src/mirror/user-agent.ts`). RN-11
pide identificación **real**: si nadie lee ese buzón, la regla está incumplida y
**ningún test se pondrá rojo**.

### 0.3 `resultados-futbol.com` ya no existe

El dominio hace **301 entero a `besoccer.es`**. No lo pongas en `targets` tal
cual: el capturador seguiría la redirección en silencio y archivaría HTML de
besoccer.es bajo el `SourceId` `resultados-futbol` (**F-SPEC-002-22**, abierto).
Hasta que eso se arregle, apunta directamente al host final y nombra la fuente
por lo que es.

---

## Paso 1 — Guardar los `robots.txt` (antes de la ventana)

Los `robots.txt` **se descargan a mano y se guardan en disco**. No se piden
dentro del bucle de ticks: una petición de robots es una petición que el
presupuesto de RN-11 **no contabiliza**, y la política de un sitio no cambia en
una hora (**F-SPEC-002-2**).

```bash
curl -sS -A "$(node -e 'import("./src/mirror/user-agent.ts").then(m=>console.log(m.USER_AGENT))')" \
  https://www.ceroacero.es/robots.txt -o robots/ceroacero.txt
```

Uno por **origen**. **Un host sin política cargada se omite: no se presume
permiso.** Si falta un fichero, esa fuente no se captura — y es lo correcto.

---

## Paso 2 — Escribir `config.json`

Se valida contra `WindowConfigSchema` (`src/mirror/capture/config.ts`), en modo
**estricto**: una clave de más y el fichero se rechaza. Es a propósito — un typo
que se tragara el esquema sería un objetivo que nunca se capturó.

```json
{
  "window": "xornada do 5-6 de setembro, primeira media hora",
  "duration_minutes": 60,
  "tick_seconds": 20,
  "targets": [
    { "source": "futgal", "competition_id": "rfef-tercera-g1",
      "url": "https://www.futgal.es/...", "ext": "html" },
    { "source": "ceroacero", "competition_id": "rfef-tercera-g1",
      "url": "https://www.ceroacero.es/...", "ext": "html" }
  ],
  "robots_files": {
    "https://www.ceroacero.es": "robots/ceroacero.txt"
  }
}
```

- **`tick_seconds: 20` está bien y no viola RN-11.** Quien cumple la regla es el
  **limitador por par** (CA-1), no el bucle: un tick más apretado solo significa
  que cada objetivo se captura más cerca de su minuto. La cuenta es **1
  petición/minuto por par (fuente, competición)** — 3 fuentes × 2 competiciones =
  6 peticiones/minuto en total, y esa lectura de RN-11 es *load-bearing* (Diseño
  §3 de la spec).
- **`robots_files` son RUTAS a ficheros locales**, no URLs que descargar.
- `duration_minutes` entre 1 y 600; `tick_seconds` entre 1 y 60.

---

## Paso 3 — Correr la fase A (irrepetible)

```bash
npm run mirror:capturar -- config.json ventana.json
```

- **Sin `BLOB_READ_WRITE_TOKEN`** archiva en `raw/` (ignorado por git). **Con
  él**, en Vercel Blob.
- Escribe el registro de ticks en `ventana.json`: por cada par, los `ok`, los
  `failed` y los `skipped`.
- **No parsea nada.** Si el store falla, el tick sale `failed` con su motivo y la
  ventana sigue.

**Al terminar, mira la cobertura.** Si algún par bajó del **90 % de ticks
exitosos**, la ventana es inválida y la fase B **se negará a dictar veredicto**:
no escribirá informe, ni siquiera uno lleno de INCONCLUSO. La razón es que un
hueco de captura **fabrica adelantos** —si a una fuente se le caen 20 minutos, la
otra "adelanta" en todos los eventos de esos 20 minutos— y los adelantos son
justo lo que se lee como independencia. **La única salida es repetir la ventana**;
el código no define fusionar dos.

---

## Paso 4 — Escribir el emparejamiento (`pairing.json`)

**A mano, y es RN-09.** No hay ninguna rama de parecido de cadenas en el módulo,
y no debe haberla: «UD Ourense» y «Ourense CF» no se unen solas.

Validado contra `PairingSchema` (`src/mirror/analysis/pairing.ts`):

```json
{
  "window": "xornada do 5-6 de setembro, primeira media hora",
  "matches": [
    { "match_id": "...",
      "refs": { "futgal": "12345", "ceroacero": "678901" } }
  ]
}
```

Son los 8-16 partidos de la ventana. **Si falta uno que aparece en el archivo, la
fase B aborta nombrándolo** (`UnmappedMatchError`, con los dos equipos y la
fuente en el mensaje). Si dos partidos reclaman la misma referencia, también
aborta: es error del fichero.

---

## Paso 5 — Calibrar el extractor (`calibracion.json`) — **después** de la ventana

Los selectores son **datos, no código** (**F-SPEC-002-3**). Se escriben mirando
el **HTML ya archivado**, no la web en vivo, y se pueden corregir cuantas veces
haga falta sin volver a capturar. Eso es exactamente lo que compra el diseño de
dos fases.

Validado contra `ExtractorCalibrationSchema` (`src/mirror/analysis/sources.ts`),
una entrada por `SourceId`:

```json
{
  "ceroacero": {
    "rowSelector":     "table.zztable tr.parent",
    "refSelector":     "td.text a",
    "refAttribute":    "href",
    "homeSelector":    "td.text.home",
    "awaySelector":    "td.text.away",
    "scoreSelector":   "td.result",
    "statusSelector":  "td.status",
    "kickoffSelector": "td.hour",
    "statusWords": { "finalizado": "finished", "en directo": "live",
                     "aprazado": "postponed", "suspendido": "suspended" }
  }
}
```

- `refSelector`, `refAttribute`, `statusSelector` y `kickoffSelector` admiten
  `null` si la página no los ofrece. Los demás son obligatorios.
- `statusWords` va **en minúsculas** y mapea a `scheduled` · `live` · `finished`
  · `postponed` · `suspended`.
- **Una fuente sin entrada falla por su nombre** (`UncalibratedSourceError`). Es
  deliberado: un extractor que no casa nada devolvería lista vacía y convertiría
  una ventana capturada en un veredicto de «no hubo eventos», que es el peor
  silencio posible.

---

## Paso 6 — Correr la fase B (repetible)

```bash
npm run mirror:analizar -- ventana.json pairing.json calibracion.json "xornada do 5-6 de setembro"
```

El cuarto argumento es opcional y **solo se usa si la mitad temporal queda
`pendiente`**: es la etiqueta de la ventana en vivo que la cerrará.

Escribe `docs/epicas/EPIC-001-spike-ingesta/hallazgos/test-de-espejo.{md,json}` y
saca los tres veredictos por consola. **Es determinista**: dos ejecuciones sobre
el mismo archivo producen un JSON byte a byte idéntico (CA-7), lo que permite que
otra persona verifique un veredicto de una ventana que no presenció.

---

## Cómo se lee el resultado

Tres veredictos: cada candidata contra futgal, y **las dos candidatas entre sí**
(CA-15). Cada uno es **ESPEJO**, **INDEPENDIENTE** o **INCONCLUSO**, y lleva
`rn02_segunda_via_entre_automaticas`, que es `true` **solo** con INDEPENDIENTE.

**INCONCLUSO es un resultado, no un fallo.** Por CA-12 se trata como espejo, y el
motor se diseña con una sola vía en RN-02 — que es lo que hay que hacer mientras
no haya prueba de independencia.

**Las dos mitades:**

| Mitad | Necesita partidos en juego | Qué mide |
|---|---|---|
| **Contenido** | No | Discrepancias persistentes, contenido exclusivo, errores replicados |
| **Tiempo** | Sí | Quién publica antes cada cambio de valor |

El informe **sale igual con la mitad temporal `pendiente`**, y eso es un estado
legítimo, no un informe a medias. La mitad temporal **solo puede mejorar el
veredicto, nunca empeorarlo**: el motor no espera a la jornada en ningún
escenario.

**Advertencia que el informe publica solo:** si ninguna candidata resulta
INDEPENDIENTE, la métrica de conflictos de la épica **no mide lo que su nombre
dice** —entre espejos no hay desacuerdo posible— y el corte duro del 15 % no
aplica. Sale en el JSON (`hard_cut_15_percent_applies: false`) y en la prosa.

---

## Cuando algo falla

| Síntoma | Qué pasa | Qué hacer |
|---|---|---|
| Ticks `skipped` con motivo que nombra una ruta | robots.txt prohíbe esa ruta | Es correcto. No hay rodeo: esa fuente no se captura |
| Ticks `skipped` en un host entero | No hay `robots.txt` cargado para ese origen | Guárdalo (paso 1) y repite la ventana |
| `InvalidWindowError` con la cobertura de los seis pares | Algún par bajó del 90 % | Repetir la ventana. No hay rescate parcial |
| `UnmappedMatchError` | Un partido del archivo no está en `pairing.json` | Añádelo y **vuelve a correr solo la fase B** |
| `UncalibratedSourceError` | Falta la entrada de una fuente en `calibracion.json` | Añádela y **vuelve a correr solo la fase B** |
| `MissingUserAgentError` | Se intentó pedir sin identificarse | Bug: no debería ocurrir. RN-11 lo impide antes de cualquier E/S |
| El informe sale con todo a cero | Selectores que no casan nada | Recalibra contra el archivo. **No hace falta recapturar** |

**Regla de oro:** cualquier cosa que salga mal de los pasos 4 al 6 se arregla
**sin volver a pedir nada a nadie**. Solo la fase A es irrepetible.

---

## Lo que queda abierto

- **F-SPEC-002-22** — el capturador sigue redirecciones y comprueba robots.txt
  sobre la URL pedida, no sobre la final.
- **F-SPEC-002-16** — un solo par por debajo del 90 % invalida la ventana entera,
  aunque el análisis sea por par.
- **F-SPEC-001-1** — el raw store no tiene política de retención, y el archivo
  puede contener datos personales (nombres de jugadores y árbitros).
