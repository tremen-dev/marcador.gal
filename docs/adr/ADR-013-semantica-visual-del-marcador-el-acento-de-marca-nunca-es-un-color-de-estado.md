---
id: ADR-013
tipo: adr
estado: aprobada
historial:
  - {estado: borrador, fecha: 2026-09-01, por: sdd-arquitecto}
  - {estado: aprobada, fecha: 2026-09-01, por: Alberto Fojo}
aprobada-por: Alberto Fojo
---
# ADR-013: Semántica visual del marcador: el acento de marca nunca es un color de estado

- Deciders: propone `sdd-arquitecto` el 2026-09-01, a partir del sistema de
  diseño que **Alberto Fojo** encargó fuera del pipeline ese mismo día y dio por
  bueno como v1.0. Aprueba **Alberto Fojo** en el gate. El matiz que hay que
  mirar con lupa en la aprobación no es la paleta —está medida— sino **el
  recorte**: este ADR fija *reglas*, no *pantallas*, y deja explícitamente
  abierto **cuál de los dos cualificadores es el normal**. Aprobar esto no
  aprueba el diseño de la interfaz.
- Specs relacionadas: **ninguna hoy, y es a propósito**. Lo consumirá la primera
  spec de interfaz del marcador, que no existe y no debe existir mientras
  **EPIC-004** esté congelada. **No modula SPEC-004** (`hecho`, GREEN) ni
  SPEC-005, SPEC-006 o SPEC-007: ver «Fuera de alcance», punto 3.

## Contexto

El 2026-09-01 se produjo un sistema de diseño para el marcador **fuera del
pipeline** —seis artboards, paleta, tipografía, dos vistas y dos densidades de
fila— y Alberto Fojo lo dio por bueno como v1.0. Al llevarlo por la vía correcta
apareció el problema: `docs/roadmap.md` coloca «interfaz e identidad visual» en
*Más adelante* y su criterio de corte dice que no se tocan antes del informe,
con una prueba explícita: *«no cambiaría ni una línea con el informe en la
mano»*.

Aplicada esa prueba, el trabajo se parte limpiamente en dos, y la partición es
la razón de que exista este ADR:

- **Las pantallas suspenden el test.** Cómo se ve una fila depende de cuánta
  operación manual haya, y esa cifra no existe: EPIC-001 no tiene todavía
  ninguna de sus cuatro. Quedan congeladas en **EPIC-004 — Identidade visual e
  interface do marcador**
  (`docs/epicas/EPIC-004-identidade-visual-e-interface-do-marcador/_epica.md`,
  `borrador`), con su inventario de seis huecos.
- **Las reglas semánticas y de identidad lo pasan.** No se derivan del sistema
  de diseño: se derivan de `FOUNDATION.md` (**D-1**, **D-2**, **D-6**, **D-8**),
  de `docs/fundacion/reglas.md` (**RN-01..RN-13**) y de
  `docs/fundacion/dominio.md`, todos locked o aprobados. Ninguna cifra del
  informe las mueve. Congelarlas en la épica sería el error simétrico al de
  construir la pantalla: dejar en un worktree sin commit una regla que ya es
  cierta.

Este ADR registra **la segunda mitad**, y solo esa.

### De dónde sale el material, y en qué estado está

- Sistema de diseño publicado:
  `https://claude.ai/code/artifact/ed606441-79a1-4103-9b0e-5f48511b92b9`
- Fuentes: rama `ft/design-system`, directorio `design/` (worktree en
  `.claude/worktrees/design-system/`), `.dc.html` autocontenidos más
  `design/_tokens.css`. **Sin commit el 2026-09-01.** Consolidarlas es trabajo de
  EPIC-004, no de este ADR: aquí solo se escriben las reglas, que no dependen de
  que el HTML sobreviva.

### El parentesco: chasis de tremen.dev, acento propio (D-1)

