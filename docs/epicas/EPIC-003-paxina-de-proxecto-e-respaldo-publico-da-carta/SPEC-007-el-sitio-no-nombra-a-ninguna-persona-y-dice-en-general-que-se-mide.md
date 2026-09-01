---
id: SPEC-007
tipo: spec
epica: EPIC-003
estado: en-revision
aprobada-por: Alberto Fojo
historial:
  - {estado: borrador, fecha: 2026-09-01, por: sdd-arquitecto}
  - {estado: aprobada, fecha: 2026-09-01, por: Alberto Fojo}
  - {estado: en-progreso, fecha: 2026-09-01, por: sdd-implementador}
  - {estado: en-revision, fecha: 2026-09-01, por: sdd-implementador}
---
# SPEC-007 — El sitio no nombra a ninguna persona y dice en general qué se mide

## Problema

Alberto Fojo pidió el 2026-09-01, con el sitio ya en producción, **dos cambios de
contenido** sobre `/proxecto`:

1. *«No quiero que salga mi nombre de momento en la web. Si enlazamos a
   tremen.dev, allí ya aparece mi nombre en los textos legales; prefiero que
   marcador.gal quede bajo el paraguas de tremen.dev sin especificar quién hay
   detrás (ni si soy uno o mil).»* Aclarado por él mismo ese día, y es **un solo
   requisito**: *«no me preocupa la carta, me preocupa el texto de la web
   marcador.gal. La carta saldrá con mi nombre pero no quiero que la web lo
   publique»*.
2. *«Tampouco quero que sexa tan específico co que se vai medir; con dicir que se
   medirán as opcións de obter resultados do fútbol galego abonda.»*

**Ninguno de los dos es una edición de literal.** Los dos chocan de frente con
**SPEC-004**, que está `hecho` y verificada GREEN, y lo hacen contra cláusulas que
tienen test propio:

| Petición | Contra qué choca |
|---|---|
| Quitar el nombre | **CA-7** (el verificador *lee* «quen está detrás» y comprueba que **nombra a tremen.dev y a Alberto Fojo**) y **CA-8.1** (*«tremen.dev y Alberto Fojo, con el buzón…»*). Fijado en `tests/site/i18n.test.ts` caso 6 |
| Poner el enlace a tremen.dev | **CA-9/CA-10**, tal como se implementaron: `tests/site/pages.test.ts` caso 16 exige que el HTML **no lleve una sola URL absoluta** |
| Dejar de ser específico | **CA-8.2** (*«latencia, cobertura, conflictos y minutos de operación manual, sobre Terceira RFEF G1 e Preferente Futgal G1»*). Fijado en `pages.test.ts` caso 11 y en `i18n.test.ts` casos 9 y 10 |

Las specs cerradas **no se editan**: por eso esto es una spec nueva, y por eso
lleva abajo una sección que dice, cláusula a cláusula, qué queda modulado y por
qué eso no invalida el GREEN de SPEC-004.

**Y el daño de hacerlo mal está localizado.** La página no es una landing: es el
respaldo público y verificable de la carta a la RFGF, que **ya la enlaza**
(`docs/negocio/carta-rfgf-acceso.md` apunta a `/robot` y, desde hoy, también a
`/proxecto`). Si el sitio deja de nombrar a nadie **y** deja al lector sin
paraguas al que mirar ni buzón al que escribir, deja de ser verificable y se
vuelve **evasivo**, que es exactamente lo contrario de para lo que existe. Por eso
el enlace a `tremen.dev` es criterio de aceptación (CA-2) y por eso el buzón
delante es la mitad que de verdad no puede caerse (CA-3.2).

**Un hallazgo que conviene registrar, y que NO bloquea nada.**
`sdd-arquitecto` comprobó `tremen.dev` el 2026-09-01: `/`, `/contact.html` y
`/work.html` responden `200` y **no contienen ningún nombre ni ninguna
identificación**; `/legal`, `/legal.html`, `/aviso-legal.html`, `/privacy.html`,
`/privacidad.html` y `/terms.html` responden **`404` las seis**. Es decir, la
frase *«allí ya aparece mi nombre en los textos legales»* **hoy no describe el
sitio**. Importa dejarlo escrito para que nadie construya encima de ella creyendo
que es un hecho; **no importa como condición**, porque no lo era: era una
suposición al pasar. El requisito es uno solo —*el nombre no sale en
`marcador.gal`*— y no depende de que tremen.dev publique nada. **Por eso ADR-012
no se apoya en esa premisa**: el enlace a `tremen.dev` es el paraguas y basta con
que **resuelva**; lo que compensa la retirada del nombre es **el buzón**.

