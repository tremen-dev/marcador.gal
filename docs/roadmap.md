---
tipo: roadmap
---
# Roadmap — marcador.gal

> Curado por sdd-producto. Secuencia de épicas, horizonte y criterios de corte.
> El estado fino por spec vive en el tablero; aquí vive la INTENCIÓN.

## Ahora (en curso)

- **EPIC-001 — Spike de ingesta. BLOQUEADA el 2026-08-31.** Las tres specs están
  hechas y verificadas GREEN, y aun así la épica no puede cerrarse: **solo hay
  una fuente automática capturable** (`ceroacero.es`). futgal prohíbe el rastreo
  y besoccer sirve armazones vacíos, con su dato tras un `Disallow`. SPEC-003
  mide el cruce **entre dos** candidatas, así que hoy no es ejecutable.
  Evidencia: `docs/epicas/EPIC-001-spike-ingesta/hallazgos/fontes-capturables.md`.
  **El estado de juego, lo que desbloquea y las fechas están en el apartado
  *ESTADO AL 2026-08-31* de su `_epica.md`. Empieza por ahí.**

  **Y algo que ya no está en duda:** la segunda vía de RN-02 —dos fuentes
  independientes de peso ≥ 0.7— está cerrada, y no por espejo sino por
  aritmética: no hay dos. Con una sola fuente automática, **nada se publica
  *confirmado* sin una persona**. Eso deja de ser una hipótesis del spike y pasa
  a ser una restricción de diseño para el motor.

- **EPIC-003 — Páxina de proxecto e respaldo público da carta.** Sube a *Ahora*
  el 2026-08-31, desde *Más adelante*, y **no rompe el criterio de corte**: no
  depende de ninguna cifra. No es la landing de `marca.md` —esa sigue abajo, con
  su lista de espera y su mockup, esperando al informe—, sino el sitio mínimo
  donde se puede **verificar lo que la carta afirma**: quién está detrás, el
  user-agent literal, el tope de 1 pet/min y el respeto a `robots.txt`. Se
  descubrió al abrir la petición que la landing completa **debilitaría** la
  carta, porque prometer producto es justo lo que su autor escribió que no había
  que hacer. Su precondición ya está resuelta: **`marcador.gal` se contrató el
  2026-08-31** en Dinahosting (verificado en WHOIS y DNS), lo que cierra el
  riesgo de dominio que este roadmap arrastraba. Queda pendiente la comprobación
  en OEPM, que ya no bloquea el dominio sino la inversión en identidad visual.

**La acción con plazo externo, y la única que solo puede hacer una persona:**
mandar la carta a la RFGF (`docs/negocio/carta-rfgf-acceso.md`, escrita y lista).
**Ahora espera a EPIC-003 por decisión de Alberto Fojo el 2026-08-31**, para que
salga con una página donde verificar lo que afirma. Con ella va una corrección
que salió al revisarla: el user-agent del código lleva `medicion SPEC-002, RN-11`,
identificadores internos que no significan nada fuera del repo y que además
**rotan con cada spec**. Se arregla en el código, no en la carta.
Pide **dos líneas en su `robots.txt`**, no un acuerdo de datos, así que no
necesita cifras y rompe el círculo de «la conversación solo tiene sentido con el
informe en la mano». Si contestan, la ventana pasa a ser la de **SPEC-002** —
hecha, verificada y esperando exactamente eso.

**Bloqueante fuera del código, ya resuelto a medias:** el dominio `marcador.gal`
**se contrató el 2026-08-31** (Dinahosting), lo que cierra el riesgo de nombre
abierto desde el 2026-08-29. Quedan **los handles** y la comprobación en OEPM.
Nada de esto depende de EPIC-001.

**Bloqueante nuevo, y el más caro:** `futgal.es` **prohíbe el rastreo** en su
`robots.txt` y RN-11 obliga a respetarlo (ADR-008 §1). La fuente **oficial** no
es capturable. Conserva su peso 1.0 y su condición de oficial: lo que se retira
es obtener su dato por rastreo. Se levanta con **una de dos cosas y ninguna
otra** — autorización escrita de la RFGF, o un `robots.txt` que nos permita.
Mientras tanto **no hay ninguna fuente automática de peso ≥ 0.9**, y la primera
vía de RN-02 queda cerrada para todo lo que no sea una persona.

