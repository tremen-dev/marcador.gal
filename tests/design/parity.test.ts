/**
 * CA-10.2, CA-10.3, CA-10.4 y CA-10.5 — la paridad con `docs/diseno/`, en la
 * forma de ADR-016 (ADR-026 §3.3, §3.4 y §3.7).
 *
 * SE ENUMERA LO COPIADO Y LO QUE DIVERGE, Y SE EXIGE QUE EL RESTO SEA VACÍO.
 * Un token de `_tokens.css` que no esté **ni copiado ni declarado como
 * divergencia** es ROJO, y nadie tiene que saber que existe (ADR-016 §3.1).
 *
 * EL FICHERO DEL SISTEMA SE LEE, NUNCA SE IMPORTA. Importarlo ataría la
 * aplicación a un artefacto CONGELADO de otra épica, arrastraría su `@import`
 * de Google Fonts a producción, y `_tokens.css` no es la fuente de verdad ni
 * dentro del propio sistema: no lo usa ningún artboard (ADR-026, alternativas).
 */
import { describe, expect, test } from 'vitest';
import { readFile } from 'node:fs/promises';
import { COLORS, FAMILIES, LOADED_FACES, RADIUS, SPACE, TYPE } from '@/design/tokens';
import type { Divergence, TokenCorrespondence } from '@/design/system';
import {
  DECLARED_DIVERGENCES,
  SYSTEM_TOKENS_FILE,
  TOKEN_CORRESPONDENCE,
  correspondenceOf,
  rootBlock,
  valueOf,
} from '@/design/system';

/** Los `--nombre: valor` que `_tokens.css` declara en su `:root`. */
async function systemTokens(): Promise<ReadonlyMap<string, string>> {
  const source = await readFile(SYSTEM_TOKENS_FILE, 'utf8');
  const root = /:root\s*\{([\s\S]*?)\}/.exec(source)?.[1] ?? '';
  const found = new Map<string, string>();

  for (const [, name, raw] of root.matchAll(/(--[a-z-]+)\s*:\s*([^;]+)/g)) {
    if (name !== undefined && raw !== undefined) found.set(name, raw.trim());
  }
  return found;
}

const SYSTEM = await systemTokens();

/**
 * EL MECANISMO, UNO SOLO Y PARAMETRIZADO, para que los controles positivos
 * ejerciten ESTE MISMO predicado y no una comprobación escrita dentro del
 * caso — que fue la lección de la primera vuelta de SPEC-015 CA-5.4.
 *
 * Devuelve las ofensas: un valor que no cuadra, una fila que apunta a un token
 * que el sistema no tiene, y todo token del sistema que no esté ni copiado ni
 * declarado como divergencia.
 */
function parityOffences(
  table: readonly TokenCorrespondence[],
  divergences: readonly Divergence[],
  system: ReadonlyMap<string, string>,
  value: (code: TokenCorrespondence['code']) => string = valueOf,
): readonly string[] {
  const offences: string[] = [];

  for (const row of table) {
    if (row.system === null) continue;
    const declared = system.get(row.system);
    if (declared === undefined) {
      offences.push(`${row.emitted}: ${row.system} no existe en el sistema`);
      continue;
    }
    if (value(row.code) !== declared) {
      offences.push(`${row.emitted}: ${value(row.code)} ≠ ${declared}`);
    }
  }

  const copied = new Set(table.map((row) => row.system).filter((name) => name !== null));
  const diverged = new Set(divergences.map((entry) => entry.from));
  for (const name of system.keys()) {
    if (!copied.has(name) && !diverged.has(name)) {
      offences.push(`${name}: ni copiado ni declarado como divergencia`);
    }
  }

  return offences;
}

