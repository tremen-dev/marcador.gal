# Dictámenes de dominio para SPEC-018 — el snapshot y la página mínima del marcador

> ## ⚠ NOTA DE CABECERA — 2026-09-04, tarde: el gate ejerció la salida (B) del dictamen bloqueante
>
> **Rectificación de esta misma nota, hecha el mismo día y a instancia del rol.**
> La primera redacción decía que una decisión de producto **superó** al dictamen.
> `sdd-legal-datos`, al reconsultársele, corrigió esa lectura y su corrección es
> la que vale: **ningún dictamen suyo ha sido revocado.** Su V1 no prohibía
> publicar: prohibía publicar **mientras `noRepublish` y `noProduct` dijeran lo
> que dicen**, y enumeraba **dos** salidas lícitas. El gate eligió **(B)**, que es
> una de las dos, y **(B) venía con su condicionado escrito**. Ese condicionado
> —corregir los literales en el mismo cambio por ADR-015, avisar a la RFGF, y no
> antes del 2026-09-08— **es ahora la parte operativa del dictamen, no la
> desplazada**. Y su prohibición sigue viva en su forma condicional: **publicar
> sin corregir los literales sigue prohibido**.
>
> **Lo que sigue NO se ha borrado, ni corregido, ni suavizado, y no se va a
> hacer.** Se anota encima, que es lo que corresponde: un dictamen consultivo se
> supera con una decisión firmada, no reescribiéndolo.
>
> El dictamen de **`sdd-legal-datos` del 2026-09-04 (mañana)** era **bloqueante**:
> en su §0 y en sus V1 y V2 condicionaba la publicación a que `/robot` y
> `/proxecto` dejen de afirmar que «non hai marcador público» —las dos sujetas por
> test— y a la carta a la RFGF, enviada el 2026-09-01 y viva hasta el 2026-09-08.
> `sdd-lingua` llegó al mismo hallazgo por su cuenta en su §6.1. La primera
> redacción de SPEC-018 tomó por eso **la salida (A)**: construir la pantalla y
> servirla tras la sesión declarada del operador.
>
> **En el gate del 2026-09-04, Alberto Fojo eligió la salida (B): el marcador se
> publica.** Tomó la decisión **con este dictamen delante**, y con las tres cosas
> que señala explícitamente sobre la mesa. Es una decisión de producto, es suya, y
> **no se relitiga en la spec**.
>
> **Qué cambia y qué no:**
>
> - **(B) no es una vía de escape: es una de las dos salidas que este dictamen
>   abrió**, y venía con condicionado. Exige corregir `noRepublish` y `noProduct`
>   **en el mismo cambio** y por el procedimiento de **ADR-015**, avisar a la
>   RFGF, y **no desplegar antes del 2026-09-08**. Las tres son ahora obligaciones
>   de la spec (CA-18, CA-19).
> - **Lo que el dictamen cierra expresamente sigue cerrado**, y la decisión de
>   producto no lo abre: **no vale matizar la frase publicada para que siga pasando
>   el test**. Se corrige de verdad o no se publica.
> - **Sus condiciones sustantivas siguen vigentes enteras** —la apertura acotada a
>   las jornadas de medición declaradas, la proyección cerrada, la traza de RN-12
>   que no se enseña, el polling que nunca pide a un tercero, nada personal, sin
>   escudos y sin monetización—. Lo que la decisión de producto movió es **quién
>   puede abrir la URL**, no qué contiene ni cómo se obtiene. Y con público
>   delante, varias de ellas **valen más, no menos**.
>
> **Se reconsultó al mismo rol esa misma tarde**, y no para repreguntar si se
> publica —eso ya estaba decidido— sino **bajo qué condiciones se publica bien**.
> Ese segundo dictamen está **al final de este fichero**, con su fecha, y es el que
> manda donde los dos hablen de lo mismo: **mantiene V2..V8 y V10 intactos,
> modifica su propio V9** (`nofollow` fuera, `noarchive` dentro), **rectifica su
> propia tabla del §4** (`decided_at` → `last_observed_at`) y **añade cinco
> condiciones que sólo existen cuando el destinatario es cualquiera**. Los dos
> conviven a propósito: el rastro de que se avisó es parte del expediente.
>
> **Una precisión suya sobre este mismo expediente**, hecha suponiendo que ADR-027
> ya estaba aprobado: pedía un ADR nuevo que supersediera parcialmente su §3.a.
> **No hace falta: ADR-027 estaba en `borrador` y se ha reescrito entero**, así que
> lo que su W3 exige —un ADR de publicación con firma del gate, con las dieciocho
> condiciones y el disparador de ocho puntos— **es ADR-027 mismo**, no uno
> posterior.
>
> — Anotado por `sdd-arquitecto` el 2026-09-04. **Decisión de producto: Alberto
> Fojo, 2026-09-04.**

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
> **Nota del arquitecto, actualizada tras el gate del 2026-09-04:** este dictamen
> se redactó **suponiendo que la pantalla sería pública**, y **acertó**: el gate
> eligió la salida (B). Su §6.1 —que llegó por su cuenta al mismo hallazgo que el
> dictamen bloqueante y listó las tres salidas admisibles— queda **contestado por
> la primera de las tres que él mismo enumera**: se reescriben las dos frases por
> el procedimiento de ADR-015.
>
> **Lo único de este dictamen que el gate NO siguió es su §1.2, la ruta `/`.**
> **Alberto Fojo decidió el 2026-09-04 que la pantalla vive en `/marcador` y
> `/es/marcador`**, descartando explícitamente tanto tomar la raíz ahora como
> dejar escrito un disparador para mudarse a ella en el go/no-go. **ADR-010 §5
> queda intacto y `/` sigue reservada.** El argumento de lengua de `sdd-lingua` —la
> tautología `marcador.gal/marcador`— **no se declara equivocado**: se declara
> superado por una decisión de producto sobre qué es hoy este dominio. Y su §1.1
> —que la pantalla se llama **el marcador** y no *resultados* ni *xornada*— **sí se
> siguió entera**, incluido el nombre de la ruta.
>
> Todo lo demás —literales, norma, barreras, la separación de los tres silencios,
> la etiqueta larga del cualificador— **vale igual y se absorbió**, porque no
> dependía de quién pueda abrir la URL.

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

---

# Dictamen `sdd-legal-datos` (SEGUNDO) — SPEC-018 bajo la salida (B): bajo qué condiciones se publica bien

> Emitido el **2026-09-04**, por la tarde, a petición de `sdd-arquitecto`, **tras
> la decisión de producto de Alberto Fojo por la salida (B)**. No se le preguntó
> si se publica —eso estaba decidido— sino **bajo qué condiciones se publica
> bien**. Se copia literal. No escribió ningún fichero.
>
> **Nota del arquitecto:** su **W3** pide un ADR que supersediera parcialmente
> ADR-027 §3.a. Lo escribió suponiendo que ADR-027 estaba aprobado; **estaba en
> `borrador` y se ha reescrito entero**, así que el ADR que W3 exige **es
> ADR-027**. Y su **R1** —que el refresco devuelva fragmento HTML en vez de
> JSON— **no se ha tomado**; el motivo está en ADR-027 §11 y en las notas para el
> gate de SPEC-018, con los cuatro mínimos vinculantes de su C6 cumplidos.

**No soy abogado y esto no es asesoramiento profesional.**

**Comprobaciones hechas hoy (2026-09-04), porque un dictamen legal sin fecha no vale:**

| Recurso | Resultado |
|---|---|
| `https://www.ceroacero.es/robots.txt` | **Sigue permitiendo.** `User-agent: *`, única prohibición `Disallow: /zzmap_v3.php`, 13 sitemaps. **Ninguna directiva TDM, `ai`, ni reserva de derechos.** Idéntico a ADR-008 §3 (2026-08-31) y a mi comprobación de esta mañana |
| `https://www.ceroacero.es/.well-known/tdmrep.json` | **HTTP 403**, no 404. El canal estándar del *TDM Reservation Protocol* **no es observable** en ese host: un 403 no es prueba de ausencia de reserva. Dato nuevo, y cambia la condición 13 |
| Art. 10 LSSI (Ley 34/2002) y Anexo a) | Sin reforma aplicable. Alcanza a servicios **no remunerados por el destinatario** «en la medida en que constituyan una actividad económica para el prestador». Régimen sancionador: arts. 38-40; incumplir el art. 10 es infracción **leve**, hasta **30.000 €** (art. 39) |
| `DEFAULT_SOURCES` (`src/ingest/sources.ts:132`) | **Una sola entrada**: `CEROACERO_ENTRY`. Relevante para el §5.b |

---

## §0. Qué queda en pie de mi dictamen anterior, y qué no. La nota que va encima del fichero

**Ningún dictamen mío ha sido revocado, y la nota debería decirlo así, porque es lo exacto.**

Mi V1 no prohibía publicar: prohibía publicar **mientras `noRepublish` y `noProduct` dijeran lo que dicen**, y enumeraba **dos** salidas lícitas, (A) y (B). El gate ha elegido **(B)**, que es una de las dos que el propio dictamen abrió, y (B) venía ya con su condicionado escrito: *«se corrigen en el mismo cambio, no después — con el procedimiento de ADR-015 — y se avisa a la RFGF antes de que lo vean solos. Y no antes del 2026-09-08.»* Ese condicionado **pasa a ser la parte operativa**, no la desplazada.

- **V1**: no superado; **ejercida su salida (B)**. Su prohibición sigue viva en su forma condicional: publicar **sin** corregir los literales sigue prohibido.
- **V2** (no antes del 2026-09-08): **intacto**, ver §7.
- **V3, V4, V5, V6, V7, V8, V10**: **intactos y sin un solo cambio**.
- **V9** (`noindex, nofollow`): **modificado por mí, no por el gate** — ver §3. `noindex` se mantiene; `nofollow` se retira y se sustituye por `noarchive`.
- **R1** (recomendar (A)): **consumida**. Era una recomendación, el gate la ha oído y ha decidido lo contrario con el dictamen delante. No se relitiga y no la vuelvo a mencionar.
- **R2** (no citar la fuente): **se mantiene, con un añadido obligatorio** — ver §6.
- Mi §4 asignaba `decided_at` al «instante del último dato». **Lo rectifico yo mismo a `last_observed_at`** — ver §5.a. Era una fila escrita para una audiencia de operador; SPEC-018 y `sdd-competicion` encontraron la respuesta mejor.

**Consecuencia procedimental para `sdd-arquitecto`:** ADR-027 está aprobado e inmutable, y su **§3.a** (la puerta es la sesión declarada) y su **§3 punto 4** (`/` en vez de `/marcador`) quedan **superados parcialmente**. Eso exige **ADR nuevo que lo diga**, no una edición. Ese ADR es el que mi V3 exigía con firma del gate.

---

## §1. Las trece condiciones del §6.2, revisadas para (B)

**Ninguna de las trece sobra. Tres cambian de forma. Faltan cinco**, y las cinco las hace faltar la decisión: cuando el destinatario deja de ser el operador, aparecen obligaciones que con la sesión delante no existían.

Leyenda del reparto: **(a)** test estático, enunciable como CA · **(b)** línea de runbook · **(c)** compromiso humano con nombre y fecha que ningún test sostiene.

### 1.1 Cuadro de reparto