marcador.gal es marca de **tremen.dev**, y el sistema hereda de él el **chasis**:
fondo oscuro cálido, superficies y líneas escalonadas, tipografía Geist y Geist
Mono, radios 8/10/14/999, retículas punteadas. El origen está en
`/Users/albertofojo/src/tremen-dev/tremen-sdd/design/tremen-ds/`.

Lo que **no** se hereda es el acento. tremen.dev usa ember `#FF6B00`, y ahí está
el choque que gobierna todo lo demás.

### La razón de todo: en un marcador, el naranja ya significa algo

**El color de marca no puede ser el color de un estado.** En una pantalla de
resultados en directo, el naranja es el color natural de «esto está vivo». Si la
marca y el estado comparten color, la pantalla pierde la capacidad de decir qué
partido está en juego: el acento aparece en la cabecera, en los enlaces y en los
rótulos, así que un partido `live` deja de destacar sobre el resto por no ser el
único sitio donde ese color aparece.

Eso no es una preferencia estética. Es **D-8** —«el producto es densidad: todo
en una pantalla, legible con mala cobertura»— aplicada al color: en treinta filas
apretadas, el único mecanismo barato para localizar lo que está pasando ahora es
que un color signifique una cosa y solo una.

De ahí la separación: **el acento de marca se muda a un verde propio `#56DB8F` y
ember `#FF6B00` queda reservado en exclusiva al estado `live`**. Y de paso, D-1
sale reforzado por el mismo movimiento: el hijo se distingue del padre a primera
vista sin dejar de ser reconociblemente de la casa.

### La paleta, con contrastes medidos

Los acentos se derivaron en oklch **compartiendo croma y claridad**, para que
ninguno grite más que otro: lo que jerarquiza no es la saturación, es **dónde**
se usa cada uno. Contrastes calculados sobre el fondo `#111110` (WCAG 2.x,
recalculados por `sdd-arquitecto` el 2026-09-01, no estimados):

| Rol | Valor | Contraste sobre `#111110` |
|---|---|---|
| Texto principal (bone) | `#F5F1EA` | **16.78:1** |
| **Acento de marca** | `#56DB8F` | **10.73:1** |
| Amber | `#F0B135` | **9.94:1** |
| **Ember — `live`, y nada más** | `#FF6B00` | **6.62:1** |
| Alerta | `#FF655A` | **6.53:1** |
| Texto secundario | `#A7A5A0` | **7.68:1** |
| Gris de cualificador | `#8E8C88` | **5.63:1** |
| Gris tenue | `#716F6C` | **3.77:1** |

El último es el que hay que vigilar: **`#716F6C` no llega a 4.5:1**, así que es
decoración y separadores, **nunca un dato**. Un marcador ilegible no es
provisional: es invisible.

### El hallazgo que este ADR NO puede congelar

El sistema de diseño pinta `provisional` en gris y con etiqueta, **tratándolo
como la excepción**, y la mayoría de sus pantallas salen `confirmado` con la
traza «2 fontes independentes ≥ 0.7 · RN-02».

`docs/roadmap.md` ya registra que **esa segunda vía de RN-02 está cerrada por
aritmética**: `futgal.es` prohíbe el rastreo (ADR-008) y solo queda **una** fuente
automática capturable, `ceroacero.es`. Dos fuentes independientes de peso ≥ 0.7
no hay. Hoy, por tanto, **nada se publica confirmado sin una persona** —vía
RN-01, operador con peso 1.0— y eso ya no es una hipótesis del spike: es
restricción de diseño del motor.

Si se sostiene, el sistema de diseño **apaga el estado dominante y destaca el
raro**, que es exactamente lo que **D-6** y **RN-12** existen para impedir: la
pantalla estaría mintiendo sobre la fiabilidad del dato. Pero *si se sostiene* es
la pregunta abierta, no la respuesta: depende del veredicto de EPIC-001 sobre las
fuentes candidatas y de si aparece una segunda vía automática.

