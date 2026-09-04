/**
 * UNA CASCADA PEQUEÑA Y HONESTA, Y UN MODELO DE ANCHURAS — el instrumento que
 * a SPEC-018 CA-15.7 le faltaba (F-SPEC-018-V1).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POR QUÉ EXISTE. El caso que vigilaba «dígitos tabulares» comprobaba que la
 * CADENA `font-variant-numeric:tabular-nums` aparecía en la hoja. Aparecía, y
 * la propiedad computaba `normal` en las tres celdas que llevan cifras: el
 * atajo `font:` que emitía `role()` la reiniciaba tres reglas más abajo. La
 * aserción era cierta y la promesa estaba incumplida, que es exactamente la
 * aserción vacua que este proyecto persigue.
 *
 * Para no volver a decir «la cadena está» hay que resolver la CASCADA: qué
 * valor computa una propiedad en un elemento, dadas las reglas de la hoja, su
 * especificidad y su orden. Eso es lo que hay aquí, y no una idea general de
 * CSS: sólo lo que esta hoja usa.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * DECLARADO DONDE JUZGA (ADR-016 §6) — LO QUE ESTE MECANISMO NO ALCANZA:
 *
 *   * NO hay navegador y no lo habrá aquí: CA-16.3 declara que CA-1..CA-15 son
 *     estáticos y no ejecutan una línea de JavaScript de página. Lo que ve el
 *     navegador lo ve CA-16, a mano y con capturas.
 *   * NO se leen las caras `.woff2`: no hay decodificador de woff2 en el árbol
 *     y `ALLOWED_PACKAGES` es una lista cerrada (ADR-016 §3.2). Las anchuras de
 *     abajo son MEDIDAS REALES tomadas en el navegador, no inventadas.
 *   * NO se resuelven selectores con combinador ni con pseudoclase. Eso no se
 *     supone: `unresolvableSelectors()` enumera los que este resolutor no sabe
 *     decidir para un elemento dado, y el caso 14 exige que la lista sea VACÍA.
 *   * NO se resuelve la herencia entre elementos. No hace falta: las tres
 *     celdas declaran las dos propiedades en su propia cascada.
 */

/** El elemento contra el que se resuelve: una etiqueta y sus clases. */
export interface StyledElement {
  readonly tag: string;
  readonly classes: readonly string[];
}

/** Una declaración `propiedad: valor`. */
export interface Declaration {
  readonly property: string;
  readonly value: string;
}

/** Una regla de la hoja, con su posición en el orden del documento. */
export interface Rule {
  readonly selectors: readonly string[];
  readonly declarations: readonly Declaration[];
  readonly order: number;
}

/**
 * Los valores iniciales que hacen falta. `font-variant-numeric` y
 * `font-feature-settings` son los dos que sostienen ADR-013 §3; los otros
 * cuatro son los que el atajo `font:` fija, y están para que expandirlo no
 * mienta.
 */
const INITIAL: ReadonlyMap<string, string> = new Map([
  ['font-variant-numeric', 'normal'],
  ['font-feature-settings', 'normal'],
  ['font-family', 'initial'],
  ['font-size', 'medium'],
  ['font-weight', 'normal'],
  ['line-height', 'normal'],
]);

/**
 * LO QUE EL ATAJO `font:` REINICIA Y NUNCA NOMBRA (CSS Fonts 4 §6): además de
 * las cuatro que escribe, devuelve a su valor inicial todas éstas. Aquí están
 * las dos que importan y las que esta hoja podría llegar a declarar; la lista
 * completa es más larga, y ésa es justamente la razón por la que la hoja dejó
 * de usar el atajo en vez de reordenar dos líneas.
 */
const RESET_BY_FONT_SHORTHAND: readonly string[] = [
  'font-variant-numeric',
  'font-feature-settings',
  'font-variation-settings',
  'font-kerning',
  'font-size-adjust',
  'font-optical-sizing',
  'font-stretch',
  'font-style',
];