| # | Condición | Reparto | Cambia con (B) |
|---|---|---|---|
| 1 | Acotada en tiempo: dos jornadas declaradas | **(a)** + (b) residual | Se puede **testar**, y hoy no se testaba |
| 2 | Acotada en alcance: dos competiciones | **(a)** | — |
| 3 | Sin archivo histórico público | **(a)** | — |
| 4 | El calendario sigue siendo humano | **(b)** + **(c)** | Sube de importancia; sigue sin test posible |
| 5 | Sólo los campos permitidos, como proyección | **(a)** | Ya es CA-5. Intacta |
| 6 | Sin superficie programática | **(a)** parcial + **(c)** | **Cambia**: `/api/board` se queda sin puerta |
| 7 | Cero monetización | **(a)** parcial + **(c)** | Gana una mitad testable |
| 8 | El polling nunca pide a un tercero | **(a)** | Mismo test, riesgo multiplicado por N |
| 9 | `noindex`; `robots.txt` sin tocar | **(a)** | **Cambia**: sin `nofollow`, con `noarchive` |
| 10 | Literales corregidos · RFGF avisada · fecha | **(a)** + **(b)** + **(c)** | Se **parte en tres** repartos distintos |
| 11 | El buzón sigue delante | **(a)** | — |
| 12 | La retención no se alarga | **(a)** parcial + **(c)** | — |
| 13 | Re-comprobar `robots.txt` y reserva TDM | **(a)** mitad ya hecha + **(b)/(c)** la otra | **Cambia**: el canal TDM no es observable (403 hoy) |
| **14** | **El aviso de medición y su degradación** | **(a)** + (c) | **Nueva** |
| **15** | **La ruta es `/marcador`; `/` no se toca** | **(a)** | **Nueva** |
| **16** | **Enlaces recíprocos con `/proxecto` y `/robot`** | **(a)** | **Nueva** |
| **17** | **Cero almacenamiento, cero terceros, cero analítica** | **(a)** | **Nueva** (era un inciso del §5) |
| **18** | **Línea de privacidad alcanzable** | **(a)** parcial + **(c)** | **Nueva** (era la recomendación R3) |

### 1.2 Las que se enuncian como CA — enunciado propuesto

**C1 — (a).** *Dado `MEASUREMENT_WINDOWS`, un caso afirma que la lista declarada tiene **como máximo dos entradas** y que el `competition_id` de cada una pertenece a la lista cerrada de C2. **Control positivo:** una tercera entrada, o una competición fuera de la lista, pone rojo un caso nombrado.* Y ya existe CA-3.1/3.2 para la mitad de contenido. **Residual (b):** el test sólo se pone rojo si alguien corre `npm run gates`, y no hay CI (`F-SPEC-004-3`): la línea de runbook es *«antes de desplegar la pantalla, `npm run gates`»*.

**C2 — (a).** *Existe una lista cerrada `PUBLISHED_COMPETITIONS` con **exactamente** `preferente-futgal-grupo-1` y `terceira-rfef-grupo-1`, con motivo escrito por entrada (forma de `ALLOWED_PACKAGES`, ADR-016 §3.2). El snapshot filtra por ella; un caso afirma que un partido de una competición no listada no sale ni en HTML ni en el cuerpo del refresco. Control positivo: añadir una tercera pone rojo un caso nombrado.*

**C3 — (a).** *El conjunto de jornadas alcanzables desde cualquier ruta pública es **igual** al conjunto declarado en `MEASUREMENT_WINDOWS`. Ninguna ruta acepta una fecha, una jornada ni un identificador arbitrarios; una petición por una jornada no declarada responde 404 **con cero lecturas de la base**. Control positivo: aceptar un parámetro de fecha pone rojo un caso nombrado.*

**C5 — (a).** Ya es **CA-5** entero. **No la toco: es la condición mejor escrita de la spec** y es la que sobrevive a todo lo demás.

**C6 — (a) parcial + (c).** El problema nuevo: CA-2 ponía la sesión delante de `/marcador`, `/es/marcador` **y `/api/board`**. Con (B) la pantalla es pública y su refresco tiene que serlo también, así que **`/api/board` queda expuesto y eso es, de hecho, un endpoint JSON público** — el punto 5 del disparador.
- **Recomendación (la limpia):** que el refresco devuelva **fragmento HTML**, no JSON. Entonces C6 es literalmente cierta y el test es trivial. El `ETag` y la `version` de CA-7 funcionan igual sobre HTML.
- **Mínimo vinculante si se queda en JSON**, las cuatro a la vez y testadas: *(i)* **nunca** se emite `Access-Control-Allow-Origin` ni ninguna cabecera CORS — un caso lo afirma sobre la respuesta, control positivo al añadirla; *(ii)* lleva `X-Robots-Tag: noindex` como el documento; *(iii)* **no se documenta en ningún sitio** — ni en `/robot`, ni en `/proxecto`, ni en un OpenAPI, ni con un enlace; *(iv)* sirve **exactamente** la lista cerrada de CA-5, ni un campo más.
- **(c):** y se escribe en el ADR, sin adornos, que **cualquiera con las herramientas del navegador puede leer ese JSON**. Llamarlo «privado» sería el mismo error que llamar defensa a `noindex`.

**C7 — (a) parcial + (c).** *Un caso afirma que el documento servido no contiene ningún `<iframe>`, ningún `<script src>` hacia un host que no sea este origen (ya CA-1.5), ningún `<a>` a un dominio de pago, y ninguna forma de una **lista cerrada declarada en el test con su motivo escrito**: patrocina/patrocinio/publicidade/publicidad/anuncio/doar/donar/apoia/apoya/subscri. Control positivo: una cadena de prueba pone rojo el caso.* **Declarado dentro del criterio (ADR-016 §6):** el mecanismo **no alcanza** un patrocinio acordado fuera de la página ni dinero que nunca toca el HTML. Eso es **(c)**: compromiso de Alberto Fojo, con fecha, de que no hay ni habrá contraprestación mientras esta pantalla esté servida.

**C8 — (a).** Ya es **CA-1.4**. **No cambia de enunciado y cambia de peso**: con la sesión delante, `N` lectores ≈ 1; en público, `N` no tiene techo. Sigue siendo la afirmación más importante de la spec. **Consecuencia nueva de (B) que la spec tiene que resolver**: la caché deja de poder ser privada. Una caché pública es **legalmente favorable** —menos lecturas de origen, ninguna petición a terceros— pero no puede dejar la página vieja contradiciendo los tres relojes. Es del arquitecto; yo sólo marco que (B) lo abre.

**C9 — (a).** Ver §3. Enunciado: *`X-Robots-Tag: noindex, noarchive` en cabecera **y** `<meta name="robots" content="noindex, noarchive">`; **sin `nofollow`**. Un caso lo afirma sobre las cabeceras y sobre el documento. `src/site/robots-txt.ts` no se toca, y el verificador lo comprueba en el diff.*

**C11 — (a).** *El documento servido alcanza `ola@tremen.dev` **en un clic**: o lo contiene, o contiene un `<a href>` a `/robot`, cuyo primer bloque ya lo lleva (SPEC-005 CA-5, ADR-012 §3). Un caso lo afirma en las dos lenguas.* **Recomendación:** la dirección misma en el pie. Una línea no rompe la densidad de D-8 y ahorra el clic a quien viene a quejarse, que es justamente para quien está.

**C12 — (a) parcial + (c).** *Un caso afirma que las constantes de retención siguen siendo 30 y 90 días (ADR-009, ADR-020).* Lo que ningún test ve —que nadie escriba una prórroga cuyo motivo real sea «ahora hay público»— es **(c)**.

**C14 — (a) + (c). Nueva, y es la que la decisión de producto obliga a escribir.** El aviso no es decoración: es lo que sostiene la coherencia entre la pantalla, `/robot` y la carta, y es lo que mantiene vivo el argumento de *CV-Online* (C-762/19) y aleja el art. 10 LSSI (§4).
- **Contenido obligado** (el *qué*, no las palabras — eso es de `sdd-lingua`): *(i)* esto es una medición, no un producto; *(ii)* **no es oficial ni de la RFGF** (§6); *(iii)* la degradación declarada — una sola fuente automática, luego lo normal es provisional y con atraso; *(iv)* cómo pedir que pare, con el buzón o `/robot`.
- **Forma obligada, testable:** visible **sin interacción**, antes de la tabla en orden del documento, **paridad gl/es**, y **sin ningún control de descarte que escriba estado** — ni cookie ni `localStorage`, porque eso rompería C17 y CA-2.8. Un `<details>` plegado vale para la explicación larga, **nunca para la primera línea**.
- **Y el hallazgo que convierte un (c) en un (a).** «Hay una sola fuente automática» es un hecho que **puede dejar de ser cierto en dos días**: `lapreferente.com` se verifica el **2026-09-06** (`calendario-de-compromisos.md`, fila 1). Un aviso público falso sobre la propia actividad es el mismo vector del art. 5 de la Ley 3/1991 que encontré en mi §0. **Enunciado:** *el número que el aviso declara se **deriva** de `DEFAULT_SOURCES` (`src/ingest/sources.ts:132`, hoy una entrada), no se escribe a mano; un caso afirma que coinciden. **Control positivo:** declarar una segunda fuente pone rojo un caso nombrado hasta que el aviso se corrija.* Es barato y cierra la clase entera de error.

**C15 — (a). Nueva.** *`SITE_REDIRECTS` (`src/site/redirects.ts`) **no cambia**: `/` sigue redirigiendo a `/proxecto` y `/es` a `/es/proxecto`. Un caso afirma que no existe ninguna redirección de `/` hacia la pantalla y que las rutas del marcador son `/marcador` y `/es/marcador`. Control positivo: mover la pantalla a `/` pone rojo un caso nombrado.* ADR-010 §5 queda intacto por decisión del gate, y esto merece un CA porque **el atajo de «terminar el trabajo» llevando la pantalla a la raíz es exactamente el que alguien dará dentro de tres meses**. La raíz es la puerta de un producto; `/marcador` es una pantalla de medición, y eso es lo que el aviso afirma.

**C16 — (a). Nueva.** *`/proxecto` y `/robot`, en las dos lenguas, enlazan la pantalla con un `<a href>` de verdad, y la pantalla enlaza `/robot`. Cuatro casos, uno por página y lengua.* Su función es jurídica y no de navegación: **es lo que convierte `noindex` en no-amplificación en vez de en ocultación** (§3).

**C17 — (a). Nueva, y era un inciso de mi §5 que ahora tiene que ser condición con nombre.** Ya está casi entera en CA-1.5 y CA-2.8. Se enuncia como una sola: *ningún módulo de la pantalla ni de su contrato escribe cookie propia, usa `localStorage` o `sessionStorage`, lee `Accept-Language` o cabeceras de cliente, ni nombra ningún host externo; y **no existe ninguna medición de audiencia de ningún tipo**, incluido Vercel Web Analytics, cuya inyección de guion pondría rojo el caso de CA-1.5.* **Declarado dentro del criterio (ADR-016 §6), y hay que escribirlo porque es la respuesta al §2:** *lo que este mecanismo no alcanza es saber cuánta gente abre esta pantalla, cuánto se queda o si vuelve. **Eso es querido**, y es la causa de que el punto 7 del disparador no pueda vigilarse desde la página.* Es lo que retira el art. 22.2 LSSI sin banner y sin consentimiento.

**C18 — (a) parcial + (c). Nueva.** Con la sesión delante no hacía falta. Con público sí: hay un tratamiento de IP en los logs (Vercel como **encargado**, base art. 6.1.f RGPD) y hay un interesado que ahora existe. **No es un aviso legal y no es un banner**: una línea alcanzable en un clic que diga qué registra el servidor, quién lo procesa, con qué base, cuánto se conserva, **que no hay cookies ni analítica ni terceros**, y el buzón para los arts. 15-22 RGPD. **Recomendación de sitio: dentro de `/robot`**, que ya tiene el bloque de qué se guarda y cuánto — un solo lugar honesto, una superficie menos. **Testable:** que existe, que se alcanza en un clic, y que **no nombra a ninguna persona física** (la lista negra de `tests/site/identity.test.ts` ya existe, SPEC-007). **(c):** que lo que dice sea verdad.

### 1.3 Las que ningún test sostiene, y hay que decirlo sin adornos

**C4 — el calendario humano. (b) + (c). Es el caso más claro de todo el reparto: no hay ni habrá test.** Un `calendario/<temporada>/<competition_id>.json` escrito a mano y uno derivado del HTML de la fuente son **el mismo fichero**. CA-3.5 ya pone la línea de runbook y es lo único que hay.
- **Precisión que hay que añadir a esa línea, porque hoy se puede leer mal y la lectura mala es la que perjudica:** lo prohibido es derivarlo **de la fuente rastreada** —el HTML de `ceroacero.es`— a mano o con un LLM. **Una persona que consulta con su navegador el calendario publicado por la propia RFGF y lo teclea no incumple nada**: RN-11 gobierna la petición automatizada, no la lectura humana, y un calendario que viene del organizador es **la mejor** posición defensiva disponible (*Fixtures Marketing*, C-46/02 y acumuladas: la inversión en **crear** el calendario no genera *sui generis* para nadie).
- **(c) propuesto, y es barato:** en el ledger de cada jornada, una línea firmada y fechada —*«calendario declarado a mano el AAAA-MM-DD a partir de <origen humano>»*—. No es un test, pero es lo que un tercero pediría y lo que convierte una convención en un registro.

