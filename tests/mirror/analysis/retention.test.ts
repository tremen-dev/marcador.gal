/**
 * CA-15 (ADR-009) — el informe declara cuándo dejan de existir las capturas que
 * lo sostienen.
 *
 * El ancla es el **archivo**: `fin_de_ventana` es exactamente `window.end`, que
 * ya es el mayor `fetched_at` de las capturas archivadas — literalmente lo que
 * ADR-009 §2 llama fin de la ventana. Las otras dos fechas salen de él por
 * aritmética de milisegundos UTC (ADR-006) y **ninguna ruta consulta el reloj**:
 * un informe que mira la hora deja de ser reproducible byte a byte y rompe CA-7
 * de SPEC-002, que es lo que permite a `sdd-verificador` juzgar una ventana que
 * no presenció.
 *
 * Las fechas son **tres y no una** porque la prórroga de ADR-009 §2 puede
 * escribirse DESPUÉS de emitir el informe, y un informe no se reescribe. No se
 * predice: se declara.
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import {
  ARCHIVE_RETENTION_CEILING_DAYS,
  ARCHIVE_RETENTION_DAYS,
  SPEC_003_LEDGER,
  archiveRetention,
} from '@/mirror/analysis/referenceless/retention';
import { canonicalInstant, instantToEpochMs } from '@/mirror/instants';
import type { Instant } from '@/model/ids';

const DAY_MS = 24 * 60 * 60 * 1000;
const END = '2026-09-05T18:00:00.000Z' as Instant;

describe('CA-15 — las tres fechas salen del archivo, al milisegundo', () => {
  test('1. fin_de_ventana es exactamente el fin de la ventana que se le da', () => {
    expect(archiveRetention(END).fin_de_ventana).toBe(END);
  });

  test('2. purga_prevista y purga_maxima recomputadas a mano coinciden al milisegundo', () => {
    const block = archiveRetention(END);
    const end = instantToEpochMs(END);

    expect(block.purga_prevista).toBe(canonicalInstant(end + ARCHIVE_RETENTION_DAYS * DAY_MS));
    expect(block.purga_maxima).toBe(
      canonicalInstant(end + ARCHIVE_RETENTION_CEILING_DAYS * DAY_MS),
    );
  });

  test('3. las constantes de la política viajan en el bloque', () => {
    const block = archiveRetention(END);

    expect(block.adr).toBe('ADR-009');
    expect(block.plazo_dias).toBe(30);
    expect(block.techo_dias).toBe(90);
    expect(block.prorrogas_permitidas).toBe(1);
  });

  /**
   * La mutación que exige el CA: si alguien devolviese una constante escrita a
   * mano, retrasar la última captura un día no movería nada y este test se
   * quedaría verde. Aquí las dos fechas tienen que desplazarse exactamente un
   * día, ni más ni menos.
   */
  test('4. retrasar el fin de ventana un día desplaza las dos fechas un día exacto', () => {
    const later = canonicalInstant(instantToEpochMs(END) + DAY_MS);

    const before = archiveRetention(END);
    const after = archiveRetention(later);

    expect(instantToEpochMs(after.purga_prevista) - instantToEpochMs(before.purga_prevista)).toBe(
      DAY_MS,
    );
    expect(instantToEpochMs(after.purga_maxima) - instantToEpochMs(before.purga_maxima)).toBe(
      DAY_MS,
    );
  });

  test('5. la nota dice cómo se leen las tres fechas y dónde vive el acuse', () => {
    const { nota } = archiveRetention(END);

    expect(nota).toContain('ADR-009');
    expect(nota).toContain('prórroga');
    expect(nota).toContain('no se reescribe');
    expect(nota).toContain(SPEC_003_LEDGER);
  });

  test('6. el bloque tiene exactamente las ocho claves de CA-15, ni una más', () => {
    expect(Object.keys(archiveRetention(END)).sort()).toEqual([
      'adr',
      'fin_de_ventana',
      'nota',
      'plazo_dias',
      'prorrogas_permitidas',
      'purga_maxima',
      'purga_prevista',
      'techo_dias',
    ]);
  });
});

describe('CA-15 — el módulo que construye el bloque no puede consultar el reloj', () => {
  test('7. no menciona Date.now() ni new Date() sin argumento', async () => {
    const source = await readFile(
      join(process.cwd(), 'src/mirror/analysis/referenceless/retention.ts'),
      'utf8',
    );
    // Se quitan los comentarios, como en el caso 8 de robots.test.ts: la prosa
    // sobre el reloj no es una consulta al reloj.
    const code = source.replaceAll(/\/\*[\s\S]*?\*\//g, '').replaceAll(/\/\/.*$/gm, '');

    expect(code).not.toMatch(/Date\.now\s*\(/);
    expect(code).not.toMatch(/new\s+Date\s*\(\s*\)/);
  });
});
