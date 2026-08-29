# Spike de ingesta — propuesta técnica (documento fuente)

> Movido de `docs/05-spike-ingesta.md` (2026-08-29), contenido intacto.
>
> **Este documento es la fuente, no el plan vivo.** Su contenido se ha repartido:
> la §5 (motor de decisiones) es ahora **RN-01..RN-07** en `reglas.md`; la §4
> (modelo de datos) es el glosario de `dominio.md`; las §§1, 8 y 9 son
> **EPIC-001** en `docs/epicas/`; las §§3, 6 y 7 alimentan ADR-001..003 y las
> specs que aún hay que escribir.
>
> Se conserva como referencia hasta que las specs de EPIC-001 lo absorban por
> completo. **Si hay discrepancia, mandan `reglas.md`, `dominio.md` y las specs**,
> no este fichero.

## 1. Objetivo

Responder con números, no con opiniones, a una pregunta: **¿podemos servir el fútbol gallego y el nacional en una pantalla, en tiempo casi real, con un esfuerzo de operación asumible?**

**Alcance:** Tercera RFEF grupo 1 (representa lo nacional) + Preferente Futgal grupo 1 (representa lo gallego). Dos jornadas reales.

**Métricas de salida (las cuatro que decidirán el proyecto):**

| Métrica | Cómo se mide | Umbral aceptable |
|---|---|---|
| Latencia | Segundos entre el gol real (verificado a mano en 10 partidos) y el dato publicado | < 120 s en directo, < 10 min resultado final |
| Cobertura | % de partidos con al menos una fuente viva durante el juego | > 90 % |
| Conflictos | % de partidos con desacuerdo entre fuentes en algún momento | Informativo; > 15 % obliga a rediseñar el motor |
| Operación | Minutos de intervención manual por jornada | < 30 min |

**Fuera de alcance:** interfaz definitiva, más competiciones, usuarios, notificaciones, patrocinio.

## 2. Fuentes

| # | Fuente | Cubre | Conexión | Latencia esperada | Situación legal | Uso en el spike |
|---|---|---|---|---|---|---|
| 1 | RFGF — backend de la app oficial | Todo el fútbol gallego | HTTP/JSON privado (a descubrir) | Minutos, depende del árbitro/delegado | Privado; producción requiere acuerdo | Descubrimiento y contraste |
| 2 | futgal.es | Todo el fútbol gallego **incluida Tercera RFEF G1** (la organiza la RFGF) | HTML | Igual que 1 | Público, sin API | **Fuente oficial del spike para ambas competiciones** |
| 3 | ceroacero.es | Desde Primera hasta Terceira Futgal | HTML | A medir | Público, ToS restringen scraping | **Contraste del spike para ambas competiciones**, ritmo bajo |
| 4 | BeSoccer (resultados-futbol.com) | Preferente y nacional | HTML + API de pago | A medir | API comercial disponible | Fuera del spike; candidato a proveedor en producción |
| 5 | API-Football (api-sports.io) o similar | Tercera RFEF, Primera, Segunda | REST JSON, polling | 30–60 s | Licencia de pago, legal | Fuera del spike; entra con Primera y Segunda |
| 6 | Cuentas de clubes en X | Goles al instante | X API v2 (de pago, lectura limitada) | Segundos | Legal pero cara | Aparcado; medir a mano en 3 partidos |
| 7 | Corresponsal por Telegram | Cualquier partido | Bot API (push, gratis) | Segundos | Propio | Sí, es la fuente más barata y fiable |

Notas:
- La fuente 1 se explora observando el tráfico de la app (proxy local). Sirve para entender qué datos publica la RFGF y con qué latencia, no para construir sobre ella. El objetivo es llegar a la RFGF con una propuesta concreta ("vuestro dato, nuestra pantalla").
- Todo scraping en el spike respeta robots.txt, identifica el user-agent, y no baja de 1 petición por minuto por competición. No es producción; es medición.
- Cobertura de Tercera RFEF grupo 1 en API-Football: confirmar en su listado de ligas antes de contratar. Alternativas: Sportmonks, BeSoccer API.

