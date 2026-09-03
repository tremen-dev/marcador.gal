---
id: ADR-025
tipo: adr
estado: aprobada
historial:
  - {estado: borrador, fecha: 2026-09-03, por: sdd-arquitecto}
  - {estado: aprobada, fecha: 2026-09-03, por: Alberto Fojo}
aprobada-por: Alberto Fojo
---
# ADR-025: El suelo de interfaz mientras EPIC-004 está congelada — foco visible, teclado, toque de 44 px, y estilos que no comparten una línea con `globals.css`

- Deciders: propone `sdd-arquitecto` el 2026-09-03, al escribir **SPEC-017**,
  porque el panel del operador es la primera interfaz que EPIC-002 construye y
  **EPIC-004 declara que su entrada 3 «bloquea cualquier spec de interfaz»**.
  **Aprueba: pendiente de gate humano.**
- Specs relacionadas: **SPEC-017** (la primera que lo consume: el panel del
  operador); la spec del **snapshot y la página mínima por polling**, que va
  después y lo va a consumir igual — que **dos** specs lo necesiten es la razón de
  que esto no viva dentro de una de ellas; **SPEC-004** (`hecho`, GREEN), que este
  ADR **no toca** y cuyo `src/app/globals.css` **no se edita**.
- Relacionado: **ADR-013** (semántica visual del marcador: este ADR **no lo
  supersede**, recoge lo que dejó fuera en su punto 6 y lo aterriza donde
  EPIC-004 autorizó adelantarlo), **EPIC-004** (`aprobada` y **congelada**; su
  inventario, entradas **1**, **3**, **4** y **5**), **ADR-016** (la honestidad
  sobre lo que un mecanismo no alcanza), **ADR-024** (el panel, que es el primer
  llamante), **D-2**, **D-8**, **RN-03**.

## Contexto

### EPIC-004 está congelada, y sin embargo se va a construir interfaz

`_epica.md` de EPIC-004 lo dice con todas las letras y lo llama por su nombre
—«**Colisión conocida, anotada el 2026-09-01 al descongelarse EPIC-002**»—:

> Esta épica guarda todo el diseño de interfaz y está congelada; EPIC-002 lista
> entre lo que **no** depende de la RFGF una «página mínima por polling» y un
> «panel de correcciones». Es decir: **se va a construir interfaz mientras su
> diseño está congelado.** […] Se resuelve reconociendo qué necesita cada cosa:
> una página mínima de medición y un panel de operador **no necesitan identidad
> visual, pero sí necesitan las dos entradas que esta épica tiene en el
> inventario**. […] Si alguna spec de EPIC-002 las toca, **el disparador de esas
> entradas es esa spec**, no el go/no-go.

Este ADR es el cobro de ese párrafo. **No descongela EPIC-004** y no produce
ningún sistema de diseño: fija el **suelo** por debajo del cual una interfaz de
este proyecto no puede quedar, aunque su único trabajo sea medir.

### La entrada que bloquea, dicha por la épica y no por mí

> | 3 | **Faltan estados de foco y navegación por teclado.** Se midieron
> contrastes; no se dibujó ningún anillo de foco. Un marcador denso sin foco
> visible es inusable con teclado. | Se descongele. **Bloquea cualquier spec de
> interfaz.** |

«Cualquier spec de interfaz» incluye a SPEC-017. Y ADR-013 lo confirma desde el
otro lado, en sus consecuencias negativas: «**No hay ADR de accesibilidad más allá
de §2 y §6.** Foco visible, navegación por teclado y orden de lectura no están
cubiertos —son entrada 3 del inventario de EPIC-004— y **bloquean cualquier spec
de interfaz**. Que este ADR hable de contraste no debe leerse como que la
accesibilidad ya está resuelta».

Hay exactamente dos salidas: descongelar EPIC-004 —que su propio criterio de
corte prohíbe, y con razón— o **escribir el suelo**. Es lo segundo.

### Y hay una segunda cosa que ADR-013 aplazó y ahora hace falta

ADR-013, *Fuera de alcance*, punto 6: «**El suelo de toque de 44 px y su concesión
en la fila compacta.** Es consecuencia de las pantallas, no invariante de
identidad: depende de qué fila y qué densidad, que es justo lo que está
congelado. **Va con EPIC-004.**»

El razonamiento era correcto **para el marcador**, donde el suelo de toque
compite con la densidad de la fila compacta y esa tensión no se resuelve sin
saber cuántas filas hay. **En un panel de correcciones no hay tal tensión**: no
hay fila compacta, hay botones que bajan marcadores. Así que la parte que
dependía de la densidad sigue congelada, y la parte que no depende de nada
aterriza aquí.

### El tercer problema, que nadie ha visto todavía porque no ha chocado

