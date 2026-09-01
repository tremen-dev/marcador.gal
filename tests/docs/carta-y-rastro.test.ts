/**
 * SPEC-005 CA-8 y CA-11 — los dos documentos que hablan de la cadena y que un
 * test tiene que sujetar.
 *
 * CA-8 acopla deliberadamente un test a un documento de negocio. La carta a la
 * RFGF es el único sitio fuera del código que cita el user-agent, y **ya
 * divergió una vez**: decía `medicion RN-11` mientras el código enviaba
 * `medicion SPEC-002, RN-11`. Es la mecanización de «esto no puede volver a
 * pasar», y el defecto que corrige ya ocurrió.
 *
 * Nota, para que no sorprenda después: `carta-rfgf-acceso.md` es un borrador
 * que se va a enviar. El día que se mande y se archive, este test señalará un
 * fichero histórico; entonces se cierra con una línea en el ledger o se
 * traslada al documento que la sustituya.
 *
 * CA-11 vigila el rastro en el ledger de SPEC-002. `USER_AGENT` era código
 * suyo, la spec está cerrada, y sin esa línea quien lea el ledger dentro de un
 * año creerá que el `mailto:` sigue vigente y que el código lo contradice.
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { USER_AGENT } from '@/polite/user-agent';

const LETTER = join(process.cwd(), 'docs/negocio/carta-rfgf-acceso.md');

const SPEC_002_LEDGER = join(
  process.cwd(),
  'docs/epicas/EPIC-001-spike-ingesta/SPEC-002-test-de-espejo-entre-fuentes-automaticas.ledger.md',
);

/** Las dos formas que la carta llegó a citar, y la que enviaba el código. */
const SUPERSEDED = [
  'marcador.gal/0.0.1 (+mailto:ola@tremen.dev; medicion RN-11)',
  'marcador.gal/0.0.1 (+mailto:ola@tremen.dev; medicion SPEC-002, RN-11)',
];

describe('CA-8 — la carta deja de divergir', () => {
  test('1. la carta cita la cadena `USER_AGENT` exacta, en una sola línea', async () => {
    const letter = await readFile(LETTER, 'utf8');

    // En una línea a propósito: partida por un salto, la cadena deja de ser
    // comparable y el acoplamiento que este CA busca se pierde en silencio.
    expect(letter).toContain(USER_AGENT);
  });

  test('2. y no queda rastro de ninguna de las formas viejas', async () => {
    const letter = await readFile(LETTER, 'utf8');

    expect(SUPERSEDED.filter((old) => letter.includes(old))).toEqual([]);
  });

  test('3. lo que la carta le pide a la RFGF sigue siendo lo que empareja: el token de producto', async () => {
    const letter = await readFile(LETTER, 'utf8');

    // Si alguien "mejorase" la petición pidiendo la cadena entera en su
    // robots.txt, la línea caducaría en cuanto cambiara el propósito.
    expect(letter).toContain('User-agent: marcador.gal\nAllow: /');
  });
});

describe('CA-11 — rastro en el ledger de SPEC-002', () => {
  test('4. el ledger de SPEC-002 dice que SPEC-005 cambió la constante, y cuándo', async () => {
    const ledger = await readFile(SPEC_002_LEDGER, 'utf8');

    expect(ledger).toContain('SPEC-005');
    expect(ledger).toContain(USER_AGENT);
  });

  test('5. y deja escrito que la razón registrada al cerrar F-SPEC-002-1 caducó', async () => {
    const ledger = await readFile(SPEC_002_LEDGER, 'utf8');

    // La referencia es cruzada, no una autorización: un ledger es evidencia de
    // verificación y nunca permiso para tocar código.
    const note = ledger.slice(ledger.indexOf('## Referencia cruzada'));

    expect(note).toContain('F-SPEC-002-1');
    expect(note.toLowerCase()).toContain('caduc');
    expect(note).toContain('2026-08-31');
    expect(note).toContain('mailto:');
  });
});
