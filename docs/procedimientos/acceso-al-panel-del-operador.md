# Acceso al panel del operador

Procedimiento para configurar las dos variables de entorno que habilitan el acceso al panel del operador, y para generar el secreto y su digest. El panel es la interfaz de corrección de marcadores en tiempo real, con sesión declarada en la cookie `marcador_operador` (SPEC-017, ADR-024).

## Las dos variables de entorno

El panel requiere exactamente dos variables. Ambas son **obligatorias** para desplegar; sin ellas, el panel nace en estado seguro —cerrado y sin intentar arrancar.

### `ADMIN_SESSION_SECRET`

Secreto de firma de sesiones. El panel lo usa en HMAC-SHA256 para firmar la cookie de sesión de 8 horas de duración (ADR-024 §3, CA-1.5).

**Requisitos:**
- Mínimo **32 caracteres**.
- Debe ser criptográficamente aleatorio (no una frase fácil de adivinar).
- Se almacena **solo en variables de entorno**, nunca en repositorio.

**Qué pasa sin ella:**
- Ausente, vacía o más corta de 32 caracteres: error específico con nombre (`UnusableSessionSecretError`), el panel responde 401 a todas las rutas y **ningún endpoint funciona, ni siquiera lectura** (fallo cerrado, CA-1.1).

**Cómo se genera** (en local o en la línea de comandos del servidor):

```bash
SECRETO=$(openssl rand -hex 32)
echo "secreto de sesión (guárdalo en Vercel): $SECRETO"
```

Copiar ese valor exacto a la variable de entorno `ADMIN_SESSION_SECRET` en Vercel (Settings > Environment Variables). En local, copiar a `.env.local` para tests (no se versiona).

### `ADMIN_OPERATORS`

Catálogo de operadores con sus digests. Es un objeto JSON que declara quién puede acceder y qué secreto lo identifica (ADR-024 §2 y §3).

**Formato:**
```json
{
  "operador-01": "9f3a8e7d4b2c1a0f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a",
  "operador-02": "a1f2e3d4c5b6a7f8e9d0c1b2a3f4e5d6c7b8a9f0e1d2c3b4a5f6e7d8c9b0a"
}
```

Donde:
- Cada clave es un `operator_id` en forma `operador-\d+` (p. ej. `operador-01`, `operador-02`). **`operador-alberto` se rechaza** porque en un repositorio público, cruzado con el calendario declarado, un id con nombre identifica a una persona (ADR-024 §2, misma razón que `corresponsal-\d+` en ADR-022 §2).
- Cada valor es el **SHA-256 del secreto del operador EN HEXADECIMAL**, nunca el secreto mismo (64 caracteres en minúscula, caracteres `[0-9a-f]`).

**Validación del catálogo:**
- Objeto JSON válido. Si no parsea, se trata como vacío (no como error).
- Todas las claves deben casar con `^operador-\d+$`; **si una clave no valida, el catálogo entero se rechaza** (CA-1.2: una catalogación parcial no es razonable).
- Todos los valores deben ser digests SHA-256 en hexadecimal (64 caracteres `[0-9a-f]`).

**Qué pasa sin ella:**
- Ausente, vacía, inválida o sin capacidad de parsear: catálogo vacío, **nadie entra, y el módulo NO lanza error** (CA-1.2). Un panel que revienta al arrancar y uno apagado no pueden confundirse.

**Cómo se genera** (en local o en línea de comandos, NUNCA en el navegador):

```bash
# 1. Generar el secreto del operador (lo tecleará en el panel)
SECRETO=$(openssl rand -hex 32)
echo "secreto del operador (para teclear en el panel): $SECRETO"

# 2. Calcular el SHA-256 (esto es lo que va en ADMIN_OPERATORS)
DIGEST=$(printf %s "$SECRETO" | shasum -a 256 | cut -d' ' -f1)
echo "digest para ADMIN_OPERATORS: $DIGEST"

# 3. Construir el JSON
echo '{"operador-01": "'$DIGEST'"}'
```

**Orden operativo:**
1. Generar ambos comandos arriba para cada operador que vaya a usar el panel.
2. Guardar los **secretos** en un lugar seguro (último pass, 1Password, etc.); en Vercel **solo va el JSON de digests**.
3. Verificar que el JSON es válido: `echo '{"operador-01": "..."}' | jq '.'`
4. Copiar el JSON completo a `ADMIN_OPERATORS` en Vercel (Settings > Environment Variables).
5. Cada operador recibe su secreto por un canal seguro (mensajería privada, correo cifrado, presencial). El secreto se teclea UNA sola vez en el panel y se obtiene una cookie de 8 horas; no se repite hasta que la sesión caduca.

## Rutas y acceso

### Entrada

Las rutas de acceso son `/admin` (galego) y `/es/admin` (castellano).

```
https://marcador.gal/admin          → galego
https://marcador.gal/es/admin       → castellano
```

### Flujo de sesión