**Conclusión, y es la parte más importante de este ADR: cuál de los dos
cualificadores es el normal está en disputa, y por eso NO se congela aquí.** Un
ADR es inmutable; meter dentro una asignación que va a cambiar obligaría a
superseder este documento entero para mover un énfasis. Lo que sí es cierto hoy y
lo seguirá siendo con el informe en la mano es el **invariante** —que el
cualificador se distingue siempre, y cómo—, y eso es lo único que se fija.

## Decisión

Se fijan **seis invariantes** de semántica visual (§1..§6) y **una decisión de
identidad** (§7, el logotipo). Son
citables por número (`ADR-013 §N`) desde specs, código y commits, y vinculan a
cualquier interfaz del proyecto: el marcador, el panel del operador (`src/admin/`),
el bot y cualquier pantalla futura.

### §1 — El acento de marca nunca es un color de estado

El acento de marca es **`#56DB8F`**. **Ember `#FF6B00` queda reservado en
exclusiva al estado `live`** y no se usa para marca, enlaces, rótulos, focos ni
decoración.

La regla es más general que sus dos valores: **ningún color que signifique un
estado del dominio puede ser a la vez el color de la marca**, hoy o después. Si
mañana la marca cambia de verde, lo que no puede es aterrizar sobre un color que
ya signifique algo en la pantalla.

Deriva de **D-8** (densidad: la pantalla tiene que poder decir qué está vivo) y
de **D-1** (imagen propia: el acento es lo que separa a marcador.gal de
tremen.dev).

### §2 — Ningún estado ni cualificador se codifica solo con color

Todo estado de partido (`scheduled`, `live`, `finished`, `postponed`,
`suspended`, más *sen sinal* de RN-07) y todo cualificador de publicación
(`confirmado` / `provisional`, RN-02 y RN-03) llevan **siempre**, además del
color, **texto o forma**: etiqueta, icono, peso tipográfico, posición o
tratamiento del propio dato.

Motivo, y son tres a la vez: **daltonismo**, **pantalla mala** y **sol de las
siete de la tarde en un campo de Preferente**. Es el escenario de uso real que
D-8 nombra como «legible con mala cobertura», extendido a lo que no es cobertura.

Consecuencia dura: **una spec de interfaz cuyo único distintivo entre confirmado
y provisional sea el color incumple este ADR**, aunque los contrastes pasen.

### §3 — Todo dígito del sistema es tabular

Cifras de marcador, minutos, horas, posiciones de tabla, puntos y cualquier
número que se actualice en vivo van en **cifras tabulares** (`font-variant-numeric:
tabular-nums`, con la familia mono del sistema donde corresponda).

`docs/negocio/marca.md` ya lo pedía en «Identidad visual»; aquí pasa de deseo a
invariante. Motivo: treinta filas de marcador son una columna de números; si un
dígito cambia de ancho al actualizarse, **la fila salta** y la vista se vuelve
ilegible justo en el momento en el que más se mira, que es cuando marca alguien.

### §4 — Sin escudos de clubs

**No se publican escudos de clubs**, ni en el marcador, ni en el panel, ni en la
imagen de compartición, ni como marca de agua. La identidad de un equipo en la
pantalla es **su nombre canónico RFGF** (`docs/fundacion/dominio.md`), que no se
traduce.

No es una decisión de diseño: `FOUNDATION.md` lo lista como **no-negociable**
—son marcas registradas y sin política de uso explícita no se publican—. Se
escribe aquí porque es en el diseño donde se incumple sin querer, y porque un
sistema visual que no lo dice invita a rellenar el hueco de la izquierda de la
fila con un logo.

Consecuencia de diseño que hay que asumir de frente: **la fila tiene que
funcionar solo con tipografía**. No hay muleta gráfica para distinguir dos
equipos de nombre parecido.

### §5 — Ni celeste ni blanquiazul: ninguna paleta de club

