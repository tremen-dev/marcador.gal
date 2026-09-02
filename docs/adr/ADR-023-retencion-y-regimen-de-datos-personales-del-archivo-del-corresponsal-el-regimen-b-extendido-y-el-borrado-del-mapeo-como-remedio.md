---
id: ADR-023
tipo: adr
estado: borrador
historial:
  - {estado: borrador, fecha: 2026-09-02, por: sdd-arquitecto}
---
# ADR-023: Retención y régimen de datos personales del archivo del corresponsal — el régimen B extendido, y el borrado del mapeo como remedio del derecho de supresión

- Deciders: propone `sdd-arquitecto` el 2026-09-02, al escribir **SPEC-015**,
  sobre el dictamen de `sdd-legal-datos` del mismo día. Lo obliga la misma
  precondición dura que obligó a ADR-020: **ADR-009 §6 dice que la captura
  continua no arranca sin su propia decisión de retención**, y **ni ADR-009 ni
  ADR-020 cubren este archivo** —sus alcances son textuales y ninguno lo
  alcanza—. **Aprueba: pendiente de gate humano.**
- Specs relacionadas: **SPEC-015** (la que archiva lo que este ADR acota);
  **SPEC-007** (`hecho`; su ADR-012 dejó una pregunta abierta **acotada a un
  sitio sin recogida de datos**, y el bot rompe la acotación);
  **SPEC-001** (`hecho`; **F-SPEC-001-1** se estrecha por tercera vez y sigue
  sin cerrarse).
- Relacionado: **ADR-009** (retención del archivo de EPIC-001; este ADR extiende
  su régimen, no lo toca), **ADR-020** (el mismo régimen para las jornadas de
  medición de EPIC-002, y el `raw_ref` colgante como estado declarado),
  **ADR-008 §5.3** (el precedente de tratar un plazo como precondición y no como
  follow-up), **ADR-012** (identidad pública sin nombre, con paraguas y buzón
  delante), **ADR-015** (cómo se enmienda una spec cerrada), **ADR-019 §3** (las
  jornadas de medición declaradas, que son la unidad del plazo), **ADR-022** (el
  bot que produce este archivo), **RN-09, RN-10, RN-12, RN-13**, **D-2**,
  **D-6**, **D-7**.

> **Este ADR no es asesoramiento jurídico.** Lo escribe un rol de arquitectura
> sobre un dictamen que tampoco lo es. Su §7 enumera **cuatro puntos que exigen
> revisión profesional antes de exponerse**, y ninguno de ellos se da por
> resuelto por estar escrito aquí.

## Contexto

**Ni ADR-009 ni ADR-020 cubren este archivo, y sus alcances son textuales:**

- ADR-009 §1: «fija la política de retención del raw store **para las ventanas
  de medición de EPIC-001**».
- ADR-020 §1: «fija la retención de **todo lo que SPEC-012 archiva** … durante
  las jornadas de medición declaradas», y añade que «el día que la medición
  quiera volverse sondeo sin fin, este ADR no se estira».

Un update de Telegram archivado por SPEC-015 no cae en ninguno de los dos. Y hay
**tres diferencias de naturaleza** que impiden estirar el de al lado y seguir:

1. **Es el primer archivo del proyecto que contiene datos personales por
   diseño.** Lo que se archiva es texto escrito por una persona identificada, y
   además **texto sobre terceros de los que no obtenemos los datos** —jugadores,
   árbitros, entrenadores—: art. 14 del RGPD, no art. 13. «*Lesionouse o 9, sae
   en padiola*» es una frase normal de corresponsal y es un dato de salud de un
   tercero identificable (dorsal + partido + minuto), del art. 9.1, sin ninguna
   excepción del art. 9.2 que ampare un marcador. **Esto existe desde el primer
   mensaje, con el autor como único corresponsal**, porque el sujeto no es él.
2. **El repositorio es público** (`github.com/tremen-dev/marcador.gal`,
   comprobado el 2026-09-02). Todo lo que se versione aquí es **publicación**,
   no almacenamiento.
3. **Hay un tercero al que le mandamos el texto.** El proveedor de LLM es un
   **encargado del tratamiento** del art. 28, en un tercer país, con su propio
   plazo de retención que no mandamos nosotros.

