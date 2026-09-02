---
id: SPEC-015
tipo: ledger
epica: EPIC-002
---
# Ledger — SPEC-015 Bot de Telegram del corresponsal: el LLM propone dentro de una lista cerrada y la persona confirma

## Resumen
- Fase: **borrador**, esperando gate humano. La fuente de verdad es el
  frontmatter de la spec.
- Rama: `ft/EPIC-002-spec-bot-corresponsal` (worktree
  `.claude/worktrees/spec-015`).
- Trae **ADR-022** y **ADR-023**, los dos en `borrador`. La spec se apoya en
  ellos; si el gate cambia uno, cambia la spec.

## Dictámenes de dominio — anotados, con la regla dura cumplida

`sdd-lingua` y `sdd-legal-datos` dictaminaron sobre SPEC-015 el **2026-09-02**.
Los dos llevan la regla dura del rol consultivo: **el dictamen tiene que quedar
por escrito en la spec o en su ledger**. Está cumplida, y no con un resumen:

> **`docs/epicas/EPIC-002-instrumentacion-de-las-cuatro-cifras/dictamenes-SPEC-015.md`**
> — los dos informes **enteros y literales**, con sus fuentes y sus fechas de
> consulta.

**No se vuelven a pedir.** El único disparador para re-consultar está escrito en
ADR-023 (*Consecuencias*): que entre fútbol base —menores— en los partes de
corresponsal.

**Dónde aterrizó cada dictamen** (índice para el verificador, no sustituto del
texto):

| Punto del dictamen | Dónde vive ahora |
|---|---|
| legal §1 — clasificación por poder identificador | ADR-022 §3; SPEC-015 CA-3.1, CA-3.2 |
| legal §2 — RN-10 con update **redactado**, y por qué NO es lo que ADR-009 rechazó | ADR-022 §3 (párrafo entero, deliberadamente literal); CA-3.4 |
| legal §2 — el hueco de retención sin dueño | **ADR-023** completo; precondición, no follow-up (precedente ADR-008 §5.3) |
| legal §2 — la clave raw sin `competition_id` conocido | ADR-022 §3, resuelto con lista cerrada de tipos de evento; CA-4.4 |
| legal §3 — el LLM como encargado del tratamiento | ADR-023 §3; CA-5.4, CA-5.5, CA-5.8 |
| legal §3 — el tipo de entrada que no puede llevar identidad | ADR-022 §6; CA-5.1, CA-5.2 |
| legal §3.5 — ¿se archiva la respuesta del LLM? | **Sí**, decidido explícitamente: ADR-022 §3; CA-4.1, CA-4.3 |
| legal §4 — base jurídica, y el choque consentimiento ⇄ RN-13 | ADR-023 §4; CA-14.7 (ningún botón de consentimiento) |
| legal §4 — el responsable y ADR-012 | ADR-023 §5; SPEC-015 *Fuera de alcance*; nota §5 del gate |
| legal §4 — qué dice el bot y cuándo | ADR-023 §5; CA-14 entero |
| legal §5 — `correspondent_id` declarado, no `telegram_user_id` ni hash | ADR-022 §2; CA-2.8, CA-8.5, CA-10 |
| legal §5 — `Observation.source` sigue siendo `corresponsal` | ADR-022 §2; CA-8.1, con el caso que mide el fallo cerrado |
| legal §5 — un solo domicilio para el `correspondent_id` | ADR-022 §2 y §4; CA-10 entero |
| legal §6 — lista cerrada, y el rechazado que no deja rastro | CA-2.1, CA-2.2 |
| legal §6 — el mapeo no se versiona jamás (ADR-009 §3 citado) | ADR-022 §2; CA-2.5, CA-10.4 |
| legal §7.a — el texto libre no llega a lo publicado | CA-9.5 |
| legal §7.d — `secret_token` y rechazo antes de archivar | ADR-022 §1; CA-1 |
| legal §7.e — dos eventos entrantes, y los objetos colgantes | ADR-022 §3; CA-4.3 |
| legal §7.i — deriva de finalidad hacia D-7 | ADR-023 *Consecuencias*, destino EPIC-MEJORA |
| lingua §1 — registro: tuteo, imperativo, sin emoji decorativo | CA-7.6, CA-12; nota §7 del gate |
| lingua §2 — juego de comandos, y **no `/estado`** | CA-12.4 |
| lingua §3 — espacio de nombres `bot`, contrato compartido | CA-12.1, CA-12.2 |
| lingua §3 — la lengua **nunca** del `language_code` | ADR-022 §8; CA-11 entero |
| lingua §4.2 — los cinco estados no están en `dominio.md` | nota §3 del gate; CA-12.5 |
| lingua §4.2 — *En xogo* / *Directo* | nota §3 del gate: **firma humana** |
| lingua §4.4 — el hueco de `qualifiers` en `es.ts` | *Fuera de alcance* + nota §4: destino spec del marcador |
| lingua §5 — trampas del galego (pronombres, `estar a`, hipergaleguismos) | material del implementador al escribir el bundle; el dictamen es la referencia |