La paleta del producto **no adopta los colores de ningún club**, ni por
casualidad ni por guiño. `docs/negocio/marca.md` lo dice desde el principio
—«paleta que no sea celeste ni blanquiazul»— y la razón es de posición, no de
gusto: un marcador que se ve de todos los equipos no puede parecer de uno.

El verde `#56DB8F` se elige también por eso, además de por §1.

### §6 — Ningún color de cualificador baja de 4.5:1

Cualquier color que porte **un dato o un cualificador** cumple **≥ 4.5:1** sobre
el fondo del sistema. Los grises tenues —hoy `#716F6C`, **3.77:1**— son
**decoración y separadores, nunca un dato**.

La aplicación crítica es la que este ADR deja abierta: **apagar un cualificador
no puede significar hacerlo ilegible**. Un marcador que no se lee no está marcado
como provisional; está ausente, y eso contradice **RN-03** («provisional a tiempo
antes que confirmado tarde… y la interfaz lo distingue»). Distinguir es
distinguir dos cosas legibles, no borrar una.

### §7 — Logotipo tipográfico, icona abierta

El logotipo de v1.0 es **tipográfico**: `marcador▮gal` — Geist 800, tracking
−0.045em, todo en minúscula, con el punto del dominio sustituido por un **bloque
en el color de marca**.

Se registra aquí porque es **texto, no un activo producido**, y su uso actual —el
nombre escrito en una cabecera— **no es inversión**, así que no choca con la
precondición humana abierta (comprobación en OEPM). Alberto Fojo lo dio por bueno
el 2026-09-01.

**La icona queda explícitamente abierta.** Las tres semillas exploradas (dúas
liñas, o bloque, a matriz) **no se eligieron** y no entran en este ADR. Elegir
una es producir un activo de marca, y eso está bloqueado hasta OEPM.

## Fuera de alcance — a propósito, no por olvido

Esto es la mitad del ADR que más va a consultarse, porque es donde está la
confusión probable.

**1. Las pantallas.** Las dos vistas (Xornada y Global), las dos densidades de
fila (ampla y compacta), la tabla de clasificación, los estados de foco, los
estados de carga y de dato viejo, y el panel del operador. **Congelados en
EPIC-004** con su inventario. Ninguna de esas decisiones pasa el criterio de
corte del roadmap.

**2. Qué cualificador se enfatiza y cuál se apaga.** **Decisión abierta, y
deliberadamente no congelada**, por lo explicado en el contexto: la segunda vía
de RN-02 está cerrada por aritmética, así que hoy lo normal podría ser
`provisional`, y el sistema de diseño asume lo contrario. Este ADR fija **que se
distinguen siempre** (§2), **con qué medios** (color *más* texto o forma) y **con
qué suelo de legibilidad** (§6). **No** fija cuál va a peso completo y cuál
apagado. Esa asignación es la **entrada 1 del inventario de EPIC-004**, y su
disparador es el veredicto de EPIC-001 o cualquier decisión firme anterior sobre
si habrá segunda fuente automática. Es la entrada que más caro sale ignorar,
porque no se arregla cambiando un color: cambia cuál es la fila por defecto.

**3. Aplicar la paleta a `src/app/globals.css`.** **No.** **SPEC-004 está `hecho`
y verificada GREEN**, y deja «identidad visual, logo y paleta» **explícitamente
fuera de alcance a propósito**: la página de proyecto de EPIC-003 se apaña con
tipografía porque su trabajo es respaldar la carta a la RFGF, no vender un
producto. Este ADR **no autoriza repintarla**. Cambiar eso exige **una spec nueva
que lo motive**, no un retoque, y esa spec tendría que decir qué problema
resuelve, porque hoy no hay ninguno. Quien llegue aquí buscando permiso para
tocar `globals.css` no lo tiene.

**4. Tema claro.** `src/app/globals.css` sirve hoy un tema **claro por defecto**
con variante oscura bajo `prefers-color-scheme: dark`; el sistema de diseño del
marcador es **solo oscuro**. Hoy no chocan porque **no comparten una sola línea
de CSS**. **Decisión abierta**: entrada 6 del inventario de EPIC-004, y su
disparador es la primera spec que aplique tokens al sitio, que es cuando el
conflicto se vuelve real. Este ADR **no** decide que el producto sea dark-only.