## 3. Tipos de conexión

- **Pull (adaptadores HTTP):** cada fuente tiene un adaptador con la misma interfaz: `fetch(competition, round) -> list[Observation]`. Usa ETag / If-Modified-Since cuando la fuente lo soporte. Parsing con selectolax o BeautifulSoup.
- **Push (Telegram):** webhook que recibe mensajes del corresponsal. Un LLM convierte texto libre ("Arosa 2-1 Bertamiráns min 70") en una Observation estructurada; el bot devuelve la interpretación y pide confirmación con un botón.
- **Raw store:** cada respuesta cruda (HTML/JSON) se guarda con timestamp antes de parsearla. Permite reprocesar cuando un parser falla y reproducir una jornada entera en tests. Es la pieza que hace que el spike siga valiendo dentro de un año.
- **Planificador:** el calendario de la jornada define ventanas por partido. Frecuencia de polling: 30–60 s en juego, 5 min en la hora previa, 30 min en las 3 h posteriores (correcciones), 1 vez al día el resto. Calendario refrescado cada 6 h (los horarios cambian).
- No hay websockets ni streams desde ninguna fuente; todo lo "en directo" es polling de otros.

## 4. Modelo de datos

```
Competition(id, name, season, group)
Team(id, canonical_name, aliases[])          # "UD Ourense" ≠ "Ourense CF"
Match(id, competition_id, round, kickoff, home_id, away_id, venue)

Observation(                                  # lo que dice una fuente en un instante
  id, match_id, source, observed_at,
  status, home_score, away_score,
  confidence, raw_ref)

Decision(                                     # lo que publicamos
  match_id, status, home_score, away_score,
  provisional: bool, rule, decided_at,
  supporting_observation_ids[], version)
```

Las Observations nunca se borran. Las Decisions son un log; la última por partido es la publicada. Todo lo que se mide en el spike sale de cruzar estas dos tablas.

**Alias de equipos:** catálogo por temporada. Un LLM propone el match entre nombres de fuentes distintas; una persona confirma una vez; queda en `aliases`. Nunca se publica un resultado sobre un equipo sin alias confirmado.

## 5. Motor de decisiones

Un reducer por partido: recibe una Observation nueva, lee la Decision vigente, emite (o no) una Decision nueva. Reglas en orden:

1. **Pesos de confianza:** RFGF 1.0 · API de pago 0.9 · corresponsal confirmado 0.8 · BeSoccer / ceroacero 0.7 · tuit de club 0.5.
2. **Publicación confirmada** si la observación tiene peso ≥ 0.9, o si dos fuentes independientes con peso ≥ 0.7 coinciden.
3. **Publicación provisional** si solo hay una fuente con peso < 0.9. La interfaz lo muestra (por ejemplo, marcador en gris). Mejor provisional a tiempo que confirmado tarde.
4. **Monotonía:** un marcador no baja salvo que lo diga la fuente oficial o un humano. Un salto de más de 2 goles en una sola observación se retiene hasta segunda fuente.
5. **Conflicto:** dos fuentes con peso ≥ 0.7 discrepan y ninguna es oficial: se mantiene la última confirmada y se genera alerta al panel. No se publica el conflicto.
6. **Estados:** `scheduled → live` con la primera observación de juego después de kickoff−2 min; `live → finished` con fuente oficial, dos fuentes coincidentes o kickoff+110 min sin señal (marcado "pendente de confirmar"); `postponed / suspended` solo por fuente oficial o humano.
7. **Silencio:** partido en juego sin observación nueva en 15 min → estado "sen sinal" visible y alerta.

Cada Decision guarda qué regla la produjo y qué observaciones la sostienen. Eso es lo que convierte el spike en datos: cuántas decisiones fueron provisionales, cuántas se corrigieron, cuánto tardó cada una.

## 6. Del motor a la pantalla en tiempo real