1. Operador abre `/admin` o `/es/admin`.
2. Página pide `operator_id` (p. ej. `operador-01`) y `secreto`.
3. Si coinciden: comparación en tiempo constante contra el digest (CA-1.3), se emite cookie `marcador_operador` con:
   - Cookie: `HttpOnly; Secure; SameSite=Strict; Path=/`
   - Duración: 8 horas desde el emisión (la expiración **viaja dentro de la firma**, no en `Max-Age`, CA-1.5)
   - Redirección: 303 a la pantalla del panel
4. Si no coinciden (id inválido, secreto incorrecto, o ambos): respuesta idéntica, mismo tiempo de respuesta (CA-1.4). No se distingue "operador no existe" de "secreto malo".

### Medidas de seguridad

- **Comparación en tiempo constante (CA-1.3):** el tiempo que tarda en rechazar no depende de dónde falla la coincidencia.
- **Sin revocación antes de la expiración (ADR-024 §3):** una cookie emitida caduca en 8 horas aunque se intente "cerrar sesión". Esto es aceptable hoy porque hay un solo operador, es el autor, y esto es medición. El disparador que lo reabre está escrito: **el segundo operador**.
- **Sin límite de intentos (ADR-024 §3):** hoy no hay throttling; el primer operador asume que nadie más va a probar.
- **Sin segundo factor (ADR-024 §3):** la sesión es una sola ronda: secreto por cookie.
- **No indexado (CA-1.8):** el panel sale con `X-Robots-Tag: noindex, nofollow`, y `robots.txt` no lo menciona a propósito. Publicar un `Disallow: /admin` sería confirmar que existe.

## Interruptor sin variable: activar el panel para una jornada

El panel **nace apagado**. No es una variable de entorno, sino **código**: la lista `MEASUREMENT_WINDOWS` en `src/ingest/measurement.ts` está vacía (`[]`) (SPEC-017 CA-11, ADR-019 §3).

Sin ninguna ventana declarada, **no hay partido sobre el que operar**: el panel no tiene nada que mostrar ni corregir, aunque `ADMIN_SESSION_SECRET` y `ADMIN_OPERATORS` estén configurados.

**Para encender el panel en una jornada:**

1. Seguir el procedimiento en `docs/procedimientos/jornada-de-medicion.md` hasta completar la declaración de la jornada en `src/ingest/measurement.ts`.
2. En ese mismo despliegue se declaran `MEASUREMENT_WINDOWS` y ya están disponibles en el panel.
3. El panel **detecta automáticamente** qué partidos están en ventana y qué partidos ya cerraron. Cuándo se declara es cuándo se enciende.

## Ejemplo: configurar el acceso para el primer operador

### Paso 1: Generar secreto y digest en local

```bash
# Generar secreto de sesión (firmador global)
SECRETO=$(openssl rand -hex 32)
echo "ADMIN_SESSION_SECRET=$SECRETO" >> .env.local

# Generar secreto del operador (lo tecleará en el panel)
OP_SECRETO=$(openssl rand -hex 32)
echo "Secreto de operador-01: $OP_SECRETO"

# Calcular digest
OP_DIGEST=$(printf %s "$OP_SECRETO" | shasum -a 256 | cut -d' ' -f1)
echo "ADMIN_OPERATORS={\"operador-01\": \"$OP_DIGEST\"}"
```

### Paso 2: Copiar a Vercel

En Settings > Environment Variables de tu proyecto Vercel:

| Nombre | Valor |
|---|---|
| `ADMIN_SESSION_SECRET` | `<resultado de openssl rand -hex 32>` |
| `ADMIN_OPERATORS` | `{"operador-01": "<digest SHA-256>"}` |

### Paso 3: Desplegar

```bash
git push origin ft/SPEC-017-…
```

Una vez desplegado, Vercel actualiza las variables de entorno automáticamente.

### Paso 4: Primera entrada

Abrir https://marcador.gal/admin, teclear:
- `operator_id`: `operador-01`
- `secreto`: el valor de `$OP_SECRETO`

Se obtiene una cookie de 8 horas y acceso al panel para esa jornada.

## Nota: sincronización con jornada-de-medicion.md

El panel y el cron de ingesta viven en despliegues separados:

- **Cron:** declarado en `src/ingest/measurement.ts` en `MEASUREMENT_WINDOWS`. Se enciende cuando se declara una ventana (SPEC-012, ADR-019 §3).
- **Panel:** entra en servicio en el mismo despliegue. Ambos leen de `MEASUREMENT_WINDOWS` y ven la misma lista.

Cuando se abre una nueva jornada de medición (paso 1 de `jornada-de-medicion.md`), el panel **y el cron se despiertan a la vez**. Ambos leen la lista versionada de `src/ingest/measurement.ts`, así que la coordinación es estructural, no manual: no hay un paso adicional de "activar el panel".

## Documentación de referencia

- **SPEC-017**: especificación del panel, criterios de aceptación CA-1.1 a CA-1.8 sobre seguridad de sesión.
- **ADR-024**: decisión de diseño: por qué falla cerrado, por qué no hay revocación ni segundo factor hoy, y el trigger que lo reabre.
- **ADR-022 §2**: misma lógica aplicada al catálogo de corresponsales.
- **ADR-020 y ADR-009 §3 y §4**: purga de archive y retención.
