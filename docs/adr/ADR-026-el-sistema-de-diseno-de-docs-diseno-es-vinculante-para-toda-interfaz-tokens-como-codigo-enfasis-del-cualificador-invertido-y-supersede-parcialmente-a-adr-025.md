---
id: ADR-026
tipo: adr
estado: borrador
historial:
  - {estado: borrador, fecha: 2026-09-03, por: sdd-arquitecto}
---
# ADR-026: El sistema de diseño de `docs/diseno/` es vinculante para toda interfaz — tokens como código, énfasis del cualificador invertido, y supersede parcialmente a ADR-025 §4

- Deciders: **decide Alberto Fojo el 2026-09-03**, con sus palabras: «tenemos un
  design system que hay que seguir `docs/diseno`» y «tenemos que asegurar que
  **cualquier diseño del front** siga las directrices marcadas del design
  system». Se le presentaron los dos motivos por los que ADR-025 §4.3 había dicho
  lo contrario —la contradicción congelada de la entrada 1 del inventario de
  EPIC-004, y que oscuro-only y `globals.css` claro-por-defecto hoy no chocan
  porque no comparten una línea de CSS— y **eligió seguir el sistema y
  superseder**. Escribe `sdd-arquitecto` el ADR que lo sostiene. **Aprueba:
  pendiente de gate humano.**
- **Supersede parcialmente a ADR-025**, que sigue `aprobada` e **inmutable**: no
  se edita ni una línea suya. Qué cae y qué queda, con precisión de bisturí, en
  **§4**. Es la misma vía por la que **ADR-008** reabrió a **ADR-002** y
  **ADR-009** a **ADR-005**.
- Specs relacionadas: **SPEC-017** (`aprobada`, **en implementación**; su **CA-10
  se reescribe** por este ADR, y puede hacerse porque la spec **no está
  cerrada** — ADR-015 gobierna las cerradas); la spec del **snapshot y la página
  mínima por polling**, que viene después y nace ya bajo esta decisión;
  **SPEC-004** (`hecho`, GREEN), que este ADR **no toca** — ver §1.
- Relacionado: **ADR-013** (semántica visual, que **manda por encima de este ADR
  y no se toca**), **ADR-025** (el suelo, superseded parcialmente en §4),
  **ADR-024** (el panel), **ADR-010** (un solo despliegue para el sitio y el
  producto, que es lo que hace visible la consecuencia de §1), **ADR-001** (el
  stack), **ADR-016** (la forma de una lista cerrada con motivo por entrada),
  **EPIC-004** (`aprobada` y **congelada**; su inventario y su alcance cambian —
  §5), **D-1, D-2, D-6, D-8**, **RN-02, RN-03, RN-12**.

## Contexto

### La decisión, y de dónde viene

El 2026-09-01 se produjo un sistema de diseño **fuera del pipeline** —seis
artboards, paleta con contrastes medidos, tipografía, dos vistas y dos
densidades de fila— y Alberto Fojo lo dio por bueno como v1.0. **EPIC-004** nació
ese mismo día para darle **custodia**, congelada a propósito, y **ADR-013**
extrajo de él lo que pasaba el criterio de corte del roadmap: las seis reglas
semánticas que se derivan de decisiones locked y que ninguna cifra mueve.

El 2026-09-03, al escribir el panel del operador, **ADR-025 §4** decidió lo
contrario de lo que hoy se decide: que una interfaz de medición **no comparte una
línea** ni con `src/app/globals.css` ni con `docs/diseno/`. Tenía dos motivos, y
los dos siguen siendo ciertos como hechos:

1. **El sistema está congelado con una contradicción dentro.** Pinta
   `provisional` en gris —`--fg-prov:#8E8C88`— y como excepción, y la mayoría de
   sus pantallas salen `confirmado`. En este proyecto es al revés: con una sola
   fuente automática de peso 0.7 (ADR-008 §1), **nada llega a *confirmado* sin
   una persona**, así que **lo normal es `provisional`**. Es la **entrada 1** del
   inventario de EPIC-004, la que esa épica llama «**la que más caro sale
   ignorar**», y ADR-025 §4.3 razonó que copiar los valores era heredarla con
   código encima.
