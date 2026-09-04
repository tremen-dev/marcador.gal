# Dictámenes de dominio para SPEC-018 — el snapshot y la página mínima del marcador

> **Artefacto versionado, copiado literalmente.** Los **tres** roles consultivos
> del proyecto —`sdd-lingua`, `sdd-competicion` y `sdd-legal-datos`—
> dictaminaron sobre SPEC-018 el **2026-09-04**, a petición de
> `sdd-arquitecto`. Los tres llevan la regla dura del rol consultivo: **el
> dictamen tiene que quedar por escrito en la spec o en su ledger**, y esa
> anotación es del arquitecto. Se copian **enteros y sin resumir**: lo que un
> verificador tendrá que consultar dentro de un mes es el texto, no una
> paráfrasis.
>
> **Es la primera vez que dictaminan los tres a la vez, y no es casualidad:**
> esta spec es la primera que enseña un marcador fuera del motor, la primera
> que enseña los cinco estados a alguien que no es el operador, y la primera en
> la que publicar —no obtener— es el verbo en cuestión.
>
> **El dictamen de `sdd-legal-datos` es BLOQUEANTE y cambió el alcance de la
> spec antes de que se escribiera una línea de criterios.** Su §0 encontró que
> `/robot`, `/proxecto` y la carta a la RFGF —las tres publicadas, las dos
> primeras sujetas por test— afirman que **no hay marcador público**, y que
> servir uno las volvería falsas mientras la federación tiene la carta encima de
> la mesa. `sdd-lingua` llegó por su cuenta al mismo hallazgo (su §6.1). La
> consecuencia está en el cuerpo de SPEC-018 y en **ADR-027**: la pantalla se
> construye **detrás de la sesión declarada del operador** y **no se publica**.
>
> Qué absorbió SPEC-018 y qué dejó fuera está en su cuerpo y en sus notas para
> el gate. Este fichero no se edita: si un dictamen cambia, se emite otro y se
> añade debajo con su fecha.
>
> Ninguno de los tres roles es abogado, lingüista colegiado ni federativo, y
> ninguno de los tres escribió código.

---

# Dictamen `sdd-legal-datos` — SPEC-018, publicación pública del marcador

> Emitido el 2026-09-04 por el rol consultivo `sdd-legal-datos`, a petición de
> `sdd-arquitecto`. **Es el dictamen que cambió el alcance de la spec.** Se
> copia literal. No escribió ningún fichero.

He leído el contrato del rol, `FOUNDATION.md`, `docs/fundacion/reglas.md`, `docs/fundacion/retos.md`, ADR-002, ADR-008, ADR-009, ADR-012, los ADR-024/025/026, `src/site/robots-txt.ts`, los bundles `crawler`/`site` de `src/i18n/{gl,es}.ts`, `tests/site/crawler-page.test.ts`, `docs/negocio/carta-rfgf-acceso.md`, `docs/procedimientos/calendario-de-compromisos.md` y `src/model/decision.ts`. He verificado online lo que había que verificar.

**Emitido:** 2026-09-04. **Rol:** autoridad de dominio, consultivo. **No soy abogado y este dictamen no es asesoramiento profesional**; marco abajo qué necesita revisión profesional.

**Comprobaciones hechas hoy (2026-09-04), porque un dictamen legal sin fecha no vale:**

| Recurso | Resultado |
|---|---|
| `https://www.ceroacero.es/robots.txt` | **Sigue permitiendo.** `User-agent: *`, única prohibición `Disallow: /zzmap_v3.php`, más 13 sitemaps. Idéntico a lo que ADR-008 §3 constató el 2026-08-31. **No hay reserva legible por máquina de TDM** (art. 4.3 DSM). |
| Página legal / ToS de `ceroacero.es` (`/fichatecnica.php`) | **HTTP 503**, no recuperable hoy. La afirmación de ADR-002 «las ToS de ceroacero restringen el scraping» **sigue sin fuente localizable**, exactamente como la dejó ADR-008 §4. No se apoya nada en ella, ni a favor ni en contra. |
| Sitemaps de ceroacero | Incluyen `sitemap_index_players.xml`, `_coaches.xml`, `_referees.xml`. **Confirma como hecho** lo que ADR-009 dejó como «advertencia condicionada»: en ese sitio hay páginas de personas físicas. Relevante para el §5. |
| Estado del derecho *sui generis* a 2026 | Directiva 96/9/CE y arts. 133-137 TRLPI **sin reforma aplicable**. El Data Act (Reg. UE 2023/2854) excluye el *sui generis* solo para bases de datos de datos generados por productos conectados: **no alcanza a un agregador de resultados**. |

---

## 0. La pieza que cambia todo, y que no está en tu lista de preguntas

**DICTAMEN VINCULANTE — BLOQUEANTE.**

Antes de cualquier análisis de *sui generis*, hay un hecho del propio repositorio que decide la spec. El proyecto **ya ha declarado por escrito, en público y ante un tercero concreto, que no publica nada**. Tres veces, y las tres siguen vivas hoy:

1. **`/robot` y `/es/robot`**, clave `noRepublish` (`src/i18n/gl.ts:271`, `es.ts:279`):
   > «**Non republicamos os datos de ninguén.** Isto é unha medición, e o resultado é un informe interno. **Non hai marcador público**, nin ficheiro de datos, nin nada que se poida consultar fóra do proxecto.»

   Y no es prosa suelta: está **sujeta por test**, `tests/site/crawler-page.test.ts` caso 12, que exige literalmente `non republicamos` y `informe interno`. SPEC-005 CA-6 la enumera entre «las afirmaciones comprobables de la carta, publicadas».

2. **`/proxecto` y `/es/proxecto`**, clave `noProduct` (`src/i18n/gl.ts:226`): «Hoxe non hai nada que usar: **nin marcador público**, nin aplicación…». Sujeta por `tests/site/pages.test.ts` casos 207-208.

3. **La carta a la RFGF**, enviada el **2026-09-01** a `info@futgal.es` (`docs/negocio/carta-rfgf-acceso.md:60`):
   > «O que fago e o que non. **Non republico os seus datos: isto é medición, e o resultado é un informe interno.**»

   Su plazo **vence el 2026-09-08** (`docs/procedimientos/calendario-de-compromisos.md`, fila 2). **Está viva, sin contestar, y en manos de la federación ahora mismo.**

Servir un marcador de Preferente Futgal G1 y Terceira RFEF G1 en una URL pública de `marcador.gal` convierte las tres en **falsas**. No en obsoletas: en falsas, mientras el destinatario de la tercera tiene la carta encima de la mesa.

Eso no es una infracción de propiedad intelectual de nadie. Es peor para este proyecto en concreto, por tres vías:

- **Estratégica.** El objetivo declarado en `retos.md` y en `FOUNDATION.md` §Alcance es un **acuerdo de datos con la RFGF**. La carta lo prepara diciendo «no republico». Que la federación abra `marcador.gal` la semana en que decide y vea sus dos competiciones publicadas destruye ese camino de una manera que no se repara con un ADR.
- **De coherencia probatoria.** Todo el andamio de mitigación de este proyecto —`/robot`, el user-agent declarado (ADR-011), el buzón delante (ADR-012 §3)— vale porque es **verificable y cierto**. Una sola afirmación desmentida por la propia web convierte ese andamio en lo contrario de lo que se construyó para ser.
- **De competencia desleal.** Una declaración pública falsa sobre la propia actividad es subsumible en el art. 5 de la Ley 3/1991 de Competencia Desleal (actos de engaño), y el legitimado para invocarla sería justamente ZOS, Lda.

**Consecuencia vinculante:** **SPEC-018 no puede servir una pantalla públicamente accesible mientras `noRepublish` y `noProduct` digan lo que dicen.** Solo hay dos salidas, y las dos son de la spec, no mías:

- **(A)** La pantalla **no es públicamente accesible** durante EPIC-002 (mi recomendación, §3).
- **(B)** Se publica, y entonces `noRepublish` y `noProduct` se corrigen **en el mismo cambio, no después** — con el procedimiento de **ADR-015** (SPEC-004 y SPEC-005 están `hecho`: su cuerpo no se edita, se enmienda en el ledger) — y se avisa a la RFGF antes de que lo vean solos. Y **no antes del 2026-09-08**.

Un tercer camino que quiero cerrar explícitamente porque es el que sale solo: **matizar el literal para que siga pasando el test** («non republicamos… salvo unha pantalla de medición»). Eso es peor que las dos anteriores. La frase se publicó y se mandó por correo sin matiz; matizarla *a posteriori* para que quepa lo que se acaba de hacer es exactamente lo que un tercero enseñaría.

---

## 1. ¿Se puede publicar el marcador?

### 1.1 Lo que no está en discusión

**Un resultado deportivo es un hecho y no tiene copyright.** No es obra (art. 10 TRLPI: creación original), y el *sui generis* del art. 7 Directiva 96/9/CE / art. 133 TRLPI **no protege los datos individuales**, sino la inversión sustancial en obtener, verificar o presentar el conjunto. Esto lo dice ya `FOUNDATION.md` §No-negociables y `retos.md`, y sigue siendo cierto.

### 1.2 Lo que sí cambia hoy, y es la clave del dictamen

Hasta hoy el proyecto solo hacía **extracción** (art. 7.2.a). Servir la pantalla añade el segundo acto prohibido: **reutilización** — art. 7.2.b, *«toda forma de puesta a disposición del público de la totalidad o de una parte sustancial del contenido de la base mediante… transmisión en línea»*; art. 133.1 TRLPI en los mismos términos.

Dos consecuencias que hay que ver antes de medir «parte sustancial»:

- **La excepción de minería deja de cubrir.** El art. 4 de la Directiva (UE) 2019/790, transpuesto por el RDL 24/2021, ampara **reproducciones y extracciones** para minería de textos y datos. **No ampara la comunicación pública ni la reutilización.** ADR-009 apunta como consecuencia positiva que «la medición entra en el amparo del art. 4 TDM»: eso sigue siendo cierto **para el archivo** y **nunca alcanzó a una publicación**. Quien lea ADR-009 y crea que cubre SPEC-018 se equivoca; conviene que la spec lo diga.
- **El riesgo residual de ADR-008 no se hereda.** ADR-008 §5.2 dice, con estas palabras: *«**Es medición, no producción.** Ningún dato de besoccer.es se publica»*, y `FOUNDATION.md` repite la frontera para toda fuente («En producción: acuerdo con la RFGF o proveedor licenciado»). Lo que el gate firmó el 2026-08-31 fue **capturar**, no **publicar**, y de **besoccer**, no de ceroacero. **Publicar es un acto distinto, sobre una base de datos de otro titular (ZOS, Lda.), y necesita su propia firma.** Ver §6.

### 1.3 Dónde está la línea de «parte sustancial»: no está donde la pregunta la busca

Distingo los tres casos que planteas, pero el resultado es que **el eje que decide no es el tamaño de la pantalla, sino la repetición en el tiempo**.

**(a) Un resultado suelto.** Insustancial en lo cuantitativo y en lo cualitativo, sin discusión. El *sui generis* no protege el dato individual (TJUE *BHB v. William Hill*, C-203/02, 9-nov-2004, §§ 30-38). **Sin riesgo.**

**(b) La tabla de partidos de una jornada entera, publicada una vez.**
- *Cuantitativamente*: el denominador es **toda** la base de ceroacero —fútbol mundial, según sus propios sitemaps—. Diecisiete partidos de dos competiciones gallegas son ruido estadístico. **Insustancial.**
- *Cualitativamente*: aquí hay más de lo que parece. *BHB* §71 mide la parte cualitativa por **la inversión en obtener, verificar o presentar precisamente esa parte**, con independencia de su volumen. La cobertura **en vivo, minuto a minuto** de una jornada es exactamente donde se concentra la inversión de un agregador. Aun así, un acto único sobre dos competiciones sigue quedando, en mi criterio, **por debajo del umbral**.
- **Sin riesgo apreciable, como acto aislado.**

**(c) La temporada, publicada jornada tras jornada.** **Aquí está la línea, y se cruza por el art. 7.5**, no por el 7.1:

> Art. 7.5 Dir. 96/9/CE (art. 133.2 TRLPI): *«No se autorizará la extracción y/o reutilización **repetida o sistemática** de partes no sustanciales… que supongan actos contrarios a una explotación normal de esa base o que causen un perjuicio injustificado a los intereses legítimos del fabricante.»*

Una pantalla que se actualiza cada minuto, cada fin de semana, durante una temporada, **es el supuesto de hecho del 7.5 en su forma de manual**. Da igual que cada jornada por separado sea insustancial: el 7.5 existe precisamente para lo que se reconstituye por acumulación. Y ADR-008 §5.2 ya lo escribió sin ambages: *«Un sondeo continuo sobre muchas competiciones **es** el art. 7.5 de la Directiva 96/9/CE y ahí no hay lectura benigna: se licencia o se acuerda»*.

Añade dos precedentes que van en direcciones opuestas y hay que citar los dos:

- **En contra:** *Innoweb v. Wegener* (C-202/12, 19-dic-2013). Un metabuscador dedicado que pone a disposición del público el contenido de la base ajena **reutiliza**, aunque no copie nada y aunque sirva las consultas de una en una. Una pantalla que refleja en vivo la cobertura de ceroacero para una competición **se parece a Innoweb**, y conviene no fingir que no.
- **A favor:** *CV-Online Latvia v. Melons* (C-762/19, 3-jun-2021). El TJUE reorienta el criterio: lo que decide es si la extracción/reutilización **menoscaba la inversión** del fabricante, con un test de proporcionalidad frente a la competencia. Una pantalla de dos competiciones gallegas, sin publicidad, sin API y sin tráfico, difícilmente menoscaba la inversión de ZOS. Es el argumento más fuerte disponible hoy — y es **exactamente el argumento que muere el día que haya tráfico o monetización** (§6).

**Conclusión operativa del §1:** la línea no separa «un resultado» de «una jornada» de «una temporada» como tamaños de página. Separa **una ventana de medición acotada y declarada** de **una publicación continua**. EPIC-002 pide dos jornadas (`_epica.md`, §Criterios de éxito). **Dos jornadas caen del lado bueno. La tercera ya no, y la temporada no está ni cerca.** Esto no es una recomendación: es dónde está el borde, y la spec tiene que escribirlo con número.

### 1.4 ¿Cambia algo que el calendario sea declarado a mano? **Sí, y bastante.**

**DICTAMEN: es la mejor pieza defensiva que tiene el proyecto, y hay que protegerla explícitamente.**

Por SPEC-010 y ADR-017, la lista de partidos vive en `calendario/<temporada>/<competition_id>.json`, **declarada por una persona** con los nombres canónicos de la RFGF (D-2), y el `match_id` se deriva de competición, jornada y equipos. Esto importa por tres razones jurídicas concretas:

