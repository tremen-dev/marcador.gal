---
id: SPEC-017
tipo: spec
epica: EPIC-002
estado: en-revision
aprobada-por: Alberto Fojo
historial:
  - {estado: borrador, fecha: 2026-09-03, por: sdd-arquitecto}
  - {estado: aprobada, fecha: 2026-09-03, por: Alberto Fojo}
  - {estado: en-progreso, fecha: 2026-09-03, por: sdd-implementador}
  - {estado: en-revision, fecha: 2026-09-03, por: sdd-implementador}
  - {estado: en-progreso, fecha: 2026-09-03, por: desconocido}
  - {estado: en-revision, fecha: 2026-09-03, por: sdd-implementador}
---
# SPEC-017 — Panel del operador: sesión declarada sin usuarios, toda corrección como `Observation`, y la bandeja que `alerts` no tiene

> Sigue la descomposición orientativa de `_epica.md` —adaptador ✓ (SPEC-008) ·
> frontera RN-11 ✓ (SPEC-009) · calendario y repositorios ✓ (SPEC-010) ·
> catálogo de alias ✓ (SPEC-011) · cron de ingesta ✓ (SPEC-012) · motor de
> decisiones ✓ (SPEC-013) · bot de Telegram ✓ (SPEC-015, con el arreglo de
> compilación de SPEC-016) · **panel del operador** · snapshot · cifras—.
>
> **Es la última pieza de la vía humana, y la única que llega a *confirmado*.**
> Con una sola fuente automática capturable (ADR-008 §1) todo lo que el sistema
> publica hoy sale *provisional*, y de las dos personas que RN-01 nombra solo el
> operador tiene peso 1.0. Hasta que exista este panel, **el proyecto no puede
> publicar un marcador confirmado ni aplazar un partido**.
>
> Trae **dos ADR en `borrador`**: **ADR-024** (la sesión sin sistema de usuarios,
> el vale de acción, toda operación como `Observation` por la puerta estrecha, la
> bandeja, el registro de operación y la llave de la jornada) y **ADR-025** (el
> suelo de interfaz mientras EPIC-004 está congelada, que es lo que desbloquea la
> entrada 3 de su inventario).
>
> Y **despierta tres entradas del inventario congelado de EPIC-004** —la 1, la 3
> y la 5—, porque su propia épica dice que «si alguna spec de EPIC-002 las toca,
> el disparador de esas entradas es esa spec, no el go/no-go». Qué contesta esta
> spec y qué deja abierto está en el §7 del diseño, no escondido.

## Problema

**El sistema puede publicar, y todo lo que publica es provisional.** SPEC-012
abrió el camino fuente → archivo → `Observation` y SPEC-013 cerró el de
`Observation` → `Decision`. SPEC-015 metió a la primera persona por la puerta, con
peso 0.8. Y la aritmética de EPIC-002 no se mueve: `futgal.es` no es capturable
(ADR-008 §1), así que **la primera vía de RN-02 —peso ≥ 0.9— no la alcanza
ninguna fuente automática, y la segunda —dos fuentes independientes de peso
≥ 0.7— está cerrada porque no hay dos**.

De todo el sistema, **exactamente una cosa llega a *confirmado*: el operador**, y
la puerta por la que entraría no existe. `src/decide/roles.ts` le tiene el asiento
puesto desde SPEC-013 (`'operador'` → `operator` → 1.0) y su comentario lo dice:
«el bot y **el panel** son las dos próximas specs, y ésta es la mitad que el motor
les debe». `migrations/0006` lo dice desde el otro lado: «SIN ACUSE, SIN ESTADO
"VISTA" Y SIN DESTINATARIO: **la bandeja es del panel**, y el panel no existe
todavía». `src/decide/ports.ts` lo repite. **Tres piezas del sistema nombran una
cosa que no está.**

Y hay tres cosas más, concretas, que hoy nadie puede hacer:

1. **Nadie puede aplazar un partido.** RN-06 reserva `postponed` y `suspended` a
   la fuente oficial **o** a un humano, y la oficial no es capturable. El
   corresponsal puede desde SPEC-015 —y lo suyo sale *provisional*—; el operador
   no puede porque no tiene por dónde. En una jornada de Preferente en octubre,
   eso no es un caso raro.
2. **Nadie puede bajar un marcador.** RN-04 lo reserva a los mismos, y por el
   mismo motivo hoy solo lo puede hacer una persona.
3. **Nadie puede reconocer una alerta.** El motor lleva escribiéndolas desde
   SPEC-013 y no hay ninguna superficie que las lea. Una alerta que nadie ve es
   una fila.

**Y hay una cifra que se mide sobre esta pantalla y solo sobre ella.** Los
**minutos de operación manual por jornada**, con corte duro en **30 min**: la
única de las cuatro con corte duro y la única cuyo resultado cambia la épica
siguiente —por encima, `docs/roadmap.md` dice que lo que toca es «comunidad de
corresponsales», no «producto»—. Lo que este panel haga lento o farragoso **es**
ese número. Y tiene una asimetría que decide parte del diseño: **si el tiempo no
se escribe mientras la jornada ocurre, después no se reconstruye**; las
`Observation` llevan `observed_at`, no cuánto tardó la persona en escribirla.

**Lo difícil no es la pantalla.** Un formulario que escribe una fila es media
tarde. Lo difícil es que este panel es, a la vez:

- **la superficie con más poder del sistema** —peso 1.0 **con precedencia sobre la
  RFGF** (RN-01)—, y el proyecto **no tiene sistema de usuarios**: EPIC-002 deja
  «usuarios» fuera de alcance y `src/app/` no tiene `middleware.ts`, ni sesión, ni
  cookie. Los dos únicos precedentes de autenticación —`CRON_SECRET` y el
  `secret_token` del webhook— **autentican máquinas**, y un navegador no pone
  cabeceras;
- **la primera interfaz que EPIC-002 construye**, y **EPIC-004 está congelada** con
  una entrada de inventario que dice, literalmente, que la falta de estados de foco
  y navegación por teclado «**bloquea cualquier spec de interfaz**»;
- **el primer artefacto del sistema que le enseña un cualificador a una persona**,
  y `src/i18n/es.ts` **no tiene `qualifiers`**. Es el residuo que SPEC-015 dejó con
  el disparador escrito: «el primer artefacto que enseñe un cualificador a una
  persona en castellano». Ese artefacto es éste;
- y **la única `Observation` del sistema que nace sin fuente que archivar**. RN-10
  no tiene excepción por fuente, y `dominio.md` lo dice con el panel dentro: el
  `raw_ref` es obligatorio siempre, «incluye las correcciones hechas a mano desde
  el panel: **son la observación con más poder del sistema**».

**Lo que esta spec no arregla, dicho en la primera línea:** no enseña ningún
marcador al público —no hay snapshot ni página, eso es la spec siguiente—; no
produce ninguna de las cuatro cifras; no descongela EPIC-004 ni le da diseño al
panel más allá del suelo de ADR-025; no trae usuarios, ni roles, ni permisos; y
**entrega un panel apagado**: con `ADMIN_OPERATORS` vacía no entra nadie, y con
`MEASUREMENT_WINDOWS` vacía no hay ningún partido sobre el que operar.

## Usuarios / roles afectados

- **El operador del spike** (el autor, RN-01): la persona que **arbitra**, «con
  todas las fuentes y el histórico delante». No es el corresponsal —`reglas.md` lo
  separa en RN-01 y esta spec no los mezcla—: el corresponsal *envía* desde el
  campo a 0.8, el operador *decide* desde el panel a 1.0 con precedencia, y lo que
  publica sale **confirmado, nunca provisional**. **Sus minutos son la cuarta
  cifra de la épica**, así que cada paso que le añadimos se cobra en el número que
  decide el proyecto.
- **`sdd-implementador`**: construye `src/admin/` entero, `src/i18n/admin-bundle.ts`
  y `admin.ts`, el espacio de nombres del panel en las dos lenguas, las rutas bajo
  `src/app/(gl)/admin/` y `src/app/(es)/es/admin/`, `src/db/admin.ts`,
  `migrations/0008`, la hoja de estilos propia del panel y las suites. Toca
  `src/i18n/gl.ts` y `es.ts` para añadir un espacio de nombres —la vía de
  crecimiento de SPEC-005, SPEC-006 y SPEC-015— y **`tests/polite/support/capability.ts`
  para declarar los puntos de entrada nuevos con su motivo**. La rama tiene que
  nombrar `SPEC-017`, o el hook `require-spec` deniega la escritura sobre `src/` y
  `tests/`. Necesita `DATABASE_URL_TEST` desde CA-5.
- **`sdd-verificador`**: corre **`npm run gates`** (que desde SPEC-016 encadena
  `typecheck` → `lint` → `build` → `test`) **y** `npm run test:db` aparte; sin
  `DATABASE_URL_TEST` los criterios con base son **UNMET, no *skipped*** (gate del
  2026-08-29). Aquí su trabajo tiene dos centros: **CA-1, CA-2 y CA-13 son
  fronteras de capacidad en la forma de ADR-016** —que apague cada mecanismo y vea
  el rojo, y que lea el residuo declarado dentro de cada criterio; si falta un
  residuo es *finding* con destino `sdd-arquitecto`, no una corrección del test—;
  y **CA-10.7 es la mitad de la accesibilidad que ningún test ve**, que la hace él
  a mano, con navegador, teclado y capturas en `_qa/SPEC-017/`.
