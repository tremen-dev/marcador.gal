---
tipo: roadmap
---
# Roadmap — marcador.gal

> Curado por sdd-producto. Secuencia de épicas, horizonte y criterios de corte.
> El estado fino por spec vive en el tablero; aquí vive la INTENCIÓN.

## Ahora (en curso)

- **EPIC-001 — Spike de ingesta. BLOQUEADA el 2026-08-31.** Las tres specs están
  hechas y verificadas GREEN, y aun así la épica no puede cerrarse: **solo hay
  una fuente automática capturable** (`ceroacero.es`). futgal prohíbe el rastreo
  y besoccer sirve armazones vacíos, con su dato tras un `Disallow`. SPEC-003
  mide el cruce **entre dos** candidatas, así que hoy no es ejecutable.
  Evidencia: `docs/epicas/EPIC-001-spike-ingesta/hallazgos/fontes-capturables.md`.
  **El estado de juego, lo que desbloquea y las fechas están en el apartado
  *ESTADO AL 2026-08-31* de su `_epica.md`. Empieza por ahí.**

  **Y algo que ya no está en duda:** la segunda vía de RN-02 —dos fuentes
  independientes de peso ≥ 0.7— está cerrada, y no por espejo sino por
  aritmética: no hay dos. Con una sola fuente automática, **nada se publica
  *confirmado* sin una persona**. Eso deja de ser una hipótesis del spike y pasa
  a ser una restricción de diseño para el motor.

- **EPIC-003 — Páxina de proxecto e respaldo público da carta.** Sube a *Ahora*
  el 2026-08-31, desde *Más adelante*, y **no rompe el criterio de corte**: no
  depende de ninguna cifra. No es la landing de `marca.md` —esa sigue abajo, con
  su lista de espera y su mockup, esperando al informe—, sino el sitio mínimo
  donde se puede **verificar lo que la carta afirma**: quién está detrás, el
  user-agent literal, el tope de 1 pet/min y el respeto a `robots.txt`. Se
  descubrió al abrir la petición que la landing completa **debilitaría** la
  carta, porque prometer producto es justo lo que su autor escribió que no había
  que hacer. Su precondición ya está resuelta: **`marcador.gal` se contrató el
  2026-08-31** en Dinahosting (verificado en WHOIS y DNS), lo que cierra el
  riesgo de dominio que este roadmap arrastraba. Queda pendiente la comprobación
  en OEPM, que ya no bloquea el dominio sino la inversión en identidad visual.


**La acción con plazo externo, y la única que solo puede hacer una persona:**
mandar la carta a la RFGF (`docs/negocio/carta-rfgf-acceso.md`). **Enviada el 2026-09-01 a `info@futgal.es`.** Ahora espera respuesta. Pide **dos líneas en su `robots.txt`**, no un acuerdo de datos, así que no necesita cifras y rompe el círculo de «la conversación solo tiene sentido con el informe en la mano». Si contestan, la ventana pasa a ser la de **SPEC-002** — hecha, verificada y esperando exactamente eso.

**El bloqueo de EPIC-001 persiste:** la carta hace una pregunta, no cierra ninguna puerta. El acceso a `futgal.es` sigue dependiendo de una de dos cosas — respuesta de la RFGF, o un `robots.txt` que nos permita. **Sin eso, SPEC-003 sigue sin poder ejecutarse** porque mide el cruce entre dos fuentes y hoy solo hay una. Esto no es un fallo de la carta: es que la pregunta, aun hecha, no tiene respuesta todavía.

**Cuánto se espera, decidido por Alberto Fojo el 2026-09-01: una semana.** Si el
**2026-09-08** no hay respuesta, la carta se da por **no contestada** y no se
insiste — **ni por teléfono ni por otra vía**. No es rendirse: es que el silencio
de un buzón general ante una petición técnica no es información, y esperar más no
la convierte en información.