**Y la carta no impone ningún orden.** Sale firmada por Alberto Fojo con nombre y
`ola@tremen.dev`: la RFGF sabrá exactamente quién escribe por la propia carta.
Nada de esto espera a nada.

Reglas implicadas: **D-1** (no somos sucesión de nadie; su lista negra **se
conserva intacta**), **D-2** (galego por defecto, literales en i18n) y **RN-11**,
que aquí es la regla que más peso carga: pide **dónde quejarse, no dónde
navegar**, y con el nombre fuera el buzón pasa a ser lo único que la cumple.
Sigue cumplida, y por eso CA-3.2 la escribe como criterio en vez de darla por
supuesta.

## Usuarios / roles afectados

- **El técnico de la RFGF.** Sigue siendo el público objetivo y sigue siendo una
  persona. Es quien va a abrir `/proxecto` desde la carta y quien decide si esto
  es serio. Todo lo que aquí se quita tiene que seguir dejándole una respuesta.
- **Alberto Fojo**, que pide el cambio. **No le queda ninguna mitad humana
  bloqueante**: a diferencia de SPEC-004 CA-1 —que esperaba a que él apuntase el
  DNS—, aquí no hay nada fuera del repositorio que tenga que ocurrir antes.
  Publicar textos legales en `tremen.dev` **no** es trabajo de esta spec ni
  condición suya; queda como riesgo escrito con disparador.
- **Quien opere `tremen.dev`** (Alberto), solo para lo mínimo: que el dominio siga
  respondiendo. Es lo único que CA-3.1 comprueba.
- **`/sdd-lingua`**, consultivo y **bloqueante para el cierre** (CA-7), como en
  SPEC-004 CA-12, SPEC-005 CA-12 y SPEC-006 CA-5.
- **`/sdd-legal-datos`**, consultivo y **bloqueante para el cierre** (CA-7.2),
  sobre **una pregunta acotada**: si un sitio público sin recogida de datos, sin
  cookies y sin actividad económica necesita identificar a su titular, y si el
  buzón basta. No estaba en el encargo: lo añade `sdd-arquitecto` y lo justifica
  en las notas del gate.
- **`sdd-implementador`** y **`sdd-verificador`**: el segundo tiene aquí trabajo
  que la suite no puede hacer —CA-3 se comprueba contra dos sitios vivos—.

## Diseño: tres decisiones de forma que gobiernan los CA

### 1. Sin nombre, pero con destinatario: el buzón es la mitad que no se puede romper

Lo decide **ADR-012** y esta spec no lo re-discute. El sitio no nombra a ninguna
persona física ni dice cuántas hay. Lo que compensa esa retirada **no** es que
otro sitio publique un nombre: es que **siga habiendo dónde escribir**.
`ola@tremen.dev` está hoy en `/proxecto` y en el primer bloque de `/robot`
(SPEC-005 CA-5), y con el nombre fuera pasa a ser **lo único** que satisface
RN-11, que pide *dónde quejarse, no dónde navegar*. De ahí el acoplamiento que
ADR-012 registra y que esta spec ejecuta: **quitar el nombre está bien mientras
haya una vía de contacto que se lee; quitar el nombre *y* el buzón dejaría la
página sin responsable y sin destinatario**. Por eso CA-3.2 lo escribe como
criterio propio en vez de confiar en que ningún test ajeno lo tumbe por accidente.

`tremen.dev` sigue teniendo su papel —es el paraguas bajo el que se pone el
proyecto, y un paraguas que se nombra y no se enlaza es media frase—, así que el
enlace tiene CA propio (CA-2), constante propia y un contrato escrito en la
cabecera de esa constante, con la misma forma que SPEC-004 CA-13.4 usó para el
buzón. Lo que **no** se le exige es que identifique a nadie: eso sería atar este
cambio a trabajo que nadie ha pedido.