- **`sdd-arquitecto`**: si el gate firma, **escribe en `docs/fundacion/dominio.md`
  lo que el gate decida sobre los cualificadores en castellano** (nota §3) **antes
  de que la implementación empiece**, porque el glosario manda añadir un término
  antes de usarlo.
- **`sdd-lingua`**: **no ha dictaminado sobre este texto.** El panel lo lee una
  persona del proyecto, no la federación, así que **no se declara bloqueante como
  en SPEC-004 CA-12** — pero sí hay que consultarle **los cuatro cualificadores en
  castellano**, que es vocabulario nuevo de dominio y no una etiqueta de botón. Ver
  nota §3.
- **`sdd-documentalista`**: `src/admin/` es estructura nueva en `CLAUDE.md`;
  `migrations/0008`, una migración más; y `docs/procedimientos/jornada-de-medicion.md`
  gana el prefijo `operador/` en la ceremonia de purga (CA-3.8). Tras el GREEN.

## Diseño

### §1. Qué se construye, y en qué orden se lee

```
src/admin/
  session.ts      el catálogo de operadores (entorno), el secreto, la cookie firmada. Falla cerrado
  ticket.ts       el vale de acción: firma, TTL, y el issued_at que es el cronómetro
  redact.ts       la lista blanca de claves de ADR-024 §6, y solo ella
  archive.ts      el objeto de la acción, por captureThenParse (RN-10)
  actions.ts      las tres operaciones que publican, y la que no: qué Observation produce cada una
  observation.ts  la Observation de peso 1.0, con id derivado del objeto crudo
  alerts.ts       la bandeja: abiertas = sin acuse. Se calcula, no se guarda
  board.ts        lo que ve el operador: partidos de la jornada, vigente, cualificador, alertas
  ports.ts        los puertos nuevos (acuses, registro de operación, lecturas de bandeja)
  handler.ts      el encaminamiento: sesión, vale, operación. El orden es la spec
  view/           el marcado y la hoja de estilos propia del panel (ADR-025 §4)
src/db/admin.ts   los puertos de arriba sobre Postgres, SQL etiquetado
src/i18n/admin-bundle.ts · admin.ts   contrato y resolutor del panel
src/app/(gl)/admin/…                  rutas en galego
src/app/(es)/es/admin/…               rutas en castellano
migrations/0008   alert_acks · operator_actions
```

`src/model/` **no cambia**: la spec con más poder del sistema no añade ni un campo
al modelo canónico. `src/decide/`, `src/ingest/`, `src/polite/`, `src/calendar/`,
`src/alias/` y `src/bot/` **no se editan**: son de specs `hecho` y ésta compone
sobre sus API públicas. Se toca **exactamente** lo declarado arriba, más
`src/i18n/gl.ts` y `es.ts` (un espacio de nombres) y
`tests/polite/support/capability.ts` (los puntos de entrada nuevos, con motivo).

### §2. El camino de una corrección, en el orden exacto en que ocurre

El orden **es** la spec. Cada flecha es una garantía que un criterio afirma.

```
GET /admin  (o /es/admin)
  1. sesión ───────────────► sin cookie válida ⇒ formulario de acceso. Cero lecturas de la base
  2. tablero ──────────────► partidos de las jornadas declaradas, vigente + cualificador + alertas
  3. vale ─────────────────► cada formulario sale firmado, con su issued_at

POST /admin/accion
  4. sesión ───────────────► inválida o caducada ⇒ 401. Cero archivo, cero filas
  5. vale ─────────────────► inválido, ajeno o caducado ⇒ rechazo. Cero archivo, cero filas
  6. partido en jornada ───► fuera de toda jornada declarada ⇒ error con nombre. Cero archivo
  7. motivo no vacío ──────► vacío ⇒ rechazo. SÍ deja fila en operator_actions (costó tiempo)
  8. redacción (lista blanca)
  9. ARCHIVO de la acción ─► RN-10: antes de construir nada
 10. Observation(source='operador', confidence=1.0, raw_ref = el objeto del paso 9)
 11. append ──────────────► id derivado del objeto crudo: reenviar lo mismo no duplica
 12. runEngineForMatch ───► la puerta estrecha. El panel NUNCA escribe una Decision
 13. operator_actions ────► started_at = issued_at del vale · submitted_at = ahora
 14. acuse ───────────────► lo publicado, con su cualificador, leído de vuelta de la base
```

**Los pasos 4, 5 y 6 son fronteras negativas** y se afirman igual que las del bot:
no solo «contesta lo que toca», sino **cero objetos crudos y cero filas**. El paso
7 es la excepción declarada, y es deliberada: un rechazo por motivo vacío ocurrió
**después** de que la persona llegara y escribiera, así que **costó tiempo de
operación y la cuarta cifra lo tiene que ver**.

Reconocer una alerta recorre el mismo camino sin los pasos 10, 11 y 12: **acusar
no publica nada** (RN-05).

### §3. Por qué el panel no puede escribir una `Decision`, siendo la autoridad máxima

Es la tentación evidente y el rechazo central de ADR-024: **RN-08 y D-3 no tienen
excepción**, y `reglas.md` se molesta en nombrar al corresponsal para decir que
tampoco la tiene él. La de más peso es justamente la que más tentación da.

Y no es una formalidad: el motor **aporta cosas que el panel tendría que
reimplementar peor**. La atribución de RN-12 —`RN-01` cuando el operador resuelve
una discrepancia por precedencia, `RN-04` cuando baja un marcador sin nadie que le
contradiga, `RN-06` cuando solo cambia el estado—, el número de versión que
arbitra la base, la contigüidad, y el cualificador derivado. Escribir la
`Decision` a mano sería tener dos implementaciones de RN-12, y una de ellas en la
superficie donde un error cuesta un marcador mal publicado.

Así que el panel llama a **`runEngineForMatch`** (`src/decide/engine-entry.ts`),
que existe desde SPEC-015 con un tipo de retorno que **no contiene ningún almacén**,
y lo recibe **inyectado como función**, exactamente como `BotPorts.runEngine`.
**`DECISION_WRITERS` no crece**, y el caso de SPEC-013 que afirma que tiene
exactamente dos entradas pasa sin tocar una aserción. Ése es el criterio, y no es
retórico: si alguien intenta hacerlo por la vía corta, ese test se pone rojo.

### §4. Dónde vive la persona, y dónde no

**En `Observation.source` no vive.** Es exactamente `'operador'`, sin sufijo:
`roleOf` falla cerrado ante un `SourceId` desconocido (ADR-021 §8.4) y un
`operador:01` reventaría el motor y obligaría a tocar SPEC-013, que está `hecho`.

**Vive en el objeto crudo redactado, y en ningún otro sitio durable.** El
`operator_id` —`operador-01`, un token local sin nombre ni localidad dentro— se
archiva con la acción. Ninguna tabla de `migrations/0008` lleva una columna capaz
de albergarlo. Es la decisión de ADR-022 §2 aplicada por analogía, y el motivo es
que el proyecto tenga **un solo régimen** para «quién hizo esto», no dos.

**El secreto no se versiona jamás.** Es el razonamiento de ADR-009 §3 —*git no se
purga, se reescribe*— aplicado a la credencial de la superficie de peso 1.0.
`ADMIN_OPERATORS` guarda **digests**, no secretos, así que leer la variable de
producción no da una sesión; y **quién puede leerla es una frontera de capacidad**
(CA-1).

**Y el motivo escrito por la persona vive ahí también, y es obligatorio.** Es la
mitad de RN-12 que ninguna columna lleva: `rule` dice qué regla, `supporting_observation_ids`
dice sobre qué, y **por qué una persona bajó un marcador no está en ninguna otra
parte**. Sin él, D-6 —«un marcador publicado siempre sabe de dónde viene»— se
cumple de boquilla. Y no cuesta una columna: la cadena `Decision` →
`supporting_observation_ids` → `Observation.raw_ref` → objeto crudo →
`operator_id` + motivo **ya existe entera**.

### §5. La sesión, y por qué es lo más débil del proyecto a propósito

El problema es de canal: un navegador no pone cabeceras y una persona no teclea un
secreto de 32 caracteres por acción. Así que el secreto se entrega **una vez** y a
cambio se recibe una cookie firmada con HMAC, `httpOnly`, `Secure`,
`SameSite=Strict`, **con la caducidad dentro de la firma** y no en un atributo que
el cliente puede ignorar. **Sin tabla de sesiones**: no hay proceso vivo (ADR-004)
y un tercer log de estado mutable es exactamente lo que el diseño del motor
(ADR-021 §2) está construido para no tener.

