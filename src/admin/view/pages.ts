/**
 * The four screens of the panel (SPEC-017 CA-9, CA-12; ADR-013).
 *
 * The panel is a WORK QUEUE, so it is ordered by what needs a person and not
 * by qualifier (CA-12.3), and it is dense: everything on one screen (D-8).
 *
 * EVERY STATE AND EVERY QUALIFIER IS A TEXT NODE THAT NAMES IT (ADR-013 §2).
 * Nothing here is told apart by colour; there is no colour to tell anything
 * apart by.
 *
 * THE APPEARANCE COMES FROM `src/design/` AND FROM NOWHERE ELSE (ADR-026 §3.1).
 * This module writes STRUCTURE and CLASS NAMES; the values live in the tokens
 * and the sheet is `./styles.ts`.
 *
 * THE CLASS OF A STATE OR OF A QUALIFIER IS ITS MODEL IDENTIFIER, never its
 * visible form: `s-live`, `q-sen-sinal`. `live` is the identifier of
 * `MATCH_STATUSES` and `sen_sinal` is one of `MATCH_QUALIFIERS` — English and
 * galego domain vocabulary respectively, both of them identifiers. The VISIBLE
 * word always comes out of `src/i18n/`, so `live` reads *En xogo* and never
 * *Directo* (ADR-026 §4.4), and no state is ever `FIN`, `APR` or `DESC`, nor a
 * qualifier a `?` or a `!` (ADR-026 §4.2 and §4.3).
 *
 * AND THE COLOUR IS NEVER THE ONLY DISTINCTION (ADR-013 §2, ADR-026 §4.1): the
 * class paints, and the text node beside it names. `provisional` and
 * `confirmado` get the SAME colour and BOTH get their label — the system
 * leaves `confirmado` mute («el normal no se anuncia») and here the normal one
 * is the other; dimming either would be entry 1 of EPIC-004's inventory
 * repeated with code on top (ADR-026 §2).
 *
 * THE ESCAPE STEP (ADR-025 §2.5, INTACT — the system has no focus management
 * at all, ADR-026 §4.6). Every form of this panel WORKS WITH NO JAVASCRIPT: it
 * is a plain `POST` form with a visible cancel link, reachable with the
 * keyboard like any other link. The eight lines below only add the `Escape`
 * gesture on top — they clear the form being written and move the focus to
 * that form's own cancel link, which is the control that leaves it. Nothing
 * here traps the focus, because there is nothing modal to trap it in.
 */
import { MATCH_STATUSES } from '@/model/match';
import type { MatchStatus } from '@/model/match';
import type { MatchQualifier } from '@/model/qualifier';
import {
  ADMIN_MATCH_LINE,
  ADMIN_SCORE_LINE,
  ADMIN_VALUE,
  adminBundle,
  adminQualifier,
  adminStatus,
  digits,
  fill,
} from '@/i18n/admin';
import {
  button,
  cancel,
  document as panelDocument,
  field,
  form,
  heading,
  headerCell,
  hidden,
  link,
  list,
  listItem,
  notice as noticeBlock,
  paragraph,
  row,
  section,
  select,
  table,
  textArea,
  ticketField,
  cell,
} from './markup';
import type { AlertTray } from '../alerts';
import type { BoardRow, MatchDetail } from '../board';
import type { AdminAction } from '../archive';
import type { AdminLocale, AdminText } from '@/i18n/admin';

/**
 * `Escape` leaves the step being written and gives the focus back to the
 * control that leaves it (ADR-025 §2.5). Enhancement only: with the script off
 * the cancel link is still there, still reachable, still focusable.
 */
const ESCAPE_SCRIPT = `
document.addEventListener('keydown', function (event) {
  if (event.key !== 'Escape') return;
  var target = event.target;
  if (!target || !target.closest) return;
  var owner = target.closest('form');
  if (!owner) return;
  owner.reset();
  var back = owner.querySelector('[data-cancel]');
  if (back) back.focus();
});
`;

