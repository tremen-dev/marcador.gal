---
id: ADR-024
tipo: adr
estado: borrador
historial:
  - {estado: borrador, fecha: 2026-09-03, por: sdd-arquitecto}
---
# ADR-024: El panel del operador — sesión declarada sin sistema de usuarios, el vale de acción, y toda operación como `Observation` por la puerta estrecha

- Deciders: propone `sdd-arquitecto` el 2026-09-03, al escribir **SPEC-017**,
  porque el panel es **la superficie de peso 1.0 con precedencia** (RN-01) y la
  primera del proyecto que necesita saber **quién** está al otro lado sin que el
  proyecto tenga sistema de usuarios. **Aprueba: pendiente de gate humano.**
- Specs relacionadas: **SPEC-017** (la que lo ejecuta); **SPEC-015** (`hecho`; el
  precedente más cercano —una vía humana que produce `Observation` y pasa por el
  motor— y de la que este ADR toma cuatro patrones y se aparta de uno);
  **SPEC-013** (`hecho`; el motor, la puerta estrecha y la tabla `alerts` que
  nació sin bandeja a propósito); **SPEC-012** (`hecho`; las jornadas de medición
  declaradas y el patrón de ruta que autentica y falla cerrado); **SPEC-010**
  (`hecho`; el calendario declarado, que es la lista de partidos del panel);
  **SPEC-001** (`hecho`; el modelo canónico, que este ADR no toca).
- Relacionado: **ADR-004** (sin proceso vivo, sin disco, sin `LISTEN/NOTIFY`),
  **ADR-006** (instantes ISO, sin ORM, migraciones numeradas), **ADR-008 §1**
  (la fuente oficial no es capturable, que es lo que hace del panel camino
  crítico), **ADR-009 §3** (git no se purga: el precedente que prohíbe versionar
  un secreto o un mapeo), **ADR-013** (semántica visual, que obliga en cuanto se
  toque interfaz), **ADR-015** (cómo se enmienda una spec cerrada), **ADR-016**
  (la forma obligatoria de una frontera de capacidad), **ADR-017** (identidad de
  partido derivada del calendario declarado), **ADR-019 §3 y §5** (las jornadas
  declaradas y el registro append-only de los actos de una pieza), **ADR-020 §2**
  (la retención anclada a la jornada), **ADR-021 §3, §5, §6 y §8** (los dos
  disparadores, la alerta sin acuse, el cualificador derivado y las cuatro
  lecturas), **ADR-022 §1, §2, §3, §7 y §9** (el webhook, la identidad
  seudónima, la lista blanca del archivo, la llave de la jornada y la puerta
  estrecha), **ADR-025** (el suelo de interfaz), **RN-01, RN-04, RN-05, RN-06,
  RN-08, RN-10, RN-12, RN-13**, **D-2, D-3, D-6**.

## Contexto

### El panel dejó de ser administración y pasó a ser camino crítico

Con `futgal.es` fuera del conjunto capturable (ADR-008 §1) queda **una** fuente
automática, `ceroacero.es`, de peso 0.7. La segunda vía de RN-02 —dos fuentes
independientes de peso ≥ 0.7 que coinciden— está cerrada **por aritmética**: no
hay dos. La primera —peso ≥ 0.9— no la alcanza ninguna fuente automática. La
consecuencia está escrita en el roadmap, en `_epica.md` de EPIC-002 y en
`contexto.md`, y es la premisa de este documento: **nada llega a *confirmado* sin
una persona**, y de las dos personas que RN-01 nombra solo una llega a
*confirmado* —el operador, peso 1.0—, porque el corresponsal se queda en 0.8 y
publica *provisional* (RN-03).

`src/decide/roles.ts` ya le tiene el asiento puesto desde SPEC-013
(`'operador'` → `operator` → 1.0) y su propio comentario dice por qué: «el bot y
**el panel** son las dos próximas specs, y ésta es la mitad que el motor les
debe». `migrations/0006` dice lo mismo desde el otro lado: «SIN ACUSE, SIN ESTADO
"VISTA" Y SIN DESTINATARIO: la bandeja es del panel, y el panel no existe
todavía». **Lo que falta no es el sitio: es la puerta.**