`src/app/globals.css` sirve **tema claro por defecto** (`--paper:#fbfbf9`,
`--ink:#14181c`) con variante oscura bajo `prefers-color-scheme: dark`. El sistema
de diseño de `docs/diseno/` es **oscuro-only**. Es la entrada 6 del inventario de
EPIC-004, que dice literalmente: «el sitio público y el marcador **no son variante
y base, son dos bases opuestas**. Hoy no chocan porque **no comparten una línea de
CSS**. […] disparador: **la primera spec que aplique tokens al sitio**».

El panel es la primera interfaz nueva desde entonces, y por tanto la primera
oportunidad de que ese choque se vuelva real por descuido: basta con que alguien
«reutilice» las variables de `globals.css` porque están ahí, o con que copie
tokens de `docs/diseno/` porque están medidos. **Las dos cosas convertirían un
conflicto latente en uno real y encima con código encima.** Y ADR-013, punto 3 de
su *Fuera de alcance*, ya negó el permiso en la otra dirección: «Quien llegue aquí
buscando permiso para tocar `globals.css` no lo tiene».

## Decisión

Se fijan **cinco reglas** (§1..§5), citables por número (`ADR-025 §N`), que
vinculan a **toda interfaz que este proyecto construya antes del deshielo de
EPIC-004**: el panel del operador, la página mínima por polling, y cualquier
pantalla de medición que venga después.

### §1. Alcance: interfaces de medición, y solo hasta el deshielo

Este ADR gobierna las interfaces que EPIC-002 construye **porque una cifra las
necesita**, no la interfaz del producto. Cuando EPIC-004 se descongele, su sistema
de diseño manda sobre lo que este ADR fija, con **una** excepción declarada: **§2
y §3 son suelo, no estilo**, y un sistema de diseño puede subirlos pero no
bajarlos.

Y lo que este ADR **no** hace, dicho antes que lo que hace: **no descongela
EPIC-004**, no elige paleta, no produce ningún activo de marca —siguen bloqueados
por la comprobación de OEPM—, y no aprueba ninguna pantalla.

### §2. Foco visible y teclado, en todas partes y sin excepciones

Cierra la **entrada 3 del inventario de EPIC-004 para lo que se construya antes
del deshielo**, y solo para eso.

1. **Todo control interactivo tiene foco visible.** `:focus-visible` con un
   indicador de **al menos 2 px** y **contraste ≥ 3:1** contra el fondo sobre el
   que se dibuja. El indicador **no puede ser solo un cambio de color de fondo o
   de texto**: tiene que ser un contorno o un borde, algo que exista en el
   perímetro del control.
2. **`outline: none` sin sustituto está prohibido.** Es la forma concreta en que
   esto se incumple: alguien apaga el contorno del navegador porque «queda mal» y
   nadie vuelve a poner uno. Un reemplazo que cumpla el punto 1 es legítimo;
   apagarlo y no reemplazarlo, no.
3. **Toda operación se puede completar solo con teclado**: llegar al control,
   activarlo, escribir, enviar y cancelar. En una interfaz donde una tecla baja un
   marcador, `Enter` no puede confirmar sin que la persona haya visto qué va a
   confirmar.
4. **El orden de tabulación es el orden visual**, y se consigue con el orden del
   DOM, no con `tabindex` positivos. Un `tabindex` mayor que 0 está prohibido.
5. **Nada atrapa el foco.** Si hay un paso de confirmación, `Escape` sale de él y
   devuelve el foco al control que lo abrió.

El motivo no es el cumplimiento: es **D-8** aplicada al teclado. «Legible con mala
cobertura» describe un escenario de uso real —un sábado, un campo de Preferente,
las siete de la tarde—, y ese mismo escenario incluye a alguien operando con una
mano, con un teclado externo o con un lector de pantalla. Una interfaz sin foco
visible no es menos bonita: es **inoperable**.

### §3. El suelo de toque es 44 × 44 px, y aquí no hay concesión

**Todo control interactivo ocupa al menos 44 × 44 px de área de toque**, incluida
la que se consigue con relleno en lugar de con tamaño visible. El valor vive como
**constante nombrada en un solo sitio**, como `PRE`/`POST` (ADR-019 §2) y las 6 h
de ADR-014 §3.2.

**Esto no supersede a ADR-013**, y conviene leer la frontera con cuidado: ADR-013
dejó fuera «el suelo de toque de 44 px **y su concesión en la fila compacta**»,
porque **en el marcador** el suelo compite con la densidad y esa tensión no se
resuelve sin saber cuántas filas hay. **En una interfaz de medición no hay fila
compacta**, así que la concesión no tiene nada que conceder. **La tensión del
marcador sigue congelada en EPIC-004**; lo que aquí se decide es el suelo donde no
compite con nada.

