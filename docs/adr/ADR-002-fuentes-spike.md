---
id: ADR-002
tipo: adr
estado: borrador
historial:
  - {estado: borrador, fecha: 2026-08-29, por: sdd-arquitecto}
---
# ADR-002: Fuentes de datos del spike

- Deciders: propone sdd-arquitecto; aprueba el humano. **Sin aprobar todavía**: redactado antes de adoptar tremen-sdd y reabierto a propósito al migrar (2026-08-29).
- Specs relacionadas: pendientes (EPIC-001).

## Contexto

El spike cubre dos competiciones: Tercera RFEF grupo 1 (representa lo nacional)
y Preferente Futgal grupo 1 (representa lo galego). Ambas las organiza la RFGF,
así que futgal.es es fuente oficial para las dos.

El motor de decisiones (RN-02, RN-03) exige al menos dos fuentes por competición
para poder publicar confirmado, y una de las preguntas del spike es si las
fuentes disponibles son realmente independientes o espejos unas de otras.

## Decisión

Tres fuentes en el spike:

1. **futgal.es** — fuente oficial para Preferente Futgal G1 y Tercera RFEF G1. HTML, sin API.
2. **ceroacero.es** — contraste para ambas competiciones, a ritmo bajo.
3. **Bot de Telegram** — corresponsal humano, push, gratis.

Quedan **fuera** del spike: API-Football, BeSoccer API y X API.

El backend de la app de la RFGF se explora observando el tráfico de la app
(proxy local) **solo** para conocer qué datos publica y con qué latencia. No se
construye nada sobre él.

## Consecuencias

### Positivas
- Cobertura oficial de las dos competiciones con una sola fuente.
- Coste cero en licencias durante el spike.
- Se mide directamente si ceroacero es fuente independiente o espejo de futgal,
  que es lo que decide si RN-02 (dos fuentes ≥ 0.7 coincidentes) es aplicable.

### Negativas / follow-ups
- Si ceroacero resulta ser espejo de futgal, el spike se queda con **una** fuente
  automática independiente por competición y el motor solo podrá publicar
  provisional sin intervención del corresponsal. Ese resultado es un hallazgo del
  spike, no un fallo.
- Producción con datos de la RFGF requiere **acuerdo con la federación**. El
  objetivo del spike es llegar a esa conversación con números: "vuestro dato,
  nuestra pantalla".
- Las ToS de ceroacero restringen el scraping. En el spike es medición (RN-11:
  robots.txt, user-agent identificado, máx. 1 petición/minuto por competición);
  en producción hay que sustituirla o licenciarla.

## Alternativas consideradas

- **Proveedor de pago (API-Football, Sportmonks, BeSoccer API) desde el día uno.**
  Rechazado: solo aporta valor cuando entren Primera y Segunda, que están fuera
  del alcance del spike. Además hay que confirmar la cobertura de Tercera RFEF G1
  en su listado de ligas antes de contratar nada.
- **X API v2 sobre cuentas de clubes.** Goles en segundos, pero cara para lo que
  da y con lectura limitada. Aparcada: se mide a mano en 3 partidos para saber si
  merece la pena más adelante.
- **Solo futgal.es.** Rechazado: sin segunda fuente no se puede medir la métrica
  de conflictos, que es una de las cuatro que deciden el proyecto.