### Y hay una cifra que se mide sobre esta pantalla, con un corte que puede matar el proyecto

La cuarta cifra de EPIC-002 son **los minutos de operación manual por jornada**,
con corte duro en **30 min**, y es la única de las cuatro cuyo resultado cambia la
épica siguiente: por encima, `docs/roadmap.md` dice que lo que toca es «comunidad
de corresponsales», no «producto». Esa cifra se mide **sobre este panel**. Lo que
el panel haga lento o farragoso no es una molestia de usabilidad: es el número.

Y hay una asimetría que decide una parte del diseño: **si el panel no deja
escrito el tiempo mientras la jornada ocurre, después no se reconstruye**. Las
`Observation` llevan `observed_at`, no «cuánto tardó la persona en escribirla».

### Cuatro cosas que el proyecto ya decidió y que este panel no puede reabrir

1. **RN-08 y D-3 no tienen excepción**, y `reglas.md` nombra al corresponsal para
   decir que tampoco la tiene él. El panel escribe `Observation`, nunca
   `Decision`. La capacidad de escribir `Decision` está guardada por una frontera
   de ADR-016 —`DECISION_WRITERS`, dos entradas, y un caso que afirma que son
   exactamente dos— y **el panel no puede entrar en esa lista**.
2. **RN-13**: las `Observation` no se editan. Una corrección del operador es una
   `Observation` nueva, no una enmienda. No hay `UPDATE` en ninguna parte de este
   diseño, y eso incluye «deshacer»: deshacer es corregir otra vez.
3. **RN-10 sin excepción por fuente.** `dominio.md` lo dice con el panel dentro:
   el `raw_ref` es obligatorio siempre, «incluye las correcciones hechas a mano
   desde el panel: son la observación con más poder del sistema». Una corrección
   humana sin objeto crudo detrás sería la única `Observation` del sistema que no
   se puede reproducir, y justo la que más falta haría reproducir.
4. **RN-12 y D-6.** Cada `Decision` registra su regla y sus apoyos. Un marcador
   bajado a mano cuyo **motivo** no está en ninguna parte cumple la letra y
   traiciona el propósito: «un marcador publicado siempre sabe de dónde viene».

### Y el hueco que no está decidido: cómo entra una persona

EPIC-002 deja **«usuarios» explícitamente fuera de alcance**. `src/app/` no tiene
`middleware.ts`, ni sesión, ni cookie, ni nada parecido: los dos únicos
precedentes de autenticación del proyecto son **secretos compartidos en
cabecera** —`CRON_SECRET` en la ruta del cron (ADR-019 §1) y el `secret_token`
del webhook (ADR-022 §1)—, los dos con `env` inyectado y **fallo cerrado**.

Ninguno de los dos sirve tal cual: los dos autentican **una máquina** que puede
poner una cabecera en cada petición. Un navegador no pone cabeceras, y una
persona no reescribe un secreto de 32 caracteres cada vez que corrige un
marcador. **Ésta es la decisión que hay que tomar antes de escribir la spec**, y
es la razón de que este ADR exista.

## Decisión

### §1. El panel es un conjunto de rutas del App Router y su domicilio es `src/admin/`

`src/admin/` nace con esta decisión. Las rutas viven bajo `/admin` (galego) y
`/es/admin` (castellano), **con la misma forma que el resto del proyecto**: el
fichero de ruta no tiene lógica y delega entero en un handler inyectable de
`src/admin/`, como hacen `src/app/api/cron/ingest/route.ts` y
`src/app/api/telegram/webhook/route.ts`. El motivo es el que ya está escrito en
los dos: un `route.ts` de Next no puede exportar constantes propias, y lo que no
se puede nombrar no se puede probar sin levantar un proceso hijo.

**Las rutas nuevas se declaran en `ENTRY_POINTS`** (`tests/polite/support/capability.ts`,
SPEC-009) **con su motivo escrito**, como todas las anteriores. Y la afirmación
que llevan es más fuerte que la del webhook: **el grafo del panel no alcanza
`src/polite/http.ts`**, porque el panel no le pide nada a ningún tercero. Ésa es
la razón por la que **RN-11 no alcanza a esta spec**, y conviene que esté escrita
para que nadie la lea al revés.