2. **Oscuro-only contra claro por defecto.** `docs/diseno/_tokens.css` sirve
   `--bg:#111110` sin ninguna variante clara; `src/app/globals.css` sirve **claro
   por defecto** (`--paper:#fbfbf9`) con variante oscura bajo
   `prefers-color-scheme`. Es la **entrada 6** del inventario, y su frase exacta
   es que «**hoy no chocan porque no comparten una línea de CSS**».

**El humano ha decidido seguir el sistema con esos dos motivos delante.** Este
ADR no relitiga esa decisión: la ejecuta. Pero **el primero de los dos motivos no
desaparece por decreto**, y por eso este documento no puede limitarse a decir
«adóptese»: **si el sistema se adopta tal cual, la pantalla apaga el estado
dominante y destaca el raro**, que es exactamente lo que **D-6** y **RN-12**
existen para impedir. Resolver eso es **§2**, y es la mitad de este ADR que no se
puede saltar.

### Lo que hay hoy en `docs/diseno/`, medido y no supuesto

`_tokens.css` son 1.258 bytes: un `@import` de Google Fonts, una paleta oscura de
catorce tokens, dos familias tipográficas, un reset mínimo, y cuatro utilidades
—`.n` (cifras tabulares), `.eyebrow`, `.rule`, `.dotrule`—. `build.mjs` monta tres
artboards interactivos inyectando `_logic.js` en sus `.tpl.html`. `canvas.json`
coloca los seis en un lienzo. Es **un artefacto de diseño**, no código de
aplicación, y hay tres cosas suyas que no pueden entrar en producción tal cual:

- **`@import url('https://fonts.googleapis.com/css2?family=Geist…')`.** Dentro de
  un CSS de Next.js eso es la forma equivocada de cargar una fuente por tres
  motivos a la vez, y el tercero es el que decide: bloquea el renderizado en
  cascada, el empaquetador no lo optimiza, y **mete una petición de cada visitante
  a un tercero** —`fonts.googleapis.com` y `fonts.gstatic.com`—, que transporta su
  IP y su user-agent. En un proyecto que escribió **ADR-023 entero** sobre
  encargados del tratamiento y transferencias, meter un tercero en cada carga de
  página sin analizarlo sería incoherente, y es exactamente el tipo de cosa que no
  se ve.
- **Los nombres de los tokens están en galego** —`--marca`, `--directo`,
  `--alerta`, `--line`—, y `CLAUDE.md` §Lenguas dice que **los identificadores van
  en inglés**. Peor: **`--directo` es la etiqueta que `dominio.md` retiró** el
  2026-09-03, cuando Alberto Fojo firmó que `live` se dice **En xogo** «siempre y
  en una sola forma, en cualquier superficie del producto». Un token llamado
  `--directo` mete en el código la forma que el glosario descartó.
- **`--fg-prov`.** El nombre del token **es** la contradicción de §2, hecha
  vocabulario. Mientras exista con ese nombre, alguien lo usará para lo que su
  nombre dice.

Ninguna de las tres es un defecto del sistema: es que **un artefacto de diseño y
una aplicación no son la misma cosa**, y llevar el uno a la otra tiene un precio
que hay que escribir.

## Decisión

Se fijan **cinco decisiones** (§1..§5) más lo que este ADR no decide (§6),
citables por número (`ADR-026 §N`).

### §1. Alcance: vinculante para el producto; el sitio público de EPIC-003 queda fuera, y con dueño

**`docs/diseno/` es el sistema de diseño de este proyecto y es vinculante** para:

- el **panel del operador** (`src/admin/`, SPEC-017);
- la **página mínima por polling** y el snapshot (`src/api/` y su interfaz);
- **cualquier interfaz futura del producto**, sea de medición o no.

