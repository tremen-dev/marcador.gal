---
id: ADR-016
tipo: adr
estado: borrador
historial:
  - {estado: borrador, fecha: 2026-09-01, por: sdd-arquitecto}
---
# ADR-016: Cómo se demuestra una frontera de capacidad: se enumera lo permitido y el resto tiene que ser vacío

- Deciders: propone `sdd-arquitecto` el 2026-09-01, por encargo explícito de
  **Alberto Fojo** en el arbitraje de SPEC-008 de ese mismo día. La pregunta la
  levantó el §8.4 de la enmienda del ledger de SPEC-008 —*«si esto debe ser un
  ADR»*— y la contestó él: sí. **Aprueba: pendiente de gate humano.** Nace en
  `borrador` y ningún rol `sdd-*` puede firmarlo.
- **Corregido el 2026-09-01, todavía en `borrador` y antes de cualquier firma**,
  a raíz del arbitraje de la treceava entrada de `ALLOWED_PACKAGES` (ledger de
  SPEC-008, «Arbitraje del gate humano — 2026-09-01»). El §3.1 se podía leer como
  que una lista de lo permitido debe ser **inmutable**, y la de dependencias la
  fijamos nosotros y crece: §3.1 y §3.2 dicen ahora que lo exigido es que sea
  cerrada **en cada momento** y que crecer sea un diff con motivo, nunca un
  arbitraje. Nada más cambia.
- **Corregido por segunda vez el 2026-09-01, todavía en `borrador` y antes de
  cualquier firma**, a raíz de la **tercera verificación de SPEC-008** y de la
  enmienda que la sigue («CA-2 cierra por la superficie que se importa, y la
  trampa baja al socket»). Dos cosas que el ADR no decía y que el expediente
  midió: **§3 gana una quinta obligación** —una lista de lo permitido no puede
  esconder una lista de lo prohibido en su propia condición de admisión— y **§5
  se corrige**: sustituir el módulo en el registro solo alcanza al grafo que el
  runner transforma, así que la trampa va sobre el objeto por el que pasa la
  capacidad **en el momento de usarla**, y hay que demostrarlo midiendo. Nada más
  cambia, y **el ADR sigue sin aprobar**.
- Specs relacionadas: **SPEC-008** (EPIC-002) — el caso que lo origina y la
  primera aplicación; **SPEC-002** y **SPEC-003** (`hecho`, EPIC-001) — de donde
  sale la prueba documental de que la convención no basta (F-SPEC-002-23); y
  aguas abajo **las ocho specs restantes de EPIC-002**, que van a escribir tests
  de arquitectura sobre RN-08, RN-09, RN-10 y RN-11.
- Relacionado: **ADR-014 §4** (la frontera concreta cuya demostración disparó
  esto), **ADR-015** (qué se hace cuando un CA deja de poder ser cierto) y
  **ADR-007** (oxlint con reglas *type-aware*, que es la otra herramienta con la
  que se podría intentar lo mismo).

## Contexto

### Las reglas duras de este proyecto fallan en silencio

RN-08, RN-09, RN-10 y RN-11 comparten un modo de fallo: **no lanzan nada**.
Publicar sin pasar por el motor no explota. Parsear antes de archivar no explota.
Una petición que sale sin permiso se sirve y no vuelve. Ninguna suite se pone
roja sola. Su guardián es un test de arquitectura, o no hay guardián.

Y hay prueba documental de que la convención escrita no basta: **F-SPEC-002-23**
—el comodín `*` tratado como carácter literal en `parseRobots`— vivió semanas en
`main`, dentro de la única implementación de RN-11, sin que nada se pusiera rojo.
ADR-014 §4 lo dice con las palabras exactas: *«una prohibición que solo vive en
un ADR es una prohibición que se incumple el día que nadie relee el ADR»*.

### Y el primer intento serio de escribir uno se atascó, medido

