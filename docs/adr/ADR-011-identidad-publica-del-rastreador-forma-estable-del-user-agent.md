---
id: ADR-011
tipo: adr
estado: borrador
historial:
  - {estado: borrador, fecha: 2026-08-31, por: sdd-arquitecto}
---
# ADR-011: Identidad pública del rastreador: forma estable del user-agent

- Deciders: propone `sdd-arquitecto`. **La forma exacta de la cadena la decidió
  Alberto Fojo el 2026-08-31**, al abrir EPIC-003 preguntando «¿es buena idea
  enviar a la RFGF algo a tan bajo nivel?». Este ADR registra esa decisión y sus
  razones. **El riesgo residual de §Consecuencias —que el buzón deje de viajar en
  la cabecera— se le presentó por separado y lo aceptó explícitamente el
  2026-08-31**, con SPEC-005 CA-5 como única compensación; ese mismo día decidió
  también que el buzón de hoy es provisional (§4). **Aprueba: Alberto Fojo.**
- Specs relacionadas: **SPEC-002** (`hecho`), dueña original de
  `src/mirror/user-agent.ts`; **SPEC-005** (EPIC-003), que ejecuta el cambio;
  **SPEC-004**, que hace que la URL resuelva. Aguas abajo, los adaptadores de
  EPIC-002 heredan la cadena.
- Relacionado: **RN-11**, **ADR-008 §1**, **ADR-010** (despliegue compartido, que
  es lo que permite el punto 5), y la salvedad **F-SPEC-002-1** del ledger de
  SPEC-002, cerrada por el gate el 2026-08-31.

## Contexto

RN-11 exige un user-agent identificado. `src/mirror/user-agent.ts` lo implementa
así hoy:

```
marcador.gal/0.0.1 (+mailto:ola@tremen.dev; medicion SPEC-002, RN-11)
```

Y la carta a la RFGF afirma que enviamos esto otro:

```
marcador.gal/0.0.1 (+mailto:ola@tremen.dev; medicion RN-11)
```

**Divergen.** Pero la conclusión no es alinear la carta con el código: es al
revés, y por tres razones de peso muy distinto.

1. **De estilo:** `SPEC-002` y `RN-11` no significan nada fuera de este
   repositorio. A quien audita un log le dicen que se le ha colado una
   herramienta interna.
2. **De utilidad:** el `+` apunta a un buzón. Un buzón sirve para quejarse. El
   destinatario de la carta no quiere quejarse: quiere **comprobar**, y no hay
   dónde.
3. **Operativa, y es la decisiva:** `SPEC-002` **rota**. SPEC-003 ya existe y
   EPIC-002 traerá adaptadores bajo specs nuevas. A la RFGF se le pide que
   escriba `User-agent: marcador.gal` en su `robots.txt` —una línea que queda
   pública y auditable **en el servidor de otro**— y nuestro propósito declarado
   seguiría el número de la spec de turno. Una identidad que no se queda quieta
   no se puede pedir que la escriban.

Dos hechos más, comprobados el 2026-08-31, y que cambian lo que es posible:

- **El emparejamiento usa solo el token de producto.**
  `src/mirror/capture/robots.ts:37` hace `userAgent.split('/')[0]` →
  `marcador.gal`. Lo que venga después del `/` **no participa** en si un
  `robots.txt` ajeno nos permite o no. Cambiar el propósito es, técnicamente,
  gratis.
- **La razón por la que el contacto era un `mailto:` ha caducado.** El comentario
  del fichero la deja escrita: se eligió sobre una URL porque «ese dominio no
  está contratado, y un contacto que no resuelve es peor que ninguno»
  (F-SPEC-002-1, cerrado por el gate el 2026-08-31). **`marcador.gal` se contrató
  ese mismo día.**

## Decisión

### 1. La cadena

```
marcador.gal/0.0.1 (+https://marcador.gal/robot; medicion de latencia)
```

Aprobada por Alberto Fojo el 2026-08-31. Se construye componiendo
`USER_AGENT_PRODUCT` y `USER_AGENT_VERSION`, de modo que **la versión no queda
congelada**: subir de `0.0.1` no rompe nada. `0.0.1` se mantiene hoy porque es
honesta y encaja con el «aínda sen publicar» de la carta.

`USER_AGENT_PATTERN` **no cambia**: ya acepta `https?://` además de `mailto:`.

### 2. El token de producto está congelado

`marcador.gal` es la clave por la que emparejan los `robots.txt` de terceros.
Cambiarlo invalida en silencio cada línea que alguien haya escrito para
nosotros. **Solo otro ADR puede cambiarlo.**

### 3. El propósito no lleva identificadores del repositorio, ni nada que rote