## Matriz de criterios de aceptación
<!-- Escritores: sdd-implementador rellena Implementado y Test; sdd-verificador rellena Verif. y Estado. Nunca al revés. -->
<!-- Estados por CA: ✅ cerrado · ⚠️ parcial/con salvedad · 🚧 en curso · ❌ sin empezar · n-a -->
<!-- Un CA está ✅ solo cuando Implementado + Test + Verif. aplicables están en verde. Una salvedad se marca ⚠️, nunca ✅. -->
| CA | Implementado (fichero) | Test (fichero/caso) | Verif. | Estado |
|---|---|---|---|---|
| CA-1 | | | | ❌ |
| CA-2 | | | | ❌ |
| CA-3 | | | | ❌ |
| CA-4 | | | | ❌ |
| CA-5 | | | | ❌ |
| CA-6 | | | | ❌ |
| CA-7 | | | | ❌ |
| CA-8 | | | | ❌ |
| CA-9 | | | | ❌ |
| CA-10 | | | | ❌ |
| CA-11 | | | | ❌ |
| CA-12 | | | | ❌ |
| CA-13 | | | | ❌ |
| CA-14 | | | | ❌ |
| CA-15 | | | | ❌ |

## Veredicto del verificador
<!-- GREEN/RED + fecha + resumen. Lo escribe SOLO sdd-verificador. -->

## Evidencia visual
<!-- Tabla CA → captura en _qa/SPEC-015/. Informe HTML opcional: _qa/SPEC-015/informe.html -->

Nota: el bot no tiene interfaz web. La evidencia visual útil aquí es la
**conversación real** —mensaje, tarjeta, botón, acuse— en las dos lenguas, y
tiene un problema de método: correrla contra Telegram real exige un bot
registrado, un secreto y un corresponsal mapeado, es decir **encender el bot**,
que tiene seis precondiciones fuera del código (ADR-023 §6). Mientras no estén,
la evidencia es la de los dobles. **Que el verificador lo diga así en su
veredicto y no lo dé por visto.**

## Salvedades / follow-ups
<!-- IDs F-SPEC-015-1, F-SPEC-015-2… con destino (spec futura o EPIC-MEJORA). -->

Abiertas ya al escribir la spec, para que nadie las descubra a mitad:

- **F-SPEC-015-1 — El disparador de F-SPEC-013-11 llega con esta spec y se
  contesta sin cerrarlo.** El bot necesita llamar al motor y `composeCyclePorts`
  le entregaría la capacidad de escribir `Decision` pasando los tres gates.
  SPEC-015 lo esquiva con una puerta estrecha nueva en `src/decide/` (CA-9), lo
  que resuelve **este** llamante. **El residuo sigue abierto**:
  `composeCyclePorts` es superficie pública. **Destino: EPIC-MEJORA**;
  **disparador actualizado: la próxima spec que ya tenga que tocar
  `src/decide/cycle.ts` por otro motivo.**
- **F-SPEC-015-2 — El segundo segmento de la clave del raw store no es una
  competición en el archivo del corresponsal.** Lleva el tipo de evento, porque
  la competición no se conoce antes de parsear (ADR-022 §3, CA-4.4). Es una
  irregularidad declarada, no un descuido; quien lea claves bajo `corresponsal/`
  tiene que conocerla. **Destino: EPIC-MEJORA**; **disparador: la primera spec
  que necesite consultar el raw store por competición de forma uniforme.**
- **F-SPEC-015-3 — El catálogo de corresponsales se aparta de la forma de
  ADR-018**: es un módulo JSON importado, sin CLI, sin tabla y sin registro de
  carga. Con un corresponsal el precio es un despliegue para dar de alta o de
  baja (la baja inmediata sí es una fila). **Destino: darle la forma de ADR-018**;
  **disparador: el segundo corresponsal.**
