/**
 * THE SCRIPT: it asks `/api/board` with its `ETag`, SUBSTITUTES VALUES, and
 * does nothing else (SPEC-018 CA-9, ADR-027 §5).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHAT IT IS NOT ALLOWED TO DO, WHICH IS WHERE THIS SCREEN DIFFERS FROM EVERY
 * OTHER ONE IN THIS PROJECT.
 *
 *   * IT DOES NOT REBUILD ROWS. There is no `innerHTML` over the container of
 *     the table in this file — there is no `innerHTML` at all — and no row is
 *     created or removed. What it writes is `textContent` OF IDENTIFIED CELLS
 *     (CA-9.3). A screen that rebuilt its table would lose the focus of
 *     whoever is reading it with a keyboard, and would flash on every poll.
 *   * A FAILED REFRESH ERASES NOTHING AND DIMS NOTHING (CA-9.4). In the error
 *     branch it does NOT touch one class, one style or one value of one row:
 *     the only thing that changes is THE PAGE'S NOTICE, which says how many
 *     minutes old what is on screen is. Dimming the scoreboard because the
 *     network failed would be switching off a datum for a reason that is not
 *     the datum's (ADR-013 §6).
 *   * IT DOES NOT SAY WHOSE FAULT IT IS (ADR-027 §4.4). The literals come from
 *     the bundle and the bundle may not name a connection, a coverage or a
 *     network: the system does not know whether the failure is the phone's,
 *     the network's or the server's.
 *   * IT NEVER ASKS A THIRD PARTY FOR ANYTHING (CA-1.4, CA-1.5, RN-11). The
 *     ONE URL it fetches is a relative path of this same origin. A refresh
 *     that asked THE SOURCE on demand would turn `N` readers into `N` requests
 *     to a third party and BLOW UP RN-11 IN THE FIRST MINUTE without the
 *     number of the rule having changed — which is the worst failure mode
 *     available to this spec and the one `sdd-legal-datos` §6.2.8 names.
 *   * IT STORES NOTHING (CA-2.4). No cookie, no `localStorage`, no
 *     `sessionStorage`: the transport's clock lives in the tab of whoever is
 *     looking and dies with it (ADR-027 §4.5).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THE PAGE IS CORRECT WITHOUT IT (CA-9.2). The server serves the board ALREADY
 * PAINTED: the first byte carries the matches, the scoreboards, the states and
 * the qualifiers. There is no loading skeleton and no «cargando» string in the
 * served document — THE LOADING STATE IS NOT DESIGNED BECAUSE IT DOES NOT
 * EXIST (ADR-027 §5). Removing this `<script>` does not change one value of the
 * table.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHAT THIS FILE'S TESTS SEE, DECLARED (CA-9.5): they read THE SOURCE OF THE
 * SCRIPT, not its execution. NO TEST OF THIS SUITE RUNS JAVASCRIPT IN A
 * BROWSER — that is CA-16, and it is done by a person with a capture.
 */
import { BOARD_API_PATH, REFRESH_SECONDS } from '@/api/freshness';

/** The id of the `<script type="application/json">` the script reads from. */
export const CONFIG_ELEMENT_ID = 'board-config';

/** The id of the page's transport notice. Outside the table (CA-8.2). */
export const TRANSPORT_ELEMENT_ID = 'board-transport';

/** The attribute that identifies a row by its `match_id`. */
export const ROW_ATTRIBUTE = 'data-match';

/** The attribute that identifies a cell within a row by the field it carries. */
export const CELL_ATTRIBUTE = 'data-field';

/**
 * The script, as text. It is embedded inline in the document — there is no
 * external script and no third-party host (CA-1.5) — and everything it says to
 * a person comes out of the JSON block the markup writes, which comes out of
 * the i18n bundle (D-2).
 */
export const REFRESH_SCRIPT = `(function(){
  var raw = document.getElementById(${JSON.stringify(CONFIG_ELEMENT_ID)});
  if (!raw) return;
  var cfg = JSON.parse(raw.textContent || '{}');
  var notice = document.getElementById(${JSON.stringify(TRANSPORT_ELEMENT_ID)});
  if (!notice) return;

  var tag = cfg.etag || null;
  var lastOk = Date.now();

  function minutes(since){ return Math.floor((Date.now() - since) / 60000); }
  function fill(template, n){ return String(template).split('{n}').join(String(n)); }

  function say(text){ notice.textContent = text; }

  function sayFresh(){
    var n = minutes(lastOk);
    say(n < 1 ? cfg.refreshedNow : fill(cfg.refreshedMinutes, n));
  }

  // THE ERROR BRANCH. It touches the notice and NOTHING ELSE: not a class, not
  // a style, not a value of a row.
  function sayStale(){
    var n = minutes(lastOk);
    say(fill(cfg.refreshFailed, n) + ' ' + cfg.reloadHint);
  }

  function cellOf(row, field){
    return row.querySelector('[${CELL_ATTRIBUTE}="' + field + '"]');
  }

  function put(row, field, value, className){
    var cell = cellOf(row, field);
    if (!cell) return;
    cell.textContent = value;
    if (className !== null) cell.className = className;
  }

  function score(match){
    if (match.home_score === null || match.away_score === null) return cfg.noScoreYet;
    return String(match.home_score) + '-' + String(match.away_score);
  }

  function age(instant){
    if (!instant) return cfg.lastDataNone;
    var then = Date.parse(instant);
    if (isNaN(then)) return cfg.lastDataNone;
    var n = Math.max(0, Math.floor((Date.now() - then) / 60000));
    return n < 1 ? cfg.lastDataNow : fill(cfg.lastDataMinutes, n);
  }

  // SUBSTITUTES VALUES. It never creates a row, never removes one and never
  // touches the container of the table.
  function apply(data){
    var list = (data && data.matches) || [];
    for (var i = 0; i < list.length; i++) {
      var match = list[i];
      var row = document.querySelector('[${ROW_ATTRIBUTE}="' + match.match_id + '"]');
      if (!row) continue;
      put(row, 'score', score(match), null);
      put(row, 'status', cfg.statuses[match.status] || '', 's-' + match.status);
      put(
        row,
        'qualifier',
        match.qualifier === null ? '' : cfg.qualifiers[match.qualifier] || '',
        match.qualifier === null ? '' : 'q-' + String(match.qualifier).split('_').join('-')
      );
      put(row, 'last', age(match.last_observed_at), null);
    }
  }

  function poll(){
    var headers = {};
    if (tag) headers['If-None-Match'] = tag;
    fetch(${JSON.stringify(BOARD_API_PATH)}, { headers: headers, credentials: 'omit' })
      .then(function(response){
        if (response.status === 304) { lastOk = Date.now(); sayFresh(); return null; }
        if (!response.ok) throw new Error('board');
        tag = response.headers.get('ETag') || tag;
        return response.json();
      })
      .then(function(data){
        if (data === null) return;
        apply(data);
        lastOk = Date.now();
        sayFresh();
      })
      .catch(function(){ sayStale(); });
  }

  sayFresh();
  setInterval(poll, ${REFRESH_SECONDS} * 1000);
})();`;