function scriptTag(): string {
  return `<script>${ESCAPE_SCRIPT}</script>`;
}

/** The names of the form fields. One place, so no view invents a second. */
export const FIELDS = {
  intent: 'intento',
  operator: 'operador',
  secret: 'clave',
  action: 'accion',
  match: 'partido',
  alert: 'alerta',
  status: 'estado',
  homeScore: 'goles_casa',
  awayScore: 'goles_fora',
  reason: 'motivo',
} as const;

/** The two things a `POST` to the panel can be. A closed list. */
export const INTENTS = ['acceso', 'accion'] as const;

export type Intent = (typeof INTENTS)[number];

/** Where a ticket comes from. The handler binds it; the view never signs. */
export type TicketFor = (action: AdminAction, target: string) => string;

export interface PanelPaths {
  /** The panel's own address: `/admin` or `/es/admin` (CA-9.2). */
  readonly root: string;
}

/** The way in. NOTHING of the database is read to render this (CA-1). */
export function accessPage(locale: AdminLocale, refused: boolean): string {
  const bundle = adminBundle(locale);
  const paths = pathsOf(locale);

  const body = [
    heading(1, bundle.accessHeading),
    refused ? noticeBlock(bundle.accessRefused) : '',
    form(
      paths.root,
      bundle.accessHeading,
      [
        hidden(FIELDS.intent, 'acceso'),
        field({ name: FIELDS.operator, label: bundle.accessOperator, type: 'text', required: true }),
        field({ name: FIELDS.secret, label: bundle.accessSecret, type: 'password', required: true }),
        button(bundle.accessSubmit),
      ].join(''),
    ),
  ].join('');

  return panelDocument(locale, bundle.title, body);
}

/** The addresses of the panel in each language (CA-9.2: from the URL). */
export function pathsOf(locale: AdminLocale): PanelPaths {
  return { root: locale === 'es' ? '/es/admin' : '/admin' };
}

function matchLine(entry: BoardRow): AdminText {
  return fill(ADMIN_MATCH_LINE, { home: entry.home, away: entry.away });
}

function scoreCell(locale: AdminLocale, entry: BoardRow): AdminText {
  if (entry.home_score === null || entry.away_score === null) {
    return adminBundle(locale).boardNoDecision;
  }
  return fill(ADMIN_SCORE_LINE, {
    home: `${entry.home_score}`,
    away: `${entry.away_score}`,
  });
}

function value(raw: string): AdminText {
  return fill(ADMIN_VALUE, { value: raw });
}

/** The class of a state: its MODEL IDENTIFIER, never its visible form. */
function statusClass(status: MatchStatus): string {
  return `s-${status}`;
}

/** The class of a qualifier, likewise. `sen_sinal` → `q-sen-sinal`. */
function qualifierClass(qualifier: MatchQualifier): string {
  return `q-${qualifier.replaceAll('_', '-')}`;
}

export interface BoardView {
  readonly rows: readonly BoardRow[];
  readonly tray: AlertTray;
  readonly ticketFor: TicketFor;
  readonly notice: AdminText | null;
}

