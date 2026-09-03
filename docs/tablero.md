<!-- GENERADO por tremen-sdd (scripts/tablero.mjs). NO EDITAR A MANO. -->
# Tablero

Actualizado: 2026-09-03

## EPIC-001 — spike-ingesta (aprobada)

| Spec | Estado | Último cambio |
|---|---|---|
| SPEC-001 — modelo-canonico-y-raw-store | hecho | 2026-08-29 (sdd-verificador) |
| SPEC-002 — test-de-espejo-entre-fuentes-automaticas | hecho | 2026-08-31 (sdd-verificador) |
| SPEC-003 — test-de-espejo-sin-referencia-el-cruce-entre-candidatas | hecho | 2026-08-31 (sdd-verificador) |

## EPIC-002 — instrumentacion-de-las-cuatro-cifras (aprobada)

| Spec | Estado | Último cambio |
|---|---|---|
| SPEC-008 — adaptador-de-ceroacero-es-y-cortesia-rn-11-con-una-sola-implementacion | hecho | 2026-09-01 (sdd-verificador) |
| SPEC-009 — la-frontera-de-capacidad-de-rn-11-demostrada-sin-listas-negras | hecho | 2026-09-02 (sdd-verificador) |
| SPEC-010 — calendario-declarado-a-mano-y-repositorios-de-observation-y-decision-en-postgres | hecho | 2026-09-02 (sdd-verificador) |
| SPEC-011 — catalogo-de-alias-declarado-y-resolucion-de-identidad-de-partido | hecho | 2026-09-02 (sdd-verificador) |
| SPEC-012 — cron-de-ingesta-el-tick-que-abre-ventanas-por-partido-y-persiste-observation | hecho | 2026-09-02 (sdd-verificador) |
| SPEC-013 — motor-de-decisiones-el-reducer-puro-de-rn-01-rn-07-y-el-ciclo-que-lo-ejecuta | hecho | 2026-09-02 (sdd-verificador) |
| SPEC-015 — bot-de-telegram-del-corresponsal-el-llm-propone-dentro-de-una-lista-cerrada-y-la-persona-confirma | hecho | 2026-09-03 (sdd-verificador) |
| SPEC-016 — el-catalogo-de-corresponsales-se-resuelve-en-compilacion-y-npm-run-build-pasa-a-ser-gate | hecho | 2026-09-03 (sdd-verificador) |

## EPIC-003 — paxina-de-proxecto-e-respaldo-publico-da-carta (hecho)

| Spec | Estado | Último cambio |
|---|---|---|
| SPEC-004 — sitio-publico-de-proyecto-en-marcador-gal-i18n-contenido-y-despliegue | hecho | 2026-08-31 (sdd-verificador) |
| SPEC-005 — pagina-del-rastreador-y-alineamiento-del-user-agent-declarado | hecho | 2026-09-01 (sdd-verificador) |
| SPEC-006 — titulo-de-documento-por-pagina | hecho | 2026-09-01 (sdd-verificador) |
| SPEC-007 — el-sitio-no-nombra-a-ninguna-persona-y-dice-en-general-que-se-mide | hecho | 2026-09-01 (sdd-verificador) |

## EPIC-004 — identidade-visual-e-interface-do-marcador (aprobada)

| Spec | Estado | Último cambio |
|---|---|---|

## EPIC-MEJORA (aprobada)

| Spec | Estado | Último cambio |
|---|---|---|
| SPEC-014 — la-carrera-entre-la-suite-que-escribe-en-el-arbol-y-la-que-lo-lee | hecho | 2026-09-02 (sdd-verificador) |

## ADRs

| ADR | Estado | Título | Último cambio |
|---|---|---|---|
| ADR-001 | aprobada | stack | 2026-08-29 (Alberto Fojo) |
| ADR-002 | aprobada | fuentes-spike | 2026-08-29 (Alberto Fojo) |
| ADR-003 | aprobada | sse | 2026-08-29 (Alberto Fojo) |
| ADR-004 | aprobada | plataforma | 2026-08-29 (Alberto Fojo) |
| ADR-005 | aprobada | raw-store | 2026-08-29 (Alberto Fojo) |
| ADR-006 | aprobada | acceso-a-datos-migraciones-y-representacion-temporal | 2026-08-29 (Alberto Fojo) |
| ADR-007 | aprobada | linter-oxlint-en-lugar-de-eslint | 2026-08-30 (Alberto Fojo) |
| ADR-008 | aprobada | fuentes-capturables-del-spike-tras-el-dictamen-legal | 2026-08-31 (Alberto Fojo) |
| ADR-009 | aprobada | retencion-del-raw-store-plazo-de-conservacion-y-purga | 2026-08-31 (Alberto Fojo) |
| ADR-010 | aprobada | un-solo-despliegue-para-el-sitio-de-proyecto-y-el-futuro-producto | 2026-09-01 (Alberto Fojo) |
| ADR-011 | aprobada | identidad-publica-del-rastreador-forma-estable-del-user-agent | 2026-09-01 (Alberto Fojo) |
| ADR-012 | aprobada | identidad-publica-del-sitio-sin-nombre-con-paraguas-y-con-buzon-delante | 2026-09-01 (Alberto Fojo) |
| ADR-013 | aprobada | semantica-visual-del-marcador-el-acento-de-marca-nunca-es-un-color-de-estado | 2026-09-01 (Alberto Fojo) |
| ADR-014 | aprobada | la-cortesia-rn-11-tiene-un-solo-dueno-y-sale-de-src-mirror | 2026-09-01 (Alberto Fojo) |
| ADR-015 | aprobada | que-pasa-cuando-una-decision-posterior-invalida-un-ca-de-una-spec-cerrada | 2026-09-01 (Alberto Fojo) |
| ADR-016 | aprobada | como-se-demuestra-una-frontera-de-capacidad-se-enumera-lo-permitido-y-el-resto-tiene-que-ser-vacio | 2026-09-01 (Alberto Fojo) |
| ADR-017 | aprobada | calendario-declarado-a-mano-y-persistencia-del-modelo-canonico | 2026-09-02 (Alberto Fojo) |
| ADR-018 | aprobada | el-catalogo-de-alias-es-una-declaracion-humana-que-se-reemplaza-al-cargar-y-la-identidad-se-resuelve-todo-o-nada | 2026-09-02 (Alberto Fojo) |
| ADR-019 | aprobada | el-tick-de-ingesta-sin-proceso-vivo-ventanas-por-partido-medicion-acotada-y-estado-durable | 2026-09-02 (Alberto Fojo) |
| ADR-020 | aprobada | retencion-del-archivo-de-las-jornadas-de-medicion-de-epic-002-y-el-raw-ref-colgante-como-estado-declarado | 2026-09-02 (Alberto Fojo) |
| ADR-021 | aprobada | el-motor-de-decisiones-reducer-puro-sobre-los-dos-logs-ejecutado-dentro-del-tick-con-la-alerta-como-tabla-y-el-cualificador-derivado | 2026-09-02 (Alberto Fojo) |
| ADR-022 | aprobada | el-bot-del-corresponsal-es-un-webhook-sin-conversacion-viva-identidad-seudonima-declarada-update-redactado-y-un-llm-que-propone-dentro-de-una-lista-cerrada | 2026-09-03 (Alberto Fojo) |
| ADR-023 | aprobada | retencion-y-regimen-de-datos-personales-del-archivo-del-corresponsal-el-regimen-b-extendido-y-el-borrado-del-mapeo-como-remedio | 2026-09-03 (Alberto Fojo) |

## Resumen

- hecho: 16
