# Runbook — configurar el entorno de SPEC-001

> Para levantar el proyecto en una máquina limpia y desbloquear los criterios
> que hoy están pendientes de credenciales. Estado a 2026-08-29.

## 0. Antes de nada: la rama

**El código NO está en `main`.** `main` solo tiene documentación; la
implementación de SPEC-001 vive en su rama, como exige el gate `require-spec`
(el hook obliga a `ft/SPEC-NNN-slug`).

```bash
git clone https://github.com/tremen-dev/marcador.gal.git
cd marcador.gal
git checkout ft/SPEC-001-modelo-canonico-y-raw-store   # <- imprescindible
npm install
```

Requisito: **Node 22 o superior**. Los scripts ejecutan TypeScript directamente
(`node src/db/cli.ts`), que depende del *type stripping* de Node 22.

Comprobación de que la máquina está bien antes de tocar credenciales:

```bash
npm run typecheck    # exit 0
npm test             # 23 ficheros, 270 tests, sin errores de tipo
```

Si eso está verde, todo lo que no depende de credenciales funciona.

## 1. Postgres (Neon)

Hacen falta **dos** cadenas de conexión distintas, no una:

| Variable | Para qué | Cuál |
|---|---|---|
| `DATABASE_URL` | `npm run db:migrate` | Rama principal, **conexión con pooler** |
| `DATABASE_URL_TEST` | `npm run test:db` | **Rama de test, desechable** |

**Deben ser distintas.** Las suites de CA-13 a CA-17 escriben y truncan tablas:
apuntar `DATABASE_URL_TEST` a la rama principal borra datos.

Pasos:
1. Crear un proyecto en Neon (región europea, por latencia).
2. Copiar la *Pooled connection string* de la rama principal → `DATABASE_URL`.
3. Crear una rama de test (`test`) desde la principal.
4. Copiar su cadena → `DATABASE_URL_TEST`.

## 2. Vercel Blob

1. En el proyecto de Vercel, crear un store de **Blob**.
2. Copiar el token de lectura/escritura → `BLOB_READ_WRITE_TOKEN`.

## 3. Escribir `.env.local`

```bash
cp .env.example .env.local
# rellenar los tres valores
```

`.env.local` está en `.gitignore` y **nunca se versiona**. No hace falta exportar
nada: `db:migrate`, `test:db` y `test:blob` lo cargan solos con
`--env-file-if-exists`.

## 4. Aplicar la migración y verificar

```bash
npm run db:migrate     # crea las seis tablas + schema_migrations
npm run db:migrate     # segunda vez: no-op (CA-13)
npm run test:db        # CA-7 (Postgres), CA-12, CA-13..CA-19
npm run test:blob      # mitad de Blob de CA-9
```

**Antes de configurar, los dos últimos fallan con `exit 1` y un mensaje que cita
el gate del 2026-08-29. Eso es lo correcto, no un error.** Se decidió que sin
credenciales esos criterios están **incumplidos, no saltados**: una suite verde
por no haber probado nada es el peor fallo posible en un gate.

## 5. Qué desbloquea esto

Con las tres variables puestas quedan verificables los criterios que hoy están
escritos pero nunca ejecutados: la mitad de Blob de CA-9, la columna de CA-12,
CA-13 a CA-17, y los niveles de Postgres de CA-7, CA-18 y CA-19.

Después, y solo después, le toca a `sdd-verificador` emitir GREEN o RED contra
los criterios de SPEC-001, con la salida pegada en el ledger.

## Problemas conocidos

- **`tests/db/parity.test.ts` (CA-14)** consulta
  `information_schema.constraint_column_usage`, que solo devuelve las
  restricciones cuyo rol es el dueño. En una rama de Neon debería serlo, pero es
  el punto más probable de retoque la primera vez.
- **La migración `0001` no se ha aplicado nunca a ninguna base.** Es su estreno:
  si algo del SQL está mal, sale aquí. No existe una `0002` y no debe crearse
  para arreglar la `0001` mientras siga sin aplicarse en ningún sitio real.
