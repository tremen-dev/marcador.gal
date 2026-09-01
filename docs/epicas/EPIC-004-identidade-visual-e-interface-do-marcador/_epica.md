---
id: EPIC-004
tipo: epica
estado: borrador
historial:
  - {estado: borrador, fecha: 2026-09-01, por: sdd-producto}
---
# EPIC-004 — Identidade visual e interface do marcador

> Nace el 2026-09-01, **congelada de nacimiento y a propósito**. Alberto Fojo
> encargó un sistema de diseño fuera del pipeline, lo dio por bueno como v1.0 y
> pidió llevarlo «por la vía correcta». La vía correcta resultó no ser una spec:
> el roadmap coloca interfaz e identidad en *Más adelante* y su criterio de corte
> dice que **no se tocan antes del informe**. Esta épica no levanta ese corte. Lo
> que hace es darle **un sitio** a un trabajo que ya existe, para que no se pierda
> mientras espera.

## Objetivo

Ser el destino del trabajo de identidad visual e interfaz del marcador **hasta
que el go/no-go decida si hay producto que vestir**, y llegar a ese momento con
el material y los huecos inventariados en vez de dispersos.

**El problema que resuelve no es de diseño: es de custodia.** El 2026-09-01, el
mismo día, se descubrió que EPIC-MEJORA se estaba usando sin existir —seis
artefactos rutaban trabajo a un buzón que no era un directorio, ni una entrada
del roadmap, ni una fila del tablero—. Este sistema de diseño tiene exactamente
esa forma: seis artboards, cinco huecos conocidos y un hallazgo que lo contradice,
viviendo en un artefacto publicado y en un worktree sin commit. Sin esta épica,
dentro de tres meses nadie sabrá que la tabla de clasificación falta ni por qué
las pantallas enfatizan al revés.

**Por qué congelada y no en curso.** El criterio de corte tiene una prueba:
*«no cambiaría ni una línea con el informe en la mano»*. Las pantallas la
suspenden, y no por prudencia genérica sino por un hecho ya registrado en el
roadmap: con una sola fuente automática capturable, **nada se publica
*confirmado* sin una persona**. Diseñar la pantalla definitiva antes de saber
cuánta operación manual hay es diseñar para un producto que puede no existir.

**Qué NO espera aquí.** Lo que sí pasa el corte salió de esta épica y ya se
movió: las reglas semánticas del marcador están en **ADR-013** (`borrador`,
2026-09-01), porque se derivan de D-8 y de RN-01..RN-13, que están locked, y
ninguna cifra las mueve. Congelar una regla que ya es cierta sería el error
simétrico al de construir la pantalla.

**Y un matiz del gate que conviene no confundir:** aprobar ADR-013 **no aprueba
el sistema de diseño**. El ADR fija que los cualificadores se distinguen siempre,
con qué medios y con qué suelo de legibilidad; **no** fija cuál va a peso completo
y cuál apagado. Esa asignación es la entrada 1 de este inventario y sigue abierta.

## Precondición humana — CONTESTADA A MEDIAS el 2026-09-01

**Alberto Fojo comprobó que «marcador» está ocupado como marca y «marcador.gal»
está libre.** Se lanzó el mismo día que nació la épica, por una razón asimétrica
que resultó ser la correcta: `marcador.gal` está contratado desde el 2026-08-31 y
expira el 2027-08-31, así que descubrir tarde un problema de nombre es el único
desenlace verdaderamente caro.

**Lo que este resultado cambia, y es más que un alivio.** El riesgo no se cierra:
se **reubica**, y de una forma que ya obliga. La marca es **marcador.gal**, con el
dominio dentro, y **nunca «marcador» a secas**. Eso deja de ser preferencia de
estilo y pasa a ser restricción de diseño: cualquier sitio donde el producto se
acorte —etiqueta del icono de app, handle de redes, nombre corto en una
conversación— cae sobre una denominación ocupada. El logotipo tipográfico
`marcador▮gal` ya cumple, porque lleva el `.gal` dentro; una icona que se
etiquetase «marcador» no cumpliría, y eso acota qué semilla puede elegirse.