Lo que este diseño **no** da está escrito y no se descubre después: **no hay
revocación antes de la caducidad, no hay límite de intentos y no hay segundo
factor.** Lo que lo hace aceptable hoy es lo mismo que hace aceptable la ceremonia
de purga de ADR-009 §4: hay **un** operador, es el autor, y esto es medición. El
disparador de reapertura está escrito en ADR-024 y en las notas del gate: **el
segundo operador**.

### §6. El vale de acción: CSRF y cronómetro con un solo mecanismo

Cada formulario sale firmado sobre `{operator_id, action, target, issued_at}`.
Hace dos trabajos, y ésa es la razón de elegirlo:

- **CSRF**, cubriendo el caso que no depende de que el navegador respete
  `SameSite`.
- **Cronómetro**: `issued_at` es **cuándo se le puso el formulario delante a la
  persona**, y sin proceso vivo es lo único que permite medir tiempo sobre tarea.

**No es de un solo uso, y se declara**: detectarlo exigiría estado durable. El
reenvío dentro del TTL produce la misma acción, cuya `Observation` tiene el **id
derivado** del objeto crudo —como el bot deriva el suyo—, así que `append` es
idempotente por construcción.

### §7. Qué contesta esta spec del inventario congelado de EPIC-004, y qué no

EPIC-004 dice que si una spec de EPIC-002 toca sus entradas, **el disparador de
esas entradas es esa spec**. Ésta toca tres, y no es lo mismo lo que hace con cada
una. Escribirlo aquí es lo que impide que «lo despertó y no lo contestó» pase
inadvertido.

- **Entrada 3 — foco y teclado. CONTESTADA para lo que se construya antes del
  deshielo**, en **ADR-025 §2**, que es lo que desbloquea esta spec. La entrada
  sigue viva para el marcador; lo que se cierra es el bloqueo.
- **Entrada 5 — el panel no tiene ningún diseño. CONTESTADA EN LO QUE BLOQUEA,
  ABIERTA EN LO DEMÁS.** El suelo de ADR-025 es un suelo, no un diseño: el panel
  va a ser feo y eso es correcto. Lo que la entrada teme —«es donde un error de
  diseño cuesta un marcador mal publicado»— se ataca por donde de verdad muerde:
  el motivo obligatorio, el vale, el acuse que lee de vuelta lo publicado, y que
  nada se distinga solo por color. **La entrada conserva su disparador: el
  deshielo de EPIC-004.**
- **Entrada 1 — `provisional` es el estado normal. NO CONTESTADA, y a propósito.**
  Esta spec **no decide cuál de los dos cualificadores se enfatiza en el
  marcador**: eso es la pantalla del público y la contesta la spec del snapshot.
  Lo que sí resuelve, y **solo para su propia superficie**, es que la pregunta
  aquí no se plantea: **el panel es una cola de trabajo y se ordena por lo que
  necesita a una persona** —alerta abierta, después *sen sinal*, después `live`—,
  no por cualificador. Ninguno de los dos va apagado, porque en un panel ninguno
  de los dos es decoración.

Y despierta **un residuo de SPEC-015 que no es de EPIC-004**: `src/i18n/es.ts` no
tiene `qualifiers`, con disparador escrito «el primer artefacto que enseñe un
cualificador a una persona en castellano». **Es éste.** La pregunta —¿se traducen,
o se quedan en galego como vocabulario de marca?— la firma el gate (nota §3).

## Criterios de aceptación

- **CA-1 — La sesión del operador: catálogo en entorno, fallo cerrado, la
  frontera de quién lee el secreto, y un panel que no se anuncia (ADR-024 §2 y
  §3, ADR-016, ADR-009 §3).**
  Dado el handler de `src/admin/` con su entorno inyectado, cuando llega una
  petición, entonces:
  1. **`ADMIN_SESSION_SECRET` ausente, vacío o de menos de 32 caracteres ⇒ ninguna
     ruta del panel hace nada**: 401 sin invocar ningún puerto. Un caso lo afirma
     con dobles que registran si fueron llamados, y **todos** están sin llamar.
     Un secreto corto es un **error con nombre**, nunca un secreto aceptado.
  2. `ADMIN_OPERATORS` ausente, vacía o ilegible ⇒ nadie entra, y **`readOperators`
     nunca lanza**: devuelve el catálogo vacío, como `readCorrespondentMap`. Un
     panel que revienta al arrancar y un panel apagado no se pueden confundir.
  3. La comparación del secreto es de **tiempo constante**, escrita a mano, y un
     caso comprueba que **no hay ninguna comparación con `===` sobre el secreto ni
     sobre su digest** en el módulo.
  4. Firma inválida, cookie manipulada, `expires_at` pasado, o `operator_id` que ya
     no está en el catálogo ⇒ **no hay sesión**, y la respuesta es **la misma** en
     los cuatro casos: no dice cuál de los cuatro falló.
  5. La cookie es `httpOnly`, `Secure`, `SameSite=Strict`, `Path=/`, y la caducidad
     va **dentro de la firma**; un caso afirma que **mover el `Max-Age` no alarga
     una sesión**.
  6. **El `operator_id` casa `^operador-\d+$`**, impuesto con zod, y el catálogo se
     rechaza **entero** si alguna clave no casa. La forma prohíbe por construcción
     `operador-<nombre>` y `operador-<localidad>`, que en un repositorio público,
     cruzados con el calendario, identifican a una persona.
  7. **Frontera de capacidad, forma ADR-016.** Una lista exportada con nombre
     —`ADMIN_SECRET_READERS`— enumera los módulos autorizados a nombrar
     `ADMIN_OPERATORS` y `ADMIN_SESSION_SECRET`, **cada entrada con su motivo al
     lado**. Recorriendo todo el código versionado fuera de `tests/` **con el mismo
     lector del compilador** que sostiene las fronteras de SPEC-008, SPEC-009,
     SPEC-013 y SPEC-015 (un solo lector, ADR-016 §5 bis), el conjunto de ficheros
     que nombran esas variables y no están en la lista es **vacío**.
  8. **Control positivo por mecanismo** (ADR-016 §3.4): un fichero sintético fuera
     de la lista que nombre una de las variables pone rojo un caso nombrado;
     vaciar la lista de nombres vigilados pone rojo otro; y un fichero que el
     lector no sepa clasificar es **rojo**, comprobado contra lo que el compilador
     publica para ese fichero.
  9. **Ninguna exención por nombre de fichero** (ADR-016 §3.3): un caso afirma que
     este criterio no tiene ninguna lista de exclusiones propia.
  10. **El panel no se anuncia.** Todas sus rutas responden con
      `X-Robots-Tag: noindex, nofollow` y un `<meta name="robots" content="noindex, nofollow">`.
      **`robots.txt` NO cambia, y es una decisión escrita:** listar `/admin` en un
      fichero público publica la ruta de la superficie de peso 1.0 a cualquiera que
      lo pida. **SPEC-004 CA-11 sigue verde sin tocar una aserción** —dice «permite
      el rastreo del sitio entero»— y **no hay ninguna enmienda de ADR-015 que
      escribir**.
  11. **Residuo declarado dentro del criterio** (ADR-016 §6, obligatorio): estos
      mecanismos **no alcanzan** a un módulo que reciba el catálogo ya leído, por
      inyección, desde un módulo autorizado —la capacidad ahí no cruza ninguna
      frontera que el lector vea, y es el mismo residuo que SPEC-015 CA-2.7 declaró
      para el mapeo del bot—. **Destino: EPIC-MEJORA**; **disparador: el día que un
      módulo fuera de `ADMIN_SECRET_READERS` reciba el catálogo por inyección.**
      Tampoco alcanzan a que no haya límite de intentos ni revocación: eso no es
      una frontera de código, está en ADR-024 §3 y tiene su propio disparador.

- **CA-2 — Toda operación termina en `Observation`, ninguna escribe una
  `Decision`, y `DECISION_WRITERS` no crece (RN-08, D-3, ADR-024 §5, ADR-016).**
  Dado `src/admin/`, entonces:
  1. Las tres operaciones que publican —**corregir el marcador**, **cambiar el
     estado**, **ratificar lo vigente**— producen **una** `Observation` con
     `source` importado de `@/decide/roles` (`OPERATOR`, nunca un literal),
     `confidence` leído de `RN01_WEIGHTS.operator` (nunca un `1` escrito a mano) y
     `raw_ref` del objeto archivado; y **después** llaman al motor. La cuarta
     operación —**reconocer una alerta**— produce **cero** `Observation`.
  2. **`DECISION_WRITERS` sigue teniendo exactamente dos entradas** y el caso de
     SPEC-013 que lo afirma pasa **sin tocar una aserción**. `src/admin/` no está
     en la lista y no puede estarlo.
  3. Ningún módulo de `src/admin/` importa `applyEngine`, `composeCyclePorts`,
     `PostgresDecisionStore`, `DecisionStore` ni `DecisionVersionConflictError`,
     ni por *binding*, ni por referencia desnuda, ni por lectura de miembro, ni por
     superficie ilegible (`import * as`, `import()`, `export * from`). Se afirma con
     **el mismo lector del compilador** de CA-1.7, con control positivo por
     mecanismo.
  4. Ningún módulo de `src/admin/` contiene `update` ni `delete` sobre
     `observations`, `decisions`, `matches` ni `alerts`. **Residuo declarado dentro
     del criterio** (ADR-016 §6): este segundo mecanismo es **textual** y por tanto
     **no alcanza a SQL compuesto en ejecución**; es el mismo límite que SPEC-013
     CA-13.3 ya declaró, en otro sitio, y no se promete más de lo que ve.
  5. El motor entra en el panel **como función inyectada**
     (`runEngine: (matchId, now) => Promise<EngineOutcomeSummary>`), nunca como
     almacén. Un caso lo afirma sobre el tipo que publica el compilador para los
     puertos del panel: **ningún miembro de ese tipo es un almacén**.
  6. **Residuo declarado dentro del criterio**: esto **cierra el disparador de
     F-SPEC-013-11 para este llamante y no cierra el residuo** —`composeCyclePorts`
     sigue siendo superficie pública—. **Destino: EPIC-MEJORA**; **disparador: sin
     cambios**, la próxima spec que ya tenga que tocar `src/decide/cycle.ts` por un
     motivo propio.