1. **La selección y la disposición son nuestras.** El *sui generis* protege la inversión en *obtener, verificar y **presentar***. La presentación —qué partidos, en qué jornada, con qué nombres, en qué orden— **no se toma de ceroacero**. Lo que se toma de ceroacero se reduce a **un campo volátil por partido**: marcador y estado.
2. **Rompe a medias la analogía con *Innoweb*.** No somos un metabuscador que pone a disposición el contenido de su base: somos nuestra propia lista, rellenada con un dato. Es una diferencia real y citable, aunque no neutralice el art. 7.5.
3. **Y el calendario en sí probablemente no está protegido para nadie.** *Fixtures Marketing* (C-46/02, C-338/02, C-444/02, 9-nov-2004): la inversión en **crear** los datos —confeccionar el calendario de una liga— **no cuenta** para el *sui generis*; solo cuenta la inversión en obtener datos preexistentes. Es decir, ni la RFGF tendría un *sui generis* fuerte sobre su lista de partidos. Que el proyecto la declare a mano lo pone, además, del lado correcto de esa doctrina sin depender de ella.

**Condición vinculante que se deriva, y que hay que escribir porque hoy nada la protege:** esta defensa **vale exactamente mientras el calendario siga siendo humano**. El día que alguien rellene `calendario/` a partir del HTML de ceroacero —o se lo pida a un LLM sobre ese HTML— la defensa desaparece **en silencio y sin que ningún test se ponga rojo**. La spec debe decir, como CA: *el calendario declarado no se deriva de ninguna fuente rastreada, y una carga que lo hiciera es un incumplimiento, no un atajo.*

---

## 2. ¿Hay que citar la fuente en la pantalla?

**Obligación legal: NO.** Tres comprobaciones, para que nadie la reabra:

- El *sui generis* (arts. 133-137 TRLPI) es un **derecho patrimonial**, no moral: **no lleva derecho de paternidad**. No hay deber de atribución.
- El derecho moral de paternidad (art. 14.3 TRLPI) protege **obras**. Un marcador no es obra. No aplica.
- La excepción de cita (art. 32 TRLPI) **sí** exige indicar fuente y autor, pero se aplica a la inclusión de fragmentos de **obra ajena**. No estamos citando una obra: estamos usando hechos. No es nuestra base y su requisito de atribución no nos alcanza.
- Colateral que conviene tener localizado: el **derecho conexo de editores de prensa** (art. 15 DSM / art. 129 bis TRLPI). Los sitemaps de ceroacero incluyen `news` y `articles`. Si alguna vez se republicara **texto** suyo, ese derecho sí muerde. Publicando solo un número, queda fuera.

**Y hay un hecho del repositorio que corrige la premisa de tu pregunta.** Tu encargo dice que «el proyecto ya publica en `/robot` qué fuentes rastrea, así que el hecho ya es público». **No es así.** He comprobado que **ni `ceroacero` ni `besoccer` aparecen en `src/i18n/`, `src/site/` ni `src/app/`**. `/robot` publica el user-agent, el ritmo, la política de robots.txt, la retención y el buzón — y sobre las fuentes dice deliberadamente *«Hai fontes que hoxe non lemos precisamente por iso»*, **sin nombrar a nadie**, y eso está sujeto por test (`crawler-page.test.ts` caso 11, «la regla general, sin citar a nadie (CA-13)»).

Es decir: **que este proyecto lee `ceroacero.es` no es hoy un hecho público.** Ponerlo en la pantalla del marcador no sería recordar algo ya dicho: sería **la primera divulgación**, y en el formato más desfavorable posible — una admisión escrita, propia, fechada y por partido, de reutilización sistemática. Es literalmente la prueba del art. 7.5 redactada por el demandado.

**RECOMENDACIÓN (con motivo, y es lo que recomiendo):**

- **NO se nombra la fuente en la pantalla del marcador.** Ni por fila, ni al pie, ni en un «datos de…». No aporta ninguna cobertura legal —no existe el deber— y aporta prueba en contra.
- **NO se oculta el hecho.** El sitio mantiene **un solo lugar honesto y auditable** donde se explica cómo se obtiene el dato: `/robot`. La pantalla enlaza a `/robot` con una frase neutra («de onde vén este dato»), sin nombrar terceros. Eso conserva la postura de transparencia que **es** la mitigación real de este proyecto (espíritu de RN-11, buzón delante de ADR-012 §3) sin convertir el marcador en un producto con marca ajena.
- **Y si el gate decide que sí se nombra**, entonces se nombra **en `/robot`, no en el marcador**, y en el mismo cambio en el que se corrige `noRepublish`. Coherente, en un sitio, y no repetido en cada fila. Nombrar en la pantalla y callar en `/robot` sería lo peor de las dos opciones.

Aviso menor: usar el nombre «ceroacero» como referencia descriptiva sería **uso nominativo lícito** (art. 37 Ley 17/2001 de Marcas, con arreglo a prácticas leales) y no infringe marca por sí mismo. El problema no es marcario; es probatorio.

---

## 3. ¿Debe estar indexada la página?

**DICTAMEN VINCULANTE — si se publica: `noindex, nofollow`, y `robots.txt` no se toca.**

- **`noindex, nofollow` por cabecera HTTP `X-Robots-Tag` **y** por `<meta name="robots">`.** Las dos, no una. Es exactamente el precedente ya implementado y verificado de SPEC-017 CA-1.10 (`src/admin/handler.ts:118`, `src/admin/view/markup.ts:64`).
- **NO entra en `robots.txt`.** `src/site/robots-txt.ts` genera hoy `User-agent: * / Allow: /` y **no debe cambiar**. La razón está escrita ya en el runbook del panel (`docs/procedimientos/acceso-al-panel-del-operador.md:118`): *«publicar un `Disallow: /admin` sería confirmar que existe»*. Aquí vale palabra por palabra. Y hay una segunda razón, propia de este proyecto: `robots.txt` es el fichero con el que este proyecto **pide a otros** que le dejen pasar (es el objeto de la carta a la RFGF). Ensuciarlo con exclusiones defensivas propias mientras se pide lo contrario a un tercero es un mal negocio retórico.

**Y ahora lo que hay que escribir para que nadie lo malinterprete dentro de seis meses:**

> **`noindex` no es una defensa jurídica. Es mitigación de descubrimiento.** La reutilización del art. 7.2.b es *«poner a disposición del público»*: una URL pública sin indexar **está puesta a disposición del público** igual. Nadie puede alegar más adelante «estaba en `noindex`, luego no lo publicábamos».

**Riesgo concreto de ser encontrada, con fechas:**

- **Por ZOS, Lda.:** bajo por vía técnica. Las peticiones salen de servidor, sin `Referer`, y el user-agent apunta a `https://marcador.gal/robot`, que no nombra fuentes. Alguien que investigue ese user-agent llegará a `/robot`, leerá «non republicamos os datos de ninguén», y **si a la vez existe un marcador público, ese es el momento del daño**. El riesgo no es que encuentren la pantalla: es que encuentren la contradicción.
- **Por la RFGF:** **alto y con fecha.** Se les mandó la URL de `/robot` y de `/proxecto` el 2026-09-01, y el plazo vence el **2026-09-08**. Es exactamente la semana en la que es más probable que alguien de la federación abra `marcador.gal`. Y verían **sus dos competiciones** publicadas; que el dato venga de ceroacero y no de `futgal.es` es una distinción que la pantalla no comunica y que ellos no tienen por qué hacer.

**RECOMENDACIÓN FUERTE, y es la que de verdad resuelve la spec:**

**Durante EPIC-002, la pantalla no necesita ser pública.** Lo dice la propia épica: *«"publicado" se mide como `Decision` escrita»* (`_epica.md`, §Fuera). Las cuatro cifras —latencia, cobertura, conflictos, minutos de operación— **se miden contra el log de `Decision`, no contra una URL servida**. Una pantalla accesible tras la misma **sesión declarada** que ya existe para el panel (ADR-024, `src/admin/session.ts`) da a la épica exactamente lo mismo y:

- no desmiente `noRepublish`, `noProduct` ni la carta;
- no es reutilización *puesta a disposición del público* en el sentido del art. 7.2.b, con lo que **el análisis de §1 deja de aplicar entero**;
- no necesita `noindex`, ni aviso de privacidad, ni disparador de tráfico;
- **y no gasta la firma del gate** en un riesgo que la épica no necesita asumir.

Publicar de verdad tiene sentido cuando haya algo que enseñar y a quién: eso es la épica de producto, con su propia decisión y, si hace falta, con acuerdo o licencia. **Hoy es coste sin contrapartida.** Si el gate quiere igualmente la URL pública, que sea una decisión firmada sabiendo esto, no un efecto lateral de una spec técnica.

---

## 4. Qué NO se puede publicar en esa pantalla

**DICTAMEN VINCULANTE.** Lista cerrada. Lo que no está en «permitido» está prohibido.

**Permitido en la proyección pública:**

| Campo | Origen | Por qué |
|---|---|---|
| Competición, jornada, equipos, hora | **Calendario declarado** (`calendario/`, SPEC-010) | Es nuestro, no extraído (§1.4). Nombres canónicos RFGF (D-2) |
| `status` (las cinco ramas) | `Decision` | Es el dato |
| `home_score` / `away_score` | `Decision` | Es el dato |
| Cualificador: *provisional* / *confirmado* / *sen sinal* | Derivado | **Obligatorio**: `FOUNDATION.md` §No-negociables (RN-03: «siempre marcado como tal»), RN-07, ADR-013, ADR-026 |
| Instante del último dato | `decided_at` | Presentado como **nuestro** («último dato»), nunca como «actualizado desde X» |

**Prohibido, con su motivo:**

1. **Escudos de clubes.** Ya prohibido: no-negociable de `FOUNDATION.md`, marcas registradas (art. 34 Ley 17/2001). Alternativa prevista y suficiente: **colores e iniciales**. Los **nombres** de equipo sí van, y en su forma canónica RFGF. Tampoco logotipos de la RFGF ni nada que insinúe respaldo oficial (D-1: inspiración, no sucesión; y aquí, además, no somos oficiales de nadie).
2. **Nombres de fuentes.** §2. No es ilegal; es prueba en contra y sería la primera divulgación.
3. **`raw_ref`. Terminante.** Y por una razón que no es obvia y que hay que dejar escrita: la clave raw es `<source>/<competition_id>/<YYYY-MM-DD>/<instante>-<sha256(body)[0..12]>` (ADR-009, §Contexto). **El nombre de la fuente va dentro de la cadena.** Publicar un `raw_ref` es publicar la fuente, aunque nadie lo pretenda. Ni en HTML, ni en JSON, ni en un atributo `data-`, ni en un comentario.
4. **`operator_id`, `correspondent_id`, `observer_id`.** §5.
5. **La existencia de alertas y de conflictos.** **RN-05 lo dice literalmente: «El conflicto no se publica».** La bandeja de SPEC-017 es del panel. `sen sinal` (RN-07) **sí** es público — pero como **estado del partido**, jamás como «la fuente X lleva 15 minutos callada».
6. **`confidence` / pesos de RN-01.** Publicar «0.7» es publicar la naturaleza de la fuente sin nombrarla.
7. **Cualquier dato distinto del marcador y el estado.** En particular: **clasificación**, goleadores, alineaciones, árbitros, entrenadores, eventos minuto a minuto, estadísticas. Dos motivos independientes: (i) una **tabla de clasificación** es una base de datos derivada por derecho propio y se acerca mucho más a la inversión del agregador; (ii) los demás son datos personales (§5) y ADR-009 §3 **ya prohíbe** que la calibración apunte a esos campos — esa restricción se extiende ahora a la proyección pública.

### 4.1 La traza de D-6 / RN-12: **NO se enseña al público**

**DICTAMEN VINCULANTE, y la tensión que planteas se disuelve leyendo las dos reglas por sus verbos.**

- **D-6** dice: *«Cada Decision **registra** la regla aplicada y las observaciones que la sostienen. Un marcador publicado siempre **sabe** de dónde viene.»*
- **RN-12** dice: *«Cada `Decision` **registra** la regla aplicada y las observaciones que la sostienen»*, y justifica: *«sin eso el spike no produce datos, solo marcadores»*.

**El sujeto de «sabe» es el sistema, no el lector. El verbo es «registra», no «muestra».** Es una obligación sobre el **registro**, y así está implementada: en el modelo canónico (`src/model/decision.ts`: `rule` + `SupportingObservationIdsSchema`, tupla no vacía en el **tipo**), y en triggers de plpgsql y `CHECK` sobre arrays (ADR-006, `migrations/0001`). Vive entera en el camino de escritura.

Su **audiencia declarada** son dos, y las dos autenticadas:
- **el operador**, porque RN-01 exige que arbitre *«con el contexto de todas las fuentes y del histórico delante»* — para eso existe `src/decide/read-entry.ts`, cuya cabecera lo dice con estas palabras y que solo consume el panel (SPEC-017 CA-12);
- **el verificador**, contra el ledger.

**El público no está en esa lista, y nunca lo estuvo.** Enseñar la traza no añade **nada** a D-6 —la trazabilidad ya está cumplida por el log— y entrega a un tercero un registro por partido, fechado y firmado por nosotros, de extracción sistemática: la prueba del art. 7.5, servida.

**Y hay una trampa técnica concreta que la spec tiene que esquivar, porque el camino fácil la pisa.** El comentario de `CLAUDE.md` dice que `zod` *«exporta el tipo que consume el frontend»*, y `read-entry.ts` devuelve `Decision` «plain values… the canonical model the frontend already receives». Servir un `Decision` tal cual a la página pública filtra:

- **`rule`** — legible y elocuente: `RN-01` significa «el operador impuso su precedencia»; `RN-04`, «se bajó un marcador o se liberó un salto retenido»; `RN-02`, «dos fuentes independientes coincidieron», que tras ADR-008 §1 es información sobre la arquitectura de fuentes por sí sola;
- **`supporting_observation_ids`** — ids opacos, sí, pero **su cardinalidad no lo es**: dos ids en una fila dicen «hay dos fuentes» sin nombrar ninguna;
- **`version`** — el número de rectificaciones por partido.

**VINCULANTE:** *el payload público es una **proyección** construida a propósito, no el `Decision` canónico.* Debe ser un tipo distinto, con los campos del cuadro «permitido» y ninguno más, y con un **test que se ponga rojo si un campo nuevo del `Decision` se filtra a la proyección**. Sin ese test es una convención, y las convenciones no sobreviven a la spec siguiente.

---

## 5. Datos personales

**DICTAMEN: con las restricciones del §4, en la pantalla NO hay ningún dato personal.**

- **Nombres de equipo y competición:** clubes son personas jurídicas o entidades; no son datos personales (art. 4.1 RGPD, «persona física»). Fuera del RGPD.
- **Marcador, estado, jornada, instantes:** no personales.
- **Jugadores, árbitros, entrenadores, goleadores, alineaciones:** **sí** son datos personales, y **no se publican** (§4, punto 7). No es hipotético: los sitemaps de ceroacero comprobados hoy (`_players`, `_coaches`, `_referees`) confirman que esas páginas existen en la fuente, así que la tentación es real y la prohibición tiene que estar escrita, no supuesta.
- **`correspondent_id` y `operator_id`:** son **seudónimos declarados**, y **la seudonimización NO saca un dato del RGPD** — Considerando 26 y art. 4.5 RGPD: sigue siendo dato personal mientras exista la clave de reidentificación, y **el proyecto la tiene** (`TELEGRAM_CORRESPONDENTS`, ADR-022 §2). Publicarlos sería tratamiento **sin base legal y sin necesidad alguna**: falla minimización (art. 5.1.c) antes que ninguna otra cosa. **Fuera, sin excepción.** El régimen de ADR-023 se mantiene intacto.

