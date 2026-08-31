---
tipo: roadmap
---
# Roadmap — marcador.gal

> Curado por sdd-producto. Secuencia de épicas, horizonte y criterios de corte.
> El estado fino por spec vive en el tablero; aquí vive la INTENCIÓN.

## Ahora (en curso)

- **EPIC-001 — Spike de ingesta.** *(Redefinida el 2026-08-31: ver más abajo.)*
  Responder si hay fuentes automáticas usables y si son independientes entre sí.
  Entregable: **un veredicto con evidencia citada**, no las cuatro cifras.
  Las tres specs están hechas y verificadas; **lo único que queda es correr la
  ventana de observación**. Antes hay que escribir la fecha de purga (ADR-009
  §4.1) y conseguir los `robots.txt`.

**Bloqueante fuera del código:** contratar el dominio `.gal` y los handles.
No depende de EPIC-001 y no debería esperar a ella.

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
- Landing con lista de espera. Objetivo declarado: 500 inscritos antes del producto.
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
  depende de que el dato exista.
- **Corte duro de EPIC-001:** si la métrica de operación supera con mucho los
  30 min por jornada, el problema no es de interfaz sino de modelo de negocio, y
  la siguiente épica es "comunidad de corresponsales", no "producto".
- **Corte duro de conflictos:** > 15 % obliga a rediseñar el motor antes de
  ampliar competiciones — salvo que el test de espejo dicte que las fuentes
  automáticas no son independientes: entre espejos no hay desacuerdo posible, así
  que en ese escenario la cifra no mide lo que su nombre dice y el corte no
  aplica. **Los dos cortes duros son de EPIC-002**, que es donde viven ahora esas
  cifras.
