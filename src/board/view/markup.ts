/**
 * The scoreboard's markup (SPEC-018 CA-9, CA-10, CA-12, CA-13, CA-15;
 * ADR-013, ADR-026, ADR-027).
 *
 * EVERY VISIBLE STRING THAT ENTERS HERE IS A `BoardText`, and the only producer
 * of a `BoardText` is `src/i18n/board.ts` (CA-13.2). A literal in impeccable
 * galego written in this file DOES NOT COMPILE, which is what makes D-2 a
 * property of the type system and not a habit. What is written here as literals
 * are TAGS AND ATTRIBUTES, which are not text in any language.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THE FIRST PAINT IS THE DATUM (ADR-027 §5, CA-9.1). The document that leaves
 * here already carries the matches, the scoreboards, the states and the
 * qualifiers. THERE IS NO LOADING SKELETON, no «cargando» string, and no empty
 * shell that fills itself: the loading state is not designed because IT DOES
 * NOT EXIST. The script only refreshes, and if it does not run the page is
 * still correct (CA-9.2).
 *
 * NOTHING IS TOLD APART BY COLOUR (ADR-013 §2): every state and every
 * qualifier is A TEXT NODE that names it, with the COMPLETE literal of
 * `dominio.md` — never a glyph, never an abbreviation, never an ellipsis
 * (ADR-027 §8.1). `Rematado` never appears as a loose phrase: it carries either
 * a `<th>` that heads it or an adjacent inline label (CA-12.3), and state and
 * qualifier never end up glued together with nothing between them (CA-12.4).
 *
 * NO IMAGE IS RENDERED (ADR-013 §4 and §5, `FOUNDATION.md`, non-negotiable):
 * there is no `<img>`, no background image and no crest SVG in this module.
 *
 * NO CALL TO ACTION (CA-2.7). No `<form>`, no `<input>`, no `<iframe>`, no
 * sign-up, no waiting list, no newsletter — and its only outbound links are
 * `/robot`, `/proxecto` and the mailbox. That is what keeps art. 10 LSSI out:
 * the trigger of that article is not that the page is public, it is that there
 * is economic activity, and today there is none.
 *
 * NO MEASUREMENT OF AUDIENCE (CA-2.5). No third-party script is injected, and
 * `@vercel/analytics` is not a dependency of this project and is imported
 * nowhere. DECLARED: what that costs is knowing how many people open this
 * screen, how long they stay or whether they come back. THAT IS WANTED.
 *
 * THE DOCUMENT ANNOUNCES ITSELF `noindex, noarchive` AND DELIBERATELY NOT
 * `nofollow` (ADR-027 §3.a): `nofollow` would tell a crawler not to follow the
 * only outbound links there are — `/robot` and `/proxecto` — and `/robot` is
 * the page that travels inside our own `User-Agent`.
 */
import { BOARD_ROBOTS } from '@/api/freshness';
import { BOARD_STYLESHEET } from './styles';
import {
  CELL_ATTRIBUTE,
  CONFIG_ELEMENT_ID,
  REFRESH_SCRIPT,
  ROW_ATTRIBUTE,
  TRANSPORT_ELEMENT_ID,
} from './refresh';
import type { BoardText } from '@/i18n/board';

/** HTML escaping. Everything that reaches the document goes through it. */
export function escape(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/** A branded fragment, escaped and ready to be embedded. */
export function text(value: BoardText): string {
  return escape(value);
}

export function heading(level: 1 | 2 | 3, value: BoardText): string {
  return `<h${level}>${text(value)}</h${level}>`;
}

export function paragraph(value: BoardText, className = ''): string {
  const attribute = className === '' ? '' : ` class="${escape(className)}"`;
  return `<p${attribute}>${text(value)}</p>`;
}

export function headerCell(value: BoardText): string {
  return `<th scope="col">${text(value)}</th>`;
}

/**
 * A cell of a row. `field` is what the refresh script looks for when it
 * substitutes a value; `className` is what carries the state or the qualifier,
 * WHICH IS NEVER THE ONLY THING THAT DISTINGUISHES THEM — the text node beside
 * it names them (ADR-013 §2).
 */
export function cell(value: BoardText, field: string, className = ''): string {
  const classAttribute = className === '' ? '' : ` class="${escape(className)}"`;
  return `<td ${CELL_ATTRIBUTE}="${escape(field)}"${classAttribute}>${text(value)}</td>`;
}

export function row(matchId: string, cells: readonly string[]): string {
  return `<tr ${ROW_ATTRIBUTE}="${escape(matchId)}">${cells.join('')}</tr>`;
}

/** The one wide element. `scroller` is a hook, not an appearance. */
export function table(head: string, body: readonly string[]): string {
  return `<div class="scroller"><table><thead>${head}</thead><tbody>${body.join(
    '',
  )}</tbody></table></div>`;
}

export function link(href: string, value: BoardText): string {
  return `<a href="${escape(href)}">${text(value)}</a>`;
}

export function section(body: readonly string[], className = ''): string {
  const attribute = className === '' ? '' : ` class="${escape(className)}"`;
  return `<section${attribute}>${body.join('')}</section>`;
}

/** The page's transport notice. OUTSIDE the table, once (CA-8.2). */
export function transportNotice(value: BoardText): string {
  return `<p class="transport" id="${escape(TRANSPORT_ELEMENT_ID)}">${text(value)}</p>`;
}

/**
 * The configuration the refresh script reads: the `ETag` it starts from and the
 * literals it will need, ALREADY RESOLVED FROM THE BUNDLE (D-2). It travels as
 * a `application/json` block and not as JavaScript, so nothing of it is code.
 *
 * `<` is escaped as `\\u003c` so that no value can close the block.
 */
export function configBlock(config: Readonly<Record<string, unknown>>): string {
  const json = JSON.stringify(config).replaceAll('<', '\\u003c');
  return `<script type="application/json" id="${escape(CONFIG_ELEMENT_ID)}">${json}</script>`;
}

/** The refresh script, inline. There is no external script (CA-1.5). */
export function refreshScript(): string {
  return `<script>${REFRESH_SCRIPT}</script>`;
}

/**
 * The document. It loads NOTHING from any host that is not its own: the faces
 * are self-hosted under `/fonts/`, the sheet is inline and the script is
 * inline (ADR-026 §3.5, CA-1.5).
 */
export function document(locale: string, title: BoardText, body: string): string {
  return [
    '<!doctype html>',
    `<html lang="${escape(locale)}">`,
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<meta name="robots" content="${escape(BOARD_ROBOTS)}">`,
    `<title>${text(title)}</title>`,
    `<style>${BOARD_STYLESHEET}</style>`,
    '</head>',
    '<body>',
    '<main>',
    body,
    '</main>',
    '</body>',
    '</html>',
  ].join('\n');
}