Se añaden dos cosas que van con el toque y son de la misma familia:

1. **Los campos de texto tienen tamaño de fuente ≥ 16 px.** Por debajo, Safari en
   iOS hace zoom al enfocar y descoloca la pantalla — en un móvil, en la banda,
   corrigiendo un marcador.
2. **El cuerpo de la página no tiene desplazamiento horizontal a 360 px de
   ancho.** Es el ancho del móvil más estrecho que se sigue usando, y es el número
   que EPIC-MEJORA ya tiene inventariado como no comprobado.

### §4. Los estilos de una interfaz de medición no comparten una línea con `globals.css` ni con `docs/diseno/`

1. **`src/app/globals.css` no se edita.** ADR-013 punto 3 ya lo dijo: quien busque
   permiso para repintarlo no lo tiene, y hace falta una spec nueva que motive por
   qué. Este ADR **no** es esa spec.
2. **Una interfaz de medición trae su propia hoja de estilos, alcanzable solo
   desde sus propias rutas**, y **no importa ni deriva** ni las variables de
   `globals.css` ni los tokens de `docs/diseno/`.
3. **Ni un valor de `docs/diseno/` se copia.** Está congelado y **tiene una
   contradicción conocida sin resolver** —la entrada 1 del inventario, que
   `provisional` es el estado normal y el sistema lo pinta como excepción—, así
   que copiar sus valores es heredar esa contradicción con código encima.

El motivo está en la entrada 6 del inventario: hoy el sitio público y el marcador
no chocan **porque no comparten una línea de CSS**, y esa es la única razón. La
primera interfaz nueva es la primera oportunidad de estropearlo, y se estropea sin
malicia: reutilizar lo que está ahí parece lo correcto. **Mantener las tres bases
separadas es lo que deja el conflicto barato el día que EPIC-004 se descongele y
haya que decidirlo de verdad.**

**Lo que sí se hereda, porque es regla y no estilo: ADR-013 entero.** §2 (ningún
estado ni cualificador solo con color), §3 (dígitos tabulares), §4 (sin escudos),
§5 (ninguna paleta de club), §6 (≥ 4.5:1 para cualquier color que porte un dato).
Y §1, en su forma general: ningún color que signifique un estado del dominio puede
ser a la vez el color de la marca.

### §5. Cómo se comprueba: lo que ve un test y lo que solo ve un navegador

La honestidad de ADR-016 §6 —declarar lo que un mecanismo **no** alcanza—
aplicada a una regla de interfaz, porque aquí es donde más fácil es prometer de
más.

**Lo que un test estático puede afirmar, y por tanto es obligatorio afirmarlo:**
que la hoja de estilos declara el indicador de foco y su grosor; que no hay ningún
`outline: none` sin sustituto; que el suelo de toque existe como constante y se
aplica a los controles; que el tamaño de fuente de los campos cumple; que ningún
estado ni cualificador aparece en el árbol renderizado sin un nodo de texto que lo
nombre; que los dígitos van tabulares; que no se renderiza ninguna imagen; y que la
hoja no importa nada de fuera de sí misma.

**Lo que un test estático NO alcanza, y por tanto se comprueba con un navegador y
una persona:** que el recorrido con teclado funcione de verdad, que el foco se vea
de verdad, que a 360 px no haya desplazamiento horizontal de verdad, y que un
control de 44 px se pueda pulsar con un pulgar. **Ningún análisis de CSS ve un
diseño calculado.**

Decisión sobre esa segunda mitad: **se comprueba a mano, con capturas en el ledger
de la spec** (`_qa/SPEC-NNN/`), que es el mecanismo que el ledger de tremen-sdd ya
tiene para eso. **No se decide aquí meter un navegador automatizado en el
proyecto**: hoy no hay ninguno instalado, meterlo toca la partición del runner
(SPEC-014), el coste de la suite y la CI que no existe, y eso es una spec propia,
no un renglón de ésta. **Disparador escrito: la primera spec que construya la
interfaz del marcador** —es decir, el deshielo de EPIC-004—, que es cuando la
comprobación a mano deja de escalar.

## Consecuencias

### Positivas

- **EPIC-002 puede construir interfaz sin descongelar EPIC-004 y sin fingir que
  el bloqueo no existe.** La entrada 3 se contesta para lo que se va a construir,
  y queda intacta para lo que no.
- **La regla se escribe una vez y la usan dos specs.** El panel y el snapshot
  necesitan exactamente lo mismo; escribirlo dentro del panel habría obligado al
  snapshot a citar una spec en vez de un ADR, o a redecidirlo.