### 2. Un `<a href>` no es una petición a un tercero

`pages.test.ts` caso 16 prohíbe **toda** URL absoluta en el HTML. Es más estricto
que el CA que dice implementar: SPEC-004 CA-10 habla de que el HTML no haga
«ninguna petición a un tercero», y un enlace no pide nada — la descarga la decide
el visitante al hacer clic, y hasta entonces no sale un solo byte hacia
`tremen.dev`. La barrera **se estrecha, no se levanta**: se sigue prohibiendo toda
URL absoluta que provoque una descarga sola, y se admite exactamente una en un
`href` de `<a>`. La forma ya existe en el repositorio y no hay que inventarla:
`tests/site/crawler-page.test.ts` (casos del final del fichero) hace justo eso
—«la única URL absoluta admitida es la nuestra»— para `/robot`.

### 3. Menos específico no es menos verdadero

Quitar los cuatro nombres de métrica y los dos nombres de competición es asumible.
**Lo que no se puede perder es la cláusula del `robots.txt`**: «respetamos el
`robots.txt` de la fuente oficial y por eso el estudio está parado». Es lo que hace
que la página **refuerce** la carta en vez de contradecirla, y costó tres vueltas
de verificación (F-SPEC-004-5 y F-SPEC-004-8: dos redacciones anteriores
afirmaron hechos falsos sobre las competiciones de la propia federación
destinataria). Se conserva, y se conserva **sin volver a afirmar nada falso**:
`ceroacero.es` sirve hoy **las dos** competiciones
(`docs/epicas/EPIC-001-spike-ingesta/hallazgos/fontes-capturables.md:34-35`, 50
nombres de equipo en cada una), y lo que no es capturable es **la fuente oficial
de ambas** (`futgal.es`, ADR-008 §1). Al dejar de nombrar las competiciones, el
referente pasa a ser «las competiciones que se quieren medir», que sigue
abarcándolas a las dos: **la barrera contra el subconjunto se conserva y se
amplía**, no se relaja.

## Criterios de aceptación

- **CA-1 (el sitio no nombra a ninguna persona, ni dice cuántas son)**: Dado
  **todos** los espacios de nombres de los dos bundles —`site`, `crawler` y
  `titles`— y el HTML servido de las cuatro rutas del sitio, cuando corre la
  suite, entonces no aparece `Alberto` ni `Fojo` en ninguna grafía ni
  capitalización, ni ninguna fórmula que declare **cuántas** personas hay detrás o
  bajo qué forma jurídica: al menos *unha soa persoa, una sola persona, por conta
  propia, por cuenta propia, autónomo, autónoma, non hai empresa, no hay empresa,
  nin equipo, ni equipo*. La barrera se escribe sobre los bundles **enteros** y no
  solo sobre `about`, para que el nombre no reaparezca en `/robot` ni en un título
  el día que alguien redacte allí. **La lista negra de D-1 (CA-7 de SPEC-004, caso
  5 de `i18n.test.ts`) se conserva exactamente como está**: lo que esta spec
  modula es la lectura sobre el nombre, no la prohibición de presentarse como
  sucesión. Y el verificador **lee** «quen está detrás» y comprueba que dice quién
  responde del proyecto —tremen.dev— sin nombrar a nadie y sin insinuar tamaño.

