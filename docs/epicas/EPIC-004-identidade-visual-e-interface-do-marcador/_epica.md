---
id: EPIC-004
tipo: epica
estado: aprobada
historial:
  - {estado: borrador, fecha: 2026-09-01, por: sdd-producto}
  - {estado: aprobada, fecha: 2026-09-01, por: Alberto Fojo}
aprobada-por: Alberto Fojo
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

**Colisión conocida, anotada el 2026-09-01 al descongelarse EPIC-002.** Esta
épica guarda todo el diseño de interfaz y está congelada; EPIC-002 lista entre lo
que **no** depende de la RFGF una «página mínima por polling» y un «panel de
correcciones». Es decir: **se va a construir interfaz mientras su diseño está
congelado.** No es un fallo de ninguna de las dos, y no se resuelve descongelando
ésta por simpatía. Se resuelve reconociendo qué necesita cada cosa: una página
mínima de medición y un panel de operador no necesitan identidad visual, pero sí
necesitan las dos entradas que esta épica tiene en el inventario —qué estado es el
normal, y cómo se opera desde el móvil—. Si alguna spec de EPIC-002 las toca,
**el disparador de esas entradas es esa spec**, no el go/no-go.

**Por qué congelada y no en curso.** El criterio de corte tiene una prueba:
*«no cambiaría ni una línea con el informe en la mano»*. Las pantallas la
suspenden, y no por prudencia genérica sino por un hecho ya registrado en el
roadmap: con una sola fuente automática capturable, **nada se publica
*confirmado* sin una persona**. Diseñar la pantalla definitiva antes de saber
cuánta operación manual hay es diseñar para un producto que puede no existir.

