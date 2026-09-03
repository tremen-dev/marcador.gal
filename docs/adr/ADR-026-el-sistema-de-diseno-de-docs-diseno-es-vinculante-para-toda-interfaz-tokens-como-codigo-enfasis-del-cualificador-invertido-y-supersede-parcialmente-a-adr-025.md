---
id: ADR-026
tipo: adr
estado: aprobada
historial:
  - {estado: borrador, fecha: 2026-09-03, por: sdd-arquitecto}
  - {estado: aprobada, fecha: 2026-09-03, por: Alberto Fojo (por delegación, firmado por Claude Opus 5)}
aprobada-por: Alberto Fojo (por delegación, firmado por Claude Opus 5)
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
  **§5**. Es la misma vía por la que **ADR-008** reabrió a **ADR-002** y
  **ADR-009** a **ADR-005**.
- Specs relacionadas: **SPEC-017** (`aprobada`, **en implementación**; su **CA-10
  se reescribe** por este ADR, y puede hacerse porque la spec **no está
  cerrada** — ADR-015 gobierna las cerradas); la spec del **snapshot y la página
  mínima por polling**, que viene después y nace ya bajo esta decisión;
  **SPEC-004** (`hecho`, GREEN), que este ADR **no toca** — ver §1.
- Relacionado: **ADR-013** (semántica visual, que **manda por encima de este ADR,
  no se toca, y en seis puntos concretos gana al sistema** — §4), **ADR-025** (el
  suelo, superseded parcialmente en §5), **ADR-024** (el panel), **ADR-010** (un
  solo despliegue para el sitio y el producto, que es lo que hace visible la
  consecuencia de §1), **ADR-001** (el stack), **ADR-016** (la forma de una lista
  cerrada con motivo por entrada, y la obligación de declarar lo que un mecanismo
  no alcanza), **EPIC-004** (`aprobada` y **congelada**; su inventario y su
  alcance cambian — §6), **D-1, D-2, D-6, D-8**, **RN-02, RN-03, RN-06, RN-12**.

## Contexto

### La decisión, y de dónde viene

El 2026-09-01 se produjo un sistema de diseño **fuera del pipeline** —seis
artboards, paleta con contrastes medidos, tipografía, dos vistas y dos densidades
de fila— y Alberto Fojo lo dio por bueno como v1.0. **EPIC-004** nació ese mismo
día para darle **custodia**, congelada a propósito, y **ADR-013** extrajo de él lo
que pasaba el criterio de corte del roadmap: seis reglas semánticas que se derivan
de decisiones locked y que ninguna cifra mueve.

El 2026-09-03, al escribir el panel del operador, **ADR-025 §4** decidió lo
contrario de lo que hoy se decide: que una interfaz de medición **no comparte una
línea** ni con `src/app/globals.css` ni con `docs/diseno/`. Tenía dos motivos, y
los dos siguen siendo ciertos como hechos:

1. **El sistema está congelado con una contradicción dentro.** Pinta
   `provisional` en gris —`--fg-prov:#8E8C88`— y como excepción. En este proyecto
   es al revés: con una sola fuente automática de peso 0.7 (ADR-008 §1), **nada
   llega a *confirmado* sin una persona**, así que **lo normal es `provisional`**.
   Es la **entrada 1** del inventario de EPIC-004, la que esa épica llama «**la
   que más caro sale ignorar**».
2. **Oscuro-only contra claro por defecto.** `docs/diseno/` sirve `--bg:#111110`
   sin ninguna variante clara; `src/app/globals.css` sirve **claro por defecto**
   (`--paper:#fbfbf9`) con variante oscura bajo `prefers-color-scheme`. Es la
   **entrada 6** del inventario, y su frase exacta es que «**hoy no chocan porque
   no comparten una línea de CSS**».

**El humano ha decidido seguir el sistema con esos dos motivos delante.** Este ADR
no relitiga esa decisión: la ejecuta. Pero **el primer motivo no desaparece por
decreto**, y por eso este documento no puede limitarse a decir «adóptese»: si el
sistema se adopta tal cual, la pantalla **apaga el estado dominante y destaca el
raro**, que es exactamente lo que **D-6** y **RN-12** existen para impedir.
Resolver eso es **§2**, y es la mitad de este ADR que no se puede saltar.

### Qué hay realmente en `docs/diseno/`, inventariado y medido el 2026-09-03

Antes de declarar vinculante un artefacto hay que haberlo leído entero. Se leyó,
y hay cinco hechos que cambian la forma de este ADR. **Ninguno es un defecto del
diseño: son la distancia normal entre un artefacto de diseño y una aplicación.**
Escribirlos es lo que impide que «seguir el sistema» signifique cosas distintas
para cada persona que lo lea.

**1. `_tokens.css` no lo usa ningún artboard.** Los seis `.dc.html` **duplican a
mano su propio bloque `<style>`** y en el marcado escriben **hexadecimales
literales**, no `var(--…)`. `_tokens.css` es hoy un **documento de referencia**,
no la definición ejecutable del sistema. Lo vinculante *de facto* son unos
doscientos strings de estilo en línea, repetidos. Esto no invalida el fichero
—coincide con la tabla de contrastes de ADR-013, que se calculó sobre él— pero sí
decide **cómo** se extrae (§3).