**¿Hay que decir algo en RGPD por servir una página pública con analítica cero?**

Confirmo y extiendo mi propio dictamen del **2026-09-01** (ledger de SPEC-007, CA-7.2):

- **Cookies / art. 22.2 LSSI:** sin cookies, sin `localStorage`, sin peticiones a terceros → **no hace falta banner ni consentimiento**. **Condición vinculante:** que siga siendo verdad. ADR-026 §3.5 ya autoaloja Geist en `public/fonts/` y prohíbe pedir una fuente a un tercero en carga; una sola fuente, script o pixel de CDN convertiría la IP de cada visitante en una cesión a un tercero y **cambiaría esta respuesta**.
- **Logs de servidor:** Vercel trata IPs (dato personal) como **encargado**. Es un tratamiento con base en el **interés legítimo** (art. 6.1.f: operación y seguridad). No obliga por sí solo a un banner, pero sí a poder explicarlo si alguien pregunta.
- **Art. 10 LSSI (identificación del prestador):** **hoy no aplica**, por lo mismo que dictaminé el 2026-09-01: sin publicidad, sin patrocinio, sin formulario, no hay actividad económica ni directa ni indirecta. ADR-012 §1 (el sitio no nombra a ninguna persona física) **sigue en pie**. **Disparador ya escrito y que repito porque ahora está más cerca:** el día que haya patrocinio, publicidad o lista de espera, el art. 10 pasa a aplicar y exige identificación — lo que **choca de frente con ADR-012**. Ese día no se parchea: se escribe un ADR y se pide **revisión profesional antes de monetizar**.
- **RECOMENDACIÓN (no vinculante), solo si la pantalla se hace pública:** una línea de privacidad alcanzable desde ella —qué registra el servidor, quién es el encargado, cuánto se conserva, y el buzón `ola@tremen.dev`—, redactada **sin nombrar a ninguna persona física**, que es perfectamente posible bajo ADR-012 (el responsable declarado es el paraguas, el contacto es el buzón).

---

## 6. Condiciones para que el riesgo siga siendo el residual ya aceptado, y el disparador escrito

### 6.1 Primero, la corrección de premisa

**VINCULANTE:** **el riesgo residual de ADR-008 §5 NO cubre esta publicación, y no puede heredarse.** Motivos, los tres independientes:

1. Lo firmado fue **capturar**, bajo el límite expreso *«Es medición, no producción. Ningún dato se publica»* (ADR-008 §5.2). Publicar es el acto que ese límite excluye.
2. Lo firmado era sobre **besoccer.es** (ZOS no era el titular en cuestión), y besoccer quedó además descartada por servir armazones vacíos (`hallazgos/fontes-capturables.md`).
3. El acto cambia de naturaleza jurídica: de **extracción** amparada por el art. 4 TDM a **reutilización** (art. 7.2.b), que ninguna excepción cubre.

**Por tanto: SPEC-018 necesita su propio ADR con firma del gate, no una remisión a ADR-008.** Ese ADR debe decir, con la misma honestidad con la que ADR-008 §5 dijo lo suyo, qué se acepta y qué no queda seguro por firmarlo.

### 6.2 Condiciones vinculantes si se publica

Cada una es CA de la spec, no prosa:

1. **Acotada en tiempo, declarada en número.** Solo las **dos jornadas de medición** de EPIC-002. Fuera de una jornada declarada, la pantalla **no sirve marcador**. Es lo que la mantiene del lado correcto del art. 7.5 (§1.3).
2. **Acotada en alcance.** Solo Preferente Futgal G1 y Terceira RFEF G1. Ninguna competición más, por ninguna vía.
3. **Sin archivo histórico público.** Se sirve la jornada viva, **no la temporada**. Un histórico navegable *es* la acumulación que el 7.5 castiga.
4. **El calendario sigue siendo humano** y no se deriva de ninguna fuente rastreada (§1.4).
5. **Solo los campos permitidos del §4**, servidos como **proyección** y no como `Decision` canónico, con test que caza la filtración (§4.1).
6. **Sin superficie programática de ningún tipo.** Ni endpoint JSON documentado, ni CORS abierto, ni feed, ni widget, ni exportación, ni API — gratis o de pago. Un feed **es** el negocio de datos que `FOUNDATION.md` §Alcance pone «dentro» del proyecto **a futuro**, y ese día se licencia o se acuerda; hoy no existe.
7. **Cero monetización.** Sin publicidad, sin patrocinio, sin muro de pago, sin contraprestación. Además de lo dicho en §5, es lo que mantiene vivo el argumento de *CV-Online* (§1.3) y lo que evita disparar el art. 10 LSSI.
8. **RN-11 intacta, y esto merece un CA propio porque es el peor error disponible en esta spec:** **el polling del navegador jamás provoca una petición a un tercero.** La página lee **el snapshot ya persistido**; la ingesta la sigue marcando el cron a 1/min por competición. Una implementación que refresque bajo demanda convierte N lectores en N peticiones a ceroacero y **revienta RN-11 en el primer minuto**, sin que el número de la regla haya cambiado. Debe haber un test de frontera —el precedente y la forma de hacerlo están en SPEC-009 y ADR-016— que demuestre que la ruta pública **no alcanza `politeFetch`**. (Existe ya un precedente exacto: SPEC-017 CA-13.2 hizo justo esto para las rutas del panel.)
9. **`noindex` por cabecera y por meta; `robots.txt` sin tocar** (§3).
10. **`noRepublish` y `noProduct` corregidos en el mismo cambio**, por el procedimiento de ADR-015, y la RFGF avisada. **Y no antes del 2026-09-08** (§0).
11. **El buzón sigue delante** (ADR-012 §3), y ahora también para la publicación: quien quiera que se pare, escribe y se para.
12. **La retención no se alarga.** ADR-009 (30 días, una prórroga escrita, techo duro de 90) sigue gobernando el archivo. Publicar **no** es motivo para conservar más tiempo; si alguien lo alega, es señal de que la publicación dejó de ser medición.
13. **Antes de cada ventana, se re-comprueba el `robots.txt` de ceroacero *y* la ausencia de reserva legible por máquina de TDM** (art. 4.3 DSM). Lo primero ya lo hace `src/polite/robots.ts` (vigencia 6 h, fallo cerrado, ADR-014 §3.2); **lo segundo no lo mira nada hoy** y su aparición retiraría el amparo del art. 4 también para el archivo.

### 6.3 El disparador escrito que debe llevar la spec

Propongo este texto literal para el cuerpo de SPEC-018 (o para el ADR que la acompañe). Va redactado como cláusula, no como recordatorio, porque un disparador sin efecto declarado no dispara nada:

> **Disparador de re-dictamen — bloqueante.**
> Esta publicación deja de estar amparada por el dictamen de `sdd-legal-datos` del 2026-09-04, y **no se sirve una petición más** hasta que ese rol vuelva a dictaminar y el gate humano firme un ADR nuevo, en cuanto ocurra **cualquiera** de estas siete cosas:
> 1. la publicación pasa de las **dos jornadas de medición** de EPIC-002 a una tercera, o se vuelve continua;
> 2. entra una competición distinta de Preferente Futgal G1 o Terceira RFEF G1;
> 3. se publica cualquier dato que no sea marcador, estado, cualificador e instante del último dato — en particular **clasificación**, goleadores, alineaciones, árbitros, entrenadores o eventos minuto a minuto;
> 4. la pantalla deja de ser `noindex`, se enlaza desde `/proxecto`, `/robot` o desde cualquier sitio externo, o aparece en `robots.txt`;
> 5. un tercero obtiene **acceso programático** al dato: endpoint documentado, JSON público, CORS abierto, feed, widget, exportación o API, gratuita o de pago;
> 6. aparece **cualquier forma de monetización** sobre la pantalla: publicidad, patrocinio, muro de pago o contraprestación de cualquier tipo (D-7, y art. 10 LSSI);
> 7. el tráfico deja de ser el del operador y su entorno. **Umbral concreto, para que no sea una impresión:** cualquier día con **más de 100 visitantes distintos**, o cualquier enlace entrante desde un medio, un club, la federación o una red social.
>
> Y además, sin esperar a ninguna de las siete: **el día que ZOS, Lda. o la RFGF escriban pidiendo que se pare, se para primero y se dictamina después.** Es lo que `/robot` promete al rastreo —«abonda con pedilo: non fai falta alegar nada»— y la publicación no puede prometer menos que la captura.
>
> **Ninguno de los siete lo vigila un test, y el proyecto no tiene CI.** Este disparador entra en `docs/procedimientos/calendario-de-compromisos.md` por el mismo motivo por el que existe ese fichero: nadie se va a enterar en rojo.

---

## 7. Resumen ejecutivo

### Dictamen vinculante

| # | Dictamen |
|---|---|
| V1 | **Bloqueante.** No puede haber pantalla públicamente accesible mientras `/robot` diga «non republicamos os datos de ninguén… non hai marcador público» (test `crawler-page.test.ts` 12) y `/proxecto` diga «nin marcador público». Se corrigen por ADR-015 en el mismo cambio, o la pantalla no es pública. |
| V2 | **Bloqueante y con fecha.** No se publica **antes del 2026-09-08**, plazo vivo de la carta a la RFGF, que declara «non republico os seus datos». |
| V3 | El riesgo de ADR-008 §5 **no cubre** publicar. Es otro acto (reutilización, art. 7.2.b), otro titular (ZOS, Lda.) y sin amparo del art. 4 TDM. **Requiere ADR propio y firma del gate.** |
| V4 | La línea de «parte sustancial» la cruza el **art. 7.5** (repetido y sistemático), no el tamaño de la pantalla: dos jornadas sí, temporada continua no. Debe estar en la spec **con número**. |
| V5 | El calendario declarado a mano es defensa real y **debe blindarse**: CA que prohíba derivarlo de una fuente rastreada. |
| V6 | El público recibe una **proyección**, nunca el `Decision` canónico. Fuera: `rule`, `supporting_observation_ids`, `version`, `raw_ref`, `confidence`, fuente, ids de operador/corresponsal, alertas y conflictos (RN-05). Con test que caza la filtración. |
| V7 | **D-6 / RN-12 se cumplen con el registro, no con la pantalla.** No hay obligación ni permiso de exhibir la traza. Su audiencia es el operador (RN-01, SPEC-017 CA-12) y el verificador. |
| V8 | El polling público **nunca** dispara una petición a un tercero. Test de frontera obligatorio (ADR-016; precedente SPEC-017 CA-13.2). |
| V9 | Si se publica: `noindex, nofollow` por cabecera **y** meta; `robots.txt` **no se toca** (precedente SPEC-017). Y se declara en la spec que `noindex` **no es defensa jurídica**. |
| V10 | Escudos y logotipos, fuera (ya no-negociable). Nombres canónicos RFGF, dentro. Ni un dato personal: jugadores, árbitros, entrenadores, goleadores, alineaciones, `correspondent_id`, `operator_id` — fuera. |

### Recomendación

| # | Recomendación |
|---|---|
| R1 | **La mejor solución es que la pantalla no sea pública en EPIC-002.** La épica mide «publicado» como `Decision` escrita: la URL pública no le aporta nada y le cuesta todo lo de arriba. Detrás de la sesión declarada de ADR-024, el §1 entero deja de aplicar. |
| R2 | **No citar la fuente en la pantalla.** No hay deber legal (no hay paternidad en el *sui generis*), y sería la **primera** divulgación pública de que se lee ceroacero — hoy `/robot` no nombra a nadie, por CA-13. Enlazar a `/robot` con frase neutra, y llevar allí la honestidad. |
| R3 | Si se publica: línea mínima de privacidad sin nombrar persona física; y vigilar que sigan siendo ciertas las cero peticiones a terceros (ADR-026 §3.5 ya ayuda). |
| R4 | Nada de tabla de clasificación, ni histórico navegable, ni «último dato desde X». |

### Requiere revisión profesional (no lo puedo cerrar yo)

- Si dos jornadas de publicación sobre dos competiciones caen o no del lado del art. 7.5 frente a ZOS, Lda. — mi criterio es que sí, pero es el juicio de valor central de este dictamen.
- El día que haya monetización: art. 10 LSSI + colisión con ADR-012 (identificación del titular). **Antes de monetizar, no después.**
- Cualquier feed, widget o API B2B: eso es licencia o acuerdo, no dictamen.
- Sigue pendiente lo que ADR-009 dejó abierto: si el interés legítimo del art. 6.1.f necesita ponderación formal documentada y registro de actividades del art. 30.

### Invariantes afectados y artefactos a revisar

- **Reglas:** RN-05 (el conflicto no se publica), RN-07 (*sen sinal* sí), RN-08, RN-11, RN-12, RN-13.
- **FOUNDATION:** D-1, D-2, D-6, D-7, D-8; no-negociables de legalidad de la obtención y de escudos.
- **ADRs a citar en SPEC-018:** ADR-008 (§5, y su límite «ningún dato se publica»), ADR-009 (§3 restricciones a lo derivado; y que el art. 4 TDM no cubre publicar), ADR-011, ADR-012 (§1 y §3), ADR-013, ADR-015 (procedimiento para enmendar SPEC-004/005), ADR-017, ADR-024, ADR-026.
- **Specs cerradas que esta toca:** **SPEC-004** (`noProduct`, `robots.txt` CA-11) y **SPEC-005** (`noRepublish`, CA-6, CA-13). Cuerpo no se edita; enmienda en ledger por ADR-015.
- **Ficheros:** `src/i18n/gl.ts:226,271` · `src/i18n/es.ts:233,279` · `tests/site/crawler-page.test.ts:190` · `tests/site/pages.test.ts:207` · `src/site/robots-txt.ts` · `src/model/decision.ts` · `src/decide/read-entry.ts` · `src/admin/handler.ts:118` (precedente `noindex`) · `docs/negocio/carta-rfgf-acceso.md:60` · `docs/procedimientos/calendario-de-compromisos.md`.

### Hallazgo colateral, fuera de encargo pero lo he visto

`/proxecto` dice hoy: *«A medición aínda non comezou e non hai ningunha cifra»* (`src/i18n/gl.ts`, clave `measuring`, sujeta por test). **Con el cron de ingesta, el motor y el panel funcionando (SPEC-012, SPEC-013, SPEC-017 en `hecho`), esa frase ya no describe el proyecto**, al margen de SPEC-018. Es drift de contenido público con la misma forma de fallo que el §0: nadie se pondrá rojo. Destino sugerido: **EPIC-MEJORA** o la misma enmienda de ADR-015 que corrija `noProduct`.

**Este dictamen debe quedar por escrito en SPEC-018 o en su ledger** (regla dura del rol). No he escrito ningún fichero.