**Lo que esa fecha desbloquea es un veredicto, no un acceso.** Hasta hoy EPIC-001
estaba bloqueada **sin final**: dependía de una respuesta que podía no llegar
nunca. Con el plazo escrito, el **2026-09-08** la épica puede cerrarse diga lo que
diga la RFGF — si contestan que sí, la ventana pasa a ser la de SPEC-002, hecha y
verificada esperando exactamente eso; si no contestan o dicen que no, **EPIC-001
se cierra con una sola fuente automática capturable**, que es un resultado, no un
fracaso. Lo que no puede volver a pasar es que se quede esperando.

**Queda una cosa sin decidir, y se anota como tal:** si el 2026-09-08 se manda un
segundo correo —a otra dirección, a un contacto de sistemas— o no se manda
ninguno. Alberto descartó el teléfono; sobre un segundo correo no se ha
pronunciado. Mientras no lo haga, **no se manda ninguno**.

**Bloqueante fuera del código, ya resuelto a medias:** el dominio `marcador.gal`
**se contrató el 2026-08-31** (Dinahosting), lo que cierra el riesgo de nombre
abierto desde el 2026-08-29. Quedan **los handles** y la comprobación en OEPM.
Nada de esto depende de EPIC-001.

**La comprobación en OEPM, contestada a medias el 2026-09-01, y con
consecuencia:** Alberto Fojo comprobó que **«marcador» está ocupado como marca y
«marcador.gal» está libre**. No cierra el riesgo —una búsqueda por denominación
no es una comprobación de antecedentes registrales: faltan clases de Niza, marcas
de la UE en EUIPO y denominativas parecidas, y el buscador gratuito de la OEPM ni
siquiera filtra por clase, así que sigue pendiente una revisión profesional— pero
sí lo **reubica**, y de una forma que ya obliga: la marca es **marcador.gal**, con
el dominio dentro, y **nunca «marcador» a secas**. Eso deja de ser preferencia de
estilo y pasa a ser restricción: cualquier sitio donde el producto se acorte
—etiqueta de icono de app, handle, nombre corto— cae sobre una denominación
ocupada. Mientras la revisión profesional siga pendiente **no se produce ningún
activo de marca**; el logotipo tipográfico, que ya lleva el `.gal` dentro, puede
seguir usándose como texto.

**Bloqueante nuevo, y el más caro:** `futgal.es` **prohíbe el rastreo** en su
`robots.txt` y RN-11 obliga a respetarlo (ADR-008 §1). La fuente **oficial** no
es capturable. Conserva su peso 1.0 y su condición de oficial: lo que se retira
es obtener su dato por rastreo. Se levanta con **una de dos cosas y ninguna
otra** — autorización escrita de la RFGF, o un `robots.txt` que nos permita.
Mientras tanto **no hay ninguna fuente automática de peso ≥ 0.9**, y la primera
vía de RN-02 queda cerrada para todo lo que no sea una persona.

## Después (comprometido, sin empezar)