Y hay una colisión interna que no se arregla con un párrafo: **el consentimiento
es revocable (art. 7.3) y su retirada abre el art. 17.1.b, pero las
`Observation` son inmutables por regla dura (RN-13): no se borran ni se
editan.** Consentimiento + RN-13 es una obligación de supresión que el modelo
canónico prohíbe cumplir.

## Decisión

### §1. Alcance: el archivo que el bot escribe durante las jornadas de medición declaradas

Este ADR fija la retención de **todo lo que SPEC-015 archiva en el raw store**
—el update del mensaje redactado, la respuesta del LLM y el update del callback
de confirmación— durante las **jornadas de medición declaradas** de EPIC-002
(ADR-019 §3), que es también la llave que ADR-022 §7 le pone al bot.

No toca el archivo de EPIC-001 (ADR-009 sigue mandando sobre él) ni el del cron
(ADR-020 sigue mandando sobre él), y **no fija la retención de producción**, que
sigue teniendo delante las tres preguntas de ADR-009 §6 y las sigue exigiendo
**con mecanismo automático**. **F-SPEC-001-1 se estrecha por tercera vez y no se
cierra.**

**La frontera de validez es la misma que la de ADR-020:** este ADR vale mientras
la recogida sea por jornadas declaradas y finitas. El día que el bot quiera estar
encendido la temporada entera, este ADR no se estira: se escribe el de
producción, y esta vez con el art. 5.1.e delante y no solo con el coste de Blob.

### §2. El plazo: el régimen B de ADR-009, anclado a la jornada, sin inventar nada

Por cada jornada de medición declarada: **30 días desde el fin de su intervalo**
(el `to` declarado), con **una** prórroga escrita y motivada en el ledger de la
spec que gobierna la medición **antes** de que expire el plazo original, y
**techo duro de 90 días**. Son literalmente las cláusulas de ADR-009 §2 opción B
y de ADR-020 §2; se citan, no se reinventan.

**El plazo cubre lo mismo que allí, más una cosa nueva:** recalibrar el parseo
del LLM contra mensajes reales, replayar la jornada, y **auditar RN-09** —qué
propuso el modelo frente a qué confirmó la persona—, que es la mitad de la
garantía y muere con el archivo.

**La ejecución es manual, con la ceremonia entera de ADR-009 §4 y ADR-020 §3, y
sin una sola cláusula rebajada:**

1. **La fecha de purga se escribe antes de correr la jornada**, junto a la
   entrada de la lista de ADR-019 §3 y en el ledger. Una jornada cuya fecha de
   purga no esté escrita **no se declara**.
2. **La purga se acusa después**, en el mismo ledger, con fecha real, prefijos
   purgados y número de claves borradas. **Sin acuse, no se declara la jornada
   siguiente.**

El prefijo es uno solo, `corresponsal/`, porque ADR-022 §3 lo hizo así a
propósito. El puerto `RawStore` **no gana una operación de borrado**: ADR-009 §5
ya dijo que eso es una spec.

**Se firma sabiendo lo que ADR-009 y ADR-020 firmaron:** ningún test se pone rojo
si nadie purga. La ceremonia es la red, y el operador en el bucle es la razón de
que se acepte aquí y **no** se aceptaría en producción. Y aquí pesa más que allí,
porque lo que caduca ya no son bytes de un tercero, sino frases de una persona.

**El plazo de 30 días no manda sobre el del proveedor de LLM** (§3). Eso se
declara en el aviso, no se disimula.

### §3. El proveedor de LLM es un encargado del tratamiento, y hacen falta las dos cosas

**Es un encargo del art. 28.3**, así que exige contrato o acto jurídico
vinculante — no basta con aceptar unos términos de uso y seguir. Y **no basta con
no mandar identificadores**, por dos motivos independientes:

1. **El texto sigue siendo dato personal.** Es una comunicación escrita por una
   persona identificada, y nosotros conservamos la información adicional que la
   reidentifica. Las Directrices EDPB 01/2025 sobre seudonimización son
   explícitas: **los datos seudonimizados siguen siendo datos personales** para
   quien controla el dominio de seudonimización. Quitar el nombre reduce el
   riesgo; no saca el tratamiento del RGPD.
2. **Aunque lo sacara, seguirían viajando datos de terceros** dentro del texto.
   El encargo haría falta igual.