**Fuentes normativas citadas:** Directiva 96/9/CE arts. 7.1, 7.2.a/b, 7.5 · TRLPI (RDLeg 1/1996) arts. 10, 14.3, 32, 129 bis, 133-137 · Directiva (UE) 2019/790 art. 4 (transp. RDL 24/2021) · RGPD arts. 4.1, 4.5, 5.1.c, 5.1.e, 6.1.f, 30, Considerando 26 · LSSI-CE (Ley 34/2002) arts. 1, 10, 22.2 · Ley 17/2001 de Marcas arts. 34, 37 · Ley 3/1991 de Competencia Desleal art. 5 · Reglamento (UE) 2023/2854 (Data Act) · TJUE: C-203/02 *BHB/William Hill*, C-46/02 y C-338/02 y C-444/02 *Fixtures Marketing*, C-304/07 *Directmedia*, C-545/07 *Apis-Hristovich*, C-202/12 *Innoweb*, C-762/19 *CV-Online Latvia*.

Fuentes web consultadas: `https://www.ceroacero.es/robots.txt` · `https://www.ceroacero.es/` · Directiva 96/9/CE en EUR-Lex.

---

# Dictamen `sdd-competicion` — SPEC-018, snapshot y primera pantalla del marcador

> Emitido el 2026-09-04 por el rol consultivo `sdd-competicion`, a petición de
> `sdd-arquitecto`. **Contesta la pregunta que ADR-026 §7 le dejó con disparador
> escrito**: `descanso` y `suspended`. Se copia literal. No escribió ningún
> fichero.

He leído `dominio.md`, `reglas.md`, ADR-017, ADR-026 §4.3/§5/§6/§7, `src/calendar/`, `src/model/`, `migrations/0001`, `src/ingest/ceroacero.ts`, `src/decide/rules.ts`, `src/admin/board.ts` y `docs/procedimientos/carga-del-calendario.md`. **`calendario/` no existe todavía en el repositorio** (comprobado el 2026-09-04). Dictamen:

**Fecha:** 2026-09-04 · **Disparador:** ADR-026 §7 («No resuelve `descanso` ni `suspended` … disparador: la spec del snapshot»).

Convención de este dictamen: **[V]** = dictamen vinculante de dominio · **[R]** = recomendación · **[?]** = no lo puedo afirmar sin consultar la web de la RFGF, que no es capturable (ADR-008 §1) y que yo no he consultado.

---

## 1. `descanso` y `suspended`

### 1.a — El descanso es un atributo del juego, no un estado del partido

**[V] El descanso es un intervalo *dentro* de `live`, no un sexto estado.** Fundamento:

- **Regla de juego.** El partido son dos periodos de 45 minutos separados por un intervalo de descanso que no excede de 15 (Reglas de Juego IFAB, Regla 7 — *Duración del partido*). Un partido en el descanso **no ha terminado, no está detenido y no está suspendido**: está en curso, y el árbitro es su cronómetro. La competición no reconoce «descanso» como situación administrativa de un partido; las situaciones que sí reconoce son *jugado*, *aplazado*, *suspendido* y *no presentado*.
- **El acta arbitral registra el descanso como *dato*, no como *estado*:** el resultado al final de la primera parte es una casilla del acta, igual que el resultado final. **[?]** No puedo afirmar cómo lo presenta la app de acta digital de la RFGF ni si futgal.es publica un indicador de descanso en su tiempo real; requiere consultar futgal.es.
- **`ceroacero.es`: ya está resuelto en el código, y bien.** `src/ingest/ceroacero.ts`, `CEROACERO_SHAPE.statusWords`, contiene literalmente `['descanso', 'live']`. El adaptador ya lee la palabra y ya la colapsa a `live`. **Ese mapeo es correcto de dominio y la spec del snapshot no debe tocarlo.** Ahora bien, la cabecera del propio fichero declara que `SHAPE` es *«a declared convention, not an observation»* —el archivo de `raw/` es de la víspera de la jornada 1 y no contenía ninguna fila jugada—, así que **[?] no puedo afirmar que `ceroacero.es` escriba literalmente «Descanso»**, ni con qué grafía, ni si sustituye el marcador o lo acompaña. Eso lo dirá la primera captura real (ver trampa T1, que es grave).

### 1.b — No entra en `dominio.md` como sexto estado

**[V] `descanso` NO se añade como sexto estado.** Cuatro motivos independientes, cualquiera de ellos suficiente:

1. **No es un estado en el modelo de la competición** (1.a). Añadirlo sería inventar una categoría que la RFGF no tiene, que es exactamente lo que este rol existe para impedir.
2. **RN-06 es una tabla cerrada de transiciones y no tiene sitio para él.** Habría que escribir `live → descanso → live`, decidir quién puede provocarla (¿una fuente automática de 0.7?) y qué pasa con el timeout de `kickoff + 110 min`, que se cuenta sobre un partido que estuvo 15 minutos sin jugarse. Eso no es un literal nuevo: es reabrir el motor.
3. **El coste es desproporcionado y cae sobre specs cerradas.** Tocaría `MATCH_STATUSES` (`src/model/match.ts`, SPEC-001 CA-8), los cuatro `CHECK` de `migrations/0001` (`observations_status_known`, `decisions_status_known` y los dos `*_score_matches_status`) con una migración nueva irreversible (ADR-006), `src/i18n/statuses-bundle.ts` en las dos lenguas, y `src/decide/rules.ts` (SPEC-013). SPEC-001 y SPEC-013 están **`hecho`**: son dos enmiendas de ledger por ADR-015 más una migración, para un intervalo de 15 minutos que nadie puede confirmar que la fuente publique.
4. **El `DESC` de `docs/diseno/` no es evidencia de dominio.** Aparece en `_logic.js`, `Movil/Escritorio/Global.dc.html` y `Componentes.dc.html`, siempre sobre datos que el propio `canvas.json` declara inventados («*ningunha cifra destas pantallas é un dato*», citado en ADR-026 Consecuencias). `DESC` es una invención del canvas, no un hallazgo de la competición — y ADR-026 §4.3 ya lo trata como desviación, no como requisito.

**[R] Si algún día se quiere enseñar el descanso, la vía correcta es un *cualificador derivado*, no un estado** — la forma que ya tienen *pendente de confirmar* y *sen sinal* (ADR-021 §6: «se deriva, no se guarda»). Hoy **no se puede derivar**, porque el modelo no guarda ni minuto ni periodo (§2). Conclusión operativa: **hoy el descanso no se enseña, y un partido en descanso se enseña como *En xogo***.

**[R] Fila propuesta para `docs/fundacion/dominio.md`** — no un estado, sino una **entrada de resolución**, para que la pregunta no vuelva. Iría bajo la tabla de *Estados de un partido*, y la escribe `sdd-arquitecto`, no yo:

> **`descanso` no es un estado.** El intervalo entre las dos partes (Regla 7 IFAB, ≤ 15 min) es un momento **dentro de `live`**: un partido en el descanso está *En xogo*. No hay sexto estado, `MATCH_STATUSES` sigue teniendo cinco valores y RN-06 no gana ninguna transición. Lo que una fuente escriba como «Descanso» se lee como `live` — así lo hace ya `CEROACERO_SHAPE.statusWords`. `docs/diseno/` dibuja un `DESC` que **no está en este glosario** (ADR-026 §4.3) y queda inventariado en EPIC-004 como desviación del artefacto, no como hueco del modelo. Dictamen de `sdd-competicion`, 2026-09-04, disparado por ADR-026 §7.

### 1.c — `suspended`: qué es y cómo se presenta

**[V] `suspended` ≠ `postponed`, y la diferencia es que el partido *empezó*.** Un partido suspendido es uno que se inició y se interrumpió definitivamente antes de completarse (temporal, campo impracticable sobrevenido, falta de luz, lesión grave sin asistencia disponible, incidentes, agresión al árbitro). Un partido aplazado **no llegó a empezar**. El modelo ya respeta la distinción y hay que decirlo alto porque es un acierto: `migrations/0001` (`observations_score_matches_status`, `decisions_score_matches_status`) **obliga a que `suspended` lleve marcador y a que `postponed` no lo lleve**. Eso es dominio correcto codificado en la base.

**[V] Consecuencias para la pantalla:**

1. **Un `suspended` siempre tiene marcador parcial y ese marcador se enseña**, con la misma prominencia tipográfica que el de un `live`. Ocultarlo contradiría el `CHECK` que lo exige.
2. **Ese marcador NO es el resultado del partido, y la pantalla no puede presentarlo como tal.** Tras una suspensión decide el Comité de Competición: reanudación desde el minuto de la interrupción, repetición íntegra, o resultado del momento. Puede tardar días. **[?]** No puedo citar el artículo concreto del Reglamento General de la RFEF/RFGF sin consultarlo; lo que sí es firme es que la decisión no es del sistema ni de la fuente.
3. Por tanto: **`suspended` se muestra con su literal *Suspendido* (`dominio.md`), su marcador parcial, y una indicación de que el resultado no es definitivo.** No basta la etiqueta de estado: «Suspendido 1-0» se lee como resultado. **[R]** el literal exacto de esa coletilla en las dos lenguas lo dictamina `sdd-lingua`; yo no lo invento. Lo que sí dictamino es que **hace falta**.
4. **Nunca se ordena ni se agrupa como `finished`.** Un suspendido sigue perteneciendo a su jornada y a su hora (§3, §4).
5. **Hoy solo puede llegar de una persona.** RN-06 reserva `suspended` a fuente oficial o humano, la oficial no es capturable (ADR-008 §1) y `src/decide/rules.ts:235` lo aplica (`isOfficial(role) || isHuman(role)`). Un `suspendido`/`suspenso` leído de `ceroacero.es` (que `CEROACERO_SHAPE.statusWords` sí sabe leer) se **guarda como `Observation` (RN-13) y el motor lo ignora**, porque la fuente no es oficial ni humana. En la práctica: **el estado `suspended` solo aparece en pantalla si el operador o un corresponsal lo ponen.** Es correcto por RN-06, y es la raíz de la trampa T2.

---

## 2. El minuto de juego

**[V] La primera pantalla NO enseña el minuto.** Y no principalmente por coste técnico —que también—, sino por dominio:

- **En Preferente Futgal y en Terceira RFEF G1 no existe un cronómetro oficial publicado en tiempo real.** El minuto que muestra un agregador se calcula desde *su* estimación de la hora de inicio, no desde el reloj del árbitro. En estas categorías el kickoff real se retrasa con frecuencia (equipos que llegan tarde, actas que se cierran a mano, espera de ambulancia obligatoria), el tiempo añadido lo decide el árbitro y no se publica en ningún sitio, y la duración real del descanso varía. **Un minuto así se desvía varios minutos en cualquier partido y no hay forma de detectarlo.**
- **Un minuto poco fiable al lado de un marcador contamina el marcador.** Es lo contrario de **D-6** («un marcador publicado siempre sabe de dónde viene») y de RN-12. Si el usuario ve «87'» y el partido va por el 79, deja de creerse también el 1-0. Mejor ningún minuto que un minuto inventado — es la misma lógica que RN-03 con el signo cambiado.
- **El modelo no lo tiene y añadirlo toca specs cerradas.** `Observation` y `Decision` (`src/model/`, `migrations/0001`) no tienen columna de minuto; `SourceRow` (`src/ingest/ports.ts`) tampoco. Sería SPEC-001, SPEC-008 y SPEC-013, las tres `hecho`.
- **[?]** No puedo afirmar si futgal.es publica minuto en vivo. Lo que sí consta en el repositorio: `CEROACERO_SHAPE.liveMarker` es `/\blive\b|\b\d{1,3}'/u` — alguien previó que `ceroacero.es` **puede** mostrar un minuto y lo usa **solo como booleano** de «esta fila está viva». Nunca se captura. Y esa regex es parte de la convención declarada no calibrada, así que tampoco es prueba de que lo muestre.

**Qué se pierde, dicho sin adornos:** el usuario no distingue un 1-0 del minuto 5 de uno del 85. Es una pérdida real de contexto y la pantalla será menos rica que la de un agregador.

**[R] Qué lo compensa, con datos que el sistema ya tiene y que son honestos:** *«actualizado hai N min»* por partido, derivado del `observed_at` más reciente de las observaciones que sostienen la `Decision` — exactamente lo que `src/admin/board.ts` ya calcula como `last_observed_at`. Un «hai 1 min» dice más sobre la fiabilidad de ese 1-0 que un minuto de juego estimado, y es lo que hace legible *sen sinal* cuando aparece. Es además, literalmente, **la entrada 4 del inventario de EPIC-004** («faltan estados de carga y de dato viejo»), cuyo disparador ADR-026 §6 declara que «está a punto de dispararse: es la spec del snapshot». Esta es la respuesta a esa entrada.

---

## 3. Orden y agrupación de los partidos

### Hechos de la competición

| | Preferente Futgal G1 | Terceira RFEF G1 |
|---|---|---|
| Equipos 2026/27 | **18** | **18** [?] composición sin confirmar |
| Partidos por jornada | **9** | **9** |
| Jornadas (liga a doble vuelta) | **34** | **34** |
| Inicio | **domingo 6 de septiembre de 2026** | [?] |

- Preferente Futgal G1 2026/27: 18 equipos, jornada 1 el 6 de septiembre, nueve partidos (minutonoventa.com, consultado 2026-09-04). Concuerda con el ejemplo `"2026-09-06 17:00"` de ADR-017 §4 y con «los 36 equipos» (18+18) del runbook `docs/procedimientos/carga-del-calendario.md:9`.
- Terceira RFEF G1: 18 equipos en 2025/26 (siguetuliga.com). **[?] La composición de 2026/27 no la puedo confirmar** (ascensos, descensos, renuncias); requiere futgal.es. Descarto el «42 jornadas» que devolvió esa página: es incompatible con 18 equipos a doble vuelta (34) y lo trato como artefacto.
- **Total del spike: 18 partidos por fin de semana.** Caben enteros en una pantalla, que es la promesa del producto («densidad: todo en una pantalla», CLAUDE.md). **No hace falta paginar ni filtrar.**

### Escalonamiento — y esto cambia el diseño

**[V] Los partidos de una jornada NO se juegan a la misma hora. El escalonamiento sábado/domingo es la norma, no la excepción**, en las dos competiciones, y es más acusado en Preferente. Motivos de dominio: campos municipales compartidos entre varios clubes y varias categorías, campos sin iluminación homologada (que obligan a jugar de día y a adelantar horarios en invierno), y desplazamientos largos dentro de un grupo que va de Ferrol a Chantada. En Terceira RFEF G1 2025/26 los partidos de cada jornada se reparten entre sábado y domingo con horas distintas, más alguna jornada intersemanal (siguetuliga, calendario 2025/26).

**Consecuencia dura: no existe «la hora de la jornada», y no existe un modo «hoy».** Una jornada se extiende del sábado al domingo, y a veces al miércoles siguiente. **[V] Cada fila tiene que llevar fecha además de hora**, o la pantalla tiene que agrupar por día.

### Dictamen de orden

**[V]**