**SPEC-008 CA-2** exigía que un test de arquitectura no encontrara, fuera de
`src/polite/`, ninguna de las tres cosas que ADR-014 §4 prohíbe. Se implementó
con **detección textual**: una batería de patrones sobre el árbol de ficheros.
Dos vueltas de verificación, el mismo patrón las dos veces:

1. El verificador escribe tres evasiones; las tres pasan la suite entera en verde.
2. El implementador cierra las tres con detectores nuevos, y sus controles muerden.
3. El verificador escribe **tres más**.

Siete evasiones en dos vueltas. Ninguna era rebuscada: `const { fetch: send } =
globalThis`, `await import('node:' + 'https')`, una `regex` en vez de un literal
entrecomillado. El propio ledger había escrito el diagnóstico **antes** de que
ningún verificador lo demostrara (F-SPEC-008-10): *«los detectores son textuales,
y por tanto siguen siendo una lista de lo que ya sabemos escribir»*.

**Y hubo una octava, que es la que enseñó lo que faltaba** *(añadido el
2026-09-01)*. La tercera vuelta implementó ya la forma de este ADR —enumerar lo
permitido— y aun así salió un paquete: `cheerio` estaba en la lista de paquetes
permitidos y **es** un cliente HTTP. No rodeó ningún detector; **entró por la
puerta principal**. Enseñó dos cosas, que son §3.5 y la corrección de §5: que una
lista de lo permitido puede seguir escondiendo una lista negra en su condición de
admisión, y que sustituir un **módulo** no alcanza a una dependencia que el
runner externaliza.

**Ése es el hallazgo general, y es lo único que este ADR generaliza:** una lista
de *formas de escribir* una llamada está cerrada por la imaginación de quien la
rodea, y esa lista no tiene última entrada. Un criterio que promete
«no encuentra **ninguna**» apoyado en un mecanismo así **describe un resultado
que su mecanismo no puede alcanzar**. No es un defecto de quien lo implementa: es
una promesa mal escrita.

### Por qué hay que decidirlo ahora y no caso a caso

EPIC-002 tiene **ocho specs por delante** y varias necesitan exactamente lo mismo:

- *solo el motor escribe una `Decision`* (RN-08, D-3);
- *nada llega a publicarse con la identidad adivinada* (RN-09);
- *nada lee un byte antes de que el archivo lo haya guardado* (RN-10);
- *solo `src/polite/` habla con un tercero* (RN-11, ADR-014 §4).

Sin regla escrita, cada una la resuelve quien esté de turno, con otro criterio y
probablemente repitiendo las dos vueltas de SPEC-008. Ya van dos artefactos en
tres días —éste y ADR-015— nacidos de la misma causa: **una regla sin domicilio
la reinventa el siguiente**.

## Decisión

### 1. Qué es una frontera de capacidad, y cuándo aplica este ADR

Una **frontera de capacidad** es toda regla de la forma *«solo X puede hacer Y»*,
donde Y es una **capacidad** —algo que el código *puede obtener*: mandar bytes a
la red, escribir en una tabla, leer un fichero, resolver un módulo—.

Este ADR gobierna **cómo se demuestra** una frontera así, y nada más. No decide
qué fronteras existen —eso lo deciden los ADR y las reglas de `reglas.md`—, no
obliga a que toda spec escriba un test de arquitectura, y no alcanza a las reglas
que **no** se reducen a una capacidad (§*Consecuencias negativas*, punto 4).

### 2. La regla: se enumera lo permitido y se exige que el resto sea vacío

**Un test de arquitectura que demuestre una frontera de capacidad no enumera lo
prohibido. Enumera lo permitido, y comprueba que el complemento está vacío.**

La diferencia no es de estilo. Una lista de lo prohibido crece cuando alguien
inventa una forma nueva de escribir una línea; una lista de lo permitido crece
cuando llega una dependencia real, y eso es un diff que un revisor lee.

