# spikes/radio — SPEC-019, spike desechable de la Radio Galega

Código de una tarde, fuera de `src/`, de `tests/` y de `npm run gates`
(`tsconfig.json` lo excluye, `.oxlintrc.json` lo ignora, `spikes/*/data/` está
en `.gitignore`). **Se borra al cerrar la épica.** Lo que sobrevive es
`docs/epicas/EPIC-005-.../hallazgos/spike-radio-galega.md`.

**Nada real entra en git**: ni audio, ni transcripciones, ni respuestas de
proveedores, ni corpus. Todo eso vive en `data/` (ignorado) y en el store de
Blob del proyecto temporal, y se purga a los 30 días (CA-0.4).

## Qué hay

```
api/listen.ts        la función de Vercel (maxDuration 800 en vercel.json): modo listen y modo relay
src/handler.ts       la lógica de la función, testada sin Vercel
src/listen.ts        la sesión: robots.txt archivado y obedecido → lista → segmentos, a la cadencia del stream
src/hls.ts           listas maestra y de medios; cadencia = TARGETDURATION, nunca más rápido (RN-11)
src/robots.ts        parser con fallo cerrado: 403/5xx/red caída = prohibido
src/container.ts     contenedor por los primeros bytes (MPEG-TS, ADTS, fMP4, WAV)
src/chunks.ts        trozos de 20 y 30 s por fronteras de segmento
src/archive.ts       disco (data/), Blob privado (función), memoria (tests)
src/asr/google.ts    Speech-to-Text v2, chirp_2, gl-ES · src/asr/openai.ts  gpt-4o-transcribe, gl
src/asr/run.ts       crudo archivado ANTES de parsear; nativo primero, WAV después
src/transcode.ts     ffmpeg en el portátil, nunca en la función
src/wer.ts           WER con tests (CA-3.4) · src/corpus.ts  corpus, hoja ciega, tasas
src/latency.ts       p50/p95 y la suma trozo + p95 (CA-4) · src/cost.ts  proyección (CA-5)
src/report.ts        tablas en Markdown · src/cli/*.ts  los comandos de abajo
test/                72 casos con dobles; fixtures sintéticas
```

Variables: `.env.example` → `.env.local`. En Vercel, en el proyecto temporal.

## Antes de capturar (CA-0, lo escribe una persona en el ledger)

1. CA-0.2: copia fechada del DPA de Google Cloud y de OpenAI en `docs/legal/`.
   Después, y no antes, `SPIKE_DPA_ACKNOWLEDGED=google,openai` en `.env.local`
   y en el proyecto de Vercel. `transcribe` y `relay` se niegan sin ello.
2. CA-0.3: `SPIKE_STREAM_URL` con la URL exacta y su origen anotado en el
   ledger. Luego `npm run robots`: archiva `data/robots/<host>-<fecha>-<status>.txt`
   y sale 0 solo si el `robots.txt` permite la ruta. Si sale 1, **se para y se
   escribe**; no se puentea.
3. CA-0.4: fecha de captura y de purga (+30 días) en el ledger.

## La tarde de captura, en orden