1. **Agrupar primero por competición.** No mezclar las dos en una sola lista ordenada por hora: son categorías distintas —una autonómica, una nacional— y el lector busca «la mía». Cabecera con el nombre canónico entero (§6).
2. **Dentro de cada competición, orden ascendente por `kickoff`.**
3. **No agrupar por jornada dentro de la competición.** En un fin de semana normal hay una sola jornada en juego. La jornada es contexto de cabecera («Xornada 3»), no un nivel de anidación.
4. **Desempate total y determinista**, como ya hace `orderBoard` (`src/admin/board.ts:114`): `kickoff`, y a igualdad, `match.id`. Sin desempate total, dos renderizados del mismo dato ordenan distinto y la lista «salta» entre polls.
5. **La pantalla pública NO ordena por estado ni por cualificador.** El panel del operador sí lo hace (`boardRank`, `src/admin/board.ts:97`) y con razón: es una cola de trabajo. **Esta pantalla no lo es.** Si un partido sube al empezar y baja al acabar, el usuario pierde de vista el suyo justo cuando más lo mira. **El orden es estable durante toda la tarde**, y lo que cambia dentro de la fila es el contenido, no su posición.

**[R]** Dentro de cada competición, subencabezado por día (*Sábado 12 · Domingo 13*) y dentro por hora. Es lo que hace legible una jornada escalonada, y evita repetir la fecha en cada una de las nueve filas.

---

## 4. Aplazamientos y horarios cambiados

### Frecuencia y motivos

**[?] No puedo dar un porcentaje** sin datos históricos de la RFGF. Lo que sí afirmo como dominio, y es lo que importa para la pantalla: **los aplazamientos en estas categorías son frecuentes y muy estacionales.** Motivos habituales, por peso:

1. **Campo impracticable por lluvia.** Es el motivo dominante, concentrado de noviembre a febrero, y afecta sobre todo a campos de hierba natural — que en Preferente son mayoría.
2. **Alerta meteorológica** (temporal, viento), que la RFGF traslada a suspensión de jornada completa o de una zona. Ocurre varias veces por temporada en Galicia.
3. Convocatorias de selecciones autonómicas/nacionales de categorías inferiores que dejan sin plantilla a un club.
4. Luto oficial.
5. Falta de futbolistas por sanciones o brote.
6. Coincidencia con otro acto en el campo (fiestas, otra categoría).

**[V] Y en Preferente Futgal es más frecuente que en Terceira RFEF**, porque los campos son peores, hay menos césped artificial y menos exigencia de instalación.

### La consecuencia que hay que decir en voz alta

**Hoy el sistema no puede saber solo que un partido está aplazado.** RN-06 reserva `postponed` a fuente oficial o humano; la oficial no es capturable (ADR-008 §1); `src/decide/rules.ts:235` lo aplica. Un «Aplazado» leído de `ceroacero.es` —que `CEROACERO_SHAPE.statusWords` sí sabe leer, `['aplazado','postponed']`— se guarda como `Observation` y **el motor lo ignora**, correctamente.

Y entonces pasa esto, que es **el peor fallo posible de esta pantalla** (trampa T2): el partido se queda `scheduled`, entra en ventana a su hora (ADR-019 §2), no llega ninguna observación de juego, y a **`kickoff + 110 min` RN-06 lo cierra a `finished`** marcado *pendente de confirmar*. **La pantalla publicaría «Rematado 0-0» de un partido que no se jugó.** En noviembre, con media jornada aplazada por lluvia, eso son cuatro o cinco filas falsas a la vez.

### Cómo se presenta un aplazado

**[V]**

1. **Se queda en la lista, en su posición por hora original.** Desaparecer es indistinguible de un fallo de carga, y el usuario que busca su partido tiene que encontrar la respuesta —«no se juega»— en el sitio donde lo busca. Es información, no ausencia de información.
2. **No va al final.** Mover la fila la esconde de quien la busca y rompe la estabilidad de orden de §3.5.
3. **Sin marcador.** `migrations/0001` lo prohíbe, y es correcto: un aplazado no tiene 0-0, no tiene nada.
4. Con su literal ***Aprazado*** (galego) / *Aplazado* (castellano), de `dominio.md`.
5. **Si el aplazamiento trae fecha nueva**, ADR-017 §3 dice que `kickoff` es mutable y es el mismo partido. **[R] El partido sigue enseñándose en su jornada, con la fecha nueva**, no se reubica en la jornada de la fecha nueva. Un partido de la jornada 12 que se juega el miércoles siguiente tiene que seguir apareciendo como jornada 12; si migra a la 13, quien lo busca no lo encuentra en ninguna de las dos.

---

## 5. Qué jornada se enseña por defecto

**[V] El criterio de dominio no es «la jornada en curso»: es *el próximo partido*, con memoria corta del anterior.**

La unidad que el aficionado tiene en la cabeza no es la jornada: es **el fin de semana**. En estas dos competiciones jornada ≈ fin de semana salvo intersemanales, así que la aproximación vale. Criterio, en este orden:

1. **Si hay algún partido `live` ahora mismo, la jornada en curso es la suya.** Sin excepción y sin umbral: nada gana a un partido jugándose.
2. **Si no, es la jornada que contiene el próximo `kickoff` no jugado.** Un martes, eso es la del sábado que viene — y es la respuesta correcta de dominio: **el martes el aficionado quiere saber contra quién juega, no repasar el 2-1 del domingo.** El resultado del domingo se consulta una vez; el partido del sábado se espera toda la semana.
3. **Excepción de cortesía, corta:** durante unas horas después del último partido terminado sigue siendo la jornada recién acabada, porque el domingo por la noche y el lunes la gente todavía consulta el resultado. **El número concreto de horas no es de este dictamen** — es una constante elegida y no medida, como `PRE`, `POST` y las 6 h de ADR-014 §3.2, y vive en el código con su motivo escrito.
4. **Los aplazados de jornadas anteriores NO arrastran su jornada.** Un partido de la 12 pendiente no mantiene la 12 «en curso» durante tres semanas tapando la 13. **[R]** Se enseña dentro de la jornada en curso, etiquetado con su jornada de origen («*Xornada 12 · aprazado*»). Es lo que hace la prensa deportiva y es lo único que evita que una jornada quede abierta indefinidamente.

**[V] Y la jornada por defecto tiene que ser navegable.** Con 34 jornadas y 18 partidos por fin de semana, poder ir a la anterior y a la siguiente es barato, y sin ello el criterio de «en curso» es infalsificable para el usuario: si acierta no lo nota, y si falla no tiene salida.

**[V] Si la jornada no está declarada, la pantalla lo dice; no la inventa.** El calendario declarado puede estar cargado a medias — `calendar_loads` registra qué jornadas trae cada carga (ADR-017 §2). «No hay partidos» y «no se declararon partidos» son cosas distintas y la pantalla no puede confundirlas: la primera es información, la segunda es un fallo operativo del que solo se entera quien mira. Y la degradación es **del calendario, no de la fuente** (ADR-017, *Consecuencias*).

---

## 6. Nombres canónicos

### Competiciones — [V]

- **«Preferente Futgal Grupo 1»**. `dominio.md`: *«Preferente Futgal. Grupo 1 en el spike. Nombre canónico RFGF. No es "Preferente Gallega"»*. *Futgal* es marca de la RFGF: F mayúscula, una sola palabra, no se traduce ni se separa.
- **«Terceira RFEF Grupo 1»**. Forma canónica galega adoptada el **2026-08-31 por decisión de dominio de Alberto Fojo** (`dominio.md`, *Nota sobre nomenclatura*), escalada desde SPEC-004/005 precisamente porque la fuente autoritativa no es capturable. *Tercera RFEF* en ADR-002 y en ledgers históricos designa la misma competición. **RFEF va en versales y no se traduce**: el nombre de la competición es de la RFEF, aunque el grupo lo organice la RFGF.
- **El grupo se escribe «Grupo 1», no «G1».** `G1` vive en el `competition_id` (`futgal-preferente-g1`), que es identificador y no texto visible — la misma separación que `dominio.md` ya hace entre `live` y *En xogo*.
- **Temporada: `2026/27`** en pantalla, con barra, que es como la escribe la RFGF y como la exige `RFGF_SEASON` en `src/calendar/schedule.ts`. `2026-27` es solo la forma del `MatchId` (ADR-017 §3) y no se enseña nunca.
- **[R]** Si el nombre completo no cabe como cabecera de grupo, **se parte en dos líneas o se reduce el cuerpo; no se abrevia.** «3ª RFEF» y «Pref. Futgal» no son nombres canónicos y no están en `dominio.md`.

### Equipos — [V] Prohibido abreviar

**No existe forma corta canónica y no se puede fabricar una.** `dominio.md`: *«El nombre canónico es el de la RFGF. "UD Ourense" ≠ "Ourense CF"»*. Abreviar es fabricar un alias, y **un alias de fuente nunca se convierte en nombre canónico** (misión de este rol). Truncar con elipsis es abreviar por otro medio y tiene el mismo efecto: colapsa pares que solo se distinguen por el prefijo o el sufijo, y publica un resultado falso. **[?]** No puedo afirmar que la RFGF no publique una forma corta; requiere futgal.es. Lo que sí sé es que lo que publica es el nombre registrado del club, y que ese nombre no tiene tres letras.

**[?] Cuál es el nombre más largo no lo puedo decir**, porque **`calendario/` no existe todavía en el repositorio** (2026-09-04) y los 36 nombres canónicos no están escritos en ninguna parte. Orden de magnitud con lo publicado para el Grupo 1 de Preferente 2026/27: *S.D.C. Órdenes, Galicia de Mugardos, U.D. Paiosaco, C.S.D. Arzúa, S.D. Negreira, C.F. Dumbría, Betanzos C.F.*; en Terceira 2025/26: *AC Montañeros, Rácing Villalbés, CD Estradense, UD Somozas, Céltiga FC*. Los verdaderamente largos serán los filiales y los patrocinados.

**[V] Aviso de identidad que este rol tiene que dar sí o sí:** hay clubes cuyo **nombre canónico RFGF está en castellano** — las fuentes consultadas listan «S.D.C. Órdenes» y «Puebla F.C.», no «Ordes» ni «A Pobra». `dominio.md` dice que **los nombres canónicos no se traducen**. Por tanto **una interfaz en galego mostrará topónimos castellanos en algunos nombres de club, y eso es correcto**: es el nombre registrado del club, no un topónimo. **No se galleguiza en `/`, no se castellaniza en `/es`, y el mismo nombre aparece idéntico en las dos rutas.** Es la misma regla que `dominio.md` aplica a *Preferente Futgal*.

**La forma exacta de los 36 nombres la confirma una persona contra futgal.es al escribir el calendario declarado, no yo y no un LLM** (RN-09, ADR-017 §1). Los nombres que doy arriba vienen de prensa deportiva y de agregadores: **son orientativos y no son autoridad.**

### Consecuencia de diseño — [R]

ADR-013 §4: sin escudos, la fila funciona solo con tipografía. Con dos nombres largos, un marcador y una etiqueta de cualificador —que **siempre** está presente, también en *confirmado* (ADR-026 §2)— a 360 px sin scroll horizontal (ADR-025 §3, intacto), **la fila de una sola línea no cabe**. La forma que no obliga a truncar ningún nombre es la **fila de dos líneas en móvil**: local arriba con sus goles a la derecha, visitante abajo con los suyos, estado y cualificador en una tercera zona. Es además la forma que hace tabular el marcador sin competir con el nombre. Lo digo como recomendación porque el dibujo es de la spec (ADR-026 §7), pero el **requisito de dominio es duro: ningún nombre canónico se trunca ni se abrevia en ninguna anchura.**

---

## 7. Trampas de dominio que veo venir

**T1 — [CRÍTICA] El descanso puede tumbar la página entera de una competición.** `tableExtractor` (`src/ingest/ceroacero.ts:158`) exige marcador en toda fila `live`, `finished` o `suspended`: *«Half a match is worse than none»*. `statusWords` mapea `'descanso' → 'live'`. **Si `ceroacero.es` escribe «Descanso» *en lugar del* marcador durante el intervalo, la fila lanza `UnreadableRowError`** — y ese `throw` está dentro del `$(...).each()` y **nadie lo captura por fila**: aborta el extractor entero. Resultado: **cero observaciones para los nueve partidos de esa competición** mientras cualquiera esté en el descanso; a los 15 minutos, RN-07 lleva a *sen sinal* a todos los que estuvieran `live`, más alerta por cada uno. Y esto es exactamente el trozo de `SHAPE` que la propia cabecera del fichero declara **convención no calibrada** (el archivo de `raw/` es de la víspera de la jornada 1 y no tenía ninguna fila jugada). **Se comprueba con una sola captura real durante un descanso, y hay que hacerlo antes de que esta pantalla sea pública.** No es de SPEC-018 arreglarlo —es SPEC-008, `hecho`— pero es de SPEC-018 que se vea, porque la pantalla es donde se notaría.

> Lo que **sí** he verificado y **no** es problema: RN-07 se mide sobre la llegada de observaciones, no sobre el cambio de marcador (`src/decide/rules.ts:429`, `nowMs - latestObservedMs(observations)`). Un descanso en el que la fuente sigue devolviendo la fila con su marcador **no** produce *sen sinal*. El riesgo es solo el de arriba: que no devuelva fila legible.

**T2 — [CRÍTICA] El aplazado silencioso se publica como «Rematado 0-0».** Desarrollado en §4. Es el fallo más probable de noviembre a febrero y el más caro: publica un resultado de un partido que no existió, en la primera pantalla del producto. Mitigación de dominio, no técnica: la pantalla tiene que hacer visible que ese `finished` es **por timeout y sin fuente que lo cierre** — que es precisamente lo que el cualificador ***pendente de confirmar*** ya dice, y que ADR-026 §2.4 obliga a mostrar con etiqueta de texto. **Un `finished 0-0` marcado *pendente de confirmar* y con «actualizado hai 3 h» es honesto; el mismo sin esas dos cosas es mentira.**

**T3 — El marcador de un `suspended` leído como resultado.** §1.c.

**T4 — [OPERATIVA, INMINENTE] La jornada 1 es el domingo 6 de septiembre de 2026 — dentro de dos días — y `calendario/` no existe en el repositorio.** Sin calendario declarado cargado no hay denominador, no hay ventanas de partido (ADR-019 §2), no hay identidad de partido y esta pantalla **no tiene nada que enseñar**. Súmese que `src/ingest/measurement.ts` nace vacía a propósito (ADR-019 §3): el tick no pide nada hasta que alguien declare una jornada de medición, con sus dos precondiciones escritas (ADR-020 §3). **SPEC-018 puede pasar todos sus tests en verde y servir una pantalla vacía en producción.** La spec tiene que decir qué enseña con el calendario sin cargar, y no puede ser una pantalla en blanco (§5, punto 5).

**T5 — Los filiales y los pares casi homónimos.** `dominio.md` ya avisa de «UD Ourense» ≠ «Ourense CF». Añado que en Terceira RFEF G1 juegan **filiales** cuyo nombre se distingue del primer equipo por una sola letra final (`CD Lugo B`). En una fila truncada, `CD Lugo B` → `CD Lugo`: dos clubes distintos con el mismo texto en pantalla. Refuerza el §6 y es el motivo concreto por el que no es negociable.