### 3. Las cinco obligaciones de una lista de lo permitido

Toda lista que sostenga una frontera cumple las cinco. Una que no las cumpla no
demuestra nada, y decir que sí es peor que no tener test.

1. **Cerrada en cada momento, y por algo que existe fuera del test.** La lista
   tiene que enumerar algo que exista **antes** del test: la superficie de salida
   de la plataforma, las dependencias declaradas del proyecto, las maneras que el
   lenguaje da de alcanzar una capacidad. Si lo que enumera son *formas de
   escribir*, la lista está cerrada por nuestra imaginación y no es una frontera.
   **Es el criterio que separa este ADR de lo que había, y el único no
   negociable.**

   **«Cerrada» no quiere decir «inmutable», y hay que decirlo porque se lee mal.**
   Las dependencias declaradas de un proyecto **las fijamos nosotros y crecen**;
   eso no es el defecto. Lo que hace buena a una lista es que, en cada momento, la
   pertenencia se decida contra algo que existe con independencia del test —el
   `package.json`, la superficie de la plataforma, la gramática del lenguaje— y no
   contra lo que a alguien se le haya ocurrido escribir. Una lista de *formas de
   escribir* no tiene última entrada; una lista de *lo que existe* la tiene
   siempre, aunque sea otra cada mañana.

2. **Vive en un sitio con nombre, crecer es un diff, y cada entrada llega con su
   motivo.** La lista es un identificador exportado en un fichero, no una
   constante enterrada ni un patrón inline. Ensancharla **no está prohibido ni es
   un arbitraje**: está obligado a ser visible, y toda entrada nueva llega con su
   motivo escrito junto a la lista, en el mismo diff que la añade. La diferencia
   entera entre el mecanismo bueno y el malo es que añadir una entrada sea una
   línea que alguien revisa en vez de una forma nueva de escribir una llamada que
   nadie ve.

   De ahí se sigue una consecuencia que un criterio no debe olvidar: **un CA que
   escriba el contenido de la lista dentro de su propio texto convierte cada
   dependencia nueva en una firma humana**, y eso no es rigor sino peaje. El CA
   fija la **forma** —que la lista exista, que todo especificador sea literal y
   esté en ella, que ninguna entrada sea aquello que la frontera prohíbe, y que
   cada entrada nueva lleve motivo—; el **contenido** vive en el fichero y crece
   ahí. Lo que sí exige firma es relajar la forma: quitar la literalidad, quitar
   el motivo, o admitir en la lista la capacidad que la frontera cierra.

3. **Ninguna exención por nombre de fichero, ni por patrón de ruta.** Una lista
   de ficheros exentos es un agujero con fecha: se cuela lo que quepa dentro del
   fichero exento, y el caso que vigila la lista queda contento mientras el
   mecanismo no vigila nada. Si un fichero necesita una excepción, o la frontera
   está mal trazada o el fichero está en el sitio equivocado; las dos cosas se
   arreglan escribiendo, no tolerando.

4. **Control positivo por mecanismo, no por batería.** Apagar **cada uno** de los
   mecanismos que sostienen el criterio tiene que poner rojo **al menos un caso
   nombrado**. Un mecanismo sin control positivo es ceremonia: funciona hoy y
   nadie se entera el día que alguien lo borre por ruidoso.

