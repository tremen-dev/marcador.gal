---
id: ADR-007
tipo: adr
estado: aprobada
historial:
  - {estado: borrador, fecha: 2026-08-29, por: sdd-arquitecto}
  - {estado: aprobada, fecha: 2026-08-30, por: Alberto Fojo}
aprobada-por: Alberto Fojo
---
# ADR-007: Linter — oxlint en lugar de ESLint

- Deciders: propone sdd-arquitecto. **Aprobado por Alberto Fojo el 2026-08-30.**
- Specs relacionadas: SPEC-001 (modelo canónico y raw store), que lo origina vía
  el finding **F-SPEC-001-20**. Aplica a toda spec posterior: `npm run lint` es
  su gate estático.
- Relacionado: ADR-001 (stack — Node/TypeScript).

> **Este ADR se escribió después del cambio, no antes.** CLAUDE.md pide el ADR
> primero; aquí el linter cambió mientras se reparaba un RED de verificación y el
> registro llegó detrás. Queda anotado porque es una desviación del método y el
> humano firmó sabiéndola: vale como excepción registrada, no como precedente.

## Contexto

`.sdd.json` declara `"linter": "auto"` y `gates.calidad: true`: el pipeline exige
un gate estático además del compilador. El verificador emitió **RED** sobre
SPEC-001 con **F-SPEC-001-20** como bloqueante: `package.json` declaraba
`"lint": "eslint ."` y `eslint@^9` en devDependencies, pero **no existía ningún
`eslint.config.*` en el repositorio ni lo había habido nunca**. `npm run lint`
salía con exit 2 sin analizar un solo fichero. El gate no estaba flojo: era
ficción declarativa.

Reparar eso parecía escribir un fichero de configuración. No lo era, porque **con
ESLint no se podía**:

- El proyecto usa **TypeScript 7.0.2**. ESLint no parsea TypeScript sin
  `typescript-eslint`.
- `typescript-eslint` **rechaza TS 7 con una guarda en tiempo de ejecución**:
  `Error: typescript-eslint does not support TS 7.0`. Tanto `latest` (8.68.0)
  como `canary` (8.68.1-alpha.6) declaran
  `peerDependencies.typescript: ">=4.8.4 <6.1.0"`.
- El soporte para TS >=7.1 se sigue en el issue **typescript-eslint#10940**, sin
  fecha.

Se intentaron las dos salidas habituales y ninguna funciona:

- `--legacy-peer-deps`: instala, pero la guarda de runtime salta igual.
- `overrides` de npm anidando `typescript@6.0.3` bajo `typescript-eslint`: npm no
  lo anida; sigue resolviendo la 7 de la raíz.

ADR-001 fijó «Node 22 LTS con TypeScript en modo estricto» sin pintar la versión
mayor, así que la elección real no era «qué configuración de ESLint», sino una de
tres: **bajar TypeScript**, **retirar el gate** o **cambiar de linter**.

## Decisión

**El linter del proyecto es `oxlint`, con reglas type-aware activadas. ESLint sale
del repositorio.**

- `oxlint@^1.80.0` en devDependencies. Escrito en Rust, con **parser propio de
  TypeScript**: no depende de la API del compilador, y por tanto la versión mayor
  de TypeScript deja de ser una restricción del linter.
- `package.json`: `"lint": "oxlint --type-aware"`. `eslint` retirado de
  devDependencies.
- Configuración en **`.oxlintrc.json`**:
  - `categories.correctness: "error"` — el perfil por defecto de la herramienta.
    Las categorías `suspicious`, `pedantic` y `style` quedan **apagadas**.
  - Plugins: `typescript`, `unicorn`, `oxc`, `import`, `promise`, `node`,
    `vitest`, `react`, `nextjs`.
  - **Una única regla desactivada:** `react/react-in-jsx-scope`, falso positivo
    con el JSX transform de React 17+ que usa el App Router.
- **No se adopta formateador.** oxlint no formatea, y ningún fichero de `src/` ni
  de `tests/` se reescribe por este cambio.
- `.sdd.json` no se toca: `"linter": "auto"` detecta oxlint desde `package.json`.

### Reglas type-aware

**Las reglas que consultan al type checker están activas.** No se pierden, y este
es el punto que decide el ADR:

- `oxlint-tsgolint@^7.0.2001` en devDependencies — *«High-performance type-aware
  TypeScript linter powered by typescript-go, for use with oxlint»*. `oxlint` lo
  declara peer **opcional** (`oxlint-tsgolint >=7.0.2001`).
- `typescript-go` **es el compilador nativo de TypeScript 7**: el mismo que hace
  que `typescript-eslint` se niegue a arrancar.
- El flag `--type-aware` de oxlint («Enable rules that require type information»)
  va en el script de `lint`, así que el gate lo ejecuta siempre, no a mano.
- **Comprobado que analiza de verdad, no que calla.** Con un fichero trampa que
  contenía una promesa flotante: sin `--type-aware` no reporta nada; con
  `--type-aware` reporta
  `error typescript(no-floating-promises): Promises must be awaited...`.
  La trampa se borró tras la comprobación; existía solo para descartar un no-op
  silencioso.