**T6 — No existe un modo «hoy».** Un sábado a las 18:00 hay, simultáneamente, partidos jugándose, partidos terminados hace dos horas y partidos que son mañana. Una pantalla organizada por «hoy» enseña un tercio de la jornada y esconde el resto (§3).

**T7 — [NO OBVIA] A finales de octubre cambian *todos* los horarios de Preferente a la vez.** Con el paso a horario de invierno anochece antes y los campos sin iluminación homologada —mayoría en Preferente— **adelantan sus horarios en bloque**. En la práctica: una recarga masiva del calendario declarado a finales de octubre en la que cambia el `kickoff` de casi todos los partidos restantes. ADR-017 §3 lo aguanta bien (kickoff mutable, identidad estable) y ADR-017 §4 rechaza correctamente las horas ambiguas del cambio. Lo que se rompe es otra cosa: **cualquier caché de horarios en esta pantalla servirá horas viejas**, y el usuario que llegue tarde al campo culpará al marcador. Es un dato de dominio que el arquitecto no tiene por qué conocer.

**T8 — Cobertura y pantalla no cuentan lo mismo.** La pantalla enseña lo que hay en el calendario declarado. Un partido que existe y nadie declaró **no existe para el sistema**, no aparece en pantalla, y tampoco baja la cifra de cobertura, porque no está en el denominador. Es el punto único de fallo que ADR-017 ya reconoce en sus *Consecuencias negativas*, y esta pantalla es donde se hace visible.

**T9 — No reabrir el mapeo de `descanso` en el adaptador.** `['descanso','live']` ya está y es correcto (§1.a). Que la spec del snapshot no añada una rama ni un estado para él.

**T10 — El minuto ya tiene un sitio marcado en el código, y no hay que ocuparlo.** `CEROACERO_SHAPE.liveMarker` contempla `\b\d{1,3}'`. Si algún día se decidiera capturar el minuto, el punto de entrada está identificado — pero es `SourceRow` y por tanto SPEC-008, `hecho`. Hoy: no.

---

## Resumen de invariantes y artefactos afectados

- **Invariantes tocados:** RN-06 (transiciones cerradas; `postponed`/`suspended` solo oficial o humano), RN-07 (silencio de 15 min vs. descanso de 15 min), RN-03 (*provisional* es el caso normal), RN-09 (los nombres los confirma una persona), RN-12/D-6 (un marcador sabe de dónde viene), D-2 (paridad de lenguas en todo literal).
- **Términos de `dominio.md`:** los cinco estados y sus literales; los cuatro cualificadores; *calendario declarado*; *jornada*; *ventana de partido*; *Preferente Futgal*; *Terceira RFEF grupo 1*.
- **Ninguna spec cerrada necesita enmienda por este dictamen.** Es su principal virtud: **no se añade el sexto estado y no se añade el minuto**, así que SPEC-001, SPEC-008 y SPEC-013 quedan intactas y no hay migración nueva.
- **`dominio.md` gana una entrada** (§1.b), que la escribe `sdd-arquitecto` antes de que SPEC-018 la use, como exige la cabecera del propio glosario.
- **ADR-026 §7 queda contestado** en sus dos mitades: `descanso` **no es un estado y no entra**; `suspended` **ya está en el modelo y lo que faltaba era decir cómo se presenta**, que es §1.c.
- **Deja constancia:** este dictamen debe archivarse como `docs/epicas/EPIC-002-.../dictamenes-SPEC-018.md`, siguiendo el precedente de `dictamenes-SPEC-015.md`. **No lo he escrito yo** (instrucción explícita de no crear ficheros); lo escribe quien conduzca la spec.

**Fuentes web consultadas el 2026-09-04**, orientativas y no autoritativas: minutonoventa.com (Preferente Futgal 2026/27 Grupo 1) · siguetuliga.com (Tercera Federación Grupo 1 Galicia, calendario) · lapreferente.com (HTTP 403, no leída). **La autoridad es futgal.es y no la he consultado.**

---

# Dictamen `sdd-lingua` — SPEC-018, el snapshot y la página del marcador

> Emitido el 2026-09-04 por el rol consultivo `sdd-lingua`, a petición de
> `sdd-arquitecto`. Se copia literal. No escribió ningún fichero.
>
> **Nota del arquitecto, y es importante para leerlo:** este dictamen se
> redactó **suponiendo que la pantalla sería pública**, que es como estaba
> planteado el encargo. Su §1.2 recomienda por eso la ruta `/`. El dictamen
> **bloqueante de `sdd-legal-datos` cambió esa premisa** —la pantalla no se
> publica en EPIC-002— y `sdd-lingua` **llegó por su cuenta al mismo hallazgo**
> en su §6.1, donde lista «que la pantalla no sea pública» como una de las tres
> salidas admisibles. Todo lo demás del dictamen —nombre, literales, norma,
> barreras— **vale igual**, porque no depende de quién pueda abrir la URL.

**Emitido:** 2026-09-04. **Rol:** consultivo. Dictamina y cita fuente; no implementa.

**Fuentes leídas:** `FOUNDATION.md` (D-1, D-2, D-8), `docs/fundacion/dominio.md`, `docs/fundacion/reglas.md` (RN-06, RN-07, RN-08, RN-11), `docs/epicas/EPIC-002-.../dictamenes-SPEC-015.md` (mi dictamen previo — único `dictamenes-*` del repositorio), ADR-003, ADR-008 §1, ADR-010 §5, ADR-012 §1, ADR-013, ADR-015, ADR-016 §3.2, ADR-025, ADR-026 §§1,2,4,7, `src/i18n/{gl,es,admin-bundle,statuses-bundle,titles-bundle,site-bundle}.ts`, `src/admin/view/`, `src/site/{routes,redirects}.ts`, `tests/site/{identity,i18n}.test.ts`, `docs/diseno/Componentes.dc.html`, EPIC-004 `_epica.md` (entrada 4), EPIC-MEJORA `_epica.md` (F-SPEC-007-10, F-SPEC-015-9).

> **Aviso previo, y es lo más importante de todo el dictamen.** Antes de discutir literales hay un problema de verdad, no de lengua: **dos specs cerradas publican hoy un texto que esta pantalla convierte en falso.** Está en el §6. Léelo antes que el resto.

---

## 0. Regla que atraviesa todo el dictamen

Todo lo que sigue obedece a una sola cosa ya decidida y ya cara: **un mismo concepto se dice siempre igual, en cualquier superficie.** Lo firmó Alberto Fojo el 2026-09-03 para `live` (`dominio.md`), descartando expresamente mi recomendación de admitir dos formas, y el precio de no haberlo hecho antes está inventariado en **F-SPEC-015-9** (siete ficheros con *Directo*). Esta spec es la que **paga esa factura** —su disparador escrito es «el día que se construya la interfaz del marcador»— y **no puede abrir una factura nueva**. Cada vez que abajo rechazo una palabra mejor por una peor ya registrada, la razón es ésta.

---

## 1. Nombre de la pantalla y ruta

### 1.1 El nombre — **dictamen vinculante: *o marcador***

| Candidata | Veredicto | Motivo |
|---|---|---|
| **marcador** | **Correcta. Es ésta.** | Ver abajo. |
| *resultados* | **Incorrecta** | Un *resultado* es el desenlace. Un 1-1 en el minuto 30 **no es un resultado**, es un marcador. La pantalla existe precisamente para lo que aún no ha terminado; llamarla *Resultados* nombra el 10 % de sus filas. |
| *xornada* | **Incorrecta** | `xornada` ya está registrada en `dominio.md` como **round de una competición** («En código: `round`. En docs y UI: *jornada*»). Usarla como nombre de pantalla es exactamente la trampa que rechacé para el comando `/estado` en SPEC-015 §2: dos sentidos para la misma palabra en la misma pantalla. Y además sería **falso** en cuanto se enseñen dos competiciones a la vez, que pueden ir por jornadas distintas. |

**Por qué *marcador* y no otra: no es una preferencia, es que ya está prometido por escrito y en código.** El bot le dice hoy al corresponsal `ackNotPublication`: *«Compárase co resto de fontes e, se procede, **sae no marcador**»* (`gl.ts`, SPEC-015, `hecho`). Si la pantalla se llamase *Resultados*, el bot estaría prometiendo un sitio que no existe con ese nombre. Y `dominio.md` titula su sección *«Cualificadores **del marcador**»*, `admin` rotula `boardScore: 'Marcador'`, y `gl.ts` escribe *«chegar ao marcador»*. **El término ya está en circulación en tres specs cerradas.**

Que coincida con la marca **no es un problema, es la razón de que la marca se llame así**. Un producto cuyo nombre es la palabra que designa lo que hace no tiene que elegir entre las dos.

### 1.2 La ruta — **`/` en galego, `/es` en castellano.** Recomendación fuerte, con la decisión ya escrita

**Esto no lo decide este rol —es ADR-010— pero ADR-010 ya lo contestó** y conviene que la spec lo lea en lugar de reabrirlo:

> ADR-010 §5: «`/` redirige hoy a `/proxecto` y **queda reservada para el producto**».
> ADR-010, *Negativas / follow-ups*: «**`/` deja de ser el sitio de proyecto el día que llegue el producto**, y hay que quitar la redirección. Este ADR es el registro de por qué `/proxecto` existe desde el primer día, **para que ese cambio sea una línea y no una discusión**».

Y el argumento que sí es mío, de lengua: **`marcador.gal/marcador` es una tautología.** El dominio ya gasta la palabra; repetirla en la ruta la gasta dos veces y no añade información. Se lee mal en voz alta, se lee peor en un log, y obliga a `/es/marcador`, que es lo mismo con una capa más. **La ruta correcta para una pantalla que se llama «o marcador» dentro de `marcador.gal` es la raíz.**

**Consecuencia que la spec tiene que declarar, no heredar en silencio:** tomar `/` obliga a retirar la regla `{ source: '/', destination: PROJECT_PATH.gl }` de `src/site/redirects.ts`, que es de **SPEC-004 CA-1**, `hecho` y verificada GREEN. Eso es **ADR-015**: el cuerpo de SPEC-004 no se edita nunca, se enmienda en su ledger bajo `## Enmienda — <fecha>`. ADR-010 lo previó («una línea»), así que no es un conflicto — pero sí es un acto que hay que escribir.

**Título del documento.** `TitlesBundle` (SPEC-006) exige que **toda página nueva declare el suyo o no tenga ninguno** («no hay herencia que la cubra»). Añadir una clave a ese contrato es su uso previsto, no una violación: el tipo existe para que olvidar una lengua sea un fallo de `typecheck`.

| Clave | Galego | Castellano |
|---|---|---|
| `titles.scoreboard` | `O marcador — marcador.gal` | `El marcador — marcador.gal` |

Sigue la convención ya servida (`O proxecto — marcador.gal`, `O rastrexador — marcador.gal`). **Recomendación secundaria:** si el gate prefiere que la portada no repita el dominio, la alternativa es `marcador.gal` a secas; es una decisión de producto, no de lengua, y las dos son correctas. Lo que **no** vale es un título que prometa producto o tiempo real (§6.3).

---

## 2. Cabeceras y etiquetas de la tabla

### 2.1 Tabla de literales — **dictamen vinculante salvo donde diga recomendación**

| Concepto | Clave propuesta | **Galego** | **Castellano** | Estatus |
|---|---|---|---|---|
| Competición | `colCompetition` | `Competición` | `Competición` | Vinculante — `dominio.md`, `Competition` |
| Jornada | `colRound` | `Xornada` | `Jornada` | **Vinculante** — `dominio.md` registra el término; `admin` ya lo sirve así |
| Hora del partido | `colTime` | `Hora` | `Hora` | Vinculante |
| Hora del partido (forma larga / accesible) | `colTimeLong` | `Hora de comezo` | `Hora de comienzo` | Recomendación |
| Equipo local | `colHome` | `Casa` | `Casa` | **Vinculante** — ver 2.2 |
| Equipo visitante | `colAway` | `Fóra` | `Fuera` | **Vinculante** — ver 2.2 |
| Marcador | `colScore` | `Marcador` | `Marcador` | Vinculante — ya en `gl.ts`/`es.ts` (`cardScoreLabel`, `boardScore`) |
| Estado | `colStatus` | `Estado` | `Estado` | Vinculante — ya en las dos lenguas |
| Cualificador | `colQualifier` | `Cualificador` | `Cualificador` | Vinculante **con reserva** — ver 2.4 |
| Hora del último dato | `colLastData` | `Último dato` | `Último dato` | Recomendación — ver 2.5 |

### 2.2 *Casa* / *Fóra*, no *local* / *visitante* — y esto es donde se paga la factura de F-SPEC-015-9

Hay **dos pares en circulación** y hay que elegir uno:

- **`src/i18n/` (código, texto visible, dos specs cerradas):** `helpOrder: 'Primeiro o equipo **da casa**'` (SPEC-015), `formHomeScore: 'Goles **da casa**'` / `formAwayScore: 'Goles **de fóra**'` (SPEC-017). Castellano: `'Goles de casa'` / `'Goles de fuera'`.
- **`docs/diseno/` (prosa, artefacto congelado):** *«O **local** aliñado á dereita, o **visitante** á esquerda»*.

**Gana el par que ya es texto visible: *Casa* / *Fóra*.** Registrar *local*/*visitante* como etiqueta crearía el segundo par exacto que *Directo*/*En xogo* creó, en la misma pantalla y el mismo día que esta spec viene a arreglar aquél. *Local* y *visitante* siguen siendo galego correcto y **siguen valiendo en prosa y en documentación**; lo que no pueden ser es una etiqueta visible.

**Trampa de norma inmediata:** **`fóra` lleva acento** (adverbio). `fora` sin acento es forma verbal (*se el fora*, *fora ela*). `gl.ts` ya lo escribe bien; es de las que se pierden en un copiar-pegar.

**Fila propuesta para `docs/fundacion/dominio.md`, antes de usarse** (regla dura del rol):

| Término | Definición | Literal galego | Literal castellano |
|---|---|---|---|
| equipo da casa / equipo de fóra | Los dos lados de un `Match`: `home_id` y `away_id`. Etiqueta visible en toda superficie. *Local* y *visitante* son sinónimos válidos **en prosa**, nunca como etiqueta. | **Casa** / **Fóra** | Casa / Fuera |

### 2.3 La columna que es dos cosas — hallazgo, no literal

`docs/diseno/Componentes.dc.html` fija: *«O centro leva a hora se aínda non empezou. `18:00` ocupa exactamente o sitio de `2-1`. **Nunca hai un oco**»*.

**Consecuencia de lengua:** si una sola columna sirve la hora y el marcador, **su cabecera no puede ser `Hora` la mitad del tiempo y `Marcador` la otra mitad**. Una cabecera que miente en la mitad de las filas es peor que no tenerla.

**Dictamen:** la cabecera de esa columna es **`Marcador`** y la hora es un *valor* dentro de ella, no una segunda cabecera. Si la spec quiere además la hora en columna propia (recomendable en escritorio, donde cabe), entonces son dos columnas de verdad, `Hora` y `Marcador`, y la de marcador enseña guiones —no ceros— antes de empezar, como ya dibuja el sistema (*«Hora onde iría o marcador; guións, non ceros»*).

