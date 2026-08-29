# CLAUDE.md — marcador.gal

Marcador de resultados del fútbol galego y de las divisiones nacionales en una
sola pantalla. Relevo, con nombre e imagen propios, de la desaparecida
marcadorgalego.gal. Este documento orienta a Claude Code en este repositorio.

## Cómo se trabaja aquí

Estándar **tremen-sdd**. Antes de tocar nada:

1. Lee `FOUNDATION.md` — constitución del proyecto, decisiones **D-1..D-8 locked**.
   Solo un ADR aceptado puede reinterpretarlas.
2. Lee `docs/fundacion/contexto.md` — contexto maestro: dónde estamos y por qué.
3. Todo trabajo entra por `/sdd-orquestador`. **Nada se codea sin SPEC aprobada.**
   El estado `aprobada` lo firma una persona; ningún rol `sdd-*` puede firmarlo.
4. El estado vive en el frontmatter de cada artefacto. `docs/tablero.md` es
   **generado**: regenéralo con `/sdd-tablero`, nunca lo edites a mano.
5. Toda decisión de arquitectura es un ADR en `docs/adr/`. Si vas a tomar una,
   escribe el ADR primero. Un ADR aceptado es inmutable: para cambiarlo, otro ADR
   que lo supersede.
6. El Verificador comprueba contra la spec, no contra la intención.

Roles: `/sdd-orquestador` (entrada), `/sdd-producto`, `/sdd-arquitecto`,
`/sdd-implementador`, `/sdd-verificador`, `/sdd-documentalista`, `/sdd-como-vamos`.
Roles de dominio consultivos: `/sdd-competicion`, `/sdd-legal-datos`,
`/sdd-lingua`. Dictaminan y citan fuente; no implementan.

## Estado actual

Fase: **spike de ingesta** (`EPIC-001`). Objetivo: medir latencia, cobertura,
conflictos y minutos de operación manual con Tercera RFEF G1 + Preferente Futgal
G1. Sin código todavía: no existe `src/`.

Los tres ADRs están en **borrador**, no firmados. Se escribieron antes de adoptar
el método y están a la espera de revalidación: no los trates como cerrados.

## Reglas duras

Las reglas de negocio viven **numeradas y en un solo sitio**:
`docs/fundacion/reglas.md` (**RN-01..RN-13**). Cítalas por su número desde specs,
ADRs y commits; no las repitas aquí ni las parafrasees en el código. Las que más
se incumplen por descuido:

- **RN-08**: ninguna fuente publica un marcador sin pasar por el motor de decisiones.
- **RN-09**: un LLM nunca es la única fuente de un marcador. Alias y parseo de
  mensajes de corresponsal: salida JSON validada **y confirmación humana**.
- **RN-10**: toda respuesta cruda se guarda en el raw store **antes** de parsearse.
- **RN-11**: scraping con robots.txt, user-agent identificado y máximo 1
  petición/minuto por competición. Es medición, no producción.
- **RN-12**: cada Decision registra la regla aplicada y las observaciones que la
  sostienen.

El glosario canónico está en `docs/fundacion/dominio.md`. Si un término falta, se
añade allí **antes** de usarse.

## Lenguas

- Documentación, specs, ADRs y commits: **castellano**.
- Código, identificadores y comentarios: **inglés**.
- Todo texto visible al usuario (UI, bot, notificaciones): **galego** por defecto,
  con castellano como opción (**D-2**). Los literales van en ficheros de i18n
  desde el primer día; nunca hardcodeados.
- Nombres de equipos y competiciones: los **canónicos de la RFGF**. No se traducen
  (ver `dominio.md`).

## Stack (ADR-001, en borrador)

Python 3.12 · FastAPI · httpx · APScheduler · selectolax · python-telegram-bot ·
pydantic · Postgres. Sin colas, sin Kubernetes, sin Redis hasta que un ADR lo
justifique.

## Estructura

```
src/ingest/   adaptadores por fuente + scheduler
src/decide/   modelo canónico + motor de decisiones
src/api/      snapshot + stream SSE
src/admin/    panel mínimo de correcciones y alertas (móvil)
tests/        replay de jornadas sobre HTML guardado
raw/          respuestas crudas de fuentes (no versionar contenido)

FOUNDATION.md            constitución (D-1..D-8 locked)
docs/tablero.md          estado agregado (GENERADO)
docs/roadmap.md          secuencia de épicas
docs/fundacion/          contexto, visión, dominio, reglas, retos
docs/epicas/             épicas y sus specs
docs/adr/                ADRs
docs/negocio/            monetización y marca
```

## Principios de marca (para Frontend y cualquier texto)

- Fútbol en galego, urbano o no. Nada de tópicos rurales en imagen ni tono. La
  Preferente se juega en Vigo, A Coruña, Ourense y Ferrol igual que en cualquier
  vila.
- El producto es densidad: todo en una pantalla, números tabulares, legible con
  mala cobertura.
- No presentarse como continuación de Marcador Galego; inspiración, no sucesión
  (**D-1**).

## Lo que NO está en alcance del spike

Interfaz definitiva, usuarios, notificaciones push, más competiciones,
patrocinio, logo. El nombre ya está decidido (marcador.gal); el dominio, sin
contratar.