### §2. La identidad del operador es un seudónimo declarado, y su secreto no se versiona jamás

**`Observation.source` es exactamente `'operador'`, sin sufijo y sin variantes.**
No es estilo: `roleOf` falla cerrado ante un `SourceId` que no esté en
`SOURCE_ROLES` (ADR-021 §8.4), así que un `operador:01` reventaría el motor y
obligaría a tocar ficheros de SPEC-013, que está `hecho`. Es literalmente la
misma decisión que ADR-022 §2 tomó para el corresponsal, y por el mismo motivo.

**Quién operó se registra con un `operator_id` declarado**, de la forma
`operador-01`, `operador-02`: un token **local del proyecto**, sin significado
fuera de él, **sin nombre y sin localidad dentro**. La forma se impone con zod
(`^operador-\d+$`), igual que `corresponsal-\d+`, y por la misma razón: en un
repositorio público, `operador-alberto` identifica a una persona y `operador-01`
no.

**El catálogo y el secreto van los dos en entorno, y ninguno se versiona.** Aquí
este ADR **se aparta de ADR-022 §2**, que versiona el catálogo de corresponsales
y solo saca el mapeo a entorno, y el motivo es que aquí no hay dos mitades
separables: lo que hay que guardar **es** el secreto, y un catálogo versionado que
solo dijese «existe `operador-01`» no informaría de nada que el código no diga ya.

Concretamente, **una sola variable**: `ADMIN_OPERATORS`, un objeto JSON
`{"<operator_id>": "<digest del secreto>"}`. Se guarda el **digest**, no el
secreto: quien lea la variable de entorno de producción no obtiene con eso una
sesión. Y **nace vacía**, que es lo que entrega el panel apagado (§9).

El **razonamiento de ADR-009 §3** —*git no se purga, se reescribe*, y por eso la
política es «sin excepción, porque su incumplimiento no es reversible»— se aplica
aquí a un dato peor que el HTML de terceros: **la credencial de la superficie de
peso 1.0 con precedencia**. Y **no cambia si el repositorio pasa a privado**: un
privado se hace público con un clic, y un secreto filtrado se rota, pero un
secreto en la historia de git sigue ahí.

**Quién puede leer `ADMIN_OPERATORS` es una frontera de capacidad** en la forma
de ADR-016: lista exportada con nombre, un motivo por entrada, el complemento
vacío comprobado con **el mismo lector del compilador** que sostiene las
fronteras de SPEC-008, SPEC-009, SPEC-013 y SPEC-015 (un solo lector,
ADR-016 §5 bis), control positivo por mecanismo, y el residuo declarado dentro
del propio criterio.

### §3. La sesión es una cookie firmada sin estado durable, y falla cerrada

**El problema real es de canal, no de criptografía.** Un navegador no pone
cabeceras y una persona no teclea un secreto por acción. Así que hay exactamente
un intercambio: **el operador entrega su secreto una vez, en un `POST`, y recibe
una sesión**.

- **La sesión es una cookie** `httpOnly`, `Secure`, `SameSite=Strict`, `Path=/`,
  cuyo valor es `{operator_id, issued_at, expires_at}` **firmado con HMAC-SHA-256
  bajo `ADMIN_SESSION_SECRET`**. No hay tabla de sesiones y no la habrá: **no hay
  proceso vivo ni estado que compartir** (ADR-004), y una tabla de sesiones sería
  un tercer log que puede desincronizarse de los dos que RN-13 protege.
- **La caducidad va dentro de la firma**, no en el atributo `Max-Age` de la
  cookie, que es una sugerencia al cliente y no una garantía del servidor.
- **Fallo cerrado, en tres formas y sin gradación:** `ADMIN_SESSION_SECRET`
  ausente, vacío o de menos de 32 caracteres ⇒ **ninguna ruta del panel hace
  nada**, ni siquiera leer. `ADMIN_OPERATORS` ausente o ilegible ⇒ nadie entra.
  Firma inválida, caducada o `operator_id` que ya no está en el catálogo ⇒ no hay
  sesión. Es la misma forma de `cronIngestHandler` y de `telegramWebhookHandler`,
  y por el mismo motivo: **una variable que falta no puede parecerse a un
  permiso**.