- **CA-3 — RN-10: la acción se archiva antes de parsearse, con lista blanca total,
  y el motivo va verbatim (RN-10, D-5, ADR-024 §6, ADR-016).**
  Dado un envío del panel, entonces:
  1. **Lista blanca total, no lista negra.** El objeto archivado contiene
     **exactamente** las claves de una lista exportada con nombre y su motivo al
     lado —`operator_id`, el `match_id` o el `alert_id`, la acción, el `status` y
     el marcador propuestos, el motivo, el `issued_at` del vale y el `submitted_at`—
     y **ninguna otra**. El aserto es sobre el conjunto de claves **recorrido en
     profundidad**, no sobre las prohibidas.
  2. **Ni cabeceras, ni IP, ni user-agent, ni cookie, ni valor de sesión** aparecen
     en el objeto ni en ninguna fila persistida. Un caso lo afirma con un envío
     sintético cuyas cabeceras llevan valores reconocibles que no aparecen en
     ningún byte.
  3. **Control positivo:** añadir una clave prohibida al envío pone rojo un caso
     nombrado; quitar una clave de la lista blanca pone rojo otro.
  4. **El motivo se archiva verbatim, byte a byte.** Un caso compara los bytes con
     los recibidos, con un texto que lleva emoji, acentos galegos y un salto de
     línea. Es lo que impide que la redacción destruya el sustrato de RN-10.
  5. El archivo pasa por **`captureThenParse`**, la única vía sancionada crudo →
     parser, y un caso afirma el **orden** con dobles que registran instantes: el
     `put` termina **antes** de que se construya la `Observation`.
  6. La `Observation` tiene `raw_ref` **del objeto archivado**, y ese `raw_ref`
     existe en el raw store.
  7. Las claves empiezan por `operador/` —**un solo prefijo para la purga**— y su
     **segundo segmento** es uno de una lista cerrada exportada con nombre. Es la
     misma irregularidad declarada que `corresponsal/` y por el mismo motivo: ahí
     donde toda fuente automática escribe un `competition_id`, aquí va el tipo de
     acción. Un caso afirma la lista y que **ninguna clave del archivo del operador
     lleva un `competition_id` real en esa posición**.
  8. **`docs/procedimientos/jornada-de-medicion.md` nombra el prefijo `operador/`
     entre los que la purga borra.** No es documentación de cortesía: sin esa línea
     el archivo del panel sobrevive a su jornada y ADR-020 §2 se incumple por
     omisión, **sin que ningún test se ponga rojo**.

     **Y al escribir este subpunto se encontró que el runbook tampoco nombra
     `corresponsal/`** —cero apariciones, medido el 2026-09-03—, así que hoy el
     archivo del bot tiene el mismo agujero y ADR-023 §2 depende de que alguien se
     acuerde. **La misma edición cierra los dos**, así que se hace aquí en vez de
     inventariarla: es un renglón de runbook, no un cambio de comportamiento, y
     `docs/procedimientos/` no es artefacto de ninguna spec cerrada, así que **no
     hay ninguna enmienda de ADR-015 que escribir**. Un caso afirma que el runbook
     nombra **los dos** prefijos.
  9. **Residuo declarado dentro del criterio** (ADR-016 §6): la lista blanca **no
     alcanza al contenido del propio motivo** — si la persona escribe ahí el nombre
     de un árbitro, ahí se queda. Es inevitable y **se declara para que nadie lea
     el criterio como si prometiera más**.

- **CA-4 — RN-12: la cadena llega hasta el operador y su motivo, sin tocar el
  modelo canónico (RN-12, D-6, RN-13).**
  Dada una `Decision` nacida del panel, entonces:
  1. Un caso la recorre entera: `Decision.supporting_observation_ids` →
     `Observation` → `raw_ref` → objeto crudo → `operator_id` **y motivo**, y los
     dos están.
  2. **El motivo es obligatorio y no vacío**: un envío con motivo vacío o solo
     espacios se rechaza **antes de archivar nada** y deja **cero** objetos crudos
     y **cero** `Observation`.
  3. **`src/model/` no cambia.** Un caso afirma que ningún esquema de `src/model/`
     tiene un campo nuevo y que `migrations/0008` **no añade ninguna columna** a
     `observations`, `decisions`, `matches`, `competitions`, `teams` ni `alerts`.
     El test de paridad de SPEC-001 CA-14 pasa sin tocar una aserción.
  4. **RN-13, comprobado y no supuesto:** tras dos correcciones seguidas sobre el
     mismo partido hay **dos** filas en `observations` y las `Decision` anteriores
     siguen ahí con su `version`. Un caso intenta un `update` sobre `observations`
     y sobre `decisions` y recibe el error del trigger.

- **CA-5 — Lo que el operador puede hacer, y cómo lo trata el motor (RN-01, RN-04,
  RN-06, RN-02, ADR-021 §8). Contra la base.**
  Dado un partido con `Decision` vigente, entonces:
  1. **Bajar un marcador.** Con una fuente automática que dice otra cosa, la
     `Decision` sale con `rule: 'RN-01'` —el operador resolvió una discrepancia por
     precedencia— y con **el marcador del operador**. Sin ninguna otra fuente que
     le contradiga, sale con `rule: 'RN-04'`. Los dos casos, contra la base.
  2. **Aplazar y suspender.** `postponed` y `suspended` se aplican y se publican, y
     un caso lo afirma **como la única vía que hoy existe**: RN-06 los reserva a la
     fuente oficial o a un humano y la oficial no es capturable (ADR-008 §1).
  3. **Corregir un estado equivocado.** Un `finished` que una fuente cerró antes de
     tiempo vuelve a `live` desde el panel (ADR-021 §8.3: el humano puede llevar el
     partido a cualquiera de los cinco estados). Un caso afirma que **la misma
     transición desde `ceroacero` se ignora**, que es la otra mitad de §8.3.
  4. **Lo que publica el panel sale confirmado, nunca provisional.** Un caso afirma
     `provisional === false` en la `Decision` resultante, por la primera vía de
     RN-02 con peso 1.0. Es la razón de que esta spec exista.
  5. **Un salto de más de 2 goles del operador no se retiene** (RN-04, aclaración
     del 2026-09-02; ADR-021 §8.1): un `0-4` desde el panel se publica en el acto.
     Un caso lo afirma, y afirma también que **el mismo salto desde `ceroacero` sí
     se retiene**.
  6. **Ratificar lo vigente.** Una `Observation` del operador con el mismo estado y
     el mismo marcador de la `Decision` vigente **emite `Decision` nueva** y su
     cualificador pasa de `provisional` a `confirmado`. Es la operación que hace
     verdadera la frase «el panel es la única ruta a un marcador confirmado», y es
     la que más se va a usar: un caso afirma que **basta con ella**, sin escribir
     ningún marcador.
  7. **Nada de esto es un `UPDATE`:** cada operación deja **una** fila nueva en
     `observations` y **una** en `decisions`, y ninguna anterior cambia.

- **CA-6 — La bandeja: alertas abiertas, acuse trazable, `alerts` intacta, y
  `migrations/0008` (ADR-021 §5, ADR-024 §7, RN-05, RN-07, ADR-006).**
  Dado el motor escribiendo alertas como ya lo hace, entonces:
  1. **`migrations/0008_admin.sql`** crea `alert_acks` y `operator_actions`, las
     dos **append-only con `reject_amendment`**, como `alerts`, `calendar_loads` e
     `ingest_attempts`. Sin rollback (ADR-006). Un caso afirma que un `update` y un
     `delete` sobre las dos reciben el error del trigger.
  2. **`alerts` no se toca**: ni columna nueva, ni trigger cambiado, ni `update`, ni
     `delete`. Un caso lo afirma **leyendo el esquema de la tabla**, no el código.
  3. `alert_acks` lleva `alert_id` (con `unique`), el instante y el `raw_ref` de la
     acción, y **no lleva `operator_id`**: vive en el objeto crudo, un solo régimen
     para «quién hizo esto» (§4). Un caso afirma que **ninguna columna de las dos
     tablas nuevas es capaz de albergar un identificador de persona**, leyendo el
     esquema.
  4. **«Abierta» se calcula, no se guarda**: una alerta está abierta si no tiene
     acuse. Un caso afirma que no hay ninguna columna de estado en ninguna de las
     dos tablas.
  5. El listado devuelve las alertas de los partidos de las **jornadas declaradas**,
     con su regla (`RN-05` / `RN-07`), su `reason`, su instante y su partido,
     ordenadas por instante descendente, **y separadas en abiertas y reconocidas**.
  6. **Reconocer no publica nada**: cero `Observation`, cero `Decision`. RN-05 dice
     que el conflicto no se publica, y acusarlo tampoco lo publica.
  7. Reconocer dos veces la misma alerta es **idempotente**: la segunda vez no
     escribe fila y contesta lo mismo.
  8. **El acuse es de una fila, no de una condición.** Si la condición vuelve con
     otro motivo, el motor escribe otra fila en `alerts` (`reason` es su huella) y
     **esa vuelve a aparecer abierta**. Un caso lo ejerce entero: alerta → acuse →
     alerta nueva con otro motivo → aparece abierta.

