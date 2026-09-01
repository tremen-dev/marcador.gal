/**
 * SYNTHETIC fixtures with the shape of a `ceroacero.es` competition page.
 *
 * ESCRITAS A MANO, LÍNEA A LÍNEA. Nunca se versiona HTML real de terceros
 * (ADR-009 §3): git no se purga, se reescribe. La calibración de los
 * selectores se hizo mirando el HTML archivado en `raw/` —seis capturas del
 * 2026-08-31, purga prevista el 2026-09-30— y lo que viaja aquí es la FORMA,
 * con equipos y marcadores inventados.
 *
 * La forma, tal y como la escribe la fuente en la tarjeta `#fixture_games`:
 *
 *   <tr>
 *     <td>06/09</td>                                  ← día, solo en la 1.ª fila
 *     <td class="text"><a href="/equipo/…">Local</a></td>
 *     <td><a href="/equipo/…"><img …></a></td>        ← escudo, que no leemos
 *     <td id="tdl_<id>" class="vs"><a href="/partido/…">20:00</a></td>
 *     <td><a href="/equipo/…"><img …></a></td>
 *     <td class="text"><a href="/equipo/…">Visitante</a></td>
 *     <td headers="th_bet1"></td> … <td class="double right">…</td>
 *   </tr>
 *
 * SOLO LA RAMA `scheduled` ESTÁ CALIBRADA CONTRA HTML REAL. Las capturas del
 * archivo son de la víspera de la jornada 1, así que ninguna fila jugada
 * existía todavía. Lo que las otras cuatro ramas escriben en la celda `td.vs`
 * es una CONVENCIÓN declarada, no una observación (F-SPEC-008-2).
 */

export interface FixtureRow {
  readonly id: string;
  readonly slug: string;
  readonly home: string;
  readonly away: string;
  /** Lo que la fuente escribe dentro de la celda `td.vs`. */
  readonly result: string;
  /** Clases extra de la celda `td.vs`: `live` marca un partido en juego. */
  readonly cellClass?: string;
  /** Fuerza una fila rota: omite el equipo visitante. */
  readonly missingAway?: boolean;
}

function teamCell(name: string): string {
  const slug = name.toLowerCase().replaceAll(/[^a-z0-9]+/gu, '-');
  return `<td class="text"><a href="/equipo/${slug}/1?epoca_id=156">${name}</a></td>`;
}

function logoCell(name: string): string {
  return `<td><a href="/equipo/x/1"><img alt="${name}" src="/img_icon/x.png"></a></td>`;
}

function row(entry: FixtureRow): string {
  const cellClass = entry.cellClass === undefined ? 'vs' : `vs ${entry.cellClass}`;
  const parts = [
    '<td>&nbsp;</td>',
    teamCell(entry.home),
    logoCell(entry.home),
    `<td id="tdl_${entry.id}" class="${cellClass}">` +
      `<a href="/partido/${entry.slug}/${entry.id}">${entry.result}</a></td>`,
    logoCell(entry.away),
    entry.missingAway === true ? '' : teamCell(entry.away),
    '<td headers="th_bet1"></td><td headers="th_betx"></td><td headers="th_bet2"></td>',
    '<td headers="th_multimedia" class="double right"><a href="/estadisticas/x/t1-t2">FF</a></td>',
  ];
  return `<tr>${parts.join('')}</tr>`;
}

/** A whole page, with the header chrome the real one carries around the card. */
export function ceroaceroPage(rows: readonly FixtureRow[]): Uint8Array {
  const html = [
    '<!DOCTYPE html><html lang="es"><head><title>Sintético</title></head><body>',
    // El widget global de la cabecera, que NO es la tabla de la competición y
    // que un selector demasiado ancho se tragaría: lleva partidos de otras
    // ligas con marcadores de verdad.
    '<div class="zz-matchbox"><ul id="zz-matchbox-ul-agenda">',
    '<li class="game agenda live-0"><a href="/partido/otra-liga/999">',
    '<div class="tags"><span class="tag time">FT</span></div>',
    '<div class="team"><span class="title">Otra Liga A</span><span class="res">4</span></div>',
    '<div class="team"><span class="title">Otra Liga B</span><span class="res">2</span></div>',
    '</a></li></ul></div>',
    // Y una SEGUNDA tabla con la MISMA forma de fila, fuera de la tarjeta de
    // la jornada: la página real lleva varias `table.zztable.stats`. Si el
    // selector de filas se ensancha más allá de `#fixture_games`, esta se
    // cuela y el caso 1 se pone rojo.
    '<div class="card-data"><div class="card-data__body">',
    '<div id="other_games" class="box_container"><table class="zztable stats"><tbody>',
    row({
      id: '99999',
      slug: '2026-08-30-outra-competicion-a-outra-competicion-b',
      home: 'Outra Competición A',
      away: 'Outra Competición B',
      result: '5-4',
    }),
    '</tbody></table></div></div></div>',
    '<div class="card-data no-title"><div class="card-data__body">',
    '<div class="round"><h3 class="smallheader">JORNADA 1</h3></div>',
    '<div id="fixture_games" class="box_container">',
    '<table class="zztable stats"><tbody>',
    ...rows.map(row),
    '</tbody></table></div></div></div>',
    '</body></html>',
  ].join('');

  return new TextEncoder().encode(html);
}

/** Las cinco ramas del modelo, una por fila, todas legibles. */
export const FIVE_BRANCHES: readonly FixtureRow[] = [
  {
    id: '90001',
    slug: '2026-09-06-atletico-sintetico-union-ficticia',
    home: 'Atlético Sintético',
    away: 'Unión Ficticia',
    result: '20:00',
  },
  {
    id: '90002',
    slug: '2026-09-06-sd-inventada-cf-suposto',
    home: 'SD Inventada',
    away: 'CF Suposto',
    result: '2-1',
    cellClass: 'live',
  },
  {
    id: '90003',
    slug: '2026-09-06-cd-exemplo-ud-mostra',
    home: 'CD Exemplo',
    away: 'UD Mostra',
    result: '3-0',
  },
  {
    id: '90004',
    slug: '2026-09-06-club-proba-sc-figurado',
    home: 'Club Proba',
    away: 'SC Figurado',
    result: 'Aplazado',
  },
  {
    id: '90005',
    slug: '2026-09-06-ad-hipotese-cf-quimera',
    home: 'AD Hipótese',
    away: 'CF Quimera',
    result: 'Suspendido 1-1',
  },
];

/** Una fila que no se puede leer entera: le falta el equipo visitante. */
export const BROKEN_ROW: FixtureRow = {
  id: '90006',
  slug: '2026-09-06-sd-rota-sen-rival',
  home: 'SD Rota',
  away: 'Sen Rival',
  result: '1-0',
  missingAway: true,
};
