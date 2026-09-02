---
id: EPIC-002
tipo: epica
estado: aprobada
historial:
  - {estado: borrador, fecha: 2026-08-31, por: sdd-producto}
  - {estado: aprobada, fecha: 2026-08-31, por: Alberto Fojo}
aprobada-por: Alberto Fojo
---
# EPIC-002 — Instrumentación de las cuatro cifras

> Nace el 2026-08-31 al partir EPIC-001. Decisión del gate (Alberto Fojo): la
> épica del spike había dejado de describir lo que se estaba haciendo. EPIC-001
> se queda con la pregunta que sí puede responder —si hay fuentes automáticas
> usables e independientes— y **las cuatro cifras se mudan aquí**, con criterios
> honestos sobre lo que se puede medir sin fuente oficial.

## Objetivo

Producir **las cuatro cifras** que deciden si marcador.gal existe: latencia,
cobertura, conflictos y minutos de operación manual, medidas sobre dos jornadas
reales de Terceira RFEF G1 y Preferente Futgal G1.

Sigue siendo **medición, no producto**. El entregable es un informe con cuatro
números y una lista de fallos observados. Lo que se construye es el andamio
mínimo para poder medir, y `_epica.md` de EPIC-001 ya dijo qué parte de ese
andamio no se tira: el modelo canónico, el raw store, la interfaz de adaptadores
y el motor con reglas trazables.

**Por qué es una épica aparte y no la continuación silenciosa de EPIC-001.** Las
cuatro cifras se definen contra «el dato **publicado**», y publicado significa
`Decision` escrita (RN-08). Eso exige el motor, los adaptadores y el cron, que no
existen: ocho de las once specs previstas. Es un cuerpo de trabajo con su propio
riesgo y su propio calendario, y meterlo bajo una épica cuyo criterio de éxito ya
no lo describía era la razón por la que nadie veía cuánto faltaba.

**Y una cosa cambió de premisa, no de plan:** la fuente oficial **no es
capturable** (ADR-008 §1). Las cifras de esta épica nacen **sin referencia
oficial**, y eso no es un detalle de método: es lo primero que hay que decir al
publicarlas.

## Criterios de éxito

La épica se cierra cuando las cuatro métricas están medidas sobre **dos jornadas
reales**, con verificación manual a cronómetro en 10 partidos, **y el informe
declara junto a cada una qué la degrada**.

| Métrica | Cómo se mide | Umbral aceptable | Qué la degrada hoy |
|---|---|---|---|
| **Latencia** | Segundos entre el gol real (**verificado a mano** en 10 partidos) y el dato publicado | < 120 s en directo, < 10 min resultado final | **Nada.** El patrón es una persona con cronómetro, no una fuente. Mide la latencia de las fuentes que de verdad se usarían |
| **Cobertura** | % de partidos con al menos una fuente viva durante el juego | > 90 % | **El denominador.** Sin calendario oficial capturado, la lista de partidos la declara una persona a mano. Hay que decirlo junto al número |
| **Conflictos** | % de partidos con desacuerdo entre fuentes en algún momento | Informativo; **> 15 % obliga a rediseñar el motor** — salvo lo de abajo | **Puede no medir nada.** Entre espejos no hay desacuerdo posible |
| **Operación** | Minutos de intervención manual por jornada | < 30 min | **Nada, y ahora vale más.** Sin fuente oficial hay más trabajo manual, así que la cifra es más representativa del coste real, no menos |

**El corte del 15 % no aplica** si el hallazgo de EPIC-001 dicta que las fuentes
automáticas no son independientes: entre espejos no hay desacuerdo posible y la
cifra no mide lo que su nombre dice. El informe está obligado a publicar la
advertencia junto al dato.

**Éxito de la épica ≠ umbrales cumplidos.** Medir honestamente y no cumplir
también es éxito: la épica falla solo si termina sin cifras fiables, o con cifras
cuya degradación no está escrita al lado.