- **CA-2 (el paraguas se nombra y se enlaza: el enlace es estructural)**: Dado
  `/proxecto` y `/es/proxecto`, cuando se renderizan, entonces:
  1. la sección «quen está detrás» contiene un **`<a href>` real** —no texto
     plano, no un `mailto:`— a la URL de identidad de `tremen.dev`, con su
     **etiqueta visible tomada de una clave de i18n** de los dos bundles (D-2), y
     `about` sigue nombrando `tremen.dev` en prosa;
  2. esa URL sale de **una sola constante** de `src/site/`. **No puede vivir en
     `src/site/contact.ts`**: el caso 4 de `tests/site/contact.test.ts` exige que
     ese módulo exporte `MAILBOX` y nada más, y romperlo sería tumbar una barrera
     de SPEC-004 en vez de modularla. No es una dirección de correo, así que no
     entra en el escaneo de CA-13.3;
  3. la **cabecera de esa constante lleva escrito el contrato**, en la línea que
     alguien va a editar: *esta página no nombra a ninguna persona (CA-1), así que
     el paraguas al que se acoge tiene que poder mirarse; si este enlace se cae,
     el que responde es el buzón, y el buzón no se toca* (ADR-012 §2 y §3). Un
     test lo comprueba, como el caso 3 de `contact.test.ts` comprueba el contrato
     de migración del buzón;
  4. la barrera de URL absolutas **se estrecha**: ninguna URL absoluta aparece en
     un atributo que provoque una descarga por sí solo —`src`, `srcset`, `<link
     href>`, `url(...)` en la hoja de estilo—, y la **única** admitida en el HTML
     es la de esta constante, dentro de un `href` de `<a>`. Sustituye al caso 16
     de `pages.test.ts`; forma y precedente, los casos finales de
     `crawler-page.test.ts`.

- **CA-3 (el paraguas resuelve, y el buzón sigue delante)**: Dado el sitio ya
  desplegado, cuando el verificador cierra la spec, entonces comprueba y **anota
  en el ledger, con URL y fecha**:
  1. que `/proxecto` y `/es/proxecto` responden `200` y sirven el enlace, y que la
     **URL enlazada responde `200`**. Nada más sobre ella: que resuelva es lo
     comprobable y lo suficiente —un paraguas que es un enlace roto no es un
     paraguas—, y **no se exige que esa página identifique a nadie**. Exigirlo
     ataría este cambio a que alguien escriba y publique un aviso legal, que es
     trabajo que nadie ha pedido y que bloquearía lo que sí se ha pedido;
  2. que **el buzón sigue delante**: `ola@tremen.dev` aparece como enlace
     `mailto:` en `/proxecto` y `/es/proxecto` —desde la constante única de
     SPEC-004 CA-13, interpolado, nunca escrito— y sigue en el **primer bloque**
     de `/robot` y `/es/robot`, antes de cualquier otro encabezado de sección
     (SPEC-005 CA-5, que esta spec no toca y aquí re-comprueba a propósito).
     **Esta es la mitad que no puede caerse.** RN-11 pide *dónde quejarse, no
     dónde navegar*: con el nombre fuera, el buzón es lo único que la cumple, y es
     además la compensación del riesgo que Alberto aceptó en ADR-011 al sacar el
     `mailto:` de la cabecera del user-agent. **RN-11 se sigue cumpliendo sin
     nombre porque el buzón sigue delante**, y ese es el motivo de que se
     verifique aquí y no se dé por supuesto.
  Si 2 no se cumple, el CA es RED y la spec no cierra. Si falla 1, se anota y se
  arregla el enlace; no es lo mismo perder el paraguas que perder el destinatario.

- **CA-4 (qué se mide, dicho en general)**: Dado `measuring` en los dos bundles y
  el HTML servido de las dos rutas de proyecto, cuando corre la suite, entonces la
  clave dice **cuál es el objeto del estudio en términos generales** —medir las
  opciones de obtener los resultados del fútbol galego— y **no**:
  1. nombra ninguna competición: no aparecen `Terceira RFEF`, `Tercera RFEF`,
     `Preferente Futgal`, `Futgal`, `RFEF` ni `G1`;
  2. enumera las cuatro métricas: no aparecen `latencia`, `cobertura`,
     `conflitos`, `conflictos`, `operación manual` ni `operacion manual`.
  La lista negra se aplica al **espacio `site` y al HTML de las dos rutas de
  proyecto**, nunca al sitio entero: `/robot` sirve la cadena literal del
  user-agent, que contiene `medicion de latencia` (SPEC-005 CA-2), y una barrera
  global la pondría en rojo. Sustituye al caso 11 de `pages.test.ts`, que exige
  hoy exactamente lo contrario. **Nota de coherencia, no de trabajo**: al dejar de
  nombrarlas, la salvedad de SPEC-005 CA-13 —«`/proxecto` nombra las competiciones
  y por eso el test se aplica solo a `/robot`»— queda sin objeto, pero su test
  **no cambia** y sigue verde.

