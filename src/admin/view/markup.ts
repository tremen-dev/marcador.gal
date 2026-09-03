/**
 * The panel's markup (SPEC-017 CA-9, CA-12; ADR-013).
 *
 * EVERY VISIBLE STRING THAT ENTERS HERE IS AN `AdminText`, and the only
 * producer of an `AdminText` is `src/i18n/admin.ts` (CA-9.3). A literal in
 * impeccable galego written in this file DOES NOT COMPILE, which is what makes
 * D-2 a property of the type system and not a habit. What is written here as
 * literals are TAGS AND ATTRIBUTES, which are not text in any language.
 *
 * THE PANEL DOES NOT ANNOUNCE ITSELF (CA-1.10). Every document carries
 * `<meta name="robots" content="noindex, nofollow">`, and the handler adds the
 * `X-Robots-Tag` header. `robots.txt` IS NOT TOUCHED, and that is a written
 * decision: listing `/admin` in a public file would publish the address of the
 * surface with weight 1.0 to anybody who asks for it. SPEC-004 CA-11 — «permite
 * el rastreo del sitio entero» — stays green without touching an assertion,
 * and there is no amendment of ADR-015 to write.
 *
 * NOTHING IS TOLD APART BY COLOUR (ADR-013 §2), and here in its strongest
 * form: no state and no qualifier is painted at all. Every one of them is a
 * TEXT NODE that names it, out of the shared bundles.
 *
 * NO IMAGE IS RENDERED (ADR-013 §4 and §5, FOUNDATION.md, non-negotiable):
 * there is no `<img>` in this module.
 *
 * THERE IS NO STYLESHEET HERE, AND THAT IS A DECISION OF 2026-09-03, NOT AN
 * OVERSIGHT. The panel ships SEMANTIC MARKUP WITH NO APPEARANCE DECIDED — no
 * colour, no typography, no invented token — because Alberto Fojo ruled that
 * `docs/diseno/` is the design system of the project and that the operator's
 * panel follows it too. That contradicts ADR-025 §4.2 and §4.3, which forbade
 * a measurement interface from deriving or copying anything of
 * `docs/diseno/`, and `sdd-arquitecto` is writing **ADR-026** to supersede
 * that point in part. CA-10 of SPEC-017 IS FROZEN until it is signed: writing
 * a palette now would be writing a palette to throw away, and — worse — it
 * would leave assertions in the suite saying the OPPOSITE of what ADR-026 is
 * going to say.
 *
 * What survives untouched is everything that is rule and not style: ADR-013
 * entire (no state told apart by colour alone, tabular digits, no crest, no
 * club palette, ≥ 4.5:1), and the markup below already satisfies the part of
 * it that markup can satisfy — every state and every qualifier is a TEXT NODE
 * that names it, and no `<img>` is rendered anywhere.
 */
import { TICKET_FIELD } from '../ticket';
import type { AdminText } from '@/i18n/admin';

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
export function text(value: AdminText): string {
  return escape(value);
}

/** The panel's document. It loads NOTHING: no stylesheet, no script, no font. */
export function document(locale: string, title: AdminText, body: string): string {
  return [
    '<!doctype html>',
    `<html lang="${escape(locale)}">`,
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<meta name="robots" content="noindex, nofollow">',
    `<title>${text(title)}</title>`,
    '</head>',
    '<body>',
    '<main>',
    body,
    '</main>',
    '</body>',
    '</html>',
  ].join('\n');
}

export function heading(level: 1 | 2 | 3, value: AdminText): string {
  return `<h${level}>${text(value)}</h${level}>`;
}

export function paragraph(value: AdminText, className = ''): string {
  const attribute = className === '' ? '' : ` class="${escape(className)}"`;
  return `<p${attribute}>${text(value)}</p>`;
}

/** A short-lived answer of the panel: what was published, or why it was not. */
export function notice(value: AdminText): string {
  return `<p class="notice">${text(value)}</p>`;
}

/** A labelled datum. The label is text; the value may be digits or a name. */
export function cell(value: AdminText, className = ''): string {
  const attribute = className === '' ? '' : ` class="${escape(className)}"`;
  return `<td${attribute}>${text(value)}</td>`;
}

