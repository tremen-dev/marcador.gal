---
id: SPEC-011
tipo: ledger
epica: EPIC-002
---
# Ledger — SPEC-011 Catálogo de alias declarado y resolución de identidad de partido

## Resumen

- **LO ÚLTIMO (2026-09-02): la spec nace en `borrador`, junto con ADR-018
  (`borrador`), y espera el gate humano.** Escrita por `sdd-arquitecto` sobre
  la rama `ft/EPIC-002-spec-catalogo-de-alias`, siguiendo la descomposición
  orientativa de `_epica.md` (la pieza siguiente tras SPEC-010). Nada
  implementado: no hay código, tests ni migración. El término **catálogo de
  alias declarado** se añadió a `dominio.md` en el mismo commit, como la spec
  exige.

## Decisiones que el gate tiene que mirar

Las diez notas de la spec (§*Notas para el gate humano*), y en particular:

1. **ADR-018 entero**, que la spec ejecuta: reemplazo al cargar (contradicción
   deliberada con ADR-017 §2), «declarar es confirmar» como lectura de RN-09
   sin LLM, y resolución todo o nada sin desempate.
2. Que el **fichero real de los 36 equipos queda fuera de alcance**, bloqueado
   por el fichero real del calendario y por los dictámenes de `sdd-competicion`
   y `sdd-legal-datos` (notas §6 y §7 de la spec).

## Criterios de aceptación

| CA | Estado | Evidencia |
|---|---|---|
| CA-1 esquema del fichero | ⬜ | — |
| CA-2 carga con reemplazo transaccional | ⬜ | — |
| CA-3 registro `alias_loads` inmutable | ⬜ | — |
| CA-4 `PostgresAliasStore` | ⬜ | — |
| CA-5 resolver todo o nada (dobles) | ⬜ | — |
| CA-6 integración real punta a punta | ⬜ | — |
| CA-7 CLI `alias:cargar` | ⬜ | — |
| CA-8 `migrations/0004` | ⬜ | — |
| CA-9 gates y suites cerradas | ⬜ | — |

## Cómo retomar

1. La spec está en `borrador`: el gate humano decide sobre ella y sobre
   ADR-018. `aprobada` la firma solo una persona.
2. Si se aprueba, `sdd-implementador` trabaja en una rama que nombre
   `SPEC-011` (p. ej. `ft/SPEC-011-catalogo-de-alias`), CA a CA, con
   `DATABASE_URL_TEST` desde CA-2.
3. Si el gate cambia ADR-018, cambian CA-1..CA-5: revisar antes de implementar.