Es la petición del humano en sus términos —«cualquier diseño del front»— y no se
estrecha a las interfaces de medición como hizo ADR-025 §1.

**Y NO alcanza hoy al sitio público de EPIC-003** —`src/site/`, `src/app/(gl)/`,
`src/app/(es)/` y `src/app/globals.css`—. El motivo no es de gusto y no es mío:

- **SPEC-004 está `hecho` y verificada GREEN** dejando «identidad visual, logo y
  paleta» **explícitamente fuera de alcance a propósito**: la página de proyecto
  se apaña con tipografía porque su trabajo es respaldar la carta a la RFGF.
- **ADR-013, punto 3 de su *Fuera de alcance*, ya negó el permiso** con estas
  palabras: «Quien llegue aquí buscando permiso para tocar `globals.css` no lo
  tiene», y exigió **una spec nueva que motive por qué**. **Este ADR no es esa
  spec**, igual que no lo era ADR-013.

**Lo que sí hace este ADR es nombrarla, para que no se quede sin dueño:** la
migración del sitio público al sistema de diseño es **una spec propia**, que
tendrá que decir qué problema resuelve. **Disparador escrito: el go/no-go, o
antes el día que el sitio público y el marcador se sirvan bajo la misma
navegación** —que con **ADR-010** (un solo despliegue) es cuestión de tiempo—.

**La consecuencia hay que decirla de frente, porque es visible:** a partir de este
ADR, `marcador.gal` servirá **dos temas opuestos en el mismo dominio** —el
producto oscuro, `/proxecto` claro— hasta que esa spec exista. En el código
siguen sin compartir una línea, que es lo que la entrada 6 del inventario decía;
lo que cambia es que **ahora choca a la vista de una persona que navegue entre
los dos**. Eso pasa de conflicto latente a conflicto real, y §5 le pone dueño.

### §2. El énfasis del cualificador se invierte: ninguno de los dos se apaga

**Ésta es la mitad del ADR que resuelve el motivo por el que ADR-025 §4.3 dijo que
no**, y sin ella adoptar el sistema sería heredar su contradicción con código
encima.