- **La comparación del secreto es de tiempo constante**, sin `===` y sin
  cortocircuito, como la del webhook.

**Lo que este diseño NO da, y se escribe para que nadie lo suponga:** no hay
revocación de una sesión ya emitida antes de que caduque —para eso haría falta
estado durable—, no hay límite de intentos de acceso, y no hay segundo factor. Lo
que lo hace aceptable **hoy** es lo que hace aceptable a la ceremonia de purga de
ADR-009 §4: hay **un** operador, es el autor, y el proyecto es medición. Lo que lo
haría inaceptable está escrito en las consecuencias, con su disparador.

### §4. El vale de acción: una sola firma que hace de CSRF y de cronómetro

Cada formulario del panel lleva un **vale** firmado con HMAC sobre
`{operator_id, action, target, issued_at}`, donde `target` es el `match_id` o el
`alert_id`. Al enviar, el servidor lo verifica antes de tocar nada.

Hace **dos** trabajos con un solo mecanismo, y ésa es la razón de elegirlo:

1. **CSRF.** Sin vale válido —o con uno de otro operador, o manipulado, o de más
   de `TICKET_TTL`— la operación se rechaza **sin archivar nada y sin dejar
   fila**. `SameSite=Strict` ya cubre el caso normal; el vale cubre el que no
   depende de que el navegador se porte bien.
2. **Cronómetro.** `issued_at` es **el instante en que se le sirvió el formulario
   a la persona**, y es lo único que, sin proceso vivo, permite medir tiempo
   sobre tarea. `submitted_at − issued_at` es el tiempo de una acción (§8).

**El vale no es de un solo uso, y se declara**: detectarlo exigiría estado
durable, que es justo lo que §3 evita. El reenvío dentro del TTL vuelve a
producir **la misma acción**, cuya `Observation` tiene el **id derivado** del
objeto crudo (como el bot deriva el suyo, `src/ingest/observations.ts`), así que
`append` es idempotente por construcción y un reenvío idéntico no duplica nada.

**El vale no viaja en la URL**, para que no quede en el historial del navegador
ni en el registro de ningún intermediario.

### §5. Toda operación termina en `Observation` y sale por la puerta estrecha; el panel no entra en `DECISION_WRITERS`

**El panel no escribe ninguna `Decision`, no toca `alerts`, y no hace ningún
`UPDATE`.** Las tres operaciones que publican —corregir el marcador, cambiar el
estado, ratificar lo vigente— hacen exactamente lo mismo:

```
vale ─► archivo del objeto redactado (RN-10) ─► Observation(source='operador',
        confidence=RN01_WEIGHTS.operator, raw_ref=el objeto) ─► append
     ─► runEngineForMatch(match_id, now)
```

**Y llama al motor por la puerta que no le entrega la capacidad.** `applyEngine`
pide un `EnginePorts` con un `DecisionStore` dentro y `composeCyclePorts`
devuelve otro tanto; `src/decide/engine-entry.ts` existe desde SPEC-015 con un
tipo de retorno que **no contiene ningún almacén** (`EngineOutcomeSummary`), y el
panel lo importa **por nombre** —un `import * as` sobre `src/decide/` sería
infracción— y lo recibe **inyectado como función**, como `BotPorts.runEngine`.

`DECISION_WRITERS` **no crece**: sus dos entradas siguen siendo las dos, y el
caso de SPEC-013 que afirma que son exactamente dos pasa sin tocar una aserción.
Que el panel —la fuente de más peso del sistema— **no** tenga esa capacidad es
precisamente lo que RN-08 y D-3 dicen con todas las letras.

**Y el motor corre en el acto, no en el tick siguiente.** ADR-021 §3 declara dos
disparadores y esto es el primero. Aquí el argumento de latencia de ADR-022 §9 es
**más fuerte, no menos**: el operador está mirando la pantalla esperando ver el
efecto, y hacerle esperar hasta 60 s por una decisión de fontanería se cobra en
la cifra que esta épica mide.

### §6. El archivo de la acción: lista blanca total, prefijo propio, y el motivo verbatim