- **CA-5 (la cláusula del `robots.txt` se conserva, y sigue siendo verdadera sin
  nombres)**: Dado `measuring` en los dos bundles, cuando corre la suite, entonces
  sigue diciendo las tres cosas: (a) que **la fuente oficial** de las competiciones
  que se quieren medir **no se rastrea**; (b) que es **porque su `robots.txt` no lo
  permite y respetarlo es una norma del proyecto**; y (c) que **esa es una de las
  razones por las que el estudio está parado**. Sin nombrar a ningún tercero
  —ni `futgal`, ni `ceroacero`, ni `besoccer`, ni `rfgf`— y **sin restringirlo a un
  subconjunto**: lo que no es capturable es la fuente oficial **de todas** las
  competiciones del estudio, no la de una. La barrera de F-SPEC-004-8 (caso 9 de
  `i18n.test.ts`, lista `NOT_MEASURING_YET`) **se conserva y se amplía** con las
  formas que la redacción nueva hace posibles —al menos *dunha das competicións, de
  una de las competiciones, dunha competición, de una competición*—. El caso 10
  cambia sus fragmentos exigidos: `das duas competicions` / `de las dos
  competiciones` deja de ser exigible porque las competiciones ya no se nombran, y
  lo que se exige pasa a ser `a fonte oficial` / `la fuente oficial` + `robots.txt`
  + un referente que abarque **todo** el objeto del estudio.

- **CA-6 (el perímetro del cambio, enumerado; todo lo demás sigue verde)**: Dado
  el cambio, cuando termina, entonces:
  1. `npm run test`, `npm run typecheck` y `npm run lint` pasan **enteros**;
  2. acotado a `tests/`, el diff toca **exclusivamente** `tests/site/pages.test.ts`
     (casos **11** y **16**) y `tests/site/i18n.test.ts` (casos **6**, **9** y
     **10**). Ningún otro fichero de test se modifica, y dentro de esos dos ningún
     otro caso. **Cualquier otro test que se ponga rojo es un RED y una vuelta al
     arquitecto, no una excepción añadida a mano.** Es la misma cláusula que
     SPEC-006 CA-4.2, con la diferencia que justifica esta spec: allí el cambio era
     aditivo y no podía tocar ningún test ajeno; aquí **modula criterios
     verificados**, y por eso la autorización para tocarlos es explícita, nominal y
     está acotada a cinco casos;
  3. acotado a `src/`, el diff toca **solo** `src/i18n/gl.ts`, `src/i18n/es.ts`
     (clave `site`), `src/i18n/site-bundle.ts` (la clave nueva de CA-2.1),
     `src/site/project-page.tsx` y el módulo de la constante de CA-2.2.
     **`src/mirror/` no se toca** —ni una línea—, y tampoco los espacios `crawler`
     y `titles`;
  4. el HTML servido de `/robot` y `/es/robot` es **idéntico** al de hoy.
     Precedente exacto de la comprobación: SPEC-006 CA-4.3, con `git archive` y
     **sin `checkout`**;
  5. **`docs/negocio/carta-rfgf-acceso.md` no se modifica.** La carta sigue siendo
     verdadera después del cambio: dice que en `/proxecto` está «quen hai detrás
     disto e que se vai medir», y ahí seguirá estando —tremen.dev, con enlace— y
     seguirá diciéndose qué se mide, en general. Y la carta va **firmada con
     nombre y correo**, así que la RFGF sabe quién escribe: anonimizar la web no
     anonimiza al remitente (ADR-012 §4). Además, tocarla pondría en riesgo el
     test de SPEC-005 CA-8, que la lee.

