---
tipo: hallazgo
epica: EPIC-001
fecha: 2026-08-31
---
# Hallazgo — cuántas fuentes automáticas hay realmente

> Escrito a mano y no por `mirror:analizar`: **no es un veredicto de espejo.** Es
> la respuesta a una pregunta anterior, que nadie se había hecho porque parecía
> obvia: *¿cuántas de las fuentes elegidas se pueden capturar de verdad?*

## La pregunta de EPIC-001, y por qué se contesta antes de tiempo

La épica pregunta: **¿hay fuentes automáticas usables, y son independientes entre
sí?** El plan era contestar la segunda mitad con el test de espejo. Al preparar
la ventana apareció que **la primera mitad no estaba contestada**.

## Método

Las cuatro páginas objetivo se capturaron con el capturador real —cortesía RN-11,
user-agent identificado, `robots.txt` respetado— y se midió **una sola cosa sobre
el HTML archivado**: cuántas veces aparece el nombre de un equipo real de la
competición. Es una prueba grosera y por eso es difícil de discutir: una página
de resultados que no nombra a ningún equipo no contiene resultados.

Equipos buscados: `Negreira`, `Paiosaco`, `Noia`, `Betanzos`, `Chantada` para
Preferente; `Arenteiro`, `Alondras`, `Boiro`, `Estradense`, `Somozas` para
Terceira RFEF. Salidos del calendario publicado de la jornada 1.

## Resultado

| Fuente | Competición | HTML servido | Equipos encontrados |
|---|---|---|---|
| **ceroacero.es** | Preferente Futgal G1 | 227 KB | **50** |
| **ceroacero.es** | Terceira RFEF G1 | 251 KB | **50** |
| **besoccer.es** | Preferente Futgal G1 | 130 KB | **0** |
| **besoccer.es** | Terceira RFEF G1 | 146 KB | **0** |

**besoccer.es responde 200, con el título correcto y 130-146 KB de HTML, y no
contiene un solo nombre de equipo.** Sus 13 bloques JSON-LD no incluyen ningún
`SportsEvent`. Sondeadas además sus otras superficies: `calendario` igual de
vacío, el host alterno `es.besoccer.com` idéntico. **Solo `clasificacion` está
renderizada en servidor** (276 KB, 24 apariciones), pero una tabla de
clasificación no tiene partidos, ni marcadores por partido, ni horas de comienzo:
no encaja en el modelo del extractor ni sostiene un test de espejo.

## Y el dato está donde no podemos ir

Los partidos de besoccer los carga el navegador después. Su `robots.txt` dice
**`Disallow: /ajax*`**, que es donde razonablemente vive ese dato. **La única
superficie con la información es la que su política nos prohíbe.**

No hay salida técnica: apuntar ahí sería incumplir RN-11 a sabiendas, y RN-11 es
regla dura y no-negociable de `FOUNDATION.md`.

Nota incómoda: nuestro parser **habría dejado pasar** esa ruta. Trata el `*` de
una ruta como carácter literal y no como comodín (**F-SPEC-002-23**), así que un
adaptador que hubiera apuntado a `/ajax…` habría incumplido RN-11 **sin que
ningún test se pusiera rojo**. El defecto se encontró antes por casualidad, no
por diseño.

## Qué significa

**Hay una sola fuente automática capturable: `ceroacero.es`.**

- `futgal.es`, la **oficial** y de peso 1.0, no es capturable: su `robots.txt`
  prohíbe el rastreo (ADR-008 §1).
- `besoccer.es`, la segunda candidata de peso 0.7, no sirve por HTML.
- Queda `ceroacero.es`, peso 0.7.

**La segunda vía de RN-02 —«dos fuentes independientes con peso ≥ 0.7
coinciden»— está cerrada.** No porque las candidatas sean espejos, sino por
aritmética: **no hay dos.** Y la primera vía exige peso ≥ 0.9, que hoy solo tiene
la fuente oficial y el operador humano.