**Transferencia internacional: apóyese en las cláusulas contractuales tipo del
DPA, no en la decisión de adecuación del EU-US Data Privacy Framework.** El DPF
es plenamente válido hoy —el Tribunal General desestimó el recurso de Latombe el
2025-09-03—, pero **el recurso de casación está pendiente ante el TJUE desde el
2025-10-31**. Construir sobre el instrumento que sobrevive a una anulación no
cuesta nada y ahorra un Schrems III. Que el proveedor figure en la lista de
participantes del DPF y que su DPA firmado incluya los módulos correspondientes
**hay que comprobarlo contra el texto firmado, no contra un blog** (§7).

**Lo que se guarda y lo que se declara:**

- **Copia fechada del DPA aceptado en `docs/legal/`.** Un DPA que nadie puede
  exhibir no es un DPA.
- **El plazo de retención del proveedor se escribe en el aviso**, tal como sea
  en el momento de contratar, incluidas sus excepciones. **Nuestro plazo no manda
  sobre el suyo.**
- **Si hay opción de retención cero y el proyecto es elegible, se contrata.** Si
  no, el plazo del proveedor queda escrito.

### §3 bis. Dos supuestos sobre el proveedor que hay que dejar escritos, porque el primero es falso y el segundo no decide nada

Esto vive **aquí y no en una nota de coste** por un motivo concreto: quien crea
que el bot puede ir «por suscripción» creerá también que no hay nada que
contratar, y de ahí se salta el art. 28 sin darse cuenta. La corrección del
supuesto es, en su consecuencia, jurídica.

**a) Una suscripción de consumo no habilita este bot.** Un plan de suscripción
—Claude Pro, Claude Max o equivalente— cubre la aplicación de escritorio y web y
la herramienta de línea de órdenes; **no habilita llamadas programáticas desde un
servidor desplegado**. Un webhook corriendo en Vercel va **por API, con clave
propia y facturación por token**, y esa relación es distinta de la suscripción y
no se deriva de ella. **No existe la vía «gratis porque ya pago la
suscripción»**, y la disyuntiva «suscripción contra API» no es una disyuntiva:
para este bot solo hay API.

Y lo que importa para este ADR: los términos de un plan de consumo **no son un
contrato de encargado del tratamiento**. El DPA del §3 hace falta igual, y hace
falta **antes** del primer mensaje.

**b) El precio, medido en vez de temido, no debería decidir esto.** Precios
vigentes al **2026-09-03**, por millón de tokens (entrada / salida): Claude Haiku
4.5 **1 / 5** · Claude Sonnet 5 **2 / 10** · Claude Opus 5 **5 / 25**. El trabajo
de este bot es un prompt corto —el texto del corresponsal más un puñado de
candidatos— y una respuesta JSON de pocas líneas, unas decenas de veces por
jornada. Una jornada sale por **céntimos**, y las **dos jornadas** que EPIC-002
necesita **no llegan a dos euros ni con el modelo más caro**. Los precios cambian:
**se vuelven a mirar en el momento de implementar**, no se copian de aquí.

**Conclusión que este ADR fija:** lo caro de elegir proveedor **no es el precio,
es el contrato de encargado y las cláusulas de transferencia internacional**. Y
ahí la asimetría es real y hay que decirla: Anthropic **ya está estudiado** por el
dictamen de `sdd-legal-datos` del 2026-09-02 —términos comerciales, DPA,
retención, y el análisis de las cláusulas frente a la decisión de adecuación—;
cualquier otro proveedor **habría que estudiarlo desde cero**, y ese estudio es
trabajo de un rol consultivo, no del implementador. El coste de cambiar de
proveedor no está en el código: está en volver a hacer el §3 entero.

**Este ADR no elige proveedor.** La elección se aplaza deliberadamente al momento
de la implementación (SPEC-015, notas §6.2), y lo que no se aplaza es la
precondición: sin proveedor elegido y sin DPA guardado y fechado, el criterio del
LLM no se implementa (§6.4).

### §3 ter. Cambiar de proveedor es barato técnicamente y caro jurídicamente

*(Añadido el 2026-09-03 por indicación del gate: el proveedor de modelo tiene que
quedar preparado para intercambiarse, porque se valorarán también familias que no
son las dos obvias.)*

ADR-022 §6 pone la llamada al modelo detrás de un **puerto**, con un adaptador por
proveedor. Eso hace que cambiar de proveedor sea **escribir un fichero**. Y
precisamente por eso hay que escribir aquí, con letra grande, lo que el puerto
**no** cambia — porque un implementador que vea una interfaz limpia y dos
adaptadores va a asumir lo contrario:

> **El análisis legal no viaja con el adaptador. Cada proveedor nuevo reabre la
> pregunta desde cero.**

**El dictamen de `sdd-legal-datos` del 2026-09-02 analizó a UN proveedor,
Anthropic**, y ese análisis **no se hereda**. Lo que hay que rehacer entero por
cada candidato, y ninguna de las cuatro respuestas viene en el `package.json`:

1. **El contrato de encargado del tratamiento** (art. 28.3). Existe, se puede
   firmar, y qué dice.
2. **La base de la transferencia internacional.** Cuál, y si se sostiene.
3. **La retención del subencargado**: cuánto conserva, con qué excepciones, y si
   ofrece retención cero.
4. **Si entrena o no con el contenido enviado**, y si eso está en el contrato o
   solo en una página de marketing.

**Y no todos los candidatos cuestan lo mismo. La diferencia es de grado, no de
trámite.** Dos de los nombres que el gate quiere valorar —**Kimi**, de Moonshot,
y **Qwen**, de Alibaba— son proveedores **chinos**, y **China no tiene decisión de
adecuación de la Comisión Europea**. Consecuencia directa: **la vía del art. 45 no
existe para ellos**, así que la transferencia tendría que apoyarse en el **art.
46** —cláusulas contractuales tipo— **más una evaluación de impacto de la
transferencia**, que es un análisis del entorno jurídico del país de destino y de
las garantías suplementarias. Sobre **texto libre que lleva datos de terceros y
posiblemente datos de salud** (§1, Contexto), eso es **materialmente más duro**
que lo que ya está hecho para Anthropic, no una versión equivalente con otro
nombre. *(La ausencia de decisión de adecuación para China se afirma a fecha de
hoy; como todo lo demás de este ADR, se vuelve a comprobar en el momento del
análisis.)*

**La excepción, y es la única que simplifica en vez de complicar: pesos
abiertos.** Algunas de esas familias publican modelos de pesos abiertos. Un modelo
ejecutado **en infraestructura propia o europea** elimina de un golpe **la
transferencia internacional y la relación de encargado enteras**: sin contrato de
encargado, sin cláusulas contractuales tipo, sin tercer país, sin retención de un
subencargado que no controlamos, y sin la pregunta de si entrena con el contenido.
Los cuatro puntos de arriba **desaparecen**, no se contestan.

**Si el criterio acaba siendo el coste —que es de donde salió esta pregunta
(§3 bis)—, ésta es la variante que conviene analizar primero, no la última.**

**Y la cautela, que es parte de la decisión:** este ADR **no afirma** que ningún
modelo concreto tenga pesos disponibles, ni bajo qué licencia, ni que la licencia
permita este uso, ni qué haría falta para ejecutarlo. **Nada de eso se ha
comprobado, y no se comprueba ahora.** Queda la **vía nombrada como opción a
evaluar** cuando llegue el análisis del proveedor, con su verificación por
delante. Lo que sí se fija es el orden en que mirarla.

### §4. El dominio seudonimizado, y el borrado del mapeo como remedio de la supresión

ADR-022 §2 separa las dos mitades. Este ADR dice para qué sirve esa separación,
que es la pieza que hace convivir RN-13 con el art. 17:

- **Dominio seudonimizado** = la base de datos y el archivo, donde la persona es
  `corresponsal-01`.
- **Información adicional** = el mapeo `correspondent_id → telegram_user_id`,
  fuera de git y fuera de Postgres.

**Una solicitud de supresión se atiende borrando el mapeo, sin tocar el log.** La
`Observation` no se borra —RN-13 lo prohíbe y D-6 la necesita— y deja de ser
atribuible a una persona identificada. Es el diseño entero, y es la razón de que
§2 de ADR-022 no sea una preferencia.

**Base jurídica recomendada, y por qué no el consentimiento.** El consentimiento
choca con RN-13 por lo escrito en el Contexto. En su lugar:

- **Art. 6.1.b** para el tratamiento operativo: el bot no funciona si no sabe
  quién envía.
- **Art. 6.1.f** para la **trazabilidad durable** que exigen RN-12 y D-6 y que el
  corresponsal no puede apagar. El interés legítimo se nombra en una frase: *la
  integridad y auditabilidad de un marcador publicado*. Su **ponderación (LIA)**
  se redacta corta —necesidad, balance, expectativas razonables— y se versiona en
  `docs/legal/`.