### 2.4 `Cualificador` como cabecera: correcto, pero es jerga

*Cualificador* es el término del glosario y `admin` ya lo sirve (`boardQualifier`). **Para el operador es exacto. Para el público es jerga**: una persona viendo fútbol no sabe qué es un cualificador.

- **Dictamen vinculante:** si hay `<th>`, dice **`Cualificador`**. No se inventa otra palabra: *fiabilidade*, *confianza* o *garantía* no están en `dominio.md` y este rol no las autoriza sin registrarlas antes.
- **Recomendación:** en la vista densa/móvil **no haya cabecera de esa columna**. ADR-026 §2.1 ya obliga a que **la etiqueta viaje en cada fila, siempre, en los cuatro cualificadores**, así que la cabecera es redundante y su único efecto es enseñar una palabra que nadie necesita. Si la accesibilidad exige un `<th>`, que exista en el árbol y no en la pantalla.

### 2.5 *Último dato*, no *Última observación*

`admin` sirve `boardLastSeen: 'Última observación'`. **No sirve aquí**: *observación* es el nombre del modelo canónico y en SPEC-015 §4.3 ya dictaminé que el bot no debe decirlo por ser jerga. Mismo criterio, mismo motivo, público más amplio.

**`Último dato`** en las dos lenguas (idénticas, como *Provisional* y *Confirmado*: `dominio.md` ya dice que eso es correcto y no algo que arreglar).

### 2.6 Lo que ADR-013 §3 y §4 imponen a la lengua

Sin escudos, **el nombre del equipo es el único identificador de la fila**. De ahí, y ya está escrito en el sistema de diseño (*«Os nomes truncan con elipse. **Non se abrevian nin se traducen**: son os canónicos da RFGF»*) y en mi dictamen de SPEC-015 §§4.1 y 5i:

1. **No se traducen** en ninguna de las dos lenguas. «Celta B» es «Celta B» en `/es`.
2. **No se abrevian.** Si no cabe, se trunca con elipse tipográfica; truncar es una operación visual, abreviar es inventar un nombre.
3. **No se acentúan, ni se galeguizan, ni se «corrigen».** Vienen del calendario declarado (ADR-017) y del catálogo de alias (ADR-018), y ahí manda la RFGF.
4. **Truncar tiene un límite de dominio que no es mío:** si dos equipos de la misma jornada truncan a la misma cadena, la fila deja de identificar el partido. **Eso es de `sdd-competicion`**, y conviene que lo conteste.

---

## 3. El dato viejo y el silencio

### 3.1 La separación — **dictamen vinculante, y es lo que más fácil se rompe**

*Sen sinal* es un **cualificador registrado** (RN-07: partido `live` sin observación nueva en 15 min). «No se ha podido actualizar la página» es un **fallo del cliente**. Coinciden en que las dos cosas se dicen coloquialmente «no hay señal» —**es literalmente lo que dice un móvil sin cobertura**— y el usuario objetivo está de pie en una banda con mala cobertura. **Si no se separan por construcción, se confunden siempre.**

**Se separan por sujeto gramatical, y la regla se puede comprobar con un test:**

1. **El *sinal* es del partido.** *Sen sinal* / *Sin señal* aparece **únicamente** como cualificador de una fila, **únicamente** con el literal de `qualifiers`, y **nunca** como mensaje de página.
2. **La *actualización* es de la página.** El fallo de polling habla de **la página**, en impersonal o pasiva refleja —el registro que ya fijé en SPEC-015 §1 para los hechos del sistema—, y nombra el verbo *actualizar*.
3. **Barrera léxica, testable:** las palabras **`sinal` / `señal`** no pueden aparecer en **ninguna clave** del nuevo espacio de nombres; viven solo en `qualifiers`. Y simétricamente, **`actualizar` / `actualizado`** no pueden aparecer en `qualifiers`. Un caso que recorra los dos bundles y afirme las dos ausencias cuesta seis líneas y cierra la clase entera de error.
4. **Nunca comparten hueco visual.** El cualificador va dentro de la fila; el fallo de actualización es **un solo aviso de página**, y dice **la edad de lo que hay en pantalla** — que es lo único que le sirve al usuario.
5. **Prohibido diagnosticar de quién es la culpa.** Nada de *«Comproba a túa conexión»*, *«sen cobertura»*, *«sen conexión»*: el sistema no sabe si el fallo es del móvil, de la red o del servidor, y señalar al móvil del usuario es exactamente lo que lo empuja a confundirlo con *Sen sinal*.

### 3.2 Literales propuestos

| Concepto | Clave | **Galego** | **Castellano** |
|---|---|---|---|
| Recién actualizado (< 60 s) | `freshNow` | `Actualizado agora mesmo` | `Actualizado ahora mismo` |
| Actualizado hace N segundos | `freshSeconds` | `Actualizado hai {n} s` | `Actualizado hace {n} s` |
| Actualizado hace N minutos | `freshMinutes` | `Actualizado hai {n} min` | `Actualizado hace {n} min` |
| El dato tiene N minutos (denso) | `staleShort` | `Datos de hai {n} min` | `Datos de hace {n} min` |
| El dato tiene N minutos (frase) | `staleLong` | `Os datos teñen {n} min` | `Los datos tienen {n} min` |
| Aún no empezó | `notStarted` | `Aínda non comezou` | `Todavía no ha empezado` |
| Nada publicado todavía | `noScoreYet` | `Sen marcador publicado` | `Sin marcador publicado` |
| Cargando | `loading` | `Cargando…` | `Cargando…` |
| Fallo de polling | `refreshFailed` | `Non se puido actualizar. O que ves é de hai {n} min.` | `No se ha podido actualizar. Lo que ves es de hace {n} min.` |
| Reintento (**solo si existe de verdad**) | `refreshRetrying` | `Séguese tentando.` | `Se sigue intentando.` |
| Salida manual | `reloadHint` | `Carga a páxina de novo.` | `Carga la página de nuevo.` |
| Leyenda del auto-refresco | `autoRefresh` | `Esta páxina actualízase soa cada {n} segundos.` | `Esta página se actualiza sola cada {n} segundos.` |

**`{n}` en `autoRefresh` es 30**, si la spec sigue a ADR-003 («fallback a polling del snapshot cada 30 s con ETag»). El número va interpolado, no escrito: cambiarlo no puede obligar a tocar dos bundles.

### 3.3 Notas de norma sobre esos literales (todas son errores probables)

- **`hai`, nunca `fai`.** La expresión temporal galega es *hai dous minutos*, no *fai dous minutos*. Es **el castellanismo más probable de todo este vocabulario**, porque el castellano usa *hace* y el calco fonético produce *fai*.
- **`puido`, no `pudo`.** Pretérito galego de *poder*: *puiden, puideches, **puido***. (RAG.)
- **`actualizar`, no `atualizar`.** *Atualizar* sin `c` es portugués. Lusismo probable y silencioso.
- **`actualízase`, no `se actualiza`.** Enclisis por defecto en oración afirmativa principal; proclisis solo tras negación, interrogativo y ciertos adverbios/conjunciones (mi dictamen SPEC-015 §5b). Correcto: *«Esta páxina **actualízase** soa»*, *«**Non se** puido actualizar»* — nótese que el segundo es proclítico **por la negación**, y está bien así.
- **`soa`, no `sola`.** Femenino de *só*, concuerda con *páxina*.
- **`Cargando…` es correcto y NO hay que «corregirlo»** a *«Estase a cargar»*. La regla `estar a + infinitivo` que di en SPEC-015 §5c ataca la **perífrasis** `estar + xerundio` (*«Estou lendo»*), no el gerundio suelto usado como rótulo. Lo digo explícitamente porque es exactamente la sobrecorrección que produce mi propio dictamen anterior mal leído.
- **`comezar`, no `empezar` ni `comenzar`.** *Comenzar* no existe en galego; *empezar* sí existe pero el proyecto ya eligió *comezar* (`cmdStart: 'Comezar'`).
- **`aínda`** con acento y tres sílabas. Ya está bien escrito cuatro veces en `gl.ts`.
- **`refrescar` no.** Para una interfaz, el verbo es **actualizar**. *Refrescar* en galego es de temperatura y de memoria.
- **⚠ `volve` está en una lista negra activa.** `tests/site/i18n.test.ts` caso 5 prohíbe **`volve`** en el bundle del sitio (término de sucesión, D-1: *«volve», «regresa»*). Hoy no muerde porque solo recorre `siteBundle`, pero **la recomendación de §5.4 es extender esa lista negra al nuevo espacio de nombres** — y entonces `Volve cargar a páxina` se pondría **RED**. Por eso el literal propuesto arriba es **`Carga a páxina de novo`** y no *«Volve cargar»*, que es lo que `admin` usa. **No es un capricho: es evitar un rojo previsible.**

### 3.4 Tres silencios distintos que la petición mezcla en uno

«Sen datos» no es un estado, son **tres**, y darles un solo literal los vuelve indistinguibles:

| Situación | Qué se enseña |
|---|---|
| **(a) El partido aún no empezó** | **La hora en el hueco del marcador** (sistema de diseño: *«Nunca hai un oco»*). No hace falta ningún literal en pantalla; `notStarted` existe solo para lectores de pantalla. |
| **(b) Hay partido pero ninguna `Decision`** | **`Sen marcador publicado`**. Es el `Sen decisión publicada` de `admin` sin la jerga de *Decision*. |
| **(c) La página aún no tiene nada** | **`Cargando…`** |

**Prohibido: «Sen datos».** En SPEC-015 §4.1 ya prohibí improvisar sinónimos de los cualificadores («nunca *sen datos*, *sen resposta*, *á espera*»). Aquí el motivo se refuerza: *Sen datos* comparte molde con *Sen sinal* (`Sen` + sustantivo, misma posición, misma tipografía) y es la forma más rápida de reintroducir la confusión que el §3.1 acaba de cerrar.

---

## 4. Cómo se dice el cualificador junto al marcador

### 4.1 **Etiqueta larga, el literal registrado, sin abreviar. Dictamen vinculante.**

| Cualificador | Galego | Castellano | Long. gl |
|---|---|---|---|
| `provisional` | **Provisional** | Provisional | 11 |
| `confirmado` | **Confirmado** | Confirmado | 10 |
| `pendente_de_confirmar` | **Pendente de confirmar** | Pendiente de confirmar | 21 |
| `sen_sinal` | **Sen sinal** | Sin señal | 9 |

**Tres motivos, y el primero ya es jurisprudencia del proyecto:**

1. **ADR-026 §4.3 ya mató una abreviatura con este argumento exacto.** `FIN`, `APR` y `DESC` cayeron porque «**las tres abreviaturas no están en el glosario. Gana `dominio.md`**». Una abreviatura de un cualificador es una **quinta forma** no registrada, y la cabecera del glosario exige registrar antes de usar. No hay diferencia de principio entre `FIN` y `P. CONF.`
2. **Abreviar reintroduce el defecto que ADR-026 §4.2 acaba de corregir.** El motivo por el que `?` y `!` cayeron no fue que fueran glifos: fue que **no son autoexplicativos y no son traducibles**. `P. CONF.` no es autoexplicativo. Cambiar un signo ilegible por unas letras ilegibles es el mismo defecto en alfabeto latino.
3. **La aritmética favorece la forma larga.** Las dos etiquetas cortas (*Provisional*, *Confirmado*, 10–11 caracteres) son las que salen **en casi todas las filas**; la larga (*Pendente de confirmar*) es una **condición rara** (RN-06 por timeout). Se está optimizando el caso frecuente y pagando en el infrecuente, que es justo el reparto correcto — y es el mismo razonamiento con el que ADR-026 §2 invirtió el énfasis.

**Si el espacio falla, la salida NO es abreviar.** Es maquetación: segunda línea, la etiqueta bajo el marcador, o la fila crece. Y **`Pendente de confirmar` puede partirse en dos líneas pero nunca elidirse con «…»**: una elipsis sobre un cualificador es ADR-026 §4.2 por otra puerta.

### 4.2 La advertencia sobre *Rematado* sí muerde aquí, y hay que contestarla

`dominio.md`: *«**rematar** tiene dos sentidos en fútbol —terminar y disparar a puerta—, así que el estado se muestra **siempre con su etiqueta** («Estado: Rematado») y **nunca como frase suelta**»*.

Una fila que se lea `SD Compostela 2 - 0 Ourense CF · Rematado` **es una frase suelta**: nada dice que *Rematado* sea el valor de *Estado*.

**Dictamen vinculante — dos formas admisibles y ninguna más:**

- **(a) Con cabecera de columna.** Si hay una `<th>Estado</th>`, **la cabecera es la etiqueta** y la celda lleva el literal a secas. Cumple.
- **(b) Sin columna (móvil, tarjeta).** El literal viaja con su rótulo inline: **`Estado: Rematado`** / *`Estado: Finalizado`*. Es lo que ya hace la tarjeta del bot (`cardStatusLabel: 'Estado'`) y lo que hace `admin`.

Nunca la palabra sola flotando junto a un marcador.

### 4.3 Y un riesgo nuevo que nace de juntar los dos

Estado y cualificador van a acabar **adyacentes** en la misma fila, y los dos son participios: **`Rematado Confirmado`**, **`Aprazado Provisional`**. Se leen como un sintagma, no como dos campos.

**Recomendación:** o los dos llevan su rótulo (`Estado: Rematado · Marcador: Confirmado`), o van en columnas distintas con cabecera propia, o los separa algo que se lee. **Lo que no puede pasar es que queden pegados sin nada entre ellos.** Es el mismo defecto que 4.2 detecta en singular, agravado por la contigüidad.

---

## 5. F-SPEC-007-10 — la primera persona del singular

### 5.1 Qué hay que evitar

**Galego:** pronombres y posesivos `eu`, `min`, `comigo`, `meu`, `miña`, `meus`, `miñas`. Formas verbales de 1.ª persona del singular: `estou`, `teño`, `fago`, `vou`, `podo`, `quero`, `sei`, `vexo`, `digo`, `creo`, `penso`, `escribo`, `respondo`, `recollo`, `gardo`, `mido`, `atopo`, `entendo`, `entendín`, `fun`, `tiven`, `puiden`, `souben`.

**Castellano:** `yo`, `mí`, `conmigo`, `mío`, `mía`, `míos`, `mías`; `soy`, `estoy`, `tengo`, `hago`, `voy`, `puedo`, `quiero`, `sé`, `veo`, `digo`, `creo`, `pienso`, `escribo`, `respondo`, `recojo`, `guardo`, `mido`, `encuentro`, `entiendo`, `entendí`, `fui`, `tuve`, `pude`, `supe`.

**La voz correcta de la página es la que ya está publicada y auditada:** impersonal / pasiva refleja para los hechos del sistema (*«actualízase»*, *«non se puido»*, *«non se rastrexa»*) y **plural institucional** cuando el proyecto habla (*«respondemos»*, *«non republicamos»*). Las dos ya están en `site` y en `crawler` y las dos cumplen ADR-012 §1.

### 5.2 ⚠ El alcance de la barrera NO puede ser el repositorio