**C10 — se parte en tres, y cada trozo va a un sitio distinto. Es el reparto que la spec más fácilmente fingirá.**
- **(a) los literales:** un caso afirma que `crawler.noRepublish` y `site.noProduct` **ya no contienen** las afirmaciones retiradas —lista cerrada declarada en el test: `non republicamos`, `informe interno`, `non hai marcador público`, `nada que se poida consultar fóra do proxecto`, y sus gemelas de `es`— y los casos nuevos que `sdd-lingua` y el implementador escriban para el contenido nuevo. **CA-2.7 se invierte**: dejaba de estar «intacta» y pasa a ser «corregida». Que el test cambie **es** el criterio.
- **(b) el procedimiento:** enmienda por **ADR-015** en el **ledger** de SPEC-004 y de SPEC-005, bajo `## Enmienda — <fecha>: <qué la invalida>`. El cuerpo de esas specs no se edita **nunca**. Lo comprueba el verificador en el diff.
- **(c) el aviso a la RFGF:** **Alberto Fojo, con fecha, antes o a la vez que el despliegue, nunca después.** Ningún test lo sostiene y ninguno lo sostendrá. **Fila nueva en `docs/procedimientos/calendario-de-compromisos.md`.**

**C13 — cambia, y por un hecho de hoy.** La mitad del `robots.txt` **ya está mecanizada**: `src/polite/robots.ts`, vigencia 6 h, fallo cerrado (ADR-014 §3.2) — **(a)**, y no hay nada que añadir. La mitad de la reserva TDM **no la mira nada**, y hoy he descubierto que el canal estándar tampoco es observable: `/.well-known/tdmrep.json` responde **403**, no 404, así que *«no hay reserva»* sería una conclusión que el dato no permite.
- **Línea de runbook (b), con los tres sitios y con la honestidad de que uno no se puede cerrar:** antes de abrir cada ventana se mira *(i)* `robots.txt` —hecho, sin líneas TDM/`ai` hoy—, *(ii)* `/.well-known/tdmrep.json` —**se anota el código de respuesta, no una conclusión**; hoy 403—, *(iii)* la página legal/ToS —**HTTP 503**, irrecuperable, igual que la dejó ADR-008 §4—.
- **Y el mecanismo mínimo que propongo, porque no cuesta una sola petición nueva:** la reserva TDM puede viajar también en la cabecera `tdm-reservation` o en un `<meta>` de la respuesta. **El raw store ya archiva la respuesta entera antes de parsearla (RN-10)**, así que la comprobación puede ser **análisis estático del archivo**, no una petición. Cero superficie nueva, cero peticiones a terceros, y automatizable el día que se quiera.
- **(c) residual:** que alguien mire. Fila en el calendario de compromisos.

---

## §2. El disparador de re-dictamen: de siete puntos a ocho, y qué pasa con el punto 7

### 2.1 Los seis primeros

**Puntos 1, 2, 3, 5 y 6: se mantienen literalmente.** Los tres primeros ganan además, con C1, C2 y C5, un test que se pone rojo **antes** de que el disparador tenga que dispararse — que es como debe ser: el disparador es la red, no el suelo. El 5 hereda el matiz de C6 sobre `/api/board`. El 6 (monetización) es el más importante de los seis y es el único que además invierte el §4.

**Punto 4: se parte, y la decisión lo obliga.** Confundía cuatro cosas distintas, y una de ellas ha pasado de disparador a **obligación**:
- **4.a** la pantalla deja de ser `noindex` → **sigue siendo disparador**, y ahora es el único de los cuatro que significa *amplificación*;
- **4.b** aparece en `robots.txt` → **sigue siendo disparador** (y sería además técnicamente contraproducente, §3);
- **4.c** aparece un **enlace externo** —un medio, un club, la federación, una red social— → **sigue siendo disparador**, y es el mejor indicador que hay (§2.2);
- **4.d** ~~se enlaza desde `/proxecto` o `/robot`~~ → **deja de ser disparador y pasa a ser obligatorio** (C16). Es la corrección que (B) impone y hay que escribirla, porque tal como está redactado el punto 4 hoy, **cumplir C16 dispararía el re-dictamen**;
- **4.e (nuevo)** la pantalla se mueve a `/` → **disparador nuevo**. El gate ha decidido `/marcador` con ADR-010 §5 intacto; llevarla a la raíz es un acto distinto y necesita otra firma.

**Punto 8 (nuevo):** *el aviso de degradación deja de ser cierto* — aparece una segunda fuente automática, o `futgal.es` pasa a ser capturable. C14 lo pone rojo; el disparador dice qué hacer con el rojo.

**La cláusula permanente se mantiene y sube de rango:** *el día que ZOS, Lda. o la RFGF escriban pidiendo que se pare, se para primero y se dictamina después.* Con público es más probable que llegue. **Y ahora merece una línea de runbook con el procedimiento concreto, porque «se para» tiene que ser ejecutable en menos de una hora:** el botón de parada **ya existe y no hay que construirlo** — **vaciar `MEASUREMENT_WINDOWS`**, y por CA-3.2 la pantalla sirve lista vacía con **cero consultas**. Escríbase en el runbook con esas palabras: *parar es vaciar la lista declarada, y no requiere tocar una línea de lógica.*

### 2.2 El punto 7: no se sostiene como está, y no exige ningún mecanismo en la página

Tienes razón y el problema es real: **con C17, nadie puede observar «más de 100 visitantes distintos».** Un disparador que nadie puede observar no es un disparador; es peor que no tenerlo, porque hace creer que algo vigila. **Dictamen: se sustituye, en tres piezas.**

**(i) El indicador se cambia de métrica, no de naturaleza.** «Visitantes **distintos**» es inobservable **por diseño y por derecho**: distinguir personas exige identificarlas, y contar IPs distintas sería un tratamiento **nuevo** de dato personal que hoy no existe — el punto 7 estaría pidiendo, para vigilar el riesgo, crear exactamente el riesgo. Lo que sí existe ya, sin tocar nada, son **los logs de la plataforma**: la petición ya ocurrió, el registro ya está, Vercel ya es encargado (mi §5), y **nada se escribe en el equipo terminal de nadie**, así que el art. 22.2 LSSI no entra. **Se cambia a: cargas del documento `/marcador` y `/es/marcador` en un día**, leídas de los logs de la plataforma. Una carga por pestaña abierta, sin inflar por el polling —**por eso se cuenta el documento y no la ruta de refresco**, que a 60 s produce ~90 peticiones por lector y hora—. El umbral de 100 se conserva **en cargas de documento**, no en visitantes.

**(ii) El indicador que de verdad importa no es un número, y es gratis.** **La primera aparición de un `Referer` que no sea este origen.** Lo envía el navegador, no se almacena en el equipo de nadie, y ya está en el log. Un enlace entrante de un medio, un club, la federación o una red social **es** el momento en que esto dejó de ser el operador y su entorno — y lo dice antes y mejor que cualquier recuento. Es, de hecho, el punto 4.c mirado desde el otro lado.

**(iii) Lo que se declara **no vigilable**, por escrito y sin eufemismos.** *No sabemos ni sabremos quién abre esta pantalla, cuánto se queda ni si vuelve. No hay analítica, no la habrá, y esa ausencia es una decisión, no una carencia.*

**El mínimo mecanismo que no convierte la página en un rastreador es: ninguno.** No se añade nada a la página. La observación es **del lado del servidor y a posteriori**, sobre datos que ya existen. Cualquier cosa que se inyecte en el documento —Vercel Web Analytics incluido, que es la respuesta de un clic y es justo la trampa— rompe C17 y CA-1.5, convierte la IP de cada visitante en una cesión y cambia todas mis respuestas del §4 y del §5.

**Y el residual honesto, que es (c):** aunque el dato exista, **alguien tiene que ir a mirarlo**. Fila en `docs/procedimientos/calendario-de-compromisos.md`: *«al día siguiente de cada jornada de medición, Alberto Fojo mira las cargas de documento y los `Referer` de las dos rutas del marcador y escribe el número en el ledger de la jornada.»* **Al día siguiente y no al mes**: conviene confirmar la ventana de retención de logs del plan antes de apoyarse en ella; si es más corta que el hueco entre jornadas, la comprobación no admite aplazamiento.

---

## §3. `noindex` con (B): se mantiene, cambia de acompañantes, y `robots.txt` no se toca

### 3.1 Las dos direcciones, y por qué la objeción se disuelve

**A favor de mantenerlo, y una de las razones es específica de este proyecto y bastante fuerte:**
- La carta a la RFGF construye su gancho sobre esto: *«Buscando hoy “Preferente Futgal grupo 1 resultados” aparecen ocho agregadores privados y ninguna liga a futgal.es»*. **El día que `marcador.gal/marcador` sea el noveno resultado de esa búsqueda, el argumento de la carta se vuelve contra quien la firmó.** No hay forma de leer eso a nuestro favor.
- Mantiene vivo el argumento de *CV-Online Latvia* (C-762/19): lo que decide es si se **menoscaba la inversión** del fabricante. Una pantalla que no capta audiencia del buscador no le quita nada a ZOS; una indexada, en las mismas consultas, empieza a hacerlo.
- Es el **sustituto estructural** del umbral que nadie puede medir (§2). Si no puedes observar la audiencia, lo coherente es no crear el mecanismo que la genera.
- Una pantalla que vive dos jornadas no tiene nada que hacer en un índice: las entradas sobreviven a la página y producen resultados obsoletos sobre partidos que ya se jugaron.

**En contra —«publicamos pero que no se vea»— y por qué no se sostiene:** la objeción supone que `noindex` es ocultación. **Lo es si va sola.** `noindex` + **ningún enlace** + **ninguna mención** es esconderse, y leería fatal junto a la carta. Pero eso no es lo que se va a hacer: **C16 obliga a enlazarla desde `/proxecto` y `/robot`**, C10 obliga a corregir los literales, y el aviso a la RFGF la nombra expresamente. **La honestidad se resuelve enlazando, no indexando.** Una página enlazada desde las dos páginas que la carta cita, y comunicada a su destinatario, es **descubrible por una persona y no amplificada por un buscador** — que es una postura coherente, defendible y describible en una frase, no un escondite.

**Dictamen vinculante: `noindex` se mantiene, por cabecera `X-Robots-Tag` y por `<meta>`, las dos** (precedente ya verificado en SPEC-017 CA-1.10, `src/admin/handler.ts:118`). **Y se mantiene escrita la advertencia de mi V9: `noindex` no es una defensa jurídica.** La reutilización del art. 7.2.b es *poner a disposición del público*: una URL pública sin indexar lo está igual.

### 3.2 Dos cambios a mi V9, y los dos los causa (B)

- **`nofollow` se retira.** Con la sesión delante era inocuo. En público, `nofollow` le dice al rastreador que **no siga los enlaces salientes de esta página**, y los únicos enlaces salientes son `/robot` y `/proxecto` — precisamente la página que viaja dentro de nuestro `User-Agent` y que queremos que un tercero alcance (ADR-011, ADR-012 §3). Declararlo trabaja contra el proyecto y no protege nada. *(Cautela técnica: una página `noindex` de larga duración acaba tratada como `noindex,nofollow` por los buscadores; no se debe hacer depender el descubrimiento de `/robot` de los enlaces de esta pantalla — `/proxecto` ya lo enlaza y sí es indexable.)*
- **`noarchive` se añade.** Es el hueco que (B) abre y que ninguna condición cubría: **una página pública será archivada por terceros, y ese archivo sobrevive a nuestras dos jornadas y a nuestros 30 días de retención.** La defensa de «acotada en el tiempo» (C1) es sobre *nuestra* publicación; el archivo de un tercero la hace permanente. `noarchive` es honrado por Google y Bing para sus copias en caché; **frente al Internet Archive no es exigible** y hay que escribirlo así. Es barato, ayuda algo, y **lo que no arregla es residual que el gate firma con los ojos abiertos** — junto con lo que ya lo mitiga de verdad: que lo archivable sea mínimo (C3 y C5).

