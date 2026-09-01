---
id: ADR-015
tipo: adr
estado: borrador
historial:
  - {estado: borrador, fecha: 2026-09-01, por: sdd-arquitecto}
---
# ADR-015: Qué pasa cuando una decisión posterior invalida un CA de una spec cerrada

- Deciders: propone `sdd-arquitecto` el 2026-09-01, ejecutando el encargo de
  Alberto Fojo de **registrar la enmienda de SPEC-005 CA-10**. El encargo pedía
  el registro y dejaba abierta la forma; esta es la mitad general de la
  respuesta, y la nota de enmienda en el ledger de SPEC-005 es la mitad
  concreta. **Aprueba: pendiente de gate humano.** Nace en `borrador` y ningún
  rol `sdd-*` puede firmarlo.
- Specs relacionadas: **SPEC-005** (`hecho`, EPIC-003) — el caso fundacional, su
  CA-10 es el criterio invalidado; **SPEC-008** (EPIC-002) — la spec que
  sustituye el guardián; **SPEC-002** y **SPEC-003** (`hecho`, EPIC-001) — las
  dueñas del código que ADR-014 traslada; y aguas abajo las ocho specs restantes
  de EPIC-002, que van a tocar código de EPIC-001 y de EPIC-003.
- Relacionado: **ADR-011 §6** (resuelve la otra mitad de este problema y este
  ADR se apoya en él), **ADR-014 §1** (la decisión que dispara el caso),
  `.sdd.json` (`gates.requireSpec`) y las reglas de trabajo de `CLAUDE.md`.

## Contexto

Una spec cerrada se puede quedar atrás de **dos** maneras distintas, y este
proyecto solo tiene resuelta una.

**La primera: su código cambia bajo ella.** Está decidida y funciona.
**ADR-011 §6** dice que el cambio vive en una spec nueva —ni en un ledger, que
es evidencia y no autorización, ni reabriendo la cerrada, que arrastra su
verificación entera— y que a la spec cerrada se le deben exactamente dos cosas:
que su suite siga verde y una **referencia cruzada en su ledger**. Se ejecutó el
2026-08-31: SPEC-005 cambió `USER_AGENT`, que era código de SPEC-002, y el
ledger de SPEC-002 lleva la sección «Referencia cruzada — 2026-08-31» que lo
deja escrito. Nadie reabrió nada y nadie se quedó sin saber por qué.

**La segunda: su criterio deja de poder ser cierto.** No la ha decidido nadie.
Un CA no describe lo que el código hace: describe **lo que se comprobó**. Cuando
una decisión posterior lo vuelve falso, el CA se queda afirmando, dentro de un
artefacto verificado GREEN, algo que ya no es verdad — y no hay dónde ponerlo,
porque el cuerpo de la spec es un contrato firmado que no se reescribe y el ADR
que lo invalida ya es inmutable cuando alguien se da cuenta.

**El caso fundacional, con nombre y fecha.** SPEC-005 **CA-10** exigía que el
cambio del user-agent fuera de **un solo fichero** dentro de `src/mirror/`, y lo
ató a un guardián concreto: el caso 15 de `tests/mirror/user-agent.test.ts`
hacía `git diff --name-only main -- src/mirror/` y fallaba si aparecía cualquier
fichero distinto de `src/mirror/user-agent.ts`. Era la mecanización de la
frontera de ADR-011 §6: lo que separa «alinear una cadena» de «reabrir una spec
cerrada».

**ADR-014 §1** (aprobado el 2026-09-01) manda lo contrario por decisión firmada:
la cortesía RN-11 sale de `src/mirror/` a `src/polite/`, y ese traslado toca el
directorio entero **a propósito**. La aserción no puede sobrevivir, y
reapuntarla a `src/polite/` tampoco la salva: listaría los módulos nuevos y
fallaría igual.

**Y ADR-014 no lo vio.** Su sección de consecuencias negativas es cuidadosa —
nombra las dos specs `hecho` cuyo código traslada, y hasta la única línea de
EPIC-003 que cambia de `import`— pero **no dice que un CA de SPEC-005 deje de
ser satisfacible**. Lo descubrió el implementador de SPEC-008, después, con el
test en rojo. Esa es la forma normal del hallazgo, y es la razón de que la
obligación no pueda recaer solo sobre quien decide.

**Por qué esto es la peor clase de drift.** Un artefacto verificado no es
código: ninguna suite se pone roja cuando una spec `hecho` empieza a mentir. Y
`hecho` es terminal, así que nadie tiene motivo para releerla. La afirmación
falsa se queda dentro del artefacto que precisamente sirve para dar fe.