**El bot habla en primera persona del singular por dictamen escrito y firmado** (SPEC-015, mi §1: *«1.ª persoa do singular para los actos de comprensión del propio bot»*), y su bundle lo hace ocho veces: *«**Son** o bot de marcador.gal»*, *«**Recollo** os resultados»*, *«Non **entendín** a mensaxe»*, *«Non te **recoñezo**»*, *«Non **atopo** ese partido»*, *«Non **podo** gardalo»*, *«**Sérveme** para…»*, *«Non **acepto** máis mensaxes túas»*.

**Una barrera repo-wide pondría RED a `BotBundle`, que es correcto.** Y no hay contradicción con ADR-012 §1 —que sí nombra al bot— porque lo que ADR-012 §1 prohíbe es **nombrar a una persona física o declarar cuántas hay**; el bot habla en 1.ª persona **declarándose máquina** («Son o bot»), y eso no implica ninguna persona. F-SPEC-007-10 es la mitad estrecha: **la voz de la página**.

### 5.3 La barrera concreta que la spec debe exigir — **recomendación, redactada para copiar**

> **CA-N — la página no habla en primera persona del singular (ADR-012 §1, F-SPEC-007-10).**
> Un caso recorre **todos los valores de cadena de los espacios de nombres `site`, `titles` y el nuevo espacio del marcador, en `gl` y en `es`**, sobre el texto **desacentuado y en minúsculas**, y afirma que **ninguno contiene ninguna forma de una lista cerrada de primera persona del singular**, declarada en el propio test con su motivo escrito (la forma de `ALLOWED_PACKAGES`, ADR-016 §3.2). La comparación es **por palabra completa**.
> **Alcance declarado dentro del propio CA (ADR-016 §3):** la barrera **no** alcanza `bot`, y no por descuido — el bot habla en 1.ª persona del singular por dictamen de `sdd-lingua` registrado en SPEC-015 §1, y meterlo aquí lo pondría en rojo siendo correcto.
> **Lo que el mecanismo no alcanza, declarado también (ADR-016 §3):** quedan **fuera de la lista cerrada** las formas ambiguas `son` (gl: también 3.ª del plural — *«os datos son»*), `vin`/`vi`, `mi`, `sé`/`sei` (gl: también sustantivo), porque incluirlas produciría falsos positivos sobre texto correcto. Se cubren por revisión, no por test, y esta línea es la constancia de ello.
> **Control positivo:** una cadena de prueba que contiene una de las formas pone el caso en **rojo**.

El molde exacto ya existe y no hay que inventarlo: `tests/site/identity.test.ts` (lista `NO_PERSON` / `NO_HEADCOUNT`, `deaccent`, recorrido de espacios de nombres). **Y el precedente de dónde ponerlo también:** SPEC-007 escribió un **fichero nuevo a propósito** en lugar de ensanchar los casos de SPEC-004, que estaban cerrados. Haz lo mismo.

### 5.4 Y una barrera que ya existe y hay que ensanchar — **D-1**

`tests/site/i18n.test.ts` caso 5 prohíbe once términos de sucesión (`marcadorgalego`, `relevo`, `sucesor`, `continuacion`, `herdeiro`, `volve`, `regresa`…) **pero solo recorre `siteBundle`**.

**Esta pantalla es la primera que se va a parecer de verdad a marcadorgalego.gal**, así que es la primera en la que un literal de sucesión es tentador. **Recomendación fuerte: el nuevo espacio de nombres entra en esa lista negra**, en un fichero nuevo (no tocando el de SPEC-004). Y con ello, la trampa de `volve` que ya avisé en §3.3.

---

## 6. La advertencia de degradación en pantalla

### 6.1 Antes del literal: **dos specs cerradas quedan desmentidas, y una de ellas es la que respalda la carta a la RFGF**

Hoy, servido y verificado GREEN:

- **`/robot`, `crawler.noRepublish`:** *«**Non republicamos os datos de ninguén**. Isto é unha medición, e o resultado é un informe interno. **Non hai marcador público**, nin ficheiro de datos, nin nada que se poida consultar fóra do proxecto.»*
- **`/proxecto`, `site.noProduct`:** *«Hoxe non hai nada que usar: **nin marcador público**, nin aplicación, nin conta que crear.»*

**SPEC-018 publica un marcador público.** El día que se despliegue, esas dos frases son falsas — y `/robot` **es la página que un tercero audita**, la que viaja dentro del `User-Agent` de cada petición (ADR-011), la que sostiene RN-11 y la que respalda la carta a la RFGF (ADR-012 §3: sin nombre, el buzón y esa página son lo único que hay). Publicar un marcador mientras `/robot` jura que no existe ninguno no es un problema de traducción: **es exactamente la credibilidad que el proyecto está gastando con el interlocutor al que corteja.**

**Dictamen vinculante:** SPEC-018 **no puede cerrarse sin resolver esto**, y no como follow-up. Tres salidas, y la spec tiene que elegir una por escrito:

1. **Reescribir las dos frases**, vía **ADR-015**: el cuerpo de SPEC-004 y SPEC-005 no se edita nunca; se enmienda en su ledger bajo `## Enmienda — 2026-09-04: SPEC-018 publica un marcador y estas dos frases dejan de ser ciertas`. Es la salida limpia.
2. **Que la pantalla no sea pública** (tras la sesión del operador, ADR-024). Las frases siguen siendo ciertas y no se toca nada. Cambia el alcance de la spec.
3. **Que la pantalla no sirva datos de terceros**, solo lo que declaran las personas. Improbable y estrecha la spec a nada.

**Escalada obligada, y no es de este rol:** publicar hacia fuera datos derivados de `ceroacero.es` es la pregunta que **ADR-008 §5** cerró con *«en el spike es medición, no producción»*. Una página pública se parece bastante más a producción. **Consúltese a `sdd-legal-datos` antes de aprobar la spec** (derecho *sui generis*, ToS, ADR-009 §6, que ya exige un ADR de producción el día que el mecanismo deje de ser medición).

### 6.2 El literal — **propuesta**

Cumple: sin 1.ª persona del singular (§5), sin prometer producto (D-1, coherente con `site.purpose`: *«El resultado es un informe interno, no un producto»*), y **declara qué degrada la cifra**, que es lo que la épica obliga.

| Clave | **Galego** | **Castellano** |
|---|---|---|
| `noticeWhat` | `Isto é unha medición, non un produto.` | `Esto es una medición, no un producto.` |
| `noticeWhy` | `Hai unha soa fonte automática, así que o normal é que o marcador sexa provisional e que chegue con atraso.` | `Hay una sola fuente automática, así que lo normal es que el marcador sea provisional y que llegue con retraso.` |

**Dos claves y no una**, siguiendo la costumbre de `SiteBundle` —una clave por afirmación— para que un test pueda afirmar cada mitad por separado.

**Variante densa** (banner de una línea, si la maquetación lo pide):

| `noticeShort` | `Medición, non produto. Unha soa fonte: o marcador vai provisional e pode chegar tarde.` | `Medición, no producto. Una sola fuente: el marcador va provisional y puede llegar tarde.` |

**Comprobaciones de norma sobre este literal:** `atraso` — RAG; ***retraso* es castellanismo**, y es la palabra que va a salir sola. `soa` femenino concuerda con *fonte*. `sexa` presente de subxuntivo de *ser*, correcto. `así que` tiene precedente en `gl.ts` (`boardEmpty`). Ninguna forma de la lista de §5.1. Ningún término de la lista negra D-1.

### 6.3 Lo que la pantalla **no** puede decir — dictamen vinculante

**Prohibidas, en las dos lenguas y en cualquier clave: `en directo`, `directo`, `en vivo`, `en tempo real` / `en tiempo real`, `ao instante` / `al instante`, `inmediato`.**

Dos motivos independientes, y cada uno basta:

1. **`Directo` ya está prohibido como sinónimo de `En xogo`.** `dominio.md`, firmado por Alberto Fojo el 2026-09-03; ADR-026 §4.4 lo cierra *«sobre el producto: `live` es En xogo, en una sola forma, en cualquier superficie, **incluida la etiqueta de un filtro**»*; y **F-SPEC-015-9 tiene como disparador escrito exactamente esta spec**. Si esta pantalla escribe *Directo*, la deuda no se paga: se duplica.
2. **Es una promesa que el sistema no puede cumplir.** RN-11 limita a 1 petición/minuto por competición y ADR-003 fija polling a 30 s. Entre que un gol ocurre y que se ve pueden pasar minutos, más el retardo de la propia fuente. Un literal que promete lo que el sistema no hace es un fallo de producto, no de traducción — es la misma regla con la que en SPEC-015 §3.6 impedí que `errServiceDown` prometiera que el mensaje no se había perdido.

Un tercer caso, más discreto: **el título de la pestaña tampoco puede prometerlo** (§1.2).

---

## 7. Trampas de norma que vienen en este vocabulario

Las de SPEC-015 §5 siguen vigentes enteras y **no las repito**: género de `mensaxe`/`sinal`/`orde`/`xanela`, colocación del pronombre átono, `gol` no *golo*, `aprazar` no *adiar*, `equipo` no *equipa*, `atopar`, `ata` no *até*, `-ble` no *-bel*, `coma`/`como`, segunda forma del artículo, `ao` no `ó`, `máis`, `só`. **Léelas: son la mitad del riesgo de esta spec también.**

**Nuevas, propias de este vocabulario:**

| Escribe | No escribas | Por qué |
|---|---|---|
| **hai** *(dous minutos)* | *fai* | El más probable de todos. La expresión temporal galega es *hai*; *fai* es calco de *hace*. Sale en **cinco** de los literales de §3.2. |
| **atraso** | *retraso* | *Retraso* es castellanismo. RAG: *atraso*, *demora*, *retardo*. Sale en el literal de §6.2. |
| **puido** | *pudo*, *pôde* | Pretérito galego de *poder*. |
| **actualizar** | *atualizar* | *Atualizar* sin `c` es portugués. Lusismo silencioso: se lee bien y está mal. |
| **fóra** (adverbio) | *fora* | Sin acento es forma verbal. Sale en la cabecera de columna. |
| **actualízase soa** | *se actualiza sola* | Enclisis + concordancia. *Sola* es castellanismo. |
| **comezo / comezar** | *comenzo*, *inicio* | *Comenzo* no existe; el proyecto ya eligió *comezar*. |
| **Cargando…** | *Estase a cargar* | Sobrecorrección a partir de mi propia regla de SPEC-015 §5c mal leída. El gerundio suelto como rótulo es correcto. |
| **cargar de novo** | *volve cargar* | Correcto en galego, pero **`volve` está en la lista negra D-1** y esta spec propone ensancharla (§5.4). Evita el rojo. |
| **actualizar** (interfaz) | *refrescar* | *Refrescar* en galego es temperatura y memoria. |
| **pantalla** | *ecrã*, *ecrán* | Lusismos. |
| **marcador** (en juego) | *resultado* | Un *resultado* es el desenlace; un 1-1 al minuto 30 es un *marcador*. Mantenlos separados o el §1 se deshace solo. |
| **xornada** (gl) / **jornada** (es) | *xornada* en `es.ts` | Copia-pega. `admin` ya lo hace bien; el riesgo es real. |
| **Sen sinal** — *o* sinal | *a sinal* | `sinal` es **masculino** en galego (SPEC-015 §5a). |
| **segundos** | — | Ojo al contexto: *segundo* en galego significa también *según* (*«segundo a fonte»*). No mezcles las dos en la misma línea. |

**Y una que no es de norma sino de coherencia, y es la que más caro sale:** cada vez que dudes entre una palabra mejor y la que ya está en `src/i18n/` o en `dominio.md`, **gana la que ya está**. El proyecto ya pagó esa lección una vez y la factura tiene número: F-SPEC-015-9.

---

## 8. Lo que este rol NO decide, y a quién le toca

- **`descanso` y `suspended`** — es de `sdd-arquitecto` y `sdd-competicion` (ADR-026 §7, disparador: esta spec). **La mitad de lengua ya está resuelta por si la necesitan:** si `descanso` entra como sexto estado, su literal es **`Descanso`** en las dos lenguas (así lo escribe ya la prosa del sistema de diseño) y **su identificador iría en inglés** (`half_time`), como los otros cinco y a diferencia de los cualificadores; **`DESC` está prohibido** (ADR-026 §4.3). `suspended` ya tiene sus dos literales registrados: **Suspendido** / Suspendido.
- **El minuto de juego** — de dominio y de modelo, no mío. Si entra, el rótulo es **`Minuto`** en las dos lenguas y ya existe en `BotBundle` (`cardMinuteLabel`).
- **Si la pantalla puede publicarse** (§6.1) — `sdd-legal-datos` y el gate humano.
- **Cuándo `/` deja de redirigir a `/proxecto`** — ADR-010 lo autoriza; el momento lo firma una persona.

---

## 9. Invariantes afectados y artefactos a revisar antes de aprobar

**Invariantes:** D-1 (§5.4, §6), D-2 (todo), D-8 (registro y densidad), RN-07 (§3.1), RN-08 (§3.4b: la pantalla no es una puerta de publicación), RN-11 (§6.3), ADR-003 (los 30 s), ADR-008 §1 (el motivo del §6.2), ADR-010 §5 (§1.2), ADR-012 §1 (§5), ADR-013 §§2,3,4 (§2.6, §4), ADR-015 (§1.2 y §6.1 son dos enmiendas), ADR-016 §3 (la forma del CA de §5.3), ADR-026 §§2,4.2,4.3,4.4 (§4).

**Artefactos a revisar:**

| Artefacto | Qué | Vía |
|---|---|---|
| `src/i18n/gl.ts` · `es.ts` — `crawler.noRepublish` | Dice que no hay marcador público | **Enmienda ADR-015 sobre SPEC-005** |
| `src/i18n/gl.ts` · `es.ts` — `site.noProduct` | Idem | **Enmienda ADR-015 sobre SPEC-004** |
| `src/site/redirects.ts` | `/` → `/proxecto` se retira si la pantalla toma la raíz | **Enmienda ADR-015 sobre SPEC-004 CA-1** |
| `docs/fundacion/dominio.md` | **Fila nueva `Casa`/`Fóra`, antes de usarse** (§2.2). Y la de `descanso` si entra | Edición del glosario |
| `src/i18n/titles-bundle.ts` | Clave nueva `scoreboard`. Uso previsto del contrato, no violación | Adición |
| `tests/site/i18n.test.ts` caso 5 | La lista negra D-1 no alcanza el nuevo espacio de nombres | **Fichero nuevo**, precedente de `identity.test.ts` |
| `docs/diseno/` | *Directo* en siete ficheros — **F-SPEC-015-9 dispara con esta spec** | EPIC-004, descongelado |
| `docs/epicas/EPIC-004/_epica.md` entrada 4 | «Faltan estados de carga y de dato viejo», *a punto de dispararse*, disparador = esta spec | La contesta el §3 |
| `docs/epicas/EPIC-MEJORA/_epica.md` F-SPEC-007-10 | Su disparador es esta spec | Lo contesta el §5.3 |

**Y la regla dura del rol, para el arquitecto:** este dictamen **tiene que quedar por escrito en la spec o en su ledger**. El precedente es `dictamenes-SPEC-015.md`, en el mismo directorio.