- **Snapshot:** `GET /api/board?competitions=...` devuelve el estado completo con un `version` global. Cacheable en CDN 10 s. Es lo que carga la página y lo que usa cualquier cliente que pierda el stream.
- **Stream:** `GET /api/stream` con Server-Sent Events. Cada Decision nueva publica un evento `{match_id, status, score, provisional, version}`. El cliente aplica deltas sobre su snapshot; al reconectar manda `Last-Event-ID` y recibe lo que se perdió, o pide un snapshot si la distancia es grande.
- **Por qué SSE y no WebSocket:** el flujo es unidireccional, SSE reconecta solo, atraviesa proxies y HTTP/2 sin fricción, y no necesita infraestructura adicional. WebSocket no aporta nada aquí.
- **Fallback:** si SSE falla (redes móviles raras, campos con mala cobertura), el cliente vuelve a polling del snapshot cada 30 s con ETag. Ninguna pantalla se queda congelada.
- **Bus interno:** el motor escribe en Postgres y notifica por `LISTEN/NOTIFY` (suficiente para el spike; Redis pub/sub si hay varios procesos de API).
- **Carga:** un pico de unos miles de conexiones SSE simultáneas en sábado tarde lo aguanta un solo proceso asíncrono en un VPS pequeño. El coste real está en la ingesta, no en servir.

Para el spike, el cliente puede ser una página HTML sin diseño: tabla de partidos, marcador, estado, hora del último dato y un color para provisional/confirmado/sen sinal.

## 7. Stack propuesto

- Python 3.12: FastAPI (API + SSE), httpx, APScheduler, selectolax, python-telegram-bot, pydantic para el modelo.
- Postgres (una sola instancia; raw store como tabla con JSONB o ficheros en disco).
- Un VPS pequeño (Hetzner/OVH) o Fly.io. Nada de Kubernetes ni colas todavía.
- LLM vía API solo para alias y parseo de mensajes, con salida JSON validada.
- Repositorio único: `ingest/` (adaptadores + scheduler), `decide/` (motor + tests con replay), `api/` (snapshot + stream), `admin/` (panel mínimo de correcciones y alertas, usable desde móvil).

Node/TypeScript sería igual de válido; Python gana por el ecosistema de parsing y por la rapidez del spike.

## 8. Plan de una semana

| Día | Entrega |
|---|---|
| 1 | Modelo, raw store, scheduler con calendario cargado a mano. Exploración del tráfico de la app RFGF. |
| 2 | Adaptadores futgal.es y ceroacero. Catálogo de alias de los 36 equipos. |
| 3 | Bot de Telegram con parseo LLM y confirmación. Tests de los adaptadores sobre HTML guardado. |
| 4 | Motor de decisiones con tests de replay sobre una jornada sintética. Registro de "quién actualiza antes" entre futgal y ceroacero. |
| 5 | Snapshot + SSE + página mínima + panel de alertas. |
| Sáb–Dom | Jornada real. Verificación manual de 10 partidos con cronómetro. |
| Lunes | Informe con las cuatro métricas y lista de fallos observados. |

## 9. Riesgos del spike

- **Bloqueo o cambio de una fuente a mitad de jornada.** Mitigación: dos fuentes por competición desde el día 1 y raw store para reprocesar.
- **La app de la RFGF no expone nada usable.** Entonces futgal.es es la única oficial y la latencia será la que sea; el dato va al informe y a la conversación con la federación.
- **Cobertura nacional insuficiente en la API elegida.** Confirmar antes de pagar; tener el segundo proveedor identificado.
- **Horarios cambiados y aplazamientos.** Refresco de calendario cada 6 h y estado `postponed` solo por fuente oficial.
- **El humano no está.** El corresponsal en el spike eres tú; mide honestamente los minutos, porque esa cifra es la que dice si el proyecto escala sin comunidad.

## 10. Lo que el spike deja preparado para producción

El modelo canónico, el raw store, la interfaz de adaptadores y el motor con reglas trazables no se tiran. Lo que cambia en producción es la lista de fuentes (acuerdo con RFGF, proveedor nacional de pago, corresponsales reales) y la interfaz.