**Y no se pone un botón de consentimiento si la base no es el consentimiento**:
un botón que no es la base induce a error y contradice el art. 13.1.c.

**El derecho de baja se ejerce, y tiene ceremonia.** El bot ofrece un comando de
baja que **deja de aceptar mensajes de esa persona en el acto**, mediante una
fila de exclusión durable. El borrado del mapeo, en cambio, es **un acto manual
del operador** —el mapeo vive en entorno— y se acusa por escrito en el ledger,
con la misma forma que la purga. Con un corresponsal es barato; **el día que haya
más de tres, o el primero que no sea el autor, esta decisión se revisa**
(ADR-022, *Consecuencias negativas*).

### §5. Transparencia: qué dice el bot, dónde, y qué no se puede aplazar

**El art. 25 —protección de datos desde el diseño— es lo que impide construirlo
hoy sin aviso «y ponerlo cuando llegue el segundo corresponsal».** El coste de
escribir el aviso hoy es un fichero de i18n; el de retrofitarlo es una spec. Y la
exposición de terceros **existe desde el primer mensaje**.

- **En el arranque de la conversación, antes de aceptar contenido**, y en
  **galego por defecto con castellano** (D-2, literales en `src/i18n/` desde el
  primer día): el mínimo del art. 13 —quién es el responsable y cómo
  contactarlo, qué se trata, para qué, base jurídica, **que el texto se envía a
  un proveedor de IA para interpretarlo**, cuánto se conserva, y los derechos—,
  con enlace a la página completa.
- **Y una frase que ahorra la mitad del riesgo:** que el aviso diga, en galego,
  **qué no hace falta enviar** — no hacen falta nombres de jugadores, de árbitros
  ni datos de salud. Es la única mitigación posible sobre texto libre, porque
  impedir que alguien lo escriba no se puede.
- **Un comando que reimprime el aviso y el enlace**, para que no dependa de haber
  leído el primer mensaje.
- **Una página `/privacidade` y `/es/privacidade`** con los arts. 13 y 14
  completos. **No la construye SPEC-015** (§6): en un mensaje de Telegram no
  cabe, y el enlace es lo que hace defendible el resumen.
- **Un párrafo de esa página dirigido a las personas nombradas en los mensajes
  de corresponsales.** Informarlas individualmente es imposible y el art. 14.5.b
  (esfuerzo desproporcionado) es invocable, **pero exige hacer pública la
  información**. Ese párrafo es literalmente lo que la norma pide a cambio.
- **La asimetría con Telegram se declara, no se disimula.** Telegram FZ-LLC opera
  desde fuera de la UE y **no podemos firmar un DPA con ellos**: nos regimos por
  sus términos para desarrolladores de bots, que imponen obligaciones **a
  nosotros** —minimización, política de privacidad accesible, borrado a
  petición, cumplir el RGPD— y ninguna a ellos hacia nosotros. El aviso lo dice y
  enlaza su política. Nota práctica: la política estándar de bots de Telegram se
  aplica por defecto **salvo que el bot tenga la suya**, así que publicar la
  nuestra la desplaza — otra razón para escribirla.

**Y esto toca ADR-012, que hay que decirlo aunque incomode.** El art. 13.1.a
exige «la identidad y los datos de contacto del responsable», y **un buzón es
contacto, no identidad**. ADR-012 dejó esa pregunta abierta pero **acotada** a
«un sitio público **sin recogida de datos**, sin cookies y sin actividad
económica». **El bot destruye la acotación: es recogida de datos.** Decisión:
**el día que haya un corresponsal que no sea el autor, el responsable tiene que
ser identificable por nombre —o por entidad jurídica— en el aviso del bot y en la
página de privacidad.** Mientras el autor sea el único corresponsal es
responsable e interesado a la vez y la exposición práctica es nula, pero los
terceros nombrados en el texto adelantan el reloj.

El propio ADR-012 escribió qué pasa entonces: «si el dictamen exige
identificación en el propio sitio, esta decisión vuelve al arquitecto: no se
parchea a mano». Y como SPEC-007 está `hecho`, el camino es el de **ADR-015**:
enmienda en su ledger bajo `## Enmienda — <fecha>`, **nunca editar el cuerpo**.
**Requiere revisión profesional** (§7).

### §6. Lo que este ADR exige y NO manda implementar en SPEC-015

Se separan a propósito, con el precedente de **ADR-008 §5.3** —que trató su plazo
como **precondición** y no como follow-up— y de ADR-009 §5. Son **precondiciones
de encender el bot**, no criterios de aceptación:

1. **La página `/privacidade` y `/es/privacidade`**, en las dos lenguas y con
   paridad de contenido, incluido el párrafo del art. 14. Es texto que escribe
   una persona, no un rol. **Spec futura.**
2. **El registro de actividades de tratamiento (art. 30).** La excepción del art.
   30.5 para menos de 250 empleados **no aplica**: el tratamiento no es ocasional,
   es cada jornada. Una página en `docs/legal/`.
3. **La ponderación de interés legítimo (LIA)** de §4, en `docs/legal/`.
4. **La elección de proveedor de LLM y la copia fechada de su DPA**, en
   `docs/legal/`. **Es la única de las seis que además bloquea código**: sin
   proveedor elegido y sin DPA guardado y fechado, **SPEC-015 CA-5 no se
   implementa** — no se escribe el cliente contra un proveedor sin contrato de
   encargado, aunque el código fuese idéntico. **El resto de la spec avanza sin
   ella**: las catorce restantes no dependen del proveedor, y el bot llega a
   tener tarjeta y confirmación con un doble del modelo en su sitio.
   **Disparador: antes de escribir la primera línea del primer adaptador de
   `src/bot/models/`.** Y la comprobación no es de trámite (§3 bis, §3 ter, §7):
   se hace **por proveedor**, y **un adaptador nuevo la vuelve a disparar
   entera**. El puerto de ADR-022 §6 abarata el código, no esta precondición.
5. **Un «no procede» corto y fechado sobre la evaluación de impacto (art. 35)**,
   en `docs/legal/`. Lectura del rol legal: no procede —ni gran escala, ni
   observación sistemática, ni art. 9 por diseño—, pero la combinación texto
   libre + LLM + tercer país roza varios criterios de la lista de la AEPD, y un
   «no procede» escrito vale más que el silencio.
6. **La fecha de purga escrita antes** de declarar la primera jornada con el bot
   encendido (§2).

**Ninguna de las seis la puede escribir un rol `sdd-*` por su cuenta**, y por eso
ninguna es un CA. Lo que SPEC-015 sí entrega es un bot **estructuralmente
incapaz de recoger nada** mientras no se declare una jornada (ADR-022 §7), que
es lo que hace que aprobarla no sea aprobar la exposición.

## Consecuencias

### Positivas

- **El plazo existe antes de que haya un solo mensaje**, que es lo que ADR-009 §6
  exigía y lo que ADR-008 §5.3 enseñó a hacer como precondición.
- **La supresión es ejecutable sin romper RN-13.** El log inmutable y el art. 17
  dejan de ser incompatibles, y la pieza que lo consigue es una decisión de
  diseño, no un párrafo de un aviso.
- **Nada se publica en git.** El catálogo de seudónimos sí; el mapeo, nunca, con
  la política sin excepciones de ADR-009 §3.
- **La deriva de finalidad tiene freno con nombre.** El archivo caduca en 30
  días y la recogida solo existe dentro de una jornada declarada, así que estos
  datos no pueden acumularse a la espera de que alguien encuentre un uso nuevo.
- **RN-09 queda auditable**: durante el plazo se puede comparar lo que el modelo
  propuso con lo que la persona confirmó.

### Negativas / follow-ups

- **Seis precondiciones fuera del código**, y el bot no se enciende sin ellas. Es
  la parte de esta spec que no se cierra con un `npm test`.
- **La purga sigue sin ejecutor automático** (F-SPEC-005-V2), y ahora lo que
  caduca son frases de una persona. La ceremonia es toda la red que hay.
- **El plazo del proveedor de LLM no lo controlamos**, y puede ser más largo que
  el nuestro para contenido marcado por sus políticas.
- **El art. 9 no se cierra: se acota.** No se puede impedir que alguien escriba
  un dato de salud de un tercero; sí que se publique, que se propague más allá
  del parseo y que se conserve más allá del plazo. **Disparador para volver a
  consultar: que resulte recurrente en la primera jornada.**
- **Si entrara alguna vez fútbol base (menores) en los partes de corresponsal,
  hay que re-consultar al rol legal antes de aprobar nada.** Hoy está fuera
  —Terceira RFEF G1 y Preferente son categorías absolutas— y es una barrera de
  producto, no técnica.