- **CA-7 — El vale de acción: CSRF y cronómetro con un solo mecanismo
  (ADR-024 §4).**
  Dado un formulario servido por el panel, entonces:
  1. Lleva un vale firmado con HMAC sobre `{operator_id, action, target,
     issued_at}`; **sin vale válido la operación se rechaza sin archivar nada y sin
     dejar fila en `observations`**.
  2. Un vale **de otro operador**, **manipulado**, o **de más de `TICKET_TTL`** ⇒
     rechazo con **error nombrado y distinguible**, uno por caso.
  3. `issued_at` del vale es el `started_at` que se registra (CA-8). Un caso lo
     afirma comparando la fila de `operator_actions` con el vale emitido.
  4. **El vale no viaja en la URL.** Un caso afirma que ninguna ruta del panel lo
     acepta como parámetro de consulta, y que ninguna vista lo escribe en un `href`.
  5. **Declarado dentro del criterio: el vale NO es de un solo uso.** Detectarlo
     exigiría estado durable, que es lo que ADR-024 §3 evita. Lo que lo hace
     inofensivo es que el id de la `Observation` **se deriva del objeto crudo**, así
     que un reenvío idéntico dentro del TTL **no duplica nada**: un caso lo ejerce y
     afirma **una** fila. **Destino: EPIC-MEJORA**; **disparador: el día que el panel
     tenga una operación cuyo efecto no sea idempotente.**

- **CA-8 — La cuarta cifra queda medible, y el criterio declara que es una cota
  inferior (ADR-024 §8, ADR-019 §5, criterios de éxito de EPIC-002).**
  Dado el panel operando, entonces:
  1. **`operator_actions`** registra una fila por acción que llegó **con sesión y
     vale válidos**, con su tipo, su objetivo, `started_at` (el `issued_at` del
     vale), `submitted_at`, el desenlace y el `raw_ref`.
  2. Una acción **rechazada por una razón del dominio** —motivo vacío, partido
     fuera de jornada— **sí deja fila**, con su desenlace: costó tiempo de operación
     y la cifra lo tiene que ver. Una petición rechazada **antes** de la sesión o
     del vale **no deja ninguna**: la tabla mide operación, no a quien llama a la
     puerta.
  3. Un caso computa `submitted_at − started_at` sobre un escenario sintético de
     varias acciones y obtiene el total.
  4. **Declarado dentro del propio criterio, y es lo que la épica exige** («el
     informe declara junto a cada una qué la degrada»): **esto es una cota
     inferior**. No cuenta leer la pantalla, ni esperar, ni decidir sin enviar, ni
     el tiempo entre dos acciones, ni la vuelta al bot o al campo. **La cuarta cifra
     sigue necesitando el cronómetro** que la tabla de métricas de EPIC-002 ya pide.
     Lo que esta tabla evita es reconstruir a mano lo único que sí es exacto.
     Quien publique la cifra **tiene que publicar esta frase al lado**.

- **CA-9 — Galego por defecto, castellano con paridad, y ningún literal escrito en
  el código (D-2, ADR-022 §8 por analogía).**
  Dado el panel, entonces:
  1. Existen `src/i18n/admin-bundle.ts` (el contrato) y `src/i18n/admin.ts` (el
     resolutor), y los literales viven en `gl.ts` y `es.ts` bajo un espacio de
     nombres nuevo, **con paridad impuesta por el tipo del contrato**, como
     hicieron SPEC-005, SPEC-006 y SPEC-015.
  2. **La lengua sale de la URL, nunca del cliente**: `/admin` en galego,
     `/es/admin` en castellano, exactamente como el sitio público
     (`src/i18n/site.ts`). Un caso afirma que ningún módulo de `src/admin/` lee
     `Accept-Language`.
  3. **`AdminText` es una cadena con marca** cuyo constructor no se exporta, como
     `BotText`: **un literal escrito dentro de `src/admin/` no compila**. Control
     positivo: un fichero de prueba de tipo (`.test-d.ts`) con `@ts-expect-error`.
  4. **`tests/site/no-hardcoded-literals.test.ts` sigue verde con las rutas nuevas
     dentro de su alcance y sin añadir ninguna excepción.**
  5. **Los cinco estados salen de `statuses`**, que ya existe (SPEC-015): **no se
     escribe un segundo juego**. Un caso afirma que `src/admin/` no contiene ningún
     literal de estado.
  6. **Los cuatro cualificadores existen en las dos lenguas.** El panel es el
     primer artefacto que le enseña un cualificador a una persona, y `src/i18n/es.ts`
     **no tiene hoy `qualifiers`** — es el residuo de SPEC-015 con su disparador
     escrito, y este es el disparador. El criterio se cumple con lo que el gate
     decida (nota §3): **traducirlos**, o **dejarlos en galego declarándolo en
     `dominio.md`**. **Precondición de este subpunto y solo de éste: no se
     implementa hasta que el gate lo firme y `sdd-arquitecto` lo escriba en el
     glosario**, como CA-5 de SPEC-015 esperó al proveedor. Los otros doce
     criterios avanzan sin eso.
  7. **La paridad se impone con un tipo, no con un test de longitud**: un caso
     afirma que quitar una clave de `es.ts` **no compila**.