- **EPIC-002 — Instrumentación de las cuatro cifras.** Latencia, cobertura,
  conflictos y operación, que salieron de EPIC-001 el 2026-08-31 porque exigen el
  motor, los adaptadores y el cron: ocho o nueve specs. Sus cifras nacen **sin
  referencia oficial**, y la épica obliga a declarar junto a cada una qué la
  degrada.

  **Descongelada en su mayor parte el 2026-09-01, porque su premisa caducó.**
  Decía «no empieza hasta que EPIC-001 dicte su veredicto, **porque el motor se
  diseña sabiendo si RN-02 tiene segunda vía o no**». Esa pregunta **ya está
  respondida**, y lo dice este mismo roadmap más arriba: la segunda vía está
  cerrada **por aritmética, no hay dos fuentes**. Lo que la respuesta de la RFGF
  cambia es **si vuelve futgal**, no si hay segunda vía. La restricción de diseño
  está fijada, así que **el motor se puede escribir hoy**.

  **Lo que no depende de la RFGF, y es casi todo:** cron de planificación y
  calendario · adaptador de `ceroacero.es` · catálogo de alias de los 36 equipos
  · motor de decisiones con RN-01..RN-07 y sus tests de replay · snapshot y
  página mínima por polling · panel de correcciones. Si mañana llega el sí,
  **futgal entra como un adaptador más y un peso en la configuración**: no se
  rehace el motor.

  **Lo que sí depende, y conviene no engañarse:** SPEC-002, el test de espejo
  **con referencia**, que necesita la fuente oficial y está `hecho` esperándola;
  cualquier *confirmado* sin una persona; y RN-06, porque sin futgal solo un
  humano puede aplazar un partido.

  **Y lo que sube de rango, que es el cambio de verdad:** con una sola fuente
  automática de peso 0.7, **nada llega a *confirmado* por vía automática**. RN-01
  sí tiene caminos humanos —corresponsal 0.8 → *provisional*; operador 1.0 con
  precedencia → *confirmado*—, así que **el bot de Telegram y el panel dejan de
  ser accesorios y pasan a ser la única ruta a un marcador confirmado**. Eso
  reordena la épica por dentro: la vía humana y el motor van primero, y **la
  cifra de operación manual —la que dispara el corte duro de los 30 min y decide
  si esto pide comunidad de corresponsales en vez de producto— se puede medir sin
  la RFGF**, con un corresponsal, una jornada y un cronómetro.

  Esta misma premisa tiene una consecuencia de **diseño**, no de secuencia, y no
  se desarrolla aquí a propósito: si `confirmado` deja de ser el estado normal,
  el diseño del marcador **apaga el dominante y destaca el raro**, y eso no se
  arregla cambiando un color — cambia cuál es la fila por defecto. Lo trabaja
  **EPIC-004**, `aprobada` y en `main` desde el 2026-09-01 — **congelada a
  propósito**, que no es lo mismo que pendiente: existe para dar custodia a un
  sistema de diseño hecho fuera del pipeline, no para descongelarse todavía.

- **Decisión go / no-go.** Es un gate humano, no una épica: puede matar el
  proyecto, reducirlo o confirmarlo. **Ahora tiene dos momentos, no uno.** El
  primero, barato, con el veredicto de EPIC-001: si las candidatas son espejos
  entre sí no hay ninguna vía automática a *confirmado*, y eso se decide antes de
  construir el motor. El segundo, con las cuatro cifras de EPIC-002.
- **Conversación con la RFGF.** Sigue siendo el objetivo estratégico y ahora
  tiene **dos motivos, no uno**: llegar con números —«vuestro dato, nuestra
  pantalla»— y **desbloquear el acceso**, porque su `robots.txt` nos cierra la
  puerta. Pedirlo antes de tener cifras se **rechazó el 2026-08-31**; queda
  disponible como camino y es la única forma limpia de recuperar la fuente
  oficial.

- **EPIC-004 — Identidade visual e interface do marcador. CONGELADA de
  nacimiento (2026-09-01).** Sube desde *Más adelante*, donde estaba como idea
  sin compromiso, y **no levanta el criterio de corte**: no empieza hasta el
  go/no-go. Lo que cambia no es la prioridad, es que ahora hay **un sitio**.
  Nace porque se encargó un sistema de diseño fuera del pipeline —seis
  artboards, dado por bueno como v1.0 el 2026-09-01— y ese trabajo, con sus seis
  huecos y una contradicción, estaba viviendo en un artefacto publicado y un
  worktree sin commit. Es la misma patología que hizo nacer a EPIC-MEJORA ese
  mismo día: trabajo real rutado a un buzón inexistente.

  **Lo que sí se movió, porque pasa el corte:** las reglas semánticas del
  marcador —el acento de marca nunca es color de estado, ningún estado se
  codifica solo con color, sin escudos, números tabulares— están en **ADR-013**,
  en `borrador`. Se derivan de D-8 y de RN-01..RN-13, que están locked, y no
  cambiarían con el informe en la mano.

  **Y algo que la épica hereda como deuda, no como diseño:** el sistema pinta
  `provisional` en gris y como excepción, y la mayoría de sus pantallas salen
  `confirmado`. Este roadmap ya dice que con una sola fuente automática **nada se
  publica confirmado sin una persona**. Si eso se sostiene, el diseño apaga el
  estado dominante y destaca el raro, y eso no se arregla cambiando un color:
  cambia cuál es la fila por defecto. Es la primera entrada de su inventario, y
  su disparador ya tiene fecha: el **2026-09-08**.