### 3.3 `robots.txt`: no se toca. Vinculante, y ahora con un argumento mejor que antes

`src/site/robots-txt.ts` genera hoy `User-agent: * / Allow: /` y **no cambia**. Bajo (A) el motivo era *«un `Disallow` confirmaría que existe»*, que con una pantalla deliberadamente pública ya no aplica. Quedan dos, y el primero es decisivo y **técnico, no retórico**:

1. **Un `Disallow: /marcador` derrotaría al `noindex`.** `Disallow` impide **rastrear**, y sin rastrear el buscador **nunca lee el `noindex`**: la URL puede seguir apareciendo en resultados como URL desnuda, alimentada por enlaces externos, y sin posibilidad de retirarla. Las dos directivas juntas son estrictamente peores que `noindex` sola. Quien proponga «pues lo bloqueamos también en robots.txt» estará empeorando exactamente lo que quiere arreglar.
2. **`robots.txt` es el fichero con el que este proyecto le pide a otro que le deje pasar.** Es literalmente el objeto de la carta a la RFGF, que pide dos líneas. Ensuciar el propio con exclusiones defensivas mientras se pide lo contrario es un mal negocio, y sigue siéndolo con (B).

### 3.4 ¿Se enlaza desde `/proxecto` y `/robot`? **Sí, vinculante, desde las dos y en las dos lenguas** (C16)

Es la mitad que hace que `noindex` no sea ocultación (§3.1). Y en `/robot` tiene una función adicional: esa página tiene que **dejar de ser falsa** (§6), y una página que dice «hay una pantalla pública» **sin enlazarla** hace una afirmación; **enlazándola**, hace una afirmación **auditable**, que es lo único que `/robot` ha sido nunca.

---

## §4. Art. 10 LSSI frente a ADR-012: hoy no aplica, y lo que pasa el día del primer euro

### 4.1 Qué obliga exactamente el art. 10

Ley 34/2002, art. 10.1: el prestador debe disponer de medios para que destinatarios y autoridades accedan por medios electrónicos, **de forma permanente, fácil, directa y gratuita**, a: **(a)** su **nombre o denominación social**, su **domicilio** o la dirección de un establecimiento en España, su **dirección de correo electrónico** y cualquier otro dato que permita comunicación directa y efectiva; **(b)** datos de inscripción registral cuando proceda; **(c)** datos del órgano de supervisión si la actividad requiere autorización previa; **(d)** para profesiones reguladas, colegio, título y Estado; **(e)** el **NIF**; **(f)** precios e impuestos cuando proceda; **(g)** códigos de conducta.

### 4.2 ¿Aplica hoy, con pantalla pública y sin monetización? **No. Vinculante.**

El art. 10 sólo alcanza a un **servicio de la sociedad de la información**, y el Anexo a) de la LSSI lo define como el prestado normalmente **a título oneroso**, comprendiendo también **los no remunerados por sus destinatarios «en la medida en que constituyan una actividad económica para el prestador»** (verificado hoy, 2026-09-04). **El disparador no es que la página sea pública: es que haya actividad económica.** Hoy no la hay: sin publicidad, sin patrocinio, sin muro de pago, sin feed, sin formulario, sin lista de espera, sin captación de nada. **Que la pantalla pase de la sesión al público no mueve esta respuesta ni un milímetro**, y confirmo así mis dictámenes del 2026-09-01 y del 2026-09-04.

**Pero el margen se ha estrechado en un punto concreto que prefiero escribir yo antes de que lo encuentre otro.** La pantalla queda ahora bajo un **paraguas comercial declarado y enlazado**: `tremen.dev` (ADR-012 §2). Cabe el argumento de que una página pública con forma de producto, que exhibe la capacidad técnica de un estudio profesional, es actividad económica **indirecta** — un activo de escaparate. **Mi criterio sigue siendo que no**, y lo que lo sostiene es comprobable: la pantalla **no ofrece nada**, no vende, no capta y **se declara medición** (C14). Y de ahí sale una **sub-condición vinculante nueva, testable**: *la pantalla no lleva ninguna llamada a la acción — ni alta, ni lista de espera, ni boletín, ni formulario, ni «contáctanos para…» — y sus únicos enlaces salientes son `/robot`, `/proxecto` y el buzón para quejas.* Un caso lo afirma con lista cerrada. Es barato y es exactamente lo que mantiene el art. 10 fuera.

### 4.3 ¿Basta el buzón más el paraguas si algún día aplicara? **No, y hay que decirlo claro**

`ola@tremen.dev` cubre **un solo elemento** del art. 10.1.a: el correo electrónico. **No cubre el nombre o denominación social, ni el domicilio o establecimiento en España, ni el NIF (art. 10.1.e), ni la inscripción registral si procede.** Y el paraguas tampoco: `tremen.dev` **no publica textos legales y no nombra a nadie** — comprobado por `sdd-arquitecto` el 2026-09-01 y registrado en ADR-012, que **deliberadamente dejó de apoyarse en esa premisa**.

**Por tanto: el art. 10 y ADR-012 §1 son incompatibles.** ADR-012 §1 prohíbe nombrar a persona física y prohíbe declarar la forma jurídica; el art. 10 exige exactamente eso. **El día que aplique, ADR-012 §1 cede en parte** — no entero: nada obliga a publicar cuántas personas hay detrás.

### 4.4 Qué pasa exactamente el día que haya cualquier ingreso

**Desde el primer euro** de publicidad, patrocinio, muro de pago, afiliación, venta de feed, o del uso de esta pantalla para vender servicios de `tremen.dev`:

1. **El art. 10 pasa a aplicar** y hay que publicar identificación completa (§4.1). Incumplirlo está tipificado en el régimen sancionador de la LSSI (arts. 38-40) como infracción **leve**, con multa de hasta **30.000 €** (art. 39) — *el apartado concreto conviene que lo confirme una revisión profesional*.
2. **ADR-012 §1 queda superado en parte**, y eso no se parchea: **ADR nuevo**.
3. Si el ingreso es publicidad, entra además el **art. 20 LSSI** (identificar al anunciante y el carácter promocional). Si viene de apuestas, el **RD 958/2020**, ya descartado en `docs/negocio/monetizacion.md` y en D-7.
4. **Muere el argumento de *CV-Online*** (§1.3 de mi dictamen anterior), que es hoy el más fuerte que tiene el proyecto frente a ZOS.
5. La línea de privacidad (C18) deja de poder ser anónima: el responsable pasa a ser identificable.

**Instrumento correcto, y se escribe ahora, no ese día.** ADR-012 está aprobado e inmutable, así que el disparador **no puede añadírsele**: va en **el ADR nuevo de publicación**, citándolo. Redacción propuesta: *«El día que exista cualquier contraprestación sobre esta pantalla, ADR-012 §1 cede en lo relativo a la identificación del prestador; ese día se escribe un ADR que la sustituya y **se pide revisión profesional antes de monetizar, no después**.»* Y no es motivo para retrasar nada hoy: la forma más barata de mantenerlo lejos son C7 y la sub-condición de §4.2.

---

## §5. Qué cambia en «qué se puede enseñar» ahora que el destinatario es cualquiera

**La lista de permitido/prohibido de mi §4 no cambia de contenido.** Cambia la **consecuencia de un fallo**: bajo (A) una filtración llegaba a un operador autenticado; bajo (B) llega a cualquiera, se cachea, se captura y se archiva fuera de nuestro alcance (§3.2). Por eso CA-5 —lista cerrada enumerando el esquema canónico, con control positivo— deja de ser buena práctica y pasa a ser **la** condición: es la única de las dieciocho cuyo fallo es irreversible.

Dos precisiones, que son las que preguntas.

### 5.a `last_observed_at` frente a `decided_at`: **`last_observed_at`, y rectifico mi propia tabla**

Mi §4 puso `decided_at` en la fila «instante del último dato». **Estaba escrita para una audiencia de operador y para una proyección cuya única preocupación era la filtración. SPEC-018 y `sdd-competicion` llegaron a la respuesta mejor, y bajo (B) lo es MÁS, no menos.**

**¿Publicar `observed_at` revela algo sobre el ritmo de rastreo de un tercero que `decided_at` no revele? No.** Tres pasos:

1. **`observed_at` es *nuestro* reloj, no el de la fuente.** Es el instante en que **nosotros** pedimos y parseamos, no el instante en que el tercero publicó. No revela la cadencia de ZOS: revela la nuestra.
2. **La nuestra ya está publicada, a propósito y por norma.** RN-11 fija 1 petición/minuto por competición; `/robot` lo publica; la carta a la RFGF lo dice con esas palabras. **No hay primera divulgación**, que es exactamente lo que hacía inaceptable nombrar la fuente (mi §2). Una cadencia de 60 s es de nuestro cron y es idéntica leamos a quien leamos: **no identifica a nadie**.
3. **Y `decided_at` sería peor, no mejor, y ahora eso importa más.** El motor **no emite `Decision` por tick**: sólo cuando cambia la tupla publicada (ADR-021). Un `live` sin goles puede tener `decided_at` de hace cuarenta minutos estando perfectamente vivo — o de hace cuarenta minutos porque la fuente murió. **`decided_at` no distingue «no ha pasado nada» de «nadie ha mirado».** Rotularlo «último dato» ante un público sería una afirmación engañosa sobre la frescura de un dato propio: el mismo vector del art. 5 de la Ley 3/1991 que encontré en mi §0, y además destruye RN-07 para quien lee. **La opción honesta y la legalmente segura coinciden**, que no pasa a menudo.

**Dos condiciones vinculantes que se enganchan:**
- **Granularidad de minutos, no de segundos.** Se publica **la edad redondeada a minutos**, como ya hace SPEC-018 §4 (*«Último dato + la edad»*), y **ningún instante absoluto con precisión de segundo** de nuestra petición aparece en el cuerpo servido. Un `<time datetime>` **redondeado al minuto** es admisible por accesibilidad. Cierra el único residual que quedaba —un log público, partido a partido, de cuándo pedimos— sin quitarle nada al lector. Testable.
- **Nunca rotulado «actualizado desde X»** (ya en mi §4 y en la barrera léxica de CA-8.4).

### 5.b «Hay una sola fuente automática» sin nombrarla: **sí se puede. Vinculante**

La pregunta es buena porque en mi §4.1 sostuve que **la cardinalidad es información** —dos `supporting_observation_ids` dicen «hay dos fuentes» sin nombrar ninguna—. La coherencia obliga a tomármelo en serio, y tres cosas la distinguen:

1. **Ya es público, y a propósito.** `/robot` dice hoy *«Hai fontes que hoxe non lemos precisamente por iso»*; `/proxecto` dice que la fuente oficial no se rastrea porque su `robots.txt` no lo permite; la carta lo dice. Que la oficial **no** está entre nuestras automáticas es hecho publicado. Añadir «hay una» **no estrecha el conjunto de candidatas**: la propia carta observa que en esa consulta aparecen **ocho** agregadores privados.
2. **Es información sobre nosotros, no sobre ellos.** «Leemos una fuente automática» describe nuestra arquitectura. «Leemos ceroacero.es» nombra a un tercero y es la primera divulgación que mi §2 cierra.
3. **Sin el número, la afirmación no es comprobable.** «Lo normal es provisional y con atraso» se **deriva** de RN-02 + RN-03 + el hecho de la fuente única. Enunciar la consecuencia ocultando la causa deja al lector una promesa que no puede verificar — y la verificabilidad **es** toda la mitigación de este proyecto.

**Dónde está la línea, porque se rompe en la frase siguiente. Prohibido en el aviso:** el **nombre** y el **dominio** de la fuente; su **peso** (0.7 — ya prohibido); su **tipo** («un agregador privado», «una web de resultados»), porque tipo + «una» + la competición estrecha mucho y no compra nada; cualquier **cadencia atribuida a ella** («la leemos cada minuto» vale como ritmo **nuestro** en `/robot`, no como «leemos X cada minuto» en la pantalla); y cualquier **comparación** («más rápida que la oficial»).