- **CA-7 (dictámenes bloqueantes para el cierre)**: Dado el texto nuevo, cuando la
  spec pide pasar a `hecho`, entonces el ledger contiene **los dos**:
  1. el **dictamen de `/sdd-lingua`**, con fecha, sobre el texto **íntegro** de las
     claves nuevas y modificadas en las dos lenguas —no sobre una muestra—, con
     cada corrección aplicada o justificada una a una. Misma cláusula que SPEC-004
     CA-12, SPEC-005 CA-12 y SPEC-006 CA-5, y por la misma razón: es texto visible
     al usuario (D-2) y lo va a leer una federación;
  2. el **dictamen de `/sdd-legal-datos`**, sobre **una pregunta acotada** y no
     sobre el aviso legal de nadie: *¿un sitio público **sin recogida de datos,
     sin cookies y sin actividad económica** —que es exactamente lo que SPEC-004
     CA-6, CA-9 y CA-10 dejan comprobado y con test— necesita identificar a su
     titular, y basta el buzón como vía de contacto?* Lo que se somete a juicio
     es el par «paraguas enlazado + buzón delante». **No** se le pregunta por
     `tremen.dev`, que es otro sitio y no es de esta spec. Si dictamina que hace
     falta identificación en el propio sitio, **el cambio vuelve al arquitecto** y
     se supersede ADR-012; no se parchea a mano.
  Sin los dos, la spec no cierra.

## Cláusulas de SPEC-004 que quedan moduladas, y por qué su GREEN sigue valiendo

SPEC-004 está `hecho` y **no se edita**. Lo que sigue es la lista completa de lo
que esta spec cambia de ella, para que nadie tenga que deducirlo del diff.

| Cláusula de SPEC-004 | Qué queda modulado | Por quién |
|---|---|---|
| **CA-7**, segunda mitad: el verificador lee «quen está detrás» y comprueba que **nombra a tremen.dev y a Alberto Fojo** | Sigue leyéndolo y sigue comprobando **tremen.dev**; deja de exigir **Alberto Fojo** y pasa a exigir lo contrario: que no aparezca ninguna persona (CA-1). **La lista negra de D-1 no se toca** | CA-1 |
| **CA-8.1**: «tremen.dev **y Alberto Fojo**, con el buzón de contacto como `mailto:` tomado de la constante única de CA-13» | Cae «y Alberto Fojo». **Todo lo demás se conserva**: el buzón sigue como `mailto:` interpolado desde la constante única (caso 10 de `pages.test.ts` y caso 8 de `i18n.test.ts` siguen verdes), y el límite de tres o cuatro frases sigue vigente y sin tocar (caso 7) | CA-1, CA-2 |
| **CA-8.2**: «latencia, cobertura, conflictos y minutos de operación manual, **sobre Terceira RFEF G1 e Preferente Futgal G1**» | Se sustituye por el enunciado general. La cláusula deja de exigir la enumeración y pasa a prohibirla | CA-4 |
| **CA-9/CA-10** tal como se implementaron en el caso 16: «no lleva una sola URL absoluta» | Se estrecha a «ninguna URL absoluta que provoque una descarga por sí sola», con **una** excepción nominal en un `href` de `<a>` | CA-2.4 |

**Por qué esto no invalida el GREEN de SPEC-004.** Tres razones, y las tres
importan:

1. **Un GREEN es un hecho fechado, no una promesa perpetua.** El ledger de
   SPEC-004 dice que el 2026-08-31 el sitio cumplía sus criterios, y eso siguió
   siendo cierto: nadie ha encontrado un defecto en lo verificado. Lo que ha
   cambiado no es el veredicto, es **el requisito**, y lo ha cambiado su dueño.
   Reabrir SPEC-004 para reescribir sus CA sería falsificar el registro de lo que
   se aprobó y se comprobó aquel día.
2. **Ninguna de las cuatro modulaciones toca la razón de ser de su CA.** CA-7
   existe por **D-1** —no presentarse como sucesión de marcadorgalego.gal— y su
   lista negra se conserva intacta; lo que se modula es una comprobación de
   identidad que viajaba de prestado dentro de ella. CA-8.1 existe para que la
   sección no se convierta en un relato; su límite de longitud sigue en pie.
   CA-10 existe para que no haya rastro del visitante ni terceros cargados sin su
   permiso; después del cambio sigue sin salir un byte hacia nadie hasta que el
   visitante hace clic.