El sistema pinta `provisional` con `--fg-prov` (#8E8C88) y `confirmado` con `--fg`
(#F5F1EA), es decir: **apaga lo provisional y destaca lo confirmado**. En este
proyecto, con una sola fuente automática de peso 0.7 (ADR-008 §1), **lo normal es
provisional y lo raro es confirmado**. Adoptar esa asignación sería que la
pantalla **apagase el estado dominante y destacase el raro** — que es
literalmente lo que **D-6** («fiabilidad trazable… un marcador publicado siempre
sabe de dónde viene») y **RN-12** existen para impedir. La pantalla estaría
mintiendo sobre la fiabilidad del producto.

**Decisión, y es un invariante, no una paleta:**

1. **Ningún cualificador se distingue apagándolo.** `provisional` y `confirmado`
   se sirven los dos **con el color de texto principal** (`--fg`), y lo que los
   distingue es **la etiqueta** —siempre presente— y, si hace falta, la forma. Es
   ADR-013 §2 aplicado sin escapatoria: «color *más* texto o forma», nunca color
   solo, y nunca la ausencia de color.
2. **`--fg-prov` deja de portar un cualificador y desaparece con ese nombre.** No
   se conserva «por si acaso»: un token llamado `--fg-prov` es una invitación
   escrita a reintroducir el error, y ADR-013 §6 ya dijo que «apagar un
   cualificador no puede significar hacerlo ilegible… **distinguir es distinguir
   dos cosas legibles, no borrar una**».
3. **Los otros dos cualificadores sí llevan color, y pueden**, porque son
   condiciones y no el caso normal: *sen sinal* (RN-07) y *pendente de confirmar*
   (RN-06 por timeout) usan los tokens de aviso del sistema — **con su etiqueta al
   lado, siempre** (ADR-013 §2), y **≥ 4.5:1** (ADR-013 §6). El acento de marca
   **no** es ninguno de ellos (ADR-013 §1).
4. **Nada de esto es una excepción al sistema: es la corrección de su entrada 1,
   hecha antes de escribir la primera línea de CSS.** Entra en la lista de
   divergencias declaradas de §3 con su motivo, que es este párrafo.

**Lo que este § NO decide:** cómo se ve exactamente la etiqueta, dónde va, y si
`confirmado` lleva además una marca. Eso es de la spec que dibuje cada pantalla.
Lo que aquí se fija es que **ninguno de los dos puede ser el apagado**.

### §3. Qué es «seguir el sistema»: los tokens pasan a ser código, con paridad comprobada y divergencias declaradas

«Seguir el sistema» sin mecanismo es una frase. Con mecanismo es esto:

**3.1 — La aplicación tiene UNA definición de tokens, y es código.**
Nace en `src/design/` —fichero nuevo, dueño único—, **copiada valor a valor** de
`docs/diseno/_tokens.css`. Ninguna interfaz declara un color, una familia
tipográfica, un radio o una escala por su cuenta: los toma de ahí. Es la misma
disciplina que `RN01_WEIGHTS` (ADR-021 §8.4) impuso a los pesos de RN-01: **un
solo domicilio, y no se copian**.

**3.2 — `docs/diseno/` es la autoridad del sistema; `src/design/` es lo que se
sirve. Y la distancia entre los dos es comprobable.**
Un test afirma, token a token, que **el valor del código es el valor del
sistema**, contra una **tabla de correspondencia declarada** (nombre en código →
nombre en el sistema) y con una **lista cerrada de divergencias, cada una con su
motivo al lado** — la forma de `MEASUREMENT_WINDOWS` (ADR-019 §3),
`ALLOWED_PACKAGES` (ADR-016 §3.2) y la lista de pares independientes
(ADR-021 §7). Un token del sistema que no esté ni copiado ni declarado como
divergencia es **rojo**.

Eso da exactamente lo que el humano pidió —asegurar que el front sigue las
directrices— **sin congelar el sistema**: divergir es legal, y **cuesta escribir
el motivo**.

**3.3 — La lista de divergencias nace con tres entradas, y las tres están
motivadas en este ADR.**

| Divergencia | Motivo |
|---|---|
| **`--fg-prov` no existe en el código** | §2: ningún cualificador se distingue apagándolo. El nombre invita al error que la entrada 1 del inventario advierte. |
| **Las fuentes no se piden a un tercero** | §3.4. El `@import` de Google Fonts no llega al código. |
| **Los nombres de token se anglican** | `CLAUDE.md` §Lenguas: los identificadores van en inglés. Y **`--directo` perpetuaría en el código la etiqueta que `dominio.md` retiró** el 2026-09-03, cuando `live` quedó fijado como *En xogo* «en una sola forma y en cualquier superficie del producto». La tabla de correspondencia de §3.2 hace la traducción explícita y auditable. |

**3.4 — Las fuentes se autoalojan. `@import` de un tercero queda prohibido.**
**Ninguna interfaz de este proyecto pide una fuente a un tercero en tiempo de
carga.** Tres motivos y el tercero decide: bloquea el renderizado, el empaquetador
de Next no lo optimiza, y **mete una petición de cada visitante a
`fonts.googleapis.com` y `fonts.gstatic.com` con su IP y su user-agent**. Geist es
de Vercel y se distribuye autoalojable; **cuál es el mecanismo exacto es de la
spec** —el paquete de la fuente con `next/font/local`, o ficheros propios—, y la
spec que lo elija declara la dependencia nueva. Lo que este ADR fija es el
invariante, no el paquete.

**3.5 — Las interfaces que este ADR gobierna son oscuras, y no ofrecen tema
claro.**
El sistema no declara ninguna variante clara y **este ADR no le inventa una**:
sería diseñar por nuestra cuenta lo que la decisión del humano dice que hay que
seguir. **ADR-013, punto 4 de su *Fuera de alcance*, dejó abierto si el producto
es dark-only; este ADR lo cierra para las interfaces que gobierna y NO para el
sitio público**, que sigue claro por defecto (§1). La consecuencia visible está en
§1 y su dueño en §5.

**3.6 — `docs/diseno/` NO se edita.**
Sigue siendo artefacto de **EPIC-004**, que está congelada, y su criterio de éxito
2 sigue exigiendo que no haya trabajo de interfaz **atribuible a esa épica** antes
del go/no-go. El código del panel es atribuible a **EPIC-002**, así que ese
criterio se cumple literalmente. **Lo que se mueve, se mueve en la lista de
divergencias de §3.2, no en el artefacto.** El día que EPIC-004 se descongele, esa
lista es la agenda de la reconciliación.

### §4. Qué de ADR-025 cae y qué sigue en pie

ADR-025 está `aprobada` y es **inmutable**: no se edita. Esto es lo que sobrevive
y lo que no, con la precisión que hace falta para que nadie tenga que adivinar.

| ADR-025 | Estado | Detalle |
|---|---|---|
| **§1** — alcance y regla de suelo | **Parcialmente superseded** | **Cae** su marco temporal («hasta que EPIC-004 se descongele», «cuando se descongele, su sistema manda»): el sistema **ya** manda. **Queda, y pasa a ser la regla operativa**: «§2 y §3 son suelo, no estilo, y un sistema de diseño puede **subirlos pero no bajarlos**». |
| **§2** — foco visible y teclado | **INTACTO** | Y ahora es **más** necesario, no menos: el sistema de diseño **no trae estados de foco** —es la entrada 3 del inventario— así que **no supersede a §2 porque no cubre lo que §2 cubre**. El anillo de foco del producto sale de aquí, no del sistema. |
| **§3** — 44 × 44 px, ≥ 16 px en campos, sin scroll horizontal a 360 px | **INTACTO** | El sistema no declara suelo de toque. Mismo razonamiento que §2. |
| **§4.1** — `src/app/globals.css` no se edita | **INTACTO** | No dependía del sistema de diseño: depende de que SPEC-004 esté `hecho` con la paleta fuera de alcance y de ADR-013 punto 3. Sigue palabra por palabra, y **§1 de este ADR lo repite**. |
| **§4.2** — hoja propia, y no deriva de `globals.css` **ni de `docs/diseno/`** | **Parcialmente superseded** | **Queda**: la interfaz trae su propia hoja, alcanzable solo desde sus rutas, y **no deriva de `globals.css`**. **Cae**: la prohibición de derivar de `docs/diseno/`, que es justo lo que §3 ahora obliga a hacer. |
| **§4.3** — «Ni un valor de `docs/diseno/` se copia» | **SUPERSEDED ENTERO** | Ahora se copian todos. **Y cae porque su premisa se atendió, no porque fuera falsa:** su motivo era heredar la contradicción de la entrada 1, y **§2 la resuelve antes de copiar nada**. Copiar sin §2 seguiría siendo el error que §4.3 describía. |
| **§5** — lo que ve un test frente a lo que solo ve un navegador | **INTACTO, y se ensancha** | La mitad estática **crece** con la paridad de tokens de §3.2. La mitad manual —recorrido con teclado, foco visible de verdad, 360 px de verdad— sigue siendo de una persona, con su disparador de automatización sin cambios. |

**Nada de ADR-024 se toca.**

### §5. Qué le pasa a EPIC-004: no se descongela, se le cambia el alcance

Este ADR hace dos de las cosas que el alcance de EPIC-004 reservaba para «cuando
se descongele» —**el panel del operador** y **los tokens como código**—, así que
dejar la épica diciendo una cosa y el ADR otra sería **exactamente la patología
que hizo nacer a EPIC-004**: trabajo real rutado a un sitio que no lo describe.

**EPIC-004 NO se descongela.** Lo que cambia es su alcance:

- **Sale de EPIC-004 y pasa a EPIC-002:** el **panel del operador** (de hecho ya
  salió, con SPEC-017) y los **tokens como código** (§3).
- **Se queda en EPIC-004, congelado:** la **custodia** del sistema y de sus
  fuentes, la **interfaz definitiva del marcador**, y la **producción de activos
  de marca** —que sigue bloqueada por la comprobación en OEPM, que este ADR **no
  toca**—.

**Y el inventario, entrada por entrada:**

| # | Qué le pasa |
|---|---|
| **1** — `provisional` es el normal | **CERRADA por §2**, y para **todas** las interfaces, no solo el panel. Era «la que más caro sale ignorar» y es la que este ADR estaba obligado a contestar antes de adoptar nada. |
| **2** — falta la tabla de clasificación | **INTACTA.** Este ADR no la toca; su disparador sigue siendo el deshielo, o antes si una spec necesita el componente. |
| **3** — faltan foco y teclado | **SIGUE ABIERTA EN EL SISTEMA**, y **cubierta para el producto por ADR-025 §2**, que ahora es permanente y no «hasta el deshielo» (§4). Adoptar el sistema **no** la cierra: el sistema no los tiene. Cerrarla es trabajo de EPIC-004 sobre el artefacto. |
| **4** — faltan estados de carga y de dato viejo | **INTACTA**, y su disparador —«la primera spec de `src/api/`»— **está a punto de dispararse**: es la spec del snapshot, la siguiente. Queda nombrado aquí para que no la pille por sorpresa. |
| **5** — el panel no tiene ningún diseño | **CERRADA en cuanto a diseño**: ahora lo tiene, es éste. Lo que queda es **aplicarlo**, que es CA-10 de SPEC-017. |
| **6** — ¿tema claro? | **NO se cierra, y empeora de forma controlada** (§1, §3.5): el choque pasa de latente a visible para quien navegue entre el producto y `/proxecto`. **Dueño y disparador nuevos: la spec de migración del sitio público** (§1). |

**Quién escribe esto en la épica: `sdd-producto`, bajo la firma del gate.** Las
épicas y el roadmap son suyos, no de `sdd-arquitecto`. **Follow-up con dueño**, y
está en las consecuencias para que no se pierda: sin esa edición, `_epica.md` de
EPIC-004 y este ADR se contradicen desde el día uno.

### §6. Lo que este ADR no decide

- **No repinta el sitio público.** §1: es una spec, con su disparador.
- **No aprueba ninguna pantalla.** Fija de dónde salen los valores y qué no puede
  apagarse; el dibujo es de cada spec.
- **No elige icona ni produce ningún activo de marca.** Sigue bloqueado por la
  comprobación en OEPM (ADR-013 §7, EPIC-004).
- **No toca ADR-013, que manda por encima de este ADR.** §1 (el acento de marca
  nunca es color de estado), §2 (nada solo por color), §3 (dígitos tabulares),
  §4 (sin escudos), §5 (ninguna paleta de club) y §6 (≥ 4.5:1 para cualquier color
  que porte un dato) **siguen vinculando, y si el sistema los contradijera en algo,
  gana ADR-013**.
- **No decide la tabla de clasificación** (entrada 2) ni **los estados de carga y
  de dato viejo** (entrada 4).
- **No elige el paquete de la fuente** (§3.4), ni la escala tipográfica concreta:
  eso sale del sistema y lo aterriza la spec.
- **No descongela EPIC-004** (§5).

## Consecuencias

### Positivas

- **El producto tendrá una sola lengua visual, y estará escrita.** Hasta hoy cada
  spec de interfaz habría inventado su paleta y su escala; ahora hay un sitio del
  que salen, y un test que lo comprueba.
- **La entrada 1 del inventario se cierra, y se cierra por el lado bueno.** Era la
  que EPIC-004 llamaba «la que más caro sale ignorar», estaba viva desde el
  2026-09-01, y llevaba un disparador que se había adelantado dos veces. **§2 la
  contesta antes de que se escriba una línea de CSS**, que es exactamente cuando
  había que contestarla.
- **«Seguir el sistema» tiene mecanismo, no solo intención.** La paridad de §3.2
  es la diferencia entre una directriz y una frase, y la lista de divergencias
  hace que apartarse **cueste escribir por qué** en vez de costar nada.
- **Se atrapan tres cosas que habrían entrado en producción sin que nadie las
  viera**: la petición a Google Fonts en cada carga de página, un token llamado
  `--directo` que perpetúa la etiqueta que el glosario retiró, y `--fg-prov`
  apagando el estado dominante.
- **ADR-025 sobrevive casi entero**, y la parte que sobrevive es la que más falta
  hace: el sistema **no tiene** estados de foco ni suelo de toque, así que §2 y §3
  siguen siendo lo único que los cubre.
- **EPIC-004 deja de decir una cosa mientras el código hace otra**, que era su
  propio motivo de existir.

### Negativas / follow-ups

- **El sistema sigue sin haber sobrevivido a un sábado.** Es la misma pega que
  ADR-025 y ADR-013 se pusieron a sí mismos, y el criterio de éxito 5 de EPIC-004
  la nombra: un sistema se prueba con el producto delante, no con un canvas. Se
  adopta antes de esa prueba porque el humano lo ha decidido con el hecho delante.
- **Dos temas opuestos en el mismo dominio**, y con **ADR-010** (un solo
  despliegue) eso lo va a ver una persona. **Dueño: la spec de migración del sitio
  público**; **disparador: el go/no-go, o antes si los dos comparten navegación.**
- **La lista de divergencias es deuda con forma.** Nace con tres entradas
  motivadas; si crece sin reconciliarse, `docs/diseno/` deja de describir lo que se
  sirve y la paridad se vuelve ceremonia. **Guardia escrita: el día que alguien no
  pueda decir qué se sirve leyendo `docs/diseno/`, el artefacto está obsoleto y
  hay que reconciliarlo, no ampliar la lista.** **Disparador de la reconciliación:
  el deshielo de EPIC-004.**
- **`docs/diseno/` no se puede corregir mientras EPIC-004 esté congelada**, así que
  las tres divergencias de §3.3 —y las que vengan— viven en el código y no en el
  artefacto. Es el precio de respetar el congelado, y es menor que el de
  descongelar por conveniencia.
- **CA-10 de SPEC-017 se reescribe y su implementación se retrasa.** La spec está
  `aprobada` y **en implementación**; CA-10 y todo el CSS están congelados
  mientras tanto. Se puede reescribir porque **la spec no está cerrada** —ADR-015
  gobierna las cerradas— y la reescritura la firma el mismo gate que este ADR.
- **El sistema no trae componentes de formulario ni estados de foco**, y el panel
  del operador es todo formularios. Lo que se hereda es el **lenguaje** —paleta,
  tipografía, escala, densidad—; los controles hay que **inventarlos dentro de ese
  lenguaje**, y eso no es aplicar un sistema, es extenderlo. **Se declara para que
  nadie lea «seguir el sistema» como si el panel viniera dibujado.**
- **Una dependencia nueva**, la de la fuente autoalojada (§3.4). Es pequeña y es el
  precio de no pedirle nada a un tercero en cada carga.
- **`sdd-producto` tiene que editar `_epica.md` de EPIC-004 y `docs/roadmap.md`**
  (§5). **Si esa edición no ocurre, este ADR y la épica se contradicen desde el
  día uno**, que es la patología que EPIC-004 nació para evitar.

## Alternativas consideradas

- **Mantener ADR-025 §4 y no adoptar el sistema.** **Rechazada por decisión del
  humano**, tomada con los dos motivos de ADR-025 §4.3 delante. Y hay que decir
  que el primero de esos motivos **se desactiva resolviéndolo**: §4.3 temía
  heredar la contradicción de la entrada 1, y §2 la resuelve **antes** de copiar
  un solo valor. Sin §2, §4.3 seguiría teniendo razón.
- **Adoptar el sistema tal cual, `--fg-prov` incluido.** Rechazada, y es el rechazo
  central: sería heredar con código encima justo lo que la entrada 1 advierte, y
  la pantalla **mentiría sobre la fiabilidad del dato**, contra D-6 y RN-12. «Hay
  que seguir el sistema» no puede leerse como «hay que reproducir su error
  conocido»; seguirlo es adoptar su lenguaje, no su bug.
- **Invertir el énfasis apagando `confirmado`.** Rechazada: repite la falta con el
  signo cambiado. ADR-013 §6 lo dice —«distinguir es distinguir dos cosas
  legibles, no borrar una»— y además el reparto entre normal y raro **puede
  cambiar** el día que vuelva `futgal.es`; un diseño que apaga al minoritario se
  rompe cuando cambia la mayoría. Por eso §2 fija que **ninguno** se apaga.
- **Importar `docs/diseno/_tokens.css` desde `src/` y hacerlo la fuente de verdad
  en ejecución.** Rechazada por dos motivos independientes: ata la aplicación a un
  artefacto **congelado de otra épica** —cambiar un color exigiría descongelar
  EPIC-004—, y **arrastraría el `@import` de Google Fonts a producción**, que es lo
  que §3.4 prohíbe.
- **Copiar los tokens sin test de paridad.** Rechazada: es la opción que parece
  igual y no lo es. «Seguir el sistema» sin mecanismo dura hasta el primer valor
  que alguien ajusta a ojo, y la divergencia sería **invisible** — que es
  exactamente el modo de fallo que SPEC-016 documentó para los gates («un gate que
  hay que acordarse de correr no es un gate»).
- **Copiar los tokens y prohibir toda divergencia.** Rechazada: **su primer día ya
  se incumpliría tres veces** (§3.3), y una regla que nace incumplida no es una
  regla. Lo que sirve es que divergir sea legal y **cueste escribir el motivo**.
- **Conservar los nombres galegos de los tokens.** Rechazada por `CLAUDE.md`
  §Lenguas y por algo más concreto: **`--directo` mete en el código la etiqueta que
  `dominio.md` retiró el 2026-09-03**, cuando el gate fijó que `live` es *En xogo*
  «en una sola forma y en cualquier superficie del producto». Un token es un
  identificador y los identificadores van en inglés; la tabla de correspondencia de
  §3.2 conserva la trazabilidad sin conservar el error.
- **Repintar el sitio público aquí, «ya que estamos».** Rechazada, y es la
  tentación más probable ahora que el sistema es vinculante: **SPEC-004 está
  `hecho` y GREEN** con la paleta fuera de alcance a propósito, y **ADR-013 punto 3
  exige una spec que motive por qué**. Un ADR no reabre una spec cerrada; una spec
  nueva sí, si alguien puede decir qué problema resuelve. §1 la nombra en vez de
  hacerla.
- **Inventar una variante clara del sistema** para que el producto y el sitio
  dejasen de chocar. Rechazada: sería diseñar por nuestra cuenta justo lo que la
  decisión del humano manda seguir, y el sistema es oscuro-only a propósito. El
  choque se resuelve migrando el sitio, no bifurcando el sistema.
- **Descongelar EPIC-004 entera.** Rechazada: su criterio de corte sigue en pie
  para la interfaz definitiva y para los activos de marca —que además siguen
  bloqueados por OEPM—. Lo que hacía falta era **un cambio de alcance**, que es más
  barato y más honesto que un deshielo por conveniencia.
- **Superseder ADR-025 entero.** Rechazada: **§2, §3, §4.1 y §5 son correctos y
  siguen haciendo falta**, y el sistema de diseño **no cubre** lo que §2 y §3
  cubren. Superseder entero habría dejado al producto sin foco visible y sin suelo
  de toque el mismo día que ganó una paleta.
