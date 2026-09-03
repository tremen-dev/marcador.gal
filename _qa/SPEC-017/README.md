# `_qa/SPEC-017/` — la mitad de CA-10 que solo ve un navegador

**CA-10.14, hecho a mano el 2026-09-03**, después de que **ADR-026** se aprobase
y CA-10 se descongelase. Los subpuntos 1 a 13 son estáticos y viven en
`tests/admin/style.test.ts` y `tests/design/parity.test.ts`; **este es el único
que ve el navegador, y lo hace una persona** (ADR-025 §5, ADR-016 §6).

## Cómo se hizo, sin maquillarlo

- **Chrome real** (`Google Chrome`, headless nuevo), a **360 × 640** con
  `deviceScaleFactor: 2`, conducido por CDP desde
  `CA-10.14-guion-da-comprobacion.mjs`.
- **El guion vive AQUÍ y no en `tests/`, y es deliberado.** SPEC-017 decidió
  **no meter un navegador automatizado en el proyecto** (ADR-025 §5): hacerlo
  toca la partición del runner de SPEC-014, el coste de la suite y una CI que no
  existe. Esto no es una suite: es el instrumento con el que una persona hizo
  una comprobación manual, y no lo corre ningún gate. **El disparador de
  automatizarlo sigue escrito: la primera spec que construya la interfaz del
  marcador.**
- **La extensión de navegador del entorno no llega a un origen local** —da
  «error page» en `localhost` y en la IP de red aunque el servidor conteste
  200—, así que el navegador se condujo por CDP directamente. Es el mismo
  navegador y la misma pantalla.

## La escena, y por qué es sintética

`next dev` con `DATABASE_URL` apuntando a la **base de pruebas**, dos partidos y
una alerta RN-07 sembrados, y **una jornada de medición declarada
temporalmente**. Esa jornada **se revirtió antes de commitear**:
`MEASUREMENT_WINDOWS` sigue vacía y **el panel se entrega apagado** (CA-11.1).
Las credenciales del acceso fueron locales y de un solo uso; no se versionan.

## Qué se comprobó, y qué se midió

| Comprobación | Medida |
|---|---|
| Recorrido **solo con teclado** por el acceso | `Tab` → campo *Operador*, `Tab` → *Clave*, `Tab` → botón *Entrar* |
| Recorrido **solo con teclado** por el tablero | `Tab` recorre los dos partidos, el motivo del acuse, *Recoñecer* y *Cancelar*, en el orden del DOM |
| Recorrido **solo con teclado** por una corrección | del `select` al `textarea` en **3 tabuladores**, y se escribió el motivo con el teclado |
| **Foco visible en cada parada** | `outline: rgb(245,241,234) solid 2px`, `outline-offset: 2px`, sobre `input`, `button`, `a` y `textarea` |
| **`Escape` cancela y devuelve el foco** | el `textarea` queda vacío y el foco pasa al enlace `[data-cancel]` *Cancelar*, con su anillo |
| **Sin desplazamiento horizontal del cuerpo a 360 px** | `document.scrollWidth / clientWidth = 360 / 360` en las dos pantallas |
| La tabla ancha scrollea **dentro de su contenedor** | `.scroller`: `scrollWidth 856` vs `clientWidth 344` |
| **Toque ≥ 44 px** | `input`, `select`, `button` y `a` a **44 px** de alto; `textarea` a 80 |
| **Campos ≥ 16 px** | `font-size: 16px` en todos |
| **Fuentes autoalojadas cargadas** | `document.fonts.check('16px Geist')` y `'16px "Geist Mono"'` → `true`, sin una sola petición a un tercero |
| **Cualificadores, con etiqueta y sin apagar** | `q-provisional` = «Provisional» en `rgb(245,241,234)` (`--fg`); `q-sen-sinal` = «Sen sinal» en `rgb(255,101,90)` (`--alert`) |
| **Estados con su literal del glosario** | `s-live` = «**En xogo**» en `rgb(255,107,0)` (`--accent-live`). Nunca «Directo», nunca `FIN`/`APR`/`DESC` |

Los números están en `CA-10.14-medidas.json`, tal como los devolvió el navegador.

## Un defecto que esta comprobación encontró y que se arregló

En la primera vuelta, la tabla del tablero llevaba `width:100%` y a 360 px
**partía los nombres canónicos de la RFGF carácter a carácter** («Rácing
Villalb / és - SD Estrad / ense»). Es lo que ADR-025 §5 dice que un test
estático no ve. Se corrigió con `width:max-content;min-width:100%` y
`white-space:nowrap` en las celdas —lo ancho scrollea dentro de `.scroller`, y
el cuerpo sigue sin desplazamiento horizontal— y la captura del tablero es de
después del arreglo.

## Un falso positivo del guardián de SPEC-015, encontrado aquí

La captura de la corrección, tal como Chrome la escribió, llevaba en su flujo de
compresión una tirada de once dígitos, y **`tests/bot/frontier.test.ts` caso 28
la marcó como un `telegram_user_id`** (la tirada no se copia aquí: escribirla
volvería a poner rojo el mismo caso, que es la mitad del defecto) (SPEC-015 CA-10.4, `/\b\d{9,12}\b/` sobre
todo el árbol versionado, binarios incluidos y a propósito).

**No se tocó ni el guardián ni su lista de exclusiones**: es un mecanismo de una
spec cerrada y su premisa —«un identificador escrito dentro de un binario está
igual de versionado»— es correcta. Lo que se hizo fue **recodificar el PNG**
(`sips -s format png`, sin pérdida: 720 × 1280 antes y después, los mismos
píxeles), y el flujo nuevo ya no lleva la secuencia. El defecto que esto destapa
—que el mecanismo tiene un modo de falso positivo sobre datos comprimidos que su
criterio **no declara**— queda anotado como **F-SPEC-017-11** en el ledger, con
destino `sdd-arquitecto`.

## Lo que estas capturas NO prueban

Que un control de 44 px se pulse con un pulgar. Eso pide un dedo y un teléfono,
y no lo da ni un test ni un navegador headless.