```sh
cd spikes/radio && npm install

# Proyecto temporal de Vercel (una vez): Root Directory spikes/radio, solo vista previa,
# Deployment Protection activada, Fluid compute activado, un store de Blob propio.
vercel link              # crear proyecto NUEVO: marcador-spike-radio. NUNCA enlazar marcador-gal
vercel env add SPIKE_SECRET preview
vercel env add SPIKE_STREAM_URL preview
vercel env add BLOB_READ_WRITE_TOKEN preview      # el del store del proyecto temporal
vercel env add SPIKE_DPA_ACKNOWLEDGED preview     # solo tras CA-0.2
vercel env add GOOGLE_PROJECT_ID preview  # + GOOGLE_STT_LOCATION, GOOGLE_STT_MODEL, GOOGLE_ACCESS_TOKEN|GOOGLE_API_KEY
vercel env add OPENAI_API_KEY preview     # + OPENAI_ASR_MODEL
vercel deploy            # vista previa; anota la URL <deployment>

# CA-1: tres invocaciones, dos de ellas con 10 min de diferencia (ADR-029 §3).
# Con Deployment Protection, añade el bypass: ?x-vercel-protection-bypass=<token>
curl -s -H "Authorization: Bearer $SPIKE_SECRET" "https://<deployment>/api/listen?minutes=11&session=inv-1" > inv-1.json
# (a los 10 minutos exactos de la anterior)
curl -s -H "Authorization: Bearer $SPIKE_SECRET" "https://<deployment>/api/listen?minutes=11&session=inv-2" > inv-2.json
curl -s -H "Authorization: Bearer $SPIKE_SECRET" "https://<deployment>/api/listen?minutes=11&session=inv-3" > inv-3.json
# curl debe esperar 11 minutos: usa --max-time 800. Si la plataforma corta antes, el JSON no llega:
# eso ES el resultado de CA-1.5; el archivo en Blob conserva lo capturado hasta el corte.

# Todo lo demás, en frío en el portátil:
npm run pull -- --session inv-1     # y inv-2, inv-3: Blob → data/sessions/<id>/
npm run chunk -- --session inv-1    # chunks-20.json, chunks-30.json, chunks/all.<ext> para escuchar
npm run transcribe -- --session inv-1                      # CA-2 y CA-4.1: nativo, luego WAV si rechaza
npm run transcribe -- --session inv-1 --containers both    # si se quiere la tabla completa motor × contenedor
npm run relay -- --session inv-1 --url https://<deployment>/api/listen --length 20 --count 10   # CA-4.2, por longitud
npm run pull -- --session inv-1     # trae los crudos del relay

# CA-3: una persona escribe data/corpus/inv-1.json (forma en src/corpus.ts) escuchando chunks/all.<ext>.
#   Los offsets son segundos desde el inicio del audio de la sesión. El criterio se escribe ANTES de juzgar.
npm run judge -- --session inv-1 build    # data/judge/inv-1-sheet.json (letras, sin motor). NO abrir el -key.json
#   rellenar "verdicts" a ciegas; después:
npm run judge -- --session inv-1 tally

# CA-5: leer los paneles de facturación DESPUÉS de la sesión y escribir data/costs.json
#   (forma en src/cli/report.ts), guardando capturas en data/costs/.
#   Y una persona teclea la jornada en data/matchday.json desde la web pública de la RFGF
#   (forma en src/cli/report.ts: URL y fecha de consulta obligatorias): los partidos de
#   Preferente Futgal G1 y Terceira RFEF G1 de la tarde de captura, o de la jornada completa
#   más próxima. La proyección es una ESTIMACIÓN y el informe lo dice; no se lee ningún
#   calendario declarado (CA-5.2, enmienda del 2026-09-13).
npm run report -- --sessions inv-1,inv-2,inv-3 --corpus inv-1 --costs data/costs.json --matchday data/matchday.json
#   → data/report/<fecha>.md: pegar las tablas en hallazgos/spike-radio-galega.md y escribir CA-6.3..6.6 a mano.
```

Si la media hora no da veinte frases de gol, se alarga en la misma sesión
hasta sesenta minutos (más invocaciones); no hay segunda sesión (spec §2).

Si el proyecto temporal no está disponible, `npm run listen -- --minutes 30`
captura en el portátil con el mismo código: sirve para CA-2..CA-5 pero **no
mide CA-1** (`region: laptop` en el informe).

## Al cerrar (CA-0.4, CA-7.5)

```sh
npm run purge -- --session inv-1 --blob     # y las demás; con --all borra corpus, hoja y robots locales
vercel project rm marcador-spike-radio      # y el store de Blob desde el panel
```

El acuse (fecha, rutas, recuentos) y el borrado del proyecto se escriben en
el ledger de SPEC-019.