Prohibidos en la cadena: `SPEC-`, `RN-`, `EPIC-`, `ADR-`, y cualquier
identificador cuya vida sea más corta que la del proyecto. El propósito se dice
en palabras llanas, **en ASCII**: los valores de campo de cabecera HTTP están
definidos sobre US-ASCII, y una tilde ahí viaja como bytes opacos. De ahí
`medicion` sin tilde, que es una decisión de transporte y no un descuido de
ortografía. El galego con sus tildes vive en la página, que es donde se lee.

### 4. El contacto es una URL, y la página que hay detrás lleva el buzón delante

El `+` apunta a `https://marcador.gal/robot`. **Esto solo es admisible porque esa
página lleva el buzón en su primer bloque** (SPEC-005 CA-5). RN-11 pide que un
operador tenga dónde quejarse; sustituir el buzón por una URL sin más sería una
regresión disfrazada de mejora. Lo que se hace es cumplir la misma exigencia
mejor: quien quiera quejarse tiene el correo a la vista, y quien quiera comprobar
tiene además la política escrita en prosa y en su lengua, en vez de comprimida en
un paréntesis.

`/robot` **no se mueve nunca** (ADR-010 §5): terceros la escriben en sus logs.

**Lo estable es la URL, no el buzón.** Alberto Fojo lo dijo el 2026-08-31: «de
momento será `ola@tremen.dev`, pero en producción será alguno `@marcador.gal`».
Es un hecho nuevo respecto a cuando se planteó esta decisión, y **la refuerza en
vez de debilitarla**: si el `+` llevara el correo, cada migración de buzón sería
una migración de la identidad que hemos pedido a terceros que escriban en su
`robots.txt`. Con la URL delante, el buzón se puede mover **sin tocar el
user-agent** y sin invalidar nada de lo que un tercero haya anotado. La condición
es que la dirección viva en **un solo sitio** del código (SPEC-004 CA-13), de
modo que migrarla sea una edición y no una cacería.

### 5. `USER_AGENT` es la única fuente. Nada la transcribe

Todo lo que muestre la cadena la **importa**: la página del rastreador, los tests
y cualquier interfaz futura. La carta —único documento que la cita fuera del
código, y el que ya divergió— queda cubierta por un test que lee el fichero
(SPEC-005 CA-8). El despliegue compartido de ADR-010 es lo que hace esto posible,
y esta es su razón de ser.

### 6. Dónde vive el cambio: SPEC-005, no un ledger y no una reapertura

`USER_AGENT` es código de SPEC-002, que está `hecho` y verificada GREEN. El
cambio se hace bajo una **spec propia de EPIC-003**, SPEC-005. Las dos
alternativas se descartan por motivos distintos:

- **Anotar en el ledger de SPEC-002.** Rechazado: un ledger es **evidencia de
  verificación, no autorización de cambio**. Aceptarlo abriría la vía para
  modificar código de producción sin spec aprobada, que es justo lo que
  `.sdd.json` (`gates.requireSpec`) y `CLAUDE.md` prohíben. Un atajo pequeño en
  la única regla que sostiene el resto.
- **Reabrir o enmendar SPEC-002.** Rechazado: reabrir una spec cerrada arrastra
  su verificación entera, y el cambio **no nace de su problema**. SPEC-002 existe
  para medir si dos fuentes son espejos; la cadena cambia porque una carta
  institucional necesita una identidad estable. Meterlo ahí desdibujaría de qué
  responde cada spec.

Lo que sí se le debe a SPEC-002 son dos cosas, y son CA de SPEC-005: que su suite
siga verde y que el cambio sea **de un solo fichero** dentro de `src/mirror/`
(CA-10), y una **referencia cruzada en su ledger** diciendo que la razón
registrada al cerrar F-SPEC-002-1 caducó (CA-11). Sin esa línea, quien lea el
ledger dentro de un año creerá que el `mailto:` sigue vigente.

## Consecuencias

### Positivas
- **La identidad se queda quieta**, que es la condición para pedirle a un tercero
  que la escriba en su servidor. La petición de la carta —dos líneas de
  `robots.txt`— sigue siendo válida sin tocarla nunca más.
- **Lo publicado y lo enviado no pueden divergir**: son la misma constante.
- **El `+` lleva a algo que se puede leer**, que es lo que hace la carta
  verificable en vez de creíble.
- **Cambiar la cadena pasa a doler**: SPEC-005 CA-1 la congela con una igualdad
  literal. Hoy ningún test la fija y por eso este cambio es barato; a partir de
  ahora es un compromiso público y cuesta una spec. Es el objetivo, no un efecto
  secundario.