**Lo que sigue abierto, y por qué no basta lo hecho.** Una búsqueda por
denominación **no es una comprobación de antecedentes registrales**: faltan las
clases de Niza, las marcas de la UE en EUIPO y las denominativas parecidas. El
Localizador de marcas de la OEPM es una aplicación con JavaScript,
`consultas2.oepm.es/LocalizadorMarcas/` responde `404` y no expone endpoint
consultable, y el buscador gratuito **ni siquiera permite filtrar por clase**
(comprobado el 2026-09-01). Queda pendiente una **revisión profesional**;
`/sdd-legal-datos` lo tiene marcado como tal.

Mientras esa revisión siga pendiente: **no se produce ningún activo de marca**
—ni SVG, ni favicon, ni iconos de app, ni imagen de compartición—. El logotipo
tipográfico puede usarse tal como ya se usa (texto, en la cabecera del sitio),
porque eso no es inversión.

## Criterios de éxito

Esta épica **no se cierra por hacer trabajo**: mientras esté congelada cumple su
promesa si son verdad las tres primeras. Las dos últimas son para el día que se
descongele.

1. **Nada de este trabajo vive solo en un chat.** El sistema de diseño, sus
   huecos y sus contradicciones están referenciados desde aquí, y el inventario
   dice de cada entrada **qué la despierta**.
2. **El corte se respeta y se puede auditar.** No hay código de interfaz, ni
   activos de marca, ni cambios en `src/app/globals.css` atribuibles a esta
   épica antes del go/no-go.
3. **Lo que pasó el filtro salió de aquí.** Las reglas semánticas están en un
   ADR aceptado y son citables por número, no por captura de pantalla.
4. **El día que se descongele, se parte de material vivo, no arqueológico.** El
   hallazgo de RN-02 está incorporado —qué estado es el normal— antes de que se
   dibuje una pantalla más.
5. **El sistema sobrevive a un sábado real.** Legible con mala cobertura, el
   logotipo reconocible a 48 px y en la captura que se comparte por WhatsApp,
   los números tabulares sin bailar al actualizarse. Se mide con el producto
   delante, no con el canvas.

## Alcance

- **Dentro:**
  - Custodia del sistema de diseño v1.0 y de sus fuentes: paleta con contrastes
    medidos, tipografía, las dos densidades de fila (ampla y compacta), las dos
    vistas (Xornada y Global), y las semillas de marca.
  - El inventario de huecos conocidos y su disparador (ver más abajo).
  - Cuando se descongele: interfaz definitiva del marcador, panel del operador
    (`src/admin/`), tokens como código, y producción de activos de marca.

- **Fuera (aparcado a propósito, no por descuido):**
  - **Las reglas semánticas del marcador.** Salen a ADR y se mueven ya: pasan el
    corte. No esperan aquí.
  - **La comprobación en OEPM.** Precondición humana, fuera de épica, lanzada ya.
  - **Repintar el sitio público de EPIC-003.** SPEC-004 está `hecho` y verificada
    GREEN, y deja «identidad visual, logo y paleta» explícitamente fuera de
    alcance: la página de proyecto se apaña con tipografía **a propósito**.
    Aplicarle la paleta exige una spec nueva que motive por qué, no un retoque.
  - **La landing con lista de espera** de `docs/negocio/marca.md`. Sigue en *Más
    adelante* con su hero, su formulario y su mockup, y sigue dependiendo del
    informe. No confundirla con esto.
  - **El diseñador freelance galego** para pulir logo y manual mínimo. No se
    encarga hasta tener el marcador real en pantalla: un sistema se prueba con
    una jornada de sábado a las siete, no con un canvas.

## Inventario del primer día

Seis entradas. Cada una con lo que la despierta, porque un hallazgo sin
disparador es un hallazgo olvidado con mejor conciencia.

