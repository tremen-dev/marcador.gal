/**
 * The webhook handler: secret, authorisation, routing. IT FAILS CLOSED
 * (ADR-022 §1, SPEC-015 CA-1, art. 32 of the GDPR, RN-08).
 *
 * THE ORDER IS THE SPEC (SPEC-015 §2), and every arrow is a guarantee a
 * criterion asserts:
 *
 *   1. secret ─────────────► 401. Zero archive, zero rows, no counter either
 *   2. authorisation ──────► neutral phrase. Zero archive, zero rows, +1 counter
 *   3. declared matchday ──► neutral phrase. Zero archive, zero rows
 *   4. redaction (whitelist)
 *   5. ARCHIVE of the message ─► RN-10: before looking at the text
 *   6. candidates ─────────► declared calendar, correspondent window, catalogue
 *   7. model ──────────────► the rendered prompt. Nothing else can go in
 *   8. ARCHIVE of the answer ─► RN-10: before validating it
 *   9. zod + match_id ∈ candidates ─► invalid ⇒ warning. Zero Observation
 *  10. pending proposal + CARD ─► HERE THERE IS NO ROW IN `observations`
 *  ─────────────────── the person looks ───────────────────
 *  11. callback: secret, authorisation, same correspondent
 *  12. ARCHIVE of the callback ─► RN-10
 *  13. discard / expire ──► acknowledgement. Zero Observation. Row deleted
 *  14. confirm ───────────► Observation(0.8) → append → narrow door of the engine
 *  15. acknowledgement ───► «rexistrado», and that it is not published yet
 *
 * STEPS 1, 2 AND 3 ARE NEGATIVE FRONTIERS and all three are asserted the same
 * way: not only «it answers what it should», but ZERO RAW OBJECTS, ZERO ROWS
 * AND NO IDENTIFIER IN ANY TRACE. An update that was refused HAS ALREADY BEEN
 * RECEIVED — Telegram pushes before we decide — so the only thing the spec can
 * guarantee is that IT LEAVES NO TRACE: it is counted, and the counter is an
 * aggregate with no person inside (`bot_rejections`, migration 0007).
 *
 * THE ROUTING DOES NOT USE grammY's MIDDLEWARE, and the reason is order and not
 * taste (ADR-022 §1): this handler checks the secret and authorises the sender
 * BEFORE touching the body, and a conversation framework decides on its own
 * when it parses. The sequence has to be ours to be assertable in a criterion.
 *
 * AND THERE IS NO `===` AGAINST THE SECRET anywhere in this module (CA-1.2):
 * the comparison is constant-time, written out, so a timing oracle over the
 * webhook's secret does not exist. `typeof` decides whether it is configured.
 */
