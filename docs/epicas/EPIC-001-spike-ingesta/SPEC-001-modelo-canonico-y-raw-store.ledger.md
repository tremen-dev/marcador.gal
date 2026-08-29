---
id: SPEC-001
tipo: ledger
epica: EPIC-001
---
# Ledger — SPEC-001 Modelo canónico y raw store

## Resumen
- Fase: **aprobada** por Alberto Fojo el 2026-08-29. Lista para sdd-implementador.

## Decisiones del gate humano (2026-08-29)

- **Entorno de verificación:** rama de test de **Neon** (desechable por ejecución)
  y store de **Vercel Blob real**. Mismo motor que producción. `DATABASE_URL_TEST`
  y `BLOB_READ_WRITE_TOKEN` son requisito: sin ellos, CA-9 y CA-13..CA-17 están
  **incumplidos**, no saltados. La salida del comando va pegada aquí, con los
  casos ejecutados visibles.
- **Normalización de alias (CA-5):** se mantiene tacaña. El spike mide el coste
  real de RN-09; relajarla, si procede, será una decisión posterior con cifras y
  por ADR.
- **ADR-006:** se mantiene como ADR, no se pliega en esta spec. Aprobado el mismo
  día.
- Rama: `ft/SPEC-001-modelo-canonico-y-raw-store`

## Matriz de criterios de aceptación
<!-- Escritores: sdd-implementador rellena Implementado y Test; sdd-verificador rellena Verif. y Estado. Nunca al revés. -->
<!-- Estados por CA: ✅ cerrado · ⚠️ parcial/con salvedad · 🚧 en curso · ❌ sin empezar · n-a -->
<!-- Un CA está ✅ solo cuando Implementado + Test + Verif. aplicables están en verde. Una salvedad se marca ⚠️, nunca ✅. -->
| CA | Implementado (fichero) | Test (fichero/caso) | Verif. | Estado |
|---|---|---|---|---|
| CA-1 esquemas zod y tipos | | | | ❌ |
| CA-2 round-trip JSON y frontend | | | | ❌ |
| CA-3 RN-12 nivel tipo | | | | ❌ |
| CA-4 RN-09 nivel tipo | | | | ❌ |
| CA-5 RN-09 resolución de alias | | | | ❌ |
| CA-6 RN-13 nivel tipo y runtime | | | | ❌ |
| CA-7 marcador según estado | | | | ❌ |
| CA-8 MatchQualifier en galego | | | | ❌ |
| CA-9 contrato RawStore ×2 | | | | ❌ |
| CA-10 clave determinista y segura | | | | ❌ |
| CA-11 RN-10 orden raw→parse | | | | ❌ |
| CA-12 RN-10 raw_ref obligatorio | | | | ❌ |
| CA-13 migración idempotente | | | | ❌ |
| CA-14 paridad esquema↔zod | | | | ❌ |
| CA-15 RN-12 nivel Postgres | | | | ❌ |
| CA-16 RN-13 nivel Postgres | | | | ❌ |
| CA-17 RN-09 nivel Postgres | | | | ❌ |

## Veredicto del verificador
<!-- GREEN/RED + fecha + resumen. Lo escribe SOLO sdd-verificador. -->

Pendiente. Requisito explícito de la spec (Notas para el gate humano §3):
**CA-9 y CA-13..CA-17 no pueden marcarse ✅ con la suite en modo `skip`.**
El verificador debe pegar aquí la salida de:

```
DATABASE_URL_TEST=... npm run test -- tests/db
BLOB_READ_WRITE_TOKEN=... npm run test -- tests/raw
npm run typecheck
```

mostrando los casos **ejecutados**, no saltados. Una suite verde por ausencia de
credenciales es un RED, no un GREEN.

## Evidencia visual
<!-- Tabla CA → captura en _qa/SPEC-001/. Informe HTML opcional: _qa/SPEC-001/informe.html -->
n-a: esta spec no tiene superficie de UI.

## Salvedades / follow-ups
<!-- IDs F-SPEC-001-1, F-SPEC-001-2… con destino (spec futura o EPIC-MEJORA). -->
Abiertas ya en el momento de redactar (ver *Notas para el gate humano* de la spec):

- **F-SPEC-001-1** — Política de retención del raw store. ADR-005 la deja abierta
  y avisa de crecimiento monótono. Destino: antes de producción, ADR propio.
- **F-SPEC-001-2** — `CLAUDE.md` contradice ADR-001 (sección Stack sigue en
  Python/FastAPI) y su sección Estructura no contempla `src/model/`, `src/raw/`,
  `src/db/` ni `migrations/`. Destino: el humano, fuera del pipeline de specs.
- **F-SPEC-001-3** — Implementación de `ObservationStore` y `DecisionStore` contra
  Postgres. Aquí solo se definen los puertos. Destino: la primera spec que los
  necesite (previsiblemente la del motor de decisiones).
- **F-SPEC-001-4** — Mapa de pesos por fuente (RN-01). Destino: spec del motor.

## Cómo retomar (handoff)
<!-- Estado real del trabajo para la siguiente sesión: qué está hecho, qué falta, dónde seguir. -->
Escrita la spec y ADR-006, ambos en `borrador`. **Nada implementado.**

Lo siguiente es el gate humano sobre los cinco puntos de *Notas para el gate
humano*, en particular: (1) normalización tacaña de alias, (2) `raw_ref`
obligatorio también para panel y Telegram, (3) qué Postgres se usa para los
tests, (4) si ADR-006 se acepta o se pliega dentro de la spec.

Con `aprobada`, sdd-implementador empieza por CA-1 y CA-3: los tipos y RN-12 son
la base de todo lo demás, y CA-3 es el que decide si el enfoque
"imposible antes que validable" funciona en la práctica con zod v4.