| # | Entrada | Qué la despierta |
|---|---|---|
| 1 | **`provisional` es el estado normal, no la excepción.** El sistema pinta el marcador provisional en gris y con etiqueta, tratándolo como caso raro, y la mayoría de filas de los mockups salen `confirmado` con traza «2 fontes independentes ≥ 0.7 · RN-02». El roadmap ya registra que esa vía está cerrada por aritmética. Si se sostiene, el sistema apaga el estado dominante y destaca el raro. | **El 2026-09-08.** La carta a la RFGF se envió el 2026-09-01 y ese día se da por no contestada, lo que le pone fecha al veredicto de EPIC-001 por primera vez. **Es la entrada que más caro sale ignorar**, porque no se arregla cambiando un color: cambia cuál es la fila por defecto. |
| 2 | **Falta la tabla de clasificación.** Se cayó del sistema al sustituir el panel de detalle por traza + historial de decisiones. Es justamente el componente de tabla densa que motivó el encargo. | Se descongele la épica, o antes si alguna spec necesita el componente. |
| 3 | **Faltan estados de foco y navegación por teclado.** Se midieron contrastes; no se dibujó ningún anillo de foco. Un marcador denso sin foco visible es inusable con teclado. | Se descongele. Bloquea cualquier spec de interfaz. |
| 4 | **Faltan estados de carga y de dato viejo.** El snapshot llega por polling (ADR-003) y la promesa es «legible con mala cobertura»: no hay esqueleto de carga ni aspecto de pantalla cuyos datos tienen dos minutos. | Se descongele, o la primera spec de `src/api/`. |
| 5 | **El panel del operador no tiene ningún diseño.** `src/admin/` es donde viven RN-04 y RN-06 —bajar un marcador, aplazar un partido— desde el móvil, y es donde un error de diseño cuesta un marcador mal publicado. | La cifra de operación manual de EPIC-002. Si son muchos minutos por jornada, este panel deja de ser accesorio y pasa a ser el producto. |
| 6 | **Sin decidir: ¿tema claro?** Y la relación es la **inversa** de lo que se creyó al abrir esta épica: `src/app/globals.css` no «soporta claro», **sirve claro por defecto** (`--paper:#fbfbf9`, `--ink:#14181c`) y solo pasa a oscuro bajo `prefers-color-scheme: dark`. El sistema de diseño del marcador es oscuro-only. Es decir: el sitio público y el marcador no son variante y base, son dos bases opuestas. Hoy no chocan porque no comparten una línea de CSS. Corregido por `/sdd-arquitecto` al escribir ADR-013. | La primera spec que aplique tokens al sitio, que es cuando el conflicto se vuelve real. |

**Pendiente de comprobación, no de diseño:** no se verificó que los controles de
los tres artboards interactivos respondan al clic; el navegador dejó de responder
durante la comprobación. Es una verificación de cinco minutos, no un hueco de
producto.

## Dónde está el material

- Sistema de diseño publicado: `https://claude.ai/code/artifact/ed606441-79a1-4103-9b0e-5f48511b92b9`
- Fuentes: **`docs/diseno/`**, versionadas el 2026-09-01 en la rama
  `ft/design-system`. Son los seis `.dc.html` (tres de ellos generados desde
  `.tpl.html` con `build.mjs`, que inyecta el bloque compartido `_logic.js`),
  `canvas.json` con la disposición del lienzo, y el HTML publicable.
  Nacieron en un worktree excluido del repositorio y sin commit; consolidarlas
  era el prerrequisito del criterio de éxito 1, y con esto queda cumplido.

## Riesgos

- **El material envejece congelado.** Es el riesgo propio de esta épica y se
  acepta: un sistema sin producto que lo ejerza acumula decisiones no probadas.
  La mitigación es el inventario, que dice qué revisar antes de reutilizar nada,
  no el mantenimiento continuo de un canvas que nadie mira.
- **La tentación de «ya que está hecho, aplicarlo».** El trabajo existe y es
  presentable, y esa es exactamente la fuerza que el criterio de corte está ahí
  para resistir. El coste de rehacer una interfaz no baja porque la primera
  versión fuese bonita.
- **OEPM sale sucia.** El nombre está contratado y en uso público. La mitigación
  es lanzar la comprobación ahora, cuando la única inversión hecha es el dominio.
- **El hallazgo 1 se lee como un detalle estético.** No lo es. Si lo normal es
  provisional, el diseño que apaga lo provisional está mintiendo sobre la
  fiabilidad del producto en la pantalla, que es justo lo que D-6 y RN-12 existen
  para impedir.

## Specs

Ninguna, y no debe haberla mientras la épica esté congelada. El desglose es de
`/sdd-arquitecto` el día que el go/no-go la descongele.