import { createHash } from 'node:crypto';
import { PostgresMatchStore } from '@/db/matches';
import { PostgresObservationStore } from '@/db/observations';
import {
  PostgresCorrespondentStateStore,
  PostgresProposalStore,
  PostgresRejectionCounter,
  PostgresTeamNameStore,
} from '@/db/bot';
import { createClient, requireDatabaseUrl } from '@/db/client';
import { runEngineForMatch } from '@/decide/engine-entry';
import { ACTIVE_SEASON, MEASUREMENT_WINDOWS } from '@/ingest/measurement';
import { systemClock } from '@/polite/clock';
import { BlobRawStore } from '@/raw/blob';
import { loadCatalog } from './catalog';
import { readCorrespondentMap } from './correspondents';
import { unconfiguredModel } from './llm';
import { CORRESPONDENT_WINDOW, PROPOSAL_TTL_MS } from './windows';
import { archive, archiveThenParse } from './archive';
import { candidatesFor, matchdayIsOpen } from './candidates';
import { commandOf } from './commands';
import { confirmationCard, ambiguityMessage, languageMessage, parseCallbackData } from './card';
import { correspondentObservation } from './observation';
import { buildPrompt } from './prompt';
import { candidateOf, validateProposal } from './proposal';
import { redact } from './redact';
import { resolveCorrespondent } from './correspondents';
import { NOTHING_TO_SEND, message as asMessage, webhookBody } from './telegram';
import { MATCH_LINE, botBundle, fill, joinLines } from '@/i18n/bot';
import { MAILBOX } from '@/site/contact';
import { epochMsOf, instantOf } from '@/polite/clock';
import { MatchIdSchema } from '@/model/ids';
import type { NamedMatch } from './candidates';
import type { Correspondent, CorrespondentCatalog, CorrespondentMap } from './correspondents';
import type { ModelPort } from './llm';
import type { MatchCandidate } from './prompt';
import type {
  CorrespondentStateStore,
  PendingProposal,
  ProposalStore,
  RejectionCounter,
  TeamNameStore,
} from './ports';
import type { ChatRef, Outbound } from './telegram';
import type { BotLocale, BotText, BotTextBundle } from '@/i18n/bot';
import type { MatchStore } from '@/calendar/ports';
import type { ObservationStore } from '@/db/ports';
import type { EngineOutcomeSummary } from '@/decide/engine-entry';
import type { MeasurementWindow } from '@/ingest/windows';
import type { Clock } from '@/polite/clock';
import type { Instant, MatchId } from '@/model/ids';
import type { RawStore } from '@/raw/store';
import type { Sql } from '@/db/client';