- **CA-10 — El panel se dibuja con el sistema de diseño, sobre el suelo de
  ADR-025, y sin heredar lo que el sistema no cumple (ADR-026, ADR-025 §2, §3,
  §4.1 y §5, ADR-013 §1..§6, `dominio.md`, EPIC-004 entradas 1, 3 y 5).**

  > **Reescrito el 2026-09-03 por ADR-026**, que supersede parcialmente a
  > ADR-025 §4. La letra anterior decía que la hoja del panel «no comparte una
  > línea con `docs/diseno/`»; ahora **deriva de él**. Se puede reescribir porque
  > **esta spec no está cerrada** —ADR-015 gobierna las cerradas—. Lo que **no**
  > cambia es el suelo: ADR-025 §2 y §3 siguen enteros, y el sistema de diseño
  > **no los cubre**, así que no los supersede.

  Dado el marcado y la hoja de estilos del panel, entonces:

  **Los tokens (ADR-026 §3)**
  1. **Un solo domicilio.** Existe `src/design/` con la definición única, y **el
     panel no declara ni un color, ni una familia tipográfica, ni un radio, ni un
     valor de escala por su cuenta**: los toma de ahí. Un caso recorre la hoja del
     panel y afirma que **todo valor de color y de familia es una referencia a un
     token**, no un literal. Control positivo: escribir un `#rrggbb` en la hoja
     pone rojo un caso nombrado.
  2. **Paridad con el sistema, y divergencias declaradas** (ADR-026 §3.3). Un caso
     afirma, **token a token**, que el valor del código es el valor de
     `docs/diseno/_tokens.css`, contra una **tabla de correspondencia declarada**
     (nombre en código → nombre en el sistema) y una **lista cerrada de
     divergencias con su motivo al lado**. **Un token de `_tokens.css` que no esté
     ni copiado ni declarado como divergencia es rojo.** Controles positivos:
     cambiar un valor sin declararlo pone rojo un caso; vaciar la tabla de
     correspondencia pone rojo otro.
  3. **Las divergencias son exactamente las tres que ADR-026 §3.4 motiva, y
     ninguna más**: `--fg-prov` no existe en el código, no hay `@import` de
     fuentes, y los nombres de token están **en inglés**. Un caso afirma la lista
     entera.
  4. **Residuo declarado dentro del criterio** (ADR-016 §6, obligatorio, y
     ADR-026 §3.3 lo escribe primero): **la paridad solo cubre color y familia
     tipográfica**, que es lo único que `_tokens.css` declara. **El espaciado, los
     radios, la escala tipográfica y la densidad no se pueden comprobar contra
     nada** —en el sistema viven en prosa y en hexadecimales en línea que el
     propio sistema no respeta—, así que ahí la adherencia la sostiene **la
     revisión humana, no un test**. **Destino: EPIC-004**, convertir sus escalas
     en tokens; **disparador: el deshielo.**
  5. **`docs/diseno/` no se edita** (ADR-026 §3.7): sigue siendo artefacto de
     EPIC-004, que está congelada. El verificador lo comprueba en el diff.
  6. **Las fuentes se autoalojan; el panel no le pide nada a ningún tercero**
     (ADR-026 §3.5). Un caso afirma que **ni la hoja ni el marcado nombran
     `fonts.googleapis.com`, `fonts.gstatic.com` ni ningún otro host externo**, y
     que no hay ningún `@import` de una URL. Es la misma afirmación que CA-13.2
     hace sobre el grafo, en la otra capa: **el panel no genera ninguna petición a
     un tercero, ni desde el servidor ni desde el navegador de quien lo abre.**

  **Lo que NO se hereda del sistema (ADR-026 §4)**
  7. **Ningún cualificador se distingue apagándolo, y los dos llevan etiqueta**
     (ADR-026 §2 y §4.1, ADR-013 §2 y §6). Un caso afirma que `provisional` y
     `confirmado` se sirven **con el mismo color de texto** —el principal— y que
     **los dos llevan etiqueta de texto, `confirmado` incluido**: el sistema lo
     deja mudo («el normal no se anuncia») y aquí lo normal es lo otro. Y afirma
     que **ningún color que porte un dato o un cualificador baja de 4.5:1** sobre
     su fondo, **calculado en el test y no estimado**. Control positivo: apagar o
     enmudecer uno de los dos pone rojo un caso nombrado. **Es la entrada 1 del
     inventario de EPIC-004, contestada antes de escribir la primera línea de
     CSS.**
  8. **`confirmado` no se pinta con el acento de marca** (ADR-026 §2.3). Un caso
     afirma que el token de marca no aparece en ninguna regla que porte un
     cualificador.
  9. **Estados y cualificadores se nombran con su literal, nunca con un glifo ni
     con una abreviatura** (ADR-026 §4.2 y §4.3, `dominio.md`, D-2). El sistema usa
     `?` para *pendente de confirmar*, `!` para *sen sinal* y `FIN`/`APR`/`DESC`
     para los estados; **ninguno de esos cinco está en el glosario y ninguno es
     traducible**. Un caso afirma que todo estado y todo cualificador visible sale
     de `src/i18n/` con el literal que `dominio.md` registra, y que **`live` se
     dice *En xogo*, nunca *Directo*** (ADR-026 §4.4).

  **El suelo de ADR-025, que el sistema no cubre**
  10. **Foco visible** (ADR-025 §2, **intacto**; el sistema tiene cero `:focus`,
      `outline`, `tabindex` y `aria-*` — ADR-026 §4.6): la hoja declara
      `:focus-visible` con indicador de ≥ 2 px y contraste ≥ 3:1 contra su fondo,
      calculado en el test y **no estimado**; no existe ningún `outline: none` sin
      sustituto; ningún `tabindex` positivo; y `Escape` sale del paso de
      confirmación devolviendo el foco al control que lo abrió. Control positivo:
      quitar el sustituto pone rojo un caso.
  11. **Toque ≥ 44 × 44 px** en todo control interactivo, con el valor como
      **constante nombrada en un solo sitio**, y campos de texto con fuente
      ≥ 16 px (ADR-025 §3, **intacto**). **El sistema declara una concesión por
      debajo del suelo y su botón primario sale a ≈43 px** (ADR-026 §4.5):
      **gana ADR-025 §3**, y un caso lo afirma sobre los controles del panel.
  12. **Ningún estado ni cualificador se distingue solo por color** (ADR-013 §2):
      un caso recorre el árbol renderizado y afirma que para **cada** estado y
      **cada** cualificador presente hay un nodo de texto que lo nombra — **en
      todas las anchuras**, que es donde el sistema falla (ADR-026 §4.1).
      **Dígitos tabulares** en marcador, hora y minuto (ADR-013 §3). **Ninguna
      imagen**: ni `<img>` ni fondo de imagen (ADR-013 §4 y §5, y
      `FOUNDATION.md`, no-negociable).
  13. **La hoja es propia y `src/app/globals.css` no se edita** (ADR-025 §4.1
      **intacto**, y lo que sobrevive de §4.2): la hoja del panel vive en un
      fichero suyo, se alcanza **solo** desde las rutas del panel, y **no deriva de
      `globals.css`**. Un caso afirma que ningún módulo de `src/admin/` importa CSS
      de `src/app/` ni de `src/site/`; el verificador comprueba en el diff que
      `globals.css` sigue intacto.

  **Lo que solo ve un navegador**
  14. **Comprobado a mano y con captura** (ADR-025 §5, **intacto**): a
      **360 × 640**, el tablero y una corrección se recorren **solo con teclado**
      —llegar, activar, escribir, enviar, cancelar con `Escape`—, con **el foco
      visible en cada parada**, sin desplazamiento horizontal del cuerpo, y las
      capturas van a `_qa/SPEC-017/`. **Declarado dentro del criterio
      (ADR-016 §6): los subpuntos 1–13 son estáticos y no ven un diseño calculado;
      éste es el único que ve el navegador, y lo hace una persona.** **Destino:
      spec futura; disparador: la primera spec que construya la interfaz del
      marcador** (ADR-025 §5).
  15. **Residuo declarado dentro del criterio** (ADR-016 §6, obligatorio): **el
      sistema de diseño no trae ni un solo componente de formulario** —cero
      `<input>`, `<textarea>`, `<select>`, `<button>`, `<label>`— **ni ningún
      estado de foco**, y el panel es todo formularios (ADR-026 §4.6). Lo que se
      hereda es el **lenguaje** —paleta, tipografía, escala, densidad, y los tres
      componentes que sí sirven: el banner de alerta que el propio sistema dibuja
      «para el panel del operador», el panel de traza y el historial de
      decisiones—; **los controles hay que inventarlos dentro de ese lenguaje, y
      eso no es aplicar un sistema, es extenderlo**. Este criterio **no promete**
      que el panel salga dibujado del sistema, solo que no se aparte de él.
      **Destino: EPIC-004**, cuya entrada 3 sigue abierta sobre el artefacto;
      **disparador: el deshielo.**


- **CA-11 — El panel nace apagado, y la llave es el partido, no el reloj
  (ADR-024 §9, ADR-019 §3, ADR-020 §2).**
  Dado el despliegue tal como esta spec lo entrega, entonces:
  1. Con `ADMIN_OPERATORS` vacía **no entra nadie**, y con `MEASUREMENT_WINDOWS`
     vacía **el tablero está vacío y ninguna operación es posible**. Un caso lo
     afirma con las listas de producción, no con dobles: **SPEC-017 entrega un panel
     apagado**, como SPEC-012 entregó un cron que no pide nada y SPEC-015 un bot que
     no recoge nada.
  2. El panel **solo opera sobre partidos cuyo `kickoff` cae dentro de una jornada
     de medición declarada**. Un partido fuera de todas ⇒ **error con nombre, cero
     archivo, cero filas**. No hay modo degradado.
  3. **La llave se aplica al partido, no al instante de la acción**, y un caso lo
     ejerce: con el reloj **después** del `to` de la jornada, una corrección sobre
     un partido de esa jornada **funciona**. Es lo contrario que en el bot
     (ADR-022 §7) y el motivo está escrito en ADR-024 §9: allí la llave acota cuándo
     se recoge texto libre; aquí protege el **ancla de retención**, y el operador
     tiene que poder corregir el lunes lo que se cerró mal el sábado.
  4. Todo lo que el panel archiva **cuelga de la jornada de su partido** y cae bajo
     la purga de ADR-020 §2, con el prefijo de CA-3.7 y la línea de runbook de
     CA-3.8.

- **CA-12 — Lo que el operador ve para poder arbitrar (RN-01, ADR-021 §6, D-8).**
  Dado el tablero, entonces:
  1. Por cada partido de las jornadas declaradas: los **nombres canónicos RFGF**
     (`dominio.md`, no se traducen), el `status` y el marcador de la `Decision`
     vigente, **su cualificador calculado con `qualifierOf`** de `src/decide/`
     —nunca reimplementado—, el instante de la última observación, y si tiene
     alertas abiertas.
  2. En el detalle de un partido: **las `Observation` de cada fuente** con su
     `observed_at` y su `confidence`, y **el log de `Decision`** con su `version`,
     su `rule` y sus apoyos. Es la letra de RN-01 —«arbitra desde el panel, **con el
     contexto de todas las fuentes y del histórico delante**»— y no es adorno: sin
     eso el peso 1.0 se ejerce a ciegas.
  3. **El tablero se ordena por lo que necesita a una persona** —alerta abierta,
     después *sen sinal*, después `live`, después el resto—, **no por cualificador**.
     Un caso afirma el orden.
  4. **Declarado dentro del criterio, porque despierta un inventario congelado:**
     esta ordenación **no contesta la entrada 1 del inventario de EPIC-004** —cuál
     de los dos cualificadores es el normal en la pantalla del marcador—. En un
     panel ninguno de los dos es decoración y la pregunta no se plantea; en el
     marcador sí, y **la contesta la spec del snapshot**. **La entrada conserva su
     disparador.**