**Y una prohibición que no es obvia:** **no se dice en la pantalla que «la fuente oficial no nos deja».** En `/robot` está dicho, es correcto y se queda. En el marcador, junto a las dos competiciones de la RFGF y en la semana en que decide, **se lee como un reproche a la federación en la página que republica sus competiciones**. Va en `/robot`, y la pantalla enlaza.

---

## §6. Las enmiendas obligadas: qué tienen que dejar de afirmar y qué tienen que pasar a afirmar

No redacto literales. Digo el contenido, que es lo mío.

### 6.1 `site.noProduct` (SPEC-004, `gl.ts:226` / `es.ts:233`)

**Deja de afirmar:** que no hay marcador público; que «no hay nada que usar»; que la página existe sólo para decir quién está detrás y qué se va a medir.

**Pasa a afirmar:** que **hay** una pantalla pública, **dónde está** (y la enlaza, C16); que enseña **sólo** las jornadas de medición declaradas de **dos** competiciones; que es un **instrumento de medición y no un producto**; que **normalmente será provisional y llegará con atraso**; y que **se apaga cuando la medición acaba**.

**Lo que NO puede cambiar, y es de carga:** «no hay aplicación, ni cuenta que crear, ni lista de espera». **Sigue siendo verdad y es exactamente lo que mantiene el art. 10 LSSI fuera** (§4.2). Quien edite este literal tiene que saber que esa mitad no es prosa sobrante.

**Y en el mismo cambio, `site.measuring`.** Hoy dice *«A medición aínda non comezou e non hai ningunha cifra»*, y es **falso** desde SPEC-012/013/017. Lo marqué como hallazgo colateral con destino EPIC-MEJORA; con (B) **sube a vinculante en esta enmienda**: una afirmación falsa en la misma página que enlaza el marcador público es el mismo fallo del §0, en la misma página y con más audiencia.

### 6.2 `crawler.noRepublish` (SPEC-005, `gl.ts:271` / `es.ts:279`) — la difícil

**Deja de afirmar las tres:** «Non republicamos os datos de ninguén»; «o resultado é un informe interno»; «Non hai marcador público, nin ficheiro de datos, nin nada que se poida consultar fóra do proxecto».

**Y cierro otra vez la salida que sale sola.** La frase *podría* salvarse leyéndola sobre **personas** —de datos personales no republicamos ninguno, y eso sigue siendo literalmente cierto (§5 de mi dictamen anterior)—. **No.** Reutilizar la misma frase con un sentido más estrecho del que tenía cuando se publicó y se mandó por correo es «matizar el literal para que siga pasando el test», y es lo que un tercero enseñaría. **La frase se va; la promesa se reconstruye.**

**Qué se sigue pudiendo prometer en `/robot`, y es mucho más de lo que parece — y más auditable que lo que se retira:**

1. **No hay redistribución en bloque.** Ni fichero de datos, ni volcado, ni feed, ni API, ni widget, ni exportación. **Éste era el núcleo verdadero de «non republicamos», y sobrevive entero** (C6).
2. **No hay histórico.** Se sirve la jornada viva; no hay archivo navegable y nada se acumula en público (C3).
3. **Sólo dos competiciones, sólo las jornadas declaradas, y fuera de ellas la pantalla no enseña marcador** (C1, C2). **Con el número.**
4. **Sólo cuatro cosas por partido:** equipos y hora, estado y marcador, cualificador, y la edad del último dato. **Ni clasificación, ni goleadores, ni alineaciones, ni árbitros, ni entrenadores, ni minuto a minuto, ni estadísticas** (C5). Es una promesa **más fuerte y más comprobable** que la que se retira: cualquiera puede abrir la pantalla y verificarla en diez segundos.
5. **Ni un dato personal.** Ni de jugadores, ni de árbitros, ni de entrenadores, ni de corresponsales u operadores (§5 de mi dictamen anterior).
6. **Cero monetización** (C7).
7. **La promesa de parar, y ahora extendida.** *«Abonda con pedilo: non fai falta alegar nada»* dejaba de cubrir sólo el rastreo. **Tiene que cubrir también la publicación**, y ésta es la adición más importante de todo el cambio en `/robot`: la publicación no puede prometer menos que la captura.
8. **La retención no se mueve** (C12): 30 días, una prórroga escrita, techo de 90.

### 6.3 ¿Hay que decir en `/robot` de dónde sale el dato? **Reviso mi R2: se mantiene, con un añadido obligatorio**

Mi R2 recomendaba no citar la fuente y dejaba abierto *«si el gate decide que sí se nombra, se nombra en `/robot`»*. Esa opción está ahora viva y me toca decidirla.

**A favor de nombrarla:** la página es pública y un lector que ve un marcador de competiciones de la RFGF en un sitio que no es la RFGF tiene una pregunta legítima. No contestarla arriesga la peor lectura disponible: **que esto sea un marcador oficial o avalado** — territorio de D-1, y con la federación decidiendo esta semana.

**En contra:** es la **primera divulgación pública** de que leemos `ceroacero.es`, en la forma más adversa —escrita, fechada, propia, junto a una página que republica—. **No compra cobertura ninguna**: el *sui generis* (arts. 133-137 TRLPI) es patrimonial y **no lleva derecho de paternidad**; el art. 32 TRLPI (cita) exige fuente pero se aplica a fragmentos de **obra**, y un marcador no es obra. Cero beneficio jurídico, prueba entregada.

**Resolución, y creo que enhebra la aguja:** la pregunta legítima del lector es **«¿esto es oficial?»**, no **«¿qué agregador?»**. La primera **hay que contestarla, y de forma destacada, en la pantalla y en `/robot`: esto NO es oficial, no es de la RFGF y no viene de `futgal.es`.** Esa es la **adición vinculante nueva**, y la causa (B): con una pantalla de operador nadie podía confundirla con un marcador oficial; en público, la confusión es el fallo por defecto. La segunda pregunta no hay que contestarla y no se contesta.

**Y el silencio se declara, que es lo que lo hace defendible.** Una línea en `/robot`: *no nombramos los sitios que leemos; si crees que leemos el tuyo, escribe y paramos.* Ya existe en espíritu (*«Hai fontes que hoxe non lemos precisamente por iso»*). **`/robot` sigue describiendo el método entero** —ritmo, robots.txt, retención, buzón— y retiene sólo la **identidad**, diciendo que la retiene. Eso es una postura; ocultarlo sin decirlo no lo sería.

**Marco esto como el punto que más me esperaría que una revisión profesional reabra:** «publicar y no decir de dónde» es sólido en términos probatorios e incómodo en términos de transparencia. El desempate, hoy, es que no existe deber de atribución y que el resto de `/robot` sigue siendo íntegramente comprobable.

---

## §7. La fecha: **2026-09-08 se mantiene. Vinculante**

Se mantiene, pero **cambia de función**. Bajo (A) era una razón para no publicar. Bajo (B) es una condición de **secuencia**: no poner la pantalla delante de la federación en la misma semana en que le pedimos algo diciéndole que no publicamos nada. La formulación exacta es:

> **No antes del 2026-09-08, y no antes de que la RFGF haya sido avisada — lo que ocurra más tarde de los dos.**

**Y una ordenación operativa que conviene escribir:** la verificación de `lapreferente.com` es el **2026-09-06** (`calendario-de-compromisos.md`, fila 1). Cae **antes** del 08 y **decide el texto del aviso de C14**. Si `lapreferente.com` sirve, el aviso nace falso el primer día. **El 06 se comprueba, el 07 se ajusta el aviso y el número derivado, el 08 se despliega.** En ese orden.

### Las tres ramas

**Contestan que sí** (añaden las dos líneas): `futgal.es` pasa a ser capturable, entra como adaptador y peso en la configuración (`src/ingest/sources.ts` está escrito para eso), la segunda vía de RN-02 reabre y con peso 1.0 hay *confirmado* por peso solo. **Nada de esto bloquea la publicación**, pero **dispara el punto 8**: el aviso de C14 se vuelve falso, C14 se pone rojo por derivación de `DEFAULT_SOURCES`, y **el aviso y `/robot` se corrigen en el mismo cambio que la fuente nueva**. Y ADR-008 §1 necesita un ADR que lo supersede.

**Contestan que no.** Hay que distinguir dos cosas que llegarán mezcladas en un párrafo de prosa, y alguien tendrá que clasificarlas. **Regla de clasificación, y es dictamen:**
- **«No, no nos rastree»** → **no detiene la publicación.** No los rastreamos hoy y seguiríamos sin hacerlo; nada cambia. Y no son titulares del *sui generis* de la base que sí leemos —esa es de ZOS, Lda.—; sobre su propio calendario, *Fixtures Marketing* (C-46/02 y acumuladas) sugiere que tendrían un *sui generis* débil o inexistente, porque la inversión en **crear** los datos no cuenta.
- **Cualquier frase sobre la publicación misma** —«no muestren nuestras competiciones», «no usen nuestro nombre», «no autorizamos esto»— → **dispara la cláusula permanente: se para primero y se dictamina después.** Parar es vaciar `MEASUREMENT_WINDOWS` (§2.1).
- **En la duda, se para.** Es lo que `/robot` promete al rastreo, y la publicación no puede prometer menos.

**No contestan** (lo previsto en `docs/roadmap.md`): vence el plazo, no se insiste, se publica.

**Y aquí hay un choque que hay que resolver antes de que alguien lo resuelva mal.** `calendario-de-compromisos.md` fila 3 dice que **no se manda ningún segundo correo** mientras Alberto Fojo no se pronuncie. C10 exige avisar a la RFGF de la publicación. **No son lo mismo, y la distinción importa:** el correo prohibido por defecto es un **recordatorio** —insistir en una petición no contestada—. El aviso de C10 **no es una petición y no es una insistencia**: es la corrección de una afirmación que les hicimos por escrito, y se les debe conteste o no conteste. **Enviarlo no es insistir.** Pero tiene que estar escrito como lo que es: **sin ninguna petición nueva, sin repetir la anterior y sin plazo**. Si pide algo, se convierte en el segundo correo que la regla por defecto prohíbe.

---

## §8. Resumen

### Dictamen vinculante

| # | Dictamen |
|---|---|
| W1 | **Ningún dictamen anterior queda revocado.** El gate eligió **(B)**, una de las dos salidas que mi V1 enumeró, y su condicionado pasa a ser el operativo. **V2..V8 y V10 intactos**; **V9 modificado por mí** (§3); **mi §4 rectificado por mí** en `decided_at` → `last_observed_at` (§5.a) |
| W2 | **Las trece condiciones se mantienen las trece. Cambian de forma tres (6, 9, 13), se parte una en tres repartos (10) y se añaden cinco (14-18).** El reparto (a)/(b)/(c) del §1 es vinculante: **la spec no puede colocar en (a) lo que es (c)** |
| W3 | **La publicación necesita ADR propio con firma del gate**, que **supersede parcialmente ADR-027 §3.a y §3.4** (ADR-027 es inmutable: no se edita) y que recoja las dieciocho condiciones y el disparador de **ocho** puntos |
| W4 | **`noindex` se mantiene, por cabecera y por meta. `nofollow` se retira** (trabaja contra `/robot`) **y se añade `noarchive`.** Se mantiene escrito que `noindex` no es defensa jurídica |
| W5 | **`src/site/robots-txt.ts` no se toca.** Un `Disallow` **derrotaría** al `noindex`: sin rastreo el buscador nunca lee la directiva y la URL puede indexarse desnuda |
| W6 | **La pantalla se enlaza desde `/proxecto` y `/robot`, en las dos lenguas, y ella enlaza `/robot`.** Es lo que convierte `noindex` en no-amplificación en vez de en ocultación. **Y deja de ser disparador**, que hoy lo es |
| W7 | **El punto 7 del disparador se sustituye**: cargas de documento y `Referer` externo desde los logs que la plataforma ya produce; **cero mecanismo en la página**; y lo no vigilable se declara. **Vercel Web Analytics, prohibido** |
| W8 | **Art. 10 LSSI no aplica hoy**: el disparador es la actividad económica, no la publicidad de la página. **Sub-condición nueva: ninguna llamada a la acción en la pantalla.** El día del primer euro, ADR-012 §1 cede y hace falta ADR nuevo + **revisión profesional antes de monetizar** |
| W9 | **`last_observed_at`, no `decided_at`**, publicado como **edad en minutos** y sin instante absoluto con precisión de segundo. No revela el ritmo de un tercero: revela el nuestro, que ya está publicado |
| W10 | **«Una sola fuente automática» se puede decir sin nombrarla**, y el número se **deriva de `DEFAULT_SOURCES`**, no se teclea. Prohibidos en el aviso: nombre, dominio, peso, **tipo**, cadencia atribuida y comparación con la oficial |
| W11 | **`noRepublish` y `noProduct` se corrigen en el mismo cambio, por ADR-015 en el ledger, sin matizar la frase.** `site.measuring`, que ya es falsa, entra en la misma enmienda |
| W12 | **La fuente no se nombra, ni en la pantalla ni en `/robot`; y se añade, destacado en las dos, que esto NO es oficial ni de la RFGF.** El silencio sobre la identidad se declara en una línea |
| W13 | **No antes del 2026-09-08, y no antes de haber avisado a la RFGF — lo que ocurra más tarde.** Con la regla de clasificación de la respuesta del §7 |