3. **Lo que se pierde está compensado y escrito.** El nombre sale de la página,
   pero la página no se queda sin responsable ni sin destinatario: sigue diciendo
   bajo qué paraguas está —enlazado, y CA-3.1 comprueba que resuelve— y sigue
   llevando el buzón delante, que CA-3.2 verifica y que es lo que mantiene RN-11
   cumplida. La especificidad sale del texto pero no del proyecto: sigue entera en
   la carta, que es donde tiene destinatario, y la carta va firmada con nombre y
   correo.

**Y una cláusula de CA-8 que este cambio no rompe, sino que cumple mejor**: «el
sitio **no dice nada más**». Los dos cambios quitan contenido. La única adición es
el enlace de CA-2, y existe precisamente para que la resta no deje un hueco.

## Entidades y reglas afectadas

- **ADR-012** — es la decisión que esta spec ejecuta. Lo que la spec no puede
  decidir sola: el criterio vale para **todo** el sitio presente y futuro, no
  solo para `/proxecto`.
- **D-1** y **D-2** de `FOUNDATION.md` (locked). Ninguna se reinterpreta: D-1
  conserva su barrera entera y D-2 se cumple igual, con los literales nuevos en
  los bundles.
- **RN-11** de `docs/fundacion/reglas.md`: el buzón visible con quien reclamar. Es
  la regla que **más peso carga** después de este cambio, porque con el nombre
  fuera el buzón es lo único que la sostiene. No se toca, se re-comprueba
  (CA-3.2), y **SPEC-005 CA-5** —el `mailto:` en el primer bloque de `/robot`,
  única compensación del riesgo aceptado en ADR-011— sigue vigente y verde.
- **ADR-008 §1** y `hallazgos/fontes-capturables.md`: son la fuente del hecho que
  CA-5 obliga a seguir diciendo sin nombres.
- **ADR-010**: las URL no se mueven. Esta spec **no crea, no mueve y no retira
  ninguna ruta**.
- No toca `src/model/`, `src/db/`, `src/raw/`, `src/mirror/` ni `migrations/`.
  Cero migraciones, cero estado.

## Fuera de alcance

- **El propio `tremen.dev`.** Publicar allí textos legales o una identificación es
  acción humana fuera de este repositorio, **no es condición de esta spec y no la
  bloquea**: CA-3.1 solo comprueba que la URL enlazada responde. Queda como
  **riesgo escrito con disparador**, abajo.
- **Cambiar la carta a la RFGF.** Sigue siendo verdadera y sigue firmada con
  nombre y correo (CA-6.5).
- **`/robot`, el user-agent y `src/mirror/`.** Son SPEC-005 y siguen como están.
  CA-1 alcanza al bundle `crawler` solo como barrera preventiva: hoy no contiene
  ningún nombre, así que no hay texto que cambiar allí.
- **Un aviso legal propio en `marcador.gal`.** Es la alternativa que ADR-012 deja
  escrita por si `/sdd-legal-datos` la exige; hoy no está pedida y no se
  construye.
- **La landing de `marca.md`**, la identidad visual, la analítica y cualquier dato
  de fútbol. Igual que en SPEC-004, y por las mismas razones.
- **Añadir CI, o un test que vigile que `tremen.dev` sigue identificando.** Es la
  consecuencia negativa que ADR-012 registra y su destino es **EPIC-MEJORA**, no
  esta spec: un test que dependa de la red de un tercero es un rojo intermitente
  en una suite sin CI que nadie está mirando.

## Notas para el gate humano

1. **El cambio se despliega al mergear: el sitio está en producción.** No hay
   entorno intermedio donde verlo antes. Lo que se apruebe aquí es lo que un
   técnico de la RFGF va a leer, y la carta ya apunta a esa dirección. Es también
   la razón de que CA-3 sea bloqueante: no hay ventana entre «lo aprobamos» y «lo
   ve todo el mundo».