- **Aterriza lo que ADR-013 aplazó sin contradecirlo.** El suelo de toque cae
  donde no compite con nada y la tensión de la fila compacta sigue congelada donde
  ADR-013 la dejó.
- **El conflicto de temas sigue costando lo que costaba.** Tres bases separadas y
  ni una línea compartida, que es exactamente el estado que la entrada 6 describe
  como «hoy no chocan».
- **Es un suelo, no un sistema.** No compromete ninguna decisión estética y no
  cambiaría ni una línea con el informe en la mano — que es, literalmente, la
  prueba del criterio de corte del roadmap.

### Negativas / follow-ups

- **El panel va a ser feo, y eso es correcto.** Un suelo de accesibilidad no es un
  diseño. La entrada 5 del inventario de EPIC-004 —«el panel del operador no tiene
  ningún diseño… es donde un error de diseño cuesta un marcador mal publicado»—
  queda **contestada en lo que bloquea y abierta en lo demás**, con su disparador
  intacto.
- **La mitad de la comprobación la hace una persona.** Es la parte que se
  degrada primero cuando hay prisa. Queda con disparador escrito, no resuelta.
- **44 px es un número elegido, no medido**, como `PRE`, `POST`, `CONFLICT_GRACE`
  y las 6 h de ADR-014 §3.2. Viene de las guías de plataforma, no de una medición
  nuestra. Vive como constante nombrada precisamente para que revisarlo sea un
  diff.
- **Este ADR se aprueba sin haber sobrevivido a un sábado**, igual que ADR-013.
  El criterio de éxito 5 de EPIC-004 dice que un sistema se prueba con el producto
  delante; aquí no hay producto todavía.
- **Nada impide reutilizar `globals.css` desde fuera de una interfaz de
  medición.** §4 se afirma sobre las interfaces que este ADR gobierna; el día que
  haya una que no lo sea, la regla no la alcanza. Es el límite del alcance, no un
  descuido.

## Alternativas consideradas

- **Descongelar EPIC-004 lo justo para el panel.** Rechazada, y es la que más
  fácil parecía: su criterio de corte tiene una prueba —«no cambiaría ni una línea
  con el informe en la mano»— y las pantallas la suspenden. Descongelar «un poco»
  es la forma que tiene un corte de dejar de existir. Además EPIC-004 ya dijo
  cómo se resuelve esto, y no era descongelando.
- **Meter estas reglas dentro de SPEC-017.** Rechazada: la spec del snapshot las
  necesita igual, y una regla que dos specs necesitan citada desde una de ellas es
  la patología que hizo nacer a EPIC-004 —trabajo real referenciado desde donde no
  le corresponde—.
- **Superseder ADR-013 y escribir un ADR de interfaz completo.** Rechazada: ADR-013
  es correcto y no hay nada que corregirle. Lo que le falta es lo que él mismo
  declaró fuera, y eso se añade, no se sustituye. Superseder un ADR aprobado para
  añadirle un párrafo es cómo se pierde la trazabilidad de por qué se decidió cada
  cosa.
- **Reutilizar los tokens de `docs/diseno/`, «que ya están medidos».** Rechazada
  en §4.3, y es la tentación más probable: los contrastes están calculados y el
  trabajo está hecho. Pero el sistema está congelado **con una contradicción
  conocida dentro** —apaga el estado dominante y destaca el raro— y copiarlo es
  heredarla con código encima, que es justo lo que la entrada 1 del inventario
  advierte que sale caro.
- **Reutilizar las variables de `src/app/globals.css`.** Rechazada por la entrada
  6 y por ADR-013 punto 3: el sitio público sirve claro por defecto a propósito, y
  atar el panel a esas variables convierte cualquier decisión futura sobre el tema
  del producto en un cambio que repinta la página de proyecto de EPIC-003, que
  está `hecho` y GREEN.
- **Adoptar un estándar externo por referencia** («cumple WCAG 2.2 AA») y no
  escribir reglas. Rechazada: no es verificable con un criterio de aceptación, no
  dice qué hacer cuando dos pautas compiten, y en la práctica se convierte en una
  frase que nadie comprueba. Las cinco reglas de §2 y §3 son un subconjunto muy
  pequeño y **exigible**, que es lo que sirve para un gate.
- **Añadir un navegador automatizado en esta decisión.** Rechazada en §5: hoy no
  hay ninguno, y meterlo toca la partición del runner de SPEC-014, el coste de la
  suite y una CI que no existe. Es una spec, no un renglón, y tiene disparador
  escrito.
- **No escribir nada y dejar que cada spec de interfaz decida.** Rechazada: es
  exactamente lo que EPIC-004 dice que no hay que hacer, y el resultado previsible
  es que la primera lo decida bien, la segunda lo copie mal y la tercera no lo
  decida.