### Recomendación

| # | Recomendación |
|---|---|
| R1 | **Que el refresco devuelva fragmento HTML, no JSON.** Entonces C6 es literalmente cierta y no hay que sostener que un endpoint alcanzable con `curl` «no es una superficie programática» |
| R2 | **La línea de privacidad dentro de `/robot`**, no en una página nueva: un solo lugar honesto, una superficie menos que auditar |
| R3 | **El buzón `ola@tremen.dev` en el pie de la pantalla**, no sólo a un clic. Una línea no rompe D-8 y ahorra el clic a quien viene a quejarse |
| R4 | **La comprobación de reserva TDM, como análisis estático del raw store**, no como petición nueva: RN-10 ya archiva la respuesta entera, cabeceras incluidas. Cero superficie, cero peticiones |
| R5 | **Escribir en el runbook que parar es vaciar `MEASUREMENT_WINDOWS`**, con esas palabras. El botón ya existe (CA-3.2) y nadie lo sabrá el día que haga falta |

### Requiere revisión profesional

- Si dos jornadas de publicación sobre dos competiciones caen o no del lado del **art. 7.5** frente a ZOS, Lda. — mi criterio es que sí, y sigue siendo el juicio de valor central. **La firma del gate lo asume; mi dictamen no lo cierra.**
- **Antes de cualquier monetización**: art. 10 LSSI + colisión con ADR-012 §1, y el apartado sancionador exacto (arts. 38-39).
- Cualquier feed, widget o API B2B: eso es licencia o acuerdo, no dictamen.
- La ponderación formal del interés legítimo (art. 6.1.f RGPD) y el registro de actividades (art. 30), que ADR-009 dejó abierto y que una pantalla pública acerca.

### Residuales que el gate firma con los ojos abiertos

1. **El archivo de terceros sobrevive a todo.** Una página pública será archivada; `noarchive` no es exigible frente al Internet Archive. La defensa «acotada en el tiempo» es sobre nuestra publicación, no sobre la copia de otro. Lo único que la mitiga es que lo archivable sea mínimo (C3, C5).
2. **El JSON del refresco, si se queda en JSON, lo lee cualquiera** con las herramientas del navegador.
3. **Nadie sabrá cuánta gente lo abre**, y ésa es la contrapartida de C17.
4. **Cinco de las dieciocho condiciones no las vigila ningún test, y no hay CI.** Van a `docs/procedimientos/calendario-de-compromisos.md` por el mismo motivo por el que ese fichero existe: **nadie se va a enterar en rojo.**

**Fuentes normativas citadas:** Directiva 96/9/CE arts. 7.1, 7.2.a/b, 7.5 · TRLPI (RDLeg 1/1996) arts. 10, 14.3, 32, 129 bis, 133-137 · Directiva (UE) 2019/790 art. 4 (transp. RDL 24/2021) · RGPD arts. 4.1, 4.5, 5.1.c, 6.1.f, 13, 15-22, 30, Cdo. 26 · LSSI-CE (Ley 34/2002) arts. 1, 10, 20, 22.2, 38-40 y Anexo a) · Ley 17/2001 de Marcas arts. 34, 37 · Ley 3/1991 de Competencia Desleal art. 5 · TJUE: C-203/02 *BHB/William Hill*, C-46/02 y acumuladas *Fixtures Marketing*, C-202/12 *Innoweb*, C-762/19 *CV-Online Latvia*.

**Fuentes web consultadas hoy (2026-09-04):** `https://www.ceroacero.es/robots.txt` · `https://www.ceroacero.es/.well-known/tdmrep.json` (403) · BOE — Ley 34/2002 consolidada · Régimen sancionador LSSI (Mineco).

---

# Dictamen `sdd-legal-datos` (TERCERO) — la línea de privacidad de `/robot` (F-SPEC-018-V4)

> Emitido el **2026-09-04**, tras el **RED** del verificador, a petición de
> `sdd-arquitecto`. Tercer dictamen del mismo rol sobre SPEC-018. Se copia
> literal. No escribió ningún fichero.
>
> **Nota del arquitecto:** su **PR3** activa un disparador que **ADR-012 escribió
> él mismo** —«el día que `/sdd-legal-datos` lo pida»— y que **no es de este
> repositorio**: publicar la identificación del responsable en `tremen.dev`. Va al
> informe del gate, no a un CA. Y su **§2.5** corrige una fila del calendario de
> compromisos que yo mismo escribí ayer.

**Emitido: 2026-09-04.** Rol consultivo. **No soy abogado y esto no es asesoramiento profesional**; marco al final qué necesita revisión profesional.

## Comprobaciones hechas hoy (2026-09-04), porque un dictamen legal sin fecha no vale

| Recurso | Resultado |
|---|---|
| `https://vercel.com/docs/logs/runtime` (tabla «Limits», `last_updated: 2026-08-28`) | **Retención de runtime logs por plan: Hobby 1 hora · Pro 1 día · Pro con Observability Plus 30 días · Enterprise 3 días.** El encabezado dice *«Runtime logs are **stored** with the following observability limits»*: es retención, no solo ventana de consulta |
| `https://vercel.com/legal/dpa` | §13.1: *«Vercel's primary processing facilities are in the United States»*. §13.3 + Schedule 3: SCCs y UK IDTA. §7.2: subencargados. **No fija un plazo propio y separado para log data** |
| DPF (Data Privacy Framework) | **Vercel, Inc. está certificada** en el EU-U.S. DPF (y extensión UK / Swiss-U.S.). La transferencia a EE. UU. está cubierta por **decisión de adecuación** (Decisión de Ejecución (UE) 2023/1795), no solo por SCCs |
| Plan del proyecto | **Vercel Pro** (ADR-004). `vercel.json` sólo declara `crons`; **no hay log drain ni Observability Plus en el repositorio**, y `@vercel/analytics` no está en `package.json` ⇒ el plazo por defecto aplicable es **1 día** |
| Que Vercel es el encargado y que es **observable desde fuera** | Las respuestas de `https://marcador.gal` llevan `x-vercel-id`, `x-vercel-cache`, `x-nextjs-prerender`. **Cualquiera lo ve con un `curl -I`** |

## §1. ¿Hay que nombrar a Vercel? **Sí. Dictamen: se nombra**

**1.1 ¿Un encargado es «destinatario» a efectos del art. 13.1.e? Sí, sin discusión.** El art. 4.9 RGPD define destinatario como «la persona física o jurídica… **al que se comuniquen datos personales, se trate o no de un tercero**». Esa cláusula está puesta exactamente para esto: el encargado no es tercero (art. 4.10) y aun así es destinatario. Criterio pacífico de la AEPD y del EDPB (WP260 rev.01).

**1.2 ¿Basta la categoría? Literalmente sí; aquí no**, por tres razones que se acumulan:

1. **No es una categoría: es una perífrasis de un nombre.** Una categoría agrupa. Aquí hay **un solo encargado y un solo servicio**. WP260 pide ser lo más específico posible; un conjunto de un elemento descrito por su función es el nombre con más palabras y menos información.
2. **No es comprobable, y en este proyecto ése es el defecto de fondo.** Todo el andamio de `marcador.gal` vale **porque es verificable y cierto**. «O servidor onde está aloxado» no se audita; «Vercel» se audita con `curl -I` en un segundo.
3. **La ubicación hay que darla igualmente** (art. 13.1.f). «Un proveedor, no te digo cuál, en Estados Unidos» es peor lectura que el nombre.

**1.3 ¿Lo alcanza ADR-012 §1? No.** Ese ADR prohíbe nombrar **persona física**, declarar **cuántas** hay y bajo **qué forma jurídica** — las tres sobre **el titular del proyecto**. Vercel, Inc. es persona jurídica y **un tercero proveedor**. Confirmación mecánica: `tests/site/identity.test.ts` tiene `NO_PERSON = ['alberto','fojo']` y `NO_HEADCOUNT`; ni una entrada alcanza el nombre de una empresa.

**1.4 ¿Crea exposición nueva? No**, y la asimetría con mi **R2** (no nombrar la fuente rastreada) es real y conviene dejarla escrita:

| | Fuente rastreada (R2 / W12) | Plataforma de alojamiento |
|---|---|---|
| ¿Es ya público? | **No.** Nombrarla sería primera divulgación | **Sí.** Viaja en las cabeceras HTTP |
| ¿Qué prueba entrega? | Admisión escrita de reutilización sistemática (art. 7.5) | **Ninguna** |
| ¿Deber legal de decirlo? | **No** | **Sí**, art. 13.1.e |
| ¿A quién describe? | A un tercero y a nuestra relación con él | A nosotros |

El único riesgo real es de **veracidad futura**: al migrar de plataforma el literal miente.

## §2. El plazo de conservación de los logs

**2.1 Qué obliga el RGPD.** Art. 5.1.e (limitación del plazo); **art. 13.2.a** («el plazo… o, cuando no sea posible, **los criterios**»), con WP260 diciendo que «el tiempo necesario» es **insuficiente**; arts. 28.3.a y 28.3.g: el encargado sigue instrucciones documentadas, así que **«no lo controlo» no es eximente** — elegir plataforma y plan **es** una decisión del responsable.

**2.2 Retención real en Vercel Pro: 1 día** (tabla de límites, consultada hoy). Tres honestidades que conservar: (i) es el registro de acceso **de la plataforma**, y su DPA no publica plazo separado para log data; (ii) **el proyecto no guarda nada de quien visita ni exporta copia** —no hay log drain, ni analítica, ni cookies, ni base de visitantes—, que es la afirmación más fuerte y más verificable disponible; (iii) **alguien con acceso al panel tiene que confirmar el plan antes del 08**.

**2.3 ¿Vale «el plazo que fija el proveedor»? No, sola.** Comparte el fallo exacto con la fórmula circular: el lector no puede estimar nada. **La forma correcta es atribución + número.**

**2.4 Si no se pudiera confirmar (P4):** se publica la verdad más corta que sí lo esté, con su fecha, y nunca una fórmula circular. **Lo que nunca es admisible es una frase que aparente contestar.**

**2.5 Hallazgo colateral: mi propio W7 se apoya en unos logs que duran 1 día.** Propuse «al día siguiente de cada jornada» y llega **tarde**. Salidas: **(i) mirar el mismo día, al cerrar la jornada** —coste cero, es la buena—; (ii) contratar Observability Plus, **desaconsejada**: multiplica por treinta la retención de datos personales para vigilar un umbral, peor minimización (art. 5.1.c), y cambia el plazo publicado a 30 días justo al lado de los 30 del raw store; (iii) declarar no observable la mitad numérica.

## §3. Los seis elementos, cerrados — y son siete