**Precondición heredada — RESUELTA en lo que importa, el 2026-09-01.** Decía que
EPIC-001 tenía que dictar su veredicto antes, porque el motor se diseña sabiendo
si RN-02 tiene segunda vía. **Ya se sabe, y no hizo falta el test de espejo: lo
resolvió la aritmética.** No hay dos fuentes automáticas capturables —`futgal.es`
bloqueado por su `robots.txt` (ADR-008 §1), `besoccer.es` sirviendo armazones
vacíos, y `resultados-futbol.com` que no es una cuarta fuente sino un 301 a
besoccer—. Queda **una**: `ceroacero.es`, peso 0.7.

**El motor nace, por tanto, con una sola vía en RN-02**, que es exactamente el
escenario que esta precondición quería evitar descubrir a mitad. Ya no es un
riesgo: es un dato de partida.

**Lo que sigue dependiendo de EPIC-001 es solo si vuelve `futgal.es`**, y eso
tiene fecha: la carta se envió el 2026-09-01 y el **2026-09-08** se da por no
contestada (`docs/roadmap.md`). Si vuelve, entra **como un adaptador más y un
peso en la configuración**; no rehace el motor. Por eso esta épica puede empezar
sin esperar a esa fecha.

**Consecuencia que reordena el alcance por dentro:** con una sola fuente de peso
0.7, nada llega a *confirmado* por vía automática. Los caminos humanos de RN-01
—corresponsal 0.8 → *provisional*, operador 1.0 con precedencia → *confirmado*—
dejan de ser accesorios y pasan a ser **la única ruta a un marcador confirmado**.
El bot de Telegram, el catálogo de alias y el panel van **antes**, no después, y
la cifra de operación manual —la que dispara el corte duro de los 30 min— se
puede medir sin referencia oficial.

## Alcance

**Dentro:**
- **Cron de planificación y calendario**, cargado a mano, con refresco cada 6 h.
  Vercel Cron a 1/minuto, que coincide con el techo de RN-11 (ADR-004).
- **Adaptadores** de las fuentes capturables (ADR-008): hoy **solo
  `ceroacero.es`**. El de `futgal.es` entra **el día que sea capturable**, y no
  antes.

  **`besoccer.es` sale de aquí el 2026-09-01**, y sale por coherencia con lo que
  esta misma épica ya dice más arriba: sirve armazones vacíos y su dato vive
  tras un `Disallow: /ajax*`. Mientras nuestro parser de `robots.txt` trataba el
  `*` como carácter literal (F-SPEC-002-23), esa puerta **parecía** abierta;
  CA-1 de SPEC-008 la cierra de verdad, así que un adaptador de besoccer sería
  hoy o inútil o un incumplimiento de RN-11. No es un recorte de ambición: es
  retirar algo que estaba prometido y no se puede hacer.
- **Bot de Telegram** con parseo LLM y confirmación humana (ADR-002, RN-09).
- **Catálogo de alias** de los 36 equipos, confirmado por una persona (RN-09).
- **Motor de decisiones** con RN-01..RN-07 y tests de replay sobre HTML guardado.
- **Snapshot y una página HTML sin diseño** que lo lee por polling: tabla de
  partidos, marcador, estado, hora del último dato y color para provisional /
  confirmado / *sen sinal*.
- **Instrumentación de las cuatro métricas.** Es el entregable, no un extra.
- **Panel mínimo** de alertas y correcciones, usable desde el móvil.
- **La declaración de degradación** junto a cada cifra. No es documentación: es
  criterio de aceptación de la propia épica.

**Fuera (aparcado a propósito, no por descuido):**
- **La implementación de SSE** (ADR-003). La decisión del protocolo está tomada,
  pero ninguna métrica la necesita: «publicado» se mide como `Decision` escrita.
- **Capturar futgal.es.** Prohibido por su robots.txt y por RN-11 (ADR-008 §1).
  No se intenta por ninguna vía técnica; se levanta con autorización de la RFGF o
  con un robots.txt que nos permita, y entonces entra como adaptador.
- **La retención de producción del raw store.** ADR-009 fija la del archivo de
  medición y deja la de producción sin fijar (F-SPEC-001-1, estrechado).
- Interfaz definitiva, identidad visual, landing, usuarios, notificaciones push.
- Más competiciones, proveedor de pago y X API.
- Patrocinio, dominio, logo.

## Specs

<!-- El estado por spec vive en el frontmatter de cada spec; el tablero agregado se regenera con /sdd-tablero (docs/tablero.md). No mantengas listas de specs a mano aquí. -->