**5. Producción de activos de marca** —SVG, favicon, iconos de app, imagen de
compartición, y la elección de icona de §7—. **Bloqueada** por la precondición
humana abierta: comprobación en OEPM de que no hay registro previo de la marca
«marcador». Está en el roadmap y en EPIC-004, con dueño humano.

**6. El suelo de toque de 44 px y su concesión en la fila compacta.** Es
consecuencia de las pantallas, no invariante de identidad: depende de qué fila y
qué densidad, que es justo lo que está congelado. **Va con EPIC-004.**

**7. Tokens como código.** Que estos valores lleguen a `:root` en algún fichero
del repositorio es trabajo de implementación con spec, no de este ADR. Aquí los
valores son **normativos como decisión**, no como CSS desplegado.

## Consecuencias

### Positivas

- **Lo que ya era cierto deja de vivir en un worktree sin commit.** Seis reglas
  citables por número sobreviven aunque el HTML del sistema de diseño se pierda,
  se rehaga o quede obsoleto. Es el criterio de éxito 3 de EPIC-004, cumplido
  desde fuera de la épica.
- **El corte del roadmap se respeta y se puede auditar.** Se movió exactamente lo
  que pasa la prueba de «no cambiaría ni una línea con el informe en la mano», y
  ni una decisión más. Ninguna de estas seis reglas depende de una cifra que aún
  no tenemos.
- **La regla de §1 vale para toda la vida del producto**, no para esta paleta: es
  una restricción sobre *qué puede significar un color*, y sobrevive a un cambio
  de marca.
- **§2 y §6 juntas hacen inviable el error caro.** El día que se decida apagar un
  cualificador, el diseño no podrá hacerlo dejándolo solo en gris ni dejándolo
  ilegible. Esa es la protección concreta contra el hallazgo del inventario,
  puesta **antes** de saber cuál es la respuesta.
- **§4 fuerza a diseñar la fila que de verdad vamos a poder publicar.** Es
  incómodo, y es mejor descubrirlo en un ADR que en la primera captura que se
  comparte por WhatsApp.

### Negativas / follow-ups

- **Este ADR se aprueba sin poder probarse.** No hay interfaz, así que ninguna de
  las seis reglas ha sobrevivido todavía a un sábado real. El criterio de éxito 5
  de EPIC-004 dice que se mide «con el producto delante, no con el canvas», y hoy
  no hay producto. Se asume: las reglas son derivadas de decisiones locked, no de
  la pantalla, y ese es el motivo de que puedan escribirse antes.
- **La asignación abierta del punto 2 es una bomba de relojería con fecha
  desconocida.** Queda con disparador (**entrada 1 del inventario de EPIC-004**)
  y con dueño (`sdd-arquitecto`, el día que EPIC-001 dé veredicto). Si el
  veredicto llega y nadie vuelve a esta entrada, el sistema de diseño se aplicará
  tal cual está y **destacará el caso raro**. El riesgo no se elimina aquí; se
  hace visible y citable.
- **Se congela un acento de marca antes de la comprobación en OEPM.** Si el
  nombre saliera sucio, la conversación es sobre el **nombre**, y arrastraría al
  logotipo tipográfico de §7 —que *es* el nombre—. El color y las cinco reglas
  restantes sobrevivirían intactos, así que la pérdida está acotada. Se acepta a
  sabiendas: §7 registra texto, no inversión.
- **`#716F6C` queda en el sistema por debajo de 4.5:1.** No se elimina porque
  separadores y retículas lo necesitan, pero es el valor que un implementador
  tomará por descuido para «lo secundario». **§6 es la regla que hay que citar en
  la revisión**, y conviene que la primera spec de interfaz lo verifique con test,
  no a ojo.