2. **Nada de esto espera a nada, y en particular no espera a tremen.dev.** El
   requisito es uno —tu nombre no sale en `marcador.gal`— y se cumple entero
   dentro de este repositorio. La única mitad viva fuera es trivial: que
   `tremen.dev` siga respondiendo (CA-3.1). **Riesgo escrito, con disparador, y no
   bloqueante**: hoy `tremen.dev` no te nombra ni publica textos legales
   —comprobado el 2026-09-01: `/`, `/contact.html` y `/work.html` sin
   identificación, y `/legal`, `/legal.html`, `/aviso-legal.html`, `/privacy.html`,
   `/privacidad.html`, `/terms.html` en `404`—, así que el paraguas es hoy un
   nombre de dominio y poco más. *Disparador: el día que quieras que el nombre sea
   recuperable a un clic —o el día que `/sdd-legal-datos` lo pida—, la
   identificación se publica allí y esta página no cambia ni una línea, porque el
   enlace ya está puesto.* Destino del finding: **EPIC-MEJORA**.
3. **Lo que de verdad no puede caerse es el buzón, y por eso lo he subido a CA.**
   Con tu nombre fuera, `ola@tremen.dev` es **lo único** que deja a un operador
   dónde quejarse, que es literalmente lo que pide RN-11. Ya estaba protegido por
   SPEC-005 CA-5 y por el caso 10 de `pages.test.ts`, pero esas dos barreras
   protegen otra cosa y podrían relajarse mañana sin que nadie recordara que este
   cambio se apoyaba en ellas. CA-3.2 lo dice en voz alta: **RN-11 se sigue
   cumpliendo sin nombre porque el buzón sigue delante.** Si alguna vez se quiere
   mover el buzón, esta spec es una de las razones que hay que releer antes.
4. **He añadido un dictamen bloqueante que no me pediste: `/sdd-legal-datos`
   (CA-7.2).** El motivo: dejar de identificar al titular de un sitio público
   accesible desde España no es una decisión de redacción, y este proyecto ya
   tiene la costumbre de preguntar antes en vez de después (ADR-008 nació así). La
   pregunta va **acotada**: si un sitio **sin recogida de datos, sin cookies y sin
   actividad económica** necesita identificación del titular, y si el buzón basta.
   No se le pregunta por `tremen.dev`. Espero que sea barato; no soy la autoridad.
   **Si dictamina que hace falta identificación en el propio sitio, el cambio
   vuelve al arquitecto**: la salida escrita es un aviso legal propio en
   `marcador.gal`, y eso supersede ADR-012 con otro ADR.
5. **Lo que pierdes a sabiendas, dicho una vez.** «Non hai empresa nin equipo
   detrás: unha soa persoa traballando por conta propia» era la frase que más
   confianza compraba por menos palabras, y sale entera —no por el nombre, sino
   por el «ni uno ni mil» de tu propia petición—. Y con los cuatro nombres de
   métrica se va también la única señal de que hay un método detrás. Las dos
   pérdidas están dentro de lo que pediste; quedan escritas para que no se lean
   luego como un descuido de redacción.
6. **Lo que decidí conservar, y por qué.** La cláusula del `robots.txt` se queda
   (CA-5): «la fuente oficial no se rastrea, respetamos su `robots.txt` y por eso
   el estudio está parado» es lo que hace que la página **refuerce** la carta. Sin
   nombrar competiciones el referente pasa a ser «las competiciones que se quieren
   medir», que sigue siendo verdad para las dos —`ceroacero.es` sirve ambas; lo no
   capturable es la fuente oficial de ambas— y **la barrera contra la recaída de
   F-SPEC-004-8 se amplía en vez de relajarse**.
7. **La autorización para tocar cinco casos de dos ficheros de test de SPEC-004 es
   la parte incómoda de esta spec, y está acotada a propósito** (CA-6.2). SPEC-006
   pudo prometer que no tocaba ni un test ajeno porque solo añadía; aquí se cambia
   lo que se exige, y esconderlo detrás de tests nuevos que conviven con los viejos
   sería peor: quedarían dos criterios contradictorios verdes a la vez.
8. **Alcance.** Siete CA para dos cambios de contenido puede parecer mucho. Tres
   de los siete (CA-3, CA-6, CA-7) no describen contenido: describen **cómo se
   comprueba que no se rompe nada** en una spec que modifica material verificado y
   desplegado. El contenido en sí son CA-1, CA-2, CA-4 y CA-5.