- **La deriva de finalidad hacia el feed comercial de D-7** cambiaría la
  finalidad (art. 5.1.b) y exigiría base nueva. **Destino: EPIC-MEJORA, con
  disparador escrito: el día que un dato de corresponsal alimente algo que se
  venda.**
- **`docs/legal/` no existe todavía.** Lo crea la primera de las seis
  precondiciones que se escriba.

## §7. Los cinco puntos que exigen revisión profesional

Ninguno se da por resuelto por estar escrito aquí, y ninguno lo puede cerrar un
rol `sdd-*`:

1. **La identificación del responsable** y su interacción con ADR-012 y SPEC-007
   (`hecho` → enmienda por ADR-015).
2. **La ponderación de interés legítimo** y la convivencia de RN-13 con los arts.
   17 y 21.
3. **La exposición del art. 9** por datos de salud de terceros en texto libre.
4. **Si 30 días es defendible ante la AEPD** para texto libre de una persona. Es
   la misma reserva que ADR-009 escribió sobre su propio plazo y por el mismo
   motivo: nadie aquí puede afinar el correcto, así que se elige groseramente
   conservador.
5. **La transferencia internacional de cada proveedor candidato** (§3 ter), y en
   particular la **evaluación de impacto de la transferencia** que exigiría un
   proveedor de un país sin decisión de adecuación. *Añadido el 2026-09-03.* Es el
   punto que un puerto limpio hace parecer innecesario, y no lo es.

Y una comprobación que no es jurídica pero bloquea un criterio: **que el
proveedor de LLM elegido esté certificado en el DPF hoy y que su DPA firmado
incluya las cláusulas contractuales tipo aplicables** — verificado contra el
buscador de participantes y contra el texto firmado, **no contra una fuente
secundaria**.

## Alternativas consideradas

- **Estirar ADR-020 al archivo del corresponsal sin ADR nuevo.** Rechazada: su §1
  acota su alcance a «todo lo que **SPEC-012** archiva», y el propio ADR-020
  escribió que no se estira. Además faltarían las tres piezas que aquí son el
  cuerpo: el encargo del art. 28, el dominio seudonimizado y la transparencia.
- **Aprobar SPEC-015 con el plazo sin fijar, como follow-up.** Rechazada por el
  precedente de **ADR-008 §5.3**: un plazo que empieza a correr el día que se
  recoge el primer mensaje no es un follow-up, es una precondición. Un follow-up
  se descubre tarde y aquí «tarde» significa datos personales conservados sin
  plazo.
- **Consentimiento como base jurídica.** Rechazada: es revocable (art. 7.3) y su
  retirada abre el art. 17.1.b, que RN-13 prohíbe cumplir. La colisión no se
  arregla con un párrafo, y un botón de consentimiento que no es la base es peor
  que no tenerlo (art. 13.1.c).
- **Ampararse en el art. 2.2.c** (actividad exclusivamente personal o
  doméstica) mientras el único corresponsal sea el autor. Rechazada:
  marcador.gal es un proyecto público con voluntad declarada de sostenibilidad
  económica (**D-7**), y los terceros nombrados en los mensajes no son el autor.
- **Construir el bot sin aviso y ponerlo «cuando haya un corresponsal de
  verdad».** Rechazada por el art. 25 y por aritmética de coste: hoy es un
  fichero de i18n, después es una spec.
- **Guardar el mapeo en una tabla de Postgres para poder borrarlo con SQL.**
  Considerada en serio, y rechazada por poco. Haría el art. 17 ejecutable en vez
  de ceremonial, que es su punto fuerte; pero mete un identificador transversal
  de Telegram en la base —de donde sale en volcados, copias y fixtures— y hace
  mucho más difícil afirmar, con un criterio, que ningún camino del código lo
  escribe en un sitio durable. Con un corresponsal, la ceremonia gana. **Vuelve a
  la mesa con el tercero.**
- **Anonimizar el texto archivado.** Rechazada, y aquí sí por el motivo de
  ADR-009: saber qué tachar dentro de una frase libre exige entenderla, que es
  circular, y destruiría el sustrato reprocesable de RN-10. La redacción de
  ADR-022 §3 es otra cosa —una lista blanca de claves de un JSON— y por eso sí se
  puede.
- **Un plazo más corto, de 7 días.** Rechazada por el mismo motivo que en
  ADR-020: las specs que consumen la jornada —el motor, las cifras, la
  recalibración del parseo— no caben en una semana, y una prórroga por defecto es
  peor que un plazo honesto.
