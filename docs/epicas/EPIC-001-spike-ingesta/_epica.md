---
id: EPIC-001
tipo: epica
estado: aprobada
aprobada-por: Alberto Fojo
historial:
  - {estado: borrador, fecha: 2026-08-29, por: sdd-producto}
  - {estado: aprobada, fecha: 2026-08-31, por: Alberto Fojo}
---
# EPIC-001 — Spike de ingesta

> Origen: §§1, 8 y 9 de `docs/fundacion/spike-ingesta-propuesta.md`.

## Objetivo

> **Redefinida el 2026-08-31 por decisión del gate (Alberto Fojo).** Esta épica
> nació para producir las cuatro cifras. Se partió al descubrir dos cosas: que la
> fuente oficial **no es capturable** (ADR-008 §1, porque `futgal.es` prohíbe el
> rastreo y RN-11 obliga a respetarlo) y que las cuatro cifras exigen un motor y
> unos adaptadores que son ocho specs más. **Las cuatro cifras se mudan a
> EPIC-002**; aquí se queda la pregunta que este trabajo sí puede contestar. El
> criterio de éxito viejo, y el motivo de cada cambio, están al final en
> *Historial de la épica*.

Responder, **antes de construir el motor**, la pregunta de la que depende su
diseño: **¿hay fuentes automáticas usables, y son independientes entre sí?**

Es la precondición no medida de **RN-02**. Su segunda vía —«dos fuentes
independientes con peso ≥ 0.7 coinciden»— es la única forma de publicar
*confirmado* sin una fuente de peso ≥ 0.9. Si las candidatas beben unas de otras,
esa vía no existe, coincidirían siempre y la coincidencia no valdría nada.

Esta épica es **medición, no producto**, y sigue siéndolo. Su entregable es un
**veredicto con evidencia citada** —espejo, independiente o inconcluso— y el
instrumento reutilizable que lo produce.

Por qué antes que nada: **ADR-002 le puso fecha propia**. «Si ceroacero y
BeSoccer resultan ser espejos de futgal, hay una sola fuente automática
independiente y RN-02 no es aplicable: el motor se diseña sabiéndolo, no se
descubre el lunes siguiente.» El motor de EPIC-002 hereda esa respuesta.

## Criterios de éxito

La épica se cierra cuando **la ventana de observación ha corrido y hay un
veredicto escrito** en `hallazgos/`, con sus capturas citadas.

| Criterio | Cómo se sabe |
|---|---|
| **Hay un veredicto** | ESPEJO, INDEPENDIENTE o INCONCLUSO sobre el cruce entre las dos candidatas, en `hallazgos/test-de-espejo.{md,json}` |
| **Cada afirmación cita sus capturas** | Toda la evidencia apunta a claves del raw store recuperables (SPEC-002 CA-14, SPEC-003 CA-15) |
| **El informe dice qué NO responde** | `limitaciones_declaradas`, en JSON y en prosa (SPEC-003 CA-11) |
| **El motor sabe con qué nace** | La bandera `rn02_segunda_via_entre_automaticas` viaja en el informe y EPIC-002 la lee (SPEC-003 CA-5) |

**INCONCLUSO es un resultado, no un fallo.** Por SPEC-003 CA-12 se trata como
espejo, y el motor se diseña con **una sola vía en RN-02** — que es lo que hay
que hacer mientras no haya prueba de independencia. La épica falla solo si
termina **sin veredicto**, o con uno que no se pueda auditar contra el archivo.

**Lo que esta épica NO va a responder**, y hay que decirlo aquí porque era su
promesa original: **ninguna de las cuatro cifras**. Latencia, cobertura,
conflictos y operación se miden contra el dato *publicado*, y publicado significa
`Decision` escrita: hacen falta el motor, los adaptadores y el cron. Están en
**EPIC-002**, con sus umbrales y con la declaración de qué degrada a cada una.