## Después (comprometido, sin empezar)

- **EPIC-002 — Instrumentación de las cuatro cifras.** Latencia, cobertura,
  conflictos y operación, que salieron de EPIC-001 el 2026-08-31 porque exigen el
  motor, los adaptadores y el cron: ocho o nueve specs. **No empieza hasta que
  EPIC-001 dicte su veredicto**, porque el motor se diseña sabiendo si RN-02
  tiene segunda vía o no. Sus cifras nacen **sin referencia oficial**, y la épica
  obliga a declarar junto a cada una qué la degrada.

- **Decisión go / no-go.** Es un gate humano, no una épica: puede matar el
  proyecto, reducirlo o confirmarlo. **Ahora tiene dos momentos, no uno.** El
  primero, barato, con el veredicto de EPIC-001: si las candidatas son espejos
  entre sí no hay ninguna vía automática a *confirmado*, y eso se decide antes de
  construir el motor. El segundo, con las cuatro cifras de EPIC-002.
- **Conversación con la RFGF.** Sigue siendo el objetivo estratégico y ahora
  tiene **dos motivos, no uno**: llegar con números —«vuestro dato, nuestra
  pantalla»— y **desbloquear el acceso**, porque su `robots.txt` nos cierra la
  puerta. Pedirlo antes de tener cifras se **rechazó el 2026-08-31**; queda
  disponible como camino y es la única forma limpia de recuperar la fuente
  oficial.

## Más adelante (idea, sin compromiso)

- Interfaz definitiva e identidad visual (logo a 48 px, marca de agua en la
  captura compartida por WhatsApp, números tabulares).
- **Landing con lista de espera. Objetivo declarado: 500 inscritos antes del
  producto.** Se queda aquí, y ahora con una razón más que el criterio de corte:
  hoy su mockup sería inventado y su formulario contradiría la carta a la RFGF.
  **No confundirla con EPIC-003**, que es una página sin captación, sin mockup y
  sin patrocinio, hecha para respaldar la carta y no para captar a nadie.
- Ampliación de competiciones: Primeira e Segunda Galega, femenino, y las
  divisiones nacionales con proveedor de pago.
- Datos B2B: feed/widget para medios comarcales, radios y clubes. Es el negocio
  escalable (`docs/negocio/monetizacion.md`).
- Socios, patrocinio y ayudas públicas.

## Criterios de corte

Qué haría subir o bajar una épica de sección:

- **Sube** lo que aporte evidencia para el go/no-go. Nada más compite con
  EPIC-001, y ahora hay algo que compite de verdad: **el acceso a futgal**. No es
  una épica, es una gestión, y sin ella todas las cifras de EPIC-002 nacen sin
  referencia oficial.
- **Baja** todo lo que dependa de una cifra que aún no tenemos. Interfaz, marca y
  patrocinio no se tocan antes del informe: son caros de rehacer y su valor
  depende de que el dato exista. **El recíproco es el que dejó subir a EPIC-003**
  el 2026-08-31: lo que ya es cierto hoy y seguirá siéndolo salgan como salgan
  las cifras —quiénes somos, cómo rastreamos— no está sujeto a este corte. La
  prueba de que algo pasa el filtro es que **no cambiaría ni una línea** con el
  informe en la mano.
- **Corte duro de EPIC-001:** si la métrica de operación supera con mucho los
  30 min por jornada, el problema no es de interfaz sino de modelo de negocio, y
  la siguiente épica es "comunidad de corresponsales", no "producto".
- **Corte duro de conflictos:** > 15 % obliga a rediseñar el motor antes de
  ampliar competiciones — salvo que el test de espejo dicte que las fuentes
  automáticas no son independientes: entre espejos no hay desacuerdo posible, así
  que en ese escenario la cifra no mide lo que su nombre dice y el corte no
  aplica. **Los dos cortes duros son de EPIC-002**, que es donde viven ahora esas
  cifras.