**RN-10 se cumple archivando el objeto de la acción REDACTADO**, con la forma de
ADR-022 §3: **lista blanca total, no lista negra**, exportada con nombre y con un
motivo por entrada, y se comprueba sobre **el conjunto de claves recorrido en
profundidad**, no sobre las prohibidas.

Lo que se archiva es lo que el operador declara y nada de lo que trae la
petición: `operator_id`, `match_id` o `alert_id`, la acción, el estado y el
marcador propuestos, **el motivo escrito por la persona**, el `issued_at` del vale
y el `submitted_at`. **Ni cabeceras, ni IP, ni user-agent, ni cookie, ni sesión.**

**El motivo va verbatim, byte a byte**, por la misma razón por la que el texto del
corresponsal va verbatim: la redacción no puede destruir el sustrato que RN-10
existe para conservar.

**El motivo es obligatorio y no vacío.** Es la mitad de RN-12 que ninguna columna
lleva: `rule` dice qué regla y `supporting_observation_ids` dice sobre qué, pero
**por qué una persona bajó un marcador** no está en ninguna otra parte. Sin él,
D-6 —«un marcador publicado siempre sabe de dónde viene»— se cumple de boquilla.
Y no cuesta una columna: `src/model/` **no cambia**, porque el motivo vive en el
objeto crudo y se alcanza por la cadena que ya existe: `Decision` →
`supporting_observation_ids` → `Observation.raw_ref` → objeto crudo →
`operator_id` y motivo.

**La clave lleva el prefijo `operador/` y su segundo segmento es un tipo de acción
de una lista cerrada**, con la misma irregularidad declarada que
`CORRESPONDENT_ARCHIVE_SOURCE` y por el mismo motivo: ahí donde toda fuente
automática escribe un `competition_id`, aquí va el tipo, **para que la purga tenga
un solo prefijo**.

**El `operator_id` tiene un solo domicilio durable: ese objeto.** Ninguna tabla
append-only lleva una columna capaz de albergarlo. Es la decisión de ADR-022 §2
aplicada por analogía, y la razón de aplicarla es que el proyecto tenga **un solo
régimen** para «quién hizo esto», no dos que alguien tenga que comparar.

### §7. La bandeja es del panel: `alert_acks`, y `alerts` no se toca

ADR-021 §5 lo dejó escrito por adelantado: «no hay estado "vista", ni "resuelta",
ni destinatario. Eso lo trae el panel, y cuando lo traiga **será una tabla suya**:
`alerts` es un hecho histórico, no una bandeja». Esta decisión es el cobro de esa
promesa, en su letra:

- **`alerts` no se modifica**: ni columna nueva, ni trigger cambiado, ni `update`.
  Sigue siendo append-only con `reject_amendment` y sigue siendo **la materia
  prima de la tercera cifra de la épica**, que se cuenta sobre ella.
- **`alert_acks`** es una tabla nueva, append-only con `reject_amendment`, con
  `unique (alert_id)`: una alerta se reconoce **una vez**. Lleva el `alert_id`, el
  instante y el `raw_ref` del objeto de la acción — **no lleva `operator_id`**,
  por §6.
- **«Abierta» se calcula, no se guarda**: una alerta está abierta si no tiene
  acuse. Es la misma disciplina que ADR-021 §2 aplicó al motor —el estado
  derivado no miente nunca porque no se guarda— y evita el tercer log que puede
  desincronizarse.
- **Reconocer no publica nada.** No escribe `Observation` ni `Decision`. RN-05
  dice que el conflicto no se publica, y reconocerlo tampoco lo publica: lo que
  publica, si el operador decide arbitrar, es una corrección, que es otra acción.
- **El acuse es de una fila, no de una condición.** Si la condición vuelve con
  otro motivo, el motor escribe otra alerta (`reason` es su huella,
  `migrations/0006`) y esa vuelve a aparecer abierta.

### §8. `operator_actions`: lo que el panel deja medible, y lo que no

El panel registra sus actos en una tabla append-only, **como el tick registra sus
intentos** (ADR-019 §5) y por el mismo motivo: lo que no se escribe mientras pasa
no se reconstruye después.