5. **Que la lista no esconda una lista de lo prohibido dentro de su propia
   condición de admisión.** *(Añadida el 2026-09-01, con el caso medido delante.)*
   Una lista de lo permitido no vale por llamarse así: vale si **admitir una
   entrada no obliga a nadie a saber de antemano si esa entrada es la capacidad
   que la frontera cierra**. En cuanto la condición de admisión se escribe como
   «…y que no sea de éstos», la lista negra ha vuelto, un nivel más adentro y
   donde nadie la mira.

   **El caso, y es literal.** SPEC-008 CA-2.3 exigía de `ALLOWED_PACKAGES` que
   «ninguna entrada sea una puerta de salida». Se mecanizó con **trece nombres
   prohibidos**, y `cheerio` —que desde la 1.0 exporta `fromURL` y **es** un
   cliente HTTP— no estaba entre ellos: once líneas mandaron una petición real
   sin `User-Agent`, sin `robots.txt` y sin turno, con la suite entera en verde.

   **La salida no es una lista negra mejor: es bajar el grano de la concesión**
   hasta que la pregunta se conteste sola. No se concede el paquete, se concede
   la **superficie** que se importa de él; entonces `fromURL` es rojo **sin que
   nadie tenga que saber que existe**, y lo mismo le pasa al siguiente. La regla
   general: *si conceder la entrada entera obliga a preguntar «¿es esto una
   puerta?», la lista está un nivel demasiado arriba*.

   Y si tras bajar el grano **sigue quedando un juicio** —un nombre concedido que
   sea a su vez una puerta—, el criterio lo escribe como **residuo** (§6) y no lo
   disfraza de mecanismo.

### 4. El escaneo declara sus raíces, y las raíces cubren el repositorio

Un test que recorre el árbol declara **qué raíces recorre**, y un caso comprueba
que **todo fichero de código versionado fuera de `tests/` cae bajo alguna**. Una
frontera que solo mira `src/` no es una frontera: la configuración ejecutable de
la raíz del repositorio es código, y se despliega.

Donde la frontera se demuestre por alcanzabilidad —el grafo de `import` desde
unos puntos de entrada declarados—, **un fichero que nadie importa es rojo**.
Dejar de serlo exige o importarlo, y entonces le aplica el resto del criterio, o
añadirlo a la lista de puntos de entrada, que es otra vez un diff visible.

### 5. Cuando la capacidad se puede interceptar, se contiene en ejecución

Si la capacidad se puede sustituir por una trampa —un global, un módulo, un
puerto—, la demostración preferente es **poner la trampa sobre la capacidad, no
sobre el texto**, conducir los puntos de entrada declarados y exigir que toda
trampa que se dispare se atribuya al único dueño permitido.

La trampa se instala **antes** de importar el código bajo prueba: una segunda
puerta puede capturar la referencia en el ámbito del módulo, y una trampa
instalada después la deja pasar. **El orden es un mecanismo del criterio**, y
como tal le aplica §3.4: tiene que haber un caso que se ponga rojo si la
instalación se mueve, sin ninguna otra mutación que lo acompañe.

**Y la trampa va sobre el objeto por el que pasa la capacidad en el momento de
usarla, no sobre el registro de módulos.** *(Corregido el 2026-09-01, con la
medición delante.)* Sustituir un módulo en el registro del runner **solo alcanza
al grafo que el runner transforma**: una dependencia de `node_modules` queda
externalizada y abre la suya por debajo. Está medido en SPEC-008 y no es teoría —
la trampa registró **cero disparos mientras salía un paquete de verdad**—, así
que *«se sustituyen por trampas todas las salidas de la plataforma»* era falso
tal como el mecanismo lo implementaba.

De ahí dos obligaciones para cualquier contención en ejecución, y las dos son
**medidas**, no argumentos:

1. **Que vea a una dependencia de fuera del grafo transformado.** Un control
   positivo en el que la salida la abre una dependencia instalada, no código
   nuestro, y la trampa se dispara.
2. **Que pueda negar, no solo contar.** Una trampa que rechaza deja el destino
   —siempre un servidor propio, nunca un tercero— sin recibir nada. La que cuenta
   y no puede impedir demuestra observación, no contención.

Y el criterio **nombra la propiedad, no el símbolo**: «el punto por el que pasa
toda salida de socket del proceso» sobrevive a que la plataforma mueva el punto;
un nombre de función, no.