| # | Elemento | Contenido exigido | Rango | ¿Test? |
|---|---|---|---|---|
| **E1** | Cero cookies, almacenamiento, analítica y terceros | En las páginas de este sitio | Vinculante | Sí — ya existe |
| **E2** | Qué se registra | IP, hora, página pedida **y además navegador (user-agent) y referente** — **hoy el literal se queda corto** | Vinculante (art. 5.1.a) | Sí |
| **E3** | Quién lo procesa | **Vercel, nombrado**, con su función, sin arrastrar a una persona | Vinculante (art. 13.1.e) | Sí — `toContain('vercel')` |
| **E4** | Base jurídica **y el interés concreto** | Interés legítimo + mantener el servicio en pie y seguro (art. 13.1.d) | Vinculante | Sí — parcial hoy |
| **E5** | Cuánto se conserva | (i) el proyecto no guarda nada ni exporta copia; (ii) lo conserva la plataforma, **hoy un día**, con atribución | Vinculante (art. 13.2.a) | Sí — **no existe hoy**, con control negativo de la fórmula circular |
| **E6** | Derechos | Acceso, rectificación, supresión, **limitación** y oposición, por el buzón. **Portabilidad no aplica** (art. 20) y no se nombra | Vinculante | Sí — parcial |
| **E7** | **Reclamar ante la AEPD** | Art. 13.2.d, **no está y nadie lo vio** | Vinculante | Sí — no existe |
| **E8** | Transferencia fuera de la UE | Plataforma estadounidense, amparada por **decisión de adecuación** (EU-US DPF) | Vinculante si se nombra a Vercel (art. 13.1.f) | Sí |
| **E9** | Alcanzable en un clic | Ya cumplido | Vinculante | Sí — ya existe |
| **E10** | Que lo que dice sea verdad | Plan confirmado, sin log drain, sin analítica añadida | Vinculante, **(c)** | **No** |

**Nota de proporción, que también es dictamen:** son diez filas pero **no son diez frases**. El objeto es **una línea de privacidad alcanzable, no un aviso legal**. Si crece a una página, se ha implementado otra cosa.

**Advertencia obligatoria por ADR-016 §6:** todas estas aserciones prueban que **unas palabras están escritas**, no que sean ciertas. Que el plazo sea de verdad un día, que no haya log drain y que el plan sea Pro **no lo alcanza ningún test**. Es E10.

## §4. Lo que falta y no estaba en mis seis elementos

**4.1 Autoridad de control — el hueco más claro de todos.** Art. 13.2.d. No está, no estaba en mi C18 y no lo pilló el verificador. **Mi C18 enumeró seis elementos y eran siete.**

**4.2 Responsable del tratamiento.** El art. 13.1.a exige identidad y contacto — **no NIF, ni domicilio, ni forma jurídica**. **P6:** la línea dice **quién responde y por dónde** —el proyecto bajo el paraguas de `tremen.dev`, contacto en el buzón—, sin nombre, sin número y sin forma jurídica, **también por omisión** (nada de «la empresa que lleva el sitio»). **Y no fingimos que eso cierra el art. 13.1.a**: residual que el gate firma con los ojos abiertos. **PR3:** ADR-012 escribió su propio disparador —«el día que `/sdd-legal-datos` lo pida»—; **ese día es hoy y lo pido**: publicar la identificación en `tremen.dev`, que es **otro sitio**, cierra el art. 13.1.a sin tocar un literal de este repositorio. **No bloquea el 08.**

**4.3 Transferencias internacionales — sí, y la noticia es buena.** Vercel está certificada en el **EU-U.S. DPF**: decisión de adecuación, no cláusulas que explicar. **Residual honesto:** la adecuación **está recurrida** ante el TJUE.

**4.4 ¿Precisar más la base? No en la página.** «Interés legítimo» + el interés concreto es lo que piden los arts. 13.1.c y 13.1.d. **Citar «art. 6.1.f» empeoraría el texto** (WP260, lenguaje llano). Lo que falta y **no va en la página**: la ponderación (art. 6.1.f, Cdo. 47) y el registro de actividades (art. 30) — **PR4**, tres párrafos en el runbook.

## §5. Qué NO debe decir — lista cerrada

1. **Ninguna persona física, ningún número de personas, ninguna forma jurídica** — tampoco por implicatura («o meu provedor», «a empresa que contratei»).
2. **Ninguna primera persona del singular.**
3. **No se llama «política de privacidad» ni «aviso legal».** El encabezado actual es correcto y se queda.
4. **Ni banner, ni botón de aceptar, ni cookie de preferencia, ni `localStorage`.** Un aviso de privacidad que escribe estado es la ironía completa.
5. **No se reutilizan los plazos del raw store.** Los 30/90 son de ADR-009 y ADR-020, de **otra cosa**. Ponerlos aquí sería **falso**.
6. **No se dice que borramos los logs ni que los borramos si nos lo pides.** No los tenemos y no hay mecanismo. **Un mecanismo que no existe no se promete.**
7. **No se dice «no recogemos datos personales» ni «los datos son anónimos».** La IP lo es (*Breyer*, C-582/14).
8. **No se nombra ninguna fuente rastreada.** Están a cuatro claves en el mismo fichero: el riesgo es real.
9. **Ningún enlace saliente nuevo** — ni a `vercel.com`, ni a su DPA, ni a la AEPD.
10. **No se cita articulado.**
11. **Ninguna llamada a la acción.**
12. **No se crea una página nueva.** R2 se mantiene: dentro de `/robot`.

## §6. Resumen

| # | Dictamen vinculante |
|---|---|
| **P1** | **Se nombra a Vercel.** Encargado = destinatario (arts. 4.9 + 13.1.e); la perífrasis no es categoría y **no es auditable** |
| **P2** | Nombrarlo **no puede arrastrar a una persona por implicatura**. ADR-012 §1 entero |
| **P3** | **El cambio de plataforma es disparador escrito**: obliga a corregir la línea en el mismo cambio. Es **(c)** |
| **P4** | **El plazo se da con número.** «El plazo que fija el proveedor», sola, es el mismo defecto circular. **Atribución + número**: hoy **un día** (Vercel Pro) |
| **P5** | **Falta el derecho a reclamar ante la AEPD** (art. 13.2.d). Mi C18 enumeró seis y eran siete |
| **P6** | **La línea dice quién responde y por dónde**, sin nombre, número ni forma jurídica. **Y se declara que no cierra del todo el art. 13.1.a** |
| **P7** | **Se dice que la plataforma es estadounidense y que la transferencia está amparada** (EU-US DPF) |
| **P8** | **Tercer defecto que el verificador no enumeró:** el literal se queda corto en «qué se registra» — faltan **navegador** y **referente** |
| **P9** | **Los dos plazos de la página son cosas distintas.** Reutilizar los 30/90 aquí sería falso |
| **P10** | Las listas de §3 y §5 son **cerradas**. **E10 es (c)** y hay que declararlo dentro del criterio (ADR-016 §6) |

| # | Recomendación |
|---|---|
| **PR1** | **Proveedor y plazo se interpolan desde una sola constante**, como `{mailbox}`. Es la forma de W10 y convierte P3 en un cambio de una línea |
| **PR2** | **La fila del calendario pasa de «al día siguiente» a «el mismo día, al cerrar la jornada»**. **No contratar Observability Plus** |
| **PR3** | **Publicar la identificación del responsable en `tremen.dev`.** Es el disparador que ADR-012 escribió, y hoy lo pido. **No bloquea el 08** |
| **PR4** | **Ponderación del interés legítimo y registro de actividades en el runbook**, no en la página |
| **PR5** | **Cuatro oraciones, no una página.** |

**Requiere revisión profesional:** la identificación del responsable (art. 13.1.a) con ADR-012 §1 vigente —P6 es un mínimo defendible, **no una respuesta completa**—; la ponderación del art. 6.1.f y el registro del art. 30; y la validez futura de la adecuación DPF, hoy recurrida.

**Fuentes normativas:** RGPD arts. 4.1, 4.9, 4.10, 5.1.a, 5.1.c, 5.1.e, 6.1.f, 13.1.a/c/d/e/f, 13.2.a, 13.2.d, 15-18, 20, 28.3.a/g, 30, Cdos. 26, 39, 47 · Decisión de Ejecución (UE) 2023/1795 · WP260 rev.01 · LSSI arts. 10, 22.2 · Ley 3/1991 art. 5 · Ley 17/2001 art. 37 · TJUE C-582/14 *Breyer*.

**Fuentes web consultadas hoy:** Vercel — Runtime Logs (tabla de límites) · Vercel — DPA · Vercel — certificación EU-US DPF · Vercel — 30-day runtime log retention · AEPD — cláusulas para contratos de encargado.

---

# Dictamen `sdd-lingua` (TERCERO) — la línea de privacidad de `/robot` (F-SPEC-018-V4)

> Emitido el **2026-09-04**, tras el RED, a petición de `sdd-arquitecto`. Se copia
> literal. No escribió ni editó ningún fichero.
>
> **Nota del arquitecto:** su **§9** es un hallazgo colateral serio y ajeno a esta
> línea —`bot.noticeLink` promete una página que no existe—; tiene destino y
> disparador en el ledger de SPEC-018. Y su **L11** pide nueve términos en
> `dominio.md`: **escritos**, en el mismo cambio.

**Emitido:** 2026-09-04. **Rol:** consultivo.

> **Aviso previo.** Estoy de acuerdo con el diagnóstico del verificador y quiero precisarlo: el defecto no es que falten dos datos, es que **la frase está construida de una forma que hace que faltar no se note**. «El servidor donde está alojado» y «se conserva el tiempo que ese registro dura» son las dos mitades de la misma técnica: **sujeto elidido y plazo autorreferente**. Eso sí es materia mía, porque **la forma es lo que disfraza**. Lo arreglo abajo con una regla estructural —**una afirmación, una clave**— que hace el disfraz imposible de repetir.

## 1. Registro y tono

**1.1 Vinculante: el tuteo se mantiene, sin excepción.** SPEC-015 §1 ya lo fijó y su argumento era que *vostede* concuerda en 3.ª persona y produce la mezcla; un texto en *vostede* dentro de una página que tutea arriba (`contact`) y abajo (`stop`) **crea esa mezcla en la misma pantalla**. Además la clave que se corrige **ya tutea** («ou opoñerte»). Y la razón de fondo: `/robot` existe para que un tercero audite sin preguntar, y **lo que lo hace creíble es que no parece una nota legal pegada**.

**1.2 Vinculante: el registro lo fija el sujeto de cada frase, no la persona verbal.**

| Voz | Cuándo |
|---|---|
| **Tuteo** | Sólo donde **actúa quien lee** |
| **Impersonal / pasiva refleja** | Los **hechos del sistema** |
| **Plural institucional (`nós`)** | Sólo donde **el proyecto es el actor real** |
| **1.ª del singular** | **Nunca** |

**Y de aquí sale el corazón del apartado: en la línea de privacidad el `nós` está prohibido salvo en el buzón.** No por estilo: **porque sería falso y porque confunde**. El registro del servidor **no lo hace marcador.gal**, lo hace el proveedor; y *«gardamos o teu enderezo IP»* **choca de frente con `crawler.storage`**, que empieza literalmente con «Gardamos…» y habla de otra cosa y de otro plazo. **El `nós` es el mecanismo que fundiría los dos bloques.**

**1.3 Corolario vinculante:** *«Non hai cookies…»* se queda **impersonal**. No se «mejora» a *«Non usamos cookies»*: la forma impersonal **afirma más** —que no las hay, de nadie— y evita meter un `nós` donde el actor no somos nosotros.

**1.4 Recomendación: nada de léxico de formulario** —*o interesado*, *o usuario*, *a presente política*, *en cumprimento do disposto*—. Correctas en galego y **rompen D-8 y rompen `/robot`**.

## 2. Vocabulario RGPD en galego