/** `600 20px/1 var(--mono)` → las cuatro longhands que el atajo escribe. */
function expandFontShorthand(value: string): readonly Declaration[] {
  const parsed = /^(?:(\d+)\s+)?([\w.%-]+)(?:\s*\/\s*([\d.]+))?\s+(.+)$/.exec(value.trim());
  if (parsed === null) {
    throw new Error(`cascade: no sé expandir el atajo \`font:${value}\``);
  }
  const written: Declaration[] = [
    { property: 'font-size', value: parsed[2]! },
    { property: 'font-family', value: parsed[4]!.trim() },
  ];
  if (parsed[1] !== undefined) written.push({ property: 'font-weight', value: parsed[1] });
  if (parsed[3] !== undefined) written.push({ property: 'line-height', value: parsed[3] });
  return [
    ...RESET_BY_FONT_SHORTHAND.map((property) => ({ property, value: 'normal' })),
    ...written,
  ];
}

/**
 * Las reglas de la hoja, en orden. Se saltan las de arroba —`@font-face`— y el
 * bloque `:root`, que no alcanzan a un elemento por selector.
 */
export function parseRules(sheet: string): readonly Rule[] {
  const withoutComments = sheet.replaceAll(/\/\*[\s\S]*?\*\//g, '');
  const rules: Rule[] = [];

  for (const chunk of withoutComments.split('}')) {
    const brace = chunk.indexOf('{');
    if (brace < 0) continue;
    const prelude = chunk.slice(0, brace).trim();
    if (prelude === '' || prelude.startsWith('@')) continue;

    const declarations = chunk
      .slice(brace + 1)
      .split(';')
      .map((entry) => entry.trim())
      .filter((entry) => entry !== '')
      .map((entry) => {
        const colon = entry.indexOf(':');
        return {
          property: entry.slice(0, colon).trim(),
          value: entry.slice(colon + 1).trim(),
        };
      });

    rules.push({
      selectors: prelude.split(',').map((selector) => selector.trim()),
      declarations,
      order: rules.length,
    });
  }
  return rules;
}

/** Un compuesto simple: `td`, `.score`, `td.score`, `*`, `a:hover`. */
interface Compound {
  readonly tag: string | null;
  readonly classes: readonly string[];
  readonly ids: readonly string[];
  readonly pseudos: readonly string[];
}

function parseCompound(compound: string): Compound {
  const tag = /^(\*|[a-zA-Z][\w-]*)/.exec(compound);
  return {
    tag: tag === null ? null : tag[1]!,
    classes: [...compound.matchAll(/\.([\w-]+)/g)].map((match) => match[1]!),
    ids: [...compound.matchAll(/#([\w-]+)/g)].map((match) => match[1]!),
    pseudos: [...compound.matchAll(/::?[\w-]+/g)].map((match) => match[0]!),
  };
}

function compoundMatches(compound: Compound, element: StyledElement): boolean {
  if (compound.ids.length > 0) return false;
  if (compound.tag !== null && compound.tag !== '*' && compound.tag !== element.tag) return false;
  return compound.classes.every((name) => element.classes.includes(name));
}

/** `[id, clase, tipo]` colapsado a un número, como hace la cascada. */
function specificityOf(compound: Compound): number {
  const types = compound.tag !== null && compound.tag !== '*' ? 1 : 0;
  return compound.ids.length * 10000 + compound.classes.length * 100 + types;
}

const COMBINATOR = /[\s>+~]/;

/**
 * Los selectores de la hoja que este resolutor NO SABE decidir para alguno de
 * estos elementos: los que llevan combinador y cuyo sujeto sí encaja —haría
 * falta saber los ancestros— y los que llevan pseudoclase o pseudoelemento y
 * DECLARAN alguna propiedad de fuente —dependen de un estado que aquí no
 * existe—. Que la lista salga vacía es lo que hace legítimo ignorarlos.
 */
export function unresolvableSelectors(
  sheet: string,
  elements: readonly StyledElement[],
): readonly string[] {
  const offenders: string[] = [];

  for (const rule of parseRules(sheet)) {
    const touchesFont = rule.declarations.some((declaration) =>
      declaration.property.startsWith('font'),
    );
    for (const selector of rule.selectors) {
      const parts = selector.split(COMBINATOR).filter((part) => part !== '');
      const subject = parseCompound(parts.at(-1)!);
      if (!elements.some((element) => compoundMatches(subject, element))) continue;
      if (parts.length > 1) offenders.push(`${selector} (combinador: haría falta el ancestro)`);
      else if (subject.pseudos.length > 0 && touchesFont) {
        offenders.push(`${selector} (pseudoclase que declara una propiedad de fuente)`);
      }
    }
  }
  return offenders;
}

/**
 * EL VALOR COMPUTADO de cada propiedad en ese elemento: reglas que encajan,
 * ordenadas por especificidad y, a igualdad, por orden de documento; el atajo
 * `font:` expandido a lo que escribe Y a lo que reinicia.
 */
export function computedStyle(
  sheet: string,
  element: StyledElement,
): ReadonlyMap<string, string> {
  const matched: { rule: Rule; specificity: number }[] = [];

  for (const rule of parseRules(sheet)) {
    let best: number | null = null;
    for (const selector of rule.selectors) {
      if (COMBINATOR.test(selector)) continue;
      const compound = parseCompound(selector);
      if (compound.pseudos.length > 0) continue;
      if (!compoundMatches(compound, element)) continue;
      const specificity = specificityOf(compound);
      if (best === null || specificity > best) best = specificity;
    }
    if (best !== null) matched.push({ rule, specificity: best });
  }

  matched.sort((a, b) => a.specificity - b.specificity || a.rule.order - b.rule.order);

  const computed = new Map(INITIAL);
  for (const { rule } of matched) {
    for (const declaration of rule.declarations) {
      const applied =
        declaration.property === 'font'
          ? expandFontShorthand(declaration.value)
          : [declaration];
      for (const one of applied) computed.set(one.property, one.value);
    }
  }
  return computed;
}

// ─────────────────────────────────────────────────────────────────────────────
// EL MODELO DE ANCHURAS. Números MEDIDOS, no inventados.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LAS ANCHURAS QUE SE MIDIERON EN UN NAVEGADOR DE VERDAD, sobre el documento
 * que sirve el manejador, a 20 px —el tamaño del rol `score`—, y que quedaron
 * escritas en el ledger de SPEC-018 al levantar F-SPEC-018-V1:
 *
 *   * Geist sans, sin figuras tabulares: `111111` = 42,66 px · `000000` = 58,59 px.
 *   * Geist Mono: `111111` = `000000` = 72,25 px, DIGA LO QUE DIGA LA HOJA.
 *
 * Las dos caras están aquí porque la segunda es LA TRAMPA: en mono los dos
 * anchos coinciden aunque la declaración esté muerta, que es por lo que el caso
 * viejo pasaba por el motivo equivocado. Por eso CA-15.7 se mide en `sans`: en
 * una proporcional, que `111111` y `000000` midan lo mismo SÓLO puede venir de
 * las figuras tabulares.
 */
export const FACE_ADVANCE_PX = {
  sans: { '0': 58.59 / 6, '1': 42.66 / 6, tabular: 58.59 / 6 },
  mono: { '0': 72.25 / 6, '1': 72.25 / 6, tabular: 72.25 / 6 },
} as const;

export type Face = keyof typeof FACE_ADVANCE_PX;

/** Si el estilo computado pide figuras tabulares, por cualquiera de las dos vías. */
export function tabularFigures(style: ReadonlyMap<string, string>): boolean {
  const variant = style.get('font-variant-numeric') ?? 'normal';
  const features = style.get('font-feature-settings') ?? 'normal';
  return (
    variant.split(/\s+/).includes('tabular-nums') || /'tnum'\s*(?:1|on)?/.test(features)
  );
}

/**
 * LA MEDIDA: la anchura de una cadena de dígitos con ese estilo computado y esa
 * cara. Con figuras tabulares todos los dígitos avanzan lo mismo; sin ellas,
 * cada dígito avanza lo suyo — y en `sans` lo suyo es distinto.
 */
export function digitsWidthPx(
  digits: string,
  style: ReadonlyMap<string, string>,
  face: Face = 'sans',
): number {
  const metrics = FACE_ADVANCE_PX[face];
  const tabular = tabularFigures(style);
  let width = 0;

  for (const digit of digits) {
    if (digit !== '0' && digit !== '1') {
      throw new Error(`cascade: no se midió el dígito ${digit} en el navegador`);
    }
    width += tabular ? metrics.tabular : metrics[digit];
  }
  return width;
}