describe('CA-10.2 — paridad TOKEN A TOKEN contra `docs/diseno/_tokens.css`', () => {
  test('1. el fichero del sistema se lee de verdad y tiene lo que dice tener', () => {
    // Si esto fuese un mapa vacío, todo lo de abajo pasaría sin medir nada.
    expect(SYSTEM.size).toBeGreaterThan(15);
    expect(SYSTEM.get('--bg')).toBe('#111110');
    expect(SYSTEM.get('--fg-prov')).toBe('#8E8C88');
  });

  test('2. el complemento es VACÍO: valores que cuadran y ningún token huérfano', () => {
    expect(parityOffences(TOKEN_CORRESPONDENCE, DECLARED_DIVERGENCES, SYSTEM)).toEqual([]);
  });

  test('3. y cada fila lleva su motivo cuando no se explica sola (ADR-016 §3.2)', () => {
    expect(TOKEN_CORRESPONDENCE.length).toBeGreaterThan(15);
    for (const row of TOKEN_CORRESPONDENCE) {
      if (row.motive === undefined) continue;
      expect(row.motive.length, `${row.emitted}`).toBeGreaterThan(60);
    }
  });

  test('4. los tres colores SIN token del sistema entran con nombre, y están EN USO', async () => {
    const untokened = TOKEN_CORRESPONDENCE.filter((row) => row.system === null);

    expect(untokened.map((row) => row.emitted).sort()).toEqual([
      '--bg-live',
      '--bg-subtle',
      '--line-row',
    ]);
    for (const row of untokened) {
      expect((row.motive ?? '').length, `${row.emitted}`).toBeGreaterThan(60);
    }

    // Y están DE VERDAD en el artefacto, o el nombre sobra: se leen los diez
    // ficheros del sistema y se busca el valor, no el nombre.
    const { readdir } = await import('node:fs/promises');
    const design: string[] = [];
    for (const entry of await readdir('docs/diseno', { recursive: true })) {
      const path = `docs/diseno/${entry}`;
      if (!/\.(css|html|js)$/.test(path)) continue;
      design.push(await readFile(path, 'utf8'));
    }
    const artefact = design.join('\n').toLowerCase();

    for (const row of untokened) {
      expect(artefact, `${row.emitted}`).toContain(valueOf(row.code).toLowerCase());
    }
  });
});

describe('CA-10.2 — controles positivos, por mecanismo (ADR-016 §3.4)', () => {
  test('5. CAMBIAR UN VALOR SIN DECLARARLO pone rojo el mismo mecanismo', () => {
    // Se tuerce el valor del código, que es la mitad que este proyecto controla.
    const tampered = (code: TokenCorrespondence['code']): string =>
      code === 'bg' ? '#000000' : valueOf(code);

    expect(parityOffences(TOKEN_CORRESPONDENCE, DECLARED_DIVERGENCES, SYSTEM, tampered)).toEqual([
      '--bg: #000000 ≠ #111110',
    ]);
  });

  test('6. VACIAR LA TABLA de correspondencia pone rojo TODO el sistema', () => {
    const offences = parityOffences([], DECLARED_DIVERGENCES, SYSTEM);

    // Con la tabla vacía queda huérfano todo lo que no es divergencia: es el
    // control de que el conjunto vacío del caso 2 no es vacío por no mirar.
    expect(offences.length).toBe(SYSTEM.size - 1);
    expect(offences.every((offence) => offence.includes('ni copiado'))).toBe(true);
  });

  test('7. VACIAR LAS DIVERGENCIAS deja huérfano `--fg-prov`, que es el que falta', () => {
    expect(parityOffences(TOKEN_CORRESPONDENCE, [], SYSTEM)).toEqual([
      '--fg-prov: ni copiado ni declarado como divergencia',
    ]);
  });

  test('8. UN TOKEN NUEVO en el sistema, no declarado, es ROJO sin que nadie lo sepa', () => {
    const withNew = new Map(SYSTEM);
    withNew.set('--sombra', '#000000');

    expect(parityOffences(TOKEN_CORRESPONDENCE, DECLARED_DIVERGENCES, withNew)).toEqual([
      '--sombra: ni copiado ni declarado como divergencia',
    ]);
  });

  test('9. cada fila de la tabla apunta a un token que existe en `COLORS` o en `FAMILIES`', () => {
    for (const row of TOKEN_CORRESPONDENCE) {
      const known = row.code in COLORS || row.code in FAMILIES;
      expect(known, `${row.code}`).toBe(true);
      expect(correspondenceOf(row.emitted)).toBe(row);
    }

    // Y no sobra ninguno: todo token del código está en la tabla.
    const inTable = new Set(TOKEN_CORRESPONDENCE.map((row) => row.code));
    for (const code of [...Object.keys(COLORS), ...Object.keys(FAMILIES)]) {
      expect(inTable.has(code as never), `${code}`).toBe(true);
    }
  });
});