**Por qué va a repetirse.** ADR-014 acaba de mover `src/mirror/` entero, EPIC-002
tiene ocho specs por delante y varias tocan código de EPIC-001 y de EPIC-003.
Van dos ocurrencias de esta familia en tres días.

## Decisión

### 1. El cuerpo de una spec cerrada no se edita. Nunca

Igual que un ADR aceptado. El texto de los CA es el contrato contra el que se
emitió un veredicto y contra el que una persona firmó una fecha; reescribirlo
deja el GREEN citando algo que ya no está escrito, y borra la diferencia entre
«esto se aprobó» y «se aprobó algo parecido», que después no se reconstruye.
`hecho` es terminal, y terminal alcanza también al texto.

### 2. La enmienda se escribe en el **ledger** de la spec cerrada, bajo un encabezado de nombre fijo

```
## Enmienda — <fecha>: <qué la invalida>
```

Es el sitio correcto por la definición que ya tiene el artefacto: un ledger es
**evidencia de verificación** (ADR-011 §6), y una enmienda es exactamente eso —
una nota sobre el **alcance** de un veredicto ya emitido. No autoriza nada, no
toca código, no reabre nada, y por tanto no roza la frontera que ADR-011 §6
protege. El precedente existe y funcionó: «Referencia cruzada — 2026-08-31» en
el ledger de SPEC-002.

El encabezado es literal a propósito: `grep -rn "^## Enmienda —" docs/epicas/`
**es** el índice. No hay registro que mantener ni fichero que sincronizar, y por
tanto no hay índice que se quede viejo.

### 3. Qué tiene que decir, entero: cinco puntos

1. **Qué afirmaba el CA y por qué era razonable** cuando se escribió. Sin esto la
   enmienda se lee como la corrección de un error, y no lo es.
2. **Qué lo invalida**, citado por número —ADR, spec y sección—.
3. **Con qué se sustituye, si con algo, y si la red que queda es menor**, dicho
   sin suavizar. Este es el punto que se pierde cuando se escribe deprisa, y es
   el único que le dice a un lector futuro que ahí hay **menos** red que antes.
4. **Si el veredicto sigue en pie, y por qué.** Un GREEN anotado se lee como un
   GREEN dudoso si nadie dice lo contrario.
5. **Qué lo despierta**: bajo qué condición concreta habría que recuperar un
   guardián equivalente. Una enmienda sin condición de despertar es un cierre
   disfrazado de nota.

### 4. El estado del artefacto no cambia

Una enmienda no reabre, no degrada, no reverifica y no toca el frontmatter.
`hecho` sigue siendo `hecho`. Si el trabajo que la provoca necesita código, ese
código entra por la spec nueva (ADR-011 §6) y es **esa** spec la que responde de
él ante su propio verificador.

### 5. Quien invalida, registra — y quien lo detecta después, también

La responsabilidad primaria es del autor de la decisión que invalida: un ADR o
una spec que vuelva falso un CA ajeno lo dice en sus consecuencias y **nombra el
CA por su identificador**. Es barato en el momento de decidir y caro tres días
después. ADR-014 no lo hizo, y por eso este ADR existe.

Pero la obligación no se agota ahí, porque la detección tardía es el caso normal
—aparece como un test en rojo en la rama de otro— y la decisión original ya es
inmutable cuando se descubre. **Quien lo detecta escribe la enmienda**, sin
esperar a que nadie corrija nada, y sin que eso cuente como enmendar el ADR.

### 6. Lo que este ADR no hace

No crea un estado nuevo, ni un artefacto nuevo, ni un rol, ni un gate, ni una
obligación de reverificar. Y no convierte el ledger en autorización de cambio:
ADR-011 §6 queda entero.

## Consecuencias

### Positivas

- **El drift dentro de artefactos verificados deja de ser invisible.** Pasa a
  tener un sitio fijo, un formato y un `grep` que lo encuentra.
- **Queda escrita la diferencia entre «se verificó mal» y «cambió el mundo
  alrededor».** Sin decirlo, toda anotación posterior a un GREEN lo debilita.
- **El coste es una sección de markdown.** Nada que mantener, nada que
  sincronizar, ningún índice que envejezca.
- **Le pone un deber concreto al que decide**: nombrar el CA que rompe. Habría
  ahorrado el descubrimiento por test rojo de esta semana.
- **Sirve inmediatamente**, y no solo en abstracto: EPIC-002 va a tocar código de
  dos épicas cerradas y ya sabe dónde escribir lo que rompa.

### Negativas / follow-ups