**Qué NO espera aquí.** Lo que sí pasa el corte salió de esta épica y ya se
movió: las reglas semánticas del marcador están en **ADR-013** (`aprobada`,
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

> **Alcance revisado el 2026-09-03 por ADR-026 §6. La épica NO se descongela.**
> El sistema de diseño pasó a ser **vinculante para toda interfaz del producto**
> —decisión de Alberto Fojo— y eso hizo dos de las cosas que este alcance
> reservaba para «cuando se descongele». Dejar la épica diciendo una cosa y el
> ADR otra sería exactamente la patología que la hizo nacer: trabajo real rutado
> a un sitio que no lo describe. Lo que cambia es **qué custodia**, no **cuándo
> empieza**: el criterio de corte sigue intacto y el deshielo sigue siendo el
> go/no-go.

- **Dentro:**
  - Custodia del sistema de diseño v1.0 y de sus fuentes: paleta con contrastes
    medidos, tipografía, las dos densidades de fila (ampla y compacta), las dos
    vistas (Xornada y Global), y las semillas de marca.
  - El inventario de huecos conocidos y su disparador (ver más abajo).
  - **La reparación del propio artefacto** (entra el 2026-09-03). Adoptar el
    sistema obligó a inventariarlo, y el inventario destapó que **el artefacto no
    cumple lo que él mismo declara**: `_tokens.css` no lo usa ningún artboard,
    las escalas viven en prosa y el sistema se las salta, no hay foco ni teclado
    ni componentes de formulario, `provisional` se codifica **solo por color** en
    dos vistas —incumpliendo ADR-013 §2 dentro de sí mismo—, y tres artboards no
    se pueden abrir porque les falta `support.js`. ADR-026 §4 lista seis
    desviaciones que **se corrigieron en el producto y no aquí**, así que hasta
    que esta reparación ocurra el sistema y el producto dicen cosas distintas.
    La lista de divergencias de ADR-026 §3.4 es la agenda de esa reconciliación.
  - Cuando se descongele: interfaz definitiva del marcador y producción de
    activos de marca.

  **Lo que sale de aquí el 2026-09-03, y a dónde va:**
  - **El panel del operador (`src/admin/`) → EPIC-002.** No es una previsión: ya
    salió. **SPEC-017** está `hecho` y verificada GREEN, con ADR-024 y ADR-025
    detrás y con el suelo de interfaz —foco, teclado, 44 px— que este alcance no
    había dado.
  - **Los tokens como código (`src/design/`) → EPIC-002**, por ADR-026 §3.1, que
    los convierte en domicilio único y comprobado por test de paridad. No espera
    al deshielo porque el producto ya los necesita.

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
| 1 | ~~**`provisional` es el estado normal, no la excepción.**~~ **CERRADA el 2026-09-03 por ADR-026 §2**, y para **todas** las interfaces, no solo el panel. Era «la entrada que más caro sale ignorar» y resultó estar **mal planteada**: la pregunta era cuál de los dos se apaga, y la respuesta es que **ninguno**. Los dos van con el color de texto principal y los dos con etiqueta —también `confirmado`, que el sistema deja mudo porque «el normal no se anuncia»—; `--fg-prov` desaparece con ese nombre para que nadie lo reintroduzca, y `confirmado` **no** se pinta con el acento de marca. `docs/fundacion/dominio.md` ya lo afirma. | **Cerrada, no despierta.** Se contestó **antes** de escribir la primera línea de CSS del panel, que era justo lo que esta entrada pedía. Lo que queda es del artefacto, no de la regla: el sistema sigue pintando `provisional` en gris y **solo por color** en Móvil y Global, y eso entra en «la reparación del artefacto». |
| 2 | **Falta la tabla de clasificación.** Se cayó del sistema al sustituir el panel de detalle por traza + historial de decisiones. Es justamente el componente de tabla densa que motivó el encargo. | Se descongele la épica, o antes si alguna spec necesita el componente. |
| 3 | **Faltan estados de foco y navegación por teclado.** Se midieron contrastes; no se dibujó ningún anillo de foco. Un marcador denso sin foco visible es inusable con teclado. | **Sigue abierta sobre el artefacto, y ya no bloquea al producto** (2026-09-03). Lo que decía —«bloquea cualquier spec de interfaz»— lo resolvió **ADR-025 §2**, que da foco visible y teclado como **suelo**, y que ADR-026 §5 dejó **intacto y permanente**: adoptar el sistema **no** cierra esta entrada, porque el sistema no los tiene. Del lado del artefacto entra en «la reparación». |
| 4 | **Faltan estados de carga y de dato viejo.** El snapshot llega por polling (ADR-003) y la promesa es «legible con mala cobertura»: no hay esqueleto de carga ni aspecto de pantalla cuyos datos tienen dos minutos. | **A punto de dispararse** (2026-09-03). Su disparador escrito era «la primera spec de `src/api/`», y ésa es **la del snapshot**, la siguiente de EPIC-002. Queda avisado aquí para que no la pille por sorpresa: es la entrada que esa spec tendrá que contestar, como SPEC-017 contestó la 1 y la 3. |
| 5 | **El panel del operador no tiene ningún diseño.** `src/admin/` es donde viven RN-04 y RN-06 —bajar un marcador, aplazar un partido— desde el móvil, y es donde un error de diseño cuesta un marcador mal publicado. | **Cerrada en lenguaje, abierta en controles** (2026-09-03). **SPEC-017 está `hecho`** y el panel ya tiene diseño: sale de `src/design/` por ADR-026 §3.1, con el suelo de ADR-025 §2 y §3 encima. Lo que sigue abierto es del artefacto: **el sistema no trae ningún componente de formulario**, así que los controles del panel se dibujaron sin patrón que seguir. Entra en «la reparación». |
| 6 | **Sin decidir: ¿tema claro?** Y la relación es la **inversa** de lo que se creyó al abrir esta épica: `src/app/globals.css` no «soporta claro», **sirve claro por defecto** (`--paper:#fbfbf9`, `--ink:#14181c`) y solo pasa a oscuro bajo `prefers-color-scheme: dark`. El sistema de diseño del marcador es oscuro-only. Es decir: el sitio público y el marcador no son variante y base, son dos bases opuestas. Hoy no chocan porque no comparten una línea de CSS. Corregido por `/sdd-arquitecto` al escribir ADR-013. | **No se cierra, y empeora de forma controlada** (2026-09-03). ADR-026 §3.6 hace **oscuras** las interfaces que gobierna y **no** el sitio público, que sigue claro por defecto (§1). El choque pasa de **latente a visible**: `marcador.gal` sirve dos temas opuestos en el mismo dominio para quien navegue entre el producto y `/proxecto`. **Dueño y disparador nuevos: la spec de migración del sitio público**, que ADR-026 §1 nombra sin escribir, con disparador propio —el go/no-go, o antes si comparten navegación—. Sigue sin chocar en el código: ninguna de las tres bases comparte una línea de CSS. |

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
