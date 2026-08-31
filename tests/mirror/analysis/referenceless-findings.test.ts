/**
 * CA-13 — el hallazgo tiene fichero propio y no puede pisar el de SPEC-002.
 *
 * Dos informes con el mismo nombre y preguntas distintas es la peor forma de
 * perder una medición irrepetible. Corriendo los dos modos quedan cuatro
 * ficheros, y el de este modo dice en su primera línea qué modo lo produjo.
 */
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { FINDINGS_JSON, FINDINGS_MARKDOWN } from '@/mirror/analysis/findings';
import {
  REFERENCELESS_FINDINGS_JSON,
  REFERENCELESS_FINDINGS_MARKDOWN,
  renderReferencelessFindings,
  writeReferencelessFindings,
} from '@/mirror/analysis/referenceless/findings';
import { padding } from '../support/plans';
import { analyseReferenceless, candidatesPlan } from '../support/referenceless';

const MIRRORED = () => candidatesPlan(padding(6), padding(6));

describe('CA-13 — fichero propio para el modo sin referencia', () => {
  test('1. vive donde CA-13 dice, y no donde vive el de SPEC-002', () => {
    expect(REFERENCELESS_FINDINGS_MARKDOWN).toBe(
      'docs/epicas/EPIC-001-spike-ingesta/hallazgos/test-de-espejo-sin-referencia.md',
    );
    expect(REFERENCELESS_FINDINGS_JSON).toBe(
      'docs/epicas/EPIC-001-spike-ingesta/hallazgos/test-de-espejo-sin-referencia.json',
    );
    expect(REFERENCELESS_FINDINGS_MARKDOWN).not.toBe(FINDINGS_MARKDOWN);
    expect(REFERENCELESS_FINDINGS_JSON).not.toBe(FINDINGS_JSON);
  });

  test('2. el generador escribe exactamente esos dos ficheros', async () => {
    const { report } = await analyseReferenceless(MIRRORED());
    const root = await mkdtemp(join(tmpdir(), 'mirror-sr-'));

    const written = await writeReferencelessFindings(report, root);

    expect(written.markdown).toBe(join(root, REFERENCELESS_FINDINGS_MARKDOWN));
    expect(written.json).toBe(join(root, REFERENCELESS_FINDINGS_JSON));
    expect(await readFile(written.markdown, 'utf8')).not.toBe('');
    expect(JSON.parse(await readFile(written.json, 'utf8'))).toEqual(report);
  });

  test('3. los ficheros de SPEC-002 quedan intactos byte a byte', async () => {
    const { report } = await analyseReferenceless(MIRRORED());
    const root = await mkdtemp(join(tmpdir(), 'mirror-sr-'));

    const previousMarkdown = '# Hallazgo — Test de espejo entre fuentes automáticas (SPEC-002)\n';
    const previousJson = '{"spec":"SPEC-002"}\n';
    await mkdir(dirname(join(root, FINDINGS_MARKDOWN)), { recursive: true });
    await writeFile(join(root, FINDINGS_MARKDOWN), previousMarkdown, 'utf8');
    await writeFile(join(root, FINDINGS_JSON), previousJson, 'utf8');

    await writeReferencelessFindings(report, root);

    expect(await readFile(join(root, FINDINGS_MARKDOWN), 'utf8')).toBe(previousMarkdown);
    expect(await readFile(join(root, FINDINGS_JSON), 'utf8')).toBe(previousJson);
  });

  test('4. el .md dice en su primera línea qué modo lo produjo', async () => {
    const { report } = await analyseReferenceless(MIRRORED());

    const [firstLine] = renderReferencelessFindings(report).split('\n');
    expect(firstLine).toContain('sin-referencia');
    expect(firstLine).toContain('SPEC-003');
  });

  test('5. el .json lleva el modo, y `referencia` en null', async () => {
    const { report } = await analyseReferenceless(MIRRORED());
    const root = await mkdtemp(join(tmpdir(), 'mirror-sr-'));

    await writeReferencelessFindings(report, root);
    const written = JSON.parse(
      await readFile(join(root, REFERENCELESS_FINDINGS_JSON), 'utf8'),
    ) as { modo: string; referencia: unknown };

    expect(written.modo).toBe('sin-referencia');
    expect(written.referencia).toBeNull();
  });

  test('6. el documento lleva el veredicto, la bandera, las limitaciones y la retención', async () => {
    const { report } = await analyseReferenceless(MIRRORED());
    const document = renderReferencelessFindings(report);

    expect(document).toContain(report.pair.verdict);
    expect(document).toContain('rn02_segunda_via_entre_automaticas');
    expect(document).toContain('no_medidos');
    expect(document).toContain('ADR-009');
    expect(document).toContain(report.retencion_del_archivo.purga_maxima);
    for (const limit of report.limitaciones_declaradas) {
      expect(document).toContain(limit.texto);
    }
  });

  test('7. avisa de que está generado, y es tan determinista como el JSON', async () => {
    const first = await analyseReferenceless(MIRRORED());
    const second = await analyseReferenceless(MIRRORED());

    expect(renderReferencelessFindings(first.report)).toContain('generado');
    expect(renderReferencelessFindings(second.report)).toBe(
      renderReferencelessFindings(first.report),
    );
  });
});