- **F-SPEC-015-4 — El art. 17 es un acto manual del operador, no una operación
  ejecutable**, porque el mapeo vive en entorno. Tiene ceremonia escrita (ADR-023
  §4). **Destino: revisar la decisión**; **disparador: más de tres corresponsales,
  o el primero que no sea el autor.**
- **F-SPEC-015-5 — Seis precondiciones fuera del código** (ADR-023 §6): la página
  `/privacidade` en las dos lenguas, el RAT del art. 30, la ponderación de interés
  legítimo, la copia fechada del DPA, el «no procede» de la EIPD, y la fecha de
  purga escrita antes de la primera jornada. **Ninguna la puede escribir un rol
  `sdd-*`.** **Bloquean encender el bot, no aprobar la spec.**
- **F-SPEC-015-6 — `docs/legal/` no existe todavía.** Lo crea la primera de las
  seis precondiciones que se escriba.
- **F-SPEC-015-7 — La carrera de F-SPEC-013-10 sigue viva** y esta spec añade
  fronteras que enumeran `src/`, así que tiene más superficie para tropezar con
  ella. Si una suite falla de forma intermitente enumerando `src/`, es eso y está
  ya inventariado en EPIC-MEJORA (subido a *Ahora*).
- **F-SPEC-015-8 — La rama de Neon de `DATABASE_URL_TEST` se comparte entre
  worktrees** (F-SPEC-010-7) y hay otra sesión trabajando en el checkout
  principal. Comprobar `ps aux | grep vitest` antes de correr `npm run test:db`;
  un `ENOTFOUND` del *pooler* es el de F-SPEC-013-6 y se resuelve con el endpoint
  directo.

## Para el verificador

1. **Los tres comandos**: `npm run lint`, `npm test`, `npm run test:db` (este
   último con `DATABASE_URL_TEST`; sin él, CA-2, CA-3, CA-7, CA-8, CA-9, CA-10,
   CA-11 y CA-13 son **UNMET, no *skipped***).
2. **El centro del trabajo son cinco fronteras de capacidad** —CA-2, CA-3, CA-5,
   CA-9 y CA-10—, todas en la forma de ADR-016. Para cada una: apagar **cada**
   mecanismo y ver el rojo en un caso **nombrado**; comprobar que no hay ninguna
   exención por nombre de fichero; y **leer el residuo declarado dentro del
   criterio**. Si un residuo falta o promete de más, es *finding* con destino
   `sdd-arquitecto`, **no** una corrección del test (ADR-016 §7).
3. **El criterio que más importa de toda la spec es CA-7.1**: antes del botón,
   `observations` no tiene ninguna fila. Es RN-09 y D-4 hechos comprobables.
   Verifícalo contra la base, no contra un doble.
4. **CA-15.3 permite exactamente dos desviaciones** en las suites cerradas —la
   entrada nueva en la lista de salida permitida y la migración 0007 en las
   aserciones que enumeran migraciones—, y las dos con motivo escrito en el mismo
   diff. **Cualquier otra es RED.** El precedente de cómo se enmienda una aserción
   derivada está en F-SPEC-011-1.
5. **Que ningún fichero versionado contenga un `telegram_user_id`** (CA-10.4). Es
   irreversible si se incumple, por el mismo motivo que ADR-009 §3: git no se
   purga, se reescribe.

## Cómo retomar (handoff)

Estado real al 2026-09-02: **spec y ADRs escritos, cero código**. Nada bajo
`src/`, `tests/` ni `migrations/` ha cambiado.

Lo que hay en la rama: la spec, este ledger, `dictamenes-SPEC-015.md`, ADR-022,
ADR-023 y las cinco filas de estados en `docs/fundacion/dominio.md`.

**Lo primero que tiene que pasar es un gate humano**, y trae tres preguntas que
bloquean la implementación (notas §6 de la spec): el plazo de 30 días de ADR-023,
el proveedor de LLM con su DPA comprobado, y si `live` es *En xogo* o *Directo*.

Si el gate firma, el orden de implementación que la spec sugiere es el del §2 de
su *Diseño*, que es el orden en que ocurren las cosas: primero las tres fronteras
negativas (CA-1, CA-2, CA-13), que son las que dejan el bot inerte y seguro;
después el archivo (CA-3, CA-4); después el LLM y los candidatos (CA-5, CA-6);
y al final la confirmación y la `Observation` (CA-7, CA-8, CA-9), que es donde
está el valor.
