---
tipo: hallazgo
epica: EPIC-005
fecha: 2026-09-13
---
# Hallazgo — spike técnico de la Radio Galega (SPEC-019)

> **PLANTILLA SIN CAPTURA (2026-09-13).** Este fichero tiene la forma que
> SPEC-019 CA-6 exige, en su orden, y **ninguna cifra**: a fecha de hoy no se
> ha capturado un solo segmento, porque CA-0.2 (DPA de los motores), CA-0.3
> (URL del stream y su `robots.txt`) y CA-0.4 (fecha de purga) están
> pendientes del operador (ledger de SPEC-019). Cada `⟨…⟩` es un hueco que se
> rellena el día de la captura con la salida de
> `spikes/radio`: `npm run report` genera las tablas de §2 desde `data/`, y
> §3–§6 se escriben a mano. **Mientras haya un `⟨…⟩`, este documento no es un
> hallazgo y no se cita.**

## §1. Método y ventana (CA-6.1)

- **Programa:** ⟨*Galicia en goles*, Radio Galega⟩.
- **Fecha y hora de la captura:** ⟨YYYY-MM-DD HH:MM–HH:MM Europe/Madrid⟩.
- **Minutos capturados:** ⟨N⟩ en ⟨3⟩ invocaciones (`inv-1`, `inv-2`, `inv-3`);
  dos de ellas arrancadas con 10 minutos de diferencia (CA-1.3).
- **Partidos en juego durante la ventana:** ⟨competición, equipos canónicos,
  hora⟩; ⟨si el programa cubrió Preferente, anotarlo; si no, va a §5⟩.
- **URL usada y de dónde salió (CA-0.3):** ⟨URL⟩ — ⟨oficial entregada por la
  CRTVG el …⟩ / ⟨pública de listados de terceros, consultada el …, con
  constancia de que se pidió la oficial el …⟩.
- **`robots.txt` del host:** archivado en ⟨`data/robots/<host>-<fecha>-<status>.txt`⟩
  y en ⟨`data/sessions/inv-1/robots/…`⟩ antes del primer segmento; devolvió
  ⟨status⟩ y dice ⟨texto relevante / «no existe»⟩; veredicto para la ruta:
  ⟨permitida⟩.
- **`User-Agent`:** `marcador.gal/0.0.1 (+https://marcador.gal/robot; medicion de latencia)`
  (ADR-011, copiado en `spikes/radio/src/user-agent.ts`).
- **Cadencia de peticiones:** una lista por `TARGETDURATION` (⟨N⟩ s) y un
  segmento por segmento; ⟨N⟩ peticiones de lista y ⟨N⟩ de segmento en ⟨N⟩
  minutos (RN-11, aclaración del 2026-09-12).

## §2. Las tablas (CA-6.2)

⟨Pegar aquí la salida de `npm run report -- --sessions inv-1,inv-2,inv-3
--corpus inv-1 --costs data/costs.json`, que trae, cada una con los ficheros
que la sostienen: CA-1 invocaciones / huecos / solape; CA-2 motor ×
contenedor y parámetros exactos; CA-3 acierto en frases de gol y WER; CA-4
latencia; CA-5 precios y proyección.⟩

### CA-1 — Invocaciones

⟨tabla⟩

### CA-2 — Motor × contenedor (respuesta a ADR-029 §7)

⟨tabla⟩

### CA-3 — Acierto en frases de gol (a ciegas) y WER global

Criterio escrito antes de juzgar: ⟨criterio del corpus⟩.
Normalización del WER: minúsculas, sin acentos, sin puntuación (`src/wer.ts`).

⟨tablas⟩

### CA-4 — Latencia por trozo

⟨tabla⟩

### CA-5 — Coste

⟨tablas⟩

## §3. ¿Sostiene la función el stream? (CA-6.3)

⟨**Sí / No**, con los números de CA-1: arranque de ⟨N⟩ ms, ⟨N⟩ segundos de
escucha efectiva por invocación, ⟨N⟩ huecos mayores que un segmento en ⟨N⟩
invocaciones, solape medido de ⟨N⟩ s entre `inv-1` e `inv-2`.⟩

**Escalón de ADR-029 §7 que resultó necesario:** ⟨1 tal cual / 2 remultiplexado
en JS / 3 `ffmpeg`⟩, con lo que costó: ⟨ms por trozo en el portátil; tamaño
que supondría en la función⟩.

⟨Si algún disparador de ADR-029 §9 se cumple, decirlo con esas palabras:
«la función no sostiene el stream según ADR-029 §9 por …».⟩

## §4. Recomendación de proveedor de ASR (CA-6.4)

| Motor | Acierto en frases de gol | WER | p95 (20 s / 30 s, desde Vercel) | $/min medido | DPA | Contenedor aceptado |
|---|---|---|---|---|---|---|
| ⟨google chirp_2⟩ | ⟨%⟩ | ⟨%⟩ | ⟨ms / ms⟩ | ⟨$⟩ | ⟨adjunto / pendiente / no disponible⟩ | ⟨…⟩ |
| ⟨openai gpt-4o-transcribe⟩ | ⟨%⟩ | ⟨%⟩ | ⟨ms / ms⟩ | ⟨$⟩ | ⟨…⟩ | ⟨…⟩ |

**Recomendación:** ⟨motor⟩, con trozo de ⟨20 / 30⟩ s, porque ⟨…⟩. Es lo que
la segunda spec fija en `src/radio/schedule.ts` (ADR-029 §3).

## §5. Lo que no se midió (CA-6.5)

- El extractor LLM sobre las transcripciones (tercera spec).
- La independencia radio/ceroacero (cuarta spec, ADR-028 §3).
- La cobertura de Preferente: ⟨no hubo Preferente en la media hora / hubo y se anota…⟩.
- El ruido de un campo concreto frente a otro: la media hora tuvo ⟨N⟩ campos.
- Lo que la media hora no contuvo: ⟨…⟩.
- ⟨Streaming ASR por websocket, si se vio viable al pasar: una línea.⟩

## §6. Fecha de purga del material (CA-6.6)

Captura el ⟨YYYY-MM-DD⟩; purga el ⟨YYYY-MM-DD⟩ (30 días; techo 90 con una
prórroga escrita). Desde esa fecha, las rutas de `data/` citadas arriba son
arqueológicas (ADR-009 §3). Acuse de purga: ⟨en el ledger de SPEC-019⟩.
