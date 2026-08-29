---
id: ADR-006
tipo: adr
estado: aprobada
historial:
  - {estado: borrador, fecha: 2026-08-29, por: sdd-arquitecto}
  - {estado: aprobada, fecha: 2026-08-29, por: Alberto Fojo}
aprobada-por: Alberto Fojo
---
# ADR-006: Acceso a datos — migraciones y representación temporal

- Deciders: propone sdd-arquitecto. **Aprobado por Alberto Fojo el 2026-08-29**, mantenido como ADR y no plegado en SPEC-001: ata a todas las specs que toquen esquema o contrato.
- Specs relacionadas: SPEC-001 (modelo canónico y raw store), que lo origina.
- Relacionado: ADR-001 (stack), ADR-004 (plataforma), ADR-005 (raw store).

## Contexto

SPEC-001 tiene que crear el esquema de Postgres del modelo canónico. Al hacerlo
aparecen dos preguntas que ningún ADR aprobado responde y que constriñen a todas
las specs siguientes de EPIC-001 —cualquiera que añada una tabla, una columna o
un campo al contrato del snapshot—, así que no deben quedar enterradas dentro de
una spec.

**Migraciones.** ADR-001 fija el stack pero no dice cómo evoluciona el esquema.
El ecosistema Node empuja hacia un ORM con migraciones generadas (Drizzle,
Prisma). El proyecto tiene seis tablas, un `array` de texto y tres triggers de
plpgsql, y algunos de sus invariantes más importantes —RN-12 y RN-13— viven
precisamente en esos triggers y en `CHECK` sobre arrays, que es la zona donde los
generadores de esquema son más flojos y donde el SQL escrito a mano es más
legible que su equivalente en el DSL de un ORM.

**Tiempo.** El modelo canónico tiene cinco campos temporales (`kickoff`,
`observed_at`, `decided_at`, `confirmed_at`, `stored_at`) y ADR-001 eligió Node
por una razón concreta: que el mismo tipo lo importen la ingesta y el frontend.
Ese tipo cruza por JSON. `Date` no sobrevive a `JSON.stringify` /
`JSON.parse`: sale como cadena y no vuelve a entrar como `Date`. La forma de
representar el tiempo deja de ser un detalle interno y pasa a ser parte del
contrato público.

## Decisión

**1. Migraciones: ficheros SQL numerados, aplicados por un runner mínimo. Sin ORM.**

- `migrations/NNNN_<slug>.sql`, aplicados en orden lexicográfico.
- Una tabla `schema_migrations (version text primary key, applied_at timestamptz)`.
- `npm run db:migrate` aplica las pendientes dentro de una transacción por
  fichero y registra la versión. Volver a ejecutarlo no aplica nada.
- **No hay rollback automático.** Deshacer se hace escribiendo la migración
  siguiente.
- El acceso a datos es `postgres.js` con SQL etiquetado, sin capa de ORM.
  (La elección del driver la confirma SPEC-001, porque ADR-001 la dejó
  explícitamente "a confirmar en la spec".)

**2. Tiempo: cadena ISO 8601 en UTC con `Z`, no `Date`.**

- En los esquemas zod, todo instante es `z.iso.datetime({ offset: false })`,
  es decir `string`.
- Se normaliza a UTC y con sufijo `Z` en el borde de entrada. No se guardan
  desplazamientos locales en el modelo.
- En Postgres las columnas son `timestamptz`; la conversión a cadena UTC ocurre
  en la capa de acceso a datos, no en los llamantes.
- Consecuencia directa y comprobable: un valor del modelo canónico serializado a
  JSON y vuelto a parsear con el mismo esquema es idéntico al original (CA-2 de
  SPEC-001).

## Consecuencias

### Positivas
- Los invariantes duros (RN-12, RN-13, RN-09 a nivel de base) se escriben en el
  SQL en el que van a ejecutarse, sin traducción intermedia. El `CHECK` sobre
  `cardinality(supporting_observation_ids)` y el trigger de inmutabilidad se leen
  tal cual son.
- Una dependencia menos, y ninguna generación de código que mantener
  sincronizada. ADR-001 celebraba "no hay codegen que mantener ni que se pueda
  pudrir"; un ORM con migraciones generadas lo reintroduce por la puerta de atrás.
- El mismo tipo cruza a frontend por JSON sin serializador especial
  (`superjson` y equivalentes). Era la razón declarada de elegir Node.
- Un tiempo que es `string` es trivialmente comparable, ordenable y estable en
  fixtures y en snapshots de test — y el replay de jornadas de EPIC-001 vive de
  fixtures estables.

### Negativas / follow-ups
- **El SQL y los esquemas zod pueden separarse.** Es el riesgo real de no tener
  ORM: nada obliga a que la columna exista. Mitigación: CA-14 de SPEC-001 compara
  `information_schema.columns` con las claves del esquema zod y falla si divergen.
  Sin ese test, esta decisión es mala.
- **Sin tipado del resultado de las consultas.** `postgres.js` devuelve `any`;
  hay que parsear con el esquema zod al salir de la base. Es un `.parse()` por
  consulta, y a la vez es la única razón por la que CA-14 puede existir.
- **`string` no impide construir una fecha inválida** en tiempo de compilación
  como haría un tipo nominal. El esquema zod la rechaza en runtime; el tipo, no.
  Se acepta: el coste de un tipo *branded* para instantes no lo paga un spike.
- Aritmética de fechas requiere convertir a `Date` en el punto de uso. Es
  molesto en el motor de decisiones (RN-06, RN-07 son puro cálculo temporal) y
  esa spec cargará con ello.
- **Sin rollback automático.** Aceptable con seis tablas y una semana de spike;
  reevaluable si el esquema se vuelve activo en producción.

## Alternativas consideradas

- **Drizzle ORM + drizzle-kit.** La opción por defecto en Node/TypeScript hoy, y
  la más tentadora: deriva tipos del esquema y genera migraciones. Rechazada por
  dos motivos. Primero, los invariantes de este proyecto son triggers de plpgsql
  y `CHECK` sobre arrays, que acaban igualmente como SQL crudo dentro de la
  migración — con lo que se paga el ORM y no se cobra su ventaja donde importa.
  Segundo, tendría dos fuentes de tipos (el esquema de Drizzle y el de zod) y
  habría que reconciliarlas; ADR-001 eligió zod como fuente única precisamente
  para no tener dos. **Es la alternativa más seria y la que habría que reabrir si
  el esquema crece en producción.**
- **Prisma.** Descartada antes: esquema en un DSL propio (tercera fuente de
  verdad), cliente generado, y un runtime pesado para funciones sin estado en
  Vercel (ADR-004).
- **`Date` en el modelo, con `superjson` en el borde.** Mejor ergonomía dentro
  del motor. Rechazada porque mete un serializador especial en el contrato que
  ADR-001 quería trivial, y porque cualquier consumidor futuro del feed —el
  "datos como negocio" de FOUNDATION.md §Alcance— recibiría un JSON con forma
  propia en vez de ISO 8601 estándar.
- **Epoch en milisegundos (`number`).** Sobrevive a JSON y es el más barato de
  comparar. Rechazado por ilegible: los fixtures de replay y el raw store se leen
  a ojo cuando algo falla un sábado, y `1774288800000` no dice nada mientras que
  `2026-03-21T17:00:00Z` sí.
- **Migraciones a mano, sin runner ni tabla de versiones.** Lo bastante para una
  semana. Rechazado porque el spike se despliega en Vercel y el esquema tiene que
  aplicarse igual en local, en test y en producción; sin registro de versión eso
  es cuestión de memoria.