Una fila por acción **que llegó con sesión y vale válidos**, con su tipo, su
objetivo, `started_at` (el `issued_at` del vale), `submitted_at`, el desenlace
—aceptada o rechazada por una razón del dominio, como un motivo vacío— y el
`raw_ref`. Una petición rechazada **antes** de la sesión o del vale no deja fila:
la tabla mide operación, no ruido ni a quien llama a la puerta.

**Y aquí va la parte que hay que leer al lado de la cifra, porque la propia épica
la exige** («el informe declara junto a cada una qué la degrada»): esto es una
**cota inferior**. No cuenta leer la pantalla, ni esperar, ni decidir sin enviar,
ni el tiempo entre dos acciones, ni la vuelta al bot o al campo. La cuarta cifra
**sigue necesitando el cronómetro** que la tabla de métricas de EPIC-002 ya pide
—«verificación manual a cronómetro en 10 partidos»—. Lo que esta tabla evita es
tener que reconstruir a mano lo único que sí es exacto: cuántas acciones hubo y
cuánto duró cada una **desde que la pantalla estuvo delante**.

### §9. La llave del panel es el partido, no el reloj — y es lo contrario que en el bot

El panel **solo opera sobre partidos cuyo `kickoff` cae dentro de una jornada de
medición declarada** (`MEASUREMENT_WINDOWS`, ADR-019 §3), que **nace vacía**. Con
la lista vacía no hay partidos, no hay operaciones y **SPEC-017 entrega un panel
apagado**, como SPEC-012 entregó un cron que no pide nada y SPEC-015 un bot que no
recoge nada.

**Pero la llave se aplica al partido, no al instante de la acción**, y ahí este ADR
**se aparta de ADR-022 §7** a propósito. El motivo es que las dos llaves protegen
cosas distintas:

- **En el bot**, lo que la llave acota es **cuándo se recoge texto libre escrito
  por una persona**. Un bot estructuralmente incapaz de acumularlo la temporada
  entera es lo que sostiene el plazo de ADR-023, y por eso ahí la llave tiene que
  ser el reloj.
- **En el panel**, lo que la llave protege es el **ancla de retención**: todo lo
  que el panel archiva cuelga de la jornada de su partido y se purga con ella
  (ADR-020 §2). Y hay una razón de operación que decide: **el operador tiene que
  poder corregir un partido después de que su ventana cierre**. Un `finished` mal
  cerrado se descubre el lunes, y negarle al operador la corrección le quitaría la
  función que RN-01 le atribuye, arbitrar — con la fuente oficial no capturable
  (ADR-008 §1) no hay nadie más que pueda deshacerlo.

Un partido fuera de toda jornada declarada ⇒ **error con nombre, cero archivo,
cero filas**. No hay modo degradado.

### §10. Lo que este ADR no decide

- **El suelo de interfaz** —foco, teclado, toque, estilos—: **ADR-025**. Se separa
  porque no es del panel: la spec del snapshot va a necesitar exactamente lo
  mismo, y una regla que dos specs necesitan no vive dentro de una de ellas.
- **Qué cualificador se enfatiza en la pantalla del marcador.** Sigue siendo la
  **entrada 1 del inventario de EPIC-004** y este ADR no la contesta. Lo que sí
  fija SPEC-017, y solo para su propia superficie, es que **el panel es una cola
  de trabajo y se ordena por lo que necesita a una persona**, no por cualificador.
- **Si los cuatro cualificadores se traducen al castellano** o se quedan en galego
  como vocabulario de marca. Es la pregunta que SPEC-015 dejó con disparador
  escrito —«el primer artefacto que enseñe un cualificador a una persona en
  castellano»— y **el panel es ese artefacto**. La contesta el gate, no este ADR.
- **Usuarios, roles y permisos.** Hay un rol, «operador», y todos los que entran
  lo tienen entero. Un segundo rol con menos poder es producto, no medición.
- **Notificaciones hacia el operador.** El panel se mira; no avisa. Empujar exige
  decidir canal, a quién y cuándo, y eso es otra spec.
- **La retención de producción del raw store.** Sigue sin dueño (ADR-009 §6,
  F-SPEC-001-1). El archivo del panel entra en el régimen de la jornada
  (ADR-020 §2) y no inventa uno nuevo.