**Consecuencia para el motor, que es lo que esta épica existía para decidir:**
sin acuerdo con la RFGF o sin una tercera fuente, **ninguna publicación puede ser
*confirmada* automáticamente**. Todo sale *provisional* salvo lo que confirme una
persona. Eso no es un problema de diseño del motor: es el modelo de negocio
pidiendo corresponsales.

## Evidencia

Capturas archivadas el 2026-08-31 entre las 17:38 y las 17:53 UTC, con el
capturador real. Claves en el raw store:

| `besoccer` | `futgal-preferente-g1` | 130 KB | `besoccer/futgal-preferente-g1/2026-08-31/2026-08-31t17-38-21.079z-f3d21686068e.html` |
| `besoccer` | `futgal-preferente-g1` | 130 KB | `besoccer/futgal-preferente-g1/2026-08-31/2026-08-31t17-39-23.621z-f3d21686068e.html` |
| `besoccer` | `futgal-preferente-g1` | 130 KB | `besoccer/futgal-preferente-g1/2026-08-31/2026-08-31t17-40-25.938z-f3d21686068e.html` |
| `besoccer` | `rfef-tercera-g1` | 146 KB | `besoccer/rfef-tercera-g1/2026-08-31/2026-08-31t17-38-21.079z-8190d6a9f615.html` |
| `besoccer` | `rfef-tercera-g1` | 146 KB | `besoccer/rfef-tercera-g1/2026-08-31/2026-08-31t17-39-23.621z-8190d6a9f615.html` |
| `besoccer` | `rfef-tercera-g1` | 146 KB | `besoccer/rfef-tercera-g1/2026-08-31/2026-08-31t17-40-25.938z-3ff040aa83f6.html` |
| `ceroacero` | `futgal-preferente-g1` | 227 KB | `ceroacero/futgal-preferente-g1/2026-08-31/2026-08-31t17-38-21.079z-7c0907bdb630.html` |
| `ceroacero` | `futgal-preferente-g1` | 227 KB | `ceroacero/futgal-preferente-g1/2026-08-31/2026-08-31t17-39-23.621z-081de9471319.html` |
| `ceroacero` | `futgal-preferente-g1` | 227 KB | `ceroacero/futgal-preferente-g1/2026-08-31/2026-08-31t17-40-25.938z-a7090524df05.html` |
| `ceroacero` | `rfef-tercera-g1` | 252 KB | `ceroacero/rfef-tercera-g1/2026-08-31/2026-08-31t17-38-21.079z-7b04b3cbb0c2.html` |
| `ceroacero` | `rfef-tercera-g1` | 252 KB | `ceroacero/rfef-tercera-g1/2026-08-31/2026-08-31t17-39-23.621z-589f35d23ce7.html` |
| `ceroacero` | `rfef-tercera-g1` | 252 KB | `ceroacero/rfef-tercera-g1/2026-08-31/2026-08-31t17-40-25.938z-d4729d8e0015.html` |
Cada clave lleva el instante normalizado y el **digest del cuerpo**, así que
siguen siendo verificables contra una copia aunque se purguen. **Sujetas a
ADR-009: purga prevista el 2026-09-30, techo el 2026-11-29.**

## Lo que este hallazgo NO responde

- **No dice si ceroacero es espejo de futgal.** Eso es SPEC-002 y necesita
  capturar futgal, que hoy no se puede.
- **No dice si ceroacero es fiable, ni rápida, ni completa.** Ninguna de las
  cuatro cifras de EPIC-002 se mide aquí.
- **No cierra la puerta a besoccer para siempre.** Cierra la puerta a
  **obtenerla por HTML servido respetando su robots.txt**. Su API de pago existe
  y está fuera del alcance del spike (ADR-002).
- **No es una ventana de observación.** Son quince minutos de captura
  interrumpidos a propósito al descubrir que la mitad de los pares archivaba
  armazones vacíos. No hay `ventana.json`, y por tanto no hay cobertura medida ni
  veredicto: no lo pretende.
