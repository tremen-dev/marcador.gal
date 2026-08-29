# FOUNDATION — marcador.gal

> Constitución del proyecto. Las decisiones D-N están **locked**: solo un ADR
> aceptado puede reinterpretarlas o supersederlas. Dueños: sdd-arquitecto y
> sdd-producto (hook protege-verdad).

- Creado: 2026-08-29
- Dominio: marcador de resultados del fútbol galego y de las divisiones nacionales, en directo y en una sola pantalla

## Decisiones locked

- **D-1** (2026-08-29): **Nombre e imagen propios. No somos la continuación de
  Marcador Galego.** Inspiración, no sucesión: no se usa su marca ni se comunica
  como relevo oficial. El nombre elegido es *marcador.gal*.
- **D-2** (2026-08-29): **Galego por defecto, castellano como opción.** Todo texto
  visible al usuario (UI, bot, notificaciones) va en ficheros de i18n desde el
  primer día; nunca hardcodeado. Los nombres de equipos y competiciones son los
  canónicos de la RFGF.
- **D-3** (2026-08-29): **Ninguna fuente publica un marcador sin pasar por el motor
  de decisiones.** No hay atajos, ni para la fuente oficial ni para el corresponsal
  (RN-08).
- **D-4** (2026-08-29): **Un LLM nunca es la única fuente de un marcador.** Sirve
  para proponer alias y parsear mensajes de corresponsal, siempre con salida JSON
  validada y confirmación humana (RN-09).
- **D-5** (2026-08-29): **Toda respuesta cruda se guarda antes de parsearse.** El
  raw store es lo que permite reprocesar y reproducir jornadas en tests (RN-10).
- **D-6** (2026-08-29): **Fiabilidad trazable.** Cada Decision registra la regla
  aplicada y las observaciones que la sostienen. Un marcador publicado siempre
  sabe de dónde viene (RN-12).
- **D-7** (2026-08-29): **El proyecto debe pagarse.** La sostenibilidad económica
  es condición del proyecto, no un extra. Sin apuestas y sin AdSense como modelo.
- **D-8** (2026-08-29): **Fútbol en galego, urbano o no.** Nada de tópicos rurales
  en imagen ni tono. El producto es densidad: todo en una pantalla, números
  tabulares, legible con mala cobertura.

## Alcance

- **Dentro:** resultados en directo del fútbol galego (Preferente, Primeira e
  Segunda Galega, femenino) y de las divisiones nacionales, en una pantalla, en
  galego. Ingesta multifuente con reconciliación trazable y humano en el bucle.
  Datos como negocio (feed/widget para medios, radios, clubes, federación).
- **Fuera:** ser un medio, una red social, un Flashscore galego o una app de
  apuestas. Retransmisión, vídeo, estadísticas avanzadas y comunidad de usuarios
  no están en el horizonte actual.

## No-negociables

- **Legalidad de la obtención del dato.** Los resultados son hechos sin copyright,
  pero la extracción sistemática de bases de datos está protegida en la UE
  (derecho *sui generis*) y las ToS de los agregadores prohíben scraping. El
  riesgo está en **cómo** se obtiene el dato. En el spike: robots.txt, user-agent
  identificado, máximo 1 petición/minuto por competición (RN-11). En producción:
  acuerdo con la RFGF o proveedor licenciado.
- **Escudos de clubes:** marcas registradas. Sin política de uso explícita, no se
  publican.
- **Nunca se publica un marcador sobre un equipo sin alias confirmado por una
  persona** (RN-09).
- **Un marcador no baja** salvo fuente oficial o humano (RN-04). Los conflictos no
  se publican: se alertan (RN-05).
- **Las Observations son inmutables** (RN-13).
- **Provisional a tiempo antes que confirmado tarde** (RN-03) — pero siempre
  marcado como tal en la interfaz.

## Cómo se trabaja aquí

Este proyecto sigue el estándar **tremen-sdd**: nada se implementa sin una
SPEC aprobada; las decisiones técnicas se registran como ADR inmutables; la
evidencia de verificación vive en el ledger de cada spec. Roles: /sdd-orquestador
(entrada), /sdd-producto, /sdd-arquitecto, /sdd-implementador, /sdd-verificador,
/sdd-documentalista, /sdd-como-vamos.

Documentación, specs, ADRs y commits en **castellano**. Código, identificadores y
comentarios en **inglés**. Texto visible al usuario en **galego** (D-2). Los
términos de `docs/fundacion/dominio.md` no se traducen.