Resultado medido: barrido completo con reglas type-aware activas, `npm run lint`
**exit 0 y sin hallazgos**; sin regresiones —`typecheck` exit 0, `npm test` 23
ficheros / 270 casos, `test:db` 7/130, `test:blob` 1/22.

## Consecuencias

### Positivas
- **El gate de calidad existe y corre por primera vez.** F-SPEC-001-20 queda
  cerrado por reparación, no por excepción.
- **La misma versión de TypeScript que bloquea a ESLint es la que habilita el
  análisis con tipos de oxlint.** `typescript-eslint` rechaza TS 7; `tsgolint`
  está construido *sobre* TS 7. Estar al día en el compilador deja de ser un
  precio a pagar y pasa a ser el requisito. No hay trade-off que negociar aquí.
- **`no-floating-promises` y `no-misused-promises` están activas hoy**, que es
  justo lo que va a hacer falta en el cron de ingesta y en el motor de
  decisiones: código asíncrono, sin proceso vivo, donde una promesa sin `await`
  se pierde en silencio.
- **El linter deja de estar acoplado a la versión mayor de TypeScript.** La
  elección de ADR-001 —TypeScript al día, en estricto— ya no queda rehén del
  rango de peer dependencies de un tercer paquete.
- Un árbol de dependencias más pequeño: dos binarios en vez de `eslint` +
  `typescript-eslint` + plugins, cada uno con su propia ventana de compatibilidad.

### Negativas / follow-ups
- **`oxlint-tsgolint` es joven y va pegado al compilador.** Su versionado
  (`7.0.2001`) sigue a `typescript-go`, así que subir la versión mayor de
  TypeScript probablemente exija subirlo a la vez. Es acoplamiento, pero **en la
  dirección buena**: sigue a TypeScript en vez de frenarlo, que era exactamente
  el defecto de `typescript-eslint`. El riesgo real no es de capacidad sino de
  proyecto joven: si se estancara, volver a ESLint seguiría exigiendo bajar
  TypeScript.
- **No asumir paridad de reglas con `typescript-eslint`.** El port está en curso.
  Antes de dar por cubierta una regla type-aware concreta, comprobarla como se
  comprobó `no-floating-promises`: con un caso trampa que debe fallar. Una regla
  que no existe no avisa de que no existe.
- **Ecosistema de reglas más pequeño.** No hay plugins de comunidad arbitrarios:
  lo que no esté en el set integrado de oxlint, aquí no existe.
- **Solo `correctness`.** Es el perfil de fábrica de la herramienta, no un perfil
  juzgado por este proyecto: nadie ha evaluado si `suspicious` o `pedantic`
  aportan. Subirlo es una decisión posterior con su propio diff, y quien la tome
  carga con él. Mejor decidirlo pronto que con 5.000 líneas más encima.
- **`react/react-in-jsx-scope` apagada en bloque.** Hoy es un falso positivo
  legítimo; si algún fichero volviera al transform clásico, nada lo detectaría.
- **Ningún gate verifica el formato.** Es deliberado (ver alternativas), pero
  queda dicho: el formato del código no está cubierto por nada.

## Alternativas consideradas

- **Bajar TypeScript a 6.0.3 y quedarse con ESLint + typescript-eslint.**
  Viable en abstracto: ADR-001 no pinta la versión mayor. Su único argumento
  fuerte era conservar las reglas type-aware — **y ese argumento ya no existe**:
  con `oxlint-tsgolint` están activas sobre TS 7. Hoy la alternativa cuesta lo
  mismo que costaba —revalidar toda la superficie de SPEC-001, 270 casos
  unitarios, 152 de integración y siete ficheros de tests de tipo, contra otro
  compilador— y además **apagaría** el análisis con tipos que funciona
  precisamente por estar en TS 7. Rechazada sin reservas.
- **Retirar el gate de lint y dejar `tsc --noEmit` como único gate estático.** Era
  la alternativa que ofrecía el propio verificador. Rechazada: `gates.calidad:
  true` es una decisión del proyecto, y la forma honesta de cerrar así el finding
  sería ponerlo a `false` —debilitar el estándar por un accidente de herramienta—.
  Además `tsc` no ve lo que ve un linter: importaciones muertas, `catch` vacíos,
  patrones prohibidos, promesas flotantes.
- **Biome.** Candidato serio y muy cercano: Rust, parser propio de TypeScript, la
  misma independencia de la versión mayor. Rechazado porque **es también
  formateador**: adoptarlo habría reescrito los **58 ficheros** de `src/` y
  `tests/`, un diff enorme en mitad de la verificación abierta de SPEC-001, y
  habría metido una decisión de estilo dentro de una reparación de gate. Es
  reabrible más adelante **como decisión de formato**, deliberada y con su propio
  commit.
- **Esperar al soporte de `typescript-eslint` para TS >=7.1** (issue #10940). Sin
  fecha, y SPEC-001 está en RED ahora.

<!-- REGLA: un ADR aceptado es INMUTABLE. Para cambiar la decisión, escribe otro ADR que lo supersede (estado del viejo -> bloqueada + nota "superseded por ADR-NNN"). -->