/** The board, and the tray under it. One screen (D-8). */
export function boardPage(locale: AdminLocale, view: BoardView): string {
  const bundle = adminBundle(locale);
  const paths = pathsOf(locale);

  const head = row([
    headerCell(bundle.boardMatch),
    headerCell(bundle.boardStatus),
    headerCell(bundle.boardScore),
    headerCell(bundle.boardQualifier),
    headerCell(bundle.boardLastSeen),
    headerCell(bundle.boardOpenAlerts),
  ]);

  const body = view.rows.map((entry) =>
    row([
      `<td>${link(`${paths.root}?${FIELDS.match}=${encodeURIComponent(entry.match.id)}`, matchLine(entry))}</td>`,
      cell(adminStatus(locale, entry.status), statusClass(entry.status)),
      cell(scoreCell(locale, entry), 'score'),
      cell(
        entry.qualifier === null
          ? bundle.boardNoDecision
          : adminQualifier(locale, entry.qualifier),
        entry.qualifier === null ? '' : qualifierClass(entry.qualifier),
      ),
      cell(
        entry.last_observed_at === null ? bundle.boardNever : value(entry.last_observed_at),
        'instant',
      ),
      cell(digits(entry.open_alerts), 'num'),
    ]),
  );

  const board =
    view.rows.length === 0
      ? paragraph(bundle.boardEmpty)
      : table(head, body);

  return panelDocument(
    locale,
    bundle.title,
    [
      heading(1, bundle.boardHeading),
      view.notice === null ? '' : noticeBlock(view.notice),
      board,
      trayBlock(locale, view.tray, view.ticketFor),
      scriptTag(),
    ].join(''),
  );
}

function trayBlock(locale: AdminLocale, tray: AlertTray, ticketFor: TicketFor): string {
  const bundle = adminBundle(locale);

  if (tray.open.length === 0 && tray.acknowledged.length === 0) {
    return section([heading(2, bundle.trayHeading), paragraph(bundle.trayEmpty)]);
  }

  const open = tray.open.map((entry) =>
    listItem(
      [
        paragraph(value(`${entry.alert.rule} · ${entry.alert.match_id}`)),
        paragraph(value(entry.alert.reason)),
        paragraph(value(entry.alert.raised_at), 'instant'),
        form(
          pathsOf(locale).root,
          bundle.trayAcknowledge,
          [
            hidden(FIELDS.intent, 'accion'),
            hidden(FIELDS.action, 'acuse'),
            hidden(FIELDS.alert, `${entry.alert.id}`),
            ticketField(ticketFor('acuse', `${entry.alert.id}`)),
            textArea(FIELDS.reason, bundle.formReason, bundle.formReasonHint),
            button(bundle.trayAcknowledge),
            cancelLink(locale),
          ].join(''),
        ),
      ].join(''),
    ),
  );

  const acknowledged = tray.acknowledged.map((entry) =>
    listItem(
      [
        paragraph(value(`${entry.alert.rule} · ${entry.alert.match_id}`)),
        paragraph(value(entry.alert.reason)),
        paragraph(value(entry.acked_at ?? ''), 'instant'),
      ].join(''),
    ),
  );

  return section([
    heading(2, bundle.trayHeading),
    paragraph(bundle.trayNotPublished, 'soft'),
    heading(3, bundle.trayOpen),
    open.length === 0 ? paragraph(bundle.trayEmpty) : list(open),
    heading(3, bundle.trayAcknowledged),
    acknowledged.length === 0 ? paragraph(bundle.trayEmpty) : list(acknowledged),
  ]);
}

/** The cancel of a form: a plain link, always present and never modal. */
function cancelLink(locale: AdminLocale): string {
  return cancel(pathsOf(locale).root, adminBundle(locale).formCancel);
}

export interface DetailView {
  readonly detail: MatchDetail;
  readonly ticketFor: TicketFor;
  readonly notice: AdminText | null;
}

/**
 * The detail of one match: EVERY SOURCE AND THE WHOLE LOG (CA-12.2). It is the
 * letter of RN-01 — «con el contexto de todas las fuentes y del histórico
 * delante» — and it is not decoration: without it, weight 1.0 is exercised
 * blind.
 */