**Su primera spec está entregada: SPEC-008** —adaptador de `ceroacero.es` y
cortesía RN-11 con una sola implementación—, `hecho` y verificada GREEN el
2026-09-01 tras siete vueltas, junto con **ADR-014**. El estado fino vive en el
tablero, no aquí.

**Y de ella nació una segunda, SPEC-009** (`aprobada`, 2026-09-02, en implementación en otro checkout): «La frontera de capacidad
de RN-11, demostrada sin listas negras». No es una spec nueva de producto: es un
criterio de SPEC-008 que **no terminaba**. Nueve evasiones escritas y medidas
tumbaron cuatro mecanismos seguidos, y el 2026-09-01 Alberto Fojo decidió sacarlo
en vez de gastar una octava vuelta. SPEC-008 se cerró con ese criterio en ⚠️ y su
residuo escrito dentro del propio CA, como ADR-016 obliga.

**Dónde entra en el orden, y no es donde su ruido sugiere:** no compite con el
bot ni con el panel, que son la única ruta a un marcador *confirmado*. Su fecha
real es **antes de que el cron despliegue algo que pida a un tercero**. Hoy la
infracción es latente —`src/ingest/` no está cableado a ningún despliegue y nada
se ha corrido nunca contra `ceroacero.es`— y deja de serlo el día del cron.

Descomposición **orientativa** del resto, propuesta por `/sdd-arquitecto` el
2026-09-01 y no vinculante: calendario y repositorios de `Observation`/`Decision`
· catálogo de alias · cron de ingesta · motor de decisiones · bot de Telegram ·
panel del operador · snapshot y página mínima por polling · instrumentación de
las cuatro cifras.

**El orden importa, y no es el obvio:** el bot y el panel van **antes** que el
snapshot y las cifras. Con una sola fuente automática son la única ruta a un
marcador *confirmado*, y la cifra de operación manual —la del corte duro de los
30 min, que decide si esto pide comunidad de corresponsales en vez de producto—
no se puede medir sin ellos.

**El modelo canónico, el raw store y el acceso a datos ya existen** (SPEC-001,
`hecho`), y el instrumento de captura de `src/mirror/` ya resolvió cosas que esta
épica hereda: cortesía RN-11 con limitador por par, archivo antes de parsear
(RN-10), y que ninguna petición cambie de host en silencio.

## Riesgos

- **El riesgo de siempre, ahora sin red: no hay fuente oficial.** Si las dos
  candidatas resultan espejos entre sí, no hay ninguna vía automática a
  *confirmado* —ni la primera de RN-02, que necesita peso ≥ 0.9, ni la segunda— y
  **todo se publica provisional salvo lo que confirme una persona**. Eso no es un
  fallo del motor: es el modelo de negocio pidiendo corresponsales. Se sabrá al
  cerrar EPIC-001, antes de escribir el motor.
- **La cifra de operación puede matar el proyecto, y esta vez con más razón.**
  Sin fuente oficial hay más trabajo manual. Si supera con mucho los 30 min por
  jornada, la siguiente épica es «comunidad de corresponsales», no «producto»
  (`docs/roadmap.md`).
- **Cifras con asterisco convencen menos.** El objetivo declarado era llegar a la
  RFGF con números. Los de esta épica llevan al lado que se midieron sin su dato,
  y eso es a la vez su debilidad y el argumento: *esto es lo que se puede hacer
  sin vosotros; con vosotros, esto otro*.
- **Los límites de Vercel** (ADR-004): sin proceso vivo hay que escribir a mano
  la lógica de ventanas por partido, y la frecuencia mínima es 1/min.
- **Horarios cambiados y aplazamientos.** `postponed` solo por fuente oficial
  (RN-06) — y la fuente oficial no es capturable, así que hoy solo puede
  aplazarlo un humano. Es una consecuencia de ADR-008 que el motor tiene que
  tratar explícitamente.
- **El humano no está.** El corresponsal en el spike es el autor. Medir los
  minutos honestamente, porque esa cifra decide si el proyecto escala.
- **Alcance.** Son ocho o nueve specs. Es la épica más grande del proyecto hasta
  la fecha y la primera que construye producto y no solo instrumento.