**2. El sistema tiene trece colores y dos familias, y nada más.** **Cero tokens de
espaciado, radio, sombra, tamaño, peso o duración.** Las escalas existen, pero
**en prosa**, dentro de `Main.dc.html`: «paso de espacio 4px · 4 8 12 16 24 32 48»
y «radios 8 · 10 · 14 · 999». Y **el propio sistema las incumple**: entre los
huecos más usados están `3, 5, 6, 7, 10, 14, 28`, y entre los radios más usados,
`7px`, `12px` y `6px`. Además hay **tres colores en uso que no tienen token**
—`#131211`, `#1E1A16` (tinte de fila `live`) y `#1D1A16` (separador de fila)—.

**3. El sistema no tiene foco, ni teclado, ni formularios.** Cero `:focus`, cero
`:focus-visible`, cero `outline`, cero `tabindex`, cero `role`, cero `aria-*` en
los diez ficheros. Todo lo interactivo es un `<div>` o un `<span>` con `onClick`.
Y **cero `<input>`, `<textarea>`, `<select>`, `<button>`, `<form>` y `<label>`**:
el único «buscador» es un `<div>` con un `<span>` de marcador de posición. Es la
**entrada 3** del inventario, y el sistema **no aporta ninguna respuesta**.

**4. Tres de los seis artboards no se pueden abrir.** `Escritorio`, `Movil` y
`Global` generan **todo** su estilo de fila como cadenas en JavaScript y dependen
de un runtime que **no está en el repositorio** —`./support.js`, la clase base
`DCLogic`, los elementos `<sc-for>` y `<sc-if>`—. Sin él no se pinta una sola
fila. La autoridad de este ADR es, por tanto, **el artefacto tal como se lee**, no
tal como se ejecuta.

**5. La contradicción de la entrada 1 está cuantificada.** Los datos de muestra de
`_logic.js` son **60 partidos: 55 `confirmado`, 4 `provisional`, 2 `pendente`**.
El sistema está dibujado sobre un mundo donde lo confirmado es el 92 %. En el
nuestro, hoy, **es el 0 % sin una persona**. Congelar esa proporción como diseño
vinculante es congelar una pantalla que miente sobre la fiabilidad del dato.

### Y tres cosas del artefacto que no pueden entrar en producción tal cual

- **`@import url('https://fonts.googleapis.com/css2?family=Geist…')`**, presente
  como **primera línea de los diez ficheros**. Dentro de un CSS de Next.js es la
  forma equivocada de cargar una fuente por tres motivos a la vez, y el tercero
  decide: bloquea el renderizado en cascada, el empaquetador no lo optimiza, y
  **mete una petición de cada visitante a un tercero** —`fonts.googleapis.com` y
  `fonts.gstatic.com`—, que transporta su IP y su user-agent. En un proyecto que
  escribió **ADR-023 entero** sobre encargados del tratamiento y transferencias,
  meter un tercero en cada carga de página sin analizarlo sería incoherente, y es
  exactamente el tipo de cosa que no se ve. (De paso: pide **siete** pesos de
  Geist y usa cinco.)
- **Los nombres de los tokens están en galego** —`--marca`, `--directo`,
  `--alerta`, `--line`—, y `CLAUDE.md` §Lenguas dice que **los identificadores van
  en inglés**. Peor: **`--directo` es la etiqueta que `dominio.md` retiró** el
  2026-09-03, cuando Alberto Fojo firmó que `live` se dice **En xogo** «siempre y
  en una sola forma, en cualquier superficie del producto».
- **`--fg-prov`.** El nombre del token **es** la contradicción de §2, hecha
  vocabulario. Mientras exista con ese nombre, alguien lo usará para lo que su
  nombre dice.

## Decisión

Se fijan **seis decisiones** (§1..§6) más lo que este ADR no decide (§7), citables
por número (`ADR-026 §N`).

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
tendrá que decir qué problema resuelve. **Disparador escrito: el go/no-go, o antes
el día que el sitio público y el marcador se sirvan bajo la misma navegación** —que
con **ADR-010** (un solo despliegue) es cuestión de tiempo—.

**La consecuencia hay que decirla de frente, porque es visible:** a partir de este
ADR, `marcador.gal` servirá **dos temas opuestos en el mismo dominio** —el
producto oscuro, `/proxecto` claro— hasta que esa spec exista. En el código siguen
sin compartir una línea, que es lo que la entrada 6 decía; lo que cambia es que
**ahora choca a la vista de una persona que navegue entre los dos**. Pasa de
conflicto latente a conflicto real, y §6 le pone dueño.

### §2. El énfasis del cualificador se invierte: ninguno de los dos se apaga

**Ésta es la mitad del ADR que resuelve el motivo por el que ADR-025 §4.3 dijo que
no**, y sin ella adoptar el sistema sería heredar su contradicción con código
encima.

