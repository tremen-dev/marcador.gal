# 02 — Análisis de retos

## Legal / marca
- Nombre e imagen propios: elimina la dependencia del titular anterior. Registrar dominio (.gal) y marca (OEPM) al decidir el nombre.
- Resultados: son hechos, sin copyright. La extracción sistemática de bases de datos sí está protegida en la UE (derecho sui generis) y las ToS de agregadores prohíben scraping. El riesgo está en cómo se obtiene el dato, no en el dato.
- Escudos de clubes: marcas registradas. Política clara (uso informativo, o colores/iniciales).
- Datos "en directo" de Primera/Segunda: licencia de proveedor.
- Comunicación: inspiración en Marcador Galego, nunca sucesión. Contactar con el titular anterior por cortesía y por la comunidad.

## Datos (el reto de verdad)
- Fuente oficial galega: RFGF (futgal.es y su app). Cubre Preferente y también Tercera RFEF G1.
- Agregadores: ceroacero (todo, en directo), BeSoccer (Preferente y nacional), futbolme.
- Nacional: proveedor de pago (API-Football, Sportmonks, BeSoccer API).
- Clubes en redes y corresponsales humanos como fuentes rápidas.
- Objetivo estratégico: acuerdo de datos con la RFGF.

## Técnico
- Ingesta resiliente con múltiples fuentes, reconciliación con reglas trazables, humano en el bucle.
- Carga concentrada en sábado tarde y domingo; dimensionar para pico.
- Tiempo real: snapshot + SSE, fallback a polling.
- Ver docs/05-spike-ingesta.md.

## Diseño
- Recuperar lo que funcionaba (una pantalla, densidad) sin heredar la estética.
- Números tabulares, legible con sol y mala cobertura.
- Paleta que no sea la de ningún club grande.

## Operativo / sostenibilidad
- Exige presencia en fin de semana. Ingesta gallega no escala sin automatización o comunidad de corresponsales.
- Costes: dominio, hosting, API de datos (50–200 €/mes según directo).
- Métrica de operación (minutos manuales por jornada) decide la viabilidad.