La contención en ejecución no sustituye al cierre estático: **se usan juntos**.
El estático alcanza el código que nadie ejecuta; el de ejecución no depende de
cómo se escriba la línea. Cada uno tapa el residuo del otro.

### 6. El criterio dice, dentro del criterio, qué NO promete

Ésta es la obligación que este ADR le pone al **autor de la spec**, y es la que
habría ahorrado dos vueltas.

Todo CA que demuestre una frontera de capacidad lleva escrito, **dentro de su
propio texto**, el residuo que su mecanismo no alcanza, nombrado de forma que se
pueda medir. «No encuentra ninguna» solo se escribe cuando el mecanismo puede
llegar a *ninguna*; en cualquier otro caso se escribe la promesa verdadera, más
estrecha, y al lado lo que queda fuera.

Un criterio verdadero y estrecho vale más que uno amplio y falso: el estrecho se
puede cerrar después con un CA nuevo, y el amplio se descubre roto en la tercera
vuelta de verificación, cuando ya no queda vuelta.

### 7. Lo que este ADR no hace

No crea un estado, ni un artefacto, ni un rol, ni un gate. No obliga a escribir
tests de arquitectura donde no hay frontera. No reabre ningún CA ya verificado de
SPEC-004, SPEC-005, SPEC-006 ni SPEC-007: **aplica a los criterios que se
escriban a partir de hoy**, y a los que una enmienda toque por otro motivo. Y no
convierte al verificador en autor: si un criterio incumple estas obligaciones,
eso es un *finding* con destino `sdd-arquitecto`, no una corrección del test.

## Consecuencias

### Positivas

- **La tercera vuelta de SPEC-008 deja de ser una apuesta.** El criterio que se
  va a implementar tiene una forma decidida, y el verificador tiene contra qué
  juzgarla que no es su propia imaginación.
- **Las ocho specs restantes de EPIC-002 heredan la forma.** RN-08, RN-09 y
  RN-10 van a pedir exactamente esto, y ninguna tiene que redescubrirlo.
- **Las listas cambian de naturaleza, y con ellas el trabajo de revisión.** Un
  revisor deja de tener que imaginar cómo se rodea un patrón y pasa a leer si una
  entrada nueva de una lista está justificada. Lo segundo se puede hacer bien.
- **Desaparecen las exenciones por nombre**, que son la forma de agujero que este
  repositorio ya se ha encontrado dos veces (F-SPEC-008-9, F-SPEC-008-V9).
- **El coste de decidir mal se paga antes.** La obligación de escribir el residuo
  dentro del CA mueve el descubrimiento del atasco de la verificación a la
  redacción, que es donde es barato.

### Negativas / follow-ups

1. **Es más caro que una `regex`, y bastante.** Instalar trampas antes de los
   `import`, recorrer el grafo de módulos y declarar las listas es trabajo real
   de `tests/`, y la primera vez se paga entero. La compensación es que se paga
   una vez por repositorio y no una vez por spec —pero la primera spec lo paga
   sola.
2. **La contención en ejecución solo alcanza lo que se ejecuta.** Un fichero
   alcanzable cuya rama de red no ejerza ningún test no dispara la trampa. Lo
   estrecha el cierre estático y lo cierra la **cobertura**, que este ADR no
   decide y que hoy este proyecto no mide. Queda nombrado como lo que es: un
   residuo conocido, no un descuido.
   **Y solo alcanza la superficie sobre la que se pone la trampa** *(añadido el
   2026-09-01)*: una trampa sobre el socket no ve UDP, ni un subproceso que pida
   por su cuenta, ni un binario nativo. Esa parte la cierra únicamente el §2 y el
   §4 —lo que no es una entrada declarada no se puede importar—, y el criterio
   tiene que decirlo dentro de sí mismo (§6) en vez de dar a entender que la
   trampa lo ve todo.