### Negativas / follow-ups
- **RIESGO RESIDUAL, PRESENTADO Y ACEPTADO: el buzón deja de viajar en la
  cabecera.** Hoy, un operador que ve `marcador.gal` en su log tiene el correo
  delante aunque no exista ninguna web. Después, tiene una URL; si el sitio está
  caído en ese momento, no tiene nada. Es una regresión frente a lo que
  F-SPEC-002-1 protegía, y su **única** compensación es SPEC-005 CA-5 —el buzón
  en el primer bloque de `/robot`—, que solo sirve mientras la página responda.
  **No se pueden llevar los dos**: la convención del user-agent es un solo `+`, y
  dos contactos romperían `USER_AGENT_PATTERN` y la forma aprobada.

  **Se le presentó a Alberto Fojo en estos términos el 2026-08-31 y lo aceptó
  explícitamente, con CA-5 como única compensación.** Queda escrito así, y no
  entre líneas, porque dentro de un año la diferencia entre una decisión asumida
  y un descuido no se puede reconstruir de memoria: quien lea esto tiene que
  poder saber que alguien miró este coste de frente y dijo que sí.

  **Follow-up:** `/robot` es a partir de aquí una ruta cuya caída es un
  incumplimiento blando de RN-11, no una página más.

- **El buzón es provisional, y su migración es un riesgo que ningún test
  atrapa.** `ola@tremen.dev` es el valor de hoy; en producción será alguno
  `@marcador.gal` (Alberto Fojo, 2026-08-31). El día que se mueva,
  **`ola@tremen.dev` tiene que seguir leyéndose** mientras la carta ya enviada y
  los logs de terceros lo sigan citando. Si deja de leerse, RN-11 vuelve a estar
  incumplida **y ninguna suite lo detectará**: el hecho ocurre en un proveedor de
  correo, fuera de este repositorio. Es exactamente la advertencia que ya llevan
  las notas finales de `docs/negocio/carta-rfgf-acceso.md`. Lo único que el
  código puede hacer —y hace— es concentrar la dirección en una constante (SPEC-004
  CA-13) cuyo comentario lleva ese contrato escrito, para que la advertencia
  aparezca en la línea que habrá que editar. **El resto es disciplina humana, y
  este ADR no finge otra cosa.**
- **`/robot` y el dominio se vuelven infraestructura del rastreador.** Perder
  `marcador.gal` —un impago, un traslado de registrador— degrada RN-11. El
  dominio expira el **2027-08-31**.
- **`USER_AGENT_CONTACT` cambia de naturaleza** (de `mailto:` a `https:`).
  Ningún test lo fijaba y el patrón ya lo admite, pero cualquier código futuro
  que asuma un correo ahí se equivocará.
- **La cadena queda dicha en castellano-neutro** (`medicion de latencia`) en un
  proyecto que publica en galego. Es deliberado: la cabecera es ASCII y su lector
  es una máquina o un operador de cualquier sitio. **No es texto de interfaz y no
  pasa por `/sdd-lingua`.**

## Alternativas consideradas

- **Mantener `mailto:` y limitarse a quitar `SPEC-002`.** Arregla la rotación,
  que es el defecto grave, y conserva la propiedad de que el contacto funcione
  siempre. Rechazada porque deja a la carta sin sitio donde verificar lo que
  afirma, que es la mitad más útil de EPIC-003: al destinatario le sirve más
  poder comprobar que poder quejarse. **Es la salida si el gate no acepta el
  riesgo residual de arriba.**
- **Llevar los dos contactos**, `(+https://marcador.gal/robot;
  ola@tremen.dev; medicion de latencia)`. Rechazada: rompe
  `USER_AGENT_PATTERN`, se aparta de la convención de un solo `+` que siguen los
  rastreadores conocidos, y no es la forma que aprobó el humano.
- **Versionar el propósito por épica** (`medicion EPIC-003`). Rechazada: es el
  mismo defecto de rotación con una unidad más grande. Rota más despacio, pero
  rota.
- **Subir a `0.1.0` para marcar el cambio.** Rechazada: la versión describe al
  rastreador, no a la cadena, y `0.0.1` sostiene el «aínda sen publicar» de la
  carta. Además congelar la versión en un test la haría inmovible sin motivo.
- **`medición`, con tilde.** Rechazada por transporte: los valores de campo de
  cabecera HTTP se definen sobre US-ASCII.
- **Un propósito más específico** (`medicion de latencia e cobertura`). Rechazada
  por la misma razón que las anteriores: cuanto más describe el propósito, más
  probable es que deje de ser cierto. `latencia` es la métrica que no va a
  desaparecer del proyecto.
