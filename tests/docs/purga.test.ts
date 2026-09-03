/**
 * CA-3.8 — la ceremonia de purga nombra LOS DOS prefijos humanos.
 *
 * NO ES DOCUMENTACIÓN DE CORTESÍA. La purga es una ceremonia manual sin
 * ejecutor (ADR-009 §4): un prefijo que no está escrito en el runbook
 * sobrevive a su jornada **sin que ningún test se ponga rojo**, y ADR-020 §2 y
 * ADR-023 §2 se incumplen por omisión.
 *
 * Y AL ESCRIBIR ESTE SUBPUNTO SE ENCONTRÓ QUE FALTABAN LOS DOS: `corresponsal/`
 * llevaba fuera desde SPEC-015 —cero apariciones, medido el 2026-09-03— y
 * `operador/` no existía todavía. La misma línea cierra los dos, y por eso se
 * hace aquí en vez de inventariarlo: es un renglón de runbook, no un cambio de
 * comportamiento, y `docs/procedimientos/` no es artefacto de ninguna spec
 * cerrada, así que NO HAY NINGUNA ENMIENDA DE ADR-015 QUE ESCRIBIR.
 */
import { describe, expect, test } from 'vitest';
import { readFile } from 'node:fs/promises';
import { OPERATOR_ARCHIVE_PREFIX } from '@/admin/archive';
import { CORRESPONDENT_ARCHIVE_PREFIX } from '@/bot/archive';

const RUNBOOK = 'docs/procedimientos/jornada-de-medicion.md';

describe('CA-3.8 — el runbook nombra `operador/` y `corresponsal/`', () => {
  test('1. los dos prefijos aparecen, y salen de los MÓDULOS, no de una copia', async () => {
    const runbook = await readFile(RUNBOOK, 'utf8');

    expect(OPERATOR_ARCHIVE_PREFIX).toBe('operador/');
    expect(CORRESPONDENT_ARCHIVE_PREFIX).toBe('corresponsal/');

    expect(runbook).toContain(OPERATOR_ARCHIVE_PREFIX);
    expect(runbook).toContain(CORRESPONDENT_ARCHIVE_PREFIX);
  });

  test('2. y aparecen DENTRO de la ceremonia de purga, no en cualquier párrafo', async () => {
    const runbook = await readFile(RUNBOOK, 'utf8');
    const ceremony = runbook.slice(runbook.indexOf('### Purga manual con ceremonia'));

    expect(ceremony.length).toBeGreaterThan(500);
    expect(ceremony).toContain(OPERATOR_ARCHIVE_PREFIX);
    expect(ceremony).toContain(CORRESPONDENT_ARCHIVE_PREFIX);
  });

  test('3. y el guion de borrado los borra: están en la lista de prefijos', async () => {
    const runbook = await readFile(RUNBOOK, 'utf8');
    const script = runbook.slice(runbook.indexOf('#### Paso 3'), runbook.indexOf('PURGE\n```'));

    expect(script).toContain(`objects/${OPERATOR_ARCHIVE_PREFIX}`);
    expect(script).toContain(`meta/${OPERATOR_ARCHIVE_PREFIX}`);
    expect(script).toContain(`objects/${CORRESPONDENT_ARCHIVE_PREFIX}`);
    expect(script).toContain(`meta/${CORRESPONDENT_ARCHIVE_PREFIX}`);
  });

  test('4. control positivo: el mecanismo caza un prefijo que NO esté escrito', async () => {
    const runbook = await readFile(RUNBOOK, 'utf8');

    // Un prefijo inventado, que nadie ha escrito en el runbook. Si este caso
    // pasara, el mecanismo estaría midiendo el fichero entero y no el prefijo.
    expect(runbook).not.toContain('arbitro-inexistente/');
  });
});