- **Un mecanismo automático de purga.** Sigue siendo la ceremonia manual de
  ADR-009 §4, con su acuse escrito.

## Consecuencias

### Positivas

- **El proyecto gana la única ruta que le faltaba a un marcador *confirmado*.**
  Desde ADR-008 §1 el sistema podía publicar, y todo lo que publicaba salía
  *provisional*. Con esto deja de ser cierto, y deja de serlo por la puerta que
  RN-08 autoriza, no por una trasera.
- **Hoy solo un humano puede aplazar un partido, y a partir de aquí hay dónde.**
  RN-06 reserva `postponed` y `suspended` a la fuente oficial o a un humano, y la
  oficial no es capturable. El corresponsal podía desde SPEC-015; el operador
  puede desde aquí, y lo suyo sale confirmado.
- **La cuarta cifra deja de depender de que alguien se acuerde.** Lo exacto queda
  escrito mientras pasa; lo inexacto queda declarado como inexacto.
- **Un solo régimen para «quién hizo esto» en todo el proyecto.** Corresponsal y
  operador se registran igual: un seudónimo declarado que vive solo en el objeto
  crudo, y ninguna columna que pueda albergarlo. Quien audite una fila del sistema
  aprende el mecanismo una vez.
- **La promesa que ADR-021 §5 dejó por escrito se cobra en su letra.** La bandeja
  llegó y `alerts` no se tocó.
- **`src/model/` y `migrations/0001` siguen intactos.** La spec con más poder del
  sistema no añade una columna al modelo canónico: todo lo que necesita cabe en el
  objeto crudo y en dos tablas que no son modelo.

### Negativas / follow-ups

- **La sesión es lo más débil que hay en el proyecto, y es la superficie con más
  poder.** Un secreto compartido, sin límite de intentos, sin revocación y sin
  segundo factor, delante de la capacidad de publicar un marcador *confirmado*.
  Se acepta **con las mismas condiciones que la ceremonia de purga de
  ADR-009 §4**: hay un operador, es el autor, y esto es medición. **Disparador
  escrito: el día que haya un segundo operador, o que el panel se use fuera de una
  jornada de medición declarada, esta decisión se reabre entera.** Destino:
  ADR nuevo, no un parche.
- **El vale no es de un solo uso.** Está declarado en §4 y mitigado por la
  idempotencia del id derivado, no resuelto. **Destino: EPIC-MEJORA;
  disparador: el día que el panel tenga una operación cuyo efecto no sea
  idempotente.**
- **`operator_actions` mide una cota inferior y alguien la va a leer como la
  cifra.** Es el riesgo concreto de esta tabla, y la mitigación es que la
  obligación de declarar la degradación ya es criterio de aceptación **de la
  épica**, no una nota al pie.
- **Dos implementaciones de comparación en tiempo constante.** `constantTimeEquals`
  vive en `src/bot/webhook.ts` (SPEC-015, `hecho`) y el panel no puede importarla
  sin arrastrar el grafo entero del bot a una ruta suya. **Destino: EPIC-MEJORA;
  disparador: la tercera.**
- **El catálogo de operadores no se versiona, así que no hay historia de altas y
  bajas.** Es el precio de no poner una credencial en git, y es el precio
  correcto. Lo que sí queda escrito es el `operator_id` dentro de cada objeto
  archivado, así que la historia de **quién actuó** existe aunque la de quién
  tenía permiso no.
- **`ADMIN_OPERATORS` y `ADMIN_SESSION_SECRET` se suman a las seis variables de
  entorno del proyecto, y ninguna la vigila un despliegue.** Vercel no avisa de un
  secreto que falta; lo que avisa es el fallo cerrado, que es ruidoso a propósito.
  Va al runbook de configuración.
- **El panel no tiene diseño y esta decisión no se lo da.** Lo que se lo da es
  ADR-025, que es un **suelo**, no un sistema. La entrada 5 del inventario de
  EPIC-004 —«es donde un error de diseño cuesta un marcador mal publicado»— queda
  **contestada en lo que bloquea y abierta en lo demás**, con su disparador
  intacto: el deshielo de EPIC-004.

## Alternativas consideradas