| Concepto | **Galego** | Castellanismo | Lusismo | La trampa |
|---|---|---|---|---|
| responsable del tratamiento | **responsable do tratamento** | *del* | *responsável* | **`-ble`, no `-bel`**; plural **responsables** |
| encargado del tratamiento | **encargado do tratamento** | *tratamiento* | — | **`tratamento` es galego correcto** aunque se lea portugués. Hipercorrección real |
| interés legítimo | **interese lexítimo** | *interés*, *legítimo* | *interesse* | **`interese`** (masculino) y **`lexítimo` con `x`** |
| plazo de conservación | **prazo de conservación** | ***plazo*** | — | **`prazo` es correcto** y coincide con el portugués. **La hipercorrección es el error más probable del apartado** |
| derechos | **dereito de acceso, rectificación, supresión e oposición** | *derecho* | *direito* | **`dereito`**. El nombre del derecho es **supresión**, no *borrado* |
| oponerse | **opoñerse / opoñerte** | *oponerse* | *oporse* | RAG: **opoñer** |
| registro de acceso | **rexistro de acceso** | ***registro*** | — | **`rexistro` con `x`** |
| dirección IP | **enderezo IP** | ***dirección IP*** | *endereço* | **`enderezo`**, masculino. Castellanismo **invisible**: *dirección* existe en galego con otro sentido |
| proveedor de alojamiento | **provedor de aloxamento** | ***proveedor***, ***alojamiento*** | *fornecedor*, *hospedagem* | **`provedor`, una sola `e`**; **`aloxamento`**, no *hospedaxe* (que es para personas) |
| transferencia internacional | **transferencia internacional de datos** | — | ***dados*** | **`datos`, nunca `dados`**: en galego son los de jugar. **El lusismo que más caro sale porque se lee bien** |

Y tres más del mismo párrafo, ya bien escritas en el bundle: **`servizo`**, **`terceiros`**, **`compoñente`**. **`cookies`** se queda invariable y **sin artículo** —escribir *«as cookies»* obliga a decidir un género que la norma no ha fijado, y la construcción actual lo esquiva—. **No lo deshagas.**

## 3. Cómo se dice un plazo sin sonar circular

El defecto es **una tautología**: el predicado repite el sujeto. **Regla vinculante: un plazo se dice con tres piezas —cuánto, desde cuándo y qué pasa al final— y si falta la primera se dice el criterio, nunca el hecho de no saberlo.** El molde ya existe: `crawler.storage` lo hace bien.

- **(a) Número.** `Ese rexistro consérvase {retention}, e despois elimínase.` / `Ese registro se conserva {retention}, y después se borra.`
- **(b) Atribución.** `Ese rexistro gárdao {provider} durante o prazo que fixa na súa propia política —{retention}—, e non o decide marcador.gal.` **Sólo admisible con el número dentro**; sin él es **la misma circularidad con otro sujeto**.
- **(c) Criterio.** `Ese rexistro consérvase só o tempo que fai falta para manter o servizo en pé, e non se usa para nada máis.`

**«No lo sabemos todavía» no se publica.** Mismo motivo por el que impedí que `errServiceDown` prometiera lo que el sistema no hace y que la pantalla dijera «en directo»: **un literal que declara ignorancia sobre el propio sistema invita a la pregunta que la página existe para evitar.**

**Cuál se lee mejor: (a), sin dudarlo.** Un número es lo único comprobable y lo único que no envejece mal, y **rima con el bloque de al lado**. (b) es aceptable con número y **nace con fecha de caducidad, porque depende de la política de un tercero y nadie se enterará en rojo** → material de `calendario-de-compromisos.md`. (c) es el suelo, y **no se combina con (a) ni con (b)**.

## 4. Cómo se nombra al proveedor sin romper ADR-012 §1

**4.1** La barrera es mecánica: `NO_PERSON = ['alberto','fojo']` y `NO_HEADCOUNT`. **Nombrar a Vercel no dispara nada de eso.**

**4.2 Vinculante, cuatro reglas:**

1. **El proveedor es el sujeto de su propia frase, no el complemento de un posesivo.** **Prohibidas por implicatura:** *«o meu provedor»*, *«a empresa que contratei»*, *«onde teño aloxado o sitio»*, *«quen me alberga»* — las cuatro llevan 1.ª del singular y **ya son RED**. **Desaconsejado** *«o noso provedor»*.
2. **Nada de escala, precio ni geografía** —*«un provedor pequeno»*, *«unha conta gratuíta»*, *«un plan básico»*—. Ninguna dispara la lista negra y **todas filtran cuánta gente hay detrás por implicatura**, que es lo que ADR-012 §1 protege. **Ésta es la puerta trasera real, no el nombre de la empresa.**
3. **El nombre se escribe como lo escribe la empresa, en las dos lenguas.** No se traduce, no se acentúa, no se galeguiza.
4. **Sólo si es persona jurídica.** Si `{provider}` resolviera a un nombre y apellidos, **nombrarlo sería nombrar a una persona física**.

**4.3 Fórmula recomendada:** `O sitio está aloxado en {provider}, que é quen garda ese rexistro por conta de marcador.gal.` **Trampa fina:** *por conta de {provider}* está bien; ***«por conta propia» está en `NO_HEADCOUNT`*** y pondría el test en rojo. Son dos palabras de distancia.

Y hace algo más, que es media respuesta al verificador: **al poner al proveedor como sujeto, la frase deja de poder omitirlo.** La redacción actual tiene el sujeto elidido *y por eso* podía no nombrarlo sin que se notara. Con esta forma, quitar `{provider}` deja la frase **agramatical**.

## 5. Literal completo

**5.1 Vinculante: una afirmación, una clave.** `privacy` no puede seguir siendo **una cadena con seis afirmaciones dentro**. Es la costumbre de `SiteBundle`, es lo que ya hace el bot con `notice*` (ocho claves), y **es la causa raíz del RED**: con seis afirmaciones en una cadena, que falten dos **no se ve ni en el diff ni en un test**. `CrawlerBundle` es contrato de SPEC-018, que está viva: **cambiarlo no es enmienda ADR-015, es su uso previsto.**

**5.3 Los marcadores van en inglés: `{provider}` y `{retention}`**, por la convención de identificadores y por `{mailbox}`. Un `{prazo}` dentro de `es.ts` sería la trampa de copia-pega que ya inventarié. **Y si `{retention}` es un número, `{retention} días` da «1 días»**: o el plazo se escribe con su unidad dentro del marcador, o hay dos claves. **No lo dejes al implementador.**

## 6. Trampas de norma nuevas

| Escribe | No escribas | Por qué |
|---|---|---|
| **prazo** | *plazo* | Castellanismo — **y ojo a la hipercorrección inversa** |
| **datos** | ***dados*** | Lusismo silencioso; el más caro |
| **tratamento** | *tratamiento* | Idéntico al portugués **y correcto** |
| **provedor** | *proveedor*, *fornecedor* | Una sola `e` |
| **aloxamento** | *hospedaxe*, *alojamento* | *Hospedaxe* es para personas |
| **enderezo** | *dirección* | Castellanismo invisible |
| **rexistro**, **lexítimo** | *registro*, *legítimo* | `x`, no `g` |
| **dereito** | *derecho*, *direito* | Los dos calcos del mismo término |
| **supresión** | *borrado*, *eliminación* | Como **nombre del derecho**, no |
| **consérvase**, **elimínase** | *se conserva* | Enclisis con tilde; proclisis **sólo** tras negación: *«non se recolle»* |
| **fai falta** | *hai falta* | ⚠ **Sobrecorrección de mi propio dictamen de SPEC-018 §7**: «hai, nunca fai» ataca **la expresión temporal**, no la perífrasis *facer falta*. `gl.ts` ya lo escribe bien tres veces |
| **u oposición** *(castellano)* | *o oposición* | `o` → `u` ante palabra que empieza por `o-`. **El único error probable del lado castellano** |
| **por conta de {provider}** | ***por conta propia*** | Correcto vs. **RED mecánico** |
| **cookies** sin artículo | *as cookies* | El género no está fijado |

**Concordancias que fallan solas:** **o** enderezo, **o** rexistro, **o** prazo, **o** interese, **o** servizo, **a** hora, **a** páxina, **a** base. *«Ese rexistro»*, nunca *«esa rexistro»*.

## 7. Coherencia con `crawler.storage`

**7.1 El riesgo:** los dos van a decir **un número de días** en la misma página separados por una cabecera. Si el plazo del registro fuera 30, **habría dos «30 días» a seis líneas hablando de cosas distintas**. Es la misma clase de defecto que separé entre *Sen sinal* y «non se puido actualizar».

**7.2 Vinculante: se separan por sujeto y por verbo.**

1. **Sujeto.** `storage` → `nós`. `privacy` → impersonal y `{provider}`. **El `nós` no cruza esa frontera en ninguna dirección.**
2. **Objeto nombrado.** `storage` dice **arquivo**/**resposta**; `privacy` dice **rexistro**. **Ninguna usa la palabra de la otra**, y eso es una **barrera léxica testable** con la forma de la de `sinal`/`actualizar`.
3. **Ancla temporal distinta.** `storage` cuenta desde el fin de la ventana; `privacy` **no tiene ancla**, y esa ausencia es lo que los distingue.

**7.3 Vinculante: la clave de desambiguación no es opcional.** Cita el otro bloque **por el texto de su cabecera**, no por su posición —*«o apartado seguinte»* depende de la maquetación—; distingue **por objeto**, no por plazo —si se distinguiera por los números envejecería—; y usa **`aquel`/`este`**, no *«o primeiro»/«o segundo»*.

**7.4 Recomendación:** `storageHeading` → *«Que gardamos do que lemos, e canto tempo»*, **dentro de la enmienda ADR-015 sobre SPEC-005 que CA-18.2 ya abre**. Si no, la frase de 7.3 hace el trabajo sola. **No lo abras por tu cuenta.**

## 8. Nueve términos a `dominio.md` antes de usarse

Con esta línea pasan a estar en **tres superficies** —`bot.notice*`, `/robot`, y la futura `/privacidade`—, que es **exactamente la configuración que produjo *Directo* / *En xogo*** (F-SPEC-015-9). **Vinculante, y es barato: una tabla.**

## 9. Hallazgo colateral, fuera de encargo

**`bot.noticeLink` promete una página que no existe.** `gl.ts:80` sirve *«Tes a información completa en https://marcador.gal/privacidade»* y `es.ts:73` su equivalente; `src/site/routes.ts` declara tres rutas y **`/privacidade` no está**. Es **la misma clase de defecto que el §6.1 de mi dictamen de SPEC-018** —un literal servido y verificado GREEN que afirma algo que no es cierto—, con el agravante de que aquí lo afirma **el aviso de protección de datos**. **Consecuencia vinculante sobre esta línea: el día que `/privacidade` exista, `/robot` la enlaza; no se duplica.**

## 10. Resumen

| # | Dictamen vinculante |
|---|---|
| **L1** | **Tuteo, sin excepción** |
| **L2** | **El registro lo fija el sujeto.** **`nós` prohibido en este bloque salvo en el buzón** — sería falso y fundiría `privacy` con `storage`. **1.ª del singular, nunca** |
| **L3** | ***«Non hai cookies»* se queda impersonal** |
| **L4** | **Una afirmación, una clave.** Es **la causa raíz del RED**, no una preferencia de estilo |
| **L5** | **Marcadores en inglés: `{provider}` y `{retention}`**, con el singular/plural resuelto |
| **L6** | **El proveedor es el sujeto de su frase.** Prohibidas escala, precio y geografía: **filtran headcount por implicatura** |
| **L7** | **El nombre se escribe como la empresa lo escribe**, y **sólo si es persona jurídica** |
| **L8** | **Cuánto + desde cuándo + qué pasa al final.** (b) sólo con número; **(c) nunca como ignorancia** |
| **L9** | **La clave de desambiguación es obligatoria**, cita por cabecera y distingue por objeto |
| **L10** | **Barrera léxica testable:** *arquivo* no aparece en `privacy*`; *rexistro* no aparece en `storage` |
| **L11** | **Nueve filas de vocabulario RGPD a `dominio.md` antes de usarse** |
| **L12** | **El día que exista `/privacidade`, `/robot` la enlaza y no la duplica** |

| # | Recomendación |
|---|---|
| **R1** | **(a), plazo concreto**, es la mejor: comprobable, no envejece y rima con el bloque de al lado |
| **R2** | **`storageHeading` → «Que gardamos do que lemos, e canto tempo»**, dentro de la enmienda que CA-18.2 ya abre |
| **R3** | **Nada de léxico de formulario** |
| **R4** | **Comprobar que `{provider}` no contenga `alberto` ni `fojo`** desacentuados, o `identity.test.ts` se pone rojo por un motivo que nadie adivinará |

**Lo que este rol NO decide:** quién es `{provider}` y cuál es `{retention}`; si el encargado se nombra o basta la categoría; si el responsable se declara como `marcador.gal` o como `tremen.dev`; y `/privacidade`.