- **CA-13 — Los puntos de entrada nuevos, con su motivo, y el panel no le pide
  nada a nadie (ADR-016 §3.2, SPEC-009, RN-11).**
  Dado el código de las rutas nuevas, entonces:
  1. Cada ruta nueva aparece en **`ENTRY_POINTS`** (`tests/polite/support/capability.ts`)
     **con su motivo escrito**, y **la suite cerrada de SPEC-009 pasa sin tocar una
     aserción**.
  2. **El grafo de las rutas del panel no alcanza `src/polite/http.ts`.** El panel
     no le pide nada a ningún tercero, y esa es la razón por la que **RN-11 no
     alcanza a esta spec** — el criterio lo dice para que nadie lo lea al revés.
     Control positivo: añadirle una importación de la puerta de salida pone rojo un
     caso.
  3. La respuesta se construye con `new Response(JSON.stringify(…), …)` y **nunca**
     con `Response.json`, que la lista cerrada de SPEC-009 no permite.
  4. Los ficheros de ruta **no tienen lógica**: delegan enteros, como
     `src/app/api/cron/ingest/route.ts` y `src/app/api/telegram/webhook/route.ts`.
     Un caso afirma que no importan nada de `src/db/`, `src/raw/` ni `src/decide/`.

## Entidades y reglas afectadas

**Reglas de negocio** (`docs/fundacion/reglas.md`, no se duplican aquí):

- **RN-01** — el corazón de la spec: peso 1.0, **precedencia sobre la RFGF**, y
  «operador ≠ corresponsal». Y su frase menos citada, que es un requisito de
  interfaz: el operador «arbitra desde el panel, **con el contexto de todas las
  fuentes y del histórico delante**». CA-5, CA-12.
- **RN-02 / RN-03** — lo que publica el panel sale **confirmado**, por la primera
  vía de RN-02 con peso 1.0. CA-5.4, CA-5.6.
- **RN-04** — monotonía, y la excepción humana; y la aclaración del 2026-09-02: la
  retención del salto no alcanza al peso ≥ 0.9. CA-5.1, CA-5.5.
- **RN-05** — el conflicto no se publica, y **acusarlo tampoco lo publica**. CA-6.6.
- **RN-06** — `postponed`/`suspended` solo por fuente oficial **o humano**; hoy la
  oficial no es capturable (ADR-008 §1), así que **este panel es la única vía**. Y
  la aclaración del 2026-09-02: el humano puede llevar el partido a cualquiera de
  los cinco estados. CA-5.2, CA-5.3.
- **RN-07** — el silencio genera alerta al panel; ésta es la bandeja. CA-6.
- **RN-08 / D-3** — el motor es la única puerta, **sin excepción para la fuente de
  más peso**. CA-2.
- **RN-09** — **no muerde aquí**, y se dice para que nadie lo suponga: en esta spec
  **no hay ningún LLM**. Ni parseo, ni propuesta, ni alias.
- **RN-10 / D-5** — archivo antes de parsear, **sin excepción por fuente**, y con
  el panel nombrado en `dominio.md` como el caso que más importa. CA-3.
- **RN-11** — **no alcanza a esta spec**, y CA-13.2 lo afirma con un mecanismo: el
  panel no le pide nada a ningún tercero.
- **RN-12 / D-6** — la cadena entera hasta el `operator_id` y **el motivo**, que es
  la mitad que ninguna columna lleva. CA-4.
- **RN-13** — las `Observation` no se editan: una corrección es una `Observation`
  nueva, y «deshacer» es corregir otra vez. CA-4.4, CA-5.7.

**Decisiones locked** (`FOUNDATION.md`): **D-2** (CA-9), **D-3** (CA-2), **D-5**
(CA-3), **D-6** (CA-4), **D-8** (densidad y legibilidad: CA-10, CA-12).

**ADRs**: **ADR-024**, **ADR-025** y **ADR-026**, que esta spec ejecuta —y
ADR-026 supersede parcialmente a ADR-025 §4, por lo que **CA-10 se reescribió el
2026-09-03**: qué cae y qué queda está en ADR-026 §5, y lo que el sistema de
diseño **no** cumple y por tanto no se hereda, en ADR-026 §4. **ADR-004** (sin
proceso vivo, sin disco: por eso la sesión no tiene tabla y el cronómetro va en el
vale), **ADR-006** (instantes ISO, sin ORM, migraciones numeradas), **ADR-008 §1**
(la premisa entera), **ADR-009 §3** (git no se purga: el precedente que prohíbe
versionar el secreto), **ADR-013** (§2, §3, §4, §5, §6 obligan en CA-10),
**ADR-015** (cómo se enmienda una spec cerrada — y **CA-1.10 explica por qué aquí
no hace falta ninguna enmienda**), **ADR-016** (la forma obligatoria de CA-1, CA-2
y CA-13, y la honestidad de CA-3.9, CA-7.5, CA-8.4, CA-10.7 y CA-12.4),
**ADR-017** (el calendario declarado es la lista de partidos), **ADR-019 §3 y §5**
(las jornadas declaradas y el registro append-only de los actos de una pieza),
**ADR-020 §2 y §4** (la retención anclada a la jornada y el objeto colgante),
**ADR-021 §3, §5, §6 y §8** (los dos disparadores, la alerta sin acuse, el
cualificador derivado y las cuatro lecturas que CA-5 ejerce), **ADR-022 §2, §3, §7
y §9** (los cuatro patrones que esta spec reusa, y el uno del que se aparta con
motivo escrito).

**Dominio** (`docs/fundacion/dominio.md`): `Observation`, `Decision`, `Match`,
`raw store`, `raw_ref` —cuya nota nombra explícitamente al panel—, **operador**,
**corresponsal**, **alerta**, **motor de decisiones**, **jornada de medición
declarada**, **calendario declarado**, los cinco estados y **los cuatro
cualificadores**, a los que esta spec **añade su literal castellano si el gate así
lo decide** (nota §3), porque el glosario manda añadir un término **antes** de
usarlo.

## Fuera de alcance

Aparcado a propósito, no por descuido. Cada cosa con su destino y su disparador.

- **El snapshot y la página mínima por polling.** El panel **no enseña el marcador
  al público**: es una herramienta de una persona detrás de una sesión. Es la
  **spec siguiente**, y es ella la que contesta la entrada 1 del inventario de
  EPIC-004.
- **Las cuatro cifras.** Esta spec construye el instrumento que hace medible la
  cuarta; **no mide ninguna**, y CA-8.4 declara además que lo que deja es una cota
  inferior. **Destino: la spec de instrumentación.**
- **Usuarios, roles y permisos.** Hay un rol, «operador», y quien entra lo tiene
  entero. Un segundo rol con menos poder es producto, no medición. **Disparador: el
  segundo operador**, que es el mismo que reabre la sesión.
- **Revocación de sesión, límite de intentos y segundo factor.** Declarados en
  ADR-024 §3 y aceptados con las mismas condiciones que la ceremonia de purga de
  ADR-009 §4: un operador, que es el autor, y esto es medición. **Destino: ADR
  nuevo, no un parche**; **disparador: el segundo operador, o el día que el panel se
  use fuera de una jornada de medición declarada.**
- **Un navegador automatizado.** Hoy no hay ninguno instalado; meterlo toca la
  partición del runner de SPEC-014, el coste de la suite y la CI que no existe.
  **Destino: spec propia**; **disparador: la primera spec que construya la interfaz
  del marcador** (ADR-025 §5).
- **Descongelar EPIC-004.** **ADR-026 le cambia el alcance, no la congela menos**
  (ADR-026 §6): salen de ella el panel y los tokens como código, y **entra** la
  reparación del propio artefacto —escalas como tokens, foco, componentes de
  formulario, la etiqueta de `provisional` en las tres vistas, y su vocabulario
  alineado con `dominio.md`—. Las entradas 2, 3, 4 y 6 de su inventario **siguen
  abiertas**; la 1 la cierra ADR-026 §2. **Quien escribe el cambio en `_epica.md`
  y en `docs/roadmap.md` es `sdd-producto`, no esta spec.**
- **Arreglar `docs/diseno/`.** Está congelado (ADR-026 §3.7). Las **seis
  desviaciones** que ADR-026 §4 enumera se resuelven **en el producto**, no en el
  artefacto, así que durante un tiempo el sistema y el panel dirán cosas distintas
  en seis puntos concretos — enumerados ahí para que sea consultable y no
  sorprendente. **Destino: EPIC-004; disparador: el deshielo.**
- **Repintar `src/app/globals.css`.** ADR-013 punto 3 negó el permiso, **ADR-025
  §4.1 sigue intacto** y ADR-026 §1 lo repite: el sitio público de EPIC-003 queda
  **fuera** del sistema de diseño hasta que exista la spec que lo migre. Ni una
  línea.
- **Un tercer namespace de i18n para el marcador.** Los cualificadores que esta
  spec necesita en castellano son **los que ya existen en galego**; el bundle del
  marcador es de la spec del snapshot.