**Y una respuesta que se pierde por el camino, dicha entera:** el veredicto será
**entre las dos candidatas**, no contra futgal. Podrán ser independientes entre
sí y espejos las dos de una tercera fuente que nadie ha mirado. El modo sin
referencia **nunca emite INDEPENDIENTE** por eso mismo (SPEC-003): puede
**cerrar** la segunda vía de RN-02 con evidencia, no abrirla. La pregunta contra
futgal queda contestable el día que sea capturable, con SPEC-002, que está hecha
y verificada esperando exactamente eso.

## Alcance

**Dentro:**
- Dos competiciones: **Terceira RFEF grupo 1** (representa lo nacional) y
  **Preferente Futgal grupo 1** (representa lo galego).
- **Modelo canónico** (zod), **raw store** (RN-10, ADR-005) y **acceso a datos**
  (ADR-006). Es lo que menos se tira al pasar a producción.
- **El instrumento del test de espejo**, en sus dos modos: con referencia
  (SPEC-002) y sin ella (SPEC-003). Captura cortés a 1 pet/min por par (RN-11),
  archivo antes de parsear (RN-10) y análisis en frío, determinista y auditable.
- **La ventana de observación y su veredicto.** Es el entregable.
- **La política de retención del archivo** (ADR-009), que la ventana necesita
  para poder correrse.

**Fuera (aparcado a propósito, no por descuido):**
- **Las cuatro cifras.** Latencia, cobertura, conflictos y operación se miden
  contra el dato publicado y exigen el motor: son **EPIC-002**. Salieron de aquí
  el 2026-08-31; no se abandonan.
- **El motor de decisiones, los adaptadores de producción, el cron, el snapshot,
  el bot de Telegram y el panel.** Todo eso es EPIC-002.
- **Capturar `futgal.es`.** Su robots.txt lo prohíbe y RN-11 obliga a respetarlo
  (ADR-008 §1). No se intenta por ninguna vía técnica. SPEC-002 queda hecha y
  verificada esperando a que sea capturable.
- **Exploración del tráfico de la app de la RFGF.** Estaba dentro y sale: ADR-002
  ya prohíbe construir sobre el backend de la app, y sin decisión de acceso a la
  federación no aporta nada a esta épica.
- **La implementación de SSE** (ADR-003). La decisión del protocolo está tomada;
  nada de esta épica la necesita.
- Interfaz definitiva, identidad visual, landing.
- Usuarios, cuentas, notificaciones push.
- Más competiciones, proveedor de pago y X API.
- Patrocinio, dominio, logo.

## Specs

<!-- El estado por spec vive en el frontmatter de cada spec; el tablero agregado se regenera con /sdd-tablero (docs/tablero.md). No mantengas listas de specs a mano aquí. -->

Las tres specs de esta épica están **hechas y verificadas GREEN**. El estado vivo
está en `docs/tablero.md`; aquí solo el porqué de cada una:

- **SPEC-001** — modelo canónico y raw store. La pieza que no se tira.
- **SPEC-002** — test de espejo **con referencia**. Mide cada candidata contra
  futgal. Hecha y verificada; **no ejecutable hoy** porque futgal no es
  capturable (ADR-008 §1). No es trabajo perdido: es trabajo que espera.
- **SPEC-003** — test de espejo **sin referencia**. Mide las dos candidatas entre
  sí. No estaba prevista: nació el 2026-08-31 del obstáculo, y es la que se puede
  correr.

Lo que queda para cerrar la épica **no es una spec, es una ventana**: correr
SPEC-003 y escribir el hallazgo. El procedimiento está en
`docs/procedimientos/ventana-de-observacion-espejo.md`.

**Pero hoy esa ventana no se puede correr. Lee el apartado siguiente antes de
planificar nada.**

## ESTADO AL 2026-08-31 — la épica está BLOQUEADA, y no por falta de código

Las tres specs están `hecho` y verificadas GREEN. **Eso no significa que la épica
esté cerca de cerrarse.** Al preparar la ventana apareció que la pregunta previa
—*¿cuántas fuentes se pueden capturar de verdad?*— no estaba contestada, y la
respuesta es **una**.