/** Everything one update drives. Durable state lives BEHIND these. */
export interface BotPorts {
  readonly store: RawStore;
  readonly proposals: ProposalStore;
  readonly state: CorrespondentStateStore;
  readonly rejections: RejectionCounter;
  readonly observations: ObservationStore;
  readonly matches: MatchStore;
  readonly teams: TeamNameStore;
  readonly model: ModelPort;
  readonly clock: Clock;
  readonly catalog: CorrespondentCatalog;
  readonly map: CorrespondentMap;
  /** The declared matchdays (ADR-019 §3). BORN EMPTY: the bot is born off. */
  readonly windows: readonly MeasurementWindow[];
  /**
   * The NARROW DOOR of the engine (CA-9). Injected as a function so what the
   * bot holds is the ability to ASK, never a store: the composition below binds
   * it to `runEngineForMatch`, imported BY NAME.
   */
  readonly runEngine: (matchId: MatchId, now: Instant) => Promise<EngineOutcomeSummary>;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. The secret.
// ─────────────────────────────────────────────────────────────────────────────

/** The header Telegram sends the `secret_token` in. */
export const SECRET_HEADER = 'x-telegram-bot-api-secret-token';

/**
 * Constant-time comparison, written out.
 *
 * It compares EVERY character of both strings whatever it finds, so the time it
 * takes does not depend on how many leading characters matched. The lengths are
 * folded into the same accumulator instead of short-circuiting, because
 * returning early on a length mismatch is itself an oracle.
 */
export function constantTimeEquals(a: string, b: string): boolean {
  let difference = a.length ^ b.length;
  const length = a.length > b.length ? a.length : b.length;
  for (let index = 0; index < length; index += 1) {
    difference |= (a.codePointAt(index) ?? 0) ^ (b.codePointAt(index) ?? 0);
  }
  return difference === 0;
}

export interface WebhookOptions {
  readonly ports: BotPorts;
  /** Injected so the handler is provable without a child process (CA-1). */
  readonly env: Readonly<Record<string, string | undefined>>;
}

function json(body: unknown, status: number): Response {
  // `new Response`, never `Response.json`: the declared surface of the global
  // concedes the constructor and nothing else (CA-1.5, SPEC-009 CA-1).
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const unauthorized = (): Response => json({ error: 'unauthorized' }, 401);

/**
 * Builds the route's handler. A 401 DOES NO WORK: no port is touched, so no raw
 * object is written, no row appears and nothing is counted.
 */
export function telegramWebhookHandler(
  options: WebhookOptions,
): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> => {
    const secret = options.env['TELEGRAM_WEBHOOK_SECRET'];

    // Fails closed: an unset or empty secret refuses everything, and `typeof`
    // is what decides — never a comparison against the secret itself.
    if (typeof secret !== 'string' || secret.length === 0) return unauthorized();

    const offered = request.headers.get(SECRET_HEADER);
    if (offered === null || !constantTimeEquals(offered, secret)) return unauthorized();

    if (request.method !== 'POST') return json({ error: 'method' }, 405);

    let update: unknown;
    try {
      update = await request.json();
    } catch {
      return json({ error: 'body' }, 400);
    }

    return json(webhookBody(await handleUpdate(update, options.ports)), 200);
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Who is speaking.
// ─────────────────────────────────────────────────────────────────────────────

interface Incoming {
  readonly kind: 'message' | 'callback';
  /** The update AS IT ARRIVED. It is what the whitelist is applied to (CA-3). */
  readonly raw: unknown;
  readonly senderId: number;
  readonly chat: ChatRef;
  readonly text: string;
  readonly callbackId: string;
  readonly data: string;
}

function readIncoming(update: unknown): Incoming | null {
  if (update === null || typeof update !== 'object') return null;
  const root = update as Record<string, unknown>;

  const callback = asRecord(root['callback_query']);
  if (callback !== null) {
    const from = asRecord(callback['from']);
    const carrier = asRecord(callback['message']);
    const chat = asRecord(carrier?.['chat']);
    const senderId = from?.['id'];
    if (typeof senderId !== 'number') return null;
    return {
      kind: 'callback',
      raw: update,
      senderId,
      chat: { chat_id: typeof chat?.['id'] === 'number' ? chat['id'] : senderId },
      text: '',
      callbackId: typeof callback['id'] === 'string' ? callback['id'] : '',
      data: typeof callback['data'] === 'string' ? callback['data'] : '',
    };
  }

  const sent = asRecord(root['message']);
  if (sent === null) return null;
  const from = asRecord(sent['from']);
  const chat = asRecord(sent['chat']);
  const senderId = from?.['id'];
  if (typeof senderId !== 'number') return null;
  return {
    kind: 'message',
    raw: update,
    senderId,
    chat: { chat_id: typeof chat?.['id'] === 'number' ? chat['id'] : senderId },
    text: typeof sent['text'] === 'string' ? sent['text'] : '',
    callbackId: '',
    data: '',
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value === null || typeof value !== 'object' ? null : (value as Record<string, unknown>);
}

/**
 * Routes one update, already authenticated by the secret.
 *
 * The three negative frontiers happen here, in order, and NOTHING is archived
 * or persisted before all three have passed.
 */
export async function handleUpdate(update: unknown, ports: BotPorts): Promise<Outbound> {
  const now = ports.clock.now();
  const incoming = readIncoming(update);
  if (incoming === null) {
    await ports.rejections.record('unauthorised', now);
    return NOTHING_TO_SEND;
  }

  // 2. AUTHORISATION. Not mapped, not active in the catalogue, or opted out:
  // THE SAME STRING for the three, so the bot neither confirms nor denies who
  // is a correspondent (CA-2.2).
  const correspondent = resolveCorrespondent(ports.map, ports.catalog, incoming.senderId);
  if (correspondent === null) return await refuse(ports, incoming, now, 'unauthorised');

  const state = await ports.state.get(correspondent.correspondent_id);
  if (state !== null && state.opted_out_at !== null) {
    return await refuse(ports, incoming, now, 'unauthorised');
  }

  // The language is the STORED PREFERENCE, never the client's `language_code`
  // (ADR-022 §8). No preference means galego, which is the default (D-2).
  const locale: BotLocale = state?.locale ?? 'gl';
  const bundle = botBundle(locale);

  if (incoming.kind === 'callback') {
    return await onCallback(ports, incoming, correspondent, locale, now);
  }

  const command = commandOf(incoming.text);
  if (command !== null) {
    return await onCommand(command, ports, incoming, correspondent, locale, now);
  }

  // CA-14.2 — somebody who has never received the notice does not get their
  // message processed: they get the notice first. Zero raw objects, zero rows.
  if (state === null || state.notice_sent_at === null) {
    await ports.rejections.record('notice_pending', now);
    await ports.state.markNoticeSent(correspondent.correspondent_id, now);
    return reply(incoming.chat, noticeText(bundle));
  }

  return await onContent(ports, incoming, correspondent, locale, now);
}

async function refuse(
  ports: BotPorts,
  incoming: Incoming,
  now: Instant,
  reason: 'unauthorised' | 'out_of_matchday',
  locale: BotLocale = 'gl',
): Promise<Outbound> {
  await ports.rejections.record(reason, now);
  const bundle = botBundle(locale);
  return reply(
    incoming.chat,
    reason === 'unauthorised' ? bundle.errNotAuthorised : bundle.errNoOpenMatch,
  );
}

const reply = (chat: ChatRef, text: BotText): Outbound => asMessage({ chat, text });

// ─────────────────────────────────────────────────────────────────────────────
// 3. The commands.
// ─────────────────────────────────────────────────────────────────────────────

function noticeText(bundle: BotTextBundle): BotText {
  return joinLines(
    fill(bundle.noticeController, { mailbox: MAILBOX }),
    bundle.noticeWhat,
    bundle.noticePurpose,
    bundle.noticeLegalBasis,
    bundle.noticeAiProvider,
    bundle.noticeRetention,
    fill(bundle.noticeRights, { mailbox: MAILBOX }),
    bundle.noticeDoNotSend,
    bundle.noticeLink,
  );
}

async function onCommand(
  command: string,
  ports: BotPorts,
  incoming: Incoming,
  correspondent: Correspondent,
  locale: BotLocale,
  now: Instant,
): Promise<Outbound> {
  const bundle = botBundle(locale);

  if (command === 'start') {
    await ports.state.markNoticeSent(correspondent.correspondent_id, now);
    return reply(
      incoming.chat,
      joinLines(
        bundle.startWho,
        bundle.startWhat,
        bundle.startNotPublished,
        noticeText(bundle),
        bundle.startHelpHint,
      ),
    );
  }

  if (command === 'privacidade') return reply(incoming.chat, noticeText(bundle));

  if (command === 'axuda') {
    return reply(
      incoming.chat,
      joinLines(
        bundle.helpIntro,
        bundle.helpExamples,
        bundle.helpOrder,
        bundle.helpIfWrong,
        bundle.helpCommands,
      ),
    );
  }

  if (command === 'lingua') return asMessage(languageMessage(locale, incoming.chat));

  if (command === 'cancelar') {
    const pending = await ports.proposals.latestOf(correspondent.correspondent_id);
    if (pending === null) return reply(incoming.chat, bundle.errNothingPending);
    await ports.proposals.remove(pending.id);
    return reply(incoming.chat, bundle.ackDiscarded);
  }

  if (command === 'partidos') {
    const candidates = await openCandidates(ports, correspondent, now);
    if (candidates.length === 0) return reply(incoming.chat, bundle.errNoOpenMatch);
    return reply(
      incoming.chat,
      joinLines(bundle.openMatchesHeading, ...candidates.map(matchLine)),
    );
  }

  // `/baixa` and `/parar` do the same thing, and that is deliberate: the bot
  // pushes nothing at anybody, so the only «aviso» it can stop sending is its
  // own answer. Promising two different things would be promising one the
  // system does not do (CA-14.6).
  await ports.state.optOut(correspondent.correspondent_id, now);
  const pending = await ports.proposals.latestOf(correspondent.correspondent_id);
  if (pending !== null) await ports.proposals.remove(pending.id);
  return reply(incoming.chat, fill(bundle.optOutDone, { mailbox: MAILBOX }));
}

function matchLine(candidate: MatchCandidate): BotText {
  return fill(MATCH_LINE, { home: candidate.home, away: candidate.away });
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. A message of content: the whole path of §2.
// ─────────────────────────────────────────────────────────────────────────────

async function namedMatches(
  ports: BotPorts,
  now: Instant,
): Promise<readonly NamedMatch[]> {
  const nowMs = epochMsOf(now);
  const matches = await ports.matches.listKickoffsBetween(
    instantOf(nowMs - CORRESPONDENT_WINDOW.postMs),
    instantOf(nowMs + CORRESPONDENT_WINDOW.preMs),
  );

  const names = await ports.teams.namesOf(
    matches.flatMap((match) => [match.home_id, match.away_id]),
  );

  return matches.map((match) => ({
    match,
    home: names.get(match.home_id) ?? match.home_id,
    away: names.get(match.away_id) ?? match.away_id,
  }));
}

async function openCandidates(
  ports: BotPorts,
  correspondent: Correspondent,
  now: Instant,
): Promise<readonly MatchCandidate[]> {
  return candidatesFor({
    matches: await namedMatches(ports, now),
    competitions: correspondent.competitions,
    windows: ports.windows,
    at: now,
  });
}

async function onContent(
  ports: BotPorts,
  incoming: Incoming,
  correspondent: Correspondent,
  locale: BotLocale,
  now: Instant,
): Promise<Outbound> {
  const bundle = botBundle(locale);
  const matches = await namedMatches(ports, now);

  // 3. THE DECLARED MATCHDAY. With the production list — which is EMPTY — this
  // is where every message stops: neutral phrase, zero archive, zero rows and
  // NOT ONE CALL TO THE MODEL (CA-13.1, CA-13.4). It is checked with
  // `inMeasurementWindow`, the function that already exists (CA-13.3).
  const open = matchdayIsOpen({
    matches,
    competitions: correspondent.competitions,
    windows: ports.windows,
    at: now,
  });
  if (!open) return await refuse(ports, incoming, now, 'out_of_matchday', locale);

  // 4 and 5. REDACTION AND ARCHIVE, BEFORE LOOKING AT THE TEXT (RN-10).
  const messageRawRef = await archive(
    ports.store,
    'mensaxe',
    now,
    redact(incoming.raw, correspondent.correspondent_id),
  );

  // 6. THE CANDIDATES, from the declared calendar.
  const candidates = candidatesFor({
    matches,
    competitions: correspondent.competitions,
    windows: ports.windows,
    at: now,
  });
  if (candidates.length === 0) return reply(incoming.chat, bundle.errMatchNotFound);

  // 7. THE MODEL. The rendered prompt goes in, and nothing else can: the type
  // of `buildPrompt` has no field able to carry identity (CA-5.1).
  const answer = await ports.model.propose(buildPrompt({ text: incoming.text, candidates }));
  if (!answer.ok) return reply(incoming.chat, bundle.errServiceDown);

  // 8 and 9. ARCHIVE OF THE ANSWER, AND ONLY THEN zod (RN-10, CA-4.1).
  const outcome = await archiveThenParse(
    ports.store,
    'proposta',
    now,
    { body: decodeBody(answer.body) },
    (rawRef) => ({ rawRef, validated: validateProposal(answer.body, candidates) }),
  );

  if (!outcome.validated.ok) {
    return reply(
      incoming.chat,
      outcome.validated.reason === 'unknown_match'
        ? bundle.errMatchNotFound
        : bundle.errNotUnderstood,
    );
  }

  // 10. THE PENDING PROPOSAL AND THE CARD. THERE IS NO ROW IN `observations`
  // AT THIS POINT, and CA-7.1 asserts exactly that against the database.
  const proposal = outcome.validated.proposal;
  const pending: PendingProposal = {
    id: proposalId(messageRawRef, outcome.rawRef),
    correspondent_id: correspondent.correspondent_id,
    match_id: proposal.match_id,
    proposal,
    message_raw_ref: messageRawRef,
    proposal_raw_ref: outcome.rawRef,
    created_at: now,
    expires_at: instantOf(epochMsOf(now) + PROPOSAL_TTL_MS),
  };
  await ports.proposals.put(pending);

  const candidate = candidateOf(candidates, proposal.match_id);
  if (candidate === null) {
    // The model did not identify one. IT IS NOT GUESSED: it goes back to the
    // person as a keyboard of CANONICAL names (CA-6.4, ADR-022 §5).
    return asMessage(ambiguityMessage({ locale, chat: incoming.chat, candidates }));
  }

  return asMessage(
    confirmationCard({
      locale,
      chat: incoming.chat,
      proposalId: pending.id,
      proposal,
      candidate,
    }),
  );
}

function decodeBody(body: Uint8Array): string {
  return new TextDecoder().decode(body);
}

/**
 * The identifier of a proposal, DERIVED and never drawn. The same two archived
 * objects produce the same proposal, so confirming twice is idempotent all the
 * way down to the `ObservationId` (CA-8.4). There is no randomness here.
 */
function proposalId(messageRawRef: string, proposalRawRef: string): string {
  return createHash('sha256').update(`${messageRawRef}\n${proposalRawRef}`).digest('hex').slice(0, 32);
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. The button: the instant RN-09 is about.
// ─────────────────────────────────────────────────────────────────────────────

async function onCallback(
  ports: BotPorts,
  incoming: Incoming,
  correspondent: Correspondent,
  locale: BotLocale,
  now: Instant,
): Promise<Outbound> {
  const bundle = botBundle(locale);
  const action = parseCallbackData(incoming.data);
  if (action === null) return reply(incoming.chat, bundle.errNothingPending);

  if (action.kind === 'l') {
    const chosen: BotLocale = action.argument === 'es' ? 'es' : 'gl';
    await ports.state.setLocale(correspondent.correspondent_id, chosen);
    return reply(incoming.chat, botBundle(chosen).languageChanged);
  }

  if (action.kind === 'm') {
    const pending = await ports.proposals.latestOf(correspondent.correspondent_id);
    if (pending === null) return reply(incoming.chat, bundle.cardExpired);
    const picked = await ports.proposals.pick(pending.id, MatchIdSchema.parse(action.argument));
    if (picked === null) return reply(incoming.chat, bundle.errNothingPending);

    const candidates = await openCandidates(ports, correspondent, now);
    const candidate = candidateOf(candidates, picked.match_id);
    if (candidate === null) return reply(incoming.chat, bundle.errMatchNotFound);

    return asMessage(
      confirmationCard({
        locale,
        chat: incoming.chat,
        proposalId: picked.id,
        proposal: { ...picked.proposal, match_id: picked.match_id },
        candidate,
      }),
    );
  }

  const pending = await ports.proposals.getById(action.argument);
  // CA-7.5 — a repeated callback over an already resolved proposal does NOT
  // produce a second Observation: the row is gone and the bot says so.
  if (pending === null) return reply(incoming.chat, bundle.errNothingPending);

  // CA-7.4 — ONLY THE SAME CORRESPONDENT may confirm their own proposal.
  // The neutral phrase, and nothing is written.
  if (pending.correspondent_id !== correspondent.correspondent_id) {
    return reply(incoming.chat, botBundle('gl').errNotAuthorised);
  }

  // CA-7.3 — EXPIRY. The same outcome as discarding — the row goes, nothing is
  // written — with the notice that asks for it again IN CASE SOMETHING CHANGED,
  // which is the whole reason a scoreboard confirmed from memory is not one.
  // The TTL is a named constant in one place (`./windows.ts`).
  if (pending.expires_at <= now) {
    await ports.proposals.removeExpired(now);
    return reply(incoming.chat, bundle.cardExpired);
  }

  if (action.kind === 'd') {
    await ports.proposals.remove(pending.id);
    return reply(incoming.chat, bundle.ackDiscarded);
  }

  // 12. THE ARCHIVE OF THE CALLBACK, before anything is written (RN-10).
  await archive(
    ports.store,
    'confirmacion',
    now,
    redact(incoming.raw, correspondent.correspondent_id),
  );

  const matchId = pending.match_id;
  if (matchId === null) return reply(incoming.chat, bundle.errMatchNotFound);

  // 14. THE `Observation`. THIS is the instant CA-7.1 divides the world at.
  const observation = correspondentObservation({ ...pending, match_id: matchId }, now);
  await ports.observations.append(observation);
  await ports.proposals.remove(pending.id);

  // And the engine runs ON THE SPOT, through a door that hands over no store
  // (CA-9, ADR-021 §3, ADR-022 §9).
  await ports.runEngine(matchId, now);

  const candidate = candidateOf(await openCandidates(ports, correspondent, now), matchId);
  return reply(
    incoming.chat,
    joinLines(
      fill(bundle.ackRegistered, {
        home: candidate?.home ?? matchId,
        away: candidate?.away ?? matchId,
        homeScore: `${pending.proposal.home_score ?? 0}`,
        awayScore: `${pending.proposal.away_score ?? 0}`,
      }),
      bundle.ackNotPublication,
    ),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. The production composition.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The durable implementations (Postgres, Blob), the system clock, the DECLARED
 * configuration — season, catalogue and measurement windows — and the model
 * port with NO ADAPTER BEHIND IT (ADR-023 §6.4). Composed anew on every
 * invocation, which on Vercel is every instance (ADR-004); only the connection
 * pool is kept, exactly as `productionCronTick` and `productionCycle` do.
 *
 * `runEngineForMatch` IS IMPORTED BY NAME (CA-9.3). An `import * as` over
 * `src/decide/` would be an offence of the frontier of RN-08, and rightly so.
 *
 * IT LIVES HERE AND NOT IN THE ROUTE because a `route.ts` of Next cannot export
 * constants of its own, and because CA-1.6 asks that the route import nothing
 * of `src/db/`, `src/raw/` or `src/decide/`: it delegates whole, like
 * `src/app/api/cron/ingest/route.ts`.
 */
export const TELEGRAM_WEBHOOK_PATH = '/api/telegram/webhook';

let productionSql: Sql | null = null;

export async function productionBotPorts(): Promise<BotPorts> {
  productionSql ??= createClient(requireDatabaseUrl());
  const sql = productionSql;

  return {
    store: new BlobRawStore(),
    proposals: new PostgresProposalStore(sql),
    state: new PostgresCorrespondentStateStore(sql),
    rejections: new PostgresRejectionCounter(sql),
    observations: new PostgresObservationStore(sql),
    matches: new PostgresMatchStore(sql),
    teams: new PostgresTeamNameStore(sql),
    // No provider is chosen and no DPA is stored (ADR-023 §6.4), so the port
    // has no adapter: the bot answers `errServiceDown` and writes nothing.
    model: unconfiguredModel(),
    clock: systemClock,
    catalog: await loadCatalog(ACTIVE_SEASON),
    map: readCorrespondentMap(process.env),
    // BORN EMPTY (ADR-019 §3): with nothing declared the bot recollects nothing.
    windows: MEASUREMENT_WINDOWS,
    runEngine: (matchId, now) => runEngineForMatch({ sql, matchId, now }),
  };
}

/** The handler the route binds. Authentication and routing, nothing else. */
export function productionTelegramWebhook(): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> => {
    const secret = process.env['TELEGRAM_WEBHOOK_SECRET'];
    if (typeof secret !== 'string' || secret.length === 0) return unauthorized();

    return await telegramWebhookHandler({
      ports: await productionBotPorts(),
      env: process.env,
    })(request);
  };
}