- **Notificaciones hacia el operador** —«tu partido lleva 15 min sin señal»—. El
  panel se mira; no avisa. Empujar exige decidir canal, a quién y cuándo. **Destino:
  spec futura**; **disparador: el día que el operador no pueda estar mirando.**
- **Editar el calendario o dar de alta un partido desde el panel.** El calendario es
  **declarado** y se carga con una CLI (ADR-017, SPEC-010). Un partido que no está
  en él no se corrige: se declara. **Disparador: el día que un partido aparezca
  jugándose y no esté en el calendario declarado** — que es un fallo de la carga,
  no del panel.
- **Un mecanismo automático de purga.** Sigue siendo la ceremonia manual de
  ADR-009 §4 con su acuse escrito. **F-SPEC-001-1 se estrecha por cuarta vez y no
  se cierra**; el archivo del panel entra en el régimen de la jornada (ADR-020 §2)
  y no inventa uno nuevo.
- **Cerrar el residuo F-SPEC-013-11.** Esta spec vuelve a **contestar a su
  disparador** sin cerrarlo (CA-2.6). **Destino: EPIC-MEJORA.**
- **Unificar las dos implementaciones de comparación en tiempo constante.**
  `constantTimeEquals` vive en `src/bot/webhook.ts` (SPEC-015, `hecho`) y el panel
  no puede importarla sin arrastrar el grafo entero del bot a una ruta suya.
  **Destino: EPIC-MEJORA**; **disparador: la tercera.**
- **Dos operadores a la vez sobre el mismo partido.** El motor lo soporta —son dos
  `Observation` de la misma fuente— y el aplicador ya reintenta una vez ante un
  conflicto de versión (ADR-021 §3). **El spike tiene uno.** **Disparador: el
  segundo operador.**

## Notas para el gate humano

**§1. Lo que estás firmando, en una frase.** Un panel que **hoy no se puede
encender**: `ADMIN_OPERATORS` nace vacía, `ADMIN_SESSION_SECRET` no existe y
`MEASUREMENT_WINDOWS` sigue vacía, así que no entra nadie y no hay ningún partido
sobre el que operar. Firmar esta spec es firmar el **instrumento**; encenderlo es
un acto posterior con su propia ceremonia. Es la misma forma con la que se firmaron
SPEC-012 y SPEC-015.

**§2. La decisión que más conviene mirar: la sesión.** Es lo más débil que hay en
el proyecto —secreto compartido, sin límite de intentos, sin revocación, sin
segundo factor— y está delante de **la capacidad de publicar un marcador
confirmado y de aplazar un partido**. La descarté con proveedor de autenticación
(mete un tercero y un encargado del tratamiento nuevo, con todo lo que ADR-023 §3
dejó escrito de lo que cuesta uno), con la identidad de Telegram (ata la autoridad
de 1.0 a un tercero y **confunde justo lo que RN-01 separa**), y con la protección
de despliegue de Vercel (**no es código, así que ningún criterio la puede afirmar
y ningún test se pone rojo si alguien la apaga**). Lo que la hace aceptable hoy es
que **hay un operador y eres tú**. Si eso te parece poco, dilo ahora: el cambio es
de ADR-024 §3 y de CA-1, no una reescritura.

**§3. La pregunta bloqueante, y es de lengua: ¿los cuatro cualificadores se
traducen al castellano?** SPEC-015 la dejó con disparador escrito —«el primer
artefacto que enseñe un cualificador a una persona en castellano»— y **este panel
es ese artefacto**: `src/i18n/es.ts` no tiene `qualifiers` y el tablero enseña uno
por partido. Las dos lecturas son defendibles: `dominio.md` los titula «visibles en
UI, **en galego**», y D-2 exige que el castellano exista completo. **Recomendación
de `sdd-lingua`, registrada en SPEC-015 §4: traducirlos, porque no son nombres
propios.** Mi recomendación coincide, con un matiz: *sen sinal* y *pendente de
confirmar* describen un estado, no una marca, y un operador leyendo en castellano
va a leer «Sen sinal» como un error tipográfico. **Bloquea solo CA-9.6**; los otros
doce criterios avanzan sin esto. Si firmas, `sdd-arquitecto` escribe la fila en
`dominio.md` antes de que empiece la implementación.

**§4. Lo segundo que es juicio mío y puedes tumbar: dos ADR y no uno.** ADR-025 —el
suelo de interfaz— podría haber sido una sección de ADR-024. Lo saqué por un motivo
concreto: **la spec del snapshot lo necesita igual**, y una regla que dos specs
necesitan citada desde dentro de una de ellas es exactamente la patología que hizo
nacer EPIC-004. Además EPIC-004 declara que su entrada 3 «bloquea cualquier spec de
interfaz», en plural, y contestar un bloqueo plural desde una spec singular es
frágil. Si prefieres uno solo, se funden y esta spec no cambia.

**§5. Lo tercero que es juicio mío: no se toca `robots.txt`.** Lo natural sería
añadir `Disallow: /admin`, y sería **peor**: publicaría la ruta de la superficie de
peso 1.0 a cualquiera que pida el fichero. Se usa `noindex` por cabecera y por
`meta`, que hace el mismo trabajo sin anunciar nada. Y hay una ventaja de método:
**SPEC-004 CA-11 dice «permite el rastreo del sitio entero»**, así que un `Disallow`
la habría invalidado y habría exigido una enmienda de ADR-015 en su ledger. Así no
hay ninguna.

**§6. La entrada 5 del inventario de EPIC-004 —«el panel del operador no tiene
ningún diseño… es donde un error de diseño cuesta un marcador mal publicado»— la
contesto a medias y quiero que lo sepas.** El suelo de ADR-025 es un suelo: foco,
teclado, toque, nada solo por color, dígitos tabulares. Lo que **no** hay es
diseño: jerarquía, densidad, cómo se ve una corrección peligrosa distinta de una
rutinaria. Lo que puse en su lugar son **cuatro frenos de proceso** —el motivo
obligatorio, el vale, el acuse que lee de vuelta lo publicado, y que ningún estado
se distinga solo por color—, que atacan el riesgo por donde de verdad muerde. **La
entrada conserva su disparador y no se cierra.** Si crees que un panel que baja
marcadores necesita diseño de verdad antes de tocarlo, la respuesta no es esta spec
sino descongelar EPIC-004, y eso es tu firma, no la mía.

**§7. Un agujero que encontré escribiendo esto y que no es de esta spec: la
ceremonia de purga no nombra el archivo del bot.**
`docs/procedimientos/jornada-de-medicion.md` enumera los prefijos que la purga
borra y **`corresponsal/` no está** —cero apariciones, medido hoy—. ADR-023 §2 y
ADR-020 §2 anclan ese archivo a la jornada, pero la purga es una **ceremonia
manual sin ejecutor** (ADR-009 §4), así que hoy el archivo del bot depende de que
alguien se acuerde de un prefijo que no está escrito en ninguna parte. **Lo cierro
aquí** (CA-3.8) porque la misma línea de runbook cubre `corresponsal/` y
`operador/`, es un renglón, y `docs/procedimientos/` no es artefacto de ninguna
spec cerrada. **Si prefieres que lo saque a EPIC-MEJORA y lo deje como hallazgo,
dilo**: la spec no cambia, solo pierde un subpunto.

**§8. Lo que esta spec te cuesta si dice que sí.** Es la segunda spec más grande de
la épica después del motor: un módulo nuevo entero, dos tablas, **tres fronteras de
capacidad en la forma de ADR-016** —cada una con sus controles positivos y su
residuo escrito—, un espacio de nombres de i18n, una hoja de estilos propia, y **la
primera comprobación manual con navegador del proyecto**. Si lo que quieres es la
cifra de operación manual cuanto antes, la parte que **no** se puede recortar es
**CA-2** (que el panel no publique por su cuenta), **CA-3** y **CA-4** (el archivo y
el motivo, que son RN-10 y RN-12) y **CA-8** (el registro, porque la jornada pasa
una vez). Todo lo demás es discutible; esas cuatro, no.

**§9. Las que pueden esperar al gate siguiente**, y por qué no bloquean:

- **¿Cuánto dura una sesión?** Propongo horas, no días, porque una jornada dura una
  tarde. Es una constante nombrada y cambiarla es un diff.
- **¿`TICKET_TTL` de cuánto?** Suficiente para que alguien piense una corrección y
  corto para que el cronómetro signifique algo. Propongo minutos. Mismo argumento:
  constante, no arbitraje.
- **¿El panel debería avisar de que un partido lleva 15 min sin señal, o basta con
  que la alerta aparezca al recargar?** Hoy basta, porque el operador está mirando
  durante la jornada. El día que no lo esté es otra spec.
- **¿Tutea el panel, como el bot?** `gl.ts` y `es.ts` ya tutean sin excepción.
  Cambiarlo obligaría a enmendar dos specs cerradas y aquí el lector eres tú.
- **¿Hace falta dictamen de `sdd-lingua` sobre el texto entero?** No lo declaro
  bloqueante como SPEC-004 CA-12: este texto lo lee una persona del proyecto, no la
  federación. Lo que sí le consultaría son **los cuatro cualificadores** (nota §3),
  que es vocabulario de dominio y no una etiqueta de botón.
