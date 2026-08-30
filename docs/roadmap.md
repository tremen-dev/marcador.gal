---
tipo: roadmap
---
# Roadmap — marcador.gal

> Curado por sdd-producto. Secuencia de épicas, horizonte y criterios de corte.
> El estado fino por spec vive en el tablero; aquí vive la INTENCIÓN.

## Ahora (en curso)

- **EPIC-001 — Spike de ingesta.** Medición sobre Tercera RFEF G1 + Preferente
  Futgal G1. Entregable: cuatro cifras (latencia, cobertura, conflictos,
  operación) y una lista de fallos. Nada más está en curso hasta que existan.

**Bloqueante fuera del código:** contratar el dominio `.gal` y los handles.
No depende de EPIC-001 y no debería esperar a ella.

## Después (comprometido, sin empezar)

- **Decisión go / no-go** a partir del informe de EPIC-001. Es un gate humano, no
  una épica: puede matar el proyecto, reducirlo o confirmarlo.
- **Conversación con la RFGF.** El objetivo del spike es llegar con números:
  "vuestro dato, nuestra pantalla". Solo tiene sentido con el informe en la mano.

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

- **Sube** lo que aporte evidencia para el go/no-go. Nada más compite con EPIC-001.
- **Baja** todo lo que dependa de una cifra que aún no tenemos. Interfaz, marca y
  patrocinio no se tocan antes del informe: son caros de rehacer y su valor
  depende de que el dato exista.
- **Corte duro de EPIC-001:** si la métrica de operación supera con mucho los
  30 min por jornada, el problema no es de interfaz sino de modelo de negocio, y
  la siguiente épica es "comunidad de corresponsales", no "producto".
- **Corte duro de conflictos:** > 15 % obliga a rediseñar el motor antes de
  ampliar competiciones — salvo que SPEC-002 dicte que ninguna fuente automática
  es independiente de futgal: entre espejos no hay desacuerdo posible, así que en
  ese escenario la cifra no mide lo que su nombre dice y el corte no aplica.