- **Un ledger de una spec `hecho` se relee todavía menos que la spec.** Es la
  objeción de peso contra esta decisión y va dicha entera: quien abra SPEC-005 y
  lea CA-10 **no verá la enmienda** si no abre el fichero de al lado. Se mitiga
  con el encabezado de nombre fijo y con que la spec invalidante cite el CA; **no
  se elimina**. La única alternativa que la eliminaría es editar el cuerpo de la
  spec, y cuesta más de lo que arregla (§Alternativas).
- **Nada obliga mecánicamente a escribir la enmienda.** No hay test que se ponga
  rojo cuando un CA cerrado se vuelve falso: es la clase de defecto que este ADR
  **nombra** y no la que resuelve. Sigue siendo disciplina; lo que aporta es un
  sitio donde ejercerla y un formato que impide escribirla a medias.
- **No cubre el caso en que el veredicto ya no se sostenga.** Este ADR trata el
  caso en que el GREEN sigue en pie y solo cambió el mundo alrededor. Si algún
  día una decisión posterior revela que la **verificación fue mala**, eso no es
  una enmienda: es un hallazgo, y hoy no hay política. Queda abierto a propósito
  — no hay ningún caso, y decidir sin caso es inventar.
- **Riesgo de que se use para decidir menos.** Ninguna decisión de arquitectura
  debe evitarse por no querer escribir la enmienda que provoca. Si alguna vez
  alguien argumenta eso, este ADR está mal y hay que superseder.

## Alternativas consideradas

- **Editar el cuerpo de la spec cerrada, con la enmienda marcada y fechada.** Es
  la opción **más visible**, y por eso hay que rechazarla con motivo y no por
  reflejo. Rechazada por tres razones independientes: (a) **deja el veredicto
  huérfano** — la fila CA-10 del ledger de SPEC-005 cita el caso 15 de un test
  que el contrato enmendado ya no pediría, y ninguna de las dos versiones
  explicaría a la otra; (b) **reescribe lo que una persona firmó con fecha**, y
  la diferencia entre «Alberto aprobó esto» y «Alberto aprobó algo parecido» no
  se reconstruye después; (c) `hecho` es terminal, y la inmutabilidad del texto
  es lo que hace que un veredicto signifique algo — la misma razón exacta por la
  que un ADR aceptado no se edita.
- **Solo la nota en el ledger, sin ADR.** Resuelve el caso de hoy entero y es
  barata. Rechazada por **insuficiente, no por incorrecta**: van dos ocurrencias
  de esta familia en tres días —SPEC-005 sobre el código de SPEC-002, ADR-014
  sobre el criterio de SPEC-005— y quedan ocho specs de EPIC-002 que van a tocar
  código de EPIC-001 y de EPIC-003. Sin regla escrita, el tercer caso lo resuelve
  quien esté de turno, con otro criterio y probablemente peor.
- **Solo el ADR, sin nota.** Rechazada por lo contrario: un ADR es una **regla**,
  no un **registro**. La enmienda de SPEC-005 CA-10 es un hecho de hoy y tiene
  que estar donde la busca quien lee SPEC-005, no donde la busca quien lee el
  índice de ADRs. Y este ADR nace en `borrador`: si fuera el único registro, la
  enmienda no existiría hasta que alguien lo firme.
- **Un artefacto nuevo: un registro central de enmiendas.** Rechazada por coste y
  por experiencia propia de este repositorio: sería un índice mantenido a mano, y
  aquí los índices a mano se quedan viejos — `docs/tablero.md` se generó por
  script justo por eso. Un encabezado de nombre fijo da el mismo índice sin
  mantenerlo.
- **Reabrir la spec cerrada y reverificarla contra el mundo nuevo.** Rechazada
  por desproporción, y por la misma razón por la que ADR-011 §6 la rechazó para
  SPEC-002: arrastra la verificación entera de una spec **cuyo problema no ha
  cambiado**. SPEC-005 sigue respondiendo de que la página y la cadena no puedan
  divergir, y eso sigue siendo cierto después de ADR-014.
- **Un estado nuevo (`enmendada`), o marcar la spec como `bloqueada`.**
  Rechazada: un estado entra en el frontmatter, en `valida.mjs`, en el tablero y
  en los roles que los leen, para expresar algo que una sección de markdown ya
  expresa. Y `bloqueada` diría algo falso: SPEC-005 no está bloqueada, está
  cerrada y anotada.

<!-- REGLA: un ADR aceptado es INMUTABLE. Para cambiar la decisión, escribe otro ADR que lo supersede (estado del viejo -> bloqueada + nota "superseded por ADR-NNN"). -->