3. **Una lista de lo permitido se ensancha con una línea.** El mecanismo no
   impide relajar la frontera; obliga a que relajarla sea visible. **Si nadie lee
   los diffs, esto es ceremonia**, y hoy no hay CI: el gate de calidad corre en
   local. Es la objeción de peso contra esta decisión y va escrita entera.
4. **No toda regla dura es una frontera de capacidad.** RN-09 —*un LLM nunca es
   la única fuente de un marcador*— no se reduce a una capacidad que se pueda
   interceptar: su guardián es un `CHECK` en la base de datos y una persona
   confirmando. Para reglas así este ADR **no da mecanismo**, y decir que lo da
   sería el mismo error que enmendar CA-2 corrigió. Cuando aparezca el primer
   caso que lo necesite, será otro ADR.
5. **Nada obliga mecánicamente a cumplir §3 y §6.** Igual que ADR-015, esto es
   disciplina con un sitio donde ejercerla. Lo que aporta es que el verificador
   pueda citar un número al rechazar un criterio, en vez de discutir de gusto.
6. **Puede leerse como permiso para no decidir fronteras**, por no querer pagar
   el test. Si alguna vez alguien argumenta eso, este ADR está mal y hay que
   superseder.

## Alternativas consideradas

- **Enumerar lo prohibido, con detección textual bien hecha.** Es lo que había, y
  se rechaza **con medida, no por gusto**: dos vueltas de verificación, siete
  evasiones, y un diagnóstico escrito en el propio ledger antes de que nadie lo
  demostrara (F-SPEC-008-10). La objeción no es que se cuelen casos raros: es que
  el criterio prometía «ninguna» y su mecanismo no puede llegar ahí nunca. Sigue
  siendo válida como **complemento** —un patrón que caza la forma obvia es barato
  y no molesta—, nunca como la prueba de la frontera.
- **Dejarlo en revisión de código y convención escrita.** Rechazada por la prueba
  documental: F-SPEC-002-23 vivió semanas en `main` dentro de la única
  implementación de una regla dura. Y hoy no hay CI ni segundo par de ojos
  humano; la revisión que se invoca no existe.
- **Una regla del linter (`oxlint`, ADR-007).** Rechazada **como respuesta
  completa, no como técnica**. `no-restricted-imports` y sus parientes cierran
  bien la mitad de `import`, que es **una** de las maneras de alcanzar una
  capacidad, y son legítimos como implementación de esa mitad. No alcanzan al
  global desnudo, a `eval`, a la alcanzabilidad ni a la contención en ejecución;
  y su evidencia no viaja con el ledger de la spec, que es donde un verificador
  la busca. Un CA puede apoyarse en el linter; no puede agotarse en él.
- **Escribirlo como regla de negocio nueva en `reglas.md` (RN-14).** Rechazada
  por sitio: `reglas.md` numera reglas del **dominio** —fútbol, fuentes, datos—,
  y esto es una regla sobre **cómo verificamos**. Meterla ahí obligaría a citarla
  desde el código y desde los commits como si fuera de negocio, y ensuciaría la
  única lista que este proyecto tiene bien cerrada.
- **Resolverlo spec a spec, sin ADR.** Rechazada por lo mismo que ADR-015: ocho
  specs por delante, cada una con quien esté de turno, y una demostración que ya
  ha costado dos vueltas. Es exactamente la situación en la que un ADR es barato
  y su ausencia cara.
- **Exigir cobertura mínima en las ramas de red y cerrar así el residuo del
  punto 2.** Rechazada **por prematura**, no por mala: este proyecto no mide
  cobertura, no hay CI que la haga cumplir, y decidir un umbral sin ningún dato
  es inventarlo. Queda anotado como el sitio al que va este residuo el día que la
  cobertura exista.

<!-- REGLA: un ADR aceptado es INMUTABLE. Para cambiar la decisión, escribe otro ADR que lo supersede (estado del viejo -> bloqueada + nota "superseded por ADR-NNN"). -->