- **Queda una asimetría entre este ADR y el sitio público en producción.** El
  sitio de EPIC-003 no cumple ni contradice nada de esto: **vive fuera**, con su
  propia paleta y su tema claro por defecto. Es correcto hoy (punto 3 y 4 de
  fuera de alcance) y es exactamente el tipo de cosa que dentro de seis meses
  alguien leerá como incoherencia. Esta línea es la respuesta.
- **No hay ADR de accesibilidad más allá de §2 y §6.** Foco visible, navegación
  por teclado y orden de lectura no están cubiertos —son entrada 3 del inventario
  de EPIC-004— y **bloquean cualquier spec de interfaz**. Que este ADR hable de
  contraste no debe leerse como que la accesibilidad ya está resuelta.

## Alternativas consideradas

- **Meterlo todo —reglas y pantallas— en EPIC-004 y no escribir ADR.**
  Rechazada: congela una regla que ya es cierta. Las seis reglas se derivan de
  D-1, D-2, D-6, D-8 y de RN-01..RN-13, que están locked; ninguna cifra del
  informe las mueve, así que retenerlas es el error simétrico al de construir la
  pantalla. Además deja las reglas citables solo por captura de pantalla, que es
  justamente la patología que hizo nacer EPIC-004.
- **Escribir el ADR con la asignación de énfasis incluida** («provisional va
  apagado, confirmado a peso completo», tal como lo pinta el sistema de diseño).
  **Rechazada, y es el rechazo central de este documento.** Un ADR es inmutable:
  meter dentro una asignación que está en disputa por aritmética obligaría a
  superseder el documento entero para mover un énfasis, y mientras tanto daría
  autoridad de decisión locked a lo que hoy es una suposición contradicha por el
  roadmap.
- **Escribir la asignación al revés** («provisional es el normal, va a peso
  completo»). Rechazada por el mismo motivo con el signo cambiado: es la lectura
  más probable hoy, pero **sigue siendo una predicción**. El veredicto de
  EPIC-001 puede abrir una segunda vía automática. Un ADR no es el sitio para
  apostar.
- **Heredar ember `#FF6B00` como acento de marca, igual que tremen.dev, y buscar
  otro color para `live`.** Rechazada: invierte el problema sin resolverlo —el
  naranja seguiría apareciendo en cabecera y enlaces, compitiendo con el estado—
  y además desperdicia el color que el usuario ya lee como «en directo» sin que
  nadie se lo explique. Y debilita D-1: el hijo indistinguible del padre.
- **No fijar acento propio y dejar la marca en bone `#F5F1EA`** (sin color).
  Rechazada: deja el producto sin marca reconocible en la captura compartida por
  WhatsApp, que `docs/negocio/marca.md` señala como principal canal de marketing.
  Un sistema sin acento no es neutral, es anónimo.
- **Permitir escudos de clubs «solo en el detalle del partido», donde caben y no
  hay problema de espacio.** Rechazada: `FOUNDATION.md` lo lista como
  no-negociable sin matiz de superficie, y el matiz de superficie es exactamente
  como se erosionan estas cosas. La puerta se abre con una política de uso, no
  con una excepción de diseño.
- **Aprovechar el ADR para aplicar la paleta al sitio de EPIC-003, «ya que
  está».** Rechazada, y anotada como la tentación más probable: SPEC-004 está
  `hecho` y GREEN con «identidad visual, logo y paleta» fuera de alcance a
  propósito. Un ADR no reabre una spec cerrada; una spec nueva sí, si alguien
  puede decir qué problema resuelve.
- **Declarar el producto dark-only en este ADR**, ya que el sistema de diseño lo
  es. Rechazada: `globals.css` sirve hoy tema claro por defecto y no hay ningún
  choque real todavía. Decidirlo ahora sería congelar por adelantado una decisión
  que no cuesta nada tomar el día que el conflicto exista, que es lo que dice la
  entrada 6 del inventario.