## Más adelante (idea, sin compromiso)

- ~~Interfaz definitiva e identidad visual~~ → **subió a *Después* el
  2026-09-01 como EPIC-004**, congelada. No subió por prioridad: subió porque el
  trabajo ya existía y necesitaba custodia. El logo a 48 px, la marca de agua en
  la captura compartida por WhatsApp y los números tabulares siguen siendo sus
  criterios, y siguen sin tocarse antes del informe.
- **Landing con lista de espera. Objetivo declarado: 500 inscritos antes del
  producto.** Se queda aquí, y ahora con una razón más que el criterio de corte:
  hoy su mockup sería inventado y su formulario contradiría la carta a la RFGF.
  **No confundirla con EPIC-003**, que es una página sin captación, sin mockup y
  sin patrocinio, hecha para respaldar la carta y no para captar a nadie.
- Ampliación de competiciones: Primeira e Segunda Galega, femenino, y las
  divisiones nacionales con proveedor de pago.
- Datos B2B: feed/widget para medios comarcales, radios y clubes. Es el negocio
  escalable (`docs/negocio/monetizacion.md`).
- Socios, patrocinio y ayudas públicas.

## Deuda técnica

- **EPIC-MEJORA — Mejoras y deuda técnica.** Bucket, sin plazo y sin gate. Creada
  el 2026-09-01 al descubrirse que **seis artefactos rutaban trabajo ahí y la
  épica no existía**: ni directorio, ni entrada aquí, ni fila en el tablero. Lo
  aplazado estaba enterrado en ledgers de specs cerradas. Su inventario del
  primer día son cinco entradas, y **cuatro son barreras que no muerden**, no
  funciones que falten: no hay CI, la purga de 30 días no tiene ejecutor, la
  permanencia de las URL no la vigila ningún test, las barreras de contenido
  miran un HTML que no es el servido, y los 360 px no se han visto en un
  navegador. Ninguna bloquea la carta a la RFGF. **No sube de sección por
  antigüedad**: solo si aporta evidencia para el go/no-go o desbloquea algo con
  plazo.

## Criterios de corte

Qué haría subir o bajar una épica de sección:

- **Sube** lo que aporte evidencia para el go/no-go. Nada más compite con
  EPIC-001, y ahora hay algo que compite de verdad: **el acceso a futgal**. No es
  una épica, es una gestión, y sin ella todas las cifras de EPIC-002 nacen sin
  referencia oficial.
- **Baja** todo lo que dependa de una cifra que aún no tenemos. Interfaz, marca y
  patrocinio no se tocan antes del informe: son caros de rehacer y su valor
  depende de que el dato exista. **El recíproco es el que dejó subir a EPIC-003**
  el 2026-08-31: lo que ya es cierto hoy y seguirá siéndolo salgan como salgan
  las cifras —quiénes somos, cómo rastreamos— no está sujeto a este corte. La
  prueba de que algo pasa el filtro es que **no cambiaría ni una línea** con el
  informe en la mano.
- **Corte duro de EPIC-001:** si la métrica de operación supera con mucho los
  30 min por jornada, el problema no es de interfaz sino de modelo de negocio, y
  la siguiente épica es "comunidad de corresponsales", no "producto".
- **Corte duro de conflictos:** > 15 % obliga a rediseñar el motor antes de
  ampliar competiciones — salvo que el test de espejo dicte que las fuentes
  automáticas no son independientes: entre espejos no hay desacuerdo posible, así
  que en ese escenario la cifra no mide lo que su nombre dice y el corte no
  aplica. **Los dos cortes duros son de EPIC-002**, que es donde viven ahora esas
  cifras.
