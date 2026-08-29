---
id: ADR-005
tipo: adr
estado: borrador
historial:
  - {estado: borrador, fecha: 2026-08-29, por: sdd-arquitecto}
---
# ADR-005: Raw store — puerto con dos implementaciones

- Deciders: propone sdd-arquitecto; aprueba el humano. **Sin firmar.**
- Specs relacionadas: pendientes (EPIC-001).
- Relacionado: ADR-004 (plataforma), RN-10.

## Contexto

RN-10 exige guardar toda respuesta cruda con timestamp **antes** de parsearla. Es
la pieza que permite reprocesar cuando un parser falla y reproducir una jornada
entera en tests; sin ella el spike deja de valer dentro de un año.

La §7 del documento fuente dejaba la implementación abierta: «tabla con JSONB o
ficheros en disco». Hay que cerrarla, y la decisión de plataforma (ADR-004) la
condiciona: **Vercel tiene sistema de ficheros efímero**, solo `/tmp` y sin
persistencia entre invocaciones. El disco, que era la opción preferida por coste y
simplicidad, no está disponible en producción.

Pero el disco no desaparece del problema: `tests/` hace replay de jornadas sobre
HTML guardado **en disco**, así que la implementación de lectura desde ficheros
hay que escribirla igualmente.

Volumen estimado: 2 competiciones × 2 fuentes HTTP × 1 respuesta/minuto durante
~6 h de juego ≈ 1.400 respuestas por jornada, de 100–300 KB cada una. Del orden de
**300 MB por jornada**.

## Decisión

`RawStore` es un **puerto** con una interfaz mínima —escribir una respuesta con su
timestamp y metadatos, leerla por clave, listar por prefijo— y **dos
implementaciones**:

- **Vercel Blob** en producción y en el despliegue del spike. Una clave por
  respuesta, con `fuente/competición/timestamp` en el nombre.
- **Disco** en desarrollo local y en tests, con el mismo esquema de claves
  traducido a rutas.

Los tests de replay corren siempre contra la implementación de disco.

## Consecuencias

### Positivas
- Cumple RN-10 en Vercel sin hinchar la base de datos con ~300 MB por jornada.
- Los tests no dependen de la red ni de credenciales: leen HTML del repositorio.
- La decisión de plataforma (ADR-004) queda desacoplada. Si tras EPIC-001 se
  migra a un VPS o a Cloudflare R2, cambia una implementación del puerto, no el
  motor ni los adaptadores.
- Sin esquema que migrar: el raw store no es un modelo, es un archivo.

### Negativas / follow-ups
- Dos implementaciones en vez de una. El coste es bajo —la interfaz es de tres
  operaciones— pero es más código del que un spike estricto necesitaría.
- El almacenamiento en Blob se factura aparte del plan Pro. A este volumen es
  despreciable, pero **crece de forma monótona**: hay que definir una política de
  retención antes de producción, y no está definida.
- Riesgo de divergencia entre las dos implementaciones. Mitigación: una única
  batería de tests de contrato que se ejecuta contra ambas.

## Alternativas consideradas

- **Solo disco.** Era la opción preferida: coste cero, sin esquema, `grep`
  funciona. Imposible en Vercel por el sistema de ficheros efímero. Vuelve a estar
  disponible si ADR-004 se revierte a VPS tras el spike.
- **Solo JSONB en Postgres.** Su virtud real es que sobrevive a cualquier cambio de
  plataforma sin tocar código. Rechazada por volumen: ~300 MB por jornada dentro
  de la BD del spike, y un replay más incómodo de escribir que leer ficheros.
- **S3 / Cloudflare R2 directamente.** Equivalente funcional a Blob y más barato en
  egreso. Rechazado para el spike por añadir un proveedor y credenciales más; es
  exactamente el escenario que el puerto deja abierto.