export function headerCell(value: AdminText): string {
  return `<th scope="col">${text(value)}</th>`;
}

export function row(cells: readonly string[]): string {
  return `<tr>${cells.join('')}</tr>`;
}

/** The one wide element of the panel. `scroller` is a hook, not an appearance. */
export function table(head: string, body: readonly string[]): string {
  return `<div class="scroller"><table><thead>${head}</thead><tbody>${body.join(
    '',
  )}</tbody></table></div>`;
}

export function link(href: string, value: AdminText): string {
  return `<a href="${escape(href)}">${text(value)}</a>`;
}

/**
 * The cancel of a form: a plain link, ALWAYS PRESENT and reachable with the
 * keyboard because it is a link and nothing else. `data-cancel` marks it for
 * whatever CA-10 decides once ADR-026 is signed; today it decides nothing.
 */
export function cancel(href: string, value: AdminText): string {
  return `<a href="${escape(href)}" data-cancel>${text(value)}</a>`;
}

/**
 * A hidden field. THE TICKET IS ONE OF THESE AND NEVER A QUERY PARAMETER
 * (CA-7.4): it does not end up in the history, in an intermediary's log, or in
 * a screenshot.
 */
export function hidden(name: string, value: string): string {
  return `<input type="hidden" name="${escape(name)}" value="${escape(value)}">`;
}

export function ticketField(token: string): string {
  return hidden(TICKET_FIELD, token);
}

export interface FieldOptions {
  readonly name: string;
  readonly label: AdminText;
  readonly type: 'text' | 'password' | 'number';
  readonly value?: string | undefined;
  readonly required?: boolean | undefined;
}

export function field(options: FieldOptions): string {
  const id = `f-${options.name}`;
  const required = options.required === true ? ' required' : '';
  const value = options.value === undefined ? '' : ` value="${escape(options.value)}"`;
  const min = options.type === 'number' ? ' min="0" step="1" inputmode="numeric"' : '';
  return [
    `<label for="${escape(id)}">${text(options.label)}</label>`,
    `<input id="${escape(id)}" name="${escape(options.name)}" type="${options.type}"${value}${min}${required}>`,
  ].join('');
}

export function textArea(name: string, label: AdminText, hint: AdminText): string {
  const id = `f-${name}`;
  return [
    `<label for="${escape(id)}">${text(label)}</label>`,
    `<textarea id="${escape(id)}" name="${escape(name)}" required></textarea>`,
    `<p class="soft">${text(hint)}</p>`,
  ].join('');
}

export interface SelectOption {
  readonly value: string;
  readonly label: AdminText;
  readonly selected: boolean;
}

export function select(
  name: string,
  label: AdminText,
  options: readonly SelectOption[],
): string {
  const id = `f-${name}`;
  const rendered = options
    .map(
      (option) =>
        `<option value="${escape(option.value)}"${option.selected ? ' selected' : ''}>${text(
          option.label,
        )}</option>`,
    )
    .join('');
  return [
    `<label for="${escape(id)}">${text(label)}</label>`,
    `<select id="${escape(id)}" name="${escape(name)}">${rendered}</select>`,
  ].join('');
}

export function button(value: AdminText): string {
  return `<button type="submit">${text(value)}</button>`;
}

/**
 * A form of the panel. ALWAYS `method="post"` and always to the panel's own
 * address: nothing the panel does is a `GET` with side effects, and the ticket
 * cannot travel in a query string (CA-7.4).
 */
export function form(action: string, legend: AdminText, body: string): string {
  return [
    `<form method="post" action="${escape(action)}">`,
    '<fieldset>',
    `<legend>${text(legend)}</legend>`,
    body,
    '</fieldset>',
    '</form>',
  ].join('');
}

export function section(body: readonly string[]): string {
  return `<section>${body.join('')}</section>`;
}

export function listItem(body: string): string {
  return `<li class="row">${body}</li>`;
}

export function list(items: readonly string[]): string {
  return items.length === 0 ? '' : `<ul>${items.join('')}</ul>`;
}
