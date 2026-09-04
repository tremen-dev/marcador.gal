/**
 * THE ORDER OF THE ROWS, AND THE GROUPING BY COMPETITION (SPEC-018 CA-11,
 * ADR-027 §8.4).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * IT DOES NOT IMPORT `orderBoard` OR `boardRank` FROM `src/admin/board.ts`,
 * AND A CASE ASSERTS IT. The panel sorts by what needs a person — an open
 * alert, then *sen sinal*, then `live`, then the rest — BECAUSE IT IS A WORK
 * QUEUE. This is not one: it is a matchday, and it is read by somebody looking
 * for THEIR match.
 *
 * Reusing that order would have reintroduced through the back door exactly the
 * hierarchy ADR-026 §2 corrected: a screen that groups or sorts by qualifier
 * singles out the rare case and mutes the dominant one, AND IT KEEPS DOING SO
 * EVEN IF SOMEBODY CHANGES THE TOKENS AFTERWARDS. That is the real answer to
 * entry 1 of EPIC-004's inventory — «no se arregla cambiando un color: cambia
 * cuál es la fila por defecto» — and it is why the order is by competition and
 * hour and by nothing else.
 *
 * And there is a motive of use on top of the one of principle
 * (`sdd-competicion` §3): IF A MATCH RISES WHEN IT STARTS AND FALLS WHEN IT
 * ENDS, WHOEVER IS LOOKING LOSES SIGHT OF THEIRS EXACTLY WHEN THEY ARE LOOKING
 * HARDEST. The order is stable all afternoon; what changes is the content of
 * the row, never its position.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THE COMPARATOR IS WRITTEN ONCE AND IT IS THE PROJECTION'S.
 *
 * `compareBoardRows` lives in `src/api/snapshot.ts` because the JSON has to
 * come out ordered too — otherwise the `ETag` of CA-7.3 would change with the
 * order the base happened to hand rows back in — and a second implementation
 * here would be a second definition of «the order», which is the whole thing
 * this module exists to keep single. What this module owns is the SHAPE THE
 * VIEW NEEDS: the same rows, cut into competition sections.
 *
 * `src/board/` imports `src/api/` and NOTHING of `src/db/` or `src/decide/`
 * (CA-1.1): it consumes the projection, it has no privileged access to the
 * base, and a positive control asserts that adding one turns a named case red.
 */
import { compareBoardRows } from '@/api/snapshot';
import type { BoardRowPayload, BoardSnapshot } from '@/api/contract';

export { compareBoardRows };

/** One section of the screen: a competition and its matches, in order. */
export interface CompetitionSection {
  readonly competition_id: string;
  /** The canonical RFGF name, ENTIRE. Never abbreviated (CA-11.1). */
  readonly competition_name: string;
  readonly rows: readonly BoardRowPayload[];
}

/**
 * The rows of a snapshot, ordered and cut into competition sections, in the
 * order the competitions first appear once the rows are ordered.
 *
 * The input is re-sorted rather than trusted: two orderings of the same set in
 * a different input order produce the same output (CA-11.2), and asserting
 * that over this function is asserting it over what the screen serves.
 */
export function sectionsOf(snapshot: BoardSnapshot): readonly CompetitionSection[] {
  const ordered = [...snapshot.matches].sort(compareBoardRows);

  const sections: CompetitionSection[] = [];
  for (const row of ordered) {
    const current = sections[sections.length - 1];
    if (current !== undefined && current.competition_id === row.competition_id) {
      (current.rows as BoardRowPayload[]).push(row);
      continue;
    }
    sections.push({
      competition_id: row.competition_id,
      competition_name: row.competition_name,
      rows: [row],
    });
  }

  return sections;
}