export function detailPage(locale: AdminLocale, view: DetailView): string {
  const bundle = adminBundle(locale);
  const paths = pathsOf(locale);
  const entry = view.detail.row;
  const target = entry.match.id;

  const statusOptions = MATCH_STATUSES.map((status) => ({
    value: status,
    label: adminStatus(locale, status),
    selected: status === entry.status,
  }));

  const observations = table(
    row([
      headerCell(bundle.detailSource),
      headerCell(bundle.boardStatus),
      headerCell(bundle.boardScore),
      headerCell(bundle.detailConfidence),
      headerCell(bundle.detailObservedAt),
    ]),
    view.detail.observations.map((observation) =>
      row([
        cell(value(observation.source)),
        cell(adminStatus(locale, observation.status), statusClass(observation.status)),
        cell(
          observation.home_score === null || observation.away_score === null
            ? bundle.boardNoDecision
            : fill(ADMIN_SCORE_LINE, {
                home: `${observation.home_score}`,
                away: `${observation.away_score}`,
              }),
          'score',
        ),
        cell(value(`${observation.confidence}`), 'num'),
        cell(value(observation.observed_at), 'instant'),
      ]),
    ),
  );

  const decisions = table(
    row([
      headerCell(bundle.detailVersion),
      headerCell(bundle.boardStatus),
      headerCell(bundle.boardScore),
      headerCell(bundle.detailRule),
      headerCell(bundle.detailSupport),
    ]),
    view.detail.decisions.map((decision) =>
      row([
        cell(digits(decision.version), 'num'),
        cell(adminStatus(locale, decision.status), statusClass(decision.status)),
        cell(
          decision.home_score === null || decision.away_score === null
            ? bundle.boardNoDecision
            : fill(ADMIN_SCORE_LINE, {
                home: `${decision.home_score}`,
                away: `${decision.away_score}`,
              }),
          'score',
        ),
        cell(value(decision.rule)),
        cell(value(decision.supporting_observation_ids.join(' '))),
      ]),
    ),
  );

  const common = (action: AdminAction): string =>
    [
      hidden(FIELDS.intent, 'accion'),
      hidden(FIELDS.action, action),
      hidden(FIELDS.match, target),
      ticketField(view.ticketFor(action, target)),
    ].join('');

  const correction = form(
    paths.root,
    bundle.formCorrection,
    [
      common('correccion'),
      select(FIELDS.status, bundle.formStatus, statusOptions),
      field({
        name: FIELDS.homeScore,
        label: bundle.formHomeScore,
        type: 'number',
        value: `${entry.home_score ?? 0}`,
      }),
      field({
        name: FIELDS.awayScore,
        label: bundle.formAwayScore,
        type: 'number',
        value: `${entry.away_score ?? 0}`,
      }),
      textArea(FIELDS.reason, bundle.formReason, bundle.formReasonHint),
      button(bundle.formSubmit),
      cancelLink(locale),
    ].join(''),
  );

  const statusChange = form(
    paths.root,
    bundle.formStatusChange,
    [
      common('estado'),
      select(FIELDS.status, bundle.formStatus, statusOptions),
      textArea(FIELDS.reason, bundle.formReason, bundle.formReasonHint),
      button(bundle.formSubmit),
      cancelLink(locale),
    ].join(''),
  );

  const ratify = form(
    paths.root,
    bundle.formRatify,
    [
      common('ratificacion'),
      textArea(FIELDS.reason, bundle.formReason, bundle.formReasonHint),
      button(bundle.formSubmit),
      cancelLink(locale),
    ].join(''),
  );

  return panelDocument(
    locale,
    bundle.title,
    [
      heading(1, bundle.detailHeading),
      view.notice === null ? '' : noticeBlock(view.notice),
      paragraph(matchLine(entry)),
      paragraph(adminStatus(locale, entry.status), statusClass(entry.status)),
      paragraph(scoreCell(locale, entry), 'score'),
      paragraph(
        entry.qualifier === null ? bundle.boardNoDecision : adminQualifier(locale, entry.qualifier),
        entry.qualifier === null ? '' : qualifierClass(entry.qualifier),
      ),
      correction,
      statusChange,
      ratify,
      heading(2, bundle.detailObservations),
      observations,
      heading(2, bundle.detailDecisions),
      decisions,
      link(paths.root, bundle.detailBack),
      scriptTag(),
    ].join(''),
  );
}