describe('CA-10.3 — las divergencias son EXACTAMENTE las tres de ADR-026 §3.4', () => {
  test('10. tres, ni una más, y cada una con su motivo', () => {
    expect(DECLARED_DIVERGENCES).toHaveLength(3);
    expect(DECLARED_DIVERGENCES.map((entry) => entry.from)).toEqual([
      '--fg-prov',
      "@import url('https://fonts.googleapis.com/css2?family=Geist…')",
      'the names of the tokens are in galego',
    ]);
    for (const entry of DECLARED_DIVERGENCES) {
      expect(entry.motive.length, `${entry.from}`).toBeGreaterThan(120);
    }
  });

  test('11. `--fg-prov` NO existe en el código, ni con ese nombre ni con su valor', () => {
    // El nombre es la contradicción hecha vocabulario: mientras exista, alguien
    // lo usará para lo que su nombre dice (ADR-026 §2.2).
    expect(Object.keys(COLORS)).not.toContain('fgProv');
    expect(Object.values(COLORS)).not.toContain(SYSTEM.get('--fg-prov'));
    expect(rootBlock()).not.toContain('prov');
  });

  test('12. los nombres emitidos están en INGLÉS: ni `marca`, ni `directo`, ni `alerta`', () => {
    const emitted = TOKEN_CORRESPONDENCE.map((row) => row.emitted).join(' ');

    for (const galego of ['marca', 'directo', 'alerta']) {
      expect(emitted, `${galego}`).not.toContain(galego);
    }
    // Y la traducción está escrita, no supuesta.
    expect(correspondenceOf('--accent-live')?.system).toBe('--directo');
    expect(correspondenceOf('--brand')?.system).toBe('--marca');
    expect(correspondenceOf('--alert')?.system).toBe('--alerta');
  });
});

describe('CA-10.4 — RESIDUO DECLARADO: la paridad solo cubre color y familia', () => {
  /**
   * DECLARADO DENTRO DEL CRITERIO (ADR-016 §6, ADR-026 §3.3): `_tokens.css` NO
   * declara espaciado, radios, escala tipográfica ni densidad — en el sistema
   * viven **en prosa** dentro de `Main.dc.html` y en hexadecimales en línea que
   * el propio sistema no respeta (huecos de 3, 5, 6, 7, 10, 14, 28; radios 7,
   * 12, 6). **Ahí la adherencia la sostiene la revisión humana, no un test.**
   * **Destino: EPIC-004**, convertir sus escalas en tokens; **disparador: el
   * deshielo.**
   */
  test('13. el sistema no tiene NI UN token de espaciado, radio, sombra o tamaño', () => {
    for (const name of SYSTEM.keys()) {
      expect(name).not.toMatch(/space|gap|radius|shadow|size|weight|duration/);
    }
  });

  test('14. las escalas del código salen de la PROSA declarada, y se adoptan enteras', async () => {
    const main = await readFile('docs/diseno/Main.dc.html', 'utf8');
    const prose = main.replaceAll(/&nbsp;/g, ' ');

    // «paso de espazo 4 px · 4 · 8 · 12 · 16 · 24 · 32 · 48. Radios 8 · 10 · 14 · 999»
    expect(prose).toContain('4 · 8 · 12 · 16 · 24 · 32 · 48');
    expect(prose).toContain('Radios 8 · 10 · 14 · 999');

    expect([...SPACE]).toEqual([4, 8, 12, 16, 24, 32, 48]);
    expect(Object.values(RADIUS)).toEqual([8, 10, 14, 999]);
  });

  test('15. y los cinco roles tipográficos son los que el sistema nombra', async () => {
    const main = await readFile('docs/diseno/Main.dc.html', 'utf8');

    // El sistema escribe el par «px / peso» al lado de cada rol.
    for (const [name, declared] of Object.entries(TYPE)) {
      expect(main, `${name}`).toContain(`${declared.px} / ${declared.weight}`);
    }
    expect(Object.keys(TYPE)).toEqual(['display', 'score', 'team', 'status', 'eyebrow']);
  });
});

describe('CA-10.5 y CA-10.6 — el artefacto no se edita, y las fuentes son nuestras', () => {
  test('16. `docs/diseno/_tokens.css` sigue con su `@import` y su `--fg-prov` intactos', async () => {
    // El artefacto NO se edita (ADR-026 §3.7): sigue siendo de EPIC-004, que
    // está congelada. Lo que se mueve, se mueve en la lista de divergencias.
    const source = await readFile(SYSTEM_TOKENS_FILE, 'utf8');

    expect(source).toContain("@import url('https://fonts.googleapis.com");
    expect(source).toContain('--fg-prov:#8E8C88');
    expect(source).toContain('--directo:#FF6B00');
  });

  test('17. y el código carga SOLO los pesos que usa, desde nuestro propio origen', () => {
    expect(LOADED_FACES).toHaveLength(5);
    for (const face of LOADED_FACES) {
      expect(face.file).toMatch(/\.woff2$/);
      expect(face.file).not.toContain('http');
    }

    // Los pesos cargados son exactamente los que los roles usados piden, más el
    // 400 del cuerpo. `display` (44/800) no se usa en el panel y su cara no se
    // carga: cargarla sería cargar un peso que nadie usa (ADR-026 §3.5).
    const weights = new Set(LOADED_FACES.map((face) => face.weight));
    expect([...weights].sort((a, b) => a - b)).toEqual([400, 500, 600]);
    expect(TYPE.display.weight).toBe(800);
  });
});