- **Proteger el panel con la protección de despliegue de Vercel** (contraseña de
  plataforma, o Vercel Authentication). Rechazada, y era la más barata: no es
  código, así que **ningún criterio la puede afirmar y ningún test se pone rojo si
  alguien la apaga**. La capacidad de publicar un marcador confirmado no puede
  depender de una casilla de un panel de terceros que el repositorio no ve. Y
  además no distingue operadores, así que `operator_id` sería una declaración
  voluntaria y RN-12 se quedaría sin sujeto.
- **Un proveedor de autenticación** (Auth.js, Clerk, un OAuth). Rechazada: EPIC-002
  deja usuarios fuera de alcance, y esto mete un tercero, una dependencia, un
  encargado del tratamiento nuevo —con todo lo que ADR-023 §3 dejó escrito sobre
  lo que cuesta uno— y un flujo que no se puede probar sin red. Para **un**
  operador que es el autor, es desproporcionado por dos órdenes de magnitud.
- **Reusar la identidad de Telegram** (Login Widget, o hacer del bot el panel).
  Rechazada, y es la que más se parecía a una buena idea. Tres motivos: mezcla el
  régimen de datos personales de ADR-023 con una superficie que no lo necesita;
  ata la autoridad de peso 1.0 a la disponibilidad de un tercero; y **confunde
  justo lo que RN-01 separa** —«operador ≠ corresponsal»— en el sitio donde esa
  confusión se paga con un marcador mal publicado.
- **Un secreto en cabecera, como el cron y el webhook.** Rechazada por el motivo
  de §3: autentica máquinas. Una persona con un navegador no pone cabeceras, y la
  alternativa practicable —pegar el secreto en la URL— lo deja en el historial, en
  los registros de cualquier intermediario y en la captura que se comparte.
- **Una tabla de sesiones en Postgres.** Rechazada: da revocación, que es real, y
  cuesta un tercer log de estado mutable en un proyecto cuyo diseño entero
  (ADR-021 §2) está construido sobre no tener ninguno. Con una caducidad corta
  dentro de la firma, lo que se pierde es revocar antes de tiempo a **un** operador
  que es el autor. Se reevalúa con el segundo operador, que es el disparador ya
  escrito.
- **Que el panel escriba la `Decision` directamente**, ya que el operador es la
  autoridad máxima y el motor no le va a llevar la contraria. Rechazada, y es el
  rechazo central: **RN-08 y D-3 no tienen excepción**, y la de más peso es
  justamente la que más tentación da. Además es falso que el motor no aporte nada:
  aporta la atribución de RN-12 (`RN-01` por precedencia frente a `RN-04` por
  monotonía), el número de versión, la contigüidad y el cualificador. Escribirla a
  mano sería reimplementar todo eso peor y en otro sitio.
- **Un `UPDATE` sobre la `Decision` vigente** para corregir un marcador. Rechazada
  por RN-13 y por `decisions_are_immutable`, que es un trigger: no es una
  disciplina que se pueda relajar, es un error de base de datos.
- **Añadir una columna `reason` a `observations`.** Rechazada: SPEC-001 está
  `hecho`, `migrations/0003` ya declaró que no se añade ninguna columna a las
  tablas del modelo canónico, y el motivo cabe entero en el objeto crudo que RN-10
  obliga a escribir de todas formas. Habría sido pagar una migración del modelo
  canónico por un dato que ya tiene sitio.
- **Un estado «reconocida» en `alerts`.** Rechazada: la tabla es append-only con
  trigger, así que exigiría o una columna mutable —rompiendo la promesa de
  ADR-021 §5— o una migración que le quitase el trigger. Una tabla lateral cuesta
  una migración y no le quita a nadie su inmutabilidad.
- **Instrumentar la cifra de operación en una spec posterior**, la de las cuatro
  cifras. Rechazada por el motivo de §8, que es de secuencia y no de gusto: la
  jornada pasa una vez. Lo que no se escribe mientras ocurre se reconstruye a mano
  o no se reconstruye, y esta épica prohíbe explícitamente las cifras
  reconstruidas adivinando.
- **Gatear el panel por el reloj, como el bot.** Rechazada en §9: le quitaría al
  operador la corrección del lunes, que es cuando se descubren la mitad de los
  errores de una jornada.