| Fuente | Peso | Estado | Por qué |
|---|---|---|---|
| `futgal.es` | 1.0, **oficial** | ❌ no capturable | Su `robots.txt` prohíbe el rastreo; RN-11 obliga (ADR-008 §1) |
| `ceroacero.es` | 0.7 | ✅ **usable** | HTML servido con los partidos. Única fuente viva hoy |
| `besoccer.es` | 0.7 | ❌ no sirve por HTML | Sirve armazones vacíos; el dato vive tras un `Disallow: /ajax*` |

Evidencia completa en **`hallazgos/fontes-capturables.md`**, con las capturas
citadas por su clave.

**Consecuencia:** SPEC-003 mide el cruce **entre dos candidatas** y hoy solo hay
una, así que **no es ejecutable**. Y la segunda vía de RN-02 está cerrada por
aritmética, no por espejo: no hay dos fuentes de 0.7.

### Lo que desbloquea, por orden de a quién le toca

1. **Mandar la carta a la RFGF** — `docs/negocio/carta-rfgf-acceso.md`, escrita y
   lista. Pide **dos líneas en su `robots.txt`**, no un acuerdo de datos. **Le
   toca a Alberto Fojo.** Es lo único con plazo externo: si contestan, la ventana
   pasa a ser la de **SPEC-002** (con referencia), que está hecha y verificada
   esperando exactamente esto, y la épica recupera su forma original.
2. **Verificar `lapreferente.com` el domingo 6 de septiembre**, con partidos en
   juego. Es la candidata a tercera fuente: sirve HTML real y usa el nombre
   canónico `preferente-futgal-grupo-1`, pero **no se le encontró ni una hora de
   comienzo ni rastro de directo**. En reposo, «no publica en vivo» y «no hay
   nada en vivo» son la misma página: **solo se distingue con partidos**. Si
   sirve, hace falta dictamen de `sdd-legal-datos` y un ADR que enmiende ADR-008
   para ampliar el conjunto capturable — y entonces SPEC-003 vuelve a ser
   ejecutable sin tocar código, porque la fuente es un dato del `config.json`.
   *(`futbolme.com` quedó sin evaluar: su URL estaba caducada.)*
3. **Si ninguna de las dos prospera**, la épica se cierra con
   `hallazgos/fontes-capturables.md` como su respuesta —hay una sola fuente
   automática— y eso obliga a ajustar estos criterios de éxito por segunda vez.
   Decisión del gate, no de un rol.

### Fechas que nadie va a recordar solo

- **Domingo 6 de septiembre de 2026** — única ventana con partidos suficientes:
  **17** (8 de Preferente y 9 de Terceira RFEF). El sábado 5 hay **uno**, así que
  no sirve: N_min es 10. Los horarios de comienzo **no estaban publicados** el
  2026-08-31; hay que mirarlos más cerca.
- **30 de septiembre de 2026 — purga del archivo** (ADR-009, opción B). Las 12
  capturas del 2026-08-31 viven en `raw/`, **fuera de git a propósito**. Hay que
  borrarlas y escribir el acuse en el ledger de SPEC-003. **Ningún test se pondrá
  rojo si nadie lo hace.** Techo duro: 29 de noviembre.

### Lo que NO está bloqueado

**EPIC-002 está aprobada y no depende de esto para empezar a especificarse**,
aunque el roadmap fija que el motor no se diseña hasta saber si RN-02 tiene
segunda vía — y esa respuesta **ya la hay**: no la tiene. Con una sola fuente
automática, el motor nace con una vía y con corresponsales humanos, y eso se
puede especificar hoy.

Abierto y sin dueño asignado: **F-SPEC-002-23**, el parser de `robots.txt` trata
el `*` de una ruta como carácter literal, así que **incumple `Disallow` reales
sin que ningún test se ponga rojo**. Hay que cerrarlo antes del primer adaptador
de EPIC-002.