El sistema pinta `provisional` con `--fg-prov` (#8E8C88) y `confirmado` con `--fg`
(#F5F1EA) **sin etiqueta** —su propia glosa lo dice: «marcador a peso completo,
sin etiqueta: **el normal no se anuncia**»—. Es decir: **apaga lo provisional y
trata lo confirmado como el caso por defecto**. Y sus datos de muestra dicen sobre
qué mundo está dibujado: **55 de 60 partidos confirmados**.

En este proyecto, con una sola fuente automática de peso 0.7 (ADR-008 §1), **lo
normal es provisional y lo raro es confirmado**. Adoptar esa asignación sería que
la pantalla **apagase el estado dominante y tratase el raro como el caso por
defecto** — literalmente lo que **D-6** («un marcador publicado siempre sabe de
dónde viene») y **RN-12** existen para impedir. La pantalla estaría mintiendo
sobre la fiabilidad del producto.

**Decisión, y es un invariante, no una paleta:**

1. **Ningún cualificador se distingue apagándolo.** `provisional` y `confirmado`
   se sirven los dos **con el color de texto principal** (`--fg`), y lo que los
   distingue es **la etiqueta** —**siempre presente en los dos**, también en
   `confirmado`— y, si hace falta, la forma. Es ADR-013 §2 aplicado sin
   escapatoria: «color *más* texto o forma», nunca color solo, y nunca la
   ausencia de color.
2. **`--fg-prov` deja de portar un cualificador y desaparece con ese nombre.** No
   se conserva «por si acaso»: un token llamado `--fg-prov` es una invitación
   escrita a reintroducir el error, y ADR-013 §6 ya dijo que «apagar un
   cualificador no puede significar hacerlo ilegible… **distinguir es distinguir
   dos cosas legibles, no borrar una**».
3. **`confirmado` no se pinta con el acento de marca.** El sistema lo hace
   —`#56DB8F` en la traza y en la píldora de detalle— y a la vez usa ese verde
   para la marca, la navegación activa, los enlaces y las cabeceras. La letra de
   ADR-013 §1 blinda ember↔`live` y no menciona los cualificadores, así que esto
   **no es una infracción**; pero su regla general —«**ningún color que signifique
   un estado del dominio puede ser a la vez el color de la marca**»— apunta
   exactamente aquí, y un verde que significa seis cosas no significa ninguna.
   **Se decide explícitamente para que nadie tenga que interpretarlo.**
4. **Los otros dos cualificadores sí llevan color, y pueden**, porque son
   condiciones y no el caso normal: *sen sinal* (RN-07) y *pendente de confirmar*
   (RN-06 por timeout) usan los tokens de aviso del sistema — **con su etiqueta de
   texto al lado, siempre** (§4.2), y **≥ 4.5:1** (ADR-013 §6).
5. **Nada de esto es una excepción al sistema: es la corrección de su entrada 1,
   hecha antes de escribir la primera línea de CSS.** Entra en la lista de
   divergencias declaradas de §3 con su motivo, que es este párrafo.

**Lo que este § NO decide:** cómo se ve exactamente la etiqueta, dónde va, y si
`confirmado` lleva además una marca. Eso es de la spec que dibuje cada pantalla.
Aquí se fija que **ninguno de los dos puede ser el apagado ni el mudo**.

### §3. Qué es «seguir el sistema»: los tokens pasan a ser código, con paridad comprobada y divergencias declaradas

«Seguir el sistema» sin mecanismo es una frase. Con mecanismo es esto.

**3.1 — La aplicación tiene UNA definición de tokens, y es código.**
Nace en `src/design/` —fichero nuevo, dueño único—. Ninguna interfaz declara un
color, una familia tipográfica, un radio o un valor de escala por su cuenta: los
toma de ahí. Es la misma disciplina que `RN01_WEIGHTS` (ADR-021 §8.4) impuso a los
pesos de RN-01: **un solo domicilio, y no se copian**.

**3.2 — La extracción es un acto de lectura, no una copia mecánica, y hay que
decir por qué.**
`_tokens.css` **no lo usa ningún artboard** y **no cubre espaciado, radios ni
escala tipográfica** (Contexto, hechos 1 y 2). Así que `src/design/` se construye
de **tres** fuentes, en este orden de autoridad:

1. **`docs/diseno/_tokens.css`** — los trece colores y las dos familias. Es la
   referencia declarada del sistema y **es la misma tabla sobre la que ADR-013
   calculó sus contrastes**, así que adoptarla es coherente con lo ya aprobado.
2. **Las escalas declaradas en prosa en `Main.dc.html`** — paso de espacio de 4 px
   (4·8·12·16·24·32·48), radios 8·10·14·999, y los cinco roles tipográficos
   nombrados (`display`, `score`, `equipo`, `estado`, `eyebrow`). **Se adopta lo
   declarado, no lo practicado:** el propio sistema se salta su escala —`3, 5, 6,
   7, 10, 14, 28` de hueco; radios `7`, `12`, `6`— y **el producto no hereda el
   incumplimiento de una regla que el sistema escribió para sí mismo**.
3. **Los tres colores en uso sin token** —`#131211`, `#1E1A16`, `#1D1A16`—, que se
   nombran al entrar en el código, porque un valor sin nombre se copia y un token
   se reutiliza.

**3.3 — La paridad se comprueba donde hay algo con qué comparar, y se declara
dónde no.**
Un test afirma, token a token, que **el valor del código es el valor de
`_tokens.css`**, contra una **tabla de correspondencia declarada** (nombre en
código → nombre en el sistema) y una **lista cerrada de divergencias, cada una con
su motivo al lado** — la forma de `MEASUREMENT_WINDOWS` (ADR-019 §3),
`ALLOWED_PACKAGES` (ADR-016 §3.2) y la lista de pares independientes
(ADR-021 §7). **Un token de `_tokens.css` que no esté ni copiado ni declarado como
divergencia es rojo.**

**Y lo que el mecanismo NO alcanza, declarado aquí como obliga ADR-016 §6:** la
paridad **solo cubre color y familia tipográfica**, que es lo único que
`_tokens.css` declara. **El espaciado, los radios, la escala tipográfica y la
densidad de fila no se pueden comprobar contra nada**, porque en el sistema viven
en prosa y en hexadecimales en línea que el propio sistema no respeta. Ahí la
adherencia la sostiene **la revisión humana**, no un test, y quien lea este ADR
tiene que saberlo. **Cerrar ese hueco es trabajo de EPIC-004 sobre el artefacto**
—convertir sus escalas en tokens— y no de una spec de EPIC-002.

**3.4 — La lista de divergencias nace con tres entradas, y las tres están
motivadas en este ADR.**

| Divergencia | Motivo |
|---|---|
| **`--fg-prov` no existe en el código** | §2: ningún cualificador se distingue apagándolo. El nombre invita al error que la entrada 1 del inventario advierte. |
| **Las fuentes no se piden a un tercero** | §3.5. El `@import` de Google Fonts no llega al código. |
| **Los nombres de token se anglican** | `CLAUDE.md` §Lenguas: los identificadores van en inglés. Y **`--directo` perpetuaría en el código la etiqueta que `dominio.md` retiró** el 2026-09-03, cuando `live` quedó fijado como *En xogo* «en una sola forma y en cualquier superficie del producto». La tabla de correspondencia de §3.3 hace la traducción explícita y auditable. |

**3.5 — Las fuentes se autoalojan. `@import` de un tercero queda prohibido.**
**Ninguna interfaz de este proyecto pide una fuente a un tercero en tiempo de
carga.** Tres motivos y el tercero decide: bloquea el renderizado, el empaquetador
de Next no lo optimiza, y **mete una petición de cada visitante a
`fonts.googleapis.com` y `fonts.gstatic.com` con su IP y su user-agent**. Geist es
de Vercel y se distribuye autoalojable; **cuál es el mecanismo exacto es de la
spec** —el paquete de la fuente con `next/font/local`, o ficheros propios—, y la
spec que lo elija declara la dependencia nueva y **carga solo los pesos que se
usan**. Lo que este ADR fija es el invariante, no el paquete.

**3.6 — Las interfaces que este ADR gobierna son oscuras, y no ofrecen tema
claro.**
El sistema no declara ninguna variante clara —cero `@media`, cero
`prefers-color-scheme`, y sus colores son hexadecimales crudos sin pares
semánticos, así que no hay ruta de inversión— y **este ADR no le inventa una**:
sería diseñar por nuestra cuenta lo que la decisión del humano dice que hay que
seguir. **ADR-013, punto 4 de su *Fuera de alcance*, dejó abierto si el producto
es dark-only; este ADR lo cierra para las interfaces que gobierna y NO para el
sitio público**, que sigue claro por defecto (§1). Consecuencia visible en §1,
dueño en §6.

**3.7 — `docs/diseno/` NO se edita.**
Sigue siendo artefacto de **EPIC-004**, que está congelada, y su criterio de éxito
2 sigue exigiendo que no haya trabajo de interfaz **atribuible a esa épica** antes
del go/no-go. El código del panel es atribuible a **EPIC-002**, así que ese
criterio se cumple literalmente. **Lo que se mueve, se mueve en la lista de
divergencias de §3.4, no en el artefacto.** El día que EPIC-004 se descongele, esa
lista es la agenda de la reconciliación.

### §4. Lo que el sistema NO cumple, y por tanto no se hereda

Adoptar un sistema no es adoptar sus incumplimientos. **ADR-013 y ADR-025 mandan
por encima de este ADR**, y hay seis puntos concretos, medidos el 2026-09-03, en
los que el sistema se aparta de ellos. En los seis **gana la regla, no el
artefacto**, y se escriben aquí para que nadie los descubra copiando.

**4.1 — `provisional` codificado solo por color en dos de los tres artboards
vivos.** La insignia `prov` solo existe en la fila ancha de escritorio; en
**Móvil** y en **Global** `provisional` es únicamente `#8E8C88` frente a
`#F5F1EA`. **ADR-013 §2 lo prohíbe con estas palabras: «una spec de interfaz cuyo
único distintivo entre confirmado y provisional sea el color incumple este ADR,
aunque los contrastes pasen».** El producto lleva **la etiqueta siempre**, en
todas las densidades y todas las vistas. Lo mismo con `pendente de confirmar`, que
en esas dos vistas es solo `#F0B135`.

**4.2 — La etiqueta de `pendente de confirmar` es `?`, y la de `sen sinal` es
`!`.** Un glifo de 9 px. Es *forma* y por tanto cumple la letra de ADR-013 §2,
pero **no es autoexplicativo y no es traducible**, lo que choca con **D-2**: un
signo de interrogación no está ni en galego ni en castellano. **El producto usa
texto**, con los literales que `dominio.md` registra en las dos lenguas.

**4.3 — Los estados se muestran como `FIN`, `APR`, `DESC` y nunca con su
literal.** `dominio.md` registró los cinco literales el 2026-09-02 —*Programado ·
En xogo · Rematado · Aprazado · Suspendido*— y dice expresamente que `Rematado`
«se muestra **siempre con su etiqueta** y nunca como frase suelta», porque
*rematar* tiene dos sentidos en fútbol. `FIN` no es ninguna de las dos cosas, y
las tres abreviaturas **no están en el glosario**. **Gana `dominio.md`.** Y de
paso: el sistema implementa un estado `DESC` (descanso) que **no está entre los
cinco**, y **no implementa `suspended` en ninguna pantalla**; ninguno de los dos
huecos lo resuelve este ADR (§7).

**4.4 — «Directo» donde `dominio.md` dice «En xogo».** Está en **siete** ficheros
—`_logic.js` y sus tres copias generadas, `Componentes.dc.html`, `canvas.json` y
la prosa de `Main.dc.html`—, y es curioso que el propio fichero de fundamentos
(`Main.dc.html`) sí escriba «**En xogo**» en la tabla de estados. Ya estaba
inventariado en `dominio.md` con disparador escrito, y **este ADR no lo cierra
sobre el artefacto** —está congelado— pero sí lo cierra sobre el producto:
**`live` es *En xogo*, en una sola forma, en cualquier superficie**, incluida la
etiqueta de un filtro.

**4.5 — El suelo de toque.** El sistema declara en voz alta una **concesión
deliberada**: la fila compacta baja de 44 px, y en móvil «queda en 40». Medido,
sale a **≈34 px**; la estrella de esa fila ocupa 14 px; las píldoras de filtro
salen a ≈24 px con un «área invisible de 10 px» que **está escrita en la glosa y
no implementada en ningún CSS**; y el botón primario sale a **≈43 px**, un píxel
por debajo. **ADR-025 §3 sigue en pie y gana** (§5): 44 × 44 para todo control de
las interfaces que este ADR gobierna. **La concesión de la fila compacta sigue
siendo asunto de EPIC-004** —ADR-013 la dejó ahí explícitamente— y no se resuelve
aquí, porque aquí no hay fila compacta.

**4.6 — Foco, teclado y formularios: el sistema no los tiene.** Cero `:focus`,
`:focus-visible`, `outline`, `tabindex`, `role` o `aria-*`; todo lo interactivo es
un `<div>` con `onClick`; y **cero elementos de formulario**. **ADR-025 §2 y §3
siguen enteros y son lo único que cubre esto** (§5). Y hay una consecuencia que
hay que decir en voz alta porque cambia lo que significa «seguir el sistema» para
la spec siguiente: **el panel del operador es todo formularios, y el sistema no
trae ninguno.** Lo que se hereda es el **lenguaje** —paleta, tipografía, escala,
densidad, el banner de alerta que el propio sistema dibuja «para el panel del
operador», el panel de traza y el historial de decisiones—; **los controles hay
que inventarlos dentro de ese lenguaje, y eso no es aplicar un sistema: es
extenderlo.**

### §5. Qué de ADR-025 cae y qué sigue en pie

ADR-025 está `aprobada` y es **inmutable**: no se edita. Esto es lo que sobrevive
y lo que no, con la precisión que hace falta para que nadie tenga que adivinar.

| ADR-025 | Estado | Detalle |
|---|---|---|
| **§1** — alcance y regla de suelo | **Parcialmente superseded** | **Cae** su marco temporal («hasta que EPIC-004 se descongele», «cuando se descongele, su sistema manda»): el sistema **ya** manda. **Queda, y pasa a ser la regla operativa**: «§2 y §3 son suelo, no estilo, y un sistema de diseño puede **subirlos pero no bajarlos**». §4.5 y §4.6 son esa regla ejerciéndose. |
| **§2** — foco visible y teclado | **INTACTO** | Y ahora es **más** necesario: el sistema **no trae estados de foco ni navegación por teclado** (§4.6), así que **no supersede a §2 porque no cubre lo que §2 cubre**. El anillo de foco del producto sale de aquí, no del sistema. |
| **§3** — 44 × 44 px, ≥ 16 px en campos, sin scroll horizontal a 360 px | **INTACTO** | El sistema declara una **concesión** por debajo del suelo (§4.5). ADR-025 §1 ya dijo que un sistema puede subir el suelo, no bajarlo. |
| **§4.1** — `src/app/globals.css` no se edita | **INTACTO** | No dependía del sistema de diseño: depende de que SPEC-004 esté `hecho` con la paleta fuera de alcance y de ADR-013 punto 3. Sigue palabra por palabra, y **§1 de este ADR lo repite**. |
| **§4.2** — hoja propia, y no deriva de `globals.css` **ni de `docs/diseno/`** | **Parcialmente superseded** | **Queda**: la interfaz trae su propia hoja, alcanzable solo desde sus rutas, y **no deriva de `globals.css`**. **Cae**: la prohibición de derivar de `docs/diseno/`, que es justo lo que §3 ahora obliga a hacer. |
| **§4.3** — «Ni un valor de `docs/diseno/` se copia» | **SUPERSEDED ENTERO** | Ahora se copian. **Y cae porque su premisa se atendió, no porque fuera falsa:** su motivo era heredar la contradicción de la entrada 1, y **§2 la resuelve antes de copiar nada**, y **§4 desactiva los otros seis incumplimientos**. Copiar sin §2 y sin §4 seguiría siendo el error que §4.3 describía. |
| **§5** — lo que ve un test frente a lo que solo ve un navegador | **INTACTO, y se ensancha en un lado y se estrecha en otro** | **Crece** con la paridad de tokens de §3.3. **Y §3.3 declara además un hueco nuevo**: espaciado, radios y escala tipográfica **no son comprobables contra nada**, así que ahí la adherencia la sostiene una persona. La mitad manual —teclado, foco, 360 px— sigue igual, con su disparador de automatización sin cambios. |

**Nada de ADR-024 se toca.**

### §6. Qué le pasa a EPIC-004: no se descongela, se le cambia el alcance

Este ADR hace dos de las cosas que el alcance de EPIC-004 reservaba para «cuando
se descongele» —**el panel del operador** y **los tokens como código**—, así que
dejar la épica diciendo una cosa y el ADR otra sería **exactamente la patología
que hizo nacer a EPIC-004**: trabajo real rutado a un sitio que no lo describe.

**EPIC-004 NO se descongela.** Lo que cambia es su alcance:

- **Sale de EPIC-004 y pasa a EPIC-002:** el **panel del operador** (de hecho ya
  salió, con SPEC-017) y los **tokens como código** (§3).
- **Se queda en EPIC-004, congelado:** la **custodia** del sistema y de sus
  fuentes, la **interfaz definitiva del marcador**, la **producción de activos de
  marca** —que sigue bloqueada por la comprobación en OEPM, que este ADR **no
  toca**— y, nuevo, **la reparación del propio artefacto**: convertir sus escalas
  en tokens (§3.3), darle foco y componentes de formulario (§4.6), poner la
  etiqueta de `provisional` en las tres vistas (§4.1) y alinear su vocabulario con
  `dominio.md` (§4.2, §4.3, §4.4).

**Y el inventario, entrada por entrada:**

| # | Qué le pasa |
|---|---|
| **1** — `provisional` es el normal | **CERRADA por §2**, y para **todas** las interfaces, no solo el panel. Era «la que más caro sale ignorar» y es la que este ADR estaba obligado a contestar antes de adoptar nada. |
| **2** — falta la tabla de clasificación | **INTACTA.** Este ADR no la toca; disparador sin cambios. |
| **3** — faltan foco y teclado | **SIGUE ABIERTA SOBRE EL ARTEFACTO** (§4.6) y **cubierta para el producto por ADR-025 §2**, que ahora es permanente y no «hasta el deshielo» (§5). **Adoptar el sistema no la cierra: el sistema no los tiene.** |
| **4** — faltan estados de carga y de dato viejo | **INTACTA**, y su disparador —«la primera spec de `src/api/`»— **está a punto de dispararse**: es la spec del snapshot, la siguiente. Queda nombrado aquí para que no la pille por sorpresa. |
| **5** — el panel no tiene ningún diseño | **CERRADA en cuanto a lenguaje**: ahora lo tiene. **Abierta en cuanto a controles**: el sistema no trae formularios (§4.6). Lo que queda del lado del producto es aplicarlo, que es CA-10 de SPEC-017. |
| **6** — ¿tema claro? | **NO se cierra, y empeora de forma controlada** (§1, §3.6): el choque pasa de latente a visible para quien navegue entre el producto y `/proxecto`. **Dueño y disparador nuevos: la spec de migración del sitio público** (§1). |

**Quién escribe esto en la épica: `sdd-producto`, bajo la firma del gate.** Las
épicas y el roadmap son suyos, no de `sdd-arquitecto`. **Follow-up con dueño**, y
está en las consecuencias para que no se pierda: sin esa edición, `_epica.md` de
EPIC-004 y este ADR se contradicen desde el día uno.

### §7. Lo que este ADR no decide

- **No repinta el sitio público.** §1: es una spec, con su disparador.
- **No aprueba ninguna pantalla.** Fija de dónde salen los valores, qué no puede
  apagarse y qué no se hereda; el dibujo es de cada spec.
- **No arregla `docs/diseno/`.** Está congelado (§3.7): las seis desviaciones de
  §4 se resuelven **en el producto**, no en el artefacto.
- **No elige icona ni produce ningún activo de marca.** Sigue bloqueado por OEPM.
- **No toca ADR-013, que manda por encima de este ADR.** §1..§6 siguen vinculando,
  y donde el sistema los contradice **gana ADR-013** (§4).
- **No decide la tabla de clasificación** (entrada 2) ni **los estados de carga y
  de dato viejo** (entrada 4).
- **No resuelve `descanso` ni `suspended`** (§4.3): el primero es un estado que el
  sistema dibuja y el glosario no tiene; el segundo, uno que el glosario tiene y el
  sistema no dibuja. **Destino: `sdd-arquitecto` y `sdd-competicion`**;
  **disparador: la spec del snapshot**, que es la primera que enseña los cinco
  estados al público.
- **No elige el paquete de la fuente** (§3.5) ni fija la escala tipográfica
  concreta: sale del sistema y la aterriza la spec.
- **No descongela EPIC-004** (§6).

## Consecuencias

### Positivas

- **El producto tendrá una sola lengua visual, y estará escrita.** Hasta hoy cada
  spec de interfaz habría inventado su paleta y su escala; ahora hay un sitio del
  que salen y un test que lo comprueba donde hay algo con qué comparar.
- **La entrada 1 del inventario se cierra, y por el lado bueno.** Era la que
  EPIC-004 llamaba «la que más caro sale ignorar», llevaba viva desde el
  2026-09-01 y su disparador se había adelantado dos veces. **§2 la contesta antes
  de que se escriba una línea de CSS**, que es exactamente cuando había que
  contestarla.
- **Leer el artefacto entero antes de declararlo vinculante evitó siete errores
  que se habrían copiado.** El `@import` a un tercero en cada carga de página, un
  token llamado `--directo` que perpetúa la etiqueta retirada, `--fg-prov`
  apagando el estado dominante, `provisional` solo por color en dos de tres
  vistas, `?` y `!` como etiquetas intraducibles, `FIN`/`APR` fuera del glosario, y
  un suelo de toque incumplido en cuatro sitios. **Ninguno se habría visto
  copiando valores.**
- **«Seguir el sistema» tiene mecanismo, no solo intención**, y **también tiene
  declarado dónde el mecanismo no llega** (§3.3), que es lo que separa un criterio
  de una promesa.
- **ADR-025 sobrevive casi entero**, y la parte que sobrevive es la que más falta
  hace: el sistema **no tiene** foco, teclado, formularios ni suelo de toque.
- **EPIC-004 deja de decir una cosa mientras el código hace otra**, que era su
  propio motivo de existir, y **gana un trabajo que antes no tenía**: reparar el
  artefacto.

### Negativas / follow-ups

- **El sistema sigue sin haber sobrevivido a un sábado.** Es la misma pega que
  ADR-025 y ADR-013 se pusieron a sí mismos, y el criterio de éxito 5 de EPIC-004
  la nombra: un sistema se prueba con el producto delante, no con un canvas. Se
  adopta antes de esa prueba porque el humano lo ha decidido con el hecho delante.
- **Se declara vinculante un artefacto que no se puede ejecutar.** Tres de sus seis
  artboards dependen de un runtime que no está en el repositorio (`support.js`,
  `DCLogic`), así que **la autoridad es el artefacto tal como se lee**, no tal como
  se ve. Quien quiera verlo tiene que publicarlo con el editor de canvas. **Destino:
  EPIC-004**; **disparador: el deshielo, o el día que alguien no pueda revisar un
  cambio sin abrirlo.**
- **La adherencia a la escala no la comprueba nada** (§3.3). El espaciado, los
  radios y la tipografía dependen de la revisión humana, y el propio sistema no
  respeta sus escalas declaradas. **Es el hueco más grande que deja este ADR**, y
  está declarado en vez de disimulado.
- **Dos temas opuestos en el mismo dominio**, y con **ADR-010** eso lo va a ver una
  persona. **Dueño: la spec de migración del sitio público**; **disparador: el
  go/no-go, o antes si comparten navegación.**
- **La lista de divergencias es deuda con forma.** Nace con tres entradas
  motivadas; si crece sin reconciliarse, `docs/diseno/` deja de describir lo que se
  sirve y la paridad se vuelve ceremonia. **Guardia escrita: el día que alguien no
  pueda decir qué se sirve leyendo `docs/diseno/`, el artefacto está obsoleto y hay
  que reconciliarlo, no ampliar la lista.** **Reconciliación: el deshielo de
  EPIC-004.**
- **Las seis desviaciones de §4 se arreglan en el producto y no en el artefacto**,
  así que durante un tiempo **el sistema y el producto dirán cosas distintas** en
  seis puntos concretos. Están enumerados aquí para que la diferencia sea
  consultable en vez de sorprendente.
- **CA-10 de SPEC-017 se reescribe y su implementación se retrasa.** La spec está
  `aprobada` y **en implementación**; CA-10 y todo el CSS están congelados mientras
  tanto. Se puede reescribir porque **la spec no está cerrada** —ADR-015 gobierna
  las cerradas— y la reescritura la firma el mismo gate que este ADR.
- **Una dependencia nueva**, la de la fuente autoalojada (§3.5).
- **`sdd-producto` tiene que editar `_epica.md` de EPIC-004 y `docs/roadmap.md`**
  (§6). **Si esa edición no ocurre, este ADR y la épica se contradicen desde el día
  uno.**
- **Los datos de las pantallas del sistema son inventados**, y su propio
  `canvas.json` lo advierte: «**ningunha cifra destas pantallas é un dato**». Se
  repite aquí porque un sistema vinculante invita a leer sus ejemplos como
  especificación, y `Rácing Villalbés 1-0 SD Estradense` no es un resultado.

## Alternativas consideradas

- **Mantener ADR-025 §4 y no adoptar el sistema.** **Rechazada por decisión del
  humano**, tomada con los dos motivos de ADR-025 §4.3 delante. Y hay que decir que
  el primero **se desactiva resolviéndolo**: §4.3 temía heredar la contradicción de
  la entrada 1, y §2 la resuelve **antes** de copiar un solo valor. Sin §2 y sin
  §4, §4.3 seguiría teniendo razón.
- **Adoptar el sistema tal cual, `--fg-prov` incluido.** Rechazada, y es el rechazo
  central: sería heredar con código encima justo lo que la entrada 1 advierte, y la
  pantalla **mentiría sobre la fiabilidad del dato**, contra D-6 y RN-12. «Hay que
  seguir el sistema» no puede leerse como «hay que reproducir sus errores
  conocidos»; seguirlo es adoptar su lenguaje, no sus seis desviaciones de §4.
- **Invertir el énfasis apagando `confirmado`.** Rechazada: repite la falta con el
  signo cambiado. ADR-013 §6 lo dice —«distinguir es distinguir dos cosas legibles,
  no borrar una»— y además el reparto entre normal y raro **puede cambiar** el día
  que vuelva `futgal.es`; un diseño que apaga al minoritario se rompe cuando cambia
  la mayoría. Por eso §2 fija que **ninguno** se apaga.
- **Importar `docs/diseno/_tokens.css` desde `src/` y hacerlo la fuente de verdad
  en ejecución.** Rechazada por tres motivos independientes: ata la aplicación a un
  artefacto **congelado de otra épica** —cambiar un color exigiría descongelar
  EPIC-004—, **arrastraría el `@import` de Google Fonts a producción**, y sobre
  todo **`_tokens.css` no es la fuente de verdad ni dentro del propio sistema**:
  no lo usa ningún artboard.
- **Extraer los tokens de los artboards en lugar de `_tokens.css`**, ya que son
  ellos los que gobiernan de facto. Rechazada: son ~200 strings en línea,
  duplicados, con tres definiciones incompatibles del mismo componente —las
  píldoras de filtro tienen dos variantes distintas— y con las seis desviaciones de
  §4 dentro. Extraer de ahí es extraer el desorden. `_tokens.css` **es la intención
  declarada del sistema**, y coincide con la tabla de ADR-013.
- **Copiar los tokens sin test de paridad.** Rechazada: es la opción que parece
  igual y no lo es. «Seguir el sistema» sin mecanismo dura hasta el primer valor
  que alguien ajusta a ojo, y la divergencia sería **invisible** — el modo de fallo
  que SPEC-016 documentó para los gates («un gate que hay que acordarse de correr
  no es un gate»).
- **Copiar los tokens y prohibir toda divergencia.** Rechazada: **su primer día ya
  se incumpliría tres veces** (§3.4), y una regla que nace incumplida no es una
  regla. Lo que sirve es que divergir sea legal y **cueste escribir el motivo**.
- **Conservar los nombres galegos de los tokens.** Rechazada por `CLAUDE.md`
  §Lenguas y por algo más concreto: **`--directo` mete en el código la etiqueta que
  `dominio.md` retiró el 2026-09-03**. Un token es un identificador y los
  identificadores van en inglés; la tabla de correspondencia de §3.3 conserva la
  trazabilidad sin conservar el error.
- **Arreglar `docs/diseno/` en vez de divergir en el código.** Rechazada:
  descongelaría EPIC-004 de hecho, que es lo que §6 evita, y además tocar un
  artefacto de seis ficheros generados —tres de ellos por `build.mjs` desde
  `_logic.js`— para que un panel salga bien es hacer trabajo de otra épica sin su
  gate. **Se registra como trabajo de EPIC-004**, que es donde le toca.
- **Repintar el sitio público aquí, «ya que estamos».** Rechazada, y es la
  tentación más probable ahora que el sistema es vinculante: **SPEC-004 está
  `hecho` y GREEN** con la paleta fuera de alcance a propósito, y **ADR-013 punto 3
  exige una spec que motive por qué**. Un ADR no reabre una spec cerrada. §1 la
  nombra en vez de hacerla.
- **Inventar una variante clara del sistema** para que el producto y el sitio
  dejasen de chocar. Rechazada: sería diseñar por nuestra cuenta justo lo que la
  decisión del humano manda seguir, el sistema es oscuro-only a propósito, y sus
  contrastes **están medidos sobre `#111110`** — en claro dejarían de valer. El
  choque se resuelve migrando el sitio, no bifurcando el sistema.
- **Descongelar EPIC-004 entera.** Rechazada: su criterio de corte sigue en pie
  para la interfaz definitiva y para los activos de marca —bloqueados por OEPM—. Lo
  que hacía falta era **un cambio de alcance**, más barato y más honesto que un
  deshielo por conveniencia.
- **Superseder ADR-025 entero.** Rechazada: **§2, §3, §4.1 y §5 son correctos y
  siguen haciendo falta**, y el sistema **no cubre nada de lo que §2 y §3 cubren**
  (§4.5, §4.6). Superseder entero habría dejado al producto sin foco visible, sin
  teclado y sin suelo de toque el mismo día que ganó una paleta.