## Riesgos

- **El riesgo que se materializó: la fuente oficial nos cierra la puerta.**
  `futgal.es` prohíbe el rastreo y RN-11 obliga a respetarlo. No estaba en esta
  lista y debería haber estado: nadie miró un `robots.txt` hasta que el trabajo
  estuvo hecho. **Lección para EPIC-002 y para cualquier épica que dependa de un
  tercero: la comprobación de acceso va antes de la spec, no después.**
- **Las candidatas resultan espejos entre sí.** Entonces no hay ninguna vía
  automática a *confirmado* y todo se publica provisional salvo lo que confirme
  una persona. Es un hallazgo, no un fallo, pero cambia el modelo de negocio y no
  solo el motor. Es justo lo que esta épica existe para saber antes.
- **El veredicto sale INCONCLUSO y no cierra nada.** Posible: el instrumento
  tiene un techo de resolución de un minuto impuesto por RN-11, y un espejo con
  retardo inferior es invisible. Se acepta: INCONCLUSO se trata como espejo y el
  motor nace conservador. El coste es que no se sabrá si se podía haber hecho
  mejor.
- **La ventana se rompe y hay que repetirla.** Si un par baja del 90 % de ticks
  exitosos, no hay informe y no hay rescate parcial (SPEC-002 CA-5). Solo la fase
  A es irrepetible; todo lo demás se rehace contra el archivo.
- **Nadie escribe la fecha de purga y la ventana se corre igual.** ADR-009 §4.1
  lo prohíbe y **ningún test se pondrá rojo**. Es el riesgo más tonto y el más
  probable de esta épica: depende de que una persona se acuerde.
- **El buzón de la User-Agent no se lee.** `mailto:ola@tremen.dev` identifica a
  alguien solo si alguien contesta. RN-11 lo pide y ningún test lo comprueba.
- **El humano no está.** El corresponsal en el spike es el autor.

## Lo que queda para producción

El modelo canónico, el raw store, la interfaz de adaptadores y el motor con
reglas trazables **no se tiran**. Lo que cambia en producción es la lista de
fuentes (acuerdo con RFGF, proveedor nacional de pago, corresponsales reales) y
la interfaz.

## Historial de la épica

- **2026-08-29** — creada por `sdd-producto` a partir de §§1, 8 y 9 de
  `docs/fundacion/spike-ingesta-propuesta.md`. Aprobada por Alberto Fojo el
  2026-08-31.
- **2026-08-31, al aprobar SPEC-002** — se añade la salvedad del corte de
  conflictos: no aplica si ninguna fuente automática es independiente de futgal.
  Viajó con la métrica a EPIC-002.
- **2026-08-31, redefinición. Decisión del gate (Alberto Fojo).** La épica se
  parte. **Qué cambia y por qué:**
  - **Las cuatro cifras salen de aquí y son EPIC-002.** Motivo: se miden contra
    el dato *publicado* —`Decision` escrita, RN-08— y eso exige motor,
    adaptadores y cron. La descomposición prevista listaba **once** specs; se
    escribieron **tres**, y una de ellas (SPEC-003) ni siquiera estaba en la
    lista: nació de un obstáculo. Mantener las cuatro cifras como criterio de
    éxito de esta épica era la razón por la que nadie veía cuánto faltaba.
  - **El criterio de éxito pasa a ser el veredicto del test de espejo**, que es
    lo que este trabajo sí entrega y lo que ADR-002 pedía con fecha propia.
  - **Sale del alcance capturar `futgal.es`** (ADR-008 §1) y la exploración del
    tráfico de la app de la RFGF, que ya no aporta a esta épica.
  - **Entra en el alcance la retención del archivo** (ADR-009): sin plazo escrito
    la ventana no se puede correr, así que es parte de esta épica y no de la
    siguiente.
  - **Lo que NO cambia:** las dos competiciones, que esto es medición y no
    producto, y que medir honestamente y no cumplir también es éxito.
